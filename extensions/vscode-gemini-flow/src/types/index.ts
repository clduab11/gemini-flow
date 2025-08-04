/**
 * Type definitions for Gemini Flow VSCode Extension
 */

import * as vscode from 'vscode';

export interface GeminiFlowConfig {
  enabled: boolean;
  apiKey: string;
  model: string;
  autoComplete: boolean;
  inlineDocumentation: boolean;
  codeExplanation: boolean;
  refactoringSuggestions: boolean;
  streamingMode: boolean;
  contextWindow: number;
  a2a: {
    enabled: boolean;
    endpoint: string;
  };
  mcp: {
    enabled: boolean;
    servers: string[];
  };
  swarm: {
    enabled: boolean;
  };
  security: {
    scanEnabled: boolean;
  };
  telemetry: {
    enabled: boolean;
  };
}

export interface CodeContext {
  fileName: string;
  language: string;
  selectedText?: string;
  fullText: string;
  lineNumber?: number;
  columnNumber?: number;
  workspaceRoot?: string;
  relativeFilePath: string;
}

export interface GeminiResponse {
  id: string;
  content: string;
  type: 'explanation' | 'refactoring' | 'generation' | 'documentation' | 'optimization';
  streaming?: boolean;
  metadata?: {
    model: string;
    tokensUsed: number;
    responseTime: number;
    confidence?: number;
  };
}

export interface A2AMessage {
  id: string;
  type: 'request' | 'response' | 'notification';
  method: string;
  params?: any;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface MCPServer {
  name: string;
  transport: 'stdio' | 'sse' | 'websocket';
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
}

export interface SwarmTask {
  id: string;
  type: 'analysis' | 'generation' | 'optimization' | 'testing';
  description: string;
  context: CodeContext;
  priority: 'low' | 'medium' | 'high' | 'critical';
  agents?: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

export interface CodeAssistRequest {
  type: 'completion' | 'explanation' | 'refactoring' | 'documentation' | 'optimization';
  context: CodeContext;
  prompt?: string;
  options?: {
    streaming?: boolean;
    temperature?: number;
    maxTokens?: number;
  };
}

export interface CompletionItem extends vscode.CompletionItem {
  geminiData?: {
    confidence: number;
    reasoning: string;
    alternatives?: string[];
  };
}

export interface DiagnosticData {
  message: string;
  severity: vscode.DiagnosticSeverity;
  source: 'gemini-flow';
  code?: string;
  suggestion?: string;
  fix?: {
    title: string;
    edit: vscode.WorkspaceEdit;
  };
}

export interface SecurityScanResult {
  vulnerabilities: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    line?: number;
    column?: number;
    fix?: string;
  }>;
  recommendations: string[];
  score: number;
}

export interface WorkspaceAnalysis {
  projectType: string;
  languages: string[];
  dependencies: string[];
  architecture: {
    patterns: string[];
    complexity: number;
    maintainability: number;
  };
  recommendations: string[];
}

export interface StreamingResponse {
  onData: (chunk: string) => void;
  onComplete: (fullResponse: string) => void;
  onError: (error: Error) => void;
}

export interface ExtensionState {
  isActivated: boolean;
  isAuthenticated: boolean;
  currentModel: string;
  a2aConnection?: any;
  mcpConnections: Map<string, any>;
  activeSwarmTasks: Map<string, SwarmTask>;
  diagnosticsCollection: vscode.DiagnosticCollection;
  statusBarItem: vscode.StatusBarItem;
}

export interface ContextGatherer {
  gatherFileContext(document: vscode.TextDocument, selection?: vscode.Selection): CodeContext;
  gatherProjectContext(workspaceFolder: vscode.WorkspaceFolder): Promise<WorkspaceAnalysis>;
  gatherWorkspaceContext(): Promise<{
    folders: string[];
    openFiles: string[];
    recentChanges: string[];
  }>;
}

export interface ResponseFormatter {
  formatExplanation(response: GeminiResponse): string;
  formatRefactoring(response: GeminiResponse): vscode.WorkspaceEdit;
  formatDocumentation(response: GeminiResponse): string;
  formatCompletion(response: GeminiResponse): CompletionItem[];
}

export interface ErrorRecovery {
  handleNetworkError(error: Error): Promise<void>;
  handleAuthError(error: Error): Promise<void>;
  handleAPIError(error: Error): Promise<void>;
  retry<T>(operation: () => Promise<T>, maxRetries: number): Promise<T>;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, error?: Error, ...args: any[]): void;
}