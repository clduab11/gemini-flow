import { SQLiteMemoryCore, Memory, Context, Performance } from './sqlite-memory-core';
import { MemoryIntelligence } from './memory-intelligence';
/**
 * @class AgentMemory
 * @description Connects agents to the persistent memory system, providing agent-specific and shared memory spaces.
 */
export declare class AgentMemory {
    private dbCore;
    private memoryIntelligence;
    private agentId;
    constructor(agentId: string, dbCore: SQLiteMemoryCore, memoryIntelligence: MemoryIntelligence);
    /**
     * Stores an agent-specific memory entry.
     * @param {string} key The key for the memory entry.
     * @param {string} value The value of the memory entry.
     * @param {string} [namespace='agent_private'] The namespace for the memory (e.g., 'agent_private', 'shared').
     * @returns {Promise<void>}
     */
    storeMemory(key: string, value: string, namespace?: string): Promise<void>;
    /**
     * Retrieves an agent-specific or shared memory entry.
     * @param {string} key The key for the memory entry.
     * @param {string} [namespace='agent_private'] The namespace for the memory.
     * @returns {Promise<Memory | undefined>}
     */
    retrieveMemory(key: string, namespace?: string): Promise<Memory | undefined>;
    /**
     * Stores context data for the current agent session.
     * @param {string} sessionId The current session ID.
     * @param {string} contextData The context data (JSON string).
     * @param {number} expiresAt Timestamp when the context expires.
     * @returns {Promise<void>}
     */
    storeContext(sessionId: string, contextData: string, expiresAt: number): Promise<void>;
    /**
     * Retrieves context data for the current agent session.
     * @param {string} sessionId The current session ID.
     * @returns {Promise<Context | undefined>}
     */
    retrieveContext(sessionId: string): Promise<Context | undefined>;
    /**
     * Performs a context-aware search using the MemoryIntelligence layer.
     * @param {string} currentQuery The current query or context from the agent.
     * @param {string[]} tables The tables to search.
     * @param {number} limit The maximum number of results.
     * @returns {Promise<any[]>}
     */
    searchContextAware(currentQuery: string, tables: string[], limit?: number): Promise<any[]>;
    /**
     * Records agent performance metrics.
     * @param {string} metricName The name of the metric.
     * @param {number} metricValue The value of the metric.
     * @param {string} [entityType='agent'] The type of entity the metric belongs to.
     * @param {string} [entityId=this.agentId] The ID of the entity.
     * @param {any} [metadata] Additional metadata for the metric.
     * @returns {Promise<void>}
     */
    recordPerformanceMetric(metricName: string, metricValue: number, entityType?: string, entityId?: string, metadata?: any): Promise<void>;
    /**
     * Retrieves agent-specific performance metrics.
     * @param {string} metricName The name of the metric to retrieve.
     * @param {number} [limit=10] The maximum number of results.
     * @returns {Promise<Performance[]>}
     */
    getAgentPerformanceMetrics(metricName: string, limit?: number): Promise<Performance[]>;
    adaptBasedOnMemory(): Promise<void>;
}
//# sourceMappingURL=agent-memory.d.ts.map