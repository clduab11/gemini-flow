/**
 * AgentSpace Integration - Comprehensive 87-Agent Architecture
 *
 * Complete spatial computing framework with:
 * - Agent Environment Virtualization with resource isolation
 * - 3D Spatial Reasoning Framework with collision detection
 * - Enhanced Memory Architecture with Mem0 integration
 * - Byzantine Consensus for spatial coordination
 * - AgentSpaceManager with advanced resource allocation
 * - MCP Bridge for claude-flow tool integration
 * - Streaming API integration for immersive experiences
 * - Security framework integration for secure collaboration
 */
export * from "./core/AgentSpaceManager.js";
export * from "./core/AgentEnvironmentVirtualization.js";
export * from "./core/SpatialReasoningFramework.js";
export * from "./core/EnhancedMemoryArchitecture.js";
export * from "./core/ByzantineSpatialConsensus.js";
export * from "./utils/ResourceAllocator.js";
export * from "./utils/PerformanceMonitor.js";
export * from "./types/AgentSpaceTypes.js";
export * from "./AgentSpaceInitializer.js";
export * from "./integrations/MCPBridge.js";
export * from "./integrations/StreamingIntegration.js";
export * from "./integrations/SecurityIntegration.js";
export declare class AgentSpaceIntegrationFactory {
    static createMCPBridge(agentSpaceManager: any, performanceMonitor: any, resourceAllocator: any): any;
    static createStreamingIntegration(streamingAPI: any, agentSpaceManager: any): any;
    static createSecurityIntegration(agentSpaceManager: any, coScientistSecurity: any): any;
    static createCompleteIntegrationSuite(config: {
        agentSpaceManager: any;
        performanceMonitor: any;
        resourceAllocator: any;
        streamingAPI: any;
        coScientistSecurity: any;
    }): Promise<{
        mcpBridge: any;
        streamingIntegration: any;
        securityIntegration: any;
    }>;
}
export declare const AGENTSPACE_EXAMPLES: {
    BASIC_CONFIG: {
        agentSpaceId: string;
        maxAgents: number;
        spatialDimensions: {
            x: number;
            y: number;
            z: number;
        };
        securityLevel: "standard";
        mcpIntegration: {
            memoryProvider: string;
            toolRegistry: string;
            authProvider: string;
            eventBus: string;
        };
        autoDeployAgents: boolean;
        initialAgentTypes: string[];
        spatialArrangement: "distributed";
    };
    HIGH_PERFORMANCE_CONFIG: {
        agentSpaceId: string;
        maxAgents: number;
        spatialDimensions: {
            x: number;
            y: number;
            z: number;
        };
        securityLevel: "standard";
        mcpIntegration: {
            memoryProvider: string;
            toolRegistry: string;
            authProvider: string;
            eventBus: string;
        };
        autoDeployAgents: boolean;
        initialAgentTypes: string[];
        spatialArrangement: "layered";
    };
    SECURE_RESEARCH_CONFIG: {
        agentSpaceId: string;
        maxAgents: number;
        spatialDimensions: {
            x: number;
            y: number;
            z: number;
        };
        securityLevel: "high";
        mcpIntegration: {
            memoryProvider: string;
            toolRegistry: string;
            authProvider: string;
            eventBus: string;
        };
        autoDeployAgents: boolean;
        initialAgentTypes: string[];
        spatialArrangement: "clustered";
    };
};
export declare class AgentSpaceUtils {
    static validateConfiguration(config: any): boolean;
    static calculateOptimalDimensions(agentCount: number): {
        x: number;
        y: number;
        z: number;
    };
    static mergeConfigurations(base: any, override: any): any;
    static getRecommendedAgentTypes(purpose: "development" | "research" | "analysis" | "security"): string[];
}
export declare enum AgentSpaceStatus {
    INITIALIZING = "initializing",
    READY = "ready",
    ACTIVE = "active",
    DEGRADED = "degraded",
    ERROR = "error",
    SHUTDOWN = "shutdown"
}
export declare enum IntegrationHealth {
    HEALTHY = "healthy",
    WARNING = "warning",
    CRITICAL = "critical",
    OFFLINE = "offline"
}
//# sourceMappingURL=index.d.ts.map