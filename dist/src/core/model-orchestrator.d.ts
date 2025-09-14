/**
 * Multi-Model Orchestration Engine
 *
 * Intelligent routing between Google AI models with <100ms overhead
 * Supports Gemini 2.0 Flash, DeepMind 2.5, and Vertex AI models
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
export interface ModelConfig {
    name: string;
    endpoint?: string;
    apiKey?: string;
    projectId?: string;
    location?: string;
    tier: "free" | "pro" | "enterprise";
    capabilities: string[];
    latencyTarget: number;
    costPerToken: number;
    maxTokens: number;
}
export interface RoutingContext {
    task: string;
    userTier: "free" | "pro" | "enterprise";
    priority: "low" | "medium" | "high" | "critical";
    latencyRequirement: number;
    tokenBudget?: number;
    capabilities?: string[];
    previousModel?: string;
    retryCount?: number;
}
export interface ModelResponse {
    modelUsed: string;
    content: string;
    latency: number;
    tokenUsage: {
        input: number;
        output: number;
        total: number;
    };
    cost: number;
    cached: boolean;
    metadata: any;
}
export declare class ModelOrchestrator extends EventEmitter {
    private models;
    private clients;
    private router;
    private auth;
    private performance;
    private cache;
    private logger;
    private metrics;
    constructor(config?: {
        cacheSize?: number;
        performanceThreshold?: number;
    });
    /**
     * Initialize with default Google AI models
     */
    private initializeDefaultModels;
    /**
     * Add a new model configuration
     */
    addModel(config: ModelConfig): void;
    /**
     * Initialize model client based on configuration
     */
    private initializeModelClient;
    /**
     * Main orchestration method - route request to optimal model
     */
    orchestrate(prompt: string, context: RoutingContext): Promise<ModelResponse>;
    /**
     * Execute request with specific model
     */
    private executeWithModel;
    /**
     * Execute Vertex AI request
     */
    private executeVertexRequest;
    /**
     * Execute Gemini API request
     */
    private executeGeminiRequest;
    /**
     * Generate cache key for request
     */
    private generateCacheKey;
    /**
     * Setup performance monitoring
     */
    private setupPerformanceMonitoring;
    /**
     * Analyze current performance
     */
    private analyzePerformance;
    /**
     * Optimize routing algorithms based on performance data
     */
    private optimizeRouting;
    /**
     * Get comprehensive metrics
     */
    getMetrics(): {
        avgRoutingTime: number;
        cacheHitRate: number;
        failoverRate: number;
        modelDistribution: {
            [model: string]: number;
        };
        performance: {
            [metricName: string]: import("./performance-monitor.js").PerformanceStats;
        };
        totalRequests: number;
        routingTime: number;
        modelSwitches: number;
        cacheHits: number;
        failovers: number;
        tierUpgrades: number;
    };
    /**
     * Health check for all models
     */
    healthCheck(): Promise<{
        [model: string]: boolean;
    }>;
    /**
     * Shutdown orchestrator and cleanup resources
     */
    shutdown(): void;
}
//# sourceMappingURL=model-orchestrator.d.ts.map