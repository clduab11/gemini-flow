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
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { MultiModalChunk, BufferingStrategy, SynchronizationConfig, NetworkConditions } from "../types/streaming.js";
export interface BufferMetrics {
    currentLevel: number;
    targetLevel: number;
    underrunCount: number;
    overrunCount: number;
    averageLatency: number;
    jitter: number;
    throughput: number;
    efficiency: number;
}
export interface SyncPoint {
    timestamp: number;
    streamId: string;
    chunkId: string;
    priority: number;
    tolerance: number;
    dependencies: string[];
}
export interface BufferPool {
    id: string;
    type: "audio" | "video" | "data";
    capacity: number;
    chunks: MultiModalChunk[];
    watermarks: {
        low: number;
        high: number;
        critical: number;
    };
    strategy: BufferingStrategy;
    metrics: BufferMetrics;
}
export interface ClockReference {
    id: string;
    type: "local" | "network" | "master";
    frequency: number;
    drift: number;
    offset: number;
    accuracy: number;
    lastSync: number;
}
export declare class BufferSyncManager extends EventEmitter {
    private logger;
    private bufferPools;
    private syncPoints;
    private clockReferences;
    private masterClock;
    private syncConfig;
    private adaptiveAlgorithm;
    private jitterBuffer;
    private performanceMonitor;
    constructor(syncConfig: SynchronizationConfig);
    /**
     * Create a new buffer pool for a stream
     */
    createBufferPool(streamId: string, type: "audio" | "video" | "data", strategy: BufferingStrategy): BufferPool;
    /**
     * Add chunk to buffer with intelligent positioning
     */
    addChunk(streamId: string, chunk: MultiModalChunk): Promise<boolean>;
    /**
     * Retrieve next chunk for playback
     */
    getNextChunk(streamId: string, currentTime: number): MultiModalChunk | null;
    /**
     * Synchronize multiple streams to a common timeline
     */
    synchronizeStreams(streamIds: string[], referenceTime: number): Promise<boolean>;
    /**
     * Adapt buffering strategy based on network conditions
     */
    adaptToConditions(streamId: string, conditions: NetworkConditions): void;
    /**
     * Get comprehensive buffer statistics
     */
    getBufferStatistics(streamId?: string): Map<string, BufferMetrics>;
    /**
     * Predict optimal buffer size based on conditions
     */
    predictOptimalBufferSize(type: "audio" | "video" | "data", conditions: NetworkConditions, qualityLevel: string): number;
    /**
     * Flush buffer pool
     */
    flushBuffer(streamId: string): number;
    /**
     * Calculate optimal buffer capacity based on stream type and strategy
     */
    private calculateOptimalCapacity;
    /**
     * Calculate buffer watermarks
     */
    private calculateWatermarks;
    /**
     * Check if buffer has capacity for new chunk
     */
    private hasCapacity;
    /**
     * Evict chunks to make space
     */
    private evictChunks;
    /**
     * Find correct insertion position for chunk
     */
    private findInsertPosition;
    /**
     * Update buffer metrics
     */
    private updateBufferMetrics;
    /**
     * Add synchronization point
     */
    private addSyncPoint;
    /**
     * Check for buffer underrun
     */
    private checkForUnderrun;
    /**
     * Calculate synchronization adjustments
     */
    private calculateSyncAdjustments;
    /**
     * Apply synchronization adjustment to stream
     */
    private applySyncAdjustment;
    /**
     * Verify synchronization accuracy
     */
    private verifySynchronization;
    /**
     * Check if buffering strategy should be updated
     */
    private shouldUpdateStrategy;
    /**
     * Update buffering strategy for pool
     */
    private updateBufferingStrategy;
    /**
     * Initialize master clock reference
     */
    private initializeMasterClock;
    /**
     * Start synchronization loop
     */
    private startSynchronizationLoop;
    /**
     * Perform synchronization cycle
     */
    private performSynchronizationCycle;
    /**
     * Update network clock
     */
    private updateNetworkClock;
    /**
     * Process synchronization points
     */
    private processSyncPoints;
    /**
     * Process individual sync point
     */
    private processSyncPoint;
    /**
     * Clean up resources
     */
    cleanup(): void;
}
//# sourceMappingURL=buffer-sync-manager.d.ts.map