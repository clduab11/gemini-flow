/**
 * A2A Tool Capability Wrappers - Index
 *
 * Exports all A2A tool wrapper components for clean imports.
 * Provides a unified interface to the complete A2A tool ecosystem.
 */
// Core wrapper and capability interfaces
export { A2AToolWrapper, A2AToolUtils, } from "./a2a-tool-wrapper.js";
// Capability management
export { CapabilityManager, } from "./capability-manager.js";
// Tool transformation engine
export { ToolTransformationEngine, } from "./tool-transformation-engine.js";
// Dynamic capability composition
export { DynamicCapabilityComposer, } from "./dynamic-capability-composer.js";
// MCP tool registry
export { MCPToolRegistry, } from "./mcp-a2a-tool-registry.js";
// Performance optimization
export { PerformanceOptimizationLayer, } from "./performance-optimization-layer.js";
// Caching and connection pooling
export { CachingConnectionPoolService, IntelligentCacheManager, ConnectionPoolManager, } from "./caching-connection-pool.js";
/**
 * Complete A2A Tool System Factory
 *
 * Creates a fully configured A2A tool system with all components integrated.
 */
export class A2AToolSystemFactory {
    /**
     * Create a complete A2A tool system
     */
    static async createSystem(options = {}) {
        // Default configurations
        const defaultCacheConfig = {
            strategy: "intelligent",
            maxSize: 100 * 1024 * 1024, // 100MB
            defaultTTL: 300000, // 5 minutes
            maxTTL: 3600000, // 1 hour
            compressionEnabled: true,
            serializationFormat: "json",
            invalidationRules: [],
            warmupRules: [],
        };
        const defaultPoolConfig = {
            minConnections: 2,
            maxConnections: 10,
            connectionTimeout: 5000,
            idleTimeout: 60000,
            maxRetries: 3,
            healthCheckInterval: 30000,
            reconnectStrategy: "exponential",
            loadBalancing: "adaptive",
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
        let performanceOptimizer;
        let dynamicComposer;
        if (options.enablePerformanceOptimization) {
            const { PerformanceMonitor } = await import("../../../monitoring/performance-monitor.js");
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
            dynamicComposer,
        });
    }
}
/**
 * Main A2A Tool System class
 *
 * Provides a unified interface to all A2A tool capabilities.
 */
export class A2AToolSystem {
    components;
    constructor(components) {
        this.components = components;
    }
    /**
     * Execute an A2A tool invocation with all optimizations
     */
    async executeInvocation(invocation) {
        // Apply performance optimization if available
        if (this.components.performanceOptimizer) {
            const optimizationResult = await this.components.performanceOptimizer.optimizeInvocation(invocation);
            if (optimizationResult.response) {
                return optimizationResult.response;
            }
        }
        // Get tool registration
        const registration = this.components.toolRegistry.getToolRegistration(invocation.toolId);
        if (!registration) {
            throw new Error(`Tool not found: ${invocation.toolId}`);
        }
        // Execute with caching and connection pooling
        return this.components.cachingService.executeWithOptimizations(invocation, async (connection) => {
            return registration.wrapper.invoke(invocation);
        });
    }
    /**
     * Create a dynamic composition
     */
    async createComposition(request) {
        if (!this.components.dynamicComposer) {
            throw new Error("Dynamic composition not enabled");
        }
        return this.components.dynamicComposer.createCompositionPlan(request);
    }
    /**
     * Execute a composition plan
     */
    async executeComposition(planId, runtimeParameters) {
        if (!this.components.dynamicComposer) {
            throw new Error("Dynamic composition not enabled");
        }
        return this.components.dynamicComposer.executeCompositionPlan(planId, runtimeParameters);
    }
    /**
     * Search for tools by capabilities
     */
    async searchTools(requirements) {
        return this.components.toolRegistry.searchTools(requirements);
    }
    /**
     * Get system-wide metrics
     */
    getSystemMetrics() {
        const toolCount = this.components.toolRegistry.listTools().length;
        const capabilityCount = this.components.capabilityManager.listCapabilities().length;
        const cachingMetrics = this.components.cachingService.getServiceMetrics();
        return {
            tools: toolCount,
            capabilities: capabilityCount,
            cache: cachingMetrics.cache,
            connectionPool: cachingMetrics.connectionPool,
            performance: this.components.performanceOptimizer?.getPerformanceStatistics(),
        };
    }
    /**
     * Shutdown the system gracefully
     */
    async shutdown() {
        await this.components.cachingService.shutdown();
    }
    // Expose individual components for advanced usage
    get capabilityManager() {
        return this.components.capabilityManager;
    }
    get transformationEngine() {
        return this.components.transformationEngine;
    }
    get toolRegistry() {
        return this.components.toolRegistry;
    }
    get cachingService() {
        return this.components.cachingService;
    }
    get performanceOptimizer() {
        return this.components.performanceOptimizer;
    }
    get dynamicComposer() {
        return this.components.dynamicComposer;
    }
}
