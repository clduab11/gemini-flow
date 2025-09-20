/**
 * High-Performance Smart Routing Engine
 *
 * Intelligent model routing with <75ms overhead guarantee
 * Features: LRU cache, intelligent selection, performance monitoring
 * Performance target: Sub-75ms routing decisions with 95% accuracy
 */
import { Logger } from "../utils/logger.js";
import { EventEmitter } from "events";
export class ModelRouter extends EventEmitter {
    constructor() {
        super();
        this.rules = new Map();
        this.performance = new Map();
        this.loadBalancer = new Map(); // Model usage counters
        // High-performance LRU cache with 1000 entry limit
        this.routingCache = new Map();
        this.cacheAccessOrder = [];
        this.CACHE_LIMIT = 1000;
        this.CACHE_TTL = 300000; // 5 minutes
        // Performance monitoring
        this.routingTimes = [];
        this.MAX_ROUTING_TIME_SAMPLES = 100;
        this.ROUTING_TIME_TARGET = 75; // milliseconds
        // Intelligent complexity analysis cache
        this.complexityCache = new Map();
        // Routing weights for different factors (optimized for <75ms)
        this.weights = {
            latency: 0.35,
            cost: 0.15,
            reliability: 0.25,
            userTier: 0.15,
            complexity: 0.1,
        };
        // Model tier mapping for quick access
        this.modelTierMap = new Map();
        this.availabilityMap = new Map();
        this.logger = new Logger("SmartModelRouter");
        this.initializeDefaultRules();
        this.startPerformanceMonitoring();
        this.warmupComplexityAnalyzer();
        this.logger.info("Smart routing engine initialized", {
            cacheLimit: this.CACHE_LIMIT,
            routingTarget: `${this.ROUTING_TIME_TARGET}ms`,
            features: ["LRU cache", "complexity analysis", "intelligent selection"],
        });
    }
    /**
     * Initialize default routing rules
     */
    initializeDefaultRules() {
        // Rule 1: Route critical tasks to most reliable models
        this.addRule({
            id: "critical-tasks",
            name: "Critical Task Routing",
            condition: (ctx) => ctx.priority === "critical",
            modelPreference: [
                "gemini-2.5-deep-think",
                "gemini-2.5-pro",
                "gemini-pro-vertex",
                "gemini-2.0-flash-thinking",
            ],
            weight: 10,
            active: true,
        });
        // Rule 2: Route enterprise users to premium models
        this.addRule({
            id: "enterprise-tier",
            name: "Enterprise Tier Routing",
            condition: (ctx) => ctx.userTier === "enterprise",
            modelPreference: [
                "gemini-2.5-deep-think",
                "gemini-2.5-pro",
                "gemini-pro-vertex",
                "gemini-2.0-flash-thinking",
            ],
            weight: 8,
            active: true,
        });
        // Rule 3: Route low-latency requirements to fast models
        this.addRule({
            id: "low-latency",
            name: "Low Latency Routing",
            condition: (ctx) => ctx.latencyRequirement < 1000,
            modelPreference: [
                "gemini-2.5-flash",
                "gemini-2.0-flash",
                "gemini-2.0-flash-thinking",
            ],
            weight: 7,
            active: true,
        });
        // Rule 4: Route code tasks to specialized models
        this.addRule({
            id: "code-tasks",
            name: "Code Task Routing",
            condition: (ctx) => ctx.task.toLowerCase().includes("code") ||
                ctx.capabilities?.includes("code"),
            modelPreference: [
                "gemini-2.5-pro",
                "gemini-2.5-flash",
                "gemini-2.0-flash-thinking",
                "gemini-2.0-flash",
            ],
            weight: 6,
            active: true,
        });
        // Rule 5: Route large context tasks to appropriate models
        this.addRule({
            id: "large-context",
            name: "Large Context Routing",
            condition: (ctx) => (ctx.tokenBudget || 0) > 100000,
            modelPreference: [
                "gemini-2.5-deep-think",
                "gemini-2.5-pro",
                "gemini-pro-vertex",
            ],
            weight: 5,
            active: true,
        });
        // Rule 6: Free tier gets basic models
        this.addRule({
            id: "free-tier",
            name: "Free Tier Routing",
            condition: (ctx) => ctx.userTier === "free",
            modelPreference: ["gemini-2.0-flash", "gemini-2.5-flash"],
            weight: 3,
            active: true,
        });
        // Rule 7: Deep reasoning tasks get specialized models
        this.addRule({
            id: "deep-reasoning",
            name: "Deep Reasoning Routing",
            condition: (ctx) => ctx.task.toLowerCase().includes("complex") ||
                ctx.task.toLowerCase().includes("analyze") ||
                ctx.capabilities?.includes("deep-reasoning"),
            modelPreference: ["gemini-2.5-deep-think", "gemini-2.5-pro"],
            weight: 9,
            active: true,
        });
        this.logger.info("Default routing rules initialized", {
            ruleCount: this.rules.size,
        });
    }
    /**
     * Add a routing rule
     */
    addRule(rule) {
        this.rules.set(rule.id, rule);
        this.logger.debug("Routing rule added", { id: rule.id, name: rule.name });
    }
    /**
     * Remove a routing rule
     */
    removeRule(ruleId) {
        const removed = this.rules.delete(ruleId);
        if (removed) {
            this.logger.debug("Routing rule removed", { id: ruleId });
        }
        return removed;
    }
    /**
     * High-performance model selection with <75ms guarantee
     */
    async selectOptimalModel(context, availableModels) {
        const startTime = performance.now();
        try {
            // Update model availability map for quick access
            this.updateAvailabilityMap(availableModels);
            // 1. Check LRU cache first for sub-10ms responses
            const cacheKey = this.generateRoutingCacheKey(context);
            const cachedResult = this.getFromCache(cacheKey);
            if (cachedResult && this.isCacheValid(cachedResult)) {
                const routingTime = performance.now() - startTime;
                this.recordRoutingTime(routingTime);
                return {
                    modelName: cachedResult.modelName,
                    confidence: 0.95,
                    reason: "LRU cache hit",
                    routingTime,
                    fromCache: true,
                };
            }
            // 2. Intelligent complexity analysis (optimized for speed)
            const complexityAnalysis = this.analyzeRequestComplexity(context);
            // 3. Fast candidate selection based on complexity and user tier
            const candidates = this.fastCandidateSelection(context, availableModels, complexityAnalysis);
            if (candidates.length === 0) {
                const fallback = this.getFallbackModel(context.userTier, availableModels);
                const routingTime = performance.now() - startTime;
                return {
                    modelName: fallback,
                    confidence: 0.3,
                    reason: "No candidates available - fallback",
                    routingTime,
                    fromCache: false,
                };
            }
            // 4. Optimized scoring with parallel processing
            const bestCandidate = this.fastModelScoring(candidates, context, availableModels, complexityAnalysis);
            // 5. Update caches and counters
            this.updateCache(cacheKey, bestCandidate.modelName);
            this.updateLoadBalancer(bestCandidate.modelName);
            const routingTime = performance.now() - startTime;
            this.recordRoutingTime(routingTime);
            // 6. Performance warning if routing exceeds target
            if (routingTime > this.ROUTING_TIME_TARGET) {
                this.logger.warn("Routing time exceeded target", {
                    routingTime,
                    target: this.ROUTING_TIME_TARGET,
                    cacheHit: false,
                });
                this.emit("routing_slow", {
                    routingTime,
                    target: this.ROUTING_TIME_TARGET,
                });
            }
            const decision = {
                modelName: bestCandidate.modelName,
                confidence: bestCandidate.confidence,
                reason: bestCandidate.reason,
                routingTime,
                fromCache: false,
            };
            this.emit("routing_decision", decision);
            return decision;
        }
        catch (error) {
            this.logger.error("Smart routing failed", { error, context });
            // Emergency fallback with minimal overhead
            const fallback = this.getFallbackModel(context.userTier, availableModels);
            const routingTime = performance.now() - startTime;
            return {
                modelName: fallback,
                confidence: 0.1,
                reason: `Emergency fallback: ${error.message}`,
                routingTime,
                fromCache: false,
            };
        }
    }
    /**
     * Apply routing rules to get candidate models
     */
    applyroutingRules(context, availableModels) {
        const matchedRules = [];
        // Find all matching rules
        for (const rule of this.rules.values()) {
            if (rule.active && rule.condition(context)) {
                matchedRules.push({ rule, score: rule.weight });
            }
        }
        // Sort by weight (highest first)
        matchedRules.sort((a, b) => b.score - a.score);
        // Collect candidate models from matching rules
        const candidates = new Set();
        for (const { rule } of matchedRules) {
            for (const model of rule.modelPreference) {
                if (availableModels.has(model)) {
                    candidates.add(model);
                }
            }
        }
        // If no rules matched, use all available models
        if (candidates.size === 0) {
            return Array.from(availableModels.keys());
        }
        return Array.from(candidates);
    }
    /**
     * Score candidate models based on multiple factors
     */
    async scoreCandidates(candidates, context, availableModels) {
        const scored = [];
        for (const modelName of candidates) {
            const modelConfig = availableModels.get(modelName);
            if (!modelConfig)
                continue;
            const perf = this.performance.get(modelName);
            let score = 0;
            // Factor 1: Latency score (lower latency = higher score)
            const latencyScore = this.calculateLatencyScore(perf?.avgLatency || modelConfig.latencyTarget, context.latencyRequirement);
            score += latencyScore * this.weights.latency;
            // Factor 2: Cost score (lower cost = higher score for non-enterprise)
            const costScore = this.calculateCostScore(modelConfig.costPerToken, context.userTier);
            score += costScore * this.weights.cost;
            // Factor 3: Reliability score
            const reliabilityScore = this.calculateReliabilityScore(perf);
            score += reliabilityScore * this.weights.reliability;
            // Factor 4: User tier compatibility
            const tierScore = this.calculateTierScore(modelConfig.tier, context.userTier);
            score += tierScore * this.weights.userTier;
            // Factor 5: Capability match
            const capabilityScore = this.calculateCapabilityScore(modelConfig.capabilities, context.capabilities || []);
            score += capabilityScore * 0.1; // Small additional weight
            scored.push({ model: modelName, score });
        }
        // Sort by score (highest first)
        return scored.sort((a, b) => b.score - a.score);
    }
    /**
     * Calculate latency score (0-1, higher is better)
     */
    calculateLatencyScore(modelLatency, requiredLatency) {
        if (modelLatency <= requiredLatency) {
            return 1.0; // Perfect score if under requirement
        }
        // Penalize models that exceed requirement
        const penalty = (modelLatency - requiredLatency) / requiredLatency;
        return Math.max(0, 1.0 - penalty);
    }
    /**
     * Calculate cost score (0-1, higher is better)
     */
    calculateCostScore(modelCost, userTier) {
        // Enterprise users care less about cost
        if (userTier === "enterprise") {
            return 0.8; // Moderate score regardless of cost
        }
        // For free/pro users, prefer lower cost models
        const maxAcceptableCost = userTier === "pro" ? 0.000003 : 0.000001;
        if (modelCost <= maxAcceptableCost) {
            return 1.0;
        }
        // Penalize expensive models for cost-conscious tiers
        const penalty = (modelCost - maxAcceptableCost) / maxAcceptableCost;
        return Math.max(0, 1.0 - penalty);
    }
    /**
     * Calculate reliability score based on historical performance
     */
    calculateReliabilityScore(perf) {
        if (!perf || perf.usageCount < 10) {
            return 0.7; // Neutral score for new/unused models
        }
        const successRate = (perf.usageCount - perf.errorCount) / perf.usageCount;
        return successRate;
    }
    /**
     * Calculate tier compatibility score
     */
    calculateTierScore(modelTier, userTier) {
        const tierHierarchy = { free: 0, pro: 1, enterprise: 2 };
        const modelLevel = tierHierarchy[modelTier] || 0;
        const userLevel = tierHierarchy[userTier] || 0;
        // Users can access their tier and below
        if (userLevel >= modelLevel) {
            return 1.0;
        }
        // Penalty for accessing higher tier models
        return 0.1;
    }
    /**
     * Calculate capability match score
     */
    calculateCapabilityScore(modelCaps, requiredCaps) {
        if (requiredCaps.length === 0) {
            return 1.0; // No specific requirements
        }
        const matches = requiredCaps.filter((cap) => modelCaps.includes(cap)).length;
        return matches / requiredCaps.length;
    }
    /**
     * Apply load balancing to final selection
     */
    applyLoadBalancing(scoredCandidates) {
        if (scoredCandidates.length === 0) {
            throw new Error("No candidates available for selection");
        }
        if (scoredCandidates.length === 1) {
            return scoredCandidates[0].model;
        }
        // Use weighted random selection from top candidates
        const topCandidates = scoredCandidates.slice(0, Math.min(3, scoredCandidates.length));
        // Apply load balancing bias
        const adjusted = topCandidates.map((candidate) => {
            const usage = this.loadBalancer.get(candidate.model) || 0;
            const balanceBonus = Math.max(0, 1.0 - usage / 100); // Reduce score for heavily used models
            return {
                model: candidate.model,
                score: candidate.score * (1 + balanceBonus * 0.2), // 20% bonus for less used models
            };
        });
        // Weighted random selection
        const totalScore = adjusted.reduce((sum, candidate) => sum + candidate.score, 0);
        let random = Math.random() * totalScore;
        for (const candidate of adjusted) {
            random -= candidate.score;
            if (random <= 0) {
                return candidate.model;
            }
        }
        // Fallback to first candidate
        return adjusted[0].model;
    }
    /**
     * Update load balancer counters
     */
    updateLoadBalancer(modelName) {
        const current = this.loadBalancer.get(modelName) || 0;
        this.loadBalancer.set(modelName, current + 1);
        // Reset counters periodically to prevent overflow
        if (current > 1000) {
            this.resetLoadBalancer();
        }
    }
    /**
     * Reset load balancer counters
     */
    resetLoadBalancer() {
        this.loadBalancer.clear();
        this.logger.debug("Load balancer counters reset");
    }
    /**
     * Get fallback model based on user tier
     */
    getFallbackModel(userTier, availableModels) {
        const fallbacks = {
            enterprise: [
                "gemini-2.5-pro",
                "gemini-pro-vertex",
                "gemini-2.0-flash-thinking",
                "gemini-2.0-flash",
            ],
            pro: [
                "gemini-2.5-flash",
                "gemini-2.0-flash-thinking",
                "gemini-2.0-flash",
            ],
            free: ["gemini-2.0-flash", "gemini-2.5-flash"],
        };
        const tierFallbacks = fallbacks[userTier] || fallbacks.free;
        for (const model of tierFallbacks) {
            if (availableModels.has(model)) {
                return model;
            }
        }
        // Last resort - return first available model
        const firstAvailable = Array.from(availableModels.keys())[0];
        if (!firstAvailable) {
            throw new Error("No models available");
        }
        return firstAvailable;
    }
    /**
     * Fast complexity analysis for intelligent routing
     */
    analyzeRequestComplexity(context) {
        // Check cache first
        const contextKey = `${context.task.substring(0, 100)}:${context.priority}`;
        const cached = this.complexityCache.get(contextKey);
        if (cached)
            return cached;
        // Fast complexity scoring
        const tokenCount = this.estimateTokenCount(context.task);
        const keywordComplexity = this.analyzeKeywords(context.task);
        const structuralComplexity = this.analyzeStructure(context.task);
        const domainSpecific = this.isDomainSpecific(context.task, context.capabilities);
        const score = this.calculateComplexityScore({
            tokenCount,
            keywordComplexity,
            structuralComplexity,
            domainSpecific,
        });
        const analysis = {
            score,
            factors: {
                tokenCount,
                keywordComplexity,
                structuralComplexity,
                domainSpecific,
            },
        };
        // Cache result with TTL
        this.complexityCache.set(contextKey, analysis);
        // Cleanup cache if it gets too large
        if (this.complexityCache.size > 500) {
            this.cleanupComplexityCache();
        }
        return analysis;
    }
    /**
     * Fast candidate selection based on tier and complexity
     */
    fastCandidateSelection(context, availableModels, complexity) {
        const candidates = [];
        const userTierLevel = this.getTierLevel(context.userTier);
        // Fast iteration through available models
        for (const [modelName, config] of availableModels) {
            // Quick tier check
            const modelTierLevel = this.getTierLevel(config.tier);
            if (userTierLevel < modelTierLevel)
                continue;
            // Availability check
            if (!this.availabilityMap.get(modelName))
                continue;
            // Complexity-based filtering
            if (this.isModelSuitableForComplexity(config, complexity, context)) {
                candidates.push(modelName);
            }
        }
        return candidates;
    }
    /**
     * Optimized model scoring with minimal overhead
     */
    fastModelScoring(candidates, context, availableModels, complexity) {
        let bestModel = candidates[0];
        let bestScore = -1;
        let reason = "Default selection";
        for (const modelName of candidates) {
            const config = availableModels.get(modelName);
            const perf = this.performance.get(modelName);
            // Fast scoring algorithm
            let score = 0;
            // Latency factor (most important for <75ms target)
            const latencyScore = this.fastLatencyScore(config, perf, context);
            score += latencyScore * this.weights.latency;
            // Complexity matching
            const complexityScore = this.fastComplexityScore(config, complexity);
            score += complexityScore * this.weights.complexity;
            // Reliability (quick calculation)
            const reliabilityScore = this.fastReliabilityScore(perf);
            score += reliabilityScore * this.weights.reliability;
            // Cost consideration
            const costScore = this.fastCostScore(config, context.userTier);
            score += costScore * this.weights.cost;
            if (score > bestScore) {
                bestScore = score;
                bestModel = modelName;
                reason = `Best match: latency=${latencyScore.toFixed(2)}, complexity=${complexityScore.toFixed(2)}`;
            }
        }
        const confidence = Math.min(0.95, bestScore);
        return { modelName: bestModel, confidence, reason };
    }
    /**
     * LRU cache operations
     */
    getFromCache(key) {
        const entry = this.routingCache.get(key);
        if (!entry)
            return null;
        // Update access order for LRU
        this.updateCacheAccess(key);
        entry.accessCount++;
        return entry;
    }
    updateCache(key, modelName) {
        const entry = {
            key,
            modelName,
            timestamp: Date.now(),
            accessCount: 1,
            metadata: {},
        };
        // Remove if already exists
        if (this.routingCache.has(key)) {
            this.removeFromCacheOrder(key);
        }
        // Add to cache and access order
        this.routingCache.set(key, entry);
        this.cacheAccessOrder.push(key);
        // Evict oldest if over limit
        while (this.routingCache.size > this.CACHE_LIMIT) {
            const oldestKey = this.cacheAccessOrder.shift();
            if (oldestKey) {
                this.routingCache.delete(oldestKey);
            }
        }
    }
    isCacheValid(entry) {
        return Date.now() - entry.timestamp < this.CACHE_TTL;
    }
    updateCacheAccess(key) {
        this.removeFromCacheOrder(key);
        this.cacheAccessOrder.push(key);
    }
    removeFromCacheOrder(key) {
        const index = this.cacheAccessOrder.indexOf(key);
        if (index !== -1) {
            this.cacheAccessOrder.splice(index, 1);
        }
    }
    /**
     * Performance monitoring and optimization
     */
    recordRoutingTime(time) {
        this.routingTimes.push(time);
        // Keep only recent samples
        if (this.routingTimes.length > this.MAX_ROUTING_TIME_SAMPLES) {
            this.routingTimes.shift();
        }
        // Emit performance metrics
        if (this.routingTimes.length % 10 === 0) {
            this.emitPerformanceMetrics();
        }
    }
    emitPerformanceMetrics() {
        const avg = this.routingTimes.reduce((a, b) => a + b, 0) / this.routingTimes.length;
        const max = Math.max(...this.routingTimes);
        const p95 = this.routingTimes.sort((a, b) => a - b)[Math.floor(this.routingTimes.length * 0.95)];
        this.emit("performance_metrics", {
            averageRoutingTime: avg,
            maxRoutingTime: max,
            p95RoutingTime: p95,
            targetMet: p95 < this.ROUTING_TIME_TARGET,
            cacheHitRate: this.getCacheHitRate(),
        });
    }
    /**
     * Helper methods for fast scoring
     */
    fastLatencyScore(config, perf, context) {
        const targetLatency = context?.latencyRequirement || 2000;
        const modelLatency = perf?.avgLatency || config.latencyTarget;
        if (modelLatency <= targetLatency * 0.8)
            return 1.0;
        if (modelLatency <= targetLatency)
            return 0.8;
        if (modelLatency <= targetLatency * 1.5)
            return 0.5;
        return 0.1;
    }
    fastComplexityScore(config, complexity) {
        if (complexity.score < 0.3) {
            // Simple tasks - prefer fast models
            return config.latencyTarget < 1000 ? 1.0 : 0.7;
        }
        else if (complexity.score < 0.7) {
            // Medium complexity - balanced models
            return config.capabilities.includes("reasoning") ? 0.9 : 0.6;
        }
        else {
            // High complexity - prefer advanced models
            return config.capabilities.includes("advanced-reasoning") ? 1.0 : 0.4;
        }
    }
    fastReliabilityScore(perf) {
        if (!perf || perf.usageCount < 5)
            return 0.8;
        return Math.max(0.1, perf.successRate);
    }
    fastCostScore(config, userTier) {
        if (userTier === "enterprise")
            return 0.9;
        if (userTier === "pro")
            return config.costPerToken < 0.000003 ? 1.0 : 0.7;
        return config.costPerToken < 0.000001 ? 1.0 : 0.3;
    }
    /**
     * Complexity analysis helpers
     */
    estimateTokenCount(text) {
        // Fast approximation: ~4 characters per token
        return Math.ceil(text.length / 4);
    }
    analyzeKeywords(text) {
        const complexKeywords = [
            "analyze",
            "implement",
            "optimize",
            "algorithm",
            "architecture",
            "debug",
        ];
        const words = text.toLowerCase().split(/\s+/);
        const matches = words.filter((word) => complexKeywords.some((kw) => word.includes(kw)));
        return Math.min(1.0, matches.length / 10);
    }
    analyzeStructure(text) {
        const structuralIndicators = [
            "{",
            "}",
            "(",
            ")",
            "[",
            "]",
            "=>",
            "function",
            "class",
            "if",
            "for",
        ];
        const indicators = structuralIndicators.filter((indicator) => text.includes(indicator));
        return Math.min(1.0, indicators.length / 15);
    }
    isDomainSpecific(text, capabilities) {
        if (!capabilities)
            return false;
        const domainKeywords = [
            "code",
            "API",
            "database",
            "security",
            "machine learning",
            "data science",
        ];
        return domainKeywords.some((keyword) => text.toLowerCase().includes(keyword.toLowerCase()));
    }
    calculateComplexityScore(factors) {
        const tokenWeight = Math.min(1.0, factors.tokenCount / 1000) * 0.3;
        const keywordWeight = factors.keywordComplexity * 0.3;
        const structuralWeight = factors.structuralComplexity * 0.3;
        const domainWeight = factors.domainSpecific ? 0.1 : 0;
        return Math.min(1.0, tokenWeight + keywordWeight + structuralWeight + domainWeight);
    }
    isModelSuitableForComplexity(config, complexity, context) {
        // High complexity requires advanced models
        if (complexity.score > 0.8) {
            return (config.capabilities.includes("advanced-reasoning") ||
                config.capabilities.includes("code"));
        }
        // Low latency requirements filter out slow models
        if (context.latencyRequirement < 1000) {
            return config.latencyTarget < 1200;
        }
        return true;
    }
    /**
     * Utility methods
     */
    generateRoutingCacheKey(context) {
        const keyComponents = [
            context.task.substring(0, 50),
            context.userTier,
            context.priority,
            context.latencyRequirement,
        ];
        return Buffer.from(keyComponents.join("|"))
            .toString("base64")
            .substring(0, 32);
    }
    getTierLevel(tier) {
        const levels = { free: 0, pro: 1, enterprise: 2 };
        return levels[tier] || 0;
    }
    updateAvailabilityMap(availableModels) {
        this.availabilityMap.clear();
        for (const [modelName] of availableModels) {
            this.availabilityMap.set(modelName, true);
        }
    }
    cleanupComplexityCache() {
        const entries = Array.from(this.complexityCache.entries());
        const half = Math.floor(entries.length / 2);
        this.complexityCache.clear();
        // Keep the second half (more recent)
        for (let i = half; i < entries.length; i++) {
            this.complexityCache.set(entries[i][0], entries[i][1]);
        }
    }
    getCacheHitRate() {
        const totalRequests = this.routingTimes.length;
        if (totalRequests === 0)
            return 0;
        let cacheHits = 0;
        for (const entry of this.routingCache.values()) {
            cacheHits += entry.accessCount;
        }
        return Math.min(1.0, cacheHits / totalRequests);
    }
    startPerformanceMonitoring() {
        // Monitor routing performance every 30 seconds
        setInterval(() => {
            this.emitPerformanceMetrics();
        }, 30000);
        // Cleanup caches periodically
        setInterval(() => {
            this.cleanupCaches();
        }, 300000); // Every 5 minutes
    }
    cleanupCaches() {
        const now = Date.now();
        // Cleanup routing cache
        for (const [key, entry] of this.routingCache) {
            if (now - entry.timestamp > this.CACHE_TTL) {
                this.routingCache.delete(key);
                this.removeFromCacheOrder(key);
            }
        }
        // Cleanup complexity cache
        if (this.complexityCache.size > 300) {
            this.cleanupComplexityCache();
        }
    }
    warmupComplexityAnalyzer() {
        // Pre-analyze common patterns for faster routing
        const commonPatterns = [
            "implement function",
            "analyze data",
            "create API",
            "debug error",
            "optimize performance",
            "design architecture",
        ];
        for (const pattern of commonPatterns) {
            this.analyzeRequestComplexity({
                task: pattern,
                userTier: "pro",
                priority: "medium",
                latencyRequirement: 1000,
            });
        }
    }
    /**
     * Public API methods
     */
    getRoutingPerformance() {
        if (this.routingTimes.length === 0) {
            return { averageTime: 0, p95Time: 0, cacheHitRate: 0, targetMet: true };
        }
        const avg = this.routingTimes.reduce((a, b) => a + b, 0) / this.routingTimes.length;
        const sorted = [...this.routingTimes].sort((a, b) => a - b);
        const p95 = sorted[Math.floor(sorted.length * 0.95)];
        return {
            averageTime: avg,
            p95Time: p95,
            cacheHitRate: this.getCacheHitRate(),
            targetMet: p95 < this.ROUTING_TIME_TARGET,
        };
    }
    /**
     * Record model performance for future routing decisions with enhanced metrics
     */
    recordPerformance(modelName, latency, success, cost, tokenUsage) {
        const existing = this.performance.get(modelName) || {
            modelName,
            avgLatency: 0,
            successRate: 1,
            avgCost: 0,
            lastUsed: new Date(),
            usageCount: 0,
            errorCount: 0,
            complexityScore: 0.5,
            tokenEfficiency: 1.0,
        };
        // Update metrics using exponential moving average
        const alpha = 0.1; // Smoothing factor
        existing.avgLatency = existing.avgLatency * (1 - alpha) + latency * alpha;
        existing.avgCost = existing.avgCost * (1 - alpha) + cost * alpha;
        existing.usageCount++;
        existing.lastUsed = new Date();
        if (!success) {
            existing.errorCount++;
        }
        existing.successRate =
            (existing.usageCount - existing.errorCount) / existing.usageCount;
        // Update token efficiency if usage data provided
        if (tokenUsage && tokenUsage.total > 0) {
            const efficiency = tokenUsage.output / tokenUsage.total;
            existing.tokenEfficiency =
                existing.tokenEfficiency * 0.9 + efficiency * 0.1;
        }
        this.performance.set(modelName, existing);
        // Emit performance update for monitoring
        this.emit("model_performance_updated", {
            modelName,
            latency,
            success,
            cost,
            performance: existing,
        });
    }
    /**
     * Intelligent fallback strategies for model unavailability
     */
    async selectFallbackModel(originalModel, context, availableModels, reason) {
        const startTime = performance.now();
        this.logger.warn("Selecting fallback model", {
            originalModel,
            reason,
            userTier: context.userTier,
        });
        // Strategy 1: Same tier, similar capabilities
        let fallback = this.findSimilarTierModel(originalModel, context, availableModels);
        // Strategy 2: Lower tier with similar capabilities
        if (!fallback) {
            fallback = this.findLowerTierModel(originalModel, context, availableModels);
        }
        // Strategy 3: Emergency fallback based on user tier
        if (!fallback) {
            fallback = this.getEmergencyFallback(context.userTier, availableModels);
        }
        const routingTime = performance.now() - startTime;
        this.emit("fallback_triggered", {
            originalModel,
            fallbackModel: fallback,
            reason,
            routingTime,
        });
        return {
            modelName: fallback,
            confidence: 0.6,
            reason: `Fallback from ${originalModel}: ${reason}`,
            routingTime,
            fromCache: false,
        };
    }
    findSimilarTierModel(originalModel, context, availableModels) {
        const originalConfig = availableModels.get(originalModel);
        if (!originalConfig)
            return null;
        for (const [modelName, config] of availableModels) {
            if (modelName === originalModel)
                continue;
            if (!this.availabilityMap.get(modelName))
                continue;
            // Same tier and similar capabilities
            if (config.tier === originalConfig.tier) {
                const sharedCapabilities = config.capabilities.filter((cap) => originalConfig.capabilities.includes(cap));
                if (sharedCapabilities.length >=
                    originalConfig.capabilities.length * 0.7) {
                    return modelName;
                }
            }
        }
        return null;
    }
    findLowerTierModel(originalModel, context, availableModels) {
        const originalConfig = availableModels.get(originalModel);
        if (!originalConfig)
            return null;
        const userTierLevel = this.getTierLevel(context.userTier);
        for (const [modelName, config] of availableModels) {
            if (modelName === originalModel)
                continue;
            if (!this.availabilityMap.get(modelName))
                continue;
            const modelTierLevel = this.getTierLevel(config.tier);
            // Lower or equal tier that user can access
            if (modelTierLevel <= userTierLevel &&
                modelTierLevel < this.getTierLevel(originalConfig.tier)) {
                // Check if it has core capabilities
                const hasCodeCapability = config.capabilities.includes("code");
                const hasReasoningCapability = config.capabilities.includes("reasoning");
                if (hasCodeCapability || hasReasoningCapability) {
                    return modelName;
                }
            }
        }
        return null;
    }
    getEmergencyFallback(userTier, availableModels) {
        const emergencyOrder = {
            enterprise: [
                "gemini-2.5-pro",
                "gemini-pro-vertex",
                "gemini-2.0-flash-thinking",
                "gemini-2.0-flash",
            ],
            pro: [
                "gemini-2.5-flash",
                "gemini-2.0-flash-thinking",
                "gemini-2.0-flash",
            ],
            free: ["gemini-2.0-flash", "gemini-2.5-flash"],
        };
        const tierFallbacks = emergencyOrder[userTier] ||
            emergencyOrder.free;
        for (const modelName of tierFallbacks) {
            if (availableModels.has(modelName) &&
                this.availabilityMap.get(modelName)) {
                return modelName;
            }
        }
        // Last resort - any available model
        for (const [modelName] of availableModels) {
            if (this.availabilityMap.get(modelName)) {
                return modelName;
            }
        }
        throw new Error("No models available for fallback");
    }
    /**
     * Check and update model availability
     */
    updateModelAvailability(modelName, available) {
        const previous = this.availabilityMap.get(modelName);
        this.availabilityMap.set(modelName, available);
        if (previous !== available) {
            this.emit("model_availability_changed", {
                modelName,
                available,
                timestamp: Date.now(),
            });
            this.logger.info("Model availability changed", {
                modelName,
                available,
                previousState: previous,
            });
        }
    }
    /**
     * Batch update model availability
     */
    updateBatchAvailability(availabilityMap) {
        const changes = [];
        for (const [modelName, available] of availabilityMap) {
            const previous = this.availabilityMap.get(modelName);
            this.availabilityMap.set(modelName, available);
            if (previous !== available) {
                changes.push({ model: modelName, available });
            }
        }
        if (changes.length > 0) {
            this.emit("batch_availability_update", {
                changes,
                timestamp: Date.now(),
            });
        }
    }
    /**
     * Get comprehensive router statistics
     */
    getRouterStats() {
        const performance = this.getRoutingPerformance();
        const cache = {
            size: this.routingCache.size,
            hitRate: this.getCacheHitRate(),
            limit: this.CACHE_LIMIT,
        };
        let availableCount = 0;
        let totalCount = 0;
        for (const available of this.availabilityMap.values()) {
            totalCount++;
            if (available)
                availableCount++;
        }
        const availability = {
            total: totalCount,
            available: availableCount,
            unavailable: totalCount - availableCount,
        };
        const models = Array.from(this.performance.entries()).map(([name, perf]) => ({
            name,
            performance: perf,
        }));
        return { performance, cache, availability, models };
    }
    /**
     * Optimize routing based on performance data
     */
    optimizeBasedOnPerformance(performanceData) {
        // Adjust weights based on recent performance trends
        const recentFailures = performanceData.recentFailures || 0;
        const avgLatency = performanceData.avgLatency || 0;
        if (recentFailures > 5) {
            // Increase reliability weight if we're seeing failures
            this.weights.reliability = Math.min(0.5, this.weights.reliability + 0.1);
            this.weights.cost = Math.max(0.1, this.weights.cost - 0.05);
        }
        if (avgLatency > 2000) {
            // Increase latency weight if responses are slow
            this.weights.latency = Math.min(0.6, this.weights.latency + 0.1);
            this.weights.cost = Math.max(0.1, this.weights.cost - 0.05);
        }
        this.logger.info("Routing weights optimized", { weights: this.weights });
    }
    /**
     * Get model usage statistics
     */
    getModelUsageStats() {
        return Object.fromEntries(this.loadBalancer);
    }
    /**
     * Get routing rules
     */
    getRules() {
        return Array.from(this.rules.values());
    }
    /**
     * Get performance data
     */
    getPerformanceData() {
        return Array.from(this.performance.values());
    }
}
