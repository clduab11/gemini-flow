/**
 * Vertex AI Connector
 *
 * High-performance connector for Google Cloud Vertex AI
 * Supports enterprise features, custom models, and batch processing
 */

import { Logger } from "../utils/logger.js";
import { PerformanceMonitor } from "./performance-monitor.js";
import { CacheManager } from "./cache-manager.js";
import { EventEmitter } from "node:events";
import {
  safeImport,
  getFeatureCapabilities,
} from "../utils/feature-detection.js";

export interface VertexAIConfig {
  projectId: string;
  location: string;
  apiEndpoint?: string;
  credentials?: any;
  serviceAccountPath?: string;
  maxConcurrentRequests?: number;
  requestTimeout?: number;
  enableAuth?: boolean;
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

export class VertexAIConnector extends EventEmitter {
  private logger: Logger;
  private config: VertexAIConfig;
  private client: any; // VertexAI when available
  private auth: any; // GoogleAuth when available
  private performance: PerformanceMonitor;
  private cache: CacheManager;

  // Model registry
  private models: Map<string, VertexModelConfig> = new Map();

  // Connection pool for concurrent requests
  private activeRequests: Set<string> = new Set();
  private requestQueue: Array<() => Promise<void>> = [];

  // Performance metrics
  private metrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    totalLatency: 0,
    totalCost: 0,
    batchRequests: 0,
  };

  constructor(config: VertexAIConfig) {
    super();
    this.config = {
      maxConcurrentRequests: 10,
      requestTimeout: 30000,
      ...config,
    };

    this.logger = new Logger("VertexAIConnector");
    this.performance = new PerformanceMonitor();
    this.cache = new CacheManager({
      maxMemorySize: 50 * 1024 * 1024, // 50MB for Vertex responses
      defaultTTL: 1800, // 30 minutes
    });

    this.initializeVertexAI().catch((error) => {
      this.logger.error("Failed to initialize Vertex AI", error);
    });
    this.loadAvailableModels().catch((error) => {
      this.logger.error("Failed to load available models", error);
    });
  }

  /**
   * Initialize Vertex AI client with real Google Cloud credentials
   */
  private async initializeVertexAI(): Promise<void> {
    try {
      // Check if Vertex AI dependencies are available
      const capabilities = await getFeatureCapabilities();

      if (!capabilities.vertexAI || !capabilities.googleAuth) {
        throw new Error(
          "Google Cloud Vertex AI dependencies not available. Please install @google-cloud/vertexai and google-auth-library packages.",
        );
      }

      const [vertexAIModule, googleAuthModule] = await Promise.all([
        safeImport("@google-cloud/vertexai"),
        safeImport("google-auth-library"),
      ]);

      if (!vertexAIModule?.VertexAI || !googleAuthModule?.GoogleAuth) {
        throw new Error(
          "Required Vertex AI modules not available. Please ensure @google-cloud/vertexai and google-auth-library are properly installed.",
        );
      }

      // Validate configuration
      if (!this.config.projectId) {
        throw new Error("Project ID is required for Vertex AI initialization");
      }

      if (!this.config.location) {
        throw new Error("Location is required for Vertex AI initialization");
      }

      // Initialize authentication with comprehensive credential handling
      this.auth = new googleAuthModule.GoogleAuth({
        projectId: this.config.projectId,
        keyFilename: this.config.serviceAccountPath,
        credentials: this.config.credentials,
        scopes: ["https://www.googleapis.com/auth/cloud-platform"],
        // Support for various credential sources
        keyFile: this.config.serviceAccountPath,
        credentials: this.config.credentials,
      });

      // Test authentication
      await this.auth.getAccessToken();

      // Initialize Vertex AI client
      this.client = new vertexAIModule.VertexAI({
        project: this.config.projectId,
        location: this.config.location,
        apiEndpoint: this.config.apiEndpoint,
        auth: this.auth,
      });

      this.logger.info("Vertex AI client initialized successfully", {
        projectId: this.config.projectId,
        location: this.config.location,
        hasCredentials: !!this.config.credentials || !!this.config.serviceAccountPath,
      });

      this.emit("initialized");
    } catch (error) {
      this.logger.error("Failed to initialize Vertex AI client", error);
      throw new Error(
        `Vertex AI initialization failed: ${error.message}. Please ensure you have provided valid Google Cloud credentials via environment variables, service account file, or ADC (Application Default Credentials).`,
      );
    }
  }

  /**
   * Initialize real Vertex AI client with provided credentials
   */
  private initializeMockClient(): void {
    throw new Error("Real Vertex AI client required. Please provide valid Google Cloud credentials.");
  }

  /**
   * Load available models from Vertex AI
   */
  private async loadAvailableModels(): Promise<void> {
    try {
      // Predefined Gemini models on Vertex AI
      const geminiModels: VertexModelConfig[] = [
        {
          name: "gemini-2.5-pro",
          displayName: "Gemini 2.5 Pro",
          publisher: "google",
          version: "002",
          capabilities: [
            "text",
            "code",
            "multimodal",
            "long-context",
            "advanced-reasoning",
          ],
          inputTokenLimit: 2000000,
          outputTokenLimit: 8192,
          supportsBatch: true,
          supportsStreaming: true,
        },
        {
          name: "gemini-2.5-flash",
          displayName: "Gemini 2.5 Flash",
          publisher: "google",
          version: "002",
          capabilities: ["text", "code", "multimodal", "fast", "reasoning"],
          inputTokenLimit: 1000000,
          outputTokenLimit: 8192,
          supportsBatch: true,
          supportsStreaming: true,
        },
        {
          name: "gemini-2.0-flash",
          displayName: "Gemini 2.0 Flash",
          publisher: "google",
          version: "001",
          capabilities: ["text", "code", "reasoning", "multimodal"],
          inputTokenLimit: 1000000,
          outputTokenLimit: 8192,
          supportsBatch: true,
          supportsStreaming: true,
        },
        {
          name: "gemini-2.5-deep-think",
          displayName: "Gemini 2.5 Deep Think (Preview)",
          publisher: "google",
          version: "preview",
          capabilities: [
            "text",
            "code",
            "multi-agent",
            "deep-reasoning",
            "complex-problem-solving",
          ],
          inputTokenLimit: 2000000,
          outputTokenLimit: 65536,
          supportsBatch: false,
          supportsStreaming: false,
        },
      ];

      for (const model of geminiModels) {
        this.models.set(model.name, model);
      }

      this.logger.info("Vertex AI models loaded", {
        modelCount: this.models.size,
        models: Array.from(this.models.keys()),
      });

      // TODO: Query actual available models from Vertex AI API
      // This would require calling the Model Registry API
    } catch (error) {
      this.logger.error("Failed to load available models", error);
    }
  }

  /**
   * Make prediction request to Vertex AI
   */
  async predict(request: VertexRequest): Promise<VertexResponse> {
    const startTime = performance.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.metrics.totalRequests++;

    try {
      // Validate model
      const modelConfig = this.models.get(request.model);
      if (!modelConfig) {
        throw new Error(`Model not available: ${request.model}`);
      }

      // Check cache first
      const cacheKey = this.generateCacheKey(request);
      const cachedResponse = await this.cache.get(cacheKey);
      if (cachedResponse) {
        this.logger.debug("Cache hit for Vertex AI request", {
          requestId,
          model: request.model,
        });
        return cachedResponse;
      }

      // Wait for available slot if at max concurrent requests
      await this.waitForAvailableSlot(requestId);

      // Execute request
      const response = await this.executeRequest(
        request,
        modelConfig,
        requestId,
      );

      // Cache successful responses
      if (response && response.predictions.length > 0) {
        await this.cache.set(cacheKey, response, 1800); // 30 minutes
      }

      // Update metrics
      const latency = performance.now() - startTime;
      this.metrics.totalLatency += latency;
      this.metrics.successfulRequests++;

      if (request.batchSize && request.batchSize > 1) {
        this.metrics.batchRequests++;
      }

      // Record performance
      this.performance.recordMetric("vertex_ai_latency", latency);
      this.performance.recordMetric(
        "vertex_ai_tokens",
        response.metadata.tokenUsage.total,
      );

      this.logger.info("Vertex AI request completed", {
        requestId,
        model: request.model,
        latency,
        tokens: response.metadata.tokenUsage.total,
        cost: response.metadata.cost,
      });

      this.emit("request_completed", {
        requestId,
        model: request.model,
        latency,
        success: true,
      });

      return response;
    } catch (error) {
      this.metrics.failedRequests++;

      const latency = performance.now() - startTime;
      this.logger.error("Vertex AI request failed", {
        requestId,
        model: request.model,
        latency,
        error: error.message,
      });

      this.emit("request_failed", {
        requestId,
        model: request.model,
        error: error.message,
        latency,
      });

      throw error;
    } finally {
      this.activeRequests.delete(requestId);
      this.processQueue();
    }
  }

  /**
   * Execute the actual Vertex AI request
   */
  private async executeRequest(
    request: VertexRequest,
    modelConfig: VertexModelConfig,
    requestId: string,
  ): Promise<VertexResponse> {
    try {
      // Get the generative model
      const model = this.client.getGenerativeModel({
        model: request.model,
        generationConfig: {
          maxOutputTokens: Math.min(
            request.parameters?.maxOutputTokens || 2048,
            modelConfig.outputTokenLimit,
          ),
          temperature: request.parameters?.temperature || 0.7,
          topP: request.parameters?.topP || 0.9,
          topK: request.parameters?.topK || 40,
        },
      });

      // Handle different request types
      if (request.instances.length === 1) {
        return await this.executeSingleRequest(model, request, modelConfig);
      } else if (modelConfig.supportsBatch) {
        return await this.executeBatchRequest(model, request, modelConfig);
      } else {
        return await this.executeSequentialRequests(
          model,
          request,
          modelConfig,
        );
      }
    } catch (error) {
      this.logger.error("Vertex AI execution error", {
        requestId,
        model: request.model,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Execute single prediction request
   */
  private async executeSingleRequest(
    model: any,
    request: VertexRequest,
    modelConfig: VertexModelConfig,
  ): Promise<VertexResponse> {
    const instance = request.instances[0];
    const content = this.formatContent(instance);

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: content }] }],
    });

    const response = result.response;
    const text = response.text();
    const usage = response.usageMetadata || {
      promptTokenCount: 0,
      candidatesTokenCount: 0,
      totalTokenCount: 0,
    };

    return {
      predictions: [{ content: text }],
      metadata: {
        modelVersion: modelConfig.version,
        latency: 0, // Will be set by caller
        tokenUsage: {
          input: usage.promptTokenCount,
          output: usage.candidatesTokenCount,
          total: usage.totalTokenCount,
        },
        cost: this.calculateCost(usage.totalTokenCount, request.model),
      },
    };
  }

  /**
   * Execute batch prediction request
   */
  private async executeBatchRequest(
    model: any,
    request: VertexRequest,
    modelConfig: VertexModelConfig,
  ): Promise<VertexResponse> {
    // TODO: Implement actual batch prediction
    // For now, process sequentially
    return await this.executeSequentialRequests(model, request, modelConfig);
  }

  /**
   * Execute multiple requests sequentially
   */
  private async executeSequentialRequests(
    model: any,
    request: VertexRequest,
    modelConfig: VertexModelConfig,
  ): Promise<VertexResponse> {
    const predictions = [];
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    for (const instance of request.instances) {
      const content = this.formatContent(instance);

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: content }] }],
      });

      const response = result.response;
      const text = response.text();
      const usage = response.usageMetadata || {
        promptTokenCount: 0,
        candidatesTokenCount: 0,
        totalTokenCount: 0,
      };

      predictions.push({ content: text });
      totalInputTokens += usage.promptTokenCount;
      totalOutputTokens += usage.candidatesTokenCount;
    }

    const totalTokens = totalInputTokens + totalOutputTokens;

    return {
      predictions,
      metadata: {
        modelVersion: modelConfig.version,
        latency: 0, // Will be set by caller
        tokenUsage: {
          input: totalInputTokens,
          output: totalOutputTokens,
          total: totalTokens,
        },
        cost: this.calculateCost(totalTokens, request.model),
      },
    };
  }

  /**
   * Format content for Vertex AI request
   */
  private formatContent(instance: any): string {
    if (typeof instance === "string") {
      return instance;
    }

    if (instance.prompt) {
      return instance.prompt;
    }

    if (instance.text) {
      return instance.text;
    }

    return JSON.stringify(instance);
  }

  /**
   * Calculate cost based on token usage and model
   */
  private calculateCost(tokens: number, model: string): number {
    // Vertex AI pricing (approximate, as of 2024)
    const pricing = {
      "gemini-2.5-pro": 0.0000012, // $1.2 per 1M tokens (enhanced capabilities)
      "gemini-2.5-flash": 0.0000006, // $0.6 per 1M tokens (improved performance)
      "gemini-2.0-flash": 0.0000008, // $0.8 per 1M tokens
      "gemini-2.5-deep-think": 0.000005, // $5 per 1M tokens (Coming Soon - Ultra tier only)
      // Legacy models (deprecated)
      "gemini-1.5-pro": 0.000001,
      "gemini-1.5-flash": 0.0000005,
      "gemini-1.0-pro": 0.0000008,
    };

    const pricePerToken = pricing[model as keyof typeof pricing] || 0.000001;
    return tokens * pricePerToken;
  }

  /**
   * Wait for available request slot
   */
  private async waitForAvailableSlot(requestId: string): Promise<void> {
    if (this.activeRequests.size < this.config.maxConcurrentRequests!) {
      this.activeRequests.add(requestId);
      return;
    }

    // Add to queue and wait
    return new Promise((resolve) => {
      this.requestQueue.push(async () => {
        this.activeRequests.add(requestId);
        resolve();
      });
    });
  }

  /**
   * Process queued requests
   */
  private processQueue(): void {
    while (
      this.requestQueue.length > 0 &&
      this.activeRequests.size < this.config.maxConcurrentRequests!
    ) {
      const next = this.requestQueue.shift();
      if (next) {
        next();
      }
    }
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(request: VertexRequest): string {
    const key = {
      model: request.model,
      instances: request.instances.slice(0, 3), // First 3 instances for key
      parameters: request.parameters,
    };

    return `vertex_${Buffer.from(JSON.stringify(key)).toString("base64").substring(0, 50)}`;
  }

  /**
   * Get available models
   */
  getAvailableModels(): VertexModelConfig[] {
    return Array.from(this.models.values());
  }

  /**
   * Check if model supports capability
   */
  supportsCapability(modelName: string, capability: string): boolean {
    const model = this.models.get(modelName);
    return model ? model.capabilities.includes(capability) : false;
  }

  /**
   * Get model configuration
   */
  getModelConfig(modelName: string): VertexModelConfig | undefined {
    return this.models.get(modelName);
  }

  /**
   * Batch predict with automatic chunking
   */
  async batchPredict(
    model: string,
    instances: any[],
    parameters?: any,
    chunkSize: number = 10,
  ): Promise<VertexResponse> {
    const modelConfig = this.models.get(model);
    if (!modelConfig) {
      throw new Error(`Model not available: ${model}`);
    }

    if (!modelConfig.supportsBatch) {
      throw new Error(`Model does not support batch processing: ${model}`);
    }

    const chunks = this.chunkArray(instances, chunkSize);
    const allPredictions = [];
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCost = 0;

    for (const chunk of chunks) {
      const request: VertexRequest = {
        model,
        instances: chunk,
        parameters,
        batchSize: chunk.length,
      };

      const response = await this.predict(request);

      allPredictions.push(...response.predictions);
      totalInputTokens += response.metadata.tokenUsage.input;
      totalOutputTokens += response.metadata.tokenUsage.output;
      totalCost += response.metadata.cost;
    }

    return {
      predictions: allPredictions,
      metadata: {
        modelVersion: modelConfig.version,
        latency: 0,
        tokenUsage: {
          input: totalInputTokens,
          output: totalOutputTokens,
          total: totalInputTokens + totalOutputTokens,
        },
        cost: totalCost,
      },
    };
  }

  /**
   * Stream predictions (if supported by model)
   */
  async *streamPredict(
    model: string,
    instance: any,
    parameters?: any,
  ): AsyncGenerator<any, void, unknown> {
    const modelConfig = this.models.get(model);
    if (!modelConfig) {
      throw new Error(`Model not available: ${model}`);
    }

    if (!modelConfig.supportsStreaming) {
      throw new Error(`Model does not support streaming: ${model}`);
    }

    // TODO: Implement actual streaming
    // For now, return single response
    const response = await this.predict({
      model,
      instances: [instance],
      parameters,
    });

    yield response.predictions[0];
  }

  /**
   * Chunk array into smaller arrays
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Health check for Vertex AI connection
   */
  async healthCheck(): Promise<{
    status: string;
    latency: number;
    error?: string;
  }> {
    const startTime = performance.now();

    try {
      // Simple test request
      const response = await this.predict({
        model: "gemini-2.5-flash",
        instances: ["Hello, Vertex AI!"],
        parameters: { maxOutputTokens: 10 },
      });

      const latency = performance.now() - startTime;

      return {
        status: "healthy",
        latency,
      };
    } catch (error) {
      const latency = performance.now() - startTime;

      return {
        status: "unhealthy",
        latency,
        error: error.message,
      };
    }
  }

  /**
   * Get connector metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      avgLatency:
        this.metrics.totalRequests > 0
          ? this.metrics.totalLatency / this.metrics.totalRequests
          : 0,
      successRate:
        this.metrics.totalRequests > 0
          ? this.metrics.successfulRequests / this.metrics.totalRequests
          : 0,
      activeRequests: this.activeRequests.size,
      queuedRequests: this.requestQueue.length,
      availableModels: this.models.size,
      cacheStats: this.cache.getStats(),
    };
  }

  /**
   * Shutdown connector
   */
  shutdown(): void {
    this.cache.shutdown();
    this.logger.info("Vertex AI connector shutdown");
  }
}
