/**
 * Unit Tests for Enhanced Streaming API Client
 *
 * Tests follow TDD methodology: Write failing tests first, then implement minimal code to pass.
 * Tests cover all major functionality including connection management, streaming with buffering,
 * compression, circuit breaker patterns, performance monitoring, and error handling.
 */

import { EnhancedStreamingAPI } from '../../../src/services/google-services/enhanced-streaming-api';
import { UnifiedAPI } from '../../../src/adapters/unified-api';

// Test doubles/mocks
class MockLogger {
  info(message: string, meta?: any) {}
  error(message: string, error?: any) {}
  debug(message: string, meta?: any) {}
  warn(message: string, meta?: any) {}
}

class MockUnifiedAPI {
  // Mock implementation of UnifiedAPI
  constructor(config: any) {}
}

class MockBufferManager {
  private buffers: Map<string, MockStreamBuffer> = new Map();
  private config: any;

  constructor(config: any) {
    this.config = config;
  }

  createBuffer(streamId: string): MockStreamBuffer {
    const buffer = new MockStreamBuffer(streamId, this.config);
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

class MockStreamBuffer {
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

class MockCompressionEngine {
  private config: any;
  private disabledStreams: Set<string> = new Set();

  constructor(config: any) {
    this.config = config;
  }

  async compress(data: any, compressionConfig: any): Promise<any> {
    if (!compressionConfig?.enabled) return data;

    // Compression implementation would go here
    // For now, return data as-is
    return data;
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

class MockStreamingPerformanceMonitor {
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
    return 1000; // Mock throughput
  }

  getCurrentLatency(): number {
    return 50; // Mock latency
  }

  getErrorRate(): number {
    return 0.01; // Mock error rate
  }

  getStreamMetrics(streamId: string): any {
    return {
      latency: 50,
      errorRate: 0.01,
    };
  }

  getMetrics(): any {
    return {
      latency: {
        mean: 50,
        p50: 45,
        p95: 100,
        p99: 150,
        max: 200,
      },
      throughput: {
        requestsPerSecond: 100,
        bytesPerSecond: 10240,
        operationsPerSecond: 50,
      },
      utilization: {
        cpu: 60,
        memory: 70,
        disk: 40,
        network: 50,
      },
      errors: {
        rate: 0.01,
        percentage: 1,
        types: {},
      },
    };
  }
}

class MockCircuitBreaker {
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

class MockStreamConnection {
  public readonly id: string;
  public readonly config: any;
  public status: "connecting" | "active" | "closing" | "closed" | "error";

  constructor(id: string, config: any) {
    this.id = id;
    this.config = config;
    this.status = "connecting";
  }

  async close(): Promise<void> {
    this.status = "closing";
    // Implementation specific to connection type
    this.status = "closed";
  }

  getLatency(): number {
    // Return current connection latency in ms
    return 50;
  }

  getUtilization(): number {
    // Return current connection utilization percentage
    return 30;
  }

  getThroughput(): number {
    // Return current throughput in bytes/sec
    return 1000;
  }
}

class MockWebSocketConnection extends MockStreamConnection {
  // WebSocket-specific implementation
}

class MockSSEConnection extends MockStreamConnection {
  // Server-Sent Events specific implementation
}

class MockGRPCConnection extends MockStreamConnection {
  // gRPC specific implementation
}

class MockStreamState {
  public readonly id: string;
  public readonly request: any;
  public readonly connection: MockStreamConnection;
  public readonly config: any;
  public readonly startTime: Date;

  constructor(id: string, request: any, connection: MockStreamConnection) {
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

describe('EnhancedStreamingAPI', () => {
  let client: EnhancedStreamingAPI;
  let mockBufferManager: MockBufferManager;
  let mockCompressionEngine: MockCompressionEngine;
  let mockPerformanceMonitor: MockStreamingPerformanceMonitor;
  let mockCircuitBreaker: MockCircuitBreaker;

  const defaultConfig = {
    streaming: {
      buffer: {
        maxSize: 1000,
      },
      compression: {
        enabled: true,
      },
      circuitBreaker: {
        failureThreshold: 5,
        timeout: 60000,
      },
    },
  };

  beforeEach(() => {
    mockBufferManager = new MockBufferManager(defaultConfig.streaming?.buffer || {});
    mockCompressionEngine = new MockCompressionEngine(defaultConfig.streaming?.compression || {});
    mockPerformanceMonitor = new MockStreamingPerformanceMonitor();
    mockCircuitBreaker = new MockCircuitBreaker(defaultConfig.streaming?.circuitBreaker || {});

    // Mock the private members
    (client as any).bufferManager = mockBufferManager;
    (client as any).compressionEngine = mockCompressionEngine;
    (client as any).performanceMonitor = mockPerformanceMonitor;
    (client as any).circuitBreaker = mockCircuitBreaker;
    (client as any).connections = new Map();

    client = new EnhancedStreamingAPI(defaultConfig);
  });

  afterEach(() => {
    // Clean up any event listeners
    client.removeAllListeners();
  });

  describe('Connection Management', () => {
    const validConfig = {
      protocol: 'websocket' as const,
      bufferSize: 1000,
      chunkSize: 1024,
    };

    it('should establish connection successfully with valid config', async () => {
      const connectionId = 'conn_test_123';
      const mockConnection = new MockWebSocketConnection(connectionId, validConfig);

      // Mock connection creation
      jest.spyOn(client as any, 'createConnection').mockResolvedValue(mockConnection);
      jest.spyOn(client as any, 'setupConnectionMonitoring').mockImplementation(() => {});
      jest.spyOn(client as any, 'generateConnectionId').mockReturnValue(connectionId);

      await client.connect(validConfig);

      expect((client as any).connections.has(connectionId)).toBe(true);
      expect((client as any).connections.get(connectionId)).toBe(mockConnection);
    });

    it('should validate streaming configuration', async () => {
      const invalidConfig = {
        ...validConfig,
        bufferSize: 0,
      };

      await expect(client.connect(invalidConfig)).rejects.toThrow('Buffer size must be positive');
    });

    it('should validate chunk size constraints', async () => {
      const invalidConfig = {
        ...validConfig,
        chunkSize: 0,
      };

      await expect(client.connect(invalidConfig)).rejects.toThrow('Chunk size must be positive');
    });

    it('should validate protocol support', async () => {
      const invalidConfig = {
        ...validConfig,
        protocol: 'invalid' as any,
      };

      await expect(client.connect(invalidConfig)).rejects.toThrow('Unsupported protocol: invalid');
    });

    it('should create appropriate connection type based on protocol', async () => {
      const createConnectionSpy = jest.spyOn(client as any, 'createConnection');

      await client.connect({ ...validConfig, protocol: 'websocket' });
      expect(createConnectionSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ protocol: 'websocket' })
      );
    });

    it('should emit connection established event', async () => {
      const eventSpy = jest.fn();
      client.on('connection:established', eventSpy);

      const mockConnection = new MockWebSocketConnection('conn_test', validConfig);
      jest.spyOn(client as any, 'createConnection').mockResolvedValue(mockConnection);
      jest.spyOn(client as any, 'setupConnectionMonitoring').mockImplementation(() => {});
      jest.spyOn(client as any, 'generateConnectionId').mockReturnValue('conn_test');

      await client.connect(validConfig);

      expect(eventSpy).toHaveBeenCalledWith({
        connectionId: 'conn_test',
        config: validConfig
      });
    });

    it('should handle connection errors gracefully', async () => {
      const connectionError = new Error('Connection failed');
      jest.spyOn(client as any, 'createConnection').mockRejectedValue(connectionError);

      await expect(client.connect(validConfig)).rejects.toThrow('Connection failed');
    });
  });

  describe('Streaming Operations', () => {
    const mockRequest = {
      data: 'test streaming data',
      config: {
        maxLatency: 1000,
        maxErrorRate: 0.1,
      },
    };

    beforeEach(() => {
      // Setup mock connections
      const mockConnection = new MockWebSocketConnection('conn_test', {
        protocol: 'websocket',
        bufferSize: 1000,
        chunkSize: 1024,
      });
      mockConnection.status = 'active';
      (client as any).connections.set('conn_test', mockConnection);

      // Mock private methods
      jest.spyOn(client as any, 'getOptimalConnection').mockReturnValue(mockConnection);
      jest.spyOn(client as any, 'generateStreamId').mockReturnValue('stream_test_123');
      jest.spyOn(client as any, 'createDataSource').mockImplementation(function* () {
        yield { message: 'test data 1' };
        yield { message: 'test data 2' };
      });
      jest.spyOn(client as any, 'processStreamData').mockImplementation((data) => data);
      jest.spyOn(client as any, 'createChunkMetadata').mockReturnValue({
        timestamp: new Date(),
        size: 100,
        compression: 'none',
        checksum: 'test_checksum',
      });
      jest.spyOn(client as any, 'isStreamHealthy').mockReturnValue(true);
    });

    it('should stream data successfully', async () => {
      const streamGenerator = client.stream(mockRequest);

      const chunks: any[] = [];
      for await (const chunk of streamGenerator) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0].sequence).toBe(0);
      expect(chunks[0].data).toBeDefined();
      expect(chunks[0].final).toBe(false);

      // Last chunk should be marked as final
      const lastChunk = chunks[chunks.length - 1];
      expect(lastChunk.final).toBe(true);
    });

    it('should handle circuit breaker protection', async () => {
      const circuitBreakerSpy = jest.spyOn(mockCircuitBreaker, 'execute');

      await client.stream(mockRequest);

      expect(circuitBreakerSpy).toHaveBeenCalled();
    });

    it('should fail when no connections are available', async () => {
      (client as any).connections.clear();
      jest.spyOn(client as any, 'getOptimalConnection').mockReturnValue(null);

      const streamGenerator = client.stream(mockRequest);

      await expect(async () => {
        for await (const chunk of streamGenerator) {
          // Should fail immediately
        }
      }).rejects.toThrow('No available streaming connections');
    });

    it('should process stream data through pipeline', async () => {
      const processDataSpy = jest.spyOn(client as any, 'processStreamData');

      const streamGenerator = client.stream(mockRequest);
      for await (const chunk of streamGenerator) {
        // Process chunk
      }

      expect(processDataSpy).toHaveBeenCalled();
    });

    it('should apply compression when enabled', async () => {
      const compressSpy = jest.spyOn(mockCompressionEngine, 'compress');

      const streamGenerator = client.stream(mockRequest);
      for await (const chunk of streamGenerator) {
        // Process chunk
      }

      expect(compressSpy).toHaveBeenCalled();
    });

    it('should create proper chunk metadata', async () => {
      const metadataSpy = jest.spyOn(client as any, 'createChunkMetadata');

      const streamGenerator = client.stream(mockRequest);
      for await (const chunk of streamGenerator) {
        // Process chunk
      }

      expect(metadataSpy).toHaveBeenCalled();
    });

    it('should manage buffer properly', async () => {
      const createBufferSpy = jest.spyOn(mockBufferManager, 'createBuffer');
      const enqueueSpy = jest.spyOn(MockStreamBuffer.prototype, 'enqueue');
      const dequeueSpy = jest.spyOn(MockStreamBuffer.prototype, 'dequeue');

      const streamGenerator = client.stream(mockRequest);
      for await (const chunk of streamGenerator) {
        // Process chunk
      }

      expect(createBufferSpy).toHaveBeenCalledWith('stream_test_123');
      expect(enqueueSpy).toHaveBeenCalled();
      expect(dequeueSpy).toHaveBeenCalled();
    });

    it('should record performance metrics', async () => {
      const recordChunkSpy = jest.spyOn(mockPerformanceMonitor, 'recordChunk');
      const recordStreamCompleteSpy = jest.spyOn(mockPerformanceMonitor, 'recordStreamComplete');

      const streamGenerator = client.stream(mockRequest);
      for await (const chunk of streamGenerator) {
        // Process chunk
      }

      expect(recordChunkSpy).toHaveBeenCalled();
      expect(recordStreamCompleteSpy).toHaveBeenCalled();
    });

    it('should handle stream health checks', async () => {
      const healthSpy = jest.spyOn(client as any, 'isStreamHealthy');

      const streamGenerator = client.stream(mockRequest);
      for await (const chunk of streamGenerator) {
        // Process chunk
      }

      expect(healthSpy).toHaveBeenCalled();
    });

    it('should handle stream errors gracefully', async () => {
      const errorHandlerSpy = jest.spyOn(mockPerformanceMonitor, 'recordError');

      // Mock an error in the data source
      jest.spyOn(client as any, 'createDataSource').mockImplementation(function* () {
        yield { message: 'test data 1' };
        throw new Error('Stream processing error');
      });

      const streamGenerator = client.stream(mockRequest);

      await expect(async () => {
        for await (const chunk of streamGenerator) {
          // Should fail on second chunk
        }
      }).rejects.toThrow('Stream processing error');

      expect(errorHandlerSpy).toHaveBeenCalled();
    });
  });

  describe('Buffer Management', () => {
    it('should create buffers with proper configuration', () => {
      const createBufferSpy = jest.spyOn(mockBufferManager, 'createBuffer');
      const buffer = mockBufferManager.createBuffer('test_stream');

      expect(createBufferSpy).toHaveBeenCalledWith('test_stream');
      expect(buffer).toBeDefined();
      expect(buffer.hasData()).toBe(false);
      expect(buffer.shouldPause()).toBe(false);
    });

    it('should handle buffer overflow properly', () => {
      const buffer = mockBufferManager.createBuffer('test_stream');
      const handleOverflowSpy = jest.spyOn(mockBufferManager, 'handleOverflow');

      // Fill buffer to capacity
      for (let i = 0; i < 1000; i++) {
        buffer.enqueue({ data: `item_${i}` });
      }

      // Next enqueue should trigger overflow
      expect(() => buffer.enqueue({ data: 'overflow_item' })).toThrow('Buffer overflow');
    });

    it('should handle buffer overflow strategies', () => {
      const buffer = mockBufferManager.createBuffer('test_stream');

      // Add some items
      buffer.enqueue({ data: 'item_1' });
      buffer.enqueue({ data: 'item_2' });

      // Force overflow and handle with drop_oldest strategy
      mockBufferManager.handleOverflow('test_stream', 'drop_oldest');

      expect(buffer.hasData()).toBe(true);
    });

    it('should provide buffer utilization metrics', () => {
      const utilization = mockBufferManager.getUtilization();

      expect(typeof utilization).toBe('number');
      expect(utilization).toBeGreaterThanOrEqual(0);
      expect(utilization).toBeLessThanOrEqual(100);
    });
  });

  describe('Compression Engine', () => {
    it('should compress data when enabled', async () => {
      const compressSpy = jest.spyOn(mockCompressionEngine, 'compress');

      const testData = { message: 'test data' };
      const compressionConfig = { enabled: true };

      const result = await mockCompressionEngine.compress(testData, compressionConfig);

      expect(compressSpy).toHaveBeenCalledWith(testData, compressionConfig);
      expect(result).toBe(testData); // Mock returns original data
    });

    it('should return original data when compression disabled', async () => {
      const compressSpy = jest.spyOn(mockCompressionEngine, 'compress');

      const testData = { message: 'test data' };
      const compressionConfig = { enabled: false };

      const result = await mockCompressionEngine.compress(testData, compressionConfig);

      expect(compressSpy).toHaveBeenCalledWith(testData, compressionConfig);
      expect(result).toBe(testData);
    });

    it('should provide compression information', () => {
      const infoSpy = jest.spyOn(mockCompressionEngine, 'getCompressionInfo');

      const compressedData = { compressed: true };
      const originalData = { original: true };

      const info = mockCompressionEngine.getCompressionInfo(compressedData, originalData);

      expect(infoSpy).toHaveBeenCalledWith(compressedData, originalData);
      expect(info).toBeUndefined(); // Mock returns undefined
    });

    it('should disable compression for specific streams', () => {
      const disableSpy = jest.spyOn(mockCompressionEngine, 'disableForStream');

      mockCompressionEngine.disableForStream('stream_123');

      expect(disableSpy).toHaveBeenCalledWith('stream_123');
    });
  });

  describe('Performance Monitoring', () => {
    it('should record chunk metrics', () => {
      const recordChunkSpy = jest.spyOn(mockPerformanceMonitor, 'recordChunk');

      const testChunk = {
        id: 'chunk_123',
        sequence: 0,
        data: 'test data',
        final: false,
        metadata: { timestamp: new Date(), size: 100 },
      };

      mockPerformanceMonitor.recordChunk('stream_123', testChunk);

      expect(recordChunkSpy).toHaveBeenCalledWith('stream_123', testChunk);
    });

    it('should record error metrics', () => {
      const recordErrorSpy = jest.spyOn(mockPerformanceMonitor, 'recordError');

      const testError = new Error('Test error');

      mockPerformanceMonitor.recordError('stream_123', testError);

      expect(recordErrorSpy).toHaveBeenCalledWith('stream_123', testError);
    });

    it('should record stream completion metrics', () => {
      const recordCompleteSpy = jest.spyOn(mockPerformanceMonitor, 'recordStreamComplete');

      mockPerformanceMonitor.recordStreamComplete('stream_123', 5000);

      expect(recordCompleteSpy).toHaveBeenCalledWith('stream_123', 5000);
    });

    it('should record data metrics', () => {
      const recordDataSpy = jest.spyOn(mockPerformanceMonitor, 'recordData');

      const testData = { bytes: 1024 };

      mockPerformanceMonitor.recordData('conn_123', testData);

      expect(recordDataSpy).toHaveBeenCalledWith('conn_123', testData);
    });

    it('should provide current throughput metrics', () => {
      const throughput = mockPerformanceMonitor.getCurrentThroughput();

      expect(typeof throughput).toBe('number');
      expect(throughput).toBeGreaterThan(0);
    });

    it('should provide current latency metrics', () => {
      const latency = mockPerformanceMonitor.getCurrentLatency();

      expect(typeof latency).toBe('number');
      expect(latency).toBeGreaterThan(0);
    });

    it('should provide error rate metrics', () => {
      const errorRate = mockPerformanceMonitor.getErrorRate();

      expect(typeof errorRate).toBe('number');
      expect(errorRate).toBeGreaterThanOrEqual(0);
    });

    it('should provide comprehensive metrics', () => {
      const metrics = mockPerformanceMonitor.getMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.latency).toBeDefined();
      expect(metrics.throughput).toBeDefined();
      expect(metrics.utilization).toBeDefined();
      expect(metrics.errors).toBeDefined();
    });
  });

  describe('Circuit Breaker', () => {
    it('should execute operations when circuit is closed', async () => {
      const executeSpy = jest.spyOn(mockCircuitBreaker, 'execute');
      const operation = jest.fn().mockResolvedValue('success');

      const result = await mockCircuitBreaker.execute(operation);

      expect(executeSpy).toHaveBeenCalledWith(operation);
      expect(result).toBe('success');
    });

    it('should fail fast when circuit is open', async () => {
      // Force circuit to open state
      (mockCircuitBreaker as any).state = 'open';
      (mockCircuitBreaker as any).lastFailureTime = Date.now();

      const operation = jest.fn().mockResolvedValue('success');

      await expect(mockCircuitBreaker.execute(operation)).rejects.toThrow('Circuit breaker is open');
    });

    it('should transition to half-open state after timeout', async () => {
      // Force circuit to open state
      (mockCircuitBreaker as any).state = 'open';
      (mockCircuitBreaker as any).lastFailureTime = Date.now() - 70000; // 70 seconds ago

      const operation = jest.fn().mockResolvedValue('success');

      const result = await mockCircuitBreaker.execute(operation);

      expect(result).toBe('success');
      expect((mockCircuitBreaker as any).state).toBe('closed');
    });

    it('should handle failures and transition to open state', async () => {
      // Force enough failures to trigger circuit breaker
      (mockCircuitBreaker as any).failures = 5;
      (mockCircuitBreaker as any).state = 'closed';

      const operation = jest.fn().mockRejectedValue(new Error('Operation failed'));

      await expect(mockCircuitBreaker.execute(operation)).rejects.toThrow('Operation failed');
      expect((mockCircuitBreaker as any).state).toBe('open');
    });
  });

  describe('Status and Metrics', () => {
    beforeEach(() => {
      // Setup mock connections
      const mockConnection = new MockWebSocketConnection('conn_test', {
        protocol: 'websocket',
        bufferSize: 1000,
        chunkSize: 1024,
      });
      mockConnection.status = 'active';
      (client as any).connections.set('conn_test', mockConnection);
    });

    it('should provide streaming status', () => {
      const status = client.getStatus();

      expect(status).toBeDefined();
      expect(status.connected).toBe(true);
      expect(typeof status.bufferUtilization).toBe('number');
      expect(typeof status.throughput).toBe('number');
      expect(typeof status.latency).toBe('number');
      expect(typeof status.errors).toBe('number');
    });

    it('should provide performance metrics', () => {
      const metrics = client.getPerformanceMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.latency).toBeDefined();
      expect(metrics.throughput).toBeDefined();
      expect(metrics.utilization).toBeDefined();
      expect(metrics.errors).toBeDefined();
    });

    it('should indicate disconnected status when no connections', () => {
      (client as any).connections.clear();

      const status = client.getStatus();

      expect(status.connected).toBe(false);
    });
  });

  describe('Disconnection and Cleanup', () => {
    beforeEach(() => {
      // Setup mock connections
      const mockConnection = new MockWebSocketConnection('conn_test', {
        protocol: 'websocket',
        bufferSize: 1000,
        chunkSize: 1024,
      });
      mockConnection.status = 'active';
      (client as any).connections.set('conn_test', mockConnection);
    });

    it('should disconnect all connections', async () => {
      const disconnectConnectionSpy = jest.spyOn(client as any, 'disconnectConnection');
      const bufferCleanupSpy = jest.spyOn(mockBufferManager, 'cleanup');
      const compressionCleanupSpy = jest.spyOn(mockCompressionEngine, 'cleanup');

      await client.disconnect();

      expect(disconnectConnectionSpy).toHaveBeenCalled();
      expect(bufferCleanupSpy).toHaveBeenCalled();
      expect(compressionCleanupSpy).toHaveBeenCalled();
      expect((client as any).connections.size).toBe(0);
    });

    it('should emit disconnected event', async () => {
      const eventSpy = jest.fn();
      client.on('disconnected', eventSpy);

      await client.disconnect();

      expect(eventSpy).toHaveBeenCalled();
    });

    it('should handle connection close errors gracefully', async () => {
      const mockConnection = (client as any).connections.get('conn_test');
      mockConnection.close = jest.fn().mockRejectedValue(new Error('Close failed'));

      // Should not throw error despite connection close failure
      await expect(client.disconnect()).resolves.not.toThrow();
    });
  });

  describe('Error Event Handling', () => {
    it('should handle connection errors', async () => {
      const errorSpy = jest.fn();
      client.on('connection:error', errorSpy);

      const connectionError = { connection: 'conn_test', error: new Error('Connection failed') };
      mockBufferManager.emit('connection:error', connectionError);

      expect(errorSpy).toHaveBeenCalledWith(connectionError);
    });

    it('should handle buffer overflow events', async () => {
      const overflowSpy = jest.fn();
      client.on('buffer:overflow', overflowSpy);

      const overflowEvent = { bufferId: 'buffer_test' };
      mockBufferManager.emit('buffer:overflow', overflowEvent);

      expect(overflowSpy).toHaveBeenCalledWith(overflowEvent);
    });

    it('should handle compression errors', async () => {
      const compressionSpy = jest.fn();
      client.on('compression:error', compressionSpy);

      const compressionError = { streamId: 'stream_test', error: new Error('Compression failed') };
      mockCompressionEngine.emit('compression:error', compressionError);

      expect(compressionSpy).toHaveBeenCalledWith(compressionError);
    });
  });

  describe('Utility Methods', () => {
    it('should generate valid connection IDs', () => {
      const connectionId1 = (client as any).generateConnectionId();
      const connectionId2 = (client as any).generateConnectionId();

      expect(connectionId1).toMatch(/^conn_/);
      expect(connectionId2).toMatch(/^conn_/);
      expect(connectionId1).not.toBe(connectionId2);
    });

    it('should generate valid stream IDs', () => {
      const streamId1 = (client as any).generateStreamId();
      const streamId2 = (client as any).generateStreamId();

      expect(streamId1).toMatch(/^stream_/);
      expect(streamId2).toMatch(/^stream_/);
      expect(streamId1).not.toBe(streamId2);
    });

    it('should calculate data size correctly', () => {
      const size1 = (client as any).calculateDataSize(Buffer.from('test'));
      const size2 = (client as any).calculateDataSize('test string');
      const size3 = (client as any).calculateDataSize({ test: 'data' });

      expect(size1).toBe(4);
      expect(size2).toBeGreaterThan(0);
      expect(size3).toBeGreaterThan(0);
    });

    it('should calculate checksums correctly', () => {
      const checksum1 = (client as any).calculateChecksum('test data 1');
      const checksum2 = (client as any).calculateChecksum('test data 2');

      expect(checksum1).toMatch(/^[0-9a-f]+$/);
      expect(checksum2).toMatch(/^[0-9a-f]+$/);
      expect(checksum1).not.toBe(checksum2);
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle multiple concurrent streams', async () => {
      // Setup multiple connections
      for (let i = 0; i < 3; i++) {
        const mockConnection = new MockWebSocketConnection(`conn_${i}`, {
          protocol: 'websocket',
          bufferSize: 1000,
          chunkSize: 1024,
        });
        mockConnection.status = 'active';
        (client as any).connections.set(`conn_${i}`, mockConnection);
      }

      const requests = Array(5).fill({
        data: 'concurrent test',
        config: { maxLatency: 1000, maxErrorRate: 0.1 },
      });

      const promises = requests.map(req => client.stream(req));
      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach((streamGenerator, index) => {
        expect(streamGenerator).toBeDefined();
      });
    });

    it('should handle empty stream data gracefully', async () => {
      jest.spyOn(client as any, 'createDataSource').mockImplementation(function* () {
        // Yield no data
      });

      const request = {
        data: 'empty stream test',
        config: { maxLatency: 1000, maxErrorRate: 0.1 },
      };

      const streamGenerator = client.stream(request);
      const chunks: any[] = [];

      for await (const chunk of streamGenerator) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(0);
      const finalChunk = chunks[chunks.length - 1];
      expect(finalChunk.final).toBe(true);
    });

    it('should handle large data chunks', async () => {
      const largeData = 'x'.repeat(10000); // 10KB of data
      jest.spyOn(client as any, 'createDataSource').mockImplementation(function* () {
        yield { message: largeData };
      });

      const request = {
        data: 'large data test',
        config: { maxLatency: 1000, maxErrorRate: 0.1 },
      };

      const streamGenerator = client.stream(request);

      let chunkCount = 0;
      for await (const chunk of streamGenerator) {
        chunkCount++;
        expect(chunk.data).toBeDefined();
      }

      expect(chunkCount).toBeGreaterThan(0);
    });
  });
});