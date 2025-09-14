/**
 * Multi-Model Orchestration Engine
 *
 * Intelligent routing between Google AI models with <100ms overhead
 * Supports Gemini 2.0 Flash, DeepMind 2.5, and Vertex AI models
 */
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Logger } from "../utils/logger.js";
import { PerformanceMonitor } from "./performance-monitor.js";
import { AuthenticationManager } from "./auth-manager.js";
import { ModelRouter } from "./model-router.js";
import { CacheManager } from "./cache-manager.js";
import { EventEmitter } from "events";
import { safeImport } from "../utils/feature-detection.js";
export class ModelOrchestrator extends EventEmitter {
    models = new Map();
    clients = new Map();
    router;
    auth;
    performance;
    cache;
    logger;
    // Performance tracking
    metrics = {
        totalRequests: 0,
        routingTime: 0,
        modelSwitches: 0,
        cacheHits: 0,
        failovers: 0,
        tierUpgrades: 0,
    };
    constructor(config) {
        super();
        this.logger = new Logger("ModelOrchestrator");
        this.performance = new PerformanceMonitor();
        this.cache = new CacheManager({ maxMemorySize: config?.cacheSize || 1000 });
        this.auth = new AuthenticationManager();
        this.router = new ModelRouter();
        this.initializeDefaultModels();
        this.setupPerformanceMonitoring();
    }
    /**
     * Initialize with default Google AI models
     */
    initializeDefaultModels() {
        // Gemini 2.0 Flash - Fast and efficient
        this.addModel({
            name: "gemini-2.0-flash",
            tier: "free",
            capabilities: ["text", "code", "reasoning", "multimodal"],
            latencyTarget: 800,
            costPerToken: 0.000001,
            maxTokens: 1000000,
        });
        // Gemini 2.5 Flash - Enhanced performance and efficiency
        this.addModel({
            name: "gemini-2.5-flash",
            tier: "pro",
            capabilities: ["text", "code", "reasoning", "multimodal", "fast"],
            latencyTarget: 600,
            costPerToken: 0.0000006,
            maxTokens: 1000000,
        });
        // Gemini 2.0 Flash Thinking - Advanced reasoning
        this.addModel({
            name: "gemini-2.0-flash-thinking",
            tier: "pro",
            capabilities: ["text", "code", "advanced-reasoning", "multimodal"],
            latencyTarget: 1200,
            costPerToken: 0.000002,
            maxTokens: 1000000,
        });
        // Gemini 2.5 Pro - Enhanced capabilities
        this.addModel({
            name: "gemini-2.5-pro",
            tier: "enterprise",
            capabilities: [
                "text",
                "code",
                "advanced-reasoning",
                "multimodal",
                "long-context",
            ],
            latencyTarget: 1000,
            costPerToken: 0.0000012,
            maxTokens: 2000000,
        });
        // Gemini 2.5 Deep Think - Ultra tier only (Coming Soon)
        this.addModel({
            name: "gemini-2.5-deep-think",
            tier: "enterprise", // Note: Actually Ultra tier, but using enterprise as closest
            capabilities: [
                "text",
                "code",
                "multi-agent",
                "deep-reasoning",
                "complex-problem-solving",
            ],
            latencyTarget: 5000, // Longer for deep reasoning
            costPerToken: 0.000005, // Premium pricing
            maxTokens: 2000000,
        });
        // Vertex AI Gemini Pro
        this.addModel({
            name: "gemini-pro-vertex",
            tier: "enterprise",
            capabilities: [
                "text",
                "code",
                "reasoning",
                "multimodal",
                "enterprise-security",
            ],
            latencyTarget: 1000,
            costPerToken: 0.000003,
            maxTokens: 1000000,
        });
        this.logger.info("Default models initialized", {
            modelCount: this.models.size,
        });
    }
    /**
     * Add a new model configuration
     */
    addModel(config) {
        this.models.set(config.name, config);
        this.initializeModelClient(config);
        this.logger.info("Model added", {
            name: config.name,
            tier: config.tier,
            capabilities: config.capabilities,
        });
    }
    /**
     * Initialize model client based on configuration
     */
    async initializeModelClient(config) {
        try {
            if (config.name.includes("vertex")) {
                // Vertex AI client with conditional import
                const googleAuth = await safeImport("google-auth-library");
                if (!googleAuth?.GoogleAuth) {
                    throw new Error("Google Auth Library not available for Vertex AI");
                }
                const auth = new googleAuth.GoogleAuth({
                    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
                });
                const client = {
                    type: "vertex",
                    auth,
                    projectId: config.projectId,
                    location: config.location || "us-central1",
                };
                this.clients.set(config.name, client);
            }
            else {
                // Standard Gemini API client
                const genAI = new GoogleGenerativeAI(config.apiKey || process.env.GOOGLE_AI_API_KEY);
                const model = genAI.getGenerativeModel({ model: config.name });
                this.clients.set(config.name, {
                    type: "gemini",
                    client: genAI,
                    model,
                });
            }
            this.logger.debug("Model client initialized", { name: config.name });
        }
        catch (error) {
            this.logger.error("Failed to initialize model client", {
                name: config.name,
                error,
            });
        }
    }
    /**
     * Main orchestration method - route request to optimal model
     */
    async orchestrate(prompt, context) {
        const startTime = performance.now();
        this.metrics.totalRequests++;
        // 1. Authenticate and determine user tier
        const userTier = await this.auth.determineUserTier();
        const contextWithTier = {
            ...context,
            userTier: (userTier.tier || userTier),
        };
        try {
            // 2. Route to optimal model with smart routing engine
            const routingStart = performance.now();
            const routingDecision = await this.router.selectOptimalModel(contextWithTier, this.models);
            const routingTime = performance.now() - routingStart;
            this.metrics.routingTime += routingTime;
            // Target: <75ms routing overhead (improved from 100ms)
            if (routingTime > 75) {
                this.logger.warn("Smart routing overhead exceeded target", {
                    routingTime,
                    target: 75,
                    decision: routingDecision,
                });
            }
            const selectedModel = routingDecision.modelName;
            // 3. Check cache first
            const cacheKey = this.generateCacheKey(prompt, selectedModel, contextWithTier);
            const cachedResponse = await this.cache.get(cacheKey);
            if (cachedResponse) {
                this.metrics.cacheHits++;
                return { ...cachedResponse, cached: true };
            }
            // 4. Execute request with selected model
            const response = await this.executeWithModel(selectedModel, prompt, contextWithTier);
            // 5. Cache successful responses
            if (response && !response.content.includes("error")) {
                await this.cache.set(cacheKey, response, 3600); // 1 hour TTL
            }
            // 6. Update performance metrics
            const totalLatency = performance.now() - startTime;
            this.performance.recordMetric("orchestration_latency", totalLatency);
            this.performance.recordMetric("routing_overhead", routingTime);
            // 7. Record performance for smart routing
            this.router.recordPerformance(selectedModel, response.latency, true, // success
            response.cost, response.tokenUsage);
            // 8. Emit events for monitoring
            this.emit("request_completed", {
                model: selectedModel,
                latency: totalLatency,
                routingTime,
                userTier: contextWithTier.userTier,
                cached: false,
                routingDecision,
            });
            return response;
        }
        catch (error) {
            this.logger.error("Orchestration failed", {
                error,
                context: contextWithTier,
            });
            // Attempt failover
            if (contextWithTier.retryCount < 2) {
                const retryContext = {
                    ...contextWithTier,
                    retryCount: (contextWithTier.retryCount || 0) + 1,
                };
                this.metrics.failovers++;
                return this.orchestrate(prompt, retryContext);
            }
            throw error;
        }
    }
    /**
     * Execute request with specific model
     */
    async executeWithModel(modelName, prompt, context) {
        const startTime = performance.now();
        const modelConfig = this.models.get(modelName);
        const client = this.clients.get(modelName);
        if (!modelConfig || !client) {
            throw new Error(`Model not available: ${modelName}`);
        }
        try {
            let response;
            let usage = { input: 0, output: 0, total: 0 };
            if (client.type === "vertex") {
                response = await this.executeVertexRequest(client, prompt, context);
                usage = response.usage || usage;
            }
            else {
                response = await this.executeGeminiRequest(client, prompt, context);
                usage = {
                    input: response.usageMetadata?.promptTokenCount || 0,
                    output: response.usageMetadata?.candidatesTokenCount || 0,
                    total: response.usageMetadata?.totalTokenCount || 0,
                };
            }
            const latency = performance.now() - startTime;
            const cost = usage.total * modelConfig.costPerToken;
            return {
                modelUsed: modelName,
                content: response.text ? response.text() : response.content,
                latency,
                tokenUsage: usage,
                cost,
                cached: false,
                metadata: {
                    finishReason: response.finishReason,
                    safety: response.safetyRatings,
                    model: modelName,
                    tier: modelConfig.tier,
                },
            };
        }
        catch (error) {
            this.logger.error("Model execution failed", {
                model: modelName,
                error: error.message,
            });
            throw error;
        }
    }
    /**
     * Execute Vertex AI request
     */
    async executeVertexRequest(client, prompt, context) {
        // TODO: Implement Vertex AI request execution
        // This would use the Vertex AI client to make requests
        throw new Error("Vertex AI integration not yet implemented");
    }
    /**
     * Execute Gemini API request
     */
    async executeGeminiRequest(client, prompt, context) {
        const generationConfig = {
            temperature: 0.7,
            topP: 0.9,
            topK: 40,
            maxOutputTokens: Math.min(context.tokenBudget || 4096, 8192),
        };
        const result = await client.model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig,
        });
        return result.response;
    }
    /**
     * Generate cache key for request
     */
    generateCacheKey(prompt, model, context) {
        const key = {
            prompt: prompt.substring(0, 200), // Truncate for key size
            model,
            userTier: context.userTier,
            priority: context.priority,
        };
        return Buffer.from(JSON.stringify(key)).toString("base64").substring(0, 50);
    }
    /**
     * Setup performance monitoring
     */
    setupPerformanceMonitoring() {
        // Monitor routing performance every 10 requests
        this.on("request_completed", (data) => {
            if (this.metrics.totalRequests % 10 === 0) {
                this.analyzePerformance();
            }
        });
        // Auto-optimize every 100 requests
        this.on("request_completed", (data) => {
            if (this.metrics.totalRequests % 100 === 0) {
                this.optimizeRouting();
            }
        });
    }
    /**
     * Analyze current performance
     */
    analyzePerformance() {
        const avgRoutingTime = this.metrics.routingTime / this.metrics.totalRequests;
        const cacheHitRate = this.metrics.cacheHits / this.metrics.totalRequests;
        this.logger.info("Performance analysis", {
            avgRoutingTime,
            cacheHitRate,
            totalRequests: this.metrics.totalRequests,
            failovers: this.metrics.failovers,
        });
        // Alert if performance degrades
        if (avgRoutingTime > 100) {
            this.emit("performance_warning", {
                metric: "routing_time",
                value: avgRoutingTime,
                threshold: 100,
            });
        }
    }
    /**
     * Optimize routing algorithms based on performance data
     */
    optimizeRouting() {
        const performanceData = this.performance.getMetrics();
        this.router.optimizeBasedOnPerformance(performanceData);
        this.logger.info("Routing optimization completed", {
            requestsAnalyzed: this.metrics.totalRequests,
        });
    }
    /**
     * Get comprehensive metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            avgRoutingTime: this.metrics.routingTime / this.metrics.totalRequests,
            cacheHitRate: this.metrics.cacheHits / this.metrics.totalRequests,
            failoverRate: this.metrics.failovers / this.metrics.totalRequests,
            modelDistribution: this.router.getModelUsageStats(),
            performance: this.performance.getMetrics(),
        };
    }
    /**
     * Health check for all models
     */
    async healthCheck() {
        const health = {};
        for (const [modelName] of this.models) {
            try {
                // Skip Deep Think for health checks (Coming Soon)
                if (modelName === "gemini-2.5-deep-think") {
                    health[modelName] = false; // Coming Soon - API not yet available
                    continue;
                }
                await this.executeWithModel(modelName, "Health check", {
                    task: "health_check",
                    userTier: "free",
                    priority: "low",
                    latencyRequirement: 5000,
                });
                health[modelName] = true;
            }
            catch (error) {
                health[modelName] = false;
                this.logger.warn("Model health check failed", {
                    model: modelName,
                    error,
                });
            }
        }
        return health;
    }
    /**
     * Shutdown orchestrator and cleanup resources
     */
    shutdown() {
        this.logger.info("Shutting down ModelOrchestrator", {
            totalRequests: this.metrics.totalRequests,
            modelsCount: this.models.size,
        });
        // Clear intervals and listeners
        this.removeAllListeners();
        // Clear caches and connections
        this.cache?.clear?.();
        this.models.clear();
        this.clients.clear();
        // Reset metrics
        this.metrics = {
            totalRequests: 0,
            routingTime: 0,
            modelSwitches: 0,
            cacheHits: 0,
            failovers: 0,
            tierUpgrades: 0,
        };
        this.logger.info("ModelOrchestrator shutdown completed");
    }
}
