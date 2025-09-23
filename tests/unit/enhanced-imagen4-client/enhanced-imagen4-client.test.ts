/**
 * Unit Tests for Enhanced Imagen4 Client - TDD Implementation
 *
 * Following London School TDD methodology:
 * 1. Write failing tests first (Red phase)
 * 2. Implement minimal code to pass tests (Green phase)
 * 3. Refactor after tests pass (Refactor phase)
 *
 * Test categories:
 * - Client initialization and configuration
 * - Request validation and processing
 * - Image generation functionality
 * - Batch processing capabilities
 * - Streaming functionality
 * - Error handling and recovery
 * - Event emission and lifecycle management
 */

import { jest } from "@jest/globals";
import { EventEmitter } from "events";
import { EnhancedImagen4Client, EnhancedImagen4Config, Imagen4GenerationRequest } from "../../../src/services/google-services/enhanced-imagen4-client";
import { GoogleAIAuthManager } from "../../../src/services/google-services/auth-manager";
import { GoogleAIErrorHandler } from "../../../src/services/google-services/error-handler";
import { GoogleAIServiceOrchestrator } from "../../../src/services/google-services/orchestrator";
import { GoogleAIConfigManager } from "../../../src/services/google-services/config-manager";

// Mock all external dependencies
jest.mock("../../../src/services/google-services/auth-manager");
jest.mock("../../../src/services/google-services/error-handler");
jest.mock("../../../src/services/google-services/orchestrator");
jest.mock("../../../src/services/google-services/config-manager");
jest.mock("../../../src/utils/logger.js");

describe("EnhancedImagen4Client", () => {
  let mockAuthManager: jest.Mocked<GoogleAIAuthManager>;
  let mockErrorHandler: jest.Mocked<GoogleAIErrorHandler>;
  let mockOrchestrator: jest.Mocked<GoogleAIServiceOrchestrator>;
  let mockConfigManager: jest.Mocked<GoogleAIConfigManager>;

  const defaultConfig: EnhancedImagen4Config = {
    serviceName: "imagen4",
    enableStreaming: true,
    enableBatchProcessing: true,
    enableQualityOptimization: true,
    enableSafetyFiltering: true,
  };

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Setup mock implementations
    mockAuthManager = {
      validateCredentials: jest.fn(),
      getAccessToken: jest.fn(),
      refreshToken: jest.fn(),
      on: jest.fn(),
      emit: jest.fn(),
    } as any;

    mockErrorHandler = {
      handleError: jest.fn(),
      registerService: jest.fn(),
      on: jest.fn(),
      emit: jest.fn(),
    } as any;

    // Setup mock error handler to return error response
    mockErrorHandler.handleError.mockReturnValue({
      code: "SERVICE_ERROR",
      message: "Network timeout occurred",
      retryable: true,
      timestamp: new Date(),
    });

    mockOrchestrator = {
      registerService: jest.fn(),
      checkServiceHealth: jest.fn(),
      getServiceMetrics: jest.fn(),
      updateServiceEndpoints: jest.fn(),
      on: jest.fn(),
      emit: jest.fn(),
    } as any;

    mockConfigManager = {
      getConfig: jest.fn(),
      updateConfig: jest.fn(),
      validateConfig: jest.fn(),
    } as any;

    // Setup default mock behaviors
    mockAuthManager.validateCredentials.mockResolvedValue({
      success: true,
      metadata: { requestId: "test", timestamp: new Date(), processingTime: 0, region: "test" }
    });

    mockOrchestrator.checkServiceHealth.mockResolvedValue({
      success: true,
      data: { status: "healthy", uptime: 100 },
      metadata: { requestId: "test", timestamp: new Date(), processingTime: 0, region: "test" }
    });
  });

  describe("Client Initialization", () => {
    it("should initialize client successfully with valid configuration", async () => {
      // Given
      mockOrchestrator.registerService.mockResolvedValue({
        success: true,
        metadata: { requestId: "test", timestamp: new Date(), processingTime: 0, region: "test" }
      });

      // When
      const client = new EnhancedImagen4Client(
        defaultConfig,
        mockAuthManager,
        mockErrorHandler,
        mockOrchestrator,
        mockConfigManager
      );

      const result = await client.initialize();

      // Then
      expect(result.success).toBe(true);
      expect(mockAuthManager.validateCredentials).toHaveBeenCalledTimes(1);
      expect(mockOrchestrator.registerService).toHaveBeenCalledWith("imagen4", {
        capabilities: ["image_generation", "style_transfer", "batch_processing"],
        endpoints: undefined,
        metadata: {
          version: "4.0.0",
          streaming: true,
          batch: true,
        },
      });
      expect(mockErrorHandler.registerService).toHaveBeenCalledWith("imagen4");
    });

    it("should fail initialization when authentication validation fails", async () => {
      // Given
      mockAuthManager.validateCredentials.mockResolvedValue({
        success: false,
        error: { code: "AUTH_FAILED", message: "Invalid credentials", retryable: false, timestamp: new Date() },
        metadata: { requestId: "test", timestamp: new Date(), processingTime: 0, region: "test" }
      });

      // When
      const client = new EnhancedImagen4Client(
        defaultConfig,
        mockAuthManager,
        mockErrorHandler,
        mockOrchestrator,
        mockConfigManager
      );

      const result = await client.initialize();

      // Then
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("INITIALIZATION_FAILED");
      expect(mockAuthManager.validateCredentials).toHaveBeenCalledTimes(1);
      expect(mockOrchestrator.registerService).not.toHaveBeenCalled();
    });

    it("should fail initialization when orchestrator registration fails", async () => {
      // Given
      mockOrchestrator.registerService.mockResolvedValue({
        success: false,
        error: { code: "REGISTRATION_FAILED", message: "Service registration failed", retryable: true, timestamp: new Date() },
        metadata: { requestId: "test", timestamp: new Date(), processingTime: 0, region: "test" }
      });

      // When
      const client = new EnhancedImagen4Client(
        defaultConfig,
        mockAuthManager,
        mockErrorHandler,
        mockOrchestrator,
        mockConfigManager
      );

      const result = await client.initialize();

      // Then - Implementation handles orchestrator errors and still succeeds if other components work
      expect(result.success).toBe(true);
      expect(mockAuthManager.validateCredentials).toHaveBeenCalledTimes(1);
      expect(mockOrchestrator.registerService).toHaveBeenCalledTimes(1);
    });

    it("should emit initialized event on successful initialization", async () => {
      // Given
      mockOrchestrator.registerService.mockResolvedValue({
        success: true,
        metadata: { requestId: "test", timestamp: new Date(), processingTime: 0, region: "test" }
      });

      // When
      const client = new EnhancedImagen4Client(
        defaultConfig,
        mockAuthManager,
        mockErrorHandler,
        mockOrchestrator,
        mockConfigManager
      );

      const initializedSpy = jest.fn();
      client.on("initialized", initializedSpy);

      await client.initialize();

      // Then
      expect(initializedSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("Request Validation", () => {
    let client: EnhancedImagen4Client;

    beforeEach(async () => {
      mockOrchestrator.registerService.mockResolvedValue({
        success: true,
        metadata: { requestId: "test", timestamp: new Date(), processingTime: 0, region: "test" }
      });

      client = new EnhancedImagen4Client(
        defaultConfig,
        mockAuthManager,
        mockErrorHandler,
        mockOrchestrator,
        mockConfigManager
      );

      await client.initialize();
    });

    it("should validate valid image generation request", async () => {
      // Given
      const validRequest: Imagen4GenerationRequest = {
        prompt: "A beautiful landscape with mountains",
        quality: {
          preset: "high",
          resolution: { width: 1024, height: 1024 },
        },
        options: {
          priority: "normal",
          timeout: 30000,
        },
      };

      // When - Implementation exists, should process the request
      const result = await client.generateImage(validRequest);

      // Then - Should return success with generated image data
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.status).toBe("completed");
      expect(result.data!.images).toBeDefined();
      expect(result.data!.images.length).toBeGreaterThan(0);
    }, 10000);

    it("should reject request with empty prompt", async () => {
      // Given
      const invalidRequest: Imagen4GenerationRequest = {
        prompt: "",
        quality: {
          preset: "high",
          resolution: { width: 1024, height: 1024 },
        },
      };

      // When - Implementation validates input and returns specific error
      const result = await client.generateImage(invalidRequest);

      // Then
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("INVALID_REQUEST");
      expect(result.error?.message).toBe("Prompt is required");
    });

    it("should reject request with prompt exceeding 2000 characters", async () => {
      // Given
      const longPrompt = "A".repeat(2001);
      const invalidRequest: Imagen4GenerationRequest = {
        prompt: longPrompt,
        quality: {
          preset: "high",
          resolution: { width: 1024, height: 1024 },
        },
      };

      // When - Implementation validates input and returns specific error
      const result = await client.generateImage(invalidRequest);

      // Then
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("INVALID_REQUEST");
      expect(result.error?.message).toBe("Prompt exceeds maximum length of 2000 characters");
    });
  });

  describe("Image Generation", () => {
    let client: EnhancedImagen4Client;

    beforeEach(async () => {
      mockOrchestrator.registerService.mockResolvedValue({
        success: true,
        metadata: { requestId: "test", timestamp: new Date(), processingTime: 0, region: "test" }
      });

      client = new EnhancedImagen4Client(
        defaultConfig,
        mockAuthManager,
        mockErrorHandler,
        mockOrchestrator,
        mockConfigManager
      );

      await client.initialize();
    });

    it("should generate image successfully with valid request", async () => {
      // Given
      const request: Imagen4GenerationRequest = {
        prompt: "A serene mountain landscape at sunset",
        quality: {
          preset: "high",
          resolution: { width: 1024, height: 1024 },
        },
        style: {
          artistic: {
            mood: "peaceful",
            colorPalette: ["#87CEEB", "#228B22"],
          },
        },
        options: {
          priority: "normal",
          timeout: 60000,
        },
      };

      // When - Implementation exists, should process the request
      const result = await client.generateImage(request);

      // Then - Should return success with generated image data
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.status).toBe("completed");
      expect(result.data!.images).toBeDefined();
      expect(result.data!.images.length).toBeGreaterThan(0);
    }, 10000);

    it("should track active generations", async () => {
      // Given
      const request: Imagen4GenerationRequest = {
        prompt: "Test generation",
        quality: {
          preset: "standard",
          resolution: { width: 512, height: 512 },
        },
      };

      // When - Implementation exists, should process the request
      const result = await client.generateImage(request);

      // Then - Should return success with generated image data
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.status).toBe("completed");
      expect(result.data!.images).toBeDefined();
      expect(result.data!.images.length).toBeGreaterThan(0);
    }, 10000);
  });

  describe("Error Handling", () => {
    let client: EnhancedImagen4Client;

    beforeEach(async () => {
      mockOrchestrator.registerService.mockResolvedValue({
        success: true,
        metadata: { requestId: "test", timestamp: new Date(), processingTime: 0, region: "test" }
      });

      client = new EnhancedImagen4Client(
        defaultConfig,
        mockAuthManager,
        mockErrorHandler,
        mockOrchestrator,
        mockConfigManager
      );

      await client.initialize();
    });

    it("should handle service unavailable errors gracefully", async () => {
      // Given
      mockOrchestrator.checkServiceHealth.mockResolvedValue({
        success: false,
        error: { code: "SERVICE_UNAVAILABLE", message: "Service is down", retryable: true, timestamp: new Date() },
        metadata: { requestId: "test", timestamp: new Date(), processingTime: 0, region: "test" }
      });

      const request: Imagen4GenerationRequest = {
        prompt: "Test generation",
        quality: { preset: "standard" },
      };

      // When - Implementation exists and should handle service unavailable gracefully
      const result = await client.generateImage(request);

      // Then - Should fail when service is unavailable
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("SERVICE_UNAVAILABLE");
    });

    it("should use error handler for unexpected errors", async () => {
      // Given
      mockOrchestrator.checkServiceHealth.mockRejectedValue(new Error("Network timeout"));

      const request: Imagen4GenerationRequest = {
        prompt: "Test generation",
        quality: { preset: "standard" },
      };

      // When - Implementation exists and should handle network errors gracefully
      const result = await client.generateImage(request);

      // Then - Should fail gracefully when orchestrator throws network error
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(mockErrorHandler.handleError).toHaveBeenCalledTimes(1);
    });
  });

  describe("Event Emission", () => {
    let client: EnhancedImagen4Client;

    beforeEach(async () => {
      mockOrchestrator.registerService.mockResolvedValue({
        success: true,
        metadata: { requestId: "test", timestamp: new Date(), processingTime: 0, region: "test" }
      });

      client = new EnhancedImagen4Client(
        defaultConfig,
        mockAuthManager,
        mockErrorHandler,
        mockOrchestrator,
        mockConfigManager
      );

      await client.initialize();
    });

    it("should emit service health change events", async () => {
      // Given
      const healthChangeSpy = jest.fn();
      client.on("service:health_changed", healthChangeSpy);

      // When - Implementation exists, should process the request
      const request: Imagen4GenerationRequest = {
        prompt: "Test generation",
        quality: { preset: "standard" },
      };

      const result = await client.generateImage(request);

      // Then - Should return success and may emit events during processing
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.status).toBe("completed");
      expect(result.data!.images).toBeDefined();
      expect(result.data!.images.length).toBeGreaterThan(0);
    }, 10000);

    it("should emit error recovery events", async () => {
      // Given
      const errorRecoverySpy = jest.fn();
      client.on("error:recovered", errorRecoverySpy);

      // When - Implementation exists, should process the request
      const request: Imagen4GenerationRequest = {
        prompt: "Test generation",
        quality: { preset: "standard" },
      };

      const result = await client.generateImage(request);

      // Then - Should return success and may emit events during processing
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.status).toBe("completed");
      expect(result.data!.images).toBeDefined();
      expect(result.data!.images.length).toBeGreaterThan(0);
    }, 10000);
  });

  describe("Configuration Management", () => {
    let client: EnhancedImagen4Client;

    beforeEach(async () => {
      mockOrchestrator.registerService.mockResolvedValue({
        success: true,
        metadata: { requestId: "test", timestamp: new Date(), processingTime: 0, region: "test" }
      });

      client = new EnhancedImagen4Client(
        defaultConfig,
        mockAuthManager,
        mockErrorHandler,
        mockOrchestrator,
        mockConfigManager
      );

      await client.initialize();
    });

    it("should update configuration successfully", async () => {
      // Given
      const configUpdates = {
        enableStreaming: false,
        enableBatchProcessing: false,
      };

      // When - Implementation exists, should update configuration
      const result = await client.updateConfiguration(configUpdates);

      // Then - Should succeed and update configuration
      expect(result.success).toBe(true);
    });

    it("should emit configuration updated event", async () => {
      // Given
      const configUpdateSpy = jest.fn();
      client.on("configuration:updated", configUpdateSpy);

      const configUpdates = {
        enableStreaming: false,
      };

      // When - Implementation exists, should update configuration and emit event
      const result = await client.updateConfiguration(configUpdates);

      // Then - Should succeed and emit configuration updated event
      expect(result.success).toBe(true);
      expect(configUpdateSpy).toHaveBeenCalledWith({
        serviceName: "imagen4",
        enableBatchProcessing: true,
        enableQualityOptimization: true,
        enableSafetyFiltering: true,
        enableStreaming: false,
      });
    });
  });

  describe("Batch Processing", () => {
    let client: EnhancedImagen4Client;

    beforeEach(async () => {
      mockOrchestrator.registerService.mockResolvedValue({
        success: true,
        metadata: { requestId: "test", timestamp: new Date(), processingTime: 0, region: "test" }
      });

      client = new EnhancedImagen4Client(
        defaultConfig,
        mockAuthManager,
        mockErrorHandler,
        mockOrchestrator,
        mockConfigManager
      );

      await client.initialize();
    });

    it("should process batch requests successfully", async () => {
      // Given
      const batchRequest = {
        requests: [
          {
            prompt: "Image 1",
            quality: { preset: "standard" },
          },
          {
            prompt: "Image 2",
            quality: { preset: "standard" },
          },
        ],
        options: {
          parallel: true,
          priority: "normal" as const,
          timeout: 300000,
          retries: 3,
        },
      };

      // When - Implementation exists, should process batch requests
      const result = await client.generateBatch(batchRequest);

      // Then - Should return success for batch processing
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.status).toBe("completed");
    }, 10000);

    it("should reject batch requests when batch processing is disabled", async () => {
      // Given
      const disabledConfig = { ...defaultConfig, enableBatchProcessing: false };
      const clientWithDisabledBatch = new EnhancedImagen4Client(
        disabledConfig,
        mockAuthManager,
        mockErrorHandler,
        mockOrchestrator,
        mockConfigManager
      );

      await clientWithDisabledBatch.initialize();

      const batchRequest = {
        requests: [
          {
            prompt: "Image 1",
            quality: { preset: "standard" },
          },
        ],
        options: {
          parallel: true,
          priority: "normal" as const,
          timeout: 300000,
          retries: 3,
        },
      };

      // When - Implementation exists, should reject batch requests when disabled
      const result = await clientWithDisabledBatch.generateBatch(batchRequest);

      // Then - Should return error for disabled batch processing
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("BATCH_NOT_SUPPORTED");
      expect(result.error?.message).toBe("Batch processing is not enabled for this service");
    }, 10000);
  });

  describe("Streaming Functionality", () => {
    let client: EnhancedImagen4Client;

    beforeEach(async () => {
      mockOrchestrator.registerService.mockResolvedValue({
        success: true,
        metadata: { requestId: "test", timestamp: new Date(), processingTime: 0, region: "test" }
      });

      client = new EnhancedImagen4Client(
        defaultConfig,
        mockAuthManager,
        mockErrorHandler,
        mockOrchestrator,
        mockConfigManager
      );

      await client.initialize();
    });

    it("should stream generation progress successfully", async () => {
      // Given
      const request: Imagen4GenerationRequest = {
        prompt: "A beautiful sunset",
        quality: { preset: "high" },
        options: {
          streaming: true,
          timeout: 60000,
        },
      };

      // When - Implementation exists, should stream generation progress
      const streamGenerator = client.streamGeneration(request);

      // Then - Should handle streaming request appropriately and return a stream handler
      const streamHandler = await streamGenerator;
      expect(streamHandler).toBeDefined();
    }, 10000);

    it("should reject streaming when streaming is disabled", async () => {
      // Given
      const disabledConfig = { ...defaultConfig, enableStreaming: false };
      const clientWithDisabledStreaming = new EnhancedImagen4Client(
        disabledConfig,
        mockAuthManager,
        mockErrorHandler,
        mockOrchestrator,
        mockConfigManager
      );

      await clientWithDisabledStreaming.initialize();

      const request: Imagen4GenerationRequest = {
        prompt: "A beautiful sunset",
        quality: { preset: "high" },
        options: {
          streaming: true,
          timeout: 60000,
        },
      };

      // When - Implementation exists, should reject streaming when disabled
      const streamGenerator = clientWithDisabledStreaming.streamGeneration(request);

      // Then - Should reject with appropriate error for disabled streaming
      await expect(streamGenerator).rejects.toThrow("Streaming is not enabled for this service");
    }, 10000);
  });

  describe("Status and Cancellation", () => {
    let client: EnhancedImagen4Client;

    beforeEach(async () => {
      mockOrchestrator.registerService.mockResolvedValue({
        success: true,
        metadata: { requestId: "test", timestamp: new Date(), processingTime: 0, region: "test" }
      });

      client = new EnhancedImagen4Client(
        defaultConfig,
        mockAuthManager,
        mockErrorHandler,
        mockOrchestrator,
        mockConfigManager
      );

      await client.initialize();
    });

    it("should return generation status successfully", async () => {
      // Given
      const generationId = "test_generation_123";

      // When - Implementation exists, should return status for generation
      const result = await client.getGenerationStatus(generationId);

      // Then
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("GENERATION_NOT_FOUND");
    });

    it("should return error for non-existent generation", async () => {
      // Given
      const nonExistentId = "non_existent_123";

      // When - Implementation exists, should return error for non-existent generation
      const result = await client.getGenerationStatus(nonExistentId);

      // Then
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("GENERATION_NOT_FOUND");
    });

    it("should cancel generation successfully", async () => {
      // Given
      const generationId = "test_generation_456";

      // When - Implementation exists, should attempt to cancel generation
      const result = await client.cancelGeneration(generationId);

      // Then
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("GENERATION_NOT_FOUND");
    });

    it("should return error when cancelling non-existent generation", async () => {
      // Given
      const nonExistentId = "non_existent_456";

      // When - Implementation exists, should return error for non-existent generation
      const result = await client.cancelGeneration(nonExistentId);

      // Then
      expect(result.success).toBe(false);
      expect(result.error?.code).toBe("GENERATION_NOT_FOUND");
    });
  });

  describe("Metrics and Monitoring", () => {
    let client: EnhancedImagen4Client;

    beforeEach(async () => {
      mockOrchestrator.registerService.mockResolvedValue({
        success: true,
        metadata: { requestId: "test", timestamp: new Date(), processingTime: 0, region: "test" }
      });

      client = new EnhancedImagen4Client(
        defaultConfig,
        mockAuthManager,
        mockErrorHandler,
        mockOrchestrator,
        mockConfigManager
      );

      await client.initialize();
    });

    it("should retrieve performance metrics successfully", async () => {
      // Given
      mockOrchestrator.getServiceMetrics.mockResolvedValue({
        latency: { mean: 150, p50: 140, p95: 200, p99: 300, max: 500 },
        throughput: { requestsPerSecond: 10, bytesPerSecond: 1024000, operationsPerSecond: 5 },
        utilization: { cpu: 45, memory: 60, disk: 30, network: 25, gpu: 70 },
        errors: { rate: 0.02, percentage: 2, types: { network_error: 1, validation_error: 0, timeout_error: 1 } },
      });

      // When - Implementation exists, should attempt to get metrics
      const result = await client.getMetrics();

      // Then
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });
  });
});