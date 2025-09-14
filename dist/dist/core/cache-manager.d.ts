export class CacheManager extends EventEmitter<[never]> {
    constructor(config?: {});
    logger: Logger;
    config: {
        maxMemorySize: any;
        maxDiskSize: any;
        defaultTTL: any;
        evictionPolicy: any;
        persistToDisk: any;
        compression: any;
        dbPath: any;
    };
    memoryCache: Map<any, any>;
    memorySize: number;
    db: any;
    diskSize: number;
    dbReady: boolean;
    dbInitPromise: Promise<void>;
    stats: {
        hits: number;
        misses: number;
        evictions: number;
        writes: number;
        reads: number;
    };
    accessOrder: any[];
    frequencyMap: Map<any, any>;
    cleanupInterval: any;
    /**
     * Initialize SQLite disk cache with optimizations
     */
    initializeDiskCache(): Promise<void>;
    /**
     * Prepare SQLite statements for better performance
     */
    prepareStatements(): Promise<void>;
    getStmt: any;
    setStmt: any;
    deleteStmt: any;
    updateAccessStmt: any;
    cleanupStmt: any;
    /**
     * Get value from cache with L1/L2 hierarchy
     */
    get(key: any): Promise<any>;
    /**
     * Set value in cache with intelligent placement
     */
    set(key: any, value: any, ttl: any, namespace: any): Promise<void>;
    /**
     * Delete from cache
     */
    delete(key: any): Promise<boolean>;
    /**
     * Check if entry has expired
     */
    isExpired(entry: any): boolean;
    /**
     * Update memory cache access
     */
    updateMemoryAccess(key: any, entry: any): void;
    /**
     * Update disk cache access
     */
    updateDiskAccess(key: any): void;
    /**
     * Get entry from disk cache
     */
    getDiskEntry(key: any): {
        key: any;
        value: any;
        size: any;
        ttl: any;
        createdAt: Date;
        lastAccessed: Date;
        hitCount: any;
        namespace: any;
    } | null;
    /**
     * Promote disk entry to memory cache
     */
    promoteToMemory(key: any, entry: any): Promise<void>;
    /**
     * Set entry in memory cache
     */
    setMemoryEntry(key: any, entry: any): Promise<void>;
    /**
     * Set entry in disk cache
     */
    setDiskEntry(key: any, entry: any, serializedValue: any): Promise<void>;
    /**
     * Determine if entry should use memory cache
     */
    shouldUseMemoryCache(size: any, key: any): boolean;
    /**
     * Ensure sufficient memory space
     */
    ensureMemorySpace(requiredSize: any): Promise<void>;
    /**
     * Evict entry from memory cache
     */
    evictFromMemory(): Promise<boolean>;
    /**
     * Find least frequently used key
     */
    findLFUKey(): any;
    /**
     * Find key for adaptive eviction (combines LRU and LFU)
     */
    findAdaptiveEvictionKey(): any;
    /**
     * Remove key from access order array
     */
    removeFromAccessOrder(key: any): void;
    /**
     * Start cleanup timer for expired entries
     */
    startCleanupTimer(): void;
    /**
     * Clean up expired entries
     */
    cleanup(): Promise<void>;
    /**
     * Serialize value for storage
     */
    serialize(value: any): string;
    /**
     * Deserialize value from storage
     */
    deserialize(value: any, compressed?: boolean): any;
    /**
     * Compress data (simple implementation)
     */
    compress(data: any): Buffer;
    /**
     * Decompress data
     */
    decompress(data: any): any;
    /**
     * Calculate size of serialized data
     */
    calculateSize(data: any): number;
    /**
     * Format bytes for display
     */
    formatBytes(bytes: any): string;
    /**
     * Get cache statistics
     */
    getStats(): {
        totalKeys: number;
        totalSize: number;
        hitRate: number;
        missRate: number;
        evictionCount: number;
        memoryUsage: number;
        diskUsage: number;
    };
    /**
     * Clear all cache entries
     */
    clear(): Promise<void>;
    /**
     * Shutdown cache manager
     */
    shutdown(): void;
}
import { EventEmitter } from "events";
import { Logger } from "../utils/logger.js";
//# sourceMappingURL=cache-manager.d.ts.map