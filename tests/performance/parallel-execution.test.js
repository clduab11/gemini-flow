/**
 * Parallel Execution Performance Tests  
 * Target: >75% parallel efficiency, 2.8-4.4x performance improvement
 */

const { performance } = require('perf_hooks');
const { initializeSwarm, executeTasksInParallel, executeTasksSequentially } = require('../../src/core/swarm');
const { generateTestTasks, measureExecutionTime } = require('../utils/test-helpers');

describe('Parallel Execution Performance', () => {
  let swarm;

  beforeEach(async () => {
    swarm = await initializeSwarm({ 
      topology: 'hierarchical', 
      maxAgents: 8,
      strategy: 'parallel'
    });
  });

  afterEach(async () => {
    if (swarm) {
      await swarm.destroy();
    }
  });

  describe('Performance Improvement Validation', () => {
    it('should achieve 2.8x improvement over sequential execution', async () => {
      const testTasks = generateTestTasks(8, 'medium'); // 8 medium complexity tasks
      
      // Baseline: sequential execution
      const sequentialTime = await measureExecutionTime(async () => {
        await executeTasksSequentially(testTasks);
      });

      // Test: parallel execution  
      const parallelTime = await measureExecutionTime(async () => {
        await executeTasksInParallel(testTasks, swarm);
      });

      const improvement = sequentialTime / parallelTime;
      
      expect(improvement).toBeGreaterThan(2.8);
      expect(parallelTime).toBeLessThan(sequentialTime);
      
      console.log(`Performance improvement: ${improvement.toFixed(2)}x`);
      console.log(`Sequential: ${sequentialTime}ms, Parallel: ${parallelTime}ms`);
    });

    it('should achieve 4.0x improvement with optimal conditions', async () => {
      const testTasks = generateTestTasks(8, 'cpu_bound'); // CPU-intensive tasks
      
      const sequentialTime = await measureExecutionTime(async () => {
        await executeTasksSequentially(testTasks);
      });

      const parallelTime = await measureExecutionTime(async () => {
        await executeTasksInParallel(testTasks, swarm);
      });

      const improvement = sequentialTime / parallelTime;
      
      expect(improvement).toBeGreaterThan(4.0);
      
      console.log(`Optimal performance improvement: ${improvement.toFixed(2)}x`);
    });

    it('should maintain performance with mixed task types', async () => {
      const mixedTasks = [
        ...generateTestTasks(3, 'io_bound'),
        ...generateTestTasks(3, 'cpu_bound'), 
        ...generateTestTasks(2, 'memory_bound')
      ];
      
      const sequentialTime = await measureExecutionTime(async () => {
        await executeTasksSequentially(mixedTasks);
      });

      const parallelTime = await measureExecutionTime(async () => {
        await executeTasksInParallel(mixedTasks, swarm);
      });

      const improvement = sequentialTime / parallelTime;
      
      expect(improvement).toBeGreaterThan(2.5); // Slightly lower for mixed workloads
    });
  });

  describe('Parallel Efficiency Testing', () => {
    it('should achieve >75% parallel efficiency', async () => {
      const tasks = generateTestTasks(8, 'uniform'); // Uniform CPU-bound tasks
      
      const startTime = performance.now();
      const results = await executeTasksInParallel(tasks, swarm);
      const totalTime = performance.now() - startTime;
      
      // Calculate theoretical minimum time (longest single task)
      const theoreticalMin = Math.max(...tasks.map(t => t.estimatedDuration));
      const efficiency = theoreticalMin / totalTime;
      
      expect(efficiency).toBeGreaterThan(0.75);
      expect(results.every(r => r.success)).toBe(true);
      
      console.log(`Parallel efficiency: ${(efficiency * 100).toFixed(1)}%`);
    });

    it('should scale linearly with agent count', async () => {
      const baselineTasks = generateTestTasks(4, 'scalable');
      const scaledTasks = generateTestTasks(8, 'scalable');
      
      // Test with 4 agents
      const smallSwarm = await initializeSwarm({ maxAgents: 4 });
      const baseline = await measureExecutionTime(async () => {
        await executeTasksInParallel(baselineTasks, smallSwarm);
      });
      await smallSwarm.destroy();
      
      // Test with 8 agents  
      const scaled = await measureExecutionTime(async () => {
        await executeTasksInParallel(scaledTasks, swarm);
      });
      
      // Should be roughly 2x tasks in similar time (within 30% margin)
      const scalingRatio = scaled / baseline;
      expect(scalingRatio).toBeLessThan(1.3);
      
      console.log(`Scaling ratio: ${scalingRatio.toFixed(2)} (lower is better)`);
    });

    it('should handle workload imbalance gracefully', async () => {
      const imbalancedTasks = [
        ...generateTestTasks(1, 'very_heavy'), // 1 long task
        ...generateTestTasks(7, 'light')       // 7 short tasks  
      ];
      
      const start = performance.now();
      const results = await executeTasksInParallel(imbalancedTasks, swarm);
      const totalTime = performance.now() - start;
      
      // Should complete close to the time of the longest task
      const longestTask = Math.max(...imbalancedTasks.map(t => t.estimatedDuration));
      const overhead = (totalTime - longestTask) / longestTask;
      
      expect(overhead).toBeLessThan(0.2); // Less than 20% overhead
      expect(results.every(r => r.success)).toBe(true);
    });
  });

  describe('Load Testing', () => {
    it('should maintain performance under high load', async () => {
      const highLoadTasks = generateTestTasks(50, 'medium'); // 50 concurrent tasks
      
      const results = await executeTasksInParallel(highLoadTasks, swarm, {
        maxConcurrency: 8,
        timeoutMs: 30000
      });
      
      const successRate = results.filter(r => r.success).length / results.length;
      const averageTime = results
        .filter(r => r.success)
        .reduce((sum, r) => sum + r.duration, 0) / results.filter(r => r.success).length;
      
      expect(successRate).toBeGreaterThan(0.9); // 90% success rate
      expect(averageTime).toBeLessThan(5000);   // Average under 5 seconds
    });

    it('should handle memory pressure during parallel execution', async () => {
      // Create memory pressure
      const memoryHogs = Array(10).fill(null).map(() => 
        new Array(500000).fill('memory_pressure_test')
      );

      const tasks = generateTestTasks(8, 'memory_aware');
      
      const start = performance.now();
      const results = await executeTasksInParallel(tasks, swarm);
      const duration = performance.now() - start;
      
      // Cleanup memory
      memoryHogs.length = 0;
      
      expect(results.every(r => r.success)).toBe(true);
      expect(duration).toBeLessThan(15000); // Should complete within 15s
    });

    it('should recover from agent failures during execution', async () => {
      const tasks = generateTestTasks(10, 'fault_tolerant');
      
      // Simulate agent failure after 2 seconds
      setTimeout(async () => {
        const agents = swarm.getActiveAgents();
        if (agents.length > 0) {
          await agents[0].simulateFailure();
        }
      }, 2000);
      
      const results = await executeTasksInParallel(tasks, swarm, {
        faultTolerance: true,
        retryAttempts: 2
      });
      
      const successRate = results.filter(r => r.success).length / results.length;
      expect(successRate).toBeGreaterThan(0.8); // Should recover and complete 80%+
    });
  });

  describe('Performance Consistency', () => {
    it('should maintain consistent performance across multiple runs', async () => {
      const tasks = generateTestTasks(6, 'consistent');
      const runTimes = [];
      
      // Run the same workload 5 times
      for (let i = 0; i < 5; i++) {
        const runTime = await measureExecutionTime(async () => {
          await executeTasksInParallel(tasks, swarm);
        });
        runTimes.push(runTime);
      }
      
      const average = runTimes.reduce((sum, time) => sum + time, 0) / runTimes.length;
      const variance = runTimes.reduce((sum, time) => sum + Math.pow(time - average, 2), 0) / runTimes.length;
      const standardDeviation = Math.sqrt(variance);
      const coefficientOfVariation = standardDeviation / average;
      
      // Performance should be consistent (CV < 0.15)
      expect(coefficientOfVariation).toBeLessThan(0.15);
      
      console.log(`Performance consistency: CV = ${(coefficientOfVariation * 100).toFixed(1)}%`);
    });

    it('should show predictable scaling patterns', async () => {
      const scalingData = [];
      
      for (let agentCount = 2; agentCount <= 8; agentCount += 2) {
        const testSwarm = await initializeSwarm({ maxAgents: agentCount });
        const tasks = generateTestTasks(agentCount, 'scaling');
        
        const executionTime = await measureExecutionTime(async () => {
          await executeTasksInParallel(tasks, testSwarm);
        });
        
        scalingData.push({ agentCount, executionTime });
        await testSwarm.destroy();
      }
      
      // Should show decreasing execution time with more agents
      for (let i = 1; i < scalingData.length; i++) {
        const improvement = scalingData[i-1].executionTime / scalingData[i].executionTime;
        expect(improvement).toBeGreaterThan(1.2); // At least 20% improvement each step
      }
      
      console.log('Scaling data:', scalingData);
    });
  });
});