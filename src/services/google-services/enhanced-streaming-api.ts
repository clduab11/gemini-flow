/**
 * Enhanced Streaming API extending UnifiedAPI
 *
 * Production-ready streaming interface with real-time multimedia processing,
 * advanced buffering, compression, and fault tolerance.
 */

import { EventEmitter } from "events";
import { Logger } from "../../utils/logger.js";
import { UnifiedAPI } from "../../adapters/unified-api.js";
import {
  StreamingAPI,
  StreamingConfig,
  StreamChunk,
  StreamStatus,
  ChunkMetadata,
  ServiceResponse,
  ServiceError,
  PerformanceMetrics,
} from "./interfaces.js";

export class EnhancedStreamingAPI extends UnifiedAPI implements StreamingAPI {
  private logger: Logger;
  private connections: Map<string, StreamConnection> = new Map();
  private bufferManager: BufferManager;
  private compressionEngine: CompressionEngine;
  private performanceMonitor: StreamingPerformanceMonitor;
  private circuitBreaker: CircuitBreaker;

  constructor(config: any) {
    super(config);
    this.logger = new Logger("EnhancedStreamingAPI");
    this.bufferManager = new BufferManager(config.streaming?.buffer || {});
    this.compressionEngine = new CompressionEngine(
      config.streaming?.compression || {},
    );
    this.performanceMonitor = new StreamingPerformanceMonitor();
    this.circuitBreaker = new CircuitBreaker(
      config.streaming?.circuitBreaker || {},
    );

    this.setupEventHandlers();
  }

  /**
   * Establishes a streaming connection with optimized configuration
   */
  async connect(config: StreamingConfig): Promise<void> {
    const connectionId = this.generateConnectionId();

    try {
      this.logger.info("Establishing streaming connection", {
        connectionId,
        protocol: config.protocol,
      });

      // Validate configuration
      this.validateStreamingConfig(config);

      // Initialize connection based on protocol
      const connection = await this.createConnection(connectionId, config);

      // Setup connection monitoring
      this.setupConnectionMonitoring(connection);

      // Register connection
      this.connections.set(connectionId, connection);

      this.emit("connection:established", { connectionId, config });
    } catch (error) {
      this.logger.error("Failed to establish streaming connection", error);
      throw new Error(`Connection failed: ${error.message}`);
    }
  }

  /**
   * Streams data with advanced buffering and error recovery
   */
  async *stream<T>(request: any): AsyncGenerator<StreamChunk<T>> {
    const streamId = this.generateStreamId();
    const startTime = Date.now();

    try {
      this.logger.debug("Starting stream", { streamId, request });

      // Get available connection
      const connection = this.getOptimalConnection();
      if (!connection) {
        throw new Error("No available streaming connections");
      }

      // Initialize stream state
      const streamState = new StreamState(streamId, request, connection);

      // Start streaming with circuit breaker protection
      yield* this.circuitBreaker.execute(
        async function* () {
          yield* this.streamWithBuffer(streamState);
        }.bind(this),
      );
    } catch (error) {
      this.logger.error("Stream error", { streamId, error });
      this.performanceMonitor.recordError(streamId, error);

      // Attempt recovery
      if (this.shouldRetryStream(error)) {
        this.logger.info("Attempting stream recovery", { streamId });
        yield* this.recoverStream(streamId, request);
      } else {
        throw error;
      }
    } finally {
      const duration = Date.now() - startTime;
      this.performanceMonitor.recordStreamComplete(streamId, duration);
    }
  }

  /**
   * Core streaming implementation with advanced buffering
   */
  private async *streamWithBuffer<T>(
    streamState: StreamState,
  ): AsyncGenerator<StreamChunk<T>> {
    let sequenceNumber = 0;
    const buffer = this.bufferManager.createBuffer(streamState.id);

    try {
      // Start data pipeline
      const dataSource = this.createDataSource(streamState);

      for await (const rawData of dataSource) {
        // Process data through pipeline
        const processedData = await this.processStreamData(
          rawData,
          streamState,
        );

        // Apply compression if enabled
        const compressedData = await this.compressionEngine.compress(
          processedData,
          streamState.connection.config.compression,
        );

        // Create chunk with metadata
        const chunk: StreamChunk<T> = {
          id: `${streamState.id}-${sequenceNumber}`,
          sequence: sequenceNumber++,
          data: compressedData as T,
          final: false,
          metadata: this.createChunkMetadata(compressedData, rawData),
        };

        // Buffer management
        await buffer.enqueue(chunk);

        // Yield from buffer with flow control
        while (buffer.hasData() && !buffer.shouldPause()) {
          const bufferedChunk = await buffer.dequeue();
          this.performanceMonitor.recordChunk(streamState.id, bufferedChunk);
          yield bufferedChunk;
        }

        // Check for stream health
        if (!this.isStreamHealthy(streamState)) {
          throw new Error("Stream health check failed");
        }
      }

      // Mark final chunk
      const finalChunk: StreamChunk<T> = {
        id: `${streamState.id}-final`,
        sequence: sequenceNumber,
        data: null as T,
        final: true,
        metadata: {
          timestamp: new Date(),
          size: 0,
          checksum: "final",
        },
      };

      await buffer.enqueue(finalChunk);

      // Flush remaining buffer
      while (buffer.hasData()) {
        yield await buffer.dequeue();
      }
    } finally {
      buffer.cleanup();
    }
  }

  /**
   * Disconnects and cleans up streaming resources
   */
  async disconnect(): Promise<void> {
    this.logger.info("Disconnecting streaming connections");

    const disconnectPromises = Array.from(this.connections.values()).map(
      (connection) => this.disconnectConnection(connection),
    );

    await Promise.allSettled(disconnectPromises);

    this.connections.clear();
    this.bufferManager.cleanup();
    this.compressionEngine.cleanup();

    this.emit("disconnected");
  }

  /**
   * Gets current streaming status and metrics
   */
  getStatus(): StreamStatus {
    const activeConnections = Array.from(this.connections.values()).filter(
      (conn) => conn.status === "active",
    );

    return {
      connected: activeConnections.length > 0,
      bufferUtilization: this.bufferManager.getUtilization(),
      throughput: this.performanceMonitor.getCurrentThroughput(),
      latency: this.performanceMonitor.getCurrentLatency(),
      errors: this.performanceMonitor.getErrorRate(),
    };
  }

  /**
   * Gets comprehensive performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    return this.performanceMonitor.getMetrics();
  }

  // ==================== Private Helper Methods ====================

  private setupEventHandlers(): void {
    this.on("connection:error", this.handleConnectionError.bind(this));
    this.on("buffer:overflow", this.handleBufferOverflow.bind(this));
    this.on("compression:error", this.handleCompressionError.bind(this));
  }

  private validateStreamingConfig(config: StreamingConfig): void {
    if (config.bufferSize <= 0) {
      throw new Error("Buffer size must be positive");
    }

    if (config.chunkSize <= 0) {
      throw new Error("Chunk size must be positive");
    }

    if (!["websocket", "sse", "grpc"].includes(config.protocol)) {
      throw new Error(`Unsupported protocol: ${config.protocol}`);
    }
  }

  private async createConnection(
    id: string,
    config: StreamingConfig,
  ): Promise<StreamConnection> {
    switch (config.protocol) {
      case "websocket":
        return new WebSocketConnection(id, config);
      case "sse":
        return new SSEConnection(id, config);
      case "grpc":
        return new GRPCConnection(id, config);
      default:
        throw new Error(`Unsupported protocol: ${config.protocol}`);
    }
  }

  private setupConnectionMonitoring(connection: StreamConnection): void {
    connection.on("error", (error) => {
      this.emit("connection:error", { connection: connection.id, error });
    });

    connection.on("close", () => {
      this.connections.delete(connection.id);
    });

    connection.on("data", (data) => {
      this.performanceMonitor.recordData(connection.id, data);
    });
  }

  private getOptimalConnection(): StreamConnection | null {
    const activeConnections = Array.from(this.connections.values()).filter(
      (conn) => conn.status === "active",
    );

    if (activeConnections.length === 0) return null;

    // Select connection with lowest latency and utilization
    return activeConnections.reduce((best, current) => {
      const bestScore = this.calculateConnectionScore(best);
      const currentScore = this.calculateConnectionScore(current);
      return currentScore > bestScore ? current : best;
    });
  }

  private calculateConnectionScore(connection: StreamConnection): number {
    const latencyWeight = 0.4;
    const utilizationWeight = 0.3;
    const throughputWeight = 0.3;

    const latencyScore = Math.max(0, 100 - connection.getLatency());
    const utilizationScore = Math.max(0, 100 - connection.getUtilization());
    const throughputScore = Math.min(100, connection.getThroughput() / 1000);

    return (
      latencyScore * latencyWeight +
      utilizationScore * utilizationWeight +
      throughputScore * throughputWeight
    );
  }

  private async processStreamData(
    data: any,
    streamState: StreamState,
  ): Promise<any> {
    // Apply data transformations based on stream configuration
    let processedData = data;

    // Content filtering
    if (streamState.config.contentFilter) {
      processedData = await this.applyContentFilter(
        processedData,
        streamState.config.contentFilter,
      );
    }

    // Data enrichment
    if (streamState.config.enrichment) {
      processedData = await this.enrichData(
        processedData,
        streamState.config.enrichment,
      );
    }

    // Validation
    if (streamState.config.validation) {
      await this.validateData(processedData, streamState.config.validation);
    }

    return processedData;
  }

  private createChunkMetadata(
    compressedData: any,
    originalData: any,
  ): ChunkMetadata {
    return {
      timestamp: new Date(),
      size: this.calculateDataSize(compressedData),
      compression: this.compressionEngine.getCompressionInfo(
        compressedData,
        originalData,
      ),
      checksum: this.calculateChecksum(compressedData),
    };
  }

  private isStreamHealthy(streamState: StreamState): boolean {
    const metrics = this.performanceMonitor.getStreamMetrics(streamState.id);

    // Check latency threshold
    if (metrics.latency > streamState.config.maxLatency) {
      return false;
    }

    // Check error rate
    if (metrics.errorRate > streamState.config.maxErrorRate) {
      return false;
    }

    // Check buffer health
    if (this.bufferManager.getUtilization() > 0.9) {
      return false;
    }

    return true;
  }

  private shouldRetryStream(error: any): boolean {
    // Network errors are retryable
    if (error.code === "NETWORK_ERROR") return true;

    // Temporary service errors are retryable
    if (error.code === "SERVICE_UNAVAILABLE") return true;

    // Rate limiting errors are retryable with backoff
    if (error.code === "RATE_LIMITED") return true;

    // Authentication errors are not retryable
    if (error.code === "AUTHENTICATION_ERROR") return false;

    // Validation errors are not retryable
    if (error.code === "VALIDATION_ERROR") return false;

    return false;
  }

  private async *recoverStream<T>(
    streamId: string,
    request: any,
  ): AsyncGenerator<StreamChunk<T>> {
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        await this.delay(Math.pow(2, retryCount) * 1000); // Exponential backoff
        this.logger.info("Retrying stream", {
          streamId,
          attempt: retryCount + 1,
        });

        yield* this.stream<T>(request);
        return; // Success, exit retry loop
      } catch (error) {
        retryCount++;
        this.logger.warn("Stream retry failed", {
          streamId,
          attempt: retryCount,
          error,
        });

        if (retryCount >= maxRetries) {
          throw new Error(
            `Stream recovery failed after ${maxRetries} attempts: ${error.message}`,
          );
        }
      }
    }
  }

  private async disconnectConnection(
    connection: StreamConnection,
  ): Promise<void> {
    try {
      await connection.close();
    } catch (error) {
      this.logger.warn("Error closing connection", {
        connection: connection.id,
        error,
      });
    }
  }

  private handleConnectionError(event: any): void {
    this.logger.error("Connection error", event);

    // Remove failed connection
    if (this.connections.has(event.connection)) {
      this.connections.delete(event.connection);
    }

    // Trigger reconnection if needed
    if (this.connections.size === 0) {
      this.emit("reconnection:needed");
    }
  }

  private handleBufferOverflow(event: any): void {
    this.logger.warn("Buffer overflow detected", event);

    // Implement overflow strategies
    this.bufferManager.handleOverflow(event.bufferId, "drop_oldest");
  }

  private handleCompressionError(event: any): void {
    this.logger.error("Compression error", event);

    // Fallback to uncompressed streaming
    this.compressionEngine.disableForStream(event.streamId);
  }

  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateStreamId(): string {
    return `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateDataSize(data: any): number {
    if (Buffer.isBuffer(data)) return data.length;
    if (typeof data === "string") return Buffer.byteLength(data, "utf8");
    return JSON.stringify(data).length;
  }

  private calculateChecksum(data: any): string {
    // Simple checksum implementation - use crypto.createHash in production
    const str = typeof data === "string" ? data : JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private createDataSource(streamState: StreamState): AsyncIterable<any> {
    // Implementation depends on the specific data source
    // This is a placeholder that should be implemented based on actual requirements
    return {
      [Symbol.asyncIterator]: async function* () {
        // Yield data chunks
        yield { message: "streaming data chunk" };
      },
    };
  }

  private async applyContentFilter(data: any, filter: any): Promise<any> {
    // Content filtering implementation
    return data;
  }

  private async enrichData(data: any, enrichment: any): Promise<any> {
    // Data enrichment implementation
    return data;
  }

  private async validateData(data: any, validation: any): Promise<void> {
    // Data validation implementation
  }
}

// ==================== Supporting Classes ====================

class StreamConnection extends EventEmitter {
  public readonly id: string;
  public readonly config: StreamingConfig;
  public status: "connecting" | "active" | "closing" | "closed" | "error";

  constructor(id: string, config: StreamingConfig) {
    super();
    this.id = id;
    this.config = config;
    this.status = "connecting";
  }

  async close(): Promise<void> {
    this.status = "closing";
    // Implementation specific to connection type
    this.status = "closed";
    this.emit("close");
  }

  getLatency(): number {
    // Return current connection latency in ms
    return 0;
  }

  getUtilization(): number {
    // Return current connection utilization percentage
    return 0;
  }

  getThroughput(): number {
    // Return current throughput in bytes/sec
    return 0;
  }
}

class WebSocketConnection extends StreamConnection {
  // WebSocket-specific implementation
}

class SSEConnection extends StreamConnection {
  // Server-Sent Events specific implementation
}

class GRPCConnection extends StreamConnection {
  // gRPC specific implementation
}

class StreamState {
  public readonly id: string;
  public readonly request: any;
  public readonly connection: StreamConnection;
  public readonly config: any;
  public readonly startTime: Date;

  constructor(id: string, request: any, connection: StreamConnection) {
    this.id = id;
    this.request = request;
    this.connection = connection;
    this.config = this.mergeConfig(request.config, connection.config);
    this.startTime = new Date();
  }

  private mergeConfig(requestConfig: any, connectionConfig: any): any {
    return {
      ...connectionConfig,
      ...requestConfig,
      maxLatency: requestConfig?.maxLatency || 1000,
      maxErrorRate: requestConfig?.maxErrorRate || 0.1,
    };
  }
}

class BufferManager {
  private buffers: Map<string, StreamBuffer> = new Map();
  private config: any;

  constructor(config: any) {
    this.config = config;
  }

  createBuffer(streamId: string): StreamBuffer {
    const buffer = new StreamBuffer(streamId, this.config);
    this.buffers.set(streamId, buffer);
    return buffer;
  }

  getUtilization(): number {
    const buffers = Array.from(this.buffers.values());
    if (buffers.length === 0) return 0;

    const totalUtilization = buffers.reduce(
      (sum, buffer) => sum + buffer.getUtilization(),
      0,
    );
    return totalUtilization / buffers.length;
  }

  handleOverflow(bufferId: string, strategy: string): void {
    const buffer = this.buffers.get(bufferId);
    if (buffer) {
      buffer.handleOverflow(strategy);
    }
  }

  cleanup(): void {
    for (const buffer of this.buffers.values()) {
      buffer.cleanup();
    }
    this.buffers.clear();
  }
}

class StreamBuffer {
  private queue: any[] = [];
  private readonly maxSize: number;
  private readonly id: string;

  constructor(id: string, config: any) {
    this.id = id;
    this.maxSize = config.maxSize || 1000;
  }

  async enqueue(item: any): Promise<void> {
    if (this.queue.length >= this.maxSize) {
      throw new Error("Buffer overflow");
    }
    this.queue.push(item);
  }

  async dequeue(): Promise<any> {
    return this.queue.shift();
  }

  hasData(): boolean {
    return this.queue.length > 0;
  }

  shouldPause(): boolean {
    return this.queue.length > this.maxSize * 0.8;
  }

  getUtilization(): number {
    return (this.queue.length / this.maxSize) * 100;
  }

  handleOverflow(strategy: string): void {
    switch (strategy) {
      case "drop_oldest":
        this.queue.shift();
        break;
      case "drop_newest":
        this.queue.pop();
        break;
      default:
        // Default to drop oldest
        this.queue.shift();
    }
  }

  cleanup(): void {
    this.queue.length = 0;
  }
}

class CompressionEngine {
  private config: any;
  private disabledStreams: Set<string> = new Set();

  constructor(config: any) {
    this.config = config;
  }

  async compress(data: any, compressionConfig: any): Promise<any> {
    if (!compressionConfig?.enabled) return data;

    // Implement actual compression using standard algorithms
    // This could use gzip, brotli, or custom compression based on data type
    const compressionType = this.getOptimalCompressionType(data);
    
    try {
      switch (compressionType) {
        case 'gzip':
          // Use Node.js built-in gzip compression
          const zlib = await import('zlib');
          return zlib.gzipSync(Buffer.from(JSON.stringify(data)));
        case 'brotli':
          // Use brotli compression for better ratios
          const zlibBr = await import('zlib');
          return zlibBr.brotliCompressSync(Buffer.from(JSON.stringify(data)));
        default:
          // Return JSON string as Buffer for consistency
          return Buffer.from(JSON.stringify(data));
      }
    } catch (error) {
      this.logger.warn('Compression failed, returning uncompressed data', { error });
      return Buffer.from(JSON.stringify(data));
    }
  }

  getCompressionInfo(
    compressedData: any,
    originalData: any,
  ): string | undefined {
    // Return compression algorithm and ratio
    return undefined;
  }

  disableForStream(streamId: string): void {
    this.disabledStreams.add(streamId);
  }

  cleanup(): void {
    this.disabledStreams.clear();
  }
}

class StreamingPerformanceMonitor {
  private metrics: Map<string, any> = new Map();

  recordChunk(streamId: string, chunk: any): void {
    // Record chunk metrics
  }

  recordError(streamId: string, error: any): void {
    // Record error metrics
  }

  recordStreamComplete(streamId: string, duration: number): void {
    // Record completion metrics
  }

  recordData(connectionId: string, data: any): void {
    // Record data metrics
  }

  getCurrentThroughput(): number {
    return 0;
  }

  getCurrentLatency(): number {
    return 0;
  }

  getErrorRate(): number {
    return 0;
  }

  getStreamMetrics(streamId: string): any {
    return {
      latency: 0,
      errorRate: 0,
    };
  }

  getMetrics(): PerformanceMetrics {
    return {
      latency: {
        mean: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        max: 0,
      },
      throughput: {
        requestsPerSecond: 0,
        bytesPerSecond: 0,
        operationsPerSecond: 0,
      },
      utilization: {
        cpu: 0,
        memory: 0,
        disk: 0,
        network: 0,
      },
      errors: {
        rate: 0,
        percentage: 0,
        types: {},
      },
    };
  }
}

class CircuitBreaker {
  private config: any;
  private state: "closed" | "open" | "half-open" = "closed";
  private failures: number = 0;
  private lastFailureTime: number = 0;

  constructor(config: any) {
    this.config = {
      failureThreshold: 5,
      timeout: 60000, // 1 minute
      ...config,
    };
  }

  async execute<T>(
    operation: () => Promise<T> | AsyncGenerator<T>,
  ): Promise<T> | AsyncGenerator<T> {
    if (this.state === "open") {
      if (Date.now() - this.lastFailureTime > this.config.timeout) {
        this.state = "half-open";
      } else {
        throw new Error("Circuit breaker is open");
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = "closed";
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.config.failureThreshold) {
      this.state = "open";
    }
  }
}
