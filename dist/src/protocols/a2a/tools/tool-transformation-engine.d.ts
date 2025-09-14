/**
 * Tool Transformation Engine
 *
 * Handles bidirectional transformation between MCP tools and A2A capabilities.
 * Provides intelligent parameter mapping, result transformation, and format conversion.
 * Manages schema validation, type coercion, and compatibility layers.
 */
import { MCPToolName, MCPToolResult } from "../../../types/mcp-tools.js";
import { A2AToolContext, A2AToolInvocation, A2AToolResponse } from "./a2a-tool-wrapper.js";
export interface TransformationRule {
    id: string;
    sourceType: "mcp" | "a2a";
    targetType: "mcp" | "a2a";
    sourceSchema: any;
    targetSchema: any;
    mappings: ParameterMapping[];
    conditions?: TransformationCondition[];
    metadata: {
        version: string;
        author: string;
        description: string;
        lastUpdated: Date;
    };
}
export interface ParameterMapping {
    sourcePath: string;
    targetPath: string;
    transform?: TransformFunction;
    required: boolean;
    defaultValue?: any;
    validation?: ValidationRule;
}
export interface TransformationCondition {
    type: "exists" | "equals" | "greater" | "less" | "matches" | "custom";
    path: string;
    value?: any;
    customCheck?: (data: any) => boolean;
}
export interface ValidationRule {
    type: "string" | "number" | "boolean" | "array" | "object" | "enum";
    constraints?: {
        min?: number;
        max?: number;
        pattern?: RegExp;
        allowedValues?: any[];
        required?: boolean;
    };
}
export interface TransformFunction {
    name: string;
    implementation: (value: any, context?: any) => any;
    description: string;
    returnType: string;
}
export interface TransformationContext {
    sourceFormat: "mcp" | "a2a";
    targetFormat: "mcp" | "a2a";
    toolName: string;
    agentContext?: A2AToolContext;
    metadata: Record<string, any>;
    preserveTypes: boolean;
    strictValidation: boolean;
}
export interface TransformationResult<T = any> {
    success: boolean;
    data?: T;
    errors: TransformationError[];
    warnings: string[];
    metadata: {
        appliedRules: string[];
        transformationsApplied: number;
        executionTime: number;
        dataLoss?: string[];
    };
}
export interface TransformationError {
    code: string;
    message: string;
    path?: string;
    value?: any;
    severity: "error" | "warning" | "info";
}
/**
 * Main transformation engine for MCP ↔ A2A conversions
 */
export declare class ToolTransformationEngine {
    private logger;
    private cache;
    private transformationRules;
    private transformFunctions;
    private schemaCache;
    constructor();
    /**
     * Transform MCP tool invocation to A2A format
     */
    transformMCPToA2A(toolName: MCPToolName, parameters: any, context: A2AToolContext, options?: {
        strict?: boolean;
        preserveMetadata?: boolean;
        targetCapability?: string;
    }): Promise<TransformationResult<A2AToolInvocation>>;
    /**
     * Transform A2A response to MCP result format
     */
    transformA2AToMCP(a2aResponse: A2AToolResponse, originalToolName: MCPToolName, options?: {
        strict?: boolean;
        preserveMetadata?: boolean;
    }): Promise<TransformationResult<MCPToolResult>>;
    /**
     * Register a new transformation rule
     */
    registerTransformationRule(rule: TransformationRule): Promise<void>;
    /**
     * Register a custom transform function
     */
    registerTransformFunction(func: TransformFunction): void;
    /**
     * Get available transformation rules
     */
    getTransformationRules(sourceType?: "mcp" | "a2a", targetType?: "mcp" | "a2a"): TransformationRule[];
    /**
     * Private helper methods
     */
    private initializeBuiltInTransforms;
    private findTransformationRule;
    private matchesPattern;
    private validateParameters;
    private applyParameterMappings;
    private applyReverseParameterMappings;
    private getNestedValue;
    private setNestedValue;
    private validateValue;
    private validateTransformationRule;
    private generateToolId;
    private deriveCapabilityName;
    private generateRequestId;
    private derivePriority;
    private createErrorResult;
}
//# sourceMappingURL=tool-transformation-engine.d.ts.map