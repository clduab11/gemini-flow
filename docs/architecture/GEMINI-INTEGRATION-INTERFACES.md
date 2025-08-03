# Gemini Integration Component Interfaces
## TypeScript Interface Definitions for --gemini Flag Architecture

### 🎯 Overview

This document defines all TypeScript interfaces, types, and contracts required for the --gemini flag integration architecture. These interfaces ensure type safety, maintainability, and clear contracts between components.

---

## 🔧 Core Integration Interfaces

### GeminiIntegrationService Interfaces

```typescript
/**
 * Configuration options for Gemini integration
 */
export interface GeminiIntegrationConfig {
  /** Enable automatic CLI detection on initialization */
  enableAutoDetection: boolean;
  
  /** Context cache timeout in milliseconds */
  contextCacheTimeout: number;
  
  /** Behavior when integration fails */
  fallbackBehavior: 'graceful' | 'strict' | 'warn';
  
  /** Enable verbose logging for integration operations */
  verboseLogging: boolean;
  
  /** Enable MCP tools integration */
  mcpToolsEnabled: boolean;
  
  /** Custom project root path for context loading */
  projectRoot?: string;
  
  /** Maximum context size in characters */
  maxContextSize?: number;
  
  /** Custom environment variable prefix */
  envVarPrefix?: string;
}

/**
 * Result of Gemini integration initialization
 */
export interface GeminiIntegrationResult {
  /** Overall integration status */
  status: 'success' | 'partial' | 'failed';
  
  /** CLI detection results */
  detection: GeminiDetectionResult;
  
  /** Context loading results */
  context: GeminiContextResult;
  
  /** Environment configuration results */
  environment: GeminiEnvironmentResult;
  
  /** Available capabilities after integration */
  capabilities: GeminiCapabilities;
  
  /** Integration errors if any */
  errors?: GeminiIntegrationError[];
  
  /** Performance metrics */
  performance: GeminiIntegrationMetrics;
}

/**
 * CLI detection results
 */
export interface GeminiDetectionResult {
  /** Whether Gemini CLI is installed and accessible */
  cliInstalled: boolean;
  
  /** Detected CLI version */
  version?: string;
  
  /** Full path to CLI executable */
  path?: string;
  
  /** Whether MCP tools are available */
  mcpToolsAvailable: boolean;
  
  /** Additional CLI metadata */
  metadata?: {
    installDate?: Date;
    configPath?: string;
    supportedFeatures?: string[];
  };
  
  /** Detection errors if any */
  error?: string;
}

/**
 * Context loading results
 */
export interface GeminiContextResult {
  /** Whether context was loaded successfully */
  loaded: boolean;
  
  /** Source of loaded context */
  source: 'GEMINI.md' | 'fallback' | 'cache' | 'custom';
  
  /** Context content */
  content: string;
  
  /** Context size in characters */
  size: number;
  
  /** When context was loaded */
  timestamp: Date;
  
  /** Context validation results */
  validation?: {
    isValid: boolean;
    warnings?: string[];
    errors?: string[];
  };
  
  /** Context metadata */
  metadata?: {
    checksum?: string;
    encoding?: string;
    language?: string;
  };
}

/**
 * Environment configuration results
 */
export interface GeminiEnvironmentResult {
  /** Whether environment was configured successfully */
  configured: boolean;
  
  /** Configured environment variables */
  variables: Record<string, string>;
  
  /** Successfully registered tools */
  toolsRegistered: string[];
  
  /** Environment validation results */
  validation?: {
    isValid: boolean;
    missingVariables?: string[];
    invalidValues?: Record<string, string>;
  };
}

/**
 * Available capabilities after integration
 */
export interface GeminiCapabilities {
  /** Enhanced AI coordination available */
  enhancedCoordination: boolean;
  
  /** Context awareness enabled */
  contextAwareness: boolean;
  
  /** MCP integration available */
  mcpIntegration: boolean;
  
  /** Advanced prompting capabilities */
  advancedPrompting: boolean;
  
  /** Tool coordination capabilities */
  toolCoordination: boolean;
  
  /** Performance optimization features */
  performanceOptimization: boolean;
  
  /** Available coordination patterns */
  coordinationPatterns: CoordinationPattern[];
  
  /** Supported model features */
  modelFeatures: GeminiModelFeature[];
}

/**
 * Integration error details
 */
export interface GeminiIntegrationError {
  /** Error type */
  type: 'detection' | 'context' | 'environment' | 'tools' | 'validation';
  
  /** Error code for programmatic handling */
  code: string;
  
  /** Human-readable error message */
  message: string;
  
  /** Optional error details */
  details?: any;
  
  /** Whether error is recoverable */
  recoverable: boolean;
  
  /** Suggested recovery actions */
  recovery?: string[];
}

/**
 * Performance metrics for integration
 */
export interface GeminiIntegrationMetrics {
  /** Total initialization time in milliseconds */
  initializationTime: number;
  
  /** CLI detection time */
  detectionTime: number;
  
  /** Context loading time */
  contextLoadTime: number;
  
  /** Environment setup time */
  environmentSetupTime: number;
  
  /** Memory usage in bytes */
  memoryUsage: number;
  
  /** Cache hit rate for context loading */
  cacheHitRate: number;
}
```

---

## 🏗️ Command Architecture Interfaces

### Enhanced Command Interfaces

```typescript
/**
 * Features that a command can support with Gemini integration
 */
export type GeminiFeature = 
  | 'enhanced-coordination'
  | 'context-awareness'
  | 'tool-integration'
  | 'advanced-prompting'
  | 'performance-optimization'
  | 'adaptive-execution'
  | 'error-recovery'
  | 'progress-tracking';

/**
 * Command-level Gemini integration configuration
 */
export interface GeminiCommandIntegration {
  /** Enable enhanced coordination for this command */
  enhancedCoordination: boolean;
  
  /** Enable context awareness */
  contextAwareness: boolean;
  
  /** Enable MCP tools for this command */
  mcpToolsEnabled: boolean;
  
  /** Custom prompts for different scenarios */
  customPrompts?: Record<string, string>;
  
  /** Preferred coordination patterns */
  coordinationPatterns?: CoordinationPattern[];
  
  /** Performance optimization settings */
  performance?: {
    cacheEnabled: boolean;
    maxExecutionTime?: number;
    memoryLimit?: number;
  };
  
  /** Error handling configuration */
  errorHandling?: {
    retryAttempts: number;
    fallbackStrategy: 'disable' | 'warn' | 'continue';
    errorNotification: boolean;
  };
}

/**
 * Command context loaded for Gemini integration
 */
export interface CommandContext {
  /** Command name */
  command: string;
  
  /** Base context content */
  baseContext: string;
  
  /** Enhanced prompts for different scenarios */
  enhancedPrompts: Record<string, string>;
  
  /** Coordination hints for this command */
  coordinationHints: CoordinationHint[];
  
  /** Relevant MCP tools for this command */
  mcpTools: MCPToolReference[];
  
  /** Context metadata */
  metadata: ContextMetadata;
  
  /** Command-specific configuration */
  config?: CommandContextConfig;
}

/**
 * Coordination hint for command execution
 */
export interface CoordinationHint {
  /** Coordination pattern to use */
  pattern: 'sequential' | 'parallel' | 'hierarchical' | 'adaptive';
  
  /** When this hint applies */
  applicability: string[];
  
  /** Pattern-specific configuration */
  configuration: Record<string, any>;
  
  /** Priority of this hint */
  priority?: 'low' | 'medium' | 'high';
  
  /** Conditions for applying this hint */
  conditions?: {
    argumentPatterns?: string[];
    environmentVariables?: Record<string, string>;
    contextKeywords?: string[];
  };
}

/**
 * MCP tool reference for command context
 */
export interface MCPToolReference {
  /** Tool name */
  name: string;
  
  /** Tool description */
  description: string;
  
  /** When to suggest this tool */
  applicability: string[];
  
  /** Tool parameters schema */
  parametersSchema?: any;
  
  /** Integration configuration */
  integration: {
    autoInvoke?: boolean;
    priority?: number;
    contextRequired?: boolean;
  };
}

/**
 * Context metadata
 */
export interface ContextMetadata {
  /** When context was loaded */
  loaded: Date;
  
  /** Context source */
  source: string;
  
  /** Whether command-specific context exists */
  commandSpecific: boolean;
  
  /** Context version/hash for caching */
  version?: string;
  
  /** Additional metadata */
  extras?: Record<string, any>;
}

/**
 * Command context configuration
 */
export interface CommandContextConfig {
  /** Enable context caching for this command */
  cacheEnabled: boolean;
  
  /** Context cache TTL in milliseconds */
  cacheTTL?: number;
  
  /** Maximum context size for this command */
  maxContextSize?: number;
  
  /** Context preprocessing options */
  preprocessing?: {
    trimWhitespace: boolean;
    removeComments: boolean;
    compressText: boolean;
  };
}
```

---

## 🌉 MCP Bridge Interfaces

### MCP-Gemini Bridge Definitions

```typescript
/**
 * MCP tool definition for Gemini integration
 */
export interface MCPTool {
  /** Tool name (unique identifier) */
  name: string;
  
  /** Tool description */
  description: string;
  
  /** Tool handler for execution */
  handler: MCPToolHandler;
  
  /** Tool metadata */
  metadata: MCPToolMetadata;
  
  /** Integration configuration */
  integration: MCPToolIntegration;
}

/**
 * MCP tool handler interface
 */
export interface MCPToolHandler {
  /** Execute the tool with given arguments */
  execute(args: any[]): Promise<any>;
  
  /** Validate tool arguments */
  validate?(args: any[]): Promise<ValidationResult>;
  
  /** Get tool schema */
  getSchema?(): Promise<ToolSchema>;
  
  /** Handle tool errors */
  handleError?(error: Error, args: any[]): Promise<ErrorHandlingResult>;
}

/**
 * Tool metadata
 */
export interface MCPToolMetadata {
  /** Tool version */
  version: string;
  
  /** Tool category */
  category: string;
  
  /** Required capabilities */
  requirements: string[];
  
  /** Performance characteristics */
  performance?: {
    averageExecutionTime?: number;
    memoryUsage?: number;
    networkDependency?: boolean;
  };
  
  /** Usage documentation */
  documentation?: {
    usage: string;
    examples: ToolExample[];
    troubleshooting?: Record<string, string>;
  };
}

/**
 * Tool integration configuration
 */
export interface MCPToolIntegration {
  /** Whether this tool supports Gemini context */
  supportsGeminiContext: boolean;
  
  /** Context enhancement strategy */
  contextStrategy: 'prepend' | 'append' | 'merge' | 'replace';
  
  /** Result post-processing */
  resultProcessing: 'raw' | 'enhanced' | 'formatted';
  
  /** Error handling strategy */
  errorStrategy: 'throw' | 'warn' | 'ignore' | 'retry';
  
  /** Caching configuration */
  caching?: {
    enabled: boolean;
    ttl?: number;
    keyStrategy?: 'args-hash' | 'custom';
  };
}

/**
 * Tool execution example
 */
export interface ToolExample {
  /** Example description */
  description: string;
  
  /** Example arguments */
  args: any[];
  
  /** Expected result (optional) */
  expectedResult?: any;
  
  /** Example context */
  context?: string;
}

/**
 * Tool validation result
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  
  /** Validation errors */
  errors?: ValidationError[];
  
  /** Validation warnings */
  warnings?: ValidationWarning[];
  
  /** Normalized arguments */
  normalizedArgs?: any[];
}

/**
 * Validation error
 */
export interface ValidationError {
  /** Error message */
  message: string;
  
  /** Argument path that caused error */
  path?: string;
  
  /** Error code */
  code?: string;
  
  /** Suggested fix */
  suggestion?: string;
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  /** Warning message */
  message: string;
  
  /** Warning severity */
  severity: 'low' | 'medium' | 'high';
  
  /** Recommended action */
  action?: string;
}
```

---

## 🔧 Global Flag Handler Interfaces

### Flag Processing Definitions

```typescript
/**
 * Global flags that can be processed
 */
export interface GlobalFlags {
  /** Enable Gemini integration */
  gemini: boolean;
  
  /** Enable verbose output */
  verbose: boolean;
  
  /** Configuration profile to use */
  profile?: string;
  
  /** Additional flags */
  [key: string]: any;
}

/**
 * Processed flags result
 */
export interface ProcessedFlags {
  /** Processed flag values */
  processed: GlobalFlags;
  
  /** Environment configuration */
  environment: EnvironmentConfig;
  
  /** Loaded context */
  context?: CommandContext;
  
  /** Processing metadata */
  metadata: FlagProcessingMetadata;
}

/**
 * Environment configuration
 */
export interface EnvironmentConfig {
  /** Environment variables to set */
  variables: Record<string, string>;
  
  /** Capabilities to enable */
  capabilities: string[];
  
  /** Configuration overrides */
  overrides: Record<string, any>;
  
  /** Validation results */
  validation: EnvironmentValidation;
}

/**
 * Environment validation
 */
export interface EnvironmentValidation {
  /** Whether environment is valid */
  valid: boolean;
  
  /** Validation errors */
  errors: string[];
  
  /** Validation warnings */
  warnings: string[];
  
  /** Missing requirements */
  missing: string[];
}

/**
 * Flag processing metadata
 */
export interface FlagProcessingMetadata {
  /** Processing timestamp */
  timestamp: Date;
  
  /** Processing duration in milliseconds */
  duration: number;
  
  /** Flags that were processed */
  processedFlags: string[];
  
  /** Flags that were ignored */
  ignoredFlags: string[];
  
  /** Processing errors */
  errors: ProcessingError[];
}

/**
 * Flag processing error
 */
export interface ProcessingError {
  /** Error type */
  type: 'validation' | 'configuration' | 'environment' | 'context';
  
  /** Error message */
  message: string;
  
  /** Flag that caused error */
  flag?: string;
  
  /** Error recovery action */
  recovery?: string;
}

/**
 * Flag processor interface
 */
export interface FlagProcessor {
  /** Process a specific flag */
  process(flag: string, value: any, context: ProcessingContext): Promise<ProcessingResult>;
  
  /** Validate flag value */
  validate(flag: string, value: any): Promise<ValidationResult>;
  
  /** Get flag schema */
  getSchema(flag: string): FlagSchema;
}

/**
 * Flag processing context
 */
export interface ProcessingContext {
  /** All flags being processed */
  allFlags: GlobalFlags;
  
  /** Current environment */
  environment: Record<string, string>;
  
  /** Current working directory */
  cwd: string;
  
  /** Processing options */
  options: ProcessingOptions;
}

/**
 * Processing options
 */
export interface ProcessingOptions {
  /** Enable strict validation */
  strict: boolean;
  
  /** Enable flag dependencies checking */
  checkDependencies: boolean;
  
  /** Enable environment validation */
  validateEnvironment: boolean;
  
  /** Custom validation rules */
  customValidation?: ValidationRule[];
}

/**
 * Flag processing result
 */
export interface ProcessingResult {
  /** Whether processing succeeded */
  success: boolean;
  
  /** Environment changes */
  environmentChanges: Record<string, string>;
  
  /** Configuration changes */
  configChanges: Record<string, any>;
  
  /** Processing warnings */
  warnings: string[];
  
  /** Processing errors */
  errors: string[];
}

/**
 * Flag schema definition
 */
export interface FlagSchema {
  /** Flag type */
  type: 'boolean' | 'string' | 'number' | 'array' | 'object';
  
  /** Flag description */
  description: string;
  
  /** Default value */
  default?: any;
  
  /** Validation rules */
  validation?: ValidationRule[];
  
  /** Flag dependencies */
  dependencies?: string[];
  
  /** Conflicts with other flags */
  conflicts?: string[];
}

/**
 * Validation rule
 */
export interface ValidationRule {
  /** Rule type */
  type: 'required' | 'format' | 'range' | 'custom';
  
  /** Rule configuration */
  config?: any;
  
  /** Error message for rule violation */
  message?: string;
  
  /** Custom validation function */
  validator?: (value: any) => boolean | Promise<boolean>;
}
```

---

## 🎯 Coordination Pattern Interfaces

### Coordination and Execution Patterns

```typescript
/**
 * Coordination pattern definition
 */
export interface CoordinationPattern {
  /** Pattern name */
  name: string;
  
  /** Pattern type */
  type: 'sequential' | 'parallel' | 'hierarchical' | 'adaptive' | 'hybrid';
  
  /** Pattern description */
  description: string;
  
  /** Pattern configuration */
  config: CoordinationConfig;
  
  /** Pattern applicability */
  applicability: PatternApplicability;
  
  /** Pattern performance characteristics */
  performance: PatternPerformance;
}

/**
 * Coordination configuration
 */
export interface CoordinationConfig {
  /** Maximum concurrent operations */
  maxConcurrency?: number;
  
  /** Timeout for operations */
  timeout?: number;
  
  /** Retry configuration */
  retry?: {
    attempts: number;
    backoff: 'linear' | 'exponential';
    maxDelay: number;
  };
  
  /** Resource allocation strategy */
  resourceAllocation?: 'balanced' | 'greedy' | 'conservative';
  
  /** Error handling strategy */
  errorHandling?: 'abort' | 'continue' | 'retry';
  
  /** Progress tracking */
  progressTracking?: boolean;
}

/**
 * Pattern applicability conditions
 */
export interface PatternApplicability {
  /** Commands this pattern applies to */
  commands: string[];
  
  /** Argument patterns that trigger this pattern */
  argumentPatterns: string[];
  
  /** Environment conditions */
  environmentConditions?: Record<string, any>;
  
  /** Resource requirements */
  resourceRequirements?: ResourceRequirements;
  
  /** Minimum/maximum operation counts */
  operationCounts?: {
    min?: number;
    max?: number;
  };
}

/**
 * Pattern performance characteristics
 */
export interface PatternPerformance {
  /** Expected execution time multiplier */
  executionTimeMultiplier: number;
  
  /** Memory usage pattern */
  memoryUsage: 'constant' | 'linear' | 'logarithmic' | 'exponential';
  
  /** Scalability characteristics */
  scalability: {
    horizontal: boolean;
    vertical: boolean;
    optimalRange: [number, number];
  };
  
  /** Reliability metrics */
  reliability: {
    errorRate: number;
    recoveryTime: number;
    failureImpact: 'low' | 'medium' | 'high';
  };
}

/**
 * Resource requirements
 */
export interface ResourceRequirements {
  /** Minimum memory in MB */
  minMemory?: number;
  
  /** Minimum CPU cores */
  minCpuCores?: number;
  
  /** Network requirements */
  network?: 'none' | 'low' | 'medium' | 'high';
  
  /** Disk space requirements in MB */
  diskSpace?: number;
  
  /** External dependencies */
  dependencies?: string[];
}
```

---

## 📈 Performance and Monitoring Interfaces

### Performance Tracking Definitions

```typescript
/**
 * Performance metric definition
 */
export interface PerformanceMetric {
  /** Metric name */
  name: string;
  
  /** Metric value */
  value: number;
  
  /** Metric unit */
  unit: string;
  
  /** Metric timestamp */
  timestamp: Date;
  
  /** Metric context */
  context?: Record<string, any>;
  
  /** Metric tags */
  tags?: string[];
}

/**
 * Performance monitoring configuration
 */
export interface MonitoringConfig {
  /** Enable performance monitoring */
  enabled: boolean;
  
  /** Metrics to collect */
  metrics: string[];
  
  /** Collection interval in milliseconds */
  interval: number;
  
  /** Metric retention period */
  retention: number;
  
  /** Performance thresholds */
  thresholds: Record<string, PerformanceThreshold>;
  
  /** Alert configuration */
  alerts?: AlertConfig;
}

/**
 * Performance threshold definition
 */
export interface PerformanceThreshold {
  /** Warning threshold */
  warning: number;
  
  /** Critical threshold */
  critical: number;
  
  /** Threshold direction */
  direction: 'above' | 'below';
  
  /** Actions to take when threshold exceeded */
  actions: ThresholdAction[];
}

/**
 * Threshold action
 */
export interface ThresholdAction {
  /** Action type */
  type: 'log' | 'alert' | 'optimize' | 'throttle' | 'disable';
  
  /** Action configuration */
  config?: any;
  
  /** Action priority */
  priority?: 'low' | 'medium' | 'high';
}

/**
 * Alert configuration
 */
export interface AlertConfig {
  /** Enable alerts */
  enabled: boolean;
  
  /** Alert channels */
  channels: AlertChannel[];
  
  /** Alert aggregation period */
  aggregationPeriod: number;
  
  /** Maximum alerts per period */
  maxAlertsPerPeriod: number;
}

/**
 * Alert channel
 */
export interface AlertChannel {
  /** Channel type */
  type: 'console' | 'log' | 'webhook' | 'slack' | 'email';
  
  /** Channel configuration */
  config: Record<string, any>;
  
  /** Minimum alert severity for this channel */
  minSeverity: 'low' | 'medium' | 'high' | 'critical';
}
```

---

## 🔒 Security and Validation Interfaces

### Security Framework Definitions

```typescript
/**
 * Security validation configuration
 */
export interface SecurityConfig {
  /** Enable security validation */
  enabled: boolean;
  
  /** Validation rules */
  rules: SecurityRule[];
  
  /** Sanitization configuration */
  sanitization: SanitizationConfig;
  
  /** Access control configuration */
  accessControl?: AccessControlConfig;
  
  /** Audit configuration */
  audit?: AuditConfig;
}

/**
 * Security rule definition
 */
export interface SecurityRule {
  /** Rule name */
  name: string;
  
  /** Rule type */
  type: 'input-validation' | 'path-traversal' | 'command-injection' | 'xss' | 'custom';
  
  /** Rule pattern */
  pattern?: string | RegExp;
  
  /** Rule validator function */
  validator?: (input: any) => Promise<SecurityValidationResult>;
  
  /** Rule severity */
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  /** Action to take on rule violation */
  action: 'warn' | 'sanitize' | 'reject' | 'block';
}

/**
 * Security validation result
 */
export interface SecurityValidationResult {
  /** Whether input is safe */
  safe: boolean;
  
  /** Validation violations */
  violations: SecurityViolation[];
  
  /** Sanitized input (if applicable) */
  sanitized?: any;
  
  /** Validation metadata */
  metadata?: Record<string, any>;
}

/**
 * Security violation
 */
export interface SecurityViolation {
  /** Violation type */
  type: string;
  
  /** Violation message */
  message: string;
  
  /** Violation severity */
  severity: 'low' | 'medium' | 'high' | 'critical';
  
  /** Input that caused violation */
  input?: any;
  
  /** Suggested remediation */
  remediation?: string;
}

/**
 * Sanitization configuration
 */
export interface SanitizationConfig {
  /** Enable input sanitization */
  enabled: boolean;
  
  /** Sanitization rules */
  rules: SanitizationRule[];
  
  /** Default sanitization strategy */
  defaultStrategy: 'escape' | 'remove' | 'encode' | 'reject';
  
  /** Whitelist patterns */
  whitelist?: (string | RegExp)[];
  
  /** Blacklist patterns */
  blacklist?: (string | RegExp)[];
}

/**
 * Sanitization rule
 */
export interface SanitizationRule {
  /** Rule pattern */
  pattern: string | RegExp;
  
  /** Sanitization strategy */
  strategy: 'escape' | 'remove' | 'encode' | 'replace';
  
  /** Replacement value (for replace strategy) */
  replacement?: string;
  
  /** Rule priority */
  priority?: number;
}

/**
 * Access control configuration
 */
export interface AccessControlConfig {
  /** Enable access control */
  enabled: boolean;
  
  /** Access policies */
  policies: AccessPolicy[];
  
  /** Default access level */
  defaultAccess: 'allow' | 'deny';
  
  /** Role-based access control */
  rbac?: RBACConfig;
}

/**
 * Access policy
 */
export interface AccessPolicy {
  /** Policy name */
  name: string;
  
  /** Resource pattern */
  resource: string | RegExp;
  
  /** Actions covered by this policy */
  actions: string[];
  
  /** Policy effect */
  effect: 'allow' | 'deny';
  
  /** Policy conditions */
  conditions?: AccessCondition[];
}

/**
 * Access condition
 */
export interface AccessCondition {
  /** Condition type */
  type: 'time' | 'ip' | 'user' | 'role' | 'custom';
  
  /** Condition configuration */
  config: Record<string, any>;
  
  /** Condition validator */
  validator?: (context: AccessContext) => Promise<boolean>;
}

/**
 * Access context
 */
export interface AccessContext {
  /** User information */
  user?: UserInfo;
  
  /** Request information */
  request: RequestInfo;
  
  /** Environment information */
  environment: Record<string, any>;
  
  /** Timestamp */
  timestamp: Date;
}

/**
 * User information
 */
export interface UserInfo {
  /** User ID */
  id: string;
  
  /** User roles */
  roles: string[];
  
  /** User attributes */
  attributes?: Record<string, any>;
}

/**
 * Request information
 */
export interface RequestInfo {
  /** Request ID */
  id: string;
  
  /** Requested resource */
  resource: string;
  
  /** Request action */
  action: string;
  
  /** Request parameters */
  parameters?: Record<string, any>;
  
  /** Request metadata */
  metadata?: Record<string, any>;
}
```

---

These comprehensive interface definitions provide a solid foundation for implementing the --gemini flag integration architecture with full type safety and clear contracts between all components.