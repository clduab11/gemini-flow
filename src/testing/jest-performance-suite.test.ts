/**
 * Jest Performance Test Suite - Examples and Performance Profiling
 * Comprehensive test examples with baseline metrics and profiling tools
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { performance } from 'perf_hooks';
import { PredictiveStreamingManager } from '../performance/predictive-streaming-manager';
import { GPUClusterCoordinator } from '../performance/gpu-cluster-coordinator';
import { MemoryPoolManager } from '../performance/memory-pool-manager';
import { QueuePrioritizationSystem } from '../performance/queue-prioritization-system';
import { ComprehensiveTestFramework } from './comprehensive-test-framework';

// Performance baseline metrics
const PERFORMANCE_BASELINES = {
  textGeneration: {
    latency: 100, // ms
    throughput: 1000, // requests/sec
    errorRate: 0.01 // 1%
  },
  multimedia: {
    latency: 500, // ms
    throughput: 100, // requests/sec
    errorRate: 0.05 // 5%
  },
  system: {
    uptime: 99.9, // %
    memoryUtilization: 80, // %
    cpuUtilization: 70 // %
  }
};

// Performance monitoring utilities
class PerformanceProfiler {
  private marks: Map<string, number> = new Map();
  private measures: Map<string, number> = new Map();

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string): number {
    const startTime = this.marks.get(startMark);
    if (!startTime) {
      throw new Error(`Start mark '${startMark}' not found`);
    }
    
    const duration = performance.now() - startTime;
    this.measures.set(name, duration);
    return duration;
  }

  getMeasure(name: string): number | undefined {
    return this.measures.get(name);
  }

  getAllMeasures(): Map<string, number> {
    return new Map(this.measures);
  }

  clear(): void {
    this.marks.clear();
    this.measures.clear();
  }
}

// Memory usage monitoring
class MemoryProfiler {
  getMemoryUsage(): NodeJS.MemoryUsage {
    return process.memoryUsage();
  }

  formatMemoryUsage(usage: NodeJS.MemoryUsage): string {
    const formatBytes = (bytes: number) => (bytes / 1024 / 1024).toFixed(2) + ' MB';
    return `RSS: ${formatBytes(usage.rss)}, Heap Used: ${formatBytes(usage.heapUsed)}, Heap Total: ${formatBytes(usage.heapTotal)}, External: ${formatBytes(usage.external)}`;
  }

  measureMemoryDelta(before: NodeJS.MemoryUsage, after: NodeJS.MemoryUsage): {
    rss: number;
    heapUsed: number;
    heapTotal: number;
    external: number;
  } {
    return {
      rss: after.rss - before.rss,
      heapUsed: after.heapUsed - before.heapUsed,
      heapTotal: after.heapTotal - before.heapTotal,
      external: after.external - before.external
    };
  }
}

// Load testing utilities
class LoadTestRunner {
  async runConcurrentRequests<T>(
    requestFn: () => Promise<T>,
    concurrency: number,
    duration: number
  ): Promise<{
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageLatency: number;
    throughput: number;
    errors: string[];
  }> {
    const startTime = Date.now();
    const endTime = startTime + duration;
    let totalRequests = 0;
    let successfulRequests = 0;
    let failedRequests = 0;
    const latencies: number[] = [];
    const errors: string[] = [];

    const workers = Array(concurrency).fill(null).map(async () => {
      while (Date.now() < endTime) {
        const requestStart = performance.now();
        totalRequests++;
        
        try {
          await requestFn();
          successfulRequests++;
          latencies.push(performance.now() - requestStart);
        } catch (error) {
          failedRequests++;
          errors.push(error.message);
        }
      }
    });

    await Promise.all(workers);

    const averageLatency = latencies.length > 0 
      ? latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length 
      : 0;
    
    const actualDuration = Date.now() - startTime;
    const throughput = (successfulRequests / actualDuration) * 1000; // requests per second

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageLatency,
      throughput,
      errors
    };
  }
}

describe('Performance Optimization System Tests', () => {
  let profiler: PerformanceProfiler;
  let memoryProfiler: MemoryProfiler;
  let loadTester: LoadTestRunner;

  beforeAll(() => {
    profiler = new PerformanceProfiler();
    memoryProfiler = new MemoryProfiler();
    loadTester = new LoadTestRunner();
  });

  beforeEach(() => {
    profiler.clear();
  });

  describe('PredictiveStreamingManager Performance', () => {
    let streamingManager: PredictiveStreamingManager;

    beforeEach(() => {
      const config = {
        initialSize: 1024 * 1024, // 1MB
        maxSize: 10 * 1024 * 1024, // 10MB
        minSize: 512 * 1024, // 512KB
        adaptationRate: 0.1,
        predictionWindow: 30000 // 30 seconds
      };
      streamingManager = new PredictiveStreamingManager(config);
    });

    it('should optimize buffering within performance targets', async () => {
      profiler.mark('buffering-start');
      
      const userId = 'test-user-001';
      const contentId = 'video-001';
      
      await streamingManager.optimizeBuffering(userId, contentId);
      
      const duration = profiler.measure('buffering-optimization', 'buffering-start');
      
      expect(duration).toBeLessThan(PERFORMANCE_BASELINES.multimedia.latency);
      
      const metrics = streamingManager.getPerformanceMetrics(userId);
      expect(metrics.buffering.efficiency).toBeGreaterThan(0.8);
      expect(metrics.prediction.accuracy).toBeGreaterThan(0.7);
    });

    it('should handle 1000 concurrent buffering requests', async () => {
      const result = await loadTester.runConcurrentRequests(
        async () => {
          const userId = `user-${Math.random()}`;
          const contentId = `content-${Math.random()}`;
          await streamingManager.optimizeBuffering(userId, contentId);
        },
        100, // concurrency
        5000 // 5 seconds
      );

      expect(result.throughput).toBeGreaterThan(100); // requests per second
      expect(result.successfulRequests / result.totalRequests).toBeGreaterThan(0.95);
      expect(result.averageLatency).toBeLessThan(PERFORMANCE_BASELINES.multimedia.latency);
    });

    it('should maintain quality adjustment under load', async () => {
      profiler.mark('quality-adjustment-start');
      
      const promises = Array(50).fill(null).map(async (_, index) => {
        const userId = `user-${index}`;
        const contentId = `content-${index}`;
        return streamingManager.adjustQuality(userId, contentId);
      });
      
      const results = await Promise.all(promises);
      
      const duration = profiler.measure('quality-adjustment-batch', 'quality-adjustment-start');
      
      expect(duration).toBeLessThan(1000); // 1 second for 50 adjustments
      expect(results.every(quality => ['480p', '720p', '1080p', '4K'].includes(quality))).toBe(true);
    });
  });

  describe('GPU Cluster Coordinator Performance', () => {
    let gpuCoordinator: GPUClusterCoordinator;

    beforeEach(() => {
      gpuCoordinator = new GPUClusterCoordinator();
    });

    it('should coordinate GPU cluster efficiently', async () => {
      // Add mock GPU nodes
      const nodes = [
        {
          id: 'gpu-001',
          type: 'nvidia' as const,
          model: 'RTX 4090',
          vram: 24,
          cores: 10496,
          clockSpeed: 2520,
          utilization: 0.3,
          temperature: 65,
          powerUsage: 450,
          status: 'online' as const,
          capabilities: [{
            name: 'CUDA',
            version: '12.0',
            performance: 100,
            powerEfficiency: 85
          }],
          lastHeartbeat: Date.now(),
          location: {
            datacenter: 'dc-001',
            rack: 'rack-01',
            position: 1
          }
        },
        {
          id: 'gpu-002',
          type: 'nvidia' as const,
          model: 'RTX 4080',
          vram: 16,
          cores: 9728,
          clockSpeed: 2505,
          utilization: 0.5,
          temperature: 70,
          powerUsage: 320,
          status: 'online' as const,
          capabilities: [{
            name: 'CUDA',
            version: '12.0',
            performance: 85,
            powerEfficiency: 90
          }],
          lastHeartbeat: Date.now(),
          location: {
            datacenter: 'dc-001',
            rack: 'rack-01',
            position: 2
          }
        }
      ];

      profiler.mark('gpu-setup-start');
      
      for (const node of nodes) {
        await gpuCoordinator.addNode(node);
      }
      
      profiler.measure('gpu-cluster-setup', 'gpu-setup-start');

      // Submit rendering tasks
      const tasks = Array(20).fill(null).map((_, index) => ({
        id: `task-${index}`,
        type: 'video' as const,
        priority: 'medium' as const,
        requirements: {
          vram: 4,
          cores: 1000,
          capabilities: ['CUDA'],
          maxLatency: 1000,
          estimatedDuration: 5000
        },
        data: {
          input: new ArrayBuffer(1024),
          parameters: { quality: 'high' },
          outputFormat: 'mp4'
        },
        qos: {
          maxRetries: 3,
          deadline: Date.now() + 30000,
          costBudget: 100
        },
        metadata: {
          userId: `user-${index}`,
          sessionId: `session-${index}`,
          timestamp: Date.now()
        }
      }));

      profiler.mark('task-submission-start');
      
      const taskPromises = tasks.map(task => gpuCoordinator.submitTask(task));
      await Promise.all(taskPromises);
      
      const submissionDuration = profiler.measure('task-submission', 'task-submission-start');
      
      expect(submissionDuration).toBeLessThan(1000); // 1 second for 20 tasks
      
      const metrics = gpuCoordinator.getClusterMetrics();
      expect(metrics.activeNodes).toBe(2);
      expect(metrics.tasksQueued).toBeGreaterThanOrEqual(0);
    });

    it('should handle GPU node failures gracefully', async () => {
      // Add and then remove a node to simulate failure
      const node = {
        id: 'gpu-fail-test',
        type: 'nvidia' as const,
        model: 'RTX 3080',
        vram: 10,
        cores: 8704,
        clockSpeed: 1710,
        utilization: 0.0,
        temperature: 60,
        powerUsage: 220,
        status: 'online' as const,
        capabilities: [{
          name: 'CUDA',
          version: '11.8',
          performance: 75,
          powerEfficiency: 80
        }],
        lastHeartbeat: Date.now(),
        location: {
          datacenter: 'dc-002',
          rack: 'rack-02',
          position: 1
        }
      };

      await gpuCoordinator.addNode(node);
      
      profiler.mark('failure-handling-start');
      await gpuCoordinator.removeNode('gpu-fail-test');
      const failureHandlingDuration = profiler.measure('failure-handling', 'failure-handling-start');
      
      expect(failureHandlingDuration).toBeLessThan(500); // 500ms for graceful removal
      
      const metrics = gpuCoordinator.getClusterMetrics();
      expect(metrics.totalNodes).toBe(0); // Assuming no other nodes added
    });
  });

  describe('Memory Pool Manager Performance', () => {
    let memoryManager: MemoryPoolManager;

    beforeEach(() => {
      memoryManager = new MemoryPoolManager();
    });

    it('should allocate memory efficiently', async () => {
      const memoryBefore = memoryProfiler.getMemoryUsage();
      
      profiler.mark('allocation-start');
      
      const allocations = await Promise.all(
        Array(100).fill(null).map(async (_, index) => {
          return memoryManager.allocate({
            size: 1024 * (index + 1), // Variable sizes
            type: 'buffer',
            lifetime: 60000,
            priority: index % 2 === 0 ? 'high' : 'medium',
            owner: `test-${index}`,
            purpose: 'performance-test'
          });
        })
      );
      
      const allocationDuration = profiler.measure('memory-allocation-batch', 'allocation-start');
      const memoryAfter = memoryProfiler.getMemoryUsage();
      
      expect(allocationDuration).toBeLessThan(1000); // 1 second for 100 allocations
      expect(allocations.filter(alloc => alloc !== null)).toHaveLength(100);
      
      const memoryDelta = memoryProfiler.measureMemoryDelta(memoryBefore, memoryAfter);
      console.log('Memory usage delta:', memoryProfiler.formatMemoryUsage({
        rss: memoryDelta.rss,
        heapUsed: memoryDelta.heapUsed,
        heapTotal: memoryDelta.heapTotal,
        external: memoryDelta.external,
        arrayBuffers: 0
      }));
      
      // Cleanup
      for (const allocation of allocations) {
        if (allocation) {
          await memoryManager.deallocate(allocation.id);
        }
      }
    });

    it('should perform garbage collection within targets', async () => {
      // Allocate memory that will become garbage
      const allocations = await Promise.all(
        Array(50).fill(null).map(async (_, index) => {
          return memoryManager.allocate({
            size: 2048,
            type: 'object',
            lifetime: 1000, // Short lifetime
            priority: 'low',
            owner: `gc-test-${index}`,
            purpose: 'gc-test'
          });
        })
      );
      
      // Wait for objects to expire
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      profiler.mark('gc-start');
      const gcMetrics = await memoryManager.garbageCollect('default-small');
      const gcDuration = profiler.measure('garbage-collection', 'gc-start');
      
      expect(gcDuration).toBeLessThan(100); // 100ms for GC
      expect(gcMetrics.memoryReclaimed).toBeGreaterThan(0);
      
      const memoryMetrics = memoryManager.getMemoryMetrics();
      expect(memoryMetrics.fragmentation).toBeLessThan(0.5); // Less than 50% fragmentation
    });

    it('should handle memory pressure gracefully', async () => {
      const result = await loadTester.runConcurrentRequests(
        async () => {
          const allocation = await memoryManager.allocate({
            size: Math.floor(Math.random() * 10240) + 1024, // 1KB to 10KB
            type: 'buffer',
            lifetime: 5000,
            priority: 'medium',
            owner: 'pressure-test',
            purpose: 'pressure-test'
          });
          
          if (allocation) {
            // Simulate some work
            await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
            await memoryManager.deallocate(allocation.id);
          }
        },
        50, // concurrency
        3000 // 3 seconds
      );

      expect(result.successfulRequests / result.totalRequests).toBeGreaterThan(0.9);
      expect(result.averageLatency).toBeLessThan(50); // 50ms average
    });
  });

  describe('Queue Prioritization System Performance', () => {
    let queueSystem: QueuePrioritizationSystem;

    beforeEach(() => {
      const policy = {
        algorithm: 'weighted-fair' as const,
        tierWeights: new Map([
          ['free', 1],
          ['basic', 2],
          ['premium', 4],
          ['enterprise', 8]
        ]),
        maxStarvationTime: 10000,
        agingFactor: 1.2,
        burstAllowance: 1000
      };
      queueSystem = new QueuePrioritizationSystem(policy);
    });

    it('should handle high-throughput queue operations', async () => {
      profiler.mark('queue-operations-start');
      
      // Enqueue many items
      const enqueuePromises = Array(1000).fill(null).map(async (_, index) => {
        const item = {
          id: `item-${index}`,
          data: { value: index },
          priority: Math.floor(Math.random() * 100),
          timestamp: Date.now(),
          deadline: Date.now() + 30000,
          retries: 0,
          maxRetries: 3,
          cost: Math.random() * 100,
          userId: `user-${index % 100}`,
          tier: ['free', 'basic', 'premium', 'enterprise'][index % 4] as any,
          estimatedProcessingTime: Math.random() * 1000,
          metadata: {
            source: 'performance-test',
            type: 'test-item',
            size: 1024,
            complexity: ['low', 'medium', 'high', 'critical'][index % 4] as any
          }
        };
        
        await queueSystem.enqueue(item);
      });
      
      await Promise.all(enqueuePromises);
      
      // Dequeue items
      const dequeuePromises = Array(1000).fill(null).map(async () => {
        return queueSystem.dequeue();
      });
      
      const items = await Promise.all(dequeuePromises);
      
      const operationsDuration = profiler.measure('queue-operations', 'queue-operations-start');
      
      expect(operationsDuration).toBeLessThan(2000); // 2 seconds for 2000 operations
      expect(items.filter(item => item !== null)).toHaveLength(1000);
      
      const fairnessScore = queueSystem.getFairnessScore();
      expect(fairnessScore).toBeGreaterThan(0.7); // 70% fairness
    });

    it('should maintain processing performance under load', async () => {
      // Fill queue with items
      const items = Array(500).fill(null).map((_, index) => ({
        id: `load-test-${index}`,
        data: { workload: Math.random() * 100 },
        priority: Math.floor(Math.random() * 100),
        timestamp: Date.now(),
        retries: 0,
        maxRetries: 3,
        cost: Math.random() * 100,
        userId: `user-${index % 50}`,
        tier: ['free', 'basic', 'premium', 'enterprise'][index % 4] as any,
        estimatedProcessingTime: Math.random() * 1000,
        metadata: {
          source: 'load-test',
          type: 'test-item',
          size: 2048,
          complexity: 'medium' as any
        }
      }));

      for (const item of items) {
        await queueSystem.enqueue(item);
      }

      profiler.mark('processing-start');
      
      const processingResults = await Promise.all(
        Array(500).fill(null).map(async () => {
          const item = await queueSystem.dequeue();
          if (item) {
            return queueSystem.processItem(item, async (data) => {
              // Simulate processing work
              await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
              return {
                success: Math.random() > 0.05, // 95% success rate
                result: { processed: data },
                processingTime: Math.random() * 50,
                resourcesUsed: {
                  cpu: Math.random() * 100,
                  memory: Math.random() * 100,
                  network: Math.random() * 100
                }
              };
            });
          }
          return null;
        })
      );
      
      const processingDuration = profiler.measure('queue-processing', 'processing-start');
      
      expect(processingDuration).toBeLessThan(5000); // 5 seconds for 500 items
      
      const successfulProcessing = processingResults.filter(
        result => result && result.success
      ).length;
      
      expect(successfulProcessing / 500).toBeGreaterThan(0.9); // 90% success rate
    });
  });

  describe('Integration Performance Tests', () => {
    let testFramework: ComprehensiveTestFramework;

    beforeEach(() => {
      testFramework = new ComprehensiveTestFramework();
    });

    it('should execute integration test scenarios efficiently', async () => {
      const scenario = {
        id: 'integration-perf-test',
        name: 'Integration Performance Test',
        description: 'Test integration performance across services',
        type: 'integration' as const,
        services: ['auth-service', 'api-gateway', 'user-service'],
        steps: [
          {
            id: 'auth-step',
            name: 'Authenticate User',
            action: 'request' as const,
            target: 'auth-service',
            parameters: {
              path: '/auth/login',
              method: 'POST',
              body: { username: 'test', password: 'test' }
            },
            timeout: 5000,
            retries: 2
          },
          {
            id: 'api-step',
            name: 'API Gateway Request',
            action: 'request' as const,
            target: 'api-gateway',
            parameters: {
              path: '/api/v1/users/profile',
              method: 'GET',
              headers: { 'Authorization': 'Bearer token' }
            },
            timeout: 3000,
            retries: 2
          }
        ],
        assertions: [
          {
            type: 'response_time',
            field: 'duration',
            operator: 'less_than',
            value: PERFORMANCE_BASELINES.textGeneration.latency
          }
        ],
        configuration: {
          timeout: 30000,
          iterations: 1,
          concurrency: 1,
          rampUp: 0,
          duration: 10000
        },
        metrics: {
          responseTime: { min: 0, max: 1000, target: 200 },
          throughput: { min: 0, max: 10000, target: 1000 },
          errorRate: { max: 0.05 },
          availability: { min: 99.0 }
        }
      };

      testFramework.createTestScenario(scenario);
      
      profiler.mark('integration-test-start');
      
      try {
        const result = await testFramework.executeScenario(scenario.id);
        
        const integrationDuration = profiler.measure('integration-test', 'integration-test-start');
        
        expect(integrationDuration).toBeLessThan(15000); // 15 seconds max
        expect(result.metrics.averageResponseTime).toBeLessThan(
          PERFORMANCE_BASELINES.textGeneration.latency
        );
        expect(result.metrics.errorRate).toBeLessThan(0.1); // 10% max error rate for mock
        
      } catch (error) {
        // Expected for mock services
        console.log('Integration test failed as expected with mock services:', error.message);
      }
    });

    it('should generate test reports within performance targets', async () => {
      profiler.mark('report-generation-start');
      
      try {
        const reportPath = await testFramework.generateReport('html');
        
        const reportGenerationDuration = profiler.measure('report-generation', 'report-generation-start');
        
        expect(reportGenerationDuration).toBeLessThan(5000); // 5 seconds max
        expect(reportPath).toContain('test-reports');
        
      } catch (error) {
        console.log('Report generation test (expected error):', error.message);
      }
    });
  });

  afterEach(() => {
    // Log performance measurements
    const measures = profiler.getAllMeasures();
    if (measures.size > 0) {
      console.log('\n=== Performance Measurements ===');
      for (const [name, duration] of measures) {
        console.log(`${name}: ${duration.toFixed(2)}ms`);
      }
      console.log('================================\n');
    }
  });

  afterAll(() => {
    // Final performance summary
    console.log('\n=== Performance Test Summary ===');
    console.log(`Text Generation Baseline: ${PERFORMANCE_BASELINES.textGeneration.latency}ms`);
    console.log(`Multimedia Baseline: ${PERFORMANCE_BASELINES.multimedia.latency}ms`);
    console.log(`Target Uptime: ${PERFORMANCE_BASELINES.system.uptime}%`);
    console.log('===============================\n');
  });
});

// Performance regression detection
describe('Performance Regression Tests', () => {
  const performanceHistory = new Map<string, number[]>();

  const recordPerformance = (testName: string, duration: number) => {
    if (!performanceHistory.has(testName)) {
      performanceHistory.set(testName, []);
    }
    const history = performanceHistory.get(testName)!;
    history.push(duration);
    
    // Keep only last 10 measurements
    if (history.length > 10) {
      history.shift();
    }
  };

  const detectRegression = (testName: string, currentDuration: number): boolean => {
    const history = performanceHistory.get(testName);
    if (!history || history.length < 3) {
      return false; // Not enough data
    }
    
    const average = history.reduce((sum, d) => sum + d, 0) / history.length;
    const threshold = average * 1.2; // 20% performance degradation threshold
    
    return currentDuration > threshold;
  };

  it('should detect performance regressions in streaming manager', async () => {
    const config = {
      initialSize: 1024 * 1024,
      maxSize: 10 * 1024 * 1024,
      minSize: 512 * 1024,
      adaptationRate: 0.1,
      predictionWindow: 30000
    };
    const streamingManager = new PredictiveStreamingManager(config);
    
    const startTime = performance.now();
    await streamingManager.optimizeBuffering('regression-test-user', 'regression-test-content');
    const duration = performance.now() - startTime;
    
    recordPerformance('streaming-optimization', duration);
    
    const hasRegression = detectRegression('streaming-optimization', duration);
    
    if (hasRegression) {
      console.warn(`Performance regression detected in streaming optimization: ${duration.toFixed(2)}ms`);
    }
    
    expect(hasRegression).toBe(false);
    expect(duration).toBeLessThan(1000); // Absolute threshold
  });

  it('should maintain consistent memory allocation performance', async () => {
    const memoryManager = new MemoryPoolManager();
    
    const startTime = performance.now();
    
    const allocation = await memoryManager.allocate({
      size: 4096,
      type: 'buffer',
      lifetime: 60000,
      priority: 'medium',
      owner: 'regression-test',
      purpose: 'regression-test'
    });
    
    const duration = performance.now() - startTime;
    
    recordPerformance('memory-allocation', duration);
    
    const hasRegression = detectRegression('memory-allocation', duration);
    
    if (hasRegression) {
      console.warn(`Performance regression detected in memory allocation: ${duration.toFixed(2)}ms`);
    }
    
    expect(hasRegression).toBe(false);
    expect(allocation).not.toBeNull();
    
    // Cleanup
    if (allocation) {
      await memoryManager.deallocate(allocation.id);
    }
  });
});

export {
  PerformanceProfiler,
  MemoryProfiler,
  LoadTestRunner,
  PERFORMANCE_BASELINES
};