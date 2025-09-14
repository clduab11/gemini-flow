export class ModelRouter extends EventEmitter<[never]> {
    constructor();
    logger: Logger;
    rules: Map<any, any>;
    performance: Map<any, any>;
    loadBalancer: Map<any, any>;
    routingCache: Map<any, any>;
    cacheAccessOrder: any[];
    CACHE_LIMIT: number;
    CACHE_TTL: number;
    routingTimes: any[];
    MAX_ROUTING_TIME_SAMPLES: number;
    ROUTING_TIME_TARGET: number;
    complexityCache: Map<any, any>;
    weights: {
        latency: number;
        cost: number;
        reliability: number;
        userTier: number;
        complexity: number;
    };
    modelTierMap: Map<any, any>;
    availabilityMap: Map<any, any>;
    /**
     * Initialize default routing rules
     */
    initializeDefaultRules(): void;
    /**
     * Add a routing rule
     */
    addRule(rule: any): void;
    /**
     * Remove a routing rule
     */
    removeRule(ruleId: any): boolean;
    /**
     * High-performance model selection with <75ms guarantee
     */
    selectOptimalModel(context: any, availableModels: any): Promise<{
        modelName: any;
        confidence: number;
        reason: string;
        routingTime: number;
        fromCache: boolean;
    }>;
    /**
     * Apply routing rules to get candidate models
     */
    applyroutingRules(context: any, availableModels: any): any[];
    /**
     * Score candidate models based on multiple factors
     */
    scoreCandidates(candidates: any, context: any, availableModels: any): Promise<{
        model: any;
        score: number;
    }[]>;
    /**
     * Calculate latency score (0-1, higher is better)
     */
    calculateLatencyScore(modelLatency: any, requiredLatency: any): number;
    /**
     * Calculate cost score (0-1, higher is better)
     */
    calculateCostScore(modelCost: any, userTier: any): number;
    /**
     * Calculate reliability score based on historical performance
     */
    calculateReliabilityScore(perf: any): number;
    /**
     * Calculate tier compatibility score
     */
    calculateTierScore(modelTier: any, userTier: any): 1 | 0.1;
    /**
     * Calculate capability match score
     */
    calculateCapabilityScore(modelCaps: any, requiredCaps: any): number;
    /**
     * Apply load balancing to final selection
     */
    applyLoadBalancing(scoredCandidates: any): any;
    /**
     * Update load balancer counters
     */
    updateLoadBalancer(modelName: any): void;
    /**
     * Reset load balancer counters
     */
    resetLoadBalancer(): void;
    /**
     * Get fallback model based on user tier
     */
    getFallbackModel(userTier: any, availableModels: any): any;
    /**
     * Fast complexity analysis for intelligent routing
     */
    analyzeRequestComplexity(context: any): any;
    /**
     * Fast candidate selection based on tier and complexity
     */
    fastCandidateSelection(context: any, availableModels: any, complexity: any): any[];
    /**
     * Optimized model scoring with minimal overhead
     */
    fastModelScoring(candidates: any, context: any, availableModels: any, complexity: any): {
        modelName: any;
        confidence: number;
        reason: string;
    };
    /**
     * LRU cache operations
     */
    getFromCache(key: any): any;
    updateCache(key: any, modelName: any): void;
    isCacheValid(entry: any): boolean;
    updateCacheAccess(key: any): void;
    removeFromCacheOrder(key: any): void;
    /**
     * Performance monitoring and optimization
     */
    recordRoutingTime(time: any): void;
    emitPerformanceMetrics(): void;
    /**
     * Helper methods for fast scoring
     */
    fastLatencyScore(config: any, perf: any, context: any): 1 | 0.1 | 0.8 | 0.5;
    fastComplexityScore(config: any, complexity: any): 1 | 0.7 | 0.9 | 0.6 | 0.4;
    fastReliabilityScore(perf: any): number;
    fastCostScore(config: any, userTier: any): 1 | 0.7 | 0.3 | 0.9;
    /**
     * Complexity analysis helpers
     */
    estimateTokenCount(text: any): number;
    analyzeKeywords(text: any): number;
    analyzeStructure(text: any): number;
    isDomainSpecific(text: any, capabilities: any): boolean;
    calculateComplexityScore(factors: any): number;
    isModelSuitableForComplexity(config: any, complexity: any, context: any): any;
    /**
     * Utility methods
     */
    generateRoutingCacheKey(context: any): string;
    getTierLevel(tier: any): any;
    updateAvailabilityMap(availableModels: any): void;
    cleanupComplexityCache(): void;
    getCacheHitRate(): number;
    startPerformanceMonitoring(): void;
    cleanupCaches(): void;
    warmupComplexityAnalyzer(): void;
    /**
     * Public API methods
     */
    getRoutingPerformance(): {
        averageTime: number;
        p95Time: any;
        cacheHitRate: number;
        targetMet: boolean;
    };
    /**
     * Record model performance for future routing decisions with enhanced metrics
     */
    recordPerformance(modelName: any, latency: any, success: any, cost: any, tokenUsage: any): void;
    /**
     * Intelligent fallback strategies for model unavailability
     */
    selectFallbackModel(originalModel: any, context: any, availableModels: any, reason: any): Promise<{
        modelName: any;
        confidence: number;
        reason: string;
        routingTime: number;
        fromCache: boolean;
    }>;
    findSimilarTierModel(originalModel: any, context: any, availableModels: any): any;
    findLowerTierModel(originalModel: any, context: any, availableModels: any): any;
    getEmergencyFallback(userTier: any, availableModels: any): any;
    /**
     * Check and update model availability
     */
    updateModelAvailability(modelName: any, available: any): void;
    /**
     * Batch update model availability
     */
    updateBatchAvailability(availabilityMap: any): void;
    /**
     * Get comprehensive router statistics
     */
    getRouterStats(): {
        performance: {
            averageTime: number;
            p95Time: any;
            cacheHitRate: number;
            targetMet: boolean;
        };
        cache: {
            size: number;
            hitRate: number;
            limit: number;
        };
        availability: {
            total: number;
            available: number;
            unavailable: number;
        };
        models: {
            name: any;
            performance: any;
        }[];
    };
    /**
     * Optimize routing based on performance data
     */
    optimizeBasedOnPerformance(performanceData: any): void;
    /**
     * Get model usage statistics
     */
    getModelUsageStats(): any;
    /**
     * Get routing rules
     */
    getRules(): any[];
    /**
     * Get performance data
     */
    getPerformanceData(): any[];
}
import { EventEmitter } from "events";
import { Logger } from "../utils/logger.js";
//# sourceMappingURL=model-router.d.ts.map