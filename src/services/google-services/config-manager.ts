/**
 * Google AI Services Configuration Manager
 *
 * Centralized configuration management for Google AI services with environment
 * variable handling, validation, and secure credential management.
 */

import { EventEmitter } from "events";
import { Logger } from "../../utils/logger.js";
import { ServiceResponse, ServiceError } from "./interfaces.js";

export interface GoogleAIServiceConfig {
  imagen4: Imagen4ServiceConfig;
  veo3: Veo3ServiceConfig;
  streamingApi: StreamingApiServiceConfig;
  orchestrator: OrchestratorConfig;
  global: GlobalConfig;
}

export interface Imagen4ServiceConfig {
  enabled: boolean;
  apiEndpoint: string;
  projectId: string;
  region: string;
  authentication: ServiceAuthenticationConfig;
  retryPolicy: RetryPolicy;
  rateLimiting: RateLimitingConfig;
  storage: StorageConfig;
}

export interface Veo3ServiceConfig {
  enabled: boolean;
  apiEndpoint: string;
  projectId: string;
  region: string;
  authentication: ServiceAuthenticationConfig;
  retryPolicy: RetryPolicy;
  rateLimiting: RateLimitingConfig;
  rendering: RenderingConfig;
}

export interface StreamingApiServiceConfig {
  enabled: boolean;
  apiEndpoint: string;
  projectId: string;
  region: string;
  authentication: ServiceAuthenticationConfig;
  retryPolicy: RetryPolicy;
  rateLimiting: RateLimitingConfig;
  buffering: BufferingConfig;
  compression: CompressionConfig;
}

export interface OrchestratorConfig {
  enabled: boolean;
  routingStrategy: "round_robin" | "priority" | "load_based" | "adaptive";
  healthCheckInterval: number;
  circuitBreakerThreshold: number;
  loadBalancingAlgorithm: "round_robin" | "least_connections" | "weighted_response_time";
  workflowTimeout: number;
  maxConcurrentWorkflows: number;
}

export interface GlobalConfig {
  environment: "development" | "staging" | "production";
  logLevel: "debug" | "info" | "warn" | "error";
  enableMetrics: boolean;
  enableTracing: boolean;
  enableHealthChecks: boolean;
  defaultTimeout: number;
  maxRetries: number;
  requestTimeout: number;
}

export interface ServiceAuthenticationConfig {
  type: "oauth2" | "api_key" | "service_account";
  clientId?: string;
  clientSecret?: string;
  apiKey?: string;
  serviceAccountKeyPath?: string;
  scopes: string[];
  tokenEndpoint?: string;
}

export interface RetryPolicy {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffStrategy: "fixed" | "exponential" | "linear";
  retryableErrors: string[];
  jitter: boolean;
}

export interface RateLimitingConfig {
  requestsPerSecond: number;
  requestsPerMinute: number;
  requestsPerHour: number;
  burstLimit: number;
  enableThrottling: boolean;
}

export interface StorageConfig {
  inputPath: string;
  outputPath: string;
  tempPath: string;
  maxFileSize: number;
  allowedFormats: string[];
  encryption: boolean;
}

export interface RenderingConfig {
  maxConcurrentRenders: number;
  memoryLimit: number;
  gpuEnabled: boolean;
  quality: "draft" | "standard" | "high" | "ultra";
  outputFormats: string[];
}

export interface BufferingConfig {
  bufferSize: number;
  chunkSize: number;
  timeout: number;
  compression: boolean;
  protocol: "websocket" | "sse" | "grpc";
}

export interface CompressionConfig {
  enabled: boolean;
  algorithm: "gzip" | "deflate" | "lz4" | "zstd";
  level: number;
  minSize: number;
}

export interface ConfigurationValidationResult {
  isValid: boolean;
  errors: ConfigurationError[];
  warnings: ConfigurationWarning[];
}

export interface ConfigurationError {
  field: string;
  message: string;
  severity: "error" | "warning";
  service?: string;
}

export interface ConfigurationWarning {
  field: string;
  message: string;
  suggestion: string;
  service?: string;
}

export class GoogleAIConfigManager extends EventEmitter {
  private logger: Logger;
  private config: GoogleAIServiceConfig;
  private environmentVariables: Map<string, string>;
  private configFilePath?: string;
  private validationRules: Map<string, ValidationRule[]> = new Map();

  constructor(configFilePath?: string) {
    super();
    this.configFilePath = configFilePath;
    this.logger = new Logger("GoogleAIConfigManager");
    this.environmentVariables = new Map();

    this.initializeValidationRules();
    this.loadConfiguration();
    this.setupEnvironmentMonitoring();
  }

  /**
   * Loads configuration from file and environment variables
   */
  async loadConfiguration(): Promise<void> {
    try {
      this.logger.info("Loading Google AI service configuration");

      // Load from file if specified
      if (this.configFilePath) {
        await this.loadFromFile();
      }

      // Override with environment variables
      this.loadFromEnvironment();

      // Validate configuration
      const validationResult = this.validateConfiguration();
      if (!validationResult.isValid) {
        this.logger.error("Configuration validation failed", validationResult.errors);
        throw new Error("Invalid configuration detected");
      }

      // Log warnings
      if (validationResult.warnings.length > 0) {
        this.logger.warn("Configuration warnings detected", validationResult.warnings);
      }

      this.emit("configuration:loaded", this.config);
    } catch (error) {
      this.logger.error("Failed to load configuration", error);
      throw error;
    }
  }

  /**
   * Gets the complete service configuration
   */
  getConfiguration(): GoogleAIServiceConfig {
    return JSON.parse(JSON.stringify(this.config)); // Deep copy
  }

  /**
   * Gets configuration for a specific service
   */
  getServiceConfiguration(service: "imagen4" | "veo3" | "streaming-api"): ServiceResponse<any> {
    try {
      const serviceConfig = this.config[service];
      if (!serviceConfig) {
        throw new Error(`Service configuration not found: ${service}`);
      }

      return {
        success: true,
        data: serviceConfig,
        metadata: {
          requestId: this.generateRequestId(),
          timestamp: new Date(),
          processingTime: 0,
          region: "local",
        },
      };
    } catch (error) {
      return this.createErrorResponse("SERVICE_CONFIG_NOT_FOUND", error.message);
    }
  }

  /**
   * Updates configuration for a specific service
   */
  async updateServiceConfiguration(
    service: "imagen4" | "veo3" | "streaming-api",
    updates: Partial<any>,
  ): Promise<ServiceResponse<void>> {
    try {
      this.logger.info("Updating service configuration", { service, updates });

      // Create backup of current config
      const backupConfig = JSON.parse(JSON.stringify(this.config[service]));

      // Apply updates
      this.config[service] = this.deepMerge(this.config[service], updates);

      // Validate updated configuration
      const validationResult = this.validateServiceConfiguration(service);
      if (!validationResult.isValid) {
        // Restore backup on validation failure
        this.config[service] = backupConfig;

        return this.createErrorResponse(
          "CONFIG_VALIDATION_FAILED",
          "Configuration update failed validation",
        );
      }

      // Persist changes if needed
      await this.persistConfiguration();

      this.emit("configuration:updated", { service, updates });

      return {
        success: true,
        metadata: {
          requestId: this.generateRequestId(),
          timestamp: new Date(),
          processingTime: 0,
          region: "local",
        },
      };
    } catch (error) {
      return this.createErrorResponse("CONFIG_UPDATE_FAILED", error.message);
    }
  }

  /**
   * Validates the complete configuration
   */
  validateConfiguration(): ConfigurationValidationResult {
    const errors: ConfigurationError[] = [];
    const warnings: ConfigurationWarning[] = [];

    // Validate global configuration
    const globalValidation = this.validateGlobalConfiguration();
    errors.push(...globalValidation.errors);
    warnings.push(...globalValidation.warnings);

    // Validate service configurations
    for (const service of ["imagen4", "veo3", "streaming-api"] as const) {
      const serviceValidation = this.validateServiceConfiguration(service);
      errors.push(...serviceValidation.errors);
      warnings.push(...serviceValidation.warnings);
    }

    // Validate orchestrator configuration
    const orchestratorValidation = this.validateOrchestratorConfiguration();
    errors.push(...orchestratorValidation.errors);
    warnings.push(...orchestratorValidation.warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Gets environment variable with fallback
   */
  getEnvironmentVariable(key: string, defaultValue?: string): string | undefined {
    return this.environmentVariables.get(key) || defaultValue;
  }

  /**
   * Sets environment variable
   */
  setEnvironmentVariable(key: string, value: string): void {
    this.environmentVariables.set(key, value);
    this.emit("environment:variable_changed", { key, value });
  }

  /**
   * Reloads configuration from all sources
   */
  async reloadConfiguration(): Promise<void> {
    await this.loadConfiguration();
  }

  /**
   * Exports configuration to file
   */
  async exportConfiguration(filePath: string): Promise<ServiceResponse<void>> {
    try {
      const fs = await import("fs/promises");

      // Remove sensitive information before export
      const sanitizedConfig = this.sanitizeConfigurationForExport(this.config);

      await fs.writeFile(
        filePath,
        JSON.stringify(sanitizedConfig, null, 2),
        "utf8"
      );

      this.logger.info("Configuration exported", { filePath });

      return {
        success: true,
        metadata: {
          requestId: this.generateRequestId(),
          timestamp: new Date(),
          processingTime: 0,
          region: "local",
        },
      };
    } catch (error) {
      return this.createErrorResponse("CONFIG_EXPORT_FAILED", error.message);
    }
  }

  // ==================== Private Helper Methods ====================

  private async loadFromFile(): Promise<void> {
    try {
      const fs = await import("fs/promises");
      const configData = await fs.readFile(this.configFilePath!, "utf8");
      const fileConfig = JSON.parse(configData);

      this.config = this.deepMerge(this.getDefaultConfiguration(), fileConfig);
    } catch (error) {
      this.logger.warn("Failed to load configuration from file", error);
      this.config = this.getDefaultConfiguration();
    }
  }

  private loadFromEnvironment(): void {
    // Global configuration
    this.config.global.environment = this.getEnvironmentVariable(
      "GOOGLE_AI_ENVIRONMENT",
      "development"
    ) as any;

    this.config.global.logLevel = this.getEnvironmentVariable(
      "GOOGLE_AI_LOG_LEVEL",
      "info"
    ) as any;

    this.config.global.enableMetrics = this.getEnvironmentVariable(
      "GOOGLE_AI_ENABLE_METRICS",
      "true"
    ) === "true";

    this.config.global.enableTracing = this.getEnvironmentVariable(
      "GOOGLE_AI_ENABLE_TRACING",
      "false"
    ) === "true";

    // Service configurations
    this.loadServiceConfigurationFromEnvironment("imagen4");
    this.loadServiceConfigurationFromEnvironment("veo3");
    this.loadServiceConfigurationFromEnvironment("streamingApi");
  }

  private loadServiceConfigurationFromEnvironment(service: string): void {
    const serviceConfig = this.config[service];

    // Authentication
    const authType = this.getEnvironmentVariable(`GOOGLE_AI_${service.toUpperCase()}_AUTH_TYPE`);
    if (authType) {
      serviceConfig.authentication.type = authType as any;
    }

    const apiKey = this.getEnvironmentVariable(`GOOGLE_AI_${service.toUpperCase()}_API_KEY`);
    if (apiKey) {
      serviceConfig.authentication.apiKey = apiKey;
    }

    const projectId = this.getEnvironmentVariable(`GOOGLE_AI_${service.toUpperCase()}_PROJECT_ID`);
    if (projectId) {
      serviceConfig.projectId = projectId;
    }

    const region = this.getEnvironmentVariable(`GOOGLE_AI_${service.toUpperCase()}_REGION`);
    if (region) {
      serviceConfig.region = region;
    }

    // Rate limiting
    const rps = this.getEnvironmentVariable(`GOOGLE_AI_${service.toUpperCase()}_RPS`);
    if (rps) {
      serviceConfig.rateLimiting.requestsPerSecond = parseInt(rps, 10);
    }
  }

  private initializeValidationRules(): void {
    // Global configuration rules
    this.validationRules.set("global", [
      {
        field: "environment",
        validate: (value) => ["development", "staging", "production"].includes(value),
        message: "Environment must be one of: development, staging, production",
      },
      {
        field: "logLevel",
        validate: (value) => ["debug", "info", "warn", "error"].includes(value),
        message: "Log level must be one of: debug, info, warn, error",
      },
    ]);

    // Service configuration rules
    this.validationRules.set("service", [
      {
        field: "projectId",
        validate: (value) => typeof value === "string" && value.length > 0,
        message: "Project ID is required",
      },
      {
        field: "region",
        validate: (value) => typeof value === "string" && value.length > 0,
        message: "Region is required",
      },
      {
        field: "rateLimiting.requestsPerSecond",
        validate: (value) => typeof value === "number" && value > 0,
        message: "Requests per second must be a positive number",
      },
    ]);
  }

  private validateGlobalConfiguration(): ConfigurationValidationResult {
    return this.validateSection("global", this.config.global);
  }

  private validateServiceConfiguration(service: string): ConfigurationValidationResult {
    return this.validateSection("service", this.config[service]);
  }

  private validateOrchestratorConfiguration(): ConfigurationValidationResult {
    return this.validateSection("orchestrator", this.config.orchestrator);
  }

  private validateSection(section: string, config: any): ConfigurationValidationResult {
    const rules = this.validationRules.get(section);
    if (!rules) {
      return { isValid: true, errors: [], warnings: [] };
    }

    const errors: ConfigurationError[] = [];
    const warnings: ConfigurationWarning[] = [];

    for (const rule of rules) {
      const value = this.getNestedValue(config, rule.field);

      if (!rule.validate(value)) {
        errors.push({
          field: rule.field,
          message: rule.message,
          severity: "error",
        });
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  }

  private setupEnvironmentMonitoring(): void {
    // Monitor environment variable changes
    // This would integrate with the actual environment monitoring system
  }

  private async persistConfiguration(): Promise<void> {
    if (!this.configFilePath) {
      return;
    }

    try {
      const fs = await import("fs/promises");
      const sanitizedConfig = this.sanitizeConfigurationForExport(this.config);

      await fs.writeFile(
        this.configFilePath,
        JSON.stringify(sanitizedConfig, null, 2),
        "utf8"
      );

      this.logger.debug("Configuration persisted", { filePath: this.configFilePath });
    } catch (error) {
      this.logger.error("Failed to persist configuration", error);
    }
  }

  private sanitizeConfigurationForExport(config: GoogleAIServiceConfig): any {
    const sanitized = JSON.parse(JSON.stringify(config));

    // Remove sensitive information
    for (const service of ["imagen4", "veo3", "streamingApi"] as const) {
      if (sanitized[service]?.authentication) {
        delete sanitized[service].authentication.apiKey;
        delete sanitized[service].authentication.clientSecret;
        delete sanitized[service].authentication.serviceAccountKeyPath;
      }
    }

    return sanitized;
  }

  private getDefaultConfiguration(): GoogleAIServiceConfig {
    return {
      imagen4: {
        enabled: true,
        apiEndpoint: "https://us-central1-aiplatform.googleapis.com/v1",
        projectId: "",
        region: "us-central1",
        authentication: {
          type: "api_key",
          scopes: ["https://www.googleapis.com/auth/cloud-platform"],
        },
        retryPolicy: {
          maxRetries: 3,
          initialDelay: 1000,
          maxDelay: 10000,
          backoffStrategy: "exponential",
          retryableErrors: ["TIMEOUT", "SERVER_ERROR", "RATE_LIMIT"],
          jitter: true,
        },
        rateLimiting: {
          requestsPerSecond: 10,
          requestsPerMinute: 600,
          requestsPerHour: 36000,
          burstLimit: 20,
          enableThrottling: true,
        },
        storage: {
          inputPath: "/tmp/imagen4/input",
          outputPath: "/tmp/imagen4/output",
          tempPath: "/tmp/imagen4/temp",
          maxFileSize: 50 * 1024 * 1024, // 50MB
          allowedFormats: ["jpeg", "jpg", "png", "webp"],
          encryption: false,
        },
      },
      veo3: {
        enabled: true,
        apiEndpoint: "https://us-central1-aiplatform.googleapis.com/v1",
        projectId: "",
        region: "us-central1",
        authentication: {
          type: "api_key",
          scopes: ["https://www.googleapis.com/auth/cloud-platform"],
        },
        retryPolicy: {
          maxRetries: 3,
          initialDelay: 2000,
          maxDelay: 20000,
          backoffStrategy: "exponential",
          retryableErrors: ["TIMEOUT", "SERVER_ERROR", "RATE_LIMIT"],
          jitter: true,
        },
        rateLimiting: {
          requestsPerSecond: 5,
          requestsPerMinute: 300,
          requestsPerHour: 18000,
          burstLimit: 10,
          enableThrottling: true,
        },
        rendering: {
          maxConcurrentRenders: 3,
          memoryLimit: 8192, // MB
          gpuEnabled: true,
          quality: "standard",
          outputFormats: ["mp4", "webm", "mov"],
        },
      },
      streamingApi: {
        enabled: true,
        apiEndpoint: "https://us-central1-aiplatform.googleapis.com/v1",
        projectId: "",
        region: "us-central1",
        authentication: {
          type: "api_key",
          scopes: ["https://www.googleapis.com/auth/cloud-platform"],
        },
        retryPolicy: {
          maxRetries: 5,
          initialDelay: 500,
          maxDelay: 5000,
          backoffStrategy: "exponential",
          retryableErrors: ["TIMEOUT", "NETWORK_ERROR", "SERVER_ERROR"],
          jitter: true,
        },
        rateLimiting: {
          requestsPerSecond: 20,
          requestsPerMinute: 1200,
          requestsPerHour: 72000,
          burstLimit: 50,
          enableThrottling: true,
        },
        buffering: {
          bufferSize: 1000,
          chunkSize: 1024,
          timeout: 30000,
          compression: true,
          protocol: "websocket",
        },
        compression: {
          enabled: true,
          algorithm: "gzip",
          level: 6,
          minSize: 1024,
        },
      },
      orchestrator: {
        enabled: true,
        routingStrategy: "adaptive",
        healthCheckInterval: 30000,
        circuitBreakerThreshold: 5,
        loadBalancingAlgorithm: "weighted_response_time",
        workflowTimeout: 3600000, // 1 hour
        maxConcurrentWorkflows: 10,
      },
      global: {
        environment: "development",
        logLevel: "info",
        enableMetrics: true,
        enableTracing: false,
        enableHealthChecks: true,
        defaultTimeout: 30000,
        maxRetries: 3,
        requestTimeout: 30000,
      },
    };
  }

  private deepMerge(target: any, source: any): any {
    const result = { ...target };

    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (
          typeof source[key] === "object" &&
          source[key] !== null &&
          !Array.isArray(source[key]) &&
          typeof result[key] === "object" &&
          result[key] !== null
        ) {
          result[key] = this.deepMerge(result[key], source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }

    return result;
  }

  private generateRequestId(): string {
    return `config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createErrorResponse(code: string, message: string): ServiceResponse<any> {
    return {
      success: false,
      error: {
        code,
        message,
        retryable: false,
        timestamp: new Date(),
      },
      metadata: {
        requestId: this.generateRequestId(),
        timestamp: new Date(),
        processingTime: 0,
        region: "local",
      },
    };
  }
}

// ==================== Supporting Types ====================

interface ValidationRule {
  field: string;
  validate: (value: any) => boolean;
  message: string;
}