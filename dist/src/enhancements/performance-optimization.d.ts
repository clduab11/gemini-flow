import { SystemOptimizer } from '../core/optimization/system-optimizer';
import { GcpOptimizer } from '../core/optimization/gcp-optimizer';
import { NeuralOptimizer } from '../core/optimization/neural-optimizer';
/**
 * @interface PerformanceOptimizationConfig
 * @description Configuration for System-Wide Performance Optimization.
 */
export interface PerformanceOptimizationConfig {
}
/**
 * @interface PerformanceOptimizationOperations
 * @description Defines operations for fine-tuning system performance across all layers.
 */
export interface PerformanceOptimizationOperations {
    fineTuneSqliteOperations(): Promise<void>;
    optimizeGcpIntegrationPatterns(): Promise<void>;
    enhanceWasmNeuralPerformance(): Promise<void>;
    improveHiveMindCoordinationEfficiency(): Promise<void>;
}
/**
 * @class PerformanceOptimizer
 * @description Provides comprehensive performance optimization across SQLite, GCP integration, WASM neural networks, and Hive-Mind coordination.
 */
export declare class PerformanceOptimizer implements PerformanceOptimizationOperations {
    private config;
    private logger;
    private systemOptimizer;
    private gcpOptimizer;
    private neuralOptimizer;
    constructor(config: PerformanceOptimizationConfig, systemOptimizer: SystemOptimizer, gcpOptimizer: GcpOptimizer, neuralOptimizer: NeuralOptimizer);
    /**
     * Fine-tunes SQLite operations for target performance.
     * @returns {Promise<void>}
     */
    fineTuneSqliteOperations(): Promise<void>;
    /**
     * Optimizes Google Cloud service integration patterns.
     * @returns {Promise<void>}
     */
    optimizeGcpIntegrationPatterns(): Promise<void>;
    /**
     * Enhances WASM neural network performance.
     * @returns {Promise<void>}
     */
    enhanceWasmNeuralPerformance(): Promise<void>;
    /**
     * Improves hive-mind coordination efficiency.
     * @returns {Promise<void>}
     */
    improveHiveMindCoordinationEfficiency(): Promise<void>;
}
//# sourceMappingURL=performance-optimization.d.ts.map