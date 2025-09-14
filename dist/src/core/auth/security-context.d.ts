/**
 * Security Context Propagation System
 *
 * Manages security context propagation across the authentication system,
 * ensuring secure context sharing between components and maintaining security boundaries
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { SecurityContext, AuthContext } from "../../types/auth.js";
/**
 * Security context configuration
 */
export interface SecurityContextConfig {
    enableContextPropagation: boolean;
    maxContextAge: number;
    enableContextValidation: boolean;
    contextEncryptionEnabled: boolean;
    enableAuditTrail: boolean;
    trustedComponents: string[];
    securityLevels: string[];
}
/**
 * Context validation result
 */
interface ContextValidationResult {
    valid: boolean;
    expired: boolean;
    errors: string[];
    warnings: string[];
}
/**
 * Security audit entry
 */
interface SecurityAuditEntry {
    timestamp: number;
    eventType: "context_created" | "context_propagated" | "context_validated" | "context_expired" | "security_violation";
    contextId: string;
    component: string;
    details: Record<string, any>;
    securityLevel: string;
}
/**
 * Security Context Manager
 */
export declare class SecurityContextManager extends EventEmitter {
    private config;
    private logger;
    private activeContexts;
    private contextAccessControls;
    private auditTrail;
    private trustedComponents;
    private componentSessions;
    private contextValidationRules;
    private cleanupInterval?;
    private auditCleanupInterval?;
    constructor(config?: Partial<SecurityContextConfig>);
    /**
     * Create new security context
     */
    createSecurityContext(authContext: AuthContext, sourceComponent: string, options?: {
        securityLevel?: string;
        requiredPermissions?: string[];
        allowedComponents?: string[];
        customData?: Record<string, any>;
    }): Promise<SecurityContext>;
    /**
     * Propagate context to another component
     */
    propagateContext(contextId: string, targetComponent: string, requiredPermissions?: string[]): Promise<SecurityContext>;
    /**
     * Validate security context
     */
    validateContext(contextId: string): Promise<ContextValidationResult>;
    /**
     * Get security context
     */
    getSecurityContext(contextId: string, component: string): Promise<SecurityContext | null>;
    /**
     * Revoke security context
     */
    revokeContext(contextId: string, component: string): Promise<boolean>;
    /**
     * List active contexts for component
     */
    getActiveContexts(component?: string): string[];
    /**
     * Get security statistics
     */
    getSecurityStats(): {
        totalContexts: number;
        activeComponents: number;
        trustedComponents: number;
        totalAccesses: number;
        averageAge: number;
        auditEntries: number;
        securityViolations: number;
    };
    /**
     * Get audit trail
     */
    getAuditTrail(limit?: number, component?: string): SecurityAuditEntry[];
    /**
     * Add custom validation rule
     */
    addValidationRule(name: string, rule: (context: SecurityContext) => boolean): void;
    /**
     * Remove validation rule
     */
    removeValidationRule(name: string): boolean;
    /**
     * Register trusted component
     */
    registerTrustedComponent(component: string): void;
    /**
     * Unregister trusted component
     */
    unregisterTrustedComponent(component: string): void;
    /**
     * Shutdown and cleanup
     */
    shutdown(): Promise<void>;
    /**
     * Setup default validation rules
     */
    private setupDefaultValidationRules;
    /**
     * Start cleanup tasks
     */
    private startCleanupTasks;
    /**
     * Cleanup expired contexts
     */
    private cleanupExpiredContexts;
    /**
     * Cleanup old audit trail entries
     */
    private cleanupAuditTrail;
    /**
     * Validate source component
     */
    private validateSourceComponent;
    /**
     * Check component authorization
     */
    private checkComponentAuthorization;
    /**
     * Calculate risk score
     */
    private calculateRiskScore;
    /**
     * Check if IP is known/trusted
     */
    private isKnownIP;
    /**
     * Check if device is trusted
     */
    private isTrustedDevice;
    /**
     * Generate unique context ID
     */
    private generateContextId;
    /**
     * Log security audit entry
     */
    private logSecurityAudit;
    /**
     * Create security error
     */
    private createSecurityError;
}
export {};
//# sourceMappingURL=security-context.d.ts.map