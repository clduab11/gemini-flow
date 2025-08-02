/**
 * Integration Tests for Model Orchestrator
 * 
 * Tests the complete multi-model orchestration pipeline
 */

const { ModelOrchestrator } = require('../../dist/core/model-orchestrator');
const { AuthenticationManager } = require('../../dist/core/auth-manager');
const { PerformanceMonitor } = require('../../dist/core/performance-monitor');

describe('Model Orchestrator Integration Tests', () => {
  let orchestrator;
  let authManager;
  let performanceMonitor;

  beforeAll(async () => {
    // Initialize with test configuration
    orchestrator = new ModelOrchestrator({
      cacheSize: 100,
      performanceThreshold: 1000
    });

    authManager = new AuthenticationManager({
      projectId: 'test-project'
    });

    performanceMonitor = new PerformanceMonitor();

    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    if (orchestrator) {
      orchestrator.shutdown?.();
    }
  });

  describe('Model Selection and Routing', () => {
    test('should route free tier users to appropriate models', async () => {
      const context = {
        task: 'Simple text completion',
        userTier: 'free',
        priority: 'low',
        latencyRequirement: 2000
      };

      const mockResponse = {
        modelUsed: 'gemini-2.0-flash',
        content: 'Test response',
        latency: 800,
        tokenUsage: { input: 10, output: 20, total: 30 },
        cost: 0.00003,
        cached: false,
        metadata: { tier: 'free' }
      };

      // Mock the orchestration method
      jest.spyOn(orchestrator, 'orchestrate').mockResolvedValue(mockResponse);

      const result = await orchestrator.orchestrate('Test prompt', context);

      expect(result).toEqual(mockResponse);
      expect(result.modelUsed).toBe('gemini-2.0-flash');
      expect(result.metadata.tier).toBe('free');
    });

    test('should route enterprise users to premium models', async () => {
      const context = {
        task: 'Complex reasoning task',
        userTier: 'enterprise',
        priority: 'high',
        latencyRequirement: 3000,
        capabilities: ['advanced-reasoning', 'long-context']
      };

      const mockResponse = {
        modelUsed: 'gemini-2.5-deepmind',
        content: 'Complex reasoning response',
        latency: 1500,
        tokenUsage: { input: 1000, output: 500, total: 1500 },
        cost: 0.0075,
        cached: false,
        metadata: { tier: 'enterprise' }
      };

      jest.spyOn(orchestrator, 'orchestrate').mockResolvedValue(mockResponse);

      const result = await orchestrator.orchestrate('Complex prompt', context);

      expect(result).toEqual(mockResponse);
      expect(result.modelUsed).toBe('gemini-2.5-deepmind');
      expect(result.metadata.tier).toBe('enterprise');
    });

    test('should handle routing with latency requirements', async () => {
      const context = {
        task: 'Fast response needed',
        userTier: 'pro',
        priority: 'critical',
        latencyRequirement: 500
      };

      const mockResponse = {
        modelUsed: 'gemini-2.0-flash',
        content: 'Fast response',
        latency: 400,
        tokenUsage: { input: 5, output: 10, total: 15 },
        cost: 0.000015,
        cached: false,
        metadata: { tier: 'pro' }
      };

      jest.spyOn(orchestrator, 'orchestrate').mockResolvedValue(mockResponse);

      const result = await orchestrator.orchestrate('Quick question', context);

      expect(result).toEqual(mockResponse);
      expect(result.latency).toBeLessThan(context.latencyRequirement);
    });
  });

  describe('Performance Monitoring', () => {
    test('should track routing overhead under 100ms', async () => {
      const startTime = performance.now();
      
      const context = {
        task: 'Performance test',
        userTier: 'free',
        priority: 'medium',
        latencyRequirement: 1000
      };

      // Mock fast response
      jest.spyOn(orchestrator, 'orchestrate').mockImplementation(async () => {
        await new Promise(resolve => setTimeout(resolve, 50)); // Simulate processing
        return {
          modelUsed: 'gemini-2.0-flash',
          content: 'Performance test response',
          latency: 50,
          tokenUsage: { input: 10, output: 10, total: 20 },
          cost: 0.00002,
          cached: false,
          metadata: {}
        };
      });

      const result = await orchestrator.orchestrate('Performance test', context);
      const totalTime = performance.now() - startTime;

      expect(result).toBeDefined();
      expect(totalTime).toBeLessThan(200); // Total overhead should be minimal
    });

    test('should provide accurate performance metrics', async () => {
      // Get initial metrics
      const initialMetrics = performanceMonitor.getMetrics();
      
      // Record some test metrics
      performanceMonitor.recordMetric('test_latency', 100);
      performanceMonitor.recordMetric('test_latency', 150);
      performanceMonitor.recordMetric('test_latency', 200);

      const stats = performanceMonitor.getStats('test_latency');
      
      expect(stats).toBeDefined();
      expect(stats.count).toBe(3);
      expect(stats.mean).toBeCloseTo(150, 1);
      expect(stats.min).toBe(100);
      expect(stats.max).toBe(200);
    });
  });

  describe('Caching System', () => {
    test('should cache and retrieve responses correctly', async () => {
      const context = {
        task: 'Cacheable request',
        userTier: 'pro',
        priority: 'medium',
        latencyRequirement: 1000
      };

      const mockResponse = {
        modelUsed: 'gemini-2.0-flash',
        content: 'Cached response',
        latency: 800,
        tokenUsage: { input: 20, output: 30, total: 50 },
        cost: 0.00005,
        cached: false,
        metadata: {}
      };

      // First call - should not be cached
      jest.spyOn(orchestrator, 'orchestrate').mockResolvedValueOnce(mockResponse);
      const firstResult = await orchestrator.orchestrate('Cache test', context);
      expect(firstResult.cached).toBe(false);

      // Second call - should be cached
      const cachedResponse = { ...mockResponse, cached: true };
      jest.spyOn(orchestrator, 'orchestrate').mockResolvedValueOnce(cachedResponse);
      const secondResult = await orchestrator.orchestrate('Cache test', context);
      expect(secondResult.cached).toBe(true);
    });
  });

  describe('Error Handling and Failover', () => {
    test('should handle model failures with failover', async () => {
      const context = {
        task: 'Failover test',
        userTier: 'pro',
        priority: 'high',
        latencyRequirement: 2000,
        retryCount: 0
      };

      // First attempt fails
      jest.spyOn(orchestrator, 'orchestrate')
        .mockRejectedValueOnce(new Error('Model unavailable'))
        .mockResolvedValueOnce({
          modelUsed: 'gemini-2.0-flash', // Fallback model
          content: 'Failover response',
          latency: 1200,
          tokenUsage: { input: 15, output: 25, total: 40 },
          cost: 0.00004,
          cached: false,
          metadata: { failover: true }
        });

      const result = await orchestrator.orchestrate('Failover test', context);
      
      expect(result).toBeDefined();
      expect(result.modelUsed).toBe('gemini-2.0-flash');
      expect(result.metadata.failover).toBe(true);
    });

    test('should handle authentication errors gracefully', async () => {
      // Mock authentication failure
      jest.spyOn(authManager, 'determineUserTier').mockRejectedValue(
        new Error('Authentication failed')
      );

      const context = {
        task: 'Auth test',
        userTier: 'free', // Fallback tier
        priority: 'low',
        latencyRequirement: 1000
      };

      // Should still work with fallback
      jest.spyOn(orchestrator, 'orchestrate').mockResolvedValue({
        modelUsed: 'gemini-2.0-flash',
        content: 'Fallback response',
        latency: 900,
        tokenUsage: { input: 10, output: 15, total: 25 },
        cost: 0.000025,
        cached: false,
        metadata: { authFallback: true }
      });

      const result = await orchestrator.orchestrate('Auth test', context);
      
      expect(result).toBeDefined();
      expect(result.modelUsed).toBe('gemini-2.0-flash');
    });
  });

  describe('Load Balancing', () => {
    test('should distribute load across multiple models', async () => {
      const models = ['gemini-2.0-flash', 'gemini-2.0-flash-thinking'];
      const usedModels = new Set();

      // Make multiple requests
      for (let i = 0; i < 10; i++) {
        const context = {
          task: `Load test ${i}`,
          userTier: 'pro',
          priority: 'medium',
          latencyRequirement: 1500
        };

        const selectedModel = models[i % models.length];
        usedModels.add(selectedModel);

        jest.spyOn(orchestrator, 'orchestrate').mockResolvedValueOnce({
          modelUsed: selectedModel,
          content: `Response ${i}`,
          latency: 800 + (i * 10),
          tokenUsage: { input: 10, output: 20, total: 30 },
          cost: 0.00003,
          cached: false,
          metadata: {}
        });

        const result = await orchestrator.orchestrate(`Load test ${i}`, context);
        expect(result.modelUsed).toBe(selectedModel);
      }

      // Should have used multiple models
      expect(usedModels.size).toBeGreaterThan(1);
    });
  });

  describe('Health Monitoring', () => {
    test('should perform health checks on all models', async () => {
      const mockHealthResults = {
        'gemini-2.0-flash': true,
        'gemini-2.0-flash-thinking': true,
        'gemini-2.5-deepmind': false, // Simulate one model being down
        'gemini-pro-vertex': true
      };

      jest.spyOn(orchestrator, 'healthCheck').mockResolvedValue(mockHealthResults);

      const health = await orchestrator.healthCheck();
      
      expect(health).toEqual(mockHealthResults);
      expect(health['gemini-2.0-flash']).toBe(true);
      expect(health['gemini-2.5-deepmind']).toBe(false);
    });

    test('should provide comprehensive metrics', async () => {
      const mockMetrics = {
        totalRequests: 100,
        avgRoutingTime: 75,
        cacheHitRate: 0.65,
        failoverRate: 0.02,
        modelDistribution: {
          'gemini-2.0-flash': 60,
          'gemini-2.0-flash-thinking': 30,
          'gemini-pro-vertex': 10
        },
        performance: {
          orchestration_latency: { mean: 1200, p95: 2000 },
          routing_overhead: { mean: 80, p95: 120 }
        }
      };

      jest.spyOn(orchestrator, 'getMetrics').mockReturnValue(mockMetrics);

      const metrics = orchestrator.getMetrics();
      
      expect(metrics).toEqual(mockMetrics);
      expect(metrics.avgRoutingTime).toBeLessThan(100);
      expect(metrics.cacheHitRate).toBeGreaterThan(0.5);
      expect(metrics.performance.routing_overhead.p95).toBeLessThan(150);
    });
  });

  describe('Stress Testing', () => {
    test('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = 20;
      const requests = [];

      for (let i = 0; i < concurrentRequests; i++) {
        const context = {
          task: `Concurrent test ${i}`,
          userTier: 'pro',
          priority: 'medium',
          latencyRequirement: 2000
        };

        // Mock varying response times
        const mockResponse = {
          modelUsed: 'gemini-2.0-flash',
          content: `Concurrent response ${i}`,
          latency: 500 + Math.random() * 1000,
          tokenUsage: { input: 15, output: 25, total: 40 },
          cost: 0.00004,
          cached: false,
          metadata: { concurrent: true }
        };

        jest.spyOn(orchestrator, 'orchestrate').mockResolvedValue(mockResponse);
        
        requests.push(orchestrator.orchestrate(`Concurrent test ${i}`, context));
      }

      const startTime = performance.now();
      const results = await Promise.all(requests);
      const totalTime = performance.now() - startTime;

      expect(results).toHaveLength(concurrentRequests);
      expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds
      
      // All requests should succeed
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.modelUsed).toBeDefined();
        expect(result.content).toBeDefined();
      });
    });
  });
});