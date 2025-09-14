import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import * as path from 'path';

// Define the path to the SQLite database file
const DB_PATH = path.join(process.cwd(), '.hive-mind', 'memory.db');

// --- TypeScript Interfaces for the 12 Tables ---

export interface Agent {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'idle' | 'busy' | 'offline';
  capabilities: string; // JSON string of capabilities
  performance_metrics: string; // JSON string of metrics
  created_at: number;
  updated_at: number;
}

export interface Conversation {
  id: string;
  agent_id: string;
  user_id: string;
  start_time: number;
  last_activity: number;
  context: string; // JSON string of conversation context
  status: 'active' | 'archived' | 'closed';
}

export interface Knowledge {
  id: string;
  agent_id: string;
  title: string;
  content: string; // The knowledge content itself
  semantic_embedding: string; // JSON string of vector embedding
  tags: string; // JSON string of tags
  created_at: number;
  updated_at: number;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  usage_statistics: string; // JSON string of usage data
  performance_data: string; // JSON string of performance data
  optimization_insights: string; // JSON string of insights
}

export interface Workflow {
  id: string;
  name: string;
  definition: string; // JSON string of workflow definition
  execution_history: string; // JSON string of execution logs
  success_metrics: string; // JSON string of metrics
  created_at: number;
  updated_at: number;
}

export interface Context {
  id: string;
  agent_id: string;
  session_id: string;
  data: string; // JSON string of context data
  last_accessed: number;
  expires_at: number;
}

export interface Memory {
  id: string;
  agent_id: string;
  key: string;
  value: string; // The stored memory value
  namespace: string;
  retrieval_count: number;
  last_retrieved: number;
  created_at: number;
  updated_at: number;
}

export interface Performance {
  id: string;
  entity_id: string;
  entity_type: string; // e.g., 'agent', 'tool', 'workflow'
  metric_name: string;
  metric_value: number;
  timestamp: number;
  metadata: string; // JSON string of additional metadata
}

export interface Relationship {
  id: string;
  source_id: string;
  target_id: string;
  type: string; // e.g., 'depends_on', 'related_to', 'parent_of'
  metadata: string; // JSON string of relationship properties
  created_at: number;
}

export interface Event {
  id: string;
  type: string;
  source: string;
  timestamp: number;
  payload: string; // JSON string of event data
  correlation_id: string;
}

export interface Preference {
  id: string;
  user_id: string;
  agent_id: string;
  key: string;
  value: string; // JSON string of preference value
  last_updated: number;
}

export interface Cache {
  id: string;
  key: string;
  value: string; // Cached data
  expires_at: number;
  created_at: number;
  hits: number;
  misses: number;
}

// --- SQLiteMemoryCore Class ---

export class SQLiteMemoryCore {
  private db!: Database;

  constructor() {}

  /**
   * Initializes the SQLite database connection and creates tables if they don't exist.
   * @returns {Promise<void>}
   */
  public async initialize(): Promise<void> {
    // Ensure the directory exists
    const dbDir = path.dirname(DB_PATH);
    await fs.mkdir(dbDir, { recursive: true });

    this.db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database,
    });

    // Enable WAL mode for better concurrency and performance
    await this.db.run('PRAGMA journal_mode = WAL;');
    // Set cache size
    await this.db.run('PRAGMA cache_size = 32768;'); // 32MB cache
    // Set synchronous to NORMAL for a good balance of durability and performance
    await this.db.run('PRAGMA synchronous = NORMAL;');

    await this.createTables();
    console.log('SQLite Memory Core initialized and tables created/verified.');
  }

  /**
   * Creates all necessary tables in the database.
   * @private
   * @returns {Promise<void>}
   */
  private async createTables(): Promise<void> {
    await this.db.exec(`
      CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        capabilities TEXT, -- JSON
        performance_metrics TEXT, -- JSON
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        start_time INTEGER NOT NULL,
        last_activity INTEGER NOT NULL,
        context TEXT, -- JSON
        status TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS knowledge (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        semantic_embedding TEXT, -- JSON
        tags TEXT, -- JSON
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS tools (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        usage_statistics TEXT, -- JSON
        performance_data TEXT, -- JSON
        optimization_insights TEXT -- JSON
      );

      CREATE TABLE IF NOT EXISTS workflows (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        definition TEXT, -- JSON
        execution_history TEXT, -- JSON
        success_metrics TEXT, -- JSON
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS contexts (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        session_id TEXT NOT NULL,
        data TEXT, -- JSON
        last_accessed INTEGER NOT NULL,
        expires_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        agent_id TEXT NOT NULL,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        namespace TEXT NOT NULL,
        retrieval_count INTEGER NOT NULL DEFAULT 0,
        last_retrieved INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS performance (
        id TEXT PRIMARY KEY,
        entity_id TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        metric_name TEXT NOT NULL,
        metric_value REAL NOT NULL,
        timestamp INTEGER NOT NULL,
        metadata TEXT -- JSON
      );

      CREATE TABLE IF NOT EXISTS relationships (
        id TEXT PRIMARY KEY,
        source_id TEXT NOT NULL,
        target_id TEXT NOT NULL,
        type TEXT NOT NULL,
        metadata TEXT, -- JSON
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        source TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        payload TEXT, -- JSON
        correlation_id TEXT
      );

      CREATE TABLE IF NOT EXISTS preferences (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        agent_id TEXT NOT NULL,
        key TEXT NOT NULL,
        value TEXT, -- JSON
        last_updated INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS cache (
        id TEXT PRIMARY KEY,
        key TEXT NOT NULL UNIQUE,
        value TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at INTEGER NOT NULL,
        hits INTEGER NOT NULL DEFAULT 0,
        misses INTEGER NOT NULL DEFAULT 0
      );
    `);
  }

  /**
   * Closes the database connection.
   * @returns {Promise<void>}
   */
  public async close(): Promise<void> {
    await this.db.close();
    console.log('SQLite Memory Core connection closed.');
  }

  // --- Basic CRUD Operations (Examples for Agents and Memories) ---

  // Agents Table
  public async insertAgent(agent: Agent): Promise<void> {
    const now = Date.now();
    await this.db.run(
      `INSERT INTO agents (id, name, type, status, capabilities, performance_metrics, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
      agent.id, agent.name, agent.type, agent.status, agent.capabilities, agent.performance_metrics, now, now
    );
  }

  public async getAgent(id: string): Promise<Agent | undefined> {
    return this.db.get<Agent>('SELECT * FROM agents WHERE id = ?', id);
  }

  public async updateAgent(id: string, updates: Partial<Agent>): Promise<void> {
    const now = Date.now();
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    await this.db.run(
      `UPDATE agents SET ${fields}, updated_at = ? WHERE id = ?`, 
      ...values, now, id
    );
  }

  public async deleteAgent(id: string): Promise<void> {
    await this.db.run('DELETE FROM agents WHERE id = ?', id);
  }

  // Memories Table
  public async insertMemory(memory: Memory): Promise<void> {
    const now = Date.now();
    await this.db.run(
      `INSERT INTO memories (id, agent_id, key, value, namespace, retrieval_count, last_retrieved, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
      memory.id, memory.agent_id, memory.key, memory.value, memory.namespace, memory.retrieval_count, memory.last_retrieved, now, now
    );
  }

  public async getMemory(key: string, namespace: string): Promise<Memory | undefined> {
    const memory = await this.db.get<Memory>('SELECT * FROM memories WHERE key = ? AND namespace = ?', key, namespace);
    if (memory) {
      await this.db.run('UPDATE memories SET retrieval_count = retrieval_count + 1, last_retrieved = ? WHERE id = ?', Date.now(), memory.id);
    }
    return memory;
  }

  public async updateMemory(id: string, updates: Partial<Memory>): Promise<void> {
    const now = Date.now();
    const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    await this.db.run(
      `UPDATE memories SET ${fields}, updated_at = ? WHERE id = ?`, 
      ...values, now, id
    );
  }

  public async deleteMemory(id: string): Promise<void> {
    await this.db.run('DELETE FROM memories WHERE id = ?', id);
  }

  // Generic method for running queries (for more complex operations)
  public async runQuery(sql: string, params: any[] = []): Promise<any> {
    return this.db.run(sql, params);
  }

  public async getQuery(sql: string, params: any[] = []): Promise<any> {
    return this.db.get(sql, params);
  }

  public async allQuery(sql: string, params: any[] = []): Promise<any[]> {
    return this.db.all(sql, params);
  }
}
