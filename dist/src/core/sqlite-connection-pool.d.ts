/**
 * SQLite Connection Pool Manager
 *
 * Provides connection pooling, auto-reconnect, and graceful degradation
 * for SQLite database connections with tier-based limits
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { SQLiteDatabase, SQLiteImplementation } from "../memory/sqlite-adapter.js";
export interface ConnectionPoolConfig {
    minConnections?: number;
    maxConnections?: number;
    connectionTimeout?: number;
    idleTimeout?: number;
    acquireTimeout?: number;
    evictionInterval?: number;
    retryAttempts?: number;
    retryDelay?: number;
    preferredImplementation?: SQLiteImplementation;
    enableWAL?: boolean;
    userTier?: "free" | "pro" | "enterprise";
}
export interface PooledConnection {
    id: string;
    database: SQLiteDatabase;
    inUse: boolean;
    lastUsed: number;
    createdAt: number;
    errorCount: number;
}
export interface PoolStats {
    totalConnections: number;
    activeConnections: number;
    idleConnections: number;
    waitingRequests: number;
    implementation: SQLiteImplementation;
    avgWaitTime: number;
    connectionErrors: number;
}
export declare class SQLiteConnectionPool extends EventEmitter {
    private logger;
    private config;
    private connections;
    private waitQueue;
    private implementation?;
    private dbPath;
    private isShuttingDown;
    private evictionTimer?;
    private waitTimes;
    private connectionErrors;
    constructor(dbPath: string, config?: ConnectionPoolConfig);
    /**
     * Initialize the connection pool
     */
    initialize(): Promise<void>;
    /**
     * Acquire a connection from the pool
     */
    acquire(): Promise<SQLiteDatabase>;
    /**
     * Release a connection back to the pool
     */
    release(database: SQLiteDatabase): void;
    /**
     * Create a new connection with retry logic
     */
    private createConnection;
    /**
     * Get an idle connection from the pool
     */
    private getIdleConnection;
    /**
     * Check if a connection is stale
     */
    private isConnectionStale;
    /**
     * Find connection by database instance
     */
    private findConnectionByDatabase;
    /**
     * Evict stale connections
     */
    private evictStaleConnections;
    /**
     * Start eviction timer
     */
    private startEvictionTimer;
    /**
     * Record wait time for statistics
     */
    private recordWaitTime;
    /**
     * Get pool statistics
     */
    getStats(): PoolStats;
    /**
     * Execute a function with auto-reconnect
     */
    execute<T>(fn: (db: SQLiteDatabase) => T | Promise<T>): Promise<T>;
    /**
     * Check if an error is a connection error
     */
    private isConnectionError;
    /**
     * Delay helper
     */
    private delay;
    /**
     * Shutdown the connection pool
     */
    shutdown(): Promise<void>;
}
//# sourceMappingURL=sqlite-connection-pool.d.ts.map