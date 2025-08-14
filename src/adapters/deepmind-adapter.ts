/**
 * DeepMind 2.5 Model Adapter
 * 
 * Specialized adapter for DeepMind Gemini 2.5 models
 * Features advanced reasoning, long-context, and enterprise-grade capabilities
 */

import { 
  BaseModelAdapter, 
  ModelCapabilities, 
  ModelRequest, 
  ModelResponse, 
  StreamChunk,
  AdapterConfig,
  AdapterError 
} from './base-model-adapter.js';
import { safeImport } from '../utils/feature-detection.js';

export interface DeepMindAdapterConfig extends AdapterConfig {
  model: 'gemini-2.5-deepmind' | 'gemini-2.5-ultra' | 'gemini-2.5-pro';
  projectId: string;
  location: string;
  serviceAccountKey?: string;
  vertexEndpoint?: string;
  advancedReasoning?: boolean;
  longContextMode?: boolean;
  enterpriseFeatures?: {
    dataResidency?: string;
    auditLogging?: boolean;
    encryption?: 'standard' | 'cmek';
    accessControls?: string[];
  };
}

export class DeepMindAdapter extends BaseModelAdapter {
  private auth: any; // GoogleAuth when available
  private modelName: string;
  private projectId: string;
  private location: string;
  private client: any;

  // Advanced reasoning cache for complex queries
  private reasoningCache = new Map<string, any>();
  private contextWindows = new Map<string, string[]>(); // For long-context management

  constructor(config: DeepMindAdapterConfig) {
    super(config);
    this.modelName = config.model;
    this.projectId = config.projectId;
    this.location = config.location;

    if (!config.projectId) {
      throw this.createError(
        'Project ID is required for DeepMind models',
        'MISSING_PROJECT_ID',
        400,
        false
      );
    }

    // Auth will be initialized in initialize() method with conditional import
    this.auth = null;
  }

  async initialize(): Promise<void> {
    try {
      // Try to initialize Google Auth with conditional import
      const googleAuthLib = await safeImport('google-auth-library');
      
      if (!googleAuthLib?.GoogleAuth) {
        throw this.createError(
          'Google Auth Library not available. Install google-auth-library for DeepMind features.',
          'MISSING_DEPENDENCY',
          500,
          false
        );
      }

      // Initialize Google Auth for Vertex AI
      this.auth = new googleAuthLib.GoogleAuth({
        keyFile: (this.config as DeepMindAdapterConfig).serviceAccountKey,
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
        projectId: this.projectId
      });

      // Get authenticated client
      const authClient = await this.auth.getClient();
      
      // Initialize Vertex AI client
      this.client = {
        auth: authClient,
        endpoint: (this.config as DeepMindAdapterConfig).vertexEndpoint || 
                 `https://${this.location}-aiplatform.googleapis.com`,
        projectId: this.projectId,
        location: this.location
      };

      this.isInitialized = true;
      
      this.logger.info('DeepMind adapter initialized', { 
        model: this.modelName,
        project: this.projectId,
        location: this.location,
        advancedReasoning: (this.config as DeepMindAdapterConfig).advancedReasoning,
        longContext: (this.config as DeepMindAdapterConfig).longContextMode
      });

      // Initialize enterprise features if configured
      await this.initializeEnterpriseFeatures();

    } catch (error) {
      this.logger.error('Failed to initialize DeepMind adapter', { error, model: this.modelName });
      throw this.handleError(error, {} as ModelRequest);
    }
  }

  getModelCapabilities(): ModelCapabilities {
    const baseCapabilities = {
      textGeneration: true,
      streaming: true,
      functionCalling: true,
      supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi'],
      inputTypes: ['text', 'image', 'audio', 'video', 'document'],
      outputTypes: ['text', 'audio', 'structured']
    };

    switch (this.modelName) {
      case 'gemini-2.5-deepmind':
        return {
          ...baseCapabilities,
          codeGeneration: true,
          multimodal: true,
          longContext: true,
          reasoning: true, // Advanced reasoning with chain-of-thought
          multiAgent: true,
          complexProblemSolving: true,
          chainOfThought: true,
          maxTokens: 2000000, // 2M token context window
        };

      case 'gemini-2.5-ultra':
        return {
          ...baseCapabilities,
          codeGeneration: true,
          multimodal: true,
          longContext: true,
          reasoning: true, // Ultra-advanced reasoning
          multiAgent: true,
          complexProblemSolving: true,
          chainOfThought: true,
          maxTokens: 4000000, // 4M token context window
        };

      case 'gemini-2.5-pro':
        return {
          ...baseCapabilities,
          codeGeneration: true,
          multimodal: true,
          longContext: true,
          reasoning: true, // Professional-grade reasoning
          multiAgent: true,
          complexProblemSolving: true,
          chainOfThought: true,
          maxTokens: 1000000, // 1M token context window
        };

      default:
        return baseCapabilities as ModelCapabilities;
    }
  }

  async generate(request: ModelRequest): Promise<ModelResponse> {
    const startTime = performance.now();
    
    this.ensureInitialized();
    await this.validateRequest(request);

    // Check reasoning cache for complex queries
    const reasoningKey = this.generateReasoningKey(request);
    if (this.reasoningCache.has(reasoningKey) && this.isComplexReasoning(request)) {
      const cached = this.reasoningCache.get(reasoningKey);
      this.logger.debug('Using cached reasoning result', { key: reasoningKey });
      return { ...cached, timestamp: new Date() };
    }

    try {
      // Prepare context with long-context optimization if needed
      const optimizedContext = await this.optimizeContext(request);
      
      // Build Vertex AI request
      const vertexRequest = this.transformRequest(optimizedContext);
      
      // Enhanced request for DeepMind capabilities
      if ((this.config as DeepMindAdapterConfig).advancedReasoning && this.isComplexReasoning(request)) {
        vertexRequest.parameters = {
          ...vertexRequest.parameters,
          reasoning_mode: 'chain_of_thought',
          explanation_depth: 'detailed',
          verification_steps: true
        };
      }

      // Execute request via Vertex AI
      const result = await this.executeVertexRequest(vertexRequest);
      
      const response = this.transformResponse(result, request);
      response.latency = performance.now() - startTime;

      // Cache reasoning results for complex queries
      if (this.isComplexReasoning(request) && response.finishReason === 'STOP') {
        this.reasoningCache.set(reasoningKey, response);
      }

      this.logPerformance('generate', response.latency, true, {
        tokenUsage: response.usage,
        reasoning: this.isComplexReasoning(request),
        longContext: optimizedContext.prompt.length > 100000
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

    this.ensureInitialized();
    await this.validateRequest(request);

    try {
      const optimizedContext = await this.optimizeContext(request);
      const vertexRequest = this.transformRequest(optimizedContext);
      
      // Enable streaming in Vertex request
      vertexRequest.stream = true;

      const stream = await this.executeVertexStreamRequest(vertexRequest);

      let chunkIndex = 0;
      let accumulatedContent = '';
      const reasoningSteps: string[] = [];

      for await (const chunk of stream) {
        if (chunk.text) {
          const text = chunk.text;
          accumulatedContent += text;

          // Extract reasoning steps if present
          if (chunk.reasoning_step) {
            reasoningSteps.push(chunk.reasoning_step);
          }

          const streamChunk: StreamChunk = {
            id: `${request.context?.requestId || this.generateRequestId()}-${chunkIndex}`,
            content: accumulatedContent,
            delta: text,
            metadata: {
              chunkIndex,
              timestamp: Date.now(),
              model: this.modelName,
              reasoningSteps: reasoningSteps.length > 0 ? reasoningSteps : undefined
            }
          };

          if (chunk.finishReason) {
            streamChunk.finishReason = chunk.finishReason;
          }

          yield streamChunk;
          chunkIndex++;
        }
      }

      const latency = performance.now() - startTime;
      this.logPerformance('generateStream', latency, true, {
        chunks: chunkIndex,
        totalLength: accumulatedContent.length,
        reasoningSteps: reasoningSteps.length
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

    // Enhanced validation for DeepMind capabilities
    const maxTokens = this.capabilities.maxTokens;
    // Rough estimate: 1 token = 4 characters for validation
    const estimatedTokens = request.prompt.length / 4;
    if (estimatedTokens > maxTokens) {
      throw this.createError(
        `Prompt too long. Max tokens: ${maxTokens}`,
        'PROMPT_TOO_LONG',
        400,
        false
      );
    }

    // Validate enterprise features
    const config = this.config as DeepMindAdapterConfig;
    if (config.enterpriseFeatures?.accessControls) {
      const userTier = request.context?.userTier;
      if (!config.enterpriseFeatures.accessControls.includes(userTier || 'free')) {
        throw this.createError(
          'Access denied for user tier',
          'ACCESS_DENIED',
          403,
          false
        );
      }
    }

    return true;
  }

  protected transformRequest(request: ModelRequest): any {
    const instances = [{
      content: request.prompt,
      parameters: {
        temperature: request.parameters?.temperature ?? 0.7,
        topP: request.parameters?.topP ?? 0.9,
        topK: request.parameters?.topK ?? 40,
        maxOutputTokens: request.parameters?.maxTokens ?? 8192,
        stopSequences: request.parameters?.stopSequences,
      }
    }];

    // Add multimodal content for DeepMind
    if (request.multimodal) {
      (instances[0] as any).multimodal_content = {
        images: request.multimodal.images?.map(img => ({
          data: img,
          mimeType: 'image/jpeg'
        })),
        audio: request.multimodal.audio?.map(audio => ({
          data: audio,
          mimeType: 'audio/wav'
        })),
        video: request.multimodal.video?.map(video => ({
          data: video,
          mimeType: 'video/mp4'
        }))
      };
    }

    return {
      endpoint: `projects/${this.projectId}/locations/${this.location}/publishers/google/models/${this.modelName}:predict`,
      instances,
      parameters: {
        safetySettings: this.getDefaultSafetySettings(),
        ...(request.tools && { tools: request.tools })
      }
    };
  }

  protected transformResponse(result: any, request: ModelRequest): ModelResponse {
    const predictions = result.predictions?.[0] || {};
    const content = predictions.content || predictions.text || '';
    const usage = result.metadata?.tokenMetadata || {};

    return {
      id: request.context?.requestId || this.generateRequestId(),
      content,
      model: this.modelName,
      timestamp: new Date(),
      latency: 0, // Will be set by caller
      usage: {
        promptTokens: usage.inputTokenCount || 0,
        completionTokens: usage.outputTokenCount || 0,
        totalTokens: usage.totalTokenCount || 0
      },
      cost: this.calculateCost(
        { totalTokens: usage.totalTokenCount || 0 },
        this.getCostPerToken()
      ),
      finishReason: predictions.finishReason || 'STOP',
      metadata: {
        model: this.modelName,
        safetyRatings: predictions.safetyRatings,
        reasoningSteps: predictions.reasoningSteps,
        citations: predictions.citations,
        grounding: predictions.grounding
      }
    };
  }

  protected handleError(error: any, request: ModelRequest): AdapterError {
    let code = 'UNKNOWN_ERROR';
    let statusCode = 500;
    let retryable = false;
    const message = error.message || 'Unknown DeepMind error occurred';

    // Handle Vertex AI specific errors
    if (error.code) {
      statusCode = error.code;
      
      switch (error.code) {
        case 3: // INVALID_ARGUMENT
          code = 'INVALID_REQUEST';
          statusCode = 400;
          break;
        case 7: // PERMISSION_DENIED
          code = 'PERMISSION_DENIED';
          statusCode = 403;
          break;
        case 8: // RESOURCE_EXHAUSTED
          code = 'QUOTA_EXCEEDED';
          statusCode = 429;
          retryable = true;
          break;
        case 14: // UNAVAILABLE
          code = 'SERVICE_UNAVAILABLE';
          statusCode = 503;
          retryable = true;
          break;
        case 4: // DEADLINE_EXCEEDED
          code = 'TIMEOUT';
          statusCode = 408;
          retryable = true;
          break;
      }
    }

    // Handle enterprise-specific errors
    if (error.message?.includes('data residency')) {
      code = 'DATA_RESIDENCY_VIOLATION';
      statusCode = 403;
    } else if (error.message?.includes('audit')) {
      code = 'AUDIT_REQUIREMENT_FAILED';
      statusCode = 400;
    }

    const adapterError = this.createError(message, code, statusCode, retryable, {
      originalError: error,
      requestId: request.context?.requestId,
      model: this.modelName,
      projectId: this.projectId,
      location: this.location
    });

    this.logger.error('DeepMind adapter error', {
      code,
      statusCode,
      message,
      retryable,
      model: this.modelName,
      projectId: this.projectId
    });

    return adapterError;
  }

  /**
   * Execute Vertex AI request
   */
  private async executeVertexRequest(request: any): Promise<any> {
    const url = `${this.client.endpoint}/v1/${request.endpoint}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await this.client.auth.getAccessToken()}`,
        'Content-Type': 'application/json',
        'User-Agent': 'gemini-flow-deepmind-adapter/1.0.0'
      },
      body: JSON.stringify({
        instances: request.instances,
        parameters: request.parameters
      })
    });

    if (!response.ok) {
      throw new Error(`Vertex AI request failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Execute streaming Vertex AI request
   */
  private async *executeVertexStreamRequest(request: any): AsyncIterableIterator<any> {
    const url = `${this.client.endpoint}/v1/${request.endpoint}:serverStreamingPredict`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await this.client.auth.getAccessToken()}`,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify({
        instances: request.instances,
        parameters: request.parameters
      })
    });

    if (!response.ok) {
      throw new Error(`Vertex AI stream request failed: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.predictions) {
                yield data.predictions[0];
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Initialize enterprise features
   */
  private async initializeEnterpriseFeatures(): Promise<void> {
    const config = this.config as DeepMindAdapterConfig;
    
    if (config.enterpriseFeatures) {
      this.logger.info('Initializing enterprise features', {
        dataResidency: config.enterpriseFeatures.dataResidency,
        auditLogging: config.enterpriseFeatures.auditLogging,
        encryption: config.enterpriseFeatures.encryption
      });

      // Configure data residency
      if (config.enterpriseFeatures.dataResidency) {
        // Validate location matches residency requirements
        if (!this.location.includes(config.enterpriseFeatures.dataResidency)) {
          throw this.createError(
            `Data residency requirement not met: ${config.enterpriseFeatures.dataResidency}`,
            'DATA_RESIDENCY_VIOLATION',
            400,
            false
          );
        }
      }
    }
  }

  /**
   * Optimize context for long-context scenarios
   */
  private async optimizeContext(request: ModelRequest): Promise<ModelRequest> {
    const config = this.config as DeepMindAdapterConfig;
    
    if (!config.longContextMode || request.prompt.length < 50000) {
      return request; // No optimization needed
    }

    // Implement context window management for long documents
    const sessionId = request.context?.sessionId || 'default';
    const contextWindow = this.contextWindows.get(sessionId) || [];
    
    // Add current prompt to context window
    contextWindow.push(request.prompt);
    
    // Keep only recent context within token limits
    const maxContextTokens = this.capabilities.maxTokens * 0.8; // 80% for context
    while (contextWindow.join('').length > maxContextTokens && contextWindow.length > 1) {
      contextWindow.shift();
    }
    
    this.contextWindows.set(sessionId, contextWindow);
    
    return {
      ...request,
      prompt: contextWindow.join('\n\n--- Context Boundary ---\n\n')
    };
  }

  /**
   * Check if request requires complex reasoning
   */
  private isComplexReasoning(request: ModelRequest): boolean {
    const complexKeywords = [
      'analyze', 'compare', 'evaluate', 'synthesize', 'reason', 'conclude',
      'mathematical', 'logical', 'step by step', 'chain of thought'
    ];
    
    return complexKeywords.some(keyword => 
      request.prompt.toLowerCase().includes(keyword)
    ) || (request.parameters?.maxTokens || 0) > 4000;
  }

  /**
   * Generate reasoning cache key
   */
  private generateReasoningKey(request: ModelRequest): string {
    const key = {
      prompt: request.prompt.substring(0, 200),
      model: this.modelName,
      reasoning: true
    };
    
    return Buffer.from(JSON.stringify(key)).toString('base64').substring(0, 32);
  }

  /**
   * Get cost per token for DeepMind models
   */
  private getCostPerToken(): number {
    switch (this.modelName) {
      case 'gemini-2.5-deepmind':
        return 0.000005; // $0.005 per 1K tokens
      case 'gemini-2.5-ultra':
        return 0.000010; // $0.010 per 1K tokens
      case 'gemini-2.5-pro':
        return 0.000007; // $0.007 per 1K tokens
      default:
        return 0.000005;
    }
  }

  /**
   * Get default safety settings for enterprise use
   */
  private getDefaultSafetySettings(): any[] {
    return [
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
      },
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE'
      }
    ];
  }
}