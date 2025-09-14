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

// === CORE COMPONENTS ===
export * from "./core/AgentSpaceManager.js";
export * from "./core/AgentEnvironmentVirtualization.js";
export * from "./core/SpatialReasoningFramework.js";
export * from "./core/EnhancedMemoryArchitecture.js";
export * from "./core/ByzantineSpatialConsensus.js";

// === UTILITIES ===
export * from "./utils/ResourceAllocator.js";
export * from "./utils/PerformanceMonitor.js";

// === TYPE DEFINITIONS ===
export * from "./types/AgentSpaceTypes.js";

// === INITIALIZATION ===
export * from "./AgentSpaceInitializer.js";

// === INTEGRATIONS ===
// Integrations can be imported directly by consumers as needed.

// === INTEGRATION FACTORY ===
export class AgentSpaceIntegrationFactory {
  static createMCPBridge(
    agentSpaceManager: any,
    performanceMonitor: any,
    resourceAllocator: any,
  ) {
    const { MCPBridge } = require("./integrations/MCPBridge.js");
    return new MCPBridge(
      agentSpaceManager,
      performanceMonitor,
      resourceAllocator,
    );
  }

  static createStreamingIntegration(streamingAPI: any, agentSpaceManager: any) {
    const {
      StreamingIntegration,
    } = require("./integrations/StreamingIntegration.js");
    return new StreamingIntegration(streamingAPI, agentSpaceManager);
  }

  static createSecurityIntegration(
    agentSpaceManager: any,
    coScientistSecurity: any,
  ) {
    const {
      SecurityIntegration,
    } = require("./integrations/SecurityIntegration.js");
    return new SecurityIntegration(agentSpaceManager, coScientistSecurity);
  }

  static async createCompleteIntegrationSuite(config: {
    agentSpaceManager: any;
    performanceMonitor: any;
    resourceAllocator: any;
    streamingAPI: any;
    coScientistSecurity: any;
  }) {
    return {
      mcpBridge: this.createMCPBridge(
        config.agentSpaceManager,
        config.performanceMonitor,
        config.resourceAllocator,
      ),
      streamingIntegration: this.createStreamingIntegration(
        config.streamingAPI,
        config.agentSpaceManager,
      ),
      securityIntegration: this.createSecurityIntegration(
        config.agentSpaceManager,
        config.coScientistSecurity,
      ),
    };
  }
}

// === CONFIGURATION EXAMPLES ===
export const AGENTSPACE_EXAMPLES = {
  // Basic AgentSpace Configuration
  BASIC_CONFIG: {
    agentSpaceId: "basic-agentspace",
    maxAgents: 10,
    spatialDimensions: { x: 100, y: 100, z: 50 },
    securityLevel: "standard" as const,
    mcpIntegration: {
      memoryProvider: "mem0",
      toolRegistry: "claude-flow",
      authProvider: "oauth2",
      eventBus: "redis",
    },
    autoDeployAgents: true,
    initialAgentTypes: ["hierarchical-coordinator", "coder", "researcher"],
    spatialArrangement: "distributed" as const,
  },

  // High-Performance Configuration
  HIGH_PERFORMANCE_CONFIG: {
    agentSpaceId: "high-perf-agentspace",
    maxAgents: 50,
    spatialDimensions: { x: 300, y: 300, z: 150 },
    securityLevel: "standard" as const,
    mcpIntegration: {
      memoryProvider: "distributed-cache",
      toolRegistry: "claude-flow-cluster",
      authProvider: "enterprise-sso",
      eventBus: "kafka",
    },
    autoDeployAgents: true,
    initialAgentTypes: [
      "hierarchical-coordinator",
      "mesh-coordinator",
      "adaptive-coordinator",
      "coder",
      "researcher",
      "reviewer",
      "tester",
      "performance-monitor",
    ],
    spatialArrangement: "layered" as const,
  },

  // Secure Research Configuration
  SECURE_RESEARCH_CONFIG: {
    agentSpaceId: "secure-research-agentspace",
    maxAgents: 25,
    spatialDimensions: { x: 200, y: 200, z: 100 },
    securityLevel: "high" as const,
    mcpIntegration: {
      memoryProvider: "encrypted-vault",
      toolRegistry: "secure-tools",
      authProvider: "multi-factor",
      eventBus: "secure-messaging",
    },
    autoDeployAgents: true,
    initialAgentTypes: [
      "byzantine-fault-tolerant",
      "security-auditor",
      "compliance-officer",
      "researcher",
      "data-scientist",
      "privacy-analyst",
    ],
    spatialArrangement: "clustered" as const,
  },
};

// === UTILITY FUNCTIONS ===
export class AgentSpaceUtils {
  static validateConfiguration(config: any): boolean {
    return !!(
      config.agentSpaceId &&
      config.maxAgents > 0 &&
      config.spatialDimensions &&
      config.mcpIntegration
    );
  }

  static calculateOptimalDimensions(agentCount: number): {
    x: number;
    y: number;
    z: number;
  } {
    const side = Math.ceil(Math.sqrt(agentCount)) * 20;
    return {
      x: side,
      y: side,
      z: Math.max(side / 4, 50),
    };
  }

  static mergeConfigurations(base: any, override: any): any {
    return {
      ...base,
      ...override,
      spatialDimensions: {
        ...base.spatialDimensions,
        ...override.spatialDimensions,
      },
      mcpIntegration: {
        ...base.mcpIntegration,
        ...override.mcpIntegration,
      },
    };
  }

  static getRecommendedAgentTypes(
    purpose: "development" | "research" | "analysis" | "security",
  ): string[] {
    switch (purpose) {
      case "development":
        return [
          "hierarchical-coordinator",
          "coder",
          "reviewer",
          "tester",
          "performance-monitor",
        ];
      case "research":
        return [
          "mesh-coordinator",
          "researcher",
          "data-scientist",
          "academic-integrator",
          "peer-reviewer",
        ];
      case "analysis":
        return [
          "adaptive-coordinator",
          "analyst",
          "data-processor",
          "pattern-recognizer",
          "visualizer",
        ];
      case "security":
        return [
          "byzantine-fault-tolerant",
          "security-auditor",
          "compliance-officer",
          "threat-analyzer",
          "privacy-analyst",
        ];
      default:
        return ["hierarchical-coordinator", "coder", "researcher", "tester"];
    }
  }
}

// === STATUS AND HEALTH ===
export enum AgentSpaceStatus {
  INITIALIZING = "initializing",
  READY = "ready",
  ACTIVE = "active",
  DEGRADED = "degraded",
  ERROR = "error",
  SHUTDOWN = "shutdown",
}

export enum IntegrationHealth {
  HEALTHY = "healthy",
  WARNING = "warning",
  CRITICAL = "critical",
  OFFLINE = "offline",
}
