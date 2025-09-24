/**
 * State Machine Replication for Byzantine Consensus
 * Ensures consistent state across all non-faulty agents
 * Implements deterministic state transitions with rollback capability
 */

import { EventEmitter } from "node:events";
import { createHash } from "crypto";

export interface StateOperation {
  id: string;
  type: "create" | "update" | "delete" | "execute";
  target: string; // Target entity/resource
  data: any;
  timestamp: Date;
  sequenceNumber: number;
  dependencies: string[]; // Operation IDs this depends on
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

export class StateMachineReplication extends EventEmitter {
  private currentState: Record<string, any> = {};
  private operationLog: StateOperation[] = [];
  private snapshots: StateSnapshot[] = [];
  private replicationNodes: Map<string, ReplicationNode> = new Map();
  private pendingOperations: Map<string, StateOperation> = new Map();
  private sequenceNumber: number = 0;
  private conflictHistory: ConflictResolution[] = [];

  private readonly config: StateMachineConfig;

  constructor(
    private nodeId: string,
    config: Partial<StateMachineConfig> = {},
  ) {
    super();

    this.config = {
      replicationFactor: 3,
      checkpointInterval: 100,
      maxOperationHistory: 1000,
      consensusTimeout: 30000,
      conflictResolution: "consensus-based",
      ...config,
    };

    // Create initial snapshot
    this.createSnapshot();

    // Set up periodic checkpointing
    setInterval(() => {
      this.performCheckpoint();
    }, this.config.checkpointInterval * 1000);
  }

  /**
   * Register a replication node
   */
  public registerNode(node: ReplicationNode): void {
    this.replicationNodes.set(node.id, node);
    this.emit("node-registered", node);
  }

  /**
   * Remove a replication node
   */
  public removeNode(nodeId: string): void {
    const node = this.replicationNodes.get(nodeId);
    if (node) {
      this.replicationNodes.delete(nodeId);
      this.emit("node-removed", node);
    }
  }

  /**
   * Execute an operation on the state machine
   */
  public async executeOperation(
    operation: Omit<StateOperation, "id" | "signature" | "sequenceNumber">,
  ): Promise<boolean> {
    try {
      // Generate operation ID and sequence number
      const fullOperation: StateOperation = {
        ...operation,
        id: this.generateOperationId(operation),
        sequenceNumber: ++this.sequenceNumber,
        signature: this.signOperation(operation),
      };

      // Validate operation
      if (!this.validateOperation(fullOperation)) {
        throw new Error("Invalid operation");
      }

      // Check dependencies
      if (!this.checkDependencies(fullOperation)) {
        this.pendingOperations.set(fullOperation.id, fullOperation);
        this.emit("operation-pending", fullOperation);
        return false;
      }

      // Apply operation to local state
      const previousState = this.cloneState();
      const success = await this.applyOperation(fullOperation);

      if (!success) {
        throw new Error("Failed to apply operation");
      }

      // Add to operation log
      this.operationLog.push(fullOperation);

      // Replicate to other nodes
      await this.replicateOperation(fullOperation);

      // Check for conflicts
      await this.detectAndResolveConflicts(fullOperation);

      // Process pending operations that might now be executable
      await this.processPendingOperations();

      this.emit("operation-executed", {
        operation: fullOperation,
        previousState,
        newState: this.cloneState(),
      });

      return true;
    } catch (error) {
      this.emit("operation-failed", { operation, error });
      return false;
    }
  }

  /**
   * Apply operation to the state machine
   */
  private async applyOperation(operation: StateOperation): Promise<boolean> {
    try {
      switch (operation.type) {
        case "create":
          return this.handleCreateOperation(operation);
        case "update":
          return this.handleUpdateOperation(operation);
        case "delete":
          return this.handleDeleteOperation(operation);
        case "execute":
          return this.handleExecuteOperation(operation);
        default:
          throw new Error(`Unknown operation type: ${operation.type}`);
      }
    } catch (error) {
      console.error("Error applying operation:", error);
      return false;
    }
  }

  /**
   * Handle create operation
   */
  private handleCreateOperation(operation: StateOperation): boolean {
    if (this.currentState[operation.target]) {
      throw new Error(`Target ${operation.target} already exists`);
    }

    this.currentState[operation.target] = operation.data;
    return true;
  }

  /**
   * Handle update operation
   */
  private handleUpdateOperation(operation: StateOperation): boolean {
    if (!this.currentState[operation.target]) {
      throw new Error(`Target ${operation.target} does not exist`);
    }

    if (typeof operation.data === "object" && operation.data !== null) {
      this.currentState[operation.target] = {
        ...this.currentState[operation.target],
        ...operation.data,
      };
    } else {
      this.currentState[operation.target] = operation.data;
    }

    return true;
  }

  /**
   * Handle delete operation
   */
  private handleDeleteOperation(operation: StateOperation): boolean {
    if (!this.currentState[operation.target]) {
      throw new Error(`Target ${operation.target} does not exist`);
    }

    delete this.currentState[operation.target];
    return true;
  }

  /**
   * Handle execute operation (for arbitrary code execution)
   */
  private handleExecuteOperation(operation: StateOperation): boolean {
    // This is a simplified implementation
    // In production, this would need proper sandboxing and security
    try {
      const { function: fn, params } = operation.data;

      // Predefined safe functions
      const safeFunctions = {
        increment: (target: string, amount: number = 1) => {
          if (typeof this.currentState[target] === "number") {
            this.currentState[target] += amount;
          }
        },
        append: (target: string, value: any) => {
          if (Array.isArray(this.currentState[target])) {
            this.currentState[target].push(value);
          }
        },
        merge: (target: string, data: object) => {
          if (typeof this.currentState[target] === "object") {
            Object.assign(this.currentState[target], data);
          }
        },
      };

      if (safeFunctions[fn as keyof typeof safeFunctions]) {
        safeFunctions[fn as keyof typeof safeFunctions](
          operation.target,
          ...params,
        );
        return true;
      }

      throw new Error(`Unknown function: ${fn}`);
    } catch (error) {
      console.error("Error executing operation:", error);
      return false;
    }
  }

  /**
   * Validate operation
   */
  private validateOperation(operation: StateOperation): boolean {
    // Basic validation
    if (!operation.id || !operation.type || !operation.target) {
      return false;
    }

    // Check signature
    const expectedSignature = this.signOperation(operation);
    if (operation.signature !== expectedSignature) {
      return false;
    }

    // Check sequence number
    if (operation.sequenceNumber <= 0) {
      return false;
    }

    // Operation-specific validation
    switch (operation.type) {
      case "create":
        return !this.currentState[operation.target];
      case "update":
      case "delete":
        return !!this.currentState[operation.target];
      case "execute":
        return !!operation.data?.function;
      default:
        return false;
    }
  }

  /**
   * Check if operation dependencies are satisfied
   */
  private checkDependencies(operation: StateOperation): boolean {
    if (!operation.dependencies || operation.dependencies.length === 0) {
      return true;
    }

    // Check if all dependencies have been executed
    const executedOperationIds = new Set(this.operationLog.map((op) => op.id));

    return operation.dependencies.every((depId) =>
      executedOperationIds.has(depId),
    );
  }

  /**
   * Process pending operations
   */
  private async processPendingOperations(): Promise<void> {
    const executableOperations: StateOperation[] = [];

    for (const [opId, operation] of this.pendingOperations) {
      if (this.checkDependencies(operation)) {
        executableOperations.push(operation);
        this.pendingOperations.delete(opId);
      }
    }

    // Sort by sequence number and execute
    executableOperations.sort((a, b) => a.sequenceNumber - b.sequenceNumber);

    for (const operation of executableOperations) {
      await this.applyOperation(operation);
      this.operationLog.push(operation);
      this.emit("pending-operation-executed", operation);
    }
  }

  /**
   * Replicate operation to other nodes
   */
  private async replicateOperation(operation: StateOperation): Promise<void> {
    const onlineNodes = Array.from(this.replicationNodes.values())
      .filter((node) => node.isOnline)
      .sort((a, b) => b.trustLevel - a.trustLevel)
      .slice(0, this.config.replicationFactor);

    const replicationPromises = onlineNodes.map((node) =>
      this.sendOperationToNode(node, operation),
    );

    try {
      await Promise.allSettled(replicationPromises);
    } catch (error) {
      console.error("Replication failed:", error);
      this.emit("replication-failed", { operation, error });
    }
  }

  /**
   * Send operation to a specific node
   */
  private async sendOperationToNode(
    node: ReplicationNode,
    operation: StateOperation,
  ): Promise<void> {
    // This would implement actual network communication
    // For now, just simulate the operation

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.1) {
          // 90% success rate
          node.lastSyncTime = new Date();
          node.sequenceNumber = Math.max(
            node.sequenceNumber,
            operation.sequenceNumber,
          );
          this.emit("operation-replicated", { node, operation });
          resolve();
        } else {
          reject(new Error(`Failed to replicate to node ${node.id}`));
        }
      }, Math.random() * 100); // Simulate network delay
    });
  }

  /**
   * Detect and resolve conflicts
   */
  private async detectAndResolveConflicts(
    operation: StateOperation,
  ): Promise<void> {
    // Look for conflicting operations in recent history
    const recentOperations = this.operationLog
      .filter(
        (op) =>
          op.target === operation.target &&
          Math.abs(op.sequenceNumber - operation.sequenceNumber) <= 10,
      )
      .filter((op) => op.id !== operation.id);

    if (recentOperations.length === 0) {
      return;
    }

    // Check for actual conflicts
    const conflictingOperations = recentOperations.filter((op) =>
      this.isConflicting(op, operation),
    );

    if (conflictingOperations.length > 0) {
      const resolution = await this.resolveConflict([
        ...conflictingOperations,
        operation,
      ]);

      this.conflictHistory.push(resolution);
      this.emit("conflict-resolved", resolution);
    }
  }

  /**
   * Check if two operations conflict
   */
  private isConflicting(op1: StateOperation, op2: StateOperation): boolean {
    if (op1.target !== op2.target) {
      return false;
    }

    // Different types of conflicts
    const conflictMatrix = {
      "create-create": true,
      "create-update": false,
      "create-delete": false,
      "update-update": true,
      "update-delete": true,
      "delete-delete": false,
      "delete-create": true,
      "execute-execute": true,
    };

    const key = `${op1.type}-${op2.type}` as keyof typeof conflictMatrix;
    return conflictMatrix[key] || false;
  }

  /**
   * Resolve conflicts using configured strategy
   */
  private async resolveConflict(
    conflictingOperations: StateOperation[],
  ): Promise<ConflictResolution> {
    const conflictId = this.generateConflictId(conflictingOperations);

    let resolvedOperation: StateOperation;
    let resolutionStrategy: string;

    switch (this.config.conflictResolution) {
      case "last-writer-wins":
        resolvedOperation = conflictingOperations.sort(
          (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
        )[0];
        resolutionStrategy = "Last Writer Wins";
        break;

      case "vector-clock":
        // Simplified vector clock resolution
        resolvedOperation = conflictingOperations.sort(
          (a, b) => b.sequenceNumber - a.sequenceNumber,
        )[0];
        resolutionStrategy = "Vector Clock";
        break;

      case "consensus-based":
        resolvedOperation = await this.consensusBasedResolution(
          conflictingOperations,
        );
        resolutionStrategy = "Consensus Based";
        break;

      default:
        resolvedOperation = conflictingOperations[0];
        resolutionStrategy = "Default";
    }

    // Apply the resolved operation and rollback others
    await this.rollbackConflictingOperations(
      conflictingOperations.filter((op) => op.id !== resolvedOperation.id),
    );

    const resolution: ConflictResolution = {
      conflictId,
      conflictingOperations,
      resolutionStrategy,
      resolvedOperation,
      timestamp: new Date(),
    };

    return resolution;
  }

  /**
   * Consensus-based conflict resolution
   */
  private async consensusBasedResolution(
    operations: StateOperation[],
  ): Promise<StateOperation> {
    // This would integrate with the Byzantine consensus system
    // For now, use a simple voting mechanism based on node trust levels

    const votes = new Map<string, number>();

    operations.forEach((op) => {
      const node = this.replicationNodes.get(op.executorId);
      const weight = node ? node.trustLevel : 0.5;
      votes.set(op.id, (votes.get(op.id) || 0) + weight);
    });

    const winningOpId = Array.from(votes.entries()).sort(
      (a, b) => b[1] - a[1],
    )[0][0];

    return operations.find((op) => op.id === winningOpId)!;
  }

  /**
   * Rollback conflicting operations
   */
  private async rollbackConflictingOperations(
    operations: StateOperation[],
  ): Promise<void> {
    // Create rollback operations
    const rollbackOperations = operations.map((op) =>
      this.createRollbackOperation(op),
    );

    for (const rollbackOp of rollbackOperations) {
      await this.applyOperation(rollbackOp);
      this.operationLog.push(rollbackOp);
    }

    this.emit("operations-rolled-back", operations);
  }

  /**
   * Create rollback operation for a given operation
   */
  private createRollbackOperation(operation: StateOperation): StateOperation {
    const rollbackData = this.getRollbackData(operation);

    return {
      id: `rollback-${operation.id}`,
      type: this.getRollbackType(operation.type),
      target: operation.target,
      data: rollbackData,
      timestamp: new Date(),
      sequenceNumber: ++this.sequenceNumber,
      dependencies: [operation.id],
      signature: "",
      executorId: this.nodeId,
    };
  }

  /**
   * Get rollback type for operation type
   */
  private getRollbackType(
    type: StateOperation["type"],
  ): StateOperation["type"] {
    const rollbackMap = {
      create: "delete" as const,
      update: "update" as const,
      delete: "create" as const,
      execute: "execute" as const,
    };

    return rollbackMap[type];
  }

  /**
   * Get rollback data for operation
   */
  private getRollbackData(operation: StateOperation): any {
    // This would need to store previous state values
    // For now, return null (simplified)
    return null;
  }

  /**
   * Create a state snapshot
   */
  public createSnapshot(): StateSnapshot {
    const snapshot: StateSnapshot = {
      id: this.generateSnapshotId(),
      sequenceNumber: this.sequenceNumber,
      state: this.cloneState(),
      timestamp: new Date(),
      hash: this.calculateStateHash(),
      operations: [...this.operationLog.slice(-this.config.checkpointInterval)],
    };

    this.snapshots.push(snapshot);

    // Keep only recent snapshots
    if (this.snapshots.length > 10) {
      this.snapshots = this.snapshots.slice(-10);
    }

    this.emit("snapshot-created", snapshot);
    return snapshot;
  }

  /**
   * Restore from snapshot
   */
  public async restoreFromSnapshot(snapshotId: string): Promise<boolean> {
    const snapshot = this.snapshots.find((s) => s.id === snapshotId);
    if (!snapshot) {
      return false;
    }

    try {
      this.currentState = this.cloneObject(snapshot.state);
      this.sequenceNumber = snapshot.sequenceNumber;

      // Replay operations after snapshot
      const operationsToReplay = this.operationLog
        .filter((op) => op.sequenceNumber > snapshot.sequenceNumber)
        .sort((a, b) => a.sequenceNumber - b.sequenceNumber);

      for (const operation of operationsToReplay) {
        await this.applyOperation(operation);
      }

      this.emit("snapshot-restored", snapshot);
      return true;
    } catch (error) {
      this.emit("snapshot-restore-failed", { snapshot, error });
      return false;
    }
  }

  /**
   * Perform periodic checkpoint
   */
  private performCheckpoint(): void {
    if (this.operationLog.length >= this.config.checkpointInterval) {
      this.createSnapshot();

      // Trim operation log
      if (this.operationLog.length > this.config.maxOperationHistory) {
        this.operationLog = this.operationLog.slice(
          -this.config.maxOperationHistory,
        );
      }
    }
  }

  /**
   * Synchronize with other nodes
   */
  public async synchronizeWithNodes(): Promise<void> {
    const onlineNodes = Array.from(this.replicationNodes.values()).filter(
      (node) => node.isOnline,
    );

    for (const node of onlineNodes) {
      try {
        await this.synchronizeWithNode(node);
      } catch (error) {
        console.error(`Sync failed with node ${node.id}:`, error);
      }
    }
  }

  /**
   * Synchronize with a specific node
   */
  private async synchronizeWithNode(node: ReplicationNode): Promise<void> {
    // This would implement actual sync protocol
    // For now, just update sync time
    node.lastSyncTime = new Date();
    this.emit("node-synchronized", node);
  }

  /**
   * Get current state
   */
  public getCurrentState(): Record<string, any> {
    return this.cloneState();
  }

  /**
   * Get operation history
   */
  public getOperationHistory(limit?: number): StateOperation[] {
    const operations = [...this.operationLog].reverse();
    return limit ? operations.slice(0, limit) : operations;
  }

  /**
   * Get snapshots
   */
  public getSnapshots(): StateSnapshot[] {
    return [...this.snapshots];
  }

  /**
   * Get replication statistics
   */
  public getReplicationStatistics(): {
    totalOperations: number;
    totalSnapshots: number;
    onlineNodes: number;
    totalNodes: number;
    conflictsResolved: number;
    averageSyncDelay: number;
  } {
    const onlineNodes = Array.from(this.replicationNodes.values()).filter(
      (node) => node.isOnline,
    );

    const now = Date.now();
    const avgSyncDelay =
      onlineNodes.length > 0
        ? onlineNodes.reduce(
            (sum, node) => sum + (now - node.lastSyncTime.getTime()),
            0,
          ) / onlineNodes.length
        : 0;

    return {
      totalOperations: this.operationLog.length,
      totalSnapshots: this.snapshots.length,
      onlineNodes: onlineNodes.length,
      totalNodes: this.replicationNodes.size,
      conflictsResolved: this.conflictHistory.length,
      averageSyncDelay: avgSyncDelay,
    };
  }

  private cloneState(): Record<string, any> {
    return this.cloneObject(this.currentState);
  }

  private cloneObject(obj: any): any {
    return JSON.parse(JSON.stringify(obj));
  }

  private calculateStateHash(): string {
    return createHash("sha256")
      .update(JSON.stringify(this.currentState))
      .digest("hex");
  }

  private generateOperationId(
    operation: Omit<StateOperation, "id" | "signature" | "sequenceNumber">,
  ): string {
    return createHash("sha256")
      .update(JSON.stringify(operation) + Date.now() + Math.random())
      .digest("hex");
  }

  private generateSnapshotId(): string {
    return `snapshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateConflictId(operations: StateOperation[]): string {
    const opIds = operations
      .map((op) => op.id)
      .sort()
      .join("-");
    return createHash("sha256").update(opIds).digest("hex");
  }

  private signOperation(
    operation: Omit<StateOperation, "id" | "signature" | "sequenceNumber">,
  ): string {
    return createHash("sha256")
      .update(JSON.stringify(operation) + this.nodeId)
      .digest("hex");
  }
}

export default StateMachineReplication;
