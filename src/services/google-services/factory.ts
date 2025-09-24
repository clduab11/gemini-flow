/**
 * Google AI Services Factory
 *
 * Main factory class for creating and managing all Google AI service clients
 * with integrated authentication, error handling, orchestration, and configuration.
 */

import { Logger } from "../../utils/logger.js";
import { GoogleAIAuthManager } from "./auth-manager.js";
import { GoogleAIErrorHandler } from "./error-handler.js";
import { GoogleAIServiceOrchestrator } from "./orchestrator.js";
import { GoogleAIConfigManager } from "./config-manager.js";
import { EnhancedImagen4Client } from "./enhanced-imagen4-client.js";
import { EnhancedVeo3Client } from "./enhanced-veo3-client.js";
import { EnhancedStreamingAPIClient } from "./enhanced-streaming-api-client.js";

export interface GoogleAIServicesConfig {
  imagen4: {
    enabled: boolean;
    config: any;
  };
  veo3: {
    enabled: boolean;
    config: any;
  };
  streamingApi: {
    enabled: boolean;
    config: any;
  };
  global: {
    environment: "development" | "staging" | "production";
    logLevel: "debug" | "info" | "warn" | "error";
    enableMetrics: boolean;
    enableTracing: boolean;
  };
}

export interface GoogleAIServices {
  imagen4: EnhancedImagen4Client;
  veo3: EnhancedVeo3Client;
  streamingApi: EnhancedStreamingAPIClient;
  auth: GoogleAIAuthManager;
  errorHandler: GoogleAIErrorHandler;
  orchestrator: GoogleAIServiceOrchestrator;
  config: GoogleAIConfigManager;
}

export interface ServiceHealthStatus {
  service: string;
  status: "healthy" | "degraded" | "unhealthy";
  lastCheck: Date;
  responseTime: number;
  errors: number;
}

export interface SystemHealthReport {
  overall: "healthy" | "degraded" | "unhealthy";
  services: ServiceHealthStatus[];
  timestamp: Date;
  uptime: number;
}

export class GoogleAIServicesFactory {
  private logger: Logger;
  private services: Partial<GoogleAIServices> = {};
  private initialized = false;

  constructor() {
    this.logger = new Logger("GoogleAIServicesFactory");
  }

  /**
   * Creates and initializes all Google AI services
   */
  async createServices(config: GoogleAIServicesConfig): Promise<GoogleAIServices> {
    try {
      this.logger.info("Creating Google AI services", { config });

      // Create core infrastructure components
      const authManager = new GoogleAIAuthManager();
      const errorHandler = new GoogleAIErrorHandler();
      const configManager = new GoogleAIConfigManager();
      const orchestrator = new GoogleAIServiceOrchestrator(authManager, errorHandler, configManager);

      // Store core services
      this.services.auth = authManager;
      this.services.errorHandler = errorHandler;
      this.services.config = configManager;
      this.services.orchestrator = orchestrator;

      // Create service clients
      const imagen4Client = await this.createImagen4Client(config.imagen4, authManager, errorHandler, orchestrator, configManager);
      const veo3Client = await this.createVeo3Client(config.veo3, authManager, errorHandler, orchestrator, configManager);
      const streamingApiClient = await this.createStreamingApiClient(config.streamingApi, authManager, errorHandler, orchestrator, configManager);

      // Store service clients
      this.services.imagen4 = imagen4Client;
      this.services.veo3 = veo3Client;
      this.services.streamingApi = streamingApiClient;

      // Initialize all services
      await this.initializeAllServices(config);

      this.initialized = true;
      this.logger.info("All Google AI services created and initialized successfully");

      return this.services as GoogleAIServices;
    } catch (error) {
      this.logger.error("Failed to create Google AI services", error);
      throw error;
    }
  }

  /**
   * Gets the current health status of all services
   */
  async getHealthReport(): Promise<SystemHealthReport> {
    const services = Object.keys(this.services) as Array<keyof GoogleAIServices>;
    const healthStatuses: ServiceHealthStatus[] = [];

    for (const serviceName of services) {
      const service = this.services[serviceName];
      if (service && typeof service === "object" && "getStatus" in service) {
        try {
          const status = await (service as any).getStatus();
          healthStatuses.push({
            service: serviceName,
            status: this.determineHealthStatus(status),
            lastCheck: new Date(),
            responseTime: 0,
            errors: 0,
          });
        } catch (error) {
          healthStatuses.push({
            service: serviceName,
            status: "unhealthy",
            lastCheck: new Date(),
            responseTime: 0,
            errors: 1,
          });
        }
      }
    }

    const overall = this.determineOverallHealth(healthStatuses);

    return {
      overall,
      services: healthStatuses,
      timestamp: new Date(),
      uptime: this.getUptime(),
    };
  }

  /**
   * Gets a specific service client
   */
  getService<T extends keyof GoogleAIServices>(serviceName: T): GoogleAIServices[T] | undefined {
    return this.services[serviceName] as GoogleAIServices[T] | undefined;
  }

  /**
   * Gets all service clients
   */
  getAllServices(): GoogleAIServices {
    if (!this.initialized) {
      throw new Error("Services have not been initialized. Call createServices() first.");
    }
    return this.services as GoogleAIServices;
  }

  /**
   * Checks if services are initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Destroys all services and cleans up resources
   */
  async destroy(): Promise<void> {
    try {
      this.logger.info("Destroying Google AI services");

      // Close service clients
      if (this.services.imagen4) {
        // Close any active sessions
      }

      if (this.services.veo3) {
        // Close any active projects
      }

      if (this.services.streamingApi) {
        await this.services.streamingApi.disconnect();
      }

      // Clear service references
      this.services = {};
      this.initialized = false;

      this.logger.info("All Google AI services destroyed successfully");
    } catch (error) {
      this.logger.error("Failed to destroy services", error);
      throw error;
    }
  }

  // ==================== Private Helper Methods ====================

  private async createImagen4Client(
    config: any,
    authManager: GoogleAIAuthManager,
    errorHandler: GoogleAIErrorHandler,
    orchestrator: GoogleAIServiceOrchestrator,
    configManager: GoogleAIConfigManager,
  ): Promise<EnhancedImagen4Client> {
    const clientConfig = {
      serviceName: "imagen4",
      enableStreaming: true,
      enableBatchProcessing: true,
      enableQualityOptimization: true,
      enableSafetyFiltering: true,
      ...config.config,
    };

    const client = new EnhancedImagen4Client(clientConfig, authManager, errorHandler, orchestrator, configManager);

    if (config.enabled) {
      await client.initialize();
    }

    return client;
  }

  private async createVeo3Client(
    config: any,
    authManager: GoogleAIAuthManager,
    errorHandler: GoogleAIErrorHandler,
    orchestrator: GoogleAIServiceOrchestrator,
    configManager: GoogleAIConfigManager,
  ): Promise<EnhancedVeo3Client> {
    const clientConfig = {
      serviceName: "veo3",
      enableStreaming: true,
      enableRealTimeRendering: true,
      enableQualityOptimization: true,
      enableBatchProcessing: true,
      ...config.config,
    };

    const client = new EnhancedVeo3Client(clientConfig, authManager, errorHandler, orchestrator, configManager);

    if (config.enabled) {
      await client.initialize();
    }

    return client;
  }

  private async createStreamingApiClient(
    config: any,
    authManager: GoogleAIAuthManager,
    errorHandler: GoogleAIErrorHandler,
    orchestrator: GoogleAIServiceOrchestrator,
    configManager: GoogleAIConfigManager,
  ): Promise<EnhancedStreamingAPIClient> {
    const clientConfig = {
      serviceName: "streaming-api",
      enableRealTime: true,
      enableMultiModal: true,
      enableCompression: true,
      enableQualityAdaptation: true,
      ...config.config,
    };

    const client = new EnhancedStreamingAPIClient(clientConfig, authManager, errorHandler, orchestrator, configManager);

    if (config.enabled) {
      await client.initialize();
    }

    return client;
  }

  private async initializeAllServices(config: GoogleAIServicesConfig): Promise<void> {
    const initPromises: Promise<void>[] = [];

    // Initialize core services
    initPromises.push(this.services.auth!.initialize());
    initPromises.push(this.services.errorHandler!.initialize());
    initPromises.push(this.services.config!.loadConfiguration());
    initPromises.push(this.services.orchestrator!.initialize());

    // Initialize service clients if enabled
    if (config.imagen4.enabled && this.services.imagen4) {
      initPromises.push(this.services.imagen4.initialize());
    }

    if (config.veo3.enabled && this.services.veo3) {
      initPromises.push(this.services.veo3.initialize());
    }

    if (config.streamingApi.enabled && this.services.streamingApi) {
      initPromises.push(this.services.streamingApi.initialize());
    }

    await Promise.all(initPromises);
  }

  private determineHealthStatus(status: any): "healthy" | "degraded" | "unhealthy" {
    if (!status) return "unhealthy";

    // Check if status has error information
    if (status.errors !== undefined && status.errors > 0) {
      return "degraded";
    }

    // Check if status has connection information
    if (status.connected === false) {
      return "unhealthy";
    }

    return "healthy";
  }

  private determineOverallHealth(statuses: ServiceHealthStatus[]): "healthy" | "degraded" | "unhealthy" {
    const unhealthyCount = statuses.filter(s => s.status === "unhealthy").length;
    const degradedCount = statuses.filter(s => s.status === "degraded").length;

    if (unhealthyCount > 0) return "unhealthy";
    if (degradedCount > 0) return "degraded";
    return "healthy";
  }

  private getUptime(): number {
    // Return uptime in seconds (placeholder implementation)
    return process.uptime();
  }
}

// ==================== Convenience Functions ====================

/**
 * Creates a default Google AI services configuration
 */
export function createDefaultConfig(): GoogleAIServicesConfig {
  return {
    imagen4: {
      enabled: true,
      config: {
        serviceName: "imagen4",
        enableStreaming: true,
        enableBatchProcessing: true,
        enableQualityOptimization: true,
        enableSafetyFiltering: true,
      },
    },
    veo3: {
      enabled: true,
      config: {
        serviceName: "veo3",
        enableStreaming: true,
        enableRealTimeRendering: true,
        enableQualityOptimization: true,
        enableBatchProcessing: true,
      },
    },
    streamingApi: {
      enabled: true,
      config: {
        serviceName: "streaming-api",
        enableRealTime: true,
        enableMultiModal: true,
        enableCompression: true,
        enableQualityAdaptation: true,
      },
    },
    global: {
      environment: "development",
      logLevel: "info",
      enableMetrics: true,
      enableTracing: false,
    },
  };
}

/**
 * Creates Google AI services with default configuration
 */
export async function createGoogleAIServices(): Promise<GoogleAIServices> {
  const factory = new GoogleAIServicesFactory();
  const config = createDefaultConfig();
  return await factory.createServices(config);
}

/**
 * Creates Google AI services with custom configuration
 */
export async function createGoogleAIServicesWithConfig(
  config: GoogleAIServicesConfig,
): Promise<GoogleAIServices> {
  const factory = new GoogleAIServicesFactory();
  return await factory.createServices(config);
}

// ==================== Export Types ====================

export type {
  GoogleAIServicesConfig,
  GoogleAIServices,
  ServiceHealthStatus,
  SystemHealthReport,
  EnhancedImagen4Client,
  EnhancedVeo3Client,
  EnhancedStreamingAPIClient,
  GoogleAIAuthManager,
  GoogleAIErrorHandler,
  GoogleAIServiceOrchestrator,
  GoogleAIConfigManager,
};