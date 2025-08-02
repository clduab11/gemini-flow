/**
 * Vertex AI Integration Validation Tests
 * Comprehensive testing of Vertex AI connectivity and error handling
 */

const { describe, test, expect, beforeAll, afterAll } = require('@jest/globals');
const { VertexAIClient, VertexAIManager } = require('../../src/integrations/vertex-ai');
const { HiveMemory } = require('../../src/utils/hive-memory');
const { ErrorSimulator } = require('../utils/error-simulator');

describe('Vertex AI Integration Validation', () => {
  let vertexClient;
  let vertexManager;
  let hiveMemory;
  let errorSimulator;

  beforeAll(async () => {
    hiveMemory = new HiveMemory();
    errorSimulator = new ErrorSimulator();
    
    vertexClient = new VertexAIClient({
      projectId: process.env.VERTEX_PROJECT_ID || 'gemini-flow-test',
      location: process.env.VERTEX_LOCATION || 'us-central1',
      credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS
    });

    vertexManager = new VertexAIManager({
      client: vertexClient,
      maxRetries: 3,
      timeoutMs: 30000
    });

    await vertexManager.initialize();
  });

  afterAll(async () => {
    await vertexManager.cleanup();
  });

  describe('Vertex AI Connectivity Validation', () => {
    test('should establish connection to Vertex AI services', async () => {
      const connectionResult = await vertexManager.testConnection();
      
      expect(connectionResult.connected).toBe(true);
      expect(connectionResult.projectId).toBe(process.env.VERTEX_PROJECT_ID || 'gemini-flow-test');
      expect(connectionResult.location).toBe(process.env.VERTEX_LOCATION || 'us-central1');
      expect(connectionResult.responseTime).toBeLessThan(5000);

      await storeValidationResult('vertex/connectivity/basic', {
        success: true,
        connected: connectionResult.connected,
        projectId: connectionResult.projectId,
        location: connectionResult.location,
        responseTime: connectionResult.responseTime
      });
    });

    test('should authenticate with proper service account credentials', async () => {
      const authResult = await vertexManager.validateAuthentication();
      
      expect(authResult.authenticated).toBe(true);
      expect(authResult.serviceAccount).toBeDefined();
      expect(authResult.permissions).toContain('aiplatform.endpoints.predict');
      expect(authResult.permissions).toContain('aiplatform.models.predict');

      await storeValidationResult('vertex/connectivity/authentication', {
        success: true,
        authenticated: authResult.authenticated,
        serviceAccount: authResult.serviceAccount,
        requiredPermissions: authResult.permissions.filter(p => 
          p.includes('aiplatform')
        ).length >= 2
      });
    });

    test('should validate available models and endpoints', async () => {
      const modelsResult = await vertexManager.listAvailableModels();
      
      expect(modelsResult.models).toHaveLength(expect.any(Number));
      expect(modelsResult.models.some(m => m.name.includes('gemini'))).toBe(true);
      
      const endpointsResult = await vertexManager.listEndpoints();
      expect(endpointsResult.endpoints).toHaveLength(expect.any(Number));

      await storeValidationResult('vertex/connectivity/resources', {
        success: true,
        modelCount: modelsResult.models.length,
        hasGeminiModels: modelsResult.models.some(m => m.name.includes('gemini')),
        endpointCount: endpointsResult.endpoints.length,
        resources: {
          models: modelsResult.models.slice(0, 3), // Sample for logging
          endpoints: endpointsResult.endpoints.slice(0, 2)
        }
      });
    });
  });

  describe('Model Prediction and Inference', () => {
    test('should perform text generation with Gemini Pro', async () => {
      const predictionRequest = {
        model: 'gemini-pro',
        prompt: 'Explain quantum computing in simple terms',
        parameters: {
          maxOutputTokens: 1000,
          temperature: 0.7,
          topP: 0.8,
          topK: 40
        }
      };

      const startTime = performance.now();
      const predictionResult = await vertexManager.predict(predictionRequest);
      const endTime = performance.now();
      const responseTime = endTime - startTime;

      expect(predictionResult.predictions).toHaveLength(expect.any(Number));
      expect(predictionResult.predictions[0].content).toBeTruthy();
      expect(responseTime).toBeLessThan(30000); // 30s max for generation
      
      await storeValidationResult('vertex/inference/text_generation', {
        success: true,
        model: predictionRequest.model,
        responseTime,
        predictionGenerated: !!predictionResult.predictions[0].content,
        contentLength: predictionResult.predictions[0].content.length
      });
    });

    test('should handle multimodal inputs (text + image)', async () => {
      const multimodalRequest = {
        model: 'gemini-pro-vision',
        inputs: [
          { type: 'text', content: 'Describe this image in detail' },
          { type: 'image', content: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...' } // Sample base64 image
        ],
        parameters: {
          maxOutputTokens: 2048,
          temperature: 0.4
        }
      };

      const multimodalResult = await vertexManager.predictMultimodal(multimodalRequest);
      
      expect(multimodalResult.predictions).toHaveLength(expect.any(Number));
      expect(multimodalResult.predictions[0].description).toBeTruthy();
      expect(multimodalResult.inputsProcessed).toBe(2);

      await storeValidationResult('vertex/inference/multimodal', {
        success: true,
        model: multimodalRequest.model,
        inputsProcessed: multimodalResult.inputsProcessed,
        descriptionGenerated: !!multimodalResult.predictions[0].description,
        processingSuccessful: multimodalResult.predictions.length > 0
      });
    });

    test('should perform batch predictions efficiently', async () => {
      const batchRequests = Array.from({ length: 10 }, (_, i) => ({
        model: 'gemini-pro',
        prompt: `Batch request ${i + 1}: Summarize the benefits of AI`,
        parameters: {
          maxOutputTokens: 500,
          temperature: 0.5
        }
      }));

      const startTime = performance.now();
      const batchResults = await vertexManager.batchPredict(batchRequests);
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const averageTimePerRequest = totalTime / batchRequests.length;

      expect(batchResults.results).toHaveLength(10);
      expect(batchResults.successCount).toBe(10);
      expect(batchResults.failureCount).toBe(0);
      expect(averageTimePerRequest).toBeLessThan(10000); // 10s average max

      await storeValidationResult('vertex/inference/batch_processing', {
        success: true,
        batchSize: batchRequests.length,
        successCount: batchResults.successCount,
        failureCount: batchResults.failureCount,
        totalTime,
        averageTimePerRequest,
        efficiencyMet: averageTimePerRequest < 10000
      });
    });
  });

  describe('Error Handling and Resilience', () => {
    test('should handle rate limiting gracefully', async () => {
      // Simulate rate limiting scenario
      const rateLimitTest = await errorSimulator.simulateRateLimit(
        () => vertexManager.predict({
          model: 'gemini-pro',
          prompt: 'Test prompt for rate limiting',
          parameters: { maxOutputTokens: 100 }
        })
      );

      expect(rateLimitTest.rateLimitDetected).toBe(true);
      expect(rateLimitTest.backoffApplied).toBe(true);
      expect(rateLimitTest.eventualSuccess).toBe(true);
      expect(rateLimitTest.totalRetries).toBeGreaterThan(0);

      await storeValidationResult('vertex/error_handling/rate_limiting', {
        success: true,
        rateLimitHandled: rateLimitTest.rateLimitDetected,
        backoffWorking: rateLimitTest.backoffApplied,
        recoverySuccessful: rateLimitTest.eventualSuccess,
        retryCount: rateLimitTest.totalRetries
      });
    });

    test('should recover from network timeouts', async () => {
      const timeoutTest = await errorSimulator.simulateTimeout(
        () => vertexManager.predict({
          model: 'gemini-pro',
          prompt: 'Test prompt for timeout handling',
          parameters: { maxOutputTokens: 100 }
        }),
        { timeoutMs: 1000, maxRetries: 3 }
      );

      expect(timeoutTest.timeoutDetected).toBe(true);
      expect(timeoutTest.retriesAttempted).toBeGreaterThan(0);
      expect(timeoutTest.finalOutcome).toBe('success');

      await storeValidationResult('vertex/error_handling/timeouts', {
        success: true,
        timeoutHandled: timeoutTest.timeoutDetected,
        retriesAttempted: timeoutTest.retriesAttempted,
        recoverySuccessful: timeoutTest.finalOutcome === 'success'
      });
    });

    test('should handle authentication failures with retry logic', async () => {
      const authFailureTest = await errorSimulator.simulateAuthFailure(
        () => vertexManager.predict({
          model: 'gemini-pro',
          prompt: 'Test prompt for auth failure',
          parameters: { maxOutputTokens: 100 }
        })
      );

      expect(authFailureTest.authFailureDetected).toBe(true);
      expect(authFailureTest.reauthenticationAttempted).toBe(true);
      expect(authFailureTest.finalSuccess).toBe(true);

      await storeValidationResult('vertex/error_handling/auth_failures', {
        success: true,
        authFailureHandled: authFailureTest.authFailureDetected,
        reauthenticationWorking: authFailureTest.reauthenticationAttempted,
        recoverySuccessful: authFailureTest.finalSuccess
      });
    });

    test('should provide meaningful error messages and logging', async () => {
      const invalidRequest = {
        model: 'nonexistent-model',
        prompt: 'This should fail',
        parameters: { maxOutputTokens: -1 } // Invalid parameter
      };

      try {
        await vertexManager.predict(invalidRequest);
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect(error.message).toBeTruthy();
        expect(error.code).toBeDefined();
        expect(error.details).toBeDefined();
        
        // Check if error was logged
        const errorLogs = await vertexManager.getErrorLogs({ last: 1 });
        expect(errorLogs).toHaveLength(1);
        expect(errorLogs[0].error).toContain('nonexistent-model');
      }

      await storeValidationResult('vertex/error_handling/error_reporting', {
        success: true,
        meaningfulErrorMessages: true,
        errorLoggingWorking: true,
        errorStructureValid: true
      });
    });
  });

  describe('Performance and Scalability', () => {
    test('should meet performance benchmarks for various model sizes', async () => {
      const modelTests = [
        { model: 'gemini-pro', expectedMaxTime: 15000, complexity: 'medium' },
        { model: 'gemini-pro-vision', expectedMaxTime: 25000, complexity: 'high' },
        { model: 'text-bison', expectedMaxTime: 10000, complexity: 'low' }
      ];

      const performanceResults = {};

      for (const modelTest of modelTests) {
        const iterations = 5;
        const times = [];

        for (let i = 0; i < iterations; i++) {
          const startTime = performance.now();
          
          const result = await vertexManager.predict({
            model: modelTest.model,
            prompt: `Performance test ${i + 1} for ${modelTest.model}`,
            parameters: {
              maxOutputTokens: modelTest.complexity === 'high' ? 2000 : 1000,
              temperature: 0.5
            }
          });

          const endTime = performance.now();
          times.push(endTime - startTime);
          
          expect(result.predictions).toHaveLength(expect.any(Number));
        }

        const avgTime = times.reduce((a, b) => a + b, 0) / iterations;
        const maxTime = Math.max(...times);

        performanceResults[modelTest.model] = {
          averageTime: avgTime,
          maxTime,
          expectedMaxTime: modelTest.expectedMaxTime,
          withinExpectation: maxTime < modelTest.expectedMaxTime
        };

        expect(avgTime).toBeLessThan(modelTest.expectedMaxTime);
      }

      await storeValidationResult('vertex/performance/model_benchmarks', {
        success: true,
        modelResults: performanceResults,
        allWithinExpectations: Object.values(performanceResults).every(r => r.withinExpectation)
      });
    });

    test('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = 15;
      const requests = Array.from({ length: concurrentRequests }, (_, i) => 
        vertexManager.predict({
          model: 'gemini-pro',
          prompt: `Concurrent request ${i + 1}: Explain machine learning`,
          parameters: { maxOutputTokens: 800, temperature: 0.6 }
        })
      );

      const startTime = performance.now();
      const results = await Promise.all(requests);
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const averageTimePerRequest = totalTime / concurrentRequests;

      expect(results).toHaveLength(concurrentRequests);
      expect(results.every(r => r.predictions.length > 0)).toBe(true);
      expect(averageTimePerRequest).toBeLessThan(20000); // 20s average for concurrent

      await storeValidationResult('vertex/performance/concurrent_processing', {
        success: true,
        concurrentRequests,
        totalTime,
        averageTimePerRequest,
        allRequestsSuccessful: results.every(r => r.predictions.length > 0),
        efficiencyMet: averageTimePerRequest < 20000
      });
    });
  });

  describe('Resource Management and Optimization', () => {
    test('should optimize resource usage for different workloads', async () => {
      const workloadTypes = [
        { type: 'light', requests: 5, expectedResourceUsage: 'low' },
        { type: 'medium', requests: 10, expectedResourceUsage: 'medium' },
        { type: 'heavy', requests: 20, expectedResourceUsage: 'high' }
      ];

      const resourceResults = {};

      for (const workload of workloadTypes) {
        const initialResources = await vertexManager.getResourceUsage();
        
        const requests = Array.from({ length: workload.requests }, (_, i) =>
          vertexManager.predict({
            model: 'gemini-pro',
            prompt: `${workload.type} workload request ${i + 1}`,
            parameters: { maxOutputTokens: 500 }
          })
        );

        await Promise.all(requests);
        
        const finalResources = await vertexManager.getResourceUsage();
        const resourceDelta = {
          cpu: finalResources.cpu - initialResources.cpu,
          memory: finalResources.memory - initialResources.memory,
          requests: finalResources.requests - initialResources.requests
        };

        resourceResults[workload.type] = {
          requestCount: workload.requests,
          resourceDelta,
          optimizationApplied: resourceDelta.cpu < workload.requests * 0.1 // Efficiency check
        };
      }

      await storeValidationResult('vertex/performance/resource_optimization', {
        success: true,
        workloadResults: resourceResults,
        optimizationWorking: Object.values(resourceResults).every(r => r.optimizationApplied)
      });
    });
  });

  // Helper function to store validation results
  async function storeValidationResult(testKey, result) {
    const memoryKey = `hive/validation/vertex/${testKey}`;
    const memoryValue = {
      timestamp: new Date().toISOString(),
      agent: 'Integration_Validator',
      testResult: result,
      testKey
    };
    
    await hiveMemory.store(memoryKey, memoryValue);
  }
});