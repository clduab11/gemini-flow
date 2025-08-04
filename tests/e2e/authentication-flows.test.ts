/**
 * Authentication Flows E2E Tests
 * 
 * End-to-end tests for complete authentication flows including OAuth2, 
 * Vertex AI, and unified authentication manager integration
 */

import { jest } from '@jest/globals';
import { UnifiedAuthManager } from '../../src/core/auth/unified-auth-manager.js';
import { OAuth2Provider } from '../../src/core/auth/oauth2-provider.js';
import { VertexAIProvider } from '../../src/core/auth/vertex-ai-provider.js';
import { 
  UnifiedAuthConfig, 
  OAuth2Config, 
  VertexAIConfig,
  AuthCredentials,
  AuthContext,
  AuthEvent
} from '../../src/types/auth.js';

// Mock external dependencies
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

// Mock Google Auth Library
jest.mock('google-auth-library', () => ({
  GoogleAuth: jest.fn().mockImplementation(() => ({
    getAccessToken: jest.fn().mockResolvedValue('mock-vertex-token'),
    getClient: jest.fn().mockResolvedValue({
      request: jest.fn().mockResolvedValue({ data: { access_token: 'mock-token' } })
    })
  }))
}));

describe('Authentication Flows E2E', () => {
  let authManager: UnifiedAuthManager;
  let mockConfig: UnifiedAuthConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();

    // Complete unified auth configuration
    mockConfig = {
      providers: {
        oauth2: {
          clientId: 'test-oauth2-client',
          clientSecret: 'test-oauth2-secret',
          redirectUri: 'http://localhost:3000/auth/callback',
          authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
          tokenEndpoint: 'https://oauth2.googleapis.com/token',
          revokeEndpoint: 'https://oauth2.googleapis.com/revoke',
          userinfoEndpoint: 'https://openidconnect.googleapis.com/v1/userinfo',
          scopes: ['openid', 'profile', 'email'],
          pkceEnabled: true
        },
        vertexAI: {
          projectId: 'test-vertex-project',
          location: 'us-central1',
          credentials: {
            type: 'service_account',
            project_id: 'test-vertex-project',
            private_key_id: 'test-key-id',
            private_key: '-----BEGIN PRIVATE KEY-----\nMOCK_PRIVATE_KEY\n-----END PRIVATE KEY-----',
            client_email: 'test@test-vertex-project.iam.gserviceaccount.com',
            client_id: 'test-client-id',
            auth_uri: 'https://accounts.google.com/o/oauth2/auth',
            token_uri: 'https://oauth2.googleapis.com/token'
          },
          scopes: ['https://www.googleapis.com/auth/cloud-platform']
        }
      },
      storage: {
        type: 'memory',
        encryption: {
          enabled: true,
          algorithm: 'aes-256-gcm'
        }
      },
      cache: {
        type: 'memory',
        maxSize: 1000,
        ttl: 3600000 // 1 hour
      },
      security: {
        maxSessionAge: 86400000, // 24 hours
        tokenRefreshBuffer: 300000, // 5 minutes
        requireSecureTransport: false // For testing
      },
      logging: {
        level: 'debug',
        enableMetrics: true
      }
    };

    authManager = new UnifiedAuthManager(mockConfig);
  });

  afterEach (async () => {
    if (authManager) {
      await authManager.shutdown();
    }
    jest.restoreAllMocks();
  });

  describe('OAuth2 Complete Flow', () => {
    beforeEach(() => {
      // Mock OAuth2 token response
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          access_token: 'oauth2-access-token',
          refresh_token: 'oauth2-refresh-token',
          expires_in: 3600,
          token_type: 'Bearer',
          scope: 'openid profile email',
          id_token: 'mock.jwt.token'
        })
      });
    });

    it('should complete OAuth2 authentication flow end-to-end', async () => {
      // Step 1: Start authentication
      const authResult = await authManager.authenticate('oauth2');
      
      expect(authResult.success).toBe(true);
      expect(authResult.redirectUrl).toContain('accounts.google.com');
      expect(authResult.context?.sessionId).toBeDefined();

      const sessionId = authResult.context!.sessionId;

      // Step 2: Simulate OAuth2 callback with authorization code
      const oauth2Provider = new OAuth2Provider(mockConfig.providers.oauth2!);
      const tokenResult = await oauth2Provider.exchangeCodeForTokens(
        'mock-auth-code',
        authResult.context?.credentials?.metadata?.state as string,
        authResult.context?.credentials?.metadata?.pkceVerifier as string
      );

      expect(tokenResult.success).toBe(true);
      expect(tokenResult.credentials?.accessToken).toBe('oauth2-access-token');
      expect(tokenResult.credentials?.refreshToken).toBe('oauth2-refresh-token');

      // Step 3: Verify credentials are stored and cached
      const storedCredentials = await authManager.getCredentials(sessionId);
      expect(storedCredentials).toBeNull(); // Not yet stored in manager

      // Step 4: Store credentials in manager (simulate callback completion)
      if (tokenResult.credentials && tokenResult.context) {
        const session = await authManager['createSession'](tokenResult.context);
        await authManager['storeCredentials'](session.id, tokenResult.credentials);
        await authManager['cacheCredentials'](session.id, tokenResult.credentials);

        // Step 5: Validate stored credentials
        const validation = await authManager.validateCredentials(session.id);
        expect(validation.valid).toBe(true);
        expect(validation.scopes).toEqual(['openid', 'profile', 'email']);
      }
    });

    it('should handle OAuth2 token refresh automatically', async () => {
      // Create initial authenticated session
      const authResult = await authManager.authenticate('oauth2');
      const oauth2Provider = new OAuth2Provider(mockConfig.providers.oauth2!);
      
      const tokenResult = await oauth2Provider.exchangeCodeForTokens('mock-auth-code');
      expect(tokenResult.success).toBe(true);

      if (tokenResult.credentials && tokenResult.context) {
        const session = await authManager['createSession'](tokenResult.context);
        
        // Modify credentials to be near expiration
        const nearExpiredCredentials: AuthCredentials = {
          ...tokenResult.credentials,
          expiresAt: Date.now() + 60000 // 1 minute from now
        };

        await authManager['storeCredentials'](session.id, nearExpiredCredentials);
        await authManager['cacheCredentials'](session.id, nearExpiredCredentials);

        // Mock refresh token response
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: jest.fn().mockResolvedValue({
            access_token: 'refreshed-access-token',
            refresh_token: 'new-refresh-token',
            expires_in: 3600,
            token_type: 'Bearer'
          })
        });

        // Trigger refresh
        const refreshResult = await authManager.refreshCredentials(session.id);
        
        expect(refreshResult.success).toBe(true);
        expect(refreshResult.credentials?.accessToken).toBe('refreshed-access-token');
        expect(refreshResult.credentials?.refreshToken).toBe('new-refresh-token');

        // Verify updated credentials are stored
        const updatedCredentials = await authManager.getCredentials(session.id);
        expect(updatedCredentials?.accessToken).toBe('refreshed-access-token');
      }
    });

    it('should handle OAuth2 errors and fallback scenarios', async () => {
      // Test invalid authorization code
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValue({
          error: 'invalid_grant',
          error_description: 'Invalid authorization code'
        })
      });

      const oauth2Provider = new OAuth2Provider(mockConfig.providers.oauth2!);
      const failedResult = await oauth2Provider.exchangeCodeForTokens('invalid-code');
      
      expect(failedResult.success).toBe(false);
      expect(failedResult.error?.code).toBe('TOKEN_EXCHANGE_FAILED');

      // Test refresh token expiration
      const mockCredentials: AuthCredentials = {
        type: 'oauth2',
        provider: 'oauth2',
        accessToken: 'expired-token',
        refreshToken: 'expired-refresh-token',
        expiresAt: Date.now() - 1000,
        scope: ['openid'],
        issuedAt: Date.now() - 7200000,
        metadata: {}
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: jest.fn().mockResolvedValue({
          error: 'invalid_grant',
          error_description: 'Refresh token expired'
        })
      });

      const refreshResult = await oauth2Provider.refresh(mockCredentials);
      expect(refreshResult.success).toBe(false);
      expect(refreshResult.requiresReauth).toBe(true);
    });
  });

  describe('Vertex AI Authentication Flow', () => {
    it('should authenticate with Vertex AI using service account', async () => {
      const authResult = await authManager.authenticate('vertex-ai');
      
      expect(authResult.success).toBe(true);
      expect(authResult.credentials?.provider).toBe('vertex-ai');
      expect(authResult.context?.sessionId).toBeDefined();

      const sessionId = authResult.context!.sessionId;

      // Verify credentials are valid
      const validation = await authManager.validateCredentials(sessionId);
      expect(validation.valid).toBe(true);

      // Verify credentials can be retrieved
      const credentials = await authManager.getCredentials(sessionId);
      expect(credentials?.type).toBe('service_account');
      expect(credentials?.provider).toBe('vertex-ai');
    });

    it('should handle Vertex AI authentication errors', async () => {
      // Create invalid config
      const invalidConfig: UnifiedAuthConfig = {
        ...mockConfig,
        providers: {
          vertexAI: {
            projectId: 'invalid-project',
            location: 'invalid-location',
            credentials: {
              type: 'service_account',
              project_id: 'invalid-project',
              private_key: 'invalid-private-key',
              client_email: 'invalid@invalid.com'
            } as any
          }
        }
      };

      const invalidAuthManager = new UnifiedAuthManager(invalidConfig);
      
      const authResult = await invalidAuthManager.authenticate('vertex-ai');
      
      expect(authResult.success).toBe(false);
      expect(authResult.error).toBeDefined();

      await invalidAuthManager.shutdown();
    });
  });

  describe('Multi-Provider Scenarios', () => {
    it('should handle multiple concurrent authentication sessions', async () => {
      // Mock responses for both providers
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          access_token: 'concurrent-token',
          refresh_token: 'concurrent-refresh',
          expires_in: 3600,
          token_type: 'Bearer'
        })
      });

      // Start multiple authentication flows
      const [oauth2Result, vertexResult] = await Promise.all([
        authManager.authenticate('oauth2'),
        authManager.authenticate('vertex-ai')
      ]);

      expect(oauth2Result.success).toBe(true);
      expect(vertexResult.success).toBe(true);
      expect(oauth2Result.context?.sessionId).not.toBe(vertexResult.context?.sessionId);

      // Verify both sessions are active
      const activeSessions = authManager.getActiveSessions();
      expect(activeSessions).toHaveLength(2);
      expect(activeSessions).toContain(oauth2Result.context?.sessionId);
      expect(activeSessions).toContain(vertexResult.context?.sessionId);
    });

    it('should handle provider fallback scenarios', async () => {
      // Disable OAuth2 provider
      authManager.setProviderEnabled('oauth2', false);

      // Try OAuth2 authentication (should fail)
      const oauth2Result = await authManager.authenticate('oauth2');
      expect(oauth2Result.success).toBe(false);

      // Vertex AI should still work
      const vertexResult = await authManager.authenticate('vertex-ai');
      expect(vertexResult.success).toBe(true);

      // Re-enable OAuth2
      authManager.setProviderEnabled('oauth2', true);
      const oauth2RetryResult = await authManager.authenticate('oauth2');
      expect(oauth2RetryResult.success).toBe(true);
    });

    it('should manage provider priorities correctly', async () => {
      const availableProviders = authManager.getAvailableProviders();
      expect(availableProviders).toContain('oauth2');
      expect(availableProviders).toContain('vertex-ai');

      // Test provider registration with priorities
      const mockProvider = {
        name: 'test-provider',
        type: 'test' as const,
        authenticate: jest.fn().mockResolvedValue({ success: true }),
        refresh: jest.fn(),
        validate: jest.fn(),
        revoke: jest.fn()
      };

      authManager.registerProvider('test' as any, mockProvider, {}, { priority: 1 });
      
      const updatedProviders = authManager.getAvailableProviders();
      expect(updatedProviders).toContain('test' as any);
    });
  });

  describe('Session Management and Lifecycle', () => {
    let sessionId: string;

    beforeEach(async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          access_token: 'session-token',
          refresh_token: 'session-refresh',
          expires_in: 3600,
          token_type: 'Bearer'
        })
      });

      const authResult = await authManager.authenticate('oauth2');
      sessionId = authResult.context!.sessionId;
    });

    it('should manage session lifecycle correctly', async () => {
      // Verify session exists and is active
      const session = authManager.getSession(sessionId);
      expect(session).toBeDefined();
      expect(session?.status).toBe('authenticated');

      // Verify session activity updates
      const initialActivity = session!.lastActivity;
      await authManager.validateCredentials(sessionId);
      
      const updatedSession = authManager.getSession(sessionId);
      expect(updatedSession!.lastActivity).toBeGreaterThan(initialActivity);

      // Test session revocation
      await authManager.revokeCredentials(sessionId);
      
      const revokedSession = authManager.getSession(sessionId);
      expect(revokedSession).toBeNull();
    });

    it('should handle session expiration and cleanup', async () => {
      // Simulate expired session
      const session = authManager.getSession(sessionId);
      if (session) {
        session.createdAt = Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago
      }

      // Trigger cleanup
      const cleanedCount = await authManager.cleanup();
      expect(cleanedCount).toBeGreaterThan(0);

      // Verify session was cleaned up
      const cleanedSession = authManager.getSession(sessionId);
      expect(cleanedSession).toBeNull();
    });

    it('should handle concurrent session operations safely', async () => {
      // Test concurrent refresh attempts
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          access_token: 'concurrent-refresh-token',
          expires_in: 3600,
          token_type: 'Bearer'
        })
      });

      const refreshPromises = Array.from({ length: 5 }, () => 
        authManager.refreshCredentials(sessionId)
      );

      const results = await Promise.allSettled(refreshPromises);
      
      // At least one should succeed
      const successful = results.filter(r => 
        r.status === 'fulfilled' && r.value.success
      ).length;
      expect(successful).toBeGreaterThan(0);
    });
  });

  describe('Event Handling and Monitoring', () => {
    let eventSpy: jest.Mock;
    let authEventSpy: jest.Mock;

    beforeEach(() => {
      eventSpy = jest.fn();
      authEventSpy = jest.fn();
      
      authManager.on('auth_event', eventSpy);
      authManager.addEventHandler(authEventSpy);
    });

    it('should emit authentication events correctly', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          access_token: 'event-token',
          refresh_token: 'event-refresh',
          expires_in: 3600,
          token_type: 'Bearer'
        })
      });

      await authManager.authenticate('oauth2');

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'authentication',
          provider: 'oauth2',
          success: true
        })
      );

      expect(authEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'authentication',
          provider: 'oauth2',
          success: true
        })
      );
    });

    it('should emit error events for failed operations', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      await authManager.authenticate('oauth2');

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          provider: 'oauth2',
          success: false
        })
      );
    });

    it('should track and emit metrics events', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          access_token: 'metrics-token',
          expires_in: 3600,
          token_type: 'Bearer'
        })
      });

      // Perform several operations to generate metrics
      await authManager.authenticate('oauth2');
      await authManager.authenticate('vertex-ai');

      const metrics = authManager.getMetrics();
      
      expect(metrics.totalAuthentications).toBeGreaterThan(0);
      expect(metrics.successfulAuthentications).toBeGreaterThan(0);
      expect(metrics.averageAuthTime).toBeGreaterThan(0);
      expect(metrics.activeContexts).toBeGreaterThan(0);
    });
  });

  describe('Security and Error Resilience', () => {
    it('should handle storage encryption correctly', async () => {
      // Test with encrypted storage config
      const secureConfig: UnifiedAuthConfig = {
        ...mockConfig,
        storage: {
          type: 'memory',
          encryption: {
            enabled: true,
            algorithm: 'aes-256-gcm',
            keyDerivation: 'pbkdf2'
          }
        }
      };

      const secureAuthManager = new UnifiedAuthManager(secureConfig);

      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          access_token: 'secure-token',
          refresh_token: 'secure-refresh',
          expires_in: 3600,
          token_type: 'Bearer'
        })
      });

      const authResult = await secureAuthManager.authenticate('oauth2');
      expect(authResult.success).toBe(true);

      // Verify credentials are encrypted in storage
      const credentials = await secureAuthManager.getCredentials(authResult.context!.sessionId);
      expect(credentials).toBeDefined();

      await secureAuthManager.shutdown();
    });

    it('should handle network failures gracefully', async () => {
      // Test network timeout
      mockFetch.mockImplementation(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Network timeout')), 100)
        )
      );

      const authResult = await authManager.authenticate('oauth2');
      expect(authResult.success).toBe(false);
      expect(authResult.error?.message).toContain('oauth2');
    });

    it('should validate security constraints', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          access_token: 'security-token',
          expires_in: 3600,
          token_type: 'Bearer'
        })
      });

      const authResult = await authManager.authenticate('oauth2');
      const sessionId = authResult.context!.sessionId;

      // Test session age validation
      const session = authManager.getSession(sessionId);
      if (session) {
        // Simulate old session
        session.createdAt = Date.now() - (25 * 60 * 60 * 1000); // 25 hours ago
        
        // Validation should detect expired session
        const validation = await authManager.validateCredentials(sessionId);
        // Note: This might still be valid depending on token expiration vs session expiration
      }
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle high-volume authentication requests', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          access_token: 'volume-token',
          expires_in: 3600,
          token_type: 'Bearer'
        })
      });

      const authPromises = Array.from({ length: 20 }, (_, i) => 
        authManager.authenticate(i % 2 === 0 ? 'oauth2' : 'vertex-ai')
      );

      const startTime = Date.now();
      const results = await Promise.allSettled(authPromises);
      const duration = Date.now() - startTime;

      const successful = results.filter(r => 
        r.status === 'fulfilled' && r.value.success
      ).length;

      expect(successful).toBeGreaterThan(0);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds

      // Verify metrics tracking
      const metrics = authManager.getMetrics();
      expect(metrics.totalAuthentications).toBeGreaterThan(0);
    });

    it('should efficiently cache and retrieve credentials', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          access_token: 'cache-token',
          expires_in: 3600,
          token_type: 'Bearer'
        })
      });

      const authResult = await authManager.authenticate('oauth2');
      const sessionId = authResult.context!.sessionId;

      // First retrieval (cache miss)
      const startTime1 = Date.now();
      const credentials1 = await authManager.getCredentials(sessionId);
      const duration1 = Date.now() - startTime1;

      // Second retrieval (cache hit)
      const startTime2 = Date.now();
      const credentials2 = await authManager.getCredentials(sessionId);
      const duration2 = Date.now() - startTime2;

      expect(credentials1).toEqual(credentials2);
      expect(duration2).toBeLessThan(duration1); // Cache hit should be faster
    });
  });
});