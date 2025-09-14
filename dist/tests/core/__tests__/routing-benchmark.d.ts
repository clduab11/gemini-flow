/**
 * Smart Routing Performance Benchmark
 *
 * Standalone benchmark script to validate <75ms routing overhead
 * Run with: npx ts-node tests/core/__tests__/routing-benchmark.ts
 */
interface BenchmarkResult {
    scenario: string;
    averageTime: number;
    medianTime: number;
    p95Time: number;
    maxTime: number;
    minTime: number;
    samples: number;
    targetMet: boolean;
    cacheHitRate?: number;
}
declare class RoutingBenchmark {
    private router;
    private mockModels;
    private readonly TARGET_MS;
    constructor();
    private setupMockModels;
    private measureRoutingTime;
    private calculateStats;
    benchmarkColdStart(): Promise<BenchmarkResult>;
    benchmarkWarmCache(): Promise<BenchmarkResult>;
    benchmarkComplexityVariations(): Promise<BenchmarkResult>;
    benchmarkConcurrentLoad(): Promise<BenchmarkResult>;
    benchmarkStressTest(): Promise<BenchmarkResult>;
    private printResult;
    runAllBenchmarks(): Promise<void>;
}
export { RoutingBenchmark };
export type { BenchmarkResult };
//# sourceMappingURL=routing-benchmark.d.ts.map