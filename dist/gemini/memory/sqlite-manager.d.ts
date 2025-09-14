/**
 * SQLite Memory Manager with Fallback Support
 *
 * Implements 12 specialized tables for persistent memory coordination
 * across agent swarms with optimized performance and cross-platform compatibility
 *
 * Fallback hierarchy:
 * 1. better-sqlite3 (performance optimized)
 * 2. sqlite3 (Node.js compatible)
 * 3. sql.js (WASM cross-platform)
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { SQLiteImplementation } from "./sqlite-adapter.js";
export interface MemoryEntry {
    id?: number;
    key: string;
    value: any;
    namespace: string;
    metadata?: any;
    ttl?: number;
    created_at?: number;
    updated_at?: number;
    access_count?: number;
}
export interface NamespaceInfo {
    namespace: string;
    keyCount: number;
    totalSize: number;
    lastAccessed: number;
    created: number;
}
export interface NamespaceOperations {
    store(entry: MemoryEntry): Promise<void>;
    retrieve(key: string, namespace?: string): Promise<any>;
    delete(key: string, namespace?: string): Promise<boolean>;
    search(pattern: string, namespace?: string, options?: SearchOptions): Promise<MemoryEntry[]>;
    list(namespace?: string, includeMetadata?: boolean): Promise<MemoryEntry[]>;
    cleanup(namespace?: string): Promise<number>;
    getNamespaceInfo(namespace?: string): Promise<NamespaceInfo[]>;
    deleteNamespace(namespace: string): Promise<number>;
}
export interface SearchOptions {
    limit?: number;
    sortBy?: "created_at" | "updated_at" | "access_count" | "key";
    sortOrder?: "asc" | "desc";
    includeExpired?: boolean;
    keyPattern?: string;
    valuePattern?: string;
}
export declare class NamespaceUtils {
    /**
     * Validates namespace format (hierarchical paths allowed)
     */
    static validateNamespace(namespace: string): boolean;
    /**
     * Normalizes namespace path (removes duplicates slashes, trims)
     */
    static normalizeNamespace(namespace: string): string;
    /**
     * Gets parent namespace from hierarchical path
     */
    static getParentNamespace(namespace: string): string | null;
    /**
     * Gets namespace depth (number of levels)
     */
    static getNamespaceDepth(namespace: string): number;
    /**
     * Checks if namespace matches pattern (supports wildcards)
     */
    static matchesPattern(namespace: string, pattern: string): boolean;
    /**
     * Lists all child namespaces
     */
    static getChildNamespaces(parentNamespace: string, allNamespaces: string[]): string[];
}
export declare class SQLiteMemoryManager extends EventEmitter implements NamespaceOperations {
    private db;
    private logger;
    private cleanupInterval?;
    private implementation;
    private constructor();
    /**
     * Create a new SQLiteMemoryManager instance with fallback support
     */
    static create(dbPath?: string, preferredImpl?: SQLiteImplementation): Promise<SQLiteMemoryManager>;
    /**
     * Initialize all 12 specialized tables
     */
    private initializeTables;
    /**
     * Store memory entry with namespace validation and hierarchy support
     */
    store(entry: MemoryEntry): Promise<void>;
    /**
     * Retrieve memory entry with namespace support and wildcard matching
     */
    retrieve(key: string, namespace?: string): Promise<any>;
    /**
     * Enhanced search with namespace patterns and advanced filtering
     */
    search(pattern: string, namespace?: string, options?: SearchOptions): Promise<MemoryEntry[]>;
    /**
     * Record metric
     */
    recordMetric(name: string, value: number, unit?: string, tags?: any): Promise<void>;
    /**
     * Get metrics summary
     */
    getMetricsSummary(name: string, timeRange?: number): Promise<any>;
    /**
     * Cleanup expired entries
     */
    private startCleanupTask;
    /**
     * Get current implementation info
     */
    getImplementationInfo(): Promise<{
        name: SQLiteImplementation;
        available: SQLiteImplementation[];
    }>;
    /**
     * Test database connection and functionality
     */
    testConnection(): Promise<boolean>;
    /**
     * Delete a specific memory entry
     */
    delete(key: string, namespace?: string): Promise<boolean>;
    /**
     * List all entries in a namespace
     */
    list(namespace?: string, includeMetadata?: boolean): Promise<MemoryEntry[]>;
    /**
     * Cleanup expired entries in a namespace
     */
    cleanup(namespace?: string): Promise<number>;
    /**
     * Get namespace information and statistics
     */
    getNamespaceInfo(namespace?: string): Promise<NamespaceInfo[]>;
    /**
     * Delete entire namespace and all its entries
     */
    deleteNamespace(namespace: string): Promise<number>;
    /**
     * Get namespace-specific metrics and analytics
     */
    getNamespaceMetrics(namespace?: string, timeRange?: number): Promise<any>;
    /**
     * Close database connection
     */
    close(): void;
}
//# sourceMappingURL=sqlite-manager.d.ts.map