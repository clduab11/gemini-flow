/**
 * A2A Memory Coordination System
 * 
 * Comprehensive distributed memory management for Agent-to-Agent communication
 * providing eventual consistency with strong guarantees for critical state.
 */

// Core distributed memory manager
export { 
  DistributedMemoryManager,
  type MemoryTopology,
  type AgentNode,
  type Connection,
  type MemoryDelta,
  type MemoryOperation,
  type SynchronizationStats,
  type MemoryMetrics
} from './distributed-memory-manager.js';

// CRDT-based state synchronization
export {
  CRDTSynchronizer,
  GCounter,
  PNCounter,
  ORSet,
  LWWRegister,
  MVRegister,
  CRDTMap,
  type CRDT,
  type CRDTType,
  type CRDTOperation,
  type SyncState
} from './crdt-sync.js';

// Vector clock management
export {
  VectorClock,
  VectorClockManager,
  type ClockComparison,
  type VectorClockState,
  type ClockDelta,
  type ClockPruningConfig
} from './vector-clocks.js';

// Gossip protocol for memory propagation
export {
  GossipProtocol,
  type GossipMessage,
  type GossipNode,
  type GossipConfig,
  type GossipStats
} from './gossip-protocol.js';

// Memory sharding and partitioning
export {
  MemorySharding,
  type ShardingStrategy,
  type Shard,
  type ShardMap,
  type ShardingConfig,
  type MigrationTask,
  type ShardingMetrics
} from './memory-sharding.js';

// Conflict resolution mechanisms
export {
  ConflictResolver,
  type ConflictResolutionStrategy,
  type ConflictContext,
  type ConflictValue,
  type ConflictResolution,
  type OperationalTransform,
  type ConflictRule,
  type ConflictCondition,
  type ConflictStats
} from './conflict-resolver.js';

// Memory compression and optimization
export {
  MemoryCompressor,
  type CompressionAlgorithm,
  type CompressionOptions,
  type CompressionResult,
  type DecompressionResult,
  type DataFingerprint,
  type CompressionStats,
  type OptimizationRule
} from './memory-compressor.js';

/**
 * Factory function to create a complete A2A memory coordination system
 */
export function createA2AMemorySystem(config: {
  agentId: string;
  topology?: Partial<MemoryTopology>;
  shardingStrategy?: ShardingStrategy;
  compressionEnabled?: boolean;
  gossipConfig?: Partial<GossipConfig>;
  conflictResolutionStrategy?: ConflictResolutionStrategy;
}) {
  const {
    agentId,
    topology = {},
    shardingStrategy = 'consistent_hash',
    compressionEnabled = true,
    gossipConfig = {},
    conflictResolutionStrategy = 'lww'
  } = config;

  // Initialize core components
  const vectorClock = new VectorClock(agentId);
  const crdtSync = new CRDTSynchronizer(agentId, vectorClock);
  const conflictResolver = new ConflictResolver(vectorClock, conflictResolutionStrategy);
  const memoryCompressor = new MemoryCompressor(compressionEnabled);
  const memorySharding = new MemorySharding(shardingStrategy);
  
  // Initialize distributed memory manager
  const memoryManager = new DistributedMemoryManager(
    agentId,
    topology,
    {
      enableCompression: compressionEnabled,
      enableSharding: true,
      enableGossip: true
    }
  );

  return {
    memoryManager,
    vectorClock,
    crdtSync,
    conflictResolver,
    memoryCompressor,
    memorySharding,
    
    // Convenience methods
    async initialize(nodes: Array<{ agentId: string; address: string; capacity: any }>) {
      // Initialize sharding with nodes
      memorySharding.initializeNodes(nodes.map(node => ({
        agentId: node.agentId,
        capacity: node.capacity?.memory || 100
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
      await memoryManager.emergencyCleanup('system_shutdown');
      vectorClock.destroy();
    },
    
    getStats() {
      return {
        memory: memoryManager.getMemoryMetrics(),
        synchronization: memoryManager.getSynchronizationStats(),
        conflicts: conflictResolver.getStats(),
        compression: memoryCompressor.getStats(),
        sharding: memorySharding.getMetrics(),
        vectorClock: vectorClock.getPruningStats()
      };
    }
  };
}

/**
 * Default configuration for development/testing
 */
export const DEFAULT_A2A_MEMORY_CONFIG = {
  topology: {
    type: 'mesh' as const,
    replicationFactor: 3,
    partitionStrategy: 'consistent_hash' as const,
    consistencyLevel: 'eventual' as const
  },
  shardingStrategy: 'consistent_hash' as const,
  compressionEnabled: true,
  gossipConfig: {
    fanout: 3,
    gossipInterval: 5000,
    maxTTL: 10,
    syncInterval: 30000
  },
  conflictResolutionStrategy: 'lww' as ConflictResolutionStrategy
};

/**
 * Configuration for production environments
 */
export const PRODUCTION_A2A_MEMORY_CONFIG = {
  topology: {
    type: 'hierarchical' as const,
    replicationFactor: 5,
    partitionStrategy: 'consistent_hash' as const,
    consistencyLevel: 'bounded_staleness' as const
  },
  shardingStrategy: 'hybrid' as const,
  compressionEnabled: true,
  gossipConfig: {
    fanout: 5,
    gossipInterval: 3000,
    maxTTL: 15,
    syncInterval: 20000,
    compressionThreshold: 512,
    adaptiveGossip: true
  },
  conflictResolutionStrategy: 'semantic' as ConflictResolutionStrategy
};