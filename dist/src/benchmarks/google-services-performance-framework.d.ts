/**
 * Google Services Performance Benchmarking Framework
 *
 * Comprehensive performance testing and optimization framework for all Google Services
 * including Streaming API, AgentSpace, Mariner, Veo3, Co-Scientist, Imagen4, Chirp, and Lyria
 */
export class GoogleServicesPerformanceBenchmarker {
    constructor(config?: {});
    services: Map<any, any>;
    benchmarkResults: Map<any, any>;
    loadTestScenarios: Map<any, any>;
    optimizationRecommendations: Map<any, any>;
    realTimeMetrics: MetricsCollector;
    alertSystem: PerformanceAlertSystem;
    /**
     * Initialize performance baselines for all Google Services
     */
    initializeServiceBaselines(): void;
    /**
     * Run comprehensive benchmarks across all services
     */
    runComprehensiveBenchmarks(options?: {}): Promise<{
        summary: {
            duration: number;
            servicesTest: number;
            totalTests: number;
            successRate: number;
        };
        results: Map<any, any>;
        report: any;
        optimizations: Map<any, any>;
        timestamp: string;
    }>;
    /**
     * Benchmark individual service with all test scenarios
     */
    benchmarkService(serviceId: any, options?: {}): Promise<{
        service: any;
        baselines: any;
        testResults: Map<any, any>;
    }>;
    /**
     * Run individual load test scenario
     */
    runLoadTestScenario(serviceId: any, scenario: any): Promise<{
        scenario: any;
        duration: number;
        metrics: any;
        summary: {
            totalRequests: number;
            averageResponseTime: any;
            throughput: number;
            errorRate: any;
            peakMemoryUsage: any;
        };
    }>;
    /**
     * Collect real-time service metrics
     */
    collectServiceMetrics(serviceId: any, scenario: any): Promise<{
        timestamp: number;
        responseTime: number;
        throughput: number;
        errorRate: number;
        memoryUsage: number;
        cpuUtilization: number;
    }>;
    /**
     * Generate optimization recommendations based on benchmark results
     */
    generateOptimizationRecommendations(benchmarkResults: any): Promise<Map<any, any>>;
    /**
     * Identify performance bottlenecks from test results
     */
    identifyBottlenecks(serviceResults: any): {
        type: string;
        scenario: any;
        metric: string;
        actual: any;
        threshold: any;
        severity: string;
    }[];
    parseDuration(duration: any): number;
    calculateLoadFactor(scenario: any): number;
    simulateResponseTime(baselines: any, loadFactor: any): number;
    simulateThroughput(baselines: any, loadFactor: any): number;
    simulateErrorRate(loadFactor: any): number;
    simulateMemoryUsage(baselines: any, loadFactor: any): number;
    simulateCPUUtilization(loadFactor: any): number;
    calculateOptimalTTL(serviceId: any): any;
    calculateOptimalInstances(serviceId: any, bottleneck: any): number;
    calculateOptimalPoolSize(serviceId: any): any;
    generateCDNCachingRules(serviceId: any): {
        staticAssets: {
            pattern: string;
            ttl: string;
            compression: boolean;
        };
        apiResponses: {
            pattern: string;
            ttl: any;
            compression: boolean;
            varyHeaders: string[];
        };
        dynamicContent: {
            pattern: string;
            ttl: string;
            compression: boolean;
            bypassCache: string[];
        };
    };
}
/**
 * Performance Metrics Collector
 */
export class MetricsCollector {
    isCollecting: boolean;
    metrics: any[];
    collectors: Map<any, any>;
    startCollection(): Promise<void>;
    stopCollection(): Promise<void>;
    collectSystemMetrics(): void;
    collectNetworkMetrics(): void;
}
/**
 * Performance Alert System
 */
export class PerformanceAlertSystem {
    alerts: any[];
    thresholds: Map<any, any>;
    isActive: boolean;
    setThreshold(metric: any, threshold: any): void;
    checkMetrics(metrics: any): void;
    triggerAlert(alert: any): void;
}
//# sourceMappingURL=google-services-performance-framework.d.ts.map