/**
 * View Change Protocols and Leader Election
 * Implements robust leader election and view change mechanisms
 * for Byzantine fault-tolerant consensus
 */
import { EventEmitter } from "events";
import { createHash } from "crypto";
export class ViewChangeLeaderElection extends EventEmitter {
    nodeId;
    totalAgents;
    viewState;
    agents = new Map();
    viewChangeMessages = new Map();
    checkpoints = new Map();
    leaderCandidates = new Map();
    electionHistory = new Map(); // view -> leader
    consecutiveTerms = new Map();
    config;
    heartbeatTimer = null;
    electionTimer = null;
    constructor(nodeId, totalAgents = 4, config = {}) {
        super();
        this.nodeId = nodeId;
        this.totalAgents = totalAgents;
        this.config = {
            algorithm: "hybrid",
            term: 60000, // 1 minute
            heartbeatInterval: 5000, // 5 seconds
            electionTimeout: 15000, // 15 seconds
            maxConsecutiveTerms: 3,
            ...config,
        };
        this.viewState = {
            currentView: 0,
            currentLeader: "",
            viewStartTime: new Date(),
            lastViewChange: new Date(),
            viewChangeInProgress: false,
            participatingAgents: new Set(),
            suspectedFaultyAgents: new Set(),
        };
        this.startHeartbeatMonitoring();
    }
    /**
     * Register an agent for leader election
     */
    registerAgent(agent) {
        this.agents.set(agent.id, agent);
        this.viewState.participatingAgents.add(agent.id);
        // Initialize leader candidate
        this.leaderCandidates.set(agent.id, {
            agentId: agent.id,
            reputation: agent.reputation,
            availability: 1.0,
            performance: 1.0,
            stake: 1.0,
            lastElectionTime: new Date(0),
            electionScore: 0,
        });
        // If this is the first agent and no leader is set, elect it
        if (this.viewState.currentLeader === "" &&
            this.viewState.participatingAgents.size === 1) {
            this.electLeader(0);
        }
        this.emit("agent-registered", agent);
    }
    /**
     * Remove an agent from leader election
     */
    removeAgent(agentId) {
        this.agents.delete(agentId);
        this.viewState.participatingAgents.delete(agentId);
        this.leaderCandidates.delete(agentId);
        // If the removed agent was the leader, trigger view change
        if (this.viewState.currentLeader === agentId) {
            this.initiateViewChange("leader-failure");
        }
        this.emit("agent-removed", agentId);
    }
    /**
     * Initiate view change
     */
    async initiateViewChange(reason) {
        if (this.viewState.viewChangeInProgress) {
            return; // View change already in progress
        }
        this.viewState.viewChangeInProgress = true;
        this.viewState.lastViewChange = new Date();
        const newView = this.viewState.currentView + 1;
        console.log(`Initiating view change to view ${newView}. Reason: ${reason}`);
        // Create view change message
        const viewChangeMessage = await this.createViewChangeMessage(newView);
        // Store our view change message
        if (!this.viewChangeMessages.has(newView)) {
            this.viewChangeMessages.set(newView, []);
        }
        this.viewChangeMessages.get(newView).push(viewChangeMessage);
        // Broadcast view change message
        await this.broadcastViewChangeMessage(viewChangeMessage);
        // Start election timeout
        this.startElectionTimeout(newView);
        this.emit("view-change-initiated", { newView, reason });
    }
    /**
     * Process incoming view change message
     */
    async processViewChangeMessage(message) {
        if (!this.validateViewChangeMessage(message)) {
            this.emit("invalid-view-change-message", message);
            return;
        }
        // Store the message
        if (!this.viewChangeMessages.has(message.viewNumber)) {
            this.viewChangeMessages.set(message.viewNumber, []);
        }
        const messages = this.viewChangeMessages.get(message.viewNumber);
        // Avoid duplicate messages
        if (messages.some((m) => m.agentId === message.agentId)) {
            return;
        }
        messages.push(message);
        // Check if we have enough view change messages (Byzantine quorum)
        const faultThreshold = Math.floor((this.totalAgents - 1) / 3);
        const requiredMessages = 2 * faultThreshold + 1; // Byzantine minimum quorum
        if (messages.length >= requiredMessages) {
            await this.processViewChange(message.viewNumber);
        }
        this.emit("view-change-message-received", message);
    }
    /**
     * Process view change when enough messages are received
     */
    async processViewChange(viewNumber) {
        const newLeader = this.electLeader(viewNumber);
        if (newLeader === this.nodeId) {
            // We are the new leader, send new-view message
            await this.sendNewViewMessage(viewNumber);
        }
        // Update view state
        this.viewState.currentView = viewNumber;
        this.viewState.currentLeader = newLeader;
        this.viewState.viewStartTime = new Date();
        this.viewState.viewChangeInProgress = false;
        // Record election
        this.electionHistory.set(viewNumber, newLeader);
        // Update consecutive terms
        const prevTerms = this.consecutiveTerms.get(newLeader) || 0;
        this.consecutiveTerms.set(newLeader, prevTerms + 1);
        // Reset other agents' consecutive terms
        for (const [agentId, terms] of this.consecutiveTerms.entries()) {
            if (agentId !== newLeader) {
                this.consecutiveTerms.set(agentId, 0);
            }
        }
        this.emit("view-changed", {
            viewNumber,
            newLeader,
            previousLeader: this.viewState.currentLeader,
        });
    }
    /**
     * Send new-view message as the new leader
     */
    async sendNewViewMessage(viewNumber) {
        const viewChangeMessages = this.viewChangeMessages.get(viewNumber) || [];
        const newViewMessage = {
            type: "new-view",
            viewNumber,
            viewChangeMessages,
            prePrepareMessages: this.constructPrePrepareMessages(viewChangeMessages),
            leaderId: this.nodeId,
            timestamp: new Date(),
            signature: this.signMessage(`new-view-${viewNumber}`),
        };
        await this.broadcastNewViewMessage(newViewMessage);
        this.emit("new-view-sent", newViewMessage);
    }
    /**
     * Process new-view message
     */
    async processNewViewMessage(message) {
        if (!this.validateNewViewMessage(message)) {
            this.emit("invalid-new-view-message", message);
            return;
        }
        // Accept the new view
        this.viewState.currentView = message.viewNumber;
        this.viewState.currentLeader = message.leaderId;
        this.viewState.viewStartTime = new Date();
        this.viewState.viewChangeInProgress = false;
        this.emit("new-view-accepted", message);
    }
    /**
     * Elect leader based on configured algorithm
     */
    electLeader(viewNumber) {
        const candidates = Array.from(this.leaderCandidates.values()).filter((candidate) => this.viewState.participatingAgents.has(candidate.agentId) &&
            !this.viewState.suspectedFaultyAgents.has(candidate.agentId));
        if (candidates.length === 0) {
            throw new Error("No valid candidates for leader election");
        }
        switch (this.config.algorithm) {
            case "round-robin":
                return this.roundRobinElection(viewNumber, candidates);
            case "reputation-based":
                return this.reputationBasedElection(candidates);
            case "stake-weighted":
                return this.stakeWeightedElection(candidates);
            case "performance-based":
                return this.performanceBasedElection(candidates);
            case "hybrid":
                return this.hybridElection(candidates);
            default:
                return candidates[0].agentId;
        }
    }
    /**
     * Round-robin leader election
     */
    roundRobinElection(viewNumber, candidates) {
        const sortedCandidates = candidates.sort((a, b) => a.agentId.localeCompare(b.agentId));
        const index = viewNumber % sortedCandidates.length;
        return sortedCandidates[index].agentId;
    }
    /**
     * Reputation-based leader election
     */
    reputationBasedElection(candidates) {
        return candidates.reduce((best, current) => current.reputation > best.reputation ? current : best).agentId;
    }
    /**
     * Stake-weighted leader election
     */
    stakeWeightedElection(candidates) {
        return candidates.reduce((best, current) => current.stake > best.stake ? current : best).agentId;
    }
    /**
     * Performance-based leader election
     */
    performanceBasedElection(candidates) {
        return candidates.reduce((best, current) => current.performance > best.performance ? current : best).agentId;
    }
    /**
     * Hybrid leader election (combines multiple factors)
     */
    hybridElection(candidates) {
        // Calculate election scores
        candidates.forEach((candidate) => {
            const consecutiveTerms = this.consecutiveTerms.get(candidate.agentId) || 0;
            const termPenalty = consecutiveTerms >= this.config.maxConsecutiveTerms ? 0.5 : 1.0;
            candidate.electionScore =
                (candidate.reputation * 0.3 +
                    candidate.availability * 0.25 +
                    candidate.performance * 0.25 +
                    candidate.stake * 0.2) *
                    termPenalty;
        });
        return candidates.reduce((best, current) => current.electionScore > best.electionScore ? current : best).agentId;
    }
    /**
     * Update candidate performance metrics
     */
    updateCandidateMetrics(agentId, metrics) {
        const candidate = this.leaderCandidates.get(agentId);
        if (candidate) {
            Object.assign(candidate, metrics);
            this.emit("candidate-metrics-updated", { agentId, metrics });
        }
    }
    /**
     * Start heartbeat monitoring
     */
    startHeartbeatMonitoring() {
        this.heartbeatTimer = setInterval(() => {
            this.checkLeaderHeartbeat();
        }, this.config.heartbeatInterval);
    }
    /**
     * Check leader heartbeat
     */
    checkLeaderHeartbeat() {
        if (this.viewState.currentLeader === this.nodeId) {
            // We are the leader, send heartbeat
            this.sendHeartbeat();
        }
        else {
            // Check if we've received heartbeat from leader
            const timeSinceLastHeartbeat = Date.now() - this.viewState.viewStartTime.getTime();
            if (timeSinceLastHeartbeat > this.config.electionTimeout) {
                // Leader appears to be down, initiate view change
                this.initiateViewChange("leader-timeout");
            }
        }
    }
    /**
     * Send heartbeat as leader
     */
    sendHeartbeat() {
        const heartbeat = {
            type: "heartbeat",
            viewNumber: this.viewState.currentView,
            leaderId: this.nodeId,
            timestamp: new Date(),
            signature: this.signMessage(`heartbeat-${this.viewState.currentView}`),
        };
        this.broadcastMessage(heartbeat);
        this.emit("heartbeat-sent", heartbeat);
    }
    /**
     * Process heartbeat message
     */
    processHeartbeat(heartbeat) {
        if (heartbeat.leaderId === this.viewState.currentLeader) {
            // Update view start time to reset timeout
            this.viewState.viewStartTime = new Date();
            this.emit("heartbeat-received", heartbeat);
        }
    }
    /**
     * Start election timeout
     */
    startElectionTimeout(viewNumber) {
        if (this.electionTimer) {
            clearTimeout(this.electionTimer);
        }
        this.electionTimer = setTimeout(() => {
            if (this.viewState.currentView < viewNumber) {
                // Election timeout, try again
                this.initiateViewChange("election-timeout");
            }
        }, this.config.electionTimeout);
    }
    /**
     * Create view change message
     */
    async createViewChangeMessage(viewNumber) {
        const lastStableCheckpoint = this.getLastStableCheckpoint();
        const checkpointProof = this.getCheckpointProof(lastStableCheckpoint);
        const preparedMessages = this.getPreparedMessages(lastStableCheckpoint);
        const message = {
            type: "view-change",
            viewNumber,
            agentId: this.nodeId,
            lastStableCheckpoint,
            checkpointProof,
            preparedMessages,
            timestamp: new Date(),
            signature: this.signMessage(`view-change-${viewNumber}`),
        };
        return message;
    }
    /**
     * Validate view change message
     */
    validateViewChangeMessage(message) {
        // Basic validation
        if (!message.agentId ||
            !message.signature ||
            message.viewNumber <= this.viewState.currentView) {
            return false;
        }
        // Check if sender is a valid agent
        if (!this.agents.has(message.agentId)) {
            return false;
        }
        // Validate signature
        const expectedSignature = this.signMessage(`view-change-${message.viewNumber}`);
        return true; // Simplified validation
    }
    /**
     * Validate new-view message
     */
    validateNewViewMessage(message) {
        // Check if sender should be the leader for this view
        const expectedLeader = this.electLeader(message.viewNumber);
        if (message.leaderId !== expectedLeader) {
            return false;
        }
        // Validate view change messages (Byzantine quorum requirement)
        const faultThreshold = Math.floor((this.totalAgents - 1) / 3);
        const requiredMessages = 2 * faultThreshold + 1; // Byzantine minimum quorum
        if (message.viewChangeMessages.length < requiredMessages) {
            return false;
        }
        return true;
    }
    /**
     * Construct pre-prepare messages for new view
     */
    constructPrePrepareMessages(viewChangeMessages) {
        // This would construct the necessary pre-prepare messages
        // based on the prepared messages in view change messages
        return [];
    }
    /**
     * Get last stable checkpoint
     */
    getLastStableCheckpoint() {
        // Find the highest sequence number that has been checkpointed
        // by a majority of agents
        const checkpointSequences = Array.from(this.checkpoints.keys()).sort((a, b) => b - a);
        for (const seq of checkpointSequences) {
            const checkpoints = this.checkpoints.get(seq) || [];
            const faultThreshold = Math.floor((this.totalAgents - 1) / 3);
            const minQuorum = 2 * faultThreshold + 1; // Byzantine quorum
            if (checkpoints.length >= minQuorum) {
                return seq;
            }
        }
        return 0;
    }
    /**
     * Get checkpoint proof
     */
    getCheckpointProof(sequenceNumber) {
        return this.checkpoints.get(sequenceNumber) || [];
    }
    /**
     * Get prepared messages
     */
    getPreparedMessages(afterSequenceNumber) {
        // This would return prepared message sets after the given sequence number
        return [];
    }
    /**
     * Broadcast view change message
     */
    async broadcastViewChangeMessage(message) {
        this.broadcastMessage(message);
    }
    /**
     * Broadcast new-view message
     */
    async broadcastNewViewMessage(message) {
        this.broadcastMessage(message);
    }
    /**
     * Broadcast message to all agents
     */
    broadcastMessage(message) {
        // This would implement actual network broadcast
        // For now, just emit the message
        this.emit("broadcast-message", message);
    }
    /**
     * Sign message
     */
    signMessage(data) {
        return createHash("sha256")
            .update(data + this.nodeId)
            .digest("hex");
    }
    /**
     * Get current view state
     */
    getViewState() {
        return { ...this.viewState };
    }
    /**
     * Get leader election statistics
     */
    getElectionStatistics() {
        const elections = this.electionHistory.size;
        const changes = elections > 0 ? elections - 1 : 0;
        // Calculate average term length (simplified)
        const avgTermLength = elections > 1 ? this.config.term : 0;
        const candidateScores = new Map();
        this.leaderCandidates.forEach((candidate, id) => {
            candidateScores.set(id, candidate.electionScore);
        });
        return {
            totalElections: elections,
            currentLeader: this.viewState.currentLeader,
            currentView: this.viewState.currentView,
            leadershipChanges: changes,
            averageTermLength: avgTermLength,
            candidateScores,
        };
    }
    /**
     * Get minimum quorum size for Byzantine consensus
     */
    getMinQuorum() {
        const faultThreshold = Math.floor((this.totalAgents - 1) / 3);
        return 2 * faultThreshold + 1;
    }
    /**
     * Check if we have sufficient active agents for quorum
     */
    hasQuorum() {
        return this.viewState.participatingAgents.size >= this.getMinQuorum();
    }
    /**
     * Cleanup resources
     */
    cleanup() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
        if (this.electionTimer) {
            clearTimeout(this.electionTimer);
            this.electionTimer = null;
        }
    }
}
export default ViewChangeLeaderElection;
//# sourceMappingURL=view-change-leader-election.js.map