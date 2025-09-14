/**
 * Unified API Abstraction Layer
 *
 * Single interface for all Google AI models with <75ms routing optimization
 * Handles model selection, fallback strategies, and performance optimization
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { ModelRequest, ModelResponse, StreamChunk, HealthCheck } from "./base-model-adapter.js";
import { EnhancedStreamingConfig, StreamingContext, StreamSession } from "../streaming/enhanced-streaming-api.js";
import { VideoStreamRequest, AudioStreamRequest, VideoStreamResponse, AudioStreamResponse, MultiModalChunk } from "../types/streaming.js";
export interface UnifiedAPIConfig {
    routing: {
        strategy: "latency" | "cost" | "quality" | "balanced" | "custom";
        latencyTarget: number;
        fallbackEnabled: boolean;
        circuitBreakerThreshold: number;
        retryAttempts: number;
        retryDelay: number;
    };
    caching: {
        enabled: boolean;
        ttl: number;
        maxSize: number;
        keyStrategy: "prompt" | "semantic" | "hybrid";
    };
    monitoring: {
        metricsEnabled: boolean;
        healthCheckInterval: number;
        performanceThreshold: number;
    };
    models: {
        gemini: any[];
        deepmind: any[];
        jules: any[];
    };
    streaming?: {
        enabled: boolean;
        config: EnhancedStreamingConfig;
    };
}
export interface RoutingDecision {
    selectedAdapter: string;
    confidence: number;
    reasoning: string;
    fallbacks: string[];
    routingTime: number;
    factors: {
        latency: number;
        cost: number;
        availability: number;
        capability: number;
    };
}
export interface UnifiedMetrics {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageLatency: number;
    averageRoutingTime: number;
    cacheHitRate: number;
    modelDistribution: Record<string, number>;
    errorDistribution: Record<string, number>;
    costMetrics: {
        totalCost: number;
        costPerRequest: number;
        costPerToken: number;
    };
    performanceMetrics: {
        p50Latency: number;
        p95Latency: number;
        p99Latency: number;
        throughput: number;
    };
}
export declare class UnifiedAPI extends EventEmitter {
    private logger;
    private config;
    private adapters;
    private circuitBreakers;
    private metrics;
    private performanceHistory;
    private routingDecisionCache;
    private capabilityMatrix;
    private latencyBaseline;
    private streamingAPI?;
    private streamingSessions;
    constructor(config: UnifiedAPIConfig);
    /**
     * Main generation method with unified interface
     */
    generate(request: ModelRequest): Promise<ModelResponse>;
    /**
     * Streaming generation with unified interface
     */
    generateStream(request: ModelRequest): AsyncIterableIterator<StreamChunk>;
    /**
     * Make fast routing decision (<75ms target)
     */
    private makeRoutingDecision;
    /**
     * Filter adapters by capability (fast lookup using pre-built matrix)
     */
    private filterCapableAdapters;
    /**
     * Score adapters quickly using cached metrics
     */
    private scoreAdapters;
    /**
     * Execute request with specific adapter and handle fallbacks
     */
    private executeWithAdapter;
    /**
     * Initialize all configured adapters
     */
    private initializeAdapters;
    /**
     * Update capability matrix for fast lookups
     */
    private updateCapabilityMatrix;
    /**
     * Extract required capabilities from request
     */
    private extractRequiredCapabilities;
    /**
     * Calculate latency score (higher is better)
     */
    private calculateLatencyScore;
    /**
     * Calculate cost score (higher is better for lower cost)
     */
    private calculateCostScore;
    /**
     * Calculate availability score based on circuit breaker state
     */
    private calculateAvailabilityScore;
    /**
     * Calculate capability score based on feature match
     */
    private calculateCapabilityScore;
    /**
     * Filter adapters by circuit breaker state
     */
    private filterAvailableAdapters;
    /**
     * Record adapter failure and update circuit breaker
     */
    private recordAdapterFailure;
    /**
     * Reset circuit breaker on successful request
     */
    private resetCircuitBreaker;
    /**
     * Select fallback adapter
     */
    private selectFallbackAdapter;
    /**
     * Handle request errors with retry logic
     */
    private handleRequestError;
    /**
     * Update performance metrics
     */
    private updateMetrics;
    /**
     * Record performance data for optimization
     */
    private recordPerformance;
    /**
     * Generate routing cache key
     */
    private generateRoutingCacheKey;
    /**
     * Setup monitoring and health checks
     */
    private setupMonitoring;
    /**
     * Start health checks for all adapters
     */
    private startHealthChecks;
    /**
     * Analyze performance and emit insights
     */
    private analyzePerformance;
    /**
     * Optimize routing based on performance data
     */
    private optimizeRouting;
    /**
     * Get comprehensive metrics
     */
    getMetrics(): UnifiedMetrics;
    /**
     * Get routing decision for a request (without executing)
     */
    getRoutingDecision(request: ModelRequest): Promise<RoutingDecision>;
    /**
     * Get adapter health status
     */
    getAdapterHealth(): Promise<Record<string, HealthCheck>>;
    /**
     * Create a new streaming session with full multimedia support
     */
    createStreamingSession(sessionId: string, type: "video" | "audio" | "multimodal" | "data", context: StreamingContext): Promise<StreamSession | null>;
    /**
     * Start video streaming with real-time optimization
     */
    startVideoStream(sessionId: string, request: VideoStreamRequest, context: StreamingContext): Promise<VideoStreamResponse | null>;
    /**
     * Start audio streaming with low-latency optimization
     */
    startAudioStream(sessionId: string, request: AudioStreamRequest, context: StreamingContext): Promise<AudioStreamResponse | null>;
    /**
     * Process multi-modal chunks with synchronization
     */
    processMultiModalChunk(sessionId: string, chunk: MultiModalChunk): Promise<boolean>;
    /**
     * Get streaming session metrics
     */
    getStreamingMetrics(sessionId?: string): any;
    /**
     * Adapt stream quality in real-time
     */
    adaptStreamQuality(sessionId: string, streamId: string, _targetQuality?: any): Promise<boolean>;
    /**
     * End streaming session and cleanup
     */
    endStreamingSession(sessionId: string): Promise<boolean>;
    /**
     * Emergency stream degradation
     */
    emergencyStreamDegrade(sessionId: string, reason: string): Promise<boolean>;
    /**
     * Initialize streaming API if enabled
     */
    private initializeStreaming;
    /**
     * Validate streaming latency against targets
     */
    private validateStreamingLatency;
    /**
     * Create default streaming configuration
     */
    private createDefaultStreamingConfig;
    private initializeMetrics;
    private updateErrorMetrics;
    private estimateRequestCost;
    private getBudgetThreshold;
    private calculateCustomScore;
    private generateReasoningExplanation;
    private calculateAverageRoutingTime;
    private getTotalTokensProcessed;
    private sanitizeRequest;
    private sanitizeResponse;
}
//# sourceMappingURL=unified-api.d.ts.map