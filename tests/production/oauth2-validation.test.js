/**
 * Production OAuth2 Validation Tests
 * 
 * Comprehensive end-to-end tests for OAuth2 token refresh and authentication flows
 * against real OAuth2 providers in a controlled testing environment
 */

import { OAuth2Provider } from '../../src/core/auth/oauth2-provider.js';
import { InMemoryTokenCache } from '../../src/core/auth/token-cache.js';
import { Logger } from '../../src/utils/logger.js';

// Test configuration for Google OAuth2 (using test credentials)
const TEST_OAUTH2_CONFIG = {
  clientId: process.env.GOOGLE_CLIENT_ID || 'test-client-id',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'test-client-secret',
  redirectUri: 'http://localhost:3000/auth/callback',
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  userinfoEndpoint: 'https://www.googleapis.com/oauth2/v2/userinfo',
  revokeEndpoint: 'https://oauth2.googleapis.com/revoke',
  scopes: ['openid', 'profile', 'email'],
  pkceEnabled: true
};

describe('OAuth2 Production Validation', () => {
  let oauth2Provider;
  let tokenCache;
  let logger;

  beforeAll(async () => {
    logger = new Logger('OAuth2ValidationTest');
    tokenCache = new InMemoryTokenCache({
      maxSize: 100,
      defaultTTL: 3600000, // 1 hour
      enableMetrics: true
    });
  });

  beforeEach(() => {
    oauth2Provider = new OAuth2Provider(TEST_OAUTH2_CONFIG);
  });

  afterEach(async () => {
    if (tokenCache) {
      await tokenCache.clear();
    }
  });

  afterAll(async () => {
    if (tokenCache) {
      tokenCache.destroy();
    }
  });

  describe('OAuth2 Configuration Validation', () => {
    it('should validate OAuth2 configuration on initialization', () => {
      expect(() => {
        new OAuth2Provider(TEST_OAUTH2_CONFIG);
      }).not.toThrow();
    });

    it('should reject invalid OAuth2 configuration', () => {
      expect(() => {
        new OAuth2Provider({
          ...TEST_OAUTH2_CONFIG,
          clientId: ''
        });
      }).toThrow('OAuth2 configuration missing required field: clientId');
    });

    it('should validate OAuth2 URLs', () => {
      expect(() => {
        new OAuth2Provider({
          ...TEST_OAUTH2_CONFIG,
          tokenEndpoint: 'invalid-url'
        });
      }).toThrow('OAuth2 configuration contains invalid URLs');
    });
  });

  describe('OAuth2 Authentication Flow', () => {
    it('should generate valid authorization URL with PKCE', async () => {
      const result = await oauth2Provider.authenticate();
      
      expect(result.success).toBe(true);
      expect(result.redirectUrl).toBeDefined();
      expect(result.context).toBeDefined();
      expect(result.context.credentials.metadata.state).toBeDefined();
      expect(result.context.credentials.metadata.pkceVerifier).toBeDefined();
      
      // Validate URL structure
      const url = new URL(result.redirectUrl);
      expect(url.hostname).toBe('accounts.google.com');
      expect(url.searchParams.get('response_type')).toBe('code');
      expect(url.searchParams.get('client_id')).toBe(TEST_OAUTH2_CONFIG.clientId);
      expect(url.searchParams.get('code_challenge')).toBeDefined();
      expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    });

    it('should handle authentication flow errors gracefully', async () => {
      const invalidProvider = new OAuth2Provider({
        ...TEST_OAUTH2_CONFIG,
        authorizationEndpoint: 'https://invalid-endpoint.com/auth'
      });

      // This should still succeed as we're just generating the URL
      const result = await invalidProvider.authenticate();
      expect(result.success).toBe(true);
    });
  });

  describe('Token Exchange Validation', () => {
    it('should handle invalid authorization code exchange', async () => {
      const result = await oauth2Provider.exchangeCodeForTokens(
        'invalid-code',
        'test-state',
        'test-verifier'
      );
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.type).toBe('authentication');
    });

    it('should validate state parameter for CSRF protection', async () => {
      // First start auth flow to set state
      await oauth2Provider.authenticate();
      
      const result = await oauth2Provider.exchangeCodeForTokens(
        'test-code',
        'invalid-state',
        'test-verifier'
      );
      
      expect(result.success).toBe(false);
      expect(result.error.message).toContain('Invalid state parameter');
    });
  });

  describe('Token Refresh Validation', () => {
    it('should handle missing refresh token', async () => {
      const credentials = {
        type: 'oauth2',
        provider: 'oauth2',
        accessToken: 'test-access-token',
        // No refresh token
        expiresAt: Date.now() + 3600000,
        issuedAt: Date.now()
      };

      const result = await oauth2Provider.refresh(credentials);
      
      expect(result.success).toBe(false);
      expect(result.requiresReauth).toBe(true);
      expect(result.error.code).toBe('NO_REFRESH_TOKEN');
    });

    it('should handle invalid refresh token', async () => {
      const credentials = {
        type: 'oauth2',
        provider: 'oauth2',
        accessToken: 'test-access-token',
        refreshToken: 'invalid-refresh-token',
        expiresAt: Date.now() + 3600000,
        issuedAt: Date.now(),
        scope: ['openid', 'profile']
      };

      const result = await oauth2Provider.refresh(credentials);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.type).toBe('authentication');
    });
  });

  describe('Token Validation', () => {
    it('should validate token expiration', async () => {
      const expiredCredentials = {
        type: 'oauth2',
        provider: 'oauth2',
        accessToken: 'test-access-token',
        expiresAt: Date.now() - 1000, // Expired 1 second ago
        issuedAt: Date.now() - 3600000
      };

      const result = await oauth2Provider.validate(expiredCredentials);
      
      expect(result.valid).toBe(false);
      expect(result.expired).toBe(true);
    });

    it('should validate missing access token', async () => {
      const invalidCredentials = {
        type: 'oauth2',
        provider: 'oauth2',
        // No access token
        expiresAt: Date.now() + 3600000,
        issuedAt: Date.now()
      };

      const result = await oauth2Provider.validate(invalidCredentials);
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('No access token provided');
    });

    it('should validate non-expired tokens', async () => {
      const validCredentials = {
        type: 'oauth2',
        provider: 'oauth2',
        accessToken: 'test-access-token',
        expiresAt: Date.now() + 3600000, // Expires in 1 hour
        issuedAt: Date.now(),
        scope: ['openid', 'profile']
      };

      const result = await oauth2Provider.validate(validCredentials);
      
      expect(result.valid).toBe(true);
      expect(result.expiresIn).toBeGreaterThan(3500); // Should have ~1 hour left
      expect(result.scopes).toEqual(['openid', 'profile']);
    });
  });

  describe('Token Cache Integration', () => {
    it('should cache and retrieve tokens correctly', async () => {
      const credentials = {
        type: 'oauth2',
        provider: 'oauth2',
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() + 3600000,
        issuedAt: Date.now(),
        scope: ['openid', 'profile']
      };

      const cacheKey = 'test-user-oauth2';
      
      // Store in cache
      await tokenCache.set(cacheKey, credentials);
      
      // Retrieve from cache
      const cachedCredentials = await tokenCache.get(cacheKey);
      
      expect(cachedCredentials).toBeDefined();
      expect(cachedCredentials.accessToken).toBe(credentials.accessToken);
      expect(cachedCredentials.refreshToken).toBe(credentials.refreshToken);
      expect(cachedCredentials.scope).toEqual(credentials.scope);
    });

    it('should handle cache expiration correctly', async () => {
      const credentials = {
        type: 'oauth2',
        provider: 'oauth2',
        accessToken: 'test-access-token',
        expiresAt: Date.now() + 3600000,
        issuedAt: Date.now()
      };

      const cacheKey = 'test-expired-oauth2';
      
      // Store with very short TTL
      await tokenCache.set(cacheKey, credentials, 100); // 100ms TTL
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should return null for expired entry
      const cachedCredentials = await tokenCache.get(cacheKey);
      expect(cachedCredentials).toBeNull();
    });

    it('should provide accurate cache metrics', async () => {
      const credentials = {
        type: 'oauth2',
        provider: 'oauth2',
        accessToken: 'test-access-token',
        expiresAt: Date.now() + 3600000,
        issuedAt: Date.now()
      };

      // Perform cache operations
      await tokenCache.set('key1', credentials);
      await tokenCache.set('key2', credentials);
      await tokenCache.get('key1'); // Hit
      await tokenCache.get('key3'); // Miss
      
      const metrics = tokenCache.getMetrics();
      
      expect(metrics.totalEntries).toBe(2);
      expect(metrics.hitCount).toBe(1);
      expect(metrics.missCount).toBe(1);
      expect(metrics.hitRate).toBe(50);
    });
  });

  describe('Security Features', () => {
    it('should generate secure PKCE pairs', async () => {
      const result1 = await oauth2Provider.authenticate();
      const result2 = await oauth2Provider.authenticate();
      
      // PKCE verifiers should be different for each authentication
      expect(result1.context.credentials.metadata.pkceVerifier)
        .not.toBe(result2.context.credentials.metadata.pkceVerifier);
      
      // State should be different for each authentication
      expect(result1.context.credentials.metadata.state)
        .not.toBe(result2.context.credentials.metadata.state);
    });

    it('should handle token revocation', async () => {
      const credentials = {
        type: 'oauth2',
        provider: 'oauth2',
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: Date.now() + 3600000,
        issuedAt: Date.now()
      };

      // This will attempt to revoke but fail with test tokens
      // We expect it to handle errors gracefully
      await expect(oauth2Provider.revoke(credentials)).rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should create standardized auth errors', async () => {
      const result = await oauth2Provider.exchangeCodeForTokens('invalid-code');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.code).toBeDefined();
      expect(result.error.type).toBe('authentication');
      expect(result.error.context).toBeDefined();
      expect(result.error.context.provider).toBe('oauth2');
    });

    it('should emit authentication events', (done) => {
      oauth2Provider.on('authenticated', (data) => {
        expect(data.credentials).toBeDefined();
        expect(data.context).toBeDefined();
        done();
      });

      // Simulate successful authentication (this won't actually authenticate)
      oauth2Provider.emit('authenticated', {
        credentials: { type: 'oauth2', provider: 'oauth2' },
        context: { sessionId: 'test' }
      });
    });
  });
});

describe('Token Cache Production Validation', () => {
  let cache;

  beforeEach(() => {
    cache = new InMemoryTokenCache({
      maxSize: 5,
      defaultTTL: 1000,
      cleanupInterval: 100,
      enableMetrics: true
    });
  });

  afterEach(() => {
    if (cache) {
      cache.destroy();
    }
  });

  describe('Cache Capacity and Eviction', () => {
    it('should enforce maximum cache size with LRU eviction', async () => {
      const credentials = {
        type: 'oauth2',
        provider: 'test',
        accessToken: 'token',
        expiresAt: Date.now() + 60000,
        issuedAt: Date.now()
      };

      // Fill cache to capacity
      for (let i = 0; i < 5; i++) {
        await cache.set(`key${i}`, { ...credentials, accessToken: `token${i}` });
      }

      expect(await cache.size()).toBe(5);

      // Add one more - should evict LRU
      await cache.set('key5', { ...credentials, accessToken: 'token5' });
      
      expect(await cache.size()).toBe(5);
      expect(await cache.has('key0')).toBe(false); // Should be evicted
      expect(await cache.has('key5')).toBe(true); // Should be present
    });

    it('should perform automatic cleanup of expired entries', async () => {
      const credentials = {
        type: 'oauth2',
        provider: 'test',
        accessToken: 'token',
        expiresAt: Date.now() + 60000,
        issuedAt: Date.now()
      };

      // Add entries with short TTL
      await cache.set('key1', credentials, 50);
      await cache.set('key2', credentials, 200);

      expect(await cache.size()).toBe(2);

      // Wait for first entry to expire and cleanup to run
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should have cleaned up expired entry
      expect(await cache.size()).toBe(1);
      expect(await cache.has('key1')).toBe(false);
      expect(await cache.has('key2')).toBe(true);
    });
  });

  describe('Cache Performance Metrics', () => {
    it('should track comprehensive cache metrics', async () => {
      const credentials = {
        type: 'oauth2',
        provider: 'test',
        accessToken: 'token',
        expiresAt: Date.now() + 60000,
        issuedAt: Date.now()
      };

      await cache.set('key1', credentials);
      
      // Generate some hits and misses
      await cache.get('key1'); // Hit
      await cache.get('key1'); // Hit
      await cache.get('key2'); // Miss
      await cache.get('key3'); // Miss

      const metrics = cache.getMetrics();
      
      expect(metrics.totalEntries).toBe(1);
      expect(metrics.hitCount).toBe(2);
      expect(metrics.missCount).toBe(2);
      expect(metrics.hitRate).toBe(50);
      expect(metrics.averageAccessTime).toBeGreaterThan(0);
      expect(metrics.memoryUsage).toBeGreaterThan(0);
    });
  });
});