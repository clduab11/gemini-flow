/**
 * @interface SystemConfig
 * @description Defines the comprehensive structure for all system configuration.
 */
export interface SystemConfig {
    environment: 'development' | 'staging' | 'production';
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    mcpServers: {
        [key: string]: any;
    };
    database: {
        path: string;
        walMode: boolean;
        cacheSize: number;
    };
    hiveMind: {
        queenId: string;
        defaultWorkerSpecialization: string;
    };
    neural: {
        wasmEngineConfig: any;
        coordinationModelConfig: any;
    };
    gcp: {
        projectID: string;
        region: string;
    };
    security: {
        enableEncryption: boolean;
    };
}
/**
 * @interface ConfigManagerConfig
 * @description Configuration for the Unified Configuration Manager.
 */
export interface ConfigManagerConfig {
    configFilePath?: string;
}
/**
 * @interface ConfigManagerOperations
 * @description Defines operations for managing unified system configuration.
 */
export interface ConfigManagerOperations {
    loadConfig(): Promise<SystemConfig>;
    saveConfig(newConfig: SystemConfig): Promise<void>;
    get(keyPath: string): any;
    set(keyPath: string, value: any): Promise<void>;
    validateConfig(config: SystemConfig): boolean;
}
/**
 * @class UnifiedConfigManager
 * @description Provides a single source of truth for all system configuration, supporting environment-specific settings and dynamic updates.
 */
export declare class UnifiedConfigManager implements ConfigManagerOperations {
    private config;
    private logger;
    private configFilePath;
    constructor(configManagerConfig?: ConfigManagerConfig);
    /**
     * Loads the system configuration from the configuration file.
     * @returns {Promise<SystemConfig>}
     */
    loadConfig(): Promise<SystemConfig>;
    /**
     * Saves the provided system configuration to the configuration file.
     * @param {SystemConfig} newConfig The new configuration to save.
     * @returns {Promise<void>}
     */
    saveConfig(newConfig: SystemConfig): Promise<void>;
    /**
     * Retrieves a configuration value by its key path (e.g., 'gcp.projectID').
     * @param {string} keyPath The dot-separated path to the configuration value.
     * @returns {any} The configuration value.
     */
    get(keyPath: string): any;
    /**
     * Sets a configuration value by its key path and saves the configuration.
     * @param {string} keyPath The dot-separated path to the configuration value.
     * @param {any} value The new value.
     * @returns {Promise<void>}
     */
    set(keyPath: string, value: any): Promise<void>;
    /**
     * Validates the given configuration against a schema.
     * @param {SystemConfig} config The configuration to validate.
     * @returns {boolean} True if the configuration is valid, false otherwise.
     */
    validateConfig(config: SystemConfig): boolean;
    /**
     * Returns a default configuration object.
     * @returns {SystemConfig}
     */
    private getDefaultConfig;
}
//# sourceMappingURL=config-manager.d.ts.map