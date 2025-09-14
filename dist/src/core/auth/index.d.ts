/**
 * Comprehensive Authentication System
 *
 * Main export file for the unified authentication system including
 * OAuth2, Vertex AI, credential storage, token caching, and security context management
 */
export { UnifiedAuthManager } from "./unified-auth-manager.js";
export { OAuth2Provider } from "./oauth2-provider.js";
export { VertexAIProvider } from "./vertex-ai-provider.js";
export { MemoryCredentialStorage, FileCredentialStorage, createCredentialStorage, } from "./credential-storage.js";
export { InMemoryTokenCache, createTokenCache } from "./token-cache.js";
export { A2AAuthService } from "./a2a-auth-service.js";
export { MCPAuthenticationProvider } from "./mcp-auth-provider.js";
export { SecurityContextManager } from "./security-context.js";
export * from "../../types/auth.js";
/**
 * Factory function to create a complete authentication system
 */
import { UnifiedAuthManager } from "./unified-auth-manager.js";
import { A2AAuthService } from "./a2a-auth-service.js";
import { MCPAuthenticationProvider } from "./mcp-auth-provider.js";
import { SecurityContextManager } from "./security-context.js";
import { UnifiedAuthConfig } from "../../types/auth.js";
export interface AuthSystemConfig extends UnifiedAuthConfig {
    enableA2AIntegration?: boolean;
    enableMCPIntegration?: boolean;
    enableSecurityContext?: boolean;
    a2aConfig?: any;
    mcpConfig?: any;
    securityConfig?: any;
}
/**
 * Complete authentication system factory
 */
export declare class AuthSystemFactory {
    /**
     * Create a complete authentication system with all components
     */
    static createAuthSystem(config: AuthSystemConfig): Promise<{
        authManager: UnifiedAuthManager;
        a2aService: A2AAuthService | undefined;
        mcpProvider: MCPAuthenticationProvider | undefined;
        securityManager: SecurityContextManager | undefined;
        /**
         * Initialize all components
         */
        initialize(): Promise<void>;
        /**
         * Shutdown all components
         */
        shutdown(): Promise<void>;
        /**
         * Get system health status
         */
        getHealthStatus(): {
            authManager: {
                activeSessions: number;
                metrics: import("../../types/auth.js").AuthMetrics;
            };
            a2aService: {
                activeRequests: number;
                securityContexts: number;
                auditLogEntries: number;
                recentAuthRequests: number;
                successfulAuths: number;
                failedAuths: number;
                trustedAgents: number;
                rateLimitedAgents: number;
            } | null;
            mcpProvider: {
                name: string;
                version: string;
                capabilities: import("../../types/auth.js").MCPAuthCapability[];
                metrics: import("./mcp-auth-provider.js").MCPAuthMetrics | undefined;
                config: {
                    maxConcurrentRequests: number;
                    requestTimeoutMs: number;
                    enabledCapabilities: number;
                };
            } | null;
            securityManager: {
                totalContexts: number;
                activeComponents: number;
                trustedComponents: number;
                totalAccesses: number;
                averageAge: number;
                auditEntries: number;
                securityViolations: number;
            } | null;
        };
    }>;
    /**
     * Create minimal authentication system (just auth manager)
     */
    static createMinimalAuthSystem(config: UnifiedAuthConfig): UnifiedAuthManager;
    /**
     * Create OAuth2-only authentication system
     */
    static createOAuth2System(config: UnifiedAuthConfig): UnifiedAuthManager;
    /**
     * Create Vertex AI-only authentication system
     */
    static createVertexAISystem(config: UnifiedAuthConfig): UnifiedAuthManager;
}
/**
 * Default configuration templates
 */
export declare const AuthConfigTemplates: {
    /**
     * Development configuration
     */
    development: {
        storage: {
            type: "memory";
            options: {};
        };
        cache: {
            type: "memory";
            ttl: number;
            maxSize: number;
        };
        security: {
            encryptCredentials: boolean;
            requireHttps: boolean;
            maxSessionAge: number;
            tokenRefreshBuffer: number;
        };
        logging: {
            level: "debug";
            logCredentials: boolean;
            logTokens: boolean;
        };
    };
    /**
     * Production configuration
     */
    production: {
        storage: {
            type: "file";
            options: {};
        };
        cache: {
            type: "memory";
            ttl: number;
            maxSize: number;
        };
        security: {
            encryptCredentials: boolean;
            requireHttps: boolean;
            maxSessionAge: number;
            tokenRefreshBuffer: number;
        };
        logging: {
            level: "info";
            logCredentials: boolean;
            logTokens: boolean;
        };
    };
    /**
     * Testing configuration
     */
    testing: {
        storage: {
            type: "memory";
            options: {};
        };
        cache: {
            type: "memory";
            ttl: number;
            maxSize: number;
        };
        security: {
            encryptCredentials: boolean;
            requireHttps: boolean;
            maxSessionAge: number;
            tokenRefreshBuffer: number;
        };
        logging: {
            level: "error";
            logCredentials: boolean;
            logTokens: boolean;
        };
    };
};
/**
 * Helper functions for common authentication tasks
 */
export declare class AuthHelpers {
    /**
     * Create Google OAuth2 configuration
     */
    static createGoogleOAuth2Config(clientId: string, clientSecret: string, redirectUri?: string): {
        clientId: string;
        clientSecret: string;
        redirectUri: string;
        scopes: string[];
        authorizationEndpoint: string;
        tokenEndpoint: string;
        revokeEndpoint: string;
        userinfoEndpoint: string;
        pkceEnabled: boolean;
    };
    /**
     * Create Vertex AI configuration
     */
    static createVertexAIConfig(projectId: string, location: string, options?: {
        serviceAccountKeyPath?: string;
        serviceAccountKey?: any;
        useADC?: boolean;
    }): {
        projectId: string;
        location: string;
        serviceAccountKeyPath: string | undefined;
        serviceAccountKey: any;
        applicationDefaultCredentials: boolean;
        scopes: string[];
    };
    /**
     * Validate authentication configuration
     */
    static validateConfig(config: UnifiedAuthConfig): {
        valid: boolean;
        errors: string[];
    };
}
/**
 * Export convenience constants
 */
export declare const AUTH_EVENTS: {
    readonly USER_AUTHENTICATED: "user_authenticated";
    readonly TOKEN_REFRESHED: "token_refreshed";
    readonly SESSION_EXPIRED: "session_expired";
    readonly QUOTA_EXCEEDED: "quota_exceeded";
    readonly USER_REVOKED: "user_revoked";
    readonly CREDENTIALS_STORED: "credentials_stored";
    readonly CREDENTIALS_RETRIEVED: "credentials_retrieved";
    readonly CACHE_HIT: "cache_hit";
    readonly CACHE_MISS: "cache_miss";
    readonly CONTEXT_CREATED: "context_created";
    readonly CONTEXT_PROPAGATED: "context_propagated";
    readonly SECURITY_VIOLATION: "security_violation";
};
export declare const AUTH_ERRORS: {
    readonly INVALID_CREDENTIALS: "INVALID_CREDENTIALS";
    readonly TOKEN_EXPIRED: "TOKEN_EXPIRED";
    readonly REFRESH_FAILED: "REFRESH_FAILED";
    readonly PROVIDER_NOT_FOUND: "PROVIDER_NOT_FOUND";
    readonly SESSION_NOT_FOUND: "SESSION_NOT_FOUND";
    readonly PERMISSION_DENIED: "PERMISSION_DENIED";
    readonly QUOTA_EXCEEDED: "QUOTA_EXCEEDED";
    readonly RATE_LIMITED: "RATE_LIMITED";
    readonly CONFIGURATION_ERROR: "CONFIGURATION_ERROR";
    readonly NETWORK_ERROR: "NETWORK_ERROR";
};
//# sourceMappingURL=index.d.ts.map