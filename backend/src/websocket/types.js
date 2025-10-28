/**
 * WebSocket Event Types
 *
 * Defines WebSocket message format and event types.
 *
 * Sprint 7: Backend API Implementation
 */

/**
 * WebSocket event types
 */
export const WS_EVENT_TYPES = {
  // Workflow events
  WORKFLOW_CREATED: 'workflow.created',
  WORKFLOW_UPDATED: 'workflow.updated',
  WORKFLOW_DELETED: 'workflow.deleted',

  // Store events
  STORE_SYNCED: 'store.synced',
  STORE_UPDATED: 'store.updated',
  NODES_UPDATED: 'store.nodes.updated',
  EDGES_UPDATED: 'store.edges.updated',
  NODE_ADDED: 'store.node.added',
  NODE_UPDATED: 'store.node.updated',
  NODE_DELETED: 'store.node.deleted',
  EDGE_ADDED: 'store.edge.added',
  EDGE_DELETED: 'store.edge.deleted',

  // Connection events
  CLIENT_CONNECTED: 'client.connected',
  CLIENT_DISCONNECTED: 'client.disconnected',
  PING: 'ping',
  PONG: 'pong',

  // Error events
  ERROR: 'error'
};

/**
 * Create WebSocket event message
 * @param {string} type - Event type
 * @param {any} payload - Event payload
 * @param {string} [clientId] - Client ID
 * @returns {Object}
 */
export function createEvent(type, payload, clientId = null) {
  return {
    type,
    payload,
    timestamp: new Date().toISOString(),
    clientId
  };
}

/**
 * Create error event
 * @param {string} message - Error message
 * @param {string} [code] - Error code
 * @param {any} [details] - Error details
 * @returns {Object}
 */
export function createErrorEvent(message, code = 'ERROR', details = null) {
  return createEvent(WS_EVENT_TYPES.ERROR, {
    message,
    code,
    details
  });
}

export default {
  WS_EVENT_TYPES,
  createEvent,
  createErrorEvent
};
