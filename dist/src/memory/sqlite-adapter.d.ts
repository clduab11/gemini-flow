/**
 * SQLite Database Adapter Interface
 *
 * Provides a unified interface for different SQLite implementations:
 * - better-sqlite3 (performance optimized)
 * - sqlite3 (Node.js compatible)
 * - sql.js (WASM cross-platform)
 */
export interface SQLiteRow {
    [key: string]: any;
}
export interface SQLiteResult {
    changes?: number;
    lastInsertRowid?: number | bigint;
}
export interface SQLiteStatement {
    run(...params: any[]): SQLiteResult | Promise<SQLiteResult>;
    get(...params: any[]): SQLiteRow | undefined | Promise<SQLiteRow | undefined>;
    all(...params: any[]): SQLiteRow[] | Promise<SQLiteRow[]>;
}
export interface SQLiteDatabase {
    prepare(sql: string): SQLiteStatement;
    exec(sql: string): void;
    pragma(pragma: string): any;
    close(): void;
    readonly name: string;
    readonly open: boolean;
}
export type SQLiteImplementation = "better-sqlite3" | "sqlite3" | "sql.js";
export interface SQLiteDetectionResult {
    available: SQLiteImplementation[];
    recommended: SQLiteImplementation;
    errors: Record<string, Error>;
}
/**
 * Detects available SQLite implementations and returns fallback hierarchy
 */
export declare function detectSQLiteImplementations(): Promise<SQLiteDetectionResult>;
/**
 * Creates a database instance using the best available implementation
 */
export declare function createSQLiteDatabase(dbPath: string, preferredImpl?: SQLiteImplementation): Promise<SQLiteDatabase>;
//# sourceMappingURL=sqlite-adapter.d.ts.map