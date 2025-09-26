/**
 * MCP-A2A Tool Registry
 *
 * Comprehensive registry mapping all 104 MCP tools to A2A capabilities.
 * Provides automatic tool discovery, capability generation, and wrapper instantiation.
 * Maintains compatibility matrices and version management.
 */
import { MCPToolName } from "../../../types/mcp-tools.js";
import { A2ACapability, A2AToolWrapper } from "./a2a-tool-wrapper.js";
import { CapabilityManager } from "./capability-manager.js";
import { ToolTransformationEngine, TransformationRule } from "./tool-transformation-engine.js";
export interface MCPToolRegistration {
    toolName: MCPToolName;
    mcpProvider: "ruv-swarm" | "gemini-flow";
    category: string;
    description: string;
    parameters: any;
    a2aCapability: A2ACapability;
    transformationRules: TransformationRule[];
    wrapper: A2AToolWrapper;
    metadata: {
        version: string;
        lastUpdated: Date;
        usageCount: number;
        averageLatency: number;
        successRate: number;
        tags: string[];
    };
}
export interface ToolCategoryDefinition {
    name: string;
    description: string;
    baseTrustLevel: string;
    commonCapabilities: string[];
    performanceProfile: {
        expectedLatency: number;
        resourceUsage: "low" | "medium" | "high";
    };
    securityProfile: {
        riskLevel: "low" | "medium" | "high";
        auditRequired: boolean;
        rateLimitingRequired: boolean;
    };
}
export interface CompatibilityMatrix {
    version: string;
    lastUpdated: Date;
    toolCompatibility: Record<string, {
        compatible: string[];
        incompatible: string[];
        conflicts: string[];
    }>;
    categoryCompatibility: Record<string, string[]>;
    trustLevelCompatibility: Record<string, string[]>;
}
/**
 * Main MCP-A2A Tool Registry
 */
export declare class MCPToolRegistry {
    private logger;
    private cache;
    private capabilityManager;
    private transformationEngine;
    private registrations;
    private categories;
    private compatibilityMatrix;
    constructor(capabilityManager: CapabilityManager, transformationEngine: ToolTransformationEngine);
    /**
     * Initialize the registry with all MCP tools
     */
    initialize(): Promise<void>;
    /**
     * Get tool registration by name
     */
    getToolRegistration(toolName: MCPToolName): MCPToolRegistration | undefined;
    /**
     * List all registered tools
     */
    listTools(category?: string, provider?: "ruv-swarm" | "gemini-flow"): MCPToolRegistration[];
    /**
     * Get tools by category
     */
    getToolsByCategory(category: string): MCPToolRegistration[];
    /**
     * Search tools by capability requirements
     */
    searchTools(requirements: {
        capabilities?: string[];
        maxLatency?: number;
        minTrustLevel?: string;
        resourceConstraints?: string;
        tags?: string[];
    }): Promise<MCPToolRegistration[]>;
    /**
     * Get compatibility information
     */
    getCompatibilityMatrix(): CompatibilityMatrix;
    /**
     * Check if two tools are compatible
     */
    areToolsCompatible(tool1: MCPToolName, tool2: MCPToolName): boolean;
    /**
     * Update tool usage statistics
     */
    updateToolUsage(toolName: MCPToolName, success: boolean, latency: number): void;
    /**
     * Private initialization methods
     */
    private initializeCategories;
    private registerRuvSwarmTools;
    private registerClaudeFlowTools;
    private registerTool;
    private generateCompatibilityMatrix;
    private registerTransformationRules;
    private getTrustLevelIndex;
}
//# sourceMappingURL=mcp-a2a-tool-registry.d.ts.map