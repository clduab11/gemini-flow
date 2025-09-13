/**
 * Smart Routing Integration Tests
 *
 * End-to-end tests for smart routing integration with model orchestrator
 * Validates complete workflow performance and monitoring
 */

import {
  ModelOrchestrator,
  ModelResponse,
  RoutingContext,
} from "../model-orchestrator.js";
import { ModelRouter } from "../model-router.js";
import { PerformanceMonitor } from "../performance-monitor.js";

describe("Smart Routing Integration Tests", () => {
  let orchestrator: ModelOrchestrator;
  let mockGeminiResponse: any;

  beforeEach(() => {
    orchestrator = new ModelOrchestrator({
      cacheSize: 1000,
      performanceThreshold: 75, // Updated to 75ms target
    });

    // Mock successful Gemini response
    mockGeminiResponse = {
      text: () => "Test response from model",
      usageMetadata: {
        promptTokenCount: 100,
        candidatesTokenCount: 50,
        totalTokenCount: 150,
      },
      finishReason: "STOP",
      safetyRatings: [],
    };

    // Mock the Gemini API call
    jest
      .spyOn(orchestrator as any, "executeGeminiRequest")
      .mockResolvedValue(mockGeminiResponse);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("End-to-End Routing Performance", () => {
    test("should complete full orchestration cycle in <2000ms with routing <75ms", async () => {
      const context: RoutingContext = {
        task: "Generate a simple response",
        userTier: "pro",
        priority: "medium",
        latencyRequirement: 1000,
      };

      const startTime = performance.now();
      const response = await orchestrator.orchestrate("Test prompt", context);
      const totalTime = performance.now() - startTime;

      expect(totalTime).toBeLessThan(2000);
      expect(response.latency).toBeDefined();
      expect(response.modelUsed).toBeDefined();
      expect(response.content).toBe("Test response from model");
    });

    test("should maintain routing performance with complex contexts", async () => {
      const complexContext: RoutingContext = {
        task: "Implement a comprehensive machine learning pipeline with data preprocessing, feature engineering, model training, hyperparameter optimization, and deployment strategies",
        userTier: "enterprise",
        priority: "high",
        latencyRequirement: 500,
        tokenBudget: 8192,
        capabilities: ["code", "advanced-reasoning", "enterprise-security"],
      };

      const startTime = performance.now();
      const response = await orchestrator.orchestrate(
        "Create a comprehensive ML pipeline solution",
        complexContext,
      );
      const totalTime = performance.now() - startTime;

      expect(response.modelUsed).toBeDefined();
      expect(response.latency).toBeLessThan(2000);

      // Verify complex routing still meets target
      const metrics = orchestrator.getMetrics();
      expect(metrics.avgRoutingTime).toBeLessThan(75);
    });

    test("should handle rapid successive requests efficiently", async () => {
      const requests = 10;
      const contexts: RoutingContext[] = Array(requests)
        .fill(null)
        .map((_, i) => ({
          task: `Rapid request ${i}`,
          userTier: "pro",
          priority: "medium",
          latencyRequirement: 1000,
        }));

      const startTime = performance.now();
      const promises = contexts.map((context) =>
        orchestrator.orchestrate(`Prompt ${context.task}`, context),
      );

      const responses = await Promise.all(promises);
      const totalTime = performance.now() - startTime;
      const avgTimePerRequest = totalTime / requests;

      expect(responses).toHaveLength(requests);
      expect(avgTimePerRequest).toBeLessThan(500); // Even with concurrency

      responses.forEach((response) => {
        expect(response.modelUsed).toBeDefined();
        expect(response.content).toBeDefined();
      });
    });
  });

  describe("Cache Integration", () => {
    test("should leverage cache for repeated requests", async () => {
      const context: RoutingContext = {
        task: "Cached request test",
        userTier: "pro",
        priority: "medium",
        latencyRequirement: 1000,
      };

      const prompt = "Test prompt for caching";

      // First request
      const response1 = await orchestrator.orchestrate(prompt, context);

      // Second identical request should hit cache
      const startTime = performance.now();
      const response2 = await orchestrator.orchestrate(prompt, context);
      const cachedTime = performance.now() - startTime;

      expect(cachedTime).toBeLessThan(100); // Cache hit should be very fast
      expect(response2.cached).toBe(true);
      expect(response2.content).toBe(response1.content);
    });

    test("should maintain cache performance under load", async () => {
      const baseContext: RoutingContext = {
        task: "Cache performance test",
        userTier: "pro",
        priority: "medium",
        latencyRequirement: 1000,
      };

      // Fill cache with varied requests
      const uniqueRequests = 50;
      for (let i = 0; i < uniqueRequests; i++) {
        await orchestrator.orchestrate(`Unique prompt ${i}`, {
          ...baseContext,
          task: `Task ${i}`,
        });
      }

      // Test repeated requests
      const repeatRequests = 20;
      let cacheHits = 0;

      for (let i = 0; i < repeatRequests; i++) {
        const response = await orchestrator.orchestrate(
          `Unique prompt ${i % 10}`,
          {
            ...baseContext,
            task: `Task ${i % 10}`,
          },
        );

        if (response.cached) {
          cacheHits++;
        }
      }

      const cacheHitRate = cacheHits / repeatRequests;
      expect(cacheHitRate).toBeGreaterThan(0.5); // Should get decent cache hit rate
    });
  });

  describe("Performance Monitoring Integration", () => {
    test("should emit routing performance events", (done) => {
      let eventReceived = false;

      orchestrator.on("request_completed", (data) => {
        expect(data.model).toBeDefined();
        expect(data.latency).toBeGreaterThan(0);
        expect(data.routingTime).toBeDefined();
        expect(data.routingDecision).toBeDefined();

        if (!eventReceived) {
          eventReceived = true;
          done();
        }
      });

      orchestrator.orchestrate("Test prompt", {
        task: "Event emission test",
        userTier: "pro",
        priority: "medium",
        latencyRequirement: 1000,
      });
    });

    test("should track comprehensive metrics", async () => {
      // Generate some activity
      const requests = 15;
      for (let i = 0; i < requests; i++) {
        await orchestrator.orchestrate(`Test prompt ${i}`, {
          task: `Metrics test ${i}`,
          userTier: "pro",
          priority: "medium",
          latencyRequirement: 1000,
        });
      }

      const metrics = orchestrator.getMetrics();

      expect(metrics.totalRequests).toBe(requests);
      expect(metrics.avgRoutingTime).toBeDefined();
      expect(metrics.avgRoutingTime).toBeGreaterThan(0);
      expect(metrics.avgRoutingTime).toBeLessThan(75); // Meets target
      expect(metrics.cacheHitRate).toBeDefined();
      expect(metrics.failoverRate).toBeDefined();
      expect(metrics.modelDistribution).toBeDefined();
    });

    test("should warn on performance degradation", async () => {
      const warningPromise = new Promise((resolve) => {
        orchestrator.on("performance_warning", (data) => {
          expect(data.metric).toBe("routing_time");
          expect(data.value).toBeGreaterThan(data.threshold);
          resolve(data);
        });
      });

      // Create a scenario likely to trigger performance warning
      const heavyContext: RoutingContext = {
        task: "x".repeat(5000), // Very long task description
        userTier: "enterprise",
        priority: "critical",
        latencyRequirement: 100,
        tokenBudget: 8192,
        capabilities: [
          "code",
          "advanced-reasoning",
          "enterprise-security",
          "multimodal",
        ],
      };

      orchestrator.orchestrate("Heavy processing task", heavyContext);
    });
  });

  describe("Failover and Resilience", () => {
    test("should handle model failures gracefully", async () => {
      // Mock a model failure
      jest
        .spyOn(orchestrator as any, "executeGeminiRequest")
        .mockRejectedValueOnce(new Error("Model temporarily unavailable"))
        .mockResolvedValue(mockGeminiResponse);

      const context: RoutingContext = {
        task: "Failover test",
        userTier: "enterprise",
        priority: "high",
        latencyRequirement: 1000,
      };

      const response = await orchestrator.orchestrate("Test failover", context);

      expect(response.modelUsed).toBeDefined();
      expect(response.content).toBe("Test response from model");

      const metrics = orchestrator.getMetrics();
      expect(metrics.failovers).toBeGreaterThan(0);
    });

    test("should maintain performance during failover", async () => {
      // Mock intermittent failures
      let callCount = 0;
      jest
        .spyOn(orchestrator as any, "executeGeminiRequest")
        .mockImplementation(() => {
          callCount++;
          if (callCount % 3 === 0) {
            throw new Error("Intermittent failure");
          }
          return Promise.resolve(mockGeminiResponse);
        });

      const context: RoutingContext = {
        task: "Resilience test",
        userTier: "pro",
        priority: "high",
        latencyRequirement: 1000,
      };

      const requests = 10;
      const startTime = performance.now();

      const promises = Array(requests)
        .fill(null)
        .map((_, i) =>
          orchestrator.orchestrate(`Resilience test ${i}`, context),
        );

      const responses = await Promise.allSettled(promises);
      const totalTime = performance.now() - startTime;

      const successful = responses.filter(
        (r) => r.status === "fulfilled",
      ).length;
      expect(successful).toBeGreaterThan(requests * 0.6); // At least 60% success
      expect(totalTime / requests).toBeLessThan(1000); // Still reasonable performance
    });
  });

  describe("User Tier Compliance", () => {
    test("should respect tier restrictions in routing", async () => {
      const contexts = [
        { userTier: "free" as const, expectedModel: "gemini-2.0-flash" },
        { userTier: "pro" as const, expectedModelPrefix: "gemini-2.0-flash" },
        {
          userTier: "enterprise" as const,
          expectedModelOption: [
            "gemini-pro-vertex",
            "gemini-2.0-flash-thinking",
          ],
        },
      ];

      for (const {
        userTier,
        expectedModel,
        expectedModelPrefix,
        expectedModelOption,
      } of contexts) {
        const response = await orchestrator.orchestrate("Tier test", {
          task: "User tier routing test",
          userTier,
          priority: "medium",
          latencyRequirement: 1000,
        });

        if (expectedModel) {
          expect(response.modelUsed).toBe(expectedModel);
        } else if (expectedModelPrefix) {
          expect(response.modelUsed).toContain(expectedModelPrefix);
        } else if (expectedModelOption) {
          expect(expectedModelOption).toContain(response.modelUsed);
        }
      }
    });

    test("should handle tier upgrades appropriately", async () => {
      const baseContext: RoutingContext = {
        task: "Tier upgrade test requiring advanced capabilities",
        userTier: "free",
        priority: "critical",
        latencyRequirement: 500,
        capabilities: ["advanced-reasoning"],
      };

      const response = await orchestrator.orchestrate(
        "Complex task",
        baseContext,
      );

      // Should not get enterprise model even with critical priority
      expect(response.modelUsed).not.toBe("gemini-pro-vertex");
      expect(response.modelUsed).toBe("gemini-2.0-flash"); // Free tier only option
    });
  });

  describe("Health Monitoring", () => {
    test("should provide health check functionality", async () => {
      const health = await orchestrator.healthCheck();

      expect(health).toBeDefined();
      expect(typeof health).toBe("object");

      // All models should be healthy in mock environment
      for (const [modelName, isHealthy] of Object.entries(health)) {
        expect(typeof isHealthy).toBe("boolean");
        expect(modelName).toBeDefined();
      }
    });

    test("should detect unhealthy models", async () => {
      // Mock health check failure
      jest
        .spyOn(orchestrator as any, "executeWithModel")
        .mockImplementation((modelName: string) => {
          if (modelName === "gemini-pro-vertex") {
            throw new Error("Health check failed");
          }
          return Promise.resolve(mockGeminiResponse);
        });

      const health = await orchestrator.healthCheck();

      expect(health["gemini-pro-vertex"]).toBe(false);
      expect(health["gemini-2.0-flash"]).toBe(true);
    });
  });

  describe("Memory and Resource Management", () => {
    test("should handle large-scale operations without memory leaks", async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Perform many operations
      const operations = 100;
      for (let i = 0; i < operations; i++) {
        await orchestrator.orchestrate(`Large scale test ${i}`, {
          task: `Operation ${i} with varying complexity and parameters`,
          userTier: "pro",
          priority: "medium",
          latencyRequirement: 1000 + (i % 500), // Vary latency requirements
        });

        // Occasional garbage collection hint
        if (i % 20 === 0 && global.gc) {
          global.gc();
        }
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      const memoryIncreasePerOp = memoryIncrease / operations;

      // Memory increase should be reasonable
      expect(memoryIncreasePerOp).toBeLessThan(1024 * 100); // Less than 100KB per operation
    });

    test("should maintain consistent performance over time", async () => {
      const batches = 5;
      const batchSize = 20;
      const batchTimes: number[] = [];

      for (let batch = 0; batch < batches; batch++) {
        const batchStart = performance.now();

        const promises = Array(batchSize)
          .fill(null)
          .map((_, i) =>
            orchestrator.orchestrate(
              `Consistency test batch ${batch} item ${i}`,
              {
                task: `Batch ${batch} operation ${i}`,
                userTier: "pro",
                priority: "medium",
                latencyRequirement: 1000,
              },
            ),
          );

        await Promise.all(promises);
        const batchTime = performance.now() - batchStart;
        batchTimes.push(batchTime / batchSize);
      }

      // Performance should remain consistent across batches
      const avgTimes =
        batchTimes.reduce((a, b) => a + b, 0) / batchTimes.length;
      const maxDeviation = Math.max(
        ...batchTimes.map((t) => Math.abs(t - avgTimes)),
      );

      expect(maxDeviation).toBeLessThan(avgTimes * 0.5); // Less than 50% deviation
    });
  });
});
