/**
 * Core Module Exports
 *
 * Multi-Model Orchestration Core Components & GitHub A2A Integration
 */
export { ModelOrchestrator } from "./model-orchestrator.js";
export { AuthenticationManager } from "./auth-manager.js";
export { ModelRouter } from "./model-router.js";
export { PerformanceMonitor } from "./performance-monitor.js";
export { CacheManager } from "./cache-manager.js";
export { VertexAIConnector } from "./vertex-ai-connector.js";
export { MCPToGeminiAdapter } from "./mcp-adapter.js";
export { BatchTool } from "./batch-tool.js";
export type { ModelConfig, RoutingContext, ModelResponse, } from "./model-orchestrator.js";
export type { UserProfile, AuthConfig } from "./auth-manager.js";
export type { RoutingRule, ModelPerformance } from "./model-router.js";
export type { PerformanceMetric, PerformanceStats, Bottleneck, } from "./performance-monitor.js";
export type { CacheEntry, CacheStats, CacheConfig } from "./cache-manager.js";
export type { VertexAIConfig, VertexModelConfig, VertexRequest, VertexResponse, } from "./vertex-ai-connector.js";
/**
 * Quick Start Function - Initialize complete GitHub A2A system
 * Temporarily disabled for v1.1.0 release
 */
/**
 * Default Configuration Template
 * Temporarily disabled for v1.1.0 release
 */
/**
 * Utility Functions
 */
/**
 * Create a PR review request from GitHub webhook payload
 * Temporarily disabled for v1.1.0 release
 */
/**
 * Create an issue from GitHub webhook payload
 * Temporarily disabled for v1.1.0 release
 */
/**
 * Validate GitHub token and permissions
 */
/**
 * Health check function for system monitoring
 * Temporarily disabled for v1.1.0 release
 */
/**
 * Version information
 */
export declare const GITHUB_A2A_VERSION = "1.0.0";
export declare const GITHUB_A2A_BUILD_DATE: string;
//# sourceMappingURL=index.d.ts.map