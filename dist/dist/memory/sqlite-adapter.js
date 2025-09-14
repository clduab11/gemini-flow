/**
 * SQLite Database Adapter Interface
 *
 * Provides a unified interface for different SQLite implementations:
 * - better-sqlite3 (performance optimized)
 * - sqlite3 (Node.js compatible)
 * - sql.js (WASM cross-platform)
 */
/**
 * Detects available SQLite implementations and returns fallback hierarchy
 */
export async function detectSQLiteImplementations() {
    const result = {
        available: [],
        recommended: "sql.js", // Default fallback
        errors: {},
    };
    // Test better-sqlite3 (highest performance)
    try {
        // @ts-ignore - Optional dependency
        const betterSqlite3Module = await import("better-sqlite3");
        const BetterSqlite3 = betterSqlite3Module.default;
        // Test basic functionality
        const testDb = new BetterSqlite3(":memory:");
        testDb.exec("CREATE TABLE test (id INTEGER)");
        testDb.close();
        result.available.push("better-sqlite3");
        result.recommended = "better-sqlite3";
    }
    catch (error) {
        result.errors["better-sqlite3"] = error;
    }
    // Test sqlite3 (Node.js standard)
    try {
        // @ts-ignore - Optional dependency
        await import("sqlite3");
        result.available.push("sqlite3");
        if (result.recommended === "sql.js") {
            result.recommended = "sqlite3";
        }
    }
    catch (error) {
        result.errors["sqlite3"] = error;
    }
    // Test sql.js (always available WASM)
    try {
        // @ts-ignore - Optional dependency
        await import("sql.js");
        result.available.push("sql.js");
    }
    catch (error) {
        result.errors["sql.js"] = error;
    }
    return result;
}
/**
 * Creates a database instance using the best available implementation
 */
export async function createSQLiteDatabase(dbPath, preferredImpl) {
    const detection = await detectSQLiteImplementations();
    if (detection.available.length === 0) {
        throw new Error("No SQLite implementations available. Please install better-sqlite3, sqlite3, or sql.js");
    }
    const implementation = preferredImpl && detection.available.includes(preferredImpl)
        ? preferredImpl
        : detection.recommended;
    switch (implementation) {
        case "better-sqlite3":
            return await createBetterSQLite3Database(dbPath);
        case "sqlite3":
            return await createSQLite3Database(dbPath);
        case "sql.js":
            return await createSqlJsDatabase(dbPath);
        default:
            throw new Error(`Unsupported SQLite implementation: ${implementation}`);
    }
}
/**
 * Better-SQLite3 adapter implementation
 */
async function createBetterSQLite3Database(dbPath) {
    // @ts-ignore - Optional dependency
    const betterSqlite3Module = await import("better-sqlite3");
    const BetterSqlite3 = betterSqlite3Module.default;
    const db = new BetterSqlite3(dbPath);
    return {
        name: "better-sqlite3",
        open: db.open,
        prepare(sql) {
            const stmt = db.prepare(sql);
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
        },
        exec(sql) {
            db.exec(sql);
        },
        pragma(pragma) {
            return db.pragma(pragma);
        },
        close() {
            db.close();
        },
    };
}
/**
 * SQLite3 adapter implementation
 */
async function createSQLite3Database(dbPath) {
    // @ts-ignore - Optional dependency
    const sqlite3Module = await import("sqlite3");
    const sqlite3 = sqlite3Module.default;
    const db = new sqlite3.Database(dbPath);
    return {
        name: "sqlite3",
        open: true,
        prepare(sql) {
            return {
                run: (...params) => {
                    return new Promise((resolve, reject) => {
                        db.run(sql, params, function (err) {
                            if (err)
                                reject(err);
                            else
                                resolve({
                                    changes: this.changes,
                                    lastInsertRowid: this.lastID,
                                });
                        });
                    });
                },
                get: (...params) => {
                    return new Promise((resolve, reject) => {
                        db.get(sql, params, (err, row) => {
                            if (err)
                                reject(err);
                            else
                                resolve(row);
                        });
                    });
                },
                all: (...params) => {
                    return new Promise((resolve, reject) => {
                        db.all(sql, params, (err, rows) => {
                            if (err)
                                reject(err);
                            else
                                resolve(rows);
                        });
                    });
                },
            };
        },
        exec(sql) {
            db.exec(sql);
        },
        pragma(pragma) {
            // SQLite3 doesn't support pragma directly, implement as exec
            db.exec(`PRAGMA ${pragma}`);
            return null;
        },
        close() {
            db.close();
        },
    };
}
/**
 * SQL.js WASM adapter implementation
 */
async function createSqlJsDatabase(dbPath) {
    // @ts-ignore - Optional dependency
    const sqlJsModule = await import("sql.js");
    const initSqlJs = sqlJsModule.default;
    const fs = await import("fs");
    const path = await import("path");
    const SQL = await initSqlJs();
    // Load existing database or create new one
    let dbData;
    try {
        if (dbPath !== ":memory:" && fs.existsSync(dbPath)) {
            dbData = fs.readFileSync(dbPath);
        }
    }
    catch (error) {
        // Ignore file read errors, will create new database
    }
    const db = new SQL.Database(dbData);
    // Auto-save functionality for persistent storage
    let saveTimer = null;
    const scheduleSync = () => {
        if (saveTimer)
            clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
            if (dbPath !== ":memory:") {
                try {
                    const dir = path.dirname(dbPath);
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir, { recursive: true });
                    }
                    const data = db.export();
                    fs.writeFileSync(dbPath, data);
                }
                catch (error) {
                    console.warn("Failed to save SQLite database:", error);
                }
            }
        }, 1000);
    };
    return {
        name: "sql.js",
        open: true,
        prepare(sql) {
            return {
                run: (...params) => {
                    try {
                        const stmt = db.prepare(sql);
                        if (params.length > 0) {
                            stmt.bind(params);
                        }
                        stmt.step();
                        const changes = db.getRowsModified();
                        stmt.free();
                        scheduleSync();
                        return {
                            changes,
                            lastInsertRowid: undefined, // SQL.js doesn't provide this easily
                        };
                    }
                    catch (error) {
                        throw error;
                    }
                },
                get: (...params) => {
                    try {
                        const stmt = db.prepare(sql);
                        if (params.length > 0) {
                            stmt.bind(params);
                        }
                        const hasRow = stmt.step();
                        const results = hasRow ? stmt.getAsObject() : {};
                        stmt.free();
                        return Object.keys(results).length > 0 ? results : undefined;
                    }
                    catch (error) {
                        throw error;
                    }
                },
                all: (...params) => {
                    try {
                        const stmt = db.prepare(sql);
                        const results = [];
                        if (params.length > 0) {
                            stmt.bind(params);
                        }
                        while (stmt.step()) {
                            results.push(stmt.getAsObject());
                        }
                        stmt.free();
                        return results;
                    }
                    catch (error) {
                        throw error;
                    }
                },
            };
        },
        exec(sql) {
            db.exec(sql);
            scheduleSync();
        },
        pragma(pragma) {
            // Execute pragma as regular SQL
            db.exec(`PRAGMA ${pragma}`);
            scheduleSync();
            return null;
        },
        close() {
            if (saveTimer) {
                clearTimeout(saveTimer);
            }
            // Final sync before closing
            if (dbPath !== ":memory:") {
                try {
                    const dir = path.dirname(dbPath);
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir, { recursive: true });
                    }
                    const data = db.export();
                    fs.writeFileSync(dbPath, data);
                }
                catch (error) {
                    console.warn("Failed to save SQLite database on close:", error);
                }
            }
            db.close();
        },
    };
}
//# sourceMappingURL=sqlite-adapter.js.map