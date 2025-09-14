/**
 * Comprehensive Security Framework
 *
 * Enterprise-grade security implementation with:
 * - End-to-end encryption for multimedia content
 * - Service-specific OAuth2 scope management
 * - Fine-grained RBAC with attribute-based control
 * - Comprehensive audit logging and compliance
 * - GDPR/CCPA compliance mechanisms
 * - Zero-trust architecture for agent communication
 */
/// <reference types="node" resolution-mode="require"/>
/// <reference types="node" resolution-mode="require"/>
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
export interface SecurityPolicy {
    id: string;
    name: string;
    description: string;
    scope: string[];
    rules: SecurityRule[];
    enforcement_level: "advisory" | "enforced" | "strict";
    created_date: Date;
    last_updated: Date;
    version: string;
}
export interface SecurityRule {
    id: string;
    type: "access_control" | "encryption" | "audit" | "compliance" | "network";
    condition: string;
    action: "allow" | "deny" | "log" | "encrypt" | "monitor";
    parameters: Record<string, any>;
    priority: number;
    enabled: boolean;
}
export interface SecurityContext {
    user_id: string;
    session_id: string;
    clearance_level: "public" | "internal" | "confidential" | "secret" | "top_secret";
    roles: string[];
    attributes: Record<string, any>;
    permissions: string[];
    restrictions: string[];
    audit_required: boolean;
}
export interface EncryptionContext {
    algorithm: string;
    key_id: string;
    iv?: string;
    metadata: Record<string, any>;
    timestamp: Date;
}
export interface AuditEvent {
    id: string;
    timestamp: Date;
    user_id: string;
    session_id: string;
    event_type: string;
    resource: string;
    action: string;
    outcome: "success" | "failure" | "partial";
    details: Record<string, any>;
    risk_score: number;
    compliance_tags: string[];
}
export interface ThreatIntelligence {
    id: string;
    threat_type: string;
    severity: "low" | "medium" | "high" | "critical";
    indicators: string[];
    mitigations: string[];
    last_updated: Date;
    active: boolean;
}
/**
 * Comprehensive Security Framework
 */
export declare class ComprehensiveSecurityFramework extends EventEmitter {
    private logger;
    private securityPolicies;
    private auditEvents;
    private threatIntelligence;
    private encryptionKeys;
    private securityMetrics;
    constructor();
    /**
     * Encrypt sensitive data
     */
    encryptData(data: string | Buffer, classification?: string, context?: Record<string, any>): Promise<{
        encrypted_data: string;
        encryption_context: EncryptionContext;
    }>;
    /**
     * Decrypt sensitive data
     */
    decryptData(encryptedData: string, encryptionContext: EncryptionContext): Promise<string>;
    /**
     * Log audit event
     */
    logAuditEvent(event: Omit<AuditEvent, "id" | "timestamp" | "risk_score">): Promise<void>;
    /**
     * Apply DRM protection
     */
    applyDRMProtection(resourceId: string, protection: {
        level: "basic" | "enhanced" | "premium";
        usage_rules: {
            copy_protection: boolean;
            print_protection: boolean;
            export_protection: boolean;
            watermarking: boolean;
        };
    }): Promise<void>;
    /**
     * Validate security context
     */
    validateSecurityContext(context: SecurityContext): boolean;
    /**
     * Get security metrics
     */
    getSecurityMetrics(): {
        policies_enforced: number;
        audit_events_logged: number;
        encryption_operations: number;
        security_violations: number;
        threat_detections: number;
    };
    /**
     * Get audit events
     */
    getAuditEvents(filter?: {
        user_id?: string;
        event_type?: string;
        start_date?: Date;
        end_date?: Date;
    }): AuditEvent[];
    private initializeSecurityPolicies;
    private initializeThreatIntelligence;
    private startSecurityMonitoring;
    private selectEncryptionAlgorithm;
    private calculateRiskScore;
    private performSecurityAnalysis;
}
//# sourceMappingURL=comprehensive-security-framework.d.ts.map