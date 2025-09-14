/**
 * OAuth2 Provider Implementation
 *
 * Comprehensive OAuth2 flow implementation with authorization code flow,
 * token exchange, refresh tokens, and PKCE support for security
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { OAuth2Config, AuthProvider, AuthCredentials, AuthenticationResult, RefreshTokenResult, ValidationResult } from "../../types/auth.js";
/**
 * OAuth2 Provider with comprehensive flow support
 */
export declare class OAuth2Provider extends EventEmitter implements AuthProvider {
    readonly name = "oauth2";
    readonly type: "oauth2";
    private config;
    private logger;
    private currentPKCE?;
    private currentState?;
    constructor(config: OAuth2Config);
    /**
     * Start OAuth2 authentication flow
     */
    authenticate(): Promise<AuthenticationResult>;
    /**
     * Exchange authorization code for access tokens
     */
    exchangeCodeForTokens(code: string, state?: string, codeVerifier?: string): Promise<AuthenticationResult>;
    /**
     * Refresh access tokens using refresh token
     */
    refresh(credentials: AuthCredentials): Promise<RefreshTokenResult>;
    /**
     * Validate access token
     */
    validate(credentials: AuthCredentials): Promise<ValidationResult>;
    /**
     * Revoke OAuth2 tokens
     */
    revoke(credentials: AuthCredentials): Promise<void>;
    /**
     * Generate PKCE code pair for enhanced security
     */
    private generatePKCEPair;
    /**
     * Generate cryptographically secure state parameter
     */
    private generateState;
    /**
     * Generate unique session ID
     */
    private generateSessionId;
    /**
     * Build authorization URL with all required parameters
     */
    private buildAuthorizationUrl;
    /**
     * Request tokens from OAuth2 token endpoint
     */
    private requestTokens;
    /**
     * Get user information from userinfo endpoint
     */
    private getUserInfo;
    /**
     * Revoke a token at the revoke endpoint
     */
    private revokeToken;
    /**
     * Extract permissions from credentials (provider-specific)
     */
    private extractPermissions;
    /**
     * Check if refresh token is invalid and requires re-authentication
     */
    private isRefreshTokenInvalid;
    /**
     * Validate OAuth2 configuration
     */
    private validateConfig;
    /**
     * Create standardized auth error
     */
    private createAuthError;
}
//# sourceMappingURL=oauth2-provider.d.ts.map