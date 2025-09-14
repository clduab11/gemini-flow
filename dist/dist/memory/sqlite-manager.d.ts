export class NamespaceUtils {
    /**
     * Validates namespace format (hierarchical paths allowed)
     */
    static validateNamespace(namespace: any): boolean;
    /**
     * Normalizes namespace path (removes duplicates slashes, trims)
     */
    static normalizeNamespace(namespace: any): any;
    /**
     * Gets parent namespace from hierarchical path
     */
    static getParentNamespace(namespace: any): any;
    /**
     * Gets namespace depth (number of levels)
     */
    static getNamespaceDepth(namespace: any): any;
    /**
     * Checks if namespace matches pattern (supports wildcards)
     */
    static matchesPattern(namespace: any, pattern: any): boolean;
    /**
     * Lists all child namespaces
     */
    static getChildNamespaces(parentNamespace: any, allNamespaces: any): any;
}
export class SQLiteMemoryManager extends EventEmitter<[never]> {
    /**
     * Create a new SQLiteMemoryManager instance with fallback support
     */
    static create(dbPath: string | undefined, preferredImpl: any): Promise<SQLiteMemoryManager>;
    constructor(db: any, implementation: any);
    db: any;
    logger: Logger;
    cleanupInterval: any;
    implementation: string;
    /**
     * Initialize all 12 specialized tables
     */
    initializeTables(): void;
    /**
     * Store memory entry with namespace validation and hierarchy support
     */
    store(entry: any): Promise<void>;
    /**
     * Retrieve memory entry with namespace support and wildcard matching
     */
    retrieve(key: any, namespace?: string): Promise<{
        value: any;
        metadata: any;
        namespace: any;
    } | null>;
    /**
     * Enhanced search with namespace patterns and advanced filtering
     */
    search(pattern: any, namespace: any, options?: {}): Promise<any>;
    /**
     * Record metric
     */
    recordMetric(name: any, value: any, unit: any, tags: any): Promise<void>;
    /**
     * Get metrics summary
     */
    getMetricsSummary(name: any, timeRange: any): Promise<any>;
    /**
     * Cleanup expired entries
     */
    startCleanupTask(): void;
    /**
     * Get current implementation info
     */
    getImplementationInfo(): Promise<{
        name: string;
        available: never[];
    }>;
    /**
     * Test database connection and functionality
     */
    testConnection(): Promise<boolean>;
    /**
     * Delete a specific memory entry
     */
    delete(key: any, namespace?: string): Promise<boolean>;
    /**
     * List all entries in a namespace
     */
    list(namespace: any, includeMetadata?: boolean): Promise<any>;
    /**
     * Cleanup expired entries in a namespace
     */
    cleanup(namespace: any): Promise<any>;
    /**
     * Get namespace information and statistics
     */
    getNamespaceInfo(namespace: any): Promise<any>;
    /**
     * Delete entire namespace and all its entries
     */
    deleteNamespace(namespace: any): Promise<any>;
    /**
     * Get namespace-specific metrics and analytics
     */
    getNamespaceMetrics(namespace: any, timeRange: any): Promise<any>;
    /**
     * Close database connection
     */
    close(): void;
}
import { EventEmitter } from "events";
import { Logger } from "../utils/logger.js";
//# sourceMappingURL=sqlite-manager.d.ts.map