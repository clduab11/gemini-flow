/**
 * Comprehensive Authentication System
 *
 * Main export file for the unified authentication system including
 * OAuth2, Vertex AI, credential storage, token caching, and security context management
 */

// Core authentication manager
export { UnifiedAuthManager } from "./unified-auth-manager.js";

// Authentication providers
export { OAuth2Provider } from "./oauth2-provider.js";
export { VertexAIProvider } from "./vertex-ai-provider.js";

// Storage and caching
export {
  MemoryCredentialStorage,
  FileCredentialStorage,
  createCredentialStorage,
} from "./credential-storage.js";
export { InMemoryTokenCache, createTokenCache } from "./token-cache.js";

// Protocol integrations
export { A2AAuthService } from "./a2a-auth-service.js";
export { MCPAuthenticationProvider } from "./mcp-auth-provider.js";

// Security context management
export { SecurityContextManager } from "./security-context.js";

// Type exports
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
export class AuthSystemFactory {
  /**
   * Create a complete authentication system with all components
   */
  static async createAuthSystem(config: AuthSystemConfig) {
    // Create unified auth manager
    const authManager = new UnifiedAuthManager(config);

    // Create optional components
    let a2aService: A2AAuthService | undefined;
    let mcpProvider: MCPAuthenticationProvider | undefined;
    let securityManager: SecurityContextManager | undefined;

    // Initialize A2A integration if enabled
    if (config.enableA2AIntegration) {
      a2aService = new A2AAuthService(authManager, config.a2aConfig);
    }

    // Initialize MCP integration if enabled
    if (config.enableMCPIntegration) {
      mcpProvider = new MCPAuthenticationProvider(
        authManager,
        config.mcpConfig,
      );
    }

    // Initialize security context manager if enabled
    if (config.enableSecurityContext) {
      securityManager = new SecurityContextManager(config.securityConfig);
    }

    return {
      authManager,
      a2aService,
      mcpProvider,
      securityManager,

      /**
       * Initialize all components
       */
      async initialize() {
        // Auth manager is initialized in constructor
        // Additional initialization if needed
      },

      /**
       * Shutdown all components
       */
      async shutdown() {
        await authManager.shutdown();

        if (a2aService) {
          await a2aService.shutdown();
        }

        if (securityManager) {
          await securityManager.shutdown();
        }
      },

      /**
       * Get system health status
       */
      getHealthStatus() {
        return {
          authManager: {
            activeSessions: authManager.getActiveSessions().length,
            metrics: authManager.getMetrics(),
          },
          a2aService: a2aService ? a2aService.getStats() : null,
          mcpProvider: mcpProvider ? mcpProvider.getProviderInfo() : null,
          securityManager: securityManager
            ? securityManager.getSecurityStats()
            : null,
        };
      },
    };
  }

  /**
   * Create minimal authentication system (just auth manager)
   */
  static createMinimalAuthSystem(config: UnifiedAuthConfig) {
    return new UnifiedAuthManager(config);
  }

  /**
   * Create OAuth2-only authentication system
   */
  static createOAuth2System(config: UnifiedAuthConfig) {
    if (!config.providers.oauth2) {
      throw new Error("OAuth2 configuration is required");
    }

    return new UnifiedAuthManager({
      ...config,
      providers: {
        oauth2: config.providers.oauth2,
      },
    });
  }

  /**
   * Create Vertex AI-only authentication system
   */
  static createVertexAISystem(config: UnifiedAuthConfig) {
    if (!config.providers.vertexAI) {
      throw new Error("Vertex AI configuration is required");
    }

    return new UnifiedAuthManager({
      ...config,
      providers: {
        vertexAI: config.providers.vertexAI,
      },
    });
  }
}

/**
 * Default configuration templates
 */
export const AuthConfigTemplates = {
  /**
   * Development configuration
   */
  development: {
    storage: {
      type: "memory" as const,
      options: {},
    },
    cache: {
      type: "memory" as const,
      ttl: 60 * 60 * 1000, // 1 hour
      maxSize: 100,
    },
    security: {
      encryptCredentials: false,
      requireHttps: false,
      maxSessionAge: 24 * 60 * 60 * 1000, // 24 hours
      tokenRefreshBuffer: 5 * 60 * 1000, // 5 minutes
    },
    logging: {
      level: "debug" as const,
      logCredentials: false,
      logTokens: false,
    },
  },

  /**
   * Production configuration
   */
  production: {
    storage: {
      type: "file" as const,
      options: {},
    },
    cache: {
      type: "memory" as const,
      ttl: 30 * 60 * 1000, // 30 minutes
      maxSize: 1000,
    },
    security: {
      encryptCredentials: true,
      requireHttps: true,
      maxSessionAge: 8 * 60 * 60 * 1000, // 8 hours
      tokenRefreshBuffer: 10 * 60 * 1000, // 10 minutes
    },
    logging: {
      level: "info" as const,
      logCredentials: false,
      logTokens: false,
    },
  },

  /**
   * Testing configuration
   */
  testing: {
    storage: {
      type: "memory" as const,
      options: {},
    },
    cache: {
      type: "memory" as const,
      ttl: 5 * 60 * 1000, // 5 minutes
      maxSize: 10,
    },
    security: {
      encryptCredentials: false,
      requireHttps: false,
      maxSessionAge: 60 * 60 * 1000, // 1 hour
      tokenRefreshBuffer: 30 * 1000, // 30 seconds
    },
    logging: {
      level: "error" as const,
      logCredentials: false,
      logTokens: false,
    },
  },
};

/**
 * Helper functions for common authentication tasks
 */
export class AuthHelpers {
  /**
   * Create Google OAuth2 configuration
   */
  static createGoogleOAuth2Config(
    clientId: string,
    clientSecret: string,
    redirectUri?: string,
  ) {
    return {
      clientId,
      clientSecret,
      redirectUri: redirectUri || "http://localhost:3000/callback",
      scopes: [
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/cloud-platform",
      ],
      authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenEndpoint: "https://oauth2.googleapis.com/token",
      revokeEndpoint: "https://oauth2.googleapis.com/revoke",
      userinfoEndpoint: "https://www.googleapis.com/oauth2/v2/userinfo",
      pkceEnabled: true,
    };
  }

  /**
   * Create Vertex AI configuration
   */
  static createVertexAIConfig(
    projectId: string,
    location: string,
    options: {
      serviceAccountKeyPath?: string;
      serviceAccountKey?: any;
      useADC?: boolean;
    } = {},
  ) {
    return {
      projectId,
      location,
      serviceAccountKeyPath: options.serviceAccountKeyPath,
      serviceAccountKey: options.serviceAccountKey,
      applicationDefaultCredentials: options.useADC ?? false,
      scopes: [
        "https://www.googleapis.com/auth/cloud-platform",
        "https://www.googleapis.com/auth/aiplatform",
      ],
    };
  }

  /**
   * Validate authentication configuration
   */
  static validateConfig(config: UnifiedAuthConfig): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check if at least one provider is configured
    if (
      !config.providers.oauth2 &&
      !config.providers.vertexAI &&
      !config.providers.googleAI
    ) {
      errors.push("At least one authentication provider must be configured");
    }

    // Validate OAuth2 config if present
    if (config.providers.oauth2) {
      const oauth2 = config.providers.oauth2;
      if (!oauth2.clientId) errors.push("OAuth2 clientId is required");
      if (!oauth2.clientSecret) errors.push("OAuth2 clientSecret is required");
      if (!oauth2.redirectUri) errors.push("OAuth2 redirectUri is required");
      if (!oauth2.authorizationEndpoint)
        errors.push("OAuth2 authorizationEndpoint is required");
      if (!oauth2.tokenEndpoint)
        errors.push("OAuth2 tokenEndpoint is required");
    }

    // Validate Vertex AI config if present
    if (config.providers.vertexAI) {
      const vertexAI = config.providers.vertexAI;
      if (!vertexAI.projectId) errors.push("Vertex AI projectId is required");
      if (!vertexAI.location) errors.push("Vertex AI location is required");

      const hasServiceAccount = !!(
        vertexAI.serviceAccountKeyPath || vertexAI.serviceAccountKey
      );
      const hasADC = !!vertexAI.applicationDefaultCredentials;

      if (!hasServiceAccount && !hasADC) {
        errors.push(
          "Vertex AI requires either service account key or Application Default Credentials",
        );
      }
    }

    // Validate storage config
    if (!config.storage.type) {
      errors.push("Storage type is required");
    }

    // Validate cache config
    if (!config.cache.type) {
      errors.push("Cache type is required");
    }
    if (!config.cache.ttl || config.cache.ttl <= 0) {
      errors.push("Cache TTL must be positive");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Export convenience constants
 */
export const AUTH_EVENTS = {
  USER_AUTHENTICATED: "user_authenticated",
  TOKEN_REFRESHED: "token_refreshed",
  SESSION_EXPIRED: "session_expired",
  QUOTA_EXCEEDED: "quota_exceeded",
  USER_REVOKED: "user_revoked",
  CREDENTIALS_STORED: "credentials_stored",
  CREDENTIALS_RETRIEVED: "credentials_retrieved",
  CACHE_HIT: "cache_hit",
  CACHE_MISS: "cache_miss",
  CONTEXT_CREATED: "context_created",
  CONTEXT_PROPAGATED: "context_propagated",
  SECURITY_VIOLATION: "security_violation",
} as const;

export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  REFRESH_FAILED: "REFRESH_FAILED",
  PROVIDER_NOT_FOUND: "PROVIDER_NOT_FOUND",
  SESSION_NOT_FOUND: "SESSION_NOT_FOUND",
  PERMISSION_DENIED: "PERMISSION_DENIED",
  QUOTA_EXCEEDED: "QUOTA_EXCEEDED",
  RATE_LIMITED: "RATE_LIMITED",
  CONFIGURATION_ERROR: "CONFIGURATION_ERROR",
  NETWORK_ERROR: "NETWORK_ERROR",
} as const;
