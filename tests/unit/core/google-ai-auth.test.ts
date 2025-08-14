/**
 * Google AI Authentication Tests
 * 
 * Test suite for Google AI Studio API key authentication
 * providing simple authentication for Gemini CLI parity
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { GoogleAIAuth } from '../../../src/core/google-ai-auth';
import * as fs from 'fs';
import * as path from 'path';

// Mock filesystem operations
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn()
}));

jest.mock('path', () => ({
  join: jest.fn(),
  resolve: jest.fn(),
  dirname: jest.fn()
}));

const mockFs = fs as jest.Mocked<typeof fs>;
const mockPath = path as jest.Mocked<typeof path>;

describe('GoogleAIAuth', () => {
  let auth: GoogleAIAuth;
  let originalEnv: typeof process.env;

  beforeEach(() => {
    // Store original environment
    originalEnv = { ...process.env };
    
    // Clear environment variables
    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_AI_API_KEY;
    delete process.env.GOOGLE_API_KEY;
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup default mock behavior
    mockPath.join.mockImplementation((...args) => args.join('/'));
    mockPath.resolve.mockImplementation((...args) => args.join('/'));
    mockFs.existsSync.mockReturnValue(false);
    mockFs.readFileSync.mockReturnValue('');
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    jest.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with default options', () => {
      auth = new GoogleAIAuth();
      expect(auth).toBeDefined();
    });

    it('should initialize with custom options', () => {
      const options = {
        apiKey: 'test-key',
        configPath: '/custom/config'
      };
      
      auth = new GoogleAIAuth(options);
      expect(auth).toBeDefined();
    });
  });

  describe('API key detection', () => {
    it('should detect API key from GEMINI_API_KEY environment variable', () => {
      process.env.GEMINI_API_KEY = 'env-key-gemini';
      
      auth = new GoogleAIAuth();
      
      expect(auth.isAuthenticated()).toBe(true);
      expect(auth.getApiKey()).toBe('env-key-gemini');
    });

    it('should detect API key from GOOGLE_AI_API_KEY environment variable', () => {
      process.env.GOOGLE_AI_API_KEY = 'env-key-google-ai';
      
      auth = new GoogleAIAuth();
      
      expect(auth.isAuthenticated()).toBe(true);
      expect(auth.getApiKey()).toBe('env-key-google-ai');
    });

    it('should detect API key from GOOGLE_API_KEY environment variable', () => {
      process.env.GOOGLE_API_KEY = 'env-key-google';
      
      auth = new GoogleAIAuth();
      
      expect(auth.isAuthenticated()).toBe(true);
      expect(auth.getApiKey()).toBe('env-key-google');
    });

    it('should prioritize GEMINI_API_KEY over other environment variables', () => {
      process.env.GEMINI_API_KEY = 'gemini-key';
      process.env.GOOGLE_AI_API_KEY = 'google-ai-key';
      process.env.GOOGLE_API_KEY = 'google-key';
      
      auth = new GoogleAIAuth();
      
      expect(auth.getApiKey()).toBe('gemini-key');
    });

    it('should load API key from constructor option', () => {
      auth = new GoogleAIAuth({ apiKey: 'constructor-key' });
      
      expect(auth.isAuthenticated()).toBe(true);
      expect(auth.getApiKey()).toBe('constructor-key');
    });

    it('should prioritize constructor option over environment variables', () => {
      process.env.GEMINI_API_KEY = 'env-key';
      
      auth = new GoogleAIAuth({ apiKey: 'constructor-key' });
      
      expect(auth.getApiKey()).toBe('constructor-key');
    });
  });

  describe('config file handling', () => {
    it('should load API key from config file', () => {
      const configContent = JSON.stringify({
        apiKey: 'config-file-key',
        model: 'gemini-1.5-flash'
      });
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(configContent);
      
      auth = new GoogleAIAuth({ configPath: '/test/config.json' });
      
      expect(auth.isAuthenticated()).toBe(true);
      expect(auth.getApiKey()).toBe('config-file-key');
    });

    it('should handle missing config file gracefully', () => {
      mockFs.existsSync.mockReturnValue(false);
      
      auth = new GoogleAIAuth({ configPath: '/nonexistent/config.json' });
      
      expect(auth.isAuthenticated()).toBe(false);
      expect(auth.getApiKey()).toBeNull();
    });

    it('should handle malformed config file', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('invalid json');
      
      auth = new GoogleAIAuth({ configPath: '/test/config.json' });
      
      expect(auth.isAuthenticated()).toBe(false);
      expect(auth.getApiKey()).toBeNull();
    });

    it('should use default config path when not specified', () => {
      const homeDir = '/home/user';
      process.env.HOME = homeDir;
      
      mockPath.join.mockReturnValue(`${homeDir}/.gemini-flow/config.json`);
      mockFs.existsSync.mockReturnValue(false);
      
      auth = new GoogleAIAuth();
      
      expect(mockPath.join).toHaveBeenCalledWith(homeDir, '.gemini-flow', 'config.json');
    });
  });

  describe('API key validation', () => {
    it('should validate API key format', () => {
      // Valid API key format (starts with AIza)
      auth = new GoogleAIAuth({ apiKey: 'AIzaSyDummy1234567890abcdefghijklmnop' });
      expect(auth.isAuthenticated()).toBe(true);
      expect(auth.isValidApiKey()).toBe(true);
    });

    it('should reject invalid API key format', () => {
      // Invalid API key format
      auth = new GoogleAIAuth({ apiKey: 'invalid-key' });
      expect(auth.isAuthenticated()).toBe(true); // Has key but invalid format
      expect(auth.isValidApiKey()).toBe(false);
    });

    it('should reject empty API key', () => {
      auth = new GoogleAIAuth({ apiKey: '' });
      expect(auth.isAuthenticated()).toBe(false);
      expect(auth.isValidApiKey()).toBe(false);
    });

    it('should reject null API key', () => {
      auth = new GoogleAIAuth();
      expect(auth.isAuthenticated()).toBe(false);
      expect(auth.isValidApiKey()).toBe(false);
    });
  });

  describe('setApiKey()', () => {
    beforeEach(() => {
      auth = new GoogleAIAuth();
    });

    it('should set valid API key', () => {
      const validKey = 'AIzaSyDummy1234567890abcdefghijklmnop';
      
      const result = auth.setApiKey(validKey);
      
      expect(result).toBe(true);
      expect(auth.getApiKey()).toBe(validKey);
      expect(auth.isAuthenticated()).toBe(true);
    });

    it('should reject invalid API key format', () => {
      const invalidKey = 'invalid-key';
      
      const result = auth.setApiKey(invalidKey);
      
      expect(result).toBe(false);
      expect(auth.getApiKey()).toBeNull();
      expect(auth.isAuthenticated()).toBe(false);
    });

    it('should clear API key with null', () => {
      auth.setApiKey('AIzaSyDummy1234567890abcdefghijklmnop');
      expect(auth.isAuthenticated()).toBe(true);
      
      auth.setApiKey(null);
      
      expect(auth.getApiKey()).toBeNull();
      expect(auth.isAuthenticated()).toBe(false);
    });
  });

  describe('saveConfig()', () => {
    beforeEach(() => {
      auth = new GoogleAIAuth();
      mockFs.mkdirSync.mockImplementation();
      mockFs.writeFileSync.mockImplementation();
    });

    it('should save config to file', async () => {
      const configPath = '/test/.gemini-flow/config.json';
      auth.setApiKey('AIzaSyDummy1234567890abcdefghijklmnop');
      
      await auth.saveConfig(configPath);
      
      expect(mockFs.mkdirSync).toHaveBeenCalled();
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        configPath,
        expect.stringContaining('AIzaSyDummy1234567890abcdefghijklmnop')
      );
    });

    it('should handle directory creation errors', async () => {
      mockFs.mkdirSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });
      
      auth.setApiKey('AIzaSyDummy1234567890abcdefghijklmnop');
      
      await expect(auth.saveConfig('/test/config.json')).rejects.toThrow('Permission denied');
    });
  });

  describe('loadConfig()', () => {
    beforeEach(() => {
      auth = new GoogleAIAuth();
    });

    it('should load config from file', () => {
      const configContent = JSON.stringify({
        apiKey: 'AIzaSyConfigKey1234567890abcdefghijk',
        model: 'gemini-1.5-pro'
      });
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(configContent);
      
      const result = auth.loadConfig('/test/config.json');
      
      expect(result).toBe(true);
      expect(auth.getApiKey()).toBe('AIzaSyConfigKey1234567890abcdefghijk');
    });

    it('should return false for missing config file', () => {
      mockFs.existsSync.mockReturnValue(false);
      
      const result = auth.loadConfig('/nonexistent/config.json');
      
      expect(result).toBe(false);
      expect(auth.isAuthenticated()).toBe(false);
    });
  });

  describe('clearAuth()', () => {
    it('should clear authentication', () => {
      auth = new GoogleAIAuth({ apiKey: 'AIzaSyDummy1234567890abcdefghijklmnop' });
      expect(auth.isAuthenticated()).toBe(true);
      
      auth.clearAuth();
      
      expect(auth.isAuthenticated()).toBe(false);
      expect(auth.getApiKey()).toBeNull();
    });
  });

  describe('getAuthStatus()', () => {
    it('should return complete auth status', () => {
      process.env.GEMINI_API_KEY = 'AIzaSyEnvKey1234567890abcdefghijklmn';
      auth = new GoogleAIAuth();
      
      const status = auth.getAuthStatus();
      
      expect(status).toEqual({
        isAuthenticated: true,
        source: 'environment',
        keyFormat: 'valid',
        keyPrefix: 'AIzaSy...'
      });
    });

    it('should return unauthenticated status', () => {
      auth = new GoogleAIAuth();
      
      const status = auth.getAuthStatus();
      
      expect(status).toEqual({
        isAuthenticated: false,
        source: 'none',
        keyFormat: 'none',
        keyPrefix: null
      });
    });
  });

  describe('error handling', () => {
    it('should handle filesystem errors gracefully', () => {
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('File read error');
      });
      mockFs.existsSync.mockReturnValue(true);
      
      expect(() => {
        auth = new GoogleAIAuth({ configPath: '/error/config.json' });
      }).not.toThrow();
      
      expect(auth.isAuthenticated()).toBe(false);
    });

    it('should handle JSON parse errors', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('{invalid json}');
      
      expect(() => {
        auth = new GoogleAIAuth({ configPath: '/test/config.json' });
      }).not.toThrow();
      
      expect(auth.isAuthenticated()).toBe(false);
    });
  });
});