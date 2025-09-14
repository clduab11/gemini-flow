/**
 * Performance Optimizer for Byzantine Consensus
 * Implements advanced optimizations for consensus rounds including
 * batching, pipelining, speculation, and adaptive algorithms
 */
/// <reference types="node" resolution-mode="require"/>
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
    throughput: number;
    latency: number;
    batchEfficiency: number;
    networkUtilization: number;
    consensusSuccess: number;
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
export declare class PerformanceOptimizer extends EventEmitter {
    private config;
    private metrics;
    private proposalQueue;
    private batchQueue;
    private pipeline;
    private speculations;
    private adaptiveThresholds;
    private messageCache;
    private batchTimer;
    private performanceMonitor;
    private lastMetricsUpdate;
    private operationHistory;
    constructor(config?: Partial<OptimizationConfig>);
    /**
     * Initialize adaptive thresholds
     */
    private initializeAdaptiveThresholds;
    /**
     * Optimize proposal for consensus
     */
    optimizeProposal(proposal: ConsensusProposal): Promise<OptimizedResult<ConsensusProposal>>;
    /**
     * Create optimized batch of proposals
     */
    private createBatch;
    /**
     * Process batched proposals
     */
    private processBatch;
    /**
     * Process batch through pipeline
     */
    private processPipelined;
    /**
     * Process individual pipeline stage
     */
    private processStage;
    /**
     * Execute batch speculatively
     */
    private executeSpeculatively;
    /**
     * Compress batch for network efficiency
     */
    private compressBatch;
    /**
     * Optimize message processing
     */
    optimizeMessage(message: ConsensusMessage): OptimizedResult<ConsensusMessage>;
    /**
     * Adapt thresholds based on performance
     */
    private adaptThresholds;
    /**
     * Apply threshold adjustment
     */
    private applyThresholdAdjustment;
    /**
     * Start performance monitoring
     */
    private startPerformanceMonitoring;
    /**
     * Update performance metrics
     */
    private updateMetrics;
    /**
     * Calculate batch efficiency
     */
    private calculateBatchEfficiency;
    /**
     * Get current resource usage
     */
    private getResourceUsage;
    /**
     * Cleanup expired data
     */
    private cleanupExpiredData;
    private shouldCreateBatch;
    private startBatchTimer;
    private generateBatchId;
    private calculateBatchHash;
    private simulateStageProcessing;
    private createSpeculation;
    private calculateSpeculationConfidence;
    private executeSpeculation;
    private rollbackSpeculation;
    private commitSpeculation;
    private simulateCompression;
    private isDuplicateMessage;
    private compressPayload;
    private calculatePerformanceGain;
    private calculateMessagePerformanceGain;
    private getAppliedOptimizations;
    private getCompressionRatio;
    private getCurrentMetricValue;
    private recordOperation;
    /**
     * Get current performance metrics
     */
    getMetrics(): PerformanceMetrics;
    /**
     * Get optimization configuration
     */
    getConfig(): OptimizationConfig;
    /**
     * Update optimization configuration
     */
    updateConfig(newConfig: Partial<OptimizationConfig>): void;
    /**
     * Cleanup resources
     */
    cleanup(): void;
}
export interface OptimizedResult<T> {
    optimized: T;
    optimizations: string[];
    performanceGain: number;
    metadata: Record<string, any>;
}
export default PerformanceOptimizer;
//# sourceMappingURL=performance-optimizer.d.ts.map