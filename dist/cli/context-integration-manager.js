/**
 * Gemini CLI Integration Architecture - Context Integration Manager
 *
 * Manages seamless context integration between gemini-flow CLI and official Gemini CLI.
 * Handles environment variables, working directory, configuration, and state sharing.
 */
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { EventEmitter } from "node:events";
import { Logger } from "../utils/logger.js";
/**
 * Context Integration Manager
 *
 * Manages the integration and synchronization of context between CLI implementations
 * Ensures seamless state sharing and environment consistency
 */
export class ContextIntegrationManager extends EventEmitter {
    constructor(options = {}) {
        super();
        this.contextCache = new Map();
        this.activeContexts = new Set();
        this.tempFiles = new Set();
        this.logger = new Logger("ContextIntegrationManager");
        this.config = {
            enableEnvironmentSync: true,
            enableWorkingDirectorySync: true,
            enableConfigurationSync: true,
            enableStateSync: true,
            contextVariables: [
                "GEMINI_API_KEY",
                "GEMINI_PROJECT",
                "GEMINI_MODEL",
                "HOME",
                "PATH",
                "USER",
                "SHELL",
                "PWD",
                "NODE_ENV",
                "DEBUG",
            ],
            maxContextSize: 1024 * 1024, // 1MB
            tempDirectory: os.tmpdir(),
            contextTimeout: 30000, // 30 seconds
            ...options,
        };
    }
    /**
     * Create a new CLI context for command execution
     */
    async createContext(source, overrides = {}) {
        const contextId = this.generateContextId();
        const timestamp = Date.now();
        // Build environment variables
        const environment = this.config.enableEnvironmentSync
            ? await this.buildEnvironmentContext(overrides.environment)
            : overrides.environment || {};
        // Build configuration
        const configuration = this.config.enableConfigurationSync
            ? await this.buildConfigurationContext(overrides.configuration)
            : overrides.configuration || {};
        // Build state
        const state = this.config.enableStateSync
            ? await this.buildStateContext(overrides.state)
            : overrides.state || {};
        const context = {
            environment,
            workingDirectory: this.config.enableWorkingDirectorySync
                ? overrides.workingDirectory || process.cwd()
                : overrides.workingDirectory || process.cwd(),
            configuration,
            state,
            metadata: {
                sessionId: contextId,
                timestamp,
                source,
                version: "1.0.0",
                ...overrides.metadata,
            },
        };
        this.contextCache.set(contextId, context);
        this.activeContexts.add(contextId);
        // Clean up old contexts
        this.cleanupOldContexts();
        this.emit("context-created", context);
        return context;
    }
    /**
     * Synchronize context between CLI implementations
     */
    async syncContext(context) {
        const startTime = Date.now();
        const warnings = [];
        try {
            // Validate context
            const validationResult = this.validateContext(context);
            if (!validationResult.valid) {
                warnings.push(...validationResult.warnings);
            }
            // Create temporary context file if needed
            let contextFile;
            if (this.shouldCreateContextFile(context)) {
                contextFile = await this.createContextFile(context);
                this.tempFiles.add(contextFile);
            }
            // Sync environment variables
            if (this.config.enableEnvironmentSync) {
                await this.syncEnvironmentVariables(context.environment);
                this.emit("environment-synced", context.environment);
            }
            // Sync configuration
            if (this.config.enableConfigurationSync) {
                await this.syncConfiguration(context.configuration);
                this.emit("configuration-synced", context.configuration);
            }
            // Sync state
            if (this.config.enableStateSync) {
                await this.syncState(context.state);
                this.emit("state-synced", context.state);
            }
            const result = {
                success: true,
                contextId: context.metadata.sessionId,
                size: this.calculateContextSize(context),
                variables: Object.keys(context.environment),
                warnings,
            };
            this.emit("context-synced", result);
            return result;
        }
        catch (error) {
            const errorResult = {
                success: false,
                contextId: context.metadata.sessionId,
                size: 0,
                variables: [],
                error: error instanceof Error ? error.message : String(error),
                warnings,
            };
            this.emit("context-error", error instanceof Error ? error : new Error(String(error)), context);
            return errorResult;
        }
    }
    /**
     * Get context by ID
     */
    getContext(contextId) {
        return this.contextCache.get(contextId);
    }
    /**
     * Update existing context
     */
    async updateContext(contextId, updates) {
        const existing = this.contextCache.get(contextId);
        if (!existing) {
            return null;
        }
        const updated = {
            ...existing,
            ...updates,
            environment: { ...existing.environment, ...updates.environment },
            configuration: { ...existing.configuration, ...updates.configuration },
            state: { ...existing.state, ...updates.state },
            metadata: { ...existing.metadata, ...updates.metadata, timestamp: Date.now() },
        };
        this.contextCache.set(contextId, updated);
        return updated;
    }
    /**
     * Remove context
     */
    async removeContext(contextId) {
        const context = this.contextCache.get(contextId);
        if (!context) {
            return false;
        }
        // Clean up temporary files
        if (context.metadata.sessionId === contextId) {
            await this.cleanupContextFiles(contextId);
        }
        this.contextCache.delete(contextId);
        this.activeContexts.delete(contextId);
        return true;
    }
    /**
     * Export context to various formats
     */
    async exportContext(contextId, format = "json") {
        const context = this.contextCache.get(contextId);
        if (!context) {
            return null;
        }
        switch (format) {
            case "json":
                return JSON.stringify(context, null, 2);
            case "env":
                return this.formatAsEnvFile(context.environment);
            case "yaml":
                return this.formatAsYaml(context);
            default:
                throw new Error(`Unsupported export format: ${format}`);
        }
    }
    /**
     * Import context from various formats
     */
    async importContext(source, format = "json") {
        let data;
        switch (format) {
            case "json":
                data = JSON.parse(source);
                break;
            case "env":
                data = { environment: this.parseEnvFile(source) };
                break;
            case "yaml":
                data = this.parseYaml(source);
                break;
            default:
                throw new Error(`Unsupported import format: ${format}`);
        }
        return await this.createContext("imported", data);
    }
    /**
     * Clean up resources
     */
    async cleanup() {
        // Clean up all temporary files
        for (const file of this.tempFiles) {
            try {
                if (fs.existsSync(file)) {
                    fs.unlinkSync(file);
                }
            }
            catch (error) {
                this.logger.warn(`Failed to clean up temp file ${file}: ${error}`);
            }
        }
        this.tempFiles.clear();
        // Clear caches
        this.contextCache.clear();
        this.activeContexts.clear();
        this.removeAllListeners();
    }
    /**
     * Build environment context
     */
    async buildEnvironmentContext(overrides = {}) {
        const env = {};
        // Add relevant environment variables
        for (const key of this.config.contextVariables) {
            if (process.env[key]) {
                env[key] = process.env[key];
            }
        }
        // Add process-specific variables
        env.PWD = process.cwd();
        env.NODE_ENV = process.env.NODE_ENV || "development";
        // Apply overrides
        Object.assign(env, overrides);
        return env;
    }
    /**
     * Build configuration context
     */
    async buildConfigurationContext(overrides = {}) {
        const config = {
            cliVersion: "1.0.0",
            platform: process.platform,
            arch: process.arch,
            nodeVersion: process.version,
        };
        // Load configuration files if they exist
        const configFiles = [
            "package.json",
            ".gemini-flow.json",
            ".gemini-flow.config.js",
            "tsconfig.json",
        ];
        for (const file of configFiles) {
            try {
                const configPath = path.join(process.cwd(), file);
                if (fs.existsSync(configPath)) {
                    const configData = JSON.parse(fs.readFileSync(configPath, "utf8"));
                    config[file.replace(".", "").replace("-", "_")] = configData;
                }
            }
            catch (error) {
                this.logger.debug(`Failed to load config file ${file}: ${error}`);
            }
        }
        // Apply overrides
        Object.assign(config, overrides);
        return config;
    }
    /**
     * Build state context
     */
    async buildStateContext(overrides = {}) {
        const state = {
            cwd: process.cwd(),
            timestamp: Date.now(),
            pid: process.pid,
            sessionId: this.generateContextId(),
        };
        // Add package.json info if available
        try {
            const packagePath = path.join(process.cwd(), "package.json");
            if (fs.existsSync(packagePath)) {
                const packageData = JSON.parse(fs.readFileSync(packagePath, "utf8"));
                state.packageName = packageData.name;
                state.packageVersion = packageData.version;
            }
        }
        catch (error) {
            this.logger.debug(`Failed to load package.json: ${error}`);
        }
        // Apply overrides
        Object.assign(state, overrides);
        return state;
    }
    /**
     * Validate context
     */
    validateContext(context) {
        const warnings = [];
        // Check context size
        const size = this.calculateContextSize(context);
        if (size > this.config.maxContextSize) {
            warnings.push(`Context size (${size} bytes) exceeds maximum (${this.config.maxContextSize} bytes)`);
        }
        // Validate environment variables
        for (const [key, value] of Object.entries(context.environment)) {
            if (value && value.length > 1000) {
                warnings.push(`Environment variable ${key} is very large (${value.length} chars)`);
            }
        }
        return {
            valid: warnings.length === 0,
            warnings,
        };
    }
    /**
     * Calculate context size
     */
    calculateContextSize(context) {
        return JSON.stringify(context).length;
    }
    /**
     * Check if context file should be created
     */
    shouldCreateContextFile(context) {
        const size = this.calculateContextSize(context);
        return size > 4096; // Create file for large contexts (>4KB)
    }
    /**
     * Create temporary context file
     */
    async createContextFile(context) {
        const tempFile = path.join(this.config.tempDirectory, `gemini-context-${context.metadata.sessionId}.json`);
        await fs.promises.writeFile(tempFile, JSON.stringify(context, null, 2), "utf8");
        return tempFile;
    }
    /**
     * Sync environment variables
     */
    async syncEnvironmentVariables(env) {
        // In a real implementation, this would update the process environment
        // or create environment files for the target CLI
        for (const [key, value] of Object.entries(env)) {
            if (value !== undefined && value !== null) {
                process.env[key] = value;
            }
        }
    }
    /**
     * Sync configuration
     */
    async syncConfiguration(config) {
        // Create temporary config file if needed
        const tempConfigPath = path.join(this.config.tempDirectory, "gemini-config.json");
        try {
            await fs.promises.writeFile(tempConfigPath, JSON.stringify(config, null, 2), "utf8");
            this.tempFiles.add(tempConfigPath);
        }
        catch (error) {
            this.logger.warn(`Failed to create temporary config file: ${error}`);
        }
    }
    /**
     * Sync state
     */
    async syncState(state) {
        // Create temporary state file if needed
        const tempStatePath = path.join(this.config.tempDirectory, "gemini-state.json");
        try {
            await fs.promises.writeFile(tempStatePath, JSON.stringify(state, null, 2), "utf8");
            this.tempFiles.add(tempStatePath);
        }
        catch (error) {
            this.logger.warn(`Failed to create temporary state file: ${error}`);
        }
    }
    /**
     * Clean up old contexts
     */
    cleanupOldContexts() {
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        for (const [contextId, context] of this.contextCache.entries()) {
            if (now - context.metadata.timestamp > maxAge) {
                this.contextCache.delete(contextId);
                this.activeContexts.delete(contextId);
                this.cleanupContextFiles(contextId);
            }
        }
    }
    /**
     * Clean up context files
     */
    async cleanupContextFiles(contextId) {
        const patterns = [
            `gemini-context-${contextId}.json`,
            `gemini-config-${contextId}.json`,
            `gemini-state-${contextId}.json`,
        ];
        for (const pattern of patterns) {
            try {
                const filePath = path.join(this.config.tempDirectory, pattern);
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    this.tempFiles.delete(filePath);
                }
            }
            catch (error) {
                this.logger.debug(`Failed to clean up file ${pattern}: ${error}`);
            }
        }
    }
    /**
     * Generate unique context ID
     */
    generateContextId() {
        return `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    /**
     * Format as environment file
     */
    formatAsEnvFile(env) {
        return Object.entries(env)
            .map(([key, value]) => `${key}=${value}`)
            .join("\n");
    }
    /**
     * Parse environment file
     */
    parseEnvFile(content) {
        const env = {};
        for (const line of content.split("\n")) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith("#")) {
                const [key, ...valueParts] = trimmed.split("=");
                if (key) {
                    env[key] = valueParts.join("=");
                }
            }
        }
        return env;
    }
    /**
     * Format as YAML (simplified)
     */
    formatAsYaml(context) {
        // Simplified YAML formatting - in a real implementation, use a YAML library
        return `environment:
${Object.entries(context.environment)
            .map(([k, v]) => `  ${k}: ${v}`)
            .join("\n")}
workingDirectory: ${context.workingDirectory}
configuration: ${JSON.stringify(context.configuration)}
state: ${JSON.stringify(context.state)}
metadata: ${JSON.stringify(context.metadata)}`;
    }
    /**
     * Parse YAML (simplified)
     */
    parseYaml(content) {
        // Simplified YAML parsing - in a real implementation, use a YAML library
        const lines = content.split("\n");
        const context = {};
        let currentSection = "";
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.endsWith(":")) {
                currentSection = trimmed.slice(0, -1);
            }
            else if (currentSection && trimmed.includes(":") && !trimmed.startsWith("  ")) {
                const [key, value] = trimmed.split(": ").map(s => s.trim());
                if (key && value) {
                    context[key] = value;
                }
            }
        }
        return context;
    }
    /**
     * Type-safe event emission
     */
    emit(event, ...args) {
        return super.emit(event, ...args);
    }
    /**
     * Type-safe event listener
     */
    on(event, listener) {
        return super.on(event, listener);
    }
}
/**
 * Convenience function to create and sync context
 */
export async function integrateCLIContext(source, overrides = {}) {
    const manager = new ContextIntegrationManager();
    try {
        const context = await manager.createContext(source, overrides);
        return await manager.syncContext(context);
    }
    finally {
        await manager.cleanup();
    }
}
/**
 * Get default context integration manager instance
 */
export function getDefaultContextManager() {
    return new ContextIntegrationManager();
}
