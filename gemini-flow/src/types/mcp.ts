/**
 * MCP (Model Context Protocol) Type Definitions
 */

export interface MCPRequest {
  id?: string;
  prompt: string;
  tools?: MCPTool[];
  temperature?: number;
  topP?: number;
  topK?: number;
  maxTokens?: number;
  history?: Array<{ role: string; content: string }>;
  cacheTTL?: number;
}

export interface MCPResponse {
  id: string;
  model: string;
  content: string;
  functionCalls?: Array<{
    name: string;
    arguments: any;
  }>;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata: {
    finishReason?: string;
    safety?: any[];
    cached: boolean;
  };
}

export interface MCPTool {
  name: string;
  description: string;
  parameters?: {
    type: string;
    properties: { [key: string]: any };
    required?: string[];
  };
}