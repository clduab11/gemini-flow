import { SQLiteMemoryCore } from './sqlite-memory-core';
import { MemoryIntelligence } from './memory-intelligence';
/**
 * @class MemoryPerformanceOptimizer
 * @description Achieves claude-flow parity performance for the memory system through optimization techniques.
 */
export declare class MemoryPerformanceOptimizer {
    private dbCore;
    private memoryIntelligence;
    private logger;
    constructor(dbCore: SQLiteMemoryCore, memoryIntelligence: MemoryIntelligence);
    /**
     * Runs a comprehensive performance benchmark on the SQLite memory system.
     * @returns {Promise<any>} Performance metrics.
     */
    runBenchmark(): Promise<any>;
    /**
     * Implements intelligent query optimization and caching strategies.
     * @returns {Promise<void>}
     */
    optimizeQueriesAndCache(): Promise<void>;
    /**
     * Sets up performance monitoring and alerting for the memory system.
     * @returns {Promise<void>}
     */
    setupMonitoringAndAlerting(): Promise<void>;
    /**
     * Implements automatic scaling logic based on memory load.
     * This is conceptual at this layer, as actual scaling involves infrastructure.
     * @returns {Promise<void>}
     */
    implementAutoScalingLogic(): Promise<void>;
}
//# sourceMappingURL=memory-performance.d.ts.map