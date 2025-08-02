/**
 * Type definitions for Learning and Generation systems
 */

export interface CodePattern {
  id: string;
  type: string;
  pattern: string;
  template?: string;
  confidence: number;
  examples: string[];
  metadata: Record<string, any>;
  language: string;
  framework?: string;
  created: Date;
  lastUsed?: Date;
  useCount: number;
}

export interface StyleProfile {
  id: string;
  name: string;
  description?: string;
  language: string;
  framework?: string;
  indentation: {
    type: 'spaces' | 'tabs';
    size: number;
  };
  lineLength: number;
  quotes: 'single' | 'double' | 'mixed';
  semicolons: boolean;
  trailingCommas: boolean;
  naming: {
    variables: 'camelCase' | 'snake_case' | 'PascalCase';
    functions: 'camelCase' | 'snake_case' | 'PascalCase';
    classes: 'PascalCase' | 'snake_case';
    constants: 'UPPER_CASE' | 'camelCase';
  };
  imports: {
    order: string[];
    grouping: boolean;
    newlines: boolean;
  };
  patterns: CodePattern[];
  created: Date;
  lastModified: Date;
}

export interface LearningSession {
  id: string;
  name: string;
  sourcePath: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed';
  patterns: CodePattern[];
  styleProfile?: StyleProfile;
  statistics: {
    filesAnalyzed: number;
    patternsFound: number;
    confidence: number;
    processingTime: number;
  };
}

export interface GenerationRequest {
  id: string;
  description: string;
  language: string;
  framework?: string;
  styleProfile?: string;
  patterns?: string[];
  context?: Record<string, any>;
  options: GenerationOptions;
  created: Date;
}

export interface GenerationOptions {
  includeTests?: boolean;
  includeDocumentation?: boolean;
  includeTypes?: boolean;
  useStrictMode?: boolean;
  optimizeForPerformance?: boolean;
  targetES?: string;
  outputFormat?: 'files' | 'single' | 'streaming';
  dryRun?: boolean;
  interactive?: boolean;
}

export interface GeneratedFile {
  path: string;
  content: string;
  type: 'source' | 'test' | 'config' | 'documentation';
  language: string;
  size: number;
  complexity: number;
  patterns: string[];
}

export interface GenerationResult {
  id: string;
  request: GenerationRequest;
  files: GeneratedFile[];
  metadata: GenerationMetadata;
  suggestions: string[];
  dependencies: string[];
  created: Date;
  status: 'success' | 'partial' | 'failed';
  error?: string;
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
  approach: 'template' | 'pattern' | 'ai' | 'hybrid';
}

export interface Template {
  id: string;
  name: string;
  description: string;
  framework?: string;
  language: string;
  category: string;
  tags: string[];
  variables: TemplateVariable[];
  files: TemplateFile[];
  dependencies?: string[];
  scripts?: Record<string, string>;
  created: Date;
  lastModified: Date;
  author?: string;
  version: string;
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'boolean' | 'array' | 'object' | 'number';
  description: string;
  default?: any;
  required?: boolean;
  validation?: string;
  options?: any[];
}

export interface TemplateFile {
  path: string;
  content: string;
  type: 'source' | 'test' | 'config' | 'documentation';
  conditions?: Record<string, any>;
}

export interface FrameworkSignature {
  framework: string;
  version?: string;
  confidence: number;
  patterns: string[];
  dependencies: string[];
  structure: string[];
  detectedFiles: string[];
}

export interface ArchitecturalPattern {
  name: string;
  description: string;
  type: 'mvc' | 'mvvm' | 'layered' | 'microservices' | 'event-driven' | 'clean' | 'hexagonal';
  indicators: string[];
  confidence: number;
  files: string[];
  structure: Record<string, any>;
  recommendations?: string[];
}

export interface PatternMatch {
  type: string;
  confidence: number;
  location: {
    file: string;
    line: number;
    column: number;
  };
  context: string;
  metadata: Record<string, any>;
}

export interface LearningAnalytics {
  totalPatterns: number;
  patternsByType: Record<string, number>;
  patternsByFramework: Record<string, number>;
  averageConfidence: number;
  topPatterns: CodePattern[];
  stylesLearned: number;
  generationsPerformed: number;
  successRate: number;
  mostUsedPatterns: CodePattern[];
}

export interface LearningConfiguration {
  patterns: {
    minConfidence: number;
    maxPatterns: number;
    includeTypes: string[];
    excludeTypes: string[];
  };
  style: {
    analyzeSamples: number;
    includeComments: boolean;
    detectFramework: boolean;
  };
  generation: {
    defaultTemplate: string;
    includeTests: boolean;
    includeDocs: boolean;
    optimizeCode: boolean;
  };
}

export interface BatchGenerationConfig {
  name: string;
  description?: string;
  items: BatchGenerationItem[];
  globalOptions?: GenerationOptions;
  parallel?: boolean;
  outputBase?: string;
}

export interface BatchGenerationItem {
  name: string;
  description: string;
  template?: string;
  pattern?: string;
  variables?: Record<string, any>;
  outputPath?: string;
  options?: GenerationOptions;
}

export interface LearningMemory {
  patterns: Map<string, CodePattern>;
  styles: Map<string, StyleProfile>;
  templates: Map<string, Template>;
  sessions: Map<string, LearningSession>;
  generations: Map<string, GenerationResult>;
  analytics: LearningAnalytics;
  configuration: LearningConfiguration;
}

export type LearningEventType = 
  | 'pattern_learned'
  | 'style_extracted'
  | 'code_generated'
  | 'template_created'
  | 'session_started'
  | 'session_completed'
  | 'error_occurred';

export interface LearningEvent {
  type: LearningEventType;
  timestamp: Date;
  data: any;
  sessionId?: string;
}

// Utility types
export type PatternType = 
  | 'function'
  | 'class'
  | 'interface'
  | 'component'
  | 'hook'
  | 'module'
  | 'import'
  | 'export'
  | 'async-pattern'
  | 'error-handling'
  | 'testing-pattern'
  | 'architecture'
  | 'crud'
  | 'repository'
  | 'service'
  | 'controller'
  | 'middleware'
  | 'route';

export type GenerationApproach = 
  | 'template'
  | 'pattern'
  | 'ai'
  | 'hybrid';

export type FileType = 
  | 'source'
  | 'test'
  | 'config'
  | 'documentation';

export type FrameworkType = 
  | 'react'
  | 'vue'
  | 'angular'
  | 'svelte'
  | 'node'
  | 'express'
  | 'fastify'
  | 'nestjs'
  | 'next'
  | 'nuxt'
  | 'typescript'
  | 'javascript';

export type LanguageType = 
  | 'typescript'
  | 'javascript'
  | 'python'
  | 'go'
  | 'rust'
  | 'java'
  | 'c#'
  | 'php'
  | 'ruby';

export type NamingConvention = 
  | 'camelCase'
  | 'snake_case'
  | 'PascalCase'
  | 'kebab-case'
  | 'UPPER_CASE';

export type IndentationType = 
  | 'spaces'
  | 'tabs';

export type QuoteStyle = 
  | 'single'
  | 'double'
  | 'mixed';