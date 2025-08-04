/**
 * A2A Transport Layer Tests
 * 
 * Comprehensive test suite for A2ATransportLayer supporting WebSocket, HTTP, gRPC
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  TransportProtocol,
  TransportConfig,
  A2AMessage,
  A2AResponse,
  AgentId,
  TLSConfig,
  AuthConfig
} from '../../../src/types/a2a.js';

// Mock transport implementations will be created later
interface TransportConnection {
  id: string;
  protocol: TransportProtocol;
  isConnected: boolean;
  lastActivity: number;
}

class A2ATransportLayer {
  constructor() {}
  async initialize(configs: TransportConfig[]): Promise<void> {}
  async shutdown(): Promise<void> {}
  async connect(agentId: AgentId, config: TransportConfig): Promise<TransportConnection> { return {} as TransportConnection; }
  async disconnect(connectionId: string): Promise<void> {}
  async sendMessage(connectionId: string, message: A2AMessage): Promise<A2AResponse> { return {} as A2AResponse; }
  async sendNotification(connectionId: string, notification: A2AMessage): Promise<void> {}
  async broadcastMessage(message: A2AMessage, excludeConnections?: string[]): Promise<A2AResponse[]> { return []; }
  getActiveConnections(): Map<string, TransportConnection> { return new Map(); }
  getConnectionByAgentId(agentId: AgentId): TransportConnection | undefined { return undefined; }
  getTransportMetrics(): any { return {}; }
  isProtocolSupported(protocol: TransportProtocol): boolean { return true; }
}

describe('A2ATransportLayer', () => {
  let transportLayer: A2ATransportLayer;
  let mockConfigs: TransportConfig[];

  beforeEach(async () => {
    transportLayer = new A2ATransportLayer();
    
    mockConfigs = [
      {
        protocol: 'websocket',
        host: 'localhost',
        port: 8080,
        path: '/a2a-ws',
        secure: false,
        timeout: 30000,
        keepAlive: true,
        compression: true,
        auth: {
          type: 'token',
          credentials: { token: 'ws-auth-token' }
        }
      },
      {
        protocol: 'http',
        host: 'localhost',
        port: 8081,
        path: '/a2a-http',
        secure: true,
        timeout: 15000,
        compression: false,
        tls: {
          cert: 'mock-cert.pem',
          key: 'mock-key.pem',
          ca: 'mock-ca.pem',
          rejectUnauthorized: true
        },
        auth: {
          type: 'certificate',
          credentials: { certFile: 'client-cert.pem' }
        }
      },
      {
        protocol: 'grpc',
        host: 'localhost',
        port: 9090,
        secure: true,
        timeout: 45000,
        keepAlive: true,
        tls: {
          cert: 'grpc-cert.pem',
          key: 'grpc-key.pem',
          rejectUnauthorized: false
        },
        auth: {
          type: 'oauth2',
          credentials: {
            clientId: 'grpc-client-id',
            clientSecret: 'grpc-client-secret',
            tokenUrl: 'https://auth.example.com/token'
          }
        }
      },
      {
        protocol: 'tcp',
        host: '192.168.1.100',
        port: 9999,
        secure: false,
        timeout: 60000,
        keepAlive: true,
        auth: {
          type: 'none'
        }
      }
    ];

    await transportLayer.initialize(mockConfigs);
  });

  afterEach(async () => {
    await transportLayer.shutdown();
    jest.clearAllMocks();
  });

  describe('Initialization and Configuration', () => {
    it('should initialize with multiple transport configurations', async () => {
      await expect(transportLayer.initialize(mockConfigs)).resolves.not.toThrow();
    });

    it('should validate transport configurations', async () => {
      const invalidConfigs = [
        {
          protocol: 'websocket' as TransportProtocol,
          // Missing required host
          port: 8080
        }
      ];

      await expect(transportLayer.initialize(invalidConfigs))
        .rejects.toThrow('Invalid transport configuration: missing host');
    });

    it('should check protocol support', () => {
      expect(transportLayer.isProtocolSupported('websocket')).toBe(true);
      expect(transportLayer.isProtocolSupported('http')).toBe(true);
      expect(transportLayer.isProtocolSupported('grpc')).toBe(true);
      expect(transportLayer.isProtocolSupported('tcp')).toBe(true);
    });

    it('should handle graceful shutdown', async () => {
      await expect(transportLayer.shutdown()).resolves.not.toThrow();
    });
  });

  describe('WebSocket Transport', () => {
    let wsConfig: TransportConfig;

    beforeEach(() => {
      wsConfig = mockConfigs.find(c => c.protocol === 'websocket')!;
    });

    it('should establish WebSocket connection', async () => {
      const connection = await transportLayer.connect('test-agent-001', wsConfig);
      
      expect(connection.protocol).toBe('websocket');
      expect(connection.isConnected).toBe(true);
      expect(connection.id).toBeDefined();
    });

    it('should send message over WebSocket', async () => {
      const connection = await transportLayer.connect('test-agent-001', wsConfig);
      
      const message: A2AMessage = {
        jsonrpc: '2.0',
        method: 'test.websocket',
        params: { data: 'websocket test data' },
        id: 'ws-001',
        from: 'test-agent-001',
        to: 'target-agent-001',
        timestamp: Date.now(),
        messageType: 'request'
      };

      const response = await transportLayer.sendMessage(connection.id, message);
      
      expect(response.jsonrpc).toBe('2.0');
      expect(response.id).toBe('ws-001');
    });

    it('should handle WebSocket connection failure', async () => {
      const invalidWsConfig: TransportConfig = {
        ...wsConfig,
        port: 99999 // Invalid port
      };

      await expect(transportLayer.connect('test-agent-002', invalidWsConfig))
        .rejects.toThrow('WebSocket connection failed');
    });

    it('should support WebSocket compression', async () => {
      const compressedConfig: TransportConfig = {
        ...wsConfig,
        compression: true
      };

      const connection = await transportLayer.connect('compressed-agent', compressedConfig);
      expect(connection.isConnected).toBe(true);
    });

    it('should handle WebSocket keepalive', async () => {
      const connection = await transportLayer.connect('keepalive-agent', wsConfig);
      
      // Simulate some time passing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(connection.isConnected).toBe(true);
      expect(connection.lastActivity).toBeGreaterThan(0);
    });

    it('should handle WebSocket authentication', async () => {
      const authedConfig: TransportConfig = {
        ...wsConfig,
        auth: {
          type: 'token',
          credentials: { token: 'valid-ws-token' }
        }
      };

      const connection = await transportLayer.connect('authed-agent', authedConfig);
      expect(connection.isConnected).toBe(true);
    });

    it('should reject invalid WebSocket authentication', async () => {
      const invalidAuthConfig: TransportConfig = {
        ...wsConfig,
        auth: {
          type: 'token',
          credentials: { token: 'invalid-token' }
        }
      };

      await expect(transportLayer.connect('invalid-auth-agent', invalidAuthConfig))
        .rejects.toThrow('WebSocket authentication failed');
    });
  });

  describe('HTTP Transport', () => {
    let httpConfig: TransportConfig;

    beforeEach(() => {
      httpConfig = mockConfigs.find(c => c.protocol === 'http')!;
    });

    it('should establish HTTP connection', async () => {
      const connection = await transportLayer.connect('http-agent-001', httpConfig);
      
      expect(connection.protocol).toBe('http');
      expect(connection.isConnected).toBe(true);
    });

    it('should send message over HTTP', async () => {
      const connection = await transportLayer.connect('http-agent-001', httpConfig);
      
      const message: A2AMessage = {
        jsonrpc: '2.0',
        method: 'test.http',
        params: { endpoint: '/api/test' },
        id: 'http-001',
        from: 'http-agent-001',
        to: 'target-agent-001',
        timestamp: Date.now(),
        messageType: 'request'
      };

      const response = await transportLayer.sendMessage(connection.id, message);
      
      expect(response.jsonrpc).toBe('2.0');
      expect(response.id).toBe('http-001');
    });

    it('should handle HTTPS with TLS configuration', async () => {
      const httpsConfig: TransportConfig = {
        ...httpConfig,
        secure: true,
        tls: {
          cert: 'client-cert.pem',
          key: 'client-key.pem',
          ca: 'ca-cert.pem',
          rejectUnauthorized: true
        }
      };

      const connection = await transportLayer.connect('https-agent', httpsConfig);
      expect(connection.isConnected).toBe(true);
    });

    it('should handle HTTP timeout', async () => {
      const timeoutConfig: TransportConfig = {
        ...httpConfig,
        timeout: 100 // Very short timeout
      };

      const connection = await transportLayer.connect('timeout-agent', timeoutConfig);
      
      const slowMessage: A2AMessage = {
        jsonrpc: '2.0',
        method: 'slow.operation',
        params: {},
        id: 'timeout-001',
        from: 'timeout-agent',
        to: 'slow-target',
        timestamp: Date.now(),
        messageType: 'request'
      };

      await expect(transportLayer.sendMessage(connection.id, slowMessage))
        .rejects.toThrow('HTTP request timeout');
    });

    it('should handle HTTP certificate authentication', async () => {
      const certAuthConfig: TransportConfig = {
        ...httpConfig,
        auth: {
          type: 'certificate',
          credentials: {
            certFile: 'client-cert.pem',
            keyFile: 'client-key.pem'
          }
        }
      };

      const connection = await transportLayer.connect('cert-agent', certAuthConfig);
      expect(connection.isConnected).toBe(true);
    });

    it('should handle HTTP connection pooling', async () => {
      // Create multiple connections to same endpoint
      const connections = await Promise.all([
        transportLayer.connect('pool-agent-1', httpConfig),
        transportLayer.connect('pool-agent-2', httpConfig),
        transportLayer.connect('pool-agent-3', httpConfig)
      ]);

      expect(connections).toHaveLength(3);
      connections.forEach(conn => {
        expect(conn.isConnected).toBe(true);
        expect(conn.protocol).toBe('http');
      });
    });
  });

  describe('gRPC Transport', () => {
    let grpcConfig: TransportConfig;

    beforeEach(() => {
      grpcConfig = mockConfigs.find(c => c.protocol === 'grpc')!;
    });

    it('should establish gRPC connection', async () => {
      const connection = await transportLayer.connect('grpc-agent-001', grpcConfig);
      
      expect(connection.protocol).toBe('grpc');
      expect(connection.isConnected).toBe(true);
    });

    it('should send message over gRPC', async () => {
      const connection = await transportLayer.connect('grpc-agent-001', grpcConfig);
      
      const message: A2AMessage = {
        jsonrpc: '2.0',
        method: 'test.grpc',
        params: { 
          service: 'A2AService',
          method: 'ProcessMessage'
        },
        id: 'grpc-001',
        from: 'grpc-agent-001',
        to: 'target-agent-001',
        timestamp: Date.now(),
        messageType: 'request'
      };

      const response = await transportLayer.sendMessage(connection.id, message);
      
      expect(response.jsonrpc).toBe('2.0');
      expect(response.id).toBe('grpc-001');
    });

    it('should handle gRPC streaming', async () => {
      const streamingConfig: TransportConfig = {
        ...grpcConfig,
        // gRPC-specific streaming options could be added here
      };

      const connection = await transportLayer.connect('streaming-agent', streamingConfig);
      
      const streamMessage: A2AMessage = {
        jsonrpc: '2.0',
        method: 'stream.data',
        params: { streamId: 'stream-001' },
        id: 'stream-001',
        from: 'streaming-agent',
        to: 'stream-consumer',
        timestamp: Date.now(),
        messageType: 'request'
      };

      const response = await transportLayer.sendMessage(connection.id, streamMessage);
      expect(response.id).toBe('stream-001');
    });

    it('should handle gRPC OAuth2 authentication', async () => {
      const oauth2Config: TransportConfig = {
        ...grpcConfig,
        auth: {
          type: 'oauth2',
          credentials: {
            clientId: 'grpc-client',
            clientSecret: 'grpc-secret',
            tokenUrl: 'https://auth.example.com/oauth/token'
          }
        }
      };

      const connection = await transportLayer.connect('oauth2-agent', oauth2Config);
      expect(connection.isConnected).toBe(true);
    });

    it('should handle gRPC connection errors', async () => {
      const invalidGrpcConfig: TransportConfig = {
        ...grpcConfig,
        host: 'invalid-grpc-host.local'
      };

      await expect(transportLayer.connect('invalid-grpc-agent', invalidGrpcConfig))
        .rejects.toThrow('gRPC connection failed');
    });

    it('should handle gRPC metadata and headers', async () => {
      const connection = await transportLayer.connect('metadata-agent', grpcConfig);
      
      const messageWithMetadata: A2AMessage = {
        jsonrpc: '2.0',
        method: 'test.metadata',
        params: {
          metadata: {
            'custom-header': 'custom-value',
            'agent-version': '1.0.0'
          }
        },
        id: 'metadata-001',
        from: 'metadata-agent',
        to: 'target-agent',
        timestamp: Date.now(),
        messageType: 'request'
      };

      const response = await transportLayer.sendMessage(connection.id, messageWithMetadata);
      expect(response.id).toBe('metadata-001');
    });
  });

  describe('TCP Transport', () => {
    let tcpConfig: TransportConfig;

    beforeEach(() => {
      tcpConfig = mockConfigs.find(c => c.protocol === 'tcp')!;
    });

    it('should establish TCP connection', async () => {
      const connection = await transportLayer.connect('tcp-agent-001', tcpConfig);
      
      expect(connection.protocol).toBe('tcp');
      expect(connection.isConnected).toBe(true);
    });

    it('should send message over TCP', async () => {
      const connection = await transportLayer.connect('tcp-agent-001', tcpConfig);
      
      const message: A2AMessage = {
        jsonrpc: '2.0',
        method: 'test.tcp',
        params: { data: 'raw tcp data' },
        id: 'tcp-001',
        from: 'tcp-agent-001',
        to: 'target-agent-001',
        timestamp: Date.now(),
        messageType: 'request'
      };

      const response = await transportLayer.sendMessage(connection.id, message);
      
      expect(response.jsonrpc).toBe('2.0');
      expect(response.id).toBe('tcp-001');
    });

    it('should handle TCP connection keepalive', async () => {
      const keepAliveConfig: TransportConfig = {
        ...tcpConfig,
        keepAlive: true
      };

      const connection = await transportLayer.connect('keepalive-tcp-agent', keepAliveConfig);
      expect(connection.isConnected).toBe(true);
      
      // Simulate network activity
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(connection.lastActivity).toBeGreaterThan(0);
    });

    it('should handle TCP large message transmission', async () => {
      const connection = await transportLayer.connect('large-msg-agent', tcpConfig);
      
      const largeMessage: A2AMessage = {
        jsonrpc: '2.0',
        method: 'test.large',
        params: {
          data: 'x'.repeat(10000), // 10KB of data
          chunks: Array(100).fill(0).map((_, i) => `chunk-${i}`)
        },
        id: 'large-001',
        from: 'large-msg-agent',
        to: 'target-agent',
        timestamp: Date.now(),
        messageType: 'request'
      };

      const response = await transportLayer.sendMessage(connection.id, largeMessage);
      expect(response.id).toBe('large-001');
    });
  });

  describe('Connection Management', () => {
    it('should track active connections', async () => {
      const connections = await Promise.all([
        transportLayer.connect('agent-1', mockConfigs[0]),
        transportLayer.connect('agent-2', mockConfigs[1]),
        transportLayer.connect('agent-3', mockConfigs[2])
      ]);

      const activeConnections = transportLayer.getActiveConnections();
      expect(activeConnections.size).toBe(3);
      
      connections.forEach(conn => {
        expect(activeConnections.has(conn.id)).toBe(true);
      });
    });

    it('should find connection by agent ID', async () => {
      const connection = await transportLayer.connect('findable-agent', mockConfigs[0]);
      
      const foundConnection = transportLayer.getConnectionByAgentId('findable-agent');
      expect(foundConnection).toBeDefined();
      expect(foundConnection?.id).toBe(connection.id);
    });

    it('should disconnect specific connections', async () => {
      const connection = await transportLayer.connect('disconnect-agent', mockConfigs[0]);
      expect(connection.isConnected).toBe(true);

      await transportLayer.disconnect(connection.id);
      
      const activeConnections = transportLayer.getActiveConnections();
      expect(activeConnections.has(connection.id)).toBe(false);
    });

    it('should handle connection cleanup on shutdown', async () => {
      await Promise.all([
        transportLayer.connect('cleanup-1', mockConfigs[0]),
        transportLayer.connect('cleanup-2', mockConfigs[1])
      ]);

      expect(transportLayer.getActiveConnections().size).toBe(2);

      await transportLayer.shutdown();
      
      expect(transportLayer.getActiveConnections().size).toBe(0);
    });

    it('should detect and handle stale connections', async () => {
      const connection = await transportLayer.connect('stale-agent', mockConfigs[0]);
      
      // Simulate stale connection by updating last activity to old timestamp
      connection.lastActivity = Date.now() - 300000; // 5 minutes ago
      
      const activeConnections = transportLayer.getActiveConnections();
      const staleConnection = activeConnections.get(connection.id);
      expect(staleConnection?.lastActivity).toBeLessThan(Date.now() - 60000);
    });
  });

  describe('Broadcasting and Multicasting', () => {
    beforeEach(async () => {
      // Set up multiple connections for broadcasting tests
      await Promise.all([
        transportLayer.connect('broadcast-1', mockConfigs[0]),
        transportLayer.connect('broadcast-2', mockConfigs[1]),
        transportLayer.connect('broadcast-3', mockConfigs[2])
      ]);
    });

    it('should broadcast message to all connections', async () => {
      const broadcastMessage: A2AMessage = {
        jsonrpc: '2.0',
        method: 'system.broadcast',
        params: { announcement: 'System update available' },
        id: 'broadcast-001',
        from: 'system-agent',
        to: 'broadcast',
        timestamp: Date.now(),
        messageType: 'notification'
      };

      const responses = await transportLayer.broadcastMessage(broadcastMessage);
      
      expect(responses.length).toBe(3); // Should send to all 3 connections
      responses.forEach(response => {
        expect(response.jsonrpc).toBe('2.0');
      });
    });

    it('should broadcast with exclusions', async () => {
      const connections = transportLayer.getActiveConnections();
      const connectionIds = Array.from(connections.keys());
      const excludeFirst = [connectionIds[0]]; // Exclude first connection

      const selectiveBroadcast: A2AMessage = {
        jsonrpc: '2.0',
        method: 'selective.broadcast',
        params: { message: 'Selective message' },
        id: 'selective-001',
        from: 'selective-agent',
        to: 'broadcast',
        timestamp: Date.now(),
        messageType: 'notification'
      };

      const responses = await transportLayer.broadcastMessage(selectiveBroadcast, excludeFirst);
      
      expect(responses.length).toBe(2); // Should send to 2 connections (excluding 1)
    });

    it('should handle broadcast failures gracefully', async () => {
      // Disconnect one connection to simulate partial failure
      const connections = transportLayer.getActiveConnections();
      const firstConnectionId = Array.from(connections.keys())[0];
      await transportLayer.disconnect(firstConnectionId);

      const broadcastMessage: A2AMessage = {
        jsonrpc: '2.0',
        method: 'partial.broadcast',
        params: { data: 'test data' },
        id: 'partial-001',
        from: 'test-agent',
        to: 'broadcast',
        timestamp: Date.now(),
        messageType: 'notification'
      };

      const responses = await transportLayer.broadcastMessage(broadcastMessage);
      
      expect(responses.length).toBe(2); // Should succeed with remaining connections
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle connection timeout', async () => {
      const timeoutConfig: TransportConfig = {
        protocol: 'websocket',
        host: 'unreachable-host.local',
        port: 8080,
        timeout: 1000 // 1 second timeout
      };

      await expect(transportLayer.connect('timeout-agent', timeoutConfig))
        .rejects.toThrow('Connection timeout');
    });

    it('should retry failed connections', async () => {
      const retryConfig: TransportConfig = {
        ...mockConfigs[0],
        host: 'initially-unreachable.local' // Will fail first, succeed on retry
      };

      // Mock retry logic should eventually succeed
      const connection = await transportLayer.connect('retry-agent', retryConfig);
      expect(connection.isConnected).toBe(true);
    });

    it('should handle authentication failures', async () => {
      const invalidAuthConfig: TransportConfig = {
        ...mockConfigs[0],
        auth: {
          type: 'token',
          credentials: { token: 'invalid-token' }
        }
      };

      await expect(transportLayer.connect('auth-fail-agent', invalidAuthConfig))
        .rejects.toThrow('Authentication failed');
    });

    it('should handle network interruptions', async () => {
      const connection = await transportLayer.connect('network-test-agent', mockConfigs[0]);
      expect(connection.isConnected).toBe(true);

      // Simulate network interruption
      // The transport layer should detect and handle this
      const message: A2AMessage = {
        jsonrpc: '2.0',
        method: 'test.interrupted',
        params: {},
        id: 'interrupted-001',
        from: 'network-test-agent',
        to: 'target-agent',
        timestamp: Date.now(),
        messageType: 'request'
      };

      // Should either succeed with retry or fail gracefully
      try {
        const response = await transportLayer.sendMessage(connection.id, message);
        expect(response.id).toBe('interrupted-001');
      } catch (error: any) {
        expect(error.message).toContain('network');
      }
    });
  });

  describe('Performance Metrics and Monitoring', () => {
    it('should track transport performance metrics', async () => {
      const connection = await transportLayer.connect('metrics-agent', mockConfigs[0]);
      
      const message: A2AMessage = {
        jsonrpc: '2.0',
        method: 'test.metrics',
        params: {},
        id: 'metrics-001',
        from: 'metrics-agent',
        to: 'target-agent',
        timestamp: Date.now(),
        messageType: 'request'
      };

      await transportLayer.sendMessage(connection.id, message);
      
      const metrics = transportLayer.getTransportMetrics();
      expect(metrics.totalMessages).toBeGreaterThanOrEqual(1);
      expect(metrics.avgLatency).toBeGreaterThan(0);
      expect(metrics.successRate).toBeGreaterThan(0);
    });

    it('should track protocol-specific metrics', async () => {
      // Create connections for different protocols
      await Promise.all([
        transportLayer.connect('ws-metrics', mockConfigs[0]), // WebSocket
        transportLayer.connect('http-metrics', mockConfigs[1]), // HTTP
        transportLayer.connect('grpc-metrics', mockConfigs[2]) // gRPC
      ]);

      const metrics = transportLayer.getTransportMetrics();
      expect(metrics.protocolMetrics).toHaveProperty('websocket');
      expect(metrics.protocolMetrics).toHaveProperty('http');
      expect(metrics.protocolMetrics).toHaveProperty('grpc');
    });

    it('should provide detailed connection statistics', () => {
      const metrics = transportLayer.getTransportMetrics();
      
      expect(metrics).toHaveProperty('totalConnections');
      expect(metrics).toHaveProperty('activeConnections');
      expect(metrics).toHaveProperty('totalMessages');
      expect(metrics).toHaveProperty('avgLatency');
      expect(metrics).toHaveProperty('successRate');
      expect(metrics).toHaveProperty('errorRate');
      expect(metrics).toHaveProperty('protocolMetrics');
      expect(metrics).toHaveProperty('connectionPoolUtilization');
    });

    it('should track bandwidth usage', async () => {
      const connection = await transportLayer.connect('bandwidth-agent', mockConfigs[0]);
      
      const largeMessage: A2AMessage = {
        jsonrpc: '2.0',
        method: 'test.bandwidth',
        params: {
          largeData: 'x'.repeat(50000) // 50KB payload
        },
        id: 'bandwidth-001',
        from: 'bandwidth-agent',
        to: 'target-agent',
        timestamp: Date.now(),
        messageType: 'request'
      };

      await transportLayer.sendMessage(connection.id, largeMessage);
      
      const metrics = transportLayer.getTransportMetrics();
      expect(metrics.totalBytesTransferred).toBeGreaterThan(50000);
      expect(metrics.avgMessageSize).toBeGreaterThan(0);
    });
  });
});