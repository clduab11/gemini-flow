/**
 * A2A Authentication Service
 *
 * Authentication service endpoints and message handlers for A2A protocol integration.
 * Provides secure authentication message handling and context propagation.
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { UnifiedAuthManager } from "./unified-auth-manager.js";
import { A2ASecurityContext } from "../../types/auth.js";
import { A2AMessage, A2AResponse, AgentId } from "../../types/a2a.js";
/**
 * A2A Auth Service Configuration
 */
export interface A2AAuthServiceConfig {
    enableEncryption: boolean;
    requireSignature: boolean;
    trustedAgents: AgentId[];
    maxAuthAttempts: number;
    authTimeoutMs: number;
    enableAuditLog: boolean;
}
/**
 * Audit log entry
 */
interface AuditLogEntry {
    timestamp: number;
    requestId: string;
    fromAgent: AgentId;
    method: string;
    success: boolean;
    error?: string;
    securityContext?: A2ASecurityContext;
    metadata?: Record<string, any>;
}
/**
 * A2A Authentication Service
 */
export declare class A2AAuthService extends EventEmitter {
    private authManager;
    private config;
    private logger;
    private activeRequests;
    private auditLog;
    private securityContexts;
    private authAttempts;
    constructor(authManager: UnifiedAuthManager, config?: Partial<A2AAuthServiceConfig>);
    /**
     * Handle authentication message
     */
    handleAuthMessage(message: A2AMessage): Promise<A2AResponse>;
    /**
     * Handle authentication request
     */
    private handleAuthenticate;
    /**
     * Handle token refresh request
     */
    private handleRefresh;
    /**
     * Handle credential validation request
     */
    private handleValidate;
    /**
     * Handle credential revocation request
     */
    private handleRevoke;
    /**
     * Get security context for agent
     */
    getSecurityContext(agentId: AgentId): A2ASecurityContext | null;
    /**
     * Check if agent has required permission
     */
    hasPermission(agentId: AgentId, permission: string): boolean;
    /**
     * Get audit log entries
     */
    getAuditLog(fromAgent?: AgentId, limit?: number): AuditLogEntry[];
    /**
     * Clear audit log
     */
    clearAuditLog(): void;
    /**
     * Get service statistics
     */
    getStats(): {
        activeRequests: number;
        securityContexts: number;
        auditLogEntries: number;
        recentAuthRequests: number;
        successfulAuths: number;
        failedAuths: number;
        trustedAgents: number;
        rateLimitedAgents: number;
    };
    /**
     * Shutdown service and cleanup resources
     */
    shutdown(): Promise<void>;
    /**
     * Validate message security requirements
     */
    private validateMessageSecurity;
    /**
     * Validate message signature (mock implementation)
     */
    private validateSignature;
    /**
     * Check rate limiting for agent
     */
    private checkRateLimit;
    /**
     * Record failed authentication attempt
     */
    private recordFailedAttempt;
    /**
     * Create request context
     */
    private createRequestContext;
    /**
     * Determine security level based on message
     */
    private determineSecurityLevel;
    /**
     * Create security context for authenticated agent
     */
    private createSecurityContext;
    /**
     * Find session ID for given credentials
     */
    private findSessionForCredentials;
    /**
     * Check if credentials match
     */
    private credentialsMatch;
    /**
     * Log audit entry
     */
    private logAuditEntry;
    /**
     * Handle request timeout
     */
    private handleTimeout;
    /**
     * Start cleanup tasks
     */
    private startCleanupTasks;
    /**
     * Generate unique request ID
     */
    private generateRequestId;
    /**
     * Create error response
     */
    private createErrorResponse;
    /**
     * Create auth-specific error
     */
    private createAuthError;
}
export {};
//# sourceMappingURL=a2a-auth-service.d.ts.map