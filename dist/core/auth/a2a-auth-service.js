/**
 * A2A Authentication Service
 *
 * Authentication service endpoints and message handlers for A2A protocol integration.
 * Provides secure authentication message handling and context propagation.
 */
import { EventEmitter } from "events";
import { Logger } from "../../utils/logger.js";
/**
 * A2A Authentication Service
 */
export class A2AAuthService extends EventEmitter {
    authManager;
    config;
    logger;
    // Request tracking
    activeRequests = new Map();
    auditLog = [];
    securityContexts = new Map();
    // Rate limiting
    authAttempts = new Map();
    constructor(authManager, config = {}) {
        super();
        this.authManager = authManager;
        this.config = {
            enableEncryption: config.enableEncryption ?? true,
            requireSignature: config.requireSignature ?? true,
            trustedAgents: config.trustedAgents || [],
            maxAuthAttempts: config.maxAuthAttempts || 3,
            authTimeoutMs: config.authTimeoutMs || 30000,
            enableAuditLog: config.enableAuditLog ?? true,
            ...config,
        };
        this.logger = new Logger("A2AAuthService");
        // Set up cleanup intervals
        this.startCleanupTasks();
        this.logger.info("A2A Auth Service initialized", {
            enableEncryption: this.config.enableEncryption,
            requireSignature: this.config.requireSignature,
            trustedAgents: this.config.trustedAgents.length,
            maxAuthAttempts: this.config.maxAuthAttempts,
        });
    }
    /**
     * Handle authentication message
     */
    async handleAuthMessage(message) {
        const requestId = this.generateRequestId();
        const context = this.createRequestContext(requestId, message);
        try {
            this.logger.info("Handling auth message", {
                requestId,
                method: message.method,
                from: message.from,
                to: message.to,
            });
            // Validate message security
            await this.validateMessageSecurity(message);
            // Check rate limiting
            this.checkRateLimit(message.from);
            // Track request
            this.activeRequests.set(requestId, context);
            // Set timeout
            const timeoutHandle = setTimeout(() => {
                this.handleTimeout(requestId);
            }, this.config.authTimeoutMs);
            let response;
            // Route to appropriate handler
            switch (message.method) {
                case "auth.authenticate":
                    response = await this.handleAuthenticate(message, context);
                    break;
                case "auth.refresh":
                    response = await this.handleRefresh(message, context);
                    break;
                case "auth.validate":
                    response = await this.handleValidate(message, context);
                    break;
                case "auth.revoke":
                    response = await this.handleRevoke(message, context);
                    break;
                default:
                    throw this.createAuthError("UNSUPPORTED_METHOD", `Unsupported auth method: ${message.method}`);
            }
            // Clear timeout
            clearTimeout(timeoutHandle);
            // Log success
            this.logAuditEntry(context, true, undefined, response.result);
            // Clean up request
            this.activeRequests.delete(requestId);
            this.logger.info("Auth message handled successfully", {
                requestId,
                method: message.method,
                success: response.result?.success,
            });
            return response;
        }
        catch (error) {
            this.logger.error("Auth message handling failed", {
                requestId,
                method: message.method,
                error,
            });
            // Log failure
            this.logAuditEntry(context, false, error instanceof Error ? error.message : "Unknown error");
            // Clean up request
            this.activeRequests.delete(requestId);
            // Update rate limiting
            this.recordFailedAttempt(message.from);
            // Return error response
            return this.createErrorResponse(message, error);
        }
    }
    /**
     * Handle authentication request
     */
    async handleAuthenticate(message, context) {
        const { provider, credentials, context: authContext } = message.params;
        if (!provider) {
            throw this.createAuthError("INVALID_REQUEST", "Provider is required for authentication");
        }
        try {
            // Authenticate using the specified provider
            const result = await this.authManager.authenticate(provider, {
                ...authContext,
                agentId: message.from,
                requestId: context.requestId,
            });
            // Create security context if authentication succeeded
            let securityContext;
            if (result.success && result.context) {
                securityContext = this.createSecurityContext(message.from, result.context.permissions, context.securityLevel);
                this.securityContexts.set(message.from, securityContext);
            }
            return {
                jsonrpc: "2.0",
                result: {
                    success: result.success,
                    credentials: result.credentials,
                    context: result.context,
                    error: result.error?.message,
                },
                id: message.id,
                from: message.to,
                to: message.from,
                timestamp: Date.now(),
                messageType: "response",
            };
        }
        catch (error) {
            throw this.createAuthError("AUTH_FAILED", `Authentication failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    /**
     * Handle token refresh request
     */
    async handleRefresh(message, context) {
        const { credentials } = message.params;
        if (!credentials || !credentials.refreshToken) {
            throw this.createAuthError("INVALID_REQUEST", "Refresh token is required");
        }
        try {
            // Find session for credentials
            const sessionId = await this.findSessionForCredentials(credentials);
            if (!sessionId) {
                throw this.createAuthError("SESSION_NOT_FOUND", "No active session found for credentials");
            }
            const result = await this.authManager.refreshCredentials(sessionId);
            return {
                jsonrpc: "2.0",
                result: {
                    success: result.success,
                    credentials: result.credentials,
                    error: result.error?.message,
                },
                id: message.id,
                from: message.to,
                to: message.from,
                timestamp: Date.now(),
                messageType: "response",
            };
        }
        catch (error) {
            throw this.createAuthError("REFRESH_FAILED", `Token refresh failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    /**
     * Handle credential validation request
     */
    async handleValidate(message, context) {
        const { credentials } = message.params;
        if (!credentials) {
            throw this.createAuthError("INVALID_REQUEST", "Credentials are required for validation");
        }
        try {
            const sessionId = await this.findSessionForCredentials(credentials);
            if (!sessionId) {
                return {
                    jsonrpc: "2.0",
                    result: {
                        success: false,
                        error: "No active session found",
                    },
                    id: message.id,
                    from: message.to,
                    to: message.from,
                    timestamp: Date.now(),
                    messageType: "response",
                };
            }
            const result = await this.authManager.validateCredentials(sessionId);
            return {
                jsonrpc: "2.0",
                result: {
                    success: result.valid,
                    credentials: result.valid ? credentials : undefined,
                    error: result.error,
                },
                id: message.id,
                from: message.to,
                to: message.from,
                timestamp: Date.now(),
                messageType: "response",
            };
        }
        catch (error) {
            throw this.createAuthError("VALIDATION_FAILED", `Credential validation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    /**
     * Handle credential revocation request
     */
    async handleRevoke(message, context) {
        const { credentials } = message.params;
        if (!credentials) {
            throw this.createAuthError("INVALID_REQUEST", "Credentials are required for revocation");
        }
        try {
            const sessionId = await this.findSessionForCredentials(credentials);
            if (sessionId) {
                await this.authManager.revokeCredentials(sessionId);
            }
            // Remove security context
            this.securityContexts.delete(message.from);
            return {
                jsonrpc: "2.0",
                result: {
                    success: true,
                },
                id: message.id,
                from: message.to,
                to: message.from,
                timestamp: Date.now(),
                messageType: "response",
            };
        }
        catch (error) {
            throw this.createAuthError("REVOCATION_FAILED", `Credential revocation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    /**
     * Get security context for agent
     */
    getSecurityContext(agentId) {
        return this.securityContexts.get(agentId) || null;
    }
    /**
     * Check if agent has required permission
     */
    hasPermission(agentId, permission) {
        const context = this.securityContexts.get(agentId);
        return context?.permissions.includes(permission) || false;
    }
    /**
     * Get audit log entries
     */
    getAuditLog(fromAgent, limit = 100) {
        let entries = this.auditLog;
        if (fromAgent) {
            entries = entries.filter((entry) => entry.fromAgent === fromAgent);
        }
        return entries.slice(-limit);
    }
    /**
     * Clear audit log
     */
    clearAuditLog() {
        const count = this.auditLog.length;
        this.auditLog = [];
        this.logger.info("Audit log cleared", { entriesRemoved: count });
    }
    /**
     * Get service statistics
     */
    getStats() {
        const now = Date.now();
        const recentEntries = this.auditLog.filter((entry) => now - entry.timestamp < 3600000); // Last hour
        return {
            activeRequests: this.activeRequests.size,
            securityContexts: this.securityContexts.size,
            auditLogEntries: this.auditLog.length,
            recentAuthRequests: recentEntries.length,
            successfulAuths: recentEntries.filter((entry) => entry.success).length,
            failedAuths: recentEntries.filter((entry) => !entry.success).length,
            trustedAgents: this.config.trustedAgents.length,
            rateLimitedAgents: Array.from(this.authAttempts.entries()).filter(([_, data]) => data.count >= this.config.maxAuthAttempts).length,
        };
    }
    /**
     * Shutdown service and cleanup resources
     */
    async shutdown() {
        this.logger.info("Shutting down A2A Auth Service");
        // Clear all active requests
        this.activeRequests.clear();
        // Clear security contexts
        this.securityContexts.clear();
        // Clear rate limiting
        this.authAttempts.clear();
        this.logger.info("A2A Auth Service shutdown complete");
    }
    /**
     * Validate message security requirements
     */
    async validateMessageSecurity(message) {
        // Check if agent is trusted
        if (this.config.trustedAgents.length > 0 &&
            !this.config.trustedAgents.includes(message.from)) {
            throw this.createAuthError("UNTRUSTED_AGENT", `Agent not in trusted list: ${message.from}`);
        }
        // Check signature if required
        if (this.config.requireSignature && !message.signature) {
            throw this.createAuthError("SIGNATURE_REQUIRED", "Message signature is required");
        }
        // Validate signature if present
        if (message.signature) {
            const isValid = await this.validateSignature(message);
            if (!isValid) {
                throw this.createAuthError("INVALID_SIGNATURE", "Message signature validation failed");
            }
        }
        // Check message timestamp (prevent replay attacks)
        const now = Date.now();
        const messageAge = now - message.timestamp;
        const maxAge = 300000; // 5 minutes
        if (messageAge > maxAge) {
            throw this.createAuthError("MESSAGE_TOO_OLD", "Message timestamp is too old");
        }
    }
    /**
     * Validate message signature (mock implementation)
     */
    async validateSignature(message) {
        // In real implementation, this would verify the cryptographic signature
        // using the agent's public key
        return message.signature !== "invalid-signature";
    }
    /**
     * Check rate limiting for agent
     */
    checkRateLimit(agentId) {
        const attempts = this.authAttempts.get(agentId);
        if (attempts && attempts.count >= this.config.maxAuthAttempts) {
            const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
            const cooldownPeriod = 300000; // 5 minutes
            if (timeSinceLastAttempt < cooldownPeriod) {
                throw this.createAuthError("RATE_LIMITED", `Too many auth attempts. Try again in ${Math.ceil((cooldownPeriod - timeSinceLastAttempt) / 60000)} minutes`);
            }
            else {
                // Reset attempts after cooldown
                this.authAttempts.delete(agentId);
            }
        }
    }
    /**
     * Record failed authentication attempt
     */
    recordFailedAttempt(agentId) {
        const existing = this.authAttempts.get(agentId);
        this.authAttempts.set(agentId, {
            count: (existing?.count || 0) + 1,
            lastAttempt: Date.now(),
        });
    }
    /**
     * Create request context
     */
    createRequestContext(requestId, message) {
        return {
            requestId,
            fromAgent: message.from,
            timestamp: Date.now(),
            method: message.method,
            attempts: 1,
            securityLevel: this.determineSecurityLevel(message),
        };
    }
    /**
     * Determine security level based on message
     */
    determineSecurityLevel(message) {
        // This would be based on the agent's credentials, message content, etc.
        if (this.config.trustedAgents.includes(message.from)) {
            return "elevated";
        }
        return "basic";
    }
    /**
     * Create security context for authenticated agent
     */
    createSecurityContext(agentId, permissions, authLevel) {
        return {
            agentId,
            authLevel,
            permissions,
            trustedPeers: this.config.trustedAgents,
            encryptionEnabled: this.config.enableEncryption,
            signatureRequired: this.config.requireSignature,
            tokenValidated: true,
            contextCreatedAt: Date.now(),
            contextExpiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        };
    }
    /**
     * Find session ID for given credentials
     */
    async findSessionForCredentials(credentials) {
        const activeSessions = this.authManager.getActiveSessions();
        for (const sessionId of activeSessions) {
            const session = this.authManager.getSession(sessionId);
            if (session &&
                this.credentialsMatch(session.context.credentials, credentials)) {
                return sessionId;
            }
        }
        return null;
    }
    /**
     * Check if credentials match
     */
    credentialsMatch(cred1, cred2) {
        return (cred1.provider === cred2.provider &&
            cred1.type === cred2.type &&
            cred1.accessToken === cred2.accessToken);
    }
    /**
     * Log audit entry
     */
    logAuditEntry(context, success, error, result) {
        if (!this.config.enableAuditLog)
            return;
        const entry = {
            timestamp: Date.now(),
            requestId: context.requestId,
            fromAgent: context.fromAgent,
            method: context.method,
            success,
            error,
            securityContext: this.securityContexts.get(context.fromAgent),
            metadata: result ? { result } : undefined,
        };
        this.auditLog.push(entry);
        // Keep only last 10000 entries
        if (this.auditLog.length > 10000) {
            this.auditLog.splice(0, 1000);
        }
    }
    /**
     * Handle request timeout
     */
    handleTimeout(requestId) {
        const context = this.activeRequests.get(requestId);
        if (context) {
            this.logger.warn("Auth request timeout", {
                requestId,
                fromAgent: context.fromAgent,
                method: context.method,
            });
            this.logAuditEntry(context, false, "Request timeout");
            this.activeRequests.delete(requestId);
        }
    }
    /**
     * Start cleanup tasks
     */
    startCleanupTasks() {
        // Cleanup expired security contexts every hour
        setInterval(() => {
            const now = Date.now();
            for (const [agentId, context] of this.securityContexts.entries()) {
                if (context.contextExpiresAt && context.contextExpiresAt <= now) {
                    this.securityContexts.delete(agentId);
                    this.logger.debug("Expired security context removed", { agentId });
                }
            }
        }, 3600000);
        // Cleanup old rate limiting data every hour
        setInterval(() => {
            const now = Date.now();
            const cooldownPeriod = 300000; // 5 minutes
            for (const [agentId, attempts] of this.authAttempts.entries()) {
                if (now - attempts.lastAttempt > cooldownPeriod) {
                    this.authAttempts.delete(agentId);
                }
            }
        }, 3600000);
    }
    /**
     * Generate unique request ID
     */
    generateRequestId() {
        return `a2a_auth_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
    /**
     * Create error response
     */
    createErrorResponse(message, error) {
        return {
            jsonrpc: "2.0",
            error: {
                code: -32603,
                message: error.message,
                data: {
                    type: "authentication_error",
                    source: message.to,
                    timestamp: Date.now(),
                },
            },
            id: message.id,
            from: message.to,
            to: message.from,
            timestamp: Date.now(),
            messageType: "response",
        };
    }
    /**
     * Create auth-specific error
     */
    createAuthError(code, message) {
        const error = new Error(message);
        error.code = code;
        return error;
    }
}
