/**
 * Base Model Adapter Interface
 *
 * Unified interface for all Google AI model adapters
 * Provides streaming, error handling, and capability detection
 */
import { EventEmitter } from "events";
import { Logger } from "../utils/logger.js";
export class BaseModelAdapter extends EventEmitter {
    logger;
    config;
    capabilities;
    isInitialized = false;
    lastHealthCheck;
    constructor(config) {
        super();
        this.config = config;
        this.logger = new Logger(`Adapter:${config.modelName}`);
        this.capabilities = this.getModelCapabilities();
    }
    /**
     * Perform health check
     */
    async healthCheck() {
        const startTime = performance.now();
        try {
            const testRequest = {
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
        }
        catch (error) {
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
    getCapabilities() {
        return { ...this.capabilities };
    }
    /**
     * Check if model supports capability
     */
    supportsCapability(capability) {
        return Boolean(this.capabilities[capability]);
    }
    /**
     * Get adapter configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Update configuration
     */
    updateConfig(updates) {
        this.config = { ...this.config, ...updates };
        this.logger.info("Configuration updated", { updates });
    }
    /**
     * Get last health check result
     */
    getLastHealthCheck() {
        return this.lastHealthCheck;
    }
    /**
     * Create standardized error
     */
    createError(message, code, statusCode, retryable = false, metadata) {
        const error = new Error(message);
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
    generateRequestId() {
        return `${this.config.modelName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Ensure request context has a request ID for tracking
     */
    ensureRequestId(context) {
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
    createContext(overrides) {
        const defaultContext = {
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
    calculateCost(usage, costPerToken) {
        return usage.totalTokens * costPerToken;
    }
    /**
     * Log performance metrics
     */
    logPerformance(operation, latency, success, metadata) {
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
    ensureInitialized() {
        if (!this.isInitialized) {
            throw this.createError("Adapter not initialized", "ADAPTER_NOT_INITIALIZED", 500, false);
        }
    }
    /**
     * Clean up resources
     */
    async cleanup() {
        this.removeAllListeners();
        this.isInitialized = false;
        this.logger.info("Adapter cleaned up");
    }
}
//# sourceMappingURL=base-model-adapter.js.map