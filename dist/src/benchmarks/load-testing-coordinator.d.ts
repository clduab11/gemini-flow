export class LoadTestingCoordinator {
    constructor(config?: {});
    config: {
        baseUrl: any;
        apiKey: any;
        resultsDir: any;
        reportingInterval: any;
    };
    activeTests: Map<any, any>;
    testResults: Map<any, any>;
    performanceMetrics: Map<any, any>;
    alertSystem: LoadTestAlertSystem;
    /**
     * Initialize all load testing scenarios
     */
    initializeScenarios(): void;
    scenarios: {
        concurrent_1k: {
            name: string;
            description: string;
            type: string;
            users: number;
            rampUpTime: string;
            duration: string;
            services: string[];
            expectedThroughput: number;
            acceptableCPU: number;
            acceptableMemory: number;
            errorRateThreshold: number;
        };
        concurrent_10k: {
            name: string;
            description: string;
            type: string;
            users: number;
            rampUpTime: string;
            duration: string;
            services: string[];
            expectedThroughput: number;
            acceptableCPU: number;
            acceptableMemory: number;
            errorRateThreshold: number;
        };
        concurrent_100k: {
            name: string;
            description: string;
            type: string;
            users: number;
            rampUpTime: string;
            duration: string;
            services: string[];
            expectedThroughput: number;
            acceptableCPU: number;
            acceptableMemory: number;
            errorRateThreshold: number;
        };
        concurrent_1m: {
            name: string;
            description: string;
            type: string;
            users: number;
            rampUpTime: string;
            duration: string;
            services: string[];
            expectedThroughput: number;
            acceptableCPU: number;
            acceptableMemory: number;
            errorRateThreshold: number;
            requiresCluster: boolean;
        };
        sustained_24h: {
            name: string;
            description: string;
            type: string;
            users: number;
            rampUpTime: string;
            duration: string;
            services: string[];
            expectedThroughput: number;
            memoryGrowthThreshold: number;
            performanceDegradationThreshold: number;
            gcFrequencyThreshold: number;
        };
        sustained_7day: {
            name: string;
            description: string;
            type: string;
            users: number;
            rampUpTime: string;
            duration: string;
            services: string[];
            expectedThroughput: number;
            memoryGrowthThreshold: number;
            performanceDegradationThreshold: number;
            diskSpaceThreshold: number;
        };
        spike_10x: {
            name: string;
            description: string;
            type: string;
            baseUsers: number;
            spikeUsers: number;
            spikeHoldTime: string;
            spikeDuration: string;
            services: string[];
            autoScalingTarget: string;
            recoveryTime: string;
            errorRateSpike: number;
        };
        spike_100x: {
            name: string;
            description: string;
            type: string;
            baseUsers: number;
            spikeUsers: number;
            spikeHoldTime: string;
            spikeDuration: string;
            services: string[];
            autoScalingTarget: string;
            recoveryTime: string;
            errorRateSpike: number;
        };
        soak_memory_leak: {
            name: string;
            description: string;
            type: string;
            users: number;
            duration: string;
            services: string[];
            memoryLeakDetection: {
                enabled: boolean;
                samplingInterval: string;
                growthThreshold: number;
                alertThreshold: number;
            };
            resourceExhaustion: {
                monitorFileDescriptors: boolean;
                monitorConnections: boolean;
                monitorThreads: boolean;
            };
        };
        soak_resource_exhaustion: {
            name: string;
            description: string;
            type: string;
            users: number;
            duration: string;
            services: string[];
            resourceMonitoring: {
                cpuSustainedThreshold: number;
                memorySustainedThreshold: number;
                diskIOThreshold: number;
                networkIOThreshold: number;
            };
            performanceMetrics: {
                responseTimeDegradation: number;
                throughputDegradation: number;
                errorRateIncrease: number;
            };
        };
    } | undefined;
    /**
     * Execute comprehensive load testing suite
     */
    executeComprehensiveLoadTests(scenarios?: any[]): Promise<{
        startTime: string;
        scenarios: never[];
        summary: {
            total: number;
            passed: number;
            failed: number;
            warnings: number;
        };
    }>;
    /**
     * Execute individual load test scenario
     */
    executeLoadTestScenario(scenarioName: any, scenario: any): Promise<{
        duration: number;
        toolUsed: any;
        executionResults: any;
        performanceMetrics: {
            averageThroughput: number;
            maxThroughput: number;
            averageResponseTime: number;
            maxResponseTime: number;
            errorRate: number;
            maxCPU: number;
            maxMemoryUsage: number;
        };
        thresholds: {
            expectedThroughput: any;
            acceptableCPU: any;
            acceptableMemory: any;
            errorRateThreshold: any;
        };
        testId: string;
        scenario: any;
    } | {
        duration: number;
        toolUsed: string;
        executionResults: any;
        sustainedMetrics: any;
        degradationAnalysis: any;
        thresholds: {
            expectedThroughput: any;
            memoryGrowthThreshold: any;
            performanceDegradationThreshold: any;
        };
        testId: string;
        scenario: any;
    } | {
        duration: number;
        toolUsed: string;
        phases: any[];
        performanceTimeline: any[];
        spikeAnalysis: any;
        thresholds: {
            autoScalingTarget: any;
            recoveryTime: any;
            errorRateSpike: any;
        };
        testId: string;
        scenario: any;
    } | {
        duration: number;
        toolUsed: string;
        executionResults: any;
        memoryAnalysis: {
            leakDetected: boolean;
            growthRate: number;
            totalGrowth: number;
        };
        resourceAnalysis: any;
        trendAnalysis: any;
        thresholds: {
            memoryGrowthThreshold: any;
            performanceDegradation: any;
        };
        testId: string;
        scenario: any;
    }>;
    /**
     * Execute concurrent user simulation
     */
    executeConcurrentTest(testId: any, scenario: any): Promise<{
        toolUsed: any;
        executionResults: any;
        performanceMetrics: {
            averageThroughput: number;
            maxThroughput: number;
            averageResponseTime: number;
            maxResponseTime: number;
            errorRate: number;
            maxCPU: number;
            maxMemoryUsage: number;
        };
        thresholds: {
            expectedThroughput: any;
            acceptableCPU: any;
            acceptableMemory: any;
            errorRateThreshold: any;
        };
    }>;
    /**
     * Execute sustained load test
     */
    executeSustainedTest(testId: any, scenario: any): Promise<{
        toolUsed: string;
        executionResults: any;
        sustainedMetrics: any;
        degradationAnalysis: any;
        thresholds: {
            expectedThroughput: any;
            memoryGrowthThreshold: any;
            performanceDegradationThreshold: any;
        };
    }>;
    /**
     * Execute spike test
     */
    executeSpikeTest(testId: any, scenario: any): Promise<{
        toolUsed: string;
        phases: any[];
        performanceTimeline: any[];
        spikeAnalysis: any;
        thresholds: {
            autoScalingTarget: any;
            recoveryTime: any;
            errorRateSpike: any;
        };
    }>;
    /**
     * Execute soak test for memory leaks and resource exhaustion
     */
    executeSoakTest(testId: any, scenario: any): Promise<{
        toolUsed: string;
        executionResults: any;
        memoryAnalysis: {
            leakDetected: boolean;
            growthRate: number;
            totalGrowth: number;
        };
        resourceAnalysis: any;
        trendAnalysis: any;
        thresholds: {
            memoryGrowthThreshold: any;
            performanceDegradation: any;
        };
    }>;
    /**
     * Execute JMeter test
     */
    executeJMeterTest(config: any): Promise<any>;
    /**
     * Execute Gatling test
     */
    executeGatlingTest(config: any): Promise<any>;
    /**
     * Analyze scenario results against thresholds
     */
    analyzeScenarioResults(scenarioName: any, scenarioResult: any): Promise<{
        passed: boolean;
        warnings: never[];
        failures: never[];
        recommendations: never[];
    }>;
    /**
     * Generate optimization recommendations based on test results
     */
    generateRecommendations(scenarioName: any, scenarioResult: any): Promise<{
        category: string;
        priority: string;
        title: string;
        description: string;
        expectedImprovement: string;
    }[]>;
    ensureResultsDirectory(): Promise<void>;
    startPerformanceMonitoring(): Promise<void>;
    stopPerformanceMonitoring(): Promise<void>;
    cooldownPeriod(testType: any): Promise<void>;
    generateComprehensiveReport(results: any): Promise<void>;
    generateGlobalRecommendations(results: any): Promise<{
        category: string;
        priority: string;
        title: string;
        description: string;
    }[]>;
    collectPerformanceMetrics(testId: any, duration: any): Promise<{
        averageThroughput: number;
        maxThroughput: number;
        averageResponseTime: number;
        maxResponseTime: number;
        errorRate: number;
        maxCPU: number;
        maxMemoryUsage: number;
    }>;
    detectMemoryLeaks(testId: any, scenario: any): Promise<{
        leakDetected: boolean;
        growthRate: number;
        totalGrowth: number;
    }>;
    generateJMeterScript(config: any): Promise<string>;
    generateGatlingScript(config: any): Promise<string>;
}
/**
 * Load Test Alert System
 */
export class LoadTestAlertSystem {
    alerts: any[];
    thresholds: Map<any, any>;
    triggerAlert(type: any, message: any, severity?: string): void;
    getAlerts(): any[];
}
//# sourceMappingURL=load-testing-coordinator.d.ts.map