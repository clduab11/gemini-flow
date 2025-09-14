import { NeuralCoordinationModels } from '../neural/coordination-models';
import { VertexAiPerformanceOptimizer } from './vertex-ai-performance-optimizer';
/**
 * @interface NeuralOptimizationConfig
 * @description Configuration for Neural Performance Optimization.
 */
export interface NeuralOptimizationConfig {
    projectID: string;
}
/**
 * @interface NeuralOptimizationOperations
 * @description Defines operations for AI-driven performance optimization.
 */
export interface NeuralOptimizationOperations {
    tuneSystemPerformance(currentMetrics: any): Promise<any>;
    predictiveScale(workloadForecast: any): Promise<void>;
    allocateResourcesIntelligently(resourceRequests: any): Promise<any>;
    detectPerformanceAnomalies(metricsStream: any): Promise<boolean>;
    optimizeCost(usageData: any): Promise<any>;
}
/**
 * @class NeuralPerformanceOptimizer
 * @description Provides AI-driven system performance tuning and optimization using neural networks.
 */
export declare class NeuralPerformanceOptimizer implements NeuralOptimizationOperations {
    private config;
    private logger;
    private neuralModels;
    private vertexAiOptimizer;
    constructor(config: NeuralOptimizationConfig, neuralModels: NeuralCoordinationModels, vertexAiOptimizer: VertexAiPerformanceOptimizer);
    /**
     * Tunes system performance using an AI-driven approach.
     * @param {any} currentMetrics Current system performance metrics.
     * @returns {Promise<any>} Recommended tuning actions.
     */
    tuneSystemPerformance(currentMetrics: any): Promise<any>;
    /**
     * Performs predictive scaling based on workload patterns.
     * @param {any} workloadForecast Forecasted workload data.
     * @returns {Promise<void>}
     */
    predictiveScale(workloadForecast: any): Promise<void>;
    /**
     * Allocates resources intelligently using neural networks.
     * @param {any} resourceRequests Data describing resource requests.
     * @returns {Promise<any>} Optimized resource allocation.
     */
    allocateResourcesIntelligently(resourceRequests: any): Promise<any>;
    /**
     * Detects performance anomalies in real-time metrics streams.
     * @param {any} metricsStream A stream of real-time metrics.
     * @returns {Promise<boolean>} True if an anomaly is detected, false otherwise.
     */
    detectPerformanceAnomalies(metricsStream: any): Promise<boolean>;
    /**
     * Optimizes cost through intelligent resource utilization.
     * @param {any} usageData Data on resource usage and costs.
     * @returns {Promise<any>} Cost optimization recommendations.
     */
    optimizeCost(usageData: any): Promise<any>;
}
//# sourceMappingURL=neural-optimization.d.ts.map