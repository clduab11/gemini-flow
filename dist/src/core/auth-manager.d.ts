/**
 * Authentication Manager
 *
 * Handles Google authentication and user tier detection
 * Integrates with Google Cloud Identity for enterprise features
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { OAuth2Tokens, RefreshTokenResult, ValidationResult } from "../types/auth.js";
export interface UserProfile {
    id: string;
    email: string;
    name: string;
    tier: "free" | "pro" | "enterprise" | "ultra";
    organization?: string;
    permissions: string[];
    quotas: {
        daily: number;
        monthly: number;
        concurrent: number;
    };
    metadata: {
        createdAt: Date;
        lastActive: Date;
        totalRequests: number;
        subscription?: any;
        tierDetection?: {
            method: string;
            confidence: number;
            detectedAt: Date;
            features: string[];
        };
    };
}
export interface AuthConfig {
    clientId?: string;
    clientSecret?: string;
    redirectUri?: string;
    scopes?: string[];
    serviceAccountPath?: string;
    projectId?: string;
    tierDetection?: {
        enableVertexAI?: boolean;
        enableWorkspaceIntegration?: boolean;
        customEnterprisePatterns?: string[];
        ultraFeatureChecks?: string[];
    };
}
export declare class AuthenticationManager extends EventEmitter {
    private oauth2Client?;
    private googleAuth?;
    private cache;
    private logger;
    private config;
    private userTokens;
    private tokenRefreshTimers;
    private readonly TOKEN_REFRESH_BUFFER;
    private readonly DEFAULT_SCOPES;
    private readonly TIER_DETECTION_SCOPES;
    constructor(config?: AuthConfig);
    /**
     * Initialize authentication clients
     */
    private initializeAuth;
    /**
     * Generate OAuth URL for user authentication
     */
    generateAuthUrl(state?: string): string;
    /**
     * Exchange authorization code for tokens
     */
    authenticateUser(code: string): Promise<UserProfile>;
    /**
     * Refresh OAuth2 tokens for a user
     */
    refreshToken(userId: string): Promise<RefreshTokenResult>;
    /**
     * Validate OAuth2 tokens for a user
     */
    validateTokens(userId: string): Promise<ValidationResult>;
    /**
     * Schedule automatic token refresh before expiration
     */
    private scheduleTokenRefresh;
    /**
     * Clear token refresh timer for a user
     */
    private clearTokenRefreshTimer;
    /**
     * Check if refresh token error indicates need for re-authentication
     */
    private isRefreshTokenInvalid;
    /**
     * Get stored tokens for a user
     */
    getUserTokens(userId: string): OAuth2Tokens | undefined;
    /**
     * Check if user needs token refresh
     */
    needsTokenRefresh(userId: string): Promise<boolean>;
    /**
     * Force refresh token for a user (even if not expired)
     */
    forceRefreshToken(userId: string): Promise<RefreshTokenResult>;
    /**
     * Comprehensive user tier detection with multiple strategies
     */
    detectUserTier(email?: string, tokens?: any): Promise<{
        tier: "free" | "pro" | "enterprise" | "ultra";
        method: string;
        confidence: number;
        features: string[];
    }>;
    /**
     * Detect Ultra tier features (Google AI Advanced, Vertex AI Enterprise)
     */
    private detectUltraTier;
    /**
     * Detect Enterprise tier (Google Workspace + Enterprise features)
     */
    private detectEnterpriseTier;
    /**
     * Detect Pro tier (Paid subscription)
     */
    private detectProTier;
    /**
     * Check Vertex AI Enterprise access
     */
    private checkVertexAIAccess;
    /**
     * Check Google AI Advanced subscription
     */
    private checkGoogleAIAdvanced;
    /**
     * Check enterprise billing patterns
     */
    private checkEnterpriseBilling;
    /**
     * Check for custom integrations
     */
    private checkCustomIntegrations;
    /**
     * Check Google Workspace status
     */
    private checkGoogleWorkspace;
    /**
     * Analyze domain patterns for enterprise indicators
     */
    private analyzeDomainPatterns;
    /**
     * Check for enterprise OAuth scopes
     */
    private checkEnterpriseScopes;
    /**
     * Check for payment method (enhanced from existing stub)
     */
    private checkPaymentMethod;
    /**
     * Analyze usage patterns to suggest tier
     */
    private analyzeUsagePatterns;
    /**
     * Get organization information from email domain
     */
    private getOrganization;
    /**
     * Get user permissions based on email and tier
     */
    private getUserPermissions;
    /**
     * Get quota limits for user tier
     */
    private getTierQuotas;
    /**
     * Check for pro subscription (placeholder for billing integration)
     */
    private checkProSubscription;
    /**
     * Validate and refresh user session
     */
    validateSession(userId: string): Promise<UserProfile | null>;
    /**
     * Check if user has permission
     */
    hasPermission(userId: string, permission: string): Promise<boolean>;
    /**
     * Check quota usage
     */
    checkQuota(userId: string, requestCount?: number): Promise<boolean>;
    /**
     * Service account authentication for internal operations
     */
    getServiceAccountAuth(): Promise<any>;
    /**
     * Revoke user tokens
     */
    revokeUser(userId: string): Promise<void>;
    /**
     * Get current user context for security operations
     */
    getCurrentUserContext(): Promise<{
        userId: string;
        tier: string;
        permissions: string[];
    } | null>;
    /**
     * Get current user ID from active session
     */
    getCurrentUserId(): Promise<string | null>;
    /**
     * Determine user tier (alias for detectUserTier for backwards compatibility)
     */
    determineUserTier(email?: string, tokens?: any): Promise<{
        tier: "free" | "pro" | "enterprise" | "ultra";
        method: string;
        confidence: number;
        features: string[];
    }>;
    /**
     * Get authentication metrics
     */
    getMetrics(): {
        configuredClients: {
            oauth2: boolean;
            serviceAccount: boolean;
        };
        scopes: string[];
        tokenManagement: {
            activeUsers: number;
            scheduledRefreshes: number;
            refreshBufferMs: number;
        };
    };
}
//# sourceMappingURL=auth-manager.d.ts.map