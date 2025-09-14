/**
 * Attack Simulation Framework for A2A Protocol Security Testing
 *
 * Implements comprehensive attack simulation and testing framework
 * to validate the security and resilience of the A2A protocol
 * against various malicious behaviors and attack vectors.
 *
 * Features:
 * - Byzantine fault injection and simulation
 * - Sybil attack simulation with identity spoofing
 * - Eclipse attack network isolation testing
 * - DDoS and flooding attack scenarios
 * - Message tampering and replay attacks
 * - Consensus manipulation and disruption
 * - Performance degradation under attack
 * - Recovery and resilience testing
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { MaliciousAgentDetector } from "./malicious-detection.js";
import { ReputationSystem } from "./reputation-system.js";
import { QuarantineRecoveryManager } from "./quarantine-recovery.js";
export interface AttackScenario {
    scenarioId: string;
    name: string;
    description: string;
    attackType: "byzantine" | "sybil" | "eclipse" | "ddos" | "replay" | "tampering" | "consensus_disruption";
    severity: "low" | "medium" | "high" | "critical";
    parameters: {
        attackerCount: number;
        targetAgents: string[];
        duration: number;
        intensity: number;
        sophistication: number;
    };
    config: {
        stealthy: boolean;
        coordinated: boolean;
        adaptive: boolean;
        persistent: boolean;
    };
    expectedOutcomes: {
        detectionTime: number;
        damageLevel: number;
        recoveryTime: number;
        systemImpact: number;
    };
    successCriteria: {
        detectionRequired: boolean;
        quarantineRequired: boolean;
        maxDetectionTime: number;
        maxDamageLevel: number;
        maxRecoveryTime: number;
    };
}
export interface AttackAgent {
    agentId: string;
    realAgentId?: string;
    attackType: string;
    behavior: AttackBehavior;
    capabilities: string[];
    isActive: boolean;
    state: {
        phase: "preparing" | "attacking" | "detected" | "quarantined" | "stopped";
        startTime: Date;
        messagesSent: number;
        detectionsReceived: number;
        quarantineAttempts: number;
    };
    stealth: {
        enabled: boolean;
        mimicTarget?: string;
        randomization: number;
        camouflageLevel: number;
    };
}
export interface AttackBehavior {
    behaviorId: string;
    name: string;
    messagePattern: {
        frequency: number;
        burstiness: number;
        targets: "random" | "specific" | "flooding";
        payloadSize: "normal" | "oversized" | "random";
        messageTypes: string[];
    };
    protocolViolations: {
        invalidSignatures: number;
        nonceReuse: number;
        timestampManipulation: number;
        capabilityViolations: number;
    };
    consensusBehavior: {
        participation: number;
        agreement: number;
        delayResponses: boolean;
        conflictingProposals: boolean;
        viewChangeManipulation: boolean;
    };
    networkBehavior: {
        dropMessages: number;
        delayMessages: number;
        duplicateMessages: number;
        routingManipulation: boolean;
    };
}
export interface AttackSimulationResult {
    simulationId: string;
    scenarioId: string;
    startTime: Date;
    endTime: Date;
    duration: number;
    attackersDeployed: number;
    messagesGenerated: number;
    protocolViolations: number;
    networkDisruptions: number;
    detection: {
        detectionTime: number;
        detectionAccuracy: number;
        falsePositives: number;
        detectedAttackers: string[];
        detectionMethods: string[];
    };
    response: {
        quarantineTime: number;
        quarantinedAgents: string[];
        recoveryTime: number;
        systemDowntime: number;
    };
    impact: {
        consensusDisruption: number;
        performanceDegradation: number;
        networkFragmentation: number;
        dataIntegrityImpact: number;
    };
    success: {
        attackSuccessful: boolean;
        defenseEffective: boolean;
        meetsCriteria: boolean;
        score: number;
    };
    metrics: {
        systemThroughput: number;
        systemLatency: number;
        resourceUsage: number;
        networkHealth: number;
    };
    logs: AttackSimulationLog[];
}
export interface AttackSimulationLog {
    timestamp: Date;
    level: "info" | "warning" | "error" | "critical";
    source: string;
    event: string;
    details: any;
}
export declare class AttackSimulationFramework extends EventEmitter {
    private logger;
    private attackScenarios;
    private attackAgents;
    private activeSimulations;
    private simulationHistory;
    private maliciousDetector;
    private reputationSystem;
    private quarantineManager;
    private isRunning;
    private currentSimulation?;
    private simulationTimer?;
    private config;
    constructor(maliciousDetector: MaliciousAgentDetector, reputationSystem: ReputationSystem, quarantineManager: QuarantineRecoveryManager);
    /**
     * Initialize predefined attack scenarios
     */
    private initializeAttackScenarios;
    /**
     * Setup event listeners for security components
     */
    private setupEventListeners;
    /**
     * Run attack simulation
     */
    runSimulation(scenarioId: string, customConfig?: Partial<AttackScenario>): Promise<AttackSimulationResult>;
    /**
     * Deploy attack agents for simulation
     */
    private deployAttackAgents;
    /**
     * Execute the attack simulation
     */
    private executeAttack;
    /**
     * Start specific attack behavior for an agent
     */
    private startAttackBehavior;
    /**
     * Byzantine attack behavior
     */
    private startByzantineAttack;
    /**
     * Sybil attack behavior
     */
    private startSybilAttack;
    /**
     * Eclipse attack behavior
     */
    private startEclipseAttack;
    /**
     * DDoS attack behavior
     */
    private startDDoSAttack;
    /**
     * Message tampering attack behavior
     */
    private startTamperingAttack;
    /**
     * Consensus disruption attack behavior
     */
    private startConsensusDisruption;
    /**
     * Monitor simulation progress and collect metrics
     */
    private monitorSimulation;
    /**
     * Helper methods
     */
    private generateAttackBehaviors;
    private generateAttackerCapabilities;
    private createMaliciousMessage;
    private sendMaliciousMessage;
    private createFakeBehaviorProfile;
    private waitForSimulationCompletion;
    private stopAttackAgents;
    private updateSimulationMetrics;
    private checkDetectionEvents;
    private updateImpactAssessment;
    private analyzeSimulationResults;
    private handleDetectionEvent;
    private handleReputationEvent;
    private handleQuarantineEvent;
    private addSimulationLog;
    /**
     * Public API methods
     */
    getAttackScenarios(): AttackScenario[];
    getSimulationHistory(): AttackSimulationResult[];
    getActiveSimulation(): AttackSimulationResult | null;
    stopSimulation(): Promise<void>;
    getSystemStats(): Promise<any>;
    private calculateAverageDetectionTime;
    private calculateSuccessRate;
    private getScenarioTypeDistribution;
}
export { AttackSimulationFramework, AttackScenario, AttackAgent, AttackBehavior, AttackSimulationResult, AttackSimulationLog, };
//# sourceMappingURL=attack-simulation.d.ts.map