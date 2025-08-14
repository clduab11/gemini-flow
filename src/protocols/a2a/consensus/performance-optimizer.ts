/**
 * Performance Optimizer for Byzantine Consensus
 * Implements advanced optimizations for consensus rounds including
 * batching, pipelining, speculation, and adaptive algorithms
 */

import { EventEmitter } from "events";
import { ConsensusMessage, ConsensusProposal } from "./byzantine-consensus";

export interface OptimizationConfig {
  batchSize: number;
  batchTimeout: number;
  pipelineDepth: number;
  speculative: boolean;
  adaptiveThresholds: boolean;
  compressionEnabled: boolean;
  parallelProcessing: boolean;
  cacheSize: number;
}

export interface PerformanceMetrics {
  throughput: number; // operations per second
  latency: number; // average latency in ms
  batchEfficiency: number; // 0-1 ratio of batch utilization
  networkUtilization: number; // 0-1 ratio
  consensusSuccess: number; // 0-1 success rate
  resourceUsage: {
    cpu: number;
    memory: number;
    network: number;
  };
}

export interface BatchedProposal {
  batchId: string;
  proposals: ConsensusProposal[];
  timestamp: Date;
  size: number;
  hash: string;
}

export interface PipelineStage {
  stageId: string;
  type: "pre-prepare" | "prepare" | "commit";
  proposals: ConsensusProposal[];
  status: "pending" | "processing" | "completed" | "failed";
  startTime: Date;
  endTime?: Date;
}

export interface SpeculativeExecution {
  proposalId: string;
  speculation: any;
  confidence: number;
  rollback?: () => void;
  commit?: () => void;
}

export interface AdaptiveThreshold {
  metric: string;
  currentValue: number;
  threshold: number;
  adjustmentFactor: number;
  lastAdjustment: Date;
}

export class PerformanceOptimizer extends EventEmitter {
  private config: OptimizationConfig;
  private metrics: PerformanceMetrics;
  private proposalQueue: ConsensusProposal[] = [];
  private batchQueue: BatchedProposal[] = [];
  private pipeline: Map<string, PipelineStage> = new Map();
  private speculations: Map<string, SpeculativeExecution> = new Map();
  private adaptiveThresholds: Map<string, AdaptiveThreshold> = new Map();
  private messageCache: Map<string, ConsensusMessage> = new Map();

  private batchTimer: ReturnType<typeof setTimeout> | null = null;
  private performanceMonitor: ReturnType<typeof setTimeout> | null = null;
  private lastMetricsUpdate: Date = new Date();
  private operationHistory: Array<{
    timestamp: Date;
    operation: string;
    duration: number;
    success: boolean;
  }> = [];

  constructor(config: Partial<OptimizationConfig> = {}) {
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
  private initializeAdaptiveThresholds(): void {
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
  public async optimizeProposal(
    proposal: ConsensusProposal,
  ): Promise<OptimizedResult<ConsensusProposal>> {
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
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordOperation("optimize-proposal", duration, false);
      throw error;
    }
  }

  /**
   * Create optimized batch of proposals
   */
  private async createBatch(): Promise<BatchedProposal | null> {
    if (this.proposalQueue.length === 0) {
      return null;
    }

    const batchSize = Math.min(
      this.config.batchSize,
      this.proposalQueue.length,
    );
    const proposals = this.proposalQueue.splice(0, batchSize);

    const batch: BatchedProposal = {
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
  private async processBatch(
    batch: BatchedProposal,
  ): Promise<OptimizedResult<ConsensusProposal>> {
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
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordOperation("process-batch", duration, false);
      throw error;
    }
  }

  /**
   * Process batch through pipeline
   */
  private async processPipelined(batch: BatchedProposal): Promise<void> {
    const stages: PipelineStage[] = [
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
    } else {
      for (const stage of stages) {
        await this.processStage(stage);
      }
    }
  }

  /**
   * Process individual pipeline stage
   */
  private async processStage(stage: PipelineStage): Promise<void> {
    stage.status = "processing";
    this.pipeline.set(stage.stageId, stage);

    try {
      // Simulate stage processing
      await this.simulateStageProcessing(stage);

      stage.status = "completed";
      stage.endTime = new Date();

      this.emit("stage-completed", stage);
    } catch (error) {
      stage.status = "failed";
      stage.endTime = new Date();
      this.emit("stage-failed", { stage, error });
      throw error;
    }
  }

  /**
   * Execute batch speculatively
   */
  private async executeSpeculatively(batch: BatchedProposal): Promise<void> {
    if (!this.config.speculative) return;

    const speculations = batch.proposals.map((proposal) => {
      const speculation: SpeculativeExecution = {
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
    const highConfidenceSpeculations = speculations.filter(
      (s) => s.confidence > 0.8,
    );

    await Promise.all(
      highConfidenceSpeculations.map((speculation) =>
        this.executeSpeculation(speculation),
      ),
    );
  }

  /**
   * Compress batch for network efficiency
   */
  private async compressBatch(
    batch: BatchedProposal,
  ): Promise<BatchedProposal> {
    if (!this.config.compressionEnabled) return batch;

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
  public optimizeMessage(
    message: ConsensusMessage,
  ): OptimizedResult<ConsensusMessage> {
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
      const optimizations: string[] = [];
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
      const performanceGain =
        this.calculateMessagePerformanceGain(optimizations);

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
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordOperation("optimize-message", duration, false);
      throw error;
    }
  }

  /**
   * Adapt thresholds based on performance
   */
  private adaptThresholds(): void {
    if (!this.config.adaptiveThresholds) return;

    this.adaptiveThresholds.forEach((threshold, metric) => {
      const currentPerformance = this.getCurrentMetricValue(metric);
      const targetValue = threshold.threshold;

      if (Math.abs(currentPerformance - targetValue) > targetValue * 0.1) {
        const adjustment =
          (targetValue - currentPerformance) * threshold.adjustmentFactor;
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
  private applyThresholdAdjustment(metric: string, newValue: number): void {
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
  private startPerformanceMonitoring(): void {
    this.performanceMonitor = setInterval(() => {
      this.updateMetrics();
      this.adaptThresholds();
      this.cleanupExpiredData();
    }, 5000); // Update every 5 seconds
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(): void {
    const now = new Date();
    const timeSinceLastUpdate =
      now.getTime() - this.lastMetricsUpdate.getTime();

    // Calculate throughput
    const recentOperations = this.operationHistory.filter(
      (op) => now.getTime() - op.timestamp.getTime() < 60000, // Last minute
    );

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
  private calculateBatchEfficiency(): number {
    if (this.batchQueue.length === 0) return 0;

    const totalBatchCapacity = this.batchQueue.length * this.config.batchSize;
    const actualBatchSize = this.batchQueue.reduce(
      (sum, batch) => sum + batch.size,
      0,
    );

    return actualBatchSize / totalBatchCapacity;
  }

  /**
   * Get current resource usage
   */
  private getResourceUsage(): { cpu: number; memory: number; network: number } {
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
  private cleanupExpiredData(): void {
    const now = Date.now();
    const expireTime = 300000; // 5 minutes

    // Cleanup operation history
    this.operationHistory = this.operationHistory.filter(
      (op) => now - op.timestamp.getTime() < expireTime,
    );

    // Cleanup completed pipeline stages
    for (const [stageId, stage] of this.pipeline.entries()) {
      if (
        stage.status === "completed" &&
        stage.endTime &&
        now - stage.endTime.getTime() > expireTime
      ) {
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
  private shouldCreateBatch(): boolean {
    return this.proposalQueue.length >= this.config.batchSize;
  }

  private startBatchTimer(): void {
    if (this.batchTimer) return;

    this.batchTimer = setTimeout(async () => {
      const batch = await this.createBatch();
      if (batch) {
        await this.processBatch(batch);
      }
      this.batchTimer = null;
    }, this.config.batchTimeout);
  }

  private generateBatchId(): string {
    return `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateBatchHash(proposals: ConsensusProposal[]): string {
    return proposals.map((p) => p.hash).join("");
  }

  private simulateStageProcessing(stage: PipelineStage): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, Math.random() * 100); // Simulate processing time
    });
  }

  private createSpeculation(proposal: ConsensusProposal): any {
    return { speculativeResult: `speculation-${proposal.id}` };
  }

  private calculateSpeculationConfidence(proposal: ConsensusProposal): number {
    return Math.random(); // Simplified confidence calculation
  }

  private async executeSpeculation(
    speculation: SpeculativeExecution,
  ): Promise<void> {
    // Simulate speculative execution
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  private rollbackSpeculation(proposalId: string): void {
    this.speculations.delete(proposalId);
  }

  private commitSpeculation(proposalId: string): void {
    this.speculations.delete(proposalId);
  }

  private simulateCompression(batch: BatchedProposal): string {
    return JSON.stringify(batch).slice(
      0,
      Math.floor(JSON.stringify(batch).length * 0.7),
    );
  }

  private isDuplicateMessage(message: ConsensusMessage): boolean {
    return this.messageCache.has(message.digest);
  }

  private compressPayload(payload: any): any {
    // Simulate payload compression
    return { compressed: true, data: payload };
  }

  private calculatePerformanceGain(
    batch: BatchedProposal,
    duration: number,
  ): number {
    const baseTime = batch.size * 100; // Assume 100ms per proposal without optimization
    return Math.max(0, (baseTime - duration) / baseTime);
  }

  private calculateMessagePerformanceGain(optimizations: string[]): number {
    const gains = {
      "cache-hit": 0.9,
      "duplicate-detection": 1.0,
      "payload-compression": 0.3,
      cached: 0.1,
    };

    return optimizations.reduce(
      (total, opt) => total + (gains[opt as keyof typeof gains] || 0),
      0,
    );
  }

  private getAppliedOptimizations(batch: BatchedProposal): string[] {
    const optimizations = ["batching"];

    if (this.config.compressionEnabled) optimizations.push("compression");
    if (this.config.pipelineDepth > 1) optimizations.push("pipelining");
    if (this.config.speculative) optimizations.push("speculation");
    if (this.config.parallelProcessing)
      optimizations.push("parallel-processing");

    return optimizations;
  }

  private getCompressionRatio(batch: BatchedProposal): number {
    return Math.random() * 0.3 + 0.5; // Simulate 50-80% compression ratio
  }

  private getCurrentMetricValue(metric: string): number {
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

  private recordOperation(
    operation: string,
    duration: number,
    success: boolean,
  ): void {
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
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get optimization configuration
   */
  public getConfig(): OptimizationConfig {
    return { ...this.config };
  }

  /**
   * Update optimization configuration
   */
  public updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit("config-updated", this.config);
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
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

export interface OptimizedResult<T> {
  optimized: T;
  optimizations: string[];
  performanceGain: number;
  metadata: Record<string, any>;
}

export default PerformanceOptimizer;
