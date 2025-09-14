/**
 * Code Generation Engine - AI-Powered Code Generation
 *
 * Implements intelligent code generation using learned patterns,
 * templates, and AI orchestration
 */
import { ModelOrchestrator } from "./model-orchestrator.js";
export interface GenerationRequest {
    task: string;
    language: string;
    framework?: string;
    style?: string;
    patterns?: string[];
    context?: Record<string, any>;
    options?: GenerationOptions;
}
export interface GenerationOptions {
    includeTests?: boolean;
    includeDocumentation?: boolean;
    includeTypes?: boolean;
    useStrictMode?: boolean;
    optimizeForPerformance?: boolean;
    targetES?: string;
    outputFormat?: "files" | "single" | "streaming";
}
export interface GeneratedCode {
    files: GeneratedFile[];
    metadata: GenerationMetadata;
    suggestions: string[];
    dependencies: string[];
}
export interface GeneratedFile {
    path: string;
    content: string;
    type: "source" | "test" | "config" | "documentation";
    language: string;
    size: number;
    complexity: number;
}
export interface GenerationMetadata {
    totalFiles: number;
    totalLines: number;
    totalSize: number;
    averageComplexity: number;
    patternsUsed: string[];
    generationTime: number;
    aiModel: string;
    confidence: number;
}
export interface Template {
    name: string;
    description: string;
    framework?: string;
    language: string;
    variables: TemplateVariable[];
    files: TemplateFile[];
    dependencies?: string[];
    scripts?: Record<string, string>;
}
export interface TemplateVariable {
    name: string;
    type: "string" | "boolean" | "array" | "object" | "number";
    description: string;
    default?: any;
    required?: boolean;
    validation?: string;
}
export interface TemplateFile {
    path: string;
    content: string;
    type: "source" | "test" | "config" | "documentation";
    conditions?: Record<string, any>;
}
export interface StyleProfile {
    name: string;
    indentation: {
        type: "spaces" | "tabs";
        size: number;
    };
    lineLength: number;
    quotes: "single" | "double";
    semicolons: boolean;
    trailingCommas: boolean;
    naming: {
        variables: string;
        functions: string;
        classes: string;
        constants: string;
    };
    imports: {
        order: string[];
        grouping: boolean;
        newlines: boolean;
    };
}
export interface CodePattern {
    type: string;
    pattern: string;
    template: string;
    confidence: number;
    examples: string[];
    variables: string[];
}
export declare class CodeGenerationEngine {
    private logger;
    private orchestrator;
    private templates;
    private patterns;
    private styleProfiles;
    constructor(orchestrator: ModelOrchestrator);
    /**
     * Generate code from a natural language description
     */
    generateCode(request: GenerationRequest): Promise<GeneratedCode>;
    /**
     * Generate code from a specific template
     */
    generateFromTemplate(request: GenerationRequest, templateName?: string): Promise<GeneratedCode>;
    /**
     * Generate code using learned patterns
     */
    generateFromPatterns(request: GenerationRequest, patternTypes?: string[]): Promise<GeneratedCode>;
    /**
     * Generate code using AI orchestration
     */
    generateWithAI(request: GenerationRequest): Promise<GeneratedCode>;
    /**
     * Generate using hybrid approach (templates + patterns + AI)
     */
    generateHybrid(request: GenerationRequest, approach: any): Promise<GeneratedCode>;
    /**
     * Apply style profile to generated code
     */
    applyStyleProfile(generated: GeneratedCode, styleName: string): Promise<void>;
    /**
     * Determine the best generation approach
     */
    private determineGenerationApproach;
    /**
     * Extract variables for template processing
     */
    private extractTemplateVariables;
    /**
     * Process template with variables
     */
    private processTemplate;
    /**
     * Process conditional blocks in templates
     */
    private processConditionals;
    /**
     * Process loop blocks in templates
     */
    private processLoops;
    /**
     * Calculate code complexity score
     */
    private calculateComplexity;
    /**
     * Build generation metadata
     */
    private buildMetadata;
    /**
     * Initialize built-in templates
     */
    private initializeBuiltinTemplates;
    /**
     * Initialize built-in patterns
     */
    private initializeBuiltinPatterns;
    /**
     * Initialize built-in style profiles
     */
    private initializeBuiltinStyles;
    private selectBestTemplate;
    private evaluateConditions;
    private generateSuggestions;
    private selectBestPatterns;
    private applyPattern;
    private buildAIContext;
    private buildGenerationPrompt;
    private parseAIResponse;
    private identifyGenerationGaps;
    private postProcessGeneration;
    private hasFrameworkTemplate;
    private findFrameworkTemplate;
    private findBestTemplate;
    private extractVariablesWithAI;
    private reformatCode;
}
export default CodeGenerationEngine;
//# sourceMappingURL=code-generation-engine.d.ts.map