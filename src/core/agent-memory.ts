import { SQLiteMemoryCore, Agent, Memory, Context, Performance } from './sqlite-memory-core.js';
import { MemoryIntelligence } from './memory-intelligence.js';

/**
 * @class AgentMemory
 * @description Connects agents to the persistent memory system, providing agent-specific and shared memory spaces.
 */
export class AgentMemory {
  private dbCore: SQLiteMemoryCore;
  private memoryIntelligence: MemoryIntelligence;
  private agentId: string;

  constructor(agentId: string, dbCore: SQLiteMemoryCore, memoryIntelligence: MemoryIntelligence) {
    this.agentId = agentId;
    this.dbCore = dbCore;
    this.memoryIntelligence = memoryIntelligence;
  }

  /**
   * Stores an agent-specific memory entry.
   * @param {string} key The key for the memory entry.
   * @param {string} value The value of the memory entry.
   * @param {string} [namespace='agent_private'] The namespace for the memory (e.g., 'agent_private', 'shared').
   * @returns {Promise<void>}
   */
  public async storeMemory(key: string, value: string, namespace: string = 'agent_private'): Promise<void> {
    const id = `${this.agentId}-${namespace}-${key}`;
    const existingMemory = await this.dbCore.getMemory(key, namespace);

    if (existingMemory) {
      await this.dbCore.updateMemory(existingMemory.id, { value, updated_at: Date.now() });
    } else {
      const newMemory: Memory = {
        id,
        agent_id: this.agentId,
        key,
        value,
        namespace,
        retrieval_count: 0,
        last_retrieved: undefined,
        created_at: Date.now(),
        updated_at: Date.now(),
      };
      await this.dbCore.insertMemory(newMemory);
    }
    console.log(`Agent ${this.agentId} stored memory: ${key} in namespace ${namespace}`);
  }

  /**
   * Retrieves an agent-specific or shared memory entry.
   * @param {string} key The key for the memory entry.
   * @param {string} [namespace='agent_private'] The namespace for the memory.
   * @returns {Promise<Memory | undefined>}
   */
  public async retrieveMemory(key: string, namespace: string = 'agent_private'): Promise<Memory | undefined> {
    const memory = await this.dbCore.getMemory(key, namespace);
    if (memory) {
      console.log(`Agent ${this.agentId} retrieved memory: ${key} from namespace ${namespace}`);
    }
    return memory;
  }

  /**
   * Stores context data for the current agent session.
   * @param {string} sessionId The current session ID.
   * @param {string} contextData The context data (JSON string).
   * @param {number} expiresAt Timestamp when the context expires.
   * @returns {Promise<void>}
   */
  public async storeContext(sessionId: string, contextData: string, expiresAt: number): Promise<void> {
    const id = `${this.agentId}-${sessionId}`;
    const existingContext = await this.dbCore.getQuery('SELECT * FROM contexts WHERE id = ?', [id]);

    if (existingContext) {
      await this.dbCore.runQuery('UPDATE contexts SET data = ?, last_accessed = ?, expires_at = ? WHERE id = ?', [contextData, Date.now(), expiresAt, id]);
    } else {
      const newContext: Context = {
        id,
        agent_id: this.agentId,
        session_id: sessionId,
        data: contextData,
        last_accessed: Date.now(),
        expires_at: expiresAt,
      };
      await this.dbCore.runQuery(
        `INSERT INTO contexts (id, agent_id, session_id, data, last_accessed, expires_at)
         VALUES (?, ?, ?, ?, ?, ?)`, 
        newContext.id, newContext.agent_id, newContext.session_id, newContext.data, newContext.last_accessed, newContext.expires_at
      );
    }
    console.log(`Agent ${this.agentId} stored context for session ${sessionId}`);
  }

  /**
   * Retrieves context data for the current agent session.
   * @param {string} sessionId The current session ID.
   * @returns {Promise<Context | undefined>}
   */
  public async retrieveContext(sessionId: string): Promise<Context | undefined> {
    const id = `${this.agentId}-${sessionId}`;
    const context = await this.dbCore.getQuery<Context>('SELECT * FROM contexts WHERE id = ? AND expires_at > ?', [id, Date.now()]);
    if (context) {
      await this.dbCore.runQuery('UPDATE contexts SET last_accessed = ? WHERE id = ?', [Date.now(), id]);
      console.log(`Agent ${this.agentId} retrieved context for session ${sessionId}`);
    }
    return context;
  }

  /**
   * Performs a context-aware search using the MemoryIntelligence layer.
   * @param {string} currentQuery The current query or context from the agent.
   * @param {string[]} tables The tables to search.
   * @param {number} limit The maximum number of results.
   * @returns {Promise<any[]>}
   */
  public async searchContextAware(currentQuery: string, tables: string[], limit: number = 5): Promise<any[]> {
    return this.memoryIntelligence.getContextAwareMemories(this.agentId, 'current_session_placeholder', currentQuery, limit);
  }

  /**
   * Records agent performance metrics.
   * @param {string} metricName The name of the metric.
   * @param {number} metricValue The value of the metric.
   * @param {string} [entityType='agent'] The type of entity the metric belongs to.
   * @param {string} [entityId=this.agentId] The ID of the entity.
   * @param {any} [metadata] Additional metadata for the metric.
   * @returns {Promise<void>}
   */
  public async recordPerformanceMetric(
    metricName: string,
    metricValue: number,
    entityType: string = 'agent',
    entityId: string = this.agentId,
    metadata?: any
  ): Promise<void> {
    const id = `${entityId}-${metricName}-${Date.now()}`;
    const newMetric: Performance = {
      id,
      entity_id: entityId,
      entity_type: entityType,
      metric_name: metricName,
      metric_value: metricValue,
      timestamp: Date.now(),
      metadata: metadata ? JSON.stringify(metadata) : null,
    };
    await this.dbCore.runQuery(
      `INSERT INTO performance (id, entity_id, entity_type, metric_name, metric_value, timestamp, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?)`, 
      newMetric.id, newMetric.entity_id, newMetric.entity_type, newMetric.metric_name, newMetric.metric_value, newMetric.timestamp, newMetric.metadata
    );
    console.log(`Agent ${this.agentId} recorded performance metric: ${metricName}=${metricValue}`);
  }

  /**
   * Retrieves agent-specific performance metrics.
   * @param {string} metricName The name of the metric to retrieve.
   * @param {number} [limit=10] The maximum number of results.
   * @returns {Promise<Performance[]>}
   */
  public async getAgentPerformanceMetrics(metricName: string, limit: number = 10): Promise<Performance[]> {
    return this.dbCore.allQuery<Performance>(
      'SELECT * FROM performance WHERE entity_id = ? AND entity_type = ? AND metric_name = ? ORDER BY timestamp DESC LIMIT ?',
      [this.agentId, 'agent', metricName, limit]
    );
  }

  // Placeholder for memory-based learning and adaptation mechanisms
  public async adaptBasedOnMemory(): Promise<void> {
    console.log(`Agent ${this.agentId} adapting based on memory...`);
    // This would involve:
    // 1. Analyzing past performance metrics and outcomes.
    // 2. Retrieving relevant knowledge and conversation history.
    // 3. Adjusting agent behavior, strategies, or preferences based on insights.
    // For example, if a tool consistently fails, the agent might try an alternative or refine its approach.
  }
}
