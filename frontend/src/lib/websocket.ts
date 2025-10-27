/**
 * WebSocket Client for Real-Time Synchronization
 *
 * Connects to backend WebSocket server for real-time workflow updates.
 * Sprint 8: System Integration
 */

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: string;
  clientId?: string;
}

export type MessageHandler = (message: WebSocketMessage) => void;

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000; // Start with 1 second
  private reconnectTimer: number | null = null;
  private pingInterval: number | null = null;
  private status: ConnectionStatus = 'disconnected';
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private globalHandlers: Set<MessageHandler> = new Set();

  constructor(url: string = 'ws://localhost:3001/ws') {
    this.url = url;
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('[WebSocket] Already connected');
      return;
    }

    try {
      console.log(`[WebSocket] Connecting to ${this.url}...`);
      this.status = 'connecting';
      this.notifyStatusChange();

      this.ws = new WebSocket(this.url);

      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onerror = this.handleError.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
    } catch (error) {
      console.error('[WebSocket] Connection error:', error);
      this.status = 'error';
      this.notifyStatusChange();
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    console.log('[WebSocket] Disconnecting...');

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }

    this.status = 'disconnected';
    this.reconnectAttempts = 0;
    this.notifyStatusChange();
  }

  /**
   * Send message to server
   */
  send(type: string, payload: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[WebSocket] Cannot send message: Not connected');
      return;
    }

    const message: WebSocketMessage = {
      type,
      payload,
      timestamp: new Date().toISOString()
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Subscribe to specific message type
   */
  on(type: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }

    this.messageHandlers.get(type)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.messageHandlers.get(type)?.delete(handler);
    };
  }

  /**
   * Subscribe to all messages
   */
  onAny(handler: MessageHandler): () => void {
    this.globalHandlers.add(handler);

    return () => {
      this.globalHandlers.delete(handler);
    };
  }

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.status === 'connected';
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    console.log('[WebSocket] Connected');
    this.status = 'connected';
    this.reconnectAttempts = 0;
    this.reconnectDelay = 1000;
    this.notifyStatusChange();

    // Start ping interval
    this.startPingInterval();
  }

  /**
   * Handle incoming message
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);

      console.log('[WebSocket] Message received:', message.type);

      // Handle pong
      if (message.type === 'pong') {
        return;
      }

      // Call specific handlers
      const handlers = this.messageHandlers.get(message.type);
      if (handlers) {
        handlers.forEach(handler => {
          try {
            handler(message);
          } catch (error) {
            console.error('[WebSocket] Handler error:', error);
          }
        });
      }

      // Call global handlers
      this.globalHandlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error('[WebSocket] Global handler error:', error);
        }
      });
    } catch (error) {
      console.error('[WebSocket] Failed to parse message:', error);
    }
  }

  /**
   * Handle WebSocket error
   */
  private handleError(error: Event): void {
    console.error('[WebSocket] Error:', error);
    this.status = 'error';
    this.notifyStatusChange();
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    console.log('[WebSocket] Disconnected:', event.code, event.reason);

    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    this.status = 'disconnected';
    this.notifyStatusChange();

    // Attempt reconnection if not a clean close
    if (event.code !== 1000) {
      this.scheduleReconnect();
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnection attempts reached');
      this.status = 'error';
      this.notifyStatusChange();
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 30000);

    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimer = window.setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Start ping interval to keep connection alive
   */
  private startPingInterval(): void {
    this.pingInterval = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send('ping', {});
      }
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Notify status change handlers
   */
  private notifyStatusChange(): void {
    const message: WebSocketMessage = {
      type: 'status-changed',
      payload: { status: this.status },
      timestamp: new Date().toISOString()
    };

    this.globalHandlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error('[WebSocket] Status change handler error:', error);
      }
    });
  }
}

// Singleton instance
let websocketClient: WebSocketClient | null = null;

/**
 * Get WebSocket client instance
 */
export function getWebSocketClient(): WebSocketClient {
  if (!websocketClient) {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3001/ws';
    websocketClient = new WebSocketClient(wsUrl);
  }
  return websocketClient;
}

export default {
  WebSocketClient,
  getWebSocketClient
};
