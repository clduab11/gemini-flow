/**
 * WebSocket Server - Real-time bidirectional synchronization
 *
 * Handles WebSocket connections for real-time state updates.
 * Broadcasts events to all connected clients (TUI + browser).
 *
 * Sprint 7: Backend API Implementation
 */

import { WebSocketServer } from 'ws';
import { WS_EVENT_TYPES, createEvent, createErrorEvent } from './types.js';

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // clientId -> WebSocket
    this.heartbeatInterval = null;
  }

  /**
   * Initialize WebSocket server
   * @param {Object} server - HTTP server instance
   * @returns {WebSocketServer}
   */
  initialize(server) {
    console.log('🔌 Initializing WebSocket server...');

    this.wss = new WebSocketServer({ server, path: '/ws' });

    // Handle connections
    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    // Start heartbeat
    this.startHeartbeat();

    console.log('✅ WebSocket server initialized on /ws');
    return this.wss;
  }

  /**
   * Handle new WebSocket connection
   * @param {WebSocket} ws - WebSocket instance
   * @param {Request} req - HTTP request
   */
  handleConnection(ws, req) {
    // Extract API key from query parameters or upgrade headers
    const url = new URL(req.url, `ws://${req.headers.host || 'localhost'}`);
    const apiKey = url.searchParams.get('apiKey') || req.headers['x-api-key'];
    
    // Validate API key
    const DEFAULT_API_KEY = process.env.API_KEY || 'dev-api-key-change-in-production';
    
    if (!apiKey || apiKey !== DEFAULT_API_KEY) {
      console.warn(`❌ Unauthorized WebSocket connection attempt from ${req.socket.remoteAddress}`);
      ws.close(1008, 'Unauthorized'); // Policy Violation
      return;
    }

    const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    console.log(`📡 Client connected: ${clientId} from ${req.socket.remoteAddress}`);

    // Store client with authentication metadata
    this.clients.set(clientId, {
      ws,
      authenticated: true,
      connectedAt: Date.now(),
      remoteAddress: req.socket.remoteAddress
    });
    ws.clientId = clientId;
    ws.isAlive = true;

    // Send connection confirmation
    this.sendToClient(ws, createEvent(WS_EVENT_TYPES.CLIENT_CONNECTED, {
      clientId,
      timestamp: new Date().toISOString()
    }, clientId));

    // Handle messages
    ws.on('message', (data) => {
      this.handleMessage(ws, data, clientId);
    });

    // Handle pong (heartbeat response)
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Handle close
    ws.on('close', () => {
      this.handleDisconnect(clientId);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error(`WebSocket error for ${clientId}:`, error);
    });
  }

  /**
   * Handle incoming message from client
   * @param {WebSocket} ws - WebSocket instance
   * @param {Buffer} data - Message data
   * @param {string} clientId - Client ID
   */
  handleMessage(ws, data, clientId) {
    try {
      const message = JSON.parse(data.toString());

      // Handle ping
      if (message.type === WS_EVENT_TYPES.PING) {
        this.sendToClient(ws, createEvent(WS_EVENT_TYPES.PONG, {}, clientId));
        return;
      }

      console.log(`📨 Message from ${clientId}:`, message.type);

      // Handle other message types (extensible)
      // For now, we mainly broadcast from server to clients
    } catch (error) {
      console.error(`Failed to parse message from ${clientId}:`, error);
      this.sendToClient(ws, createErrorEvent('Invalid message format', 'PARSE_ERROR'));
    }
  }

  /**
   * Handle client disconnect
   * @param {string} clientId - Client ID
   */
  handleDisconnect(clientId) {
    console.log(`📴 Client disconnected: ${clientId}`);
    this.clients.delete(clientId);

    // Broadcast disconnect event to other clients
    this.broadcast(createEvent(WS_EVENT_TYPES.CLIENT_DISCONNECTED, { clientId }));
  }

  /**
   * Send message to specific client
   * @param {WebSocket} ws - WebSocket instance
   * @param {Object} event - Event to send
   */
  sendToClient(ws, event) {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(event));
    }
  }

  /**
   * Broadcast event to all connected clients
   * @param {Object} event - Event to broadcast
   * @param {string[]} [excludeClients] - Client IDs to exclude
   */
  broadcast(event, excludeClients = []) {
    const message = JSON.stringify(event);
    let sentCount = 0;

    this.clients.forEach((client, clientId) => {
      const ws = client.ws || client; // Support both old and new structure
      if (!excludeClients.includes(clientId) && ws.readyState === ws.OPEN) {
        ws.send(message);
        sentCount++;
      }
    });

    if (sentCount > 0) {
      console.log(`📢 Broadcasted ${event.type} to ${sentCount} clients`);
    }
  }

  /**
   * Broadcast workflow created event
   * @param {Object} workflow - Created workflow
   */
  broadcastWorkflowCreated(workflow) {
    this.broadcast(createEvent(WS_EVENT_TYPES.WORKFLOW_CREATED, {
      workflow,
      metadata: workflow.metadata
    }));
  }

  /**
   * Broadcast workflow updated event
   * @param {Object} workflow - Updated workflow
   */
  broadcastWorkflowUpdated(workflow) {
    this.broadcast(createEvent(WS_EVENT_TYPES.WORKFLOW_UPDATED, {
      workflow,
      metadata: workflow.metadata
    }));
  }

  /**
   * Broadcast workflow deleted event
   * @param {Object} workflow - Deleted workflow
   */
  broadcastWorkflowDeleted(workflow) {
    this.broadcast(createEvent(WS_EVENT_TYPES.WORKFLOW_DELETED, {
      workflowId: workflow.metadata.id,
      metadata: workflow.metadata
    }));
  }

  /**
   * Broadcast store synced event
   * @param {Object} state - Store state
   * @param {Object} [workflow] - Associated workflow
   */
  broadcastStoreSynced(state, workflow = null) {
    this.broadcast(createEvent(WS_EVENT_TYPES.STORE_SYNCED, {
      state,
      workflow: workflow ? workflow.metadata : null
    }));
  }

  /**
   * Broadcast store updated event
   * @param {Object} state - Store state
   */
  broadcastStoreUpdated(state) {
    this.broadcast(createEvent(WS_EVENT_TYPES.STORE_UPDATED, {
      state,
      nodeCount: state.nodes.length,
      edgeCount: state.edges.length,
      lastUpdate: state.lastUpdate
    }));
  }

  /**
   * Start heartbeat to detect disconnected clients
   */
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((client, clientId) => {
        const ws = client.ws || client; // Support both old and new structure
        if (ws.isAlive === false) {
          console.log(`💔 Client ${clientId} heartbeat timeout, terminating`);
          ws.terminate();
          this.clients.delete(clientId);
          return;
        }

        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // 30 seconds
  }

  /**
   * Stop heartbeat
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Get connected clients count
   * @returns {number}
   */
  getConnectedClientsCount() {
    return this.clients.size;
  }

  /**
   * Get WebSocket server health
   * @returns {Object}
   */
  getHealth() {
    return {
      status: 'healthy',
      clientsConnected: this.clients.size,
      clients: Array.from(this.clients.keys())
    };
  }

  /**
   * Shutdown WebSocket server
   */
  async shutdown() {
    console.log('🔌 Shutting down WebSocket server...');

    this.stopHeartbeat();

    // Close all client connections
    this.clients.forEach((client, clientId) => {
      const ws = client.ws || client; // Support both old and new structure
      ws.close(1000, 'Server shutting down');
    });

    this.clients.clear();

    // Close server
    if (this.wss) {
      return new Promise((resolve) => {
        this.wss.close(() => {
          console.log('✅ WebSocket server shut down');
          resolve();
        });
      });
    }
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();

export default websocketService;
