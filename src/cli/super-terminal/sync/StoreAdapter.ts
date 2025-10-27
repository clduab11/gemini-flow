/**
 * Store Adapter - Bridge between TUI and React Flow Zustand Store
 *
 * Features:
 * - HTTP/WebSocket connection to frontend API
 * - Local cache of remote store state
 * - Event-driven state change notifications
 * - Graceful offline mode handling
 * - Automatic reconnection logic
 * - State transformation and validation
 */

import EventEmitter from 'events';
import { getLogger } from '../utils/Logger.js';
import { getConfig } from '../utils/Config.js';
import { RetryStrategy } from '../utils/RetryUtils.js';
import { WorkflowSerializer } from './WorkflowSerializer.js';
import { Workflow, WorkflowNode, WorkflowEdge } from './types/index.js';

export interface StoreState {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNodes: string[];
  selectedEdges: string[];
  isExecuting: boolean;
  executionResult: string | null;
  executionError: string | null;
}

export interface StoreAdapterOptions {
  apiBaseUrl?: string;
  pollIntervalMs?: number;
  maxRetries?: number;
  offlineMode?: boolean;
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'error';

export class StoreAdapter extends EventEmitter {
  private logger = getLogger();
  private config = getConfig();
  private serializer = new WorkflowSerializer();
  private apiBaseUrl: string;
  private pollIntervalMs: number;
  private maxRetries: number;
  private offlineMode: boolean;

  // Connection state
  private status: ConnectionStatus = 'disconnected';
  private pollTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;

  // Local cache of remote state
  private cachedState: StoreState = {
    nodes: [],
    edges: [],
    selectedNodes: [],
    selectedEdges: [],
    isExecuting: false,
    executionResult: null,
    executionError: null,
  };

  constructor(options: StoreAdapterOptions = {}) {
    super();
    this.apiBaseUrl = options.apiBaseUrl || this.config.get('api.baseUrl', 'http://localhost:3001/api');
    this.pollIntervalMs = options.pollIntervalMs || 1000; // Poll every second
    this.maxRetries = options.maxRetries || 3;
    this.offlineMode = options.offlineMode ?? false;
  }

  /**
   * Initialize adapter and connect to remote store
   */
  async initialize(): Promise<void> {
    try {
      await this.logger.info('Initializing StoreAdapter', {
        apiBaseUrl: this.apiBaseUrl,
        offlineMode: this.offlineMode,
      });

      if (!this.offlineMode) {
        await this.connect();
      } else {
        await this.logger.info('StoreAdapter running in offline mode');
        this.status = 'disconnected';
      }
    } catch (error) {
      await this.logger.error('Failed to initialize StoreAdapter', error as Error);
      throw new Error(`Initialization failed: ${(error as Error).message}`);
    }
  }

  /**
   * Connect to remote store
   */
  async connect(): Promise<void> {
    if (this.status === 'connected' || this.status === 'connecting') {
      return;
    }

    try {
      this.status = 'connecting';
      this.emit('status-changed', this.status);

      await this.logger.debug('Connecting to remote store');

      // Test connection by fetching current state
      await this.fetchRemoteState();

      this.status = 'connected';
      this.reconnectAttempts = 0;
      this.emit('status-changed', this.status);

      await this.logger.info('Connected to remote store');

      // Start polling for state changes
      this.startPolling();
    } catch (error) {
      this.status = 'error';
      this.emit('status-changed', this.status);

      await this.logger.error('Failed to connect to remote store', error as Error);

      // Attempt reconnection
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from remote store
   */
  async disconnect(): Promise<void> {
    try {
      await this.logger.debug('Disconnecting from remote store');

      this.stopPolling();
      this.status = 'disconnected';
      this.emit('status-changed', this.status);

      await this.logger.info('Disconnected from remote store');
    } catch (error) {
      await this.logger.error('Error during disconnect', error as Error);
    }
  }

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Check if connected to remote store
   */
  isConnected(): boolean {
    return this.status === 'connected';
  }

  /**
   * Get cached store state
   */
  getState(): StoreState {
    return { ...this.cachedState };
  }

  /**
   * Set nodes in remote store
   */
  async setNodes(nodes: WorkflowNode[]): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Not connected to remote store');
    }

    try {
      await this.logger.debug('Setting nodes in remote store', { count: nodes.length });

      // Convert to React Flow format
      const { nodes: reactFlowNodes } = this.serializer.convertToReactFlow(nodes, []);

      await this.apiCall('/store/nodes', 'PUT', { nodes: reactFlowNodes });

      // Update local cache
      this.cachedState.nodes = nodes;
      this.emit('nodes-updated', nodes);

      await this.logger.info('Nodes updated in remote store', { count: nodes.length });
    } catch (error) {
      await this.logger.error('Failed to set nodes', error as Error);
      throw error;
    }
  }

  /**
   * Set edges in remote store
   */
  async setEdges(edges: WorkflowEdge[]): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Not connected to remote store');
    }

    try {
      await this.logger.debug('Setting edges in remote store', { count: edges.length });

      // Convert to React Flow format
      const { edges: reactFlowEdges } = this.serializer.convertToReactFlow([], edges);

      await this.apiCall('/store/edges', 'PUT', { edges: reactFlowEdges });

      // Update local cache
      this.cachedState.edges = edges;
      this.emit('edges-updated', edges);

      await this.logger.info('Edges updated in remote store', { count: edges.length });
    } catch (error) {
      await this.logger.error('Failed to set edges', error as Error);
      throw error;
    }
  }

  /**
   * Add node to remote store
   */
  async addNode(node: WorkflowNode): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Not connected to remote store');
    }

    try {
      await this.logger.debug('Adding node to remote store', { nodeId: node.id });

      const { nodes: reactFlowNodes } = this.serializer.convertToReactFlow([node], []);

      await this.apiCall('/store/nodes', 'POST', { node: reactFlowNodes[0] });

      // Update local cache
      this.cachedState.nodes.push(node);
      this.emit('node-added', node);

      await this.logger.info('Node added to remote store', { nodeId: node.id });
    } catch (error) {
      await this.logger.error('Failed to add node', error as Error);
      throw error;
    }
  }

  /**
   * Update node in remote store
   */
  async updateNode(nodeId: string, updates: Partial<WorkflowNode>): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Not connected to remote store');
    }

    try {
      await this.logger.debug('Updating node in remote store', { nodeId });

      await this.apiCall(`/store/nodes/${nodeId}`, 'PATCH', { updates });

      // Update local cache
      const nodeIndex = this.cachedState.nodes.findIndex(n => n.id === nodeId);
      if (nodeIndex !== -1) {
        this.cachedState.nodes[nodeIndex] = {
          ...this.cachedState.nodes[nodeIndex],
          ...updates,
        };
        this.emit('node-updated', nodeId, updates);
      }

      await this.logger.info('Node updated in remote store', { nodeId });
    } catch (error) {
      await this.logger.error('Failed to update node', error as Error);
      throw error;
    }
  }

  /**
   * Delete node from remote store
   */
  async deleteNode(nodeId: string): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Not connected to remote store');
    }

    try {
      await this.logger.debug('Deleting node from remote store', { nodeId });

      await this.apiCall(`/store/nodes/${nodeId}`, 'DELETE');

      // Update local cache
      this.cachedState.nodes = this.cachedState.nodes.filter(n => n.id !== nodeId);
      this.cachedState.edges = this.cachedState.edges.filter(
        e => e.source !== nodeId && e.target !== nodeId
      );
      this.emit('node-deleted', nodeId);

      await this.logger.info('Node deleted from remote store', { nodeId });
    } catch (error) {
      await this.logger.error('Failed to delete node', error as Error);
      throw error;
    }
  }

  /**
   * Load workflow into remote store
   */
  async loadWorkflow(workflow: Workflow): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Not connected to remote store');
    }

    try {
      await this.logger.debug('Loading workflow into remote store', {
        workflowId: workflow.metadata.id,
      });

      // Convert to React Flow format
      const { nodes, edges } = this.serializer.convertToReactFlow(
        workflow.nodes,
        workflow.edges
      );

      await this.apiCall('/store/workflow', 'POST', { nodes, edges, metadata: workflow.metadata });

      // Update local cache
      this.cachedState.nodes = workflow.nodes;
      this.cachedState.edges = workflow.edges;
      this.emit('workflow-loaded', workflow);

      await this.logger.info('Workflow loaded into remote store', {
        workflowId: workflow.metadata.id,
      });
    } catch (error) {
      await this.logger.error('Failed to load workflow', error as Error);
      throw error;
    }
  }

  /**
   * Clear workflow from remote store
   */
  async clearWorkflow(): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Not connected to remote store');
    }

    try {
      await this.logger.debug('Clearing workflow from remote store');

      await this.apiCall('/store/clear', 'POST');

      // Update local cache
      this.cachedState.nodes = [];
      this.cachedState.edges = [];
      this.emit('workflow-cleared');

      await this.logger.info('Workflow cleared from remote store');
    } catch (error) {
      await this.logger.error('Failed to clear workflow', error as Error);
      throw error;
    }
  }

  /**
   * Fetch current state from remote store
   */
  private async fetchRemoteState(): Promise<void> {
    try {
      const response = await this.apiCall('/store/state', 'GET');

      // Convert from React Flow format
      const { nodes, edges } = this.serializer.convertFromReactFlow(
        response.nodes || [],
        response.edges || []
      );

      // Update local cache
      const previousState = { ...this.cachedState };
      this.cachedState = {
        nodes,
        edges,
        selectedNodes: response.selectedNodes || [],
        selectedEdges: response.selectedEdges || [],
        isExecuting: response.isExecuting || false,
        executionResult: response.executionResult || null,
        executionError: response.executionError || null,
      };

      // Emit change events if state changed
      if (JSON.stringify(previousState) !== JSON.stringify(this.cachedState)) {
        this.emit('state-changed', this.cachedState);
      }
    } catch (error) {
      throw new Error(`Failed to fetch remote state: ${(error as Error).message}`);
    }
  }

  /**
   * Make API call to remote store
   */
  private async apiCall(endpoint: string, method: string, body?: any): Promise<any> {
    const url = `${this.apiBaseUrl}${endpoint}`;

    return await RetryStrategy.execute(
      async () => {
        const options: any = {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
        };

        if (body) {
          options.body = JSON.stringify(body);
        }

        // Note: In Node.js, we'd use node-fetch or similar
        // For now, this is a placeholder that assumes fetch is available
        const response = await fetch(url, options);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `API call failed: ${response.statusText}`);
        }

        // Handle empty responses
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          return await response.json();
        }

        return null;
      },
      'apiCall',
      { maxRetries: this.maxRetries, initialDelayMs: 100 }
    );
  }

  /**
   * Start polling for state changes
   */
  private startPolling(): void {
    if (this.pollTimer) {
      return;
    }

    this.pollTimer = setInterval(async () => {
      try {
        await this.fetchRemoteState();
      } catch (error) {
        await this.logger.warn('Poll failed', { error: (error as Error).message });

        // Disconnect and attempt reconnection if polling fails
        this.status = 'error';
        this.emit('status-changed', this.status);
        this.stopPolling();
        this.scheduleReconnect();
      }
    }, this.pollIntervalMs);

    this.logger.debug('Started polling for state changes');
  }

  /**
   * Stop polling for state changes
   */
  private stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
      this.logger.debug('Stopped polling for state changes');
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    this.reconnectAttempts++;

    if (this.reconnectAttempts > this.maxRetries) {
      this.logger.warn('Max reconnection attempts reached, entering offline mode');
      this.offlineMode = true;
      this.emit('offline-mode');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000);

    this.logger.info('Scheduling reconnection attempt', {
      attempt: this.reconnectAttempts,
      delayMs: delay,
    });

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * Shutdown adapter
   */
  async shutdown(): Promise<void> {
    await this.logger.info('Shutting down StoreAdapter');
    await this.disconnect();
    this.removeAllListeners();
  }
}
