/**
 * Unit Tests for Enhanced Streaming API
 *
 * Comprehensive test suite following TDD practices for the EnhancedStreamingAPI
 * class, covering all functionality including streaming, quality adaptation,
 * multi-modal processing, and error handling.
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
import { UnifiedAPI } from "../../../adapters/unified-api.js";
import { Logger } from "../../../utils/logger.js";

// Mock dependencies
jest.mock("../../../adapters/unified-api.js");
jest.mock("../../../utils/logger.js");

describe("EnhancedStreamingAPI", () => {
  let streamingAPI: EnhancedStreamingAPI;
  let mockConfig: any;
  let mockLogger: jest.Mocked<Logger>;
  let mockUnifiedAPI: jest.Mocked<UnifiedAPI>;

  beforeEach(() => {
    // Setup mock configuration
    mockConfig = {
      apiKey: "test-api-key",
      projectId: "test-project",
      streaming: {
        maxConcurrentStreams: 10,
        defaultChunkSize: 8192,
        compressionEnabled: true,
        qualityAdaptation: true,
        bufferSize: 32768,
        maxRetries: 3,
      },
      qualityProfiles: {
        low: { bitrate: 500000, resolution: "480p" },
        medium: { bitrate: 1000000, resolution: "720p" },
        high: { bitrate: 2000000, resolution: "1080p" },
      },
    };

    // Setup mock logger
    mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as any;

    // Setup mock UnifiedAPI
    mockUnifiedAPI = {
      initialize: jest.fn().mockResolvedValue(undefined),
      shutdown: jest.fn().mockResolvedValue(undefined),
      on: jest.fn(),
      emit: jest.fn(),
    } as any;

    // Mock constructor dependencies
    (Logger as jest.MockedClass<typeof Logger>).mockReturnValue(mockLogger);
    (UnifiedAPI as jest.MockedClass<typeof UnifiedAPI>).mockReturnValue(
      mockUnifiedAPI,
    );

    streamingAPI = new EnhancedStreamingAPI(mockConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Initialization", () => {
    it("should initialize successfully with valid configuration", async () => {
      // Arrange
      const initializeSpy = jest.spyOn(streamingAPI, "initialize");

      // Act
      await streamingAPI.initialize();

      // Assert
      expect(initializeSpy).toHaveBeenCalledTimes(1);
      expect(mockUnifiedAPI.initialize).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        "EnhancedStreamingAPI initialized",
      );
    });

    it("should throw error when initialization fails", async () => {
      // Arrange
      const initError = new Error("Initialization failed");
      mockUnifiedAPI.initialize.mockRejectedValue(initError);

      // Act & Assert
      await expect(streamingAPI.initialize()).rejects.toThrow(
        "Initialization failed",
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        "Failed to initialize streaming API",
        initError,
      );
    });

    it("should setup event handlers during initialization", async () => {
      // Act
      await streamingAPI.initialize();

      // Assert
      expect(mockUnifiedAPI.on).toHaveBeenCalledWith(
        "quality_changed",
        expect.any(Function),
      );
      expect(mockUnifiedAPI.on).toHaveBeenCalledWith(
        "connection_lost",
        expect.any(Function),
      );
    });
  });

  describe("Session Management", () => {
    beforeEach(async () => {
      await streamingAPI.initialize();
    });

    it("should create streaming session successfully", async () => {
      // Arrange
      const sessionId = "test-session-123";
      const sessionType = "video";
      const mockContext = {
        sessionId,
        userId: "user-123",
        userPreferences: { qualityPriority: "balanced" },
        deviceCapabilities: { cpu: { cores: 4 } },
        networkConditions: { bandwidth: { download: 10000000 } },
        constraints: {},
        metadata: {},
      };

      // Act
      const result = await streamingAPI.createSession(
        sessionId,
        sessionType,
        mockContext,
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.id).toBe(sessionId);
      expect(result.data.type).toBe(sessionType);
      expect(result.data.status).toBe("active");
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Creating streaming session",
        {
          sessionId,
          type: sessionType,
        },
      );
    });

    it("should handle session creation with invalid parameters", async () => {
      // Arrange
      const invalidSessionId = "";
      const sessionType = "video";
      const mockContext = {};

      // Act
      const result = await streamingAPI.createSession(
        invalidSessionId,
        sessionType,
        mockContext as any,
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("INVALID_SESSION_PARAMETERS");
    });

    it("should end session and cleanup resources", async () => {
      // Arrange
      const sessionId = "test-session-123";
      await streamingAPI.createSession(sessionId, "video", {} as any);

      // Act
      const result = await streamingAPI.endSession(sessionId);

      // Assert
      expect(result.success).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith("Ending streaming session", {
        sessionId,
      });
    });

    it("should handle ending non-existent session", async () => {
      // Arrange
      const nonExistentSessionId = "non-existent-session";

      // Act
      const result = await streamingAPI.endSession(nonExistentSessionId);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("SESSION_NOT_FOUND");
    });
  });

  describe("Video Streaming", () => {
    const sessionId = "test-session-video";
    const mockContext = {
      sessionId,
      userId: "user-123",
      userPreferences: { qualityPriority: "balanced" },
      deviceCapabilities: { cpu: { cores: 4 } },
      networkConditions: { bandwidth: { download: 10000000 } },
      constraints: {},
      metadata: {},
    };

    beforeEach(async () => {
      await streamingAPI.initialize();
      await streamingAPI.createSession(sessionId, "video", mockContext);
    });

    it("should start video stream successfully", async () => {
      // Arrange
      const videoRequest = {
        id: "video-stream-1",
        source: "camera" as const,
        quality: {
          level: "high" as const,
          video: {
            codec: { name: "H264", mimeType: "video/mp4", bitrate: 2000000 },
            resolution: { width: 1920, height: 1080 },
            framerate: 30,
            bitrate: 2000000,
            keyframeInterval: 30,
            adaptiveBitrate: true,
          },
          bandwidth: 2500000,
          latency: 100,
        },
        constraints: {
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 },
          },
        },
        metadata: {
          timestamp: Date.now(),
          sessionId,
        },
      };

      // Act
      const result = await streamingAPI.startVideoStream(
        sessionId,
        videoRequest,
        mockContext,
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.streamId).toBe(videoRequest.id);
      expect(result.data.status).toBe("streaming");
      expect(mockLogger.info).toHaveBeenCalledWith("Starting video stream", {
        sessionId,
        streamId: videoRequest.id,
        source: videoRequest.source,
      });
    });

    it("should handle video stream start failure", async () => {
      // Arrange
      const invalidVideoRequest = {
        id: "",
        source: "invalid-source" as any,
        quality: null,
        constraints: {},
        metadata: {},
      };

      // Act
      const result = await streamingAPI.startVideoStream(
        sessionId,
        invalidVideoRequest,
        mockContext,
      );

      // Assert
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("INVALID_VIDEO_STREAM_CONFIG");
    });

    it("should adapt video quality based on network conditions", async () => {
      // Arrange
      const videoRequest = {
        id: "video-stream-adaptive",
        source: "camera" as const,
        quality: {
          level: "adaptive" as const,
          video: {
            codec: { name: "H264", mimeType: "video/mp4", bitrate: 2000000 },
            resolution: { width: 1920, height: 1080 },
            framerate: 30,
            bitrate: 2000000,
            keyframeInterval: 30,
            adaptiveBitrate: true,
          },
          bandwidth: 2500000,
          latency: 100,
        },
        constraints: { video: {} },
        metadata: { timestamp: Date.now(), sessionId },
      };

      // Mock network degradation
      const degradedContext = {
        ...mockContext,
        networkConditions: { bandwidth: { download: 500000 } },
      };

      // Act
      const result = await streamingAPI.startVideoStream(
        sessionId,
        videoRequest,
        degradedContext,
      );

      // Assert
      expect(result.success).toBe(true);
      // Quality should be automatically adapted down
      expect(result.data.adaptedQuality).toBeDefined();
    });
  });

  describe("Audio Streaming", () => {
    const sessionId = "test-session-audio";
    const mockContext = {
      sessionId,
      userId: "user-123",
      userPreferences: { qualityPriority: "balanced" },
      deviceCapabilities: { cpu: { cores: 4 } },
      networkConditions: { bandwidth: { download: 10000000 } },
      constraints: {},
      metadata: {},
    };

    beforeEach(async () => {
      await streamingAPI.initialize();
      await streamingAPI.createSession(sessionId, "audio", mockContext);
    });

    it("should start audio stream successfully", async () => {
      // Arrange
      const audioRequest = {
        id: "audio-stream-1",
        source: "microphone" as const,
        quality: {
          level: "high" as const,
          audio: {
            codec: { name: "Opus", mimeType: "audio/opus", bitrate: 128000 },
            sampleRate: 48000,
            channels: 2,
            bitrate: 128000,
            bufferSize: 1024,
          },
          bandwidth: 150000,
          latency: 50,
        },
        constraints: {
          audio: {
            sampleRate: { ideal: 48000 },
            channelCount: { ideal: 2 },
          },
        },
        processing: {
          noiseReduction: true,
          echoCancellation: true,
        },
        metadata: {
          timestamp: Date.now(),
          sessionId,
        },
      };

      // Act
      const result = await streamingAPI.startAudioStream(
        sessionId,
        audioRequest,
        mockContext,
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.streamId).toBe(audioRequest.id);
      expect(result.data.status).toBe("streaming");
      expect(mockLogger.info).toHaveBeenCalledWith("Starting audio stream", {
        sessionId,
        streamId: audioRequest.id,
        source: audioRequest.source,
      });
    });

    it("should apply audio processing filters", async () => {
      // Arrange
      const audioRequest = {
        id: "audio-stream-processed",
        source: "microphone" as const,
        quality: {
          level: "medium" as const,
          audio: {
            codec: { name: "Opus", mimeType: "audio/opus", bitrate: 96000 },
            sampleRate: 44100,
            channels: 1,
            bitrate: 96000,
            bufferSize: 512,
          },
          bandwidth: 110000,
          latency: 30,
        },
        constraints: { audio: {} },
        processing: {
          noiseReduction: true,
          echoCancellation: true,
          gainControl: true,
          voiceActivityDetection: true,
        },
        metadata: { timestamp: Date.now(), sessionId },
      };

      // Act
      const result = await streamingAPI.startAudioStream(
        sessionId,
        audioRequest,
        mockContext,
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.processingEnabled).toBe(true);
      expect(result.data.appliedFilters).toContain("noise_reduction");
      expect(result.data.appliedFilters).toContain("echo_cancellation");
    });
  });

  describe("Multi-Modal Processing", () => {
    const sessionId = "test-session-multimodal";
    const mockContext = {
      sessionId,
      userId: "user-123",
      userPreferences: { qualityPriority: "balanced" },
      deviceCapabilities: { cpu: { cores: 4 } },
      networkConditions: { bandwidth: { download: 10000000 } },
      constraints: {},
      metadata: {},
    };

    beforeEach(async () => {
      await streamingAPI.initialize();
      await streamingAPI.createSession(sessionId, "multimodal", mockContext);
    });

    it("should process multi-modal chunk successfully", async () => {
      // Arrange
      const multiModalChunk = {
        id: "chunk-001",
        type: "mixed" as const,
        timestamp: new Date(),
        sequence: 1,
        data: {
          video: Buffer.from("video-data"),
          audio: Buffer.from("audio-data"),
          text: "sample text",
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

      // Act
      const result = await streamingAPI.processMultiModalChunk(
        sessionId,
        multiModalChunk,
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.processed).toBe(true);
      expect(result.data.chunkId).toBe(multiModalChunk.id);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        "Processing multi-modal chunk",
        {
          sessionId,
          chunkId: multiModalChunk.id,
          type: multiModalChunk.type,
          sequence: multiModalChunk.sequence,
        },
      );
    });

    it("should handle synchronization across multiple chunks", async () => {
      // Arrange
      const chunks = [
        {
          id: "chunk-001",
          type: "video" as const,
          timestamp: new Date(),
          sequence: 1,
          data: { video: Buffer.from("video-1") },
          synchronization: {
            globalTimestamp: new Date(1000),
            mediaTimestamp: 1000,
            sequenceId: "seq-001",
          },
          quality: {},
          processing: {},
          metadata: {
            size: 4096,
            checksum: "video1",
            contentType: "video/mp4",
          },
        },
        {
          id: "chunk-002",
          type: "audio" as const,
          timestamp: new Date(),
          sequence: 2,
          data: { audio: Buffer.from("audio-1") },
          synchronization: {
            globalTimestamp: new Date(1000),
            mediaTimestamp: 1000,
            sequenceId: "seq-001",
          },
          quality: {},
          processing: {},
          metadata: {
            size: 2048,
            checksum: "audio1",
            contentType: "audio/opus",
          },
        },
      ];

      // Act
      const results = await Promise.all(
        chunks.map((chunk) =>
          streamingAPI.processMultiModalChunk(sessionId, chunk),
        ),
      );

      // Assert
      expect(results.every((result) => result.success)).toBe(true);
      expect(results[0].data.synchronizationGroup).toBe(
        results[1].data.synchronizationGroup,
      );
    });
  });

  describe("Quality Adaptation", () => {
    const sessionId = "test-session-adaptation";
    const mockContext = {
      sessionId,
      userId: "user-123",
      userPreferences: { qualityPriority: "balanced" },
      deviceCapabilities: { cpu: { cores: 4 } },
      networkConditions: { bandwidth: { download: 10000000 } },
      constraints: {},
      metadata: {},
    };

    beforeEach(async () => {
      await streamingAPI.initialize();
      await streamingAPI.createSession(sessionId, "video", mockContext);
    });

    it("should adapt quality based on network conditions", async () => {
      // Arrange
      const adaptationRequest = {
        sessionId,
        targetQuality: "adaptive" as const,
        networkConditions: {
          bandwidth: { download: 1000000 }, // Reduced bandwidth
          latency: { rtt: 150 }, // Increased latency
          quality: { packetLoss: 0.02 }, // Some packet loss
        },
        deviceConstraints: {
          cpu: { usage: 80 }, // High CPU usage
          memory: { usage: 70 },
        },
        preferences: {
          prioritizeLatency: true,
          maxBitrate: 1500000,
        },
      };

      // Act
      const result = await streamingAPI.adaptQuality(adaptationRequest);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.adaptedQuality).toBeDefined();
      expect(result.data.adaptedQuality.level).toBe("medium");
      expect(result.data.adaptationReason).toContain("network_conditions");
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Adapting stream quality",
        expect.objectContaining({
          sessionId,
          targetQuality: "adaptive",
          adaptedTo: "medium",
        }),
      );
    });

    it("should maintain quality when conditions are optimal", async () => {
      // Arrange
      const adaptationRequest = {
        sessionId,
        targetQuality: "high" as const,
        networkConditions: {
          bandwidth: { download: 50000000 }, // High bandwidth
          latency: { rtt: 20 }, // Low latency
          quality: { packetLoss: 0.001 }, // Minimal packet loss
        },
        deviceConstraints: {
          cpu: { usage: 30 }, // Low CPU usage
          memory: { usage: 40 },
        },
        preferences: {
          prioritizeQuality: true,
        },
      };

      // Act
      const result = await streamingAPI.adaptQuality(adaptationRequest);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.adaptedQuality.level).toBe("high");
      expect(result.data.adaptationReason).toBe("optimal_conditions");
    });
  });

  describe("Error Handling", () => {
    beforeEach(async () => {
      await streamingAPI.initialize();
    });

    it("should handle network disconnection gracefully", async () => {
      // Arrange
      const sessionId = "test-session-disconnect";
      await streamingAPI.createSession(sessionId, "video", {} as any);

      // Simulate network disconnection
      const networkError = new Error("Network disconnected");

      // Act
      const eventSpy = jest.fn();
      streamingAPI.on("connection:lost", eventSpy);
      streamingAPI.emit("connection:lost", { sessionId, error: networkError });

      // Assert
      expect(eventSpy).toHaveBeenCalledWith({ sessionId, error: networkError });
    });

    it("should implement circuit breaker for repeated failures", async () => {
      // Arrange
      const sessionId = "test-session-failures";

      // Simulate repeated failures
      const failingOperation = jest
        .fn()
        .mockRejectedValue(new Error("Service unavailable"));

      // Act - Attempt multiple operations that fail
      const results = await Promise.all([
        streamingAPI
          .createSession(sessionId + "1", "video", {} as any)
          .catch((e) => ({ error: e })),
        streamingAPI
          .createSession(sessionId + "2", "video", {} as any)
          .catch((e) => ({ error: e })),
        streamingAPI
          .createSession(sessionId + "3", "video", {} as any)
          .catch((e) => ({ error: e })),
        streamingAPI
          .createSession(sessionId + "4", "video", {} as any)
          .catch((e) => ({ error: e })),
        streamingAPI
          .createSession(sessionId + "5", "video", {} as any)
          .catch((e) => ({ error: e })),
      ]);

      // Assert - Should eventually trigger circuit breaker
      const errorResults = results.filter((r) => "error" in r);
      expect(errorResults.length).toBeGreaterThan(0);
    });

    it("should retry failed operations with exponential backoff", async () => {
      // Arrange
      const sessionId = "test-session-retry";
      let attemptCount = 0;

      // Mock a function that fails twice then succeeds
      const flakyOperation = jest.fn().mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error("Temporary failure");
        }
        return { success: true, data: { id: sessionId } };
      });

      // Act
      const result = await streamingAPI.createSession(
        sessionId,
        "video",
        {} as any,
      );

      // Assert - Should eventually succeed after retries
      expect(result.success).toBe(true);
    });
  });

  describe("Performance Metrics", () => {
    beforeEach(async () => {
      await streamingAPI.initialize();
    });

    it("should collect streaming performance metrics", async () => {
      // Arrange
      const sessionId = "test-session-metrics";
      await streamingAPI.createSession(sessionId, "video", {} as any);

      // Act
      const metrics = await streamingAPI.getStreamingMetrics(sessionId);

      // Assert
      expect(metrics.success).toBe(true);
      expect(metrics.data).toBeDefined();
      expect(metrics.data.sessionId).toBe(sessionId);
      expect(metrics.data.performance).toBeDefined();
      expect(metrics.data.performance.latency).toBeDefined();
      expect(metrics.data.performance.throughput).toBeDefined();
      expect(metrics.data.performance.quality).toBeDefined();
    });

    it("should track quality adaptation events", async () => {
      // Arrange
      const sessionId = "test-session-quality-metrics";
      await streamingAPI.createSession(sessionId, "video", {} as any);

      // Perform quality adaptations
      await streamingAPI.adaptQuality({
        sessionId,
        targetQuality: "medium",
        networkConditions: { bandwidth: { download: 1000000 } },
        deviceConstraints: {},
        preferences: {},
      });

      // Act
      const metrics = await streamingAPI.getStreamingMetrics(sessionId);

      // Assert
      expect(metrics.data.qualityAdaptations).toBeGreaterThan(0);
      expect(metrics.data.adaptationHistory).toBeDefined();
      expect(Array.isArray(metrics.data.adaptationHistory)).toBe(true);
    });
  });

  describe("Cleanup and Resource Management", () => {
    it("should cleanup resources on shutdown", async () => {
      // Arrange
      await streamingAPI.initialize();
      const sessionId1 = "session-1";
      const sessionId2 = "session-2";

      await streamingAPI.createSession(sessionId1, "video", {} as any);
      await streamingAPI.createSession(sessionId2, "audio", {} as any);

      // Act
      await streamingAPI.shutdown();

      // Assert
      expect(mockUnifiedAPI.shutdown).toHaveBeenCalled();
      expect(mockLogger.info).toHaveBeenCalledWith(
        "Enhanced Streaming API shutdown complete",
      );
    });

    it("should handle graceful session termination", async () => {
      // Arrange
      await streamingAPI.initialize();
      const sessionId = "test-session-terminate";
      await streamingAPI.createSession(sessionId, "multimodal", {} as any);

      // Act
      const result = await streamingAPI.endSession(sessionId);

      // Assert
      expect(result.success).toBe(true);
      expect(mockLogger.info).toHaveBeenCalledWith("Ending streaming session", {
        sessionId,
      });
    });
  });
});
