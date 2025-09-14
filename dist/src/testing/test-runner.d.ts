/**
 * @interface TestRunnerConfig
 * @description Configuration for the Comprehensive Test Runner.
 */
export interface TestRunnerConfig {
    testCoverageTarget: number;
    performanceSlaMs: number;
}
/**
 * @interface TestRunnerOperations
 * @description Defines operations for running a comprehensive test suite.
 */
export interface TestRunnerOperations {
    runAllTests(): Promise<any>;
    runUnitTests(): Promise<any>;
    runIntegrationTests(): Promise<any>;
    runPerformanceTests(): Promise<any>;
    runSecurityTests(): Promise<any>;
    generateReport(): Promise<any>;
}
/**
 * @class ComprehensiveTestRunner
 * @description Orchestrates and executes a comprehensive test suite including unit, integration, performance, and security tests.
 */
export declare class ComprehensiveTestRunner implements TestRunnerOperations {
    private config;
    private logger;
    constructor(config: TestRunnerConfig);
    /**
     * Runs all types of tests (unit, integration, performance, security).
     * @returns {Promise<any>} Consolidated test results.
     */
    runAllTests(): Promise<any>;
    /**
     * Runs unit tests.
     * @returns {Promise<any>} Unit test results.
     */
    runUnitTests(): Promise<any>;
    /**
     * Runs integration tests.
     * @returns {Promise<any>} Integration test results.
     */
    runIntegrationTests(): Promise<any>;
    /**
     * Runs performance tests (load, stress, latency).
     * @returns {Promise<any>} Performance test results.
     */
    runPerformanceTests(): Promise<any>;
    /**
     * Runs security tests (penetration, vulnerability scans).
     * @returns {Promise<any>} Security test results.
     */
    runSecurityTests(): Promise<any>;
    /**
     * Generates a comprehensive test report.
     * @returns {Promise<any>} The test report.
     */
    generateReport(): Promise<any>;
    /**
     * Calculates overall test coverage.
     * @param {any} unitResults Unit test results.
     * @param {any} integrationResults Integration test results.
     * @returns {number} Overall coverage percentage.
     */
    private calculateOverallCoverage;
}
//# sourceMappingURL=test-runner.d.ts.map