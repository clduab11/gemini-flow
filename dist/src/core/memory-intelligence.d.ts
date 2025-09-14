import { SQLiteMemoryCore, Memory } from './sqlite-memory-core';
/**
 * @class MemoryIntelligence
 * @description Builds intelligent memory management with semantic search, optimization, and context-aware retrieval.
 */
export declare class MemoryIntelligence {
    private dbCore;
    constructor(dbCore: SQLiteMemoryCore);
    /**
     * Performs a semantic search across specified memory tables.
     * This is a placeholder for actual semantic search implementation, which would involve
     * vector embeddings and similarity comparisons.
     * @param {string} query The search query.
     * @param {string[]} tables The tables to search (e.g., ['knowledge', 'memories', 'conversations']).
     * @param {number} limit The maximum number of results to return.
     * @returns {Promise<any[]>} A list of relevant memory entries.
     */
    semanticSearch(query: string, tables: string[], limit?: number): Promise<any[]>;
    /**
     * Automatically consolidates and optimizes memory entries.
     * This could involve merging similar knowledge, archiving old conversations, etc.
     * @returns {Promise<void>}
     */
    optimizeMemory(): Promise<void>;
    /**
     * Retrieves context-aware information based on current interaction.
     * This would typically use the current conversation, agent state, etc., to narrow down search.
     * @param {string} agentId The ID of the agent.
     * @param {string} sessionId The current session ID.
     * @param {string} currentQuery The current query or context.
     * @param {number} limit The maximum number of results.
     * @returns {Promise<any[]>} A list of contextually relevant memories.
     */
    getContextAwareMemories(agentId: string, sessionId: string, currentQuery: string, limit?: number): Promise<any[]>;
    /**
     * Manages the lifecycle of memory entries (e.g., archival, cleanup).
     * @param {string} memoryId The ID of the memory entry.
     * @param {'archive' | 'delete' | 'update'} action The action to perform.
     * @param {Partial<Memory>} [updates] Optional updates for the memory.
     * @returns {Promise<void>}
     */
    manageMemoryLifecycle(memoryId: string, action: 'archive' | 'delete' | 'update', updates?: Partial<Memory>): Promise<void>;
    /**
     * Analyzes cross-table relationships to provide insights.
     * @returns {Promise<any>} Insights derived from relationships.
     */
    analyzeRelationships(): Promise<any>;
    /**
     * Prioritizes memory retrieval based on performance metrics.
     * This could involve caching frequently accessed memories or pre-loading relevant knowledge.
     * @param {string[]} memoryIds The IDs of memories to prioritize.
     * @returns {Promise<void>}
     */
    prioritizeMemories(memoryIds: string[]): Promise<void>;
}
//# sourceMappingURL=memory-intelligence.d.ts.map