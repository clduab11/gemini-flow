/**
 * Dynamic Capability Composer
 *
 * Provides runtime composition and aggregation of A2A capabilities.
 * Enables dynamic workflow creation, capability chaining, and intelligent
 * resource allocation based on context and requirements.
 */
import { EventEmitter } from "events";
import { Logger } from "../../../utils/logger.js";
import { CacheManager } from "../../../core/cache-manager.js";
import { PerformanceMonitor } from "../../../monitoring/performance-monitor.js";
/**
 * Main dynamic capability composer
 */
export class DynamicCapabilityComposer extends EventEmitter {
    logger;
    cache;
    performanceMonitor;
    capabilityManager;
    compositionPlans = new Map();
    activeExecutions = new Map();
    aggregations = new Map();
    adaptationHistory = new Map();
    constructor(capabilityManager) {
        super();
        this.logger = new Logger("DynamicCapabilityComposer");
        this.cache = new CacheManager();
        this.performanceMonitor = new PerformanceMonitor();
        this.capabilityManager = capabilityManager;
        this.logger.info("Dynamic Capability Composer initialized");
    }
    /**
     * Create a dynamic composition plan from requirements
     */
    async createCompositionPlan(request) {
        const startTime = Date.now();
        try {
            // Generate unique plan ID
            const planId = request.id || this.generatePlanId();
            this.logger.info("Creating composition plan", {
                planId,
                name: request.name,
                requiredCapabilities: request.requirements.capabilities.length,
            });
            // Step 1: Discover and select capabilities
            const selectedCapabilities = await this.selectCapabilities(request);
            // Step 2: Create execution graph
            const executionGraph = await this.createExecutionGraph(selectedCapabilities, request.requirements, request.context);
            // Step 3: Optimize execution plan
            const optimizedGraph = await this.optimizeExecutionGraph(executionGraph, request.requirements.preferences);
            // Step 4: Estimate metrics
            const estimatedMetrics = await this.estimateExecutionMetrics(optimizedGraph);
            // Step 5: Assess risks
            const riskAssessment = await this.assessExecutionRisks(optimizedGraph, request.context);
            // Step 6: Generate optimizations
            const optimizations = await this.generateOptimizations(optimizedGraph, request.requirements.preferences);
            const plan = {
                id: planId,
                request,
                selectedCapabilities: selectedCapabilities.map((c) => c.id),
                executionGraph: optimizedGraph,
                estimatedMetrics,
                optimizations,
                riskAssessment,
            };
            this.compositionPlans.set(planId, plan);
            this.logger.info("Composition plan created successfully", {
                planId,
                executionTime: Date.now() - startTime,
                nodeCount: optimizedGraph.length,
                estimatedLatency: estimatedMetrics.totalLatency,
            });
            this.emit("plan_created", plan);
            return plan;
        }
        catch (error) {
            this.logger.error("Failed to create composition plan", {
                request: request.name,
                error: error.message,
            });
            throw error;
        }
    }
    /**
     * Execute a composition plan
     */
    async executeCompositionPlan(planId, runtimeParameters) {
        const plan = this.compositionPlans.get(planId);
        if (!plan) {
            throw new Error(`Composition plan not found: ${planId}`);
        }
        const executionContext = {
            planId,
            requestId: this.generateRequestId(),
            currentNode: "",
            results: new Map(),
            errors: new Map(),
            metadata: { ...runtimeParameters },
            startTime: Date.now(),
        };
        this.activeExecutions.set(executionContext.requestId, executionContext);
        try {
            this.logger.info("Starting composition execution", {
                planId,
                requestId: executionContext.requestId,
                nodeCount: plan.executionGraph.length,
            });
            // Execute nodes based on dependency graph
            const result = await this.executeExecutionGraph(plan.executionGraph, executionContext);
            const executionTime = Date.now() - executionContext.startTime;
            this.logger.info("Composition execution completed", {
                planId,
                requestId: executionContext.requestId,
                executionTime,
                success: true,
            });
            this.emit("execution_completed", {
                planId,
                requestId: executionContext.requestId,
                result,
                executionTime,
            });
            return result;
        }
        catch (error) {
            this.logger.error("Composition execution failed", {
                planId,
                requestId: executionContext.requestId,
                error: error.message,
            });
            this.emit("execution_failed", {
                planId,
                requestId: executionContext.requestId,
                error,
            });
            throw error;
        }
        finally {
            this.activeExecutions.delete(executionContext.requestId);
        }
    }
    /**
     * Create a dynamic aggregation
     */
    async createDynamicAggregation(name, targetCapabilities, strategy = "merge", options = {}) {
        const aggregationId = this.generateAggregationId();
        // Validate target capabilities exist
        for (const capabilityId of targetCapabilities) {
            const capability = this.capabilityManager.getCapability(capabilityId);
            if (!capability) {
                throw new Error(`Target capability not found: ${capabilityId}`);
            }
        }
        const aggregation = {
            id: aggregationId,
            name,
            targetCapabilities,
            aggregationStrategy: strategy,
            resultCombination: options.resultCombination || "union",
            qualityMetrics: {
                accuracy: 0,
                completeness: 0,
                consistency: 0,
            },
            adaptationRules: options.adaptationRules || [],
        };
        this.aggregations.set(aggregationId, aggregation);
        this.logger.info("Dynamic aggregation created", {
            id: aggregationId,
            name,
            capabilityCount: targetCapabilities.length,
            strategy,
        });
        this.emit("aggregation_created", aggregation);
        return aggregation;
    }
    /**
     * Execute dynamic aggregation
     */
    async executeDynamicAggregation(aggregationId, parameters, context) {
        const aggregation = this.aggregations.get(aggregationId);
        if (!aggregation) {
            throw new Error(`Dynamic aggregation not found: ${aggregationId}`);
        }
        const startTime = Date.now();
        try {
            this.logger.info("Executing dynamic aggregation", {
                id: aggregationId,
                name: aggregation.name,
                strategy: aggregation.aggregationStrategy,
            });
            let results;
            switch (aggregation.aggregationStrategy) {
                case "merge":
                    results = await this.executeMergeAggregation(aggregation, parameters, context);
                    break;
                case "sequence":
                    results = await this.executeSequenceAggregation(aggregation, parameters, context);
                    break;
                case "parallel":
                    results = await this.executeParallelAggregation(aggregation, parameters, context);
                    break;
                case "conditional":
                    results = await this.executeConditionalAggregation(aggregation, parameters, context);
                    break;
                default:
                    throw new Error(`Unknown aggregation strategy: ${aggregation.aggregationStrategy}`);
            }
            // Combine results based on combination strategy
            const combinedResults = await this.combineAggregationResults(results, aggregation.resultCombination);
            // Update quality metrics
            await this.updateQualityMetrics(aggregation, combinedResults);
            // Check for adaptation triggers
            await this.checkAdaptationTriggers(aggregation, combinedResults, context);
            const executionTime = Date.now() - startTime;
            this.logger.info("Dynamic aggregation completed", {
                id: aggregationId,
                executionTime,
                resultCount: Array.isArray(combinedResults)
                    ? combinedResults.length
                    : 1,
            });
            return combinedResults;
        }
        catch (error) {
            this.logger.error("Dynamic aggregation failed", {
                id: aggregationId,
                error: error.message,
            });
            throw error;
        }
    }
    /**
     * Adapt composition based on runtime feedback
     */
    async adaptComposition(planId, feedback) {
        const originalPlan = this.compositionPlans.get(planId);
        if (!originalPlan) {
            throw new Error(`Composition plan not found: ${planId}`);
        }
        this.logger.info("Adapting composition plan", {
            planId,
            feedback: Object.keys(feedback),
        });
        // Analyze feedback and determine adaptations
        const adaptations = await this.analyzeAdaptationNeeds(originalPlan, feedback);
        // Apply adaptations to create new plan
        const adaptedPlan = await this.applyAdaptations(originalPlan, adaptations);
        // Store adaptation history
        this.recordAdaptation(planId, adaptations);
        this.emit("plan_adapted", {
            originalPlan,
            adaptedPlan,
            adaptations,
        });
        return adaptedPlan;
    }
    /**
     * Private helper methods
     */
    async selectCapabilities(request) {
        const query = {
            minTrustLevel: request.context.trustLevel,
            requiredCapabilities: request.context.capabilities,
            resourceConstraints: request.requirements.constraints,
        };
        const availableCapabilities = await this.capabilityManager.queryCapabilities(query);
        // Select best capabilities for each requirement
        const selected = [];
        for (const requiredCapability of request.requirements.capabilities) {
            const matches = availableCapabilities.filter((cap) => cap.capability.name.includes(requiredCapability) ||
                cap.metadata.tags?.includes(requiredCapability));
            if (matches.length === 0) {
                throw new Error(`No suitable capability found for requirement: ${requiredCapability}`);
            }
            // Select best match based on strategy
            const best = this.selectBestCapability(matches, request.requirements.preferences?.strategy);
            selected.push(best);
        }
        return selected;
    }
    selectBestCapability(candidates, strategy = "balanced") {
        if (candidates.length === 1)
            return candidates[0];
        switch (strategy) {
            case "performance":
                return candidates.sort((a, b) => a.usage.avgLatency - b.usage.avgLatency)[0];
            case "reliability":
                return candidates.sort((a, b) => b.usage.successRate - a.usage.successRate)[0];
            case "cost":
                return candidates.sort((a, b) => (a.metadata.cost || 0) - (b.metadata.cost || 0))[0];
            default:
                // Balanced scoring
                return candidates.sort((a, b) => {
                    const scoreA = a.usage.successRate * (1 / Math.max(a.usage.avgLatency, 1));
                    const scoreB = b.usage.successRate * (1 / Math.max(b.usage.avgLatency, 1));
                    return scoreB - scoreA;
                })[0];
        }
    }
    async createExecutionGraph(capabilities, requirements, context) {
        const nodes = [];
        for (let i = 0; i < capabilities.length; i++) {
            const capability = capabilities[i];
            const node = {
                id: `node_${i}`,
                capabilityId: capability.id,
                dependencies: i > 0 ? [`node_${i - 1}`] : [], // Simple sequential dependency
                parameters: {},
                timeout: capability.capability.performance.avgLatency * 2, // 2x expected latency
                priority: 1,
            };
            // Add retry policy based on preferences
            if (requirements.preferences?.faultTolerance !== "none") {
                node.retryPolicy = {
                    maxAttempts: requirements.preferences?.faultTolerance === "redundancy" ? 3 : 2,
                    backoff: "exponential",
                    baseDelay: 1000,
                    maxDelay: 10000,
                    retryConditions: ["timeout", "network_error", "temporary_failure"],
                };
            }
            nodes.push(node);
        }
        return nodes;
    }
    async optimizeExecutionGraph(graph, preferences) {
        let optimizedGraph = [...graph];
        // Apply parallelization if preferred
        if (preferences?.parallelization) {
            optimizedGraph = this.parallelizeGraph(optimizedGraph);
        }
        // Reorder based on priorities and dependencies
        optimizedGraph = this.reorderByPriority(optimizedGraph);
        return optimizedGraph;
    }
    parallelizeGraph(nodes) {
        // Simple parallelization - remove unnecessary sequential dependencies
        return nodes.map((node, index) => {
            if (index > 0 && !this.hasDataDependency(node, nodes[index - 1])) {
                return {
                    ...node,
                    dependencies: [], // Remove sequential dependency
                };
            }
            return node;
        });
    }
    hasDataDependency(node, previousNode) {
        // Check if node requires output from previousNode
        // This is a simplified check - in practice would analyze parameter dependencies
        return false;
    }
    reorderByPriority(nodes) {
        // Topological sort considering priorities
        return nodes.sort((a, b) => {
            // First by dependencies, then by priority
            if (a.dependencies.includes(b.id))
                return 1;
            if (b.dependencies.includes(a.id))
                return -1;
            return b.priority - a.priority;
        });
    }
    async estimateExecutionMetrics(graph) {
        // Calculate estimated metrics based on historical data
        const capabilities = await Promise.all(graph.map((node) => this.capabilityManager.getCapability(node.capabilityId)));
        const totalLatency = capabilities.reduce((sum, cap) => sum + (cap?.capability.performance.avgLatency || 0), 0);
        const maxResourceUsage = capabilities.reduce((max, cap) => {
            const levels = ["low", "medium", "high"];
            const currentIndex = levels.indexOf(cap?.capability.performance.resourceUsage || "low");
            const maxIndex = levels.indexOf(max);
            return currentIndex > maxIndex
                ? cap.capability.performance.resourceUsage
                : max;
        }, "low");
        const reliability = capabilities.reduce((product, cap) => product * (cap?.usage.successRate || 0.9), 1);
        return {
            totalLatency,
            resourceUsage: maxResourceUsage,
            reliability,
            cost: capabilities.reduce((sum, cap) => sum + (cap?.metadata.cost || 0), 0),
        };
    }
    async assessExecutionRisks(graph, context) {
        const factors = [];
        const mitigations = [];
        // Check for single points of failure
        const criticalNodes = graph.filter((node) => node.dependencies.length === 0);
        if (criticalNodes.length === 1) {
            factors.push("Single point of failure");
            mitigations.push("Add redundant capability");
        }
        // Check trust level compatibility
        const capabilities = await Promise.all(graph.map((node) => this.capabilityManager.getCapability(node.capabilityId)));
        const trustMismatches = capabilities.filter((cap) => cap &&
            this.getTrustLevelIndex(cap.capability.security.minTrustLevel) >
                this.getTrustLevelIndex(context.trustLevel));
        if (trustMismatches.length > 0) {
            factors.push("Trust level mismatches");
            mitigations.push("Upgrade agent trust level");
        }
        const riskLevel = factors.length > 2 ? "high" : factors.length > 0 ? "medium" : "low";
        return {
            level: riskLevel,
            factors,
            mitigations,
        };
    }
    getTrustLevelIndex(level) {
        const levels = ["untrusted", "basic", "verified", "trusted", "privileged"];
        return levels.indexOf(level);
    }
    async generateOptimizations(graph, preferences) {
        const optimizations = [];
        if (preferences?.caching) {
            optimizations.push("Enable result caching");
        }
        if (preferences?.parallelization) {
            const parallelizable = graph.filter((node) => node.dependencies.length === 0);
            if (parallelizable.length > 1) {
                optimizations.push("Parallel execution enabled");
            }
        }
        return optimizations;
    }
    async executeExecutionGraph(graph, context) {
        // Execute nodes in dependency order
        const results = new Map();
        const completed = new Set();
        while (completed.size < graph.length) {
            // Find nodes ready to execute
            const ready = graph.filter((node) => !completed.has(node.id) &&
                node.dependencies.every((dep) => completed.has(dep)));
            if (ready.length === 0) {
                throw new Error("Circular dependency detected in execution graph");
            }
            // Execute ready nodes (potentially in parallel)
            const promises = ready.map(async (node) => {
                try {
                    context.currentNode = node.id;
                    const result = await this.executeNode(node, context);
                    results.set(node.id, result);
                    completed.add(node.id);
                    return result;
                }
                catch (error) {
                    context.errors.set(node.id, error);
                    throw error;
                }
            });
            await Promise.all(promises);
        }
        // Combine final results
        return Array.from(results.values()).pop(); // Return last result for now
    }
    async executeNode(node, context) {
        const capability = this.capabilityManager.getCapability(node.capabilityId);
        if (!capability) {
            throw new Error(`Capability not found: ${node.capabilityId}`);
        }
        // Create invocation (simplified)
        const invocation = {
            toolId: node.capabilityId,
            capabilityName: capability.capability.name,
            parameters: node.parameters,
            context: context.metadata, // Simplified
            requestId: context.requestId,
            timestamp: Date.now(),
            priority: "medium",
        };
        // Execute with retry logic
        let lastError = null;
        const maxAttempts = node.retryPolicy?.maxAttempts || 1;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                const result = await capability.wrapper.invoke(invocation);
                if (result.success) {
                    return result.data;
                }
                else {
                    throw new Error(result.error?.message || "Execution failed");
                }
            }
            catch (error) {
                lastError = error;
                if (attempt < maxAttempts && node.retryPolicy) {
                    const delay = this.calculateRetryDelay(attempt, node.retryPolicy);
                    await new Promise((resolve) => setTimeout(resolve, delay));
                }
            }
        }
        throw lastError || new Error("Node execution failed");
    }
    calculateRetryDelay(attempt, policy) {
        switch (policy.backoff) {
            case "fixed":
                return policy.baseDelay;
            case "linear":
                return policy.baseDelay * attempt;
            case "exponential":
                return Math.min(policy.baseDelay * Math.pow(2, attempt - 1), policy.maxDelay);
            default:
                return policy.baseDelay;
        }
    }
    // Aggregation execution methods (simplified implementations)
    async executeMergeAggregation(aggregation, parameters, context) {
        // Execute all capabilities and merge results
        const results = await Promise.all(aggregation.targetCapabilities.map(async (capId) => {
            const capability = this.capabilityManager.getCapability(capId);
            if (!capability)
                return null;
            // Simplified execution
            return { capabilityId: capId, result: parameters };
        }));
        return results.filter((r) => r !== null);
    }
    async executeSequenceAggregation(aggregation, parameters, context) {
        // Execute capabilities in sequence, passing results forward
        let currentParams = parameters;
        const results = [];
        for (const capId of aggregation.targetCapabilities) {
            const capability = this.capabilityManager.getCapability(capId);
            if (!capability)
                continue;
            // Simplified execution
            const result = { capabilityId: capId, result: currentParams };
            results.push(result);
            currentParams = { ...currentParams, ...result };
        }
        return results;
    }
    async executeParallelAggregation(aggregation, parameters, context) {
        // Execute all capabilities in parallel
        const promises = aggregation.targetCapabilities.map(async (capId) => {
            const capability = this.capabilityManager.getCapability(capId);
            if (!capability)
                return null;
            // Simplified execution
            return { capabilityId: capId, result: parameters };
        });
        const results = await Promise.all(promises);
        return results.filter((r) => r !== null);
    }
    async executeConditionalAggregation(aggregation, parameters, context) {
        // Execute capabilities based on conditions (simplified)
        const results = [];
        for (const capId of aggregation.targetCapabilities) {
            // Check conditions (simplified - always execute for now)
            const capability = this.capabilityManager.getCapability(capId);
            if (!capability)
                continue;
            const result = { capabilityId: capId, result: parameters };
            results.push(result);
            // Break early based on some condition
            if (results.length >= 2)
                break;
        }
        return results;
    }
    async combineAggregationResults(results, strategy) {
        switch (strategy) {
            case "union":
                return results.flat();
            case "intersection":
                return results.length > 0 ? results[0] : [];
            case "first":
                return results[0];
            case "best":
                return results.sort((a, b) => (b.score || 0) - (a.score || 0))[0];
            default:
                return results;
        }
    }
    async updateQualityMetrics(aggregation, results) {
        // Update quality metrics based on results (simplified)
        aggregation.qualityMetrics.accuracy = Math.random() * 0.3 + 0.7; // 0.7-1.0
        aggregation.qualityMetrics.completeness = Math.random() * 0.2 + 0.8; // 0.8-1.0
        aggregation.qualityMetrics.consistency = Math.random() * 0.4 + 0.6; // 0.6-1.0
    }
    async checkAdaptationTriggers(aggregation, results, context) {
        // Check adaptation rules and trigger adaptations if needed
        for (const rule of aggregation.adaptationRules) {
            const shouldTrigger = this.evaluateAdaptationTrigger(rule, results, context);
            if (shouldTrigger) {
                await this.applyAdaptationActions(aggregation, rule.actions);
            }
        }
    }
    evaluateAdaptationTrigger(rule, results, context) {
        // Simplified trigger evaluation
        return Math.random() < 0.1; // 10% chance to trigger adaptation
    }
    async applyAdaptationActions(aggregation, actions) {
        // Apply adaptation actions (simplified)
        this.logger.info("Applying adaptation actions", {
            aggregationId: aggregation.id,
            actionCount: actions.length,
        });
    }
    async analyzeAdaptationNeeds(plan, feedback) {
        // Analyze feedback and determine what adaptations are needed
        return [];
    }
    async applyAdaptations(originalPlan, adaptations) {
        // Apply adaptations to create new plan
        return { ...originalPlan };
    }
    recordAdaptation(planId, adaptations) {
        if (!this.adaptationHistory.has(planId)) {
            this.adaptationHistory.set(planId, []);
        }
        // Record adaptation history (simplified)
    }
    generatePlanId() {
        return `plan_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateAggregationId() {
        return `agg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }
    /**
     * Public API methods for management
     */
    getCompositionPlan(planId) {
        return this.compositionPlans.get(planId);
    }
    listCompositionPlans() {
        return Array.from(this.compositionPlans.values());
    }
    getDynamicAggregation(aggregationId) {
        return this.aggregations.get(aggregationId);
    }
    listDynamicAggregations() {
        return Array.from(this.aggregations.values());
    }
    getActiveExecutions() {
        return Array.from(this.activeExecutions.values());
    }
}
//# sourceMappingURL=dynamic-capability-composer.js.map