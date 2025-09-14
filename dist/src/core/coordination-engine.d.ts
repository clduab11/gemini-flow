import { ModelOrchestrator } from '../../integrations/vertex-ai/model-orchestrator';
import { ComputeCoordinator } from '../../integrations/gcp/compute-coordinator';
import { CommunicationCoordinator } from '../../integrations/gcp/communication-coordinator';
/**
 * @interface CoordinationEngineConfig
 * @description Configuration for the Intelligent Coordination Engine.
 */
export interface CoordinationEngineConfig {
    projectID: string;
}
/**
 * @interface CoordinationEngineOperations
 * @description Defines operations for the Intelligent Coordination Engine.
 */
export interface CoordinationEngineOperations {
    distributeTask(task: any, workerPool: string[]): Promise<string>;
    sendMessageToWorker(workerId: string, message: any): Promise<void>;
    receiveMessageFromWorker(workerId: string, handler: (message: any) => void): Promise<void>;
    syncSharedState(statePath: string, data: any): Promise<void>;
    getSharedState(statePath: string): Promise<any>;
}
/**
 * @class CoordinationEngine
 * @description Provides advanced swarm coordination capabilities, including intelligent task distribution and robust communication protocols.
 */
export declare class CoordinationEngine implements CoordinationEngineOperations {
    private config;
    private logger;
    private modelOrchestrator;
    private computeCoordinator;
    private communicationCoordinator;
    constructor(config: CoordinationEngineConfig, modelOrchestrator: ModelOrchestrator, computeCoordinator: ComputeCoordinator, communicationCoordinator: CommunicationCoordinator);
    /**
     * Distributes a task to an optimal worker using Vertex AI optimization.
     * @param {any} task The task to distribute.
     * @param {string[]} workerPool A list of available worker IDs.
     * @returns {Promise<string>} The ID of the worker assigned the task.
     */
    distributeTask(task: any, workerPool: string[]): Promise<string>;
    /**
     * Sends a message to a specific worker using Cloud Pub/Sub.
     * @param {string} workerId The ID of the worker.
     * @param {any} message The message payload.
     * @returns {Promise<void>}
     */
    sendMessageToWorker(workerId: string, message: any): Promise<void>;
    /**
     * Subscribes to messages from a specific worker using Cloud Pub/Sub.
     * @param {string} workerId The ID of the worker.
     * @param {(message: any) => void} handler The message handler function.
     * @returns {Promise<void>}
     */
    receiveMessageFromWorker(workerId: string, handler: (message: any) => void): Promise<void>;
    /**
     * Synchronizes shared state using Firebase Realtime Database.
     * @param {string} statePath The path in the database for the shared state.
     * @param {any} data The data to synchronize.
     * @returns {Promise<void>}
     */
    syncSharedState(statePath: string, data: any): Promise<void>;
    /**
     * Retrieves shared state from Firebase Realtime Database.
     * @param {string} statePath The path in the database for the shared state.
     * @returns {Promise<any>} The retrieved shared state.
     */
    getSharedState(statePath: string): Promise<any>;
    /**
     * Manages real-time capacity across multiple GCP regions (conceptual).
     * @returns {Promise<void>}
     */
    manageRegionalCapacity(): Promise<void>;
    /**
     * Implements predictive scaling based on historical workload patterns (conceptual).
     * @returns {Promise<void>}
     */
    predictiveScale(): Promise<void>;
}
//# sourceMappingURL=coordination-engine.d.ts.map