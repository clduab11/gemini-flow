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
import { EventEmitter } from "events";
export class RaftConsensus extends EventEmitter {
    nodeId;
    nodes = new Map();
    state;
    currentState = "follower";
    // Timers
    electionTimer = null;
    heartbeatTimer = null;
    // Configuration
    minQuorum; // Raft: Math.floor(n/2) + 1
    electionTimeoutMin = 150; // ms
    electionTimeoutMax = 300; // ms
    heartbeatInterval = 50; // ms
    // Performance tracking
    performance;
    constructor(nodeId, totalNodes = 3) {
        super();
        if (totalNodes < 1) {
            throw new Error("Raft requires at least 1 node");
        }
        this.nodeId = nodeId;
        this.minQuorum = Math.floor(totalNodes / 2) + 1;
        this.state = {
            currentTerm: 0,
            votedFor: null,
            log: [],
            commitIndex: 0,
            lastApplied: 0,
            nextIndex: new Map(),
            matchIndex: new Map(),
            votesReceived: new Set(),
            electionTimeout: this.randomElectionTimeout(),
            heartbeatInterval: this.heartbeatInterval,
        };
        this.performance = {
            electionsHeld: 0,
            termChanges: 0,
            logEntriesApplied: 0,
            averageElectionTime: 0,
            leadershipDuration: 0,
        };
        this.startElectionTimeout();
    }
    /**
     * Add a node to the Raft cluster
     */
    addNode(node) {
        this.nodes.set(node.id, node);
        if (this.currentState === "leader") {
            // Initialize leader state for new node
            this.state.nextIndex.set(node.id, this.state.log.length + 1);
            this.state.matchIndex.set(node.id, 0);
        }
        this.emit("node-added", node);
    }
    /**
     * Remove a node from the Raft cluster
     */
    removeNode(nodeId) {
        this.nodes.delete(nodeId);
        this.state.nextIndex.delete(nodeId);
        this.state.matchIndex.delete(nodeId);
        this.state.votesReceived.delete(nodeId);
        this.emit("node-removed", nodeId);
    }
    /**
     * Append a command to the log (leader only)
     */
    async appendCommand(command) {
        if (this.currentState !== "leader") {
            throw new Error("Only leader can append commands");
        }
        if (!this.hasQuorum()) {
            throw new Error("Insufficient nodes for quorum");
        }
        const logEntry = {
            index: this.state.log.length + 1,
            term: this.state.currentTerm,
            command: command,
            timestamp: new Date(),
            committed: false,
        };
        this.state.log.push(logEntry);
        // Replicate to followers
        const success = await this.replicateEntry(logEntry);
        if (success) {
            logEntry.committed = true;
            this.state.commitIndex = logEntry.index;
            this.applyLogEntries();
            this.emit("command-committed", { command, index: logEntry.index });
        }
        return success;
    }
    /**
     * Process incoming Raft message
     */
    async processMessage(message) {
        // Update term if message has higher term
        if (message.term > this.state.currentTerm) {
            this.state.currentTerm = message.term;
            this.state.votedFor = null;
            this.becomeFollower();
            this.performance.termChanges++;
        }
        switch (message.type) {
            case "request-vote":
                await this.handleRequestVote(message);
                break;
            case "vote-response":
                await this.handleVoteResponse(message);
                break;
            case "append-entries":
                await this.handleAppendEntries(message);
                break;
            case "append-response":
                await this.handleAppendResponse(message);
                break;
        }
    }
    /**
     * Start election process
     */
    async startElection() {
        const electionStart = Date.now();
        this.performance.electionsHeld++;
        this.becomeCandidate();
        // Vote for ourselves
        this.state.votesReceived.add(this.nodeId);
        // Request votes from other nodes
        const requestVoteMessage = {
            type: "request-vote",
            term: this.state.currentTerm,
            senderId: this.nodeId,
            candidateId: this.nodeId,
            lastLogIndex: this.state.log.length,
            lastLogTerm: this.state.log.length > 0
                ? this.state.log[this.state.log.length - 1].term
                : 0,
            timestamp: new Date(),
        };
        await this.broadcastMessage(requestVoteMessage);
        // Check if we have majority
        if (this.state.votesReceived.size >= this.minQuorum) {
            const electionTime = Date.now() - electionStart;
            this.updateElectionTime(electionTime);
            this.becomeLeader();
        }
    }
    /**
     * Handle RequestVote RPC
     */
    async handleRequestVote(message) {
        let voteGranted = false;
        // Don't vote if we already voted for someone else in this term
        if (this.state.votedFor === null ||
            this.state.votedFor === message.candidateId) {
            // Check if candidate's log is at least as up-to-date as ours
            const ourLastLogIndex = this.state.log.length;
            const ourLastLogTerm = ourLastLogIndex > 0 ? this.state.log[ourLastLogIndex - 1].term : 0;
            const candidateLogUpToDate = message.lastLogTerm > ourLastLogTerm ||
                (message.lastLogTerm === ourLastLogTerm &&
                    message.lastLogIndex >= ourLastLogIndex);
            if (candidateLogUpToDate) {
                voteGranted = true;
                this.state.votedFor = message.candidateId;
                this.resetElectionTimeout();
            }
        }
        const response = {
            type: "vote-response",
            term: this.state.currentTerm,
            senderId: this.nodeId,
            targetId: message.senderId,
            voteGranted: voteGranted,
            timestamp: new Date(),
        };
        await this.sendMessage(message.senderId, response);
    }
    /**
     * Handle vote response
     */
    async handleVoteResponse(message) {
        if (this.currentState !== "candidate" ||
            message.term !== this.state.currentTerm) {
            return;
        }
        if (message.voteGranted) {
            this.state.votesReceived.add(message.senderId);
            // Check if we have majority
            if (this.state.votesReceived.size >= this.minQuorum) {
                this.becomeLeader();
            }
        }
    }
    /**
     * Handle AppendEntries RPC
     */
    async handleAppendEntries(message) {
        let success = false;
        let matchIndex = 0;
        // Reset election timeout - we received heartbeat/entries from leader
        this.resetElectionTimeout();
        if (message.term >= this.state.currentTerm) {
            this.becomeFollower();
            // Check if log matches
            if (message.prevLogIndex === 0 ||
                (this.state.log.length >= message.prevLogIndex &&
                    this.state.log[message.prevLogIndex - 1].term ===
                        message.prevLogTerm)) {
                success = true;
                // Append new entries
                if (message.entries && message.entries.length > 0) {
                    // Remove conflicting entries
                    this.state.log = this.state.log.slice(0, message.prevLogIndex);
                    // Append new entries
                    this.state.log.push(...message.entries);
                    matchIndex = this.state.log.length;
                }
                // Update commit index
                if (message.leaderCommit > this.state.commitIndex) {
                    this.state.commitIndex = Math.min(message.leaderCommit, this.state.log.length);
                    this.applyLogEntries();
                }
            }
        }
        const response = {
            type: "append-response",
            term: this.state.currentTerm,
            senderId: this.nodeId,
            targetId: message.senderId,
            success: success,
            matchIndex: matchIndex,
            timestamp: new Date(),
        };
        await this.sendMessage(message.senderId, response);
    }
    /**
     * Handle append entries response
     */
    async handleAppendResponse(message) {
        if (this.currentState !== "leader" ||
            message.term !== this.state.currentTerm) {
            return;
        }
        const nodeId = message.senderId;
        if (message.success) {
            // Update follower's indices
            this.state.nextIndex.set(nodeId, message.matchIndex + 1);
            this.state.matchIndex.set(nodeId, message.matchIndex);
            // Check if we can commit more entries
            this.updateCommitIndex();
        }
        else {
            // Decrement nextIndex and retry
            const currentNext = this.state.nextIndex.get(nodeId) || 1;
            this.state.nextIndex.set(nodeId, Math.max(1, currentNext - 1));
            // Retry sending entries
            await this.sendAppendEntries(nodeId);
        }
    }
    /**
     * Replicate log entry to followers
     */
    async replicateEntry(entry) {
        if (this.currentState !== "leader") {
            return false;
        }
        const responses = new Set();
        responses.add(this.nodeId); // Leader counts as success
        // Send to all followers
        const promises = [];
        for (const nodeId of this.nodes.keys()) {
            if (nodeId !== this.nodeId) {
                promises.push(this.sendAppendEntries(nodeId));
            }
        }
        await Promise.all(promises);
        // Wait for majority to respond successfully
        return new Promise((resolve) => {
            const checkCommit = () => {
                const committed = Array.from(this.state.matchIndex.values()).filter((index) => index >= entry.index).length + 1; // +1 for leader
                if (committed >= this.minQuorum) {
                    resolve(true);
                }
            };
            this.on("append-success", checkCommit);
            // Timeout after reasonable time
            setTimeout(() => {
                this.off("append-success", checkCommit);
                resolve(false);
            }, 1000);
            checkCommit(); // Initial check
        });
    }
    /**
     * Send AppendEntries to a specific node
     */
    async sendAppendEntries(nodeId) {
        const nextIndex = this.state.nextIndex.get(nodeId) || 1;
        const prevLogIndex = nextIndex - 1;
        const prevLogTerm = prevLogIndex > 0 ? this.state.log[prevLogIndex - 1].term : 0;
        const entries = this.state.log.slice(nextIndex - 1);
        const message = {
            type: "append-entries",
            term: this.state.currentTerm,
            senderId: this.nodeId,
            targetId: nodeId,
            leaderId: this.nodeId,
            prevLogIndex: prevLogIndex,
            prevLogTerm: prevLogTerm,
            entries: entries,
            leaderCommit: this.state.commitIndex,
            timestamp: new Date(),
        };
        await this.sendMessage(nodeId, message);
    }
    /**
     * Update commit index based on majority replication
     */
    updateCommitIndex() {
        if (this.currentState !== "leader") {
            return;
        }
        // Find highest index replicated on majority
        const indices = [this.state.log.length]; // Leader's log length
        for (const matchIndex of this.state.matchIndex.values()) {
            indices.push(matchIndex);
        }
        indices.sort((a, b) => b - a);
        // Get the index that majority has replicated
        const majorityIndex = indices[this.minQuorum - 1];
        if (majorityIndex > this.state.commitIndex &&
            majorityIndex <= this.state.log.length &&
            this.state.log[majorityIndex - 1].term === this.state.currentTerm) {
            this.state.commitIndex = majorityIndex;
            this.applyLogEntries();
            // Mark entries as committed
            for (let i = 0; i < majorityIndex; i++) {
                this.state.log[i].committed = true;
            }
        }
    }
    /**
     * Apply committed log entries
     */
    applyLogEntries() {
        while (this.state.lastApplied < this.state.commitIndex) {
            this.state.lastApplied++;
            const entry = this.state.log[this.state.lastApplied - 1];
            this.emit("command-applied", {
                command: entry.command,
                index: entry.index,
            });
            this.performance.logEntriesApplied++;
        }
    }
    /**
     * Transition to follower state
     */
    becomeFollower() {
        if (this.currentState === "leader") {
            this.performance.leadershipDuration +=
                Date.now() - this.state.leaderStartTime || 0;
        }
        this.currentState = "follower";
        this.clearHeartbeatTimer();
        this.resetElectionTimeout();
        this.emit("state-changed", "follower");
    }
    /**
     * Transition to candidate state
     */
    becomeCandidate() {
        this.currentState = "candidate";
        this.state.currentTerm++;
        this.state.votedFor = this.nodeId;
        this.state.votesReceived.clear();
        this.clearElectionTimer();
        this.resetElectionTimeout();
        this.emit("state-changed", "candidate");
    }
    /**
     * Transition to leader state
     */
    becomeLeader() {
        this.currentState = "leader";
        this.state.leaderStartTime = Date.now();
        // Initialize leader state
        for (const nodeId of this.nodes.keys()) {
            this.state.nextIndex.set(nodeId, this.state.log.length + 1);
            this.state.matchIndex.set(nodeId, 0);
        }
        this.clearElectionTimer();
        this.startHeartbeat();
        this.emit("state-changed", "leader");
        this.emit("leader-elected", this.nodeId);
    }
    /**
     * Start sending heartbeats (leader only)
     */
    startHeartbeat() {
        this.heartbeatTimer = setInterval(() => {
            this.sendHeartbeats();
        }, this.heartbeatInterval);
    }
    /**
     * Send heartbeat to all followers
     */
    async sendHeartbeats() {
        if (this.currentState !== "leader") {
            return;
        }
        for (const nodeId of this.nodes.keys()) {
            if (nodeId !== this.nodeId) {
                await this.sendAppendEntries(nodeId);
            }
        }
    }
    /**
     * Start election timeout
     */
    startElectionTimeout() {
        this.electionTimer = setTimeout(() => {
            if (this.currentState !== "leader") {
                this.startElection();
            }
        }, this.state.electionTimeout);
    }
    /**
     * Reset election timeout
     */
    resetElectionTimeout() {
        this.clearElectionTimer();
        this.state.electionTimeout = this.randomElectionTimeout();
        this.startElectionTimeout();
    }
    /**
     * Generate random election timeout
     */
    randomElectionTimeout() {
        return (Math.floor(Math.random() * (this.electionTimeoutMax - this.electionTimeoutMin)) + this.electionTimeoutMin);
    }
    /**
     * Clear election timer
     */
    clearElectionTimer() {
        if (this.electionTimer) {
            clearTimeout(this.electionTimer);
            this.electionTimer = null;
        }
    }
    /**
     * Clear heartbeat timer
     */
    clearHeartbeatTimer() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }
    /**
     * Update election time statistics
     */
    updateElectionTime(electionTime) {
        if (this.performance.electionsHeld === 1) {
            this.performance.averageElectionTime = electionTime;
        }
        else {
            this.performance.averageElectionTime =
                (this.performance.averageElectionTime *
                    (this.performance.electionsHeld - 1) +
                    electionTime) /
                    this.performance.electionsHeld;
        }
    }
    /**
     * Send message to specific node
     */
    async sendMessage(nodeId, message) {
        // Simulate network communication
        this.emit("send-message", { nodeId, message });
    }
    /**
     * Broadcast message to all nodes
     */
    async broadcastMessage(message) {
        for (const nodeId of this.nodes.keys()) {
            if (nodeId !== this.nodeId) {
                await this.sendMessage(nodeId, message);
            }
        }
    }
    /**
     * Get minimum quorum size for Raft consensus
     */
    getMinQuorum() {
        return this.minQuorum;
    }
    /**
     * Check if we have sufficient nodes for quorum
     */
    hasQuorum() {
        const activeNodes = Array.from(this.nodes.values()).filter((node) => node.isActive).length +
            1; // +1 for self
        return activeNodes >= this.minQuorum;
    }
    /**
     * Get current state
     */
    getCurrentState() {
        return this.currentState;
    }
    /**
     * Get current term
     */
    getCurrentTerm() {
        return this.state.currentTerm;
    }
    /**
     * Get current leader
     */
    getCurrentLeader() {
        if (this.currentState === "leader") {
            return this.nodeId;
        }
        // In a real implementation, we'd track the current leader
        return null;
    }
    /**
     * Get log entries
     */
    getLog() {
        return [...this.state.log];
    }
    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        return { ...this.performance };
    }
    /**
     * Get Raft state information
     */
    getRaftState() {
        return {
            nodeId: this.nodeId,
            state: this.currentState,
            term: this.state.currentTerm,
            logLength: this.state.log.length,
            commitIndex: this.state.commitIndex,
            lastApplied: this.state.lastApplied,
            quorumSize: this.minQuorum,
            hasQuorum: this.hasQuorum(),
        };
    }
    /**
     * Shutdown the Raft node
     */
    shutdown() {
        this.clearElectionTimer();
        this.clearHeartbeatTimer();
        this.currentState = "follower";
        this.emit("shutdown");
    }
}
export default RaftConsensus;
//# sourceMappingURL=raft-consensus.js.map