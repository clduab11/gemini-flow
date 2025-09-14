/**
 * View Change Protocols and Leader Election
 * Implements robust leader election and view change mechanisms
 * for Byzantine fault-tolerant consensus
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { Agent, ConsensusMessage } from "./byzantine-consensus";
export interface ViewChangeMessage {
    type: "view-change" | "new-view" | "view-change-ack";
    viewNumber: number;
    agentId: string;
    lastStableCheckpoint: number;
    checkpointProof: CheckpointMessage[];
    preparedMessages: PreparedSet[];
    timestamp: Date;
    signature: string;
}
export interface NewViewMessage {
    type: "new-view";
    viewNumber: number;
    viewChangeMessages: ViewChangeMessage[];
    prePrepareMessages: ConsensusMessage[];
    leaderId: string;
    timestamp: Date;
    signature: string;
}
export interface CheckpointMessage {
    sequenceNumber: number;
    digest: string;
    agentId: string;
    timestamp: Date;
    signature: string;
}
export interface PreparedSet {
    sequenceNumber: number;
    digest: string;
    view: number;
    prePrepare: ConsensusMessage;
    prepares: ConsensusMessage[];
}
export interface LeaderCandidate {
    agentId: string;
    reputation: number;
    availability: number;
    performance: number;
    stake: number;
    lastElectionTime: Date;
    electionScore: number;
}
export interface ElectionConfiguration {
    algorithm: "round-robin" | "reputation-based" | "stake-weighted" | "performance-based" | "hybrid";
    term: number;
    heartbeatInterval: number;
    electionTimeout: number;
    maxConsecutiveTerms: number;
}
export interface ViewState {
    currentView: number;
    currentLeader: string;
    viewStartTime: Date;
    lastViewChange: Date;
    viewChangeInProgress: boolean;
    participatingAgents: Set<string>;
    suspectedFaultyAgents: Set<string>;
}
export declare class ViewChangeLeaderElection extends EventEmitter {
    private nodeId;
    private totalAgents;
    private viewState;
    private agents;
    private viewChangeMessages;
    private checkpoints;
    private leaderCandidates;
    private electionHistory;
    private consecutiveTerms;
    private readonly config;
    private heartbeatTimer;
    private electionTimer;
    constructor(nodeId: string, totalAgents?: number, config?: Partial<ElectionConfiguration>);
    /**
     * Register an agent for leader election
     */
    registerAgent(agent: Agent): void;
    /**
     * Remove an agent from leader election
     */
    removeAgent(agentId: string): void;
    /**
     * Initiate view change
     */
    initiateViewChange(reason: string): Promise<void>;
    /**
     * Process incoming view change message
     */
    processViewChangeMessage(message: ViewChangeMessage): Promise<void>;
    /**
     * Process view change when enough messages are received
     */
    private processViewChange;
    /**
     * Send new-view message as the new leader
     */
    private sendNewViewMessage;
    /**
     * Process new-view message
     */
    processNewViewMessage(message: NewViewMessage): Promise<void>;
    /**
     * Elect leader based on configured algorithm
     */
    private electLeader;
    /**
     * Round-robin leader election
     */
    private roundRobinElection;
    /**
     * Reputation-based leader election
     */
    private reputationBasedElection;
    /**
     * Stake-weighted leader election
     */
    private stakeWeightedElection;
    /**
     * Performance-based leader election
     */
    private performanceBasedElection;
    /**
     * Hybrid leader election (combines multiple factors)
     */
    private hybridElection;
    /**
     * Update candidate performance metrics
     */
    updateCandidateMetrics(agentId: string, metrics: {
        reputation?: number;
        availability?: number;
        performance?: number;
        stake?: number;
    }): void;
    /**
     * Start heartbeat monitoring
     */
    private startHeartbeatMonitoring;
    /**
     * Check leader heartbeat
     */
    private checkLeaderHeartbeat;
    /**
     * Send heartbeat as leader
     */
    private sendHeartbeat;
    /**
     * Process heartbeat message
     */
    processHeartbeat(heartbeat: any): void;
    /**
     * Start election timeout
     */
    private startElectionTimeout;
    /**
     * Create view change message
     */
    private createViewChangeMessage;
    /**
     * Validate view change message
     */
    private validateViewChangeMessage;
    /**
     * Validate new-view message
     */
    private validateNewViewMessage;
    /**
     * Construct pre-prepare messages for new view
     */
    private constructPrePrepareMessages;
    /**
     * Get last stable checkpoint
     */
    private getLastStableCheckpoint;
    /**
     * Get checkpoint proof
     */
    private getCheckpointProof;
    /**
     * Get prepared messages
     */
    private getPreparedMessages;
    /**
     * Broadcast view change message
     */
    private broadcastViewChangeMessage;
    /**
     * Broadcast new-view message
     */
    private broadcastNewViewMessage;
    /**
     * Broadcast message to all agents
     */
    private broadcastMessage;
    /**
     * Sign message
     */
    private signMessage;
    /**
     * Get current view state
     */
    getViewState(): ViewState;
    /**
     * Get leader election statistics
     */
    getElectionStatistics(): {
        totalElections: number;
        currentLeader: string;
        currentView: number;
        leadershipChanges: number;
        averageTermLength: number;
        candidateScores: Map<string, number>;
    };
    /**
     * Get minimum quorum size for Byzantine consensus
     */
    getMinQuorum(): number;
    /**
     * Check if we have sufficient active agents for quorum
     */
    hasQuorum(): boolean;
    /**
     * Cleanup resources
     */
    cleanup(): void;
}
export default ViewChangeLeaderElection;
//# sourceMappingURL=view-change-leader-election.d.ts.map