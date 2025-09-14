/**
 * Memory Pool Manager - Advanced memory allocation and garbage collection optimization
 * Implements memory pools, defragmentation, and adaptive allocation strategies
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
export interface MemoryBlock {
    id: string;
    address: number;
    size: number;
    status: "free" | "allocated" | "reserved";
    type: "buffer" | "object" | "string" | "binary";
    lifetime: number;
    lastAccessed: number;
    allocationTime: number;
    references: number;
    metadata: {
        owner: string;
        purpose: string;
        priority: "low" | "medium" | "high" | "critical";
    };
}
export interface MemoryPool {
    id: string;
    name: string;
    totalSize: number;
    allocatedSize: number;
    freeSize: number;
    blockSize: number;
    blocks: Map<string, MemoryBlock>;
    fragmentationRatio: number;
    allocationStrategy: "first-fit" | "best-fit" | "worst-fit" | "buddy-system";
    gcStrategy: "mark-sweep" | "generational" | "incremental" | "concurrent";
}
export interface AllocationRequest {
    size: number;
    type: "buffer" | "object" | "string" | "binary";
    lifetime: number;
    priority: "low" | "medium" | "high" | "critical";
    alignment?: number;
    owner: string;
    purpose: string;
}
export interface GCMetrics {
    collections: number;
    totalCollectionTime: number;
    averageCollectionTime: number;
    memoryReclaimed: number;
    fragmentationReduced: number;
    lastCollectionTime: number;
}
export interface MemoryMetrics {
    totalMemory: number;
    allocatedMemory: number;
    freeMemory: number;
    fragmentation: number;
    allocationRate: number;
    deallocationRate: number;
    gcOverhead: number;
    poolUtilization: Map<string, number>;
}
export declare class MemoryPoolManager extends EventEmitter {
    private pools;
    private allocationHistory;
    private gcMetrics;
    private defragmentationScheduler;
    private adaptiveAllocator;
    private compressionManager;
    private memoryMonitor;
    constructor();
    /**
     * Create a new memory pool with specified parameters
     */
    createPool(config: {
        id: string;
        name: string;
        size: number;
        blockSize: number;
        strategy: "first-fit" | "best-fit" | "worst-fit" | "buddy-system";
        gcStrategy: "mark-sweep" | "generational" | "incremental" | "concurrent";
    }): void;
    /**
     * Allocate memory from the most suitable pool
     */
    allocate(request: AllocationRequest): Promise<MemoryBlock | null>;
    /**
     * Deallocate memory block
     */
    deallocate(blockId: string): Promise<void>;
    /**
     * Perform garbage collection on specified pool
     */
    garbageCollect(poolId: string): Promise<GCMetrics>;
    /**
     * Defragment memory pool to reduce fragmentation
     */
    defragment(poolId: string): Promise<{
        fragmentationBefore: number;
        fragmentationAfter: number;
        blocksMovedm: number;
    }>;
    /**
     * Adaptive memory compression for less frequently accessed data
     */
    compressMemory(poolId: string, compressionRatio?: number): Promise<{
        originalSize: number;
        compressedSize: number;
        compressionRatio: number;
        blocksCompressed: number;
    }>;
    /**
     * Get comprehensive memory metrics
     */
    getMemoryMetrics(): MemoryMetrics;
    /**
     * Optimize memory allocation patterns based on usage history
     */
    optimizeAllocationStrategy(): Promise<void>;
    /**
     * Predictive memory preallocation based on usage patterns
     */
    preallocateMemory(): Promise<void>;
    private initializeManager;
    private selectOptimalPool;
    private scorePool;
    private getOptimalStrategy;
    private allocateFromPool;
    private findAvailableBlock;
    private buddySystemAllocate;
    private tryRecoverMemory;
    private findBlock;
    private getPoolForBlock;
    private coalesceAdjacentBlocks;
    private findAdjacentBlocks;
    private mergeBlocks;
    private markAndSweep;
    private generationalGC;
    private incrementalGC;
    private concurrentGC;
    private calculateFragmentation;
    private identifyBlocksForDefragmentation;
    private moveBlock;
    private identifyCompressionCandidates;
    private calculateAllocationRate;
    private calculateDeallocationRate;
    private calculateGCOverhead;
    private adjustPoolBlockSize;
    private preallocateBlocks;
    private performBackgroundMaintenance;
}
declare class DefragmentationScheduler {
    schedule(poolId: string, priority: number): void;
}
declare class AdaptiveAllocator {
    analyzePatterns(history: AllocationRequest[]): Promise<any>;
    predictFutureAllocations(history: AllocationRequest[]): Promise<any[]>;
}
declare class CompressionManager {
    compressBlock(block: MemoryBlock): Promise<{
        success: boolean;
        compressedSize: number;
    }>;
}
declare class MemoryMonitor {
    startMonitoring(): void;
}
export { DefragmentationScheduler, AdaptiveAllocator, CompressionManager, MemoryMonitor, };
//# sourceMappingURL=memory-pool-manager.d.ts.map