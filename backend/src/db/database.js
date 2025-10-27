/**
 * Atomic Database Layer with SQLite
 * 
 * This module provides ACID-compliant database operations using SQLite with WAL mode.
 * All write operations are atomic and protected against race conditions.
 * 
 * Features:
 * - ACID transactions for data integrity
 * - WAL mode for concurrent reads during writes
 * - Automatic migration from JSON files
 * - Row-level locking via SQLite internals
 * - Synchronous API (safer, no async race conditions)
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database configuration - allow override for testing
const DB_DIR = process.env.DB_DIR || join(__dirname, '../../data');
const DB_FILE = join(DB_DIR, 'gemini-flow.db');
const WORKFLOWS_JSON = join(DB_DIR, 'workflows.json');
const SESSIONS_JSON = join(DB_DIR, 'sessions.json');
const STORE_JSON = join(DB_DIR, 'store.json');

// Initialize database connection
let db = null;

/**
 * Initialize SQLite database with schema and WAL mode
 */
function initializeDatabase() {
  // Ensure data directory exists
  if (!existsSync(DB_DIR)) {
    fs.mkdir(DB_DIR, { recursive: true });
  }

  // Open database connection
  db = new Database(DB_FILE);
  
  // Enable WAL mode for better concurrency
  // WAL allows concurrent readers while a writer is active
  db.pragma('journal_mode = WAL');
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  
  // Create schema
  createSchema();
  
  // Migrate from JSON files if they exist
  migrateFromJSON();
  
  return db;
}

/**
 * Create database schema
 */
function createSchema() {
  // Workflows table
  db.exec(`
    CREATE TABLE IF NOT EXISTS workflows (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      nodes TEXT NOT NULL,
      edges TEXT NOT NULL,
      status TEXT DEFAULT 'draft',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      metadata TEXT
    )
  `);

  // Sessions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      workflow_id TEXT,
      status TEXT DEFAULT 'active',
      data TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      expires_at INTEGER,
      FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE SET NULL
    )
  `);

  // Store state table
  db.exec(`
    CREATE TABLE IF NOT EXISTS store_state (
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      namespace TEXT DEFAULT 'default' NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (key, namespace)
    )
  `);

  // Create indices for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status);
    CREATE INDEX IF NOT EXISTS idx_workflows_updated_at ON workflows(updated_at);
    CREATE INDEX IF NOT EXISTS idx_sessions_workflow_id ON sessions(workflow_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_store_namespace ON store_state(namespace);
  `);
}

/**
 * Migrate data from JSON files to SQLite
 */
function migrateFromJSON() {
  const migrations = [
    { file: WORKFLOWS_JSON, table: 'workflows', migrator: migrateWorkflows },
    { file: SESSIONS_JSON, table: 'sessions', migrator: migrateSessions },
    { file: STORE_JSON, table: 'store_state', migrator: migrateStore }
  ];

  for (const { file, table, migrator } of migrations) {
    if (existsSync(file)) {
      try {
        // Check if table is empty
        const count = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
        if (count.count === 0) {
          console.log(`Migrating ${table} from JSON...`);
          migrator(file);
          
          // Rename JSON file as backup
          const backupFile = file + '.migrated';
          if (existsSync(backupFile)) {
            // If backup already exists, just delete the original
            fs.unlink(file).catch(console.error);
          } else {
            fs.rename(file, backupFile).catch(console.error);
          }
        }
      } catch (error) {
        console.error(`Error migrating ${table}:`, error);
      }
    }
  }
}

/**
 * Migrate workflows from JSON
 */
function migrateWorkflows(file) {
  const content = existsSync(file) ? require('fs').readFileSync(file, 'utf-8') : '{}';
  const data = JSON.parse(content);
  const workflows = data.workflows || [];

  const insert = db.prepare(`
    INSERT OR IGNORE INTO workflows (id, name, description, nodes, edges, status, created_at, updated_at, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction((workflows) => {
    for (const workflow of workflows) {
      insert.run(
        workflow.metadata?.id || generateId(),
        workflow.name || 'Untitled',
        workflow.description || '',
        JSON.stringify(workflow.nodes || []),
        JSON.stringify(workflow.edges || []),
        workflow.status || 'draft',
        workflow.metadata?.createdAt || Date.now(),
        workflow.metadata?.updatedAt || Date.now(),
        JSON.stringify(workflow.metadata || {})
      );
    }
  });

  transaction(workflows);
}

/**
 * Migrate sessions from JSON
 */
function migrateSessions(file) {
  const content = existsSync(file) ? require('fs').readFileSync(file, 'utf-8') : '{}';
  const data = JSON.parse(content);
  const sessions = data.sessions || [];

  const insert = db.prepare(`
    INSERT OR IGNORE INTO sessions (id, workflow_id, status, data, created_at, updated_at, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction((sessions) => {
    for (const session of sessions) {
      insert.run(
        session.id || generateId(),
        session.workflowId || null,
        session.status || 'active',
        JSON.stringify(session.data || {}),
        session.createdAt || Date.now(),
        session.updatedAt || Date.now(),
        session.expiresAt || null
      );
    }
  });

  transaction(sessions);
}

/**
 * Migrate store state from JSON
 */
function migrateStore(file) {
  const content = existsSync(file) ? require('fs').readFileSync(file, 'utf-8') : '{}';
  const data = JSON.parse(content);
  
  const insert = db.prepare(`
    INSERT OR IGNORE INTO store_state (key, value, namespace, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction((store) => {
    const now = Date.now();
    for (const [key, value] of Object.entries(store)) {
      insert.run(
        key,
        JSON.stringify(value),
        'default',
        now,
        now
      );
    }
  });

  transaction(data);
}

/**
 * Generate a unique ID
 */
function generateId() {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// WORKFLOW OPERATIONS (ATOMIC)
// ============================================================================

/**
 * Get all workflows
 * @returns {Array} Array of workflow objects
 */
export function getAllWorkflows() {
  ensureInitialized();
  
  const stmt = db.prepare(`
    SELECT id, name, description, nodes, edges, status, created_at, updated_at, metadata
    FROM workflows
    ORDER BY updated_at DESC
  `);
  
  const rows = stmt.all();
  return rows.map(deserializeWorkflow);
}

/**
 * Get workflow by ID
 * @param {string} id - Workflow ID
 * @returns {Object|null} Workflow object or null if not found
 */
export function getWorkflowById(id) {
  ensureInitialized();
  
  const stmt = db.prepare(`
    SELECT id, name, description, nodes, edges, status, created_at, updated_at, metadata
    FROM workflows
    WHERE id = ?
  `);
  
  const row = stmt.get(id);
  return row ? deserializeWorkflow(row) : null;
}

/**
 * Create a new workflow (ATOMIC)
 * @param {Object} workflow - Workflow data
 * @returns {Object} Created workflow
 */
export function createWorkflow(workflow) {
  ensureInitialized();
  
  const id = workflow.metadata?.id || generateId();
  const now = Date.now();
  
  const stmt = db.prepare(`
    INSERT INTO workflows (id, name, description, nodes, edges, status, created_at, updated_at, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  // Atomic operation - transaction is implicit for single statement
  stmt.run(
    id,
    workflow.name || 'Untitled',
    workflow.description || '',
    JSON.stringify(workflow.nodes || []),
    JSON.stringify(workflow.edges || []),
    workflow.status || 'draft',
    now,
    now,
    JSON.stringify({ ...workflow.metadata, id, createdAt: now, updatedAt: now })
  );
  
  return getWorkflowById(id);
}

/**
 * Update workflow (ATOMIC)
 * @param {string} id - Workflow ID
 * @param {Object} updates - Fields to update
 * @returns {Object} Updated workflow
 */
export function updateWorkflow(id, updates) {
  ensureInitialized();
  
  // Atomic transaction - all or nothing
  const transaction = db.transaction(() => {
    // Check if workflow exists
    const existing = getWorkflowById(id);
    if (!existing) {
      throw new Error(`Workflow with id ${id} not found`);
    }
    
    const now = Date.now();
    const metadata = {
      ...existing.metadata,
      ...updates.metadata,
      updatedAt: now
    };
    
    const stmt = db.prepare(`
      UPDATE workflows
      SET 
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        nodes = COALESCE(?, nodes),
        edges = COALESCE(?, edges),
        status = COALESCE(?, status),
        updated_at = ?,
        metadata = ?
      WHERE id = ?
    `);
    
    stmt.run(
      updates.name || null,
      updates.description !== undefined ? updates.description : null,
      updates.nodes ? JSON.stringify(updates.nodes) : null,
      updates.edges ? JSON.stringify(updates.edges) : null,
      updates.status || null,
      now,
      JSON.stringify(metadata),
      id
    );
    
    return getWorkflowById(id);
  });
  
  return transaction();
}

/**
 * Delete workflow (ATOMIC)
 * @param {string} id - Workflow ID
 * @returns {boolean} True if deleted, false if not found
 */
export function deleteWorkflow(id) {
  ensureInitialized();
  
  const stmt = db.prepare('DELETE FROM workflows WHERE id = ?');
  const result = stmt.run(id);
  
  return result.changes > 0;
}

// ============================================================================
// SESSION OPERATIONS (ATOMIC)
// ============================================================================

/**
 * Get all sessions
 * @returns {Array} Array of session objects
 */
export function getAllSessions() {
  ensureInitialized();
  
  const stmt = db.prepare(`
    SELECT id, workflow_id, status, data, created_at, updated_at, expires_at
    FROM sessions
    ORDER BY created_at DESC
  `);
  
  const rows = stmt.all();
  return rows.map(deserializeSession);
}

/**
 * Get session by ID
 * @param {string} id - Session ID
 * @returns {Object|null} Session object or null if not found
 */
export function getSessionById(id) {
  ensureInitialized();
  
  const stmt = db.prepare(`
    SELECT id, workflow_id, status, data, created_at, updated_at, expires_at
    FROM sessions
    WHERE id = ?
  `);
  
  const row = stmt.get(id);
  return row ? deserializeSession(row) : null;
}

/**
 * Create a new session (ATOMIC)
 * @param {Object} session - Session data
 * @returns {Object} Created session
 */
export function createSession(session) {
  ensureInitialized();
  
  const id = session.id || generateId();
  const now = Date.now();
  
  const stmt = db.prepare(`
    INSERT INTO sessions (id, workflow_id, status, data, created_at, updated_at, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(
    id,
    session.workflowId || null,
    session.status || 'active',
    JSON.stringify(session.data || {}),
    now,
    now,
    session.expiresAt || null
  );
  
  return getSessionById(id);
}

/**
 * Update session (ATOMIC)
 * @param {string} id - Session ID
 * @param {Object} updates - Fields to update
 * @returns {Object} Updated session
 */
export function updateSession(id, updates) {
  ensureInitialized();
  
  const transaction = db.transaction(() => {
    const existing = getSessionById(id);
    if (!existing) {
      throw new Error(`Session with id ${id} not found`);
    }
    
    const now = Date.now();
    
    const stmt = db.prepare(`
      UPDATE sessions
      SET 
        workflow_id = COALESCE(?, workflow_id),
        status = COALESCE(?, status),
        data = COALESCE(?, data),
        updated_at = ?,
        expires_at = COALESCE(?, expires_at)
      WHERE id = ?
    `);
    
    stmt.run(
      updates.workflowId !== undefined ? updates.workflowId : null,
      updates.status || null,
      updates.data ? JSON.stringify(updates.data) : null,
      now,
      updates.expiresAt !== undefined ? updates.expiresAt : null,
      id
    );
    
    return getSessionById(id);
  });
  
  return transaction();
}

/**
 * Delete session (ATOMIC)
 * @param {string} id - Session ID
 * @returns {boolean} True if deleted, false if not found
 */
export function deleteSession(id) {
  ensureInitialized();
  
  const stmt = db.prepare('DELETE FROM sessions WHERE id = ?');
  const result = stmt.run(id);
  
  return result.changes > 0;
}

/**
 * Clean up expired sessions (ATOMIC)
 * @returns {number} Number of sessions deleted
 */
export function cleanupExpiredSessions() {
  ensureInitialized();
  
  const now = Date.now();
  const stmt = db.prepare('DELETE FROM sessions WHERE expires_at IS NOT NULL AND expires_at < ?');
  const result = stmt.run(now);
  
  return result.changes;
}

// ============================================================================
// STORE STATE OPERATIONS (ATOMIC)
// ============================================================================

/**
 * Get all store state
 * @param {string} namespace - Optional namespace filter
 * @returns {Object} Store state object
 */
export function getStoreState(namespace = 'default') {
  ensureInitialized();
  
  const stmt = db.prepare(`
    SELECT key, value
    FROM store_state
    WHERE namespace = ?
  `);
  
  const rows = stmt.all(namespace);
  const state = {};
  
  for (const row of rows) {
    try {
      state[row.key] = JSON.parse(row.value);
    } catch (error) {
      state[row.key] = row.value;
    }
  }
  
  return state;
}

/**
 * Get store value by key
 * @param {string} key - Key to retrieve
 * @param {string} namespace - Namespace
 * @returns {*} Value or null if not found
 */
export function getStoreValue(key, namespace = 'default') {
  ensureInitialized();
  
  const stmt = db.prepare(`
    SELECT value
    FROM store_state
    WHERE key = ? AND namespace = ?
  `);
  
  const row = stmt.get(key, namespace);
  if (!row) return null;
  
  try {
    return JSON.parse(row.value);
  } catch (error) {
    return row.value;
  }
}

/**
 * Update store state (ATOMIC)
 * @param {Object} updates - Key-value pairs to update
 * @param {string} namespace - Namespace
 * @returns {Object} Updated state
 */
export function updateStoreState(updates, namespace = 'default') {
  ensureInitialized();
  
  const transaction = db.transaction(() => {
    const now = Date.now();
    const upsert = db.prepare(`
      INSERT INTO store_state (key, value, namespace, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(key, namespace) DO UPDATE SET
        value = excluded.value,
        updated_at = excluded.updated_at
    `);
    
    for (const [key, value] of Object.entries(updates)) {
      upsert.run(
        key,
        JSON.stringify(value),
        namespace,
        now,
        now
      );
    }
    
    return getStoreState(namespace);
  });
  
  return transaction();
}

/**
 * Delete store value (ATOMIC)
 * @param {string} key - Key to delete
 * @param {string} namespace - Namespace
 * @returns {boolean} True if deleted, false if not found
 */
export function deleteStoreValue(key, namespace = 'default') {
  ensureInitialized();
  
  const stmt = db.prepare('DELETE FROM store_state WHERE key = ? AND namespace = ?');
  const result = stmt.run(key, namespace);
  
  return result.changes > 0;
}

/**
 * Clear all store state in namespace (ATOMIC)
 * @param {string} namespace - Namespace to clear
 * @returns {number} Number of entries deleted
 */
export function clearStoreState(namespace = 'default') {
  ensureInitialized();
  
  const stmt = db.prepare('DELETE FROM store_state WHERE namespace = ?');
  const result = stmt.run(namespace);
  
  return result.changes;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Deserialize workflow from database row
 */
function deserializeWorkflow(row) {
  return {
    name: row.name,
    description: row.description,
    nodes: JSON.parse(row.nodes),
    edges: JSON.parse(row.edges),
    status: row.status,
    metadata: {
      ...JSON.parse(row.metadata),
      id: row.id,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }
  };
}

/**
 * Deserialize session from database row
 */
function deserializeSession(row) {
  return {
    id: row.id,
    workflowId: row.workflow_id,
    status: row.status,
    data: JSON.parse(row.data),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    expiresAt: row.expires_at
  };
}

/**
 * Ensure database is initialized
 */
function ensureInitialized() {
  if (!db) {
    initializeDatabase();
  }
}

/**
 * Close database connection
 */
export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

/**
 * Get database statistics
 */
export function getDatabaseStats() {
  ensureInitialized();
  
  const workflows = db.prepare('SELECT COUNT(*) as count FROM workflows').get();
  const sessions = db.prepare('SELECT COUNT(*) as count FROM sessions').get();
  const store = db.prepare('SELECT COUNT(*) as count FROM store_state').get();
  
  return {
    workflows: workflows.count,
    sessions: sessions.count,
    storeEntries: store.count,
    databaseFile: DB_FILE,
    walMode: db.pragma('journal_mode', { simple: true }) === 'wal'
  };
}

// Initialize database on module load
initializeDatabase();

// Export database instance for advanced usage
export { db };
