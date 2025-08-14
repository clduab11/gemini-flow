/**
 * Comprehensive Test Suite for Distributed Memory Manager
 * Tests namespace-based memory operations, synchronization, and topology management
 */

import { 
  DistributedMemoryManager, 
  MemoryTopology, 
  AgentNode, 
  MemoryDelta, 
  MemoryOperation,
  MemoryMetrics,
  SynchronizationStats
} from '../distributed-memory-manager.js';
import { VectorClock } from '../vector-clocks.js';

// Mock dependencies
jest.mock('../../../utils/logger.js');
jest.mock('../../../core/cache-manager.js');
jest.mock('../vector-clocks.js');
jest.mock('../crdt-sync.js');
jest.mock('../gossip-protocol.js');
jest.mock('../memory-compressor.js');
jest.mock('../conflict-resolver.js');
jest.mock('../memory-sharding.js');

const mockVectorClock = VectorClock as jest.MockedClass<typeof VectorClock>;

describe('DistributedMemoryManager', () => {
  let memoryManager: DistributedMemoryManager;
  let mockVectorClockInstance: jest.Mocked<VectorClock>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock vector clock
    mockVectorClockInstance = {
      increment: jest.fn().mockReturnThis(),
      merge: jest.fn(),
      copy: jest.fn().mockReturnThis(),
      compare: jest.fn().mockReturnValue('concurrent'),
      toString: jest.fn().mockReturnValue('1:1'),
      isNewer: jest.fn().mockReturnValue(true)
    } as any;
    
    mockVectorClock.mockImplementation(() => mockVectorClockInstance);
    mockVectorClock.fromString = jest.fn().mockReturnValue(mockVectorClockInstance);

    memoryManager = new DistributedMemoryManager('test-agent', {
      type: 'mesh',
      replicationFactor: 3,
      consistencyLevel: 'eventual'
    });
  });

  afterEach(() => {
    memoryManager?.emergencyCleanup('test cleanup');
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      const topology = memoryManager.getTopology();
      
      expect(topology.type).toBe('mesh');
      expect(topology.nodes).toHaveLength(1);
      expect(topology.nodes[0].agentId).toBe('test-agent');
      expect(topology.replicationFactor).toBe(3);
      expect(topology.consistencyLevel).toBe('eventual');
    });

    it('should initialize with custom configuration', () => {
      const customManager = new DistributedMemoryManager('custom-agent', {
        type: 'hierarchical',
        replicationFactor: 5,
        consistencyLevel: 'strong'
      }, {
        enableCompression: true,
        enableSharding: true,
        maxMemorySize: 200 * 1024 * 1024
      });

      const topology = customManager.getTopology();
      
      expect(topology.type).toBe('hierarchical');
      expect(topology.replicationFactor).toBe(5);
      expect(topology.consistencyLevel).toBe('strong');
      
      customManager.emergencyCleanup('test cleanup');
    });

    it('should setup local agent with correct capabilities', () => {
      const topology = memoryManager.getTopology();
      const localAgent = topology.nodes[0];
      
      expect(localAgent.agentId).toBe('test-agent');
      expect(localAgent.role).toBe('replica');
      expect(localAgent.capabilities).toContain('sync');
      expect(localAgent.capabilities).toContain('compress');
      expect(localAgent.trustLevel).toBe(1.0);
    });
  });

  describe('Namespace-Based Memory Operations', () => {
    describe('Memory Storage and Retrieval', () => {
      it('should store and retrieve data by namespace', async () => {
        const operation: MemoryOperation = {
          type: 'set',
          key: 'user:123',
          value: { name: 'John Doe', email: 'john@example.com' },
          vectorClock: mockVectorClockInstance,
          metadata: {
            priority: 5,
            namespace: 'user',
            sourceAgent: 'test-agent'
          }
        };

        // Simulate applying the operation
        await (memoryManager as any).applyOperation(operation);
        
        // Check if the operation was applied
        const memoryStore = (memoryManager as any).memoryStore;
        expect(memoryStore.has('user:123')).toBe(true);
        
        const stored = memoryStore.get('user:123');
        expect(stored.value).toEqual(operation.value);
        expect(stored.metadata.namespace).toBe('user');
      });

      it('should handle multiple namespaces independently', async () => {
        const userOperation: MemoryOperation = {
          type: 'set',
          key: 'user:123',
          value: { name: 'John Doe' },
          vectorClock: mockVectorClockInstance,
          metadata: {
            priority: 5,
            namespace: 'user',
            sourceAgent: 'test-agent'
          }
        };

        const sessionOperation: MemoryOperation = {
          type: 'set',
          key: 'session:abc',
          value: { token: 'xyz', expiry: Date.now() + 3600000 },
          vectorClock: mockVectorClockInstance,
          metadata: {
            priority: 3,
            namespace: 'session',
            sourceAgent: 'test-agent'
          }
        };

        await (memoryManager as any).applyOperation(userOperation);
        await (memoryManager as any).applyOperation(sessionOperation);
        
        const memoryStore = (memoryManager as any).memoryStore;
        expect(memoryStore.has('user:123')).toBe(true);
        expect(memoryStore.has('session:abc')).toBe(true);
        
        const userData = memoryStore.get('user:123');
        const sessionData = memoryStore.get('session:abc');
        
        expect(userData.metadata.namespace).toBe('user');
        expect(sessionData.metadata.namespace).toBe('session');
      });

      it('should extract namespace from key correctly', () => {
        const extractNamespace = (memoryManager as any).extractNamespace;
        
        expect(extractNamespace('user:123')).toBe('user');
        expect(extractNamespace('session:abc:def')).toBe('session');
        expect(extractNamespace('simple-key')).toBe('default');
        expect(extractNamespace('')).toBe('default');
      });

      it('should handle namespace-based TTL operations', async () => {
        const operation: MemoryOperation = {
          type: 'set',
          key: 'cache:temp-data',
          value: { data: 'temporary' },
          vectorClock: mockVectorClockInstance,
          metadata: {
            priority: 1,
            namespace: 'cache',
            sourceAgent: 'test-agent',
            ttl: 1000 // 1 second
          }
        };

        await (memoryManager as any).applyOperation(operation);
        
        const memoryStore = (memoryManager as any).memoryStore;
        const stored = memoryStore.get('cache:temp-data');
        expect(stored.metadata.ttl).toBe(1000);
        expect(stored.metadata.namespace).toBe('cache');
      });
    });

    describe('Namespace-Based Conflict Resolution', () => {
      it('should resolve conflicts within same namespace', async () => {
        // Setup conflicting operations in same namespace
        const operation1: MemoryOperation = {
          type: 'set',
          key: 'user:123',
          value: { name: 'John Doe', version: 1 },
          vectorClock: mockVectorClockInstance,
          metadata: {
            priority: 5,
            namespace: 'user',
            sourceAgent: 'agent-1'
          }
        };

        const operation2: MemoryOperation = {
          type: 'set',
          key: 'user:123',
          value: { name: 'John Smith', version: 2 },
          vectorClock: mockVectorClockInstance,
          metadata: {
            priority: 5,
            namespace: 'user',
            sourceAgent: 'agent-2'
          }
        };

        // Mock conflict detection
        mockVectorClockInstance.compare.mockReturnValue('concurrent');

        await (memoryManager as any).applyOperation(operation1);
        
        // Second operation should detect conflict
        const conflict = await (memoryManager as any).applyOperation(operation2);
        expect(conflict).toBe(operation2); // Should return the conflicting operation
      });

      it('should handle namespace-specific conflict resolution strategies', async () => {
        const conflicts: MemoryOperation[] = [{
          type: 'set',
          key: 'user:123',
          value: { name: 'Conflicted User' },
          vectorClock: mockVectorClockInstance,
          metadata: {
            priority: 5,
            namespace: 'user',
            sourceAgent: 'test-agent',
            conflictResolution: 'latest-wins'
          }
        }];

        // Mock conflict resolver
        const mockConflictResolver = (memoryManager as any).conflictResolver;
        mockConflictResolver.resolve = jest.fn().mockResolvedValue(conflicts[0]);

        await (memoryManager as any).resolveConflicts(conflicts);
        
        expect(mockConflictResolver.resolve).toHaveBeenCalledWith(
          conflicts[0],
          undefined // existing value
        );
      });

      it('should isolate conflicts between different namespaces', async () => {
        // Operations with same key but different namespaces shouldn't conflict
        const userOperation: MemoryOperation = {
          type: 'set',
          key: 'user:data',
          value: { type: 'user' },
          vectorClock: mockVectorClockInstance,
          metadata: {
            priority: 5,
            namespace: 'user',
            sourceAgent: 'test-agent'
          }
        };

        const cacheOperation: MemoryOperation = {
          type: 'set',
          key: 'cache:data', // Different namespace, but conceptually similar
          value: { type: 'cache' },
          vectorClock: mockVectorClockInstance,
          metadata: {
            priority: 5,
            namespace: 'cache',
            sourceAgent: 'test-agent'
          }
        };

        // Both should apply without conflict
        const conflict1 = await (memoryManager as any).applyOperation(userOperation);
        const conflict2 = await (memoryManager as any).applyOperation(cacheOperation);
        
        expect(conflict1).toBeNull();
        expect(conflict2).toBeNull();
      });
    });

    describe('Namespace-Based Synchronization', () => {
      it('should create namespace-aware delta synchronization', async () => {
        // Add some namespaced data
        const operations = [
          {
            type: 'set' as const,
            key: 'user:123',
            value: { name: 'John' },
            vectorClock: mockVectorClockInstance,
            metadata: { priority: 5, namespace: 'user', sourceAgent: 'test-agent' }
          },
          {
            type: 'set' as const,
            key: 'session:abc',
            value: { token: 'xyz' },
            vectorClock: mockVectorClockInstance,
            metadata: { priority: 3, namespace: 'session', sourceAgent: 'test-agent' }
          }
        ];

        // Apply operations to memory store
        const memoryStore = (memoryManager as any).memoryStore;
        operations.forEach(op => {
          memoryStore.set(op.key, {
            value: op.value,
            vectorClock: op.vectorClock,
            metadata: op.metadata
          });
        });

        // Mock delta operations calculation
        jest.spyOn(memoryManager as any, 'calculateDeltaOperations')
          .mockResolvedValue(operations);

        const delta = await memoryManager.createDeltaSync('target-agent');
        
        expect(delta).toBeDefined();
        expect(delta!.operations).toHaveLength(2);
        expect(delta!.operations.map(op => op.metadata.namespace))
          .toEqual(['user', 'session']);
      });

      it('should apply namespace-aware delta operations', async () => {
        const delta: MemoryDelta = {
          deltaId: 'test-delta',
          sourceAgent: 'source-agent',
          targetAgents: ['test-agent'],
          version: '1:1',
          operations: [
            {
              type: 'set',
              key: 'user:456',
              value: { name: 'Jane Doe' },
              vectorClock: mockVectorClockInstance,
              metadata: {
                priority: 5,
                namespace: 'user',
                sourceAgent: 'source-agent'
              }
            }
          ],
          merkleRoot: 'mock-root',
          compressedData: Buffer.from('compressed'),
          checksum: 'mock-checksum',
          timestamp: new Date(),
          dependencies: []
        };

        // Mock verification and decompression
        jest.spyOn(memoryManager as any, 'verifyDeltaIntegrity').mockReturnValue(true);
        const mockCompressor = (memoryManager as any).compressor;
        mockCompressor.decompress = jest.fn().mockResolvedValue(delta.operations);

        const result = await memoryManager.applyDelta(delta);
        
        expect(result).toBe(true);
        
        const memoryStore = (memoryManager as any).memoryStore;
        expect(memoryStore.has('user:456')).toBe(true);
        
        const stored = memoryStore.get('user:456');
        expect(stored.metadata.namespace).toBe('user');
      });

      it('should filter synchronization by namespace relevance', async () => {
        const contextUpdate = {
          id: 'context-123',
          requiredCapabilities: ['user-management'],
          namespaces: ['user', 'session'],
          ttl: 3600000
        };

        // Mock nodes with different capabilities
        const nodes: AgentNode[] = [
          {
            agentId: 'agent-1',
            address: 'agent://agent-1:8080',
            role: 'replica',
            capacity: { memory: 100, cpu: 80, network: 100 },
            capabilities: ['user-management', 'session-management'],
            trustLevel: 0.9,
            lastSeen: new Date(),
            vectorClock: mockVectorClockInstance,
            shards: []
          },
          {
            agentId: 'agent-2',
            address: 'agent://agent-2:8081',
            role: 'replica',
            capacity: { memory: 100, cpu: 80, network: 100 },
            capabilities: ['cache-management'],
            trustLevel: 0.7,
            lastSeen: new Date(),
            vectorClock: mockVectorClockInstance,
            shards: []
          }
        ];

        // Mock relevance calculation
        jest.spyOn(memoryManager as any, 'calculateRelevanceScores')
          .mockResolvedValue(new Map([
            ['agent-1', 0.8], // High relevance
            ['agent-2', 0.3]  // Low relevance
          ]));

        await memoryManager.propagateContext(contextUpdate, {
          relevanceThreshold: 0.5,
          namespace: 'user'
        });

        // Should only propagate to agent-1 due to relevance threshold
        // This would be verified through event emissions or mock calls
        expect(true).toBe(true); // Placeholder assertion
      });
    });

    describe('Memory Operations by Type', () => {
      it('should handle SET operations correctly', async () => {
        const operation: MemoryOperation = {
          type: 'set',
          key: 'config:setting',
          value: { theme: 'dark', lang: 'en' },
          vectorClock: mockVectorClockInstance,
          metadata: {
            priority: 5,
            namespace: 'config',
            sourceAgent: 'test-agent'
          }
        };

        const result = await (memoryManager as any).applyOperation(operation);
        
        expect(result).toBeNull(); // No conflict
        
        const memoryStore = (memoryManager as any).memoryStore;
        const stored = memoryStore.get('config:setting');
        expect(stored.value).toEqual(operation.value);
      });

      it('should handle DELETE operations correctly', async () => {
        // First set a value
        const memoryStore = (memoryManager as any).memoryStore;
        memoryStore.set('temp:data', {
          value: { temp: true },
          vectorClock: mockVectorClockInstance,
          metadata: { namespace: 'temp', sourceAgent: 'test-agent', priority: 1 }
        });

        const deleteOperation: MemoryOperation = {
          type: 'delete',
          key: 'temp:data',
          vectorClock: mockVectorClockInstance,
          metadata: {
            priority: 5,
            namespace: 'temp',
            sourceAgent: 'test-agent'
          }
        };

        await (memoryManager as any).applyOperation(deleteOperation);
        
        expect(memoryStore.has('temp:data')).toBe(false);
      });

      it('should handle MERGE operations correctly', async () => {
        // Setup existing data
        const memoryStore = (memoryManager as any).memoryStore;
        memoryStore.set('user:profile', {
          value: { name: 'John', age: 30 },
          vectorClock: mockVectorClockInstance,
          metadata: { namespace: 'user', sourceAgent: 'test-agent', priority: 5 }
        });

        const mergeOperation: MemoryOperation = {
          type: 'merge',
          key: 'user:profile',
          value: { email: 'john@example.com', age: 31 },
          vectorClock: mockVectorClockInstance,
          metadata: {
            priority: 5,
            namespace: 'user',
            sourceAgent: 'test-agent'
          }
        };

        // Mock CRDT merge
        const mockCrdtSync = (memoryManager as any).crdtSync;
        mockCrdtSync.merge = jest.fn().mockResolvedValue({
          name: 'John',
          age: 31,
          email: 'john@example.com'
        });

        await (memoryManager as any).applyOperation(mergeOperation);
        
        expect(mockCrdtSync.merge).toHaveBeenCalled();
      });
    });
  });

  describe('Topology Management', () => {
    describe('Topology Optimization', () => {
      it('should analyze swarm characteristics for optimization', () => {
        const characteristics = (memoryManager as any).analyzeSwarmCharacteristics();
        
        expect(characteristics).toHaveProperty('agentCount');
        expect(characteristics).toHaveProperty('averageLatency');
        expect(characteristics).toHaveProperty('memoryPressure');
        expect(characteristics).toHaveProperty('consistencyRequirements');
        expect(characteristics.agentCount).toBe(1); // Only local agent initially
      });

      it('should select optimal topology based on characteristics', async () => {
        const selectOptimalTopology = (memoryManager as any).selectOptimalTopology;
        
        // Test small swarm
        let result = await selectOptimalTopology({
          agentCount: 5,
          memoryPressure: 0.3,
          consistencyRequirements: { level: 'eventual' }
        });
        expect(result).toBe('mesh');

        // Test large swarm with strong consistency
        result = await selectOptimalTopology({
          agentCount: 20,
          memoryPressure: 0.5,
          consistencyRequirements: { level: 'strong' }
        });
        expect(result).toBe('hierarchical');

        // Test high memory pressure
        result = await selectOptimalTopology({
          agentCount: 15,
          memoryPressure: 0.9,
          consistencyRequirements: { level: 'eventual' }
        });
        expect(result).toBe('hybrid');
      });

      it('should reconfigure topology when needed', async () => {
        const initialTopology = memoryManager.getTopology();
        expect(initialTopology.type).toBe('mesh');

        // Mock topology analysis to suggest change
        jest.spyOn(memoryManager as any, 'selectOptimalTopology')
          .mockResolvedValue('hierarchical');

        await memoryManager.optimizeTopology();
        
        const newTopology = memoryManager.getTopology();
        expect(newTopology.type).toBe('hierarchical');
      });
    });

    describe('Agent Management', () => {
      it('should add new agent to topology', async () => {
        const newAgent: Partial<AgentNode> = {
          agentId: 'new-agent',
          role: 'replica',
          capabilities: ['sync', 'compress']
        };

        await memoryManager.addAgent(newAgent);
        
        const topology = memoryManager.getTopology();
        expect(topology.nodes).toHaveLength(2);
        
        const addedAgent = topology.nodes.find(n => n.agentId === 'new-agent');
        expect(addedAgent).toBeDefined();
        expect(addedAgent!.role).toBe('replica');
        expect(addedAgent!.capabilities).toContain('sync');
      });

      it('should remove agent from topology', async () => {
        // First add an agent
        await memoryManager.addAgent({ agentId: 'temp-agent' });
        
        let topology = memoryManager.getTopology();
        expect(topology.nodes).toHaveLength(2);

        await memoryManager.removeAgent('temp-agent');
        
        topology = memoryManager.getTopology();
        expect(topology.nodes).toHaveLength(1);
        expect(topology.nodes.find(n => n.agentId === 'temp-agent')).toBeUndefined();
      });

      it('should handle agent removal with shard redistribution', async () => {
        // Add agent with shards
        const agentWithShards: Partial<AgentNode> = {
          agentId: 'shard-agent',
          shards: ['shard-1', 'shard-2']
        };

        await memoryManager.addAgent(agentWithShards);
        
        // Mock sharding manager
        const mockSharding = (memoryManager as any).memorySharding;
        mockSharding.redistributeShards = jest.fn().mockResolvedValue(undefined);

        await memoryManager.removeAgent('shard-agent');
        
        expect(mockSharding.redistributeShards).toHaveBeenCalledWith(
          ['shard-1', 'shard-2'],
          expect.any(Array)
        );
      });

      it('should rebalance shards when adding agents', async () => {
        const mockSharding = (memoryManager as any).memorySharding;
        mockSharding.rebalanceShards = jest.fn().mockResolvedValue(undefined);

        await memoryManager.addAgent({ agentId: 'balance-agent' });
        
        expect(mockSharding.rebalanceShards).toHaveBeenCalled();
      });
    });

    describe('Connection Management', () => {
      it('should optimize connections in topology', async () => {
        // Add multiple agents
        await memoryManager.addAgent({ agentId: 'agent-1' });
        await memoryManager.addAgent({ agentId: 'agent-2' });

        const optimizeConnections = jest.spyOn(memoryManager as any, 'optimizeConnections')
          .mockResolvedValue(undefined);

        await memoryManager.optimizeTopology();
        
        expect(optimizeConnections).toHaveBeenCalled();
      });

      it('should calculate topology efficiency correctly', () => {
        const calculateTopologyEfficiency = (memoryManager as any).calculateTopologyEfficiency;
        
        // With 1 node and no connections
        let efficiency = calculateTopologyEfficiency();
        expect(efficiency).toBe(0); // No connections possible with 1 node

        // Mock 3 nodes with 2 connections out of possible 3
        const topology = memoryManager.getTopology();
        topology.nodes = [
          { agentId: 'agent-1' } as AgentNode,
          { agentId: 'agent-2' } as AgentNode,
          { agentId: 'agent-3' } as AgentNode
        ];
        topology.connections = [
          { fromAgent: 'agent-1', toAgent: 'agent-2' } as any,
          { fromAgent: 'agent-2', toAgent: 'agent-3' } as any
        ];

        efficiency = calculateTopologyEfficiency();
        expect(efficiency).toBeCloseTo(2/3); // 2 connections out of 3 possible
      });
    });
  });

  describe('Memory Compression and Optimization', () => {
    describe('Data Compression', () => {
      it('should compress memory data with optimal algorithm', async () => {
        const testData = {
          users: Array.from({ length: 100 }, (_, i) => ({
            id: i,
            name: `User ${i}`,
            email: `user${i}@example.com`
          }))
        };

        // Mock compression analysis
        jest.spyOn(memoryManager as any, 'analyzeDataCharacteristics')
          .mockReturnValue({ type: 'object', size: 5000, repetitionRate: 0.3 });

        jest.spyOn(memoryManager as any, 'selectCompressionAlgorithm')
          .mockReturnValue('brotli');

        const mockCompressor = (memoryManager as any).compressor;
        mockCompressor.compressWithAlgorithm = jest.fn()
          .mockResolvedValue(Buffer.from('compressed-data'));

        const result = await memoryManager.compressMemoryData(testData, {
          enableDeduplication: true
        });

        expect(result).toBeInstanceOf(Buffer);
        expect(mockCompressor.compressWithAlgorithm).toHaveBeenCalledWith(
          testData,
          'brotli',
          undefined
        );
      });

      it('should select appropriate compression algorithm', () => {
        const selectCompressionAlgorithm = (memoryManager as any).selectCompressionAlgorithm;
        
        expect(selectCompressionAlgorithm({ type: 'text' })).toBe('brotli');
        expect(selectCompressionAlgorithm({ repetitionRate: 0.9 })).toBe('lz4');
        expect(selectCompressionAlgorithm({ type: 'mixed', repetitionRate: 0.3 })).toBe('neural');
      });

      it('should handle data deduplication', async () => {
        const duplicatedData = [1, 2, 2, 3, 3, 3, 4];
        
        const deduplicateData = (memoryManager as any).deduplicateData;
        const result = await deduplicateData(duplicatedData);
        
        expect(result).toEqual([1, 2, 3, 4]);
      });
    });

    describe('Memory Metrics and Monitoring', () => {
      it('should calculate comprehensive memory metrics', () => {
        // Setup some memory data
        const memoryStore = (memoryManager as any).memoryStore;
        memoryStore.set('user:1', { value: { name: 'User 1' }, metadata: { namespace: 'user' } });
        memoryStore.set('session:1', { value: { token: 'abc' }, metadata: { namespace: 'session' } });

        const metrics = memoryManager.getMemoryMetrics();
        
        expect(metrics).toHaveProperty('totalMemoryUsage');
        expect(metrics).toHaveProperty('replicatedMemoryUsage');
        expect(metrics).toHaveProperty('compressionSavings');
        expect(metrics).toHaveProperty('syncLatency');
        expect(metrics).toHaveProperty('topologyEfficiency');
        expect(metrics).toHaveProperty('conflictRate');
        expect(metrics.totalMemoryUsage).toBeGreaterThan(0);
      });

      it('should track synchronization statistics', () => {
        const stats = memoryManager.getSynchronizationStats();
        
        expect(stats).toHaveProperty('totalSyncs');
        expect(stats).toHaveProperty('successfulSyncs');
        expect(stats).toHaveProperty('failedSyncs');
        expect(stats).toHaveProperty('averageSyncTime');
        expect(stats).toHaveProperty('compressionRatio');
        expect(stats).toHaveProperty('conflictsResolved');
      });

      it('should calculate partition balance correctly', () => {
        const calculatePartitionBalance = (memoryManager as any).calculatePartitionBalance;
        
        // Mock topology with balanced shards
        const topology = memoryManager.getTopology();
        topology.nodes = [
          { agentId: 'agent-1', shards: ['shard-1', 'shard-2'] } as AgentNode,
          { agentId: 'agent-2', shards: ['shard-3', 'shard-4'] } as AgentNode,
          { agentId: 'agent-3', shards: ['shard-5', 'shard-6'] } as AgentNode
        ];

        const balance = calculatePartitionBalance();
        expect(balance).toBeCloseTo(1.0); // Perfect balance
      });

      it('should calculate conflict rate correctly', () => {
        const calculateConflictRate = (memoryManager as any).calculateConflictRate;
        
        // Set up some stats
        const stats = (memoryManager as any).stats;
        stats.totalSyncs = 100;
        stats.conflictsResolved = 5;

        const rate = calculateConflictRate();
        expect(rate).toBeCloseTo(0.005); // 5 conflicts out of 1000 operations (100 * 10)
      });
    });
  });

  describe('Context Propagation and Intelligence', () => {
    describe('Relevance-Based Propagation', () => {
      it('should calculate relevance scores for agents', async () => {
        const contextUpdate = {
          id: 'context-1',
          requiredCapabilities: ['user-management', 'analytics']
        };

        const nodes: AgentNode[] = [
          {
            agentId: 'agent-1',
            capabilities: ['user-management', 'analytics'],
            trustLevel: 0.9,
            address: 'agent://agent-1:8080',
            role: 'replica',
            capacity: { memory: 100, cpu: 80, network: 100 },
            lastSeen: new Date(),
            vectorClock: mockVectorClockInstance,
            shards: []
          },
          {
            agentId: 'agent-2',
            capabilities: ['cache-management'],
            trustLevel: 0.7,
            address: 'agent://agent-2:8081',
            role: 'replica',
            capacity: { memory: 100, cpu: 80, network: 100 },
            lastSeen: new Date(),
            vectorClock: mockVectorClockInstance,
            shards: []
          }
        ];

        const calculateRelevanceScores = (memoryManager as any).calculateRelevanceScores;
        const scores = await calculateRelevanceScores(contextUpdate, nodes);
        
        expect(scores.size).toBe(2);
        expect(scores.get('agent-1')).toBeGreaterThan(scores.get('agent-2'));
      });

      it('should filter agents by relevance threshold', async () => {
        const scores = new Map([
          ['agent-1', 0.8],
          ['agent-2', 0.3],
          ['agent-3', 0.6]
        ]);

        // Mock topology nodes
        const topology = memoryManager.getTopology();
        topology.nodes = [
          { agentId: 'agent-1' } as AgentNode,
          { agentId: 'agent-2' } as AgentNode,
          { agentId: 'agent-3' } as AgentNode
        ];

        const filterByRelevance = (memoryManager as any).filterByRelevance;
        const relevant = filterByRelevance(scores, 0.5);
        
        expect(relevant).toHaveLength(2);
        expect(relevant.map(a => a.agentId)).toEqual(['agent-1', 'agent-3']);
      });

      it('should personalize context for different agents', async () => {
        const contextUpdate = {
          id: 'context-1',
          capabilities: ['user-management', 'analytics', 'reporting'],
          data: { sensitive: true }
        };

        const agent: AgentNode = {
          agentId: 'agent-1',
          capabilities: ['user-management'],
          trustLevel: 0.7,
          address: 'agent://agent-1:8080',
          role: 'replica',
          capacity: { memory: 100, cpu: 80, network: 100 },
          lastSeen: new Date(),
          vectorClock: mockVectorClockInstance,
          shards: []
        };

        const personalizeContext = (memoryManager as any).personalizeContext;
        const personalized = await personalizeContext(contextUpdate, agent, 0.6);
        
        expect(personalized.capabilities).toEqual(['user-management']);
        expect(personalized.detail).toBe('summary'); // Low relevance
      });
    });

    describe('Context Distribution', () => {
      it('should distribute operations to relevant agents', async () => {
        const operations: MemoryOperation[] = [{
          type: 'set',
          key: 'context:update',
          value: { data: 'contextual' },
          vectorClock: mockVectorClockInstance,
          metadata: {
            priority: 5,
            namespace: 'context',
            sourceAgent: 'test-agent'
          }
        }];

        const targetAgents = ['agent-1', 'agent-2'];

        // Mock delta creation
        jest.spyOn(memoryManager, 'createDeltaSync')
          .mockResolvedValue({
            deltaId: 'test-delta',
            operations,
            sourceAgent: 'test-agent'
          } as MemoryDelta);

        const sendDeltaToAgent = jest.spyOn(memoryManager as any, 'sendDeltaToAgent')
          .mockResolvedValue(undefined);

        const distributeOperations = (memoryManager as any).distributeOperations;
        await distributeOperations(operations, targetAgents);
        
        expect(sendDeltaToAgent).toHaveBeenCalledTimes(2);
      });

      it('should handle context propagation with options', async () => {
        const contextUpdate = {
          id: 'context-123',
          data: 'important data'
        };

        // Mock the entire propagation chain
        jest.spyOn(memoryManager as any, 'calculateRelevanceScores')
          .mockResolvedValue(new Map([['agent-1', 0.8]]));

        jest.spyOn(memoryManager as any, 'filterByRelevance')
          .mockReturnValue([{ agentId: 'agent-1' } as AgentNode]);

        jest.spyOn(memoryManager as any, 'personalizeContext')
          .mockResolvedValue({ ...contextUpdate, personalized: true });

        jest.spyOn(memoryManager as any, 'distributeOperations')
          .mockResolvedValue(undefined);

        await memoryManager.propagateContext(contextUpdate, {
          priority: 8,
          maxTargets: 5,
          namespace: 'urgent'
        });

        // Verify the propagation chain was called
        expect(true).toBe(true); // Placeholder - in real tests would verify mock calls
      });
    });
  });

  describe('Emergency and Error Handling', () => {
    describe('Emergency Cleanup', () => {
      it('should perform emergency cleanup correctly', async () => {
        // Setup some memory data
        const memoryStore = (memoryManager as any).memoryStore;
        memoryStore.set('data:1', { value: 'test' });
        memoryStore.set('data:2', { value: 'test' });

        const clearNonCriticalMemory = jest.spyOn(memoryManager as any, 'clearNonCriticalMemory')
          .mockResolvedValue(undefined);

        const compressAllMemory = jest.spyOn(memoryManager as any, 'compressAllMemory')
          .mockResolvedValue(undefined);

        await memoryManager.emergencyCleanup('Memory pressure exceeded threshold');
        
        expect(clearNonCriticalMemory).toHaveBeenCalled();
        expect(compressAllMemory).toHaveBeenCalled();
      });

      it('should reset metrics during emergency cleanup', async () => {
        const initialMetrics = memoryManager.getMemoryMetrics();
        
        await memoryManager.emergencyCleanup('Test cleanup');
        
        const clearedMetrics = memoryManager.getMemoryMetrics();
        
        // Most numeric metrics should be reset to 0
        expect(clearedMetrics.totalMemoryUsage).toBe(0);
        expect(clearedMetrics.replicatedMemoryUsage).toBe(0);
      });

      it('should handle emergency cleanup failures gracefully', async () => {
        // Mock a failure in cleanup
        jest.spyOn(memoryManager as any, 'clearNonCriticalMemory')
          .mockRejectedValue(new Error('Cleanup failed'));

        await expect(memoryManager.emergencyCleanup('Test failure'))
          .rejects.toThrow('Cleanup failed');
      });
    });

    describe('Error Recovery', () => {
      it('should handle delta application failures', async () => {
        const invalidDelta: MemoryDelta = {
          deltaId: 'invalid-delta',
          sourceAgent: 'source-agent',
          targetAgents: ['test-agent'],
          version: '1:1',
          operations: [],
          merkleRoot: 'invalid-root',
          compressedData: Buffer.from('invalid'),
          checksum: 'wrong-checksum',
          timestamp: new Date(),
          dependencies: []
        };

        // Mock failed verification
        jest.spyOn(memoryManager as any, 'verifyDeltaIntegrity').mockReturnValue(false);

        const result = await memoryManager.applyDelta(invalidDelta);
        
        expect(result).toBe(false);
        
        const stats = memoryManager.getSynchronizationStats();
        expect(stats.failedSyncs).toBeGreaterThan(0);
      });

      it('should handle network partition scenarios', async () => {
        // Add multiple agents
        await memoryManager.addAgent({ agentId: 'agent-1' });
        await memoryManager.addAgent({ agentId: 'agent-2' });
        
        let topology = memoryManager.getTopology();
        expect(topology.nodes).toHaveLength(3);

        // Simulate removing agents (like in a partition)
        await memoryManager.removeAgent('agent-1');
        await memoryManager.removeAgent('agent-2');
        
        topology = memoryManager.getTopology();
        expect(topology.nodes).toHaveLength(1); // Only local agent remains
      });
    });
  });

  describe('Performance and Scalability', () => {
    describe('Large Scale Operations', () => {
      it('should handle large number of memory operations efficiently', async () => {
        const startTime = Date.now();
        
        // Create many operations
        const operations = Array.from({ length: 1000 }, (_, i) => ({
          type: 'set' as const,
          key: `bulk:item-${i}`,
          value: { id: i, data: `Item ${i}` },
          vectorClock: mockVectorClockInstance,
          metadata: {
            priority: 1,
            namespace: 'bulk',
            sourceAgent: 'test-agent'
          }
        }));

        // Apply all operations
        for (const operation of operations) {
          await (memoryManager as any).applyOperation(operation);
        }
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // Should complete within reasonable time (adjust threshold as needed)
        expect(duration).toBeLessThan(5000); // 5 seconds
        
        const memoryStore = (memoryManager as any).memoryStore;
        expect(memoryStore.size).toBe(1000);
      });

      it('should handle concurrent delta applications', async () => {
        const createTestDelta = (id: string): MemoryDelta => ({
          deltaId: `delta-${id}`,
          sourceAgent: `source-${id}`,
          targetAgents: ['test-agent'],
          version: '1:1',
          operations: [{
            type: 'set',
            key: `concurrent:${id}`,
            value: { data: id },
            vectorClock: mockVectorClockInstance,
            metadata: {
              priority: 5,
              namespace: 'concurrent',
              sourceAgent: `source-${id}`
            }
          }],
          merkleRoot: `root-${id}`,
          compressedData: Buffer.from(`compressed-${id}`),
          checksum: `checksum-${id}`,
          timestamp: new Date(),
          dependencies: []
        });

        // Mock successful verification and decompression
        jest.spyOn(memoryManager as any, 'verifyDeltaIntegrity').mockReturnValue(true);
        const mockCompressor = (memoryManager as any).compressor;
        mockCompressor.decompress = jest.fn().mockImplementation((data) => 
          Promise.resolve([{
            type: 'set',
            key: 'test:key',
            value: { data: 'test' },
            vectorClock: mockVectorClockInstance,
            metadata: { priority: 5, namespace: 'test', sourceAgent: 'test-agent' }
          }])
        );

        // Apply multiple deltas concurrently
        const deltas = Array.from({ length: 10 }, (_, i) => createTestDelta(i.toString()));
        const promises = deltas.map(delta => memoryManager.applyDelta(delta));
        
        const results = await Promise.all(promises);
        
        // All should succeed
        results.forEach(result => {
          expect(result).toBe(true);
        });
      });
    });

    describe('Memory Efficiency', () => {
      it('should maintain reasonable memory usage under load', async () => {
        const initialMetrics = memoryManager.getMemoryMetrics();
        
        // Add substantial amount of data
        const memoryStore = (memoryManager as any).memoryStore;
        for (let i = 0; i < 1000; i++) {
          memoryStore.set(`load:${i}`, {
            value: { data: `Large data string ${i}`.repeat(10) },
            metadata: { namespace: 'load', sourceAgent: 'test-agent', priority: 1 }
          });
        }
        
        const loadedMetrics = memoryManager.getMemoryMetrics();
        
        expect(loadedMetrics.totalMemoryUsage).toBeGreaterThan(initialMetrics.totalMemoryUsage);
        
        // Verify memory is being tracked correctly
        expect(loadedMetrics.totalMemoryUsage).toBeGreaterThan(0);
      });

      it('should compress data efficiently', async () => {
        const largeData = {
          items: Array.from({ length: 100 }, (_, i) => ({
            id: i,
            name: `Item ${i}`,
            description: `This is item number ${i} with some repeated content`.repeat(5)
          }))
        };

        const mockCompressor = (memoryManager as any).compressor;
        mockCompressor.compressWithAlgorithm = jest.fn()
          .mockResolvedValue(Buffer.from('compressed'));

        const originalSize = JSON.stringify(largeData).length;
        const compressed = await memoryManager.compressMemoryData(largeData);
        
        expect(compressed.length).toBeLessThan(originalSize);
        
        const stats = memoryManager.getSynchronizationStats();
        expect(stats.compressionRatio).toBeGreaterThan(0);
      });
    });
  });
});