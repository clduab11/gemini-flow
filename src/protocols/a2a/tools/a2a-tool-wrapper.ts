/**
 * A2A Tool Wrapper Base Class
 * 
 * Provides a unified interface for wrapping MCP tools with A2A (Agent-to-Agent) capabilities.
 * This base class handles the transformation of MCP tool calls into A2A-compliant messages,
 * manages security contexts, and provides performance optimization hooks.
 */

import { EventEmitter } from 'events';
import { Logger } from '../../../utils/logger.js';
import { CacheManager } from '../../../core/cache-manager.js';
import { PerformanceMonitor } from '../../../monitoring/performance-monitor.js';
import { MCPToolName, MCPToolParameters, MCPToolReturnType, MCPToolResult } from '../../../types/mcp-tools.js';

export interface A2AToolContext {
  agentId: string;
  agentType: string;
  sessionId: string;
  trustLevel: 'untrusted' | 'basic' | 'verified' | 'trusted' | 'privileged';
  capabilities: string[];
  metadata: Record<string, any>;
  timestamp: number;
}

export interface A2ACapability {
  name: string;
  version: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
  security: {
    minTrustLevel: string;
    requiredCapabilities: string[];
    rateLimits?: {
      perMinute: number;
      perHour: number;
      perDay: number;
    };
  };
  performance: {
    avgLatency: number;
    resourceUsage: 'low' | 'medium' | 'high';
    cacheable: boolean;
    cacheStrategy?: 'aggressive' | 'conservative' | 'none';
  };
}

export interface A2AToolInvocation {
  toolId: string;
  capabilityName: string;
  parameters: Record<string, any>;
  context: A2AToolContext;
  requestId: string;
  timestamp: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface A2AToolResponse {
  requestId: string;
  toolId: string;
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata: {
    executionTime: number;
    resourceUsage: {
      cpu: number;
      memory: number;
      network?: number;
    };
    cached: boolean;
    trustVerified: boolean;
    securityFlags: string[];
  };
  timestamp: number;
}

export interface A2AToolMetrics {
  invocations: number;
  successRate: number;
  avgLatency: number;
  cacheHitRate: number;
  errorCounts: Record<string, number>;
  resourceUtilization: {
    cpu: number;
    memory: number;
    network: number;
  };
  securityEvents: number;
  lastInvocation: number;
}

/**
 * Abstract base class for A2A tool wrappers
 */
export abstract class A2AToolWrapper extends EventEmitter {
  protected logger: Logger;
  protected cache: CacheManager;
  protected performanceMonitor: PerformanceMonitor;
  protected metrics: A2AToolMetrics = {
    invocations: 0,
    successRate: 0,
    avgLatency: 0,
    cacheHitRate: 0,
    errorCounts: {},
    resourceUtilization: { cpu: 0, memory: 0, network: 0 },
    securityEvents: 0,
    lastInvocation: 0
  };

  constructor(
    protected toolId: string,
    protected capability: A2ACapability
  ) {
    super();
    this.logger = new Logger(`A2AToolWrapper:${toolId}`);
    this.cache = new CacheManager();
    this.performanceMonitor = new PerformanceMonitor();
    
    this.logger.info('A2A Tool Wrapper initialized', {
      toolId,
      capability: capability.name,
      version: capability.version
    });
  }

  /**
   * Main entry point for A2A tool invocation
   */
  async invoke(invocation: A2AToolInvocation): Promise<A2AToolResponse> {
    const startTime = Date.now();
    this.metrics.invocations++;
    this.metrics.lastInvocation = startTime;

    try {
      // Validate security context
      const securityValidation = await this.validateSecurity(invocation.context);
      if (!securityValidation.valid) {
        return this.createErrorResponse(invocation, 'SECURITY_VIOLATION', 
          securityValidation.reason || 'Security validation failed', startTime);
      }

      // Check rate limits
      const rateLimitCheck = await this.checkRateLimits(invocation.context);
      if (!rateLimitCheck.allowed) {
        return this.createErrorResponse(invocation, 'RATE_LIMIT_EXCEEDED', 
          rateLimitCheck.reason || 'Rate limit exceeded', startTime);
      }

      // Check cache first if cacheable
      let cachedResult: A2AToolResponse | null = null;
      if (this.capability.performance.cacheable) {
        cachedResult = await this.getCachedResult(invocation);
        if (cachedResult) {
          this.metrics.cacheHitRate = 
            (this.metrics.cacheHitRate + 1) / this.metrics.invocations;
          cachedResult.metadata.cached = true;
          return cachedResult;
        }
      }

      // Transform A2A invocation to MCP parameters
      const mcpParams = await this.transformToMCP(invocation);

      // Execute the underlying MCP tool
      const mcpResult = await this.executeMCPTool(mcpParams, invocation.context);

      // Transform MCP result back to A2A response
      const a2aResponse = await this.transformFromMCP(mcpResult, invocation, startTime);

      // Cache the result if cacheable and successful
      if (this.capability.performance.cacheable && a2aResponse.success) {
        await this.cacheResult(invocation, a2aResponse);
      }

      // Update metrics
      this.updateMetrics(a2aResponse, startTime);

      // Emit events for monitoring
      this.emit('tool_invoked', {
        toolId: this.toolId,
        success: a2aResponse.success,
        duration: a2aResponse.metadata.executionTime,
        agentId: invocation.context.agentId
      });

      return a2aResponse;

    } catch (error: any) {
      this.logger.error('A2A tool invocation failed', {
        toolId: this.toolId,
        requestId: invocation.requestId,
        error: error.message
      });

      const errorResponse = this.createErrorResponse(
        invocation, 
        'EXECUTION_ERROR', 
        error.message, 
        startTime,
        error
      );

      this.updateErrorMetrics(error);
      this.emit('tool_error', { toolId: this.toolId, error, invocation });

      return errorResponse;
    }
  }

  /**
   * Get the A2A capability definition for this tool
   */
  getCapability(): A2ACapability {
    return { ...this.capability };
  }

  /**
   * Get current metrics for this tool
   */
  getMetrics(): A2AToolMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics (useful for testing or monitoring cycles)
   */
  resetMetrics(): void {
    this.metrics = {
      invocations: 0,
      successRate: 0,
      avgLatency: 0,
      cacheHitRate: 0,
      errorCounts: {},
      resourceUtilization: { cpu: 0, memory: 0, network: 0 },
      securityEvents: 0,
      lastInvocation: 0
    };
  }

  /**
   * Validate security context for the invocation
   */
  protected async validateSecurity(context: A2AToolContext): Promise<{
    valid: boolean;
    reason?: string;
    securityFlags: string[];
  }> {
    const securityFlags: string[] = [];

    // Check minimum trust level
    const trustLevels = ['untrusted', 'basic', 'verified', 'trusted', 'privileged'];
    const requiredIndex = trustLevels.indexOf(this.capability.security.minTrustLevel);
    const actualIndex = trustLevels.indexOf(context.trustLevel);

    if (actualIndex < requiredIndex) {
      return {
        valid: false,
        reason: `Insufficient trust level: required ${this.capability.security.minTrustLevel}, got ${context.trustLevel}`,
        securityFlags: ['INSUFFICIENT_TRUST_LEVEL']
      };
    }

    // Check required capabilities
    const missingCapabilities = this.capability.security.requiredCapabilities.filter(
      cap => !context.capabilities.includes(cap)
    );

    if (missingCapabilities.length > 0) {
      return {
        valid: false,
        reason: `Missing required capabilities: ${missingCapabilities.join(', ')}`,
        securityFlags: ['MISSING_CAPABILITIES']
      };
    }

    // Additional security checks can be implemented by subclasses
    const additionalChecks = await this.performAdditionalSecurityChecks(context);
    securityFlags.push(...additionalChecks.securityFlags);

    return {
      valid: additionalChecks.valid,
      reason: additionalChecks.reason,
      securityFlags
    };
  }

  /**
   * Check rate limits for the agent
   */
  protected async checkRateLimits(context: A2AToolContext): Promise<{
    allowed: boolean;
    reason?: string;
    retryAfter?: number;
  }> {
    if (!this.capability.security.rateLimits) {
      return { allowed: true };
    }

    const limits = this.capability.security.rateLimits;
    const now = Date.now();
    const agentKey = `ratelimit:${this.toolId}:${context.agentId}`;

    // Check per-minute limit
    const minuteKey = `${agentKey}:minute:${Math.floor(now / 60000)}`;
    const minuteCount = await this.cache.get<number>(minuteKey) || 0;
    
    if (minuteCount >= limits.perMinute) {
      return {
        allowed: false,
        reason: 'Per-minute rate limit exceeded',
        retryAfter: 60 - (Math.floor(now / 1000) % 60)
      };
    }

    // Check per-hour limit
    const hourKey = `${agentKey}:hour:${Math.floor(now / 3600000)}`;
    const hourCount = await this.cache.get<number>(hourKey) || 0;
    
    if (hourCount >= limits.perHour) {
      return {
        allowed: false,
        reason: 'Per-hour rate limit exceeded',
        retryAfter: 3600 - (Math.floor(now / 1000) % 3600)
      };
    }

    // Check per-day limit
    const dayKey = `${agentKey}:day:${Math.floor(now / 86400000)}`;
    const dayCount = await this.cache.get<number>(dayKey) || 0;
    
    if (dayCount >= limits.perDay) {
      return {
        allowed: false,
        reason: 'Per-day rate limit exceeded',
        retryAfter: 86400 - (Math.floor(now / 1000) % 86400)
      };
    }

    // Increment counters
    await Promise.all([
      this.cache.set(minuteKey, minuteCount + 1, 60000),
      this.cache.set(hourKey, hourCount + 1, 3600000),
      this.cache.set(dayKey, dayCount + 1, 86400000)
    ]);

    return { allowed: true };
  }

  /**
   * Get cached result if available
   */
  protected async getCachedResult(invocation: A2AToolInvocation): Promise<A2AToolResponse | null> {
    const cacheKey = this.generateCacheKey(invocation);
    const cached = await this.cache.get<A2AToolResponse>(cacheKey);
    
    if (cached) {
      this.logger.debug('Cache hit for A2A tool invocation', {
        toolId: this.toolId,
        requestId: invocation.requestId,
        cacheKey
      });
    }

    return cached;
  }

  /**
   * Cache successful result
   */
  protected async cacheResult(invocation: A2AToolInvocation, response: A2AToolResponse): Promise<void> {
    if (!response.success) return;

    const cacheKey = this.generateCacheKey(invocation);
    const strategy = this.capability.performance.cacheStrategy || 'conservative';
    
    let ttl: number;
    switch (strategy) {
      case 'aggressive':
        ttl = 300000; // 5 minutes
        break;
      case 'conservative':
        ttl = 60000; // 1 minute
        break;
      default:
        return; // No caching
    }

    await this.cache.set(cacheKey, response, ttl);
  }

  /**
   * Generate cache key for invocation
   */
  protected generateCacheKey(invocation: A2AToolInvocation): string {
    const keyData = {
      toolId: this.toolId,
      parameters: invocation.parameters,
      agentId: invocation.context.agentId,
      trustLevel: invocation.context.trustLevel
    };

    return `a2a_tool:${Buffer.from(JSON.stringify(keyData)).toString('base64')}`;
  }

  /**
   * Create error response
   */
  protected createErrorResponse(
    invocation: A2AToolInvocation,
    code: string,
    message: string,
    startTime: number,
    details?: any
  ): A2AToolResponse {
    return {
      requestId: invocation.requestId,
      toolId: this.toolId,
      success: false,
      error: {
        code,
        message,
        details
      },
      metadata: {
        executionTime: Date.now() - startTime,
        resourceUsage: { cpu: 0, memory: 0, network: 0 },
        cached: false,
        trustVerified: false,
        securityFlags: []
      },
      timestamp: Date.now()
    };
  }

  /**
   * Update metrics after successful invocation
   */
  protected updateMetrics(response: A2AToolResponse, startTime: number): void {
    const executionTime = Date.now() - startTime;
    
    // Update average latency
    this.metrics.avgLatency = 
      (this.metrics.avgLatency * (this.metrics.invocations - 1) + executionTime) / 
      this.metrics.invocations;

    // Update success rate
    const successes = Math.floor(this.metrics.successRate * (this.metrics.invocations - 1));
    this.metrics.successRate = 
      (successes + (response.success ? 1 : 0)) / this.metrics.invocations;

    // Update resource utilization
    this.metrics.resourceUtilization.cpu = 
      (this.metrics.resourceUtilization.cpu + response.metadata.resourceUsage.cpu) / 2;
    this.metrics.resourceUtilization.memory = 
      (this.metrics.resourceUtilization.memory + response.metadata.resourceUsage.memory) / 2;
    this.metrics.resourceUtilization.network = 
      (this.metrics.resourceUtilization.network + (response.metadata.resourceUsage.network || 0)) / 2;
  }

  /**
   * Update error metrics
   */
  protected updateErrorMetrics(error: Error): void {
    const errorType = error.constructor.name;
    this.metrics.errorCounts[errorType] = (this.metrics.errorCounts[errorType] || 0) + 1;
  }

  // Abstract methods to be implemented by concrete tool wrappers

  /**
   * Transform A2A invocation parameters to MCP format
   */
  protected abstract transformToMCP(invocation: A2AToolInvocation): Promise<any>;

  /**
   * Execute the underlying MCP tool
   */
  protected abstract executeMCPTool(params: any, context: A2AToolContext): Promise<MCPToolResult>;

  /**
   * Transform MCP result to A2A response format
   */
  protected abstract transformFromMCP(
    result: MCPToolResult, 
    invocation: A2AToolInvocation, 
    startTime: number
  ): Promise<A2AToolResponse>;

  /**
   * Perform additional security checks (can be overridden by subclasses)
   */
  protected async performAdditionalSecurityChecks(context: A2AToolContext): Promise<{
    valid: boolean;
    reason?: string;
    securityFlags: string[];
  }> {
    return {
      valid: true,
      securityFlags: []
    };
  }
}

/**
 * Utility functions for A2A tool management
 */
export class A2AToolUtils {
  /**
   * Validate A2A capability definition
   */
  static validateCapability(capability: A2ACapability): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!capability.name || typeof capability.name !== 'string') {
      errors.push('Capability name is required and must be a string');
    }

    if (!capability.version || typeof capability.version !== 'string') {
      errors.push('Capability version is required and must be a string');
    }

    if (!capability.description || typeof capability.description !== 'string') {
      errors.push('Capability description is required and must be a string');
    }

    if (!capability.parameters || typeof capability.parameters !== 'object') {
      errors.push('Capability parameters definition is required');
    }

    if (!capability.security || typeof capability.security !== 'object') {
      errors.push('Capability security configuration is required');
    }

    if (!capability.performance || typeof capability.performance !== 'object') {
      errors.push('Capability performance configuration is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Create A2A context from basic parameters
   */
  static createContext(
    agentId: string,
    agentType: string,
    sessionId: string,
    trustLevel: A2AToolContext['trustLevel'] = 'basic',
    capabilities: string[] = [],
    metadata: Record<string, any> = {}
  ): A2AToolContext {
    return {
      agentId,
      agentType,
      sessionId,
      trustLevel,
      capabilities,
      metadata,
      timestamp: Date.now()
    };
  }

  /**
   * Generate unique request ID
   */
  static generateRequestId(): string {
    return `a2a_req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}