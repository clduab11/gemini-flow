import { ToolCapability } from '../../../types/mcp-config';
/**
 * @interface CloudSQLConfig
 * @description Configuration for Google Cloud SQL operations.
 */
export interface CloudSQLConfig {
    instanceName: string;
    databaseName: string;
    projectID: string;
    region: string;
}
/**
 * @interface CloudSQLOperations
 * @description Defines the operations available for Google Cloud SQL.
 */
export interface CloudSQLOperations {
    executeQuery(query: string, params?: any[]): Promise<any>;
    manageInstance(action: 'start' | 'stop' | 'restart' | 'resize', options?: any): Promise<any>;
    configureDatabase(config: {
        [key: string]: any;
    }): Promise<any>;
    listDatabases(): Promise<string[]>;
    listTables(databaseName: string): Promise<string[]>;
}
/**
 * @class CloudSQLTool
 * @description Implements Google Cloud SQL operations as an MCP tool.
 */
export declare class CloudSQLTool implements CloudSQLOperations {
    private config;
    constructor(config: CloudSQLConfig);
    /**
     * Executes a SQL query against the configured Cloud SQL database.
     * @param {string} query The SQL query to execute.
     * @param {any[]} [params] Optional parameters for the query.
     * @returns {Promise<any>} The result of the query.
     */
    executeQuery(query: string, params?: any[]): Promise<any>;
    /**
     * Manages the Cloud SQL instance (start, stop, restart, resize).
     * @param {'start' | 'stop' | 'restart' | 'resize'} action The management action to perform.
     * @param {any} [options] Additional options for the action (e.g., new size for resize).
     * @returns {Promise<any>} The result of the management operation.
     */
    manageInstance(action: 'start' | 'stop' | 'restart' | 'resize', options?: any): Promise<any>;
    /**
     * Configures the Cloud SQL database settings.
     * @param {{ [key: string]: any }} config The configuration settings to apply.
     * @returns {Promise<any>} The result of the configuration update.
     */
    configureDatabase(config: {
        [key: string]: any;
    }): Promise<any>;
    /**
     * Lists all databases in the Cloud SQL instance.
     * @returns {Promise<string[]>} A list of database names.
     */
    listDatabases(): Promise<string[]>;
    /**
     * Lists all tables in a specific database within the Cloud SQL instance.
     * @param {string} databaseName The name of the database.
     * @returns {Promise<string[]>} A list of table names.
     */
    listTables(databaseName: string): Promise<string[]>;
    /**
     * Returns the capabilities provided by this tool.
     * @returns {ToolCapability[]} An array of tool capabilities.
     */
    static getCapabilities(): ToolCapability[];
}
//# sourceMappingURL=cloud-sql.d.ts.map