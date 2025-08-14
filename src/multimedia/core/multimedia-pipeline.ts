/**
 * Unified Multimedia Pipeline
 * 
 * Orchestrates Imagen 4, Chirp Audio, and Lyria Music generation
 * with shared infrastructure and optimizations
 */

import { EventEmitter } from 'events';
import { Logger } from '../../utils/logger.js';
import { PerformanceMonitor } from '../../core/performance-monitor.js';
import { CacheManager } from '../../core/cache-manager.js';
import {
  MultimediaPipelineConfig,
  MultimediaPipelineResponse,
  MultimediaGenerationRequest,
  MultimediaGenerationResponse,
  MultimediaContext,
  PipelineStage,
  BatchStrategy,
  MonitoringConfig,
  SecurityConfig,
  MultimediaMetadata
} from '../../types/multimedia.js';

import { ImageGenerationPipeline } from '../image/image-generation-pipeline.js';
import { AudioProcessor } from '../audio/audio-processor.js';
import { MusicComposer } from '../music/music-composer.js';

export class MultimediaPipeline extends EventEmitter {
  private logger: Logger;
  private config: MultimediaPipelineConfig;
  private performance: PerformanceMonitor;
  private cache: CacheManager;
  
  // Specialized processors
  private imageGenerator: ImageGenerationPipeline;
  private audioProcessor: AudioProcessor;
  private musicComposer: MusicComposer;
  
  // Pipeline state
  private activeRequests: Map<string, MultimediaPipelineResponse> = new Map();
  private requestQueue: Array<{
    request: MultimediaGenerationRequest;
    context: MultimediaContext;
    resolve: (result: MultimediaGenerationResponse) => void;
    reject: (error: Error) => void;
  }> = [];
  
  // Batch processing
  private batchQueues: Map<string, MultimediaGenerationRequest[]> = new Map();
  private batchTimers: Map<string, NodeJS.Timeout> = new Map();
  
  // Metrics
  private metrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    imageRequests: 0,
    audioRequests: 0,
    musicRequests: 0,
    batchRequests: 0,
    cacheHits: 0,
    totalLatency: 0,
    totalCost: 0,
    activeConnections: 0
  };

  constructor(config: MultimediaPipelineConfig) {
    super();
    this.config = config;
    this.logger = new Logger('MultimediaPipeline');
    this.performance = new PerformanceMonitor();
    
    // Initialize shared cache with multimedia-optimized settings
    this.cache = new CacheManager({
      maxMemorySize: 200 * 1024 * 1024, // 200MB for multimedia content
      defaultTTL: this.config.shared.caching.ttl,
      evictionPolicy: this.config.shared.caching.evictionPolicy,
      compression: true // Enable compression for large multimedia data
    });

    // Initialize specialized processors
    this.imageGenerator = new ImageGenerationPipeline(config.image);
    this.audioProcessor = new AudioProcessor(config.audio);
    this.musicComposer = new MusicComposer(config.music);

    this.setupEventHandlers();
    this.initializePipeline();
  }

  /**
   * Initialize the multimedia pipeline
   */
  private async initializePipeline(): Promise<void> {
    try {
      this.logger.info('Initializing multimedia pipeline...');

      // Initialize all processors in parallel
      await Promise.all([
        this.imageGenerator.initialize(),
        this.audioProcessor.initialize(),
        this.musicComposer.initialize()
      ]);

      // Start monitoring if enabled
      if (this.config.shared.monitoring.enabled) {
        this.startMonitoring();
      }

      // Setup batch processing
      if (this.config.shared.batching.enabled) {
        this.setupBatchProcessing();
      }

      this.logger.info('Multimedia pipeline initialized successfully');
      this.emit('initialized');

    } catch (error) {
      this.logger.error('Failed to initialize multimedia pipeline', error);
      throw error;
    }
  }

  /**
   * Setup event handlers for processors
   */
  private setupEventHandlers(): void {
    // Image generation events
    this.imageGenerator.on('generation_completed', (data) => {
      this.handleProcessorEvent('image', 'completed', data);
    });

    this.imageGenerator.on('generation_failed', (data) => {
      this.handleProcessorEvent('image', 'failed', data);
    });

    // Audio processing events
    this.audioProcessor.on('audio_generated', (data) => {
      this.handleProcessorEvent('audio', 'completed', data);
    });

    this.audioProcessor.on('audio_failed', (data) => {
      this.handleProcessorEvent('audio', 'failed', data);
    });

    // Music composition events
    this.musicComposer.on('composition_completed', (data) => {
      this.handleProcessorEvent('music', 'completed', data);
    });

    this.musicComposer.on('composition_failed', (data) => {
      this.handleProcessorEvent('music', 'failed', data);
    });
  }

  /**
   * Handle events from specialized processors
   */
  private handleProcessorEvent(type: string, status: string, data: any): void {
    const requestId = data.requestId || data.id;
    const activeRequest = this.activeRequests.get(requestId);

    if (activeRequest) {
      if (status === 'completed') {
        activeRequest.status = 'completed';
        activeRequest.result = data;
        activeRequest.progress = 1.0;
        this.metrics.successfulRequests++;
      } else if (status === 'failed') {
        activeRequest.status = 'failed';
        activeRequest.error = data.error || 'Processing failed';
        this.metrics.failedRequests++;
      }

      // Update pipeline stages
      this.updatePipelineStages(activeRequest, status);

      // Emit unified event
      this.emit('request_updated', activeRequest);

      // Clean up completed/failed requests
      if (status === 'completed' || status === 'failed') {
        this.activeRequests.delete(requestId);
      }
    }
  }

  /**
   * Generate multimedia content
   */
  async generate(
    request: MultimediaGenerationRequest,
    context: MultimediaContext
  ): Promise<MultimediaGenerationResponse> {
    const startTime = performance.now();
    const requestId = context.requestId;
    
    this.metrics.totalRequests++;

    try {
      // Validate request
      await this.validateRequest(request, context);

      // Check cache first
      const cacheKey = this.generateCacheKey(request, context);
      if (this.config.shared.caching.enabled) {
        const cachedResult = await this.cache.get(cacheKey);
        if (cachedResult) {
          this.metrics.cacheHits++;
          this.logger.debug('Cache hit for multimedia request', { requestId });
          return cachedResult;
        }
      }

      // Create pipeline response
      const pipelineResponse: MultimediaPipelineResponse = {
        id: requestId,
        type: this.getRequestType(request),
        status: 'pending',
        progress: 0,
        metadata: this.createMetadata(requestId, startTime),
        pipeline: {
          stages: this.createPipelineStages(request),
          currentStage: 0,
          estimatedCompletion: new Date(Date.now() + this.estimateCompletionTime(request))
        }
      };

      this.activeRequests.set(requestId, pipelineResponse);

      // Check if batch processing is enabled and appropriate
      if (this.shouldBatch(request, context)) {
        return await this.enqueueBatchRequest(request, context);
      }

      // Process request directly
      const result = await this.processRequest(request, context, pipelineResponse);

      // Cache successful results
      if (this.config.shared.caching.enabled && result) {
        await this.cache.set(cacheKey, result, this.config.shared.caching.ttl);
      }

      // Update metrics
      const latency = performance.now() - startTime;
      this.metrics.totalLatency += latency;
      this.metrics.successfulRequests++;

      // Record performance
      this.performance.recordMetric('multimedia_generation_latency', latency);
      this.performance.recordMetric('multimedia_generation_cost', result.metadata.cost);

      this.logger.info('Multimedia generation completed', {
        requestId,
        type: pipelineResponse.type,
        latency,
        cost: result.metadata.cost
      });

      return result;

    } catch (error) {
      this.metrics.failedRequests++;
      
      const latency = performance.now() - startTime;
      this.logger.error('Multimedia generation failed', {
        requestId,
        latency,
        error: error.message
      });

      throw error;
    }
  }

  /**
   * Process multimedia request
   */
  private async processRequest(
    request: MultimediaGenerationRequest,
    context: MultimediaContext,
    pipelineResponse: MultimediaPipelineResponse
  ): Promise<MultimediaGenerationResponse> {
    pipelineResponse.status = 'processing';
    pipelineResponse.progress = 0.1;
    this.emit('request_updated', pipelineResponse);

    const requestType = this.getRequestType(request);

    try {
      let result: MultimediaGenerationResponse;

      switch (requestType) {
        case 'image':
          this.metrics.imageRequests++;
          pipelineResponse.pipeline.currentStage = 1;
          result = await this.imageGenerator.generateImage(request as any);
          break;

        case 'audio':
          this.metrics.audioRequests++;
          pipelineResponse.pipeline.currentStage = 1;
          result = await this.audioProcessor.generateAudio(request as any);
          break;

        case 'music':
          this.metrics.musicRequests++;
          pipelineResponse.pipeline.currentStage = 1;
          result = await this.musicComposer.composeMusic(request as any);
          break;

        default:
          throw new Error(`Unsupported request type: ${requestType}`);
      }

      // Apply post-processing
      pipelineResponse.pipeline.currentStage = 2;
      pipelineResponse.progress = 0.8;
      this.emit('request_updated', pipelineResponse);

      const processedResult = await this.applyPostProcessing(result, context);

      pipelineResponse.status = 'completed';
      pipelineResponse.progress = 1.0;
      pipelineResponse.result = processedResult;
      this.emit('request_updated', pipelineResponse);

      return processedResult;

    } catch (error) {
      pipelineResponse.status = 'failed';
      pipelineResponse.error = error.message;
      this.emit('request_updated', pipelineResponse);
      throw error;
    }
  }

  /**
   * Stream multimedia generation
   */
  async *generateStream(
    request: MultimediaGenerationRequest,
    context: MultimediaContext
  ): AsyncIterableIterator<MultimediaPipelineResponse> {
    const requestId = context.requestId;
    const requestType = this.getRequestType(request);

    // Create initial response
    const pipelineResponse: MultimediaPipelineResponse = {
      id: requestId,
      type: requestType,
      status: 'processing',
      progress: 0,
      metadata: this.createMetadata(requestId, performance.now()),
      pipeline: {
        stages: this.createPipelineStages(request),
        currentStage: 0,
        estimatedCompletion: new Date(Date.now() + this.estimateCompletionTime(request))
      }
    };

    yield pipelineResponse;

    try {
      switch (requestType) {
        case 'audio':
          if (this.audioProcessor.supportsStreaming()) {
            for await (const chunk of this.audioProcessor.generateAudioStream(request as any)) {
              pipelineResponse.progress = chunk.progress || 0;
              pipelineResponse.result = chunk;
              yield pipelineResponse;
            }
          } else {
            // Fallback to regular generation with progress updates
            const result = await this.processRequest(request, context, pipelineResponse);
            pipelineResponse.result = result;
            yield pipelineResponse;
          }
          break;

        case 'music':
          if (this.musicComposer.supportsStreaming()) {
            for await (const chunk of this.musicComposer.composeMusicStream(request as any)) {
              pipelineResponse.progress = chunk.progress || 0;
              pipelineResponse.result = chunk;
              yield pipelineResponse;
            }
          } else {
            // Fallback to regular generation with progress updates
            const result = await this.processRequest(request, context, pipelineResponse);
            pipelineResponse.result = result;
            yield pipelineResponse;
          }
          break;

        default:
          // For non-streaming requests, provide progress updates
          const result = await this.processRequest(request, context, pipelineResponse);
          pipelineResponse.result = result;
          yield pipelineResponse;
      }

      pipelineResponse.status = 'completed';
      pipelineResponse.progress = 1.0;
      yield pipelineResponse;

    } catch (error) {
      pipelineResponse.status = 'failed';
      pipelineResponse.error = error.message;
      yield pipelineResponse;
    }
  }

  /**
   * Batch process multiple requests
   */
  async batchGenerate(
    requests: Array<{
      request: MultimediaGenerationRequest;
      context: MultimediaContext;
    }>
  ): Promise<MultimediaGenerationResponse[]> {
    this.metrics.batchRequests++;
    
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.logger.info('Starting batch generation', {
      batchId,
      requestCount: requests.length
    });

    try {
      // Group requests by type for optimal processing
      const groupedRequests = this.groupRequestsByType(requests);
      const results: MultimediaGenerationResponse[] = [];

      // Process each group
      for (const [type, typeRequests] of groupedRequests) {
        const typeResults = await this.processBatchByType(type, typeRequests, batchId);
        results.push(...typeResults);
      }

      this.logger.info('Batch generation completed', {
        batchId,
        requestCount: requests.length,
        successCount: results.length
      });

      return results;

    } catch (error) {
      this.logger.error('Batch generation failed', {
        batchId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Validate multimedia request
   */
  private async validateRequest(
    request: MultimediaGenerationRequest,
    context: MultimediaContext
  ): Promise<void> {
    // Basic validation
    if (!request || typeof request !== 'object') {
      throw new Error('Invalid request object');
    }

    if (!context.requestId) {
      throw new Error('Request ID is required');
    }

    // Type-specific validation
    const requestType = this.getRequestType(request);
    
    switch (requestType) {
      case 'image':
        await this.imageGenerator.validateRequest(request as any);
        break;
      case 'audio':
        await this.audioProcessor.validateRequest(request as any);
        break;
      case 'music':
        await this.musicComposer.validateRequest(request as any);
        break;
      default:
        throw new Error(`Unknown request type: ${requestType}`);
    }

    // Security validation
    if (this.config.shared.security.contentFiltering) {
      await this.validateContent(request);
    }

    // Budget validation
    if (context.budget) {
      await this.validateBudget(request, context);
    }
  }

  /**
   * Validate content for safety
   */
  private async validateContent(request: MultimediaGenerationRequest): Promise<void> {
    // Implement content safety validation
    // This would integrate with Google's safety APIs
    
    if ('prompt' in request && request.prompt) {
      // Check for harmful content in prompts
      const safetyCheck = await this.checkContentSafety(request.prompt);
      if (!safetyCheck.safe) {
        throw new Error(`Content policy violation: ${safetyCheck.reason}`);
      }
    }

    if ('text' in request && request.text) {
      // Check for harmful content in text
      const safetyCheck = await this.checkContentSafety(request.text);
      if (!safetyCheck.safe) {
        throw new Error(`Content policy violation: ${safetyCheck.reason}`);
      }
    }
  }

  /**
   * Check content safety
   */
  private async checkContentSafety(content: string): Promise<{ safe: boolean; reason?: string }> {
    // Implement safety checking logic
    // This would integrate with content moderation APIs
    
    const harmfulPatterns = [
      /violence/i,
      /illegal/i,
      /harmful/i,
      // Add more patterns as needed
    ];

    for (const pattern of harmfulPatterns) {
      if (pattern.test(content)) {
        return {
          safe: false,
          reason: `Content contains potentially harmful material: ${pattern.source}`
        };
      }
    }

    return { safe: true };
  }

  /**
   * Validate budget constraints
   */
  private async validateBudget(
    request: MultimediaGenerationRequest,
    context: MultimediaContext
  ): Promise<void> {
    if (!context.budget) return;

    const estimatedCost = await this.estimateCost(request);
    
    if (estimatedCost > context.budget.maxCost) {
      throw new Error(
        `Estimated cost (${estimatedCost} ${context.budget.currency}) exceeds budget limit (${context.budget.maxCost} ${context.budget.currency})`
      );
    }
  }

  /**
   * Estimate cost for request
   */
  private async estimateCost(request: MultimediaGenerationRequest): Promise<number> {
    const requestType = this.getRequestType(request);
    
    switch (requestType) {
      case 'image':
        return this.imageGenerator.estimateCost(request as any);
      case 'audio':
        return this.audioProcessor.estimateCost(request as any);
      case 'music':
        return this.musicComposer.estimateCost(request as any);
      default:
        return 0;
    }
  }

  /**
   * Get request type
   */
  private getRequestType(request: MultimediaGenerationRequest): 'image' | 'audio' | 'music' {
    if ('prompt' in request && ('size' in request || 'style' in request)) {
      return 'image';
    }
    if ('text' in request && 'voice' in request) {
      return 'audio';
    }
    if ('prompt' in request && ('style' in request && 'genre' in (request.style || {}))) {
      return 'music';
    }
    
    // Fallback detection based on specific properties
    if ('artisticControls' in request || 'styleTransfer' in request) {
      return 'image';
    }
    if ('audioSettings' in request || 'effects' in request) {
      return 'audio';
    }
    if ('composition' in request || 'instrumentation' in request) {
      return 'music';
    }
    
    throw new Error('Cannot determine request type from request properties');
  }

  /**
   * Apply post-processing to results
   */
  private async applyPostProcessing(
    result: MultimediaGenerationResponse,
    context: MultimediaContext
  ): Promise<MultimediaGenerationResponse> {
    // Apply quality enhancements based on user tier
    if (context.userTier === 'enterprise') {
      result = await this.applyEnterpriseEnhancements(result);
    }

    // Apply compression if needed
    if (context.latencyTarget < 1000) {
      result = await this.applyCompressionOptimizations(result);
    }

    // Add watermarks for free tier
    if (context.userTier === 'free') {
      result = await this.applyWatermark(result);
    }

    return result;
  }

  /**
   * Apply enterprise-level enhancements
   */
  private async applyEnterpriseEnhancements(
    result: MultimediaGenerationResponse
  ): Promise<MultimediaGenerationResponse> {
    // Implement enterprise features like higher quality, extended duration, etc.
    return result;
  }

  /**
   * Apply compression optimizations
   */
  private async applyCompressionOptimizations(
    result: MultimediaGenerationResponse
  ): Promise<MultimediaGenerationResponse> {
    // Implement compression for faster delivery
    return result;
  }

  /**
   * Apply watermark for free tier
   */
  private async applyWatermark(
    result: MultimediaGenerationResponse
  ): Promise<MultimediaGenerationResponse> {
    // Implement watermarking logic
    return result;
  }

  /**
   * Generate cache key
   */
  private generateCacheKey(
    request: MultimediaGenerationRequest,
    context: MultimediaContext
  ): string {
    const keyData = {
      type: this.getRequestType(request),
      request: this.sanitizeRequestForCaching(request),
      userTier: context.userTier,
      qualityTarget: context.qualityTarget
    };

    const keyString = JSON.stringify(keyData);
    return `multimedia_${Buffer.from(keyString).toString('base64').substring(0, 50)}`;
  }

  /**
   * Sanitize request for caching (remove sensitive data)
   */
  private sanitizeRequestForCaching(request: MultimediaGenerationRequest): any {
    const sanitized = { ...request };
    
    // Remove context and sensitive information
    delete (sanitized as any).context;
    
    return sanitized;
  }

  /**
   * Create metadata for response
   */
  private createMetadata(requestId: string, startTime: number): MultimediaMetadata {
    return {
      id: requestId,
      timestamp: new Date(),
      model: 'multimedia-pipeline',
      latency: 0, // Will be updated
      cost: 0, // Will be calculated
      usage: {
        computeUnits: 0,
        storageBytes: 0,
        bandwidth: 0
      },
      quality: {
        score: 0,
        artifacts: [],
        safety: []
      }
    };
  }

  /**
   * Create pipeline stages
   */
  private createPipelineStages(request: MultimediaGenerationRequest): PipelineStage[] {
    const requestType = this.getRequestType(request);
    
    const stages: PipelineStage[] = [
      {
        name: 'validation',
        status: 'pending'
      },
      {
        name: `${requestType}_generation`,
        status: 'pending'
      },
      {
        name: 'post_processing',
        status: 'pending'
      }
    ];

    return stages;
  }

  /**
   * Update pipeline stages
   */
  private updatePipelineStages(
    pipelineResponse: MultimediaPipelineResponse,
    status: string
  ): void {
    const currentStage = pipelineResponse.pipeline.stages[pipelineResponse.pipeline.currentStage];
    
    if (currentStage) {
      if (status === 'completed') {
        currentStage.status = 'completed';
        currentStage.endTime = new Date();
        if (currentStage.startTime) {
          currentStage.duration = currentStage.endTime.getTime() - currentStage.startTime.getTime();
        }
      } else if (status === 'failed') {
        currentStage.status = 'failed';
        currentStage.endTime = new Date();
      } else if (status === 'processing') {
        currentStage.status = 'processing';
        currentStage.startTime = new Date();
      }
    }
  }

  /**
   * Estimate completion time
   */
  private estimateCompletionTime(request: MultimediaGenerationRequest): number {
    const requestType = this.getRequestType(request);
    
    // Base estimates in milliseconds
    const estimates = {
      image: 5000,  // 5 seconds
      audio: 10000, // 10 seconds
      music: 30000  // 30 seconds
    };

    return estimates[requestType] || 10000;
  }

  /**
   * Check if request should be batched
   */
  private shouldBatch(
    request: MultimediaGenerationRequest,
    context: MultimediaContext
  ): boolean {
    if (!this.config.shared.batching.enabled) {
      return false;
    }

    // Don't batch high-priority or real-time requests
    if (context.priority === 'urgent' || context.latencyTarget < 5000) {
      return false;
    }

    return true;
  }

  /**
   * Enqueue request for batch processing
   */
  private async enqueueBatchRequest(
    request: MultimediaGenerationRequest,
    context: MultimediaContext
  ): Promise<MultimediaGenerationResponse> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ request, context, resolve, reject });
      this.processBatchQueue();
    });
  }

  /**
   * Process batch queue
   */
  private processBatchQueue(): void {
    if (this.requestQueue.length === 0) return;

    const batchSize = Math.min(
      this.requestQueue.length,
      this.config.shared.batching.maxBatchSize
    );

    if (batchSize >= this.config.shared.batching.maxBatchSize ||
        this.requestQueue.length > 0 && !this.batchTimers.has('default')) {
      
      // Set timer for batch processing
      const timer = setTimeout(() => {
        this.flushBatchQueue();
        this.batchTimers.delete('default');
      }, this.config.shared.batching.timeout);
      
      this.batchTimers.set('default', timer);
    }
  }

  /**
   * Flush batch queue
   */
  private async flushBatchQueue(): Promise<void> {
    if (this.requestQueue.length === 0) return;

    const batchSize = Math.min(
      this.requestQueue.length,
      this.config.shared.batching.maxBatchSize
    );

    const batch = this.requestQueue.splice(0, batchSize);
    
    try {
      const requests = batch.map(item => ({
        request: item.request,
        context: item.context
      }));

      const results = await this.batchGenerate(requests);

      // Resolve individual promises
      batch.forEach((item, index) => {
        if (results[index]) {
          item.resolve(results[index]);
        } else {
          item.reject(new Error('Batch processing failed'));
        }
      });

    } catch (error) {
      // Reject all promises in the batch
      batch.forEach(item => {
        item.reject(error as Error);
      });
    }
  }

  /**
   * Group requests by type for batch processing
   */
  private groupRequestsByType(
    requests: Array<{
      request: MultimediaGenerationRequest;
      context: MultimediaContext;
    }>
  ): Map<string, typeof requests> {
    const groups = new Map<string, typeof requests>();

    for (const item of requests) {
      const type = this.getRequestType(item.request);
      
      if (!groups.has(type)) {
        groups.set(type, []);
      }
      
      groups.get(type)!.push(item);
    }

    return groups;
  }

  /**
   * Process batch by type
   */
  private async processBatchByType(
    type: string,
    requests: Array<{
      request: MultimediaGenerationRequest;
      context: MultimediaContext;
    }>,
    batchId: string
  ): Promise<MultimediaGenerationResponse[]> {
    this.logger.debug('Processing batch by type', {
      batchId,
      type,
      requestCount: requests.length
    });

    const results: MultimediaGenerationResponse[] = [];

    switch (type) {
      case 'image':
        for (const { request, context } of requests) {
          const result = await this.imageGenerator.generateImage(request as any);
          results.push(result);
        }
        break;

      case 'audio':
        for (const { request, context } of requests) {
          const result = await this.audioProcessor.generateAudio(request as any);
          results.push(result);
        }
        break;

      case 'music':
        for (const { request, context } of requests) {
          const result = await this.musicComposer.composeMusic(request as any);
          results.push(result);
        }
        break;

      default:
        throw new Error(`Unsupported batch type: ${type}`);
    }

    return results;
  }

  /**
   * Setup batch processing timers
   */
  private setupBatchProcessing(): void {
    // Setup periodic batch processing
    setInterval(() => {
      if (this.requestQueue.length > 0) {
        this.processBatchQueue();
      }
    }, this.config.shared.batching.timeout);
  }

  /**
   * Start monitoring
   */
  private startMonitoring(): void {
    // Setup periodic metrics collection
    setInterval(() => {
      this.collectMetrics();
    }, 60000); // Every minute

    // Setup health checks
    setInterval(() => {
      this.performHealthCheck();
    }, 300000); // Every 5 minutes
  }

  /**
   * Collect metrics
   */
  private collectMetrics(): void {
    const metrics = {
      ...this.metrics,
      cacheStats: this.cache.getStats(),
      performanceMetrics: this.performance.getMetrics(),
      activeRequests: this.activeRequests.size,
      queuedRequests: this.requestQueue.length,
      timestamp: Date.now()
    };

    this.emit('metrics_collected', metrics);
    
    if (this.config.shared.monitoring.performanceTracking) {
      this.performance.recordMetric('pipeline_active_requests', this.activeRequests.size);
      this.performance.recordMetric('pipeline_queued_requests', this.requestQueue.length);
      this.performance.recordMetric('pipeline_cache_hit_rate', this.metrics.cacheHits / Math.max(this.metrics.totalRequests, 1));
    }
  }

  /**
   * Perform health check
   */
  private async performHealthCheck(): Promise<void> {
    try {
      const healthStatus = {
        pipeline: 'healthy',
        image: await this.imageGenerator.healthCheck(),
        audio: await this.audioProcessor.healthCheck(),
        music: await this.musicComposer.healthCheck(),
        cache: this.cache.getStats(),
        timestamp: new Date()
      };

      this.emit('health_check', healthStatus);

    } catch (error) {
      this.logger.error('Health check failed', error);
      this.emit('health_check_failed', { error: error.message, timestamp: new Date() });
    }
  }

  /**
   * Get pipeline metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      avgLatency: this.metrics.totalRequests > 0 ? this.metrics.totalLatency / this.metrics.totalRequests : 0,
      successRate: this.metrics.totalRequests > 0 ? this.metrics.successfulRequests / this.metrics.totalRequests : 0,
      cacheHitRate: this.metrics.totalRequests > 0 ? this.metrics.cacheHits / this.metrics.totalRequests : 0,
      activeRequests: this.activeRequests.size,
      queuedRequests: this.requestQueue.length,
      cacheStats: this.cache.getStats()
    };
  }

  /**
   * Get active requests
   */
  getActiveRequests(): MultimediaPipelineResponse[] {
    return Array.from(this.activeRequests.values());
  }

  /**
   * Cancel request
   */
  async cancelRequest(requestId: string): Promise<boolean> {
    const activeRequest = this.activeRequests.get(requestId);
    
    if (activeRequest) {
      activeRequest.status = 'cancelled';
      this.activeRequests.delete(requestId);
      
      // Try to cancel in specialized processors
      await Promise.all([
        this.imageGenerator.cancelRequest(requestId).catch(() => {}),
        this.audioProcessor.cancelRequest(requestId).catch(() => {}),
        this.musicComposer.cancelRequest(requestId).catch(() => {})
      ]);

      this.emit('request_cancelled', { requestId });
      return true;
    }

    return false;
  }

  /**
   * Shutdown pipeline
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down multimedia pipeline...');

    // Clear timers
    for (const timer of this.batchTimers.values()) {
      clearTimeout(timer);
    }
    this.batchTimers.clear();

    // Shutdown processors
    await Promise.all([
      this.imageGenerator.shutdown(),
      this.audioProcessor.shutdown(),
      this.musicComposer.shutdown()
    ]);

    // Shutdown cache
    this.cache.shutdown();

    this.logger.info('Multimedia pipeline shutdown complete');
  }
}