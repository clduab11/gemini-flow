/**
 * Gossip Protocol for A2A Memory Propagation
 *
 * Implements epidemic-style information dissemination:
 * - Anti-entropy (periodic full synchronization)
 * - Rumor spreading (push/pull propagation)
 * - Failure detection and recovery
 * - Network partition tolerance
 * - Adaptive gossip based on network conditions
 * - Compression and batching for efficiency
 */
import { EventEmitter } from "events";
import { Logger } from "../../../utils/logger.js";
import { VectorClock } from "./vector-clocks.js";
/**
 * Main Gossip Protocol Implementation
 */
export class GossipProtocol extends EventEmitter {
    logger;
    localNode;
    topology; // Reference to memory topology
    // Configuration
    config = {
        fanout: 3,
        gossipInterval: 5000, // 5 seconds
        maxTTL: 10,
        syncInterval: 30000, // 30 seconds
        failureThreshold: 3,
        compressionThreshold: 1024, // 1KB
        batchSize: 10,
        adaptiveGossip: true,
        minQuorumThreshold: 0.51, // Default 51% threshold
    };
    // State management
    nodes = new Map();
    messageHistory = new Map();
    pendingMessages = [];
    sentMessages = new Map();
    // Timers
    gossipTimer;
    syncTimer;
    cleanupTimer;
    // Statistics
    stats = {
        messagesSent: 0,
        messagesReceived: 0,
        duplicatesReceived: 0,
        syncRequestsSent: 0,
        syncResponsesSent: 0,
        failedTransmissions: 0,
        averageLatency: 0,
        networkUtilization: 0,
        compressionRatio: 1.0,
    };
    constructor(localAgent, topology, config = {}) {
        super();
        this.logger = new Logger(`GossipProtocol:${localAgent.agentId}`);
        this.topology = topology;
        // Initialize local node
        this.localNode = {
            agentId: localAgent.agentId,
            address: localAgent.address,
            lastSeen: new Date(),
            isActive: true,
            failureCount: 0,
            roundTripTime: 0,
            reliability: 1.0,
            capacity: localAgent.capacity,
        };
        // Merge configuration
        this.config = { ...this.config, ...config };
        // Initialize from topology
        this.initializeFromTopology();
        // Start gossip protocol
        this.startGossip();
        this.logger.info("Gossip protocol initialized", {
            agentId: localAgent.agentId,
            fanout: this.config.fanout,
            nodeCount: this.nodes.size,
        });
    }
    /**
     * Propagate an update through the network
     */
    async propagateUpdate(update) {
        try {
            const message = {
                messageId: this.generateMessageId(),
                type: "update",
                sourceAgent: this.localNode.agentId,
                vectorClock: update.vectorClock || new VectorClock(this.localNode.agentId),
                payload: update,
                ttl: this.config.maxTTL,
                timestamp: new Date(),
                path: [this.localNode.agentId],
                priority: this.determinePriority(update),
            };
            await this.gossipMessage(message);
            this.logger.debug("Update propagated", {
                messageId: message.messageId,
                type: update.type,
                priority: message.priority,
            });
        }
        catch (error) {
            this.logger.error("Failed to propagate update", {
                update,
                error: error.message,
            });
        }
    }
    /**
     * Handle incoming gossip message
     */
    async handleMessage(message) {
        try {
            this.stats.messagesReceived++;
            // Check if we've seen this message before
            if (this.messageHistory.has(message.messageId)) {
                this.stats.duplicatesReceived++;
                this.logger.trace("Duplicate message received", {
                    messageId: message.messageId,
                    sourceAgent: message.sourceAgent,
                });
                return;
            }
            // Record message
            this.messageHistory.set(message.messageId, new Date());
            // Update source node info
            this.updateNodeInfo(message.sourceAgent, {
                lastSeen: new Date(),
                isActive: true,
                failureCount: 0,
            });
            // Process message based on type
            switch (message.type) {
                case "update":
                    await this.handleUpdateMessage(message);
                    break;
                case "sync_request":
                    await this.handleSyncRequest(message);
                    break;
                case "sync_response":
                    await this.handleSyncResponse(message);
                    break;
                case "heartbeat":
                    await this.handleHeartbeat(message);
                    break;
                case "rumor":
                    await this.handleRumor(message);
                    break;
            }
            // Continue propagation if TTL allows
            if (message.ttl > 1 && !message.path.includes(this.localNode.agentId)) {
                await this.continueGossip(message);
            }
        }
        catch (error) {
            this.logger.error("Failed to handle message", {
                messageId: message.messageId,
                error: error.message,
            });
        }
    }
    /**
     * Request synchronization with a specific node
     */
    async requestSync(targetAgent) {
        try {
            const message = {
                messageId: this.generateMessageId(),
                type: "sync_request",
                sourceAgent: this.localNode.agentId,
                targetAgent,
                vectorClock: new VectorClock(this.localNode.agentId),
                payload: {
                    requestedData: "all",
                    lastSyncVector: this.getLastSyncVector(targetAgent),
                },
                ttl: 1, // Direct message
                timestamp: new Date(),
                path: [this.localNode.agentId],
                priority: "medium",
            };
            await this.sendDirectMessage(targetAgent, message);
            this.stats.syncRequestsSent++;
            this.logger.debug("Sync requested", { targetAgent });
        }
        catch (error) {
            this.logger.error("Failed to request sync", {
                targetAgent,
                error: error.message,
            });
        }
    }
    /**
     * Add a new node to the gossip network
     */
    addNode(agentId, address, capacity) {
        const node = {
            agentId,
            address,
            lastSeen: new Date(),
            isActive: true,
            failureCount: 0,
            roundTripTime: 0,
            reliability: 0.5, // Start with medium reliability
            capacity: capacity || { bandwidth: 100, memory: 100, cpu: 100 },
        };
        this.nodes.set(agentId, node);
        this.logger.info("Node added to gossip network", {
            agentId,
            nodeCount: this.nodes.size,
        });
        this.emit("node_added", node);
    }
    /**
     * Remove a node from the gossip network
     */
    removeNode(agentId) {
        const node = this.nodes.get(agentId);
        if (node) {
            this.nodes.delete(agentId);
            this.logger.info("Node removed from gossip network", {
                agentId,
                nodeCount: this.nodes.size,
            });
            this.emit("node_removed", { agentId, node });
        }
    }
    /**
     * Get active nodes in the network
     */
    getActiveNodes() {
        return Array.from(this.nodes.values()).filter((node) => node.isActive && node.agentId !== this.localNode.agentId);
    }
    /**
     * Get gossip statistics
     */
    getStats() {
        this.updateNetworkUtilization();
        return { ...this.stats };
    }
    /**
     * Calculate minimum quorum size based on threshold
     */
    getMinQuorum() {
        return Math.ceil(this.nodes.size * this.config.minQuorumThreshold);
    }
    /**
     * Check if we have sufficient active nodes for quorum
     */
    hasQuorum() {
        const activeCount = this.getActiveNodes().length;
        return activeCount >= this.getMinQuorum();
    }
    /**
     * Update quorum threshold
     */
    updateQuorumThreshold(threshold) {
        if (threshold <= 0 || threshold > 1) {
            throw new Error("Quorum threshold must be between 0 and 1");
        }
        this.config.minQuorumThreshold = threshold;
        this.logger.info("Quorum threshold updated", { threshold });
    }
    /**
     * Update gossip configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        // Restart timers with new intervals
        this.stopGossip();
        this.startGossip();
        this.logger.info("Gossip configuration updated", newConfig);
    }
    /**
     * Perform manual anti-entropy synchronization
     */
    async performAntiEntropy() {
        const activeNodes = this.getActiveNodes();
        if (activeNodes.length === 0) {
            this.logger.debug("No active nodes for anti-entropy sync");
            return;
        }
        // Select random subset for synchronization
        const syncNodes = this.selectNodesForSync(activeNodes);
        for (const node of syncNodes) {
            try {
                await this.requestSync(node.agentId);
            }
            catch (error) {
                this.logger.warn("Anti-entropy sync failed", {
                    targetAgent: node.agentId,
                    error: error.message,
                });
            }
        }
        this.logger.debug("Anti-entropy synchronization completed", {
            syncedNodes: syncNodes.length,
        });
    }
    /**
     * Shutdown gossip protocol
     */
    shutdown() {
        this.stopGossip();
        // Mark local node as inactive
        this.localNode.isActive = false;
        // Send farewell messages
        this.sendFarewellMessages();
        // Clear state
        this.nodes.clear();
        this.messageHistory.clear();
        this.pendingMessages = [];
        this.sentMessages.clear();
        this.logger.info("Gossip protocol shut down");
    }
    /**
     * Private methods
     */
    initializeFromTopology() {
        if (this.topology && this.topology.nodes) {
            for (const node of this.topology.nodes) {
                if (node.agentId !== this.localNode.agentId) {
                    this.addNode(node.agentId, node.address, node.capacity);
                }
            }
        }
    }
    startGossip() {
        // Start gossip timer
        this.gossipTimer = setInterval(() => {
            this.performGossipRound();
        }, this.config.gossipInterval);
        // Start anti-entropy timer
        this.syncTimer = setInterval(() => {
            this.performAntiEntropy();
        }, this.config.syncInterval);
        // Start cleanup timer
        this.cleanupTimer = setInterval(() => {
            this.cleanupOldMessages();
        }, 60000); // Clean up every minute
        this.logger.debug("Gossip timers started");
    }
    stopGossip() {
        if (this.gossipTimer) {
            clearInterval(this.gossipTimer);
            this.gossipTimer = undefined;
        }
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
            this.syncTimer = undefined;
        }
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = undefined;
        }
        this.logger.debug("Gossip timers stopped");
    }
    async performGossipRound() {
        try {
            // Process pending messages
            if (this.pendingMessages.length > 0) {
                const batch = this.pendingMessages.splice(0, this.config.batchSize);
                for (const message of batch) {
                    await this.gossipMessage(message);
                }
            }
            // Send heartbeats
            await this.sendHeartbeats();
            // Check for failed nodes
            this.checkNodeFailures();
        }
        catch (error) {
            this.logger.error("Gossip round failed", { error: error.message });
        }
    }
    async gossipMessage(message) {
        const targets = this.selectGossipTargets(message);
        if (targets.length === 0) {
            this.logger.warn("No gossip targets available", {
                messageId: message.messageId,
            });
            return;
        }
        // Send to selected targets
        const promises = targets.map((target) => this.sendMessage(target.agentId, message));
        try {
            await Promise.allSettled(promises);
            this.stats.messagesSent += targets.length;
        }
        catch (error) {
            this.logger.error("Failed to gossip message", {
                messageId: message.messageId,
                targets: targets.length,
                error: error.message,
            });
        }
    }
    selectGossipTargets(message) {
        const activeNodes = this.getActiveNodes();
        if (activeNodes.length === 0) {
            return [];
        }
        let fanout = Math.min(this.config.fanout, activeNodes.length);
        // Adaptive fanout based on message priority
        if (this.config.adaptiveGossip) {
            switch (message.priority) {
                case "critical":
                    fanout = Math.min(activeNodes.length, fanout * 2);
                    break;
                case "high":
                    fanout = Math.min(activeNodes.length, Math.ceil(fanout * 1.5));
                    break;
                case "low":
                    fanout = Math.max(1, Math.floor(fanout * 0.5));
                    break;
            }
        }
        // Select nodes based on reliability and network conditions
        const candidates = activeNodes
            .filter((node) => !message.path.includes(node.agentId))
            .sort((a, b) => {
            // Sort by reliability and inverse round-trip time
            const scoreA = a.reliability - a.roundTripTime / 1000;
            const scoreB = b.reliability - b.roundTripTime / 1000;
            return scoreB - scoreA;
        });
        return candidates.slice(0, fanout);
    }
    async sendMessage(targetAgent, message) {
        const startTime = Date.now();
        try {
            // In a real implementation, this would use actual network communication
            // For now, we'll simulate the send operation
            const node = this.nodes.get(targetAgent);
            if (!node || !node.isActive) {
                throw new Error(`Target agent ${targetAgent} is not available`);
            }
            // Compress message if needed
            let finalMessage = message;
            if (this.shouldCompressMessage(message)) {
                finalMessage = await this.compressMessage(message);
            }
            // Simulate network delay
            await this.simulateNetworkDelay(node);
            // Update node statistics
            const latency = Date.now() - startTime;
            this.updateNodeLatency(targetAgent, latency);
            // Store sent message for tracking
            this.sentMessages.set(message.messageId, message);
            this.logger.trace("Message sent", {
                messageId: message.messageId,
                targetAgent,
                latency,
            });
        }
        catch (error) {
            this.stats.failedTransmissions++;
            this.updateNodeFailure(targetAgent);
            this.logger.warn("Failed to send message", {
                messageId: message.messageId,
                targetAgent,
                error: error.message,
            });
            throw error;
        }
    }
    async sendDirectMessage(targetAgent, message) {
        await this.sendMessage(targetAgent, message);
    }
    async continueGossip(message) {
        // Decrease TTL and add to path
        const continuedMessage = {
            ...message,
            ttl: message.ttl - 1,
            path: [...message.path, this.localNode.agentId],
        };
        // Add to pending messages for next gossip round
        this.pendingMessages.push(continuedMessage);
    }
    async handleUpdateMessage(message) {
        // Emit event for the memory manager to handle
        this.emit("update_received", message.payload);
        this.logger.debug("Update message processed", {
            messageId: message.messageId,
            sourceAgent: message.sourceAgent,
        });
    }
    async handleSyncRequest(message) {
        // Prepare sync response with requested data
        const responsePayload = await this.prepareSyncResponse(message.payload);
        const response = {
            messageId: this.generateMessageId(),
            type: "sync_response",
            sourceAgent: this.localNode.agentId,
            targetAgent: message.sourceAgent,
            vectorClock: new VectorClock(this.localNode.agentId),
            payload: responsePayload,
            ttl: 1,
            timestamp: new Date(),
            path: [this.localNode.agentId],
            priority: "medium",
        };
        await this.sendDirectMessage(message.sourceAgent, response);
        this.stats.syncResponsesSent++;
        this.logger.debug("Sync response sent", {
            targetAgent: message.sourceAgent,
            dataSize: JSON.stringify(responsePayload).length,
        });
    }
    async handleSyncResponse(message) {
        // Apply sync data
        this.emit("sync_data_received", {
            sourceAgent: message.sourceAgent,
            data: message.payload,
        });
        this.logger.debug("Sync response processed", {
            sourceAgent: message.sourceAgent,
        });
    }
    async handleHeartbeat(message) {
        // Update node liveness
        this.updateNodeInfo(message.sourceAgent, {
            lastSeen: new Date(),
            isActive: true,
            failureCount: 0,
        });
        this.logger.trace("Heartbeat processed", {
            sourceAgent: message.sourceAgent,
        });
    }
    async handleRumor(message) {
        // Process rumor (could be node discovery, failure notification, etc.)
        this.emit("rumor_received", {
            sourceAgent: message.sourceAgent,
            rumor: message.payload,
        });
        this.logger.debug("Rumor processed", {
            sourceAgent: message.sourceAgent,
            rumorType: message.payload.type,
        });
    }
    async sendHeartbeats() {
        const heartbeat = {
            messageId: this.generateMessageId(),
            type: "heartbeat",
            sourceAgent: this.localNode.agentId,
            vectorClock: new VectorClock(this.localNode.agentId),
            payload: {
                nodeInfo: this.localNode,
                timestamp: Date.now(),
            },
            ttl: 2, // Limited propagation
            timestamp: new Date(),
            path: [this.localNode.agentId],
            priority: "low",
        };
        await this.gossipMessage(heartbeat);
    }
    checkNodeFailures() {
        const now = new Date();
        const failureTimeout = this.config.gossipInterval * 3; // 3 missed heartbeats
        for (const [agentId, node] of this.nodes) {
            if (node.isActive &&
                now.getTime() - node.lastSeen.getTime() > failureTimeout) {
                node.failureCount++;
                if (node.failureCount >= this.config.failureThreshold) {
                    node.isActive = false;
                    node.reliability = Math.max(0, node.reliability - 0.1);
                    this.logger.warn("Node marked as failed", {
                        agentId,
                        failureCount: node.failureCount,
                        lastSeen: node.lastSeen,
                    });
                    this.emit("node_failed", { agentId, node });
                }
            }
        }
    }
    selectNodesForSync(nodes) {
        // Select nodes for anti-entropy sync based on reliability and staleness
        const candidates = nodes.sort((a, b) => {
            const stalnessA = Date.now() - a.lastSeen.getTime();
            const stalnessB = Date.now() - b.lastSeen.getTime();
            return stalnessB - stalnessA; // Prefer staler nodes
        });
        const syncCount = Math.min(3, candidates.length); // Sync with up to 3 nodes
        return candidates.slice(0, syncCount);
    }
    shouldCompressMessage(message) {
        const messageSize = JSON.stringify(message).length;
        return messageSize > this.config.compressionThreshold;
    }
    async compressMessage(message) {
        // Simulate compression (in real implementation, use actual compression)
        const compressedPayload = {
            ...message.payload,
            compressed: true,
            originalSize: JSON.stringify(message.payload).length,
        };
        const compressionRatio = 0.7; // Simulate 30% compression
        this.updateCompressionStats(compressionRatio);
        return {
            ...message,
            payload: compressedPayload,
        };
    }
    async simulateNetworkDelay(node) {
        // Simulate network delay based on node round-trip time
        const delay = Math.max(10, node.roundTripTime + Math.random() * 50);
        await new Promise((resolve) => setTimeout(resolve, delay));
    }
    updateNodeInfo(agentId, updates) {
        const node = this.nodes.get(agentId);
        if (node) {
            Object.assign(node, updates);
        }
    }
    updateNodeLatency(agentId, latency) {
        const node = this.nodes.get(agentId);
        if (node) {
            // Exponential moving average
            node.roundTripTime = node.roundTripTime * 0.8 + latency * 0.2;
            node.reliability = Math.min(1.0, node.reliability + 0.01); // Increase reliability on success
        }
    }
    updateNodeFailure(agentId) {
        const node = this.nodes.get(agentId);
        if (node) {
            node.failureCount++;
            node.reliability = Math.max(0, node.reliability - 0.05);
        }
    }
    updateCompressionStats(ratio) {
        this.stats.compressionRatio = (this.stats.compressionRatio + ratio) / 2;
    }
    updateNetworkUtilization() {
        // Calculate network utilization based on message throughput
        const totalMessages = this.stats.messagesSent + this.stats.messagesReceived;
        const timeWindow = 60; // 1 minute window
        this.stats.networkUtilization = totalMessages / timeWindow;
    }
    determinePriority(update) {
        // Determine message priority based on update type
        if (update.type === "emergency" || update.critical) {
            return "critical";
        }
        else if (update.type === "security" || update.important) {
            return "high";
        }
        else if (update.type === "heartbeat" || update.routine) {
            return "low";
        }
        return "medium";
    }
    generateMessageId() {
        return `msg_${this.localNode.agentId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    getLastSyncVector(agentId) {
        // In real implementation, this would track per-agent sync vectors
        return new VectorClock(this.localNode.agentId);
    }
    async prepareSyncResponse(request) {
        // Prepare sync response data based on request
        return {
            type: "sync_data",
            timestamp: new Date(),
            data: {}, // Would contain actual sync data
        };
    }
    cleanupOldMessages() {
        const cutoffTime = new Date(Date.now() - 300000); // 5 minutes
        let cleaned = 0;
        for (const [messageId, timestamp] of this.messageHistory) {
            if (timestamp < cutoffTime) {
                this.messageHistory.delete(messageId);
                cleaned++;
            }
        }
        // Clean up sent messages
        for (const [messageId, message] of this.sentMessages) {
            if (message.timestamp < cutoffTime) {
                this.sentMessages.delete(messageId);
            }
        }
        if (cleaned > 0) {
            this.logger.debug("Cleaned up old messages", { cleaned });
        }
    }
    sendFarewellMessages() {
        // Send goodbye messages to known nodes
        const farewell = {
            messageId: this.generateMessageId(),
            type: "rumor",
            sourceAgent: this.localNode.agentId,
            vectorClock: new VectorClock(this.localNode.agentId),
            payload: {
                type: "node_leaving",
                agentId: this.localNode.agentId,
                timestamp: Date.now(),
            },
            ttl: 3,
            timestamp: new Date(),
            path: [this.localNode.agentId],
            priority: "medium",
        };
        // Send farewell (best effort, no waiting)
        this.gossipMessage(farewell).catch((error) => {
            this.logger.warn("Failed to send farewell messages", {
                error: error.message,
            });
        });
    }
}
//# sourceMappingURL=gossip-protocol.js.map