/**
 * A2A MCP Bridge
 *
 * Seamless translation bridge between MCP (Model Context Protocol) and A2A (Agent-to-Agent) protocols.
 * Provides bidirectional translation with parameter transformation and response mapping.
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { A2AMessage, A2AResponse, MCPToA2AMapping } from "../../../types/a2a.js";
import { MCPRequest, MCPResponse } from "../../../types/mcp.js";
import { TopologyType } from "../../protocol-activator.js";
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
    errorsByType: {
        [errorType: string]: number;
    };
}
/**
 * A2A MCP Bridge implementation
 */
export declare class A2AMCPBridge extends EventEmitter {
    private logger;
    private mappings;
    private reverseMappings;
    private transformationCache;
    private isInitialized;
    private topology?;
    private metrics;
    private cacheEnabled;
    private cacheTTL;
    private maxCacheSize;
    constructor(options?: {
        topology: TopologyType;
    });
    /**
     * Initialize the MCP bridge
     */
    initialize(): Promise<void>;
    /**
     * Shutdown the MCP bridge
     */
    shutdown(): Promise<void>;
    /**
     * Translate MCP request to A2A message
     */
    translateMCPToA2A(mcpRequest: MCPRequest): Promise<A2AMessage>;
    /**
     * Translate A2A message to MCP request
     */
    translateA2AToMCP(a2aMessage: A2AMessage): Promise<MCPRequest>;
    /**
     * Translate MCP response to A2A response
     */
    translateMCPResponseToA2A(mcpResponse: MCPResponse): Promise<A2AResponse>;
    /**
     * Translate A2A response to MCP response
     */
    translateA2AResponseToMCP(a2aResponse: A2AResponse): Promise<MCPResponse>;
    /**
     * Register a method mapping
     */
    registerMapping(mapping: MCPToA2AMapping): void;
    /**
     * Unregister a method mapping
     */
    unregisterMapping(mcpMethod: string): void;
    /**
     * Get all mappings
     */
    getMappings(): Map<string, MCPToA2AMapping>;
    /**
     * Get bridge metrics
     */
    getBridgeMetrics(): BridgeMetrics;
    /**
     * Register default mappings for common MCP tools
     */
    private registerDefaultMappings;
    /**
     * Find MCP mapping for request
     */
    private findMCPMapping;
    /**
     * Extract MCP method from request
     */
    private extractMCPMethod;
    /**
     * Transform parameters using mapping
     */
    private transformParameters;
    /**
     * Reverse transform parameters (A2A to MCP)
     */
    private reverseTransformParameters;
    /**
     * Transform response using response mapping
     */
    private transformResponse;
    /**
     * Reverse transform response data (A2A to MCP)
     */
    private reverseTransformResponseData;
    /**
     * Determine target agent for A2A message
     */
    private determineTargetAgent;
    /**
     * Determine message priority from MCP request
     */
    private determinePriority;
    /**
     * Create A2A context from MCP request
     */
    private createA2AContext;
    /**
     * Generate MCP prompt from A2A message
     */
    private generateMCPPrompt;
    /**
     * Generate parameter schema for MCP tool
     */
    private generateParameterSchema;
    /**
     * Extract required parameters from mapping
     */
    private extractRequiredParameters;
    /**
     * Validate A2A message format
     */
    private validateA2AMessage;
    /**
     * Check if parameter is required
     */
    private isRequiredParameter;
    /**
     * Get nested value from object
     */
    private getNestedValue;
    /**
     * Set nested value in object
     */
    private setNestedValue;
    /**
     * Reverse transform value (simple heuristic)
     */
    private reverseTransform;
    /**
     * Generate cache key
     */
    private generateCacheKey;
    /**
     * Get cached transformation
     */
    private getCachedTransformation;
    /**
     * Cache transformation result
     */
    private cacheTransformation;
    /**
     * Clean up expired cache entries
     */
    private cleanupCache;
    /**
     * Track translation success
     */
    private trackTranslationSuccess;
    /**
     * Track translation error
     */
    private trackTranslationError;
}
//# sourceMappingURL=a2a-mcp-bridge.d.ts.map