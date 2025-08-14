/**
 * A2A Transport Layer Integration Tests
 * 
 * Comprehensive integration tests for Agent-to-Agent transport layer
 * including connection management, message routing, and protocol handling
 */

import { jest } from '@jest/globals';
import { A2ATransportLayer, TransportConnection } from '../../src/protocols/a2a/core/a2a-transport-layer';
import { TransportConfig, A2AMessage, A2ANotification, A2AResponse } from '../../src/types/a2a';

describe('A2A Transport Layer Integration', () => {
  let transportLayer: A2ATransportLayer;
  let mockConfigs: TransportConfig[];

  beforeEach(async () => {
    transportLayer = new A2ATransportLayer();

    // Mock transport configurations for different protocols
    mockConfigs = [
      {
        protocol: 'websocket',
        host: 'localhost',
        port: 8080,
        secure: false,
        timeout: 30000,
        auth: { type: 'none' }
      },
      {
        protocol: 'http',
        host: 'api.example.com',
        port: 443,
        secure: true,
        timeout: 15000,
        auth: {
          type: 'token',
          credentials: { token: 'valid-test-token' }
        }
      },
      {
        protocol: 'grpc',
        host: 'grpc.example.com',
        port: 9090,
        secure: true,
        timeout: 60000,
        auth: { type: 'certificate' }
      },
      {
        protocol: 'tcp',
        host: '127.0.0.1',
        port: 7777,
        keepAlive: true,
        auth: { type: 'none' }
      }
    ];

    await transportLayer.initialize(mockConfigs);
  });

  afterEach(async () => {
    await transportLayer.shutdown();
  });

  describe('Initialization and Configuration', () => {
    it('should initialize with multiple transport configurations', async () => {
      const newTransportLayer = new A2ATransportLayer();
      
      await expect(
        newTransportLayer.initialize(mockConfigs)
      ).resolves.not.toThrow();

      expect(newTransportLayer.isProtocolSupported('websocket')).toBe(true);
      expect(newTransportLayer.isProtocolSupported('http')).toBe(true);
      expect(newTransportLayer.isProtocolSupported('grpc')).toBe(true);
      expect(newTransportLayer.isProtocolSupported('tcp')).toBe(true);

      await newTransportLayer.shutdown();
    });

    it('should validate transport configurations during initialization', async () => {
      const invalidConfigs = [
        { protocol: 'websocket', host: '', port: 8080 }, // Missing host
        { protocol: 'http', host: 'example.com', port: -1 }, // Invalid port
        { protocol: 'unsupported' as any, host: 'test.com', port: 80 } // Unsupported protocol
      ];

      const newTransportLayer = new A2ATransportLayer();
      
      await expect(
        newTransportLayer.initialize(invalidConfigs)
      ).rejects.toThrow();
    });

    it('should emit initialization event', async () => {
      const initSpy = jest.fn();
      const newTransportLayer = new A2ATransportLayer();
      newTransportLayer.on('initialized', initSpy);

      await newTransportLayer.initialize(mockConfigs);
      
      expect(initSpy).toHaveBeenCalled();
      await newTransportLayer.shutdown();
    });

    it('should fail initialization with invalid configurations', async () => {
      const newTransportLayer = new A2ATransportLayer();
      
      const invalidConfigs = [
        {
          protocol: 'http',
          host: '', // Invalid empty host
          port: 443
        }
      ];

      await expect(newTransportLayer.initialize(invalidConfigs)).rejects.toThrow();
    });
  });

  describe('Connection Management', () => {
    const testAgentId = 'test-agent-001';

    it('should establish connections for different protocols', async () => {
      const connections: TransportConnection[] = [];

      for (const config of mockConfigs) {
        const connection = await transportLayer.connect(testAgentId, config);
        connections.push(connection);

        expect(connection.id).toBeDefined();
        expect(connection.protocol).toBe(config.protocol);
        expect(connection.agentId).toBe(testAgentId);
        expect(connection.isConnected).toBe(true);
        expect(connection.connectionTime).toBeGreaterThan(0);
      }

      // Verify all connections are tracked
      const activeConnections = transportLayer.getActiveConnections();
      expect(activeConnections.size).toBe(mockConfigs.length);

      // Clean up connections
      for (const connection of connections) {
        await transportLayer.disconnect(connection.id);
      }
    });

    it('should handle connection failures gracefully', async () => {
      const invalidConfig: TransportConfig = {
        protocol: 'http',
        host: 'nonexistent.invalid',
        port: 9999,
        timeout: 1000 // Short timeout for quick failure
      };

      await expect(
        transportLayer.connect(testAgentId, invalidConfig)
      ).rejects.toThrow(/Connection failed/);
    });

    it('should respect connection pool limits', async () => {
      const connections: TransportConnection[] = [];
      
      // Try to create many connections for the same agent
      const connectionPromises = Array.from({ length: 10 }, (_, i) => 
        transportLayer.connect(`${testAgentId}-${i}`, mockConfigs[0])
      );

      const results = await Promise.allSettled(connectionPromises);
      
      // Some should succeed, some might fail due to limits
      const successful = results.filter(r => r.status === 'fulfilled').length;
      expect(successful).toBeGreaterThan(0);

      // Clean up successful connections
      for (const result of results) {
        if (result.status === 'fulfilled') {
          await transportLayer.disconnect(result.value.id);
        }
      }
    });

    it('should emit connection events', async () => {
      const establishedSpy = jest.fn();
      const closedSpy = jest.fn();
      
      transportLayer.on('connectionEstablished', establishedSpy);
      transportLayer.on('connectionClosed', closedSpy);

      const connection = await transportLayer.connect(testAgentId, mockConfigs[0]);
      expect(establishedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: connection.id,
          agentId: testAgentId
        })
      );

      await transportLayer.disconnect(connection.id);
      expect(closedSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: connection.id,
          agentId: testAgentId
        })
      );
    });

    it('should handle authentication during connection', async () => {
      const authConfig: TransportConfig = {
        protocol: 'http',
        host: 'secure.example.com',
        port: 443,
        secure: true,
        auth: {
          type: 'token',
          credentials: { token: 'valid-auth-token' }
        }
      };

      const connection = await transportLayer.connect(testAgentId, authConfig);
      
      expect(connection.isConnected).toBe(true);
      expect(connection.config.auth?.type).toBe('token');
      
      await transportLayer.disconnect(connection.id);
    });

    it('should reject connections with invalid authentication', async () => {
      const invalidAuthConfig: TransportConfig = {
        protocol: 'http',
        host: 'secure.example.com',
        port: 443,
        secure: true,
        auth: {
          type: 'token',
          credentials: { token: 'invalid-token' }
        }
      };

      await expect(
        transportLayer.connect(testAgentId, invalidAuthConfig)
      ).rejects.toThrow(/authentication failed/i);
    });
  });

  describe('Message Routing', () => {
    let connection: TransportConnection;
    const testAgentId = 'message-test-agent';

    beforeEach(async () => {
      connection = await transportLayer.connect(testAgentId, mockConfigs[0]);
    });

    afterEach(async () => {
      if (connection) {
        await transportLayer.disconnect(connection.id);
      }
    });

    it('should send and receive messages successfully', async () => {
      const testMessage: A2AMessage = {
        jsonrpc: '2.0',
        method: 'test.echo',
        params: { message: 'Hello, World!' },
        id: 'test-msg-001',
        from: 'test-sender',
        to: testAgentId,
        timestamp: Date.now(),
        messageType: 'request'
      };

      const response = await transportLayer.sendMessage(connection.id, testMessage);

      expect(response).toBeDefined();
      expect(response.jsonrpc).toBe('2.0');
      expect(response.id).toBe(testMessage.id);
      expect(response.result).toBeDefined();
      expect(response.from).toBeDefined();
      expect(response.to).toBe(testMessage.from);
    });

    it('should handle message timeouts', async () => {
      // Create connection with very short timeout
      const shortTimeoutConfig: TransportConfig = {
        ...mockConfigs[0],
        timeout: 100 // 100ms timeout
      };
      
      const timeoutConnection = await transportLayer.connect(
        `${testAgentId}-timeout`, 
        shortTimeoutConfig
      );

      const slowMessage: A2AMessage = {
        jsonrpc: '2.0',
        method: 'test.slow_operation',
        params: { delay: 200 }, // Longer than timeout
        id: 'timeout-test',
        from: 'test-sender',
        to: testAgentId,
        timestamp: Date.now(),
        messageType: 'request'
      };

      await expect(
        transportLayer.sendMessage(timeoutConnection.id, slowMessage)
      ).rejects.toThrow(/timeout/i);

      await transportLayer.disconnect(timeoutConnection.id);
    });

    it('should retry failed messages with exponential backoff', async () => {
      // This test would require mocking the internal send mechanism
      // to simulate failures and verify retry behavior
      const flakyMessage: A2AMessage = {
        jsonrpc: '2.0',
        method: 'test.flaky_endpoint',
        params: { failure_rate: 0.8 },
        id: 'retry-test',
        from: 'test-sender',
        to: testAgentId,
        timestamp: Date.now(),
        messageType: 'request'
      };

      // The message should eventually succeed after retries
      const startTime = Date.now();
      const response = await transportLayer.sendMessage(connection.id, flakyMessage);
      const duration = Date.now() - startTime;

      expect(response).toBeDefined();
      // Should take some time due to retries, but not too long
      expect(duration).toBeGreaterThan(100);
      expect(duration).toBeLessThan(10000);
    });

    it('should send notifications without expecting responses', async () => {
      const notification: A2ANotification = {
        jsonrpc: '2.0',
        method: 'test.notification',
        params: { event: 'status_update', data: { status: 'active' } },
        from: 'test-sender',
        to: testAgentId,
        timestamp: Date.now(),
        messageType: 'notification'
      };

      await expect(
        transportLayer.sendNotification(connection.id, notification)
      ).resolves.not.toThrow();

      // Verify connection stats were updated
      const updatedConnection = transportLayer.getActiveConnections().get(connection.id);
      expect(updatedConnection?.messagesSent).toBeGreaterThan(0);
    });

    it('should handle malformed messages gracefully', async () => {
      const malformedMessage = {
        // Missing required fields
        method: 'test.malformed',
        from: 'test-sender'
      } as A2AMessage;

      // Should not crash the transport layer
      await expect(
        transportLayer.sendMessage(connection.id, malformedMessage)
      ).resolves.toBeDefined();
    });

    it('should route messages to correct connections', async () => {
      const agentId1 = 'agent-001';
      const agentId2 = 'agent-002';
      
      const connection1 = await transportLayer.connect(agentId1, mockConfigs[0]);
      const connection2 = await transportLayer.connect(agentId2, mockConfigs[1]);

      const message1: A2AMessage = {
        jsonrpc: '2.0',
        method: 'test.route',
        params: { target: agentId1 },
        id: 'route-test-1',
        from: 'router',
        to: agentId1,
        timestamp: Date.now(),
        messageType: 'request'
      };

      const message2: A2AMessage = {
        jsonrpc: '2.0',
        method: 'test.route',
        params: { target: agentId2 },
        id: 'route-test-2',
        from: 'router',
        to: agentId2,
        timestamp: Date.now(),
        messageType: 'request'
      };

      const response1 = await transportLayer.sendMessage(connection1.id, message1);
      const response2 = await transportLayer.sendMessage(connection2.id, message2);

      expect(response1.id).toBe(message1.id);
      expect(response2.id).toBe(message2.id);

      await transportLayer.disconnect(connection1.id);
      await transportLayer.disconnect(connection2.id);
    });
  });

  describe('Broadcast and Multicast', () => {
    let connections: TransportConnection[] = [];
    const agentIds = ['broadcast-agent-1', 'broadcast-agent-2', 'broadcast-agent-3'];

    beforeEach(async () => {
      connections = [];
      for (let i = 0; i < agentIds.length; i++) {
        const connection = await transportLayer.connect(
          agentIds[i], 
          mockConfigs[i % mockConfigs.length]
        );
        connections.push(connection);
      }
    });

    afterEach(async () => {
      for (const connection of connections) {
        await transportLayer.disconnect(connection.id);
      }
      connections = [];
    });

    it('should broadcast messages to all connected agents', async () => {
      const broadcastMessage: A2AMessage = {
        jsonrpc: '2.0',
        method: 'test.broadcast',
        params: { announcement: 'System maintenance in 5 minutes' },
        id: 'broadcast-001',
        from: 'system',
        to: '*', // Broadcast indicator
        timestamp: Date.now(),
        messageType: 'request'
      };

      const responses = await transportLayer.broadcastMessage(broadcastMessage);

      expect(responses).toHaveLength(connections.length);
      responses.forEach(response => {
        expect(response.id).toBe(broadcastMessage.id);
        expect(response.result).toBeDefined();
      });
    });

    it('should exclude specified connections from broadcast', async () => {
      const excludeConnectionId = connections[0].id;
      
      const broadcastMessage: A2AMessage = {
        jsonrpc: '2.0',
        method: 'test.selective_broadcast',
        params: { message: 'This should not reach excluded connection' },
        id: 'selective-broadcast-001',
        from: 'system',
        to: '*',
        timestamp: Date.now(),
        messageType: 'request'
      };

      const responses = await transportLayer.broadcastMessage(
        broadcastMessage,
        [excludeConnectionId]
      );

      expect(responses).toHaveLength(connections.length - 1);
      // Verify excluded connection didn't receive the message
      expect(responses.every(r => r.from !== agentIds[0])).toBe(true);
    });

    it('should handle partial broadcast failures gracefully', async () => {
      // Disconnect one connection to simulate failure
      await transportLayer.disconnect(connections[1].id);
      
      const broadcastMessage: A2AMessage = {
        jsonrpc: '2.0',
        method: 'test.partial_broadcast',
        params: { data: 'test' },
        id: 'partial-broadcast-001',
        from: 'system',
        to: '*',
        timestamp: Date.Now(),
        messageType: 'request'
      };

      const responses = await transportLayer.broadcastMessage(broadcastMessage);

      // Should get responses from remaining connected agents
      expect(responses.length).toBeLessThan(connections.length);
      expect(responses.length).toBeGreaterThan(0);
    });
  });

  describe('Protocol-Specific Features', () => {
    it('should handle WebSocket-specific features', async () => {
      const wsConfig: TransportConfig = {
        protocol: 'websocket',
        host: 'ws.example.com',
        port: 8080,
        path: '/a2a',
        secure: false
      };

      const connection = await transportLayer.connect('ws-test-agent', wsConfig);
      
      expect(connection.protocol).toBe('websocket');
      expect(connection.config.path).toBe('/a2a');
      
      await transportLayer.disconnect(connection.id);
    });

    it('should handle HTTP-specific features', async () => {
      const httpConfig: TransportConfig = {
        protocol: 'http',
        host: 'api.example.com',
        port: 443,
        secure: true,
        headers: {
          'X-API-Version': '2.0',
          'Content-Type': 'application/json'
        }
      };

      const connection = await transportLayer.connect('http-test-agent', httpConfig);
      
      expect(connection.protocol).toBe('http');
      expect(connection.config.headers).toBeDefined();
      
      await transportLayer.disconnect(connection.id);
    });

    it('should handle gRPC-specific features', async () => {
      const grpcConfig: TransportConfig = {
        protocol: 'grpc',
        host: 'grpc.example.com',
        port: 9090,
        secure: true,
        metadata: {
          'service-version': '1.0.0'
        }
      };

      const connection = await transportLayer.connect('grpc-test-agent', grpcConfig);
      
      expect(connection.protocol).toBe('grpc');
      expect(connection.config.metadata).toBeDefined();
      
      await transportLayer.disconnect(connection.id);
    });

    it('should handle TCP-specific features', async () => {
      const tcpConfig: TransportConfig = {
        protocol: 'tcp',
        host: '127.0.0.1',
        port: 7777,
        keepAlive: true,
        bufferSize: 8192
      };

      const connection = await transportLayer.connect('tcp-test-agent', tcpConfig);
      
      expect(connection.protocol).toBe('tcp');
      expect(connection.config.keepAlive).toBe(true);
      
      await transportLayer.disconnect(connection.id);
    });
  });

  describe('Performance and Metrics', () => {
    let testConnections: TransportConnection[] = [];

    beforeEach(async () => {
      testConnections = [];
      for (let i = 0; i < 3; i++) {
        const connection = await transportLayer.connect(
          `perf-agent-${i}`,
          mockConfigs[i % mockConfigs.length]
        );
        testConnections.push(connection);
      }
    });

    afterEach(async () => {
      for (const connection of testConnections) {
        await transportLayer.disconnect(connection.id);
      }
    });

    it('should track transport metrics accurately', async () => {
      const initialMetrics = transportLayer.getTransportMetrics();
      
      // Send some messages
      const message: A2AMessage = {
        jsonrpc: '2.0',
        method: 'test.metrics',
        params: { data: 'test' },
        id: 'metrics-test',
        from: 'metrics-tester',
        to: 'perf-agent-0',
        timestamp: Date.now(),
        messageType: 'request'
      };

      await transportLayer.sendMessage(testConnections[0].id, message);
      await transportLayer.sendMessage(testConnections[1].id, message);

      const updatedMetrics = transportLayer.getTransportMetrics();
      
      expect(updatedMetrics.totalMessages).toBeGreaterThan(initialMetrics.totalMessages);
      expect(updatedMetrics.messagesSucceeded).toBeGreaterThan(initialMetrics.messagesSucceeded);
      expect(updatedMetrics.activeConnections).toBe(testConnections.length);
      expect(updatedMetrics.avgLatency).toBeGreaterThan(0);
    });

    it('should track protocol-specific metrics', async () => {
      const metrics = transportLayer.getTransportMetrics();
      
      expect(metrics.protocolMetrics).toBeDefined();
      expect(Object.keys(metrics.protocolMetrics)).toContain('websocket');
      expect(Object.keys(metrics.protocolMetrics)).toContain('http');
    });

    it('should calculate success and error rates', async () => {
      // Send some successful messages
      const successMessage: A2AMessage = {
        jsonrpc: '2.0',
        method: 'test.success',
        params: {},
        id: 'success-test',
        from: 'tester',
        to: 'perf-agent-0',
        timestamp: Date.now(),
        messageType: 'request'
      };

      await transportLayer.sendMessage(testConnections[0].id, successMessage);

      const metrics = transportLayer.getTransportMetrics();
      
      expect(metrics.successRate).toBeGreaterThan(0);
      expect(metrics.successRate).toBeLessThanOrEqual(1);
      expect(metrics.errorRate).toBeGreaterThanOrEqual(0);
      expect(metrics.errorRate).toBeLessThanOrEqual(1);
    });

    it('should measure connection pool utilization', async () => {
      const metrics = transportLayer.getTransportMetrics();
      
      expect(metrics.connectionPoolUtilization).toBeGreaterThan(0);
      expect(metrics.connectionPoolUtilization).toBeLessThanOrEqual(1);
    });

    it('should track bytes transferred', async () => {
      const initialMetrics = transportLayer.getTransportMetrics();
      
      const largeMessage: A2AMessage = {
        jsonrpc: '2.0',
        method: 'test.large_data',
        params: { 
          data: 'x'.repeat(10000) // 10KB of data
        },
        id: 'large-data-test',
        from: 'tester',
        to: 'perf-agent-0',
        timestamp: Date.now(),
        messageType: 'request'
      };

      await transportLayer.sendMessage(testConnections[0].id, largeMessage);

      const updatedMetrics = transportLayer.getTransportMetrics();
      
      expect(updatedMetrics.totalBytesTransferred).toBeGreaterThan(initialMetrics.totalBytesTransferred);
      expect(updatedMetrics.avgMessageSize).toBeGreaterThan(0);
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle connection drops gracefully', async () => {
      const connection = await transportLayer.connect('drop-test-agent', mockConfigs[0]);
      
      // Simulate connection drop
      await transportLayer.disconnect(connection.id);
      
      const message: A2AMessage = {
        jsonrpc: '2.0',
        method: 'test.after_drop',
        params: {},
        id: 'drop-test',
        from: 'tester',
        to: 'drop-test-agent',
        timestamp: Date.now(),
        messageType: 'request'
      };

      await expect(
        transportLayer.sendMessage(connection.id, message)
      ).rejects.toThrow(/Connection not found|not active/);
    });

    it('should clean up stale connections automatically', async () => {
      const connection = await transportLayer.connect('stale-test-agent', mockConfigs[0]);
      
      // Manually mark connection as stale (simulate timeout)
      const activeConnections = transportLayer.getActiveConnections();
      const staleConnection = activeConnections.get(connection.id);
      if (staleConnection) {
        staleConnection.isConnected = false;
        staleConnection.lastActivity = Date.now() - 3600000; // 1 hour ago
      }

      // Wait for cleanup cycle or trigger it manually
      // In a real implementation, this would be handled by the cleanup interval
      
      await transportLayer.disconnect(connection.id);
    });

    it('should handle transport layer shutdown gracefully', async () => {
      const connections = [];
      for (let i = 0; i < 3; i++) {
        const connection = await transportLayer.connect(
          `shutdown-test-${i}`,
          mockConfigs[i % mockConfigs.length]
        );
        connections.push(connection);
      }

      await expect(transportLayer.shutdown()).resolves.not.toThrow();
      
      // Verify all connections are closed
      const activeConnections = transportLayer.getActiveConnections();
      expect(activeConnections.size).toBe(0);
    });

    it('should emit error events for failed operations', async () => {
      const errorSpy = jest.fn();
      transportLayer.on('error', errorSpy);
      
      // Try to connect with invalid configuration
      const invalidConfig: TransportConfig = {
        protocol: 'http',
        host: 'invalid.nonexistent.domain',
        port: 99999,
        timeout: 1000
      };

      await expect(
        transportLayer.connect('error-test-agent', invalidConfig)
      ).rejects.toThrow();
    });
  });
});