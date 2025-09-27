/**
 * A2A MCP Bridge
 *
 * Seamless translation bridge between MCP (Model Context Protocol) and A2A (Agent-to-Agent) protocols.
 * Provides bidirectional translation with parameter transformation and response mapping.
 */

import { EventEmitter } from "node:events";
import {
  A2AMessage,
  A2AResponse,
  MCPToA2AMapping,
  ParameterMapping,
  ResponseMapping,
  TransformFunction,
  PaymentMandate,
  A2PConfig,
} from "../../../types/a2a.js";
import { MCPRequest, MCPResponse, MCPTool } from "../../../types/mcp.js";
import { Logger } from "../../../utils/logger.js";
import { TopologyType } from "../../protocol-activator.js";
import { A2PPaymentProcessor } from "../a2p/payment-processor.js";

/**
 * Bridge metrics
 */
export interface BridgeMetrics {
  totalTranslations: number;
  mcpToA2ATranslations: number;
  a2aToMCPTranslations: number;
  avgTranslationTime: number;
  successRate: number;
  errorRate: number;
  mappingsCount: number;
  transformationCacheHits: number;
  errorsByType: { [errorType: string]: number };
  // A2P Payment metrics
  totalPayments: number;
  paymentSuccessRate: number;
  avgPaymentLatency: number;
}

/**
 * Transformation cache entry
 */
interface CacheEntry {
  input: any;
  output: any;
  timestamp: number;
}

/**
 * A2A MCP Bridge implementation
 */
export class A2AMCPBridge extends EventEmitter {
  private logger: Logger;
  private mappings: Map<string, MCPToA2AMapping> = new Map();
  private reverseMappings: Map<string, MCPToA2AMapping> = new Map();
  private transformationCache: Map<string, CacheEntry> = new Map();
  private isInitialized: boolean = false;
  private topology?: TopologyType;
  private paymentProcessor?: A2PPaymentProcessor;

  // Metrics tracking
  private metrics: {
    totalTranslations: number;
    mcpToA2ATranslations: number;
    a2aToMCPTranslations: number;
    translationTimes: number[];
    translationSuccesses: number;
    translationFailures: number;
    cacheHits: number;
    errorsByType: Map<string, number>;
    startTime: number;
    // A2P Payment metrics
    totalPayments: number;
    paymentSuccesses: number;
    paymentFailures: number;
    paymentLatencies: number[];
  } = {
    totalTranslations: 0,
    mcpToA2ATranslations: 0,
    a2aToMCPTranslations: 0,
    translationTimes: [],
    translationSuccesses: 0,
    translationFailures: 0,
    cacheHits: 0,
    errorsByType: new Map(),
    startTime: Date.now(),
    totalPayments: 0,
    paymentSuccesses: 0,
    paymentFailures: 0,
    paymentLatencies: [],
  };

  // Configuration
  private cacheEnabled: boolean = true;
  private cacheTTL: number = 300000; // 5 minutes
  private maxCacheSize: number = 1000;

  constructor(options?: { topology: TopologyType; a2pConfig?: A2PConfig }) {
    super();
    this.logger = new Logger("A2AMCPBridge");
    this.topology = options?.topology;

    // Initialize A2P payment processor if config provided
    if (options?.a2pConfig) {
      this.paymentProcessor = new A2PPaymentProcessor(options.a2pConfig);
      this.logger.info("A2P Payment Processor enabled");
    }

    // Set up periodic cache cleanup
    setInterval(() => this.cleanupCache(), 60000); // Every minute
  }

  /**
   * Initialize the MCP bridge
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info("Initializing A2A MCP Bridge");

      // Register default mappings
      this.registerDefaultMappings();

      this.isInitialized = true;
      this.metrics.startTime = Date.now();

      this.logger.info("A2A MCP Bridge initialized successfully", {
        mappings: this.mappings.size,
        topology: this.topology || "none",
      });

      this.emit("initialized");
    } catch (error) {
      this.logger.error("Failed to initialize A2A MCP Bridge:", error);
      throw error;
    }
  }

  /**
   * Shutdown the MCP bridge
   */
  async shutdown(): Promise<void> {
    this.logger.info("Shutting down A2A MCP Bridge");

    this.isInitialized = false;
    this.mappings.clear();
    this.reverseMappings.clear();
    this.transformationCache.clear();

    this.logger.info("A2A MCP Bridge shutdown complete");
    this.emit("shutdown");
  }

  /**
   * Translate MCP request to A2A message
   */
  async translateMCPToA2A(mcpRequest: MCPRequest): Promise<A2AMessage> {
    if (!this.isInitialized) {
      throw new Error("Bridge not initialized");
    }

    const startTime = Date.now();

    try {
      this.metrics.totalTranslations++;
      this.metrics.mcpToA2ATranslations++;

      // Find appropriate mapping
      const mapping = this.findMCPMapping(mcpRequest);
      if (!mapping) {
        throw new Error(
          `No A2A mapping found for MCP method: ${this.extractMCPMethod(mcpRequest)}`,
        );
      }

      // Transform parameters
      const transformedParams = await this.transformParameters(
        mcpRequest,
        mapping.parameterMapping,
        "mcp-to-a2a",
      );

      // Create A2A message
      const a2aMessage: A2AMessage = {
        jsonrpc: "2.0",
        method: mapping.a2aMethod,
        params: transformedParams,
        id:
          mcpRequest.id ||
          `bridge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        from: "mcp-bridge-agent",
        to: this.determineTargetAgent(mapping, mcpRequest),
        timestamp: Date.now(),
        messageType: "request",
        priority: this.determinePriority(mcpRequest),
        context: this.createA2AContext(mcpRequest),
      };

      // Track success
      const translationTime = Date.now() - startTime;
      this.trackTranslationSuccess(translationTime);

      this.logger.debug("MCP to A2A translation successful", {
        mcpMethod: this.extractMCPMethod(mcpRequest),
        a2aMethod: mapping.a2aMethod,
        translationTime,
      });

      return a2aMessage;
    } catch (error: any) {
      this.trackTranslationError("mcp_to_a2a_error", error);
      throw error;
    }
  }

  /**
   * Translate A2A message to MCP request
   */
  async translateA2AToMCP(a2aMessage: A2AMessage): Promise<MCPRequest> {
    if (!this.isInitialized) {
      throw new Error("Bridge not initialized");
    }

    const startTime = Date.now();

    try {
      this.metrics.totalTranslations++;
      this.metrics.a2aToMCPTranslations++;

      // Validate A2A message format
      this.validateA2AMessage(a2aMessage);

      // Find reverse mapping
      const mapping = this.reverseMappings.get(a2aMessage.method);
      if (!mapping) {
        throw new Error(
          `No MCP mapping found for A2A method: ${a2aMessage.method}`,
        );
      }

      // Reverse transform parameters
      const transformedParams = await this.reverseTransformParameters(
        a2aMessage.params,
        mapping.parameterMapping,
      );

      // Create MCP request
      const mcpRequest: MCPRequest = {
        id: a2aMessage.id?.toString() || `bridge_${Date.now()}`,
        prompt: this.generateMCPPrompt(a2aMessage),
        tools: [
          {
            name: mapping.mcpMethod,
            description: `Execute ${mapping.mcpMethod} with A2A parameters`,
            parameters: {
              type: "object",
              properties: this.generateParameterSchema(transformedParams),
              required: this.extractRequiredParameters(mapping),
            },
          },
        ],
        temperature: 0.1, // Low temperature for tool execution
        cacheTTL: a2aMessage.context?.timeout
          ? Math.floor(a2aMessage.context.timeout / 1000)
          : 300,
      };

      // Add transformed parameters to request (mock field for testing)
      (mcpRequest as any).toolParams = transformedParams;

      // Add context if available
      if (a2aMessage.context) {
        (mcpRequest as any).context = a2aMessage.context;
      }

      // Track success
      const translationTime = Date.now() - startTime;
      this.trackTranslationSuccess(translationTime);

      this.logger.debug("A2A to MCP translation successful", {
        a2aMethod: a2aMessage.method,
        mcpMethod: mapping.mcpMethod,
        translationTime,
      });

      return mcpRequest;
    } catch (error: any) {
      this.trackTranslationError("a2a_to_mcp_error", error);
      throw error;
    }
  }

  /**
   * Translate MCP response to A2A response
   */
  async translateMCPResponseToA2A(
    mcpResponse: MCPResponse,
  ): Promise<A2AResponse> {
    const startTime = Date.now();

    try {
      // Find mapping for the function call
      const functionCall = mcpResponse.functionCalls?.[0];
      if (!functionCall) {
        throw new Error("No function call found in MCP response");
      }

      const mapping = this.mappings.get(functionCall.name);
      if (!mapping) {
        throw new Error(`No mapping found for function: ${functionCall.name}`);
      }

      // Transform response using response mapping
      const transformedResult = await this.transformResponse(
        functionCall.arguments,
        mapping.responseMapping,
      );

      // Create A2A response
      const a2aResponse: A2AResponse = {
        jsonrpc: "2.0",
        result: transformedResult,
        id: mcpResponse.id,
        from: "mcp-bridge-response",
        to: "requesting-agent",
        timestamp: Date.now(),
        messageType: "response",
      };

      const translationTime = Date.now() - startTime;
      this.trackTranslationSuccess(translationTime);

      return a2aResponse;
    } catch (error: any) {
      this.trackTranslationError("mcp_response_to_a2a_error", error);
      throw error;
    }
  }

  /**
   * Translate A2A response to MCP response
   */
  async translateA2AResponseToMCP(
    a2aResponse: A2AResponse,
  ): Promise<MCPResponse> {
    const startTime = Date.now();

    try {
      // For simplicity, we'll create a generic MCP response
      // In a real implementation, this would use the reverse response mapping
      const mcpResponse: MCPResponse = {
        id: a2aResponse.id?.toString() || "unknown",
        model: "a2a-bridge-model",
        content: "A2A response translated to MCP format",
        functionCalls: [
          {
            name: "a2a_bridge_function",
            arguments: this.reverseTransformResponseData(a2aResponse.result),
          },
        ],
        usage: {
          promptTokens: 50,
          completionTokens: 25,
          totalTokens: 75,
        },
        metadata: {
          cached: false,
          finishReason: "stop",
        },
      };

      const translationTime = Date.now() - startTime;
      this.trackTranslationSuccess(translationTime);

      return mcpResponse;
    } catch (error: any) {
      this.trackTranslationError("a2a_response_to_mcp_error", error);
      throw error;
    }
  }

  /**
   * Register a method mapping
   */
  registerMapping(mapping: MCPToA2AMapping): void {
    if (this.mappings.has(mapping.mcpMethod)) {
      throw new Error(
        `Mapping already exists for method: ${mapping.mcpMethod}`,
      );
    }

    this.mappings.set(mapping.mcpMethod, mapping);
    this.reverseMappings.set(mapping.a2aMethod, mapping);

    this.logger.debug("Mapping registered", {
      mcpMethod: mapping.mcpMethod,
      a2aMethod: mapping.a2aMethod,
    });
  }

  /**
   * Unregister a method mapping
   */
  unregisterMapping(mcpMethod: string): void {
    const mapping = this.mappings.get(mcpMethod);
    if (!mapping) {
      return;
    }

    this.mappings.delete(mcpMethod);
    this.reverseMappings.delete(mapping.a2aMethod);

    this.logger.debug("Mapping unregistered", { mcpMethod });
  }

  /**
   * Get all mappings
   */
  getMappings(): Map<string, MCPToA2AMapping> {
    return new Map(this.mappings);
  }

  /**
   * Get bridge metrics
   */
  getBridgeMetrics(): BridgeMetrics {
    const avgTranslationTime =
      this.metrics.translationTimes.length > 0
        ? this.metrics.translationTimes.reduce((a, b) => a + b, 0) /
          this.metrics.translationTimes.length
        : 0;

    const errorsByType: { [errorType: string]: number } = {};
    this.metrics.errorsByType.forEach((count, type) => {
      errorsByType[type] = count;
    });

    return {
      totalTranslations: this.metrics.totalTranslations,
      mcpToA2ATranslations: this.metrics.mcpToA2ATranslations,
      a2aToMCPTranslations: this.metrics.a2aToMCPTranslations,
      avgTranslationTime,
      successRate:
        this.metrics.totalTranslations > 0
          ? this.metrics.translationSuccesses / this.metrics.totalTranslations
          : 0,
      errorRate:
        this.metrics.totalTranslations > 0
          ? this.metrics.translationFailures / this.metrics.totalTranslations
          : 0,
      mappingsCount: this.mappings.size,
      transformationCacheHits: this.metrics.cacheHits,
      errorsByType,
    };
  }

  /**
   * Register default mappings for common MCP tools
   */
  private registerDefaultMappings(): void {
    // Claude Flow mappings
    this.registerMapping({
      mcpMethod: "mcp__gemini-flow__neural_status",
      a2aMethod: "neural.status",
      parameterMapping: [{ mcpParam: "modelId", a2aParam: "modelId" }],
      responseMapping: [
        { mcpField: "status", a2aField: "result.status" },
        { mcpField: "metrics", a2aField: "result.metrics" },
      ],
    });

    this.registerMapping({
      mcpMethod: "mcp__gemini-flow__task_orchestrate",
      a2aMethod: "task.orchestrate",
      parameterMapping: [
        { mcpParam: "task", a2aParam: "taskDescription" },
        {
          mcpParam: "priority",
          a2aParam: "priority",
          transform: (value: string) => value.toLowerCase(),
        },
        {
          mcpParam: "strategy",
          a2aParam: "executionStrategy",
          transform: (value: string) => {
            const strategyMap: { [key: string]: string } = {
              parallel: "concurrent",
              sequential: "ordered",
              adaptive: "dynamic",
            };
            return strategyMap[value] || value;
          },
        },
      ],
      responseMapping: [
        { mcpField: "taskId", a2aField: "result.taskId" },
        { mcpField: "status", a2aField: "result.status" },
        {
          mcpField: "agents",
          a2aField: "result.assignedAgents",
          transform: (agents: any[]) => agents.map((a) => a.id),
        },
      ],
    });

    // RUV Swarm mappings
    this.registerMapping({
      mcpMethod: "mcp__ruv-swarm__swarm_init",
      a2aMethod: "swarm.initialize",
      parameterMapping: [
        { mcpParam: "topology", a2aParam: "networkTopology" },
        { mcpParam: "maxAgents", a2aParam: "maxAgentCount" },
        { mcpParam: "strategy", a2aParam: "distributionStrategy" },
      ],
      responseMapping: [
        { mcpField: "swarmId", a2aField: "result.swarmId" },
        { mcpField: "agents", a2aField: "result.initialAgents" },
      ],
    });

    this.logger.info("Default mappings registered", {
      count: this.mappings.size,
    });
  }

  /**
   * Find MCP mapping for request
   */
  private findMCPMapping(mcpRequest: MCPRequest): MCPToA2AMapping | undefined {
    const mcpMethod = this.extractMCPMethod(mcpRequest);
    return this.mappings.get(mcpMethod);
  }

  /**
   * Extract MCP method from request
   */
  private extractMCPMethod(mcpRequest: MCPRequest): string {
    // Get the first tool name as the method
    return mcpRequest.tools?.[0]?.name || "unknown";
  }

  /**
   * Transform parameters using mapping
   */
  private async transformParameters(
    mcpRequest: MCPRequest,
    parameterMappings: ParameterMapping[],
    direction: "mcp-to-a2a" | "a2a-to-mcp",
  ): Promise<any> {
    const sourceParams = (mcpRequest as any).toolParams || {};
    const transformedParams: any = {};

    for (const mapping of parameterMappings) {
      const sourceValue = this.getNestedValue(sourceParams, mapping.mcpParam);

      if (sourceValue !== undefined) {
        let transformedValue = sourceValue;

        // Apply transformation if provided
        if (mapping.transform) {
          try {
            const cacheKey = this.generateCacheKey(
              mapping.mcpParam,
              sourceValue,
            );
            const cachedResult = this.getCachedTransformation(cacheKey);

            if (cachedResult) {
              transformedValue = cachedResult;
              this.metrics.cacheHits++;
            } else {
              const context = (mcpRequest as any).context;
              transformedValue = mapping.transform(sourceValue, context);
              this.cacheTransformation(cacheKey, transformedValue);
            }
          } catch (error) {
            throw new Error(
              `Parameter transformation failed for ${mapping.mcpParam}: ${(error as Error).message}`,
            );
          }
        }

        this.setNestedValue(
          transformedParams,
          mapping.a2aParam,
          transformedValue,
        );
      } else if (this.isRequiredParameter(mapping.mcpParam, mcpRequest)) {
        throw new Error(`Required parameter missing: ${mapping.mcpParam}`);
      }
    }

    return transformedParams;
  }

  /**
   * Reverse transform parameters (A2A to MCP)
   */
  private async reverseTransformParameters(
    a2aParams: any,
    parameterMappings: ParameterMapping[],
  ): Promise<any> {
    const transformedParams: any = {};

    for (const mapping of parameterMappings) {
      const sourceValue = this.getNestedValue(a2aParams, mapping.a2aParam);

      if (sourceValue !== undefined) {
        let transformedValue = sourceValue;

        // Apply reverse transformation
        if (mapping.transform) {
          try {
            transformedValue = this.reverseTransform(
              mapping.transform,
              sourceValue,
            );
          } catch (error) {
            this.logger.warn(
              "Reverse transformation failed, using original value",
              {
                param: mapping.a2aParam,
                error: (error as Error).message,
              },
            );
          }
        }

        this.setNestedValue(
          transformedParams,
          mapping.mcpParam,
          transformedValue,
        );
      }
    }

    return transformedParams;
  }

  /**
   * Transform response using response mapping
   */
  private async transformResponse(
    mcpResult: any,
    responseMappings: ResponseMapping[],
  ): Promise<any> {
    const transformedResult: any = {};

    for (const mapping of responseMappings) {
      const sourceValue = this.getNestedValue(mcpResult, mapping.mcpField);

      if (sourceValue !== undefined) {
        let transformedValue = sourceValue;

        // Apply transformation if provided
        if (mapping.transform) {
          try {
            transformedValue = mapping.transform(sourceValue);
          } catch (error) {
            this.logger.warn(
              "Response transformation failed, using original value",
              {
                field: mapping.mcpField,
                error: (error as Error).message,
              },
            );
          }
        }

        this.setNestedValue(
          transformedResult,
          mapping.a2aField,
          transformedValue,
        );
      }
    }

    return transformedResult;
  }

  /**
   * Reverse transform response data (A2A to MCP)
   */
  private reverseTransformResponseData(a2aResult: any): any {
    // Simple reverse transformation - in practice this would use proper reverse mappings
    if (a2aResult && typeof a2aResult === "object") {
      const transformed: any = {};

      if (a2aResult.taskId) {
        transformed.taskId = a2aResult.taskId;
      }
      if (a2aResult.status) {
        transformed.status = a2aResult.status;
      }
      if (a2aResult.assignedAgents) {
        transformed.agents = a2aResult.assignedAgents.map((id: string) => ({
          id,
        }));
      }

      return transformed;
    }

    return a2aResult;
  }

  /**
   * Determine target agent for A2A message
   */
  private determineTargetAgent(
    mapping: MCPToA2AMapping,
    mcpRequest: MCPRequest,
  ): string {
    // Simple heuristic based on method name
    if (mapping.a2aMethod.startsWith("neural.")) {
      return "neural-agent-001";
    } else if (mapping.a2aMethod.startsWith("task.")) {
      return "task-coordinator-001";
    } else if (mapping.a2aMethod.startsWith("swarm.")) {
      return "swarm-manager-001";
    }

    return "default-agent-001";
  }

  /**
   * Determine message priority from MCP request
   */
  private determinePriority(
    mcpRequest: MCPRequest,
  ): "low" | "normal" | "high" | "critical" {
    // Check for priority hints in the request
    const context = (mcpRequest as any).context;
    if (context?.priority) {
      return context.priority;
    }

    // Check temperature - higher temperature might indicate more exploratory/lower priority
    if (mcpRequest.temperature && mcpRequest.temperature > 0.8) {
      return "low";
    }

    return "normal";
  }

  /**
   * Create A2A context from MCP request
   */
  private createA2AContext(mcpRequest: MCPRequest): any {
    const context: any = {};

    if (mcpRequest.cacheTTL) {
      context.timeout = mcpRequest.cacheTTL * 1000; // Convert to milliseconds
    }

    if (mcpRequest.maxTokens) {
      context.maxCost = Math.floor(mcpRequest.maxTokens / 100); // Rough cost estimate
    }

    return Object.keys(context).length > 0 ? context : undefined;
  }

  /**
   * Generate MCP prompt from A2A message
   */
  private generateMCPPrompt(a2aMessage: A2AMessage): string {
    return `Execute A2A method: ${a2aMessage.method} with parameters: ${JSON.stringify(a2aMessage.params)}`;
  }

  /**
   * Generate parameter schema for MCP tool
   */
  private generateParameterSchema(params: any): any {
    const schema: any = {};

    if (params && typeof params === "object") {
      for (const [key, value] of Object.entries(params)) {
        schema[key] = {
          type: typeof value,
          description: `Parameter: ${key}`,
        };
      }
    }

    return schema;
  }

  /**
   * Extract required parameters from mapping
   */
  private extractRequiredParameters(mapping: MCPToA2AMapping): string[] {
    return mapping.parameterMapping
      .filter(
        (pm) =>
          pm.mcpParam.includes("required") || pm.a2aParam.includes("required"),
      )
      .map((pm) => pm.mcpParam);
  }

  /**
   * Validate A2A message format
   */
  private validateA2AMessage(message: A2AMessage): void {
    if (message.jsonrpc !== "2.0") {
      throw new Error("Invalid JSON-RPC 2.0 message format");
    }

    if (!message.method) {
      throw new Error("Missing method in A2A message");
    }
  }

  /**
   * Check if parameter is required
   */
  private isRequiredParameter(
    paramName: string,
    mcpRequest: MCPRequest,
  ): boolean {
    const tool = mcpRequest.tools?.[0];
    return tool?.parameters?.required?.includes(paramName) || false;
  }

  /**
   * Get nested value from object
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  }

  /**
   * Set nested value in object
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split(".");
    const lastKey = keys.pop()!;

    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);

    target[lastKey] = value;
  }

  /**
   * Reverse transform value (simple heuristic)
   */
  private reverseTransform(transform: TransformFunction, value: any): any {
    // This is a simplified reverse transformation
    // In practice, each transform would need its own reverse function

    if (typeof value === "string") {
      // Common string transformations
      if (value === "concurrent") return "parallel";
      if (value === "ordered") return "sequential";
      if (value === "dynamic") return "adaptive";

      // Case transformations
      if (value === value.toLowerCase()) return value.toUpperCase();
    }

    return value;
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(param: string, value: any): string {
    return `${param}:${JSON.stringify(value)}`;
  }

  /**
   * Get cached transformation
   */
  private getCachedTransformation(key: string): any {
    if (!this.cacheEnabled) return null;

    const entry = this.transformationCache.get(key);
    if (!entry) return null;

    // Check TTL
    const now = Date.now();
    if (now - entry.timestamp > this.cacheTTL) {
      this.transformationCache.delete(key);
      return null;
    }

    return entry.output;
  }

  /**
   * Cache transformation result
   */
  private cacheTransformation(key: string, value: any): void {
    if (!this.cacheEnabled) return;

    // Check cache size limit
    if (this.transformationCache.size >= this.maxCacheSize) {
      // Remove oldest entries
      const entries = Array.from(this.transformationCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

      // Remove oldest 10%
      const removeCount = Math.floor(this.maxCacheSize * 0.1);
      for (let i = 0; i < removeCount; i++) {
        this.transformationCache.delete(entries[i][0]);
      }
    }

    this.transformationCache.set(key, {
      input: key,
      output: value,
      timestamp: Date.now(),
    });
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    if (!this.cacheEnabled) return;

    const now = Date.now();
    const expiredKeys: string[] = [];

    this.transformationCache.forEach((entry, key) => {
      if (now - entry.timestamp > this.cacheTTL) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach((key) => this.transformationCache.delete(key));

    if (expiredKeys.length > 0) {
      this.logger.debug("Cleaned up expired cache entries", {
        expired: expiredKeys.length,
        remaining: this.transformationCache.size,
      });
    }
  }

  /**
   * Track translation success
   */
  private trackTranslationSuccess(translationTime: number): void {
    this.metrics.translationSuccesses++;
    this.metrics.translationTimes.push(translationTime);

    // Keep only last 1000 entries
    if (this.metrics.translationTimes.length > 1000) {
      this.metrics.translationTimes.splice(0, 100);
    }
  }

  /**
   * Track translation error
   */
  private trackTranslationError(errorType: string, error: any): void {
    this.metrics.translationFailures++;

    const currentCount = this.metrics.errorsByType.get(errorType) || 0;
    this.metrics.errorsByType.set(errorType, currentCount + 1);

    this.logger.error("Translation error", {
      errorType,
      message: error.message,
    });
  }

  /**
   * Process payment using A2P payment processor
   */
  async processPayment(mandate: PaymentMandate): Promise<{
    transactionId: string;
    status: string;
    latency: number;
    consensusProof: string;
  }> {
    if (!this.paymentProcessor) {
      throw new Error("A2P Payment Processor not initialized");
    }

    const startTime = performance.now();

    try {
      this.metrics.totalPayments++;

      const result = await this.paymentProcessor.processPayment(mandate);

      const latency = performance.now() - startTime;
      this.metrics.paymentSuccesses++;
      this.metrics.paymentLatencies.push(latency);

      // Keep only last 1000 entries
      if (this.metrics.paymentLatencies.length > 1000) {
        this.metrics.paymentLatencies.splice(0, 100);
      }

      this.logger.info("Payment processed successfully", {
        transactionId: result.transactionId,
        amount: result.amount,
        latency: result.latency,
      });

      return {
        transactionId: result.transactionId,
        status: result.status,
        latency: result.latency,
        consensusProof: result.consensusProof,
      };
    } catch (error) {
      this.metrics.paymentFailures++;
      this.logger.error("Payment processing failed", {
        mandateId: mandate.id,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Check if payment processing is enabled
   */
  isPaymentEnabled(): boolean {
    return !!this.paymentProcessor;
  }

  /**
   * Get comprehensive bridge metrics including payment metrics
   */
  getBridgeMetrics(): BridgeMetrics {
    const uptime = Date.now() - this.metrics.startTime;
    const avgTranslationTime =
      this.metrics.translationTimes.length > 0
        ? this.metrics.translationTimes.reduce((sum, time) => sum + time, 0) /
          this.metrics.translationTimes.length
        : 0;

    const avgPaymentLatency =
      this.metrics.paymentLatencies.length > 0
        ? this.metrics.paymentLatencies.reduce((sum, time) => sum + time, 0) /
          this.metrics.paymentLatencies.length
        : 0;

    const successRate =
      this.metrics.totalTranslations > 0
        ? this.metrics.translationSuccesses / this.metrics.totalTranslations
        : 0;

    const paymentSuccessRate =
      this.metrics.totalPayments > 0
        ? this.metrics.paymentSuccesses / this.metrics.totalPayments
        : 0;

    const errorRate =
      this.metrics.totalTranslations > 0
        ? this.metrics.translationFailures / this.metrics.totalTranslations
        : 0;

    const errorsByType: { [errorType: string]: number } = {};
    this.metrics.errorsByType.forEach((count, type) => {
      errorsByType[type] = count;
    });

    return {
      totalTranslations: this.metrics.totalTranslations,
      mcpToA2ATranslations: this.metrics.mcpToA2ATranslations,
      a2aToMCPTranslations: this.metrics.a2aToMCPTranslations,
      avgTranslationTime,
      successRate,
      errorRate,
      mappingsCount: this.mappings.size,
      transformationCacheHits: this.metrics.cacheHits,
      errorsByType,
      // A2P Payment metrics
      totalPayments: this.metrics.totalPayments,
      paymentSuccessRate,
      avgPaymentLatency,
    };
  }
}
