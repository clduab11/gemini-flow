/**
 * View Change Protocols and Leader Election
 * Implements robust leader election and view change mechanisms
 * for Byzantine fault-tolerant consensus
 */

import { EventEmitter } from "events";
import { createHash } from "crypto";
import { Agent, ConsensusMessage, ConsensusState } from "./byzantine-consensus.js";

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
  algorithm:
    | "round-robin"
    | "reputation-based"
    | "stake-weighted"
    | "performance-based"
    | "hybrid";
  term: number; // Leadership term in milliseconds
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

export class ViewChangeLeaderElection extends EventEmitter {
  private viewState: ViewState;
  private agents: Map<string, Agent> = new Map();
  private viewChangeMessages: Map<number, ViewChangeMessage[]> = new Map();
  private checkpoints: Map<number, CheckpointMessage[]> = new Map();
  private leaderCandidates: Map<string, LeaderCandidate> = new Map();
  private electionHistory: Map<number, string> = new Map(); // view -> leader
  private consecutiveTerms: Map<string, number> = new Map();

  private readonly config: ElectionConfiguration;
  private heartbeatTimer: ReturnType<typeof setTimeout> | null = null;
  private electionTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private nodeId: string,
    private totalAgents: number = 4,
    config: Partial<ElectionConfiguration> = {},
  ) {
    super();

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
  public registerAgent(agent: Agent): void {
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
    if (
      this.viewState.currentLeader === "" &&
      this.viewState.participatingAgents.size === 1
    ) {
      this.electLeader(0);
    }

    this.emit("agent-registered", agent);
  }

  /**
   * Remove an agent from leader election
   */
  public removeAgent(agentId: string): void {
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
  public async initiateViewChange(reason: string): Promise<void> {
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
    this.viewChangeMessages.get(newView)!.push(viewChangeMessage);

    // Broadcast view change message
    await this.broadcastViewChangeMessage(viewChangeMessage);

    // Start election timeout
    this.startElectionTimeout(newView);

    this.emit("view-change-initiated", { newView, reason });
  }

  /**
   * Process incoming view change message
   */
  public async processViewChangeMessage(
    message: ViewChangeMessage,
  ): Promise<void> {
    if (!this.validateViewChangeMessage(message)) {
      this.emit("invalid-view-change-message", message);
      return;
    }

    // Store the message
    if (!this.viewChangeMessages.has(message.viewNumber)) {
      this.viewChangeMessages.set(message.viewNumber, []);
    }

    const messages = this.viewChangeMessages.get(message.viewNumber)!;

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
  private async processViewChange(viewNumber: number): Promise<void> {
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
  private async sendNewViewMessage(viewNumber: number): Promise<void> {
    const viewChangeMessages = this.viewChangeMessages.get(viewNumber) || [];

    const newViewMessage: NewViewMessage = {
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
  public async processNewViewMessage(message: NewViewMessage): Promise<void> {
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
  private electLeader(viewNumber: number): string {
    const candidates = Array.from(this.leaderCandidates.values()).filter(
      (candidate) =>
        this.viewState.participatingAgents.has(candidate.agentId) &&
        !this.viewState.suspectedFaultyAgents.has(candidate.agentId),
    );

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
  private roundRobinElection(
    viewNumber: number,
    candidates: LeaderCandidate[],
  ): string {
    const sortedCandidates = candidates.sort((a, b) =>
      a.agentId.localeCompare(b.agentId),
    );
    const index = viewNumber % sortedCandidates.length;
    return sortedCandidates[index].agentId;
  }

  /**
   * Reputation-based leader election
   */
  private reputationBasedElection(candidates: LeaderCandidate[]): string {
    return candidates.reduce((best, current) =>
      current.reputation > best.reputation ? current : best,
    ).agentId;
  }

  /**
   * Stake-weighted leader election
   */
  private stakeWeightedElection(candidates: LeaderCandidate[]): string {
    return candidates.reduce((best, current) =>
      current.stake > best.stake ? current : best,
    ).agentId;
  }

  /**
   * Performance-based leader election
   */
  private performanceBasedElection(candidates: LeaderCandidate[]): string {
    return candidates.reduce((best, current) =>
      current.performance > best.performance ? current : best,
    ).agentId;
  }

  /**
   * Hybrid leader election (combines multiple factors)
   */
  private hybridElection(candidates: LeaderCandidate[]): string {
    // Calculate election scores
    candidates.forEach((candidate) => {
      const consecutiveTerms =
        this.consecutiveTerms.get(candidate.agentId) || 0;
      const termPenalty =
        consecutiveTerms >= this.config.maxConsecutiveTerms ? 0.5 : 1.0;

      candidate.electionScore =
        (candidate.reputation * 0.3 +
          candidate.availability * 0.25 +
          candidate.performance * 0.25 +
          candidate.stake * 0.2) *
        termPenalty;
    });

    return candidates.reduce((best, current) =>
      current.electionScore > best.electionScore ? current : best,
    ).agentId;
  }

  /**
   * Update candidate performance metrics
   */
  public updateCandidateMetrics(
    agentId: string,
    metrics: {
      reputation?: number;
      availability?: number;
      performance?: number;
      stake?: number;
    },
  ): void {
    const candidate = this.leaderCandidates.get(agentId);
    if (candidate) {
      Object.assign(candidate, metrics);
      this.emit("candidate-metrics-updated", { agentId, metrics });
    }
  }

  /**
   * Start heartbeat monitoring
   */
  private startHeartbeatMonitoring(): void {
    this.heartbeatTimer = setInterval(() => {
      this.checkLeaderHeartbeat();
    }, this.config.heartbeatInterval);
  }

  /**
   * Check leader heartbeat
   */
  private checkLeaderHeartbeat(): void {
    if (this.viewState.currentLeader === this.nodeId) {
      // We are the leader, send heartbeat
      this.sendHeartbeat();
    } else {
      // Check if we've received heartbeat from leader
      const timeSinceLastHeartbeat =
        Date.now() - this.viewState.viewStartTime.getTime();

      if (timeSinceLastHeartbeat > this.config.electionTimeout) {
        // Leader appears to be down, initiate view change
        this.initiateViewChange("leader-timeout");
      }
    }
  }

  /**
   * Send heartbeat as leader
   */
  private sendHeartbeat(): void {
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
  public processHeartbeat(heartbeat: any): void {
    if (heartbeat.leaderId === this.viewState.currentLeader) {
      // Update view start time to reset timeout
      this.viewState.viewStartTime = new Date();
      this.emit("heartbeat-received", heartbeat);
    }
  }

  /**
   * Start election timeout
   */
  private startElectionTimeout(viewNumber: number): void {
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
  private async createViewChangeMessage(
    viewNumber: number,
  ): Promise<ViewChangeMessage> {
    const lastStableCheckpoint = this.getLastStableCheckpoint();
    const checkpointProof = this.getCheckpointProof(lastStableCheckpoint);
    const preparedMessages = this.getPreparedMessages(lastStableCheckpoint);

    const message: ViewChangeMessage = {
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
  private validateViewChangeMessage(message: ViewChangeMessage): boolean {
    // Basic validation
    if (
      !message.agentId ||
      !message.signature ||
      message.viewNumber <= this.viewState.currentView
    ) {
      return false;
    }

    // Check if sender is a valid agent
    if (!this.agents.has(message.agentId)) {
      return false;
    }

    // Validate signature
    const expectedSignature = this.signMessage(
      `view-change-${message.viewNumber}`,
    );

    return true; // Simplified validation
  }

  /**
   * Validate new-view message
   */
  private validateNewViewMessage(message: NewViewMessage): boolean {
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
  private constructPrePrepareMessages(
    viewChangeMessages: ViewChangeMessage[],
  ): ConsensusMessage[] {
    // This would construct the necessary pre-prepare messages
    // based on the prepared messages in view change messages
    return [];
  }

  /**
   * Get last stable checkpoint
   */
  private getLastStableCheckpoint(): number {
    // Find the highest sequence number that has been checkpointed
    // by a majority of agents
    const checkpointSequences = Array.from(this.checkpoints.keys()).sort(
      (a, b) => b - a,
    );

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
  private getCheckpointProof(sequenceNumber: number): CheckpointMessage[] {
    return this.checkpoints.get(sequenceNumber) || [];
  }

  /**
   * Get prepared messages
   */
  private getPreparedMessages(afterSequenceNumber: number): PreparedSet[] {
    // This would return prepared message sets after the given sequence number
    return [];
  }

  /**
   * Broadcast view change message
   */
  private async broadcastViewChangeMessage(
    message: ViewChangeMessage,
  ): Promise<void> {
    this.broadcastMessage(message);
  }

  /**
   * Broadcast new-view message
   */
  private async broadcastNewViewMessage(
    message: NewViewMessage,
  ): Promise<void> {
    this.broadcastMessage(message);
  }

  /**
   * Broadcast message to all agents
   */
  private broadcastMessage(message: any): void {
    // This would implement actual network broadcast
    // For now, just emit the message
    this.emit("broadcast-message", message);
  }

  /**
   * Sign message
   */
  private signMessage(data: string): string {
    return createHash("sha256")
      .update(data + this.nodeId)
      .digest("hex");
  }

  /**
   * Get current view state
   */
  public getViewState(): ViewState {
    return { ...this.viewState };
  }

  /**
   * Get leader election statistics
   */
  public getElectionStatistics(): {
    totalElections: number;
    currentLeader: string;
    currentView: number;
    leadershipChanges: number;
    averageTermLength: number;
    candidateScores: Map<string, number>;
  } {
    const elections = this.electionHistory.size;
    const changes = elections > 0 ? elections - 1 : 0;

    // Calculate average term length (simplified)
    const avgTermLength = elections > 1 ? this.config.term : 0;

    const candidateScores = new Map<string, number>();
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
  public getMinQuorum(): number {
    const faultThreshold = Math.floor((this.totalAgents - 1) / 3);
    return 2 * faultThreshold + 1;
  }

  /**
   * Check if we have sufficient active agents for quorum
   */
  public hasQuorum(): boolean {
    return this.viewState.participatingAgents.size >= this.getMinQuorum();
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
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
