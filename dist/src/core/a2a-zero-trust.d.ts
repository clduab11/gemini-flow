/**
 * A2A Zero Trust Architecture System
 *
 * Implements comprehensive zero-trust security model for agent-to-agent communication:
 * - Never trust, always verify principle
 * - Continuous authentication and authorization
 * - Least privilege access control with dynamic permissions
 * - Micro-segmentation and network isolation
 * - Context-aware security policies
 * - Real-time risk assessment and adaptive responses
 * - Identity-centric security with behavioral analysis
 * - Policy engine with dynamic rule evaluation
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
export interface ZeroTrustPolicy {
    policyId: string;
    name: string;
    description: string;
    version: string;
    conditions: {
        agentTypes?: string[];
        agentIds?: string[];
        timeWindows?: TimeWindow[];
        locations?: string[];
        networkSegments?: string[];
        riskLevels?: RiskLevel[];
        capabilities?: string[];
        resources?: ResourcePattern[];
    };
    actions: {
        allow: boolean;
        requirements?: string[];
        restrictions?: string[];
        monitoring?: string[];
        timeLimit?: number;
    };
    priority: number;
    enabled: boolean;
    createdAt: Date;
    lastModified: Date;
    metadata: {
        author: string;
        reason: string;
        compliance: string[];
        tags: string[];
    };
}
export interface TrustScore {
    agentId: string;
    overallScore: number;
    components: {
        identity: number;
        behavior: number;
        location: number;
        device: number;
        network: number;
        compliance: number;
        reputation: number;
    };
    factors: {
        positiveFactors: string[];
        negativeFactors: string[];
        unknownFactors: string[];
    };
    history: TrustScoreHistory[];
    lastUpdated: Date;
}
export interface TrustScoreHistory {
    timestamp: Date;
    score: number;
    reason: string;
    contributing_factors: string[];
}
export interface SecurityContext {
    agentId: string;
    sessionId?: string;
    requestId: string;
    timestamp: Date;
    source: {
        ip: string;
        location?: GeoLocation;
        network: NetworkInfo;
        device?: DeviceInfo;
    };
    identity: {
        verified: boolean;
        authMethod: string;
        certificates: string[];
        trustLevel: string;
    };
    behavior: {
        pattern: string;
        anomalyScore: number;
        riskFactors: string[];
    };
    resource: {
        type: string;
        classification: string;
        owner: string;
        sensitivity: "public" | "internal" | "confidential" | "restricted";
    };
    metadata: Record<string, any>;
}
export interface AccessDecision {
    allowed: boolean;
    reason: string;
    conditions?: string[];
    restrictions?: string[];
    monitoring?: string[];
    timeLimit?: number;
    trustScore: number;
    riskLevel: RiskLevel;
    policyMatches: string[];
    adaptiveActions?: string[];
}
export interface NetworkSegment {
    segmentId: string;
    name: string;
    type: "production" | "staging" | "development" | "isolated" | "quarantine";
    allowedAgentTypes: string[];
    securityLevel: "low" | "medium" | "high" | "critical";
    isolationRules: IsolationRule[];
    trafficPolicies: TrafficPolicy[];
    monitoring: {
        enabled: boolean;
        level: "basic" | "enhanced" | "forensic";
        retention: number;
    };
}
export interface IsolationRule {
    ruleId: string;
    fromSegments: string[];
    toSegments: string[];
    protocol: string;
    ports: number[];
    action: "allow" | "deny" | "monitor" | "quarantine";
    conditions?: string[];
}
export interface TrafficPolicy {
    policyId: string;
    protocol: string;
    direction: "inbound" | "outbound" | "bidirectional";
    inspection: boolean;
    encryption: boolean;
    logging: boolean;
    rateLimiting?: {
        enabled: boolean;
        limits: Record<string, number>;
    };
}
export interface RiskAssessment {
    riskLevel: RiskLevel;
    score: number;
    factors: RiskFactor[];
    mitigations: string[];
    recommendations: string[];
    confidence: number;
    validUntil: Date;
}
export interface RiskFactor {
    type: "identity" | "behavior" | "location" | "device" | "network" | "temporal" | "contextual";
    severity: "low" | "medium" | "high" | "critical";
    description: string;
    score: number;
    mitigated: boolean;
}
export interface AdaptiveResponse {
    triggerId: string;
    responseType: "allow" | "challenge" | "restrict" | "deny" | "isolate";
    actions: string[];
    duration?: number;
    escalation?: {
        enabled: boolean;
        thresholds: number[];
        actions: string[];
    };
    monitoring: {
        enhanced: boolean;
        alerts: boolean;
        logging: string;
    };
}
type RiskLevel = "very_low" | "low" | "medium" | "high" | "very_high" | "critical";
type TimeWindow = {
    start: string;
    end: string;
    days?: string[];
};
type ResourcePattern = {
    pattern: string;
    type: string;
};
type GeoLocation = {
    country: string;
    region: string;
    city: string;
    coordinates?: [number, number];
};
type NetworkInfo = {
    segment: string;
    vlan?: number;
    subnet?: string;
};
type DeviceInfo = {
    type: string;
    os?: string;
    version?: string;
    fingerprint?: string;
};
export declare class A2AZeroTrust extends EventEmitter {
    private logger;
    private cache;
    private policies;
    private policyEngine;
    private trustScores;
    private trustCalculator;
    private networkSegments;
    private segmentationEngine;
    private riskAssessor;
    private adaptiveResponder;
    private behaviorAnalyzer;
    private contextAnalyzer;
    private metrics;
    constructor();
    /**
     * Initialize zero trust components
     */
    private initializeComponents;
    /**
     * Initialize default zero trust policies
     */
    private initializeDefaultPolicies;
    /**
     * Initialize network segments
     */
    private initializeNetworkSegments;
    /**
     * Evaluate access request using zero trust principles
     */
    evaluateAccess(agentId: string, resource: string, action: string, context: Partial<SecurityContext>): Promise<AccessDecision>;
    /**
     * Update trust score for an agent
     */
    updateTrustScore(agentId: string, event: {
        type: "authentication" | "behavior" | "compliance" | "security_incident";
        outcome: "positive" | "negative" | "neutral";
        details: Record<string, any>;
    }): Promise<TrustScore>;
    /**
     * Add or update zero trust policy
     */
    addPolicy(policy: Omit<ZeroTrustPolicy, "createdAt" | "lastModified">): Promise<void>;
    /**
     * Create network segment
     */
    createNetworkSegment(segment: NetworkSegment): Promise<void>;
    /**
     * Quarantine an agent
     */
    quarantineAgent(agentId: string, reason: string, duration?: number): Promise<void>;
    /**
     * Private implementation methods
     */
    private buildSecurityContext;
    private calculateTrustScore;
    private assessRisk;
    private evaluatePolicies;
    private determineAdaptiveResponse;
    private executeAdaptiveResponse;
    private executeAction;
    private initializeTrustScore;
    private validatePolicy;
    private storeAccessDecision;
    private enhanceMonitoring;
    private startContinuousMonitoring;
    private performContinuousTrustUpdates;
    private performComplianceChecks;
    private validateNetworkSegments;
    private checkPolicyCompliance;
    private collectMetrics;
    /**
     * Public API methods
     */
    getTrustScore(agentId: string): TrustScore | null;
    getPolicies(): ZeroTrustPolicy[];
    getNetworkSegments(): NetworkSegment[];
    getMetrics(): {
        accessRequests: number;
        accessGranted: number;
        accessDenied: number;
        riskAssessments: number;
        adaptiveResponses: number;
        policyViolations: number;
        trustScoreUpdates: number;
        averageDecisionTime: number;
    };
    isAgentQuarantined(agentId: string): Promise<boolean>;
    releaseFromQuarantine(agentId: string): Promise<void>;
}
export {};
//# sourceMappingURL=a2a-zero-trust.d.ts.map