/**
 * Distributed Trust Verification System for A2A Protocol
 *
 * Implements comprehensive distributed trust verification protocols
 * enabling agents to collaboratively establish and maintain trust
 * relationships through cryptographic proofs, behavioral attestations,
 * and consensus-based verification mechanisms.
 *
 * Features:
 * - Multi-layer trust verification (cryptographic, behavioral, social)
 * - Distributed attestation and witness protocols
 * - Byzantine fault-tolerant trust consensus
 * - Zero-knowledge proof integration for privacy
 * - Time-decay trust models with renewal mechanisms
 * - Cross-domain trust transitivity and reputation bridging
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
export interface TrustAssertion {
    assertionId: string;
    fromAgentId: string;
    toAgentId: string;
    trustLevel: number;
    trustDomains: string[];
    assertionType: "direct" | "transitive" | "inferred" | "witnessed";
    confidence: number;
    evidence: TrustEvidence[];
    timestamp: Date;
    validUntil?: Date;
    decayRate: number;
    signature: string;
    witnessSignatures: string[];
    merkleRoot?: string;
    status: "pending" | "verified" | "disputed" | "expired" | "revoked";
    verifications: TrustVerification[];
    disputes: TrustDispute[];
    metadata: {
        source: string;
        context: string;
        weight: number;
        tags: string[];
    };
}
export interface TrustEvidence {
    evidenceId: string;
    type: "behavioral" | "cryptographic" | "social" | "performance" | "historical";
    description: string;
    data: any;
    proof?: string;
    witnesses: string[];
    timestamp: Date;
    weight: number;
    verifiable: boolean;
}
export interface TrustVerification {
    verificationId: string;
    verifierAgentId: string;
    assertionId: string;
    result: "confirmed" | "denied" | "inconclusive";
    confidence: number;
    evidence: any;
    timestamp: Date;
    signature: string;
    method: "direct_validation" | "cross_reference" | "behavioral_analysis" | "cryptographic_proof";
    computationProof?: string;
    witnesses: string[];
}
export interface TrustDispute {
    disputeId: string;
    disputerAgentId: string;
    assertionId: string;
    reason: string;
    evidence: any;
    timestamp: Date;
    status: "open" | "under_review" | "resolved" | "dismissed";
    resolution?: {
        decision: "upheld" | "overturned" | "modified";
        newTrustLevel?: number;
        reason: string;
        arbitrators: string[];
        timestamp: Date;
    };
}
export interface TrustPath {
    pathId: string;
    fromAgentId: string;
    toAgentId: string;
    path: string[];
    trustLevel: number;
    confidence: number;
    length: number;
    weakestLink: {
        fromAgent: string;
        toAgent: string;
        trustLevel: number;
    };
    computedAt: Date;
    validUntil: Date;
    refreshRequired: boolean;
    supportingAssertions: string[];
}
export interface TrustNetwork {
    networkId: string;
    name: string;
    description: string;
    agents: string[];
    trustAssertions: Map<string, TrustAssertion>;
    trustPaths: Map<string, TrustPath[]>;
    metrics: {
        density: number;
        clustering: number;
        averagePathLength: number;
        centralityScores: Map<string, number>;
        trustDistribution: number[];
    };
    consensus: {
        threshold: number;
        minimumWitnesses: number;
        disputeResolutionMethod: "majority" | "weighted" | "arbitration";
        timeouts: {
            verification: number;
            dispute: number;
        };
    };
    metadata: {
        createdAt: Date;
        lastUpdated: Date;
        version: string;
        maintainers: string[];
    };
}
export interface ZKTrustProof {
    proofId: string;
    agentId: string;
    claimType: "reputation_threshold" | "behavior_compliance" | "trust_relationship" | "skill_verification";
    proof: string;
    publicInputs: any;
    proofSystem: "groth16" | "plonk" | "stark" | "bulletproofs";
    verified: boolean;
    verifiers: string[];
    verificationCircuit: string;
    timestamp: Date;
    validUntil: Date;
    purpose: string;
}
export interface TrustOracle {
    oracleId: string;
    name: string;
    type: "reputation" | "behavioral" | "cryptographic" | "hybrid";
    trustDomains: string[];
    reliability: number;
    responseTime: number;
    authorizedAgents: string[];
    accessLevel: "public" | "private" | "consortium";
    endpoint: string;
    queryFormats: string[];
    rateLimits: {
        queriesPerMinute: number;
        burstLimit: number;
    };
}
export declare class DistributedTrustVerifier extends EventEmitter {
    private logger;
    private trustNetwork;
    private trustAssertions;
    private trustPaths;
    private zkProofs;
    private trustOracles;
    private pathCalculator;
    private consensusEngine;
    private zkVerifier;
    private oracleManager;
    private disputeResolver;
    private config;
    constructor(networkConfig?: Partial<TrustNetwork>);
    /**
     * Initialize trust network
     */
    private initializeTrustNetwork;
    /**
     * Initialize components
     */
    private initializeComponents;
    /**
     * Start periodic tasks
     */
    private startPeriodicTasks;
    /**
     * Submit trust assertion
     */
    submitTrustAssertion(fromAgentId: string, toAgentId: string, trustLevel: number, trustDomains: string[], evidence: Omit<TrustEvidence, "evidenceId" | "timestamp">[], validUntil?: Date, context?: string): Promise<TrustAssertion>;
    /**
     * Verify trust assertion
     */
    verifyTrustAssertion(assertionId: string, verifierAgentId: string, method?: "direct_validation" | "cross_reference" | "behavioral_analysis" | "cryptographic_proof"): Promise<TrustVerification>;
    /**
     * Compute trust between two agents
     */
    computeTrust(fromAgentId: string, toAgentId: string, domains?: string[]): Promise<{
        trustLevel: number;
        confidence: number;
        path?: TrustPath;
        directTrust?: TrustAssertion;
        computedAt: Date;
    }>;
    /**
     * Create zero-knowledge trust proof
     */
    createZKTrustProof(agentId: string, claimType: "reputation_threshold" | "behavior_compliance" | "trust_relationship" | "skill_verification", privateInputs: any, publicInputs: any, purpose: string): Promise<ZKTrustProof>;
    /**
     * Verify zero-knowledge trust proof
     */
    verifyZKTrustProof(proofId: string, verifierAgentId: string): Promise<{
        valid: boolean;
        error?: string;
    }>;
    /**
     * Submit trust dispute
     */
    submitTrustDispute(assertionId: string, disputerAgentId: string, reason: string, evidence: any): Promise<TrustDispute>;
    /**
     * Query trust oracle
     */
    queryTrustOracle(oracleId: string, agentId: string, query: any): Promise<{
        result: any;
        confidence: number;
        timestamp: Date;
    }>;
    /**
     * Helper methods
     */
    private initiateVerification;
    private performVerification;
    private performDirectValidation;
    private performCrossReference;
    private performBehavioralAnalysis;
    private performCryptographicProof;
    private checkVerificationConsensus;
    private checkVerificationTimeout;
    private calculateAssertionConfidence;
    private signAssertion;
    private signVerification;
    private findDirectTrustAssertion;
    private applyTemporalDecay;
    private findRelatedAssertions;
    private refreshTrustPaths;
    private updateNetworkMetrics;
    private calculateNetworkMetrics;
    private calculateDistribution;
    private cleanupExpiredData;
    /**
     * Public API methods
     */
    getTrustAssertion(assertionId: string): TrustAssertion | null;
    getAgentTrustAssertions(agentId: string): TrustAssertion[];
    getTrustPath(fromAgentId: string, toAgentId: string): TrustPath | null;
    getZKProof(proofId: string): ZKTrustProof | null;
    getNetworkMetrics(): TrustNetwork["metrics"];
    getSystemStats(): Promise<any>;
}
export { DistributedTrustVerifier, TrustAssertion, TrustEvidence, TrustVerification, TrustDispute, TrustPath, TrustNetwork, ZKTrustProof, TrustOracle, };
//# sourceMappingURL=trust-verification.d.ts.map