/**
 * Unified Authentication Manager
 *
 * Central authentication coordinator that manages multiple authentication providers,
 * credential storage, token caching, and provides a unified interface for all auth operations
 */
import { EventEmitter } from "events";
import { Logger } from "../../utils/logger.js";
import { OAuth2Provider } from "./oauth2-provider.js";
import { VertexAIProvider } from "./vertex-ai-provider.js";
import { createCredentialStorage } from "./credential-storage.js";
import { createTokenCache } from "./token-cache.js";
/**
 * Unified Authentication Manager
 */
export class UnifiedAuthManager extends EventEmitter {
    config;
    logger;
    storage;
    cache;
    // Provider management
    providers = new Map();
    sessions = new Map();
    eventHandlers = new Set();
    // Background tasks
    tokenRefreshInterval;
    sessionCleanupInterval;
    metricsInterval;
    // Metrics
    metrics = {
        totalAuthentications: 0,
        successfulAuthentications: 0,
        failedAuthentications: 0,
        tokenRefreshes: 0,
        tokenValidations: 0,
        averageAuthTime: 0,
        errorsByType: {},
        activeContexts: 0,
        cacheHitRate: 0,
    };
    constructor(config) {
        super();
        this.config = config;
        this.logger = new Logger("UnifiedAuthManager");
        // Initialize storage and cache
        this.storage = createCredentialStorage(config.storage);
        this.cache = createTokenCache({
            maxSize: config.cache.maxSize || 1000,
            defaultTTL: config.cache.ttl,
            enableMetrics: true,
            enableEvents: true,
        });
        // Set up event forwarding
        this.setupEventForwarding();
        // Initialize providers
        this.initializeProviders();
        // Start background tasks
        this.startBackgroundTasks();
        this.logger.info("Unified Auth Manager initialized", {
            providers: Array.from(this.providers.keys()),
            storageType: config.storage.type,
            cacheType: config.cache.type,
            enableMetrics: config.logging.level,
        });
    }
    /**
     * Authenticate using specified provider
     */
    async authenticate(providerType, options = {}) {
        const startTime = Date.now();
        try {
            this.logger.info("Starting authentication", {
                provider: providerType,
                options: Object.keys(options),
            });
            const registration = this.providers.get(providerType);
            if (!registration || !registration.enabled) {
                throw new Error(`Provider not available: ${providerType}`);
            }
            // Attempt authentication
            const result = await registration.provider.authenticate();
            if (result.success && result.credentials && result.context) {
                // Create session
                const session = await this.createSession(result.context);
                // Store credentials
                await this.storeCredentials(session.id, result.credentials);
                // Cache credentials
                await this.cacheCredentials(session.id, result.credentials);
                // Update metrics
                this.updateAuthMetrics(true, Date.now() - startTime);
                // Emit events
                this.emitAuthEvent({
                    type: "authentication",
                    timestamp: Date.now(),
                    provider: providerType,
                    sessionId: session.id,
                    success: true,
                });
                this.logger.info("Authentication successful", {
                    provider: providerType,
                    sessionId: session.id,
                    duration: Date.now() - startTime,
                });
                return {
                    ...result,
                    context: {
                        ...result.context,
                        sessionId: session.id,
                    },
                };
            }
            else {
                this.updateAuthMetrics(false, Date.now() - startTime);
                this.emitAuthEvent({
                    type: "authentication",
                    timestamp: Date.now(),
                    provider: providerType,
                    success: false,
                    error: result.error?.message,
                });
                return result;
            }
        }
        catch (error) {
            const authError = this.createAuthError("authentication", "AUTH_FAILED", `Authentication failed for provider ${providerType}`, error);
            this.updateAuthMetrics(false, Date.now() - startTime);
            this.emitAuthEvent({
                type: "error",
                timestamp: Date.now(),
                provider: providerType,
                success: false,
                error: authError.message,
            });
            this.logger.error("Authentication failed", {
                provider: providerType,
                error: authError,
            });
            return { success: false, error: authError };
        }
    }
    /**
     * Refresh credentials for a session
     */
    async refreshCredentials(sessionId) {
        try {
            this.logger.info("Refreshing credentials", { sessionId });
            const session = this.sessions.get(sessionId);
            if (!session) {
                return {
                    success: false,
                    requiresReauth: true,
                    error: this.createAuthError("authentication", "SESSION_NOT_FOUND", "Session not found"),
                };
            }
            const provider = this.getProviderForCredentials(session.context.credentials);
            if (!provider) {
                return {
                    success: false,
                    requiresReauth: true,
                    error: this.createAuthError("authentication", "PROVIDER_NOT_FOUND", "Provider not found"),
                };
            }
            // Attempt refresh
            const result = await provider.refresh(session.context.credentials);
            if (result.success && result.credentials) {
                // Update session
                session.context.credentials = result.credentials;
                session.refreshCount++;
                session.lastActivity = Date.now();
                // Update storage and cache
                await this.storeCredentials(sessionId, result.credentials);
                await this.cacheCredentials(sessionId, result.credentials);
                this.metrics.tokenRefreshes++;
                this.emitAuthEvent({
                    type: "refresh",
                    timestamp: Date.now(),
                    provider: session.context.credentials.provider,
                    sessionId,
                    success: true,
                });
                this.logger.info("Credentials refreshed successfully", { sessionId });
            }
            else if (result.requiresReauth) {
                // Mark session as requiring re-authentication
                session.status = "expired";
                this.emitAuthEvent({
                    type: "refresh",
                    timestamp: Date.now(),
                    provider: session.context.credentials.provider,
                    sessionId,
                    success: false,
                    error: "Requires re-authentication",
                });
            }
            return result;
        }
        catch (error) {
            const authError = this.createAuthError("authentication", "REFRESH_FAILED", "Failed to refresh credentials", error);
            this.logger.error("Credential refresh failed", {
                sessionId,
                error: authError,
            });
            return { success: false, error: authError };
        }
    }
    /**
     * Validate credentials for a session
     */
    async validateCredentials(sessionId) {
        try {
            this.logger.debug("Validating credentials", { sessionId });
            const session = this.sessions.get(sessionId);
            if (!session) {
                return { valid: false, error: "Session not found" };
            }
            const provider = this.getProviderForCredentials(session.context.credentials);
            if (!provider) {
                return { valid: false, error: "Provider not found" };
            }
            const result = await provider.validate(session.context.credentials);
            // Update session activity
            session.lastActivity = Date.now();
            this.metrics.tokenValidations++;
            if (!result.valid && result.expired) {
                session.status = "expired";
            }
            return result;
        }
        catch (error) {
            this.logger.error("Credential validation failed", { sessionId, error });
            return {
                valid: false,
                error: error instanceof Error ? error.message : "Unknown error",
            };
        }
    }
    /**
     * Get credentials for a session (with automatic refresh if needed)
     */
    async getCredentials(sessionId, autoRefresh = true) {
        try {
            // Check cache first
            const cached = await this.cache.get(sessionId);
            if (cached) {
                // Validate cached credentials
                const validation = await this.validateCredentials(sessionId);
                if (validation.valid) {
                    return cached;
                }
                // Try auto-refresh if expired and enabled
                if (validation.expired && autoRefresh) {
                    const refreshResult = await this.refreshCredentials(sessionId);
                    if (refreshResult.success && refreshResult.credentials) {
                        return refreshResult.credentials;
                    }
                }
            }
            // Fall back to storage
            const stored = await this.storage.retrieve(sessionId);
            if (stored) {
                // Update cache
                await this.cache.set(sessionId, stored);
                return stored;
            }
            return null;
        }
        catch (error) {
            this.logger.error("Failed to get credentials", { sessionId, error });
            return null;
        }
    }
    /**
     * Revoke credentials and end session
     */
    async revokeCredentials(sessionId) {
        try {
            this.logger.info("Revoking credentials", { sessionId });
            const session = this.sessions.get(sessionId);
            if (!session) {
                throw new Error("Session not found");
            }
            const provider = this.getProviderForCredentials(session.context.credentials);
            if (provider) {
                try {
                    await provider.revoke(session.context.credentials);
                }
                catch (error) {
                    this.logger.warn("Provider revocation failed", { sessionId, error });
                    // Continue with cleanup even if provider revocation fails
                }
            }
            // Clean up storage and cache
            await this.storage.delete(sessionId);
            await this.cache.delete(sessionId);
            // Remove session
            this.sessions.delete(sessionId);
            this.emitAuthEvent({
                type: "revocation",
                timestamp: Date.now(),
                provider: session.context.credentials.provider,
                sessionId,
                success: true,
            });
            this.logger.info("Credentials revoked successfully", { sessionId });
        }
        catch (error) {
            const authError = this.createAuthError("authentication", "REVOCATION_FAILED", "Failed to revoke credentials", error);
            this.logger.error("Credential revocation failed", {
                sessionId,
                error: authError,
            });
            throw authError;
        }
    }
    /**
     * List active sessions
     */
    getActiveSessions() {
        return Array.from(this.sessions.keys());
    }
    /**
     * Get session information
     */
    getSession(sessionId) {
        const session = this.sessions.get(sessionId);
        return session ? { ...session } : null; // Return copy
    }
    /**
     * Register custom authentication provider
     */
    registerProvider(type, provider, config = {}, options = {}) {
        this.providers.set(type, {
            provider,
            config,
            enabled: options.enabled ?? true,
            priority: options.priority ?? 100,
        });
        this.logger.info("Provider registered", { type, enabled: options.enabled });
    }
    /**
     * Unregister authentication provider
     */
    unregisterProvider(type) {
        const removed = this.providers.delete(type);
        if (removed) {
            this.logger.info("Provider unregistered", { type });
        }
    }
    /**
     * Enable/disable provider
     */
    setProviderEnabled(type, enabled) {
        const registration = this.providers.get(type);
        if (registration) {
            registration.enabled = enabled;
            this.logger.info("Provider status changed", { type, enabled });
        }
    }
    /**
     * Get available providers
     */
    getAvailableProviders() {
        return Array.from(this.providers.keys()).filter((type) => {
            const registration = this.providers.get(type);
            return registration?.enabled;
        });
    }
    /**
     * Add event handler
     */
    addEventHandler(handler) {
        this.eventHandlers.add(handler);
    }
    /**
     * Remove event handler
     */
    removeEventHandler(handler) {
        this.eventHandlers.delete(handler);
    }
    /**
     * Get authentication metrics
     */
    getMetrics() {
        const cacheMetrics = this.cache.getMetrics
            ? this.cache.getMetrics()
            : { hitRate: 0 };
        return {
            ...this.metrics,
            activeContexts: this.sessions.size,
            cacheHitRate: cacheMetrics.hitRate,
        };
    }
    /**
     * Force cleanup of expired sessions
     */
    async cleanup() {
        const now = Date.now();
        let cleanedCount = 0;
        for (const [sessionId, session] of this.sessions.entries()) {
            // Check if session is expired
            const maxAge = this.config.security.maxSessionAge;
            const sessionAge = now - session.createdAt;
            if (sessionAge > maxAge || session.status === "expired") {
                try {
                    await this.revokeCredentials(sessionId);
                    cleanedCount++;
                }
                catch (error) {
                    this.logger.warn("Failed to cleanup expired session", {
                        sessionId,
                        error,
                    });
                }
            }
        }
        if (cleanedCount > 0) {
            this.logger.info("Session cleanup completed", {
                cleanedSessions: cleanedCount,
            });
        }
        return cleanedCount;
    }
    /**
     * Shutdown auth manager and cleanup resources
     */
    async shutdown() {
        this.logger.info("Shutting down Unified Auth Manager");
        // Stop background tasks
        if (this.tokenRefreshInterval) {
            clearInterval(this.tokenRefreshInterval);
        }
        if (this.sessionCleanupInterval) {
            clearInterval(this.sessionCleanupInterval);
        }
        if (this.metricsInterval) {
            clearInterval(this.metricsInterval);
        }
        // Cleanup active sessions
        const activeSessionIds = Array.from(this.sessions.keys());
        for (const sessionId of activeSessionIds) {
            try {
                await this.revokeCredentials(sessionId);
            }
            catch (error) {
                this.logger.warn("Failed to cleanup session during shutdown", {
                    sessionId,
                    error,
                });
            }
        }
        // Cleanup cache
        if (this.cache.destroy) {
            this.cache.destroy();
        }
        this.logger.info("Unified Auth Manager shutdown complete");
    }
    /**
     * Initialize built-in providers
     */
    initializeProviders() {
        // Initialize OAuth2 provider if configured
        if (this.config.providers.oauth2) {
            const oauth2Provider = new OAuth2Provider(this.config.providers.oauth2);
            this.registerProvider("oauth2", oauth2Provider, this.config.providers.oauth2);
        }
        // Initialize Vertex AI provider if configured
        if (this.config.providers.vertexAI) {
            const vertexAIProvider = new VertexAIProvider(this.config.providers.vertexAI);
            this.registerProvider("vertex-ai", vertexAIProvider, this.config.providers.vertexAI);
        }
        // Add more providers as needed
    }
    /**
     * Set up event forwarding from storage and cache
     */
    setupEventForwarding() {
        // Forward storage events
        this.storage.on("stored", (data) => this.emit("credentials_stored", data));
        this.storage.on("retrieved", (data) => this.emit("credentials_retrieved", data));
        this.storage.on("deleted", (data) => this.emit("credentials_deleted", data));
        // Forward cache events
        this.cache.on("cache_hit", (data) => this.emit("cache_hit", data));
        this.cache.on("cache_miss", (data) => this.emit("cache_miss", data));
        this.cache.on("cache_set", (data) => this.emit("cache_set", data));
    }
    /**
     * Start background maintenance tasks
     */
    startBackgroundTasks() {
        // Token refresh check every 5 minutes
        this.tokenRefreshInterval = setInterval(() => {
            this.checkTokenRefresh().catch((error) => {
                this.logger.error("Token refresh check failed", { error });
            });
        }, 5 * 60 * 1000);
        // Session cleanup every hour
        this.sessionCleanupInterval = setInterval(() => {
            this.cleanup().catch((error) => {
                this.logger.error("Session cleanup failed", { error });
            });
        }, 60 * 60 * 1000);
        // Metrics update every minute (if enabled)
        if (this.config.logging.level === "debug") {
            this.metricsInterval = setInterval(() => {
                this.updateMetrics();
            }, 60 * 1000);
        }
    }
    /**
     * Check for tokens that need refresh
     */
    async checkTokenRefresh() {
        const refreshBuffer = this.config.security.tokenRefreshBuffer;
        const now = Date.now();
        for (const [sessionId, session] of this.sessions.entries()) {
            const credentials = session.context.credentials;
            if (credentials.expiresAt && credentials.refreshToken) {
                const timeUntilExpiry = credentials.expiresAt - now;
                if (timeUntilExpiry <= refreshBuffer) {
                    try {
                        await this.refreshCredentials(sessionId);
                    }
                    catch (error) {
                        this.logger.warn("Background token refresh failed", {
                            sessionId,
                            error,
                        });
                    }
                }
            }
        }
    }
    /**
     * Update internal metrics
     */
    updateMetrics() {
        this.logger.debug("Auth metrics", this.getMetrics());
    }
    /**
     * Create new authentication session
     */
    async createSession(context) {
        const sessionId = context.sessionId || this.generateSessionId();
        const session = {
            id: sessionId,
            context: {
                ...context,
                sessionId,
            },
            createdAt: Date.now(),
            lastActivity: Date.now(),
            refreshCount: 0,
            status: "authenticated",
        };
        this.sessions.set(sessionId, session);
        return session;
    }
    /**
     * Store credentials using storage backend
     */
    async storeCredentials(sessionId, credentials) {
        await this.storage.store(sessionId, credentials);
    }
    /**
     * Cache credentials for fast access
     */
    async cacheCredentials(sessionId, credentials) {
        const ttl = credentials.expiresAt
            ? credentials.expiresAt - Date.now()
            : this.config.cache.ttl;
        await this.cache.set(sessionId, credentials, ttl);
    }
    /**
     * Get provider for specific credentials
     */
    getProviderForCredentials(credentials) {
        const providerType = this.getProviderTypeFromCredentials(credentials);
        const registration = this.providers.get(providerType);
        return registration?.provider || null;
    }
    /**
     * Map credentials to provider type
     */
    getProviderTypeFromCredentials(credentials) {
        // This is a simplified mapping - in practice you'd have more sophisticated logic
        switch (credentials.provider) {
            case "oauth2":
                return "oauth2";
            case "vertex-ai":
                return "vertex-ai";
            case "google-ai":
                return "google-ai";
            default:
                return credentials.provider;
        }
    }
    /**
     * Generate unique session ID
     */
    generateSessionId() {
        return `auth_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
    /**
     * Update authentication metrics
     */
    updateAuthMetrics(success, duration) {
        this.metrics.totalAuthentications++;
        if (success) {
            this.metrics.successfulAuthentications++;
        }
        else {
            this.metrics.failedAuthentications++;
        }
        // Update average auth time
        const totalTime = this.metrics.averageAuthTime * (this.metrics.totalAuthentications - 1) +
            duration;
        this.metrics.averageAuthTime =
            totalTime / this.metrics.totalAuthentications;
    }
    /**
     * Emit authentication event to handlers
     */
    emitAuthEvent(event) {
        // Emit on EventEmitter
        this.emit("auth_event", event);
        // Call registered handlers
        this.eventHandlers.forEach((handler) => {
            try {
                const result = handler(event);
                if (result instanceof Promise) {
                    result.catch((error) => {
                        this.logger.error("Auth event handler error", { error });
                    });
                }
            }
            catch (error) {
                this.logger.error("Auth event handler error", { error });
            }
        });
    }
    /**
     * Create standardized auth error
     */
    createAuthError(type, code, message, originalError) {
        const error = new Error(message);
        error.code = code;
        error.type = type;
        error.retryable = type === "network";
        error.originalError = originalError;
        error.context = {
            manager: "unified",
            timestamp: Date.now(),
        };
        // Track error in metrics
        this.metrics.errorsByType[type] =
            (this.metrics.errorsByType[type] || 0) + 1;
        return error;
    }
}
//# sourceMappingURL=unified-auth-manager.js.map