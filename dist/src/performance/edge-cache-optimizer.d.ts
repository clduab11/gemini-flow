/**
 * Edge Cache Optimizer - Advanced CDN and cache warming strategies
 * Implements predictive pre-loading and intelligent cache invalidation
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
export interface CacheNode {
    id: string;
    location: {
        region: string;
        city: string;
        coordinates: {
            lat: number;
            lng: number;
        };
    };
    capacity: number;
    used: number;
    hitRate: number;
    latency: number;
    bandwidth: number;
    status: "online" | "offline" | "maintenance";
    temperature: "cold" | "warm" | "hot";
    tier: "edge" | "regional" | "origin";
}
export interface CacheItem {
    key: string;
    content: ArrayBuffer;
    size: number;
    contentType: string;
    createdAt: number;
    lastAccessed: number;
    accessCount: number;
    ttl: number;
    tags: string[];
    priority: number;
    metadata: {
        userId?: string;
        region?: string;
        contentHash: string;
        compression: "none" | "gzip" | "brotli";
    };
}
export interface CachePolicy {
    maxAge: number;
    staleWhileRevalidate: number;
    staleIfError: number;
    mustRevalidate: boolean;
    noCache: boolean;
    private: boolean;
    public: boolean;
    immutable: boolean;
}
export interface WarmingStrategy {
    type: "predictive" | "scheduled" | "reactive" | "manual";
    triggers: Array<{
        event: string;
        condition: string;
        priority: number;
    }>;
    contentSelectors: string[];
    targetNodes: string[];
    schedule?: string;
}
export interface CDNMetrics {
    hitRate: number;
    missRate: number;
    bandwidth: number;
    latency: number;
    errorRate: number;
    cacheSize: number;
    requestsPerSecond: number;
    bytesSaved: number;
    costSavings: number;
}
export declare class EdgeCacheOptimizer extends EventEmitter {
    private nodes;
    private cache;
    private policies;
    private warmingStrategies;
    private predictor;
    private invalidator;
    private loadBalancer;
    private compressionManager;
    private analyticsEngine;
    constructor();
    /**
     * Register cache node in the CDN network
     */
    registerNode(node: CacheNode): void;
    /**
     * Cache content with intelligent placement
     */
    cacheContent(key: string, content: ArrayBuffer, contentType: string, policy: CachePolicy, targetNodes?: string[]): Promise<{
        cached: string[];
        failed: string[];
        totalSize: number;
    }>;
    /**
     * Retrieve content from optimal cache node
     */
    getContent(key: string, userLocation?: {
        lat: number;
        lng: number;
    }): Promise<{
        content: ArrayBuffer | null;
        source: string;
        latency: number;
        cacheHit: boolean;
    }>;
    /**
     * Implement predictive cache warming
     */
    warmCache(strategy: WarmingStrategy): Promise<{
        itemsWarmed: number;
        nodesUpdated: string[];
        dataTransferred: number;
        estimatedHitRateImprovement: number;
    }>;
    /**
     * Intelligent cache invalidation
     */
    invalidateContent(pattern: string | RegExp, tags?: string[], cascading?: boolean): Promise<{
        invalidated: number;
        nodesAffected: string[];
        spaceFree: number;
    }>;
    /**
     * Optimize cache distribution across nodes
     */
    optimizeDistribution(): Promise<{
        migrations: number;
        dataTransferred: number;
        expectedHitRateImprovement: number;
        costSavings: number;
    }>;
    /**
     * Get comprehensive CDN metrics
     */
    getCDNMetrics(): CDNMetrics;
    /**
     * Configure CDN policy for content types
     */
    setPolicy(contentPattern: string, policy: CachePolicy): void;
    private initializeOptimizer;
    private setupDefaultPolicies;
    private selectOptimalNodes;
    private cacheOnNode;
    private findNearestNode;
    private calculateDistance;
    private isExpired;
    private decompress;
    private handleCacheMiss;
    private preloadContent;
    private scheduleWarming;
    private setupReactiveWarming;
    private evaluateCondition;
    private migrateContent;
    private replicateContent;
    private evictContent;
    private evictLRU;
    private calculatePriority;
    private calculateHash;
    private getDefaultPolicy;
    private startBackgroundOptimization;
    private cleanupExpiredContent;
}
declare class CachePredictionEngine {
    predictContent(selectors: string[], targetNodes: string[]): Promise<any[]>;
}
declare class CacheInvalidationManager {
    cascadeInvalidation(key: string, item: CacheItem): Promise<void>;
}
declare class CDNLoadBalancer {
    addNode(node: CacheNode): void;
    selectNode(): CacheNode | null;
}
declare class CompressionManager {
    compress(item: CacheItem): Promise<{
        content: ArrayBuffer;
        size: number;
        algorithm: "gzip" | "brotli";
    }>;
    decompress(content: ArrayBuffer, algorithm: string): Promise<ArrayBuffer>;
}
declare class CacheAnalyticsEngine {
    analyzeDistribution(nodes: Map<string, CacheNode>, cache: Map<string, Map<string, CacheItem>>): Promise<{
        recommendations: any[];
        expectedImprovement: number;
        costSavings: number;
    }>;
    estimateHitRateImprovement(itemsWarmed: number, dataTransferred: number): number;
}
export { CachePredictionEngine, CacheInvalidationManager, CDNLoadBalancer, CompressionManager, CacheAnalyticsEngine, };
//# sourceMappingURL=edge-cache-optimizer.d.ts.map