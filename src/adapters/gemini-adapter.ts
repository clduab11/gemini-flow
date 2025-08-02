/**
 * Gemini Model Adapter
 * 
 * Specialized adapter for Gemini 2.0 Flash and Gemini Pro models
 * Optimized for <75ms routing with streaming support
 */

import { GoogleGenerativeAI, GenerativeModel, GenerateContentResult } from '@google/generative-ai';
import { 
  BaseModelAdapter, 
  ModelCapabilities, 
  ModelRequest, 
  ModelResponse, 
  StreamChunk,
  AdapterConfig,
  AdapterError 
} from './base-model-adapter.js';

export interface GeminiAdapterConfig extends AdapterConfig {
  model: 'gemini-2.0-flash' | 'gemini-2.0-flash-thinking' | 'gemini-2.5-flash' | 'gemini-2.5-pro' | 'gemini-2.5-deep-think' | 'gemini-pro' | 'gemini-pro-vision';
  safetySettings?: any[];
  generationConfig?: {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxOutputTokens?: number;
    stopSequences?: string[];
    responseMimeType?: string;
  };
}

export class GeminiAdapter extends BaseModelAdapter {
  private genAI: GoogleGenerativeAI;
  private model!: GenerativeModel; // Initialized in initialize()
  private modelName: string;

  // Performance optimization cache
  private requestCache = new Map<string, ModelResponse>();
  private cacheHits = 0;
  private totalRequests = 0;

  constructor(config: GeminiAdapterConfig) {
    super(config);
    this.modelName = config.model;
    
    if (!config.apiKey && !process.env.GOOGLE_AI_API_KEY) {
      throw this.createError(
        'Google AI API key required',
        'MISSING_API_KEY',
        401,
        false
      );
    }

    this.genAI = new GoogleGenerativeAI(config.apiKey || process.env.GOOGLE_AI_API_KEY!);
  }

  async initialize(): Promise<void> {
    try {
      const modelConfig = {
        model: this.modelName,
        generationConfig: (this.config as GeminiAdapterConfig).generationConfig,
        safetySettings: (this.config as GeminiAdapterConfig).safetySettings
      };

      this.model = this.genAI.getGenerativeModel(modelConfig);
      this.isInitialized = true;
      
      this.logger.info('Gemini adapter initialized', { 
        model: this.modelName,
        streaming: this.config.streamingEnabled
      });

      // Warm up the model with a quick test
      await this.warmUp();

    } catch (error) {
      this.logger.error('Failed to initialize Gemini adapter', { error, model: this.modelName });
      throw this.handleError(error, {} as ModelRequest);
    }
  }

  getModelCapabilities(): ModelCapabilities {
    const baseCapabilities = {
      textGeneration: true,
      streaming: true,
      functionCalling: true,
      supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'],
      inputTypes: ['text'],
      outputTypes: ['text']
    };

    switch (this.modelName) {
      case 'gemini-2.0-flash':
        return {
          ...baseCapabilities,
          codeGeneration: true,
          multimodal: true,
          longContext: false,
          reasoning: true,
          multiAgent: false,
          complexProblemSolving: false,
          chainOfThought: false,
          maxTokens: 1000000,
          inputTypes: ['text', 'image', 'audio', 'video'],
          outputTypes: ['text', 'audio']
        };

      case 'gemini-2.5-flash':
        return {
          ...baseCapabilities,
          codeGeneration: true,
          multimodal: true,
          longContext: false,
          reasoning: true, // Enhanced reasoning
          multiAgent: true,
          complexProblemSolving: true,
          chainOfThought: true,
          maxTokens: 1000000,
          inputTypes: ['text', 'image', 'audio', 'video'],
          outputTypes: ['text', 'audio']
        };

      case 'gemini-2.0-flash-thinking':
        return {
          ...baseCapabilities,
          codeGeneration: true,
          multimodal: true,
          longContext: false,
          reasoning: true, // Advanced reasoning
          multiAgent: true,
          complexProblemSolving: true,
          chainOfThought: true,
          maxTokens: 1000000,
          inputTypes: ['text', 'image', 'audio', 'video'],
          outputTypes: ['text', 'audio']
        };

      case 'gemini-2.5-pro':
        return {
          ...baseCapabilities,
          codeGeneration: true,
          multimodal: true,
          longContext: true,
          reasoning: true, // Advanced reasoning
          multiAgent: true,
          complexProblemSolving: true,
          chainOfThought: true,
          maxTokens: 2000000,
          inputTypes: ['text', 'image', 'audio', 'video'],
          outputTypes: ['text', 'audio']
        };

      case 'gemini-2.5-deep-think':
        return {
          ...baseCapabilities,
          codeGeneration: true,
          multimodal: true,
          longContext: true,
          reasoning: true, // Deep reasoning capabilities
          maxTokens: 2000000,
          inputTypes: ['text', 'image', 'audio', 'video'],
          outputTypes: ['text', 'audio'],
          // Special capabilities for Deep Think
          multiAgent: true,
          complexProblemSolving: true,
          chainOfThought: true
        };

      case 'gemini-pro':
        return {
          ...baseCapabilities,
          codeGeneration: true,
          multimodal: false,
          longContext: true,
          reasoning: true,
          multiAgent: false,
          complexProblemSolving: false,
          chainOfThought: false,
          maxTokens: 1000000,
          inputTypes: ['text'],
          outputTypes: ['text']
        };

      case 'gemini-pro-vision':
        return {
          ...baseCapabilities,
          codeGeneration: true,
          multimodal: true,
          longContext: true,
          reasoning: true,
          multiAgent: false,
          complexProblemSolving: false,
          chainOfThought: false,
          maxTokens: 1000000,
          inputTypes: ['text', 'image'],
          outputTypes: ['text']
        };

      default:
        return baseCapabilities as ModelCapabilities;
    }
  }

  async generate(request: ModelRequest): Promise<ModelResponse> {
    const startTime = performance.now();
    this.totalRequests++;
    
    this.ensureInitialized();
    await this.validateRequest(request);

    // Check cache for identical requests
    const cacheKey = this.generateCacheKey(request);
    if (this.config.cachingEnabled && this.requestCache.has(cacheKey)) {
      this.cacheHits++;
      const cached = this.requestCache.get(cacheKey)!;
      this.logPerformance('generate', performance.now() - startTime, true, { cached: true });
      return { ...cached, timestamp: new Date() };
    }

    try {
      const transformedRequest = this.transformRequest(request);
      const result = await this.model.generateContent(transformedRequest);
      
      const response = this.transformResponse(result, request);
      response.latency = performance.now() - startTime;

      // Cache successful responses
      if (this.config.cachingEnabled && response.finishReason === 'STOP') {
        this.requestCache.set(cacheKey, response);
        
        // Limit cache size
        if (this.requestCache.size > 1000) {
          const firstKey = this.requestCache.keys().next().value;
          if (firstKey) {
            this.requestCache.delete(firstKey);
          }
        }
      }

      this.logPerformance('generate', response.latency, true, {
        tokenUsage: response.usage,
        cacheHitRate: this.cacheHits / this.totalRequests
      });

      return response;

    } catch (error) {
      const latency = performance.now() - startTime;
      this.logPerformance('generate', latency, false, { error: error instanceof Error ? error.message : String(error) });
      throw this.handleError(error, request);
    }
  }

  async *generateStream(request: ModelRequest): AsyncIterableIterator<StreamChunk> {
    const startTime = performance.now();
    this.totalRequests++;

    this.ensureInitialized();
    await this.validateRequest(request);

    if (!this.capabilities.streaming) {
      throw this.createError(
        'Streaming not supported by this model',
        'STREAMING_NOT_SUPPORTED',
        400,
        false
      );
    }

    try {
      const transformedRequest = this.transformRequest(request);
      const stream = await this.model.generateContentStream(transformedRequest);

      let chunkIndex = 0;
      let accumulatedContent = '';

      for await (const chunk of stream.stream) {
        const text = chunk.text();
        accumulatedContent += text;

        const streamChunk: StreamChunk = {
          id: `${request.context?.requestId || this.generateRequestId()}-${chunkIndex}`,
          content: accumulatedContent,
          delta: text,
          metadata: {
            chunkIndex,
            timestamp: Date.now(),
            model: this.modelName
          }
        };

        // Check if this is the final chunk
        if (chunk.candidates?.[0]?.finishReason) {
          streamChunk.finishReason = chunk.candidates[0].finishReason;
        }

        yield streamChunk;
        chunkIndex++;
      }

      const latency = performance.now() - startTime;
      this.logPerformance('generateStream', latency, true, {
        chunks: chunkIndex,
        totalLength: accumulatedContent.length
      });

    } catch (error) {
      const latency = performance.now() - startTime;
      this.logPerformance('generateStream', latency, false, { error: error instanceof Error ? error.message : String(error) });
      throw this.handleError(error, request);
    }
  }

  async validateRequest(request: ModelRequest): Promise<boolean> {
    if (!request.prompt || typeof request.prompt !== 'string') {
      throw this.createError(
        'Prompt is required and must be a string',
        'INVALID_PROMPT',
        400,
        false
      );
    }

    if (request.prompt.length > this.capabilities.maxTokens) {
      throw this.createError(
        `Prompt too long. Max tokens: ${this.capabilities.maxTokens}`,
        'PROMPT_TOO_LONG',
        400,
        false
      );
    }

    // Validate multimodal content if present
    if (request.multimodal) {
      if (!this.capabilities.multimodal) {
        throw this.createError(
          'Multimodal input not supported by this model',
          'MULTIMODAL_NOT_SUPPORTED',
          400,
          false
        );
      }

      // Validate supported input types
      const supportedTypes = this.capabilities.inputTypes;
      if (request.multimodal.images && !supportedTypes.includes('image')) {
        throw this.createError(
          'Image input not supported by this model',
          'IMAGE_NOT_SUPPORTED',
          400,
          false
        );
      }
    }

    return true;
  }

  protected transformRequest(request: ModelRequest): any {
    const parts: any[] = [{ text: request.prompt }];

    // Add multimodal content
    if (request.multimodal) {
      if (request.multimodal.images) {
        for (const imageData of request.multimodal.images) {
          parts.push({
            inlineData: {
              mimeType: 'image/jpeg', // Assume JPEG, could be enhanced
              data: imageData
            }
          });
        }
      }
    }

    const contents = [{ role: 'user', parts }];

    // Add system message if provided
    if (request.systemMessage) {
      contents.unshift({
        role: 'model',
        parts: [{ text: request.systemMessage }]
      });
    }

    return {
      contents,
      generationConfig: {
        temperature: request.parameters?.temperature ?? 0.7,
        topP: request.parameters?.topP ?? 0.9,
        topK: request.parameters?.topK ?? 40,
        maxOutputTokens: request.parameters?.maxTokens ?? 4096,
        stopSequences: request.parameters?.stopSequences,
      },
      tools: request.tools
    };
  }

  protected transformResponse(result: GenerateContentResult, request: ModelRequest): ModelResponse {
    const response = result.response;
    const text = response.text();
    const usage = (response as any).usageMetadata;

    return {
      id: request.context?.requestId || this.generateRequestId(),
      content: text,
      model: this.modelName,
      timestamp: new Date(),
      latency: 0, // Will be set by caller
      usage: {
        promptTokens: usage?.promptTokenCount || 0,
        completionTokens: usage?.candidatesTokenCount || 0,
        totalTokens: usage?.totalTokenCount || 0
      },
      cost: this.calculateCost(
        { totalTokens: usage?.totalTokenCount || 0 },
        this.getCostPerToken()
      ),
      finishReason: response.candidates?.[0]?.finishReason || 'STOP',
      metadata: {
        model: this.modelName,
        safetyRatings: response.candidates?.[0]?.safetyRatings,
        citationMetadata: response.candidates?.[0]?.citationMetadata
      }
    };
  }

  protected handleError(error: any, request: ModelRequest): AdapterError {
    let code = 'UNKNOWN_ERROR';
    let statusCode = 500;
    let retryable = false;
    let message = error.message || 'Unknown error occurred';

    // Handle Google AI API specific errors
    if (error.status) {
      statusCode = error.status;
      
      switch (error.status) {
        case 400:
          code = 'BAD_REQUEST';
          break;
        case 401:
          code = 'UNAUTHORIZED';
          break;
        case 403:
          code = 'FORBIDDEN';
          break;
        case 429:
          code = 'RATE_LIMITED';
          retryable = true;
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          code = 'SERVER_ERROR';
          retryable = true;
          break;
      }
    }

    // Handle specific Gemini errors
    if (error.message?.includes('SAFETY')) {
      code = 'SAFETY_VIOLATION';
      statusCode = 400;
    } else if (error.message?.includes('RECITATION')) {
      code = 'RECITATION_VIOLATION';
      statusCode = 400;
    } else if (error.message?.includes('quota')) {
      code = 'QUOTA_EXCEEDED';
      statusCode = 429;
      retryable = true;
    }

    const adapterError = this.createError(message, code, statusCode, retryable, {
      originalError: error,
      requestId: request.context?.requestId,
      model: this.modelName
    });

    this.logger.error('Gemini adapter error', {
      code,
      statusCode,
      message,
      retryable,
      model: this.modelName,
      requestId: request.context?.requestId
    });

    return adapterError;
  }

  /**
   * Warm up the model with a quick request
   */
  private async warmUp(): Promise<void> {
    try {
      const warmupRequest: ModelRequest = {
        prompt: 'Hello',
        context: {
          requestId: 'warmup',
          priority: 'low',
          userTier: 'free',
          latencyTarget: 1000
        },
        parameters: {
          maxTokens: 5,
          temperature: 0.1
        }
      };

      await this.generate(warmupRequest);
      this.logger.debug('Model warmed up successfully');
    } catch (error) {
      this.logger.warn('Model warmup failed', { error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(request: ModelRequest): string {
    const key = {
      prompt: request.prompt.substring(0, 100),
      model: this.modelName,
      temperature: request.parameters?.temperature,
      maxTokens: request.parameters?.maxTokens
    };
    
    return Buffer.from(JSON.stringify(key)).toString('base64').substring(0, 32);
  }

  /**
   * Get cost per token for this model
   */
  private getCostPerToken(): number {
    switch (this.modelName) {
      case 'gemini-2.0-flash':
        return 0.000001; // $0.001 per 1K tokens
      case 'gemini-2.5-flash':
        return 0.0000006; // $0.0006 per 1K tokens (improved efficiency)
      case 'gemini-2.0-flash-thinking':
        return 0.000002; // $0.002 per 1K tokens
      case 'gemini-2.5-pro':
        return 0.0000012; // $0.0012 per 1K tokens
      case 'gemini-2.5-deep-think':
        return 0.000005; // $0.005 per 1K tokens (Premium - Coming Soon)
      case 'gemini-pro':
        return 0.000003; // $0.003 per 1K tokens
      case 'gemini-pro-vision':
        return 0.000004; // $0.004 per 1K tokens
      default:
        return 0.000001;
    }
  }
}