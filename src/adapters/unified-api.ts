/**
 * Unified API Abstraction Layer
 *
 * Single interface for all Google AI models with <75ms routing optimization
 * Handles model selection, fallback strategies, and performance optimization
 */

import { EventEmitter } from "node:events";
import { Logger } from "../utils/logger.js";
import {
  BaseModelAdapter,
  ModelRequest,
  ModelResponse,
  StreamChunk,
  AdapterError,
  HealthCheck,
} from "./base-model-adapter.js";
import { GeminiAdapter } from "./gemini-adapter.js";
import { DeepMindAdapter } from "./deepmind-adapter.js";
import { JulesWorkflowAdapter } from "./jules-workflow-adapter.js";
import {
  EnhancedStreamingAPI,
  EnhancedStreamingConfig,
  StreamingContext,
  StreamSession,
} from "../streaming/enhanced-streaming-api.js";
import {
  VideoStreamRequest,
  AudioStreamRequest,
  VideoStreamResponse,
  AudioStreamResponse,
  MultiModalChunk,
  StreamingSession as TypesStreamingSession,
  StreamingContext as TypesStreamingContext,
  EdgeCacheConfig,
  CDNConfiguration,
} from "../types/streaming.js";

export interface UnifiedAPIConfig {
  routing: {
    strategy: "latency" | "cost" | "quality" | "balanced" | "custom";
    latencyTarget: number; // Target routing time in ms
    fallbackEnabled: boolean;
    circuitBreakerThreshold: number;
    retryAttempts: number;
    retryDelay: number;
  };
  caching: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
    keyStrategy: "prompt" | "semantic" | "hybrid";
  };
  monitoring: {
    metricsEnabled: boolean;
    healthCheckInterval: number;
    performanceThreshold: number;
  };
  models: {
    gemini: any[];
    deepmind: any[];
    jules: any[];
  };
  streaming?: {
    enabled: boolean;
    config: EnhancedStreamingConfig;
  };
}

export interface RoutingDecision {
  selectedAdapter: string;
  confidence: number;
  reasoning: string;
  fallbacks: string[];
  routingTime: number;
  factors: {
    latency: number;
    cost: number;
    availability: number;
    capability: number;
  };
}

export interface UnifiedMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  averageRoutingTime: number;
  cacheHitRate: number;
  modelDistribution: Record<string, number>;
  errorDistribution: Record<string, number>;
  costMetrics: {
    totalCost: number;
    costPerRequest: number;
    costPerToken: number;
  };
  performanceMetrics: {
    p50Latency: number;
    p95Latency: number;
    p99Latency: number;
    throughput: number;
  };
}

export class UnifiedAPI extends EventEmitter {
  private logger: Logger;
  private config: UnifiedAPIConfig;
  private adapters = new Map<string, BaseModelAdapter>();
  // private _routingCache = new Map<string, RoutingDecision>(); // Reserved for future optimization
  private circuitBreakers = new Map<
    string,
    { failures: number; lastFailure: Date; open: boolean }
  >();
  private metrics: UnifiedMetrics;
  private performanceHistory: Array<{
    timestamp: Date;
    latency: number;
    adapter: string;
  }> = [];

  // Fast routing optimization
  private routingDecisionCache = new Map<
    string,
    { decision: RoutingDecision; timestamp: number }
  >();
  private capabilityMatrix = new Map<string, Set<string>>(); // adapter -> capabilities
  private latencyBaseline = new Map<string, number>(); // adapter -> avg latency

  // Enhanced streaming capabilities
  private streamingAPI?: EnhancedStreamingAPI;
  private streamingSessions = new Map<string, StreamSession>();

  constructor(config: UnifiedAPIConfig) {
    super();
    this.logger = new Logger("UnifiedAPI");
    this.config = config;
    this.metrics = this.initializeMetrics();

    this.initializeAdapters();
    this.setupMonitoring();
    this.startHealthChecks();
    this.initializeStreaming();
  }

  /**
   * Main generation method with unified interface
   */
  async generate(request: ModelRequest): Promise<ModelResponse> {
    const startTime = performance.now();
    this.metrics.totalRequests++;

    try {
      // Fast routing decision (<75ms target)
      const routingDecision = await this.makeRoutingDecision(request);

      if (routingDecision.routingTime > this.config.routing.latencyTarget) {
        this.logger.warn("Routing latency exceeded target", {
          actual: routingDecision.routingTime,
          target: this.config.routing.latencyTarget,
          decision: routingDecision,
        });
      }

      // Execute with selected adapter
      const response = await this.executeWithAdapter(
        routingDecision.selectedAdapter,
        request,
      );

      // Update metrics and performance tracking
      const totalLatency = performance.now() - startTime;
      this.updateMetrics(
        routingDecision.selectedAdapter,
        totalLatency,
        true,
        response,
      );
      this.recordPerformance(routingDecision.selectedAdapter, totalLatency);

      // Emit events for monitoring
      this.emit("request_completed", {
        adapter: routingDecision.selectedAdapter,
        latency: totalLatency,
        routingTime: routingDecision.routingTime,
        success: true,
        request: this.sanitizeRequest(request),
        response: this.sanitizeResponse(response),
      });

      return response;
    } catch (error) {
      const totalLatency = performance.now() - startTime;
      await this.handleRequestError(
        error as AdapterError,
        request,
        totalLatency,
      );
      throw error;
    }
  }

  /**
   * Streaming generation with unified interface
   */
  async *generateStream(
    request: ModelRequest,
  ): AsyncIterableIterator<StreamChunk> {
    const startTime = performance.now();
    this.metrics.totalRequests++;

    try {
      const routingDecision = await this.makeRoutingDecision(request);
      const adapter = this.adapters.get(routingDecision.selectedAdapter);

      if (!adapter) {
        throw new Error(
          `Adapter not found: ${routingDecision.selectedAdapter}`,
        );
      }

      let chunkCount = 0;

      for await (const chunk of adapter.generateStream(request)) {
        chunkCount++;
        yield {
          ...chunk,
          metadata: {
            ...chunk.metadata,
            adapter: routingDecision.selectedAdapter,
            routingDecision,
            chunkIndex: chunkCount,
          },
        };
      }

      const totalLatency = performance.now() - startTime;
      this.updateMetrics(routingDecision.selectedAdapter, totalLatency, true);

      this.emit("stream_completed", {
        adapter: routingDecision.selectedAdapter,
        latency: totalLatency,
        chunks: chunkCount,
        success: true,
      });
    } catch (error) {
      const totalLatency = performance.now() - startTime;
      await this.handleRequestError(
        error as AdapterError,
        request,
        totalLatency,
      );
      throw error;
    }
  }

  /**
   * Make fast routing decision (<75ms target)
   */
  private async makeRoutingDecision(
    request: ModelRequest,
  ): Promise<RoutingDecision> {
    const routingStart = performance.now();

    // Check routing cache first (sub-millisecond)
    const cacheKey = this.generateRoutingCacheKey(request);
    const cached = this.routingDecisionCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < 30000) {
      // 30s cache
      cached.decision.routingTime = performance.now() - routingStart;
      return cached.decision;
    }

    // Fast capability filtering (5-10ms)
    const capableAdapters = this.filterCapableAdapters(request);

    if (capableAdapters.length === 0) {
      throw new Error("No capable adapters found for request");
    }

    // Fast scoring algorithm (10-20ms)
    const scoredAdapters = await this.scoreAdapters(capableAdapters, request);

    // Circuit breaker check (1-2ms)
    const availableAdapters = this.filterAvailableAdapters(scoredAdapters);

    if (availableAdapters.length === 0) {
      throw new Error("All adapters are unavailable (circuit breakers open)");
    }

    // Select best adapter (1ms)
    const selectedAdapter = availableAdapters[0];
    const fallbacks = availableAdapters.slice(1, 3).map((a) => a.adapter);

    const routingTime = performance.now() - routingStart;

    const decision: RoutingDecision = {
      selectedAdapter: selectedAdapter.adapter,
      confidence: selectedAdapter.score,
      reasoning: this.generateReasoningExplanation(selectedAdapter, request),
      fallbacks,
      routingTime,
      factors: selectedAdapter.factors,
    };

    // Cache the decision
    this.routingDecisionCache.set(cacheKey, {
      decision,
      timestamp: Date.now(),
    });

    return decision;
  }

  /**
   * Filter adapters by capability (fast lookup using pre-built matrix)
   */
  private filterCapableAdapters(request: ModelRequest): string[] {
    const requiredCapabilities = this.extractRequiredCapabilities(request);
    const capableAdapters: string[] = [];

    for (const [adapterName, capabilities] of this.capabilityMatrix) {
      if (requiredCapabilities.every((cap) => capabilities.has(cap))) {
        capableAdapters.push(adapterName);
      }
    }

    return capableAdapters;
  }

  /**
   * Score adapters quickly using cached metrics
   */
  private async scoreAdapters(
    candidates: string[],
    request: ModelRequest,
  ): Promise<Array<{ adapter: string; score: number; factors: any }>> {
    const scored: Array<{ adapter: string; score: number; factors: any }> = [];

    for (const adapterName of candidates) {
      const adapter = this.adapters.get(adapterName);
      if (!adapter) continue;

      const factors = {
        latency: this.calculateLatencyScore(adapterName, request),
        cost: this.calculateCostScore(adapterName, request),
        availability: this.calculateAvailabilityScore(adapterName),
        capability: this.calculateCapabilityScore(adapterName, request),
      };

      // Weighted scoring based on strategy
      let score = 0;
      switch (this.config.routing.strategy) {
        case "latency":
          score = factors.latency * 0.8 + factors.availability * 0.2;
          break;
        case "cost":
          score =
            factors.cost * 0.6 +
            factors.latency * 0.3 +
            factors.availability * 0.1;
          break;
        case "quality":
          score =
            factors.capability * 0.5 +
            factors.latency * 0.3 +
            factors.availability * 0.2;
          break;
        case "balanced":
          score =
            factors.latency * 0.3 +
            factors.cost * 0.25 +
            factors.capability * 0.25 +
            factors.availability * 0.2;
          break;
        default: // custom
          score = this.calculateCustomScore(factors, request);
      }

      scored.push({ adapter: adapterName, score, factors });
    }

    return scored.sort((a, b) => b.score - a.score);
  }

  /**
   * Execute request with specific adapter and handle fallbacks
   */
  private async executeWithAdapter(
    adapterName: string,
    request: ModelRequest,
  ): Promise<ModelResponse> {
    const adapter = this.adapters.get(adapterName);
    if (!adapter) {
      throw new Error(`Adapter not found: ${adapterName}`);
    }

    try {
      const response = await adapter.generate(request);

      // Reset circuit breaker on success
      this.resetCircuitBreaker(adapterName);

      return response;
    } catch (error) {
      this.recordAdapterFailure(adapterName);

      // Try fallback if enabled and available
      if (this.config.routing.fallbackEnabled) {
        const fallbackAdapter = await this.selectFallbackAdapter(
          adapterName,
          request,
        );
        if (fallbackAdapter) {
          this.logger.warn("Falling back to alternative adapter", {
            original: adapterName,
            fallback: fallbackAdapter,
            error: (error as Error).message,
          });

          return this.executeWithAdapter(fallbackAdapter, request);
        }
      }

      throw error;
    }
  }

  /**
   * Initialize all configured adapters
   */
  private async initializeAdapters(): Promise<void> {
    const initPromises: Promise<void>[] = [];

    // Initialize Gemini adapters
    for (const config of this.config.models.gemini) {
      const adapter = new GeminiAdapter(config);
      this.adapters.set(`gemini-${config.model}`, adapter);
      initPromises.push(adapter.initialize());
      this.updateCapabilityMatrix(
        `gemini-${config.model}`,
        adapter.getCapabilities(),
      );
    }

    // Initialize DeepMind adapters
    for (const config of this.config.models.deepmind) {
      const adapter = new DeepMindAdapter(config);
      this.adapters.set(`deepmind-${config.model}`, adapter);
      initPromises.push(adapter.initialize());
      this.updateCapabilityMatrix(
        `deepmind-${config.model}`,
        adapter.getCapabilities(),
      );
    }

    // Initialize Jules workflow adapters
    for (const config of this.config.models.jules) {
      const adapter = new JulesWorkflowAdapter(config);
      this.adapters.set(`jules-${config.modelName}`, adapter);
      initPromises.push(adapter.initialize());
      this.updateCapabilityMatrix(
        `jules-${config.modelName}`,
        adapter.getCapabilities(),
      );
    }

    await Promise.all(initPromises);
    this.logger.info("All adapters initialized", { count: this.adapters.size });
  }

  /**
   * Update capability matrix for fast lookups
   */
  private updateCapabilityMatrix(adapterName: string, capabilities: any): void {
    const capSet = new Set<string>();

    if (capabilities.textGeneration) capSet.add("text");
    if (capabilities.codeGeneration) capSet.add("code");
    if (capabilities.multimodal) capSet.add("multimodal");
    if (capabilities.streaming) capSet.add("streaming");
    if (capabilities.functionCalling) capSet.add("functions");
    if (capabilities.reasoning) capSet.add("reasoning");
    if (capabilities.longContext) capSet.add("long-context");

    this.capabilityMatrix.set(adapterName, capSet);
  }

  /**
   * Extract required capabilities from request
   */
  private extractRequiredCapabilities(request: ModelRequest): string[] {
    const capabilities: string[] = ["text"]; // Always need text

    if (request.multimodal) capabilities.push("multimodal");
    if (request.tools && request.tools.length > 0)
      capabilities.push("functions");
    if (request.context?.streaming) capabilities.push("streaming");
    if (request.prompt.length > 100000) capabilities.push("long-context");

    // Detect reasoning requirements
    const reasoningKeywords = [
      "analyze",
      "compare",
      "evaluate",
      "reason",
      "think",
    ];
    if (
      reasoningKeywords.some((kw) => request.prompt.toLowerCase().includes(kw))
    ) {
      capabilities.push("reasoning");
    }

    // Detect code requirements
    const codeKeywords = [
      "code",
      "function",
      "class",
      "programming",
      "algorithm",
    ];
    if (codeKeywords.some((kw) => request.prompt.toLowerCase().includes(kw))) {
      capabilities.push("code");
    }

    return capabilities;
  }

  /**
   * Calculate latency score (higher is better)
   */
  private calculateLatencyScore(
    adapterName: string,
    request: ModelRequest,
  ): number {
    const baseline = this.latencyBaseline.get(adapterName) || 1000;
    const target = request.context?.latencyTarget || 2000;

    if (baseline <= target) {
      return 1.0;
    }

    return Math.max(0, 1.0 - (baseline - target) / target);
  }

  /**
   * Calculate cost score (higher is better for lower cost)
   */
  private calculateCostScore(
    adapterName: string,
    request: ModelRequest,
  ): number {
    // Cost scoring logic based on user tier and budget
    const userTier = request.context?.userTier || "free";
    const tokenBudget = request.context?.tokenBudget || 4000;

    // Simplified cost calculation - would be enhanced with real pricing
    const estimatedCost = this.estimateRequestCost(adapterName, tokenBudget);
    const budgetThreshold = this.getBudgetThreshold(userTier);

    if (estimatedCost <= budgetThreshold) {
      return 1.0;
    }

    return Math.max(
      0,
      1.0 - (estimatedCost - budgetThreshold) / budgetThreshold,
    );
  }

  /**
   * Calculate availability score based on circuit breaker state
   */
  private calculateAvailabilityScore(adapterName: string): number {
    const breaker = this.circuitBreakers.get(adapterName);
    if (!breaker) return 1.0;

    if (breaker.open) return 0.0;

    // Reduce score based on recent failures
    const failureRate = breaker.failures / 10; // Max 10 failures tracked
    return Math.max(0, 1.0 - failureRate);
  }

  /**
   * Calculate capability score based on feature match
   */
  private calculateCapabilityScore(
    adapterName: string,
    request: ModelRequest,
  ): number {
    const adapterCaps = this.capabilityMatrix.get(adapterName) || new Set();
    const requiredCaps = this.extractRequiredCapabilities(request);

    if (requiredCaps.length === 0) return 1.0;

    const matches = requiredCaps.filter((cap) => adapterCaps.has(cap)).length;
    return matches / requiredCaps.length;
  }

  /**
   * Filter adapters by circuit breaker state
   */
  private filterAvailableAdapters(
    scored: Array<{ adapter: string; score: number; factors: any }>,
  ): Array<{ adapter: string; score: number; factors: any }> {
    return scored.filter((item) => {
      const breaker = this.circuitBreakers.get(item.adapter);
      return !breaker || !breaker.open;
    });
  }

  /**
   * Record adapter failure and update circuit breaker
   */
  private recordAdapterFailure(adapterName: string): void {
    let breaker = this.circuitBreakers.get(adapterName);
    if (!breaker) {
      breaker = { failures: 0, lastFailure: new Date(), open: false };
      this.circuitBreakers.set(adapterName, breaker);
    }

    breaker.failures++;
    breaker.lastFailure = new Date();

    // Open circuit breaker if threshold exceeded
    if (breaker.failures >= this.config.routing.circuitBreakerThreshold) {
      breaker.open = true;
      this.logger.warn("Circuit breaker opened", {
        adapter: adapterName,
        failures: breaker.failures,
      });

      // Auto-reset after delay
      setTimeout(() => {
        breaker!.open = false;
        breaker!.failures = 0;
        this.logger.info("Circuit breaker reset", { adapter: adapterName });
      }, 60000); // 1 minute
    }
  }

  /**
   * Reset circuit breaker on successful request
   */
  private resetCircuitBreaker(adapterName: string): void {
    const breaker = this.circuitBreakers.get(adapterName);
    if (breaker && breaker.failures > 0) {
      breaker.failures = Math.max(0, breaker.failures - 1);
    }
  }

  /**
   * Select fallback adapter
   */
  private async selectFallbackAdapter(
    failedAdapter: string,
    request: ModelRequest,
  ): Promise<string | null> {
    const availableAdapters = Array.from(this.adapters.keys())
      .filter((name) => name !== failedAdapter)
      .filter((name) => {
        const breaker = this.circuitBreakers.get(name);
        return !breaker || !breaker.open;
      });

    if (availableAdapters.length === 0) return null;

    // Quick capability check
    const capableAdapters = this.filterCapableAdapters(request).filter((name) =>
      availableAdapters.includes(name),
    );

    return capableAdapters[0] || null;
  }

  /**
   * Handle request errors with retry logic
   */
  private async handleRequestError(
    error: AdapterError,
    request: ModelRequest,
    latency: number,
  ): Promise<void> {
    this.metrics.failedRequests++;
    this.updateErrorMetrics(error);

    this.emit("request_failed", {
      error: error.message,
      code: error.code,
      retryable: error.retryable,
      latency,
      request: this.sanitizeRequest(request),
    });

    // Retry logic for retryable errors
    if (
      error.retryable &&
      (request.context?.retryCount || 0) < this.config.routing.retryAttempts
    ) {
      await new Promise((resolve) =>
        setTimeout(resolve, this.config.routing.retryDelay),
      );

      const retryRequest = {
        ...request,
        context: {
          ...request.context,
          retryCount: (request.context?.retryCount || 0) + 1,
          latencyTarget: request.context?.latencyTarget || 100,
          priority: request.context?.priority || "medium",
          userTier: request.context?.userTier || "free",
        },
      };

      // Execute retry but don't return the response (this method returns void)
      await this.generate(retryRequest);
    }
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(
    adapter: string,
    latency: number,
    success: boolean,
    response?: ModelResponse,
  ): void {
    if (success) {
      this.metrics.successfulRequests++;
    }

    // Update latency metrics
    this.metrics.averageLatency =
      (this.metrics.averageLatency * (this.metrics.totalRequests - 1) +
        latency) /
      this.metrics.totalRequests;

    // Update model distribution
    this.metrics.modelDistribution[adapter] =
      (this.metrics.modelDistribution[adapter] || 0) + 1;

    // Update cost metrics
    if (response) {
      this.metrics.costMetrics.totalCost += response.cost;
      this.metrics.costMetrics.costPerRequest =
        this.metrics.costMetrics.totalCost / this.metrics.totalRequests;

      if (response.usage.totalTokens > 0) {
        this.metrics.costMetrics.costPerToken =
          this.metrics.costMetrics.totalCost / this.getTotalTokensProcessed();
      }
    }
  }

  /**
   * Record performance data for optimization
   */
  private recordPerformance(adapter: string, latency: number): void {
    this.performanceHistory.push({
      timestamp: new Date(),
      latency,
      adapter,
    });

    // Keep only recent history (last 1000 requests)
    if (this.performanceHistory.length > 1000) {
      this.performanceHistory.shift();
    }

    // Update baseline latency
    const recentLatencies = this.performanceHistory
      .filter((p) => p.adapter === adapter)
      .slice(-10)
      .map((p) => p.latency);

    if (recentLatencies.length > 0) {
      const avgLatency =
        recentLatencies.reduce((sum, l) => sum + l, 0) / recentLatencies.length;
      this.latencyBaseline.set(adapter, avgLatency);
    }
  }

  /**
   * Generate routing cache key
   */
  private generateRoutingCacheKey(request: ModelRequest): string {
    const key = {
      capabilities: this.extractRequiredCapabilities(request).sort(),
      userTier: request.context?.userTier,
      priority: request.context?.priority,
      latencyTarget: request.context?.latencyTarget,
      strategy: this.config.routing.strategy,
    };

    return Buffer.from(JSON.stringify(key)).toString("base64").substring(0, 32);
  }

  /**
   * Setup monitoring and health checks
   */
  private setupMonitoring(): void {
    if (!this.config.monitoring.metricsEnabled) return;

    // Performance monitoring
    setInterval(() => {
      this.analyzePerformance();
      this.optimizeRouting();
    }, 30000); // Every 30 seconds

    // Emit metrics periodically
    setInterval(() => {
      this.emit("metrics_update", this.getMetrics());
    }, 10000); // Every 10 seconds
  }

  /**
   * Start health checks for all adapters
   */
  private startHealthChecks(): void {
    setInterval(async () => {
      const healthPromises = Array.from(this.adapters.entries()).map(
        async ([name, adapter]) => {
          try {
            const health = await adapter.healthCheck();
            this.emit("health_check", { adapter: name, health });

            // Update circuit breaker based on health
            if (health.status === "unhealthy") {
              this.recordAdapterFailure(name);
            }
          } catch (error) {
            this.recordAdapterFailure(name);
          }
        },
      );

      await Promise.allSettled(healthPromises);
    }, this.config.monitoring.healthCheckInterval);
  }

  /**
   * Analyze performance and emit insights
   */
  private analyzePerformance(): void {
    if (this.performanceHistory.length < 10) return;

    const recentHistory = this.performanceHistory.slice(-100);
    const latencies = recentHistory.map((p) => p.latency).sort((a, b) => a - b);

    this.metrics.performanceMetrics = {
      p50Latency: latencies[Math.floor(latencies.length * 0.5)],
      p95Latency: latencies[Math.floor(latencies.length * 0.95)],
      p99Latency: latencies[Math.floor(latencies.length * 0.99)],
      throughput:
        recentHistory.length /
        ((recentHistory[recentHistory.length - 1].timestamp.getTime() -
          recentHistory[0].timestamp.getTime()) /
          1000),
    };

    // Emit performance insights
    this.emit("performance_analysis", this.metrics.performanceMetrics);
  }

  /**
   * Optimize routing based on performance data
   */
  private optimizeRouting(): void {
    // Clear routing cache if performance is degrading
    const avgRoutingTime = this.calculateAverageRoutingTime();
    if (avgRoutingTime > this.config.routing.latencyTarget * 1.5) {
      this.routingDecisionCache.clear();
      this.logger.info("Routing cache cleared due to performance degradation", {
        avgRoutingTime,
        target: this.config.routing.latencyTarget,
      });
    }

    // Adjust circuit breaker thresholds based on overall system health
    const errorRate = this.metrics.failedRequests / this.metrics.totalRequests;
    if (errorRate > 0.1) {
      // 10% error rate
      // More aggressive circuit breaking
      for (const [, breaker] of this.circuitBreakers) {
        if (breaker.failures >= 3) {
          // Lower threshold
          breaker.open = true;
        }
      }
    }
  }

  /**
   * Get comprehensive metrics
   */
  getMetrics(): UnifiedMetrics {
    return { ...this.metrics };
  }

  /**
   * Get routing decision for a request (without executing)
   */
  async getRoutingDecision(request: ModelRequest): Promise<RoutingDecision> {
    return this.makeRoutingDecision(request);
  }

  /**
   * Get adapter health status
   */
  async getAdapterHealth(): Promise<Record<string, HealthCheck>> {
    const health: Record<string, HealthCheck> = {};

    const healthPromises = Array.from(this.adapters.entries()).map(
      async ([name, adapter]) => {
        try {
          health[name] = await adapter.healthCheck();
        } catch (error) {
          health[name] = {
            status: "unhealthy",
            latency: 0,
            lastChecked: new Date(),
            errors: [(error as Error).message],
            metadata: {},
          };
        }
      },
    );

    await Promise.allSettled(healthPromises);
    return health;
  }

  // ===== ENHANCED STREAMING API METHODS =====

  /**
   * Create a new streaming session with full multimedia support
   */
  async createStreamingSession(
    sessionId: string,
    type: "video" | "audio" | "multimodal" | "data",
    context: StreamingContext,
  ): Promise<StreamSession | null> {
    if (!this.streamingAPI) {
      throw new Error(
        "Streaming API not initialized. Enable streaming in configuration.",
      );
    }

    try {
      const session = await this.streamingAPI.createSession(
        sessionId,
        type,
        context,
      );
      this.streamingSessions.set(sessionId, session);

      this.logger.info("Streaming session created", {
        sessionId,
        type,
        quality: session.quality.level,
      });

      this.emit("streaming_session_created", session);
      return session;
    } catch (error) {
      this.logger.error("Failed to create streaming session", {
        sessionId,
        type,
        error: (error as Error).message,
      });
      return null;
    }
  }

  /**
   * Start video streaming with real-time optimization
   */
  async startVideoStream(
    sessionId: string,
    request: VideoStreamRequest,
    context: StreamingContext,
  ): Promise<VideoStreamResponse | null> {
    if (!this.streamingAPI) {
      throw new Error("Streaming API not initialized");
    }

    const startTime = performance.now();

    try {
      const response = await this.streamingAPI.startVideoStream(
        sessionId,
        request,
        context,
      );

      const streamTime = performance.now() - startTime;
      this.validateStreamingLatency(streamTime, "video_start");

      this.emit("video_stream_started", {
        sessionId,
        request,
        response,
        latency: streamTime,
      });
      return response;
    } catch (error) {
      this.logger.error("Video stream start failed", {
        sessionId,
        streamId: request.id,
        error: (error as Error).message,
      });
      return null;
    }
  }

  /**
   * Start audio streaming with low-latency optimization
   */
  async startAudioStream(
    sessionId: string,
    request: AudioStreamRequest,
    context: StreamingContext,
  ): Promise<AudioStreamResponse | null> {
    if (!this.streamingAPI) {
      throw new Error("Streaming API not initialized");
    }

    const startTime = performance.now();

    try {
      const response = await this.streamingAPI.startAudioStream(
        sessionId,
        request,
        context,
      );

      const streamTime = performance.now() - startTime;
      this.validateStreamingLatency(streamTime, "audio_start");

      this.emit("audio_stream_started", {
        sessionId,
        request,
        response,
        latency: streamTime,
      });
      return response;
    } catch (error) {
      this.logger.error("Audio stream start failed", {
        sessionId,
        streamId: request.id,
        error: (error as Error).message,
      });
      return null;
    }
  }

  /**
   * Process multi-modal chunks with synchronization
   */
  async processMultiModalChunk(
    sessionId: string,
    chunk: MultiModalChunk,
  ): Promise<boolean> {
    if (!this.streamingAPI) {
      this.logger.warn("Streaming API not available for chunk processing");
      return false;
    }

    const startTime = performance.now();

    try {
      const success = await this.streamingAPI.processMultiModalChunk(
        sessionId,
        chunk,
      );

      const processingTime = performance.now() - startTime;
      this.validateStreamingLatency(processingTime, "chunk_processing");

      if (success) {
        this.emit("chunk_processed", {
          sessionId,
          chunk,
          latency: processingTime,
        });
      }

      return success;
    } catch (error) {
      this.logger.error("Chunk processing failed", {
        sessionId,
        chunkId: chunk.id,
        error: (error as Error).message,
      });
      return false;
    }
  }

  /**
   * Get streaming session metrics
   */
  getStreamingMetrics(sessionId?: string): any {
    if (!this.streamingAPI) {
      return null;
    }

    if (sessionId) {
      return this.streamingAPI.getSessionMetrics(sessionId);
    }

    // Return overall streaming statistics
    return this.streamingAPI.getPerformanceStatistics();
  }

  /**
   * Adapt stream quality in real-time
   */
  async adaptStreamQuality(
    sessionId: string,
    streamId: string,
    _targetQuality?: any,
  ): Promise<boolean> {
    if (!this.streamingAPI) {
      return false;
    }

    try {
      return await this.streamingAPI.adaptStreamQuality(sessionId, streamId);
    } catch (error) {
      this.logger.error("Quality adaptation failed", {
        sessionId,
        streamId,
        error: (error as Error).message,
      });
      return false;
    }
  }

  /**
   * End streaming session and cleanup
   */
  async endStreamingSession(sessionId: string): Promise<boolean> {
    if (!this.streamingAPI) {
      return false;
    }

    try {
      const success = await this.streamingAPI.endSession(sessionId);

      if (success) {
        this.streamingSessions.delete(sessionId);
        this.emit("streaming_session_ended", { sessionId });
      }

      return success;
    } catch (error) {
      this.logger.error("Failed to end streaming session", {
        sessionId,
        error: (error as Error).message,
      });
      return false;
    }
  }

  /**
   * Emergency stream degradation
   */
  async emergencyStreamDegrade(
    sessionId: string,
    reason: string,
  ): Promise<boolean> {
    if (!this.streamingAPI) {
      return false;
    }

    try {
      return await this.streamingAPI.emergencyDegrade(sessionId, reason);
    } catch (error) {
      this.logger.error("Emergency degradation failed", {
        sessionId,
        reason,
        error: (error as Error).message,
      });
      return false;
    }
  }

  // ===== PRIVATE HELPER METHODS =====

  /**
   * Initialize streaming API if enabled
   */
  private initializeStreaming(): void {
    if (this.config.streaming?.enabled && this.config.streaming.config) {
      try {
        this.streamingAPI = new EnhancedStreamingAPI(
          this.config.streaming.config,
        );

        // Setup streaming event handlers
        this.streamingAPI.on("session_created", (session) => {
          this.emit("streaming_session_created", session);
        });

        this.streamingAPI.on("quality_adapted", (event) => {
          this.emit("streaming_quality_adapted", event);
        });

        this.streamingAPI.on("session_error", (error) => {
          this.emit("streaming_error", error);
        });

        this.streamingAPI.on("performance_alert", (alert) => {
          this.emit("streaming_performance_alert", alert);
        });

        this.logger.info("Enhanced streaming API initialized successfully");
      } catch (error) {
        this.logger.error("Failed to initialize streaming API", {
          error: (error as Error).message,
        });
      }
    } else {
      this.logger.info("Streaming API disabled in configuration");
    }
  }

  /**
   * Validate streaming latency against targets
   */
  private validateStreamingLatency(
    actualLatency: number,
    operation: string,
  ): void {
    const targets = {
      video_start:
        this.config.streaming?.config.performance.multimediaLatencyTarget ||
        500,
      audio_start:
        this.config.streaming?.config.performance.multimediaLatencyTarget ||
        500,
      chunk_processing:
        this.config.streaming?.config.performance.textLatencyTarget || 100,
    };

    const target = targets[operation as keyof typeof targets] || 500;

    if (actualLatency > target) {
      this.logger.warn("Streaming latency target exceeded", {
        operation,
        actual: actualLatency,
        target,
        exceeded: actualLatency - target,
      });

      this.emit("streaming_latency_exceeded", {
        operation,
        actual: actualLatency,
        target,
        exceeded: actualLatency - target,
      });
    }
  }

  /**
   * Create default streaming configuration
   */
  private createDefaultStreamingConfig(): EnhancedStreamingConfig {
    return ({
      webrtc: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
        enableDataChannels: true,
        enableTranscoding: true,
      },
      caching: {
        enabled: true,
        ttl: 3600000, // 1 hour
        maxSize: 1000000000, // 1GB
        purgeStrategy: "lru",
        cdnEndpoints: ["https://cdn.example.com"],
        cacheKeys: {
          includeQuality: true,
          includeUser: false,
          includeSession: true,
        },
      },
      cdn: {
        provider: "cloudflare",
        endpoints: {
          primary: "https://cdn.example.com",
          fallback: ["https://cdn2.example.com"],
          geographic: {},
        },
        caching: {
          strategy: "adaptive",
          ttl: 3600000,
          edgeLocations: ["us-east", "eu-west", "ap-southeast"],
        },
        optimization: {
          compression: true,
          minification: true,
          imageSizing: true,
          formatConversion: true,
        },
      },
      synchronization: {
        enabled: true,
        tolerance: 50,
        maxDrift: 200,
        resyncThreshold: 500,
        method: "rtp",
        masterClock: "audio",
      },
      quality: {
        enableAdaptation: true,
        targetLatency: 100,
        adaptationSpeed: "medium",
        mlPrediction: true,
      },
      a2a: {
        enableCoordination: true,
        consensusThreshold: 0.6,
        failoverTimeout: 30000,
      },
      performance: {
        textLatencyTarget: 100,
        multimediaLatencyTarget: 500,
        enableOptimizations: true,
        monitoringInterval: 5000,
      },
      security: {
        enableEncryption: true,
        enableAuthentication: true,
        enableIntegrityChecks: true,
      },
    }) as unknown as EnhancedStreamingConfig;
  }

  // Helper methods
  private initializeMetrics(): UnifiedMetrics {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageLatency: 0,
      averageRoutingTime: 0,
      cacheHitRate: 0,
      modelDistribution: {},
      errorDistribution: {},
      costMetrics: {
        totalCost: 0,
        costPerRequest: 0,
        costPerToken: 0,
      },
      performanceMetrics: {
        p50Latency: 0,
        p95Latency: 0,
        p99Latency: 0,
        throughput: 0,
      },
    };
  }

  private updateErrorMetrics(error: AdapterError): void {
    this.metrics.errorDistribution[error.code] =
      (this.metrics.errorDistribution[error.code] || 0) + 1;
  }

  private estimateRequestCost(adapter: string, tokens: number): number {
    // Simplified cost estimation - would be enhanced with real pricing
    const baseCosts: Record<string, number> = {
      "gemini-2.0-flash": 0.000001,
      "gemini-2.5-flash": 0.0000006,
      "gemini-2.0-flash-thinking": 0.000002,
      "gemini-2.5-pro": 0.0000012,
      "gemini-2.5-deep-think": 0.000005, // Coming Soon - Ultra tier only
      "deepmind-2.5": 0.000005,
      "jules-workflow": 0.000003,
    };

    const costPerToken = baseCosts[adapter] || 0.000002;
    return tokens * costPerToken;
  }

  private getBudgetThreshold(userTier: string): number {
    const thresholds = {
      free: 0.001,
      pro: 0.01,
      enterprise: 0.1,
    };
    return thresholds[userTier as keyof typeof thresholds] || thresholds.free;
  }

  private calculateCustomScore(factors: any, _request: ModelRequest): number {
    // Custom scoring logic based on request context
    return (
      factors.latency * 0.4 +
      factors.capability * 0.3 +
      factors.availability * 0.2 +
      factors.cost * 0.1
    );
  }

  private generateReasoningExplanation(
    selected: { adapter: string; score: number; factors: any },
    _request: ModelRequest,
  ): string {
    const dominant = Object.entries(selected.factors).sort(
      ([, a], [, b]) => (b as number) - (a as number),
    )[0];

    return `Selected ${selected.adapter} (score: ${selected.score.toFixed(3)}) primarily due to ${dominant[0]} factor (${(dominant[1] as number).toFixed(3)})`;
  }

  private calculateAverageRoutingTime(): number {
    const recentDecisions = Array.from(this.routingDecisionCache.values())
      .filter((cached) => Date.now() - cached.timestamp < 60000) // Last minute
      .map((cached) => cached.decision.routingTime);

    if (recentDecisions.length === 0) return 0;
    return (
      recentDecisions.reduce((sum, time) => sum + time, 0) /
      recentDecisions.length
    );
  }

  private getTotalTokensProcessed(): number {
    // Calculate from performance history or maintain separate counter
    return this.metrics.totalRequests * 1000; // Estimated average
  }

  private sanitizeRequest(request: ModelRequest): any {
    return {
      promptLength: request.prompt.length,
      hasMultimodal: Boolean(request.multimodal),
      hasTools: Boolean(request.tools?.length),
      userTier: request.context?.userTier,
      priority: request.context?.priority,
    };
  }

  private sanitizeResponse(response: ModelResponse): any {
    return {
      contentLength: response.content.length,
      model: response.model,
      latency: response.latency,
      tokenUsage: response.usage,
      cost: response.cost,
      finishReason: response.finishReason,
    };
  }
}
