import { Logger } from '../../utils/logger';
import * as fs from 'fs/promises';
import * as path from 'path';
// Conceptual path for the main configuration file
const CONFIG_FILE_PATH = path.join(process.cwd(), '.gemini-flow', 'config.json');
/**
 * @class UnifiedConfigManager
 * @description Provides a single source of truth for all system configuration, supporting environment-specific settings and dynamic updates.
 */
export class UnifiedConfigManager {
    constructor(configManagerConfig) {
        this.config = null;
        this.configFilePath = configManagerConfig?.configFilePath || CONFIG_FILE_PATH;
        this.logger = new Logger('UnifiedConfigManager');
        this.logger.info('Unified Configuration Manager initialized.');
    }
    /**
     * Loads the system configuration from the configuration file.
     * @returns {Promise<SystemConfig>}
     */
    async loadConfig() {
        if (this.config) {
            return this.config;
        }
        try {
            const data = await fs.readFile(this.configFilePath, 'utf-8');
            const loadedConfig = JSON.parse(data);
            if (!this.validateConfig(loadedConfig)) {
                throw new Error('Loaded configuration is invalid.');
            }
            this.config = loadedConfig;
            this.logger.info('Configuration loaded successfully.');
            return this.config;
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                this.logger.warn('Configuration file not found. Loading default configuration.');
                this.config = this.getDefaultConfig();
                await this.saveConfig(this.config); // Save default config for future use
                return this.config;
            }
            throw new Error(`Failed to load configuration: ${error.message}`);
        }
    }
    /**
     * Saves the provided system configuration to the configuration file.
     * @param {SystemConfig} newConfig The new configuration to save.
     * @returns {Promise<void>}
     */
    async saveConfig(newConfig) {
        if (!this.validateConfig(newConfig)) {
            throw new Error('Attempted to save an invalid configuration.');
        }
        try {
            const configDir = path.dirname(this.configFilePath);
            await fs.mkdir(configDir, { recursive: true });
            await fs.writeFile(this.configFilePath, JSON.stringify(newConfig, null, 2), 'utf-8');
            this.config = newConfig;
            this.logger.info('Configuration saved successfully.');
        }
        catch (error) {
            throw new Error(`Failed to save configuration: ${error.message}`);
        }
    }
    /**
     * Retrieves a configuration value by its key path (e.g., 'gcp.projectID').
     * @param {string} keyPath The dot-separated path to the configuration value.
     * @returns {any} The configuration value.
     */
    get(keyPath) {
        if (!this.config) {
            throw new Error('Configuration not loaded. Call loadConfig() first.');
        }
        const parts = keyPath.split('.');
        let current = this.config;
        for (const part of parts) {
            if (current === null || typeof current !== 'object' || !current.hasOwnProperty(part)) {
                return undefined; // Or throw an error if strict access is required
            }
            current = current[part];
        }
        return current;
    }
    /**
     * Sets a configuration value by its key path and saves the configuration.
     * @param {string} keyPath The dot-separated path to the configuration value.
     * @param {any} value The new value.
     * @returns {Promise<void>}
     */
    async set(keyPath, value) {
        if (!this.config) {
            throw new Error('Configuration not loaded. Call loadConfig() first.');
        }
        const parts = keyPath.split('.');
        let current = this.config;
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (i === parts.length - 1) {
                current[part] = value;
            }
            else {
                if (current === null || typeof current !== 'object' || !current.hasOwnProperty(part)) {
                    current[part] = {}; // Create intermediate objects if they don't exist
                }
                current = current[part];
            }
        }
        await this.saveConfig(this.config);
    }
    /**
     * Validates the given configuration against a schema.
     * @param {SystemConfig} config The configuration to validate.
     * @returns {boolean} True if the configuration is valid, false otherwise.
     */
    validateConfig(config) {
        // Basic validation for required top-level properties
        if (!config || typeof config !== 'object') {
            this.logger.error('Invalid configuration: Not an object.');
            return false;
        }
        if (!['development', 'staging', 'production'].includes(config.environment)) {
            this.logger.error('Invalid configuration: environment must be development, staging, or production.');
            return false;
        }
        if (!['debug', 'info', 'warn', 'error'].includes(config.logLevel)) {
            this.logger.error('Invalid configuration: logLevel must be debug, info, warn, or error.');
            return false;
        }
        // More detailed validation for nested objects (e.g., mcpServers, database, gcp) would go here.
        // This could involve using a schema validation library like Joi or Zod.
        return true;
    }
    /**
     * Returns a default configuration object.
     * @returns {SystemConfig}
     */
    getDefaultConfig() {
        return {
            environment: 'development',
            logLevel: 'info',
            mcpServers: {},
            database: { path: './.hive-mind/memory.db', walMode: true, cacheSize: 32768 },
            hiveMind: { queenId: 'default-queen', defaultWorkerSpecialization: 'general_purpose' },
            neural: { wasmEngineConfig: { simdEnabled: true, threading: 'multi', memoryLimit: '1GB', optimization: 'speed' }, coordinationModelConfig: { modelType: 'lstm', modelPath: './models/coordination.wasm' } },
            gcp: { projectID: 'your-gcp-project-id', region: 'us-central1' },
            security: { enableEncryption: false },
        };
    }
}
