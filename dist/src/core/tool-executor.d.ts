import { ToolDiscoveryEngine } from './tool-discovery';
/**
 * @class ToolExecutor
 * @description Creates a robust tool execution infrastructure with async execution, error handling, and chaining.
 */
export declare class ToolExecutor {
    private toolDiscovery;
    private logger;
    constructor(toolDiscovery: ToolDiscoveryEngine);
    /**
     * Executes a tool asynchronously with timeout management and retry mechanisms.
     * @param {string} toolName The name of the tool to execute.
     * @param {string} methodName The method name to call on the tool instance.
     * @param {any[]} args Arguments to pass to the tool method.
     * @param {object} [options] Execution options.
     * @param {number} [options.timeout=60000] Timeout in milliseconds.
     * @param {number} [options.retries=3] Number of retry attempts.
     * @param {number} [options.backoff=1000] Initial backoff delay in milliseconds.
     * @returns {Promise<any>} The result of the tool execution.
     */
    executeTool(toolName: string, methodName: string, args: any[], options?: {
        timeout?: number;
        retries?: number;
        backoff?: number;
    }): Promise<any>;
    /**
     * Supports tool chaining and workflow orchestration (conceptual at this layer).
     * @param {Array<{ toolName: string, methodName: string, args: any[] }>} chain A sequence of tool calls.
     * @returns {Promise<any[]>} Results of each step in the chain.
     */
    executeToolChain(chain: Array<{
        toolName: string;
        methodName: string;
        args: any[];
    }>): Promise<any[]>;
    /**
     * Manages resources and connection pooling (conceptual).
     * @returns {Promise<void>}
     */
    manageResources(): Promise<void>;
    /**
     * Monitors tool performance and provides optimization insights (conceptual).
     * @returns {Promise<void>}
     */
    monitorPerformance(): Promise<void>;
}
//# sourceMappingURL=tool-executor.d.ts.map