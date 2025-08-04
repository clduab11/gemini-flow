/**
 * A2A Tool Capability Wrappers - Index
 * 
 * Exports all A2A tool wrapper components for clean imports.
 * Provides a unified interface to the complete A2A tool ecosystem.
 */

// Core wrapper and capability interfaces
export {
  A2AToolWrapper,
  A2AToolContext,
  A2ACapability,
  A2AToolInvocation,
  A2AToolResponse,
  A2AToolMetrics,
  A2AToolUtils
} from './a2a-tool-wrapper.js';

// Capability management
export {
  CapabilityManager,
  CapabilityRegistration,
  CapabilityQuery,
  CapabilityComposition,
  CapabilityAggregation,
  CapabilityDiscovery
} from './capability-manager.js';

// Tool transformation engine
export {
  ToolTransformationEngine,
  TransformationRule,
  ParameterMapping,
  TransformationCondition,
  ValidationRule,
  TransformFunction,
  TransformationContext,
  TransformationResult,
  TransformationError
} from './tool-transformation-engine.js';

// Dynamic capability composition
export {
  DynamicCapabilityComposer,
  CompositionRequest,
  CompositionPlan,
  ExecutionNode,
  ExecutionCondition,
  RetryPolicy,
  ExecutionContext,
  DynamicAggregation,
  AdaptationRule,
  AdaptationAction
} from './dynamic-capability-composer.js';

// MCP tool registry
export {
  MCPToolRegistry,
  MCPToolRegistration,
  ToolCategoryDefinition,
  CompatibilityMatrix
} from './mcp-a2a-tool-registry.js';

// Performance optimization
export {
  PerformanceOptimizationLayer,
  PerformanceProfile,
  OptimizationStrategy,
  OptimizationCondition,
  OptimizationAction,
  OptimizationContext,
  OptimizationResult,
  SystemLoadMetrics,
  HistoricalPerformanceData,
  PerformanceConstraints,
  PredictionModel
} from './performance-optimization-layer.js';

// Caching and connection pooling
export {
  CachingConnectionPoolService,
  IntelligentCacheManager,
  ConnectionPoolManager,
  CacheConfiguration,
  CacheInvalidationRule,
  CacheWarmupRule,
  ConnectionPoolConfiguration,
  Connection,
  CacheEntry,
  CacheMetrics,
  ConnectionPoolMetrics
} from './caching-connection-pool.js';

/**
 * Complete A2A Tool System Factory
 * 
 * Creates a fully configured A2A tool system with all components integrated.
 */
export class A2AToolSystemFactory {
  /**
   * Create a complete A2A tool system
   */
  static async createSystem(options: {
    cacheConfig?: Partial<import('./caching-connection-pool.js').CacheConfiguration>;
    poolConfig?: Partial<import('./caching-connection-pool.js').ConnectionPoolConfiguration>;
    enablePerformanceOptimization?: boolean;
    enableDynamicComposition?: boolean;
  } = {}): Promise<A2AToolSystem> {
    // Default configurations
    const defaultCacheConfig: import('./caching-connection-pool.js').CacheConfiguration = {
      strategy: 'intelligent',
      maxSize: 100 * 1024 * 1024, // 100MB
      defaultTTL: 300000, // 5 minutes
      maxTTL: 3600000, // 1 hour
      compressionEnabled: true,
      serializationFormat: 'json',
      invalidationRules: [],
      warmupRules: []
    };

    const defaultPoolConfig: import('./caching-connection-pool.js').ConnectionPoolConfiguration = {
      minConnections: 2,
      maxConnections: 10,
      connectionTimeout: 5000,
      idleTimeout: 60000,
      maxRetries: 3,
      healthCheckInterval: 30000,
      reconnectStrategy: 'exponential',
      loadBalancing: 'adaptive'
    };

    // Merge configurations
    const cacheConfig = { ...defaultCacheConfig, ...options.cacheConfig };
    const poolConfig = { ...defaultPoolConfig, ...options.poolConfig };

    // Create core components
    const capabilityManager = new CapabilityManager();
    const transformationEngine = new ToolTransformationEngine();
    const toolRegistry = new MCPToolRegistry(capabilityManager, transformationEngine);
    const cachingService = new CachingConnectionPoolService(cacheConfig, poolConfig);

    // Optional components
    let performanceOptimizer: PerformanceOptimizationLayer | undefined;
    let dynamicComposer: DynamicCapabilityComposer | undefined;

    if (options.enablePerformanceOptimization) {
      const { PerformanceMonitor } = await import('../../../monitoring/performance-monitor.js');
      const monitor = new PerformanceMonitor();
      performanceOptimizer = new PerformanceOptimizationLayer(toolRegistry, monitor);
    }

    if (options.enableDynamicComposition) {
      dynamicComposer = new DynamicCapabilityComposer(capabilityManager);
    }

    // Initialize the tool registry
    await toolRegistry.initialize();

    return new A2AToolSystem({
      capabilityManager,
      transformationEngine,
      toolRegistry,
      cachingService,
      performanceOptimizer,
      dynamicComposer
    });
  }
}

/**
 * Main A2A Tool System class
 * 
 * Provides a unified interface to all A2A tool capabilities.
 */
export class A2AToolSystem {
  constructor(private components: {
    capabilityManager: CapabilityManager;
    transformationEngine: ToolTransformationEngine;
    toolRegistry: MCPToolRegistry;
    cachingService: CachingConnectionPoolService;
    performanceOptimizer?: PerformanceOptimizationLayer;
    dynamicComposer?: DynamicCapabilityComposer;
  }) {}

  /**
   * Execute an A2A tool invocation with all optimizations
   */
  async executeInvocation(invocation: A2AToolInvocation): Promise<A2AToolResponse> {
    // Apply performance optimization if available
    if (this.components.performanceOptimizer) {
      const optimizationResult = await this.components.performanceOptimizer.optimizeInvocation(invocation);
      if (optimizationResult.response) {
        return optimizationResult.response;
      }
    }

    // Get tool registration
    const registration = this.components.toolRegistry.getToolRegistration(invocation.toolId as any);
    if (!registration) {
      throw new Error(`Tool not found: ${invocation.toolId}`);
    }

    // Execute with caching and connection pooling
    return this.components.cachingService.executeWithOptimizations(
      invocation,
      async (connection) => {
        return registration.wrapper.invoke(invocation);
      }
    );
  }

  /**
   * Create a dynamic composition
   */
  async createComposition(request: CompositionRequest): Promise<CompositionPlan> {
    if (!this.components.dynamicComposer) {
      throw new Error('Dynamic composition not enabled');
    }
    return this.components.dynamicComposer.createCompositionPlan(request);
  }

  /**
   * Execute a composition plan
   */
  async executeComposition(planId: string, runtimeParameters?: Record<string, any>): Promise<any> {
    if (!this.components.dynamicComposer) {
      throw new Error('Dynamic composition not enabled');
    }
    return this.components.dynamicComposer.executeCompositionPlan(planId, runtimeParameters);
  }

  /**
   * Search for tools by capabilities
   */
  async searchTools(requirements: {
    capabilities?: string[];
    maxLatency?: number;
    minTrustLevel?: string;
    resourceConstraints?: string;
    tags?: string[];
  }): Promise<MCPToolRegistration[]> {
    return this.components.toolRegistry.searchTools(requirements);
  }

  /**
   * Get system-wide metrics
   */
  getSystemMetrics(): {
    tools: number;
    capabilities: number;
    cache: import('./caching-connection-pool.js').CacheMetrics;
    connectionPool: import('./caching-connection-pool.js').ConnectionPoolMetrics;
    performance?: any;
  } {
    const toolCount = this.components.toolRegistry.listTools().length;
    const capabilityCount = this.components.capabilityManager.listCapabilities().length;
    const cachingMetrics = this.components.cachingService.getServiceMetrics();

    return {
      tools: toolCount,
      capabilities: capabilityCount,
      cache: cachingMetrics.cache,
      connectionPool: cachingMetrics.connectionPool,
      performance: this.components.performanceOptimizer?.getPerformanceStatistics()
    };
  }

  /**
   * Shutdown the system gracefully
   */
  async shutdown(): Promise<void> {
    await this.components.cachingService.shutdown();
  }

  // Expose individual components for advanced usage
  get capabilityManager(): CapabilityManager {
    return this.components.capabilityManager;
  }

  get transformationEngine(): ToolTransformationEngine {
    return this.components.transformationEngine;
  }

  get toolRegistry(): MCPToolRegistry {
    return this.components.toolRegistry;
  }

  get cachingService(): CachingConnectionPoolService {
    return this.components.cachingService;
  }

  get performanceOptimizer(): PerformanceOptimizationLayer | undefined {
    return this.components.performanceOptimizer;
  }

  get dynamicComposer(): DynamicCapabilityComposer | undefined {
    return this.components.dynamicComposer;
  }
}

// Re-export important types for convenience
export type {
  CompositionRequest,
  CompositionPlan,
  MCPToolRegistration,
  PerformanceProfile,
  CacheMetrics,
  ConnectionPoolMetrics
} from './index.js';