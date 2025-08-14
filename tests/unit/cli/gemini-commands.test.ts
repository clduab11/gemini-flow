/**
 * Gemini Commands Tests
 * 
 * Test suite for simplified command structure matching official Gemini CLI
 * Testing primary commands: chat, generate, list-models, auth
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { Command } from 'commander';
import { GeminiCLI } from '../../../src/cli/gemini-cli';
import { GoogleAIAuth } from '../../../src/core/google-ai-auth';
import { InteractiveMode } from '../../../src/cli/interactive-mode';
import { ContextWindowManager } from '../../../src/core/context-window-manager';

// Mock dependencies
jest.mock('commander');
jest.mock('../../../src/core/google-ai-auth.js');
jest.mock('../../../src/cli/interactive-mode.js');
jest.mock('../../../src/core/context-window-manager.js');
jest.mock('@google/generative-ai');
jest.mock('chalk', () => ({
  cyan: jest.fn((str) => str),
  yellow: jest.fn((str) => str),
  blue: jest.fn((str) => str),
  green: jest.fn((str) => str),
  red: jest.fn((str) => str),
  gray: jest.fn((str) => str)
}));
jest.mock('ora', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis()
  }))
}));
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn()
}));

const MockedGoogleAIAuth = GoogleAIAuth as jest.MockedClass<typeof GoogleAIAuth>;
const MockedInteractiveMode = InteractiveMode as jest.MockedClass<typeof InteractiveMode>;
const MockedContextWindowManager = ContextWindowManager as jest.MockedClass<typeof ContextWindowManager>;

describe('GeminiCLI Commands', () => {
  let geminiCLI: GeminiCLI;
  let mockAuth: jest.Mocked<GoogleAIAuth>;
  let mockInteractiveMode: jest.Mocked<InteractiveMode>;
  let mockContextManager: jest.Mocked<ContextWindowManager>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock instances
    mockAuth = new MockedGoogleAIAuth() as jest.Mocked<GoogleAIAuth>;
    mockInteractiveMode = new MockedInteractiveMode({} as any) as jest.Mocked<InteractiveMode>;
    mockContextManager = new MockedContextWindowManager() as jest.Mocked<ContextWindowManager>;
    
    // Mock successful authentication by default
    mockAuth.isAuthenticated.mockReturnValue(true);
    mockAuth.getApiKey.mockReturnValue('AIzaSyTestKey1234567890abcdefghijk');
    mockAuth.getAuthStatus.mockReturnValue({
      isAuthenticated: true,
      source: 'environment',
      keyFormat: 'valid',
      keyPrefix: 'AIzaSy...'
    });
    
    geminiCLI = new GeminiCLI();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('command structure', () => {
    it('should have primary commands matching official CLI', () => {
      const program = geminiCLI.getProgram();
      const commands = program.commands.map(cmd => cmd.name());
      
      expect(commands).toContain('chat');
      expect(commands).toContain('generate');
      expect(commands).toContain('list-models');
      expect(commands).toContain('auth');
    });

    it('should have proper command descriptions', () => {
      const program = geminiCLI.getProgram();
      const chatCommand = program.commands.find(cmd => cmd.name() === 'chat');
      const generateCommand = program.commands.find(cmd => cmd.name() === 'generate');
      
      expect(chatCommand?.description()).toContain('interactive conversation');
      expect(generateCommand?.description()).toContain('generate content');
    });

    it('should support global options', () => {
      const program = geminiCLI.getProgram();
      const options = program.options.map(opt => opt.long);
      
      expect(options).toContain('--model');
      expect(options).toContain('--temperature');
      expect(options).toContain('--max-tokens');
      expect(options).toContain('--verbose');
    });
  });

  describe('chat command', () => {
    it('should start interactive mode when no prompt provided', async () => {
      mockInteractiveMode.start.mockResolvedValue(undefined);
      
      await geminiCLI.executeCommand('chat', []);
      
      expect(MockedInteractiveMode).toHaveBeenCalledWith({
        auth: expect.any(Object),
        contextManager: expect.any(Object),
        model: 'gemini-1.5-flash',
        maxTokens: 1000000,
        temperature: 0.7
      });
      expect(mockInteractiveMode.start).toHaveBeenCalled();
    });

    it('should handle single prompt without starting interactive mode', async () => {
      const mockResponse = {
        text: 'Hello! How can I help you?',
        usage: { promptTokens: 10, completionTokens: 15, totalTokens: 25 }
      };
      
      const spyGenerateContent = jest.fn().mockResolvedValue(mockResponse);
      geminiCLI.generateContent = spyGenerateContent;
      
      await geminiCLI.executeCommand('chat', ['Hello there']);
      
      expect(spyGenerateContent).toHaveBeenCalledWith('Hello there', expect.any(Object));
      expect(MockedInteractiveMode).not.toHaveBeenCalled();
    });

    it('should support model selection', async () => {
      mockInteractiveMode.start.mockResolvedValue(undefined);
      
      await geminiCLI.executeCommand('chat', [], { model: 'gemini-1.5-pro' });
      
      expect(MockedInteractiveMode).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-1.5-pro'
        })
      );
    });

    it('should support temperature control', async () => {
      mockInteractiveMode.start.mockResolvedValue(undefined);
      
      await geminiCLI.executeCommand('chat', [], { temperature: 0.9 });
      
      expect(MockedInteractiveMode).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.9
        })
      );
    });

    it('should handle authentication errors', async () => {
      mockAuth.isAuthenticated.mockReturnValue(false);
      
      await expect(
        geminiCLI.executeCommand('chat', [])
      ).rejects.toThrow('Authentication required');
    });
  });

  describe('generate command', () => {
    it('should generate content from prompt', async () => {
      const mockResponse = {
        text: 'Generated content response',
        usage: { promptTokens: 5, completionTokens: 10, totalTokens: 15 }
      };
      
      const spyGenerateContent = jest.fn().mockResolvedValue(mockResponse);
      geminiCLI.generateContent = spyGenerateContent;
      
      const result = await geminiCLI.executeCommand('generate', ['Write a haiku']);
      
      expect(spyGenerateContent).toHaveBeenCalledWith('Write a haiku', expect.any(Object));
      expect(result).toContain('Generated content response');
    });

    it('should support system instruction', async () => {
      const spyGenerateContent = jest.fn().mockResolvedValue({
        text: 'Response with system instruction',
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 }
      });
      geminiCLI.generateContent = spyGenerateContent;
      
      await geminiCLI.executeCommand('generate', ['Explain AI'], {
        system: 'You are a helpful AI assistant'
      });
      
      expect(spyGenerateContent).toHaveBeenCalledWith(
        'Explain AI',
        expect.objectContaining({
          systemInstruction: 'You are a helpful AI assistant'
        })
      );
    });

    it('should handle file input', async () => {
      const mockFileContent = 'File content here';
      jest.spyOn(require('fs'), 'readFileSync').mockReturnValue(mockFileContent);
      
      const spyGenerateContent = jest.fn().mockResolvedValue({
        text: 'Response to file content',
        usage: { promptTokens: 20, completionTokens: 25, totalTokens: 45 }
      });
      geminiCLI.generateContent = spyGenerateContent;
      
      await geminiCLI.executeCommand('generate', [], {
        file: 'test.txt'
      });
      
      expect(spyGenerateContent).toHaveBeenCalledWith(
        mockFileContent,
        expect.any(Object)
      );
    });

    it('should handle JSON output format', async () => {
      const spyGenerateContent = jest.fn().mockResolvedValue({
        text: '{"result": "json response"}',
        usage: { promptTokens: 5, completionTokens: 10, totalTokens: 15 }
      });
      geminiCLI.generateContent = spyGenerateContent;
      
      const result = await geminiCLI.executeCommand('generate', ['Create JSON'], {
        json: true
      });
      
      expect(result).toContain('"result": "json response"');
    });
  });

  describe('list-models command', () => {
    it('should list available models', async () => {
      const mockModels = [
        { name: 'gemini-1.5-flash', description: 'Fast model' },
        { name: 'gemini-1.5-pro', description: 'Pro model' }
      ];
      
      const spyListModels = jest.fn().mockResolvedValue(mockModels);
      geminiCLI.listModels = spyListModels;
      
      const result = await geminiCLI.executeCommand('list-models', []);
      
      expect(spyListModels).toHaveBeenCalled();
      expect(result).toContain('gemini-1.5-flash');
      expect(result).toContain('gemini-1.5-pro');
    });

    it('should handle API errors gracefully', async () => {
      const spyListModels = jest.fn().mockRejectedValue(new Error('API error'));
      geminiCLI.listModels = spyListModels;
      
      await expect(
        geminiCLI.executeCommand('list-models', [])
      ).rejects.toThrow('API error');
    });
  });

  describe('auth command', () => {
    it('should show auth status', async () => {
      const result = await geminiCLI.executeCommand('auth', []);
      
      expect(result).toContain('Authentication Status');
      expect(result).toContain('AIzaSy...');
      expect(mockAuth.getAuthStatus).toHaveBeenCalled();
    });

    it('should set API key', async () => {
      mockAuth.setApiKey.mockReturnValue(true);
      
      await geminiCLI.executeCommand('auth', [], {
        key: 'AIzaSyNewKey1234567890abcdefghijk'
      });
      
      expect(mockAuth.setApiKey).toHaveBeenCalledWith('AIzaSyNewKey1234567890abcdefghijk');
    });

    it('should test API key', async () => {
      mockAuth.testApiKey.mockResolvedValue(true);
      
      const result = await geminiCLI.executeCommand('auth', [], { test: true });
      
      expect(mockAuth.testApiKey).toHaveBeenCalled();
      expect(result).toContain('API key is valid');
    });

    it('should show help for authentication', async () => {
      const result = await geminiCLI.executeCommand('auth', [], { help: true });
      
      expect(mockAuth.getAuthHelpMessage).toHaveBeenCalled();
      expect(result).toContain('Get an API key from Google AI Studio');
    });
  });

  describe('error handling', () => {
    it('should handle invalid commands gracefully', async () => {
      await expect(
        geminiCLI.executeCommand('invalid-command', [])
      ).rejects.toThrow('Unknown command');
    });

    it('should handle network errors', async () => {
      const spyGenerateContent = jest.fn().mockRejectedValue(
        new Error('Network error')
      );
      geminiCLI.generateContent = spyGenerateContent;
      
      await expect(
        geminiCLI.executeCommand('generate', ['Test prompt'])
      ).rejects.toThrow('Network error');
    });

    it('should handle quota exceeded errors', async () => {
      const quotaError = new Error('QUOTA_EXCEEDED: API quota exceeded');
      const spyGenerateContent = jest.fn().mockRejectedValue(quotaError);
      geminiCLI.generateContent = spyGenerateContent;
      
      await expect(
        geminiCLI.executeCommand('generate', ['Test'])
      ).rejects.toThrow('QUOTA_EXCEEDED');
    });
  });

  describe('options parsing', () => {
    it('should parse model option correctly', () => {
      const options = geminiCLI.parseOptions(['--model', 'gemini-1.5-pro']);
      expect(options.model).toBe('gemini-1.5-pro');
    });

    it('should parse temperature option correctly', () => {
      const options = geminiCLI.parseOptions(['--temperature', '0.5']);
      expect(options.temperature).toBe(0.5);
    });

    it('should parse max-tokens option correctly', () => {
      const options = geminiCLI.parseOptions(['--max-tokens', '500000']);
      expect(options.maxTokens).toBe(500000);
    });

    it('should parse boolean options correctly', () => {
      const options = geminiCLI.parseOptions(['--verbose', '--json']);
      expect(options.verbose).toBe(true);
      expect(options.json).toBe(true);
    });

    it('should handle invalid option values', () => {
      expect(() => {
        geminiCLI.parseOptions(['--temperature', 'invalid']);
      }).toThrow('Invalid temperature value');
    });
  });

  describe('command aliases', () => {
    it('should support chat aliases', async () => {
      mockInteractiveMode.start.mockResolvedValue(undefined);
      
      // Test 'c' alias for chat
      await geminiCLI.executeCommand('c', []);
      expect(MockedInteractiveMode).toHaveBeenCalled();
    });

    it('should support generate aliases', async () => {
      const spyGenerateContent = jest.fn().mockResolvedValue({
        text: 'Generated response',
        usage: { promptTokens: 5, completionTokens: 10, totalTokens: 15 }
      });
      geminiCLI.generateContent = spyGenerateContent;
      
      // Test 'g' alias for generate
      await geminiCLI.executeCommand('g', ['Test prompt']);
      expect(spyGenerateContent).toHaveBeenCalled();
    });
  });

  describe('output formatting', () => {
    it('should format standard output correctly', () => {
      const output = geminiCLI.formatOutput('Test response', {
        usage: { promptTokens: 10, completionTokens: 15, totalTokens: 25 }
      });
      
      expect(output).toContain('Test response');
      expect(output).toContain('Tokens used: 25');
    });

    it('should format JSON output correctly', () => {
      const output = geminiCLI.formatOutput('{"key": "value"}', {
        usage: { promptTokens: 5, completionTokens: 8, totalTokens: 13 }
      }, { json: true });
      
      const parsed = JSON.parse(output);
      expect(parsed.response).toBe('{"key": "value"}');
      expect(parsed.usage.totalTokens).toBe(13);
    });

    it('should format verbose output correctly', () => {
      const output = geminiCLI.formatOutput('Response text', {
        usage: { promptTokens: 12, completionTokens: 18, totalTokens: 30 },
        model: 'gemini-1.5-flash',
        latency: 150
      }, { verbose: true });
      
      expect(output).toContain('Model: gemini-1.5-flash');
      expect(output).toContain('Latency: 150ms');
      expect(output).toContain('Prompt tokens: 12');
      expect(output).toContain('Completion tokens: 18');
    });
  });
});