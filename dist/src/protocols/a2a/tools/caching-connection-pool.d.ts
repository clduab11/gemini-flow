/**
 * Caching and Connection Pool Layer
 *
 * Provides intelligent caching strategies and connection pooling for A2A tools.
 * Includes adaptive cache management, connection lifecycle management, and
 * resource optimization with monitoring and analytics.
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { A2AToolInvocation, A2AToolResponse, A2AToolContext } from "./a2a-tool-wrapper.js";
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
    schedule: string;
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
    hotKeys: Array<{
        key: string;
        hits: number;
    }>;
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
export declare class IntelligentCacheManager extends EventEmitter {
    private config;
    private logger;
    private baseCache;
    private entries;
    private accessPatterns;
    private tagIndex;
    private dependencyGraph;
    private metrics;
    constructor(config: CacheConfiguration);
    /**
     * Get value from cache with intelligent access tracking
     */
    get<T = any>(key: string, context?: A2AToolContext): Promise<T | null>;
    /**
     * Set value in cache with intelligent placement
     */
    set(key: string, value: any, options?: {
        ttl?: number;
        tags?: string[];
        dependencies?: string[];
        priority?: number;
        context?: A2AToolContext;
    }): Promise<void>;
    /**
     * Delete entry from cache
     */
    delete(key: string): Promise<void>;
    /**
     * Invalidate cache entries by tags
     */
    invalidateByTag(tag: string): Promise<void>;
    /**
     * Warm up cache with predictive loading
     */
    warmUp(patterns: string[], context?: A2AToolContext): Promise<void>;
    /**
     * Get cache statistics and metrics
     */
    getMetrics(): CacheMetrics;
    /**
     * Private helper methods
     */
    private isExpired;
    private updateAccessPattern;
    private performPredictivePrefetch;
    private predictRelatedKeys;
    private ensureCapacity;
    private evictEntries;
    private calculateEvictionScore;
    private updateTagIndex;
    private removeFromTagIndex;
    private updateDependencyGraph;
    private removeFromDependencyGraph;
    private compressValue;
    private calculateSize;
    private generateKeysFromPattern;
    private preloadKeys;
    private recordHit;
    private recordMiss;
    private startMaintenanceTasks;
    private cleanupExpiredEntries;
    private analyzeAccessPatterns;
}
/**
 * Connection pool manager for A2A tools
 */
export declare class ConnectionPoolManager extends EventEmitter {
    private config;
    private logger;
    private pools;
    private globalMetrics;
    constructor(config: ConnectionPoolConfiguration);
    /**
     * Get or create connection pool for a tool
     */
    getPool(toolId: string): ConnectionPool;
    /**
     * Acquire connection for tool execution
     */
    acquireConnection(toolId: string, timeout?: number): Promise<Connection>;
    /**
     * Release connection back to pool
     */
    releaseConnection(toolId: string, connection: Connection): Promise<void>;
    /**
     * Get aggregate metrics across all pools
     */
    getMetrics(): ConnectionPoolMetrics;
    /**
     * Get metrics for specific tool
     */
    getToolMetrics(toolId: string): ConnectionPoolMetrics | null;
    /**
     * Close all connections and pools
     */
    shutdown(): Promise<void>;
    private updateGlobalMetrics;
    private startHealthChecks;
    private performHealthChecks;
}
/**
 * Individual connection pool for a specific tool
 */
declare class ConnectionPool extends EventEmitter {
    readonly toolId: string;
    private config;
    private connections;
    private queue;
    private metrics;
    constructor(toolId: string, config: ConnectionPoolConfiguration);
    acquire(timeout: number): Promise<Connection>;
    release(connection: Connection): void;
    performHealthCheck(): Promise<void>;
    getMetrics(): ConnectionPoolMetrics;
    shutdown(): Promise<void>;
    private initializeConnections;
    private createConnection;
    private removeConnection;
    private findIdleConnection;
    private isConnectionHealthy;
    private ensureMinimumConnections;
    private removeFromQueue;
    private updateMetrics;
}
/**
 * Combined caching and connection pool service
 */
export declare class CachingConnectionPoolService extends EventEmitter {
    readonly cache: IntelligentCacheManager;
    readonly connectionPool: ConnectionPoolManager;
    private logger;
    constructor(cacheConfig: CacheConfiguration, poolConfig: ConnectionPoolConfiguration);
    /**
     * Execute tool with caching and connection pooling
     */
    executeWithOptimizations(invocation: A2AToolInvocation, executor: (connection: Connection) => Promise<A2AToolResponse>): Promise<A2AToolResponse>;
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
    };
    /**
     * Shutdown service gracefully
     */
    shutdown(): Promise<void>;
    private generateCacheKey;
}
export {};
//# sourceMappingURL=caching-connection-pool.d.ts.map