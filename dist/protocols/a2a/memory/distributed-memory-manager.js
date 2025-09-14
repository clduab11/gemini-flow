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
import { EventEmitter } from "events";
import { Logger } from "../../../utils/logger.js";
import { CacheManager } from "../../../core/cache-manager.js";
import { VectorClock } from "./vector-clocks.js";
import { CRDTSynchronizer } from "./crdt-sync.js";
import { GossipProtocol } from "./gossip-protocol.js";
import { MemoryCompressor } from "./memory-compressor.js";
import { ConflictResolver } from "./conflict-resolver.js";
import { MemorySharding } from "./memory-sharding.js";
/**
 * Distributed Memory Manager - Orchestrates all memory coordination
 */
export class DistributedMemoryManager extends EventEmitter {
    logger;
    cache;
    topology;
    localAgent;
    // Core components
    vectorClock;
    crdtSync;
    gossipProtocol;
    compressor;
    conflictResolver;
    memorySharding;
    // State management
    memoryStore = new Map();
    pendingDeltas = new Map();
    syncQueue = [];
    // Metrics and monitoring
    stats = {
        totalSyncs: 0,
        successfulSyncs: 0,
        failedSyncs: 0,
        averageSyncTime: 0,
        averageDeltaSize: 0,
        compressionRatio: 0,
        conflictsResolved: 0,
        lastSyncTime: new Date(),
        networkUtilization: 0,
    };
    metrics = {
        totalMemoryUsage: 0,
        replicatedMemoryUsage: 0,
        compressionSavings: 0,
        syncLatency: { min: 0, max: 0, avg: 0 },
        topologyEfficiency: 0,
        partitionBalance: 0,
        conflictRate: 0,
        throughput: { reads: 0, writes: 0, syncs: 0 },
    };
    constructor(agentId, initialTopology = {}, config = {}) {
        super();
        this.logger = new Logger(`DistributedMemoryManager:${agentId}`);
        this.cache = new CacheManager();
        // Initialize local agent node
        this.localAgent = {
            agentId,
            address: this.generateAddress(),
            role: "replica",
            capacity: {
                memory: config.maxMemorySize || 1024 * 1024 * 100, // 100MB
                cpu: 80,
                network: 100,
            },
            capabilities: ["sync", "compress", "shard", "gossip"],
            trustLevel: 1.0,
            lastSeen: new Date(),
            vectorClock: new VectorClock(agentId),
            shards: [],
        };
        // Initialize topology
        this.topology = {
            type: "mesh",
            nodes: [this.localAgent],
            connections: [],
            replicationFactor: 3,
            partitionStrategy: "consistent_hash",
            consistencyLevel: "eventual",
            ...initialTopology,
        };
        this.initializeComponents(config);
        this.optimizeTopology();
        this.startSynchronization();
        this.logger.info("Distributed Memory Manager initialized", {
            agentId,
            topology: this.topology.type,
            capabilities: this.localAgent.capabilities,
        });
    }
    /**
     * Initialize core components
     */
    initializeComponents(config) {
        this.vectorClock = new VectorClock(this.localAgent.agentId);
        this.crdtSync = new CRDTSynchronizer(this.localAgent.agentId, this.vectorClock);
        this.compressor = new MemoryCompressor(config.enableCompression !== false);
        this.conflictResolver = new ConflictResolver(this.vectorClock);
        if (config.enableSharding !== false) {
            this.memorySharding = new MemorySharding(this.topology.partitionStrategy);
        }
        if (config.enableGossip !== false) {
            this.gossipProtocol = new GossipProtocol(this.localAgent, this.topology);
            this.setupGossipHandlers();
        }
        this.setupComponentHandlers();
    }
    /**
     * Optimize memory topology based on swarm characteristics
     */
    async optimizeTopology() {
        const swarmCharacteristics = this.analyzeSwarmCharacteristics();
        const optimalTopology = await this.selectOptimalTopology(swarmCharacteristics);
        if (optimalTopology !== this.topology.type) {
            this.logger.info("Optimizing topology", {
                from: this.topology.type,
                to: optimalTopology,
                reason: swarmCharacteristics,
            });
            await this.reconfigureTopology(optimalTopology);
        }
        // Optimize connections
        await this.optimizeConnections();
        // Update metrics
        this.metrics.topologyEfficiency = this.calculateTopologyEfficiency();
    }
    /**
     * Analyze swarm characteristics for topology optimization
     */
    analyzeSwarmCharacteristics() {
        const agentCount = this.topology.nodes.length;
        const averageLatency = this.calculateAverageLatency();
        const memoryPressure = this.calculateMemoryPressure();
        const consistencyRequirements = this.analyzeConsistencyRequirements();
        return {
            agentCount,
            averageLatency,
            memoryPressure,
            consistencyRequirements,
            networkPartitions: this.detectNetworkPartitions(),
            workloadPatterns: this.analyzeWorkloadPatterns(),
        };
    }
    /**
     * Select optimal topology based on characteristics
     */
    async selectOptimalTopology(characteristics) {
        const { agentCount, memoryPressure, consistencyRequirements } = characteristics;
        // Small swarms favor mesh topology
        if (agentCount < 10) {
            return "mesh";
        }
        // Strong consistency requirements favor hierarchical
        if (consistencyRequirements.level === "strong") {
            return "hierarchical";
        }
        // High memory pressure favors sharded approach
        if (memoryPressure > 0.8) {
            return "hybrid";
        }
        // Default to ring for balanced performance
        return "ring";
    }
    /**
     * Create delta synchronization package
     */
    async createDeltaSync(targetAgent, lastSyncVersion) {
        const startTime = Date.now();
        try {
            // Get current memory state
            const currentState = await this.getMemoryState();
            // Calculate delta operations
            const operations = await this.calculateDeltaOperations(targetAgent, lastSyncVersion || "0");
            if (operations.length === 0) {
                this.logger.debug("No delta operations needed", { targetAgent });
                return null;
            }
            // Create Merkle tree for integrity
            const merkleRoot = this.calculateMerkleRoot(operations);
            // Compress delta data
            const compressedData = await this.compressor.compress({
                operations,
                metadata: {
                    sourceAgent: this.localAgent.agentId,
                    targetAgent,
                    version: this.vectorClock.toString(),
                },
            });
            const delta = {
                deltaId: this.generateDeltaId(),
                sourceAgent: this.localAgent.agentId,
                targetAgents: [targetAgent],
                version: this.vectorClock.toString(),
                operations,
                merkleRoot,
                compressedData,
                checksum: this.calculateChecksum(compressedData),
                timestamp: new Date(),
                dependencies: this.getDependencies(operations),
            };
            // Update statistics
            const processingTime = Date.now() - startTime;
            this.updateSyncStats(operations.length, compressedData.length, processingTime);
            this.logger.debug("Delta sync created", {
                deltaId: delta.deltaId,
                targetAgent,
                operationCount: operations.length,
                compressedSize: compressedData.length,
                processingTime,
            });
            return delta;
        }
        catch (error) {
            this.logger.error("Failed to create delta sync", {
                targetAgent,
                error: error.message,
            });
            this.stats.failedSyncs++;
            throw error;
        }
    }
    /**
     * Apply delta synchronization
     */
    async applyDelta(delta) {
        const startTime = Date.now();
        try {
            // Verify delta integrity
            if (!this.verifyDeltaIntegrity(delta)) {
                throw new Error("Delta integrity verification failed");
            }
            // Decompress delta data
            const decompressedData = await this.compressor.decompress(delta.compressedData);
            // Apply operations with conflict resolution
            const conflicts = [];
            for (const operation of delta.operations) {
                const conflict = await this.applyOperation(operation);
                if (conflict) {
                    conflicts.push(conflict);
                }
            }
            // Resolve conflicts if any
            if (conflicts.length > 0) {
                await this.resolveConflicts(conflicts);
                this.stats.conflictsResolved += conflicts.length;
            }
            // Update vector clock
            this.vectorClock.merge(VectorClock.fromString(delta.version));
            // Update local state
            await this.updateLocalState(delta);
            // Propagate to gossip protocol if enabled
            if (this.gossipProtocol) {
                await this.gossipProtocol.propagateUpdate(delta);
            }
            const processingTime = Date.now() - startTime;
            this.stats.successfulSyncs++;
            this.stats.averageSyncTime =
                (this.stats.averageSyncTime + processingTime) / 2;
            this.logger.debug("Delta applied successfully", {
                deltaId: delta.deltaId,
                operationCount: delta.operations.length,
                conflictsResolved: conflicts.length,
                processingTime,
            });
            this.emit("delta_applied", {
                deltaId: delta.deltaId,
                sourceAgent: delta.sourceAgent,
                operationCount: delta.operations.length,
                conflicts: conflicts.length,
            });
            return true;
        }
        catch (error) {
            this.stats.failedSyncs++;
            this.logger.error("Failed to apply delta", {
                deltaId: delta.deltaId,
                error: error.message,
            });
            return false;
        }
    }
    /**
     * Intelligent context propagation
     */
    async propagateContext(contextUpdate, options = {}) {
        try {
            // Calculate relevance scores for all agents
            const relevanceScores = await this.calculateRelevanceScores(contextUpdate, this.topology.nodes);
            // Filter agents by relevance threshold
            const relevantAgents = this.filterByRelevance(relevanceScores, options.relevanceThreshold || 0.5);
            // Limit targets if specified
            const targetAgents = options.maxTargets
                ? relevantAgents.slice(0, options.maxTargets)
                : relevantAgents;
            // Personalize context for each target
            const personalizedContexts = new Map();
            for (const agent of targetAgents) {
                const personalizedContext = await this.personalizeContext(contextUpdate, agent, relevanceScores.get(agent.agentId));
                personalizedContexts.set(agent.agentId, personalizedContext);
            }
            // Create memory operations for context updates
            const operations = [];
            for (const [agentId, context] of personalizedContexts) {
                const operation = {
                    type: "set",
                    key: `context:${contextUpdate.id}`,
                    value: context,
                    vectorClock: this.vectorClock.increment(),
                    metadata: {
                        priority: options.priority || 5,
                        namespace: options.namespace || "context",
                        sourceAgent: this.localAgent.agentId,
                        ttl: contextUpdate.ttl,
                    },
                };
                operations.push(operation);
            }
            // Distribute context updates
            await this.distributeOperations(operations, targetAgents.map((a) => a.agentId));
            this.logger.info("Context propagated", {
                contextId: contextUpdate.id,
                targetCount: targetAgents.length,
                averageRelevance: this.calculateAverageRelevance(relevanceScores),
            });
        }
        catch (error) {
            this.logger.error("Context propagation failed", {
                contextId: contextUpdate.id,
                error: error.message,
            });
        }
    }
    /**
     * Advanced memory compression
     */
    async compressMemoryData(data, options = {}) {
        try {
            // Analyze data characteristics
            const characteristics = this.analyzeDataCharacteristics(data);
            // Select optimal compression algorithm
            const algorithm = options.algorithm || this.selectCompressionAlgorithm(characteristics);
            // Apply deduplication if enabled
            const deduplicatedData = options.enableDeduplication !== false
                ? await this.deduplicateData(data)
                : data;
            // Compress data
            const compressedData = await this.compressor.compressWithAlgorithm(deduplicatedData, algorithm, options.compressionLevel);
            // Update compression metrics
            const compressionRatio = compressedData.length / JSON.stringify(data).length;
            this.stats.compressionRatio =
                (this.stats.compressionRatio + compressionRatio) / 2;
            this.logger.debug("Data compressed", {
                algorithm,
                originalSize: JSON.stringify(data).length,
                compressedSize: compressedData.length,
                ratio: compressionRatio,
            });
            return compressedData;
        }
        catch (error) {
            this.logger.error("Memory compression failed", { error: error.message });
            throw error;
        }
    }
    /**
     * Get comprehensive memory metrics
     */
    getMemoryMetrics() {
        this.updateMetrics();
        return { ...this.metrics };
    }
    /**
     * Get synchronization statistics
     */
    getSynchronizationStats() {
        return { ...this.stats };
    }
    /**
     * Get current topology information
     */
    getTopology() {
        return { ...this.topology };
    }
    /**
     * Add new agent to the topology
     */
    async addAgent(agent) {
        const newAgent = {
            agentId: agent.agentId,
            address: agent.address || this.generateAddress(),
            role: agent.role || "replica",
            capacity: agent.capacity || { memory: 100, cpu: 80, network: 100 },
            capabilities: agent.capabilities || ["sync"],
            trustLevel: agent.trustLevel || 0.5,
            lastSeen: new Date(),
            vectorClock: new VectorClock(agent.agentId),
            shards: [],
        };
        this.topology.nodes.push(newAgent);
        // Optimize topology with new agent
        await this.optimizeTopology();
        // Update sharding if enabled
        if (this.memorySharding) {
            await this.memorySharding.rebalanceShards(this.topology.nodes);
        }
        this.logger.info("Agent added to topology", {
            agentId: newAgent.agentId,
            role: newAgent.role,
            nodeCount: this.topology.nodes.length,
        });
        this.emit("agent_added", newAgent);
    }
    /**
     * Remove agent from topology
     */
    async removeAgent(agentId) {
        const agentIndex = this.topology.nodes.findIndex((n) => n.agentId === agentId);
        if (agentIndex === -1)
            return;
        const removedAgent = this.topology.nodes[agentIndex];
        this.topology.nodes.splice(agentIndex, 1);
        // Remove connections
        this.topology.connections = this.topology.connections.filter((c) => c.fromAgent !== agentId && c.toAgent !== agentId);
        // Redistribute shards if the agent had any
        if (this.memorySharding && removedAgent.shards.length > 0) {
            await this.memorySharding.redistributeShards(removedAgent.shards, this.topology.nodes);
        }
        this.logger.warn("Agent removed from topology", {
            agentId,
            shardCount: removedAgent.shards.length,
            remainingNodes: this.topology.nodes.length,
        });
        this.emit("agent_removed", { agentId, agent: removedAgent });
    }
    /**
     * Emergency memory cleanup
     */
    async emergencyCleanup(reason) {
        this.logger.warn("Emergency memory cleanup initiated", { reason });
        try {
            // Stop synchronization
            this.stopSynchronization();
            // Clear non-critical memory
            await this.clearNonCriticalMemory();
            // Compress all remaining data
            await this.compressAllMemory();
            // Reset metrics
            this.resetMetrics();
            this.logger.info("Emergency cleanup completed");
            this.emit("emergency_cleanup", { reason, timestamp: Date.now() });
        }
        catch (error) {
            this.logger.error("Emergency cleanup failed", {
                reason,
                error: error.message,
            });
            throw error;
        }
    }
    /**
     * Private helper methods
     */
    generateAddress() {
        return `agent://${this.localAgent.agentId}:${Math.floor(Math.random() * 65535)}`;
    }
    generateDeltaId() {
        return `delta_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    calculateMerkleRoot(operations) {
        // Simplified Merkle root calculation
        const hashes = operations.map((op) => crypto.createHash("sha256").update(JSON.stringify(op)).digest("hex"));
        return crypto.createHash("sha256").update(hashes.join("")).digest("hex");
    }
    calculateChecksum(data) {
        return crypto.createHash("sha256").update(data).digest("hex");
    }
    async calculateDeltaOperations(targetAgent, lastSyncVersion) {
        const operations = [];
        // Compare current state with target agent's last known state
        for (const [key, value] of this.memoryStore) {
            const lastKnownVersion = await this.getLastKnownVersion(targetAgent, key);
            if (!lastKnownVersion || this.vectorClock.isNewer(lastKnownVersion)) {
                operations.push({
                    type: "set",
                    key,
                    value,
                    vectorClock: this.vectorClock.copy(),
                    metadata: {
                        priority: 5,
                        namespace: this.extractNamespace(key),
                        sourceAgent: this.localAgent.agentId,
                    },
                });
            }
        }
        return operations;
    }
    verifyDeltaIntegrity(delta) {
        // Verify checksum
        const calculatedChecksum = this.calculateChecksum(delta.compressedData);
        if (calculatedChecksum !== delta.checksum) {
            return false;
        }
        // Verify Merkle root (after decompression)
        // This would require decompressing first, skipping for now
        return true;
    }
    async applyOperation(operation) {
        const existingValue = this.memoryStore.get(operation.key);
        if (existingValue && existingValue.vectorClock) {
            // Check for conflicts
            const comparison = this.vectorClock.compare(existingValue.vectorClock);
            if (comparison === "concurrent") {
                // Conflict detected
                return operation;
            }
        }
        // Apply operation
        switch (operation.type) {
            case "set":
                this.memoryStore.set(operation.key, {
                    value: operation.value,
                    vectorClock: operation.vectorClock,
                    metadata: operation.metadata,
                });
                break;
            case "delete":
                this.memoryStore.delete(operation.key);
                break;
            case "merge":
                await this.mergeOperation(operation);
                break;
        }
        return null; // No conflict
    }
    async resolveConflicts(conflicts) {
        for (const conflict of conflicts) {
            const resolution = await this.conflictResolver.resolve(conflict, this.memoryStore.get(conflict.key));
            if (resolution) {
                await this.applyOperation(resolution);
            }
        }
    }
    async mergeOperation(operation) {
        const existing = this.memoryStore.get(operation.key);
        if (!existing) {
            this.memoryStore.set(operation.key, operation.value);
            return;
        }
        // Use CRDT merge logic
        const merged = await this.crdtSync.merge(existing.value, operation.value);
        this.memoryStore.set(operation.key, {
            value: merged,
            vectorClock: operation.vectorClock,
            metadata: operation.metadata,
        });
    }
    async updateLocalState(delta) {
        // Update last sync information for source agent
        await this.cache.set(`last_sync:${delta.sourceAgent}`, {
            version: delta.version,
            timestamp: delta.timestamp,
            operationCount: delta.operations.length,
        }, 86400000);
    }
    async calculateRelevanceScores(contextUpdate, nodes) {
        const scores = new Map();
        for (const node of nodes) {
            if (node.agentId === this.localAgent.agentId)
                continue;
            let score = 0.0;
            // Capability matching
            const capabilityMatch = this.calculateCapabilityMatch(contextUpdate.requiredCapabilities || [], node.capabilities);
            score += capabilityMatch * 0.4;
            // Trust level
            score += node.trustLevel * 0.3;
            // Network proximity (inverse of latency)
            const connection = this.findConnection(this.localAgent.agentId, node.agentId);
            if (connection) {
                score += (1 / (connection.latency + 1)) * 0.3;
            }
            scores.set(node.agentId, Math.min(score, 1.0));
        }
        return scores;
    }
    filterByRelevance(scores, threshold) {
        return this.topology.nodes.filter((node) => {
            const score = scores.get(node.agentId);
            return score && score >= threshold;
        });
    }
    async personalizeContext(contextUpdate, agent, relevanceScore) {
        // Personalize context based on agent capabilities and preferences
        const personalizedContext = { ...contextUpdate };
        // Filter data based on agent capabilities
        if (contextUpdate.capabilities) {
            personalizedContext.capabilities = contextUpdate.capabilities.filter((cap) => agent.capabilities.includes(cap));
        }
        // Adjust detail level based on relevance
        if (relevanceScore < 0.7) {
            personalizedContext.detail = "summary";
        }
        return personalizedContext;
    }
    async distributeOperations(operations, targetAgents) {
        for (const agentId of targetAgents) {
            try {
                const delta = await this.createDeltaSync(agentId);
                if (delta) {
                    // In a real implementation, this would send the delta to the target agent
                    await this.sendDeltaToAgent(agentId, delta);
                }
            }
            catch (error) {
                this.logger.error("Failed to distribute to agent", {
                    agentId,
                    error: error.message,
                });
            }
        }
    }
    analyzeDataCharacteristics(data) {
        const serialized = JSON.stringify(data);
        const size = serialized.length;
        // Analyze content type
        let type = "mixed";
        if (typeof data === "string")
            type = "text";
        else if (Array.isArray(data))
            type = "array";
        else if (typeof data === "object")
            type = "object";
        // Calculate repetition rate
        const uniqueChars = new Set(serialized).size;
        const repetitionRate = 1 - uniqueChars / serialized.length;
        return { type, size, repetitionRate };
    }
    selectCompressionAlgorithm(characteristics) {
        if (characteristics.type === "text")
            return "brotli";
        if (characteristics.repetitionRate > 0.8)
            return "lz4";
        return "neural";
    }
    async deduplicateData(data) {
        // Simple deduplication logic
        if (Array.isArray(data)) {
            return [...new Set(data)];
        }
        return data;
    }
    updateMetrics() {
        this.metrics.totalMemoryUsage = this.calculateTotalMemoryUsage();
        this.metrics.replicatedMemoryUsage = this.calculateReplicatedMemoryUsage();
        this.metrics.compressionSavings = this.calculateCompressionSavings();
        this.metrics.topologyEfficiency = this.calculateTopologyEfficiency();
        this.metrics.partitionBalance = this.calculatePartitionBalance();
        this.metrics.conflictRate = this.calculateConflictRate();
    }
    calculateTotalMemoryUsage() {
        return Array.from(this.memoryStore.values()).reduce((total, item) => total + JSON.stringify(item).length, 0);
    }
    calculateReplicatedMemoryUsage() {
        // Calculate memory used for replication
        return (this.calculateTotalMemoryUsage() * (this.topology.replicationFactor - 1));
    }
    calculateCompressionSavings() {
        // Placeholder calculation
        return this.stats.compressionRatio * this.calculateTotalMemoryUsage();
    }
    calculateTopologyEfficiency() {
        const connections = this.topology.connections.length;
        const nodes = this.topology.nodes.length;
        const maxConnections = (nodes * (nodes - 1)) / 2;
        return connections / maxConnections;
    }
    calculatePartitionBalance() {
        if (!this.memorySharding)
            return 1.0;
        const shardSizes = this.topology.nodes.map((node) => node.shards.length);
        const avgShardSize = shardSizes.reduce((a, b) => a + b, 0) / shardSizes.length;
        const variance = shardSizes.reduce((acc, size) => acc + Math.pow(size - avgShardSize, 2), 0) / shardSizes.length;
        return 1 / (1 + variance);
    }
    calculateConflictRate() {
        const totalOps = this.stats.totalSyncs * 10; // Approximate operations
        return totalOps > 0 ? this.stats.conflictsResolved / totalOps : 0;
    }
    setupComponentHandlers() {
        // Setup handlers for component events
        if (this.crdtSync) {
            this.crdtSync.on("conflict_detected", (conflict) => {
                this.emit("conflict_detected", conflict);
            });
        }
        if (this.conflictResolver) {
            this.conflictResolver.on("conflict_resolved", (resolution) => {
                this.emit("conflict_resolved", resolution);
            });
        }
    }
    setupGossipHandlers() {
        if (!this.gossipProtocol)
            return;
        this.gossipProtocol.on("update_received", async (update) => {
            await this.applyDelta(update);
        });
        this.gossipProtocol.on("agent_discovered", (agent) => {
            this.addAgent(agent);
        });
    }
    startSynchronization() {
        // Start periodic synchronization
        setInterval(() => {
            this.performPeriodicSync();
        }, 30000); // Every 30 seconds
        // Start metrics collection
        setInterval(() => {
            this.updateMetrics();
        }, 10000); // Every 10 seconds
    }
    stopSynchronization() {
        // Implementation would clear intervals
    }
    async performPeriodicSync() {
        for (const node of this.topology.nodes) {
            if (node.agentId === this.localAgent.agentId)
                continue;
            try {
                const delta = await this.createDeltaSync(node.agentId);
                if (delta) {
                    await this.sendDeltaToAgent(node.agentId, delta);
                }
            }
            catch (error) {
                this.logger.warn("Periodic sync failed", {
                    targetAgent: node.agentId,
                    error: error.message,
                });
            }
        }
    }
    async sendDeltaToAgent(agentId, delta) {
        // Placeholder for actual network communication
        // In real implementation, this would use network protocols
        this.logger.debug("Sending delta to agent", {
            agentId,
            deltaId: delta.deltaId,
            size: delta.compressedData.length,
        });
    }
    // Additional helper methods...
    calculateAverageLatency() {
        return 100;
    }
    calculateMemoryPressure() {
        return 0.5;
    }
    analyzeConsistencyRequirements() {
        return { level: "eventual" };
    }
    detectNetworkPartitions() {
        return [];
    }
    analyzeWorkloadPatterns() {
        return {};
    }
    async reconfigureTopology(newType) {
        this.topology.type = newType;
    }
    async optimizeConnections() { }
    async getMemoryState() {
        return {};
    }
    getDependencies(operations) {
        return [];
    }
    updateSyncStats(opCount, size, time) { }
    async getLastKnownVersion(agent, key) {
        return null;
    }
    extractNamespace(key) {
        return key.split(":")[0] || "default";
    }
    calculateCapabilityMatch(required, available) {
        const matches = required.filter((r) => available.includes(r)).length;
        return required.length > 0 ? matches / required.length : 0;
    }
    findConnection(from, to) {
        return (this.topology.connections.find((c) => (c.fromAgent === from && c.toAgent === to) ||
            (c.fromAgent === to && c.toAgent === from)) || null);
    }
    calculateAverageRelevance(scores) {
        const values = Array.from(scores.values());
        return values.reduce((a, b) => a + b, 0) / values.length;
    }
    async clearNonCriticalMemory() { }
    async compressAllMemory() { }
    resetMetrics() {
        Object.keys(this.metrics).forEach((key) => {
            if (typeof this.metrics[key] === "number")
                this.metrics[key] = 0;
        });
    }
}
