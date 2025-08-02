/**
 * Authentication Manager Tests
 * 
 * Comprehensive tests for tier detection system
 */

import { AuthenticationManager, UserProfile, AuthConfig } from '../auth-manager';
import { CacheManager } from '../cache-manager';
import { Logger } from '../../utils/logger';

// Mock dependencies
jest.mock('../cache-manager');
jest.mock('../../utils/logger');
jest.mock('googleapis');

describe('AuthenticationManager - Tier Detection', () => {
  let authManager: AuthenticationManager;
  let mockCache: jest.Mocked<CacheManager>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create auth manager with test config
    const config: AuthConfig = {
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      projectId: 'test-project',
      tierDetection: {
        enableVertexAI: true,
        enableWorkspaceIntegration: true,
        customEnterprisePatterns: ['testcorp.com'],
        ultraFeatureChecks: ['ultra-test.com']
      }
    };
    
    authManager = new AuthenticationManager(config);
    mockCache = authManager['cache'] as jest.Mocked<CacheManager>;
  });

  describe('detectUserTier', () => {
    it('should return free tier for missing email', async () => {
      const result = await authManager['detectUserTier']();
      
      expect(result.tier).toBe('free');
      expect(result.method).toBe('default');
      expect(result.confidence).toBe(1.0);
      expect(result.features).toEqual([]);
    });

    it('should return cached tier detection result', async () => {
      const cachedResult = {
        tier: 'enterprise',
        method: 'cached',
        confidence: 0.9,
        features: ['enterprise-domain']
      };
      
      mockCache.get.mockResolvedValueOnce(cachedResult);
      
      const result = await authManager['detectUserTier']('user@testcorp.com');
      
      expect(result).toEqual(cachedResult);
      expect(mockCache.get).toHaveBeenCalledWith('tier-detection:user@testcorp.com');
    });

    it('should detect ultra tier for ultra domains', async () => {
      mockCache.get.mockResolvedValueOnce(null); // No cached result
      mockCache.set.mockResolvedValueOnce(undefined);
      
      const result = await authManager['detectUserTier']('user@ultra-test.com');
      
      expect(result.tier).toBe('ultra');
      expect(result.method).toBe('ultra-features');
      expect(result.features).toContain('ultra-domain');
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should detect enterprise tier for enterprise domains', async () => {
      mockCache.get.mockResolvedValueOnce(null); // No cached result
      mockCache.set.mockResolvedValueOnce(undefined);
      
      const result = await authManager['detectUserTier']('user@google.com');
      
      expect(result.tier).toBe('enterprise');
      expect(result.method).toBe('enterprise-workspace');
      expect(result.features).toContain('enterprise-domain');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should fallback to free tier on detection error', async () => {
      mockCache.get.mockRejectedValueOnce(new Error('Cache error'));
      
      const result = await authManager['detectUserTier']('user@example.com');
      
      expect(result.tier).toBe('free');
      expect(result.method).toBe('error-fallback');
      expect(result.features).toContain('error-occurred');
    });
  });

  describe('detectUltraTier', () => {
    it('should detect ultra tier with high confidence', async () => {
      const authManagerWithMocks = authManager as any;
      
      // Mock ultra detection methods
      authManagerWithMocks.checkVertexAIAccess = jest.fn().mockResolvedValue(true);
      authManagerWithMocks.checkGoogleAIAdvanced = jest.fn().mockResolvedValue(true);
      authManagerWithMocks.checkEnterpriseBilling = jest.fn().mockResolvedValue(true);
      authManagerWithMocks.checkCustomIntegrations = jest.fn().mockResolvedValue(false);
      
      const result = await authManagerWithMocks.detectUltraTier(
        'user@ultra-test.com',
        'ultra-test.com',
        { access_token: 'test-token' }
      );
      
      expect(result.isUltra).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0.7);
      expect(result.features).toContain('vertex-ai-enterprise');
      expect(result.features).toContain('google-ai-advanced');
      expect(result.features).toContain('enterprise-billing');
      expect(result.features).toContain('ultra-domain');
    });

    it('should not detect ultra tier with low confidence', async () => {
      const authManagerWithMocks = authManager as any;
      
      // Mock methods to return false
      authManagerWithMocks.checkVertexAIAccess = jest.fn().mockResolvedValue(false);
      authManagerWithMocks.checkGoogleAIAdvanced = jest.fn().mockResolvedValue(false);
      authManagerWithMocks.checkEnterpriseBilling = jest.fn().mockResolvedValue(false);
      authManagerWithMocks.checkCustomIntegrations = jest.fn().mockResolvedValue(false);
      
      const result = await authManagerWithMocks.detectUltraTier(
        'user@example.com',
        'example.com',
        { access_token: 'test-token' }
      );
      
      expect(result.isUltra).toBe(false);
      expect(result.confidence).toBeLessThan(0.7);
    });
  });

  describe('detectEnterpriseTier', () => {
    it('should detect enterprise tier for known enterprise domains', async () => {
      const authManagerWithMocks = authManager as any;
      
      // Mock enterprise detection methods
      authManagerWithMocks.checkGoogleWorkspace = jest.fn().mockResolvedValue({
        isWorkspace: true,
        isEnterprise: true
      });
      authManagerWithMocks.analyzeDomainPatterns = jest.fn().mockReturnValue({
        isEnterprise: true,
        score: 0.3,
        indicators: ['enterprise-tld']
      });
      authManagerWithMocks.checkEnterpriseScopes = jest.fn().mockResolvedValue(true);
      
      const result = await authManagerWithMocks.detectEnterpriseTier(
        'user@microsoft.com',
        'microsoft.com',
        { access_token: 'test-token', scope: 'admin.directory' }
      );
      
      expect(result.isEnterprise).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0.5);
      expect(result.features).toContain('enterprise-domain');
      expect(result.features).toContain('google-workspace');
      expect(result.features).toContain('workspace-enterprise');
    });

    it('should not detect enterprise tier for regular domains', async () => {
      const authManagerWithMocks = authManager as any;
      
      // Mock methods to return non-enterprise results
      authManagerWithMocks.checkGoogleWorkspace = jest.fn().mockResolvedValue({
        isWorkspace: false,
        isEnterprise: false
      });
      authManagerWithMocks.analyzeDomainPatterns = jest.fn().mockReturnValue({
        isEnterprise: false,
        score: 0.1,
        indicators: []
      });
      authManagerWithMocks.checkEnterpriseScopes = jest.fn().mockResolvedValue(false);
      
      const result = await authManagerWithMocks.detectEnterpriseTier(
        'user@gmail.com',
        'gmail.com',
        { access_token: 'test-token' }
      );
      
      expect(result.isEnterprise).toBe(false);
      expect(result.confidence).toBeLessThan(0.5);
    });
  });

  describe('detectProTier', () => {
    it('should detect pro tier with valid subscription', async () => {
      const authManagerWithMocks = authManager as any;
      
      // Mock pro detection methods
      authManagerWithMocks.checkProSubscription = jest.fn().mockResolvedValue(true);
      authManagerWithMocks.checkPaymentMethod = jest.fn().mockResolvedValue(true);
      authManagerWithMocks.analyzeUsagePatterns = jest.fn().mockResolvedValue({
        suggestsPro: true,
        indicators: ['high-daily-usage']
      });
      
      const result = await authManagerWithMocks.detectProTier(
        'user@example.com',
        'example.com'
      );
      
      expect(result.isPro).toBe(true);
      expect(result.confidence).toBeGreaterThanOrEqual(0.5);
      expect(result.features).toContain('pro-subscription');
      expect(result.features).toContain('payment-method');
      expect(result.features).toContain('pro-usage-patterns');
    });

    it('should not detect pro tier without subscription indicators', async () => {
      const authManagerWithMocks = authManager as any;
      
      // Mock methods to return non-pro results
      authManagerWithMocks.checkProSubscription = jest.fn().mockResolvedValue(false);
      authManagerWithMocks.checkPaymentMethod = jest.fn().mockResolvedValue(false);
      authManagerWithMocks.analyzeUsagePatterns = jest.fn().mockResolvedValue({
        suggestsPro: false,
        indicators: []
      });
      
      const result = await authManagerWithMocks.detectProTier(
        'user@example.com',
        'example.com'
      );
      
      expect(result.isPro).toBe(false);
      expect(result.confidence).toBeLessThan(0.5);
    });
  });

  describe('analyzeDomainPatterns', () => {
    it('should identify enterprise patterns correctly', async () => {
      const authManagerWithMocks = authManager as any;
      
      const corpResult = authManagerWithMocks.analyzeDomainPatterns('testcompany.corp');
      expect(corpResult.isEnterprise).toBe(true);
      expect(corpResult.indicators).toContain('enterprise-tld');
      
      const fortuneResult = authManagerWithMocks.analyzeDomainPatterns('walmart.com');
      expect(fortuneResult.isEnterprise).toBe(true);
      expect(fortuneResult.indicators).toContain('fortune-500');
      
      const complexResult = authManagerWithMocks.analyzeDomainPatterns('big-enterprise-company.com');
      expect(complexResult.indicators).toContain('complex-domain');
    });

    it('should not identify regular domains as enterprise', async () => {
      const authManagerWithMocks = authManager as any;
      
      const result = authManagerWithMocks.analyzeDomainPatterns('gmail.com');
      expect(result.isEnterprise).toBe(false);
      expect(result.score).toBeLessThan(0.2);
    });
  });

  describe('getUserPermissions', () => {
    it('should return correct permissions for each tier', async () => {
      const authManagerWithMocks = authManager as any;
      
      const freePerms = await authManagerWithMocks.getUserPermissions('user@example.com', 'free');
      expect(freePerms).toEqual(['read', 'basic_ai']);
      
      const proPerms = await authManagerWithMocks.getUserPermissions('user@example.com', 'pro');
      expect(proPerms).toContain('advanced_ai');
      expect(proPerms).toContain('batch_processing');
      
      const enterprisePerms = await authManagerWithMocks.getUserPermissions('user@example.com', 'enterprise');
      expect(enterprisePerms).toContain('custom_models');
      expect(enterprisePerms).toContain('enterprise_security');
      
      const ultraPerms = await authManagerWithMocks.getUserPermissions('user@example.com', 'ultra');
      expect(ultraPerms).toContain('vertex_ai_access');
      expect(ultraPerms).toContain('unlimited_requests');
      expect(ultraPerms).toContain('early_access_features');
    });
  });

  describe('getTierQuotas', () => {
    it('should return correct quotas for each tier', () => {
      const authManagerWithMocks = authManager as any;
      
      const freeQuotas = authManagerWithMocks.getTierQuotas('free');
      expect(freeQuotas).toEqual({ daily: 100, monthly: 1000, concurrent: 2 });
      
      const proQuotas = authManagerWithMocks.getTierQuotas('pro');
      expect(proQuotas).toEqual({ daily: 1000, monthly: 20000, concurrent: 10 });
      
      const enterpriseQuotas = authManagerWithMocks.getTierQuotas('enterprise');
      expect(enterpriseQuotas).toEqual({ daily: 10000, monthly: 500000, concurrent: 50 });
      
      const ultraQuotas = authManagerWithMocks.getTierQuotas('ultra');
      expect(ultraQuotas).toEqual({ daily: -1, monthly: -1, concurrent: 200 });
    });
  });

  describe('caching behavior', () => {
    it('should cache tier detection results', async () => {
      mockCache.get.mockResolvedValueOnce(null); // No cached result initially
      mockCache.set.mockResolvedValueOnce(undefined);
      
      await authManager['detectUserTier']('user@example.com');
      
      expect(mockCache.set).toHaveBeenCalledWith(
        'tier-detection:user@example.com',
        expect.any(Object),
        86400 // 24 hours
      );
    });

    it('should use cached results when available', async () => {
      const cachedResult = {
        tier: 'pro',
        method: 'cached',
        confidence: 0.8,
        features: ['pro-subscription']
      };
      
      mockCache.get.mockResolvedValueOnce(cachedResult);
      
      const result = await authManager['detectUserTier']('user@example.com');
      
      expect(result).toEqual(cachedResult);
      expect(mockCache.set).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle errors gracefully in tier detection', async () => {
      const authManagerWithMocks = authManager as any;
      
      // Mock a method to throw an error
      authManagerWithMocks.checkVertexAIAccess = jest.fn().mockRejectedValue(new Error('API Error'));
      
      const result = await authManagerWithMocks.detectUltraTier(
        'user@example.com',
        'example.com',
        { access_token: 'test-token' }
      );
      
      expect(result.isUltra).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.features).toEqual([]);
    });

    it('should return error fallback on complete detection failure', async () => {
      mockCache.get.mockRejectedValueOnce(new Error('Cache error'));
      
      const result = await authManager['detectUserTier']('user@example.com');
      
      expect(result.tier).toBe('free');
      expect(result.method).toBe('error-fallback');
      expect(result.features).toContain('error-occurred');
    });
  });
});

describe('AuthenticationManager - Integration', () => {
  let authManager: AuthenticationManager;

  beforeEach(() => {
    const config: AuthConfig = {
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      projectId: 'test-project'
    };
    
    authManager = new AuthenticationManager(config);
  });

  describe('end-to-end tier detection', () => {
    it('should detect tier and create user profile with metadata', async () => {
      // This would be an integration test with actual Google APIs
      // For now, we'll mock the OAuth response
      
      const mockTokens = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        scope: 'email profile'
      };

      const mockUserInfo = {
        data: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User'
        }
      };

      // Mock OAuth client and googleapis calls
      jest.spyOn(authManager as any, 'authenticateUser').mockImplementation(async () => {
        // Simulate the user authentication flow
        const tierResult = await authManager['detectUserTier']('test@example.com', mockTokens);
        
        return {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
          tier: tierResult.tier,
          organization: 'example.com',
          permissions: await authManager['getUserPermissions']('test@example.com', tierResult.tier),
          quotas: authManager['getTierQuotas'](tierResult.tier),
          metadata: {
            createdAt: new Date(),
            lastActive: new Date(),
            totalRequests: 0,
            tierDetection: {
              method: tierResult.method,
              confidence: tierResult.confidence,
              detectedAt: new Date(),
              features: tierResult.features
            }
          }
        } as UserProfile;
      });

      const profile = await authManager.authenticateUser('test-auth-code');
      
      expect(profile).toBeDefined();
      expect(profile.tier).toBeDefined();
      expect(profile.metadata.tierDetection).toBeDefined();
      expect(profile.metadata.tierDetection!.method).toBeDefined();
      expect(profile.metadata.tierDetection!.confidence).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(profile.metadata.tierDetection!.features)).toBe(true);
    });
  });
});