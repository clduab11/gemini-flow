#!/usr/bin/env node
export class BenchmarkRunner {
    constructor(config?: {});
    config: {
        mode: any;
        services: any;
        outputDir: any;
        enableOptimizations: boolean;
        enableRealtimeMonitoring: boolean;
    };
    benchmarker: any;
    loadTester: any;
    optimizer: any;
    startTime: number | null;
    results: {
        benchmarks: null;
        loadTests: null;
        optimizations: null;
        summary: null;
    };
    /**
     * Main execution method
     */
    run(): Promise<{
        benchmarks: null;
        loadTests: null;
        optimizations: null;
        summary: null;
    }>;
    /**
     * Run comprehensive benchmarks (all services, all scenarios)
     */
    runComprehensiveBenchmarks(): Promise<void>;
    /**
     * Run quick benchmarks (essential services, basic scenarios)
     */
    runQuickBenchmarks(): Promise<void>;
    /**
     * Run soak tests for memory leak detection
     */
    runSoakTests(): Promise<void>;
    /**
     * Run spike tests for elasticity validation
     */
    runSpikeTests(): Promise<void>;
    /**
     * Run optimization-focused tests
     */
    runOptimizationTests(): Promise<void>;
    /**
     * Compare pre/post optimization results
     */
    compareOptimizationResults(preResults: any, postResults: any): Promise<{
        improvements: {};
        degradations: {};
        summary: {
            totalImprovedServices: number;
            averageLatencyImprovement: number;
            averageThroughputImprovement: number;
            overallSuccess: boolean;
        };
    }>;
    /**
     * Generate comprehensive summary
     */
    generateComprehensiveSummary(): Promise<{
        type: string;
        timestamp: string;
        duration: number;
        services: {
            tested: number;
            passed: number;
            failed: number;
            warnings: number;
        };
        performance: {
            averageLatency: number;
            averageThroughput: number;
            averageErrorRate: number;
            slaCompliance: number;
        };
        loadTesting: {
            scenariosExecuted: number;
            maxConcurrentUsers: number;
            longestTestDuration: number;
            overallSuccess: boolean;
        };
        optimizations: {
            applied: any;
            successful: number;
            averageImprovement: number;
        };
        recommendations: never[];
    }>;
    /**
     * Generate global recommendations based on all results
     */
    generateGlobalRecommendations(): Promise<{
        category: string;
        priority: string;
        title: string;
        description: string;
        expectedImprovement: string;
        implementation: string;
    }[]>;
    /**
     * Generate final comprehensive report
     */
    generateFinalReport(): Promise<void>;
    /**
     * Generate HTML report
     */
    generateHTMLReport(reportData: any): Promise<string>;
    /**
     * Generate executive summary
     */
    generateExecutiveSummary(reportData: any): Promise<string>;
    ensureOutputDirectory(): Promise<void>;
    saveIntermediateResults(filename: any, data: any): Promise<void>;
    getServicesList(): any[];
    formatDuration(ms: any): string;
    parseDurationToMs(duration: any): number;
    getServiceStatus(serviceId: any, reportData: any): "✅ PASSED" | "❌ NEEDS ATTENTION";
    generateErrorReport(error: any): Promise<void>;
    generateQuickSummary(): Promise<{
        type: string;
        message: string;
        servicesTest: number;
        duration: number;
    }>;
    generateSoakSummary(): Promise<{
        type: string;
        message: string;
        focus: string;
        duration: number;
    }>;
    generateSpikeSummary(): Promise<{
        type: string;
        message: string;
        focus: string;
        duration: number;
    }>;
    generateOptimizationSummary(): Promise<{
        type: string;
        message: string;
        focus: string;
        duration: number;
    }>;
}
//# sourceMappingURL=benchmark-runner.d.ts.map