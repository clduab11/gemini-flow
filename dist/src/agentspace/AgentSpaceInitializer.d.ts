/**
 * AgentSpace Initializer
 *
 * Main initialization and orchestration for the complete 66-agent
 * spatial computing architecture integration with existing systems
 */
import { DistributedMemoryManager } from "../protocols/a2a/memory/distributed-memory-manager.js";
import { AgentSpaceManager } from "./core/AgentSpaceManager.js";
import { ResourceAllocator } from "./utils/ResourceAllocator.js";
import { PerformanceMonitor } from "./utils/PerformanceMonitor.js";
import { Vector3D, MCPIntegration } from "./types/AgentSpaceTypes.js";
export interface AgentSpaceInitConfig {
    agentSpaceId: string;
    maxAgents: number;
    spatialDimensions: Vector3D;
    securityLevel: "basic" | "standard" | "high" | "maximum";
    mcpIntegration: MCPIntegration;
    autoDeployAgents?: boolean;
    initialAgentTypes?: string[];
    spatialArrangement?: "clustered" | "distributed" | "layered";
}
export interface InitializationResult {
    agentSpaceManager: AgentSpaceManager;
    resourceAllocator: ResourceAllocator;
    performanceMonitor: PerformanceMonitor;
    deployedAgents: string[];
    spatialZones: string[];
    systemHealth: number;
}
export interface AgentSpaceSystem {
    manager: AgentSpaceManager;
    resourceAllocator: ResourceAllocator;
    performanceMonitor: PerformanceMonitor;
    isInitialized: boolean;
    startTime: Date;
}
/**
 * Initialize complete AgentSpace system
 */
export declare function initializeAgentSpace(config: AgentSpaceInitConfig, baseMemoryManager: DistributedMemoryManager): Promise<InitializationResult>;
/**
 * Deploy a complete 66-agent swarm with optimal spatial arrangement
 */
export declare function deployFullAgentSwarm(agentSpaceManager: AgentSpaceManager, topology?: "hierarchical" | "mesh" | "ring" | "star"): Promise<{
    deployedAgents: string[];
    collaborationZones: string[];
}>;
/**
 * Integrate with MCP tools and existing infrastructure
 */
export declare function integrateMCPTools(agentSpaceManager: AgentSpaceManager, mcpIntegration: MCPIntegration): Promise<void>;
export declare function getGlobalAgentSpaceSystem(): AgentSpaceSystem | null;
export declare function setGlobalAgentSpaceSystem(system: AgentSpaceSystem): void;
/**
 * Shutdown the entire AgentSpace system
 */
export declare function shutdownAgentSpace(system?: AgentSpaceSystem): Promise<void>;
//# sourceMappingURL=AgentSpaceInitializer.d.ts.map