import { SQLiteMemoryCore } from '../sqlite-memory-core';
import { MemoryIntelligence } from '../memory-intelligence';
import { ToolExecutor } from '../tool-executor';
import { ToolRegistry } from '../tool-registry';
/**
 * @interface WorkerConfig
 * @description Configuration for a Worker Agent.
 */
export interface WorkerConfig {
    id: string;
    name: string;
    specialization: string;
    vertexAiEndpoint?: string;
}
/**
 * @interface WorkerOperations
 * @description Defines the operations available for a Worker Agent.
 */
export interface WorkerOperations {
    executeTask(task: any): Promise<any>;
    processWithAI(data: any, modelId?: string): Promise<any>;
    sendMessage(topic: string, message: any): Promise<void>;
    collectMetrics(): Promise<any>;
}
/**
 * @class WorkerAgent
 * @description Implements a specialized worker agent within the Hive-Mind swarm.
 */
export declare class WorkerAgent implements WorkerOperations {
    private config;
    private logger;
    private dbCore;
    private memoryIntelligence;
    private toolExecutor;
    private toolRegistry;
    constructor(config: WorkerConfig, dbCore: SQLiteMemoryCore, memoryIntelligence: MemoryIntelligence, toolExecutor: ToolExecutor, toolRegistry: ToolRegistry);
    /**
     * Executes a given task assigned by the Queen.
     * @param {any} task The task to execute.
     * @returns {Promise<any>} The result of the task execution.
     */
    executeTask(task: any): Promise<any>;
    /**
     * Processes data using a Vertex AI model endpoint.
     * @param {any} data The data to process.
     * @param {string} [modelId] Optional: Specific model ID to use. Defaults to worker's configured endpoint.
     * @returns {Promise<any>} The AI processing result.
     */
    processWithAI(data: any, modelId?: string): Promise<any>;
    /**
     * Sends a message to a specified Pub/Sub topic.
     * @param {string} topic The Pub/Sub topic to publish to.
     * @param {any} message The message payload.
     * @returns {Promise<void>}
     */
    sendMessage(topic: string, message: any): Promise<void>;
    /**
     * Collects performance metrics for the worker agent.
     * @returns {Promise<any>} Collected metrics.
     */
    collectMetrics(): Promise<any>;
}
//# sourceMappingURL=worker-swarm.d.ts.map