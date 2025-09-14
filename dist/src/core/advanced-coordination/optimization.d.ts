import { NeuralCoordinationModels } from '../neural/coordination-models';
import { GcpOperationsSuiteIntegration } from '../../core/performance/gcp-operations-suite-integration';
/**
 * @interface CoordinationOptimizationConfig
 * @description Configuration for Coordination Optimization.
 */
export interface CoordinationOptimizationConfig {
    projectID: string;
}
/**
 * @interface CoordinationOptimizationOperations
 * @description Defines operations for optimizing coordination strategies.
 */
export interface CoordinationOptimizationOperations {
    evolveCoordinationStrategy(currentStrategy: any, performanceFeedback: any): Promise<any>;
    adaptStrategyRealtime(environmentalChanges: any): Promise<void>;
    analyzeCoordinationPatterns(historicalData: any): Promise<any>;
    recommendOptimizations(analysisResults: any): Promise<any>;
}
/**
 * @class CoordinationOptimizer
 * @description Implements advanced optimization techniques for coordination strategies.
 */
export declare class CoordinationOptimizer implements CoordinationOptimizationOperations {
    private config;
    private logger;
    private neuralModels;
    private gcpOperations;
    constructor(config: CoordinationOptimizationConfig, neuralModels: NeuralCoordinationModels, gcpOperations: GcpOperationsSuiteIntegration);
    /**
     * Evolves coordination strategy using genetic algorithms or similar optimization techniques.
     * @param {any} currentStrategy The current coordination strategy.
     * @param {any} performanceFeedback Feedback on the strategy's performance.
     * @returns {Promise<any>} The evolved coordination strategy.
     */
    evolveCoordinationStrategy(currentStrategy: any, performanceFeedback: any): Promise<any>;
    /**
     * Adapts coordination strategy in real-time based on environmental changes (conceptual).
     * @param {any} environmentalChanges Real-time data on environmental changes.
     * @returns {Promise<void>}
     */
    adaptStrategyRealtime(environmentalChanges: any): Promise<void>;
    /**
     * Analyzes coordination patterns from historical data.
     * @param {any} historicalData Historical coordination data.
     * @returns {Promise<any>} Analysis results and insights.
     */
    analyzeCoordinationPatterns(historicalData: any): Promise<any>;
    /**
     * Recommends optimizations based on analysis results.
     * @param {any} analysisResults Results from coordination pattern analysis.
     * @returns {Promise<any>} Optimization recommendations.
     */
    recommendOptimizations(analysisResults: any): Promise<any>;
}
//# sourceMappingURL=optimization.d.ts.map