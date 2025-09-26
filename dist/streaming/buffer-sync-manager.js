/**
 * Buffer and Synchronization Manager
 *
 * Advanced buffering and synchronization strategies for multimedia streams:
 * - Adaptive buffering with predictive algorithms
 * - Multi-stream synchronization with sub-frame accuracy
 * - Jitter buffer management
 * - Clock synchronization across agents
 * - Quality-aware buffer management
 */
import { EventEmitter } from "node:events";
import { Logger } from "../utils/logger.js";
export class BufferSyncManager extends EventEmitter {
    constructor(syncConfig) {
        super();
        this.bufferPools = new Map();
        this.syncPoints = new Map();
        this.clockReferences = new Map();
        this.logger = new Logger("BufferSyncManager");
        this.syncConfig = syncConfig;
        this.adaptiveAlgorithm = new AdaptiveBufferingAlgorithm();
        this.jitterBuffer = new JitterBuffer();
        this.performanceMonitor = new BufferPerformanceMonitor();
        this.initializeMasterClock();
        this.startSynchronizationLoop();
    }
    /**
     * Create a new buffer pool for a stream
     */
    createBufferPool(streamId, type, strategy) {
        const pool = {
            id: streamId,
            type,
            capacity: this.calculateOptimalCapacity(type, strategy),
            chunks: [],
            watermarks: this.calculateWatermarks(type, strategy),
            strategy,
            metrics: {
                currentLevel: 0,
                targetLevel: strategy.type === "adaptive" ? 0.5 : 0.3,
                underrunCount: 0,
                overrunCount: 0,
                averageLatency: 0,
                jitter: 0,
                throughput: 0,
                efficiency: 1.0,
            },
        };
        this.bufferPools.set(streamId, pool);
        this.logger.info("Buffer pool created", {
            streamId,
            type,
            capacity: pool.capacity,
            strategy: strategy.type,
        });
        return pool;
    }
    /**
     * Add chunk to buffer with intelligent positioning
     */
    async addChunk(streamId, chunk) {
        const pool = this.bufferPools.get(streamId);
        if (!pool) {
            this.logger.warn("Buffer pool not found", { streamId });
            return false;
        }
        // Check if buffer has capacity
        if (!this.hasCapacity(pool, chunk)) {
            const evicted = await this.evictChunks(pool, chunk.metadata.size);
            if (!evicted) {
                this.logger.warn("Buffer overflow, chunk dropped", {
                    streamId,
                    chunkId: chunk.id,
                });
                pool.metrics.overrunCount++;
                return false;
            }
        }
        // Insert chunk in correct temporal position
        const insertIndex = this.findInsertPosition(pool, chunk);
        pool.chunks.splice(insertIndex, 0, chunk);
        // Update buffer metrics
        this.updateBufferMetrics(pool);
        // Check for synchronization requirements
        if (chunk.sync) {
            this.addSyncPoint({
                timestamp: chunk.sync.presentationTimestamp,
                streamId,
                chunkId: chunk.id,
                priority: chunk.metadata.priority === "critical" ? 10 : 5,
                tolerance: this.syncConfig.tolerance ?? this.syncConfig.syncThreshold,
                dependencies: chunk.sync.dependencies,
            });
        }
        // Trigger adaptive algorithm update
        this.adaptiveAlgorithm.onChunkAdded(pool, chunk);
        this.emit("chunk_buffered", {
            streamId,
            chunk,
            bufferLevel: pool.metrics.currentLevel,
        });
        return true;
    }
    /**
     * Retrieve next chunk for playback
     */
    getNextChunk(streamId, currentTime) {
        const pool = this.bufferPools.get(streamId);
        if (!pool || pool.chunks.length === 0) {
            return null;
        }
        // Find the chunk that should be played at current time
        const tolerance = this.syncConfig.tolerance ?? this.syncConfig.syncThreshold;
        const chunkIndex = pool.chunks.findIndex((chunk) => {
            const playTime = chunk.sync?.presentationTimestamp || chunk.timestamp;
            return Math.abs(playTime - currentTime) <= tolerance;
        });
        if (chunkIndex === -1) {
            // No chunk ready for playback
            this.checkForUnderrun(pool, currentTime);
            return null;
        }
        // Remove and return the chunk
        const chunk = pool.chunks.splice(chunkIndex, 1)[0];
        this.updateBufferMetrics(pool);
        this.emit("chunk_consumed", {
            streamId,
            chunk,
            bufferLevel: pool.metrics.currentLevel,
        });
        return chunk;
    }
    /**
     * Synchronize multiple streams to a common timeline
     */
    async synchronizeStreams(streamIds, referenceTime) {
        try {
            const pools = streamIds
                .map((id) => this.bufferPools.get(id))
                .filter(Boolean);
            if (pools.length === 0) {
                return false;
            }
            // Calculate synchronization adjustments
            const adjustments = this.calculateSyncAdjustments(pools, referenceTime);
            // Apply adjustments to each stream
            for (const [streamId, adjustment] of adjustments) {
                await this.applySyncAdjustment(streamId, adjustment);
            }
            // Verify synchronization accuracy
            const syncAccuracy = this.verifySynchronization(pools, referenceTime);
            this.emit("streams_synchronized", {
                streamIds,
                referenceTime,
                accuracy: syncAccuracy,
                adjustments: Object.fromEntries(adjustments),
            });
            return syncAccuracy <= (this.syncConfig.tolerance ?? this.syncConfig.syncThreshold);
        }
        catch (error) {
            this.logger.error("Stream synchronization failed", {
                streamIds,
                error: error.message,
            });
            return false;
        }
    }
    /**
     * Adapt buffering strategy based on network conditions
     */
    adaptToConditions(streamId, conditions) {
        const pool = this.bufferPools.get(streamId);
        if (!pool)
            return;
        const newStrategy = this.adaptiveAlgorithm.calculateOptimalStrategy(pool.strategy, conditions, pool.metrics);
        if (this.shouldUpdateStrategy(pool.strategy, newStrategy)) {
            this.updateBufferingStrategy(pool, newStrategy);
            this.emit("strategy_adapted", {
                streamId,
                oldStrategy: pool.strategy,
                newStrategy,
                conditions,
            });
        }
    }
    /**
     * Get comprehensive buffer statistics
     */
    getBufferStatistics(streamId) {
        const stats = new Map();
        if (streamId) {
            const pool = this.bufferPools.get(streamId);
            if (pool) {
                stats.set(streamId, { ...pool.metrics });
            }
        }
        else {
            for (const [id, pool] of this.bufferPools) {
                stats.set(id, { ...pool.metrics });
            }
        }
        return stats;
    }
    /**
     * Predict optimal buffer size based on conditions
     */
    predictOptimalBufferSize(type, conditions, qualityLevel) {
        return this.adaptiveAlgorithm.predictOptimalSize(type, conditions, qualityLevel);
    }
    /**
     * Flush buffer pool
     */
    flushBuffer(streamId) {
        const pool = this.bufferPools.get(streamId);
        if (!pool)
            return 0;
        const flushedCount = pool.chunks.length;
        pool.chunks = [];
        this.updateBufferMetrics(pool);
        this.emit("buffer_flushed", { streamId, flushedCount });
        return flushedCount;
    }
    /**
     * Calculate optimal buffer capacity based on stream type and strategy
     */
    calculateOptimalCapacity(type, strategy) {
        const baseCapacities = {
            audio: 1024 * 1024, // 1 MB for audio
            video: 10 * 1024 * 1024, // 10 MB for video
            data: 512 * 1024, // 512 KB for data
        };
        let capacity = baseCapacities[type];
        // Adjust based on strategy
        switch (strategy.type) {
            case "adaptive":
                capacity *= 1.5; // More space for adaptation
                break;
            case "predictive":
                capacity *= 2.0; // More space for prediction
                break;
            case "fixed":
                capacity *= 1.0; // Standard size
                break;
        }
        // Adjust based on target latency
        if (strategy.targetLatency < 100) {
            capacity *= 0.5; // Smaller buffer for low latency
        }
        else if (strategy.targetLatency > 500) {
            capacity *= 2.0; // Larger buffer for high latency tolerance
        }
        return Math.floor(capacity);
    }
    /**
     * Calculate buffer watermarks
     */
    calculateWatermarks(type, strategy) {
        const capacity = this.calculateOptimalCapacity(type, strategy);
        return {
            low: Math.floor(capacity * 0.2), // 20% for low watermark
            high: Math.floor(capacity * 0.8), // 80% for high watermark
            critical: Math.floor(capacity * 0.95), // 95% for critical level
        };
    }
    /**
     * Check if buffer has capacity for new chunk
     */
    hasCapacity(pool, chunk) {
        const currentSize = pool.chunks.reduce((sum, c) => sum + c.metadata.size, 0);
        return currentSize + chunk.metadata.size <= pool.capacity;
    }
    /**
     * Evict chunks to make space
     */
    async evictChunks(pool, neededSpace) {
        let freedSpace = 0;
        const toEvict = [];
        // Use LRU strategy for eviction
        const sortedChunks = [...pool.chunks].sort((a, b) => a.timestamp - b.timestamp);
        for (const chunk of sortedChunks) {
            if (freedSpace >= neededSpace)
                break;
            // Don't evict high-priority chunks
            if (chunk.metadata.priority === "critical")
                continue;
            toEvict.push(chunk);
            freedSpace += chunk.metadata.size;
        }
        // Remove evicted chunks
        for (const chunk of toEvict) {
            const index = pool.chunks.indexOf(chunk);
            if (index !== -1) {
                pool.chunks.splice(index, 1);
            }
        }
        this.emit("chunks_evicted", {
            poolId: pool.id,
            evictedCount: toEvict.length,
            freedSpace,
        });
        return freedSpace >= neededSpace;
    }
    /**
     * Find correct insertion position for chunk
     */
    findInsertPosition(pool, chunk) {
        const timestamp = chunk.sync?.presentationTimestamp || chunk.timestamp;
        for (let i = 0; i < pool.chunks.length; i++) {
            const existingTimestamp = pool.chunks[i].sync?.presentationTimestamp || pool.chunks[i].timestamp;
            if (timestamp < existingTimestamp) {
                return i;
            }
        }
        return pool.chunks.length;
    }
    /**
     * Update buffer metrics
     */
    updateBufferMetrics(pool) {
        const currentSize = pool.chunks.reduce((sum, c) => sum + c.metadata.size, 0);
        pool.metrics.currentLevel = currentSize / pool.capacity;
        // Update other metrics based on recent performance
        this.performanceMonitor.updateMetrics(pool);
    }
    /**
     * Add synchronization point
     */
    addSyncPoint(syncPoint) {
        const bucket = Math.floor(syncPoint.timestamp / 1000) * 1000; // 1-second buckets
        if (!this.syncPoints.has(bucket)) {
            this.syncPoints.set(bucket, []);
        }
        this.syncPoints.get(bucket).push(syncPoint);
    }
    /**
     * Check for buffer underrun
     */
    checkForUnderrun(pool, currentTime) {
        if (pool.metrics.currentLevel < pool.watermarks.low / pool.capacity) {
            pool.metrics.underrunCount++;
            this.emit("buffer_underrun", {
                poolId: pool.id,
                currentLevel: pool.metrics.currentLevel,
                currentTime,
                underrunCount: pool.metrics.underrunCount,
            });
        }
    }
    /**
     * Calculate synchronization adjustments
     */
    calculateSyncAdjustments(pools, referenceTime) {
        const adjustments = new Map();
        for (const pool of pools) {
            if (pool.chunks.length === 0)
                continue;
            const nextChunk = pool.chunks[0];
            const chunkTime = nextChunk.sync?.presentationTimestamp || nextChunk.timestamp;
            const adjustment = referenceTime - chunkTime;
            adjustments.set(pool.id, adjustment);
        }
        return adjustments;
    }
    /**
     * Apply synchronization adjustment to stream
     */
    async applySyncAdjustment(streamId, adjustment) {
        const pool = this.bufferPools.get(streamId);
        if (!pool)
            return;
        // Adjust timestamps of all chunks in buffer
        for (const chunk of pool.chunks) {
            if (chunk.sync?.presentationTimestamp) {
                chunk.sync.presentationTimestamp += adjustment;
            }
            else {
                chunk.timestamp += adjustment;
            }
        }
    }
    /**
     * Verify synchronization accuracy
     */
    verifySynchronization(pools, referenceTime) {
        let maxDeviation = 0;
        for (const pool of pools) {
            if (pool.chunks.length === 0)
                continue;
            const nextChunk = pool.chunks[0];
            const chunkTime = nextChunk.sync?.presentationTimestamp || nextChunk.timestamp;
            const deviation = Math.abs(chunkTime - referenceTime);
            maxDeviation = Math.max(maxDeviation, deviation);
        }
        return maxDeviation;
    }
    /**
     * Check if buffering strategy should be updated
     */
    shouldUpdateStrategy(current, proposed) {
        // Only update if the change is significant
        const bufferSizeDiff = Math.abs(proposed.bufferSize - current.bufferSize) / current.bufferSize;
        const latencyDiff = Math.abs(proposed.targetLatency - current.targetLatency) /
            current.targetLatency;
        return bufferSizeDiff > 0.1 || latencyDiff > 0.1; // 10% threshold
    }
    /**
     * Update buffering strategy for pool
     */
    updateBufferingStrategy(pool, newStrategy) {
        pool.strategy = newStrategy;
        pool.watermarks = this.calculateWatermarks(pool.type, newStrategy);
        // Adjust buffer capacity if needed
        const newCapacity = this.calculateOptimalCapacity(pool.type, newStrategy);
        if (newCapacity !== pool.capacity) {
            pool.capacity = newCapacity;
            // Evict chunks if new capacity is smaller
            if (newCapacity < pool.capacity) {
                const currentSize = pool.chunks.reduce((sum, c) => sum + c.metadata.size, 0);
                if (currentSize > newCapacity) {
                    this.evictChunks(pool, currentSize - newCapacity);
                }
            }
        }
    }
    /**
     * Initialize master clock reference
     */
    initializeMasterClock() {
        this.masterClock = {
            id: "master",
            type: "local",
            frequency: 1000, // 1 kHz
            drift: 0,
            offset: 0,
            accuracy: 1, // 1ms accuracy
            lastSync: Date.now(),
        };
        this.clockReferences.set("master", this.masterClock);
    }
    /**
     * Start synchronization loop
     */
    startSynchronizationLoop() {
        setInterval(() => {
            this.performSynchronizationCycle();
        }, 100); // 100ms sync cycle
    }
    /**
     * Perform synchronization cycle
     */
    performSynchronizationCycle() {
        const currentTime = Date.now();
        // Update clock references
        for (const [, clock] of this.clockReferences) {
            if (clock.type === "network") {
                this.updateNetworkClock(clock, currentTime);
            }
        }
        // Process synchronization points
        this.processSyncPoints(currentTime);
    }
    /**
     * Update network clock
     */
    updateNetworkClock(clock, currentTime) {
        // Network clock synchronization logic would go here
        clock.lastSync = currentTime;
    }
    /**
     * Process synchronization points
     */
    processSyncPoints(currentTime) {
        const bucket = Math.floor(currentTime / 1000) * 1000;
        const syncPoints = this.syncPoints.get(bucket);
        if (syncPoints) {
            // Process sync points for current time bucket
            for (const syncPoint of syncPoints) {
                this.processSyncPoint(syncPoint, currentTime);
            }
            // Clean up processed sync points
            this.syncPoints.delete(bucket);
        }
    }
    /**
     * Process individual sync point
     */
    processSyncPoint(syncPoint, currentTime) {
        const deviation = Math.abs(syncPoint.timestamp - currentTime);
        if (deviation > syncPoint.tolerance) {
            this.emit("sync_deviation_detected", {
                syncPoint,
                deviation,
                currentTime,
            });
        }
    }
    /**
     * Clean up resources
     */
    cleanup() {
        this.bufferPools.clear();
        this.syncPoints.clear();
        this.clockReferences.clear();
        this.removeAllListeners();
        this.logger.info("Buffer sync manager cleaned up");
    }
}
/**
 * Adaptive buffering algorithm implementation
 */
class AdaptiveBufferingAlgorithm {
    constructor() {
        this.history = new Map();
    }
    calculateOptimalStrategy(current, conditions, metrics) {
        // Analyze current performance
        const performanceScore = this.calculatePerformanceScore(metrics);
        // Adjust strategy based on conditions
        const newStrategy = { ...current };
        if (conditions.quality && conditions.quality.packetLoss > 0.05) {
            // High packet loss - increase buffer size
            newStrategy.bufferSize = Math.min(current.bufferSize * 1.5, current.bufferSize * 3);
        }
        const latencyRtt = typeof conditions.latency === "object"
            ? conditions.latency.rtt
            : conditions.latency;
        if (latencyRtt > 200) {
            // High latency - adjust target latency
            newStrategy.targetLatency = Math.max(current.targetLatency * 1.2, 500);
        }
        if (metrics.underrunCount > 5) {
            // Frequent underruns - increase buffer size
            newStrategy.bufferSize = Math.min(current.bufferSize * 1.3, current.bufferSize * 2);
        }
        return newStrategy;
    }
    onChunkAdded(pool, chunk) {
        // Record chunk addition for learning
        const history = this.history.get(pool.id) || [];
        history.push({
            timestamp: Date.now(),
            chunkSize: chunk.metadata.size,
            bufferLevel: pool.metrics.currentLevel,
            priority: chunk.metadata.priority,
        });
        // Keep only recent history
        if (history.length > 100) {
            history.splice(0, history.length - 100);
        }
        this.history.set(pool.id, history);
    }
    predictOptimalSize(type, conditions, qualityLevel) {
        // Predictive algorithm implementation
        const baseSize = type === "video" ? 10 * 1024 * 1024 : 1024 * 1024;
        // Adjust based on conditions
        let multiplier = 1.0;
        const availableBw = typeof conditions.bandwidth === "object"
            ? conditions.bandwidth.available
            : conditions.bandwidth;
        if (availableBw < 1000000) {
            // < 1 Mbps
            multiplier *= 0.5;
        }
        else if (availableBw > 10000000) {
            // > 10 Mbps
            multiplier *= 1.5;
        }
        if (qualityLevel === "high" || qualityLevel === "ultra") {
            multiplier *= 1.5;
        }
        else if (qualityLevel === "low") {
            multiplier *= 0.7;
        }
        return Math.floor(baseSize * multiplier);
    }
    calculatePerformanceScore(metrics) {
        // Calculate performance score based on multiple factors
        let score = 1.0;
        // Penalize underruns and overruns
        score -= (metrics.underrunCount + metrics.overrunCount) * 0.1;
        // Reward efficiency
        score *= metrics.efficiency;
        // Penalize high jitter
        if (metrics.jitter > 50) {
            score *= 0.8;
        }
        return Math.max(0, Math.min(1, score));
    }
}
/**
 * Jitter buffer implementation
 */
class JitterBuffer {
    constructor() {
        this.buffers = new Map();
    }
    addPacket(streamId, packet) {
        // Jitter buffer implementation
    }
    getPacket(streamId) {
        // Retrieve packet from jitter buffer
        return null;
    }
}
/**
 * Buffer performance monitor
 */
class BufferPerformanceMonitor {
    updateMetrics(pool) {
        // Update performance metrics based on buffer state
        const chunks = pool.chunks;
        if (chunks.length > 0) {
            // Calculate average latency
            const latencies = chunks
                .filter((c) => c.metadata.synchronized)
                .map((c) => Date.now() - c.timestamp);
            if (latencies.length > 0) {
                pool.metrics.averageLatency =
                    latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
            }
            // Calculate throughput
            const recentChunks = chunks.filter((c) => Date.now() - c.timestamp < 5000); // Last 5 seconds
            const totalBytes = recentChunks.reduce((sum, c) => sum + c.metadata.size, 0);
            pool.metrics.throughput = totalBytes / 5; // Bytes per second
        }
        // Calculate efficiency
        pool.metrics.efficiency = this.calculateEfficiency(pool);
    }
    calculateEfficiency(pool) {
        // Buffer efficiency calculation
        const idealLevel = pool.metrics.targetLevel;
        const actualLevel = pool.metrics.currentLevel;
        const deviation = Math.abs(idealLevel - actualLevel);
        return Math.max(0, 1 - deviation);
    }
}
