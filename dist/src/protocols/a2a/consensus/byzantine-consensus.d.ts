/**
 * Byzantine Fault-Tolerant Consensus System
 * Implements PBFT (Practical Byzantine Fault Tolerance) algorithm
 * Handles up to 33% malicious agents while maintaining correctness
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
export interface Agent {
    id: string;
    publicKey: string;
    isLeader: boolean;
    isMalicious?: boolean;
    reputation: number;
    lastActiveTime: Date;
}
export interface ConsensusMessage {
    type: "pre-prepare" | "prepare" | "commit" | "view-change" | "new-view";
    viewNumber: number;
    sequenceNumber: number;
    digest: string;
    payload: any;
    timestamp: Date;
    signature: string;
    senderId: string;
}
export interface ConsensusProposal {
    id: string;
    content: any;
    proposerId: string;
    timestamp: Date;
    hash: string;
}
export interface ConsensusState {
    currentView: number;
    sequenceNumber: number;
    phase: "pre-prepare" | "prepare" | "commit" | "view-change";
    leader: string;
    activeAgents: Set<string>;
    proposals: Map<string, ConsensusProposal>;
    messages: Map<string, ConsensusMessage[]>;
    committed: Set<string>;
}
export declare class ByzantineConsensus extends EventEmitter {
    private agentId;
    private totalAgents;
    private agents;
    private state;
    private messageLog;
    private faultThreshold;
    private minQuorum;
    private timeoutDuration;
    private viewChangeTimeout;
    private performance;
    constructor(agentId: string, totalAgents?: number);
    private initializeState;
    /**
     * Register an agent in the consensus network
     */
    registerAgent(agent: Agent): void;
    /**
     * Remove an agent from the consensus network
     */
    removeAgent(agentId: string): void;
    /**
     * Start consensus round for a proposal
     */
    startConsensus(proposal: ConsensusProposal): Promise<boolean>;
    /**
     * Process incoming consensus message
     */
    processMessage(message: ConsensusMessage): Promise<void>;
    private broadcastPrePrepare;
    private handlePrePrepare;
    private collectPrepareResponses;
    private handlePrepare;
    private collectCommitResponses;
    private handleCommit;
    private initiateViewChange;
    private handleViewChange;
    private sendNewView;
    private handleNewView;
    private selectLeader;
    private isLeader;
    private validateMessage;
    private signMessage;
    private broadcastMessage;
    private updatePerformance;
    /**
     * Get current consensus state
     */
    getState(): ConsensusState;
    /**
     * Get performance metrics
     */
    getPerformanceMetrics(): typeof this.performance;
    /**
     * Check if consensus can be reached with current network
     */
    canReachConsensus(): boolean;
    /**
     * Get minimum quorum size for Byzantine consensus
     */
    getMinQuorum(): number;
    /**
     * Check if we have sufficient nodes for quorum
     */
    hasQuorum(): boolean;
    /**
     * Simulate network partition
     */
    simulatePartition(agentIds: string[]): void;
    /**
     * Heal network partition
     */
    healPartition(agentIds: string[]): void;
}
export default ByzantineConsensus;
//# sourceMappingURL=byzantine-consensus.d.ts.map