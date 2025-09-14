import { NeuralCoordinationModels } from '../neural/coordination-models';
/**
 * @interface PredictiveSystemConfig
 * @description Configuration for the Predictive Coordination System.
 */
export interface PredictiveSystemConfig {
    projectID: string;
}
/**
 * @interface PredictiveSystemOperations
 * @description Defines operations for predictive coordination capabilities.
 */
export interface PredictiveSystemOperations {
    predictBottlenecks(systemMetrics: any): Promise<string[]>;
    proactiveResourceAllocation(predictedLoad: any): Promise<any>;
    scheduleTask(task: any, availableResources: any): Promise<any>;
    predictLoad(historicalData: any): Promise<any>;
    predictFailure(componentMetrics: any): Promise<boolean>;
}
/**
 * @class PredictiveCoordinationSystem
 * @description Implements predictive coordination capabilities for enhanced hive-mind operations.
 */
export declare class PredictiveCoordinationSystem implements PredictiveSystemOperations {
    private config;
    private logger;
    private neuralModels;
    constructor(config: PredictiveSystemConfig, neuralModels: NeuralCoordinationModels);
    /**
     * Predicts coordination bottlenecks using machine learning models.
     * @param {any} systemMetrics Current system performance metrics.
     * @returns {Promise<string[]>} A list of predicted bottlenecks.
     */
    predictBottlenecks(systemMetrics: any): Promise<string[]>;
    /**
     * Performs proactive resource allocation based on predicted load.
     * @param {any} predictedLoad Data representing the predicted future load.
     * @returns {Promise<any>} Recommended resource allocation changes.
     */
    proactiveResourceAllocation(predictedLoad: any): Promise<any>;
    /**
     * Intelligently schedules a task with deadline optimization.
     * @param {any} task The task to schedule.
     * @param {any} availableResources Information about available resources.
     * @returns {Promise<any>} The optimized task schedule.
     */
    scheduleTask(task: any, availableResources: any): Promise<any>;
    /**
     * Predicts future load using time-series analysis and neural networks.
     * @param {any} historicalData Historical workload data.
     * @returns {Promise<any>} Predicted future load.
     */
    predictLoad(historicalData: any): Promise<any>;
    /**
     * Predicts component failure using anomaly detection.
     * @param {any} componentMetrics Real-time metrics of a component.
     * @returns {Promise<boolean>} True if failure is predicted, false otherwise.
     */
    predictFailure(componentMetrics: any): Promise<boolean>;
}
//# sourceMappingURL=predictive-system.d.ts.map