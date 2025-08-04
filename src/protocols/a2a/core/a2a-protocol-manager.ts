/**
 * A2A Protocol Manager
 * 
 * Core component for Agent-to-Agent communication using JSON-RPC 2.0 protocol.
 * Provides comprehensive message handling, routing, security, and error management.
 */

import { EventEmitter } from 'events';
import {
  A2AMessage,
  A2AResponse,
  A2ANotification,
  A2AError,
  A2AErrorType,
  A2AProtocolConfig,
  AgentCard,
  AgentId,
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcError,
  MessagePriority,
  RetryPolicy
} from '../../../types/a2a.js';
import { Logger } from '../../../utils/logger.js';

/**
 * Message handler function type
 */
export type MessageHandler = (message: A2AMessage) => Promise<any>;

/**
 * Protocol manager metrics
 */
export interface ProtocolManagerMetrics {
  messagesProcessed: number;
  messagesSucceeded: number;
  messagesFailed: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  successRate: number;
  errorRate: number;
  throughput: number;
  concurrentConnections: number;
  activeHandlers: number;
  errorsByType: { [key in A2AErrorType]?: number };
}

/**
 * Message queue entry for priority handling
 */
interface QueuedMessage {
  message: A2AMessage;
  priority: MessagePriority;
  timestamp: number;
  resolve: (value: A2AResponse) => void;
  reject: (error: A2AError) => void;
  retryCount: number;
}

/**
 * A2A Protocol Manager - Core JSON-RPC 2.0 implementation
 */
export class A2AProtocolManager extends EventEmitter {
  private config: A2AProtocolConfig;
  private logger: Logger;
  private isInitialized: boolean = false;
  private isShuttingDown: boolean = false;

  // Message handling
  private messageHandlers: Map<string, MessageHandler> = new Map();
  private messageQueue: QueuedMessage[] = [];
  private processingQueue: boolean = false;
  private activeMessages: Map<string, QueuedMessage> = new Map();

  // Performance tracking
  private metrics: {
    messagesProcessed: number;
    messagesSucceeded: number;
    messagesFailed: number;
    responseTimes: number[];
    startTime: number;
    errorsByType: Map<A2AErrorType, number>;
  } = {
    messagesProcessed: 0,
    messagesSucceeded: 0,
    messagesFailed: 0,
    responseTimes: [],
    startTime: Date.now(),
    errorsByType: new Map()
  };

  // Security and validation
  private trustedAgents: Set<AgentId>;
  private messageValidationEnabled: boolean;

  constructor(config: A2AProtocolConfig) {
    super();
    this.config = config;
    this.logger = new Logger('A2AProtocolManager');
    this.trustedAgents = new Set(config.trustedAgents || []);
    this.messageValidationEnabled = config.securityEnabled ?? true;

    // Set up error handling
    this.on('error', (error) => {
      this.logger.error('Protocol manager error:', error);
    });
  }

  /**
   * Initialize the protocol manager
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing A2A Protocol Manager', {
        agentId: this.config.agentId,
        transports: this.config.transports.length,
        securityEnabled: this.config.securityEnabled
      });

      // Validate configuration
      this.validateConfiguration();

      // Initialize transport layers (would be injected in real implementation)
      await this.initializeTransports();

      // Start message processing queue
      this.startMessageProcessing();

      // Register default handlers
      this.registerDefaultHandlers();

      this.isInitialized = true;
      this.metrics.startTime = Date.now();

      this.logger.info('A2A Protocol Manager initialized successfully');
      this.emit('initialized');

    } catch (error) {
      this.logger.error('Failed to initialize A2A Protocol Manager:', error);
      throw error;
    }
  }

  /**
   * Gracefully shutdown the protocol manager
   */
  async shutdown(): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;
    this.logger.info('Shutting down A2A Protocol Manager');

    try {
      // Stop processing new messages
      this.processingQueue = false;

      // Wait for active messages to complete (with timeout)
      await this.waitForActiveMessages(5000);

      // Clear message queue
      this.messageQueue.forEach(queuedMsg => {
        queuedMsg.reject(this.createError(
          'protocol_error',
          'Protocol manager is shutting down',
          -32000
        ));
      });
      this.messageQueue.length = 0;

      // Clear handlers
      this.messageHandlers.clear();

      // Shutdown transports (would be implemented with actual transport layer)
      await this.shutdownTransports();

      this.isInitialized = false;
      this.logger.info('A2A Protocol Manager shutdown complete');
      this.emit('shutdown');

    } catch (error) {
      this.logger.error('Error during shutdown:', error);
      throw error;
    }
  }

  /**
   * Send a message and wait for response
   */
  async sendMessage(message: A2AMessage): Promise<A2AResponse> {
    if (!this.isInitialized) {
      throw this.createError('protocol_error', 'Protocol manager not initialized', -32000);
    }

    if (this.isShuttingDown) {
      throw this.createError('protocol_error', 'Protocol manager is shutting down', -32000);
    }

    try {
      // Validate message format
      this.validateMessage(message);

      // Check security constraints
      if (this.messageValidationEnabled) {
        await this.validateSecurity(message);
      }

      // Add to processing queue
      return await this.queueMessage(message);

    } catch (error) {
      this.trackError('validation_error');
      throw error;
    }
  }

  /**
   * Send a notification (no response expected)
   */
  async sendNotification(notification: A2ANotification): Promise<void> {
    if (!this.isInitialized) {
      throw this.createError('protocol_error', 'Protocol manager not initialized', -32000);
    }

    try {
      // Validate notification format
      this.validateNotification(notification);

      // Check security constraints
      if (this.messageValidationEnabled) {
        await this.validateSecurity(notification);
      }

      // Send notification (implementation would use transport layer)
      await this.processNotification(notification);

      this.logger.debug('Notification sent successfully', {
        method: notification.method,
        to: notification.to
      });

    } catch (error) {
      this.logger.error('Failed to send notification:', error);
      this.trackError('protocol_error');
      throw error;
    }
  }

  /**
   * Register a message handler for a specific method
   */
  async registerMessageHandler(method: string, handler: MessageHandler): Promise<void> {
    if (this.messageHandlers.has(method)) {
      throw new Error(`Handler already registered for method: ${method}`);
    }

    this.messageHandlers.set(method, handler);
    this.logger.debug(`Message handler registered for method: ${method}`);
  }

  /**
   * Unregister a message handler
   */
  async unregisterMessageHandler(method: string): Promise<void> {
    if (!this.messageHandlers.has(method)) {
      throw new Error(`No handler registered for method: ${method}`);
    }

    this.messageHandlers.delete(method);
    this.logger.debug(`Message handler unregistered for method: ${method}`);
  }

  /**
   * Get the agent card for this protocol manager
   */
  getAgentCard(): AgentCard {
    return this.config.agentCard;
  }

  /**
   * Get performance metrics
   */
  getMetrics(): ProtocolManagerMetrics {
    const now = Date.now();
    const uptime = now - this.metrics.startTime;
    const throughput = this.metrics.messagesProcessed / (uptime / 1000);

    // Calculate percentiles
    const sortedTimes = [...this.metrics.responseTimes].sort((a, b) => a - b);
    const p95Index = Math.floor(sortedTimes.length * 0.95);
    const p99Index = Math.floor(sortedTimes.length * 0.99);

    const errorsByType: { [key in A2AErrorType]?: number } = {};
    this.metrics.errorsByType.forEach((count, type) => {
      errorsByType[type] = count;
    });

    return {
      messagesProcessed: this.metrics.messagesProcessed,
      messagesSucceeded: this.metrics.messagesSucceeded,
      messagesFailed: this.metrics.messagesFailed,
      avgResponseTime: this.metrics.responseTimes.length > 0 
        ? this.metrics.responseTimes.reduce((a, b) => a + b, 0) / this.metrics.responseTimes.length 
        : 0,
      p95ResponseTime: sortedTimes[p95Index] || 0,
      p99ResponseTime: sortedTimes[p99Index] || 0,
      successRate: this.metrics.messagesProcessed > 0 
        ? this.metrics.messagesSucceeded / this.metrics.messagesProcessed 
        : 0,
      errorRate: this.metrics.messagesProcessed > 0 
        ? this.metrics.messagesFailed / this.metrics.messagesProcessed 
        : 0,
      throughput,
      concurrentConnections: this.activeMessages.size,
      activeHandlers: this.messageHandlers.size,
      errorsByType
    };
  }

  /**
   * Validate configuration
   */
  private validateConfiguration(): void {
    if (!this.config.agentId || this.config.agentId.trim() === '') {
      throw new Error('Invalid agent ID');
    }

    if (!this.config.agentCard) {
      throw new Error('Agent card is required');
    }

    if (!this.config.transports || this.config.transports.length === 0) {
      throw new Error('At least one transport configuration is required');
    }

    if (!this.config.defaultTransport) {
      throw new Error('Default transport must be specified');
    }

    if (!this.config.transports.find(t => t.protocol === this.config.defaultTransport)) {
      throw new Error('Default transport not found in transport configurations');
    }
  }

  /**
   * Validate JSON-RPC 2.0 message format
   */
  private validateMessage(message: A2AMessage): void {
    if (message.jsonrpc !== '2.0') {
      throw this.createError('protocol_error', 'Invalid Request', -32600);
    }

    if (!message.method || typeof message.method !== 'string') {
      throw this.createError('protocol_error', 'Invalid Request', -32600);
    }

    if (!message.from || !message.to) {
      throw this.createError('protocol_error', 'Missing required routing information', -32600);
    }

    if (!message.timestamp || typeof message.timestamp !== 'number') {
      throw this.createError('protocol_error', 'Invalid timestamp', -32600);
    }

    if (!message.messageType) {
      throw this.createError('protocol_error', 'Missing message type', -32600);
    }
  }

  /**
   * Validate notification format
   */
  private validateNotification(notification: A2ANotification): void {
    if (notification.jsonrpc !== '2.0') {
      throw this.createError('protocol_error', 'Invalid Request', -32600);
    }

    if (!notification.method || typeof notification.method !== 'string') {
      throw this.createError('protocol_error', 'Invalid Request', -32600);
    }

    if (!notification.from || !notification.to) {
      throw this.createError('protocol_error', 'Missing required routing information', -32600);
    }
  }

  /**
   * Validate security constraints
   */
  private async validateSecurity(message: A2AMessage | A2ANotification): Promise<void> {
    if (!this.config.securityEnabled) {
      return;
    }

    // Check if agent is trusted
    if (this.trustedAgents.size > 0 && !this.trustedAgents.has(message.from)) {
      throw this.createError(
        'authorization_error',
        `Agent not trusted: ${message.from}`,
        -32003
      );
    }

    // Validate signature if present
    if ('signature' in message && message.signature) {
      const isValidSignature = await this.validateSignature(message);
      if (!isValidSignature) {
        throw this.createError(
          'authentication_error',
          'Authentication failed',
          -32002
        );
      }
    }

    // Check message timestamp (prevent replay attacks)
    const now = Date.now();
    const messageAge = now - message.timestamp;
    const maxAge = this.config.messageTimeout || 300000; // 5 minutes default

    if (messageAge > maxAge) {
      throw this.createError(
        'authentication_error',
        'Message timestamp too old',
        -32002
      );
    }
  }

  /**
   * Validate message signature (mock implementation)
   */
  private async validateSignature(message: A2AMessage): Promise<boolean> {
    // In a real implementation, this would verify the cryptographic signature
    // using the agent's public key
    return message.signature !== 'invalid-signature';
  }

  /**
   * Queue message for processing with priority handling
   */
  private async queueMessage(message: A2AMessage): Promise<A2AResponse> {
    return new Promise((resolve, reject) => {
      const queuedMessage: QueuedMessage = {
        message,
        priority: message.priority || 'normal',
        timestamp: Date.now(),
        resolve,
        reject,
        retryCount: 0
      };

      // Insert based on priority
      this.insertByPriority(queuedMessage);

      // Apply timeout
      const timeout = message.context?.timeout || this.config.messageTimeout;
      if (timeout) {
        setTimeout(() => {
          this.removeFromQueue(queuedMessage);
          reject(this.createError(
            'timeout_error',
            `Message timeout after ${timeout}ms`,
            -32000
          ));
        }, timeout);
      }
    });
  }

  /**
   * Insert message into queue based on priority
   */
  private insertByPriority(queuedMessage: QueuedMessage): void {
    const priorityOrder = { 'critical': 0, 'high': 1, 'normal': 2, 'low': 3 };
    const messagePriority = priorityOrder[queuedMessage.priority];

    let insertIndex = this.messageQueue.length;
    for (let i = 0; i < this.messageQueue.length; i++) {
      const existingPriority = priorityOrder[this.messageQueue[i].priority];
      if (messagePriority < existingPriority) {
        insertIndex = i;
        break;
      }
    }

    this.messageQueue.splice(insertIndex, 0, queuedMessage);
  }

  /**
   * Remove message from queue
   */
  private removeFromQueue(queuedMessage: QueuedMessage): void {
    const index = this.messageQueue.indexOf(queuedMessage);
    if (index !== -1) {
      this.messageQueue.splice(index, 1);
    }
  }

  /**
   * Start message processing loop
   */
  private startMessageProcessing(): void {
    this.processingQueue = true;
    this.processMessageQueue();
  }

  /**
   * Process message queue
   */
  private async processMessageQueue(): Promise<void> {
    while (this.processingQueue) {
      try {
        if (this.messageQueue.length === 0) {
          await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
          continue;
        }

        // Check concurrent message limit
        if (this.activeMessages.size >= this.config.maxConcurrentMessages) {
          await new Promise(resolve => setTimeout(resolve, 10));
          continue;
        }

        const queuedMessage = this.messageQueue.shift();
        if (!queuedMessage) continue;

        // Process message
        this.processMessage(queuedMessage);

      } catch (error) {
        this.logger.error('Error in message processing queue:', error);
      }
    }
  }

  /**
   * Process individual message
   */
  private async processMessage(queuedMessage: QueuedMessage): Promise<void> {
    const startTime = Date.now();
    const messageId = queuedMessage.message.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.activeMessages.set(messageId, queuedMessage);

    try {
      this.metrics.messagesProcessed++;

      // Find and execute handler
      const handler = this.messageHandlers.get(queuedMessage.message.method);
      if (!handler) {
        throw this.createError(
          'capability_not_found',
          `No handler found for method: ${queuedMessage.message.method}`,
          -32601
        );
      }

      // Execute handler
      const result = await handler(queuedMessage.message);

      // Create response
      const response: A2AResponse = {
        jsonrpc: '2.0',
        result,
        id: queuedMessage.message.id || null,
        from: this.config.agentId,
        to: queuedMessage.message.from,
        timestamp: Date.now(),
        messageType: 'response'
      };

      // Track success
      const responseTime = Date.now() - startTime;
      this.metrics.responseTimes.push(responseTime);
      if (this.metrics.responseTimes.length > 1000) {
        this.metrics.responseTimes.splice(0, 100); // Keep last 1000 entries
      }
      
      this.metrics.messagesSucceeded++;
      queuedMessage.resolve(response);

      this.logger.debug('Message processed successfully', {
        method: queuedMessage.message.method,
        responseTime,
        from: queuedMessage.message.from
      });

    } catch (error: any) {
      await this.handleMessageError(queuedMessage, error, startTime);
    } finally {
      this.activeMessages.delete(messageId);
    }
  }

  /**
   * Handle message processing errors with retry logic
   */
  private async handleMessageError(
    queuedMessage: QueuedMessage, 
    error: any, 
    startTime: number
  ): Promise<void> {
    const responseTime = Date.now() - startTime;
    this.metrics.responseTimes.push(responseTime);
    
    // Check if error is retryable and retry policy exists
    const retryPolicy = queuedMessage.message.context?.retryPolicy || this.config.retryPolicy;
    const isRetryable = this.isRetryableError(error);

    if (isRetryable && retryPolicy && queuedMessage.retryCount < retryPolicy.maxAttempts) {
      queuedMessage.retryCount++;
      
      // Calculate backoff delay
      const delay = this.calculateBackoffDelay(retryPolicy, queuedMessage.retryCount);
      
      this.logger.debug('Retrying message after error', {
        method: queuedMessage.message.method,
        retryCount: queuedMessage.retryCount,
        delay,
        error: error.message
      });

      // Re-queue with delay
      setTimeout(() => {
        this.insertByPriority(queuedMessage);
      }, delay);

      return;
    }

    // No more retries or not retryable - fail the message
    this.metrics.messagesFailed++;
    const errorType = this.getErrorType(error);
    this.trackError(errorType);

    const a2aError = error instanceof Error && 'type' in error 
      ? error as A2AError
      : this.createError('internal_error', error.message || 'Unknown error', -32603);

    queuedMessage.reject(a2aError);

    this.logger.error('Message processing failed', {
      method: queuedMessage.message.method,
      error: error.message,
      retryCount: queuedMessage.retryCount
    });
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: any): boolean {
    if (!error || typeof error !== 'object') return false;
    
    const retryableTypes: A2AErrorType[] = [
      'timeout_error',
      'agent_unavailable',
      'resource_exhausted',
      'routing_error'
    ];

    return retryableTypes.includes(error.type) || 
           error.retryable === true ||
           error.code === -32000; // Server error (potentially temporary)
  }

  /**
   * Calculate backoff delay for retries
   */
  private calculateBackoffDelay(retryPolicy: RetryPolicy, attempt: number): number {
    let delay: number;

    switch (retryPolicy.backoffStrategy) {
      case 'linear':
        delay = retryPolicy.baseDelay * attempt;
        break;
      case 'exponential':
        delay = retryPolicy.baseDelay * Math.pow(2, attempt - 1);
        break;
      case 'fixed':
      default:
        delay = retryPolicy.baseDelay;
        break;
    }

    // Apply maximum delay
    delay = Math.min(delay, retryPolicy.maxDelay);

    // Apply jitter if enabled
    if (retryPolicy.jitter) {
      const jitterAmount = delay * 0.1; // 10% jitter
      delay += (Math.random() - 0.5) * 2 * jitterAmount;
    }

    return Math.max(0, Math.floor(delay));
  }

  /**
   * Get error type from error object
   */
  private getErrorType(error: any): A2AErrorType {
    if (error && typeof error === 'object' && 'type' in error) {
      return error.type as A2AErrorType;
    }
    return 'internal_error';
  }

  /**
   * Track error statistics
   */
  private trackError(errorType: A2AErrorType): void {
    const currentCount = this.metrics.errorsByType.get(errorType) || 0;
    this.metrics.errorsByType.set(errorType, currentCount + 1);
  }

  /**
   * Create A2A error object
   */
  private createError(type: A2AErrorType, message: string, code: number): A2AError {
    return {
      code,
      message,
      type,
      source: this.config.agentId,
      retryable: this.isRetryableError({ type })
    } as A2AError;
  }

  /**
   * Process notification (mock implementation)
   */
  private async processNotification(notification: A2ANotification): Promise<void> {
    // In real implementation, this would use the transport layer to send the notification
    this.logger.debug('Processing notification', {
      method: notification.method,
      to: notification.to
    });

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  /**
   * Initialize transport layers (mock implementation)
   */
  private async initializeTransports(): Promise<void> {
    // In real implementation, this would initialize the actual transport layers
    this.logger.debug('Initializing transport layers', {
      transports: this.config.transports.map(t => t.protocol)
    });
  }

  /**
   * Shutdown transport layers (mock implementation)
   */
  private async shutdownTransports(): Promise<void> {
    // In real implementation, this would shutdown the actual transport layers
    this.logger.debug('Shutting down transport layers');
  }

  /**
   * Register default message handlers
   */
  private registerDefaultHandlers(): void {
    // System ping handler
    this.messageHandlers.set('system.ping', async (message: A2AMessage) => {
      return {
        pong: true,
        timestamp: Date.now(),
        agentId: this.config.agentId
      };
    });

    // Agent info handler
    this.messageHandlers.set('agent.info', async (message: A2AMessage) => {
      return {
        agentCard: this.config.agentCard,
        uptime: Date.now() - this.metrics.startTime,
        metrics: this.getMetrics()
      };
    });

    // Echo handler for testing
    this.messageHandlers.set('system.echo', async (message: A2AMessage) => {
      return {
        echo: message.params,
        timestamp: Date.now()
      };
    });
  }

  /**
   * Wait for active messages to complete
   */
  private async waitForActiveMessages(timeoutMs: number): Promise<void> {
    const startTime = Date.now();
    
    while (this.activeMessages.size > 0 && (Date.now() - startTime) < timeoutMs) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (this.activeMessages.size > 0) {
      this.logger.warn(`${this.activeMessages.size} messages still active after timeout`);
    }
  }
}