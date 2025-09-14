/**
 * @interface DatabaseCoordinatorConfig
 * @description Configuration for the GCP Database Coordinator.
 */
export interface DatabaseCoordinatorConfig {
    projectID: string;
    cloudSQLInstance?: string;
    spannerInstance?: string;
    firestoreCollection?: string;
    bigQueryDataset?: string;
    bigtableInstance?: string;
}
/**
 * @interface DatabaseCoordinatorOperations
 * @description Defines operations for coordinating across GCP database services.
 */
export interface DatabaseCoordinatorOperations {
    syncAgentState(agentId: string, state: any): Promise<void>;
    getAgentCoordinationData(agentId: string): Promise<any>;
    logPerformanceMetrics(metrics: any): Promise<void>;
    runAnalyticsQuery(query: string): Promise<any>;
    storeHiveLog(logEntry: any): Promise<void>;
}
/**
 * @class DatabaseCoordinator
 * @description Orchestrates data operations across Google Cloud SQL, Cloud Spanner, Firestore, BigQuery, and Cloud Bigtable.
 */
export declare class DatabaseCoordinator implements DatabaseCoordinatorOperations {
    private config;
    private logger;
    constructor(config: DatabaseCoordinatorConfig);
    /**
     * Synchronizes agent state across relevant databases (e.g., Cloud SQL for primary state, Firestore for real-time updates).
     * @param {string} agentId The ID of the agent.
     * @param {any} state The agent's state to synchronize.
     * @returns {Promise<void>}
     */
    syncAgentState(agentId: string, state: any): Promise<void>;
    /**
     * Retrieves agent coordination data from relevant databases (e.g., Cloud Spanner for global consistency).
     * @param {string} agentId The ID of the agent.
     * @returns {Promise<any>} The agent's coordination data.
     */
    getAgentCoordinationData(agentId: string): Promise<any>;
    /**
     * Logs performance metrics to a high-performance database (e.g., Cloud Bigtable).
     * @param {any} metrics The performance metrics to log.
     * @returns {Promise<void>}
     */
    logPerformanceMetrics(metrics: any): Promise<void>;
    /**
     * Runs an analytics query on BigQuery.
     * @param {string} query The BigQuery SQL query.
     * @returns {Promise<any>} The query results.
     */
    runAnalyticsQuery(query: string): Promise<any>;
    /**
     * Stores hive-mind log entries.
     * @param {any} logEntry The log entry to store.
     * @returns {Promise<void>}
     */
    storeHiveLog(logEntry: any): Promise<void>;
}
//# sourceMappingURL=database-coordinator.d.ts.map