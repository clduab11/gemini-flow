/**
 * Raft Consensus Protocol Implementation
 *
 * Implements the Raft consensus algorithm for distributed systems:
 * - Leader election
 * - Log replication
 * - Safety guarantees
 * - Membership changes
 *
 * Raft requires a majority quorum: Math.floor(n/2) + 1
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
export interface RaftNode {
    id: string;
    address: string;
    state: "follower" | "candidate" | "leader";
    currentTerm: number;
    votedFor: string | null;
    lastHeartbeat: Date;
    isActive: boolean;
}
export interface LogEntry {
    index: number;
    term: number;
    command: any;
    timestamp: Date;
    committed: boolean;
}
export interface RaftMessage {
    type: "request-vote" | "vote-response" | "append-entries" | "append-response";
    term: number;
    senderId: string;
    targetId?: string;
    candidateId?: string;
    lastLogIndex?: number;
    lastLogTerm?: number;
    leaderId?: string;
    prevLogIndex?: number;
    prevLogTerm?: number;
    entries?: LogEntry[];
    leaderCommit?: number;
    success?: boolean;
    voteGranted?: boolean;
    matchIndex?: number;
    timestamp: Date;
}
export interface RaftState {
    currentTerm: number;
    votedFor: string | null;
    log: LogEntry[];
    commitIndex: number;
    lastApplied: number;
    nextIndex: Map<string, number>;
    matchIndex: Map<string, number>;
    votesReceived: Set<string>;
    electionTimeout: number;
    heartbeatInterval: number;
}
export declare class RaftConsensus extends EventEmitter {
    private nodeId;
    private nodes;
    private state;
    private currentState;
    private electionTimer;
    private heartbeatTimer;
    private readonly minQuorum;
    private readonly electionTimeoutMin;
    private readonly electionTimeoutMax;
    private readonly heartbeatInterval;
    private performance;
    constructor(nodeId: string, totalNodes?: number);
    /**
     * Add a node to the Raft cluster
     */
    addNode(node: RaftNode): void;
    /**
     * Remove a node from the Raft cluster
     */
    removeNode(nodeId: string): void;
    /**
     * Append a command to the log (leader only)
     */
    appendCommand(command: any): Promise<boolean>;
    /**
     * Process incoming Raft message
     */
    processMessage(message: RaftMessage): Promise<void>;
    /**
     * Start election process
     */
    private startElection;
    /**
     * Handle RequestVote RPC
     */
    private handleRequestVote;
    /**
     * Handle vote response
     */
    private handleVoteResponse;
    /**
     * Handle AppendEntries RPC
     */
    private handleAppendEntries;
    /**
     * Handle append entries response
     */
    private handleAppendResponse;
    /**
     * Replicate log entry to followers
     */
    private replicateEntry;
    /**
     * Send AppendEntries to a specific node
     */
    private sendAppendEntries;
    /**
     * Update commit index based on majority replication
     */
    private updateCommitIndex;
    /**
     * Apply committed log entries
     */
    private applyLogEntries;
    /**
     * Transition to follower state
     */
    private becomeFollower;
    /**
     * Transition to candidate state
     */
    private becomeCandidate;
    /**
     * Transition to leader state
     */
    private becomeLeader;
    /**
     * Start sending heartbeats (leader only)
     */
    private startHeartbeat;
    /**
     * Send heartbeat to all followers
     */
    private sendHeartbeats;
    /**
     * Start election timeout
     */
    private startElectionTimeout;
    /**
     * Reset election timeout
     */
    private resetElectionTimeout;
    /**
     * Generate random election timeout
     */
    private randomElectionTimeout;
    /**
     * Clear election timer
     */
    private clearElectionTimer;
    /**
     * Clear heartbeat timer
     */
    private clearHeartbeatTimer;
    /**
     * Update election time statistics
     */
    private updateElectionTime;
    /**
     * Send message to specific node
     */
    private sendMessage;
    /**
     * Broadcast message to all nodes
     */
    private broadcastMessage;
    /**
     * Get minimum quorum size for Raft consensus
     */
    getMinQuorum(): number;
    /**
     * Check if we have sufficient nodes for quorum
     */
    hasQuorum(): boolean;
    /**
     * Get current state
     */
    getCurrentState(): "follower" | "candidate" | "leader";
    /**
     * Get current term
     */
    getCurrentTerm(): number;
    /**
     * Get current leader
     */
    getCurrentLeader(): string | null;
    /**
     * Get log entries
     */
    getLog(): LogEntry[];
    /**
     * Get performance metrics
     */
    getPerformanceMetrics(): typeof this.performance;
    /**
     * Get Raft state information
     */
    getRaftState(): {
        nodeId: string;
        state: string;
        term: number;
        logLength: number;
        commitIndex: number;
        lastApplied: number;
        quorumSize: number;
        hasQuorum: boolean;
    };
    /**
     * Shutdown the Raft node
     */
    shutdown(): void;
}
export default RaftConsensus;
//# sourceMappingURL=raft-consensus.d.ts.map