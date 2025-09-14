/**
 * Vertex AI Authentication Provider
 *
 * Comprehensive Vertex AI authentication with service account key management,
 * Application Default Credentials, environment-based configuration, and token management
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { VertexAIConfig, AuthProvider, AuthCredentials, AuthenticationResult, RefreshTokenResult, ValidationResult } from "../../types/auth.js";
/**
 * Vertex AI Authentication Provider
 */
export declare class VertexAIProvider extends EventEmitter implements AuthProvider {
    readonly name = "vertex-ai";
    readonly type: "service_account";
    private config;
    private logger;
    private googleAuth;
    private authClient;
    private serviceAccountKey?;
    private readonly DEFAULT_SCOPES;
    constructor(config: VertexAIConfig);
    /**
     * Initialize and authenticate with Vertex AI
     */
    authenticate(): Promise<AuthenticationResult>;
    /**
     * Refresh Vertex AI access token
     */
    refresh(credentials: AuthCredentials): Promise<RefreshTokenResult>;
    /**
     * Validate Vertex AI access token
     */
    validate(credentials: AuthCredentials): Promise<ValidationResult>;
    /**
     * Revoke Vertex AI credentials (minimal implementation)
     */
    revoke(credentials: AuthCredentials): Promise<void>;
    /**
     * Get project information
     */
    getProjectInfo(): Promise<{
        projectId: string;
        projectNumber?: string;
        displayName?: string;
        location: string;
    }>;
    /**
     * Test Vertex AI connection
     */
    testConnection(): Promise<boolean>;
    /**
     * Initialize Google Auth library
     */
    private initializeGoogleAuth;
    /**
     * Load service account key from file or object
     */
    private loadServiceAccountKey;
    /**
     * Create Google Auth client
     */
    private createAuthClient;
    /**
     * Get access token from auth client
     */
    private getAccessToken;
    /**
     * Validate token by making a test API call
     */
    private validateTokenWithAPI;
    /**
     * Extract permissions based on scopes and project access
     */
    private extractPermissions;
    /**
     * Get authentication method being used
     */
    private getAuthMethod;
    /**
     * Resolve key file path (handle relative paths and environment variables)
     */
    private resolveKeyPath;
    /**
     * Generate unique session ID
     */
    private generateSessionId;
    /**
     * Validate Vertex AI configuration
     */
    private validateConfig;
    /**
     * Create standardized auth error
     */
    private createAuthError;
}
//# sourceMappingURL=vertex-ai-provider.d.ts.map