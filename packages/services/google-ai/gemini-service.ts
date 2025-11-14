/**
 * Gemini AI Service
 * Integration with Google's Gemini API models
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

export interface GeminiConfig {
  apiKey: string;
  model?: 'gemini-2.0-flash-exp' | 'gemini-pro' | 'gemini-ultra';
}

export interface GenerateRequest {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
}

export interface GenerateResponse {
  text: string;
  tokensUsed?: number;
  finishReason?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: string;
}

export class GeminiService {
  private client: GoogleGenerativeAI;
  private model: GenerativeModel;
  private modelName: string;

  constructor(config: GeminiConfig) {
    if (!config.apiKey) {
      throw new Error('Gemini API key is required');
    }

    this.client = new GoogleGenerativeAI(config.apiKey);
    this.modelName = config.model || 'gemini-2.0-flash-exp';
    this.model = this.client.getGenerativeModel({ model: this.modelName });

    console.log(`[Gemini] Initialized with model: ${this.modelName}`);
  }

  /**
   * Generate content
   */
  async generate(request: GenerateRequest): Promise<GenerateResponse> {
    try {
      console.log(`[Gemini] Generating content...`);

      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: request.prompt }] }],
        generationConfig: {
          temperature: request.temperature ?? 0.9,
          topP: request.topP ?? 1.0,
          topK: request.topK ?? 1,
          maxOutputTokens: request.maxTokens ?? 2048
        }
      });

      const response = result.response;
      const text = response.text();

      console.log(`[Gemini] Generated ${text.length} characters`);

      return {
        text,
        finishReason: response.candidates?.[0]?.finishReason
      };
    } catch (error: any) {
      console.error('[Gemini] Generation error:', error.message);
      throw error;
    }
  }

  /**
   * Start chat session
   */
  async chat(messages: ChatMessage[], newMessage: string): Promise<GenerateResponse> {
    try {
      console.log(`[Gemini] Starting chat session...`);

      const chat = this.model.startChat({
        history: messages.map(msg => ({
          role: msg.role,
          parts: [{ text: msg.parts }]
        }))
      });

      const result = await chat.sendMessage(newMessage);
      const response = result.response;
      const text = response.text();

      console.log(`[Gemini] Chat response: ${text.length} characters`);

      return {
        text,
        finishReason: response.candidates?.[0]?.finishReason
      };
    } catch (error: any) {
      console.error('[Gemini] Chat error:', error.message);
      throw error;
    }
  }

  /**
   * Stream content generation
   */
  async *generateStream(request: GenerateRequest): AsyncGenerator<string> {
    try {
      console.log(`[Gemini] Starting streaming generation...`);

      const result = await this.model.generateContentStream({
        contents: [{ role: 'user', parts: [{ text: request.prompt }] }],
        generationConfig: {
          temperature: request.temperature ?? 0.9,
          topP: request.topP ?? 1.0,
          topK: request.topK ?? 1,
          maxOutputTokens: request.maxTokens ?? 2048
        }
      });

      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          yield text;
        }
      }

      console.log(`[Gemini] Streaming complete`);
    } catch (error: any) {
      console.error('[Gemini] Streaming error:', error.message);
      throw error;
    }
  }

  /**
   * Count tokens in text
   */
  async countTokens(text: string): Promise<number> {
    try {
      const result = await this.model.countTokens(text);
      return result.totalTokens;
    } catch (error: any) {
      console.error('[Gemini] Token counting error:', error.message);
      return 0;
    }
  }

  /**
   * Get model info
   */
  getModelInfo(): { name: string; capabilities: string[] } {
    return {
      name: this.modelName,
      capabilities: [
        'text-generation',
        'chat',
        'streaming',
        'multimodal' // Gemini supports images, audio, video
      ]
    };
  }
}

/**
 * Create Gemini service from environment
 */
export function createGeminiService(model?: GeminiConfig['model']): GeminiService {
  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      'Missing Gemini API key. Set GOOGLE_AI_API_KEY or GEMINI_API_KEY environment variable.'
    );
  }

  return new GeminiService({ apiKey, model });
}
