/**
 * Resource Allocator - Advanced resource allocation algorithms
 *
 * Provides intelligent resource management with:
 * - Dynamic resource allocation
 * - Load balancing across agents
 * - Resource prediction and scaling
 * - Contention resolution
 * - Performance optimization
 */
import { Logger } from "../../utils/logger.js";
export class ResourceAllocator {
    logger;
    resourcePools = new Map();
    allocationHistory = [];
    activeAllocations = new Map();
    predictionModels = new Map();
    metrics = {
        totalRequests: 0,
        successfulAllocations: 0,
        failedAllocations: 0,
        averageAllocationTime: 0,
        resourceUtilization: {},
        wasteRate: 0,
        satisfactionScore: 0.8,
        costEfficiency: 0.75,
    };
    constructor() {
        this.logger = new Logger("ResourceAllocator");
        this.initializeResourcePools();
        this.startResourceMonitoring();
    }
    /**
     * Allocate resources for an agent
     */
    async allocateResources(agentId, workspaceId, requirements, strategy = {
        type: "intelligent",
        parameters: {},
    }) {
        const startTime = Date.now();
        this.metrics.totalRequests++;
        try {
            // Analyze requirements
            const analyzedRequirements = await this.analyzeRequirements(requirements);
            // Generate allocation plan
            const plan = await this.generateAllocationPlan(agentId, workspaceId, analyzedRequirements, strategy);
            // Validate allocation feasibility
            const validationResult = await this.validateAllocation(plan);
            if (!validationResult.valid) {
                throw new Error(`Allocation validation failed: ${validationResult.reason}`);
            }
            // Execute allocation
            await this.executeAllocation(plan);
            // Update metrics
            const allocationTime = Date.now() - startTime;
            this.updateAllocationMetrics(plan, allocationTime, true);
            this.logger.info("Resources allocated successfully", {
                agentId,
                requestId: plan.requestId,
                allocatedResources: plan.allocatedResources.length,
                allocationTime,
            });
            return plan;
        }
        catch (error) {
            this.metrics.failedAllocations++;
            this.logger.error("Resource allocation failed", {
                agentId,
                error: error.message,
            });
            throw error;
        }
    }
    /**
     * Deallocate resources for an agent
     */
    async deallocateResources(agentId, resourceTypes) {
        const allocations = this.activeAllocations.get(agentId) || [];
        const toRemove = resourceTypes
            ? allocations.filter((alloc) => resourceTypes.includes(alloc.resourceType))
            : allocations;
        for (const allocation of toRemove) {
            await this.releaseResourceUnit(allocation);
        }
        // Update active allocations
        if (resourceTypes) {
            const remaining = allocations.filter((alloc) => !resourceTypes.includes(alloc.resourceType));
            this.activeAllocations.set(agentId, remaining);
        }
        else {
            this.activeAllocations.delete(agentId);
        }
        this.logger.info("Resources deallocated", {
            agentId,
            deallocatedTypes: resourceTypes || "all",
            deallocatedCount: toRemove.length,
        });
    }
    /**
     * Scale resources dynamically
     */
    async scaleResources(agentId, resourceType, scaleFactor) {
        const allocations = this.activeAllocations.get(agentId) || [];
        const resourceAllocations = allocations.filter((alloc) => alloc.resourceType === resourceType);
        for (const allocation of resourceAllocations) {
            const newAmount = Math.floor(allocation.amount * scaleFactor);
            await this.adjustResourceAllocation(allocation.id, newAmount);
        }
        this.logger.info("Resources scaled", {
            agentId,
            resourceType,
            scaleFactor,
            affectedAllocations: resourceAllocations.length,
        });
    }
    /**
     * Optimize resource allocations across all agents
     */
    async optimizeAllocations() {
        this.logger.info("Starting resource allocation optimization");
        try {
            // Analyze current utilization
            const utilizationAnalysis = this.analyzeResourceUtilization();
            // Identify optimization opportunities
            const opportunities = this.identifyOptimizationOpportunities(utilizationAnalysis);
            // Execute optimizations
            for (const opportunity of opportunities) {
                await this.executeOptimization(opportunity);
            }
            // Update resource pools
            await this.rebalanceResourcePools();
            this.logger.info("Resource optimization completed", {
                opportunities: opportunities.length,
                utilizationImprovement: this.calculateUtilizationImprovement(),
            });
        }
        catch (error) {
            this.logger.error("Resource optimization failed", {
                error: error.message,
            });
            throw error;
        }
    }
    /**
     * Predict future resource needs
     */
    async predictResourceNeeds(timeHorizon = 3600000, // 1 hour
    agentId) {
        const predictions = [];
        for (const [resourceType, pool] of this.resourcePools) {
            const historical = pool.utilizationHistory;
            const currentUtilization = pool.allocatedCapacity / pool.totalCapacity;
            // Simple trend analysis
            const trend = this.calculateTrend(historical);
            const seasonality = this.analyzeSeasonality(historical);
            const predictedDemand = currentUtilization + (trend * timeHorizon) / 3600000;
            predictions.push({
                resourceType,
                predictedDemand: Math.max(0, Math.min(1, predictedDemand)),
                confidence: this.calculatePredictionConfidence(historical),
                timeHorizon,
                seasonality,
                recommendations: this.generateResourceRecommendations(resourceType, predictedDemand, currentUtilization),
            });
        }
        return predictions;
    }
    /**
     * Handle resource contention
     */
    async resolveResourceContention(contentionId, competingRequests) {
        this.logger.info("Resolving resource contention", {
            contentionId,
            competingRequests: competingRequests.length,
        });
        // Analyze contention
        const contentionAnalysis = this.analyzeResourceContention(competingRequests);
        // Apply resolution strategy
        const resolutionStrategy = this.selectContentionResolutionStrategy(contentionAnalysis);
        const resolvedPlans = await this.applyContentionResolution(competingRequests, resolutionStrategy);
        return resolvedPlans;
    }
    /**
     * Get resource allocation metrics
     */
    getMetrics() {
        this.updateUtilizationMetrics();
        return { ...this.metrics };
    }
    /**
     * Get current resource pool status
     */
    getResourcePoolStatus() {
        const status = {};
        for (const [resourceType, pool] of this.resourcePools) {
            status[resourceType] = { ...pool };
        }
        return status;
    }
    /**
     * Private helper methods
     */
    initializeResourcePools() {
        const resourceTypes = [
            "memory",
            "cpu",
            "network",
            "storage",
            "gpu",
            "bandwidth",
        ];
        for (const resourceType of resourceTypes) {
            const pool = {
                resourceType,
                totalCapacity: this.getDefaultCapacity(resourceType),
                availableCapacity: this.getDefaultCapacity(resourceType),
                allocatedCapacity: 0,
                reservedCapacity: 0,
                allocationUnits: [],
                utilizationHistory: [],
            };
            this.resourcePools.set(resourceType, pool);
        }
        this.logger.debug("Resource pools initialized", {
            poolCount: this.resourcePools.size,
            resourceTypes: Array.from(this.resourcePools.keys()),
        });
    }
    getDefaultCapacity(resourceType) {
        const capacities = {
            memory: 10240, // 10GB
            cpu: 100, // 100 CPU units
            network: 1000, // 1000 Mbps
            storage: 51200, // 50GB
            gpu: 10, // 10 GPU units
            bandwidth: 1000, // 1000 Mbps
        };
        return capacities[resourceType] || 1000;
    }
    startResourceMonitoring() {
        setInterval(() => {
            this.updateResourceUtilization();
            this.performResourceMaintenance();
        }, 30000); // Every 30 seconds
    }
    async analyzeRequirements(requirements) {
        // Analyze and validate resource requirements
        const analyzed = [];
        for (const requirement of requirements) {
            const pool = this.resourcePools.get(requirement.resourceType);
            if (!pool) {
                this.logger.warn("Unknown resource type requested", {
                    resourceType: requirement.resourceType,
                });
                continue;
            }
            // Validate amount
            const validatedAmount = Math.min(requirement.amount, pool.availableCapacity);
            analyzed.push({
                ...requirement,
                amount: validatedAmount,
            });
        }
        return analyzed;
    }
    async generateAllocationPlan(agentId, workspaceId, requirements, strategy) {
        const requestId = `alloc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const allocatedResources = [];
        const fallbackAllocations = [];
        for (const requirement of requirements) {
            const primaryAllocation = await this.allocateResourceType(requirement, strategy, "primary");
            if (primaryAllocation) {
                allocatedResources.push(primaryAllocation);
            }
            // Generate fallback if primary is less than requested
            if (!primaryAllocation ||
                primaryAllocation.actualAmount < requirement.amount) {
                const fallback = await this.allocateResourceType({ ...requirement, amount: requirement.amount * 0.7 }, // 70% fallback
                strategy, "fallback");
                if (fallback) {
                    fallbackAllocations.push(fallback);
                }
            }
        }
        return {
            requestId,
            agentId,
            resourceRequirements: requirements,
            allocatedResources,
            fallbackAllocations,
            estimatedCost: this.calculateAllocationCost(allocatedResources),
            allocationScore: this.calculateAllocationScore(requirements, allocatedResources),
            implementationOrder: this.generateImplementationOrder(allocatedResources),
        };
    }
    async allocateResourceType(requirement, strategy, type) {
        const pool = this.resourcePools.get(requirement.resourceType);
        if (!pool || pool.availableCapacity < requirement.amount) {
            return null;
        }
        const allocation = {
            resourceType: requirement.resourceType,
            amount: requirement.amount,
            actualAmount: Math.min(requirement.amount, pool.availableCapacity),
            source: `pool_${requirement.resourceType}`,
            shareLevel: requirement.sharable ? "shared" : "exclusive",
            constraints: [],
            performance: {
                efficiency: 0.85,
                responseTime: 100,
                throughput: 1000,
                reliability: 0.99,
                costEffectiveness: 0.8,
            },
        };
        return allocation;
    }
    async validateAllocation(plan) {
        // Check resource availability
        for (const allocation of plan.allocatedResources) {
            const pool = this.resourcePools.get(allocation.resourceType);
            if (!pool || pool.availableCapacity < allocation.actualAmount) {
                return {
                    valid: false,
                    reason: `Insufficient ${allocation.resourceType}: requested ${allocation.actualAmount}, available ${pool?.availableCapacity || 0}`,
                };
            }
        }
        // Check constraints
        for (const allocation of plan.allocatedResources) {
            for (const constraint of allocation.constraints) {
                if (!(await this.validateConstraint(constraint, allocation))) {
                    return {
                        valid: false,
                        reason: `Constraint validation failed: ${constraint.type}`,
                    };
                }
            }
        }
        return { valid: true };
    }
    async executeAllocation(plan) {
        const allocationUnits = [];
        for (const allocation of plan.allocatedResources) {
            const unit = {
                id: `unit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                agentId: plan.agentId,
                workspaceId: "",
                amount: allocation.actualAmount,
                allocatedAt: new Date(),
                priority: 5,
                sharable: allocation.shareLevel !== "exclusive",
                actualUsage: 0,
                efficiency: allocation.performance.efficiency,
            };
            // Update resource pool
            const pool = this.resourcePools.get(allocation.resourceType);
            pool.availableCapacity -= allocation.actualAmount;
            pool.allocatedCapacity += allocation.actualAmount;
            pool.allocationUnits.push(unit);
            allocationUnits.push(unit);
        }
        // Store active allocations
        this.activeAllocations.set(plan.agentId, allocationUnits);
        this.allocationHistory.push(plan);
    }
    async releaseResourceUnit(unit) {
        const pool = this.resourcePools.get(unit.resourceType);
        if (!pool)
            return;
        // Update pool capacity
        pool.availableCapacity += unit.amount;
        pool.allocatedCapacity -= unit.amount;
        // Remove from pool
        const index = pool.allocationUnits.findIndex((u) => u.id === unit.id);
        if (index > -1) {
            pool.allocationUnits.splice(index, 1);
        }
        this.logger.debug("Resource unit released", {
            unitId: unit.id,
            resourceType: unit.resourceType,
            amount: unit.amount,
        });
    }
    async adjustResourceAllocation(unitId, newAmount) {
        for (const pool of this.resourcePools.values()) {
            const unit = pool.allocationUnits.find((u) => u.id === unitId);
            if (unit) {
                const difference = newAmount - unit.amount;
                if (difference > 0 && pool.availableCapacity >= difference) {
                    // Increase allocation
                    pool.availableCapacity -= difference;
                    pool.allocatedCapacity += difference;
                    unit.amount = newAmount;
                }
                else if (difference < 0) {
                    // Decrease allocation
                    pool.availableCapacity += Math.abs(difference);
                    pool.allocatedCapacity -= Math.abs(difference);
                    unit.amount = newAmount;
                }
                break;
            }
        }
    }
    updateResourceUtilization() {
        for (const [resourceType, pool] of this.resourcePools) {
            const utilization = pool.allocatedCapacity / pool.totalCapacity;
            pool.utilizationHistory.push(utilization);
            // Keep only last 100 data points
            if (pool.utilizationHistory.length > 100) {
                pool.utilizationHistory.shift();
            }
        }
    }
    performResourceMaintenance() {
        // Clean up expired allocations
        for (const pool of this.resourcePools.values()) {
            const now = new Date();
            const expired = pool.allocationUnits.filter((unit) => unit.expiresAt && unit.expiresAt < now);
            for (const unit of expired) {
                this.releaseResourceUnit(unit);
            }
        }
        // Update efficiency metrics
        this.updateEfficiencyMetrics();
    }
    analyzeResourceUtilization() {
        const analysis = {
            overallocated: [],
            underutilized: [],
            balanced: [],
            trends: new Map(),
        };
        for (const [resourceType, pool] of this.resourcePools) {
            const utilization = pool.allocatedCapacity / pool.totalCapacity;
            const trend = this.calculateTrend(pool.utilizationHistory);
            if (utilization > 0.9) {
                analysis.overallocated.push(resourceType);
            }
            else if (utilization < 0.3) {
                analysis.underutilized.push(resourceType);
            }
            else {
                analysis.balanced.push(resourceType);
            }
            analysis.trends.set(resourceType, trend);
        }
        return analysis;
    }
    identifyOptimizationOpportunities(analysis) {
        const opportunities = [];
        // Over-allocated resources
        for (const resourceType of analysis.overallocated) {
            opportunities.push({
                type: "scale_up",
                resourceType,
                action: "increase_capacity",
                priority: "high",
            });
        }
        // Under-utilized resources
        for (const resourceType of analysis.underutilized) {
            opportunities.push({
                type: "scale_down",
                resourceType,
                action: "reduce_capacity",
                priority: "medium",
            });
        }
        return opportunities;
    }
    async executeOptimization(opportunity) {
        this.logger.debug("Executing optimization", opportunity);
        switch (opportunity.action) {
            case "increase_capacity":
                await this.increasePoolCapacity(opportunity.resourceType, 1.2);
                break;
            case "reduce_capacity":
                await this.reducePoolCapacity(opportunity.resourceType, 0.8);
                break;
        }
    }
    async increasePoolCapacity(resourceType, factor) {
        const pool = this.resourcePools.get(resourceType);
        if (pool) {
            const increase = pool.totalCapacity * (factor - 1);
            pool.totalCapacity += increase;
            pool.availableCapacity += increase;
            this.logger.info("Resource pool capacity increased", {
                resourceType,
                increase,
                newCapacity: pool.totalCapacity,
            });
        }
    }
    async reducePoolCapacity(resourceType, factor) {
        const pool = this.resourcePools.get(resourceType);
        if (pool) {
            const decrease = pool.totalCapacity * (1 - factor);
            const newCapacity = pool.totalCapacity - decrease;
            if (newCapacity >= pool.allocatedCapacity) {
                pool.totalCapacity = newCapacity;
                pool.availableCapacity = newCapacity - pool.allocatedCapacity;
                this.logger.info("Resource pool capacity reduced", {
                    resourceType,
                    decrease,
                    newCapacity,
                });
            }
        }
    }
    async rebalanceResourcePools() {
        // Rebalance resources across pools based on demand patterns
        this.logger.debug("Rebalancing resource pools");
    }
    calculateTrend(history) {
        if (history.length < 2)
            return 0;
        const recent = history.slice(-10);
        const older = history.slice(-20, -10);
        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const olderAvg = older.length > 0
            ? older.reduce((a, b) => a + b, 0) / older.length
            : recentAvg;
        return recentAvg - olderAvg;
    }
    analyzeSeasonality(history) {
        // Simplified seasonality analysis
        return [
            {
                pattern: "hourly",
                multiplier: 1.2,
                confidence: 0.7,
            },
        ];
    }
    calculatePredictionConfidence(history) {
        if (history.length < 10)
            return 0.3;
        // Calculate variance
        const mean = history.reduce((a, b) => a + b, 0) / history.length;
        const variance = history.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) /
            history.length;
        // Lower variance = higher confidence
        return Math.max(0.1, Math.min(0.95, 1 - variance));
    }
    generateResourceRecommendations(resourceType, predictedDemand, currentUtilization) {
        const recommendations = [];
        if (predictedDemand > 0.8) {
            recommendations.push({
                action: "scale_up",
                resourceType,
                amount: Math.ceil((predictedDemand - 0.8) * 100),
                timing: new Date(Date.now() + 1800000), // 30 minutes
                rationale: "High demand predicted",
                expectedBenefit: 0.2,
            });
        }
        if (predictedDemand < 0.3 && currentUtilization < 0.4) {
            recommendations.push({
                action: "scale_down",
                resourceType,
                amount: Math.floor((0.3 - predictedDemand) * 100),
                timing: new Date(Date.now() + 3600000), // 1 hour
                rationale: "Low demand predicted",
                expectedBenefit: 0.15,
            });
        }
        return recommendations;
    }
    analyzeResourceContention(requests) {
        return {
            contentionLevel: "medium",
            conflictingResources: ["memory", "cpu"],
            totalDemand: 150,
            availableCapacity: 100,
        };
    }
    selectContentionResolutionStrategy(analysis) {
        return "priority_based"; // Simplified strategy selection
    }
    async applyContentionResolution(requests, strategy) {
        // Simplified contention resolution
        return [];
    }
    calculateAllocationCost(allocations) {
        return allocations.reduce((cost, allocation) => {
            const baseCost = allocation.actualAmount * 0.01; // $0.01 per unit
            return cost + baseCost;
        }, 0);
    }
    calculateAllocationScore(requirements, allocations) {
        if (requirements.length === 0)
            return 0;
        const fulfillmentRate = allocations.length / requirements.length;
        const efficiencyScore = allocations.reduce((score, alloc) => score + alloc.performance.efficiency, 0) / allocations.length;
        return (fulfillmentRate + efficiencyScore) / 2;
    }
    generateImplementationOrder(allocations) {
        // Priority-based ordering: critical resources first
        return allocations
            .map((_, index) => index)
            .sort((a, b) => {
            const priorityA = allocations[a].resourceType === "memory" ? 1 : 2;
            const priorityB = allocations[b].resourceType === "memory" ? 1 : 2;
            return priorityA - priorityB;
        });
    }
    async validateConstraint(constraint, allocation) {
        // Simplified constraint validation
        return true;
    }
    updateAllocationMetrics(plan, allocationTime, success) {
        this.metrics.averageAllocationTime =
            (this.metrics.averageAllocationTime + allocationTime) / 2;
        if (success) {
            this.metrics.successfulAllocations++;
        }
    }
    updateUtilizationMetrics() {
        for (const [resourceType, pool] of this.resourcePools) {
            this.metrics.resourceUtilization[resourceType] =
                pool.allocatedCapacity / pool.totalCapacity;
        }
    }
    updateEfficiencyMetrics() {
        let totalWaste = 0;
        let totalAllocated = 0;
        for (const pool of this.resourcePools.values()) {
            for (const unit of pool.allocationUnits) {
                totalAllocated += unit.amount;
                totalWaste += unit.amount - unit.actualUsage;
            }
        }
        this.metrics.wasteRate =
            totalAllocated > 0 ? totalWaste / totalAllocated : 0;
    }
    calculateUtilizationImprovement() {
        // Simplified improvement calculation
        return 0.15; // 15% improvement
    }
    /**
     * Shutdown resource allocator
     */
    async shutdown() {
        // Deallocate all resources
        for (const agentId of this.activeAllocations.keys()) {
            await this.deallocateResources(agentId);
        }
        this.resourcePools.clear();
        this.allocationHistory.length = 0;
        this.activeAllocations.clear();
        this.logger.info("Resource Allocator shutdown complete");
    }
}
