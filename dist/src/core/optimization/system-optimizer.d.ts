import { SQLiteMemoryCore } from '../sqlite-memory-core';
import { NeuralCoordinationModels } from '../neural/coordination-models';
/**
 * @interface SystemOptimizerConfig
 * @description Configuration for the System-Wide Optimizer.
 */
export interface SystemOptimizerConfig {
    optimizationLevel: 'light' | 'balanced' | 'aggressive';
}
/**
 * @interface SystemOptimizerOperations
 * @description Defines operations for system-wide performance optimization.
 */
export interface SystemOptimizerOperations {
    optimizeMemoryUsage(): Promise<void>;
    balanceCpuUtilization(): Promise<void>;
    optimizeNetworkBandwidth(): Promise<void>;
    optimizeDatabaseQueries(): Promise<void>;
    manageCache(): Promise<void>;
    optimizeResourceAllocation(): Promise<void>;
}
/**
 * @class SystemOptimizer
 * @description Fine-tunes the entire system for production deployment by optimizing memory, CPU, network, and database performance.
 */
export declare class SystemOptimizer implements SystemOptimizerOperations {
    private config;
    private logger;
    private dbCore;
    private neuralModels;
    constructor(config: SystemOptimizerConfig, dbCore: SQLiteMemoryCore, neuralModels: NeuralCoordinationModels);
    /**
     * Optimizes memory usage across all components.
     * @returns {Promise<void>}
     */
    optimizeMemoryUsage(): Promise<void>;
    /**
     * Balances CPU utilization across the system.
     * @returns {Promise<void>}
     */
    balanceCpuUtilization(): Promise<void>;
    /**
     * Optimizes network bandwidth for Google Cloud communications.
     * @returns {Promise<void>}
     */
    optimizeNetworkBandwidth(): Promise<void>;
    /**
     * Optimizes database queries and connection pooling.
     * @returns {Promise<void>}
     */
    optimizeDatabaseQueries(): Promise<void>;
    /**
     * Manages cache and intelligent prefetching.
     * @returns {Promise<void>}
     */
    manageCache(): Promise<void>;
    /**
     * Optimizes resource allocation using neural networks.
     * @returns {Promise<void>}
     */
    optimizeResourceAllocation(): Promise<void>;
}
//# sourceMappingURL=system-optimizer.d.ts.map