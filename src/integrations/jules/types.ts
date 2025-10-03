/**
 * Jules Tools Integration Types
 * 
 * Type definitions for Jules API/CLI integration
 */

/**
 * Jules configuration
 */
export interface JulesConfig {
  apiKey?: string;
  endpoint?: string;
  timeout?: number;
  retryAttempts?: number;
  maxConcurrentTasks?: number;
  githubToken?: string;
  githubRepository?: string;
}

/**
 * Jules task creation parameters
 */
export interface JulesTaskParams {
  title: string;
  description: string;
  type?: 'bug-fix' | 'feature' | 'refactor' | 'documentation' | 'test';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  branch?: string;
  baseBranch?: string;
  files?: string[];
  context?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Jules task status
 */
export type JulesTaskStatus = 
  | 'pending'
  | 'queued'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

/**
 * Jules task object
 */
export interface JulesTask {
  id: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  status: JulesTaskStatus;
  branch?: string;
  baseBranch?: string;
  files?: string[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  error?: string;
  result?: JulesTaskResult;
  logs?: string[];
  metadata?: Record<string, any>;
}

/**
 * Jules task result
 */
export interface JulesTaskResult {
  success: boolean;
  pullRequest?: {
    url: string;
    number: number;
    title: string;
    branch: string;
  };
  filesChanged?: number;
  linesAdded?: number;
  linesRemoved?: number;
  commits?: Array<{
    sha: string;
    message: string;
    timestamp: Date;
  }>;
  error?: string;
  logs?: string[];
}

/**
 * Jules task filter
 */
export interface JulesTaskFilter {
  status?: JulesTaskStatus | JulesTaskStatus[];
  type?: string | string[];
  priority?: string | string[];
  branch?: string;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Jules error types
 */
export enum JulesErrorType {
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  INVALID_CONFIGURATION = 'INVALID_CONFIGURATION',
  TASK_CREATION_FAILED = 'TASK_CREATION_FAILED',
  TASK_NOT_FOUND = 'TASK_NOT_FOUND',
  TASK_EXECUTION_FAILED = 'TASK_EXECUTION_FAILED',
  API_ERROR = 'API_ERROR',
  CLI_ERROR = 'CLI_ERROR',
  GITHUB_AUTH_FAILED = 'GITHUB_AUTH_FAILED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  VM_TIMEOUT = 'VM_TIMEOUT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Jules error
 */
export class JulesError extends Error {
  public readonly type: JulesErrorType;
  public readonly taskId?: string;
  public readonly statusCode?: number;
  public readonly details?: any;

  constructor(
    message: string,
    type: JulesErrorType,
    options?: {
      taskId?: string;
      statusCode?: number;
      details?: any;
      cause?: Error;
    }
  ) {
    super(message);
    this.name = 'JulesError';
    this.type = type;
    this.taskId = options?.taskId;
    this.statusCode = options?.statusCode;
    this.details = options?.details;
    if (options?.cause) {
      this.cause = options.cause;
    }
  }
}

/**
 * Jules CLI installation result
 */
export interface JulesInstallResult {
  success: boolean;
  version?: string;
  cliPath?: string;
  error?: string;
}

/**
 * Jules GitHub validation result
 */
export interface JulesGitHubValidation {
  connected: boolean;
  repository?: string;
  permissions?: string[];
  error?: string;
}

/**
 * Jules log entry
 */
export interface JulesLogEntry {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  taskId?: string;
  metadata?: Record<string, any>;
}

/**
 * Jules API response wrapper
 */
export interface JulesAPIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    requestId?: string;
    timestamp?: Date;
    rateLimit?: {
      remaining: number;
      reset: Date;
    };
  };
}

/**
 * Jules tier limits
 */
export interface JulesTierLimits {
  tier: 'free' | 'pro' | 'enterprise';
  maxTasksPerDay: number;
  maxConcurrentTasks: number;
  maxVMTime: number; // in minutes
  features: string[];
}
