/**
 * Malicious Agent Detection System
 * Implements sophisticated algorithms to identify and isolate bad actors
 * in the Byzantine consensus network
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { Agent, ConsensusMessage } from "./byzantine-consensus";
import { Vote } from "./voting-mechanisms";
export interface MaliciousBehavior {
    type: "double-voting" | "conflicting-messages" | "timing-manipulation" | "fake-signatures" | "spam-flooding" | "collusion" | "view-change-abuse" | "consensus-disruption" | "sybil-attack" | "eclipse-attack";
    agentId: string;
    severity: "low" | "medium" | "high" | "critical";
    evidence: any[];
    timestamp: Date;
    confidence: number;
    description: string;
}
export interface ReputationScore {
    agentId: string;
    currentScore: number;
    historicalScores: {
        timestamp: Date;
        score: number;
    }[];
    trustLevel: "untrusted" | "low" | "medium" | "high" | "verified";
    behaviorFlags: Set<string>;
    interactionHistory: Map<string, number>;
}
export interface DetectionRule {
    id: string;
    name: string;
    type: MaliciousBehavior["type"];
    condition: (context: DetectionContext) => boolean;
    confidence: number;
    enabled: boolean;
}
export interface DetectionContext {
    agent: Agent;
    messages: ConsensusMessage[];
    votes: Vote[];
    timeWindow: {
        start: Date;
        end: Date;
    };
    networkState: any;
}
export interface SecurityAlert {
    id: string;
    type: "malicious-behavior" | "reputation-drop" | "network-attack" | "consensus-failure";
    severity: "low" | "medium" | "high" | "critical";
    message: string;
    affectedAgents: string[];
    timestamp: Date;
    mitigationActions: string[];
}
export declare class MaliciousDetection extends EventEmitter {
    private reputationScores;
    private behaviorHistory;
    private detectionRules;
    private securityAlerts;
    private quarantinedAgents;
    private suspiciousAgents;
    private readonly REPUTATION_THRESHOLD;
    private readonly CONFIDENCE_THRESHOLD;
    private readonly TIME_WINDOW_MS;
    private readonly MAX_MESSAGES_PER_WINDOW;
    constructor();
    /**
     * Initialize default detection rules
     */
    private initializeDetectionRules;
    /**
     * Register an agent for monitoring
     */
    registerAgent(agent: Agent): void;
    /**
     * Analyze agent behavior for malicious activity
     */
    analyzeBehavior(agentId: string, messages: ConsensusMessage[], votes: Vote[]): Promise<MaliciousBehavior[]>;
    /**
     * Detect double voting
     */
    private detectDoubleVoting;
    /**
     * Detect conflicting messages
     */
    private detectConflictingMessages;
    /**
     * Detect timing manipulation
     */
    private detectTimingManipulation;
    /**
     * Detect spam flooding
     */
    private detectSpamFlooding;
    /**
     * Detect collusion patterns
     */
    private detectCollusion;
    /**
     * Detect view change abuse
     */
    private detectViewChangeAbuse;
    /**
     * Record malicious behavior
     */
    private recordMaliciousBehavior;
    /**
     * Update agent reputation score
     */
    private updateReputationScore;
    /**
     * Calculate reputation penalty
     */
    private calculateReputationPenalty;
    /**
     * Calculate trust level based on reputation score
     */
    private calculateTrustLevel;
    /**
     * Calculate behavior severity
     */
    private calculateSeverity;
    /**
     * Collect evidence for detected behavior
     */
    private collectEvidence;
    /**
     * Create security alert
     */
    private createSecurityAlert;
    /**
     * Generate mitigation actions
     */
    private generateMitigationActions;
    /**
     * Take mitigation actions
     */
    private takeMitigationActions;
    /**
     * Check if agent is trusted
     */
    isAgentTrusted(agentId: string): boolean;
    /**
     * Get agent reputation
     */
    getAgentReputation(agentId: string): ReputationScore | undefined;
    /**
     * Get security alerts
     */
    getSecurityAlerts(limit?: number): SecurityAlert[];
    /**
     * Get quarantined agents
     */
    getQuarantinedAgents(): string[];
    /**
     * Rehabilitate agent (restore reputation)
     */
    rehabilitateAgent(agentId: string, reason: string): boolean;
    private generateAlertId;
    private getAgentInfo;
    /**
     * Get detection statistics
     */
    getDetectionStatistics(): {
        totalDetections: number;
        detectionsByType: Record<string, number>;
        quarantinedCount: number;
        suspiciousCount: number;
        averageReputationScore: number;
    };
}
export default MaliciousDetection;
//# sourceMappingURL=malicious-detection.d.ts.map