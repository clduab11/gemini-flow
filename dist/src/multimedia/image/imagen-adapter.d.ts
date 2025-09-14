/**
 * Imagen 4 Adapter
 *
 * Integration with Google's Imagen 4 through Vertex AI
 * Supports advanced image generation with style transfer and artistic controls
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { VertexAIConnector } from "../../core/vertex-ai-connector.js";
import { ImageGenerationRequest, ImageGenerationResponse, ImageGenerationConfig, ImageSize } from "../../types/multimedia.js";
export interface ImagenModel {
    name: string;
    displayName: string;
    version: string;
    maxImageSize: ImageSize;
    supportedFormats: string[];
    supportsStyleTransfer: boolean;
    supportsBatchGeneration: boolean;
    maxBatchSize: number;
    estimatedLatency: number;
    costPerImage: number;
}
export declare class ImagenAdapter extends EventEmitter {
    private logger;
    private config;
    private vertexConnector;
    private performance;
    private availableModels;
    private activeRequests;
    private metrics;
    constructor(config: ImageGenerationConfig, vertexConnector: VertexAIConnector);
    /**
     * Initialize available Imagen models
     */
    private initializeModels;
    /**
     * Generate image using Imagen
     */
    generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse>;
    /**
     * Process image generation
     */
    private processImageGeneration;
    /**
     * Prepare Vertex AI request
     */
    private prepareVertexRequest;
    /**
     * Build enhanced prompt with artistic controls
     */
    private buildEnhancedPrompt;
    /**
     * Get style prompt enhancement
     */
    private getStylePromptEnhancement;
    /**
     * Get composition enhancements
     */
    private getCompositionEnhancements;
    /**
     * Get lighting enhancements
     */
    private getLightingEnhancements;
    /**
     * Get color enhancements
     */
    private getColorEnhancements;
    /**
     * Get texture enhancements
     */
    private getTextureEnhancements;
    /**
     * Get mood enhancements
     */
    private getMoodEnhancements;
    /**
     * Get camera enhancements
     */
    private getCameraEnhancements;
    /**
     * Build size parameters
     */
    private buildSizeParameters;
    /**
     * Build quality parameters
     */
    private buildQualityParameters;
    /**
     * Process Vertex AI response
     */
    private processVertexResponse;
    /**
     * Apply style transfer
     */
    private applyStyleTransfer;
    /**
     * Perform style transfer on single image
     */
    private performStyleTransfer;
    /**
     * Extract safety ratings from prediction
     */
    private extractSafetyRatings;
    /**
     * Calculate quality score
     */
    private calculateQualityScore;
    /**
     * Detect artifacts
     */
    private detectArtifacts;
    /**
     * Extract dominant colors
     */
    private extractDominantColors;
    /**
     * Calculate cost
     */
    private calculateCost;
    /**
     * Calculate storage size
     */
    private calculateStorageSize;
    /**
     * Calculate overall quality
     */
    private calculateOverallQuality;
    /**
     * Aggregate artifacts
     */
    private aggregateArtifacts;
    /**
     * Aggregate safety ratings
     */
    private aggregateSafetyRatings;
    /**
     * Compare safety probability levels
     */
    private compareSafetyProbability;
    /**
     * Select optimal model for request
     */
    private selectOptimalModel;
    /**
     * Check if request has complex artistic controls
     */
    private hasComplexArtisticControls;
    /**
     * Validate request
     */
    validateRequest(request: ImageGenerationRequest): Promise<void>;
    /**
     * Estimate cost for request
     */
    estimateCost(request: ImageGenerationRequest): number;
    /**
     * Cancel request
     */
    cancelRequest(requestId: string): Promise<boolean>;
    /**
     * Generate request ID
     */
    private generateRequestId;
    /**
     * Get available models
     */
    getAvailableModels(): ImagenModel[];
    /**
     * Health check
     */
    healthCheck(): Promise<{
        status: string;
        latency: number;
        error?: string;
    }>;
    /**
     * Get metrics
     */
    getMetrics(): {
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
    /**
     * Shutdown adapter
     */
    shutdown(): Promise<void>;
}
//# sourceMappingURL=imagen-adapter.d.ts.map