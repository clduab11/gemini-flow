/**
 * Jest Performance Test Suite - Examples and Performance Profiling
 * Comprehensive test examples with baseline metrics and profiling tools
 */
/// <reference types="node" resolution-mode="require"/>
declare const PERFORMANCE_BASELINES: {
    textGeneration: {
        latency: number;
        throughput: number;
        errorRate: number;
    };
    multimedia: {
        latency: number;
        throughput: number;
        errorRate: number;
    };
    system: {
        uptime: number;
        memoryUtilization: number;
        cpuUtilization: number;
    };
};
declare class PerformanceProfiler {
    private marks;
    private measures;
    mark(name: string): void;
    measure(name: string, startMark: string): number;
    getMeasure(name: string): number | undefined;
    getAllMeasures(): Map<string, number>;
    clear(): void;
}
declare class MemoryProfiler {
    getMemoryUsage(): NodeJS.MemoryUsage;
    formatMemoryUsage(usage: NodeJS.MemoryUsage): string;
    measureMemoryDelta(before: NodeJS.MemoryUsage, after: NodeJS.MemoryUsage): {
        rss: number;
        heapUsed: number;
        heapTotal: number;
        external: number;
    };
}
declare class LoadTestRunner {
    runConcurrentRequests<T>(requestFn: () => Promise<T>, concurrency: number, duration: number): Promise<{
        totalRequests: number;
        successfulRequests: number;
        failedRequests: number;
        averageLatency: number;
        throughput: number;
        errors: string[];
    }>;
}
export { PerformanceProfiler, MemoryProfiler, LoadTestRunner, PERFORMANCE_BASELINES, };
//# sourceMappingURL=jest-performance-suite.test.d.ts.map