/**
 * Malicious Agent Detection System
 * Implements sophisticated algorithms to identify and isolate bad actors
 * in the Byzantine consensus network
 */
import { EventEmitter } from "events";
export class MaliciousDetection extends EventEmitter {
    reputationScores = new Map();
    behaviorHistory = new Map();
    detectionRules = new Map();
    securityAlerts = [];
    quarantinedAgents = new Set();
    suspiciousAgents = new Set();
    // Detection parameters
    REPUTATION_THRESHOLD = 0.3;
    CONFIDENCE_THRESHOLD = 0.7;
    TIME_WINDOW_MS = 300000; // 5 minutes
    MAX_MESSAGES_PER_WINDOW = 100;
    constructor() {
        super();
        this.initializeDetectionRules();
    }
    /**
     * Initialize default detection rules
     */
    initializeDetectionRules() {
        const rules = [
            {
                id: "double-voting",
                name: "Double Voting Detection",
                type: "double-voting",
                condition: this.detectDoubleVoting.bind(this),
                confidence: 0.95,
                enabled: true,
            },
            {
                id: "conflicting-messages",
                name: "Conflicting Message Detection",
                type: "conflicting-messages",
                condition: this.detectConflictingMessages.bind(this),
                confidence: 0.85,
                enabled: true,
            },
            {
                id: "timing-manipulation",
                name: "Timing Manipulation Detection",
                type: "timing-manipulation",
                condition: this.detectTimingManipulation.bind(this),
                confidence: 0.75,
                enabled: true,
            },
            {
                id: "spam-flooding",
                name: "Spam Flooding Detection",
                type: "spam-flooding",
                condition: this.detectSpamFlooding.bind(this),
                confidence: 0.8,
                enabled: true,
            },
            {
                id: "collusion",
                name: "Collusion Detection",
                type: "collusion",
                condition: this.detectCollusion.bind(this),
                confidence: 0.7,
                enabled: true,
            },
            {
                id: "view-change-abuse",
                name: "View Change Abuse Detection",
                type: "view-change-abuse",
                condition: this.detectViewChangeAbuse.bind(this),
                confidence: 0.8,
                enabled: true,
            },
        ];
        rules.forEach((rule) => this.detectionRules.set(rule.id, rule));
    }
    /**
     * Register an agent for monitoring
     */
    registerAgent(agent) {
        if (!this.reputationScores.has(agent.id)) {
            this.reputationScores.set(agent.id, {
                agentId: agent.id,
                currentScore: 1.0, // Start with perfect reputation
                historicalScores: [{ timestamp: new Date(), score: 1.0 }],
                trustLevel: "medium",
                behaviorFlags: new Set(),
                interactionHistory: new Map(),
            });
            this.behaviorHistory.set(agent.id, []);
        }
    }
    /**
     * Analyze agent behavior for malicious activity
     */
    async analyzeBehavior(agentId, messages, votes) {
        const agent = await this.getAgentInfo(agentId);
        if (!agent) {
            throw new Error("Agent not found");
        }
        const detectedBehaviors = [];
        const now = new Date();
        const timeWindow = {
            start: new Date(now.getTime() - this.TIME_WINDOW_MS),
            end: now,
        };
        const context = {
            agent,
            messages: messages.filter((m) => m.timestamp >= timeWindow.start && m.timestamp <= timeWindow.end),
            votes: votes.filter((v) => v.timestamp >= timeWindow.start && v.timestamp <= timeWindow.end),
            timeWindow,
            networkState: {}, // Would be populated with actual network state
        };
        // Run all enabled detection rules
        for (const rule of this.detectionRules.values()) {
            if (!rule.enabled)
                continue;
            try {
                if (rule.condition(context)) {
                    const behavior = {
                        type: rule.type,
                        agentId,
                        severity: this.calculateSeverity(rule.type, rule.confidence),
                        evidence: this.collectEvidence(rule.type, context),
                        timestamp: new Date(),
                        confidence: rule.confidence,
                        description: `${rule.name} triggered for agent ${agentId}`,
                    };
                    detectedBehaviors.push(behavior);
                    await this.recordMaliciousBehavior(behavior);
                }
            }
            catch (error) {
                console.error(`Error in detection rule ${rule.id}:`, error);
            }
        }
        return detectedBehaviors;
    }
    /**
     * Detect double voting
     */
    detectDoubleVoting(context) {
        const votesByProposal = new Map();
        context.votes.forEach((vote) => {
            if (!votesByProposal.has(vote.proposalId)) {
                votesByProposal.set(vote.proposalId, []);
            }
            votesByProposal.get(vote.proposalId).push(vote);
        });
        // Check for multiple votes on same proposal
        for (const votes of votesByProposal.values()) {
            if (votes.length > 1) {
                return true;
            }
        }
        return false;
    }
    /**
     * Detect conflicting messages
     */
    detectConflictingMessages(context) {
        const messagesByType = new Map();
        context.messages.forEach((msg) => {
            const key = `${msg.type}-${msg.viewNumber}-${msg.sequenceNumber}`;
            if (!messagesByType.has(key)) {
                messagesByType.set(key, []);
            }
            messagesByType.get(key).push(msg);
        });
        // Check for conflicting messages of same type/view/sequence
        for (const messages of messagesByType.values()) {
            if (messages.length > 1) {
                // Check if messages have different digests (conflicting)
                const digests = new Set(messages.map((m) => m.digest));
                if (digests.size > 1) {
                    return true;
                }
            }
        }
        return false;
    }
    /**
     * Detect timing manipulation
     */
    detectTimingManipulation(context) {
        if (context.messages.length < 2)
            return false;
        const timestamps = context.messages.map((m) => m.timestamp.getTime());
        timestamps.sort();
        // Check for messages sent too close together (likely pre-computed)
        for (let i = 1; i < timestamps.length; i++) {
            if (timestamps[i] - timestamps[i - 1] < 10) {
                // Less than 10ms apart
                return true;
            }
        }
        // Check for messages sent at suspicious regular intervals
        if (timestamps.length >= 5) {
            const intervals = [];
            for (let i = 1; i < timestamps.length; i++) {
                intervals.push(timestamps[i] - timestamps[i - 1]);
            }
            const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            const variance = intervals.reduce((acc, interval) => acc + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
            // Very low variance suggests artificial timing
            if (variance < 100) {
                return true;
            }
        }
        return false;
    }
    /**
     * Detect spam flooding
     */
    detectSpamFlooding(context) {
        return context.messages.length > this.MAX_MESSAGES_PER_WINDOW;
    }
    /**
     * Detect collusion patterns
     */
    detectCollusion(context) {
        if (context.votes.length < 2)
            return false;
        // Check for identical voting patterns across multiple proposals
        const votingPatterns = new Map();
        context.votes.forEach((vote) => {
            const pattern = `${vote.decision}-${vote.weight}`;
            votingPatterns.set(pattern, (votingPatterns.get(pattern) || 0) + 1);
        });
        // If more than 80% of votes follow the same pattern, it's suspicious
        const maxPattern = Math.max(...votingPatterns.values());
        return maxPattern / context.votes.length > 0.8;
    }
    /**
     * Detect view change abuse
     */
    detectViewChangeAbuse(context) {
        const viewChangeMessages = context.messages.filter((m) => m.type === "view-change");
        // Too many view change requests in short time
        if (viewChangeMessages.length > 3) {
            return true;
        }
        // View changes without proper justification
        return viewChangeMessages.some((msg) => !msg.payload || !msg.payload.lastCommitted);
    }
    /**
     * Record malicious behavior
     */
    async recordMaliciousBehavior(behavior) {
        if (!this.behaviorHistory.has(behavior.agentId)) {
            this.behaviorHistory.set(behavior.agentId, []);
        }
        this.behaviorHistory.get(behavior.agentId).push(behavior);
        // Update reputation score
        await this.updateReputationScore(behavior.agentId, behavior);
        // Create security alert
        const alert = this.createSecurityAlert(behavior);
        this.securityAlerts.push(alert);
        // Take mitigation actions
        await this.takeMitigationActions(behavior);
        this.emit("malicious-behavior-detected", behavior);
        this.emit("security-alert", alert);
    }
    /**
     * Update agent reputation score
     */
    async updateReputationScore(agentId, behavior) {
        const reputation = this.reputationScores.get(agentId);
        // Calculate reputation penalty based on behavior severity and confidence
        const penalty = this.calculateReputationPenalty(behavior);
        const newScore = Math.max(0, reputation.currentScore - penalty);
        reputation.currentScore = newScore;
        reputation.historicalScores.push({
            timestamp: new Date(),
            score: newScore,
        });
        // Update trust level
        reputation.trustLevel = this.calculateTrustLevel(newScore);
        // Add behavior flag
        reputation.behaviorFlags.add(behavior.type);
        // Check if agent should be quarantined
        if (newScore < this.REPUTATION_THRESHOLD) {
            this.quarantinedAgents.add(agentId);
            this.emit("agent-quarantined", agentId);
        }
        else if (newScore < 0.6) {
            this.suspiciousAgents.add(agentId);
        }
    }
    /**
     * Calculate reputation penalty
     */
    calculateReputationPenalty(behavior) {
        const basePenalties = {
            "double-voting": 0.3,
            "conflicting-messages": 0.25,
            "timing-manipulation": 0.15,
            "fake-signatures": 0.4,
            "spam-flooding": 0.2,
            collusion: 0.35,
            "view-change-abuse": 0.2,
            "consensus-disruption": 0.3,
            "sybil-attack": 0.5,
            "eclipse-attack": 0.45,
        };
        const basePenalty = basePenalties[behavior.type] || 0.1;
        const confidenceMultiplier = behavior.confidence;
        const severityMultiplier = {
            low: 0.5,
            medium: 1.0,
            high: 1.5,
            critical: 2.0,
        }[behavior.severity];
        return basePenalty * confidenceMultiplier * severityMultiplier;
    }
    /**
     * Calculate trust level based on reputation score
     */
    calculateTrustLevel(score) {
        if (score >= 0.9)
            return "verified";
        if (score >= 0.7)
            return "high";
        if (score >= 0.5)
            return "medium";
        if (score >= 0.3)
            return "low";
        return "untrusted";
    }
    /**
     * Calculate behavior severity
     */
    calculateSeverity(type, confidence) {
        const criticalTypes = ["sybil-attack", "eclipse-attack", "fake-signatures"];
        const highTypes = ["double-voting", "collusion", "consensus-disruption"];
        const mediumTypes = ["conflicting-messages", "view-change-abuse"];
        if (criticalTypes.includes(type) && confidence > 0.8)
            return "critical";
        if (highTypes.includes(type) && confidence > 0.7)
            return "high";
        if (mediumTypes.includes(type) && confidence > 0.6)
            return "medium";
        return "low";
    }
    /**
     * Collect evidence for detected behavior
     */
    collectEvidence(type, context) {
        const evidence = [];
        switch (type) {
            case "double-voting":
                const duplicateVotes = context.votes.filter((vote, index, arr) => arr.findIndex((v) => v.proposalId === vote.proposalId) !== index);
                evidence.push(...duplicateVotes);
                break;
            case "conflicting-messages":
                const conflictingMsgs = context.messages.filter((msg, index, arr) => {
                    const same = arr.filter((m) => m.type === msg.type &&
                        m.viewNumber === msg.viewNumber &&
                        m.sequenceNumber === msg.sequenceNumber);
                    return same.length > 1 && same.some((m) => m.digest !== msg.digest);
                });
                evidence.push(...conflictingMsgs);
                break;
            case "spam-flooding":
                evidence.push({
                    messageCount: context.messages.length,
                    timeWindow: context.timeWindow,
                    threshold: this.MAX_MESSAGES_PER_WINDOW,
                });
                break;
            default:
                evidence.push({
                    messages: context.messages,
                    votes: context.votes,
                    timeWindow: context.timeWindow,
                });
        }
        return evidence;
    }
    /**
     * Create security alert
     */
    createSecurityAlert(behavior) {
        return {
            id: this.generateAlertId(),
            type: "malicious-behavior",
            severity: behavior.severity,
            message: `${behavior.type} detected for agent ${behavior.agentId}`,
            affectedAgents: [behavior.agentId],
            timestamp: new Date(),
            mitigationActions: this.generateMitigationActions(behavior),
        };
    }
    /**
     * Generate mitigation actions
     */
    generateMitigationActions(behavior) {
        const actions = ["Log incident", "Update reputation score"];
        if (behavior.severity === "critical" || behavior.confidence > 0.9) {
            actions.push("Quarantine agent", "Notify network administrators");
        }
        else if (behavior.severity === "high") {
            actions.push("Flag as suspicious", "Increase monitoring");
        }
        return actions;
    }
    /**
     * Take mitigation actions
     */
    async takeMitigationActions(behavior) {
        if (behavior.severity === "critical" || behavior.confidence > 0.9) {
            this.quarantinedAgents.add(behavior.agentId);
        }
        else if (behavior.severity === "high") {
            this.suspiciousAgents.add(behavior.agentId);
        }
    }
    /**
     * Check if agent is trusted
     */
    isAgentTrusted(agentId) {
        if (this.quarantinedAgents.has(agentId))
            return false;
        const reputation = this.reputationScores.get(agentId);
        return reputation
            ? reputation.currentScore >= this.REPUTATION_THRESHOLD
            : false;
    }
    /**
     * Get agent reputation
     */
    getAgentReputation(agentId) {
        return this.reputationScores.get(agentId);
    }
    /**
     * Get security alerts
     */
    getSecurityAlerts(limit) {
        const alerts = [...this.securityAlerts].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        return limit ? alerts.slice(0, limit) : alerts;
    }
    /**
     * Get quarantined agents
     */
    getQuarantinedAgents() {
        return Array.from(this.quarantinedAgents);
    }
    /**
     * Rehabilitate agent (restore reputation)
     */
    rehabilitateAgent(agentId, reason) {
        if (!this.reputationScores.has(agentId))
            return false;
        const reputation = this.reputationScores.get(agentId);
        reputation.currentScore = Math.min(1.0, reputation.currentScore + 0.2);
        reputation.trustLevel = this.calculateTrustLevel(reputation.currentScore);
        this.quarantinedAgents.delete(agentId);
        this.suspiciousAgents.delete(agentId);
        this.emit("agent-rehabilitated", { agentId, reason });
        return true;
    }
    generateAlertId() {
        return `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    async getAgentInfo(agentId) {
        // This would be implemented to fetch actual agent info
        // For now, return a mock agent
        return {
            id: agentId,
            publicKey: `pubkey-${agentId}`,
            isLeader: false,
            reputation: this.reputationScores.get(agentId)?.currentScore || 1.0,
            lastActiveTime: new Date(),
        };
    }
    /**
     * Get detection statistics
     */
    getDetectionStatistics() {
        const allBehaviors = Array.from(this.behaviorHistory.values()).flat();
        const detectionsByType = {};
        allBehaviors.forEach((behavior) => {
            detectionsByType[behavior.type] =
                (detectionsByType[behavior.type] || 0) + 1;
        });
        const reputationScores = Array.from(this.reputationScores.values());
        const averageReputationScore = reputationScores.length > 0
            ? reputationScores.reduce((sum, rep) => sum + rep.currentScore, 0) /
                reputationScores.length
            : 0;
        return {
            totalDetections: allBehaviors.length,
            detectionsByType,
            quarantinedCount: this.quarantinedAgents.size,
            suspiciousCount: this.suspiciousAgents.size,
            averageReputationScore,
        };
    }
}
export default MaliciousDetection;
