/**
 * @interface CommunicationCoordinatorConfig
 * @description Configuration for the GCP Communication Coordinator.
 */
export interface CommunicationCoordinatorConfig {
    projectID: string;
    pubSubTopic?: string;
    cloudStorageBucket?: string;
    firebaseDatabaseUrl?: string;
    cdnService?: string;
    endpointsService?: string;
}
/**
 * @interface CommunicationCoordinatorOperations
 * @description Defines operations for coordinating across GCP communication and storage services.
 */
export interface CommunicationCoordinatorOperations {
    publishMessage(topic: string, message: any): Promise<void>;
    subscribeToTopic(topic: string, handler: (message: any) => void): Promise<void>;
    uploadAgentState(agentId: string, state: any): Promise<string>;
    downloadAgentState(fileUrl: string): Promise<any>;
    syncRealtimeData(path: string, data: any): Promise<void>;
    getRealtimeData(path: string): Promise<any>;
    distributeDataGlobally(data: any): Promise<string>;
}
/**
 * @class CommunicationCoordinator
 * @description Orchestrates real-time messaging, persistent storage, and data distribution across Google Cloud Pub/Sub, Cloud Storage, Firebase Realtime Database, Cloud CDN, and Cloud Endpoints.
 */
export declare class CommunicationCoordinator implements CommunicationCoordinatorOperations {
    private config;
    private logger;
    constructor(config: CommunicationCoordinatorConfig);
    /**
     * Publishes a message to a Google Cloud Pub/Sub topic.
     * @param {string} topic The Pub/Sub topic to publish to.
     * @param {any} message The message payload.
     * @returns {Promise<void>}
     */
    publishMessage(topic: string, message: any): Promise<void>;
    /**
     * Subscribes to a Google Cloud Pub/Sub topic.
     * @param {string} topic The Pub/Sub topic to subscribe to.
     * @param {(message: any) => void} handler The message handler function.
     * @returns {Promise<void>}
     */
    subscribeToTopic(topic: string, handler: (message: any) => void): Promise<void>;
    /**
     * Uploads agent state to Google Cloud Storage.
     * @param {string} agentId The ID of the agent.
     * @param {any} state The agent's state to upload.
     * @returns {Promise<string>} The URL of the uploaded state file.
     */
    uploadAgentState(agentId: string, state: any): Promise<string>;
    /**
     * Downloads agent state from Google Cloud Storage.
     * @param {string} fileUrl The URL of the state file.
     * @returns {Promise<any>} The downloaded agent state.
     */
    downloadAgentState(fileUrl: string): Promise<any>;
    /**
     * Synchronizes real-time data using Firebase Realtime Database.
     * @param {string} path The path in the database.
     * @param {any} data The data to synchronize.
     * @returns {Promise<void>}
     */
    syncRealtimeData(path: string, data: any): Promise<void>;
    /**
     * Retrieves real-time data from Firebase Realtime Database.
     * @param {string} path The path in the database.
     * @returns {Promise<any>} The retrieved data.
     */
    getRealtimeData(path: string): Promise<any>;
    /**
     * Distributes data globally using Cloud CDN.
     * @param {any} data The data to distribute.
     * @returns {Promise<string>} The CDN URL for the distributed data.
     */
    distributeDataGlobally(data: any): Promise<string>;
}
//# sourceMappingURL=communication-coordinator.d.ts.map