/**
 * Google AI Service Authentication Manager
 *
 * Centralized authentication management for Google AI services including
 * OAuth2, API key, and service account authentication with automatic
 * token refresh and security best practices.
 */
import { EventEmitter } from "node:events";
import { Logger } from "../../utils/logger.js";
export class GoogleAIAuthManager extends EventEmitter {
    constructor(config) {
        super();
        this.authState = new Map();
        this.tokens = new Map();
        this.refreshTimers = new Map();
        this.config = config;
        this.logger = new Logger("GoogleAIAuthManager");
        this.initializeAuth();
        this.setupEventHandlers();
    }
    /**
     * Initializes authentication based on configuration
     */
    async initialize() {
        try {
            this.logger.info("Initializing Google AI authentication manager");
            switch (this.config.authentication.type) {
                case "api_key":
                    await this.initializeApiKeyAuth();
                    break;
                case "oauth2":
                    await this.initializeOAuth2Auth();
                    break;
                case "service_account":
                    await this.initializeServiceAccountAuth();
                    break;
                default:
                    throw new Error(`Unsupported authentication type: ${this.config.authentication.type}`);
            }
            this.emit("initialized");
        }
        catch (error) {
            this.logger.error("Failed to initialize authentication", error);
            throw error;
        }
    }
    /**
     * Gets authentication headers for API requests
     */
    async getAuthHeaders(service) {
        try {
            const token = await this.getValidToken(service);
            switch (this.config.authentication.type) {
                case "api_key":
                    return {
                        success: true,
                        data: {
                            "X-API-Key": this.config.credentials.apiKey,
                            "Authorization": `Bearer ${token.access_token}`,
                        },
                        metadata: {
                            requestId: this.generateRequestId(),
                            timestamp: new Date(),
                            processingTime: 0,
                            region: "local",
                        },
                    };
                case "oauth2":
                case "service_account":
                    return {
                        success: true,
                        data: {
                            "Authorization": `Bearer ${token.access_token}`,
                            "Content-Type": "application/json",
                        },
                        metadata: {
                            requestId: this.generateRequestId(),
                            timestamp: new Date(),
                            processingTime: 0,
                            region: "local",
                        },
                    };
                default:
                    throw new Error(`Unsupported authentication type: ${this.config.authentication.type}`);
            }
        }
        catch (error) {
            this.logger.error("Failed to get auth headers", { service, error });
            return this.createErrorResponse("AUTH_HEADERS_FAILED", error.message);
        }
    }
    /**
     * Validates if the current authentication is still valid
     */
    async validateAuth(service) {
        try {
            const state = this.authState.get(service);
            if (!state) {
                throw new Error(`No authentication state found for service: ${service}`);
            }
            if (!state.isAuthenticated) {
                return {
                    success: true,
                    data: false,
                    metadata: {
                        requestId: this.generateRequestId(),
                        timestamp: new Date(),
                        processingTime: 0,
                        region: "local",
                    },
                };
            }
            // Check if token needs refresh
            const token = this.tokens.get(service);
            if (token && this.isTokenExpiringSoon(token)) {
                await this.refreshToken(service);
            }
            return {
                success: true,
                data: true,
                metadata: {
                    requestId: this.generateRequestId(),
                    timestamp: new Date(),
                    processingTime: 0,
                    region: "local",
                },
            };
        }
        catch (error) {
            this.logger.error("Failed to validate auth", { service, error });
            return this.createErrorResponse("AUTH_VALIDATION_FAILED", error.message);
        }
    }
    /**
     * Refreshes authentication token
     */
    async refreshToken(service) {
        try {
            this.logger.info("Refreshing authentication token", { service });
            let newToken;
            switch (this.config.authentication.type) {
                case "oauth2":
                    newToken = await this.refreshOAuth2Token(service);
                    break;
                case "service_account":
                    newToken = await this.refreshServiceAccountToken(service);
                    break;
                default:
                    throw new Error(`Token refresh not supported for: ${this.config.authentication.type}`);
            }
            // Update stored token
            this.tokens.set(service, newToken);
            // Update auth state
            const state = this.authState.get(service);
            if (state) {
                state.lastRefresh = new Date();
                state.tokenExpiry = new Date(Date.now() + newToken.expires_in * 1000);
                state.retryCount = 0;
                state.isAuthenticated = true;
                state.error = undefined;
            }
            // Set up refresh timer
            this.scheduleTokenRefresh(service, newToken);
            this.emit("token:refreshed", { service, token: newToken });
            return {
                success: true,
                data: newToken,
                metadata: {
                    requestId: this.generateRequestId(),
                    timestamp: new Date(),
                    processingTime: 0,
                    region: "local",
                },
            };
        }
        catch (error) {
            this.logger.error("Failed to refresh token", { service, error });
            // Update error state
            const state = this.authState.get(service);
            if (state) {
                state.retryCount++;
                state.error = error.message;
            }
            return this.createErrorResponse("TOKEN_REFRESH_FAILED", error.message);
        }
    }
    /**
     * Revokes authentication for a service
     */
    async revokeAuth(service) {
        try {
            this.logger.info("Revoking authentication", { service });
            // Clear timer
            const timer = this.refreshTimers.get(service);
            if (timer) {
                clearTimeout(timer);
                this.refreshTimers.delete(service);
            }
            // Clear stored data
            this.authState.delete(service);
            this.tokens.delete(service);
            this.emit("auth:revoked", { service });
            return {
                success: true,
                metadata: {
                    requestId: this.generateRequestId(),
                    timestamp: new Date(),
                    processingTime: 0,
                    region: "local",
                },
            };
        }
        catch (error) {
            this.logger.error("Failed to revoke auth", { service, error });
            return this.createErrorResponse("AUTH_REVOCATION_FAILED", error.message);
        }
    }
    /**
     * Gets current authentication state for all services
     */
    getAuthStates() {
        return new Map(this.authState);
    }
    // ==================== Private Helper Methods ====================
    async initializeApiKeyAuth() {
        if (!this.config.credentials.apiKey) {
            throw new Error("API key is required for API key authentication");
        }
        this.logger.info("Initializing API key authentication");
        // For API key auth, create a simple token structure
        const token = {
            access_token: this.config.credentials.apiKey,
            token_type: "Bearer",
            expires_in: 3600, // 1 hour
            scope: "https://www.googleapis.com/auth/cloud-platform",
            issued_at: new Date(),
            expires_at: new Date(Date.now() + 3600 * 1000),
        };
        this.tokens.set("default", token);
        this.authState.set("default", {
            isAuthenticated: true,
            lastRefresh: new Date(),
            tokenExpiry: token.expires_at,
            retryCount: 0,
        });
    }
    async initializeOAuth2Auth() {
        this.logger.info("Initializing OAuth2 authentication");
        const token = await this.fetchOAuth2Token();
        this.tokens.set("default", token);
        this.authState.set("default", {
            isAuthenticated: true,
            lastRefresh: new Date(),
            tokenExpiry: new Date(Date.now() + token.expires_in * 1000),
            retryCount: 0,
        });
        this.scheduleTokenRefresh("default", token);
    }
    async initializeServiceAccountAuth() {
        this.logger.info("Initializing service account authentication");
        if (!this.config.credentials.serviceAccountKey) {
            throw new Error("Service account key is required for service account authentication");
        }
        const token = await this.generateServiceAccountToken();
        this.tokens.set("default", token);
        this.authState.set("default", {
            isAuthenticated: true,
            lastRefresh: new Date(),
            tokenExpiry: new Date(Date.now() + token.expires_in * 1000),
            retryCount: 0,
        });
        this.scheduleTokenRefresh("default", token);
    }
    async getValidToken(service) {
        const token = this.tokens.get(service);
        if (!token) {
            throw new Error(`No token found for service: ${service}`);
        }
        // Check if token is expired or expiring soon
        if (this.isTokenExpiringSoon(token)) {
            await this.refreshToken(service);
            return this.tokens.get(service);
        }
        return token;
    }
    isTokenExpiringSoon(token) {
        const now = Date.now();
        const refreshTime = token.expires_at.getTime() - (this.config.tokenManagement.refreshThreshold * 60 * 1000);
        return now >= refreshTime;
    }
    async fetchOAuth2Token() {
        // OAuth2 token fetch implementation
        // This would integrate with Google's OAuth2 endpoints
        const token = {
            access_token: "oauth2_access_token",
            token_type: "Bearer",
            expires_in: 3600,
            refresh_token: this.config.credentials.refreshToken,
            scope: this.config.authentication.scopes?.join(" ") || "",
            issued_at: new Date(),
            expires_at: new Date(Date.now() + 3600 * 1000),
        };
        return token;
    }
    async refreshOAuth2Token(service) {
        // OAuth2 token refresh implementation
        const token = {
            access_token: "refreshed_oauth2_token",
            token_type: "Bearer",
            expires_in: 3600,
            refresh_token: this.config.credentials.refreshToken,
            scope: this.config.authentication.scopes?.join(" ") || "",
            issued_at: new Date(),
            expires_at: new Date(Date.now() + 3600 * 1000),
        };
        return token;
    }
    async generateServiceAccountToken() {
        // Service account token generation using JWT
        // This would use the service account key to generate a JWT and exchange for access token
        const token = {
            access_token: "service_account_access_token",
            token_type: "Bearer",
            expires_in: 3600,
            scope: "https://www.googleapis.com/auth/cloud-platform",
            issued_at: new Date(),
            expires_at: new Date(Date.now() + 3600 * 1000),
        };
        return token;
    }
    async refreshServiceAccountToken(service) {
        // Service account token refresh (generate new JWT)
        const token = {
            access_token: "refreshed_service_account_token",
            token_type: "Bearer",
            expires_in: 3600,
            scope: "https://www.googleapis.com/auth/cloud-platform",
            issued_at: new Date(),
            expires_at: new Date(Date.now() + 3600 * 1000),
        };
        return token;
    }
    scheduleTokenRefresh(service, token) {
        // Clear existing timer
        const existingTimer = this.refreshTimers.get(service);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }
        // Schedule refresh before expiry
        const refreshTime = token.expires_at.getTime() - (this.config.tokenManagement.refreshThreshold * 60 * 1000);
        const delay = Math.max(0, refreshTime - Date.now());
        const timer = setTimeout(async () => {
            try {
                await this.refreshToken(service);
            }
            catch (error) {
                this.logger.error("Scheduled token refresh failed", { service, error });
            }
        }, delay);
        this.refreshTimers.set(service, timer);
    }
    initializeAuth() {
        // Initialize auth state for default service
        this.authState.set("default", {
            isAuthenticated: false,
            retryCount: 0,
        });
    }
    setupEventHandlers() {
        this.on("auth:error", this.handleAuthError.bind(this));
        this.on("token:expired", this.handleTokenExpired.bind(this));
    }
    handleAuthError(event) {
        this.logger.error("Authentication error", event);
    }
    handleTokenExpired(event) {
        this.logger.warn("Token expired", event);
    }
    generateRequestId() {
        return `auth_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    createErrorResponse(code, message) {
        return {
            success: false,
            error: {
                code,
                message,
                retryable: true,
                timestamp: new Date(),
            },
            metadata: {
                requestId: this.generateRequestId(),
                timestamp: new Date(),
                processingTime: 0,
                region: "local",
            },
        };
    }
}
