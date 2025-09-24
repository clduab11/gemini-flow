/**
 * Unit Tests for Enhanced Imagen4 Client
 *
 * Tests follow TDD methodology: Write failing tests first, then implement minimal code to pass.
 * Tests cover all major functionality including initialization, generation, batching, streaming,
 * validation, error handling, and event management.
 */

import { EnhancedImagen4Client } from '../../../src/services/google-services/enhanced-imagen4-client';
import { GoogleAIAuthManager } from '../../../src/services/google-services/auth-manager';
import { GoogleAIErrorHandler } from '../../../src/services/google-services/error-handler';
import { GoogleAIServiceOrchestrator } from '../../../src/services/google-services/orchestrator';
import { GoogleAIConfigManager } from '../../../src/services/google-services/config-manager';

// Test doubles/mocks
class MockLogger {
  info(message: string, meta?: any) {}
  error(message: string, error?: any) {}
  debug(message: string, meta?: any) {}
  warn(message: string, meta?: any) {}
}

class MockAuthManager {
  async validateCredentials() {
    return { success: true };
  }
}

class MockErrorHandler {
  handleError(error: any, context: any) {
    return {
      code: 'TEST_ERROR',
      message: error.message || 'Test error',
      retryable: false,
      timestamp: new Date()
    };
  }

  registerService(serviceName: string) {}
}

class MockOrchestrator {
  async registerService(serviceName: string, config: any) {
    return { success: true };
  }

  async checkServiceHealth(serviceName: string) {
    return { success: true };
  }

  async getServiceMetrics(serviceName: string) {
    return {
      latency: { mean: 100, p50: 95, p95: 200, p99: 300, max: 500 },
      throughput: { requestsPerSecond: 10, bytesPerSecond: 1024, operationsPerSecond: 5 },
      utilization: { cpu: 50, memory: 60, disk: 30, network: 40 },
      errors: { rate: 0.01, percentage: 1, types: {} }
    };
  }

  async updateServiceEndpoints(serviceName: string, endpoints: any) {
    return { success: true };
  }

  on(event: string, listener: Function) {}
}

class MockConfigManager {
  getConfig() {
    return {
      serviceName: 'imagen4',
      enableStreaming: true,
      enableBatchProcessing: true,
      enableQualityOptimization: true,
      enableSafetyFiltering: true
    };
  }
}

describe('EnhancedImagen4Client', () => {
  let client: EnhancedImagen4Client;
  let mockAuthManager: MockAuthManager;
  let mockErrorHandler: MockErrorHandler;
  let mockOrchestrator: MockOrchestrator;
  let mockConfigManager: MockConfigManager;

  const defaultConfig = {
    serviceName: 'imagen4',
    enableStreaming: true,
    enableBatchProcessing: true,
    enableQualityOptimization: true,
    enableSafetyFiltering: true
  };

  beforeEach(() => {
    mockAuthManager = new MockAuthManager();
    mockErrorHandler = new MockErrorHandler();
    mockOrchestrator = new MockOrchestrator();
    mockConfigManager = new MockConfigManager();

    client = new EnhancedImagen4Client(
      defaultConfig,
      mockAuthManager,
      mockErrorHandler,
      mockOrchestrator,
      mockConfigManager
    );
  });

  afterEach(() => {
    // Clean up any event listeners
    client.removeAllListeners();
  });

  describe('Client Initialization', () => {
    it('should initialize successfully with valid configuration', async () => {
      const result = await client.initialize();

      expect(result.success).toBe(true);
      expect(result.metadata.requestId).toBeDefined();
      expect(result.metadata.timestamp).toBeInstanceOf(Date);
      expect(result.metadata.processingTime).toBe(0);
      expect(result.metadata.region).toBe('local');
    });

    it('should fail initialization when authentication validation fails', async () => {
      // Mock authentication failure
      mockAuthManager.validateCredentials = jest.fn().mockResolvedValue({ success: false });

      const result = await client.initialize();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INITIALIZATION_FAILED');
      expect(result.error?.message).toContain('Authentication validation failed');
    });

    it('should register service with orchestrator during initialization', async () => {
      const registerSpy = jest.spyOn(mockOrchestrator, 'registerService');

      await client.initialize();

      expect(registerSpy).toHaveBeenCalledWith('imagen4', {
        capabilities: ['image_generation', 'style_transfer', 'batch_processing'],
        endpoints: undefined,
        metadata: {
          version: '4.0.0',
          streaming: true,
          batch: true
        }
      });
    });

    it('should register error handler during initialization', async () => {
      const registerSpy = jest.spyOn(mockErrorHandler, 'registerService');

      await client.initialize();

      expect(registerSpy).toHaveBeenCalledWith('imagen4');
    });

    it('should emit initialized event after successful initialization', async () => {
      const eventSpy = jest.fn();
      client.on('initialized', eventSpy);

      await client.initialize();

      expect(eventSpy).toHaveBeenCalled();
    });
  });

  describe('Image Generation', () => {
    const validRequest = {
      prompt: 'A beautiful sunset over mountains',
      quality: {
        preset: 'high' as const,
        resolution: { width: 1024, height: 1024 }
      },
      options: {
        priority: 'normal' as const,
        timeout: 30000
      }
    };

    it('should generate image successfully with valid request', async () => {
      const result = await client.generateImage(validRequest);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBeDefined();
      expect(result.data?.status).toBe('completed');
      expect(result.data?.images).toHaveLength(1);
      expect(result.data?.images[0].url).toContain('https://example.com');
      expect(result.metadata.requestId).toBeDefined();
      expect(result.metadata.processingTime).toBeGreaterThan(0);
    });

    it('should validate request before processing', async () => {
      const invalidRequest = { ...validRequest, prompt: '' };
      const result = await client.generateImage(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_REQUEST');
      expect(result.error?.message).toContain('Prompt is required');
    });

    it('should validate prompt length constraints', async () => {
      const longPrompt = 'a'.repeat(2001);
      const invalidRequest = { ...validRequest, prompt: longPrompt };
      const result = await client.generateImage(invalidRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_REQUEST');
      expect(result.error?.message).toContain('exceeds maximum length');
    });

    it('should check service health before generation', async () => {
      mockOrchestrator.checkServiceHealth = jest.fn().mockResolvedValue({ success: false });

      const result = await client.generateImage(validRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SERVICE_UNAVAILABLE');
    });

    it('should store active generation in internal tracking', async () => {
      const result = await client.generateImage(validRequest);
      const generationId = result.data!.id;

      const statusResult = await client.getGenerationStatus(generationId);

      expect(statusResult.success).toBe(true);
      expect(statusResult.data?.id).toBe(generationId);
      expect(statusResult.data?.status).toBe('completed');
    });

    it('should generate unique IDs for each request', async () => {
      const result1 = await client.generateImage(validRequest);
      const result2 = await client.generateImage(validRequest);

      expect(result1.data?.id).not.toBe(result2.data?.id);
      expect(result1.data?.id).toMatch(/^img4_/);
    });

    it('should emit progress events during generation', async () => {
      const progressSpy = jest.fn();
      client.on('generation:progress', progressSpy);

      await client.generateImage(validRequest);

      expect(progressSpy).toHaveBeenCalled();
      expect(progressSpy.mock.calls.length).toBeGreaterThan(1);
    });

    it('should emit completion event after generation', async () => {
      const completionSpy = jest.fn();
      client.on('generation:completed', completionSpy);

      await client.generateImage(validRequest);

      expect(completionSpy).toHaveBeenCalled();
      expect(completionSpy).toHaveBeenCalledWith({
        generationId: expect.any(String),
        response: expect.objectContaining({
          id: expect.any(String),
          status: 'completed',
          images: expect.any(Array)
        })
      });
    });
  });

  describe('Streaming Generation', () => {
    const streamingRequest = {
      ...{
        prompt: 'A beautiful sunset over mountains',
        quality: {
          preset: 'high' as const,
          resolution: { width: 1024, height: 1024 }
        }
      },
      options: {
        streaming: true,
        priority: 'normal' as const
      }
    };

    it('should handle streaming generation when enabled', async () => {
      const result = await client.generateImage(streamingRequest);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBeDefined();
      expect(result.data?.status).toBe('completed');
    });

    it('should fail streaming when not enabled in config', async () => {
      const clientNoStreaming = new EnhancedImagen4Client(
        { ...defaultConfig, enableStreaming: false },
        mockAuthManager,
        mockErrorHandler,
        mockOrchestrator,
        mockConfigManager
      );

      const result = await clientNoStreaming.generateImage(streamingRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SERVICE_UNAVAILABLE');
    });

    it('should provide streaming interface', async () => {
      const streamGenerator = await client.streamGeneration(streamingRequest);

      expect(streamGenerator).toBeDefined();

      const chunks: any[] = [];
      for await (const chunk of streamGenerator) {
        chunks.push(chunk);
      }

      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks[0].type).toBe('progress');
      expect(chunks[chunks.length - 1].type).toBe('complete');
    });

    it('should emit stream chunk events', async () => {
      const chunkSpy = jest.fn();
      client.on('stream:chunk', chunkSpy);

      const streamGenerator = await client.streamGeneration(streamingRequest);

      for await (const chunk of streamGenerator) {
        // Process chunk
      }

      expect(chunkSpy).toHaveBeenCalled();
      expect(chunkSpy.mock.calls.length).toBeGreaterThan(1);
    });
  });

  describe('Batch Processing', () => {
    const batchRequest = {
      requests: [
        {
          prompt: 'Sunset 1',
          quality: { preset: 'standard' as const }
        },
        {
          prompt: 'Sunset 2',
          quality: { preset: 'standard' as const }
        }
      ],
      options: {
        parallel: true,
        priority: 'normal' as const
      }
    };

    it('should process batch requests successfully', async () => {
      const result = await client.generateBatch(batchRequest);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBeDefined();
      expect(result.data?.status).toBe('completed');
      expect(result.data?.responses).toHaveLength(2);
      expect(result.data?.summary.total).toBe(2);
      expect(result.data?.summary.completed).toBe(2);
      expect(result.data?.summary.failed).toBe(0);
    });

    it('should validate batch request structure', async () => {
      const invalidBatch = {
        requests: [],
        options: { parallel: true }
      };

      const result = await client.generateBatch(invalidBatch);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_BATCH');
      expect(result.error?.message).toContain('at least one request');
    });

    it('should enforce batch size limits', async () => {
      const largeBatch = {
        requests: Array(101).fill({
          prompt: 'test',
          quality: { preset: 'standard' as const }
        }),
        options: { parallel: true }
      };

      const result = await client.generateBatch(largeBatch);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_BATCH');
      expect(result.error?.message).toContain('cannot exceed 100 requests');
    });

    it('should validate individual requests in batch', async () => {
      const invalidBatchRequest = {
        requests: [
          {
            prompt: 'Valid prompt',
            quality: { preset: 'standard' as const }
          },
          {
            prompt: '', // Invalid
            quality: { preset: 'standard' as const }
          }
        ],
        options: { parallel: true }
      };

      const result = await client.generateBatch(invalidBatchRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('INVALID_BATCH_REQUEST');
    });

    it('should fail when batch processing is disabled', async () => {
      const clientNoBatch = new EnhancedImagen4Client(
        { ...defaultConfig, enableBatchProcessing: false },
        mockAuthManager,
        mockErrorHandler,
        mockOrchestrator,
        mockConfigManager
      );

      const result = await clientNoBatch.generateBatch(batchRequest);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('BATCH_NOT_SUPPORTED');
    });

    it('should process batches in parallel when specified', async () => {
      const parallelBatch = { ...batchRequest, options: { ...batchRequest.options, parallel: true } };
      const result = await client.generateBatch(parallelBatch);

      expect(result.success).toBe(true);
      expect(result.data?.responses).toHaveLength(2);
    });

    it('should process batches sequentially when specified', async () => {
      const sequentialBatch = { ...batchRequest, options: { ...batchRequest.options, parallel: false } };
      const result = await client.generateBatch(sequentialBatch);

      expect(result.success).toBe(true);
      expect(result.data?.responses).toHaveLength(2);
    });
  });

  describe('Generation Status and Management', () => {
    it('should get generation status successfully', async () => {
      const generateResult = await client.generateImage({
        prompt: 'test',
        quality: { preset: 'standard' as const }
      });

      const statusResult = await client.getGenerationStatus(generateResult.data!.id);

      expect(statusResult.success).toBe(true);
      expect(statusResult.data?.id).toBe(generateResult.data!.id);
      expect(statusResult.data?.status).toBe('completed');
    });

    it('should return error for non-existent generation', async () => {
      const result = await client.getGenerationStatus('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('GENERATION_NOT_FOUND');
    });

    it('should cancel generation successfully', async () => {
      const generateResult = await client.generateImage({
        prompt: 'test',
        quality: { preset: 'standard' as const }
      });

      const cancelResult = await client.cancelGeneration(generateResult.data!.id);

      expect(cancelResult.success).toBe(true);

      // Check that generation was marked as cancelled
      const statusResult = await client.getGenerationStatus(generateResult.data!.id);
      expect(statusResult.data?.status).toBe('failed');
      expect(statusResult.data?.error?.code).toBe('CANCELLED');
    });

    it('should return error when cancelling non-existent generation', async () => {
      const result = await client.cancelGeneration('non-existent-id');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('GENERATION_NOT_FOUND');
    });

    it('should emit cancelled event when generation is cancelled', async () => {
      const cancelSpy = jest.fn();
      client.on('generation:cancelled', cancelSpy);

      const generateResult = await client.generateImage({
        prompt: 'test',
        quality: { preset: 'standard' as const }
      });

      await client.cancelGeneration(generateResult.data!.id);

      expect(cancelSpy).toHaveBeenCalledWith({
        generationId: generateResult.data!.id
      });
    });
  });

  describe('Performance and Metrics', () => {
    it('should get performance metrics successfully', async () => {
      const result = await client.getMetrics();

      expect(result.success).toBe(true);
      expect(result.data?.latency).toBeDefined();
      expect(result.data?.throughput).toBeDefined();
      expect(result.data?.utilization).toBeDefined();
      expect(result.data?.errors).toBeDefined();
    });

    it('should get metrics from orchestrator', async () => {
      const metricsSpy = jest.spyOn(mockOrchestrator, 'getServiceMetrics');

      await client.getMetrics();

      expect(metricsSpy).toHaveBeenCalledWith('imagen4');
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration successfully', async () => {
      const updates = {
        enableStreaming: false,
        enableBatchProcessing: false
      };

      const result = await client.updateConfiguration(updates);

      expect(result.success).toBe(true);
      expect(result.metadata.requestId).toBeDefined();
    });

    it('should update orchestrator endpoints when custom endpoints change', async () => {
      const updateSpy = jest.spyOn(mockOrchestrator, 'updateServiceEndpoints');

      const updates = {
        customEndpoints: {
          generation: 'https://custom-endpoint.com/generate'
        }
      };

      await client.updateConfiguration(updates);

      expect(updateSpy).toHaveBeenCalledWith('imagen4', updates.customEndpoints);
    });

    it('should emit configuration updated event', async () => {
      const configSpy = jest.fn();
      client.on('configuration:updated', configSpy);

      await client.updateConfiguration({ enableStreaming: false });

      expect(configSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          serviceName: 'imagen4',
          enableStreaming: false
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully during generation', async () => {
      const errorRequest = {
        prompt: 'test prompt that will cause error',
        quality: { preset: 'standard' as const }
      };

      // Mock orchestrator to throw error
      mockOrchestrator.checkServiceHealth = jest.fn().mockRejectedValue(new Error('Service error'));

      const result = await client.generateImage(errorRequest);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.retryable).toBeDefined();
      expect(result.metadata.processingTime).toBeGreaterThanOrEqual(0);
    });

    it('should handle errors gracefully during batch processing', async () => {
      const errorBatch = {
        requests: [{
          prompt: 'test prompt',
          quality: { preset: 'standard' as const }
        }],
        options: { parallel: true }
      };

      // Mock orchestrator to throw error
      mockOrchestrator.checkServiceHealth = jest.fn().mockRejectedValue(new Error('Service error'));

      const result = await client.generateBatch(errorBatch);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.metadata.processingTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Event System', () => {
    it('should handle service health change events', async () => {
      const healthSpy = jest.fn();
      client.on('service:health_changed', healthSpy);

      // Trigger health change event
      mockOrchestrator.emit('service:health_changed', { service: 'imagen4', healthy: false });

      expect(healthSpy).toHaveBeenCalledWith({ service: 'imagen4', healthy: false });
    });

    it('should handle error recovery events', async () => {
      const recoverySpy = jest.fn();
      client.on('error:recovered', recoverySpy);

      // Trigger error recovery event
      mockErrorHandler.emit('error:recovered', { service: 'imagen4', error: 'test error' });

      expect(recoverySpy).toHaveBeenCalledWith({ service: 'imagen4', error: 'test error' });
    });
  });

  describe('Utility Methods', () => {
    it('should generate valid request IDs', () => {
      const requestId1 = (client as any).generateRequestId();
      const requestId2 = (client as any).generateRequestId();

      expect(requestId1).toMatch(/^req_/);
      expect(requestId2).toMatch(/^req_/);
      expect(requestId1).not.toBe(requestId2);
    });

    it('should generate valid generation IDs', () => {
      const generationId1 = (client as any).generateGenerationId();
      const generationId2 = (client as any).generateGenerationId();

      expect(generationId1).toMatch(/^img4_/);
      expect(generationId2).toMatch(/^img4_/);
      expect(generationId1).not.toBe(generationId2);
    });

    it('should generate valid batch IDs', () => {
      const batchId1 = (client as any).generateBatchId();
      const batchId2 = (client as any).generateBatchId();

      expect(batchId1).toMatch(/^batch_/);
      expect(batchId2).toMatch(/^batch_/);
      expect(batchId1).not.toBe(batchId2);
    });

    it('should generate valid checksums', () => {
      const checksum1 = (client as any).generateChecksum('test data 1');
      const checksum2 = (client as any).generateChecksum('test data 2');

      expect(checksum1).toMatch(/^[0-9a-f]+$/);
      expect(checksum2).toMatch(/^[0-9a-f]+$/);
      expect(checksum1).not.toBe(checksum2);
    });

    it('should create properly formatted error responses', () => {
      const errorResponse = (client as any).createErrorResponse('TEST_ERROR', 'Test error message');

      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error?.code).toBe('TEST_ERROR');
      expect(errorResponse.error?.message).toBe('Test error message');
      expect(errorResponse.error?.retryable).toBe(false);
      expect(errorResponse.error?.timestamp).toBeInstanceOf(Date);
      expect(errorResponse.metadata.requestId).toBeDefined();
    });
  });

  describe('Integration with Dependencies', () => {
    it('should properly integrate with auth manager', async () => {
      const validateSpy = jest.spyOn(mockAuthManager, 'validateCredentials');

      await client.initialize();

      expect(validateSpy).toHaveBeenCalled();
    });

    it('should properly integrate with error handler', async () => {
      const handleSpy = jest.spyOn(mockErrorHandler, 'handleError');
      const registerSpy = jest.spyOn(mockErrorHandler, 'registerService');

      await client.initialize();

      expect(registerSpy).toHaveBeenCalledWith('imagen4');
      expect(handleSpy).not.toHaveBeenCalled(); // Only called on actual errors
    });

    it('should properly integrate with orchestrator', async () => {
      const registerSpy = jest.spyOn(mockOrchestrator, 'registerService');
      const healthSpy = jest.spyOn(mockOrchestrator, 'checkServiceHealth');

      await client.initialize();
      await client.generateImage({
        prompt: 'test',
        quality: { preset: 'standard' as const }
      });

      expect(registerSpy).toHaveBeenCalledWith('imagen4', expect.any(Object));
      expect(healthSpy).toHaveBeenCalledWith('imagen4');
    });

    it('should properly integrate with config manager', async () => {
      const configSpy = jest.spyOn(mockConfigManager, 'getConfig');

      await client.initialize();

      expect(configSpy).toHaveBeenCalled();
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    it('should handle concurrent requests properly', async () => {
      const requests = Array(5).fill({
        prompt: 'concurrent test',
        quality: { preset: 'standard' as const }
      });

      const promises = requests.map(req => client.generateImage(req));
      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.data?.id).toBeDefined();
      });

      // Ensure all IDs are unique
      const ids = results.map(r => r.data!.id);
      expect(new Set(ids).size).toBe(5);
    });

    it('should handle empty options gracefully', async () => {
      const minimalRequest = {
        prompt: 'test prompt',
        quality: { preset: 'standard' as const },
        options: {}
      };

      const result = await client.generateImage(minimalRequest);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBeDefined();
    });

    it('should handle undefined optional fields gracefully', async () => {
      const sparseRequest = {
        prompt: 'test prompt'
      };

      const result = await client.generateImage(sparseRequest as any);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBeDefined();
    });
  });
});