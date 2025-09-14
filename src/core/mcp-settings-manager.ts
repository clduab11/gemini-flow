
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { MCPSettings } from '../../types/mcp-config'; // Import MCPSettings
export type { MCPSettings } from '../../types/mcp-config';

// Define the absolute path to the settings file
// Assuming ~/.gemini/settings.json is located in the user's home directory
// For cross-platform compatibility, we'll construct this path dynamically
// In a real Node.js environment, you'd use require('os').homedir()
// For this simulation, we'll use a placeholder that needs to be resolved to an absolute path.
// Let's assume the user's home directory is /Users/chrisdukes for this context.
const GEMINI_DIR = path.join('/Users/chrisdukes', '.gemini');
const SETTINGS_FILE_PATH = path.join(GEMINI_DIR, 'settings.json');

/**
 * @class MCPSettingsManager
 * @description Manages reading, writing, and validating MCP server configurations.
 */
export class MCPSettingsManager {
  private settings: MCPSettings | null = null;

  constructor() {}

  /**
   * Reads the MCP settings from the settings.json file.
   * If the file does not exist, it returns an empty settings object.
   * @returns {Promise<MCPSettings>} The MCP settings.
   */
  public async readSettings(): Promise<MCPSettings> {
    if (this.settings) {
      return this.settings;
    }

    try {
      const data = await fs.readFile(SETTINGS_FILE_PATH, 'utf-8');
      this.settings = JSON.parse(data) as MCPSettings;
      // Validate settings after reading
      this.validateSettings(this.settings);
      return this.settings;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // File not found, return default empty settings
        this.settings = { mcpServers: {} };
        return this.settings;
      }
      throw new Error(`Failed to read MCP settings: ${error.message}`);
    }
  }

  /**
   * Writes the provided MCP settings to the settings.json file.
   * @param {MCPSettings} newSettings The new settings to write.
   * @returns {Promise<void>}
   */
  public async writeSettings(newSettings: MCPSettings): Promise<void> {
    // Validate settings before writing
    this.validateSettings(newSettings);
    try {
      // Ensure the .gemini directory exists
      await fs.mkdir(GEMINI_DIR, { recursive: true });
      await fs.writeFile(SETTINGS_FILE_PATH, JSON.stringify(newSettings, null, 2), 'utf-8');
      this.settings = newSettings;
    } catch (error: any) {
      throw new Error(`Failed to write MCP settings: ${error.message}`);
    }
  }

  /**
   * Validates the given MCP settings against the schema.
   * Throws an error if validation fails.
   * @param {MCPSettings} settings The settings to validate.
   * @private
   */
  private validateSettings(settings: MCPSettings): void {
    if (!settings || typeof settings !== 'object' || !settings.mcpServers || typeof settings.mcpServers !== 'object') {
      throw new Error('Invalid MCP settings structure: mcpServers object is missing or malformed.');
    }

    for (const serverName in settings.mcpServers) {
      const server = settings.mcpServers[serverName];
      if (typeof server !== 'object' || server === null) {
        throw new Error(`Invalid configuration for MCP server "${serverName}": server object is malformed.`);
      }
      if (typeof server.command !== 'string' || !Array.isArray(server.args)) {
        throw new Error(`Invalid configuration for MCP server "${serverName}": 'command' must be a string and 'args' must be an array.`);
      }
      if (server.disabled !== undefined && typeof server.disabled !== 'boolean') {
        throw new Error(`Invalid configuration for MCP server "${serverName}": 'disabled' must be a boolean.`);
      }
      if (server.timeout !== undefined && typeof server.timeout !== 'number') {
        throw new Error(`Invalid configuration for MCP server "${serverName}": 'timeout' must be a number.`);
      }
      if (server.autoApprove !== undefined && (!Array.isArray(server.autoApprove) || !server.autoApprove.every(item => typeof item === 'string'))) {
        throw new Error(`Invalid configuration for MCP server "${serverName}": 'autoApprove' must be an array of strings.`);
      }
      if (server.alwaysAllow !== undefined && (!Array.isArray(server.alwaysAllow) || !server.alwaysAllow.every(item => typeof item === 'string'))) {
        throw new Error(`Invalid configuration for MCP server "${serverName}": 'alwaysAllow' must be an array of strings.`);
      }
      if (server.env !== undefined && (typeof server.env !== 'object' || server.env === null)) {
        throw new Error(`Invalid configuration for MCP server "${serverName}": 'env' must be an object.`);
      }
    }
  }

  /**
   * Dynamically adds a new MCP server configuration.
   * @param {string} serverName The name of the server to add.
   * @param {MCPSettings['mcpServers'][string]} serverConfig The configuration for the new server.
   * @returns {Promise<void>}
   */
  public async addMcpServer(serverName: string, serverConfig: MCPSettings['mcpServers'][string]): Promise<void> {
    const currentSettings = await this.readSettings();
    currentSettings.mcpServers[serverName] = serverConfig;
    await this.writeSettings(currentSettings);
  }

  /**
   * Retrieves the configuration for a specific MCP server.
   * @param {string} serverName The name of the server to retrieve.
   * @returns {Promise<MCPSettings['mcpServers'][string] | undefined>} The server configuration or undefined if not found.
   */
  public async getMcpServerConfig(serverName: string): Promise<MCPSettings['mcpServers'][string] | undefined> {
    const settings = await this.readSettings();
    return settings.mcpServers[serverName];
  }

  /**
   * Updates an existing MCP server configuration.
   * @param {string} serverName The name of the server to update.
   * @param {Partial<MCPSettings['mcpServers'][string]>} updates The partial configuration to apply.
   * @returns {Promise<void>}
   */
  public async updateMcpServer(serverName: string, updates: Partial<MCPSettings['mcpServers'][string]>): Promise<void> {
    const currentSettings = await this.readSettings();
    if (!currentSettings.mcpServers[serverName]) {
      throw new Error(`MCP server "${serverName}" not found.`);
    }
    currentSettings.mcpServers[serverName] = { ...currentSettings.mcpServers[serverName], ...updates };
    await this.writeSettings(currentSettings);
  }

  /**
   * Removes an MCP server configuration.
   * @param {string} serverName The name of the server to remove.
   * @returns {Promise<void>}
   */
  public async removeMcpServer(serverName: string): Promise<void> {
    const currentSettings = await this.readSettings();
    if (!currentSettings.mcpServers[serverName]) {
      throw new Error(`MCP server "${serverName}" not found.`);
    }
    delete currentSettings.mcpServers[serverName];
    await this.writeSettings(currentSettings);
  }
}
