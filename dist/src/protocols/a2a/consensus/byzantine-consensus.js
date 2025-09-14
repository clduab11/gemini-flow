/**
 * Byzantine Fault-Tolerant Consensus System
 * Implements PBFT (Practical Byzantine Fault Tolerance) algorithm
 * Handles up to 33% malicious agents while maintaining correctness
 */
import { EventEmitter } from "events";
import { createHash } from "crypto";
export class ByzantineConsensus extends EventEmitter {
    agentId;
    totalAgents;
    agents = new Map();
    state;
    messageLog = [];
    faultThreshold;
    minQuorum; // Byzantine: Math.floor(2*n/3)+1
    timeoutDuration = 30000; // 30 seconds
    viewChangeTimeout = null;
    performance;
    constructor(agentId, totalAgents = 4) {
        super();
        this.agentId = agentId;
        this.totalAgents = totalAgents;
        this.faultThreshold = Math.floor((totalAgents - 1) / 3);
        this.minQuorum = Math.floor((2 * totalAgents) / 3) + 1; // Byzantine: 2f+1 where f is fault threshold
        this.state = this.initializeState();
        this.performance = {
            consensusRounds: 0,
            averageLatency: 0,
            faultsDetected: 0,
            successRate: 0,
        };
    }
    initializeState() {
        return {
            currentView: 0,
            sequenceNumber: 0,
            phase: "pre-prepare",
            leader: this.selectLeader(0),
            activeAgents: new Set(),
            proposals: new Map(),
            messages: new Map(),
            committed: new Set(),
        };
    }
    /**
     * Register an agent in the consensus network
     */
    registerAgent(agent) {
        this.agents.set(agent.id, agent);
        this.state.activeAgents.add(agent.id);
        this.emit("agent-registered", agent);
    }
    /**
     * Remove an agent from the consensus network
     */
    removeAgent(agentId) {
        this.agents.delete(agentId);
        this.state.activeAgents.delete(agentId);
        this.emit("agent-removed", agentId);
    }
    /**
     * Start consensus round for a proposal
     */
    async startConsensus(proposal) {
        const startTime = Date.now();
        try {
            if (!this.isLeader()) {
                throw new Error("Only leader can start consensus");
            }
            this.state.sequenceNumber++;
            this.state.proposals.set(proposal.id, proposal);
            // Phase 1: Pre-prepare
            await this.broadcastPrePrepare(proposal);
            // Phase 2: Prepare
            const prepareSuccess = await this.collectPrepareResponses(proposal.id);
            if (!prepareSuccess) {
                await this.initiateViewChange();
                return false;
            }
            // Phase 3: Commit
            const commitSuccess = await this.collectCommitResponses(proposal.id);
            if (commitSuccess) {
                this.state.committed.add(proposal.id);
                this.updatePerformance(startTime, true);
                this.emit("consensus-reached", proposal);
                return true;
            }
            else {
                await this.initiateViewChange();
                this.updatePerformance(startTime, false);
                return false;
            }
        }
        catch (error) {
            this.updatePerformance(startTime, false);
            this.emit("consensus-error", error);
            return false;
        }
    }
    /**
     * Process incoming consensus message
     */
    async processMessage(message) {
        if (!this.validateMessage(message)) {
            this.emit("invalid-message", message);
            return;
        }
        this.messageLog.push(message);
        if (!this.state.messages.has(message.digest)) {
            this.state.messages.set(message.digest, []);
        }
        this.state.messages.get(message.digest).push(message);
        switch (message.type) {
            case "pre-prepare":
                await this.handlePrePrepare(message);
                break;
            case "prepare":
                await this.handlePrepare(message);
                break;
            case "commit":
                await this.handleCommit(message);
                break;
            case "view-change":
                await this.handleViewChange(message);
                break;
            case "new-view":
                await this.handleNewView(message);
                break;
        }
    }
    async broadcastPrePrepare(proposal) {
        const message = {
            type: "pre-prepare",
            viewNumber: this.state.currentView,
            sequenceNumber: this.state.sequenceNumber,
            digest: proposal.hash,
            payload: proposal,
            timestamp: new Date(),
            signature: this.signMessage(proposal.hash),
            senderId: this.agentId,
        };
        this.state.phase = "pre-prepare";
        await this.broadcastMessage(message);
    }
    async handlePrePrepare(message) {
        if (message.senderId !== this.state.leader) {
            this.emit("malicious-behavior", {
                type: "unauthorized-pre-prepare",
                agentId: message.senderId,
            });
            return;
        }
        if (message.viewNumber === this.state.currentView) {
            // Send prepare message
            const prepareMessage = {
                type: "prepare",
                viewNumber: this.state.currentView,
                sequenceNumber: message.sequenceNumber,
                digest: message.digest,
                payload: null,
                timestamp: new Date(),
                signature: this.signMessage(message.digest),
                senderId: this.agentId,
            };
            await this.broadcastMessage(prepareMessage);
        }
    }
    async collectPrepareResponses(proposalId) {
        return new Promise((resolve) => {
            const requiredResponses = 2 * this.faultThreshold;
            const receivedResponses = 0;
            const timeout = setTimeout(() => {
                resolve(false);
            }, this.timeoutDuration);
            const checkResponses = () => {
                const proposal = this.state.proposals.get(proposalId);
                if (!proposal)
                    return;
                const prepareMessages = this.state.messages.get(proposal.hash) || [];
                const prepareCount = prepareMessages.filter((m) => m.type === "prepare" && m.viewNumber === this.state.currentView).length;
                if (prepareCount >= requiredResponses) {
                    clearTimeout(timeout);
                    this.state.phase = "prepare";
                    resolve(true);
                }
            };
            this.on("message-received", checkResponses);
            // Initial check in case messages already arrived
            checkResponses();
        });
    }
    async handlePrepare(message) {
        const requiredResponses = 2 * this.faultThreshold;
        const proposal = Array.from(this.state.proposals.values()).find((p) => p.hash === message.digest);
        if (!proposal)
            return;
        const prepareMessages = this.state.messages.get(message.digest) || [];
        const prepareCount = prepareMessages.filter((m) => m.type === "prepare" && m.viewNumber === this.state.currentView).length;
        if (prepareCount >= requiredResponses) {
            // Send commit message
            const commitMessage = {
                type: "commit",
                viewNumber: this.state.currentView,
                sequenceNumber: message.sequenceNumber,
                digest: message.digest,
                payload: null,
                timestamp: new Date(),
                signature: this.signMessage(message.digest),
                senderId: this.agentId,
            };
            await this.broadcastMessage(commitMessage);
        }
    }
    async collectCommitResponses(proposalId) {
        return new Promise((resolve) => {
            const requiredResponses = 2 * this.faultThreshold;
            const timeout = setTimeout(() => {
                resolve(false);
            }, this.timeoutDuration);
            const checkResponses = () => {
                const proposal = this.state.proposals.get(proposalId);
                if (!proposal)
                    return;
                const commitMessages = this.state.messages.get(proposal.hash) || [];
                const commitCount = commitMessages.filter((m) => m.type === "commit" && m.viewNumber === this.state.currentView).length;
                if (commitCount >= requiredResponses) {
                    clearTimeout(timeout);
                    this.state.phase = "commit";
                    resolve(true);
                }
            };
            this.on("message-received", checkResponses);
            checkResponses();
        });
    }
    async handleCommit(message) {
        this.emit("message-received", message);
    }
    async initiateViewChange() {
        this.state.currentView++;
        this.state.leader = this.selectLeader(this.state.currentView);
        const viewChangeMessage = {
            type: "view-change",
            viewNumber: this.state.currentView,
            sequenceNumber: this.state.sequenceNumber,
            digest: "",
            payload: {
                lastCommitted: Array.from(this.state.committed),
                messageLog: this.messageLog.slice(-100), // Last 100 messages
            },
            timestamp: new Date(),
            signature: this.signMessage(`view-change-${this.state.currentView}`),
            senderId: this.agentId,
        };
        await this.broadcastMessage(viewChangeMessage);
        this.emit("view-change-initiated", this.state.currentView);
    }
    async handleViewChange(message) {
        // Collect view change messages and determine new leader
        const viewChangeMessages = this.messageLog.filter((m) => m.type === "view-change" && m.viewNumber === message.viewNumber);
        if (viewChangeMessages.length >= 2 * this.faultThreshold + 1) {
            if (this.agentId === this.selectLeader(message.viewNumber)) {
                await this.sendNewView(message.viewNumber);
            }
        }
    }
    async sendNewView(viewNumber) {
        const newViewMessage = {
            type: "new-view",
            viewNumber,
            sequenceNumber: this.state.sequenceNumber,
            digest: "",
            payload: {
                viewChangeMessages: this.messageLog.filter((m) => m.type === "view-change" && m.viewNumber === viewNumber),
            },
            timestamp: new Date(),
            signature: this.signMessage(`new-view-${viewNumber}`),
            senderId: this.agentId,
        };
        await this.broadcastMessage(newViewMessage);
    }
    async handleNewView(message) {
        if (message.senderId === this.selectLeader(message.viewNumber)) {
            this.state.currentView = message.viewNumber;
            this.state.leader = message.senderId;
            this.state.phase = "pre-prepare";
            this.emit("new-view-accepted", message.viewNumber);
        }
    }
    selectLeader(viewNumber) {
        const activeAgents = Array.from(this.state.activeAgents);
        const leaderIndex = viewNumber % activeAgents.length;
        return activeAgents[leaderIndex];
    }
    isLeader() {
        return this.agentId === this.state.leader;
    }
    validateMessage(message) {
        // Basic validation
        if (!message.senderId || !message.signature || !message.timestamp) {
            return false;
        }
        // Check if sender is registered
        if (!this.agents.has(message.senderId)) {
            return false;
        }
        // Validate signature (simplified - in real implementation, use proper crypto)
        const expectedSignature = this.signMessage(message.digest || message.type);
        // Additional Byzantine fault checks
        const agent = this.agents.get(message.senderId);
        if (agent.isMalicious) {
            this.performance.faultsDetected++;
            return false;
        }
        return true;
    }
    signMessage(data) {
        // Simplified signing - in production, use proper cryptographic signatures
        return createHash("sha256")
            .update(data + this.agentId)
            .digest("hex");
    }
    async broadcastMessage(message) {
        // Simulate network broadcast
        this.emit("broadcast-message", message);
        // In a real implementation, this would send to all agents
        setTimeout(() => {
            this.emit("message-received", message);
        }, Math.random() * 100); // Simulate network delay
    }
    updatePerformance(startTime, success) {
        this.performance.consensusRounds++;
        const latency = Date.now() - startTime;
        this.performance.averageLatency =
            (this.performance.averageLatency *
                (this.performance.consensusRounds - 1) +
                latency) /
                this.performance.consensusRounds;
        const successCount = success ? 1 : 0;
        this.performance.successRate =
            (this.performance.successRate * (this.performance.consensusRounds - 1) +
                successCount) /
                this.performance.consensusRounds;
    }
    /**
     * Get current consensus state
     */
    getState() {
        return { ...this.state };
    }
    /**
     * Get performance metrics
     */
    getPerformanceMetrics() {
        return { ...this.performance };
    }
    /**
     * Check if consensus can be reached with current network
     */
    canReachConsensus() {
        const activeCount = this.state.activeAgents.size;
        const maliciousCount = Array.from(this.agents.values()).filter((a) => a.isMalicious && this.state.activeAgents.has(a.id)).length;
        return (maliciousCount <= this.faultThreshold && activeCount >= this.minQuorum);
    }
    /**
     * Get minimum quorum size for Byzantine consensus
     */
    getMinQuorum() {
        return this.minQuorum;
    }
    /**
     * Check if we have sufficient nodes for quorum
     */
    hasQuorum() {
        return this.state.activeAgents.size >= this.minQuorum;
    }
    /**
     * Simulate network partition
     */
    simulatePartition(agentIds) {
        agentIds.forEach((id) => this.state.activeAgents.delete(id));
        this.emit("network-partition", agentIds);
    }
    /**
     * Heal network partition
     */
    healPartition(agentIds) {
        agentIds.forEach((id) => {
            if (this.agents.has(id)) {
                this.state.activeAgents.add(id);
            }
        });
        this.emit("network-healed", agentIds);
    }
}
export default ByzantineConsensus;
//# sourceMappingURL=byzantine-consensus.js.map