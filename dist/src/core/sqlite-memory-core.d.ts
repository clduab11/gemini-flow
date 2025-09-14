export interface Agent {
    id: string;
    name: string;
    type: string;
    status: 'active' | 'idle' | 'busy' | 'offline';
    capabilities: string;
    performance_metrics: string;
    created_at: number;
    updated_at: number;
}
export interface Conversation {
    id: string;
    agent_id: string;
    user_id: string;
    start_time: number;
    last_activity: number;
    context: string;
    status: 'active' | 'archived' | 'closed';
}
export interface Knowledge {
    id: string;
    agent_id: string;
    title: string;
    content: string;
    semantic_embedding: string;
    tags: string;
    created_at: number;
    updated_at: number;
}
export interface Tool {
    id: string;
    name: string;
    description: string;
    usage_statistics: string;
    performance_data: string;
    optimization_insights: string;
}
export interface Workflow {
    id: string;
    name: string;
    definition: string;
    execution_history: string;
    success_metrics: string;
    created_at: number;
    updated_at: number;
}
export interface Context {
    id: string;
    agent_id: string;
    session_id: string;
    data: string;
    last_accessed: number;
    expires_at: number;
}
export interface Memory {
    id: string;
    agent_id: string;
    key: string;
    value: string;
    namespace: string;
    retrieval_count: number;
    last_retrieved: number;
    created_at: number;
    updated_at: number;
}
export interface Performance {
    id: string;
    entity_id: string;
    entity_type: string;
    metric_name: string;
    metric_value: number;
    timestamp: number;
    metadata: string;
}
export interface Relationship {
    id: string;
    source_id: string;
    target_id: string;
    type: string;
    metadata: string;
    created_at: number;
}
export interface Event {
    id: string;
    type: string;
    source: string;
    timestamp: number;
    payload: string;
    correlation_id: string;
}
export interface Preference {
    id: string;
    user_id: string;
    agent_id: string;
    key: string;
    value: string;
    last_updated: number;
}
export interface Cache {
    id: string;
    key: string;
    value: string;
    expires_at: number;
    created_at: number;
    hits: number;
    misses: number;
}
export declare class SQLiteMemoryCore {
    private db;
    constructor();
    /**
     * Initializes the SQLite database connection and creates tables if they don't exist.
     * @returns {Promise<void>}
     */
    initialize(): Promise<void>;
    /**
     * Creates all necessary tables in the database.
     * @private
     * @returns {Promise<void>}
     */
    private createTables;
    /**
     * Closes the database connection.
     * @returns {Promise<void>}
     */
    close(): Promise<void>;
    insertAgent(agent: Agent): Promise<void>;
    getAgent(id: string): Promise<Agent | undefined>;
    updateAgent(id: string, updates: Partial<Agent>): Promise<void>;
    deleteAgent(id: string): Promise<void>;
    insertMemory(memory: Memory): Promise<void>;
    getMemory(key: string, namespace: string): Promise<Memory | undefined>;
    updateMemory(id: string, updates: Partial<Memory>): Promise<void>;
    deleteMemory(id: string): Promise<void>;
    runQuery(sql: string, params?: any[]): Promise<any>;
    getQuery(sql: string, params?: any[]): Promise<any>;
    allQuery(sql: string, params?: any[]): Promise<any[]>;
}
//# sourceMappingURL=sqlite-memory-core.d.ts.map