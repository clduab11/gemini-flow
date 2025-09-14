/**
 * A2A Security Integration Layer
 *
 * Integrates A2A security components with existing authentication and security systems:
 * - Seamless integration with AuthenticationManager
 * - Bridge to SecurityOptimizationManager features
 * - Unified security event handling and correlation
 * - Performance optimization and monitoring integration
 * - Backward compatibility with existing security flows
 * - Configuration management and policy synchronization
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { AuthenticationManager, UserProfile } from "./auth-manager.js";
import { SecurityOptimizationManager } from "./security-optimization-manager.js";
import { A2AIdentity } from "./a2a-security-manager.js";
export interface A2AIntegrationConfig {
    enableA2ASecurity: boolean;
    enableKeyExchange: boolean;
    enableMessageSecurity: boolean;
    enableRateLimiting: boolean;
    enableAuditLogging: boolean;
    enableZeroTrust: boolean;
    bridgeToExistingSecurity: boolean;
    performanceOptimization: boolean;
    eventCorrelation: boolean;
    backwardCompatibility: boolean;
}
export interface SecurityIntegrationMetrics {
    a2aRequestsProcessed: number;
    legacyRequestsProcessed: number;
    securityEventsCorrelated: number;
    performanceOptimizationEvents: number;
    integrationErrors: number;
    averageA2AProcessingTime: number;
    averageLegacyProcessingTime: number;
    systemResourceUtilization: number;
}
export interface UnifiedSecurityEvent {
    eventId: string;
    timestamp: Date;
    source: "a2a" | "legacy" | "integrated";
    type: string;
    severity: "info" | "warning" | "error" | "critical";
    agentId?: string;
    userId?: string;
    details: Record<string, any>;
    correlatedEvents: string[];
    handledBy: string[];
}
export interface SecurityPolicySync {
    lastSync: Date;
    policies: {
        a2aPolicies: number;
        legacyPolicies: number;
        unifiedPolicies: number;
    };
    conflicts: {
        count: number;
        resolved: number;
        pending: string[];
    };
}
/**
 * Main integration orchestrator for A2A security systems
 */
export declare class A2ASecurityIntegration extends EventEmitter {
    private logger;
    private cache;
    private config;
    private authManager;
    private securityOptimizer;
    private a2aSecurityManager?;
    private keyExchange?;
    private messageSecurity?;
    private rateLimiter?;
    private auditLogger?;
    private zeroTrust?;
    private eventCorrelator;
    private policyManager;
    private performanceOptimizer;
    private metrics;
    constructor(authManager: AuthenticationManager, securityOptimizer: SecurityOptimizationManager, config?: Partial<A2AIntegrationConfig>);
    /**
     * Initialize configuration with defaults
     */
    private initializeConfig;
    /**
     * Initialize A2A security components based on configuration
     */
    private initializeA2AComponents;
    /**
     * Initialize integration services
     */
    private initializeIntegrationServices;
    /**
     * Setup event handlers for component integration
     */
    private setupEventHandlers;
    /**
     * Unified authentication method that supports both user and agent authentication
     */
    authenticateEntity(entityType: "user" | "agent", credentials: any, options?: {
        enableA2A?: boolean;
        capabilities?: string[];
        sessionDuration?: number;
    }): Promise<{
        success: boolean;
        profile?: UserProfile | A2AIdentity;
        session?: any;
        securityLevel: string;
        warnings?: string[];
    }>;
    /**
     * Unified access control that bridges legacy and A2A systems
     */
    checkAccess(entityId: string, resource: string, action: string, context: {
        entityType?: "user" | "agent";
        sourceIP?: string;
        userAgent?: string;
        sessionId?: string;
        capabilities?: string[];
    }): Promise<{
        allowed: boolean;
        reason: string;
        conditions?: string[];
        monitoring?: string[];
        securityLevel: string;
    }>;
    /**
     * Unified rate limiting that considers both user and agent patterns
     */
    checkRateLimit(entityId: string, entityType: "user" | "agent", action: string, context: {
        sourceIP?: string;
        messageType?: string;
        payloadSize?: number;
    }): Promise<{
        allowed: boolean;
        reason?: string;
        retryAfter?: number;
        quotaInfo?: any;
    }>;
    /**
     * Unified audit logging for both systems
     */
    logSecurityEvent(eventType: string, entityId: string, entityType: "user" | "agent", details: {
        action: string;
        resource: string;
        outcome: "success" | "failure" | "denied";
        metadata?: Record<string, any>;
        sourceIP?: string;
        userAgent?: string;
    }): Promise<void>;
    /**
     * Get comprehensive security status for an entity
     */
    getSecurityStatus(entityId: string, entityType: "user" | "agent"): Promise<{
        trustScore?: number;
        riskLevel?: string;
        lastActivity?: Date;
        securityAlerts?: any[];
        quotaStatus?: any;
        permissions?: string[];
        quarantined?: boolean;
    }>;
    /**
     * Emergency security lockdown
     */
    emergencyLockdown(reason: string, scope?: "system" | "a2a" | "legacy"): Promise<void>;
    /**
     * Event handlers for component integration
     */
    private handleUserAuthentication;
    private handleSessionExpiration;
    private handleOptimizationEvent;
    private handleSecurityAlert;
    private handleAgentRegistration;
    private handleA2ASessionEstablished;
    private handleAgentBlocked;
    private handleDDoSDetection;
    private handleAccessDecision;
    private handleAgentQuarantine;
    private handleAuditSecurityAlert;
    /**
     * Utility methods
     */
    private detectEntityType;
    private determineSeverity;
    private getEnabledComponents;
    private startMonitoring;
    private collectMetrics;
    private calculateResourceUtilization;
    private performHealthCheck;
    private checkComponentHealth;
    /**
     * Public API methods
     */
    getMetrics(): SecurityIntegrationMetrics;
    getConfig(): A2AIntegrationConfig;
    updateConfig(updates: Partial<A2AIntegrationConfig>): Promise<void>;
    getComponentStatus(): Record<string, boolean>;
}
//# sourceMappingURL=a2a-integration.d.ts.map