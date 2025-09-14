import { ToolCapability } from '../../types/mcp-config';
import { SQLiteMemoryCore } from './sqlite-memory-core';
/**
 * @interface RegisteredToolMetadata
 * @description Represents metadata for a registered tool.
 */
export interface RegisteredToolMetadata {
    name: string;
    category: string;
    capabilities: ToolCapability[];
    version: string;
    description: string;
    accessControl: 'public' | 'private' | 'restricted';
    usageCount: number;
    lastUsed: number;
    avgExecutionTime: number;
    errorRate: number;
}
/**
 * @class ToolRegistry
 * @description Implements comprehensive tool management, including metadata, versioning, and access control.
 */
export declare class ToolRegistry {
    private dbCore;
    private logger;
    private toolsMetadata;
    constructor(dbCore: SQLiteMemoryCore);
    /**
     * Initializes the tool registry by loading metadata from the database.
     * @returns {Promise<void>}
     */
    initialize(): Promise<void>;
    /**
     * Registers or updates tool metadata in the registry and persistence layer.
     * @param {RegisteredToolMetadata} metadata The metadata for the tool.
     * @returns {Promise<void>}
     */
    registerTool(metadata: RegisteredToolMetadata): Promise<void>;
    /**
     * Retrieves tool metadata by name.
     * @param {string} toolName The name of the tool.
     * @returns {RegisteredToolMetadata | undefined}
     */
    getToolMetadata(toolName: string): RegisteredToolMetadata | undefined;
    /**
     * Lists all registered tool metadata.
     * @returns {RegisteredToolMetadata[]}
     */
    listAllToolMetadata(): RegisteredToolMetadata[];
    /**
     * Updates usage and performance metrics for a tool.
     * @param {string} toolName The name of the tool.
     * @param {number} executionTime The execution time of the last operation.
     * @param {boolean} success Whether the operation was successful.
     * @returns {Promise<void>}
     */
    updateToolMetrics(toolName: string, executionTime: number, success: boolean): Promise<void>;
    /**
     * Checks if a user/agent has access to a specific tool.
     * @param {string} toolName The name of the tool.
     * @param {string} userId The ID of the user or agent.
     * @param {string[]} userRoles Roles of the user/agent.
     * @returns {boolean}
     */
    checkAccess(toolName: string, userId: string, userRoles: string[]): boolean;
    /**
     * Provides recommendations for auto-scaling based on demand patterns (conceptual).
     * @param {string} toolName The name of the tool.
     * @returns {string}
     */
    getAutoScalingRecommendation(toolName: string): string;
}
//# sourceMappingURL=tool-registry.d.ts.map