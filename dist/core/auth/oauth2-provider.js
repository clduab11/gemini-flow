/**
 * OAuth2 Provider Implementation
 *
 * Comprehensive OAuth2 flow implementation with authorization code flow,
 * token exchange, refresh tokens, and PKCE support for security
 */
import crypto from "crypto";
import { EventEmitter } from "events";
import { Logger } from "../../utils/logger.js";
/**
 * OAuth2 Provider with comprehensive flow support
 */
export class OAuth2Provider extends EventEmitter {
    name = "oauth2";
    type = "oauth2";
    config;
    logger;
    currentPKCE;
    currentState;
    constructor(config) {
        super();
        this.config = config;
        this.logger = new Logger("OAuth2Provider");
        this.validateConfig();
        this.logger.info("OAuth2 Provider initialized", {
            clientId: config.clientId.substring(0, 8) + "...",
            scopes: config.scopes,
            pkceEnabled: config.pkceEnabled,
        });
    }
    /**
     * Start OAuth2 authentication flow
     */
    async authenticate() {
        try {
            this.logger.info("Starting OAuth2 authentication flow");
            // Generate PKCE pair if enabled
            if (this.config.pkceEnabled) {
                this.currentPKCE = this.generatePKCEPair();
                this.logger.debug("Generated PKCE code pair for security");
            }
            // Generate state parameter for CSRF protection
            this.currentState = this.generateState();
            // Build authorization URL
            const authUrl = this.buildAuthorizationUrl();
            this.logger.info("Authorization URL generated", {
                url: authUrl.substring(0, 100) + "...",
                state: this.currentState,
                pkceEnabled: !!this.currentPKCE,
            });
            // Return result with redirect URL - actual token exchange happens in exchangeCodeForTokens
            return {
                success: true,
                redirectUrl: authUrl,
                context: {
                    sessionId: this.generateSessionId(),
                    credentials: {
                        type: "oauth2",
                        provider: this.name,
                        issuedAt: Date.now(),
                        metadata: {
                            state: this.currentState,
                            pkceVerifier: this.currentPKCE?.codeVerifier,
                        },
                    },
                    scopes: this.config.scopes,
                    permissions: [],
                    metadata: { flow: "authorization_code" },
                    createdAt: Date.now(),
                    refreshable: true,
                },
            };
        }
        catch (error) {
            const authError = this.createAuthError("authentication", "AUTH_FLOW_START_FAILED", "Failed to start OAuth2 authentication flow", error);
            this.logger.error("Authentication flow start failed", {
                error: authError,
            });
            return { success: false, error: authError };
        }
    }
    /**
     * Exchange authorization code for access tokens
     */
    async exchangeCodeForTokens(code, state, codeVerifier) {
        try {
            this.logger.info("Exchanging authorization code for tokens");
            // Validate state parameter for CSRF protection
            if (state && this.currentState && state !== this.currentState) {
                throw new Error("Invalid state parameter - potential CSRF attack");
            }
            // Prepare token request
            const tokenRequest = {
                grantType: "authorization_code",
                code,
                redirectUri: this.config.redirectUri,
                clientId: this.config.clientId,
                clientSecret: this.config.clientSecret,
            };
            // Add PKCE verifier if enabled
            if (this.config.pkceEnabled) {
                tokenRequest.codeVerifier =
                    codeVerifier || this.currentPKCE?.codeVerifier;
                if (!tokenRequest.codeVerifier) {
                    throw new Error("PKCE code verifier required but not provided");
                }
            }
            // Exchange code for tokens
            const tokenResponse = await this.requestTokens(tokenRequest);
            // Create auth credentials
            const credentials = {
                type: "oauth2",
                provider: this.name,
                accessToken: tokenResponse.access_token,
                refreshToken: tokenResponse.refresh_token,
                expiresAt: Date.now() + tokenResponse.expires_in * 1000,
                scope: tokenResponse.scope
                    ? tokenResponse.scope.split(" ")
                    : this.config.scopes,
                issuedAt: Date.now(),
                metadata: {
                    tokenType: tokenResponse.token_type,
                    idToken: tokenResponse.id_token,
                },
            };
            // Create auth context
            const context = {
                sessionId: this.generateSessionId(),
                credentials,
                scopes: credentials.scope || [],
                permissions: await this.extractPermissions(credentials),
                metadata: {
                    flow: "authorization_code",
                    exchangeTime: Date.now(),
                },
                createdAt: Date.now(),
                expiresAt: credentials.expiresAt,
                refreshable: !!credentials.refreshToken,
            };
            this.logger.info("Token exchange successful", {
                expiresIn: tokenResponse.expires_in,
                hasRefreshToken: !!tokenResponse.refresh_token,
                scopes: credentials.scope,
            });
            this.emit("authenticated", { credentials, context });
            return { success: true, credentials, context };
        }
        catch (error) {
            const authError = this.createAuthError("authentication", "TOKEN_EXCHANGE_FAILED", "Failed to exchange authorization code for tokens", error);
            this.logger.error("Token exchange failed", { error: authError });
            return { success: false, error: authError };
        }
    }
    /**
     * Refresh access tokens using refresh token
     */
    async refresh(credentials) {
        try {
            if (!credentials.refreshToken) {
                return {
                    success: false,
                    requiresReauth: true,
                    error: this.createAuthError("authentication", "NO_REFRESH_TOKEN", "No refresh token available"),
                };
            }
            this.logger.info("Refreshing OAuth2 tokens");
            const tokenRequest = {
                grantType: "refresh_token",
                refreshToken: credentials.refreshToken,
                clientId: this.config.clientId,
                clientSecret: this.config.clientSecret,
                scope: credentials.scope?.join(" "),
            };
            const tokenResponse = await this.requestTokens(tokenRequest);
            // Update credentials
            const refreshedCredentials = {
                ...credentials,
                accessToken: tokenResponse.access_token,
                refreshToken: tokenResponse.refresh_token || credentials.refreshToken,
                expiresAt: Date.now() + tokenResponse.expires_in * 1000,
                scope: tokenResponse.scope
                    ? tokenResponse.scope.split(" ")
                    : credentials.scope,
                metadata: {
                    ...credentials.metadata,
                    tokenType: tokenResponse.token_type,
                    refreshedAt: Date.now(),
                },
            };
            this.logger.info("Token refresh successful", {
                expiresIn: tokenResponse.expires_in,
                newRefreshToken: !!tokenResponse.refresh_token,
            });
            this.emit("token_refreshed", { credentials: refreshedCredentials });
            return { success: true, credentials: refreshedCredentials };
        }
        catch (error) {
            const authError = this.createAuthError("authentication", "TOKEN_REFRESH_FAILED", "Failed to refresh OAuth2 tokens", error);
            this.logger.error("Token refresh failed", { error: authError });
            // Check if refresh token is invalid (requires re-authentication)
            const requiresReauth = this.isRefreshTokenInvalid(error);
            return {
                success: false,
                error: authError,
                requiresReauth,
            };
        }
    }
    /**
     * Validate access token
     */
    async validate(credentials) {
        try {
            if (!credentials.accessToken) {
                return { valid: false, error: "No access token provided" };
            }
            // Check expiration time
            const now = Date.now();
            if (credentials.expiresAt && credentials.expiresAt <= now) {
                return {
                    valid: false,
                    expired: true,
                    error: "Access token has expired",
                };
            }
            // Calculate time until expiration
            const expiresIn = credentials.expiresAt
                ? Math.floor((credentials.expiresAt - now) / 1000)
                : undefined;
            // Optionally validate with userinfo endpoint
            if (this.config.userinfoEndpoint) {
                try {
                    await this.getUserInfo(credentials.accessToken);
                    this.logger.debug("Token validated via userinfo endpoint");
                }
                catch (error) {
                    this.logger.warn("Token validation via userinfo failed", { error });
                    return {
                        valid: false,
                        error: "Token validation failed at userinfo endpoint",
                    };
                }
            }
            return {
                valid: true,
                expiresIn,
                scopes: credentials.scope,
            };
        }
        catch (error) {
            this.logger.error("Token validation failed", { error });
            return {
                valid: false,
                error: error instanceof Error ? error.message : "Unknown validation error",
            };
        }
    }
    /**
     * Revoke OAuth2 tokens
     */
    async revoke(credentials) {
        try {
            if (!this.config.revokeEndpoint) {
                this.logger.warn("No revoke endpoint configured, skipping token revocation");
                return;
            }
            this.logger.info("Revoking OAuth2 tokens");
            const tokensToRevoke = [
                credentials.accessToken,
                credentials.refreshToken,
            ].filter(Boolean);
            for (const token of tokensToRevoke) {
                try {
                    await this.revokeToken(token);
                }
                catch (error) {
                    this.logger.warn("Failed to revoke token", { error });
                    // Continue with other tokens even if one fails
                }
            }
            this.logger.info("Token revocation completed");
            this.emit("tokens_revoked", { credentials });
        }
        catch (error) {
            this.logger.error("Token revocation failed", { error });
            throw this.createAuthError("authentication", "TOKEN_REVOCATION_FAILED", "Failed to revoke OAuth2 tokens", error);
        }
    }
    /**
     * Generate PKCE code pair for enhanced security
     */
    generatePKCEPair() {
        // Generate code verifier (43-128 character random string)
        const codeVerifier = crypto.randomBytes(32).toString("base64url");
        // Generate code challenge using SHA256
        const codeChallenge = crypto
            .createHash("sha256")
            .update(codeVerifier)
            .digest("base64url");
        return {
            codeVerifier,
            codeChallenge,
            codeChallengeMethod: "S256",
        };
    }
    /**
     * Generate cryptographically secure state parameter
     */
    generateState() {
        return crypto.randomBytes(16).toString("base64url");
    }
    /**
     * Generate unique session ID
     */
    generateSessionId() {
        return `oauth2_${Date.now()}_${crypto.randomBytes(8).toString("hex")}`;
    }
    /**
     * Build authorization URL with all required parameters
     */
    buildAuthorizationUrl() {
        const params = new URLSearchParams({
            response_type: "code",
            client_id: this.config.clientId,
            redirect_uri: this.config.redirectUri,
            scope: this.config.scopes.join(" "),
            state: this.currentState,
            access_type: "offline", // Request refresh token
            prompt: "consent", // Ensure we get refresh token
        });
        // Add PKCE parameters if enabled
        if (this.currentPKCE) {
            params.append("code_challenge", this.currentPKCE.codeChallenge);
            params.append("code_challenge_method", this.currentPKCE.codeChallengeMethod);
        }
        return `${this.config.authorizationEndpoint}?${params.toString()}`;
    }
    /**
     * Request tokens from OAuth2 token endpoint
     */
    async requestTokens(request) {
        const body = new URLSearchParams({
            grant_type: request.grantType,
            client_id: request.clientId,
        });
        // Add parameters based on grant type
        if (request.grantType === "authorization_code") {
            body.append("code", request.code);
            body.append("redirect_uri", request.redirectUri);
            if (request.codeVerifier) {
                body.append("code_verifier", request.codeVerifier);
            }
        }
        else if (request.grantType === "refresh_token") {
            body.append("refresh_token", request.refreshToken);
            if (request.scope) {
                body.append("scope", request.scope);
            }
        }
        // Add client secret if provided
        if (request.clientSecret) {
            body.append("client_secret", request.clientSecret);
        }
        const response = await fetch(this.config.tokenEndpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Accept: "application/json",
                "User-Agent": "GeminiFlow/1.1.0 OAuth2Provider",
            },
            body: body.toString(),
        });
        const responseData = await response.json();
        if (!response.ok) {
            const errorResponse = responseData;
            throw new Error(`OAuth2 token request failed: ${errorResponse.error} - ${errorResponse.error_description || "Unknown error"}`);
        }
        return responseData;
    }
    /**
     * Get user information from userinfo endpoint
     */
    async getUserInfo(accessToken) {
        if (!this.config.userinfoEndpoint) {
            throw new Error("No userinfo endpoint configured");
        }
        const response = await fetch(this.config.userinfoEndpoint, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Accept: "application/json",
            },
        });
        if (!response.ok) {
            throw new Error(`Userinfo request failed: ${response.status} ${response.statusText}`);
        }
        return response.json();
    }
    /**
     * Revoke a token at the revoke endpoint
     */
    async revokeToken(token) {
        if (!this.config.revokeEndpoint) {
            return;
        }
        const body = new URLSearchParams({
            token,
            client_id: this.config.clientId,
        });
        if (this.config.clientSecret) {
            body.append("client_secret", this.config.clientSecret);
        }
        const response = await fetch(this.config.revokeEndpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: body.toString(),
        });
        if (!response.ok) {
            throw new Error(`Token revocation failed: ${response.status} ${response.statusText}`);
        }
    }
    /**
     * Extract permissions from credentials (provider-specific)
     */
    async extractPermissions(credentials) {
        // This would be implemented based on the OAuth2 provider's scope-to-permission mapping
        // For now, return the scopes as permissions
        return credentials.scope || [];
    }
    /**
     * Check if refresh token is invalid and requires re-authentication
     */
    isRefreshTokenInvalid(error) {
        const invalidTokenErrors = [
            "invalid_grant",
            "invalid_request",
            "unauthorized_client",
        ];
        return invalidTokenErrors.some((errorType) => error.message.toLowerCase().includes(errorType));
    }
    /**
     * Validate OAuth2 configuration
     */
    validateConfig() {
        const required = [
            "clientId",
            "clientSecret",
            "redirectUri",
            "authorizationEndpoint",
            "tokenEndpoint",
        ];
        for (const field of required) {
            if (!this.config[field]) {
                throw new Error(`OAuth2 configuration missing required field: ${field}`);
            }
        }
        if (!Array.isArray(this.config.scopes) || this.config.scopes.length === 0) {
            throw new Error("OAuth2 configuration must include at least one scope");
        }
        // Validate URLs
        try {
            new URL(this.config.authorizationEndpoint);
            new URL(this.config.tokenEndpoint);
            new URL(this.config.redirectUri);
        }
        catch (error) {
            throw new Error("OAuth2 configuration contains invalid URLs");
        }
    }
    /**
     * Create standardized auth error
     */
    createAuthError(type, code, message, originalError) {
        const error = new Error(message);
        error.code = code;
        error.type = type;
        error.retryable = type === "network" || code === "TOKEN_REFRESH_FAILED";
        error.originalError = originalError;
        error.context = {
            provider: this.name,
            timestamp: Date.now(),
        };
        return error;
    }
}
