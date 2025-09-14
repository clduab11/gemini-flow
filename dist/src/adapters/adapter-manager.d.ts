/**
 * Adapter Manager
 *
 * Central management for all model adapters with advanced error handling,
 * fallback strategies, and performance optimization
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { UnifiedAPIConfig, RoutingDecision, UnifiedMetrics } from "./unified-api.js";
import { ModelRequest, ModelResponse, StreamChunk, HealthCheck } from "./base-model-adapter.js";
export interface AdapterManagerConfig {
    unifiedAPI: UnifiedAPIConfig;
    errorHandling: {
        maxRetries: number;
        retryBackoff: "linear" | "exponential" | "fixed";
        retryDelay: number;
        fallbackChain: string[];
        emergencyFallback: string;
        errorThreshold: number;
    };
    performanceOptimization: {
        routingOptimization: boolean;
        adaptiveTimeouts: boolean;
        predictiveScaling: boolean;
        costOptimization: boolean;
        qualityMonitoring: boolean;
    };
    monitoring: {
        detailedLogging: boolean;
        performanceTracking: boolean;
        errorAnalytics: boolean;
        usageAnalytics: boolean;
        alerting: {
            enabled: boolean;
            thresholds: {
                errorRate: number;
                latency: number;
                availability: number;
            };
            webhooks: string[];
        };
    };
}
export interface AdapterStatus {
    name: string;
    status: "healthy" | "degraded" | "unhealthy" | "offline";
    health: HealthCheck;
    metrics: {
        requests: number;
        errors: number;
        avgLatency: number;
        successRate: number;
    };
    capabilities: string[];
    lastUsed: Date;
}
export interface SystemHealth {
    overall: "healthy" | "degraded" | "critical";
    adapters: AdapterStatus[];
    metrics: UnifiedMetrics;
    alerts: Array<{
        level: "info" | "warning" | "error" | "critical";
        message: string;
        timestamp: Date;
        adapter?: string;
    }>;
}
export declare class AdapterManager extends EventEmitter {
    private logger;
    private config;
    private unifiedAPI;
    private systemHealth;
    private alerts;
    private performancePredictor;
    private errorPatterns;
    private adaptiveThresholds;
    private fallbackHistory;
    private adapters;
    constructor(config: AdapterManagerConfig);
    /**
     * Enhanced generation with comprehensive error handling
     */
    generate(request: ModelRequest): Promise<ModelResponse>;
    /**
     * Enhanced streaming with error recovery
     */
    generateStream(request: ModelRequest): AsyncIterableIterator<StreamChunk>;
    /**
     * Execute request with comprehensive fallback chain
     */
    private executeWithFallbackChain;
    /**
     * Stream with error recovery and reconnection
     */
    private streamWithRecovery;
    /**
     * Optimize request based on patterns and predictions
     */
    private optimizeRequest;
    /**
     * Process successful response
     */
    private processSuccessfulResponse;
    /**
     * Process failed request
     */
    private processFailedRequest;
    /**
     * Update error patterns for intelligent error handling
     */
    private updateErrorPatterns;
    /**
     * Update fallback history for intelligent routing
     */
    private updateFallbackHistory;
    /**
     * Calculate backoff delay with different strategies
     */
    private calculateBackoffDelay;
    /**
     * Classify error patterns for intelligent handling
     */
    private classifyErrorPattern;
    /**
     * Analyze quality requirements from prompt
     */
    private analyzeQualityRequirements;
    /**
     * Assess response quality
     */
    private assessResponseQuality;
    /**
     * Record usage analytics
     */
    private recordUsageAnalytics;
    /**
     * Analyze error for patterns and insights
     */
    private analyzeError;
    /**
     * Check if error triggers alert thresholds
     */
    private checkAlertThresholds;
    /**
     * Trigger alert to configured webhooks
     */
    private triggerAlert;
    /**
     * Setup event handlers for unified API
     */
    private setupEventHandlers;
    /**
     * Start monitoring processes
     */
    private startMonitoring;
    /**
     * Update system health based on events
     */
    private updateSystemHealth;
    /**
     * Update adapter health from health checks
     */
    private updateAdapterHealth;
    /**
     * Update overall system health
     */
    private updateSystemHealthOverall;
    /**
     * Initialize system health structure
     */
    private initializeSystemHealth;
    getSystemHealth(): Promise<SystemHealth>;
    getRoutingDecision(request: ModelRequest): Promise<RoutingDecision>;
    healthCheck(): Promise<Record<string, HealthCheck>>;
    getErrorPatterns(): Map<string, any>;
    getFallbackHistory(): Map<string, any>;
    registerAdapter(name: string, adapter: any): void;
    hasAdapter(name: string): boolean;
    getAdapter(name: string): any;
    removeAdapter(name: string): void;
    listAdapters(): string[];
    getAdapters(names: string[]): any[];
    healthCheckAll(): Promise<Record<string, any>>;
    getAdaptersByCapability(capability: string): string[];
    getMetrics(): any;
    initializeAll(): Promise<Record<string, boolean>>;
    selectAdapter(request: any): string;
}
//# sourceMappingURL=adapter-manager.d.ts.map