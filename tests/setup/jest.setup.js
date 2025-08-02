/**
 * Jest Setup Configuration for Gemini-Flow Tests
 */

const { PerformanceMonitor } = require('../utils/test-helpers');

// Global test configuration
global.TEST_CONFIG = {
  PERFORMANCE_TARGETS: {
    AGENT_SPAWN_TIME: 100,        // ms
    TASK_COMPLETION_RATE: 0.8,    // 80%
    PERFORMANCE_IMPROVEMENT: 2.8,  // 2.8x minimum
    PARALLEL_EFFICIENCY: 0.75,    // 75%
    MEMORY_ACCURACY: 0.95,        // 95%
    COST_REDUCTION: 0.3           // 30%
  },
  
  TEST_THRESHOLDS: {
    UNIT_TEST_TIMEOUT: 5000,      // 5 seconds
    INTEGRATION_TEST_TIMEOUT: 20000, // 20 seconds
    PERFORMANCE_TEST_TIMEOUT: 60000, // 60 seconds
    E2E_TEST_TIMEOUT: 120000      // 2 minutes
  },
  
  MOCK_DATA: {
    DEFAULT_AGENT_COUNT: 5,
    MAX_TEST_AGENTS: 10,
    TEST_DATA_SIZE: 1000
  }
};

// Global performance monitor
global.perfMonitor = new PerformanceMonitor();

// Setup before each test
beforeEach(() => {
  // Reset performance monitor
  global.perfMonitor = new PerformanceMonitor();
  global.perfMonitor.start();
  
  // Set test start time
  global.testStartTime = Date.now();
  
  // Enable garbage collection if available (for memory tests)
  if (global.gc) {
    global.gc();
  }
});

// Cleanup after each test
afterEach(async () => {
  // Record final memory usage
  global.perfMonitor.recordMemoryUsage();
  
  // Generate performance report for this test
  const report = global.perfMonitor.getReport();
  
  // Store performance data for aggregation
  if (global.PERFORMANCE_MODE) {
    const testName = expect.getState().currentTestName;
    global.performanceReports = global.performanceReports || [];
    global.performanceReports.push({
      testName,
      report,
      timestamp: Date.now()
    });
  }
  
  // Cleanup any test resources
  await cleanupTestResources();
});

// Global cleanup function
async function cleanupTestResources() {
  // Cleanup any swarms or agents created during tests
  if (global.testSwarms) {
    for (const swarm of global.testSwarms) {
      try {
        await swarm.destroy();
      } catch (error) {
        console.warn('Error cleaning up test swarm:', error.message);
      }
    }
    global.testSwarms = [];
  }
  
  if (global.testAgents) {
    for (const agent of global.testAgents) {
      try {
        await agent.destroy();
      } catch (error) {
        console.warn('Error cleaning up test agent:', error.message);
      }
    }
    global.testAgents = [];
  }
  
  // Clear test memory
  if (global.testMemoryKeys) {
    // Note: In real implementation, would clear memory store
    global.testMemoryKeys = [];
  }
}

// Custom matchers for performance testing
expect.extend({
  toBeWithinPerformanceTarget(received, targetMs) {
    const pass = received <= targetMs;
    return {
      pass,
      message: () => 
        pass 
          ? `Expected ${received}ms to exceed ${targetMs}ms`
          : `Expected ${received}ms to be within target of ${targetMs}ms`
    };
  },
  
  toHaveHighSuccessRate(received, minimumRate = 0.9) {
    const pass = received >= minimumRate;
    return {
      pass,
      message: () =>
        pass
          ? `Expected success rate ${received} to be below ${minimumRate}`
          : `Expected success rate ${received} to be at least ${minimumRate}`
    };
  },
  
  toShowPerformanceImprovement(sequentialTime, parallelTime, minimumImprovement = 2.0) {
    const improvement = sequentialTime / parallelTime;
    const pass = improvement >= minimumImprovement;
    return {
      pass,
      message: () =>
        pass
          ? `Expected improvement ${improvement}x to be less than ${minimumImprovement}x`
          : `Expected improvement ${improvement}x to be at least ${minimumImprovement}x (sequential: ${sequentialTime}ms, parallel: ${parallelTime}ms)`
    };
  },
  
  toHaveConsistentPerformance(measurements, maxCoefficientOfVariation = 0.15) {
    const mean = measurements.reduce((sum, val) => sum + val, 0) / measurements.length;
    const variance = measurements.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / measurements.length;
    const standardDeviation = Math.sqrt(variance);
    const cv = standardDeviation / mean;
    
    const pass = cv <= maxCoefficientOfVariation;
    return {
      pass,
      message: () =>
        pass
          ? `Expected coefficient of variation ${cv.toFixed(3)} to be greater than ${maxCoefficientOfVariation}`
          : `Expected coefficient of variation ${cv.toFixed(3)} to be at most ${maxCoefficientOfVariation} for consistent performance`
    };
  }
});

// Global error handler for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  global.perfMonitor.recordError(new Error(`Unhandled Promise Rejection: ${reason}`));
});

// Global arrays for tracking test resources
global.testSwarms = [];
global.testAgents = [];
global.testMemoryKeys = [];
global.performanceReports = [];

// Console log performance targets for reference
console.log('🎯 Performance Targets Loaded:');
console.log(`  Agent Spawn Time: <${global.TEST_CONFIG.PERFORMANCE_TARGETS.AGENT_SPAWN_TIME}ms`);
console.log(`  Task Completion Rate: >${global.TEST_CONFIG.PERFORMANCE_TARGETS.TASK_COMPLETION_RATE * 100}%`);
console.log(`  Performance Improvement: >${global.TEST_CONFIG.PERFORMANCE_TARGETS.PERFORMANCE_IMPROVEMENT}x`);
console.log(`  Parallel Efficiency: >${global.TEST_CONFIG.PERFORMANCE_TARGETS.PARALLEL_EFFICIENCY * 100}%`);
console.log(`  Memory Accuracy: >${global.TEST_CONFIG.PERFORMANCE_TARGETS.MEMORY_ACCURACY * 100}%`);

module.exports = {
  cleanupTestResources
};