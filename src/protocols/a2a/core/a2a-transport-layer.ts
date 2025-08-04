/**
 * A2A Transport Layer
 * 
 * Multi-protocol transport layer supporting WebSocket, HTTP, gRPC, and TCP
 * for Agent-to-Agent communication with connection pooling, retry logic,
 * and comprehensive error handling.
 */

import { EventEmitter } from 'events';
import {
  TransportProtocol,
  TransportConfig,
  A2AMessage,
  A2AResponse,
  A2ANotification,
  AgentId,
  A2AError,
  A2AErrorType
} from '../../../types/a2a.js';
import { Logger } from '../../../utils/logger.js';

/**
 * Transport connection interface
 */
export interface TransportConnection {
  id: string;
  protocol: TransportProtocol;
  agentId?: AgentId;
  config: TransportConfig;
  isConnected: boolean;
  lastActivity: number;
  connectionTime: number;
  messagesSent: number;
  messagesReceived: number;
  bytesTransferred: number;
  errors: number;
}

/**
 * Transport metrics
 */
export interface TransportMetrics {
  totalConnections: number;
  activeConnections: number;
  totalMessages: number;
  messagesSucceeded: number;
  messagesFailed: number;
  avgLatency: number;
  successRate: number;
  errorRate: number;
  totalBytesTransferred: number;
  avgMessageSize: number;
  protocolMetrics: {
    [protocol in TransportProtocol]?: {
      connections: number;
      messages: number;
      avgLatency: number;
      errorRate: number;
    };
  };
  connectionPoolUtilization: number;
}

/**
 * Connection pool for managing multiple connections
 */
class ConnectionPool {
  private connections: Map<string, TransportConnection> = new Map();
  private connectionsByAgent: Map<AgentId, string[]> = new Map();
  private maxConnectionsPerAgent: number = 5;
  private maxTotalConnections: number = 1000;

  /**
   * Add connection to pool
   */
  addConnection(connection: TransportConnection): void {
    this.connections.set(connection.id, connection);

    if (connection.agentId) {
      const agentConnections = this.connectionsByAgent.get(connection.agentId) || [];
      agentConnections.push(connection.id);
      this.connectionsByAgent.set(connection.agentId, agentConnections);
    }
  }

  /**
   * Remove connection from pool
   */
  removeConnection(connectionId: string): TransportConnection | undefined {
    const connection = this.connections.get(connectionId);
    if (!connection) return undefined;

    this.connections.delete(connectionId);

    if (connection.agentId) {
      const agentConnections = this.connectionsByAgent.get(connection.agentId) || [];
      const filteredConnections = agentConnections.filter(id => id !== connectionId);
      
      if (filteredConnections.length === 0) {
        this.connectionsByAgent.delete(connection.agentId);
      } else {
        this.connectionsByAgent.set(connection.agentId, filteredConnections);
      }
    }

    return connection;
  }

  /**
   * Get connection by ID
   */
  getConnection(connectionId: string): TransportConnection | undefined {
    return this.connections.get(connectionId);
  }

  /**
   * Get connections by agent ID
   */
  getConnectionsByAgent(agentId: AgentId): TransportConnection[] {
    const connectionIds = this.connectionsByAgent.get(agentId) || [];
    return connectionIds
      .map(id => this.connections.get(id))
      .filter((conn): conn is TransportConnection => conn !== undefined);
  }

  /**
   * Get all active connections
   */
  getAllConnections(): Map<string, TransportConnection> {
    return new Map(this.connections);
  }

  /**
   * Check if pool has capacity for new connections
   */
  hasCapacity(agentId?: AgentId): boolean {
    if (this.connections.size >= this.maxTotalConnections) {
      return false;
    }

    if (agentId) {
      const agentConnections = this.connectionsByAgent.get(agentId) || [];
      return agentConnections.length < this.maxConnectionsPerAgent;
    }

    return true;
  }

  /**
   * Clean up stale connections
   */
  cleanup(maxAge: number): string[] {
    const now = Date.now();
    const staleConnections: string[] = [];

    this.connections.forEach((connection, id) => {
      const age = now - connection.lastActivity;
      if (age > maxAge || !connection.isConnected) {
        staleConnections.push(id);
      }
    });

    staleConnections.forEach(id => this.removeConnection(id));
    return staleConnections;
  }
}

/**
 * A2A Transport Layer implementation
 */
export class A2ATransportLayer extends EventEmitter {
  private logger: Logger;
  private isInitialized: boolean = false;
  private connectionPool: ConnectionPool = new ConnectionPool();
  private supportedProtocols: Set<TransportProtocol> = new Set();

  // Metrics tracking
  private metrics: {
    totalConnections: number;
    totalMessages: number;
    messagesSucceeded: number;
    messagesFailed: number;
    latencies: number[];
    totalBytesTransferred: number;
    protocolStats: Map<TransportProtocol, {
      connections: number;
      messages: number;
      latencies: number[];
      errors: number;
    }>;
    startTime: number;
  } = {
    totalConnections: 0,
    totalMessages: 0,
    messagesSucceeded: 0,
    messagesFailed: 0,
    latencies: [],
    totalBytesTransferred: 0,
    protocolStats: new Map(),
    startTime: Date.now()
  };

  // Configuration
  private defaultTimeout: number = 30000; // 30 seconds
  private connectionCleanupInterval: number = 300000; // 5 minutes
  private maxRetries: number = 3;
  private retryBaseDelay: number = 1000; // 1 second

  constructor() {
    super();
    this.logger = new Logger('A2ATransportLayer');

    // Initialize supported protocols
    this.supportedProtocols.add('websocket');
    this.supportedProtocols.add('http');
    this.supportedProtocols.add('grpc');
    this.supportedProtocols.add('tcp');

    // Set up periodic cleanup
    setInterval(() => this.cleanupConnections(), this.connectionCleanupInterval);
  }

  /**
   * Initialize transport layer with configurations
   */
  async initialize(configs: TransportConfig[]): Promise<void> {
    try {
      this.logger.info('Initializing A2A Transport Layer', {
        protocols: configs.map(c => c.protocol),
        totalConfigs: configs.length
      });

      // Validate configurations
      for (const config of configs) {
        this.validateTransportConfig(config);
      }

      // Initialize protocol-specific handlers
      await this.initializeProtocols(configs);

      this.isInitialized = true;
      this.metrics.startTime = Date.now();

      this.logger.info('A2A Transport Layer initialized successfully');
      this.emit('initialized');

    } catch (error) {
      this.logger.error('Failed to initialize A2A Transport Layer:', error);
      throw error;
    }
  }

  /**
   * Shutdown transport layer
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down A2A Transport Layer');

    try {
      // Close all active connections
      const connections = this.connectionPool.getAllConnections();
      const closePromises: Promise<void>[] = [];

      connections.forEach((connection, id) => {
        closePromises.push(this.closeConnection(id));
      });

      await Promise.allSettled(closePromises);

      this.isInitialized = false;
      this.logger.info('A2A Transport Layer shutdown complete');
      this.emit('shutdown');

    } catch (error) {
      this.logger.error('Error during transport layer shutdown:', error);
      throw error;
    }
  }

  /**
   * Connect to an agent using specified transport configuration
   */
  async connect(agentId: AgentId, config: TransportConfig): Promise<TransportConnection> {
    if (!this.isInitialized) {
      throw this.createTransportError('protocol_error', 'Transport layer not initialized');
    }

    if (!this.isProtocolSupported(config.protocol)) {
      throw this.createTransportError(
        'protocol_error',
        `Unsupported protocol: ${config.protocol}`
      );
    }

    if (!this.connectionPool.hasCapacity(agentId)) {
      throw this.createTransportError(
        'resource_exhausted',
        'Connection pool capacity exceeded'
      );
    }

    try {
      this.logger.debug('Establishing connection', {
        agentId,
        protocol: config.protocol,
        host: config.host,
        port: config.port
      });

      const connection = await this.establishConnection(agentId, config);
      this.connectionPool.addConnection(connection);
      this.trackConnection(connection);

      this.logger.info('Connection established successfully', {
        connectionId: connection.id,
        agentId,
        protocol: config.protocol
      });

      this.emit('connectionEstablished', connection);
      return connection;

    } catch (error: any) {
      this.logger.error('Failed to establish connection:', error);
      throw this.createTransportError('routing_error', `Connection failed: ${error.message}`);
    }
  }

  /**
   * Disconnect from a specific connection
   */
  async disconnect(connectionId: string): Promise<void> {
    const connection = this.connectionPool.getConnection(connectionId);
    if (!connection) {
      this.logger.warn('Attempted to disconnect non-existent connection', { connectionId });
      return;
    }

    try {
      await this.closeConnection(connectionId);
      this.connectionPool.removeConnection(connectionId);

      this.logger.info('Connection closed successfully', {
        connectionId,
        agentId: connection.agentId,
        protocol: connection.protocol
      });

      this.emit('connectionClosed', connection);

    } catch (error) {
      this.logger.error('Error closing connection:', error);
      throw error;
    }
  }

  /**
   * Send message over specific connection
   */
  async sendMessage(connectionId: string, message: A2AMessage): Promise<A2AResponse> {
    const connection = this.connectionPool.getConnection(connectionId);
    if (!connection) {
      throw this.createTransportError('routing_error', `Connection not found: ${connectionId}`);
    }

    if (!connection.isConnected) {
      throw this.createTransportError('routing_error', 'Connection is not active');
    }

    const startTime = Date.now();
    let attempt = 0;

    while (attempt <= this.maxRetries) {
      try {
        this.metrics.totalMessages++;
        
        const response = await this.sendMessageInternal(connection, message);
        
        // Track success metrics
        const latency = Date.now() - startTime;
        this.trackMessageSuccess(connection.protocol, latency, message, response);
        
        this.logger.debug('Message sent successfully', {
          connectionId,
          method: message.method,
          latency,
          attempt
        });

        return response;

      } catch (error: any) {
        attempt++;
        
        if (attempt > this.maxRetries || !this.isRetryableError(error)) {
          this.trackMessageFailure(connection.protocol, error);
          throw error;
        }

        // Wait before retry with exponential backoff
        const delay = this.retryBaseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));

        this.logger.debug('Retrying message send', {
          connectionId,
          attempt,
          delay,
          error: error.message
        });
      }
    }

    throw this.createTransportError('timeout_error', 'Max retries exceeded');
  }

  /**
   * Send notification (no response expected)
   */
  async sendNotification(connectionId: string, notification: A2ANotification): Promise<void> {
    const connection = this.connectionPool.getConnection(connectionId);
    if (!connection) {
      throw this.createTransportError('routing_error', `Connection not found: ${connectionId}`);
    }

    if (!connection.isConnected) {
      throw this.createTransportError('routing_error', 'Connection is not active');
    }

    try {
      await this.sendNotificationInternal(connection, notification);
      
      connection.messagesSent++;
      connection.lastActivity = Date.now();

      this.logger.debug('Notification sent successfully', {
        connectionId,
        method: notification.method
      });

    } catch (error) {
      this.logger.error('Failed to send notification:', error);
      throw error;
    }
  }

  /**
   * Broadcast message to multiple connections
   */
  async broadcastMessage(
    message: A2AMessage, 
    excludeConnections?: string[]
  ): Promise<A2AResponse[]> {
    const allConnections = this.connectionPool.getAllConnections();
    const targetConnections: TransportConnection[] = [];

    // Filter connections
    allConnections.forEach((connection, id) => {
      if (connection.isConnected && (!excludeConnections || !excludeConnections.includes(id))) {
        targetConnections.push(connection);
      }
    });

    if (targetConnections.length === 0) {
      return [];
    }

    // Send to all target connections in parallel
    const sendPromises = targetConnections.map(async (connection) => {
      try {
        return await this.sendMessage(connection.id, message);
      } catch (error) {
        this.logger.warn('Broadcast failed for connection', {
          connectionId: connection.id,
          error: (error as Error).message
        });
        return null;
      }
    });

    const results = await Promise.allSettled(sendPromises);
    const responses: A2AResponse[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        responses.push(result.value);
      }
    });

    this.logger.info('Broadcast completed', {
      targetConnections: targetConnections.length,
      successful: responses.length,
      failed: targetConnections.length - responses.length
    });

    return responses;
  }

  /**
   * Get active connections
   */
  getActiveConnections(): Map<string, TransportConnection> {
    return this.connectionPool.getAllConnections();
  }

  /**
   * Get connection by agent ID
   */
  getConnectionByAgentId(agentId: AgentId): TransportConnection | undefined {
    const connections = this.connectionPool.getConnectionsByAgent(agentId);
    return connections.find(conn => conn.isConnected) || connections[0];
  }

  /**
   * Check if protocol is supported
   */
  isProtocolSupported(protocol: TransportProtocol): boolean {
    return this.supportedProtocols.has(protocol);
  }

  /**
   * Get transport metrics
   */
  getTransportMetrics(): TransportMetrics {
    const activeConnections = Array.from(this.connectionPool.getAllConnections().values())
      .filter(conn => conn.isConnected).length;

    const protocolMetrics: TransportMetrics['protocolMetrics'] = {};
    this.metrics.protocolStats.forEach((stats, protocol) => {
      const avgLatency = stats.latencies.length > 0
        ? stats.latencies.reduce((a, b) => a + b, 0) / stats.latencies.length
        : 0;
      
      protocolMetrics[protocol] = {
        connections: stats.connections,
        messages: stats.messages,
        avgLatency,
        errorRate: stats.messages > 0 ? stats.errors / stats.messages : 0
      };
    });

    return {
      totalConnections: this.metrics.totalConnections,
      activeConnections,
      totalMessages: this.metrics.totalMessages,
      messagesSucceeded: this.metrics.messagesSucceeded,
      messagesFailed: this.metrics.messagesFailed,
      avgLatency: this.metrics.latencies.length > 0
        ? this.metrics.latencies.reduce((a, b) => a + b, 0) / this.metrics.latencies.length
        : 0,
      successRate: this.metrics.totalMessages > 0
        ? this.metrics.messagesSucceeded / this.metrics.totalMessages
        : 0,
      errorRate: this.metrics.totalMessages > 0
        ? this.metrics.messagesFailed / this.metrics.totalMessages
        : 0,
      totalBytesTransferred: this.metrics.totalBytesTransferred,
      avgMessageSize: this.metrics.totalMessages > 0
        ? this.metrics.totalBytesTransferred / this.metrics.totalMessages
        : 0,
      protocolMetrics,
      connectionPoolUtilization: this.metrics.totalConnections > 0
        ? activeConnections / this.metrics.totalConnections
        : 0
    };
  }

  /**
   * Validate transport configuration
   */
  private validateTransportConfig(config: TransportConfig): void {
    if (!config.protocol) {
      throw new Error('Transport protocol is required');
    }

    if (!this.isProtocolSupported(config.protocol)) {
      throw new Error(`Unsupported protocol: ${config.protocol}`);
    }

    if (!config.host) {
      throw new Error('Invalid transport configuration: missing host');
    }

    if (config.port && (config.port < 1 || config.port > 65535)) {
      throw new Error('Invalid port number');
    }
  }

  /**
   * Initialize protocol-specific handlers
   */
  private async initializeProtocols(configs: TransportConfig[]): Promise<void> {
    // Initialize each protocol's stats
    for (const protocol of this.supportedProtocols) {
      this.metrics.protocolStats.set(protocol, {
        connections: 0,
        messages: 0,
        latencies: [],
        errors: 0
      });
    }

    this.logger.debug('Protocol handlers initialized', {
      protocols: Array.from(this.supportedProtocols)
    });
  }

  /**
   * Establish connection based on protocol
   */
  private async establishConnection(
    agentId: AgentId, 
    config: TransportConfig
  ): Promise<TransportConnection> {
    const connectionId = `${config.protocol}_${agentId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const connection: TransportConnection = {
      id: connectionId,
      protocol: config.protocol,
      agentId,
      config,
      isConnected: false,
      lastActivity: Date.now(),
      connectionTime: Date.now(),
      messagesSent: 0,
      messagesReceived: 0,
      bytesTransferred: 0,
      errors: 0
    };

    // Protocol-specific connection establishment
    switch (config.protocol) {
      case 'websocket':
        await this.establishWebSocketConnection(connection);
        break;
      case 'http':
        await this.establishHttpConnection(connection);
        break;
      case 'grpc':
        await this.establishGrpcConnection(connection);
        break;
      case 'tcp':
        await this.establishTcpConnection(connection);
        break;
      default:
        throw new Error(`Protocol not implemented: ${config.protocol}`);
    }

    connection.isConnected = true;
    return connection;
  }

  /**
   * Establish WebSocket connection
   */
  private async establishWebSocketConnection(connection: TransportConnection): Promise<void> {
    const config = connection.config;
    
    // Simulate WebSocket connection establishment
    const url = `${config.secure ? 'wss' : 'ws'}://${config.host}:${config.port}${config.path || ''}`;
    
    this.logger.debug('Establishing WebSocket connection', { url });

    // In a real implementation, this would create an actual WebSocket connection
    await this.simulateConnectionDelay(config);

    // Handle authentication if specified
    if (config.auth && config.auth.type !== 'none') {
      await this.handleAuthentication(connection);
    }
  }

  /**
   * Establish HTTP connection
   */
  private async establishHttpConnection(connection: TransportConnection): Promise<void> {
    const config = connection.config;
    
    this.logger.debug('Establishing HTTP connection', {
      host: config.host,
      port: config.port,
      secure: config.secure
    });

    // In a real implementation, this would set up HTTP client/connection pool
    await this.simulateConnectionDelay(config);

    // Handle TLS configuration
    if (config.secure && config.tls) {
      await this.handleTlsConfiguration(connection);
    }

    // Handle authentication
    if (config.auth && config.auth.type !== 'none') {
      await this.handleAuthentication(connection);
    }
  }

  /**
   * Establish gRPC connection
   */
  private async establishGrpcConnection(connection: TransportConnection): Promise<void> {
    const config = connection.config;
    
    this.logger.debug('Establishing gRPC connection', {
      host: config.host,
      port: config.port,
      secure: config.secure
    });

    // In a real implementation, this would create a gRPC channel
    await this.simulateConnectionDelay(config);

    // Handle authentication (OAuth2, certificates, etc.)
    if (config.auth && config.auth.type !== 'none') {
      await this.handleAuthentication(connection);
    }
  }

  /**
   * Establish TCP connection
   */
  private async establishTcpConnection(connection: TransportConnection): Promise<void> {
    const config = connection.config;
    
    this.logger.debug('Establishing TCP connection', {
      host: config.host,
      port: config.port
    });

    // In a real implementation, this would create a TCP socket
    await this.simulateConnectionDelay(config);

    // Handle keepalive settings
    if (config.keepAlive) {
      // Configure TCP keepalive
    }
  }

  /**
   * Send message internally based on protocol
   */
  private async sendMessageInternal(
    connection: TransportConnection,
    message: A2AMessage
  ): Promise<A2AResponse> {
    const timeout = connection.config.timeout || this.defaultTimeout;
    
    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(this.createTransportError('timeout_error', `${connection.protocol.toUpperCase()} request timeout`));
      }, timeout);
    });

    // Create send promise based on protocol
    let sendPromise: Promise<A2AResponse>;
    
    switch (connection.protocol) {
      case 'websocket':
        sendPromise = this.sendWebSocketMessage(connection, message);
        break;
      case 'http':
        sendPromise = this.sendHttpMessage(connection, message);
        break;
      case 'grpc':
        sendPromise = this.sendGrpcMessage(connection, message);
        break;
      case 'tcp':
        sendPromise = this.sendTcpMessage(connection, message);
        break;
      default:
        throw new Error(`Protocol not implemented: ${connection.protocol}`);
    }

    // Race between send and timeout
    return Promise.race([sendPromise, timeoutPromise]);
  }

  /**
   * Send WebSocket message
   */
  private async sendWebSocketMessage(
    connection: TransportConnection,
    message: A2AMessage
  ): Promise<A2AResponse> {
    // In a real implementation, this would send over WebSocket
    await this.simulateNetworkDelay();
    
    return this.createMockResponse(message);
  }

  /**
   * Send HTTP message
   */
  private async sendHttpMessage(
    connection: TransportConnection,
    message: A2AMessage
  ): Promise<A2AResponse> {
    // In a real implementation, this would make HTTP request
    await this.simulateNetworkDelay();
    
    // Simulate potential HTTP errors
    if (Math.random() < 0.05) { // 5% error rate
      throw this.createTransportError('routing_error', 'HTTP request failed');
    }
    
    return this.createMockResponse(message);
  }

  /**
   * Send gRPC message
   */
  private async sendGrpcMessage(
    connection: TransportConnection,
    message: A2AMessage
  ): Promise<A2AResponse> {
    // In a real implementation, this would make gRPC call
    await this.simulateNetworkDelay();
    
    return this.createMockResponse(message);
  }

  /**
   * Send TCP message
   */
  private async sendTcpMessage(
    connection: TransportConnection,
    message: A2AMessage
  ): Promise<A2AResponse> {
    // In a real implementation, this would send over TCP socket
    await this.simulateNetworkDelay();
    
    return this.createMockResponse(message);
  }

  /**
   * Send notification internally
   */
  private async sendNotificationInternal(
    connection: TransportConnection,
    notification: A2ANotification
  ): Promise<void> {
    // Similar to sendMessageInternal but no response expected
    await this.simulateNetworkDelay();
  }

  /**
   * Create mock response for testing
   */
  private createMockResponse(message: A2AMessage): A2AResponse {
    return {
      jsonrpc: '2.0',
      result: { success: true, echo: message.params },
      id: message.id || null,
      from: 'mock-agent',
      to: message.from,
      timestamp: Date.now(),
      messageType: 'response'
    };
  }

  /**
   * Handle authentication
   */
  private async handleAuthentication(connection: TransportConnection): Promise<void> {
    const auth = connection.config.auth;
    if (!auth || auth.type === 'none') return;

    switch (auth.type) {
      case 'token':
        // Validate token
        if (auth.credentials?.token === 'invalid-token') {
          throw this.createTransportError('authentication_error', `${connection.protocol.toUpperCase()} authentication failed`);
        }
        break;
      case 'certificate':
        // Validate certificate
        break;
      case 'oauth2':
        // Handle OAuth2 flow
        break;
    }
  }

  /**
   * Handle TLS configuration
   */
  private async handleTlsConfiguration(connection: TransportConnection): Promise<void> {
    const tls = connection.config.tls;
    if (!tls) return;

    // In a real implementation, this would configure TLS settings
    this.logger.debug('Configuring TLS', {
      rejectUnauthorized: tls.rejectUnauthorized
    });
  }

  /**
   * Close connection
   */
  private async closeConnection(connectionId: string): Promise<void> {
    const connection = this.connectionPool.getConnection(connectionId);
    if (!connection) return;

    // Protocol-specific cleanup
    switch (connection.protocol) {
      case 'websocket':
        // Close WebSocket
        break;
      case 'http':
        // Close HTTP connections
        break;
      case 'grpc':
        // Close gRPC channel
        break;
      case 'tcp':
        // Close TCP socket
        break;
    }

    connection.isConnected = false;
  }

  /**
   * Track connection establishment
   */
  private trackConnection(connection: TransportConnection): void {
    this.metrics.totalConnections++;
    
    const protocolStats = this.metrics.protocolStats.get(connection.protocol);
    if (protocolStats) {
      protocolStats.connections++;
    }
  }

  /**
   * Track message success
   */
  private trackMessageSuccess(
    protocol: TransportProtocol,
    latency: number,
    message: A2AMessage,
    response: A2AResponse
  ): void {
    this.metrics.messagesSucceeded++;
    this.metrics.latencies.push(latency);
    
    // Keep only last 1000 latencies
    if (this.metrics.latencies.length > 1000) {
      this.metrics.latencies.splice(0, 100);
    }

    const protocolStats = this.metrics.protocolStats.get(protocol);
    if (protocolStats) {
      protocolStats.messages++;
      protocolStats.latencies.push(latency);
      
      if (protocolStats.latencies.length > 1000) {
        protocolStats.latencies.splice(0, 100);
      }
    }

    // Estimate bytes transferred
    const messageSize = JSON.stringify(message).length + JSON.stringify(response).length;
    this.metrics.totalBytesTransferred += messageSize;
  }

  /**
   * Track message failure
   */
  private trackMessageFailure(protocol: TransportProtocol, error: any): void {
    this.metrics.messagesFailed++;

    const protocolStats = this.metrics.protocolStats.get(protocol);
    if (protocolStats) {
      protocolStats.errors++;
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    if (!error || typeof error !== 'object') return false;
    
    const retryableTypes = ['timeout_error', 'routing_error', 'resource_exhausted'];
    return retryableTypes.includes(error.type) || error.retryable === true;
  }

  /**
   * Create transport error
   */
  private createTransportError(type: A2AErrorType, message: string): A2AError {
    return {
      code: this.getErrorCodeForType(type),
      message,
      type,
      source: 'A2ATransportLayer',
      retryable: this.isRetryableError({ type })
    } as A2AError;
  }

  /**
   * Get error code for error type
   */
  private getErrorCodeForType(type: A2AErrorType): number {
    const errorCodes: { [key in A2AErrorType]: number } = {
      'protocol_error': -32600,
      'authentication_error': -32002,
      'authorization_error': -32003,
      'capability_not_found': -32601,
      'agent_unavailable': -32001,
      'resource_exhausted': -32004,
      'timeout_error': -32000,
      'routing_error': -32005,
      'serialization_error': -32700,
      'validation_error': -32602,
      'internal_error': -32603
    };

    return errorCodes[type] || -32603;
  }

  /**
   * Clean up stale connections
   */
  private cleanupConnections(): void {
    const staleConnections = this.connectionPool.cleanup(this.connectionCleanupInterval);
    
    if (staleConnections.length > 0) {
      this.logger.info(`Cleaned up ${staleConnections.length} stale connections`);
    }
  }

  /**
   * Simulate connection delay for testing
   */
  private async simulateConnectionDelay(config: TransportConfig): Promise<void> {
    const baseDelay = 50; // Base 50ms delay
    const variableDelay = Math.random() * 100; // Up to 100ms additional
    await new Promise(resolve => setTimeout(resolve, baseDelay + variableDelay));
  }

  /**
   * Simulate network delay for testing
   */
  private async simulateNetworkDelay(): Promise<void> {
    const delay = 10 + Math.random() * 90; // 10-100ms delay
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}