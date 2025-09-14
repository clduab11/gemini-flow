/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { DistributedMemoryManager } from "../../protocols/a2a/memory/distributed-memory-manager.js";
import { AgentSpaceConfiguration, Vector3D, AgentDefinitionExtension, MCPIntegration, SpatialZone as Zone } from "../types/AgentSpaceTypes.js";
export interface AgentSpaceManagerConfig {
    agentSpaceId: string;
    configuration: AgentSpaceConfiguration;
    virtualizationConfig: any;
    spatialConfig: SpatialConfig;
    memoryConfig: any;
    consensusConfig: any;
    mcpIntegration: MCPIntegration;
}
import { SpatialReasoningFramework, SpatialConfig } from "./SpatialReasoningFramework.js";
export declare class AgentSpaceManager extends EventEmitter {
    private config;
    private memoryManager;
    spatialFramework: SpatialReasoningFramework;
    private initialized;
    private agents;
    constructor(config: AgentSpaceManagerConfig, memoryManager: DistributedMemoryManager, spatialConfig: SpatialConfig);
    initialize(): Promise<boolean>;
    shutdown(): Promise<boolean>;
    reset(): Promise<boolean>;
    deployAgent(definition: AgentDefinitionExtension, position?: Vector3D): Promise<{
        agentId: string;
    }>;
    createCollaborativeWorkspace(agentIds: string[], zoneName: string): Promise<{
        zone: Zone;
    }>;
    getSystemHealth(): Promise<{
        overallHealth: {
            overall: number;
        };
    }>;
    optimizeSystem(): Promise<void>;
    getAgent(agentId: string): Promise<any>;
    listAgents(): Promise<any[]>;
    createWorkspace(name: string, resourceLimits: any, spatialProperties: any): Promise<any>;
}
//# sourceMappingURL=AgentSpaceManager.d.ts.map