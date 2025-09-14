/**
 * Gossip Protocol for A2A Memory Propagation
 *
 * Implements epidemic-style information dissemination:
 * - Anti-entropy (periodic full synchronization)
 * - Rumor spreading (push/pull propagation)
 * - Failure detection and recovery
 * - Network partition tolerance
 * - Adaptive gossip based on network conditions
 * - Compression and batching for efficiency
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { VectorClock } from "./vector-clocks.js";
export interface GossipMessage {
    messageId: string;
    type: "update" | "sync_request" | "sync_response" | "heartbeat" | "rumor";
    sourceAgent: string;
    targetAgent?: string;
    vectorClock: VectorClock;
    payload: any;
    ttl: number;
    timestamp: Date;
    path: string[];
    priority: "low" | "medium" | "high" | "critical";
}
export interface GossipNode {
    agentId: string;
    address: string;
    lastSeen: Date;
    isActive: boolean;
    failureCount: number;
    roundTripTime: number;
    reliability: number;
    capacity: {
        bandwidth: number;
        memory: number;
        cpu: number;
    };
}
export interface GossipConfig {
    fanout: number;
    gossipInterval: number;
    maxTTL: number;
    syncInterval: number;
    failureThreshold: number;
    compressionThreshold: number;
    batchSize: number;
    adaptiveGossip: boolean;
    minQuorumThreshold: number;
}
export interface GossipStats {
    messagesSent: number;
    messagesReceived: number;
    duplicatesReceived: number;
    syncRequestsSent: number;
    syncResponsesSent: number;
    failedTransmissions: number;
    averageLatency: number;
    networkUtilization: number;
    compressionRatio: number;
}
/**
 * Main Gossip Protocol Implementation
 */
export declare class GossipProtocol extends EventEmitter {
    private logger;
    private localNode;
    private topology;
    private config;
    private nodes;
    private messageHistory;
    private pendingMessages;
    private sentMessages;
    private gossipTimer?;
    private syncTimer?;
    private cleanupTimer?;
    private stats;
    constructor(localAgent: any, topology: any, config?: Partial<GossipConfig>);
    /**
     * Propagate an update through the network
     */
    propagateUpdate(update: any): Promise<void>;
    /**
     * Handle incoming gossip message
     */
    handleMessage(message: GossipMessage): Promise<void>;
    /**
     * Request synchronization with a specific node
     */
    requestSync(targetAgent: string): Promise<void>;
    /**
     * Add a new node to the gossip network
     */
    addNode(agentId: string, address: string, capacity?: any): void;
    /**
     * Remove a node from the gossip network
     */
    removeNode(agentId: string): void;
    /**
     * Get active nodes in the network
     */
    getActiveNodes(): GossipNode[];
    /**
     * Get gossip statistics
     */
    getStats(): GossipStats;
    /**
     * Calculate minimum quorum size based on threshold
     */
    getMinQuorum(): number;
    /**
     * Check if we have sufficient active nodes for quorum
     */
    hasQuorum(): boolean;
    /**
     * Update quorum threshold
     */
    updateQuorumThreshold(threshold: number): void;
    /**
     * Update gossip configuration
     */
    updateConfig(newConfig: Partial<GossipConfig>): void;
    /**
     * Perform manual anti-entropy synchronization
     */
    performAntiEntropy(): Promise<void>;
    /**
     * Shutdown gossip protocol
     */
    shutdown(): void;
    /**
     * Private methods
     */
    private initializeFromTopology;
    private startGossip;
    private stopGossip;
    private performGossipRound;
    private gossipMessage;
    private selectGossipTargets;
    private sendMessage;
    private sendDirectMessage;
    private continueGossip;
    private handleUpdateMessage;
    private handleSyncRequest;
    private handleSyncResponse;
    private handleHeartbeat;
    private handleRumor;
    private sendHeartbeats;
    private checkNodeFailures;
    private selectNodesForSync;
    private shouldCompressMessage;
    private compressMessage;
    private simulateNetworkDelay;
    private updateNodeInfo;
    private updateNodeLatency;
    private updateNodeFailure;
    private updateCompressionStats;
    private updateNetworkUtilization;
    private determinePriority;
    private generateMessageId;
    private getLastSyncVector;
    private prepareSyncResponse;
    private cleanupOldMessages;
    private sendFarewellMessages;
}
//# sourceMappingURL=gossip-protocol.d.ts.map