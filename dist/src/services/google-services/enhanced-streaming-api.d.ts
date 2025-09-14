/**
 * Enhanced Streaming API extending UnifiedAPI
 *
 * Production-ready streaming interface with real-time multimedia processing,
 * advanced buffering, compression, and fault tolerance.
 */
import { UnifiedAPI } from "../../adapters/unified-api.js";
import { StreamingAPI, StreamingConfig, StreamChunk, StreamStatus, PerformanceMetrics } from "./interfaces.js";
export declare class EnhancedStreamingAPI extends UnifiedAPI implements StreamingAPI {
    private logger;
    private connections;
    private bufferManager;
    private compressionEngine;
    private performanceMonitor;
    private circuitBreaker;
    constructor(config: any);
    /**
     * Establishes a streaming connection with optimized configuration
     */
    connect(config: StreamingConfig): Promise<void>;
    /**
     * Streams data with advanced buffering and error recovery
     */
    stream<T>(request: any): AsyncGenerator<StreamChunk<T>>;
    /**
     * Core streaming implementation with advanced buffering
     */
    private streamWithBuffer;
    /**
     * Disconnects and cleans up streaming resources
     */
    disconnect(): Promise<void>;
    /**
     * Gets current streaming status and metrics
     */
    getStatus(): StreamStatus;
    /**
     * Gets comprehensive performance metrics
     */
    getPerformanceMetrics(): PerformanceMetrics;
    private setupEventHandlers;
    private validateStreamingConfig;
    private createConnection;
    private setupConnectionMonitoring;
    private getOptimalConnection;
    private calculateConnectionScore;
    private processStreamData;
    private createChunkMetadata;
    private isStreamHealthy;
    private shouldRetryStream;
    private recoverStream;
    private disconnectConnection;
    private handleConnectionError;
    private handleBufferOverflow;
    private handleCompressionError;
    private generateConnectionId;
    private generateStreamId;
    private calculateDataSize;
    private calculateChecksum;
    private delay;
    private createDataSource;
    private applyContentFilter;
    private enrichData;
    private validateData;
}
//# sourceMappingURL=enhanced-streaming-api.d.ts.map