export class AuthenticationManager extends EventEmitter<[never]> {
    constructor(config?: {});
    oauth2Client: any;
    googleAuth: any;
    cache: CacheManager;
    logger: Logger;
    config: {};
    userTokens: Map<any, any>;
    tokenRefreshTimers: Map<any, any>;
    TOKEN_REFRESH_BUFFER: number;
    DEFAULT_SCOPES: string[];
    TIER_DETECTION_SCOPES: string[];
    /**
     * Initialize authentication clients
     */
    initializeAuth(): Promise<void>;
    /**
     * Generate OAuth URL for user authentication
     */
    generateAuthUrl(state: any): any;
    /**
     * Exchange authorization code for tokens
     */
    authenticateUser(code: any): Promise<{
        id: any;
        email: any;
        name: any;
        tier: any;
        organization: any;
        permissions: string[];
        quotas: any;
        metadata: {
            createdAt: Date;
            lastActive: Date;
            totalRequests: number;
            tierDetection: {
                method: any;
                confidence: any;
                detectedAt: Date;
                features: any;
            };
        };
    }>;
    /**
     * Refresh OAuth2 tokens for a user
     */
    refreshToken(userId: any): Promise<{
        success: boolean;
        requiresReauth: boolean;
        error: {
            name: string;
            message: string;
            code: string;
            type: string;
            retryable: boolean;
            originalError?: undefined;
        };
        credentials?: undefined;
    } | {
        success: boolean;
        credentials: {
            type: string;
            provider: string;
            accessToken: any;
            refreshToken: any;
            expiresAt: any;
            scope: any;
            issuedAt: number;
            metadata: {
                tokenType: any;
                refreshedAt: number;
            };
        };
        requiresReauth?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        requiresReauth: boolean;
        error: {
            name: any;
            message: any;
            code: string;
            type: string;
            retryable: boolean;
            originalError: unknown;
        };
        credentials?: undefined;
    }>;
    /**
     * Validate OAuth2 tokens for a user
     */
    validateTokens(userId: any): Promise<{
        valid: boolean;
        expired: boolean;
        error: string;
        expiresIn?: undefined;
        scopes?: undefined;
    } | {
        valid: boolean;
        expired: boolean;
        expiresIn: number;
        scopes: any;
        error?: undefined;
    } | {
        valid: boolean;
        error: any;
        expired?: undefined;
        expiresIn?: undefined;
        scopes?: undefined;
    }>;
    /**
     * Schedule automatic token refresh before expiration
     */
    scheduleTokenRefresh(userId: any, tokens: any): void;
    /**
     * Clear token refresh timer for a user
     */
    clearTokenRefreshTimer(userId: any): void;
    /**
     * Check if refresh token error indicates need for re-authentication
     */
    isRefreshTokenInvalid(error: any): boolean;
    /**
     * Get stored tokens for a user
     */
    getUserTokens(userId: any): any;
    /**
     * Check if user needs token refresh
     */
    needsTokenRefresh(userId: any): Promise<boolean>;
    /**
     * Force refresh token for a user (even if not expired)
     */
    forceRefreshToken(userId: any): Promise<{
        success: boolean;
        requiresReauth: boolean;
        error: {
            name: string;
            message: string;
            code: string;
            type: string;
            retryable: boolean;
            originalError?: undefined;
        };
        credentials?: undefined;
    } | {
        success: boolean;
        credentials: {
            type: string;
            provider: string;
            accessToken: any;
            refreshToken: any;
            expiresAt: any;
            scope: any;
            issuedAt: number;
            metadata: {
                tokenType: any;
                refreshedAt: number;
            };
        };
        requiresReauth?: undefined;
        error?: undefined;
    } | {
        success: boolean;
        requiresReauth: boolean;
        error: {
            name: any;
            message: any;
            code: string;
            type: string;
            retryable: boolean;
            originalError: unknown;
        };
        credentials?: undefined;
    }>;
    /**
     * Comprehensive user tier detection with multiple strategies
     */
    detectUserTier(email: any, tokens: any): Promise<any>;
    /**
     * Detect Ultra tier features (Google AI Advanced, Vertex AI Enterprise)
     */
    detectUltraTier(email: any, domain: any, tokens: any): Promise<{
        isUltra: boolean;
        confidence: number;
        features: string[];
    }>;
    /**
     * Detect Enterprise tier (Google Workspace + Enterprise features)
     */
    detectEnterpriseTier(email: any, domain: any, tokens: any): Promise<{
        isEnterprise: boolean;
        confidence: number;
        features: string[];
    }>;
    /**
     * Detect Pro tier (Paid subscription)
     */
    detectProTier(email: any, _domain: any): Promise<{
        isPro: boolean;
        confidence: number;
        features: string[];
    }>;
    /**
     * Check Vertex AI Enterprise access
     */
    checkVertexAIAccess(tokens: any): Promise<boolean>;
    /**
     * Check Google AI Advanced subscription
     */
    checkGoogleAIAdvanced(_email: any): Promise<boolean>;
    /**
     * Check enterprise billing patterns
     */
    checkEnterpriseBilling(_email: any, _domain: any): Promise<boolean>;
    /**
     * Check for custom integrations
     */
    checkCustomIntegrations(_email: any): Promise<boolean>;
    /**
     * Check Google Workspace status
     */
    checkGoogleWorkspace(email: any, tokens: any): Promise<{
        isWorkspace: boolean;
        isEnterprise: any;
    }>;
    /**
     * Analyze domain patterns for enterprise indicators
     */
    analyzeDomainPatterns(domain: any): {
        isEnterprise: boolean;
        score: number;
        indicators: string[];
    };
    /**
     * Check for enterprise OAuth scopes
     */
    checkEnterpriseScopes(tokens: any): Promise<boolean>;
    /**
     * Check for payment method (enhanced from existing stub)
     */
    checkPaymentMethod(_email: any): Promise<boolean>;
    /**
     * Analyze usage patterns to suggest tier
     */
    analyzeUsagePatterns(email: any): Promise<{
        suggestsPro: boolean;
        indicators: string[];
    }>;
    /**
     * Get organization information from email domain
     */
    getOrganization(email: any): Promise<any>;
    /**
     * Get user permissions based on email and tier
     */
    getUserPermissions(email: any, tier: any): Promise<string[]>;
    /**
     * Get quota limits for user tier
     */
    getTierQuotas(tier: any): any;
    /**
     * Check for pro subscription (placeholder for billing integration)
     */
    checkProSubscription(_email: any): Promise<boolean>;
    /**
     * Validate and refresh user session
     */
    validateSession(userId: any): Promise<any>;
    /**
     * Check if user has permission
     */
    hasPermission(userId: any, permission: any): Promise<any>;
    /**
     * Check quota usage
     */
    checkQuota(userId: any, requestCount?: number): Promise<boolean>;
    /**
     * Service account authentication for internal operations
     */
    getServiceAccountAuth(): Promise<any>;
    /**
     * Revoke user tokens
     */
    revokeUser(userId: any): Promise<void>;
    /**
     * Get current user context for security operations
     */
    getCurrentUserContext(): Promise<null>;
    /**
     * Get current user ID from active session
     */
    getCurrentUserId(): Promise<null>;
    /**
     * Determine user tier (alias for detectUserTier for backwards compatibility)
     */
    determineUserTier(email: any, tokens: any): Promise<any>;
    /**
     * Get authentication metrics
     */
    getMetrics(): {
        configuredClients: {
            oauth2: boolean;
            serviceAccount: boolean;
        };
        scopes: any;
        tokenManagement: {
            activeUsers: number;
            scheduledRefreshes: number;
            refreshBufferMs: number;
        };
    };
}
import { EventEmitter } from "events";
import { CacheManager } from "./cache-manager.js";
import { Logger } from "../utils/logger.js";
//# sourceMappingURL=auth-manager.d.ts.map