/**
 * MCP-to-Gemini Adapter Layer
 *
 * Translates Model Context Protocol (MCP) requests to Gemini API calls
 * and handles response transformation for seamless integration
 */

import {
  GoogleGenerativeAI,
  GenerativeModel,
  GenerationConfig,
} from "@google/generative-ai";
import { MCPRequest, MCPResponse, MCPTool } from "../types/mcp.js";
import {
  MCPTools,
  MCPToolName,
  MCPToolParameters,
  MCPToolReturnType,
} from "../types/mcp-tools.js";
import { Logger } from "../utils/logger.js";
import { CacheManager } from "./cache-manager.js";
import { ContextOptimizer } from "./context-optimizer.js";
import { TopologyType } from "../protocols/protocol-activator.js";

export class MCPToGeminiAdapter {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private cache: CacheManager;
  private optimizer: ContextOptimizer;
  private logger: Logger;
  private topology?: TopologyType;

  // Performance metrics
  private metrics = {
    requestCount: 0,
    cacheHits: 0,
    totalLatency: 0,
    contextTokens: 0,
  };

  constructor(
    apiKey: string,
    modelName: string = "gemini-2.5-flash",
    options?: { topology: TopologyType },
  ) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: modelName });
    this.cache = new CacheManager();
    this.optimizer = new ContextOptimizer();
    this.logger = new Logger("MCPAdapter");
    this.topology = options?.topology;

    if (this.topology) {
      this.logger.info(
        `MCP adapter initialized with ${this.topology} topology`,
      );
    }
  }

  /**
   * Transform MCP request to Gemini format
   */
  async processRequest(request: MCPRequest): Promise<MCPResponse> {
    const startTime = Date.now();
    this.metrics.requestCount++;

    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(request);
      const cachedResponse = await this.cache.get(cacheKey);

      if (cachedResponse) {
        this.metrics.cacheHits++;
        this.logger.debug("Cache hit for request", { cacheKey });
        return cachedResponse;
      }

      // Optimize context for Gemini's token window
      const optimizedRequest = await this.optimizer.optimize(request);

      // Transform MCP tools to Gemini function declarations
      const functions = this.transformTools(request.tools);

      // Configure generation parameters
      const generationConfig: GenerationConfig = {
        temperature: request.temperature || 0.7,
        topP: request.topP || 0.9,
        topK: request.topK || 40,
        maxOutputTokens: request.maxTokens || 8192,
        responseMimeType: "application/json",
      };

      // Create chat session with function calling
      const chat = this.model.startChat({
        generationConfig,
        history: this.transformHistory(request.history),
      });

      // Send message and get response
      const result = await chat.sendMessage(optimizedRequest.prompt);
      const response = await result.response;

      // Transform Gemini response to MCP format
      const mcpResponse = this.transformResponse(response, request);

      // Cache the response
      await this.cache.set(cacheKey, mcpResponse, request.cacheTTL);

      // Update metrics
      const latency = Date.now() - startTime;
      this.metrics.totalLatency += latency;
      this.metrics.contextTokens +=
        (response as any).usageMetadata?.totalTokenCount || 0;

      this.logger.info("Request processed", {
        latency,
        tokens: (response as any).usageMetadata?.totalTokenCount,
        cached: false,
      });

      return mcpResponse;
    } catch (error) {
      this.logger.error("Error processing request", error);
      throw this.transformError(error);
    }
  }

  /**
   * Transform MCP tools to Gemini function declarations
   */
  private transformTools(tools?: MCPTool[]): any[] {
    if (!tools || tools.length === 0) return [];

    return tools.map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: {
        type: "object",
        properties: tool.parameters?.properties || {},
        required: tool.parameters?.required || [],
      },
    }));
  }

  /**
   * Transform conversation history
   */
  private transformHistory(history?: any[]): any[] {
    if (!history) return [];

    return history.map((entry) => ({
      role: entry.role === "assistant" ? "model" : "user",
      parts: [{ text: entry.content }],
    }));
  }

  /**
   * Transform Gemini response to MCP format
   */
  private transformResponse(
    geminiResponse: any,
    originalRequest: MCPRequest,
  ): MCPResponse {
    const text = geminiResponse.text();

    // Check for function calls
    const functionCalls = geminiResponse.functionCalls();

    return {
      id: `resp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      model: this.model.model,
      content: text,
      functionCalls: functionCalls?.map((fc: any) => ({
        name: fc.name,
        arguments: fc.args,
      })),
      usage: {
        promptTokens:
          (geminiResponse as any).usageMetadata?.promptTokenCount || 0,
        completionTokens:
          (geminiResponse as any).usageMetadata?.candidatesTokenCount || 0,
        totalTokens:
          (geminiResponse as any).usageMetadata?.totalTokenCount || 0,
      },
      metadata: {
        finishReason: geminiResponse.candidates?.[0]?.finishReason,
        safety: geminiResponse.candidates?.[0]?.safetyRatings,
        cached: false,
      },
    };
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(request: MCPRequest): string {
    const key = {
      prompt: request.prompt,
      tools: request.tools?.map((t) => t.name).sort(),
      temperature: request.temperature,
      model: this.model.model,
    };

    return Buffer.from(JSON.stringify(key)).toString("base64");
  }

  /**
   * Transform errors to MCP format
   */
  private transformError(error: any): Error {
    const mcpError = new Error(`Gemini API Error: ${error.message}`);
    (mcpError as any).code = error.status || "GEMINI_ERROR";
    (mcpError as any).details = error.errorDetails;
    return mcpError;
  }

  /**
   * Get adapter metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      cacheHitRate: this.metrics.cacheHits / this.metrics.requestCount,
      avgLatency: this.metrics.totalLatency / this.metrics.requestCount,
      avgTokensPerRequest:
        this.metrics.contextTokens / this.metrics.requestCount,
    };
  }

  /**
   * Type-safe MCP tool caller
   */
  async callMCPTool<T extends MCPToolName>(
    toolName: T,
    params: MCPToolParameters<T>,
  ): Promise<MCPToolReturnType<T>> {
    const toolRequest: MCPRequest = {
      prompt: `Execute MCP tool: ${toolName}`,
      tools: [
        {
          name: toolName,
          description: `Execute ${toolName} with provided parameters`,
          parameters: {
            type: "object",
            properties: {},
            required: [],
          },
        },
      ],
      temperature: 0.1, // Low temperature for tool execution
      maxTokens: 4096,
    };

    try {
      const response = await this.processRequest(toolRequest);

      // Parse the function call result
      const functionCall = response.functionCalls?.[0];
      if (functionCall && functionCall.name === toolName) {
        return {
          success: true,
          data: functionCall.arguments,
          timestamp: Date.now(),
        } as MCPToolReturnType<T>;
      } else {
        return {
          success: false,
          error: "Tool execution failed or no function call returned",
          timestamp: Date.now(),
        } as MCPToolReturnType<T>;
      }
    } catch (error: any) {
      this.logger.error(`MCP tool ${toolName} execution failed:`, error);
      return {
        success: false,
        error: error.message,
        timestamp: Date.now(),
      } as MCPToolReturnType<T>;
    }
  }

  /**
   * Check if a tool name is a valid MCP tool
   */
  isMCPTool(toolName: string): toolName is MCPToolName {
    return toolName.startsWith("mcp__");
  }

  /**
   * Get available MCP tools
   */
  getAvailableMCPTools(): MCPToolName[] {
    // This would typically be populated from the actual MCP server capabilities
    // For now, return a subset of commonly used tools
    return [
      "mcp__gemini-flow__swarm_init",
      "mcp__gemini-flow__agent_spawn",
      "mcp__gemini-flow__task_orchestrate",
      "mcp__gemini-flow__memory_usage",
      "mcp__gemini-flow__neural_status",
      "mcp__ruv-swarm__swarm_init",
      "mcp__ruv-swarm__agent_spawn",
      "mcp__ruv-swarm__task_orchestrate",
    ] as MCPToolName[];
  }
}
