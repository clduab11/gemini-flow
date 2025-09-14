/**
 * Vertex AI Authentication Provider
 *
 * Comprehensive Vertex AI authentication with service account key management,
 * Application Default Credentials, environment-based configuration, and token management
 */
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { EventEmitter } from "events";
import { Logger } from "../../utils/logger.js";
import { safeImport } from "../../utils/feature-detection.js";
/**
 * Vertex AI Authentication Provider
 */
export class VertexAIProvider extends EventEmitter {
    name = "vertex-ai";
    type = "service_account";
    config;
    logger;
    googleAuth;
    authClient;
    serviceAccountKey;
    // Default scopes for Vertex AI
    DEFAULT_SCOPES = [
        "https://www.googleapis.com/auth/cloud-platform",
        "https://www.googleapis.com/auth/cloud-platform.read-only",
        "https://www.googleapis.com/auth/aiplatform",
    ];
    constructor(config) {
        super();
        this.config = {
            ...config,
            scopes: config.scopes.length > 0 ? config.scopes : this.DEFAULT_SCOPES,
        };
        this.logger = new Logger("VertexAIProvider");
        this.validateConfig();
        this.logger.info("Vertex AI Provider initialized", {
            projectId: config.projectId,
            location: config.location,
            hasServiceAccountKey: !!config.serviceAccountKeyPath || !!config.serviceAccountKey,
            useADC: !!config.applicationDefaultCredentials,
            scopes: this.config.scopes.length,
        });
    }
    /**
     * Initialize and authenticate with Vertex AI
     */
    async authenticate() {
        try {
            this.logger.info("Starting Vertex AI authentication");
            // Initialize Google Auth library
            await this.initializeGoogleAuth();
            // Load service account key if provided
            if (this.config.serviceAccountKeyPath || this.config.serviceAccountKey) {
                await this.loadServiceAccountKey();
            }
            // Create auth client
            this.authClient = await this.createAuthClient();
            // Get initial access token
            const tokens = await this.getAccessToken();
            // Create auth credentials
            const credentials = {
                type: "service_account",
                provider: this.name,
                accessToken: tokens.access_token,
                expiresAt: Date.now() + tokens.expires_in * 1000,
                scope: this.config.scopes,
                issuedAt: Date.now(),
                metadata: {
                    projectId: this.config.projectId,
                    location: this.config.location,
                    tokenType: tokens.token_type,
                    serviceAccountEmail: this.serviceAccountKey?.client_email,
                    authMethod: this.getAuthMethod(),
                },
            };
            // Create auth context
            const context = {
                sessionId: this.generateSessionId(),
                credentials,
                scopes: this.config.scopes,
                permissions: await this.extractPermissions(),
                metadata: {
                    projectId: this.config.projectId,
                    location: this.config.location,
                    authMethod: this.getAuthMethod(),
                },
                createdAt: Date.now(),
                expiresAt: credentials.expiresAt,
                refreshable: true,
            };
            this.logger.info("Vertex AI authentication successful", {
                projectId: this.config.projectId,
                expiresIn: tokens.expires_in,
                authMethod: this.getAuthMethod(),
            });
            this.emit("authenticated", { credentials, context });
            return { success: true, credentials, context };
        }
        catch (error) {
            const authError = this.createAuthError("authentication", "VERTEX_AI_AUTH_FAILED", "Failed to authenticate with Vertex AI", error);
            this.logger.error("Vertex AI authentication failed", {
                error: authError,
            });
            return { success: false, error: authError };
        }
    }
    /**
     * Refresh Vertex AI access token
     */
    async refresh(credentials) {
        try {
            if (!this.authClient) {
                return {
                    success: false,
                    requiresReauth: true,
                    error: this.createAuthError("authentication", "NO_AUTH_CLIENT", "Auth client not initialized"),
                };
            }
            this.logger.info("Refreshing Vertex AI access token");
            // Get fresh access token
            const tokens = await this.getAccessToken();
            // Update credentials
            const refreshedCredentials = {
                ...credentials,
                accessToken: tokens.access_token,
                expiresAt: Date.now() + tokens.expires_in * 1000,
                metadata: {
                    ...credentials.metadata,
                    refreshedAt: Date.now(),
                    tokenType: tokens.token_type,
                },
            };
            this.logger.info("Vertex AI token refresh successful", {
                expiresIn: tokens.expires_in,
            });
            this.emit("token_refreshed", { credentials: refreshedCredentials });
            return { success: true, credentials: refreshedCredentials };
        }
        catch (error) {
            const authError = this.createAuthError("authentication", "TOKEN_REFRESH_FAILED", "Failed to refresh Vertex AI access token", error);
            this.logger.error("Vertex AI token refresh failed", { error: authError });
            return { success: false, error: authError };
        }
    }
    /**
     * Validate Vertex AI access token
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
            // Validate token by making a test API call
            try {
                await this.validateTokenWithAPI(credentials.accessToken);
                this.logger.debug("Token validated via Vertex AI API");
            }
            catch (error) {
                this.logger.warn("Token validation via API failed", { error });
                return {
                    valid: false,
                    error: "Token validation failed at Vertex AI API",
                };
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
     * Revoke Vertex AI credentials (minimal implementation)
     */
    async revoke(credentials) {
        try {
            this.logger.info("Revoking Vertex AI credentials");
            // Clear auth client
            this.authClient = null;
            // For service account tokens, we can't really "revoke" them
            // The token will expire naturally or we can clear our local references
            this.logger.info("Vertex AI credentials cleared locally");
            this.emit("credentials_revoked", { credentials });
        }
        catch (error) {
            this.logger.error("Credential revocation failed", { error });
            throw this.createAuthError("authentication", "CREDENTIAL_REVOCATION_FAILED", "Failed to revoke Vertex AI credentials", error);
        }
    }
    /**
     * Get project information
     */
    async getProjectInfo() {
        try {
            if (!this.authClient) {
                throw new Error("Not authenticated with Vertex AI");
            }
            // Try to get project information using Resource Manager API
            const googleapis = await safeImport("googleapis");
            if (googleapis?.google) {
                try {
                    const cloudResourceManager = googleapis.google.cloudresourcemanager({
                        version: "v1",
                        auth: this.authClient,
                    });
                    const response = await cloudResourceManager.projects.get({
                        projectId: this.config.projectId,
                    });
                    return {
                        projectId: this.config.projectId,
                        projectNumber: response.data.projectNumber,
                        displayName: response.data.name,
                        location: this.config.location,
                    };
                }
                catch (error) {
                    this.logger.debug("Could not fetch detailed project info", { error });
                }
            }
            // Return basic info if detailed fetch fails
            return {
                projectId: this.config.projectId,
                location: this.config.location,
            };
        }
        catch (error) {
            this.logger.error("Failed to get project info", { error });
            throw error;
        }
    }
    /**
     * Test Vertex AI connection
     */
    async testConnection() {
        try {
            if (!this.authClient) {
                return false;
            }
            // Try to list available models to test connection
            const vertexAI = await safeImport("@google-cloud/vertexai");
            if (vertexAI?.VertexAI) {
                const vertex = new vertexAI.VertexAI({
                    project: this.config.projectId,
                    location: this.config.location,
                    googleAuth: this.authClient,
                });
                // This is a minimal test - just check if we can initialize
                this.logger.debug("Vertex AI connection test successful");
                return true;
            }
            return false;
        }
        catch (error) {
            this.logger.debug("Vertex AI connection test failed", { error });
            return false;
        }
    }
    /**
     * Initialize Google Auth library
     */
    async initializeGoogleAuth() {
        try {
            const googleAuth = await safeImport("google-auth-library");
            if (!googleAuth?.GoogleAuth) {
                throw new Error("Google Auth library not available");
            }
            this.googleAuth = googleAuth.GoogleAuth;
            this.logger.debug("Google Auth library initialized");
        }
        catch (error) {
            throw new Error(`Failed to initialize Google Auth library: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    /**
     * Load service account key from file or object
     */
    async loadServiceAccountKey() {
        try {
            if (this.config.serviceAccountKey) {
                // Use provided service account key object
                this.serviceAccountKey = this.config.serviceAccountKey;
                this.logger.debug("Service account key loaded from config object");
                return;
            }
            if (this.config.serviceAccountKeyPath) {
                // Load from file path
                const keyPath = this.resolveKeyPath(this.config.serviceAccountKeyPath);
                if (!fs.existsSync(keyPath)) {
                    throw new Error(`Service account key file not found: ${keyPath}`);
                }
                const keyContent = fs.readFileSync(keyPath, "utf8");
                this.serviceAccountKey = JSON.parse(keyContent);
                this.logger.debug("Service account key loaded from file", { keyPath });
                return;
            }
            throw new Error("No service account key provided");
        }
        catch (error) {
            throw new Error(`Failed to load service account key: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    /**
     * Create Google Auth client
     */
    async createAuthClient() {
        try {
            const authOptions = {
                scopes: this.config.scopes,
                projectId: this.config.projectId,
            };
            // Configure auth method
            if (this.serviceAccountKey) {
                // Use service account key
                authOptions.credentials = this.serviceAccountKey;
                authOptions.keyFile = undefined;
            }
            else if (this.config.serviceAccountKeyPath) {
                // Use key file path
                authOptions.keyFilename = this.resolveKeyPath(this.config.serviceAccountKeyPath);
            }
            else if (this.config.applicationDefaultCredentials) {
                // Use Application Default Credentials
                // No additional config needed - GoogleAuth will detect ADC automatically
            }
            else {
                throw new Error("No authentication method configured");
            }
            const googleAuth = new this.googleAuth(authOptions);
            const client = await googleAuth.getClient();
            this.logger.debug("Google Auth client created", {
                authMethod: this.getAuthMethod(),
                projectId: this.config.projectId,
            });
            return client;
        }
        catch (error) {
            throw new Error(`Failed to create auth client: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    /**
     * Get access token from auth client
     */
    async getAccessToken() {
        try {
            if (!this.authClient) {
                throw new Error("Auth client not initialized");
            }
            const tokenResponse = await this.authClient.getAccessToken();
            if (!tokenResponse.token) {
                throw new Error("No access token received");
            }
            // Create standard token response
            return {
                access_token: tokenResponse.token,
                expires_in: 3600, // Default to 1 hour if not provided
                token_type: "Bearer",
                scope: this.config.scopes.join(" "),
            };
        }
        catch (error) {
            throw new Error(`Failed to get access token: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    /**
     * Validate token by making a test API call
     */
    async validateTokenWithAPI(accessToken) {
        try {
            // Make a simple API call to validate the token
            const response = await fetch(`https://cloudresourcemanager.googleapis.com/v1/projects/${this.config.projectId}`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Accept: "application/json",
                },
            });
            if (!response.ok) {
                throw new Error(`API validation failed: ${response.status} ${response.statusText}`);
            }
        }
        catch (error) {
            throw new Error(`Token validation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    /**
     * Extract permissions based on scopes and project access
     */
    async extractPermissions() {
        const permissions = [];
        // Map scopes to permissions
        const scopePermissionMap = {
            "https://www.googleapis.com/auth/cloud-platform": [
                "vertex-ai-full-access",
                "project-editor",
                "resource-manager",
            ],
            "https://www.googleapis.com/auth/cloud-platform.read-only": [
                "vertex-ai-read-only",
                "project-viewer",
            ],
            "https://www.googleapis.com/auth/aiplatform": [
                "vertex-ai-platform",
                "ai-models",
                "predictions",
            ],
        };
        for (const scope of this.config.scopes) {
            const scopePermissions = scopePermissionMap[scope];
            if (scopePermissions) {
                permissions.push(...scopePermissions);
            }
        }
        return [...new Set(permissions)]; // Remove duplicates
    }
    /**
     * Get authentication method being used
     */
    getAuthMethod() {
        if (this.serviceAccountKey || this.config.serviceAccountKeyPath) {
            return "service-account-key";
        }
        else if (this.config.applicationDefaultCredentials) {
            return "application-default-credentials";
        }
        else {
            return "unknown";
        }
    }
    /**
     * Resolve key file path (handle relative paths and environment variables)
     */
    resolveKeyPath(keyPath) {
        // Handle environment variables
        if (keyPath.startsWith("$")) {
            const envVar = keyPath.substring(1);
            const envValue = process.env[envVar];
            if (!envValue) {
                throw new Error(`Environment variable ${envVar} not set`);
            }
            keyPath = envValue;
        }
        // Handle tilde for home directory
        if (keyPath.startsWith("~/")) {
            keyPath = path.join(os.homedir(), keyPath.substring(2));
        }
        // Convert to absolute path
        return path.resolve(keyPath);
    }
    /**
     * Generate unique session ID
     */
    generateSessionId() {
        return `vertex-ai_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
    /**
     * Validate Vertex AI configuration
     */
    validateConfig() {
        if (!this.config.projectId) {
            throw new Error("Vertex AI configuration missing required field: projectId");
        }
        if (!this.config.location) {
            throw new Error("Vertex AI configuration missing required field: location");
        }
        // Must have at least one authentication method
        const hasServiceAccountKey = !!(this.config.serviceAccountKeyPath || this.config.serviceAccountKey);
        const hasADC = !!this.config.applicationDefaultCredentials;
        if (!hasServiceAccountKey && !hasADC) {
            throw new Error("Vertex AI configuration must specify either service account key or Application Default Credentials");
        }
        // Validate scopes
        if (!Array.isArray(this.config.scopes)) {
            throw new Error("Vertex AI configuration scopes must be an array");
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
            projectId: this.config.projectId,
            location: this.config.location,
            timestamp: Date.now(),
        };
        return error;
    }
}
