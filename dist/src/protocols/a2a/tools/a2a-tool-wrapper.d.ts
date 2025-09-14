/**
 * A2A Tool Wrapper Base Class
 *
 * Provides a unified interface for wrapping MCP tools with A2A (Agent-to-Agent) capabilities.
 * This base class handles the transformation of MCP tool calls into A2A-compliant messages,
 * manages security contexts, and provides performance optimization hooks.
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { Logger } from "../../../utils/logger.js";
import { CacheManager } from "../../../core/cache-manager.js";
import { PerformanceMonitor } from "../../../monitoring/performance-monitor.js";
import { MCPToolResult } from "../../../types/mcp-tools.js";
export interface A2AToolContext {
    agentId: string;
    agentType: string;
    sessionId: string;
    trustLevel: "untrusted" | "basic" | "verified" | "trusted" | "privileged";
    capabilities: string[];
    metadata: Record<string, any>;
    timestamp: number;
}
export interface A2ACapability {
    name: string;
    version: string;
    description: string;
    parameters: {
        type: "object";
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
        resourceUsage: "low" | "medium" | "high";
        cacheable: boolean;
        cacheStrategy?: "aggressive" | "conservative" | "none";
    };
}
export interface A2AToolInvocation {
    toolId: string;
    capabilityName: string;
    parameters: Record<string, any>;
    context: A2AToolContext;
    requestId: string;
    timestamp: number;
    priority: "low" | "medium" | "high" | "critical";
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
export declare abstract class A2AToolWrapper extends EventEmitter {
    protected toolId: string;
    protected capability: A2ACapability;
    protected logger: Logger;
    protected cache: CacheManager;
    protected performanceMonitor: PerformanceMonitor;
    protected metrics: A2AToolMetrics;
    constructor(toolId: string, capability: A2ACapability);
    /**
     * Main entry point for A2A tool invocation
     */
    invoke(invocation: A2AToolInvocation): Promise<A2AToolResponse>;
    /**
     * Get the A2A capability definition for this tool
     */
    getCapability(): A2ACapability;
    /**
     * Get current metrics for this tool
     */
    getMetrics(): A2AToolMetrics;
    /**
     * Reset metrics (useful for testing or monitoring cycles)
     */
    resetMetrics(): void;
    /**
     * Validate security context for the invocation
     */
    protected validateSecurity(context: A2AToolContext): Promise<{
        valid: boolean;
        reason?: string;
        securityFlags: string[];
    }>;
    /**
     * Check rate limits for the agent
     */
    protected checkRateLimits(context: A2AToolContext): Promise<{
        allowed: boolean;
        reason?: string;
        retryAfter?: number;
    }>;
    /**
     * Get cached result if available
     */
    protected getCachedResult(invocation: A2AToolInvocation): Promise<A2AToolResponse | null>;
    /**
     * Cache successful result
     */
    protected cacheResult(invocation: A2AToolInvocation, response: A2AToolResponse): Promise<void>;
    /**
     * Generate cache key for invocation
     */
    protected generateCacheKey(invocation: A2AToolInvocation): string;
    /**
     * Create error response
     */
    protected createErrorResponse(invocation: A2AToolInvocation, code: string, message: string, startTime: number, details?: any): A2AToolResponse;
    /**
     * Update metrics after successful invocation
     */
    protected updateMetrics(response: A2AToolResponse, startTime: number): void;
    /**
     * Update error metrics
     */
    protected updateErrorMetrics(error: Error): void;
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
    protected abstract transformFromMCP(result: MCPToolResult, invocation: A2AToolInvocation, startTime: number): Promise<A2AToolResponse>;
    /**
     * Perform additional security checks (can be overridden by subclasses)
     */
    protected performAdditionalSecurityChecks(context: A2AToolContext): Promise<{
        valid: boolean;
        reason?: string;
        securityFlags: string[];
    }>;
}
/**
 * Utility functions for A2A tool management
 */
export declare class A2AToolUtils {
    /**
     * Validate A2A capability definition
     */
    static validateCapability(capability: A2ACapability): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Create A2A context from basic parameters
     */
    static createContext(agentId: string, agentType: string, sessionId: string, trustLevel?: A2AToolContext["trustLevel"], capabilities?: string[], metadata?: Record<string, any>): A2AToolContext;
    /**
     * Generate unique request ID
     */
    static generateRequestId(): string;
}
//# sourceMappingURL=a2a-tool-wrapper.d.ts.map