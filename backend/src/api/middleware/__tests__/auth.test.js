/**
 * Tests for Authentication Middleware
 * 
 * Tests cover:
 * - API key validation at startup
 * - Production enforcement
 * - Key length validation
 * - Multiple API keys with scopes
 * - API key hashing
 * - Authentication middleware behavior
 */

import { jest } from '@jest/globals';

// Mock environment variables before importing auth module
const originalEnv = process.env;

describe('Authentication Middleware', () => {
  let authenticate, validateApiKeyConfig, hashApiKey;

  beforeEach(async () => {
    // Reset modules to get fresh import with new env vars
    jest.resetModules();
    
    // Clear environment
    process.env = { ...originalEnv };
    delete process.env.NODE_ENV;
    delete process.env.API_KEY;
    delete process.env.API_KEY_ADMIN;
    delete process.env.API_KEY_TUI;
    delete process.env.API_KEY_BROWSER;
    delete process.env.API_KEY_READONLY;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('validateApiKeyConfig', () => {
    test('should pass in development without API_KEY', async () => {
      process.env.NODE_ENV = 'development';
      
      const auth = await import('../auth.js');
      validateApiKeyConfig = auth.validateApiKeyConfig;

      expect(() => validateApiKeyConfig()).not.toThrow();
    });

    test('should throw error in production without API_KEY', async () => {
      process.env.NODE_ENV = 'production';
      
      const auth = await import('../auth.js');
      validateApiKeyConfig = auth.validateApiKeyConfig;

      expect(() => validateApiKeyConfig()).toThrow('API_KEY environment variable required in production');
    });

    test('should warn about short API_KEY in development', async () => {
      process.env.NODE_ENV = 'development';
      process.env.API_KEY = 'short-key';
      
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const auth = await import('../auth.js');
      validateApiKeyConfig = auth.validateApiKeyConfig;
      
      validateApiKeyConfig();
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('WARNING: API_KEY should be at least 32 characters')
      );
      
      consoleWarnSpy.mockRestore();
    });

    test('should throw error for short API_KEY in production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.API_KEY = 'short-key';
      
      const auth = await import('../auth.js');
      validateApiKeyConfig = auth.validateApiKeyConfig;

      expect(() => validateApiKeyConfig()).toThrow('API_KEY must be at least 32 characters in production');
    });

    test('should pass with valid long API_KEY in production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.API_KEY = 'a'.repeat(32); // 32 character key
      
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const auth = await import('../auth.js');
      validateApiKeyConfig = auth.validateApiKeyConfig;
      
      expect(() => validateApiKeyConfig()).not.toThrow();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('API_KEY configured')
      );
      
      consoleLogSpy.mockRestore();
    });

    test('should validate multiple scoped API keys', async () => {
      process.env.NODE_ENV = 'production';
      process.env.API_KEY = 'a'.repeat(32);
      process.env.API_KEY_ADMIN = 'b'.repeat(32);
      process.env.API_KEY_TUI = 'c'.repeat(32);
      
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const auth = await import('../auth.js');
      validateApiKeyConfig = auth.validateApiKeyConfig;
      
      expect(() => validateApiKeyConfig()).not.toThrow();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('3 scoped API key(s) configured')
      );
      
      consoleLogSpy.mockRestore();
    });

    test('should reject short scoped API keys in production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.API_KEY = 'a'.repeat(32);
      process.env.API_KEY_ADMIN = 'short'; // Too short
      
      const auth = await import('../auth.js');
      validateApiKeyConfig = auth.validateApiKeyConfig;

      expect(() => validateApiKeyConfig()).toThrow('must be at least 32 characters in production');
    });
  });

  describe('hashApiKey', () => {
    test('should hash API key consistently', async () => {
      const auth = await import('../auth.js');
      const hashApiKey = auth.default.hashApiKey;

      const key = 'test-api-key-12345';
      const hash1 = hashApiKey(key);
      const hash2 = hashApiKey(key);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(8);
    });

    test('should produce different hashes for different keys', async () => {
      const auth = await import('../auth.js');
      const hashApiKey = auth.default.hashApiKey;

      const hash1 = hashApiKey('key1');
      const hash2 = hashApiKey('key2');
      
      expect(hash1).not.toBe(hash2);
    });

    test('should return "none" for null/undefined key', async () => {
      const auth = await import('../auth.js');
      const hashApiKey = auth.default.hashApiKey;

      expect(hashApiKey(null)).toBe('none');
      expect(hashApiKey(undefined)).toBe('none');
      expect(hashApiKey('')).toBe('none');
    });
  });

  describe('authenticate middleware', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
      mockReq = {
        headers: {}
      };
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      mockNext = jest.fn();
    });

    test('should reject requests without API key when required', async () => {
      process.env.API_KEY = 'a'.repeat(32);
      
      const auth = await import('../auth.js');
      authenticate = auth.authenticate;

      const middleware = authenticate({ required: true });
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'MISSING_API_KEY',
          message: expect.any(String)
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('should allow requests without API key when not required', async () => {
      process.env.API_KEY = 'a'.repeat(32);
      
      const auth = await import('../auth.js');
      authenticate = auth.authenticate;

      const middleware = authenticate({ required: false });
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('should reject invalid API key', async () => {
      process.env.API_KEY = 'a'.repeat(32);
      
      const auth = await import('../auth.js');
      authenticate = auth.authenticate;

      mockReq.headers['x-api-key'] = 'invalid-key';
      
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const middleware = authenticate({ required: true });
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INVALID_API_KEY',
          message: expect.any(String)
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();
      
      consoleWarnSpy.mockRestore();
    });

    test('should accept valid default API key', async () => {
      const validKey = 'a'.repeat(32);
      process.env.API_KEY = validKey;
      
      const auth = await import('../auth.js');
      authenticate = auth.authenticate;

      mockReq.headers['x-api-key'] = validKey;
      
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const middleware = authenticate({ required: true });
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockReq.auth).toBeDefined();
      expect(mockReq.auth.scope).toBe('default');
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Authentication successful')
      );
      
      consoleLogSpy.mockRestore();
    });

    test('should accept valid scoped API key', async () => {
      process.env.API_KEY = 'a'.repeat(32);
      const adminKey = 'b'.repeat(32);
      process.env.API_KEY_ADMIN = adminKey;
      
      const auth = await import('../auth.js');
      authenticate = auth.authenticate;

      mockReq.headers['x-api-key'] = adminKey;
      
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const middleware = authenticate({ required: true });
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.auth).toBeDefined();
      expect(mockReq.auth.scope).toBe('admin');
      expect(mockReq.auth.clientId).toBe('Admin Key');
      
      consoleLogSpy.mockRestore();
    });

    test('should enforce scope restrictions', async () => {
      process.env.API_KEY = 'a'.repeat(32);
      const readonlyKey = 'r'.repeat(32);
      process.env.API_KEY_READONLY = readonlyKey;
      
      const auth = await import('../auth.js');
      authenticate = auth.authenticate;

      mockReq.headers['x-api-key'] = readonlyKey;
      
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      const middleware = authenticate({ required: true, scopes: ['admin'] });
      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: expect.any(String),
          requiredScopes: ['admin'],
          currentScope: 'readonly'
        }
      });
      expect(mockNext).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();
      
      consoleWarnSpy.mockRestore();
    });

    test('should allow access with matching scope', async () => {
      process.env.API_KEY = 'a'.repeat(32);
      const adminKey = 'b'.repeat(32);
      process.env.API_KEY_ADMIN = adminKey;
      
      const auth = await import('../auth.js');
      authenticate = auth.authenticate;

      mockReq.headers['x-api-key'] = adminKey;
      
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const middleware = authenticate({ required: true, scopes: ['admin', 'tui'] });
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.auth.scope).toBe('admin');
      
      consoleLogSpy.mockRestore();
    });

    test('should hash API key in auth object', async () => {
      const validKey = 'a'.repeat(32);
      process.env.API_KEY = validKey;
      
      const auth = await import('../auth.js');
      authenticate = auth.authenticate;
      const hashApiKey = auth.default.hashApiKey;

      mockReq.headers['x-api-key'] = validKey;
      
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const middleware = authenticate({ required: true });
      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.auth.apiKeyHash).toBe(hashApiKey(validKey));
      expect(mockReq.auth.apiKeyHash).not.toBe(validKey);
      
      consoleLogSpy.mockRestore();
    });
  });

  describe('authenticateDev middleware', () => {
    test('should be optional in development', async () => {
      process.env.NODE_ENV = 'development';
      process.env.API_KEY = 'a'.repeat(32);
      
      const auth = await import('../auth.js');
      const authenticateDev = auth.authenticateDev;

      const mockReq = { headers: {} };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      const mockNext = jest.fn();

      const middleware = authenticateDev({ required: true });
      middleware(mockReq, mockRes, mockNext);

      // Should pass even without API key in development
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    test('should be required in production', async () => {
      process.env.NODE_ENV = 'production';
      process.env.API_KEY = 'a'.repeat(32);
      
      const auth = await import('../auth.js');
      const authenticateDev = auth.authenticateDev;

      const mockReq = { headers: {} };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      const mockNext = jest.fn();

      const middleware = authenticateDev({ required: true });
      middleware(mockReq, mockRes, mockNext);

      // Should require API key in production
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
