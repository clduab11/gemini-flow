/**
 * Advanced Integrations Index
 *
 * Exports for Project Mariner browser automation and Veo3 video generation
 * with SPARC architecture integration and A2A coordination
 */

// === SHARED TYPES AND UTILITIES ===
export * from "./shared/types.js";

// === PROJECT MARINER BROWSER AUTOMATION ===
export * from "./mariner/types.js";
export { BrowserOrchestrator } from "./mariner/browser-orchestrator.js";
export { WebAgentCoordinator } from "./mariner/web-agent-coordinator.js";
export { IntelligentFormFiller } from "./mariner/intelligent-form-filler.js";
export { SessionManager } from "./mariner/session-manager.js";

// === VEO3 VIDEO GENERATION ===
export * from "./veo3/types.js";
export { VideoGenerationPipeline } from "./veo3/video-generation-pipeline.js";
export { GoogleCloudStorage } from "./veo3/google-cloud-storage.js";

// === SPARC ARCHITECTURE CONNECTOR ===
export { SparcConnector } from "./sparc-connector.js";
export type {
  SparcConnectorConfig,
  SparcConfig,
  SparcWorkflowDefinition,
  IntegratedTaskRequest,
  IntegratedTaskResult,
  CoordinatedResult,
  A2aCoordinationConfig,
  WorkflowConfig,
  MonitoringConfig,
} from "./sparc-connector.js";

// === INTEGRATION FACTORY ===
export class IntegrationFactory {
  static createMarinerIntegration(config: any) {
    return {
      browserOrchestrator:
        new (require("./mariner/browser-orchestrator.js").BrowserOrchestrator)(
          config.browser,
        ),
      webAgentCoordinator:
        new (require("./mariner/web-agent-coordinator.js").WebAgentCoordinator)(
          config.browser,
        ),
      formFiller:
        new (require("./mariner/intelligent-form-filler.js").IntelligentFormFiller)(
          config.formFilling,
        ),
      sessionManager:
        new (require("./mariner/session-manager.js").SessionManager)(
          config.session,
        ),
    };
  }

  static createVeo3Integration(config: any) {
    return {
      videoGenerationPipeline:
        new (require("./veo3/video-generation-pipeline.js").VideoGenerationPipeline)(
          config.generation,
        ),
      googleCloudStorage:
        new (require("./veo3/google-cloud-storage.js").GoogleCloudStorage)(
          config.storage,
        ),
    };
  }

  static createSparcConnector(config: any) {
    return new (require("./sparc-connector.js").SparcConnector)(config);
  }
}

// === INTEGRATION EXAMPLES ===
export const INTEGRATION_EXAMPLES = {
  // Project Mariner Examples
  MARINER_BROWSER_CONFIG: {
    puppeteer: {
      headless: true,
      devtools: false,
      defaultViewport: { width: 1920, height: 1080 },
      timeout: 30000,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
    coordination: {
      maxTabs: 10,
      tabPoolSize: 3,
      coordinationStrategy: "adaptive",
      crossTabCommunication: true,
      globalStateManagement: true,
    },
    intelligence: {
      formFilling: {
        enabled: true,
        aiAssisted: true,
        dataValidation: true,
        smartDefaults: true,
      },
      elementDetection: {
        strategy: "hybrid",
        confidence: 0.8,
        retryAttempts: 3,
      },
      antiDetection: {
        randomizeUserAgent: true,
        humanLikeDelays: true,
        mouseMovementSimulation: true,
      },
    },
  },

  // Veo3 Examples
  VEO3_GENERATION_CONFIG: {
    generation: {
      model: "veo-3",
      apiEndpoint: "https://api.veo3.google.com/v1",
      maxDuration: 300,
      maxResolution: { width: 4096, height: 2160 },
      concurrentJobs: 4,
      priority: "high",
    },
    rendering: {
      workers: 8,
      chunkSize: 30,
      parallelism: 4,
      codec: "h265",
      gpuAcceleration: true,
    },
    storage: {
      provider: "gcs",
      bucket: "veo3-videos",
      region: "us-central1",
      cdn: {
        provider: "cloudflare",
        geoDistribution: true,
        analytics: true,
      },
    },
    coordination: {
      distributedRendering: true,
      loadBalancing: true,
      failover: true,
      coordination: "a2a",
    },
  },

  // SPARC Integration Example
  SPARC_CONNECTOR_CONFIG: {
    sparc: {
      mode: "production",
      phases: [
        {
          name: "specification",
          enabled: true,
          automation: true,
          validation: true,
        },
        {
          name: "architecture",
          enabled: true,
          automation: true,
          validation: true,
        },
        {
          name: "refinement",
          enabled: true,
          automation: false,
          validation: true,
        },
        {
          name: "completion",
          enabled: true,
          automation: true,
          validation: true,
        },
      ],
      automation: {
        enabledPhases: ["specification", "architecture", "completion"],
        browserTasks: [],
        videoTasks: [],
        integrationTasks: [],
      },
    },
    coordination: {
      enabled: true,
      protocol: "hybrid",
      agents: [
        {
          id: "browser-agent",
          type: "browser",
          capabilities: ["web-automation", "form-filling"],
        },
        {
          id: "video-agent",
          type: "video",
          capabilities: ["generation", "processing", "optimization"],
        },
        {
          id: "coordinator",
          type: "coordinator",
          capabilities: ["orchestration", "monitoring"],
        },
      ],
    },
    workflow: {
      maxConcurrentTasks: 10,
      taskTimeout: 300000,
      retryPolicy: {
        maxAttempts: 3,
        backoffStrategy: "exponential",
        backoffMs: 1000,
      },
    },
    monitoring: {
      enabled: true,
      metrics: [
        { name: "task_completion_rate", type: "gauge", aggregation: "avg" },
        {
          name: "processing_time",
          type: "histogram",
          aggregation: "percentile",
        },
        { name: "error_rate", type: "counter", aggregation: "sum" },
      ],
      alerts: [
        {
          name: "high_error_rate",
          condition: "error_rate > 0.1",
          severity: "warning",
        },
        {
          name: "task_timeout",
          condition: "processing_time > 300",
          severity: "error",
        },
      ],
    },
  },
};

// === INTEGRATION UTILITIES ===
export class IntegrationUtils {
  static validateMarinerConfig(config: any): boolean {
    return !!(config.puppeteer && config.coordination && config.intelligence);
  }

  static validateVeo3Config(config: any): boolean {
    return !!(config.generation && config.storage && config.rendering);
  }

  static validateSparcConfig(config: any): boolean {
    return !!(config.sparc && config.coordination && config.workflow);
  }

  static createDefaultConfig(type: "mariner" | "veo3" | "sparc"): any {
    switch (type) {
      case "mariner":
        return INTEGRATION_EXAMPLES.MARINER_BROWSER_CONFIG;
      case "veo3":
        return INTEGRATION_EXAMPLES.VEO3_GENERATION_CONFIG;
      case "sparc":
        return INTEGRATION_EXAMPLES.SPARC_CONNECTOR_CONFIG;
      default:
        throw new Error(`Unknown integration type: ${type}`);
    }
  }

  static mergeConfigs(base: any, override: any): any {
    return {
      ...base,
      ...override,
      // Deep merge for nested objects
      ...(base.puppeteer &&
        override.puppeteer && {
          puppeteer: { ...base.puppeteer, ...override.puppeteer },
        }),
      ...(base.coordination &&
        override.coordination && {
          coordination: { ...base.coordination, ...override.coordination },
        }),
      ...(base.intelligence &&
        override.intelligence && {
          intelligence: { ...base.intelligence, ...override.intelligence },
        }),
    };
  }
}

// === INTEGRATION CONSTANTS ===
export const INTEGRATION_CONSTANTS = {
  // Mariner Constants
  MARINER: {
    MAX_TABS: 50,
    DEFAULT_TIMEOUT: 30000,
    POOL_SIZE: 5,
    USER_AGENTS: [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    ],
  },

  // Veo3 Constants
  VEO3: {
    MAX_DURATION: 600, // 10 minutes
    MAX_RESOLUTION: { width: 7680, height: 4320 }, // 8K
    SUPPORTED_CODECS: ["h264", "h265", "vp9", "av1"],
    CHUNK_SIZES: [5, 10, 15, 30, 60], // seconds
    QUALITY_PRESETS: ["low", "medium", "high", "ultra"],
  },

  // SPARC Constants
  SPARC: {
    PHASES: [
      "specification",
      "pseudocode",
      "architecture",
      "refinement",
      "completion",
    ],
    MODES: ["dev", "api", "ui", "test", "refactor", "production"],
    MAX_CONCURRENT_TASKS: 20,
    DEFAULT_TIMEOUT: 300000, // 5 minutes
    RETRY_ATTEMPTS: 3,
  },
};

// === INTEGRATION STATUS ===
export enum IntegrationStatus {
  INITIALIZING = "initializing",
  READY = "ready",
  BUSY = "busy",
  ERROR = "error",
  SHUTDOWN = "shutdown",
}

export enum HealthStatus {
  HEALTHY = "healthy",
  WARNING = "warning",
  CRITICAL = "critical",
  UNKNOWN = "unknown",
}
