/**
 * SQLite Adapter Implementations
 *
 * Provides unified interface for better-sqlite3, sqlite3, and sql.js
 * with graceful fallback and consistent API
 */
export interface DatabaseAdapter {
    init(dbPath: string): Promise<void>;
    exec(sql: string): void;
    prepare(sql: string): PreparedStatement;
    close(): Promise<void>;
    isOpen(): boolean;
    getImplementation(): string;
}
export interface PreparedStatement {
    run(...params: any[]): {
        changes: number;
        lastInsertRowid?: number | bigint;
    } | Promise<{
        changes: number;
        lastInsertRowid?: number | bigint;
    }>;
    get(...params: any[]): any | Promise<any>;
    all(...params: any[]): any[] | Promise<any[]>;
}
/**
 * Better-SQLite3 Adapter (Highest Performance)
 */
export declare class BetterSQLite3Adapter implements DatabaseAdapter {
    private db;
    private logger;
    private _isOpen;
    constructor();
    init(dbPath: string): Promise<void>;
    exec(sql: string): void;
    prepare(sql: string): PreparedStatement;
    close(): Promise<void>;
    isOpen(): boolean;
    getImplementation(): string;
}
/**
 * SQLite3 Adapter (Promise-wrapped, Medium Performance)
 */
export declare class SQLite3Adapter implements DatabaseAdapter {
    private db;
    private logger;
    private _isOpen;
    constructor();
    init(dbPath: string): Promise<void>;
    exec(sql: string): void;
    prepare(sql: string): PreparedStatement;
    close(): Promise<void>;
    isOpen(): boolean;
    getImplementation(): string;
    private execAsync;
}
/**
 * SQL.js WASM Adapter (Universal Compatibility)
 */
export declare class SQLJSAdapter implements DatabaseAdapter {
    private db;
    private SQL;
    private logger;
    private _isOpen;
    private dbPath;
    constructor();
    init(dbPath: string): Promise<void>;
    exec(sql: string): void;
    prepare(sql: string): PreparedStatement;
    close(): Promise<void>;
    isOpen(): boolean;
    getImplementation(): string;
}
//# sourceMappingURL=sqlite-adapters.d.ts.map