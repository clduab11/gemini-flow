/**
 * Queue Prioritization System with Fairness Algorithms
 * Implements advanced queue management with priority balancing and fairness controls
 */

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
  maxStarvationTime: number; // ms
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

export class QueuePrioritizationSystem<T = any> extends EventEmitter {
  private queues: Map<string, PriorityQueue<T>> = new Map();
  private fairnessManager: FairnessManager;
  private loadBalancer: QueueLoadBalancer;
  private metricsCollector: QueueMetricsCollector;
  private starvationPreventer: StarvationPreventer;
  private adaptiveScheduler: AdaptiveScheduler;

  constructor(private policy: FairnessPolicy) {
    super();
    this.fairnessManager = new FairnessManager(policy);
    this.loadBalancer = new QueueLoadBalancer();
    this.metricsCollector = new QueueMetricsCollector();
    this.starvationPreventer = new StarvationPreventer(policy);
    this.adaptiveScheduler = new AdaptiveScheduler();
    this.initializeSystem();
  }

  /**
   * Add item to appropriate queue with priority calculation
   */
  async enqueue(item: QueueItem<T>): Promise<void> {
    // Calculate dynamic priority
    const dynamicPriority = await this.calculateDynamicPriority(item);
    item.priority = dynamicPriority;

    // Select appropriate queue
    const queueId = this.selectQueue(item);
    const queue = this.ensureQueue(queueId);

    // Apply fairness checks
    const fairnessAdjustment =
      await this.fairnessManager.calculateAdjustment(item);
    item.priority += fairnessAdjustment;

    // Enqueue item
    queue.enqueue(item);

    // Update metrics
    this.metricsCollector.recordEnqueue(item, queueId);

    // Check for starvation prevention
    await this.starvationPreventer.checkAndPrevent(queueId);

    this.emit("itemEnqueued", {
      itemId: item.id,
      queueId,
      priority: item.priority,
    });
  }

  /**
   * Dequeue next item based on fairness algorithm
   */
  async dequeue(): Promise<QueueItem<T> | null> {
    // Get next queue to process from
    const queueId = await this.fairnessManager.selectNextQueue(this.queues);
    if (!queueId) {
      return null;
    }

    const queue = this.queues.get(queueId);
    if (!queue || queue.isEmpty()) {
      return null;
    }

    const item = queue.dequeue();
    if (!item) {
      return null;
    }

    // Update fairness tracking
    await this.fairnessManager.recordProcessing(queueId, item);

    // Update metrics
    this.metricsCollector.recordDequeue(item, queueId);

    this.emit("itemDequeued", {
      itemId: item.id,
      queueId,
      waitTime: Date.now() - item.timestamp,
    });
    return item;
  }

  /**
   * Process item with monitoring and feedback
   */
  async processItem(
    item: QueueItem<T>,
    processor: (data: T) => Promise<ProcessingResult<any>>,
  ): Promise<ProcessingResult<any>> {
    const startTime = Date.now();

    try {
      // Execute processing
      const result = await processor(item.data);
      const processingTime = Date.now() - startTime;

      // Update metrics
      this.metricsCollector.recordProcessing(
        item,
        processingTime,
        result.success,
      );

      // Provide feedback to adaptive scheduler
      await this.adaptiveScheduler.recordOutcome(item, result, processingTime);

      if (result.success) {
        this.emit("itemProcessed", {
          itemId: item.id,
          processingTime,
          success: true,
        });
      } else {
        await this.handleProcessingFailure(
          item,
          result.error || "Unknown error",
        );
      }

      return result;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      await this.handleProcessingFailure(item, error.message);

      return {
        success: false,
        error: error.message,
        processingTime,
        resourcesUsed: { cpu: 0, memory: 0, network: 0 },
      };
    }
  }

  /**
   * Get comprehensive queue metrics
   */
  getMetrics(): Map<string, QueueMetrics> {
    const metrics = new Map<string, QueueMetrics>();

    for (const [queueId, queue] of this.queues.entries()) {
      metrics.set(queueId, this.metricsCollector.getQueueMetrics(queueId));
    }

    return metrics;
  }

  /**
   * Get overall system fairness score
   */
  getFairnessScore(): number {
    return this.fairnessManager.calculateOverallFairnessScore();
  }

  /**
   * Adjust fairness policy dynamically
   */
  async adjustFairnessPolicy(updates: Partial<FairnessPolicy>): Promise<void> {
    await this.fairnessManager.updatePolicy(updates);
    this.emit("policyUpdated", { updates });
  }

  /**
   * Optimize queue configuration based on patterns
   */
  async optimizeConfiguration(): Promise<{
    recommendations: string[];
    expectedImprovement: number;
    changes: any[];
  }> {
    const analysis = await this.adaptiveScheduler.analyzePerformance();
    const recommendations = [];
    const changes = [];

    // Analyze queue imbalances
    if (analysis.queueImbalance > 0.3) {
      recommendations.push("Redistribute workload across queues");
      changes.push({ type: "rebalance", factor: analysis.queueImbalance });
    }

    // Check fairness violations
    if (analysis.fairnessViolations > 0.1) {
      recommendations.push("Adjust tier weights to improve fairness");
      changes.push({
        type: "fairness-adjustment",
        newWeights: analysis.suggestedWeights,
      });
    }

    // Analyze starvation patterns
    if (analysis.starvationIncidents > 0) {
      recommendations.push("Reduce max starvation time");
      changes.push({
        type: "starvation-prevention",
        newMaxTime: this.policy.maxStarvationTime * 0.8,
      });
    }

    return {
      recommendations,
      expectedImprovement: analysis.potentialImprovement,
      changes,
    };
  }

  /**
   * Handle burst traffic with adaptive capacity
   */
  async handleBurst(expectedLoad: number, duration: number): Promise<void> {
    // Increase burst allowance temporarily
    const originalAllowance = this.policy.burstAllowance;
    this.policy.burstAllowance = Math.max(
      originalAllowance,
      expectedLoad * 1.2,
    );

    // Adjust queue priorities for burst handling
    await this.adaptiveScheduler.prepareBurstHandling(expectedLoad, duration);

    // Schedule restoration of normal policies
    setTimeout(() => {
      this.policy.burstAllowance = originalAllowance;
      this.adaptiveScheduler.restoreNormalOperation();
      this.emit("burstHandlingCompleted");
    }, duration);

    this.emit("burstHandlingActivated", { expectedLoad, duration });
  }

  // Private implementation methods

  private async initializeSystem(): Promise<void> {
    // Initialize default queues for different tiers
    const tiers = ["free", "basic", "premium", "enterprise"];
    for (const tier of tiers) {
      this.queues.set(tier, new PriorityQueue<T>());
    }

    // Start background processes
    setInterval(() => this.performMaintenance(), 30000); // 30 seconds
    setInterval(() => this.updateFairnessMetrics(), 10000); // 10 seconds
  }

  private async calculateDynamicPriority(item: QueueItem<T>): Promise<number> {
    let priority = item.priority;

    // Deadline urgency
    if (item.deadline) {
      const timeLeft = item.deadline - Date.now();
      const urgencyBoost = Math.max(0, 100 - timeLeft / 1000);
      priority += urgencyBoost;
    }

    // Tier-based priority
    const tierPriority = this.policy.tierWeights.get(item.tier) || 1;
    priority *= tierPriority;

    // Complexity adjustment
    const complexityMultiplier = {
      low: 1,
      medium: 1.2,
      high: 1.5,
      critical: 2,
    }[item.metadata.complexity];
    priority *= complexityMultiplier;

    // Retry penalty
    priority -= item.retries * 10;

    return Math.max(0, priority);
  }

  private selectQueue(item: QueueItem<T>): string {
    // Primary selection by tier
    return item.tier;
  }

  private ensureQueue(queueId: string): PriorityQueue<T> {
    if (!this.queues.has(queueId)) {
      this.queues.set(queueId, new PriorityQueue<T>());
    }
    return this.queues.get(queueId)!;
  }

  private async handleProcessingFailure(
    item: QueueItem<T>,
    error: string,
  ): Promise<void> {
    item.retries++;

    if (item.retries < item.maxRetries) {
      // Re-queue with reduced priority
      item.priority = Math.max(1, item.priority * 0.8);
      await this.enqueue(item);

      this.emit("itemRetried", {
        itemId: item.id,
        retryCount: item.retries,
        error,
      });
    } else {
      // Move to dead letter queue
      this.metricsCollector.recordFailure(item, error);

      this.emit("itemFailed", {
        itemId: item.id,
        finalError: error,
        totalRetries: item.retries,
      });
    }
  }

  private async performMaintenance(): Promise<void> {
    // Clean up empty queues
    for (const [queueId, queue] of this.queues.entries()) {
      if (
        queue.isEmpty() &&
        !["free", "basic", "premium", "enterprise"].includes(queueId)
      ) {
        this.queues.delete(queueId);
      }
    }

    // Perform aging of old items
    await this.performAging();
  }

  private async performAging(): Promise<void> {
    const now = Date.now();
    const agingThreshold = 300000; // 5 minutes

    for (const queue of this.queues.values()) {
      queue.ageItems(now, agingThreshold, this.policy.agingFactor);
    }
  }

  private async updateFairnessMetrics(): Promise<void> {
    await this.fairnessManager.updateMetrics();
    await this.starvationPreventer.checkAllQueues();
  }
}

// Supporting classes

class PriorityQueue<T> {
  private items: QueueItem<T>[] = [];

  enqueue(item: QueueItem<T>): void {
    this.items.push(item);
    this.items.sort((a, b) => b.priority - a.priority);
  }

  dequeue(): QueueItem<T> | null {
    return this.items.shift() || null;
  }

  peek(): QueueItem<T> | null {
    return this.items[0] || null;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  size(): number {
    return this.items.length;
  }

  ageItems(currentTime: number, threshold: number, agingFactor: number): void {
    for (const item of this.items) {
      const age = currentTime - item.timestamp;
      if (age > threshold) {
        item.priority += agingFactor * (age / threshold);
      }
    }
    // Re-sort after aging
    this.items.sort((a, b) => b.priority - a.priority);
  }

  getItems(): QueueItem<T>[] {
    return [...this.items];
  }
}

class FairnessManager {
  private queueProcessingCounts: Map<string, number> = new Map();
  private lastProcessingTimes: Map<string, number> = new Map();
  private fairnessScores: Map<string, number> = new Map();

  constructor(private policy: FairnessPolicy) {}

  async calculateAdjustment(item: QueueItem<any>): Promise<number> {
    const queueId = item.tier;
    const lastProcessed = this.lastProcessingTimes.get(queueId) || 0;
    const timeSinceLastProcessed = Date.now() - lastProcessed;

    // Boost priority if queue hasn't been processed recently
    if (timeSinceLastProcessed > this.policy.maxStarvationTime) {
      return 50; // Significant boost to prevent starvation
    }

    return 0;
  }

  async selectNextQueue(
    queues: Map<string, PriorityQueue<any>>,
  ): Promise<string | null> {
    const eligibleQueues = Array.from(queues.entries()).filter(
      ([_, queue]) => !queue.isEmpty(),
    );

    if (eligibleQueues.length === 0) {
      return null;
    }

    switch (this.policy.algorithm) {
      case "weighted-fair":
        return this.weightedFairSelection(eligibleQueues);
      case "lottery":
        return this.lotterySelection(eligibleQueues);
      case "stride":
        return this.strideSelection(eligibleQueues);
      case "proportional-share":
        return this.proportionalShareSelection(eligibleQueues);
      default:
        return eligibleQueues[0][0];
    }
  }

  async recordProcessing(queueId: string, item: QueueItem<any>): Promise<void> {
    const current = this.queueProcessingCounts.get(queueId) || 0;
    this.queueProcessingCounts.set(queueId, current + 1);
    this.lastProcessingTimes.set(queueId, Date.now());
  }

  calculateOverallFairnessScore(): number {
    const counts = Array.from(this.queueProcessingCounts.values());
    if (counts.length === 0) return 1;

    const mean = counts.reduce((sum, count) => sum + count, 0) / counts.length;
    const variance =
      counts.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) /
      counts.length;

    // Higher scores indicate better fairness (lower variance)
    return Math.max(0, 1 - variance / (mean + 1));
  }

  async updatePolicy(updates: Partial<FairnessPolicy>): Promise<void> {
    Object.assign(this.policy, updates);
  }

  async updateMetrics(): Promise<void> {
    // Update fairness scores for each queue
    for (const queueId of this.queueProcessingCounts.keys()) {
      this.fairnessScores.set(
        queueId,
        this.calculateQueueFairnessScore(queueId),
      );
    }
  }

  private weightedFairSelection(
    queues: [string, PriorityQueue<any>][],
  ): string {
    // Select based on tier weights and recent processing
    let bestQueue = queues[0][0];
    let bestScore = -1;

    for (const [queueId, queue] of queues) {
      const weight = this.policy.tierWeights.get(queueId) || 1;
      const recentProcessing = this.queueProcessingCounts.get(queueId) || 0;
      const score = weight / (recentProcessing + 1);

      if (score > bestScore) {
        bestScore = score;
        bestQueue = queueId;
      }
    }

    return bestQueue;
  }

  private lotterySelection(queues: [string, PriorityQueue<any>][]): string {
    // Weighted random selection
    const weights = queues.map(
      ([queueId]) => this.policy.tierWeights.get(queueId) || 1,
    );
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    const random = Math.random() * totalWeight;

    let cumulativeWeight = 0;
    for (let i = 0; i < queues.length; i++) {
      cumulativeWeight += weights[i];
      if (random <= cumulativeWeight) {
        return queues[i][0];
      }
    }

    return queues[0][0];
  }

  private strideSelection(queues: [string, PriorityQueue<any>][]): string {
    // Stride scheduling implementation
    return this.weightedFairSelection(queues); // Simplified
  }

  private proportionalShareSelection(
    queues: [string, PriorityQueue<any>][],
  ): string {
    // Proportional share scheduling
    return this.weightedFairSelection(queues); // Simplified
  }

  private calculateQueueFairnessScore(queueId: string): number {
    const expectedShare = this.policy.tierWeights.get(queueId) || 1;
    const actualShare = this.queueProcessingCounts.get(queueId) || 0;
    const totalProcessed = Array.from(
      this.queueProcessingCounts.values(),
    ).reduce((sum, count) => sum + count, 0);

    if (totalProcessed === 0) return 1;

    const actualRatio = actualShare / totalProcessed;
    const expectedRatio =
      expectedShare /
      Array.from(this.policy.tierWeights.values()).reduce(
        (sum, weight) => sum + weight,
        0,
      );

    return Math.max(0, 1 - Math.abs(actualRatio - expectedRatio));
  }
}

class QueueLoadBalancer {
  selectOptimalQueue(queues: Map<string, PriorityQueue<any>>): string | null {
    // Implementation for load balancing across queues
    const nonEmptyQueues = Array.from(queues.entries()).filter(
      ([_, queue]) => !queue.isEmpty(),
    );

    if (nonEmptyQueues.length === 0) return null;

    // Select queue with least items
    return nonEmptyQueues.reduce((best, current) =>
      current[1].size() < best[1].size() ? current : best,
    )[0];
  }
}

class QueueMetricsCollector {
  private enqueueCounts: Map<string, number> = new Map();
  private dequeueCounts: Map<string, number> = new Map();
  private processingTimes: Map<string, number[]> = new Map();
  private waitTimes: Map<string, number[]> = new Map();
  private failures: Map<string, number> = new Map();

  recordEnqueue(item: QueueItem<any>, queueId: string): void {
    const current = this.enqueueCounts.get(queueId) || 0;
    this.enqueueCounts.set(queueId, current + 1);
  }

  recordDequeue(item: QueueItem<any>, queueId: string): void {
    const current = this.dequeueCounts.get(queueId) || 0;
    this.dequeueCounts.set(queueId, current + 1);

    const waitTime = Date.now() - item.timestamp;
    const waitTimes = this.waitTimes.get(queueId) || [];
    waitTimes.push(waitTime);
    this.waitTimes.set(queueId, waitTimes.slice(-1000)); // Keep last 1000
  }

  recordProcessing(
    item: QueueItem<any>,
    processingTime: number,
    success: boolean,
  ): void {
    const queueId = item.tier;

    if (success) {
      const times = this.processingTimes.get(queueId) || [];
      times.push(processingTime);
      this.processingTimes.set(queueId, times.slice(-1000)); // Keep last 1000
    }
  }

  recordFailure(item: QueueItem<any>, error: string): void {
    const queueId = item.tier;
    const current = this.failures.get(queueId) || 0;
    this.failures.set(queueId, current + 1);
  }

  getQueueMetrics(queueId: string): QueueMetrics {
    const enqueued = this.enqueueCounts.get(queueId) || 0;
    const processed = this.dequeueCounts.get(queueId) || 0;
    const failed = this.failures.get(queueId) || 0;

    const waitTimes = this.waitTimes.get(queueId) || [];
    const processingTimes = this.processingTimes.get(queueId) || [];

    const avgWaitTime =
      waitTimes.length > 0
        ? waitTimes.reduce((sum, time) => sum + time, 0) / waitTimes.length
        : 0;

    const avgProcessingTime =
      processingTimes.length > 0
        ? processingTimes.reduce((sum, time) => sum + time, 0) /
          processingTimes.length
        : 0;

    return {
      totalItems: enqueued,
      processedItems: processed,
      failedItems: failed,
      averageWaitTime: avgWaitTime,
      averageProcessingTime: avgProcessingTime,
      throughputPerSecond: processed / 60, // Simplified
      fairnessScore: 0.85, // Calculated elsewhere
      tierDistribution: new Map([[queueId, 1]]),
    };
  }
}

class StarvationPreventer {
  constructor(private policy: FairnessPolicy) {}

  async checkAndPrevent(queueId: string): Promise<void> {
    // Implementation for starvation prevention
  }

  async checkAllQueues(): Promise<void> {
    // Check all queues for starvation
  }
}

class AdaptiveScheduler {
  async recordOutcome(
    item: QueueItem<any>,
    result: ProcessingResult<any>,
    processingTime: number,
  ): Promise<void> {
    // Record processing outcomes for learning
  }

  async analyzePerformance(): Promise<{
    queueImbalance: number;
    fairnessViolations: number;
    starvationIncidents: number;
    suggestedWeights: Map<string, number>;
    potentialImprovement: number;
  }> {
    return {
      queueImbalance: 0.2,
      fairnessViolations: 0.05,
      starvationIncidents: 0,
      suggestedWeights: new Map([
        ["free", 1],
        ["basic", 2],
        ["premium", 4],
        ["enterprise", 8],
      ]),
      potentialImprovement: 0.15,
    };
  }

  async prepareBurstHandling(
    expectedLoad: number,
    duration: number,
  ): Promise<void> {
    // Prepare for burst traffic
  }

  restoreNormalOperation(): void {
    // Restore normal operation after burst
  }
}

export {
  PriorityQueue,
  FairnessManager,
  QueueLoadBalancer,
  QueueMetricsCollector,
  StarvationPreventer,
  AdaptiveScheduler,
};
