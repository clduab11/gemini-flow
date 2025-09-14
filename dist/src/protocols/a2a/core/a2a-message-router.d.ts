/**
 * A2A Message Router
 *
 * Intelligent message routing system for Agent-to-Agent communication.
 * Supports multiple routing strategies including load balancing, capability-aware routing,
 * cost optimization, and shortest path routing.
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { A2AMessage, AgentCard, AgentId, MessageRoute, RoutingStrategy, A2AErrorType } from "../../../types/a2a.js";
/**
 * Routing metrics
 */
export interface RoutingMetrics {
    totalRoutedMessages: number;
    routingSuccesses: number;
    routingFailures: number;
    avgRoutingTime: number;
    routingSuccessRate: number;
    routingErrorRate: number;
    strategiesUsed: {
        [key in RoutingStrategy]?: number;
    };
    hopDistribution: {
        [hops: number]: number;
    };
    agentLoadDistribution: {
        [agentId: string]: number;
    };
    routingFailuresByType: {
        [key in A2AErrorType]?: number;
    };
}
/**
 * A2A Message Router with intelligent routing algorithms
 */
export declare class A2AMessageRouter extends EventEmitter {
    private logger;
    private routingTable;
    private networkGraph;
    private isInitialized;
    private metrics;
    private maxRoutingTime;
    private routingTableTTL;
    private maxHops;
    private loadBalanceThreshold;
    constructor();
    /**
     * Initialize the message router
     */
    initialize(): Promise<void>;
    /**
     * Shutdown the message router
     */
    shutdown(): Promise<void>;
    /**
     * Route a message to appropriate agent(s)
     */
    routeMessage(message: A2AMessage): Promise<MessageRoute>;
    /**
     * Register an agent in the routing table
     */
    registerAgent(agentCard: AgentCard): Promise<void>;
    /**
     * Unregister an agent from the routing table
     */
    unregisterAgent(agentId: AgentId): Promise<void>;
    /**
     * Update agent metrics for routing decisions
     */
    updateAgentMetrics(agentId: AgentId, metrics: any): Promise<void>;
    /**
     * Find route between agents
     */
    findRoute(from: AgentId, to: AgentId | AgentId[], strategy?: RoutingStrategy): Promise<MessageRoute>;
    /**
     * Get current routing table
     */
    getRoutingTable(): Map<AgentId, AgentCard>;
    /**
     * Get routing metrics
     */
    getRoutingMetrics(): RoutingMetrics;
    /**
     * Direct routing - route directly to target agent
     */
    private routeDirect;
    /**
     * Load-balanced routing - select least loaded agent from targets
     */
    private routeLoadBalanced;
    /**
     * Capability-aware routing - route to agent with best capability match
     */
    private routeCapabilityAware;
    /**
     * Cost-optimized routing - select lowest cost agent
     */
    private routeCostOptimized;
    /**
     * Shortest path routing using Dijkstra's algorithm
     */
    private routeShortestPath;
    /**
     * Determine optimal routing strategy based on message characteristics
     */
    private determineOptimalStrategy;
    /**
     * Get candidate agents for routing
     */
    private getCandidateAgents;
    /**
     * Calculate capability matching score
     */
    private calculateCapabilityScore;
    /**
     * Calculate version compatibility score
     */
    private calculateVersionCompatibility;
    /**
     * Parse semantic version string
     */
    private parseVersion;
    /**
     * Get service cost for an agent
     */
    private getServiceCost;
    /**
     * Calculate connection quality score
     */
    private calculateConnectionQuality;
    /**
     * Calculate network distance (simplified)
     */
    private calculateNetworkDistance;
    /**
     * Update network graph with agent connections
     */
    private updateNetworkGraph;
    /**
     * Calculate edge weight between two agents
     */
    private calculateEdgeWeight;
    /**
     * Find shortest path using Dijkstra's algorithm
     */
    private findShortestPath;
    /**
     * Track routing success metrics
     */
    private trackRoutingSuccess;
    /**
     * Track routing failure metrics
     */
    private trackRoutingFailure;
    /**
     * Get error type from error object
     */
    private getErrorType;
    /**
     * Create routing error
     */
    private createRoutingError;
    /**
     * Get error code for error type
     */
    private getErrorCodeForType;
    /**
     * Check if error type is retryable
     */
    private isRetryableError;
    /**
     * Clean up stale entries from routing table
     */
    private cleanupRoutingTable;
}
//# sourceMappingURL=a2a-message-router.d.ts.map