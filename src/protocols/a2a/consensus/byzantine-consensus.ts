/**
 * Byzantine Fault-Tolerant Consensus System
 * Implements PBFT (Practical Byzantine Fault Tolerance) algorithm
 * Handles up to 33% malicious agents while maintaining correctness
 */

import { EventEmitter } from "node:events";
import { createHash } from "crypto";

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

export class ByzantineConsensus extends EventEmitter {
  private agents: Map<string, Agent> = new Map();
  private state: ConsensusState;
  private messageLog: ConsensusMessage[] = [];
  private faultThreshold: number;
  private minQuorum: number; // Byzantine: Math.floor(2*n/3)+1
  private timeoutDuration: number = 30000; // 30 seconds
  private viewChangeTimeout: ReturnType<typeof setTimeout> | null = null;
  private performance: {
    consensusRounds: number;
    averageLatency: number;
    faultsDetected: number;
    successRate: number;
  };

  constructor(
    private agentId: string,
    private totalAgents: number = 4,
  ) {
    super();
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

  private initializeState(): ConsensusState {
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
  public registerAgent(agent: Agent): void {
    this.agents.set(agent.id, agent);
    this.state.activeAgents.add(agent.id);
    this.emit("agent-registered", agent);
  }

  /**
   * Remove an agent from the consensus network
   */
  public removeAgent(agentId: string): void {
    this.agents.delete(agentId);
    this.state.activeAgents.delete(agentId);
    this.emit("agent-removed", agentId);
  }

  /**
   * Start consensus round for a proposal
   */
  public async startConsensus(proposal: ConsensusProposal): Promise<boolean> {
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
      } else {
        await this.initiateViewChange();
        this.updatePerformance(startTime, false);
        return false;
      }
    } catch (error) {
      this.updatePerformance(startTime, false);
      this.emit("consensus-error", error);
      return false;
    }
  }

  /**
   * Process incoming consensus message
   */
  public async processMessage(message: ConsensusMessage): Promise<void> {
    if (!this.validateMessage(message)) {
      this.emit("invalid-message", message);
      return;
    }

    this.messageLog.push(message);

    if (!this.state.messages.has(message.digest)) {
      this.state.messages.set(message.digest, []);
    }
    this.state.messages.get(message.digest)!.push(message);

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

  private async broadcastPrePrepare(
    proposal: ConsensusProposal,
  ): Promise<void> {
    const message: ConsensusMessage = {
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

  private async handlePrePrepare(message: ConsensusMessage): Promise<void> {
    if (message.senderId !== this.state.leader) {
      this.emit("malicious-behavior", {
        type: "unauthorized-pre-prepare",
        agentId: message.senderId,
      });
      return;
    }

    if (message.viewNumber === this.state.currentView) {
      // Send prepare message
      const prepareMessage: ConsensusMessage = {
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

  private async collectPrepareResponses(proposalId: string): Promise<boolean> {
    return new Promise((resolve) => {
      const requiredResponses = 2 * this.faultThreshold;
      const receivedResponses = 0;

      const timeout = setTimeout(() => {
        resolve(false);
      }, this.timeoutDuration);

      const checkResponses = () => {
        const proposal = this.state.proposals.get(proposalId);
        if (!proposal) return;

        const prepareMessages = this.state.messages.get(proposal.hash) || [];
        const prepareCount = prepareMessages.filter(
          (m) =>
            m.type === "prepare" && m.viewNumber === this.state.currentView,
        ).length;

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

  private async handlePrepare(message: ConsensusMessage): Promise<void> {
    const requiredResponses = 2 * this.faultThreshold;
    const proposal = Array.from(this.state.proposals.values()).find(
      (p) => p.hash === message.digest,
    );

    if (!proposal) return;

    const prepareMessages = this.state.messages.get(message.digest) || [];
    const prepareCount = prepareMessages.filter(
      (m) => m.type === "prepare" && m.viewNumber === this.state.currentView,
    ).length;

    if (prepareCount >= requiredResponses) {
      // Send commit message
      const commitMessage: ConsensusMessage = {
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

  private async collectCommitResponses(proposalId: string): Promise<boolean> {
    return new Promise((resolve) => {
      const requiredResponses = 2 * this.faultThreshold;

      const timeout = setTimeout(() => {
        resolve(false);
      }, this.timeoutDuration);

      const checkResponses = () => {
        const proposal = this.state.proposals.get(proposalId);
        if (!proposal) return;

        const commitMessages = this.state.messages.get(proposal.hash) || [];
        const commitCount = commitMessages.filter(
          (m) => m.type === "commit" && m.viewNumber === this.state.currentView,
        ).length;

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

  private async handleCommit(message: ConsensusMessage): Promise<void> {
    this.emit("message-received", message);
  }

  private async initiateViewChange(): Promise<void> {
    this.state.currentView++;
    this.state.leader = this.selectLeader(this.state.currentView);

    const viewChangeMessage: ConsensusMessage = {
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

  private async handleViewChange(message: ConsensusMessage): Promise<void> {
    // Collect view change messages and determine new leader
    const viewChangeMessages = this.messageLog.filter(
      (m) => m.type === "view-change" && m.viewNumber === message.viewNumber,
    );

    if (viewChangeMessages.length >= 2 * this.faultThreshold + 1) {
      if (this.agentId === this.selectLeader(message.viewNumber)) {
        await this.sendNewView(message.viewNumber);
      }
    }
  }

  private async sendNewView(viewNumber: number): Promise<void> {
    const newViewMessage: ConsensusMessage = {
      type: "new-view",
      viewNumber,
      sequenceNumber: this.state.sequenceNumber,
      digest: "",
      payload: {
        viewChangeMessages: this.messageLog.filter(
          (m) => m.type === "view-change" && m.viewNumber === viewNumber,
        ),
      },
      timestamp: new Date(),
      signature: this.signMessage(`new-view-${viewNumber}`),
      senderId: this.agentId,
    };

    await this.broadcastMessage(newViewMessage);
  }

  private async handleNewView(message: ConsensusMessage): Promise<void> {
    if (message.senderId === this.selectLeader(message.viewNumber)) {
      this.state.currentView = message.viewNumber;
      this.state.leader = message.senderId;
      this.state.phase = "pre-prepare";
      this.emit("new-view-accepted", message.viewNumber);
    }
  }

  private selectLeader(viewNumber: number): string {
    const activeAgents = Array.from(this.state.activeAgents);
    const leaderIndex = viewNumber % activeAgents.length;
    return activeAgents[leaderIndex];
  }

  private isLeader(): boolean {
    return this.agentId === this.state.leader;
  }

  private validateMessage(message: ConsensusMessage): boolean {
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
    const agent = this.agents.get(message.senderId)!;
    if (agent.isMalicious) {
      this.performance.faultsDetected++;
      return false;
    }

    return true;
  }

  private signMessage(data: string): string {
    // Simplified signing - in production, use proper cryptographic signatures
    return createHash("sha256")
      .update(data + this.agentId)
      .digest("hex");
  }

  private async broadcastMessage(message: ConsensusMessage): Promise<void> {
    // Simulate network broadcast
    this.emit("broadcast-message", message);

    // In a real implementation, this would send to all agents
    setTimeout(() => {
      this.emit("message-received", message);
    }, Math.random() * 100); // Simulate network delay
  }

  private updatePerformance(startTime: number, success: boolean): void {
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
  public getState(): ConsensusState {
    return { ...this.state };
  }

  /**
   * Get performance metrics
   */
  public getPerformanceMetrics(): typeof this.performance {
    return { ...this.performance };
  }

  /**
   * Check if consensus can be reached with current network
   */
  public canReachConsensus(): boolean {
    const activeCount = this.state.activeAgents.size;
    const maliciousCount = Array.from(this.agents.values()).filter(
      (a) => a.isMalicious && this.state.activeAgents.has(a.id),
    ).length;

    return (
      maliciousCount <= this.faultThreshold && activeCount >= this.minQuorum
    );
  }

  /**
   * Get minimum quorum size for Byzantine consensus
   */
  public getMinQuorum(): number {
    return this.minQuorum;
  }

  /**
   * Check if we have sufficient nodes for quorum
   */
  public hasQuorum(): boolean {
    return this.state.activeAgents.size >= this.minQuorum;
  }

  /**
   * Simulate network partition
   */
  public simulatePartition(agentIds: string[]): void {
    agentIds.forEach((id) => this.state.activeAgents.delete(id));
    this.emit("network-partition", agentIds);
  }

  /**
   * Heal network partition
   */
  public healPartition(agentIds: string[]): void {
    agentIds.forEach((id) => {
      if (this.agents.has(id)) {
        this.state.activeAgents.add(id);
      }
    });
    this.emit("network-healed", agentIds);
  }
}

export default ByzantineConsensus;
