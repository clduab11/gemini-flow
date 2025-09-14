/**
 * Enhanced A2A Security Manager with Malicious Agent Detection
 *
 * Integrates the comprehensive malicious agent detection system with the
 * existing A2A security manager, providing unified security orchestration
 * with real-time threat detection, behavioral analysis, and automated
 * response capabilities.
 *
 * Features:
 * - Integrated malicious behavior detection and response
 * - Real-time reputation-based access control
 * - Automated quarantine and recovery workflows
 * - Consensus-based malicious agent identification
 * - Multi-layer security with ML-based anomaly detection
 * - Comprehensive attack simulation and testing
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { AuthenticationManager } from "../../../core/auth-manager.js";
import { A2AIdentity, A2AMessage, SecurityPolicy, SecurityEvent } from "../../../core/a2a-security-manager.js";
import { ReputationScore } from "./reputation-system.js";
import { QuarantineRecord } from "./quarantine-recovery.js";
import { ProofOfWorkChallenge } from "./proof-of-work.js";
import { TrustAssertion } from "./trust-verification.js";
import { AttackSimulationResult } from "./attack-simulation.js";
export interface EnhancedSecurityConfig extends SecurityPolicy {
    maliciousDetection: {
        enabled: boolean;
        detectionInterval: number;
        consensusRounds: number;
        confidenceThreshold: number;
        autoQuarantine: boolean;
        mlDetection: boolean;
    };
    reputation: {
        enabled: boolean;
        initialScore: number;
        decayRate: number;
        endorsementWeight: number;
        challengeRewards: boolean;
    };
    quarantine: {
        enabled: boolean;
        defaultLevel: "observation" | "soft" | "hard" | "complete";
        maxQuarantineTime: number;
        recoveryEnabled: boolean;
        proofOfWorkRequired: boolean;
    };
    trustVerification: {
        enabled: boolean;
        requiredVerifiers: number;
        trustDecayRate: number;
        zkProofsEnabled: boolean;
    };
    simulation: {
        enabled: boolean;
        periodicTesting: boolean;
        testingInterval: number;
        alertOnFailure: boolean;
    };
}
export interface SecurityDashboard {
    timestamp: Date;
    securityLevel: "excellent" | "good" | "warning" | "critical";
    threatsDetected: number;
    activeQuarantines: number;
    systemHealth: number;
    totalAgents: number;
    trustedAgents: number;
    suspiciousAgents: number;
    quarantinedAgents: number;
    detection: {
        totalDetections: number;
        avgDetectionTime: number;
        detectionAccuracy: number;
        falsePositiveRate: number;
    };
    reputation: {
        averageScore: number;
        trustLevelDistribution: Record<string, number>;
        endorsementsToday: number;
        challengesCompleted: number;
    };
    network: {
        consensusHealth: number;
        messageThroughput: number;
        networkLatency: number;
        fragmentationLevel: number;
    };
    recentEvents: SecurityEvent[];
    activeAlerts: SecurityAlert[];
}
export interface SecurityAlert {
    alertId: string;
    severity: "low" | "medium" | "high" | "critical";
    type: string;
    title: string;
    description: string;
    timestamp: Date;
    agentId?: string;
    autoResolved: boolean;
    actions: string[];
}
export declare class EnhancedA2ASecurityManager extends EventEmitter {
    private logger;
    private baseSecurityManager;
    private maliciousDetector;
    private reputationSystem;
    private quarantineManager;
    private proofOfWorkManager;
    private trustVerifier;
    private anomalyDetector;
    private attackSimulator;
    private config;
    private activeAlerts;
    private securityMetrics;
    private consensusVotes;
    private detectionTimer?;
    private metricsTimer?;
    private simulationTimer?;
    constructor(authManager: AuthenticationManager, config?: Partial<EnhancedSecurityConfig>);
    /**
     * Initialize enhanced security configuration
     */
    private initializeConfig;
    /**
     * Initialize enhanced security components
     */
    private initializeSecurityComponents;
    /**
     * Setup integrations between components
     */
    private setupComponentIntegrations;
    /**
     * Start security automation processes
     */
    private startSecurityAutomation;
    /**
     * Enhanced agent registration with security checks
     */
    registerAgent(agentId: string, agentType: string, publicKey: string, certificates: {
        identity: string;
        tls: string;
        signing: string;
    }, capabilities?: string[]): Promise<A2AIdentity>;
    /**
     * Enhanced message processing with behavioral analysis
     */
    sendSecureMessage(fromAgentId: string, toAgentId: string | string[], messageType: "request" | "response" | "broadcast" | "gossip", payload: any, options?: any): Promise<A2AMessage>;
    /**
     * Enhanced message verification with anomaly detection
     */
    receiveSecureMessage(message: A2AMessage, receivingAgentId: string): Promise<{
        valid: boolean;
        payload?: any;
        metadata?: any;
    }>;
    /**
     * Submit consensus vote for malicious agent detection
     */
    submitMaliciousDetectionVote(targetAgentId: string, voterAgentId: string, isMalicious: boolean, confidence: number, evidence: any, round?: number): Promise<void>;
    /**
     * Submit peer reputation feedback
     */
    submitPeerFeedback(fromAgentId: string, toAgentId: string, rating: number, category: "behavior" | "performance" | "reliability" | "security" | "cooperation", comment?: string, evidence?: any): Promise<boolean>;
    /**
     * Create proof-of-work challenge for agent verification
     */
    createVerificationChallenge(agentId: string, purpose?: "verification" | "recovery" | "trust_building", difficulty?: number): Promise<ProofOfWorkChallenge>;
    /**
     * Submit trust assertion for distributed verification
     */
    submitTrustAssertion(fromAgentId: string, toAgentId: string, trustLevel: number, domains: string[], evidence: any[], context?: string): Promise<TrustAssertion>;
    /**
     * Run security simulation test
     */
    runSecurityTest(scenarioId: string): Promise<AttackSimulationResult>;
    /**
     * Get comprehensive security dashboard
     */
    getSecurityDashboard(): Promise<SecurityDashboard>;
    /**
     * Event handlers
     */
    private handleAgentRegistration;
    private handleMessageReceived;
    private handleSecurityAlert;
    private handleConsensusDetectionRequest;
    private handleMaliciousAgentDetected;
    private handleTrustLevelChange;
    private handleAgentQuarantined;
    private handleAgentRecovered;
    private handleTrustAssertionVerified;
    private handleSimulationCompleted;
    /**
     * Automated security processes
     */
    private performMaliciousDetectionRound;
    private collectSecurityMetrics;
    private runPeriodicSecurityTest;
    /**
     * Validation and utility methods
     */
    private validateAgentForMessaging;
    private mapTrustLevelToScore;
    private mapScoreToTrustLevel;
    private mapEventSeverityToAlertSeverity;
    private determineAlertActions;
    private calculateSystemHealth;
    private calculateAverageDetectionTime;
    private calculateDetectionAccuracy;
    private calculateFalsePositiveRate;
    private calculateTrustLevelDistribution;
    private calculateTodayEndorsements;
    private calculateCompletedChallenges;
    private calculateConsensusHealth;
    private calculateMessageThroughput;
    private calculateNetworkLatency;
    private calculateFragmentationLevel;
    /**
     * Public API methods - delegate to base security manager or enhanced components
     */
    getSecurityPolicy(): SecurityPolicy;
    getAgentIdentities(): A2AIdentity[];
    getActiveSessions(): import("../../../core/a2a-security-manager.js").A2ASession[];
    getSecurityEvents(limit?: number): SecurityEvent[];
    getPerformanceMetrics(): any;
    getReputationScore(agentId: string): ReputationScore | null;
    getQuarantineRecord(agentId: string): QuarantineRecord | null;
    isQuarantined(agentId: string): boolean;
    emergencyShutdown(reason: string): Promise<void>;
}
export { EnhancedA2ASecurityManager, EnhancedSecurityConfig, SecurityDashboard, SecurityAlert, };
//# sourceMappingURL=enhanced-security-manager.d.ts.map