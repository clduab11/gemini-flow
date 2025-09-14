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
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { MaliciousDetectionResult } from "./malicious-detection.js";
export interface QuarantineLevel {
    level: "observation" | "soft" | "hard" | "complete";
    name: string;
    description: string;
    restrictions: {
        messageRateLimit: number;
        allowedOperations: string[];
        networkAccess: boolean;
        consensusParticipation: boolean;
        peerInteraction: boolean;
        resourceAccess: string[];
    };
    duration: {
        minimum: number;
        maximum: number;
        extendable: boolean;
    };
    recoveryRequirements: {
        challengesRequired: number;
        peerEndorsements: number;
        behaviorScore: number;
        proofOfWork: boolean;
        economicStake: number;
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
    status: "active" | "suspended" | "recovered" | "escalated" | "permanent";
    extensions: QuarantineExtension[];
    violations: QuarantineViolation[];
    recoveryProgress: {
        challengesCompleted: number;
        challengesFailed: number;
        peerEndorsements: number;
        behaviorScore: number;
        stakePledged: number;
        recoveryAttempts: number;
    };
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
    additionalTime: number;
    requestedBy: string;
    approvedBy: string[];
    timestamp: Date;
    evidence: any;
}
export interface QuarantineViolation {
    violationId: string;
    type: "access_attempt" | "rate_limit_exceeded" | "unauthorized_operation" | "malicious_activity";
    description: string;
    timestamp: Date;
    evidence: any;
    severity: "minor" | "moderate" | "severe" | "critical";
    penalty: {
        timeExtension?: number;
        levelEscalation?: boolean;
        economicPenalty?: number;
    };
}
export interface RecoveryChallenge {
    challengeId: string;
    agentId: string;
    type: "behavioral_compliance" | "security_audit" | "peer_collaboration" | "proof_of_work" | "skill_demonstration";
    name: string;
    description: string;
    requirements: any;
    timeLimit: number;
    maxAttempts: number;
    passingScore: number;
    weight: number;
    status: "pending" | "in_progress" | "completed" | "failed" | "expired";
    attempts: ChallengeAttempt[];
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
    validated: boolean;
    validatedBy?: string;
    weight: number;
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
        overallProgress: number;
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
    challenges: string[];
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
export declare class QuarantineRecoveryManager extends EventEmitter {
    private logger;
    private quarantineLevels;
    private quarantineRecords;
    private recoveryChallenges;
    private peerEndorsements;
    private recoveryPlans;
    private behaviorMonitor;
    private recoveryAssessor;
    private challengeValidator;
    private endorsementValidator;
    private config;
    constructor();
    /**
     * Initialize quarantine levels
     */
    private initializeQuarantineLevels;
    /**
     * Initialize monitoring components
     */
    private initializeComponents;
    /**
     * Start monitoring loops
     */
    private startMonitoring;
    /**
     * Quarantine an agent
     */
    quarantineAgent(agentId: string, level: QuarantineLevel["level"], reason: string, evidence: any, detectionResult: MaliciousDetectionResult, createdBy?: string): Promise<QuarantineRecord>;
    /**
     * Create recovery plan for quarantined agent
     */
    private createRecoveryPlan;
    /**
     * Submit recovery challenge response
     */
    submitChallengeResponse(challengeId: string, agentId: string, response: any): Promise<{
        success: boolean;
        score: number;
        feedback: string;
    }>;
    /**
     * Submit peer endorsement
     */
    submitPeerEndorsement(fromAgentId: string, toAgentId: string, type: "character" | "technical" | "trustworthiness" | "rehabilitation", strength: "weak" | "moderate" | "strong", message?: string, evidence?: any): Promise<boolean>;
    /**
     * Check agent's recovery eligibility
     */
    checkRecoveryEligibility(agentId: string): Promise<{
        eligible: boolean;
        progress: number;
        missingRequirements: string[];
        estimatedTimeRemaining: number;
    }>;
    /**
     * Process recovery request
     */
    processRecoveryRequest(agentId: string): Promise<{
        approved: boolean;
        newLevel?: QuarantineLevel["level"] | "full_recovery";
        reason: string;
        conditions?: string[];
    }>;
    /**
     * Record quarantine violation
     */
    recordViolation(agentId: string, type: QuarantineViolation["type"], description: string, evidence: any, severity?: QuarantineViolation["severity"]): Promise<void>;
    /**
     * Helper methods
     */
    private generateRecoveryPhases;
    private generatePhaseChallenges;
    private calculateRecoveryDuration;
    private signEndorsement;
    private calculateEndorsementWeight;
    private calculateViolationPenalty;
    private getNextQuarantineLevel;
    private calculateRecoveryProgress;
    private checkPhaseCompletion;
    private monitorQuarantinedAgents;
    private reviewQuarantineStatus;
    private processRecoveryChallenges;
    private scheduleQuarantineReview;
    private escalateQuarantine;
    private extendQuarantine;
    /**
     * Public API methods
     */
    getQuarantineRecord(agentId: string): QuarantineRecord | null;
    getRecoveryPlan(agentId: string): RecoveryPlan | null;
    getQuarantinedAgents(): string[];
    getRecoveryChallenges(agentId: string): RecoveryChallenge[];
    getPeerEndorsements(agentId: string): PeerEndorsement[];
    getSystemStats(): Promise<any>;
    private getQuarantineLevelDistribution;
    private calculateChallengeCompletionRate;
    private calculateAverageRecoveryTime;
    private calculateRecoverySuccessRate;
}
export { QuarantineRecoveryManager, QuarantineLevel, QuarantineRecord, RecoveryChallenge, PeerEndorsement, RecoveryPlan, QuarantineViolation, };
//# sourceMappingURL=quarantine-recovery.d.ts.map