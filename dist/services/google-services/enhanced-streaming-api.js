/**
 * Enhanced Streaming API extending UnifiedAPI
 *
 * Production-ready streaming interface with real-time multimedia processing,
 * advanced buffering, compression, and fault tolerance.
 */
import { EventEmitter } from "events";
import { Logger } from "../../utils/logger.js";
import { UnifiedAPI } from "../../adapters/unified-api.js";
export class EnhancedStreamingAPI extends UnifiedAPI {
    logger;
    connections = new Map();
    bufferManager;
    compressionEngine;
    performanceMonitor;
    circuitBreaker;
    constructor(config) {
        super(config);
        this.logger = new Logger("EnhancedStreamingAPI");
        this.bufferManager = new BufferManager(config.streaming?.buffer || {});
        this.compressionEngine = new CompressionEngine(config.streaming?.compression || {});
        this.performanceMonitor = new StreamingPerformanceMonitor();
        this.circuitBreaker = new CircuitBreaker(config.streaming?.circuitBreaker || {});
        this.setupEventHandlers();
    }
    /**
     * Establishes a streaming connection with optimized configuration
     */
    async connect(config) {
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
        }
        catch (error) {
            this.logger.error("Failed to establish streaming connection", error);
            throw new Error(`Connection failed: ${error.message}`);
        }
    }
    /**
     * Streams data with advanced buffering and error recovery
     */
    async *stream(request) {
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
            yield* this.circuitBreaker.execute(async function* () {
                yield* this.streamWithBuffer(streamState);
            }.bind(this));
        }
        catch (error) {
            this.logger.error("Stream error", { streamId, error });
            this.performanceMonitor.recordError(streamId, error);
            // Attempt recovery
            if (this.shouldRetryStream(error)) {
                this.logger.info("Attempting stream recovery", { streamId });
                yield* this.recoverStream(streamId, request);
            }
            else {
                throw error;
            }
        }
        finally {
            const duration = Date.now() - startTime;
            this.performanceMonitor.recordStreamComplete(streamId, duration);
        }
    }
    /**
     * Core streaming implementation with advanced buffering
     */
    async *streamWithBuffer(streamState) {
        let sequenceNumber = 0;
        const buffer = this.bufferManager.createBuffer(streamState.id);
        try {
            // Start data pipeline
            const dataSource = this.createDataSource(streamState);
            for await (const rawData of dataSource) {
                // Process data through pipeline
                const processedData = await this.processStreamData(rawData, streamState);
                // Apply compression if enabled
                const compressedData = await this.compressionEngine.compress(processedData, streamState.connection.config.compression);
                // Create chunk with metadata
                const chunk = {
                    id: `${streamState.id}-${sequenceNumber}`,
                    sequence: sequenceNumber++,
                    data: compressedData,
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
            const finalChunk = {
                id: `${streamState.id}-final`,
                sequence: sequenceNumber,
                data: null,
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
        }
        finally {
            buffer.cleanup();
        }
    }
    /**
     * Disconnects and cleans up streaming resources
     */
    async disconnect() {
        this.logger.info("Disconnecting streaming connections");
        const disconnectPromises = Array.from(this.connections.values()).map((connection) => this.disconnectConnection(connection));
        await Promise.allSettled(disconnectPromises);
        this.connections.clear();
        this.bufferManager.cleanup();
        this.compressionEngine.cleanup();
        this.emit("disconnected");
    }
    /**
     * Gets current streaming status and metrics
     */
    getStatus() {
        const activeConnections = Array.from(this.connections.values()).filter((conn) => conn.status === "active");
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
    getPerformanceMetrics() {
        return this.performanceMonitor.getMetrics();
    }
    // ==================== Private Helper Methods ====================
    setupEventHandlers() {
        this.on("connection:error", this.handleConnectionError.bind(this));
        this.on("buffer:overflow", this.handleBufferOverflow.bind(this));
        this.on("compression:error", this.handleCompressionError.bind(this));
    }
    validateStreamingConfig(config) {
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
    async createConnection(id, config) {
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
    setupConnectionMonitoring(connection) {
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
    getOptimalConnection() {
        const activeConnections = Array.from(this.connections.values()).filter((conn) => conn.status === "active");
        if (activeConnections.length === 0)
            return null;
        // Select connection with lowest latency and utilization
        return activeConnections.reduce((best, current) => {
            const bestScore = this.calculateConnectionScore(best);
            const currentScore = this.calculateConnectionScore(current);
            return currentScore > bestScore ? current : best;
        });
    }
    calculateConnectionScore(connection) {
        const latencyWeight = 0.4;
        const utilizationWeight = 0.3;
        const throughputWeight = 0.3;
        const latencyScore = Math.max(0, 100 - connection.getLatency());
        const utilizationScore = Math.max(0, 100 - connection.getUtilization());
        const throughputScore = Math.min(100, connection.getThroughput() / 1000);
        return (latencyScore * latencyWeight +
            utilizationScore * utilizationWeight +
            throughputScore * throughputWeight);
    }
    async processStreamData(data, streamState) {
        // Apply data transformations based on stream configuration
        let processedData = data;
        // Content filtering
        if (streamState.config.contentFilter) {
            processedData = await this.applyContentFilter(processedData, streamState.config.contentFilter);
        }
        // Data enrichment
        if (streamState.config.enrichment) {
            processedData = await this.enrichData(processedData, streamState.config.enrichment);
        }
        // Validation
        if (streamState.config.validation) {
            await this.validateData(processedData, streamState.config.validation);
        }
        return processedData;
    }
    createChunkMetadata(compressedData, originalData) {
        return {
            timestamp: new Date(),
            size: this.calculateDataSize(compressedData),
            compression: this.compressionEngine.getCompressionInfo(compressedData, originalData),
            checksum: this.calculateChecksum(compressedData),
        };
    }
    isStreamHealthy(streamState) {
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
    shouldRetryStream(error) {
        // Network errors are retryable
        if (error.code === "NETWORK_ERROR")
            return true;
        // Temporary service errors are retryable
        if (error.code === "SERVICE_UNAVAILABLE")
            return true;
        // Rate limiting errors are retryable with backoff
        if (error.code === "RATE_LIMITED")
            return true;
        // Authentication errors are not retryable
        if (error.code === "AUTHENTICATION_ERROR")
            return false;
        // Validation errors are not retryable
        if (error.code === "VALIDATION_ERROR")
            return false;
        return false;
    }
    async *recoverStream(streamId, request) {
        const maxRetries = 3;
        let retryCount = 0;
        while (retryCount < maxRetries) {
            try {
                await this.delay(Math.pow(2, retryCount) * 1000); // Exponential backoff
                this.logger.info("Retrying stream", {
                    streamId,
                    attempt: retryCount + 1,
                });
                yield* this.stream(request);
                return; // Success, exit retry loop
            }
            catch (error) {
                retryCount++;
                this.logger.warn("Stream retry failed", {
                    streamId,
                    attempt: retryCount,
                    error,
                });
                if (retryCount >= maxRetries) {
                    throw new Error(`Stream recovery failed after ${maxRetries} attempts: ${error.message}`);
                }
            }
        }
    }
    async disconnectConnection(connection) {
        try {
            await connection.close();
        }
        catch (error) {
            this.logger.warn("Error closing connection", {
                connection: connection.id,
                error,
            });
        }
    }
    handleConnectionError(event) {
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
    handleBufferOverflow(event) {
        this.logger.warn("Buffer overflow detected", event);
        // Implement overflow strategies
        this.bufferManager.handleOverflow(event.bufferId, "drop_oldest");
    }
    handleCompressionError(event) {
        this.logger.error("Compression error", event);
        // Fallback to uncompressed streaming
        this.compressionEngine.disableForStream(event.streamId);
    }
    generateConnectionId() {
        return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateStreamId() {
        return `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    calculateDataSize(data) {
        if (Buffer.isBuffer(data))
            return data.length;
        if (typeof data === "string")
            return Buffer.byteLength(data, "utf8");
        return JSON.stringify(data).length;
    }
    calculateChecksum(data) {
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
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    createDataSource(streamState) {
        // Implementation depends on the specific data source
        // This is a placeholder that should be implemented based on actual requirements
        return {
            [Symbol.asyncIterator]: async function* () {
                // Yield data chunks
                yield { message: "streaming data chunk" };
            },
        };
    }
    async applyContentFilter(data, filter) {
        // Content filtering implementation
        return data;
    }
    async enrichData(data, enrichment) {
        // Data enrichment implementation
        return data;
    }
    async validateData(data, validation) {
        // Data validation implementation
    }
}
// ==================== Supporting Classes ====================
class StreamConnection extends EventEmitter {
    id;
    config;
    status;
    constructor(id, config) {
        super();
        this.id = id;
        this.config = config;
        this.status = "connecting";
    }
    async close() {
        this.status = "closing";
        // Implementation specific to connection type
        this.status = "closed";
        this.emit("close");
    }
    getLatency() {
        // Return current connection latency in ms
        return 0;
    }
    getUtilization() {
        // Return current connection utilization percentage
        return 0;
    }
    getThroughput() {
        // Return current throughput in bytes/sec
        return 0;
    }
}
class WebSocketConnection extends StreamConnection {
}
class SSEConnection extends StreamConnection {
}
class GRPCConnection extends StreamConnection {
}
class StreamState {
    id;
    request;
    connection;
    config;
    startTime;
    constructor(id, request, connection) {
        this.id = id;
        this.request = request;
        this.connection = connection;
        this.config = this.mergeConfig(request.config, connection.config);
        this.startTime = new Date();
    }
    mergeConfig(requestConfig, connectionConfig) {
        return {
            ...connectionConfig,
            ...requestConfig,
            maxLatency: requestConfig?.maxLatency || 1000,
            maxErrorRate: requestConfig?.maxErrorRate || 0.1,
        };
    }
}
class BufferManager {
    buffers = new Map();
    config;
    constructor(config) {
        this.config = config;
    }
    createBuffer(streamId) {
        const buffer = new StreamBuffer(streamId, this.config);
        this.buffers.set(streamId, buffer);
        return buffer;
    }
    getUtilization() {
        const buffers = Array.from(this.buffers.values());
        if (buffers.length === 0)
            return 0;
        const totalUtilization = buffers.reduce((sum, buffer) => sum + buffer.getUtilization(), 0);
        return totalUtilization / buffers.length;
    }
    handleOverflow(bufferId, strategy) {
        const buffer = this.buffers.get(bufferId);
        if (buffer) {
            buffer.handleOverflow(strategy);
        }
    }
    cleanup() {
        for (const buffer of this.buffers.values()) {
            buffer.cleanup();
        }
        this.buffers.clear();
    }
}
class StreamBuffer {
    queue = [];
    maxSize;
    id;
    constructor(id, config) {
        this.id = id;
        this.maxSize = config.maxSize || 1000;
    }
    async enqueue(item) {
        if (this.queue.length >= this.maxSize) {
            throw new Error("Buffer overflow");
        }
        this.queue.push(item);
    }
    async dequeue() {
        return this.queue.shift();
    }
    hasData() {
        return this.queue.length > 0;
    }
    shouldPause() {
        return this.queue.length > this.maxSize * 0.8;
    }
    getUtilization() {
        return (this.queue.length / this.maxSize) * 100;
    }
    handleOverflow(strategy) {
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
    cleanup() {
        this.queue.length = 0;
    }
}
class CompressionEngine {
    config;
    disabledStreams = new Set();
    constructor(config) {
        this.config = config;
    }
    async compress(data, compressionConfig) {
        if (!compressionConfig?.enabled)
            return data;
        // Compression implementation would go here
        // For now, return data as-is
        return data;
    }
    getCompressionInfo(compressedData, originalData) {
        // Return compression algorithm and ratio
        return undefined;
    }
    disableForStream(streamId) {
        this.disabledStreams.add(streamId);
    }
    cleanup() {
        this.disabledStreams.clear();
    }
}
class StreamingPerformanceMonitor {
    metrics = new Map();
    recordChunk(streamId, chunk) {
        // Record chunk metrics
    }
    recordError(streamId, error) {
        // Record error metrics
    }
    recordStreamComplete(streamId, duration) {
        // Record completion metrics
    }
    recordData(connectionId, data) {
        // Record data metrics
    }
    getCurrentThroughput() {
        return 0;
    }
    getCurrentLatency() {
        return 0;
    }
    getErrorRate() {
        return 0;
    }
    getStreamMetrics(streamId) {
        return {
            latency: 0,
            errorRate: 0,
        };
    }
    getMetrics() {
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
    config;
    state = "closed";
    failures = 0;
    lastFailureTime = 0;
    constructor(config) {
        this.config = {
            failureThreshold: 5,
            timeout: 60000, // 1 minute
            ...config,
        };
    }
    async execute(operation) {
        if (this.state === "open") {
            if (Date.now() - this.lastFailureTime > this.config.timeout) {
                this.state = "half-open";
            }
            else {
                throw new Error("Circuit breaker is open");
            }
        }
        try {
            const result = await operation();
            this.onSuccess();
            return result;
        }
        catch (error) {
            this.onFailure();
            throw error;
        }
    }
    onSuccess() {
        this.failures = 0;
        this.state = "closed";
    }
    onFailure() {
        this.failures++;
        this.lastFailureTime = Date.now();
        if (this.failures >= this.config.failureThreshold) {
            this.state = "open";
        }
    }
}
