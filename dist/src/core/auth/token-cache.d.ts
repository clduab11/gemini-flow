/**
 * Token Cache Implementation
 *
 * High-performance token caching system with TTL support, automatic rotation,
 * and comprehensive cache management for authentication credentials
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { AuthCredentials, TokenCache } from "../../types/auth.js";
/**
 * Cache configuration
 */
export interface TokenCacheConfig {
    maxSize: number;
    defaultTTL: number;
    cleanupInterval: number;
    enableMetrics: boolean;
    enableEvents: boolean;
}
/**
 * Cache metrics
 */
export interface CacheMetrics {
    totalEntries: number;
    hitCount: number;
    missCount: number;
    evictionCount: number;
    expiredCount: number;
    hitRate: number;
    averageAccessTime: number;
    memoryUsage: number;
    oldestEntry?: number;
    newestEntry?: number;
}
/**
 * In-memory token cache with LRU eviction and TTL support
 */
export declare class InMemoryTokenCache extends EventEmitter implements TokenCache {
    private cache;
    private accessOrder;
    private config;
    private logger;
    private cleanupTimer?;
    private accessCounter;
    private metrics;
    constructor(config?: Partial<TokenCacheConfig>);
    /**
     * Get credentials from cache
     */
    get(key: string): Promise<AuthCredentials | null>;
    /**
     * Set credentials in cache
     */
    set(key: string, credentials: AuthCredentials, ttl?: number): Promise<void>;
    /**
     * Delete entry from cache
     */
    delete(key: string): Promise<void>;
    /**
     * Clear all entries from cache
     */
    clear(): Promise<void>;
    /**
     * Get cache size
     */
    size(): Promise<number>;
    /**
     * Get cache metrics
     */
    getMetrics(): CacheMetrics;
    /**
     * Get cache statistics for debugging
     */
    getStats(): {
        size: number;
        maxSize: number;
        utilizationRate: number;
        expiredEntries: number;
        averageAge: number;
        totalAccesses: number;
        mostAccessedKey: string | null;
        leastAccessedKey: string | null;
    };
    /**
     * Force cleanup of expired entries
     */
    cleanup(): Promise<number>;
    /**
     * Check if cache has valid entry for key
     */
    has(key: string): Promise<boolean>;
    /**
     * Update TTL for existing entry
     */
    updateTTL(key: string, ttl: number): Promise<boolean>;
    /**
     * Destroy cache and cleanup resources
     */
    destroy(): void;
    /**
     * Start periodic cleanup timer
     */
    private startCleanupTimer;
    /**
     * Evict least recently used entry
     */
    private evictLeastRecentlyUsed;
    /**
     * Get most accessed key for statistics
     */
    private getMostAccessedKey;
    /**
     * Get least accessed key for statistics
     */
    private getLeastAccessedKey;
    /**
     * Calculate hit rate percentage
     */
    private calculateHitRate;
    /**
     * Calculate average access time
     */
    private calculateAverageAccessTime;
    /**
     * Estimate memory usage (rough calculation)
     */
    private estimateMemoryUsage;
    /**
     * Record cache hit for metrics
     */
    private recordHit;
    /**
     * Record cache miss for metrics
     */
    private recordMiss;
    /**
     * Record eviction for metrics
     */
    private recordEviction;
    /**
     * Record expiration for metrics
     */
    private recordExpiration;
    /**
     * Record access time for metrics
     */
    private recordAccessTime;
    /**
     * Validate cache key
     */
    private validateKey;
    /**
     * Validate credentials object
     */
    private validateCredentials;
    /**
     * Mask key for logging security
     */
    private maskKey;
    /**
     * Create cache-specific error
     */
    private createCacheError;
}
/**
 * Factory function to create token cache instances
 */
export declare function createTokenCache(config?: Partial<TokenCacheConfig>): TokenCache;
//# sourceMappingURL=token-cache.d.ts.map