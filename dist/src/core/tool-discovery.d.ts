import { ToolCapability } from '../../types/mcp-config';
/**
 * @interface DiscoveredTool
 * @description Represents a tool discovered by the engine.
 */
export interface DiscoveredTool {
    name: string;
    category: string;
    filePath: string;
    capabilities: ToolCapability[];
    instance?: any;
}
/**
 * @class ToolDiscoveryEngine
 * @description Builds an intelligent tool discovery system for automatic registration and capability mapping.
 */
export declare class ToolDiscoveryEngine {
    private discoveredTools;
    private toolsByCategory;
    private logger;
    constructor();
    /**
     * Scans the tool categories directory, discovers tools, and registers their capabilities.
     * @returns {Promise<void>}
     */
    discoverTools(): Promise<void>;
    /**
     * Retrieves a discovered tool by its name.
     * @param {string} toolName The name of the tool.
     * @returns {DiscoveredTool | undefined}
     */
    getTool(toolName: string): DiscoveredTool | undefined;
    /**
     * Lists all discovered tools.
     * @returns {DiscoveredTool[]}
     */
    listAllTools(): DiscoveredTool[];
    /**
     * Lists tools by category.
     * @param {string} categoryName The name of the category.
     * @returns {DiscoveredTool[] | undefined}
     */
    getToolsByCategory(categoryName: string): DiscoveredTool[] | undefined;
    /**
     * Selects a tool based on required capabilities and optional criteria.
     * This is a placeholder for intelligent selection and load balancing.
     * @param {string[]} requiredCapabilities Capabilities that the tool must provide.
     * @param {any} [criteria] Optional criteria for selection (e.g., performance, cost).
     * @returns {DiscoveredTool | undefined} The selected tool or undefined if none found.
     */
    selectTool(requiredCapabilities: string[], criteria?: any): DiscoveredTool | undefined;
    /**
     * Monitors tool health and provides automatic failover (conceptual).
     * @param {string} toolName The name of the tool to monitor.
     * @returns {Promise<boolean>} True if the tool is healthy, false otherwise.
     */
    monitorToolHealth(toolName: string): Promise<boolean>;
}
//# sourceMappingURL=tool-discovery.d.ts.map