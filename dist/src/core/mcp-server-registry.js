/**
 * @class MCPServerRegistry
 * @description Manages a catalog of available MCP servers, their capabilities, and lifecycle.
 */
export class MCPServerRegistry {
    settingsManager;
    registeredServers = new Map();
    constructor(settingsManager) {
        this.settingsManager = settingsManager;
    }
    /**
     * Initializes the registry by loading servers from settings and discovering capabilities.
     * @returns {Promise<void>}
     */
    async initialize() {
        const settings = await this.settingsManager.readSettings();
        for (const serverName in settings.mcpServers) {
            const serverConfig = settings.mcpServers[serverName];
            // For now, capabilities are hardcoded or assumed. In a real scenario, this would involve
            // communicating with the MCP server to discover its capabilities.
            const capabilities = []; // Placeholder
            this.registeredServers.set(serverName, {
                name: serverName,
                command: serverConfig.command,
                args: serverConfig.args,
                capabilities: capabilities,
                status: 'installed', // Assume installed if in settings
                disabled: serverConfig.disabled || false,
            });
        }
        console.log('MCP Server Registry initialized.');
    }
    /**
     * Registers a new MCP server with its capabilities.
     * This typically happens after discovery or manual addition.
     * @param {RegisteredMCPServer} server The server to register.
     * @returns {Promise<void>}
     */
    async registerServer(server) {
        if (this.registeredServers.has(server.name)) {
            throw new Error(`Server "${server.name}" is already registered.`);
        }
        this.registeredServers.set(server.name, server);
        // Also add to settings if not already there
        const currentSettings = await this.settingsManager.readSettings();
        if (!currentSettings.mcpServers[server.name]) {
            await this.settingsManager.addMcpServer(server.name, {
                command: server.command,
                args: server.args,
                disabled: server.disabled,
            });
        }
    }
    /**
     * Retrieves a registered server by its name.
     * @param {string} serverName The name of the server.
     * @returns {RegisteredMCPServer | undefined}
     */
    getServer(serverName) {
        return this.registeredServers.get(serverName);
    }
    /**
     * Lists all registered MCP servers.
     * @returns {RegisteredMCPServer[]}
     */
    listServers() {
        return Array.from(this.registeredServers.values());
    }
    /**
     * Finds servers that provide a specific capability.
     * @param {string} capabilityName The name of the capability to find.
     * @returns {RegisteredMCPServer[]}
     */
    findServersByCapability(capabilityName) {
        return Array.from(this.registeredServers.values()).filter(server => server.capabilities.some(cap => cap.name === capabilityName));
    }
    /**
     * Handles the installation of an MCP server via npx.
     * @param {string} packageName The npm package name of the server.
     * @returns {Promise<void>}
     */
    async installServer(packageName) {
        console.log(`Installing MCP server: ${packageName} via npx...`);
        // In a real scenario, this would execute a shell command like `npx ${packageName} install`
        // For now, it's a placeholder.
        await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate installation time
        console.log(`MCP server ${packageName} installed.`);
        // After installation, you would typically discover its capabilities and register it.
    }
    /**
     * Enables a disabled MCP server.
     * @param {string} serverName The name of the server to enable.
     * @returns {Promise<void>}
     */
    async enableServer(serverName) {
        const server = this.registeredServers.get(serverName);
        if (!server) {
            throw new Error(`Server "${serverName}" not found.`);
        }
        server.disabled = false;
        await this.settingsManager.updateMcpServer(serverName, { disabled: false });
        console.log(`Server "${serverName}" enabled.`);
    }
    /**
     * Disables an MCP server.
     * @param {string} serverName The name of the server to disable.
     * @returns {Promise<void>}
     */
    async disableServer(serverName) {
        const server = this.registeredServers.get(serverName);
        if (!server) {
            throw new Error(`Server "${serverName}" not found.`);
        }
        server.disabled = true;
        await this.settingsManager.updateMcpServer(serverName, { disabled: true });
        console.log(`Server "${serverName}" disabled.`);
    }
    // Placeholder for capability discovery - this would involve communicating with the MCP server
    async discoverCapabilities(serverName) {
        // In a real implementation, this would involve sending a command to the MCP server
        // to query its capabilities. For now, return an empty array.
        return [];
    }
}
//# sourceMappingURL=mcp-server-registry.js.map