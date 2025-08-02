/**
 * Core Module Exports
 * 
 * Multi-Model Orchestration Core Components
 */

export { ModelOrchestrator } from './model-orchestrator.js';
export { AuthenticationManager } from './auth-manager.js';
export { ModelRouter } from './model-router.js';
export { PerformanceMonitor } from './performance-monitor.js';
export { CacheManager } from './cache-manager.js';
export { VertexAIConnector } from './vertex-ai-connector.js';
export { MCPToGeminiAdapter } from './mcp-adapter.js';
export { BatchTool } from './batch-tool.js';

// Type exports
export type {
  ModelConfig,
  RoutingContext,
  ModelResponse
} from './model-orchestrator.js';

export type {
  UserProfile,
  AuthConfig
} from './auth-manager.js';

export type {
  RoutingRule,
  ModelPerformance
} from './model-router.js';

export type {
  PerformanceMetric,
  PerformanceStats,
  Bottleneck
} from './performance-monitor.js';

export type {
  CacheEntry,
  CacheStats,
  CacheConfig
} from './cache-manager.js';

export type {
  VertexAIConfig,
  VertexModelConfig,
  VertexRequest,
  VertexResponse
} from './vertex-ai-connector.js';