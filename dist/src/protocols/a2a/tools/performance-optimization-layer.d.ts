/**
 * Performance Optimization Layer
 *
 * Provides intelligent performance optimization for A2A tool invocations.
 * Includes predictive optimization, adaptive resource allocation, and
 * machine learning-based performance tuning.
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { PerformanceMonitor } from "../../../monitoring/performance-monitor.js";
import { A2AToolInvocation, A2AToolResponse, A2AToolContext } from "./a2a-tool-wrapper.js";
import { MCPToolRegistry } from "./mcp-a2a-tool-registry.js";
export interface PerformanceProfile {
    toolId: string;
    averageLatency: number;
    p95Latency: number;
    p99Latency: number;
    successRate: number;
    errorRate: number;
    throughput: number;
    resourceUtilization: {
        cpu: number;
        memory: number;
        network: number;
        io: number;
    };
    contextMetrics: {
        trustLevelPerformance: Record<string, number>;
        parameterSizeImpact: number;
        timeOfDayVariance: number;
        loadFactorImpact: number;
    };
    lastUpdated: Date;
}
export interface OptimizationStrategy {
    id: string;
    name: string;
    description: string;
    conditions: OptimizationCondition[];
    actions: OptimizationAction[];
    priority: number;
    successRate: number;
    averageImprovement: number;
    enabled: boolean;
}
export interface OptimizationCondition {
    type: "latency" | "error_rate" | "throughput" | "resource_usage" | "context" | "custom";
    operator: "gt" | "lt" | "eq" | "gte" | "lte" | "contains" | "matches";
    value: any;
    threshold?: number;
    customCheck?: (profile: PerformanceProfile, context: A2AToolContext) => boolean;
}
export interface OptimizationAction {
    type: "cache" | "parallel" | "retry" | "circuit_breaker" | "load_balance" | "precompute" | "batch" | "custom";
    parameters: Record<string, any>;
    execute: (invocation: A2AToolInvocation, context: OptimizationContext) => Promise<OptimizationResult>;
}
export interface OptimizationContext {
    originalInvocation: A2AToolInvocation;
    performanceProfile: PerformanceProfile;
    systemLoad: SystemLoadMetrics;
    historicalData: HistoricalPerformanceData;
    constraints: PerformanceConstraints;
}
export interface OptimizationResult {
    success: boolean;
    optimizationApplied: string[];
    performanceImprovement: {
        latencyReduction: number;
        throughputIncrease: number;
        resourceSavings: Record<string, number>;
    };
    response?: A2AToolResponse;
    metadata: {
        executionTime: number;
        optimizationOverhead: number;
        cacheHit: boolean;
        fallbackUsed: boolean;
    };
}
export interface SystemLoadMetrics {
    cpuUsage: number;
    memoryUsage: number;
    networkLatency: number;
    diskIO: number;
    activeConnections: number;
    queueLength: number;
    timestamp: Date;
}
export interface HistoricalPerformanceData {
    timeWindow: string;
    invocations: number;
    patterns: {
        peakHours: number[];
        commonParameterSizes: number[];
        frequentErrors: string[];
        performanceTrends: Array<{
            timestamp: Date;
            metric: string;
            value: number;
        }>;
    };
}
export interface PerformanceConstraints {
    maxLatency?: number;
    maxResourceUsage?: number;
    minSuccessRate?: number;
    budget?: number;
    availabilityTarget?: number;
}
export interface PredictionModel {
    id: string;
    name: string;
    type: "linear" | "neural" | "ensemble" | "statistical";
    features: string[];
    accuracy: number;
    lastTrained: Date;
    predictions: Record<string, any>;
}
/**
 * Main performance optimization layer
 */
export declare class PerformanceOptimizationLayer extends EventEmitter {
    private logger;
    private cache;
    private performanceMonitor;
    private toolRegistry;
    private performanceProfiles;
    private optimizationStrategies;
    private systemLoadHistory;
    private predictionModels;
    private circuitBreakers;
    private loadBalancers;
    private batchProcessors;
    constructor(toolRegistry: MCPToolRegistry, performanceMonitor: PerformanceMonitor);
    /**
     * Optimize tool invocation with intelligent strategies
     */
    optimizeInvocation(invocation: A2AToolInvocation): Promise<OptimizationResult>;
    /**
     * Get or create performance profile for a tool
     */
    getPerformanceProfile(toolId: string): Promise<PerformanceProfile>;
    /**
     * Predict performance for an invocation
     */
    predictPerformance(invocation: A2AToolInvocation): Promise<{
        estimatedLatency: number;
        estimatedSuccessRate: number;
        estimatedResourceUsage: Record<string, number>;
        confidence: number;
    }>;
    /**
     * Enable or disable optimization strategies
     */
    configureOptimizationStrategy(strategyId: string, enabled: boolean): void;
    /**
     * Add custom optimization strategy
     */
    addOptimizationStrategy(strategy: OptimizationStrategy): void;
    /**
     * Get performance statistics
     */
    getPerformanceStatistics(): {
        totalOptimizations: number;
        averageImprovement: number;
        strategyEffectiveness: Record<string, number>;
        systemLoad: SystemLoadMetrics;
        profileCount: number;
    };
    /**
     * Private helper methods
     */
    private initializeOptimizationStrategies;
    private selectOptimizationStrategies;
    private evaluateConditions;
    private evaluateCondition;
    private compareValues;
    private applyOptimizationStrategy;
    private applyCachingOptimization;
    private applyCircuitBreakerOptimization;
    private applyLoadBalancingOptimization;
    private applyParallelExecutionOptimization;
    private applyBatchProcessingOptimization;
    private executeWithoutOptimization;
    private generateCacheKey;
    private canParallelize;
    private extractConstraints;
    private getCurrentSystemLoad;
    private getHistoricalData;
    private updatePerformanceProfile;
    private updateStrategyMetrics;
    private startPerformanceMonitoring;
    private getOrCreateCircuitBreaker;
    private getOrCreateLoadBalancer;
    private getOrCreateBatchProcessor;
}
//# sourceMappingURL=performance-optimization-layer.d.ts.map