/**
 * SQLite Implementation Detector
 *
 * Detects available SQLite implementations and selects optimal fallback
 * Supports: better-sqlite3 → sqlite3 → sql.js WASM fallback
 */
export type SQLiteImplementation = "better-sqlite3" | "sqlite3" | "sql.js" | "none";
export interface SQLiteCapabilities {
    implementation: SQLiteImplementation;
    performance: "high" | "medium" | "low";
    crossPlatform: boolean;
    wasmSupport: boolean;
    nativeCompilation: boolean;
    initTime: number;
}
export declare class SQLiteDetector {
    private logger;
    private detectedCapabilities?;
    constructor();
    /**
     * Detect best available SQLite implementation
     */
    detectBestImplementation(): Promise<SQLiteCapabilities>;
    /**
     * Test better-sqlite3 availability
     */
    private testBetterSQLite3;
    /**
     * Test sqlite3 availability
     */
    private testSQLite3;
    /**
     * Test sql.js WASM availability
     */
    private testSQLJS;
    /**
     * Get current capabilities (cached result)
     */
    getCurrentCapabilities(): SQLiteCapabilities | null;
    /**
     * Force re-detection (clear cache)
     */
    clearCache(): void;
}
//# sourceMappingURL=sqlite-detector.d.ts.map