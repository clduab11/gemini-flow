/**
 * Sync Module - Zustand Store Integration & Workflow Persistence
 *
 * Exports:
 * - Types and interfaces
 * - WorkflowSerializer - JSON/YAML serialization
 * - PersistenceManager - File-based storage
 * - StoreAdapter - Zustand store connection
 * - StateSynchronizer - Bidirectional sync orchestration
 * - ExportImportService - Import/export functionality
 */

// Export types
export * from './types/index.js';

// Export core components
export { WorkflowSerializer } from './WorkflowSerializer.js';
export { PersistenceManager } from './PersistenceManager.js';
export { StoreAdapter } from './StoreAdapter.js';
export { StateSynchronizer } from './StateSynchronizer.js';
export { ExportImportService } from './ExportImportService.js';

// Export type definitions from components
export type { StoreState, StoreAdapterOptions, ConnectionStatus } from './StoreAdapter.js';
export type { SynchronizerOptions, ConflictResolution, SyncDirection } from './StateSynchronizer.js';
export type { ExportResult, BatchExportResult, BatchImportResult } from './ExportImportService.js';
export type { PersistenceOptions } from './PersistenceManager.js';
