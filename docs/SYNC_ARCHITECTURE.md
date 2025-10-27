# Gemini Flow - Sync Architecture

**Version:** 1.0.0
**Sprint:** 6 - Zustand Store Integration & Workflow Persistence
**Date:** October 27, 2025

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Component Descriptions](#component-descriptions)
4. [Data Flow](#data-flow)
5. [Synchronization Strategies](#synchronization-strategies)
6. [Error Handling](#error-handling)
7. [Performance Considerations](#performance-considerations)
8. [Security](#security)

---

## Overview

The Gemini Flow Sync Architecture provides bidirectional state synchronization between the TUI (Terminal User Interface) and the React Flow web frontend, with persistent file-based storage. This enables users to work seamlessly across both interfaces while maintaining data consistency and durability.

### Key Features

- **Bidirectional Sync**: Real-time state updates between TUI and web frontend
- **File Persistence**: Workflow storage in `~/.gemini-flow/workflows/`
- **JSON/YAML Support**: Human-readable workflow formats with schema validation
- **Conflict Resolution**: Configurable strategies for handling concurrent changes
- **Auto-save**: Configurable automatic workflow persistence
- **Backup & Recovery**: Automatic backup creation with corruption recovery
- **Export/Import**: Portable workflow files for sharing and migration

### Design Principles

1. **Event-Driven Architecture**: Components communicate via EventEmitter for loose coupling
2. **Separation of Concerns**: Clear boundaries between sync, persistence, and UI layers
3. **Sprint 4 Integration**: Built on production-grade Logger, Config, Security, and Retry utilities
4. **Graceful Degradation**: TUI works offline when frontend is unavailable
5. **Type Safety**: Shared TypeScript interfaces between TUI and frontend

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         TUI Application                          │
│                                                                  │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐   │
│  │  Dashboard   │     │   Workflow   │     │  Execution   │   │
│  │   Screen     │────▶│   Builder    │────▶│   Monitor    │   │
│  └──────────────┘     └──────────────┘     └──────────────┘   │
│          │                    │                     │           │
│          └────────────────────┼─────────────────────┘           │
│                               │                                 │
│                        ┌──────▼───────┐                         │
│                        │  TuiManager  │                         │
│                        └──────┬───────┘                         │
└───────────────────────────────┼─────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
        ┌───────▼──────┐ ┌─────▼──────┐ ┌─────▼───────┐
        │    State     │ │   Store    │ │Persistence  │
        │Synchronizer  │ │  Adapter   │ │  Manager    │
        └───────┬──────┘ └─────┬──────┘ └─────┬───────┘
                │               │               │
                │               │               │
        ┌───────▼──────┐ ┌─────▼──────┐ ┌─────▼───────┐
        │  Workflow    │ │  HTTP/WS   │ │  File I/O   │
        │ Serializer   │ │  Client    │ │   + Backup  │
        └──────────────┘ └─────┬──────┘ └─────┬───────┘
                                │               │
                        ┌───────▼───────┐       │
                        │  React Flow   │       │
                        │Zustand Store  │       │
                        │ (Frontend)    │       │
                        └───────────────┘       │
                                                │
                                    ┌───────────▼────────────┐
                                    │ ~/.gemini-flow/        │
                                    │   workflows/           │
                                    │   └── .backups/        │
                                    └────────────────────────┘
```

---

## Component Descriptions

### 1. StateSynchronizer

**File**: `src/cli/super-terminal/sync/StateSynchronizer.ts`
**Lines**: 450+
**Role**: Orchestrates bidirectional synchronization between TUI, remote store, and persistence

**Key Responsibilities**:
- Coordinate sync operations across components
- Manage change queues and debouncing
- Resolve conflicts between local and remote state
- Track sync status and emit events
- Handle automatic and manual sync modes

**Configuration Options**:
```typescript
interface SynchronizerOptions {
  autoSync?: boolean;        // Default: true
  debounceMs?: number;       // Default: 500ms
  conflictResolution?: ConflictResolution; // 'local-wins' | 'remote-wins' | 'newest-wins' | 'manual'
}
```

**Event Emissions**:
- `sync-state-changed` - Sync status updates
- `workflow-loaded` - Workflow loaded from any source
- `workflow-saved` - Workflow saved to persistence
- `conflict-detected` - Conflict requires manual resolution
- `remote-state-changed` - Store state updated

**Methods**:
```typescript
async loadWorkflow(workflowId: string): Promise<Workflow>
async saveWorkflow(workflow: Workflow): Promise<void>
async syncToStore(workflow: Workflow): Promise<void>
async syncFromStore(): Promise<Workflow | null>
async performSync(direction: SyncDirection): Promise<void>
queueChange(change: WorkflowChange): void
getSyncState(): SyncState
```

### 2. StoreAdapter

**File**: `src/cli/super-terminal/sync/StoreAdapter.ts`
**Lines**: 480+
**Role**: Bridge between TUI and React Flow Zustand store via HTTP/WebSocket

**Key Responsibilities**:
- Maintain connection to frontend API
- Poll for remote state changes
- Transform between TUI and React Flow formats
- Cache remote state locally
- Handle connection failures and reconnection
- Support offline mode gracefully

**Configuration**:
```typescript
interface StoreAdapterOptions {
  apiBaseUrl?: string;       // Default: http://localhost:3001/api
  pollIntervalMs?: number;   // Default: 1000ms
  maxRetries?: number;       // Default: 3
  offlineMode?: boolean;     // Default: false
}
```

**Connection States**:
- `connected` - Active connection to frontend
- `disconnected` - No connection (offline mode)
- `connecting` - Connection in progress
- `error` - Connection failed, will retry

**Methods**:
```typescript
async initialize(): Promise<void>
async connect(): Promise<void>
async disconnect(): Promise<void>
async setNodes(nodes: WorkflowNode[]): Promise<void>
async setEdges(edges: WorkflowEdge[]): Promise<void>
async loadWorkflow(workflow: Workflow): Promise<void>
getState(): StoreState
getStatus(): ConnectionStatus
```

### 3. PersistenceManager

**File**: `src/cli/super-terminal/sync/PersistenceManager.ts`
**Lines**: 410+
**Role**: File-based workflow storage with backup and recovery

**Key Responsibilities**:
- Save/load workflows to `~/.gemini-flow/workflows/`
- Automatic backup creation before saves
- Maintain up to 5 timestamped backups per workflow
- Recover from file corruption using backups
- Auto-save workflows at configurable intervals
- Integration with RetryStrategy for transient failures

**Configuration**:
```typescript
interface PersistenceOptions {
  workflowsDir?: string;        // Default: ~/.gemini-flow/workflows
  backupsEnabled?: boolean;     // Default: true
  maxBackups?: number;          // Default: 5
  autoSaveEnabled?: boolean;    // Default: false
  autoSaveIntervalMs?: number;  // Default: 30000ms
}
```

**File Structure**:
```
~/.gemini-flow/
└── workflows/
    ├── workflow-123.json
    ├── workflow-456.json
    └── .backups/
        ├── workflow-123.1698432000000.json
        ├── workflow-123.1698431500000.json
        └── workflow-456.1698432100000.json
```

**Methods**:
```typescript
async initialize(): Promise<void>
async saveWorkflow(workflow: Workflow): Promise<string>
async loadWorkflow(workflowId: string): Promise<Workflow>
async deleteWorkflow(workflowId: string): Promise<void>
async listWorkflows(): Promise<Workflow[]>
async workflowExists(workflowId: string): Promise<boolean>
enableAutoSave(workflowId: string, workflow: Workflow): void
disableAutoSave(workflowId: string): void
```

### 4. WorkflowSerializer

**File**: `src/cli/super-terminal/sync/WorkflowSerializer.ts`
**Lines**: 320+
**Role**: JSON/YAML serialization with validation and format conversion

**Key Responsibilities**:
- Serialize workflows to JSON or YAML
- Deserialize with comprehensive validation
- Convert between React Flow and TUI formats
- Schema version migration
- Validate workflow structure and references

**Validation Coverage**:
- Required metadata fields (id, name, version)
- Node structure (id, position, data)
- Edge structure (id, source, target)
- Node reference integrity (edges point to valid nodes)
- Duplicate ID detection
- Position coordinate validation
- Version compatibility checks

**Methods**:
```typescript
async serializeToJson(workflow: Workflow, prettyPrint?: boolean): Promise<string>
async deserializeFromJson(json: string): Promise<Workflow>
async serializeToYaml(workflow: Workflow): Promise<string>
async deserializeFromYaml(yaml: string): Promise<Workflow>
async validateWorkflow(data: any): Promise<ValidationResult>
async migrateWorkflow(workflow: any, fromVersion: string): Promise<Workflow>
convertFromReactFlow(nodes: any[], edges: any[]): { nodes: WorkflowNode[]; edges: WorkflowEdge[] }
convertToReactFlow(nodes: WorkflowNode[], edges: WorkflowEdge[]): { nodes: any[]; edges: any[] }
```

### 5. ExportImportService

**File**: `src/cli/super-terminal/sync/ExportImportService.ts`
**Lines**: 380+
**Role**: Workflow portability and sharing via file export/import

**Key Responsibilities**:
- Export workflows to standalone files
- Import workflows with conflict detection
- Batch export/import operations
- ID regeneration for imported workflows
- Merge imported workflows with existing ones

**Export Options**:
```typescript
interface ExportOptions {
  includeMetadata?: boolean;  // Default: true
  compress?: boolean;         // Future feature
  format?: 'json' | 'yaml';   // Default: 'json'
  prettyPrint?: boolean;      // Default: true
}
```

**Import Options**:
```typescript
interface ImportOptions {
  overwrite?: boolean;       // Overwrite existing workflow
  merge?: boolean;           // Merge with existing workflow
  validate?: boolean;        // Validate before import (default: true)
  generateNewIds?: boolean;  // Generate new IDs to avoid conflicts
}
```

**Methods**:
```typescript
async exportWorkflow(workflowId: string, outputPath: string, options?: ExportOptions): Promise<ExportResult>
async importWorkflow(inputPath: string, options?: ImportOptions): Promise<ImportResult>
async exportAll(outputDir: string, options?: ExportOptions): Promise<BatchExportResult>
async importAll(inputDir: string, options?: ImportOptions): Promise<BatchImportResult>
```

---

## Data Flow

### 1. TUI → Store → Persistence

**Scenario**: User creates workflow in TUI

```
1. User creates workflow in TUI
   └─▶ TuiManager.createWorkflow(name)

2. TuiManager creates Workflow object
   └─▶ StateSynchronizer.saveWorkflow(workflow)

3. StateSynchronizer saves to persistence
   └─▶ PersistenceManager.saveWorkflow(workflow)
       └─▶ WorkflowSerializer.serializeToJson(workflow)
           └─▶ fs.writeFile(~/.gemini-flow/workflows/workflow-123.json)

4. If connected, sync to store
   └─▶ StoreAdapter.loadWorkflow(workflow)
       └─▶ WorkflowSerializer.convertToReactFlow(nodes, edges)
           └─▶ HTTP POST /api/store/workflow
               └─▶ Zustand store updated in frontend
```

### 2. Store → TUI → Persistence

**Scenario**: User updates workflow in React Flow frontend

```
1. User drags node in React Flow
   └─▶ Zustand store updated

2. StoreAdapter polls for changes
   └─▶ HTTP GET /api/store/state
       └─▶ StoreAdapter.fetchRemoteState()
           └─▶ Emits 'state-changed' event

3. StateSynchronizer receives event
   └─▶ StateSynchronizer.syncFromStore()
       └─▶ WorkflowSerializer.convertFromReactFlow(nodes, edges)
           └─▶ PersistenceManager.saveWorkflow(workflow)

4. TuiManager updates display
   └─▶ TuiManager.updateWorkflowState(workflow)
       └─▶ Emits 'workflows-updated' event
           └─▶ Dashboard screen refreshes
```

### 3. Import → Persistence → Store

**Scenario**: User imports workflow from file

```
1. User imports workflow
   └─▶ TuiManager.importWorkflow(filePath)

2. ExportImportService reads file
   └─▶ fs.readFile(filePath)
       └─▶ WorkflowSerializer.deserializeFromJson(content)
           └─▶ WorkflowSerializer.validateWorkflow(workflow)

3. Check for conflicts
   └─▶ PersistenceManager.workflowExists(workflowId)
       └─▶ If exists: handle conflict resolution
       └─▶ PersistenceManager.saveWorkflow(workflow)

4. Sync to store if connected
   └─▶ StateSynchronizer.syncToStore(workflow)
       └─▶ StoreAdapter.loadWorkflow(workflow)
```

---

## Synchronization Strategies

### Auto-Sync Mode (Default)

When `autoSync: true` (default), changes are automatically synchronized:

**Benefits**:
- Real-time updates across interfaces
- No manual intervention required
- Consistent state at all times

**Trade-offs**:
- Higher network/disk I/O
- Potential for rapid successive syncs

**Debouncing**: 500ms default debounce prevents excessive sync operations

### Manual Sync Mode

When `autoSync: false`, sync must be triggered manually:

```typescript
// Sync from TUI to store
await tuiManager.syncWithStore('to-store');

// Sync from store to TUI
await tuiManager.syncWithStore('to-local');

// Bidirectional sync
await tuiManager.syncWithStore('bidirectional');
```

**Use Cases**:
- Low bandwidth environments
- Batch operations
- Controlled sync timing

### Conflict Resolution Strategies

When local and remote workflows differ:

#### 1. Local Wins (`local-wins`)
```typescript
conflictResolution: 'local-wins'
```
- TUI changes take precedence
- Overwrites remote state
- Simple, predictable behavior

#### 2. Remote Wins (`remote-wins`)
```typescript
conflictResolution: 'remote-wins'
```
- Frontend changes take precedence
- TUI adopts remote state
- Useful for web-first workflows

#### 3. Newest Wins (`newest-wins`) - Default
```typescript
conflictResolution: 'newest-wins'
```
- Compares `updatedAt` timestamps
- Most recent changes win
- Best for single-user scenarios

#### 4. Manual Resolution (`manual`)
```typescript
conflictResolution: 'manual'
```
- Emits `conflict-detected` event
- Application decides resolution
- Full control over merge logic

---

## Error Handling

### Transient Failures

**Retry Strategy**: All network and file operations use RetryStrategy from Sprint 4

```typescript
await RetryStrategy.execute(
  async () => {
    // Operation
  },
  'operationName',
  { maxRetries: 3, initialDelayMs: 100 }
);
```

**Exponential Backoff**:
- Attempt 1: Immediate
- Attempt 2: 100ms delay
- Attempt 3: 200ms delay
- Attempt 4: 400ms delay

### Connection Failures

**Store Adapter Reconnection**:

```
Connection fails
  └─▶ Status: 'error'
      └─▶ Emit 'status-changed' event
          └─▶ Schedule reconnection
              Attempt 1: 1s delay
              Attempt 2: 2s delay
              Attempt 3: 4s delay
              Max 3 attempts
              └─▶ Enter offline mode
```

**Offline Mode**:
- TUI continues to function
- Changes saved to persistence only
- Auto-sync disabled
- Manual sync available when reconnected

### File Corruption

**Backup Recovery**:

```
Load workflow fails
  └─▶ Check for backups
      └─▶ List backups sorted by timestamp (newest first)
          └─▶ Try most recent backup
              └─▶ If successful: restore and continue
              └─▶ If fails: try next backup
                  └─▶ Repeat until success or no more backups
```

**Automatic Backup Creation**:
- Before every save
- Maximum 5 backups per workflow
- Timestamped files
- Automatic cleanup of old backups

### Validation Errors

**Import Validation**:

```typescript
{
  success: false,
  errors: [
    {
      field: 'nodes[2].id',
      message: 'Duplicate node ID: node-123',
      code: 'DUPLICATE_ID'
    },
    {
      field: 'edges[5].target',
      message: 'Edge target references non-existent node: node-999',
      code: 'INVALID_REFERENCE'
    }
  ],
  warnings: [
    {
      field: 'metadata.version',
      message: 'Workflow version 0.9.0 is older than current version 1.0.0',
      code: 'VERSION_MISMATCH'
    }
  ]
}
```

**Error Categories**:
- **Critical**: Import aborted, workflow not saved
- **Warning**: Import succeeds with warnings, user notified

---

## Performance Considerations

### Debouncing

**Change Queue**: Rapid successive changes are debounced to prevent excessive sync operations

```typescript
debounceMs: 500 // Wait 500ms after last change before syncing
```

**Benefits**:
- Reduces disk I/O during rapid editing
- Prevents network flooding
- Better user experience

### Polling Interval

**Store Adapter**: Polls frontend for changes

```typescript
pollIntervalMs: 1000 // Check for changes every second
```

**Trade-offs**:
- Lower interval = more responsive, higher load
- Higher interval = less responsive, lower load
- Future enhancement: WebSocket for push-based updates

### Caching

**Store Adapter Cache**: Maintains local copy of remote state

```typescript
private cachedState: StoreState
```

**Benefits**:
- Instant reads from cache
- Detect actual changes (skip no-op syncs)
- Offline mode support

### Auto-Save

**Configurable Intervals**:

```typescript
autoSaveIntervalMs: 30000 // Auto-save every 30 seconds
```

**Considerations**:
- Shorter interval = less data loss risk, more disk I/O
- Longer interval = more data loss risk, less disk I/O
- Disabled by default (manual save preferred)

---

## Security

### Input Validation

**Workflow ID Validation**:

```typescript
// Prevent path traversal attacks
if (workflowId.includes('..') || workflowId.includes('/')) {
  throw new Error('Invalid workflow ID: contains dangerous characters');
}
```

**File Path Validation**:
```typescript
// Export paths
if (outputPath.includes('..') || outputPath.includes('~')) {
  throw new Error('Invalid output path');
}
```

### Safe Deserialization

**JSON Parsing**:
- Uses try-catch around JSON.parse()
- Validates structure after parsing
- Checks for required fields
- Type validation for all properties

**Schema Validation**:
```typescript
await WorkflowSerializer.validateWorkflow(data);
```

### API Security

**Store Adapter**:
- Content-Type validation
- Error response handling
- No credential storage in logs
- HTTPS enforced in production config

### File System Security

**Permissions**:
- Workflows stored in user home directory only
- No world-readable files
- Backups hidden in .backups directory

**Injection Prevention**:
- All file paths validated
- No shell command execution
- Safe JSON/YAML parsing only

---

## Future Enhancements

### WebSocket Support

Replace polling with WebSocket for real-time push updates:

```typescript
// Future implementation
class WebSocketStoreAdapter extends StoreAdapter {
  private ws: WebSocket;

  async connect(): Promise<void> {
    this.ws = new WebSocket('ws://localhost:3001/sync');
    this.ws.on('message', this.handleMessage.bind(this));
  }
}
```

### Compression

Compress exported workflows:

```typescript
exportOptions: {
  compress: true // Use gzip compression
}
```

### Encryption

Encrypt sensitive workflow data:

```typescript
persistenceOptions: {
  encryptionKey: process.env.WORKFLOW_ENCRYPTION_KEY
}
```

### Collaborative Editing

Support multiple users editing same workflow:

- Operational Transformation (OT)
- Conflict-free Replicated Data Types (CRDTs)
- Lock-based editing

### Incremental Sync

Sync only changed nodes/edges instead of full workflow:

```typescript
syncChange({
  type: 'update',
  entity: 'node',
  id: 'node-123',
  data: { position: { x: 100, y: 200 } }
});
```

---

## Troubleshooting

### Common Issues

**Issue**: Sync status stuck on "syncing"

**Solution**: Check store adapter connection status
```bash
# View logs
cat ~/.gemini-flow/logs/super-terminal.log | grep -i "store"

# Check if frontend is running
curl http://localhost:3001/api/store/state
```

**Issue**: Workflows not appearing in TUI

**Solution**: Check persistence directory
```bash
ls -la ~/.gemini-flow/workflows/
```

**Issue**: Import fails with validation errors

**Solution**: Check workflow format
```bash
cat workflow.json | jq .
```

**Issue**: Connection keeps failing

**Solution**: Enable offline mode
```typescript
const storeAdapter = new StoreAdapter({ offlineMode: true });
```

---

**Last Updated**: October 27, 2025
**Version**: 1.0.0
**Sprint**: 6
