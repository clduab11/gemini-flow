/**
 * A2A Protocol Manager
 *
 * Core component for Agent-to-Agent communication using JSON-RPC 2.0 protocol.
 * Provides comprehensive message handling, routing, security, and error management.
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { A2AMessage, A2AResponse, A2ANotification, A2AErrorType, A2AProtocolConfig, AgentCard } from "../../../types/a2a.js";
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
    errorsByType: {
        [key in A2AErrorType]?: number;
    };
}
/**
 * A2A Protocol Manager - Core JSON-RPC 2.0 implementation
 */
export declare class A2AProtocolManager extends EventEmitter {
    private config;
    private logger;
    private isInitialized;
    private isShuttingDown;
    private messageHandlers;
    private messageQueue;
    private processingQueue;
    private activeMessages;
    private metrics;
    private trustedAgents;
    private messageValidationEnabled;
    constructor(config: A2AProtocolConfig);
    /**
     * Initialize the protocol manager
     */
    initialize(): Promise<void>;
    /**
     * Gracefully shutdown the protocol manager
     */
    shutdown(): Promise<void>;
    /**
     * Send a message and wait for response
     */
    sendMessage(message: A2AMessage): Promise<A2AResponse>;
    /**
     * Send a notification (no response expected)
     */
    sendNotification(notification: A2ANotification): Promise<void>;
    /**
     * Register a message handler for a specific method
     */
    registerMessageHandler(method: string, handler: MessageHandler): Promise<void>;
    /**
     * Unregister a message handler
     */
    unregisterMessageHandler(method: string): Promise<void>;
    /**
     * Get the agent card for this protocol manager
     */
    getAgentCard(): AgentCard;
    /**
     * Get performance metrics
     */
    getMetrics(): ProtocolManagerMetrics;
    /**
     * Validate configuration
     */
    private validateConfiguration;
    /**
     * Validate JSON-RPC 2.0 message format
     */
    private validateMessage;
    /**
     * Validate notification format
     */
    private validateNotification;
    /**
     * Validate security constraints
     */
    private validateSecurity;
    /**
     * Validate message signature (mock implementation)
     */
    private validateSignature;
    /**
     * Queue message for processing with priority handling
     */
    private queueMessage;
    /**
     * Insert message into queue based on priority
     */
    private insertByPriority;
    /**
     * Remove message from queue
     */
    private removeFromQueue;
    /**
     * Start message processing loop
     */
    private startMessageProcessing;
    /**
     * Process message queue
     */
    private processMessageQueue;
    /**
     * Process individual message
     */
    private processMessage;
    /**
     * Handle message processing errors with retry logic
     */
    private handleMessageError;
    /**
     * Check if error is retryable
     */
    private isRetryableError;
    /**
     * Calculate backoff delay for retries
     */
    private calculateBackoffDelay;
    /**
     * Get error type from error object
     */
    private getErrorType;
    /**
     * Track error statistics
     */
    private trackError;
    /**
     * Create A2A error object
     */
    private createError;
    /**
     * Process notification (mock implementation)
     */
    private processNotification;
    /**
     * Initialize transport layers (mock implementation)
     */
    private initializeTransports;
    /**
     * Shutdown transport layers (mock implementation)
     */
    private shutdownTransports;
    /**
     * Register default message handlers
     */
    private registerDefaultHandlers;
    /**
     * Wait for active messages to complete
     */
    private waitForActiveMessages;
}
//# sourceMappingURL=a2a-protocol-manager.d.ts.map