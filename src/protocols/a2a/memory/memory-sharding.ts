/**
 * Memory Sharding and Partitioning for A2A Distributed Memory
 *
 * Implements various sharding strategies:
 * - Consistent Hashing with Virtual Nodes
 * - Range-based Partitioning
 * - Hash-based Partitioning
 * - Dynamic Rebalancing
 * - Replica Management
 * - Shard Migration and Recovery
 */

import { EventEmitter } from "node:events";
import { Logger } from "../../../utils/logger.js";
import { VectorClock } from "./vector-clocks.js";

export type ShardingStrategy = "consistent_hash" | "range" | "hash" | "hybrid";

export interface Shard {
  shardId: string;
  startKey: string;
  endKey: string;
  nodeId: string;
  replicas: string[]; // Replica node IDs
  size: number; // Approximate data size
  keyCount: number;
  lastUpdated: Date;
  status: "active" | "migrating" | "splitting" | "merging" | "failed";
  version: number;
}

export interface ShardMap {
  version: number;
  strategy: ShardingStrategy;
  totalShards: number;
  replicationFactor: number;
  shards: Map<string, Shard>;
  nodeAssignments: Map<string, string[]>; // nodeId -> shardIds
  keyRanges: Array<{ start: string; end: string; shardId: string }>;
  lastRebalance: Date;
}

export interface ShardingConfig {
  strategy: ShardingStrategy;
  targetShardSize: number; // Target size per shard in bytes
  maxShardSize: number; // Maximum size before splitting
  minShardSize: number; // Minimum size before merging
  replicationFactor: number;
  virtualNodes: number; // For consistent hashing
  rebalanceThreshold: number; // Imbalance threshold for rebalancing
  migrationBatchSize: number; // Keys to migrate per batch
  maxConcurrentMigrations: number;
}

export interface MigrationTask {
  taskId: string;
  type: "split" | "merge" | "move" | "replicate";
  sourceShardId: string;
  targetShardId?: string;
  sourceNodeId: string;
  targetNodeId: string;
  keyRange: { start: string; end: string };
  progress: number; // 0-100
  status: "pending" | "running" | "completed" | "failed";
  startTime: Date;
  estimatedCompletion?: Date;
  bytesTransferred: number;
  keysTransferred: number;
}

export interface ShardingMetrics {
  totalShards: number;
  averageShardSize: number;
  largestShardSize: number;
  smallestShardSize: number;
  imbalanceRatio: number;
  hotspotShards: string[];
  underutilizedShards: string[];
  migrationCount: number;
  rebalanceFrequency: number;
  storageEfficiency: number;
}

/**
 * Consistent Hash Ring for Distributed Sharding
 */
class ConsistentHashRing {
  private ring: Map<number, string> = new Map(); // hash -> nodeId
  private virtualNodes: Map<string, number[]> = new Map(); // nodeId -> hashes
  private virtualNodeCount: number;

  constructor(virtualNodeCount: number = 150) {
    this.virtualNodeCount = virtualNodeCount;
  }

  addNode(nodeId: string): void {
    const hashes: number[] = [];

    for (let i = 0; i < this.virtualNodeCount; i++) {
      const hash = this.hash(`${nodeId}:${i}`);
      this.ring.set(hash, nodeId);
      hashes.push(hash);
    }

    this.virtualNodes.set(
      nodeId,
      hashes.sort((a, b) => a - b),
    );
    this.sortRing();
  }

  removeNode(nodeId: string): void {
    const hashes = this.virtualNodes.get(nodeId);
    if (hashes) {
      for (const hash of hashes) {
        this.ring.delete(hash);
      }
      this.virtualNodes.delete(nodeId);
      this.sortRing();
    }
  }

  getNode(key: string): string {
    if (this.ring.size === 0) {
      throw new Error("No nodes in the hash ring");
    }

    const keyHash = this.hash(key);
    const sortedHashes = Array.from(this.ring.keys()).sort((a, b) => a - b);

    // Find the first hash greater than or equal to keyHash
    for (const hash of sortedHashes) {
      if (hash >= keyHash) {
        return this.ring.get(hash)!;
      }
    }

    // If no hash is found, wrap around to the first node
    return this.ring.get(sortedHashes[0])!;
  }

  getNodes(key: string, count: number): string[] {
    const nodes: string[] = [];
    const keyHash = this.hash(key);
    const sortedHashes = Array.from(this.ring.keys()).sort((a, b) => a - b);

    let startIndex = 0;
    for (let i = 0; i < sortedHashes.length; i++) {
      if (sortedHashes[i] >= keyHash) {
        startIndex = i;
        break;
      }
    }

    const uniqueNodes = new Set<string>();
    for (let i = 0; i < sortedHashes.length && uniqueNodes.size < count; i++) {
      const index = (startIndex + i) % sortedHashes.length;
      const nodeId = this.ring.get(sortedHashes[index])!;
      uniqueNodes.add(nodeId);
    }

    return Array.from(uniqueNodes);
  }

  private hash(key: string): number {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private sortRing(): void {
    const sorted = new Map(
      Array.from(this.ring.entries()).sort(([a], [b]) => a - b),
    );
    this.ring = sorted;
  }
}

/**
 * Memory Sharding Manager
 */
export class MemorySharding extends EventEmitter {
  private logger: Logger;
  private config: ShardingConfig;
  private shardMap: ShardMap;
  private hashRing: ConsistentHashRing;
  private migrationTasks: Map<string, MigrationTask> = new Map();
  private keyToShardCache: Map<string, string> = new Map();

  // Monitoring and metrics
  private metrics: ShardingMetrics = {
    totalShards: 0,
    averageShardSize: 0,
    largestShardSize: 0,
    smallestShardSize: 0,
    imbalanceRatio: 0,
    hotspotShards: [],
    underutilizedShards: [],
    migrationCount: 0,
    rebalanceFrequency: 0,
    storageEfficiency: 0,
  };

  constructor(
    strategy: ShardingStrategy = "consistent_hash",
    config: Partial<ShardingConfig> = {},
  ) {
    super();
    this.logger = new Logger(`MemorySharding:${strategy}`);

    this.config = {
      strategy,
      targetShardSize: 10 * 1024 * 1024, // 10MB
      maxShardSize: 50 * 1024 * 1024, // 50MB
      minShardSize: 1 * 1024 * 1024, // 1MB
      replicationFactor: 3,
      virtualNodes: 150,
      rebalanceThreshold: 0.2, // 20% imbalance triggers rebalance
      migrationBatchSize: 1000,
      maxConcurrentMigrations: 3,
      ...config,
    };

    this.initializeShardMap();
    this.hashRing = new ConsistentHashRing(this.config.virtualNodes);

    this.logger.info("Memory sharding initialized", {
      strategy: this.config.strategy,
      replicationFactor: this.config.replicationFactor,
    });
  }

  /**
   * Initialize nodes in the sharding system
   */
  initializeNodes(nodes: Array<{ agentId: string; capacity: number }>): void {
    for (const node of nodes) {
      this.addNode(node.agentId, node.capacity);
    }

    this.logger.info("Nodes initialized", { nodeCount: nodes.length });
  }

  /**
   * Add a new node to the sharding system
   */
  addNode(nodeId: string, capacity: number): void {
    // Add to consistent hash ring if using that strategy
    if (
      this.config.strategy === "consistent_hash" ||
      this.config.strategy === "hybrid"
    ) {
      this.hashRing.addNode(nodeId);
    }

    // Initialize node assignments
    this.shardMap.nodeAssignments.set(nodeId, []);

    // Trigger rebalancing if needed
    this.scheduleRebalance();

    this.logger.info("Node added to sharding system", { nodeId, capacity });
    this.emit("node_added", { nodeId, capacity });
  }

  /**
   * Remove a node from the sharding system
   */
  removeNode(nodeId: string): void {
    const assignedShards = this.shardMap.nodeAssignments.get(nodeId) || [];

    // Remove from hash ring
    if (
      this.config.strategy === "consistent_hash" ||
      this.config.strategy === "hybrid"
    ) {
      this.hashRing.removeNode(nodeId);
    }

    // Migrate shards from removed node
    this.migrateShards(assignedShards, nodeId);

    // Remove from assignments
    this.shardMap.nodeAssignments.delete(nodeId);

    this.logger.warn("Node removed from sharding system", {
      nodeId,
      migratedShards: assignedShards.length,
    });

    this.emit("node_removed", { nodeId, migratedShards: assignedShards });
  }

  /**
   * Get the shard ID for a given key
   */
  getShardForKey(key: string): string {
    // Check cache first
    const cached = this.keyToShardCache.get(key);
    if (cached) {
      return cached;
    }

    let shardId: string;

    switch (this.config.strategy) {
      case "consistent_hash":
        shardId = this.getShardByConsistentHash(key);
        break;
      case "range":
        shardId = this.getShardByRange(key);
        break;
      case "hash":
        shardId = this.getShardByHash(key);
        break;
      case "hybrid":
        shardId = this.getShardByHybrid(key);
        break;
      default:
        throw new Error(`Unknown sharding strategy: ${this.config.strategy}`);
    }

    // Cache the result
    this.keyToShardCache.set(key, shardId);

    return shardId;
  }

  /**
   * Get the node ID for a given key
   */
  getNodeForKey(key: string): string {
    const shardId = this.getShardForKey(key);
    const shard = this.shardMap.shards.get(shardId);

    if (!shard) {
      throw new Error(`Shard not found: ${shardId}`);
    }

    return shard.nodeId;
  }

  /**
   * Get replica nodes for a given key
   */
  getReplicaNodes(key: string): string[] {
    const shardId = this.getShardForKey(key);
    const shard = this.shardMap.shards.get(shardId);

    if (!shard) {
      throw new Error(`Shard not found: ${shardId}`);
    }

    return [shard.nodeId, ...shard.replicas];
  }

  /**
   * Create a new shard
   */
  createShard(
    startKey: string,
    endKey: string,
    nodeId: string,
    replicas: string[] = [],
  ): Shard {
    const shard: Shard = {
      shardId: this.generateShardId(),
      startKey,
      endKey,
      nodeId,
      replicas: replicas.slice(0, this.config.replicationFactor - 1),
      size: 0,
      keyCount: 0,
      lastUpdated: new Date(),
      status: "active",
      version: 1,
    };

    this.shardMap.shards.set(shard.shardId, shard);
    this.addShardToNode(nodeId, shard.shardId);

    // Add replicas
    for (const replicaNode of shard.replicas) {
      this.addShardToNode(replicaNode, shard.shardId);
    }

    this.updateKeyRanges();
    this.shardMap.version++;

    this.logger.debug("Shard created", {
      shardId: shard.shardId,
      nodeId,
      replicas: shard.replicas.length,
    });

    this.emit("shard_created", shard);
    return shard;
  }

  /**
   * Split a shard into two shards
   */
  async splitShard(shardId: string, splitKey: string): Promise<string[]> {
    const shard = this.shardMap.shards.get(shardId);
    if (!shard) {
      throw new Error(`Shard not found: ${shardId}`);
    }

    if (shard.status !== "active") {
      throw new Error(`Cannot split shard in status: ${shard.status}`);
    }

    // Mark shard as splitting
    shard.status = "splitting";

    try {
      // Create two new shards
      const leftShard = this.createShard(
        shard.startKey,
        splitKey,
        shard.nodeId,
        shard.replicas,
      );

      const rightShard = this.createShard(
        splitKey,
        shard.endKey,
        shard.nodeId,
        shard.replicas,
      );

      // Create migration tasks
      const leftMigration = this.createMigrationTask(
        "split",
        shardId,
        leftShard.shardId,
        shard.nodeId,
        leftShard.nodeId,
        { start: shard.startKey, end: splitKey },
      );

      const rightMigration = this.createMigrationTask(
        "split",
        shardId,
        rightShard.shardId,
        shard.nodeId,
        rightShard.nodeId,
        { start: splitKey, end: shard.endKey },
      );

      // Execute migrations
      await Promise.all([
        this.executeMigration(leftMigration),
        this.executeMigration(rightMigration),
      ]);

      // Remove original shard
      this.removeShard(shardId);

      this.logger.info("Shard split completed", {
        originalShard: shardId,
        newShards: [leftShard.shardId, rightShard.shardId],
        splitKey,
      });

      return [leftShard.shardId, rightShard.shardId];
    } catch (error) {
      // Restore shard status on failure
      shard.status = "active";
      this.logger.error("Shard split failed", {
        shardId,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Merge two adjacent shards
   */
  async mergeShards(shard1Id: string, shard2Id: string): Promise<string> {
    const shard1 = this.shardMap.shards.get(shard1Id);
    const shard2 = this.shardMap.shards.get(shard2Id);

    if (!shard1 || !shard2) {
      throw new Error("One or both shards not found");
    }

    if (shard1.status !== "active" || shard2.status !== "active") {
      throw new Error("Cannot merge non-active shards");
    }

    // Ensure shards are adjacent
    if (
      shard1.endKey !== shard2.startKey &&
      shard2.endKey !== shard1.startKey
    ) {
      throw new Error("Cannot merge non-adjacent shards");
    }

    // Determine merge order
    const [leftShard, rightShard] =
      shard1.endKey === shard2.startKey ? [shard1, shard2] : [shard2, shard1];

    // Mark shards as merging
    leftShard.status = "merging";
    rightShard.status = "merging";

    try {
      // Create merged shard
      const mergedShard = this.createShard(
        leftShard.startKey,
        rightShard.endKey,
        leftShard.nodeId, // Use left shard's node
        leftShard.replicas,
      );

      // Create migration tasks
      const leftMigration = this.createMigrationTask(
        "merge",
        leftShard.shardId,
        mergedShard.shardId,
        leftShard.nodeId,
        mergedShard.nodeId,
        { start: leftShard.startKey, end: leftShard.endKey },
      );

      const rightMigration = this.createMigrationTask(
        "merge",
        rightShard.shardId,
        mergedShard.shardId,
        rightShard.nodeId,
        mergedShard.nodeId,
        { start: rightShard.startKey, end: rightShard.endKey },
      );

      // Execute migrations
      await Promise.all([
        this.executeMigration(leftMigration),
        this.executeMigration(rightMigration),
      ]);

      // Remove original shards
      this.removeShard(leftShard.shardId);
      this.removeShard(rightShard.shardId);

      this.logger.info("Shards merged successfully", {
        originalShards: [leftShard.shardId, rightShard.shardId],
        mergedShard: mergedShard.shardId,
      });

      return mergedShard.shardId;
    } catch (error) {
      // Restore shard status on failure
      leftShard.status = "active";
      rightShard.status = "active";

      this.logger.error("Shard merge failed", {
        shard1Id,
        shard2Id,
        error: error.message,
      });

      throw error;
    }
  }

  /**
   * Rebalance shards across nodes
   */
  async rebalanceShards(
    nodes: Array<{ agentId: string; capacity: number }>,
  ): Promise<void> {
    const imbalance = this.calculateImbalance();

    if (imbalance < this.config.rebalanceThreshold) {
      this.logger.debug("Shards are balanced, no rebalancing needed", {
        imbalance,
      });
      return;
    }

    this.logger.info("Starting shard rebalancing", {
      imbalance,
      nodeCount: nodes.length,
      shardCount: this.shardMap.shards.size,
    });

    try {
      const rebalancePlan = this.createRebalancePlan(nodes);
      await this.executeRebalancePlan(rebalancePlan);

      this.shardMap.lastRebalance = new Date();
      this.metrics.rebalanceFrequency++;

      this.logger.info("Shard rebalancing completed", {
        migrationsExecuted: rebalancePlan.length,
        newImbalance: this.calculateImbalance(),
      });

      this.emit("rebalance_completed", {
        migrations: rebalancePlan.length,
        imbalance: this.calculateImbalance(),
      });
    } catch (error) {
      this.logger.error("Shard rebalancing failed", { error: error.message });
      throw error;
    }
  }

  /**
   * Get sharding metrics
   */
  getMetrics(): ShardingMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  /**
   * Get current shard map
   */
  getShardMap(): ShardMap {
    return {
      ...this.shardMap,
      shards: new Map(this.shardMap.shards),
      nodeAssignments: new Map(this.shardMap.nodeAssignments),
    };
  }

  /**
   * Get migration tasks
   */
  getMigrationTasks(): MigrationTask[] {
    return Array.from(this.migrationTasks.values());
  }

  /**
   * Private methods
   */

  private initializeShardMap(): void {
    this.shardMap = {
      version: 1,
      strategy: this.config.strategy,
      totalShards: 0,
      replicationFactor: this.config.replicationFactor,
      shards: new Map(),
      nodeAssignments: new Map(),
      keyRanges: [],
      lastRebalance: new Date(),
    };
  }

  private getShardByConsistentHash(key: string): string {
    const nodeId = this.hashRing.getNode(key);

    // Find shard on this node that contains the key
    const nodeShards = this.shardMap.nodeAssignments.get(nodeId) || [];

    for (const shardId of nodeShards) {
      const shard = this.shardMap.shards.get(shardId);
      if (shard && this.keyInRange(key, shard.startKey, shard.endKey)) {
        return shardId;
      }
    }

    // If no existing shard, create one
    return this.createShardForKey(key, nodeId);
  }

  private getShardByRange(key: string): string {
    for (const range of this.shardMap.keyRanges) {
      if (this.keyInRange(key, range.start, range.end)) {
        return range.shardId;
      }
    }

    // If no range found, create new shard
    const nodeId = this.selectNodeForNewShard();
    return this.createShardForKey(key, nodeId);
  }

  private getShardByHash(key: string): string {
    const hash = this.hashKey(key);
    const shardIndex = hash % this.shardMap.totalShards;

    const shardArray = Array.from(this.shardMap.shards.values());
    if (shardIndex < shardArray.length) {
      return shardArray[shardIndex].shardId;
    }

    // Fallback to creating new shard
    const nodeId = this.selectNodeForNewShard();
    return this.createShardForKey(key, nodeId);
  }

  private getShardByHybrid(key: string): string {
    // Use consistent hashing for most keys, range partitioning for specific patterns
    if (this.isSpecialKey(key)) {
      return this.getShardByRange(key);
    } else {
      return this.getShardByConsistentHash(key);
    }
  }

  private keyInRange(key: string, startKey: string, endKey: string): boolean {
    return key >= startKey && key < endKey;
  }

  private createShardForKey(key: string, nodeId: string): string {
    // Create a new shard containing this key
    const startKey = this.generateStartKey(key);
    const endKey = this.generateEndKey(key);
    const replicas = this.selectReplicaNodes(nodeId);

    const shard = this.createShard(startKey, endKey, nodeId, replicas);
    return shard.shardId;
  }

  private selectNodeForNewShard(): string {
    // Select node with least load
    let selectedNode = "";
    let minShards = Infinity;

    for (const [nodeId, shardIds] of this.shardMap.nodeAssignments) {
      if (shardIds.length < minShards) {
        minShards = shardIds.length;
        selectedNode = nodeId;
      }
    }

    return selectedNode;
  }

  private selectReplicaNodes(primaryNodeId: string): string[] {
    const replicas: string[] = [];
    const availableNodes = Array.from(
      this.shardMap.nodeAssignments.keys(),
    ).filter((nodeId) => nodeId !== primaryNodeId);

    // Select nodes with least load for replicas
    availableNodes.sort((a, b) => {
      const aLoad = this.shardMap.nodeAssignments.get(a)?.length || 0;
      const bLoad = this.shardMap.nodeAssignments.get(b)?.length || 0;
      return aLoad - bLoad;
    });

    const replicaCount = Math.min(
      this.config.replicationFactor - 1,
      availableNodes.length,
    );

    for (let i = 0; i < replicaCount; i++) {
      replicas.push(availableNodes[i]);
    }

    return replicas;
  }

  private addShardToNode(nodeId: string, shardId: string): void {
    const currentShards = this.shardMap.nodeAssignments.get(nodeId) || [];
    currentShards.push(shardId);
    this.shardMap.nodeAssignments.set(nodeId, currentShards);
  }

  private removeShardFromNode(nodeId: string, shardId: string): void {
    const currentShards = this.shardMap.nodeAssignments.get(nodeId) || [];
    const filtered = currentShards.filter((id) => id !== shardId);
    this.shardMap.nodeAssignments.set(nodeId, filtered);
  }

  private removeShard(shardId: string): void {
    const shard = this.shardMap.shards.get(shardId);
    if (shard) {
      // Remove from node assignments
      this.removeShardFromNode(shard.nodeId, shardId);
      for (const replicaNode of shard.replicas) {
        this.removeShardFromNode(replicaNode, shardId);
      }

      // Remove from shard map
      this.shardMap.shards.delete(shardId);
      this.updateKeyRanges();
      this.shardMap.version++;
    }
  }

  private updateKeyRanges(): void {
    this.shardMap.keyRanges = Array.from(this.shardMap.shards.values())
      .map((shard) => ({
        start: shard.startKey,
        end: shard.endKey,
        shardId: shard.shardId,
      }))
      .sort((a, b) => a.start.localeCompare(b.start));
  }

  private migrateShards(shardIds: string[], fromNodeId: string): void {
    for (const shardId of shardIds) {
      const targetNodeId = this.selectNodeForNewShard();
      if (targetNodeId && targetNodeId !== fromNodeId) {
        const shard = this.shardMap.shards.get(shardId);
        if (shard) {
          const migration = this.createMigrationTask(
            "move",
            shardId,
            undefined,
            fromNodeId,
            targetNodeId,
            { start: shard.startKey, end: shard.endKey },
          );

          this.executeMigration(migration);
        }
      }
    }
  }

  private createMigrationTask(
    type: MigrationTask["type"],
    sourceShardId: string,
    targetShardId: string | undefined,
    sourceNodeId: string,
    targetNodeId: string,
    keyRange: { start: string; end: string },
  ): MigrationTask {
    const task: MigrationTask = {
      taskId: this.generateMigrationId(),
      type,
      sourceShardId,
      targetShardId,
      sourceNodeId,
      targetNodeId,
      keyRange,
      progress: 0,
      status: "pending",
      startTime: new Date(),
      bytesTransferred: 0,
      keysTransferred: 0,
    };

    this.migrationTasks.set(task.taskId, task);
    return task;
  }

  private async executeMigration(task: MigrationTask): Promise<void> {
    task.status = "running";
    task.startTime = new Date();

    try {
      this.logger.info("Starting migration", {
        taskId: task.taskId,
        type: task.type,
        sourceNode: task.sourceNodeId,
        targetNode: task.targetNodeId,
      });

      // Simulate migration (in real implementation, this would transfer actual data)
      const totalWork = 100;
      for (let i = 0; i <= totalWork; i += 10) {
        task.progress = i;
        task.bytesTransferred = i * 1000; // Simulate bytes transferred
        task.keysTransferred = i * 10; // Simulate keys transferred

        // Simulate work
        await new Promise((resolve) => setTimeout(resolve, 100));

        this.emit("migration_progress", task);
      }

      task.status = "completed";
      task.progress = 100;
      task.estimatedCompletion = new Date();

      // Update shard assignment if moving
      if (task.type === "move") {
        const shard = this.shardMap.shards.get(task.sourceShardId);
        if (shard) {
          this.removeShardFromNode(task.sourceNodeId, task.sourceShardId);
          this.addShardToNode(task.targetNodeId, task.sourceShardId);
          shard.nodeId = task.targetNodeId;
        }
      }

      this.metrics.migrationCount++;

      this.logger.info("Migration completed", {
        taskId: task.taskId,
        bytesTransferred: task.bytesTransferred,
        keysTransferred: task.keysTransferred,
      });

      this.emit("migration_completed", task);
    } catch (error) {
      task.status = "failed";

      this.logger.error("Migration failed", {
        taskId: task.taskId,
        error: error.message,
      });

      this.emit("migration_failed", task);
      throw error;
    }
  }

  private calculateImbalance(): number {
    const nodeLoads: number[] = [];

    for (const shardIds of this.shardMap.nodeAssignments.values()) {
      let totalSize = 0;
      for (const shardId of shardIds) {
        const shard = this.shardMap.shards.get(shardId);
        if (shard) {
          totalSize += shard.size;
        }
      }
      nodeLoads.push(totalSize);
    }

    if (nodeLoads.length === 0) return 0;

    const avgLoad = nodeLoads.reduce((a, b) => a + b, 0) / nodeLoads.length;
    const maxDeviation = Math.max(
      ...nodeLoads.map((load) => Math.abs(load - avgLoad)),
    );

    return avgLoad > 0 ? maxDeviation / avgLoad : 0;
  }

  private createRebalancePlan(
    nodes: Array<{ agentId: string; capacity: number }>,
  ): MigrationTask[] {
    const plan: MigrationTask[] = [];

    // Simple rebalancing: move shards from overloaded to underloaded nodes
    const nodeLoads = new Map<string, number>();

    // Calculate current loads
    for (const node of nodes) {
      const shardIds = this.shardMap.nodeAssignments.get(node.agentId) || [];
      let totalSize = 0;

      for (const shardId of shardIds) {
        const shard = this.shardMap.shards.get(shardId);
        if (shard) {
          totalSize += shard.size;
        }
      }

      nodeLoads.set(node.agentId, totalSize);
    }

    const avgLoad =
      Array.from(nodeLoads.values()).reduce((a, b) => a + b, 0) /
      nodeLoads.size;

    // Find overloaded and underloaded nodes
    const overloaded = Array.from(nodeLoads.entries())
      .filter(
        ([, load]) => load > avgLoad * (1 + this.config.rebalanceThreshold),
      )
      .sort(([, a], [, b]) => b - a);

    const underloaded = Array.from(nodeLoads.entries())
      .filter(
        ([, load]) => load < avgLoad * (1 - this.config.rebalanceThreshold),
      )
      .sort(([, a], [, b]) => a - b);

    // Create migration tasks
    for (const [overloadedNode] of overloaded) {
      if (underloaded.length === 0) break;

      const shardIds = this.shardMap.nodeAssignments.get(overloadedNode) || [];
      for (const shardId of shardIds) {
        if (underloaded.length === 0) break;

        const shard = this.shardMap.shards.get(shardId);
        if (shard && shard.status === "active") {
          const [underloadedNode] = underloaded.shift()!;

          const migration = this.createMigrationTask(
            "move",
            shardId,
            undefined,
            overloadedNode,
            underloadedNode,
            { start: shard.startKey, end: shard.endKey },
          );

          plan.push(migration);

          if (plan.length >= this.config.maxConcurrentMigrations) {
            break;
          }
        }
      }
    }

    return plan;
  }

  private async executeRebalancePlan(plan: MigrationTask[]): Promise<void> {
    const batches = this.chunkArray(plan, this.config.maxConcurrentMigrations);

    for (const batch of batches) {
      await Promise.all(batch.map((task) => this.executeMigration(task)));
    }
  }

  private scheduleRebalance(): void {
    // Schedule rebalancing in the next tick to avoid blocking
    process.nextTick(() => {
      const imbalance = this.calculateImbalance();
      if (imbalance > this.config.rebalanceThreshold) {
        this.emit("rebalance_needed", { imbalance });
      }
    });
  }

  private updateMetrics(): void {
    const shards = Array.from(this.shardMap.shards.values());
    const sizes = shards.map((s) => s.size).filter((s) => s > 0);

    this.metrics.totalShards = shards.length;
    this.metrics.averageShardSize =
      sizes.length > 0 ? sizes.reduce((a, b) => a + b, 0) / sizes.length : 0;
    this.metrics.largestShardSize = sizes.length > 0 ? Math.max(...sizes) : 0;
    this.metrics.smallestShardSize = sizes.length > 0 ? Math.min(...sizes) : 0;
    this.metrics.imbalanceRatio = this.calculateImbalance();

    // Calculate storage efficiency
    const totalCapacity =
      Array.from(this.shardMap.nodeAssignments.keys()).length *
      this.config.targetShardSize;
    const totalUsed = sizes.reduce((a, b) => a + b, 0);
    this.metrics.storageEfficiency =
      totalCapacity > 0 ? totalUsed / totalCapacity : 0;

    // Identify hotspots and underutilized shards
    this.metrics.hotspotShards = shards
      .filter((s) => s.size > this.config.maxShardSize * 0.8)
      .map((s) => s.shardId);

    this.metrics.underutilizedShards = shards
      .filter((s) => s.size < this.config.minShardSize * 1.2)
      .map((s) => s.shardId);
  }

  // Utility methods
  private generateShardId(): string {
    return `shard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMigrationId(): string {
    return `migration_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private hashKey(key: string): number {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private generateStartKey(key: string): string {
    // Generate a start key that's slightly before the given key
    return (
      key.slice(0, -1) + String.fromCharCode(key.charCodeAt(key.length - 1) - 1)
    );
  }

  private generateEndKey(key: string): string {
    // Generate an end key that's after the given key
    return key + "\uffff";
  }

  private isSpecialKey(key: string): boolean {
    // Define logic to identify keys that should use range partitioning
    return key.startsWith("range:") || key.includes(":ordered:");
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
}
