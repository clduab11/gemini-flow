/**
 * Database Layer - File-based storage with JSON
 *
 * Simple file-based database using JSON for workflow storage.
 * Can be easily replaced with SQLite or other databases.
 *
 * Sprint 7: Backend API Implementation
 */

import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_DIR = path.join(__dirname, '../../../.data');
const WORKFLOWS_FILE = path.join(DB_DIR, 'workflows.json');
const STORE_STATE_FILE = path.join(DB_DIR, 'store-state.json');
const SESSIONS_FILE = path.join(DB_DIR, 'sessions.json');

/**
 * Initialize database (create files if they don't exist)
 */
export async function initializeDatabase() {
  console.log('📦 Initializing database...');

  // Create data directory
  if (!fsSync.existsSync(DB_DIR)) {
    await fs.mkdir(DB_DIR, { recursive: true });
  }

  // Initialize workflows file
  if (!fsSync.existsSync(WORKFLOWS_FILE)) {
    await fs.writeFile(WORKFLOWS_FILE, JSON.stringify({ workflows: [] }, null, 2));
    console.log('  ✓ Created workflows.json');
  }

  // Initialize store state file
  if (!fsSync.existsSync(STORE_STATE_FILE)) {
    await fs.writeFile(STORE_STATE_FILE, JSON.stringify({
      nodes: [],
      edges: [],
      selectedNodes: [],
      selectedEdges: [],
      lastUpdate: Date.now()
    }, null, 2));
    console.log('  ✓ Created store-state.json');
  }

  // Initialize sessions file
  if (!fsSync.existsSync(SESSIONS_FILE)) {
    await fs.writeFile(SESSIONS_FILE, JSON.stringify({ sessions: [] }, null, 2));
    console.log('  ✓ Created sessions.json');
  }

  console.log('✅ Database initialized');
}

/**
 * Workflows CRUD Operations
 */

export async function getAllWorkflows() {
  const data = await fs.readFile(WORKFLOWS_FILE, 'utf-8');
  const parsed = JSON.parse(data);
  return parsed.workflows || [];
}

export async function getWorkflowById(id) {
  const workflows = await getAllWorkflows();
  return workflows.find(w => w.metadata?.id === id) || null;
}

export async function createWorkflow(workflow) {
  const workflows = await getAllWorkflows();

  // Check for duplicate ID
  if (workflows.find(w => w.metadata?.id === workflow.metadata?.id)) {
    throw new Error(`Workflow with ID ${workflow.metadata.id} already exists`);
  }

  workflows.push(workflow);
  await fs.writeFile(WORKFLOWS_FILE, JSON.stringify({ workflows }, null, 2));
  return workflow;
}

export async function updateWorkflow(id, updates) {
  const workflows = await getAllWorkflows();
  const index = workflows.findIndex(w => w.metadata?.id === id);

  if (index === -1) {
    throw new Error(`Workflow with ID ${id} not found`);
  }

  // Merge updates
  workflows[index] = {
    ...workflows[index],
    ...updates,
    metadata: {
      ...workflows[index].metadata,
      ...updates.metadata,
      updatedAt: Date.now()
    }
  };

  await fs.writeFile(WORKFLOWS_FILE, JSON.stringify({ workflows }, null, 2));
  return workflows[index];
}

export async function deleteWorkflow(id) {
  const workflows = await getAllWorkflows();
  const index = workflows.findIndex(w => w.metadata?.id === id);

  if (index === -1) {
    throw new Error(`Workflow with ID ${id} not found`);
  }

  const deleted = workflows.splice(index, 1)[0];
  await fs.writeFile(WORKFLOWS_FILE, JSON.stringify({ workflows }, null, 2));
  return deleted;
}

/**
 * Store State Operations
 */

export async function getStoreState() {
  const data = await fs.readFile(STORE_STATE_FILE, 'utf-8');
  return JSON.parse(data);
}

export async function updateStoreState(state) {
  const currentState = await getStoreState();
  const newState = {
    ...currentState,
    ...state,
    lastUpdate: Date.now()
  };

  await fs.writeFile(STORE_STATE_FILE, JSON.stringify(newState, null, 2));
  return newState;
}

export async function setStoreNodes(nodes) {
  const state = await getStoreState();
  state.nodes = nodes;
  state.lastUpdate = Date.now();
  await fs.writeFile(STORE_STATE_FILE, JSON.stringify(state, null, 2));
  return state;
}

export async function setStoreEdges(edges) {
  const state = await getStoreState();
  state.edges = edges;
  state.lastUpdate = Date.now();
  await fs.writeFile(STORE_STATE_FILE, JSON.stringify(state, null, 2));
  return state;
}

export async function clearStoreState() {
  const newState = {
    nodes: [],
    edges: [],
    selectedNodes: [],
    selectedEdges: [],
    lastUpdate: Date.now()
  };
  await fs.writeFile(STORE_STATE_FILE, JSON.stringify(newState, null, 2));
  return newState;
}

/**
 * Session Management
 */

export async function createSession(sessionData) {
  const data = await fs.readFile(SESSIONS_FILE, 'utf-8');
  const parsed = JSON.parse(data);
  const sessions = parsed.sessions || [];

  const session = {
    id: sessionData.id || `session-${Date.now()}`,
    clientId: sessionData.clientId,
    apiKey: sessionData.apiKey,
    createdAt: Date.now(),
    lastActivity: Date.now(),
    ...sessionData
  };

  sessions.push(session);
  await fs.writeFile(SESSIONS_FILE, JSON.stringify({ sessions }, null, 2));
  return session;
}

export async function getSessionByApiKey(apiKey) {
  const data = await fs.readFile(SESSIONS_FILE, 'utf-8');
  const parsed = JSON.parse(data);
  const sessions = parsed.sessions || [];
  return sessions.find(s => s.apiKey === apiKey) || null;
}

export async function updateSessionActivity(sessionId) {
  const data = await fs.readFile(SESSIONS_FILE, 'utf-8');
  const parsed = JSON.parse(data);
  const sessions = parsed.sessions || [];

  const session = sessions.find(s => s.id === sessionId);
  if (session) {
    session.lastActivity = Date.now();
    await fs.writeFile(SESSIONS_FILE, JSON.stringify({ sessions }, null, 2));
  }

  return session;
}

/**
 * Database Health Check
 */
export async function getDatabaseHealth() {
  try {
    const workflows = await getAllWorkflows();
    const storeState = await getStoreState();
    const data = await fs.readFile(SESSIONS_FILE, 'utf-8');
    const sessions = JSON.parse(data).sessions || [];

    return {
      status: 'healthy',
      stats: {
        workflowCount: workflows.length,
        nodeCount: storeState.nodes.length,
        edgeCount: storeState.edges.length,
        sessionCount: sessions.length,
        lastStoreUpdate: storeState.lastUpdate
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

export default {
  initializeDatabase,
  getAllWorkflows,
  getWorkflowById,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  getStoreState,
  updateStoreState,
  setStoreNodes,
  setStoreEdges,
  clearStoreState,
  createSession,
  getSessionByApiKey,
  updateSessionActivity,
  getDatabaseHealth
};
