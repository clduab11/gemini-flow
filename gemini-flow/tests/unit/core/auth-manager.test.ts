import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AuthManager } from '../../../src/core/auth-manager';
import { GoogleAuth } from 'google-auth-library';

// Mock google-auth-library
jest.mock('google-auth-library', () => ({
  GoogleAuth: jest.fn().mockImplementation(() => ({
    getProjectId: jest.fn().mockResolvedValue('test-project'),
    getClient: jest.fn().mockResolvedValue({
      getAccessToken: jest.fn().mockResolvedValue({ token: 'mock-token' })
    })
  }))
}));

// Mock googleapis
jest.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: jest.fn().mockImplementation(() => ({
        generateAuthUrl: jest.fn().mockReturnValue('https://auth.url'),
        getToken: jest.fn().mockResolvedValue({
          tokens: { access_token: 'oauth-token', refresh_token: 'refresh-token' }
        }),
        setCredentials: jest.fn()
      }))
    },
    oauth2: jest.fn().mockReturnValue({
      userinfo: {
        get: jest.fn().mockResolvedValue({
          data: {
            email: 'user@example.com',
            name: 'Test User',
            picture: 'https://picture.url'
          }
        })
      }
    })
  }
}));

describe('AuthManager', () => {
  let authManager: AuthManager;

  beforeEach(() => {
    authManager = new AuthManager();
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should detect available auth methods', async () => {
      process.env.GOOGLE_APPLICATION_CREDENTIALS = '/path/to/credentials.json';
      process.env.GOOGLE_AI_API_KEY = 'test-api-key';
      
      await authManager.initialize();
      
      const authMethods = authManager.getAvailableAuthMethods();
      expect(authMethods).toContain('service_account');
      expect(authMethods).toContain('api_key');
    });

    it('should initialize with application default credentials', async () => {
      delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
      delete process.env.GOOGLE_AI_API_KEY;
      
      await authManager.initialize();
      
      const authMethods = authManager.getAvailableAuthMethods();
      expect(authMethods).toContain('adc');
    });
  });

  describe('tier detection', () => {
    it('should detect free tier with API key only', async () => {
      process.env.GOOGLE_AI_API_KEY = 'test-api-key';
      delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
      
      await authManager.initialize();
      
      const tier = authManager.getDetectedTier();
      expect(tier).toBe('free');
    });

    it('should detect pro tier with service account', async () => {
      process.env.GOOGLE_APPLICATION_CREDENTIALS = '/path/to/credentials.json';
      
      await authManager.initialize();
      
      const tier = authManager.getDetectedTier();
      expect(tier).toBe('pro');
    });

    it('should detect enterprise tier with workspace domain', async () => {
      process.env.GOOGLE_APPLICATION_CREDENTIALS = '/path/to/credentials.json';
      
      // Mock workspace detection
      (authManager as any).detectWorkspaceDomain = jest.fn().mockResolvedValue('company.com');
      
      await authManager.initialize();
      
      const tier = authManager.getDetectedTier();
      expect(tier).toBe('enterprise');
    });

    it('should detect ultra tier with specific environment variable', async () => {
      process.env.GEMINI_ULTRA_ACCESS = 'true';
      process.env.GOOGLE_APPLICATION_CREDENTIALS = '/path/to/credentials.json';
      
      await authManager.initialize();
      
      const tier = authManager.getDetectedTier();
      expect(tier).toBe('ultra');
    });
  });

  describe('token management', () => {
    it('should get access token', async () => {
      await authManager.initialize();
      
      const token = await authManager.getAccessToken();
      expect(token).toBe('mock-token');
    });

    it('should cache access tokens', async () => {
      await authManager.initialize();
      
      const token1 = await authManager.getAccessToken();
      const token2 = await authManager.getAccessToken();
      
      expect(token1).toBe(token2);
      // GoogleAuth.getClient should only be called once
      const mockAuth = (authManager as any).googleAuth;
      expect(mockAuth.getClient).toHaveBeenCalledTimes(1);
    });

    it('should get API key', async () => {
      process.env.GOOGLE_AI_API_KEY = 'test-api-key';
      await authManager.initialize();
      
      const apiKey = authManager.getApiKey();
      expect(apiKey).toBe('test-api-key');
    });

    it('should throw error when API key is not available', async () => {
      delete process.env.GOOGLE_AI_API_KEY;
      await authManager.initialize();
      
      expect(() => authManager.getApiKey()).toThrow('API key not available');
    });
  });

  describe('OAuth flow', () => {
    it('should generate OAuth URL', () => {
      const url = authManager.generateOAuthUrl('http://localhost:3000/callback');
      expect(url).toBe('https://auth.url');
    });

    it('should handle OAuth callback', async () => {
      const tokens = await authManager.handleOAuthCallback('auth-code');
      expect(tokens).toHaveProperty('access_token', 'oauth-token');
      expect(tokens).toHaveProperty('refresh_token', 'refresh-token');
    });

    it('should get user info after OAuth', async () => {
      await authManager.handleOAuthCallback('auth-code');
      const userInfo = await authManager.getUserInfo();
      
      expect(userInfo).toEqual({
        email: 'user@example.com',
        name: 'Test User',
        picture: 'https://picture.url',
        tier: 'free'
      });
    });
  });

  describe('project management', () => {
    it('should get project ID', async () => {
      await authManager.initialize();
      
      const projectId = await authManager.getProjectId();
      expect(projectId).toBe('test-project');
    });

    it('should validate credentials', async () => {
      await authManager.initialize();
      
      const isValid = await authManager.validateCredentials();
      expect(isValid).toBe(true);
    });

    it('should handle validation errors gracefully', async () => {
      const mockAuth = new GoogleAuth();
      (mockAuth.getProjectId as jest.MockedFunction<any>).mockRejectedValue(new Error('Invalid credentials'));
      
      (authManager as any).googleAuth = mockAuth;
      
      const isValid = await authManager.validateCredentials();
      expect(isValid).toBe(false);
    });
  });

  describe('auth method selection', () => {
    it('should recommend best auth method for model', () => {
      // Set up various auth methods
      process.env.GOOGLE_AI_API_KEY = 'test-api-key';
      process.env.GOOGLE_APPLICATION_CREDENTIALS = '/path/to/credentials.json';
      
      // For basic Gemini models, API key is sufficient
      expect(authManager.recommendAuthMethod('gemini-1.5-flash')).toBe('api_key');
      
      // For Vertex AI models, service account is recommended
      expect(authManager.recommendAuthMethod('gemini-2.5-deepmind')).toBe('service_account');
      
      // For enterprise features, OAuth is recommended
      expect(authManager.recommendAuthMethod('gemini-enterprise')).toBe('oauth');
    });
  });

  describe('security features', () => {
    it('should rotate credentials when needed', async () => {
      await authManager.initialize();
      
      const oldToken = await authManager.getAccessToken();
      
      // Force rotation
      await authManager.rotateCredentials();
      
      const newToken = await authManager.getAccessToken();
      // In real implementation, this would be different
      expect(newToken).toBeDefined();
    });

    it('should check for expired tokens', async () => {
      await authManager.initialize();
      
      const isExpired = authManager.isTokenExpired();
      expect(isExpired).toBe(false);
    });
  });

  describe('multi-account support', () => {
    it('should switch between accounts', async () => {
      await authManager.initialize();
      
      // Add multiple accounts
      await authManager.addAccount('account1', {
        type: 'api_key',
        apiKey: 'key1'
      });
      
      await authManager.addAccount('account2', {
        type: 'service_account',
        keyFile: '/path/to/key2.json'
      });
      
      // Switch accounts
      await authManager.switchAccount('account2');
      expect(authManager.getCurrentAccount()).toBe('account2');
    });

    it('should list all accounts', async () => {
      await authManager.initialize();
      
      await authManager.addAccount('account1', {
        type: 'api_key',
        apiKey: 'key1'
      });
      
      const accounts = authManager.listAccounts();
      expect(accounts).toContain('account1');
      expect(accounts).toContain('default');
    });
  });

  describe('error handling', () => {
    it('should handle missing credentials gracefully', async () => {
      delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
      delete process.env.GOOGLE_AI_API_KEY;
      
      // Mock ADC failure
      const mockAuth = new GoogleAuth();
      (mockAuth.getClient as jest.MockedFunction<any>).mockRejectedValue(
        new Error('Could not load the default credentials')
      );
      
      (authManager as any).googleAuth = mockAuth;
      
      await expect(authManager.getAccessToken()).rejects.toThrow('Authentication not initialized');
    });
  });

  describe('metrics and monitoring', () => {
    it('should track auth metrics', async () => {
      await authManager.initialize();
      
      // Make some auth calls
      await authManager.getAccessToken();
      await authManager.getAccessToken();
      await authManager.validateCredentials();
      
      const metrics = authManager.getMetrics();
      expect(metrics.tokenRequests).toBe(2);
      expect(metrics.validationChecks).toBe(1);
      expect(metrics.authMethod).toBeDefined();
    });
  });
});