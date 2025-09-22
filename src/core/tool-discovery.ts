import * as fs from 'fs/promises';
import * as path from 'path';
import { ToolCapability } from '../../types/mcp-config.js';
import { Logger } from '../../utils/logger.js';

// Define the base directory for tool categories
const TOOL_CATEGORIES_BASE_DIR = path.join(process.cwd(), 'src', 'tools', 'categories');

/**
 * @interface DiscoveredTool
 * @description Represents a tool discovered by the engine.
 */
export interface DiscoveredTool {
  name: string;
  category: string;
  filePath: string;
  capabilities: ToolCapability[];
  instance?: any; // The instantiated tool class
}

/**
 * @class ToolDiscoveryEngine
 * @description Builds an intelligent tool discovery system for automatic registration and capability mapping.
 */
export class ToolDiscoveryEngine {
  private discoveredTools: Map<string, DiscoveredTool> = new Map(); // toolName -> DiscoveredTool
  private toolsByCategory: Map<string, DiscoveredTool[]> = new Map(); // category -> DiscoveredTool[]
  private logger: Logger;

  constructor() {
    this.logger = new Logger('ToolDiscoveryEngine');
  }

  /**
   * Scans the tool categories directory, discovers tools, and registers their capabilities.
   * @returns {Promise<void>}
   */
  public async discoverTools(): Promise<void> {
    this.logger.info('Starting tool discovery...');
    this.discoveredTools.clear();
    this.toolsByCategory.clear();

    try {
      const categories = await fs.readdir(TOOL_CATEGORIES_BASE_DIR, { withFileTypes: true });

      for (const categoryDir of categories) {
        if (categoryDir.isDirectory()) {
          const categoryName = categoryDir.name;
          const categoryPath = path.join(TOOL_CATEGORIES_BASE_DIR, categoryName);
          const toolFiles = await fs.readdir(categoryPath, { withFileTypes: true });

          for (const toolFile of toolFiles) {
            if (toolFile.isFile() && toolFile.name.endsWith('.ts') && !toolFile.name.endsWith('.d.ts')) {
              const toolName = toolFile.name.replace('.ts', '');
              const toolFilePath = path.join(categoryPath, toolFile.name);

              try {
                // Dynamically import the tool module
                // Note: This requires Node.js to support dynamic import of ES modules
                // and for the TypeScript files to be compiled to JS first.
                const module = await import(toolFilePath);
                const ToolClass = module[`${toolName.charAt(0).toUpperCase() + toolName.slice(1)}Tool`];

                if (ToolClass && typeof ToolClass.getCapabilities === 'function') {
                  const capabilities: ToolCapability[] = ToolClass.getCapabilities();
                  const discoveredTool: DiscoveredTool = {
                    name: toolName,
                    category: categoryName,
                    filePath: toolFilePath,
                    capabilities: capabilities,
                  };
                  this.discoveredTools.set(toolName, discoveredTool);

                  if (!this.toolsByCategory.has(categoryName)) {
                    this.toolsByCategory.set(categoryName, []);
                  }
                  this.toolsByCategory.get(categoryName)?.push(discoveredTool);
                  this.logger.debug(`Discovered tool: ${toolName} in category ${categoryName} with ${capabilities.length} capabilities.`);
                } else {
                  this.logger.warn(`Skipping ${toolName}: ToolClass or getCapabilities method not found.`);
                }
              } catch (importError: any) {
                this.logger.error(`Failed to import tool ${toolName} from ${toolFilePath}: ${importError.message}`);
              }
            }
          }
        }
      }
    } catch (readDirError: any) {
      this.logger.error(`Failed to read tool categories directory: ${readDirError.message}`);
    }
    this.logger.info(`Tool discovery complete. Found ${this.discoveredTools.size} tools across ${this.toolsByCategory.size} categories.`);
  }

  /**
   * Retrieves a discovered tool by its name.
   * @param {string} toolName The name of the tool.
   * @returns {DiscoveredTool | undefined}
   */
  public getTool(toolName: string): DiscoveredTool | undefined {
    return this.discoveredTools.get(toolName);
  }

  /**
   * Lists all discovered tools.
   * @returns {DiscoveredTool[]}
   */
  public listAllTools(): DiscoveredTool[] {
    return Array.from(this.discoveredTools.values());
  }

  /**
   * Lists tools by category.
   * @param {string} categoryName The name of the category.
   * @returns {DiscoveredTool[] | undefined}
   */
  public getToolsByCategory(categoryName: string): DiscoveredTool[] | undefined {
    return this.toolsByCategory.get(categoryName);
  }

  /**
   * Selects a tool based on required capabilities and optional criteria.
   * This is a placeholder for intelligent selection and load balancing.
   * @param {string[]} requiredCapabilities Capabilities that the tool must provide.
   * @param {any} [criteria] Optional criteria for selection (e.g., performance, cost).
   * @returns {DiscoveredTool | undefined} The selected tool or undefined if none found.
   */
  public selectTool(requiredCapabilities: string[], criteria?: any): DiscoveredTool | undefined {
    // Simple selection: find the first tool that matches all required capabilities
    for (const tool of this.discoveredTools.values()) {
      const hasAllCapabilities = requiredCapabilities.every(reqCap =>
        tool.capabilities.some(toolCap => toolCap.name === reqCap)
      );
      if (hasAllCapabilities) {
        this.logger.debug(`Selected tool: ${tool.name} based on capabilities: ${requiredCapabilities.join(', ')}`);
        return tool;
      }
    }
    this.logger.warn(`No tool found matching required capabilities: ${requiredCapabilities.join(', ')}`);
    return undefined;
  }

  /**
   * Monitors tool health and provides automatic failover (conceptual).
   * @param {string} toolName The name of the tool to monitor.
   * @returns {Promise<boolean>} True if the tool is healthy, false otherwise.
   */
  public async monitorToolHealth(toolName: string): Promise<boolean> {
    this.logger.debug(`Monitoring health for tool: ${toolName} (simulated)`);
    // In a real scenario, this would involve:
    // - Pinging the tool's underlying service.
    // - Checking its error rates and response times.
    // - Potentially triggering failover to an alternative tool.
    return Math.random() > 0.1; // 90% chance of being healthy
  }
}
