/**
 * SQLite Implementation Detector
 *
 * Detects available SQLite implementations and selects optimal fallback
 * Supports: better-sqlite3 → sqlite3 → sql.js WASM fallback
 */
import { Logger } from "../utils/logger.js";
export class SQLiteDetector {
    logger;
    detectedCapabilities;
    constructor() {
        this.logger = new Logger("SQLiteDetector");
    }
    /**
     * Detect best available SQLite implementation
     */
    async detectBestImplementation() {
        if (this.detectedCapabilities) {
            return this.detectedCapabilities;
        }
        this.logger.info("🔍 Detecting SQLite implementations...");
        // Try better-sqlite3 first (highest performance)
        const betterSqlite = await this.testBetterSQLite3();
        if (betterSqlite.available) {
            this.detectedCapabilities = {
                implementation: "better-sqlite3",
                performance: "high",
                crossPlatform: false,
                wasmSupport: false,
                nativeCompilation: true,
                initTime: betterSqlite.initTime,
            };
            this.logger.info("✅ better-sqlite3 available (high performance)");
            return this.detectedCapabilities;
        }
        // Try sqlite3 fallback (medium performance)
        const sqlite3 = await this.testSQLite3();
        if (sqlite3.available) {
            this.detectedCapabilities = {
                implementation: "sqlite3",
                performance: "medium",
                crossPlatform: false,
                wasmSupport: false,
                nativeCompilation: true,
                initTime: sqlite3.initTime,
            };
            this.logger.info("✅ sqlite3 available (medium performance)");
            return this.detectedCapabilities;
        }
        // Try sql.js WASM fallback (universal compatibility)
        const sqljs = await this.testSQLJS();
        if (sqljs.available) {
            this.detectedCapabilities = {
                implementation: "sql.js",
                performance: "low",
                crossPlatform: true,
                wasmSupport: true,
                nativeCompilation: false,
                initTime: sqljs.initTime,
            };
            this.logger.info("✅ sql.js WASM available (universal compatibility)");
            return this.detectedCapabilities;
        }
        // No SQLite implementation available
        this.logger.error("❌ No SQLite implementation available");
        this.detectedCapabilities = {
            implementation: "none",
            performance: "low",
            crossPlatform: false,
            wasmSupport: false,
            nativeCompilation: false,
            initTime: 0,
        };
        return this.detectedCapabilities;
    }
    /**
     * Test better-sqlite3 availability
     */
    async testBetterSQLite3() {
        const startTime = Date.now();
        try {
            // @ts-ignore - Optional dependency
            const Database = await import("better-sqlite3");
            const db = new Database.default(":memory:");
            // Test basic functionality
            db.exec("CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)");
            const stmt = db.prepare("INSERT INTO test (name) VALUES (?)");
            stmt.run("test");
            const result = db
                .prepare("SELECT * FROM test WHERE name = ?")
                .get("test");
            db.close();
            if (result && result.name === "test") {
                return { available: true, initTime: Date.now() - startTime };
            }
        }
        catch (error) {
            this.logger.debug(`better-sqlite3 not available: ${error.message}`);
        }
        return { available: false, initTime: 0 };
    }
    /**
     * Test sqlite3 availability
     */
    async testSQLite3() {
        const startTime = Date.now();
        try {
            // @ts-ignore - Optional dependency
            const sqlite3 = await import("sqlite3");
            const Database = sqlite3.default.Database;
            return new Promise((resolve) => {
                const db = new Database(":memory:", (err) => {
                    if (err) {
                        resolve({ available: false, initTime: 0 });
                        return;
                    }
                    // Test basic functionality
                    db.run("CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)", (err) => {
                        if (err) {
                            resolve({ available: false, initTime: 0 });
                            return;
                        }
                        db.run("INSERT INTO test (name) VALUES (?)", ["test"], (err) => {
                            if (err) {
                                resolve({ available: false, initTime: 0 });
                                return;
                            }
                            db.get("SELECT * FROM test WHERE name = ?", ["test"], (err, row) => {
                                db.close();
                                if (err || !row || row.name !== "test") {
                                    resolve({ available: false, initTime: 0 });
                                }
                                else {
                                    resolve({
                                        available: true,
                                        initTime: Date.now() - startTime,
                                    });
                                }
                            });
                        });
                    });
                });
            });
        }
        catch (error) {
            this.logger.debug(`sqlite3 not available: ${error.message}`);
            return { available: false, initTime: 0 };
        }
    }
    /**
     * Test sql.js WASM availability
     */
    async testSQLJS() {
        const startTime = Date.now();
        try {
            // @ts-ignore - Optional dependency
            const initSqlJs = await import("sql.js");
            const SQL = await initSqlJs.default();
            // Test basic functionality
            const db = new SQL.Database();
            db.run("CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)");
            db.run("INSERT INTO test (name) VALUES (?)", ["test"]);
            const stmt = db.prepare("SELECT * FROM test WHERE name = ?");
            const result = stmt.getAsObject({ ":1": "test" });
            db.close();
            if (result && result.name === "test") {
                return { available: true, initTime: Date.now() - startTime };
            }
        }
        catch (error) {
            this.logger.debug(`sql.js not available: ${error.message}`);
        }
        return { available: false, initTime: 0 };
    }
    /**
     * Get current capabilities (cached result)
     */
    getCurrentCapabilities() {
        return this.detectedCapabilities || null;
    }
    /**
     * Force re-detection (clear cache)
     */
    clearCache() {
        this.detectedCapabilities = undefined;
        this.logger.debug("SQLite detection cache cleared");
    }
}
//# sourceMappingURL=sqlite-detector.js.map