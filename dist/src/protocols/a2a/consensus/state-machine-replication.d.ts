/**
 * State Machine Replication for Byzantine Consensus
 * Ensures consistent state across all non-faulty agents
 * Implements deterministic state transitions with rollback capability
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
export interface StateOperation {
    id: string;
    type: "create" | "update" | "delete" | "execute";
    target: string;
    data: any;
    timestamp: Date;
    sequenceNumber: number;
    dependencies: string[];
    signature: string;
    executorId: string;
}
export interface StateSnapshot {
    id: string;
    sequenceNumber: number;
    state: Record<string, any>;
    timestamp: Date;
    hash: string;
    operations: StateOperation[];
}
export interface ReplicationNode {
    id: string;
    endpoint: string;
    publicKey: string;
    lastSyncTime: Date;
    sequenceNumber: number;
    isOnline: boolean;
    trustLevel: number;
}
export interface StateMachineConfig {
    replicationFactor: number;
    checkpointInterval: number;
    maxOperationHistory: number;
    consensusTimeout: number;
    conflictResolution: "last-writer-wins" | "vector-clock" | "consensus-based";
}
export interface ConflictResolution {
    conflictId: string;
    conflictingOperations: StateOperation[];
    resolutionStrategy: string;
    resolvedOperation: StateOperation;
    timestamp: Date;
}
export declare class StateMachineReplication extends EventEmitter {
    private nodeId;
    private currentState;
    private operationLog;
    private snapshots;
    private replicationNodes;
    private pendingOperations;
    private sequenceNumber;
    private conflictHistory;
    private readonly config;
    constructor(nodeId: string, config?: Partial<StateMachineConfig>);
    /**
     * Register a replication node
     */
    registerNode(node: ReplicationNode): void;
    /**
     * Remove a replication node
     */
    removeNode(nodeId: string): void;
    /**
     * Execute an operation on the state machine
     */
    executeOperation(operation: Omit<StateOperation, "id" | "signature" | "sequenceNumber">): Promise<boolean>;
    /**
     * Apply operation to the state machine
     */
    private applyOperation;
    /**
     * Handle create operation
     */
    private handleCreateOperation;
    /**
     * Handle update operation
     */
    private handleUpdateOperation;
    /**
     * Handle delete operation
     */
    private handleDeleteOperation;
    /**
     * Handle execute operation (for arbitrary code execution)
     */
    private handleExecuteOperation;
    /**
     * Validate operation
     */
    private validateOperation;
    /**
     * Check if operation dependencies are satisfied
     */
    private checkDependencies;
    /**
     * Process pending operations
     */
    private processPendingOperations;
    /**
     * Replicate operation to other nodes
     */
    private replicateOperation;
    /**
     * Send operation to a specific node
     */
    private sendOperationToNode;
    /**
     * Detect and resolve conflicts
     */
    private detectAndResolveConflicts;
    /**
     * Check if two operations conflict
     */
    private isConflicting;
    /**
     * Resolve conflicts using configured strategy
     */
    private resolveConflict;
    /**
     * Consensus-based conflict resolution
     */
    private consensusBasedResolution;
    /**
     * Rollback conflicting operations
     */
    private rollbackConflictingOperations;
    /**
     * Create rollback operation for a given operation
     */
    private createRollbackOperation;
    /**
     * Get rollback type for operation type
     */
    private getRollbackType;
    /**
     * Get rollback data for operation
     */
    private getRollbackData;
    /**
     * Create a state snapshot
     */
    createSnapshot(): StateSnapshot;
    /**
     * Restore from snapshot
     */
    restoreFromSnapshot(snapshotId: string): Promise<boolean>;
    /**
     * Perform periodic checkpoint
     */
    private performCheckpoint;
    /**
     * Synchronize with other nodes
     */
    synchronizeWithNodes(): Promise<void>;
    /**
     * Synchronize with a specific node
     */
    private synchronizeWithNode;
    /**
     * Get current state
     */
    getCurrentState(): Record<string, any>;
    /**
     * Get operation history
     */
    getOperationHistory(limit?: number): StateOperation[];
    /**
     * Get snapshots
     */
    getSnapshots(): StateSnapshot[];
    /**
     * Get replication statistics
     */
    getReplicationStatistics(): {
        totalOperations: number;
        totalSnapshots: number;
        onlineNodes: number;
        totalNodes: number;
        conflictsResolved: number;
        averageSyncDelay: number;
    };
    private cloneState;
    private cloneObject;
    private calculateStateHash;
    private generateOperationId;
    private generateSnapshotId;
    private generateConflictId;
    private signOperation;
}
export default StateMachineReplication;
//# sourceMappingURL=state-machine-replication.d.ts.map