/**
 * Dynamic Adapter Loader
 *
 * Loads enterprise adapters conditionally based on feature flags and dependencies
 * Provides fallback mechanisms and graceful degradation
 */

import { Logger } from "../utils/logger.js";
import { featureFlags } from "../core/feature-flags.js";
import { EventEmitter } from "events";

export interface AdapterSpec {
  name: string;
  key: string;
  modulePath: string;
  className: string;
  dependencies: string[];
  featureFlag: string;
  fallback?: AdapterSpec;
  required: boolean;
  experimental?: boolean;
}

export interface LoadedAdapter {
  spec: AdapterSpec;
  instance: any;
  loadTime: number;
  loadedAt: Date;
  status: "loaded" | "failed" | "fallback";
  error?: string;
}

export class DynamicAdapterLoader extends EventEmitter {
  private logger: Logger;
  private loadedAdapters: Map<string, LoadedAdapter> = new Map();
  private adapterSpecs: Map<string, AdapterSpec> = new Map();
  private loadingPromises: Map<string, Promise<LoadedAdapter | null>> =
    new Map();

  constructor() {
    super();
    this.logger = new Logger("DynamicAdapterLoader");
    this.setupAdapterSpecs();
  }

  /**
   * Setup adapter specifications
   */
  private setupAdapterSpecs(): void {
    const adapters: AdapterSpec[] = [
      // Gemini adapter (always available)
      {
        name: "Gemini Adapter",
        key: "gemini",
        modulePath: "./gemini-adapter.js",
        className: "GeminiAdapter",
        dependencies: ["@google/generative-ai"],
        featureFlag: "caching", // Always enabled
        required: true,
      },

      // Vertex AI adapter
      {
        name: "Vertex AI Adapter",
        key: "vertexai",
        modulePath: "../core/vertex-ai-connector.js",
        className: "VertexAIConnector",
        dependencies: ["@google-cloud/vertexai", "@google-cloud/aiplatform"],
        featureFlag: "vertexAi",
        required: false,
        fallback: {
          name: "Vertex AI Fallback",
          key: "vertexai-fallback",
          modulePath: "./gemini-adapter.js",
          className: "GeminiAdapter",
          dependencies: ["@google/generative-ai"],
          featureFlag: "caching",
          required: false,
        },
      },

      // DeepMind adapter
      {
        name: "DeepMind Adapter",
        key: "deepmind",
        modulePath: "./deepmind-adapter.js",
        className: "DeepMindAdapter",
        dependencies: ["@deepmind/api"],
        featureFlag: "deepmind",
        required: false,
        experimental: true,
      },

      // Google Workspace adapter
      {
        name: "Google Workspace Adapter",
        key: "workspace",
        modulePath: "../workspace/google-integration.js",
        className: "GoogleWorkspaceIntegration",
        dependencies: ["googleapis", "google-auth-library"],
        featureFlag: "googleWorkspace",
        required: false,
      },

      // SQLite memory adapter
      {
        name: "SQLite Memory Adapter",
        key: "sqlite",
        modulePath: "../memory/sqlite-manager.js",
        className: "SQLiteManager",
        dependencies: ["sqlite3", "better-sqlite3"],
        featureFlag: "sqliteAdapters",
        required: false,
        fallback: {
          name: "In-Memory Fallback",
          key: "memory-fallback",
          modulePath: "../memory/index.js",
          className: "MemoryManager",
          dependencies: [],
          featureFlag: "caching",
          required: false,
        },
      },

      // JULES workflow adapter
      {
        name: "JULES Workflow Adapter",
        key: "jules",
        modulePath: "./jules-workflow-adapter.js",
        className: "JulesWorkflowAdapter",
        dependencies: [],
        featureFlag: "caching", // Always available
        required: false,
      },
    ];

    for (const adapter of adapters) {
      this.adapterSpecs.set(adapter.key, adapter);
    }
  }

  /**
   * Load an adapter by key
   */
  async loadAdapter(
    key: string,
    forceReload = false,
  ): Promise<LoadedAdapter | null> {
    const spec = this.adapterSpecs.get(key);
    if (!spec) {
      this.logger.error(`Unknown adapter: ${key}`);
      return null;
    }

    // Return existing if already loaded
    if (!forceReload && this.loadedAdapters.has(key)) {
      return this.loadedAdapters.get(key)!;
    }

    // Return existing loading promise to prevent duplicate loads
    if (this.loadingPromises.has(key)) {
      return await this.loadingPromises.get(key)!;
    }

    // Create loading promise
    const loadingPromise = this.performLoad(spec);
    this.loadingPromises.set(key, loadingPromise);

    try {
      const result = await loadingPromise;
      this.loadingPromises.delete(key);
      return result;
    } catch (error) {
      this.loadingPromises.delete(key);
      throw error;
    }
  }

  /**
   * Perform the actual adapter loading
   */
  private async performLoad(spec: AdapterSpec): Promise<LoadedAdapter | null> {
    const startTime = performance.now();

    this.logger.info(`Loading adapter: ${spec.name}...`);

    // Check if feature is enabled
    if (!featureFlags.isEnabled(spec.featureFlag as any)) {
      this.logger.debug(
        `Adapter ${spec.name} disabled by feature flag: ${spec.featureFlag}`,
      );

      if (spec.required) {
        throw new Error(`Required adapter ${spec.name} is disabled`);
      }

      return null;
    }

    // Check dependencies
    const dependencyCheck = this.checkDependencies(spec);
    if (!dependencyCheck.available) {
      this.logger.warn(
        `Dependencies missing for ${spec.name}:`,
        dependencyCheck.missing,
      );

      // Try fallback
      if (spec.fallback) {
        this.logger.info(`Attempting fallback for ${spec.name}...`);
        return await this.loadFallback(spec);
      }

      if (spec.required) {
        throw new Error(
          `Required dependencies missing for ${spec.name}: ${dependencyCheck.missing.join(", ")}`,
        );
      }

      return null;
    }

    try {
      // Load the module
      const module = await import(spec.modulePath);
      const AdapterClass = module[spec.className];

      if (!AdapterClass) {
        throw new Error(
          `Class ${spec.className} not found in ${spec.modulePath}`,
        );
      }

      // Create instance
      const instance = new AdapterClass();

      // Initialize if needed
      if (instance.initialize && typeof instance.initialize === "function") {
        await instance.initialize();
      }

      const loadTime = performance.now() - startTime;
      const loadedAdapter: LoadedAdapter = {
        spec,
        instance,
        loadTime,
        loadedAt: new Date(),
        status: "loaded",
      };

      this.loadedAdapters.set(spec.key, loadedAdapter);

      this.logger.info(`Adapter loaded: ${spec.name}`, {
        loadTime: `${loadTime.toFixed(2)}ms`,
        memoryUsage: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB`,
      });

      this.emit("adapter_loaded", {
        key: spec.key,
        name: spec.name,
        loadTime,
        experimental: spec.experimental,
      });

      return loadedAdapter;
    } catch (error) {
      this.logger.error(`Failed to load adapter ${spec.name}:`, error);

      // Try fallback
      if (spec.fallback) {
        return await this.loadFallback(spec);
      }

      const loadTime = performance.now() - startTime;
      const failedAdapter: LoadedAdapter = {
        spec,
        instance: null,
        loadTime,
        loadedAt: new Date(),
        status: "failed",
        error: error.message,
      };

      this.loadedAdapters.set(spec.key, failedAdapter);

      if (spec.required) {
        throw error;
      }

      this.emit("adapter_failed", {
        key: spec.key,
        name: spec.name,
        error: error.message,
        loadTime,
      });

      return failedAdapter;
    }
  }

  /**
   * Load fallback adapter
   */
  private async loadFallback(
    originalSpec: AdapterSpec,
  ): Promise<LoadedAdapter | null> {
    if (!originalSpec.fallback) {
      return null;
    }

    this.logger.info(
      `Loading fallback for ${originalSpec.name}: ${originalSpec.fallback.name}`,
    );

    try {
      const fallbackResult = await this.performLoad(originalSpec.fallback);

      if (fallbackResult && fallbackResult.status === "loaded") {
        // Mark as fallback and use original key
        fallbackResult.status = "fallback";
        this.loadedAdapters.set(originalSpec.key, fallbackResult);

        this.emit("adapter_fallback", {
          originalKey: originalSpec.key,
          originalName: originalSpec.name,
          fallbackKey: originalSpec.fallback.key,
          fallbackName: originalSpec.fallback.name,
        });

        return fallbackResult;
      }

      return null;
    } catch (error) {
      this.logger.error(
        `Fallback loading failed for ${originalSpec.name}:`,
        error,
      );
      return null;
    }
  }

  /**
   * Check if dependencies are available
   */
  private checkDependencies(spec: AdapterSpec): {
    available: boolean;
    missing: string[];
  } {
    const missing: string[] = [];

    for (const dep of spec.dependencies) {
      try {
        require.resolve(dep);
      } catch {
        // Check if it's available in the package.json
        try {
          const fs = await import("fs");
          const path = await import("path");
          const packageJsonPath = path.join(process.cwd(), "package.json");
          const packageJsonContent = await fs.promises.readFile(packageJsonPath, 'utf-8');
          const packageJson = JSON.parse(packageJsonContent);
          const allDeps = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies,
            ...packageJson.peerDependencies,
            ...packageJson.optionalDependencies,
          };

          if (!allDeps[dep]) {
            missing.push(dep);
          }
        } catch {
          missing.push(dep);
        }
      }
    }

    return {
      available: missing.length === 0,
      missing,
    };
  }

  /**
   * Load all enabled adapters
   */
  async loadEnabledAdapters(): Promise<Map<string, LoadedAdapter>> {
    const loaded = new Map<string, LoadedAdapter>();

    for (const [key, spec] of this.adapterSpecs) {
      // Load if feature is enabled or adapter is required
      if (featureFlags.isEnabled(spec.featureFlag as any) || spec.required) {
        try {
          const adapter = await this.loadAdapter(key);
          if (adapter && adapter.status !== "failed") {
            loaded.set(key, adapter);
          }
        } catch (error) {
          this.logger.warn(`Failed to load adapter ${key}:`, error.message);
        }
      }
    }

    this.logger.info(`Loaded ${loaded.size} adapters`, {
      loaded: Array.from(loaded.keys()),
      total: this.adapterSpecs.size,
    });

    return loaded;
  }

  /**
   * Get a loaded adapter instance
   */
  getAdapter<T = any>(key: string): T | null {
    const loaded = this.loadedAdapters.get(key);
    if (loaded && loaded.status !== "failed") {
      return loaded.instance;
    }
    return null;
  }

  /**
   * Check if adapter is loaded
   */
  isLoaded(key: string): boolean {
    const loaded = this.loadedAdapters.get(key);
    return loaded ? loaded.status !== "failed" : false;
  }

  /**
   * Check if adapter is available but not loaded
   */
  isAvailable(key: string): boolean {
    const spec = this.adapterSpecs.get(key);
    if (!spec) return false;

    if (!featureFlags.isEnabled(spec.featureFlag as any)) return false;

    return this.checkDependencies(spec).available;
  }

  /**
   * Get adapter status
   */
  getAdapterStatus(key: string): any {
    const spec = this.adapterSpecs.get(key);
    const loaded = this.loadedAdapters.get(key);

    if (!spec) {
      return { status: "unknown", key };
    }

    const deps = this.checkDependencies(spec);

    return {
      key,
      name: spec.name,
      required: spec.required,
      experimental: spec.experimental,
      featureEnabled: featureFlags.isEnabled(spec.featureFlag as any),
      dependenciesAvailable: deps.available,
      missingDependencies: deps.missing,
      loaded: loaded ? loaded.status : "not_loaded",
      loadTime: loaded?.loadTime,
      loadedAt: loaded?.loadedAt,
      error: loaded?.error,
    };
  }

  /**
   * Get all adapter statuses
   */
  getAllStatuses(): any[] {
    return Array.from(this.adapterSpecs.keys()).map((key) =>
      this.getAdapterStatus(key),
    );
  }

  /**
   * Load adapter on demand
   */
  async loadOnDemand(key: string): Promise<boolean> {
    try {
      const adapter = await this.loadAdapter(key);
      return adapter ? adapter.status !== "failed" : false;
    } catch (error) {
      this.logger.error(`On-demand loading failed for ${key}:`, error);
      return false;
    }
  }

  /**
   * Unload an adapter
   */
  async unloadAdapter(key: string): Promise<boolean> {
    const loaded = this.loadedAdapters.get(key);
    if (!loaded) {
      return false;
    }

    try {
      // Call shutdown if available
      if (loaded.instance && loaded.instance.shutdown) {
        await loaded.instance.shutdown();
      }

      this.loadedAdapters.delete(key);

      this.logger.info(`Adapter unloaded: ${loaded.spec.name}`);
      this.emit("adapter_unloaded", { key, name: loaded.spec.name });

      return true;
    } catch (error) {
      this.logger.error(`Failed to unload adapter ${key}:`, error);
      return false;
    }
  }

  /**
   * Reload an adapter
   */
  async reloadAdapter(key: string): Promise<boolean> {
    await this.unloadAdapter(key);
    return await this.loadOnDemand(key);
  }

  /**
   * Get summary statistics
   */
  getStats(): any {
    const loaded = Array.from(this.loadedAdapters.values());

    return {
      total: this.adapterSpecs.size,
      loaded: loaded.filter((a) => a.status === "loaded").length,
      fallback: loaded.filter((a) => a.status === "fallback").length,
      failed: loaded.filter((a) => a.status === "failed").length,
      experimental: loaded.filter((a) => a.spec.experimental).length,
      avgLoadTime:
        loaded.length > 0
          ? loaded.reduce((sum, a) => sum + a.loadTime, 0) / loaded.length
          : 0,
      memoryUsage: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB`,
    };
  }

  /**
   * Shutdown all adapters
   */
  async shutdown(): Promise<void> {
    this.logger.info("Shutting down all adapters...");

    const shutdownPromises = Array.from(this.loadedAdapters.keys()).map((key) =>
      this.unloadAdapter(key),
    );

    await Promise.allSettled(shutdownPromises);

    this.loadedAdapters.clear();
    this.loadingPromises.clear();

    this.logger.info("All adapters shut down");
  }
}

// Export singleton instance
let loaderInstance: DynamicAdapterLoader | null = null;

export function getAdapterLoader(): DynamicAdapterLoader {
  if (!loaderInstance) {
    loaderInstance = new DynamicAdapterLoader();
  }
  return loaderInstance;
}

export function resetAdapterLoader(): void {
  if (loaderInstance) {
    loaderInstance.shutdown();
    loaderInstance = null;
  }
}
