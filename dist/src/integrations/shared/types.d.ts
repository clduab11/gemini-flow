/**
 * Shared Types for Advanced Integrations
 *
 * Common interfaces and types used across Project Mariner and Veo3 integrations
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
export interface IntegrationConfig {
    id: string;
    name: string;
    version: string;
    enabled: boolean;
    dependencies: string[];
    features: Record<string, boolean>;
    performance: PerformanceConfig;
    security: SecurityConfig;
    storage: StorageConfig;
}
export interface PerformanceConfig {
    maxConcurrentOperations: number;
    timeoutMs: number;
    retryAttempts: number;
    cacheEnabled: boolean;
    cacheTTLMs: number;
    metricsEnabled: boolean;
}
export interface SecurityConfig {
    encryption: boolean;
    validateOrigins: boolean;
    allowedHosts: string[];
    tokenExpiration: number;
    auditLogging: boolean;
}
export interface StorageConfig {
    provider: "gcs" | "local" | "memory";
    bucket?: string;
    region?: string;
    credentials?: any;
    encryption: boolean;
    compression: boolean;
}
export interface Task {
    id: string;
    type: TaskType;
    priority: TaskPriority;
    status: TaskStatus;
    input: any;
    output?: any;
    error?: string;
    metadata: TaskMetadata;
    dependencies: string[];
    assignedAgent?: string;
    startTime?: Date;
    endTime?: Date;
    estimatedDuration?: number;
}
export type TaskType = "browser_automation" | "video_generation" | "data_processing" | "file_upload" | "coordination" | "monitoring";
export type TaskPriority = "low" | "medium" | "high" | "critical";
export type TaskStatus = "pending" | "queued" | "running" | "paused" | "completed" | "failed" | "cancelled";
export interface TaskMetadata {
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    tags: string[];
    resourceRequirements: ResourceRequirements;
    progressCallback?: (progress: number) => void;
    completionCallback?: (result: any) => void;
    errorCallback?: (error: Error) => void;
}
export interface ResourceRequirements {
    cpu: number;
    memory: number;
    storage: number;
    network: number;
    gpu?: boolean;
}
export interface CoordinationEvent {
    id: string;
    type: string;
    source: string;
    target?: string;
    data: any;
    timestamp: Date;
    priority: TaskPriority;
}
export interface Agent {
    id: string;
    type: AgentType;
    capabilities: string[];
    status: AgentStatus;
    currentTask?: string;
    performance: AgentPerformance;
    metadata: AgentMetadata;
}
export type AgentType = "browser_orchestrator" | "web_agent" | "video_processor" | "storage_manager" | "coordinator" | "monitor";
export type AgentStatus = "idle" | "busy" | "error" | "maintenance";
export interface AgentPerformance {
    tasksCompleted: number;
    avgExecutionTime: number;
    successRate: number;
    errorRate: number;
    lastActivity: Date;
}
export interface AgentMetadata {
    version: string;
    createdAt: Date;
    config: Record<string, any>;
    capabilities: Record<string, boolean>;
}
export interface StorageOperation {
    id: string;
    type: "upload" | "download" | "delete" | "copy" | "move";
    source: string;
    destination?: string;
    size: number;
    checksum: string;
    metadata: Record<string, any>;
    progress: number;
    status: TaskStatus;
    startTime: Date;
    endTime?: Date;
}
export interface FileMetadata {
    name: string;
    path: string;
    size: number;
    type: string;
    lastModified: Date;
    checksum: string;
    tags: string[];
    permissions: string[];
    encryption: boolean;
}
export interface MetricsSnapshot {
    timestamp: Date;
    component: string;
    metrics: Record<string, number>;
    health: HealthStatus;
    alerts: Alert[];
}
export type HealthStatus = "healthy" | "warning" | "critical" | "unknown";
export interface Alert {
    id: string;
    severity: "info" | "warning" | "error" | "critical";
    message: string;
    timestamp: Date;
    source: string;
    acknowledged: boolean;
}
export interface PerformanceMetrics {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
    operations: number;
    errors: number;
    latency: number;
    throughput: number;
}
export interface ProgressUpdate {
    taskId: string;
    progress: number;
    stage: string;
    message?: string;
    timestamp: Date;
    metadata?: Record<string, any>;
}
export interface StreamingProgress {
    total: number;
    current: number;
    rate: number;
    eta: number;
    stage: string;
    substages?: ProgressUpdate[];
}
export interface IntegrationError extends Error {
    code: string;
    component: string;
    severity: "low" | "medium" | "high" | "critical";
    recoverable: boolean;
    metadata: Record<string, any>;
    timestamp: Date;
}
export declare class IntegrationBaseError extends Error implements IntegrationError {
    code: string;
    component: string;
    severity: "low" | "medium" | "high" | "critical";
    recoverable: boolean;
    metadata: Record<string, any>;
    timestamp: Date;
    constructor(message: string, code: string, component: string, severity?: "low" | "medium" | "high" | "critical", recoverable?: boolean, metadata?: Record<string, any>);
}
export interface RetryConfig {
    maxAttempts: number;
    backoffMs: number;
    backoffMultiplier: number;
    maxBackoffMs: number;
    retryCondition?: (error: Error) => boolean;
}
export interface CacheConfig {
    enabled: boolean;
    ttlMs: number;
    maxSize: number;
    compressionEnabled: boolean;
    encryptionEnabled: boolean;
}
export interface BatchConfig {
    maxBatchSize: number;
    batchTimeoutMs: number;
    parallelism: number;
    retryConfig: RetryConfig;
}
export declare abstract class BaseIntegration extends EventEmitter {
    protected config: IntegrationConfig;
    protected logger: any;
    protected metrics: Map<string, number>;
    protected status: "initializing" | "ready" | "error" | "shutdown";
    constructor(config: IntegrationConfig);
    abstract initialize(): Promise<void>;
    abstract shutdown(): Promise<void>;
    abstract healthCheck(): Promise<HealthStatus>;
    abstract getMetrics(): Record<string, number>;
    protected recordMetric(name: string, value: number): void;
    protected emitProgress(taskId: string, progress: number, stage: string, message?: string): void;
    protected emitError(error: IntegrationError): void;
    getStatus(): string;
    isReady(): boolean;
}
//# sourceMappingURL=types.d.ts.map