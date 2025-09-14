/**
 * Performance Optimization System - Main Export Module
 * Comprehensive performance optimization and testing framework
 */
export { PredictiveStreamingManager, ContentPredictionModel, QualityController, type StreamingMetrics, type BufferConfig, type ContentSegment, type UserPattern, type NetworkCondition, type BufferHealth, type UserInteraction, type PerformanceMetrics, } from "./predictive-streaming-manager";
export { GPUClusterCoordinator, LoadBalancer, FaultToleranceManager, ResourcePool, TaskScheduler, PriorityQueue, type GPUNode, type GPUCapability, type RenderingTask, type ClusterMetrics, type ResourcePrediction, } from "./gpu-cluster-coordinator";
export { MemoryPoolManager, DefragmentationScheduler, AdaptiveAllocator, CompressionManager, MemoryMonitor, type MemoryBlock, type MemoryPool, type AllocationRequest, type GCMetrics, type MemoryMetrics, } from "./memory-pool-manager";
export { QueuePrioritizationSystem, FairnessManager, QueueLoadBalancer, QueueMetricsCollector, StarvationPreventer, AdaptiveScheduler, type QueueItem, type QueueMetrics, type FairnessPolicy, type ProcessingResult, } from "./queue-prioritization-system";
export { CostOptimizationManager, CostAnalyzer, ForecastEngine, AlertManager, SchedulingOptimizer, type ResourceCost, type ResourceUsage, type CostBudget, type OptimizationRecommendation, type CostForecast, } from "./cost-optimization-manager";
export { EdgeCacheOptimizer, CachePredictionEngine, CacheInvalidationManager, CDNLoadBalancer, CompressionManager as CacheCompressionManager, CacheAnalyticsEngine, type CacheNode, type CacheItem, type CachePolicy, type WarmingStrategy, type CDNMetrics, } from "./edge-cache-optimizer";
export { MonitoringDashboard, MetricsAggregator, AlertEngine, DataCollector, VisualizationEngine, type MetricData, type Dashboard, type Widget, type Alert, type AlertChannel, type MonitoringConfig, } from "./monitoring-dashboard";
export { ComprehensiveTestFramework, TestGenerator, ChaosEngineer, PerformanceMonitor, MockServiceGenerator, TestReportGenerator, LoadTestExecutor, type TestService, type TestScenario, type TestStep, type TestAssertion, type TestResult, type StepResult, type TestMetrics, } from "../testing/comprehensive-test-framework";
export { PerformanceProfiler, MemoryProfiler, LoadTestRunner, PERFORMANCE_BASELINES, } from "../testing/jest-performance-suite.test";
/**
 * Performance Optimization Manager - Orchestrates all performance components
 */
export declare class PerformanceOptimizationManager {
    private streamingManager;
    private gpuCoordinator;
    private memoryManager;
    private queueSystem;
    private costOptimizer;
    private cacheOptimizer;
    private dashboard;
    private testFramework;
    constructor();
    /**
     * Initialize all performance optimization components
     */
    private initializeComponents;
    /**
     * Get all performance managers
     */
    getManagers(): {
        streaming: PredictiveStreamingManager;
        gpu: GPUClusterCoordinator;
        memory: MemoryPoolManager;
        queue: QueuePrioritizationSystem;
        cost: CostOptimizationManager;
        cache: EdgeCacheOptimizer;
        monitoring: MonitoringDashboard;
        testing: ComprehensiveTestFramework;
    };
    /**
     * Get comprehensive system performance metrics
     */
    getSystemPerformanceMetrics(): Promise<{
        streaming: any;
        gpu: any;
        memory: any;
        queue: any;
        cache: any;
        system: any;
        timestamp: number;
    }>;
    /**
     * Execute comprehensive performance optimization
     */
    optimizePerformance(): Promise<{
        streaming: PromiseSettledResult<any>;
        gpu: PromiseSettledResult<any>;
        memory: PromiseSettledResult<any>;
        queue: PromiseSettledResult<any>;
        cost: PromiseSettledResult<any>;
        cache: PromiseSettledResult<any>;
    }>;
    /**
     * Run comprehensive performance tests
     */
    runPerformanceTests(): Promise<{
        testSuite: any;
        loadTest: any;
        chaosTest: any;
        report: any;
    }>;
    /**
     * Get optimization recommendations
     */
    getOptimizationRecommendations(): Promise<{
        cost: any;
        queue: any;
        memory: any;
        priority: string;
        estimatedSavings: {
            cost: any;
            performance: number;
        };
    }>;
}
/**
 * Default export - Performance Optimization Manager instance
 */
declare const performanceManager: PerformanceOptimizationManager;
export default performanceManager;
/**
 * Utility function to create performance-optimized configuration
 */
export declare function createPerformanceConfig(targets: {
    textLatency?: number;
    multimediaLatency?: number;
    uptime?: number;
    throughput?: number;
    costBudget?: number;
}): {
    streaming: {
        targetLatency: number;
        adaptiveBuffering: boolean;
        predictionEnabled: boolean;
    };
    gpu: {
        autoScaling: boolean;
        faultTolerance: boolean;
        loadBalancing: string;
    };
    memory: {
        gcStrategy: string;
        defragmentation: boolean;
        compression: boolean;
    };
    queue: {
        fairnessAlgorithm: string;
        starvationPrevention: boolean;
        adaptiveScheduling: boolean;
    };
    cost: {
        budget: number;
        optimization: boolean;
        alerting: boolean;
    };
    cache: {
        predictiveWarming: boolean;
        intelligentInvalidation: boolean;
        compressionEnabled: boolean;
    };
    monitoring: {
        realTimeMetrics: boolean;
        alerting: boolean;
        dashboard: boolean;
    };
    testing: {
        continuousTesting: boolean;
        performanceBaselines: boolean;
        chaosEngineering: boolean;
    };
};
//# sourceMappingURL=index.d.ts.map