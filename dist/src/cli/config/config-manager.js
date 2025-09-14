/**
 * Configuration Manager for Gemini-Flow CLI
 * Handles configuration loading, validation, and management
 */
import { readFile, writeFile, mkdir, access } from "fs/promises";
import { join, dirname } from "path";
import { homedir } from "os";
import { Logger } from "../../utils/logger.js";
export class ConfigManager {
    logger;
    config = null;
    configPath;
    globalOptions = {};
    constructor() {
        this.logger = new Logger("ConfigManager");
        this.configPath = join(homedir(), ".gemini-flow", "config.json");
    }
    /**
     * Initialize configuration manager
     */
    async initialize() {
        try {
            await this.ensureConfigDirectory();
            await this.loadConfig();
        }
        catch (error) {
            this.logger.error("Failed to initialize configuration:", error);
            throw error;
        }
    }
    /**
     * Load configuration from file or create default
     */
    async loadConfig() {
        try {
            await access(this.configPath);
            const configContent = await readFile(this.configPath, "utf-8");
            this.config = JSON.parse(configContent);
            this.logger.debug("Configuration loaded from:", this.configPath);
        }
        catch (error) {
            // Create default configuration if file doesn't exist
            this.logger.info("Creating default configuration...");
            this.config = this.createDefaultConfig();
            await this.saveConfig();
        }
        return this.config;
    }
    /**
     * Save configuration to file
     */
    async saveConfig() {
        if (!this.config) {
            throw new Error("No configuration to save");
        }
        try {
            await this.ensureConfigDirectory();
            const configContent = JSON.stringify(this.config, null, 2);
            await writeFile(this.configPath, configContent, "utf-8");
            this.logger.debug("Configuration saved to:", this.configPath);
        }
        catch (error) {
            this.logger.error("Failed to save configuration:", error);
            throw error;
        }
    }
    /**
     * Get configuration
     */
    getConfig() {
        if (!this.config) {
            throw new Error("Configuration not loaded");
        }
        return this.config;
    }
    /**
     * Get profile configuration
     */
    getProfile(profileName) {
        if (!this.config)
            return null;
        return this.config.profiles[profileName] || null;
    }
    /**
     * Set profile configuration
     */
    async setProfile(profileName, profile) {
        if (!this.config) {
            throw new Error("Configuration not loaded");
        }
        this.config.profiles[profileName] = profile;
        await this.saveConfig();
        this.logger.info(`Profile '${profileName}' saved`);
    }
    /**
     * Delete profile
     */
    async deleteProfile(profileName) {
        if (!this.config) {
            throw new Error("Configuration not loaded");
        }
        if (!(profileName in this.config.profiles)) {
            throw new Error(`Profile '${profileName}' not found`);
        }
        delete this.config.profiles[profileName];
        await this.saveConfig();
        this.logger.info(`Profile '${profileName}' deleted`);
    }
    /**
     * List all profiles
     */
    listProfiles() {
        if (!this.config)
            return [];
        return Object.keys(this.config.profiles);
    }
    /**
     * Update global configuration
     */
    async updateGlobal(updates) {
        if (!this.config) {
            throw new Error("Configuration not loaded");
        }
        this.config.global = { ...this.config.global, ...updates };
        await this.saveConfig();
        this.logger.info("Global configuration updated");
    }
    /**
     * Update Google configuration
     */
    async updateGoogle(updates) {
        if (!this.config) {
            throw new Error("Configuration not loaded");
        }
        this.config.google = { ...this.config.google, ...updates };
        await this.saveConfig();
        this.logger.info("Google configuration updated");
    }
    /**
     * Validate configuration
     */
    async validate() {
        const issues = [];
        if (!this.config) {
            issues.push("Configuration not loaded");
            return { valid: false, issues };
        }
        // Validate Google configuration
        if (!this.config.google.projectId && !process.env.GOOGLE_CLOUD_PROJECT_ID) {
            issues.push("Google Cloud Project ID not configured");
        }
        // Validate directories
        try {
            await access(this.config.global.cacheDir);
        }
        catch {
            issues.push(`Cache directory not accessible: ${this.config.global.cacheDir}`);
        }
        try {
            await access(this.config.global.dataDir);
        }
        catch {
            issues.push(`Data directory not accessible: ${this.config.global.dataDir}`);
        }
        // Validate agent configuration
        if (this.config.agents.maxAgents < 1) {
            issues.push("Maximum agents must be at least 1");
        }
        if (this.config.agents.defaultCount > this.config.agents.maxAgents) {
            issues.push("Default agent count cannot exceed maximum agents");
        }
        return {
            valid: issues.length === 0,
            issues,
        };
    }
    /**
     * Set global options from CLI
     */
    setGlobalOptions(options) {
        this.globalOptions = options;
    }
    /**
     * Get global options
     */
    getGlobalOptions() {
        return this.globalOptions;
    }
    /**
     * Create default configuration
     */
    createDefaultConfig() {
        const homeDir = homedir();
        const geminiFlowDir = join(homeDir, ".gemini-flow");
        return {
            version: "2.0.0",
            profiles: {
                default: {
                    name: "default",
                    description: "Default configuration profile",
                },
            },
            global: {
                logLevel: "info",
                cacheDir: join(geminiFlowDir, "cache"),
                dataDir: join(geminiFlowDir, "data"),
                tempDir: join(geminiFlowDir, "temp"),
                parallelExecution: true,
                maxConcurrency: 8,
                timeout: 30000,
            },
            agents: {
                defaultCount: 5,
                maxAgents: 64,
                spawnTimeout: 10000,
                heartbeatInterval: 5000,
                memoryLimit: 512,
                types: {
                    coder: {
                        name: "coder",
                        description: "Code implementation specialist",
                        capabilities: ["code-generation", "debugging", "refactoring"],
                        resources: { memory: 256, cpu: 1 },
                    },
                    researcher: {
                        name: "researcher",
                        description: "Information gathering and analysis",
                        capabilities: ["web-search", "data-analysis", "documentation"],
                        resources: { memory: 128, cpu: 1 },
                    },
                    tester: {
                        name: "tester",
                        description: "Test creation and validation",
                        capabilities: ["test-generation", "validation", "qa"],
                        resources: { memory: 128, cpu: 1 },
                    },
                    reviewer: {
                        name: "reviewer",
                        description: "Code review and quality assurance",
                        capabilities: [
                            "code-review",
                            "quality-assurance",
                            "best-practices",
                        ],
                        resources: { memory: 128, cpu: 1 },
                    },
                    planner: {
                        name: "planner",
                        description: "Strategic planning and coordination",
                        capabilities: ["task-planning", "coordination", "strategy"],
                        resources: { memory: 256, cpu: 1 },
                    },
                },
            },
            swarm: {
                defaultTopology: "hierarchical",
                consensusAlgorithm: "majority",
                coordinationTimeout: 5000,
                syncInterval: 1000,
                maxRetries: 3,
            },
            google: {
                region: "us-central1",
                models: {
                    gemini: {
                        version: "gemini-pro",
                        maxTokens: 8192,
                    },
                    vertex: {
                        region: "us-central1",
                        models: ["gemini-pro", "gemini-pro-vision"],
                    },
                },
            },
        };
    }
    /**
     * Ensure configuration directory exists
     */
    async ensureConfigDirectory() {
        const configDir = dirname(this.configPath);
        try {
            await access(configDir);
        }
        catch {
            await mkdir(configDir, { recursive: true });
            this.logger.debug("Created configuration directory:", configDir);
        }
    }
    /**
     * Get configuration file path
     */
    getConfigPath() {
        return this.configPath;
    }
    /**
     * Reset configuration to defaults
     */
    async resetToDefaults() {
        this.config = this.createDefaultConfig();
        await this.saveConfig();
        this.logger.info("Configuration reset to defaults");
    }
}
//# sourceMappingURL=config-manager.js.map