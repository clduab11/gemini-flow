/**
 * Code Generation Engine - AI-Powered Code Generation
 *
 * Implements intelligent code generation using learned patterns,
 * templates, and AI orchestration
 */

import { Logger } from "../utils/logger.js";
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
  indentation: { type: "spaces" | "tabs"; size: number };
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

export class CodeGenerationEngine {
  private logger: Logger;
  private orchestrator: ModelOrchestrator;
  private templates: Map<string, Template> = new Map();
  private patterns: Map<string, CodePattern[]> = new Map();
  private styleProfiles: Map<string, StyleProfile> = new Map();

  constructor(orchestrator: ModelOrchestrator) {
    this.logger = new Logger("CodeGeneration");
    this.orchestrator = orchestrator;
    this.initializeBuiltinTemplates();
    this.initializeBuiltinPatterns();
    this.initializeBuiltinStyles();
  }

  /**
   * Generate code from a natural language description
   */
  async generateCode(request: GenerationRequest): Promise<GeneratedCode> {
    const startTime = Date.now();
    this.logger.info("Starting code generation", {
      task: request.task,
      language: request.language,
    });

    try {
      // Analyze the request and determine approach
      const approach = await this.determineGenerationApproach(request);

      // Generate code based on approach
      let generated: GeneratedCode;

      switch (approach.type) {
        case "template":
          generated = await this.generateFromTemplate(
            request,
            approach.template!,
          );
          break;
        case "pattern":
          generated = await this.generateFromPatterns(
            request,
            approach.patterns!,
          );
          break;
        case "ai":
          generated = await this.generateWithAI(request);
          break;
        case "hybrid":
          generated = await this.generateHybrid(request, approach);
          break;
        default:
          generated = await this.generateWithAI(request);
      }

      // Apply style profile if specified
      if (request.style) {
        await this.applyStyleProfile(generated, request.style);
      }

      // Post-process the generated code
      await this.postProcessGeneration(generated, request);

      // Update metadata
      generated.metadata.generationTime = Date.now() - startTime;

      this.logger.info("Code generation completed", {
        files: generated.files.length,
        lines: generated.metadata.totalLines,
        time: generated.metadata.generationTime,
      });

      return generated;
    } catch (error) {
      this.logger.error("Code generation failed", error);
      throw new Error(`Code generation failed: ${error.message}`);
    }
  }

  /**
   * Generate code from a specific template
   */
  async generateFromTemplate(
    request: GenerationRequest,
    templateName?: string,
  ): Promise<GeneratedCode> {
    const template = templateName
      ? this.templates.get(templateName)
      : await this.selectBestTemplate(request);

    if (!template) {
      throw new Error(`Template not found: ${templateName || "auto-selected"}`);
    }

    this.logger.info(`Generating from template: ${template.name}`);

    // Extract variables from request
    const variables = await this.extractTemplateVariables(request, template);

    // Process template files
    const files: GeneratedFile[] = [];

    for (const templateFile of template.files) {
      // Check conditions
      if (!this.evaluateConditions(templateFile.conditions, variables)) {
        continue;
      }

      const processedContent = this.processTemplate(
        templateFile.content,
        variables,
      );
      const processedPath = this.processTemplate(templateFile.path, variables);

      files.push({
        path: processedPath,
        content: processedContent,
        type: templateFile.type,
        language: template.language,
        size: processedContent.length,
        complexity: this.calculateComplexity(processedContent),
      });
    }

    return {
      files,
      metadata: this.buildMetadata(files, [template.name], "template"),
      suggestions: await this.generateSuggestions(files, request),
      dependencies: template.dependencies || [],
    };
  }

  /**
   * Generate code using learned patterns
   */
  async generateFromPatterns(
    request: GenerationRequest,
    patternTypes?: string[],
  ): Promise<GeneratedCode> {
    const patterns = patternTypes
      ? patternTypes.flatMap((type) => this.patterns.get(type) || [])
      : await this.selectBestPatterns(request);

    this.logger.info(`Generating from ${patterns.length} patterns`);

    const files: GeneratedFile[] = [];
    const usedPatterns: string[] = [];

    for (const pattern of patterns) {
      try {
        const generated = await this.applyPattern(pattern, request);
        if (generated) {
          files.push(generated);
          usedPatterns.push(pattern.type);
        }
      } catch (error) {
        this.logger.warn(`Failed to apply pattern ${pattern.type}`, error);
      }
    }

    return {
      files,
      metadata: this.buildMetadata(files, usedPatterns, "pattern"),
      suggestions: await this.generateSuggestions(files, request),
      dependencies: [],
    };
  }

  /**
   * Generate code using AI orchestration
   */
  async generateWithAI(request: GenerationRequest): Promise<GeneratedCode> {
    this.logger.info("Generating with AI orchestration");

    // Build context for AI generation
    const context = await this.buildAIContext(request);

    // Generate using AI orchestrator
    const prompt = this.buildGenerationPrompt(request, context);

    const response = await this.orchestrator.orchestrate(prompt, {
      task: "code_generation",
      userTier: "pro", // Use higher tier for code generation
      priority: "high",
      latencyRequirement: 5000,
      capabilities: [
        "code_generation",
        "syntax_highlighting",
        "best_practices",
      ],
    });

    // Parse AI response into structured format
    const parsed = await this.parseAIResponse(response.content, request);

    return {
      files: parsed.files,
      metadata: {
        ...this.buildMetadata(
          parsed.files,
          ["ai_generated"],
          response.modelUsed,
        ),
        confidence: (response as any).confidence || 0.8,
      },
      suggestions: parsed.suggestions || [],
      dependencies: parsed.dependencies || [],
    };
  }

  /**
   * Generate using hybrid approach (templates + patterns + AI)
   */
  async generateHybrid(
    request: GenerationRequest,
    approach: any,
  ): Promise<GeneratedCode> {
    this.logger.info("Generating with hybrid approach");

    // Start with template if available
    const result = approach.template
      ? await this.generateFromTemplate(request, approach.template)
      : {
          files: [],
          metadata: this.buildMetadata([], [], "hybrid"),
          suggestions: [],
          dependencies: [],
        };

    // Apply patterns
    if (approach.patterns && approach.patterns.length > 0) {
      const patternResult = await this.generateFromPatterns(
        request,
        approach.patterns,
      );
      result.files.push(...patternResult.files);
      result.metadata.patternsUsed.push(...patternResult.metadata.patternsUsed);
    }

    // Fill gaps with AI
    const gaps = await this.identifyGenerationGaps(result, request);
    if (gaps.length > 0) {
      const aiRequest = {
        ...request,
        task: `Fill generation gaps: ${gaps.join(", ")}`,
      };
      const aiResult = await this.generateWithAI(aiRequest);
      result.files.push(...aiResult.files);
    }

    // Update metadata
    result.metadata = this.buildMetadata(
      result.files,
      result.metadata.patternsUsed,
      "hybrid",
    );

    return result;
  }

  /**
   * Apply style profile to generated code
   */
  async applyStyleProfile(
    generated: GeneratedCode,
    styleName: string,
  ): Promise<void> {
    const style = this.styleProfiles.get(styleName);
    if (!style) {
      this.logger.warn(`Style profile not found: ${styleName}`);
      return;
    }

    this.logger.info(`Applying style profile: ${styleName}`);

    for (const file of generated.files) {
      if (file.type === "source") {
        file.content = await this.reformatCode(
          file.content,
          style,
          file.language,
        );
      }
    }
  }

  /**
   * Determine the best generation approach
   */
  private async determineGenerationApproach(
    request: GenerationRequest,
  ): Promise<any> {
    // Simple heuristics - in production would use ML classification
    const hasFramework = !!request.framework;
    const hasPatterns = request.patterns && request.patterns.length > 0;
    const isComplexTask =
      request.task.length > 100 || request.task.includes("complex");

    if (hasFramework && this.hasFrameworkTemplate(request.framework!)) {
      return {
        type: "template",
        template: this.findFrameworkTemplate(request.framework!),
      };
    }

    if (hasPatterns) {
      return {
        type: "pattern",
        patterns: request.patterns,
      };
    }

    if (isComplexTask) {
      return {
        type: "hybrid",
        template: this.findBestTemplate(request),
        patterns: await this.selectBestPatterns(request),
      };
    }

    return { type: "ai" };
  }

  /**
   * Extract variables for template processing
   */
  private async extractTemplateVariables(
    request: GenerationRequest,
    template: Template,
  ): Promise<Record<string, any>> {
    const variables: Record<string, any> = {};

    // Set defaults
    for (const variable of template.variables) {
      if (variable.default !== undefined) {
        variables[variable.name] = variable.default;
      }
    }

    // Extract from context
    if (request.context) {
      Object.assign(variables, request.context);
    }

    // Use AI to extract missing variables
    const missing = template.variables.filter(
      (v) => v.required && variables[v.name] === undefined,
    );

    if (missing.length > 0) {
      const extracted = await this.extractVariablesWithAI(
        request.task,
        missing,
      );
      Object.assign(variables, extracted);
    }

    return variables;
  }

  /**
   * Process template with variables
   */
  private processTemplate(
    template: string,
    variables: Record<string, any>,
  ): string {
    let processed = template;

    // Simple variable substitution
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
      processed = processed.replace(regex, String(value));
    });

    // Handle conditionals
    processed = this.processConditionals(processed, variables);

    // Handle loops
    processed = this.processLoops(processed, variables);

    return processed;
  }

  /**
   * Process conditional blocks in templates
   */
  private processConditionals(
    template: string,
    variables: Record<string, any>,
  ): string {
    const conditionalRegex = /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g;

    return template.replace(conditionalRegex, (match, condition, content) => {
      return variables[condition] ? content : "";
    });
  }

  /**
   * Process loop blocks in templates
   */
  private processLoops(
    template: string,
    variables: Record<string, any>,
  ): string {
    const loopRegex = /{{#each\s+(\w+)}}([\s\S]*?){{\/each}}/g;

    return template.replace(loopRegex, (match, arrayName, content) => {
      const array = variables[arrayName];
      if (!Array.isArray(array)) return "";

      return array
        .map((item, index) => {
          let processed = content;

          // Replace item properties
          if (typeof item === "object") {
            Object.entries(item).forEach(([key, value]) => {
              const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
              processed = processed.replace(regex, String(value));
            });
          }

          // Replace @index
          processed = processed.replace(/{{@index}}/g, String(index));

          return processed;
        })
        .join("");
    });
  }

  /**
   * Calculate code complexity score
   */
  private calculateComplexity(code: string): number {
    // Simple complexity calculation based on cyclomatic complexity indicators
    const indicators = [
      /if\s*\(/g,
      /else\s*{/g,
      /for\s*\(/g,
      /while\s*\(/g,
      /switch\s*\(/g,
      /catch\s*\(/g,
      /&&|\|\|/g,
    ];

    let complexity = 1; // Base complexity

    for (const indicator of indicators) {
      const matches = code.match(indicator);
      if (matches) {
        complexity += matches.length;
      }
    }

    return complexity;
  }

  /**
   * Build generation metadata
   */
  private buildMetadata(
    files: GeneratedFile[],
    patterns: string[],
    aiModel: string,
  ): GenerationMetadata {
    const totalLines = files.reduce(
      (sum, file) => sum + file.content.split("\n").length,
      0,
    );
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const averageComplexity =
      files.length > 0
        ? files.reduce((sum, file) => sum + file.complexity, 0) / files.length
        : 0;

    return {
      totalFiles: files.length,
      totalLines,
      totalSize,
      averageComplexity,
      patternsUsed: patterns,
      generationTime: 0, // Will be set by caller
      aiModel,
      confidence: 0.85, // Default confidence
    };
  }

  /**
   * Initialize built-in templates
   */
  private initializeBuiltinTemplates(): void {
    // React Component Template
    this.templates.set("react-component", {
      name: "React Component",
      description: "Modern React functional component with TypeScript",
      framework: "react",
      language: "typescript",
      variables: [
        {
          name: "componentName",
          type: "string",
          description: "Component name",
          required: true,
        },
        {
          name: "props",
          type: "array",
          description: "Component props",
          default: [],
        },
        {
          name: "useHooks",
          type: "boolean",
          description: "Include React hooks",
          default: true,
        },
      ],
      files: [
        {
          path: "{{componentName}}/{{componentName}}.tsx",
          content: `import React{{#if useHooks}}, { useState, useEffect }{{/if}} from 'react';
import { {{componentName}}Props } from './{{componentName}}.types';
import styles from './{{componentName}}.module.css';

export const {{componentName}}: React.FC<{{componentName}}Props> = ({
  {{#each props}}
  {{name}},
  {{/each}}
}) => {
  {{#if useHooks}}
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Component effect logic
  }, []);
  {{/if}}

  return (
    <div className={styles.{{camelCase componentName}}}>
      <h1>{{componentName}}</h1>
      {/* Component content */}
    </div>
  );
};

export default {{componentName}};`,
          type: "source",
        },
        {
          path: "{{componentName}}/{{componentName}}.types.ts",
          content: `export interface {{componentName}}Props {
  {{#each props}}
  {{name}}: {{type}};
  {{/each}}
}`,
          type: "source",
        },
      ],
    });

    // Express API Template
    this.templates.set("express-api", {
      name: "Express API",
      description: "Express.js REST API with TypeScript",
      framework: "express",
      language: "typescript",
      variables: [
        {
          name: "apiName",
          type: "string",
          description: "API name",
          required: true,
        },
        {
          name: "routes",
          type: "array",
          description: "API routes",
          default: [],
        },
        {
          name: "useAuth",
          type: "boolean",
          description: "Include authentication",
          default: true,
        },
      ],
      files: [
        {
          path: "src/app.ts",
          content: `import express from 'express';
import cors from 'cors';
{{#if useAuth}}
import { authMiddleware } from './middleware/auth';
{{/if}}
{{#each routes}}
import {{name}}Router from './routes/{{name}}';
{{/each}}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
{{#if useAuth}}
app.use(authMiddleware);
{{/if}}

// Routes
{{#each routes}}
app.use('/{{path}}', {{name}}Router);
{{/each}}

export default app;`,
          type: "source",
        },
      ],
    });
  }

  /**
   * Initialize built-in patterns
   */
  private initializeBuiltinPatterns(): void {
    // CRUD Pattern
    this.patterns.set("crud", [
      {
        type: "crud",
        pattern: "Create-Read-Update-Delete operations",
        template: `class {{entityName}}Service {
  async create(data: Create{{entityName}}Dto): Promise<{{entityName}}> {
    // Implementation
  }
  
  async findAll(): Promise<{{entityName}}[]> {
    // Implementation
  }
  
  async findById(id: string): Promise<{{entityName}}> {
    // Implementation
  }
  
  async update(id: string, data: Update{{entityName}}Dto): Promise<{{entityName}}> {
    // Implementation
  }
  
  async delete(id: string): Promise<void> {
    // Implementation
  }
}`,
        confidence: 0.9,
        examples: [],
        variables: ["entityName"],
      },
    ]);

    // Repository Pattern
    this.patterns.set("repository", [
      {
        type: "repository",
        pattern: "Repository pattern for data access",
        template: `interface {{entityName}}Repository {
  save(entity: {{entityName}}): Promise<{{entityName}}>;
  findById(id: string): Promise<{{entityName}} | null>;
  findAll(): Promise<{{entityName}}[]>;
  update(id: string, entity: Partial<{{entityName}}>): Promise<{{entityName}}>;
  delete(id: string): Promise<void>;
}`,
        confidence: 0.85,
        examples: [],
        variables: ["entityName"],
      },
    ]);
  }

  /**
   * Initialize built-in style profiles
   */
  private initializeBuiltinStyles(): void {
    // Airbnb Style
    this.styleProfiles.set("airbnb", {
      name: "Airbnb",
      indentation: { type: "spaces", size: 2 },
      lineLength: 100,
      quotes: "single",
      semicolons: true,
      trailingCommas: true,
      naming: {
        variables: "camelCase",
        functions: "camelCase",
        classes: "PascalCase",
        constants: "UPPER_CASE",
      },
      imports: {
        order: ["external", "internal", "relative"],
        grouping: true,
        newlines: true,
      },
    });

    // Google Style
    this.styleProfiles.set("google", {
      name: "Google",
      indentation: { type: "spaces", size: 2 },
      lineLength: 80,
      quotes: "single",
      semicolons: true,
      trailingCommas: false,
      naming: {
        variables: "camelCase",
        functions: "camelCase",
        classes: "PascalCase",
        constants: "UPPER_CASE",
      },
      imports: {
        order: ["external", "internal"],
        grouping: false,
        newlines: false,
      },
    });
  }

  // Placeholder implementations for helper methods
  private async selectBestTemplate(
    _request: GenerationRequest,
  ): Promise<Template | null> {
    return null;
  }
  private evaluateConditions(
    _conditions: Record<string, any> | undefined,
    _variables: Record<string, any>,
  ): boolean {
    return true;
  }
  private async generateSuggestions(
    _files: GeneratedFile[],
    _request: GenerationRequest,
  ): Promise<string[]> {
    return [];
  }
  private async selectBestPatterns(
    _request: GenerationRequest,
  ): Promise<CodePattern[]> {
    return [];
  }
  private async applyPattern(
    _pattern: CodePattern,
    _request: GenerationRequest,
  ): Promise<GeneratedFile | null> {
    return null;
  }
  private async buildAIContext(_request: GenerationRequest): Promise<any> {
    return {};
  }
  private buildGenerationPrompt(
    _request: GenerationRequest,
    _context: any,
  ): string {
    return "";
  }
  private async parseAIResponse(
    _content: string,
    _request: GenerationRequest,
  ): Promise<any> {
    return { files: [], suggestions: [], dependencies: [] };
  }
  private async identifyGenerationGaps(
    _result: GeneratedCode,
    _request: GenerationRequest,
  ): Promise<string[]> {
    return [];
  }
  private async postProcessGeneration(
    _generated: GeneratedCode,
    _request: GenerationRequest,
  ): Promise<void> {}
  private hasFrameworkTemplate(_framework: string): boolean {
    return (
      this.templates.has(`${_framework}-component`) ||
      this.templates.has(`${_framework}-api`)
    );
  }
  private findFrameworkTemplate(_framework: string): string {
    return `${_framework}-component`;
  }
  private findBestTemplate(_request: GenerationRequest): string | undefined {
    return undefined;
  }
  private async extractVariablesWithAI(
    _task: string,
    _variables: TemplateVariable[],
  ): Promise<Record<string, any>> {
    return {};
  }
  private async reformatCode(
    content: string,
    _style: StyleProfile,
    _language: string,
  ): Promise<string> {
    return content;
  }
}

export default CodeGenerationEngine;
