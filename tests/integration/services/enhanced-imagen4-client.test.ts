/**
 * Integration Tests for Enhanced Imagen4 Client
 *
 * Tests the interaction between the Imagen4 client and its dependencies:
 * - GoogleAIAuthManager
 * - GoogleAIErrorHandler
 * - GoogleAIServiceOrchestrator
 * - GoogleAIConfigManager
 *
 * These tests verify end-to-end workflows and component collaboration.
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { EventEmitter } from 'events';
import { EnhancedImagen4Client } from '../../../src/services/google-services/enhanced-imagen4-client.js';
import { GoogleAIAuthManager } from '../../../src/services/google-services/auth-manager.js';
import { GoogleAIErrorHandler } from '../../../src/services/google-services/error-handler.js';
import { GoogleAIServiceOrchestrator } from '../../../src/services/google-services/orchestrator.js';
import { GoogleAIConfigManager } from '../../../src/services/google-services/config-manager.js';

// Mock implementations for integration testing
class MockAuthManager extends EventEmitter {
  async validateCredentials() {
    return { success: true };
  }

  async refreshToken() {
    return { success: true };
  }
}

class MockErrorHandler extends EventEmitter {
  handleError(error: any, context: any) {
    return {
      code: 'MOCK_ERROR',
      message: error.message || 'Mock error',
      retryable: false,
      timestamp: new Date(),
    };
  }

  registerService(serviceName: string) {
    // Mock implementation
  }
}

class MockOrchestrator extends EventEmitter {
  async registerService(serviceName: string, config: any) {
    return { success: true };
  }

  async checkServiceHealth(serviceName: string) {
    return { success: true };
  }

  async getServiceMetrics(serviceName: string) {
    return {
      requestsPerSecond: 10,
      averageLatency: 500,
      errorRate: 0.01,
      uptime: 99.9,
    };
  }

  async updateServiceEndpoints(serviceName: string, endpoints: any) {
    return { success: true };
  }
}

class MockConfigManager {
  async getConfig(serviceName: string) {
    return {
      serviceName,
      apiKey: 'mock-api-key',
      endpoint: 'https://mock-endpoint.com',
      timeout: 30000,
    };
  }

  async updateConfig(serviceName: string, updates: any) {
    return { success: true };
  }
}

describe('EnhancedImagen4Client Integration', () => {
  let client: EnhancedImagen4Client;
  let mockAuthManager: MockAuthManager;
  let mockErrorHandler: MockErrorHandler;
  let mockOrchestrator: MockOrchestrator;
  let mockConfigManager: MockConfigManager;

  const defaultConfig = {
    serviceName: "imagen4",
    enableStreaming: true,
    enableBatchProcessing: true,
    enableQualityOptimization: true,
    enableSafetyFiltering: true,
  };

  beforeEach(async () => {
    // Initialize mocks
    mockAuthManager = new MockAuthManager();
    mockErrorHandler = new MockErrorHandler();
    mockOrchestrator = new MockOrchestrator();
    mockConfigManager = new MockConfigManager();

    // Create client
    client = new EnhancedImagen4Client(
      defaultConfig,
      mockAuthManager,
      mockErrorHandler,
      mockOrchestrator,
      mockConfigManager
    );

    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 10));
  });

  afterEach(() => {
    if (client) {
      // Cleanup any active generations
      client.removeAllListeners();
    }
  });

  describe('Client Initialization Integration', () => {
    test('should initialize successfully with all dependencies', async () => {
      // This test will fail initially - we need to implement the initialization logic
      const result = await client.initialize();

      expect(result.success).toBe(true);
      expect(result.metadata).toBeDefined();
      expect(result.metadata.requestId).toMatch(/^req_/);
      expect(result.metadata.timestamp).toBeInstanceOf(Date);
    });

    test('should handle authentication failure during initialization', async () => {
      // Mock authentication failure
      mockAuthManager.validateCredentials = jest.fn().mockResolvedValue({
        success: false,
        error: { code: 'AUTH_FAILED', message: 'Invalid credentials' }
      });

      const result = await client.initialize();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INITIALIZATION_FAILED');
      expect(result.error?.message).toContain('Authentication validation failed');
    });

    test('should register with orchestrator during initialization', async () => {
      const registerSpy = jest.spyOn(mockOrchestrator, 'registerService');

      await client.initialize();

      expect(registerSpy).toHaveBeenCalledWith('imagen4', {
        capabilities: ['image_generation', 'style_transfer', 'batch_processing'],
        endpoints: undefined,
        metadata: {
          version: '4.0.0',
          streaming: true,
          batch: true,
        },
      });
    });

    test('should emit initialized event after successful setup', async () => {
      const initializedSpy = jest.fn();
      client.on('initialized', initializedSpy);

      await client.initialize();

      expect(initializedSpy).toHaveBeenCalled();
    });
  });

  describe('Image Generation Integration', () => {
    test('should successfully generate image with all dependencies', async () => {
      const request = {
        prompt: 'A beautiful sunset over mountains',
        quality: { preset: 'standard' as const },
        options: { priority: 'normal' as const }
      };

      const result = await client.generateImage(request);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toMatch(/^img4_/);
      expect(result.data?.status).toBe('completed');
      expect(result.data?.images).toHaveLength(1);
      expect(result.metadata?.requestId).toMatch(/^req_/);
    });

    test('should validate request through orchestrator health check', async () => {
      const healthCheckSpy = jest.spyOn(mockOrchestrator, 'checkServiceHealth');

      const request = {
        prompt: 'Test prompt',
        quality: { preset: 'standard' as const }
      };

      await client.generateImage(request);

      expect(healthCheckSpy).toHaveBeenCalledWith('imagen4');
    });

    test('should handle orchestrator service unavailable', async () => {
      // Mock service unavailable
      mockOrchestrator.checkServiceHealth = jest.fn().mockResolvedValue({
        success: false,
        error: { code: 'SERVICE_DOWN', message: 'Service unavailable' }
      });

      const request = {
        prompt: 'Test prompt',
        quality: { preset: 'standard' as const }
      };

      const result = await client.generateImage(request);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SERVICE_UNAVAILABLE');
      expect(result.error?.message).toBe('Imagen4 service is not available');
    });

    test('should emit progress events during generation', async () => {
      const progressSpy = jest.fn();
      client.on('generation:progress', progressSpy);

      const request = {
        prompt: 'Test prompt for progress tracking',
        quality: { preset: 'standard' as const }
      };

      await client.generateImage(request);

      // Should emit multiple progress events
      expect(progressSpy).toHaveBeenCalled();
      const progressCalls = progressSpy.mock.calls;
      expect(progressCalls.length).toBeGreaterThan(1);

      // Progress should increase over time
      const firstProgress = progressCalls[0][0].progress;
      const lastProgress = progressCalls[progressCalls.length - 1][0].progress;
      expect(lastProgress).toBeGreaterThan(firstProgress);
    });

    test('should emit completion event when generation finishes', async () => {
      const completionSpy = jest.fn();
      client.on('generation:completed', completionSpy);

      const request = {
        prompt: 'Test completion event',
        quality: { preset: 'standard' as const }
      };

      await client.generateImage(request);

      expect(completionSpy).toHaveBeenCalled();
      const completionData = completionSpy.mock.calls[0][0];
      expect(completionData.generationId).toMatch(/^img4_/);
      expect(completionData.response).toBeDefined();
      expect(completionData.response.status).toBe('completed');
    });

    test('should handle errors through error handler integration', async () => {
      const handleErrorSpy = jest.spyOn(mockErrorHandler, 'handleError');

      // Create a request that will cause an error
      const request = {
        prompt: '', // Invalid empty prompt
        quality: { preset: 'standard' as const }
      };

      await client.generateImage(request);

      expect(handleErrorSpy).toHaveBeenCalled();
      const errorCall = handleErrorSpy.mock.calls[0];
      expect(errorCall[1]).toMatchObject({
        service: 'imagen4',
        operation: 'generateImage',
      });
    });
  });

  describe('Batch Processing Integration', () => {
    test('should process batch requests with orchestrator coordination', async () => {
      const batchRequest = {
        requests: [
          {
            prompt: 'First image',
            quality: { preset: 'standard' as const }
          },
          {
            prompt: 'Second image',
            quality: { preset: 'standard' as const }
          }
        ],
        options: { parallel: true, priority: 'normal' as const }
      };

      const result = await client.generateBatch(batchRequest);

      expect(result.success).toBe(true);
      expect(result.data?.id).toMatch(/^batch_/);
      expect(result.data?.responses).toHaveLength(2);
      expect(result.data?.summary.total).toBe(2);
      expect(result.data?.summary.completed).toBe(2);
    });

    test('should handle batch processing errors gracefully', async () => {
      const batchRequest = {
        requests: [
          {
            prompt: 'Valid prompt',
            quality: { preset: 'standard' as const }
          },
          {
            prompt: '', // Invalid empty prompt
            quality: { preset: 'standard' as const }
          }
        ],
        options: { parallel: true, priority: 'normal' as const }
      };

      const result = await client.generateBatch(batchRequest);

      expect(result.success).toBe(true);
      expect(result.data?.summary.total).toBe(2);
      expect(result.data?.summary.completed).toBe(1);
      expect(result.data?.summary.failed).toBe(1);
    });

    test('should validate batch requests before processing', async () => {
      const batchRequest = {
        requests: [], // Empty batch should fail validation
        options: { parallel: true, priority: 'normal' as const }
      };

      const result = await client.generateBatch(batchRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_BATCH');
    });

    test('should respect batch processing configuration', async () => {
      // Disable batch processing
      const configWithoutBatch = { ...defaultConfig, enableBatchProcessing: false };
      const clientWithoutBatch = new EnhancedImagen4Client(
        configWithoutBatch,
        mockAuthManager,
        mockErrorHandler,
        mockOrchestrator,
        mockConfigManager
      );

      const batchRequest = {
        requests: [{ prompt: 'Test', quality: { preset: 'standard' as const } }],
        options: { parallel: true, priority: 'normal' as const }
      };

      const result = await clientWithoutBatch.generateBatch(batchRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('BATCH_NOT_SUPPORTED');
    });
  });

  describe('Streaming Generation Integration', () => {
    test('should handle streaming generation with proper chunk emission', async () => {
      const request = {
        prompt: 'Test streaming prompt',
        quality: { preset: 'standard' as const },
        options: { streaming: true }
      };

      const stream = await client.streamGeneration(request);
      const chunks: any[] = [];

      for await (const chunk of stream) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(3); // Should have progress, quality, and completion chunks
      expect(chunks[0].type).toBe('progress');
      expect(chunks[chunks.length - 1].type).toBe('complete');
    });

    test('should emit stream chunk events during streaming', async () => {
      const chunkSpy = jest.fn();
      client.on('stream:chunk', chunkSpy);

      const request = {
        prompt: 'Test stream events',
        quality: { preset: 'standard' as const },
        options: { streaming: true }
      };

      const stream = await client.streamGeneration(request);

      // Consume stream to trigger events
      for await (const chunk of stream) {
        // Drain the stream
      }

      expect(chunkSpy).toHaveBeenCalled();
      const chunkCalls = chunkSpy.mock.calls;
      expect(chunkCalls.length).toBeGreaterThan(0);
    });

    test('should handle streaming configuration validation', async () => {
      // Disable streaming
      const configWithoutStreaming = { ...defaultConfig, enableStreaming: false };
      const clientWithoutStreaming = new EnhancedImagen4Client(
        configWithoutStreaming,
        mockAuthManager,
        mockErrorHandler,
        mockOrchestrator,
        mockConfigManager
      );

      const request = {
        prompt: 'Test streaming disabled',
        quality: { preset: 'standard' as const },
        options: { streaming: true }
      };

      await expect(clientWithoutStreaming.streamGeneration(request))
        .rejects
        .toThrow('Streaming is not enabled for this service');
    });
  });

  describe('Status and Control Integration', () => {
    test('should track and retrieve generation status', async () => {
      const request = {
        prompt: 'Test status tracking',
        quality: { preset: 'standard' as const }
      };

      // Start generation
      const generationResult = await client.generateImage(request);
      expect(generationResult.success).toBe(true);

      const generationId = generationResult.data!.id;

      // Check status
      const statusResult = await client.getGenerationStatus(generationId);

      expect(statusResult.success).toBe(true);
      expect(statusResult.data?.id).toBe(generationId);
      expect(statusResult.data?.status).toBe('completed');
    });

    test('should handle non-existent generation status requests', async () => {
      const result = await client.getGenerationStatus('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('GENERATION_NOT_FOUND');
    });

    test('should cancel generation and cleanup resources', async () => {
      const request = {
        prompt: 'Test cancellation',
        quality: { preset: 'standard' as const }
      };

      // Start generation
      const generationResult = await client.generateImage(request);
      expect(generationResult.success).toBe(true);

      const generationId = generationResult.data!.id;

      // Cancel generation
      const cancelResult = await client.cancelGeneration(generationId);

      expect(cancelResult.success).toBe(true);

      // Verify status is updated
      const statusResult = await client.getGenerationStatus(generationId);
      expect(statusResult.data?.status).toBe('failed');
      expect(statusResult.data?.error?.code).toBe('CANCELLED');
    });
  });

  describe('Configuration Integration', () => {
    test('should update configuration and notify orchestrator', async () => {
      const updateSpy = jest.spyOn(mockOrchestrator, 'updateServiceEndpoints');
      const updates = {
        customEndpoints: {
          generation: 'https://custom-endpoint.com/generate',
          upload: 'https://custom-endpoint.com/upload'
        }
      };

      const result = await client.updateConfiguration(updates);

      expect(result.success).toBe(true);
      expect(updateSpy).toHaveBeenCalledWith('imagen4', updates.customEndpoints);
    });

    test('should emit configuration update events', async () => {
      const configSpy = jest.fn();
      client.on('configuration:updated', configSpy);

      const updates = { enableQualityOptimization: false };

      await client.updateConfiguration(updates);

      expect(configSpy).toHaveBeenCalled();
      const configData = configSpy.mock.calls[0][0];
      expect(configData.enableQualityOptimization).toBe(false);
    });
  });

  describe('Performance Monitoring Integration', () => {
    test('should retrieve metrics from orchestrator', async () => {
      const metricsResult = await client.getMetrics();

      expect(metricsResult.success).toBe(true);
      expect(metricsResult.data?.requestsPerSecond).toBe(10);
      expect(metricsResult.data?.averageLatency).toBe(500);
      expect(metricsResult.data?.errorRate).toBe(0.01);
      expect(metricsResult.data?.uptime).toBe(99.9);
    });

    test('should handle metrics retrieval errors', async () => {
      mockOrchestrator.getServiceMetrics = jest.fn().mockRejectedValue(
        new Error('Metrics service unavailable')
      );

      const metricsResult = await client.getMetrics();

      expect(metricsResult.success).toBe(false);
      expect(metricsResult.error?.code).toBe('METRICS_RETRIEVAL_FAILED');
    });
  });

  describe('Event Handling Integration', () => {
    test('should handle service health changes from orchestrator', async () => {
      const healthSpy = jest.fn();
      client.on('service:health_changed', healthSpy);

      // Simulate health change event
      mockOrchestrator.emit('service:health_changed', {
        service: 'imagen4',
        status: 'degraded',
        timestamp: new Date()
      });

      expect(healthSpy).toHaveBeenCalled();
    });

    test('should handle error recovery events', async () => {
      const recoverySpy = jest.fn();
      client.on('error:recovered', recoverySpy);

      // Simulate error recovery event
      mockErrorHandler.emit('error:recovered', {
        service: 'imagen4',
        error: { code: 'TEMPORARY_ERROR' },
        recoveryTime: new Date()
      });

      expect(recoverySpy).toHaveBeenCalled();
    });
  });

  describe('Error Handling Integration', () => {
    test('should propagate errors correctly through error handler', async () => {
      // Mock orchestrator to throw error
      mockOrchestrator.checkServiceHealth = jest.fn().mockRejectedValue(
        new Error('Network timeout')
      );

      const request = {
        prompt: 'Test error handling',
        quality: { preset: 'standard' as const }
      };

      const result = await client.generateImage(request);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.retryable).toBe(false); // Based on mock error handler
    });

    test('should provide detailed error context for debugging', async () => {
      const request = {
        prompt: 'Test error context',
        quality: { preset: 'standard' as const }
      };

      const result = await client.generateImage(request);

      expect(result.metadata?.requestId).toMatch(/^req_/);
      expect(result.metadata?.timestamp).toBeInstanceOf(Date);
      expect(result.metadata?.processingTime).toBeGreaterThan(0);
    });
  });

  describe('Resource Management Integration', () => {
    test('should properly cleanup resources on client disposal', async () => {
      const cancelSpy = jest.fn();
      const cleanupEventSpy = jest.fn();

      // Setup event listeners
      client.on('generation:cancelled', cleanupEventSpy);

      // Start a generation
      const request = {
        prompt: 'Test resource cleanup',
        quality: { preset: 'standard' as const }
      };

      const generationResult = await client.generateImage(request);
      expect(generationResult.success).toBe(true);

      // Manually cleanup (simulating client disposal)
      const generationId = generationResult.data!.id;

      // This should trigger cleanup
      await client.cancelGeneration(generationId);

      expect(cleanupEventSpy).toHaveBeenCalled();
    });
  });
});