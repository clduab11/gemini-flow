import { MCPSettingsManager } from '../../core/mcp-settings-manager.js';
import { MCPServerRegistry } from '../../core/mcp-server-registry.js';
export function registerMcpCommands(program) {
    const mcpCommand = program.command('mcp').description('Manage MCP servers and tools');
    mcpCommand
        .command('list')
        .description('Show configured MCP servers and their capabilities')
        .action(async () => {
        const settingsManager = new MCPSettingsManager();
        const serverRegistry = new MCPServerRegistry(settingsManager);
        await serverRegistry.initialize();
        const servers = serverRegistry.listServers();
        if (servers.length === 0) {
            console.log('No MCP servers configured.');
            return;
        }
        console.log('Configured MCP Servers:');
        servers.forEach(server => {
            console.log(`  Name: ${server.name}`);
            console.log(`  Command: ${server.command} ${server.args.join(' ')}`);
            console.log(`  Status: ${server.status}`);
            console.log(`  Disabled: ${server.disabled}`);
            if (server.capabilities.length > 0) {
                console.log('  Capabilities:');
                server.capabilities.forEach(cap => console.log(`    - ${cap.name}: ${cap.description}`));
            }
            else {
                console.log('  Capabilities: None discovered yet.');
            }
            console.log('');
        });
    });
    mcpCommand
        .command('add <serverName> <command> [args...]')
        .description('Add a new MCP server dynamically')
        .option('-d, --disabled', 'Disable the server on addition', false)
        .action(async (serverName, command, args, options) => {
        const settingsManager = new MCPSettingsManager();
        try {
            await settingsManager.addMcpServer(serverName, {
                command: command,
                args: args,
                disabled: options.disabled,
            });
            console.log(`MCP server "${serverName}" added successfully.`);
        }
        catch (error) {
            console.error(`Failed to add MCP server "${serverName}": ${error.message}`);
        }
    });
    mcpCommand
        .command('status')
        .description('Display MCP server health and connectivity')
        .action(async () => {
        const settingsManager = new MCPSettingsManager();
        const serverRegistry = new MCPServerRegistry(settingsManager);
        await serverRegistry.initialize();
        const servers = serverRegistry.listServers();
        if (servers.length === 0) {
            console.log('No MCP servers configured to check status.');
            return;
        }
        console.log('MCP Server Status:');
        for (const server of servers) {
            console.log(`  Name: ${server.name}`);
            console.log(`  Status: ${server.status}`);
            console.log(`  Disabled: ${server.disabled}`);
            // In a real scenario, this would involve pinging the server or checking its process status.
            // For now, we rely on the status from the registry.
            console.log('');
        }
    });
    mcpCommand
        .command('discover')
        .description('Find and suggest relevant MCP servers')
        .action(async () => {
        console.log('Discovering and suggesting relevant MCP servers...');
        // This is a placeholder for a more advanced discovery mechanism.
        // In a real implementation, this would involve:
        // 1. Searching for known MCP server packages (e.g., via npm registry).
        // 2. Analyzing local project dependencies or user needs.
        // 3. Suggesting servers based on missing capabilities.
        console.log('No new MCP servers suggested at this time. (Discovery feature is under development)');
    });
}
