import { MCPSettingsManager } from './mcp-settings-manager';
import { ToolCapability } from '../../types/mcp-config';
/**
 * @interface RegisteredMCPServer
 * @description Represents a registered MCP server with its capabilities and status.
 */
export interface RegisteredMCPServer {
    name: string;
    command: string;
    args: string[];
    capabilities: ToolCapability[];
    status: 'installed' | 'not_installed' | 'running' | 'stopped' | 'error';
    disabled: boolean;
}
/**
 * @class MCPServerRegistry
 * @description Manages a catalog of available MCP servers, their capabilities, and lifecycle.
 */
export declare class MCPServerRegistry {
    private settingsManager;
    private registeredServers;
    constructor(settingsManager: MCPSettingsManager);
    /**
     * Initializes the registry by loading servers from settings and discovering capabilities.
     * @returns {Promise<void>}
     */
    initialize(): Promise<void>;
    /**
     * Registers a new MCP server with its capabilities.
     * This typically happens after discovery or manual addition.
     * @param {RegisteredMCPServer} server The server to register.
     * @returns {Promise<void>}
     */
    registerServer(server: RegisteredMCPServer): Promise<void>;
    /**
     * Retrieves a registered server by its name.
     * @param {string} serverName The name of the server.
     * @returns {RegisteredMCPServer | undefined}
     */
    getServer(serverName: string): RegisteredMCPServer | undefined;
    /**
     * Lists all registered MCP servers.
     * @returns {RegisteredMCPServer[]}
     */
    listServers(): RegisteredMCPServer[];
    /**
     * Finds servers that provide a specific capability.
     * @param {string} capabilityName The name of the capability to find.
     * @returns {RegisteredMCPServer[]}
     */
    findServersByCapability(capabilityName: string): RegisteredMCPServer[];
    /**
     * Handles the installation of an MCP server via npx.
     * @param {string} packageName The npm package name of the server.
     * @returns {Promise<void>}
     */
    installServer(packageName: string): Promise<void>;
    /**
     * Enables a disabled MCP server.
     * @param {string} serverName The name of the server to enable.
     * @returns {Promise<void>}
     */
    enableServer(serverName: string): Promise<void>;
    /**
     * Disables an MCP server.
     * @param {string} serverName The name of the server to disable.
     * @returns {Promise<void>}
     */
    disableServer(serverName: string): Promise<void>;
    private discoverCapabilities;
}
//# sourceMappingURL=mcp-server-registry.d.ts.map