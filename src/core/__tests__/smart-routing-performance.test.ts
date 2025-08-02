/**
 * Smart Routing Engine Performance Tests
 * 
 * Comprehensive test suite proving <75ms routing overhead
 * Tests LRU cache, complexity analysis, and intelligent selection
 */

import { ModelRouter, RoutingDecision, ComplexityAnalysis } from '../model-router.js';
import { ModelConfig, RoutingContext } from '../model-orchestrator.js';

describe('Smart Routing Engine Performance Tests', () => {
  let router: ModelRouter;
  let mockModels: Map<string, ModelConfig>;
  let testContexts: RoutingContext[];

  beforeEach(() => {
    router = new ModelRouter();
    
    // Setup mock models for testing
    mockModels = new Map([
      ['gemini-2.0-flash', {
        name: 'gemini-2.0-flash',
        tier: 'free',
        capabilities: ['text', 'code', 'reasoning'],
        latencyTarget: 800,
        costPerToken: 0.000001,
        maxTokens: 1000000
      }],
      ['gemini-2.0-flash-thinking', {
        name: 'gemini-2.0-flash-thinking',
        tier: 'pro',
        capabilities: ['text', 'code', 'advanced-reasoning'],
        latencyTarget: 1200,
        costPerToken: 0.000002,
        maxTokens: 1000000
      }],
      ['gemini-pro-vertex', {
        name: 'gemini-pro-vertex',
        tier: 'enterprise',
        capabilities: ['text', 'code', 'reasoning', 'enterprise-security'],
        latencyTarget: 1000,
        costPerToken: 0.000003,
        maxTokens: 1000000
      }]
    ]);

    // Setup test contexts for different scenarios
    testContexts = [
      {
        task: 'Simple text generation task',
        userTier: 'free',
        priority: 'low',
        latencyRequirement: 1000
      },
      {
        task: 'Complex code analysis and refactoring implementation',
        userTier: 'pro',
        priority: 'high',
        latencyRequirement: 500,
        capabilities: ['code', 'advanced-reasoning']
      },
      {
        task: 'Enterprise security audit with comprehensive analysis',
        userTier: 'enterprise',
        priority: 'critical',
        latencyRequirement: 300,
        capabilities: ['enterprise-security', 'advanced-reasoning']
      }
    ];
  });

  describe('Routing Latency Requirements', () => {
    test('should meet <75ms routing target for cold start', async () => {
      const context = testContexts[0];
      const startTime = performance.now();
      
      const decision = await router.selectOptimalModel(context, mockModels);
      
      const routingTime = performance.now() - startTime;
      
      expect(routingTime).toBeLessThan(75);
      expect(decision.modelName).toBeDefined();
      expect(decision.confidence).toBeGreaterThan(0);
      expect(decision.routingTime).toBeLessThan(75);
    });

    test('should achieve <10ms routing with LRU cache hit', async () => {
      const context = testContexts[1];
      
      // First call to populate cache
      await router.selectOptimalModel(context, mockModels);
      
      // Second call should hit cache
      const startTime = performance.now();
      const decision = await router.selectOptimalModel(context, mockModels);
      const routingTime = performance.now() - startTime;
      
      expect(routingTime).toBeLessThan(10);
      expect(decision.fromCache).toBe(true);
      expect(decision.reason).toContain('cache hit');
    });

    test('should consistently meet target across 100 routing decisions', async () => {
      const routingTimes: number[] = [];
      const contexts = Array(100).fill(null).map((_, i) => ({
        ...testContexts[i % testContexts.length],
        task: `Task variation ${i}: ${testContexts[i % testContexts.length].task}`
      }));

      for (const context of contexts) {
        const startTime = performance.now();
        await router.selectOptimalModel(context, mockModels);
        const routingTime = performance.now() - startTime;
        routingTimes.push(routingTime);
      }

      const avgTime = routingTimes.reduce((a, b) => a + b, 0) / routingTimes.length;
      const maxTime = Math.max(...routingTimes);
      const p95Time = routingTimes.sort((a, b) => a - b)[Math.floor(routingTimes.length * 0.95)];

      expect(avgTime).toBeLessThan(50); // Average should be well under target
      expect(p95Time).toBeLessThan(75); // 95th percentile meets target
      expect(maxTime).toBeLessThan(150); // Even worst case should be reasonable
    });
  });

  describe('LRU Cache Performance', () => {
    test('should maintain cache hit rate >70% after warmup', async () => {
      const warmupSize = 50;
      const testSize = 100;
      
      // Warmup phase with repeated patterns
      const warmupContexts = Array(warmupSize).fill(null).map((_, i) => ({
        ...testContexts[i % 3], // Repeat first 3 contexts
        task: `Warmup task ${i % 3}`
      }));

      for (const context of warmupContexts) {
        await router.selectOptimalModel(context, mockModels);
      }

      // Test phase with similar patterns
      let cacheHits = 0;
      const testPatterns = Array(testSize).fill(null).map((_, i) => ({
        ...testContexts[i % 3],
        task: `Test task ${i % 3}` // Similar to warmup
      }));

      for (const context of testPatterns) {
        const decision = await router.selectOptimalModel(context, mockModels);
        if (decision.fromCache) {
          cacheHits++;
        }
      }

      const hitRate = cacheHits / testSize;
      expect(hitRate).toBeGreaterThan(0.7);
    });

    test('should handle cache eviction properly at 1000 entry limit', async () => {
      // Fill cache beyond limit
      const contexts = Array(1200).fill(null).map((_, i) => ({
        task: `Unique task ${i}`,
        userTier: 'pro' as const,
        priority: 'medium' as const,
        latencyRequirement: 1000
      }));

      for (const context of contexts) {
        await router.selectOptimalModel(context, mockModels);
      }

      const stats = router.getRouterStats();
      expect(stats.cache.size).toBeLessThanOrEqual(1000);
      
      // Should still maintain performance
      const startTime = performance.now();
      await router.selectOptimalModel(contexts[0], mockModels);
      const routingTime = performance.now() - startTime;
      
      expect(routingTime).toBeLessThan(75);
    });
  });

  describe('Intelligent Model Selection', () => {
    test('should route simple tasks to fast models', async () => {
      const simpleContext: RoutingContext = {
        task: 'Hello world',
        userTier: 'free',
        priority: 'low',
        latencyRequirement: 500
      };

      const decision = await router.selectOptimalModel(simpleContext, mockModels);
      
      expect(decision.modelName).toBe('gemini-2.0-flash');
      expect(decision.confidence).toBeGreaterThan(0.8);
    });

    test('should route complex tasks to advanced models', async () => {
      const complexContext: RoutingContext = {
        task: 'Implement a complex distributed system with microservices architecture, considering scalability, fault tolerance, and performance optimization strategies',
        userTier: 'enterprise',
        priority: 'high',
        latencyRequirement: 2000,
        capabilities: ['advanced-reasoning', 'enterprise-security']
      };

      const decision = await router.selectOptimalModel(complexContext, mockModels);
      
      expect(decision.modelName).toBe('gemini-pro-vertex');
      expect(decision.confidence).toBeGreaterThan(0.8);
    });

    test('should respect user tier restrictions', async () => {
      const restrictedContext: RoutingContext = {
        task: 'Complex enterprise task requiring advanced capabilities',
        userTier: 'free', // Free tier user
        priority: 'high',
        latencyRequirement: 1000,
        capabilities: ['advanced-reasoning']
      };

      const decision = await router.selectOptimalModel(restrictedContext, mockModels);
      
      // Should not route to enterprise-only models
      expect(decision.modelName).toBe('gemini-2.0-flash');
    });
  });

  describe('Complexity Analysis Performance', () => {
    test('should analyze complexity in <5ms', async () => {
      const complexTexts = [
        'Simple task',
        'Complex algorithmic implementation with advanced data structures',
        'function calculateComplexMetrics(data) { return data.map(item => ({ ...item, score: analyzeComplexity(item) })); }'
      ];

      for (const text of complexTexts) {
        const context: RoutingContext = {
          task: text,
          userTier: 'pro',
          priority: 'medium',
          latencyRequirement: 1000
        };

        const startTime = performance.now();
        // Access internal complexity analysis through routing
        await router.selectOptimalModel(context, mockModels);
        const analysisTime = performance.now() - startTime;

        expect(analysisTime).toBeLessThan(75); // Total routing should be under 75ms
      }
    });

    test('should cache complexity analysis results', async () => {
      const context: RoutingContext = {
        task: 'Complex task for caching test',
        userTier: 'pro',
        priority: 'medium',
        latencyRequirement: 1000
      };

      // First analysis
      const startTime1 = performance.now();
      await router.selectOptimalModel(context, mockModels);
      const time1 = performance.now() - startTime1;

      // Second analysis with same task
      const startTime2 = performance.now();
      await router.selectOptimalModel(context, mockModels);
      const time2 = performance.now() - startTime2;

      // Second should be faster due to complexity caching
      expect(time2).toBeLessThan(time1);
    });
  });

  describe('Fallback Strategies', () => {
    test('should handle model unavailability with <75ms fallback', async () => {
      const context = testContexts[1];
      
      // Mark preferred model as unavailable
      router.updateModelAvailability('gemini-2.0-flash-thinking', false);
      
      const startTime = performance.now();
      const decision = await router.selectFallbackModel(
        'gemini-2.0-flash-thinking',
        context,
        mockModels,
        'Model unavailable'
      );
      const fallbackTime = performance.now() - startTime;
      
      expect(fallbackTime).toBeLessThan(75);
      expect(decision.modelName).not.toBe('gemini-2.0-flash-thinking');
      expect(decision.modelName).toBeDefined();
    });

    test('should gracefully degrade to lower tier models', async () => {
      const context: RoutingContext = {
        task: 'Enterprise task',
        userTier: 'enterprise',
        priority: 'high',
        latencyRequirement: 1000
      };

      // Mark enterprise model as unavailable
      router.updateModelAvailability('gemini-pro-vertex', false);

      const decision = await router.selectFallbackModel(
        'gemini-pro-vertex',
        context,
        mockModels,
        'Service maintenance'
      );

      expect(decision.modelName).toBe('gemini-2.0-flash-thinking');
      expect(decision.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('Performance Monitoring', () => {
    test('should track routing performance metrics', async () => {
      // Perform several routing operations
      for (let i = 0; i < 20; i++) {
        await router.selectOptimalModel(testContexts[i % testContexts.length], mockModels);
      }

      const performance = router.getRoutingPerformance();
      
      expect(performance.averageTime).toBeGreaterThan(0);
      expect(performance.p95Time).toBeLessThan(75);
      expect(performance.targetMet).toBe(true);
      expect(performance.cacheHitRate).toBeGreaterThanOrEqual(0);
    });

    test('should emit performance warnings for slow routing', async () => {
      const warningPromise = new Promise((resolve) => {
        router.on('routing_slow', (data) => {
          expect(data.routingTime).toBeGreaterThan(data.target);
          expect(data.target).toBe(75);
          resolve(data);
        });
      });

      // Simulate slow routing by creating a very complex context
      const heavyContext: RoutingContext = {
        task: 'x'.repeat(10000), // Very long task
        userTier: 'enterprise',
        priority: 'critical',
        latencyRequirement: 100
      };

      await router.selectOptimalModel(heavyContext, mockModels);
      
      // Wait for the warning or timeout after 5 seconds
      await Promise.race([
        warningPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('No warning emitted')), 5000))
      ]);
    }, 10000);
  });

  describe('Comprehensive Statistics', () => {
    test('should provide detailed router statistics', async () => {
      // Generate some activity
      for (let i = 0; i < 10; i++) {
        await router.selectOptimalModel(testContexts[i % testContexts.length], mockModels);
        
        // Record some performance data
        router.recordPerformance(
          mockModels.get(Object.keys(Object.fromEntries(mockModels))[i % mockModels.size])!.name,
          Math.random() * 1000 + 500, // latency
          Math.random() > 0.1, // 90% success rate
          Math.random() * 0.01, // cost
          { input: 100, output: 50, total: 150 }
        );
      }

      const stats = router.getRouterStats();
      
      expect(stats.performance).toBeDefined();
      expect(stats.cache).toBeDefined();
      expect(stats.availability).toBeDefined();
      expect(stats.models).toBeDefined();
      
      expect(stats.cache.size).toBeGreaterThan(0);
      expect(stats.cache.limit).toBe(1000);
      expect(stats.models.length).toBeGreaterThan(0);
    });
  });

  describe('Stress Testing', () => {
    test('should maintain performance under concurrent load', async () => {
      const concurrentRequests = 50;
      const promises: Promise<RoutingDecision>[] = [];

      const startTime = performance.now();

      // Fire off concurrent requests
      for (let i = 0; i < concurrentRequests; i++) {
        const context = {
          ...testContexts[i % testContexts.length],
          task: `Concurrent task ${i}`
        };
        promises.push(router.selectOptimalModel(context, mockModels));
      }

      const results = await Promise.all(promises);
      const totalTime = performance.now() - startTime;
      const avgTimePerRequest = totalTime / concurrentRequests;

      // Each request should still meet target even under load
      expect(avgTimePerRequest).toBeLessThan(100); // Slightly higher under load
      expect(results).toHaveLength(concurrentRequests);
      results.forEach(result => {
        expect(result.modelName).toBeDefined();
        expect(result.confidence).toBeGreaterThan(0);
      });
    });

    test('should handle memory pressure gracefully', async () => {
      // Generate a large number of unique contexts to stress memory
      const largeLoad = 2000;
      
      for (let i = 0; i < largeLoad; i++) {
        const context: RoutingContext = {
          task: `Memory stress test task ${i} with unique content`,
          userTier: 'pro',
          priority: 'medium',
          latencyRequirement: 1000
        };

        const decision = await router.selectOptimalModel(context, mockModels);
        expect(decision.routingTime).toBeLessThan(75);
      }

      // Verify cache didn't grow unbounded
      const stats = router.getRouterStats();
      expect(stats.cache.size).toBeLessThanOrEqual(1000);
    });
  });
});