import { WasmNeuralEngine } from './wasm-engine';
/**
 * @interface CoordinationModelConfig
 * @description Configuration for Neural Coordination Models.
 */
export interface CoordinationModelConfig {
    modelType: 'lstm' | 'transformer' | 'cnn';
    modelPath: string;
}
/**
 * @interface CoordinationModelOperations
 * @description Defines operations for neural networks applied to coordination tasks.
 */
export interface CoordinationModelOperations {
    predictOptimalWorker(taskData: any, workerMetrics: any[]): Promise<string>;
    detectAnomaly(systemMetrics: any): Promise<boolean>;
    optimizeSystemPerformance(currentMetrics: any): Promise<any>;
    recognizeCoordinationPattern(eventSequence: any[]): Promise<string>;
    makeDecision(context: any): Promise<any>;
}
/**
 * @class NeuralCoordinationModels
 * @description Implements neural networks for predictive load balancing, anomaly detection, performance optimization, and pattern recognition in coordination.
 */
export declare class NeuralCoordinationModels implements CoordinationModelOperations {
    private config;
    private logger;
    private wasmEngine;
    private loadedModel;
    constructor(config: CoordinationModelConfig, wasmEngine: WasmNeuralEngine);
    /**
     * Initializes the neural model by loading it into the WASM engine.
     * @returns {Promise<void>}
     */
    initialize(): Promise<void>;
    /**
     * Predicts the optimal worker for a given task using a neural network.
     * @param {any} taskData Data describing the task.
     * @param {any[]} workerMetrics Metrics of available workers.
     * @returns {Promise<string>} The ID of the predicted optimal worker.
     */
    predictOptimalWorker(taskData: any, workerMetrics: any[]): Promise<string>;
    /**
     * Detects anomalies in system metrics using a neural network.
     * @param {any} systemMetrics Current system metrics.
     * @returns {Promise<boolean>} True if an anomaly is detected, false otherwise.
     */
    detectAnomaly(systemMetrics: any): Promise<boolean>;
    /**
     * Optimizes system performance using an AI-driven approach.
     * @param {any} currentMetrics Current system performance metrics.
     * @returns {Promise<any>} Recommended optimization actions.
     */
    optimizeSystemPerformance(currentMetrics: any): Promise<any>;
    /**
     * Recognizes coordination patterns from event sequences.
     * @param {any[]} eventSequence A sequence of coordination events.
     * @returns {Promise<string>} The recognized pattern type.
     */
    recognizeCoordinationPattern(eventSequence: any[]): Promise<string>;
    /**
     * Makes a decision using a neural-enhanced decision tree or model.
     * @param {any} context The decision context.
     * @returns {Promise<any>} The decision output.
     */
    makeDecision(context: any): Promise<any>;
}
//# sourceMappingURL=coordination-models.d.ts.map