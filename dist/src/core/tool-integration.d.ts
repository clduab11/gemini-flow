import { SQLiteMemoryCore } from './sqlite-memory-core';
import { MemoryIntelligence } from './memory-intelligence';
import { ToolExecutor } from './tool-executor';
import { ToolRegistry } from './tool-registry';
/**
 * @class ToolIntegration
 * @description Connects the tool ecosystem with existing systems like SQLite memory, Google AI services, and agent coordination.
 */
export declare class ToolIntegration {
    private dbCore;
    private memoryIntelligence;
    private toolExecutor;
    private toolRegistry;
    private logger;
    constructor(dbCore: SQLiteMemoryCore, memoryIntelligence: MemoryIntelligence, toolExecutor: ToolExecutor, toolRegistry: ToolRegistry);
    /**
     * Integrates tool state persistence with the SQLite memory system.
     * @param {string} toolName The name of the tool.
     * @param {string} stateKey A key to store the tool's state.
     * @param {any} state The state data to persist.
     * @returns {Promise<void>}
     */
    persistToolState(toolName: string, stateKey: string, state: any): Promise<void>;
    /**
     * Retrieves persisted tool state from the SQLite memory system.
     * @param {string} toolName The name of the tool.
     * @param {string} stateKey The key for the tool's state.
     * @returns {Promise<any | undefined>} The persisted state data.
     */
    retrieveToolState(toolName: string, stateKey: string): Promise<any | undefined>;
    /**
     * Enhances tool capabilities by integrating with Google AI services.
     * @param {string} toolName The name of the tool to enhance.
     * @param {string} aiServiceMethod The method from a Google AI service to use.
     * @param {any[]} args Arguments for the AI service method.
     * @returns {Promise<any>}
     */
    enhanceToolWithAI(toolName: string, aiServiceMethod: string, args: any[]): Promise<any>;
    /**
     * Optimizes MCP protocol communication for tool execution.
     * @param {string} toolName The name of the tool.
     * @param {any} data The data being communicated.
     * @returns {Promise<any>} Optimized communication data.
     */
    optimizeMcpCommunication(toolName: string, data: any): Promise<any>;
    /**
     * Coordinates multiple tools for complex multi-tool workflows.
     * @param {Array<{ toolName: string, methodName: string, args: any[] }>} workflowSteps A sequence of tool calls.
     * @param {string} agentId The ID of the agent orchestrating the workflow.
     * @returns {Promise<any[]>} Results of the workflow steps.
     */
    coordinateMultiToolWorkflow(workflowSteps: Array<{
        toolName: string;
        methodName: string;
        args: any[];
    }>, agentId: string): Promise<any[]>;
    /**
     * Sets up real-time monitoring and alerting for tool usage and performance.
     * @returns {Promise<void>}
     */
    setupRealtimeMonitoringAndAlerting(): Promise<void>;
}
//# sourceMappingURL=tool-integration.d.ts.map