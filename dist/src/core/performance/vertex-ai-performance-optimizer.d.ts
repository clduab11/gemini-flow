import { ModelOrchestrator } from '../../integrations/vertex-ai/model-orchestrator';
/**
 * @interface VertexAiPerformanceOptimizerConfig
 * @description Configuration for the Vertex AI Performance Optimizer.
 */
export interface VertexAiPerformanceOptimizerConfig {
    projectID: string;
}
/**
 * @interface VertexAiPerformanceOptimizerOperations
 * @description Defines operations for optimizing Vertex AI model performance and cost.
 */
export interface VertexAiPerformanceOptimizerOperations {
    optimizeModelEndpoints(): Promise<void>;
    optimizeBatchPredictions(jobConfig: any): Promise<any>;
    analyzeCostAndRecommendOptimizations(): Promise<any>;
    benchmarkModel(modelId: string, testData: any): Promise<any>;
    predictiveMaintenance(modelId: string): Promise<any>;
}
/**
 * @class VertexAiPerformanceOptimizer
 * @description Provides enterprise-grade optimization for Vertex AI model performance and cost.
 */
export declare class VertexAiPerformanceOptimizer implements VertexAiPerformanceOptimizerOperations {
    private config;
    private logger;
    private modelOrchestrator;
    constructor(config: VertexAiPerformanceOptimizerConfig, modelOrchestrator: ModelOrchestrator);
    /**
     * Optimizes Vertex AI model endpoints for auto-scaling based on real-time demand patterns (conceptual).
     * @returns {Promise<void>}
     */
    optimizeModelEndpoints(): Promise<void>;
    /**
     * Optimizes batch prediction jobs for cost and performance (conceptual).
     * @param {any} jobConfig Configuration for the batch prediction job.
     * @returns {Promise<any>} The optimized job results.
     */
    optimizeBatchPredictions(jobConfig: any): Promise<any>;
    /**
     * Analyzes Vertex AI costs and recommends optimizations using AI insights (conceptual).
     * @returns {Promise<any>} Cost analysis and recommendations.
     */
    analyzeCostAndRecommendOptimizations(): Promise<any>;
    /**
     * Benchmarks a Vertex AI model against SLA targets and user expectations (conceptual).
     * @param {string} modelId The ID of the model to benchmark.
     * @param {any} testData Test data for benchmarking.
     * @returns {Promise<any>} Benchmarking results.
     */
    benchmarkModel(modelId: string, testData: any): Promise<any>;
    /**
     * Performs predictive maintenance for Vertex AI model deployments and infrastructure (conceptual).
     * @param {string} modelId The ID of the model to monitor.
     * @returns {Promise<any>} Predictive maintenance insights.
     */
    predictiveMaintenance(modelId: string): Promise<any>;
}
//# sourceMappingURL=vertex-ai-performance-optimizer.d.ts.map