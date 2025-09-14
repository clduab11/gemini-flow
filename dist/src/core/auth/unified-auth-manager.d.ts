/**
 * Unified Authentication Manager
 *
 * Central authentication coordinator that manages multiple authentication providers,
 * credential storage, token caching, and provides a unified interface for all auth operations
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { UnifiedAuthConfig, AuthProvider, AuthCredentials, AuthenticationResult, RefreshTokenResult, ValidationResult, AuthContext, SecurityContext, AuthEventHandler, AuthMetrics, AuthProviderType, AuthStatus } from "../../types/auth.js";
/**
 * Authentication session
 */
interface AuthSession {
    id: string;
    context: AuthContext;
    securityContext?: SecurityContext;
    createdAt: number;
    lastActivity: number;
    refreshCount: number;
    status: AuthStatus;
}
/**
 * Unified Authentication Manager
 */
export declare class UnifiedAuthManager extends EventEmitter {
    private config;
    private logger;
    private storage;
    private cache;
    private providers;
    private sessions;
    private eventHandlers;
    private tokenRefreshInterval?;
    private sessionCleanupInterval?;
    private metricsInterval?;
    private metrics;
    constructor(config: UnifiedAuthConfig);
    /**
     * Authenticate using specified provider
     */
    authenticate(providerType: AuthProviderType, options?: any): Promise<AuthenticationResult>;
    /**
     * Refresh credentials for a session
     */
    refreshCredentials(sessionId: string): Promise<RefreshTokenResult>;
    /**
     * Validate credentials for a session
     */
    validateCredentials(sessionId: string): Promise<ValidationResult>;
    /**
     * Get credentials for a session (with automatic refresh if needed)
     */
    getCredentials(sessionId: string, autoRefresh?: boolean): Promise<AuthCredentials | null>;
    /**
     * Revoke credentials and end session
     */
    revokeCredentials(sessionId: string): Promise<void>;
    /**
     * List active sessions
     */
    getActiveSessions(): string[];
    /**
     * Get session information
     */
    getSession(sessionId: string): AuthSession | null;
    /**
     * Register custom authentication provider
     */
    registerProvider(type: AuthProviderType, provider: AuthProvider, config?: any, options?: {
        enabled?: boolean;
        priority?: number;
    }): void;
    /**
     * Unregister authentication provider
     */
    unregisterProvider(type: AuthProviderType): void;
    /**
     * Enable/disable provider
     */
    setProviderEnabled(type: AuthProviderType, enabled: boolean): void;
    /**
     * Get available providers
     */
    getAvailableProviders(): AuthProviderType[];
    /**
     * Add event handler
     */
    addEventHandler(handler: AuthEventHandler): void;
    /**
     * Remove event handler
     */
    removeEventHandler(handler: AuthEventHandler): void;
    /**
     * Get authentication metrics
     */
    getMetrics(): AuthMetrics;
    /**
     * Force cleanup of expired sessions
     */
    cleanup(): Promise<number>;
    /**
     * Shutdown auth manager and cleanup resources
     */
    shutdown(): Promise<void>;
    /**
     * Initialize built-in providers
     */
    private initializeProviders;
    /**
     * Set up event forwarding from storage and cache
     */
    private setupEventForwarding;
    /**
     * Start background maintenance tasks
     */
    private startBackgroundTasks;
    /**
     * Check for tokens that need refresh
     */
    private checkTokenRefresh;
    /**
     * Update internal metrics
     */
    private updateMetrics;
    /**
     * Create new authentication session
     */
    private createSession;
    /**
     * Store credentials using storage backend
     */
    private storeCredentials;
    /**
     * Cache credentials for fast access
     */
    private cacheCredentials;
    /**
     * Get provider for specific credentials
     */
    private getProviderForCredentials;
    /**
     * Map credentials to provider type
     */
    private getProviderTypeFromCredentials;
    /**
     * Generate unique session ID
     */
    private generateSessionId;
    /**
     * Update authentication metrics
     */
    private updateAuthMetrics;
    /**
     * Emit authentication event to handlers
     */
    private emitAuthEvent;
    /**
     * Create standardized auth error
     */
    private createAuthError;
}
export {};
//# sourceMappingURL=unified-auth-manager.d.ts.map