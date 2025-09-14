import { SQLiteMemoryCore } from '../sqlite-memory-core';
import { MemoryIntelligence } from '../memory-intelligence';
import { ToolExecutor } from '../tool-executor';
import { ToolRegistry } from '../tool-registry';
/**
 * @interface QueenConfig
 * @description Configuration for the Queen Agent.
 */
export interface QueenConfig {
    id: string;
    name: string;
    vertexAiModel: string;
    firestoreCollection: string;
}
/**
 * @interface QueenOperations
 * @description Defines the operations available for the Queen Agent.
 */
export interface QueenOperations {
    makeDecision(context: any): Promise<any>;
    spawnWorker(workerConfig: any): Promise<string>;
    assignTask(workerId: string, task: any): Promise<void>;
    monitorWorkers(): Promise<any>;
    updateGlobalState(state: any): Promise<void>;
    getGlobalState(): Promise<any>;
}
/**
 * @class QueenAgent
 * @description Implements the central coordination and decision-making authority for the Hive-Mind.
 */
export declare class QueenAgent implements QueenOperations {
    private config;
    private logger;
    private dbCore;
    private memoryIntelligence;
    private toolExecutor;
    private toolRegistry;
    constructor(config: QueenConfig, dbCore: SQLiteMemoryCore, memoryIntelligence: MemoryIntelligence, toolExecutor: ToolExecutor, toolRegistry: ToolRegistry);
    /**
     * Makes a strategic decision using Vertex AI (e.g., Gemini Pro).
     * @param {any} context The context for the decision.
     * @returns {Promise<any>} The decision made by the Queen.
     */
    makeDecision(context: any): Promise<any>;
    /**
     * Spawns a new worker agent.
     * @param {any} workerConfig Configuration for the new worker.
     * @returns {Promise<string>} The ID of the spawned worker.
     */
    spawnWorker(workerConfig: any): Promise<string>;
    /**
     * Assigns a task to a specific worker agent.
     * @param {string} workerId The ID of the worker agent.
     * @param {any} task The task to assign.
     * @returns {Promise<void>}
     */
    assignTask(workerId: string, task: any): Promise<void>;
    /**
     * Monitors the performance and status of worker agents.
     * @returns {Promise<any>} Worker monitoring data.
     */
    monitorWorkers(): Promise<any>;
    /**
     * Updates the global state managed in Google Cloud Firestore.
     * @param {any} state The new global state.
     * @returns {Promise<void>}
     */
    updateGlobalState(state: any): Promise<void>;
    /**
     * Retrieves the global state from Google Cloud Firestore.
     * @returns {Promise<any>} The current global state.
     */
    getGlobalState(): Promise<any>;
}
//# sourceMappingURL=queen-agent.d.ts.map