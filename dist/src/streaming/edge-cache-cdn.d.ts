/**
 * Edge Caching and CDN Integration
 *
 * Advanced caching and content delivery system with:
 * - Geographic edge caching
 * - Intelligent cache invalidation
 * - Multi-CDN optimization
 * - Predictive pre-caching
 * - Real-time cache analytics
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { EdgeCacheConfig, CDNConfiguration } from "../types/streaming.js";
export interface CacheEntry {
    id: string;
    key: string;
    data: ArrayBuffer | string;
    metadata: {
        size: number;
        mimeType: string;
        encoding?: string;
        quality: string;
        resolution?: string;
        bitrate?: number;
        checksum: string;
    };
    timestamps: {
        created: number;
        lastAccessed: number;
        lastModified: number;
        expires: number;
    };
    access: {
        count: number;
        frequency: number;
        sources: string[];
        geographic: string[];
    };
    status: "fresh" | "stale" | "expired" | "invalid";
    tags: string[];
    priority: number;
}
export interface EdgeNode {
    id: string;
    location: {
        region: string;
        country: string;
        city: string;
        coordinates: {
            lat: number;
            lng: number;
        };
    };
    capacity: {
        storage: number;
        bandwidth: number;
        connections: number;
    };
    current: {
        storageUsed: number;
        bandwidthUsed: number;
        activeConnections: number;
        cacheHitRate: number;
    };
    performance: {
        averageLatency: number;
        reliability: number;
        loadScore: number;
    };
    status: "online" | "degraded" | "offline" | "maintenance";
    capabilities: string[];
}
export interface CacheStrategy {
    type: "lru" | "lfu" | "ttl" | "adaptive" | "predictive";
    parameters: {
        maxAge: number;
        maxSize: number;
        evictionThreshold: number;
        prefetchProbability: number;
        geographicRadius: number;
    };
    rules: CacheRule[];
}
export interface CacheRule {
    pattern: string | RegExp;
    action: "cache" | "bypass" | "prefetch" | "invalidate";
    conditions: {
        contentType?: string[];
        size?: {
            min?: number;
            max?: number;
        };
        quality?: string[];
        geographic?: string[];
        timeOfDay?: {
            start: number;
            end: number;
        };
    };
    priority: number;
    ttl?: number;
}
export interface CDNEndpoint {
    id: string;
    provider: string;
    url: string;
    region: string;
    capabilities: string[];
    performance: {
        latency: number;
        bandwidth: number;
        reliability: number;
        cost: number;
    };
    status: "active" | "standby" | "failed";
}
export interface CacheAnalytics {
    hitRate: number;
    missRate: number;
    bandwidth: {
        saved: number;
        total: number;
        efficiency: number;
    };
    latency: {
        cached: number;
        origin: number;
        improvement: number;
    };
    storage: {
        used: number;
        available: number;
        efficiency: number;
    };
    geographic: Map<string, {
        requests: number;
        hits: number;
        misses: number;
        bandwidth: number;
    }>;
    trends: {
        hourly: number[];
        daily: number[];
        weekly: number[];
    };
}
export declare class EdgeCacheCDN extends EventEmitter {
    private logger;
    private config;
    private cdnConfig;
    private edgeNodes;
    private cacheEntries;
    private cacheStrategies;
    private cdnEndpoints;
    private analytics;
    private nodeSelector;
    private predictionEngine;
    private invalidationManager;
    private loadBalancer;
    private compressionEngine;
    constructor(config: EdgeCacheConfig, cdnConfig: CDNConfiguration);
    /**
     * Cache multimedia content with intelligent placement
     */
    cacheContent(key: string, data: ArrayBuffer | string, metadata: any, options?: {
        strategy?: string;
        ttl?: number;
        tags?: string[];
        geographic?: string[];
        priority?: number;
    }): Promise<boolean>;
    /**
     * Retrieve content from cache with fallback to origin
     */
    retrieveContent(key: string, requestInfo?: {
        userLocation?: {
            lat: number;
            lng: number;
        };
        quality?: string;
        acceptEncoding?: string[];
    }): Promise<{
        data: ArrayBuffer | string;
        metadata: any;
        source: "cache" | "origin";
    } | null>;
    /**
     * Invalidate cached content
     */
    invalidateContent(pattern: string | RegExp, scope?: "single" | "pattern" | "tags" | "global", options?: {
        cascade?: boolean;
        immediate?: boolean;
        notify?: boolean;
    }): Promise<number>;
    /**
     * Prefetch content based on predictions
     */
    prefetchContent(predictions: Array<{
        key: string;
        probability: number;
        metadata: any;
        targetRegions?: string[];
    }>): Promise<number>;
    /**
     * Get cache analytics
     */
    getAnalytics(timeRange?: {
        start: number;
        end: number;
    }): CacheAnalytics;
    /**
     * Optimize cache distribution
     */
    optimizeDistribution(): Promise<void>;
    /**
     * Select optimal caching nodes
     */
    private selectCachingNodes;
    /**
     * Select optimal retrieval node
     */
    private selectRetrievalNode;
    /**
     * Check if content should be cached
     */
    private shouldCache;
    /**
     * Check if key/metadata matches cache rule
     */
    private matchesRule;
    /**
     * Store cache entry in edge node
     */
    private storeCacheEntry;
    /**
     * Retrieve cache entry from edge node
     */
    private retrieveFromNode;
    /**
     * Fetch content from origin server
     */
    private fetchFromOrigin;
    /**
     * Perform actual origin fetch
     */
    private performOriginFetch;
    /**
     * Refresh stale cache entry
     */
    private refreshCacheEntry;
    /**
     * Evict entries from node to make space
     */
    private evictEntries;
    /**
     * Calculate eviction score (lower = evict first)
     */
    private calculateEvictionScore;
    /**
     * Check if entry is stored in specific node
     */
    private isEntryInNode;
    /**
     * Trigger predictive caching
     */
    private triggerPredictiveCaching;
    /**
     * Analyze access patterns
     */
    private analyzeAccessPatterns;
    /**
     * Identify optimization opportunities
     */
    private identifyOptimizationOpportunities;
    /**
     * Execute optimization
     */
    private executeOptimization;
    /**
     * Get region from coordinates
     */
    private getRegionFromCoordinates;
    /**
     * Calculate checksum for data integrity
     */
    private calculateChecksum;
    /**
     * Generate unique entry ID
     */
    private generateEntryId;
    /**
     * Initialize analytics
     */
    private initializeAnalytics;
    /**
     * Initialize edge nodes
     */
    private initializeEdgeNodes;
    /**
     * Initialize CDN endpoints
     */
    private initializeCDNEndpoints;
    /**
     * Setup cache strategies
     */
    private setupCacheStrategies;
    /**
     * Update analytics
     */
    private updateAnalytics;
    /**
     * Start analytics collection
     */
    private startAnalyticsCollection;
    /**
     * Collect current analytics
     */
    private collectAnalytics;
    /**
     * Clean up resources
     */
    cleanup(): void;
}
//# sourceMappingURL=edge-cache-cdn.d.ts.map