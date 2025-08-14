/**
 * SQLite Memory Manager with Fallback Support
 * 
 * Implements 12 specialized tables for persistent memory coordination
 * across agent swarms with optimized performance and cross-platform compatibility
 * 
 * Fallback hierarchy:
 * 1. better-sqlite3 (performance optimized)
 * 2. sqlite3 (Node.js compatible)
 * 3. sql.js (WASM cross-platform)
 */

import { Logger } from '../utils/logger.js';
import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs/promises';
import { 
  SQLiteDatabase, 
  SQLiteImplementation, 
  createSQLiteDatabase, 
  detectSQLiteImplementations 
} from './sqlite-adapter.js';

export interface MemoryEntry {
  id?: number;
  key: string;
  value: any;
  namespace: string;
  metadata?: any;
  ttl?: number;
  created_at?: number;
  updated_at?: number;
  access_count?: number;
}

export class SQLiteMemoryManager extends EventEmitter {
  private db: SQLiteDatabase;
  private logger: Logger;
  private cleanupInterval?: ReturnType<typeof setInterval>;
  private implementation: SQLiteImplementation = 'sql.js';
  
  private constructor(db: SQLiteDatabase, implementation: SQLiteImplementation) {
    super();
    this.logger = new Logger('SQLiteMemory');
    this.db = db;
    this.implementation = implementation;
    
    this.logger.info(`Using SQLite implementation: ${this.implementation}`);
    
    // Configure database optimization
    try {
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('synchronous = NORMAL');
      this.db.pragma('cache_size = 10000');
      this.db.pragma('temp_store = memory');
    } catch (error) {
      // Some implementations may not support all pragmas
      this.logger.warn('Some pragma optimizations not supported:', error);
    }
    
    this.initializeTables();
    this.startCleanupTask();
  }
  
  /**
   * Create a new SQLiteMemoryManager instance with fallback support
   */
  static async create(dbPath: string = '.swarm/memory.db', preferredImpl?: SQLiteImplementation): Promise<SQLiteMemoryManager> {
    const logger = new Logger('SQLiteMemory');
    try {
      // Ensure directory exists
      const dir = path.dirname(dbPath);
      await fs.mkdir(dir, { recursive: true }).catch(() => {});
      
      // Detect available implementations
      const detection = await detectSQLiteImplementations();
      logger.info('SQLite implementations detected:', {
        available: detection.available,
        recommended: detection.recommended,
        errors: Object.keys(detection.errors)
      });
      
      // Create database with fallback
      const db = await createSQLiteDatabase(dbPath, preferredImpl);
      const implementation = db.name as SQLiteImplementation;
      
      return new SQLiteMemoryManager(db, implementation);
      
    } catch (error) {
      logger.error('Failed to initialize SQLite database:', error);
      throw new Error(`SQLite initialization failed: ${error}`);
    }
  }

  /**
   * Initialize all 12 specialized tables
   */
  private initializeTables() {
    // 1. Agents table - Agent state and configuration
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS agents (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        status TEXT DEFAULT 'inactive',
        capabilities TEXT,
        configuration TEXT,
        metrics TEXT,
        last_active INTEGER,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      );
      CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
      CREATE INDEX IF NOT EXISTS idx_agents_type ON agents(type);
    `);

    // 2. Swarms table - Swarm coordination and topology
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS swarms (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        topology TEXT NOT NULL,
        queen_id TEXT,
        worker_count INTEGER DEFAULT 0,
        status TEXT DEFAULT 'initializing',
        configuration TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      );
      CREATE INDEX IF NOT EXISTS idx_swarms_status ON swarms(status);
    `);

    // 3. Tasks table - Task orchestration and tracking
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        swarm_id TEXT,
        description TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        priority INTEGER DEFAULT 5,
        assignee_id TEXT,
        dependencies TEXT,
        result TEXT,
        error TEXT,
        started_at INTEGER,
        completed_at INTEGER,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        FOREIGN KEY (swarm_id) REFERENCES swarms(id)
      );
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
      CREATE INDEX IF NOT EXISTS idx_tasks_swarm ON tasks(swarm_id);
    `);

    // 4. Memory store table - Key-value persistent storage
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS memory_store (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        namespace TEXT DEFAULT 'default',
        metadata TEXT,
        ttl INTEGER,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now')),
        access_count INTEGER DEFAULT 0,
        UNIQUE(key, namespace)
      );
      CREATE INDEX IF NOT EXISTS idx_memory_key ON memory_store(key);
      CREATE INDEX IF NOT EXISTS idx_memory_namespace ON memory_store(namespace);
      CREATE INDEX IF NOT EXISTS idx_memory_ttl ON memory_store(ttl);
    `);

    // 5. Coordination events table - Cross-agent coordination
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS coordination_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT NOT NULL,
        source_agent TEXT NOT NULL,
        target_agents TEXT,
        payload TEXT,
        status TEXT DEFAULT 'pending',
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        processed_at INTEGER
      );
      CREATE INDEX IF NOT EXISTS idx_coord_status ON coordination_events(status);
      CREATE INDEX IF NOT EXISTS idx_coord_source ON coordination_events(source_agent);
    `);

    // 6. Neural patterns table - Learning and pattern storage
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS neural_patterns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pattern_type TEXT NOT NULL,
        pattern_data TEXT NOT NULL,
        confidence REAL DEFAULT 0.0,
        usage_count INTEGER DEFAULT 0,
        success_rate REAL DEFAULT 0.0,
        metadata TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      );
      CREATE INDEX IF NOT EXISTS idx_patterns_type ON neural_patterns(pattern_type);
      CREATE INDEX IF NOT EXISTS idx_patterns_confidence ON neural_patterns(confidence);
    `);

    // 7. Metrics table - Performance and analytics
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        metric_name TEXT NOT NULL,
        metric_value REAL NOT NULL,
        unit TEXT,
        source TEXT,
        tags TEXT,
        timestamp INTEGER DEFAULT (strftime('%s', 'now'))
      );
      CREATE INDEX IF NOT EXISTS idx_metrics_name ON metrics(metric_name);
      CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics(timestamp);
    `);

    // 8. Bottlenecks table - Performance bottleneck tracking
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS bottlenecks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        component TEXT NOT NULL,
        bottleneck_type TEXT NOT NULL,
        severity INTEGER DEFAULT 5,
        impact_score REAL DEFAULT 0.0,
        resolution_status TEXT DEFAULT 'detected',
        details TEXT,
        detected_at INTEGER DEFAULT (strftime('%s', 'now')),
        resolved_at INTEGER
      );
      CREATE INDEX IF NOT EXISTS idx_bottlenecks_status ON bottlenecks(resolution_status);
      CREATE INDEX IF NOT EXISTS idx_bottlenecks_severity ON bottlenecks(severity);
    `);

    // 9. Sessions table - Session management
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        swarm_id TEXT,
        status TEXT DEFAULT 'active',
        context TEXT,
        metadata TEXT,
        started_at INTEGER DEFAULT (strftime('%s', 'now')),
        ended_at INTEGER,
        FOREIGN KEY (swarm_id) REFERENCES swarms(id)
      );
      CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
      CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    `);

    // 10. Hooks table - Automation hooks configuration
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS hooks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        hook_type TEXT NOT NULL,
        event_pattern TEXT NOT NULL,
        action TEXT NOT NULL,
        configuration TEXT,
        enabled INTEGER DEFAULT 1,
        execution_count INTEGER DEFAULT 0,
        last_executed INTEGER,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );
      CREATE INDEX IF NOT EXISTS idx_hooks_type ON hooks(hook_type);
      CREATE INDEX IF NOT EXISTS idx_hooks_enabled ON hooks(enabled);
    `);

    // 11. GitHub integrations table - GitHub-specific data
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS github_integrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        repo_name TEXT NOT NULL,
        integration_type TEXT NOT NULL,
        configuration TEXT,
        last_sync INTEGER,
        sync_status TEXT DEFAULT 'pending',
        metadata TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );
      CREATE INDEX IF NOT EXISTS idx_github_repo ON github_integrations(repo_name);
      CREATE INDEX IF NOT EXISTS idx_github_type ON github_integrations(integration_type);
    `);

    // 12. Google Workspace table - Google integration data
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS google_workspace (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        service_type TEXT NOT NULL,
        resource_id TEXT,
        resource_name TEXT,
        sync_status TEXT DEFAULT 'pending',
        last_sync INTEGER,
        configuration TEXT,
        metadata TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );
      CREATE INDEX IF NOT EXISTS idx_workspace_service ON google_workspace(service_type);
      CREATE INDEX IF NOT EXISTS idx_workspace_status ON google_workspace(sync_status);
    `);

    this.logger.info('All 12 SQLite tables initialized successfully');
  }

  /**
   * Store memory entry with TTL support
   */
  async store(entry: MemoryEntry): Promise<void> {
    try {
      // Handle different SQL syntax for UPSERT across implementations
      let sql = '';
      if (this.implementation === 'better-sqlite3') {
        sql = `
          INSERT INTO memory_store (key, value, namespace, metadata, ttl)
          VALUES (@key, @value, @namespace, @metadata, @ttl)
          ON CONFLICT(key, namespace) DO UPDATE SET
            value = @value,
            metadata = @metadata,
            ttl = @ttl,
            updated_at = strftime('%s', 'now'),
            access_count = access_count + 1
        `;
      } else {
        // Fallback for sqlite3 and sql.js
        sql = `
          INSERT OR REPLACE INTO memory_store (key, value, namespace, metadata, ttl, access_count)
          VALUES (?, ?, ?, ?, ?, 
            COALESCE((SELECT access_count + 1 FROM memory_store WHERE key = ? AND namespace = ?), 1)
          )
        `;
      }
      
      const stmt = this.db.prepare(sql);
      
      if (this.implementation === 'better-sqlite3') {
        stmt.run({
          key: entry.key,
          value: JSON.stringify(entry.value),
          namespace: entry.namespace || 'default',
          metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
          ttl: entry.ttl ? Math.floor(Date.now() / 1000) + entry.ttl : null
        });
      } else {
        await stmt.run(
          entry.key,
          JSON.stringify(entry.value),
          entry.namespace || 'default',
          entry.metadata ? JSON.stringify(entry.metadata) : null,
          entry.ttl ? Math.floor(Date.now() / 1000) + entry.ttl : null,
          entry.key,
          entry.namespace || 'default'
        );
      }

      this.emit('stored', entry);
    } catch (error) {
      this.logger.error('Failed to store memory entry:', error);
      throw error;
    }
  }

  /**
   * Retrieve memory entry
   */
  async retrieve(key: string, namespace: string = 'default'): Promise<any> {
    try {
      // Handle different SQL syntax across implementations
      let sql = '';
      if (this.implementation === 'better-sqlite3') {
        sql = `
          UPDATE memory_store 
          SET access_count = access_count + 1
          WHERE key = ? AND namespace = ?
          AND (ttl IS NULL OR ttl > strftime('%s', 'now'))
          RETURNING value, metadata
        `;
      } else {
        // Fallback for sqlite3 and sql.js (no RETURNING clause)
        sql = `
          SELECT value, metadata FROM memory_store
          WHERE key = ? AND namespace = ?
          AND (ttl IS NULL OR ttl > strftime('%s', 'now'))
        `;
      }
      
      const stmt = this.db.prepare(sql);
      let row: any;
      
      if (this.implementation === 'better-sqlite3') {
        row = stmt.get(key, namespace);
      } else {
        row = await stmt.get(key, namespace);
        
        // Update access count separately for sqlite3/sql.js
        if (row) {
          const updateStmt = this.db.prepare(`
            UPDATE memory_store SET access_count = access_count + 1
            WHERE key = ? AND namespace = ?
          `);
          await updateStmt.run(key, namespace);
        }
      }
      
      if (!row) {
        return null;
      }

      this.emit('retrieved', { key, namespace });
      
      return {
        value: JSON.parse(row.value),
        metadata: row.metadata ? JSON.parse(row.metadata) : null
      };
    } catch (error) {
      this.logger.error('Failed to retrieve memory entry:', error);
      throw error;
    }
  }

  /**
   * Search memory entries by pattern
   */
  async search(pattern: string, namespace?: string): Promise<MemoryEntry[]> {
    try {
      let query = `
        SELECT key, value, namespace, metadata, created_at, updated_at, access_count
        FROM memory_store
        WHERE key LIKE ?
        AND (ttl IS NULL OR ttl > strftime('%s', 'now'))
      `;
      
      const params: any[] = [`%${pattern}%`];
      
      if (namespace) {
        query += ' AND namespace = ?';
        params.push(namespace);
      }
      
      query += ' ORDER BY access_count DESC, updated_at DESC LIMIT 100';
      
      const stmt = this.db.prepare(query);
      const rows = await stmt.all(...params) as any[];
      
      return rows.map(row => ({
        key: row.key,
        value: JSON.parse(row.value),
        namespace: row.namespace,
        metadata: row.metadata ? JSON.parse(row.metadata) : null,
        created_at: row.created_at,
        updated_at: row.updated_at,
        access_count: row.access_count
      }));
    } catch (error) {
      this.logger.error('Failed to search memory entries:', error);
      throw error;
    }
  }

  /**
   * Record metric
   */
  async recordMetric(name: string, value: number, unit?: string, tags?: any) {
    try {
      const stmt = this.db.prepare(`
        INSERT INTO metrics (metric_name, metric_value, unit, tags)
        VALUES (?, ?, ?, ?)
      `);
      
      await stmt.run(name, value, unit, tags ? JSON.stringify(tags) : null);
    } catch (error) {
      this.logger.error('Failed to record metric:', error);
      throw error;
    }
  }

  /**
   * Get metrics summary
   */
  async getMetricsSummary(name: string, timeRange?: number): Promise<any> {
    try {
      const since = timeRange ? Math.floor(Date.now() / 1000) - timeRange : 0;
      
      const stmt = this.db.prepare(`
        SELECT 
          COUNT(*) as count,
          AVG(metric_value) as avg,
          MIN(metric_value) as min,
          MAX(metric_value) as max,
          SUM(metric_value) as sum
        FROM metrics
        WHERE metric_name = ?
        AND timestamp > ?
      `);
      
      return await stmt.get(name, since);
    } catch (error) {
      this.logger.error('Failed to get metrics summary:', error);
      throw error;
    }
  }

  /**
   * Cleanup expired entries
   */
  private startCleanupTask() {
    this.cleanupInterval = setInterval(async () => {
      try {
        const stmt = this.db.prepare(`
          DELETE FROM memory_store
          WHERE ttl IS NOT NULL AND ttl < strftime('%s', 'now')
        `);
        
        const result = await stmt.run();
        
        if (result.changes && result.changes > 0) {
          this.logger.debug(`Cleaned up ${result.changes} expired entries`);
        }
      } catch (error) {
        this.logger.error('Cleanup task failed:', error);
      }
    }, 60000); // Run every minute
  }

  /**
   * Get current implementation info
   */
  async getImplementationInfo(): Promise<{ name: SQLiteImplementation; available: SQLiteImplementation[] }> {
    const detection = await detectSQLiteImplementations();
    return {
      name: this.implementation,
      available: detection.available
    };
  }
  
  /**
   * Test database connection and functionality
   */
  async testConnection(): Promise<boolean> {
    try {
      const stmt = this.db.prepare('SELECT 1 as test');
      const result = await stmt.get();
      return result && result.test === 1;
    } catch (error) {
      this.logger.error('Database connection test failed:', error);
      return false;
    }
  }
  
  /**
   * Close database connection
   */
  close() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.db.close();
    this.logger.info(`SQLite database closed (${this.implementation})`);
  }
}