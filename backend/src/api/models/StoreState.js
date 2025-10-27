/**
 * Store State Data Model
 *
 * Defines the structure for the Zustand store state.
 * Compatible with frontend/src/lib/store.ts
 *
 * Sprint 7: Backend API Implementation
 */

/**
 * @typedef {Object} StoreState
 * @property {import('./Workflow').WorkflowNode[]} nodes - Flow nodes
 * @property {import('./Workflow').WorkflowEdge[]} edges - Flow edges
 * @property {string[]} selectedNodes - Selected node IDs
 * @property {string[]} selectedEdges - Selected edge IDs
 * @property {number} lastUpdate - Last update timestamp
 */

/**
 * Create empty store state
 * @returns {StoreState}
 */
export function createEmptyStoreState() {
  return {
    nodes: [],
    edges: [],
    selectedNodes: [],
    selectedEdges: [],
    lastUpdate: Date.now()
  };
}

/**
 * Validate store state
 * @param {any} state - State to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateStoreState(state) {
  const errors = [];

  if (!state || typeof state !== 'object') {
    return { valid: false, errors: ['State must be an object'] };
  }

  if (!Array.isArray(state.nodes)) {
    errors.push('nodes must be an array');
  }

  if (!Array.isArray(state.edges)) {
    errors.push('edges must be an array');
  }

  if (!Array.isArray(state.selectedNodes)) {
    errors.push('selectedNodes must be an array');
  }

  if (!Array.isArray(state.selectedEdges)) {
    errors.push('selectedEdges must be an array');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize store state
 * @param {StoreState} state - State to sanitize
 * @returns {StoreState}
 */
export function sanitizeStoreState(state) {
  return {
    nodes: Array.isArray(state.nodes) ? state.nodes : [],
    edges: Array.isArray(state.edges) ? state.edges : [],
    selectedNodes: Array.isArray(state.selectedNodes) ? state.selectedNodes.map(String) : [],
    selectedEdges: Array.isArray(state.selectedEdges) ? state.selectedEdges.map(String) : [],
    lastUpdate: Date.now()
  };
}

export default {
  createEmptyStoreState,
  validateStoreState,
  sanitizeStoreState
};
