/**
 * Agent Card System
 *
 * Comprehensive agent discovery and registration system for A2A communication.
 * Provides agent registration, capability-based discovery, filtering, and metrics tracking.
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { AgentCard, AgentId, AgentType, DiscoveryRequest, DiscoveryResponse, RegistrationResponse } from "../../../types/a2a.js";
/**
 * Discovery metrics
 */
export interface DiscoveryMetrics {
    totalDiscoveryRequests: number;
    avgDiscoveryTime: number;
    popularCapabilities: {
        [capability: string]: number;
    };
    discoverySuccessRate: number;
    filterUsageStats: {
        [filter: string]: number;
    };
}
/**
 * System metrics
 */
export interface SystemMetrics {
    totalRegisteredAgents: number;
    agentsByType: {
        [type in AgentType]?: number;
    };
    agentsByStatus: {
        [status: string]: number;
    };
    averageLoad: number;
    capabilityDistribution: {
        [capability: string]: number;
    };
    trustLevelDistribution: {
        [level: string]: number;
    };
    uptimeDistribution: {
        [range: string]: number;
    };
}
/**
 * Agent Card System implementation
 */
export declare class AgentCardSystem extends EventEmitter {
    private logger;
    private agentRegistry;
    private capabilityIndex;
    private serviceIndex;
    private typeIndex;
    private isInitialized;
    private metrics;
    private defaultTTL;
    private heartbeatInterval;
    private cleanupInterval;
    constructor();
    /**
     * Initialize the agent card system
     */
    initialize(): Promise<void>;
    /**
     * Shutdown the agent card system
     */
    shutdown(): Promise<void>;
    /**
     * Register an agent with optional TTL
     */
    registerAgent(agentCard: AgentCard, ttl?: number): Promise<RegistrationResponse>;
    /**
     * Unregister an agent
     */
    unregisterAgent(agentId: AgentId): Promise<boolean>;
    /**
     * Update existing agent card
     */
    updateAgentCard(agentCard: AgentCard): Promise<boolean>;
    /**
     * Get agent card by ID
     */
    getAgentCard(agentId: AgentId): Promise<AgentCard | null>;
    /**
     * Discover agents based on criteria
     */
    discoverAgents(request: DiscoveryRequest): Promise<DiscoveryResponse>;
    /**
     * Find agents by capability
     */
    findAgentsByCapability(capabilityName: string, version?: string): Promise<AgentCard[]>;
    /**
     * Find agents by type
     */
    findAgentsByType(agentType: AgentType): Promise<AgentCard[]>;
    /**
     * Find agents by service
     */
    findAgentsByService(serviceName: string): Promise<AgentCard[]>;
    /**
     * Refresh agent status (heartbeat)
     */
    refreshAgentStatus(agentId: AgentId): Promise<boolean>;
    /**
     * Get registered agents map
     */
    getRegisteredAgents(): Map<AgentId, AgentCard>;
    /**
     * Get system metrics
     */
    getSystemMetrics(): Promise<SystemMetrics>;
    /**
     * Get discovery metrics
     */
    getDiscoveryMetrics(): DiscoveryMetrics;
    /**
     * Validate agent card
     */
    private validateAgentCard;
    /**
     * Update search indexes
     */
    private updateIndexes;
    /**
     * Filter agents by capabilities
     */
    private filterByCapabilities;
    /**
     * Apply discovery filters
     */
    private applyFilters;
    /**
     * Evaluate a single filter
     */
    private evaluateFilter;
    /**
     * Filter agents by distance
     */
    private filterByDistance;
    /**
     * Calculate distance to agent (simplified)
     */
    private calculateDistance;
    /**
     * Check version compatibility
     */
    private isVersionCompatible;
    /**
     * Parse version string
     */
    private parseVersion;
    /**
     * Get nested value from object
     */
    private getNestedValue;
    /**
     * Deep includes check for complex objects
     */
    private deepIncludes;
    /**
     * Clean up expired agents
     */
    private cleanupExpiredAgents;
}
//# sourceMappingURL=agent-card-system.d.ts.map