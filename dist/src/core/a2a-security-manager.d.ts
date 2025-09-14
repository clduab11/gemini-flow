/**
 * Agent-to-Agent Security Manager
 *
 * Implements comprehensive security mechanisms for A2A protocol:
 * - Mutual TLS authentication with certificate pinning
 * - JWT-based identity tokens with capability-based access control
 * - Secure key exchange with ECDH and quantum-resistant algorithms
 * - Message signing and verification with replay protection
 * - Rate limiting and DDoS protection with adaptive throttling
 * - Comprehensive audit logging and security monitoring
 * - Zero-trust architecture with continuous verification
 */
/// <reference types="node" resolution-mode="require"/>
/// <reference types="node" resolution-mode="require"/>
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { AuthenticationManager } from "./auth-manager.js";
export interface A2AIdentity {
    agentId: string;
    agentType: string;
    publicKey: string;
    certificates: {
        identity: string;
        tls: string;
        signing: string;
    };
    capabilities: string[];
    trustLevel: "untrusted" | "basic" | "verified" | "trusted";
    metadata: {
        createdAt: Date;
        lastVerified: Date;
        version: string;
        swarmId?: string;
    };
}
export interface A2AMessage {
    id: string;
    from: string;
    to: string | string[];
    type: "request" | "response" | "broadcast" | "gossip";
    payload: any;
    timestamp: number;
    nonce: string;
    signature: string;
    capabilities: string[];
    metadata: {
        priority: "low" | "medium" | "high" | "critical";
        ttl?: number;
        replyTo?: string;
        correlationId?: string;
    };
}
export interface SecurityPolicy {
    authentication: {
        requireMutualTLS: boolean;
        requireSignedMessages: boolean;
        allowSelfSigned: boolean;
        certificateValidityPeriod: number;
        keyRotationInterval: number;
    };
    authorization: {
        defaultTrustLevel: "untrusted" | "basic" | "verified" | "trusted";
        capabilityExpiration: number;
        requireExplicitPermissions: boolean;
        allowCapabilityDelegation: boolean;
    };
    rateLimiting: {
        defaultRequestsPerMinute: number;
        burstThreshold: number;
        adaptiveThrottling: boolean;
        ddosProtection: boolean;
    };
    monitoring: {
        auditLevel: "minimal" | "standard" | "comprehensive";
        anomalyDetection: boolean;
        threatIntelligence: boolean;
        realTimeAlerts: boolean;
    };
    zeroTrust: {
        continuousVerification: boolean;
        leastPrivilege: boolean;
        networkSegmentation: boolean;
        behaviorAnalysis: boolean;
    };
}
export interface A2ASession {
    sessionId: string;
    agentId: string;
    establishedAt: Date;
    lastActivity: Date;
    sharedSecret: Buffer;
    encryptionKey: Buffer;
    macKey: Buffer;
    sequenceNumber: number;
    capabilities: string[];
    trustScore: number;
    isActive: boolean;
}
export interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
    burstMultiplier: number;
    adaptiveThreshold: number;
    penaltyDuration: number;
}
export interface SecurityEvent {
    id: string;
    timestamp: Date;
    type: "authentication" | "authorization" | "rate_limit" | "anomaly" | "threat";
    severity: "info" | "warning" | "error" | "critical";
    agentId: string;
    details: any;
    signature: string;
}
export declare class A2ASecurityManager extends EventEmitter {
    private logger;
    private authManager;
    private cache;
    private securityPolicy;
    private trustedCAs;
    private agentIdentities;
    private activeSessions;
    private keyPairs;
    private certificateStore;
    private nonceStore;
    private rateLimiters;
    private circuitBreakers;
    private threatDetector;
    private securityEvents;
    private anomalyDetector;
    private performanceMetrics;
    private trustEvaluator;
    private behaviorAnalyzer;
    private networkSegmentation;
    constructor(authManager: AuthenticationManager, options?: Partial<SecurityPolicy>);
    /**
     * Initialize security policy with defaults
     */
    private initializeSecurityPolicy;
    /**
     * Initialize cryptographic infrastructure
     */
    private initializeCryptographicInfrastructure;
    /**
     * Initialize rate limiting system
     */
    private initializeRateLimiting;
    /**
     * Initialize monitoring and audit systems
     */
    private initializeMonitoring;
    /**
     * Initialize zero-trust architecture components
     */
    private initializeZeroTrust;
    /**
     * AUTHENTICATION: Register a new agent with identity verification
     */
    registerAgent(agentId: string, agentType: string, publicKey: string, certificates: {
        identity: string;
        tls: string;
        signing: string;
    }, capabilities?: string[]): Promise<A2AIdentity>;
    /**
     * AUTHENTICATION: Establish secure session between agents
     */
    establishSession(fromAgentId: string, toAgentId: string, requestedCapabilities?: string[]): Promise<A2ASession>;
    /**
     * AUTHORIZATION: Check if agent has required capabilities
     */
    authorizeCapabilities(agentId: string, requiredCapabilities: string[]): Promise<boolean>;
    /**
     * MESSAGE SECURITY: Sign and send secure message
     */
    sendSecureMessage(fromAgentId: string, toAgentId: string | string[], messageType: "request" | "response" | "broadcast" | "gossip", payload: any, options?: {
        priority?: "low" | "medium" | "high" | "critical";
        ttl?: number;
        replyTo?: string;
        correlationId?: string;
        capabilities?: string[];
    }): Promise<A2AMessage>;
    /**
     * MESSAGE SECURITY: Verify and process received message
     */
    receiveSecureMessage(message: A2AMessage, receivingAgentId: string): Promise<{
        valid: boolean;
        payload?: any;
        metadata?: any;
    }>;
    /**
     * RATE LIMITING: Check if agent can make request
     */
    private checkRateLimit;
    /**
     * ZERO TRUST: Continuous verification of agent behavior
     */
    performContinuousVerification(agentId: string): Promise<void>;
    /**
     * MONITORING: Create security event
     */
    private createSecurityEvent;
    /**
     * Helper methods for cryptographic operations
     */
    private verifyAgentCertificates;
    private performKeyExchange;
    private deriveSessionKeys;
    private signMessage;
    private verifyMessageSignature;
    private encryptMessagePayload;
    private decryptMessagePayload;
    private signSecurityEvent;
    /**
     * Utility methods
     */
    private getAgentIdentity;
    private getActiveSession;
    private canGrantCapability;
    private reduceTrustLevel;
    private updateAgentIdentity;
    private revokeAgentAccess;
    private cleanOldNonces;
    private loadTrustedCAs;
    private scheduleKeyRotation;
    private rotateKeys;
    private getOrCreateCircuitBreaker;
    private setupSecurityEventHandlers;
    private handleCriticalSecurityEvent;
    private startPerformanceMonitoring;
    private collectPerformanceMetrics;
    /**
     * Public API methods
     */
    getSecurityPolicy(): SecurityPolicy;
    getAgentIdentities(): A2AIdentity[];
    getActiveSessions(): A2ASession[];
    getSecurityEvents(limit?: number): SecurityEvent[];
    getPerformanceMetrics(): any;
    emergencyShutdown(reason: string): Promise<void>;
}
//# sourceMappingURL=a2a-security-manager.d.ts.map