import { Logger } from '../../utils/logger';
/**
 * @class ToolRegistry
 * @description Implements comprehensive tool management, including metadata, versioning, and access control.
 */
export class ToolRegistry {
    dbCore;
    logger;
    toolsMetadata = new Map(); // toolName -> metadata
    constructor(dbCore) {
        this.dbCore = dbCore;
        this.logger = new Logger('ToolRegistry');
    }
    /**
     * Initializes the tool registry by loading metadata from the database.
     * @returns {Promise<void>}
     */
    async initialize() {
        this.logger.info('Initializing Tool Registry...');
        // In a real scenario, tool metadata would be persisted in the database.
        // For now, we'll simulate loading from a predefined list or from discovery.
        // This method would typically load from a 'tools' table in SQLiteMemoryCore.
        const toolsFromDb = await this.dbCore.allQuery('SELECT * FROM tools');
        toolsFromDb.forEach((tool) => {
            this.toolsMetadata.set(tool.name, {
                name: tool.name,
                category: tool.category || 'unknown',
                capabilities: JSON.parse(tool.capabilities || '[]'),
                version: tool.version || '1.0.0',
                description: tool.description || '',
                accessControl: tool.accessControl || 'public',
                usageCount: tool.usageCount || 0,
                lastUsed: tool.lastUsed || 0,
                avgExecutionTime: tool.avgExecutionTime || 0,
                errorRate: tool.errorRate || 0,
            });
        });
        this.logger.info(`Tool Registry initialized with ${this.toolsMetadata.size} tools.`);
    }
    /**
     * Registers or updates tool metadata in the registry and persistence layer.
     * @param {RegisteredToolMetadata} metadata The metadata for the tool.
     * @returns {Promise<void>}
     */
    async registerTool(metadata) {
        this.logger.info(`Registering tool: ${metadata.name}`);
        this.toolsMetadata.set(metadata.name, metadata);
        // Persist to database
        const existingTool = await this.dbCore.getQuery('SELECT * FROM tools WHERE id = ?', [metadata.name]); // Assuming name is ID for simplicity
        if (existingTool) {
            await this.dbCore.runQuery(`UPDATE tools SET category = ?, capabilities = ?, version = ?, description = ?, accessControl = ?, usageCount = ?, lastUsed = ?, avgExecutionTime = ?, errorRate = ? WHERE id = ?`, metadata.category, JSON.stringify(metadata.capabilities), metadata.version, metadata.description, metadata.accessControl, metadata.usageCount, metadata.lastUsed, metadata.avgExecutionTime, metadata.errorRate, metadata.name);
        }
        else {
            await this.dbCore.runQuery(`INSERT INTO tools (id, name, category, capabilities, version, description, accessControl, usageCount, lastUsed, avgExecutionTime, errorRate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, metadata.name, metadata.name, metadata.category, JSON.stringify(metadata.capabilities), metadata.version, metadata.description, metadata.accessControl, metadata.usageCount, metadata.lastUsed, metadata.avgExecutionTime, metadata.errorRate);
        }
    }
    /**
     * Retrieves tool metadata by name.
     * @param {string} toolName The name of the tool.
     * @returns {RegisteredToolMetadata | undefined}
     */
    getToolMetadata(toolName) {
        return this.toolsMetadata.get(toolName);
    }
    /**
     * Lists all registered tool metadata.
     * @returns {RegisteredToolMetadata[]}
     */
    listAllToolMetadata() {
        return Array.from(this.toolsMetadata.values());
    }
    /**
     * Updates usage and performance metrics for a tool.
     * @param {string} toolName The name of the tool.
     * @param {number} executionTime The execution time of the last operation.
     * @param {boolean} success Whether the operation was successful.
     * @returns {Promise<void>}
     */
    async updateToolMetrics(toolName, executionTime, success) {
        const metadata = this.toolsMetadata.get(toolName);
        if (metadata) {
            metadata.usageCount++;
            metadata.lastUsed = Date.now();
            metadata.avgExecutionTime = (metadata.avgExecutionTime * (metadata.usageCount - 1) + executionTime) / metadata.usageCount;
            if (!success) {
                metadata.errorRate = (metadata.errorRate * (metadata.usageCount - 1) + 1) / metadata.usageCount; // Simplified error rate
            }
            // Persist updated metrics to database
            await this.dbCore.runQuery(`UPDATE tools SET usageCount = ?, lastUsed = ?, avgExecutionTime = ?, errorRate = ? WHERE id = ?`, metadata.usageCount, metadata.lastUsed, metadata.avgExecutionTime, metadata.errorRate, metadata.name);
        }
    }
    /**
     * Checks if a user/agent has access to a specific tool.
     * @param {string} toolName The name of the tool.
     * @param {string} userId The ID of the user or agent.
     * @param {string[]} userRoles Roles of the user/agent.
     * @returns {boolean}
     */
    checkAccess(toolName, userId, userRoles) {
        const metadata = this.toolsMetadata.get(toolName);
        if (!metadata) {
            return false; // Tool not found
        }
        switch (metadata.accessControl) {
            case 'public':
                return true;
            case 'private':
                // Only specific users/agents can access (conceptual)
                return userRoles.includes('admin') || userId === 'tool_owner_id'; // Placeholder
            case 'restricted':
                // Access based on specific roles
                return userRoles.includes('developer') || userRoles.includes('admin'); // Placeholder
            default:
                return false;
        }
    }
    /**
     * Provides recommendations for auto-scaling based on demand patterns (conceptual).
     * @param {string} toolName The name of the tool.
     * @returns {string}
     */
    getAutoScalingRecommendation(toolName) {
        const metadata = this.toolsMetadata.get(toolName);
        if (!metadata) {
            return 'Tool not found.';
        }
        if (metadata.usageCount > 1000 && metadata.avgExecutionTime > 500) {
            return `Tool ${toolName} is experiencing high demand and latency. Consider scaling up its underlying service.`;
        }
        else if (metadata.errorRate > 0.05) {
            return `Tool ${toolName} has a high error rate. Investigate underlying service health.`;
        }
        return `Tool ${toolName} is performing normally.`;
    }
}
//# sourceMappingURL=tool-registry.js.map