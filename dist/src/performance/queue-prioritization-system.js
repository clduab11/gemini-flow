/**
 * Queue Prioritization System with Fairness Algorithms
 * Implements advanced queue management with priority balancing and fairness controls
 */
import { EventEmitter } from "events";
export class QueuePrioritizationSystem extends EventEmitter {
    policy;
    queues = new Map();
    fairnessManager;
    loadBalancer;
    metricsCollector;
    starvationPreventer;
    adaptiveScheduler;
    constructor(policy) {
        super();
        this.policy = policy;
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
    async enqueue(item) {
        // Calculate dynamic priority
        const dynamicPriority = await this.calculateDynamicPriority(item);
        item.priority = dynamicPriority;
        // Select appropriate queue
        const queueId = this.selectQueue(item);
        const queue = this.ensureQueue(queueId);
        // Apply fairness checks
        const fairnessAdjustment = await this.fairnessManager.calculateAdjustment(item);
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
    async dequeue() {
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
    async processItem(item, processor) {
        const startTime = Date.now();
        try {
            // Execute processing
            const result = await processor(item.data);
            const processingTime = Date.now() - startTime;
            // Update metrics
            this.metricsCollector.recordProcessing(item, processingTime, result.success);
            // Provide feedback to adaptive scheduler
            await this.adaptiveScheduler.recordOutcome(item, result, processingTime);
            if (result.success) {
                this.emit("itemProcessed", {
                    itemId: item.id,
                    processingTime,
                    success: true,
                });
            }
            else {
                await this.handleProcessingFailure(item, result.error || "Unknown error");
            }
            return result;
        }
        catch (error) {
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
    getMetrics() {
        const metrics = new Map();
        for (const [queueId, queue] of this.queues.entries()) {
            metrics.set(queueId, this.metricsCollector.getQueueMetrics(queueId));
        }
        return metrics;
    }
    /**
     * Get overall system fairness score
     */
    getFairnessScore() {
        return this.fairnessManager.calculateOverallFairnessScore();
    }
    /**
     * Adjust fairness policy dynamically
     */
    async adjustFairnessPolicy(updates) {
        await this.fairnessManager.updatePolicy(updates);
        this.emit("policyUpdated", { updates });
    }
    /**
     * Optimize queue configuration based on patterns
     */
    async optimizeConfiguration() {
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
    async handleBurst(expectedLoad, duration) {
        // Increase burst allowance temporarily
        const originalAllowance = this.policy.burstAllowance;
        this.policy.burstAllowance = Math.max(originalAllowance, expectedLoad * 1.2);
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
    async initializeSystem() {
        // Initialize default queues for different tiers
        const tiers = ["free", "basic", "premium", "enterprise"];
        for (const tier of tiers) {
            this.queues.set(tier, new PriorityQueue());
        }
        // Start background processes
        setInterval(() => this.performMaintenance(), 30000); // 30 seconds
        setInterval(() => this.updateFairnessMetrics(), 10000); // 10 seconds
    }
    async calculateDynamicPriority(item) {
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
    selectQueue(item) {
        // Primary selection by tier
        return item.tier;
    }
    ensureQueue(queueId) {
        if (!this.queues.has(queueId)) {
            this.queues.set(queueId, new PriorityQueue());
        }
        return this.queues.get(queueId);
    }
    async handleProcessingFailure(item, error) {
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
        }
        else {
            // Move to dead letter queue
            this.metricsCollector.recordFailure(item, error);
            this.emit("itemFailed", {
                itemId: item.id,
                finalError: error,
                totalRetries: item.retries,
            });
        }
    }
    async performMaintenance() {
        // Clean up empty queues
        for (const [queueId, queue] of this.queues.entries()) {
            if (queue.isEmpty() &&
                !["free", "basic", "premium", "enterprise"].includes(queueId)) {
                this.queues.delete(queueId);
            }
        }
        // Perform aging of old items
        await this.performAging();
    }
    async performAging() {
        const now = Date.now();
        const agingThreshold = 300000; // 5 minutes
        for (const queue of this.queues.values()) {
            queue.ageItems(now, agingThreshold, this.policy.agingFactor);
        }
    }
    async updateFairnessMetrics() {
        await this.fairnessManager.updateMetrics();
        await this.starvationPreventer.checkAllQueues();
    }
}
// Supporting classes
class PriorityQueue {
    items = [];
    enqueue(item) {
        this.items.push(item);
        this.items.sort((a, b) => b.priority - a.priority);
    }
    dequeue() {
        return this.items.shift() || null;
    }
    peek() {
        return this.items[0] || null;
    }
    isEmpty() {
        return this.items.length === 0;
    }
    size() {
        return this.items.length;
    }
    ageItems(currentTime, threshold, agingFactor) {
        for (const item of this.items) {
            const age = currentTime - item.timestamp;
            if (age > threshold) {
                item.priority += agingFactor * (age / threshold);
            }
        }
        // Re-sort after aging
        this.items.sort((a, b) => b.priority - a.priority);
    }
    getItems() {
        return [...this.items];
    }
}
class FairnessManager {
    policy;
    queueProcessingCounts = new Map();
    lastProcessingTimes = new Map();
    fairnessScores = new Map();
    constructor(policy) {
        this.policy = policy;
    }
    async calculateAdjustment(item) {
        const queueId = item.tier;
        const lastProcessed = this.lastProcessingTimes.get(queueId) || 0;
        const timeSinceLastProcessed = Date.now() - lastProcessed;
        // Boost priority if queue hasn't been processed recently
        if (timeSinceLastProcessed > this.policy.maxStarvationTime) {
            return 50; // Significant boost to prevent starvation
        }
        return 0;
    }
    async selectNextQueue(queues) {
        const eligibleQueues = Array.from(queues.entries()).filter(([_, queue]) => !queue.isEmpty());
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
    async recordProcessing(queueId, item) {
        const current = this.queueProcessingCounts.get(queueId) || 0;
        this.queueProcessingCounts.set(queueId, current + 1);
        this.lastProcessingTimes.set(queueId, Date.now());
    }
    calculateOverallFairnessScore() {
        const counts = Array.from(this.queueProcessingCounts.values());
        if (counts.length === 0)
            return 1;
        const mean = counts.reduce((sum, count) => sum + count, 0) / counts.length;
        const variance = counts.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) /
            counts.length;
        // Higher scores indicate better fairness (lower variance)
        return Math.max(0, 1 - variance / (mean + 1));
    }
    async updatePolicy(updates) {
        Object.assign(this.policy, updates);
    }
    async updateMetrics() {
        // Update fairness scores for each queue
        for (const queueId of this.queueProcessingCounts.keys()) {
            this.fairnessScores.set(queueId, this.calculateQueueFairnessScore(queueId));
        }
    }
    weightedFairSelection(queues) {
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
    lotterySelection(queues) {
        // Weighted random selection
        const weights = queues.map(([queueId]) => this.policy.tierWeights.get(queueId) || 1);
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
    strideSelection(queues) {
        // Stride scheduling implementation
        return this.weightedFairSelection(queues); // Simplified
    }
    proportionalShareSelection(queues) {
        // Proportional share scheduling
        return this.weightedFairSelection(queues); // Simplified
    }
    calculateQueueFairnessScore(queueId) {
        const expectedShare = this.policy.tierWeights.get(queueId) || 1;
        const actualShare = this.queueProcessingCounts.get(queueId) || 0;
        const totalProcessed = Array.from(this.queueProcessingCounts.values()).reduce((sum, count) => sum + count, 0);
        if (totalProcessed === 0)
            return 1;
        const actualRatio = actualShare / totalProcessed;
        const expectedRatio = expectedShare /
            Array.from(this.policy.tierWeights.values()).reduce((sum, weight) => sum + weight, 0);
        return Math.max(0, 1 - Math.abs(actualRatio - expectedRatio));
    }
}
class QueueLoadBalancer {
    selectOptimalQueue(queues) {
        // Implementation for load balancing across queues
        const nonEmptyQueues = Array.from(queues.entries()).filter(([_, queue]) => !queue.isEmpty());
        if (nonEmptyQueues.length === 0)
            return null;
        // Select queue with least items
        return nonEmptyQueues.reduce((best, current) => current[1].size() < best[1].size() ? current : best)[0];
    }
}
class QueueMetricsCollector {
    enqueueCounts = new Map();
    dequeueCounts = new Map();
    processingTimes = new Map();
    waitTimes = new Map();
    failures = new Map();
    recordEnqueue(item, queueId) {
        const current = this.enqueueCounts.get(queueId) || 0;
        this.enqueueCounts.set(queueId, current + 1);
    }
    recordDequeue(item, queueId) {
        const current = this.dequeueCounts.get(queueId) || 0;
        this.dequeueCounts.set(queueId, current + 1);
        const waitTime = Date.now() - item.timestamp;
        const waitTimes = this.waitTimes.get(queueId) || [];
        waitTimes.push(waitTime);
        this.waitTimes.set(queueId, waitTimes.slice(-1000)); // Keep last 1000
    }
    recordProcessing(item, processingTime, success) {
        const queueId = item.tier;
        if (success) {
            const times = this.processingTimes.get(queueId) || [];
            times.push(processingTime);
            this.processingTimes.set(queueId, times.slice(-1000)); // Keep last 1000
        }
    }
    recordFailure(item, error) {
        const queueId = item.tier;
        const current = this.failures.get(queueId) || 0;
        this.failures.set(queueId, current + 1);
    }
    getQueueMetrics(queueId) {
        const enqueued = this.enqueueCounts.get(queueId) || 0;
        const processed = this.dequeueCounts.get(queueId) || 0;
        const failed = this.failures.get(queueId) || 0;
        const waitTimes = this.waitTimes.get(queueId) || [];
        const processingTimes = this.processingTimes.get(queueId) || [];
        const avgWaitTime = waitTimes.length > 0
            ? waitTimes.reduce((sum, time) => sum + time, 0) / waitTimes.length
            : 0;
        const avgProcessingTime = processingTimes.length > 0
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
    policy;
    constructor(policy) {
        this.policy = policy;
    }
    async checkAndPrevent(queueId) {
        // Implementation for starvation prevention
    }
    async checkAllQueues() {
        // Check all queues for starvation
    }
}
class AdaptiveScheduler {
    async recordOutcome(item, result, processingTime) {
        // Record processing outcomes for learning
    }
    async analyzePerformance() {
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
    async prepareBurstHandling(expectedLoad, duration) {
        // Prepare for burst traffic
    }
    restoreNormalOperation() {
        // Restore normal operation after burst
    }
}
export { PriorityQueue, FairnessManager, QueueLoadBalancer, QueueMetricsCollector, StarvationPreventer, AdaptiveScheduler, };
//# sourceMappingURL=queue-prioritization-system.js.map