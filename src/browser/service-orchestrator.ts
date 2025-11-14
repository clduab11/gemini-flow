/**
 * Service Orchestrator
 *
 * Manages both API-based and Playwright-based Google services
 * Routes requests to appropriate service implementation
 */

import {
  getServiceConfig,
  requiresPlaywright,
  requiresUltra,
  PLAYWRIGHT_SERVICES,
  API_SERVICES
} from './services-config.js';
import { PlaywrightServiceBase } from './playwright-service-base.js';
import { AIStudioUltraService } from './services/ai-studio-ultra.js';
import { LabsFlowService, LabsWhiskService } from './services/google-labs.js';

export interface ServiceRequest {
  service: string;
  action: string;
  params: any;
  config?: any;
}

export interface ServiceResponse {
  success: boolean;
  data?: any;
  error?: string;
  service: string;
  timestamp: Date;
}

export class ServiceOrchestrator {
  private playwrightServices: Map<string, PlaywrightServiceBase> = new Map();
  private apiClients: Map<string, any> = new Map();

  /**
   * Execute service request
   */
  async execute(request: ServiceRequest): Promise<ServiceResponse> {
    const startTime = Date.now();
    console.log(`[Orchestrator] Executing ${request.service}.${request.action}`);

    try {
      // Validate service exists
      const serviceConfig = getServiceConfig(request.service);
      if (!serviceConfig) {
        throw new Error(`Unknown service: ${request.service}`);
      }

      // Check Ultra requirement
      if (requiresUltra(request.service)) {
        console.log(`[Orchestrator] Service ${request.service} requires Ultra membership`);
        // Could add Ultra membership verification here
      }

      let result: any;

      // Route to appropriate handler
      if (requiresPlaywright(request.service)) {
        result = await this.executePlaywrightService(request);
      } else {
        result = await this.executeAPIService(request);
      }

      const duration = Date.now() - startTime;
      console.log(`[Orchestrator] Completed ${request.service}.${request.action} in ${duration}ms`);

      return {
        success: true,
        data: result,
        service: request.service,
        timestamp: new Date()
      };
    } catch (error: any) {
      console.error(`[Orchestrator] Error executing ${request.service}:`, error.message);

      return {
        success: false,
        error: error.message,
        service: request.service,
        timestamp: new Date()
      };
    }
  }

  /**
   * Execute Playwright-based service
   */
  private async executePlaywrightService(request: ServiceRequest): Promise<any> {
    console.log(`[Orchestrator] Using Playwright for ${request.service}`);

    // Get or create service instance
    let service = this.playwrightServices.get(request.service);

    if (!service) {
      service = this.createPlaywrightService(request.service, request.config);
      this.playwrightServices.set(request.service, service);

      // Initialize on first use
      await service.initialize();

      // Check and handle authentication
      const authState = await service.checkAuthentication();
      if (!authState.isAuthenticated) {
        console.log(`[Orchestrator] Authentication required for ${request.service}`);
        await service.authenticate();
      }
    }

    // Execute the action
    return await service.executeAction(request.action, request.params);
  }

  /**
   * Execute API-based service
   */
  private async executeAPIService(request: ServiceRequest): Promise<any> {
    console.log(`[Orchestrator] Using API for ${request.service}`);

    // Get or create API client
    let client = this.apiClients.get(request.service);

    if (!client) {
      client = await this.createAPIClient(request.service);
      this.apiClients.set(request.service, client);
    }

    // Execute API call
    // Implementation depends on specific API
    switch (request.service) {
      case 'gemini-flash':
      case 'gemini-pro':
        return await this.executeGeminiAPI(client, request);
      case 'vertex-ai':
        return await this.executeVertexAI(client, request);
      default:
        throw new Error(`API handler not implemented for ${request.service}`);
    }
  }

  /**
   * Create Playwright service instance
   */
  private createPlaywrightService(serviceName: string, config: any = {}): PlaywrightServiceBase {
    switch (serviceName) {
      case 'ai-studio-ultra':
        return new AIStudioUltraService(config);
      case 'labs-flow':
        return new LabsFlowService(config);
      case 'labs-whisk':
        return new LabsWhiskService(config);
      // Add more services as implemented
      default:
        throw new Error(`Playwright service not implemented: ${serviceName}`);
    }
  }

  /**
   * Create API client
   */
  private async createAPIClient(serviceName: string): Promise<any> {
    // Load appropriate SDK/client
    switch (serviceName) {
      case 'gemini-flash':
      case 'gemini-pro':
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
        if (!apiKey) {
          throw new Error('GOOGLE_AI_API_KEY or GEMINI_API_KEY environment variable required');
        }
        return new GoogleGenerativeAI(apiKey);

      case 'vertex-ai':
        const { VertexAI } = await import('@google-cloud/aiplatform');
        return new VertexAI({
          project: process.env.GOOGLE_CLOUD_PROJECT,
          location: process.env.GOOGLE_CLOUD_LOCATION || 'us-central1'
        });

      default:
        throw new Error(`API client not implemented: ${serviceName}`);
    }
  }

  /**
   * Execute Gemini API call
   */
  private async executeGeminiAPI(client: any, request: ServiceRequest): Promise<any> {
    const model = client.getGenerativeModel({
      model: request.service === 'gemini-flash' ? 'gemini-2.0-flash-exp' : 'gemini-pro'
    });

    switch (request.action) {
      case 'generate':
        const result = await model.generateContent(request.params.prompt);
        const response = await result.response;
        return response.text();

      case 'chat':
        const chat = model.startChat(request.params.history || []);
        const chatResult = await chat.sendMessage(request.params.message);
        return chatResult.response.text();

      default:
        throw new Error(`Unknown Gemini action: ${request.action}`);
    }
  }

  /**
   * Execute Vertex AI call
   */
  private async executeVertexAI(client: any, request: ServiceRequest): Promise<any> {
    // Vertex AI implementation
    throw new Error('Vertex AI handler not yet implemented');
  }

  /**
   * List available services
   */
  listServices(): { api: string[]; playwright: string[] } {
    return {
      api: Object.keys(API_SERVICES),
      playwright: Object.keys(PLAYWRIGHT_SERVICES)
    };
  }

  /**
   * Cleanup all resources
   */
  async cleanup(): Promise<void> {
    console.log('[Orchestrator] Cleaning up resources...');

    // Cleanup Playwright services
    for (const [name, service] of this.playwrightServices) {
      console.log(`[Orchestrator] Cleaning up ${name}...`);
      await service.cleanup();
    }

    this.playwrightServices.clear();
    this.apiClients.clear();

    console.log('[Orchestrator] Cleanup complete');
  }
}

/**
 * Global orchestrator instance
 */
let orchestratorInstance: ServiceOrchestrator | null = null;

/**
 * Get orchestrator singleton
 */
export function getOrchestrator(): ServiceOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new ServiceOrchestrator();
  }
  return orchestratorInstance;
}

/**
 * Convenience function for quick service execution
 */
export async function executeService(
  service: string,
  action: string,
  params: any,
  config?: any
): Promise<ServiceResponse> {
  const orchestrator = getOrchestrator();
  return orchestrator.execute({ service, action, params, config });
}
