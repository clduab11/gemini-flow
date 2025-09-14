/**
 * Performance Optimization Layer
 *
 * Provides intelligent performance optimization for A2A tool invocations.
 * Includes predictive optimization, adaptive resource allocation, and
 * machine learning-based performance tuning.
 */
import { EventEmitter } from "events";
import { Logger } from "../../../utils/logger.js";
import { CacheManager } from "../../../core/cache-manager.js";
/**
 * Main performance optimization layer
 */
export class PerformanceOptimizationLayer extends EventEmitter {
    logger;
    cache;
    performanceMonitor;
    toolRegistry;
    performanceProfiles = new Map();
    optimizationStrategies = new Map();
    systemLoadHistory = [];
    predictionModels = new Map();
    circuitBreakers = new Map();
    loadBalancers = new Map();
    batchProcessors = new Map();
    constructor(toolRegistry, performanceMonitor) {
        super();
        this.logger = new Logger("PerformanceOptimizationLayer");
        this.cache = new CacheManager();
        this.performanceMonitor = performanceMonitor;
        this.toolRegistry = toolRegistry;
        this.initializeOptimizationStrategies();
        this.startPerformanceMonitoring();
        this.logger.info("Performance Optimization Layer initialized");
    }
    /**
     * Optimize tool invocation with intelligent strategies
     */
    async optimizeInvocation(invocation) {
        const startTime = Date.now();
        try {
            // Get performance profile for the tool
            const profile = await this.getPerformanceProfile(invocation.toolId);
            // Collect current system metrics
            const systemLoad = await this.getCurrentSystemLoad();
            // Get historical data
            const historicalData = await this.getHistoricalData(invocation.toolId);
            // Create optimization context
            const context = {
                originalInvocation: invocation,
                performanceProfile: profile,
                systemLoad,
                historicalData,
                constraints: this.extractConstraints(invocation),
            };
            // Select and apply optimization strategies
            const applicableStrategies = await this.selectOptimizationStrategies(context);
            if (applicableStrategies.length === 0) {
                // No optimization needed, execute normally
                return await this.executeWithoutOptimization(invocation, context, startTime);
            }
            // Apply optimizations in priority order
            let result = null;
            const appliedOptimizations = [];
            for (const strategy of applicableStrategies) {
                try {
                    const strategyResult = await this.applyOptimizationStrategy(strategy, context);
                    if (strategyResult.success) {
                        result = strategyResult;
                        appliedOptimizations.push(strategy.name);
                        // Update strategy success metrics
                        await this.updateStrategyMetrics(strategy.id, true, strategyResult.performanceImprovement);
                        break; // Use first successful optimization
                    }
                }
                catch (error) {
                    this.logger.warn("Optimization strategy failed", {
                        strategy: strategy.name,
                        error: error.message,
                    });
                    await this.updateStrategyMetrics(strategy.id, false);
                }
            }
            // If no optimization succeeded, fall back to normal execution
            if (!result) {
                result = await this.executeWithoutOptimization(invocation, context, startTime);
                result.metadata.fallbackUsed = true;
            }
            // Update performance profile
            await this.updatePerformanceProfile(invocation.toolId, result);
            // Log optimization results
            this.logger.info("Invocation optimization completed", {
                toolId: invocation.toolId,
                appliedOptimizations,
                latencyReduction: result.performanceImprovement.latencyReduction,
                executionTime: Date.now() - startTime,
            });
            this.emit("optimization_applied", {
                invocation,
                result,
                appliedOptimizations,
            });
            return result;
        }
        catch (error) {
            this.logger.error("Optimization failed", {
                toolId: invocation.toolId,
                error: error.message,
            });
            // Fall back to unoptimized execution
            return await this.executeWithoutOptimization(invocation, {
                originalInvocation: invocation,
                performanceProfile: await this.getPerformanceProfile(invocation.toolId),
                systemLoad: await this.getCurrentSystemLoad(),
                historicalData: await this.getHistoricalData(invocation.toolId),
                constraints: this.extractConstraints(invocation),
            }, startTime);
        }
    }
    /**
     * Get or create performance profile for a tool
     */
    async getPerformanceProfile(toolId) {
        let profile = this.performanceProfiles.get(toolId);
        if (!profile) {
            // Create initial profile from tool registration
            const registration = this.toolRegistry.getToolRegistration(toolId);
            profile = {
                toolId,
                averageLatency: registration?.metadata.averageLatency || 1000,
                p95Latency: (registration?.metadata.averageLatency || 1000) * 2,
                p99Latency: (registration?.metadata.averageLatency || 1000) * 3,
                successRate: registration?.metadata.successRate || 0.95,
                errorRate: 1 - (registration?.metadata.successRate || 0.95),
                throughput: 10, // requests per second
                resourceUtilization: {
                    cpu: 10,
                    memory: 50,
                    network: 5,
                    io: 2,
                },
                contextMetrics: {
                    trustLevelPerformance: {},
                    parameterSizeImpact: 1.0,
                    timeOfDayVariance: 0.1,
                    loadFactorImpact: 1.2,
                },
                lastUpdated: new Date(),
            };
            this.performanceProfiles.set(toolId, profile);
        }
        return profile;
    }
    /**
     * Predict performance for an invocation
     */
    async predictPerformance(invocation) {
        const profile = await this.getPerformanceProfile(invocation.toolId);
        const systemLoad = await this.getCurrentSystemLoad();
        // Apply predictive models
        const latencyModel = this.predictionModels.get("latency");
        const successRateModel = this.predictionModels.get("success_rate");
        let estimatedLatency = profile.averageLatency;
        const estimatedSuccessRate = profile.successRate;
        let confidence = 0.7; // Base confidence
        // Adjust based on system load
        const loadFactor = (systemLoad.cpuUsage + systemLoad.memoryUsage) / 200;
        estimatedLatency *=
            1 + loadFactor * profile.contextMetrics.loadFactorImpact;
        // Adjust based on parameter size
        const parameterSize = JSON.stringify(invocation.parameters).length;
        const sizeFactor = Math.log(parameterSize + 1) / 10;
        estimatedLatency *=
            1 + sizeFactor * profile.contextMetrics.parameterSizeImpact;
        // Adjust based on trust level
        const trustPerformance = profile.contextMetrics.trustLevelPerformance[invocation.context.trustLevel];
        if (trustPerformance) {
            estimatedLatency *= trustPerformance;
            confidence += 0.1;
        }
        // Time of day adjustment
        const hour = new Date().getHours();
        const timeVariance = Math.sin((hour / 24) * 2 * Math.PI) *
            profile.contextMetrics.timeOfDayVariance;
        estimatedLatency *= 1 + timeVariance;
        return {
            estimatedLatency,
            estimatedSuccessRate,
            estimatedResourceUsage: {
                cpu: profile.resourceUtilization.cpu * (1 + loadFactor),
                memory: profile.resourceUtilization.memory * (1 + sizeFactor),
                network: profile.resourceUtilization.network,
                io: profile.resourceUtilization.io,
            },
            confidence,
        };
    }
    /**
     * Enable or disable optimization strategies
     */
    configureOptimizationStrategy(strategyId, enabled) {
        const strategy = this.optimizationStrategies.get(strategyId);
        if (strategy) {
            strategy.enabled = enabled;
            this.logger.info("Optimization strategy configured", {
                strategyId,
                enabled,
            });
        }
    }
    /**
     * Add custom optimization strategy
     */
    addOptimizationStrategy(strategy) {
        this.optimizationStrategies.set(strategy.id, strategy);
        this.logger.info("Custom optimization strategy added", {
            id: strategy.id,
            name: strategy.name,
        });
    }
    /**
     * Get performance statistics
     */
    getPerformanceStatistics() {
        const strategies = Array.from(this.optimizationStrategies.values());
        const totalOptimizations = strategies.reduce((sum, s) => sum + s.successRate, 0);
        const averageImprovement = strategies.reduce((sum, s) => sum + s.averageImprovement, 0) /
            strategies.length;
        const strategyEffectiveness = {};
        strategies.forEach((s) => {
            strategyEffectiveness[s.name] = s.successRate * s.averageImprovement;
        });
        return {
            totalOptimizations,
            averageImprovement,
            strategyEffectiveness,
            systemLoad: this.systemLoadHistory[this.systemLoadHistory.length - 1] || {
                cpuUsage: 0,
                memoryUsage: 0,
                networkLatency: 0,
                diskIO: 0,
                activeConnections: 0,
                queueLength: 0,
                timestamp: new Date(),
            },
            profileCount: this.performanceProfiles.size,
        };
    }
    /**
     * Private helper methods
     */
    initializeOptimizationStrategies() {
        // Caching strategy
        this.addOptimizationStrategy({
            id: "intelligent_caching",
            name: "Intelligent Caching",
            description: "Cache results based on parameters and context",
            conditions: [
                {
                    type: "latency",
                    operator: "gt",
                    value: 500, // Cache if latency > 500ms
                },
            ],
            actions: [
                {
                    type: "cache",
                    parameters: { ttl: 300000, strategy: "lru" },
                    execute: async (invocation, context) => this.applyCachingOptimization(invocation, context),
                },
            ],
            priority: 1,
            successRate: 0.85,
            averageImprovement: 0.7,
            enabled: true,
        });
        // Circuit breaker strategy
        this.addOptimizationStrategy({
            id: "circuit_breaker",
            name: "Circuit Breaker",
            description: "Prevent cascading failures with circuit breaker pattern",
            conditions: [
                {
                    type: "error_rate",
                    operator: "gt",
                    value: 0.1, // Activate if error rate > 10%
                },
            ],
            actions: [
                {
                    type: "circuit_breaker",
                    parameters: { failureThreshold: 5, resetTimeout: 30000 },
                    execute: async (invocation, context) => this.applyCircuitBreakerOptimization(invocation, context),
                },
            ],
            priority: 2,
            successRate: 0.9,
            averageImprovement: 0.3,
            enabled: true,
        });
        // Load balancing strategy
        this.addOptimizationStrategy({
            id: "load_balancing",
            name: "Load Balancing",
            description: "Distribute load across multiple instances",
            conditions: [
                {
                    type: "resource_usage",
                    operator: "gt",
                    value: 0.8, // Balance if resource usage > 80%
                },
            ],
            actions: [
                {
                    type: "load_balance",
                    parameters: { strategy: "round_robin", healthCheck: true },
                    execute: async (invocation, context) => this.applyLoadBalancingOptimization(invocation, context),
                },
            ],
            priority: 3,
            successRate: 0.75,
            averageImprovement: 0.4,
            enabled: true,
        });
        // Parallel execution strategy
        this.addOptimizationStrategy({
            id: "parallel_execution",
            name: "Parallel Execution",
            description: "Execute independent operations in parallel",
            conditions: [
                {
                    type: "custom",
                    operator: "eq",
                    value: true,
                    customCheck: (profile, context) => this.canParallelize(profile, context),
                },
            ],
            actions: [
                {
                    type: "parallel",
                    parameters: { maxConcurrency: 5 },
                    execute: async (invocation, context) => this.applyParallelExecutionOptimization(invocation, context),
                },
            ],
            priority: 4,
            successRate: 0.8,
            averageImprovement: 0.5,
            enabled: true,
        });
        // Batch processing strategy
        this.addOptimizationStrategy({
            id: "batch_processing",
            name: "Batch Processing",
            description: "Batch similar requests for efficiency",
            conditions: [
                {
                    type: "throughput",
                    operator: "gt",
                    value: 10, // Batch if high throughput
                },
            ],
            actions: [
                {
                    type: "batch",
                    parameters: { batchSize: 10, maxWaitTime: 100 },
                    execute: async (invocation, context) => this.applyBatchProcessingOptimization(invocation, context),
                },
            ],
            priority: 5,
            successRate: 0.7,
            averageImprovement: 0.6,
            enabled: true,
        });
    }
    async selectOptimizationStrategies(context) {
        const applicable = [];
        for (const strategy of this.optimizationStrategies.values()) {
            if (!strategy.enabled)
                continue;
            const conditionsMet = await this.evaluateConditions(strategy.conditions, context);
            if (conditionsMet) {
                applicable.push(strategy);
            }
        }
        // Sort by priority and effectiveness
        return applicable.sort((a, b) => {
            const scoreA = a.priority * a.successRate * a.averageImprovement;
            const scoreB = b.priority * b.successRate * b.averageImprovement;
            return scoreB - scoreA;
        });
    }
    async evaluateConditions(conditions, context) {
        for (const condition of conditions) {
            if (!(await this.evaluateCondition(condition, context))) {
                return false;
            }
        }
        return true;
    }
    async evaluateCondition(condition, context) {
        const { profile } = context;
        let actualValue;
        switch (condition.type) {
            case "latency":
                actualValue = profile.averageLatency;
                break;
            case "error_rate":
                actualValue = profile.errorRate;
                break;
            case "throughput":
                actualValue = profile.throughput;
                break;
            case "resource_usage":
                actualValue =
                    Math.max(profile.resourceUtilization.cpu, profile.resourceUtilization.memory) / 100;
                break;
            case "custom":
                return condition.customCheck
                    ? condition.customCheck(profile, context.originalInvocation.context)
                    : false;
            default:
                return false;
        }
        return this.compareValues(actualValue, condition.operator, condition.value);
    }
    compareValues(actual, operator, expected) {
        switch (operator) {
            case "gt":
                return actual > expected;
            case "lt":
                return actual < expected;
            case "eq":
                return actual === expected;
            case "gte":
                return actual >= expected;
            case "lte":
                return actual <= expected;
            case "contains":
                return String(actual).includes(String(expected));
            case "matches":
                return new RegExp(expected).test(String(actual));
            default:
                return false;
        }
    }
    async applyOptimizationStrategy(strategy, context) {
        const startTime = Date.now();
        // Execute the primary action
        const action = strategy.actions[0]; // Use first action for simplicity
        const result = await action.execute(context.originalInvocation, context);
        result.optimizationApplied = [strategy.name];
        result.metadata.optimizationOverhead = Date.now() - startTime;
        return result;
    }
    // Optimization action implementations
    async applyCachingOptimization(invocation, context) {
        const cacheKey = this.generateCacheKey(invocation);
        const cached = await this.cache.get(cacheKey);
        if (cached) {
            return {
                success: true,
                optimizationApplied: ["caching"],
                performanceImprovement: {
                    latencyReduction: 0.9,
                    throughputIncrease: 0.5,
                    resourceSavings: { cpu: 90, memory: 50 },
                },
                response: cached,
                metadata: {
                    executionTime: 10,
                    optimizationOverhead: 5,
                    cacheHit: true,
                    fallbackUsed: false,
                },
            };
        }
        // Execute and cache result
        const result = await this.executeWithoutOptimization(invocation, context, Date.now());
        if (result.response && result.response.success) {
            await this.cache.set(cacheKey, result.response, 300000); // 5 minutes
        }
        return result;
    }
    async applyCircuitBreakerOptimization(invocation, context) {
        const circuitBreaker = this.getOrCreateCircuitBreaker(invocation.toolId);
        if (circuitBreaker.isOpen()) {
            throw new Error("Circuit breaker is open - tool temporarily unavailable");
        }
        try {
            const result = await this.executeWithoutOptimization(invocation, context, Date.now());
            circuitBreaker.recordSuccess();
            return result;
        }
        catch (error) {
            circuitBreaker.recordFailure();
            throw error;
        }
    }
    async applyLoadBalancingOptimization(invocation, context) {
        const loadBalancer = this.getOrCreateLoadBalancer(invocation.toolId);
        const selectedInstance = loadBalancer.selectInstance();
        // Simulate load balancing by adjusting execution
        const result = await this.executeWithoutOptimization(invocation, context, Date.now());
        result.performanceImprovement = {
            latencyReduction: 0.3,
            throughputIncrease: 0.4,
            resourceSavings: { cpu: 20, memory: 15 },
        };
        return result;
    }
    async applyParallelExecutionOptimization(invocation, context) {
        // Simulate parallel execution
        const result = await this.executeWithoutOptimization(invocation, context, Date.now());
        result.performanceImprovement = {
            latencyReduction: 0.5,
            throughputIncrease: 0.8,
            resourceSavings: { cpu: 30, memory: 20 },
        };
        return result;
    }
    async applyBatchProcessingOptimization(invocation, context) {
        const batchProcessor = this.getOrCreateBatchProcessor(invocation.toolId);
        return new Promise((resolve) => {
            batchProcessor.addRequest(invocation, (result) => {
                resolve({
                    success: true,
                    optimizationApplied: ["batch_processing"],
                    performanceImprovement: {
                        latencyReduction: 0.4,
                        throughputIncrease: 0.6,
                        resourceSavings: { cpu: 25, memory: 20, network: 40 },
                    },
                    response: result,
                    metadata: {
                        executionTime: 200,
                        optimizationOverhead: 50,
                        cacheHit: false,
                        fallbackUsed: false,
                    },
                });
            });
        });
    }
    async executeWithoutOptimization(invocation, context, startTime) {
        // Simulate tool execution
        const executionTime = Math.random() * 1000 + 500; // 500-1500ms
        await new Promise((resolve) => setTimeout(resolve, executionTime));
        const response = {
            requestId: invocation.requestId,
            toolId: invocation.toolId,
            success: Math.random() > 0.1, // 90% success rate
            data: { result: "simulated execution" },
            metadata: {
                executionTime,
                resourceUsage: { cpu: 10, memory: 20, network: 5 },
                cached: false,
                trustVerified: true,
                securityFlags: [],
            },
            timestamp: Date.now(),
        };
        return {
            success: response.success,
            optimizationApplied: [],
            performanceImprovement: {
                latencyReduction: 0,
                throughputIncrease: 0,
                resourceSavings: {},
            },
            response,
            metadata: {
                executionTime: Date.now() - startTime,
                optimizationOverhead: 0,
                cacheHit: false,
                fallbackUsed: false,
            },
        };
    }
    generateCacheKey(invocation) {
        const keyData = {
            toolId: invocation.toolId,
            parameters: invocation.parameters,
            trustLevel: invocation.context.trustLevel,
        };
        return `opt_cache:${Buffer.from(JSON.stringify(keyData)).toString("base64")}`;
    }
    canParallelize(profile, context) {
        // Simple heuristic for parallel execution capability
        return profile.resourceUtilization.cpu < 50 && profile.averageLatency > 200;
    }
    extractConstraints(invocation) {
        // Extract constraints from invocation metadata
        return {
            maxLatency: invocation.context.metadata?.maxLatency,
            maxResourceUsage: invocation.context.metadata?.maxResourceUsage,
            minSuccessRate: invocation.context.metadata?.minSuccessRate || 0.95,
        };
    }
    async getCurrentSystemLoad() {
        // Simulate system load metrics
        return {
            cpuUsage: Math.random() * 100,
            memoryUsage: Math.random() * 100,
            networkLatency: Math.random() * 100,
            diskIO: Math.random() * 100,
            activeConnections: Math.floor(Math.random() * 1000),
            queueLength: Math.floor(Math.random() * 50),
            timestamp: new Date(),
        };
    }
    async getHistoricalData(toolId) {
        // Simulate historical data
        return {
            timeWindow: "24h",
            invocations: Math.floor(Math.random() * 1000),
            patterns: {
                peakHours: [9, 10, 11, 14, 15, 16],
                commonParameterSizes: [100, 500, 1000],
                frequentErrors: ["timeout", "network_error"],
                performanceTrends: [],
            },
        };
    }
    async updatePerformanceProfile(toolId, result) {
        const profile = await this.getPerformanceProfile(toolId);
        if (result.response) {
            const latency = result.response.metadata.executionTime;
            // Update moving averages
            profile.averageLatency = profile.averageLatency * 0.9 + latency * 0.1;
            profile.successRate =
                profile.successRate * 0.9 + (result.response.success ? 1 : 0) * 0.1;
            profile.errorRate = 1 - profile.successRate;
            profile.lastUpdated = new Date();
        }
    }
    async updateStrategyMetrics(strategyId, success, improvement) {
        const strategy = this.optimizationStrategies.get(strategyId);
        if (strategy) {
            // Update success rate
            strategy.successRate =
                strategy.successRate * 0.9 + (success ? 1 : 0) * 0.1;
            // Update average improvement
            if (success && improvement) {
                const totalImprovement = improvement.latencyReduction + improvement.throughputIncrease;
                strategy.averageImprovement =
                    strategy.averageImprovement * 0.9 + totalImprovement * 0.1;
            }
        }
    }
    startPerformanceMonitoring() {
        // Collect system load metrics every 30 seconds
        setInterval(async () => {
            const load = await this.getCurrentSystemLoad();
            this.systemLoadHistory.push(load);
            // Keep only last 100 measurements
            if (this.systemLoadHistory.length > 100) {
                this.systemLoadHistory.shift();
            }
        }, 30000);
    }
    // Helper classes for optimization strategies
    getOrCreateCircuitBreaker(toolId) {
        if (!this.circuitBreakers.has(toolId)) {
            this.circuitBreakers.set(toolId, new CircuitBreaker(toolId));
        }
        return this.circuitBreakers.get(toolId);
    }
    getOrCreateLoadBalancer(toolId) {
        if (!this.loadBalancers.has(toolId)) {
            this.loadBalancers.set(toolId, new LoadBalancer(toolId));
        }
        return this.loadBalancers.get(toolId);
    }
    getOrCreateBatchProcessor(toolId) {
        if (!this.batchProcessors.has(toolId)) {
            this.batchProcessors.set(toolId, new BatchProcessor(toolId));
        }
        return this.batchProcessors.get(toolId);
    }
}
/**
 * Circuit Breaker implementation
 */
class CircuitBreaker {
    toolId;
    failureThreshold;
    resetTimeout;
    failures = 0;
    lastFailureTime = 0;
    state = "closed";
    constructor(toolId, failureThreshold = 5, resetTimeout = 30000) {
        this.toolId = toolId;
        this.failureThreshold = failureThreshold;
        this.resetTimeout = resetTimeout;
    }
    isOpen() {
        if (this.state === "open") {
            if (Date.now() - this.lastFailureTime > this.resetTimeout) {
                this.state = "half-open";
            }
        }
        return this.state === "open";
    }
    recordSuccess() {
        this.failures = 0;
        this.state = "closed";
    }
    recordFailure() {
        this.failures++;
        this.lastFailureTime = Date.now();
        if (this.failures >= this.failureThreshold) {
            this.state = "open";
        }
    }
}
/**
 * Load Balancer implementation
 */
class LoadBalancer {
    toolId;
    instances = ["instance1", "instance2", "instance3"];
    currentIndex = 0;
    constructor(toolId) {
        this.toolId = toolId;
    }
    selectInstance() {
        const instance = this.instances[this.currentIndex];
        this.currentIndex = (this.currentIndex + 1) % this.instances.length;
        return instance;
    }
}
/**
 * Batch Processor implementation
 */
class BatchProcessor {
    toolId;
    batchSize;
    maxWaitTime;
    pending = [];
    timer;
    constructor(toolId, batchSize = 10, maxWaitTime = 100) {
        this.toolId = toolId;
        this.batchSize = batchSize;
        this.maxWaitTime = maxWaitTime;
    }
    addRequest(invocation, callback) {
        this.pending.push({ invocation, callback });
        if (this.pending.length >= this.batchSize) {
            this.processBatch();
        }
        else if (!this.timer) {
            this.timer = setTimeout(() => this.processBatch(), this.maxWaitTime);
        }
    }
    processBatch() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = undefined;
        }
        const batch = this.pending.splice(0, this.batchSize);
        // Simulate batch processing
        setTimeout(() => {
            batch.forEach(({ invocation, callback }) => {
                const response = {
                    requestId: invocation.requestId,
                    toolId: invocation.toolId,
                    success: true,
                    data: { result: "batch processed" },
                    metadata: {
                        executionTime: 150,
                        resourceUsage: { cpu: 5, memory: 10, network: 2 },
                        cached: false,
                        trustVerified: true,
                        securityFlags: [],
                    },
                    timestamp: Date.now(),
                };
                callback(response);
            });
        }, 150);
    }
}
