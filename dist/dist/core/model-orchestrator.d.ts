export class ModelOrchestrator extends EventEmitter<[never]> {
    constructor(config: any);
    models: Map<any, any>;
    clients: Map<any, any>;
    router: ModelRouter;
    auth: AuthenticationManager;
    performance: PerformanceMonitor;
    cache: CacheManager;
    logger: Logger;
    metrics: {
        totalRequests: number;
        routingTime: number;
        modelSwitches: number;
        cacheHits: number;
        failovers: number;
        tierUpgrades: number;
    };
    /**
     * Initialize with default Google AI models
     */
    initializeDefaultModels(): void;
    /**
     * Add a new model configuration
     */
    addModel(config: any): void;
    /**
     * Initialize model client based on configuration
     */
    initializeModelClient(config: any): Promise<void>;
    /**
     * Main orchestration method - route request to optimal model
     */
    orchestrate(prompt: any, context: any): any;
    /**
     * Execute request with specific model
     */
    executeWithModel(modelName: any, prompt: any, context: any): Promise<{
        modelUsed: any;
        content: any;
        latency: number;
        tokenUsage: {
            input: number;
            output: number;
            total: number;
        };
        cost: number;
        cached: boolean;
        metadata: {
            finishReason: any;
            safety: any;
            model: any;
            tier: any;
        };
    }>;
    /**
     * Execute Vertex AI request
     */
    executeVertexRequest(client: any, prompt: any, context: any): Promise<void>;
    /**
     * Execute Gemini API request
     */
    executeGeminiRequest(client: any, prompt: any, context: any): Promise<any>;
    /**
     * Generate cache key for request
     */
    generateCacheKey(prompt: any, model: any, context: any): string;
    /**
     * Setup performance monitoring
     */
    setupPerformanceMonitoring(): void;
    /**
     * Analyze current performance
     */
    analyzePerformance(): void;
    /**
     * Optimize routing algorithms based on performance data
     */
    optimizeRouting(): void;
    /**
     * Get comprehensive metrics
     */
    getMetrics(): {
        avgRoutingTime: number;
        cacheHitRate: number;
        failoverRate: number;
        modelDistribution: any;
        performance: {};
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
    healthCheck(): Promise<{}>;
    /**
     * Shutdown orchestrator and cleanup resources
     */
    shutdown(): void;
}
import { EventEmitter } from "events";
import { ModelRouter } from "./model-router.js";
import { AuthenticationManager } from "./auth-manager.js";
import { PerformanceMonitor } from "./performance-monitor.js";
import { CacheManager } from "./cache-manager.js";
import { Logger } from "../utils/logger.js";
//# sourceMappingURL=model-orchestrator.d.ts.map