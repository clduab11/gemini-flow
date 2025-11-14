/**
 * Google AI Services
 * Unified interface to Google's AI services
 */

export * from './gemini-service.js';

import { GeminiService, createGeminiService } from './gemini-service.js';

export {
  GeminiService,
  createGeminiService
};

/**
 * Google AI Service Manager
 */
export class GoogleAIManager {
  private geminiServices: Map<string, GeminiService> = new Map();

  /**
   * Get or create Gemini service
   */
  getGeminiService(model: 'flash' | 'pro' | 'ultra' = 'flash'): GeminiService {
    const modelMap = {
      flash: 'gemini-2.0-flash-exp',
      pro: 'gemini-pro',
      ultra: 'gemini-ultra'
    } as const;

    const modelName = modelMap[model];

    if (!this.geminiServices.has(modelName)) {
      this.geminiServices.set(
        modelName,
        createGeminiService(modelName as any)
      );
    }

    return this.geminiServices.get(modelName)!;
  }

  /**
   * Quick generate using Gemini Flash
   */
  async generate(prompt: string, options = {}): Promise<string> {
    const service = this.getGeminiService('flash');
    const response = await service.generate({ prompt, ...options });
    return response.text;
  }

  /**
   * Chat using Gemini
   */
  async chat(messages: any[], newMessage: string, model: 'flash' | 'pro' | 'ultra' = 'flash'): Promise<string> {
    const service = this.getGeminiService(model);
    const response = await service.chat(messages, newMessage);
    return response.text;
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.geminiServices.clear();
    console.log('[GoogleAI] Services cleaned up');
  }
}

/**
 * Global instance
 */
let googleAIInstance: GoogleAIManager | null = null;

/**
 * Get Google AI manager
 */
export function getGoogleAI(): GoogleAIManager {
  if (!googleAIInstance) {
    googleAIInstance = new GoogleAIManager();
  }
  return googleAIInstance;
}

export default getGoogleAI;
