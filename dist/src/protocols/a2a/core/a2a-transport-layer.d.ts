/**
 * A2A Transport Layer
 *
 * Multi-protocol transport layer supporting WebSocket, HTTP, gRPC, and TCP
 * for Agent-to-Agent communication with connection pooling, retry logic,
 * and comprehensive error handling.
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { TransportProtocol, TransportConfig, A2AMessage, A2AResponse, A2ANotification, AgentId } from "../../../types/a2a.js";
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
 * A2A Transport Layer implementation
 */
export declare class A2ATransportLayer extends EventEmitter {
    private logger;
    private isInitialized;
    private connectionPool;
    private supportedProtocols;
    private protocolHandlers;
    private connectionStates;
    private metrics;
    private defaultTimeout;
    private connectionCleanupInterval;
    private maxRetries;
    private retryBaseDelay;
    constructor();
    /**
     * Initialize transport layer with configurations
     */
    initialize(configs: TransportConfig[]): Promise<void>;
    /**
     * Shutdown transport layer
     */
    shutdown(): Promise<void>;
    /**
     * Connect to an agent using specified transport configuration
     */
    connect(agentId: AgentId, config: TransportConfig): Promise<TransportConnection>;
    /**
     * Disconnect from a specific connection
     */
    disconnect(connectionId: string): Promise<void>;
    /**
     * Send message over specific connection
     */
    sendMessage(connectionId: string, message: A2AMessage): Promise<A2AResponse>;
    /**
     * Send notification (no response expected)
     */
    sendNotification(connectionId: string, notification: A2ANotification): Promise<void>;
    /**
     * Broadcast message to multiple connections
     */
    broadcastMessage(message: A2AMessage, excludeConnections?: string[]): Promise<A2AResponse[]>;
    /**
     * Get active connections
     */
    getActiveConnections(): Map<string, TransportConnection>;
    /**
     * Get connection by agent ID
     */
    getConnectionByAgentId(agentId: AgentId): TransportConnection | undefined;
    /**
     * Check if protocol is supported
     */
    isProtocolSupported(protocol: TransportProtocol): boolean;
    /**
     * Get transport metrics
     */
    getTransportMetrics(): TransportMetrics;
    /**
     * Validate transport configuration
     */
    private validateTransportConfig;
    /**
     * Initialize protocol-specific handlers
     */
    private initializeProtocols;
    /**
     * Establish connection based on protocol
     */
    private establishConnection;
    /**
     * Establish WebSocket connection
     */
    private establishWebSocketConnection;
    /**
     * Establish HTTP connection
     */
    private establishHttpConnection;
    /**
     * Establish TCP connection
     */
    private establishTcpConnection;
    /**
     * Send message internally based on protocol
     */
    private sendMessageInternal;
    /**
     * Send WebSocket message
     */
    private sendWebSocketMessage;
    /**
     * Send HTTP message
     */
    private sendHttpMessage;
    /**
     * Send gRPC message
     */
    private sendGrpcMessage;
    /**
     * Send TCP message
     */
    private sendTcpMessage;
    /**
     * Send notification internally
     */
    private sendNotificationInternal;
    /**
     * Create mock response for testing
     */
    private createMockResponse;
    /**
     * Handle authentication
     */
    private handleAuthentication;
    /**
     * Handle TLS configuration
     */
    private handleTlsConfiguration;
    /**
     * Close connection
     */
    private closeConnection;
    /**
     * Track connection establishment
     */
    private trackConnection;
    /**
     * Track message success
     */
    private trackMessageSuccess;
    /**
     * Track message failure
     */
    private trackMessageFailure;
    /**
     * Check if error is retryable
     */
    private isRetryableError;
    /**
     * Create transport error
     */
    private createTransportError;
    /**
     * Get error code for error type
     */
    private getErrorCodeForType;
    /**
     * Clean up stale connections
     */
    private cleanupConnections;
    /**
     * Simulate connection delay for testing
     */
    private simulateConnectionDelay;
    /**
     * Simulate network delay for testing
     */
    private simulateNetworkDelay;
    /**
     * Create message frame for binary protocols
     */
    private createMessageFrame;
    /**
     * Parse message frames from binary data
     */
    private parseMessageFrames;
    /**
     * Get type code for message type
     */
    private getTypeCode;
    /**
     * Get message type from code
     */
    private getTypeFromCode;
    /**
     * Set up WebSocket event listeners
     */
    private setupWebSocketListeners;
    /**
     * Set up HTTP/2 session event listeners
     */
    private setupHttp2Listeners;
    /**
     * Set up TCP socket event listeners
     */
    private setupTcpListeners;
    /**
     * Handle connection close
     */
    private handleConnectionClose;
    /**
     * Handle connection error
     */
    private handleConnectionError;
    /**
     * Schedule connection reconnection
     */
    private scheduleReconnection;
    /**
     * Reconnect a connection
     */
    private reconnectConnection;
    /**
     * Initialize connection state for reconnection
     */
    private initializeConnectionState;
}
//# sourceMappingURL=a2a-transport-layer.d.ts.map