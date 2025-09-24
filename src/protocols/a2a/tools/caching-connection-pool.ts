/**
 * Caching and Connection Pool Layer
 *
 * Provides intelligent caching strategies and connection pooling for A2A tools.
 * Includes adaptive cache management, connection lifecycle management, and
 * resource optimization with monitoring and analytics.
 */

import { EventEmitter } from "node:events";
import { Logger } from "../../../utils/logger.js";
import { CacheManager } from "../../../core/cache-manager.js";
import {
  A2AToolInvocation,
  A2AToolResponse,
  A2AToolContext,
} from "./a2a-tool-wrapper.js";

export interface CacheConfiguration {
  strategy: "lru" | "lfu" | "ttl" | "adaptive" | "intelligent";
  maxSize: number;
  defaultTTL: number;
  maxTTL: number;
  compressionEnabled: boolean;
  serializationFormat: "json" | "msgpack" | "cbor";
  invalidationRules: CacheInvalidationRule[];
  warmupRules: CacheWarmupRule[];
}

export interface CacheInvalidationRule {
  id: string;
  trigger: "time" | "event" | "dependency" | "custom";
  condition: any;
  action: "delete" | "refresh" | "mark_stale";
  priority: number;
}

export interface CacheWarmupRule {
  id: string;
  schedule: string; // cron expression
  targetKeys: string[];
  preloadStrategy: "eager" | "lazy" | "predictive";
  condition?: (context: A2AToolContext) => boolean;
}

export interface ConnectionPoolConfiguration {
  minConnections: number;
  maxConnections: number;
  connectionTimeout: number;
  idleTimeout: number;
  maxRetries: number;
  healthCheckInterval: number;
  reconnectStrategy: "immediate" | "exponential" | "linear";
  loadBalancing: "round_robin" | "least_connections" | "weighted" | "adaptive";
}

export interface Connection {
  id: string;
  toolId: string;
  status: "idle" | "active" | "unhealthy" | "closed";
  createdAt: Date;
  lastUsed: Date;
  useCount: number;
  errorCount: number;
  latency: number;
  metadata: Record<string, any>;
}

export interface CacheEntry {
  key: string;
  value: any;
  size: number;
  ttl: number;
  createdAt: Date;
  lastAccessed: Date;
  accessCount: number;
  compressionRatio?: number;
  tags: string[];
  dependencies: string[];
}

export interface CacheMetrics {
  hitRate: number;
  missRate: number;
  evictionRate: number;
  totalHits: number;
  totalMisses: number;
  totalEvictions: number;
  memoryUsage: number;
  compressionSavings: number;
  averageRetrievalTime: number;
  hotKeys: Array<{ key: string; hits: number }>;
}

export interface ConnectionPoolMetrics {
  activeConnections: number;
  idleConnections: number;
  totalConnections: number;
  connectionUtilization: number;
  averageLatency: number;
  errorRate: number;
  throughput: number;
  queueLength: number;
}

/**
 * Advanced caching system with intelligent strategies
 */
export class IntelligentCacheManager extends EventEmitter {
  private logger: Logger;
  private baseCache: CacheManager;
  private entries = new Map<string, CacheEntry>();
  private accessPatterns = new Map<string, number[]>();
  private tagIndex = new Map<string, Set<string>>();
  private dependencyGraph = new Map<string, Set<string>>();

  private metrics: CacheMetrics = {
    hitRate: 0,
    missRate: 0,
    evictionRate: 0,
    totalHits: 0,
    totalMisses: 0,
    totalEvictions: 0,
    memoryUsage: 0,
    compressionSavings: 0,
    averageRetrievalTime: 0,
    hotKeys: [],
  };

  constructor(private config: CacheConfiguration) {
    super();
    this.logger = new Logger("IntelligentCacheManager");
    this.baseCache = new CacheManager();

    this.startMaintenanceTasks();
    this.logger.info("Intelligent Cache Manager initialized", {
      strategy: config.strategy,
      maxSize: config.maxSize,
    });
  }

  /**
   * Get value from cache with intelligent access tracking
   */
  async get<T = any>(key: string, context?: A2AToolContext): Promise<T | null> {
    const startTime = Date.now();

    try {
      const entry = this.entries.get(key);

      if (!entry) {
        this.recordMiss(key);
        return null;
      }

      // Check TTL
      if (this.isExpired(entry)) {
        await this.delete(key);
        this.recordMiss(key);
        return null;
      }

      // Update access patterns
      this.updateAccessPattern(key);
      entry.lastAccessed = new Date();
      entry.accessCount++;

      // Predictive prefetching
      await this.performPredictivePrefetch(key, context);

      this.recordHit(key, Date.now() - startTime);

      this.emit("cache_hit", { key, entry });
      return entry.value as T;
    } catch (error: any) {
      this.logger.error("Cache get failed", { key, error: error.message });
      this.recordMiss(key);
      return null;
    }
  }

  /**
   * Set value in cache with intelligent placement
   */
  async set(
    key: string,
    value: any,
    options: {
      ttl?: number;
      tags?: string[];
      dependencies?: string[];
      priority?: number;
      context?: A2AToolContext;
    } = {},
  ): Promise<void> {
    try {
      // Compression if enabled
      let compressedValue = value;
      let compressionRatio = 1;

      if (this.config.compressionEnabled) {
        const compressed = await this.compressValue(value);
        compressedValue = compressed.data;
        compressionRatio = compressed.ratio;
      }

      // Calculate size
      const size = this.calculateSize(compressedValue);

      // Check if we need to evict
      await this.ensureCapacity(size);

      // Create cache entry
      const entry: CacheEntry = {
        key,
        value: compressedValue,
        size,
        ttl: options.ttl || this.config.defaultTTL,
        createdAt: new Date(),
        lastAccessed: new Date(),
        accessCount: 1,
        compressionRatio,
        tags: options.tags || [],
        dependencies: options.dependencies || [],
      };

      this.entries.set(key, entry);

      // Update indices
      this.updateTagIndex(key, entry.tags);
      this.updateDependencyGraph(key, entry.dependencies);

      // Update metrics
      this.metrics.memoryUsage += size;
      this.metrics.compressionSavings += size * (1 - compressionRatio);

      this.emit("cache_set", { key, entry });

      this.logger.debug("Cache entry created", {
        key,
        size,
        ttl: entry.ttl,
        compressionRatio,
      });
    } catch (error: any) {
      this.logger.error("Cache set failed", { key, error: error.message });
      throw error;
    }
  }

  /**
   * Delete entry from cache
   */
  async delete(key: string): Promise<void> {
    const entry = this.entries.get(key);
    if (!entry) return;

    // Remove from indices
    this.removeFromTagIndex(key, entry.tags);
    this.removeFromDependencyGraph(key);

    // Update metrics
    this.metrics.memoryUsage -= entry.size;

    this.entries.delete(key);

    this.emit("cache_delete", { key });
  }

  /**
   * Invalidate cache entries by tags
   */
  async invalidateByTag(tag: string): Promise<void> {
    const keys = this.tagIndex.get(tag);
    if (!keys) return;

    const promises = Array.from(keys).map((key) => this.delete(key));
    await Promise.all(promises);

    this.logger.info("Cache invalidated by tag", { tag, keyCount: keys.size });
  }

  /**
   * Warm up cache with predictive loading
   */
  async warmUp(patterns: string[], context?: A2AToolContext): Promise<void> {
    this.logger.info("Starting cache warmup", {
      patternCount: patterns.length,
    });

    for (const pattern of patterns) {
      try {
        // Generate likely keys based on pattern
        const keys = await this.generateKeysFromPattern(pattern, context);

        // Preload in background
        this.preloadKeys(keys).catch((error) => {
          this.logger.warn("Preload failed for pattern", {
            pattern,
            error: error.message,
          });
        });
      } catch (error: any) {
        this.logger.warn("Warmup pattern failed", {
          pattern,
          error: error.message,
        });
      }
    }
  }

  /**
   * Get cache statistics and metrics
   */
  getMetrics(): CacheMetrics {
    // Update calculated metrics
    const total = this.metrics.totalHits + this.metrics.totalMisses;
    this.metrics.hitRate = total > 0 ? this.metrics.totalHits / total : 0;
    this.metrics.missRate = total > 0 ? this.metrics.totalMisses / total : 0;

    // Calculate hot keys
    this.metrics.hotKeys = Array.from(this.entries.entries())
      .map(([key, entry]) => ({ key, hits: entry.accessCount }))
      .sort((a, b) => b.hits - a.hits)
      .slice(0, 10);

    return { ...this.metrics };
  }

  /**
   * Private helper methods
   */

  private isExpired(entry: CacheEntry): boolean {
    const now = Date.now();
    const expiryTime = entry.createdAt.getTime() + entry.ttl;
    return now > expiryTime;
  }

  private updateAccessPattern(key: string): void {
    const now = Date.now();
    const pattern = this.accessPatterns.get(key) || [];

    pattern.push(now);

    // Keep only last 100 accesses
    if (pattern.length > 100) {
      pattern.shift();
    }

    this.accessPatterns.set(key, pattern);
  }

  private async performPredictivePrefetch(
    key: string,
    context?: A2AToolContext,
  ): Promise<void> {
    // Analyze access patterns and prefetch related keys
    const relatedKeys = await this.predictRelatedKeys(key, context);

    if (relatedKeys.length > 0) {
      // Prefetch in background
      this.preloadKeys(relatedKeys.slice(0, 3)).catch((error) => {
        this.logger.debug("Predictive prefetch failed", {
          error: error.message,
        });
      });
    }
  }

  private async predictRelatedKeys(
    key: string,
    context?: A2AToolContext,
  ): Promise<string[]> {
    // Simple prediction based on key patterns
    const keyParts = key.split(":");
    const relatedKeys: string[] = [];

    // Look for similar keys
    for (const [existingKey] of this.entries) {
      if (existingKey !== key && existingKey.includes(keyParts[0])) {
        relatedKeys.push(existingKey);
      }
    }

    return relatedKeys.slice(0, 5);
  }

  private async ensureCapacity(requiredSize: number): Promise<void> {
    const currentSize = this.metrics.memoryUsage;
    const maxSize = this.config.maxSize;

    if (currentSize + requiredSize <= maxSize) {
      return;
    }

    // Evict entries to make space
    const toEvict = currentSize + requiredSize - maxSize;
    await this.evictEntries(toEvict);
  }

  private async evictEntries(sizeToFree: number): Promise<void> {
    let freedSize = 0;
    const entries = Array.from(this.entries.entries());

    // Sort by eviction strategy
    entries.sort(([, a], [, b]) => {
      switch (this.config.strategy) {
        case "lru":
          return a.lastAccessed.getTime() - b.lastAccessed.getTime();
        case "lfu":
          return a.accessCount - b.accessCount;
        case "ttl":
          return a.createdAt.getTime() - b.createdAt.getTime();
        default:
          return (
            this.calculateEvictionScore(a) - this.calculateEvictionScore(b)
          );
      }
    });

    // Evict entries until we have enough space
    for (const [key, entry] of entries) {
      if (freedSize >= sizeToFree) break;

      await this.delete(key);
      freedSize += entry.size;
      this.metrics.totalEvictions++;
    }

    this.logger.debug("Cache eviction completed", {
      freedSize,
      evictedCount: this.metrics.totalEvictions,
    });
  }

  private calculateEvictionScore(entry: CacheEntry): number {
    const age = Date.now() - entry.lastAccessed.getTime();
    const frequency = entry.accessCount;
    const size = entry.size;

    // Lower score = higher priority for eviction
    return frequency / (age * size);
  }

  private updateTagIndex(key: string, tags: string[]): void {
    for (const tag of tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(key);
    }
  }

  private removeFromTagIndex(key: string, tags: string[]): void {
    for (const tag of tags) {
      const keys = this.tagIndex.get(tag);
      if (keys) {
        keys.delete(key);
        if (keys.size === 0) {
          this.tagIndex.delete(tag);
        }
      }
    }
  }

  private updateDependencyGraph(key: string, dependencies: string[]): void {
    for (const dep of dependencies) {
      if (!this.dependencyGraph.has(dep)) {
        this.dependencyGraph.set(dep, new Set());
      }
      this.dependencyGraph.get(dep)!.add(key);
    }
  }

  private removeFromDependencyGraph(key: string): void {
    for (const [dep, dependents] of this.dependencyGraph) {
      dependents.delete(key);
      if (dependents.size === 0) {
        this.dependencyGraph.delete(dep);
      }
    }
  }

  private async compressValue(
    value: any,
  ): Promise<{ data: any; ratio: number }> {
    // Simulate compression
    const originalSize = JSON.stringify(value).length;
    const compressedSize = Math.floor(originalSize * 0.7); // 30% compression

    return {
      data: value, // In real implementation, this would be compressed
      ratio: compressedSize / originalSize,
    };
  }

  private calculateSize(value: any): number {
    return JSON.stringify(value).length;
  }

  private async generateKeysFromPattern(
    pattern: string,
    context?: A2AToolContext,
  ): Promise<string[]> {
    // Generate possible keys based on pattern
    const keys: string[] = [];

    if (pattern.includes("*")) {
      // Find matching keys
      const regex = new RegExp(pattern.replace(/\*/g, ".*"));
      for (const key of this.entries.keys()) {
        if (regex.test(key)) {
          keys.push(key);
        }
      }
    } else {
      keys.push(pattern);
    }

    return keys;
  }

  private async preloadKeys(keys: string[]): Promise<void> {
    // Simulate preloading
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  private recordHit(key: string, retrievalTime: number): void {
    this.metrics.totalHits++;
    this.metrics.averageRetrievalTime =
      (this.metrics.averageRetrievalTime + retrievalTime) / 2;
  }

  private recordMiss(key: string): void {
    this.metrics.totalMisses++;
  }

  private startMaintenanceTasks(): void {
    // Cleanup expired entries every 5 minutes
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, 300000);

    // Update access patterns every minute
    setInterval(() => {
      this.analyzeAccessPatterns();
    }, 60000);
  }

  private async cleanupExpiredEntries(): Promise<void> {
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.entries) {
      if (this.isExpired(entry)) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      await this.delete(key);
    }

    if (expiredKeys.length > 0) {
      this.logger.debug("Cleaned up expired cache entries", {
        count: expiredKeys.length,
      });
    }
  }

  private analyzeAccessPatterns(): void {
    // Analyze patterns for optimization
    for (const [key, accesses] of this.accessPatterns) {
      if (accesses.length < 2) continue;

      // Calculate access frequency
      const timeWindow = 3600000; // 1 hour
      const now = Date.now();
      const recentAccesses = accesses.filter((time) => now - time < timeWindow);

      if (recentAccesses.length > 10) {
        // This is a hot key, consider extended TTL
        const entry = this.entries.get(key);
        if (entry && entry.ttl < this.config.maxTTL) {
          entry.ttl = Math.min(entry.ttl * 1.5, this.config.maxTTL);
        }
      }
    }
  }
}

/**
 * Connection pool manager for A2A tools
 */
export class ConnectionPoolManager extends EventEmitter {
  private logger: Logger;
  private pools = new Map<string, ConnectionPool>();
  private globalMetrics: ConnectionPoolMetrics = {
    activeConnections: 0,
    idleConnections: 0,
    totalConnections: 0,
    connectionUtilization: 0,
    averageLatency: 0,
    errorRate: 0,
    throughput: 0,
    queueLength: 0,
  };

  constructor(private config: ConnectionPoolConfiguration) {
    super();
    this.logger = new Logger("ConnectionPoolManager");

    this.startHealthChecks();
    this.logger.info("Connection Pool Manager initialized", {
      minConnections: config.minConnections,
      maxConnections: config.maxConnections,
    });
  }

  /**
   * Get or create connection pool for a tool
   */
  getPool(toolId: string): ConnectionPool {
    if (!this.pools.has(toolId)) {
      const pool = new ConnectionPool(toolId, this.config);
      this.pools.set(toolId, pool);

      // Subscribe to pool events
      pool.on("connection_created", (connection) => {
        this.updateGlobalMetrics();
        this.emit("connection_created", { toolId, connection });
      });

      pool.on("connection_closed", (connection) => {
        this.updateGlobalMetrics();
        this.emit("connection_closed", { toolId, connection });
      });
    }

    return this.pools.get(toolId)!;
  }

  /**
   * Acquire connection for tool execution
   */
  async acquireConnection(toolId: string, timeout = 5000): Promise<Connection> {
    const pool = this.getPool(toolId);
    return pool.acquire(timeout);
  }

  /**
   * Release connection back to pool
   */
  async releaseConnection(
    toolId: string,
    connection: Connection,
  ): Promise<void> {
    const pool = this.pools.get(toolId);
    if (pool) {
      pool.release(connection);
    }
  }

  /**
   * Get aggregate metrics across all pools
   */
  getMetrics(): ConnectionPoolMetrics {
    this.updateGlobalMetrics();
    return { ...this.globalMetrics };
  }

  /**
   * Get metrics for specific tool
   */
  getToolMetrics(toolId: string): ConnectionPoolMetrics | null {
    const pool = this.pools.get(toolId);
    return pool ? pool.getMetrics() : null;
  }

  /**
   * Close all connections and pools
   */
  async shutdown(): Promise<void> {
    this.logger.info("Shutting down connection pools");

    const shutdownPromises = Array.from(this.pools.values()).map((pool) =>
      pool.shutdown(),
    );
    await Promise.all(shutdownPromises);

    this.pools.clear();
    this.logger.info("Connection pool shutdown completed");
  }

  private updateGlobalMetrics(): void {
    let activeConnections = 0;
    let idleConnections = 0;
    let totalConnections = 0;
    let totalLatency = 0;
    let totalErrors = 0;
    let totalThroughput = 0;
    let totalQueueLength = 0;

    for (const pool of this.pools.values()) {
      const metrics = pool.getMetrics();
      activeConnections += metrics.activeConnections;
      idleConnections += metrics.idleConnections;
      totalConnections += metrics.totalConnections;
      totalLatency += metrics.averageLatency;
      totalErrors += metrics.errorRate;
      totalThroughput += metrics.throughput;
      totalQueueLength += metrics.queueLength;
    }

    const poolCount = this.pools.size;

    this.globalMetrics = {
      activeConnections,
      idleConnections,
      totalConnections,
      connectionUtilization:
        totalConnections > 0 ? activeConnections / totalConnections : 0,
      averageLatency: poolCount > 0 ? totalLatency / poolCount : 0,
      errorRate: poolCount > 0 ? totalErrors / poolCount : 0,
      throughput: totalThroughput,
      queueLength: totalQueueLength,
    };
  }

  private startHealthChecks(): void {
    setInterval(() => {
      this.performHealthChecks();
    }, this.config.healthCheckInterval);
  }

  private async performHealthChecks(): Promise<void> {
    const healthCheckPromises = Array.from(this.pools.values()).map((pool) =>
      pool.performHealthCheck().catch((error) => {
        this.logger.warn("Pool health check failed", {
          toolId: pool.toolId,
          error: error.message,
        });
      }),
    );

    await Promise.all(healthCheckPromises);
  }
}

/**
 * Individual connection pool for a specific tool
 */
class ConnectionPool extends EventEmitter {
  private connections = new Map<string, Connection>();
  private queue: Array<{
    resolve: (connection: Connection) => void;
    reject: (error: Error) => void;
    timeout: ReturnType<typeof setTimeout>;
  }> = [];

  private metrics: ConnectionPoolMetrics = {
    activeConnections: 0,
    idleConnections: 0,
    totalConnections: 0,
    connectionUtilization: 0,
    averageLatency: 0,
    errorRate: 0,
    throughput: 0,
    queueLength: 0,
  };

  constructor(
    public readonly toolId: string,
    private config: ConnectionPoolConfiguration,
  ) {
    super();

    // Initialize minimum connections
    this.initializeConnections();
  }

  async acquire(timeout: number): Promise<Connection> {
    // Try to get idle connection first
    const idleConnection = this.findIdleConnection();
    if (idleConnection) {
      idleConnection.status = "active";
      idleConnection.lastUsed = new Date();
      this.updateMetrics();
      return idleConnection;
    }

    // Create new connection if under limit
    if (this.connections.size < this.config.maxConnections) {
      const connection = await this.createConnection();
      return connection;
    }

    // Queue request
    return new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        this.removeFromQueue(resolve);
        reject(new Error("Connection acquisition timeout"));
      }, timeout);

      this.queue.push({ resolve, reject, timeout: timeoutHandle });
      this.metrics.queueLength = this.queue.length;
    });
  }

  release(connection: Connection): void {
    if (connection.status === "active") {
      connection.status = "idle";
      connection.useCount++;

      // Process queue if any
      if (this.queue.length > 0) {
        const queued = this.queue.shift()!;
        clearTimeout(queued.timeout);
        connection.status = "active";
        connection.lastUsed = new Date();
        queued.resolve(connection);
      }

      this.updateMetrics();
    }
  }

  async performHealthCheck(): Promise<void> {
    const unhealthyConnections: string[] = [];

    for (const [id, connection] of this.connections) {
      if (await this.isConnectionHealthy(connection)) {
        if (connection.status === "unhealthy") {
          connection.status = "idle";
        }
      } else {
        connection.status = "unhealthy";
        unhealthyConnections.push(id);
      }
    }

    // Remove unhealthy connections
    for (const id of unhealthyConnections) {
      await this.removeConnection(id);
    }

    // Ensure minimum connections
    await this.ensureMinimumConnections();
  }

  getMetrics(): ConnectionPoolMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  async shutdown(): Promise<void> {
    // Cancel all queued requests
    for (const queued of this.queue) {
      clearTimeout(queued.timeout);
      queued.reject(new Error("Connection pool shutting down"));
    }
    this.queue.length = 0;

    // Close all connections
    const closePromises = Array.from(this.connections.keys()).map((id) =>
      this.removeConnection(id),
    );

    await Promise.all(closePromises);
  }

  private async initializeConnections(): Promise<void> {
    const promises = Array.from({ length: this.config.minConnections }, () =>
      this.createConnection(),
    );

    await Promise.all(promises);
  }

  private async createConnection(): Promise<Connection> {
    const connection: Connection = {
      id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      toolId: this.toolId,
      status: "active",
      createdAt: new Date(),
      lastUsed: new Date(),
      useCount: 0,
      errorCount: 0,
      latency: 0,
      metadata: {},
    };

    this.connections.set(connection.id, connection);
    this.updateMetrics();

    this.emit("connection_created", connection);
    return connection;
  }

  private async removeConnection(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.status = "closed";
      this.connections.delete(connectionId);
      this.updateMetrics();

      this.emit("connection_closed", connection);
    }
  }

  private findIdleConnection(): Connection | null {
    for (const connection of this.connections.values()) {
      if (connection.status === "idle") {
        return connection;
      }
    }
    return null;
  }

  private async isConnectionHealthy(connection: Connection): Promise<boolean> {
    // Simple health check - check if connection is too old or has too many errors
    const maxAge = 3600000; // 1 hour
    const maxErrors = 10;

    const age = Date.now() - connection.createdAt.getTime();

    return age < maxAge && connection.errorCount < maxErrors;
  }

  private async ensureMinimumConnections(): Promise<void> {
    const currentCount = this.connections.size;
    const needed = this.config.minConnections - currentCount;

    if (needed > 0) {
      const promises = Array.from({ length: needed }, () =>
        this.createConnection(),
      );
      await Promise.all(promises);
    }
  }

  private removeFromQueue(resolve: (connection: Connection) => void): void {
    const index = this.queue.findIndex((item) => item.resolve === resolve);
    if (index >= 0) {
      this.queue.splice(index, 1);
      this.metrics.queueLength = this.queue.length;
    }
  }

  private updateMetrics(): void {
    let activeCount = 0;
    let idleCount = 0;
    let totalLatency = 0;
    let totalErrors = 0;
    let totalUses = 0;

    for (const connection of this.connections.values()) {
      if (connection.status === "active") activeCount++;
      if (connection.status === "idle") idleCount++;

      totalLatency += connection.latency;
      totalErrors += connection.errorCount;
      totalUses += connection.useCount;
    }

    const totalConnections = this.connections.size;

    this.metrics = {
      activeConnections: activeCount,
      idleConnections: idleCount,
      totalConnections,
      connectionUtilization:
        totalConnections > 0 ? activeCount / totalConnections : 0,
      averageLatency:
        totalConnections > 0 ? totalLatency / totalConnections : 0,
      errorRate: totalConnections > 0 ? totalErrors / totalConnections : 0,
      throughput:
        totalUses /
        Math.max(
          (Date.now() -
            this.connections.values().next().value?.createdAt?.getTime() ||
            Date.now()) / 1000,
          1,
        ),
      queueLength: this.queue.length,
    };
  }
}

/**
 * Combined caching and connection pool service
 */
export class CachingConnectionPoolService extends EventEmitter {
  public readonly cache: IntelligentCacheManager;
  public readonly connectionPool: ConnectionPoolManager;
  private logger: Logger;

  constructor(
    cacheConfig: CacheConfiguration,
    poolConfig: ConnectionPoolConfiguration,
  ) {
    super();
    this.logger = new Logger("CachingConnectionPoolService");

    this.cache = new IntelligentCacheManager(cacheConfig);
    this.connectionPool = new ConnectionPoolManager(poolConfig);

    // Bridge events
    this.cache.on("cache_hit", (data) => this.emit("cache_hit", data));
    this.cache.on("cache_miss", (data) => this.emit("cache_miss", data));
    this.connectionPool.on("connection_created", (data) =>
      this.emit("connection_created", data),
    );
    this.connectionPool.on("connection_closed", (data) =>
      this.emit("connection_closed", data),
    );

    this.logger.info("Caching and Connection Pool Service initialized");
  }

  /**
   * Execute tool with caching and connection pooling
   */
  async executeWithOptimizations(
    invocation: A2AToolInvocation,
    executor: (connection: Connection) => Promise<A2AToolResponse>,
  ): Promise<A2AToolResponse> {
    const cacheKey = this.generateCacheKey(invocation);

    // Try cache first
    const cached = await this.cache.get<A2AToolResponse>(
      cacheKey,
      invocation.context,
    );
    if (cached) {
      return cached;
    }

    // Acquire connection and execute
    const connection = await this.connectionPool.acquireConnection(
      invocation.toolId,
    );

    try {
      const response = await executor(connection);

      // Cache successful responses
      if (response.success) {
        await this.cache.set(cacheKey, response, {
          ttl: 300000, // 5 minutes
          tags: [invocation.toolId, invocation.context.agentType],
          context: invocation.context,
        });
      }

      return response;
    } finally {
      await this.connectionPool.releaseConnection(
        invocation.toolId,
        connection,
      );
    }
  }

  /**
   * Get comprehensive service metrics
   */
  getServiceMetrics(): {
    cache: CacheMetrics;
    connectionPool: ConnectionPoolMetrics;
    combined: {
      totalOptimizationSavings: number;
      averageResponseTime: number;
      systemEfficiency: number;
    };
  } {
    const cacheMetrics = this.cache.getMetrics();
    const poolMetrics = this.connectionPool.getMetrics();

    return {
      cache: cacheMetrics,
      connectionPool: poolMetrics,
      combined: {
        totalOptimizationSavings:
          cacheMetrics.hitRate * 0.8 + poolMetrics.connectionUtilization * 0.2,
        averageResponseTime:
          (cacheMetrics.averageRetrievalTime + poolMetrics.averageLatency) / 2,
        systemEfficiency:
          (cacheMetrics.hitRate + poolMetrics.connectionUtilization) / 2,
      },
    };
  }

  /**
   * Shutdown service gracefully
   */
  async shutdown(): Promise<void> {
    this.logger.info("Shutting down caching and connection pool service");

    await this.connectionPool.shutdown();

    this.logger.info("Service shutdown completed");
  }

  private generateCacheKey(invocation: A2AToolInvocation): string {
    const keyData = {
      toolId: invocation.toolId,
      parameters: invocation.parameters,
      trustLevel: invocation.context.trustLevel,
      agentType: invocation.context.agentType,
    };

    return `a2a_cached:${Buffer.from(JSON.stringify(keyData)).toString("base64")}`;
  }
}
