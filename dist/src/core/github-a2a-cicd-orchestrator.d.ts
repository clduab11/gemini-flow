/**
 * GitHub A2A CI/CD Orchestrator - A2A-based workflow orchestration for continuous integration and deployment
 * Coordinates A2A agents for intelligent pipeline management, testing, and deployment strategies
 */
/// <reference types="node" resolution-mode="require"/>
import { GitHubA2ABridge } from "./github-a2a-bridge.js";
import { GitHubA2ACrossRepo } from "./github-a2a-cross-repo.js";
import { EventEmitter } from "events";
export interface CICDPipeline {
    id: string;
    name: string;
    repository: string;
    branch: string;
    trigger: "push" | "pr" | "schedule" | "manual" | "tag";
    stages: PipelineStage[];
    agents_assigned: Record<string, string[]>;
    environment: "development" | "staging" | "production";
    status: "idle" | "running" | "success" | "failure" | "cancelled" | "paused";
    created_at: Date;
    started_at?: Date;
    completed_at?: Date;
    duration?: number;
    metrics: PipelineMetrics;
}
export interface PipelineStage {
    id: string;
    name: string;
    type: "build" | "test" | "security" | "quality" | "deploy" | "approval" | "notify";
    dependencies: string[];
    parallel: boolean;
    required_agents: string[];
    jobs: PipelineJob[];
    retry_policy: RetryPolicy;
    timeout: number;
    environment_vars: Record<string, string>;
    artifacts: ArtifactConfig[];
    status: "pending" | "running" | "success" | "failure" | "skipped";
    started_at?: Date;
    completed_at?: Date;
}
export interface PipelineJob {
    id: string;
    name: string;
    agent_type: string;
    command: string;
    script?: string;
    docker_image?: string;
    resources: ResourceRequirements;
    matrix?: Record<string, any[]>;
    condition?: string;
    outputs: Record<string, string>;
    status: "pending" | "running" | "success" | "failure" | "skipped";
}
export interface RetryPolicy {
    max_attempts: number;
    backoff_strategy: "linear" | "exponential" | "fixed";
    base_delay: number;
    max_delay: number;
    retry_conditions: string[];
}
export interface ResourceRequirements {
    cpu: string;
    memory: string;
    storage: string;
    gpu?: boolean;
}
export interface ArtifactConfig {
    name: string;
    path: string;
    retention_days: number;
    required: boolean;
    publish_to?: string[];
}
export interface PipelineMetrics {
    total_runs: number;
    success_rate: number;
    average_duration: number;
    failure_count: number;
    last_success: Date | null;
    last_failure: Date | null;
    agent_performance: Record<string, AgentPerformance>;
}
export interface AgentPerformance {
    agent_id: string;
    tasks_completed: number;
    success_rate: number;
    average_duration: number;
    failure_reasons: Record<string, number>;
}
export interface DeploymentStrategy {
    type: "blue_green" | "rolling" | "canary" | "recreate" | "a_b_test";
    parameters: Record<string, any>;
    health_checks: HealthCheck[];
    rollback_triggers: RollbackTrigger[];
    approval_required: boolean;
    approval_agents: string[];
}
export interface HealthCheck {
    type: "http" | "tcp" | "command" | "metric";
    endpoint?: string;
    command?: string;
    metric_query?: string;
    timeout: number;
    interval: number;
    retries: number;
    success_threshold: number;
    failure_threshold: number;
}
export interface RollbackTrigger {
    condition: string;
    threshold: number;
    time_window: number;
    action: "automatic" | "alert_only";
}
export interface WorkflowExecution {
    id: string;
    pipeline_id: string;
    trigger_event: any;
    commit_sha: string;
    branch: string;
    stages_completed: string[];
    current_stage: string | null;
    agents_involved: string[];
    artifacts_generated: string[];
    test_results: TestResults;
    security_scan_results: SecurityScanResults;
    quality_metrics: QualityMetrics;
    deployment_info?: DeploymentInfo;
    status: "running" | "success" | "failure" | "cancelled";
    created_at: Date;
    completed_at?: Date;
}
export interface TestResults {
    total_tests: number;
    passed_tests: number;
    failed_tests: number;
    skipped_tests: number;
    coverage_percentage: number;
    test_suites: TestSuite[];
    performance_benchmarks: PerformanceBenchmark[];
}
export interface TestSuite {
    name: string;
    tests: number;
    passed: number;
    failed: number;
    duration: number;
    failures: TestFailure[];
}
export interface TestFailure {
    test_name: string;
    error_message: string;
    stack_trace?: string;
    category: "unit" | "integration" | "e2e" | "performance" | "security";
}
export interface PerformanceBenchmark {
    name: string;
    metric: string;
    value: number;
    threshold: number;
    status: "pass" | "fail" | "warning";
}
export interface SecurityScanResults {
    vulnerabilities: SecurityVulnerability[];
    compliance_checks: ComplianceCheck[];
    secret_scan_results: SecretScanResult[];
    dependency_scan: DependencyScanResult;
    overall_score: number;
}
export interface SecurityVulnerability {
    id: string;
    severity: "critical" | "high" | "medium" | "low";
    title: string;
    description: string;
    file_path?: string;
    line_number?: number;
    cwe_id?: string;
    cvss_score?: number;
    fix_available: boolean;
    fix_suggestion?: string;
}
export interface ComplianceCheck {
    rule_id: string;
    rule_name: string;
    status: "pass" | "fail" | "warning";
    description: string;
    remediation?: string;
}
export interface SecretScanResult {
    type: "api_key" | "password" | "token" | "certificate" | "private_key";
    file_path: string;
    line_number: number;
    confidence: number;
    masked_value: string;
}
export interface DependencyScanResult {
    total_dependencies: number;
    vulnerable_dependencies: number;
    outdated_dependencies: number;
    license_issues: number;
    dependency_details: DependencyDetail[];
}
export interface DependencyDetail {
    name: string;
    version: string;
    latest_version: string;
    vulnerabilities: SecurityVulnerability[];
    license: string;
    risk_level: "low" | "medium" | "high" | "critical";
}
export interface QualityMetrics {
    code_coverage: number;
    code_quality_score: number;
    maintainability_index: number;
    technical_debt: number;
    complexity_score: number;
    duplication_percentage: number;
    rule_violations: QualityViolation[];
}
export interface QualityViolation {
    rule_id: string;
    rule_name: string;
    severity: "info" | "minor" | "major" | "critical";
    file_path: string;
    line_number: number;
    message: string;
    fix_suggestion?: string;
}
export interface DeploymentInfo {
    environment: string;
    strategy: DeploymentStrategy;
    version: string;
    deployed_at: Date;
    health_status: "healthy" | "degraded" | "unhealthy";
    rollback_available: boolean;
    traffic_percentage: number;
    performance_metrics: Record<string, number>;
}
export declare class GitHubA2ACICDOrchestrator extends EventEmitter {
    private bridge;
    private crossRepo;
    private a2aIntegration;
    private pipelines;
    private activeExecutions;
    private agentPool;
    private deploymentStrategies;
    private globalMetrics;
    constructor(bridge: GitHubA2ABridge, crossRepo: GitHubA2ACrossRepo);
    /**
     * Initialize default deployment strategies
     */
    private initializeDeploymentStrategies;
    /**
     * Create a new CI/CD pipeline
     */
    createPipeline(config: Omit<CICDPipeline, "id" | "created_at" | "metrics">): Promise<string>;
    /**
     * Trigger pipeline execution
     */
    triggerPipeline(pipelineId: string, trigger: any): Promise<string>;
    /**
     * Execute workflow with A2A coordination
     */
    private executeWorkflow;
    /**
     * Execute individual pipeline stage
     */
    private executeStage;
    /**
     * Execute individual job within a stage
     */
    private executeJob;
    /**
     * Process job results based on job type
     */
    private processJobResults;
    /**
     * Process test job results
     */
    private processTestResults;
    /**
     * Process security scan results
     */
    private processSecurityResults;
    /**
     * Process code quality results
     */
    private processQualityResults;
    /**
     * Process build results
     */
    private processBuildResults;
    /**
     * Process deployment results
     */
    private processDeploymentResults;
    /**
     * Start health monitoring for deployment
     */
    private startHealthMonitoring;
    /**
     * Assign agents to pipeline stages
     */
    private assignAgentsToPipeline;
    /**
     * Create execution plan respecting stage dependencies
     */
    private createExecutionPlan;
    /**
     * Find available agent for job execution
     */
    private findAgentForJob;
    /**
     * Calculate agent score for job assignment
     */
    private calculateAgentScore;
    /**
     * Update agent performance metrics
     */
    private updateAgentPerformance;
    /**
     * Attempt automatic rollback on deployment failure
     */
    private attemptRollback;
    private initializeTestResults;
    private initializeSecurityScanResults;
    private initializeQualityMetrics;
    private findAvailableAgent;
    private shouldRetryStage;
    private retryStage;
    private collectStageArtifacts;
    private validateStageResults;
    private createMonitoringAgents;
    private scheduleHealthCheck;
    private setupRollbackTrigger;
    private setupEventHandlers;
    /**
     * Get orchestrator status
     */
    getStatus(): any;
    /**
     * Get pipeline metrics
     */
    getPipelineMetrics(pipelineId: string): PipelineMetrics | null;
    /**
     * Cancel pipeline execution
     */
    cancelExecution(executionId: string): Promise<void>;
    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;
}
//# sourceMappingURL=github-a2a-cicd-orchestrator.d.ts.map