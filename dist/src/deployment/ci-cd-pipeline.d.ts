/**
 * @interface CiCdConfig
 * @description Configuration for the CI/CD Pipeline.
 */
export interface CiCdConfig {
    environment: 'development' | 'staging' | 'production';
    testCoverageThreshold: number;
}
/**
 * @interface CiCdOperations
 * @description Defines operations for automated CI/CD pipelines.
 */
export interface CiCdOperations {
    runPipeline(): Promise<void>;
    runAutomatedTests(): Promise<boolean>;
    performCodeQualityChecks(): Promise<boolean>;
    deployApplication(targetEnvironment: 'staging' | 'production'): Promise<void>;
    rollbackDeployment(environment: 'staging' | 'production', version: string): Promise<void>;
    manageFeatureFlag(flagName: string, enable: boolean): Promise<void>;
}
/**
 * @class CiCdPipeline
 * @description Implements automated CI/CD pipelines for testing, building, and deploying Gemini-Flow.
 */
export declare class CiCdPipeline implements CiCdOperations {
    private config;
    private logger;
    constructor(config: CiCdConfig);
    /**
     * Runs the complete CI/CD pipeline.
     * @returns {Promise<void>}
     */
    runPipeline(): Promise<void>;
    /**
     * Runs automated tests (unit, integration, performance).
     * @returns {Promise<boolean>} True if tests pass, false otherwise.
     */
    runAutomatedTests(): Promise<boolean>;
    /**
     * Performs code quality checks and security scanning.
     * @returns {Promise<boolean>} True if checks pass, false otherwise.
     */
    performCodeQualityChecks(): Promise<boolean>;
    /**
     * Deploys the application to a target environment.
     * @param {'staging' | 'production'} targetEnvironment The environment to deploy to.
     * @returns {Promise<void>}
     */
    deployApplication(targetEnvironment: 'staging' | 'production'): Promise<void>;
    /**
     * Rolls back a deployment to a previous version.
     * @param {'staging' | 'production'} environment The environment to rollback.
     * @param {string} version The version to rollback to.
     * @returns {Promise<void>}
     */
    rollbackDeployment(environment: 'staging' | 'production', version: string): Promise<void>;
    /**
     * Manages feature flags for gradual rollouts.
     * @param {string} flagName The name of the feature flag.
     * @param {boolean} enable Whether to enable or disable the flag.
     * @returns {Promise<void>}
     */
    manageFeatureFlag(flagName: string, enable: boolean): Promise<void>;
}
//# sourceMappingURL=ci-cd-pipeline.d.ts.map