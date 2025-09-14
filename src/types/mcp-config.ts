/**
 * @interface MCPSettings
 * @description Defines the structure for the MCP settings, including a map of MCP servers.
 */
export interface MCPSettings {
  mcpServers: {
    [serverName: string]: {
      command: string;
      args: string[];
      disabled?: boolean;
      autoApprove?: string[];
      timeout?: number;
      alwaysAllow?: string[];
      env?: Record<string, string>;
    };
  };
}

/**
 * @interface ToolCapability
 * @description Defines the structure for a tool's capability.
 */
export interface ToolCapability {
  name: string;
  description: string;
  // Add more properties as needed for capability definition
}

/**
 * @interface SystemSettings
 * @description Defines the structure for overall system settings and preferences.
 */
export interface SystemSettings {
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  maxAgents: number;
  memoryLimit: number;
  sessionTimeout: number;
  // Add more system-wide settings
}
