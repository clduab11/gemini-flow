/**
 * Quarantine and Recovery System for A2A Protocol
 *
 * Implements comprehensive quarantine and recovery mechanisms for
 * compromised agents, providing secure isolation, rehabilitation
 * challenges, and graduated recovery processes.
 *
 * Features:
 * - Multi-level quarantine isolation (soft, hard, complete)
 * - Progressive recovery challenges and verification
 * - Behavioral rehabilitation programs
 * - Automated recovery monitoring and assessment
 * - Economic incentives and penalties for recovery
 * - Distributed consensus for quarantine and recovery decisions
 */
import { EventEmitter } from "events";
import crypto from "crypto";
import { Logger } from "../../../utils/logger.js";
export class QuarantineRecoveryManager extends EventEmitter {
    logger;
    quarantineLevels = new Map();
    quarantineRecords = new Map(); // agentId -> record
    recoveryChallenges = new Map(); // challengeId -> challenge
    peerEndorsements = new Map(); // agentId -> endorsements
    recoveryPlans = new Map(); // agentId -> plan
    // Monitoring and assessment
    behaviorMonitor;
    recoveryAssessor;
    challengeValidator;
    endorsementValidator;
    // Configuration
    config = {
        quarantine: {
            defaultLevel: "soft",
            maxExtensions: 3,
            escalationThreshold: 3, // Violations before escalation
            permanentThreshold: 10, // Violations before permanent ban
            reviewInterval: 3600000, // 1 hour review interval
        },
        recovery: {
            maxAttempts: 3,
            challengeTimeout: 3600000, // 1 hour per challenge
            endorsementValidityPeriod: 2592000000, // 30 days
            minimumRecoveryTime: 86400000, // 24 hours minimum
            maxRecoveryTime: 2592000000, // 30 days maximum
        },
        monitoring: {
            activityThreshold: 0.1, // Minimum activity level
            complianceThreshold: 0.8, // Minimum compliance score
            assessmentInterval: 1800000, // 30 minutes
            violationGracePeriod: 300000, // 5 minutes grace period
        },
    };
    constructor() {
        super();
        this.logger = new Logger("QuarantineRecoveryManager");
        this.initializeQuarantineLevels();
        this.initializeComponents();
        this.startMonitoring();
        this.logger.info("Quarantine Recovery Manager initialized", {
            features: [
                "multi-level-quarantine",
                "progressive-recovery",
                "behavioral-rehabilitation",
                "peer-endorsements",
                "economic-incentives",
                "automated-monitoring",
            ],
            levels: Array.from(this.quarantineLevels.keys()),
        });
    }
    /**
     * Initialize quarantine levels
     */
    initializeQuarantineLevels() {
        // Observation Level - Minimal restrictions
        this.quarantineLevels.set("observation", {
            level: "observation",
            name: "Observation",
            description: "Monitoring with minimal restrictions",
            restrictions: {
                messageRateLimit: 50,
                allowedOperations: ["read", "status", "query"],
                networkAccess: true,
                consensusParticipation: true,
                peerInteraction: true,
                resourceAccess: ["public", "shared"],
            },
            duration: {
                minimum: 3600000, // 1 hour
                maximum: 86400000, // 24 hours
                extendable: true,
            },
            recoveryRequirements: {
                challengesRequired: 1,
                peerEndorsements: 1,
                behaviorScore: 0.6,
                proofOfWork: false,
                economicStake: 0,
            },
        });
        // Soft Quarantine - Moderate restrictions
        this.quarantineLevels.set("soft", {
            level: "soft",
            name: "Soft Quarantine",
            description: "Limited operations with monitoring",
            restrictions: {
                messageRateLimit: 20,
                allowedOperations: ["read", "status"],
                networkAccess: true,
                consensusParticipation: false,
                peerInteraction: true,
                resourceAccess: ["public"],
            },
            duration: {
                minimum: 86400000, // 24 hours
                maximum: 604800000, // 7 days
                extendable: true,
            },
            recoveryRequirements: {
                challengesRequired: 3,
                peerEndorsements: 2,
                behaviorScore: 0.7,
                proofOfWork: true,
                economicStake: 1000,
            },
        });
        // Hard Quarantine - Severe restrictions
        this.quarantineLevels.set("hard", {
            level: "hard",
            name: "Hard Quarantine",
            description: "Severe restrictions with supervised access",
            restrictions: {
                messageRateLimit: 5,
                allowedOperations: ["status"],
                networkAccess: false,
                consensusParticipation: false,
                peerInteraction: false,
                resourceAccess: [],
            },
            duration: {
                minimum: 604800000, // 7 days
                maximum: 2592000000, // 30 days
                extendable: true,
            },
            recoveryRequirements: {
                challengesRequired: 5,
                peerEndorsements: 5,
                behaviorScore: 0.8,
                proofOfWork: true,
                economicStake: 5000,
            },
        });
        // Complete Isolation - Total isolation
        this.quarantineLevels.set("complete", {
            level: "complete",
            name: "Complete Isolation",
            description: "Total isolation from the system",
            restrictions: {
                messageRateLimit: 0,
                allowedOperations: [],
                networkAccess: false,
                consensusParticipation: false,
                peerInteraction: false,
                resourceAccess: [],
            },
            duration: {
                minimum: 2592000000, // 30 days
                maximum: 7776000000, // 90 days
                extendable: false,
            },
            recoveryRequirements: {
                challengesRequired: 10,
                peerEndorsements: 10,
                behaviorScore: 0.9,
                proofOfWork: true,
                economicStake: 10000,
            },
        });
    }
    /**
     * Initialize monitoring components
     */
    initializeComponents() {
        this.behaviorMonitor = new BehaviorMonitor(this.config);
        this.recoveryAssessor = new RecoveryAssessor(this.config);
        this.challengeValidator = new ChallengeValidator(this.config);
        this.endorsementValidator = new EndorsementValidator(this.config);
    }
    /**
     * Start monitoring loops
     */
    startMonitoring() {
        // Monitor quarantined agents
        setInterval(async () => {
            await this.monitorQuarantinedAgents();
        }, this.config.monitoring.assessmentInterval);
        // Review quarantine status
        setInterval(async () => {
            await this.reviewQuarantineStatus();
        }, this.config.quarantine.reviewInterval);
        // Process recovery challenges
        setInterval(async () => {
            await this.processRecoveryChallenges();
        }, 60000); // Every minute
    }
    /**
     * Quarantine an agent
     */
    async quarantineAgent(agentId, level, reason, evidence, detectionResult, createdBy = "system") {
        const existingRecord = this.quarantineRecords.get(agentId);
        if (existingRecord && existingRecord.status === "active") {
            // Escalate existing quarantine
            return await this.escalateQuarantine(agentId, level, reason, evidence);
        }
        const quarantineLevel = this.quarantineLevels.get(level);
        if (!quarantineLevel) {
            throw new Error(`Invalid quarantine level: ${level}`);
        }
        const record = {
            agentId,
            quarantineId: crypto.randomUUID(),
            level,
            startTime: new Date(),
            reason,
            evidence,
            detectionResult,
            status: "active",
            extensions: [],
            violations: [],
            recoveryProgress: {
                challengesCompleted: 0,
                challengesFailed: 0,
                peerEndorsements: 0,
                behaviorScore: 0.0,
                stakePledged: 0,
                recoveryAttempts: 0,
            },
            monitoring: {
                activityLevel: 0,
                complianceScore: 1.0,
                communicationPatterns: [],
                resourceUsage: [],
                lastActivity: new Date(),
            },
            metadata: {
                createdBy,
                approvedBy: [createdBy],
                reviewedBy: [],
                lastUpdated: new Date(),
                notes: [`Initial quarantine: ${reason}`],
            },
        };
        this.quarantineRecords.set(agentId, record);
        // Create recovery plan
        const recoveryPlan = await this.createRecoveryPlan(agentId, quarantineLevel);
        this.recoveryPlans.set(agentId, recoveryPlan);
        // Schedule automatic review
        this.scheduleQuarantineReview(agentId, quarantineLevel.duration.minimum);
        this.logger.error("Agent quarantined", {
            agentId,
            level,
            reason,
            quarantineId: record.quarantineId,
            duration: `${quarantineLevel.duration.minimum}ms - ${quarantineLevel.duration.maximum}ms`,
        });
        this.emit("agent_quarantined", {
            agentId,
            record,
            recoveryPlan,
        });
        return record;
    }
    /**
     * Create recovery plan for quarantined agent
     */
    async createRecoveryPlan(agentId, quarantineLevel) {
        const phases = this.generateRecoveryPhases(quarantineLevel);
        const plan = {
            planId: crypto.randomUUID(),
            agentId,
            targetLevel: "full_recovery",
            estimatedDuration: this.calculateRecoveryDuration(quarantineLevel),
            phases,
            requirements: {
                totalChallenges: quarantineLevel.recoveryRequirements.challengesRequired,
                minimumScore: 0.8,
                peerEndorsements: quarantineLevel.recoveryRequirements.peerEndorsements,
                behaviorThreshold: quarantineLevel.recoveryRequirements.behaviorScore,
                economicStake: quarantineLevel.recoveryRequirements.economicStake,
            },
            progress: {
                currentPhase: 0,
                overallProgress: 0,
                phasesCompleted: 0,
                challengesCompleted: 0,
                endorsementsReceived: 0,
            },
            status: "active",
            createdAt: new Date(),
            lastUpdated: new Date(),
        };
        // Generate challenges for each phase
        for (const phase of phases) {
            const challenges = await this.generatePhaseChallenges(agentId, phase, quarantineLevel);
            phase.challenges = challenges.map((c) => c.challengeId);
            // Store challenges
            challenges.forEach((challenge) => {
                this.recoveryChallenges.set(challenge.challengeId, challenge);
            });
        }
        return plan;
    }
    /**
     * Submit recovery challenge response
     */
    async submitChallengeResponse(challengeId, agentId, response) {
        const challenge = this.recoveryChallenges.get(challengeId);
        const record = this.quarantineRecords.get(agentId);
        if (!challenge || !record || challenge.agentId !== agentId) {
            throw new Error("Invalid challenge or agent not quarantined");
        }
        if (challenge.status !== "pending" && challenge.status !== "in_progress") {
            throw new Error(`Challenge cannot be submitted: ${challenge.status}`);
        }
        // Check attempt limits
        if (challenge.attempts.length >= challenge.maxAttempts) {
            throw new Error("Maximum attempts exceeded");
        }
        // Mark as in progress
        challenge.status = "in_progress";
        const attempt = {
            attemptId: crypto.randomUUID(),
            startTime: new Date(),
            response,
            score: 0,
            feedback: "",
            reviewedBy: "system",
            evidence: {},
        };
        try {
            // Validate and score the response
            const validation = await this.challengeValidator.validateResponse(challenge, response);
            attempt.score = validation.score;
            attempt.feedback = validation.feedback;
            attempt.evidence = validation.evidence;
            attempt.endTime = new Date();
            challenge.attempts.push(attempt);
            if (validation.score >= challenge.passingScore) {
                // Challenge passed
                challenge.status = "completed";
                challenge.finalScore = validation.score;
                challenge.completedAt = new Date();
                // Update recovery progress
                record.recoveryProgress.challengesCompleted++;
                // Check if phase is complete
                await this.checkPhaseCompletion(agentId);
                this.logger.info("Recovery challenge completed", {
                    agentId,
                    challengeId,
                    score: validation.score,
                    type: challenge.type,
                });
                this.emit("challenge_completed", {
                    agentId,
                    challenge,
                    attempt,
                    validation,
                });
                return {
                    success: true,
                    score: validation.score,
                    feedback: validation.feedback,
                };
            }
            else {
                // Challenge failed
                if (challenge.attempts.length >= challenge.maxAttempts) {
                    challenge.status = "failed";
                    record.recoveryProgress.challengesFailed++;
                    this.logger.warn("Recovery challenge failed permanently", {
                        agentId,
                        challengeId,
                        attempts: challenge.attempts.length,
                        maxAttempts: challenge.maxAttempts,
                    });
                }
                return {
                    success: false,
                    score: validation.score,
                    feedback: validation.feedback,
                };
            }
        }
        catch (error) {
            attempt.endTime = new Date();
            attempt.feedback = `Validation error: ${error.message}`;
            challenge.attempts.push(attempt);
            challenge.status = "pending"; // Allow retry
            this.logger.error("Challenge validation failed", {
                agentId,
                challengeId,
                error,
            });
            throw error;
        }
    }
    /**
     * Submit peer endorsement
     */
    async submitPeerEndorsement(fromAgentId, toAgentId, type, strength, message, evidence) {
        const record = this.quarantineRecords.get(toAgentId);
        if (!record || record.status !== "active") {
            throw new Error("Agent not in active quarantine");
        }
        // Validate endorser
        const isValidEndorser = await this.endorsementValidator.validateEndorser(fromAgentId, toAgentId);
        if (!isValidEndorser) {
            this.logger.warn("Invalid endorser", { fromAgentId, toAgentId });
            return false;
        }
        const endorsement = {
            endorsementId: crypto.randomUUID(),
            fromAgentId,
            toAgentId,
            type,
            strength,
            message,
            evidence,
            timestamp: new Date(),
            signature: await this.signEndorsement(fromAgentId, toAgentId, type, strength),
            validated: true,
            validatedBy: "system",
            weight: await this.calculateEndorsementWeight(fromAgentId),
        };
        // Store endorsement
        const endorsements = this.peerEndorsements.get(toAgentId) || [];
        endorsements.push(endorsement);
        this.peerEndorsements.set(toAgentId, endorsements);
        // Update recovery progress
        record.recoveryProgress.peerEndorsements++;
        this.logger.info("Peer endorsement submitted", {
            fromAgent: fromAgentId,
            toAgent: toAgentId,
            type,
            strength,
            weight: endorsement.weight,
        });
        this.emit("peer_endorsement", endorsement);
        return true;
    }
    /**
     * Check agent's recovery eligibility
     */
    async checkRecoveryEligibility(agentId) {
        const record = this.quarantineRecords.get(agentId);
        const plan = this.recoveryPlans.get(agentId);
        if (!record || !plan) {
            return {
                eligible: false,
                progress: 0,
                missingRequirements: ["Agent not in quarantine"],
                estimatedTimeRemaining: 0,
            };
        }
        const quarantineLevel = this.quarantineLevels.get(record.level);
        const requirements = quarantineLevel.recoveryRequirements;
        const progress = record.recoveryProgress;
        const missingRequirements = [];
        // Check minimum time requirement
        const timeInQuarantine = Date.now() - record.startTime.getTime();
        if (timeInQuarantine < quarantineLevel.duration.minimum) {
            missingRequirements.push(`Minimum time not met (${Math.ceil((quarantineLevel.duration.minimum - timeInQuarantine) / 3600000)} hours remaining)`);
        }
        // Check challenge requirements
        if (progress.challengesCompleted < requirements.challengesRequired) {
            missingRequirements.push(`Challenges: ${progress.challengesCompleted}/${requirements.challengesRequired}`);
        }
        // Check peer endorsements
        if (progress.peerEndorsements < requirements.peerEndorsements) {
            missingRequirements.push(`Endorsements: ${progress.peerEndorsements}/${requirements.peerEndorsements}`);
        }
        // Check behavior score
        if (progress.behaviorScore < requirements.behaviorScore) {
            missingRequirements.push(`Behavior score: ${progress.behaviorScore.toFixed(2)}/${requirements.behaviorScore}`);
        }
        // Check economic stake
        if (requirements.economicStake > 0 &&
            progress.stakePledged < requirements.economicStake) {
            missingRequirements.push(`Stake: ${progress.stakePledged}/${requirements.economicStake}`);
        }
        const overallProgress = this.calculateRecoveryProgress(record, requirements);
        const eligible = missingRequirements.length === 0;
        let estimatedTimeRemaining = 0;
        if (!eligible) {
            estimatedTimeRemaining = Math.max(0, quarantineLevel.duration.minimum - timeInQuarantine);
        }
        return {
            eligible,
            progress: overallProgress,
            missingRequirements,
            estimatedTimeRemaining,
        };
    }
    /**
     * Process recovery request
     */
    async processRecoveryRequest(agentId) {
        const eligibility = await this.checkRecoveryEligibility(agentId);
        if (!eligibility.eligible) {
            return {
                approved: false,
                reason: `Recovery requirements not met: ${eligibility.missingRequirements.join(", ")}`,
            };
        }
        const record = this.quarantineRecords.get(agentId);
        const quarantineLevel = this.quarantineLevels.get(record.level);
        // Determine new level based on performance
        let newLevel;
        const conditions = [];
        if (record.recoveryProgress.behaviorScore >= 0.9 &&
            record.violations.length === 0) {
            newLevel = "full_recovery";
        }
        else if (record.level === "complete") {
            newLevel = "hard";
            conditions.push("Continued monitoring for 30 days");
        }
        else if (record.level === "hard") {
            newLevel = "soft";
            conditions.push("Continued monitoring for 14 days");
        }
        else if (record.level === "soft") {
            newLevel = "observation";
            conditions.push("Continued monitoring for 7 days");
        }
        else {
            newLevel = "full_recovery";
        }
        // Update record
        if (newLevel === "full_recovery") {
            record.status = "recovered";
            record.endTime = new Date();
            this.quarantineRecords.delete(agentId);
            this.recoveryPlans.delete(agentId);
        }
        else {
            record.level = newLevel;
            record.metadata.notes.push(`Recovered to level: ${newLevel}`);
            record.metadata.lastUpdated = new Date();
        }
        this.logger.info("Recovery request processed", {
            agentId,
            approved: true,
            newLevel,
            previousLevel: record.level,
            conditions: conditions.length,
        });
        this.emit("recovery_processed", {
            agentId,
            approved: true,
            newLevel,
            record,
            conditions,
        });
        return {
            approved: true,
            newLevel,
            reason: "All recovery requirements met",
            conditions: conditions.length > 0 ? conditions : undefined,
        };
    }
    /**
     * Record quarantine violation
     */
    async recordViolation(agentId, type, description, evidence, severity = "moderate") {
        const record = this.quarantineRecords.get(agentId);
        if (!record)
            return;
        const violation = {
            violationId: crypto.randomUUID(),
            type,
            description,
            timestamp: new Date(),
            evidence,
            severity,
            penalty: this.calculateViolationPenalty(severity, record.violations.length),
        };
        record.violations.push(violation);
        record.metadata.lastUpdated = new Date();
        record.metadata.notes.push(`Violation: ${description}`);
        // Apply penalties
        if (violation.penalty.timeExtension) {
            await this.extendQuarantine(agentId, violation.penalty.timeExtension, `Violation penalty: ${description}`, evidence);
        }
        if (violation.penalty.levelEscalation) {
            await this.escalateQuarantine(agentId, this.getNextQuarantineLevel(record.level), `Escalated due to violation: ${description}`, evidence);
        }
        // Check for permanent ban
        if (record.violations.length >= this.config.quarantine.permanentThreshold) {
            record.status = "permanent";
            record.metadata.notes.push("Permanently banned due to excessive violations");
        }
        this.logger.warn("Quarantine violation recorded", {
            agentId,
            type,
            severity,
            violationCount: record.violations.length,
            penalty: violation.penalty,
        });
        this.emit("quarantine_violation", {
            agentId,
            violation,
            record,
        });
    }
    /**
     * Helper methods
     */
    generateRecoveryPhases(quarantineLevel) {
        const phases = [];
        // Phase 1: Compliance Assessment
        phases.push({
            phaseId: crypto.randomUUID(),
            name: "Compliance Assessment",
            description: "Demonstrate understanding of security policies and protocols",
            order: 1,
            duration: 86400000, // 24 hours
            challenges: [],
            requirements: {
                minChallengeScore: 0.7,
                requiredEndorsements: 0,
                behaviorThreshold: 0.6,
                noViolations: true,
            },
            status: "pending",
        });
        // Phase 2: Behavioral Demonstration
        if (quarantineLevel.recoveryRequirements.challengesRequired > 1) {
            phases.push({
                phaseId: crypto.randomUUID(),
                name: "Behavioral Demonstration",
                description: "Demonstrate positive behavioral patterns and peer cooperation",
                order: 2,
                duration: 172800000, // 48 hours
                challenges: [],
                requirements: {
                    minChallengeScore: 0.8,
                    requiredEndorsements: Math.floor(quarantineLevel.recoveryRequirements.peerEndorsements / 2),
                    behaviorThreshold: 0.7,
                    noViolations: true,
                },
                status: "pending",
            });
        }
        // Phase 3: Trust Rebuilding
        if (quarantineLevel.recoveryRequirements.challengesRequired > 3) {
            phases.push({
                phaseId: crypto.randomUUID(),
                name: "Trust Rebuilding",
                description: "Rebuild trust through consistent positive behavior and peer endorsements",
                order: 3,
                duration: 259200000, // 72 hours
                challenges: [],
                requirements: {
                    minChallengeScore: 0.85,
                    requiredEndorsements: quarantineLevel.recoveryRequirements.peerEndorsements,
                    behaviorThreshold: quarantineLevel.recoveryRequirements.behaviorScore,
                    noViolations: true,
                },
                status: "pending",
            });
        }
        return phases;
    }
    async generatePhaseChallenges(agentId, phase, quarantineLevel) {
        const challenges = [];
        switch (phase.name) {
            case "Compliance Assessment":
                challenges.push({
                    challengeId: crypto.randomUUID(),
                    agentId,
                    type: "security_audit",
                    name: "Security Policy Quiz",
                    description: "Complete a comprehensive quiz on security policies and protocols",
                    requirements: { questionsCount: 20, passingScore: 0.8 },
                    timeLimit: 3600000, // 1 hour
                    maxAttempts: 2,
                    passingScore: 0.8,
                    weight: 1.0,
                    status: "pending",
                    attempts: [],
                });
                break;
            case "Behavioral Demonstration":
                challenges.push({
                    challengeId: crypto.randomUUID(),
                    agentId,
                    type: "peer_collaboration",
                    name: "Peer Collaboration Task",
                    description: "Successfully collaborate with other agents on a assigned task",
                    requirements: { collaborators: 3, taskComplexity: "medium" },
                    timeLimit: 7200000, // 2 hours
                    maxAttempts: 2,
                    passingScore: 0.75,
                    weight: 0.6,
                    status: "pending",
                    attempts: [],
                });
                if (quarantineLevel.recoveryRequirements.proofOfWork) {
                    challenges.push({
                        challengeId: crypto.randomUUID(),
                        agentId,
                        type: "proof_of_work",
                        name: "Computational Proof of Work",
                        description: "Complete a computational challenge to demonstrate commitment",
                        requirements: { difficulty: 4, algorithm: "sha256" },
                        timeLimit: 3600000, // 1 hour
                        maxAttempts: 3,
                        passingScore: 1.0,
                        weight: 0.4,
                        status: "pending",
                        attempts: [],
                    });
                }
                break;
            case "Trust Rebuilding":
                challenges.push({
                    challengeId: crypto.randomUUID(),
                    agentId,
                    type: "behavioral_compliance",
                    name: "Extended Behavioral Compliance",
                    description: "Maintain consistent positive behavior over extended period",
                    requirements: { duration: 172800000, minScore: 0.9 }, // 48 hours
                    timeLimit: 259200000, // 72 hours
                    maxAttempts: 1,
                    passingScore: 0.9,
                    weight: 1.0,
                    status: "pending",
                    attempts: [],
                });
                break;
        }
        return challenges;
    }
    calculateRecoveryDuration(quarantineLevel) {
        const baseDuration = quarantineLevel.duration.minimum;
        const challengeTime = quarantineLevel.recoveryRequirements.challengesRequired * 3600000; // 1 hour per challenge
        const endorsementTime = quarantineLevel.recoveryRequirements.peerEndorsements * 1800000; // 30 min per endorsement
        return Math.max(baseDuration, challengeTime + endorsementTime);
    }
    async signEndorsement(fromAgentId, toAgentId, type, strength) {
        const data = `${fromAgentId}:${toAgentId}:${type}:${strength}:${Date.now()}`;
        return crypto.createHash("sha256").update(data).digest("hex");
    }
    async calculateEndorsementWeight(endorserAgentId) {
        // In a real implementation, this would calculate based on endorser's reputation
        return 1.0; // Default weight
    }
    calculateViolationPenalty(severity, violationCount) {
        const basePenalties = {
            minor: { timeExtension: 3600000 }, // 1 hour
            moderate: { timeExtension: 7200000 }, // 2 hours
            severe: { timeExtension: 86400000, levelEscalation: violationCount >= 2 }, // 24 hours
            critical: { timeExtension: 172800000, levelEscalation: true }, // 48 hours
        };
        const penalty = basePenalties[severity];
        // Increase penalties for repeat offenders
        if (violationCount > 3) {
            penalty.timeExtension *= 2;
        }
        return penalty;
    }
    getNextQuarantineLevel(currentLevel) {
        const escalation = {
            observation: "soft",
            soft: "hard",
            hard: "complete",
            complete: "complete", // Can't escalate further
        };
        return escalation[currentLevel];
    }
    calculateRecoveryProgress(record, requirements) {
        const weights = {
            challenges: 0.4,
            endorsements: 0.3,
            behavior: 0.2,
            stake: 0.1,
        };
        const challengeProgress = Math.min(1, record.recoveryProgress.challengesCompleted /
            requirements.challengesRequired);
        const endorsementProgress = Math.min(1, record.recoveryProgress.peerEndorsements / requirements.peerEndorsements);
        const behaviorProgress = Math.min(1, record.recoveryProgress.behaviorScore / requirements.behaviorScore);
        const stakeProgress = requirements.economicStake > 0
            ? Math.min(1, record.recoveryProgress.stakePledged / requirements.economicStake)
            : 1;
        return (challengeProgress * weights.challenges +
            endorsementProgress * weights.endorsements +
            behaviorProgress * weights.behavior +
            stakeProgress * weights.stake);
    }
    async checkPhaseCompletion(agentId) {
        const plan = this.recoveryPlans.get(agentId);
        if (!plan)
            return;
        const currentPhase = plan.phases[plan.progress.currentPhase];
        if (!currentPhase || currentPhase.status !== "active")
            return;
        // Check if all phase challenges are completed
        const phaseChallenges = currentPhase.challenges
            .map((id) => this.recoveryChallenges.get(id))
            .filter(Boolean);
        const completedChallenges = phaseChallenges.filter((c) => c.status === "completed");
        if (completedChallenges.length === phaseChallenges.length) {
            // Phase completed
            currentPhase.status = "completed";
            currentPhase.completedAt = new Date();
            plan.progress.phasesCompleted++;
            // Move to next phase
            if (plan.progress.currentPhase < plan.phases.length - 1) {
                plan.progress.currentPhase++;
                plan.phases[plan.progress.currentPhase].status = "active";
                plan.phases[plan.progress.currentPhase].startedAt = new Date();
            }
            else {
                // All phases completed
                plan.status = "completed";
            }
            // Update overall progress
            plan.progress.overallProgress =
                plan.progress.phasesCompleted / plan.phases.length;
            plan.lastUpdated = new Date();
            this.emit("phase_completed", {
                agentId,
                phase: currentPhase,
                plan,
            });
        }
    }
    async monitorQuarantinedAgents() {
        for (const [agentId, record] of this.quarantineRecords) {
            if (record.status !== "active")
                continue;
            try {
                // Monitor behavior and compliance
                const behaviorMetrics = await this.behaviorMonitor.assessBehavior(agentId);
                // Update monitoring data
                record.monitoring.activityLevel = behaviorMetrics.activityLevel;
                record.monitoring.complianceScore = behaviorMetrics.complianceScore;
                record.monitoring.lastActivity = behaviorMetrics.lastActivity;
                // Update behavior score
                record.recoveryProgress.behaviorScore = behaviorMetrics.overallScore;
                // Check for violations
                if (behaviorMetrics.violations.length > 0) {
                    for (const violation of behaviorMetrics.violations) {
                        await this.recordViolation(agentId, violation.type, violation.description, violation.evidence, violation.severity);
                    }
                }
            }
            catch (error) {
                this.logger.error("Failed to monitor quarantined agent", {
                    agentId,
                    error,
                });
            }
        }
    }
    async reviewQuarantineStatus() {
        for (const [agentId, record] of this.quarantineRecords) {
            if (record.status !== "active")
                continue;
            const timeInQuarantine = Date.now() - record.startTime.getTime();
            const quarantineLevel = this.quarantineLevels.get(record.level);
            // Check if minimum time has passed
            if (timeInQuarantine >= quarantineLevel.duration.minimum) {
                const eligibility = await this.checkRecoveryEligibility(agentId);
                if (eligibility.eligible) {
                    // Automatic recovery for observation level
                    if (record.level === "observation" &&
                        record.violations.length === 0) {
                        await this.processRecoveryRequest(agentId);
                    }
                }
            }
            // Check maximum time limit
            if (timeInQuarantine >= quarantineLevel.duration.maximum) {
                if (quarantineLevel.extendable &&
                    record.extensions.length < this.config.quarantine.maxExtensions) {
                    // Auto-extend if recovery progress is being made
                    const eligibility = await this.checkRecoveryEligibility(agentId);
                    if (eligibility.progress > 0.5) {
                        await this.extendQuarantine(agentId, quarantineLevel.duration.minimum / 2, "Automatic extension due to progress", {});
                    }
                }
                else {
                    // Force review or escalate
                    record.status = "permanent";
                    record.metadata.notes.push("Maximum quarantine time exceeded");
                }
            }
        }
    }
    async processRecoveryChallenges() {
        for (const [challengeId, challenge] of this.recoveryChallenges) {
            if (challenge.status === "in_progress") {
                // Check for timeouts
                const lastAttempt = challenge.attempts[challenge.attempts.length - 1];
                if (lastAttempt && !lastAttempt.endTime) {
                    const timeInProgress = Date.now() - lastAttempt.startTime.getTime();
                    if (timeInProgress > challenge.timeLimit) {
                        // Timeout
                        lastAttempt.endTime = new Date();
                        lastAttempt.feedback = "Challenge timed out";
                        challenge.status = "pending";
                    }
                }
            }
        }
    }
    scheduleQuarantineReview(agentId, delay) {
        setTimeout(async () => {
            const record = this.quarantineRecords.get(agentId);
            if (record && record.status === "active") {
                await this.reviewQuarantineStatus();
            }
        }, delay);
    }
    async escalateQuarantine(agentId, newLevel, reason, evidence) {
        const record = this.quarantineRecords.get(agentId);
        if (!record)
            throw new Error("Agent not quarantined");
        const extension = {
            extensionId: crypto.randomUUID(),
            reason: `Escalated to ${newLevel}: ${reason}`,
            additionalTime: 0, // Escalation changes level, not time
            requestedBy: "system",
            approvedBy: ["system"],
            timestamp: new Date(),
            evidence,
        };
        record.level = newLevel;
        record.extensions.push(extension);
        record.metadata.notes.push(`Escalated to ${newLevel}: ${reason}`);
        record.metadata.lastUpdated = new Date();
        this.logger.warn("Quarantine escalated", {
            agentId,
            oldLevel: record.level,
            newLevel,
            reason,
        });
        this.emit("quarantine_escalated", {
            agentId,
            record,
            extension,
        });
        return record;
    }
    async extendQuarantine(agentId, additionalTime, reason, evidence) {
        const record = this.quarantineRecords.get(agentId);
        if (!record)
            return;
        const extension = {
            extensionId: crypto.randomUUID(),
            reason,
            additionalTime,
            requestedBy: "system",
            approvedBy: ["system"],
            timestamp: new Date(),
            evidence,
        };
        record.extensions.push(extension);
        record.metadata.notes.push(`Extended by ${additionalTime}ms: ${reason}`);
        record.metadata.lastUpdated = new Date();
        this.emit("quarantine_extended", {
            agentId,
            record,
            extension,
        });
    }
    /**
     * Public API methods
     */
    getQuarantineRecord(agentId) {
        return this.quarantineRecords.get(agentId) || null;
    }
    getRecoveryPlan(agentId) {
        return this.recoveryPlans.get(agentId) || null;
    }
    getQuarantinedAgents() {
        return Array.from(this.quarantineRecords.keys());
    }
    getRecoveryChallenges(agentId) {
        return Array.from(this.recoveryChallenges.values()).filter((c) => c.agentId === agentId);
    }
    getPeerEndorsements(agentId) {
        return this.peerEndorsements.get(agentId) || [];
    }
    async getSystemStats() {
        const records = Array.from(this.quarantineRecords.values());
        const challenges = Array.from(this.recoveryChallenges.values());
        return {
            totalQuarantined: records.length,
            quarantineLevelDistribution: this.getQuarantineLevelDistribution(records),
            totalChallenges: challenges.length,
            challengeCompletionRate: this.calculateChallengeCompletionRate(challenges),
            averageRecoveryTime: this.calculateAverageRecoveryTime(records),
            violationCount: records.reduce((sum, r) => sum + r.violations.length, 0),
            recoverySuccessRate: this.calculateRecoverySuccessRate(records),
        };
    }
    getQuarantineLevelDistribution(records) {
        const distribution = { observation: 0, soft: 0, hard: 0, complete: 0 };
        records.forEach((record) => {
            distribution[record.level]++;
        });
        return distribution;
    }
    calculateChallengeCompletionRate(challenges) {
        if (challenges.length === 0)
            return 0;
        const completed = challenges.filter((c) => c.status === "completed").length;
        return completed / challenges.length;
    }
    calculateAverageRecoveryTime(records) {
        const recovered = records.filter((r) => r.status === "recovered" && r.endTime);
        if (recovered.length === 0)
            return 0;
        const totalTime = recovered.reduce((sum, r) => {
            return sum + (r.endTime.getTime() - r.startTime.getTime());
        }, 0);
        return totalTime / recovered.length;
    }
    calculateRecoverySuccessRate(records) {
        const total = records.filter((r) => r.status !== "active").length;
        if (total === 0)
            return 0;
        const recovered = records.filter((r) => r.status === "recovered").length;
        return recovered / total;
    }
}
// Supporting monitoring classes
class BehaviorMonitor {
    config;
    constructor(config) {
        this.config = config;
    }
    async assessBehavior(agentId) {
        // Mock implementation
        return {
            activityLevel: 0.5,
            complianceScore: 0.8,
            overallScore: 0.7,
            lastActivity: new Date(),
            violations: [],
        };
    }
}
class RecoveryAssessor {
    config;
    constructor(config) {
        this.config = config;
    }
    async assessRecoveryProgress(agentId, plan) {
        return plan.progress.overallProgress;
    }
}
class ChallengeValidator {
    config;
    constructor(config) {
        this.config = config;
    }
    async validateResponse(challenge, response) {
        // Mock validation
        return {
            score: 0.8,
            feedback: "Good response",
            evidence: { validated: true },
        };
    }
}
class EndorsementValidator {
    config;
    constructor(config) {
        this.config = config;
    }
    async validateEndorser(fromAgentId, toAgentId) {
        // Mock validation
        return true;
    }
}
//# sourceMappingURL=quarantine-recovery.js.map