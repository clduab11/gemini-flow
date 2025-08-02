/**
 * Adapter Layer Exports
 * 
 * Centralized exports for all model adapters and unified API
 */

// Base adapter interface
export { BaseModelAdapter } from './base-model-adapter.js';
export type {
  ModelCapabilities,
  AdapterConfig,
  RequestContext,
  ModelRequest,
  ModelResponse,
  StreamChunk,
  AdapterError,
  HealthCheck
} from './base-model-adapter.js';

// Specific adapters
export { GeminiAdapter, type GeminiAdapterConfig } from './gemini-adapter.js';
export { DeepMindAdapter, type DeepMindAdapterConfig } from './deepmind-adapter.js';

// Import types for internal use
import type { GeminiAdapterConfig } from './gemini-adapter.js';
import type { DeepMindAdapterConfig } from './deepmind-adapter.js';
import { GeminiAdapter } from './gemini-adapter.js';
import { DeepMindAdapter } from './deepmind-adapter.js';

export { JulesWorkflowAdapter, type JulesWorkflowConfig, type WorkflowStep, type WorkflowDefinition, type WorkflowExecution } from './jules-workflow-adapter.js';
export { UnifiedAPI, type UnifiedAPIConfig, type RoutingDecision, type UnifiedMetrics } from './unified-api.js';
export { AdapterManager, type AdapterManagerConfig, type AdapterStatus, type SystemHealth } from './adapter-manager.js';

// Import classes and types for internal use
import { JulesWorkflowAdapter, type JulesWorkflowConfig } from './jules-workflow-adapter.js';
import { UnifiedAPI, type UnifiedAPIConfig } from './unified-api.js';
import { AdapterManager, type AdapterManagerConfig } from './adapter-manager.js';

// Utility functions for easy setup
export async function createGeminiAdapter(config: Partial<GeminiAdapterConfig>): Promise<GeminiAdapter> {
  const fullConfig: GeminiAdapterConfig = {
    modelName: 'gemini-adapter',
    model: 'gemini-2.0-flash',
    timeout: 30000,
    retryAttempts: 3,
    streamingEnabled: true,
    cachingEnabled: true,
    ...config
  };
  
  const adapter = new GeminiAdapter(fullConfig);
  await adapter.initialize();
  return adapter;
}

export async function createDeepMindAdapter(config: Partial<DeepMindAdapterConfig>): Promise<DeepMindAdapter> {
  const fullConfig: DeepMindAdapterConfig = {
    modelName: 'deepmind-adapter',
    model: 'gemini-2.5-deepmind',
    projectId: config.projectId || process.env.GOOGLE_CLOUD_PROJECT_ID || '',
    location: config.location || 'us-central1',
    timeout: 45000,
    retryAttempts: 3,
    streamingEnabled: true,
    cachingEnabled: true,
    ...config
  };
  
  if (!fullConfig.projectId) {
    throw new Error('Project ID is required for DeepMind adapter');
  }
  
  const adapter = new DeepMindAdapter(fullConfig);
  await adapter.initialize();
  return adapter;
}

export async function createJulesWorkflowAdapter(config: Partial<JulesWorkflowConfig>): Promise<JulesWorkflowAdapter> {
  const fullConfig: JulesWorkflowConfig = {
    modelName: 'jules-workflow-adapter',
    julesApiKey: config.julesApiKey || process.env.JULES_API_KEY || '',
    timeout: 60000,
    retryAttempts: 2,
    streamingEnabled: true,
    cachingEnabled: false, // Workflows are typically not cached
    collaborativeMode: false,
    multiStepEnabled: true,
    ...config
  };
  
  if (!fullConfig.julesApiKey) {
    throw new Error('Jules API key is required for workflow adapter');
  }
  
  const adapter = new JulesWorkflowAdapter(fullConfig);
  await adapter.initialize();
  return adapter;
}

export async function createUnifiedAPI(config: UnifiedAPIConfig): Promise<UnifiedAPI> {
  const api = new UnifiedAPI(config);
  return api;
}

export async function createAdapterManager(config: AdapterManagerConfig): Promise<AdapterManager> {
  const manager = new AdapterManager(config);
  return manager;
}

// Default configurations for quick setup
export const defaultConfigs = {
  gemini: {
    flash: {
      model: 'gemini-2.0-flash' as const,
      timeout: 30000,
      retryAttempts: 3,
      streamingEnabled: true,
      cachingEnabled: true
    },
    flashThinking: {
      model: 'gemini-2.0-flash-thinking' as const,
      timeout: 45000,
      retryAttempts: 3,
      streamingEnabled: true,
      cachingEnabled: true
    },
    pro: {
      model: 'gemini-pro' as const,
      timeout: 45000,
      retryAttempts: 3,
      streamingEnabled: true,
      cachingEnabled: true
    }
  },
  
  deepmind: {
    standard: {
      model: 'gemini-2.5-deepmind' as const,
      location: 'us-central1',
      timeout: 60000,
      retryAttempts: 3,
      streamingEnabled: true,
      cachingEnabled: true,
      advancedReasoning: true,
      longContextMode: true
    },
    ultra: {
      model: 'gemini-2.5-ultra' as const,
      location: 'us-central1',
      timeout: 90000,
      retryAttempts: 2,
      streamingEnabled: true,
      cachingEnabled: true,
      advancedReasoning: true,
      longContextMode: true
    }
  },
  
  jules: {
    standard: {
      workflowEndpoint: 'https://api.jules.google/v1/workflows',
      collaborativeMode: false,
      multiStepEnabled: true,
      timeout: 120000,
      retryAttempts: 2,
      taskOrchestration: {
        maxConcurrentTasks: 3,
        taskTimeout: 60000,
        retryStrategy: 'exponential' as const,
        failureHandling: 'continue' as const
      }
    },
    collaborative: {
      workflowEndpoint: 'https://api.jules.google/v1/workflows',
      collaborativeMode: true,
      multiStepEnabled: true,
      timeout: 180000,
      retryAttempts: 2,
      aiCollaboration: {
        enablePeerReview: true,
        consensusThreshold: 0.6,
        diversityBoost: true
      }
    }
  },
  
  unifiedAPI: {
    balanced: {
      routing: {
        strategy: 'balanced' as const,
        latencyTarget: 75,
        fallbackEnabled: true,
        circuitBreakerThreshold: 5,
        retryAttempts: 3,
        retryDelay: 1000
      },
      caching: {
        enabled: true,
        ttl: 3600,
        maxSize: 1000,
        keyStrategy: 'hybrid' as const
      },
      monitoring: {
        metricsEnabled: true,
        healthCheckInterval: 30000,
        performanceThreshold: 2000
      }
    },
    
    performance: {
      routing: {
        strategy: 'latency' as const,
        latencyTarget: 50,
        fallbackEnabled: true,
        circuitBreakerThreshold: 3,
        retryAttempts: 2,
        retryDelay: 500
      },
      caching: {
        enabled: true,
        ttl: 1800,
        maxSize: 2000,
        keyStrategy: 'semantic' as const
      },
      monitoring: {
        metricsEnabled: true,
        healthCheckInterval: 15000,
        performanceThreshold: 1000
      }
    }
  },
  
  adapterManager: {
    production: {
      errorHandling: {
        maxRetries: 3,
        retryBackoff: 'exponential' as const,
        retryDelay: 1000,
        fallbackChain: ['gemini-2.0-flash', 'gemini-pro'],
        emergencyFallback: 'gemini-2.0-flash',
        errorThreshold: 0.1
      },
      performanceOptimization: {
        routingOptimization: true,
        adaptiveTimeouts: true,
        predictiveScaling: true,
        costOptimization: true,
        qualityMonitoring: true
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
            availability: 0.95
          },
          webhooks: []
        }
      }
    }
  }
};

// Quick setup functions
export async function quickSetupGeminiFlash(): Promise<GeminiAdapter> {
  return createGeminiAdapter(defaultConfigs.gemini.flash);
}

export async function quickSetupDeepMind(projectId: string): Promise<DeepMindAdapter> {
  return createDeepMindAdapter({
    ...defaultConfigs.deepmind.standard,
    projectId
  });
}

export async function quickSetupJulesWorkflow(apiKey: string): Promise<JulesWorkflowAdapter> {
  return createJulesWorkflowAdapter({
    ...defaultConfigs.jules.standard,
    julesApiKey: apiKey
  });
}

export async function quickSetupUnifiedAPI(
  geminiApiKey: string,
  deepMindProjectId?: string,
  julesApiKey?: string
): Promise<UnifiedAPI> {
  const config: UnifiedAPIConfig = {
    ...defaultConfigs.unifiedAPI.balanced,
    models: {
      gemini: [
        { ...defaultConfigs.gemini.flash, modelName: 'gemini-flash', apiKey: geminiApiKey },
        { ...defaultConfigs.gemini.pro, modelName: 'gemini-pro', apiKey: geminiApiKey }
      ],
      deepmind: deepMindProjectId ? [
        { ...defaultConfigs.deepmind.standard, modelName: 'deepmind-standard', projectId: deepMindProjectId }
      ] : [],
      jules: julesApiKey ? [
        { ...defaultConfigs.jules.standard, modelName: 'jules-standard', julesApiKey, streamingEnabled: true, cachingEnabled: false }
      ] : []
    }
  };
  
  const api = new UnifiedAPI(config);
  return api;
}

export async function quickSetupAdapterManager(
  geminiApiKey: string,
  deepMindProjectId?: string,
  julesApiKey?: string
): Promise<AdapterManager> {
  // Setup unified API configuration for adapter manager
  await quickSetupUnifiedAPI(geminiApiKey, deepMindProjectId, julesApiKey);
  
  const config: AdapterManagerConfig = {
    ...defaultConfigs.adapterManager.production,
    unifiedAPI: {
      routing: defaultConfigs.unifiedAPI.balanced.routing,
      caching: defaultConfigs.unifiedAPI.balanced.caching,
      monitoring: defaultConfigs.unifiedAPI.balanced.monitoring,
      models: {
        gemini: [{ ...defaultConfigs.gemini.flash, modelName: 'gemini-flash', apiKey: geminiApiKey }],
        deepmind: deepMindProjectId ? [{ ...defaultConfigs.deepmind.standard, modelName: 'deepmind-standard', projectId: deepMindProjectId }] : [],
        jules: julesApiKey ? [{ ...defaultConfigs.jules.standard, modelName: 'jules-standard', julesApiKey, streamingEnabled: true, cachingEnabled: false }] : []
      }
    }
  };
  
  return createAdapterManager(config);
}