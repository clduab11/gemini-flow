/**
 * Base Model Adapter Interface
 *
 * Unified interface for all Google AI model adapters
 * Provides streaming, error handling, and capability detection
 */

import { EventEmitter } from "node:events";
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
  requestId?: string; // Made optional for easier API usage - auto-generated if not provided
  userId?: string;
  sessionId?: string;
  priority: "low" | "medium" | "high" | "critical";
  userTier: "free" | "pro" | "enterprise";
  latencyTarget: number;
  tokenBudget?: number;
  streaming?: boolean;
  retryCount?: number; // Added for retry logic tracking
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

export abstract class BaseModelAdapter extends EventEmitter {
  protected logger: Logger;
  protected config: AdapterConfig;
  protected capabilities: ModelCapabilities;
  protected isInitialized: boolean = false;
  protected lastHealthCheck?: HealthCheck;

  constructor(config: AdapterConfig) {
    super();
    this.config = config;
    this.logger = new Logger(`Adapter:${config.modelName}`);
    this.capabilities = this.getModelCapabilities();
  }

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
  abstract generateStream(
    request: ModelRequest,
  ): AsyncIterableIterator<StreamChunk>;

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
  protected abstract transformResponse(
    response: any,
    request: ModelRequest,
  ): ModelResponse;

  /**
   * Handle model-specific errors
   */
  protected abstract handleError(
    error: any,
    request: ModelRequest,
  ): AdapterError;

  /**
   * Perform health check
   */
  async healthCheck(): Promise<HealthCheck> {
    const startTime = performance.now();

    try {
      const testRequest: ModelRequest = {
        prompt: "Hello, this is a health check.",
        context: {
          requestId: `health-${Date.now()}`,
          priority: "low",
          userTier: "free",
          latencyTarget: 5000,
        },
        parameters: {
          maxTokens: 10,
          temperature: 0.1,
        },
      };

      const response = await this.generate(testRequest);
      const latency = performance.now() - startTime;

      this.lastHealthCheck = {
        status: "healthy",
        latency,
        lastChecked: new Date(),
        errors: [],
        metadata: {
          responseLength: response.content.length,
          tokenUsage: response.usage.totalTokens,
        },
      };

      this.emit("health_check", this.lastHealthCheck);
      return this.lastHealthCheck;
    } catch (error) {
      const latency = performance.now() - startTime;

      this.lastHealthCheck = {
        status: "unhealthy",
        latency,
        lastChecked: new Date(),
        errors: [error instanceof Error ? error.message : String(error)],
        metadata: { error: error },
      };

      this.emit("health_check", this.lastHealthCheck);
      return this.lastHealthCheck;
    }
  }

  /**
   * Get capabilities
   */
  getCapabilities(): ModelCapabilities {
    return { ...this.capabilities };
  }

  /**
   * Check if model supports capability
   */
  supportsCapability(capability: keyof ModelCapabilities): boolean {
    return Boolean(this.capabilities[capability]);
  }

  /**
   * Get adapter configuration
   */
  getConfig(): AdapterConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<AdapterConfig>): void {
    this.config = { ...this.config, ...updates };
    this.logger.info("Configuration updated", { updates });
  }

  /**
   * Get last health check result
   */
  getLastHealthCheck(): HealthCheck | undefined {
    return this.lastHealthCheck;
  }

  /**
   * Create standardized error
   */
  protected createError(
    message: string,
    code: string,
    statusCode?: number,
    retryable: boolean = false,
    metadata?: Record<string, any>,
  ): AdapterError {
    const error = new Error(message) as AdapterError;
    error.code = code;
    error.statusCode = statusCode;
    error.retryable = retryable;
    error.model = this.config.modelName;
    error.metadata = metadata;
    return error;
  }

  /**
   * Generate unique request ID
   */
  protected generateRequestId(): string {
    return `${this.config.modelName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Ensure request context has a request ID for tracking
   */
  protected ensureRequestId(context?: RequestContext): RequestContext {
    if (!context) {
      return {
        requestId: this.generateRequestId(),
        priority: "medium",
        userTier: "free",
        latencyTarget: 10000,
      };
    }

    if (!context.requestId) {
      return {
        ...context,
        requestId: this.generateRequestId(),
      };
    }

    return context;
  }

  /**
   * Create a default request context for testing and development
   */
  createContext(overrides?: Partial<RequestContext>): RequestContext {
    const defaultContext: RequestContext = {
      requestId: this.generateRequestId(),
      priority: "medium",
      userTier: "free",
      latencyTarget: 10000,
    };

    return { ...defaultContext, ...overrides };
  }

  /**
   * Calculate cost based on token usage
   */
  protected calculateCost(
    usage: { totalTokens: number },
    costPerToken: number,
  ): number {
    return usage.totalTokens * costPerToken;
  }

  /**
   * Log performance metrics
   */
  protected logPerformance(
    operation: string,
    latency: number,
    success: boolean,
    metadata?: Record<string, any>,
  ): void {
    this.logger.info("Performance metric", {
      operation,
      model: this.config.modelName,
      latency,
      success,
      ...metadata,
    });

    this.emit("performance", {
      operation,
      model: this.config.modelName,
      latency,
      success,
      timestamp: new Date(),
      metadata,
    });
  }

  /**
   * Validate initialization
   */
  protected ensureInitialized(): void {
    if (!this.isInitialized) {
      throw this.createError(
        "Adapter not initialized",
        "ADAPTER_NOT_INITIALIZED",
        500,
        false,
      );
    }
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    this.removeAllListeners();
    this.isInitialized = false;
    this.logger.info("Adapter cleaned up");
  }
}
