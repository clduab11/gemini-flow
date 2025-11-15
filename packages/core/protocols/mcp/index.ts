/**
 * MCP (Model Context Protocol) Integration
 *
 * Provides unified interface to Anthropic's Model Context Protocol servers.
 * Manages server lifecycle, context storage, and tool execution.
 */

// Export types
export * from './types.js';

// Export managers
export * from './server-manager.js';

// Re-export main classes
import { MCPServerManager, loadMCPServersFromConfig } from './server-manager.js';

export {
  MCPServerManager,
  loadMCPServersFromConfig
};

/**
 * MCP Protocol Manager
 * Main entry point for MCP operations
 */
export class MCPProtocol {
  public serverManager: MCPServerManager;

  constructor() {
    this.serverManager = new MCPServerManager();
    this.loadDefaultServers();
  }

  /**
   * Load default MCP servers from configuration
   */
  private loadDefaultServers(): void {
    const servers = loadMCPServersFromConfig('gemini-extension.json');

    for (const config of servers) {
      this.serverManager.registerServer(config);
    }

    console.log(`[MCP] Loaded ${servers.length} server configurations`);
  }

  /**
   * Initialize MCP protocol (start all enabled servers)
   */
  async initialize(): Promise<void> {
    console.log('[MCP] Initializing protocol...');
    await this.serverManager.startAll();
    console.log('[MCP] Protocol initialized');
  }

  /**
   * Cleanup
   */
  async cleanup(): Promise<void> {
    await this.serverManager.stopAll();
    this.serverManager.clear();
    console.log('[MCP] Protocol cleaned up');
  }
}

/**
 * Global instance
 */
let mcpInstance: MCPProtocol | null = null;

/**
 * Get MCP protocol instance
 */
export function getMCPProtocol(): MCPProtocol {
  if (!mcpInstance) {
    mcpInstance = new MCPProtocol();
  }
  return mcpInstance;
}

/**
 * Reset MCP instance (for testing)
 */
export function resetMCPProtocol(): void {
  if (mcpInstance) {
    mcpInstance.cleanup();
    mcpInstance = null;
  }
}

// Export default instance getter
export default getMCPProtocol;
