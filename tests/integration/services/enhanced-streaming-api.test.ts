/**
 * Integration Tests for Enhanced Streaming API Client
 *
 * Tests the integration between streaming components, dependencies, and external systems.
 * Validates component collaboration, event handling, and system behavior under various conditions.
 */

import { EventEmitter } from "events";
import { EnhancedStreamingAPI } from "../../../src/services/google-services/enhanced-streaming-api.js";
import { Logger } from "../../../src/utils/logger.js";
import { UnifiedAPI } from "../../../src/adapters/unified-api.js";

// Mock dependencies
jest.mock("../../../src/utils/logger.js");
jest.mock("../../../src/adapters/unified-api.js");

describe("EnhancedStreamingAPI Integration", () => {
  let streamingAPI: EnhancedStreamingAPI;
  let mockLogger: jest.Mocked<Logger>;
  let mockUnifiedAPI: jest.Mocked<UnifiedAPI>;
  let mockConfig: any;

  beforeEach(() => {
    // Setup mocks
    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
    } as any;

    mockUnifiedAPI = {
      emit: jest.fn(),
      on: jest.fn(),
    } as any;

    (Logger as jest.Mock).mockImplementation(() => mockLogger);
    (UnifiedAPI as jest.Mock).mockImplementation(() => mockUnifiedAPI);

    mockConfig = {
      streaming: {
        buffer: {
          maxSize: 1000,
          overflowStrategy: "drop_oldest",
        },
        compression: {
          enabled: true,
          algorithm: "gzip",
        },
        circuitBreaker: {
          failureThreshold: 5,
          timeout: 60000,
        },
      },
    };

    streamingAPI = new EnhancedStreamingAPI(mockConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Client Initialization Integration", () => {
    test("should successfully initialize with all dependencies", () => {
      // Given
      const config = {
        streaming: {
          buffer: { maxSize: 100 },
          compression: { enabled: true },
          circuitBreaker: { failureThreshold: 3 },
        },
      };

      // When
      const client = new EnhancedStreamingAPI(config);

      // Then
      expect(Logger).toHaveBeenCalledWith("EnhancedStreamingAPI");
      expect(UnifiedAPI).toHaveBeenCalledWith(config);
      expect(client).toBeInstanceOf(EnhancedStreamingAPI);
      expect(mockLogger.info).toHaveBeenCalledWith(
        "EnhancedStreamingAPI initialized with configuration",
        expect.any(Object),
      );
    });

    test("should register event handlers during initialization", () => {
      // When
      const client = new EnhancedStreamingAPI(mockConfig);

      // Then
      expect(mockUnifiedAPI.on).toHaveBeenCalledWith(
        "connection:error",
        expect.any(Function),
      );
      expect(mockUnifiedAPI.on).toHaveBeenCalledWith(
        "buffer:overflow",
        expect.any(Function),
      );
      expect(mockUnifiedAPI.on).toHaveBeenCalledWith(
        "compression:error",
        expect.any(Function),
      );
    });

    test("should handle initialization with invalid configuration", () => {
      // Given
      const invalidConfig = {
        streaming: {
          buffer: { maxSize: 0 }, // Invalid buffer size
        },
      };

      // When/Then
      expect(() => new EnhancedStreamingAPI(invalidConfig)).toThrow();
    });
  });

  describe("Connection Management Integration", () => {
    test("should establish streaming connection with WebSocket protocol", async () => {
      // Given
      const config = {
        protocol: "websocket" as const,
        bufferSize: 1000,
        chunkSize: 64,
      };

      // Mock connection creation
      const mockConnection = {
        id: "conn_test123",
        status: "connecting" as const,
        on: jest.fn(),
        emit: jest.fn(),
        close: jest.fn().mockResolvedValue(undefined),
        getLatency: jest.fn().mockReturnValue(50),
        getUtilization: jest.fn().mockReturnValue(0.1),
        getThroughput: jest.fn().mockReturnValue(1000),
      };

      jest.spyOn(streamingAPI as any, "createConnection").mockResolvedValue(mockConnection);
      jest.spyOn(streamingAPI as any, "setupConnectionMonitoring").mockImplementation(() => {});
      jest.spyOn(streamingAPI as any, "validateStreamingConfig").mockImplementation(() => {});

      // When
      await streamingAPI.connect(config);

      // Then
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Establishing streaming connection",
        {
          connectionId: expect.stringMatching(/^conn_/),
          protocol: "websocket",
        },
      );
      expect(mockUnifiedAPI.emit).toHaveBeenCalledWith(
        "connection:established",
        {
          connectionId: expect.stringMatching(/^conn_/),
          config,
        },
      );
    });

    test("should handle connection establishment failure", async () => {
      // Given
      const config = {
        protocol: "websocket" as const,
        bufferSize: 1000,
        chunkSize: 64,
      };

      const connectionError = new Error("Connection timeout");
      jest.spyOn(streamingAPI as any, "validateStreamingConfig").mockImplementation(() => {
        throw connectionError;
      });

      // When/Then
      await expect(streamingAPI.connect(config)).rejects.toThrow(
        `Connection failed: ${connectionError.message}`,
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Failed to establish streaming connection",
        connectionError,
      );
    });

    test("should establish connection with SSE protocol", async () => {
      // Given
      const config = {
        protocol: "sse" as const,
        bufferSize: 1000,
        chunkSize: 64,
      };

      const mockConnection = {
        id: "conn_sse123",
        status: "connecting" as const,
        on: jest.fn(),
        emit: jest.fn(),
        close: jest.fn().mockResolvedValue(undefined),
        getLatency: jest.fn().mockReturnValue(30),
        getUtilization: jest.fn().mockReturnValue(0.05),
        getThroughput: jest.fn().mockReturnValue(500),
      };

      jest.spyOn(streamingAPI as any, "createConnection").mockResolvedValue(mockConnection);
      jest.spyOn(streamingAPI as any, "setupConnectionMonitoring").mockImplementation(() => {});
      jest.spyOn(streamingAPI as any, "validateStreamingConfig").mockImplementation(() => {});

      // When
      await streamingAPI.connect(config);

      // Then
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Establishing streaming connection",
        expect.objectContaining({
          protocol: "sse",
        }),
      );
    });

    test("should establish connection with gRPC protocol", async () => {
      // Given
      const config = {
        protocol: "grpc" as const,
        bufferSize: 1000,
        chunkSize: 64,
      };

      const mockConnection = {
        id: "conn_grpc123",
        status: "connecting" as const,
        on: jest.fn(),
        emit: jest.fn(),
        close: jest.fn().mockResolvedValue(undefined),
        getLatency: jest.fn().mockReturnValue(20),
        getUtilization: jest.fn().mockReturnValue(0.02),
        getThroughput: jest.fn().mockReturnValue(2000),
      };

      jest.spyOn(streamingAPI as any, "createConnection").mockResolvedValue(mockConnection);
      jest.spyOn(streamingAPI as any, "setupConnectionMonitoring").mockImplementation(() => {});
      jest.spyOn(streamingAPI as any, "validateStreamingConfig").mockImplementation(() => {});

      // When
      await streamingAPI.connect(config);

      // Then
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Establishing streaming connection",
        expect.objectContaining({
          protocol: "grpc",
        }),
      );
    });

    test("should reject unsupported protocol", async () => {
      // Given
      const config = {
        protocol: "unsupported" as any,
        bufferSize: 1000,
        chunkSize: 64,
      };

      jest.spyOn(streamingAPI as any, "validateStreamingConfig").mockImplementation(() => {
        throw new Error("Unsupported protocol: unsupported");
      });

      // When/Then
      await expect(streamingAPI.connect(config)).rejects.toThrow(
        "Unsupported protocol: unsupported",
      );
    });

    test("should validate streaming configuration", async () => {
      // Given
      const config = {
        protocol: "websocket" as const,
        bufferSize: 0, // Invalid
        chunkSize: 64,
      };

      // When/Then
      await expect(streamingAPI.connect(config)).rejects.toThrow(
        "Buffer size must be positive",
      );
    });

    test("should validate chunk size in configuration", async () => {
      // Given
      const config = {
        protocol: "websocket" as const,
        bufferSize: 1000,
        chunkSize: 0, // Invalid
      };

      // When/Then
      await expect(streamingAPI.connect(config)).rejects.toThrow(
        "Chunk size must be positive",
      );
    });
  });

  describe("Streaming Data Processing Integration", () => {
    test("should process stream with buffer management", async () => {
      // Given
      const request = {
        config: {
          contentFilter: { type: "text" },
          enrichment: { metadata: true },
          validation: { schema: "stream" },
        },
      };

      const mockConnection = {
        id: "conn_test123",
        status: "active" as const,
        config: { compression: { enabled: true } },
      };

      const mockStreamState = {
        id: "stream_test123",
        request,
        connection: mockConnection,
        config: {
          maxLatency: 1000,
          maxErrorRate: 0.1,
          contentFilter: { type: "text" },
          enrichment: { metadata: true },
          validation: { schema: "stream" },
        },
      };

      const mockBuffer = {
        enqueue: jest.fn().mockResolvedValue(undefined),
        dequeue: jest.fn().mockResolvedValue({
          id: "chunk_1",
          sequence: 0,
          data: "processed data",
          final: false,
          metadata: expect.any(Object),
        }),
        hasData: jest.fn().mockReturnValue(true),
        shouldPause: jest.fn().mockReturnValue(false),
        cleanup: jest.fn(),
      };

      const mockCompressionEngine = {
        compress: jest.fn().mockResolvedValue("compressed data"),
        getCompressionInfo: jest.fn().mockReturnValue("gzip:0.5"),
      };

      jest.spyOn(streamingAPI as any, "getOptimalConnection").mockReturnValue(mockConnection);
      jest.spyOn(streamingAPI as any, "streamWithBuffer").mockImplementation(async function* () {
        yield {
          id: "chunk_1",
          sequence: 0,
          data: "processed data",
          final: false,
          metadata: { timestamp: new Date(), size: 100, checksum: "abc123" },
        };
      });
      jest.spyOn(streamingAPI as any, "createDataSource").mockImplementation(() => ({
        [Symbol.asyncIterator]: async function* () {
          yield { message: "test data" };
        },
      }));
      jest.spyOn(streamingAPI as any, "processStreamData").mockResolvedValue("processed data");
      jest.spyOn(streamingAPI as any, "createChunkMetadata").mockReturnValue({
        timestamp: new Date(),
        size: 100,
        compression: "gzip:0.5",
        checksum: "abc123",
      });
      jest.spyOn(streamingAPI as any, "calculateDataSize").mockReturnValue(100);
      jest.spyOn(streamingAPI as any, "calculateChecksum").mockReturnValue("abc123");
      jest.spyOn(streamingAPI as any, "isStreamHealthy").mockReturnValue(true);

      // When
      const streamGenerator = streamingAPI.stream(request);
      const chunks: any[] = [];
      for await (const chunk of streamGenerator) {
        chunks.push(chunk);
      }

      // Then
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0]).toMatchObject({
        id: expect.stringMatching(/^chunk_/),
        sequence: 0,
        data: "processed data",
        final: false,
        metadata: expect.any(Object),
      });
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Starting stream",
        expect.any(Object),
      );
    });

    test("should handle stream data processing with content filtering", async () => {
      // Given
      const request = {
        config: {
          contentFilter: { type: "text", maxLength: 100 },
        },
      };

      const mockConnection = {
        id: "conn_test123",
        status: "active" as const,
        config: { compression: { enabled: false } },
      };

      jest.spyOn(streamingAPI as any, "getOptimalConnection").mockReturnValue(mockConnection);
      jest.spyOn(streamingAPI as any, "streamWithBuffer").mockImplementation(async function* () {
        yield {
          id: "chunk_1",
          sequence: 0,
          data: "filtered data",
          final: false,
          metadata: { timestamp: new Date(), size: 50, checksum: "def456" },
        };
      });
      jest.spyOn(streamingAPI as any, "applyContentFilter").mockResolvedValue("filtered data");

      // When
      const streamGenerator = streamingAPI.stream(request);
      const chunks: any[] = [];
      for await (const chunk of streamGenerator) {
        chunks.push(chunk);
      }

      // Then
      expect(chunks.length).toBeGreaterThan(0);
      expect((streamingAPI as any).applyContentFilter).toHaveBeenCalledWith(
        expect.any(Object),
        { type: "text", maxLength: 100 },
      );
    });

    test("should handle stream data processing with enrichment", async () => {
      // Given
      const request = {
        config: {
          enrichment: { metadata: true, timestamp: true },
        },
      };

      const mockConnection = {
        id: "conn_test123",
        status: "active" as const,
        config: { compression: { enabled: false } },
      };

      jest.spyOn(streamingAPI as any, "getOptimalConnection").mockReturnValue(mockConnection);
      jest.spyOn(streamingAPI as any, "streamWithBuffer").mockImplementation(async function* () {
        yield {
          id: "chunk_1",
          sequence: 0,
          data: "enriched data",
          final: false,
          metadata: { timestamp: new Date(), size: 60, checksum: "ghi789" },
        };
      });
      jest.spyOn(streamingAPI as any, "enrichData").mockResolvedValue("enriched data");

      // When
      const streamGenerator = streamingAPI.stream(request);
      const chunks: any[] = [];
      for await (const chunk of streamGenerator) {
        chunks.push(chunk);
      }

      // Then
      expect(chunks.length).toBeGreaterThan(0);
      expect((streamingAPI as any).enrichData).toHaveBeenCalledWith(
        expect.any(Object),
        { metadata: true, timestamp: true },
      );
    });

    test("should handle stream data processing with validation", async () => {
      // Given
      const request = {
        config: {
          validation: { schema: "stream", strict: true },
        },
      };

      const mockConnection = {
        id: "conn_test123",
        status: "active" as const,
        config: { compression: { enabled: false } },
      };

      jest.spyOn(streamingAPI as any, "getOptimalConnection").mockReturnValue(mockConnection);
      jest.spyOn(streamingAPI as any, "streamWithBuffer").mockImplementation(async function* () {
        yield {
          id: "chunk_1",
          sequence: 0,
          data: "validated data",
          final: false,
          metadata: { timestamp: new Date(), size: 70, checksum: "jkl012" },
        };
      });
      jest.spyOn(streamingAPI as any, "validateData").mockResolvedValue(undefined);

      // When
      const streamGenerator = streamingAPI.stream(request);
      const chunks: any[] = [];
      for await (const chunk of streamGenerator) {
        chunks.push(chunk);
      }

      // Then
      expect(chunks.length).toBeGreaterThan(0);
      expect((streamingAPI as any).validateData).toHaveBeenCalledWith(
        expect.any(Object),
        { schema: "stream", strict: true },
      );
    });

    test("should handle stream without available connections", async () => {
      // Given
      const request = { config: {} };
      jest.spyOn(streamingAPI as any, "getOptimalConnection").mockReturnValue(null);

      // When/Then
      await expect(streamingAPI.stream(request)).rejects.toThrow(
        "No available streaming connections",
      );
    });

    test("should handle stream health check failure", async () => {
      // Given
      const request = { config: {} };
      const mockConnection = {
        id: "conn_test123",
        status: "active" as const,
        config: { compression: { enabled: false } },
      };

      jest.spyOn(streamingAPI as any, "getOptimalConnection").mockReturnValue(mockConnection);
      jest.spyOn(streamingAPI as any, "streamWithBuffer").mockImplementation(async function* () {
        yield {
          id: "chunk_1",
          sequence: 0,
          data: "healthy data",
          final: false,
          metadata: { timestamp: new Date(), size: 50, checksum: "abc123" },
        };
        throw new Error("Stream health check failed");
      });

      // When/Then
      const streamGenerator = streamingAPI.stream(request);
      await expect(async () => {
        const chunks: any[] = [];
        for await (const chunk of streamGenerator) {
          chunks.push(chunk);
        }
      }).rejects.toThrow("Stream health check failed");
    });
  });

  describe("Buffer Management Integration", () => {
    test("should handle buffer overflow with drop oldest strategy", async () => {
      // Given
      const mockBufferManager = {
        createBuffer: jest.fn().mockReturnValue({
          enqueue: jest.fn().mockRejectedValue(new Error("Buffer overflow")),
          hasData: jest.fn().mockReturnValue(false),
          cleanup: jest.fn(),
        }),
        getUtilization: jest.fn().mockReturnValue(0.5),
        handleOverflow: jest.fn(),
      };

      (streamingAPI as any).bufferManager = mockBufferManager;

      const request = { config: {} };
      const mockConnection = {
        id: "conn_test123",
        status: "active" as const,
        config: { compression: { enabled: false } },
      };

      jest.spyOn(streamingAPI as any, "getOptimalConnection").mockReturnValue(mockConnection);
      jest.spyOn(streamingAPI as any, "streamWithBuffer").mockImplementation(async function* () {
        yield {
          id: "chunk_1",
          sequence: 0,
          data: "test data",
          final: false,
          metadata: { timestamp: new Date(), size: 50, checksum: "abc123" },
        };
      });

      // When
      const streamGenerator = streamingAPI.stream(request);
      const chunks: any[] = [];
      for await (const chunk of streamGenerator) {
        chunks.push(chunk);
      }

      // Then - should handle overflow gracefully
      expect(chunks.length).toBeGreaterThan(0);
    });

    test("should monitor buffer utilization", () => {
      // Given
      const mockBufferManager = {
        createBuffer: jest.fn(),
        getUtilization: jest.fn().mockReturnValue(0.75),
        handleOverflow: jest.fn(),
      };

      (streamingAPI as any).bufferManager = mockBufferManager;

      // When
      const status = streamingAPI.getStatus();

      // Then
      expect(status.bufferUtilization).toBe(0.75);
      expect(mockBufferManager.getUtilization).toHaveBeenCalled();
    });

    test("should handle buffer overflow events", () => {
      // Given
      const overflowEvent = {
        bufferId: "buffer_123",
        overflowCount: 5,
      };

      // When
      (streamingAPI as any).handleBufferOverflow(overflowEvent);

      // Then
      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Buffer overflow detected",
        overflowEvent,
      );
    });
  });

  describe("Compression Integration", () => {
    test("should compress stream data when enabled", async () => {
      // Given
      const mockCompressionEngine = {
        compress: jest.fn().mockResolvedValue("compressed data"),
        getCompressionInfo: jest.fn().mockReturnValue("gzip:0.6"),
        disableForStream: jest.fn(),
      };

      (streamingAPI as any).compressionEngine = mockCompressionEngine;

      const request = { config: {} };
      const mockConnection = {
        id: "conn_test123",
        status: "active" as const,
        config: { compression: { enabled: true, algorithm: "gzip" } },
      };

      jest.spyOn(streamingAPI as any, "getOptimalConnection").mockReturnValue(mockConnection);
      jest.spyOn(streamingAPI as any, "streamWithBuffer").mockImplementation(async function* () {
        yield {
          id: "chunk_1",
          sequence: 0,
          data: "compressed data",
          final: false,
          metadata: { timestamp: new Date(), size: 30, checksum: "abc123" },
        };
      });

      // When
      const streamGenerator = streamingAPI.stream(request);
      const chunks: any[] = [];
      for await (const chunk of streamGenerator) {
        chunks.push(chunk);
      }

      // Then
      expect(mockCompressionEngine.compress).toHaveBeenCalledWith(
        expect.any(Object),
        { enabled: true, algorithm: "gzip" },
      );
      expect(chunks[0].data).toBe("compressed data");
    });

    test("should skip compression when disabled", async () => {
      // Given
      const mockCompressionEngine = {
        compress: jest.fn().mockResolvedValue("original data"),
        getCompressionInfo: jest.fn().mockReturnValue(undefined),
        disableForStream: jest.fn(),
      };

      (streamingAPI as any).compressionEngine = mockCompressionEngine;

      const request = { config: {} };
      const mockConnection = {
        id: "conn_test123",
        status: "active" as const,
        config: { compression: { enabled: false } },
      };

      jest.spyOn(streamingAPI as any, "getOptimalConnection").mockReturnValue(mockConnection);
      jest.spyOn(streamingAPI as any, "streamWithBuffer").mockImplementation(async function* () {
        yield {
          id: "chunk_1",
          sequence: 0,
          data: "original data",
          final: false,
          metadata: { timestamp: new Date(), size: 100, checksum: "abc123" },
        };
      });

      // When
      const streamGenerator = streamingAPI.stream(request);
      const chunks: any[] = [];
      for await (const chunk of streamGenerator) {
        chunks.push(chunk);
      }

      // Then
      expect(mockCompressionEngine.compress).toHaveBeenCalledWith(
        expect.any(Object),
        { enabled: false },
      );
      expect(chunks[0].data).toBe("original data");
    });

    test("should handle compression errors gracefully", () => {
      // Given
      const compressionErrorEvent = {
        streamId: "stream_123",
        error: new Error("Compression failed"),
      };

      // When
      (streamingAPI as any).handleCompressionError(compressionErrorEvent);

      // Then
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Compression error",
        compressionErrorEvent,
      );
    });
  });

  describe("Circuit Breaker Integration", () => {
    test("should protect streaming with circuit breaker", async () => {
      // Given
      const mockCircuitBreaker = {
        execute: jest.fn().mockImplementation(async function* () {
          yield {
            id: "chunk_1",
            sequence: 0,
            data: "circuit protected data",
            final: false,
            metadata: { timestamp: new Date(), size: 50, checksum: "abc123" },
          };
        }),
        state: "closed",
      };

      (streamingAPI as any).circuitBreaker = mockCircuitBreaker;

      const request = { config: {} };
      const mockConnection = {
        id: "conn_test123",
        status: "active" as const,
        config: { compression: { enabled: false } },
      };

      jest.spyOn(streamingAPI as any, "getOptimalConnection").mockReturnValue(mockConnection);
      jest.spyOn(streamingAPI as any, "streamWithBuffer").mockImplementation(async function* () {
        yield {
          id: "chunk_1",
          sequence: 0,
          data: "circuit protected data",
          final: false,
          metadata: { timestamp: new Date(), size: 50, checksum: "abc123" },
        };
      });

      // When
      const streamGenerator = streamingAPI.stream(request);
      const chunks: any[] = [];
      for await (const chunk of streamGenerator) {
        chunks.push(chunk);
      }

      // Then
      expect(mockCircuitBreaker.execute).toHaveBeenCalled();
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0].data).toBe("circuit protected data");
    });

    test("should handle circuit breaker open state", async () => {
      // Given
      const mockCircuitBreaker = {
        execute: jest.fn().mockRejectedValue(new Error("Circuit breaker is open")),
        state: "open",
      };

      (streamingAPI as any).circuitBreaker = mockCircuitBreaker;

      const request = { config: {} };
      const mockConnection = {
        id: "conn_test123",
        status: "active" as const,
        config: { compression: { enabled: false } },
      };

      jest.spyOn(streamingAPI as any, "getOptimalConnection").mockReturnValue(mockConnection);

      // When/Then
      await expect(streamingAPI.stream(request)).rejects.toThrow(
        "Circuit breaker is open",
      );
    });
  });

  describe("Performance Monitoring Integration", () => {
    test("should track streaming performance metrics", async () => {
      // Given
      const mockPerformanceMonitor = {
        recordChunk: jest.fn(),
        recordError: jest.fn(),
        recordStreamComplete: jest.fn(),
        recordData: jest.fn(),
        getCurrentThroughput: jest.fn().mockReturnValue(1000),
        getCurrentLatency: jest.fn().mockReturnValue(50),
        getErrorRate: jest.fn().mockReturnValue(0.01),
        getStreamMetrics: jest.fn().mockReturnValue({
          latency: 50,
          errorRate: 0.01,
        }),
        getMetrics: jest.fn().mockReturnValue({
          latency: { mean: 50, p50: 45, p95: 80, p99: 100, max: 120 },
          throughput: { requestsPerSecond: 100, bytesPerSecond: 1000, operationsPerSecond: 50 },
          utilization: { cpu: 0.3, memory: 0.5, disk: 0.1, network: 0.2 },
          errors: { rate: 0.01, percentage: 1, types: { network: 5, timeout: 3 } },
        }),
      };

      (streamingAPI as any).performanceMonitor = mockPerformanceMonitor;

      const request = { config: {} };
      const mockConnection = {
        id: "conn_test123",
        status: "active" as const,
        config: { compression: { enabled: false } },
      };

      jest.spyOn(streamingAPI as any, "getOptimalConnection").mockReturnValue(mockConnection);
      jest.spyOn(streamingAPI as any, "streamWithBuffer").mockImplementation(async function* () {
        yield {
          id: "chunk_1",
          sequence: 0,
          data: "performance test data",
          final: false,
          metadata: { timestamp: new Date(), size: 50, checksum: "abc123" },
        };
      });

      // When
      const streamGenerator = streamingAPI.stream(request);
      const chunks: any[] = [];
      for await (const chunk of streamGenerator) {
        chunks.push(chunk);
      }

      // Then
      expect(mockPerformanceMonitor.recordChunk).toHaveBeenCalledWith(
        expect.stringMatching(/^stream_/),
        expect.any(Object),
      );
      expect(mockPerformanceMonitor.recordStreamComplete).toHaveBeenCalled();
    });

    test("should provide comprehensive performance metrics", () => {
      // Given
      const mockPerformanceMonitor = {
        getCurrentThroughput: jest.fn().mockReturnValue(1500),
        getCurrentLatency: jest.fn().mockReturnValue(45),
        getErrorRate: jest.fn().mockReturnValue(0.005),
      };

      (streamingAPI as any).performanceMonitor = mockPerformanceMonitor;

      // When
      const status = streamingAPI.getStatus();
      const metrics = streamingAPI.getPerformanceMetrics();

      // Then
      expect(status.throughput).toBe(1500);
      expect(status.latency).toBe(45);
      expect(status.errors).toBe(0.005);
      expect(metrics).toMatchObject({
        latency: expect.any(Object),
        throughput: expect.any(Object),
        utilization: expect.any(Object),
        errors: expect.any(Object),
      });
    });

    test("should handle performance monitoring errors", async () => {
      // Given
      const mockPerformanceMonitor = {
        recordError: jest.fn(),
        recordStreamComplete: jest.fn(),
      };

      (streamingAPI as any).performanceMonitor = mockPerformanceMonitor;

      const request = { config: {} };
      const mockConnection = {
        id: "conn_test123",
        status: "active" as const,
        config: { compression: { enabled: false } },
      };

      jest.spyOn(streamingAPI as any, "getOptimalConnection").mockReturnValue(mockConnection);
      jest.spyOn(streamingAPI as any, "streamWithBuffer").mockImplementation(async function* () {
        yield {
          id: "chunk_1",
          sequence: 0,
          data: "error test data",
          final: false,
          metadata: { timestamp: new Date(), size: 50, checksum: "abc123" },
        };
        throw new Error("Stream processing error");
      });

      // When
      const streamGenerator = streamingAPI.stream(request);
      try {
        for await (const chunk of streamGenerator) {
          // Consume stream
        }
      } catch (error) {
        // Expected error
      }

      // Then
      expect(mockPerformanceMonitor.recordError).toHaveBeenCalledWith(
        expect.stringMatching(/^stream_/),
        expect.any(Error),
      );
    });
  });

  describe("Connection Optimization Integration", () => {
    test("should select optimal connection based on performance", async () => {
      // Given
      const connections = [
        {
          id: "conn_slow123",
          status: "active" as const,
          getLatency: jest.fn().mockReturnValue(100),
          getUtilization: jest.fn().mockReturnValue(0.8),
          getThroughput: jest.fn().mockReturnValue(500),
        },
        {
          id: "conn_fast456",
          status: "active" as const,
          getLatency: jest.fn().mockReturnValue(20),
          getUtilization: jest.fn().mockReturnValue(0.2),
          getThroughput: jest.fn().mockReturnValue(2000),
        },
      ];

      (streamingAPI as any).connections = new Map([
        ["conn_slow123", connections[0]],
        ["conn_fast456", connections[1]],
      ]);

      // When
      const optimalConnection = (streamingAPI as any).getOptimalConnection();

      // Then
      expect(optimalConnection).toBe(connections[1]); // Should select faster connection
    });

    test("should handle connection scoring calculation", () => {
      // Given
      const connection = {
        getLatency: jest.fn().mockReturnValue(30),
        getUtilization: jest.fn().mockReturnValue(0.1),
        getThroughput: jest.fn().mockReturnValue(1500),
      };

      // When
      const score = (streamingAPI as any).calculateConnectionScore(connection);

      // Then
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
      expect(connection.getLatency).toHaveBeenCalled();
      expect(connection.getUtilization).toHaveBeenCalled();
      expect(connection.getThroughput).toHaveBeenCalled();
    });

    test("should handle no available connections", () => {
      // Given
      (streamingAPI as any).connections = new Map();

      // When
      const optimalConnection = (streamingAPI as any).getOptimalConnection();

      // Then
      expect(optimalConnection).toBeNull();
    });

    test("should filter inactive connections", () => {
      // Given
      const connections = [
        {
          id: "conn_active123",
          status: "active" as const,
          getLatency: jest.fn().mockReturnValue(50),
          getUtilization: jest.fn().mockReturnValue(0.3),
          getThroughput: jest.fn().mockReturnValue(1000),
        },
        {
          id: "conn_inactive456",
          status: "closed" as const,
          getLatency: jest.fn().mockReturnValue(200),
          getUtilization: jest.fn().mockReturnValue(0.9),
          getThroughput: jest.fn().mockReturnValue(100),
        },
      ];

      (streamingAPI as any).connections = new Map([
        ["conn_active123", connections[0]],
        ["conn_inactive456", connections[1]],
      ]);

      // When
      const optimalConnection = (streamingAPI as any).getOptimalConnection();

      // Then
      expect(optimalConnection).toBe(connections[0]); // Should select only active connection
    });
  });

  describe("Error Handling and Recovery Integration", () => {
    test("should handle connection errors with reconnection logic", () => {
      // Given
      const connectionErrorEvent = {
        connection: "conn_failed123",
        error: new Error("Network timeout"),
      };

      const mockConnection = {
        id: "conn_failed123",
        status: "error" as const,
        close: jest.fn().mockResolvedValue(undefined),
      };

      (streamingAPI as any).connections = new Map([
        ["conn_failed123", mockConnection],
      ]);

      // When
      (streamingAPI as any).handleConnectionError(connectionErrorEvent);

      // Then
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Connection error",
        connectionErrorEvent,
      );
      expect(mockUnifiedAPI.emit).toHaveBeenCalledWith("reconnection:needed");
    });

    test("should implement retry logic for recoverable errors", async () => {
      // Given
      const request = { config: {} };
      const mockConnection = {
        id: "conn_test123",
        status: "active" as const,
        config: { compression: { enabled: false } },
      };

      let attemptCount = 0;
      jest.spyOn(streamingAPI as any, "getOptimalConnection").mockReturnValue(mockConnection);
      jest.spyOn(streamingAPI as any, "streamWithBuffer").mockImplementation(async function* () {
        attemptCount++;
        if (attemptCount === 1) {
          throw new Error("NETWORK_ERROR");
        }
        yield {
          id: "chunk_retry",
          sequence: 0,
          data: "retry success data",
          final: false,
          metadata: { timestamp: new Date(), size: 50, checksum: "abc123" },
        };
      });
      jest.spyOn(streamingAPI as any, "shouldRetryStream").mockReturnValue(true);
      jest.spyOn(streamingAPI as any, "delay").mockResolvedValue(undefined);

      // When
      const streamGenerator = streamingAPI.stream(request);
      const chunks: any[] = [];
      for await (const chunk of streamGenerator) {
        chunks.push(chunk);
      }

      // Then
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0].data).toBe("retry success data");
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Attempting stream recovery",
        expect.any(Object),
      );
    });

    test("should identify retryable vs non-retryable errors", () => {
      // Given
      const retryableErrors = [
        { code: "NETWORK_ERROR" },
        { code: "SERVICE_UNAVAILABLE" },
        { code: "RATE_LIMITED" },
      ];

      const nonRetryableErrors = [
        { code: "AUTHENTICATION_ERROR" },
        { code: "VALIDATION_ERROR" },
        { code: "UNKNOWN_ERROR" },
      ];

      // When/Then
      retryableErrors.forEach((error) => {
        expect((streamingAPI as any).shouldRetryStream(error)).toBe(true);
      });

      nonRetryableErrors.forEach((error) => {
        expect((streamingAPI as any).shouldRetryStream(error)).toBe(false);
      });
    });

    test("should implement exponential backoff for retries", async () => {
      // Given
      const request = { config: {} };
      const mockConnection = {
        id: "conn_test123",
        status: "active" as const,
        config: { compression: { enabled: false } },
      };

      let attemptCount = 0;
      jest.spyOn(streamingAPI as any, "getOptimalConnection").mockReturnValue(mockConnection);
      jest.spyOn(streamingAPI as any, "streamWithBuffer").mockImplementation(async function* () {
        attemptCount++;
        throw new Error("SERVICE_UNAVAILABLE");
      });
      jest.spyOn(streamingAPI as any, "shouldRetryStream").mockReturnValue(true);
      jest.spyOn(streamingAPI as any, "delay").mockResolvedValue(undefined);

      // When/Then
      await expect(streamingAPI.stream(request)).rejects.toThrow(
        "Stream recovery failed after 3 attempts",
      );

      expect((streamingAPI as any).delay).toHaveBeenCalledWith(1000); // 2^0 * 1000
      expect((streamingAPI as any).delay).toHaveBeenCalledWith(2000); // 2^1 * 1000
      expect((streamingAPI as any).delay).toHaveBeenCalledWith(4000); // 2^2 * 1000
    });

    test("should handle non-retryable errors without retry logic", async () => {
      // Given
      const request = { config: {} };
      const mockConnection = {
        id: "conn_test123",
        status: "active" as const,
        config: { compression: { enabled: false } },
      };

      jest.spyOn(streamingAPI as any, "getOptimalConnection").mockReturnValue(mockConnection);
      jest.spyOn(streamingAPI as any, "streamWithBuffer").mockImplementation(async function* () {
        throw new Error("AUTHENTICATION_ERROR");
      });
      jest.spyOn(streamingAPI as any, "shouldRetryStream").mockReturnValue(false);

      // When/Then
      await expect(streamingAPI.stream(request)).rejects.toThrow(
        "AUTHENTICATION_ERROR",
      );
      expect(mockLogger.info).not.toHaveBeenCalledWith(
        "Attempting stream recovery",
        expect.any(Object),
      );
    });
  });

  describe("Resource Management Integration", () => {
    test("should properly cleanup all resources on disconnect", async () => {
      // Given
      const mockConnections = [
        {
          id: "conn_1",
          status: "active" as const,
          close: jest.fn().mockResolvedValue(undefined),
        },
        {
          id: "conn_2",
          status: "active" as const,
          close: jest.fn().mockResolvedValue(undefined),
        },
      ];

      const mockBufferManager = {
        cleanup: jest.fn(),
        getUtilization: jest.fn().mockReturnValue(0.5),
      };

      const mockCompressionEngine = {
        cleanup: jest.fn(),
      };

      (streamingAPI as any).connections = new Map([
        ["conn_1", mockConnections[0]],
        ["conn_2", mockConnections[1]],
      ]);
      (streamingAPI as any).bufferManager = mockBufferManager;
      (streamingAPI as any).compressionEngine = mockCompressionEngine;

      // When
      await streamingAPI.disconnect();

      // Then
      expect(mockConnections[0].close).toHaveBeenCalled();
      expect(mockConnections[1].close).toHaveBeenCalled();
      expect(mockBufferManager.cleanup).toHaveBeenCalled();
      expect(mockCompressionEngine.cleanup).toHaveBeenCalled();
      expect((streamingAPI as any).connections.size).toBe(0);
      expect(mockUnifiedAPI.emit).toHaveBeenCalledWith("disconnected");
    });

    test("should handle connection close errors gracefully", async () => {
      // Given
      const mockConnection = {
        id: "conn_error123",
        status: "active" as const,
        close: jest.fn().mockRejectedValue(new Error("Close failed")),
      };

      (streamingAPI as any).connections = new Map([
        ["conn_error123", mockConnection],
      ]);

      // When
      await streamingAPI.disconnect();

      // Then
      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Error closing connection",
        {
          connection: "conn_error123",
          error: expect.any(Error),
        },
      );
    });

    test("should handle buffer cleanup", async () => {
      // Given
      const mockBufferManager = {
        cleanup: jest.fn(),
        getUtilization: jest.fn().mockReturnValue(0.5),
      };

      (streamingAPI as any).bufferManager = mockBufferManager;

      // When
      await streamingAPI.disconnect();

      // Then
      expect(mockBufferManager.cleanup).toHaveBeenCalled();
    });

    test("should handle compression engine cleanup", async () => {
      // Given
      const mockCompressionEngine = {
        cleanup: jest.fn(),
      };

      (streamingAPI as any).compressionEngine = mockCompressionEngine;

      // When
      await streamingAPI.disconnect();

      // Then
      expect(mockCompressionEngine.cleanup).toHaveBeenCalled();
    });
  });

  describe("Event Handling Integration", () => {
    test("should emit connection established events", async () => {
      // Given
      const config = {
        protocol: "websocket" as const,
        bufferSize: 1000,
        chunkSize: 64,
      };

      const mockConnection = {
        id: "conn_event123",
        status: "connecting" as const,
        on: jest.fn(),
        emit: jest.fn(),
        close: jest.fn().mockResolvedValue(undefined),
        getLatency: jest.fn().mockReturnValue(50),
        getUtilization: jest.fn().mockReturnValue(0.1),
        getThroughput: jest.fn().mockReturnValue(1000),
      };

      jest.spyOn(streamingAPI as any, "createConnection").mockResolvedValue(mockConnection);
      jest.spyOn(streamingAPI as any, "setupConnectionMonitoring").mockImplementation(() => {});
      jest.spyOn(streamingAPI as any, "validateStreamingConfig").mockImplementation(() => {});

      // When
      await streamingAPI.connect(config);

      // Then
      expect(mockUnifiedAPI.emit).toHaveBeenCalledWith(
        "connection:established",
        {
          connectionId: expect.stringMatching(/^conn_/),
          config,
        },
      );
    });

    test("should handle connection error events", () => {
      // Given
      const connectionErrorEvent = {
        connection: "conn_error123",
        error: new Error("Connection failed"),
      };

      // When
      (streamingAPI as any).handleConnectionError(connectionErrorEvent);

      // Then
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Connection error",
        connectionErrorEvent,
      );
    });

    test("should handle buffer overflow events", () => {
      // Given
      const overflowEvent = {
        bufferId: "buffer_overflow123",
        overflowCount: 10,
      };

      // When
      (streamingAPI as any).handleBufferOverflow(overflowEvent);

      // Then
      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Buffer overflow detected",
        overflowEvent,
      );
    });

    test("should handle compression error events", () => {
      // Given
      const compressionErrorEvent = {
        streamId: "stream_compress123",
        error: new Error("Compression failed"),
      };

      // When
      (streamingAPI as any).handleCompressionError(compressionErrorEvent);

      // Then
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Compression error",
        compressionErrorEvent,
      );
    });
  });

  describe("Status and Health Monitoring Integration", () => {
    test("should provide comprehensive streaming status", () => {
      // Given
      const mockConnections = [
        {
          id: "conn_active1",
          status: "active" as const,
          getLatency: jest.fn().mockReturnValue(30),
          getUtilization: jest.fn().mockReturnValue(0.2),
          getThroughput: jest.fn().mockReturnValue(1000),
        },
        {
          id: "conn_active2",
          status: "active" as const,
          getLatency: jest.fn().mockReturnValue(50),
          getUtilization: jest.fn().mockReturnValue(0.3),
          getThroughput: jest.fn().mockReturnValue(800),
        },
      ];

      const mockBufferManager = {
        getUtilization: jest.fn().mockReturnValue(0.6),
      };

      const mockPerformanceMonitor = {
        getCurrentThroughput: jest.fn().mockReturnValue(900),
        getCurrentLatency: jest.fn().mockReturnValue(40),
        getErrorRate: jest.fn().mockReturnValue(0.02),
      };

      (streamingAPI as any).connections = new Map([
        ["conn_active1", mockConnections[0]],
        ["conn_active2", mockConnections[1]],
        ["conn_inactive", { id: "conn_inactive", status: "closed" as const }],
      ]);
      (streamingAPI as any).bufferManager = mockBufferManager;
      (streamingAPI as any).performanceMonitor = mockPerformanceMonitor;

      // When
      const status = streamingAPI.getStatus();

      // Then
      expect(status.connected).toBe(true);
      expect(status.bufferUtilization).toBe(0.6);
      expect(status.throughput).toBe(900);
      expect(status.latency).toBe(40);
      expect(status.errors).toBe(0.02);
    });

    test("should report disconnected status when no active connections", () => {
      // Given
      (streamingAPI as any).connections = new Map([
        ["conn_closed1", { id: "conn_closed1", status: "closed" as const }],
        ["conn_closing", { id: "conn_closing", status: "closing" as const }],
      ]);

      // When
      const status = streamingAPI.getStatus();

      // Then
      expect(status.connected).toBe(false);
    });

    test("should provide detailed performance metrics", () => {
      // Given
      const mockPerformanceMonitor = {
        getMetrics: jest.fn().mockReturnValue({
          latency: {
            mean: 45,
            p50: 40,
            p95: 70,
            p99: 90,
            max: 120,
          },
          throughput: {
            requestsPerSecond: 120,
            bytesPerSecond: 1500,
            operationsPerSecond: 60,
          },
          utilization: {
            cpu: 0.4,
            memory: 0.6,
            disk: 0.2,
            network: 0.3,
          },
          errors: {
            rate: 0.015,
            percentage: 1.5,
            types: { network: 8, timeout: 5, compression: 2 },
          },
        }),
      };

      (streamingAPI as any).performanceMonitor = mockPerformanceMonitor;

      // When
      const metrics = streamingAPI.getPerformanceMetrics();

      // Then
      expect(metrics).toMatchObject({
        latency: expect.any(Object),
        throughput: expect.any(Object),
        utilization: expect.any(Object),
        errors: expect.any(Object),
      });
      expect(metrics.latency.mean).toBe(45);
      expect(metrics.throughput.requestsPerSecond).toBe(120);
      expect(metrics.errors.rate).toBe(0.015);
    });
  });
});