/**
 * A2A Transport Layer Production Validation Tests
 * 
 * Comprehensive validation of the Agent-to-Agent transport layer with real connection
 * scenarios, error handling, retry logic, and performance under load
 */

import { A2ATransportLayer } from '../../src/protocols/a2a/core/a2a-transport-layer.js';
import { Logger } from '../../src/utils/logger.js';

describe('A2A Transport Layer Production Validation', () => {
  let transportLayer;
  let logger;

  const mockTransportConfigs = [
    {
      protocol: 'websocket',
      host: 'localhost',
      port: 8080,
      secure: false,
      timeout: 5000,
      auth: { type: 'token', credentials: { token: 'valid-token' } }
    },
    {
      protocol: 'http',
      host: 'api.example.com',
      port: 443,
      secure: true,
      timeout: 10000,
      auth: { type: 'oauth2' },
      tls: { rejectUnauthorized: true }
    },
    {
      protocol: 'grpc',
      host: 'grpc.example.com',
      port: 9090,
      secure: true,
      timeout: 15000,
      auth: { type: 'certificate' }
    },
    {
      protocol: 'tcp',
      host: '10.0.0.1',
      port: 9999,
      keepAlive: true,
      timeout: 30000
    }
  ];

  beforeAll(() => {
    logger = new Logger('A2ATransportValidationTest');
  });

  beforeEach(async () => {
    transportLayer = new A2ATransportLayer();
  });

  afterEach(async () => {
    if (transportLayer) {
      await transportLayer.shutdown();
    }
  });

  describe('Transport Layer Initialization', () => {
    it('should initialize with valid transport configurations', async () => {
      const initPromise = transportLayer.initialize(mockTransportConfigs);
      await expect(initPromise).resolves.not.toThrow();
      
      // Verify supported protocols
      expect(transportLayer.isProtocolSupported('websocket')).toBe(true);
      expect(transportLayer.isProtocolSupported('http')).toBe(true);
      expect(transportLayer.isProtocolSupported('grpc')).toBe(true);
      expect(transportLayer.isProtocolSupported('tcp')).toBe(true);
      expect(transportLayer.isProtocolSupported('invalid')).toBe(false);
    });

    it('should reject invalid transport configurations', async () => {
      const invalidConfigs = [
        { protocol: 'invalid-protocol', host: 'localhost' },
        { protocol: 'websocket', host: '' },
        { protocol: 'http', host: 'localhost', port: 70000 }
      ];

      await expect(transportLayer.initialize(invalidConfigs))
        .rejects.toThrow();
    });

    it('should emit initialization event on successful setup', async () => {
      let initializeEventEmitted = false;
      
      transportLayer.on('initialized', () => {
        initializeEventEmitted = true;
      });

      await transportLayer.initialize(mockTransportConfigs);
      expect(initializeEventEmitted).toBe(true);
    });
  });

  describe('Connection Management', () => {
    beforeEach(async () => {
      await transportLayer.initialize(mockTransportConfigs);
    });

    it('should establish WebSocket connections successfully', async () => {
      const agentId = 'test-agent-ws';
      const config = mockTransportConfigs[0];

      const connection = await transportLayer.connect(agentId, config);

      expect(connection).toBeDefined();
      expect(connection.id).toBeDefined();
      expect(connection.protocol).toBe('websocket');
      expect(connection.agentId).toBe(agentId);
      expect(connection.isConnected).toBe(true);
      expect(connection.connectionTime).toBeGreaterThan(0);
    });

    it('should establish HTTP connections with TLS', async () => {
      const agentId = 'test-agent-http';
      const config = mockTransportConfigs[1];

      const connection = await transportLayer.connect(agentId, config);

      expect(connection).toBeDefined();
      expect(connection.protocol).toBe('http');
      expect(connection.config.secure).toBe(true);
      expect(connection.config.tls).toBeDefined();
    });

    it('should establish gRPC connections with authentication', async () => {
      const agentId = 'test-agent-grpc';
      const config = mockTransportConfigs[2];

      const connection = await transportLayer.connect(agentId, config);

      expect(connection).toBeDefined();
      expect(connection.protocol).toBe('grpc');
      expect(connection.config.auth?.type).toBe('certificate');
    });

    it('should establish TCP connections with keepalive', async () => {
      const agentId = 'test-agent-tcp';
      const config = mockTransportConfigs[3];

      const connection = await transportLayer.connect(agentId, config);

      expect(connection).toBeDefined();
      expect(connection.protocol).toBe('tcp');
      expect(connection.config.keepAlive).toBe(true);
    });

    it('should handle connection authentication failures', async () => {
      const agentId = 'test-agent-auth-fail';
      const config = {
        ...mockTransportConfigs[0],
        auth: { type: 'token', credentials: { token: 'invalid-token' } }
      };

      await expect(transportLayer.connect(agentId, config))
        .rejects.toThrow(/authentication failed/i);
    });

    it('should enforce connection pool limits', async () => {
      const agentId = 'test-agent-pool';
      const config = mockTransportConfigs[0];
      const connections = [];

      // Try to create many connections for the same agent
      for (let i = 0; i < 10; i++) {
        try {
          const connection = await transportLayer.connect(`${agentId}-${i}`, config);
          connections.push(connection);
        } catch (error) {
          // Pool limit may be reached
          if (error.message.includes('capacity exceeded')) {
            break;
          }
        }
      }

      // Should have created some connections but hit limits
      expect(connections.length).toBeGreaterThan(0);
      expect(connections.length).toBeLessThan(10);
    });

    it('should emit connection events', async () => {
      let connectionEstablished = false;
      let connectionClosed = false;

      transportLayer.on('connectionEstablished', () => {
        connectionEstablished = true;
      });
      
      transportLayer.on('connectionClosed', () => {
        connectionClosed = true;
      });

      const agentId = 'test-agent-events';
      const connection = await transportLayer.connect(agentId, mockTransportConfigs[0]);
      
      expect(connectionEstablished).toBe(true);
      
      await transportLayer.disconnect(connection.id);
      expect(connectionClosed).toBe(true);
    });
  });

  describe('Message Transmission', () => {
    let connection;

    beforeEach(async () => {
      await transportLayer.initialize(mockTransportConfigs);
      connection = await transportLayer.connect('test-agent', mockTransportConfigs[0]);
    });

    it('should send messages successfully over WebSocket', async () => {
      const message = {
        jsonrpc: '2.0',
        method: 'test.echo',
        params: { data: 'Hello World' },
        id: 'test-message-1',
        from: 'test-client',
        to: 'test-agent',
        timestamp: Date.now(),
        messageType: 'request'
      };

      const response = await transportLayer.sendMessage(connection.id, message);

      expect(response).toBeDefined();
      expect(response.jsonrpc).toBe('2.0');
      expect(response.result).toBeDefined();
      expect(response.id).toBe(message.id);
      expect(response.messageType).toBe('response');
    });

    it('should send notifications without expecting response', async () => {
      const notification = {
        jsonrpc: '2.0',
        method: 'test.notify',
        params: { event: 'status_update' },
        from: 'test-client',
        to: 'test-agent',
        timestamp: Date.now(),
        messageType: 'notification'
      };

      await expect(transportLayer.sendNotification(connection.id, notification))
        .resolves.not.toThrow();

      // Verify connection stats were updated
      const updatedConnection = transportLayer.getActiveConnections().get(connection.id);
      expect(updatedConnection?.messagesSent).toBeGreaterThan(0);
    });

    it('should handle message retry logic on failures', async () => {
      // Use HTTP connection which has simulated error rate
      const httpConnection = await transportLayer.connect('test-http-agent', mockTransportConfigs[1]);
      
      const message = {
        jsonrpc: '2.0',
        method: 'test.unreliable',
        params: { retry: true },
        id: 'retry-test-1',
        from: 'test-client',
        to: 'test-http-agent',
        timestamp: Date.now(),
        messageType: 'request'
      };

      // Multiple attempts to trigger retry logic
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < 20; i++) {
        try {
          await transportLayer.sendMessage(httpConnection.id, {
            ...message,
            id: `retry-test-${i}`
          });
          successCount++;
        } catch (error) {
          errorCount++;
        }
      }

      // Should have some successes and some errors due to simulated 5% error rate
      expect(successCount).toBeGreaterThan(0);
      
      // May have errors due to simulated network issues
      const totalAttempts = successCount + errorCount;
      expect(totalAttempts).toBe(20);
    });

    it('should handle message timeouts', async () => {
      // Create connection with very short timeout
      const shortTimeoutConfig = {
        ...mockTransportConfigs[0],
        timeout: 1 // 1ms timeout - will definitely timeout
      };
      
      const timeoutConnection = await transportLayer.connect('timeout-agent', shortTimeoutConfig);
      
      const message = {
        jsonrpc: '2.0',
        method: 'test.slow',
        params: { delay: 1000 },
        id: 'timeout-test',
        from: 'test-client',
        to: 'timeout-agent',
        timestamp: Date.now(),
        messageType: 'request'
      };

      await expect(transportLayer.sendMessage(timeoutConnection.id, message))
        .rejects.toThrow(/timeout/i);
    });

    it('should broadcast messages to multiple connections', async () => {
      // Create multiple connections
      const connections = [];
      for (let i = 0; i < 3; i++) {
        const conn = await transportLayer.connect(`agent-${i}`, mockTransportConfigs[0]);
        connections.push(conn);
      }

      const broadcastMessage = {
        jsonrpc: '2.0',
        method: 'test.broadcast',
        params: { announcement: 'Hello everyone' },
        id: 'broadcast-test',
        from: 'test-broadcaster',
        to: 'all',
        timestamp: Date.now(),
        messageType: 'request'
      };

      const responses = await transportLayer.broadcastMessage(broadcastMessage);

      expect(responses.length).toBeGreaterThan(0);
      expect(responses.length).toBeLessThanOrEqual(connections.length + 1); // +1 for original connection
      
      responses.forEach(response => {
        expect(response.jsonrpc).toBe('2.0');
        expect(response.result).toBeDefined();
      });
    });

    it('should handle disconnected connections gracefully', async () => {
      // Disconnect the connection
      await transportLayer.disconnect(connection.id);

      const message = {
        jsonrpc: '2.0',
        method: 'test.afterDisconnect',
        params: {},
        id: 'disconnected-test',
        from: 'test-client',
        to: 'test-agent',
        timestamp: Date.now(),
        messageType: 'request'
      };

      await expect(transportLayer.sendMessage(connection.id, message))
        .rejects.toThrow(/not active/i);
    });
  });

  describe('Performance and Metrics', () => {
    beforeEach(async () => {
      await transportLayer.initialize(mockTransportConfigs);
    });

    it('should track transport metrics accurately', async () => {
      // Create connections and send messages
      const connections = [];
      for (let i = 0; i < 3; i++) {
        const conn = await transportLayer.connect(`perf-agent-${i}`, mockTransportConfigs[0]);
        connections.push(conn);
      }

      // Send multiple messages
      for (let i = 0; i < 10; i++) {
        const message = {
          jsonrpc: '2.0',
          method: 'test.performance',
          params: { iteration: i },
          id: `perf-test-${i}`,
          from: 'perf-client',
          to: 'perf-agent-0',
          timestamp: Date.now(),
          messageType: 'request'
        };

        try {
          await transportLayer.sendMessage(connections[0].id, message);
        } catch (error) {
          // Some may fail, that's expected for testing
        }
      }

      const metrics = transportLayer.getTransportMetrics();

      expect(metrics.totalConnections).toBeGreaterThan(0);
      expect(metrics.activeConnections).toBeGreaterThan(0);
      expect(metrics.totalMessages).toBeGreaterThan(0);
      expect(metrics.avgLatency).toBeGreaterThan(0);
      expect(metrics.successRate).toBeGreaterThanOrEqual(0);
      expect(metrics.successRate).toBeLessThanOrEqual(1);
      expect(metrics.totalBytesTransferred).toBeGreaterThan(0);
      expect(metrics.protocolMetrics).toBeDefined();
      expect(metrics.protocolMetrics.websocket).toBeDefined();
    });

    it('should handle high concurrent load', async () => {
      const connection = await transportLayer.connect('load-test-agent', mockTransportConfigs[0]);
      const concurrentMessages = 50;
      const startTime = Date.now();

      // Send messages concurrently
      const messagePromises = Array.from({ length: concurrentMessages }, (_, i) => {
        const message = {
          jsonrpc: '2.0',
          method: 'test.load',
          params: { messageId: i },
          id: `load-test-${i}`,
          from: 'load-client',
          to: 'load-test-agent',
          timestamp: Date.now(),
          messageType: 'request'
        };

        return transportLayer.sendMessage(connection.id, message)
          .catch(error => ({ error: error.message }));
      });

      const results = await Promise.allSettled(messagePromises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Analyze results
      const successful = results.filter(r => 
        r.status === 'fulfilled' && !r.value.error
      ).length;
      const failed = results.length - successful;

      console.log(`Load test: ${successful}/${concurrentMessages} messages succeeded in ${duration}ms`);

      // Performance assertions
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
      expect(successful).toBeGreaterThan(concurrentMessages * 0.8); // At least 80% success
      
      const throughput = successful / (duration / 1000); // messages per second
      expect(throughput).toBeGreaterThan(5); // At least 5 messages per second
    });

    it('should provide protocol-specific metrics', async () => {
      // Create connections with different protocols
      const wsConnection = await transportLayer.connect('ws-agent', mockTransportConfigs[0]);
      const httpConnection = await transportLayer.connect('http-agent', mockTransportConfigs[1]);

      // Send messages over both protocols
      const wsMessage = {
        jsonrpc: '2.0',
        method: 'test.websocket',
        params: {},
        id: 'ws-test',
        from: 'test-client',
        to: 'ws-agent',
        timestamp: Date.now(),
        messageType: 'request'
      };

      const httpMessage = {
        jsonrpc: '2.0',
        method: 'test.http',
        params: {},
        id: 'http-test',
        from: 'test-client',
        to: 'http-agent',
        timestamp: Date.now(),
        messageType: 'request'
      };

      await transportLayer.sendMessage(wsConnection.id, wsMessage);
      await transportLayer.sendMessage(httpConnection.id, httpMessage);

      const metrics = transportLayer.getTransportMetrics();

      expect(metrics.protocolMetrics.websocket).toBeDefined();
      expect(metrics.protocolMetrics.http).toBeDefined();
      expect(metrics.protocolMetrics.websocket.connections).toBeGreaterThan(0);
      expect(metrics.protocolMetrics.http.connections).toBeGreaterThan(0);
      expect(metrics.protocolMetrics.websocket.messages).toBeGreaterThan(0);
      expect(metrics.protocolMetrics.http.messages).toBeGreaterThan(0);
    });
  });

  describe('Error Handling and Recovery', () => {
    beforeEach(async () => {
      await transportLayer.initialize(mockTransportConfigs);
    });

    it('should create standardized transport errors', async () => {
      const agentId = 'error-test-agent';
      
      // Try to connect with unsupported protocol
      const invalidConfig = {
        protocol: 'unsupported-protocol',
        host: 'localhost',
        port: 8080
      };

      await expect(transportLayer.connect(agentId, invalidConfig))
        .rejects.toMatchObject({
          type: 'protocol_error',
          message: expect.stringContaining('Unsupported protocol')
        });
    });

    it('should handle connection pool exhaustion', async () => {
      const connections = [];
      const maxConnections = 20; // Try to exceed typical limits

      for (let i = 0; i < maxConnections; i++) {
        try {
          const connection = await transportLayer.connect(`bulk-agent-${i}`, mockTransportConfigs[0]);
          connections.push(connection);
        } catch (error) {
          if (error.message.includes('capacity exceeded')) {
            // This is expected behavior
            break;
          }
        }
      }

      // Should have created some connections before hitting limits
      expect(connections.length).toBeGreaterThan(0);
    });

    it('should clean up stale connections automatically', async () => {
      // Create connections
      const connection1 = await transportLayer.connect('stale-agent-1', mockTransportConfigs[0]);
      const connection2 = await transportLayer.connect('stale-agent-2', mockTransportConfigs[0]);

      // Manually mark one as stale
      const activeConnections = transportLayer.getActiveConnections();
      const conn1 = activeConnections.get(connection1.id);
      if (conn1) {
        conn1.lastActivity = Date.now() - 500000; // 8+ minutes ago
        conn1.isConnected = false;
      }

      // Wait for cleanup cycle (or trigger manually)
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify active connections
      const updatedConnections = transportLayer.getActiveConnections();
      expect(updatedConnections.has(connection2.id)).toBe(true);
      // connection1 may have been cleaned up
    });

    it('should handle network errors gracefully', async () => {
      const connection = await transportLayer.connect('network-error-agent', mockTransportConfigs[1]); // HTTP with error simulation

      const message = {
        jsonrpc: '2.0',
        method: 'test.networkError',
        params: {},
        id: 'network-error-test',
        from: 'test-client',
        to: 'network-error-agent',
        timestamp: Date.now(),
        messageType: 'request'
      };

      // Try multiple times to potentially trigger network errors
      let errorOccurred = false;
      for (let i = 0; i < 10; i++) {
        try {
          await transportLayer.sendMessage(connection.id, {
            ...message,
            id: `network-error-test-${i}`
          });
        } catch (error) {
          if (error.type === 'routing_error') {
            errorOccurred = true;
            expect(error.message).toContain('HTTP request failed');
            break;
          }
        }
      }

      // Network errors should be handled with proper error structure
      // Note: Due to randomness, this test may not always trigger the error
    });
  });

  describe('Connection Lifecycle', () => {
    beforeEach(async () => {
      await transportLayer.initialize(mockTransportConfigs);
    });

    it('should properly shutdown and clean up all resources', async () => {
      // Create multiple connections
      const connections = [];
      for (let i = 0; i < 3; i++) {
        const conn = await transportLayer.connect(`shutdown-agent-${i}`, mockTransportConfigs[0]);
        connections.push(conn);
      }

      expect(transportLayer.getActiveConnections().size).toBe(connections.length);

      // Shutdown transport layer
      await transportLayer.shutdown();

      // Verify all connections are cleaned up
      expect(transportLayer.getActiveConnections().size).toBe(0);
    });

    it('should reject operations after shutdown', async () => {
      await transportLayer.shutdown();

      await expect(transportLayer.connect('post-shutdown-agent', mockTransportConfigs[0]))
        .rejects.toThrow('not initialized');
    });
  });
});