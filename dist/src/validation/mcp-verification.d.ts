import { MCPSettingsManager } from '../core/mcp-settings-manager';
/**
 * @interface McpVerificationConfig
 * @description Configuration for MCP Schema Verification.
 */
export interface McpVerificationConfig {
    expectedMcpServers: string[];
}
/**
 * @interface McpVerificationOperations
 * @description Defines operations for critical verification of MCP settings integration.
 */
export interface McpVerificationOperations {
    verifySettingsFile(): Promise<boolean>;
    verifyMcpServerTransfer(): Promise<boolean>;
    testMcpServerConnectivity(serverName: string): Promise<boolean>;
    verifyPermissions(serverName: string): Promise<boolean>;
    verifyEnvironmentVariables(serverName: string): Promise<boolean>;
}
/**
 * @class McpVerification
 * @description Provides critical verification of MCP settings integration, ensuring successful transfer and functionality.
 */
export declare class McpVerification implements McpVerificationOperations {
    private config;
    private logger;
    private settingsManager;
    constructor(config: McpVerificationConfig, settingsManager: MCPSettingsManager);
    /**
     * Verifies that ~/.gemini/settings.json exists and is properly formatted.
     * @returns {Promise<boolean>} True if the file is valid, false otherwise.
     */
    verifySettingsFile(): Promise<boolean>;
    /**
     * Confirms all expected MCP servers were transferred correctly.
     * @returns {Promise<boolean>} True if all expected servers are present and valid, false otherwise.
     */
    verifyMcpServerTransfer(): Promise<boolean>;
    /**
     * Tests a specific MCP server connection and functionality (conceptual).
     * @param {string} serverName The name of the MCP server to test.
     * @returns {Promise<boolean>} True if the server is connectable and functional, false otherwise.
     */
    testMcpServerConnectivity(serverName: string): Promise<boolean>;
    /**
     * Verifies autoApprove and alwaysAllow permissions for a specific MCP server.
     * @param {string} serverName The name of the MCP server.
     * @returns {Promise<boolean>} True if permissions are correctly configured, false otherwise.
     */
    verifyPermissions(serverName: string): Promise<boolean>;
    /**
     * Verifies environment variables for a specific MCP server.
     * @param {string} serverName The name of the MCP server.
     * @returns {Promise<boolean>} True if environment variables are correctly configured, false otherwise.
     */
    verifyEnvironmentVariables(serverName: string): Promise<boolean>;
}
//# sourceMappingURL=mcp-verification.d.ts.map