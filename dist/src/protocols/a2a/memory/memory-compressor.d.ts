/**
 * Memory Compression and Optimization for A2A Distributed Memory
 *
 * Implements advanced compression techniques:
 * - Multi-algorithm compression (LZ4, Brotli, Neural)
 * - Adaptive algorithm selection
 * - Data deduplication and fingerprinting
 * - Incremental compression with delta encoding
 * - Memory-mapped compression for large datasets
 * - Background optimization and garbage collection
 */
/// <reference types="node" resolution-mode="require"/>
/// <reference types="node" resolution-mode="require"/>
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
export type CompressionAlgorithm = "lz4" | "brotli" | "gzip" | "neural" | "delta" | "dictionary";
export interface CompressionOptions {
    algorithm?: CompressionAlgorithm;
    level?: number;
    enableDeduplication?: boolean;
    enableDeltaEncoding?: boolean;
    blockSize?: number;
    dictionarySize?: number;
    adaptiveSelection?: boolean;
}
export interface CompressionResult {
    compressedData: Buffer;
    originalSize: number;
    compressedSize: number;
    ratio: number;
    algorithm: CompressionAlgorithm;
    checksum: string;
    metadata: {
        compressionTime: number;
        memoryUsed: number;
        quality: number;
        deduplicationSavings?: number;
        deltaEncodingSavings?: number;
    };
}
export interface DecompressionResult {
    data: any;
    originalSize: number;
    decompressionTime: number;
    verified: boolean;
}
export interface DataFingerprint {
    hash: string;
    algorithm: string;
    size: number;
    type: string;
    entropy: number;
    repetitionRate: number;
    textRatio: number;
    binaryRatio: number;
}
export interface CompressionStats {
    totalCompressions: number;
    totalDecompressions: number;
    totalBytesProcessed: number;
    totalBytesSaved: number;
    averageRatio: number;
    averageCompressionTime: number;
    averageDecompressionTime: number;
    algorithmUsage: Map<CompressionAlgorithm, number>;
    deduplicationHits: number;
    memoryUsage: number;
}
export interface OptimizationRule {
    id: string;
    condition: (fingerprint: DataFingerprint) => boolean;
    algorithm: CompressionAlgorithm;
    options: CompressionOptions;
    priority: number;
}
/**
 * Main Memory Compressor
 */
export declare class MemoryCompressor extends EventEmitter {
    private logger;
    private enabled;
    private deduplicationCache;
    private deltaCache;
    private compressionHistory;
    private neuralCompressor;
    private dictionaryCompressor;
    private optimizationRules;
    private stats;
    constructor(enabled?: boolean);
    /**
     * Compress data with automatic algorithm selection
     */
    compress(data: any, options?: CompressionOptions): Promise<CompressionResult>;
    /**
     * Decompress data
     */
    decompress(compressedData: Buffer, algorithm: CompressionAlgorithm, originalSize: number, checksum?: string): Promise<DecompressionResult>;
    /**
     * Compress with specific algorithm and options
     */
    compressWithAlgorithm(data: any, algorithm: CompressionAlgorithm, level?: number): Promise<Buffer>;
    /**
     * Analyze data characteristics for optimal compression
     */
    generateFingerprint(data: Buffer): DataFingerprint;
    /**
     * Add optimization rule
     */
    addOptimizationRule(rule: OptimizationRule): void;
    /**
     * Get compression statistics
     */
    getStats(): CompressionStats;
    /**
     * Perform garbage collection on caches
     */
    garbageCollect(maxAge?: number): number;
    /**
     * Private methods
     */
    private initializeOptimizationRules;
    private selectOptimalAlgorithm;
    private compressLZ4;
    private compressBrotli;
    private compressGzip;
    private compressDelta;
    private decompressLZ4;
    private decompressBrotli;
    private decompressGzip;
    private decompressDelta;
    private checkDeduplication;
    private createDeduplicationResult;
    private createUncompressedResult;
    private serializeData;
    private deserializeData;
    private calculateChecksum;
    private calculateHash;
    private calculateEntropy;
    private calculateRepetitionRate;
    private calculateTextRatio;
    private calculateQuality;
    private getMemoryUsage;
    private updateCompressionStats;
    private updateDecompressionStats;
    private updateMemoryUsage;
    private startBackgroundOptimization;
    private performBackgroundOptimization;
    private optimizeCompressionRules;
}
//# sourceMappingURL=memory-compressor.d.ts.map