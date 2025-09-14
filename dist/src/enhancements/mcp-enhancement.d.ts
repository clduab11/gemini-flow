import { MCPSettingsManager } from '../core/mcp-settings-manager';
import { MCPServerRegistry } from '../core/mcp-server-registry';
/**
 * @interface McpEnhancementConfig
 * @description Configuration for MCP Ecosystem Enhancement.
 */
export interface McpEnhancementConfig {
}
/**
 * @interface McpEnhancementOperations
 * @description Defines operations for enhancing the MCP ecosystem.
 */
export interface McpEnhancementOperations {
    addMissingMcpServers(): Promise<void>;
    optimizeMcpServerConfigurations(): Promise<void>;
    setupMcpServerMonitoringAndRecovery(): Promise<void>;
    implementMcpServerLoadBalancing(): Promise<void>;
}
/**
 * @class McpEnhancer
 * @description Addresses gaps and optimizes the complete MCP ecosystem.
 */
export declare class McpEnhancer implements McpEnhancementOperations {
    private config;
    private logger;
    private settingsManager;
    private serverRegistry;
    constructor(config: McpEnhancementConfig, settingsManager: MCPSettingsManager, serverRegistry: MCPServerRegistry);
    /**
     * Adds any missing MCP servers that would benefit gemini-flow.
     * @returns {Promise<void>}
     */
    addMissingMcpServers(): Promise<void>;
    /**
     * Optimizes MCP server configurations for Google Cloud integration.
     * @returns {Promise<void>}
     */
    optimizeMcpServerConfigurations(): Promise<void>;
    /**
     * Sets up MCP server health monitoring and automatic recovery.
     * @returns {Promise<void>}
     */
    setupMcpServerMonitoringAndRecovery(): Promise<void>;
    /**
     * Implements intelligent MCP server load balancing.
     * @returns {Promise<void>}
     */
    implementMcpServerLoadBalancing(): Promise<void>;
}
//# sourceMappingURL=mcp-enhancement.d.ts.map