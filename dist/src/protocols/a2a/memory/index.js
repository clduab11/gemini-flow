/**
 * A2A Memory Coordination System
 *
 * Comprehensive distributed memory management for Agent-to-Agent communication
 * providing eventual consistency with strong guarantees for critical state.
 */
// Core distributed memory manager
export { DistributedMemoryManager, } from "./distributed-memory-manager.js";
// CRDT-based state synchronization
export { CRDTSynchronizer, GCounter, PNCounter, ORSet, LWWRegister, MVRegister, CRDTMap, } from "./crdt-sync.js";
// Vector clock management
export { VectorClock, VectorClockManager, } from "./vector-clocks.js";
// Gossip protocol for memory propagation
export { GossipProtocol, } from "./gossip-protocol.js";
// Memory sharding and partitioning
export { MemorySharding, } from "./memory-sharding.js";
// Conflict resolution mechanisms
export { ConflictResolver, } from "./conflict-resolver.js";
// Memory compression and optimization
export { MemoryCompressor, } from "./memory-compressor.js";
/**
 * Factory function to create a complete A2A memory coordination system
 */
export function createA2AMemorySystem(config) {
    const { agentId, topology = {}, shardingStrategy = "consistent_hash", compressionEnabled = true, gossipConfig = {}, conflictResolutionStrategy = "lww", } = config;
    // Initialize core components
    const vectorClock = new VectorClock(agentId);
    const crdtSync = new CRDTSynchronizer(agentId, vectorClock);
    const conflictResolver = new ConflictResolver(vectorClock, conflictResolutionStrategy);
    const memoryCompressor = new MemoryCompressor(compressionEnabled);
    const memorySharding = new MemorySharding(shardingStrategy);
    // Initialize distributed memory manager
    const memoryManager = new DistributedMemoryManager(agentId, topology, {
        enableCompression: compressionEnabled,
        enableSharding: true,
        enableGossip: true,
    });
    return {
        memoryManager,
        vectorClock,
        crdtSync,
        conflictResolver,
        memoryCompressor,
        memorySharding,
        // Convenience methods
        async initialize(nodes) {
            // Initialize sharding with nodes
            memorySharding.initializeNodes(nodes.map((node) => ({
                agentId: node.agentId,
                capacity: node.capacity?.memory || 100,
            })));
            // Add nodes to memory manager
            for (const node of nodes) {
                if (node.agentId !== agentId) {
                    await memoryManager.addAgent(node);
                }
            }
            return this;
        },
        async shutdown() {
            // Graceful shutdown of all components
            await memoryManager.emergencyCleanup("system_shutdown");
            vectorClock.destroy();
        },
        getStats() {
            return {
                memory: memoryManager.getMemoryMetrics(),
                synchronization: memoryManager.getSynchronizationStats(),
                conflicts: conflictResolver.getStats(),
                compression: memoryCompressor.getStats(),
                sharding: memorySharding.getMetrics(),
                vectorClock: vectorClock.getPruningStats(),
            };
        },
    };
}
/**
 * Default configuration for development/testing
 */
export const DEFAULT_A2A_MEMORY_CONFIG = {
    topology: {
        type: "mesh",
        replicationFactor: 3,
        partitionStrategy: "consistent_hash",
        consistencyLevel: "eventual",
    },
    shardingStrategy: "consistent_hash",
    compressionEnabled: true,
    gossipConfig: {
        fanout: 3,
        gossipInterval: 5000,
        maxTTL: 10,
        syncInterval: 30000,
    },
    conflictResolutionStrategy: "lww",
};
/**
 * Configuration for production environments
 */
export const PRODUCTION_A2A_MEMORY_CONFIG = {
    topology: {
        type: "hierarchical",
        replicationFactor: 5,
        partitionStrategy: "consistent_hash",
        consistencyLevel: "bounded_staleness",
    },
    shardingStrategy: "hybrid",
    compressionEnabled: true,
    gossipConfig: {
        fanout: 5,
        gossipInterval: 3000,
        maxTTL: 15,
        syncInterval: 20000,
        compressionThreshold: 512,
        adaptiveGossip: true,
    },
    conflictResolutionStrategy: "semantic",
};
//# sourceMappingURL=index.js.map