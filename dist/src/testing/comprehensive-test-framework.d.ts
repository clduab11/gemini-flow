/**
 * Comprehensive Test Framework - Integration, Performance, and Chaos Testing
 * Supports 8 service integration testing with automated generation and validation
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
export interface TestService {
    id: string;
    name: string;
    type: "api" | "database" | "queue" | "cache" | "auth" | "storage" | "ml" | "streaming";
    endpoint: string;
    healthCheck: string;
    dependencies: string[];
    config: {
        timeout: number;
        retries: number;
        rateLimit: number;
    };
}
export interface TestScenario {
    id: string;
    name: string;
    description: string;
    type: "integration" | "performance" | "chaos" | "load" | "e2e";
    services: string[];
    steps: TestStep[];
    assertions: TestAssertion[];
    configuration: {
        timeout: number;
        iterations: number;
        concurrency: number;
        rampUp: number;
        duration: number;
    };
    metrics: {
        responseTime: {
            min: number;
            max: number;
            target: number;
        };
        throughput: {
            min: number;
            max: number;
            target: number;
        };
        errorRate: {
            max: number;
        };
        availability: {
            min: number;
        };
    };
}
export interface TestStep {
    id: string;
    name: string;
    action: "request" | "validate" | "wait" | "setup" | "teardown";
    target: string;
    parameters: Record<string, any>;
    expectedResponse?: any;
    timeout: number;
    retries: number;
}
export interface TestAssertion {
    type: "response_time" | "status_code" | "content" | "header" | "metric";
    field: string;
    operator: "equals" | "contains" | "less_than" | "greater_than" | "between";
    value: any;
    tolerance?: number;
}
export interface TestResult {
    scenarioId: string;
    status: "passed" | "failed" | "error" | "timeout";
    startTime: number;
    endTime: number;
    duration: number;
    stepResults: StepResult[];
    metrics: TestMetrics;
    errors: string[];
    artifacts: string[];
}
export interface StepResult {
    stepId: string;
    status: "passed" | "failed" | "skipped";
    duration: number;
    response?: any;
    error?: string;
    metrics: {
        responseTime: number;
        dataTransferred: number;
        cpuUsage: number;
        memoryUsage: number;
    };
}
export interface TestMetrics {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    throughput: number;
    errorRate: number;
    availability: number;
    resourceUsage: {
        cpu: number;
        memory: number;
        network: number;
        disk: number;
    };
}
export declare class ComprehensiveTestFramework extends EventEmitter {
    private services;
    private scenarios;
    private results;
    private testGenerator;
    private chaosEngineer;
    private performanceMonitor;
    private mockGenerator;
    private reportGenerator;
    constructor();
    /**
     * Register a service for testing
     */
    registerService(service: TestService): void;
    /**
     * Create comprehensive test scenario
     */
    createTestScenario(scenario: TestScenario): void;
    /**
     * Execute test scenario with comprehensive monitoring
     */
    executeScenario(scenarioId: string): Promise<TestResult>;
    /**
     * Execute load testing with 1M requests/sec target
     */
    executeLoadTest(config: {
        scenarioId: string;
        targetRPS: number;
        duration: number;
        rampUpTime: number;
        concurrency: number;
    }): Promise<TestResult>;
    /**
     * Execute chaos engineering tests
     */
    executeChaosTest(config: {
        scenarioId: string;
        chaosType: "network" | "service" | "resource" | "latency" | "error";
        intensity: number;
        duration: number;
    }): Promise<TestResult>;
    /**
     * Generate automated test suites for all services
     */
    generateTestSuite(): Promise<{
        scenarios: TestScenario[];
        coverage: number;
        estimatedRuntime: number;
    }>;
    /**
     * Create mock services for testing
     */
    createMockServices(serviceIds: string[]): Promise<Map<string, string>>;
    /**
     * Generate comprehensive test report
     */
    generateReport(format?: "html" | "json" | "pdf"): Promise<string>;
    /**
     * Get test metrics for dashboard
     */
    getTestMetrics(): {
        totalScenarios: number;
        executedScenarios: number;
        passedScenarios: number;
        failedScenarios: number;
        averageResponseTime: number;
        averageThroughput: number;
        overallHealthScore: number;
    };
    private initializeFramework;
    private registerCoreServices;
    private setupTestDataDirectory;
    private validateScenario;
    private setupTestEnvironment;
    private ensureServiceHealth;
    private executeStep;
    private executeRequest;
    private executeValidation;
    private executeWait;
    private executeSetup;
    private executeTeardown;
    private validateAssertions;
    private validateAssertion;
    private cleanupTestEnvironment;
    private initializeMetrics;
    private storeResult;
    private calculateResilienceScore;
    private calculateTestCoverage;
    private estimateTestRuntime;
}
declare class TestGenerator {
    enhanceScenario(scenario: TestScenario, services: Map<string, TestService>): TestScenario;
    generateComprehensiveSuite(services: TestService[]): Promise<TestScenario[]>;
}
declare class ChaosEngineer {
    startChaos(config: any): Promise<void>;
    stopChaos(chaosType: string): Promise<void>;
}
declare class PerformanceMonitor {
    startMonitoring(scenarioId: string): void;
    stopMonitoring(scenarioId: string): void;
    getMetrics(scenarioId: string): Promise<TestMetrics>;
}
declare class MockServiceGenerator {
    createMockService(service: TestService): Promise<string>;
}
declare class TestReportGenerator {
    generate(results: TestResult[], format: string): Promise<string>;
    private formatReport;
}
declare class LoadTestExecutor {
    private framework;
    constructor(framework: ComprehensiveTestFramework);
    execute(scenario: TestScenario, config: any): Promise<TestResult>;
}
export { TestGenerator, ChaosEngineer, PerformanceMonitor, MockServiceGenerator, TestReportGenerator, LoadTestExecutor, };
//# sourceMappingURL=comprehensive-test-framework.d.ts.map