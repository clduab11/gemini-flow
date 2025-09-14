/**
 * Dynamic Capability Composer
 *
 * Provides runtime composition and aggregation of A2A capabilities.
 * Enables dynamic workflow creation, capability chaining, and intelligent
 * resource allocation based on context and requirements.
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { A2AToolContext } from "./a2a-tool-wrapper.js";
import { CapabilityManager } from "./capability-manager.js";
export interface CompositionRequest {
    id?: string;
    name: string;
    description: string;
    requirements: {
        capabilities: string[];
        constraints?: {
            maxLatency?: number;
            maxResourceUsage?: "low" | "medium" | "high";
            minTrustLevel?: string;
            budget?: number;
        };
        preferences?: {
            strategy?: "performance" | "reliability" | "cost" | "balanced";
            parallelization?: boolean;
            caching?: boolean;
            faultTolerance?: "none" | "retry" | "fallback" | "redundancy";
        };
    };
    context: A2AToolContext;
    parameters: Record<string, any>;
}
export interface CompositionPlan {
    id: string;
    request: CompositionRequest;
    selectedCapabilities: string[];
    executionGraph: ExecutionNode[];
    estimatedMetrics: {
        totalLatency: number;
        resourceUsage: "low" | "medium" | "high";
        reliability: number;
        cost: number;
    };
    optimizations: string[];
    riskAssessment: {
        level: "low" | "medium" | "high";
        factors: string[];
        mitigations: string[];
    };
}
export interface ExecutionNode {
    id: string;
    capabilityId: string;
    dependencies: string[];
    parameters: Record<string, any>;
    conditions?: ExecutionCondition[];
    retryPolicy?: RetryPolicy;
    timeout: number;
    priority: number;
}
export interface ExecutionCondition {
    type: "success" | "failure" | "value" | "custom";
    source?: string;
    operator?: "equals" | "greater" | "less" | "contains" | "exists";
    value?: any;
    customCheck?: (context: ExecutionContext) => boolean;
}
export interface RetryPolicy {
    maxAttempts: number;
    backoff: "fixed" | "exponential" | "linear";
    baseDelay: number;
    maxDelay: number;
    retryConditions: string[];
}
export interface ExecutionContext {
    planId: string;
    requestId: string;
    currentNode: string;
    results: Map<string, any>;
    errors: Map<string, Error>;
    metadata: Record<string, any>;
    startTime: number;
}
export interface DynamicAggregation {
    id: string;
    name: string;
    targetCapabilities: string[];
    aggregationStrategy: "merge" | "sequence" | "parallel" | "conditional";
    resultCombination: "union" | "intersection" | "first" | "best" | "custom";
    qualityMetrics: {
        accuracy: number;
        completeness: number;
        consistency: number;
    };
    adaptationRules: AdaptationRule[];
}
export interface AdaptationRule {
    trigger: "performance" | "error" | "context" | "resource";
    condition: any;
    actions: AdaptationAction[];
}
export interface AdaptationAction {
    type: "replace" | "add" | "remove" | "reorder" | "configure";
    target: string;
    parameters: Record<string, any>;
}
/**
 * Main dynamic capability composer
 */
export declare class DynamicCapabilityComposer extends EventEmitter {
    private logger;
    private cache;
    private performanceMonitor;
    private capabilityManager;
    private compositionPlans;
    private activeExecutions;
    private aggregations;
    private adaptationHistory;
    constructor(capabilityManager: CapabilityManager);
    /**
     * Create a dynamic composition plan from requirements
     */
    createCompositionPlan(request: CompositionRequest): Promise<CompositionPlan>;
    /**
     * Execute a composition plan
     */
    executeCompositionPlan(planId: string, runtimeParameters?: Record<string, any>): Promise<any>;
    /**
     * Create a dynamic aggregation
     */
    createDynamicAggregation(name: string, targetCapabilities: string[], strategy?: DynamicAggregation["aggregationStrategy"], options?: {
        resultCombination?: DynamicAggregation["resultCombination"];
        adaptationRules?: AdaptationRule[];
    }): Promise<DynamicAggregation>;
    /**
     * Execute dynamic aggregation
     */
    executeDynamicAggregation(aggregationId: string, parameters: Record<string, any>, context: A2AToolContext): Promise<any>;
    /**
     * Adapt composition based on runtime feedback
     */
    adaptComposition(planId: string, feedback: {
        performanceIssues?: string[];
        qualityIssues?: string[];
        resourceConstraints?: string[];
        contextChanges?: Record<string, any>;
    }): Promise<CompositionPlan>;
    /**
     * Private helper methods
     */
    private selectCapabilities;
    private selectBestCapability;
    private createExecutionGraph;
    private optimizeExecutionGraph;
    private parallelizeGraph;
    private hasDataDependency;
    private reorderByPriority;
    private estimateExecutionMetrics;
    private assessExecutionRisks;
    private getTrustLevelIndex;
    private generateOptimizations;
    private executeExecutionGraph;
    private executeNode;
    private calculateRetryDelay;
    private executeMergeAggregation;
    private executeSequenceAggregation;
    private executeParallelAggregation;
    private executeConditionalAggregation;
    private combineAggregationResults;
    private updateQualityMetrics;
    private checkAdaptationTriggers;
    private evaluateAdaptationTrigger;
    private applyAdaptationActions;
    private analyzeAdaptationNeeds;
    private applyAdaptations;
    private recordAdaptation;
    private generatePlanId;
    private generateRequestId;
    private generateAggregationId;
    /**
     * Public API methods for management
     */
    getCompositionPlan(planId: string): CompositionPlan | undefined;
    listCompositionPlans(): CompositionPlan[];
    getDynamicAggregation(aggregationId: string): DynamicAggregation | undefined;
    listDynamicAggregations(): DynamicAggregation[];
    getActiveExecutions(): ExecutionContext[];
}
//# sourceMappingURL=dynamic-capability-composer.d.ts.map