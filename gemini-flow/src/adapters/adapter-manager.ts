/**
 * Adapter Manager
 * 
 * Central management for all model adapters with advanced error handling,
 * fallback strategies, and performance optimization
 */

import { EventEmitter } from 'events';
import { Logger } from '../utils/logger.js';
import { UnifiedAPI, UnifiedAPIConfig, RoutingDecision, UnifiedMetrics } from './unified-api.js';
import { 
  ModelRequest, 
  ModelResponse, 
  StreamChunk, 
  AdapterError,
  HealthCheck 
} from './base-model-adapter.js';

export interface AdapterManagerConfig {
  unifiedAPI: UnifiedAPIConfig;
  errorHandling: {
    maxRetries: number;
    retryBackoff: 'linear' | 'exponential' | 'fixed';
    retryDelay: number;
    fallbackChain: string[];
    emergencyFallback: string;
    errorThreshold: number;
  };
  performanceOptimization: {
    routingOptimization: boolean;
    adaptiveTimeouts: boolean;
    predictiveScaling: boolean;
    costOptimization: boolean;
    qualityMonitoring: boolean;
  };
  monitoring: {
    detailedLogging: boolean;
    performanceTracking: boolean;
    errorAnalytics: boolean;
    usageAnalytics: boolean;
    alerting: {
      enabled: boolean;
      thresholds: {
        errorRate: number;
        latency: number;
        availability: number;
      };
      webhooks: string[];
    };
  };
}

export interface AdapterStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'offline';
  health: HealthCheck;
  metrics: {
    requests: number;
    errors: number;
    avgLatency: number;
    successRate: number;
  };
  capabilities: string[];
  lastUsed: Date;
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'critical';
  adapters: AdapterStatus[];
  metrics: UnifiedMetrics;
  alerts: Array<{
    level: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    timestamp: Date;
    adapter?: string;
  }>;
}

export class AdapterManager extends EventEmitter {
  private logger: Logger;
  private config: AdapterManagerConfig;
  private unifiedAPI: UnifiedAPI;
  private systemHealth: SystemHealth;
  private alerts: Array<any> = [];
  private performancePredictor: PerformancePredictor;

  // Advanced error handling
  private errorPatterns = new Map<string, { count: number; lastSeen: Date; pattern: RegExp }>();
  private adaptiveThresholds = new Map<string, number>();
  private fallbackHistory = new Map<string, Array<{ adapter: string; success: boolean; timestamp: Date }>>();

  constructor(config: AdapterManagerConfig) {
    super();
    this.logger = new Logger('AdapterManager');
    this.config = config;
    this.unifiedAPI = new UnifiedAPI(config.unifiedAPI);
    this.performancePredictor = new PerformancePredictor();
    this.systemHealth = this.initializeSystemHealth();

    this.setupEventHandlers();
    this.startMonitoring();
  }

  /**
   * Enhanced generation with comprehensive error handling
   */
  async generate(request: ModelRequest): Promise<ModelResponse> {
    const startTime = performance.now();
    const requestId = request.context?.requestId || `req-${Date.now()}`;

    this.logger.info('Generation request started', {
      requestId,
      userTier: request.context?.userTier,
      priority: request.context?.priority,
      promptLength: request.prompt.length
    });

    try {
      // Pre-request optimization
      const optimizedRequest = await this.optimizeRequest(request);
      
      // Execute with retry logic and fallback chain
      const response = await this.executeWithFallbackChain(optimizedRequest);
      
      // Post-request processing
      await this.processSuccessfulResponse(response, optimizedRequest, startTime);
      
      return response;

    } catch (error) {
      await this.processFailedRequest(error as AdapterError, request, startTime);
      throw error;
    }
  }

  /**
   * Enhanced streaming with error recovery
   */
  async *generateStream(request: ModelRequest): AsyncIterableIterator<StreamChunk> {
    const requestId = request.context?.requestId || `stream-req-${Date.now()}`;
    
    this.logger.info('Streaming request started', { requestId });

    try {
      const optimizedRequest = await this.optimizeRequest(request);
      
      // Stream with error recovery
      yield* this.streamWithRecovery(optimizedRequest);

    } catch (error) {
      this.logger.error('Streaming request failed', {
        requestId,
        error: (error as Error).message
      });
      throw error;
    }
  }

  /**
   * Execute request with comprehensive fallback chain
   */
  private async executeWithFallbackChain(request: ModelRequest): Promise<ModelResponse> {
    const fallbackChain = [...this.config.errorHandling.fallbackChain];
    let lastError: AdapterError | undefined;
    
    for (let attempt = 0; attempt <= this.config.errorHandling.maxRetries; attempt++) {
      try {
        // Get routing decision
        const routingDecision = await this.unifiedAPI.getRoutingDecision(request);
        
        // Attempt execution
        const response = await this.unifiedAPI.generate(request);
        
        // Success - update fallback history
        this.updateFallbackHistory(routingDecision.selectedAdapter, true);
        
        return response;

      } catch (error) {
        lastError = error as AdapterError;
        
        this.logger.warn('Request attempt failed', {
          attempt,
          error: lastError.message,
          adapter: lastError.model,
          retryable: lastError.retryable
        });

        // Update error patterns and fallback history
        this.updateErrorPatterns(lastError);
        this.updateFallbackHistory(lastError.model || 'unknown', false);

        // Check if we should retry
        if (!lastError.retryable || attempt >= this.config.errorHandling.maxRetries) {
          break;
        }

        // Apply backoff delay
        const delay = this.calculateBackoffDelay(attempt);
        await new Promise(resolve => setTimeout(resolve, delay));

        // Try next adapter in fallback chain
        if (fallbackChain.length > 0) {
          const nextAdapter = fallbackChain.shift()!;
          request = {
            ...request,
            metadata: {
              ...(request.metadata || {}),
              preferredAdapter: nextAdapter
            }
          };
        }
      }
    }

    // All attempts failed - try emergency fallback
    if (this.config.errorHandling.emergencyFallback) {
      try {
        this.logger.warn('Attempting emergency fallback', {
          fallback: this.config.errorHandling.emergencyFallback
        });

        const emergencyRequest = {
          ...request,
          metadata: {
            ...(request.metadata || {}),
            preferredAdapter: this.config.errorHandling.emergencyFallback,
            emergency: true
          }
        };

        return await this.unifiedAPI.generate(emergencyRequest);

      } catch (emergencyError) {
        this.logger.error('Emergency fallback failed', {
          error: (emergencyError as Error).message
        });
      }
    }

    // Complete failure
    throw lastError || new Error('All fallback attempts failed');
  }

  /**
   * Stream with error recovery and reconnection
   */
  private async *streamWithRecovery(request: ModelRequest): AsyncIterableIterator<StreamChunk> {
    let reconnectAttempts = 0;
    const maxReconnects = 3;
    
    while (reconnectAttempts <= maxReconnects) {
      try {
        let chunkCount = 0;
        const stream = this.unifiedAPI.generateStream(request);
        
        for await (const chunk of stream) {
          chunkCount++;
          yield chunk;
        }
        
        // Stream completed successfully
        this.logger.info('Stream completed', { chunks: chunkCount });
        return;

      } catch (error) {
        const streamError = error as AdapterError;
        
        this.logger.warn('Stream error occurred', {
          attempt: reconnectAttempts,
          error: streamError.message,
          retryable: streamError.retryable
        });

        if (!streamError.retryable || reconnectAttempts >= maxReconnects) {
          throw streamError;
        }

        reconnectAttempts++;
        
        // Wait before reconnecting
        await new Promise(resolve => setTimeout(resolve, 1000 * reconnectAttempts));
        
        // Modify request for retry (e.g., different adapter)
        request = {
          ...request,
          context: {
            ...(request.context || { requestId: `retry-${Date.now()}`, priority: 'medium' as const, userTier: 'free' as const, latencyTarget: 5000 }),
            retryCount: reconnectAttempts
          }
        };
      }
    }
  }

  /**
   * Optimize request based on patterns and predictions
   */
  private async optimizeRequest(request: ModelRequest): Promise<ModelRequest> {
    if (!this.config.performanceOptimization.routingOptimization) {
      return request;
    }

    const optimized = { ...request };

    // Adaptive timeout based on request complexity
    if (this.config.performanceOptimization.adaptiveTimeouts) {
      const predictedLatency = this.performancePredictor.predictLatency(request);
      optimized.context = {
        ...(optimized.context || { requestId: `opt-${Date.now()}`, priority: 'medium' as const, userTier: 'free' as const, latencyTarget: 5000 }),
        latencyTarget: Math.min(predictedLatency * 1.5, 30000) // Max 30s
      };
    }

    // Cost optimization for non-enterprise users
    if (this.config.performanceOptimization.costOptimization) {
      const userTier = request.context?.userTier || 'free';
      if (userTier !== 'enterprise') {
        optimized.parameters = {
          ...optimized.parameters,
          maxTokens: Math.min(optimized.parameters?.maxTokens || 4096, 8192)
        };
      }
    }

    // Quality monitoring adjustments
    if (this.config.performanceOptimization.qualityMonitoring) {
      const qualityHints = this.analyzeQualityRequirements(request.prompt);
      if (qualityHints.requiresReasoning) {
        optimized.metadata = {
          ...(optimized.metadata || {}),
          preferReasoningModels: true
        };
      }
    }

    return optimized;
  }

  /**
   * Process successful response
   */
  private async processSuccessfulResponse(
    response: ModelResponse, 
    request: ModelRequest, 
    startTime: number
  ): Promise<void> {
    const totalLatency = performance.now() - startTime;
    
    // Update performance predictor
    this.performancePredictor.recordPerformance({
      request,
      response,
      latency: totalLatency
    });

    // Quality monitoring
    if (this.config.performanceOptimization.qualityMonitoring) {
      const qualityScore = this.assessResponseQuality(response, request);
      if (qualityScore < 0.7) { // Below threshold
        this.logger.warn('Low quality response detected', {
          score: qualityScore,
          model: response.model,
          requestId: request.context?.requestId
        });
      }
    }

    // Usage analytics
    if (this.config.monitoring.usageAnalytics) {
      this.recordUsageAnalytics({
        userTier: request.context?.userTier,
        model: response.model,
        tokenUsage: response.usage.totalTokens,
        cost: response.cost,
        latency: totalLatency
      });
    }

    this.logger.info('Request completed successfully', {
      requestId: request.context?.requestId,
      model: response.model,
      latency: totalLatency,
      tokens: response.usage.totalTokens,
      cost: response.cost
    });
  }

  /**
   * Process failed request
   */
  private async processFailedRequest(
    error: AdapterError, 
    request: ModelRequest, 
    startTime: number
  ): Promise<void> {
    const totalLatency = performance.now() - startTime;
    
    // Error analytics
    if (this.config.monitoring.errorAnalytics) {
      this.analyzeError(error, request);
    }

    // Check if this triggers an alert
    await this.checkAlertThresholds(error);

    this.logger.error('Request failed', {
      requestId: request.context?.requestId,
      error: error.message,
      code: error.code,
      model: error.model,
      latency: totalLatency,
      retryable: error.retryable
    });
  }

  /**
   * Update error patterns for intelligent error handling
   */
  private updateErrorPatterns(error: AdapterError): void {
    const pattern = this.classifyErrorPattern(error);
    const existing = this.errorPatterns.get(pattern.key);
    
    if (existing) {
      existing.count++;
      existing.lastSeen = new Date();
    } else {
      this.errorPatterns.set(pattern.key, {
        count: 1,
        lastSeen: new Date(),
        pattern: pattern.regex
      });
    }

    // Adjust thresholds based on error patterns
    if (existing && existing.count > 5) {
      const adapter = error.model || 'unknown';
      const currentThreshold = this.adaptiveThresholds.get(adapter) || 5;
      this.adaptiveThresholds.set(adapter, Math.max(2, currentThreshold - 1));
      
      this.logger.info('Adjusted error threshold', {
        adapter,
        newThreshold: this.adaptiveThresholds.get(adapter),
        errorPattern: pattern.key
      });
    }
  }

  /**
   * Update fallback history for intelligent routing
   */
  private updateFallbackHistory(adapter: string, success: boolean): void {
    let history = this.fallbackHistory.get(adapter);
    if (!history) {
      history = [];
      this.fallbackHistory.set(adapter, history);
    }

    history.push({
      adapter,
      success,
      timestamp: new Date()
    });

    // Keep only recent history (last 100 entries)
    if (history.length > 100) {
      history.shift();
    }
  }

  /**
   * Calculate backoff delay with different strategies
   */
  private calculateBackoffDelay(attempt: number): number {
    const baseDelay = this.config.errorHandling.retryDelay;
    
    switch (this.config.errorHandling.retryBackoff) {
      case 'linear':
        return baseDelay * (attempt + 1);
      case 'exponential':
        return baseDelay * Math.pow(2, attempt);
      case 'fixed':
      default:
        return baseDelay;
    }
  }

  /**
   * Classify error patterns for intelligent handling
   */
  private classifyErrorPattern(error: AdapterError): { key: string; regex: RegExp } {
    const message = error.message.toLowerCase();
    
    if (message.includes('rate limit') || message.includes('quota')) {
      return { key: 'rate_limit', regex: /(rate limit|quota|throttl)/i };
    }
    
    if (message.includes('timeout') || message.includes('deadline')) {
      return { key: 'timeout', regex: /(timeout|deadline|slow)/i };
    }
    
    if (message.includes('network') || message.includes('connection')) {
      return { key: 'network', regex: /(network|connection|socket)/i };
    }
    
    if (message.includes('auth') || message.includes('permission')) {
      return { key: 'auth', regex: /(auth|permission|unauthorized|forbidden)/i };
    }
    
    if (message.includes('safety') || message.includes('policy')) {
      return { key: 'safety', regex: /(safety|policy|violation|blocked)/i };
    }
    
    return { key: 'unknown', regex: /.*/i };
  }

  /**
   * Analyze quality requirements from prompt
   */
  private analyzeQualityRequirements(prompt: string): { requiresReasoning: boolean; complexity: number } {
    const reasoningKeywords = ['analyze', 'compare', 'evaluate', 'synthesize', 'reason', 'explain why'];
    const complexityKeywords = ['step by step', 'detailed', 'comprehensive', 'thorough'];
    
    const requiresReasoning = reasoningKeywords.some(kw => prompt.toLowerCase().includes(kw));
    const complexityScore = complexityKeywords.reduce((score, kw) => 
      score + (prompt.toLowerCase().includes(kw) ? 1 : 0), 0
    );
    
    return {
      requiresReasoning,
      complexity: Math.min(complexityScore / complexityKeywords.length, 1.0)
    };
  }

  /**
   * Assess response quality
   */
  private assessResponseQuality(response: ModelResponse, request: ModelRequest): number {
    let score = 1.0;
    
    // Length appropriateness
    const expectedLength = Math.min(request.prompt.length * 2, 4000);
    if (response.content.length < expectedLength * 0.3) score -= 0.2;
    
    // Finish reason
    if (response.finishReason !== 'STOP') score -= 0.3;
    
    // Response relevance (basic keyword matching)
    const promptKeywords = request.prompt.toLowerCase().split(/\s+/)
      .filter(word => word.length > 4)
      .slice(0, 10);
    
    const responseKeywords = response.content.toLowerCase();
    const keywordMatches = promptKeywords.filter(kw => responseKeywords.includes(kw)).length;
    const relevanceScore = keywordMatches / Math.max(promptKeywords.length, 1);
    score = score * (0.7 + relevanceScore * 0.3);
    
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Record usage analytics
   */
  private recordUsageAnalytics(data: any): void {
    // Implementation would send to analytics service
    this.emit('usage_analytics', data);
  }

  /**
   * Analyze error for patterns and insights
   */
  private analyzeError(error: AdapterError, request: ModelRequest): void {
    const analysis = {
      errorCode: error.code,
      model: error.model,
      userTier: request.context?.userTier,
      promptLength: request.prompt.length,
      timestamp: new Date(),
      retryable: error.retryable
    };
    
    this.emit('error_analysis', analysis);
  }

  /**
   * Check if error triggers alert thresholds
   */
  private async checkAlertThresholds(_error: AdapterError): Promise<void> {
    if (!this.config.monitoring.alerting.enabled) return;

    const metrics = this.unifiedAPI.getMetrics();
    const thresholds = this.config.monitoring.alerting.thresholds;
    
    // Error rate check
    const errorRate = metrics.failedRequests / metrics.totalRequests;
    if (errorRate > thresholds.errorRate) {
      await this.triggerAlert('error', `Error rate exceeded threshold: ${errorRate.toFixed(3)} > ${thresholds.errorRate}`);
    }
    
    // Latency check
    if (metrics.averageLatency > thresholds.latency) {
      await this.triggerAlert('warning', `Average latency exceeded threshold: ${metrics.averageLatency.toFixed(0)}ms > ${thresholds.latency}ms`);
    }
  }

  /**
   * Trigger alert to configured webhooks
   */
  private async triggerAlert(level: string, message: string): Promise<void> {
    const alert = {
      level,
      message,
      timestamp: new Date(),
      systemHealth: this.systemHealth
    };
    
    this.alerts.push(alert);
    this.emit('alert', alert);
    
    // Send to webhooks
    const webhookPromises = this.config.monitoring.alerting.webhooks.map(async webhook => {
      try {
        await fetch(webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(alert)
        });
      } catch (error) {
        this.logger.error('Failed to send alert to webhook', { webhook, error });
      }
    });
    
    await Promise.allSettled(webhookPromises);
  }

  /**
   * Setup event handlers for unified API
   */
  private setupEventHandlers(): void {
    this.unifiedAPI.on('request_completed', (data) => {
      this.updateSystemHealth(data);
    });
    
    this.unifiedAPI.on('request_failed', (data) => {
      this.updateSystemHealth(data);
    });
    
    this.unifiedAPI.on('health_check', (data) => {
      this.updateAdapterHealth(data);
    });
  }

  /**
   * Start monitoring processes
   */
  private startMonitoring(): void {
    // System health monitoring
    setInterval(() => {
      this.updateSystemHealthOverall();
    }, 30000); // Every 30 seconds
    
    // Performance prediction model training
    setInterval(() => {
      this.performancePredictor.trainModel();
    }, 300000); // Every 5 minutes
    
    // Alert cleanup (remove old alerts)
    setInterval(() => {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours
      this.alerts = this.alerts.filter(alert => alert.timestamp > cutoff);
    }, 3600000); // Every hour
  }

  /**
   * Update system health based on events
   */
  private updateSystemHealth(data: any): void {
    // Update adapter-specific metrics
    const adapterStatus = this.systemHealth.adapters.find(a => a.name === data.adapter);
    if (adapterStatus) {
      adapterStatus.metrics.requests++;
      if (data.success) {
        adapterStatus.metrics.requests++;
      } else {
        adapterStatus.metrics.errors++;
      }
      adapterStatus.metrics.avgLatency = (adapterStatus.metrics.avgLatency + data.latency) / 2;
      adapterStatus.metrics.successRate = adapterStatus.metrics.requests / (adapterStatus.metrics.requests + adapterStatus.metrics.errors);
      adapterStatus.lastUsed = new Date();
    }
  }

  /**
   * Update adapter health from health checks
   */
  private updateAdapterHealth(data: { adapter: string; health: HealthCheck }): void {
    const adapterStatus = this.systemHealth.adapters.find(a => a.name === data.adapter);
    if (adapterStatus) {
      adapterStatus.health = data.health;
      adapterStatus.status = data.health.status;
    }
  }

  /**
   * Update overall system health
   */
  private updateSystemHealthOverall(): void {
    const adapters = this.systemHealth.adapters;
    const healthyCount = adapters.filter(a => a.status === 'healthy').length;
    const totalCount = adapters.length;
    
    if (healthyCount === totalCount) {
      this.systemHealth.overall = 'healthy';
    } else if (healthyCount >= totalCount * 0.7) {
      this.systemHealth.overall = 'degraded';
    } else {
      this.systemHealth.overall = 'critical';
    }
    
    // Update metrics
    this.systemHealth.metrics = this.unifiedAPI.getMetrics();
    
    this.emit('system_health_updated', this.systemHealth);
  }

  /**
   * Initialize system health structure
   */
  private initializeSystemHealth(): SystemHealth {
    return {
      overall: 'healthy',
      adapters: [],
      metrics: {
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
          costPerToken: 0
        },
        performanceMetrics: {
          p50Latency: 0,
          p95Latency: 0,
          p99Latency: 0,
          throughput: 0
        }
      },
      alerts: []
    };
  }

  // Public API methods
  async getSystemHealth(): Promise<SystemHealth> {
    this.updateSystemHealthOverall();
    return { ...this.systemHealth };
  }

  async getMetrics(): Promise<UnifiedMetrics> {
    return this.unifiedAPI.getMetrics();
  }

  async getRoutingDecision(request: ModelRequest): Promise<RoutingDecision> {
    return this.unifiedAPI.getRoutingDecision(request);
  }

  async healthCheck(): Promise<Record<string, HealthCheck>> {
    return this.unifiedAPI.getAdapterHealth();
  }

  getErrorPatterns(): Map<string, any> {
    return new Map(this.errorPatterns);
  }

  getFallbackHistory(): Map<string, any> {
    return new Map(this.fallbackHistory);
  }
}

/**
 * Performance Predictor for adaptive optimization
 */
class PerformancePredictor {
  private trainingData: Array<{ request: ModelRequest; response: ModelResponse; latency: number }> = [];
  // Would be actual ML model in production - removed unused field

  recordPerformance(data: { request: ModelRequest; response: ModelResponse; latency: number }): void {
    this.trainingData.push(data);
    
    // Keep only recent data (last 1000 entries)
    if (this.trainingData.length > 1000) {
      this.trainingData.shift();
    }
  }

  predictLatency(request: ModelRequest): number {
    if (this.trainingData.length < 10) {
      return 2000; // Default prediction
    }

    // Simple heuristic-based prediction (would be ML model in production)
    const promptLength = request.prompt.length;
    const hasMultimodal = Boolean(request.multimodal);
    const maxTokens = request.parameters?.maxTokens || 4096;
    
    // Use the variables in calculation
    let latencyPrediction = 1000 + (promptLength * 0.5);
    latencyPrediction += hasMultimodal ? 500 : 0;
    latencyPrediction += (maxTokens / 1000) * 100;
    
    return Math.min(latencyPrediction, 30000); // Cap at 30s
    
    let prediction = 500; // Base latency
    prediction += promptLength * 0.1; // Text processing time
    prediction += maxTokens * 0.2; // Generation time
    if (hasMultimodal) prediction *= 1.5; // Multimodal overhead
    
    return Math.min(prediction, 30000); // Cap at 30s
  }

  trainModel(): void {
    if (this.trainingData.length < 50) return;
    
    // In production, this would train an actual ML model
    // For now, we just log that training occurred
    console.log(`Performance predictor trained with ${this.trainingData.length} samples`);
  }
}