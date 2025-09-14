/**
 * Performance Optimizer for Byzantine Consensus
 * Implements advanced optimizations for consensus rounds including
 * batching, pipelining, speculation, and adaptive algorithms
 */
import { EventEmitter } from "events";
export class PerformanceOptimizer extends EventEmitter {
    config;
    metrics;
    proposalQueue = [];
    batchQueue = [];
    pipeline = new Map();
    speculations = new Map();
    adaptiveThresholds = new Map();
    messageCache = new Map();
    batchTimer = null;
    performanceMonitor = null;
    lastMetricsUpdate = new Date();
    operationHistory = [];
    constructor(config = {}) {
        super();
        this.config = {
            batchSize: 10,
            batchTimeout: 100, // 100ms
            pipelineDepth: 3,
            speculative: true,
            adaptiveThresholds: true,
            compressionEnabled: true,
            parallelProcessing: true,
            cacheSize: 1000,
            ...config,
        };
        this.metrics = {
            throughput: 0,
            latency: 0,
            batchEfficiency: 0,
            networkUtilization: 0,
            consensusSuccess: 0,
            resourceUsage: {
                cpu: 0,
                memory: 0,
                network: 0,
            },
        };
        this.initializeAdaptiveThresholds();
        this.startPerformanceMonitoring();
    }
    /**
     * Initialize adaptive thresholds
     */
    initializeAdaptiveThresholds() {
        const thresholds = [
            { metric: "latency", threshold: 1000, adjustmentFactor: 0.1 },
            { metric: "throughput", threshold: 100, adjustmentFactor: 0.05 },
            {
                metric: "batch-size",
                threshold: this.config.batchSize,
                adjustmentFactor: 0.2,
            },
            {
                metric: "pipeline-depth",
                threshold: this.config.pipelineDepth,
                adjustmentFactor: 0.1,
            },
        ];
        thresholds.forEach(({ metric, threshold, adjustmentFactor }) => {
            this.adaptiveThresholds.set(metric, {
                metric,
                currentValue: 0,
                threshold,
                adjustmentFactor,
                lastAdjustment: new Date(),
            });
        });
    }
    /**
     * Optimize proposal for consensus
     */
    async optimizeProposal(proposal) {
        const startTime = Date.now();
        try {
            // Add to proposal queue
            this.proposalQueue.push(proposal);
            // Check if we should create a batch
            if (this.shouldCreateBatch()) {
                const batch = await this.createBatch();
                if (batch) {
                    return this.processBatch(batch);
                }
            }
            // Start batch timer if not already running
            this.startBatchTimer();
            const duration = Date.now() - startTime;
            this.recordOperation("optimize-proposal", duration, true);
            return {
                optimized: proposal,
                optimizations: ["queued-for-batching"],
                performanceGain: 0,
                metadata: { queueSize: this.proposalQueue.length },
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            this.recordOperation("optimize-proposal", duration, false);
            throw error;
        }
    }
    /**
     * Create optimized batch of proposals
     */
    async createBatch() {
        if (this.proposalQueue.length === 0) {
            return null;
        }
        const batchSize = Math.min(this.config.batchSize, this.proposalQueue.length);
        const proposals = this.proposalQueue.splice(0, batchSize);
        const batch = {
            batchId: this.generateBatchId(),
            proposals,
            timestamp: new Date(),
            size: batchSize,
            hash: this.calculateBatchHash(proposals),
        };
        this.batchQueue.push(batch);
        this.emit("batch-created", batch);
        return batch;
    }
    /**
     * Process batched proposals
     */
    async processBatch(batch) {
        const startTime = Date.now();
        try {
            // Compress batch if enabled
            if (this.config.compressionEnabled) {
                batch = await this.compressBatch(batch);
            }
            // Pipeline processing if enabled
            if (this.config.pipelineDepth > 1) {
                await this.processPipelined(batch);
            }
            // Speculative execution if enabled
            if (this.config.speculative) {
                await this.executeSpeculatively(batch);
            }
            const duration = Date.now() - startTime;
            const performanceGain = this.calculatePerformanceGain(batch, duration);
            this.recordOperation("process-batch", duration, true);
            return {
                optimized: batch.proposals[0], // Return first proposal as representative
                optimizations: this.getAppliedOptimizations(batch),
                performanceGain,
                metadata: {
                    batchSize: batch.size,
                    compressionRatio: this.getCompressionRatio(batch),
                    pipelineStages: this.pipeline.size,
                },
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            this.recordOperation("process-batch", duration, false);
            throw error;
        }
    }
    /**
     * Process batch through pipeline
     */
    async processPipelined(batch) {
        const stages = [
            {
                stageId: `${batch.batchId}-pre-prepare`,
                type: "pre-prepare",
                proposals: batch.proposals,
                status: "pending",
                startTime: new Date(),
            },
            {
                stageId: `${batch.batchId}-prepare`,
                type: "prepare",
                proposals: batch.proposals,
                status: "pending",
                startTime: new Date(),
            },
            {
                stageId: `${batch.batchId}-commit`,
                type: "commit",
                proposals: batch.proposals,
                status: "pending",
                startTime: new Date(),
            },
        ];
        // Process stages in parallel if enabled
        if (this.config.parallelProcessing) {
            await Promise.all(stages.map((stage) => this.processStage(stage)));
        }
        else {
            for (const stage of stages) {
                await this.processStage(stage);
            }
        }
    }
    /**
     * Process individual pipeline stage
     */
    async processStage(stage) {
        stage.status = "processing";
        this.pipeline.set(stage.stageId, stage);
        try {
            // Simulate stage processing
            await this.simulateStageProcessing(stage);
            stage.status = "completed";
            stage.endTime = new Date();
            this.emit("stage-completed", stage);
        }
        catch (error) {
            stage.status = "failed";
            stage.endTime = new Date();
            this.emit("stage-failed", { stage, error });
            throw error;
        }
    }
    /**
     * Execute batch speculatively
     */
    async executeSpeculatively(batch) {
        if (!this.config.speculative)
            return;
        const speculations = batch.proposals.map((proposal) => {
            const speculation = {
                proposalId: proposal.id,
                speculation: this.createSpeculation(proposal),
                confidence: this.calculateSpeculationConfidence(proposal),
                rollback: () => this.rollbackSpeculation(proposal.id),
                commit: () => this.commitSpeculation(proposal.id),
            };
            this.speculations.set(proposal.id, speculation);
            return speculation;
        });
        // Execute high-confidence speculations
        const highConfidenceSpeculations = speculations.filter((s) => s.confidence > 0.8);
        await Promise.all(highConfidenceSpeculations.map((speculation) => this.executeSpeculation(speculation)));
    }
    /**
     * Compress batch for network efficiency
     */
    async compressBatch(batch) {
        if (!this.config.compressionEnabled)
            return batch;
        // Simulate compression (in real implementation, use actual compression)
        const originalSize = JSON.stringify(batch).length;
        const compressedData = this.simulateCompression(batch);
        const compressedSize = compressedData.length;
        this.emit("batch-compressed", {
            batchId: batch.batchId,
            originalSize,
            compressedSize,
            compressionRatio: compressedSize / originalSize,
        });
        return batch; // Return original batch (compression would be applied at network layer)
    }
    /**
     * Optimize message processing
     */
    optimizeMessage(message) {
        const startTime = Date.now();
        try {
            // Check cache first
            const cached = this.messageCache.get(message.digest);
            if (cached) {
                return {
                    optimized: cached,
                    optimizations: ["cache-hit"],
                    performanceGain: 0.9, // High gain from cache hit
                    metadata: { cacheHit: true },
                };
            }
            // Apply message optimizations
            const optimizations = [];
            const optimizedMessage = { ...message };
            // Deduplicate message
            if (this.isDuplicateMessage(message)) {
                optimizations.push("duplicate-detection");
                return {
                    optimized: optimizedMessage,
                    optimizations,
                    performanceGain: 1.0, // Complete duplicate elimination
                    metadata: { duplicate: true },
                };
            }
            // Compress message payload if large
            if (JSON.stringify(message.payload).length > 1000) {
                optimizedMessage.payload = this.compressPayload(message.payload);
                optimizations.push("payload-compression");
            }
            // Cache the message
            if (this.messageCache.size < this.config.cacheSize) {
                this.messageCache.set(message.digest, optimizedMessage);
                optimizations.push("cached");
            }
            const duration = Date.now() - startTime;
            const performanceGain = this.calculateMessagePerformanceGain(optimizations);
            this.recordOperation("optimize-message", duration, true);
            return {
                optimized: optimizedMessage,
                optimizations,
                performanceGain,
                metadata: {
                    originalSize: JSON.stringify(message).length,
                    optimizedSize: JSON.stringify(optimizedMessage).length,
                },
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            this.recordOperation("optimize-message", duration, false);
            throw error;
        }
    }
    /**
     * Adapt thresholds based on performance
     */
    adaptThresholds() {
        if (!this.config.adaptiveThresholds)
            return;
        this.adaptiveThresholds.forEach((threshold, metric) => {
            const currentPerformance = this.getCurrentMetricValue(metric);
            const targetValue = threshold.threshold;
            if (Math.abs(currentPerformance - targetValue) > targetValue * 0.1) {
                const adjustment = (targetValue - currentPerformance) * threshold.adjustmentFactor;
                threshold.threshold = Math.max(1, threshold.threshold + adjustment);
                threshold.lastAdjustment = new Date();
                this.applyThresholdAdjustment(metric, threshold.threshold);
                this.emit("threshold-adapted", {
                    metric,
                    newThreshold: threshold.threshold,
                });
            }
        });
    }
    /**
     * Apply threshold adjustment
     */
    applyThresholdAdjustment(metric, newValue) {
        switch (metric) {
            case "batch-size":
                this.config.batchSize = Math.round(newValue);
                break;
            case "pipeline-depth":
                this.config.pipelineDepth = Math.round(newValue);
                break;
            // Add other metric adjustments as needed
        }
    }
    /**
     * Start performance monitoring
     */
    startPerformanceMonitoring() {
        this.performanceMonitor = setInterval(() => {
            this.updateMetrics();
            this.adaptThresholds();
            this.cleanupExpiredData();
        }, 5000); // Update every 5 seconds
    }
    /**
     * Update performance metrics
     */
    updateMetrics() {
        const now = new Date();
        const timeSinceLastUpdate = now.getTime() - this.lastMetricsUpdate.getTime();
        // Calculate throughput
        const recentOperations = this.operationHistory.filter((op) => now.getTime() - op.timestamp.getTime() < 60000);
        this.metrics.throughput = (recentOperations.length / 60) * 1000; // ops per second
        // Calculate average latency
        if (recentOperations.length > 0) {
            this.metrics.latency =
                recentOperations.reduce((sum, op) => sum + op.duration, 0) /
                    recentOperations.length;
        }
        // Calculate success rate
        const successfulOps = recentOperations.filter((op) => op.success).length;
        this.metrics.consensusSuccess =
            recentOperations.length > 0 ? successfulOps / recentOperations.length : 0;
        // Calculate batch efficiency
        this.metrics.batchEfficiency = this.calculateBatchEfficiency();
        // Update resource usage (simulated)
        this.metrics.resourceUsage = this.getResourceUsage();
        this.lastMetricsUpdate = now;
        this.emit("metrics-updated", this.metrics);
    }
    /**
     * Calculate batch efficiency
     */
    calculateBatchEfficiency() {
        if (this.batchQueue.length === 0)
            return 0;
        const totalBatchCapacity = this.batchQueue.length * this.config.batchSize;
        const actualBatchSize = this.batchQueue.reduce((sum, batch) => sum + batch.size, 0);
        return actualBatchSize / totalBatchCapacity;
    }
    /**
     * Get current resource usage
     */
    getResourceUsage() {
        // This would integrate with actual system monitoring
        // For now, return simulated values
        return {
            cpu: Math.random() * 0.8, // 0-80% CPU usage
            memory: Math.random() * 0.6, // 0-60% memory usage
            network: this.pipeline.size / this.config.pipelineDepth, // Based on pipeline utilization
        };
    }
    /**
     * Cleanup expired data
     */
    cleanupExpiredData() {
        const now = Date.now();
        const expireTime = 300000; // 5 minutes
        // Cleanup operation history
        this.operationHistory = this.operationHistory.filter((op) => now - op.timestamp.getTime() < expireTime);
        // Cleanup completed pipeline stages
        for (const [stageId, stage] of this.pipeline.entries()) {
            if (stage.status === "completed" &&
                stage.endTime &&
                now - stage.endTime.getTime() > expireTime) {
                this.pipeline.delete(stageId);
            }
        }
        // Cleanup expired speculations
        for (const [proposalId, speculation] of this.speculations.entries()) {
            // Remove old speculations (implementation dependent)
            if (Math.random() > 0.95) {
                // Randomly cleanup for demo
                this.speculations.delete(proposalId);
            }
        }
    }
    // Utility methods
    shouldCreateBatch() {
        return this.proposalQueue.length >= this.config.batchSize;
    }
    startBatchTimer() {
        if (this.batchTimer)
            return;
        this.batchTimer = setTimeout(async () => {
            const batch = await this.createBatch();
            if (batch) {
                await this.processBatch(batch);
            }
            this.batchTimer = null;
        }, this.config.batchTimeout);
    }
    generateBatchId() {
        return `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    calculateBatchHash(proposals) {
        return proposals.map((p) => p.hash).join("");
    }
    simulateStageProcessing(stage) {
        return new Promise((resolve) => {
            setTimeout(resolve, Math.random() * 100); // Simulate processing time
        });
    }
    createSpeculation(proposal) {
        return { speculativeResult: `speculation-${proposal.id}` };
    }
    calculateSpeculationConfidence(proposal) {
        return Math.random(); // Simplified confidence calculation
    }
    async executeSpeculation(speculation) {
        // Simulate speculative execution
        await new Promise((resolve) => setTimeout(resolve, 50));
    }
    rollbackSpeculation(proposalId) {
        this.speculations.delete(proposalId);
    }
    commitSpeculation(proposalId) {
        this.speculations.delete(proposalId);
    }
    simulateCompression(batch) {
        return JSON.stringify(batch).slice(0, Math.floor(JSON.stringify(batch).length * 0.7));
    }
    isDuplicateMessage(message) {
        return this.messageCache.has(message.digest);
    }
    compressPayload(payload) {
        // Simulate payload compression
        return { compressed: true, data: payload };
    }
    calculatePerformanceGain(batch, duration) {
        const baseTime = batch.size * 100; // Assume 100ms per proposal without optimization
        return Math.max(0, (baseTime - duration) / baseTime);
    }
    calculateMessagePerformanceGain(optimizations) {
        const gains = {
            "cache-hit": 0.9,
            "duplicate-detection": 1.0,
            "payload-compression": 0.3,
            cached: 0.1,
        };
        return optimizations.reduce((total, opt) => total + (gains[opt] || 0), 0);
    }
    getAppliedOptimizations(batch) {
        const optimizations = ["batching"];
        if (this.config.compressionEnabled)
            optimizations.push("compression");
        if (this.config.pipelineDepth > 1)
            optimizations.push("pipelining");
        if (this.config.speculative)
            optimizations.push("speculation");
        if (this.config.parallelProcessing)
            optimizations.push("parallel-processing");
        return optimizations;
    }
    getCompressionRatio(batch) {
        return Math.random() * 0.3 + 0.5; // Simulate 50-80% compression ratio
    }
    getCurrentMetricValue(metric) {
        switch (metric) {
            case "latency":
                return this.metrics.latency;
            case "throughput":
                return this.metrics.throughput;
            case "batch-size":
                return this.config.batchSize;
            case "pipeline-depth":
                return this.config.pipelineDepth;
            default:
                return 0;
        }
    }
    recordOperation(operation, duration, success) {
        this.operationHistory.push({
            timestamp: new Date(),
            operation,
            duration,
            success,
        });
        // Keep only recent operations
        if (this.operationHistory.length > 1000) {
            this.operationHistory = this.operationHistory.slice(-500);
        }
    }
    /**
     * Get current performance metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }
    /**
     * Get optimization configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Update optimization configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.emit("config-updated", this.config);
    }
    /**
     * Cleanup resources
     */
    cleanup() {
        if (this.batchTimer) {
            clearTimeout(this.batchTimer);
            this.batchTimer = null;
        }
        if (this.performanceMonitor) {
            clearInterval(this.performanceMonitor);
            this.performanceMonitor = null;
        }
        this.messageCache.clear();
        this.pipeline.clear();
        this.speculations.clear();
    }
}
export default PerformanceOptimizer;
