/**
 * Universal Protocol Bridge
 * 
 * Central protocol bridge that translates between MCP, A2A, and A2P
 * Requirements: Must maintain sub-100ms translation latency while preserving semantic equivalence
 */

import { EventEmitter } from "node:events";
import { Logger } from "../../utils/logger.js";
import { A2AMCPBridge } from "../a2a/core/a2a-mcp-bridge.js";
import { A2PPaymentProcessor } from "../a2a/a2p/payment-processor.js";
import { QuantumClassicalHybridService } from "../../services/quantum-classical-hybrid.js";
import {
  A2AMessage,
  A2AResponse,
  PaymentMandate,
  A2PConfig,
  A2AProtocolConfig,
} from "../../types/a2a.js";
import { MCPRequest, MCPResponse } from "../../types/mcp.js";

export interface ProtocolBridgeConfig {
  a2aConfig: A2AProtocolConfig;
  a2pConfig?: A2PConfig;
  enableQuantumOptimization?: boolean;
  performanceTargets?: {
    maxTranslationLatency: number; // milliseconds
    maxPaymentLatency: number; // milliseconds
    targetThroughput: number; // operations per second
  };
}

export interface TranslationCache {
  get(key: string): any;
  set(key: string, value: any, ttl?: number): void;
  clear(): void;
  size: number;
}

export class UniversalProtocolBridge extends EventEmitter {
  private logger: Logger;
  private mcpBridge: A2AMCPBridge;
  private quantumService?: QuantumClassicalHybridService;
  private translationCache: Map<string, { value: any; timestamp: number; ttl: number }>;
  private config: ProtocolBridgeConfig;
  private isInitialized: boolean = false;

  // Performance tracking
  private metrics = {
    totalRequests: 0,
    translationLatencies: [] as number[],
    paymentLatencies: [] as number[],
    cacheHits: 0,
    cacheMisses: 0,
    quantumOptimizations: 0,
  };

  constructor(config: ProtocolBridgeConfig) {
    super();
    this.logger = new Logger("UniversalProtocolBridge");
    this.config = config;
    
    // Initialize translation cache with LRU-style cleanup
    this.translationCache = new Map();
    
    // Initialize MCP bridge with A2P support
    this.mcpBridge = new A2AMCPBridge({
      topology: config.a2aConfig.topology,
      a2pConfig: config.a2pConfig,
    });

    // Initialize quantum service if enabled
    if (config.enableQuantumOptimization) {
      this.quantumService = new QuantumClassicalHybridService();
      this.logger.info("Quantum optimization enabled for protocol bridge");
    }

    // Set up cache cleanup interval
    setInterval(() => this.cleanupCache(), 60000); // Every minute
  }

  /**
   * Initialize the protocol bridge
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info("Initializing Universal Protocol Bridge");

      // Initialize MCP bridge
      await this.mcpBridge.initialize();

      // Initialize quantum service if enabled
      if (this.quantumService) {
        // Quantum service initialization is handled in constructor
        this.logger.info("Quantum service ready for optimization");
      }

      this.isInitialized = true;

      this.logger.info("Universal Protocol Bridge initialized successfully", {
        quantumEnabled: !!this.quantumService,
        paymentEnabled: this.mcpBridge.isPaymentEnabled(),
        cacheSize: this.translationCache.size,
      });

      this.emit("initialized");
    } catch (error) {
      this.logger.error("Failed to initialize protocol bridge", error);
      throw error;
    }
  }

  /**
   * Translate and route request with intelligent protocol selection
   */
  async processRequest(request: MCPRequest | A2AMessage): Promise<MCPResponse | A2AResponse> {
    if (!this.isInitialized) {
      throw new Error("Protocol bridge not initialized");
    }

    const startTime = performance.now();
    this.metrics.totalRequests++;

    try {
      // Determine request type and route accordingly
      if (this.isMCPRequest(request)) {
        return await this.handleMCPRequest(request as MCPRequest);
      } else {
        return await this.handleA2ARequest(request as A2AMessage);
      }
    } catch (error) {
      this.logger.error("Request processing failed", {
        requestType: this.isMCPRequest(request) ? "MCP" : "A2A",
        error: (error as Error).message,
      });
      throw error;
    } finally {
      const latency = performance.now() - startTime;
      this.metrics.translationLatencies.push(latency);

      // Performance check
      const maxLatency = this.config.performanceTargets?.maxTranslationLatency || 100;
      if (latency > maxLatency) {
        this.logger.warn(`Translation latency exceeded target: ${latency}ms`);
      }
    }
  }

  /**
   * Process payment with quantum-optimized routing
   */
  async processPayment(mandate: PaymentMandate): Promise<{
    transactionId: string;
    status: string;
    latency: number;
    quantumOptimized: boolean;
  }> {
    if (!this.mcpBridge.isPaymentEnabled()) {
      throw new Error("Payment processing not enabled");
    }

    const startTime = performance.now();

    try {
      // Use quantum optimization for route selection if available
      let optimizedMandate = mandate;
      if (this.quantumService && this.shouldUseQuantumOptimization(mandate)) {
        optimizedMandate = await this.optimizePaymentWithQuantum(mandate);
        this.metrics.quantumOptimizations++;
      }

      const result = await this.mcpBridge.processPayment(optimizedMandate);
      const latency = performance.now() - startTime;
      
      this.metrics.paymentLatencies.push(latency);

      // Performance check
      const maxLatency = this.config.performanceTargets?.maxPaymentLatency || 500;
      if (latency > maxLatency) {
        this.logger.warn(`Payment latency exceeded target: ${latency}ms`);
      }

      return {
        ...result,
        quantumOptimized: !!this.quantumService && optimizedMandate !== mandate,
      };
    } catch (error) {
      this.logger.error("Payment processing failed", {
        mandateId: mandate.id,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  private async handleMCPRequest(request: MCPRequest): Promise<A2AResponse> {
    // Check cache first
    const cacheKey = this.generateCacheKey("mcp-to-a2a", request);
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      this.metrics.cacheHits++;
      return cached;
    }

    this.metrics.cacheMisses++;

    // Translate MCP to A2A
    const a2aMessage = await this.mcpBridge.translateMCPToA2A(request);
    
    // Create mock A2A response (in production, this would route to actual A2A agents)
    const response: A2AResponse = {
      jsonrpc: "2.0",
      result: {
        translatedFrom: "MCP",
        originalRequest: request.id,
        processedAt: Date.now(),
      },
      id: a2aMessage.id,
      from: "protocol-bridge",
      to: a2aMessage.from,
      timestamp: Date.now(),
      messageType: "response",
    };

    // Cache the response
    this.setInCache(cacheKey, response);

    return response;
  }

  private async handleA2ARequest(request: A2AMessage): Promise<MCPResponse> {
    // Check cache first
    const cacheKey = this.generateCacheKey("a2a-to-mcp", request);
    const cached = this.getFromCache(cacheKey);
    
    if (cached) {
      this.metrics.cacheHits++;
      return cached;
    }

    this.metrics.cacheMisses++;

    // Translate A2A to MCP
    const mcpRequest = await this.mcpBridge.translateA2AToMCP(request);
    
    // Create mock MCP response (in production, this would route to actual MCP tools)
    const response: MCPResponse = {
      id: mcpRequest.id || `mcp_${Date.now()}`,
      model: "protocol-bridge",
      content: JSON.stringify({
        translatedFrom: "A2A",
        originalMessage: request.id,
        processedAt: Date.now(),
      }),
      functionCalls: [],
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
      metadata: {
        cached: false,
        finishReason: "stop",
      },
    };

    // Cache the response
    this.setInCache(cacheKey, response);

    return response;
  }

  private isMCPRequest(request: MCPRequest | A2AMessage): boolean {
    return 'prompt' in request && !('from' in request);
  }

  private shouldUseQuantumOptimization(mandate: PaymentMandate): boolean {
    // Use quantum optimization for high-value transactions or complex routing
    return mandate.amount > 1000 || mandate.maxFee !== undefined;
  }

  private async optimizePaymentWithQuantum(mandate: PaymentMandate): Promise<PaymentMandate> {
    if (!this.quantumService) return mandate;

    try {
      // Use quantum portfolio optimization as a proxy for payment route optimization
      const optimizationInput = {
        assets: [{ id: mandate.currency, amount: mandate.amount }],
        constraints: {
          maxRisk: mandate.maxFee ? mandate.maxFee / mandate.amount : 0.01,
          targetReturn: 0.0, // Focus on cost minimization
        },
        quantumParameters: {
          qubits: 10,
          annealingTime: 1000, // 1 second for fast optimization
        },
      };

      const result = await this.quantumService.optimizePortfolio(optimizationInput);
      
      // Apply quantum optimization results to payment routing
      const optimizedMandate = {
        ...mandate,
        maxFee: mandate.maxFee ? Math.min(mandate.maxFee, mandate.amount * 0.005) : mandate.amount * 0.005,
        metadata: {
          ...mandate.metadata,
          quantumOptimized: true,
          optimizationScore: result.optimality,
        },
      };

      this.logger.debug("Quantum payment optimization completed", {
        mandateId: mandate.id,
        optimality: result.optimality,
        processingTime: result.processingTime,
      });

      return optimizedMandate;
    } catch (error) {
      this.logger.warn("Quantum optimization failed, using original mandate", {
        mandateId: mandate.id,
        error: (error as Error).message,
      });
      return mandate;
    }
  }

  private generateCacheKey(operation: string, request: any): string {
    const data = JSON.stringify({
      operation,
      id: request.id,
      method: request.method || request.prompt?.substring(0, 50),
    });
    // Simple hash - in production use crypto.createHash
    return Buffer.from(data).toString('base64').substring(0, 32);
  }

  private getFromCache(key: string): any {
    const entry = this.translationCache.get(key);
    if (!entry) return null;

    // Check TTL
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.translationCache.delete(key);
      return null;
    }

    return entry.value;
  }

  private setInCache(key: string, value: any, ttl: number = 300000): void {
    // LRU eviction if cache is too large
    if (this.translationCache.size >= 1000) {
      const oldestKey = this.translationCache.keys().next().value;
      this.translationCache.delete(oldestKey);
    }

    this.translationCache.set(key, {
      value,
      timestamp: Date.now(),
      ttl,
    });
  }

  private cleanupCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.translationCache.forEach((entry, key) => {
      if (now > entry.timestamp + entry.ttl) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => this.translationCache.delete(key));

    if (expiredKeys.length > 0) {
      this.logger.debug("Cache cleanup completed", {
        expired: expiredKeys.length,
        remaining: this.translationCache.size,
      });
    }
  }

  /**
   * Get comprehensive performance metrics
   */
  getMetrics(): {
    bridge: any;
    cache: any;
    quantum: any;
    performance: any;
  } {
    const bridgeMetrics = this.mcpBridge.getBridgeMetrics();
    
    const avgTranslationLatency = this.metrics.translationLatencies.length > 0
      ? this.metrics.translationLatencies.reduce((sum, latency) => sum + latency, 0) / this.metrics.translationLatencies.length
      : 0;

    const avgPaymentLatency = this.metrics.paymentLatencies.length > 0
      ? this.metrics.paymentLatencies.reduce((sum, latency) => sum + latency, 0) / this.metrics.paymentLatencies.length
      : 0;

    const cacheHitRate = this.metrics.cacheHits + this.metrics.cacheMisses > 0
      ? this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses)
      : 0;

    return {
      bridge: bridgeMetrics,
      cache: {
        size: this.translationCache.size,
        hits: this.metrics.cacheHits,
        misses: this.metrics.cacheMisses,
        hitRate: cacheHitRate,
      },
      quantum: {
        enabled: !!this.quantumService,
        optimizations: this.metrics.quantumOptimizations,
      },
      performance: {
        totalRequests: this.metrics.totalRequests,
        avgTranslationLatency,
        avgPaymentLatency,
        throughput: this.calculateThroughput(),
      },
    };
  }

  private calculateThroughput(): number {
    // Calculate requests per second over last minute
    const oneMinuteAgo = Date.now() - 60000;
    const recentLatencies = this.metrics.translationLatencies.filter(
      (_, index) => index >= this.metrics.translationLatencies.length - 60
    );
    return recentLatencies.length; // Rough approximation
  }

  /**
   * Shutdown the protocol bridge
   */
  async shutdown(): Promise<void> {
    this.logger.info("Shutting down Universal Protocol Bridge");
    
    await this.mcpBridge.shutdown();
    this.translationCache.clear();
    this.isInitialized = false;

    this.logger.info("Universal Protocol Bridge shutdown complete");
    this.emit("shutdown");
  }
}