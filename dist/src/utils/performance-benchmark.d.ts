/**
 * Performance Benchmark Suite
 *
 * Measures actual performance against <75ms routing target
 * Identifies bottlenecks and validates optimizations
 */
export interface BenchmarkResult {
    operation: string;
    averageTime: number;
    p95Time: number;
    p99Time: number;
    iterations: number;
    success: boolean;
    bottlenecks: string[];
}
export interface RoutingBenchmark {
    totalTime: number;
    routingTime: number;
    cacheTime: number;
    monitoringTime: number;
    breakdown: {
        ruleEvaluation: number;
        candidateScoring: number;
        loadBalancing: number;
        cacheL1Lookup: number;
        cacheL2Lookup: number;
        metricRecording: number;
    };
}
export declare class PerformanceBenchmark {
    private logger;
    private router;
    private cache;
    private monitor;
    private results;
    constructor();
    /**
     * Run complete routing performance benchmark
     */
    benchmarkRouting(iterations?: number): Promise<RoutingBenchmark>;
    /**
     * Measure single routing operation with detailed breakdown
     */
    private measureSingleRouting;
    /**
     * Benchmark cache operations specifically
     */
    benchmarkCache(iterations?: number): Promise<BenchmarkResult>;
    /**
     * Benchmark WAL mode vs regular SQLite
     */
    benchmarkWALMode(): Promise<{
        wal: BenchmarkResult;
        regular: BenchmarkResult;
    }>;
    /**
     * Benchmark specific cache instance
     */
    private benchmarkCacheInstance;
    /**
     * Identify cache-specific bottlenecks
     */
    private identifyCacheBottlenecks;
    /**
     * Run comprehensive performance analysis
     */
    runFullBenchmark(): Promise<{
        routing: RoutingBenchmark;
        cache: BenchmarkResult;
        wal: {
            wal: BenchmarkResult;
            regular: BenchmarkResult;
        };
        summary: {
            meetsTarget: boolean;
            recommendations: string[];
        };
    }>;
    /**
     * Mock routing context for testing
     */
    private createMockRoutingContext;
    /**
     * Mock model configurations
     */
    private createMockModelConfigs;
    private simulateRuleEvaluation;
    private simulateCandidateScoring;
    private simulateLoadBalancing;
    private average;
    private percentile;
    /**
     * Shutdown benchmark resources
     */
    shutdown(): void;
}
//# sourceMappingURL=performance-benchmark.d.ts.map