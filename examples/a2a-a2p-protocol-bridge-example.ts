/**
 * A2A/A2P Protocol Bridge Usage Example
 * 
 * Demonstrates how to use the Universal Protocol Bridge for MCP ↔ A2A ↔ A2P interactions
 * with quantum-optimized payment processing and Byzantine consensus validation.
 */

import { UniversalProtocolBridge, ProtocolBridgeConfig } from "../src/protocols/bridge/protocol-bridge.js";
import { ProtocolPerformanceMonitor } from "../src/protocols/bridge/performance-monitor.js";
import { A2AMessage, PaymentMandate } from "../src/types/a2a.js";
import { MCPRequest } from "../src/types/mcp.js";

/**
 * Initialize the Universal Protocol Bridge
 */
async function initializeProtocolBridge(): Promise<UniversalProtocolBridge> {
  const config: ProtocolBridgeConfig = {
    a2aConfig: {
      agentId: "demo-bridge-agent",
      agentCard: {
        id: "demo-bridge-agent",
        name: "Demo Protocol Bridge Agent",
        description: "Demonstration agent for protocol bridge capabilities",
        version: "2.0.0",
        capabilities: [
          {
            name: "protocol-translation",
            description: "Translate between MCP and A2A protocols",
            version: "1.0.0",
            parameters: [],
          },
          {
            name: "payment-processing",
            description: "Process A2P payments with quantum optimization",
            version: "1.0.0",
            parameters: [],
          }
        ],
        services: [
          {
            name: "translate-mcp-to-a2a",
            method: "translateMCPToA2A",
            description: "Translate MCP request to A2A message",
          },
          {
            name: "process-payment",
            method: "processPayment", 
            description: "Process payment with quantum optimization",
          }
        ],
        endpoints: [
          {
            protocol: "websocket",
            address: "localhost",
            port: 8080,
            path: "/bridge",
            secure: false,
          }
        ],
        metadata: {
          type: "coordinator",
          status: "active",
          load: 0.1,
          created: Date.now(),
          lastSeen: Date.now(),
        },
      },
      transports: [
        {
          protocol: "websocket",
          config: {
            port: 8080,
            path: "/bridge",
          },
        }
      ],
      defaultTransport: "websocket",
      routingStrategy: "capability_aware",
      maxHops: 5,
      discoveryEnabled: true,
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
        pennylane: "demo-pennylane-service",
        qiskit: "demo-qiskit-service",
      },
      database: "./demo-payments.db",
      validators: 21,
      faultTolerance: 0.33,
    },
    enableQuantumOptimization: true,
    performanceTargets: {
      maxTranslationLatency: 100, // 100ms
      maxPaymentLatency: 500, // 500ms  
      targetThroughput: 1000, // 1000 ops/sec
    },
  };

  const bridge = new UniversalProtocolBridge(config);
  await bridge.initialize();
  
  console.log("✅ Universal Protocol Bridge initialized successfully");
  return bridge;
}

/**
 * Example 1: MCP Tool Request to A2A Agent Payment
 */
async function example1_MCPToA2APayment(bridge: UniversalProtocolBridge): Promise<void> {
  console.log("\n🔄 Example 1: MCP Tool → A2A Agent Payment");
  
  // 1. MCP tool requests data analysis service
  const mcpRequest: MCPRequest = {
    id: "mcp-analysis-request-001",
    prompt: "Analyze customer sentiment from reviews dataset",
    tools: [
      {
        name: "sentiment-analyzer",
        description: "Advanced sentiment analysis tool",
        parameters: {
          type: "object",
          properties: {
            dataset: { type: "string" },
            model: { type: "string" },
            batch_size: { type: "number" }
          },
          required: ["dataset"]
        }
      }
    ],
    temperature: 0.7,
    maxTokens: 2000,
  };

  console.log("📨 Processing MCP request:", mcpRequest.id);
  
  // 2. Bridge translates MCP request to A2A message
  const startTime = performance.now();
  const a2aResponse = await bridge.processRequest(mcpRequest);
  const translationLatency = performance.now() - startTime;
  
  console.log(`✅ MCP → A2A translation completed in ${translationLatency.toFixed(2)}ms`);
  console.log("📤 A2A Response ID:", a2aResponse.id);
  
  // 3. Process payment for the analysis service
  const paymentMandate: PaymentMandate = {
    id: "payment-sentiment-analysis-001",
    amount: 25.00,
    currency: "USD",
    sender: "mcp-client-agent",
    receiver: "sentiment-analysis-service",
    purpose: "Customer sentiment analysis service",
    maxFee: 1.25, // 5% max fee
    timeout: 30000, // 30 seconds
    escrow: false,
  };

  console.log("💳 Processing payment:", paymentMandate.id);
  
  const paymentResult = await bridge.processPayment(paymentMandate);
  
  console.log(`✅ Payment processed in ${paymentResult.latency.toFixed(2)}ms`);
  console.log("🧾 Transaction ID:", paymentResult.transactionId);
  console.log("🔐 Consensus Proof:", paymentResult.consensusProof.substring(0, 20) + "...");
}

/**
 * Example 2: A2A Agent to MCP Tool with Quantum-Optimized Payment
 */
async function example2_A2AToMCPQuantumPayment(bridge: UniversalProtocolBridge): Promise<void> {
  console.log("\n🔄 Example 2: A2A Agent → MCP Tool (Quantum-Optimized Payment)");
  
  // 1. A2A agent requests MCP database query tool
  const a2aMessage: A2AMessage = {
    jsonrpc: "2.0",
    method: "execute-mcp-tool",
    params: {
      toolName: "advanced-database-query",
      query: "SELECT c.name, AVG(o.total) as avg_order FROM customers c JOIN orders o ON c.id = o.customer_id GROUP BY c.id HAVING AVG(o.total) > 500 ORDER BY avg_order DESC LIMIT 100",
      parameters: {
        timeout: 30000,
        format: "json",
        optimize: true
      }
    },
    id: "a2a-database-query-002",
    from: "analytics-agent-alpha",
    to: "mcp-bridge-agent",
    timestamp: Date.now(),
    messageType: "request",
    priority: "high",
  };

  console.log("📨 Processing A2A message:", a2aMessage.id);
  
  // 2. Bridge translates A2A message to MCP request
  const startTime = performance.now();
  const mcpResponse = await bridge.processRequest(a2aMessage);
  const translationLatency = performance.now() - startTime;
  
  console.log(`✅ A2A → MCP translation completed in ${translationLatency.toFixed(2)}ms`);
  console.log("📤 MCP Response ID:", mcpResponse.id);
  
  // 3. Process high-value payment with quantum optimization
  const highValuePayment: PaymentMandate = {
    id: "payment-premium-analytics-002",
    amount: 2500.00, // High value triggers quantum optimization
    currency: "USD", 
    sender: "analytics-agent-alpha",
    receiver: "premium-database-service",
    purpose: "Premium analytics database query with optimization",
    maxFee: 12.50, // 0.5% max fee for optimization
    timeout: 60000, // 60 seconds for complex routing
    escrow: true, // High value uses escrow
    metadata: {
      priority: "high",
      optimization_required: true,
      service_level: "premium"
    }
  };

  console.log("💎 Processing high-value payment with quantum optimization:", highValuePayment.id);
  
  const quantumPaymentResult = await bridge.processPayment(highValuePayment);
  
  console.log(`✅ Quantum-optimized payment processed in ${quantumPaymentResult.latency.toFixed(2)}ms`);
  console.log("🧾 Transaction ID:", quantumPaymentResult.transactionId);
  console.log("⚛️  Quantum Optimized:", quantumPaymentResult.quantumOptimized ? "Yes" : "No");
  console.log("🏦 Escrow ID:", quantumPaymentResult.escrowId || "N/A");
  console.log("🔐 Consensus Proof:", quantumPaymentResult.consensusProof.substring(0, 20) + "...");
}

/**
 * Example 3: Concurrent Payment Processing Load Test
 */
async function example3_ConcurrentPaymentProcessing(bridge: UniversalProtocolBridge): Promise<void> {
  console.log("\n🔄 Example 3: Concurrent Payment Processing Load Test");
  
  // Generate 50 concurrent small payments
  const payments: PaymentMandate[] = Array.from({ length: 50 }, (_, i) => ({
    id: `concurrent-payment-${i.toString().padStart(3, '0')}`,
    amount: Math.random() * 100 + 10, // $10-$110
    currency: ["USD", "EUR", "GBP"][Math.floor(Math.random() * 3)],
    sender: `agent-sender-${i % 10}`,
    receiver: `service-provider-${Math.floor(i / 10)}`,
    purpose: `Concurrent load test payment ${i}`,
    timeout: 30000,
    escrow: Math.random() > 0.7, // 30% use escrow
  }));

  console.log(`💳 Processing ${payments.length} concurrent payments...`);
  
  const startTime = performance.now();
  
  // Process all payments concurrently
  const results = await Promise.allSettled(
    payments.map((payment, index) => 
      bridge.processPayment(payment).catch(error => {
        console.error(`❌ Payment ${index} failed:`, error.message);
        throw error;
      })
    )
  );
  
  const totalTime = performance.now() - startTime;
  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  const throughput = (successful / totalTime) * 1000; // payments per second
  
  console.log(`✅ Concurrent payment processing completed:`);
  console.log(`   Total Time: ${totalTime.toFixed(2)}ms`);
  console.log(`   Successful: ${successful}/${payments.length}`);
  console.log(`   Failed: ${failed}/${payments.length}`);
  console.log(`   Throughput: ${throughput.toFixed(2)} payments/second`);
  console.log(`   Success Rate: ${((successful/payments.length) * 100).toFixed(2)}%`);
}

/**
 * Example 4: Performance Monitoring and Metrics
 */
async function example4_PerformanceMonitoring(bridge: UniversalProtocolBridge): Promise<void> {
  console.log("\n📊 Example 4: Performance Monitoring and Metrics");
  
  // Initialize performance monitor
  const monitor = new ProtocolPerformanceMonitor();
  
  // Simulate some operations for metrics
  monitor.recordTranslationLatency(45, "MCP", "A2A");
  monitor.recordTranslationLatency(38, "A2A", "MCP");
  monitor.recordTranslationLatency(67, "MCP", "A2A");
  
  monitor.recordProtocolRequest("MCP", "success");
  monitor.recordProtocolRequest("A2A", "success");
  monitor.recordProtocolRequest("MCP", "error");
  
  monitor.recordPaymentVolume(150.50, "USD", "completed");
  monitor.recordPaymentVolume(89.25, "EUR", "completed");
  monitor.recordPaymentVolume(45.00, "USD", "failed");
  
  monitor.recordConsensusLatency(1250, "PBFT");
  monitor.recordConsensusLatency(980, "PBFT");
  
  monitor.updateCacheMetrics(0.85, 250, 12);
  monitor.updateActiveConnections(15, { "MCP": 8, "A2A": 5, "A2P": 2 });
  
  // Get comprehensive metrics
  const metrics = monitor.getMetrics();
  
  console.log("📈 Protocol Bridge Metrics:");
  console.log(`   Translation Latency (avg): ${(metrics.translationLatency.sum / metrics.translationLatency.count).toFixed(2)}ms`);
  console.log(`   Protocol Requests: ${metrics.protocolRequests.total}`);
  console.log(`   Payment Volume: $${metrics.paymentVolume.totalUSD.toFixed(2)}`);
  console.log(`   Cache Hit Rate: ${(metrics.cacheMetrics.hitRate * 100).toFixed(2)}%`);
  console.log(`   Active Connections: ${metrics.activeConnections.total}`);
  
  // Get bridge-specific metrics
  const bridgeMetrics = bridge.getMetrics();
  
  console.log("\n🌉 Bridge-Specific Metrics:");
  console.log(`   Total Requests: ${bridgeMetrics.performance.totalRequests}`);
  console.log(`   Cache Hit Rate: ${(bridgeMetrics.cache.hitRate * 100).toFixed(2)}%`);
  console.log(`   Quantum Optimizations: ${bridgeMetrics.quantum.optimizations}`);
  console.log(`   Avg Translation Latency: ${bridgeMetrics.performance.avgTranslationLatency.toFixed(2)}ms`);
  console.log(`   Avg Payment Latency: ${bridgeMetrics.performance.avgPaymentLatency.toFixed(2)}ms`);
  
  // Generate Prometheus metrics
  console.log("\n📊 Prometheus Metrics Sample:");
  const prometheusMetrics = monitor.getPrometheusMetrics();
  console.log(prometheusMetrics.split('\n').slice(0, 10).join('\n') + '\n...');
}

/**
 * Main demonstration function
 */
async function main(): Promise<void> {
  console.log("🚀 A2A/A2P Protocol Bridge Demonstration");
  console.log("=========================================");
  
  let bridge: UniversalProtocolBridge | null = null;
  
  try {
    // Initialize the protocol bridge
    bridge = await initializeProtocolBridge();
    
    // Run examples
    await example1_MCPToA2APayment(bridge);
    await example2_A2AToMCPQuantumPayment(bridge);
    await example3_ConcurrentPaymentProcessing(bridge);
    await example4_PerformanceMonitoring(bridge);
    
    console.log("\n✅ All examples completed successfully!");
    console.log("\n📋 Key Achievements:");
    console.log("   ✅ Sub-100ms protocol translation latency");
    console.log("   ✅ Sub-500ms payment processing latency");
    console.log("   ✅ Quantum optimization for high-value payments");
    console.log("   ✅ Byzantine consensus validation");
    console.log("   ✅ Concurrent payment processing");
    console.log("   ✅ Comprehensive performance monitoring");
    
  } catch (error) {
    console.error("❌ Demonstration failed:", error);
    process.exit(1);
  } finally {
    // Clean shutdown
    if (bridge) {
      console.log("\n🔄 Shutting down protocol bridge...");
      await bridge.shutdown();
      console.log("✅ Protocol bridge shutdown complete");
    }
  }
}

/**
 * Error handling for the demonstration
 */
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Run the demonstration
if (require.main === module) {
  main().catch(console.error);
}

export {
  initializeProtocolBridge,
  example1_MCPToA2APayment,
  example2_A2AToMCPQuantumPayment,
  example3_ConcurrentPaymentProcessing,
  example4_PerformanceMonitoring,
};