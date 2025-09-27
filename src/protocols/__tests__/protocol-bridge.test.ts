/**
 * Universal Protocol Bridge Tests
 * 
 * Tests for the main protocol bridge that orchestrates MCP, A2A, and A2P interactions
 */

import { UniversalProtocolBridge, ProtocolBridgeConfig } from "../bridge/protocol-bridge.js";
import { ProtocolPerformanceMonitor } from "../bridge/performance-monitor.js";
import { A2AMessage, PaymentMandate, A2PConfig } from "../../types/a2a.js";
import { MCPRequest } from "../../types/mcp.js";

// Mock dependencies
jest.mock("../../utils/logger.js", () => ({
  Logger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

jest.mock("../a2a/core/a2a-mcp-bridge.js", () => ({
  A2AMCPBridge: jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(undefined),
    shutdown: jest.fn().mockResolvedValue(undefined),
    isPaymentEnabled: jest.fn().mockReturnValue(true),
    translateMCPToA2A: jest.fn().mockResolvedValue({
      jsonrpc: "2.0",
      method: "test-method",
      params: {},
      id: "test-id",
      from: "mcp-bridge",
      to: "test-agent",
      timestamp: Date.now(),
      messageType: "request",
    }),
    translateA2AToMCP: jest.fn().mockResolvedValue({
      id: "test-mcp-id",
      prompt: "translated prompt",
    }),
    processPayment: jest.fn().mockResolvedValue({
      transactionId: "tx_12345",
      status: "completed",
      latency: 100,
      consensusProof: "consensus_proof_12345",
    }),
    getBridgeMetrics: jest.fn().mockReturnValue({
      totalTranslations: 10,
      avgTranslationTime: 50,
      successRate: 1.0,
    }),
  })),
}));

jest.mock("../../services/quantum-classical-hybrid.js", () => ({
  QuantumClassicalHybridService: jest.fn().mockImplementation(() => ({
    optimizePortfolio: jest.fn().mockResolvedValue({
      optimality: 0.95,
      processingTime: 1000,
    }),
  })),
}));

describe('UniversalProtocolBridge', () => {
  let bridge: UniversalProtocolBridge;
  let config: ProtocolBridgeConfig;

  beforeEach(() => {
    config = {
      a2aConfig: {
        agentId: "test-bridge-agent",
        agentCard: {
          id: "test-bridge-agent",
          name: "Test Bridge Agent",
          description: "Test agent for protocol bridge",
          version: "1.0.0",
          capabilities: [],
          services: [],
          endpoints: [],
          metadata: {
            type: "coordinator",
            status: "active",
            load: 0.1,
            created: Date.now(),
            lastSeen: Date.now(),
          },
        },
        transports: [],
        defaultTransport: "websocket",
        routingStrategy: "direct",
        maxHops: 5,
        discoveryEnabled: false,
        discoveryInterval: 30000,
        securityEnabled: true,
        messageTimeout: 10000,
        maxConcurrentMessages: 100,
        retryPolicy: {
          maxRetries: 3,
          backoffFactor: 2,
          initialDelay: 1000,
        },
      },
      a2pConfig: {
        quantum: {
          pennylane: "test-pennylane",
          qiskit: "test-qiskit",
        },
        database: "test-db",
        validators: 21,
        faultTolerance: 0.33,
      },
      enableQuantumOptimization: true,
      performanceTargets: {
        maxTranslationLatency: 100,
        maxPaymentLatency: 500,
        targetThroughput: 1000,
      },
    };

    bridge = new UniversalProtocolBridge(config);
  });

  afterEach(async () => {
    if (bridge) {
      await bridge.shutdown();
    }
  });

  describe('Initialization', () => {
    it('should initialize successfully with all components', async () => {
      await expect(bridge.initialize()).resolves.not.toThrow();
    });

    it('should initialize without quantum optimization when disabled', async () => {
      const configNoQuantum = {
        ...config,
        enableQuantumOptimization: false,
      };
      
      const bridgeNoQuantum = new UniversalProtocolBridge(configNoQuantum);
      await expect(bridgeNoQuantum.initialize()).resolves.not.toThrow();
      await bridgeNoQuantum.shutdown();
    });
  });

  describe('Protocol Translation', () => {
    beforeEach(async () => {
      await bridge.initialize();
    });

    it('should translate MCP request to A2A response', async () => {
      const mcpRequest: MCPRequest = {
        id: "mcp-test-1",
        prompt: "Test MCP prompt",
        temperature: 0.7,
      };

      const response = await bridge.processRequest(mcpRequest);

      expect(response).toBeDefined();
      expect(response.id).toBeTruthy();
      expect('result' in response).toBe(true); // A2A response has result field
    });

    it('should translate A2A message to MCP response', async () => {
      const a2aMessage: A2AMessage = {
        jsonrpc: "2.0",
        method: "test-method",
        params: { query: "test query" },
        id: "a2a-test-1",
        from: "test-agent",
        to: "bridge-agent",
        timestamp: Date.now(),
        messageType: "request",
      };

      const response = await bridge.processRequest(a2aMessage);

      expect(response).toBeDefined();
      expect(response.id).toBeTruthy();
      expect('content' in response).toBe(true); // MCP response has content field
    });

    it('should maintain sub-100ms translation latency', async () => {
      const mcpRequest: MCPRequest = {
        id: "perf-test-1",
        prompt: "Performance test prompt",
      };

      const startTime = performance.now();
      await bridge.processRequest(mcpRequest);
      const latency = performance.now() - startTime;

      expect(latency).toBeLessThan(100);
    });
  });

  describe('Payment Processing', () => {
    beforeEach(async () => {
      await bridge.initialize();
    });

    it('should process payment successfully', async () => {
      const mandate: PaymentMandate = {
        id: "payment-test-1",
        amount: 100,
        currency: "USD",
        sender: "sender-agent",
        receiver: "receiver-agent",
        purpose: "test payment",
      };

      const result = await bridge.processPayment(mandate);

      expect(result.status).toBe("completed");
      expect(result.transactionId).toMatch(/^tx_/);
      expect(result.latency).toBeLessThan(500);
    });

    it('should apply quantum optimization for high-value payments', async () => {
      const highValueMandate: PaymentMandate = {
        id: "quantum-payment-test",
        amount: 5000, // High value to trigger quantum optimization
        currency: "USD",
        sender: "quantum-sender",
        receiver: "quantum-receiver",
        purpose: "quantum-optimized payment",
        maxFee: 25,
      };

      const result = await bridge.processPayment(highValueMandate);

      expect(result.status).toBe("completed");
      expect(result.quantumOptimized).toBe(true);
    });

    it('should maintain sub-500ms payment latency', async () => {
      const mandate: PaymentMandate = {
        id: "payment-perf-test",
        amount: 200,
        currency: "USD",
        sender: "perf-sender",
        receiver: "perf-receiver",
        purpose: "payment performance test",
      };

      const startTime = performance.now();
      const result = await bridge.processPayment(mandate);
      const actualLatency = performance.now() - startTime;

      expect(actualLatency).toBeLessThan(500);
      expect(result.latency).toBeLessThan(500);
    });
  });

  describe('Caching System', () => {
    beforeEach(async () => {
      await bridge.initialize();
    });

    it('should cache translation results for improved performance', async () => {
      const mcpRequest: MCPRequest = {
        id: "cache-test-1",
        prompt: "Cacheable prompt",
      };

      // First request - should miss cache
      const start1 = performance.now();
      const response1 = await bridge.processRequest(mcpRequest);
      const latency1 = performance.now() - start1;

      // Second identical request - should hit cache
      const start2 = performance.now();
      const response2 = await bridge.processRequest(mcpRequest);
      const latency2 = performance.now() - start2;

      // Cache hit should be faster
      expect(latency2).toBeLessThan(latency1);
      expect(response1.id).toBe(response2.id);
    });

    it('should handle cache cleanup properly', async () => {
      // Make multiple requests to populate cache
      const requests = Array.from({ length: 20 }, (_, i) => ({
        id: `cache-cleanup-${i}`,
        prompt: `Cache cleanup test ${i}`,
      }));

      for (const request of requests) {
        await bridge.processRequest(request);
      }

      const metrics = bridge.getMetrics();
      expect(metrics.cache.size).toBeGreaterThan(0);
    });
  });

  describe('Performance Monitoring', () => {
    beforeEach(async () => {
      await bridge.initialize();
    });

    it('should collect comprehensive metrics', async () => {
      // Perform some operations to generate metrics
      const mcpRequest: MCPRequest = {
        id: "metrics-test",
        prompt: "Metrics collection test",
      };

      await bridge.processRequest(mcpRequest);

      const mandate: PaymentMandate = {
        id: "metrics-payment-test",
        amount: 50,
        currency: "USD",
        sender: "metrics-sender",
        receiver: "metrics-receiver",
        purpose: "metrics test",
      };

      await bridge.processPayment(mandate);

      const metrics = bridge.getMetrics();

      expect(metrics.bridge).toBeDefined();
      expect(metrics.cache).toBeDefined();
      expect(metrics.quantum).toBeDefined();
      expect(metrics.performance).toBeDefined();

      expect(metrics.performance.totalRequests).toBeGreaterThan(0);
      expect(metrics.cache.hits + metrics.cache.misses).toBeGreaterThan(0);
    });

    it('should track throughput correctly', async () => {
      const requests = Array.from({ length: 10 }, (_, i) => ({
        id: `throughput-test-${i}`,
        prompt: `Throughput test ${i}`,
      }));

      const startTime = Date.now();
      
      for (const request of requests) {
        await bridge.processRequest(request);
      }

      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000; // seconds
      const throughput = requests.length / duration;

      expect(throughput).toBeGreaterThan(1); // Should handle at least 1 req/sec
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await bridge.initialize();
    });

    it('should handle invalid requests gracefully', async () => {
      const invalidRequest = {} as MCPRequest;

      await expect(bridge.processRequest(invalidRequest))
        .rejects.toThrow();
    });

    it('should handle payment processing errors gracefully', async () => {
      const invalidMandate = {
        id: "invalid-payment",
        amount: -100, // Invalid negative amount
        currency: "",
        sender: "",
        receiver: "",
        purpose: "",
      } as PaymentMandate;

      await expect(bridge.processPayment(invalidMandate))
        .rejects.toThrow();
    });

    it('should gracefully handle quantum optimization failures', async () => {
      // Mock quantum service to throw error
      const quantumService = bridge['quantumService'];
      if (quantumService) {
        jest.spyOn(quantumService, 'optimizePortfolio')
          .mockRejectedValueOnce(new Error('Quantum optimization failed'));
      }

      const mandate: PaymentMandate = {
        id: "quantum-error-test",
        amount: 2000, // High enough to trigger quantum optimization
        currency: "USD",
        sender: "error-sender",
        receiver: "error-receiver",
        purpose: "quantum error test",
      };

      // Should still complete payment without quantum optimization
      const result = await bridge.processPayment(mandate);
      expect(result.status).toBe("completed");
    });
  });

  describe('Shutdown', () => {
    it('should shutdown cleanly', async () => {
      await bridge.initialize();
      await expect(bridge.shutdown()).resolves.not.toThrow();
    });
  });
});

describe('ProtocolPerformanceMonitor', () => {
  let monitor: ProtocolPerformanceMonitor;

  beforeEach(() => {
    monitor = new ProtocolPerformanceMonitor();
  });

  describe('Metrics Recording', () => {
    it('should record translation latency correctly', () => {
      monitor.recordTranslationLatency(50, "MCP", "A2A");
      monitor.recordTranslationLatency(75, "A2A", "MCP");

      const metrics = monitor.getMetrics();
      expect(metrics.translationLatency.count).toBe(2);
      expect(metrics.translationLatency.sum).toBe(125);
      expect(metrics.translationLatency.min).toBe(50);
      expect(metrics.translationLatency.max).toBe(75);
    });

    it('should record protocol requests by type', () => {
      monitor.recordProtocolRequest("MCP", "success");
      monitor.recordProtocolRequest("A2A", "success");
      monitor.recordProtocolRequest("MCP", "error");

      const metrics = monitor.getMetrics();
      expect(metrics.protocolRequests.total).toBe(3);
      expect(metrics.protocolRequests.byProtocol["MCP"]).toBe(2);
      expect(metrics.protocolRequests.byProtocol["A2A"]).toBe(1);
      expect(metrics.protocolRequests.byStatus["success"]).toBe(2);
      expect(metrics.protocolRequests.byStatus["error"]).toBe(1);
    });

    it('should record payment volume correctly', () => {
      monitor.recordPaymentVolume(100, "USD", "completed");
      monitor.recordPaymentVolume(50, "EUR", "completed");
      monitor.recordPaymentVolume(25, "USD", "failed");

      const metrics = monitor.getMetrics();
      expect(metrics.paymentVolume.totalUSD).toBe(175);
      expect(metrics.paymentVolume.byCurrency["USD"]).toBe(125);
      expect(metrics.paymentVolume.byCurrency["EUR"]).toBe(50);
    });
  });

  describe('Prometheus Metrics', () => {
    it('should generate Prometheus-compatible metrics', () => {
      monitor.recordTranslationLatency(100, "MCP", "A2A");
      monitor.recordProtocolRequest("MCP", "success");
      monitor.recordPaymentVolume(500, "USD", "completed");

      const prometheus = monitor.getPrometheusMetrics();

      expect(prometheus).toContain('protocol_translation_latency_ms');
      expect(prometheus).toContain('protocol_requests_total');
      expect(prometheus).toContain('payment_volume_usd');
      expect(prometheus).toContain('cache_hit_rate');
      expect(prometheus).toContain('sqlite_operations_per_second');
    });
  });

  describe('Alert System', () => {
    it('should emit alerts for high latency', (done) => {
      monitor.on('latency-alert', (alert) => {
        expect(alert.type).toBe('translation');
        expect(alert.latency).toBe(200);
        expect(alert.threshold).toBe(100);
        done();
      });

      monitor.recordTranslationLatency(200, "MCP", "A2A"); // Exceeds 100ms threshold
    });

    it('should emit alerts for low cache hit rate', (done) => {
      monitor.on('cache-alert', (alert) => {
        expect(alert.hitRate).toBe(0.5);
        expect(alert.threshold).toBe(0.8);
        done();
      });

      monitor.updateCacheMetrics(0.5, 100, 10); // Below 0.8 threshold
    });
  });
});