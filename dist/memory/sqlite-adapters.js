/**
 * SQLite Adapter Implementations
 *
 * Provides unified interface for better-sqlite3, sqlite3, and sql.js
 * with graceful fallback and consistent API
 */
import { Logger } from "../utils/logger.js";
/**
 * Better-SQLite3 Adapter (Highest Performance)
 */
export class BetterSQLite3Adapter {
    db;
    logger;
    _isOpen = false;
    constructor() {
        this.logger = new Logger("BetterSQLite3Adapter");
    }
    async init(dbPath) {
        try {
            // @ts-ignore - Optional dependency
            const Database = await import("better-sqlite3");
            this.db = new Database.default(dbPath);
            this.db.pragma("journal_mode = WAL");
            this.db.pragma("synchronous = NORMAL");
            this._isOpen = true;
            this.logger.info(`✅ better-sqlite3 initialized: ${dbPath}`);
        }
        catch (error) {
            this.logger.error(`❌ better-sqlite3 initialization failed: ${error.message}`);
            throw error;
        }
    }
    exec(sql) {
        if (!this._isOpen)
            throw new Error("Database not initialized");
        this.db.exec(sql);
    }
    prepare(sql) {
        if (!this._isOpen)
            throw new Error("Database not initialized");
        const stmt = this.db.prepare(sql);
        return {
            run: (...params) => {
                const result = stmt.run(...params);
                return {
                    changes: result.changes,
                    lastInsertRowid: typeof result.lastInsertRowid === "bigint"
                        ? Number(result.lastInsertRowid)
                        : result.lastInsertRowid,
                };
            },
            get: (...params) => stmt.get(...params),
            all: (...params) => stmt.all(...params),
        };
    }
    async close() {
        if (this.db && this._isOpen) {
            this.db.close();
            this._isOpen = false;
            this.logger.info("better-sqlite3 database closed");
        }
    }
    isOpen() {
        return this._isOpen;
    }
    getImplementation() {
        return "better-sqlite3";
    }
}
/**
 * SQLite3 Adapter (Promise-wrapped, Medium Performance)
 */
export class SQLite3Adapter {
    db;
    logger;
    _isOpen = false;
    constructor() {
        this.logger = new Logger("SQLite3Adapter");
    }
    async init(dbPath) {
        try {
            // @ts-ignore - Optional dependency
            const sqlite3 = await import("sqlite3");
            const Database = sqlite3.default.Database;
            this.db = await new Promise((resolve, reject) => {
                const db = new Database(dbPath, (err) => {
                    if (err)
                        reject(err);
                    else
                        resolve(db);
                });
            });
            // Enable WAL mode for better concurrency
            await this.execAsync("PRAGMA journal_mode = WAL");
            await this.execAsync("PRAGMA synchronous = NORMAL");
            this._isOpen = true;
            this.logger.info(`✅ sqlite3 initialized: ${dbPath}`);
        }
        catch (error) {
            this.logger.error(`❌ sqlite3 initialization failed: ${error.message}`);
            throw error;
        }
    }
    exec(sql) {
        if (!this._isOpen)
            throw new Error("Database not initialized");
        this.db.exec(sql);
    }
    prepare(sql) {
        if (!this._isOpen)
            throw new Error("Database not initialized");
        return {
            run: (...params) => {
                return new Promise((resolve, reject) => {
                    this.db.run(sql, params, function (err) {
                        if (err)
                            reject(err);
                        else
                            resolve({
                                changes: this.changes,
                                lastInsertRowid: typeof this.lastID === "bigint"
                                    ? Number(this.lastID)
                                    : this.lastID,
                            });
                    });
                });
            },
            get: (...params) => {
                return new Promise((resolve, reject) => {
                    this.db.get(sql, params, (err, row) => {
                        if (err)
                            reject(err);
                        else
                            resolve(row);
                    });
                });
            },
            all: (...params) => {
                return new Promise((resolve, reject) => {
                    this.db.all(sql, params, (err, rows) => {
                        if (err)
                            reject(err);
                        else
                            resolve(rows);
                    });
                });
            },
        };
    }
    async close() {
        if (this.db && this._isOpen) {
            await new Promise((resolve, reject) => {
                this.db.close((err) => {
                    if (err)
                        reject(err);
                    else
                        resolve();
                });
            });
            this._isOpen = false;
            this.logger.info("sqlite3 database closed");
        }
    }
    isOpen() {
        return this._isOpen;
    }
    getImplementation() {
        return "sqlite3";
    }
    async execAsync(sql) {
        return new Promise((resolve, reject) => {
            this.db.exec(sql, (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    }
}
/**
 * SQL.js WASM Adapter (Universal Compatibility)
 */
export class SQLJSAdapter {
    db;
    SQL;
    logger;
    _isOpen = false;
    dbPath = "";
    constructor() {
        this.logger = new Logger("SQLJSAdapter");
    }
    async init(dbPath) {
        try {
            // @ts-ignore - Optional dependency
            const initSqlJs = await import("sql.js");
            this.SQL = await initSqlJs.default();
            this.dbPath = dbPath;
            // Try to load existing database file
            let data;
            if (dbPath !== ":memory:") {
                try {
                    const fs = await import("fs/promises");
                    const buffer = await fs.readFile(dbPath);
                    data = new Uint8Array(buffer);
                }
                catch (err) {
                    // File doesn't exist, start with empty database
                    this.logger.debug(`Creating new database file: ${dbPath}`);
                }
            }
            this.db = new this.SQL.Database(data);
            this._isOpen = true;
            this.logger.info(`✅ sql.js WASM initialized: ${dbPath}`);
        }
        catch (error) {
            this.logger.error(`❌ sql.js initialization failed: ${error.message}`);
            throw error;
        }
    }
    exec(sql) {
        if (!this._isOpen)
            throw new Error("Database not initialized");
        this.db.run(sql);
    }
    prepare(sql) {
        if (!this._isOpen)
            throw new Error("Database not initialized");
        return {
            run: (...params) => {
                const stmt = this.db.prepare(sql);
                stmt.run(params);
                stmt.free();
                return {
                    changes: this.db.getRowsModified(),
                    lastInsertRowid: undefined,
                };
            },
            get: (...params) => {
                const stmt = this.db.prepare(sql);
                const result = stmt.getAsObject(params);
                return result[0] || null;
            },
            all: (...params) => {
                const stmt = this.db.prepare(sql);
                const results = [];
                while (stmt.step()) {
                    results.push(stmt.getAsObject());
                }
                stmt.free();
                return results;
            },
        };
    }
    async close() {
        if (this.db && this._isOpen) {
            // Save database to file if not in-memory
            if (this.dbPath !== ":memory:") {
                try {
                    const data = this.db.export();
                    const fs = await import("fs/promises");
                    await fs.writeFile(this.dbPath, data);
                    this.logger.debug(`Database saved to: ${this.dbPath}`);
                }
                catch (err) {
                    this.logger.warn(`Failed to save database: ${err.message}`);
                }
            }
            this.db.close();
            this._isOpen = false;
            this.logger.info("sql.js database closed");
        }
    }
    isOpen() {
        return this._isOpen;
    }
    getImplementation() {
        return "sql.js";
    }
}
