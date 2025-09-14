/**
 * MCP Authentication Provider
 *
 * Model Context Protocol authentication integration that provides authentication
 * capabilities as MCP tools and handles authentication requests from MCP clients
 */
import { EventEmitter } from "events";
import { Logger } from "../../utils/logger.js";
/**
 * MCP Authentication Provider Implementation
 */
export class MCPAuthenticationProvider extends EventEmitter {
    name = "mcp-auth";
    version;
    authManager;
    config;
    logger;
    // Request tracking
    activeRequests = new Map();
    requestCounter = 0;
    // Metrics
    metrics = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        activeRequests: 0,
        capabilityUsage: {},
        errorsByType: {},
    };
    // Capabilities registry
    capabilities = [
        {
            method: "auth/authenticate",
            description: "Authenticate using specified provider and credentials",
            parameters: {
                provider: {
                    type: "string",
                    required: true,
                    description: "Authentication provider type",
                },
                credentials: {
                    type: "object",
                    required: false,
                    description: "Provider-specific credentials",
                },
                options: {
                    type: "object",
                    required: false,
                    description: "Additional authentication options",
                },
            },
            required: true,
            version: "1.0.0",
        },
        {
            method: "auth/refresh",
            description: "Refresh authentication tokens",
            parameters: {
                sessionId: {
                    type: "string",
                    required: true,
                    description: "Authentication session ID",
                },
                forceRefresh: {
                    type: "boolean",
                    required: false,
                    description: "Force refresh even if not expired",
                },
            },
            required: true,
            version: "1.0.0",
        },
        {
            method: "auth/validate",
            description: "Validate authentication credentials",
            parameters: {
                sessionId: {
                    type: "string",
                    required: true,
                    description: "Authentication session ID",
                },
                checkExpiry: {
                    type: "boolean",
                    required: false,
                    description: "Check token expiration",
                },
            },
            required: true,
            version: "1.0.0",
        },
        {
            method: "auth/revoke",
            description: "Revoke authentication credentials",
            parameters: {
                sessionId: {
                    type: "string",
                    required: true,
                    description: "Authentication session ID",
                },
            },
            required: true,
            version: "1.0.0",
        },
        {
            method: "auth/status",
            description: "Get authentication status and session information",
            parameters: {
                sessionId: {
                    type: "string",
                    required: false,
                    description: "Specific session ID (optional)",
                },
            },
            required: false,
            version: "1.0.0",
        },
        {
            method: "auth/capabilities",
            description: "List available authentication capabilities",
            parameters: {},
            required: false,
            version: "1.0.0",
        },
        {
            method: "auth/providers",
            description: "List available authentication providers",
            parameters: {},
            required: false,
            version: "1.0.0",
        },
        {
            method: "auth/metrics",
            description: "Get authentication metrics and statistics",
            parameters: {
                includeDetailed: {
                    type: "boolean",
                    required: false,
                    description: "Include detailed metrics",
                },
            },
            required: false,
            version: "1.0.0",
        },
    ];
    constructor(authManager, config = {}) {
        super();
        this.authManager = authManager;
        this.config = {
            version: config.version || "1.0.0",
            enabledCapabilities: config.enabledCapabilities || this.capabilities.map((c) => c.method),
            maxConcurrentRequests: config.maxConcurrentRequests || 50,
            requestTimeoutMs: config.requestTimeoutMs || 30000,
            enableMetrics: config.enableMetrics ?? true,
            enableCaching: config.enableCaching ?? true,
            ...config,
        };
        this.version = this.config.version;
        this.logger = new Logger("MCPAuthProvider");
        // Filter capabilities based on enabled list
        this.capabilities = this.capabilities.filter((cap) => this.config.enabledCapabilities.includes(cap.method));
        this.logger.info("MCP Auth Provider initialized", {
            version: this.version,
            capabilities: this.capabilities.length,
            maxConcurrentRequests: this.config.maxConcurrentRequests,
        });
    }
    /**
     * Handle MCP authentication request
     */
    async authenticate(params) {
        const requestId = this.generateRequestId();
        const startTime = Date.now();
        try {
            this.logger.info("MCP authenticate request", {
                requestId,
                params: Object.keys(params),
            });
            // Track request
            const context = this.createRequestContext(requestId, "auth/authenticate");
            this.trackRequest(context);
            // Validate parameters
            this.validateAuthenticateParams(params);
            // Check concurrent request limit
            if (this.activeRequests.size >= this.config.maxConcurrentRequests) {
                throw this.createMCPError("REQUEST_LIMIT_EXCEEDED", "Maximum concurrent requests exceeded");
            }
            const { provider, credentials, options = {} } = params;
            // Authenticate using unified auth manager
            const result = await this.authManager.authenticate(provider, {
                ...options,
                mcpRequestId: requestId,
                source: "mcp",
            });
            // Update metrics
            this.updateMetrics("auth/authenticate", true, Date.now() - startTime);
            this.logger.info("MCP authenticate successful", {
                requestId,
                provider,
                success: result.success,
                duration: Date.now() - startTime,
            });
            return result;
        }
        catch (error) {
            this.updateMetrics("auth/authenticate", false, Date.now() - startTime);
            const authError = error instanceof Error
                ? error
                : new Error("Unknown authentication error");
            this.logger.error("MCP authenticate failed", {
                requestId,
                error: authError,
            });
            return {
                success: false,
                error: this.createAuthError("AUTHENTICATION_FAILED", authError.message, authError),
            };
        }
        finally {
            this.untrackRequest(requestId);
        }
    }
    /**
     * Handle MCP token refresh request
     */
    async refresh(params) {
        const requestId = this.generateRequestId();
        const startTime = Date.now();
        try {
            this.logger.info("MCP refresh request", {
                requestId,
                sessionId: params.sessionId,
            });
            const context = this.createRequestContext(requestId, "auth/refresh");
            this.trackRequest(context);
            this.validateRefreshParams(params);
            const { sessionId, forceRefresh = false } = params;
            // Check if refresh is needed (unless forced)
            if (!forceRefresh) {
                const validation = await this.authManager.validateCredentials(sessionId);
                if (validation.valid && !validation.expired) {
                    // No refresh needed
                    const session = this.authManager.getSession(sessionId);
                    return {
                        success: true,
                        credentials: session?.context.credentials,
                    };
                }
            }
            const result = await this.authManager.refreshCredentials(sessionId);
            this.updateMetrics("auth/refresh", result.success, Date.now() - startTime);
            this.logger.info("MCP refresh completed", {
                requestId,
                sessionId,
                success: result.success,
                duration: Date.now() - startTime,
            });
            return result;
        }
        catch (error) {
            this.updateMetrics("auth/refresh", false, Date.now() - startTime);
            const authError = error instanceof Error ? error : new Error("Unknown refresh error");
            this.logger.error("MCP refresh failed", { requestId, error: authError });
            return {
                success: false,
                error: this.createAuthError("REFRESH_FAILED", authError.message, authError),
            };
        }
        finally {
            this.untrackRequest(requestId);
        }
    }
    /**
     * Handle MCP credential validation request
     */
    async validate(params) {
        const requestId = this.generateRequestId();
        const startTime = Date.now();
        try {
            this.logger.debug("MCP validate request", {
                requestId,
                sessionId: params.sessionId,
            });
            const context = this.createRequestContext(requestId, "auth/validate");
            this.trackRequest(context);
            this.validateValidateParams(params);
            const { sessionId, checkExpiry = true } = params;
            const result = await this.authManager.validateCredentials(sessionId);
            // If not checking expiry, override expired status
            if (!checkExpiry && result.expired) {
                return { ...result, valid: true, expired: false };
            }
            this.updateMetrics("auth/validate", result.valid, Date.now() - startTime);
            this.logger.debug("MCP validate completed", {
                requestId,
                sessionId,
                valid: result.valid,
                duration: Date.now() - startTime,
            });
            return result;
        }
        catch (error) {
            this.updateMetrics("auth/validate", false, Date.now() - startTime);
            this.logger.error("MCP validate failed", { requestId, error });
            return {
                valid: false,
                error: error instanceof Error ? error.message : "Unknown validation error",
            };
        }
        finally {
            this.untrackRequest(requestId);
        }
    }
    /**
     * Handle additional MCP capabilities
     */
    async handleCapability(method, params) {
        const requestId = this.generateRequestId();
        const startTime = Date.now();
        try {
            this.logger.debug("MCP capability request", {
                requestId,
                method,
                params: Object.keys(params),
            });
            const context = this.createRequestContext(requestId, method);
            this.trackRequest(context);
            let result;
            switch (method) {
                case "auth/revoke":
                    result = await this.handleRevoke(params);
                    break;
                case "auth/status":
                    result = await this.handleStatus(params);
                    break;
                case "auth/capabilities":
                    result = await this.handleCapabilities(params);
                    break;
                case "auth/providers":
                    result = await this.handleProviders(params);
                    break;
                case "auth/metrics":
                    result = await this.handleMetrics(params);
                    break;
                default:
                    throw this.createMCPError("UNSUPPORTED_METHOD", `Unsupported method: ${method}`);
            }
            this.updateMetrics(method, true, Date.now() - startTime);
            this.logger.debug("MCP capability completed", {
                requestId,
                method,
                duration: Date.now() - startTime,
            });
            return result;
        }
        catch (error) {
            this.updateMetrics(method, false, Date.now() - startTime);
            this.logger.error("MCP capability failed", { requestId, method, error });
            throw error;
        }
        finally {
            this.untrackRequest(requestId);
        }
    }
    /**
     * Get MCP provider information
     */
    getProviderInfo() {
        return {
            name: this.name,
            version: this.version,
            capabilities: this.capabilities,
            metrics: this.config.enableMetrics ? this.getMetrics() : undefined,
            config: {
                maxConcurrentRequests: this.config.maxConcurrentRequests,
                requestTimeoutMs: this.config.requestTimeoutMs,
                enabledCapabilities: this.config.enabledCapabilities.length,
            },
        };
    }
    /**
     * Handle revocation request
     */
    async handleRevoke(params) {
        try {
            this.validateRevokeParams(params);
            const { sessionId } = params;
            await this.authManager.revokeCredentials(sessionId);
            return { success: true };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Unknown revocation error",
            };
        }
    }
    /**
     * Handle status request
     */
    async handleStatus(params) {
        const { sessionId } = params;
        if (sessionId) {
            // Get specific session status
            const session = this.authManager.getSession(sessionId);
            const validation = session
                ? await this.authManager.validateCredentials(sessionId)
                : null;
            return {
                sessionId,
                exists: !!session,
                valid: validation?.valid || false,
                expired: validation?.expired || false,
                session: session
                    ? {
                        id: session.id,
                        status: session.status,
                        createdAt: session.createdAt,
                        lastActivity: session.lastActivity,
                        refreshCount: session.refreshCount,
                    }
                    : null,
            };
        }
        else {
            // Get overall auth status
            const activeSessions = this.authManager.getActiveSessions();
            return {
                totalSessions: activeSessions.length,
                activeSessions,
                metrics: this.config.enableMetrics ? this.getMetrics() : null,
            };
        }
    }
    /**
     * Handle capabilities request
     */
    async handleCapabilities(params) {
        return {
            capabilities: this.capabilities,
            version: this.version,
            enabled: this.config.enabledCapabilities,
        };
    }
    /**
     * Handle providers request
     */
    async handleProviders(params) {
        const availableProviders = this.authManager.getAvailableProviders();
        return {
            providers: availableProviders,
            total: availableProviders.length,
        };
    }
    /**
     * Handle metrics request
     */
    async handleMetrics(params) {
        const { includeDetailed = false } = params;
        const baseMetrics = this.getMetrics();
        if (includeDetailed) {
            const authManagerMetrics = this.authManager.getMetrics();
            return {
                mcp: baseMetrics,
                authManager: authManagerMetrics,
                combined: {
                    totalRequests: baseMetrics.totalRequests + authManagerMetrics.totalAuthentications,
                    successRate: this.calculateSuccessRate(baseMetrics) +
                        authManagerMetrics.successfulAuthentications /
                            Math.max(authManagerMetrics.totalAuthentications, 1),
                    activeContexts: authManagerMetrics.activeContexts,
                },
            };
        }
        return baseMetrics;
    }
    /**
     * Get metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            activeRequests: this.activeRequests.size,
        };
    }
    /**
     * Calculate success rate
     */
    calculateSuccessRate(metrics) {
        const total = metrics.totalRequests;
        return total > 0 ? (metrics.successfulRequests / total) * 100 : 0;
    }
    /**
     * Track active request
     */
    trackRequest(context) {
        this.activeRequests.set(context.requestId, context);
        // Set timeout
        context.timeout = setTimeout(() => {
            this.handleRequestTimeout(context.requestId);
        }, this.config.requestTimeoutMs);
    }
    /**
     * Untrack request
     */
    untrackRequest(requestId) {
        const context = this.activeRequests.get(requestId);
        if (context?.timeout) {
            clearTimeout(context.timeout);
        }
        this.activeRequests.delete(requestId);
    }
    /**
     * Handle request timeout
     */
    handleRequestTimeout(requestId) {
        const context = this.activeRequests.get(requestId);
        if (context) {
            this.logger.warn("MCP request timeout", {
                requestId,
                method: context.method,
                duration: Date.now() - context.timestamp,
            });
            this.updateMetrics(context.method, false, Date.now() - context.timestamp);
            this.activeRequests.delete(requestId);
        }
    }
    /**
     * Update metrics
     */
    updateMetrics(method, success, responseTime) {
        if (!this.config.enableMetrics)
            return;
        this.metrics.totalRequests++;
        if (success) {
            this.metrics.successfulRequests++;
        }
        else {
            this.metrics.failedRequests++;
        }
        // Update average response time
        const totalTime = this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) +
            responseTime;
        this.metrics.averageResponseTime = totalTime / this.metrics.totalRequests;
        // Update capability usage
        this.metrics.capabilityUsage[method] =
            (this.metrics.capabilityUsage[method] || 0) + 1;
    }
    /**
     * Create request context
     */
    createRequestContext(requestId, method) {
        return {
            requestId,
            method,
            timestamp: Date.now(),
        };
    }
    /**
     * Generate unique request ID
     */
    generateRequestId() {
        return `mcp_${Date.now()}_${++this.requestCounter}`;
    }
    /**
     * Parameter validation methods
     */
    validateAuthenticateParams(params) {
        if (!params.provider) {
            throw this.createMCPError("INVALID_PARAMS", "Provider is required");
        }
    }
    validateRefreshParams(params) {
        if (!params.sessionId) {
            throw this.createMCPError("INVALID_PARAMS", "Session ID is required");
        }
    }
    validateValidateParams(params) {
        if (!params.sessionId) {
            throw this.createMCPError("INVALID_PARAMS", "Session ID is required");
        }
    }
    validateRevokeParams(params) {
        if (!params.sessionId) {
            throw this.createMCPError("INVALID_PARAMS", "Session ID is required");
        }
    }
    /**
     * Create MCP-specific error
     */
    createMCPError(code, message) {
        const error = new Error(message);
        error.code = code;
        error.type = "mcp_error";
        return error;
    }
    /**
     * Create auth error
     */
    createAuthError(code, message, originalError) {
        const error = new Error(message);
        error.code = code;
        error.type = "authentication";
        error.retryable = false;
        error.originalError = originalError;
        error.context = {
            provider: this.name,
            source: "mcp",
            timestamp: Date.now(),
        };
        return error;
    }
}
