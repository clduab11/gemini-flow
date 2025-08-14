/**
 * Tool Transformation Engine
 * 
 * Handles bidirectional transformation between MCP tools and A2A capabilities.
 * Provides intelligent parameter mapping, result transformation, and format conversion.
 * Manages schema validation, type coercion, and compatibility layers.
 */

import { Logger } from '../../../utils/logger.js';
import { CacheManager } from '../../../core/cache-manager.js';
import { MCPToolName, MCPToolParameters, MCPToolResult } from '../../../types/mcp-tools.js';
import { A2ACapability, A2AToolContext, A2AToolInvocation, A2AToolResponse } from './a2a-tool-wrapper.js';

export interface TransformationRule {
  id: string;
  sourceType: 'mcp' | 'a2a';
  targetType: 'mcp' | 'a2a';
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
  type: 'exists' | 'equals' | 'greater' | 'less' | 'matches' | 'custom';
  path: string;
  value?: any;
  customCheck?: (data: any) => boolean;
}

export interface ValidationRule {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'enum';
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
  sourceFormat: 'mcp' | 'a2a';
  targetFormat: 'mcp' | 'a2a';
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
  severity: 'error' | 'warning' | 'info';
}

/**
 * Main transformation engine for MCP ↔ A2A conversions
 */
export class ToolTransformationEngine {
  private logger: Logger;
  private cache: CacheManager;
  private transformationRules = new Map<string, TransformationRule>();
  private transformFunctions = new Map<string, TransformFunction>();
  private schemaCache = new Map<string, any>();

  constructor() {
    this.logger = new Logger('ToolTransformationEngine');
    this.cache = new CacheManager();
    
    this.initializeBuiltInTransforms();
    this.logger.info('Tool Transformation Engine initialized');
  }

  /**
   * Transform MCP tool invocation to A2A format
   */
  async transformMCPToA2A(
    toolName: MCPToolName,
    parameters: any,
    context: A2AToolContext,
    options: {
      strict?: boolean;
      preserveMetadata?: boolean;
      targetCapability?: string;
    } = {}
  ): Promise<TransformationResult<A2AToolInvocation>> {
    const startTime = Date.now();
    const transformationContext: TransformationContext = {
      sourceFormat: 'mcp',
      targetFormat: 'a2a',
      toolName,
      agentContext: context,
      metadata: {},
      preserveTypes: true,
      strictValidation: options.strict || false
    };

    try {
      // Find appropriate transformation rule
      const rule = await this.findTransformationRule(toolName, 'mcp', 'a2a');
      if (!rule) {
        return this.createErrorResult('NO_TRANSFORMATION_RULE', 
          `No transformation rule found for MCP tool: ${toolName}`, startTime);
      }

      // Validate source parameters against MCP schema
      const sourceValidation = await this.validateParameters(parameters, rule.sourceSchema, transformationContext);
      if (!sourceValidation.success) {
        return {
          success: false,
          errors: sourceValidation.errors,
          warnings: [],
          metadata: {
            appliedRules: [],
            transformationsApplied: 0,
            executionTime: Date.now() - startTime
          }
        };
      }

      // Apply parameter mappings
      const transformedParams = await this.applyParameterMappings(
        parameters,
        rule.mappings,
        transformationContext
      );

      // Create A2A invocation
      const a2aInvocation: A2AToolInvocation = {
        toolId: this.generateToolId(toolName),
        capabilityName: options.targetCapability || this.deriveCapabilityName(toolName),
        parameters: transformedParams.data || {},
        context,
        requestId: this.generateRequestId(),
        timestamp: Date.now(),
        priority: this.derivePriority(parameters)
      };

      // Validate target format
      const targetValidation = await this.validateParameters(
        a2aInvocation.parameters,
        rule.targetSchema,
        transformationContext
      );

      const result: TransformationResult<A2AToolInvocation> = {
        success: targetValidation.success,
        data: targetValidation.success ? a2aInvocation : undefined,
        errors: [...sourceValidation.errors, ...targetValidation.errors, ...transformedParams.errors],
        warnings: [...sourceValidation.warnings, ...targetValidation.warnings, ...transformedParams.warnings],
        metadata: {
          appliedRules: [rule.id],
          transformationsApplied: rule.mappings.length,
          executionTime: Date.now() - startTime
        }
      };

      this.logger.debug('MCP to A2A transformation completed', {
        toolName,
        success: result.success,
        executionTime: result.metadata.executionTime
      });

      return result;

    } catch (error: any) {
      this.logger.error('MCP to A2A transformation failed', { toolName, error: error.message });
      return this.createErrorResult('TRANSFORMATION_ERROR', error.message, startTime);
    }
  }

  /**
   * Transform A2A response to MCP result format
   */
  async transformA2AToMCP(
    a2aResponse: A2AToolResponse,
    originalToolName: MCPToolName,
    options: {
      strict?: boolean;
      preserveMetadata?: boolean;
    } = {}
  ): Promise<TransformationResult<MCPToolResult>> {
    const startTime = Date.now();
    const transformationContext: TransformationContext = {
      sourceFormat: 'a2a',
      targetFormat: 'mcp',
      toolName: originalToolName,
      metadata: {},
      preserveTypes: true,
      strictValidation: options.strict || false
    };

    try {
      // Find appropriate transformation rule
      const rule = await this.findTransformationRule(originalToolName, 'a2a', 'mcp');
      if (!rule) {
        return this.createErrorResult('NO_TRANSFORMATION_RULE', 
          `No reverse transformation rule found for tool: ${originalToolName}`, startTime);
      }

      // Transform A2A response to MCP result format
      const mcpResult: MCPToolResult = {
        success: a2aResponse.success,
        timestamp: a2aResponse.timestamp
      };

      if (a2aResponse.success && a2aResponse.data) {
        // Apply reverse parameter mappings for data
        const transformedData = await this.applyReverseParameterMappings(
          a2aResponse.data,
          rule.mappings,
          transformationContext
        );

        mcpResult.data = transformedData.data;
      } else if (a2aResponse.error) {
        mcpResult.error = a2aResponse.error.message;
        mcpResult.message = a2aResponse.error.message;
      }

      // Add metadata if preservation is enabled
      if (options.preserveMetadata && a2aResponse.metadata) {
        mcpResult.message = mcpResult.message || `Execution time: ${a2aResponse.metadata.executionTime}ms`;
      }

      const result: TransformationResult<MCPToolResult> = {
        success: true,
        data: mcpResult,
        errors: [],
        warnings: [],
        metadata: {
          appliedRules: [rule.id],
          transformationsApplied: rule.mappings.length,
          executionTime: Date.now() - startTime
        }
      };

      this.logger.debug('A2A to MCP transformation completed', {
        toolName: originalToolName,
        success: result.success,
        executionTime: result.metadata.executionTime
      });

      return result;

    } catch (error: any) {
      this.logger.error('A2A to MCP transformation failed', { 
        toolName: originalToolName, 
        error: error.message 
      });
      return this.createErrorResult('TRANSFORMATION_ERROR', error.message, startTime);
    }
  }

  /**
   * Register a new transformation rule
   */
  async registerTransformationRule(rule: TransformationRule): Promise<void> {
    // Validate rule
    const validation = this.validateTransformationRule(rule);
    if (!validation.valid) {
      throw new Error(`Invalid transformation rule: ${validation.errors.join(', ')}`);
    }

    this.transformationRules.set(rule.id, rule);
    
    // Cache schemas for quick lookup
    await this.cache.set(`schema:${rule.id}:source`, rule.sourceSchema, 3600000);
    await this.cache.set(`schema:${rule.id}:target`, rule.targetSchema, 3600000);

    this.logger.info('Transformation rule registered', {
      id: rule.id,
      sourceType: rule.sourceType,
      targetType: rule.targetType
    });
  }

  /**
   * Register a custom transform function
   */
  registerTransformFunction(func: TransformFunction): void {
    this.transformFunctions.set(func.name, func);
    this.logger.debug('Transform function registered', { name: func.name });
  }

  /**
   * Get available transformation rules
   */
  getTransformationRules(
    sourceType?: 'mcp' | 'a2a',
    targetType?: 'mcp' | 'a2a'
  ): TransformationRule[] {
    const rules = Array.from(this.transformationRules.values());
    
    return rules.filter(rule => {
      if (sourceType && rule.sourceType !== sourceType) return false;
      if (targetType && rule.targetType !== targetType) return false;
      return true;
    });
  }

  /**
   * Private helper methods
   */

  private async initializeBuiltInTransforms(): Promise<void> {
    // Register common transform functions
    this.registerTransformFunction({
      name: 'toUpperCase',
      implementation: (value: string) => typeof value === 'string' ? value.toUpperCase() : value,
      description: 'Convert string to uppercase',
      returnType: 'string'
    });

    this.registerTransformFunction({
      name: 'toLowerCase',
      implementation: (value: string) => typeof value === 'string' ? value.toLowerCase() : value,
      description: 'Convert string to lowercase',
      returnType: 'string'
    });

    this.registerTransformFunction({
      name: 'parseJSON',
      implementation: (value: string) => {
        try {
          return typeof value === 'string' ? JSON.parse(value) : value;
        } catch {
          return value;
        }
      },
      description: 'Parse JSON string to object',
      returnType: 'object'
    });

    this.registerTransformFunction({
      name: 'stringify',
      implementation: (value: any) => typeof value === 'object' ? JSON.stringify(value) : String(value),
      description: 'Convert value to string',
      returnType: 'string'
    });

    this.registerTransformFunction({
      name: 'arrayToString',
      implementation: (value: any[], separator = ',') => 
        Array.isArray(value) ? value.join(separator) : value,
      description: 'Convert array to comma-separated string',
      returnType: 'string'
    });

    this.registerTransformFunction({
      name: 'stringToArray',
      implementation: (value: string, separator = ',') => 
        typeof value === 'string' ? value.split(separator).map(s => s.trim()) : value,
      description: 'Convert comma-separated string to array',
      returnType: 'array'
    });

    this.logger.debug('Built-in transform functions initialized');
  }

  private async findTransformationRule(
    toolName: string,
    sourceType: 'mcp' | 'a2a',
    targetType: 'mcp' | 'a2a'
  ): Promise<TransformationRule | null> {
    // Look for exact tool name match first
    for (const rule of this.transformationRules.values()) {
      if (rule.sourceType === sourceType && 
          rule.targetType === targetType &&
          rule.sourceSchema.toolName === toolName) {
        return rule;
      }
    }

    // Look for pattern matches
    for (const rule of this.transformationRules.values()) {
      if (rule.sourceType === sourceType && 
          rule.targetType === targetType &&
          this.matchesPattern(toolName, rule.sourceSchema.pattern)) {
        return rule;
      }
    }

    return null;
  }

  private matchesPattern(toolName: string, pattern?: string): boolean {
    if (!pattern) return false;
    
    // Simple pattern matching - could be enhanced with regex
    if (pattern.includes('*')) {
      const regexPattern = pattern.replace(/\*/g, '.*');
      return new RegExp(`^${regexPattern}$`).test(toolName);
    }
    
    return toolName === pattern;
  }

  private async validateParameters(
    parameters: any,
    schema: any,
    context: TransformationContext
  ): Promise<{ success: boolean; errors: TransformationError[]; warnings: string[] }> {
    const errors: TransformationError[] = [];
    const warnings: string[] = [];

    if (!schema) {
      return { success: true, errors, warnings };
    }

    // Basic validation - could be enhanced with JSON Schema validation
    if (schema.required && Array.isArray(schema.required)) {
      for (const requiredField of schema.required) {
        if (!Object.hasOwn(parameters, requiredField)) {
          errors.push({
            code: 'MISSING_REQUIRED_FIELD',
            message: `Required field missing: ${requiredField}`,
            path: requiredField,
            severity: 'error'
          });
        }
      }
    }

    return {
      success: errors.length === 0,
      errors,
      warnings
    };
  }

  private async applyParameterMappings(
    sourceData: any,
    mappings: ParameterMapping[],
    context: TransformationContext
  ): Promise<TransformationResult<any>> {
    const result: any = {};
    const errors: TransformationError[] = [];
    const warnings: string[] = [];

    for (const mapping of mappings) {
      try {
        const sourceValue = this.getNestedValue(sourceData, mapping.sourcePath);
        
        if (sourceValue === undefined) {
          if (mapping.required) {
            errors.push({
              code: 'MISSING_REQUIRED_MAPPING',
              message: `Required source value missing at path: ${mapping.sourcePath}`,
              path: mapping.sourcePath,
              severity: 'error'
            });
            continue;
          } else if (mapping.defaultValue !== undefined) {
            this.setNestedValue(result, mapping.targetPath, mapping.defaultValue);
            continue;
          }
        }

        let transformedValue = sourceValue;

        // Apply transformation function if specified
        if (mapping.transform) {
          const transformFunc = this.transformFunctions.get(mapping.transform.name);
          if (transformFunc) {
            transformedValue = transformFunc.implementation(sourceValue, context);
          } else {
            warnings.push(`Transform function not found: ${mapping.transform.name}`);
          }
        }

        // Apply validation if specified
        if (mapping.validation) {
          const validationResult = this.validateValue(transformedValue, mapping.validation);
          if (!validationResult.valid) {
            errors.push({
              code: 'VALIDATION_FAILED',
              message: validationResult.message || 'Validation failed',
              path: mapping.targetPath,
              value: transformedValue,
              severity: 'error'
            });
            continue;
          }
        }

        this.setNestedValue(result, mapping.targetPath, transformedValue);

      } catch (error: any) {
        errors.push({
          code: 'MAPPING_ERROR',
          message: `Error applying mapping ${mapping.sourcePath} -> ${mapping.targetPath}: ${error.message}`,
          path: mapping.sourcePath,
          severity: 'error'
        });
      }
    }

    return {
      success: errors.length === 0,
      data: result,
      errors,
      warnings,
      metadata: {
        appliedRules: [],
        transformationsApplied: mappings.length,
        executionTime: 0
      }
    };
  }

  private async applyReverseParameterMappings(
    sourceData: any,
    mappings: ParameterMapping[],
    context: TransformationContext
  ): Promise<TransformationResult<any>> {
    // Create reverse mappings
    const reverseMappings: ParameterMapping[] = mappings.map(mapping => ({
      sourcePath: mapping.targetPath,
      targetPath: mapping.sourcePath,
      transform: mapping.transform, // Could implement reverse transforms
      required: mapping.required,
      validation: mapping.validation
    }));

    return this.applyParameterMappings(sourceData, reverseMappings, context);
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  private validateValue(value: any, rule: ValidationRule): { valid: boolean; message?: string } {
    switch (rule.type) {
      case 'string':
        if (typeof value !== 'string') {
          return { valid: false, message: 'Expected string value' };
        }
        if (rule.constraints?.pattern && !rule.constraints.pattern.test(value)) {
          return { valid: false, message: 'Value does not match required pattern' };
        }
        break;
        
      case 'number':
        if (typeof value !== 'number') {
          return { valid: false, message: 'Expected number value' };
        }
        if (rule.constraints?.min !== undefined && value < rule.constraints.min) {
          return { valid: false, message: `Value must be at least ${rule.constraints.min}` };
        }
        if (rule.constraints?.max !== undefined && value > rule.constraints.max) {
          return { valid: false, message: `Value must be at most ${rule.constraints.max}` };
        }
        break;
        
      case 'array':
        if (!Array.isArray(value)) {
          return { valid: false, message: 'Expected array value' };
        }
        break;
        
      case 'enum':
        if (rule.constraints?.allowedValues && !rule.constraints.allowedValues.includes(value)) {
          return { valid: false, message: `Value must be one of: ${rule.constraints.allowedValues.join(', ')}` };
        }
        break;
    }

    return { valid: true };
  }

  private validateTransformationRule(rule: TransformationRule): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!rule.id) errors.push('Rule ID is required');
    if (!rule.sourceType || !['mcp', 'a2a'].includes(rule.sourceType)) {
      errors.push('Valid source type is required');
    }
    if (!rule.targetType || !['mcp', 'a2a'].includes(rule.targetType)) {
      errors.push('Valid target type is required');
    }
    if (!rule.sourceSchema) errors.push('Source schema is required');
    if (!rule.targetSchema) errors.push('Target schema is required');
    if (!Array.isArray(rule.mappings)) errors.push('Mappings array is required');

    return { valid: errors.length === 0, errors };
  }

  private generateToolId(toolName: string): string {
    return `tool_${toolName.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
  }

  private deriveCapabilityName(toolName: string): string {
    // Convert MCP tool name to A2A capability name
    return toolName.replace('mcp__', '').replace(/[_-]/g, '.');
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private derivePriority(parameters: any): 'low' | 'medium' | 'high' | 'critical' {
    // Simple priority derivation - could be enhanced based on parameters
    return parameters.priority || 'medium';
  }

  private createErrorResult(
    code: string,
    message: string,
    startTime: number
  ): TransformationResult<any> {
    return {
      success: false,
      errors: [{
        code,
        message,
        severity: 'error'
      }],
      warnings: [],
      metadata: {
        appliedRules: [],
        transformationsApplied: 0,
        executionTime: Date.now() - startTime
      }
    };
  }
}