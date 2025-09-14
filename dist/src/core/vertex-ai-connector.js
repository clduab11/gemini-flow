/**
 * Vertex AI Connector
 *
 * High-performance connector for Google Cloud Vertex AI
 * Supports enterprise features, custom models, and batch processing
 */
import { Logger } from "../utils/logger.js";
import { PerformanceMonitor } from "./performance-monitor.js";
import { CacheManager } from "./cache-manager.js";
import { EventEmitter } from "events";
import { safeImport, getFeatureCapabilities, } from "../utils/feature-detection.js";
export class VertexAIConnector extends EventEmitter {
    logger;
    config;
    client; // VertexAI when available
    auth; // GoogleAuth when available
    performance;
    cache;
    // Model registry
    models = new Map();
    // Connection pool for concurrent requests
    activeRequests = new Set();
    requestQueue = [];
    // Performance metrics
    metrics = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalLatency: 0,
        totalCost: 0,
        batchRequests: 0,
    };
    constructor(config) {
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
     * Initialize Vertex AI client
     */
    async initializeVertexAI() {
        try {
            // Check if Vertex AI dependencies are available
            const capabilities = await getFeatureCapabilities();
            if (!capabilities.vertexAI || !capabilities.googleAuth) {
                this.logger.warn("Vertex AI dependencies not available. Install @google-cloud/vertexai and google-auth-library for full functionality.");
                return;
            }
            const [vertexAIModule, googleAuthModule] = await Promise.all([
                safeImport("@google-cloud/vertexai"),
                safeImport("google-auth-library"),
            ]);
            if (!vertexAIModule?.VertexAI || !googleAuthModule?.GoogleAuth) {
                throw new Error("Required Vertex AI modules not available");
            }
            // Initialize authentication
            this.auth = new googleAuthModule.GoogleAuth({
                projectId: this.config.projectId,
                keyFilename: this.config.serviceAccountPath,
                credentials: this.config.credentials,
                scopes: ["https://www.googleapis.com/auth/cloud-platform"],
            });
            // Initialize Vertex AI client
            this.client = new vertexAIModule.VertexAI({
                project: this.config.projectId,
                location: this.config.location,
                apiEndpoint: this.config.apiEndpoint,
            });
            this.logger.info("Vertex AI client initialized", {
                projectId: this.config.projectId,
                location: this.config.location,
            });
            this.emit("initialized");
        }
        catch (error) {
            this.logger.error("Failed to initialize Vertex AI client", error);
            // Don't throw in constructor context
        }
    }
    /**
     * Load available models from Vertex AI
     */
    async loadAvailableModels() {
        try {
            // Predefined Gemini models on Vertex AI
            const geminiModels = [
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
        }
        catch (error) {
            this.logger.error("Failed to load available models", error);
        }
    }
    /**
     * Make prediction request to Vertex AI
     */
    async predict(request) {
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
            const response = await this.executeRequest(request, modelConfig, requestId);
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
            this.performance.recordMetric("vertex_ai_tokens", response.metadata.tokenUsage.total);
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
        }
        catch (error) {
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
        }
        finally {
            this.activeRequests.delete(requestId);
            this.processQueue();
        }
    }
    /**
     * Execute the actual Vertex AI request
     */
    async executeRequest(request, modelConfig, requestId) {
        try {
            // Get the generative model
            const model = this.client.getGenerativeModel({
                model: request.model,
                generationConfig: {
                    maxOutputTokens: Math.min(request.parameters?.maxOutputTokens || 2048, modelConfig.outputTokenLimit),
                    temperature: request.parameters?.temperature || 0.7,
                    topP: request.parameters?.topP || 0.9,
                    topK: request.parameters?.topK || 40,
                },
            });
            // Handle different request types
            if (request.instances.length === 1) {
                return await this.executeSingleRequest(model, request, modelConfig);
            }
            else if (modelConfig.supportsBatch) {
                return await this.executeBatchRequest(model, request, modelConfig);
            }
            else {
                return await this.executeSequentialRequests(model, request, modelConfig);
            }
        }
        catch (error) {
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
    async executeSingleRequest(model, request, modelConfig) {
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
    async executeBatchRequest(model, request, modelConfig) {
        // TODO: Implement actual batch prediction
        // For now, process sequentially
        return await this.executeSequentialRequests(model, request, modelConfig);
    }
    /**
     * Execute multiple requests sequentially
     */
    async executeSequentialRequests(model, request, modelConfig) {
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
    formatContent(instance) {
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
    calculateCost(tokens, model) {
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
        const pricePerToken = pricing[model] || 0.000001;
        return tokens * pricePerToken;
    }
    /**
     * Wait for available request slot
     */
    async waitForAvailableSlot(requestId) {
        if (this.activeRequests.size < this.config.maxConcurrentRequests) {
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
    processQueue() {
        while (this.requestQueue.length > 0 &&
            this.activeRequests.size < this.config.maxConcurrentRequests) {
            const next = this.requestQueue.shift();
            if (next) {
                next();
            }
        }
    }
    /**
     * Generate cache key for request
     */
    generateCacheKey(request) {
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
    getAvailableModels() {
        return Array.from(this.models.values());
    }
    /**
     * Check if model supports capability
     */
    supportsCapability(modelName, capability) {
        const model = this.models.get(modelName);
        return model ? model.capabilities.includes(capability) : false;
    }
    /**
     * Get model configuration
     */
    getModelConfig(modelName) {
        return this.models.get(modelName);
    }
    /**
     * Batch predict with automatic chunking
     */
    async batchPredict(model, instances, parameters, chunkSize = 10) {
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
            const request = {
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
    async *streamPredict(model, instance, parameters) {
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
    chunkArray(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }
    /**
     * Health check for Vertex AI connection
     */
    async healthCheck() {
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
        }
        catch (error) {
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
            avgLatency: this.metrics.totalRequests > 0
                ? this.metrics.totalLatency / this.metrics.totalRequests
                : 0,
            successRate: this.metrics.totalRequests > 0
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
    shutdown() {
        this.cache.shutdown();
        this.logger.info("Vertex AI connector shutdown");
    }
}
//# sourceMappingURL=vertex-ai-connector.js.map