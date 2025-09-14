/**
 * Cache Manager
 *
 * High-performance caching layer with intelligent eviction and 12x performance boost
 * Supports both memory and persistent caching with SQLite optimization
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
export interface CacheEntry {
    key: string;
    value: any;
    size: number;
    ttl: number;
    createdAt: Date;
    lastAccessed: Date;
    hitCount: number;
    namespace?: string;
}
export interface CacheStats {
    totalKeys: number;
    totalSize: number;
    hitRate: number;
    missRate: number;
    evictionCount: number;
    memoryUsage: number;
    diskUsage: number;
}
export interface CacheConfig {
    maxMemorySize?: number;
    maxDiskSize?: number;
    defaultTTL?: number;
    evictionPolicy?: "lru" | "lfu" | "adaptive";
    persistToDisk?: boolean;
    compression?: boolean;
    dbPath?: string;
}
export declare class CacheManager extends EventEmitter {
    private logger;
    private config;
    private memoryCache;
    private memorySize;
    private db?;
    private diskSize;
    private dbReady;
    private dbInitPromise?;
    private stats;
    private accessOrder;
    private frequencyMap;
    private cleanupInterval?;
    constructor(config?: CacheConfig);
    /**
     * Initialize SQLite disk cache with optimizations
     */
    private initializeDiskCache;
    /**
     * Prepare SQLite statements for better performance
     */
    private prepareStatements;
    /**
     * Get value from cache with L1/L2 hierarchy
     */
    get(key: string): Promise<any>;
    /**
     * Set value in cache with intelligent placement
     */
    set(key: string, value: any, ttl?: number, namespace?: string): Promise<void>;
    /**
     * Delete from cache
     */
    delete(key: string): Promise<boolean>;
    /**
     * Check if entry has expired
     */
    private isExpired;
    /**
     * Update memory cache access
     */
    private updateMemoryAccess;
    /**
     * Update disk cache access
     */
    private updateDiskAccess;
    /**
     * Get entry from disk cache
     */
    private getDiskEntry;
    /**
     * Promote disk entry to memory cache
     */
    private promoteToMemory;
    /**
     * Set entry in memory cache
     */
    private setMemoryEntry;
    /**
     * Set entry in disk cache
     */
    private setDiskEntry;
    /**
     * Determine if entry should use memory cache
     */
    private shouldUseMemoryCache;
    /**
     * Ensure sufficient memory space
     */
    private ensureMemorySpace;
    /**
     * Evict entry from memory cache
     */
    private evictFromMemory;
    /**
     * Find least frequently used key
     */
    private findLFUKey;
    /**
     * Find key for adaptive eviction (combines LRU and LFU)
     */
    private findAdaptiveEvictionKey;
    /**
     * Remove key from access order array
     */
    private removeFromAccessOrder;
    /**
     * Start cleanup timer for expired entries
     */
    private startCleanupTimer;
    /**
     * Clean up expired entries
     */
    private cleanup;
    /**
     * Serialize value for storage
     */
    private serialize;
    /**
     * Deserialize value from storage
     */
    private deserialize;
    /**
     * Compress data (simple implementation)
     */
    private compress;
    /**
     * Decompress data
     */
    private decompress;
    /**
     * Calculate size of serialized data
     */
    private calculateSize;
    /**
     * Format bytes for display
     */
    private formatBytes;
    /**
     * Get cache statistics
     */
    getStats(): CacheStats;
    /**
     * Clear all cache entries
     */
    clear(): Promise<void>;
    /**
     * Shutdown cache manager
     */
    shutdown(): void;
}
//# sourceMappingURL=cache-manager.d.ts.map