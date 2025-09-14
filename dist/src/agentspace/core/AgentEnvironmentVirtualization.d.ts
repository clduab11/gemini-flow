/**
 * Agent Environment Virtualization System
 *
 * Provides isolated, resource-controlled workspaces for agents with:
 * - Resource limits and monitoring
 * - Inter-agent communication via MCP
 * - Security isolation
 * - Performance tracking
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { AgentWorkspace, WorkspaceResources, ResourceLimits, WorkspaceConfiguration } from "../types/AgentSpaceTypes.js";
export interface VirtualizationConfig {
    maxWorkspaces: number;
    defaultResourceLimits: ResourceLimits;
    isolationLevel: "process" | "container" | "vm" | "secure_enclave";
    monitoringInterval: number;
    cleanupInterval: number;
    securityEnabled: boolean;
}
export declare class AgentEnvironmentVirtualization extends EventEmitter {
    private logger;
    private config;
    private workspaces;
    private resourceMonitors;
    private cleanupTimer;
    private metrics;
    constructor(config: VirtualizationConfig);
    private initializeSystem;
    /**
     * Create an isolated workspace for an agent
     */
    createWorkspace(agentId: string, workspaceName: string, configuration?: Partial<WorkspaceConfiguration>): Promise<AgentWorkspace>;
    /**
     * Destroy a workspace and clean up resources
     */
    destroyWorkspace(workspaceId: string): Promise<void>;
    /**
     * Get workspace information
     */
    getWorkspace(workspaceId: string): AgentWorkspace | null;
    /**
     * Get all workspaces for an agent
     */
    getAgentWorkspaces(agentId: string): AgentWorkspace[];
    /**
     * List all active workspaces
     */
    listWorkspaces(): AgentWorkspace[];
    /**
     * Update resource limits for a workspace
     */
    updateResourceLimits(workspaceId: string, newLimits: Partial<ResourceLimits>): Promise<void>;
    /**
     * Monitor workspace resource usage
     */
    getResourceUsage(workspaceId: string): Promise<WorkspaceResources>;
    /**
     * Scale workspace resources dynamically
     */
    scaleResources(workspaceId: string, scalingFactor: number): Promise<void>;
    /**
     * Isolate workspace (security quarantine)
     */
    isolateWorkspace(workspaceId: string, reason: string): Promise<void>;
    /**
     * Get system metrics
     */
    getSystemMetrics(): {
        timestamp: Date;
        workspaceDistribution: {
            isolated: number;
            shared: number;
            collaborative: number;
            secure: number;
        };
        resourceEfficiency: number;
        totalWorkspaces: number;
        activeWorkspaces: number;
        resourceUtilization: {
            memory: number;
            cpu: number;
            network: number;
            storage: number;
        };
        performance: {
            averageResponseTime: number;
            throughput: number;
            errorRate: number;
        };
    };
    /**
     * Private helper methods
     */
    private initializeResources;
    private createDefaultConfiguration;
    private startResourceMonitoring;
    private updateResourceMetrics;
    private checkResourceThresholds;
    private calculateWorkspaceEfficiency;
    private initializeWorkspaceEnvironment;
    private cleanupWorkspaceEnvironment;
    private applyResourceLimits;
    private applyNetworkPolicy;
    private performCleanup;
    private getWorkspaceDistribution;
    private calculateResourceEfficiency;
    /**
     * Cleanup on shutdown
     */
    shutdown(): Promise<void>;
}
//# sourceMappingURL=AgentEnvironmentVirtualization.d.ts.map