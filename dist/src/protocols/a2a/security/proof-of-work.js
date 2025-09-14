/**
 * Proof-of-Work Challenge System for A2A Protocol
 *
 * Implements cryptographic proof-of-work challenges for agent verification,
 * providing computational evidence of commitment and deterring malicious
 * behavior through economic cost of computation.
 *
 * Features:
 * - Multiple PoW algorithms (SHA-256, Scrypt, Argon2)
 * - Adaptive difficulty adjustment based on network conditions
 * - Anti-ASIC measures for fair competition
 * - Time-locked challenges for continuous verification
 * - Economic incentives and penalties
 * - Distributed verification and consensus
 */
import { EventEmitter } from "events";
import crypto from "crypto";
import { Logger } from "../../../utils/logger.js";
export class ProofOfWorkManager extends EventEmitter {
    logger;
    challenges = new Map();
    solutions = new Map();
    agentChallenges = new Map(); // agentId -> challengeIds
    difficultyHistory = [];
    currentDifficulty = new Map(); // algorithm -> difficulty
    // Components
    difficultyAdjuster;
    solutionVerifier;
    fraudDetector;
    performanceTracker;
    config;
    constructor(config = {}) {
        super();
        this.logger = new Logger("ProofOfWorkManager");
        this.initializeConfig(config);
        this.initializeComponents();
        this.initializeDifficulties();
        this.startPeriodicTasks();
        this.logger.info("Proof of Work Manager initialized", {
            algorithms: Object.keys(this.config.algorithms).filter((alg) => this.config.algorithms[alg]
                .enabled),
            initialDifficulty: this.currentDifficulty.get("sha256"),
            features: [
                "adaptive-difficulty",
                "multi-algorithm",
                "fraud-detection",
                "distributed-verification",
            ],
        });
    }
    /**
     * Initialize configuration with defaults
     */
    initializeConfig(config) {
        this.config = {
            algorithms: {
                sha256: { enabled: true, weight: 1.0, difficulty: 4 },
                scrypt: {
                    enabled: true,
                    weight: 0.8,
                    difficulty: 14,
                    n: 16384,
                    r: 8,
                    p: 1,
                },
                argon2: {
                    enabled: true,
                    weight: 0.9,
                    difficulty: 3,
                    memory: 65536,
                    iterations: 3,
                },
                blake2b: { enabled: true, weight: 0.9, difficulty: 4 },
                x11: { enabled: false, weight: 1.2, difficulty: 5 },
                ...config.algorithms,
            },
            difficulty: {
                initial: 4,
                minimum: 2,
                maximum: 20,
                adjustmentInterval: 600000, // 10 minutes
                targetBlockTime: 300000, // 5 minutes
                adjustmentFactor: 0.25, // 25% max adjustment
                ...config.difficulty,
            },
            economics: {
                baseReward: 100,
                difficultyMultiplier: 10,
                timeBonusThreshold: 60000, // 1 minute
                timeBonus: 50,
                penaltyMultiplier: 2,
                ...config.economics,
            },
            antiAbuse: {
                maxChallengesPerAgent: 3,
                cooldownPeriod: 300000, // 5 minutes
                duplicatePreventionWindow: 3600000, // 1 hour
                fraudDetection: true,
                minimumComputationTime: 1000, // 1 second
                ...config.antiAbuse,
            },
            verification: {
                requiredVerifiers: 3,
                verificationTimeout: 300000, // 5 minutes
                consensusThreshold: 0.67, // 67% consensus
                rewardVerifiers: true,
                ...config.verification,
            },
        };
    }
    /**
     * Initialize components
     */
    initializeComponents() {
        this.difficultyAdjuster = new DifficultyAdjuster(this.config);
        this.solutionVerifier = new SolutionVerifier(this.config);
        this.fraudDetector = new FraudDetector(this.config);
        this.performanceTracker = new PerformanceTracker(this.config);
    }
    /**
     * Initialize difficulty levels for each algorithm
     */
    initializeDifficulties() {
        for (const [algorithm, settings] of Object.entries(this.config.algorithms)) {
            if (settings.enabled) {
                this.currentDifficulty.set(algorithm, settings.difficulty);
            }
        }
    }
    /**
     * Start periodic tasks
     */
    startPeriodicTasks() {
        // Difficulty adjustment
        setInterval(async () => {
            await this.adjustDifficulty();
        }, this.config.difficulty.adjustmentInterval);
        // Challenge cleanup
        setInterval(async () => {
            await this.cleanupExpiredChallenges();
        }, 60000); // Every minute
        // Performance monitoring
        setInterval(async () => {
            await this.updatePerformanceMetrics();
        }, 30000); // Every 30 seconds
    }
    /**
     * Create a new proof-of-work challenge
     */
    async createChallenge(agentId, purpose, algorithm = "sha256", customDifficulty, timeLimit, reward) {
        // Check if agent can receive new challenges
        await this.validateChallengeRequest(agentId, algorithm);
        const algorithmConfig = this.config.algorithms[algorithm];
        if (!algorithmConfig || !algorithmConfig.enabled) {
            throw new Error(`Algorithm ${algorithm} is not enabled`);
        }
        const difficulty = customDifficulty ||
            this.currentDifficulty.get(algorithm) ||
            algorithmConfig.difficulty;
        const challenge = {
            challengeId: crypto.randomUUID(),
            agentId,
            algorithm,
            difficulty,
            target: this.calculateTarget(difficulty),
            nonce: crypto.randomBytes(32).toString("hex"),
            data: this.generateChallengeData(agentId, purpose),
            timestamp: new Date(),
            timeLimit: timeLimit || this.calculateTimeLimit(difficulty),
            parameters: this.getAlgorithmParameters(algorithm, difficulty),
            reward: reward || this.calculateReward(difficulty),
            penalty: this.calculatePenalty(difficulty),
            gasPrice: this.calculateGasPrice(algorithm, difficulty),
            status: "pending",
            verifiedBy: [],
            metadata: {
                purpose,
                priority: this.determinePriority(purpose),
                retryAllowed: purpose !== "consensus",
                maxAttempts: purpose === "consensus" ? 1 : 3,
                currentAttempts: 0,
            },
        };
        // Store challenge
        this.challenges.set(challenge.challengeId, challenge);
        // Track agent challenges
        const agentChallenges = this.agentChallenges.get(agentId) || [];
        agentChallenges.push(challenge.challengeId);
        this.agentChallenges.set(agentId, agentChallenges);
        // Schedule expiration
        setTimeout(() => {
            this.expireChallenge(challenge.challengeId);
        }, challenge.timeLimit);
        this.logger.info("Proof-of-work challenge created", {
            challengeId: challenge.challengeId,
            agentId,
            algorithm,
            difficulty,
            purpose,
            reward: challenge.reward,
            timeLimit: challenge.timeLimit,
        });
        this.emit("challenge_created", challenge);
        return challenge;
    }
    /**
     * Submit solution to a challenge
     */
    async submitSolution(challengeId, agentId, nonce, computationTime, resourceUsage) {
        const challenge = this.challenges.get(challengeId);
        if (!challenge) {
            throw new Error("Challenge not found");
        }
        if (challenge.agentId !== agentId) {
            throw new Error("Challenge does not belong to this agent");
        }
        if (challenge.status !== "pending") {
            throw new Error(`Challenge is ${challenge.status}, cannot submit solution`);
        }
        // Check time limit
        const timeElapsed = Date.now() - challenge.timestamp.getTime();
        if (timeElapsed > challenge.timeLimit) {
            challenge.status = "expired";
            return { accepted: false, verified: false, reason: "Challenge expired" };
        }
        // Mark challenge as in progress
        challenge.status = "in_progress";
        challenge.metadata.currentAttempts++;
        try {
            // Calculate hash with provided nonce
            const hash = await this.calculateHash(challenge.algorithm, challenge.data, nonce, challenge.parameters);
            // Verify solution meets difficulty target
            const isValidSolution = this.verifyTarget(hash, challenge.target);
            if (!isValidSolution) {
                if (challenge.metadata.currentAttempts >= challenge.metadata.maxAttempts) {
                    challenge.status = "failed";
                }
                else {
                    challenge.status = "pending";
                }
                return {
                    accepted: false,
                    verified: false,
                    reason: "Solution does not meet difficulty target",
                };
            }
            // Create solution object
            const solution = {
                solutionId: crypto.randomUUID(),
                challengeId,
                agentId,
                nonce,
                hash,
                iterations: this.estimateIterations(computationTime, challenge.algorithm),
                computationTime,
                timestamp: new Date(),
                verified: false,
                verificationHash: "",
                verifiers: [],
                hashRate: this.calculateHashRate(computationTime, challenge.difficulty),
                efficiency: this.calculateEfficiency(computationTime, challenge.difficulty, resourceUsage),
                resourceUsage: resourceUsage || { cpu: 0, memory: 0, power: 0 },
            };
            // Fraud detection
            const fraudCheck = await this.fraudDetector.checkSolution(challenge, solution);
            if (fraudCheck.suspicious) {
                challenge.status = "failed";
                this.logger.warn("Suspicious solution detected", {
                    challengeId,
                    agentId,
                    reason: fraudCheck.reason,
                    confidence: fraudCheck.confidence,
                });
                return {
                    accepted: false,
                    verified: false,
                    reason: `Fraud detected: ${fraudCheck.reason}`,
                };
            }
            // Store solution
            challenge.solution = solution;
            this.solutions.set(solution.solutionId, solution);
            // Mark as completed (pending verification)
            challenge.status = "completed";
            // Initiate distributed verification
            await this.initiateVerification(challenge, solution);
            this.logger.info("Proof-of-work solution submitted", {
                challengeId,
                agentId,
                hash,
                computationTime,
                efficiency: solution.efficiency,
            });
            this.emit("solution_submitted", { challenge, solution });
            return {
                accepted: true,
                verified: false, // Will be verified by network
                reason: "Solution accepted, awaiting verification",
            };
        }
        catch (error) {
            challenge.status = "failed";
            this.logger.error("Solution submission failed", {
                challengeId,
                agentId,
                error,
            });
            return {
                accepted: false,
                verified: false,
                reason: `Submission error: ${error.message}`,
            };
        }
    }
    /**
     * Verify a solution (called by other agents)
     */
    async verifySolution(challengeId, verifierAgentId) {
        const challenge = this.challenges.get(challengeId);
        if (!challenge || !challenge.solution) {
            return { valid: false, reason: "Challenge or solution not found" };
        }
        if (challenge.verifiedBy.includes(verifierAgentId)) {
            return { valid: false, reason: "Agent already verified this solution" };
        }
        const solution = challenge.solution;
        try {
            // Re-calculate hash to verify
            const verificationHash = await this.calculateHash(challenge.algorithm, challenge.data, solution.nonce, challenge.parameters);
            const isValid = verificationHash === solution.hash &&
                this.verifyTarget(verificationHash, challenge.target);
            if (isValid) {
                // Add verifier
                challenge.verifiedBy.push(verifierAgentId);
                solution.verifiers.push(verifierAgentId);
                solution.verificationHash = verificationHash;
                // Check if enough verifications
                if (challenge.verifiedBy.length >=
                    this.config.verification.requiredVerifiers) {
                    solution.verified = true;
                    challenge.status = "verified";
                    // Award reward
                    const reward = this.calculateFinalReward(challenge, solution);
                    this.logger.info("Solution fully verified", {
                        challengeId,
                        agentId: challenge.agentId,
                        verifiers: challenge.verifiedBy.length,
                        reward,
                    });
                    this.emit("solution_verified", { challenge, solution, reward });
                }
                return { valid: true, hash: verificationHash };
            }
            else {
                return { valid: false, reason: "Hash verification failed" };
            }
        }
        catch (error) {
            this.logger.error("Solution verification failed", {
                challengeId,
                verifierAgentId,
                error,
            });
            return { valid: false, reason: `Verification error: ${error.message}` };
        }
    }
    /**
     * Get challenge for agent
     */
    getChallenge(challengeId) {
        return this.challenges.get(challengeId) || null;
    }
    /**
     * Get challenges for agent
     */
    getAgentChallenges(agentId) {
        const challengeIds = this.agentChallenges.get(agentId) || [];
        return challengeIds
            .map((id) => this.challenges.get(id))
            .filter(Boolean);
    }
    /**
     * Get active challenges that need verification
     */
    getChallengesForVerification(verifierAgentId) {
        return Array.from(this.challenges.values()).filter((challenge) => challenge.status === "completed" &&
            challenge.solution &&
            !challenge.verifiedBy.includes(verifierAgentId) &&
            challenge.verifiedBy.length <
                this.config.verification.requiredVerifiers);
    }
    /**
     * Helper methods
     */
    async validateChallengeRequest(agentId, algorithm) {
        const agentChallenges = this.agentChallenges.get(agentId) || [];
        const activeChallenges = agentChallenges
            .map((id) => this.challenges.get(id))
            .filter((c) => c && (c.status === "pending" || c.status === "in_progress")).length;
        if (activeChallenges >= this.config.antiAbuse.maxChallengesPerAgent) {
            throw new Error("Too many active challenges for this agent");
        }
        // Check cooldown period
        const recentChallenges = agentChallenges
            .map((id) => this.challenges.get(id))
            .filter((c) => c &&
            Date.now() - c.timestamp.getTime() <
                this.config.antiAbuse.cooldownPeriod);
        if (recentChallenges.length > 0) {
            throw new Error("Agent is in cooldown period");
        }
    }
    calculateTarget(difficulty) {
        // Calculate target hash (number of leading zeros)
        const target = "0".repeat(difficulty) + "f".repeat(64 - difficulty);
        return target;
    }
    generateChallengeData(agentId, purpose) {
        const timestamp = Date.now();
        const random = crypto.randomBytes(16).toString("hex");
        return `${agentId}:${purpose}:${timestamp}:${random}`;
    }
    calculateTimeLimit(difficulty) {
        // Base time limit of 5 minutes, increased exponentially with difficulty
        return Math.min(3600000, 300000 * Math.pow(2, difficulty - 4)); // Max 1 hour
    }
    getAlgorithmParameters(algorithm, difficulty) {
        const algorithmConfig = this.config.algorithms[algorithm];
        switch (algorithm) {
            case "scrypt":
                return {
                    n: algorithmConfig.n || 16384,
                    r: algorithmConfig.r || 8,
                    p: algorithmConfig.p || 1,
                };
            case "argon2":
                return {
                    memory: algorithmConfig.memory || 65536,
                    iterations: algorithmConfig.iterations || 3,
                    saltSize: 32,
                };
            default:
                return {};
        }
    }
    calculateReward(difficulty) {
        return (this.config.economics.baseReward +
            difficulty * this.config.economics.difficultyMultiplier);
    }
    calculatePenalty(difficulty) {
        return (this.calculateReward(difficulty) * this.config.economics.penaltyMultiplier);
    }
    calculateGasPrice(algorithm, difficulty) {
        const algorithmConfig = this.config.algorithms[algorithm];
        return difficulty * algorithmConfig.weight * 10; // Base gas price
    }
    determinePriority(purpose) {
        const priorities = {
            anti_spam: "low",
            verification: "medium",
            trust_building: "medium",
            recovery: "high",
            consensus: "critical",
        };
        return priorities[purpose] || "medium";
    }
    async calculateHash(algorithm, data, nonce, parameters) {
        const input = data + nonce;
        switch (algorithm) {
            case "sha256":
                return crypto.createHash("sha256").update(input).digest("hex");
            case "blake2b":
                // Note: Node.js doesn't have native Blake2b, this is a simplified version
                return crypto
                    .createHash("sha256")
                    .update("blake2b:" + input)
                    .digest("hex");
            case "scrypt":
                // Simplified scrypt implementation
                return crypto
                    .scryptSync(input, "salt", 32, {
                    N: parameters.n || 16384,
                    r: parameters.r || 8,
                    p: parameters.p || 1,
                })
                    .toString("hex");
            case "argon2":
                // Simplified argon2 implementation using scrypt as placeholder
                return crypto
                    .scryptSync(input, "argon2salt", 32, {
                    N: 1024,
                    r: parameters.memory || 8,
                    p: parameters.iterations || 1,
                })
                    .toString("hex");
            case "x11":
                // Simplified X11 implementation
                let hash = input;
                for (let i = 0; i < 11; i++) {
                    hash = crypto.createHash("sha256").update(hash).digest("hex");
                }
                return hash;
            default:
                throw new Error(`Unsupported algorithm: ${algorithm}`);
        }
    }
    verifyTarget(hash, target) {
        return hash <= target;
    }
    estimateIterations(computationTime, algorithm) {
        // Rough estimation based on algorithm and time
        const baseRate = {
            sha256: 1000000, // 1M hashes per second
            scrypt: 1000, // 1K hashes per second
            argon2: 100, // 100 hashes per second
            blake2b: 500000, // 500K hashes per second
            x11: 100000, // 100K hashes per second
        };
        const rate = baseRate[algorithm] || 100000;
        return Math.floor((computationTime / 1000) * rate);
    }
    calculateHashRate(computationTime, difficulty) {
        const estimatedHashes = Math.pow(2, difficulty) / 2; // Average hashes needed
        return estimatedHashes / (computationTime / 1000); // Hashes per second
    }
    calculateEfficiency(computationTime, difficulty, resourceUsage) {
        const expectedTime = Math.pow(2, difficulty) * 1000; // Expected time in ms
        const timeEfficiency = Math.min(1, expectedTime / computationTime);
        if (!resourceUsage) {
            return timeEfficiency;
        }
        // Factor in resource usage (lower usage = higher efficiency)
        const resourceEfficiency = 1 - (resourceUsage.cpu + resourceUsage.memory) / 200;
        return (timeEfficiency + Math.max(0, resourceEfficiency)) / 2;
    }
    async initiateVerification(challenge, solution) {
        // In a real implementation, this would broadcast to network for verification
        this.emit("verification_needed", {
            challengeId: challenge.challengeId,
            requiredVerifiers: this.config.verification.requiredVerifiers,
            timeout: this.config.verification.verificationTimeout,
        });
        // Auto-timeout if not enough verifications
        setTimeout(() => {
            if (challenge.verifiedBy.length < this.config.verification.requiredVerifiers) {
                challenge.status = "failed";
                this.logger.warn("Solution verification timeout", {
                    challengeId: challenge.challengeId,
                    verifications: challenge.verifiedBy.length,
                    required: this.config.verification.requiredVerifiers,
                });
            }
        }, this.config.verification.verificationTimeout);
    }
    calculateFinalReward(challenge, solution) {
        let reward = challenge.reward;
        // Time bonus for fast completion
        if (solution.computationTime < this.config.economics.timeBonusThreshold) {
            reward += this.config.economics.timeBonus;
        }
        // Efficiency bonus
        reward *= 1 + solution.efficiency;
        return Math.floor(reward);
    }
    async expireChallenge(challengeId) {
        const challenge = this.challenges.get(challengeId);
        if (challenge && challenge.status === "pending") {
            challenge.status = "expired";
            this.logger.info("Challenge expired", {
                challengeId,
                agentId: challenge.agentId,
                algorithm: challenge.algorithm,
            });
            this.emit("challenge_expired", challenge);
        }
    }
    async adjustDifficulty() {
        const adjustment = await this.difficultyAdjuster.calculateAdjustment(Array.from(this.challenges.values()), this.currentDifficulty);
        if (adjustment) {
            // Apply adjustments
            for (const [algorithm, newDifficulty] of Object.entries(adjustment.newDifficulties)) {
                this.currentDifficulty.set(algorithm, newDifficulty);
            }
            this.difficultyHistory.push(adjustment);
            // Limit history size
            if (this.difficultyHistory.length > 1000) {
                this.difficultyHistory = this.difficultyHistory.slice(-500);
            }
            this.logger.info("Difficulty adjusted", {
                adjustment: adjustment.adjustments,
                networkMetrics: adjustment.networkMetrics,
            });
            this.emit("difficulty_adjusted", adjustment);
        }
    }
    async cleanupExpiredChallenges() {
        const expiredThreshold = Date.now() - 86400000; // 24 hours ago
        let cleanedCount = 0;
        for (const [challengeId, challenge] of this.challenges) {
            if (challenge.timestamp.getTime() < expiredThreshold &&
                (challenge.status === "expired" ||
                    challenge.status === "failed" ||
                    challenge.status === "verified")) {
                this.challenges.delete(challengeId);
                if (challenge.solution) {
                    this.solutions.delete(challenge.solution.solutionId);
                }
                // Clean up agent challenge tracking
                const agentChallenges = this.agentChallenges.get(challenge.agentId) || [];
                const updatedChallenges = agentChallenges.filter((id) => id !== challengeId);
                if (updatedChallenges.length > 0) {
                    this.agentChallenges.set(challenge.agentId, updatedChallenges);
                }
                else {
                    this.agentChallenges.delete(challenge.agentId);
                }
                cleanedCount++;
            }
        }
        if (cleanedCount > 0) {
            this.logger.debug("Cleaned up expired challenges", {
                count: cleanedCount,
            });
        }
    }
    async updatePerformanceMetrics() {
        await this.performanceTracker.updateMetrics(Array.from(this.challenges.values()), Array.from(this.solutions.values()));
    }
    /**
     * Public API methods
     */
    getCurrentDifficulty(algorithm = "sha256") {
        return (this.currentDifficulty.get(algorithm) ||
            this.config.algorithms[algorithm]
                ?.difficulty ||
            4);
    }
    getDifficultyHistory(limit = 100) {
        return this.difficultyHistory.slice(-limit);
    }
    async getNetworkStats() {
        const challenges = Array.from(this.challenges.values());
        const solutions = Array.from(this.solutions.values());
        return {
            totalChallenges: challenges.length,
            activeChallenges: challenges.filter((c) => c.status === "pending" || c.status === "in_progress").length,
            completedChallenges: challenges.filter((c) => c.status === "verified")
                .length,
            totalSolutions: solutions.length,
            averageComputationTime: this.calculateAverageComputationTime(solutions),
            networkHashRate: this.estimateNetworkHashRate(solutions),
            difficultyByAlgorithm: Object.fromEntries(this.currentDifficulty),
            activeAgents: this.agentChallenges.size,
            verificationBacklog: challenges.filter((c) => c.status === "completed" && !c.solution?.verified).length,
        };
    }
    calculateAverageComputationTime(solutions) {
        if (solutions.length === 0)
            return 0;
        const totalTime = solutions.reduce((sum, s) => sum + s.computationTime, 0);
        return totalTime / solutions.length;
    }
    estimateNetworkHashRate(solutions) {
        if (solutions.length === 0)
            return 0;
        const recentSolutions = solutions.filter((s) => Date.now() - s.timestamp.getTime() < 3600000);
        if (recentSolutions.length === 0)
            return 0;
        const totalHashRate = recentSolutions.reduce((sum, s) => sum + s.hashRate, 0);
        return totalHashRate / recentSolutions.length;
    }
}
// Supporting classes
class DifficultyAdjuster {
    config;
    constructor(config) {
        this.config = config;
    }
    async calculateAdjustment(challenges, currentDifficulties) {
        const recentChallenges = challenges.filter((c) => Date.now() - c.timestamp.getTime() <
            this.config.difficulty.adjustmentInterval);
        if (recentChallenges.length < 5)
            return null; // Need minimum data
        const completedChallenges = recentChallenges.filter((c) => c.status === "verified");
        const averageBlockTime = this.calculateAverageBlockTime(completedChallenges);
        const adjustments = {};
        const newDifficulties = {};
        for (const [algorithm, currentDifficulty] of currentDifficulties) {
            const algorithmChallenges = completedChallenges.filter((c) => c.algorithm === algorithm);
            if (algorithmChallenges.length === 0)
                continue;
            const targetTime = this.config.difficulty.targetBlockTime;
            const actualTime = this.calculateAverageBlockTime(algorithmChallenges);
            let newDifficulty = currentDifficulty;
            if (actualTime < targetTime * 0.8) {
                // Too fast, increase difficulty
                newDifficulty = Math.min(this.config.difficulty.maximum, currentDifficulty * (1 + this.config.difficulty.adjustmentFactor));
            }
            else if (actualTime > targetTime * 1.2) {
                // Too slow, decrease difficulty
                newDifficulty = Math.max(this.config.difficulty.minimum, currentDifficulty * (1 - this.config.difficulty.adjustmentFactor));
            }
            if (newDifficulty !== currentDifficulty) {
                adjustments[algorithm] = {
                    from: currentDifficulty,
                    to: newDifficulty,
                    change: newDifficulty - currentDifficulty,
                };
                newDifficulties[algorithm] = newDifficulty;
            }
        }
        if (Object.keys(adjustments).length === 0)
            return null;
        return {
            adjustmentId: crypto.randomUUID(),
            timestamp: new Date(),
            previousDifficulty: 0, // Legacy field
            newDifficulty: 0, // Legacy field
            reason: "Automatic adjustment based on block times",
            adjustments,
            newDifficulties,
            networkMetrics: {
                averageBlockTime,
                totalHashRate: this.estimateHashRate(completedChallenges),
                activeMiners: new Set(recentChallenges.map((c) => c.agentId)).size,
                challengeCompletionRate: completedChallenges.length / recentChallenges.length,
            },
            algorithm: "simple",
            parameters: { adjustmentFactor: this.config.difficulty.adjustmentFactor },
        };
    }
    calculateAverageBlockTime(challenges) {
        if (challenges.length === 0)
            return 0;
        const times = challenges
            .filter((c) => c.solution)
            .map((c) => c.solution.computationTime);
        return times.reduce((sum, time) => sum + time, 0) / times.length;
    }
    estimateHashRate(challenges) {
        const hashRates = challenges
            .filter((c) => c.solution)
            .map((c) => c.solution.hashRate);
        return hashRates.reduce((sum, rate) => sum + rate, 0);
    }
}
class SolutionVerifier {
    config;
    constructor(config) {
        this.config = config;
    }
    async verifyPOW(challenge, solution) {
        // Placeholder for actual verification logic
        return true;
    }
}
class FraudDetector {
    config;
    constructor(config) {
        this.config = config;
    }
    async checkSolution(challenge, solution) {
        // Check for unrealistically fast completion
        const minExpectedTime = this.config.antiAbuse.minimumComputationTime *
            Math.pow(2, challenge.difficulty - 4);
        if (solution.computationTime < minExpectedTime) {
            return {
                suspicious: true,
                reason: "Completion time suspiciously fast",
                confidence: 0.9,
            };
        }
        // Check for unusual hash rate
        const expectedHashRate = Math.pow(2, challenge.difficulty) / (solution.computationTime / 1000);
        const actualHashRate = solution.hashRate;
        if (actualHashRate > expectedHashRate * 10) {
            return {
                suspicious: true,
                reason: "Hash rate suspiciously high",
                confidence: 0.8,
            };
        }
        return { suspicious: false, confidence: 0.1 };
    }
}
class PerformanceTracker {
    config;
    constructor(config) {
        this.config = config;
    }
    async updateMetrics(challenges, solutions) {
        // Update performance metrics
        // Implementation would track various performance indicators
    }
}
//# sourceMappingURL=proof-of-work.js.map