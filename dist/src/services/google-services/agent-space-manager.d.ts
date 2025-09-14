/**
 * Agent Space Manager with Environment Virtualization
 *
 * Provides isolated, secure, and scalable agent execution environments
 * with comprehensive resource management and monitoring.
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { AgentEnvironment, ResourceAllocation, ServiceResponse, PerformanceMetrics } from "./interfaces.js";
export interface AgentSpaceManagerConfig {
    maxEnvironments: number;
    defaultResources: ResourceAllocation;
    security: SecurityManagerConfig;
    monitoring: MonitoringConfig;
    clustering: ClusteringConfig;
}
export interface SecurityManagerConfig {
    enabled: boolean;
    policies: SecurityPolicyConfig[];
    encryption: EncryptionConfig;
    audit: AuditConfig;
}
export interface SecurityPolicyConfig {
    name: string;
    scope: "global" | "environment" | "agent";
    rules: SecurityRuleConfig[];
}
export interface SecurityRuleConfig {
    resource: string;
    action: string;
    effect: "allow" | "deny";
    conditions: Record<string, any>;
}
export interface EncryptionConfig {
    atRest: boolean;
    inTransit: boolean;
    keyRotation: boolean;
    algorithm: string;
}
export interface AuditConfig {
    enabled: boolean;
    events: string[];
    retention: number;
    storage: string;
}
export interface MonitoringConfig {
    metricsInterval: number;
    healthChecks: boolean;
    alerting: AlertingConfig;
}
export interface AlertingConfig {
    enabled: boolean;
    thresholds: ResourceThreshold[];
    channels: string[];
}
export interface ResourceThreshold {
    metric: string;
    warning: number;
    critical: number;
}
export interface ClusteringConfig {
    enabled: boolean;
    nodes: ClusterNode[];
    loadBalancing: LoadBalancingConfig;
    failover: FailoverConfig;
}
export interface ClusterNode {
    id: string;
    hostname: string;
    port: number;
    weight: number;
    resources: ResourceAllocation;
}
export interface LoadBalancingConfig {
    algorithm: "round_robin" | "least_connections" | "resource_based" | "weighted";
    healthCheck: boolean;
    stickySession: boolean;
}
export interface FailoverConfig {
    enabled: boolean;
    timeout: number;
    retries: number;
    backupNodes: string[];
}
export declare class AgentSpaceManager extends EventEmitter {
    private logger;
    private environments;
    private resourceScheduler;
    private securityManager;
    private networkManager;
    private storageManager;
    private monitoringService;
    private clusterManager;
    private config;
    constructor(config: AgentSpaceManagerConfig);
    /**
     * Creates a new isolated agent environment
     */
    createEnvironment(name: string, type: "development" | "testing" | "production" | "sandbox", resources?: ResourceAllocation): Promise<ServiceResponse<AgentEnvironment>>;
    /**
     * Destroys an agent environment and releases resources
     */
    destroyEnvironment(environmentId: string): Promise<ServiceResponse<void>>;
    /**
     * Lists all managed environments
     */
    listEnvironments(): Promise<ServiceResponse<AgentEnvironment[]>>;
    /**
     * Gets detailed environment information
     */
    getEnvironment(environmentId: string): Promise<ServiceResponse<AgentEnvironment>>;
    /**
     * Updates environment resources
     */
    updateEnvironmentResources(environmentId: string, newResources: Partial<ResourceAllocation>): Promise<ServiceResponse<AgentEnvironment>>;
    /**
     * Gets environment performance metrics
     */
    getEnvironmentMetrics(environmentId: string): Promise<ServiceResponse<PerformanceMetrics>>;
    /**
     * Executes code in a specific environment
     */
    executeInEnvironment(environmentId: string, code: string, options?: ExecutionOptions): Promise<ServiceResponse<ExecutionResult>>;
    private initializeComponents;
    private setupEventHandlers;
    private validateEnvironmentCreation;
    private validateResourceUpdate;
    private getIsolationLevel;
    private getRestrictions;
    private getAllowedServices;
    private generateEnvironmentId;
    private generateRequestId;
    private createErrorResponse;
    private handleResourceAllocated;
    private handleResourceExhausted;
    private handleSecurityViolation;
    private handleThresholdExceeded;
}
interface ExecutionOptions {
    timeout?: number;
    memory?: number;
    environment?: Record<string, string>;
    workingDirectory?: string;
}
interface ExecutionResult {
    output: string;
    error?: string;
    exitCode: number;
    executionTime: number;
    memoryUsed: number;
}
export {};
//# sourceMappingURL=agent-space-manager.d.ts.map