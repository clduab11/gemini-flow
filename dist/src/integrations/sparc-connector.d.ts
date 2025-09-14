/**
 * SPARC Architecture Connector
 *
 * Connects Project Mariner browser automation and Veo3 video generation
 * with SPARC development methodology and A2A coordination protocols
 */
import { BrowserConfig, WebWorkflow, WorkflowResult, MultiSiteAction, FormFillingRequest } from "./mariner/types.js";
import { Veo3Config, VideoGenerationRequest, VideoGenerationResult, ChunkedVideoRequest, DistributedGenerationRequest } from "./veo3/types.js";
import { BaseIntegration, HealthStatus } from "./shared/types.js";
export interface SparcConnectorConfig {
    mariner: BrowserConfig;
    veo3: Veo3Config;
    sparc: SparcConfig;
    coordination: A2aCoordinationConfig;
    workflow: WorkflowConfig;
    monitoring: MonitoringConfig;
}
export interface SparcConfig {
    mode: "dev" | "api" | "ui" | "test" | "refactor" | "production";
    phases: SparcPhase[];
    automation: SparcAutomation;
    validation: SparcValidation;
    documentation: SparcDocumentation;
}
export interface SparcPhase {
    name: "specification" | "pseudocode" | "architecture" | "refinement" | "completion";
    enabled: boolean;
    automation: boolean;
    validation: boolean;
    handoffs: SparcHandoff[];
}
export interface SparcHandoff {
    from: string;
    to: string;
    artifacts: string[];
    validation: string[];
}
export interface SparcAutomation {
    enabledPhases: string[];
    browserTasks: BrowserAutomationTask[];
    videoTasks: VideoAutomationTask[];
    integrationTasks: IntegrationTask[];
}
export interface BrowserAutomationTask {
    id: string;
    phase: string;
    workflow: WebWorkflow;
    triggers: TaskTrigger[];
    outputs: TaskOutput[];
}
export interface VideoAutomationTask {
    id: string;
    phase: string;
    generation: VideoGenerationRequest;
    triggers: TaskTrigger[];
    outputs: TaskOutput[];
}
export interface IntegrationTask {
    id: string;
    phase: string;
    browserComponent?: string;
    videoComponent?: string;
    coordination: CoordinationStrategy;
    outputs: TaskOutput[];
}
export interface TaskTrigger {
    type: "manual" | "automatic" | "conditional" | "scheduled";
    condition?: string;
    schedule?: string;
    dependencies: string[];
}
export interface TaskOutput {
    type: "artifact" | "data" | "validation" | "documentation";
    format: string;
    destination: string;
    metadata: Record<string, any>;
}
export interface SparcValidation {
    enabledPhases: string[];
    rules: ValidationRule[];
    automation: boolean;
    reporting: boolean;
}
export interface ValidationRule {
    id: string;
    phase: string;
    type: "syntax" | "semantic" | "functional" | "performance" | "security";
    condition: string;
    severity: "low" | "medium" | "high" | "critical";
    automated: boolean;
}
export interface SparcDocumentation {
    enabledPhases: string[];
    formats: DocumentationFormat[];
    automation: boolean;
    templates: DocumentationTemplate[];
}
export interface DocumentationFormat {
    type: "markdown" | "html" | "pdf" | "video" | "interactive";
    enabled: boolean;
    template?: string;
}
export interface DocumentationTemplate {
    id: string;
    phase: string;
    format: string;
    template: string;
    variables: string[];
}
export interface A2aCoordinationConfig {
    enabled: boolean;
    protocol: "raft" | "pbft" | "gossip" | "hybrid";
    agents: A2aAgentConfig[];
    consensus: ConsensusConfig;
    communication: CommunicationConfig;
}
export interface A2aAgentConfig {
    id: string;
    type: "browser" | "video" | "coordinator" | "validator" | "documenter";
    capabilities: string[];
    resources: ResourceAllocation;
    priority: number;
}
export interface ResourceAllocation {
    cpu: number;
    memory: number;
    storage: number;
    network: number;
    gpu?: boolean;
}
export interface ConsensusConfig {
    algorithm: "raft" | "pbft" | "pow" | "pos";
    quorum: number;
    timeout: number;
    retryAttempts: number;
}
export interface CommunicationConfig {
    protocol: "websocket" | "grpc" | "http" | "message-queue";
    encryption: boolean;
    compression: boolean;
    batching: boolean;
}
export interface WorkflowConfig {
    maxConcurrentTasks: number;
    taskTimeout: number;
    retryPolicy: RetryPolicy;
    prioritization: PrioritizationConfig;
    loadBalancing: LoadBalancingConfig;
}
export interface RetryPolicy {
    maxAttempts: number;
    backoffStrategy: "linear" | "exponential" | "fixed";
    backoffMs: number;
    conditions: string[];
}
export interface PrioritizationConfig {
    strategy: "fifo" | "priority" | "deadline" | "adaptive";
    factors: PriorityFactor[];
}
export interface PriorityFactor {
    name: string;
    weight: number;
    calculation: string;
}
export interface LoadBalancingConfig {
    strategy: "round-robin" | "least-loaded" | "capability-based" | "performance-based";
    healthCheck: boolean;
    failover: boolean;
}
export interface MonitoringConfig {
    enabled: boolean;
    metrics: MetricConfig[];
    alerts: AlertConfig[];
    dashboard: DashboardConfig;
}
export interface MetricConfig {
    name: string;
    type: "counter" | "gauge" | "histogram" | "summary";
    labels: string[];
    aggregation: "sum" | "avg" | "max" | "min" | "percentile";
}
export interface AlertConfig {
    name: string;
    condition: string;
    severity: "info" | "warning" | "error" | "critical";
    channels: string[];
    cooldown: number;
}
export interface DashboardConfig {
    enabled: boolean;
    panels: DashboardPanel[];
    refreshInterval: number;
    themes: string[];
}
export interface DashboardPanel {
    id: string;
    type: "graph" | "table" | "stat" | "log" | "heatmap";
    title: string;
    metrics: string[];
    timeRange: string;
}
export interface SparcWorkflowExecution {
    id: string;
    phase: string;
    tasks: SparcTask[];
    status: "pending" | "running" | "completed" | "failed" | "cancelled";
    progress: number;
    startTime: Date;
    endTime?: Date;
    artifacts: SparcArtifact[];
    validationResults: ValidationResult[];
}
export interface SparcTask {
    id: string;
    type: "browser" | "video" | "integration" | "validation" | "documentation";
    status: "pending" | "running" | "completed" | "failed";
    assignedAgent?: string;
    progress: number;
    dependencies: string[];
    outputs: any[];
    errors: string[];
}
export interface SparcArtifact {
    id: string;
    type: string;
    phase: string;
    content: any;
    metadata: Record<string, any>;
    createdAt: Date;
    validationStatus: "pending" | "valid" | "invalid";
}
export interface ValidationResult {
    ruleId: string;
    phase: string;
    status: "passed" | "failed" | "warning";
    message: string;
    severity: "low" | "medium" | "high" | "critical";
    timestamp: Date;
    automated: boolean;
}
export interface CoordinationStrategy {
    type: "sequential" | "parallel" | "pipeline" | "adaptive";
    coordination: "tight" | "loose" | "eventual";
    synchronization: string[];
    failureHandling: "abort" | "continue" | "retry" | "fallback";
}
export declare class SparcConnector extends BaseIntegration {
    private config;
    private browserOrchestrator;
    private webAgentCoordinator;
    private formFiller;
    private sessionManager;
    private videoGenerationPipeline;
    private googleCloudStorage;
    private workflowEngine;
    private a2aCoordinator;
    private validationEngine;
    private documentationEngine;
    private monitoringSystem;
    private activeWorkflows;
    private taskQueue;
    private agentPool;
    private connectorMetrics;
    constructor(config: SparcConnectorConfig);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    healthCheck(): Promise<HealthStatus>;
    getMetrics(): Record<string, number>;
    executeSparcWorkflow(workflowDefinition: SparcWorkflowDefinition): Promise<SparcWorkflowExecution>;
    executeIntegratedTask(request: IntegratedTaskRequest): Promise<IntegratedTaskResult>;
    coordinateBrowserAndVideo(browserWorkflow: WebWorkflow, videoRequest: VideoGenerationRequest, coordination: CoordinationStrategy): Promise<CoordinatedResult>;
    private initializeComponents;
    private initializeIntegrationComponents;
    private shutdownComponents;
    private setupComponentCommunication;
    private executeSparcPhase;
    private createPhaseTasks;
    private executeSparcTask;
    private executeBrowserTask;
    private executeVideoTask;
    private executeIntegrationTask;
    private executeValidationTask;
    private executeDocumentationTask;
    private cancelWorkflow;
    private enhanceVideoRequestFromBrowser;
    private executeAdaptiveCoordination;
    private combineResults;
    private coordinateResults;
}
export interface SparcWorkflowDefinition {
    id: string;
    name: string;
    phases: SparcPhaseDefinition[];
    metadata: Record<string, any>;
}
export interface SparcPhaseDefinition {
    name: string;
    tasks: string[];
    automation: boolean;
    validation: boolean;
    documentation: boolean;
}
export interface IntegratedTaskRequest {
    type: string;
    browserTask?: BrowserTaskComponent;
    videoTask?: VideoTaskComponent;
    coordination?: CoordinationStrategy;
}
export interface BrowserTaskComponent {
    type: "workflow" | "form_filling" | "multi_site";
    workflow?: WebWorkflow;
    formRequest?: FormFillingRequest;
    sites?: string[];
    action?: MultiSiteAction;
}
export interface VideoTaskComponent {
    type: "generation" | "chunked" | "distributed";
    request?: VideoGenerationRequest;
    chunkedRequest?: ChunkedVideoRequest;
    distributedRequest?: DistributedGenerationRequest;
}
export interface IntegratedTaskResult {
    taskId: string;
    success: boolean;
    results: any;
    duration: number;
    error?: string;
    metadata: Record<string, any>;
}
export interface CoordinatedResult {
    id: string;
    success: boolean;
    browserResult: WorkflowResult;
    videoResult: VideoGenerationResult;
    coordination: string;
    metadata: Record<string, any>;
}
//# sourceMappingURL=sparc-connector.d.ts.map