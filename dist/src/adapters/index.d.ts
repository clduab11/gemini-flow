/**
 * Adapter Layer Exports
 *
 * Centralized exports for all model adapters and unified API
 */
export { BaseModelAdapter } from "./base-model-adapter.js";
export type { ModelCapabilities, AdapterConfig, RequestContext, ModelRequest, ModelResponse, StreamChunk, AdapterError, HealthCheck, } from "./base-model-adapter.js";
export { GeminiAdapter, type GeminiAdapterConfig } from "./gemini-adapter.js";
export { DeepMindAdapter, type DeepMindAdapterConfig, } from "./deepmind-adapter.js";
import type { GeminiAdapterConfig } from "./gemini-adapter.js";
import type { DeepMindAdapterConfig } from "./deepmind-adapter.js";
import { GeminiAdapter } from "./gemini-adapter.js";
import { DeepMindAdapter } from "./deepmind-adapter.js";
export { JulesWorkflowAdapter, type JulesWorkflowConfig, } from "./jules-workflow-adapter.js";
export { UnifiedAPI, type UnifiedAPIConfig, type RoutingDecision, type UnifiedMetrics, } from "./unified-api.js";
export { AdapterManager, type AdapterManagerConfig, type AdapterStatus, type SystemHealth, } from "./adapter-manager.js";
import { JulesWorkflowAdapter, type JulesWorkflowConfig } from "./jules-workflow-adapter.js";
import { UnifiedAPI, type UnifiedAPIConfig } from "./unified-api.js";
import { AdapterManager, type AdapterManagerConfig } from "./adapter-manager.js";
export declare function createGeminiAdapter(config: Partial<GeminiAdapterConfig>): Promise<GeminiAdapter>;
export declare function createDeepMindAdapter(config: Partial<DeepMindAdapterConfig>): Promise<DeepMindAdapter>;
export declare function createJulesWorkflowAdapter(config: Partial<JulesWorkflowConfig>): Promise<JulesWorkflowAdapter>;
export declare function createUnifiedAPI(config: UnifiedAPIConfig): Promise<UnifiedAPI>;
export declare function createAdapterManager(config: AdapterManagerConfig): Promise<AdapterManager>;
export declare const defaultConfigs: {
    gemini: {
        flash: {
            model: "gemini-2.0-flash";
            timeout: number;
            retryAttempts: number;
            streamingEnabled: boolean;
            cachingEnabled: boolean;
        };
        flashThinking: {
            model: "gemini-2.0-flash-thinking";
            timeout: number;
            retryAttempts: number;
            streamingEnabled: boolean;
            cachingEnabled: boolean;
        };
        pro: {
            model: "gemini-pro";
            timeout: number;
            retryAttempts: number;
            streamingEnabled: boolean;
            cachingEnabled: boolean;
        };
    };
    deepmind: {
        standard: {
            model: "gemini-2.5-deepmind";
            location: string;
            timeout: number;
            retryAttempts: number;
            streamingEnabled: boolean;
            cachingEnabled: boolean;
            advancedReasoning: boolean;
            longContextMode: boolean;
        };
        ultra: {
            model: "gemini-2.5-ultra";
            location: string;
            timeout: number;
            retryAttempts: number;
            streamingEnabled: boolean;
            cachingEnabled: boolean;
            advancedReasoning: boolean;
            longContextMode: boolean;
        };
    };
    jules: {
        standard: {
            workflowEndpoint: string;
            collaborativeMode: boolean;
            multiStepEnabled: boolean;
            timeout: number;
            retryAttempts: number;
            taskOrchestration: {
                maxConcurrentTasks: number;
                taskTimeout: number;
                retryStrategy: "exponential";
                failureHandling: "continue";
            };
        };
        collaborative: {
            workflowEndpoint: string;
            collaborativeMode: boolean;
            multiStepEnabled: boolean;
            timeout: number;
            retryAttempts: number;
            aiCollaboration: {
                enablePeerReview: boolean;
                consensusThreshold: number;
                diversityBoost: boolean;
            };
        };
    };
    unifiedAPI: {
        balanced: {
            routing: {
                strategy: "balanced";
                latencyTarget: number;
                fallbackEnabled: boolean;
                circuitBreakerThreshold: number;
                retryAttempts: number;
                retryDelay: number;
            };
            caching: {
                enabled: boolean;
                ttl: number;
                maxSize: number;
                keyStrategy: "hybrid";
            };
            monitoring: {
                metricsEnabled: boolean;
                healthCheckInterval: number;
                performanceThreshold: number;
            };
        };
        performance: {
            routing: {
                strategy: "latency";
                latencyTarget: number;
                fallbackEnabled: boolean;
                circuitBreakerThreshold: number;
                retryAttempts: number;
                retryDelay: number;
            };
            caching: {
                enabled: boolean;
                ttl: number;
                maxSize: number;
                keyStrategy: "semantic";
            };
            monitoring: {
                metricsEnabled: boolean;
                healthCheckInterval: number;
                performanceThreshold: number;
            };
        };
    };
    adapterManager: {
        production: {
            errorHandling: {
                maxRetries: number;
                retryBackoff: "exponential";
                retryDelay: number;
                fallbackChain: string[];
                emergencyFallback: string;
                errorThreshold: number;
            };
            performanceOptimization: {
                routingOptimization: boolean;
                adaptiveTimeouts: boolean;
                predictiveScaling: boolean;
                costOptimization: boolean;
                qualityMonitoring: boolean;
            };
            monitoring: {
                detailedLogging: boolean;
                performanceTracking: boolean;
                errorAnalytics: boolean;
                usageAnalytics: boolean;
                alerting: {
                    enabled: boolean;
                    thresholds: {
                        errorRate: number;
                        latency: number;
                        availability: number;
                    };
                    webhooks: never[];
                };
            };
        };
    };
};
export declare function quickSetupGeminiFlash(): Promise<GeminiAdapter>;
export declare function quickSetupDeepMind(projectId: string): Promise<DeepMindAdapter>;
export declare function quickSetupJulesWorkflow(apiKey: string): Promise<JulesWorkflowAdapter>;
export declare function quickSetupUnifiedAPI(geminiApiKey: string, deepMindProjectId?: string, julesApiKey?: string): Promise<UnifiedAPI>;
export declare function quickSetupAdapterManager(geminiApiKey: string, deepMindProjectId?: string, julesApiKey?: string): Promise<AdapterManager>;
//# sourceMappingURL=index.d.ts.map