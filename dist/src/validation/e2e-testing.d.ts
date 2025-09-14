/**
 * @interface E2eTestingConfig
 * @description Configuration for End-to-End Workflow Testing.
 */
export interface E2eTestingConfig {
    mcpToolExecutionTargetMs: number;
    sqliteOpsPerSecTarget: number;
    hiveCoordinationLatencyTargetMs: number;
    neuralProcessingLatencyTargetMs: number;
    complexWorkflowLatencyTargetMs: number;
    concurrentUsers: number;
}
/**
 * @interface E2eTestingOperations
 * @description Defines operations for comprehensive end-to-end workflow testing.
 */
export interface E2eTestingOperations {
    runAllWorkflowTests(): Promise<boolean>;
    runSimpleWorkflowTest(): Promise<boolean>;
    runComplexWorkflowTest(): Promise<boolean>;
    runAdvancedWorkflowTest(): Promise<boolean>;
    runEnterpriseWorkflowTest(): Promise<boolean>;
    runPerformanceBenchmarks(): Promise<any>;
    runLoadTestingValidation(): Promise<any>;
}
/**
 * @class E2eWorkflowTester
 * @description Orchestrates and executes comprehensive end-to-end workflow tests, performance benchmarking, and load testing.
 */
export declare class E2eWorkflowTester implements E2eTestingOperations {
    private config;
    private logger;
    constructor(config: E2eTestingConfig);
    /**
     * Runs all defined workflow tests.
     * @returns {Promise<boolean>} True if all workflow tests pass, false otherwise.
     */
    runAllWorkflowTests(): Promise<boolean>;
    /**
     * Runs a simple workflow test: MCP tool -> SQLite memory -> Single agent execution.
     * @returns {Promise<boolean>} True if the test passes, false otherwise.
     */
    runSimpleWorkflowTest(): Promise<boolean>;
    /**
     * Runs a complex workflow test: Multi-tool -> Hive-mind coordination -> Neural optimization.
     * @returns {Promise<boolean>} True if the test passes, false otherwise.
     */
    runComplexWorkflowTest(): Promise<boolean>;
    /**
     * Runs an advanced workflow test: Event triggers -> Hook automation -> WASM processing -> Results.
     * @returns {Promise<boolean>} True if the test passes, false otherwise.
     */
    runAdvancedWorkflowTest(): Promise<boolean>;
    /**
     * Runs an enterprise workflow test: Full system coordination with monitoring and optimization.
     * @returns {Promise<boolean>} True if the test passes, false otherwise.
     */
    runEnterpriseWorkflowTest(): Promise<boolean>;
    /**
     * Runs performance benchmarks for key system operations.
     * @returns {Promise<any>} Performance benchmark results.
     */
    runPerformanceBenchmarks(): Promise<any>;
    /**
     * Runs load testing validation.
     * @returns {Promise<any>} Load testing results.
     */
    runLoadTestingValidation(): Promise<any>;
}
//# sourceMappingURL=e2e-testing.d.ts.map