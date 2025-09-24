/**
 * Integration Tests for Enhanced Veo3 Client
 *
 * Tests the interaction between the Veo3 client and its dependencies:
 * - GoogleAIAuthManager
 * - GoogleAIErrorHandler
 * - GoogleAIServiceOrchestrator
 * - GoogleAIConfigManager
 *
 * These tests verify end-to-end workflows and component collaboration for video generation.
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { EventEmitter } from 'events';
import { EnhancedVeo3Client } from '../../../src/services/google-services/enhanced-veo3-client.js';
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
      requestsPerSecond: 15,
      averageLatency: 2000,
      errorRate: 0.005,
      uptime: 99.95,
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
      timeout: 60000,
    };
  }

  async updateConfig(serviceName: string, updates: any) {
    return { success: true };
  }
}

describe('EnhancedVeo3Client Integration', () => {
  let client: EnhancedVeo3Client;
  let mockAuthManager: MockAuthManager;
  let mockErrorHandler: MockErrorHandler;
  let mockOrchestrator: MockOrchestrator;
  let mockConfigManager: MockConfigManager;

  const defaultConfig = {
    serviceName: "veo3",
    enableStreaming: true,
    enableRealTimeRendering: true,
    enableQualityOptimization: true,
    enableBatchProcessing: true,
    rendering: {
      maxConcurrentRenders: 5,
      memoryLimit: 4096, // MB
      timeoutMinutes: 30,
      quality: "high" as const,
    },
    optimization: {
      gpu: true,
      multiGPU: false,
      memoryFraction: 0.8,
      cudaGraphs: true,
    },
  };

  beforeEach(async () => {
    // Initialize mocks
    mockAuthManager = new MockAuthManager();
    mockErrorHandler = new MockErrorHandler();
    mockOrchestrator = new MockOrchestrator();
    mockConfigManager = new MockConfigManager();

    // Create client
    client = new EnhancedVeo3Client(
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
      // Cleanup any active projects
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

      expect(registerSpy).toHaveBeenCalledWith('veo3', {
        capabilities: ['video_generation', 'real_time_rendering', 'batch_processing', 'streaming'],
        endpoints: undefined,
        metadata: {
          version: '3.0.0',
          streaming: true,
          realTime: true,
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

    test('should respect rendering configuration during initialization', async () => {
      const configWithCustomRendering = {
        ...defaultConfig,
        rendering: {
          maxConcurrentRenders: 10,
          memoryLimit: 8192,
          timeoutMinutes: 60,
          quality: "ultra" as const,
        },
      };

      const clientWithCustomConfig = new EnhancedVeo3Client(
        configWithCustomRendering,
        mockAuthManager,
        mockErrorHandler,
        mockOrchestrator,
        mockConfigManager
      );

      const result = await clientWithCustomConfig.initialize();

      expect(result.success).toBe(true);
    });
  });

  describe('Video Generation Integration', () => {
    test('should successfully generate video with all dependencies', async () => {
      const request = {
        prompt: 'A cinematic landscape video',
        resolution: { width: 1920, height: 1080 },
        duration: 30,
        frameRate: 30,
        format: {
          container: 'mp4' as const,
          codec: 'h264' as const,
          bitrate: 5000000,
        },
        quality: { preset: 'high' as const },
        options: { priority: 'normal' as const }
      };

      const result = await client.generateVideo(request);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.id).toMatch(/^veo3_/);
      expect(result.data?.status).toBe('completed');
      expect(result.data?.output?.video).toBeDefined();
      expect(result.data?.output?.video?.url).toMatch(/^https:\/\/example\.com/);
      expect(result.data?.output?.thumbnail).toBeDefined();
      expect(result.metadata?.requestId).toMatch(/^req_/);
    });

    test('should validate request through orchestrator health check', async () => {
      const healthCheckSpy = jest.spyOn(mockOrchestrator, 'checkServiceHealth');

      const request = {
        prompt: 'Test prompt',
        resolution: { width: 1920, height: 1080 },
        duration: 30,
        frameRate: 30,
        format: { container: 'mp4' as const, codec: 'h264' as const, bitrate: 5000000 },
        quality: { preset: 'high' as const }
      };

      await client.generateVideo(request);

      expect(healthCheckSpy).toHaveBeenCalledWith('veo3');
    });

    test('should handle orchestrator service unavailable', async () => {
      // Mock service unavailable
      mockOrchestrator.checkServiceHealth = jest.fn().mockResolvedValue({
        success: false,
        error: { code: 'SERVICE_DOWN', message: 'Service unavailable' }
      });

      const request = {
        prompt: 'Test prompt',
        resolution: { width: 1920, height: 1080 },
        duration: 30,
        frameRate: 30,
        format: { container: 'mp4' as const, codec: 'h264' as const, bitrate: 5000000 },
        quality: { preset: 'high' as const }
      };

      const result = await client.generateVideo(request);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SERVICE_UNAVAILABLE');
      expect(result.error?.message).toBe('Veo3 service is not available');
    });

    test('should emit progress events during generation', async () => {
      const progressSpy = jest.fn();
      client.on('generation:progress', progressSpy);

      const request = {
        prompt: 'Test progress tracking',
        resolution: { width: 1920, height: 1080 },
        duration: 30,
        frameRate: 30,
        format: { container: 'mp4' as const, codec: 'h264' as const, bitrate: 5000000 },
        quality: { preset: 'high' as const }
      };

      await client.generateVideo(request);

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
        resolution: { width: 1920, height: 1080 },
        duration: 30,
        frameRate: 30,
        format: { container: 'mp4' as const, codec: 'h264' as const, bitrate: 5000000 },
        quality: { preset: 'high' as const }
      };

      await client.generateVideo(request);

      expect(completionSpy).toHaveBeenCalled();
      const completionData = completionSpy.mock.calls[0][0];
      expect(completionData.projectId).toMatch(/^veo3_/);
      expect(completionData.response).toBeDefined();
      expect(completionData.response.status).toBe('completed');
    });

    test('should validate video-specific constraints', async () => {
      const request = {
        prompt: 'Test validation',
        resolution: { width: 3840, height: 2160 }, // 4K - should pass
        duration: 30,
        frameRate: 30,
        format: { container: 'mp4' as const, codec: 'h264' as const, bitrate: 5000000 },
        quality: { preset: 'high' as const }
      };

      const result = await client.generateVideo(request);

      expect(result.success).toBe(true);
    });

    test('should reject invalid duration', async () => {
      const request = {
        prompt: 'Test validation',
        resolution: { width: 1920, height: 1080 },
        duration: 400, // Too long - should fail
        frameRate: 30,
        format: { container: 'mp4' as const, codec: 'h264' as const, bitrate: 5000000 },
        quality: { preset: 'high' as const }
      };

      const result = await client.generateVideo(request);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_REQUEST');
      expect(result.error?.message).toContain('Duration must be between 1 and 300 seconds');
    });

    test('should reject invalid resolution', async () => {
      const request = {
        prompt: 'Test validation',
        resolution: { width: 4000, height: 4000 }, // Too large - should fail
        duration: 30,
        frameRate: 30,
        format: { container: 'mp4' as const, codec: 'h264' as const, bitrate: 5000000 },
        quality: { preset: 'high' as const }
      };

      const result = await client.generateVideo(request);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_REQUEST');
      expect(result.error?.message).toContain('Resolution exceeds maximum supported size');
    });

    test('should handle errors through error handler integration', async () => {
      const handleErrorSpy = jest.spyOn(mockErrorHandler, 'handleError');

      // Create a request that will cause an error
      const request = {
        prompt: '', // Invalid empty prompt
        resolution: { width: 1920, height: 1080 },
        duration: 30,
        frameRate: 30,
        format: { container: 'mp4' as const, codec: 'h264' as const, bitrate: 5000000 },
        quality: { preset: 'high' as const }
      };

      await client.generateVideo(request);

      expect(handleErrorSpy).toHaveBeenCalled();
      const errorCall = handleErrorSpy.mock.calls[0];
      expect(errorCall[1]).toMatchObject({
        service: 'veo3',
        operation: 'generateVideo',
      });
    });
  });

  describe('Real-Time Video Generation Integration', () => {
    test('should handle real-time generation with proper event emission', async () => {
      const realTimeRequest = {
        prompt: 'Real-time cinematic scene',
        resolution: { width: 1920, height: 1080 },
        duration: 30,
        frameRate: 30,
        format: { container: 'mp4' as const, codec: 'h264' as const, bitrate: 5000000 },
        quality: { preset: 'high' as const },
        options: { realTime: true }
      };

      const result = await client.generateRealTime(realTimeRequest);

      expect(result.success).toBe(true);
      expect(result.data?.id).toMatch(/^veo3_/);
      expect(result.data?.status).toBe('completed');
      expect(result.data?.output?.video).toBeDefined();
      expect(result.data?.output?.video?.url).toMatch(/^https:\/\/example\.com\/realtime/);
    });

    test('should emit real-time progress events', async () => {
      const realTimeProgressSpy = jest.fn();
      client.on('realtime:progress', realTimeProgressSpy);

      const realTimeRequest = {
        prompt: 'Test real-time progress',
        resolution: { width: 1920, height: 1080 },
        duration: 30,
        frameRate: 30,
        format: { container: 'mp4' as const, codec: 'h264' as const, bitrate: 5000000 },
        quality: { preset: 'high' as const },
        options: { realTime: true }
      };

      await client.generateRealTime(realTimeRequest);

      expect(realTimeProgressSpy).toHaveBeenCalled();
      const progressCalls = realTimeProgressSpy.mock.calls;
      expect(progressCalls.length).toBeGreaterThan(1);
    });

    test('should emit real-time completion events', async () => {
      const realTimeCompletionSpy = jest.fn();
      client.on('realtime:completed', realTimeCompletionSpy);

      const realTimeRequest = {
        prompt: 'Test real-time completion',
        resolution: { width: 1920, height: 1080 },
        duration: 30,
        frameRate: 30,
        format: { container: 'mp4' as const, codec: 'h264' as const, bitrate: 5000000 },
        quality: { preset: 'high' as const },
        options: { realTime: true }
      };

      await client.generateRealTime(realTimeRequest);

      expect(realTimeCompletionSpy).toHaveBeenCalled();
      const completionData = realTimeCompletionSpy.mock.calls[0][0];
      expect(completionData.projectId).toMatch(/^veo3_/);
      expect(completionData.response).toBeDefined();
      expect(completionData.response.status).toBe('completed');
    });

    test('should validate real-time capability', async () => {
      // Disable real-time rendering
      const configWithoutRealTime = { ...defaultConfig, enableRealTimeRendering: false };
      const clientWithoutRealTime = new EnhancedVeo3Client(
        configWithoutRealTime,
        mockAuthManager,
        mockErrorHandler,
        mockOrchestrator,
        mockConfigManager
      );

      const realTimeRequest = {
        prompt: 'Test real-time disabled',
        resolution: { width: 1920, height: 1080 },
        duration: 30,
        frameRate: 30,
        format: { container: 'mp4' as const, codec: 'h264' as const, bitrate: 5000000 },
        quality: { preset: 'high' as const },
        options: { realTime: true }
      };

      const result = await clientWithoutRealTime.generateRealTime(realTimeRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('REALTIME_NOT_SUPPORTED');
    });
  });

  describe('Streaming Video Generation Integration', () => {
    test('should handle streaming video generation with proper chunk emission', async () => {
      const streamingRequest = {
        prompt: 'Test streaming video',
        resolution: { width: 1920, height: 1080 },
        duration: 30,
        frameRate: 30,
        format: { container: 'mp4' as const, codec: 'h264' as const, bitrate: 5000000 },
        quality: { preset: 'high' as const },
        options: { streaming: true }
      };

      const stream = await client.streamVideoGeneration(streamingRequest);
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

      const streamingRequest = {
        prompt: 'Test stream events',
        resolution: { width: 1920, height: 1080 },
        duration: 30,
        frameRate: 30,
        format: { container: 'mp4' as const, codec: 'h264' as const, bitrate: 5000000 },
        quality: { preset: 'high' as const },
        options: { streaming: true }
      };

      const stream = await client.streamVideoGeneration(streamingRequest);

      // Consume stream to trigger events
      for await (const chunk of stream) {
        // Drain the stream
      }

      expect(chunkSpy).toHaveBeenCalled();
      const chunkCalls = chunkSpy.mock.calls;
      expect(chunkCalls.length).toBeGreaterThan(0);
    });

    test('should validate streaming configuration', async () => {
      // Disable streaming
      const configWithoutStreaming = { ...defaultConfig, enableStreaming: false };
      const clientWithoutStreaming = new EnhancedVeo3Client(
        configWithoutStreaming,
        mockAuthManager,
        mockErrorHandler,
        mockOrchestrator,
        mockConfigManager
      );

      const streamingRequest = {
        prompt: 'Test streaming disabled',
        resolution: { width: 1920, height: 1080 },
        duration: 30,
        frameRate: 30,
        format: { container: 'mp4' as const, codec: 'h264' as const, bitrate: 5000000 },
        quality: { preset: 'high' as const },
        options: { streaming: true }
      };

      await expect(clientWithoutStreaming.streamVideoGeneration(streamingRequest))
        .rejects
        .toThrow('Streaming is not enabled for this service');
    });
  });

  describe('Batch Processing Integration', () => {
    test('should process batch requests with orchestrator coordination', async () => {
      const batchRequest = {
        requests: [
          {
            prompt: 'First video',
            resolution: { width: 1920, height: 1080 },
            duration: 30,
            frameRate: 30,
            format: { container: 'mp4' as const, codec: 'h264' as const, bitrate: 5000000 },
            quality: { preset: 'high' as const }
          },
          {
            prompt: 'Second video',
            resolution: { width: 1920, height: 1080 },
            duration: 30,
            frameRate: 30,
            format: { container: 'mp4' as const, codec: 'h264' as const, bitrate: 5000000 },
            quality: { preset: 'high' as const }
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
            prompt: 'Valid video',
            resolution: { width: 1920, height: 1080 },
            duration: 30,
            frameRate: 30,
            format: { container: 'mp4' as const, codec: 'h264' as const, bitrate: 5000000 },
            quality: { preset: 'high' as const }
          },
          {
            prompt: '', // Invalid empty prompt
            resolution: { width: 1920, height: 1080 },
            duration: 30,
            frameRate: 30,
            format: { container: 'mp4' as const, codec: 'h264' as const, bitrate: 5000000 },
            quality: { preset: 'high' as const }
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
      const clientWithoutBatch = new EnhancedVeo3Client(
        configWithoutBatch,
        mockAuthManager,
        mockErrorHandler,
        mockOrchestrator,
        mockConfigManager
      );

      const batchRequest = {
        requests: [{
          prompt: 'Test',
          resolution: { width: 1920, height: 1080 },
          duration: 30,
          frameRate: 30,
          format: { container: 'mp4' as const, codec: 'h264' as const, bitrate: 5000000 },
          quality: { preset: 'high' as const }
        }],
        options: { parallel: true, priority: 'normal' as const }
      };

      const result = await clientWithoutBatch.generateBatch(batchRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('BATCH_NOT_SUPPORTED');
    });
  });

  describe('Status and Control Integration', () => {
    test('should track and retrieve video generation status', async () => {
      const request = {
        prompt: 'Test status tracking',
        resolution: { width: 1920, height: 1080 },
        duration: 30,
        frameRate: 30,
        format: { container: 'mp4' as const, codec: 'h264' as const, bitrate: 5000000 },
        quality: { preset: 'high' as const }
      };

      // Start generation
      const generationResult = await client.generateVideo(request);
      expect(generationResult.success).toBe(true);

      const projectId = generationResult.data!.id;

      // Check status
      const statusResult = await client.getVideoStatus(projectId);

      expect(statusResult.success).toBe(true);
      expect(statusResult.data?.id).toBe(projectId);
      expect(statusResult.data?.status).toBe('completed');
    });

    test('should handle non-existent project status requests', async () => {
      const result = await client.getVideoStatus('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('PROJECT_NOT_FOUND');
    });

    test('should cancel video generation and cleanup resources', async () => {
      const request = {
        prompt: 'Test cancellation',
        resolution: { width: 1920, height: 1080 },
        duration: 30,
        frameRate: 30,
        format: { container: 'mp4' as const, codec: 'h264' as const, bitrate: 5000000 },
        quality: { preset: 'high' as const }
      };

      // Start generation
      const generationResult = await client.generateVideo(request);
      expect(generationResult.success).toBe(true);

      const projectId = generationResult.data!.id;

      // Cancel generation
      const cancelResult = await client.cancelVideo(projectId);

      expect(cancelResult.success).toBe(true);

      // Verify status is updated
      const statusResult = await client.getVideoStatus(projectId);
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
          upload: 'https://custom-endpoint.com/upload',
          streaming: 'https://custom-endpoint.com/stream'
        }
      };

      const result = await client.updateConfiguration(updates);

      expect(result.success).toBe(true);
      expect(updateSpy).toHaveBeenCalledWith('veo3', updates.customEndpoints);
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

    test('should handle GPU optimization configuration', async () => {
      const gpuUpdates = {
        optimization: {
          gpu: true,
          multiGPU: true,
          memoryFraction: 0.9,
          cudaGraphs: true,
        },
      };

      const result = await client.updateConfiguration(gpuUpdates);

      expect(result.success).toBe(true);
    });
  });

  describe('Performance Monitoring Integration', () => {
    test('should retrieve video-specific metrics from orchestrator', async () => {
      const metricsResult = await client.getMetrics();

      expect(metricsResult.success).toBe(true);
      expect(metricsResult.data?.requestsPerSecond).toBe(15);
      expect(metricsResult.data?.averageLatency).toBe(2000);
      expect(metricsResult.data?.errorRate).toBe(0.005);
      expect(metricsResult.data?.uptime).toBe(99.95);
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
        service: 'veo3',
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
        service: 'veo3',
        error: { code: 'TEMPORARY_ERROR' },
        recoveryTime: new Date()
      });

      expect(recoverySpy).toHaveBeenCalled();
    });
  });

  describe('Error Handling Integration', () => {
    test('should propagate video-specific errors correctly', async () => {
      // Mock orchestrator to throw video-specific error
      mockOrchestrator.checkServiceHealth = jest.fn().mockRejectedValue(
        new Error('Video processing pipeline overload')
      );

      const request = {
        prompt: 'Test error handling',
        resolution: { width: 1920, height: 1080 },
        duration: 30,
        frameRate: 30,
        format: { container: 'mp4' as const, codec: 'h264' as const, bitrate: 5000000 },
        quality: { preset: 'high' as const }
      };

      const result = await client.generateVideo(request);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.retryable).toBe(false); // Based on mock error handler
    });

    test('should provide detailed error context for video debugging', async () => {
      const request = {
        prompt: 'Test error context',
        resolution: { width: 1920, height: 1080 },
        duration: 30,
        frameRate: 30,
        format: { container: 'mp4' as const, codec: 'h264' as const, bitrate: 5000000 },
        quality: { preset: 'high' as const }
      };

      const result = await client.generateVideo(request);

      expect(result.metadata?.requestId).toMatch(/^req_/);
      expect(result.metadata?.timestamp).toBeInstanceOf(Date);
      expect(result.metadata?.processingTime).toBeGreaterThan(0);
    });
  });

  describe('Resource Management Integration', () => {
    test('should properly cleanup video resources on client disposal', async () => {
      const cancelSpy = jest.fn();
      const cleanupEventSpy = jest.fn();

      // Setup event listeners
      client.on('video:cancelled', cleanupEventSpy);

      // Start a video generation
      const request = {
        prompt: 'Test resource cleanup',
        resolution: { width: 1920, height: 1080 },
        duration: 30,
        frameRate: 30,
        format: { container: 'mp4' as const, codec: 'h264' as const, bitrate: 5000000 },
        quality: { preset: 'high' as const }
      };

      const generationResult = await client.generateVideo(request);
      expect(generationResult.success).toBe(true);

      // Manually cleanup (simulating client disposal)
      const projectId = generationResult.data!.id;

      // This should trigger cleanup
      await client.cancelVideo(projectId);

      expect(cleanupEventSpy).toHaveBeenCalled();
    });
  });

  describe('Video Quality Integration', () => {
    test('should handle video quality assessment and reporting', async () => {
      const request = {
        prompt: 'Test quality assessment',
        resolution: { width: 1920, height: 1080 },
        duration: 30,
        frameRate: 30,
        format: { container: 'mp4' as const, codec: 'h264' as const, bitrate: 5000000 },
        quality: { preset: 'high' as const }
      };

      const result = await client.generateVideo(request);

      expect(result.success).toBe(true);
      expect(result.data?.quality).toBeDefined();
      expect(result.data?.quality?.overall).toBeGreaterThan(0);
      expect(result.data?.quality?.technical).toBeDefined();
      expect(result.data?.quality?.aesthetic).toBeDefined();
    });

    test('should respect quality presets and custom settings', async () => {
      const request = {
        prompt: 'Test quality presets',
        resolution: { width: 1920, height: 1080 },
        duration: 30,
        frameRate: 30,
        format: { container: 'mp4' as const, codec: 'h264' as const, bitrate: 5000000 },
        quality: {
          preset: 'ultra' as const,
          customSettings: {
            renderSamples: 128,
            denoising: true,
            motionBlur: true,
            antiAliasing: true,
          }
        }
      };

      const result = await client.generateVideo(request);

      expect(result.success).toBe(true);
      expect(result.data?.quality?.overall).toBeGreaterThan(90);
    });
  });
});