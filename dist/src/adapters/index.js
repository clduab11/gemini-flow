/**
 * Adapter Layer Exports
 *
 * Centralized exports for all model adapters and unified API
 */
// Base adapter interface
export { BaseModelAdapter } from "./base-model-adapter.js";
// Specific adapters
export { GeminiAdapter } from "./gemini-adapter.js";
export { DeepMindAdapter, } from "./deepmind-adapter.js";
import { GeminiAdapter } from "./gemini-adapter.js";
import { DeepMindAdapter } from "./deepmind-adapter.js";
export { JulesWorkflowAdapter, } from "./jules-workflow-adapter.js";
export { UnifiedAPI, } from "./unified-api.js";
export { AdapterManager, } from "./adapter-manager.js";
// Import classes and types for internal use
import { JulesWorkflowAdapter, } from "./jules-workflow-adapter.js";
import { UnifiedAPI } from "./unified-api.js";
import { AdapterManager, } from "./adapter-manager.js";
// Utility functions for easy setup
export async function createGeminiAdapter(config) {
    const fullConfig = {
        modelName: "gemini-2.0-flash",
        timeout: 30000,
        retryAttempts: 3,
        streamingEnabled: true,
        cachingEnabled: true,
        ...config,
    };
    const adapter = new GeminiAdapter(fullConfig);
    await adapter.initialize();
    return adapter;
}
export async function createDeepMindAdapter(config) {
    const fullConfig = {
        modelName: "gemini-2.5-deepmind",
        projectId: config.projectId || process.env.GOOGLE_CLOUD_PROJECT_ID || "",
        location: config.location || "us-central1",
        timeout: 45000,
        retryAttempts: 3,
        streamingEnabled: true,
        cachingEnabled: true,
        ...config,
    };
    if (!fullConfig.projectId) {
        throw new Error("Project ID is required for DeepMind adapter");
    }
    const adapter = new DeepMindAdapter(fullConfig);
    await adapter.initialize();
    return adapter;
}
export async function createJulesWorkflowAdapter(config) {
    const fullConfig = {
        modelName: "jules-workflow-adapter",
        apiKey: config.apiKey || process.env.JULES_API_KEY || "",
        timeout: 60000,
        retryAttempts: 2,
        streamingEnabled: true,
        cachingEnabled: false, // Workflows are typically not cached
        collaborativeMode: false,
        multiStepEnabled: true,
        ...config,
    };
    if (!fullConfig.apiKey) {
        throw new Error("Jules API key is required for workflow adapter");
    }
    const adapter = new JulesWorkflowAdapter(fullConfig);
    await adapter.initialize();
    return adapter;
}
export async function createUnifiedAPI(config) {
    const api = new UnifiedAPI(config);
    return api;
}
export async function createAdapterManager(config) {
    const manager = new AdapterManager(config);
    return manager;
}
// Default configurations for quick setup
export const defaultConfigs = {
    gemini: {
        flash: {
            model: "gemini-2.0-flash",
            timeout: 30000,
            retryAttempts: 3,
            streamingEnabled: true,
            cachingEnabled: true,
        },
        flashThinking: {
            model: "gemini-2.0-flash-thinking",
            timeout: 45000,
            retryAttempts: 3,
            streamingEnabled: true,
            cachingEnabled: true,
        },
        pro: {
            model: "gemini-pro",
            timeout: 45000,
            retryAttempts: 3,
            streamingEnabled: true,
            cachingEnabled: true,
        },
    },
    deepmind: {
        standard: {
            model: "gemini-2.5-deepmind",
            location: "us-central1",
            timeout: 60000,
            retryAttempts: 3,
            streamingEnabled: true,
            cachingEnabled: true,
            advancedReasoning: true,
            longContextMode: true,
        },
        ultra: {
            model: "gemini-2.5-ultra",
            location: "us-central1",
            timeout: 90000,
            retryAttempts: 2,
            streamingEnabled: true,
            cachingEnabled: true,
            advancedReasoning: true,
            longContextMode: true,
        },
    },
    jules: {
        standard: {
            workflowEndpoint: "https://api.jules.google/v1/workflows",
            collaborativeMode: false,
            multiStepEnabled: true,
            timeout: 120000,
            retryAttempts: 2,
            taskOrchestration: {
                maxConcurrentTasks: 3,
                taskTimeout: 60000,
                retryStrategy: "exponential",
                failureHandling: "continue",
            },
        },
        collaborative: {
            workflowEndpoint: "https://api.jules.google/v1/workflows",
            collaborativeMode: true,
            multiStepEnabled: true,
            timeout: 180000,
            retryAttempts: 2,
            aiCollaboration: {
                enablePeerReview: true,
                consensusThreshold: 0.6,
                diversityBoost: true,
            },
        },
    },
    unifiedAPI: {
        balanced: {
            routing: {
                strategy: "balanced",
                latencyTarget: 75,
                fallbackEnabled: true,
                circuitBreakerThreshold: 5,
                retryAttempts: 3,
                retryDelay: 1000,
            },
            caching: {
                enabled: true,
                ttl: 3600,
                maxSize: 1000,
                keyStrategy: "hybrid",
            },
            monitoring: {
                metricsEnabled: true,
                healthCheckInterval: 30000,
                performanceThreshold: 2000,
            },
        },
        performance: {
            routing: {
                strategy: "latency",
                latencyTarget: 50,
                fallbackEnabled: true,
                circuitBreakerThreshold: 3,
                retryAttempts: 2,
                retryDelay: 500,
            },
            caching: {
                enabled: true,
                ttl: 1800,
                maxSize: 2000,
                keyStrategy: "semantic",
            },
            monitoring: {
                metricsEnabled: true,
                healthCheckInterval: 15000,
                performanceThreshold: 1000,
            },
        },
    },
    adapterManager: {
        production: {
            errorHandling: {
                maxRetries: 3,
                retryBackoff: "exponential",
                retryDelay: 1000,
                fallbackChain: ["gemini-2.0-flash", "gemini-pro"],
                emergencyFallback: "gemini-2.0-flash",
                errorThreshold: 0.1,
            },
            performanceOptimization: {
                routingOptimization: true,
                adaptiveTimeouts: true,
                predictiveScaling: true,
                costOptimization: true,
                qualityMonitoring: true,
            },
            monitoring: {
                detailedLogging: true,
                performanceTracking: true,
                errorAnalytics: true,
                usageAnalytics: true,
                alerting: {
                    enabled: true,
                    thresholds: {
                        errorRate: 0.05,
                        latency: 5000,
                        availability: 0.95,
                    },
                    webhooks: [],
                },
            },
        },
    },
};
// Quick setup functions
export async function quickSetupGeminiFlash() {
    return createGeminiAdapter(defaultConfigs.gemini.flash);
}
export async function quickSetupDeepMind(projectId) {
    return createDeepMindAdapter({
        ...defaultConfigs.deepmind.standard,
        projectId,
    });
}
export async function quickSetupJulesWorkflow(apiKey) {
    return createJulesWorkflowAdapter({
        ...defaultConfigs.jules.standard,
        julesApiKey: apiKey,
    });
}
export async function quickSetupUnifiedAPI(geminiApiKey, deepMindProjectId, julesApiKey) {
    const config = {
        ...defaultConfigs.unifiedAPI.balanced,
        models: {
            gemini: [
                {
                    ...defaultConfigs.gemini.flash,
                    modelName: "gemini-flash",
                    apiKey: geminiApiKey,
                },
                {
                    ...defaultConfigs.gemini.pro,
                    modelName: "gemini-pro",
                    apiKey: geminiApiKey,
                },
            ],
            deepmind: deepMindProjectId
                ? [
                    {
                        ...defaultConfigs.deepmind.standard,
                        modelName: "deepmind-standard",
                        projectId: deepMindProjectId,
                    },
                ]
                : [],
            jules: julesApiKey
                ? [
                    {
                        ...defaultConfigs.jules.standard,
                        modelName: "jules-standard",
                        julesApiKey,
                        streamingEnabled: true,
                        cachingEnabled: false,
                    },
                ]
                : [],
        },
    };
    const api = new UnifiedAPI(config);
    return api;
}
export async function quickSetupAdapterManager(geminiApiKey, deepMindProjectId, julesApiKey) {
    // Setup unified API configuration for adapter manager
    await quickSetupUnifiedAPI(geminiApiKey, deepMindProjectId, julesApiKey);
    const config = {
        ...defaultConfigs.adapterManager.production,
        unifiedAPI: {
            routing: defaultConfigs.unifiedAPI.balanced.routing,
            caching: defaultConfigs.unifiedAPI.balanced.caching,
            monitoring: defaultConfigs.unifiedAPI.balanced.monitoring,
            models: {
                gemini: [
                    {
                        ...defaultConfigs.gemini.flash,
                        modelName: "gemini-flash",
                        apiKey: geminiApiKey,
                    },
                ],
                deepmind: deepMindProjectId
                    ? [
                        {
                            ...defaultConfigs.deepmind.standard,
                            modelName: "deepmind-standard",
                            projectId: deepMindProjectId,
                        },
                    ]
                    : [],
                jules: julesApiKey
                    ? [
                        {
                            ...defaultConfigs.jules.standard,
                            modelName: "jules-standard",
                            julesApiKey,
                            streamingEnabled: true,
                            cachingEnabled: false,
                        },
                    ]
                    : [],
            },
        },
    };
    return createAdapterManager(config);
}
//# sourceMappingURL=index.js.map