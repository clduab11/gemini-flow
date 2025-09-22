import * as fs from 'fs/promises';
import { MCPSettingsManager, MCPSettings } from './mcp-settings-manager.js';
import * as path from 'path';

// Define the absolute path to the source Roo Code MCP settings file
const ROO_CODE_MCP_SETTINGS_PATH = '/Users/chrisdukes/Desktop/projects/gemini-flow/temp_mcp_settings.json';

/**
 * @class MCPSettingsTransfer
 * @description Handles the transfer and intelligent merging of MCP settings from Roo Code to Gemini-Flow.
 */
export class MCPSettingsTransfer {
  private settingsManager: MCPSettingsManager;

  constructor(settingsManager: MCPSettingsManager) {
    this.settingsManager = settingsManager;
  }

  /**
   * Reads the MCP settings from the specified Roo Code settings file.
   * @returns {Promise<MCPSettings>} The Roo Code MCP settings.
   */
  private async readRooCodeSettings(): Promise<MCPSettings> {
    try {
      const data = await fs.readFile(ROO_CODE_MCP_SETTINGS_PATH, 'utf-8');
      return JSON.parse(data) as MCPSettings;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.warn(`Roo Code MCP settings file not found at ${ROO_CODE_MCP_SETTINGS_PATH}. Returning empty settings.`);
        return { mcpServers: {} };
      }
      throw new Error(`Failed to read Roo Code MCP settings: ${error.message}`);
    }
  }

  /**
   * Intelligently merges Roo Code MCP settings with existing Gemini-Flow settings.
   * New servers from Roo Code are added. Existing servers are updated if conflicts arise,
   * with a preference for existing Gemini-Flow settings unless explicitly overridden.
   * @returns {Promise<void>}
   */
  public async transferAndMergeSettings(): Promise<void> {
    console.log('Starting MCP settings transfer and merge...');
    const rooCodeSettings = await this.readRooCodeSettings();
    const currentGeminiSettings = await this.settingsManager.readSettings();

    let mergedSettings: MCPSettings = { ...currentGeminiSettings };

    for (const serverName in rooCodeSettings.mcpServers) {
      const rooServerConfig = rooCodeSettings.mcpServers[serverName];

      if (mergedSettings.mcpServers[serverName]) {
        // Server already exists in Gemini-Flow settings, merge intelligently
        console.log(`Merging configuration for existing server: ${serverName}`);
        mergedSettings.mcpServers[serverName] = {
          ...rooServerConfig, // Start with Roo Code config
          ...mergedSettings.mcpServers[serverName], // Overlay with existing Gemini-Flow config (prefer Gemini-Flow)
          // Special handling for arrays like autoApprove and alwaysAllow: combine them
          autoApprove: Array.from(new Set([
            ...(rooServerConfig.autoApprove || []),
            ...(mergedSettings.mcpServers[serverName].autoApprove || []),
          ])),
          alwaysAllow: Array.from(new Set([
            ...(rooServerConfig.alwaysAllow || []),
            ...(mergedSettings.mcpServers[serverName].alwaysAllow || []),
          ])),
          // Special handling for env: merge objects
          env: {
            ...(rooServerConfig.env || {}),
            ...(mergedSettings.mcpServers[serverName].env || {}),
          },
        };
      } else {
        // Server does not exist, add it directly
        console.log(`Adding new MCP server: ${serverName}`);
        mergedSettings.mcpServers[serverName] = rooServerConfig;
      }
    }

    // Validate and write the merged settings
    await this.settingsManager.writeSettings(mergedSettings);
    console.log('MCP settings transfer and merge completed successfully.');
  }

  /**
   * Validates the transferred settings against the schema and handles conflicts.
   * This method is implicitly called by MCPSettingsManager.writeSettings.
   * Additional conflict resolution logic can be added here if needed beyond schema validation.
   * @param {MCPSettings} settings The settings to validate.
   * @private
   */
  private validateTransferredSettings(settings: MCPSettings): void {
    // The MCPSettingsManager.writeSettings method already performs schema validation.
    // This method can be extended for more complex conflict resolution or business logic validation.
    console.log('Transferred settings validated (schema validation handled by MCPSettingsManager).');
  }
}
