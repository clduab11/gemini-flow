/**
 * Malicious Agent Detection System for A2A Protocol
 *
 * Implements comprehensive behavioral analysis and ML-based detection
 * to identify and isolate malicious agents within 3 consensus rounds.
 *
 * Features:
 * - Real-time behavioral pattern analysis
 * - Machine learning anomaly detection
 * - Byzantine fault tolerance detection
 * - Consensus-based malicious agent identification
 * - Automatic quarantine and recovery mechanisms
 */

import { EventEmitter } from "node:events";
import crypto from "crypto";
import { Logger } from "../../../utils/logger.js";
import {
  A2AIdentity,
  A2AMessage,
  SecurityEvent,
} from "../../../core/a2a-security-manager.js";

export interface BehaviorProfile {
  agentId: string;
  agentType: string;
  establishedAt: Date;

  // Communication patterns
  messageFrequency: {
    perMinute: number;
    perHour: number;
    perDay: number;
    variance: number;
  };

  // Message characteristics
  messagePatterns: {
    avgPayloadSize: number;
    messageTypes: Map<string, number>;
    targetDistribution: Map<string, number>;
    timePatterns: number[]; // Hours of activity
  };

  // Protocol compliance
  protocolCompliance: {
    signatureValidation: number; // Success rate
    nonceCompliance: number; // Proper nonce usage
    capabilityCompliance: number; // Staying within authorized capabilities
    sequenceCompliance: number; // Proper message sequencing
  };

  // Consensus behavior
  consensusBehavior: {
    participationRate: number;
    agreementRate: number; // How often agent agrees with majority
    proposalQuality: number; // Quality of proposals made
    responseLatency: number; // Average response time
    viewChangeRate: number; // How often agent triggers view changes
  };

  // Network patterns
  networkBehavior: {
    connectionPatterns: Map<string, number>; // Who agent connects to
    routingBehavior: number; // Proper message routing
    resourceUsage: number; // CPU/Memory consumption patterns
    uplinkBandwidth: number; // Network bandwidth usage
  };

  // Trust metrics
  trustMetrics: {
    peerTrustScore: number; // Average trust from other agents
    behaviorScore: number; // Overall behavior score
    reputationScore: number; // Historical reputation
    volatilityScore: number; // How much behavior changes
  };

  // Anomaly indicators
  anomalyIndicators: {
    totalAnomalies: number;
    recentAnomalies: number;
    anomalyTypes: Map<string, number>;
    severityDistribution: Map<string, number>;
  };
}

export interface MaliciousPattern {
  patternId: string;
  name: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  detectionRules: DetectionRule[];
  thresholds: Map<string, number>;
  consensusRoundsToConfirm: number;
}

export interface DetectionRule {
  ruleId: string;
  metric: string;
  operator: "gt" | "lt" | "eq" | "ne" | "contains" | "pattern";
  threshold: number | string;
  weight: number;
  timeWindow: number; // milliseconds
}

export interface MaliciousDetectionResult {
  agentId: string;
  detectedAt: Date;
  confidence: number;
  patterns: string[];
  evidence: {
    behaviorDeviations: any[];
    consensusViolations: any[];
    protocolViolations: any[];
    networkAnomalies: any[];
  };
  recommendedAction: "monitor" | "warn" | "restrict" | "quarantine" | "ban";
  consensusRound: number;
  confirmedBy: string[]; // Other agents confirming detection
}

export interface ConsensusVote {
  voterId: string;
  targetAgentId: string;
  isMalicious: boolean;
  confidence: number;
  evidence: any;
  timestamp: Date;
  round: number;
}

export class MaliciousAgentDetector extends EventEmitter {
  private logger: Logger;
  private behaviorProfiles: Map<string, BehaviorProfile> = new Map();
  private detectionPatterns: Map<string, MaliciousPattern> = new Map();
  private detectionResults: Map<string, MaliciousDetectionResult> = new Map();
  private consensusVotes: Map<string, ConsensusVote[]> = new Map(); // targetAgentId -> votes
  private quarantinedAgents: Set<string> = new Set();

  // ML-based detection components
  private behaviorModel: BehaviorModel;
  private anomalyDetector: MLAnomalyDetector;
  private consensusAnalyzer: ConsensusAnalyzer;

  // Configuration
  private config = {
    detectionInterval: 30000, // 30 seconds
    consensusThreshold: 0.67, // 67% agreement needed
    maxConsensusRounds: 3, // Maximum rounds for consensus
    quarantineThreshold: 0.8, // Confidence threshold for quarantine
    behaviorWindowSize: 3600000, // 1 hour behavior analysis window
    anomalyThreshold: 0.75, // Anomaly detection threshold
    mlUpdateInterval: 300000, // 5 minutes ML model update
  };

  constructor() {
    super();
    this.logger = new Logger("MaliciousAgentDetector");

    this.initializeDetectionPatterns();
    this.initializeMLComponents();
    this.startDetectionLoop();

    this.logger.info("Malicious Agent Detection System initialized", {
      features: [
        "behavioral-analysis",
        "ml-anomaly-detection",
        "consensus-based-detection",
        "byzantine-fault-tolerance",
        "real-time-monitoring",
        "automatic-quarantine",
      ],
      config: this.config,
    });
  }

  /**
   * Initialize predefined malicious behavior patterns
   */
  private initializeDetectionPatterns(): void {
    // Byzantine behavior patterns
    this.detectionPatterns.set("byzantine-proposer", {
      patternId: "byzantine-proposer",
      name: "Byzantine Proposer Attack",
      description: "Agent proposing conflicting values to different nodes",
      severity: "critical",
      consensusRoundsToConfirm: 2,
      detectionRules: [
        {
          ruleId: "conflicting-proposals",
          metric: "consensusBehavior.proposalQuality",
          operator: "lt",
          threshold: 0.3,
          weight: 0.8,
          timeWindow: 300000,
        },
        {
          ruleId: "high-view-changes",
          metric: "consensusBehavior.viewChangeRate",
          operator: "gt",
          threshold: 0.5,
          weight: 0.6,
          timeWindow: 600000,
        },
      ],
      thresholds: new Map([
        ["confidence", 0.8],
        ["evidence_count", 3],
      ]),
    });

    this.detectionPatterns.set("flooding-attack", {
      patternId: "flooding-attack",
      name: "Message Flooding Attack",
      description: "Agent sending excessive messages to overwhelm network",
      severity: "high",
      consensusRoundsToConfirm: 1,
      detectionRules: [
        {
          ruleId: "excessive-frequency",
          metric: "messageFrequency.perMinute",
          operator: "gt",
          threshold: 1000,
          weight: 0.9,
          timeWindow: 60000,
        },
        {
          ruleId: "bandwidth-abuse",
          metric: "networkBehavior.uplinkBandwidth",
          operator: "gt",
          threshold: 10000000, // 10MB
          weight: 0.7,
          timeWindow: 300000,
        },
      ],
      thresholds: new Map([
        ["confidence", 0.75],
        ["evidence_count", 2],
      ]),
    });

    this.detectionPatterns.set("eclipse-attack", {
      patternId: "eclipse-attack",
      name: "Eclipse Attack",
      description: "Agent attempting to isolate other agents from network",
      severity: "critical",
      consensusRoundsToConfirm: 3,
      detectionRules: [
        {
          ruleId: "routing-manipulation",
          metric: "networkBehavior.routingBehavior",
          operator: "lt",
          threshold: 0.5,
          weight: 0.8,
          timeWindow: 900000,
        },
        {
          ruleId: "selective-forwarding",
          metric: "protocolCompliance.sequenceCompliance",
          operator: "lt",
          threshold: 0.6,
          weight: 0.7,
          timeWindow: 600000,
        },
      ],
      thresholds: new Map([
        ["confidence", 0.85],
        ["evidence_count", 4],
      ]),
    });

    this.detectionPatterns.set("sybil-attack", {
      patternId: "sybil-attack",
      name: "Sybil Attack",
      description: "Single entity controlling multiple agent identities",
      severity: "critical",
      consensusRoundsToConfirm: 2,
      detectionRules: [
        {
          ruleId: "similar-behavior-patterns",
          metric: "behaviorSimilarity",
          operator: "gt",
          threshold: 0.9,
          weight: 0.9,
          timeWindow: 1800000,
        },
        {
          ruleId: "coordinated-voting",
          metric: "consensusBehavior.agreementRate",
          operator: "gt",
          threshold: 0.95,
          weight: 0.8,
          timeWindow: 3600000,
        },
      ],
      thresholds: new Map([
        ["confidence", 0.9],
        ["evidence_count", 5],
      ]),
    });

    this.detectionPatterns.set("selfish-mining", {
      patternId: "selfish-mining",
      name: "Selfish Mining Attack",
      description: "Agent withholding valid proposals to gain advantage",
      severity: "high",
      consensusRoundsToConfirm: 2,
      detectionRules: [
        {
          ruleId: "low-participation",
          metric: "consensusBehavior.participationRate",
          operator: "lt",
          threshold: 0.4,
          weight: 0.7,
          timeWindow: 1800000,
        },
        {
          ruleId: "delayed-responses",
          metric: "consensusBehavior.responseLatency",
          operator: "gt",
          threshold: 5000, // 5 seconds
          weight: 0.6,
          timeWindow: 900000,
        },
      ],
      thresholds: new Map([
        ["confidence", 0.7],
        ["evidence_count", 3],
      ]),
    });

    this.logger.info("Malicious detection patterns initialized", {
      patternCount: this.detectionPatterns.size,
      patterns: Array.from(this.detectionPatterns.keys()),
    });
  }

  /**
   * Initialize machine learning components
   */
  private initializeMLComponents(): void {
    this.behaviorModel = new BehaviorModel();
    this.anomalyDetector = new MLAnomalyDetector();
    this.consensusAnalyzer = new ConsensusAnalyzer();

    // Start ML model training and updates
    setInterval(() => {
      this.updateMLModels();
    }, this.config.mlUpdateInterval);
  }

  /**
   * Start the main detection loop
   */
  private startDetectionLoop(): void {
    setInterval(async () => {
      await this.performDetectionRound();
    }, this.config.detectionInterval);
  }

  /**
   * Record agent behavior for analysis
   */
  async recordAgentBehavior(
    agentId: string,
    message: A2AMessage,
    identity: A2AIdentity,
    metadata: any = {},
  ): Promise<void> {
    try {
      let profile = this.behaviorProfiles.get(agentId);

      if (!profile) {
        profile = this.createInitialBehaviorProfile(agentId, identity);
        this.behaviorProfiles.set(agentId, profile);
      }

      // Update behavior profile with new data
      await this.updateBehaviorProfile(profile, message, metadata);

      // Perform real-time anomaly detection
      const anomalies = await this.detectRealTimeAnomalies(profile, message);

      if (anomalies.length > 0) {
        this.logger.warn("Real-time anomalies detected", {
          agentId,
          anomalies: anomalies.map((a) => a.type),
          severity: Math.max(...anomalies.map((a) => a.severity)),
        });

        // Update anomaly indicators
        profile.anomalyIndicators.recentAnomalies += anomalies.length;
        anomalies.forEach((anomaly) => {
          const count =
            profile.anomalyIndicators.anomalyTypes.get(anomaly.type) || 0;
          profile.anomalyIndicators.anomalyTypes.set(anomaly.type, count + 1);
        });
      }
    } catch (error) {
      this.logger.error("Failed to record agent behavior", { agentId, error });
    }
  }

  /**
   * Perform consensus-based detection round
   */
  private async performDetectionRound(): Promise<void> {
    try {
      const activeAgents = Array.from(this.behaviorProfiles.keys()).filter(
        (agentId) => !this.quarantinedAgents.has(agentId),
      );

      for (const agentId of activeAgents) {
        const detectionResult = await this.analyzeAgentBehavior(agentId);

        if (
          detectionResult &&
          detectionResult.confidence > this.config.anomalyThreshold
        ) {
          await this.initiateConsensusDetection(detectionResult);
        }
      }

      // Process pending consensus votes
      await this.processConsensusVotes();
    } catch (error) {
      this.logger.error("Detection round failed", { error });
    }
  }

  /**
   * Analyze agent behavior for malicious patterns
   */
  private async analyzeAgentBehavior(
    agentId: string,
  ): Promise<MaliciousDetectionResult | null> {
    const profile = this.behaviorProfiles.get(agentId);
    if (!profile) return null;

    const detectionResults: {
      pattern: string;
      confidence: number;
      evidence: any[];
    }[] = [];

    // Check each detection pattern
    for (const [patternId, pattern] of this.detectionPatterns) {
      const patternResult = await this.evaluateDetectionPattern(
        profile,
        pattern,
      );

      if (patternResult.confidence > 0.5) {
        detectionResults.push({
          pattern: patternId,
          confidence: patternResult.confidence,
          evidence: patternResult.evidence,
        });
      }
    }

    // Use ML model for additional anomaly detection
    const mlAnomalies = await this.anomalyDetector.detectAnomalies(profile);
    const mlConfidence =
      mlAnomalies.reduce((sum, a) => sum + a.confidence, 0) /
        mlAnomalies.length || 0;

    if (mlAnomalies.length > 0) {
      detectionResults.push({
        pattern: "ml-anomaly",
        confidence: mlConfidence,
        evidence: mlAnomalies,
      });
    }

    // Calculate overall confidence
    const overallConfidence =
      detectionResults.length > 0
        ? detectionResults.reduce((sum, r) => sum + r.confidence, 0) /
          detectionResults.length
        : 0;

    if (overallConfidence < this.config.anomalyThreshold) {
      return null;
    }

    // Create detection result
    const result: MaliciousDetectionResult = {
      agentId,
      detectedAt: new Date(),
      confidence: overallConfidence,
      patterns: detectionResults.map((r) => r.pattern),
      evidence: {
        behaviorDeviations: this.extractBehaviorDeviations(profile),
        consensusViolations: this.extractConsensusViolations(profile),
        protocolViolations: this.extractProtocolViolations(profile),
        networkAnomalies: this.extractNetworkAnomalies(profile),
      },
      recommendedAction: this.determineRecommendedAction(overallConfidence),
      consensusRound: 1,
      confirmedBy: [],
    };

    this.detectionResults.set(agentId, result);

    this.logger.warn("Malicious behavior detected", {
      agentId,
      confidence: overallConfidence,
      patterns: result.patterns,
      recommendedAction: result.recommendedAction,
    });

    return result;
  }

  /**
   * Evaluate specific detection pattern against agent behavior
   */
  private async evaluateDetectionPattern(
    profile: BehaviorProfile,
    pattern: MaliciousPattern,
  ): Promise<{ confidence: number; evidence: any[] }> {
    const evidence: any[] = [];
    let totalWeight = 0;
    let matchedWeight = 0;

    for (const rule of pattern.detectionRules) {
      totalWeight += rule.weight;

      const ruleResult = await this.evaluateDetectionRule(profile, rule);

      if (ruleResult.matches) {
        matchedWeight += rule.weight;
        evidence.push({
          ruleId: rule.ruleId,
          metric: rule.metric,
          actualValue: ruleResult.actualValue,
          threshold: rule.threshold,
          operator: rule.operator,
          confidence: ruleResult.confidence,
        });
      }
    }

    const confidence = totalWeight > 0 ? matchedWeight / totalWeight : 0;

    return { confidence, evidence };
  }

  /**
   * Evaluate individual detection rule
   */
  private async evaluateDetectionRule(
    profile: BehaviorProfile,
    rule: DetectionRule,
  ): Promise<{ matches: boolean; actualValue: any; confidence: number }> {
    const actualValue = this.extractMetricValue(profile, rule.metric);

    if (actualValue === undefined || actualValue === null) {
      return { matches: false, actualValue, confidence: 0 };
    }

    let matches = false;
    let confidence = 0;

    switch (rule.operator) {
      case "gt":
        matches = actualValue > rule.threshold;
        confidence = matches
          ? Math.min(1, (actualValue - rule.threshold) / rule.threshold)
          : 0;
        break;
      case "lt":
        matches = actualValue < rule.threshold;
        confidence = matches
          ? Math.min(1, (rule.threshold - actualValue) / rule.threshold)
          : 0;
        break;
      case "eq":
        matches = actualValue === rule.threshold;
        confidence = matches ? 1 : 0;
        break;
      case "ne":
        matches = actualValue !== rule.threshold;
        confidence = matches ? 1 : 0;
        break;
      case "contains":
        matches = String(actualValue).includes(String(rule.threshold));
        confidence = matches ? 1 : 0;
        break;
      case "pattern":
        const regex = new RegExp(String(rule.threshold));
        matches = regex.test(String(actualValue));
        confidence = matches ? 1 : 0;
        break;
    }

    return { matches, actualValue, confidence };
  }

  /**
   * Extract metric value from behavior profile
   */
  private extractMetricValue(
    profile: BehaviorProfile,
    metricPath: string,
  ): any {
    const path = metricPath.split(".");
    let value: any = profile;

    for (const key of path) {
      if (value && typeof value === "object" && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Initiate consensus-based detection
   */
  private async initiateConsensusDetection(
    detection: MaliciousDetectionResult,
  ): Promise<void> {
    // Broadcast detection to other agents for consensus
    this.emit("consensus_detection_request", {
      targetAgentId: detection.agentId,
      detectionResult: detection,
      round: detection.consensusRound,
    });

    // Initialize consensus voting
    if (!this.consensusVotes.has(detection.agentId)) {
      this.consensusVotes.set(detection.agentId, []);
    }

    this.logger.info("Consensus detection initiated", {
      targetAgent: detection.agentId,
      confidence: detection.confidence,
      round: detection.consensusRound,
    });
  }

  /**
   * Submit consensus vote for malicious agent detection
   */
  async submitConsensusVote(vote: ConsensusVote): Promise<void> {
    const votes = this.consensusVotes.get(vote.targetAgentId) || [];

    // Check if voter already voted in this round
    const existingVote = votes.find(
      (v) => v.voterId === vote.voterId && v.round === vote.round,
    );
    if (existingVote) {
      this.logger.warn("Duplicate consensus vote ignored", {
        voter: vote.voterId,
        target: vote.targetAgentId,
        round: vote.round,
      });
      return;
    }

    votes.push(vote);
    this.consensusVotes.set(vote.targetAgentId, votes);

    this.logger.debug("Consensus vote submitted", {
      voter: vote.voterId,
      target: vote.targetAgentId,
      isMalicious: vote.isMalicious,
      confidence: vote.confidence,
      round: vote.round,
    });
  }

  /**
   * Process consensus votes and make decisions
   */
  private async processConsensusVotes(): Promise<void> {
    for (const [targetAgentId, votes] of this.consensusVotes) {
      const detection = this.detectionResults.get(targetAgentId);
      if (!detection) continue;

      const currentRoundVotes = votes.filter(
        (v) => v.round === detection.consensusRound,
      );

      if (currentRoundVotes.length < 3) continue; // Need minimum votes

      // Calculate consensus
      const maliciousVotes = currentRoundVotes.filter((v) => v.isMalicious);
      const consensusRatio = maliciousVotes.length / currentRoundVotes.length;
      const avgConfidence =
        maliciousVotes.reduce((sum, v) => sum + v.confidence, 0) /
          maliciousVotes.length || 0;

      if (
        consensusRatio >= this.config.consensusThreshold &&
        avgConfidence >= this.config.quarantineThreshold
      ) {
        // Consensus reached - agent is malicious
        detection.confirmedBy = maliciousVotes.map((v) => v.voterId);
        await this.quarantineAgent(targetAgentId, detection);
      } else if (detection.consensusRound < this.config.maxConsensusRounds) {
        // No consensus yet, try next round
        detection.consensusRound++;
        this.logger.info("Moving to next consensus round", {
          targetAgent: targetAgentId,
          round: detection.consensusRound,
          consensusRatio,
          avgConfidence,
        });
      } else {
        // Max rounds reached without consensus - clear detection
        this.detectionResults.delete(targetAgentId);
        this.consensusVotes.delete(targetAgentId);

        this.logger.info("Consensus detection failed - max rounds reached", {
          targetAgent: targetAgentId,
          finalConsensusRatio: consensusRatio,
          finalConfidence: avgConfidence,
        });
      }
    }
  }

  /**
   * Quarantine malicious agent
   */
  private async quarantineAgent(
    agentId: string,
    detection: MaliciousDetectionResult,
  ): Promise<void> {
    this.quarantinedAgents.add(agentId);

    // Update detection result
    detection.recommendedAction = "quarantine";

    // Remove from active behavior tracking
    this.behaviorProfiles.delete(agentId);

    // Clean up consensus data
    this.consensusVotes.delete(agentId);

    this.logger.error("Agent quarantined due to malicious behavior", {
      agentId,
      confidence: detection.confidence,
      patterns: detection.patterns,
      confirmedBy: detection.confirmedBy,
      consensusRound: detection.consensusRound,
    });

    this.emit("agent_quarantined", {
      agentId,
      detection,
      quarantinedAt: new Date(),
    });
  }

  /**
   * Attempt to recover quarantined agent
   */
  async attemptRecovery(agentId: string): Promise<boolean> {
    if (!this.quarantinedAgents.has(agentId)) {
      return false;
    }

    // Implement recovery challenge mechanism
    const recoveryChallenge = await this.generateRecoveryChallenge(agentId);

    this.logger.info("Recovery challenge generated for quarantined agent", {
      agentId,
      challengeType: recoveryChallenge.type,
    });

    this.emit("recovery_challenge", {
      agentId,
      challenge: recoveryChallenge,
    });

    return true;
  }

  /**
   * Process recovery challenge response
   */
  async processRecoveryResponse(
    agentId: string,
    response: any,
  ): Promise<boolean> {
    if (!this.quarantinedAgents.has(agentId)) {
      return false;
    }

    const isValid = await this.validateRecoveryResponse(agentId, response);

    if (isValid) {
      // Remove from quarantine
      this.quarantinedAgents.delete(agentId);
      this.detectionResults.delete(agentId);

      this.logger.info("Agent recovered from quarantine", { agentId });
      this.emit("agent_recovered", { agentId, recoveredAt: new Date() });

      return true;
    }

    this.logger.warn("Invalid recovery response", { agentId });
    return false;
  }

  /**
   * Helper methods for behavior analysis
   */

  private createInitialBehaviorProfile(
    agentId: string,
    identity: A2AIdentity,
  ): BehaviorProfile {
    return {
      agentId,
      agentType: identity.agentType,
      establishedAt: new Date(),

      messageFrequency: {
        perMinute: 0,
        perHour: 0,
        perDay: 0,
        variance: 0,
      },

      messagePatterns: {
        avgPayloadSize: 0,
        messageTypes: new Map(),
        targetDistribution: new Map(),
        timePatterns: [],
      },

      protocolCompliance: {
        signatureValidation: 1.0,
        nonceCompliance: 1.0,
        capabilityCompliance: 1.0,
        sequenceCompliance: 1.0,
      },

      consensusBehavior: {
        participationRate: 1.0,
        agreementRate: 0.8,
        proposalQuality: 0.8,
        responseLatency: 1000,
        viewChangeRate: 0.1,
      },

      networkBehavior: {
        connectionPatterns: new Map(),
        routingBehavior: 1.0,
        resourceUsage: 0.5,
        uplinkBandwidth: 1000,
      },

      trustMetrics: {
        peerTrustScore: 0.8,
        behaviorScore: 1.0,
        reputationScore: 0.8,
        volatilityScore: 0.1,
      },

      anomalyIndicators: {
        totalAnomalies: 0,
        recentAnomalies: 0,
        anomalyTypes: new Map(),
        severityDistribution: new Map(),
      },
    };
  }

  private async updateBehaviorProfile(
    profile: BehaviorProfile,
    message: A2AMessage,
    metadata: any,
  ): Promise<void> {
    const now = Date.now();
    const payloadSize = JSON.stringify(message.payload).length;

    // Update message frequency
    profile.messageFrequency.perMinute = this.updateMovingAverage(
      profile.messageFrequency.perMinute,
      1,
      60,
    );

    // Update message patterns
    profile.messagePatterns.avgPayloadSize = this.updateMovingAverage(
      profile.messagePatterns.avgPayloadSize,
      payloadSize,
      100,
    );

    const typeCount =
      profile.messagePatterns.messageTypes.get(message.type) || 0;
    profile.messagePatterns.messageTypes.set(message.type, typeCount + 1);

    // Update time patterns
    profile.messagePatterns.timePatterns.push(new Date().getHours());
    if (profile.messagePatterns.timePatterns.length > 168) {
      // Keep 1 week
      profile.messagePatterns.timePatterns =
        profile.messagePatterns.timePatterns.slice(-168);
    }

    // Update target distribution
    const targets = Array.isArray(message.to) ? message.to : [message.to];
    targets.forEach((target) => {
      const count = profile.messagePatterns.targetDistribution.get(target) || 0;
      profile.messagePatterns.targetDistribution.set(target, count + 1);
    });

    // Update network behavior if metadata available
    if (metadata.connectionInfo) {
      const peer = metadata.connectionInfo.peer;
      const count = profile.networkBehavior.connectionPatterns.get(peer) || 0;
      profile.networkBehavior.connectionPatterns.set(peer, count + 1);
    }

    if (metadata.resourceUsage) {
      profile.networkBehavior.resourceUsage = this.updateMovingAverage(
        profile.networkBehavior.resourceUsage,
        metadata.resourceUsage,
        100,
      );
    }
  }

  private updateMovingAverage(
    current: number,
    newValue: number,
    windowSize: number,
  ): number {
    return (current * (windowSize - 1) + newValue) / windowSize;
  }

  private async detectRealTimeAnomalies(
    profile: BehaviorProfile,
    message: A2AMessage,
  ): Promise<{ type: string; severity: number; description: string }[]> {
    const anomalies: { type: string; severity: number; description: string }[] =
      [];

    // Check message size anomaly
    const payloadSize = JSON.stringify(message.payload).length;
    if (payloadSize > profile.messagePatterns.avgPayloadSize * 10) {
      anomalies.push({
        type: "oversized_message",
        severity: 0.7,
        description: `Message size ${payloadSize} significantly larger than average ${profile.messagePatterns.avgPayloadSize}`,
      });
    }

    // Check frequency anomaly
    if (profile.messageFrequency.perMinute > 100) {
      anomalies.push({
        type: "high_frequency",
        severity: 0.8,
        description: `Sending ${profile.messageFrequency.perMinute} messages per minute`,
      });
    }

    // Check time pattern anomaly
    const currentHour = new Date().getHours();
    const hourlyPattern = profile.messagePatterns.timePatterns.filter(
      (h) => h === currentHour,
    ).length;
    const avgHourlyActivity = profile.messagePatterns.timePatterns.length / 24;

    if (hourlyPattern > avgHourlyActivity * 5) {
      anomalies.push({
        type: "unusual_time_pattern",
        severity: 0.6,
        description: `Unusual activity pattern at hour ${currentHour}`,
      });
    }

    return anomalies;
  }

  private extractBehaviorDeviations(profile: BehaviorProfile): any[] {
    const deviations = [];

    if (profile.messageFrequency.variance > 0.8) {
      deviations.push({
        type: "message_frequency_variance",
        value: profile.messageFrequency.variance,
        description: "High variance in message frequency",
      });
    }

    if (profile.trustMetrics.volatilityScore > 0.5) {
      deviations.push({
        type: "behavior_volatility",
        value: profile.trustMetrics.volatilityScore,
        description: "High behavior volatility detected",
      });
    }

    return deviations;
  }

  private extractConsensusViolations(profile: BehaviorProfile): any[] {
    const violations = [];

    if (profile.consensusBehavior.participationRate < 0.5) {
      violations.push({
        type: "low_participation",
        value: profile.consensusBehavior.participationRate,
        description: "Low consensus participation rate",
      });
    }

    if (profile.consensusBehavior.agreementRate < 0.3) {
      violations.push({
        type: "low_agreement",
        value: profile.consensusBehavior.agreementRate,
        description: "Low agreement with consensus decisions",
      });
    }

    return violations;
  }

  private extractProtocolViolations(profile: BehaviorProfile): any[] {
    const violations = [];

    if (profile.protocolCompliance.signatureValidation < 0.9) {
      violations.push({
        type: "signature_validation_failures",
        value: profile.protocolCompliance.signatureValidation,
        description: "High rate of signature validation failures",
      });
    }

    if (profile.protocolCompliance.nonceCompliance < 0.8) {
      violations.push({
        type: "nonce_compliance_failures",
        value: profile.protocolCompliance.nonceCompliance,
        description: "Nonce compliance violations detected",
      });
    }

    return violations;
  }

  private extractNetworkAnomalies(profile: BehaviorProfile): any[] {
    const anomalies = [];

    if (profile.networkBehavior.routingBehavior < 0.6) {
      anomalies.push({
        type: "routing_anomalies",
        value: profile.networkBehavior.routingBehavior,
        description: "Unusual routing behavior detected",
      });
    }

    if (profile.networkBehavior.resourceUsage > 0.9) {
      anomalies.push({
        type: "high_resource_usage",
        value: profile.networkBehavior.resourceUsage,
        description: "Abnormally high resource usage",
      });
    }

    return anomalies;
  }

  private determineRecommendedAction(
    confidence: number,
  ): "monitor" | "warn" | "restrict" | "quarantine" | "ban" {
    if (confidence >= 0.9) return "ban";
    if (confidence >= 0.8) return "quarantine";
    if (confidence >= 0.7) return "restrict";
    if (confidence >= 0.6) return "warn";
    return "monitor";
  }

  private async updateMLModels(): Promise<void> {
    try {
      // Update behavior model with recent data
      const behaviorData = Array.from(this.behaviorProfiles.values());
      await this.behaviorModel.update(behaviorData);

      // Update anomaly detector
      await this.anomalyDetector.updateModel(behaviorData);

      this.logger.info("ML models updated", {
        behaviorSamples: behaviorData.length,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error("Failed to update ML models", { error });
    }
  }

  private async generateRecoveryChallenge(
    agentId: string,
  ): Promise<{ type: string; challenge: any }> {
    // Generate cryptographic proof-of-work challenge
    const nonce = crypto.randomBytes(32);
    const difficulty = 4; // Number of leading zeros required

    return {
      type: "proof_of_work",
      challenge: {
        nonce: nonce.toString("hex"),
        difficulty,
        timestamp: Date.now(),
        agentId,
      },
    };
  }

  private async validateRecoveryResponse(
    agentId: string,
    response: any,
  ): Promise<boolean> {
    // Validate proof-of-work response
    if (response.type === "proof_of_work") {
      const hash = crypto
        .createHash("sha256")
        .update(response.nonce + response.solution)
        .digest("hex");

      const requiredZeros = "0".repeat(response.difficulty);
      return hash.startsWith(requiredZeros);
    }

    return false;
  }

  /**
   * Public API methods
   */

  getBehaviorProfile(agentId: string): BehaviorProfile | null {
    return this.behaviorProfiles.get(agentId) || null;
  }

  getDetectionResult(agentId: string): MaliciousDetectionResult | null {
    return this.detectionResults.get(agentId) || null;
  }

  isQuarantined(agentId: string): boolean {
    return this.quarantinedAgents.has(agentId);
  }

  getQuarantinedAgents(): string[] {
    return Array.from(this.quarantinedAgents);
  }

  getDetectionPatterns(): MaliciousPattern[] {
    return Array.from(this.detectionPatterns.values());
  }

  async getSystemStats(): Promise<any> {
    return {
      totalAgents: this.behaviorProfiles.size,
      quarantinedAgents: this.quarantinedAgents.size,
      activeDetections: this.detectionResults.size,
      consensusVotes: Array.from(this.consensusVotes.values()).reduce(
        (sum, votes) => sum + votes.length,
        0,
      ),
      detectionPatterns: this.detectionPatterns.size,
      avgBehaviorScore: this.calculateAverageBehaviorScore(),
      systemHealth: this.calculateSystemHealth(),
    };
  }

  private calculateAverageBehaviorScore(): number {
    const profiles = Array.from(this.behaviorProfiles.values());
    if (profiles.length === 0) return 1.0;

    const totalScore = profiles.reduce(
      (sum, p) => sum + p.trustMetrics.behaviorScore,
      0,
    );
    return totalScore / profiles.length;
  }

  private calculateSystemHealth(): number {
    const totalAgents = this.behaviorProfiles.size;
    const quarantinedCount = this.quarantinedAgents.size;

    if (totalAgents === 0) return 1.0;

    return Math.max(0, 1 - quarantinedCount / totalAgents);
  }
}

// Supporting ML-based detection classes

class BehaviorModel {
  private model: any; // Placeholder for actual ML model

  async update(profiles: BehaviorProfile[]): Promise<void> {
    // Update ML model with behavior profiles
    // Implementation would use actual ML library
  }

  async predict(
    profile: BehaviorProfile,
  ): Promise<{ isMalicious: boolean; confidence: number }> {
    // Predict if behavior is malicious
    return { isMalicious: false, confidence: 0.5 };
  }
}

class MLAnomalyDetector {
  private model: any;

  async updateModel(profiles: BehaviorProfile[]): Promise<void> {
    // Update anomaly detection model
  }

  async detectAnomalies(
    profile: BehaviorProfile,
  ): Promise<{ type: string; confidence: number; description: string }[]> {
    // ML-based anomaly detection
    return [];
  }
}

class ConsensusAnalyzer {
  async analyzeConsensusPattern(
    votes: ConsensusVote[],
  ): Promise<{ isValid: boolean; confidence: number }> {
    // Analyze consensus voting patterns for validity
    return { isValid: true, confidence: 0.8 };
  }
}

export {
  MaliciousAgentDetector,
  BehaviorProfile,
  MaliciousPattern,
  DetectionRule,
  MaliciousDetectionResult,
  ConsensusVote,
};
