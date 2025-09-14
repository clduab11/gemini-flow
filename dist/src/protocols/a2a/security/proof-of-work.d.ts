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
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
export interface ProofOfWorkChallenge {
    challengeId: string;
    agentId: string;
    algorithm: "sha256" | "scrypt" | "argon2" | "blake2b" | "x11";
    difficulty: number;
    target: string;
    nonce: string;
    data: string;
    timestamp: Date;
    timeLimit: number;
    parameters: {
        hashCount?: number;
        memorySize?: number;
        iterations?: number;
        saltSize?: number;
    };
    reward: number;
    penalty: number;
    gasPrice: number;
    status: "pending" | "in_progress" | "completed" | "failed" | "expired" | "verified";
    solution?: ProofOfWorkSolution;
    verifiedBy: string[];
    metadata: {
        purpose: "verification" | "recovery" | "trust_building" | "anti_spam" | "consensus";
        priority: "low" | "medium" | "high" | "critical";
        retryAllowed: boolean;
        maxAttempts: number;
        currentAttempts: number;
    };
}
export interface ProofOfWorkSolution {
    solutionId: string;
    challengeId: string;
    agentId: string;
    nonce: string;
    hash: string;
    iterations: number;
    computationTime: number;
    timestamp: Date;
    verified: boolean;
    verificationHash: string;
    verifiers: string[];
    hashRate: number;
    efficiency: number;
    resourceUsage: {
        cpu: number;
        memory: number;
        power: number;
    };
}
export interface DifficultyAdjustment {
    adjustmentId: string;
    timestamp: Date;
    previousDifficulty: number;
    newDifficulty: number;
    reason: string;
    networkMetrics: {
        averageBlockTime: number;
        totalHashRate: number;
        activeMiners: number;
        challengeCompletionRate: number;
    };
    algorithm: "simple" | "exponential" | "pid_controller" | "adaptive";
    parameters: any;
}
export interface ProofOfWorkConfig {
    algorithms: {
        sha256: {
            enabled: boolean;
            weight: number;
            difficulty: number;
        };
        scrypt: {
            enabled: boolean;
            weight: number;
            difficulty: number;
            n: number;
            r: number;
            p: number;
        };
        argon2: {
            enabled: boolean;
            weight: number;
            difficulty: number;
            memory: number;
            iterations: number;
        };
        blake2b: {
            enabled: boolean;
            weight: number;
            difficulty: number;
        };
        x11: {
            enabled: boolean;
            weight: number;
            difficulty: number;
        };
    };
    difficulty: {
        initial: number;
        minimum: number;
        maximum: number;
        adjustmentInterval: number;
        targetBlockTime: number;
        adjustmentFactor: number;
    };
    economics: {
        baseReward: number;
        difficultyMultiplier: number;
        timeBonusThreshold: number;
        timeBonus: number;
        penaltyMultiplier: number;
    };
    antiAbuse: {
        maxChallengesPerAgent: number;
        cooldownPeriod: number;
        duplicatePreventionWindow: number;
        fraudDetection: boolean;
        minimumComputationTime: number;
    };
    verification: {
        requiredVerifiers: number;
        verificationTimeout: number;
        consensusThreshold: number;
        rewardVerifiers: boolean;
    };
}
export declare class ProofOfWorkManager extends EventEmitter {
    private logger;
    private challenges;
    private solutions;
    private agentChallenges;
    private difficultyHistory;
    private currentDifficulty;
    private difficultyAdjuster;
    private solutionVerifier;
    private fraudDetector;
    private performanceTracker;
    private config;
    constructor(config?: Partial<ProofOfWorkConfig>);
    /**
     * Initialize configuration with defaults
     */
    private initializeConfig;
    /**
     * Initialize components
     */
    private initializeComponents;
    /**
     * Initialize difficulty levels for each algorithm
     */
    private initializeDifficulties;
    /**
     * Start periodic tasks
     */
    private startPeriodicTasks;
    /**
     * Create a new proof-of-work challenge
     */
    createChallenge(agentId: string, purpose: "verification" | "recovery" | "trust_building" | "anti_spam" | "consensus", algorithm?: "sha256" | "scrypt" | "argon2" | "blake2b" | "x11", customDifficulty?: number, timeLimit?: number, reward?: number): Promise<ProofOfWorkChallenge>;
    /**
     * Submit solution to a challenge
     */
    submitSolution(challengeId: string, agentId: string, nonce: string, computationTime: number, resourceUsage?: {
        cpu: number;
        memory: number;
        power: number;
    }): Promise<{
        accepted: boolean;
        verified: boolean;
        reward?: number;
        reason?: string;
    }>;
    /**
     * Verify a solution (called by other agents)
     */
    verifySolution(challengeId: string, verifierAgentId: string): Promise<{
        valid: boolean;
        hash?: string;
        reason?: string;
    }>;
    /**
     * Get challenge for agent
     */
    getChallenge(challengeId: string): ProofOfWorkChallenge | null;
    /**
     * Get challenges for agent
     */
    getAgentChallenges(agentId: string): ProofOfWorkChallenge[];
    /**
     * Get active challenges that need verification
     */
    getChallengesForVerification(verifierAgentId: string): ProofOfWorkChallenge[];
    /**
     * Helper methods
     */
    private validateChallengeRequest;
    private calculateTarget;
    private generateChallengeData;
    private calculateTimeLimit;
    private getAlgorithmParameters;
    private calculateReward;
    private calculatePenalty;
    private calculateGasPrice;
    private determinePriority;
    private calculateHash;
    private verifyTarget;
    private estimateIterations;
    private calculateHashRate;
    private calculateEfficiency;
    private initiateVerification;
    private calculateFinalReward;
    private expireChallenge;
    private adjustDifficulty;
    private cleanupExpiredChallenges;
    private updatePerformanceMetrics;
    /**
     * Public API methods
     */
    getCurrentDifficulty(algorithm?: string): number;
    getDifficultyHistory(limit?: number): DifficultyAdjustment[];
    getNetworkStats(): Promise<any>;
    private calculateAverageComputationTime;
    private estimateNetworkHashRate;
}
export { ProofOfWorkManager, ProofOfWorkChallenge, ProofOfWorkSolution, DifficultyAdjustment, ProofOfWorkConfig, };
//# sourceMappingURL=proof-of-work.d.ts.map