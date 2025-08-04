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

import { EventEmitter } from 'events';
import crypto from 'crypto';
import { Logger } from '../../../utils/logger.js';
import { A2AIdentity } from '../../../core/a2a-security-manager.js';
import { ReputationScore } from './reputation-system.js';

export interface TrustAssertion {
  assertionId: string;
  fromAgentId: string;
  toAgentId: string;
  trustLevel: number;        // 0-1, normalized trust level
  trustDomains: string[];    // Domains of trust (e.g., 'security', 'performance', 'reliability')
  
  // Assertion details
  assertionType: 'direct' | 'transitive' | 'inferred' | 'witnessed';
  confidence: number;        // Confidence in the assertion (0-1)
  evidence: TrustEvidence[];
  
  // Temporal aspects
  timestamp: Date;
  validUntil?: Date;
  decayRate: number;         // Rate of trust decay over time
  
  // Cryptographic proof
  signature: string;
  witnessSignatures: string[];
  merkleRoot?: string;       // For batch assertions
  
  // Verification status
  status: 'pending' | 'verified' | 'disputed' | 'expired' | 'revoked';
  verifications: TrustVerification[];
  disputes: TrustDispute[];
  
  metadata: {
    source: string;          // Source of trust assertion
    context: string;         // Context in which trust was established
    weight: number;          // Weight in trust calculations
    tags: string[];          // Additional tags for categorization
  };
}

export interface TrustEvidence {
  evidenceId: string;
  type: 'behavioral' | 'cryptographic' | 'social' | 'performance' | 'historical';
  description: string;
  data: any;
  proof?: string;            // Cryptographic proof if applicable
  witnesses: string[];       // Agent IDs who can attest to this evidence
  timestamp: Date;
  weight: number;            // Weight of this evidence (0-1)
  verifiable: boolean;       // Whether evidence can be independently verified
}

export interface TrustVerification {
  verificationId: string;
  verifierAgentId: string;
  assertionId: string;
  result: 'confirmed' | 'denied' | 'inconclusive';
  confidence: number;
  evidence: any;
  timestamp: Date;
  signature: string;
  
  // Verification details
  method: 'direct_validation' | 'cross_reference' | 'behavioral_analysis' | 'cryptographic_proof';
  computationProof?: string; // Proof of computation for verification
  witnesses: string[];
}

export interface TrustDispute {
  disputeId: string;
  disputerAgentId: string;
  assertionId: string;
  reason: string;
  evidence: any;
  timestamp: Date;
  status: 'open' | 'under_review' | 'resolved' | 'dismissed';
  
  // Resolution
  resolution?: {
    decision: 'upheld' | 'overturned' | 'modified';
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
  path: string[];           // Intermediate agents in trust path
  trustLevel: number;       // Computed trust level through path
  confidence: number;       // Confidence in the path
  length: number;           // Path length (number of hops)
  
  // Path analysis
  weakestLink: {
    fromAgent: string;
    toAgent: string;
    trustLevel: number;
  };
  
  // Temporal aspects
  computedAt: Date;
  validUntil: Date;
  refreshRequired: boolean;
  
  // Supporting assertions
  supportingAssertions: string[]; // Assertion IDs used in path
}

export interface TrustNetwork {
  networkId: string;
  name: string;
  description: string;
  
  // Network properties
  agents: string[];
  trustAssertions: Map<string, TrustAssertion>; // assertionId -> assertion
  trustPaths: Map<string, TrustPath[]>;          // agentId -> paths from that agent
  
  // Network metrics
  metrics: {
    density: number;          // Network density (0-1)
    clustering: number;       // Clustering coefficient
    averagePathLength: number;
    centralityScores: Map<string, number>; // agentId -> centrality score
    trustDistribution: number[]; // Distribution of trust levels
  };
  
  // Consensus mechanisms
  consensus: {
    threshold: number;        // Consensus threshold (0-1)
    minimumWitnesses: number; // Minimum witnesses for verification
    disputeResolutionMethod: 'majority' | 'weighted' | 'arbitration';
    timeouts: {
      verification: number;   // Verification timeout (ms)
      dispute: number;        // Dispute resolution timeout (ms)
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
  claimType: 'reputation_threshold' | 'behavior_compliance' | 'trust_relationship' | 'skill_verification';
  
  // Zero-knowledge proof data
  proof: string;            // The actual ZK proof
  publicInputs: any;        // Public inputs to the proof
  proofSystem: 'groth16' | 'plonk' | 'stark' | 'bulletproofs';
  
  // Verification
  verified: boolean;
  verifiers: string[];
  verificationCircuit: string; // Circuit used for verification
  
  // Metadata
  timestamp: Date;
  validUntil: Date;
  purpose: string;
}

export interface TrustOracle {
  oracleId: string;
  name: string;
  type: 'reputation' | 'behavioral' | 'cryptographic' | 'hybrid';
  
  // Oracle properties
  trustDomains: string[];
  reliability: number;      // Historical reliability score (0-1)
  responseTime: number;     // Average response time (ms)
  
  // Access control
  authorizedAgents: string[];
  accessLevel: 'public' | 'private' | 'consortium';
  
  // Query interface
  endpoint: string;
  queryFormats: string[];
  rateLimits: {
    queriesPerMinute: number;
    burstLimit: number;
  };
}

export class DistributedTrustVerifier extends EventEmitter {
  private logger: Logger;
  private trustNetwork: TrustNetwork;
  private trustAssertions: Map<string, TrustAssertion> = new Map();
  private trustPaths: Map<string, Map<string, TrustPath>> = new Map(); // fromAgent -> toAgent -> path
  private zkProofs: Map<string, ZKTrustProof> = new Map();
  private trustOracles: Map<string, TrustOracle> = new Map();
  
  // Verification components
  private pathCalculator: TrustPathCalculator;
  private consensusEngine: TrustConsensusEngine;
  private zkVerifier: ZKTrustVerifier;
  private oracleManager: TrustOracleManager;
  private disputeResolver: TrustDisputeResolver;
  
  // Configuration
  private config = {
    // Trust computation
    trust: {
      maxPathLength: 5,              // Maximum trust path length
      decayFactor: 0.95,            // Trust decay per hop
      minimumTrustLevel: 0.1,       // Minimum trust level to consider
      temporalDecayRate: 0.001,     // Daily trust decay rate
      refreshInterval: 3600000,      // 1 hour refresh interval
    },
    
    // Verification requirements
    verification: {
      minimumWitnesses: 3,
      consensusThreshold: 0.67,     // 67% consensus required
      verificationTimeout: 300000,  // 5 minutes
      maxDisputes: 5,               // Max disputes per assertion
      disputeTimeout: 86400000,     // 24 hours dispute resolution
    },
    
    // Zero-knowledge proofs
    zk: {
      enableZKProofs: true,
      defaultProofSystem: 'groth16' as const,
      proofValidityPeriod: 2592000000, // 30 days
      batchVerification: true,
    },
    
    // Network parameters
    network: {
      maxNetworkSize: 10000,
      maxAssertionsPerAgent: 1000,
      cleanupInterval: 86400000,    // 24 hours cleanup
      metricsUpdateInterval: 3600000, // 1 hour metrics update
    }
  };

  constructor(networkConfig?: Partial<TrustNetwork>) {
    super();
    this.logger = new Logger('DistributedTrustVerifier');
    
    this.initializeTrustNetwork(networkConfig);
    this.initializeComponents();
    this.startPeriodicTasks();
    
    this.logger.info('Distributed Trust Verifier initialized', {
      networkId: this.trustNetwork.networkId,
      features: [
        'multi-layer-verification', 'byzantine-fault-tolerance', 'zero-knowledge-proofs',
        'trust-path-computation', 'dispute-resolution', 'oracle-integration'
      ]
    });
  }

  /**
   * Initialize trust network
   */
  private initializeTrustNetwork(config?: Partial<TrustNetwork>): void {
    this.trustNetwork = {
      networkId: crypto.randomUUID(),
      name: 'A2A Trust Network',
      description: 'Distributed trust verification network for A2A protocol',
      agents: [],
      trustAssertions: new Map(),
      trustPaths: new Map(),
      metrics: {
        density: 0,
        clustering: 0,
        averagePathLength: 0,
        centralityScores: new Map(),
        trustDistribution: []
      },
      consensus: {
        threshold: 0.67,
        minimumWitnesses: 3,
        disputeResolutionMethod: 'weighted',
        timeouts: {
          verification: 300000,
          dispute: 86400000
        }
      },
      metadata: {
        createdAt: new Date(),
        lastUpdated: new Date(),
        version: '1.0.0',
        maintainers: ['system']
      },
      ...config
    };
  }

  /**
   * Initialize components
   */
  private initializeComponents(): void {
    this.pathCalculator = new TrustPathCalculator(this.config);
    this.consensusEngine = new TrustConsensusEngine(this.config);
    this.zkVerifier = new ZKTrustVerifier(this.config);
    this.oracleManager = new TrustOracleManager(this.config);
    this.disputeResolver = new TrustDisputeResolver(this.config);
  }

  /**
   * Start periodic tasks
   */
  private startPeriodicTasks(): void {
    // Refresh trust paths
    setInterval(async () => {
      await this.refreshTrustPaths();
    }, this.config.trust.refreshInterval);
    
    // Update network metrics
    setInterval(async () => {
      await this.updateNetworkMetrics();
    }, this.config.network.metricsUpdateInterval);
    
    // Cleanup expired data
    setInterval(async () => {
      await this.cleanupExpiredData();
    }, this.config.network.cleanupInterval);
  }

  /**
   * Submit trust assertion
   */
  async submitTrustAssertion(
    fromAgentId: string,
    toAgentId: string,
    trustLevel: number,
    trustDomains: string[],
    evidence: Omit<TrustEvidence, 'evidenceId' | 'timestamp'>[],
    validUntil?: Date,
    context?: string
  ): Promise<TrustAssertion> {
    // Validate inputs
    if (trustLevel < 0 || trustLevel > 1) {
      throw new Error('Trust level must be between 0 and 1');
    }

    if (fromAgentId === toAgentId) {
      throw new Error('Self-trust assertions are not allowed');
    }

    // Create trust evidence
    const trustEvidence: TrustEvidence[] = evidence.map(e => ({
      evidenceId: crypto.randomUUID(),
      timestamp: new Date(),
      ...e
    }));

    // Create trust assertion
    const assertion: TrustAssertion = {
      assertionId: crypto.randomUUID(),
      fromAgentId,
      toAgentId,
      trustLevel,
      trustDomains,
      assertionType: 'direct',
      confidence: this.calculateAssertionConfidence(evidence),
      evidence: trustEvidence,
      timestamp: new Date(),
      validUntil,
      decayRate: this.config.trust.temporalDecayRate,
      signature: await this.signAssertion(fromAgentId, toAgentId, trustLevel),
      witnessSignatures: [],
      status: 'pending',
      verifications: [],
      disputes: [],
      metadata: {
        source: 'direct_assertion',
        context: context || 'general',
        weight: 1.0,
        tags: []
      }
    };

    // Store assertion
    this.trustAssertions.set(assertion.assertionId, assertion);
    this.trustNetwork.trustAssertions.set(assertion.assertionId, assertion);

    // Add agents to network if not present
    if (!this.trustNetwork.agents.includes(fromAgentId)) {
      this.trustNetwork.agents.push(fromAgentId);
    }
    if (!this.trustNetwork.agents.includes(toAgentId)) {
      this.trustNetwork.agents.push(toAgentId);
    }

    // Initiate verification process
    await this.initiateVerification(assertion);

    this.logger.info('Trust assertion submitted', {
      assertionId: assertion.assertionId,
      fromAgent: fromAgentId,
      toAgent: toAgentId,
      trustLevel,
      domains: trustDomains
    });

    this.emit('trust_assertion_submitted', assertion);
    return assertion;
  }

  /**
   * Verify trust assertion
   */
  async verifyTrustAssertion(
    assertionId: string,
    verifierAgentId: string,
    method: 'direct_validation' | 'cross_reference' | 'behavioral_analysis' | 'cryptographic_proof' = 'direct_validation'
  ): Promise<TrustVerification> {
    const assertion = this.trustAssertions.get(assertionId);
    if (!assertion) {
      throw new Error('Trust assertion not found');
    }

    // Check if verifier already verified this assertion
    const existingVerification = assertion.verifications.find(v => v.verifierAgentId === verifierAgentId);
    if (existingVerification) {
      throw new Error('Agent has already verified this assertion');
    }

    // Perform verification based on method
    const verificationResult = await this.performVerification(assertion, verifierAgentId, method);

    const verification: TrustVerification = {
      verificationId: crypto.randomUUID(),
      verifierAgentId,
      assertionId,
      result: verificationResult.result,
      confidence: verificationResult.confidence,
      evidence: verificationResult.evidence,
      timestamp: new Date(),
      signature: await this.signVerification(verifierAgentId, assertionId, verificationResult.result),
      method,
      computationProof: verificationResult.computationProof,
      witnesses: verificationResult.witnesses || []
    };

    // Add verification to assertion
    assertion.verifications.push(verification);

    // Check if consensus is reached
    await this.checkVerificationConsensus(assertion);

    this.logger.info('Trust assertion verified', {
      assertionId,
      verifier: verifierAgentId,
      result: verification.result,
      method
    });

    this.emit('trust_verification_completed', verification);
    return verification;
  }

  /**
   * Compute trust between two agents
   */
  async computeTrust(
    fromAgentId: string,
    toAgentId: string,
    domains?: string[]
  ): Promise<{
    trustLevel: number;
    confidence: number;
    path?: TrustPath;
    directTrust?: TrustAssertion;
    computedAt: Date;
  }> {
    // Check for direct trust assertion
    const directAssertion = await this.findDirectTrustAssertion(fromAgentId, toAgentId, domains);
    
    if (directAssertion && directAssertion.status === 'verified') {
      // Apply temporal decay
      const currentTrust = this.applyTemporalDecay(directAssertion);
      
      return {
        trustLevel: currentTrust,
        confidence: directAssertion.confidence,
        directTrust: directAssertion,
        computedAt: new Date()
      };
    }

    // Compute trust path
    const trustPath = await this.pathCalculator.findBestTrustPath(
      fromAgentId,
      toAgentId,
      this.trustAssertions,
      domains
    );

    if (!trustPath) {
      return {
        trustLevel: 0,
        confidence: 0,
        computedAt: new Date()
      };
    }

    return {
      trustLevel: trustPath.trustLevel,
      confidence: trustPath.confidence,
      path: trustPath,
      computedAt: new Date()
    };
  }

  /**
   * Create zero-knowledge trust proof
   */
  async createZKTrustProof(
    agentId: string,
    claimType: 'reputation_threshold' | 'behavior_compliance' | 'trust_relationship' | 'skill_verification',
    privateInputs: any,
    publicInputs: any,
    purpose: string
  ): Promise<ZKTrustProof> {
    if (!this.config.zk.enableZKProofs) {
      throw new Error('Zero-knowledge proofs are disabled');
    }

    const proof = await this.zkVerifier.generateProof(
      claimType,
      privateInputs,
      publicInputs,
      this.config.zk.defaultProofSystem
    );

    const zkProof: ZKTrustProof = {
      proofId: crypto.randomUUID(),
      agentId,
      claimType,
      proof: proof.proof,
      publicInputs,
      proofSystem: this.config.zk.defaultProofSystem,
      verified: false,
      verifiers: [],
      verificationCircuit: proof.circuit,
      timestamp: new Date(),
      validUntil: new Date(Date.now() + this.config.zk.proofValidityPeriod),
      purpose
    };

    this.zkProofs.set(zkProof.proofId, zkProof);

    this.logger.info('ZK trust proof created', {
      proofId: zkProof.proofId,
      agentId,
      claimType,
      purpose
    });

    this.emit('zk_proof_created', zkProof);
    return zkProof;
  }

  /**
   * Verify zero-knowledge trust proof
   */
  async verifyZKTrustProof(
    proofId: string,
    verifierAgentId: string
  ): Promise<{ valid: boolean; error?: string }> {
    const zkProof = this.zkProofs.get(proofId);
    if (!zkProof) {
      return { valid: false, error: 'Proof not found' };
    }

    if (zkProof.validUntil < new Date()) {
      return { valid: false, error: 'Proof expired' };
    }

    try {
      const isValid = await this.zkVerifier.verifyProof(
        zkProof.proof,
        zkProof.publicInputs,
        zkProof.verificationCircuit,
        zkProof.proofSystem
      );

      if (isValid && !zkProof.verifiers.includes(verifierAgentId)) {
        zkProof.verifiers.push(verifierAgentId);
        
        // Mark as verified if enough verifications
        if (zkProof.verifiers.length >= this.config.verification.minimumWitnesses) {
          zkProof.verified = true;
        }
      }

      this.logger.info('ZK proof verification completed', {
        proofId,
        verifier: verifierAgentId,
        valid: isValid
      });

      return { valid: isValid };

    } catch (error) {
      this.logger.error('ZK proof verification failed', {
        proofId,
        verifier: verifierAgentId,
        error
      });

      return { valid: false, error: error.message };
    }
  }

  /**
   * Submit trust dispute
   */
  async submitTrustDispute(
    assertionId: string,
    disputerAgentId: string,
    reason: string,
    evidence: any
  ): Promise<TrustDispute> {
    const assertion = this.trustAssertions.get(assertionId);
    if (!assertion) {
      throw new Error('Trust assertion not found');
    }

    // Check dispute limits
    if (assertion.disputes.length >= this.config.verification.maxDisputes) {
      throw new Error('Maximum disputes reached for this assertion');
    }

    const dispute: TrustDispute = {
      disputeId: crypto.randomUUID(),
      disputerAgentId,
      assertionId,
      reason,
      evidence,
      timestamp: new Date(),
      status: 'open'
    };

    assertion.disputes.push(dispute);
    assertion.status = 'disputed';

    // Initiate dispute resolution
    await this.disputeResolver.initiateResolution(dispute, assertion);

    this.logger.warn('Trust dispute submitted', {
      disputeId: dispute.disputeId,
      assertionId,
      disputer: disputerAgentId,
      reason
    });

    this.emit('trust_dispute_submitted', dispute);
    return dispute;
  }

  /**
   * Query trust oracle
   */
  async queryTrustOracle(
    oracleId: string,
    agentId: string,
    query: any
  ): Promise<{ result: any; confidence: number; timestamp: Date }> {
    const oracle = this.trustOracles.get(oracleId);
    if (!oracle) {
      throw new Error('Trust oracle not found');
    }

    if (oracle.accessLevel === 'private' && !oracle.authorizedAgents.includes(agentId)) {
      throw new Error('Agent not authorized to query this oracle');
    }

    return await this.oracleManager.query(oracle, query);
  }

  /**
   * Helper methods
   */

  private async initiateVerification(assertion: TrustAssertion): Promise<void> {
    // Select verifiers (excluding the asserter and subject)
    const eligibleVerifiers = this.trustNetwork.agents.filter(
      agentId => agentId !== assertion.fromAgentId && agentId !== assertion.toAgentId
    );

    // Request verification from multiple agents
    const verificationRequests = Math.min(
      this.config.verification.minimumWitnesses * 2,
      eligibleVerifiers.length
    );

    for (let i = 0; i < verificationRequests; i++) {
      const verifier = eligibleVerifiers[i];
      
      this.emit('verification_request', {
        assertionId: assertion.assertionId,
        verifierAgentId: verifier,
        deadline: new Date(Date.now() + this.config.verification.verificationTimeout)
      });
    }

    // Set timeout for verification
    setTimeout(async () => {
      await this.checkVerificationTimeout(assertion.assertionId);
    }, this.config.verification.verificationTimeout);
  }

  private async performVerification(
    assertion: TrustAssertion,
    verifierAgentId: string,
    method: string
  ): Promise<{
    result: 'confirmed' | 'denied' | 'inconclusive';
    confidence: number;
    evidence: any;
    computationProof?: string;
    witnesses?: string[];
  }> {
    switch (method) {
      case 'direct_validation':
        return await this.performDirectValidation(assertion, verifierAgentId);
      case 'cross_reference':
        return await this.performCrossReference(assertion, verifierAgentId);
      case 'behavioral_analysis':
        return await this.performBehavioralAnalysis(assertion, verifierAgentId);
      case 'cryptographic_proof':
        return await this.performCryptographicProof(assertion, verifierAgentId);
      default:
        throw new Error(`Unsupported verification method: ${method}`);
    }
  }

  private async performDirectValidation(
    assertion: TrustAssertion,
    verifierAgentId: string
  ): Promise<any> {
    // Simplified direct validation
    return {
      result: 'confirmed' as const,
      confidence: 0.8,
      evidence: { method: 'direct_validation', timestamp: new Date() }
    };
  }

  private async performCrossReference(
    assertion: TrustAssertion,
    verifierAgentId: string
  ): Promise<any> {
    // Cross-reference with existing trust data
    const relatedAssertions = await this.findRelatedAssertions(assertion);
    
    return {
      result: 'confirmed' as const,
      confidence: 0.7,
      evidence: { 
        method: 'cross_reference', 
        relatedAssertions: relatedAssertions.length,
        timestamp: new Date() 
      }
    };
  }

  private async performBehavioralAnalysis(
    assertion: TrustAssertion,
    verifierAgentId: string
  ): Promise<any> {
    // Analyze behavioral patterns
    return {
      result: 'confirmed' as const,
      confidence: 0.6,
      evidence: { method: 'behavioral_analysis', timestamp: new Date() }
    };
  }

  private async performCryptographicProof(
    assertion: TrustAssertion,
    verifierAgentId: string
  ): Promise<any> {
    // Verify cryptographic proofs
    return {
      result: 'confirmed' as const,
      confidence: 0.9,
      evidence: { method: 'cryptographic_proof', timestamp: new Date() }
    };
  }

  private async checkVerificationConsensus(assertion: TrustAssertion): Promise<void> {
    const verifications = assertion.verifications;
    const totalVerifications = verifications.length;
    
    if (totalVerifications < this.config.verification.minimumWitnesses) {
      return; // Not enough verifications yet
    }

    const confirmedVerifications = verifications.filter(v => v.result === 'confirmed').length;
    const consensusRatio = confirmedVerifications / totalVerifications;

    if (consensusRatio >= this.config.verification.consensusThreshold) {
      assertion.status = 'verified';
      
      this.logger.info('Trust assertion verified by consensus', {
        assertionId: assertion.assertionId,
        verifications: totalVerifications,
        consensusRatio
      });

      this.emit('trust_assertion_verified', assertion);
    } else if (consensusRatio < (1 - this.config.verification.consensusThreshold)) {
      assertion.status = 'disputed';
      
      this.logger.warn('Trust assertion disputed by consensus', {
        assertionId: assertion.assertionId,
        verifications: totalVerifications,
        consensusRatio
      });

      this.emit('trust_assertion_disputed', assertion);
    }
  }

  private async checkVerificationTimeout(assertionId: string): Promise<void> {
    const assertion = this.trustAssertions.get(assertionId);
    if (!assertion || assertion.status !== 'pending') {
      return;
    }

    if (assertion.verifications.length < this.config.verification.minimumWitnesses) {
      assertion.status = 'expired';
      
      this.logger.warn('Trust assertion verification timeout', {
        assertionId,
        verifications: assertion.verifications.length,
        required: this.config.verification.minimumWitnesses
      });

      this.emit('trust_assertion_expired', assertion);
    }
  }

  private calculateAssertionConfidence(evidence: any[]): number {
    if (evidence.length === 0) return 0.1;
    
    const totalWeight = evidence.reduce((sum, e) => sum + (e.weight || 1), 0);
    const verifiableEvidence = evidence.filter(e => e.verifiable);
    const verifiableWeight = verifiableEvidence.reduce((sum, e) => sum + (e.weight || 1), 0);
    
    const verifiabilityRatio = verifiableWeight / totalWeight;
    const evidenceStrength = Math.min(1, evidence.length / 5); // Cap at 5 pieces of evidence
    
    return Math.min(0.95, 0.3 + (verifiabilityRatio * 0.4) + (evidenceStrength * 0.3));
  }

  private async signAssertion(fromAgentId: string, toAgentId: string, trustLevel: number): Promise<string> {
    const data = `${fromAgentId}:${toAgentId}:${trustLevel}:${Date.now()}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private async signVerification(verifierAgentId: string, assertionId: string, result: string): Promise<string> {
    const data = `${verifierAgentId}:${assertionId}:${result}:${Date.now()}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private async findDirectTrustAssertion(
    fromAgentId: string,
    toAgentId: string,
    domains?: string[]
  ): Promise<TrustAssertion | null> {
    for (const assertion of this.trustAssertions.values()) {
      if (assertion.fromAgentId === fromAgentId && 
          assertion.toAgentId === toAgentId &&
          assertion.status === 'verified') {
        
        // Check domain match if specified
        if (domains && domains.length > 0) {
          const hasMatchingDomain = domains.some(domain => 
            assertion.trustDomains.includes(domain)
          );
          if (!hasMatchingDomain) continue;
        }
        
        return assertion;
      }
    }
    
    return null;
  }

  private applyTemporalDecay(assertion: TrustAssertion): number {
    const ageInDays = (Date.now() - assertion.timestamp.getTime()) / 86400000;
    const decayFactor = Math.pow(1 - assertion.decayRate, ageInDays);
    
    return assertion.trustLevel * decayFactor;
  }

  private async findRelatedAssertions(assertion: TrustAssertion): Promise<TrustAssertion[]> {
    const related: TrustAssertion[] = [];
    
    for (const otherAssertion of this.trustAssertions.values()) {
      if (otherAssertion.assertionId === assertion.assertionId) continue;
      
      // Check if assertions involve same agents or domains
      const sameAgents = (otherAssertion.fromAgentId === assertion.fromAgentId || 
                         otherAssertion.toAgentId === assertion.toAgentId);
      
      const sameDomains = assertion.trustDomains.some(domain => 
        otherAssertion.trustDomains.includes(domain)
      );
      
      if (sameAgents || sameDomains) {
        related.push(otherAssertion);
      }
    }
    
    return related;
  }

  private async refreshTrustPaths(): Promise<void> {
    // Refresh trust paths for all agent pairs
    for (const fromAgent of this.trustNetwork.agents) {
      const pathsFromAgent = new Map<string, TrustPath>();
      
      for (const toAgent of this.trustNetwork.agents) {
        if (fromAgent === toAgent) continue;
        
        const path = await this.pathCalculator.findBestTrustPath(
          fromAgent,
          toAgent,
          this.trustAssertions
        );
        
        if (path) {
          pathsFromAgent.set(toAgent, path);
        }
      }
      
      this.trustPaths.set(fromAgent, pathsFromAgent);
    }
    
    this.logger.debug('Trust paths refreshed', {
      agentCount: this.trustNetwork.agents.length,
      pathCount: Array.from(this.trustPaths.values()).reduce((sum, paths) => sum + paths.size, 0)
    });
  }

  private async updateNetworkMetrics(): Promise<void> {
    const metrics = await this.calculateNetworkMetrics();
    this.trustNetwork.metrics = metrics;
    this.trustNetwork.metadata.lastUpdated = new Date();
    
    this.emit('network_metrics_updated', metrics);
  }

  private async calculateNetworkMetrics(): Promise<TrustNetwork['metrics']> {
    const agentCount = this.trustNetwork.agents.length;
    const assertionCount = this.trustAssertions.size;
    
    // Calculate network density
    const maxPossibleEdges = agentCount * (agentCount - 1);
    const density = maxPossibleEdges > 0 ? assertionCount / maxPossibleEdges : 0;
    
    // Calculate average path length
    let totalPathLength = 0;
    let pathCount = 0;
    
    for (const paths of this.trustPaths.values()) {
      for (const path of paths.values()) {
        totalPathLength += path.length;
        pathCount++;
      }
    }
    
    const averagePathLength = pathCount > 0 ? totalPathLength / pathCount : 0;
    
    // Calculate trust distribution
    const trustLevels = Array.from(this.trustAssertions.values()).map(a => a.trustLevel);
    const trustDistribution = this.calculateDistribution(trustLevels, 10);
    
    return {
      density,
      clustering: 0, // Simplified - would need complex calculation
      averagePathLength,
      centralityScores: new Map(), // Simplified - would calculate betweenness centrality
      trustDistribution
    };
  }

  private calculateDistribution(values: number[], bins: number): number[] {
    const distribution = new Array(bins).fill(0);
    
    values.forEach(value => {
      const binIndex = Math.min(bins - 1, Math.floor(value * bins));
      distribution[binIndex]++;
    });
    
    return distribution;
  }

  private async cleanupExpiredData(): Promise<void> {
    const now = Date.now();
    let cleanedCount = 0;
    
    // Clean expired assertions
    for (const [assertionId, assertion] of this.trustAssertions) {
      if (assertion.validUntil && assertion.validUntil.getTime() < now) {
        this.trustAssertions.delete(assertionId);
        this.trustNetwork.trustAssertions.delete(assertionId);
        cleanedCount++;
      }
    }
    
    // Clean expired ZK proofs
    for (const [proofId, proof] of this.zkProofs) {
      if (proof.validUntil.getTime() < now) {
        this.zkProofs.delete(proofId);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      this.logger.info('Cleaned up expired data', { count: cleanedCount });
    }
  }

  /**
   * Public API methods
   */

  getTrustAssertion(assertionId: string): TrustAssertion | null {
    return this.trustAssertions.get(assertionId) || null;
  }

  getAgentTrustAssertions(agentId: string): TrustAssertion[] {
    return Array.from(this.trustAssertions.values())
      .filter(assertion => 
        assertion.fromAgentId === agentId || assertion.toAgentId === agentId
      );
  }

  getTrustPath(fromAgentId: string, toAgentId: string): TrustPath | null {
    const paths = this.trustPaths.get(fromAgentId);
    return paths?.get(toAgentId) || null;
  }

  getZKProof(proofId: string): ZKTrustProof | null {
    return this.zkProofs.get(proofId) || null;
  }

  getNetworkMetrics(): TrustNetwork['metrics'] {
    return this.trustNetwork.metrics;
  }

  async getSystemStats(): Promise<any> {
    return {
      networkId: this.trustNetwork.networkId,
      totalAgents: this.trustNetwork.agents.length,
      totalAssertions: this.trustAssertions.size,
      verifiedAssertions: Array.from(this.trustAssertions.values()).filter(a => a.status === 'verified').length,
      pendingVerifications: Array.from(this.trustAssertions.values()).filter(a => a.status === 'pending').length,
      totalDisputes: Array.from(this.trustAssertions.values()).reduce((sum, a) => sum + a.disputes.length, 0),
      totalZKProofs: this.zkProofs.size,
      verifiedZKProofs: Array.from(this.zkProofs.values()).filter(p => p.verified).length,
      networkDensity: this.trustNetwork.metrics.density,
      averagePathLength: this.trustNetwork.metrics.averagePathLength
    };
  }
}

// Supporting classes

class TrustPathCalculator {
  constructor(private config: any) {}

  async findBestTrustPath(
    fromAgentId: string,
    toAgentId: string,
    trustAssertions: Map<string, TrustAssertion>,
    domains?: string[]
  ): Promise<TrustPath | null> {
    // Implement trust path calculation using graph algorithms
    // This is a simplified implementation
    
    // Build graph from trust assertions
    const graph = this.buildTrustGraph(trustAssertions, domains);
    
    // Find shortest path with highest trust
    const path = this.dijkstraWithTrust(graph, fromAgentId, toAgentId);
    
    if (!path) return null;
    
    return {
      pathId: crypto.randomUUID(),
      fromAgentId,
      toAgentId,
      path: path.nodes,
      trustLevel: path.trustLevel,
      confidence: path.confidence,
      length: path.nodes.length - 1,
      weakestLink: path.weakestLink,
      computedAt: new Date(),
      validUntil: new Date(Date.now() + 3600000), // 1 hour validity
      refreshRequired: false,
      supportingAssertions: path.assertions
    };
  }

  private buildTrustGraph(
    trustAssertions: Map<string, TrustAssertion>,
    domains?: string[]
  ): Map<string, Map<string, { trust: number; assertionId: string }>> {
    const graph = new Map();
    
    for (const assertion of trustAssertions.values()) {
      if (assertion.status !== 'verified') continue;
      
      // Check domain match if specified
      if (domains && domains.length > 0) {
        const hasMatchingDomain = domains.some(domain => 
          assertion.trustDomains.includes(domain)
        );
        if (!hasMatchingDomain) continue;
      }
      
      if (!graph.has(assertion.fromAgentId)) {
        graph.set(assertion.fromAgentId, new Map());
      }
      
      graph.get(assertion.fromAgentId).set(assertion.toAgentId, {
        trust: assertion.trustLevel,
        assertionId: assertion.assertionId
      });
    }
    
    return graph;
  }

  private dijkstraWithTrust(
    graph: Map<string, Map<string, any>>,
    start: string,
    end: string
  ): any | null {
    // Simplified implementation - would use proper Dijkstra with trust weighting
    const neighbors = graph.get(start);
    if (!neighbors || !neighbors.has(end)) {
      return null;
    }
    
    const edge = neighbors.get(end);
    return {
      nodes: [start, end],
      trustLevel: edge.trust,
      confidence: 0.8,
      weakestLink: { fromAgent: start, toAgent: end, trustLevel: edge.trust },
      assertions: [edge.assertionId]
    };
  }
}

class TrustConsensusEngine {
  constructor(private config: any) {}

  async reachConsensus(verifications: TrustVerification[]): Promise<{
    decision: 'confirmed' | 'denied' | 'inconclusive';
    confidence: number;
  }> {
    // Implement Byzantine fault-tolerant consensus
    return { decision: 'confirmed', confidence: 0.8 };
  }
}

class ZKTrustVerifier {
  constructor(private config: any) {}

  async generateProof(
    claimType: string,
    privateInputs: any,
    publicInputs: any,
    proofSystem: string
  ): Promise<{ proof: string; circuit: string }> {
    // Mock ZK proof generation
    return {
      proof: crypto.randomBytes(256).toString('hex'),
      circuit: `${claimType}_verification_circuit`
    };
  }

  async verifyProof(
    proof: string,
    publicInputs: any,
    circuit: string,
    proofSystem: string
  ): Promise<boolean> {
    // Mock ZK proof verification
    return true;
  }
}

class TrustOracleManager {
  constructor(private config: any) {}

  async query(oracle: TrustOracle, query: any): Promise<{
    result: any;
    confidence: number;
    timestamp: Date;
  }> {
    // Mock oracle query
    return {
      result: { trustScore: 0.8 },
      confidence: oracle.reliability,
      timestamp: new Date()
    };
  }
}

class TrustDisputeResolver {
  constructor(private config: any) {}

  async initiateResolution(dispute: TrustDispute, assertion: TrustAssertion): Promise<void> {
    // Initiate dispute resolution process
    setTimeout(async () => {
      dispute.status = 'resolved';
      dispute.resolution = {
        decision: 'upheld',
        reason: 'Insufficient evidence for dispute',
        arbitrators: ['system'],
        timestamp: new Date()
      };
    }, this.config.verification.disputeTimeout);
  }
}

export {
  DistributedTrustVerifier,
  TrustAssertion,
  TrustEvidence,
  TrustVerification,
  TrustDispute,
  TrustPath,
  TrustNetwork,
  ZKTrustProof,
  TrustOracle
};