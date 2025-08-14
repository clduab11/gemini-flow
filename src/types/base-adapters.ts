/**
 * Base Adapter Type Definitions - TDD approach
 * Type definitions created before implementing the actual adapters
 */

// Core request/response interfaces
export interface ModelRequest {
  prompt: string;
  multimodal?: boolean;
  tools?: Tool[];
  context?: RequestContext;
}

export interface RequestContext {
  latencyTarget?: number;
  priority?: "low" | "medium" | "high";
  userTier?: "free" | "pro" | "enterprise";
  retryCount?: number;
  streaming?: boolean;
}

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export interface ModelResponse {
  content: string;
  model: string;
  latency: number;
  usage: TokenUsage;
  cost: number;
  finishReason: string;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface StreamChunk {
  id: string;
  content: string;
  finished: boolean;
  metadata?: {
    adapter?: string;
    routingDecision?: any;
    chunkIndex?: number;
  };
}

export interface AdapterError extends Error {
  code: string;
  retryable: boolean;
  originalError?: Error;
}

export interface HealthCheck {
  status: "healthy" | "unhealthy" | "degraded";
  latency: number;
  lastChecked: Date;
  errors: string[];
  metadata: Record<string, any>;
}

export interface AdapterCapabilities {
  textGeneration: boolean;
  codeGeneration: boolean;
  multimodal: boolean;
  streaming: boolean;
  functionCalling: boolean;
  reasoning: boolean;
  longContext: boolean;
}

// Base adapter interface
export interface BaseModelAdapter {
  initialize(): Promise<void>;
  generate(request: ModelRequest): Promise<ModelResponse>;
  generateStream(request: ModelRequest): AsyncIterable<StreamChunk>;
  healthCheck(): Promise<HealthCheck>;
  getCapabilities(): AdapterCapabilities;
}

// Configuration interfaces
export interface BaseAdapterConfig {
  apiKey?: string;
  endpoint?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface GeminiAdapterConfig extends BaseAdapterConfig {
  model: string;
  projectId?: string;
  location?: string;
}

export interface DeepMindAdapterConfig extends BaseAdapterConfig {
  model: string;
  version?: string;
}

export interface JulesWorkflowConfig extends BaseAdapterConfig {
  modelName: string;
  workflowId?: string;
  parameters?: Record<string, any>;
}
