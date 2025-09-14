/**
 * GitHub A2A Comprehensive Bridge - Complete integration system for all GitHub operations
 * Unifies all A2A GitHub components into a single, cohesive system for seamless collaboration
 */
/// <reference types="node" resolution-mode="require"/>
import { GitHubA2AConfig, A2AAgent } from "./github-a2a-bridge.js";
import { EventEmitter } from "events";
export interface ComprehensiveBridgeConfig {
    github: GitHubA2AConfig["github"];
    a2a: GitHubA2AConfig["a2a"] & {
        enable_cross_repo: boolean;
        enable_pr_automation: boolean;
        enable_issue_tracking: boolean;
        enable_cicd_orchestration: boolean;
        enable_actions_spawning: boolean;
    };
    workflows: GitHubA2AConfig["workflows"] & {
        auto_assignment: boolean;
        smart_routing: boolean;
        load_balancing: boolean;
        fault_tolerance: boolean;
    };
    integration: {
        webhook_secret?: string;
        api_rate_limit: number;
        batch_size: number;
        retry_attempts: number;
        health_check_interval: number;
    };
    monitoring: {
        metrics_enabled: boolean;
        logging_level: "debug" | "info" | "warn" | "error";
        performance_tracking: boolean;
        cost_tracking: boolean;
    };
}
export interface BridgeStatus {
    overall_health: "healthy" | "degraded" | "unhealthy";
    components: {
        bridge: ComponentStatus;
        pr_system: ComponentStatus;
        cross_repo: ComponentStatus;
        issue_tracker: ComponentStatus;
        cicd_orchestrator: ComponentStatus;
        actions: ComponentStatus;
    };
    agents: {
        total: number;
        active: number;
        idle: number;
        failed: number;
    };
    operations: {
        total_active: number;
        by_type: Record<string, number>;
        success_rate: number;
        average_duration: number;
    };
    resources: {
        cpu_usage: number;
        memory_usage: number;
        storage_usage: number;
        network_usage: number;
    };
    costs: {
        current_period: number;
        projected_monthly: number;
        cost_per_operation: number;
    };
}
export interface ComponentStatus {
    status: "active" | "inactive" | "error" | "maintenance";
    uptime: number;
    last_error?: string;
    metrics?: Record<string, number>;
}
export interface OperationRequest {
    type: "pr_review" | "issue_triage" | "cross_repo_sync" | "cicd_pipeline" | "action_spawn";
    repository: string;
    data: any;
    priority: "low" | "medium" | "high" | "critical";
    requester: string;
    deadline?: Date;
    requirements?: string[];
}
export interface OperationResult {
    id: string;
    request: OperationRequest;
    status: "success" | "failure" | "partial";
    agents_involved: string[];
    duration: number;
    artifacts: string[];
    metrics: OperationMetrics;
    error?: string;
    completed_at: Date;
}
export interface OperationMetrics {
    agent_efficiency: Record<string, number>;
    resource_utilization: Record<string, number>;
    quality_score: number;
    cost: number;
    user_satisfaction?: number;
}
export interface SmartRoutingConfig {
    load_balancing_strategy: "round_robin" | "least_connections" | "weighted" | "capability_based";
    agent_affinity: boolean;
    repository_affinity: boolean;
    workload_prediction: boolean;
    adaptive_routing: boolean;
}
export interface AgentPool {
    id: string;
    name: string;
    agents: A2AAgent[];
    specialization: string[];
    capacity: {
        current: number;
        maximum: number;
        utilization: number;
    };
    performance: {
        average_task_time: number;
        success_rate: number;
        quality_score: number;
    };
    scaling: {
        auto_scaling: boolean;
        min_size: number;
        max_size: number;
        scale_up_threshold: number;
        scale_down_threshold: number;
    };
}
export declare class GitHubA2AComprehensiveBridge extends EventEmitter {
    private config;
    private bridge;
    private prSystem;
    private crossRepo;
    private issueTracker;
    private cicdOrchestrator;
    private actions;
    private a2aIntegration;
    private securityManager;
    private agentPools;
    private activeOperations;
    private routingConfig;
    private healthMonitor;
    private metricsCollector;
    private operationHistory;
    private performanceMetrics;
    private costTracker;
    constructor(config: ComprehensiveBridgeConfig);
    /**
     * Initialize the comprehensive bridge system
     */
    initialize(): Promise<void>;
    /**
     * Initialize specialized systems based on configuration
     */
    private initializeSpecializedSystems;
    /**
     * Initialize and manage agent pools
     */
    private initializeAgentPools;
    /**
     * Create and initialize an agent pool
     */
    private createAgentPool;
    /**
     * Create an agent for a specific pool
     */
    private createPoolAgent;
    /**
     * Process incoming operation request with smart routing
     */
    processOperation(request: OperationRequest): Promise<string>;
    /**
     * Route operation to appropriate specialized system
     */
    private routeOperation;
    /**
     * Smart agent selection based on current workload and capabilities
     */
    selectOptimalAgents(requirements: string[], count?: number): Promise<A2AAgent[]>;
    /**
     * Calculate agent score for selection
     */
    private calculateAgentScore;
    /**
     * Auto-scale agent pools based on demand
     */
    autoScaleAgentPools(): Promise<void>;
    /**
     * Calculate pool utilization percentage
     */
    private calculatePoolUtilization;
    /**
     * Remove agent from pool
     */
    private removeAgentFromPool;
    /**
     * Start monitoring and health checks
     */
    private startMonitoring;
    /**
     * Optimize system performance
     */
    private optimizePerformance;
    /**
     * Setup API endpoints for external integration
     */
    private setupAPIEndpoints;
    /**
     * Get comprehensive bridge status
     */
    getStatus(): BridgeStatus;
    private getComponentStatus;
    private calculateOverallHealth;
    private groupOperationsByType;
    private calculateSuccessRate;
    private calculateAverageDuration;
    private getResourceUsage;
    private getCostMetrics;
    private determineAgentType;
    private validateOperationRequest;
    private updateOperationMetrics;
    private calculateQualityScore;
    private calculateAgentEfficiency;
    private identifyBottlenecks;
    private applyOptimization;
    private getPRAgents;
    private getIssueAgents;
    private getCrossRepoAgents;
    private getCICDAgents;
    private getActionAgents;
    private setupEventHandlers;
    /**
     * Graceful shutdown of the comprehensive bridge
     */
    shutdown(): Promise<void>;
}
//# sourceMappingURL=github-a2a-comprehensive-bridge.d.ts.map