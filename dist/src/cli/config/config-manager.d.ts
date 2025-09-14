/**
 * Configuration Manager for Gemini-Flow CLI
 * Handles configuration loading, validation, and management
 */
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
export declare class ConfigManager {
    private logger;
    private config;
    private configPath;
    private globalOptions;
    constructor();
    /**
     * Initialize configuration manager
     */
    initialize(): Promise<void>;
    /**
     * Load configuration from file or create default
     */
    loadConfig(): Promise<GeminiFlowConfig>;
    /**
     * Save configuration to file
     */
    saveConfig(): Promise<void>;
    /**
     * Get configuration
     */
    getConfig(): GeminiFlowConfig;
    /**
     * Get profile configuration
     */
    getProfile(profileName: string): ProfileConfig | null;
    /**
     * Set profile configuration
     */
    setProfile(profileName: string, profile: ProfileConfig): Promise<void>;
    /**
     * Delete profile
     */
    deleteProfile(profileName: string): Promise<void>;
    /**
     * List all profiles
     */
    listProfiles(): string[];
    /**
     * Update global configuration
     */
    updateGlobal(updates: Partial<GlobalConfig>): Promise<void>;
    /**
     * Update Google configuration
     */
    updateGoogle(updates: Partial<GoogleConfig>): Promise<void>;
    /**
     * Validate configuration
     */
    validate(): Promise<{
        valid: boolean;
        issues: string[];
    }>;
    /**
     * Set global options from CLI
     */
    setGlobalOptions(options: any): void;
    /**
     * Get global options
     */
    getGlobalOptions(): any;
    /**
     * Create default configuration
     */
    private createDefaultConfig;
    /**
     * Ensure configuration directory exists
     */
    private ensureConfigDirectory;
    /**
     * Get configuration file path
     */
    getConfigPath(): string;
    /**
     * Reset configuration to defaults
     */
    resetToDefaults(): Promise<void>;
}
//# sourceMappingURL=config-manager.d.ts.map