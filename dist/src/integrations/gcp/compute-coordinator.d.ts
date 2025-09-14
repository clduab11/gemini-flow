/**
 * @interface ComputeCoordinatorConfig
 * @description Configuration for the GCP Compute Coordinator.
 */
export interface ComputeCoordinatorConfig {
    projectID: string;
    gkeClusterName?: string;
    cloudRunService?: string;
    cloudFunctionName?: string;
    computeEngineZone?: string;
    appEngineService?: string;
}
/**
 * @interface ComputeCoordinatorOperations
 * @description Defines operations for coordinating across GCP compute services.
 */
export interface ComputeCoordinatorOperations {
    deployAgentSwarm(swarmConfig: any): Promise<string>;
    deployServerlessAgent(agentConfig: any): Promise<string>;
    triggerAgentFunction(functionName: string, payload: any): Promise<any>;
    runHighPerformanceTask(taskConfig: any): Promise<any>;
    updateCoordinationDashboard(dashboardData: any): Promise<void>;
}
/**
 * @class ComputeCoordinator
 * @description Orchestrates agent deployments and task execution across Google Kubernetes Engine, Cloud Run, Cloud Functions, Compute Engine, and App Engine.
 */
export declare class ComputeCoordinator implements ComputeCoordinatorOperations {
    private config;
    private logger;
    constructor(config: ComputeCoordinatorConfig);
    /**
     * Deploys an agent swarm using Google Kubernetes Engine (GKE).
     * @param {any} swarmConfig Configuration for the GKE deployment.
     * @returns {Promise<string>} The ID of the GKE deployment.
     */
    deployAgentSwarm(swarmConfig: any): Promise<string>;
    /**
     * Deploys a serverless agent using Cloud Run.
     * @param {any} agentConfig Configuration for the Cloud Run service.
     * @returns {Promise<string>} The URL of the deployed Cloud Run service.
     */
    deployServerlessAgent(agentConfig: any): Promise<string>;
    /**
     * Triggers a Cloud Function for event-driven agent coordination.
     * @param {string} functionName The name of the Cloud Function to trigger.
     * @param {any} payload The payload to send to the function.
     * @returns {Promise<any>} The result from the Cloud Function.
     */
    triggerAgentFunction(functionName: string, payload: any): Promise<any>;
    /**
     * Runs a high-performance computing task using Compute Engine.
     * @param {any} taskConfig Configuration for the Compute Engine task.
     * @returns {Promise<any>} The result of the HPC task.
     */
    runHighPerformanceTask(taskConfig: any): Promise<any>;
    /**
     * Updates a coordination dashboard deployed on App Engine.
     * @param {any} dashboardData The data to update the dashboard with.
     * @returns {Promise<void>}
     */
    updateCoordinationDashboard(dashboardData: any): Promise<void>;
}
//# sourceMappingURL=compute-coordinator.d.ts.map