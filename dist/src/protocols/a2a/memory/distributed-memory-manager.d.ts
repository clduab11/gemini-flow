/**
 * Distributed Memory Manager for A2A Agents
 *
 * Core memory coordination system providing:
 * - Distributed memory topology optimization
 * - Delta synchronization with Merkle trees
 * - Intelligent context propagation
 * - Advanced compression algorithms
 * - Memory sharding and partitioning
 * - Real-time health monitoring
 */
/// <reference types="node" resolution-mode="require"/>
/// <reference types="node" resolution-mode="require"/>
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { VectorClock } from "./vector-clocks.js";
export interface MemoryTopology {
    type: "mesh" | "hierarchical" | "ring" | "star" | "hybrid";
    nodes: AgentNode[];
    connections: Connection[];
    replicationFactor: number;
    partitionStrategy: "hash" | "range" | "consistent_hash";
    consistencyLevel: "eventual" | "strong" | "bounded_staleness";
}
export interface AgentNode {
    agentId: string;
    address: string;
    role: "coordinator" | "replica" | "partition" | "observer";
    capacity: {
        memory: number;
        cpu: number;
        network: number;
    };
    capabilities: string[];
    trustLevel: number;
    lastSeen: Date;
    vectorClock: VectorClock;
    shards: string[];
}
export interface Connection {
    fromAgent: string;
    toAgent: string;
    latency: number;
    bandwidth: number;
    reliability: number;
    lastSync: Date;
    syncVersion: string;
}
export interface MemoryDelta {
    deltaId: string;
    sourceAgent: string;
    targetAgents: string[];
    version: string;
    operations: MemoryOperation[];
    merkleRoot: string;
    compressedData: Buffer;
    checksum: string;
    timestamp: Date;
    dependencies: string[];
}
export interface MemoryOperation {
    type: "set" | "delete" | "merge" | "conflict_resolve";
    key: string;
    value?: any;
    vectorClock: VectorClock;
    metadata: {
        priority: number;
        ttl?: number;
        namespace: string;
        sourceAgent: string;
        conflictResolution?: string;
    };
}
export interface SynchronizationStats {
    totalSyncs: number;
    successfulSyncs: number;
    failedSyncs: number;
    averageSyncTime: number;
    averageDeltaSize: number;
    compressionRatio: number;
    conflictsResolved: number;
    lastSyncTime: Date;
    networkUtilization: number;
}
export interface MemoryMetrics {
    totalMemoryUsage: number;
    replicatedMemoryUsage: number;
    compressionSavings: number;
    syncLatency: {
        min: number;
        max: number;
        avg: number;
    };
    topologyEfficiency: number;
    partitionBalance: number;
    conflictRate: number;
    throughput: {
        reads: number;
        writes: number;
        syncs: number;
    };
}
/**
 * Distributed Memory Manager - Orchestrates all memory coordination
 */
export declare class DistributedMemoryManager extends EventEmitter {
    private logger;
    private cache;
    private topology;
    private localAgent;
    private vectorClock;
    private crdtSync;
    private gossipProtocol;
    private compressor;
    private conflictResolver;
    private memorySharding;
    private memoryStore;
    private pendingDeltas;
    private syncQueue;
    private stats;
    private metrics;
    constructor(agentId: string, initialTopology?: Partial<MemoryTopology>, config?: {
        enableCompression?: boolean;
        enableSharding?: boolean;
        enableGossip?: boolean;
        maxMemorySize?: number;
        syncInterval?: number;
        compressionThreshold?: number;
    });
    /**
     * Initialize core components
     */
    private initializeComponents;
    /**
     * Optimize memory topology based on swarm characteristics
     */
    optimizeTopology(): Promise<void>;
    /**
     * Analyze swarm characteristics for topology optimization
     */
    private analyzeSwarmCharacteristics;
    /**
     * Select optimal topology based on characteristics
     */
    private selectOptimalTopology;
    /**
     * Create delta synchronization package
     */
    createDeltaSync(targetAgent: string, lastSyncVersion?: string): Promise<MemoryDelta>;
    /**
     * Apply delta synchronization
     */
    applyDelta(delta: MemoryDelta): Promise<boolean>;
    /**
     * Intelligent context propagation
     */
    propagateContext(contextUpdate: any, options?: {
        priority?: number;
        relevanceThreshold?: number;
        maxTargets?: number;
        namespace?: string;
    }): Promise<void>;
    /**
     * Advanced memory compression
     */
    compressMemoryData(data: any, options?: {
        algorithm?: "lz4" | "brotli" | "neural";
        compressionLevel?: number;
        enableDeduplication?: boolean;
    }): Promise<Buffer>;
    /**
     * Get comprehensive memory metrics
     */
    getMemoryMetrics(): MemoryMetrics;
    /**
     * Get synchronization statistics
     */
    getSynchronizationStats(): SynchronizationStats;
    /**
     * Get current topology information
     */
    getTopology(): MemoryTopology;
    /**
     * Add new agent to the topology
     */
    addAgent(agent: Partial<AgentNode>): Promise<void>;
    /**
     * Remove agent from topology
     */
    removeAgent(agentId: string): Promise<void>;
    /**
     * Emergency memory cleanup
     */
    emergencyCleanup(reason: string): Promise<void>;
    /**
     * Private helper methods
     */
    private generateAddress;
    private generateDeltaId;
    private calculateMerkleRoot;
    private calculateChecksum;
    private calculateDeltaOperations;
    private verifyDeltaIntegrity;
    private applyOperation;
    private resolveConflicts;
    private mergeOperation;
    private updateLocalState;
    private calculateRelevanceScores;
    private filterByRelevance;
    private personalizeContext;
    private distributeOperations;
    private analyzeDataCharacteristics;
    private selectCompressionAlgorithm;
    private deduplicateData;
    private updateMetrics;
    private calculateTotalMemoryUsage;
    private calculateReplicatedMemoryUsage;
    private calculateCompressionSavings;
    private calculateTopologyEfficiency;
    private calculatePartitionBalance;
    private calculateConflictRate;
    private setupComponentHandlers;
    private setupGossipHandlers;
    private startSynchronization;
    private stopSynchronization;
    private performPeriodicSync;
    private sendDeltaToAgent;
    private calculateAverageLatency;
    private calculateMemoryPressure;
    private analyzeConsistencyRequirements;
    private detectNetworkPartitions;
    private analyzeWorkloadPatterns;
    private reconfigureTopology;
    private optimizeConnections;
    private getMemoryState;
    private getDependencies;
    private updateSyncStats;
    private getLastKnownVersion;
    private extractNamespace;
    private calculateCapabilityMatch;
    private findConnection;
    private calculateAverageRelevance;
    private clearNonCriticalMemory;
    private compressAllMemory;
    private resetMetrics;
}
//# sourceMappingURL=distributed-memory-manager.d.ts.map