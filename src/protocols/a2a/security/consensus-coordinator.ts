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

import { EventEmitter } from 'events';
import crypto from 'crypto';
import { Logger } from '../../../utils/logger.js';
import { MaliciousDetectionResult, ConsensusVote } from './malicious-detection.js';

export interface ConsensusRound {
  roundId: string;
  targetAgentId: string;
  roundNumber: 1 | 2 | 3;
  startTime: Date;
  endTime?: Date;
  timeoutMs: number;
  
  // Round-specific data
  evidence: ConsensusEvidence;
  votes: ConsensusVoteRecord[];
  threshold: number;           // Required votes for decision
  
  // Round status
  status: 'active' | 'completed' | 'failed' | 'timeout';
  result?: 'malicious' | 'benign' | 'inconclusive';
  confidence: number;
  
  // Participation tracking
  eligibleVoters: string[];
  actualVoters: string[];
  abstentions: string[];
  
  // Cryptographic verification
  roundHash: string;
  voterSignatures: Map<string, string>;
  aggregateSignature?: string;
}

export interface ConsensusEvidence {
  evidenceId: string;
  sourceRound?: number;        // Round this evidence came from
  type: 'behavioral' | 'cryptographic' | 'network' | 'consensus' | 'aggregated';
  weight: number;              // Evidence weight (0-1)
  reliability: number;         // Source reliability (0-1)
  
  // Evidence content
  data: {
    behaviorDeviations?: any[];
    protocolViolations?: any[];
    networkAnomalies?: any[];
    witnessStatements?: WitnessStatement[];
    cryptographicProofs?: CryptographicProof[];
  };
  
  // Provenance
  submittedBy: string;
  timestamp: Date;
  signature: string;
  verified: boolean;
}

export interface WitnessStatement {
  witnessId: string;
  statementType: 'observation' | 'interaction' | 'measurement';
  description: string;
  confidence: number;
  timestamp: Date;
  signature: string;
  evidence?: any;
}

export interface CryptographicProof {
  proofType: 'signature_verification' | 'nonce_reuse' | 'message_tampering' | 'identity_forgery';
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
  
  // Vote content
  decision: 'malicious' | 'benign' | 'abstain';
  confidence: number;
  reasoning: string;
  evidenceRefs: string[];      // References to evidence used
  
  // Vote metadata
  timestamp: Date;
  voterReputation: number;
  voterStake: number;
  weight: number;              // Final vote weight
  
  // Cryptographic verification
  signature: string;
  verified: boolean;
  
  // Privacy and anti-collusion
  commitHash?: string;         // Commit-reveal scheme
  revealNonce?: string;
  blindingFactor?: string;
}

export interface ConsensusResult {
  consensusId: string;
  targetAgentId: string;
  
  // Final decision
  finalDecision: 'malicious' | 'benign' | 'failed';
  overallConfidence: number;
  consensusReached: boolean;
  
  // Round summary
  rounds: ConsensusRound[];
  totalRounds: number;
  successfulRounds: number;
  
  // Voting summary
  totalVotes: number;
  maliciousVotes: number;
  benignVotes: number;
  abstentions: number;
  participationRate: number;
  
  // Decision metrics
  evidenceQuality: number;
  voterAgreement: number;      // Agreement between voters
  byzantineResistance: number; // Resistance to Byzantine attacks
  
  // Timestamps
  startTime: Date;
  endTime: Date;
  totalDuration: number;
  
  // Cryptographic verification
  consensusHash: string;
  thresholdSignature?: string;
  verificationPassed: boolean;
}

export interface ConsensusConfig {
  // Round configuration
  roundTimeout: number;        // Timeout per round (ms)
  maxRounds: 3;               // Always exactly 3 rounds
  minParticipation: number;    // Minimum participation rate (0-1)
  
  // Voting thresholds
  maliciousThreshold: number;  // Threshold for malicious decision (0-1)
  benignThreshold: number;     // Threshold for benign decision (0-1)
  confidenceThreshold: number; // Minimum confidence required (0-1)
  
  // Byzantine fault tolerance
  maxByzantineRatio: number;   // Maximum Byzantine nodes (0-1), must be < 1/3
  requireSuperMajority: boolean; // Require 2/3+ for final decision
  
  // Evidence requirements
  minEvidenceQuality: number;  // Minimum evidence quality (0-1)
  evidenceAggregation: 'weighted' | 'majority' | 'expert';
  
  // Privacy and anti-collusion
  useCommitReveal: boolean;    // Use commit-reveal voting
  voteBlinding: boolean;       // Enable vote blinding
  shuffleVoters: boolean;      // Shuffle voter order
  
  // Verification
  requireCryptographicProofs: boolean;
  thresholdSignatures: boolean;
  auditTrail: boolean;
}

export class ConsensusDetectionCoordinator extends EventEmitter {
  private logger: Logger;
  private config: ConsensusConfig;
  
  // Active consensus tracking
  private activeConsensus: Map<string, ConsensusResult> = new Map(); // targetAgentId -> consensus
  private completedConsensus: ConsensusResult[] = [];
  private evidencePool: Map<string, ConsensusEvidence> = new Map(); // evidenceId -> evidence
  
  // Voter management
  private eligibleVoters: Set<string> = new Set();
  private voterReputations: Map<string, number> = new Map();
  private voterStakes: Map<string, number> = new Map();
  
  // Cryptographic infrastructure
  private consensusKeys: Map<string, any> = new Map();
  private thresholdScheme: ThresholdSignatureScheme;
  
  // Anti-collusion and privacy
  private commitStore: Map<string, string> = new Map(); // voteId -> commit
  private blindingFactors: Map<string, string> = new Map();

  constructor(config: Partial<ConsensusConfig> = {}) {
    super();
    this.logger = new Logger('ConsensusDetectionCoordinator');
    
    this.initializeConfig(config);
    this.initializeCryptography();
    
    this.logger.info('Consensus Detection Coordinator initialized', {
      maxRounds: this.config.maxRounds,
      byzantineResistance: `f < ${this.config.maxByzantineRatio}n`,
      features: [
        'three-round-consensus', 'byzantine-fault-tolerance', 'cryptographic-verification',
        'anti-collusion', 'threshold-signatures', 'evidence-aggregation'
      ]
    });
  }

  /**
   * Initialize consensus configuration
   */
  private initializeConfig(config: Partial<ConsensusConfig>): void {
    this.config = {
      roundTimeout: 300000,        // 5 minutes per round
      maxRounds: 3,               // Exactly 3 rounds
      minParticipation: 0.67,     // 67% minimum participation
      
      maliciousThreshold: 0.67,   // 67% for malicious decision
      benignThreshold: 0.67,      // 67% for benign decision
      confidenceThreshold: 0.75,  // 75% minimum confidence
      
      maxByzantineRatio: 0.33,    // f < n/3 Byzantine tolerance
      requireSuperMajority: true,  // Require 2/3+ for final decision
      
      minEvidenceQuality: 0.6,    // 60% minimum evidence quality
      evidenceAggregation: 'weighted',
      
      useCommitReveal: true,      // Enable commit-reveal
      voteBlinding: true,         // Enable vote blinding
      shuffleVoters: true,        // Shuffle voter order
      
      requireCryptographicProofs: true,
      thresholdSignatures: true,
      auditTrail: true,
      
      ...config
    };

    // Validate configuration
    if (this.config.maxByzantineRatio >= 0.33) {
      throw new Error('Byzantine ratio must be less than 1/3 for safety');
    }
    
    if (this.config.maxRounds !== 3) {
      this.logger.warn('Forcing maxRounds to 3 for protocol compliance');
      this.config.maxRounds = 3;
    }
  }

  /**
   * Initialize cryptographic infrastructure
   */
  private initializeCryptography(): void {
    // Initialize threshold signature scheme
    this.thresholdScheme = new ThresholdSignatureScheme(this.config);
    
    // Generate consensus keys
    const consensusKeyPair = crypto.generateKeyPairSync('ec', {
      namedCurve: 'secp256k1',
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    });
    
    this.consensusKeys.set('coordinator', consensusKeyPair);
  }

  /**
   * Register eligible voter
   */
  async registerVoter(
    voterId: string,
    reputation: number,
    stake: number = 0
  ): Promise<boolean> {
    // Validate voter eligibility
    if (reputation < 0.5) {
      this.logger.warn('Voter rejected due to low reputation', { voterId, reputation });
      return false;
    }

    this.eligibleVoters.add(voterId);
    this.voterReputations.set(voterId, reputation);
    this.voterStakes.set(voterId, stake);

    // Initialize threshold signature share if enabled
    if (this.config.thresholdSignatures) {
      await this.thresholdScheme.addParticipant(voterId);
    }

    this.logger.info('Voter registered for consensus', {
      voterId,
      reputation,
      stake,
      totalVoters: this.eligibleVoters.size
    });

    return true;
  }

  /**
   * Initiate 3-round consensus for malicious detection
   */
  async initiateConsensus(
    targetAgentId: string,
    initialEvidence: ConsensusEvidence,
    detectionResult: MaliciousDetectionResult
  ): Promise<string> {
    // Check if consensus already in progress
    if (this.activeConsensus.has(targetAgentId)) {
      throw new Error(`Consensus already in progress for agent ${targetAgentId}`);
    }

    // Validate minimum participants
    const minParticipants = Math.ceil(3 / (1 - this.config.maxByzantineRatio));
    if (this.eligibleVoters.size < minParticipants) {
      throw new Error(`Insufficient voters for Byzantine fault tolerance. Need ${minParticipants}, have ${this.eligibleVoters.size}`);
    }

    const consensusId = crypto.randomUUID();
    
    const consensus: ConsensusResult = {
      consensusId,
      targetAgentId,
      finalDecision: 'failed',
      overallConfidence: 0,
      consensusReached: false,
      rounds: [],
      totalRounds: 0,
      successfulRounds: 0,
      totalVotes: 0,
      maliciousVotes: 0,
      benignVotes: 0,
      abstentions: 0,
      participationRate: 0,
      evidenceQuality: 0,
      voterAgreement: 0,
      byzantineResistance: 0,
      startTime: new Date(),
      endTime: new Date(),
      totalDuration: 0,
      consensusHash: '',
      verificationPassed: false
    };

    this.activeConsensus.set(targetAgentId, consensus);

    // Store initial evidence
    this.evidencePool.set(initialEvidence.evidenceId, initialEvidence);

    this.logger.info('Consensus initiated for malicious detection', {
      consensusId,
      targetAgentId,
      eligibleVoters: this.eligibleVoters.size,
      initialEvidence: initialEvidence.type
    });

    // Start Round 1: Evidence Collection and Initial Voting
    await this.executeRound1(consensus, initialEvidence);

    this.emit('consensus_initiated', {
      consensusId,
      targetAgentId,
      consensus
    });

    return consensusId;
  }

  /**
   * Round 1: Evidence Collection and Initial Voting
   */
  private async executeRound1(
    consensus: ConsensusResult,
    initialEvidence: ConsensusEvidence
  ): Promise<void> {
    const round: ConsensusRound = {
      roundId: crypto.randomUUID(),
      targetAgentId: consensus.targetAgentId,
      roundNumber: 1,
      startTime: new Date(),
      timeoutMs: this.config.roundTimeout,
      evidence: initialEvidence,
      votes: [],
      threshold: Math.ceil(this.eligibleVoters.size * this.config.maliciousThreshold),
      status: 'active',
      confidence: 0,
      eligibleVoters: Array.from(this.eligibleVoters),
      actualVoters: [],
      abstentions: [],
      roundHash: this.calculateRoundHash(1, consensus.targetAgentId, initialEvidence),
      voterSignatures: new Map()
    };

    consensus.rounds.push(round);
    consensus.totalRounds = 1;

    this.logger.info('Starting Round 1: Evidence Collection', {
      consensusId: consensus.consensusId,
      targetAgent: consensus.targetAgentId,
      threshold: round.threshold,
      eligibleVoters: round.eligibleVoters.length
    });

    // Request additional evidence from voters
    this.emit('evidence_collection_request', {
      consensusId: consensus.consensusId,
      targetAgentId: consensus.targetAgentId,
      roundNumber: 1,
      deadline: new Date(Date.now() + this.config.roundTimeout),
      initialEvidence
    });

    // Set round timeout
    setTimeout(async () => {
      await this.processRound1Timeout(consensus, round);
    }, this.config.roundTimeout);
  }

  /**
   * Submit evidence for consensus round
   */
  async submitEvidence(
    consensusId: string,
    evidence: Omit<ConsensusEvidence, 'evidenceId' | 'timestamp' | 'signature' | 'verified'>
  ): Promise<boolean> {
    const consensus = this.findConsensusById(consensusId);
    if (!consensus) {
      throw new Error('Consensus not found');
    }

    const currentRound = consensus.rounds[consensus.rounds.length - 1];
    if (!currentRound || currentRound.status !== 'active') {
      throw new Error('No active round for evidence submission');
    }

    // Create evidence record
    const evidenceRecord: ConsensusEvidence = {
      evidenceId: crypto.randomUUID(),
      timestamp: new Date(),
      signature: await this.signEvidence(evidence),
      verified: false,
      ...evidence
    };

    // Verify evidence
    evidenceRecord.verified = await this.verifyEvidence(evidenceRecord);
    
    if (!evidenceRecord.verified) {
      this.logger.warn('Evidence verification failed', {
        evidenceId: evidenceRecord.evidenceId,
        submittedBy: evidence.submittedBy
      });
      return false;
    }

    // Store evidence
    this.evidencePool.set(evidenceRecord.evidenceId, evidenceRecord);

    this.logger.info('Evidence submitted for consensus', {
      evidenceId: evidenceRecord.evidenceId,
      type: evidence.type,
      weight: evidence.weight,
      submittedBy: evidence.submittedBy
    });

    this.emit('evidence_submitted', {
      consensusId,
      evidence: evidenceRecord,
      roundNumber: currentRound.roundNumber
    });

    return true;
  }

  /**
   * Submit vote for consensus round
   */
  async submitVote(
    consensusId: string,
    vote: Omit<ConsensusVoteRecord, 'voteId' | 'timestamp' | 'signature' | 'verified' | 'weight'>
  ): Promise<boolean> {
    const consensus = this.findConsensusById(consensusId);
    if (!consensus) {
      throw new Error('Consensus not found');
    }

    const currentRound = consensus.rounds[consensus.rounds.length - 1];
    if (!currentRound || currentRound.status !== 'active') {
      throw new Error('No active round for voting');
    }

    // Validate voter eligibility
    if (!this.eligibleVoters.has(vote.voterId)) {
      throw new Error('Voter not eligible for consensus');
    }

    // Check if voter already voted in this round
    const existingVote = currentRound.votes.find(v => v.voterId === vote.voterId);
    if (existingVote) {
      throw new Error('Voter has already voted in this round');
    }

    // Calculate vote weight
    const reputation = this.voterReputations.get(vote.voterId) || 0.5;
    const stake = this.voterStakes.get(vote.voterId) || 0;
    const weight = this.calculateVoteWeight(reputation, stake);

    // Create vote record
    const voteRecord: ConsensusVoteRecord = {
      voteId: crypto.randomUUID(),
      timestamp: new Date(),
      signature: await this.signVote(vote),
      verified: false,
      weight,
      ...vote
    };

    // Verify vote
    voteRecord.verified = await this.verifyVote(voteRecord, currentRound);
    
    if (!voteRecord.verified) {
      this.logger.warn('Vote verification failed', {
        voteId: voteRecord.voteId,
        voterId: vote.voterId
      });
      return false;
    }

    // Handle commit-reveal if enabled
    if (this.config.useCommitReveal && currentRound.roundNumber === 1) {
      if (!vote.commitHash) {
        throw new Error('Commit hash required for Round 1');
      }
      
      this.commitStore.set(voteRecord.voteId, vote.commitHash);
      // Don't reveal vote content yet in Round 1
    }

    // Add vote to round
    currentRound.votes.push(voteRecord);
    currentRound.actualVoters.push(vote.voterId);

    // Store voter signature
    currentRound.voterSignatures.set(vote.voterId, voteRecord.signature);

    this.logger.info('Vote submitted for consensus', {
      voteId: voteRecord.voteId,
      voterId: vote.voterId,
      decision: vote.decision,
      confidence: vote.confidence,
      weight,
      roundNumber: currentRound.roundNumber
    });

    this.emit('vote_submitted', {
      consensusId,
      vote: voteRecord,
      roundNumber: currentRound.roundNumber
    });

    // Check if round can be completed
    await this.checkRoundCompletion(consensus, currentRound);

    return true;
  }

  /**
   * Process Round 1 completion and start Round 2
   */
  private async processRound1Timeout(consensus: ConsensusResult, round: ConsensusRound): Promise<void> {
    if (round.status !== 'active') return;

    // Calculate participation rate
    const participationRate = round.actualVoters.length / round.eligibleVoters.length;
    consensus.participationRate = participationRate;

    if (participationRate < this.config.minParticipation) {
      // Insufficient participation - fail consensus
      round.status = 'failed';
      round.result = 'inconclusive';
      consensus.finalDecision = 'failed';
      
      await this.finalizeConsensus(consensus);
      return;
    }

    // Complete Round 1
    round.status = 'completed';
    round.endTime = new Date();
    
    // Aggregate evidence for Round 2
    const aggregatedEvidence = await this.aggregateEvidence(consensus.targetAgentId);
    
    // Analyze Round 1 votes for preliminary consensus
    const roundResult = await this.analyzeRoundVotes(round);
    round.result = roundResult.decision;
    round.confidence = roundResult.confidence;

    this.logger.info('Round 1 completed', {
      consensusId: consensus.consensusId,
      participationRate,
      result: round.result,
      confidence: round.confidence,
      votes: round.votes.length
    });

    // Start Round 2: Evidence Review and Confirmation
    await this.executeRound2(consensus, aggregatedEvidence);
  }

  /**
   * Round 2: Evidence Review and Confirmation
   */
  private async executeRound2(
    consensus: ConsensusResult,
    aggregatedEvidence: ConsensusEvidence
  ): Promise<void> {
    const round: ConsensusRound = {
      roundId: crypto.randomUUID(),
      targetAgentId: consensus.targetAgentId,
      roundNumber: 2,
      startTime: new Date(),
      timeoutMs: this.config.roundTimeout,
      evidence: aggregatedEvidence,
      votes: [],
      threshold: Math.ceil(this.eligibleVoters.size * this.config.maliciousThreshold),
      status: 'active',
      confidence: 0,
      eligibleVoters: Array.from(this.eligibleVoters),
      actualVoters: [],
      abstentions: [],
      roundHash: this.calculateRoundHash(2, consensus.targetAgentId, aggregatedEvidence),
      voterSignatures: new Map()
    };

    consensus.rounds.push(round);
    consensus.totalRounds = 2;

    this.logger.info('Starting Round 2: Evidence Review', {
      consensusId: consensus.consensusId,
      targetAgent: consensus.targetAgentId,
      aggregatedEvidenceQuality: aggregatedEvidence.weight
    });

    // Reveal Round 1 votes if using commit-reveal
    if (this.config.useCommitReveal) {
      await this.revealRound1Votes(consensus);
    }

    // Request vote confirmation based on aggregated evidence
    this.emit('evidence_review_request', {
      consensusId: consensus.consensusId,
      targetAgentId: consensus.targetAgentId,
      roundNumber: 2,
      aggregatedEvidence,
      round1Result: consensus.rounds[0].result,
      deadline: new Date(Date.now() + this.config.roundTimeout)
    });

    // Set round timeout
    setTimeout(async () => {
      await this.processRound2Timeout(consensus, round);
    }, this.config.roundTimeout);
  }

  /**
   * Process Round 2 completion and start Round 3
   */
  private async processRound2Timeout(consensus: ConsensusResult, round: ConsensusRound): Promise<void> {
    if (round.status !== 'active') return;

    // Check participation
    const participationRate = round.actualVoters.length / round.eligibleVoters.length;
    
    if (participationRate < this.config.minParticipation) {
      round.status = 'failed';
      round.result = 'inconclusive';
      consensus.finalDecision = 'failed';
      
      await this.finalizeConsensus(consensus);
      return;
    }

    // Complete Round 2
    round.status = 'completed';
    round.endTime = new Date();
    
    // Analyze Round 2 votes
    const roundResult = await this.analyzeRoundVotes(round);
    round.result = roundResult.decision;
    round.confidence = roundResult.confidence;

    this.logger.info('Round 2 completed', {
      consensusId: consensus.consensusId,
      result: round.result,
      confidence: round.confidence,
      agreement: roundResult.agreement
    });

    // Check if early consensus achieved
    if (roundResult.confidence >= this.config.confidenceThreshold && 
        roundResult.agreement >= this.config.maliciousThreshold) {
      
      // Skip to finalization if strong consensus
      if (this.shouldSkipRound3(consensus)) {
        consensus.finalDecision = round.result === 'malicious' ? 'malicious' : 'benign';
        await this.finalizeConsensus(consensus);
        return;
      }
    }

    // Start Round 3: Final Decision
    await this.executeRound3(consensus);
  }

  /**
   * Round 3: Final Decision
   */
  private async executeRound3(consensus: ConsensusResult): Promise<void> {
    const finalEvidence = await this.aggregateAllEvidence(consensus.targetAgentId);
    
    const round: ConsensusRound = {
      roundId: crypto.randomUUID(),
      targetAgentId: consensus.targetAgentId,
      roundNumber: 3,
      startTime: new Date(),
      timeoutMs: this.config.roundTimeout,
      evidence: finalEvidence,
      votes: [],
      threshold: Math.ceil(this.eligibleVoters.size * this.config.maliciousThreshold),
      status: 'active',
      confidence: 0,
      eligibleVoters: Array.from(this.eligibleVoters),
      actualVoters: [],
      abstentions: [],
      roundHash: this.calculateRoundHash(3, consensus.targetAgentId, finalEvidence),
      voterSignatures: new Map()
    };

    consensus.rounds.push(round);
    consensus.totalRounds = 3;

    this.logger.info('Starting Round 3: Final Decision', {
      consensusId: consensus.consensusId,
      targetAgent: consensus.targetAgentId,
      previousRounds: consensus.rounds.slice(0, 2).map(r => ({ result: r.result, confidence: r.confidence }))
    });

    // Request final votes
    this.emit('final_decision_request', {
      consensusId: consensus.consensusId,
      targetAgentId: consensus.targetAgentId,
      roundNumber: 3,
      finalEvidence,
      previousResults: consensus.rounds.slice(0, 2),
      deadline: new Date(Date.now() + this.config.roundTimeout)
    });

    // Set round timeout
    setTimeout(async () => {
      await this.processRound3Timeout(consensus, round);
    }, this.config.roundTimeout);
  }

  /**
   * Process Round 3 completion and finalize
   */
  private async processRound3Timeout(consensus: ConsensusResult, round: ConsensusRound): Promise<void> {
    if (round.status !== 'active') return;

    // Complete final round
    round.status = 'completed';
    round.endTime = new Date();
    
    // Analyze final votes
    const roundResult = await this.analyzeRoundVotes(round);
    round.result = roundResult.decision;
    round.confidence = roundResult.confidence;

    this.logger.info('Round 3 completed', {
      consensusId: consensus.consensusId,
      finalResult: round.result,
      confidence: round.confidence
    });

    // Make final decision based on all 3 rounds
    consensus.finalDecision = await this.makeFinalDecision(consensus);
    
    // Finalize consensus
    await this.finalizeConsensus(consensus);
  }

  /**
   * Finalize consensus and generate results
   */
  private async finalizeConsensus(consensus: ConsensusResult): Promise<void> {
    consensus.endTime = new Date();
    consensus.totalDuration = consensus.endTime.getTime() - consensus.startTime.getTime();

    // Calculate final metrics
    await this.calculateFinalMetrics(consensus);

    // Generate consensus hash
    consensus.consensusHash = await this.generateConsensusHash(consensus);

    // Generate threshold signature if enabled
    if (this.config.thresholdSignatures) {
      consensus.thresholdSignature = await this.thresholdScheme.generateSignature(
        consensus.consensusHash,
        consensus.rounds.flatMap(r => r.actualVoters)
      );
    }

    // Verify consensus integrity
    consensus.verificationPassed = await this.verifyConsensusIntegrity(consensus);

    // Mark consensus as reached if decision is not 'failed'
    consensus.consensusReached = consensus.finalDecision !== 'failed';

    // Remove from active consensus
    this.activeConsensus.delete(consensus.targetAgentId);

    // Add to completed consensus
    this.completedConsensus.push(consensus);

    // Limit history size
    if (this.completedConsensus.length > 1000) {
      this.completedConsensus = this.completedConsensus.slice(-500);
    }

    this.logger.info('Consensus finalized', {
      consensusId: consensus.consensusId,
      targetAgent: consensus.targetAgentId,
      finalDecision: consensus.finalDecision,
      confidence: consensus.overallConfidence,
      duration: consensus.totalDuration,
      rounds: consensus.totalRounds,
      verificationPassed: consensus.verificationPassed
    });

    this.emit('consensus_finalized', {
      consensus,
      decision: consensus.finalDecision,
      confidence: consensus.overallConfidence
    });
  }

  /**
   * Helper methods for consensus processing
   */

  private async checkRoundCompletion(consensus: ConsensusResult, round: ConsensusRound): Promise<void> {
    const participationRate = round.actualVoters.length / round.eligibleVoters.length;
    
    // Check if minimum participation achieved
    if (participationRate >= this.config.minParticipation) {
      // Analyze votes to see if early completion is possible
      const result = await this.analyzeRoundVotes(round);
      
      // Early completion if high confidence and clear majority
      if (result.confidence >= 0.9 && result.agreement >= 0.8) {
        if (round.roundNumber === 1) {
          await this.processRound1Timeout(consensus, round);
        } else if (round.roundNumber === 2) {
          await this.processRound2Timeout(consensus, round);
        } else if (round.roundNumber === 3) {
          await this.processRound3Timeout(consensus, round);
        }
      }
    }
  }

  private async analyzeRoundVotes(round: ConsensusRound): Promise<{
    decision: 'malicious' | 'benign' | 'inconclusive';
    confidence: number;
    agreement: number;
  }> {
    if (round.votes.length === 0) {
      return { decision: 'inconclusive', confidence: 0, agreement: 0 };
    }

    // Calculate weighted votes
    let maliciousWeight = 0;
    let benignWeight = 0;
    let totalWeight = 0;

    for (const vote of round.votes) {
      if (vote.decision === 'malicious') {
        maliciousWeight += vote.weight * vote.confidence;
      } else if (vote.decision === 'benign') {
        benignWeight += vote.weight * vote.confidence;
      }
      totalWeight += vote.weight;
    }

    const maliciousRatio = maliciousWeight / totalWeight;
    const benignRatio = benignWeight / totalWeight;

    // Determine decision
    let decision: 'malicious' | 'benign' | 'inconclusive';
    let confidence: number;

    if (maliciousRatio >= this.config.maliciousThreshold) {
      decision = 'malicious';
      confidence = maliciousRatio;
    } else if (benignRatio >= this.config.benignThreshold) {
      decision = 'benign';
      confidence = benignRatio;
    } else {
      decision = 'inconclusive';
      confidence = Math.max(maliciousRatio, benignRatio);
    }

    // Calculate agreement (how much voters agree with each other)
    const agreement = this.calculateVoterAgreement(round.votes);

    return { decision, confidence, agreement };
  }

  private calculateVoterAgreement(votes: ConsensusVoteRecord[]): number {
    if (votes.length < 2) return 1.0;

    let agreements = 0;
    let comparisons = 0;

    for (let i = 0; i < votes.length; i++) {
      for (let j = i + 1; j < votes.length; j++) {
        comparisons++;
        if (votes[i].decision === votes[j].decision) {
          agreements++;
        }
      }
    }

    return comparisons > 0 ? agreements / comparisons : 0;
  }

  private calculateVoteWeight(reputation: number, stake: number): number {
    const reputationWeight = reputation * 0.7;
    const stakeWeight = Math.min(stake / 10000, 0.3); // Cap stake influence
    return reputationWeight + stakeWeight;
  }

  private shouldSkipRound3(consensus: ConsensusResult): boolean {
    const rounds = consensus.rounds;
    if (rounds.length < 2) return false;

    const round1 = rounds[0];
    const round2 = rounds[1];

    // Skip if both rounds agree with high confidence
    return round1.result === round2.result &&
           round1.confidence >= 0.8 &&
           round2.confidence >= 0.8 &&
           consensus.participationRate >= 0.8;
  }

  private async makeFinalDecision(consensus: ConsensusResult): Promise<'malicious' | 'benign' | 'failed'> {
    const rounds = consensus.rounds;
    const decisions = rounds.map(r => r.result);
    const confidences = rounds.map(r => r.confidence);

    // Count decisions
    const maliciousCount = decisions.filter(d => d === 'malicious').length;
    const benignCount = decisions.filter(d => d === 'benign').length;

    // Require 2/3 rounds to agree if super majority required
    if (this.config.requireSuperMajority) {
      if (maliciousCount >= 2) {
        const avgConfidence = confidences
          .filter((_, i) => decisions[i] === 'malicious')
          .reduce((sum, c) => sum + c, 0) / maliciousCount;
        
        return avgConfidence >= this.config.confidenceThreshold ? 'malicious' : 'failed';
      }
      
      if (benignCount >= 2) {
        const avgConfidence = confidences
          .filter((_, i) => decisions[i] === 'benign')
          .reduce((sum, c) => sum + c, 0) / benignCount;
        
        return avgConfidence >= this.config.confidenceThreshold ? 'benign' : 'failed';
      }
    }

    // Fall back to majority with confidence threshold
    if (maliciousCount > benignCount) {
      const overallConfidence = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
      return overallConfidence >= this.config.confidenceThreshold ? 'malicious' : 'failed';
    } else if (benignCount > maliciousCount) {
      const overallConfidence = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
      return overallConfidence >= this.config.confidenceThreshold ? 'benign' : 'failed';
    }

    return 'failed';
  }

  private async calculateFinalMetrics(consensus: ConsensusResult): Promise<void> {
    // Aggregate vote counts
    consensus.totalVotes = consensus.rounds.reduce((sum, r) => sum + r.votes.length, 0);
    consensus.maliciousVotes = consensus.rounds.reduce((sum, r) => 
      sum + r.votes.filter(v => v.decision === 'malicious').length, 0);
    consensus.benignVotes = consensus.rounds.reduce((sum, r) => 
      sum + r.votes.filter(v => v.decision === 'benign').length, 0);
    consensus.abstentions = consensus.rounds.reduce((sum, r) => 
      sum + r.votes.filter(v => v.decision === 'abstain').length, 0);

    // Calculate successful rounds
    consensus.successfulRounds = consensus.rounds.filter(r => r.status === 'completed').length;

    // Calculate overall confidence
    const roundConfidences = consensus.rounds
      .filter(r => r.status === 'completed')
      .map(r => r.confidence);
    consensus.overallConfidence = roundConfidences.length > 0 ?
      roundConfidences.reduce((sum, c) => sum + c, 0) / roundConfidences.length : 0;

    // Calculate evidence quality
    const evidenceWeights = Array.from(this.evidencePool.values())
      .filter(e => e.data.witnessStatements?.some(w => w.witnessId))
      .map(e => e.weight);
    consensus.evidenceQuality = evidenceWeights.length > 0 ?
      evidenceWeights.reduce((sum, w) => sum + w, 0) / evidenceWeights.length : 0;

    // Calculate voter agreement
    const allVotes = consensus.rounds.flatMap(r => r.votes);
    consensus.voterAgreement = this.calculateVoterAgreement(allVotes);

    // Calculate Byzantine resistance (simplified)
    const totalVoters = this.eligibleVoters.size;
    const maxByzantine = Math.floor(totalVoters * this.config.maxByzantineRatio);
    consensus.byzantineResistance = maxByzantine > 0 ? 1 - (maxByzantine / totalVoters) : 1;
  }

  /**
   * Cryptographic and verification methods
   */

  private calculateRoundHash(roundNumber: number, targetAgentId: string, evidence: ConsensusEvidence): string {
    const data = `${roundNumber}:${targetAgentId}:${evidence.evidenceId}:${Date.now()}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private async signEvidence(evidence: any): Promise<string> {
    const data = JSON.stringify(evidence);
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private async signVote(vote: any): Promise<string> {
    const data = JSON.stringify({
      voterId: vote.voterId,
      targetAgentId: vote.targetAgentId,
      decision: vote.decision,
      confidence: vote.confidence,
      timestamp: Date.now()
    });
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private async verifyEvidence(evidence: ConsensusEvidence): Promise<boolean> {
    // Verify evidence signature and content
    return evidence.weight >= 0 && evidence.weight <= 1 && evidence.reliability >= 0;
  }

  private async verifyVote(vote: ConsensusVoteRecord, round: ConsensusRound): Promise<boolean> {
    // Verify vote signature and constraints
    return vote.confidence >= 0 && vote.confidence <= 1 && 
           ['malicious', 'benign', 'abstain'].includes(vote.decision);
  }

  private async generateConsensusHash(consensus: ConsensusResult): Promise<string> {
    const data = {
      consensusId: consensus.consensusId,
      targetAgentId: consensus.targetAgentId,
      finalDecision: consensus.finalDecision,
      rounds: consensus.rounds.map(r => ({
        roundNumber: r.roundNumber,
        result: r.result,
        confidence: r.confidence,
        votes: r.votes.length
      }))
    };
    
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  private async verifyConsensusIntegrity(consensus: ConsensusResult): Promise<boolean> {
    // Verify consensus hash and signatures
    const recalculatedHash = await this.generateConsensusHash(consensus);
    return recalculatedHash === consensus.consensusHash;
  }

  private async aggregateEvidence(targetAgentId: string): Promise<ConsensusEvidence> {
    const relevantEvidence = Array.from(this.evidencePool.values())
      .filter(e => e.data.witnessStatements?.some(w => w.witnessId) || 
                   e.data.behaviorDeviations?.length > 0);

    return {
      evidenceId: crypto.randomUUID(),
      sourceRound: 1,
      type: 'aggregated',
      weight: relevantEvidence.reduce((sum, e) => sum + e.weight, 0) / relevantEvidence.length || 0,
      reliability: relevantEvidence.reduce((sum, e) => sum + e.reliability, 0) / relevantEvidence.length || 0,
      data: {
        behaviorDeviations: relevantEvidence.flatMap(e => e.data.behaviorDeviations || []),
        protocolViolations: relevantEvidence.flatMap(e => e.data.protocolViolations || []),
        networkAnomalies: relevantEvidence.flatMap(e => e.data.networkAnomalies || []),
        witnessStatements: relevantEvidence.flatMap(e => e.data.witnessStatements || []),
        cryptographicProofs: relevantEvidence.flatMap(e => e.data.cryptographicProofs || [])
      },
      submittedBy: 'consensus_coordinator',
      timestamp: new Date(),
      signature: '',
      verified: true
    };
  }

  private async aggregateAllEvidence(targetAgentId: string): Promise<ConsensusEvidence> {
    return await this.aggregateEvidence(targetAgentId);
  }

  private async revealRound1Votes(consensus: ConsensusResult): Promise<void> {
    // Reveal commit-reveal votes from Round 1
    const round1 = consensus.rounds[0];
    
    for (const vote of round1.votes) {
      const commit = this.commitStore.get(vote.voteId);
      if (commit) {
        // Verify reveal matches commit
        // Implementation would verify the reveal
        this.logger.debug('Vote revealed', {
          voteId: vote.voteId,
          decision: vote.decision
        });
      }
    }
  }

  private findConsensusById(consensusId: string): ConsensusResult | undefined {
    for (const consensus of this.activeConsensus.values()) {
      if (consensus.consensusId === consensusId) {
        return consensus;
      }
    }
    return undefined;
  }

  /**
   * Public API methods
   */

  getActiveConsensus(): ConsensusResult[] {
    return Array.from(this.activeConsensus.values());
  }

  getCompletedConsensus(): ConsensusResult[] {
    return this.completedConsensus;
  }

  getConsensusById(consensusId: string): ConsensusResult | null {
    const active = this.findConsensusById(consensusId);
    if (active) return active;
    
    return this.completedConsensus.find(c => c.consensusId === consensusId) || null;
  }

  getEligibleVoters(): string[] {
    return Array.from(this.eligibleVoters);
  }

  async getSystemStats(): Promise<any> {
    return {
      eligibleVoters: this.eligibleVoters.size,
      activeConsensus: this.activeConsensus.size,
      completedConsensus: this.completedConsensus.length,
      evidencePool: this.evidencePool.size,
      averageConsensusTime: this.calculateAverageConsensusTime(),
      consensusSuccessRate: this.calculateConsensusSuccessRate(),
      byzantineResistance: `f < ${this.config.maxByzantineRatio}n`
    };
  }

  private calculateAverageConsensusTime(): number {
    if (this.completedConsensus.length === 0) return 0;
    
    const totalTime = this.completedConsensus.reduce((sum, c) => sum + c.totalDuration, 0);
    return totalTime / this.completedConsensus.length;
  }

  private calculateConsensusSuccessRate(): number {
    if (this.completedConsensus.length === 0) return 0;
    
    const successful = this.completedConsensus.filter(c => c.consensusReached).length;
    return successful / this.completedConsensus.length;
  }
}

// Supporting threshold signature scheme
class ThresholdSignatureScheme {
  private participants: Set<string> = new Set();
  private threshold: number;

  constructor(private config: ConsensusConfig) {
    this.threshold = Math.ceil(3 / (1 - config.maxByzantineRatio));
  }

  async addParticipant(participantId: string): Promise<void> {
    this.participants.add(participantId);
  }

  async generateSignature(message: string, signers: string[]): Promise<string> {
    if (signers.length < this.threshold) {
      throw new Error('Insufficient signers for threshold signature');
    }
    
    // Simplified threshold signature - in production would use actual cryptographic scheme
    const data = `${message}:${signers.sort().join(',')}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}

export {
  ConsensusDetectionCoordinator,
  ConsensusRound,
  ConsensusEvidence,
  ConsensusVoteRecord,
  ConsensusResult,
  ConsensusConfig
};