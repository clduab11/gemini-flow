/**
 * Tool Transformation Engine
 *
 * Handles bidirectional transformation between MCP tools and A2A capabilities.
 * Provides intelligent parameter mapping, result transformation, and format conversion.
 * Manages schema validation, type coercion, and compatibility layers.
 */
import { Logger } from "../../../utils/logger.js";
import { CacheManager } from "../../../core/cache-manager.js";
/**
 * Main transformation engine for MCP ↔ A2A conversions
 */
export class ToolTransformationEngine {
    logger;
    cache;
    transformationRules = new Map();
    transformFunctions = new Map();
    schemaCache = new Map();
    constructor() {
        this.logger = new Logger("ToolTransformationEngine");
        this.cache = new CacheManager();
        this.initializeBuiltInTransforms();
        this.logger.info("Tool Transformation Engine initialized");
    }
    /**
     * Transform MCP tool invocation to A2A format
     */
    async transformMCPToA2A(toolName, parameters, context, options = {}) {
        const startTime = Date.now();
        const transformationContext = {
            sourceFormat: "mcp",
            targetFormat: "a2a",
            toolName,
            agentContext: context,
            metadata: {},
            preserveTypes: true,
            strictValidation: options.strict || false,
        };
        try {
            // Find appropriate transformation rule
            const rule = await this.findTransformationRule(toolName, "mcp", "a2a");
            if (!rule) {
                return this.createErrorResult("NO_TRANSFORMATION_RULE", `No transformation rule found for MCP tool: ${toolName}`, startTime);
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
                        executionTime: Date.now() - startTime,
                    },
                };
            }
            // Apply parameter mappings
            const transformedParams = await this.applyParameterMappings(parameters, rule.mappings, transformationContext);
            // Create A2A invocation
            const a2aInvocation = {
                toolId: this.generateToolId(toolName),
                capabilityName: options.targetCapability || this.deriveCapabilityName(toolName),
                parameters: transformedParams.data || {},
                context,
                requestId: this.generateRequestId(),
                timestamp: Date.now(),
                priority: this.derivePriority(parameters),
            };
            // Validate target format
            const targetValidation = await this.validateParameters(a2aInvocation.parameters, rule.targetSchema, transformationContext);
            const result = {
                success: targetValidation.success,
                data: targetValidation.success ? a2aInvocation : undefined,
                errors: [
                    ...sourceValidation.errors,
                    ...targetValidation.errors,
                    ...transformedParams.errors,
                ],
                warnings: [
                    ...sourceValidation.warnings,
                    ...targetValidation.warnings,
                    ...transformedParams.warnings,
                ],
                metadata: {
                    appliedRules: [rule.id],
                    transformationsApplied: rule.mappings.length,
                    executionTime: Date.now() - startTime,
                },
            };
            this.logger.debug("MCP to A2A transformation completed", {
                toolName,
                success: result.success,
                executionTime: result.metadata.executionTime,
            });
            return result;
        }
        catch (error) {
            this.logger.error("MCP to A2A transformation failed", {
                toolName,
                error: error.message,
            });
            return this.createErrorResult("TRANSFORMATION_ERROR", error.message, startTime);
        }
    }
    /**
     * Transform A2A response to MCP result format
     */
    async transformA2AToMCP(a2aResponse, originalToolName, options = {}) {
        const startTime = Date.now();
        const transformationContext = {
            sourceFormat: "a2a",
            targetFormat: "mcp",
            toolName: originalToolName,
            metadata: {},
            preserveTypes: true,
            strictValidation: options.strict || false,
        };
        try {
            // Find appropriate transformation rule
            const rule = await this.findTransformationRule(originalToolName, "a2a", "mcp");
            if (!rule) {
                return this.createErrorResult("NO_TRANSFORMATION_RULE", `No reverse transformation rule found for tool: ${originalToolName}`, startTime);
            }
            // Transform A2A response to MCP result format
            const mcpResult = {
                success: a2aResponse.success,
                timestamp: a2aResponse.timestamp,
            };
            if (a2aResponse.success && a2aResponse.data) {
                // Apply reverse parameter mappings for data
                const transformedData = await this.applyReverseParameterMappings(a2aResponse.data, rule.mappings, transformationContext);
                mcpResult.data = transformedData.data;
            }
            else if (a2aResponse.error) {
                mcpResult.error = a2aResponse.error.message;
                mcpResult.message = a2aResponse.error.message;
            }
            // Add metadata if preservation is enabled
            if (options.preserveMetadata && a2aResponse.metadata) {
                mcpResult.message =
                    mcpResult.message ||
                        `Execution time: ${a2aResponse.metadata.executionTime}ms`;
            }
            const result = {
                success: true,
                data: mcpResult,
                errors: [],
                warnings: [],
                metadata: {
                    appliedRules: [rule.id],
                    transformationsApplied: rule.mappings.length,
                    executionTime: Date.now() - startTime,
                },
            };
            this.logger.debug("A2A to MCP transformation completed", {
                toolName: originalToolName,
                success: result.success,
                executionTime: result.metadata.executionTime,
            });
            return result;
        }
        catch (error) {
            this.logger.error("A2A to MCP transformation failed", {
                toolName: originalToolName,
                error: error.message,
            });
            return this.createErrorResult("TRANSFORMATION_ERROR", error.message, startTime);
        }
    }
    /**
     * Register a new transformation rule
     */
    async registerTransformationRule(rule) {
        // Validate rule
        const validation = this.validateTransformationRule(rule);
        if (!validation.valid) {
            throw new Error(`Invalid transformation rule: ${validation.errors.join(", ")}`);
        }
        this.transformationRules.set(rule.id, rule);
        // Cache schemas for quick lookup
        await this.cache.set(`schema:${rule.id}:source`, rule.sourceSchema, 3600000);
        await this.cache.set(`schema:${rule.id}:target`, rule.targetSchema, 3600000);
        this.logger.info("Transformation rule registered", {
            id: rule.id,
            sourceType: rule.sourceType,
            targetType: rule.targetType,
        });
    }
    /**
     * Register a custom transform function
     */
    registerTransformFunction(func) {
        this.transformFunctions.set(func.name, func);
        this.logger.debug("Transform function registered", { name: func.name });
    }
    /**
     * Get available transformation rules
     */
    getTransformationRules(sourceType, targetType) {
        const rules = Array.from(this.transformationRules.values());
        return rules.filter((rule) => {
            if (sourceType && rule.sourceType !== sourceType)
                return false;
            if (targetType && rule.targetType !== targetType)
                return false;
            return true;
        });
    }
    /**
     * Private helper methods
     */
    async initializeBuiltInTransforms() {
        // Register common transform functions
        this.registerTransformFunction({
            name: "toUpperCase",
            implementation: (value) => typeof value === "string" ? value.toUpperCase() : value,
            description: "Convert string to uppercase",
            returnType: "string",
        });
        this.registerTransformFunction({
            name: "toLowerCase",
            implementation: (value) => typeof value === "string" ? value.toLowerCase() : value,
            description: "Convert string to lowercase",
            returnType: "string",
        });
        this.registerTransformFunction({
            name: "parseJSON",
            implementation: (value) => {
                try {
                    return typeof value === "string" ? JSON.parse(value) : value;
                }
                catch {
                    return value;
                }
            },
            description: "Parse JSON string to object",
            returnType: "object",
        });
        this.registerTransformFunction({
            name: "stringify",
            implementation: (value) => typeof value === "object" ? JSON.stringify(value) : String(value),
            description: "Convert value to string",
            returnType: "string",
        });
        this.registerTransformFunction({
            name: "arrayToString",
            implementation: (value, separator = ",") => Array.isArray(value) ? value.join(separator) : value,
            description: "Convert array to comma-separated string",
            returnType: "string",
        });
        this.registerTransformFunction({
            name: "stringToArray",
            implementation: (value, separator = ",") => typeof value === "string"
                ? value.split(separator).map((s) => s.trim())
                : value,
            description: "Convert comma-separated string to array",
            returnType: "array",
        });
        this.logger.debug("Built-in transform functions initialized");
    }
    async findTransformationRule(toolName, sourceType, targetType) {
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
    matchesPattern(toolName, pattern) {
        if (!pattern)
            return false;
        // Simple pattern matching - could be enhanced with regex
        if (pattern.includes("*")) {
            const regexPattern = pattern.replace(/\*/g, ".*");
            return new RegExp(`^${regexPattern}$`).test(toolName);
        }
        return toolName === pattern;
    }
    async validateParameters(parameters, schema, context) {
        const errors = [];
        const warnings = [];
        if (!schema) {
            return { success: true, errors, warnings };
        }
        // Basic validation - could be enhanced with JSON Schema validation
        if (schema.required && Array.isArray(schema.required)) {
            for (const requiredField of schema.required) {
                if (!Object.hasOwn(parameters, requiredField)) {
                    errors.push({
                        code: "MISSING_REQUIRED_FIELD",
                        message: `Required field missing: ${requiredField}`,
                        path: requiredField,
                        severity: "error",
                    });
                }
            }
        }
        return {
            success: errors.length === 0,
            errors,
            warnings,
        };
    }
    async applyParameterMappings(sourceData, mappings, context) {
        const result = {};
        const errors = [];
        const warnings = [];
        for (const mapping of mappings) {
            try {
                const sourceValue = this.getNestedValue(sourceData, mapping.sourcePath);
                if (sourceValue === undefined) {
                    if (mapping.required) {
                        errors.push({
                            code: "MISSING_REQUIRED_MAPPING",
                            message: `Required source value missing at path: ${mapping.sourcePath}`,
                            path: mapping.sourcePath,
                            severity: "error",
                        });
                        continue;
                    }
                    else if (mapping.defaultValue !== undefined) {
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
                    }
                    else {
                        warnings.push(`Transform function not found: ${mapping.transform.name}`);
                    }
                }
                // Apply validation if specified
                if (mapping.validation) {
                    const validationResult = this.validateValue(transformedValue, mapping.validation);
                    if (!validationResult.valid) {
                        errors.push({
                            code: "VALIDATION_FAILED",
                            message: validationResult.message || "Validation failed",
                            path: mapping.targetPath,
                            value: transformedValue,
                            severity: "error",
                        });
                        continue;
                    }
                }
                this.setNestedValue(result, mapping.targetPath, transformedValue);
            }
            catch (error) {
                errors.push({
                    code: "MAPPING_ERROR",
                    message: `Error applying mapping ${mapping.sourcePath} -> ${mapping.targetPath}: ${error.message}`,
                    path: mapping.sourcePath,
                    severity: "error",
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
                executionTime: 0,
            },
        };
    }
    async applyReverseParameterMappings(sourceData, mappings, context) {
        // Create reverse mappings
        const reverseMappings = mappings.map((mapping) => ({
            sourcePath: mapping.targetPath,
            targetPath: mapping.sourcePath,
            transform: mapping.transform, // Could implement reverse transforms
            required: mapping.required,
            validation: mapping.validation,
        }));
        return this.applyParameterMappings(sourceData, reverseMappings, context);
    }
    getNestedValue(obj, path) {
        return path.split(".").reduce((current, key) => current?.[key], obj);
    }
    setNestedValue(obj, path, value) {
        const keys = path.split(".");
        const lastKey = keys.pop();
        const target = keys.reduce((current, key) => {
            if (!current[key])
                current[key] = {};
            return current[key];
        }, obj);
        target[lastKey] = value;
    }
    validateValue(value, rule) {
        switch (rule.type) {
            case "string":
                if (typeof value !== "string") {
                    return { valid: false, message: "Expected string value" };
                }
                if (rule.constraints?.pattern &&
                    !rule.constraints.pattern.test(value)) {
                    return {
                        valid: false,
                        message: "Value does not match required pattern",
                    };
                }
                break;
            case "number":
                if (typeof value !== "number") {
                    return { valid: false, message: "Expected number value" };
                }
                if (rule.constraints?.min !== undefined &&
                    value < rule.constraints.min) {
                    return {
                        valid: false,
                        message: `Value must be at least ${rule.constraints.min}`,
                    };
                }
                if (rule.constraints?.max !== undefined &&
                    value > rule.constraints.max) {
                    return {
                        valid: false,
                        message: `Value must be at most ${rule.constraints.max}`,
                    };
                }
                break;
            case "array":
                if (!Array.isArray(value)) {
                    return { valid: false, message: "Expected array value" };
                }
                break;
            case "enum":
                if (rule.constraints?.allowedValues &&
                    !rule.constraints.allowedValues.includes(value)) {
                    return {
                        valid: false,
                        message: `Value must be one of: ${rule.constraints.allowedValues.join(", ")}`,
                    };
                }
                break;
        }
        return { valid: true };
    }
    validateTransformationRule(rule) {
        const errors = [];
        if (!rule.id)
            errors.push("Rule ID is required");
        if (!rule.sourceType || !["mcp", "a2a"].includes(rule.sourceType)) {
            errors.push("Valid source type is required");
        }
        if (!rule.targetType || !["mcp", "a2a"].includes(rule.targetType)) {
            errors.push("Valid target type is required");
        }
        if (!rule.sourceSchema)
            errors.push("Source schema is required");
        if (!rule.targetSchema)
            errors.push("Target schema is required");
        if (!Array.isArray(rule.mappings))
            errors.push("Mappings array is required");
        return { valid: errors.length === 0, errors };
    }
    generateToolId(toolName) {
        return `tool_${toolName.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}`;
    }
    deriveCapabilityName(toolName) {
        // Convert MCP tool name to A2A capability name
        return toolName.replace("mcp__", "").replace(/[_-]/g, ".");
    }
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    derivePriority(parameters) {
        // Simple priority derivation - could be enhanced based on parameters
        return parameters.priority || "medium";
    }
    createErrorResult(code, message, startTime) {
        return {
            success: false,
            errors: [
                {
                    code,
                    message,
                    severity: "error",
                },
            ],
            warnings: [],
            metadata: {
                appliedRules: [],
                transformationsApplied: 0,
                executionTime: Date.now() - startTime,
            },
        };
    }
}
