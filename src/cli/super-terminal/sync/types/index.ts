/**
 * Shared Type Definitions for Workflow Sync
 *
 * Compatible with both TUI and React Flow frontend
 * Based on @xyflow/react types
 */

// Re-export React Flow types for consistency
export interface Position {
  x: number;
  y: number;
}

export interface NodeData {
  label: string;
  [key: string]: any;
}

export interface WorkflowNode {
  id: string;
  type?: string;
  position: Position;
  data: NodeData;
  selected?: boolean;
  dragging?: boolean;
  width?: number;
  height?: number;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
  label?: string;
  selected?: boolean;
}

export interface WorkflowMetadata {
  id: string;
  name: string;
  description?: string;
  version: string;
  author?: string;
  createdAt: number;
  updatedAt: number;
  tags?: string[];
}

export interface Workflow {
  metadata: WorkflowMetadata;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface WorkflowSchema {
  $schema: string;
  version: string;
  workflow: Workflow;
}

// Sync-specific types
export interface SyncState {
  status: 'connected' | 'disconnected' | 'syncing' | 'error';
  lastSync: number | null;
  pendingChanges: number;
  error: string | null;
}

export interface SyncEvent {
  type: 'node-added' | 'node-updated' | 'node-deleted' | 'edge-added' | 'edge-updated' | 'edge-deleted' | 'workflow-loaded';
  payload: any;
  timestamp: number;
  source: 'tui' | 'frontend';
}

export interface WorkflowChange {
  type: 'add' | 'update' | 'delete';
  entity: 'node' | 'edge';
  id: string;
  data?: any;
  timestamp: number;
}

// Validation types
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

// Export/Import types
export interface ExportOptions {
  includeMetadata?: boolean;
  compress?: boolean;
  format?: 'json' | 'yaml';
  prettyPrint?: boolean;
}

export interface ImportOptions {
  overwrite?: boolean;
  merge?: boolean;
  validate?: boolean;
  generateNewIds?: boolean;
}

export interface ImportResult {
  success: boolean;
  workflow?: Workflow;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

// Constants
export const WORKFLOW_SCHEMA_VERSION = '1.0.0';
export const WORKFLOW_SCHEMA_URL = 'https://gemini-flow.dev/schema/workflow/v1';

// Default workflow metadata
export const createDefaultMetadata = (name: string): WorkflowMetadata => ({
  id: `workflow-${Date.now()}`,
  name,
  version: WORKFLOW_SCHEMA_VERSION,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  tags: [],
});

// Create empty workflow
export const createEmptyWorkflow = (name: string): Workflow => ({
  metadata: createDefaultMetadata(name),
  nodes: [],
  edges: [],
});
