import { MCPSettingsManager } from './mcp-settings-manager';
/**
 * @class MCPSettingsTransfer
 * @description Handles the transfer and intelligent merging of MCP settings from Roo Code to Gemini-Flow.
 */
export declare class MCPSettingsTransfer {
    private settingsManager;
    constructor(settingsManager: MCPSettingsManager);
    /**
     * Reads the MCP settings from the specified Roo Code settings file.
     * @returns {Promise<MCPSettings>} The Roo Code MCP settings.
     */
    private readRooCodeSettings;
    /**
     * Intelligently merges Roo Code MCP settings with existing Gemini-Flow settings.
     * New servers from Roo Code are added. Existing servers are updated if conflicts arise,
     * with a preference for existing Gemini-Flow settings unless explicitly overridden.
     * @returns {Promise<void>}
     */
    transferAndMergeSettings(): Promise<void>;
    /**
     * Validates the transferred settings against the schema and handles conflicts.
     * This method is implicitly called by MCPSettingsManager.writeSettings.
     * Additional conflict resolution logic can be added here if needed beyond schema validation.
     * @param {MCPSettings} settings The settings to validate.
     * @private
     */
    private validateTransferredSettings;
}
//# sourceMappingURL=mcp-settings-transfer.d.ts.map