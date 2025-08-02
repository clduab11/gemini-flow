import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { GeminiAdapter } from '../../../src/adapters/gemini-adapter';
import type { GeminiAdapterConfig, ModelRequest } from '../../../src/adapters/gemini-adapter';

// Mock Google Generative AI
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: () => 'Mocked response',
          usageMetadata: {
            promptTokenCount: 10,
            candidatesTokenCount: 20,
            totalTokenCount: 30
          }
        }
      }),
      generateContentStream: jest.fn().mockImplementation(() => ({
        stream: (async function* () {
          yield {
            text: () => 'Hello ',
            usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 2, totalTokenCount: 7 }
          };
          yield {
            text: () => 'World',
            usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 3, totalTokenCount: 8 }
          };
        })()
      }))
    })
  }))
}));

describe('GeminiAdapter', () => {
  let adapter: GeminiAdapter;
  const config: GeminiAdapterConfig = {
    modelName: 'gemini-adapter',
    model: 'gemini-2.0-flash',
    apiKey: 'test-api-key',
    timeout: 30000,
    retryAttempts: 3,
    streamingEnabled: true,
    cachingEnabled: true
  };

  beforeEach(() => {
    adapter = new GeminiAdapter(config);
  });

  describe('initialization', () => {
    it('should initialize successfully with API key', async () => {
      await adapter.initialize();
      expect(adapter.isInitialized).toBe(true);
    });

    it('should throw error when no API key provided', () => {
      const configNoKey = { ...config, apiKey: undefined };
      delete process.env.GOOGLE_AI_API_KEY;
      
      expect(() => new GeminiAdapter(configNoKey)).toThrow('Google AI API key required');
    });
  });

  describe('capabilities', () => {
    it('should return correct capabilities for gemini-2.0-flash', () => {
      const caps = adapter.getCapabilities();
      expect(caps).toMatchObject({
        textGeneration: true,
        codeGeneration: true,
        multimodal: true,
        streaming: true,
        functionCalling: true,
        longContext: true,
        reasoning: true,
        maxTokens: 1048576
      });
    });

    it('should return different capabilities for other models', () => {
      const adapter1_5 = new GeminiAdapter({ ...config, model: 'gemini-1.5-pro' });
      const caps = adapter1_5.getCapabilities();
      expect(caps.maxTokens).toBe(2097152);
    });
  });

  describe('generate method', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should generate response successfully', async () => {
      const request: ModelRequest = {
        prompt: 'Test prompt',
        context: adapter.createContext()
      };

      const response = await adapter.generate(request);
      expect(response.content).toBe('Mocked response');
      expect(response.model).toBe('gemini-2.0-flash');
      expect(response.usage.totalTokens).toBe(30);
    });

    it('should handle multimodal input', async () => {
      const request: ModelRequest = {
        prompt: 'Describe this image',
        multimodal: {
          images: ['base64-image-data']
        },
        context: adapter.createContext()
      };

      const response = await adapter.generate(request);
      expect(response).toBeDefined();
    });

    it('should apply safety settings', async () => {
      const safetyConfig: GeminiAdapterConfig = {
        ...config,
        safetySettings: [
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      };
      
      const safeAdapter = new GeminiAdapter(safetyConfig);
      await safeAdapter.initialize();
      
      const request: ModelRequest = {
        prompt: 'Safe prompt',
        context: adapter.createContext()
      };

      const response = await safeAdapter.generate(request);
      expect(response).toBeDefined();
    });
  });

  describe('streaming', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should stream content successfully', async () => {
      const request: ModelRequest = {
        prompt: 'Stream test',
        context: { ...adapter.createContext(), streaming: true }
      };

      const chunks = [];
      for await (const chunk of adapter.generateStream(request)) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(2);
      expect(chunks[0].content).toBe('Hello ');
      expect(chunks[1].content).toBe('World');
    });
  });

  describe('caching', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should cache responses when enabled', async () => {
      const request: ModelRequest = {
        prompt: 'Cached prompt',
        context: adapter.createContext()
      };

      // First call
      const response1 = await adapter.generate(request);
      
      // Second call (should be cached)
      const response2 = await adapter.generate(request);
      
      expect(response1.id).toBe(response2.id);
      expect(response2.metadata?.cached).toBe(true);
    });

    it('should skip cache when disabled', async () => {
      const noCacheAdapter = new GeminiAdapter({ ...config, cachingEnabled: false });
      await noCacheAdapter.initialize();
      
      const request: ModelRequest = {
        prompt: 'No cache prompt',
        context: adapter.createContext()
      };

      const response1 = await noCacheAdapter.generate(request);
      const response2 = await noCacheAdapter.generate(request);
      
      expect(response1.id).not.toBe(response2.id);
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      await adapter.initialize();
    });

    it('should handle API errors gracefully', async () => {
      // Mock error response
      const GoogleGenerativeAI = require('@google/generative-ai').GoogleGenerativeAI;
      GoogleGenerativeAI.mockImplementationOnce(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: jest.fn().mockRejectedValue(new Error('API Error'))
        })
      }));

      const errorAdapter = new GeminiAdapter(config);
      await errorAdapter.initialize();

      const request: ModelRequest = {
        prompt: 'Error test',
        context: adapter.createContext()
      };

      await expect(errorAdapter.generate(request)).rejects.toThrow('API Error');
    });
  });

  describe('performance', () => {
    it('should track performance metrics', async () => {
      await adapter.initialize();
      
      const request: ModelRequest = {
        prompt: 'Performance test',
        context: adapter.createContext()
      };

      const logSpy = jest.spyOn(adapter.logger, 'info');
      await adapter.generate(request);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('performance'),
        expect.objectContaining({
          operation: 'generate',
          success: true
        })
      );
    });
  });
});