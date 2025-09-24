/**
 * Quarantine and Recovery System for A2A Protocol
 *
 * Implements comprehensive quarantine and recovery mechanisms for
 * compromised agents, providing secure isolation, rehabilitation
 * challenges, and graduated recovery processes.
 *
 * Features:
 * - Multi-level quarantine isolation (soft, hard, complete)
 * - Progressive recovery challenges and verification
 * - Behavioral rehabilitation programs
 * - Automated recovery monitoring and assessment
 * - Economic incentives and penalties for recovery
 * - Distributed consensus for quarantine and recovery decisions
 */

import { EventEmitter } from "node:events";
import crypto from "crypto";
import { Logger } from "../../../utils/logger.js";
import { A2AIdentity, A2AMessage } from "../../../core/a2a-security-manager.js";
import { MaliciousDetectionResult } from "./malicious-detection.js";
import { ReputationScore } from "./reputation-system.js";

export interface QuarantineLevel {
  level: "observation" | "soft" | "hard" | "complete";
  name: string;
  description: string;
  restrictions: {
    messageRateLimit: number; // Messages per minute
    allowedOperations: string[]; // Allowed operations
    networkAccess: boolean; // Network access allowed
    consensusParticipation: boolean; // Can participate in consensus
    peerInteraction: boolean; // Can interact with other agents
    resourceAccess: string[]; // Allowed resources
  };
  duration: {
    minimum: number; // Minimum quarantine time (ms)
    maximum: number; // Maximum quarantine time (ms)
    extendable: boolean; // Can be extended
  };
  recoveryRequirements: {
    challengesRequired: number; // Number of challenges to complete
    peerEndorsements: number; // Peer endorsements needed
    behaviorScore: number; // Minimum behavior score
    proofOfWork: boolean; // Requires proof of work
    economicStake: number; // Economic stake required
  };
}

export interface QuarantineRecord {
  agentId: string;
  quarantineId: string;
  level: QuarantineLevel["level"];
  startTime: Date;
  endTime?: Date;
  reason: string;
  evidence: any;
  detectionResult: MaliciousDetectionResult;

  // Status tracking
  status: "active" | "suspended" | "recovered" | "escalated" | "permanent";
  extensions: QuarantineExtension[];
  violations: QuarantineViolation[];

  // Recovery progress
  recoveryProgress: {
    challengesCompleted: number;
    challengesFailed: number;
    peerEndorsements: number;
    behaviorScore: number;
    stakePledged: number;
    recoveryAttempts: number;
  };

  // Monitoring data
  monitoring: {
    activityLevel: number;
    complianceScore: number;
    communicationPatterns: any[];
    resourceUsage: any[];
    lastActivity: Date;
  };

  metadata: {
    createdBy: string;
    approvedBy: string[];
    reviewedBy: string[];
    lastUpdated: Date;
    notes: string[];
  };
}

export interface QuarantineExtension {
  extensionId: string;
  reason: string;
  additionalTime: number; // Additional time in ms
  requestedBy: string;
  approvedBy: string[];
  timestamp: Date;
  evidence: any;
}

export interface QuarantineViolation {
  violationId: string;
  type:
    | "access_attempt"
    | "rate_limit_exceeded"
    | "unauthorized_operation"
    | "malicious_activity";
  description: string;
  timestamp: Date;
  evidence: any;
  severity: "minor" | "moderate" | "severe" | "critical";
  penalty: {
    timeExtension?: number; // Additional quarantine time
    levelEscalation?: boolean; // Escalate quarantine level
    economicPenalty?: number; // Economic penalty
  };
}

export interface RecoveryChallenge {
  challengeId: string;
  agentId: string;
  type:
    | "behavioral_compliance"
    | "security_audit"
    | "peer_collaboration"
    | "proof_of_work"
    | "skill_demonstration";
  name: string;
  description: string;
  requirements: any;
  timeLimit: number;
  maxAttempts: number;

  // Scoring
  passingScore: number;
  weight: number; // Weight in overall recovery score

  // Status
  status: "pending" | "in_progress" | "completed" | "failed" | "expired";
  attempts: ChallengeAttempt[];

  // Results
  finalScore?: number;
  completedAt?: Date;
  evidence?: any;
  reviewedBy?: string[];
}

export interface ChallengeAttempt {
  attemptId: string;
  startTime: Date;
  endTime?: Date;
  response: any;
  score: number;
  feedback: string;
  reviewedBy: string;
  evidence: any;
}

export interface PeerEndorsement {
  endorsementId: string;
  fromAgentId: string;
  toAgentId: string;
  type: "character" | "technical" | "trustworthiness" | "rehabilitation";
  strength: "weak" | "moderate" | "strong";
  message?: string;
  evidence?: any;
  timestamp: Date;
  signature: string;

  // Validation
  validated: boolean;
  validatedBy?: string;
  weight: number; // Weight based on endorser's reputation
}

export interface RecoveryPlan {
  planId: string;
  agentId: string;
  targetLevel: QuarantineLevel["level"] | "full_recovery";
  estimatedDuration: number;

  phases: RecoveryPhase[];
  requirements: {
    totalChallenges: number;
    minimumScore: number;
    peerEndorsements: number;
    behaviorThreshold: number;
    economicStake: number;
  };

  progress: {
    currentPhase: number;
    overallProgress: number; // 0-1
    phasesCompleted: number;
    challengesCompleted: number;
    endorsementsReceived: number;
  };

  status: "draft" | "active" | "paused" | "completed" | "failed";
  createdAt: Date;
  lastUpdated: Date;
}

export interface RecoveryPhase {
  phaseId: string;
  name: string;
  description: string;
  order: number;
  duration: number;

  challenges: string[]; // Challenge IDs
  requirements: {
    minChallengeScore: number;
    requiredEndorsements: number;
    behaviorThreshold: number;
    noViolations: boolean;
  };

  status: "pending" | "active" | "completed" | "failed";
  startedAt?: Date;
  completedAt?: Date;
}

export class QuarantineRecoveryManager extends EventEmitter {
  private logger: Logger;
  private quarantineLevels: Map<string, QuarantineLevel> = new Map();
  private quarantineRecords: Map<string, QuarantineRecord> = new Map(); // agentId -> record
  private recoveryChallenges: Map<string, RecoveryChallenge> = new Map(); // challengeId -> challenge
  private peerEndorsements: Map<string, PeerEndorsement[]> = new Map(); // agentId -> endorsements
  private recoveryPlans: Map<string, RecoveryPlan> = new Map(); // agentId -> plan

  // Monitoring and assessment
  private behaviorMonitor: BehaviorMonitor;
  private recoveryAssessor: RecoveryAssessor;
  private challengeValidator: ChallengeValidator;
  private endorsementValidator: EndorsementValidator;

  // Configuration
  private config = {
    quarantine: {
      defaultLevel: "soft" as const,
      maxExtensions: 3,
      escalationThreshold: 3, // Violations before escalation
      permanentThreshold: 10, // Violations before permanent ban
      reviewInterval: 3600000, // 1 hour review interval
    },
    recovery: {
      maxAttempts: 3,
      challengeTimeout: 3600000, // 1 hour per challenge
      endorsementValidityPeriod: 2592000000, // 30 days
      minimumRecoveryTime: 86400000, // 24 hours minimum
      maxRecoveryTime: 2592000000, // 30 days maximum
    },
    monitoring: {
      activityThreshold: 0.1, // Minimum activity level
      complianceThreshold: 0.8, // Minimum compliance score
      assessmentInterval: 1800000, // 30 minutes
      violationGracePeriod: 300000, // 5 minutes grace period
    },
  };

  constructor() {
    super();
    this.logger = new Logger("QuarantineRecoveryManager");

    this.initializeQuarantineLevels();
    this.initializeComponents();
    this.startMonitoring();

    this.logger.info("Quarantine Recovery Manager initialized", {
      features: [
        "multi-level-quarantine",
        "progressive-recovery",
        "behavioral-rehabilitation",
        "peer-endorsements",
        "economic-incentives",
        "automated-monitoring",
      ],
      levels: Array.from(this.quarantineLevels.keys()),
    });
  }

  /**
   * Initialize quarantine levels
   */
  private initializeQuarantineLevels(): void {
    // Observation Level - Minimal restrictions
    this.quarantineLevels.set("observation", {
      level: "observation",
      name: "Observation",
      description: "Monitoring with minimal restrictions",
      restrictions: {
        messageRateLimit: 50,
        allowedOperations: ["read", "status", "query"],
        networkAccess: true,
        consensusParticipation: true,
        peerInteraction: true,
        resourceAccess: ["public", "shared"],
      },
      duration: {
        minimum: 3600000, // 1 hour
        maximum: 86400000, // 24 hours
        extendable: true,
      },
      recoveryRequirements: {
        challengesRequired: 1,
        peerEndorsements: 1,
        behaviorScore: 0.6,
        proofOfWork: false,
        economicStake: 0,
      },
    });

    // Soft Quarantine - Moderate restrictions
    this.quarantineLevels.set("soft", {
      level: "soft",
      name: "Soft Quarantine",
      description: "Limited operations with monitoring",
      restrictions: {
        messageRateLimit: 20,
        allowedOperations: ["read", "status"],
        networkAccess: true,
        consensusParticipation: false,
        peerInteraction: true,
        resourceAccess: ["public"],
      },
      duration: {
        minimum: 86400000, // 24 hours
        maximum: 604800000, // 7 days
        extendable: true,
      },
      recoveryRequirements: {
        challengesRequired: 3,
        peerEndorsements: 2,
        behaviorScore: 0.7,
        proofOfWork: true,
        economicStake: 1000,
      },
    });

    // Hard Quarantine - Severe restrictions
    this.quarantineLevels.set("hard", {
      level: "hard",
      name: "Hard Quarantine",
      description: "Severe restrictions with supervised access",
      restrictions: {
        messageRateLimit: 5,
        allowedOperations: ["status"],
        networkAccess: false,
        consensusParticipation: false,
        peerInteraction: false,
        resourceAccess: [],
      },
      duration: {
        minimum: 604800000, // 7 days
        maximum: 2592000000, // 30 days
        extendable: true,
      },
      recoveryRequirements: {
        challengesRequired: 5,
        peerEndorsements: 5,
        behaviorScore: 0.8,
        proofOfWork: true,
        economicStake: 5000,
      },
    });

    // Complete Isolation - Total isolation
    this.quarantineLevels.set("complete", {
      level: "complete",
      name: "Complete Isolation",
      description: "Total isolation from the system",
      restrictions: {
        messageRateLimit: 0,
        allowedOperations: [],
        networkAccess: false,
        consensusParticipation: false,
        peerInteraction: false,
        resourceAccess: [],
      },
      duration: {
        minimum: 2592000000, // 30 days
        maximum: 7776000000, // 90 days
        extendable: false,
      },
      recoveryRequirements: {
        challengesRequired: 10,
        peerEndorsements: 10,
        behaviorScore: 0.9,
        proofOfWork: true,
        economicStake: 10000,
      },
    });
  }

  /**
   * Initialize monitoring components
   */
  private initializeComponents(): void {
    this.behaviorMonitor = new BehaviorMonitor(this.config);
    this.recoveryAssessor = new RecoveryAssessor(this.config);
    this.challengeValidator = new ChallengeValidator(this.config);
    this.endorsementValidator = new EndorsementValidator(this.config);
  }

  /**
   * Start monitoring loops
   */
  private startMonitoring(): void {
    // Monitor quarantined agents
    setInterval(async () => {
      await this.monitorQuarantinedAgents();
    }, this.config.monitoring.assessmentInterval);

    // Review quarantine status
    setInterval(async () => {
      await this.reviewQuarantineStatus();
    }, this.config.quarantine.reviewInterval);

    // Process recovery challenges
    setInterval(async () => {
      await this.processRecoveryChallenges();
    }, 60000); // Every minute
  }

  /**
   * Quarantine an agent
   */
  async quarantineAgent(
    agentId: string,
    level: QuarantineLevel["level"],
    reason: string,
    evidence: any,
    detectionResult: MaliciousDetectionResult,
    createdBy: string = "system",
  ): Promise<QuarantineRecord> {
    const existingRecord = this.quarantineRecords.get(agentId);
    if (existingRecord && existingRecord.status === "active") {
      // Escalate existing quarantine
      return await this.escalateQuarantine(agentId, level, reason, evidence);
    }

    const quarantineLevel = this.quarantineLevels.get(level);
    if (!quarantineLevel) {
      throw new Error(`Invalid quarantine level: ${level}`);
    }

    const record: QuarantineRecord = {
      agentId,
      quarantineId: crypto.randomUUID(),
      level,
      startTime: new Date(),
      reason,
      evidence,
      detectionResult,
      status: "active",
      extensions: [],
      violations: [],
      recoveryProgress: {
        challengesCompleted: 0,
        challengesFailed: 0,
        peerEndorsements: 0,
        behaviorScore: 0.0,
        stakePledged: 0,
        recoveryAttempts: 0,
      },
      monitoring: {
        activityLevel: 0,
        complianceScore: 1.0,
        communicationPatterns: [],
        resourceUsage: [],
        lastActivity: new Date(),
      },
      metadata: {
        createdBy,
        approvedBy: [createdBy],
        reviewedBy: [],
        lastUpdated: new Date(),
        notes: [`Initial quarantine: ${reason}`],
      },
    };

    this.quarantineRecords.set(agentId, record);

    // Create recovery plan
    const recoveryPlan = await this.createRecoveryPlan(
      agentId,
      quarantineLevel,
    );
    this.recoveryPlans.set(agentId, recoveryPlan);

    // Schedule automatic review
    this.scheduleQuarantineReview(agentId, quarantineLevel.duration.minimum);

    this.logger.error("Agent quarantined", {
      agentId,
      level,
      reason,
      quarantineId: record.quarantineId,
      duration: `${quarantineLevel.duration.minimum}ms - ${quarantineLevel.duration.maximum}ms`,
    });

    this.emit("agent_quarantined", {
      agentId,
      record,
      recoveryPlan,
    });

    return record;
  }

  /**
   * Create recovery plan for quarantined agent
   */
  private async createRecoveryPlan(
    agentId: string,
    quarantineLevel: QuarantineLevel,
  ): Promise<RecoveryPlan> {
    const phases = this.generateRecoveryPhases(quarantineLevel);

    const plan: RecoveryPlan = {
      planId: crypto.randomUUID(),
      agentId,
      targetLevel: "full_recovery",
      estimatedDuration: this.calculateRecoveryDuration(quarantineLevel),
      phases,
      requirements: {
        totalChallenges:
          quarantineLevel.recoveryRequirements.challengesRequired,
        minimumScore: 0.8,
        peerEndorsements: quarantineLevel.recoveryRequirements.peerEndorsements,
        behaviorThreshold: quarantineLevel.recoveryRequirements.behaviorScore,
        economicStake: quarantineLevel.recoveryRequirements.economicStake,
      },
      progress: {
        currentPhase: 0,
        overallProgress: 0,
        phasesCompleted: 0,
        challengesCompleted: 0,
        endorsementsReceived: 0,
      },
      status: "active",
      createdAt: new Date(),
      lastUpdated: new Date(),
    };

    // Generate challenges for each phase
    for (const phase of phases) {
      const challenges = await this.generatePhaseChallenges(
        agentId,
        phase,
        quarantineLevel,
      );
      phase.challenges = challenges.map((c) => c.challengeId);

      // Store challenges
      challenges.forEach((challenge) => {
        this.recoveryChallenges.set(challenge.challengeId, challenge);
      });
    }

    return plan;
  }

  /**
   * Submit recovery challenge response
   */
  async submitChallengeResponse(
    challengeId: string,
    agentId: string,
    response: any,
  ): Promise<{ success: boolean; score: number; feedback: string }> {
    const challenge = this.recoveryChallenges.get(challengeId);
    const record = this.quarantineRecords.get(agentId);

    if (!challenge || !record || challenge.agentId !== agentId) {
      throw new Error("Invalid challenge or agent not quarantined");
    }

    if (challenge.status !== "pending" && challenge.status !== "in_progress") {
      throw new Error(`Challenge cannot be submitted: ${challenge.status}`);
    }

    // Check attempt limits
    if (challenge.attempts.length >= challenge.maxAttempts) {
      throw new Error("Maximum attempts exceeded");
    }

    // Mark as in progress
    challenge.status = "in_progress";

    const attempt: ChallengeAttempt = {
      attemptId: crypto.randomUUID(),
      startTime: new Date(),
      response,
      score: 0,
      feedback: "",
      reviewedBy: "system",
      evidence: {},
    };

    try {
      // Validate and score the response
      const validation = await this.challengeValidator.validateResponse(
        challenge,
        response,
      );

      attempt.score = validation.score;
      attempt.feedback = validation.feedback;
      attempt.evidence = validation.evidence;
      attempt.endTime = new Date();

      challenge.attempts.push(attempt);

      if (validation.score >= challenge.passingScore) {
        // Challenge passed
        challenge.status = "completed";
        challenge.finalScore = validation.score;
        challenge.completedAt = new Date();

        // Update recovery progress
        record.recoveryProgress.challengesCompleted++;

        // Check if phase is complete
        await this.checkPhaseCompletion(agentId);

        this.logger.info("Recovery challenge completed", {
          agentId,
          challengeId,
          score: validation.score,
          type: challenge.type,
        });

        this.emit("challenge_completed", {
          agentId,
          challenge,
          attempt,
          validation,
        });

        return {
          success: true,
          score: validation.score,
          feedback: validation.feedback,
        };
      } else {
        // Challenge failed
        if (challenge.attempts.length >= challenge.maxAttempts) {
          challenge.status = "failed";
          record.recoveryProgress.challengesFailed++;

          this.logger.warn("Recovery challenge failed permanently", {
            agentId,
            challengeId,
            attempts: challenge.attempts.length,
            maxAttempts: challenge.maxAttempts,
          });
        }

        return {
          success: false,
          score: validation.score,
          feedback: validation.feedback,
        };
      }
    } catch (error) {
      attempt.endTime = new Date();
      attempt.feedback = `Validation error: ${error.message}`;
      challenge.attempts.push(attempt);
      challenge.status = "pending"; // Allow retry

      this.logger.error("Challenge validation failed", {
        agentId,
        challengeId,
        error,
      });

      throw error;
    }
  }

  /**
   * Submit peer endorsement
   */
  async submitPeerEndorsement(
    fromAgentId: string,
    toAgentId: string,
    type: "character" | "technical" | "trustworthiness" | "rehabilitation",
    strength: "weak" | "moderate" | "strong",
    message?: string,
    evidence?: any,
  ): Promise<boolean> {
    const record = this.quarantineRecords.get(toAgentId);
    if (!record || record.status !== "active") {
      throw new Error("Agent not in active quarantine");
    }

    // Validate endorser
    const isValidEndorser = await this.endorsementValidator.validateEndorser(
      fromAgentId,
      toAgentId,
    );
    if (!isValidEndorser) {
      this.logger.warn("Invalid endorser", { fromAgentId, toAgentId });
      return false;
    }

    const endorsement: PeerEndorsement = {
      endorsementId: crypto.randomUUID(),
      fromAgentId,
      toAgentId,
      type,
      strength,
      message,
      evidence,
      timestamp: new Date(),
      signature: await this.signEndorsement(
        fromAgentId,
        toAgentId,
        type,
        strength,
      ),
      validated: true,
      validatedBy: "system",
      weight: await this.calculateEndorsementWeight(fromAgentId),
    };

    // Store endorsement
    const endorsements = this.peerEndorsements.get(toAgentId) || [];
    endorsements.push(endorsement);
    this.peerEndorsements.set(toAgentId, endorsements);

    // Update recovery progress
    record.recoveryProgress.peerEndorsements++;

    this.logger.info("Peer endorsement submitted", {
      fromAgent: fromAgentId,
      toAgent: toAgentId,
      type,
      strength,
      weight: endorsement.weight,
    });

    this.emit("peer_endorsement", endorsement);
    return true;
  }

  /**
   * Check agent's recovery eligibility
   */
  async checkRecoveryEligibility(agentId: string): Promise<{
    eligible: boolean;
    progress: number;
    missingRequirements: string[];
    estimatedTimeRemaining: number;
  }> {
    const record = this.quarantineRecords.get(agentId);
    const plan = this.recoveryPlans.get(agentId);

    if (!record || !plan) {
      return {
        eligible: false,
        progress: 0,
        missingRequirements: ["Agent not in quarantine"],
        estimatedTimeRemaining: 0,
      };
    }

    const quarantineLevel = this.quarantineLevels.get(record.level)!;
    const requirements = quarantineLevel.recoveryRequirements;
    const progress = record.recoveryProgress;
    const missingRequirements: string[] = [];

    // Check minimum time requirement
    const timeInQuarantine = Date.now() - record.startTime.getTime();
    if (timeInQuarantine < quarantineLevel.duration.minimum) {
      missingRequirements.push(
        `Minimum time not met (${Math.ceil((quarantineLevel.duration.minimum - timeInQuarantine) / 3600000)} hours remaining)`,
      );
    }

    // Check challenge requirements
    if (progress.challengesCompleted < requirements.challengesRequired) {
      missingRequirements.push(
        `Challenges: ${progress.challengesCompleted}/${requirements.challengesRequired}`,
      );
    }

    // Check peer endorsements
    if (progress.peerEndorsements < requirements.peerEndorsements) {
      missingRequirements.push(
        `Endorsements: ${progress.peerEndorsements}/${requirements.peerEndorsements}`,
      );
    }

    // Check behavior score
    if (progress.behaviorScore < requirements.behaviorScore) {
      missingRequirements.push(
        `Behavior score: ${progress.behaviorScore.toFixed(2)}/${requirements.behaviorScore}`,
      );
    }

    // Check economic stake
    if (
      requirements.economicStake > 0 &&
      progress.stakePledged < requirements.economicStake
    ) {
      missingRequirements.push(
        `Stake: ${progress.stakePledged}/${requirements.economicStake}`,
      );
    }

    const overallProgress = this.calculateRecoveryProgress(
      record,
      requirements,
    );
    const eligible = missingRequirements.length === 0;

    let estimatedTimeRemaining = 0;
    if (!eligible) {
      estimatedTimeRemaining = Math.max(
        0,
        quarantineLevel.duration.minimum - timeInQuarantine,
      );
    }

    return {
      eligible,
      progress: overallProgress,
      missingRequirements,
      estimatedTimeRemaining,
    };
  }

  /**
   * Process recovery request
   */
  async processRecoveryRequest(agentId: string): Promise<{
    approved: boolean;
    newLevel?: QuarantineLevel["level"] | "full_recovery";
    reason: string;
    conditions?: string[];
  }> {
    const eligibility = await this.checkRecoveryEligibility(agentId);

    if (!eligibility.eligible) {
      return {
        approved: false,
        reason: `Recovery requirements not met: ${eligibility.missingRequirements.join(", ")}`,
      };
    }

    const record = this.quarantineRecords.get(agentId)!;
    const quarantineLevel = this.quarantineLevels.get(record.level)!;

    // Determine new level based on performance
    let newLevel: QuarantineLevel["level"] | "full_recovery";
    const conditions: string[] = [];

    if (
      record.recoveryProgress.behaviorScore >= 0.9 &&
      record.violations.length === 0
    ) {
      newLevel = "full_recovery";
    } else if (record.level === "complete") {
      newLevel = "hard";
      conditions.push("Continued monitoring for 30 days");
    } else if (record.level === "hard") {
      newLevel = "soft";
      conditions.push("Continued monitoring for 14 days");
    } else if (record.level === "soft") {
      newLevel = "observation";
      conditions.push("Continued monitoring for 7 days");
    } else {
      newLevel = "full_recovery";
    }

    // Update record
    if (newLevel === "full_recovery") {
      record.status = "recovered";
      record.endTime = new Date();
      this.quarantineRecords.delete(agentId);
      this.recoveryPlans.delete(agentId);
    } else {
      record.level = newLevel;
      record.metadata.notes.push(`Recovered to level: ${newLevel}`);
      record.metadata.lastUpdated = new Date();
    }

    this.logger.info("Recovery request processed", {
      agentId,
      approved: true,
      newLevel,
      previousLevel: record.level,
      conditions: conditions.length,
    });

    this.emit("recovery_processed", {
      agentId,
      approved: true,
      newLevel,
      record,
      conditions,
    });

    return {
      approved: true,
      newLevel,
      reason: "All recovery requirements met",
      conditions: conditions.length > 0 ? conditions : undefined,
    };
  }

  /**
   * Record quarantine violation
   */
  async recordViolation(
    agentId: string,
    type: QuarantineViolation["type"],
    description: string,
    evidence: any,
    severity: QuarantineViolation["severity"] = "moderate",
  ): Promise<void> {
    const record = this.quarantineRecords.get(agentId);
    if (!record) return;

    const violation: QuarantineViolation = {
      violationId: crypto.randomUUID(),
      type,
      description,
      timestamp: new Date(),
      evidence,
      severity,
      penalty: this.calculateViolationPenalty(
        severity,
        record.violations.length,
      ),
    };

    record.violations.push(violation);
    record.metadata.lastUpdated = new Date();
    record.metadata.notes.push(`Violation: ${description}`);

    // Apply penalties
    if (violation.penalty.timeExtension) {
      await this.extendQuarantine(
        agentId,
        violation.penalty.timeExtension,
        `Violation penalty: ${description}`,
        evidence,
      );
    }

    if (violation.penalty.levelEscalation) {
      await this.escalateQuarantine(
        agentId,
        this.getNextQuarantineLevel(record.level),
        `Escalated due to violation: ${description}`,
        evidence,
      );
    }

    // Check for permanent ban
    if (record.violations.length >= this.config.quarantine.permanentThreshold) {
      record.status = "permanent";
      record.metadata.notes.push(
        "Permanently banned due to excessive violations",
      );
    }

    this.logger.warn("Quarantine violation recorded", {
      agentId,
      type,
      severity,
      violationCount: record.violations.length,
      penalty: violation.penalty,
    });

    this.emit("quarantine_violation", {
      agentId,
      violation,
      record,
    });
  }

  /**
   * Helper methods
   */

  private generateRecoveryPhases(
    quarantineLevel: QuarantineLevel,
  ): RecoveryPhase[] {
    const phases: RecoveryPhase[] = [];

    // Phase 1: Compliance Assessment
    phases.push({
      phaseId: crypto.randomUUID(),
      name: "Compliance Assessment",
      description:
        "Demonstrate understanding of security policies and protocols",
      order: 1,
      duration: 86400000, // 24 hours
      challenges: [],
      requirements: {
        minChallengeScore: 0.7,
        requiredEndorsements: 0,
        behaviorThreshold: 0.6,
        noViolations: true,
      },
      status: "pending",
    });

    // Phase 2: Behavioral Demonstration
    if (quarantineLevel.recoveryRequirements.challengesRequired > 1) {
      phases.push({
        phaseId: crypto.randomUUID(),
        name: "Behavioral Demonstration",
        description:
          "Demonstrate positive behavioral patterns and peer cooperation",
        order: 2,
        duration: 172800000, // 48 hours
        challenges: [],
        requirements: {
          minChallengeScore: 0.8,
          requiredEndorsements: Math.floor(
            quarantineLevel.recoveryRequirements.peerEndorsements / 2,
          ),
          behaviorThreshold: 0.7,
          noViolations: true,
        },
        status: "pending",
      });
    }

    // Phase 3: Trust Rebuilding
    if (quarantineLevel.recoveryRequirements.challengesRequired > 3) {
      phases.push({
        phaseId: crypto.randomUUID(),
        name: "Trust Rebuilding",
        description:
          "Rebuild trust through consistent positive behavior and peer endorsements",
        order: 3,
        duration: 259200000, // 72 hours
        challenges: [],
        requirements: {
          minChallengeScore: 0.85,
          requiredEndorsements:
            quarantineLevel.recoveryRequirements.peerEndorsements,
          behaviorThreshold: quarantineLevel.recoveryRequirements.behaviorScore,
          noViolations: true,
        },
        status: "pending",
      });
    }

    return phases;
  }

  private async generatePhaseChallenges(
    agentId: string,
    phase: RecoveryPhase,
    quarantineLevel: QuarantineLevel,
  ): Promise<RecoveryChallenge[]> {
    const challenges: RecoveryChallenge[] = [];

    switch (phase.name) {
      case "Compliance Assessment":
        challenges.push({
          challengeId: crypto.randomUUID(),
          agentId,
          type: "security_audit",
          name: "Security Policy Quiz",
          description:
            "Complete a comprehensive quiz on security policies and protocols",
          requirements: { questionsCount: 20, passingScore: 0.8 },
          timeLimit: 3600000, // 1 hour
          maxAttempts: 2,
          passingScore: 0.8,
          weight: 1.0,
          status: "pending",
          attempts: [],
        });
        break;

      case "Behavioral Demonstration":
        challenges.push({
          challengeId: crypto.randomUUID(),
          agentId,
          type: "peer_collaboration",
          name: "Peer Collaboration Task",
          description:
            "Successfully collaborate with other agents on a assigned task",
          requirements: { collaborators: 3, taskComplexity: "medium" },
          timeLimit: 7200000, // 2 hours
          maxAttempts: 2,
          passingScore: 0.75,
          weight: 0.6,
          status: "pending",
          attempts: [],
        });

        if (quarantineLevel.recoveryRequirements.proofOfWork) {
          challenges.push({
            challengeId: crypto.randomUUID(),
            agentId,
            type: "proof_of_work",
            name: "Computational Proof of Work",
            description:
              "Complete a computational challenge to demonstrate commitment",
            requirements: { difficulty: 4, algorithm: "sha256" },
            timeLimit: 3600000, // 1 hour
            maxAttempts: 3,
            passingScore: 1.0,
            weight: 0.4,
            status: "pending",
            attempts: [],
          });
        }
        break;

      case "Trust Rebuilding":
        challenges.push({
          challengeId: crypto.randomUUID(),
          agentId,
          type: "behavioral_compliance",
          name: "Extended Behavioral Compliance",
          description:
            "Maintain consistent positive behavior over extended period",
          requirements: { duration: 172800000, minScore: 0.9 }, // 48 hours
          timeLimit: 259200000, // 72 hours
          maxAttempts: 1,
          passingScore: 0.9,
          weight: 1.0,
          status: "pending",
          attempts: [],
        });
        break;
    }

    return challenges;
  }

  private calculateRecoveryDuration(quarantineLevel: QuarantineLevel): number {
    const baseDuration = quarantineLevel.duration.minimum;
    const challengeTime =
      quarantineLevel.recoveryRequirements.challengesRequired * 3600000; // 1 hour per challenge
    const endorsementTime =
      quarantineLevel.recoveryRequirements.peerEndorsements * 1800000; // 30 min per endorsement

    return Math.max(baseDuration, challengeTime + endorsementTime);
  }

  private async signEndorsement(
    fromAgentId: string,
    toAgentId: string,
    type: string,
    strength: string,
  ): Promise<string> {
    const data = `${fromAgentId}:${toAgentId}:${type}:${strength}:${Date.now()}`;
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  private async calculateEndorsementWeight(
    endorserAgentId: string,
  ): Promise<number> {
    // In a real implementation, this would calculate based on endorser's reputation
    return 1.0; // Default weight
  }

  private calculateViolationPenalty(
    severity: QuarantineViolation["severity"],
    violationCount: number,
  ): QuarantineViolation["penalty"] {
    const basePenalties = {
      minor: { timeExtension: 3600000 }, // 1 hour
      moderate: { timeExtension: 7200000 }, // 2 hours
      severe: { timeExtension: 86400000, levelEscalation: violationCount >= 2 }, // 24 hours
      critical: { timeExtension: 172800000, levelEscalation: true }, // 48 hours
    };

    const penalty = basePenalties[severity];

    // Increase penalties for repeat offenders
    if (violationCount > 3) {
      penalty.timeExtension *= 2;
    }

    return penalty;
  }

  private getNextQuarantineLevel(
    currentLevel: QuarantineLevel["level"],
  ): QuarantineLevel["level"] {
    const escalation = {
      observation: "soft",
      soft: "hard",
      hard: "complete",
      complete: "complete", // Can't escalate further
    };

    return escalation[currentLevel] as QuarantineLevel["level"];
  }

  private calculateRecoveryProgress(
    record: QuarantineRecord,
    requirements: QuarantineLevel["recoveryRequirements"],
  ): number {
    const weights = {
      challenges: 0.4,
      endorsements: 0.3,
      behavior: 0.2,
      stake: 0.1,
    };

    const challengeProgress = Math.min(
      1,
      record.recoveryProgress.challengesCompleted /
        requirements.challengesRequired,
    );
    const endorsementProgress = Math.min(
      1,
      record.recoveryProgress.peerEndorsements / requirements.peerEndorsements,
    );
    const behaviorProgress = Math.min(
      1,
      record.recoveryProgress.behaviorScore / requirements.behaviorScore,
    );
    const stakeProgress =
      requirements.economicStake > 0
        ? Math.min(
            1,
            record.recoveryProgress.stakePledged / requirements.economicStake,
          )
        : 1;

    return (
      challengeProgress * weights.challenges +
      endorsementProgress * weights.endorsements +
      behaviorProgress * weights.behavior +
      stakeProgress * weights.stake
    );
  }

  private async checkPhaseCompletion(agentId: string): Promise<void> {
    const plan = this.recoveryPlans.get(agentId);
    if (!plan) return;

    const currentPhase = plan.phases[plan.progress.currentPhase];
    if (!currentPhase || currentPhase.status !== "active") return;

    // Check if all phase challenges are completed
    const phaseChallenges = currentPhase.challenges
      .map((id) => this.recoveryChallenges.get(id))
      .filter(Boolean);
    const completedChallenges = phaseChallenges.filter(
      (c) => c!.status === "completed",
    );

    if (completedChallenges.length === phaseChallenges.length) {
      // Phase completed
      currentPhase.status = "completed";
      currentPhase.completedAt = new Date();
      plan.progress.phasesCompleted++;

      // Move to next phase
      if (plan.progress.currentPhase < plan.phases.length - 1) {
        plan.progress.currentPhase++;
        plan.phases[plan.progress.currentPhase].status = "active";
        plan.phases[plan.progress.currentPhase].startedAt = new Date();
      } else {
        // All phases completed
        plan.status = "completed";
      }

      // Update overall progress
      plan.progress.overallProgress =
        plan.progress.phasesCompleted / plan.phases.length;
      plan.lastUpdated = new Date();

      this.emit("phase_completed", {
        agentId,
        phase: currentPhase,
        plan,
      });
    }
  }

  private async monitorQuarantinedAgents(): Promise<void> {
    for (const [agentId, record] of this.quarantineRecords) {
      if (record.status !== "active") continue;

      try {
        // Monitor behavior and compliance
        const behaviorMetrics =
          await this.behaviorMonitor.assessBehavior(agentId);

        // Update monitoring data
        record.monitoring.activityLevel = behaviorMetrics.activityLevel;
        record.monitoring.complianceScore = behaviorMetrics.complianceScore;
        record.monitoring.lastActivity = behaviorMetrics.lastActivity;

        // Update behavior score
        record.recoveryProgress.behaviorScore = behaviorMetrics.overallScore;

        // Check for violations
        if (behaviorMetrics.violations.length > 0) {
          for (const violation of behaviorMetrics.violations) {
            await this.recordViolation(
              agentId,
              violation.type,
              violation.description,
              violation.evidence,
              violation.severity,
            );
          }
        }
      } catch (error) {
        this.logger.error("Failed to monitor quarantined agent", {
          agentId,
          error,
        });
      }
    }
  }

  private async reviewQuarantineStatus(): Promise<void> {
    for (const [agentId, record] of this.quarantineRecords) {
      if (record.status !== "active") continue;

      const timeInQuarantine = Date.now() - record.startTime.getTime();
      const quarantineLevel = this.quarantineLevels.get(record.level)!;

      // Check if minimum time has passed
      if (timeInQuarantine >= quarantineLevel.duration.minimum) {
        const eligibility = await this.checkRecoveryEligibility(agentId);

        if (eligibility.eligible) {
          // Automatic recovery for observation level
          if (
            record.level === "observation" &&
            record.violations.length === 0
          ) {
            await this.processRecoveryRequest(agentId);
          }
        }
      }

      // Check maximum time limit
      if (timeInQuarantine >= quarantineLevel.duration.maximum) {
        if (
          quarantineLevel.extendable &&
          record.extensions.length < this.config.quarantine.maxExtensions
        ) {
          // Auto-extend if recovery progress is being made
          const eligibility = await this.checkRecoveryEligibility(agentId);
          if (eligibility.progress > 0.5) {
            await this.extendQuarantine(
              agentId,
              quarantineLevel.duration.minimum / 2,
              "Automatic extension due to progress",
              {},
            );
          }
        } else {
          // Force review or escalate
          record.status = "permanent";
          record.metadata.notes.push("Maximum quarantine time exceeded");
        }
      }
    }
  }

  private async processRecoveryChallenges(): Promise<void> {
    for (const [challengeId, challenge] of this.recoveryChallenges) {
      if (challenge.status === "in_progress") {
        // Check for timeouts
        const lastAttempt = challenge.attempts[challenge.attempts.length - 1];
        if (lastAttempt && !lastAttempt.endTime) {
          const timeInProgress = Date.now() - lastAttempt.startTime.getTime();
          if (timeInProgress > challenge.timeLimit) {
            // Timeout
            lastAttempt.endTime = new Date();
            lastAttempt.feedback = "Challenge timed out";
            challenge.status = "pending";
          }
        }
      }
    }
  }

  private scheduleQuarantineReview(agentId: string, delay: number): void {
    setTimeout(async () => {
      const record = this.quarantineRecords.get(agentId);
      if (record && record.status === "active") {
        await this.reviewQuarantineStatus();
      }
    }, delay);
  }

  private async escalateQuarantine(
    agentId: string,
    newLevel: QuarantineLevel["level"],
    reason: string,
    evidence: any,
  ): Promise<QuarantineRecord> {
    const record = this.quarantineRecords.get(agentId);
    if (!record) throw new Error("Agent not quarantined");

    const extension: QuarantineExtension = {
      extensionId: crypto.randomUUID(),
      reason: `Escalated to ${newLevel}: ${reason}`,
      additionalTime: 0, // Escalation changes level, not time
      requestedBy: "system",
      approvedBy: ["system"],
      timestamp: new Date(),
      evidence,
    };

    record.level = newLevel;
    record.extensions.push(extension);
    record.metadata.notes.push(`Escalated to ${newLevel}: ${reason}`);
    record.metadata.lastUpdated = new Date();

    this.logger.warn("Quarantine escalated", {
      agentId,
      oldLevel: record.level,
      newLevel,
      reason,
    });

    this.emit("quarantine_escalated", {
      agentId,
      record,
      extension,
    });

    return record;
  }

  private async extendQuarantine(
    agentId: string,
    additionalTime: number,
    reason: string,
    evidence: any,
  ): Promise<void> {
    const record = this.quarantineRecords.get(agentId);
    if (!record) return;

    const extension: QuarantineExtension = {
      extensionId: crypto.randomUUID(),
      reason,
      additionalTime,
      requestedBy: "system",
      approvedBy: ["system"],
      timestamp: new Date(),
      evidence,
    };

    record.extensions.push(extension);
    record.metadata.notes.push(`Extended by ${additionalTime}ms: ${reason}`);
    record.metadata.lastUpdated = new Date();

    this.emit("quarantine_extended", {
      agentId,
      record,
      extension,
    });
  }

  /**
   * Public API methods
   */

  getQuarantineRecord(agentId: string): QuarantineRecord | null {
    return this.quarantineRecords.get(agentId) || null;
  }

  getRecoveryPlan(agentId: string): RecoveryPlan | null {
    return this.recoveryPlans.get(agentId) || null;
  }

  getQuarantinedAgents(): string[] {
    return Array.from(this.quarantineRecords.keys());
  }

  getRecoveryChallenges(agentId: string): RecoveryChallenge[] {
    return Array.from(this.recoveryChallenges.values()).filter(
      (c) => c.agentId === agentId,
    );
  }

  getPeerEndorsements(agentId: string): PeerEndorsement[] {
    return this.peerEndorsements.get(agentId) || [];
  }

  async getSystemStats(): Promise<any> {
    const records = Array.from(this.quarantineRecords.values());
    const challenges = Array.from(this.recoveryChallenges.values());

    return {
      totalQuarantined: records.length,
      quarantineLevelDistribution: this.getQuarantineLevelDistribution(records),
      totalChallenges: challenges.length,
      challengeCompletionRate:
        this.calculateChallengeCompletionRate(challenges),
      averageRecoveryTime: this.calculateAverageRecoveryTime(records),
      violationCount: records.reduce((sum, r) => sum + r.violations.length, 0),
      recoverySuccessRate: this.calculateRecoverySuccessRate(records),
    };
  }

  private getQuarantineLevelDistribution(
    records: QuarantineRecord[],
  ): Record<string, number> {
    const distribution = { observation: 0, soft: 0, hard: 0, complete: 0 };

    records.forEach((record) => {
      distribution[record.level]++;
    });

    return distribution;
  }

  private calculateChallengeCompletionRate(
    challenges: RecoveryChallenge[],
  ): number {
    if (challenges.length === 0) return 0;

    const completed = challenges.filter((c) => c.status === "completed").length;
    return completed / challenges.length;
  }

  private calculateAverageRecoveryTime(records: QuarantineRecord[]): number {
    const recovered = records.filter(
      (r) => r.status === "recovered" && r.endTime,
    );

    if (recovered.length === 0) return 0;

    const totalTime = recovered.reduce((sum, r) => {
      return sum + (r.endTime!.getTime() - r.startTime.getTime());
    }, 0);

    return totalTime / recovered.length;
  }

  private calculateRecoverySuccessRate(records: QuarantineRecord[]): number {
    const total = records.filter((r) => r.status !== "active").length;
    if (total === 0) return 0;

    const recovered = records.filter((r) => r.status === "recovered").length;
    return recovered / total;
  }
}

// Supporting monitoring classes

class BehaviorMonitor {
  constructor(private config: any) {}

  async assessBehavior(agentId: string): Promise<{
    activityLevel: number;
    complianceScore: number;
    overallScore: number;
    lastActivity: Date;
    violations: any[];
  }> {
    // Mock implementation
    return {
      activityLevel: 0.5,
      complianceScore: 0.8,
      overallScore: 0.7,
      lastActivity: new Date(),
      violations: [],
    };
  }
}

class RecoveryAssessor {
  constructor(private config: any) {}

  async assessRecoveryProgress(
    agentId: string,
    plan: RecoveryPlan,
  ): Promise<number> {
    return plan.progress.overallProgress;
  }
}

class ChallengeValidator {
  constructor(private config: any) {}

  async validateResponse(
    challenge: RecoveryChallenge,
    response: any,
  ): Promise<{
    score: number;
    feedback: string;
    evidence: any;
  }> {
    // Mock validation
    return {
      score: 0.8,
      feedback: "Good response",
      evidence: { validated: true },
    };
  }
}

class EndorsementValidator {
  constructor(private config: any) {}

  async validateEndorser(
    fromAgentId: string,
    toAgentId: string,
  ): Promise<boolean> {
    // Mock validation
    return true;
  }
}

export {
  QuarantineRecoveryManager,
  QuarantineLevel,
  QuarantineRecord,
  RecoveryChallenge,
  PeerEndorsement,
  RecoveryPlan,
  QuarantineViolation,
};
