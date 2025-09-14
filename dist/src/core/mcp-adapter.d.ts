/**
 * MCP-to-Gemini Adapter Layer
 *
 * Translates Model Context Protocol (MCP) requests to Gemini API calls
 * and handles response transformation for seamless integration
 */
import { MCPRequest, MCPResponse } from "../types/mcp.js";
import { MCPToolName, MCPToolParameters, MCPToolReturnType } from "../types/mcp-tools.js";
import { TopologyType } from "../protocols/protocol-activator.js";
export declare class MCPToGeminiAdapter {
    private genAI;
    private model;
    private cache;
    private optimizer;
    private logger;
    private topology?;
    private metrics;
    constructor(apiKey: string, modelName?: string, options?: {
        topology: TopologyType;
    });
    /**
     * Transform MCP request to Gemini format
     */
    processRequest(request: MCPRequest): Promise<MCPResponse>;
    /**
     * Transform MCP tools to Gemini function declarations
     */
    private transformTools;
    /**
     * Transform conversation history
     */
    private transformHistory;
    /**
     * Transform Gemini response to MCP format
     */
    private transformResponse;
    /**
     * Generate cache key for request
     */
    private generateCacheKey;
    /**
     * Transform errors to MCP format
     */
    private transformError;
    /**
     * Get adapter metrics
     */
    getMetrics(): {
        cacheHitRate: number;
        avgLatency: number;
        avgTokensPerRequest: number;
        requestCount: number;
        cacheHits: number;
        totalLatency: number;
        contextTokens: number;
    };
    /**
     * Type-safe MCP tool caller
     */
    callMCPTool<T extends MCPToolName>(toolName: T, params: MCPToolParameters<T>): Promise<MCPToolReturnType<T>>;
    /**
     * Check if a tool name is a valid MCP tool
     */
    isMCPTool(toolName: string): toolName is MCPToolName;
    /**
     * Get available MCP tools
     */
    getAvailableMCPTools(): MCPToolName[];
}
//# sourceMappingURL=mcp-adapter.d.ts.map