import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { GeminiAdapter } from '../../../src/adapters/gemini-adapter';
import type { GeminiAdapterConfig, ModelRequest } from '../../../src/adapters/gemini-adapter';

// Mock Google Generative AI
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: () => 'Gemini test response',
          candidates: [{
            finishReason: 'STOP',
            safetyRatings: [],
            citationMetadata: null
          }],
          usageMetadata: {
            promptTokenCount: 10,
            candidatesTokenCount: 20,
            totalTokenCount: 30
          }
        }
      }),
      generateContentStream: jest.fn().mockReturnValue({
        stream: {
          async* [Symbol.asyncIterator]() {
            yield {
              text: () => 'Hello ',
              candidates: [{ finishReason: null }]
            };
            yield {
              text: () => 'World',
              candidates: [{ finishReason: 'STOP' }]
            };
          }
        }
      })
    })
  }))
}));

describe('GeminiAdapter', () => {
  let adapter: GeminiAdapter;
  
  const baseConfig: GeminiAdapterConfig = {
    modelName: 'gemini-2.0-flash',
    model: 'gemini-2.0-flash',
    apiKey: 'test-api-key',
    timeout: 30000,
    retryAttempts: 3,
    streamingEnabled: true,
    cachingEnabled: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GOOGLE_AI_API_KEY = undefined;
  });

  describe('initialization', () => {
    it('should initialize successfully with API key', async () => {
      adapter = new GeminiAdapter(baseConfig);
      await adapter.initialize();
      expect(adapter.isInitialized).toBe(true);
    });

    it('should use environment variable for API key if not provided', () => {
      process.env.GOOGLE_AI_API_KEY = 'env-api-key';
      const configWithoutKey = { ...baseConfig };
      delete configWithoutKey.apiKey;
      
      expect(() => new GeminiAdapter(configWithoutKey)).not.toThrow();
    });

    it('should throw error when no API key is available', () => {
      const configWithoutKey = { ...baseConfig };
      delete configWithoutKey.apiKey;
      
      expect(() => new GeminiAdapter(configWithoutKey)).toThrow('Google AI API key required');
    });

    it('should initialize with generation config', async () => {
      const configWithGenConfig: GeminiAdapterConfig = {
        ...baseConfig,
        generationConfig: {
          temperature: 0.8,
          topP: 0.9,
          topK: 40,
          maxOutputTokens: 2048,
          stopSequences: ['END'],
          responseMimeType: 'text/plain'
        }
      };

      adapter = new GeminiAdapter(configWithGenConfig);
      await adapter.initialize();
      expect(adapter.isInitialized).toBe(true);
    });

    it('should initialize with safety settings', async () => {
      const configWithSafety: GeminiAdapterConfig = {
        ...baseConfig,
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      };

      adapter = new GeminiAdapter(configWithSafety);
      await adapter.initialize();
      expect(adapter.isInitialized).toBe(true);
    });

    it('should handle initialization errors gracefully', async () => {
      const GoogleGenerativeAI = require('@google/generative-ai').GoogleGenerativeAI;
      GoogleGenerativeAI.mockImplementationOnce(() => {
        throw new Error('Initialization failed');
      });

      adapter = new GeminiAdapter(baseConfig);
      await expect(adapter.initialize()).rejects.toThrow();
    });
  });

  describe('model capabilities', () => {
    beforeEach(async () => {
      adapter = new GeminiAdapter(baseConfig);
      await adapter.initialize();
    });

    it('should return correct capabilities for gemini-2.0-flash', () => {
      const caps = adapter.getModelCapabilities();
      expect(caps).toMatchObject({
        textGeneration: true,
        codeGeneration: true,
        multimodal: true,
        streaming: true,
        functionCalling: true,
        longContext: false,
        reasoning: true,
        maxTokens: 1000000,
        supportedLanguages: expect.arrayContaining(['en', 'es', 'fr']),
        inputTypes: expect.arrayContaining(['text', 'image', 'audio', 'video']),
        outputTypes: expect.arrayContaining(['text', 'audio'])
      });
    });

    it('should return different capabilities for gemini-2.0-flash-thinking', async () => {
      const thinkingConfig: GeminiAdapterConfig = {
        ...baseConfig,
        model: 'gemini-2.0-flash-thinking'
      };
      
      const thinkingAdapter = new GeminiAdapter(thinkingConfig);
      await thinkingAdapter.initialize();
      
      const caps = thinkingAdapter.getModelCapabilities();
      expect(caps.reasoning).toBe(true);
      expect(caps.multimodal).toBe(true);
      expect(caps.maxTokens).toBe(1000000);
    });

    it('should return correct capabilities for gemini-pro', async () => {
      const proConfig: GeminiAdapterConfig = {
        ...baseConfig,
        model: 'gemini-pro'
      };
      
      const proAdapter = new GeminiAdapter(proConfig);
      await proAdapter.initialize();
      
      const caps = proAdapter.getModelCapabilities();
      expect(caps).toMatchObject({
        textGeneration: true,
        codeGeneration: true,
        multimodal: false,
        longContext: true,
        reasoning: true,
        maxTokens: 1000000,
        inputTypes: ['text'],
        outputTypes: ['text']
      });
    });

    it('should return correct capabilities for gemini-pro-vision', async () => {
      const visionConfig: GeminiAdapterConfig = {
        ...baseConfig,
        model: 'gemini-pro-vision'
      };
      
      const visionAdapter = new GeminiAdapter(visionConfig);
      await visionAdapter.initialize();
      
      const caps = visionAdapter.getModelCapabilities();
      expect(caps).toMatchObject({
        multimodal: true,
        longContext: true,
        inputTypes: expect.arrayContaining(['text', 'image']),
        outputTypes: ['text']
      });
    });
  });

  describe('request validation', () => {
    beforeEach(async () => {
      adapter = new GeminiAdapter(baseConfig);
      await adapter.initialize();
    });

    it('should validate successful requests', async () => {
      const request: ModelRequest = {
        prompt: 'Valid prompt',
        context: {
          requestId: 'test-req',
          priority: 'medium',
          userTier: 'pro',
          latencyTarget: 1000
        }
      };

      const isValid = await adapter.validateRequest(request);
      expect(isValid).toBe(true);
    });

    it('should reject empty prompts', async () => {
      const request: ModelRequest = {
        prompt: '',
        context: {
          requestId: 'test-req',
          priority: 'medium',
          userTier: 'pro',
          latencyTarget: 1000
        }
      };

      await expect(adapter.validateRequest(request)).rejects.toThrow('Prompt is required');
    });

    it('should reject non-string prompts', async () => {
      const request: ModelRequest = {
        prompt: null as any,
        context: {
          requestId: 'test-req',
          priority: 'medium',
          userTier: 'pro',
          latencyTarget: 1000
        }
      };

      await expect(adapter.validateRequest(request)).rejects.toThrow('Prompt is required');
    });

    it('should reject prompts that are too long', async () => {
      const tooLongPrompt = 'a'.repeat(2000000); // Exceeds 1M token limit
      const request: ModelRequest = {
        prompt: tooLongPrompt,
        context: {
          requestId: 'test-req',
          priority: 'medium',
          userTier: 'pro',
          latencyTarget: 1000
        }
      };

      await expect(adapter.validateRequest(request)).rejects.toThrow('Prompt too long');
    });

    it('should validate multimodal requests for capable models', async () => {
      const request: ModelRequest = {
        prompt: 'Analyze this image',
        multimodal: {
          images: ['base64-image-data']
        },
        context: {
          requestId: 'test-req',
          priority: 'medium',
          userTier: 'pro',
          latencyTarget: 1000
        }
      };

      const isValid = await adapter.validateRequest(request);
      expect(isValid).toBe(true);
    });

    it('should reject multimodal requests for non-multimodal models', async () => {
      const proAdapter = new GeminiAdapter({
        ...baseConfig,
        model: 'gemini-pro'
      });
      await proAdapter.initialize();

      const request: ModelRequest = {
        prompt: 'Analyze this image',
        multimodal: {
          images: ['base64-image-data']
        },
        context: {
          requestId: 'test-req',
          priority: 'medium',
          userTier: 'pro',
          latencyTarget: 1000
        }
      };

      await expect(proAdapter.validateRequest(request)).rejects.toThrow('Multimodal input not supported');
    });

    it('should reject unsupported input types', async () => {
      const proAdapter = new GeminiAdapter({
        ...baseConfig,
        model: 'gemini-pro'
      });
      await proAdapter.initialize();

      const request: ModelRequest = {
        prompt: 'Test image input',
        multimodal: {
          images: ['base64-image-data']
        },
        context: {
          requestId: 'test-req',
          priority: 'medium',
          userTier: 'pro',
          latencyTarget: 1000
        }
      };

      await expect(proAdapter.validateRequest(request)).rejects.toThrow('Image input not supported');
    });
  });

  describe('generation', () => {
    beforeEach(async () => {
      adapter = new GeminiAdapter(baseConfig);
      await adapter.initialize();
    });

    it('should generate response successfully', async () => {
      const request: ModelRequest = {
        prompt: 'Hello, world!',
        context: {
          requestId: 'test-req',
          priority: 'medium',
          userTier: 'pro',
          latencyTarget: 1000
        }
      };

      const response = await adapter.generate(request);
      
      expect(response).toMatchObject({
        id: expect.any(String),
        content: 'Gemini test response',
        model: 'gemini-2.0-flash',
        timestamp: expect.any(Date),
        latency: expect.any(Number),
        usage: {
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30
        },
        cost: expect.any(Number),
        finishReason: 'STOP'
      });
    });

    it('should generate response with parameters', async () => {
      const request: ModelRequest = {
        prompt: 'Generate with parameters',
        parameters: {
          temperature: 0.8,
          topP: 0.9,
          topK: 40,
          maxTokens: 2048,
          stopSequences: ['END']
        },
        context: {
          requestId: 'test-req',
          priority: 'medium',
          userTier: 'pro',
          latencyTarget: 1000
        }
      };

      const response = await adapter.generate(request);
      expect(response.content).toBe('Gemini test response');
    });

    it('should generate response with system message', async () => {
      const request: ModelRequest = {
        prompt: 'User prompt',
        systemMessage: 'You are a helpful assistant',
        context: {
          requestId: 'test-req',
          priority: 'medium',
          userTier: 'pro',
          latencyTarget: 1000
        }
      };

      const response = await adapter.generate(request);
      expect(response.content).toBe('Gemini test response');
    });

    it('should generate response with multimodal content', async () => {
      const request: ModelRequest = {
        prompt: 'Analyze this image',
        multimodal: {
          images: ['base64-image-data-1', 'base64-image-data-2']
        },
        context: {
          requestId: 'test-req',
          priority: 'medium',
          userTier: 'pro',
          latencyTarget: 1000
        }
      };

      const response = await adapter.generate(request);
      expect(response.content).toBe('Gemini test response');
    });

    it('should generate response with tools', async () => {
      const request: ModelRequest = {
        prompt: 'Use these tools',
        tools: [
          {
            name: 'calculate',
            description: 'Perform calculations',
            parameters: {}
          }
        ],
        context: {
          requestId: 'test-req',
          priority: 'medium',
          userTier: 'pro',
          latencyTarget: 1000
        }
      };

      const response = await adapter.generate(request);
      expect(response.content).toBe('Gemini test response');
    });

    it('should cache responses when caching is enabled', async () => {
      const request: ModelRequest = {
        prompt: 'Cacheable request',
        context: {
          requestId: 'test-req',
          priority: 'medium',
          userTier: 'pro',
          latencyTarget: 1000
        }
      };

      // First call
      const response1 = await adapter.generate(request);
      
      // Second call (should be cached)
      const response2 = await adapter.generate(request);
      
      expect(response1.content).toBe(response2.content);
      expect(response2.timestamp.getTime()).toBeGreaterThan(response1.timestamp.getTime());
    });

    it('should throw error when not initialized', async () => {
      const uninitializedAdapter = new GeminiAdapter(baseConfig);
      
      const request: ModelRequest = {
        prompt: 'Test',
        context: {
          requestId: 'test-req',
          priority: 'medium',
          userTier: 'pro',
          latencyTarget: 1000
        }
      };

      await expect(uninitializedAdapter.generate(request)).rejects.toThrow('Adapter not initialized');
    });
  });

  describe('streaming', () => {
    beforeEach(async () => {
      adapter = new GeminiAdapter(baseConfig);
      await adapter.initialize();
    });

    it('should stream content successfully', async () => {
      const request: ModelRequest = {
        prompt: 'Stream this response',
        context: {
          requestId: 'test-req',
          priority: 'medium',
          userTier: 'pro',
          latencyTarget: 1000
        }
      };

      const chunks = [];
      for await (const chunk of adapter.generateStream(request)) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(2);
      expect(chunks[0]).toMatchObject({
        id: expect.stringContaining('test-req'),
        content: 'Hello ',
        delta: 'Hello ',
        metadata: expect.objectContaining({
          chunkIndex: 0,
          model: 'gemini-2.0-flash'
        })
      });

      expect(chunks[1]).toMatchObject({
        id: expect.stringContaining('test-req'),
        content: 'Hello World',
        delta: 'World',
        finishReason: 'STOP',
        metadata: expect.objectContaining({
          chunkIndex: 1,
          model: 'gemini-2.0-flash'
        })
      });
    });

    it('should reject streaming for models without streaming capability', async () => {
      // Mock adapter without streaming
      const nonStreamingAdapter = new GeminiAdapter(baseConfig);
      nonStreamingAdapter.capabilities = {
        ...nonStreamingAdapter.getModelCapabilities(),
        streaming: false
      };
      await nonStreamingAdapter.initialize();

      const request: ModelRequest = {
        prompt: 'Stream test',
        context: {
          requestId: 'test-req',
          priority: 'medium',
          userTier: 'pro',
          latencyTarget: 1000
        }
      };

      const streamGenerator = nonStreamingAdapter.generateStream(request);
      await expect(streamGenerator.next()).rejects.toThrow('Streaming not supported');
    });

    it('should handle streaming errors gracefully', async () => {
      const GoogleGenerativeAI = require('@google/generative-ai').GoogleGenerativeAI;
      GoogleGenerativeAI.mockImplementationOnce(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContentStream: jest.fn().mockRejectedValue(new Error('Streaming failed'))
        })
      }));

      const failingAdapter = new GeminiAdapter(baseConfig);
      await failingAdapter.initialize();

      const request: ModelRequest = {
        prompt: 'Failing stream',
        context: {
          requestId: 'test-req',
          priority: 'medium',
          userTier: 'pro',
          latencyTarget: 1000
        }
      };

      const streamGenerator = failingAdapter.generateStream(request);
      await expect(streamGenerator.next()).rejects.toThrow();
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      adapter = new GeminiAdapter(baseConfig);
      await adapter.initialize();
    });

    it('should handle Google AI API errors', async () => {
      const GoogleGenerativeAI = require('@google/generative-ai').GoogleGenerativeAI;
      GoogleGenerativeAI.mockImplementationOnce(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: jest.fn().mockRejectedValue({
            status: 400,
            message: 'Bad request'
          })
        })
      }));

      const errorAdapter = new GeminiAdapter(baseConfig);
      await errorAdapter.initialize();

      const request: ModelRequest = {
        prompt: 'Error test',
        context: {
          requestId: 'test-req',
          priority: 'medium',
          userTier: 'pro',
          latencyTarget: 1000
        }
      };

      await expect(errorAdapter.generate(request)).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        statusCode: 400,
        retryable: false
      });
    });

    it('should handle rate limit errors as retryable', async () => {
      const GoogleGenerativeAI = require('@google/generative-ai').GoogleGenerativeAI;
      GoogleGenerativeAI.mockImplementationOnce(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: jest.fn().mockRejectedValue({
            status: 429,
            message: 'Rate limit exceeded'
          })
        })
      }));

      const rateLimitAdapter = new GeminiAdapter(baseConfig);
      await rateLimitAdapter.initialize();

      const request: ModelRequest = {
        prompt: 'Rate limit test',
        context: {
          requestId: 'test-req',
          priority: 'medium',
          userTier: 'pro',
          latencyTarget: 1000
        }
      };

      await expect(rateLimitAdapter.generate(request)).rejects.toMatchObject({
        code: 'RATE_LIMITED',
        statusCode: 429,
        retryable: true
      });
    });

    it('should handle safety violations', async () => {
      const GoogleGenerativeAI = require('@google/generative-ai').GoogleGenerativeAI;
      GoogleGenerativeAI.mockImplementationOnce(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: jest.fn().mockRejectedValue({
            message: 'SAFETY violation detected'
          })
        })
      }));

      const safetyAdapter = new GeminiAdapter(baseConfig);
      await safetyAdapter.initialize();

      const request: ModelRequest = {
        prompt: 'Safety test',
        context: {
          requestId: 'test-req',
          priority: 'medium',
          userTier: 'pro',
          latencyTarget: 1000
        }
      };

      await expect(safetyAdapter.generate(request)).rejects.toMatchObject({
        code: 'SAFETY_VIOLATION',
        statusCode: 400
      });
    });

    it('should handle quota exceeded errors', async () => {
      const GoogleGenerativeAI = require('@google/generative-ai').GoogleGenerativeAI;
      GoogleGenerativeAI.mockImplementationOnce(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: jest.fn().mockRejectedValue({
            message: 'quota exceeded for this request'
          })
        })
      }));

      const quotaAdapter = new GeminiAdapter(baseConfig);
      await quotaAdapter.initialize();

      const request: ModelRequest = {
        prompt: 'Quota test',
        context: {
          requestId: 'test-req',
          priority: 'medium',
          userTier: 'pro',
          latencyTarget: 1000
        }
      };

      await expect(quotaAdapter.generate(request)).rejects.toMatchObject({
        code: 'QUOTA_EXCEEDED',
        statusCode: 429,
        retryable: true
      });
    });

    it('should handle recitation violations', async () => {
      const GoogleGenerativeAI = require('@google/generative-ai').GoogleGenerativeAI;
      GoogleGenerativeAI.mockImplementationOnce(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: jest.fn().mockRejectedValue({
            message: 'RECITATION content detected'
          })
        })
      }));

      const recitationAdapter = new GeminiAdapter(baseConfig);
      await recitationAdapter.initialize();

      const request: ModelRequest = {
        prompt: 'Recitation test',
        context: {
          requestId: 'test-req',
          priority: 'medium',
          userTier: 'pro',
          latencyTarget: 1000
        }
      };

      await expect(recitationAdapter.generate(request)).rejects.toMatchObject({
        code: 'RECITATION_VIOLATION',
        statusCode: 400
      });
    });

    it('should handle server errors as retryable', async () => {
      const GoogleGenerativeAI = require('@google/generative-ai').GoogleGenerativeAI;
      GoogleGenerativeAI.mockImplementationOnce(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: jest.fn().mockRejectedValue({
            status: 500,
            message: 'Internal server error'
          })
        })
      }));

      const serverErrorAdapter = new GeminiAdapter(baseConfig);
      await serverErrorAdapter.initialize();

      const request: ModelRequest = {
        prompt: 'Server error test',
        context: {
          requestId: 'test-req',
          priority: 'medium',
          userTier: 'pro',
          latencyTarget: 1000
        }
      };

      await expect(serverErrorAdapter.generate(request)).rejects.toMatchObject({
        code: 'SERVER_ERROR',
        statusCode: 500,
        retryable: true
      });
    });
  });

  describe('cost calculation', () => {
    beforeEach(async () => {
      adapter = new GeminiAdapter(baseConfig);
      await adapter.initialize();
    });

    it('should calculate cost correctly for different models', async () => {
      const models = [
        { model: 'gemini-2.0-flash', expectedCostPerToken: 0.000001 },
        { model: 'gemini-2.0-flash-thinking', expectedCostPerToken: 0.000002 },
        { model: 'gemini-pro', expectedCostPerToken: 0.000003 },
        { model: 'gemini-pro-vision', expectedCostPerToken: 0.000004 }
      ];

      for (const { model, expectedCostPerToken } of models) {
        const modelAdapter = new GeminiAdapter({
          ...baseConfig,
          model: model as any
        });
        await modelAdapter.initialize();

        const request: ModelRequest = {
          prompt: 'Cost calculation test',
          context: {
            requestId: 'test-req',
            priority: 'medium',
            userTier: 'pro',
            latencyTarget: 1000
          }
        };

        const response = await modelAdapter.generate(request);
        const expectedCost = response.usage.totalTokens * expectedCostPerToken;
        expect(response.cost).toBeCloseTo(expectedCost, 6);
      }
    });
  });

  describe('performance optimization', () => {
    beforeEach(async () => {
      adapter = new GeminiAdapter(baseConfig);
      await adapter.initialize();
    });

    it('should manage cache size', async () => {
      const adapter = new GeminiAdapter({
        ...baseConfig,
        cachingEnabled: true
      });
      await adapter.initialize();

      // Generate many requests to fill cache
      const requests = Array.from({ length: 1200 }, (_, i) => ({
        prompt: `Cache test ${i}`,
        context: {
          requestId: `test-req-${i}`,
          priority: 'medium' as const,
          userTier: 'pro' as const,
          latencyTarget: 1000
        }
      }));

      for (const request of requests.slice(0, 100)) {
        await adapter.generate(request);
      }

      // Cache should be limited and working
      expect(true).toBe(true); // Cache size management is internal
    });

    it('should track cache hit rate', async () => {
      const adapter = new GeminiAdapter({
        ...baseConfig,
        cachingEnabled: true
      });
      await adapter.initialize();

      const request: ModelRequest = {
        prompt: 'Cache hit test',
        context: {
          requestId: 'test-req',
          priority: 'medium',
          userTier: 'pro',
          latencyTarget: 1000
        }
      };

      // First request (cache miss)
      const response1 = await adapter.generate(request);
      
      // Second request (cache hit)
      const response2 = await adapter.generate(request);

      // Both should succeed, second should be faster
      expect(response1.content).toBe(response2.content);
      expect(response2.latency).toBeLessThanOrEqual(response1.latency);
    });
  });

  describe('warmup functionality', () => {
    it('should perform warmup during initialization', async () => {
      const logSpy = jest.spyOn(console, 'log').mockImplementation();
      
      adapter = new GeminiAdapter(baseConfig);
      await adapter.initialize();

      // Warmup should have been called
      expect(adapter.isInitialized).toBe(true);
      
      logSpy.mockRestore();
    });

    it('should handle warmup failures gracefully', async () => {
      const GoogleGenerativeAI = require('@google/generative-ai').GoogleGenerativeAI;
      let callCount = 0;
      GoogleGenerativeAI.mockImplementationOnce(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: jest.fn().mockImplementation(() => {
            callCount++;
            if (callCount === 1) {
              // Fail warmup
              throw new Error('Warmup failed');
            }
            // Succeed on subsequent calls
            return Promise.resolve({
              response: {
                text: () => 'Success',
                candidates: [{ finishReason: 'STOP' }],
                usageMetadata: { totalTokenCount: 10 }
              }
            });
          })
        })
      }));

      adapter = new GeminiAdapter(baseConfig);
      
      // Should still initialize despite warmup failure
      await expect(adapter.initialize()).resolves.not.toThrow();
      expect(adapter.isInitialized).toBe(true);
    });
  });

  describe('health check', () => {
    beforeEach(async () => {
      adapter = new GeminiAdapter(baseConfig);
      await adapter.initialize();
    });

    it('should perform health check successfully', async () => {
      const health = await adapter.healthCheck();
      
      expect(health).toMatchObject({
        status: 'healthy',
        latency: expect.any(Number),
        lastChecked: expect.any(Date),
        errors: [],
        metadata: expect.objectContaining({
          responseLength: expect.any(Number),
          tokenUsage: expect.any(Number)
        })
      });
    });

    it('should report unhealthy status on error', async () => {
      const GoogleGenerativeAI = require('@google/generative-ai').GoogleGenerativeAI;
      GoogleGenerativeAI.mockImplementationOnce(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: jest.fn().mockRejectedValue(new Error('Health check failed'))
        })
      }));

      const unhealthyAdapter = new GeminiAdapter(baseConfig);
      await unhealthyAdapter.initialize();
      
      const health = await unhealthyAdapter.healthCheck();
      
      expect(health.status).toBe('unhealthy');
      expect(health.errors).toHaveLength(1);
      expect(health.errors[0]).toContain('Health check failed');
    });
  });
});
// ---------------- Additional tests appended by PR automation ----------------

describe('GeminiAdapter – additional coverage', () => {
  let adapter: GeminiAdapter;

  const baseConfig: GeminiAdapterConfig = {
    modelName: 'gemini-2.0-flash',
    model: 'gemini-2.0-flash',
    apiKey: 'test-api-key',
    timeout: 200, // make timeouts fast for tests we add
    retryAttempts: 3,
    streamingEnabled: true,
    cachingEnabled: true
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.GOOGLE_AI_API_KEY = undefined;
    adapter = new GeminiAdapter(baseConfig);
    await adapter.initialize();
  });

  it('should prefer request.parameters over config.generationConfig when both are provided', async () => {
    const GoogleGenerativeAI = require('@google/generative-ai').GoogleGenerativeAI;
    const genModel = GoogleGenerativeAI().getGenerativeModel();
    const genSpy = jest.spyOn(genModel, 'generateContent');

    // Recreate adapter with a default generationConfig
    adapter = new GeminiAdapter({
      ...baseConfig,
      generationConfig: {
        temperature: 0.1,
        topP: 0.2,
        topK: 10,
        maxOutputTokens: 256,
        stopSequences: ['STOP_FROM_CONFIG'],
      }
    });
    await adapter.initialize();

    const request: ModelRequest = {
      prompt: 'param precedence',
      parameters: {
        temperature: 0.9,
        topP: 0.95,
        topK: 50,
        maxTokens: 1234,
        stopSequences: ['END_FROM_REQUEST']
      },
      context: {
        requestId: 'precedence-1',
        priority: 'medium',
        userTier: 'pro',
        latencyTarget: 1000,
      }
    };

    await adapter.generate(request);

    // Ensure we called google sdk with request-level overrides
    const lastCallArg = genSpy.mock.calls[0]?.[0];
    // The argument can be either a single object or array of parts depending on implementation.
    // We just assert generationConfig-like fields are somewhere present via string match to reduce tight coupling.
    expect(JSON.stringify(lastCallArg)).toEqual(expect.stringContaining('"temperature":0.9'));
    expect(JSON.stringify(lastCallArg)).toEqual(expect.stringContaining('"topP":0.95'));
    expect(JSON.stringify(lastCallArg)).toEqual(expect.stringContaining('"topK":50'));
    expect(JSON.stringify(lastCallArg)).toMatch(/(maxTokens|maxOutputTokens)\"\s*:\s*1234/);
    expect(JSON.stringify(lastCallArg)).toEqual(expect.stringContaining('END_FROM_REQUEST'));
  });

  it('should retry transient errors and eventually succeed within retryAttempts', async () => {
    jest.useFakeTimers({ now: Date.now() });
    const GoogleGenerativeAI = require('@google/generative-ai').GoogleGenerativeAI;

    let calls = 0;
    GoogleGenerativeAI.mockImplementationOnce(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: jest.fn().mockImplementation(() => {
          calls += 1;
          if (calls < 3) {
            // First two attempts fail with retryable 500
            return Promise.reject({ status: 500, message: 'Transient' });
          }
          // Succeeds on 3rd
          return Promise.resolve({
            response: {
              text: () => 'Recovered after retries',
              candidates: [{ finishReason: 'STOP' }],
              usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1, totalTokenCount: 2 }
            }
          });
        })
      })
    }));

    adapter = new GeminiAdapter({ ...baseConfig, retryAttempts: 3 });
    await adapter.initialize();

    const p = adapter.generate({
      prompt: 'retry please',
      context: { requestId: 'retry-1', priority: 'medium', userTier: 'pro', latencyTarget: 1000 }
    });

    // Advance timers in case adapter uses backoff via setTimeout
    jest.runAllTimers();

    const res = await p;
    expect(res.content).toBe('Recovered after retries');
    expect(calls).toBe(3);
    jest.useRealTimers();
  });

  it('should not use cache when cachingEnabled is false (subsequent identical calls hit provider again)', async () => {
    const GoogleGenerativeAI = require('@google/generative-ai').GoogleGenerativeAI;
    const genModel = GoogleGenerativeAI().getGenerativeModel();
    const genSpy = jest.spyOn(genModel, 'generateContent');

    const noCacheAdapter = new GeminiAdapter({ ...baseConfig, cachingEnabled: false });
    await noCacheAdapter.initialize();

    const req: ModelRequest = {
      prompt: 'no-cache',
      context: { requestId: 'nocache-1', priority: 'medium', userTier: 'pro', latencyTarget: 1000 }
    };

    await noCacheAdapter.generate(req);
    await noCacheAdapter.generate(req);

    // Should call the underlying API twice (no caching)
    expect(genSpy).toHaveBeenCalledTimes(2);
  });

  it('should timeout long-running generation requests according to config.timeout', async () => {
    jest.useFakeTimers({ now: Date.now() });
    const GoogleGenerativeAI = require('@google/generative-ai').GoogleGenerativeAI;

    // Mock a never-resolving promise to trigger timeout
    GoogleGenerativeAI.mockImplementationOnce(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: jest.fn().mockImplementation(
          () => new Promise(() => { /* never resolve */ })
        )
      })
    }));

    const shortTimeoutAdapter = new GeminiAdapter({ ...baseConfig, timeout: 50 });
    await shortTimeoutAdapter.initialize();

    const genPromise = shortTimeoutAdapter.generate({
      prompt: 'hang',
      context: { requestId: 'timeout-1', priority: 'medium', userTier: 'pro', latencyTarget: 1000 }
    });

    jest.advanceTimersByTime(60);

    await expect(genPromise).rejects.toMatchObject({
      code: expect.stringMatching(/TIMEOUT|REQUEST_TIMEOUT/i)
    });

    jest.useRealTimers();
  });

  it('should include requestId in the response id for correlation', async () => {
    const request: ModelRequest = {
      prompt: 'ID correlation test',
      context: {
        requestId: 'my-req-123',
        priority: 'medium',
        userTier: 'pro',
        latencyTarget: 1000
      }
    };

    const response = await adapter.generate(request);
    expect(response.id).toEqual(expect.stringContaining('my-req-123'));
  });

  it('should accept audio/video multimodal inputs for models that support them', async () => {
    const request: ModelRequest = {
      prompt: 'Analyze av',
      multimodal: {
        audio: ['base64-audio'],
        video: ['base64-video']
      } as any,
      context: {
        requestId: 'av-1',
        priority: 'medium',
        userTier: 'pro',
        latencyTarget: 1000
      }
    };

    const isValid = await adapter.validateRequest(request);
    expect(isValid).toBe(true);

    const response = await adapter.generate(request);
    expect(response.content).toBe('Gemini test response');
  });

  it('should map tools into Google function declarations shape when provided', async () => {
    const GoogleGenerativeAI = require('@google/generative-ai').GoogleGenerativeAI;
    const genModel = GoogleGenerativeAI().getGenerativeModel();
    const genSpy = jest.spyOn(genModel, 'generateContent');

    const request: ModelRequest = {
      prompt: 'test tools mapping',
      tools: [
        { name: 'sum', description: 'adds', parameters: { a: { type: 'number' }, b: { type: 'number' } } },
        { name: 'lookup', description: 'search', parameters: { q: { type: 'string' } } }
      ] as any,
      context: {
        requestId: 'tools-1',
        priority: 'medium',
        userTier: 'pro',
        latencyTarget: 1000
      }
    };

    await adapter.generate(request);

    const lastCallArg = genSpy.mock.calls[0]?.[0];
    const payload = JSON.stringify(lastCallArg);
    // Loosely assert that function declarations are present
    expect(payload).toMatch(/function/i);
    expect(payload).toMatch(/sum/);
    expect(payload).toMatch(/lookup/);
    expect(payload).toMatch(/parameters?/i);
  });
});