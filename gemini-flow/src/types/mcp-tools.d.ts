/**
 * MCP Tool Type Definitions
 * Comprehensive TypeScript definitions for Claude Flow and RUV Swarm MCP tools
 */

// =============================================================================
// BASE MCP INTERFACES
// =============================================================================

export interface MCPToolParams {
  [key: string]: any;
}

export interface MCPToolResult {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
  timestamp?: number;
}

export interface SwarmConfig {
  topology: 'mesh' | 'hierarchical' | 'ring' | 'star';
  maxAgents?: number;
  strategy?: 'balanced' | 'specialized' | 'adaptive';
}

export interface AgentConfig {
  type: 'coordinator' | 'researcher' | 'coder' | 'analyst' | 'architect' | 'tester' | 'reviewer' | 'optimizer' | 'documenter' | 'monitor' | 'specialist';
  name?: string;
  capabilities?: string[];
  swarmId?: string;
}

export interface TaskConfig {
  task: string;
  strategy?: 'parallel' | 'sequential' | 'adaptive' | 'balanced';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  maxAgents?: number;
  dependencies?: string[];
}

export interface MemoryAction {
  action: 'store' | 'retrieve' | 'list' | 'delete' | 'search';
  key?: string;
  value?: string;
  namespace?: string;
  ttl?: number;
}

export interface NeuralTrainingConfig {
  pattern_type: 'coordination' | 'optimization' | 'prediction';
  training_data: string;
  epochs?: number;
}

// =============================================================================
// RUV SWARM MCP TOOLS
// =============================================================================

export interface RuvSwarmTools {
  // Swarm Management
  'mcp__ruv-swarm__swarm_init': (params: {
    topology: 'mesh' | 'hierarchical' | 'ring' | 'star';
    maxAgents?: number;
    strategy?: 'balanced' | 'specialized' | 'adaptive';
  }) => Promise<MCPToolResult>;

  'mcp__ruv-swarm__swarm_status': (params: {
    verbose?: boolean;
  }) => Promise<MCPToolResult>;

  'mcp__ruv-swarm__swarm_monitor': (params: {
    duration?: number;
    interval?: number;
  }) => Promise<MCPToolResult>;

  // Agent Management
  'mcp__ruv-swarm__agent_spawn': (params: {
    type: 'researcher' | 'coder' | 'analyst' | 'optimizer' | 'coordinator';
    name?: string;
    capabilities?: string[];
  }) => Promise<MCPToolResult>;

  'mcp__ruv-swarm__agent_list': (params: {
    filter?: 'all' | 'active' | 'idle' | 'busy';
  }) => Promise<MCPToolResult>;

  'mcp__ruv-swarm__agent_metrics': (params: {
    agentId?: string;
    metric?: 'all' | 'cpu' | 'memory' | 'tasks' | 'performance';
  }) => Promise<MCPToolResult>;

  // Task Orchestration
  'mcp__ruv-swarm__task_orchestrate': (params: {
    task: string;
    strategy?: 'parallel' | 'sequential' | 'adaptive';
    priority?: 'low' | 'medium' | 'high' | 'critical';
    maxAgents?: number;
  }) => Promise<MCPToolResult>;

  'mcp__ruv-swarm__task_status': (params: {
    taskId?: string;
    detailed?: boolean;
  }) => Promise<MCPToolResult>;

  'mcp__ruv-swarm__task_results': (params: {
    taskId: string;
    format?: 'summary' | 'detailed' | 'raw';
  }) => Promise<MCPToolResult>;

  // Performance & Benchmarks
  'mcp__ruv-swarm__benchmark_run': (params: {
    type?: 'all' | 'wasm' | 'swarm' | 'agent' | 'task';
    iterations?: number;
  }) => Promise<MCPToolResult>;

  'mcp__ruv-swarm__features_detect': (params: {
    category?: 'all' | 'wasm' | 'simd' | 'memory' | 'platform';
  }) => Promise<MCPToolResult>;

  'mcp__ruv-swarm__memory_usage': (params: {
    detail?: 'summary' | 'detailed' | 'by-agent';
  }) => Promise<MCPToolResult>;

  // Neural Features
  'mcp__ruv-swarm__neural_status': (params: {
    agentId?: string;
  }) => Promise<MCPToolResult>;

  'mcp__ruv-swarm__neural_train': (params: {
    agentId?: string;
    iterations?: number;
  }) => Promise<MCPToolResult>;

  'mcp__ruv-swarm__neural_patterns': (params: {
    pattern?: 'all' | 'convergent' | 'divergent' | 'lateral' | 'systems' | 'critical' | 'abstract';
  }) => Promise<MCPToolResult>;

  // DAA (Decentralized Autonomous Agents)
  'mcp__ruv-swarm__daa_init': (params: {
    enableCoordination?: boolean;
    enableLearning?: boolean;
    persistenceMode?: 'auto' | 'memory' | 'disk';
  }) => Promise<MCPToolResult>;

  'mcp__ruv-swarm__daa_agent_create': (params: {
    id: string;
    capabilities?: string[];
    cognitivePattern?: 'convergent' | 'divergent' | 'lateral' | 'systems' | 'critical' | 'adaptive';
    enableMemory?: boolean;
    learningRate?: number;
  }) => Promise<MCPToolResult>;

  'mcp__ruv-swarm__daa_agent_adapt': (params: {
    agentId: string;
    agent_id?: string;
    feedback?: string;
    performanceScore?: number;
    suggestions?: string[];
  }) => Promise<MCPToolResult>;

  'mcp__ruv-swarm__daa_workflow_create': (params: {
    id: string;
    name: string;
    steps?: any[];
    dependencies?: object;
    strategy?: 'parallel' | 'sequential' | 'adaptive';
  }) => Promise<MCPToolResult>;

  'mcp__ruv-swarm__daa_workflow_execute': (params: {
    workflowId: string;
    workflow_id?: string;
    agentIds?: string[];
    parallelExecution?: boolean;
  }) => Promise<MCPToolResult>;

  'mcp__ruv-swarm__daa_knowledge_share': (params: {
    sourceAgentId: string;
    source_agent?: string;
    targetAgentIds: string[];
    target_agents?: string[];
    knowledgeDomain?: string;
    knowledgeContent?: object;
  }) => Promise<MCPToolResult>;

  'mcp__ruv-swarm__daa_learning_status': (params: {
    agentId?: string;
    detailed?: boolean;
  }) => Promise<MCPToolResult>;

  'mcp__ruv-swarm__daa_cognitive_pattern': (params: {
    agentId?: string;
    agent_id?: string;
    action?: 'analyze' | 'change';
    pattern?: 'convergent' | 'divergent' | 'lateral' | 'systems' | 'critical' | 'adaptive';
    analyze?: boolean;
  }) => Promise<MCPToolResult>;

  'mcp__ruv-swarm__daa_meta_learning': (params: {
    sourceDomain?: string;
    targetDomain?: string;
    transferMode?: 'adaptive' | 'direct' | 'gradual';
    agentIds?: string[];
  }) => Promise<MCPToolResult>;

  'mcp__ruv-swarm__daa_performance_metrics': (params: {
    category?: 'all' | 'system' | 'performance' | 'efficiency' | 'neural';
    timeRange?: string;
  }) => Promise<MCPToolResult>;
}

// =============================================================================
// CLAUDE FLOW MCP TOOLS
// =============================================================================

export interface ClaudeFlowTools {
  // Swarm Initialization & Management
  'mcp__claude-flow__swarm_init': (params: {
    topology: 'hierarchical' | 'mesh' | 'ring' | 'star';
    maxAgents?: number;
    strategy?: string;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__swarm_status': (params: {
    swarmId?: string;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__swarm_monitor': (params: {
    swarmId?: string;
    interval?: number;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__swarm_scale': (params: {
    swarmId?: string;
    targetSize?: number;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__swarm_destroy': (params: {
    swarmId: string;
  }) => Promise<MCPToolResult>;

  // Agent Management
  'mcp__claude-flow__agent_spawn': (params: {
    type: 'coordinator' | 'researcher' | 'coder' | 'analyst' | 'architect' | 'tester' | 'reviewer' | 'optimizer' | 'documenter' | 'monitor' | 'specialist';
    name?: string;
    capabilities?: any[];
    swarmId?: string;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__agent_list': (params: {
    swarmId?: string;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__agent_metrics': (params: {
    agentId?: string;
  }) => Promise<MCPToolResult>;

  // Task Orchestration
  'mcp__claude-flow__task_orchestrate': (params: {
    task: string;
    strategy?: 'parallel' | 'sequential' | 'adaptive' | 'balanced';
    priority?: 'low' | 'medium' | 'high' | 'critical';
    dependencies?: any[];
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__task_status': (params: {
    taskId: string;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__task_results': (params: {
    taskId: string;
  }) => Promise<MCPToolResult>;

  // Neural & AI Features
  'mcp__claude-flow__neural_status': (params: {
    modelId?: string;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__neural_train': (params: {
    pattern_type: 'coordination' | 'optimization' | 'prediction';
    training_data: string;
    epochs?: number;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__neural_patterns': (params: {
    action: 'analyze' | 'learn' | 'predict';
    operation?: string;
    outcome?: string;
    metadata?: object;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__neural_predict': (params: {
    modelId: string;
    input: string;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__neural_compress': (params: {
    modelId: string;
    ratio?: number;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__neural_explain': (params: {
    modelId: string;
    prediction: object;
  }) => Promise<MCPToolResult>;

  // Memory Management
  'mcp__claude-flow__memory_usage': (params: {
    action: 'store' | 'retrieve' | 'list' | 'delete' | 'search';
    key?: string;
    value?: string;
    namespace?: string;
    ttl?: number;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__memory_search': (params: {
    pattern: string;
    namespace?: string;
    limit?: number;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__memory_persist': (params: {
    sessionId?: string;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__memory_namespace': (params: {
    namespace: string;
    action: string;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__memory_backup': (params: {
    path?: string;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__memory_restore': (params: {
    backupPath: string;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__memory_compress': (params: {
    namespace?: string;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__memory_sync': (params: {
    target: string;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__memory_analytics': (params: {
    timeframe?: string;
  }) => Promise<MCPToolResult>;

  // Performance & Analytics
  'mcp__claude-flow__performance_report': (params: {
    format?: 'summary' | 'detailed' | 'json';
    timeframe?: '24h' | '7d' | '30d';
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__bottleneck_analyze': (params: {
    component?: string;
    metrics?: any[];
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__token_usage': (params: {
    operation?: string;
    timeframe?: string;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__benchmark_run': (params: {
    suite?: string;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__metrics_collect': (params: {
    components?: any[];
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__trend_analysis': (params: {
    metric: string;
    period?: string;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__cost_analysis': (params: {
    timeframe?: string;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__quality_assess': (params: {
    target: string;
    criteria?: any[];
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__error_analysis': (params: {
    logs?: any[];
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__usage_stats': (params: {
    component?: string;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__health_check': (params: {
    components?: any[];
  }) => Promise<MCPToolResult>;

  // GitHub Integration
  'mcp__claude-flow__github_repo_analyze': (params: {
    repo: string;
    analysis_type?: 'code_quality' | 'performance' | 'security';
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__github_pr_manage': (params: {
    repo: string;
    action: 'review' | 'merge' | 'close';
    pr_number?: number;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__github_issue_track': (params: {
    repo: string;
    action: string;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__github_release_coord': (params: {
    repo: string;
    version: string;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__github_workflow_auto': (params: {
    repo: string;
    workflow: object;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__github_code_review': (params: {
    repo: string;
    pr: number;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__github_sync_coord': (params: {
    repos: any[];
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__github_metrics': (params: {
    repo: string;
  }) => Promise<MCPToolResult>;

  // Workflow & Automation
  'mcp__claude-flow__workflow_create': (params: {
    name: string;
    steps: any[];
    triggers?: any[];
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__workflow_execute': (params: {
    workflowId: string;
    params?: object;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__workflow_export': (params: {
    workflowId: string;
    format?: string;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__workflow_template': (params: {
    action: string;
    template?: object;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__automation_setup': (params: {
    rules: any[];
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__pipeline_create': (params: {
    config: object;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__scheduler_manage': (params: {
    action: string;
    schedule?: object;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__trigger_setup': (params: {
    events: any[];
    actions: any[];
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__batch_process': (params: {
    items: any[];
    operation: string;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__parallel_execute': (params: {
    tasks: any[];
  }) => Promise<MCPToolResult>;

  // SPARC Development Mode
  'mcp__claude-flow__sparc_mode': (params: {
    mode: 'dev' | 'api' | 'ui' | 'test' | 'refactor';
    task_description: string;
    options?: object;
  }) => Promise<MCPToolResult>;

  // Decentralized Autonomous Agents (DAA)
  'mcp__claude-flow__daa_agent_create': (params: {
    agent_type: string;
    capabilities?: any[];
    resources?: object;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__daa_capability_match': (params: {
    task_requirements: any[];
    available_agents?: any[];
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__daa_resource_alloc': (params: {
    resources: object;
    agents?: any[];
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__daa_lifecycle_manage': (params: {
    agentId: string;
    action: string;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__daa_communication': (params: {
    from: string;
    to: string;
    message: object;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__daa_consensus': (params: {
    agents: any[];
    proposal: object;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__daa_fault_tolerance': (params: {
    agentId: string;
    strategy?: string;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__daa_optimization': (params: {
    target: string;
    metrics?: any[];
  }) => Promise<MCPToolResult>;

  // Model & AI Operations
  'mcp__claude-flow__model_load': (params: {
    modelPath: string;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__model_save': (params: {
    modelId: string;
    path: string;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__inference_run': (params: {
    modelId: string;
    data: any[];
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__pattern_recognize': (params: {
    data: any[];
    patterns?: any[];
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__cognitive_analyze': (params: {
    behavior: string;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__learning_adapt': (params: {
    experience: object;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__ensemble_create': (params: {
    models: any[];
    strategy?: string;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__transfer_learn': (params: {
    sourceModel: string;
    targetDomain: string;
  }) => Promise<MCPToolResult>;

  // System & Infrastructure
  'mcp__claude-flow__topology_optimize': (params: {
    swarmId?: string;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__load_balance': (params: {
    swarmId?: string;
    tasks?: any[];
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__coordination_sync': (params: {
    swarmId?: string;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__wasm_optimize': (params: {
    operation?: string;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__cache_manage': (params: {
    action: string;
    key?: string;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__state_snapshot': (params: {
    name?: string;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__context_restore': (params: {
    snapshotId: string;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__terminal_execute': (params: {
    command: string;
    args?: any[];
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__config_manage': (params: {
    action: string;
    config?: object;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__features_detect': (params: {
    component?: string;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__security_scan': (params: {
    target: string;
    depth?: string;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__backup_create': (params: {
    destination?: string;
    components?: any[];
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__restore_system': (params: {
    backupId: string;
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__log_analysis': (params: {
    logFile: string;
    patterns?: any[];
  }) => Promise<MCPToolResult>;

  'mcp__claude-flow__diagnostic_run': (params: {
    components?: any[];
  }) => Promise<MCPToolResult>;
}

// =============================================================================
// COMBINED MCP TOOLS INTERFACE
// =============================================================================

export interface MCPTools extends RuvSwarmTools, ClaudeFlowTools {}

// =============================================================================
// MODULE AUGMENTATION FOR MCP
// =============================================================================

declare module '@anthropic/mcp' {
  interface Tools extends MCPTools {}
}

// Global type augmentation for dynamic MCP tool access
declare global {
  namespace MCP {
    interface ToolRegistry extends MCPTools {}
    
    // Utility types for type-safe tool calls
    type ToolName = keyof MCPTools;
    type ToolParams<T extends ToolName> = Parameters<MCPTools[T]>[0];
    type ToolResult<T extends ToolName> = ReturnType<MCPTools[T]>;
    
    // Helper type for tool function signatures
    type ToolFunction<T extends ToolName> = (params: ToolParams<T>) => ToolResult<T>;
  }
}

// =============================================================================
// UTILITY TYPES & HELPERS
// =============================================================================

export type MCPToolName = keyof MCPTools;
export type MCPToolParameters<T extends MCPToolName> = Parameters<MCPTools[T]>[0];
export type MCPToolReturnType<T extends MCPToolName> = ReturnType<MCPTools[T]>;

// Type guard for MCP tool names
export function isMCPTool(name: string): name is MCPToolName {
  return name.startsWith('mcp__');
}

// Type-safe MCP tool caller interface
export interface MCPToolCaller {
  <T extends MCPToolName>(
    toolName: T,
    params: MCPToolParameters<T>
  ): MCPToolReturnType<T>;
}

// Export all interfaces for external use
export type {
  SwarmConfig,
  AgentConfig,
  TaskConfig,
  MemoryAction,
  NeuralTrainingConfig,
  RuvSwarmTools,
  ClaudeFlowTools,
  MCPTools
};