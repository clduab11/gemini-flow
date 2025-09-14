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
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
export type ShardingStrategy = "consistent_hash" | "range" | "hash" | "hybrid";
export interface Shard {
    shardId: string;
    startKey: string;
    endKey: string;
    nodeId: string;
    replicas: string[];
    size: number;
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
    nodeAssignments: Map<string, string[]>;
    keyRanges: Array<{
        start: string;
        end: string;
        shardId: string;
    }>;
    lastRebalance: Date;
}
export interface ShardingConfig {
    strategy: ShardingStrategy;
    targetShardSize: number;
    maxShardSize: number;
    minShardSize: number;
    replicationFactor: number;
    virtualNodes: number;
    rebalanceThreshold: number;
    migrationBatchSize: number;
    maxConcurrentMigrations: number;
}
export interface MigrationTask {
    taskId: string;
    type: "split" | "merge" | "move" | "replicate";
    sourceShardId: string;
    targetShardId?: string;
    sourceNodeId: string;
    targetNodeId: string;
    keyRange: {
        start: string;
        end: string;
    };
    progress: number;
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
 * Memory Sharding Manager
 */
export declare class MemorySharding extends EventEmitter {
    private logger;
    private config;
    private shardMap;
    private hashRing;
    private migrationTasks;
    private keyToShardCache;
    private metrics;
    constructor(strategy?: ShardingStrategy, config?: Partial<ShardingConfig>);
    /**
     * Initialize nodes in the sharding system
     */
    initializeNodes(nodes: Array<{
        agentId: string;
        capacity: number;
    }>): void;
    /**
     * Add a new node to the sharding system
     */
    addNode(nodeId: string, capacity: number): void;
    /**
     * Remove a node from the sharding system
     */
    removeNode(nodeId: string): void;
    /**
     * Get the shard ID for a given key
     */
    getShardForKey(key: string): string;
    /**
     * Get the node ID for a given key
     */
    getNodeForKey(key: string): string;
    /**
     * Get replica nodes for a given key
     */
    getReplicaNodes(key: string): string[];
    /**
     * Create a new shard
     */
    createShard(startKey: string, endKey: string, nodeId: string, replicas?: string[]): Shard;
    /**
     * Split a shard into two shards
     */
    splitShard(shardId: string, splitKey: string): Promise<string[]>;
    /**
     * Merge two adjacent shards
     */
    mergeShards(shard1Id: string, shard2Id: string): Promise<string>;
    /**
     * Rebalance shards across nodes
     */
    rebalanceShards(nodes: Array<{
        agentId: string;
        capacity: number;
    }>): Promise<void>;
    /**
     * Get sharding metrics
     */
    getMetrics(): ShardingMetrics;
    /**
     * Get current shard map
     */
    getShardMap(): ShardMap;
    /**
     * Get migration tasks
     */
    getMigrationTasks(): MigrationTask[];
    /**
     * Private methods
     */
    private initializeShardMap;
    private getShardByConsistentHash;
    private getShardByRange;
    private getShardByHash;
    private getShardByHybrid;
    private keyInRange;
    private createShardForKey;
    private selectNodeForNewShard;
    private selectReplicaNodes;
    private addShardToNode;
    private removeShardFromNode;
    private removeShard;
    private updateKeyRanges;
    private migrateShards;
    private createMigrationTask;
    private executeMigration;
    private calculateImbalance;
    private createRebalancePlan;
    private executeRebalancePlan;
    private scheduleRebalance;
    private updateMetrics;
    private generateShardId;
    private generateMigrationId;
    private hashKey;
    private generateStartKey;
    private generateEndKey;
    private isSpecialKey;
    private chunkArray;
}
//# sourceMappingURL=memory-sharding.d.ts.map