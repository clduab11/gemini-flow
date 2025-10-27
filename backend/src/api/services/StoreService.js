/**
 * Store Service - State management for Zustand store
 *
 * Manages the backend mirror of the frontend Zustand store.
 * Handles state synchronization and broadcasts updates via WebSocket.
 *
 * Sprint 7: Backend API Implementation
 */

import * as db from '../../db/database.js';
import { validateStoreState, sanitizeStoreState } from '../models/StoreState.js';

/**
 * Get current store state
 * @returns {Promise<Object>}
 */
export async function getStoreState() {
  try {
    const state = await db.getStoreState();
    return state;
  } catch (error) {
    throw new Error(`Failed to get store state: ${error.message}`);
  }
}

/**
 * Update store state (full replacement)
 * @param {Object} state - New state
 * @param {Object} [options] - Update options
 * @param {Function} [options.onUpdated] - Callback after update
 * @returns {Promise<Object>}
 */
export async function updateStoreState(state, options = {}) {
  try {
    // Validate state
    const validation = validateStoreState(state);
    if (!validation.valid) {
      throw new Error(`Invalid store state: ${validation.errors.join(', ')}`);
    }

    // Sanitize state
    const sanitized = sanitizeStoreState(state);

    // Update in database
    const updated = await db.updateStoreState(sanitized);

    // Callback for broadcasting event
    if (options.onUpdated) {
      options.onUpdated(updated);
    }

    return updated;
  } catch (error) {
    throw new Error(`Failed to update store state: ${error.message}`);
  }
}

/**
 * Set nodes in store
 * @param {Array} nodes - Nodes array
 * @param {Object} [options] - Update options
 * @param {Function} [options.onUpdated] - Callback after update
 * @returns {Promise<Object>}
 */
export async function setNodes(nodes, options = {}) {
  try {
    if (!Array.isArray(nodes)) {
      throw new Error('Nodes must be an array');
    }

    const state = await db.setStoreNodes(nodes);

    // Callback for broadcasting event
    if (options.onUpdated) {
      options.onUpdated(state);
    }

    return state;
  } catch (error) {
    throw new Error(`Failed to set nodes: ${error.message}`);
  }
}

/**
 * Set edges in store
 * @param {Array} edges - Edges array
 * @param {Object} [options] - Update options
 * @param {Function} [options.onUpdated] - Callback after update
 * @returns {Promise<Object>}
 */
export async function setEdges(edges, options = {}) {
  try {
    if (!Array.isArray(edges)) {
      throw new Error('Edges must be an array');
    }

    const state = await db.setStoreEdges(edges);

    // Callback for broadcasting event
    if (options.onUpdated) {
      options.onUpdated(state);
    }

    return state;
  } catch (error) {
    throw new Error(`Failed to set edges: ${error.message}`);
  }
}

/**
 * Add a node to store
 * @param {Object} node - Node to add
 * @param {Object} [options] - Update options
 * @param {Function} [options.onUpdated] - Callback after update
 * @returns {Promise<Object>}
 */
export async function addNode(node, options = {}) {
  try {
    const state = await db.getStoreState();

    // Check for duplicate ID
    if (state.nodes.find(n => n.id === node.id)) {
      throw new Error(`Node with ID ${node.id} already exists`);
    }

    state.nodes.push(node);
    const updated = await db.setStoreNodes(state.nodes);

    // Callback for broadcasting event
    if (options.onUpdated) {
      options.onUpdated(updated);
    }

    return updated;
  } catch (error) {
    throw new Error(`Failed to add node: ${error.message}`);
  }
}

/**
 * Update a node in store
 * @param {string} nodeId - Node ID
 * @param {Object} updates - Node updates
 * @param {Object} [options] - Update options
 * @param {Function} [options.onUpdated] - Callback after update
 * @returns {Promise<Object>}
 */
export async function updateNode(nodeId, updates, options = {}) {
  try {
    const state = await db.getStoreState();
    const index = state.nodes.findIndex(n => n.id === nodeId);

    if (index === -1) {
      throw new Error(`Node not found: ${nodeId}`);
    }

    // Merge updates
    state.nodes[index] = {
      ...state.nodes[index],
      ...updates,
      id: nodeId // Preserve ID
    };

    const updated = await db.setStoreNodes(state.nodes);

    // Callback for broadcasting event
    if (options.onUpdated) {
      options.onUpdated(updated);
    }

    return updated;
  } catch (error) {
    throw new Error(`Failed to update node: ${error.message}`);
  }
}

/**
 * Delete a node from store
 * @param {string} nodeId - Node ID
 * @param {Object} [options] - Update options
 * @param {Function} [options.onUpdated] - Callback after update
 * @returns {Promise<Object>}
 */
export async function deleteNode(nodeId, options = {}) {
  try {
    const state = await db.getStoreState();

    // Remove node
    state.nodes = state.nodes.filter(n => n.id !== nodeId);

    // Remove edges connected to this node
    state.edges = state.edges.filter(e => e.source !== nodeId && e.target !== nodeId);

    await db.setStoreNodes(state.nodes);
    const updated = await db.setStoreEdges(state.edges);

    // Callback for broadcasting event
    if (options.onUpdated) {
      options.onUpdated(updated);
    }

    return updated;
  } catch (error) {
    throw new Error(`Failed to delete node: ${error.message}`);
  }
}

/**
 * Add an edge to store
 * @param {Object} edge - Edge to add
 * @param {Object} [options] - Update options
 * @param {Function} [options.onUpdated] - Callback after update
 * @returns {Promise<Object>}
 */
export async function addEdge(edge, options = {}) {
  try {
    const state = await db.getStoreState();

    // Check for duplicate ID
    if (state.edges.find(e => e.id === edge.id)) {
      throw new Error(`Edge with ID ${edge.id} already exists`);
    }

    // Validate source and target nodes exist
    if (!state.nodes.find(n => n.id === edge.source)) {
      throw new Error(`Source node not found: ${edge.source}`);
    }
    if (!state.nodes.find(n => n.id === edge.target)) {
      throw new Error(`Target node not found: ${edge.target}`);
    }

    state.edges.push(edge);
    const updated = await db.setStoreEdges(state.edges);

    // Callback for broadcasting event
    if (options.onUpdated) {
      options.onUpdated(updated);
    }

    return updated;
  } catch (error) {
    throw new Error(`Failed to add edge: ${error.message}`);
  }
}

/**
 * Delete an edge from store
 * @param {string} edgeId - Edge ID
 * @param {Object} [options] - Update options
 * @param {Function} [options.onUpdated] - Callback after update
 * @returns {Promise<Object>}
 */
export async function deleteEdge(edgeId, options = {}) {
  try {
    const state = await db.getStoreState();
    state.edges = state.edges.filter(e => e.id !== edgeId);
    const updated = await db.setStoreEdges(state.edges);

    // Callback for broadcasting event
    if (options.onUpdated) {
      options.onUpdated(updated);
    }

    return updated;
  } catch (error) {
    throw new Error(`Failed to delete edge: ${error.message}`);
  }
}

/**
 * Load workflow into store
 * @param {Object} workflow - Workflow to load
 * @param {Object} [options] - Update options
 * @param {Function} [options.onUpdated] - Callback after update
 * @returns {Promise<Object>}
 */
export async function loadWorkflowIntoStore(workflow, options = {}) {
  try {
    const state = {
      nodes: workflow.nodes || [],
      edges: workflow.edges || [],
      selectedNodes: [],
      selectedEdges: [],
      lastUpdate: Date.now()
    };

    const updated = await db.updateStoreState(state);

    // Callback for broadcasting event
    if (options.onUpdated) {
      options.onUpdated(updated);
    }

    return updated;
  } catch (error) {
    throw new Error(`Failed to load workflow into store: ${error.message}`);
  }
}

/**
 * Clear store state
 * @param {Object} [options] - Update options
 * @param {Function} [options.onUpdated] - Callback after update
 * @returns {Promise<Object>}
 */
export async function clearStore(options = {}) {
  try {
    const cleared = await db.clearStoreState();

    // Callback for broadcasting event
    if (options.onUpdated) {
      options.onUpdated(cleared);
    }

    return cleared;
  } catch (error) {
    throw new Error(`Failed to clear store: ${error.message}`);
  }
}

/**
 * Sync workflow to store
 * @param {string} workflowId - Workflow ID
 * @param {Object} [options] - Sync options
 * @param {Function} [options.onSynced] - Callback after sync
 * @returns {Promise<Object>}
 */
export async function syncWorkflowToStore(workflowId, options = {}) {
  try {
    // Import workflow service to avoid circular dependency
    const workflowService = await import('./WorkflowService.js');
    const workflow = await workflowService.getWorkflowById(workflowId);

    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const state = await loadWorkflowIntoStore(workflow, options);

    // Callback for broadcasting event
    if (options.onSynced) {
      options.onSynced(state, workflow);
    }

    return state;
  } catch (error) {
    throw new Error(`Failed to sync workflow to store: ${error.message}`);
  }
}

export default {
  getStoreState,
  updateStoreState,
  setNodes,
  setEdges,
  addNode,
  updateNode,
  deleteNode,
  addEdge,
  deleteEdge,
  loadWorkflowIntoStore,
  clearStore,
  syncWorkflowToStore
};
