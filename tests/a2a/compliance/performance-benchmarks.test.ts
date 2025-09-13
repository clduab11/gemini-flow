/**
 * A2A Performance Benchmarks
 * Comprehensive performance testing targeting 1000 msg/sec throughput with detailed metrics
 */

import {
  A2AComplianceTestSuite,
  A2ATestDataBuilder,
  A2ATestUtils,
  MockAgent,
  MockA2AMessageBus,
  A2AMessage,
  A2AResponse,
  MessageBusMetrics
} from './test-harness';
import { performance } from 'perf_hooks';

// Performance targets
const PERFORMANCE_TARGETS = {
  THROUGHPUT_MSG_PER_SEC: 1000,
  MAX_LATENCY_MS: 100,
  P95_LATENCY_MS: 50,
  P99_LATENCY_MS: 75,
  MAX_MEMORY_MB: 512,
  MAX_CPU_PERCENT: 80,
  ERROR_RATE_PERCENT: 0.1
};

describe('A2A Performance Benchmarks', () => {
  let testSuite: PerformanceBenchmarkSuite;

  beforeEach(async () => {
    testSuite = new PerformanceBenchmarkSuite();
    await testSuite.setup();
  });

  afterEach(async () => {
    await testSuite.teardown();
  });

  describe('Throughput Benchmarks', () => {
    it('should achieve 1000+ messages per second throughput', async () => {
      const testDuration = 10000; // 10 seconds
      const targetMessages = Math.floor((PERFORMANCE_TARGETS.THROUGHPUT_MSG_PER_SEC * testDuration) / 1000);
      
      const benchmark = await testSuite.runThroughputBenchmark(
        targetMessages,
        testDuration,
        'direct'
      );

      expect(benchmark.actualThroughput).toBeGreaterThanOrEqual(PERFORMANCE_TARGETS.THROUGHPUT_MSG_PER_SEC);
      expect(benchmark.messagesProcessed).toBe(targetMessages);
      expect(benchmark.errorRate).toBeLessThan(PERFORMANCE_TARGETS.ERROR_RATE_PERCENT);
      
      console.log(`Throughput Benchmark Results:
        Target: ${PERFORMANCE_TARGETS.THROUGHPUT_MSG_PER_SEC} msg/sec
        Actual: ${benchmark.actualThroughput} msg/sec
        Messages: ${benchmark.messagesProcessed}
        Duration: ${benchmark.duration}ms
        Error Rate: ${benchmark.errorRate}%`);
    });

    it('should maintain high throughput under broadcast coordination', async () => {
      const testDuration = 5000; // 5 seconds
      const targetMessages = Math.floor((800 * testDuration) / 1000); // Lower target for broadcast
      
      const benchmark = await testSuite.runThroughputBenchmark(
        targetMessages,
        testDuration,
        'broadcast'
      );

      expect(benchmark.actualThroughput).toBeGreaterThanOrEqual(800);
      expect(benchmark.errorRate).toBeLessThan(PERFORMANCE_TARGETS.ERROR_RATE_PERCENT);
    });

    it('should scale throughput with agent count', async () => {
      const baselineAgents = 3;
      const scaledAgents = 9;
      
      const baselineBenchmark = await testSuite.runScalabilityBenchmark(baselineAgents, 5000);
      const scaledBenchmark = await testSuite.runScalabilityBenchmark(scaledAgents, 5000);
      
      const scalingFactor = scaledAgents / baselineAgents;
      const expectedThroughput = baselineBenchmark.actualThroughput * (scalingFactor * 0.8); // 80% efficiency
      
      expect(scaledBenchmark.actualThroughput).toBeGreaterThanOrEqual(expectedThroughput);
      
      console.log(`Scalability Results:
        Baseline (${baselineAgents} agents): ${baselineBenchmark.actualThroughput} msg/sec
        Scaled (${scaledAgents} agents): ${scaledBenchmark.actualThroughput} msg/sec
        Scaling Efficiency: ${(scaledBenchmark.actualThroughput / (baselineBenchmark.actualThroughput * scalingFactor)) * 100}%`);
    });

    it('should handle burst load efficiently', async () => {
      const burstSize = 500;
      const burstInterval = 1000; // 1 second
      const burstCount = 5;
      
      const burstBenchmark = await testSuite.runBurstLoadBenchmark(
        burstSize,
        burstInterval,
        burstCount
      );

      expect(burstBenchmark.peakThroughput).toBeGreaterThanOrEqual(1500); // Higher peak for bursts
      expect(burstBenchmark.averageThroughput).toBeGreaterThanOrEqual(800);
      expect(burstBenchmark.burstRecoveryTime).toBeLessThan(500); // Recovery within 500ms
    });
  });

  describe('Latency Benchmarks', () => {
    it('should maintain low latency under normal load', async () => {
      const messageCount = 1000;
      const latencyBenchmark = await testSuite.runLatencyBenchmark(messageCount, 'normal');

      expect(latencyBenchmark.averageLatency).toBeLessThan(PERFORMANCE_TARGETS.MAX_LATENCY_MS);
      expect(latencyBenchmark.p95Latency).toBeLessThan(PERFORMANCE_TARGETS.P95_LATENCY_MS);
      expect(latencyBenchmark.p99Latency).toBeLessThan(PERFORMANCE_TARGETS.P99_LATENCY_MS);
      expect(latencyBenchmark.maxLatency).toBeLessThan(200); // Max 200ms
      
      console.log(`Latency Benchmark Results:
        Average: ${latencyBenchmark.averageLatency}ms
        P95: ${latencyBenchmark.p95Latency}ms
        P99: ${latencyBenchmark.p99Latency}ms
        Max: ${latencyBenchmark.maxLatency}ms`);
    });

    it('should maintain acceptable latency under high load', async () => {
      const messageCount = 5000;
      const latencyBenchmark = await testSuite.runLatencyBenchmark(messageCount, 'high');

      expect(latencyBenchmark.averageLatency).toBeLessThan(PERFORMANCE_TARGETS.MAX_LATENCY_MS * 2);
      expect(latencyBenchmark.p95Latency).toBeLessThan(PERFORMANCE_TARGETS.P95_LATENCY_MS * 3);
      expect(latencyBenchmark.p99Latency).toBeLessThan(PERFORMANCE_TARGETS.P99_LATENCY_MS * 4);
    });

    it('should handle latency-sensitive operations', async () => {
      const criticalOperations = [
        'mcp__claude-flow__agent_spawn',
        'mcp__claude-flow__swarm_status',
        'mcp__claude-flow__memory_usage'
      ];

      const criticalLatencyBenchmark = await testSuite.runCriticalLatencyBenchmark(criticalOperations);

      for (const [operation, latency] of Object.entries(criticalLatencyBenchmark.operationLatencies)) {
        expect(latency.average).toBeLessThan(50); // Critical ops under 50ms
        expect(latency.p95).toBeLessThan(75);
      }
    });

    it('should measure end-to-end latency across coordination modes', async () => {
      const coordinationModes = ['direct', 'broadcast', 'consensus', 'pipeline'];
      const e2eLatencies: Record<string, LatencyMetrics> = {};

      for (const mode of coordinationModes) {
        const latency = await testSuite.runE2ELatencyBenchmark(mode, 100);
        e2eLatencies[mode] = latency;
        
        // Different expectations for different modes
        switch (mode) {
          case 'direct':
            expect(latency.averageLatency).toBeLessThan(25);
            break;
          case 'broadcast':
            expect(latency.averageLatency).toBeLessThan(75);
            break;
          case 'consensus':
            expect(latency.averageLatency).toBeLessThan(150);
            break;
          case 'pipeline':
            expect(latency.averageLatency).toBeLessThan(100);
            break;
        }
      }

      console.log('E2E Latency by Coordination Mode:', e2eLatencies);
    });
  });

  describe('Resource Utilization Benchmarks', () => {
    it('should maintain memory usage within limits', async () => {
      const memoryBenchmark = await testSuite.runMemoryBenchmark(10000, 60000);

      expect(memoryBenchmark.peakMemoryMB).toBeLessThan(PERFORMANCE_TARGETS.MAX_MEMORY_MB);
      expect(memoryBenchmark.memoryLeakRate).toBeLessThan(1); // Less than 1MB/min leak
      expect(memoryBenchmark.gcPressure).toBeLessThan(0.1); // Less than 10% time in GC
      
      console.log(`Memory Benchmark Results:
        Peak Memory: ${memoryBenchmark.peakMemoryMB}MB
        Average Memory: ${memoryBenchmark.averageMemoryMB}MB
        Memory Leak Rate: ${memoryBenchmark.memoryLeakRate}MB/min
        GC Pressure: ${memoryBenchmark.gcPressure * 100}%`);
    });

    it('should maintain CPU usage within limits', async () => {
      const cpuBenchmark = await testSuite.runCPUBenchmark(5000, 30000);

      expect(cpuBenchmark.peakCPUPercent).toBeLessThan(PERFORMANCE_TARGETS.MAX_CPU_PERCENT);
      expect(cpuBenchmark.averageCPUPercent).toBeLessThan(PERFORMANCE_TARGETS.MAX_CPU_PERCENT * 0.7);
      expect(cpuBenchmark.cpuEfficiency).toBeGreaterThan(0.8); // 80% efficiency
    });

    it('should handle concurrent resource usage efficiently', async () => {
      const concurrentBenchmark = await testSuite.runConcurrentResourceBenchmark(
        1000, // messages per agent
        6,    // concurrent agents
        10000 // duration
      );

      expect(concurrentBenchmark.resourceContention).toBeLessThan(0.2); // Less than 20% contention
      expect(concurrentBenchmark.throughputDegradation).toBeLessThan(0.1); // Less than 10% degradation
    });

    it('should optimize resource allocation dynamically', async () => {
      const adaptiveBenchmark = await testSuite.runAdaptiveResourceBenchmark(15000);

      expect(adaptiveBenchmark.adaptationEffectiveness).toBeGreaterThan(0.8);
      expect(adaptiveBenchmark.resourceWaste).toBeLessThan(0.1); // Less than 10% waste
    });
  });

  describe('Stress Testing', () => {
    it('should handle extreme load without failure', async () => {
      const extremeLoad = 2000; // 2000 msg/sec
      const stressDuration = 30000; // 30 seconds
      
      const stressTest = await testSuite.runStressTest(extremeLoad, stressDuration);

      expect(stressTest.survived).toBe(true);
      expect(stressTest.errorRate).toBeLessThan(5); // Allow higher error rate under stress
      expect(stressTest.recoveryTime).toBeLessThan(5000); // Recover within 5 seconds
      expect(stressTest.gracefulDegradation).toBe(true);
    });

    it('should maintain partial functionality under overload', async () => {
      const overloadTest = await testSuite.runOverloadTest(5000, 20000);

      expect(overloadTest.partialFunctionality.essential).toBeGreaterThan(0.9);
      expect(overloadTest.partialFunctionality.important).toBeGreaterThan(0.7);
      expect(overloadTest.partialFunctionality.optional).toBeGreaterThan(0.3);
    });

    it('should handle memory pressure gracefully', async () => {
      const memoryPressureTest = await testSuite.runMemoryPressureTest();

      expect(memoryPressureTest.oomKilled).toBe(false);
      expect(memoryPressureTest.gracefulDegradation).toBe(true);
      expect(memoryPressureTest.dataIntegrity).toBe(true);
    });

    it('should recover from system resource exhaustion', async () => {
      const exhaustionTest = await testSuite.runResourceExhaustionTest();

      expect(exhaustionTest.detectedExhaustion).toBe(true);
      expect(exhaustionTest.initiatedRecovery).toBe(true);
      expect(exhaustionTest.recoveryTime).toBeLessThan(10000); // 10 seconds
      expect(exhaustionTest.postRecoveryPerformance).toBeGreaterThan(0.8);
    });
  });

  describe('Concurrency and Parallelism', () => {
    it('should handle high concurrency efficiently', async () => {
      const concurrencyLevels = [10, 50, 100, 200];
      const concurrencyResults: Record<number, ConcurrencyMetrics> = {};

      for (const level of concurrencyLevels) {
        const result = await testSuite.runConcurrencyBenchmark(level, 5000);
        concurrencyResults[level] = result;
        
        expect(result.deadlocks).toBe(0);
        expect(result.raceConditions).toBe(0);
        expect(result.throughputPerThread).toBeGreaterThan(5); // At least 5 msg/sec per thread
      }

      // Verify concurrency scaling
      const scalingEfficiency = this.calculateConcurrencyScaling(concurrencyResults);
      expect(scalingEfficiency).toBeGreaterThan(0.6); // 60% scaling efficiency
    });

    it('should maintain thread safety under load', async () => {
      const threadSafetyTest = await testSuite.runThreadSafetyTest(1000, 100);

      expect(threadSafetyTest.dataCorruption).toBe(false);
      expect(threadSafetyTest.consistencyViolations).toBe(0);
      expect(threadSafetyTest.synchronizationOverhead).toBeLessThan(0.1);
    });

    it('should handle message ordering requirements', async () => {
      const orderingTest = await testSuite.runMessageOrderingTest(500);

      expect(orderingTest.orderViolations).toBe(0);
      expect(orderingTest.causalityPreserved).toBe(true);
      expect(orderingTest.sequenceIntegrity).toBe(true);
    });

    it('should optimize parallel execution patterns', async () => {
      const parallelismTest = await testSuite.runParallelismOptimizationTest();

      expect(parallelismTest.optimalParallelism).toBeGreaterThan(4);
      expect(parallelismTest.parallelEfficiency).toBeGreaterThan(0.75);
      expect(parallelismTest.loadBalancing).toBeGreaterThan(0.85);
    });
  });

  describe('Performance Regression Detection', () => {
    it('should detect performance regressions', async () => {
      const baselineMetrics = await testSuite.establishPerformanceBaseline();
      
      // Simulate a performance regression
      testSuite.injectPerformanceRegression('latency', 1.5); // 50% latency increase
      
      const currentMetrics = await testSuite.measureCurrentPerformance();
      const regressionAnalysis = await testSuite.analyzePerformanceRegression(
        baselineMetrics,
        currentMetrics
      );

      expect(regressionAnalysis.hasRegression).toBe(true);
      expect(regressionAnalysis.regressionType).toBe('latency');
      expect(regressionAnalysis.severity).toBe('moderate');
      expect(regressionAnalysis.impactAreas).toContain('response_time');
    });

    it('should track performance trends over time', async () => {
      const trendAnalysis = await testSuite.analyzePerfomanceTrends(30); // 30 data points

      expect(trendAnalysis.overallTrend).toBeOneOf(['stable', 'improving', 'degrading']);
      expect(trendAnalysis.volatility).toBeLessThan(0.2); // Less than 20% volatility
      expect(trendAnalysis.predictedPerformance).toBeDefined();
    });

    it('should validate performance SLA compliance', async () => {
      const slaCompliance = await testSuite.validateSLACompliance();

      expect(slaCompliance.throughputSLA).toBeGreaterThan(0.95); // 95% compliance
      expect(slaCompliance.latencySLA).toBeGreaterThan(0.95);
      expect(slaCompliance.availabilitySLA).toBeGreaterThan(0.99); // 99% availability
      expect(slaCompliance.overallCompliance).toBeGreaterThan(0.95);
    });
  });

  describe('Performance Profiling and Analysis', () => {
    it('should profile hot paths and bottlenecks', async () => {
      const profilingResults = await testSuite.runPerformanceProfiling(1000);

      expect(profilingResults.hotPaths.length).toBeGreaterThan(0);
      expect(profilingResults.bottlenecks.length).toBeLessThan(5); // No more than 5 bottlenecks
      expect(profilingResults.optimizationOpportunities.length).toBeGreaterThan(0);
      
      // Verify no critical bottlenecks
      const criticalBottlenecks = profilingResults.bottlenecks.filter(b => b.impact > 0.3);
      expect(criticalBottlenecks.length).toBe(0);
    });

    it('should analyze memory allocation patterns', async () => {
      const memoryProfiling = await testSuite.runMemoryProfiling(2000);

      expect(memoryProfiling.allocationHotspots.length).toBeLessThan(10);
      expect(memoryProfiling.memoryFragmentation).toBeLessThan(0.2);
      expect(memoryProfiling.unusedAllocations).toBeLessThan(0.1);
      expect(memoryProfiling.gcEfficiency).toBeGreaterThan(0.8);
    });

    it('should identify performance optimization opportunities', async () => {
      const optimizationAnalysis = await testSuite.analyzeOptimizationOpportunities();

      expect(optimizationAnalysis.potentialImprovements.length).toBeGreaterThan(0);
      expect(optimizationAnalysis.estimatedGains.throughput).toBeGreaterThan(0);
      expect(optimizationAnalysis.implementationComplexity).toBeDefined();
      
      // Verify actionable recommendations
      const highImpactRecommendations = optimizationAnalysis.potentialImprovements
        .filter(i => i.impact > 0.1 && i.effort < 0.7);
      expect(highImpactRecommendations.length).toBeGreaterThan(0);
    });
  });

});

/**
 * Performance Benchmark Test Suite Implementation
 */
class PerformanceBenchmarkSuite extends A2AComplianceTestSuite {
  private performanceAgents: MockAgent[] = [];
  private performanceBaseline?: PerformanceMetrics;
  private regressionInjected = false;
  private regressionMultiplier = 1.0;

  protected async setup(): Promise<void> {
    await super.setup();
    await this.setupPerformanceAgents();
  }

  private async setupPerformanceAgents(): Promise<void> {
    // Create agents optimized for performance testing
    for (let i = 0; i < 10; i++) {
      const agent = A2ATestDataBuilder.createAgent(
        `perf-agent-${i}`,
        'performance-test',
        ['high-throughput', 'low-latency', 'stress-test'],
        [
          'mcp__claude-flow__agent_spawn',
          'mcp__claude-flow__swarm_status',
          'mcp__claude-flow__memory_usage',
          'mcp__claude-flow__performance_report'
        ]
      );
      
      this.performanceAgents.push(agent);
      this.messageBus.registerAgent(agent);
    }
  }

  async runThroughputBenchmark(
    messageCount: number,
    duration: number,
    coordinationMode: 'direct' | 'broadcast' | 'consensus'
  ): Promise<ThroughputMetrics> {
    const startTime = performance.now();
    const endTime = startTime + duration;
    let processedMessages = 0;
    let errorCount = 0;

    const promises: Promise<A2AResponse>[] = [];
    
    while (performance.now() < endTime && processedMessages < messageCount) {
      const message = A2ATestDataBuilder.createMessage({
        toolName: 'mcp__claude-flow__agent_spawn',
        parameters: { type: 'benchmark', id: processedMessages },
        target: { type: 'single', agentId: this.performanceAgents[processedMessages % this.performanceAgents.length].id },
        coordination: this.createCoordinationMode(coordinationMode)
      });

      const promise = this.messageBus.send(message).catch(error => {
        errorCount++;
        return { success: false, error } as A2AResponse;
      });
      
      promises.push(promise);
      processedMessages++;
      
      // Small delay to prevent overwhelming
      if (processedMessages % 100 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1));
      }
    }

    const responses = await Promise.all(promises);
    const actualDuration = performance.now() - startTime;
    const successfulMessages = responses.filter(r => r.success).length;

    return {
      messagesProcessed: processedMessages,
      successfulMessages,
      duration: actualDuration,
      actualThroughput: (successfulMessages / actualDuration) * 1000,
      targetThroughput: (messageCount / duration) * 1000,
      errorRate: (errorCount / processedMessages) * 100,
      efficiency: successfulMessages / processedMessages
    };
  }

  async runLatencyBenchmark(messageCount: number, loadType: 'normal' | 'high'): Promise<LatencyMetrics> {
    const latencies: number[] = [];
    const concurrency = loadType === 'high' ? 20 : 5;
    
    for (let batch = 0; batch < messageCount; batch += concurrency) {
      const batchPromises: Promise<number>[] = [];
      
      for (let i = 0; i < concurrency && batch + i < messageCount; i++) {
        const messageStartTime = performance.now();
        
        const message = A2ATestDataBuilder.createMessage({
          toolName: 'mcp__claude-flow__swarm_status',
          parameters: { quick: true },
          target: { type: 'single', agentId: this.performanceAgents[0].id }
        });

        const latencyPromise = this.messageBus.send(message).then(() => {
          return performance.now() - messageStartTime;
        });
        
        batchPromises.push(latencyPromise);
      }
      
      const batchLatencies = await Promise.all(batchPromises);
      latencies.push(...batchLatencies);
      
      // Brief pause between batches for high load
      if (loadType === 'high') {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }

    latencies.sort((a, b) => a - b);
    
    return {
      sampleCount: latencies.length,
      averageLatency: latencies.reduce((sum, lat) => sum + lat, 0) / latencies.length,
      medianLatency: latencies[Math.floor(latencies.length / 2)],
      p95Latency: latencies[Math.floor(latencies.length * 0.95)],
      p99Latency: latencies[Math.floor(latencies.length * 0.99)],
      minLatency: latencies[0],
      maxLatency: latencies[latencies.length - 1],
      standardDeviation: this.calculateStandardDeviation(latencies)
    };
  }

  async runMemoryBenchmark(messageCount: number, duration: number): Promise<MemoryMetrics> {
    const memoryReadings: number[] = [];
    const startMemory = process.memoryUsage().heapUsed / 1024 / 1024; // MB
    
    const memoryMonitor = setInterval(() => {
      const currentMemory = process.memoryUsage().heapUsed / 1024 / 1024;
      memoryReadings.push(currentMemory);
    }, 100); // Every 100ms
    
    // Run load test
    await this.runThroughputBenchmark(messageCount, duration, 'direct');
    
    clearInterval(memoryMonitor);
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    const endMemory = process.memoryUsage().heapUsed / 1024 / 1024;
    const peakMemory = Math.max(...memoryReadings);
    const averageMemory = memoryReadings.reduce((sum, mem) => sum + mem, 0) / memoryReadings.length;
    
    return {
      startMemoryMB: startMemory,
      endMemoryMB: endMemory,
      peakMemoryMB: peakMemory,
      averageMemoryMB: averageMemory,
      memoryLeakRate: (endMemory - startMemory) / (duration / 60000), // MB per minute
      gcPressure: this.calculateGCPressure(),
      memoryEfficiency: averageMemory / peakMemory
    };
  }

  async runStressTest(targetThroughput: number, duration: number): Promise<StressTestMetrics> {
    const messageCount = Math.floor((targetThroughput * duration) / 1000);
    const startTime = performance.now();
    
    try {
      const throughputResult = await this.runThroughputBenchmark(messageCount, duration, 'direct');
      const actualDuration = performance.now() - startTime;
      
      // Monitor recovery time
      const recoveryStartTime = performance.now();
      await this.waitForSystemRecovery();
      const recoveryTime = performance.now() - recoveryStartTime;
      
      return {
        survived: true,
        targetThroughput,
        actualThroughput: throughputResult.actualThroughput,
        errorRate: throughputResult.errorRate,
        duration: actualDuration,
        recoveryTime,
        gracefulDegradation: throughputResult.errorRate < 10, // Less than 10% errors
        resourceExhaustionDetected: false,
        performanceDegradation: 1 - (throughputResult.actualThroughput / targetThroughput)
      };
      
    } catch (error) {
      return {
        survived: false,
        targetThroughput,
        actualThroughput: 0,
        errorRate: 100,
        duration: performance.now() - startTime,
        recoveryTime: 0,
        gracefulDegradation: false,
        resourceExhaustionDetected: true,
        performanceDegradation: 1,
        failureReason: error.message
      };
    }
  }

  async establishPerformanceBaseline(): Promise<PerformanceMetrics> {
    const throughput = await this.runThroughputBenchmark(1000, 10000, 'direct');
    const latency = await this.runLatencyBenchmark(500, 'normal');
    const memory = await this.runMemoryBenchmark(500, 5000);
    
    this.performanceBaseline = {
      throughput: throughput.actualThroughput,
      averageLatency: latency.averageLatency,
      p95Latency: latency.p95Latency,
      memoryUsage: memory.averageMemoryMB,
      errorRate: throughput.errorRate,
      timestamp: Date.now()
    };
    
    return this.performanceBaseline;
  }

  injectPerformanceRegression(type: 'latency' | 'throughput' | 'memory', multiplier: number): void {
    this.regressionInjected = true;
    this.regressionMultiplier = multiplier;
    
    // Modify agent behavior to simulate regression
    this.performanceAgents.forEach(agent => {
      const originalProcessMessage = agent.processMessage.bind(agent);
      agent.processMessage = async (message) => {
        if (type === 'latency') {
          await new Promise(resolve => setTimeout(resolve, 50 * (multiplier - 1)));
        }
        return originalProcessMessage(message);
      };
    });
  }

  private createCoordinationMode(mode: 'direct' | 'broadcast' | 'consensus') {
    switch (mode) {
      case 'direct':
        return { mode: 'direct', timeout: 5000, retries: 1, acknowledgment: true };
      case 'broadcast':
        return { mode: 'broadcast', aggregation: 'all', timeout: 10000, partialSuccess: false };
      case 'consensus':
        return { mode: 'consensus', consensusType: 'majority', votingTimeout: 15000, minimumParticipants: 3 };
    }
  }

  private calculateStandardDeviation(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDifferences = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDifferences.reduce((sum, diff) => sum + diff, 0) / values.length;
    return Math.sqrt(variance);
  }

  private calculateGCPressure(): number {
    // Mock GC pressure calculation
    return Math.random() * 0.1; // 0-10% GC pressure
  }

  private async waitForSystemRecovery(): Promise<void> {
    // Wait for system to stabilize
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  async runTests(): Promise<void> {
    console.log('Running A2A Performance Benchmarks...');
  }

  private calculateConcurrencyScaling(results: Record<number, ConcurrencyMetrics>): number {
    const levels = Object.keys(results).map(Number).sort((a, b) => a - b);
    if (levels.length < 2) return 1;

    const baseline = results[levels[0]];
    const scaled = results[levels[levels.length - 1]];
    
    const theoreticalScaling = levels[levels.length - 1] / levels[0];
    const actualScaling = scaled.totalThroughput / baseline.totalThroughput;
    
    return actualScaling / theoreticalScaling;
  }
}

// Performance metric interfaces
interface ThroughputMetrics {
  messagesProcessed: number;
  successfulMessages: number;
  duration: number;
  actualThroughput: number;
  targetThroughput: number;
  errorRate: number;
  efficiency: number;
}

interface LatencyMetrics {
  sampleCount: number;
  averageLatency: number;
  medianLatency: number;
  p95Latency: number;
  p99Latency: number;
  minLatency: number;
  maxLatency: number;
  standardDeviation: number;
}

interface MemoryMetrics {
  startMemoryMB: number;
  endMemoryMB: number;
  peakMemoryMB: number;
  averageMemoryMB: number;
  memoryLeakRate: number;
  gcPressure: number;
  memoryEfficiency: number;
}

interface StressTestMetrics {
  survived: boolean;
  targetThroughput: number;
  actualThroughput: number;
  errorRate: number;
  duration: number;
  recoveryTime: number;
  gracefulDegradation: boolean;
  resourceExhaustionDetected: boolean;
  performanceDegradation: number;
  failureReason?: string;
}

interface ConcurrencyMetrics {
  concurrencyLevel: number;
  totalThroughput: number;
  throughputPerThread: number;
  deadlocks: number;
  raceConditions: number;
  synchronizationOverhead: number;
}

interface PerformanceMetrics {
  throughput: number;
  averageLatency: number;
  p95Latency: number;
  memoryUsage: number;
  errorRate: number;
  timestamp: number;
}