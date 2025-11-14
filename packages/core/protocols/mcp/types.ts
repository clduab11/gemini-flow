/**
 * MCP (Model Context Protocol) Types
 * Integration with Anthropic's Model Context Protocol
 */

/**
 * MCP Server Configuration
 */
export interface MCPServerConfig {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  description: string;
  enabled?: boolean;
}

/**
 * MCP Server Status
 */
export enum MCPServerStatus {
  STOPPED = 'stopped',
  STARTING = 'starting',
  RUNNING = 'running',
  ERROR = 'error'
}

/**
 * MCP Server Info
 */
export interface MCPServerInfo {
  name: string;
  status: MCPServerStatus;
  config: MCPServerConfig;
  pid?: number;
  uptime?: number;
  lastError?: string;
}

/**
 * MCP Context
 */
export interface MCPContext {
  serverId: string;
  key: string;
  value: any;
  metadata?: Record<string, any>;
  createdAt: Date;
  expiresAt?: Date;
}

/**
 * MCP Tool Definition
 */
export interface MCPTool {
  name: string;
  description: string;
  inputSchema: any;
  serverId: string;
}

/**
 * MCP Tool Execution Request
 */
export interface MCPToolRequest {
  serverId: string;
  toolName: string;
  arguments: any;
  context?: Record<string, any>;
}

/**
 * MCP Tool Execution Response
 */
export interface MCPToolResponse {
  result?: any;
  error?: string;
  metadata?: Record<string, any>;
}
