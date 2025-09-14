import { PredictiveCoordinationSystem } from './predictive-system';
/**
 * @interface AdaptiveBalancingConfig
 * @description Configuration for the Adaptive Load Balancer.
 */
export interface AdaptiveBalancingConfig {
    projectID: string;
}
/**
 * @interface AdaptiveBalancingOperations
 * @description Defines operations for adaptive load balancing and scaling.
 */
export interface AdaptiveBalancingOperations {
    adjustWorkerAssignments(currentLoad: any, workerPool: any[]): Promise<any[]>;
    triggerDynamicScaling(predictedDemand: any): Promise<void>;
    distributeLoadGeographically(task: any, regions: string[]): Promise<string>;
    balanceLoadCostAware(task: any, workerPool: any[]): Promise<string>;
    ensureQoS(serviceMetrics: any): Promise<boolean>;
    intelligentFailover(failedComponent: string): Promise<void>;
}
/**
 * @class AdaptiveLoadBalancer
 * @description Implements real-time adjustment of worker assignments and dynamic scaling based on predicted demand.
 */
export declare class AdaptiveLoadBalancer implements AdaptiveBalancingOperations {
    private config;
    private logger;
    private predictiveSystem;
    constructor(config: AdaptiveBalancingConfig, predictiveSystem: PredictiveCoordinationSystem);
    /**
     * Adjusts worker assignments in real-time based on current load and worker metrics.
     * @param {any} currentLoad Current system load metrics.
     * @param {any[]} workerPool A list of available workers with their current status/load.
     * @returns {Promise<any[]>} Recommended worker assignments.
     */
    adjustWorkerAssignments(currentLoad: any, workerPool: any[]): Promise<any[]>;
    /**
     * Triggers dynamic scaling based on predicted demand.
     * @param {any} predictedDemand Data representing the predicted future demand.
     * @returns {Promise<void>}
     */
    triggerDynamicScaling(predictedDemand: any): Promise<void>;
    /**
     * Distributes load geographically across Google Cloud regions.
     * @param {any} task The task to distribute.
     * @param {string[]} regions A list of available GCP regions.
     * @returns {Promise<string>} The ID of the region where the task is distributed.
     */
    distributeLoadGeographically(task: any, regions: string[]): Promise<string>;
    /**
     * Balances load with cost awareness.
     * @param {any} task The task to assign.
     * @param {any[]} workerPool A list of available workers with cost profiles.
     * @returns {Promise<string>} The ID of the worker assigned based on cost optimization.
     */
    balanceLoadCostAware(task: any, workerPool: any[]): Promise<string>;
    /**
     * Ensures Quality of Service (QoS) guarantees with SLA monitoring.
     * @param {any} serviceMetrics Real-time service metrics.
     * @returns {Promise<boolean>} True if QoS is met, false otherwise.
     */
    ensureQoS(serviceMetrics: any): Promise<boolean>;
    /**
     * Implements intelligent failover with minimal coordination disruption.
     * @param {string} failedComponent The component that failed.
     * @returns {Promise<void>}
     */
    intelligentFailover(failedComponent: string): Promise<void>;
}
//# sourceMappingURL=adaptive-balancing.d.ts.map