import { WasmPerformanceManager } from '../performance/wasm-manager';
import { NeuralCoordinationModels } from '../neural/coordination-models';
/**
 * @interface NeuralOptimizerConfig
 * @description Configuration for the Neural Performance Optimizer.
 */
export interface NeuralOptimizerConfig {
    projectID: string;
}
/**
 * @interface NeuralOptimizerOperations
 * @description Defines operations for optimizing neural network performance.
 */
export interface NeuralOptimizerOperations {
    tuneWasmNeuralPerformance(): Promise<void>;
    optimizeModelForInference(modelId: string): Promise<void>;
    optimizeBatchProcessing(): Promise<void>;
    optimizeNeuralMemoryAllocation(): Promise<void>;
    enableGpuAcceleration(): Promise<void>;
    quantizeAndCompressModel(modelId: string): Promise<void>;
}
/**
 * @class NeuralOptimizer
 * @description Optimizes neural network performance, including WASM tuning, model optimization, and GPU acceleration.
 */
export declare class NeuralOptimizer implements NeuralOptimizerOperations {
    private config;
    private logger;
    private wasmManager;
    private neuralModels;
    constructor(config: NeuralOptimizerConfig, wasmManager: WasmPerformanceManager, neuralModels: NeuralCoordinationModels);
    /**
     * Tunes WASM neural network performance.
     * @returns {Promise<void>}
     */
    tuneWasmNeuralPerformance(): Promise<void>;
    /**
     * Optimizes a neural network model for production inference speed.
     * @param {string} modelId The ID of the model to optimize.
     * @returns {Promise<void>}
     */
    optimizeModelForInference(modelId: string): Promise<void>;
    /**
     * Optimizes batch processing for high-throughput scenarios.
     * @returns {Promise<void>}
     */
    optimizeBatchProcessing(): Promise<void>;
    /**
     * Optimizes memory allocation for neural computations.
     * @returns {Promise<void>}
     */
    optimizeNeuralMemoryAllocation(): Promise<void>;
    /**
     * Enables GPU acceleration for neural computations (conceptual).
     * @returns {Promise<void>}
     */
    enableGpuAcceleration(): Promise<void>;
    /**
     * Quantizes and compresses a neural network model for smaller size and faster inference (conceptual).
     * @param {string} modelId The ID of the model to quantize and compress.
     * @returns {Promise<void>}
     */
    quantizeAndCompressModel(modelId: string): Promise<void>;
}
//# sourceMappingURL=neural-optimizer.d.ts.map