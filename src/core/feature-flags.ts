/**
 * Feature Flags System
 *
 * Lightweight feature flag system for conditional enterprise feature loading
 * Supports runtime detection, environment variables, and config-based activation
 */

import { Logger } from "../utils/logger.js";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

export interface FeatureConfig {
  enabled: boolean;
  mode: "auto" | "manual" | "disabled";
  dependencies?: string[];
  fallback?: boolean;
  experimental?: boolean;
}

export interface FeatureFlagConfig {
  // Enterprise adapters
  sqliteAdapters: FeatureConfig;
  vertexAi: FeatureConfig;
  googleWorkspace: FeatureConfig;
  deepmind: FeatureConfig;

  // Protocols
  a2aProtocol: FeatureConfig;
  mcpProtocol: FeatureConfig;

  // Advanced features
  quantumHybrid: FeatureConfig;
  neuralPatterns: FeatureConfig;
  swarmOrchestration: FeatureConfig;
  distributedMemory: FeatureConfig;

  // Performance features
  wasmOptimization: FeatureConfig;
  connectionPooling: FeatureConfig;
  caching: FeatureConfig;
}

export class FeatureFlags {
  private logger: Logger;
  private config: FeatureFlagConfig;
  private packageJson: any;
  private runtimeChecks: Map<string, boolean> = new Map();

  // Default lightweight configuration
  private static readonly DEFAULT_CONFIG: FeatureFlagConfig = {
    // Enterprise adapters - disabled by default
    sqliteAdapters: { enabled: false, mode: "auto", fallback: true },
    vertexAi: {
      enabled: false,
      mode: "auto",
      dependencies: ["@google-cloud/vertexai"],
    },
    googleWorkspace: {
      enabled: false,
      mode: "auto",
      dependencies: ["googleapis"],
    },
    deepmind: { enabled: false, mode: "auto", dependencies: ["@deepmind/api"] },

    // Protocols - auto-detect
    a2aProtocol: { enabled: false, mode: "auto" },
    mcpProtocol: { enabled: false, mode: "auto" },

    // Advanced features - experimental
    quantumHybrid: { enabled: false, mode: "manual", experimental: true },
    neuralPatterns: { enabled: false, mode: "auto", experimental: true },
    swarmOrchestration: { enabled: false, mode: "auto" },
    distributedMemory: { enabled: false, mode: "auto" },

    // Performance features - auto-enable
    wasmOptimization: { enabled: true, mode: "auto" },
    connectionPooling: { enabled: true, mode: "auto" },
    caching: { enabled: true, mode: "auto" },
  };

  constructor() {
    this.logger = new Logger("FeatureFlags");
    this.loadPackageInfo();
    this.config = this.loadConfiguration();
    this.performRuntimeChecks();
  }

  /**
   * Load package.json information
   */
  private loadPackageInfo(): void {
    try {
      const packagePath = this.findPackageJson();
      if (packagePath && existsSync(packagePath)) {
        this.packageJson = JSON.parse(readFileSync(packagePath, "utf8"));
      }
    } catch (error) {
      this.logger.warn("Could not load package.json", error);
      this.packageJson = {};
    }
  }

  /**
   * Find package.json in the directory tree
   */
  private findPackageJson(): string | null {
    let currentDir = process.cwd();
    const root = "/";

    while (currentDir !== root) {
      const packagePath = join(currentDir, "package.json");
      if (existsSync(packagePath)) {
        return packagePath;
      }
      currentDir = join(currentDir, "..");
    }

    return null;
  }

  /**
   * Load configuration from multiple sources
   */
  private loadConfiguration(): FeatureFlagConfig {
    const config = { ...FeatureFlags.DEFAULT_CONFIG };

    // 1. Load from environment variables
    this.loadFromEnvironment(config);

    // 2. Load from config file
    this.loadFromConfigFile(config);

    // 3. Load from package.json
    this.loadFromPackageJson(config);

    return config;
  }

  /**
   * Load configuration from environment variables
   */
  private loadFromEnvironment(config: FeatureFlagConfig): void {
    const envPrefix = "GEMINI_FLOW_";

    Object.keys(config).forEach((feature) => {
      const envVar = `${envPrefix}${feature.toUpperCase()}`;
      const value = process.env[envVar];

      if (value !== undefined) {
        const featureConfig = config[feature as keyof FeatureFlagConfig];

        if (value === "true" || value === "1") {
          featureConfig.enabled = true;
          featureConfig.mode = "manual";
        } else if (value === "false" || value === "0") {
          featureConfig.enabled = false;
          featureConfig.mode = "disabled";
        } else if (value === "auto") {
          featureConfig.mode = "auto";
        }
      }
    });
  }

  /**
   * Load configuration from config file
   */
  private loadFromConfigFile(config: FeatureFlagConfig): void {
    try {
      const configPath = join(process.cwd(), ".gemini-flow-features.json");
      if (existsSync(configPath)) {
        const fileConfig = JSON.parse(readFileSync(configPath, "utf8"));
        Object.assign(config, fileConfig);
        this.logger.info("Loaded feature configuration from file");
      }
    } catch (error) {
      this.logger.debug("No feature config file found (optional)");
    }
  }

  /**
   * Load configuration from package.json
   */
  private loadFromPackageJson(config: FeatureFlagConfig): void {
    if (this.packageJson?.geminiFlow?.features) {
      Object.assign(config, this.packageJson.geminiFlow.features);
      this.logger.info("Loaded feature configuration from package.json");
    }
  }

  /**
   * Perform runtime dependency and capability checks
   */
  private performRuntimeChecks(): void {
    // Check for enterprise dependencies
    this.checkDependency("sqliteAdapters", ["sqlite3", "better-sqlite3"]);
    this.checkDependency("vertexAi", [
      "@google-cloud/vertexai",
      "@google-cloud/aiplatform",
    ]);
    this.checkDependency("googleWorkspace", [
      "googleapis",
      "google-auth-library",
    ]);
    this.checkDependency("deepmind", ["@deepmind/api"]);

    // Check for system capabilities
    this.checkSystemCapability("wasmOptimization", () => {
      return (
        typeof globalThis !== "undefined" &&
        typeof (globalThis as any).WebAssembly !== "undefined" &&
        (globalThis as any).WebAssembly.validate
      );
    });

    // Check for Node.js features
    this.checkNodeCapability("connectionPooling", () => {
      return parseInt(process.version.substring(1)) >= 18;
    });

    // Apply auto-detection results
    this.applyAutoDetection();
  }

  /**
   * Check if a dependency is available
   */
  private checkDependency(
    feature: keyof FeatureFlagConfig,
    deps: string[],
  ): void {
    const hasAnyDep = deps.some((dep) => {
      try {
        require.resolve(dep);
        return true;
      } catch {
        return false;
      }
    });

    this.runtimeChecks.set(feature, hasAnyDep);

    if (hasAnyDep) {
      this.logger.debug(
        `Dependency available for ${feature}:`,
        deps.find((dep) => {
          try {
            require.resolve(dep);
            return true;
          } catch {
            return false;
          }
        }),
      );
    }
  }

  /**
   * Check system capability
   */
  private checkSystemCapability(
    feature: keyof FeatureFlagConfig,
    check: () => boolean,
  ): void {
    try {
      const available = check();
      this.runtimeChecks.set(feature, available);
      this.logger.debug(`System capability ${feature}:`, available);
    } catch (error) {
      this.runtimeChecks.set(feature, false);
      this.logger.debug(
        `System capability ${feature} check failed:`,
        error.message,
      );
    }
  }

  /**
   * Check Node.js capability
   */
  private checkNodeCapability(
    feature: keyof FeatureFlagConfig,
    check: () => boolean,
  ): void {
    try {
      const available = check();
      this.runtimeChecks.set(feature, available);
      this.logger.debug(`Node capability ${feature}:`, available);
    } catch (error) {
      this.runtimeChecks.set(feature, false);
    }
  }

  /**
   * Apply auto-detection results to configuration
   */
  private applyAutoDetection(): void {
    Object.keys(this.config).forEach((feature) => {
      const featureConfig = this.config[feature as keyof FeatureFlagConfig];

      if (featureConfig.mode === "auto") {
        const runtimeAvailable = this.runtimeChecks.get(feature) ?? false;
        featureConfig.enabled = runtimeAvailable;

        this.logger.debug(`Auto-detected ${feature}:`, featureConfig.enabled);
      }
    });
  }

  /**
   * Check if a feature is enabled
   */
  isEnabled(feature: keyof FeatureFlagConfig): boolean {
    const featureConfig = this.config[feature];

    if (!featureConfig) {
      this.logger.warn(`Unknown feature flag: ${feature}`);
      return false;
    }

    if (featureConfig.mode === "disabled") {
      return false;
    }

    return featureConfig.enabled;
  }

  /**
   * Enable a feature manually
   */
  enable(feature: keyof FeatureFlagConfig): void {
    const featureConfig = this.config[feature];
    if (featureConfig) {
      featureConfig.enabled = true;
      featureConfig.mode = "manual";
      this.logger.info(`Manually enabled feature: ${feature}`);
    }
  }

  /**
   * Disable a feature manually
   */
  disable(feature: keyof FeatureFlagConfig): void {
    const featureConfig = this.config[feature];
    if (featureConfig) {
      featureConfig.enabled = false;
      featureConfig.mode = "disabled";
      this.logger.info(`Manually disabled feature: ${feature}`);
    }
  }

  /**
   * Get feature configuration
   */
  getFeatureConfig(
    feature: keyof FeatureFlagConfig,
  ): FeatureConfig | undefined {
    return this.config[feature];
  }

  /**
   * Get all feature configurations
   */
  getAllFeatureConfigs(): FeatureFlagConfig {
    return { ...this.config };
  }

  /**
   * Get all enabled features
   */
  getEnabledFeatures(): Array<keyof FeatureFlagConfig> {
    return Object.keys(this.config).filter((feature) =>
      this.isEnabled(feature as keyof FeatureFlagConfig),
    ) as Array<keyof FeatureFlagConfig>;
  }

  /**
   * Get feature status report
   */
  getStatusReport(): any {
    const report = {
      mode: "lightweight",
      enabledFeatures: this.getEnabledFeatures(),
      disabledFeatures: [] as string[],
      experimentalFeatures: [] as string[],
      dependencyStatus: {} as Record<string, boolean>,
    };

    Object.keys(this.config).forEach((feature) => {
      const featureConfig = this.config[feature as keyof FeatureFlagConfig];
      const isEnabled = this.isEnabled(feature as keyof FeatureFlagConfig);

      if (!isEnabled) {
        report.disabledFeatures.push(feature);
      }

      if (featureConfig.experimental) {
        report.experimentalFeatures.push(feature);
      }

      report.dependencyStatus[feature] =
        this.runtimeChecks.get(feature) ?? false;
    });

    // Determine overall mode
    if (
      report.enabledFeatures.some((f) =>
        ["vertexAi", "googleWorkspace", "deepmind"].includes(f),
      )
    ) {
      report.mode = "enterprise";
    } else if (
      report.enabledFeatures.some((f) =>
        ["a2aProtocol", "mcpProtocol"].includes(f),
      )
    ) {
      report.mode = "enhanced";
    }

    return report;
  }

  /**
   * Check if in enterprise mode
   */
  isEnterpriseMode(): boolean {
    return (
      this.isEnabled("vertexAi") ||
      this.isEnabled("googleWorkspace") ||
      this.isEnabled("deepmind") ||
      this.isEnabled("sqliteAdapters")
    );
  }

  /**
   * Check if in enhanced mode (A2A/MCP)
   */
  isEnhancedMode(): boolean {
    return this.isEnabled("a2aProtocol") || this.isEnabled("mcpProtocol");
  }

  /**
   * Reset all features to default
   */
  reset(): void {
    this.config = { ...FeatureFlags.DEFAULT_CONFIG };
    this.performRuntimeChecks();
    this.logger.info("Feature flags reset to defaults");
  }

  /**
   * Save current configuration to file
   */
  saveConfiguration(): void {
    try {
      const configPath = join(process.cwd(), ".gemini-flow-features.json");
      const configToSave = Object.fromEntries(
        Object.entries(this.config).filter(
          ([, config]) => config.mode === "manual",
        ),
      );

      require("fs").writeFileSync(
        configPath,
        JSON.stringify(configToSave, null, 2),
      );
      this.logger.info("Feature configuration saved");
    } catch (error) {
      this.logger.error("Failed to save feature configuration", error);
    }
  }

  /**
   * Get singleton instance
   */
  private static instance: FeatureFlags;

  static getInstance(): FeatureFlags {
    if (!FeatureFlags.instance) {
      FeatureFlags.instance = new FeatureFlags();
    }
    return FeatureFlags.instance;
  }
}

// Export singleton instance
export const featureFlags = FeatureFlags.getInstance();
