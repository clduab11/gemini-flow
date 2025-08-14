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

import { EventEmitter } from 'events';
import { Logger } from '../../../utils/logger.js';
import { VectorClock } from './vector-clocks.js';

export interface GossipMessage {
  messageId: string;
  type: 'update' | 'sync_request' | 'sync_response' | 'heartbeat' | 'rumor';
  sourceAgent: string;
  targetAgent?: string;
  vectorClock: VectorClock;
  payload: any;
  ttl: number;
  timestamp: Date;
  path: string[]; // Agents this message has visited
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface GossipNode {
  agentId: string;
  address: string;
  lastSeen: Date;
  isActive: boolean;
  failureCount: number;
  roundTripTime: number;
  reliability: number; // 0-1 score
  capacity: {
    bandwidth: number;
    memory: number;
    cpu: number;
  };
}

export interface GossipConfig {
  fanout: number; // Number of nodes to gossip to per round
  gossipInterval: number; // Milliseconds between gossip rounds
  maxTTL: number; // Maximum time-to-live for messages
  syncInterval: number; // Anti-entropy sync interval
  failureThreshold: number; // Failures before marking node as down
  compressionThreshold: number; // Compress messages larger than this
  batchSize: number; // Maximum messages per batch
  adaptiveGossip: boolean; // Enable adaptive algorithms
  minQuorumThreshold: number; // Configurable quorum threshold (default 0.51)
}

export interface GossipStats {
  messagesSent: number;
  messagesReceived: number;
  duplicatesReceived: number;
  syncRequestsSent: number;
  syncResponsesSent: number;
  failedTransmissions: number;
  averageLatency: number;
  networkUtilization: number;
  compressionRatio: number;
}

/**
 * Main Gossip Protocol Implementation
 */
export class GossipProtocol extends EventEmitter {
  private logger: Logger;
  private localNode: GossipNode;
  private topology: any; // Reference to memory topology
  
  // Configuration
  private config: GossipConfig = {
    fanout: 3,
    gossipInterval: 5000, // 5 seconds
    maxTTL: 10,
    syncInterval: 30000, // 30 seconds
    failureThreshold: 3,
    compressionThreshold: 1024, // 1KB
    batchSize: 10,
    adaptiveGossip: true,
    minQuorumThreshold: 0.51 // Default 51% threshold
  };
  
  // State management
  private nodes: Map<string, GossipNode> = new Map();
  private messageHistory: Map<string, Date> = new Map();
  private pendingMessages: GossipMessage[] = [];
  private sentMessages: Map<string, GossipMessage> = new Map();
  
  // Timers
  private gossipTimer?: ReturnType<typeof setTimeout>;
  private syncTimer?: ReturnType<typeof setTimeout>;
  private cleanupTimer?: ReturnType<typeof setTimeout>;
  
  // Statistics
  private stats: GossipStats = {
    messagesSent: 0,
    messagesReceived: 0,
    duplicatesReceived: 0,
    syncRequestsSent: 0,
    syncResponsesSent: 0,
    failedTransmissions: 0,
    averageLatency: 0,
    networkUtilization: 0,
    compressionRatio: 1.0
  };

  constructor(localAgent: any, topology: any, config: Partial<GossipConfig> = {}) {
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
      capacity: localAgent.capacity
    };
    
    // Merge configuration
    this.config = { ...this.config, ...config };
    
    // Initialize from topology
    this.initializeFromTopology();
    
    // Start gossip protocol
    this.startGossip();
    
    this.logger.info('Gossip protocol initialized', {
      agentId: localAgent.agentId,
      fanout: this.config.fanout,
      nodeCount: this.nodes.size
    });
  }

  /**
   * Propagate an update through the network
   */
  async propagateUpdate(update: any): Promise<void> {
    try {
      const message: GossipMessage = {
        messageId: this.generateMessageId(),
        type: 'update',
        sourceAgent: this.localNode.agentId,
        vectorClock: update.vectorClock || new VectorClock(this.localNode.agentId),
        payload: update,
        ttl: this.config.maxTTL,
        timestamp: new Date(),
        path: [this.localNode.agentId],
        priority: this.determinePriority(update)
      };
      
      await this.gossipMessage(message);
      
      this.logger.debug('Update propagated', {
        messageId: message.messageId,
        type: update.type,
        priority: message.priority
      });
      
    } catch (error) {
      this.logger.error('Failed to propagate update', {
        update,
        error: error.message
      });
    }
  }

  /**
   * Handle incoming gossip message
   */
  async handleMessage(message: GossipMessage): Promise<void> {
    try {
      this.stats.messagesReceived++;
      
      // Check if we've seen this message before
      if (this.messageHistory.has(message.messageId)) {
        this.stats.duplicatesReceived++;
        this.logger.trace('Duplicate message received', {
          messageId: message.messageId,
          sourceAgent: message.sourceAgent
        });
        return;
      }
      
      // Record message
      this.messageHistory.set(message.messageId, new Date());
      
      // Update source node info
      this.updateNodeInfo(message.sourceAgent, {
        lastSeen: new Date(),
        isActive: true,
        failureCount: 0
      });
      
      // Process message based on type
      switch (message.type) {
        case 'update':
          await this.handleUpdateMessage(message);
          break;
        case 'sync_request':
          await this.handleSyncRequest(message);
          break;
        case 'sync_response':
          await this.handleSyncResponse(message);
          break;
        case 'heartbeat':
          await this.handleHeartbeat(message);
          break;
        case 'rumor':
          await this.handleRumor(message);
          break;
      }
      
      // Continue propagation if TTL allows
      if (message.ttl > 1 && !message.path.includes(this.localNode.agentId)) {
        await this.continueGossip(message);
      }
      
    } catch (error) {
      this.logger.error('Failed to handle message', {
        messageId: message.messageId,
        error: error.message
      });
    }
  }

  /**
   * Request synchronization with a specific node
   */
  async requestSync(targetAgent: string): Promise<void> {
    try {
      const message: GossipMessage = {
        messageId: this.generateMessageId(),
        type: 'sync_request',
        sourceAgent: this.localNode.agentId,
        targetAgent,
        vectorClock: new VectorClock(this.localNode.agentId),
        payload: {
          requestedData: 'all',
          lastSyncVector: this.getLastSyncVector(targetAgent)
        },
        ttl: 1, // Direct message
        timestamp: new Date(),
        path: [this.localNode.agentId],
        priority: 'medium'
      };
      
      await this.sendDirectMessage(targetAgent, message);
      this.stats.syncRequestsSent++;
      
      this.logger.debug('Sync requested', { targetAgent });
      
    } catch (error) {
      this.logger.error('Failed to request sync', {
        targetAgent,
        error: error.message
      });
    }
  }

  /**
   * Add a new node to the gossip network
   */
  addNode(agentId: string, address: string, capacity?: any): void {
    const node: GossipNode = {
      agentId,
      address,
      lastSeen: new Date(),
      isActive: true,
      failureCount: 0,
      roundTripTime: 0,
      reliability: 0.5, // Start with medium reliability
      capacity: capacity || { bandwidth: 100, memory: 100, cpu: 100 }
    };
    
    this.nodes.set(agentId, node);
    
    this.logger.info('Node added to gossip network', {
      agentId,
      nodeCount: this.nodes.size
    });
    
    this.emit('node_added', node);
  }

  /**
   * Remove a node from the gossip network
   */
  removeNode(agentId: string): void {
    const node = this.nodes.get(agentId);
    if (node) {
      this.nodes.delete(agentId);
      
      this.logger.info('Node removed from gossip network', {
        agentId,
        nodeCount: this.nodes.size
      });
      
      this.emit('node_removed', { agentId, node });
    }
  }

  /**
   * Get active nodes in the network
   */
  getActiveNodes(): GossipNode[] {
    return Array.from(this.nodes.values()).filter(node => 
      node.isActive && node.agentId !== this.localNode.agentId
    );
  }

  /**
   * Get gossip statistics
   */
  getStats(): GossipStats {
    this.updateNetworkUtilization();
    return { ...this.stats };
  }

  /**
   * Calculate minimum quorum size based on threshold
   */
  getMinQuorum(): number {
    return Math.ceil(this.nodes.size * this.config.minQuorumThreshold);
  }

  /**
   * Check if we have sufficient active nodes for quorum
   */
  hasQuorum(): boolean {
    const activeCount = this.getActiveNodes().length;
    return activeCount >= this.getMinQuorum();
  }

  /**
   * Update quorum threshold
   */
  updateQuorumThreshold(threshold: number): void {
    if (threshold <= 0 || threshold > 1) {
      throw new Error('Quorum threshold must be between 0 and 1');
    }
    this.config.minQuorumThreshold = threshold;
    this.logger.info('Quorum threshold updated', { threshold });
  }

  /**
   * Update gossip configuration
   */
  updateConfig(newConfig: Partial<GossipConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart timers with new intervals
    this.stopGossip();
    this.startGossip();
    
    this.logger.info('Gossip configuration updated', newConfig);
  }

  /**
   * Perform manual anti-entropy synchronization
   */
  async performAntiEntropy(): Promise<void> {
    const activeNodes = this.getActiveNodes();
    
    if (activeNodes.length === 0) {
      this.logger.debug('No active nodes for anti-entropy sync');
      return;
    }
    
    // Select random subset for synchronization
    const syncNodes = this.selectNodesForSync(activeNodes);
    
    for (const node of syncNodes) {
      try {
        await this.requestSync(node.agentId);
      } catch (error) {
        this.logger.warn('Anti-entropy sync failed', {
          targetAgent: node.agentId,
          error: error.message
        });
      }
    }
    
    this.logger.debug('Anti-entropy synchronization completed', {
      syncedNodes: syncNodes.length
    });
  }

  /**
   * Shutdown gossip protocol
   */
  shutdown(): void {
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
    
    this.logger.info('Gossip protocol shut down');
  }

  /**
   * Private methods
   */

  private initializeFromTopology(): void {
    if (this.topology && this.topology.nodes) {
      for (const node of this.topology.nodes) {
        if (node.agentId !== this.localNode.agentId) {
          this.addNode(node.agentId, node.address, node.capacity);
        }
      }
    }
  }

  private startGossip(): void {
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
    
    this.logger.debug('Gossip timers started');
  }

  private stopGossip(): void {
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
    
    this.logger.debug('Gossip timers stopped');
  }

  private async performGossipRound(): Promise<void> {
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
      
    } catch (error) {
      this.logger.error('Gossip round failed', { error: error.message });
    }
  }

  private async gossipMessage(message: GossipMessage): Promise<void> {
    const targets = this.selectGossipTargets(message);
    
    if (targets.length === 0) {
      this.logger.warn('No gossip targets available', {
        messageId: message.messageId
      });
      return;
    }
    
    // Send to selected targets
    const promises = targets.map(target => 
      this.sendMessage(target.agentId, message)
    );
    
    try {
      await Promise.allSettled(promises);
      this.stats.messagesSent += targets.length;
      
    } catch (error) {
      this.logger.error('Failed to gossip message', {
        messageId: message.messageId,
        targets: targets.length,
        error: error.message
      });
    }
  }

  private selectGossipTargets(message: GossipMessage): GossipNode[] {
    const activeNodes = this.getActiveNodes();
    
    if (activeNodes.length === 0) {
      return [];
    }
    
    let fanout = Math.min(this.config.fanout, activeNodes.length);
    
    // Adaptive fanout based on message priority
    if (this.config.adaptiveGossip) {
      switch (message.priority) {
        case 'critical':
          fanout = Math.min(activeNodes.length, fanout * 2);
          break;
        case 'high':
          fanout = Math.min(activeNodes.length, Math.ceil(fanout * 1.5));
          break;
        case 'low':
          fanout = Math.max(1, Math.floor(fanout * 0.5));
          break;
      }
    }
    
    // Select nodes based on reliability and network conditions
    const candidates = activeNodes
      .filter(node => !message.path.includes(node.agentId))
      .sort((a, b) => {
        // Sort by reliability and inverse round-trip time
        const scoreA = a.reliability - (a.roundTripTime / 1000);
        const scoreB = b.reliability - (b.roundTripTime / 1000);
        return scoreB - scoreA;
      });
    
    return candidates.slice(0, fanout);
  }

  private async sendMessage(targetAgent: string, message: GossipMessage): Promise<void> {
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
      
      this.logger.trace('Message sent', {
        messageId: message.messageId,
        targetAgent,
        latency
      });
      
    } catch (error) {
      this.stats.failedTransmissions++;
      this.updateNodeFailure(targetAgent);
      
      this.logger.warn('Failed to send message', {
        messageId: message.messageId,
        targetAgent,
        error: error.message
      });
      
      throw error;
    }
  }

  private async sendDirectMessage(targetAgent: string, message: GossipMessage): Promise<void> {
    await this.sendMessage(targetAgent, message);
  }

  private async continueGossip(message: GossipMessage): Promise<void> {
    // Decrease TTL and add to path
    const continuedMessage: GossipMessage = {
      ...message,
      ttl: message.ttl - 1,
      path: [...message.path, this.localNode.agentId]
    };
    
    // Add to pending messages for next gossip round
    this.pendingMessages.push(continuedMessage);
  }

  private async handleUpdateMessage(message: GossipMessage): Promise<void> {
    // Emit event for the memory manager to handle
    this.emit('update_received', message.payload);
    
    this.logger.debug('Update message processed', {
      messageId: message.messageId,
      sourceAgent: message.sourceAgent
    });
  }

  private async handleSyncRequest(message: GossipMessage): Promise<void> {
    // Prepare sync response with requested data
    const responsePayload = await this.prepareSyncResponse(message.payload);
    
    const response: GossipMessage = {
      messageId: this.generateMessageId(),
      type: 'sync_response',
      sourceAgent: this.localNode.agentId,
      targetAgent: message.sourceAgent,
      vectorClock: new VectorClock(this.localNode.agentId),
      payload: responsePayload,
      ttl: 1,
      timestamp: new Date(),
      path: [this.localNode.agentId],
      priority: 'medium'
    };
    
    await this.sendDirectMessage(message.sourceAgent, response);
    this.stats.syncResponsesSent++;
    
    this.logger.debug('Sync response sent', {
      targetAgent: message.sourceAgent,
      dataSize: JSON.stringify(responsePayload).length
    });
  }

  private async handleSyncResponse(message: GossipMessage): Promise<void> {
    // Apply sync data
    this.emit('sync_data_received', {
      sourceAgent: message.sourceAgent,
      data: message.payload
    });
    
    this.logger.debug('Sync response processed', {
      sourceAgent: message.sourceAgent
    });
  }

  private async handleHeartbeat(message: GossipMessage): Promise<void> {
    // Update node liveness
    this.updateNodeInfo(message.sourceAgent, {
      lastSeen: new Date(),
      isActive: true,
      failureCount: 0
    });
    
    this.logger.trace('Heartbeat processed', {
      sourceAgent: message.sourceAgent
    });
  }

  private async handleRumor(message: GossipMessage): Promise<void> {
    // Process rumor (could be node discovery, failure notification, etc.)
    this.emit('rumor_received', {
      sourceAgent: message.sourceAgent,
      rumor: message.payload
    });
    
    this.logger.debug('Rumor processed', {
      sourceAgent: message.sourceAgent,
      rumorType: message.payload.type
    });
  }

  private async sendHeartbeats(): Promise<void> {
    const heartbeat: GossipMessage = {
      messageId: this.generateMessageId(),
      type: 'heartbeat',
      sourceAgent: this.localNode.agentId,
      vectorClock: new VectorClock(this.localNode.agentId),
      payload: {
        nodeInfo: this.localNode,
        timestamp: Date.now()
      },
      ttl: 2, // Limited propagation
      timestamp: new Date(),
      path: [this.localNode.agentId],
      priority: 'low'
    };
    
    await this.gossipMessage(heartbeat);
  }

  private checkNodeFailures(): void {
    const now = new Date();
    const failureTimeout = this.config.gossipInterval * 3; // 3 missed heartbeats
    
    for (const [agentId, node] of this.nodes) {
      if (node.isActive && now.getTime() - node.lastSeen.getTime() > failureTimeout) {
        node.failureCount++;
        
        if (node.failureCount >= this.config.failureThreshold) {
          node.isActive = false;
          node.reliability = Math.max(0, node.reliability - 0.1);
          
          this.logger.warn('Node marked as failed', {
            agentId,
            failureCount: node.failureCount,
            lastSeen: node.lastSeen
          });
          
          this.emit('node_failed', { agentId, node });
        }
      }
    }
  }

  private selectNodesForSync(nodes: GossipNode[]): GossipNode[] {
    // Select nodes for anti-entropy sync based on reliability and staleness
    const candidates = nodes
      .sort((a, b) => {
        const stalnessA = Date.now() - a.lastSeen.getTime();
        const stalnessB = Date.now() - b.lastSeen.getTime();
        return stalnessB - stalnessA; // Prefer staler nodes
      });
    
    const syncCount = Math.min(3, candidates.length); // Sync with up to 3 nodes
    return candidates.slice(0, syncCount);
  }

  private shouldCompressMessage(message: GossipMessage): boolean {
    const messageSize = JSON.stringify(message).length;
    return messageSize > this.config.compressionThreshold;
  }

  private async compressMessage(message: GossipMessage): Promise<GossipMessage> {
    // Simulate compression (in real implementation, use actual compression)
    const compressedPayload = {
      ...message.payload,
      compressed: true,
      originalSize: JSON.stringify(message.payload).length
    };
    
    const compressionRatio = 0.7; // Simulate 30% compression
    this.updateCompressionStats(compressionRatio);
    
    return {
      ...message,
      payload: compressedPayload
    };
  }

  private async simulateNetworkDelay(node: GossipNode): Promise<void> {
    // Simulate network delay based on node round-trip time
    const delay = Math.max(10, node.roundTripTime + Math.random() * 50);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private updateNodeInfo(agentId: string, updates: Partial<GossipNode>): void {
    const node = this.nodes.get(agentId);
    if (node) {
      Object.assign(node, updates);
    }
  }

  private updateNodeLatency(agentId: string, latency: number): void {
    const node = this.nodes.get(agentId);
    if (node) {
      // Exponential moving average
      node.roundTripTime = node.roundTripTime * 0.8 + latency * 0.2;
      node.reliability = Math.min(1.0, node.reliability + 0.01); // Increase reliability on success
    }
  }

  private updateNodeFailure(agentId: string): void {
    const node = this.nodes.get(agentId);
    if (node) {
      node.failureCount++;
      node.reliability = Math.max(0, node.reliability - 0.05);
    }
  }

  private updateCompressionStats(ratio: number): void {
    this.stats.compressionRatio = (this.stats.compressionRatio + ratio) / 2;
  }

  private updateNetworkUtilization(): void {
    // Calculate network utilization based on message throughput
    const totalMessages = this.stats.messagesSent + this.stats.messagesReceived;
    const timeWindow = 60; // 1 minute window
    this.stats.networkUtilization = totalMessages / timeWindow;
  }

  private determinePriority(update: any): GossipMessage['priority'] {
    // Determine message priority based on update type
    if (update.type === 'emergency' || update.critical) {
      return 'critical';
    } else if (update.type === 'security' || update.important) {
      return 'high';
    } else if (update.type === 'heartbeat' || update.routine) {
      return 'low';
    }
    return 'medium';
  }

  private generateMessageId(): string {
    return `msg_${this.localNode.agentId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getLastSyncVector(agentId: string): VectorClock {
    // In real implementation, this would track per-agent sync vectors
    return new VectorClock(this.localNode.agentId);
  }

  private async prepareSyncResponse(request: any): Promise<any> {
    // Prepare sync response data based on request
    return {
      type: 'sync_data',
      timestamp: new Date(),
      data: {} // Would contain actual sync data
    };
  }

  private cleanupOldMessages(): void {
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
      this.logger.debug('Cleaned up old messages', { cleaned });
    }
  }

  private sendFarewellMessages(): void {
    // Send goodbye messages to known nodes
    const farewell: GossipMessage = {
      messageId: this.generateMessageId(),
      type: 'rumor',
      sourceAgent: this.localNode.agentId,
      vectorClock: new VectorClock(this.localNode.agentId),
      payload: {
        type: 'node_leaving',
        agentId: this.localNode.agentId,
        timestamp: Date.now()
      },
      ttl: 3,
      timestamp: new Date(),
      path: [this.localNode.agentId],
      priority: 'medium'
    };
    
    // Send farewell (best effort, no waiting)
    this.gossipMessage(farewell).catch(error => {
      this.logger.warn('Failed to send farewell messages', { error: error.message });
    });
  }
}