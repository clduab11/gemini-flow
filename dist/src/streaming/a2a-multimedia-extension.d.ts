/**
 * A2A Protocol Multimedia Extension
 *
 * Extends the Agent-to-Agent protocol for multimedia coordination:
 * - Multi-agent streaming coordination
 * - Distributed load balancing
 * - Consensus-based quality decisions
 * - Cross-agent synchronization
 * - Fault-tolerant streaming
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { StreamingSession, VideoStreamRequest, AudioStreamRequest } from "../types/streaming.js";
export interface A2AStreamingAgent {
    id: string;
    role: "producer" | "consumer" | "relay" | "coordinator";
    capabilities: {
        maxStreams: number;
        supportedCodecs: string[];
        bandwidth: {
            upload: number;
            download: number;
        };
        processing: {
            cpu: number;
            memory: number;
        };
        geographic: {
            region: string;
            latency: number;
        };
    };
    currentLoad: {
        activeStreams: number;
        cpuUsage: number;
        memoryUsage: number;
        bandwidthUsage: {
            upload: number;
            download: number;
        };
    };
    status: "online" | "offline" | "degraded" | "maintenance";
    lastHeartbeat: number;
}
export interface A2AMultimediaMessage {
    type: "stream_request" | "stream_response" | "quality_change" | "sync_command" | "load_balance" | "failover" | "consensus_vote" | "heartbeat" | "coordination";
    from: string;
    to: string | "broadcast";
    sessionId: string;
    timestamp: number;
    sequence: number;
    data: any;
    priority: "low" | "medium" | "high" | "critical";
    reliability: "best_effort" | "reliable" | "ordered";
}
export interface ConsensusProposal {
    id: string;
    type: "quality_change" | "load_redistribution" | "failover" | "sync_adjustment";
    proposer: string;
    data: any;
    votes: Map<string, boolean>;
    threshold: number;
    deadline: number;
    status: "pending" | "approved" | "rejected" | "expired";
}
export interface LoadBalancingStrategy {
    algorithm: "round_robin" | "least_loaded" | "geographic" | "capability_based" | "adaptive";
    parameters: {
        maxLoadPerAgent: number;
        geographicPreference: boolean;
        capabilityWeighting: number;
        latencyThreshold: number;
    };
    rebalanceInterval: number;
    hysteresis: number;
}
export declare class A2AMultimediaExtension extends EventEmitter {
    private logger;
    private extension;
    private agents;
    private sessions;
    private messageQueue;
    private consensusProposals;
    private loadBalancer;
    private consensusManager;
    private syncCoordinator;
    private failoverManager;
    private messageRouter;
    constructor(config: any);
    /**
     * Register a streaming agent in the A2A network
     */
    registerAgent(agent: A2AStreamingAgent): void;
    /**
     * Create a coordinated streaming session across multiple agents
     */
    createCoordinatedSession(sessionId: string, participants: string[], sessionType: "broadcast" | "multicast" | "p2p"): Promise<StreamingSession>;
    /**
     * Request streaming through A2A coordination
     */
    requestStream(request: VideoStreamRequest | AudioStreamRequest, sessionId: string): Promise<void>;
    /**
     * Coordinate quality change across all agents
     */
    coordinateQualityChange(sessionId: string, newQuality: any, reason: string): Promise<boolean>;
    /**
     * Handle agent failure and coordinate failover
     */
    handleAgentFailure(failedAgentId: string): Promise<void>;
    /**
     * Synchronize streams across multiple agents
     */
    synchronizeMultiAgentStreams(sessionId: string, referenceTime: number): Promise<boolean>;
    /**
     * Rebalance load across agents
     */
    rebalanceLoad(strategy?: LoadBalancingStrategy): Promise<void>;
    /**
     * Get network topology for multimedia routing
     */
    getNetworkTopology(): any;
    /**
     * Setup message handling
     */
    private setupMessageHandling;
    /**
     * Handle incoming A2A multimedia messages
     */
    private handleIncomingMessage;
    /**
     * Select optimal agents for a session
     */
    private selectOptimalAgents;
    /**
     * Calculate agent suitability score
     */
    private calculateAgentScore;
    /**
     * Determine agent role in session
     */
    private determineRole;
    /**
     * Select master agent for coordination
     */
    private selectMasterAgent;
    /**
     * Coordinate session setup with all participants
     */
    private coordinateSessionSetup;
    /**
     * Send message to specific agent or broadcast
     */
    private sendMessage;
    /**
     * Broadcast message to all participants in session
     */
    private broadcastToSession;
    /**
     * Broadcast message to all agents
     */
    private broadcastMessage;
    /**
     * Handle stream request message
     */
    private handleStreamRequest;
    /**
     * Handle stream response message
     */
    private handleStreamResponse;
    /**
     * Handle quality change message
     */
    private handleQualityChange;
    /**
     * Handle sync command message
     */
    private handleSyncCommand;
    /**
     * Handle load balance message
     */
    private handleLoadBalance;
    /**
     * Handle failover message
     */
    private handleFailover;
    /**
     * Handle consensus vote message
     */
    private handleConsensusVote;
    /**
     * Handle heartbeat message
     */
    private handleHeartbeat;
    /**
     * Handle coordination message
     */
    private handleCoordination;
    /**
     * Coordinate failover for a session
     */
    private coordinateFailover;
    /**
     * Execute failover action
     */
    private executeFailover;
    /**
     * Degrade session when no replacement available
     */
    private degradeSession;
    /**
     * Execute rebalance action
     */
    private executeRebalanceAction;
    /**
     * Calculate agent load
     */
    private calculateAgentLoad;
    /**
     * Get connection matrix between agents
     */
    private getConnectionMatrix;
    /**
     * Get overall performance metrics
     */
    private getOverallPerformanceMetrics;
    /**
     * Start heartbeat mechanism
     */
    private startHeartbeat;
    /**
     * Check health of all agents
     */
    private checkAgentHealth;
    /**
     * Generate unique proposal ID
     */
    private generateProposalId;
    /**
     * Get next sequence number
     */
    private getNextSequence;
    /**
     * Clean up resources
     */
    cleanup(): void;
}
//# sourceMappingURL=a2a-multimedia-extension.d.ts.map