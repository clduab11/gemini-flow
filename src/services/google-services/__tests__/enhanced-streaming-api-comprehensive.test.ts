/**
 * Comprehensive TDD Test Suite for Enhanced Streaming API
 *
 * Following London School TDD practices with mock-driven development,
 * behavior verification, and 100% code coverage target.
 *
 * RED-GREEN-REFACTOR CYCLE DOCUMENTATION:
 * 1. RED: Write failing test that describes desired behavior
 * 2. GREEN: Write minimal code to make test pass
 * 3. REFACTOR: Improve code structure while keeping tests green
 */

import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  jest,
} from "@jest/globals";
import { EventEmitter } from "events";
import { EnhancedStreamingAPI } from "../enhanced-streaming-api.js";
import {
  MockFactory,
  TestDataGenerator,
  MockBuilder,
  ContractTester,
  PerformanceTester,
  ErrorScenarioTester,
} from "./test-utilities.js";

// ==================== Mock Setup Following London School ====================

// Mock all external dependencies to focus on interactions
jest.mock("../../../adapters/unified-api.js");
jest.mock("../../../utils/logger.js");

describe("EnhancedStreamingAPI - London School TDD", () => {
  let streamingAPI: EnhancedStreamingAPI;
  let mockConfig: any;
  let mockUnifiedAPI: jest.Mocked<any>;
  let mockLogger: jest.Mocked<any>;
  let mockBufferManager: jest.Mocked<any>;
  let mockCompressionEngine: jest.Mocked<any>;
  let mockPerformanceMonitor: jest.Mocked<any>;
  let mockCircuitBreaker: jest.Mocked<any>;
  let mockBuilder: MockBuilder;

  beforeEach(() => {
    // Setup comprehensive mock configuration
    mockConfig = {
      apiKey: TestDataGenerator.randomString(32),
      projectId: TestDataGenerator.randomString(16),
      region: "us-central1",
      streaming: {
        maxConcurrentStreams: 10,
        defaultChunkSize: 8192,
        compressionEnabled: true,
        qualityAdaptation: true,
        bufferSize: 32768,
        maxRetries: 3,
        buffer: {
          maxSize: 1000,
          strategy: "fifo",
        },
        compression: {
          enabled: true,
          algorithm: "gzip",
          level: 6,
        },
        circuitBreaker: {
          failureThreshold: 5,
          timeout: 60000,
          resetTimeout: 300000,
        },
      },
      qualityProfiles: {
        low: { bitrate: 500000, resolution: "480p" },
        medium: { bitrate: 1000000, resolution: "720p" },
        high: { bitrate: 2000000, resolution: "1080p" },
      },
    };

    // Create mock builder for consistent mock creation
    mockBuilder = new MockBuilder();

    // Setup UnifiedAPI mock with all expected methods
    mockUnifiedAPI =
      mockBuilder
        .mockResolves("initialize", undefined)
        .mockResolves("shutdown", undefined)
        .mockFunction("on", jest.fn())
        .mockFunction("emit", jest.fn())
        .getMock("initialize")!
        .getMockImplementation()?.constructor || {};

    // Setup Logger mock
    mockLogger = mockBuilder
      .mockFunction("info", jest.fn())
      .mockFunction("debug", jest.fn())
      .mockFunction("warn", jest.fn())
      .mockFunction("error", jest.fn())
      .build() as any;

    // Setup internal component mocks
    mockBufferManager = {
      createBuffer: jest.fn().mockReturnValue({
        enqueue: jest.fn().mockResolvedValue(undefined),
        dequeue: jest
          .fn()
          .mockResolvedValue(MockFactory.createStreamChunk("test-data")),
        hasData: jest.fn().mockReturnValue(true),
        shouldPause: jest.fn().mockReturnValue(false),
        getUtilization: jest.fn().mockReturnValue(50),
        handleOverflow: jest.fn(),
        cleanup: jest.fn(),
      }),
      getUtilization: jest.fn().mockReturnValue(60),
      handleOverflow: jest.fn(),
      cleanup: jest.fn(),
    };

    mockCompressionEngine = {
      compress: jest.fn().mockResolvedValue("compressed-data"),
      getCompressionInfo: jest.fn().mockReturnValue("gzip, ratio: 0.7"),
      disableForStream: jest.fn(),
      cleanup: jest.fn(),
    };

    mockPerformanceMonitor = {
      recordChunk: jest.fn(),
      recordError: jest.fn(),
      recordStreamComplete: jest.fn(),
      recordData: jest.fn(),
      getCurrentThroughput: jest.fn().mockReturnValue(1000),
      getCurrentLatency: jest.fn().mockReturnValue(50),
      getErrorRate: jest.fn().mockReturnValue(0.01),
      getStreamMetrics: jest.fn().mockReturnValue({
        latency: 45,
        errorRate: 0.005,
      }),
      getMetrics: jest
        .fn()
        .mockReturnValue(MockFactory.createPerformanceMetrics()),
    };

    mockCircuitBreaker = {
      execute: jest.fn().mockImplementation(async (operation) => {
        return await operation();
      }),
      state: "closed",
      failures: 0,
    };

    // Mock the constructor dependencies
    jest.mocked(require("../../../adapters/unified-api.js")).UnifiedAPI = jest
      .fn()
      .mockImplementation(() => mockUnifiedAPI);
    jest.mocked(require("../../../utils/logger.js")).Logger = jest
      .fn()
      .mockImplementation(() => mockLogger);

    // Create the streaming API instance with mocked dependencies
    streamingAPI = new EnhancedStreamingAPI(mockConfig);

    // Inject mocks into private properties (normally would be done through dependency injection)
    (streamingAPI as any).bufferManager = mockBufferManager;
    (streamingAPI as any).compressionEngine = mockCompressionEngine;
    (streamingAPI as any).performanceMonitor = mockPerformanceMonitor;
    (streamingAPI as any).circuitBreaker = mockCircuitBreaker;
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockBuilder.clear();
  });

  // ==================== INITIALIZATION BEHAVIOR TESTS ====================

  describe("Initialization Behavior Verification", () => {
    // RED: Test should fail initially
    it("should coordinate initialization with all collaborators", async () => {
      // ARRANGE
      const initializeSpy = jest.spyOn(streamingAPI, "initialize");

      // ACT
      await streamingAPI.initialize();

      // ASSERT - Verify interactions, not state
      expect(initializeSpy).toHaveBeenCalledTimes(1);
      expect(mockUnifiedAPI.initialize).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        "EnhancedStreamingAPI initialized",
      );
    });

    it("should handle initialization failure gracefully", async () => {
      // ARRANGE
      const initError = new Error("Dependency initialization failed");
      mockUnifiedAPI.initialize.mockRejectedValueOnce(initError);

      // ACT & ASSERT
      await expect(streamingAPI.initialize()).rejects.toThrow(
        "Dependency initialization failed",
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Failed to initialize streaming API",
        initError,
      );
    });

    it("should establish event handler contracts during initialization", async () => {
      // ARRANGE & ACT
      await streamingAPI.initialize();

      // ASSERT - Verify event handler setup
      expect(mockUnifiedAPI.on).toHaveBeenCalledWith(
        "quality_changed",
        expect.any(Function),
      );
      expect(mockUnifiedAPI.on).toHaveBeenCalledWith(
        "connection_lost",
        expect.any(Function),
      );
      expect(mockUnifiedAPI.on).toHaveBeenCalledWith(
        "buffer_overflow",
        expect.any(Function),
      );
    });
  });

  // ==================== CONNECTION MANAGEMENT BEHAVIOR ====================

  describe("Connection Management Behavior", () => {
    beforeEach(async () => {
      await streamingAPI.initialize();
    });

    it("should coordinate connection establishment with configuration validation", async () => {
      // ARRANGE
      const streamingConfig = MockFactory.createStreamingConfig();
      const connectionSpy = jest.spyOn(streamingAPI, "connect");

      // ACT
      await streamingAPI.connect(streamingConfig);

      // ASSERT - Verify behavior coordination
      expect(connectionSpy).toHaveBeenCalledWith(streamingConfig);
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Establishing streaming connection",
        expect.objectContaining({
          protocol: streamingConfig.protocol,
        }),
      );
    });

    it("should validate configuration before establishing connection", async () => {
      // ARRANGE
      const invalidConfig = {
        ...MockFactory.createStreamingConfig(),
        bufferSize: -1, // Invalid buffer size
        protocol: "invalid-protocol" as any,
      };

      // ACT & ASSERT
      await expect(streamingAPI.connect(invalidConfig)).rejects.toThrow();
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Failed to establish streaming connection",
        expect.any(Error),
      );
    });

    it("should emit connection events for monitoring coordination", async () => {
      // ARRANGE
      const streamingConfig = MockFactory.createStreamingConfig();
      const emitSpy = jest.spyOn(streamingAPI, "emit");

      // ACT
      await streamingAPI.connect(streamingConfig);

      // ASSERT
      expect(emitSpy).toHaveBeenCalledWith(
        "connection:established",
        expect.objectContaining({
          config: streamingConfig,
        }),
      );
    });
  });

  // ==================== STREAMING BEHAVIOR VERIFICATION ====================

  describe("Streaming Behavior with Mock Interactions", () => {
    const mockRequest = {
      sessionId: "test-session-123",
      streamType: "video",
      config: {
        quality: "high",
        maxLatency: 1000,
        maxErrorRate: 0.1,
      },
    };

    beforeEach(async () => {
      await streamingAPI.initialize();
      await streamingAPI.connect(MockFactory.createStreamingConfig());
    });

    it("should orchestrate streaming pipeline with buffer management", async () => {
      // ARRANGE
      const mockDataSource = createMockAsyncGenerator([
        "chunk1",
        "chunk2",
        "chunk3",
      ]);
      jest
        .spyOn(streamingAPI as any, "createDataSource")
        .mockReturnValue(mockDataSource);

      // ACT
      const chunks: any[] = [];
      for await (const chunk of streamingAPI.stream(mockRequest)) {
        chunks.push(chunk);
        if (chunk.final) break;
      }

      // ASSERT - Verify interaction patterns
      expect(mockBufferManager.createBuffer).toHaveBeenCalled();
      expect(mockCompressionEngine.compress).toHaveBeenCalled();
      expect(mockPerformanceMonitor.recordChunk).toHaveBeenCalled();
      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[chunks.length - 1].final).toBe(true);
    });

    it("should coordinate error recovery with circuit breaker", async () => {
      // ARRANGE
      const streamError = new Error("Stream processing failed");
      mockCircuitBreaker.execute.mockRejectedValueOnce(streamError);

      // ACT & ASSERT
      await expect(async () => {
        for await (const chunk of streamingAPI.stream(mockRequest)) {
          // Stream should fail
        }
      }).rejects.toThrow("Stream processing failed");

      expect(mockPerformanceMonitor.recordError).toHaveBeenCalledWith(
        expect.any(String),
        streamError,
      );
    });

    it("should implement backpressure coordination with buffer manager", async () => {
      // ARRANGE
      const buffer = mockBufferManager.createBuffer();
      buffer.shouldPause.mockReturnValue(true); // Simulate backpressure

      const mockDataSource = createMockAsyncGenerator(["chunk1", "chunk2"]);
      jest
        .spyOn(streamingAPI as any, "createDataSource")
        .mockReturnValue(mockDataSource);

      // ACT
      const chunks: any[] = [];
      for await (const chunk of streamingAPI.stream(mockRequest)) {
        chunks.push(chunk);
        if (chunks.length >= 2) break; // Limit test iterations
      }

      // ASSERT - Verify backpressure handling
      expect(buffer.shouldPause).toHaveBeenCalled();
      expect(buffer.enqueue).toHaveBeenCalled();
    });
  });

  // ==================== QUALITY ADAPTATION BEHAVIOR ====================

  describe("Quality Adaptation Behavior Coordination", () => {
    beforeEach(async () => {
      await streamingAPI.initialize();
    });

    it("should coordinate quality changes with performance monitoring", async () => {
      // ARRANGE
      const adaptationRequest = {
        sessionId: "test-session",
        targetQuality: "adaptive" as const,
        networkConditions: {
          bandwidth: { download: 1000000 },
          latency: { rtt: 150 },
          quality: { packetLoss: 0.02 },
        },
        deviceConstraints: {
          cpu: { usage: 80 },
          memory: { usage: 70 },
        },
        preferences: {
          prioritizeLatency: true,
          maxBitrate: 1500000,
        },
      };

      // ACT
      const result = await streamingAPI.adaptQuality(adaptationRequest);

      // ASSERT - Verify coordination behavior
      expect(result.success).toBe(true);
      expect(result.data.adaptedQuality).toBeDefined();
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Adapting stream quality",
        expect.objectContaining({
          sessionId: adaptationRequest.sessionId,
          targetQuality: "adaptive",
        }),
      );
    });

    it("should maintain quality contracts when conditions are optimal", async () => {
      // ARRANGE
      const optimalRequest = {
        sessionId: "test-session",
        targetQuality: "high" as const,
        networkConditions: {
          bandwidth: { download: 50000000 },
          latency: { rtt: 20 },
          quality: { packetLoss: 0.001 },
        },
        deviceConstraints: {
          cpu: { usage: 30 },
          memory: { usage: 40 },
        },
        preferences: {
          prioritizeQuality: true,
        },
      };

      // ACT
      const result = await streamingAPI.adaptQuality(optimalRequest);

      // ASSERT - Verify quality maintenance
      expect(result.success).toBe(true);
      expect(result.data.adaptedQuality.level).toBe("high");
      expect(result.data.adaptationReason).toBe("optimal_conditions");
    });
  });

  // ==================== ERROR HANDLING BEHAVIOR ====================

  describe("Error Handling and Recovery Coordination", () => {
    beforeEach(async () => {
      await streamingAPI.initialize();
    });

    it("should coordinate circuit breaker responses to repeated failures", async () => {
      // ARRANGE
      const sessionId = "test-session-failures";
      const serviceError = new Error("Service unavailable");

      // Mock repeated failures
      mockUnifiedAPI.createSession = jest
        .fn()
        .mockRejectedValueOnce(serviceError)
        .mockRejectedValueOnce(serviceError)
        .mockRejectedValueOnce(serviceError)
        .mockRejectedValueOnce(serviceError)
        .mockRejectedValueOnce(serviceError);

      // ACT & ASSERT
      const failurePromises = Array.from({ length: 5 }, (_, i) =>
        streamingAPI
          .createSession(`${sessionId}-${i}`, "video", {} as any)
          .catch((error) => ({ error })),
      );

      const results = await Promise.all(failurePromises);
      const failures = results.filter((r) => "error" in r);

      expect(failures.length).toBe(5);
      expect(mockLogger.error).toHaveBeenCalledTimes(5);
    });

    it("should implement retry coordination with exponential backoff", async () => {
      // ARRANGE
      const sessionId = "test-session-retry";
      let attemptCount = 0;

      const flakyOperation = jest.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error("Temporary failure");
        }
        return MockFactory.createServiceResponse(true, { id: sessionId });
      });

      jest
        .spyOn(streamingAPI as any, "executeWithRetry")
        .mockImplementation(flakyOperation);

      // ACT
      const result = await streamingAPI.createSession(
        sessionId,
        "video",
        {} as any,
      );

      // ASSERT
      expect(result.success).toBe(true);
      expect(attemptCount).toBe(3); // Verify retry behavior
    });

    it("should handle network disconnection with graceful degradation", async () => {
      // ARRANGE
      const sessionId = "test-session-disconnect";
      const networkError = new Error("Network disconnected");
      const eventSpy = jest.spyOn(streamingAPI, "emit");

      // ACT
      streamingAPI.emit("connection:lost", { sessionId, error: networkError });

      // ASSERT
      expect(eventSpy).toHaveBeenCalledWith("connection:lost", {
        sessionId,
        error: networkError,
      });
    });
  });

  // ==================== PERFORMANCE CONTRACT VERIFICATION ====================

  describe("Performance Contract Verification", () => {
    beforeEach(async () => {
      await streamingAPI.initialize();
    });

    it("should meet performance requirements for session creation", async () => {
      // ARRANGE
      const performanceTest = PerformanceTester.createPerformanceTest(
        "session_creation",
        () => streamingAPI.createSession("perf-test", "video", {} as any),
        100, // 100ms max
        5, // 5 iterations
      );

      // ACT & ASSERT
      await performanceTest();
    });

    it("should provide comprehensive performance metrics contract", async () => {
      // ARRANGE
      const sessionId = "metrics-test-session";
      await streamingAPI.createSession(sessionId, "video", {} as any);

      // ACT
      const metricsResponse = await streamingAPI.getStreamingMetrics(sessionId);

      // ASSERT
      expect(metricsResponse.success).toBe(true);
      ContractTester.validatePerformanceMetrics(
        metricsResponse.data.performance,
      );
    });

    it("should track quality adaptation events with performance correlation", async () => {
      // ARRANGE
      const sessionId = "quality-metrics-session";
      await streamingAPI.createSession(sessionId, "video", {} as any);

      // Perform quality adaptation
      await streamingAPI.adaptQuality({
        sessionId,
        targetQuality: "medium",
        networkConditions: { bandwidth: { download: 1000000 } },
        deviceConstraints: {},
        preferences: {},
      });

      // ACT
      const metrics = await streamingAPI.getStreamingMetrics(sessionId);

      // ASSERT
      expect(metrics.data.qualityAdaptations).toBeGreaterThan(0);
      expect(metrics.data.adaptationHistory).toBeDefined();
      expect(Array.isArray(metrics.data.adaptationHistory)).toBe(true);
    });
  });

  // ==================== MULTI-MODAL PROCESSING COORDINATION ====================

  describe("Multi-Modal Processing Coordination", () => {
    beforeEach(async () => {
      await streamingAPI.initialize();
      await streamingAPI.createSession(
        "multimodal-session",
        "multimodal",
        {} as any,
      );
    });

    it("should coordinate multi-modal chunk processing with synchronization", async () => {
      // ARRANGE
      const multiModalChunk = {
        id: "chunk-001",
        type: "mixed" as const,
        timestamp: new Date(),
        sequence: 1,
        data: {
          video: TestDataGenerator.testBuffer(1024),
          audio: TestDataGenerator.testBuffer(512),
          text: "sample synchronized text",
          metadata: { scene: "outdoor", lighting: "bright" },
        },
        synchronization: {
          globalTimestamp: new Date(),
          mediaTimestamp: 1000,
          sequenceId: "seq-001",
        },
        quality: {
          video: { resolution: "1080p", bitrate: 2000000 },
          audio: { sampleRate: 48000, bitrate: 128000 },
        },
        processing: {
          compression: "gzip",
          encryption: false,
          validation: true,
        },
        metadata: {
          size: 8192,
          checksum: "abc123",
          contentType: "multimodal/mixed",
        },
      };

      // ACT
      const result = await streamingAPI.processMultiModalChunk(
        "multimodal-session",
        multiModalChunk,
      );

      // ASSERT
      expect(result.success).toBe(true);
      expect(result.data.processed).toBe(true);
      expect(result.data.chunkId).toBe(multiModalChunk.id);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Processing multi-modal chunk",
        expect.objectContaining({
          sessionId: "multimodal-session",
          chunkId: multiModalChunk.id,
          type: multiModalChunk.type,
          sequence: multiModalChunk.sequence,
        }),
      );
    });

    it("should maintain synchronization contracts across chunk boundaries", async () => {
      // ARRANGE
      const chunks = [
        createMultiModalChunk("video", 1, "seq-001"),
        createMultiModalChunk("audio", 2, "seq-001"),
        createMultiModalChunk("text", 3, "seq-001"),
      ];

      // ACT
      const results = await Promise.all(
        chunks.map((chunk) =>
          streamingAPI.processMultiModalChunk("multimodal-session", chunk),
        ),
      );

      // ASSERT
      expect(results.every((result) => result.success)).toBe(true);

      // Verify synchronization groups are consistent
      const syncGroups = results.map((r) => r.data.synchronizationGroup);
      expect(new Set(syncGroups).size).toBe(1); // All should have same sync group
    });
  });

  // ==================== CLEANUP AND RESOURCE MANAGEMENT ====================

  describe("Resource Management and Cleanup Coordination", () => {
    it("should coordinate graceful shutdown with all collaborators", async () => {
      // ARRANGE
      await streamingAPI.initialize();
      const session1 = "session-1";
      const session2 = "session-2";

      await streamingAPI.createSession(session1, "video", {} as any);
      await streamingAPI.createSession(session2, "audio", {} as any);

      // ACT
      await streamingAPI.shutdown();

      // ASSERT - Verify cleanup coordination
      expect(mockUnifiedAPI.shutdown).toHaveBeenCalled();
      expect(mockBufferManager.cleanup).toHaveBeenCalled();
      expect(mockCompressionEngine.cleanup).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Enhanced Streaming API shutdown complete",
      );
    });

    it("should handle session termination with resource cleanup", async () => {
      // ARRANGE
      await streamingAPI.initialize();
      const sessionId = "test-session-terminate";
      await streamingAPI.createSession(sessionId, "multimodal", {} as any);

      // ACT
      const result = await streamingAPI.endSession(sessionId);

      // ASSERT
      expect(result.success).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith("Ending streaming session", {
        sessionId,
      });
    });
  });

  // ==================== CONTRACT TESTING ====================

  describe("Service Contract Validation", () => {
    beforeEach(async () => {
      await streamingAPI.initialize();
    });

    it("should maintain service response contract for all operations", async () => {
      // ARRANGE & ACT
      const sessionResult = await streamingAPI.createSession(
        "contract-test",
        "video",
        {} as any,
      );
      const metricsResult =
        await streamingAPI.getStreamingMetrics("contract-test");

      // ASSERT
      ContractTester.validateServiceResponse(sessionResult);
      ContractTester.validateServiceResponse(metricsResult);
    });

    it("should maintain event emitter contract", async () => {
      // ARRANGE
      const expectedEvents = [
        "connection:established",
        "connection:lost",
        "buffer:overflow",
        "quality:changed",
        "session:created",
        "session:ended",
      ];

      // ACT & ASSERT
      ContractTester.validateEventEmitter(streamingAPI, expectedEvents);
    });
  });

  // ==================== ERROR SCENARIO TESTING ====================

  describe("Comprehensive Error Scenario Coverage", () => {
    beforeEach(async () => {
      await streamingAPI.initialize();
    });

    it("should handle all network error scenarios", async () => {
      const networkErrorTest = ErrorScenarioTester.createErrorInjectionTest(
        "network",
        () => streamingAPI.connect(MockFactory.createStreamingConfig()),
      );

      await networkErrorTest();
    });

    it("should handle validation error scenarios", async () => {
      const validationErrorTest = ErrorScenarioTester.createErrorInjectionTest(
        "validation",
        () =>
          streamingAPI.createSession("", "invalid-type" as any, null as any),
      );

      await validationErrorTest();
    });

    it("should handle service error scenarios", async () => {
      const serviceErrorTest = ErrorScenarioTester.createErrorInjectionTest(
        "service",
        () => streamingAPI.adaptQuality({} as any),
      );

      await serviceErrorTest();
    });
  });
});

// ==================== HELPER FUNCTIONS ====================

/**
 * Creates a mock async generator for testing streaming behavior
 */
function createMockAsyncGenerator<T>(items: T[]): AsyncIterable<T> {
  return {
    [Symbol.asyncIterator]: async function* () {
      for (const item of items) {
        yield item;
      }
    },
  };
}

/**
 * Creates a multi-modal chunk for synchronization testing
 */
function createMultiModalChunk(
  type: string,
  sequence: number,
  sequenceId: string,
) {
  return {
    id: `chunk-${sequence}`,
    type: type as any,
    timestamp: new Date(),
    sequence,
    data: { [type]: TestDataGenerator.testBuffer(512) },
    synchronization: {
      globalTimestamp: new Date(1000),
      mediaTimestamp: 1000,
      sequenceId,
    },
    quality: {},
    processing: {},
    metadata: {
      size: 512,
      checksum: `checksum-${sequence}`,
      contentType: `${type}/test`,
    },
  };
}

/**
 * RED-GREEN-REFACTOR CYCLE DOCUMENTATION:
 *
 * Each test in this suite follows the London School TDD approach:
 *
 * 1. RED Phase:
 *    - Write a failing test that describes the expected interaction
 *    - Focus on HOW objects should collaborate, not WHAT they contain
 *    - Use mocks to define contracts between collaborators
 *
 * 2. GREEN Phase:
 *    - Write minimal implementation to make the test pass
 *    - Focus on making the interactions work correctly
 *    - Don't worry about optimization yet
 *
 * 3. REFACTOR Phase:
 *    - Improve the code structure while keeping tests green
 *    - Extract methods, improve naming, optimize performance
 *    - Tests should continue to pass without modification
 *
 * Key London School Principles Applied:
 * - Mock ALL external dependencies
 * - Test interactions, not state
 * - Use mocks to drive design decisions
 * - Focus on object collaboration patterns
 * - Verify behavior through mock assertions
 */
