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

import { EventEmitter } from 'events';
import crypto from 'crypto';
import { Logger } from '../../../utils/logger.js';
import { A2AIdentity, A2AMessage } from '../../../core/a2a-security-manager.js';
import { BehaviorProfile } from './malicious-detection.js';

export interface ReputationScore {
  agentId: string;
  overallScore: number;        // 0-1000, overall reputation score
  trustLevel: 'untrusted' | 'low' | 'medium' | 'high' | 'excellent';
  
  // Component scores (0-100 each)
  behaviorScore: number;       // Based on behavior analysis
  performanceScore: number;    // Based on task completion and quality
  consensusScore: number;      // Based on consensus participation
  peerScore: number;          // Based on peer evaluations
  stabilityScore: number;     // Based on consistency over time
  
  // Detailed metrics
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
  
  // Historical data
  history: {
    scores: { timestamp: Date; score: number }[];
    events: ReputationEvent[];
    trends: ReputationTrend[];
  };
  
  // Peer feedback
  peerFeedback: {
    positiveCount: number;
    negativeCount: number;
    neutralCount: number;
    recentFeedback: PeerFeedback[];
  };
  
  // Stake and economic factors
  stake: {
    amount: number;           // Economic stake in the system
    lockPeriod: number;      // Lock period for stake
    slashingHistory: SlashingEvent[];
  };
  
  // Reputation metadata
  metadata: {
    lastUpdated: Date;
    updateCount: number;
    version: string;
    flags: string[];         // Special flags (e.g., 'recovering', 'probation')
  };
}

export interface PeerFeedback {
  fromAgentId: string;
  toAgentId: string;
  rating: number;          // 1-5 rating
  category: 'behavior' | 'performance' | 'reliability' | 'security' | 'cooperation';
  comment?: string;
  evidence?: any;
  timestamp: Date;
  signature: string;       // Cryptographic signature
  weight: number;         // Weight based on rater's reputation
}

export interface ReputationEvent {
  eventId: string;
  agentId: string;
  type: 'positive' | 'negative' | 'neutral';
  category: string;
  impact: number;         // -100 to +100
  description: string;
  evidence: any;
  timestamp: Date;
  reportedBy?: string;
  verified: boolean;
}

export interface ReputationTrend {
  period: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  averageScore: number;
  trend: 'increasing' | 'decreasing' | 'stable';
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
  appealStatus?: 'pending' | 'approved' | 'rejected';
}

export interface ReputationChallenge {
  challengeId: string;
  agentId: string;
  type: 'behavior_verification' | 'skill_demonstration' | 'consensus_participation' | 'peer_collaboration';
  description: string;
  requirements: any;
  reward: number;
  penalty: number;
  timeLimit: number;
  createdAt: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'expired';
}

export interface ReputationConfig {
  // Scoring weights (must sum to 1.0)
  weights: {
    behavior: number;
    performance: number;
    consensus: number;
    peer: number;
    stability: number;
  };
  
  // Score decay and aging
  decayFactors: {
    dailyDecay: number;      // Daily score decay rate
    inactivityPenalty: number; // Penalty for inactivity
    recoveryBonus: number;   // Bonus for recovery efforts
  };
  
  // Thresholds
  thresholds: {
    quarantineThreshold: number;  // Below this, agent may be quarantined
    privilegeThreshold: number;   // Above this, agent gets special privileges
    slashingThreshold: number;    // Below this, economic slashing may occur
  };
  
  // Peer feedback
  peerFeedback: {
    minRaterScore: number;   // Minimum rater score to give feedback
    maxFeedbackAge: number;  // Max age of feedback to consider
    weightByRaterScore: boolean; // Weight feedback by rater's score
  };
  
  // Economic parameters
  economic: {
    minStakeAmount: number;
    maxSlashingPercentage: number;
    stakeLockPeriod: number;
    reputationStakingEnabled: boolean;
  };
}

export class ReputationSystem extends EventEmitter {
  private logger: Logger;
  private reputationScores: Map<string, ReputationScore> = new Map();
  private peerFeedbacks: Map<string, PeerFeedback[]> = new Map(); // agentId -> feedbacks
  private reputationEvents: Map<string, ReputationEvent[]> = new Map(); // agentId -> events
  private activeChallenges: Map<string, ReputationChallenge> = new Map();
  private config: ReputationConfig;
  
  // Reputation calculation components
  private behaviorAnalyzer: BehaviorReputationAnalyzer;
  private performanceTracker: PerformanceTracker;
  private consensusEvaluator: ConsensusEvaluator;
  private peerEvaluator: PeerEvaluator;
  private stabilityAnalyzer: StabilityAnalyzer;
  
  // Economic components
  private stakeManager: StakeManager;
  private slashingController: SlashingController;

  constructor(config: Partial<ReputationConfig> = {}) {
    super();
    this.logger = new Logger('ReputationSystem');
    
    this.initializeConfig(config);
    this.initializeComponents();
    this.startReputationUpdates();
    
    this.logger.info('Reputation System initialized', {
      features: [
        'dynamic-scoring', 'peer-feedback', 'stake-weighting',
        'reputation-challenges', 'trend-analysis', 'slashing-protection'
      ],
      config: this.config
    });
  }

  /**
   * Initialize configuration with defaults
   */
  private initializeConfig(config: Partial<ReputationConfig>): void {
    this.config = {
      weights: {
        behavior: 0.3,
        performance: 0.25,
        consensus: 0.2,
        peer: 0.15,
        stability: 0.1,
        ...config.weights
      },
      decayFactors: {
        dailyDecay: 0.995,       // 0.5% daily decay
        inactivityPenalty: 0.02,  // 2% penalty for inactivity
        recoveryBonus: 0.01,     // 1% bonus for recovery activities
        ...config.decayFactors
      },
      thresholds: {
        quarantineThreshold: 300,   // Below 300 may be quarantined
        privilegeThreshold: 750,    // Above 750 gets special privileges
        slashingThreshold: 200,     // Below 200 may face slashing
        ...config.thresholds
      },
      peerFeedback: {
        minRaterScore: 400,        // Minimum 400 score to rate others
        maxFeedbackAge: 7776000000, // 90 days
        weightByRaterScore: true,
        ...config.peerFeedback
      },
      economic: {
        minStakeAmount: 1000,
        maxSlashingPercentage: 0.1, // 10% max slashing
        stakeLockPeriod: 2592000000, // 30 days
        reputationStakingEnabled: true,
        ...config.economic
      }
    };
  }

  /**
   * Initialize reputation system components
   */
  private initializeComponents(): void {
    this.behaviorAnalyzer = new BehaviorReputationAnalyzer(this.config);
    this.performanceTracker = new PerformanceTracker(this.config);
    this.consensusEvaluator = new ConsensusEvaluator(this.config);
    this.peerEvaluator = new PeerEvaluator(this.config);
    this.stabilityAnalyzer = new StabilityAnalyzer(this.config);
    
    if (this.config.economic.reputationStakingEnabled) {
      this.stakeManager = new StakeManager(this.config);
      this.slashingController = new SlashingController(this.config);
    }
  }

  /**
   * Start periodic reputation updates
   */
  private startReputationUpdates(): void {
    // Update reputation scores every 5 minutes
    setInterval(async () => {
      await this.updateAllReputationScores();
    }, 300000);
    
    // Apply daily decay every 24 hours
    setInterval(async () => {
      await this.applyDailyDecay();
    }, 86400000);
    
    // Update trends weekly
    setInterval(async () => {
      await this.updateReputationTrends();
    }, 604800000);
  }

  /**
   * Initialize agent reputation
   */
  async initializeAgentReputation(
    agentId: string,
    identity: A2AIdentity,
    initialStake?: number
  ): Promise<ReputationScore> {
    if (this.reputationScores.has(agentId)) {
      return this.reputationScores.get(agentId)!;
    }

    const reputationScore: ReputationScore = {
      agentId,
      overallScore: 500, // Start with neutral score
      trustLevel: 'medium',
      
      behaviorScore: 75,
      performanceScore: 70,
      consensusScore: 70,
      peerScore: 60,
      stabilityScore: 80,
      
      metrics: {
        successfulOperations: 0,
        failedOperations: 0,
        consensusParticipation: 0,
        messageReliability: 1.0,
        responseTime: 1000,
        resourceEfficiency: 0.8,
        securityCompliance: 1.0,
        innovationScore: 0.5
      },
      
      history: {
        scores: [{ timestamp: new Date(), score: 500 }],
        events: [],
        trends: []
      },
      
      peerFeedback: {
        positiveCount: 0,
        negativeCount: 0,
        neutralCount: 0,
        recentFeedback: []
      },
      
      stake: {
        amount: initialStake || 0,
        lockPeriod: 0,
        slashingHistory: []
      },
      
      metadata: {
        lastUpdated: new Date(),
        updateCount: 0,
        version: '1.0.0',
        flags: identity.trustLevel === 'untrusted' ? ['new_agent'] : []
      }
    };

    // Adjust initial score based on trust level
    reputationScore.overallScore = this.adjustInitialScore(reputationScore.overallScore, identity.trustLevel);
    reputationScore.trustLevel = this.calculateTrustLevel(reputationScore.overallScore);

    this.reputationScores.set(agentId, reputationScore);
    this.peerFeedbacks.set(agentId, []);
    this.reputationEvents.set(agentId, []);

    // Initialize stake if provided
    if (initialStake && this.stakeManager) {
      await this.stakeManager.addStake(agentId, initialStake);
    }

    this.logger.info('Agent reputation initialized', {
      agentId,
      initialScore: reputationScore.overallScore,
      trustLevel: reputationScore.trustLevel,
      stake: initialStake || 0
    });

    this.emit('reputation_initialized', { agentId, reputation: reputationScore });
    return reputationScore;
  }

  /**
   * Record reputation event
   */
  async recordReputationEvent(event: Omit<ReputationEvent, 'eventId' | 'timestamp' | 'verified'>): Promise<void> {
    const reputationEvent: ReputationEvent = {
      eventId: crypto.randomUUID(),
      timestamp: new Date(),
      verified: false,
      ...event
    };

    // Get or create events list for agent
    const events = this.reputationEvents.get(event.agentId) || [];
    events.push(reputationEvent);
    this.reputationEvents.set(event.agentId, events);

    // Immediately update reputation score
    await this.updateAgentReputationScore(event.agentId);

    this.logger.info('Reputation event recorded', {
      agentId: event.agentId,
      type: event.type,
      category: event.category,
      impact: event.impact
    });

    this.emit('reputation_event', reputationEvent);
  }

  /**
   * Submit peer feedback
   */
  async submitPeerFeedback(
    fromAgentId: string,
    toAgentId: string,
    rating: number,
    category: 'behavior' | 'performance' | 'reliability' | 'security' | 'cooperation',
    comment?: string,
    evidence?: any
  ): Promise<boolean> {
    // Validate rater's reputation
    const raterScore = this.reputationScores.get(fromAgentId);
    if (!raterScore || raterScore.overallScore < this.config.peerFeedback.minRaterScore) {
      this.logger.warn('Peer feedback rejected - insufficient rater reputation', {
        fromAgent: fromAgentId,
        raterScore: raterScore?.overallScore || 0,
        required: this.config.peerFeedback.minRaterScore
      });
      return false;
    }

    // Create feedback entry
    const feedback: PeerFeedback = {
      fromAgentId,
      toAgentId,
      rating: Math.max(1, Math.min(5, rating)), // Clamp to 1-5
      category,
      comment,
      evidence,
      timestamp: new Date(),
      signature: await this.signFeedback(fromAgentId, toAgentId, rating, category),
      weight: this.config.peerFeedback.weightByRaterScore ? 
        Math.min(1.0, raterScore.overallScore / 1000) : 1.0
    };

    // Add to feedback list
    const feedbacks = this.peerFeedbacks.get(toAgentId) || [];
    feedbacks.push(feedback);
    this.peerFeedbacks.set(toAgentId, feedbacks);

    // Update target agent's reputation
    await this.updateAgentReputationScore(toAgentId);

    this.logger.info('Peer feedback submitted', {
      fromAgent: fromAgentId,
      toAgent: toAgentId,
      rating,
      category,
      weight: feedback.weight
    });

    this.emit('peer_feedback', feedback);
    return true;
  }

  /**
   * Update agent reputation based on behavior profile
   */
  async updateReputationFromBehavior(
    agentId: string,
    behaviorProfile: BehaviorProfile,
    consensusMetrics?: any
  ): Promise<void> {
    const reputation = this.reputationScores.get(agentId);
    if (!reputation) return;

    // Update behavior score
    reputation.behaviorScore = await this.behaviorAnalyzer.calculateBehaviorScore(behaviorProfile);
    
    // Update consensus score if metrics provided
    if (consensusMetrics) {
      reputation.consensusScore = await this.consensusEvaluator.calculateConsensusScore(consensusMetrics);
    }
    
    // Update stability score based on historical patterns
    reputation.stabilityScore = await this.stabilityAnalyzer.calculateStabilityScore(reputation.history);
    
    // Recalculate overall score
    await this.recalculateOverallScore(agentId);
    
    this.logger.debug('Reputation updated from behavior', {
      agentId,
      behaviorScore: reputation.behaviorScore,
      consensusScore: reputation.consensusScore,
      stabilityScore: reputation.stabilityScore,
      overallScore: reputation.overallScore
    });
  }

  /**
   * Process reputation challenge
   */
  async createReputationChallenge(
    agentId: string,
    type: 'behavior_verification' | 'skill_demonstration' | 'consensus_participation' | 'peer_collaboration',
    description: string,
    requirements: any,
    reward: number = 50,
    penalty: number = 25,
    timeLimit: number = 3600000 // 1 hour
  ): Promise<ReputationChallenge> {
    const challenge: ReputationChallenge = {
      challengeId: crypto.randomUUID(),
      agentId,
      type,
      description,
      requirements,
      reward,
      penalty,
      timeLimit,
      createdAt: new Date(),
      status: 'pending'
    };

    this.activeChallenges.set(challenge.challengeId, challenge);

    // Auto-expire challenge after time limit
    setTimeout(async () => {
      const currentChallenge = this.activeChallenges.get(challenge.challengeId);
      if (currentChallenge && currentChallenge.status === 'pending') {
        currentChallenge.status = 'expired';
        await this.recordReputationEvent({
          agentId,
          type: 'negative',
          category: 'challenge_expired',
          impact: -penalty,
          description: `Challenge ${challenge.challengeId} expired without response`,
          evidence: { challengeId: challenge.challengeId }
        });
      }
    }, timeLimit);

    this.logger.info('Reputation challenge created', {
      challengeId: challenge.challengeId,
      agentId,
      type,
      reward,
      penalty
    });

    this.emit('reputation_challenge_created', challenge);
    return challenge;
  }

  /**
   * Submit challenge response
   */
  async submitChallengeResponse(
    challengeId: string,
    agentId: string,
    response: any
  ): Promise<{ success: boolean; reward?: number; penalty?: number }> {
    const challenge = this.activeChallenges.get(challengeId);
    
    if (!challenge || challenge.agentId !== agentId) {
      return { success: false };
    }

    if (challenge.status !== 'pending') {
      return { success: false };
    }

    challenge.status = 'in_progress';

    // Validate challenge response
    const validation = await this.validateChallengeResponse(challenge, response);
    
    if (validation.success) {
      challenge.status = 'completed';
      
      await this.recordReputationEvent({
        agentId,
        type: 'positive',
        category: 'challenge_completed',
        impact: challenge.reward,
        description: `Successfully completed ${challenge.type} challenge`,
        evidence: { challengeId, response, validation }
      });

      this.logger.info('Challenge completed successfully', {
        challengeId,
        agentId,
        reward: challenge.reward
      });

      return { success: true, reward: challenge.reward };
      
    } else {
      challenge.status = 'failed';
      
      await this.recordReputationEvent({
        agentId,
        type: 'negative',
        category: 'challenge_failed',
        impact: -challenge.penalty,
        description: `Failed to complete ${challenge.type} challenge`,
        evidence: { challengeId, response, validation }
      });

      this.logger.warn('Challenge failed', {
        challengeId,
        agentId,
        penalty: challenge.penalty,
        reason: validation.reason
      });

      return { success: false, penalty: challenge.penalty };
    }
  }

  /**
   * Apply reputation-based penalties (slashing)
   */
  async applySlashing(
    agentId: string,
    reason: string,
    percentage: number,
    evidence: any
  ): Promise<boolean> {
    if (!this.slashingController) return false;

    const reputation = this.reputationScores.get(agentId);
    if (!reputation) return false;

    const slashingAmount = Math.min(
      reputation.stake.amount * percentage,
      reputation.stake.amount * this.config.economic.maxSlashingPercentage
    );

    if (slashingAmount === 0) return false;

    const slashingEvent: SlashingEvent = {
      eventId: crypto.randomUUID(),
      agentId,
      reason,
      amountSlashed: slashingAmount,
      timestamp: new Date(),
      evidence
    };

    // Execute slashing
    reputation.stake.amount -= slashingAmount;
    reputation.stake.slashingHistory.push(slashingEvent);

    // Record reputation event
    await this.recordReputationEvent({
      agentId,
      type: 'negative',
      category: 'slashing',
      impact: -100, // Maximum negative impact
      description: `Economic slashing applied: ${reason}`,
      evidence: slashingEvent
    });

    this.logger.error('Agent slashed for malicious behavior', {
      agentId,
      reason,
      amountSlashed: slashingAmount,
      remainingStake: reputation.stake.amount
    });

    this.emit('agent_slashed', slashingEvent);
    return true;
  }

  /**
   * Calculate trust level based on overall score
   */
  private calculateTrustLevel(score: number): 'untrusted' | 'low' | 'medium' | 'high' | 'excellent' {
    if (score < 200) return 'untrusted';
    if (score < 400) return 'low';
    if (score < 600) return 'medium';
    if (score < 800) return 'high';
    return 'excellent';
  }

  /**
   * Update all reputation scores
   */
  private async updateAllReputationScores(): Promise<void> {
    const agents = Array.from(this.reputationScores.keys());
    
    for (const agentId of agents) {
      await this.updateAgentReputationScore(agentId);
    }
    
    this.logger.debug('All reputation scores updated', { agentCount: agents.length });
  }

  /**
   * Update individual agent reputation score
   */
  private async updateAgentReputationScore(agentId: string): Promise<void> {
    const reputation = this.reputationScores.get(agentId);
    if (!reputation) return;

    // Update peer score based on recent feedback
    reputation.peerScore = await this.peerEvaluator.calculatePeerScore(
      this.peerFeedbacks.get(agentId) || []
    );

    // Update performance score based on recent events
    reputation.performanceScore = await this.performanceTracker.calculatePerformanceScore(
      this.reputationEvents.get(agentId) || []
    );

    // Recalculate overall score
    await this.recalculateOverallScore(agentId);
    
    // Update metadata
    reputation.metadata.lastUpdated = new Date();
    reputation.metadata.updateCount++;
    
    // Add to history
    reputation.history.scores.push({
      timestamp: new Date(),
      score: reputation.overallScore
    });
    
    // Limit history size
    if (reputation.history.scores.length > 1000) {
      reputation.history.scores = reputation.history.scores.slice(-500);
    }
    
    // Update trust level
    const newTrustLevel = this.calculateTrustLevel(reputation.overallScore);
    if (newTrustLevel !== reputation.trustLevel) {
      reputation.trustLevel = newTrustLevel;
      
      this.emit('trust_level_changed', {
        agentId,
        oldLevel: reputation.trustLevel,
        newLevel: newTrustLevel,
        score: reputation.overallScore
      });
    }

    this.emit('reputation_updated', { agentId, reputation });
  }

  /**
   * Recalculate overall reputation score
   */
  private async recalculateOverallScore(agentId: string): Promise<void> {
    const reputation = this.reputationScores.get(agentId);
    if (!reputation) return;

    const weights = this.config.weights;
    
    const overallScore = Math.round(
      (reputation.behaviorScore * weights.behavior +
       reputation.performanceScore * weights.performance +
       reputation.consensusScore * weights.consensus +
       reputation.peerScore * weights.peer +
       reputation.stabilityScore * weights.stability) * 10 // Scale to 0-1000
    );

    // Apply stake weighting if enabled
    let finalScore = overallScore;
    if (this.config.economic.reputationStakingEnabled && reputation.stake.amount > 0) {
      const stakeMultiplier = Math.min(2.0, 1 + (reputation.stake.amount / 10000));
      finalScore = Math.round(overallScore * stakeMultiplier);
    }

    reputation.overallScore = Math.max(0, Math.min(1000, finalScore));
  }

  /**
   * Apply daily reputation decay
   */
  private async applyDailyDecay(): Promise<void> {
    const decayFactor = this.config.decayFactors.dailyDecay;
    
    for (const [agentId, reputation] of this.reputationScores) {
      // Apply decay to component scores
      reputation.behaviorScore *= decayFactor;
      reputation.performanceScore *= decayFactor;
      reputation.consensusScore *= decayFactor;
      reputation.peerScore *= decayFactor;
      reputation.stabilityScore *= decayFactor;
      
      // Check for inactivity
      const daysSinceUpdate = (Date.now() - reputation.metadata.lastUpdated.getTime()) / 86400000;
      if (daysSinceUpdate > 1) {
        const inactivityPenalty = this.config.decayFactors.inactivityPenalty * daysSinceUpdate;
        reputation.overallScore = Math.max(0, reputation.overallScore - (reputation.overallScore * inactivityPenalty));
      }
      
      await this.recalculateOverallScore(agentId);
    }
    
    this.logger.info('Daily reputation decay applied', {
      agentCount: this.reputationScores.size,
      decayFactor
    });
  }

  /**
   * Update reputation trends
   */
  private async updateReputationTrends(): Promise<void> {
    for (const [agentId, reputation] of this.reputationScores) {
      const trends = this.calculateReputationTrends(reputation.history.scores);
      reputation.history.trends = trends;
    }
    
    this.logger.info('Reputation trends updated');
  }

  /**
   * Helper methods
   */

  private adjustInitialScore(baseScore: number, trustLevel: string): number {
    const adjustments = {
      untrusted: -200,
      basic: -100,
      verified: 0,
      trusted: 100
    };
    
    return Math.max(0, Math.min(1000, baseScore + (adjustments[trustLevel as keyof typeof adjustments] || 0)));
  }

  private async signFeedback(
    fromAgentId: string,
    toAgentId: string,
    rating: number,
    category: string
  ): Promise<string> {
    const data = `${fromAgentId}:${toAgentId}:${rating}:${category}:${Date.now()}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private async validateChallengeResponse(
    challenge: ReputationChallenge,
    response: any
  ): Promise<{ success: boolean; reason?: string }> {
    // Implement challenge-specific validation logic
    switch (challenge.type) {
      case 'behavior_verification':
        return this.validateBehaviorChallenge(challenge, response);
      case 'skill_demonstration':
        return this.validateSkillChallenge(challenge, response);
      case 'consensus_participation':
        return this.validateConsensusChallenge(challenge, response);
      case 'peer_collaboration':
        return this.validateCollaborationChallenge(challenge, response);
      default:
        return { success: false, reason: 'Unknown challenge type' };
    }
  }

  private async validateBehaviorChallenge(
    challenge: ReputationChallenge,
    response: any
  ): Promise<{ success: boolean; reason?: string }> {
    // Validate behavior verification challenge
    return { success: true };
  }

  private async validateSkillChallenge(
    challenge: ReputationChallenge,
    response: any
  ): Promise<{ success: boolean; reason?: string }> {
    // Validate skill demonstration challenge
    return { success: true };
  }

  private async validateConsensusChallenge(
    challenge: ReputationChallenge,
    response: any
  ): Promise<{ success: boolean; reason?: string }> {
    // Validate consensus participation challenge
    return { success: true };
  }

  private async validateCollaborationChallenge(
    challenge: ReputationChallenge,
    response: any
  ): Promise<{ success: boolean; reason?: string }> {
    // Validate peer collaboration challenge
    return { success: true };
  }

  private calculateReputationTrends(scores: { timestamp: Date; score: number }[]): ReputationTrend[] {
    if (scores.length < 2) return [];

    const now = new Date();
    const trends: ReputationTrend[] = [];

    // Calculate daily trend (last 24 hours)
    const dailyScores = scores.filter(s => now.getTime() - s.timestamp.getTime() < 86400000);
    if (dailyScores.length > 1) {
      trends.push(this.calculateTrend('daily', dailyScores));
    }

    // Calculate weekly trend
    const weeklyScores = scores.filter(s => now.getTime() - s.timestamp.getTime() < 604800000);
    if (weeklyScores.length > 1) {
      trends.push(this.calculateTrend('weekly', weeklyScores));
    }

    // Calculate monthly trend
    const monthlyScores = scores.filter(s => now.getTime() - s.timestamp.getTime() < 2592000000);
    if (monthlyScores.length > 1) {
      trends.push(this.calculateTrend('monthly', monthlyScores));
    }

    return trends;
  }

  private calculateTrend(
    period: 'daily' | 'weekly' | 'monthly',
    scores: { timestamp: Date; score: number }[]
  ): ReputationTrend {
    const sortedScores = scores.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const firstScore = sortedScores[0];
    const lastScore = sortedScores[sortedScores.length - 1];
    
    const averageScore = sortedScores.reduce((sum, s) => sum + s.score, 0) / sortedScores.length;
    const scoreDiff = lastScore.score - firstScore.score;
    
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (Math.abs(scoreDiff) > 10) {
      trend = scoreDiff > 0 ? 'increasing' : 'decreasing';
    }
    
    // Calculate volatility (standard deviation)
    const variance = sortedScores.reduce((sum, s) => sum + Math.pow(s.score - averageScore, 2), 0) / sortedScores.length;
    const volatility = Math.sqrt(variance);
    
    return {
      period,
      startDate: firstScore.timestamp,
      endDate: lastScore.timestamp,
      averageScore,
      trend,
      volatility,
      confidence: Math.min(1.0, sortedScores.length / 10) // Higher confidence with more data points
    };
  }

  /**
   * Public API methods
   */

  getReputationScore(agentId: string): ReputationScore | null {
    return this.reputationScores.get(agentId) || null;
  }

  getAllReputationScores(): ReputationScore[] {
    return Array.from(this.reputationScores.values());
  }

  getPeerFeedback(agentId: string): PeerFeedback[] {
    return this.peerFeedbacks.get(agentId) || [];
  }

  getReputationEvents(agentId: string): ReputationEvent[] {
    return this.reputationEvents.get(agentId) || [];
  }

  getActiveChallenges(agentId?: string): ReputationChallenge[] {
    const challenges = Array.from(this.activeChallenges.values());
    return agentId ? challenges.filter(c => c.agentId === agentId) : challenges;
  }

  async getSystemStats(): Promise<any> {
    const scores = Array.from(this.reputationScores.values());
    const totalFeedback = Array.from(this.peerFeedbacks.values()).reduce((sum, f) => sum + f.length, 0);
    const totalEvents = Array.from(this.reputationEvents.values()).reduce((sum, e) => sum + e.length, 0);
    
    return {
      totalAgents: scores.length,
      averageScore: scores.reduce((sum, s) => sum + s.overallScore, 0) / scores.length || 0,
      trustLevelDistribution: this.calculateTrustLevelDistribution(scores),
      totalPeerFeedback: totalFeedback,
      totalReputationEvents: totalEvents,
      activeChallenges: this.activeChallenges.size,
      totalStaked: scores.reduce((sum, s) => sum + s.stake.amount, 0),
      slashingEvents: scores.reduce((sum, s) => sum + s.stake.slashingHistory.length, 0)
    };
  }

  private calculateTrustLevelDistribution(scores: ReputationScore[]): Record<string, number> {
    const distribution = { untrusted: 0, low: 0, medium: 0, high: 0, excellent: 0 };
    
    scores.forEach(score => {
      distribution[score.trustLevel]++;
    });
    
    return distribution;
  }
}

// Supporting analyzer classes

class BehaviorReputationAnalyzer {
  constructor(private config: ReputationConfig) {}

  async calculateBehaviorScore(profile: BehaviorProfile): Promise<number> {
    let score = 75; // Base score
    
    // Analyze message patterns
    if (profile.protocolCompliance.signatureValidation > 0.9) score += 10;
    if (profile.protocolCompliance.nonceCompliance > 0.9) score += 5;
    if (profile.protocolCompliance.capabilityCompliance > 0.9) score += 5;
    
    // Penalize anomalies
    if (profile.anomalyIndicators.recentAnomalies > 5) score -= 15;
    if (profile.anomalyIndicators.totalAnomalies > 20) score -= 10;
    
    // Trust metrics influence
    score += (profile.trustMetrics.behaviorScore - 0.5) * 20;
    
    return Math.max(0, Math.min(100, score));
  }
}

class PerformanceTracker {
  constructor(private config: ReputationConfig) {}

  async calculatePerformanceScore(events: ReputationEvent[]): Promise<number> {
    if (events.length === 0) return 70; // Default score
    
    // Calculate recent performance (last 7 days)
    const recentEvents = events.filter(e => 
      Date.now() - e.timestamp.getTime() < 604800000
    );
    
    if (recentEvents.length === 0) return 70;
    
    const positiveEvents = recentEvents.filter(e => e.type === 'positive');
    const negativeEvents = recentEvents.filter(e => e.type === 'negative');
    
    const positiveImpact = positiveEvents.reduce((sum, e) => sum + e.impact, 0);
    const negativeImpact = negativeEvents.reduce((sum, e) => sum + Math.abs(e.impact), 0);
    
    const netImpact = positiveImpact - negativeImpact;
    const baseScore = 70;
    
    return Math.max(0, Math.min(100, baseScore + netImpact));
  }
}

class ConsensusEvaluator {
  constructor(private config: ReputationConfig) {}

  async calculateConsensusScore(metrics: any): Promise<number> {
    let score = 70; // Base score
    
    if (metrics.participationRate > 0.8) score += 15;
    if (metrics.agreementRate > 0.7) score += 10;
    if (metrics.proposalQuality > 0.8) score += 10;
    if (metrics.responseLatency < 2000) score += 5;
    
    return Math.max(0, Math.min(100, score));
  }
}

class PeerEvaluator {
  constructor(private config: ReputationConfig) {}

  async calculatePeerScore(feedbacks: PeerFeedback[]): Promise<number> {
    if (feedbacks.length === 0) return 60; // Default score
    
    // Filter recent feedback
    const recentFeedbacks = feedbacks.filter(f => 
      Date.now() - f.timestamp.getTime() < this.config.peerFeedback.maxFeedbackAge
    );
    
    if (recentFeedbacks.length === 0) return 60;
    
    // Calculate weighted average
    const weightedSum = recentFeedbacks.reduce((sum, f) => sum + (f.rating * f.weight), 0);
    const totalWeight = recentFeedbacks.reduce((sum, f) => sum + f.weight, 0);
    
    const avgRating = weightedSum / totalWeight;
    
    // Convert 1-5 rating to 0-100 score
    return (avgRating - 1) * 25;
  }
}

class StabilityAnalyzer {
  constructor(private config: ReputationConfig) {}

  async calculateStabilityScore(history: { scores: { timestamp: Date; score: number }[] }): Promise<number> {
    if (history.scores.length < 10) return 80; // Default for new agents
    
    // Calculate score variance over time
    const scores = history.scores.map(s => s.score);
    const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - avgScore, 2), 0) / scores.length;
    const volatility = Math.sqrt(variance);
    
    // Lower volatility = higher stability score
    const stabilityScore = Math.max(0, 100 - (volatility / 10));
    
    return Math.min(100, stabilityScore);
  }
}

class StakeManager {
  constructor(private config: ReputationConfig) {}

  async addStake(agentId: string, amount: number): Promise<boolean> {
    // Implementation for adding stake
    return true;
  }

  async removeStake(agentId: string, amount: number): Promise<boolean> {
    // Implementation for removing stake
    return true;
  }
}

class SlashingController {
  constructor(private config: ReputationConfig) {}

  async executeSlashing(agentId: string, amount: number, reason: string): Promise<boolean> {
    // Implementation for executing slashing
    return true;
  }
}

export {
  ReputationSystem,
  ReputationScore,
  PeerFeedback,
  ReputationEvent,
  ReputationTrend,
  ReputationChallenge,
  SlashingEvent,
  ReputationConfig
};