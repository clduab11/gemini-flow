/**
 * Consensus Security Integration
 * Integrates Byzantine consensus system with existing A2A security components
 * Provides secure, authenticated consensus operations with comprehensive monitoring
 */

import { EventEmitter } from "events";
import {
  ByzantineConsensus,
  Agent,
  ConsensusProposal,
  ConsensusMessage,
} from "./byzantine-consensus";
import {
  VotingMechanisms,
  VotingProposal,
  Voter,
  Vote,
} from "./voting-mechanisms";
import { MaliciousDetection, MaliciousBehavior } from "./malicious-detection";
import {
  StateMachineReplication,
  StateOperation,
} from "./state-machine-replication";
import { ViewChangeLeaderElection } from "./view-change-leader-election";
import { PerformanceOptimizer } from "./performance-optimizer";
import {
  A2ASecurityManager,
  A2AIdentity,
  A2AMessage,
  SecurityEvent,
} from "../../../core/a2a-security-manager";

export interface SecureConsensusConfig {
  totalAgents: number;
  faultThreshold: number;
  requireAuthentication: boolean;
  requireEncryption: boolean;
  enableMaliciousDetection: boolean;
  enablePerformanceOptimization: boolean;
  securityPolicies: {
    minTrustLevel: "untrusted" | "basic" | "verified" | "trusted";
    requiredCapabilities: string[];
    enableAuditLogging: boolean;
    enableBehaviorAnalysis: boolean;
  };
}

export interface SecureConsensusSession {
  sessionId: string;
  participants: string[];
  leader: string;
  consensusType: "byzantine" | "voting" | "state-machine";
  securityLevel: "low" | "medium" | "high" | "critical";
  startTime: Date;
  endTime?: Date;
  status: "active" | "completed" | "failed" | "compromised";
  metrics: {
    messagesExchanged: number;
    consensusRounds: number;
    maliciousAttemptsDetected: number;
    averageLatency: number;
  };
}

export interface SecuredConsensusProposal extends ConsensusProposal {
  securityMetadata: {
    proposerIdentity: A2AIdentity;
    requiredTrustLevel: string;
    encryptionEnabled: boolean;
    auditTrail: SecurityEvent[];
    verificationStatus: "pending" | "verified" | "rejected";
  };
}

export class ConsensusSecurityIntegration extends EventEmitter {
  private config: SecureConsensusConfig;
  private securityManager: A2ASecurityManager;

  // Consensus components
  private byzantineConsensus: ByzantineConsensus;
  private votingMechanisms: VotingMechanisms;
  private maliciousDetection: MaliciousDetection;
  private stateMachineReplication: StateMachineReplication;
  private leaderElection: ViewChangeLeaderElection;
  private performanceOptimizer: PerformanceOptimizer;

  // Security integration state
  private activeSessions: Map<string, SecureConsensusSession> = new Map();
  private authenticatedAgents: Map<string, A2AIdentity> = new Map();
  private consensusAuditLog: SecurityEvent[] = [];
  private maliciousBehaviorHistory: Map<string, MaliciousBehavior[]> =
    new Map();

  // Performance and monitoring
  private securityMetrics: {
    totalConsensusOperations: number;
    authenticatedOperations: number;
    blockedMaliciousAttempts: number;
    averageSecurityOverhead: number;
    systemThroughput: number;
  };

  constructor(
    nodeId: string,
    securityManager: A2ASecurityManager,
    config: Partial<SecureConsensusConfig> = {},
  ) {
    super();

    this.config = {
      totalAgents: 7,
      faultThreshold: Math.floor((7 - 1) / 3),
      requireAuthentication: true,
      requireEncryption: true,
      enableMaliciousDetection: true,
      enablePerformanceOptimization: true,
      securityPolicies: {
        minTrustLevel: "basic",
        requiredCapabilities: ["consensus", "voting"],
        enableAuditLogging: true,
        enableBehaviorAnalysis: true,
      },
      ...config,
    };

    this.securityManager = securityManager;

    // Initialize consensus components
    this.byzantineConsensus = new ByzantineConsensus(
      nodeId,
      this.config.totalAgents,
    );
    this.votingMechanisms = new VotingMechanisms(`consensus-${nodeId}`);
    this.maliciousDetection = new MaliciousDetection();
    this.stateMachineReplication = new StateMachineReplication(nodeId);
    this.leaderElection = new ViewChangeLeaderElection(
      nodeId,
      this.config.totalAgents,
    );
    this.performanceOptimizer = new PerformanceOptimizer();

    this.securityMetrics = {
      totalConsensusOperations: 0,
      authenticatedOperations: 0,
      blockedMaliciousAttempts: 0,
      averageSecurityOverhead: 0,
      systemThroughput: 0,
    };

    this.setupSecurityIntegration();
    this.setupEventHandlers();
  }

  /**
   * Setup security integration between consensus and A2A security
   */
  private setupSecurityIntegration(): void {
    // Integrate malicious detection with A2A security
    this.maliciousDetection.on(
      "malicious-behavior-detected",
      async (behavior: MaliciousBehavior) => {
        await this.handleMaliciousBehavior(behavior);
      },
    );

    // Integrate Byzantine consensus with security manager
    this.byzantineConsensus.on(
      "broadcast-message",
      async (message: ConsensusMessage) => {
        await this.secureMessageBroadcast(message);
      },
    );

    // Integrate performance optimizer with security overhead tracking
    this.performanceOptimizer.on("metrics-updated", (metrics) => {
      this.updateSecurityMetrics(metrics);
    });

    // Setup security event logging
    this.setupSecurityEventLogging();
  }

  /**
   * Setup event handlers for security monitoring
   */
  private setupEventHandlers(): void {
    this.securityManager.on("security_alert", (event: SecurityEvent) => {
      this.handleSecurityAlert(event);
    });

    this.securityManager.on("agent_registered", (identity: A2AIdentity) => {
      this.handleAgentRegistration(identity);
    });

    this.securityManager.on(
      "message_received",
      (data: { message: A2AMessage; payload: any; anomalies: string[] }) => {
        this.handleSecureMessageReceived(data);
      },
    );
  }

  /**
   * Register an authenticated agent for consensus participation
   */
  public async registerConsensusAgent(
    agentId: string,
    agentType: string,
    publicKey: string,
    certificates: { identity: string; tls: string; signing: string },
    capabilities: string[] = [],
  ): Promise<boolean> {
    try {
      // Register with A2A security manager first
      const identity = await this.securityManager.registerAgent(
        agentId,
        agentType,
        publicKey,
        certificates,
        [...capabilities, ...this.config.securityPolicies.requiredCapabilities],
      );

      // Verify trust level meets requirements
      if (!this.meetsTrustRequirements(identity)) {
        throw new Error(
          `Agent ${agentId} does not meet minimum trust level requirements`,
        );
      }

      // Create agent for consensus systems
      const agent: Agent = {
        id: agentId,
        publicKey,
        isLeader: false,
        reputation: this.calculateReputationFromTrust(identity.trustLevel),
        lastActiveTime: new Date(),
      };

      const voter: Voter = {
        id: agentId,
        publicKey,
        weight: this.calculateVotingWeight(identity),
        reputation: agent.reputation,
        expertise: capabilities,
        voiceCredits: 100,
        delegates: new Set(),
        stakes: new Map(),
      };

      // Register with all consensus systems
      this.byzantineConsensus.registerAgent(agent);
      this.votingMechanisms.registerVoter(voter);
      this.maliciousDetection.registerAgent(agent);
      this.leaderElection.registerAgent(agent);

      // Store authenticated agent
      this.authenticatedAgents.set(agentId, identity);

      // Create audit event
      await this.createConsensusAuditEvent(
        "agent_registered",
        "info",
        agentId,
        {
          agentType,
          trustLevel: identity.trustLevel,
          capabilities: capabilities.length,
        },
      );

      this.emit("consensus-agent-registered", { agentId, identity });
      return true;
    } catch (error) {
      await this.createConsensusAuditEvent(
        "agent_registration_failed",
        "error",
        agentId,
        {
          error: error.message,
        },
      );
      throw error;
    }
  }

  /**
   * Start secure Byzantine consensus
   */
  public async startSecureByzantineConsensus(
    proposal: ConsensusProposal,
    securityLevel: "low" | "medium" | "high" | "critical" = "medium",
  ): Promise<boolean> {
    const startTime = Date.now();

    try {
      // Verify proposer authentication
      const proposerIdentity = this.authenticatedAgents.get(
        proposal.proposerId,
      );
      if (!proposerIdentity) {
        throw new Error("Proposer not authenticated");
      }

      // Check authorization
      await this.securityManager.authorizeCapabilities(proposal.proposerId, [
        "consensus",
        "propose",
      ]);

      // Create secure proposal
      const securedProposal = await this.createSecuredProposal(
        proposal,
        proposerIdentity,
        securityLevel,
      );

      // Create consensus session
      const session = await this.createConsensusSession(
        "byzantine",
        Array.from(this.authenticatedAgents.keys()),
        this.leaderElection.getViewState().currentLeader,
        securityLevel,
      );

      // Optimize proposal if enabled
      if (this.config.enablePerformanceOptimization) {
        const optimized =
          await this.performanceOptimizer.optimizeProposal(securedProposal);
        securedProposal.content = optimized.optimized.content;
      }

      // Start consensus with malicious detection
      const consensusPromise =
        this.byzantineConsensus.startConsensus(securedProposal);

      // Monitor for malicious behavior during consensus
      const behaviorMonitoring = this.monitorConsensusForMaliciousBehavior(
        session.sessionId,
      );

      // Wait for consensus result
      const [result] = await Promise.all([
        consensusPromise,
        behaviorMonitoring,
      ]);

      // Update session
      session.status = result ? "completed" : "failed";
      session.endTime = new Date();
      session.metrics.consensusRounds++;

      // Update security metrics
      this.securityMetrics.totalConsensusOperations++;
      if (result) {
        this.securityMetrics.authenticatedOperations++;
      }
      this.securityMetrics.averageSecurityOverhead =
        (this.securityMetrics.averageSecurityOverhead +
          (Date.now() - startTime)) /
        2;

      // Create audit event
      await this.createConsensusAuditEvent(
        "byzantine_consensus_completed",
        "info",
        proposal.proposerId,
        {
          sessionId: session.sessionId,
          result,
          duration: Date.now() - startTime,
          securityLevel,
        },
      );

      this.emit("secure-consensus-completed", {
        session,
        result,
        securedProposal,
      });
      return result;
    } catch (error) {
      await this.createConsensusAuditEvent(
        "byzantine_consensus_failed",
        "error",
        proposal.proposerId,
        {
          error: error.message,
          securityLevel,
        },
      );
      throw error;
    }
  }

  /**
   * Start secure voting process
   */
  public async startSecureVoting(
    proposal: VotingProposal,
    securityLevel: "low" | "medium" | "high" | "critical" = "medium",
  ): Promise<string> {
    try {
      // Verify proposer authentication
      const proposerIdentity = this.authenticatedAgents.get(
        proposal.proposerId,
      );
      if (!proposerIdentity) {
        throw new Error("Proposer not authenticated");
      }

      // Check authorization
      await this.securityManager.authorizeCapabilities(proposal.proposerId, [
        "voting",
        "propose",
      ]);

      // Create proposal
      const proposalId = await this.votingMechanisms.createProposal(proposal);

      // Create voting session
      const session = await this.createConsensusSession(
        "voting",
        Array.from(this.authenticatedAgents.keys()),
        proposal.proposerId,
        securityLevel,
      );

      // Monitor voting process
      this.monitorVotingForMaliciousBehavior(proposalId, session.sessionId);

      // Create audit event
      await this.createConsensusAuditEvent(
        "secure_voting_started",
        "info",
        proposal.proposerId,
        {
          proposalId,
          sessionId: session.sessionId,
          securityLevel,
        },
      );

      this.emit("secure-voting-started", { proposalId, session });
      return proposalId;
    } catch (error) {
      await this.createConsensusAuditEvent(
        "secure_voting_failed",
        "error",
        proposal.proposerId,
        {
          error: error.message,
        },
      );
      throw error;
    }
  }

  /**
   * Cast secure vote with authentication and malicious detection
   */
  public async castSecureVote(
    voterId: string,
    proposalId: string,
    decision: "approve" | "reject" | "abstain",
    weight: number = 1,
  ): Promise<boolean> {
    try {
      // Verify voter authentication
      const voterIdentity = this.authenticatedAgents.get(voterId);
      if (!voterIdentity) {
        throw new Error("Voter not authenticated");
      }

      // Check authorization
      await this.securityManager.authorizeCapabilities(voterId, [
        "voting",
        "cast-vote",
      ]);

      // Create secure vote
      const vote = {
        voterId,
        proposalId,
        decision,
        weight,
        timestamp: new Date(),
      };

      // Analyze for malicious behavior before casting
      const behaviors = await this.maliciousDetection.analyzeBehavior(
        voterId,
        [],
        [{ ...vote, id: "temp", signature: "temp" }],
      );

      if (behaviors.length > 0) {
        this.securityMetrics.blockedMaliciousAttempts++;
        throw new Error(
          `Malicious behavior detected: ${behaviors.map((b) => b.type).join(", ")}`,
        );
      }

      // Cast vote
      const result = await this.votingMechanisms.castVote(vote);

      // Create audit event
      await this.createConsensusAuditEvent(
        "secure_vote_cast",
        "info",
        voterId,
        {
          proposalId,
          decision,
          weight,
          result,
        },
      );

      return result;
    } catch (error) {
      await this.createConsensusAuditEvent(
        "secure_vote_failed",
        "error",
        voterId,
        {
          proposalId,
          error: error.message,
        },
      );
      throw error;
    }
  }

  /**
   * Execute secure state machine operation
   */
  public async executeSecureStateOperation(
    operation: StateOperation,
    securityLevel: "low" | "medium" | "high" | "critical" = "medium",
  ): Promise<boolean> {
    try {
      // Verify executor authentication
      const executorIdentity = this.authenticatedAgents.get(
        operation.executorId,
      );
      if (!executorIdentity) {
        throw new Error("Executor not authenticated");
      }

      // Check authorization based on operation type
      const requiredCapabilities = this.getRequiredCapabilitiesForOperation(
        operation.type,
      );
      await this.securityManager.authorizeCapabilities(
        operation.executorId,
        requiredCapabilities,
      );

      // Create secure operation with encryption if required
      if (this.config.requireEncryption && securityLevel !== "low") {
        operation.data = await this.encryptOperationData(
          operation.data,
          operation.executorId,
        );
      }

      // Execute operation
      const result =
        await this.stateMachineReplication.executeOperation(operation);

      // Create audit event
      await this.createConsensusAuditEvent(
        "secure_state_operation",
        "info",
        operation.executorId,
        {
          operationType: operation.type,
          target: operation.target,
          result,
          securityLevel,
        },
      );

      return result;
    } catch (error) {
      await this.createConsensusAuditEvent(
        "secure_state_operation_failed",
        "error",
        operation.executorId,
        {
          operationType: operation.type,
          error: error.message,
        },
      );
      throw error;
    }
  }

  /**
   * Handle malicious behavior detection
   */
  private async handleMaliciousBehavior(
    behavior: MaliciousBehavior,
  ): Promise<void> {
    // Store behavior history
    if (!this.maliciousBehaviorHistory.has(behavior.agentId)) {
      this.maliciousBehaviorHistory.set(behavior.agentId, []);
    }
    this.maliciousBehaviorHistory.get(behavior.agentId)!.push(behavior);

    // Take security actions based on severity
    if (behavior.severity === "critical" || behavior.confidence > 0.9) {
      // Remove from all consensus systems
      this.byzantineConsensus.removeAgent(behavior.agentId);
      this.leaderElection.removeAgent(behavior.agentId);

      // Revoke authentication
      this.authenticatedAgents.delete(behavior.agentId);

      // Emergency security action through A2A security manager
      await this.securityManager.emergencyShutdown(
        `Malicious agent detected: ${behavior.agentId}`,
      );
    }

    // Update security metrics
    this.securityMetrics.blockedMaliciousAttempts++;

    // Create security alert
    await this.createConsensusAuditEvent(
      "malicious_behavior_detected",
      "critical",
      behavior.agentId,
      {
        behaviorType: behavior.type,
        severity: behavior.severity,
        confidence: behavior.confidence,
        evidence: behavior.evidence.length,
      },
    );

    this.emit("malicious-behavior-handled", behavior);
  }

  /**
   * Monitor consensus for malicious behavior
   */
  private async monitorConsensusForMaliciousBehavior(
    sessionId: string,
  ): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    const monitoringInterval = setInterval(async () => {
      for (const agentId of session.participants) {
        try {
          // Get recent messages and analyze
          const recentMessages = this.getRecentConsensusMessages(agentId);
          const behaviors = await this.maliciousDetection.analyzeBehavior(
            agentId,
            recentMessages,
            [],
          );

          if (behaviors.length > 0) {
            session.metrics.maliciousAttemptsDetected += behaviors.length;
            for (const behavior of behaviors) {
              await this.handleMaliciousBehavior(behavior);
            }
          }
        } catch (error) {
          console.error(`Error monitoring agent ${agentId}:`, error);
        }
      }
    }, 5000); // Monitor every 5 seconds

    // Clean up when session ends
    setTimeout(() => {
      clearInterval(monitoringInterval);
    }, 300000); // Stop monitoring after 5 minutes
  }

  /**
   * Monitor voting for malicious behavior
   */
  private async monitorVotingForMaliciousBehavior(
    proposalId: string,
    sessionId: string,
  ): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    // Monitor voting anomalies
    const anomalies = this.votingMechanisms.detectVotingAnomalies(proposalId);

    if (anomalies.suspiciousVotes.length > 0 || anomalies.coordinatedVoting) {
      session.metrics.maliciousAttemptsDetected +=
        anomalies.suspiciousVotes.length;

      await this.createConsensusAuditEvent(
        "voting_anomalies_detected",
        "warning",
        "system",
        {
          proposalId,
          suspiciousVotes: anomalies.suspiciousVotes.length,
          coordinatedVoting: anomalies.coordinatedVoting,
          patterns: anomalies.unusualPatterns,
        },
      );
    }
  }

  /**
   * Create secured proposal with authentication and encryption
   */
  private async createSecuredProposal(
    proposal: ConsensusProposal,
    proposerIdentity: A2AIdentity,
    securityLevel: string,
  ): Promise<SecuredConsensusProposal> {
    const securedProposal: SecuredConsensusProposal = {
      ...proposal,
      securityMetadata: {
        proposerIdentity,
        requiredTrustLevel: this.config.securityPolicies.minTrustLevel,
        encryptionEnabled:
          this.config.requireEncryption && securityLevel !== "low",
        auditTrail: [],
        verificationStatus: "pending",
      },
    };

    // Encrypt proposal content if required
    if (securedProposal.securityMetadata.encryptionEnabled) {
      securedProposal.content = await this.encryptProposalContent(
        proposal.content,
        proposal.proposerId,
      );
    }

    // Verify proposal integrity
    securedProposal.securityMetadata.verificationStatus = "verified";

    return securedProposal;
  }

  /**
   * Create consensus session for tracking
   */
  private async createConsensusSession(
    consensusType: "byzantine" | "voting" | "state-machine",
    participants: string[],
    leader: string,
    securityLevel: "low" | "medium" | "high" | "critical",
  ): Promise<SecureConsensusSession> {
    const session: SecureConsensusSession = {
      sessionId: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      participants,
      leader,
      consensusType,
      securityLevel,
      startTime: new Date(),
      status: "active",
      metrics: {
        messagesExchanged: 0,
        consensusRounds: 0,
        maliciousAttemptsDetected: 0,
        averageLatency: 0,
      },
    };

    this.activeSessions.set(session.sessionId, session);
    return session;
  }

  /**
   * Handle secure message broadcast
   */
  private async secureMessageBroadcast(
    consensusMessage: ConsensusMessage,
  ): Promise<void> {
    try {
      // Convert consensus message to A2A message format
      const a2aMessage = await this.securityManager.sendSecureMessage(
        consensusMessage.senderId,
        Array.from(this.authenticatedAgents.keys()),
        "broadcast",
        consensusMessage,
        {
          priority: "high",
          capabilities: ["consensus", "receive-broadcast"],
        },
      );

      // Update session metrics
      for (const session of this.activeSessions.values()) {
        if (session.participants.includes(consensusMessage.senderId)) {
          session.metrics.messagesExchanged++;
        }
      }
    } catch (error) {
      await this.createConsensusAuditEvent(
        "secure_broadcast_failed",
        "error",
        consensusMessage.senderId,
        {
          error: error.message,
          messageType: consensusMessage.type,
        },
      );
    }
  }

  /**
   * Handle secure message received
   */
  private async handleSecureMessageReceived(data: {
    message: A2AMessage;
    payload: any;
    anomalies: string[];
  }): Promise<void> {
    const { message, payload, anomalies } = data;

    // If message contains consensus data, process it
    if (payload && typeof payload === "object" && payload.type) {
      const consensusMessage = payload as ConsensusMessage;

      // Process through appropriate consensus system
      if (
        consensusMessage.type === "pre-prepare" ||
        consensusMessage.type === "prepare" ||
        consensusMessage.type === "commit"
      ) {
        await this.byzantineConsensus.processMessage(consensusMessage);
      }

      // Check for anomalies and potential malicious behavior
      if (anomalies.length > 0) {
        await this.createConsensusAuditEvent(
          "message_anomalies_detected",
          "warning",
          message.from,
          {
            messageId: message.id,
            anomalies,
            consensusMessageType: consensusMessage.type,
          },
        );
      }
    }
  }

  /**
   * Utility methods
   */

  private meetsTrustRequirements(identity: A2AIdentity): boolean {
    const trustLevels = ["untrusted", "basic", "verified", "trusted"];
    const requiredIndex = trustLevels.indexOf(
      this.config.securityPolicies.minTrustLevel,
    );
    const actualIndex = trustLevels.indexOf(identity.trustLevel);

    return actualIndex >= requiredIndex;
  }

  private calculateReputationFromTrust(trustLevel: string): number {
    const trustScores = {
      untrusted: 0.1,
      basic: 0.4,
      verified: 0.7,
      trusted: 1.0,
    };

    return trustScores[trustLevel as keyof typeof trustScores] || 0.1;
  }

  private calculateVotingWeight(identity: A2AIdentity): number {
    const baseWeight = this.calculateReputationFromTrust(identity.trustLevel);
    const capabilityBonus = Math.min(0.2, identity.capabilities.length * 0.02);

    return baseWeight + capabilityBonus;
  }

  private getRequiredCapabilitiesForOperation(operationType: string): string[] {
    const capabilities = {
      create: ["state-machine", "create"],
      update: ["state-machine", "update"],
      delete: ["state-machine", "delete"],
      execute: ["state-machine", "execute", "admin"],
    };

    return (
      capabilities[operationType as keyof typeof capabilities] || [
        "state-machine",
      ]
    );
  }

  private async encryptOperationData(
    data: any,
    executorId: string,
  ): Promise<any> {
    // This would use the A2A security manager's encryption capabilities
    // For now, return the data (in production, implement actual encryption)
    return { encrypted: true, data };
  }

  private async encryptProposalContent(
    content: any,
    proposerId: string,
  ): Promise<any> {
    // Similar to operation data encryption
    return { encrypted: true, content };
  }

  private getRecentConsensusMessages(agentId: string): ConsensusMessage[] {
    // This would track and return recent consensus messages from the agent
    // For now, return empty array
    return [];
  }

  private setupSecurityEventLogging(): void {
    // Setup automatic logging of all consensus operations
    if (this.config.securityPolicies.enableAuditLogging) {
      this.on("consensus-agent-registered", (data) => {
        this.createConsensusAuditEvent(
          "consensus_agent_registered",
          "info",
          data.agentId,
          data,
        );
      });

      this.on("secure-consensus-completed", (data) => {
        this.createConsensusAuditEvent(
          "secure_consensus_completed",
          "info",
          "system",
          data,
        );
      });

      this.on("secure-voting-started", (data) => {
        this.createConsensusAuditEvent(
          "secure_voting_started",
          "info",
          "system",
          data,
        );
      });
    }
  }

  private async createConsensusAuditEvent(
    action: string,
    severity: "info" | "warning" | "error" | "critical",
    agentId: string,
    details: any,
  ): Promise<void> {
    const event: SecurityEvent = {
      id: `consensus-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type: "authentication", // Using existing A2A event types
      severity,
      agentId,
      details: { action, ...details },
      signature: this.calculateEventSignature(action, agentId, details),
    };

    this.consensusAuditLog.push(event);

    // Limit audit log size
    if (this.consensusAuditLog.length > 10000) {
      this.consensusAuditLog = this.consensusAuditLog.slice(-5000);
    }

    this.emit("consensus-audit-event", event);
  }

  private calculateEventSignature(
    action: string,
    agentId: string,
    details: any,
  ): string {
    const data = `${action}:${agentId}:${JSON.stringify(details)}:${Date.now()}`;
    return require("crypto").createHash("sha256").update(data).digest("hex");
  }

  private handleSecurityAlert(event: SecurityEvent): void {
    // Handle A2A security alerts in context of consensus
    if (event.severity === "critical") {
      // Check if this affects any active consensus sessions
      for (const [sessionId, session] of this.activeSessions) {
        if (session.participants.includes(event.agentId)) {
          session.status = "compromised";
          this.emit("consensus-session-compromised", { sessionId, event });
        }
      }
    }
  }

  private handleAgentRegistration(identity: A2AIdentity): void {
    // Automatically register authenticated agents for consensus if they meet requirements
    if (
      this.meetsTrustRequirements(identity) &&
      identity.capabilities.some((cap) =>
        this.config.securityPolicies.requiredCapabilities.includes(cap),
      )
    ) {
      this.emit("agent-eligible-for-consensus", identity);
    }
  }

  private updateSecurityMetrics(performanceMetrics: any): void {
    // Update security metrics based on performance data
    this.securityMetrics.systemThroughput = performanceMetrics.throughput || 0;

    // Calculate security overhead
    const baseLatency = performanceMetrics.latency || 0;
    const securityOverhead = baseLatency * 0.1; // Assume 10% security overhead
    this.securityMetrics.averageSecurityOverhead = securityOverhead;
  }

  /**
   * Public API methods
   */

  /**
   * Get security metrics
   */
  public getSecurityMetrics(): typeof this.securityMetrics {
    return { ...this.securityMetrics };
  }

  /**
   * Get active consensus sessions
   */
  public getActiveSessions(): SecureConsensusSession[] {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Get consensus audit log
   */
  public getConsensusAuditLog(limit: number = 100): SecurityEvent[] {
    return this.consensusAuditLog.slice(-limit);
  }

  /**
   * Get malicious behavior history
   */
  public getMaliciousBehaviorHistory(): Map<string, MaliciousBehavior[]> {
    return new Map(this.maliciousBehaviorHistory);
  }

  /**
   * Emergency shutdown of consensus systems
   */
  public async emergencyShutdown(reason: string): Promise<void> {
    // Shutdown all consensus systems
    this.leaderElection.cleanup();
    this.performanceOptimizer.cleanup();

    // Mark all sessions as compromised
    for (const session of this.activeSessions.values()) {
      session.status = "compromised";
      session.endTime = new Date();
    }

    // Clear sensitive data
    this.authenticatedAgents.clear();
    this.activeSessions.clear();

    await this.createConsensusAuditEvent(
      "consensus_emergency_shutdown",
      "critical",
      "system",
      {
        reason,
        timestamp: Date.now(),
      },
    );

    this.emit("consensus-emergency-shutdown", { reason });
  }

  /**
   * Get system status
   */
  public getSystemStatus(): {
    isOperational: boolean;
    authenticatedAgents: number;
    activeSessions: number;
    securityLevel: string;
    metrics: typeof this.securityMetrics;
  } {
    return {
      isOperational: this.authenticatedAgents.size > 0,
      authenticatedAgents: this.authenticatedAgents.size,
      activeSessions: this.activeSessions.size,
      securityLevel: this.config.securityPolicies.minTrustLevel,
      metrics: this.getSecurityMetrics(),
    };
  }
}

export default ConsensusSecurityIntegration;
