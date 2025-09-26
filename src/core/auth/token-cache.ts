/**
 * Token Cache Implementation
 *
 * High-performance token caching system with TTL support, automatic rotation,
 * and comprehensive cache management for authentication credentials
 */

import { EventEmitter } from "node:events";
import { Logger } from "../../utils/logger.js";
import { AuthCredentials, TokenCache, AuthError } from "../../types/auth.js";

/**
 * Cache configuration
 */
export interface TokenCacheConfig {
  maxSize: number;
  defaultTTL: number; // milliseconds
  cleanupInterval: number; // milliseconds
  enableMetrics: boolean;
  enableEvents: boolean;
}

/**
 * Cache entry with expiration and metadata
 */
interface CacheEntry {
  credentials: AuthCredentials;
  expiresAt: number;
  createdAt: number;
  accessCount: number;
  lastAccessed: number;
  ttl: number;
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
export class InMemoryTokenCache extends EventEmitter implements TokenCache {
  private cache = new Map<string, CacheEntry>();
  private accessOrder = new Map<string, number>(); // For LRU tracking
  private config: TokenCacheConfig;
  private logger: Logger;
  private cleanupTimer?: ReturnType<typeof setInterval>;
  private accessCounter = 0;

  // Metrics
  private metrics = {
    hitCount: 0,
    missCount: 0,
    evictionCount: 0,
    expiredCount: 0,
    totalAccessTime: 0,
    accessCount: 0,
  };

  constructor(config: Partial<TokenCacheConfig> = {}) {
    super();

    this.config = {
      maxSize: config.maxSize || 1000,
      defaultTTL: config.defaultTTL || 60 * 60 * 1000, // 1 hour
      cleanupInterval: config.cleanupInterval || 5 * 60 * 1000, // 5 minutes
      enableMetrics: config.enableMetrics ?? true,
      enableEvents: config.enableEvents ?? true,
    };

    this.logger = new Logger("TokenCache");

    // Start cleanup timer
    this.startCleanupTimer();

    this.logger.info("Token cache initialized", {
      maxSize: this.config.maxSize,
      defaultTTL: this.config.defaultTTL,
      cleanupInterval: this.config.cleanupInterval,
    });
  }

  /**
   * Get credentials from cache
   */
  async get(key: string): Promise<AuthCredentials | null> {
    const startTime = Date.now();

    try {
      this.validateKey(key);

      const entry = this.cache.get(key);
      if (!entry) {
        this.recordMiss();
        return null;
      }

      // Check expiration
      const now = Date.now();
      if (entry.expiresAt <= now) {
        await this.delete(key);
        this.recordExpiration();
        this.recordMiss();
        return null;
      }

      // Update access tracking
      entry.accessCount++;
      entry.lastAccessed = now;
      this.accessOrder.set(key, ++this.accessCounter);

      this.recordHit();

      if (this.config.enableEvents) {
        this.emit("cache_hit", {
          key: this.maskKey(key),
          provider: entry.credentials.provider,
        });
      }

      this.logger.debug("Cache hit", {
        key: this.maskKey(key),
        provider: entry.credentials.provider,
        accessCount: entry.accessCount,
      });

      return { ...entry.credentials }; // Return copy to prevent mutations
    } catch (error) {
      this.logger.error("Cache get failed", { key: this.maskKey(key), error });
      this.recordMiss();
      return null;
    } finally {
      if (this.config.enableMetrics) {
        this.recordAccessTime(Date.now() - startTime);
      }
    }
  }

  /**
   * Set credentials in cache
   */
  async set(
    key: string,
    credentials: AuthCredentials,
    ttl?: number,
  ): Promise<void> {
    try {
      this.validateKey(key);
      this.validateCredentials(credentials);

      const now = Date.now();
      const effectiveTTL = ttl || this.config.defaultTTL;

      // Check if we need to evict entries to make space
      if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
        await this.evictLeastRecentlyUsed();
      }

      const entry: CacheEntry = {
        credentials: { ...credentials }, // Deep copy to prevent mutations
        expiresAt: now + effectiveTTL,
        createdAt: now,
        accessCount: 0,
        lastAccessed: now,
        ttl: effectiveTTL,
      };

      this.cache.set(key, entry);
      this.accessOrder.set(key, ++this.accessCounter);

      if (this.config.enableEvents) {
        this.emit("cache_set", {
          key: this.maskKey(key),
          provider: credentials.provider,
          ttl: effectiveTTL,
        });
      }

      this.logger.debug("Cache set", {
        key: this.maskKey(key),
        provider: credentials.provider,
        ttl: effectiveTTL,
        cacheSize: this.cache.size,
      });
    } catch (error) {
      this.logger.error("Cache set failed", { key: this.maskKey(key), error });
      throw this.createCacheError(
        "CACHE_SET_FAILED",
        "Failed to set cache entry",
        error as Error,
      );
    }
  }

  /**
   * Delete entry from cache
   */
  async delete(key: string): Promise<void> {
    try {
      this.validateKey(key);

      const entry = this.cache.get(key);
      const deleted = this.cache.delete(key);
      this.accessOrder.delete(key);

      if (deleted && this.config.enableEvents) {
        this.emit("cache_delete", {
          key: this.maskKey(key),
          provider: entry?.credentials.provider,
        });
      }

      this.logger.debug("Cache delete", {
        key: this.maskKey(key),
        deleted,
        cacheSize: this.cache.size,
      });
    } catch (error) {
      this.logger.error("Cache delete failed", {
        key: this.maskKey(key),
        error,
      });
      throw this.createCacheError(
        "CACHE_DELETE_FAILED",
        "Failed to delete cache entry",
        error as Error,
      );
    }
  }

  /**
   * Clear all entries from cache
   */
  async clear(): Promise<void> {
    try {
      const count = this.cache.size;
      this.cache.clear();
      this.accessOrder.clear();
      this.accessCounter = 0;

      // Reset metrics
      this.metrics = {
        hitCount: 0,
        missCount: 0,
        evictionCount: 0,
        expiredCount: 0,
        totalAccessTime: 0,
        accessCount: 0,
      };

      if (this.config.enableEvents) {
        this.emit("cache_cleared", { count });
      }

      this.logger.info("Cache cleared", { entriesRemoved: count });
    } catch (error) {
      this.logger.error("Cache clear failed", { error });
      throw this.createCacheError(
        "CACHE_CLEAR_FAILED",
        "Failed to clear cache",
        error as Error,
      );
    }
  }

  /**
   * Get cache size
   */
  async size(): Promise<number> {
    return this.cache.size;
  }

  /**
   * Get cache metrics
   */
  getMetrics(): CacheMetrics {
    const entries = Array.from(this.cache.values());
    const now = Date.now();

    return {
      totalEntries: this.cache.size,
      hitCount: this.metrics.hitCount,
      missCount: this.metrics.missCount,
      evictionCount: this.metrics.evictionCount,
      expiredCount: this.metrics.expiredCount,
      hitRate: this.calculateHitRate(),
      averageAccessTime: this.calculateAverageAccessTime(),
      memoryUsage: this.estimateMemoryUsage(),
      oldestEntry:
        entries.length > 0
          ? Math.min(...entries.map((e) => e.createdAt))
          : undefined,
      newestEntry:
        entries.length > 0
          ? Math.max(...entries.map((e) => e.createdAt))
          : undefined,
    };
  }

  /**
   * Get cache statistics for debugging
   */
  getStats() {
    const entries = Array.from(this.cache.entries());
    const now = Date.now();

    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      utilizationRate: (this.cache.size / this.config.maxSize) * 100,
      expiredEntries: entries.filter(([_, entry]) => entry.expiresAt <= now)
        .length,
      averageAge:
        entries.length > 0
          ? (now -
              entries.reduce((sum, [_, entry]) => sum + entry.createdAt, 0) /
                entries.length) /
            1000
          : 0,
      totalAccesses: entries.reduce(
        (sum, [_, entry]) => sum + entry.accessCount,
        0,
      ),
      mostAccessedKey: this.getMostAccessedKey(),
      leastAccessedKey: this.getLeastAccessedKey(),
    };
  }

  /**
   * Force cleanup of expired entries
   */
  async cleanup(): Promise<number> {
    const now = Date.now();
    let expiredCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt <= now) {
        await this.delete(key);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      this.logger.debug("Cleanup completed", { expiredEntries: expiredCount });

      if (this.config.enableEvents) {
        this.emit("cache_cleanup", { expiredEntries: expiredCount });
      }
    }

    return expiredCount;
  }

  /**
   * Check if cache has valid entry for key
   */
  async has(key: string): Promise<boolean> {
    try {
      const entry = this.cache.get(key);
      if (!entry) return false;

      // Check expiration
      if (entry.expiresAt <= Date.now()) {
        await this.delete(key);
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Update TTL for existing entry
   */
  async updateTTL(key: string, ttl: number): Promise<boolean> {
    try {
      const entry = this.cache.get(key);
      if (!entry) return false;

      entry.ttl = ttl;
      entry.expiresAt = Date.now() + ttl;

      this.logger.debug("TTL updated", { key: this.maskKey(key), newTTL: ttl });
      return true;
    } catch (error) {
      this.logger.error("Failed to update TTL", {
        key: this.maskKey(key),
        error,
      });
      return false;
    }
  }

  /**
   * Destroy cache and cleanup resources
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }

    this.cache.clear();
    this.accessOrder.clear();
    this.removeAllListeners();

    this.logger.debug("Token cache destroyed");
  }

  /**
   * Start periodic cleanup timer
   */
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup().catch((error) => {
        this.logger.error("Cleanup timer error", { error });
      });
    }, this.config.cleanupInterval);
  }

  /**
   * Evict least recently used entry
   */
  private async evictLeastRecentlyUsed(): Promise<void> {
    if (this.accessOrder.size === 0) return;

    // Find the key with the lowest access order number
    let lruKey: string | null = null;
    let lowestOrder = Infinity;

    for (const [key, order] of this.accessOrder.entries()) {
      if (order < lowestOrder) {
        lowestOrder = order;
        lruKey = key;
      }
    }

    if (lruKey) {
      await this.delete(lruKey);
      this.recordEviction();

      this.logger.debug("LRU eviction", {
        key: this.maskKey(lruKey),
        cacheSize: this.cache.size,
      });
    }
  }

  /**
   * Get most accessed key for statistics
   */
  private getMostAccessedKey(): string | null {
    let maxAccess = 0;
    let mostAccessedKey: string | null = null;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.accessCount > maxAccess) {
        maxAccess = entry.accessCount;
        mostAccessedKey = key;
      }
    }

    return mostAccessedKey ? this.maskKey(mostAccessedKey) : null;
  }

  /**
   * Get least accessed key for statistics
   */
  private getLeastAccessedKey(): string | null {
    let minAccess = Infinity;
    let leastAccessedKey: string | null = null;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.accessCount < minAccess) {
        minAccess = entry.accessCount;
        leastAccessedKey = key;
      }
    }

    return leastAccessedKey ? this.maskKey(leastAccessedKey) : null;
  }

  /**
   * Calculate hit rate percentage
   */
  private calculateHitRate(): number {
    const total = this.metrics.hitCount + this.metrics.missCount;
    return total > 0 ? (this.metrics.hitCount / total) * 100 : 0;
  }

  /**
   * Calculate average access time
   */
  private calculateAverageAccessTime(): number {
    return this.metrics.accessCount > 0
      ? this.metrics.totalAccessTime / this.metrics.accessCount
      : 0;
  }

  /**
   * Estimate memory usage (rough calculation)
   */
  private estimateMemoryUsage(): number {
    let totalSize = 0;

    for (const [key, entry] of this.cache.entries()) {
      // Rough estimation: key size + JSON size of credentials
      totalSize += key.length * 2; // UTF-16 characters
      totalSize += JSON.stringify(entry.credentials).length * 2;
      totalSize += 200; // Approximate overhead for entry metadata
    }

    return totalSize;
  }

  /**
   * Record cache hit for metrics
   */
  private recordHit(): void {
    if (this.config.enableMetrics) {
      this.metrics.hitCount++;
    }
  }

  /**
   * Record cache miss for metrics
   */
  private recordMiss(): void {
    if (this.config.enableMetrics) {
      this.metrics.missCount++;
    }
  }

  /**
   * Record eviction for metrics
   */
  private recordEviction(): void {
    if (this.config.enableMetrics) {
      this.metrics.evictionCount++;
    }
  }

  /**
   * Record expiration for metrics
   */
  private recordExpiration(): void {
    if (this.config.enableMetrics) {
      this.metrics.expiredCount++;
    }
  }

  /**
   * Record access time for metrics
   */
  private recordAccessTime(time: number): void {
    this.metrics.totalAccessTime += time;
    this.metrics.accessCount++;
  }

  /**
   * Validate cache key
   */
  private validateKey(key: string): void {
    if (!key || typeof key !== "string" || key.trim() === "") {
      throw new Error("Invalid cache key");
    }
  }

  /**
   * Validate credentials object
   */
  private validateCredentials(credentials: AuthCredentials): void {
    if (!credentials || typeof credentials !== "object") {
      throw new Error("Invalid credentials object");
    }

    if (!credentials.type || !credentials.provider) {
      throw new Error("Credentials missing required fields: type and provider");
    }
  }

  /**
   * Mask key for logging security
   */
  private maskKey(key: string): string {
    if (key.length <= 8) return "***";
    return key.substring(0, 4) + "***" + key.substring(key.length - 4);
  }

  /**
   * Create cache-specific error
   */
  private createCacheError(
    code: string,
    message: string,
    originalError?: Error,
  ): AuthError {
    const error = new Error(message) as AuthError;
    error.code = code;
    error.type = "configuration";
    error.retryable = false;
    error.originalError = originalError;
    error.context = {
      cacheType: "in-memory",
      cacheSize: this.cache.size,
      maxSize: this.config.maxSize,
      timestamp: Date.now(),
    };
    return error;
  }
}

/**
 * Factory function to create token cache instances
 */
export function createTokenCache(
  config: Partial<TokenCacheConfig> = {},
): TokenCache {
  return new InMemoryTokenCache(config);
}
