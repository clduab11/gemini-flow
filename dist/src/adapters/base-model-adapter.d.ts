/**
 * Base Model Adapter Interface
 *
 * Unified interface for all Google AI model adapters
 * Provides streaming, error handling, and capability detection
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { Logger } from "../utils/logger.js";
export interface ModelCapabilities {
    textGeneration: boolean;
    codeGeneration: boolean;
    multimodal: boolean;
    streaming: boolean;
    functionCalling: boolean;
    longContext: boolean;
    reasoning: boolean;
    multiAgent: boolean;
    complexProblemSolving: boolean;
    chainOfThought: boolean;
    maxTokens: number;
    supportedLanguages: string[];
    inputTypes: string[];
    outputTypes: string[];
}
export interface AdapterConfig {
    modelName: string;
    apiKey?: string;
    projectId?: string;
    location?: string;
    endpoint?: string;
    timeout: number;
    retryAttempts: number;
    streamingEnabled: boolean;
    cachingEnabled: boolean;
    customHeaders?: Record<string, string>;
}
export interface RequestContext {
    requestId?: string;
    userId?: string;
    sessionId?: string;
    priority: "low" | "medium" | "high" | "critical";
    userTier: "free" | "pro" | "enterprise";
    latencyTarget: number;
    tokenBudget?: number;
    streaming?: boolean;
    retryCount?: number;
    metadata?: Record<string, any>;
}
export interface ModelRequest {
    prompt: string;
    context?: RequestContext;
    parameters?: {
        temperature?: number;
        topP?: number;
        topK?: number;
        maxTokens?: number;
        stopSequences?: string[];
        presencePenalty?: number;
        frequencyPenalty?: number;
    };
    systemMessage?: string;
    tools?: any[];
    multimodal?: {
        images?: string[];
        audio?: string[];
        video?: string[];
    };
    metadata?: Record<string, any>;
}
export interface ModelResponse {
    id: string;
    content: string;
    model: string;
    timestamp: Date;
    latency: number;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    cost: number;
    finishReason: string;
    metadata?: Record<string, any>;
    streaming?: boolean;
    error?: Error;
}
export interface StreamChunk {
    id: string;
    content: string;
    delta: string;
    finishReason?: string;
    metadata?: Record<string, any>;
}
export interface AdapterError extends Error {
    code: string;
    statusCode?: number;
    retryable: boolean;
    model: string;
    requestId?: string;
    metadata?: Record<string, any>;
}
export interface HealthCheck {
    status: "healthy" | "degraded" | "unhealthy";
    latency: number;
    lastChecked: Date;
    errors: string[];
    metadata: Record<string, any>;
}
export declare abstract class BaseModelAdapter extends EventEmitter {
    protected logger: Logger;
    protected config: AdapterConfig;
    protected capabilities: ModelCapabilities;
    protected isInitialized: boolean;
    protected lastHealthCheck?: HealthCheck;
    constructor(config: AdapterConfig);
    /**
     * Initialize the adapter
     */
    abstract initialize(): Promise<void>;
    /**
     * Get model-specific capabilities
     */
    abstract getModelCapabilities(): ModelCapabilities;
    /**
     * Generate response from model
     */
    abstract generate(request: ModelRequest): Promise<ModelResponse>;
    /**
     * Stream response from model
     */
    abstract generateStream(request: ModelRequest): AsyncIterableIterator<StreamChunk>;
    /**
     * Validate request format
     */
    abstract validateRequest(request: ModelRequest): Promise<boolean>;
    /**
     * Transform request to model-specific format
     */
    protected abstract transformRequest(request: ModelRequest): any;
    /**
     * Transform response from model-specific format
     */
    protected abstract transformResponse(response: any, request: ModelRequest): ModelResponse;
    /**
     * Handle model-specific errors
     */
    protected abstract handleError(error: any, request: ModelRequest): AdapterError;
    /**
     * Perform health check
     */
    healthCheck(): Promise<HealthCheck>;
    /**
     * Get capabilities
     */
    getCapabilities(): ModelCapabilities;
    /**
     * Check if model supports capability
     */
    supportsCapability(capability: keyof ModelCapabilities): boolean;
    /**
     * Get adapter configuration
     */
    getConfig(): AdapterConfig;
    /**
     * Update configuration
     */
    updateConfig(updates: Partial<AdapterConfig>): void;
    /**
     * Get last health check result
     */
    getLastHealthCheck(): HealthCheck | undefined;
    /**
     * Create standardized error
     */
    protected createError(message: string, code: string, statusCode?: number, retryable?: boolean, metadata?: Record<string, any>): AdapterError;
    /**
     * Generate unique request ID
     */
    protected generateRequestId(): string;
    /**
     * Ensure request context has a request ID for tracking
     */
    protected ensureRequestId(context?: RequestContext): RequestContext;
    /**
     * Create a default request context for testing and development
     */
    createContext(overrides?: Partial<RequestContext>): RequestContext;
    /**
     * Calculate cost based on token usage
     */
    protected calculateCost(usage: {
        totalTokens: number;
    }, costPerToken: number): number;
    /**
     * Log performance metrics
     */
    protected logPerformance(operation: string, latency: number, success: boolean, metadata?: Record<string, any>): void;
    /**
     * Validate initialization
     */
    protected ensureInitialized(): void;
    /**
     * Clean up resources
     */
    cleanup(): Promise<void>;
}
//# sourceMappingURL=base-model-adapter.d.ts.map