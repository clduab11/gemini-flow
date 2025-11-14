/**
 * Gemini-Flow Protocol Suite
 *
 * Unified interface to all protocols:
 * - A2A (Agent-to-Agent): Google's protocol for agent discovery and collaboration
 * - AP2 (Agent Payments): Extension of A2A for payment capabilities
 * - MCP (Model Context Protocol): Anthropic's protocol for model context management
 */

// Export all protocols
export * from './a2a/index.js';
export * from './ap2/index.js';
export * from './mcp/index.js';

// Re-export protocol managers
import { getA2AProtocol, A2AProtocolManager } from './a2a/index.js';
import { getAP2Protocol, AP2Protocol } from './ap2/index.js';
import { getMCPProtocol, MCPProtocol } from './mcp/index.js';

export {
  // A2A
  getA2AProtocol,
  A2AProtocolManager,

  // AP2
  getAP2Protocol,
  AP2Protocol,

  // MCP
  getMCPProtocol,
  MCPProtocol
};

/**
 * Unified Protocol Manager
 * Provides access to all protocols through single interface
 */
export class ProtocolManager {
  public a2a: A2AProtocolManager;
  public ap2: AP2Protocol;
  public mcp: MCPProtocol;

  constructor() {
    this.a2a = getA2AProtocol();
    this.ap2 = getAP2Protocol();
    this.mcp = getMCPProtocol();

    console.log('[Protocols] All protocols initialized');
  }

  /**
   * Initialize all protocols
   */
  async initialize(): Promise<void> {
    console.log('[Protocols] Initializing protocol suite...');

    // Initialize MCP servers
    await this.mcp.initialize();

    console.log('[Protocols] Protocol suite ready');
  }

  /**
   * Get protocol statistics
   */
  getStats(): {
    a2a: { agents: number; tasks: number };
    ap2: { mandates: number; transactions: number };
    mcp: { servers: number; running: number };
  } {
    return {
      a2a: {
        agents: this.a2a.getAllAgents().length,
        tasks: 0 // Would query task executor
      },
      ap2: {
        mandates: this.ap2.mandateManager.getAllMandates().length,
        transactions: this.ap2.transactionManager.getAllTransactions().length
      },
      mcp: {
        servers: this.mcp.serverManager.getAllServers().length,
        running: this.mcp.serverManager.getRunningServers().length
      }
    };
  }

  /**
   * Cleanup all protocols
   */
  async cleanup(): Promise<void> {
    console.log('[Protocols] Cleaning up protocol suite...');

    this.a2a.cleanup();
    this.ap2.cleanup();
    await this.mcp.cleanup();

    console.log('[Protocols] Protocol suite cleaned up');
  }
}

/**
 * Global instance
 */
let protocolManagerInstance: ProtocolManager | null = null;

/**
 * Get protocol manager instance
 */
export function getProtocolManager(): ProtocolManager {
  if (!protocolManagerInstance) {
    protocolManagerInstance = new ProtocolManager();
  }
  return protocolManagerInstance;
}

/**
 * Reset all protocols (for testing)
 */
export function resetProtocols(): void {
  if (protocolManagerInstance) {
    protocolManagerInstance.cleanup();
    protocolManagerInstance = null;
  }
}

// Export default
export default getProtocolManager;
