/**
 * Vertex AI Connector
 *
 * High-performance connector for Google Cloud Vertex AI
 * Supports enterprise features, custom models, and batch processing
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
export interface VertexAIConfig {
    projectId: string;
    location: string;
    apiEndpoint?: string;
    credentials?: any;
    serviceAccountPath?: string;
    maxConcurrentRequests?: number;
    requestTimeout?: number;
}
export interface VertexModelConfig {
    name: string;
    displayName: string;
    publisher: string;
    version: string;
    capabilities: string[];
    inputTokenLimit: number;
    outputTokenLimit: number;
    supportsBatch: boolean;
    supportsStreaming: boolean;
}
export interface VertexRequest {
    model: string;
    instances: any[];
    parameters?: any;
    explanations?: boolean;
    batchSize?: number;
    timeout?: number;
}
export interface VertexResponse {
    predictions: any[];
    explanations?: any[];
    metadata: {
        modelVersion: string;
        latency: number;
        tokenUsage: {
            input: number;
            output: number;
            total: number;
        };
        cost: number;
    };
}
export declare class VertexAIConnector extends EventEmitter {
    private logger;
    private config;
    private client;
    private auth;
    private performance;
    private cache;
    private models;
    private activeRequests;
    private requestQueue;
    private metrics;
    constructor(config: VertexAIConfig);
    /**
     * Initialize Vertex AI client
     */
    private initializeVertexAI;
    /**
     * Load available models from Vertex AI
     */
    private loadAvailableModels;
    /**
     * Make prediction request to Vertex AI
     */
    predict(request: VertexRequest): Promise<VertexResponse>;
    /**
     * Execute the actual Vertex AI request
     */
    private executeRequest;
    /**
     * Execute single prediction request
     */
    private executeSingleRequest;
    /**
     * Execute batch prediction request
     */
    private executeBatchRequest;
    /**
     * Execute multiple requests sequentially
     */
    private executeSequentialRequests;
    /**
     * Format content for Vertex AI request
     */
    private formatContent;
    /**
     * Calculate cost based on token usage and model
     */
    private calculateCost;
    /**
     * Wait for available request slot
     */
    private waitForAvailableSlot;
    /**
     * Process queued requests
     */
    private processQueue;
    /**
     * Generate cache key for request
     */
    private generateCacheKey;
    /**
     * Get available models
     */
    getAvailableModels(): VertexModelConfig[];
    /**
     * Check if model supports capability
     */
    supportsCapability(modelName: string, capability: string): boolean;
    /**
     * Get model configuration
     */
    getModelConfig(modelName: string): VertexModelConfig | undefined;
    /**
     * Batch predict with automatic chunking
     */
    batchPredict(model: string, instances: any[], parameters?: any, chunkSize?: number): Promise<VertexResponse>;
    /**
     * Stream predictions (if supported by model)
     */
    streamPredict(model: string, instance: any, parameters?: any): AsyncGenerator<any, void, unknown>;
    /**
     * Chunk array into smaller arrays
     */
    private chunkArray;
    /**
     * Health check for Vertex AI connection
     */
    healthCheck(): Promise<{
        status: string;
        latency: number;
        error?: string;
    }>;
    /**
     * Get connector metrics
     */
    getMetrics(): {
        avgLatency: number;
        successRate: number;
        activeRequests: number;
        queuedRequests: number;
        availableModels: number;
        cacheStats: import("./cache-manager.js").CacheStats;
        totalRequests: number;
        successfulRequests: number;
        failedRequests: number;
        totalLatency: number;
        totalCost: number;
        batchRequests: number;
    };
    /**
     * Shutdown connector
     */
    shutdown(): void;
}
//# sourceMappingURL=vertex-ai-connector.d.ts.map