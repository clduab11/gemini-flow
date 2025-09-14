import { MCPSettings } from '../../types/mcp-config';
/**
 * @class MCPSettingsManager
 * @description Manages reading, writing, and validating MCP server configurations.
 */
export declare class MCPSettingsManager {
    private settings;
    constructor();
    /**
     * Reads the MCP settings from the settings.json file.
     * If the file does not exist, it returns an empty settings object.
     * @returns {Promise<MCPSettings>} The MCP settings.
     */
    readSettings(): Promise<MCPSettings>;
    /**
     * Writes the provided MCP settings to the settings.json file.
     * @param {MCPSettings} newSettings The new settings to write.
     * @returns {Promise<void>}
     */
    writeSettings(newSettings: MCPSettings): Promise<void>;
    /**
     * Validates the given MCP settings against the schema.
     * Throws an error if validation fails.
     * @param {MCPSettings} settings The settings to validate.
     * @private
     */
    private validateSettings;
    /**
     * Dynamically adds a new MCP server configuration.
     * @param {string} serverName The name of the server to add.
     * @param {MCPSettings['mcpServers'][string]} serverConfig The configuration for the new server.
     * @returns {Promise<void>}
     */
    addMcpServer(serverName: string, serverConfig: MCPSettings['mcpServers'][string]): Promise<void>;
    /**
     * Retrieves the configuration for a specific MCP server.
     * @param {string} serverName The name of the server to retrieve.
     * @returns {Promise<MCPSettings['mcpServers'][string] | undefined>} The server configuration or undefined if not found.
     */
    getMcpServerConfig(serverName: string): Promise<MCPSettings['mcpServers'][string] | undefined>;
    /**
     * Updates an existing MCP server configuration.
     * @param {string} serverName The name of the server to update.
     * @param {Partial<MCPSettings['mcpServers'][string]>} updates The partial configuration to apply.
     * @returns {Promise<void>}
     */
    updateMcpServer(serverName: string, updates: Partial<MCPSettings['mcpServers'][string]>): Promise<void>;
    /**
     * Removes an MCP server configuration.
     * @param {string} serverName The name of the server to remove.
     * @returns {Promise<void>}
     */
    removeMcpServer(serverName: string): Promise<void>;
}
//# sourceMappingURL=mcp-settings-manager.d.ts.map