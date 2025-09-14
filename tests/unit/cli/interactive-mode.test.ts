/**
 * Interactive Mode Tests
 * 
 * Test suite for the interactive conversation mode functionality
 * that provides Gemini CLI parity
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { InteractiveMode } from '../../../src/cli/interactive-mode';
import { GoogleAIAuth } from '../../../src/core/google-ai-auth';
import { ContextWindowManager } from '../../../src/core/context-window-manager';

// Mock dependencies
jest.mock('../../../src/core/google-ai-auth.js');
jest.mock('../../../src/core/context-window-manager.js');
jest.mock('inquirer', () => ({
  prompt: jest.fn()
}));
jest.mock('chalk', () => {
  const actualChalk = jest.requireActual('chalk');
  return {
    __esModule: true,
    ...actualChalk,
    default: {
      cyan: jest.fn((str) => str),
      yellow: jest.fn((str) => str),
      blue: jest.fn((str) => str),
      green: jest.fn((str) => str),
      red: jest.fn((str) => str),
      gray: jest.fn((str) => str),
      white: jest.fn((str) => str),
    },
  };
});
jest.mock('ora', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    start: jest.fn().mockReturnThis(),
    succeed: jest.fn().mockReturnThis(),
    fail: jest.fn().mockReturnThis()
  }))
}));
jest.mock('@google/generative-ai');

const MockedGoogleAIAuth = GoogleAIAuth as jest.MockedClass<typeof GoogleAIAuth>;
const MockedContextWindowManager = ContextWindowManager as jest.MockedClass<typeof ContextWindowManager>;

describe('InteractiveMode', () => {
  let interactiveMode: InteractiveMode;
  let mockAuth: jest.Mocked<GoogleAIAuth>;
  let mockContextManager: jest.Mocked<ContextWindowManager>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup mock instances
    mockAuth = new MockedGoogleAIAuth() as jest.Mocked<GoogleAIAuth>;
    mockContextManager = new MockedContextWindowManager() as jest.Mocked<ContextWindowManager>;
    
    // Mock successful authentication
    mockAuth.isAuthenticated.mockReturnValue(true);
    mockAuth.getApiKey.mockReturnValue('test-api-key');
    
    // Mock context manager
    mockContextManager.addMessage.mockResolvedValue(undefined);
    mockContextManager.getContext.mockReturnValue([]);
    mockContextManager.getRemainingTokens.mockReturnValue(1000000);
    
    interactiveMode = new InteractiveMode({
      auth: mockAuth,
      contextManager: mockContextManager
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with auth and context manager', () => {
      expect(interactiveMode).toBeDefined();
      expect(mockAuth.isAuthenticated).toHaveBeenCalled();
    });

    it('should fail initialization if not authenticated', () => {
      mockAuth.isAuthenticated.mockReturnValue(false);
      
      expect(() => {
        new InteractiveMode({
          auth: mockAuth,
          contextManager: mockContextManager
        });
      }).toThrow('Authentication required for interactive mode');
    });
  });

  describe('start()', () => {
    it('should start interactive session successfully', async () => {
      const startPromise = interactiveMode.start();
      
      // Simulate user input and exit
      setTimeout(() => {
        interactiveMode.stop();
      }, 100);
      
      await expect(startPromise).resolves.toBeUndefined();
    });

    it('should display welcome message', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const startPromise = interactiveMode.start();
      
      setTimeout(() => {
        interactiveMode.stop();
      }, 100);
      
      await startPromise;
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Interactive Conversation Mode')
      );
      
      consoleSpy.mockRestore();
    });
  });

  describe('processMessage()', () => {
    it('should process user message and return response', async () => {
      const testMessage = 'Hello, how are you?';
      const expectedResponse = 'I am doing well, thank you!';
      
      // Mock the Gemini API response
      const mockApiResponse = {
        text: expectedResponse,
        usage: {
          promptTokens: 10,
          completionTokens: 15,
          totalTokens: 25
        }
      };
      
      // Mock the internal method that calls Gemini API
      jest.spyOn(interactiveMode as any, 'callGeminiAPI')
        .mockResolvedValue(mockApiResponse);
      
      const response = await interactiveMode.processMessage(testMessage);
      
      expect(response).toBe(expectedResponse);
      expect(mockContextManager.addMessage).toHaveBeenCalledWith('user', testMessage);
      expect(mockContextManager.addMessage).toHaveBeenCalledWith('assistant', expectedResponse);
    });

    it('should handle empty messages', async () => {
      const response = await interactiveMode.processMessage('');
      
      expect(response).toBe('Please enter a message.');
      expect(mockContextManager.addMessage).not.toHaveBeenCalled();
    });

    it('should handle API errors gracefully', async () => {
      const testMessage = 'Test message';
      const errorMessage = 'API rate limit exceeded';
      
      jest.spyOn(interactiveMode as any, 'callGeminiAPI')
        .mockRejectedValue(new Error(errorMessage));
      
      const response = await interactiveMode.processMessage(testMessage);
      
      expect(response).toContain('Error processing your message');
      expect(response).toContain(errorMessage);
    });
  });

  describe('context management', () => {
    it('should maintain conversation context', async () => {
      const messages = [
        'What is the capital of France?',
        'What is its population?'
      ];
      
      // Mock API responses
      jest.spyOn(interactiveMode as any, 'callGeminiAPI')
        .mockResolvedValueOnce({
          text: 'The capital of France is Paris.',
          usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 }
        })
        .mockResolvedValueOnce({
          text: 'Paris has approximately 2.1 million residents.',
          usage: { promptTokens: 15, completionTokens: 12, totalTokens: 27 }
        });
      
      await interactiveMode.processMessage(messages[0]);
      await interactiveMode.processMessage(messages[1]);
      
      // Verify context was built properly
      expect(mockContextManager.addMessage).toHaveBeenCalledTimes(4); // 2 user + 2 assistant
      expect(mockContextManager.getContext).toHaveBeenCalled();
    });

    it('should handle context window overflow', async () => {
      // Mock context manager to indicate low remaining tokens
      mockContextManager.getRemainingTokens.mockReturnValue(100);
      mockContextManager.truncateContext.mockResolvedValue(undefined);
      
      const testMessage = 'This is a long message that might exceed context window';
      
      jest.spyOn(interactiveMode as any, 'callGeminiAPI')
        .mockResolvedValue({
          text: 'Response',
          usage: { promptTokens: 50, completionTokens: 50, totalTokens: 100 }
        });
      
      await interactiveMode.processMessage(testMessage);
      
      expect(mockContextManager.truncateContext).toHaveBeenCalled();
    });
  });

  describe('commands', () => {
    it('should handle /clear command', async () => {
      const response = await interactiveMode.processMessage('/clear');
      
      expect(response).toContain('Conversation history cleared');
      expect(mockContextManager.clearContext).toHaveBeenCalled();
    });

    it('should handle /tokens command', async () => {
      mockContextManager.getTotalTokens.mockReturnValue(1500);
      mockContextManager.getRemainingTokens.mockReturnValue(998500);
      
      const response = await interactiveMode.processMessage('/tokens');
      
      expect(response).toContain('Token usage: 1500');
      expect(response).toContain('Remaining: 998500');
    });

    it('should handle /help command', async () => {
      const response = await interactiveMode.processMessage('/help');
      
      expect(response).toContain('Available commands:');
      expect(response).toContain('/clear');
      expect(response).toContain('/tokens');
      expect(response).toContain('/help');
      expect(response).toContain('/exit');
    });

    it('should handle /exit command', async () => {
      const stopSpy = jest.spyOn(interactiveMode, 'stop');
      
      const response = await interactiveMode.processMessage('/exit');
      
      expect(response).toContain('Goodbye!');
      expect(stopSpy).toHaveBeenCalled();
    });
  });

  describe('stop()', () => {
    it('should stop interactive session cleanly', () => {
      const isRunningSpy = jest.spyOn(interactiveMode, 'isRunning');
      isRunningSpy.mockReturnValue(true);
      
      interactiveMode.stop();
      
      expect(interactiveMode.isRunning()).toBe(false);
    });
  });

  describe('isRunning()', () => {
    it('should return correct running state', () => {
      expect(interactiveMode.isRunning()).toBe(false);
      
      // Start session (mock)
      (interactiveMode as any).running = true;
      
      expect(interactiveMode.isRunning()).toBe(true);
    });
  });

  describe('session persistence', () => {
    it('should save session on exit', async () => {
      const saveSpy = jest.spyOn(mockContextManager, 'saveSession');
      
      interactiveMode.stop();
      
      expect(saveSpy).toHaveBeenCalled();
    });

    it('should restore previous session on start', async () => {
      const restoreSpy = jest.spyOn(mockContextManager, 'restoreSession');
      
      const startPromise = interactiveMode.start();
      
      setTimeout(() => {
        interactiveMode.stop();
      }, 100);
      
      await startPromise;
      
      expect(restoreSpy).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle authentication failures', () => {
      mockAuth.isAuthenticated.mockReturnValue(false);
      
      expect(() => {
        new InteractiveMode({
          auth: mockAuth,
          contextManager: mockContextManager
        });
      }).toThrow('Authentication required');
    });

    it('should handle context manager errors', async () => {
      mockContextManager.addMessage.mockRejectedValue(new Error('Context error'));
      
      const response = await interactiveMode.processMessage('test');
      
      expect(response).toContain('Error processing your message');
    });
  });
});