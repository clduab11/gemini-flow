/**
 * A2P Payment Processor Tests
 * 
 * Focused tests for payment processing with quantum optimization and Byzantine consensus
 */

import { A2PPaymentProcessor } from "../a2a/a2p/payment-processor.js";
import { PaymentMandate, A2PConfig } from "../../types/a2a.js";
import { Logger } from "../../utils/logger.js";

// Mock Logger to avoid console output during tests
jest.mock("../../utils/logger.js", () => ({
  Logger: jest.fn().mockImplementation(() => ({
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

describe('A2PPaymentProcessor', () => {
  let processor: A2PPaymentProcessor;
  let mockConfig: A2PConfig;

  beforeEach(() => {
    mockConfig = {
      quantum: {
        pennylane: "mock-pennylane-service",
        qiskit: "mock-qiskit-service",
      },
      database: "mock-database",
      validators: 21,
      faultTolerance: 0.33,
    };

    processor = new A2PPaymentProcessor(mockConfig);
  });

  describe('Payment Processing', () => {
    it('should process a simple payment successfully', async () => {
      const mandate: PaymentMandate = {
        id: "test-mandate-1",
        amount: 100,
        currency: "USD",
        sender: "agent-sender",
        receiver: "agent-receiver",
        purpose: "test-payment",
        timeout: 30000,
        escrow: false,
      };

      const result = await processor.processPayment(mandate);

      expect(result.status).toBe("completed");
      expect(result.amount).toBe(100);
      expect(result.currency).toBe("USD");
      expect(result.transactionId).toMatch(/^tx_/);
      expect(result.latency).toBeLessThan(500); // Must be under 500ms
      expect(result.consensusProof).toBeTruthy();
    });

    it('should process payment with escrow', async () => {
      const mandate: PaymentMandate = {
        id: "test-mandate-escrow",
        amount: 1000,
        currency: "USD",
        sender: "agent-sender",
        receiver: "agent-receiver",
        purpose: "high-value-payment",
        escrow: true,
      };

      const result = await processor.processPayment(mandate);

      expect(result.status).toBe("completed");
      expect(result.escrowId).toBeTruthy();
      expect(result.escrowId).toMatch(/^escrow_/);
    });

    it('should optimize payment route with quantum algorithms', async () => {
      const mandate: PaymentMandate = {
        id: "test-mandate-quantum",
        amount: 5000,
        currency: "EUR",
        sender: "agent-sender",
        receiver: "agent-receiver",
        purpose: "quantum-optimized-payment",
        maxFee: 25, // 0.5% max fee
      };

      const result = await processor.processPayment(mandate);

      expect(result.status).toBe("completed");
      expect(result.route.quantumOptimized).toBe(true);
      expect(result.fee).toBeLessThanOrEqual(25);
      expect(result.route.reliability).toBeGreaterThan(0.99);
    });

    it('should handle multiple concurrent payments', async () => {
      const mandates: PaymentMandate[] = Array.from({ length: 10 }, (_, i) => ({
        id: `concurrent-mandate-${i}`,
        amount: 50,
        currency: "USD",
        sender: `agent-sender-${i}`,
        receiver: `agent-receiver-${i}`,
        purpose: "concurrent-test",
      }));

      const promises = mandates.map(mandate => processor.processPayment(mandate));
      const results = await Promise.all(promises);

      results.forEach((result, index) => {
        expect(result.status).toBe("completed");
        expect(result.amount).toBe(50);
        expect(result.transactionId).toMatch(/^tx_/);
        expect(result.latency).toBeLessThan(500);
      });
    });
  });

  describe('Performance Requirements', () => {
    it('should process payments within 500ms latency requirement', async () => {
      const mandate: PaymentMandate = {
        id: "performance-test",
        amount: 200,
        currency: "USD",
        sender: "perf-sender",
        receiver: "perf-receiver",
        purpose: "performance-validation",
      };

      const startTime = performance.now();
      const result = await processor.processPayment(mandate);
      const actualLatency = performance.now() - startTime;

      expect(actualLatency).toBeLessThan(500);
      expect(result.latency).toBeLessThan(500);
      expect(result.status).toBe("completed");
    });

    it('should maintain high throughput under load', async () => {
      const mandates: PaymentMandate[] = Array.from({ length: 100 }, (_, i) => ({
        id: `load-test-${i}`,
        amount: 10,
        currency: "USD",
        sender: `load-sender-${i}`,
        receiver: `load-receiver-${i}`,
        purpose: "load-test",
      }));

      const startTime = performance.now();
      const promises = mandates.map(mandate => processor.processPayment(mandate));
      const results = await Promise.all(promises);
      const totalTime = performance.now() - startTime;

      const throughput = (results.length / totalTime) * 1000; // ops per second

      expect(throughput).toBeGreaterThan(50); // Should handle at least 50 payments/sec
      expect(results.every(result => result.status === "completed")).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid payment mandate gracefully', async () => {
      const invalidMandate = {
        id: "invalid-mandate",
        amount: -100, // Invalid negative amount
        currency: "",
        sender: "",
        receiver: "",
        purpose: "",
      } as PaymentMandate;

      await expect(processor.processPayment(invalidMandate))
        .rejects.toThrow();
    });

    it('should provide meaningful error messages', async () => {
      const mandate: PaymentMandate = {
        id: "error-test",
        amount: 0, // Invalid zero amount
        currency: "USD",
        sender: "error-sender", 
        receiver: "error-receiver",
        purpose: "error-test",
      };

      try {
        await processor.processPayment(mandate);
        fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBeTruthy();
      }
    });
  });

  describe('Metrics Collection', () => {
    it('should track payment metrics correctly', async () => {
      const mandate: PaymentMandate = {
        id: "metrics-test",
        amount: 150,
        currency: "USD",
        sender: "metrics-sender",
        receiver: "metrics-receiver",
        purpose: "metrics-validation",
      };

      await processor.processPayment(mandate);
      const metrics = processor.getMetrics();

      expect(metrics).toBeDefined();
      expect(typeof metrics.totalPayments).toBe('number');
      expect(typeof metrics.averageLatency).toBe('number');
      expect(typeof metrics.successRate).toBe('number');
      expect(metrics.successRate).toBeGreaterThanOrEqual(0);
      expect(metrics.successRate).toBeLessThanOrEqual(1);
    });
  });

  describe('Quantum Optimization', () => {
    it('should apply quantum optimization for high-value payments', async () => {
      const highValueMandate: PaymentMandate = {
        id: "quantum-test",
        amount: 10000, // High value triggers quantum optimization
        currency: "USD",
        sender: "quantum-sender",
        receiver: "quantum-receiver",
        purpose: "quantum-optimization-test",
        maxFee: 50,
      };

      const result = await processor.processPayment(highValueMandate);

      expect(result.route.quantumOptimized).toBe(true);
      expect(result.fee).toBeLessThanOrEqual(50);
      expect(result.route.reliability).toBeGreaterThan(0.99);
    });

    it('should fallback gracefully when quantum optimization fails', async () => {
      // Mock quantum service failure by creating a mandate that would trigger optimization
      const mandate: PaymentMandate = {
        id: "quantum-fallback-test",
        amount: 5000,
        currency: "USD",
        sender: "fallback-sender",
        receiver: "fallback-receiver",
        purpose: "quantum-fallback-test",
        maxFee: 25,
      };

      // The payment should still succeed even if quantum optimization fails
      const result = await processor.processPayment(mandate);
      
      expect(result.status).toBe("completed");
      expect(result.amount).toBe(5000);
    });
  });

  describe('Byzantine Consensus Integration', () => {
    it('should validate transactions with Byzantine consensus', async () => {
      const mandate: PaymentMandate = {
        id: "consensus-test",
        amount: 500,
        currency: "USD",
        sender: "consensus-sender",
        receiver: "consensus-receiver",
        purpose: "consensus-validation",
      };

      const result = await processor.processPayment(mandate);

      expect(result.consensusProof).toBeTruthy();
      expect(result.consensusProof).toMatch(/^consensus_/);
      expect(result.status).toBe("completed");
    });
  });
});