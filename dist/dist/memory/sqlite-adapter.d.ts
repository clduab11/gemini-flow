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
export function detectSQLiteImplementations(): Promise<{
    available: never[];
    recommended: string;
    errors: {};
}>;
/**
 * Creates a database instance using the best available implementation
 */
export function createSQLiteDatabase(dbPath: any, preferredImpl: any): Promise<{
    name: string;
    open: any;
    prepare(sql: any): {
        run: (...params: any[]) => {
            changes: any;
            lastInsertRowid: any;
        };
        get: (...params: any[]) => any;
        all: (...params: any[]) => any;
    };
    exec(sql: any): void;
    pragma(pragma: any): any;
    close(): void;
} | {
    name: string;
    open: boolean;
    prepare(sql: any): {
        run: (...params: any[]) => Promise<any>;
        get: (...params: any[]) => Promise<any>;
        all: (...params: any[]) => Promise<any>;
    };
    exec(sql: any): void;
    pragma(pragma: any): null;
    close(): void;
}>;
//# sourceMappingURL=sqlite-adapter.d.ts.map