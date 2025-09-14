/**
 * Unified Multimedia Pipeline
 *
 * Orchestrates Imagen 4, Chirp Audio, and Lyria Music generation
 * with shared infrastructure and optimizations
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { MultimediaPipelineConfig, MultimediaPipelineResponse, MultimediaGenerationRequest, MultimediaGenerationResponse, MultimediaContext } from "../../types/multimedia.js";
export declare class MultimediaPipeline extends EventEmitter {
    private logger;
    private config;
    private performance;
    private cache;
    private imageGenerator;
    private audioProcessor;
    private musicComposer;
    private activeRequests;
    private requestQueue;
    private batchQueues;
    private batchTimers;
    private metrics;
    constructor(config: MultimediaPipelineConfig);
    /**
     * Initialize the multimedia pipeline
     */
    private initializePipeline;
    /**
     * Setup event handlers for processors
     */
    private setupEventHandlers;
    /**
     * Handle events from specialized processors
     */
    private handleProcessorEvent;
    /**
     * Generate multimedia content
     */
    generate(request: MultimediaGenerationRequest, context: MultimediaContext): Promise<MultimediaGenerationResponse>;
    /**
     * Process multimedia request
     */
    private processRequest;
    /**
     * Stream multimedia generation
     */
    generateStream(request: MultimediaGenerationRequest, context: MultimediaContext): AsyncIterableIterator<MultimediaPipelineResponse>;
    /**
     * Batch process multiple requests
     */
    batchGenerate(requests: Array<{
        request: MultimediaGenerationRequest;
        context: MultimediaContext;
    }>): Promise<MultimediaGenerationResponse[]>;
    /**
     * Validate multimedia request
     */
    private validateRequest;
    /**
     * Validate content for safety
     */
    private validateContent;
    /**
     * Check content safety
     */
    private checkContentSafety;
    /**
     * Validate budget constraints
     */
    private validateBudget;
    /**
     * Estimate cost for request
     */
    private estimateCost;
    /**
     * Get request type
     */
    private getRequestType;
    /**
     * Apply post-processing to results
     */
    private applyPostProcessing;
    /**
     * Apply enterprise-level enhancements
     */
    private applyEnterpriseEnhancements;
    /**
     * Apply compression optimizations
     */
    private applyCompressionOptimizations;
    /**
     * Apply watermark for free tier
     */
    private applyWatermark;
    /**
     * Generate cache key
     */
    private generateCacheKey;
    /**
     * Sanitize request for caching (remove sensitive data)
     */
    private sanitizeRequestForCaching;
    /**
     * Create metadata for response
     */
    private createMetadata;
    /**
     * Create pipeline stages
     */
    private createPipelineStages;
    /**
     * Update pipeline stages
     */
    private updatePipelineStages;
    /**
     * Estimate completion time
     */
    private estimateCompletionTime;
    /**
     * Check if request should be batched
     */
    private shouldBatch;
    /**
     * Enqueue request for batch processing
     */
    private enqueueBatchRequest;
    /**
     * Process batch queue
     */
    private processBatchQueue;
    /**
     * Flush batch queue
     */
    private flushBatchQueue;
    /**
     * Group requests by type for batch processing
     */
    private groupRequestsByType;
    /**
     * Process batch by type
     */
    private processBatchByType;
    /**
     * Setup batch processing timers
     */
    private setupBatchProcessing;
    /**
     * Start monitoring
     */
    private startMonitoring;
    /**
     * Collect metrics
     */
    private collectMetrics;
    /**
     * Perform health check
     */
    private performHealthCheck;
    /**
     * Get pipeline metrics
     */
    getMetrics(): {
        avgLatency: number;
        successRate: number;
        cacheHitRate: number;
        activeRequests: number;
        queuedRequests: number;
        cacheStats: import("../../core/cache-manager.js").CacheStats;
        totalRequests: number;
        successfulRequests: number;
        failedRequests: number;
        imageRequests: number;
        audioRequests: number;
        musicRequests: number;
        batchRequests: number;
        cacheHits: number;
        totalLatency: number;
        totalCost: number;
        activeConnections: number;
    };
    /**
     * Get active requests
     */
    getActiveRequests(): MultimediaPipelineResponse[];
    /**
     * Cancel request
     */
    cancelRequest(requestId: string): Promise<boolean>;
    /**
     * Shutdown pipeline
     */
    shutdown(): Promise<void>;
}
//# sourceMappingURL=multimedia-pipeline.d.ts.map