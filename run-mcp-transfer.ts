import { MCPSettingsManager } from './src/core/mcp-settings-manager.ts';
import { MCPSettingsTransfer } from './src/core/mcp-settings-transfer.ts';

async function run() {
  const settingsManager = new MCPSettingsManager();
  const mcpSettingsTransfer = new MCPSettingsTransfer(settingsManager);
  try {
    await mcpSettingsTransfer.transferAndMergeSettings();
    console.log('MCP settings transfer initiated successfully.');
  } catch (error) {
    console.error('Error during MCP settings transfer:', error);
  }
}
run();
