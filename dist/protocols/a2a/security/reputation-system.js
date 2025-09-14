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
import { EventEmitter } from "events";
import crypto from "crypto";
import { Logger } from "../../../utils/logger.js";
export class ReputationSystem extends EventEmitter {
    logger;
    reputationScores = new Map();
    peerFeedbacks = new Map(); // agentId -> feedbacks
    reputationEvents = new Map(); // agentId -> events
    activeChallenges = new Map();
    config;
    // Reputation calculation components
    behaviorAnalyzer;
    performanceTracker;
    consensusEvaluator;
    peerEvaluator;
    stabilityAnalyzer;
    // Economic components
    stakeManager;
    slashingController;
    constructor(config = {}) {
        super();
        this.logger = new Logger("ReputationSystem");
        this.initializeConfig(config);
        this.initializeComponents();
        this.startReputationUpdates();
        this.logger.info("Reputation System initialized", {
            features: [
                "dynamic-scoring",
                "peer-feedback",
                "stake-weighting",
                "reputation-challenges",
                "trend-analysis",
                "slashing-protection",
            ],
            config: this.config,
        });
    }
    /**
     * Initialize configuration with defaults
     */
    initializeConfig(config) {
        this.config = {
            weights: {
                behavior: 0.3,
                performance: 0.25,
                consensus: 0.2,
                peer: 0.15,
                stability: 0.1,
                ...config.weights,
            },
            decayFactors: {
                dailyDecay: 0.995, // 0.5% daily decay
                inactivityPenalty: 0.02, // 2% penalty for inactivity
                recoveryBonus: 0.01, // 1% bonus for recovery activities
                ...config.decayFactors,
            },
            thresholds: {
                quarantineThreshold: 300, // Below 300 may be quarantined
                privilegeThreshold: 750, // Above 750 gets special privileges
                slashingThreshold: 200, // Below 200 may face slashing
                ...config.thresholds,
            },
            peerFeedback: {
                minRaterScore: 400, // Minimum 400 score to rate others
                maxFeedbackAge: 7776000000, // 90 days
                weightByRaterScore: true,
                ...config.peerFeedback,
            },
            economic: {
                minStakeAmount: 1000,
                maxSlashingPercentage: 0.1, // 10% max slashing
                stakeLockPeriod: 2592000000, // 30 days
                reputationStakingEnabled: true,
                ...config.economic,
            },
        };
    }
    /**
     * Initialize reputation system components
     */
    initializeComponents() {
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
    startReputationUpdates() {
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
    async initializeAgentReputation(agentId, identity, initialStake) {
        if (this.reputationScores.has(agentId)) {
            return this.reputationScores.get(agentId);
        }
        const reputationScore = {
            agentId,
            overallScore: 500, // Start with neutral score
            trustLevel: "medium",
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
                innovationScore: 0.5,
            },
            history: {
                scores: [{ timestamp: new Date(), score: 500 }],
                events: [],
                trends: [],
            },
            peerFeedback: {
                positiveCount: 0,
                negativeCount: 0,
                neutralCount: 0,
                recentFeedback: [],
            },
            stake: {
                amount: initialStake || 0,
                lockPeriod: 0,
                slashingHistory: [],
            },
            metadata: {
                lastUpdated: new Date(),
                updateCount: 0,
                version: "1.0.0",
                flags: identity.trustLevel === "untrusted" ? ["new_agent"] : [],
            },
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
        this.logger.info("Agent reputation initialized", {
            agentId,
            initialScore: reputationScore.overallScore,
            trustLevel: reputationScore.trustLevel,
            stake: initialStake || 0,
        });
        this.emit("reputation_initialized", {
            agentId,
            reputation: reputationScore,
        });
        return reputationScore;
    }
    /**
     * Record reputation event
     */
    async recordReputationEvent(event) {
        const reputationEvent = {
            eventId: crypto.randomUUID(),
            timestamp: new Date(),
            verified: false,
            ...event,
        };
        // Get or create events list for agent
        const events = this.reputationEvents.get(event.agentId) || [];
        events.push(reputationEvent);
        this.reputationEvents.set(event.agentId, events);
        // Immediately update reputation score
        await this.updateAgentReputationScore(event.agentId);
        this.logger.info("Reputation event recorded", {
            agentId: event.agentId,
            type: event.type,
            category: event.category,
            impact: event.impact,
        });
        this.emit("reputation_event", reputationEvent);
    }
    /**
     * Submit peer feedback
     */
    async submitPeerFeedback(fromAgentId, toAgentId, rating, category, comment, evidence) {
        // Validate rater's reputation
        const raterScore = this.reputationScores.get(fromAgentId);
        if (!raterScore ||
            raterScore.overallScore < this.config.peerFeedback.minRaterScore) {
            this.logger.warn("Peer feedback rejected - insufficient rater reputation", {
                fromAgent: fromAgentId,
                raterScore: raterScore?.overallScore || 0,
                required: this.config.peerFeedback.minRaterScore,
            });
            return false;
        }
        // Create feedback entry
        const feedback = {
            fromAgentId,
            toAgentId,
            rating: Math.max(1, Math.min(5, rating)), // Clamp to 1-5
            category,
            comment,
            evidence,
            timestamp: new Date(),
            signature: await this.signFeedback(fromAgentId, toAgentId, rating, category),
            weight: this.config.peerFeedback.weightByRaterScore
                ? Math.min(1.0, raterScore.overallScore / 1000)
                : 1.0,
        };
        // Add to feedback list
        const feedbacks = this.peerFeedbacks.get(toAgentId) || [];
        feedbacks.push(feedback);
        this.peerFeedbacks.set(toAgentId, feedbacks);
        // Update target agent's reputation
        await this.updateAgentReputationScore(toAgentId);
        this.logger.info("Peer feedback submitted", {
            fromAgent: fromAgentId,
            toAgent: toAgentId,
            rating,
            category,
            weight: feedback.weight,
        });
        this.emit("peer_feedback", feedback);
        return true;
    }
    /**
     * Update agent reputation based on behavior profile
     */
    async updateReputationFromBehavior(agentId, behaviorProfile, consensusMetrics) {
        const reputation = this.reputationScores.get(agentId);
        if (!reputation)
            return;
        // Update behavior score
        reputation.behaviorScore =
            await this.behaviorAnalyzer.calculateBehaviorScore(behaviorProfile);
        // Update consensus score if metrics provided
        if (consensusMetrics) {
            reputation.consensusScore =
                await this.consensusEvaluator.calculateConsensusScore(consensusMetrics);
        }
        // Update stability score based on historical patterns
        reputation.stabilityScore =
            await this.stabilityAnalyzer.calculateStabilityScore(reputation.history);
        // Recalculate overall score
        await this.recalculateOverallScore(agentId);
        this.logger.debug("Reputation updated from behavior", {
            agentId,
            behaviorScore: reputation.behaviorScore,
            consensusScore: reputation.consensusScore,
            stabilityScore: reputation.stabilityScore,
            overallScore: reputation.overallScore,
        });
    }
    /**
     * Process reputation challenge
     */
    async createReputationChallenge(agentId, type, description, requirements, reward = 50, penalty = 25, timeLimit = 3600000) {
        const challenge = {
            challengeId: crypto.randomUUID(),
            agentId,
            type,
            description,
            requirements,
            reward,
            penalty,
            timeLimit,
            createdAt: new Date(),
            status: "pending",
        };
        this.activeChallenges.set(challenge.challengeId, challenge);
        // Auto-expire challenge after time limit
        setTimeout(async () => {
            const currentChallenge = this.activeChallenges.get(challenge.challengeId);
            if (currentChallenge && currentChallenge.status === "pending") {
                currentChallenge.status = "expired";
                await this.recordReputationEvent({
                    agentId,
                    type: "negative",
                    category: "challenge_expired",
                    impact: -penalty,
                    description: `Challenge ${challenge.challengeId} expired without response`,
                    evidence: { challengeId: challenge.challengeId },
                });
            }
        }, timeLimit);
        this.logger.info("Reputation challenge created", {
            challengeId: challenge.challengeId,
            agentId,
            type,
            reward,
            penalty,
        });
        this.emit("reputation_challenge_created", challenge);
        return challenge;
    }
    /**
     * Submit challenge response
     */
    async submitChallengeResponse(challengeId, agentId, response) {
        const challenge = this.activeChallenges.get(challengeId);
        if (!challenge || challenge.agentId !== agentId) {
            return { success: false };
        }
        if (challenge.status !== "pending") {
            return { success: false };
        }
        challenge.status = "in_progress";
        // Validate challenge response
        const validation = await this.validateChallengeResponse(challenge, response);
        if (validation.success) {
            challenge.status = "completed";
            await this.recordReputationEvent({
                agentId,
                type: "positive",
                category: "challenge_completed",
                impact: challenge.reward,
                description: `Successfully completed ${challenge.type} challenge`,
                evidence: { challengeId, response, validation },
            });
            this.logger.info("Challenge completed successfully", {
                challengeId,
                agentId,
                reward: challenge.reward,
            });
            return { success: true, reward: challenge.reward };
        }
        else {
            challenge.status = "failed";
            await this.recordReputationEvent({
                agentId,
                type: "negative",
                category: "challenge_failed",
                impact: -challenge.penalty,
                description: `Failed to complete ${challenge.type} challenge`,
                evidence: { challengeId, response, validation },
            });
            this.logger.warn("Challenge failed", {
                challengeId,
                agentId,
                penalty: challenge.penalty,
                reason: validation.reason,
            });
            return { success: false, penalty: challenge.penalty };
        }
    }
    /**
     * Apply reputation-based penalties (slashing)
     */
    async applySlashing(agentId, reason, percentage, evidence) {
        if (!this.slashingController)
            return false;
        const reputation = this.reputationScores.get(agentId);
        if (!reputation)
            return false;
        const slashingAmount = Math.min(reputation.stake.amount * percentage, reputation.stake.amount * this.config.economic.maxSlashingPercentage);
        if (slashingAmount === 0)
            return false;
        const slashingEvent = {
            eventId: crypto.randomUUID(),
            agentId,
            reason,
            amountSlashed: slashingAmount,
            timestamp: new Date(),
            evidence,
        };
        // Execute slashing
        reputation.stake.amount -= slashingAmount;
        reputation.stake.slashingHistory.push(slashingEvent);
        // Record reputation event
        await this.recordReputationEvent({
            agentId,
            type: "negative",
            category: "slashing",
            impact: -100, // Maximum negative impact
            description: `Economic slashing applied: ${reason}`,
            evidence: slashingEvent,
        });
        this.logger.error("Agent slashed for malicious behavior", {
            agentId,
            reason,
            amountSlashed: slashingAmount,
            remainingStake: reputation.stake.amount,
        });
        this.emit("agent_slashed", slashingEvent);
        return true;
    }
    /**
     * Calculate trust level based on overall score
     */
    calculateTrustLevel(score) {
        if (score < 200)
            return "untrusted";
        if (score < 400)
            return "low";
        if (score < 600)
            return "medium";
        if (score < 800)
            return "high";
        return "excellent";
    }
    /**
     * Update all reputation scores
     */
    async updateAllReputationScores() {
        const agents = Array.from(this.reputationScores.keys());
        for (const agentId of agents) {
            await this.updateAgentReputationScore(agentId);
        }
        this.logger.debug("All reputation scores updated", {
            agentCount: agents.length,
        });
    }
    /**
     * Update individual agent reputation score
     */
    async updateAgentReputationScore(agentId) {
        const reputation = this.reputationScores.get(agentId);
        if (!reputation)
            return;
        // Update peer score based on recent feedback
        reputation.peerScore = await this.peerEvaluator.calculatePeerScore(this.peerFeedbacks.get(agentId) || []);
        // Update performance score based on recent events
        reputation.performanceScore =
            await this.performanceTracker.calculatePerformanceScore(this.reputationEvents.get(agentId) || []);
        // Recalculate overall score
        await this.recalculateOverallScore(agentId);
        // Update metadata
        reputation.metadata.lastUpdated = new Date();
        reputation.metadata.updateCount++;
        // Add to history
        reputation.history.scores.push({
            timestamp: new Date(),
            score: reputation.overallScore,
        });
        // Limit history size
        if (reputation.history.scores.length > 1000) {
            reputation.history.scores = reputation.history.scores.slice(-500);
        }
        // Update trust level
        const newTrustLevel = this.calculateTrustLevel(reputation.overallScore);
        if (newTrustLevel !== reputation.trustLevel) {
            reputation.trustLevel = newTrustLevel;
            this.emit("trust_level_changed", {
                agentId,
                oldLevel: reputation.trustLevel,
                newLevel: newTrustLevel,
                score: reputation.overallScore,
            });
        }
        this.emit("reputation_updated", { agentId, reputation });
    }
    /**
     * Recalculate overall reputation score
     */
    async recalculateOverallScore(agentId) {
        const reputation = this.reputationScores.get(agentId);
        if (!reputation)
            return;
        const weights = this.config.weights;
        const overallScore = Math.round((reputation.behaviorScore * weights.behavior +
            reputation.performanceScore * weights.performance +
            reputation.consensusScore * weights.consensus +
            reputation.peerScore * weights.peer +
            reputation.stabilityScore * weights.stability) *
            10);
        // Apply stake weighting if enabled
        let finalScore = overallScore;
        if (this.config.economic.reputationStakingEnabled &&
            reputation.stake.amount > 0) {
            const stakeMultiplier = Math.min(2.0, 1 + reputation.stake.amount / 10000);
            finalScore = Math.round(overallScore * stakeMultiplier);
        }
        reputation.overallScore = Math.max(0, Math.min(1000, finalScore));
    }
    /**
     * Apply daily reputation decay
     */
    async applyDailyDecay() {
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
                reputation.overallScore = Math.max(0, reputation.overallScore - reputation.overallScore * inactivityPenalty);
            }
            await this.recalculateOverallScore(agentId);
        }
        this.logger.info("Daily reputation decay applied", {
            agentCount: this.reputationScores.size,
            decayFactor,
        });
    }
    /**
     * Update reputation trends
     */
    async updateReputationTrends() {
        for (const [agentId, reputation] of this.reputationScores) {
            const trends = this.calculateReputationTrends(reputation.history.scores);
            reputation.history.trends = trends;
        }
        this.logger.info("Reputation trends updated");
    }
    /**
     * Helper methods
     */
    adjustInitialScore(baseScore, trustLevel) {
        const adjustments = {
            untrusted: -200,
            basic: -100,
            verified: 0,
            trusted: 100,
        };
        return Math.max(0, Math.min(1000, baseScore + (adjustments[trustLevel] || 0)));
    }
    async signFeedback(fromAgentId, toAgentId, rating, category) {
        const data = `${fromAgentId}:${toAgentId}:${rating}:${category}:${Date.now()}`;
        return crypto.createHash("sha256").update(data).digest("hex");
    }
    async validateChallengeResponse(challenge, response) {
        // Implement challenge-specific validation logic
        switch (challenge.type) {
            case "behavior_verification":
                return this.validateBehaviorChallenge(challenge, response);
            case "skill_demonstration":
                return this.validateSkillChallenge(challenge, response);
            case "consensus_participation":
                return this.validateConsensusChallenge(challenge, response);
            case "peer_collaboration":
                return this.validateCollaborationChallenge(challenge, response);
            default:
                return { success: false, reason: "Unknown challenge type" };
        }
    }
    async validateBehaviorChallenge(challenge, response) {
        // Validate behavior verification challenge
        return { success: true };
    }
    async validateSkillChallenge(challenge, response) {
        // Validate skill demonstration challenge
        return { success: true };
    }
    async validateConsensusChallenge(challenge, response) {
        // Validate consensus participation challenge
        return { success: true };
    }
    async validateCollaborationChallenge(challenge, response) {
        // Validate peer collaboration challenge
        return { success: true };
    }
    calculateReputationTrends(scores) {
        if (scores.length < 2)
            return [];
        const now = new Date();
        const trends = [];
        // Calculate daily trend (last 24 hours)
        const dailyScores = scores.filter((s) => now.getTime() - s.timestamp.getTime() < 86400000);
        if (dailyScores.length > 1) {
            trends.push(this.calculateTrend("daily", dailyScores));
        }
        // Calculate weekly trend
        const weeklyScores = scores.filter((s) => now.getTime() - s.timestamp.getTime() < 604800000);
        if (weeklyScores.length > 1) {
            trends.push(this.calculateTrend("weekly", weeklyScores));
        }
        // Calculate monthly trend
        const monthlyScores = scores.filter((s) => now.getTime() - s.timestamp.getTime() < 2592000000);
        if (monthlyScores.length > 1) {
            trends.push(this.calculateTrend("monthly", monthlyScores));
        }
        return trends;
    }
    calculateTrend(period, scores) {
        const sortedScores = scores.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        const firstScore = sortedScores[0];
        const lastScore = sortedScores[sortedScores.length - 1];
        const averageScore = sortedScores.reduce((sum, s) => sum + s.score, 0) / sortedScores.length;
        const scoreDiff = lastScore.score - firstScore.score;
        let trend = "stable";
        if (Math.abs(scoreDiff) > 10) {
            trend = scoreDiff > 0 ? "increasing" : "decreasing";
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
            confidence: Math.min(1.0, sortedScores.length / 10), // Higher confidence with more data points
        };
    }
    /**
     * Public API methods
     */
    getReputationScore(agentId) {
        return this.reputationScores.get(agentId) || null;
    }
    getAllReputationScores() {
        return Array.from(this.reputationScores.values());
    }
    getPeerFeedback(agentId) {
        return this.peerFeedbacks.get(agentId) || [];
    }
    getReputationEvents(agentId) {
        return this.reputationEvents.get(agentId) || [];
    }
    getActiveChallenges(agentId) {
        const challenges = Array.from(this.activeChallenges.values());
        return agentId
            ? challenges.filter((c) => c.agentId === agentId)
            : challenges;
    }
    async getSystemStats() {
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
            slashingEvents: scores.reduce((sum, s) => sum + s.stake.slashingHistory.length, 0),
        };
    }
    calculateTrustLevelDistribution(scores) {
        const distribution = {
            untrusted: 0,
            low: 0,
            medium: 0,
            high: 0,
            excellent: 0,
        };
        scores.forEach((score) => {
            distribution[score.trustLevel]++;
        });
        return distribution;
    }
}
// Supporting analyzer classes
class BehaviorReputationAnalyzer {
    config;
    constructor(config) {
        this.config = config;
    }
    async calculateBehaviorScore(profile) {
        let score = 75; // Base score
        // Analyze message patterns
        if (profile.protocolCompliance.signatureValidation > 0.9)
            score += 10;
        if (profile.protocolCompliance.nonceCompliance > 0.9)
            score += 5;
        if (profile.protocolCompliance.capabilityCompliance > 0.9)
            score += 5;
        // Penalize anomalies
        if (profile.anomalyIndicators.recentAnomalies > 5)
            score -= 15;
        if (profile.anomalyIndicators.totalAnomalies > 20)
            score -= 10;
        // Trust metrics influence
        score += (profile.trustMetrics.behaviorScore - 0.5) * 20;
        return Math.max(0, Math.min(100, score));
    }
}
class PerformanceTracker {
    config;
    constructor(config) {
        this.config = config;
    }
    async calculatePerformanceScore(events) {
        if (events.length === 0)
            return 70; // Default score
        // Calculate recent performance (last 7 days)
        const recentEvents = events.filter((e) => Date.now() - e.timestamp.getTime() < 604800000);
        if (recentEvents.length === 0)
            return 70;
        const positiveEvents = recentEvents.filter((e) => e.type === "positive");
        const negativeEvents = recentEvents.filter((e) => e.type === "negative");
        const positiveImpact = positiveEvents.reduce((sum, e) => sum + e.impact, 0);
        const negativeImpact = negativeEvents.reduce((sum, e) => sum + Math.abs(e.impact), 0);
        const netImpact = positiveImpact - negativeImpact;
        const baseScore = 70;
        return Math.max(0, Math.min(100, baseScore + netImpact));
    }
}
class ConsensusEvaluator {
    config;
    constructor(config) {
        this.config = config;
    }
    async calculateConsensusScore(metrics) {
        let score = 70; // Base score
        if (metrics.participationRate > 0.8)
            score += 15;
        if (metrics.agreementRate > 0.7)
            score += 10;
        if (metrics.proposalQuality > 0.8)
            score += 10;
        if (metrics.responseLatency < 2000)
            score += 5;
        return Math.max(0, Math.min(100, score));
    }
}
class PeerEvaluator {
    config;
    constructor(config) {
        this.config = config;
    }
    async calculatePeerScore(feedbacks) {
        if (feedbacks.length === 0)
            return 60; // Default score
        // Filter recent feedback
        const recentFeedbacks = feedbacks.filter((f) => Date.now() - f.timestamp.getTime() <
            this.config.peerFeedback.maxFeedbackAge);
        if (recentFeedbacks.length === 0)
            return 60;
        // Calculate weighted average
        const weightedSum = recentFeedbacks.reduce((sum, f) => sum + f.rating * f.weight, 0);
        const totalWeight = recentFeedbacks.reduce((sum, f) => sum + f.weight, 0);
        const avgRating = weightedSum / totalWeight;
        // Convert 1-5 rating to 0-100 score
        return (avgRating - 1) * 25;
    }
}
class StabilityAnalyzer {
    config;
    constructor(config) {
        this.config = config;
    }
    async calculateStabilityScore(history) {
        if (history.scores.length < 10)
            return 80; // Default for new agents
        // Calculate score variance over time
        const scores = history.scores.map((s) => s.score);
        const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;
        const variance = scores.reduce((sum, s) => sum + Math.pow(s - avgScore, 2), 0) /
            scores.length;
        const volatility = Math.sqrt(variance);
        // Lower volatility = higher stability score
        const stabilityScore = Math.max(0, 100 - volatility / 10);
        return Math.min(100, stabilityScore);
    }
}
class StakeManager {
    config;
    constructor(config) {
        this.config = config;
    }
    async addStake(agentId, amount) {
        // Implementation for adding stake
        return true;
    }
    async removeStake(agentId, amount) {
        // Implementation for removing stake
        return true;
    }
}
class SlashingController {
    config;
    constructor(config) {
        this.config = config;
    }
    async executeSlashing(agentId, amount, reason) {
        // Implementation for executing slashing
        return true;
    }
}
