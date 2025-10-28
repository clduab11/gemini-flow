/**
 * React Hook for WebSocket Integration
 *
 * Provides easy WebSocket access in React components with automatic cleanup.
 * Sprint 8: System Integration
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { getWebSocketClient, type ConnectionStatus, type WebSocketMessage } from '../lib/websocket';
import { useFlowStore } from '../lib/store';

/**
 * Hook for WebSocket connection status
 */
export function useWebSocketStatus() {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const wsClient = getWebSocketClient();

  useEffect(() => {
    // Set initial status
    setStatus(wsClient.getStatus());

    // Subscribe to status changes
    const unsubscribe = wsClient.onAny((message) => {
      if (message.type === 'status-changed') {
        setStatus(message.payload.status);
      }
    });

    return unsubscribe;
  }, []);

  return status;
}

/**
 * Hook for subscribing to WebSocket messages
 */
export function useWebSocketMessage(
  messageType: string,
  handler: (message: WebSocketMessage) => void
) {
  const wsClient = getWebSocketClient();

  useEffect(() => {
    const unsubscribe = wsClient.on(messageType, handler);
    return unsubscribe;
  }, [messageType, handler]);
}

/**
 * Hook for sending WebSocket messages
 */
export function useWebSocketSend() {
  const wsClient = getWebSocketClient();

  return useCallback((type: string, payload: any) => {
    wsClient.send(type, payload);
  }, []);
}

/**
 * Main hook for WebSocket integration with Zustand store
 */
export function useWebSocketSync() {
  const wsClient = getWebSocketClient();
  const { setNodes, setEdges } = useFlowStore();
  const isInitializedRef = useRef(false);

  useEffect(() => {
    // Prevent double initialization in StrictMode
    if (isInitializedRef.current) {
      return;
    }
    isInitializedRef.current = true;

    console.log('[useWebSocketSync] Initializing WebSocket sync');

    // Connect to WebSocket
    wsClient.connect();

    // Subscribe to workflow events
    const unsubscribeCreated = wsClient.on('workflow.created', (message) => {
      console.log('[useWebSocketSync] Workflow created:', message.payload);
      // Optionally reload workflows list
    });

    const unsubscribeUpdated = wsClient.on('workflow.updated', (message) => {
      console.log('[useWebSocketSync] Workflow updated:', message.payload);
      const workflow = message.payload.workflow;
      if (workflow) {
        setNodes(workflow.nodes || []);
        setEdges(workflow.edges || []);
      }
    });

    const unsubscribeDeleted = wsClient.on('workflow.deleted', (message) => {
      console.log('[useWebSocketSync] Workflow deleted:', message.payload);
      // Optionally clear if current workflow was deleted
    });

    // Subscribe to store events
    const unsubscribeStoreUpdated = wsClient.on('store.updated', (message) => {
      console.log('[useWebSocketSync] Store updated:', message.payload);
      const state = message.payload.state;
      if (state) {
        setNodes(state.nodes || []);
        setEdges(state.edges || []);
      }
    });

    const unsubscribeStoreSynced = wsClient.on('store.synced', (message) => {
      console.log('[useWebSocketSync] Store synced:', message.payload);
      const state = message.payload.state;
      if (state) {
        setNodes(state.nodes || []);
        setEdges(state.edges || []);
      }
    });

    // Cleanup on unmount
    return () => {
      console.log('[useWebSocketSync] Cleaning up WebSocket sync');
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeDeleted();
      unsubscribeStoreUpdated();
      unsubscribeStoreSynced();
      // Don't disconnect - keep connection alive for the app lifecycle
    };
  }, [setNodes, setEdges]);

  return {
    status: useWebSocketStatus(),
    send: useWebSocketSend()
  };
}

export default {
  useWebSocketStatus,
  useWebSocketMessage,
  useWebSocketSend,
  useWebSocketSync
};
