/**
 * A2A Rate Limiter and DDoS Protection System
 *
 * Implements advanced rate limiting and DDoS protection:
 * - Token bucket algorithm with burst capacity
 * - Sliding window rate limiting
 * - Adaptive throttling based on system load
 * - Circuit breakers for fault isolation
 * - Geofencing and IP reputation scoring
 * - Behavioral analysis for anomaly detection
 * - Distributed rate limiting across nodes
 * - Auto-scaling thresholds and backpressure
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
export interface RateLimitRule {
    ruleId: string;
    name: string;
    agentPattern: string | RegExp;
    limits: {
        requestsPerSecond: number;
        requestsPerMinute: number;
        requestsPerHour: number;
        requestsPerDay: number;
        burstCapacity: number;
        concurrentRequests: number;
    };
    priority: number;
    enabled: boolean;
    exemptions?: string[];
    conditions?: {
        timeWindows?: string[];
        messageTypes?: string[];
        capabilities?: string[];
    };
}
export interface CircuitBreakerConfig {
    failureThreshold: number;
    recoveryTimeout: number;
    halfOpenMaxRequests: number;
    monitoringWindow: number;
    autoRecovery: boolean;
}
export interface AdaptiveThrottlingConfig {
    enabled: boolean;
    cpuThreshold: number;
    memoryThreshold: number;
    responseTimeThreshold: number;
    backpressureMultiplier: number;
    recoveryRate: number;
}
export interface DDoSProtectionConfig {
    enabled: boolean;
    detectionWindow: number;
    anomalyThreshold: number;
    behaviorAnalysis: boolean;
    ipReputation: boolean;
    geofencing: {
        enabled: boolean;
        allowedRegions: string[];
        blockedRegions: string[];
    };
    autoMitigation: {
        enabled: boolean;
        blockDuration: number;
        escalationLevels: number[];
    };
}
export interface RateLimitingConfig {
    defaultLimits: {
        requestsPerSecond: number;
        requestsPerMinute: number;
        requestsPerHour: number;
        requestsPerDay: number;
        burstCapacity: number;
        concurrentRequests: number;
    };
    circuitBreaker: CircuitBreakerConfig;
    adaptiveThrottling: AdaptiveThrottlingConfig;
    ddosProtection: DDoSProtectionConfig;
    distributedMode: {
        enabled: boolean;
        syncInterval: number;
        consensusThreshold: number;
    };
    monitoring: {
        metricsWindow: number;
        alertThresholds: {
            highUsage: number;
            rateLimitHit: number;
            ddosDetected: number;
        };
    };
}
export interface RateLimitState {
    agentId: string;
    tokens: number;
    lastRefill: number;
    requestCounts: {
        perSecond: number[];
        perMinute: number[];
        perHour: number[];
        perDay: number[];
    };
    concurrentRequests: number;
    circuitState: "closed" | "open" | "half-open";
    lastCircuitStateChange: number;
    reputationScore: number;
    behaviorProfile: BehaviorProfile;
}
export interface BehaviorProfile {
    requestPatterns: Map<string, number>;
    timeDistribution: number[];
    messageTypeDistribution: Map<string, number>;
    averagePayloadSize: number;
    errorRate: number;
    suspiciousBehaviorCount: number;
    lastAnalysis: number;
}
export interface RateLimitResult {
    allowed: boolean;
    reason?: string;
    retryAfter?: number;
    tokensRemaining?: number;
    quotaResetTime?: number;
    circuitState?: string;
    adaptiveMultiplier?: number;
}
export interface SystemMetrics {
    cpuUsage: number;
    memoryUsage: number;
    averageResponseTime: number;
    activeConnections: number;
    requestRate: number;
    errorRate: number;
    timestamp: number;
}
export declare class A2ARateLimiter extends EventEmitter {
    private logger;
    private cache;
    private config;
    private rateLimitRules;
    private agentStates;
    private globalState;
    private circuitBreakers;
    private systemMetrics;
    private metricsHistory;
    private suspiciousIPs;
    private behaviorAnalyzer;
    private ipReputationService;
    private adaptiveMultiplier;
    private lastAdaptiveAdjustment;
    private processingMetrics;
    constructor(config?: Partial<RateLimitingConfig>);
    /**
     * Initialize configuration with defaults
     */
    private initializeConfig;
    /**
     * Initialize global rate limiting state
     */
    private initializeGlobalState;
    /**
     * Initialize default rate limiting rules
     */
    private initializeDefaultRules;
    /**
     * Initialize system monitoring
     */
    private initializeSystemMonitoring;
    /**
     * Initialize DDoS protection components
     */
    private initializeDDoSProtection;
    /**
     * Check if request is allowed under rate limits
     */
    checkRateLimit(agentId: string, messageType?: string, payloadSize?: number, sourceIP?: string): Promise<RateLimitResult>;
    /**
     * Release resources when request completes
     */
    releaseRequest(agentId: string, success?: boolean): Promise<void>;
    /**
     * Check DDoS protection measures
     */
    private checkDDoSProtection;
    /**
     * Token bucket rate limiting check
     */
    private checkTokenBucket;
    /**
     * Sliding window rate limiting check
     */
    private checkSlidingWindows;
    /**
     * Concurrent request limiting check
     */
    private checkConcurrentRequests;
    /**
     * Apply adaptive throttling based on system metrics
     */
    private applyAdaptiveThrottling;
    /**
     * Helper methods
     */
    private createAgentState;
    private findApplicableRule;
    private multiplyLimits;
    private updateRequestCounters;
    private updateBehaviorProfile;
    private trackFailure;
    private getOrCreateCircuitBreaker;
    private calculateQuotaResetTime;
    private getIPRegion;
    private collectSystemMetrics;
    private startMaintenanceTasks;
    private cleanupOldStates;
    private resetCounters;
    private syncWithDistributedNodes;
    /**
     * Public API methods
     */
    addRule(rule: RateLimitRule): void;
    removeRule(ruleId: string): boolean;
    getRules(): RateLimitRule[];
    getAgentState(agentId: string): RateLimitState | null;
    getSystemMetrics(): SystemMetrics;
    getProcessingMetrics(): {
        requestsProcessed: number;
        requestsBlocked: number;
        ddosAttacksDetected: number;
        circuitBreakersTripped: number;
        adaptiveAdjustments: number;
        averageProcessingTime: number;
    };
    blockAgent(agentId: string, duration?: number): Promise<void>;
    unblockAgent(agentId: string): Promise<void>;
}
//# sourceMappingURL=a2a-rate-limiter.d.ts.map