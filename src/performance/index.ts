/**
 * Performance Optimization System - Main Export Module
 * Comprehensive performance optimization and testing framework
 */

// Core Performance Components
export {
  PredictiveStreamingManager,
  ContentPredictionModel,
  QualityController,
  type StreamingMetrics,
  type BufferConfig,
  type ContentSegment,
  type UserPattern,
  type NetworkCondition,
  type BufferHealth,
  type UserInteraction,
  type PerformanceMetrics,
} from "./predictive-streaming-manager.js";

export {
  GPUClusterCoordinator,
  LoadBalancer,
  FaultToleranceManager,
  ResourcePool,
  TaskScheduler,
  PriorityQueue,
  type GPUNode,
  type GPUCapability,
  type RenderingTask,
  type ClusterMetrics,
  type ResourcePrediction,
} from "./gpu-cluster-coordinator.js";

export {
  MemoryPoolManager,
  DefragmentationScheduler,
  AdaptiveAllocator,
  CompressionManager,
  MemoryMonitor,
  type MemoryBlock,
  type MemoryPool,
  type AllocationRequest,
  type GCMetrics,
  type MemoryMetrics,
} from "./memory-pool-manager.js";

export {
  QueuePrioritizationSystem,
  FairnessManager,
  QueueLoadBalancer,
  QueueMetricsCollector,
  StarvationPreventer,
  AdaptiveScheduler,
  type QueueItem,
  type QueueMetrics,
  type FairnessPolicy,
  type ProcessingResult,
} from "./queue-prioritization-system.js";

export {
  CostOptimizationManager,
  CostAnalyzer,
  ForecastEngine,
  AlertManager,
  SchedulingOptimizer,
  type ResourceCost,
  type ResourceUsage,
  type CostBudget,
  type OptimizationRecommendation,
  type CostForecast,
} from "./cost-optimization-manager.js";

export {
  EdgeCacheOptimizer,
  CachePredictionEngine,
  CacheInvalidationManager,
  CDNLoadBalancer,
  CompressionManager as CacheCompressionManager,
  CacheAnalyticsEngine,
  type CacheNode,
  type CacheItem,
  type CachePolicy,
  type WarmingStrategy,
  type CDNMetrics,
} from "./edge-cache-optimizer.js";

export {
  MonitoringDashboard,
  MetricsAggregator,
  AlertEngine,
  DataCollector,
  VisualizationEngine,
  type MetricData,
  type Dashboard,
  type Widget,
  type Alert,
  type AlertChannel,
  type MonitoringConfig,
} from "./monitoring-dashboard.js";

// Testing Framework Components
export {
  ComprehensiveTestFramework,
  TestGenerator,
  ChaosEngineer,
  PerformanceMonitor,
  MockServiceGenerator,
  TestReportGenerator,
  LoadTestExecutor,
  type TestService,
  type TestScenario,
  type TestStep,
  type TestAssertion,
  type TestResult,
  type StepResult,
  type TestMetrics,
} from "../testing/comprehensive-test-framework.js";

export {
  PerformanceProfiler,
  MemoryProfiler,
  LoadTestRunner,
  PERFORMANCE_BASELINES,
} from "../testing/jest-performance-suite.test.js";

/**
 * Performance Optimization Manager - Orchestrates all performance components
 */
export class PerformanceOptimizationManager {
  private streamingManager: PredictiveStreamingManager;
  private gpuCoordinator: GPUClusterCoordinator;
  private memoryManager: MemoryPoolManager;
  private queueSystem: QueuePrioritizationSystem;
  private costOptimizer: CostOptimizationManager;
  private cacheOptimizer: EdgeCacheOptimizer;
  private dashboard: MonitoringDashboard;
  private testFramework: ComprehensiveTestFramework;

  constructor() {
    this.initializeComponents();
  }

  /**
   * Initialize all performance optimization components
   */
  private initializeComponents(): void {
    // Initialize streaming manager
    this.streamingManager = new PredictiveStreamingManager({
      initialSize: 1024 * 1024, // 1MB
      maxSize: 10 * 1024 * 1024, // 10MB
      minSize: 512 * 1024, // 512KB
      adaptationRate: 0.1,
      predictionWindow: 30000,
    });

    // Initialize GPU coordinator
    this.gpuCoordinator = new GPUClusterCoordinator();

    // Initialize memory manager
    this.memoryManager = new MemoryPoolManager();

    // Initialize queue system
    this.queueSystem = new QueuePrioritizationSystem({
      algorithm: "weighted-fair",
      tierWeights: new Map([
        ["free", 1],
        ["basic", 2],
        ["premium", 4],
        ["enterprise", 8],
      ]),
      maxStarvationTime: 10000,
      agingFactor: 1.2,
      burstAllowance: 1000,
    });

    // Initialize cost optimizer
    this.costOptimizer = new CostOptimizationManager();

    // Initialize cache optimizer
    this.cacheOptimizer = new EdgeCacheOptimizer();

    // Initialize monitoring dashboard
    this.dashboard = new MonitoringDashboard({
      metricsRetention: 86400, // 24 hours
      aggregationInterval: 60, // 1 minute
      alertEvaluationInterval: 30, // 30 seconds
      maxMetricsPerSecond: 10000,
    });

    // Initialize test framework
    this.testFramework = new ComprehensiveTestFramework();

    console.log(
      "Performance Optimization Manager initialized with all components",
    );
  }

  /**
   * Get all performance managers
   */
  getManagers() {
    return {
      streaming: this.streamingManager,
      gpu: this.gpuCoordinator,
      memory: this.memoryManager,
      queue: this.queueSystem,
      cost: this.costOptimizer,
      cache: this.cacheOptimizer,
      monitoring: this.dashboard,
      testing: this.testFramework,
    };
  }

  /**
   * Get comprehensive system performance metrics
   */
  async getSystemPerformanceMetrics() {
    const [
      streamingMetrics,
      gpuMetrics,
      memoryMetrics,
      queueMetrics,
      cacheMetrics,
      systemHealth,
    ] = await Promise.all([
      this.streamingManager.getPerformanceMetrics("system"),
      this.gpuCoordinator.getClusterMetrics(),
      this.memoryManager.getMemoryMetrics(),
      this.queueSystem.getMetrics(),
      this.cacheOptimizer.getCDNMetrics(),
      this.dashboard.getSystemHealth(),
    ]);

    return {
      streaming: streamingMetrics,
      gpu: gpuMetrics,
      memory: memoryMetrics,
      queue: queueMetrics,
      cache: cacheMetrics,
      system: systemHealth,
      timestamp: Date.now(),
    };
  }

  /**
   * Execute comprehensive performance optimization
   */
  async optimizePerformance() {
    console.log("Starting comprehensive performance optimization...");

    const optimizationResults = await Promise.allSettled([
      // Streaming optimization
      this.streamingManager.optimizeBuffering("system-user", "system-content"),

      // GPU optimization
      this.gpuCoordinator.autoScale(),

      // Memory optimization
      this.memoryManager.optimizeAllocationStrategy(),

      // Queue optimization
      this.queueSystem.optimizeConfiguration(),

      // Cost optimization
      this.costOptimizer.generateOptimizationRecommendations(),

      // Cache optimization
      this.cacheOptimizer.optimizeDistribution(),
    ]);

    const results = {
      streaming: optimizationResults[0],
      gpu: optimizationResults[1],
      memory: optimizationResults[2],
      queue: optimizationResults[3],
      cost: optimizationResults[4],
      cache: optimizationResults[5],
    };

    console.log("Performance optimization completed");
    return results;
  }

  /**
   * Run comprehensive performance tests
   */
  async runPerformanceTests() {
    console.log("Starting comprehensive performance testing...");

    // Generate test suite
    const testSuite = await this.testFramework.generateTestSuite();

    // Execute load tests
    const loadTestResults = await this.testFramework.executeLoadTest({
      scenarioId: "performance-load-test",
      targetRPS: 1000000, // 1M requests/sec target
      duration: 300000, // 5 minutes
      rampUpTime: 60000, // 1 minute ramp up
      concurrency: 1000,
    });

    // Execute chaos tests
    const chaosTestResults = await this.testFramework.executeChaosTest({
      scenarioId: "performance-chaos-test",
      chaosType: "network",
      intensity: 0.3,
      duration: 180000, // 3 minutes
    });

    // Generate report
    const reportPath = await this.testFramework.generateReport("html");

    console.log("Performance testing completed");
    return {
      testSuite,
      loadTest: loadTestResults,
      chaosTest: chaosTestResults,
      report: reportPath,
    };
  }

  /**
   * Get optimization recommendations
   */
  async getOptimizationRecommendations() {
    const [costRecommendations, queueOptimizations, memoryOptimizations] =
      await Promise.all([
        this.costOptimizer.generateOptimizationRecommendations(),
        this.queueSystem.optimizeConfiguration(),
        this.memoryManager.optimizeAllocationStrategy(),
      ]);

    return {
      cost: costRecommendations,
      queue: queueOptimizations,
      memory: memoryOptimizations,
      priority: "high",
      estimatedSavings: {
        cost: costRecommendations.reduce((sum, rec) => sum + rec.savings, 0),
        performance: 15, // percentage improvement
      },
    };
  }
}

/**
 * Default export - Performance Optimization Manager instance
 */
const performanceManager = new PerformanceOptimizationManager();
export default performanceManager;

/**
 * Utility function to create performance-optimized configuration
 */
export function createPerformanceConfig(targets: {
  textLatency?: number;
  multimediaLatency?: number;
  uptime?: number;
  throughput?: number;
  costBudget?: number;
}) {
  const config = {
    streaming: {
      targetLatency: targets.textLatency || 100,
      adaptiveBuffering: true,
      predictionEnabled: true,
    },
    gpu: {
      autoScaling: true,
      faultTolerance: true,
      loadBalancing: "least-loaded",
    },
    memory: {
      gcStrategy: "generational",
      defragmentation: true,
      compression: true,
    },
    queue: {
      fairnessAlgorithm: "weighted-fair",
      starvationPrevention: true,
      adaptiveScheduling: true,
    },
    cost: {
      budget: targets.costBudget || 10000,
      optimization: true,
      alerting: true,
    },
    cache: {
      predictiveWarming: true,
      intelligentInvalidation: true,
      compressionEnabled: true,
    },
    monitoring: {
      realTimeMetrics: true,
      alerting: true,
      dashboard: true,
    },
    testing: {
      continuousTesting: true,
      performanceBaselines: true,
      chaosEngineering: true,
    },
  };

  return config;
}
