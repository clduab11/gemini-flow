import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import * as path from 'path';
// Define the path to the SQLite database file
const DB_PATH = path.join(process.cwd(), '.hive-mind', 'memory.db');
// --- SQLiteMemoryCore Class ---
export class SQLiteMemoryCore {
    db;
    constructor() { }
    /**
     * Initializes the SQLite database connection and creates tables if they don't exist.
     * @returns {Promise<void>}
     */
    async initialize() {
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
    async createTables() {
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
    async close() {
        await this.db.close();
        console.log('SQLite Memory Core connection closed.');
    }
    // --- Basic CRUD Operations (Examples for Agents and Memories) ---
    // Agents Table
    async insertAgent(agent) {
        const now = Date.now();
        await this.db.run(`INSERT INTO agents (id, name, type, status, capabilities, performance_metrics, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, agent.id, agent.name, agent.type, agent.status, agent.capabilities, agent.performance_metrics, now, now);
    }
    async getAgent(id) {
        return this.db.get('SELECT * FROM agents WHERE id = ?', id);
    }
    async updateAgent(id, updates) {
        const now = Date.now();
        const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = Object.values(updates);
        await this.db.run(`UPDATE agents SET ${fields}, updated_at = ? WHERE id = ?`, ...values, now, id);
    }
    async deleteAgent(id) {
        await this.db.run('DELETE FROM agents WHERE id = ?', id);
    }
    // Memories Table
    async insertMemory(memory) {
        const now = Date.now();
        await this.db.run(`INSERT INTO memories (id, agent_id, key, value, namespace, retrieval_count, last_retrieved, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, memory.id, memory.agent_id, memory.key, memory.value, memory.namespace, memory.retrieval_count, memory.last_retrieved, now, now);
    }
    async getMemory(key, namespace) {
        const memory = await this.db.get('SELECT * FROM memories WHERE key = ? AND namespace = ?', key, namespace);
        if (memory) {
            await this.db.run('UPDATE memories SET retrieval_count = retrieval_count + 1, last_retrieved = ? WHERE id = ?', Date.now(), memory.id);
        }
        return memory;
    }
    async updateMemory(id, updates) {
        const now = Date.now();
        const fields = Object.keys(updates).map(key => `${key} = ?`).join(', ');
        const values = Object.values(updates);
        await this.db.run(`UPDATE memories SET ${fields}, updated_at = ? WHERE id = ?`, ...values, now, id);
    }
    async deleteMemory(id) {
        await this.db.run('DELETE FROM memories WHERE id = ?', id);
    }
    // Generic method for running queries (for more complex operations)
    async runQuery(sql, params = []) {
        return this.db.run(sql, params);
    }
    async getQuery(sql, params = []) {
        return this.db.get(sql, params);
    }
    async allQuery(sql, params = []) {
        return this.db.all(sql, params);
    }
}
//# sourceMappingURL=sqlite-memory-core.js.map