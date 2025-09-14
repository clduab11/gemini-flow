/**
 * Queue Prioritization System with Fairness Algorithms
 * Implements advanced queue management with priority balancing and fairness controls
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
export interface QueueItem<T = any> {
    id: string;
    data: T;
    priority: number;
    timestamp: number;
    deadline?: number;
    retries: number;
    maxRetries: number;
    cost: number;
    userId: string;
    tier: "free" | "basic" | "premium" | "enterprise";
    estimatedProcessingTime: number;
    metadata: {
        source: string;
        type: string;
        size: number;
        complexity: "low" | "medium" | "high" | "critical";
    };
}
export interface QueueMetrics {
    totalItems: number;
    processedItems: number;
    failedItems: number;
    averageWaitTime: number;
    averageProcessingTime: number;
    throughputPerSecond: number;
    fairnessScore: number;
    tierDistribution: Map<string, number>;
}
export interface FairnessPolicy {
    algorithm: "weighted-fair" | "lottery" | "stride" | "proportional-share";
    tierWeights: Map<string, number>;
    maxStarvationTime: number;
    agingFactor: number;
    burstAllowance: number;
}
export interface ProcessingResult<T = any> {
    success: boolean;
    result?: T;
    error?: string;
    processingTime: number;
    resourcesUsed: {
        cpu: number;
        memory: number;
        network: number;
    };
}
export declare class QueuePrioritizationSystem<T = any> extends EventEmitter {
    private policy;
    private queues;
    private fairnessManager;
    private loadBalancer;
    private metricsCollector;
    private starvationPreventer;
    private adaptiveScheduler;
    constructor(policy: FairnessPolicy);
    /**
     * Add item to appropriate queue with priority calculation
     */
    enqueue(item: QueueItem<T>): Promise<void>;
    /**
     * Dequeue next item based on fairness algorithm
     */
    dequeue(): Promise<QueueItem<T> | null>;
    /**
     * Process item with monitoring and feedback
     */
    processItem(item: QueueItem<T>, processor: (data: T) => Promise<ProcessingResult<any>>): Promise<ProcessingResult<any>>;
    /**
     * Get comprehensive queue metrics
     */
    getMetrics(): Map<string, QueueMetrics>;
    /**
     * Get overall system fairness score
     */
    getFairnessScore(): number;
    /**
     * Adjust fairness policy dynamically
     */
    adjustFairnessPolicy(updates: Partial<FairnessPolicy>): Promise<void>;
    /**
     * Optimize queue configuration based on patterns
     */
    optimizeConfiguration(): Promise<{
        recommendations: string[];
        expectedImprovement: number;
        changes: any[];
    }>;
    /**
     * Handle burst traffic with adaptive capacity
     */
    handleBurst(expectedLoad: number, duration: number): Promise<void>;
    private initializeSystem;
    private calculateDynamicPriority;
    private selectQueue;
    private ensureQueue;
    private handleProcessingFailure;
    private performMaintenance;
    private performAging;
    private updateFairnessMetrics;
}
declare class PriorityQueue<T> {
    private items;
    enqueue(item: QueueItem<T>): void;
    dequeue(): QueueItem<T> | null;
    peek(): QueueItem<T> | null;
    isEmpty(): boolean;
    size(): number;
    ageItems(currentTime: number, threshold: number, agingFactor: number): void;
    getItems(): QueueItem<T>[];
}
declare class FairnessManager {
    private policy;
    private queueProcessingCounts;
    private lastProcessingTimes;
    private fairnessScores;
    constructor(policy: FairnessPolicy);
    calculateAdjustment(item: QueueItem<any>): Promise<number>;
    selectNextQueue(queues: Map<string, PriorityQueue<any>>): Promise<string | null>;
    recordProcessing(queueId: string, item: QueueItem<any>): Promise<void>;
    calculateOverallFairnessScore(): number;
    updatePolicy(updates: Partial<FairnessPolicy>): Promise<void>;
    updateMetrics(): Promise<void>;
    private weightedFairSelection;
    private lotterySelection;
    private strideSelection;
    private proportionalShareSelection;
    private calculateQueueFairnessScore;
}
declare class QueueLoadBalancer {
    selectOptimalQueue(queues: Map<string, PriorityQueue<any>>): string | null;
}
declare class QueueMetricsCollector {
    private enqueueCounts;
    private dequeueCounts;
    private processingTimes;
    private waitTimes;
    private failures;
    recordEnqueue(item: QueueItem<any>, queueId: string): void;
    recordDequeue(item: QueueItem<any>, queueId: string): void;
    recordProcessing(item: QueueItem<any>, processingTime: number, success: boolean): void;
    recordFailure(item: QueueItem<any>, error: string): void;
    getQueueMetrics(queueId: string): QueueMetrics;
}
declare class StarvationPreventer {
    private policy;
    constructor(policy: FairnessPolicy);
    checkAndPrevent(queueId: string): Promise<void>;
    checkAllQueues(): Promise<void>;
}
declare class AdaptiveScheduler {
    recordOutcome(item: QueueItem<any>, result: ProcessingResult<any>, processingTime: number): Promise<void>;
    analyzePerformance(): Promise<{
        queueImbalance: number;
        fairnessViolations: number;
        starvationIncidents: number;
        suggestedWeights: Map<string, number>;
        potentialImprovement: number;
    }>;
    prepareBurstHandling(expectedLoad: number, duration: number): Promise<void>;
    restoreNormalOperation(): void;
}
export { PriorityQueue, FairnessManager, QueueLoadBalancer, QueueMetricsCollector, StarvationPreventer, AdaptiveScheduler, };
//# sourceMappingURL=queue-prioritization-system.d.ts.map