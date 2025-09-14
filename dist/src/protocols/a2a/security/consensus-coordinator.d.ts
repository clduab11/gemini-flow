/**
 * Consensus-Based Malicious Detection Coordinator
 *
 * Implements Byzantine fault-tolerant consensus specifically for malicious
 * agent detection, ensuring that agents can only be quarantined through
 * distributed agreement within exactly 3 consensus rounds, providing
 * strong guarantees against false positives and coordinated attacks.
 *
 * Features:
 * - Exactly 3-round consensus protocol for detection decisions
 * - Byzantine fault tolerance with f < n/3 malicious nodes
 * - Cryptographic vote verification and aggregation
 * - Threshold signatures for consensus finalization
 * - Anti-collusion measures and vote privacy
 * - Automatic recovery from consensus failures
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { MaliciousDetectionResult } from "./malicious-detection.js";
export interface ConsensusRound {
    roundId: string;
    targetAgentId: string;
    roundNumber: 1 | 2 | 3;
    startTime: Date;
    endTime?: Date;
    timeoutMs: number;
    evidence: ConsensusEvidence;
    votes: ConsensusVoteRecord[];
    threshold: number;
    status: "active" | "completed" | "failed" | "timeout";
    result?: "malicious" | "benign" | "inconclusive";
    confidence: number;
    eligibleVoters: string[];
    actualVoters: string[];
    abstentions: string[];
    roundHash: string;
    voterSignatures: Map<string, string>;
    aggregateSignature?: string;
}
export interface ConsensusEvidence {
    evidenceId: string;
    sourceRound?: number;
    type: "behavioral" | "cryptographic" | "network" | "consensus" | "aggregated";
    weight: number;
    reliability: number;
    data: {
        behaviorDeviations?: any[];
        protocolViolations?: any[];
        networkAnomalies?: any[];
        witnessStatements?: WitnessStatement[];
        cryptographicProofs?: CryptographicProof[];
    };
    submittedBy: string;
    timestamp: Date;
    signature: string;
    verified: boolean;
}
export interface WitnessStatement {
    witnessId: string;
    statementType: "observation" | "interaction" | "measurement";
    description: string;
    confidence: number;
    timestamp: Date;
    signature: string;
    evidence?: any;
}
export interface CryptographicProof {
    proofType: "signature_verification" | "nonce_reuse" | "message_tampering" | "identity_forgery";
    proofData: string;
    verificationResult: boolean;
    provenBy: string;
    timestamp: Date;
}
export interface ConsensusVoteRecord {
    voteId: string;
    voterId: string;
    targetAgentId: string;
    roundNumber: number;
    decision: "malicious" | "benign" | "abstain";
    confidence: number;
    reasoning: string;
    evidenceRefs: string[];
    timestamp: Date;
    voterReputation: number;
    voterStake: number;
    weight: number;
    signature: string;
    verified: boolean;
    commitHash?: string;
    revealNonce?: string;
    blindingFactor?: string;
}
export interface ConsensusResult {
    consensusId: string;
    targetAgentId: string;
    finalDecision: "malicious" | "benign" | "failed";
    overallConfidence: number;
    consensusReached: boolean;
    rounds: ConsensusRound[];
    totalRounds: number;
    successfulRounds: number;
    totalVotes: number;
    maliciousVotes: number;
    benignVotes: number;
    abstentions: number;
    participationRate: number;
    evidenceQuality: number;
    voterAgreement: number;
    byzantineResistance: number;
    startTime: Date;
    endTime: Date;
    totalDuration: number;
    consensusHash: string;
    thresholdSignature?: string;
    verificationPassed: boolean;
}
export interface ConsensusConfig {
    roundTimeout: number;
    maxRounds: 3;
    minParticipation: number;
    maliciousThreshold: number;
    benignThreshold: number;
    confidenceThreshold: number;
    maxByzantineRatio: number;
    requireSuperMajority: boolean;
    minEvidenceQuality: number;
    evidenceAggregation: "weighted" | "majority" | "expert";
    useCommitReveal: boolean;
    voteBlinding: boolean;
    shuffleVoters: boolean;
    requireCryptographicProofs: boolean;
    thresholdSignatures: boolean;
    auditTrail: boolean;
}
export declare class ConsensusDetectionCoordinator extends EventEmitter {
    private logger;
    private config;
    private activeConsensus;
    private completedConsensus;
    private evidencePool;
    private eligibleVoters;
    private voterReputations;
    private voterStakes;
    private consensusKeys;
    private thresholdScheme;
    private commitStore;
    private blindingFactors;
    constructor(config?: Partial<ConsensusConfig>);
    /**
     * Initialize consensus configuration
     */
    private initializeConfig;
    /**
     * Initialize cryptographic infrastructure
     */
    private initializeCryptography;
    /**
     * Register eligible voter
     */
    registerVoter(voterId: string, reputation: number, stake?: number): Promise<boolean>;
    /**
     * Initiate 3-round consensus for malicious detection
     */
    initiateConsensus(targetAgentId: string, initialEvidence: ConsensusEvidence, detectionResult: MaliciousDetectionResult): Promise<string>;
    /**
     * Round 1: Evidence Collection and Initial Voting
     */
    private executeRound1;
    /**
     * Submit evidence for consensus round
     */
    submitEvidence(consensusId: string, evidence: Omit<ConsensusEvidence, "evidenceId" | "timestamp" | "signature" | "verified">): Promise<boolean>;
    /**
     * Submit vote for consensus round
     */
    submitVote(consensusId: string, vote: Omit<ConsensusVoteRecord, "voteId" | "timestamp" | "signature" | "verified" | "weight">): Promise<boolean>;
    /**
     * Process Round 1 completion and start Round 2
     */
    private processRound1Timeout;
    /**
     * Round 2: Evidence Review and Confirmation
     */
    private executeRound2;
    /**
     * Process Round 2 completion and start Round 3
     */
    private processRound2Timeout;
    /**
     * Round 3: Final Decision
     */
    private executeRound3;
    /**
     * Process Round 3 completion and finalize
     */
    private processRound3Timeout;
    /**
     * Finalize consensus and generate results
     */
    private finalizeConsensus;
    /**
     * Helper methods for consensus processing
     */
    private checkRoundCompletion;
    private analyzeRoundVotes;
    private calculateVoterAgreement;
    private calculateVoteWeight;
    private shouldSkipRound3;
    private makeFinalDecision;
    private calculateFinalMetrics;
    /**
     * Cryptographic and verification methods
     */
    private calculateRoundHash;
    private signEvidence;
    private signVote;
    private verifyEvidence;
    private verifyVote;
    private generateConsensusHash;
    private verifyConsensusIntegrity;
    private aggregateEvidence;
    private aggregateAllEvidence;
    private revealRound1Votes;
    private findConsensusById;
    /**
     * Public API methods
     */
    getActiveConsensus(): ConsensusResult[];
    getCompletedConsensus(): ConsensusResult[];
    getConsensusById(consensusId: string): ConsensusResult | null;
    getEligibleVoters(): string[];
    getSystemStats(): Promise<any>;
    private calculateAverageConsensusTime;
    private calculateConsensusSuccessRate;
}
export { ConsensusDetectionCoordinator, ConsensusRound, ConsensusEvidence, ConsensusVoteRecord, ConsensusResult, ConsensusConfig, };
//# sourceMappingURL=consensus-coordinator.d.ts.map