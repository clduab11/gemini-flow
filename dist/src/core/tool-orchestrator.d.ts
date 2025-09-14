import { MCPServerRegistry } from './mcp-server-registry';
import { ToolCapability } from '../../types/mcp-config';
/**
 * @interface ToolDefinition
 * @description Represents a tool provided by an MCP server.
 */
export interface ToolDefinition {
    name: string;
    serverName: string;
    capability: ToolCapability;
}
/**
 * @class ToolOrchestrator
 * @description Establishes the base orchestration system for discovering, registering, and executing MCP tools.
 */
export declare class ToolOrchestrator {
    private serverRegistry;
    private tools;
    constructor(serverRegistry: MCPServerRegistry);
    /**
     * Discovers and registers tools from all available MCP servers.
     * @returns {Promise<void>}
     */
    discoverAndRegisterTools(): Promise<void>;
    /**
     * Simulates tool discovery for a given MCP server.
     * In a real implementation, this would query the MCP server for its tools.
     * @param {RegisteredMCPServer} server The MCP server to query.
     * @returns {Promise<ToolDefinition[]>}
     * @private
     */
    private simulateToolDiscovery;
    /**
     * Retrieves a registered tool by its name.
     * @param {string} toolName The name of the tool.
     * @returns {ToolDefinition | undefined}
     */
    getTool(toolName: string): ToolDefinition | undefined;
    /**
     * Executes a registered tool.
     * This is a placeholder for the actual execution logic.
     * @param {string} toolName The name of the tool to execute.
     * @param {any[]} args Arguments for the tool.
     * @returns {Promise<any>} The result of the tool execution.
     */
    executeTool(toolName: string, args: any[]): Promise<any>;
    /**
     * Simulates the execution of a tool.
     * @param {ToolDefinition} tool The tool to simulate.
     * @param {any[]} args Arguments for the tool.
     * @returns {Promise<any>}
     * @private
     */
    private simulateToolExecution;
    /**
     * Assesses and categorizes tool capabilities.
     * This method would typically analyze tool schemas or metadata.
     * @param {ToolDefinition} tool The tool to assess.
     * @returns {string[]}
     */
    assessToolCapabilities(tool: ToolDefinition): string[];
}
//# sourceMappingURL=tool-orchestrator.d.ts.map