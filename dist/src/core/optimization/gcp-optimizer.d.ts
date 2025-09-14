import { VertexAiPerformanceOptimizer } from '../performance/vertex-ai-performance-optimizer';
import { GcpOperationsSuiteIntegration } from '../performance/gcp-operations-suite-integration';
/**
 * @interface GcpOptimizerConfig
 * @description Configuration for the Google Cloud Platform Optimizer.
 */
export interface GcpOptimizerConfig {
    projectID: string;
    targetRegion: string;
}
/**
 * @interface GcpOptimizerOperations
 * @description Defines operations for optimizing Google Cloud Platform integration.
 */
export interface GcpOptimizerOperations {
    optimizeCost(): Promise<any>;
    optimizeRegionalDeployment(): Promise<void>;
    configureAutoScaling(): Promise<void>;
    optimizeService(serviceName: string): Promise<void>;
    optimizeNetworkRouting(): Promise<void>;
    setupAutomatedOptimizationTriggers(): Promise<void>;
}
/**
 * @class GcpOptimizer
 * @description Optimizes Google Cloud Platform integration for cost, performance, and reliability.
 */
export declare class GcpOptimizer implements GcpOptimizerOperations {
    private config;
    private logger;
    private vertexAiOptimizer;
    private gcpOperations;
    constructor(config: GcpOptimizerConfig, vertexAiOptimizer: VertexAiPerformanceOptimizer, gcpOperations: GcpOperationsSuiteIntegration);
    /**
     * Optimizes cost through intelligent resource utilization.
     * @returns {Promise<any>} Cost analysis and optimization recommendations.
     */
    optimizeCost(): Promise<any>;
    /**
     * Optimizes regional deployment for latency reduction.
     * @returns {Promise<void>}
     */
    optimizeRegionalDeployment(): Promise<void>;
    /**
     * Configures auto-scaling for optimal performance and cost.
     * @returns {Promise<void>}
     */
    configureAutoScaling(): Promise<void>;
    /**
     * Performs service-specific optimizations for Vertex AI, Cloud SQL, Pub/Sub, etc.
     * @param {string} serviceName The name of the GCP service to optimize.
     * @returns {Promise<void>}
     */
    optimizeService(serviceName: string): Promise<void>;
    /**
     * Optimizes network routing within Google Cloud Platform.
     * @returns {Promise<void>}
     */
    optimizeNetworkRouting(): Promise<void>;
    /**
     * Sets up automated optimization triggers based on performance monitoring.
     * @returns {Promise<void>}
     */
    setupAutomatedOptimizationTriggers(): Promise<void>;
}
//# sourceMappingURL=gcp-optimizer.d.ts.map