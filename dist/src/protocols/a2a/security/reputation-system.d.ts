/**
 * Reputation System for A2A Protocol
 *
 * Implements dynamic reputation scoring and trust metrics for agents
 * in the distributed system, providing continuous assessment of agent
 * trustworthiness based on behavior, performance, and peer feedback.
 *
 * Features:
 * - Dynamic reputation scoring with multi-factor analysis
 * - Peer-to-peer trust evaluation and feedback
 * - Historical reputation tracking and trend analysis
 * - Stake-weighted reputation for economic incentives
 * - Reputation-based access control and privileges
 * - Reputation recovery mechanisms for rehabilitated agents
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { A2AIdentity } from "../../../core/a2a-security-manager.js";
import { BehaviorProfile } from "./malicious-detection.js";
export interface ReputationScore {
    agentId: string;
    overallScore: number;
    trustLevel: "untrusted" | "low" | "medium" | "high" | "excellent";
    behaviorScore: number;
    performanceScore: number;
    consensusScore: number;
    peerScore: number;
    stabilityScore: number;
    metrics: {
        successfulOperations: number;
        failedOperations: number;
        consensusParticipation: number;
        messageReliability: number;
        responseTime: number;
        resourceEfficiency: number;
        securityCompliance: number;
        innovationScore: number;
    };
    history: {
        scores: {
            timestamp: Date;
            score: number;
        }[];
        events: ReputationEvent[];
        trends: ReputationTrend[];
    };
    peerFeedback: {
        positiveCount: number;
        negativeCount: number;
        neutralCount: number;
        recentFeedback: PeerFeedback[];
    };
    stake: {
        amount: number;
        lockPeriod: number;
        slashingHistory: SlashingEvent[];
    };
    metadata: {
        lastUpdated: Date;
        updateCount: number;
        version: string;
        flags: string[];
    };
}
export interface PeerFeedback {
    fromAgentId: string;
    toAgentId: string;
    rating: number;
    category: "behavior" | "performance" | "reliability" | "security" | "cooperation";
    comment?: string;
    evidence?: any;
    timestamp: Date;
    signature: string;
    weight: number;
}
export interface ReputationEvent {
    eventId: string;
    agentId: string;
    type: "positive" | "negative" | "neutral";
    category: string;
    impact: number;
    description: string;
    evidence: any;
    timestamp: Date;
    reportedBy?: string;
    verified: boolean;
}
export interface ReputationTrend {
    period: "daily" | "weekly" | "monthly";
    startDate: Date;
    endDate: Date;
    averageScore: number;
    trend: "increasing" | "decreasing" | "stable";
    volatility: number;
    confidence: number;
}
export interface SlashingEvent {
    eventId: string;
    agentId: string;
    reason: string;
    amountSlashed: number;
    timestamp: Date;
    evidence: any;
    appealStatus?: "pending" | "approved" | "rejected";
}
export interface ReputationChallenge {
    challengeId: string;
    agentId: string;
    type: "behavior_verification" | "skill_demonstration" | "consensus_participation" | "peer_collaboration";
    description: string;
    requirements: any;
    reward: number;
    penalty: number;
    timeLimit: number;
    createdAt: Date;
    status: "pending" | "in_progress" | "completed" | "failed" | "expired";
}
export interface ReputationConfig {
    weights: {
        behavior: number;
        performance: number;
        consensus: number;
        peer: number;
        stability: number;
    };
    decayFactors: {
        dailyDecay: number;
        inactivityPenalty: number;
        recoveryBonus: number;
    };
    thresholds: {
        quarantineThreshold: number;
        privilegeThreshold: number;
        slashingThreshold: number;
    };
    peerFeedback: {
        minRaterScore: number;
        maxFeedbackAge: number;
        weightByRaterScore: boolean;
    };
    economic: {
        minStakeAmount: number;
        maxSlashingPercentage: number;
        stakeLockPeriod: number;
        reputationStakingEnabled: boolean;
    };
}
export declare class ReputationSystem extends EventEmitter {
    private logger;
    private reputationScores;
    private peerFeedbacks;
    private reputationEvents;
    private activeChallenges;
    private config;
    private behaviorAnalyzer;
    private performanceTracker;
    private consensusEvaluator;
    private peerEvaluator;
    private stabilityAnalyzer;
    private stakeManager;
    private slashingController;
    constructor(config?: Partial<ReputationConfig>);
    /**
     * Initialize configuration with defaults
     */
    private initializeConfig;
    /**
     * Initialize reputation system components
     */
    private initializeComponents;
    /**
     * Start periodic reputation updates
     */
    private startReputationUpdates;
    /**
     * Initialize agent reputation
     */
    initializeAgentReputation(agentId: string, identity: A2AIdentity, initialStake?: number): Promise<ReputationScore>;
    /**
     * Record reputation event
     */
    recordReputationEvent(event: Omit<ReputationEvent, "eventId" | "timestamp" | "verified">): Promise<void>;
    /**
     * Submit peer feedback
     */
    submitPeerFeedback(fromAgentId: string, toAgentId: string, rating: number, category: "behavior" | "performance" | "reliability" | "security" | "cooperation", comment?: string, evidence?: any): Promise<boolean>;
    /**
     * Update agent reputation based on behavior profile
     */
    updateReputationFromBehavior(agentId: string, behaviorProfile: BehaviorProfile, consensusMetrics?: any): Promise<void>;
    /**
     * Process reputation challenge
     */
    createReputationChallenge(agentId: string, type: "behavior_verification" | "skill_demonstration" | "consensus_participation" | "peer_collaboration", description: string, requirements: any, reward?: number, penalty?: number, timeLimit?: number): Promise<ReputationChallenge>;
    /**
     * Submit challenge response
     */
    submitChallengeResponse(challengeId: string, agentId: string, response: any): Promise<{
        success: boolean;
        reward?: number;
        penalty?: number;
    }>;
    /**
     * Apply reputation-based penalties (slashing)
     */
    applySlashing(agentId: string, reason: string, percentage: number, evidence: any): Promise<boolean>;
    /**
     * Calculate trust level based on overall score
     */
    private calculateTrustLevel;
    /**
     * Update all reputation scores
     */
    private updateAllReputationScores;
    /**
     * Update individual agent reputation score
     */
    private updateAgentReputationScore;
    /**
     * Recalculate overall reputation score
     */
    private recalculateOverallScore;
    /**
     * Apply daily reputation decay
     */
    private applyDailyDecay;
    /**
     * Update reputation trends
     */
    private updateReputationTrends;
    /**
     * Helper methods
     */
    private adjustInitialScore;
    private signFeedback;
    private validateChallengeResponse;
    private validateBehaviorChallenge;
    private validateSkillChallenge;
    private validateConsensusChallenge;
    private validateCollaborationChallenge;
    private calculateReputationTrends;
    private calculateTrend;
    /**
     * Public API methods
     */
    getReputationScore(agentId: string): ReputationScore | null;
    getAllReputationScores(): ReputationScore[];
    getPeerFeedback(agentId: string): PeerFeedback[];
    getReputationEvents(agentId: string): ReputationEvent[];
    getActiveChallenges(agentId?: string): ReputationChallenge[];
    getSystemStats(): Promise<any>;
    private calculateTrustLevelDistribution;
}
export { ReputationSystem, ReputationScore, PeerFeedback, ReputationEvent, ReputationTrend, ReputationChallenge, SlashingEvent, ReputationConfig, };
//# sourceMappingURL=reputation-system.d.ts.map