/**
 * Mariner Automation with Browser Orchestration
 *
 * Advanced browser automation engine with AI-driven testing,
 * performance monitoring, and intelligent task orchestration.
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { AutomationTask, ServiceResponse, PerformanceMetrics } from "./interfaces.js";
export interface MarinerAutomationConfig {
    browser: BrowserConfig;
    orchestration: OrchestrationConfig;
    ai: AIConfig;
    monitoring: MonitoringConfig;
    plugins: PluginConfig[];
}
export interface BrowserConfig {
    engine: "chromium" | "firefox" | "webkit";
    headless: boolean;
    devtools: boolean;
    proxy?: ProxyConfig;
    userAgent?: string;
    viewport: ViewportConfig;
    performance: PerformanceConfig;
}
export interface ProxyConfig {
    server: string;
    username?: string;
    password?: string;
    bypass?: string[];
}
export interface ViewportConfig {
    width: number;
    height: number;
    deviceScaleFactor: number;
    isMobile: boolean;
    hasTouch: boolean;
    isLandscape: boolean;
}
export interface PerformanceConfig {
    cpuThrottling: number;
    networkThrottling?: NetworkThrottling;
    cacheDisabled: boolean;
    javascriptEnabled: boolean;
    imagesEnabled: boolean;
}
export interface NetworkThrottling {
    offline: boolean;
    downloadThroughput: number;
    uploadThroughput: number;
    latency: number;
}
export interface OrchestrationConfig {
    maxConcurrentBrowsers: number;
    taskQueue: TaskQueueConfig;
    scheduling: SchedulingConfig;
    resourceManagement: ResourceManagementConfig;
}
export interface TaskQueueConfig {
    maxSize: number;
    priority: "fifo" | "lifo" | "priority" | "deadline";
    timeout: number;
    retries: number;
}
export interface SchedulingConfig {
    algorithm: "round_robin" | "least_loaded" | "priority" | "deadline";
    loadBalancing: boolean;
    affinity: boolean;
}
export interface ResourceManagementConfig {
    memoryLimit: number;
    cpuLimit: number;
    diskSpace: number;
    cleanupInterval: number;
}
export interface AIConfig {
    enabled: boolean;
    model: string;
    capabilities: AICapability[];
    learning: LearningConfig;
}
export interface AICapability {
    name: string;
    type: "vision" | "text" | "interaction" | "prediction";
    confidence: number;
    fallback?: string;
}
export interface LearningConfig {
    enabled: boolean;
    dataCollection: boolean;
    modelUpdates: boolean;
    feedbackLoop: boolean;
}
export interface MonitoringConfig {
    performance: boolean;
    screenshots: boolean;
    videos: boolean;
    networkLogs: boolean;
    consoleLogs: boolean;
    metrics: MetricsConfig;
}
export interface MetricsConfig {
    loadTime: boolean;
    networkRequests: boolean;
    memoryUsage: boolean;
    cpuUsage: boolean;
    errors: boolean;
}
export interface PluginConfig {
    name: string;
    enabled: boolean;
    configuration: Record<string, any>;
}
export interface TaskExecution {
    id: string;
    task: AutomationTask;
    status: "pending" | "running" | "completed" | "failed" | "cancelled";
    startTime?: Date;
    endTime?: Date;
    result?: TaskResult;
    error?: TaskError;
    metrics?: ExecutionMetrics;
}
export interface TaskResult {
    success: boolean;
    data: any;
    screenshots: string[];
    logs: LogEntry[];
    extractedData: Record<string, any>;
}
export interface TaskError {
    message: string;
    stack?: string;
    step?: number;
    screenshot?: string;
    retryable: boolean;
}
export interface ExecutionMetrics {
    duration: number;
    stepsExecuted: number;
    memoryUsed: number;
    networkRequests: number;
    errorsEncountered: number;
}
export interface LogEntry {
    timestamp: Date;
    level: "debug" | "info" | "warn" | "error";
    message: string;
    source: string;
    data?: any;
}
export declare class MarinerAutomation extends EventEmitter {
    private logger;
    private config;
    private browsers;
    private taskQueue;
    private scheduler;
    private aiEngine;
    private monitoringService;
    private pluginManager;
    private resourceManager;
    constructor(config: MarinerAutomationConfig);
    /**
     * Initializes the automation engine
     */
    initialize(): Promise<void>;
    /**
     * Submits a task for execution
     */
    submitTask(task: AutomationTask): Promise<ServiceResponse<string>>;
    /**
     * Executes a task immediately
     */
    executeTask(task: AutomationTask): Promise<ServiceResponse<TaskResult>>;
    /**
     * Gets task execution status
     */
    getTaskStatus(taskId: string): Promise<ServiceResponse<TaskExecution>>;
    /**
     * Cancels a task execution
     */
    cancelTask(taskId: string): Promise<ServiceResponse<void>>;
    /**
     * Gets automation performance metrics
     */
    getMetrics(): Promise<ServiceResponse<PerformanceMetrics>>;
    /**
     * Shuts down the automation engine
     */
    shutdown(): Promise<void>;
    private initializeComponents;
    private setupEventHandlers;
    private validateTask;
    private isValidStep;
    private isValidCondition;
    private acquireBrowser;
    private getAvailableBrowser;
    private createBrowser;
    private waitForAvailableBrowser;
    private releaseBrowser;
    private executeTaskSteps;
    private executeStep;
    private checkConditions;
    private evaluateCondition;
    private closeAllBrowsers;
    private isRetryableError;
    private generateBrowserId;
    private generateRequestId;
    private createErrorResponse;
    private handleTaskReady;
    private handleLowResources;
    private handlePerformanceDegradation;
}
//# sourceMappingURL=mariner-automation.d.ts.map