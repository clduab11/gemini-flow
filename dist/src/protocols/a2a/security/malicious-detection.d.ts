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
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { A2AIdentity, A2AMessage } from "../../../core/a2a-security-manager.js";
export interface BehaviorProfile {
    agentId: string;
    agentType: string;
    establishedAt: Date;
    messageFrequency: {
        perMinute: number;
        perHour: number;
        perDay: number;
        variance: number;
    };
    messagePatterns: {
        avgPayloadSize: number;
        messageTypes: Map<string, number>;
        targetDistribution: Map<string, number>;
        timePatterns: number[];
    };
    protocolCompliance: {
        signatureValidation: number;
        nonceCompliance: number;
        capabilityCompliance: number;
        sequenceCompliance: number;
    };
    consensusBehavior: {
        participationRate: number;
        agreementRate: number;
        proposalQuality: number;
        responseLatency: number;
        viewChangeRate: number;
    };
    networkBehavior: {
        connectionPatterns: Map<string, number>;
        routingBehavior: number;
        resourceUsage: number;
        uplinkBandwidth: number;
    };
    trustMetrics: {
        peerTrustScore: number;
        behaviorScore: number;
        reputationScore: number;
        volatilityScore: number;
    };
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
    timeWindow: number;
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
    confirmedBy: string[];
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
export declare class MaliciousAgentDetector extends EventEmitter {
    private logger;
    private behaviorProfiles;
    private detectionPatterns;
    private detectionResults;
    private consensusVotes;
    private quarantinedAgents;
    private behaviorModel;
    private anomalyDetector;
    private consensusAnalyzer;
    private config;
    constructor();
    /**
     * Initialize predefined malicious behavior patterns
     */
    private initializeDetectionPatterns;
    /**
     * Initialize machine learning components
     */
    private initializeMLComponents;
    /**
     * Start the main detection loop
     */
    private startDetectionLoop;
    /**
     * Record agent behavior for analysis
     */
    recordAgentBehavior(agentId: string, message: A2AMessage, identity: A2AIdentity, metadata?: any): Promise<void>;
    /**
     * Perform consensus-based detection round
     */
    private performDetectionRound;
    /**
     * Analyze agent behavior for malicious patterns
     */
    private analyzeAgentBehavior;
    /**
     * Evaluate specific detection pattern against agent behavior
     */
    private evaluateDetectionPattern;
    /**
     * Evaluate individual detection rule
     */
    private evaluateDetectionRule;
    /**
     * Extract metric value from behavior profile
     */
    private extractMetricValue;
    /**
     * Initiate consensus-based detection
     */
    private initiateConsensusDetection;
    /**
     * Submit consensus vote for malicious agent detection
     */
    submitConsensusVote(vote: ConsensusVote): Promise<void>;
    /**
     * Process consensus votes and make decisions
     */
    private processConsensusVotes;
    /**
     * Quarantine malicious agent
     */
    private quarantineAgent;
    /**
     * Attempt to recover quarantined agent
     */
    attemptRecovery(agentId: string): Promise<boolean>;
    /**
     * Process recovery challenge response
     */
    processRecoveryResponse(agentId: string, response: any): Promise<boolean>;
    /**
     * Helper methods for behavior analysis
     */
    private createInitialBehaviorProfile;
    private updateBehaviorProfile;
    private updateMovingAverage;
    private detectRealTimeAnomalies;
    private extractBehaviorDeviations;
    private extractConsensusViolations;
    private extractProtocolViolations;
    private extractNetworkAnomalies;
    private determineRecommendedAction;
    private updateMLModels;
    private generateRecoveryChallenge;
    private validateRecoveryResponse;
    /**
     * Public API methods
     */
    getBehaviorProfile(agentId: string): BehaviorProfile | null;
    getDetectionResult(agentId: string): MaliciousDetectionResult | null;
    isQuarantined(agentId: string): boolean;
    getQuarantinedAgents(): string[];
    getDetectionPatterns(): MaliciousPattern[];
    getSystemStats(): Promise<any>;
    private calculateAverageBehaviorScore;
    private calculateSystemHealth;
}
export { MaliciousAgentDetector, BehaviorProfile, MaliciousPattern, DetectionRule, MaliciousDetectionResult, ConsensusVote, };
//# sourceMappingURL=malicious-detection.d.ts.map