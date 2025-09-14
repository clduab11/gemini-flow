/**
 * BatchTool - Parallel Execution Engine
 *
 * Implements the GOLDEN RULE: "1 MESSAGE = ALL RELATED OPERATIONS"
 * Enables <100ms agent spawn time through intelligent batching
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
export interface BatchOperation {
    id: string;
    type: "agent_spawn" | "task_execute" | "memory_op" | "file_op" | "command";
    operation: any;
    dependencies?: string[];
    priority?: number;
    timeout?: number;
}
export interface BatchResult {
    id: string;
    success: boolean;
    result?: any;
    error?: Error;
    duration: number;
    metadata?: any;
}
export declare class BatchTool extends EventEmitter {
    private workers;
    private resourcePool;
    private dependencyGraph;
    private performanceMonitor;
    private logger;
    private config;
    private metrics;
    constructor(config?: Partial<typeof BatchTool.prototype.config>);
    /**
     * Execute batch of operations in parallel
     */
    executeBatch(operations: BatchOperation[]): Promise<BatchResult[]>;
    /**
     * Execute a single stage of operations in parallel
     */
    private executeStage;
    /**
     * Optimized agent spawning for <100ms target
     */
    private executeAgentSpawnBatch;
    /**
     * Execute single operation with retry logic
     */
    private executeOperation;
    /**
     * Perform the actual operation based on type
     */
    private performOperation;
    /**
     * Optimized agent spawning using pre-allocated resources
     */
    private spawnAgentOptimized;
    /**
     * Build dependency graph for execution planning
     */
    private buildDependencyGraph;
    /**
     * Initialize worker threads for parallel execution
     */
    private initializeWorkers;
    /**
     * Get available worker thread
     */
    private getAvailableWorker;
    /**
     * Update metrics after batch execution
     */
    private updateMetrics;
    /**
     * Calculate success rate for batch
     */
    private calculateSuccessRate;
    /**
     * Delay utility
     */
    private delay;
    /**
     * Get batch tool metrics
     */
    getMetrics(): {
        successRate: number;
        avgSpawnTimeMs: number;
        avgBatchTimeMs: number;
        throughput: number;
        totalBatches: number;
        totalOperations: number;
        successfulOps: number;
        failedOps: number;
        avgSpawnTime: number;
        avgBatchTime: number;
    };
    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;
    private spawnAgent;
    private executeTask;
    private executeMemoryOp;
    private executeFileOp;
    private executeCommand;
}
//# sourceMappingURL=batch-tool.d.ts.map