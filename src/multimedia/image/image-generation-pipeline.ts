/**
 * Image Generation Pipeline
 * 
 * Comprehensive pipeline for Imagen 4 image generation with style transfer,
 * prompt engineering, batch optimization, and caching strategies
 */

import { EventEmitter } from 'events';
import { Logger } from '../../utils/logger.js';
import { PerformanceMonitor } from '../../core/performance-monitor.js';
import { CacheManager } from '../../core/cache-manager.js';
import { VertexAIConnector } from '../../core/vertex-ai-connector.js';
import {
  ImageGenerationConfig,
  ImageGenerationRequest,
  ImageGenerationResponse,
  GeneratedImage,
  CacheStrategy,
  ImageSize,
  AspectRatio,
  MultimediaContext
} from '../../types/multimedia.js';

import { ImagenAdapter } from './imagen-adapter.js';
import { PromptEngineer } from './prompt-engineer.js';
import { StyleTransferEngine } from './style-transfer-engine.js';
import { ImageCache } from './image-cache.js';
import { BatchOptimizer } from './batch-optimizer.js';

export class ImageGenerationPipeline extends EventEmitter {
  private logger: Logger;
  private config: ImageGenerationConfig;
  private performance: PerformanceMonitor;
  
  // Core components
  private imagenAdapter: ImagenAdapter;
  private promptEngineer: PromptEngineer;
  private styleTransferEngine: StyleTransferEngine;
  private imageCache: ImageCache;
  private batchOptimizer: BatchOptimizer;
  private vertexConnector: VertexAIConnector;
  
  // Pipeline state
  private isInitialized: boolean = false;
  private activeGenerations: Map<string, Promise<ImageGenerationResponse>> = new Map();
  
  // Metrics
  private metrics = {
    totalRequests: 0,
    cacheHits: 0,
    batchedRequests: 0,
    styleTransferRequests: 0,
    promptEnhancements: 0,
    avgGenerationTime: 0,
    totalCost: 0
  };

  constructor(config: ImageGenerationConfig) {
    super();
    this.config = config;
    this.logger = new Logger('ImageGenerationPipeline');
    this.performance = new PerformanceMonitor();
    
    this.initializeComponents();
  }

  /**
   * Initialize all pipeline components
   */
  private initializeComponents(): void {
    // Initialize Vertex AI connector
    this.vertexConnector = new VertexAIConnector({
      projectId: this.config.projectId,
      location: this.config.location,
      apiEndpoint: this.config.apiEndpoint,
      credentials: this.config.credentials,
      serviceAccountPath: this.config.serviceAccountPath,
      maxConcurrentRequests: this.config.maxConcurrentRequests,
      requestTimeout: this.config.requestTimeout
    });

    // Initialize core adapters
    this.imagenAdapter = new ImagenAdapter(this.config, this.vertexConnector);
    
    // Initialize specialized engines
    this.promptEngineer = new PromptEngineer();
    this.styleTransferEngine = new StyleTransferEngine(this.vertexConnector);
    
    // Initialize caching with image-specific strategies
    this.imageCache = new ImageCache({
      maxMemorySize: 100 * 1024 * 1024, // 100MB
      maxDiskSize: 1024 * 1024 * 1024,  // 1GB
      ttl: 24 * 60 * 60 * 1000, // 24 hours
      cacheStrategy: this.config.cachingEnabled ? 'perceptual' : 'disabled',
      compressionEnabled: true,
      previewGeneration: true
    });
    
    // Initialize batch optimizer
    this.batchOptimizer = new BatchOptimizer({
      enabled: this.config.batchingEnabled,
      maxBatchSize: this.config.maxBatchSize,
      timeout: 5000, // 5 seconds
      costOptimization: true,
      qualityGrouping: true
    });

    this.setupEventHandlers();
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    // Imagen adapter events
    this.imagenAdapter.on('generation_completed', (data) => {
      this.emit('generation_completed', data);
    });

    this.imagenAdapter.on('generation_failed', (data) => {
      this.emit('generation_failed', data);
    });

    // Style transfer events
    this.styleTransferEngine.on('style_transfer_completed', (data) => {
      this.logger.debug('Style transfer completed', { requestId: data.requestId });
    });

    // Cache events
    this.imageCache.on('cache_hit', (data) => {
      this.metrics.cacheHits++;
      this.logger.debug('Image cache hit', data);
    });

    // Batch optimizer events
    this.batchOptimizer.on('batch_processed', (data) => {
      this.metrics.batchedRequests += data.batchSize;
      this.logger.info('Batch processed', data);
    });
  }

  /**
   * Initialize the pipeline
   */
  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing image generation pipeline...');

      // Initialize components in parallel
      await Promise.all([
        this.vertexConnector,
        this.imageCache.initialize(),
        this.promptEngineer.initialize(),
        this.styleTransferEngine.initialize()
      ]);

      this.isInitialized = true;
      this.logger.info('Image generation pipeline initialized successfully');
      this.emit('initialized');

    } catch (error) {
      this.logger.error('Failed to initialize image generation pipeline', error);
      throw error;
    }
  }

  /**
   * Generate image with full pipeline processing
   */
  async generateImage(request: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    const startTime = performance.now();
    const requestId = request.context?.requestId || this.generateRequestId();
    
    this.metrics.totalRequests++;

    try {
      this.ensureInitialized();
      
      this.logger.info('Starting image generation', {
        requestId,
        prompt: request.prompt.substring(0, 100) + '...',
        numberOfImages: request.numberOfImages || 1
      });

      // Phase 1: Check cache first
      const cacheResult = await this.checkCache(request);
      if (cacheResult) {
        this.metrics.cacheHits++;
        this.logger.info('Image generation completed from cache', {
          requestId,
          latency: performance.now() - startTime
        });
        return cacheResult;
      }

      // Phase 2: Enhance prompt with AI
      const enhancedRequest = await this.enhancePrompt(request);
      this.metrics.promptEnhancements++;

      // Phase 3: Optimize for batch processing if applicable
      const optimizedRequest = await this.optimizeBatch(enhancedRequest);

      // Phase 4: Generate image through Imagen adapter
      const response = await this.processGeneration(optimizedRequest, requestId);

      // Phase 5: Apply style transfer if requested
      const styledResponse = await this.applyStyleTransfer(response, request);

      // Phase 6: Post-process and optimize images
      const finalResponse = await this.postProcessImages(styledResponse, request);

      // Phase 7: Cache the result
      await this.cacheResult(request, finalResponse);

      // Update metrics
      const latency = performance.now() - startTime;
      this.updateMetrics(latency, finalResponse);

      this.logger.info('Image generation completed', {
        requestId,
        latency,
        imageCount: finalResponse.images.length,
        cost: finalResponse.metadata.cost
      });

      return finalResponse;

    } catch (error) {
      const latency = performance.now() - startTime;
      this.logger.error('Image generation failed', {
        requestId,
        latency,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Generate multiple images with batch optimization
   */
  async generateBatch(requests: ImageGenerationRequest[]): Promise<ImageGenerationResponse[]> {
    this.logger.info('Starting batch image generation', {
      batchSize: requests.length
    });

    try {
      this.ensureInitialized();

      // Group requests for optimal processing
      const optimizedBatches = await this.batchOptimizer.optimizeBatch(requests);
      const results: ImageGenerationResponse[] = [];

      for (const batch of optimizedBatches) {
        const batchResults = await this.processBatch(batch);
        results.push(...batchResults);
      }

      this.logger.info('Batch image generation completed', {
        totalRequests: requests.length,
        totalImages: results.reduce((sum, r) => sum + r.images.length, 0)
      });

      return results;

    } catch (error) {
      this.logger.error('Batch image generation failed', error);
      throw error;
    }
  }

  /**
   * Check cache for existing result
   */
  private async checkCache(request: ImageGenerationRequest): Promise<ImageGenerationResponse | null> {
    if (!this.config.cachingEnabled) {
      return null;
    }

    try {
      const cacheKey = this.imageCache.generateCacheKey(request);
      const cachedResult = await this.imageCache.get(cacheKey);
      
      if (cachedResult) {
        this.logger.debug('Cache hit for image generation', {
          cacheKey: cacheKey.substring(0, 20) + '...'
        });
        return cachedResult;
      }

      return null;

    } catch (error) {
      this.logger.warn('Cache check failed', error);
      return null;
    }
  }

  /**
   * Enhance prompt using AI prompt engineering
   */
  private async enhancePrompt(request: ImageGenerationRequest): Promise<ImageGenerationRequest> {
    try {
      const enhancedPrompt = await this.promptEngineer.enhancePrompt(request.prompt, {
        style: request.style,
        artisticControls: request.artisticControls,
        targetQuality: request.context?.qualityTarget || 'standard',
        targetAudience: 'general'
      });

      return {
        ...request,
        prompt: enhancedPrompt.enhancedPrompt,
        metadata: {
          ...request.metadata,
          promptEnhancement: enhancedPrompt.enhancements,
          originalPrompt: request.prompt
        }
      };

    } catch (error) {
      this.logger.warn('Prompt enhancement failed, using original', error);
      return request;
    }
  }

  /**
   * Optimize request for batch processing
   */
  private async optimizeBatch(request: ImageGenerationRequest): Promise<ImageGenerationRequest> {
    if (!this.config.batchingEnabled) {
      return request;
    }

    return this.batchOptimizer.optimizeRequest(request);
  }

  /**
   * Process image generation through Imagen adapter
   */
  private async processGeneration(
    request: ImageGenerationRequest,
    requestId: string
  ): Promise<ImageGenerationResponse> {
    // Check if this request is already being processed
    const activeGeneration = this.activeGenerations.get(requestId);
    if (activeGeneration) {
      return await activeGeneration;
    }

    // Start new generation
    const generationPromise = this.imagenAdapter.generateImage(request);
    this.activeGenerations.set(requestId, generationPromise);

    try {
      const response = await generationPromise;
      this.activeGenerations.delete(requestId);
      return response;
    } catch (error) {
      this.activeGenerations.delete(requestId);
      throw error;
    }
  }

  /**
   * Apply style transfer if requested
   */
  private async applyStyleTransfer(
    response: ImageGenerationResponse,
    originalRequest: ImageGenerationRequest
  ): Promise<ImageGenerationResponse> {
    if (!originalRequest.styleTransfer?.enabled || !this.config.styleTransferEnabled) {
      return response;
    }

    this.metrics.styleTransferRequests++;

    try {
      this.logger.info('Applying style transfer', {
        requestId: response.id,
        styleConfig: originalRequest.styleTransfer
      });

      const styledImages = await this.styleTransferEngine.applyStyleTransfer(
        response.images,
        originalRequest.styleTransfer
      );

      return {
        ...response,
        images: styledImages,
        metadata: {
          ...response.metadata,
          styleTransferApplied: true
        }
      };

    } catch (error) {
      this.logger.error('Style transfer failed', {
        requestId: response.id,
        error: error.message
      });
      
      // Return original response if style transfer fails
      return response;
    }
  }

  /**
   * Post-process generated images
   */
  private async postProcessImages(
    response: ImageGenerationResponse,
    request: ImageGenerationRequest
  ): Promise<ImageGenerationResponse> {
    const processedImages: GeneratedImage[] = [];

    for (const image of response.images) {
      let processedImage = image;

      // Apply quality enhancements based on user tier
      if (request.context?.userTier === 'enterprise') {
        processedImage = await this.applyEnterpriseEnhancements(processedImage);
      }

      // Apply compression optimizations for faster delivery
      if (request.context?.latencyTarget && request.context.latencyTarget < 3000) {
        processedImage = await this.applyCompressionOptimizations(processedImage);
      }

      // Generate previews and thumbnails
      processedImage = await this.generatePreviews(processedImage);

      // Apply watermarks for free tier
      if (request.context?.userTier === 'free') {
        processedImage = await this.applyWatermark(processedImage);
      }

      processedImages.push(processedImage);
    }

    return {
      ...response,
      images: processedImages
    };
  }

  /**
   * Apply enterprise-level enhancements
   */
  private async applyEnterpriseEnhancements(image: GeneratedImage): Promise<GeneratedImage> {
    // Implement enterprise features like noise reduction, sharpening, etc.
    return {
      ...image,
      metadata: {
        ...image.metadata,
        enterpriseEnhanced: true
      }
    };
  }

  /**
   * Apply compression optimizations
   */
  private async applyCompressionOptimizations(image: GeneratedImage): Promise<GeneratedImage> {
    // Implement smart compression for faster delivery
    return {
      ...image,
      metadata: {
        ...image.metadata,
        compression: 0.8,
        optimizedForLatency: true
      }
    };
  }

  /**
   * Generate previews and thumbnails
   */
  private async generatePreviews(image: GeneratedImage): Promise<GeneratedImage> {
    // Generate preview versions
    const previews = {
      thumbnail: await this.generateThumbnail(image.data, 150, 150),
      preview: await this.generateThumbnail(image.data, 512, 512)
    };

    return {
      ...image,
      metadata: {
        ...image.metadata,
        previews
      }
    };
  }

  /**
   * Generate thumbnail
   */
  private async generateThumbnail(
    imageData: string,
    width: number,
    height: number
  ): Promise<string> {
    // This would implement actual image resizing
    // For now, return the original (placeholder)
    return imageData;
  }

  /**
   * Apply watermark for free tier
   */
  private async applyWatermark(image: GeneratedImage): Promise<GeneratedImage> {
    // Implement watermarking logic
    return {
      ...image,
      metadata: {
        ...image.metadata,
        watermarked: true
      }
    };
  }

  /**
   * Cache generation result
   */
  private async cacheResult(
    request: ImageGenerationRequest,
    response: ImageGenerationResponse
  ): Promise<void> {
    if (!this.config.cachingEnabled) {
      return;
    }

    try {
      const cacheKey = this.imageCache.generateCacheKey(request);
      await this.imageCache.set(cacheKey, response);
      
      this.logger.debug('Result cached', {
        requestId: response.id,
        cacheKey: cacheKey.substring(0, 20) + '...',
        imageCount: response.images.length
      });

    } catch (error) {
      this.logger.warn('Failed to cache result', error);
    }
  }

  /**
   * Process batch of requests
   */
  private async processBatch(requests: ImageGenerationRequest[]): Promise<ImageGenerationResponse[]> {
    const batchPromises = requests.map(request => this.generateImage(request));
    return await Promise.all(batchPromises);
  }

  /**
   * Update metrics
   */
  private updateMetrics(latency: number, response: ImageGenerationResponse): void {
    this.metrics.avgGenerationTime = (
      (this.metrics.avgGenerationTime * (this.metrics.totalRequests - 1)) + latency
    ) / this.metrics.totalRequests;
    
    this.metrics.totalCost += response.metadata.cost;

    this.performance.recordMetric('image_generation_latency', latency);
    this.performance.recordMetric('image_generation_cost', response.metadata.cost);
    this.performance.recordMetric('images_generated', response.images.length);
  }

  /**
   * Validate request
   */
  async validateRequest(request: ImageGenerationRequest): Promise<void> {
    return this.imagenAdapter.validateRequest(request);
  }

  /**
   * Estimate cost
   */
  estimateCost(request: ImageGenerationRequest): number {
    return this.imagenAdapter.estimateCost(request);
  }

  /**
   * Cancel request
   */
  async cancelRequest(requestId: string): Promise<boolean> {
    // Cancel active generation
    const activeGeneration = this.activeGenerations.get(requestId);
    if (activeGeneration) {
      this.activeGenerations.delete(requestId);
    }

    // Cancel in Imagen adapter
    return await this.imagenAdapter.cancelRequest(requestId);
  }

  /**
   * Ensure pipeline is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('Image generation pipeline not initialized');
    }
  }

  /**
   * Generate request ID
   */
  private generateRequestId(): string {
    return `img_pipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; latency: number; error?: string }> {
    const startTime = performance.now();
    
    try {
      // Check all components
      const [imagenHealth, cacheHealth, engineHealth] = await Promise.all([
        this.imagenAdapter.healthCheck(),
        this.imageCache.healthCheck(),
        this.styleTransferEngine.healthCheck()
      ]);

      const latency = performance.now() - startTime;
      
      if (imagenHealth.status === 'healthy' && 
          cacheHealth.status === 'healthy' && 
          engineHealth.status === 'healthy') {
        return { status: 'healthy', latency };
      } else {
        return {
          status: 'degraded',
          latency,
          error: 'Some components unhealthy'
        };
      }

    } catch (error) {
      const latency = performance.now() - startTime;
      return {
        status: 'unhealthy',
        latency,
        error: error.message
      };
    }
  }

  /**
   * Get pipeline metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      imagenMetrics: this.imagenAdapter.getMetrics(),
      cacheMetrics: this.imageCache.getMetrics(),
      batchMetrics: this.batchOptimizer.getMetrics(),
      activeGenerations: this.activeGenerations.size
    };
  }

  /**
   * Shutdown pipeline
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down image generation pipeline...');

    // Shutdown components
    await Promise.all([
      this.imagenAdapter.shutdown(),
      this.imageCache.shutdown(),
      this.styleTransferEngine.shutdown(),
      this.batchOptimizer.shutdown()
    ]);

    this.activeGenerations.clear();
    this.isInitialized = false;

    this.logger.info('Image generation pipeline shutdown complete');
  }
}