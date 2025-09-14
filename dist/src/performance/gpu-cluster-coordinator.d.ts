/**
 * GPU Cluster Coordinator - Distributed rendering and compute management
 * Handles GPU resource allocation, load balancing, and fault tolerance
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
export interface GPUNode {
    id: string;
    type: "nvidia" | "amd" | "intel" | "apple";
    model: string;
    vram: number;
    cores: number;
    clockSpeed: number;
    utilization: number;
    temperature: number;
    powerUsage: number;
    status: "online" | "offline" | "maintenance" | "error";
    capabilities: GPUCapability[];
    lastHeartbeat: number;
    location: {
        datacenter: string;
        rack: string;
        position: number;
    };
}
export interface GPUCapability {
    name: string;
    version: string;
    performance: number;
    powerEfficiency: number;
}
export interface RenderingTask {
    id: string;
    type: "video" | "image" | "ml" | "compute";
    priority: "low" | "medium" | "high" | "critical";
    requirements: {
        vram: number;
        cores: number;
        capabilities: string[];
        maxLatency: number;
        estimatedDuration: number;
    };
    data: {
        input: ArrayBuffer;
        parameters: Record<string, any>;
        outputFormat: string;
    };
    qos: {
        maxRetries: number;
        deadline: number;
        costBudget: number;
    };
    metadata: {
        userId: string;
        sessionId: string;
        timestamp: number;
    };
}
export interface ClusterMetrics {
    totalNodes: number;
    activeNodes: number;
    totalVRAM: number;
    availableVRAM: number;
    averageUtilization: number;
    powerConsumption: number;
    tasksCompleted: number;
    tasksQueued: number;
    averageLatency: number;
    errorRate: number;
}
export declare class GPUClusterCoordinator extends EventEmitter {
    private nodes;
    private taskQueue;
    private activeTasks;
    private loadBalancer;
    private faultTolerance;
    private resourcePool;
    private scheduler;
    constructor();
    /**
     * Add GPU node to the cluster
     */
    addNode(node: GPUNode): Promise<void>;
    /**
     * Remove GPU node from cluster
     */
    removeNode(nodeId: string): Promise<void>;
    /**
     * Submit rendering task to the cluster
     */
    submitTask(task: RenderingTask): Promise<string>;
    /**
     * Get optimal node for task execution
     */
    selectOptimalNode(task: RenderingTask): Promise<string | null>;
    /**
     * Execute task on selected node
     */
    executeTask(task: RenderingTask, nodeId: string): Promise<any>;
    /**
     * Real-time cluster monitoring
     */
    getClusterMetrics(): ClusterMetrics;
    /**
     * Auto-scaling based on workload
     */
    autoScale(): Promise<void>;
    /**
     * Health monitoring and fault detection
     */
    monitorHealth(): Promise<void>;
    /**
     * Predictive resource allocation
     */
    predictResourceNeeds(): Promise<ResourcePrediction>;
    private initializeCluster;
    private validateNode;
    private validateTask;
    private calculateTaskPriority;
    private findSuitableNodes;
    private hasRequiredCapabilities;
    private determineBalancingStrategy;
    private scheduleNextTask;
    private executeWithMonitoring;
    private updateNodeMetrics;
    private migrateActiveTasks;
    private handleNodeTimeout;
    private handleThermalThrottling;
    private redistributeTasks;
    private getMaxNodeVRAM;
    private calculateAverageLatency;
    private requestAdditionalNodes;
    private releaseUnderutilizedNodes;
    private analyzeCurrentTrends;
    private predictHourlyNeeds;
    private predictDailyNeeds;
    private identifyPeakTimes;
    private generateScalingRecommendations;
}
declare class PriorityQueue<T> {
    private items;
    enqueue(item: T, priority: number): void;
    dequeue(): T | undefined;
    peek(): T | undefined;
    size(): number;
    isEmpty(): boolean;
}
declare class LoadBalancer {
    private nodeWeights;
    registerNode(node: GPUNode): void;
    unregisterNode(nodeId: string): void;
    setNodeWeight(nodeId: string, weight: number): void;
    selectNode(candidates: GPUNode[], strategy: string, task: RenderingTask): string | null;
    private calculateCapabilityScore;
}
declare class FaultToleranceManager {
    private errorCounts;
    private retryAttempts;
    handleTaskFailure(task: RenderingTask, nodeId: string, error: any): Promise<any>;
    private recordError;
    getErrorRate(): number;
}
declare class ResourcePool {
    private reservedResources;
    private totalResources;
    addResources(node: GPUNode): void;
    removeResources(nodeId: string): void;
    reserveResources(nodeId: string, requirements: {
        vram: number;
        cores: number;
    }): Promise<void>;
    releaseResources(nodeId: string, requirements: {
        vram: number;
        cores: number;
    }): Promise<void>;
    getAvailableVRAM(): number;
}
declare class TaskScheduler {
    private completedTasks;
    private historicalData;
    getCompletedTaskCount(): number;
    incrementCompletedTasks(): void;
    getHistoricalData(): any[];
}
interface ResourcePrediction {
    nextHour: {
        vram: number;
        cores: number;
        estimatedTasks: number;
    };
    nextDay: {
        vram: number;
        cores: number;
        estimatedTasks: number;
    };
    peakTimes: number[];
    recommendations: string[];
}
export { LoadBalancer, FaultToleranceManager, ResourcePool, TaskScheduler, PriorityQueue, ResourcePrediction, };
//# sourceMappingURL=gpu-cluster-coordinator.d.ts.map