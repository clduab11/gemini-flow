/**
 * MCP Tools Usage Examples
 * Demonstrates type-safe usage of Claude Flow and RUV Swarm MCP tools
 */
import type { MCPToolName } from "../types/mcp-tools.js";
export declare class MCPToolsExamples {
    private adapter;
    constructor(apiKey: string);
    /**
     * Example: Initialize a swarm with type safety
     */
    initializeSwarm(): Promise<void>;
    /**
     * Example: Spawn agents with different types
     */
    spawnAgents(): Promise<void>;
    /**
     * Example: Orchestrate complex tasks
     */
    orchestrateTask(): Promise<void>;
    /**
     * Example: Memory management with type safety
     */
    manageMemory(): Promise<void>;
    /**
     * Example: Neural pattern training
     */
    trainNeuralPatterns(): Promise<void>;
    /**
     * Example: GitHub integration
     */
    manageGitHubRepository(): Promise<void>;
    /**
     * Example: RUV Swarm tools usage
     */
    useRuvSwarmTools(): Promise<void>;
    /**
     * Example: Performance monitoring and optimization
     */
    monitorPerformance(): Promise<void>;
    /**
     * Example: Comprehensive workflow automation
     */
    automateWorkflow(): Promise<void>;
    /**
     * Utility method to check available MCP tools
     */
    getAvailableTools(): MCPToolName[];
    /**
     * Type guard example
     */
    processToolCall(toolName: string, params: any): void;
}
//# sourceMappingURL=mcp-tools-usage.d.ts.map