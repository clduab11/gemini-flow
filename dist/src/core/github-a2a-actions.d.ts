/**
 * GitHub A2A Actions - Create GitHub Actions that spawn A2A agents
 * Enables GitHub Actions workflows to dynamically create and coordinate A2A agents
 */
/// <reference types="node" resolution-mode="require"/>
import { GitHubA2ABridge } from "./github-a2a-bridge.js";
import { GitHubA2ACrossRepo } from "./github-a2a-cross-repo.js";
import { GitHubA2ACICDOrchestrator } from "./github-a2a-cicd-orchestrator.js";
import { EventEmitter } from "events";
export interface GitHubAction {
    id: string;
    name: string;
    repository: string;
    workflow_file: string;
    trigger_events: ActionTrigger[];
    inputs: ActionInput[];
    outputs: ActionOutput[];
    agent_spawning: AgentSpawningConfig;
    execution_context: ExecutionContext;
    permissions: ActionPermissions;
    environment: ActionEnvironment;
    created_at: Date;
    last_run?: Date;
    metrics: ActionMetrics;
}
export interface ActionTrigger {
    event: "push" | "pull_request" | "issues" | "release" | "schedule" | "workflow_dispatch" | "repository_dispatch";
    branches?: string[];
    paths?: string[];
    types?: string[];
    schedule?: string;
    inputs?: Record<string, any>;
}
export interface ActionInput {
    name: string;
    description: string;
    required: boolean;
    default?: any;
    type: "string" | "number" | "boolean" | "choice" | "environment";
    options?: string[];
}
export interface ActionOutput {
    name: string;
    description: string;
    value: string;
}
export interface AgentSpawningConfig {
    strategy: "on_demand" | "pre_allocated" | "pool_based" | "adaptive";
    max_agents: number;
    agent_types: AgentTypeConfig[];
    scaling_policy: ScalingPolicy;
    resource_limits: ResourceLimits;
    lifecycle_management: LifecycleConfig;
}
export interface AgentTypeConfig {
    type: "coordinator" | "reviewer" | "tester" | "security" | "analyst" | "architect" | "optimizer";
    min_instances: number;
    max_instances: number;
    scaling_threshold: number;
    capabilities: string[];
    resource_requirements: ResourceRequirements;
    specializations: string[];
}
export interface ScalingPolicy {
    scale_up_threshold: number;
    scale_down_threshold: number;
    scale_up_cooldown: number;
    scale_down_cooldown: number;
    metrics: ScalingMetric[];
}
export interface ScalingMetric {
    metric_name: string;
    threshold: number;
    comparison: "greater_than" | "less_than" | "equals";
    duration: number;
    weight: number;
}
export interface ResourceLimits {
    total_cpu: string;
    total_memory: string;
    total_storage: string;
    max_concurrent_tasks: number;
    max_execution_time: number;
}
export interface ResourceRequirements {
    cpu: string;
    memory: string;
    storage: string;
    gpu?: boolean;
    network_bandwidth?: string;
}
export interface LifecycleConfig {
    startup_timeout: number;
    health_check_interval: number;
    max_idle_time: number;
    graceful_shutdown_timeout: number;
    auto_restart: boolean;
    failure_threshold: number;
}
export interface ExecutionContext {
    runner_type: "github" | "self_hosted" | "hybrid";
    runner_labels: string[];
    container_image?: string;
    environment_variables: Record<string, string>;
    secrets_required: string[];
    artifacts_access: string[];
    cache_configuration: CacheConfig;
}
export interface CacheConfig {
    enabled: boolean;
    key_pattern: string;
    paths: string[];
    restore_keys: string[];
    upload_chunk_size?: number;
}
export interface ActionPermissions {
    contents: "read" | "write" | "none";
    issues: "read" | "write" | "none";
    pull_requests: "read" | "write" | "none";
    checks: "read" | "write" | "none";
    actions: "read" | "write" | "none";
    security_events: "read" | "write" | "none";
    deployments: "read" | "write" | "none";
    packages: "read" | "write" | "none";
}
export interface ActionEnvironment {
    name: string;
    url?: string;
    protection_rules: ProtectionRule[];
    variables: Record<string, string>;
    secrets: string[];
}
export interface ProtectionRule {
    type: "required_reviewers" | "wait_timer" | "branch_policy";
    reviewers?: string[];
    wait_minutes?: number;
    branch_pattern?: string;
}
export interface ActionMetrics {
    total_runs: number;
    success_rate: number;
    average_duration: number;
    agents_spawned: number;
    resource_utilization: ResourceUtilization;
    cost_metrics: CostMetrics;
}
export interface ResourceUtilization {
    cpu_usage: number;
    memory_usage: number;
    storage_usage: number;
    network_usage: number;
}
export interface CostMetrics {
    compute_cost: number;
    storage_cost: number;
    network_cost: number;
    total_cost: number;
    cost_per_execution: number;
}
export interface ActionExecution {
    id: string;
    action_id: string;
    workflow_run_id: string;
    repository: string;
    branch: string;
    commit_sha: string;
    trigger_event: any;
    agents_spawned: string[];
    status: "queued" | "in_progress" | "completed" | "failed" | "cancelled";
    started_at: Date;
    completed_at?: Date;
    duration?: number;
    logs: ExecutionLog[];
    artifacts: string[];
    metrics: ExecutionMetrics;
}
export interface ExecutionLog {
    timestamp: Date;
    level: "debug" | "info" | "warn" | "error";
    source: "action" | "agent" | "system";
    message: string;
    context?: Record<string, any>;
}
export interface ExecutionMetrics {
    agent_performance: Record<string, AgentExecutionMetrics>;
    resource_usage: ResourceUtilization;
    step_timings: Record<string, number>;
    error_count: number;
    warning_count: number;
}
export interface AgentExecutionMetrics {
    agent_id: string;
    agent_type: string;
    tasks_completed: number;
    execution_time: number;
    resource_usage: ResourceUtilization;
    success_rate: number;
    errors: string[];
}
export declare class GitHubA2AActions extends EventEmitter {
    private bridge;
    private crossRepo;
    private cicdOrchestrator;
    private a2aIntegration;
    private actions;
    private executions;
    private agentPools;
    private resourceMonitor;
    constructor(bridge: GitHubA2ABridge, crossRepo: GitHubA2ACrossRepo, cicdOrchestrator: GitHubA2ACICDOrchestrator);
    /**
     * Initialize GitHub Actions with A2A agent spawning
     */
    initialize(): Promise<void>;
    /**
     * Create a new GitHub Action with A2A agent spawning
     */
    createAction(config: Omit<GitHubAction, "id" | "created_at" | "metrics">): Promise<string>;
    /**
     * Generate GitHub Actions workflow YAML file
     */
    private generateWorkflowFile;
    /**
     * Execute GitHub Action with A2A agent spawning
     */
    executeAction(actionId: string, triggerEvent: any): Promise<string>;
    /**
     * Execute action workflow with agent spawning
     */
    private executeActionWorkflow;
    /**
     * Spawn A2A agents based on action configuration
     */
    private spawnAgents;
    /**
     * Calculate number of agents to spawn based on workload and scaling policy
     */
    private calculateAgentsToSpawn;
    /**
     * Create individual A2A agent
     */
    private createAgent;
    /**
     * Configure coordination between spawned agents
     */
    private configureAgentCoordination;
    /**
     * Execute workflow tasks with coordinated agents
     */
    private executeWorkflowTasks;
    /**
     * Execute individual task with assigned agent
     */
    private executeAgentTask;
    /**
     * Collect execution results from all agents
     */
    private collectExecutionResults;
    /**
     * Update action metrics after execution
     */
    private updateActionMetrics;
    /**
     * Cleanup spawned agents after execution
     */
    private cleanupSpawnedAgents;
    private generateTriggerSection;
    private generateRunnerConfig;
    private generateConditions;
    private generateSetupScript;
    private generateAgentSpawningScript;
    private generateWorkflowExecutionScript;
    private generateResultCollectionScript;
    private generateCleanupScript;
    private generateSecretRefs;
    private generateOutputs;
    private createDefaultActions;
    private startAgentPoolManagement;
    private optimizeAgentPools;
    private removeAgentFromPool;
    private setupActionWebhooks;
    private handleWorkflowRunEvent;
    private initializeAgentPool;
    private yamlStringify;
    private logExecution;
    private logExecutionError;
    private getWorkloadMetrics;
    private getScalingPolicy;
    private determineCoordinationTopology;
    private setupAgentCommunication;
    private establishCoordinationProtocols;
    private createTaskExecutionPlan;
    private aggregateResourceUtilization;
    private calculateExecutionCost;
    private setupEventHandlers;
    /**
     * Get GitHub Actions status
     */
    getStatus(): any;
    /**
     * Get action metrics
     */
    getActionMetrics(actionId: string): ActionMetrics | null;
    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;
}
//# sourceMappingURL=github-a2a-actions.d.ts.map