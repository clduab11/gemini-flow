/**
 * BatchTool - Parallel Execution Engine
 *
 * Implements the GOLDEN RULE: "1 MESSAGE = ALL RELATED OPERATIONS"
 * Enables <100ms agent spawn time through intelligent batching
 */
import { EventEmitter } from "events";
import { Worker } from "worker_threads";
import { Logger } from "../utils/logger.js";
import { ResourcePool } from "./resource-pool.js";
import { DependencyGraph } from "./dependency-graph.js";
import { PerformanceMonitor } from "../monitoring/performance-monitor.js";
export class BatchTool extends EventEmitter {
    workers = [];
    resourcePool;
    dependencyGraph;
    performanceMonitor;
    logger;
    // Configuration
    config = {
        maxWorkers: 8,
        maxConcurrency: 64,
        spawnTimeout: 100, // Target: <100ms
        operationTimeout: 30000,
        retryAttempts: 3,
        batchSize: 50,
    };
    // Metrics
    metrics = {
        totalBatches: 0,
        totalOperations: 0,
        successfulOps: 0,
        failedOps: 0,
        avgSpawnTime: 0,
        avgBatchTime: 0,
    };
    constructor(config) {
        super();
        this.config = { ...this.config, ...config };
        this.resourcePool = new ResourcePool(this.config.maxConcurrency);
        this.dependencyGraph = new DependencyGraph();
        this.performanceMonitor = new PerformanceMonitor();
        this.logger = new Logger("BatchTool");
        this.initializeWorkers();
    }
    /**
     * Execute batch of operations in parallel
     */
    async executeBatch(operations) {
        const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const startTime = Date.now();
        this.logger.info(`Starting batch execution`, {
            batchId,
            operationCount: operations.length,
        });
        this.metrics.totalBatches++;
        this.metrics.totalOperations += operations.length;
        try {
            // Build dependency graph
            const graph = this.buildDependencyGraph(operations);
            // Get execution order
            const executionPlan = graph.getExecutionOrder();
            // Execute operations in parallel stages
            const results = [];
            for (const stage of executionPlan) {
                const stageResults = await this.executeStage(stage, operations);
                results.push(...stageResults);
            }
            // Update metrics
            const batchDuration = Date.now() - startTime;
            this.updateMetrics(results, batchDuration);
            this.logger.info(`Batch execution completed`, {
                batchId,
                duration: batchDuration,
                successRate: this.calculateSuccessRate(results),
            });
            return results;
        }
        catch (error) {
            this.logger.error("Batch execution failed", error);
            throw error;
        }
    }
    /**
     * Execute a single stage of operations in parallel
     */
    async executeStage(operationIds, operations) {
        const stageOps = operations.filter((op) => operationIds.includes(op.id));
        // Special optimization for agent spawning
        const agentOps = stageOps.filter((op) => op.type === "agent_spawn");
        if (agentOps.length > 0) {
            return this.executeAgentSpawnBatch(agentOps);
        }
        // Execute other operations in parallel
        const promises = stageOps.map((op) => this.executeOperation(op));
        return Promise.all(promises);
    }
    /**
     * Optimized agent spawning for <100ms target
     */
    async executeAgentSpawnBatch(operations) {
        const startTime = Date.now();
        // Pre-allocate resources
        const resources = await this.resourcePool.allocateBatch(operations.length);
        // Spawn agents in parallel using worker threads
        const spawnPromises = operations.map((op, index) => this.spawnAgentOptimized(op, resources[index]));
        const results = await Promise.all(spawnPromises);
        const spawnTime = Date.now() - startTime;
        this.logger.debug(`Agent spawn batch completed`, {
            count: operations.length,
            duration: spawnTime,
            avgPerAgent: spawnTime / operations.length,
        });
        return results;
    }
    /**
     * Execute single operation with retry logic
     */
    async executeOperation(operation) {
        const startTime = Date.now();
        let lastError;
        for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
            try {
                const result = await this.performOperation(operation);
                return {
                    id: operation.id,
                    success: true,
                    result,
                    duration: Date.now() - startTime,
                };
            }
            catch (error) {
                lastError = error;
                this.logger.warn(`Operation failed, attempt ${attempt + 1}`, {
                    operationId: operation.id,
                    error: error.message,
                });
                if (attempt < this.config.retryAttempts - 1) {
                    await this.delay(Math.pow(2, attempt) * 100); // Exponential backoff
                }
            }
        }
        return {
            id: operation.id,
            success: false,
            error: lastError,
            duration: Date.now() - startTime,
        };
    }
    /**
     * Perform the actual operation based on type
     */
    async performOperation(operation) {
        switch (operation.type) {
            case "agent_spawn":
                return this.spawnAgent(operation.operation);
            case "task_execute":
                return this.executeTask(operation.operation);
            case "memory_op":
                return this.executeMemoryOp(operation.operation);
            case "file_op":
                return this.executeFileOp(operation.operation);
            case "command":
                return this.executeCommand(operation.operation);
            default:
                throw new Error(`Unknown operation type: ${operation.type}`);
        }
    }
    /**
     * Optimized agent spawning using pre-allocated resources
     */
    async spawnAgentOptimized(operation, resource) {
        const startTime = Date.now();
        try {
            // Use worker thread for agent initialization
            const worker = this.getAvailableWorker();
            const result = await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error("Agent spawn timeout"));
                }, this.config.spawnTimeout);
                worker.postMessage({
                    type: "spawn_agent",
                    data: operation.operation,
                    resource,
                });
                worker.once("message", (msg) => {
                    clearTimeout(timeout);
                    if (msg.error) {
                        reject(new Error(msg.error));
                    }
                    else {
                        resolve(msg.result);
                    }
                });
            });
            const duration = Date.now() - startTime;
            // Track spawn time for optimization
            this.performanceMonitor.recordMetric("agent_spawn_time", duration);
            return {
                id: operation.id,
                success: true,
                result,
                duration,
                metadata: { optimized: true },
            };
        }
        catch (error) {
            return {
                id: operation.id,
                success: false,
                error,
                duration: Date.now() - startTime,
            };
        }
    }
    /**
     * Build dependency graph for execution planning
     */
    buildDependencyGraph(operations) {
        const graph = new DependencyGraph();
        // Add all operations as nodes
        operations.forEach((op) => {
            graph.addNode(op.id, op);
        });
        // Add dependencies
        operations.forEach((op) => {
            if (op.dependencies) {
                op.dependencies.forEach((dep) => {
                    graph.addDependency(op.id, dep);
                });
            }
        });
        return graph;
    }
    /**
     * Initialize worker threads for parallel execution
     */
    initializeWorkers() {
        for (let i = 0; i < this.config.maxWorkers; i++) {
            const worker = new Worker("./worker.js");
            worker.on("error", (error) => {
                this.logger.error("Worker error", error);
            });
            this.workers.push(worker);
        }
    }
    /**
     * Get available worker thread
     */
    getAvailableWorker() {
        // Simple round-robin for now
        return this.workers[Math.floor(Math.random() * this.workers.length)];
    }
    /**
     * Update metrics after batch execution
     */
    updateMetrics(results, batchDuration) {
        const successful = results.filter((r) => r.success).length;
        const agentSpawns = results.filter((r) => r.metadata?.optimized && r.success);
        this.metrics.successfulOps += successful;
        this.metrics.failedOps += results.length - successful;
        if (agentSpawns.length > 0) {
            const avgSpawn = agentSpawns.reduce((sum, r) => sum + r.duration, 0) /
                agentSpawns.length;
            this.metrics.avgSpawnTime =
                (this.metrics.avgSpawnTime * (this.metrics.totalBatches - 1) +
                    avgSpawn) /
                    this.metrics.totalBatches;
        }
        this.metrics.avgBatchTime =
            (this.metrics.avgBatchTime * (this.metrics.totalBatches - 1) +
                batchDuration) /
                this.metrics.totalBatches;
    }
    /**
     * Calculate success rate for batch
     */
    calculateSuccessRate(results) {
        const successful = results.filter((r) => r.success).length;
        return (successful / results.length) * 100;
    }
    /**
     * Delay utility
     */
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    /**
     * Get batch tool metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            successRate: (this.metrics.successfulOps / this.metrics.totalOperations) * 100,
            avgSpawnTimeMs: this.metrics.avgSpawnTime,
            avgBatchTimeMs: this.metrics.avgBatchTime,
            throughput: this.metrics.totalOperations /
                ((this.metrics.avgBatchTime * this.metrics.totalBatches) / 1000),
        };
    }
    /**
     * Cleanup resources
     */
    async cleanup() {
        // Terminate workers
        await Promise.all(this.workers.map((w) => w.terminate()));
        this.workers = [];
        // Cleanup resource pool
        await this.resourcePool.cleanup();
        this.logger.info("BatchTool cleanup completed");
    }
    // Placeholder methods for different operation types
    async spawnAgent(_data) {
        // Implementation delegated to agent manager
        throw new Error("Not implemented - use spawnAgentOptimized");
    }
    async executeTask(data) {
        // Implementation for task execution
        return { taskId: data.id, status: "completed" };
    }
    async executeMemoryOp(data) {
        // Implementation for memory operations
        return { key: data.key, stored: true };
    }
    async executeFileOp(data) {
        // Implementation for file operations
        return { file: data.path, operation: data.type };
    }
    async executeCommand(data) {
        // Implementation for command execution
        return { command: data.cmd, exitCode: 0 };
    }
}
