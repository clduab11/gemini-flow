/**
 * Image Generation Pipeline
 *
 * Comprehensive pipeline for Imagen 4 image generation with style transfer,
 * prompt engineering, batch optimization, and caching strategies
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { ImageGenerationConfig, ImageGenerationRequest, ImageGenerationResponse } from "../../types/multimedia.js";
export declare class ImageGenerationPipeline extends EventEmitter {
    private logger;
    private config;
    private performance;
    private imagenAdapter;
    private promptEngineer;
    private styleTransferEngine;
    private imageCache;
    private batchOptimizer;
    private vertexConnector;
    private isInitialized;
    private activeGenerations;
    private metrics;
    constructor(config: ImageGenerationConfig);
    /**
     * Initialize all pipeline components
     */
    private initializeComponents;
    /**
     * Setup event handlers
     */
    private setupEventHandlers;
    /**
     * Initialize the pipeline
     */
    initialize(): Promise<void>;
    /**
     * Generate image with full pipeline processing
     */
    generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse>;
    /**
     * Generate multiple images with batch optimization
     */
    generateBatch(requests: ImageGenerationRequest[]): Promise<ImageGenerationResponse[]>;
    /**
     * Check cache for existing result
     */
    private checkCache;
    /**
     * Enhance prompt using AI prompt engineering
     */
    private enhancePrompt;
    /**
     * Optimize request for batch processing
     */
    private optimizeBatch;
    /**
     * Process image generation through Imagen adapter
     */
    private processGeneration;
    /**
     * Apply style transfer if requested
     */
    private applyStyleTransfer;
    /**
     * Post-process generated images
     */
    private postProcessImages;
    /**
     * Apply enterprise-level enhancements
     */
    private applyEnterpriseEnhancements;
    /**
     * Apply compression optimizations
     */
    private applyCompressionOptimizations;
    /**
     * Generate previews and thumbnails
     */
    private generatePreviews;
    /**
     * Generate thumbnail
     */
    private generateThumbnail;
    /**
     * Apply watermark for free tier
     */
    private applyWatermark;
    /**
     * Cache generation result
     */
    private cacheResult;
    /**
     * Process batch of requests
     */
    private processBatch;
    /**
     * Update metrics
     */
    private updateMetrics;
    /**
     * Validate request
     */
    validateRequest(request: ImageGenerationRequest): Promise<void>;
    /**
     * Estimate cost
     */
    estimateCost(request: ImageGenerationRequest): number;
    /**
     * Cancel request
     */
    cancelRequest(requestId: string): Promise<boolean>;
    /**
     * Ensure pipeline is initialized
     */
    private ensureInitialized;
    /**
     * Generate request ID
     */
    private generateRequestId;
    /**
     * Health check
     */
    healthCheck(): Promise<{
        status: string;
        latency: number;
        error?: string;
    }>;
    /**
     * Get pipeline metrics
     */
    getMetrics(): {
        imagenMetrics: {
            avgLatency: number;
            successRate: number;
            avgCostPerImage: number;
            activeRequests: number;
            availableModels: number;
            totalRequests: number;
            successfulRequests: number;
            failedRequests: number;
            totalImages: number;
            totalLatency: number;
            totalCost: number;
            styleTransferRequests: number;
            batchRequests: number;
        };
        cacheMetrics: any;
        batchMetrics: any;
        activeGenerations: number;
        totalRequests: number;
        cacheHits: number;
        batchedRequests: number;
        styleTransferRequests: number;
        promptEnhancements: number;
        avgGenerationTime: number;
        totalCost: number;
    };
    /**
     * Shutdown pipeline
     */
    shutdown(): Promise<void>;
}
//# sourceMappingURL=image-generation-pipeline.d.ts.map