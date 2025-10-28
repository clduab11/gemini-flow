/**
 * State Synchronizer - Bidirectional sync orchestrator
 *
 * Features:
 * - Orchestrates sync between TUI, Store, and File System
 * - Debounced sync to prevent excessive updates
 * - Conflict resolution strategies
 * - Sync direction control (TUI → Store, Store → TUI)
 * - Change tracking and sync status
 * - Manual and automatic sync modes
 */

import EventEmitter from 'events';
import { getLogger } from '../utils/Logger.js';
import { getConfig } from '../utils/Config.js';
import { StoreAdapter, StoreState } from './StoreAdapter.js';
import { PersistenceManager } from './PersistenceManager.js';
import { WorkflowSerializer } from './WorkflowSerializer.js';
import { Workflow, WorkflowChange, SyncState } from './types/index.js';

export interface SynchronizerOptions {
  autoSync?: boolean;
  debounceMs?: number;
  conflictResolution?: ConflictResolution;
}

export type ConflictResolution = 'local-wins' | 'remote-wins' | 'newest-wins' | 'manual';
export type SyncDirection = 'to-store' | 'to-local' | 'bidirectional';

export class StateSynchronizer extends EventEmitter {
  private logger = getLogger();
  private config = getConfig();
  private storeAdapter: StoreAdapter;
  private persistenceManager: PersistenceManager;
  private serializer = new WorkflowSerializer();

  private autoSync: boolean;
  private debounceMs: number;
  private conflictResolution: ConflictResolution;

  // Sync state
  private syncState: SyncState = {
    status: 'disconnected',
    lastSync: null,
    pendingChanges: 0,
    error: null,
  };

  // Debounce timers
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  // Change queue
  private pendingChanges: WorkflowChange[] = [];

  // Currently loaded workflow
  private currentWorkflow: Workflow | null = null;

  constructor(
    storeAdapter: StoreAdapter,
    persistenceManager: PersistenceManager,
    options: SynchronizerOptions = {}
  ) {
    super();
    this.storeAdapter = storeAdapter;
    this.persistenceManager = persistenceManager;

    this.autoSync = options.autoSync ?? true;
    this.debounceMs = options.debounceMs ?? 500;
    this.conflictResolution = options.conflictResolution || 'newest-wins';
  }

  /**
   * Initialize synchronizer
   */
  async initialize(): Promise<void> {
    try {
      await this.logger.info('Initializing StateSynchronizer', {
        autoSync: this.autoSync,
        debounceMs: this.debounceMs,
        conflictResolution: this.conflictResolution,
      });

      // Subscribe to store adapter events
      this.storeAdapter.on('state-changed', this.handleStoreStateChanged.bind(this));
      this.storeAdapter.on('status-changed', this.handleStoreStatusChanged.bind(this));
      this.storeAdapter.on('workflow-loaded', this.handleWorkflowLoaded.bind(this));
      this.storeAdapter.on('offline-mode', this.handleOfflineMode.bind(this));

      // Update sync state based on store status
      this.updateSyncState();

      await this.logger.info('StateSynchronizer initialized');
    } catch (error) {
      await this.logger.error('Failed to initialize StateSynchronizer', error as Error);
      throw new Error(`Initialization failed: ${(error as Error).message}`);
    }
  }

  /**
   * Load workflow and sync to store
   */
  async loadWorkflow(workflowId: string): Promise<Workflow> {
    try {
      await this.logger.info('Loading workflow', { workflowId });

      // Load from persistence
      const workflow = await this.persistenceManager.loadWorkflow(workflowId);

      // Set as current workflow
      this.currentWorkflow = workflow;

      // Sync to store if connected
      if (this.storeAdapter.isConnected() && this.autoSync) {
        await this.syncToStore(workflow);
      }

      this.emit('workflow-loaded', workflow);

      await this.logger.info('Workflow loaded and synced', { workflowId });

      return workflow;
    } catch (error) {
      await this.logger.error('Failed to load workflow', error as Error, { workflowId });
      throw error;
    }
  }

  /**
   * Save workflow and sync to store
   */
  async saveWorkflow(workflow: Workflow): Promise<void> {
    try {
      await this.logger.info('Saving workflow', { workflowId: workflow.metadata.id });

      // Save to persistence
      await this.persistenceManager.saveWorkflow(workflow);

      // Set as current workflow
      this.currentWorkflow = workflow;

      // Sync to store if connected
      if (this.storeAdapter.isConnected() && this.autoSync) {
        await this.syncToStore(workflow);
      }

      this.emit('workflow-saved', workflow);

      await this.logger.info('Workflow saved and synced', {
        workflowId: workflow.metadata.id,
      });
    } catch (error) {
      await this.logger.error('Failed to save workflow', error as Error);
      throw error;
    }
  }

  /**
   * Sync workflow to remote store
   */
  async syncToStore(workflow: Workflow): Promise<void> {
    if (!this.storeAdapter.isConnected()) {
      throw new Error('Store adapter not connected');
    }

    try {
      await this.logger.debug('Syncing workflow to store', {
        workflowId: workflow.metadata.id,
      });

      this.syncState.status = 'syncing';
      this.emit('sync-state-changed', this.syncState);

      // Load workflow into store
      await this.storeAdapter.loadWorkflow(workflow);

      this.syncState.status = 'connected';
      this.syncState.lastSync = Date.now();
      this.syncState.pendingChanges = 0;
      this.emit('sync-state-changed', this.syncState);

      await this.logger.info('Workflow synced to store', {
        workflowId: workflow.metadata.id,
      });
    } catch (error) {
      this.syncState.status = 'error';
      this.syncState.error = (error as Error).message;
      this.emit('sync-state-changed', this.syncState);

      await this.logger.error('Failed to sync to store', error as Error);
      throw error;
    }
  }

  /**
   * Sync workflow from remote store
   */
  async syncFromStore(): Promise<Workflow | null> {
    if (!this.storeAdapter.isConnected()) {
      throw new Error('Store adapter not connected');
    }

    try {
      await this.logger.debug('Syncing workflow from store');

      this.syncState.status = 'syncing';
      this.emit('sync-state-changed', this.syncState);

      // Get current store state
      const storeState = this.storeAdapter.getState();

      if (storeState.nodes.length === 0 && storeState.edges.length === 0) {
        await this.logger.info('Store is empty, nothing to sync');
        return null;
      }

      // Create workflow from store state
      const workflow: Workflow = {
        metadata: {
          id: this.currentWorkflow?.metadata.id || `workflow-${Date.now()}`,
          name: this.currentWorkflow?.metadata.name || 'Imported Workflow',
          version: '1.0.0',
          createdAt: this.currentWorkflow?.metadata.createdAt || Date.now(),
          updatedAt: Date.now(),
        },
        nodes: storeState.nodes,
        edges: storeState.edges,
      };

      // Handle conflicts if current workflow exists
      if (this.currentWorkflow) {
        const resolvedWorkflow = await this.resolveConflict(this.currentWorkflow, workflow);
        this.currentWorkflow = resolvedWorkflow;
      } else {
        this.currentWorkflow = workflow;
      }

      // Save to persistence
      await this.persistenceManager.saveWorkflow(this.currentWorkflow);

      this.syncState.status = 'connected';
      this.syncState.lastSync = Date.now();
      this.syncState.pendingChanges = 0;
      this.emit('sync-state-changed', this.syncState);

      this.emit('workflow-synced-from-store', this.currentWorkflow);

      await this.logger.info('Workflow synced from store');

      return this.currentWorkflow;
    } catch (error) {
      this.syncState.status = 'error';
      this.syncState.error = (error as Error).message;
      this.emit('sync-state-changed', this.syncState);

      await this.logger.error('Failed to sync from store', error as Error);
      throw error;
    }
  }

  /**
   * Perform bidirectional sync
   */
  async performSync(direction: SyncDirection = 'bidirectional'): Promise<void> {
    try {
      await this.logger.info('Performing sync', { direction });

      switch (direction) {
        case 'to-store':
          if (this.currentWorkflow) {
            await this.syncToStore(this.currentWorkflow);
          }
          break;

        case 'to-local':
          await this.syncFromStore();
          break;

        case 'bidirectional':
          // First check if there are local changes
          if (this.pendingChanges.length > 0) {
            await this.processPendingChanges();
          }

          // Then sync from store if needed
          if (this.storeAdapter.isConnected()) {
            await this.syncFromStore();
          }
          break;
      }

      await this.logger.info('Sync completed', { direction });
    } catch (error) {
      await this.logger.error('Sync failed', error as Error, { direction });
      throw error;
    }
  }

  /**
   * Queue a workflow change
   */
  queueChange(change: WorkflowChange): void {
    this.pendingChanges.push(change);
    this.syncState.pendingChanges = this.pendingChanges.length;
    this.emit('sync-state-changed', this.syncState);

    if (this.autoSync) {
      this.debouncedSync();
    }
  }

  /**
   * Process pending changes
   */
  private async processPendingChanges(): Promise<void> {
    if (this.pendingChanges.length === 0) {
      return;
    }

    try {
      await this.logger.debug('Processing pending changes', {
        count: this.pendingChanges.length,
      });

      // Apply changes to current workflow
      if (this.currentWorkflow) {
        for (const change of this.pendingChanges) {
          this.applyChange(this.currentWorkflow, change);
        }

        // Save and sync
        await this.saveWorkflow(this.currentWorkflow);
      }

      // Clear pending changes
      this.pendingChanges = [];
      this.syncState.pendingChanges = 0;
      this.emit('sync-state-changed', this.syncState);

      await this.logger.info('Pending changes processed');
    } catch (error) {
      await this.logger.error('Failed to process pending changes', error as Error);
      throw error;
    }
  }

  /**
   * Apply a single change to workflow
   */
  private applyChange(workflow: Workflow, change: WorkflowChange): void {
    switch (change.entity) {
      case 'node':
        if (change.type === 'add' && change.data) {
          workflow.nodes.push(change.data);
        } else if (change.type === 'update' && change.data) {
          const nodeIndex = workflow.nodes.findIndex(n => n.id === change.id);
          if (nodeIndex !== -1) {
            workflow.nodes[nodeIndex] = { ...workflow.nodes[nodeIndex], ...change.data };
          }
        } else if (change.type === 'delete') {
          workflow.nodes = workflow.nodes.filter(n => n.id !== change.id);
          // Also remove edges connected to this node
          workflow.edges = workflow.edges.filter(
            e => e.source !== change.id && e.target !== change.id
          );
        }
        break;

      case 'edge':
        if (change.type === 'add' && change.data) {
          workflow.edges.push(change.data);
        } else if (change.type === 'update' && change.data) {
          const edgeIndex = workflow.edges.findIndex(e => e.id === change.id);
          if (edgeIndex !== -1) {
            workflow.edges[edgeIndex] = { ...workflow.edges[edgeIndex], ...change.data };
          }
        } else if (change.type === 'delete') {
          workflow.edges = workflow.edges.filter(e => e.id !== change.id);
        }
        break;
    }

    // Update timestamp
    workflow.metadata.updatedAt = Date.now();
  }

  /**
   * Resolve conflicts between local and remote workflows
   */
  private async resolveConflict(local: Workflow, remote: Workflow): Promise<Workflow> {
    await this.logger.warn('Conflict detected between local and remote workflows', {
      localId: local.metadata.id,
      remoteId: remote.metadata.id,
      strategy: this.conflictResolution,
    });

    switch (this.conflictResolution) {
      case 'local-wins':
        return local;

      case 'remote-wins':
        return remote;

      case 'newest-wins':
        return local.metadata.updatedAt > remote.metadata.updatedAt ? local : remote;

      case 'manual':
        // Emit conflict event for manual resolution
        this.emit('conflict-detected', { local, remote });
        // Default to local for now
        return local;

      default:
        return local;
    }
  }

  /**
   * Debounced sync
   */
  private debouncedSync(): void {
    const key = 'sync';

    // Clear existing timer
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key)!);
    }

    // Set new timer
    const timer = setTimeout(async () => {
      try {
        await this.processPendingChanges();
      } catch (error) {
        await this.logger.error('Debounced sync failed', error as Error);
      }
      this.debounceTimers.delete(key);
    }, this.debounceMs);

    this.debounceTimers.set(key, timer);
  }

  /**
   * Handle store state changed event
   */
  private async handleStoreStateChanged(state: StoreState): Promise<void> {
    await this.logger.debug('Store state changed', {
      nodes: state.nodes.length,
      edges: state.edges.length,
    });

    if (this.autoSync) {
      // Sync from store to local
      await this.syncFromStore().catch(error => {
        this.logger.error('Failed to sync from store after state change', error);
      });
    }

    this.emit('remote-state-changed', state);
  }

  /**
   * Handle store status changed event
   */
  private handleStoreStatusChanged(status: string): void {
    this.logger.info('Store connection status changed', { status });
    this.updateSyncState();
    this.emit('connection-status-changed', status);
  }

  /**
   * Handle workflow loaded event
   */
  private async handleWorkflowLoaded(workflow: Workflow): Promise<void> {
    await this.logger.info('Workflow loaded in store', {
      workflowId: workflow.metadata.id,
    });

    if (this.autoSync) {
      this.currentWorkflow = workflow;
      await this.persistenceManager.saveWorkflow(workflow);
    }
  }

  /**
   * Handle offline mode event
   */
  private handleOfflineMode(): void {
    this.logger.warn('Store adapter entered offline mode');
    this.syncState.status = 'disconnected';
    this.syncState.error = 'Store adapter offline';
    this.emit('sync-state-changed', this.syncState);
  }

  /**
   * Update sync state based on store status
   */
  private updateSyncState(): void {
    const storeStatus = this.storeAdapter.getStatus();

    switch (storeStatus) {
      case 'connected':
        this.syncState.status = 'connected';
        this.syncState.error = null;
        break;

      case 'disconnected':
      case 'error':
        this.syncState.status = 'disconnected';
        break;

      case 'connecting':
        this.syncState.status = 'syncing';
        break;
    }

    this.emit('sync-state-changed', this.syncState);
  }

  /**
   * Get current sync state
   */
  getSyncState(): SyncState {
    return { ...this.syncState };
  }

  /**
   * Get current workflow
   */
  getCurrentWorkflow(): Workflow | null {
    return this.currentWorkflow;
  }

  /**
   * Enable auto-sync
   */
  enableAutoSync(): void {
    this.autoSync = true;
    this.logger.info('Auto-sync enabled');
  }

  /**
   * Disable auto-sync
   */
  disableAutoSync(): void {
    this.autoSync = false;
    this.logger.info('Auto-sync disabled');
  }

  /**
   * Shutdown synchronizer
   */
  async shutdown(): Promise<void> {
    await this.logger.info('Shutting down StateSynchronizer');

    // Clear all debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();

    // Process any pending changes
    if (this.pendingChanges.length > 0) {
      await this.processPendingChanges().catch(error => {
        this.logger.error('Failed to process pending changes during shutdown', error);
      });
    }

    // Remove event listeners
    this.storeAdapter.removeAllListeners();
    this.removeAllListeners();

    await this.logger.info('StateSynchronizer shut down');
  }
}
