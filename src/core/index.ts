/**
 * Core Module Exports
 * 
 * Multi-Model Orchestration Core Components & GitHub A2A Integration
 */

// Original Core Components
export { ModelOrchestrator } from './model-orchestrator.js';
export { AuthenticationManager } from './auth-manager.js';
export { ModelRouter } from './model-router.js';
export { PerformanceMonitor } from './performance-monitor.js';
export { CacheManager } from './cache-manager.js';
export { VertexAIConnector } from './vertex-ai-connector.js';
export { MCPToGeminiAdapter } from './mcp-adapter.js';
export { BatchTool } from './batch-tool.js';

// GitHub A2A Integration Components - Temporarily disabled for v1.1.0 release  
// export { GitHubA2ABridge, type GitHubA2AConfig, type A2AAgent, type GitHubOperation, type A2ACommunication } from './github-a2a-bridge.js';

// Pull Request System - Temporarily disabled for v1.1.0 release
// export { 
//   GitHubA2APRSystem,
//   type PRReviewRequest,
//   type GitHubFile,
//   type ReviewResult,
//   type ReviewFinding,
//   type ReviewSuggestion,
//   type PRAnalysis
// } from './github-a2a-pr-system.js';

// Cross-Repository Communication - Temporarily disabled for v1.1.0 release
// export {
//   GitHubA2ACrossRepo,
//   type Repository,
//   type CrossRepoChannel,
//   type CrossRepoOperation,
//   type RepoSyncRequest,
//   type CrossRepoMessage
// } from './github-a2a-cross-repo.js';

// Issue Tracking System - Temporarily disabled for v1.1.0 release
// export {
//   GitHubA2AIssueTracker,
//   type GitHubIssue,
//   type GitHubLabel,
//   type IssueAnalysis,
//   type AgentAssignment,
//   type IssueWorkflow
// } from './github-a2a-issue-tracker.js';

// CI/CD Orchestration - Temporarily disabled for v1.1.0 release
// export {
//   GitHubA2ACICDOrchestrator,
//   type CICDPipeline,
//   type PipelineStage,
//   type PipelineJob,
//   type DeploymentStrategy,
//   type WorkflowExecution
// } from './github-a2a-cicd-orchestrator.js';

// GitHub Actions Integration - Temporarily disabled for v1.1.0 release
// export {
//   GitHubA2AActions,
//   type GitHubAction,
//   type ActionTrigger,
//   type AgentSpawningConfig,
//   type ActionExecution
// } from './github-a2a-actions.js';

// Comprehensive Bridge - Temporarily disabled for v1.1.0 release
// export {
//   GitHubA2AComprehensiveBridge,
//   type ComprehensiveBridgeConfig,
//   type BridgeStatus,
//   type OperationRequest,
//   type OperationResult,
//   type AgentPool
// } from './github-a2a-comprehensive-bridge.js';

// Integration Manager - Temporarily disabled for v1.1.0 release
// export {
//   GitHubA2AIntegrationManager,
//   type IntegrationConfig,
//   type DashboardData,
//   type SlackIntegration,
//   type DiscordIntegration,
//   type EmailIntegration
// } from './github-a2a-integration-manager.js';

// Supporting A2A Components - Temporarily disabled for v1.1.0 release
// export { A2AIntegration } from './a2a-integration.js';
// export { A2ASecurityManager } from './a2a-security-manager.js';
// export { A2AZeroTrust } from './a2a-zero-trust.js';
// export { A2AKeyExchange } from './a2a-key-exchange.js';
// export { A2AMessageSecurity } from './a2a-message-security.js';
// export { A2ARateLimiter } from './a2a-rate-limiter.js';
// export { A2AAuditLogger } from './a2a-audit-logger.js';

// Original Type exports
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

/**
 * Quick Start Function - Initialize complete GitHub A2A system
 * Temporarily disabled for v1.1.0 release
 */
// export async function initializeGitHubA2ASystem(config: IntegrationConfig): Promise<GitHubA2AIntegrationManager> {
//   const manager = new GitHubA2AIntegrationManager(config);
//   await manager.initialize();
//   return manager;
// }

/**
 * Default Configuration Template
 * Temporarily disabled for v1.1.0 release
 */
// export const defaultGitHubA2AConfig: IntegrationConfig = {
//   bridge: {
//     github: {
//       token: process.env.GITHUB_TOKEN || '',
//       apiUrl: 'https://api.github.com',
//       enterprise: false
//     },
//     a2a: {
//       maxAgents: 10,
//       topology: 'hierarchical',
//       security: 'high',
//       crossRepo: true,
//       enable_cross_repo: true,
//       enable_pr_automation: true,
//       enable_issue_tracking: true,
//       enable_cicd_orchestration: true,
//       enable_actions_spawning: true
//     },
//     workflows: {
//       prReview: true,
//       issueTracking: true,
//       cicd: true,
//       release: true,
//       auto_assignment: true,
//       smart_routing: true,
//       load_balancing: true,
//       fault_tolerance: true
//     },
//     integration: {
//       api_rate_limit: 5000,
//       batch_size: 10,
//       retry_attempts: 3,
//       health_check_interval: 30
//     },
//     monitoring: {
//       metrics_enabled: true,
//       logging_level: 'info',
//       performance_tracking: true,
//       cost_tracking: true
//     }
//   },
//   deployment: {
//     environment: 'development',
//     scaling_mode: 'auto',
//     high_availability: false,
//     multi_region: false
//   },
//   features: {
//     enable_dashboard: true,
//     enable_api: true,
//     enable_cli: true,
//     enable_webhooks: true,
//     enable_metrics: true
//   },
//   integrations: {}
// };

/**
 * Utility Functions
 */

/**
 * Create a PR review request from GitHub webhook payload
 * Temporarily disabled for v1.1.0 release
 */
// export function createPRReviewFromWebhook(payload: any): PRReviewRequest {
//   return {
//     repository: payload.repository.full_name,
//     pr_number: payload.pull_request.number,
//     head_sha: payload.pull_request.head.sha,
//     base_sha: payload.pull_request.base.sha,
//     files_changed: [], // Would be populated from GitHub API
//     author: payload.pull_request.user.login,
//     title: payload.pull_request.title,
//     description: payload.pull_request.body || '',
//     labels: payload.pull_request.labels || [],
//     reviewers: payload.pull_request.requested_reviewers?.map((r: any) => r.login) || [],
//     assignees: payload.pull_request.assignees?.map((a: any) => a.login) || []
//   };
// }

/**
 * Create an issue from GitHub webhook payload
 * Temporarily disabled for v1.1.0 release
 */
// export function createIssueFromWebhook(payload: any): GitHubIssue {
//   return {
//     id: payload.issue.id,
//     number: payload.issue.number,
//     title: payload.issue.title,
//     body: payload.issue.body || '',
//     state: payload.issue.state,
//     repository: payload.repository.full_name,
//     author: payload.issue.user.login,
//     assignees: payload.issue.assignees?.map((a: any) => a.login) || [],
//     labels: payload.issue.labels || [],
//     milestone: payload.issue.milestone?.title,
//     created_at: new Date(payload.issue.created_at),
//     updated_at: new Date(payload.issue.updated_at),
//     closed_at: payload.issue.closed_at ? new Date(payload.issue.closed_at) : undefined,
//     comments: payload.issue.comments || 0,
//     reactions: {},
//     linked_prs: []
//   };
// }

/**
 * Validate GitHub token and permissions
 */
// export async function validateGitHubToken(token: string): Promise<boolean> {
//   try {
//     const response = await fetch('https://api.github.com/user', {
//       headers: {
//         'Authorization': `token ${token}`,
//         'Accept': 'application/vnd.github.v3+json'
//       }
//     });
//     return response.ok;
//   } catch (error) {
//     console.error('GitHub token validation failed:', error);
//     return false;
//   }
// }

/**
 * Health check function for system monitoring
 * Temporarily disabled for v1.1.0 release
 */
// export async function performHealthCheck(manager: GitHubA2AIntegrationManager): Promise<{
//   healthy: boolean;
//   status: any;
//   timestamp: Date;
// }> {
//   try {
//     const status = manager.getSystemStatus();
//     return {
//       healthy: status.overall_health === 'healthy',
//       status,
//       timestamp: new Date()
//     };
//   } catch (error) {
//     return {
//       healthy: false,
//       status: { error: String(error) },
//       timestamp: new Date()
//     };
//   }
// }

/**
 * Version information
 */
export const GITHUB_A2A_VERSION = '1.0.0';
export const GITHUB_A2A_BUILD_DATE = new Date().toISOString();

console.log(`🤖 GitHub A2A Integration System v${GITHUB_A2A_VERSION} loaded`);