/**
 * Configuration Manager for Gemini-Flow CLI
 * Handles configuration loading, validation, and management
 */

import { readFile, writeFile, mkdir, access } from "fs/promises";
import { join, dirname } from "path";
import { homedir } from "os";
import chalk from "chalk";
import { Logger } from "../../utils/logger.js";

export interface GeminiFlowConfig {
  version: string;
  profiles: Record<string, ProfileConfig>;
  global: GlobalConfig;
  agents: AgentConfig;
  swarm: SwarmConfig;
  google: GoogleConfig;
}

export interface ProfileConfig {
  name: string;
  description?: string;
  google?: Partial<GoogleConfig>;
  agents?: Partial<AgentConfig>;
  swarm?: Partial<SwarmConfig>;
}

export interface GlobalConfig {
  logLevel: "error" | "warn" | "info" | "debug";
  cacheDir: string;
  dataDir: string;
  tempDir: string;
  parallelExecution: boolean;
  maxConcurrency: number;
  timeout: number;
}

export interface AgentConfig {
  defaultCount: number;
  maxAgents: number;
  spawnTimeout: number;
  heartbeatInterval: number;
  memoryLimit: number;
  types: Record<string, AgentTypeConfig>;
}

export interface AgentTypeConfig {
  name: string;
  description: string;
  capabilities: string[];
  resources: {
    memory: number;
    cpu: number;
  };
}

export interface SwarmConfig {
  defaultTopology: "hierarchical" | "mesh" | "ring" | "star";
  consensusAlgorithm: string;
  coordinationTimeout: number;
  syncInterval: number;
  maxRetries: number;
}

export interface GoogleConfig {
  projectId?: string;
  clientId?: string;
  clientSecret?: string;
  serviceAccountPath?: string;
  region: string;
  models: {
    gemini: {
      version: string;
      maxTokens: number;
    };
    vertex: {
      region: string;
      models: string[];
    };
  };
}

export class ConfigManager {
  private logger: Logger;
  private config: GeminiFlowConfig | null = null;
  private configPath: string;
  private globalOptions: any = {};

  constructor() {
    this.logger = new Logger("ConfigManager");
    this.configPath = join(homedir(), ".gemini-flow", "config.json");
  }

  /**
   * Initialize configuration manager
   */
  async initialize(): Promise<void> {
    try {
      await this.ensureConfigDirectory();
      await this.loadConfig();
    } catch (error) {
      this.logger.error("Failed to initialize configuration:", error);
      throw error;
    }
  }

  /**
   * Load configuration from file or create default
   */
  async loadConfig(): Promise<GeminiFlowConfig> {
    try {
      await access(this.configPath);
      const configContent = await readFile(this.configPath, "utf-8");
      this.config = JSON.parse(configContent);
      this.logger.debug("Configuration loaded from:", this.configPath);
    } catch (error) {
      // Create default configuration if file doesn't exist
      this.logger.info("Creating default configuration...");
      this.config = this.createDefaultConfig();
      await this.saveConfig();
    }

    return this.config!;
  }

  /**
   * Save configuration to file
   */
  async saveConfig(): Promise<void> {
    if (!this.config) {
      throw new Error("No configuration to save");
    }

    try {
      await this.ensureConfigDirectory();
      const configContent = JSON.stringify(this.config, null, 2);
      await writeFile(this.configPath, configContent, "utf-8");
      this.logger.debug("Configuration saved to:", this.configPath);
    } catch (error) {
      this.logger.error("Failed to save configuration:", error);
      throw error;
    }
  }

  /**
   * Get configuration
   */
  getConfig(): GeminiFlowConfig {
    if (!this.config) {
      throw new Error("Configuration not loaded");
    }
    return this.config;
  }

  /**
   * Get profile configuration
   */
  getProfile(profileName: string): ProfileConfig | null {
    if (!this.config) return null;
    return this.config.profiles[profileName] || null;
  }

  /**
   * Set profile configuration
   */
  async setProfile(profileName: string, profile: ProfileConfig): Promise<void> {
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
  async deleteProfile(profileName: string): Promise<void> {
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
  listProfiles(): string[] {
    if (!this.config) return [];
    return Object.keys(this.config.profiles);
  }

  /**
   * Update global configuration
   */
  async updateGlobal(updates: Partial<GlobalConfig>): Promise<void> {
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
  async updateGoogle(updates: Partial<GoogleConfig>): Promise<void> {
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
  async validate(): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];

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
    } catch {
      issues.push(
        `Cache directory not accessible: ${this.config.global.cacheDir}`,
      );
    }

    try {
      await access(this.config.global.dataDir);
    } catch {
      issues.push(
        `Data directory not accessible: ${this.config.global.dataDir}`,
      );
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
  setGlobalOptions(options: any): void {
    this.globalOptions = options;
  }

  /**
   * Get global options
   */
  getGlobalOptions(): any {
    return this.globalOptions;
  }

  /**
   * Create default configuration
   */
  private createDefaultConfig(): GeminiFlowConfig {
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
  private async ensureConfigDirectory(): Promise<void> {
    const configDir = dirname(this.configPath);

    try {
      await access(configDir);
    } catch {
      await mkdir(configDir, { recursive: true });
      this.logger.debug("Created configuration directory:", configDir);
    }
  }

  /**
   * Get configuration file path
   */
  getConfigPath(): string {
    return this.configPath;
  }

  /**
   * Reset configuration to defaults
   */
  async resetToDefaults(): Promise<void> {
    this.config = this.createDefaultConfig();
    await this.saveConfig();
    this.logger.info("Configuration reset to defaults");
  }
}
