/**
 * Feature Flags System
 *
 * Lightweight feature flag system for conditional enterprise feature loading
 * Supports runtime detection, environment variables, and config-based activation
 */
export interface FeatureConfig {
    enabled: boolean;
    mode: "auto" | "manual" | "disabled";
    dependencies?: string[];
    fallback?: boolean;
    experimental?: boolean;
}
export interface FeatureFlagConfig {
    sqliteAdapters: FeatureConfig;
    vertexAi: FeatureConfig;
    googleWorkspace: FeatureConfig;
    deepmind: FeatureConfig;
    a2aProtocol: FeatureConfig;
    mcpProtocol: FeatureConfig;
    quantumHybrid: FeatureConfig;
    neuralPatterns: FeatureConfig;
    swarmOrchestration: FeatureConfig;
    distributedMemory: FeatureConfig;
    wasmOptimization: FeatureConfig;
    connectionPooling: FeatureConfig;
    caching: FeatureConfig;
}
export declare class FeatureFlags {
    private logger;
    private config;
    private packageJson;
    private runtimeChecks;
    private static readonly DEFAULT_CONFIG;
    constructor();
    /**
     * Load package.json information
     */
    private loadPackageInfo;
    /**
     * Find package.json in the directory tree
     */
    private findPackageJson;
    /**
     * Load configuration from multiple sources
     */
    private loadConfiguration;
    /**
     * Load configuration from environment variables
     */
    private loadFromEnvironment;
    /**
     * Load configuration from config file
     */
    private loadFromConfigFile;
    /**
     * Load configuration from package.json
     */
    private loadFromPackageJson;
    /**
     * Perform runtime dependency and capability checks
     */
    private performRuntimeChecks;
    /**
     * Check if a dependency is available
     */
    private checkDependency;
    /**
     * Check system capability
     */
    private checkSystemCapability;
    /**
     * Check Node.js capability
     */
    private checkNodeCapability;
    /**
     * Apply auto-detection results to configuration
     */
    private applyAutoDetection;
    /**
     * Check if a feature is enabled
     */
    isEnabled(feature: keyof FeatureFlagConfig): boolean;
    /**
     * Enable a feature manually
     */
    enable(feature: keyof FeatureFlagConfig): void;
    /**
     * Disable a feature manually
     */
    disable(feature: keyof FeatureFlagConfig): void;
    /**
     * Get feature configuration
     */
    getFeatureConfig(feature: keyof FeatureFlagConfig): FeatureConfig | undefined;
    /**
     * Get all feature configurations
     */
    getAllFeatureConfigs(): FeatureFlagConfig;
    /**
     * Get all enabled features
     */
    getEnabledFeatures(): Array<keyof FeatureFlagConfig>;
    /**
     * Get feature status report
     */
    getStatusReport(): any;
    /**
     * Check if in enterprise mode
     */
    isEnterpriseMode(): boolean;
    /**
     * Check if in enhanced mode (A2A/MCP)
     */
    isEnhancedMode(): boolean;
    /**
     * Reset all features to default
     */
    reset(): void;
    /**
     * Save current configuration to file
     */
    saveConfiguration(): void;
    /**
     * Get singleton instance
     */
    private static instance;
    static getInstance(): FeatureFlags;
}
export declare const featureFlags: FeatureFlags;
//# sourceMappingURL=feature-flags.d.ts.map