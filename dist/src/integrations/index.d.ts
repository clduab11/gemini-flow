/**
 * Advanced Integrations Index
 *
 * Exports for Project Mariner browser automation and Veo3 video generation
 * with SPARC architecture integration and A2A coordination
 */
export * from "./shared/types.js";
export * from "./mariner/types.js";
export { BrowserOrchestrator } from "./mariner/browser-orchestrator.js";
export { WebAgentCoordinator } from "./mariner/web-agent-coordinator.js";
export { IntelligentFormFiller } from "./mariner/intelligent-form-filler.js";
export { SessionManager } from "./mariner/session-manager.js";
export * from "./veo3/types.js";
export { VideoGenerationPipeline } from "./veo3/video-generation-pipeline.js";
export { GoogleCloudStorage } from "./veo3/google-cloud-storage.js";
export { SparcConnector } from "./sparc-connector.js";
export type { SparcConnectorConfig, SparcConfig, SparcWorkflowDefinition, IntegratedTaskRequest, IntegratedTaskResult, CoordinatedResult, A2aCoordinationConfig, WorkflowConfig, MonitoringConfig, } from "./sparc-connector.js";
export declare class IntegrationFactory {
    static createMarinerIntegration(config: any): {
        browserOrchestrator: any;
        webAgentCoordinator: any;
        formFiller: any;
        sessionManager: any;
    };
    static createVeo3Integration(config: any): {
        videoGenerationPipeline: any;
        googleCloudStorage: any;
    };
    static createSparcConnector(config: any): any;
}
export declare const INTEGRATION_EXAMPLES: {
    MARINER_BROWSER_CONFIG: {
        puppeteer: {
            headless: boolean;
            devtools: boolean;
            defaultViewport: {
                width: number;
                height: number;
            };
            timeout: number;
            args: string[];
        };
        coordination: {
            maxTabs: number;
            tabPoolSize: number;
            coordinationStrategy: string;
            crossTabCommunication: boolean;
            globalStateManagement: boolean;
        };
        intelligence: {
            formFilling: {
                enabled: boolean;
                aiAssisted: boolean;
                dataValidation: boolean;
                smartDefaults: boolean;
            };
            elementDetection: {
                strategy: string;
                confidence: number;
                retryAttempts: number;
            };
            antiDetection: {
                randomizeUserAgent: boolean;
                humanLikeDelays: boolean;
                mouseMovementSimulation: boolean;
            };
        };
    };
    VEO3_GENERATION_CONFIG: {
        generation: {
            model: string;
            apiEndpoint: string;
            maxDuration: number;
            maxResolution: {
                width: number;
                height: number;
            };
            concurrentJobs: number;
            priority: string;
        };
        rendering: {
            workers: number;
            chunkSize: number;
            parallelism: number;
            codec: string;
            gpuAcceleration: boolean;
        };
        storage: {
            provider: string;
            bucket: string;
            region: string;
            cdn: {
                provider: string;
                geoDistribution: boolean;
                analytics: boolean;
            };
        };
        coordination: {
            distributedRendering: boolean;
            loadBalancing: boolean;
            failover: boolean;
            coordination: string;
        };
    };
    SPARC_CONNECTOR_CONFIG: {
        sparc: {
            mode: string;
            phases: {
                name: string;
                enabled: boolean;
                automation: boolean;
                validation: boolean;
            }[];
            automation: {
                enabledPhases: string[];
                browserTasks: never[];
                videoTasks: never[];
                integrationTasks: never[];
            };
        };
        coordination: {
            enabled: boolean;
            protocol: string;
            agents: {
                id: string;
                type: string;
                capabilities: string[];
            }[];
        };
        workflow: {
            maxConcurrentTasks: number;
            taskTimeout: number;
            retryPolicy: {
                maxAttempts: number;
                backoffStrategy: string;
                backoffMs: number;
            };
        };
        monitoring: {
            enabled: boolean;
            metrics: {
                name: string;
                type: string;
                aggregation: string;
            }[];
            alerts: {
                name: string;
                condition: string;
                severity: string;
            }[];
        };
    };
};
export declare class IntegrationUtils {
    static validateMarinerConfig(config: any): boolean;
    static validateVeo3Config(config: any): boolean;
    static validateSparcConfig(config: any): boolean;
    static createDefaultConfig(type: "mariner" | "veo3" | "sparc"): any;
    static mergeConfigs(base: any, override: any): any;
}
export declare const INTEGRATION_CONSTANTS: {
    MARINER: {
        MAX_TABS: number;
        DEFAULT_TIMEOUT: number;
        POOL_SIZE: number;
        USER_AGENTS: string[];
    };
    VEO3: {
        MAX_DURATION: number;
        MAX_RESOLUTION: {
            width: number;
            height: number;
        };
        SUPPORTED_CODECS: string[];
        CHUNK_SIZES: number[];
        QUALITY_PRESETS: string[];
    };
    SPARC: {
        PHASES: string[];
        MODES: string[];
        MAX_CONCURRENT_TASKS: number;
        DEFAULT_TIMEOUT: number;
        RETRY_ATTEMPTS: number;
    };
};
export declare enum IntegrationStatus {
    INITIALIZING = "initializing",
    READY = "ready",
    BUSY = "busy",
    ERROR = "error",
    SHUTDOWN = "shutdown"
}
export declare enum HealthStatus {
    HEALTHY = "healthy",
    WARNING = "warning",
    CRITICAL = "critical",
    UNKNOWN = "unknown"
}
//# sourceMappingURL=index.d.ts.map