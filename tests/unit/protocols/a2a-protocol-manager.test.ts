/**
 * A2A Protocol Manager Tests
 * 
 * Comprehensive test suite for A2AProtocolManager with JSON-RPC 2.0 support
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  A2AMessage,
  A2AResponse,
  A2ANotification,
  AgentCard,
  AgentId,
  A2AProtocolConfig,
  TransportProtocol,
  MessagePriority,
  A2AErrorType
} from '../../../src/types/a2a';

// Mock implementation will be created later
class A2AProtocolManager {
  constructor(config: A2AProtocolConfig) {}
  async initialize(): Promise<void> {}
  async shutdown(): Promise<void> {}
  async sendMessage(message: A2AMessage): Promise<A2AResponse> { return {} as A2AResponse; }
  async sendNotification(notification: A2ANotification): Promise<void> {}
  async registerMessageHandler(method: string, handler: Function): Promise<void> {}
  async unregisterMessageHandler(method: string): Promise<void> {}
  getAgentCard(): AgentCard { return {} as AgentCard; }
  getMetrics(): any { return {}; }
}

describe('A2AProtocolManager', () => {
  let protocolManager: A2AProtocolManager;
  let mockConfig: A2AProtocolConfig;
  let mockAgentCard: AgentCard;

  beforeEach(() => {
    // Create mock agent card
    mockAgentCard = {
      id: 'test-agent-001',
      name: 'Test Agent',
      description: 'A test agent for unit testing',
      version: '1.0.0',
      capabilities: [
        {
          name: 'text-processing',
          version: '1.0.0',
          description: 'Advanced text processing capabilities',
          parameters: [
            {
              name: 'maxLength',
              type: 'number',
              required: false,
              default: 1000,
              description: 'Maximum text length to process'
            }
          ]
        },
        {
          name: 'data-analysis',
          version: '2.1.0',
          description: 'Statistical data analysis',
          resources: {
            cpu: 2,
            memory: 512,
            network: 10
          }
        }
      ],
      services: [
        {
          name: 'processText',
          method: 'text.process',
          description: 'Process and analyze text content',
          params: [
            {
              name: 'text',
              type: 'string',
              required: true,
              description: 'Text content to process'
            },
            {
              name: 'options',
              type: 'object',
              required: false,
              description: 'Processing options'
            }
          ],
          returns: {
            type: 'object',
            description: 'Processing results',
            schema: {
              type: 'object',
              properties: {
                processed: { type: 'string' },
                metrics: { type: 'object' }
              }
            }
          },
          cost: 5,
          latency: 100,
          reliability: 0.98
        }
      ],
      endpoints: [
        {
          protocol: 'websocket',
          address: 'localhost',
          port: 8080,
          path: '/a2a',
          secure: false,
          maxConnections: 100,
          capabilities: ['json-rpc-2.0', 'binary-data']
        },
        {
          protocol: 'http',
          address: 'localhost',
          port: 8081,
          path: '/api/a2a',
          secure: true,
          capabilities: ['json-rpc-2.0', 'rest-fallback']
        }
      ],
      metadata: {
        type: 'specialist',
        status: 'idle',
        load: 0.15,
        created: Date.now() - 86400000, // 24 hours ago
        lastSeen: Date.now() - 1000, // 1 second ago
        metrics: {
          responseTime: {
            avg: 85,
            p50: 70,
            p95: 150,
            p99: 300
          },
          requestsPerSecond: 12.5,
          messagesProcessed: 1247,
          cpuUsage: 0.25,
          memoryUsage: 0.40,
          networkUsage: 1024000, // 1MB/s
          successRate: 0.98,
          errorRate: 0.02,
          uptime: 99.5
        },
        publicKey: 'mock-public-key-123',
        trustLevel: 'verified'
      }
    };

    // Create mock configuration
    mockConfig = {
      agentId: 'test-agent-001',
      agentCard: mockAgentCard,
      transports: [
        {
          protocol: 'websocket',
          host: 'localhost',
          port: 8080,
          path: '/a2a',
          secure: false,
          timeout: 30000,
          keepAlive: true,
          compression: true
        },
        {
          protocol: 'http',
          host: 'localhost',
          port: 8081,
          path: '/api/a2a',
          secure: true,
          timeout: 15000,
          auth: {
            type: 'token',
            credentials: { token: 'mock-auth-token' }
          }
        }
      ],
      defaultTransport: 'websocket',
      routingStrategy: 'capability_aware',
      maxHops: 5,
      discoveryEnabled: true,
      discoveryInterval: 30000,
      securityEnabled: true,
      trustedAgents: ['trusted-agent-001', 'trusted-agent-002'],
      messageTimeout: 30000,
      maxConcurrentMessages: 100,
      retryPolicy: {
        maxAttempts: 3,
        backoffStrategy: 'exponential',
        baseDelay: 1000,
        maxDelay: 30000,
        jitter: true
      }
    };

    protocolManager = new A2AProtocolManager(mockConfig);
  });

  afterEach(async () => {
    await protocolManager.shutdown();
    jest.clearAllMocks();
  });

  describe('Initialization and Configuration', () => {
    it('should initialize with valid configuration', async () => {
      await expect(protocolManager.initialize()).resolves.not.toThrow();
    });

    it('should throw error with invalid configuration', async () => {
      const invalidConfig = { ...mockConfig, agentId: '' };
      const invalidManager = new A2AProtocolManager(invalidConfig);
      
      await expect(invalidManager.initialize()).rejects.toThrow('Invalid agent ID');
    });

    it('should return correct agent card', () => {
      const agentCard = protocolManager.getAgentCard();
      expect(agentCard.id).toBe('test-agent-001');
      expect(agentCard.name).toBe('Test Agent');
      expect(agentCard.capabilities).toHaveLength(2);
      expect(agentCard.services).toHaveLength(1);
      expect(agentCard.endpoints).toHaveLength(2);
    });

    it('should handle graceful shutdown', async () => {
      await protocolManager.initialize();
      await expect(protocolManager.shutdown()).resolves.not.toThrow();
    });
  });

  describe('JSON-RPC 2.0 Message Handling', () => {
    beforeEach(async () => {
      await protocolManager.initialize();
    });

    it('should send valid JSON-RPC 2.0 request message', async () => {
      const message: A2AMessage = {
        jsonrpc: '2.0',
        method: 'text.process',
        params: {
          text: 'Hello, world!',
          options: { analyze: true }
        },
        id: 'req-001',
        from: 'test-agent-001',
        to: 'target-agent-001',
        timestamp: Date.now(),
        messageType: 'request',
        priority: 'normal'
      };

      const response = await protocolManager.sendMessage(message);
      
      expect(response.jsonrpc).toBe('2.0');
      expect(response.id).toBe('req-001');
      expect(response.from).toBe('target-agent-001');
      expect(response.to).toBe('test-agent-001');
    });

    it('should send JSON-RPC 2.0 notification', async () => {
      const notification: A2ANotification = {
        jsonrpc: '2.0',
        method: 'agent.heartbeat',
        params: {
          status: 'idle',
          load: 0.15,
          timestamp: Date.now()
        },
        from: 'test-agent-001',
        to: 'broadcast',
        timestamp: Date.now(),
        messageType: 'notification'
      };

      await expect(protocolManager.sendNotification(notification)).resolves.not.toThrow();
    });

    it('should handle request with array parameters', async () => {
      const message: A2AMessage = {
        jsonrpc: '2.0',
        method: 'batch.process',
        params: ['item1', 'item2', 'item3'],
        id: 'req-002',
        from: 'test-agent-001',
        to: 'batch-agent-001',
        timestamp: Date.now(),
        messageType: 'request'
      };

      const response = await protocolManager.sendMessage(message);
      expect(response.jsonrpc).toBe('2.0');
      expect(response.id).toBe('req-002');
    });

    it('should handle message without id (notification)', async () => {
      const notification: A2AMessage = {
        jsonrpc: '2.0',
        method: 'status.update',
        params: { status: 'busy' },
        from: 'test-agent-001',
        to: 'monitor-agent-001',
        timestamp: Date.now(),
        messageType: 'notification'
      };

      // Should not expect a response for notifications
      await expect(protocolManager.sendNotification(notification as A2ANotification)).resolves.not.toThrow();
    });
  });

  describe('Message Priority and Routing', () => {
    beforeEach(async () => {
      await protocolManager.initialize();
    });

    it('should handle high priority messages first', async () => {
      const normalMessage: A2AMessage = {
        jsonrpc: '2.0',
        method: 'process.normal',
        params: {},
        id: 'normal-001',
        from: 'test-agent-001',
        to: 'target-agent-001',
        timestamp: Date.now(),
        messageType: 'request',
        priority: 'normal'
      };

      const highPriorityMessage: A2AMessage = {
        jsonrpc: '2.0',
        method: 'process.urgent',
        params: {},
        id: 'urgent-001',
        from: 'test-agent-001',
        to: 'target-agent-001',
        timestamp: Date.now(),
        messageType: 'request',
        priority: 'high'
      };

      // Send both messages
      const [normalResponse, urgentResponse] = await Promise.all([
        protocolManager.sendMessage(normalMessage),
        protocolManager.sendMessage(highPriorityMessage)
      ]);

      expect(normalResponse.id).toBe('normal-001');
      expect(urgentResponse.id).toBe('urgent-001');
    });

    it('should support broadcast messages', async () => {
      const broadcastMessage: A2AMessage = {
        jsonrpc: '2.0',
        method: 'system.announcement',
        params: { message: 'System maintenance in 5 minutes' },
        id: 'broadcast-001',
        from: 'test-agent-001',
        to: 'broadcast',
        timestamp: Date.now(),
        messageType: 'request'
      };

      const response = await protocolManager.sendMessage(broadcastMessage);
      expect(response.id).toBe('broadcast-001');
    });

    it('should support multi-agent targeting', async () => {
      const multiMessage: A2AMessage = {
        jsonrpc: '2.0',
        method: 'coordinate.task',
        params: { taskId: 'task-001' },
        id: 'multi-001',
        from: 'test-agent-001',
        to: ['agent-001', 'agent-002', 'agent-003'],
        timestamp: Date.now(),
        messageType: 'request',
        route: {
          path: ['test-agent-001'],
          hops: 0,
          maxHops: 3,
          strategy: 'load_balanced'
        }
      };

      const response = await protocolManager.sendMessage(multiMessage);
      expect(response.id).toBe('multi-001');
    });
  });

  describe('Message Handler Registration', () => {
    beforeEach(async () => {
      await protocolManager.initialize();
    });

    it('should register message handler', async () => {
      const handler = jest.fn();
      
      await expect(protocolManager.registerMessageHandler('test.method', handler))
        .resolves.not.toThrow();
    });

    it('should unregister message handler', async () => {
      const handler = jest.fn();
      
      await protocolManager.registerMessageHandler('test.method', handler);
      await expect(protocolManager.unregisterMessageHandler('test.method'))
        .resolves.not.toThrow();
    });

    it('should throw error when registering duplicate handler', async () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      await protocolManager.registerMessageHandler('test.method', handler1);
      
      await expect(protocolManager.registerMessageHandler('test.method', handler2))
        .rejects.toThrow('Handler already registered for method: test.method');
    });

    it('should throw error when unregistering non-existent handler', async () => {
      await expect(protocolManager.unregisterMessageHandler('non.existent'))
        .rejects.toThrow('No handler registered for method: non.existent');
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await protocolManager.initialize();
    });

    it('should handle timeout errors', async () => {
      const message: A2AMessage = {
        jsonrpc: '2.0',
        method: 'slow.operation',
        params: {},
        id: 'timeout-001',
        from: 'test-agent-001',
        to: 'slow-agent-001',
        timestamp: Date.now(),
        messageType: 'request',
        context: {
          timeout: 100 // Very short timeout
        }
      };

      await expect(protocolManager.sendMessage(message))
        .rejects.toMatchObject({
          code: -32000,
          message: expect.stringContaining('timeout'),
          type: 'timeout_error'
        });
    });

    it('should handle agent unavailable errors', async () => {
      const message: A2AMessage = {
        jsonrpc: '2.0',
        method: 'test.method',
        params: {},
        id: 'unavailable-001',
        from: 'test-agent-001',
        to: 'non-existent-agent',
        timestamp: Date.now(),
        messageType: 'request'
      };

      await expect(protocolManager.sendMessage(message))
        .rejects.toMatchObject({
          code: -32001,
          message: 'Agent unavailable: non-existent-agent',
          type: 'agent_unavailable'
        });
    });

    it('should handle protocol validation errors', async () => {
      const invalidMessage = {
        // Missing jsonrpc field
        method: 'test.method',
        params: {},
        id: 'invalid-001',
        from: 'test-agent-001',
        to: 'target-agent-001',
        timestamp: Date.now(),
        messageType: 'request'
      } as A2AMessage;

      await expect(protocolManager.sendMessage(invalidMessage))
        .rejects.toMatchObject({
          code: -32600,
          message: 'Invalid Request',
          type: 'protocol_error'
        });
    });

    it('should implement retry mechanism with exponential backoff', async () => {
      const failingMessage: A2AMessage = {
        jsonrpc: '2.0',
        method: 'flaky.service',
        params: {},
        id: 'retry-001',
        from: 'test-agent-001',
        to: 'flaky-agent-001',
        timestamp: Date.now(),
        messageType: 'request',
        context: {
          retryPolicy: {
            maxAttempts: 3,
            backoffStrategy: 'exponential',
            baseDelay: 100,
            maxDelay: 5000,
            jitter: false
          }
        }
      };

      // Should attempt retries before final failure
      const startTime = Date.now();
      await expect(protocolManager.sendMessage(failingMessage)).rejects.toThrow();
      const endTime = Date.now();
      
      // Should have taken time for retries (100ms + 200ms + 400ms + processing time)
      expect(endTime - startTime).toBeGreaterThan(600);
    });
  });

  describe('Security and Authentication', () => {
    beforeEach(async () => {
      await protocolManager.initialize();
    });

    it('should validate message signatures when security is enabled', async () => {
      const signedMessage: A2AMessage = {
        jsonrpc: '2.0',
        method: 'secure.operation',
        params: {},
        id: 'secure-001',
        from: 'test-agent-001',
        to: 'secure-agent-001',
        timestamp: Date.now(),
        messageType: 'request',
        signature: 'mock-signature-hash',
        nonce: 'random-nonce-123'
      };

      // Should validate signature and accept message
      const response = await protocolManager.sendMessage(signedMessage);
      expect(response.id).toBe('secure-001');
    });

    it('should reject messages with invalid signatures', async () => {
      const invalidSignedMessage: A2AMessage = {
        jsonrpc: '2.0',
        method: 'secure.operation',
        params: {},
        id: 'invalid-sig-001',
        from: 'test-agent-001',
        to: 'secure-agent-001',
        timestamp: Date.now(),
        messageType: 'request',
        signature: 'invalid-signature',
        nonce: 'random-nonce-123'
      };

      await expect(protocolManager.sendMessage(invalidSignedMessage))
        .rejects.toMatchObject({
          code: -32002,
          message: 'Authentication failed',
          type: 'authentication_error'
        });
    });

    it('should reject messages from untrusted agents', async () => {
      const untrustedMessage: A2AMessage = {
        jsonrpc: '2.0',
        method: 'secure.operation',
        params: {},
        id: 'untrusted-001',
        from: 'untrusted-agent-999',
        to: 'test-agent-001',
        timestamp: Date.now(),
        messageType: 'request'
      };

      await expect(protocolManager.sendMessage(untrustedMessage))
        .rejects.toMatchObject({
          code: -32003,
          message: 'Agent not trusted: untrusted-agent-999',
          type: 'authorization_error'
        });
    });
  });

  describe('Performance Metrics', () => {
    beforeEach(async () => {
      await protocolManager.initialize();
    });

    it('should track message processing metrics', async () => {
      const message: A2AMessage = {
        jsonrpc: '2.0',
        method: 'test.metric',
        params: {},
        id: 'metric-001',
        from: 'test-agent-001',
        to: 'target-agent-001',
        timestamp: Date.now(),
        messageType: 'request'
      };

      await protocolManager.sendMessage(message);
      
      const metrics = protocolManager.getMetrics();
      expect(metrics.messagesProcessed).toBeGreaterThanOrEqual(1);
      expect(metrics.avgResponseTime).toBeGreaterThan(0);
      expect(metrics.successRate).toBeGreaterThan(0);
    });

    it('should track error rates', async () => {
      // Send a message that will fail
      const failingMessage: A2AMessage = {
        jsonrpc: '2.0',
        method: 'non.existent',
        params: {},
        id: 'fail-001',
        from: 'test-agent-001',
        to: 'non-existent-agent',
        timestamp: Date.now(),
        messageType: 'request'
      };

      try {
        await protocolManager.sendMessage(failingMessage);
      } catch (error) {
        // Expected to fail
      }

      const metrics = protocolManager.getMetrics();
      expect(metrics.errorRate).toBeGreaterThan(0);
    });

    it('should provide detailed performance statistics', () => {
      const metrics = protocolManager.getMetrics();
      
      expect(metrics).toHaveProperty('messagesProcessed');
      expect(metrics).toHaveProperty('avgResponseTime');
      expect(metrics).toHaveProperty('p95ResponseTime');
      expect(metrics).toHaveProperty('p99ResponseTime');
      expect(metrics).toHaveProperty('successRate');
      expect(metrics).toHaveProperty('errorRate');
      expect(metrics).toHaveProperty('throughput');
      expect(metrics).toHaveProperty('concurrentConnections');
    });
  });

  describe('Message Context and Correlation', () => {
    beforeEach(async () => {
      await protocolManager.initialize();
    });

    it('should handle workflow coordination context', async () => {
      const workflowMessage: A2AMessage = {
        jsonrpc: '2.0',
        method: 'workflow.step',
        params: { stepId: 'step-001' },
        id: 'workflow-001',
        from: 'test-agent-001',
        to: 'worker-agent-001',
        timestamp: Date.now(),
        messageType: 'request',
        context: {
          workflowId: 'wf-12345',
          sessionId: 'session-67890',
          correlationId: 'corr-abcdef',
          parentMessageId: 'parent-msg-001'
        }
      };

      const response = await protocolManager.sendMessage(workflowMessage);
      expect(response.id).toBe('workflow-001');
    });

    it('should support message correlation chains', async () => {
      const parentMessage: A2AMessage = {
        jsonrpc: '2.0',
        method: 'parent.operation',
        params: {},
        id: 'parent-001',
        from: 'test-agent-001',
        to: 'child-agent-001',
        timestamp: Date.now(),
        messageType: 'request',
        context: {
          correlationId: 'chain-001'
        }
      };

      const childMessage: A2AMessage = {
        jsonrpc: '2.0',
        method: 'child.operation',
        params: {},
        id: 'child-001',
        from: 'test-agent-001',
        to: 'grandchild-agent-001',
        timestamp: Date.now(),
        messageType: 'request',
        context: {
          correlationId: 'chain-001',
          parentMessageId: 'parent-001'
        }
      };

      const [parentResponse, childResponse] = await Promise.all([
        protocolManager.sendMessage(parentMessage),
        protocolManager.sendMessage(childMessage)
      ]);

      expect(parentResponse.id).toBe('parent-001');
      expect(childResponse.id).toBe('child-001');
    });
  });
});