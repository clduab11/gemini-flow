/**
 * Lightweight Core System
 *
 * Minimal core implementation that only loads essential features
 * Dynamically loads enterprise features based on feature flags
 */

import { Logger } from "../utils/logger.js";
import { featureFlags, FeatureFlags } from "./feature-flags.js";
import { SimpleAuth } from "./simple-auth.js";
import { EventEmitter } from "node:events";

export interface CoreConfig {
  mode: "minimal" | "enhanced" | "enterprise";
  autoLoad: boolean;
  maxMemory?: number;
  logLevel?: string;
}

export interface AdapterLoader {
  name: string;
  load: () => Promise<any>;
  dependencies: string[];
  optional: boolean;
}

export class LightweightCore extends EventEmitter {
  private logger: Logger;
  private config: CoreConfig;
  private loadedAdapters: Map<string, any> = new Map();
  private adapterLoaders: Map<string, AdapterLoader> = new Map();
  private auth: SimpleAuth;
  private initialized = false;

  // Core statistics
  private stats = {
    startTime: Date.now(),
    memoryUsage: 0,
    loadedFeatures: 0,
    adaptersLoaded: 0,
    requestCount: 0,
  };

  constructor(config: CoreConfig = { mode: "minimal", autoLoad: true }) {
    super();
    this.config = config;
    this.logger = new Logger("LightweightCore");
    this.auth = new SimpleAuth();

    this.setupAdapterLoaders();
    this.updateStats();

    if (config.autoLoad) {
      this.initialize();
    }
  }

  /**
   * Initialize the core system
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    const startTime = performance.now();
    this.logger.info("Initializing Gemini-Flow core system...");

    try {
      // 1. Initialize authentication
      await this.initializeAuth();

      // 2. Load adapters based on feature flags
      await this.loadEnabledAdapters();

      // 3. Setup monitoring
      this.setupMonitoring();

      // 4. Emit initialization complete
      const initTime = performance.now() - startTime;
      this.stats.loadedFeatures = featureFlags.getEnabledFeatures().length;
      this.stats.adaptersLoaded = this.loadedAdapters.size;

      this.logger.info("Core system initialized", {
        mode: this.determineMode(),
        initTime: `${initTime.toFixed(2)}ms`,
        featuresEnabled: this.stats.loadedFeatures,
        adaptersLoaded: this.stats.adaptersLoaded,
        memoryUsage: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB`,
      });

      this.initialized = true;
      this.emit("initialized", this.getStatus());
    } catch (error) {
      this.logger.error("Core initialization failed", error);
      throw error;
    }
  }

  /**
   * Setup adapter loaders for conditional loading
   */
  private setupAdapterLoaders(): void {
    // SQLite adapters
    this.adapterLoaders.set("sqlite", {
      name: "SQLite Memory Adapters",
      dependencies: ["sqlite3", "better-sqlite3"],
      optional: true,
      load: async () => {
        const { SQLiteMemoryManager } = await import(
          "../memory/sqlite-manager.js"
        );
        const { SQLiteConnectionPool } = await import(
          "./sqlite-connection-pool.js"
        );
        return { SQLiteMemoryManager, SQLiteConnectionPool };
      },
    });

    // Vertex AI adapter
    this.adapterLoaders.set("vertexai", {
      name: "Vertex AI Connector",
      dependencies: ["@google-cloud/vertexai", "@google-cloud/aiplatform"],
      optional: true,
      load: async () => {
        const { VertexAIConnector } = await import("./vertex-ai-connector.js");
        return { VertexAIConnector };
      },
    });

    // Google Workspace integration
    this.adapterLoaders.set("workspace", {
      name: "Google Workspace Integration",
      dependencies: ["googleapis", "google-auth-library"],
      optional: true,
      load: async () => {
        const { GoogleWorkspaceIntegration } = await import(
          "../workspace/google-integration.js"
        );
        return { GoogleWorkspaceIntegration };
      },
    });

    // DeepMind adapter
    this.adapterLoaders.set("deepmind", {
      name: "DeepMind Adapter",
      dependencies: ["@deepmind/api"],
      optional: true,
      load: async () => {
        const { DeepMindAdapter } = await import(
          "../adapters/deepmind-adapter.js"
        );
        return { DeepMindAdapter };
      },
    });

    // A2A Protocol
    this.adapterLoaders.set("a2a", {
      name: "A2A Protocol Manager",
      dependencies: [],
      optional: true,
      load: async () => {
        const { A2AProtocolManager } = await import(
          "../protocols/a2a/core/a2a-protocol-manager.js"
        );
        const { A2AMCPBridge } = await import(
          "../protocols/a2a/core/a2a-mcp-bridge.js"
        );
        return { A2AProtocolManager, A2AMCPBridge };
      },
    });

    // MCP Protocol
    this.adapterLoaders.set("mcp", {
      name: "MCP Adapter",
      dependencies: [],
      optional: true,
      load: async () => {
        const { MCPToGeminiAdapter } = await import("./mcp-adapter.js");
        return { MCPToGeminiAdapter };
      },
    });

    // Performance optimization
    this.adapterLoaders.set("performance", {
      name: "Performance Monitor",
      dependencies: [],
      optional: false,
      load: async () => {
        const { PerformanceMonitor } = await import("./performance-monitor.js");
        const { CacheManager } = await import("./cache-manager.js");
        return { PerformanceMonitor, CacheManager };
      },
    });
  }

  /**
   * Initialize authentication
   */
  private async initializeAuth(): Promise<void> {
    // SimpleAuth is initialized in constructor, no separate initialize needed
    this.logger.debug("Authentication ready");
  }

  /**
   * Load adapters based on enabled features
   */
  private async loadEnabledAdapters(): Promise<void> {
    const enabledFeatures = featureFlags.getEnabledFeatures();
    const adapterMap: Record<string, string> = {
      sqliteAdapters: "sqlite",
      vertexAi: "vertexai",
      googleWorkspace: "workspace",
      deepmind: "deepmind",
      a2aProtocol: "a2a",
      mcpProtocol: "mcp",
    };

    // Always load performance monitoring
    await this.loadAdapter("performance");

    // Load feature-specific adapters
    for (const feature of enabledFeatures) {
      const adapterKey = adapterMap[feature];
      if (adapterKey) {
        await this.loadAdapter(adapterKey);
      }
    }
  }

  /**
   * Load a specific adapter
   */
  private async loadAdapter(adapterKey: string): Promise<boolean> {
    const loader = this.adapterLoaders.get(adapterKey);
    if (!loader) {
      this.logger.warn(`Unknown adapter: ${adapterKey}`);
      return false;
    }

    if (this.loadedAdapters.has(adapterKey)) {
      this.logger.debug(`Adapter already loaded: ${loader.name}`);
      return true;
    }

    try {
      const startTime = performance.now();
      this.logger.debug(`Loading adapter: ${loader.name}...`);

      const adapter = await loader.load();
      this.loadedAdapters.set(adapterKey, adapter);

      const loadTime = performance.now() - startTime;
      this.logger.info(`Adapter loaded: ${loader.name}`, {
        loadTime: `${loadTime.toFixed(2)}ms`,
        memoryIncrease: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB`,
      });

      this.emit("adapter_loaded", {
        name: loader.name,
        key: adapterKey,
        loadTime,
      });
      return true;
    } catch (error) {
      if (!loader.optional) {
        this.logger.error(
          `Failed to load required adapter: ${loader.name}`,
          error,
        );
        throw error;
      } else {
        this.logger.warn(
          `Failed to load optional adapter: ${loader.name}`,
          error.message,
        );
        return false;
      }
    }
  }

  /**
   * Get a loaded adapter
   */
  getAdapter<T = any>(adapterKey: string): T | null {
    return this.loadedAdapters.get(adapterKey) || null;
  }

  /**
   * Check if an adapter is loaded
   */
  hasAdapter(adapterKey: string): boolean {
    return this.loadedAdapters.has(adapterKey);
  }

  /**
   * Load an adapter on demand
   */
  async loadAdapterOnDemand(adapterKey: string): Promise<boolean> {
    if (this.hasAdapter(adapterKey)) {
      return true;
    }

    // Check if feature is enabled
    const allConfigs = featureFlags.getAllFeatureConfigs();
    const featureMap: Record<string, keyof typeof allConfigs> = {
      sqlite: "sqliteAdapters",
      vertexai: "vertexAi",
      workspace: "googleWorkspace",
      deepmind: "deepmind",
      a2a: "a2aProtocol",
      mcp: "mcpProtocol",
    };

    const feature = featureMap[adapterKey];
    if (feature && !featureFlags.isEnabled(feature)) {
      this.logger.warn(
        `Cannot load adapter ${adapterKey}: feature ${feature} is disabled`,
      );
      return false;
    }

    return await this.loadAdapter(adapterKey);
  }

  /**
   * Setup system monitoring
   */
  private setupMonitoring(): void {
    // Memory monitoring
    if (this.config.maxMemory) {
      setInterval(() => {
        const memUsage = process.memoryUsage().heapUsed / 1024 / 1024;
        if (memUsage > this.config.maxMemory!) {
          this.logger.warn(
            `Memory usage high: ${memUsage.toFixed(2)}MB (limit: ${this.config.maxMemory}MB)`,
          );
          this.emit("memory_warning", {
            usage: memUsage,
            limit: this.config.maxMemory,
          });
        }
      }, 30000); // Check every 30 seconds
    }

    // Update stats periodically
    setInterval(() => {
      this.updateStats();
    }, 10000); // Update every 10 seconds
  }

  /**
   * Update system statistics
   */
  private updateStats(): void {
    const memUsage = process.memoryUsage();
    this.stats.memoryUsage = memUsage.heapUsed / 1024 / 1024;
    this.stats.loadedFeatures = featureFlags.getEnabledFeatures().length;
    this.stats.adaptersLoaded = this.loadedAdapters.size;
  }

  /**
   * Determine current mode
   */
  private determineMode(): string {
    if (featureFlags.isEnterpriseMode()) {
      return "enterprise";
    } else if (featureFlags.isEnhancedMode()) {
      return "enhanced";
    } else {
      return "minimal";
    }
  }

  /**
   * Get system status
   */
  getStatus(): any {
    this.updateStats();

    return {
      mode: this.determineMode(),
      initialized: this.initialized,
      uptime: Date.now() - this.stats.startTime,
      memory: {
        used: `${this.stats.memoryUsage.toFixed(2)}MB`,
        limit: this.config.maxMemory
          ? `${this.config.maxMemory}MB`
          : "unlimited",
      },
      features: {
        enabled: featureFlags.getEnabledFeatures(),
        total: Object.keys(featureFlags.getAllFeatureConfigs()).length,
      },
      adapters: {
        loaded: Array.from(this.loadedAdapters.keys()),
        available: Array.from(this.adapterLoaders.keys()),
        count: this.loadedAdapters.size,
      },
      requests: this.stats.requestCount,
      auth: this.auth.isAuthenticated(),
    };
  }

  /**
   * Get lightweight status (minimal info)
   */
  getLightweightStatus(): any {
    return {
      mode: this.determineMode(),
      uptime: Date.now() - this.stats.startTime,
      memory: `${this.stats.memoryUsage.toFixed(2)}MB`,
      features: this.stats.loadedFeatures,
      adapters: this.stats.adaptersLoaded,
      auth: this.auth.isAuthenticated(),
    };
  }

  /**
   * Enable a feature dynamically
   */
  async enableFeature(
    feature: keyof ReturnType<typeof featureFlags.getAllFeatureConfigs>,
  ): Promise<boolean> {
    if (featureFlags.isEnabled(feature)) {
      this.logger.debug(`Feature already enabled: ${feature}`);
      return true;
    }

    try {
      featureFlags.enable(feature);

      // Load associated adapter if available
      const adapterMap: Record<string, string> = {
        sqliteAdapters: "sqlite",
        vertexAi: "vertexai",
        googleWorkspace: "workspace",
        deepmind: "deepmind",
        a2aProtocol: "a2a",
        mcpProtocol: "mcp",
      };

      const adapterKey = adapterMap[feature];
      if (adapterKey) {
        await this.loadAdapter(adapterKey);
      }

      this.logger.info(`Feature enabled: ${feature}`);
      this.emit("feature_enabled", { feature, hasAdapter: !!adapterKey });

      return true;
    } catch (error) {
      this.logger.error(`Failed to enable feature: ${feature}`, error);
      return false;
    }
  }

  /**
   * Disable a feature dynamically
   */
  disableFeature(
    feature: keyof ReturnType<typeof featureFlags.getAllFeatureConfigs>,
  ): void {
    featureFlags.disable(feature);
    this.logger.info(`Feature disabled: ${feature}`);
    this.emit("feature_disabled", { feature });
  }

  /**
   * Get authentication instance
   */
  getAuth(): SimpleAuth {
    return this.auth;
  }

  /**
   * Increment request counter
   */
  incrementRequestCount(): void {
    this.stats.requestCount++;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<any> {
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      core: this.getLightweightStatus(),
      issues: [] as string[],
    };

    // Check memory usage
    if (
      this.config.maxMemory &&
      this.stats.memoryUsage > this.config.maxMemory * 0.9
    ) {
      health.issues.push("High memory usage");
      health.status = "warning";
    }

    // Check adapters
    for (const [key, loader] of this.adapterLoaders) {
      if (!loader.optional && !this.hasAdapter(key)) {
        health.issues.push(`Required adapter not loaded: ${loader.name}`);
        health.status = "unhealthy";
      }
    }

    // Check authentication
    if (!this.auth.isAuthenticated()) {
      health.issues.push("Authentication not configured");
      health.status = "warning";
    }

    return health;
  }

  /**
   * Shutdown the core system
   */
  async shutdown(): Promise<void> {
    this.logger.info("Shutting down core system...");

    // Shutdown adapters
    for (const [key, adapter] of this.loadedAdapters) {
      try {
        if (adapter.shutdown) {
          await adapter.shutdown();
        }
      } catch (error) {
        this.logger.warn(`Error shutting down adapter ${key}:`, error.message);
      }
    }

    this.loadedAdapters.clear();
    this.initialized = false;

    this.emit("shutdown");
    this.logger.info("Core system shutdown complete");
  }
}

// Export singleton instance
let coreInstance: LightweightCore | null = null;

export function getCore(config?: CoreConfig): LightweightCore {
  if (!coreInstance) {
    coreInstance = new LightweightCore(config);
  }
  return coreInstance;
}

export function resetCore(): void {
  if (coreInstance) {
    coreInstance.shutdown();
    coreInstance = null;
  }
}
