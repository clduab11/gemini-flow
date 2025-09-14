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
import {
  ResourceRequirement,
  WorkspaceResources,
  ResourceLimits,
  AgentWorkspace,
} from "../types/AgentSpaceTypes.js";

export interface ResourceAllocationStrategy {
  type:
    | "round_robin"
    | "priority_based"
    | "load_balanced"
    | "intelligent"
    | "ml_optimized";
  parameters: any;
}

export interface ResourcePool {
  resourceType: string;
  totalCapacity: number;
  availableCapacity: number;
  allocatedCapacity: number;
  reservedCapacity: number;
  allocationUnits: ResourceAllocationUnit[];
  utilizationHistory: number[];
}

export interface ResourceAllocationUnit {
  id: string;
  agentId: string;
  workspaceId: string;
  amount: number;
  allocatedAt: Date;
  expiresAt?: Date;
  priority: number;
  sharable: boolean;
  actualUsage: number;
  efficiency: number;
  resourceType: string;
}

export interface AllocationPlan {
  requestId: string;
  agentId: string;
  resourceRequirements: ResourceRequirement[];
  allocatedResources: ResourceAllocation[];
  fallbackAllocations: ResourceAllocation[];
  estimatedCost: number;
  allocationScore: number;
  implementationOrder: number[];
}

export interface ResourceAllocation {
  resourceType: string;
  amount: number;
  actualAmount: number;
  source: string;
  shareLevel: "exclusive" | "shared" | "pooled";
  constraints: ResourceConstraint[];
  performance: AllocationPerformance;
}

export interface ResourceConstraint {
  type: "time" | "location" | "dependency" | "compatibility";
  condition: any;
  priority: number;
}

export interface AllocationPerformance {
  efficiency: number;
  responseTime: number;
  throughput: number;
  reliability: number;
  costEffectiveness: number;
}

export interface ResourcePrediction {
  resourceType: string;
  predictedDemand: number;
  confidence: number;
  timeHorizon: number;
  seasonality: SeasonalPattern[];
  recommendations: ResourceRecommendation[];
}

export interface SeasonalPattern {
  pattern: "hourly" | "daily" | "weekly" | "monthly";
  multiplier: number;
  confidence: number;
}

export interface ResourceRecommendation {
  action: "scale_up" | "scale_down" | "reallocate" | "optimize" | "reserve";
  resourceType: string;
  amount: number;
  timing: Date;
  rationale: string;
  expectedBenefit: number;
}

export interface AllocationMetrics {
  totalRequests: number;
  successfulAllocations: number;
  failedAllocations: number;
  averageAllocationTime: number;
  resourceUtilization: { [resourceType: string]: number };
  wasteRate: number;
  satisfactionScore: number;
  costEfficiency: number;
}

export class ResourceAllocator {
  private logger: Logger;
  private resourcePools: Map<string, ResourcePool> = new Map();
  private allocationHistory: AllocationPlan[] = [];
  private activeAllocations: Map<string, ResourceAllocationUnit[]> = new Map();
  private predictionModels: Map<string, any> = new Map();

  private metrics: AllocationMetrics = {
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
  async allocateResources(
    agentId: string,
    workspaceId: string,
    requirements: ResourceRequirement[],
    strategy: ResourceAllocationStrategy = {
      type: "intelligent",
      parameters: {},
    },
  ): Promise<AllocationPlan> {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      // Analyze requirements
      const analyzedRequirements = await this.analyzeRequirements(requirements);

      // Generate allocation plan
      const plan = await this.generateAllocationPlan(
        agentId,
        workspaceId,
        analyzedRequirements,
        strategy,
      );

      // Validate allocation feasibility
      const validationResult = await this.validateAllocation(plan);
      if (!validationResult.valid) {
        throw new Error(
          `Allocation validation failed: ${validationResult.reason}`,
        );
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
    } catch (error) {
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
  async deallocateResources(
    agentId: string,
    resourceTypes?: string[],
  ): Promise<void> {
    const allocations = this.activeAllocations.get(agentId) || [];

    const toRemove = resourceTypes
      ? allocations.filter((alloc) =>
          resourceTypes.includes(alloc.resourceType),
        )
      : allocations;

    for (const allocation of toRemove) {
      await this.releaseResourceUnit(allocation);
    }

    // Update active allocations
    if (resourceTypes) {
      const remaining = allocations.filter(
        (alloc) => !resourceTypes.includes(alloc.resourceType),
      );
      this.activeAllocations.set(agentId, remaining);
    } else {
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
  async scaleResources(
    agentId: string,
    resourceType: string,
    scaleFactor: number,
  ): Promise<void> {
    const allocations = this.activeAllocations.get(agentId) || [];
    const resourceAllocations = allocations.filter(
      (alloc) => alloc.resourceType === resourceType,
    );

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
  async optimizeAllocations(): Promise<void> {
    this.logger.info("Starting resource allocation optimization");

    try {
      // Analyze current utilization
      const utilizationAnalysis = this.analyzeResourceUtilization();

      // Identify optimization opportunities
      const opportunities =
        this.identifyOptimizationOpportunities(utilizationAnalysis);

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
    } catch (error) {
      this.logger.error("Resource optimization failed", {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Predict future resource needs
   */
  async predictResourceNeeds(
    timeHorizon: number = 3600000, // 1 hour
    agentId?: string,
  ): Promise<ResourcePrediction[]> {
    const predictions: ResourcePrediction[] = [];

    for (const [resourceType, pool] of this.resourcePools) {
      const historical = pool.utilizationHistory;
      const currentUtilization = pool.allocatedCapacity / pool.totalCapacity;

      // Simple trend analysis
      const trend = this.calculateTrend(historical);
      const seasonality = this.analyzeSeasonality(historical);

      const predictedDemand =
        currentUtilization + (trend * timeHorizon) / 3600000;

      predictions.push({
        resourceType,
        predictedDemand: Math.max(0, Math.min(1, predictedDemand)),
        confidence: this.calculatePredictionConfidence(historical),
        timeHorizon,
        seasonality,
        recommendations: this.generateResourceRecommendations(
          resourceType,
          predictedDemand,
          currentUtilization,
        ),
      });
    }

    return predictions;
  }

  /**
   * Handle resource contention
   */
  async resolveResourceContention(
    contentionId: string,
    competingRequests: ResourceRequirement[][],
  ): Promise<AllocationPlan[]> {
    this.logger.info("Resolving resource contention", {
      contentionId,
      competingRequests: competingRequests.length,
    });

    // Analyze contention
    const contentionAnalysis =
      this.analyzeResourceContention(competingRequests);

    // Apply resolution strategy
    const resolutionStrategy =
      this.selectContentionResolutionStrategy(contentionAnalysis);
    const resolvedPlans = await this.applyContentionResolution(
      competingRequests,
      resolutionStrategy,
    );

    return resolvedPlans;
  }

  /**
   * Get resource allocation metrics
   */
  getMetrics(): AllocationMetrics {
    this.updateUtilizationMetrics();
    return { ...this.metrics };
  }

  /**
   * Get current resource pool status
   */
  getResourcePoolStatus(): { [resourceType: string]: ResourcePool } {
    const status: { [resourceType: string]: ResourcePool } = {};
    for (const [resourceType, pool] of this.resourcePools) {
      status[resourceType] = { ...pool };
    }
    return status;
  }

  /**
   * Private helper methods
   */

  private initializeResourcePools(): void {
    const resourceTypes = [
      "memory",
      "cpu",
      "network",
      "storage",
      "gpu",
      "bandwidth",
    ];

    for (const resourceType of resourceTypes) {
      const pool: ResourcePool = {
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

  private getDefaultCapacity(resourceType: string): number {
    const capacities: Record<string, number> = {
      memory: 10240, // 10GB
      cpu: 100, // 100 CPU units
      network: 1000, // 1000 Mbps
      storage: 51200, // 50GB
      gpu: 10, // 10 GPU units
      bandwidth: 1000, // 1000 Mbps
    };

    return capacities[resourceType] || 1000;
  }

  private startResourceMonitoring(): void {
    setInterval(() => {
      this.updateResourceUtilization();
      this.performResourceMaintenance();
    }, 30000); // Every 30 seconds
  }

  private async analyzeRequirements(
    requirements: ResourceRequirement[],
  ): Promise<ResourceRequirement[]> {
    // Analyze and validate resource requirements
    const analyzed: ResourceRequirement[] = [];

    for (const requirement of requirements) {
      const pool = this.resourcePools.get(requirement.resourceType);
      if (!pool) {
        this.logger.warn("Unknown resource type requested", {
          resourceType: requirement.resourceType,
        });
        continue;
      }

      // Validate amount
      const validatedAmount = Math.min(
        requirement.amount,
        pool.availableCapacity,
      );

      analyzed.push({
        ...requirement,
        amount: validatedAmount,
      });
    }

    return analyzed;
  }

  private async generateAllocationPlan(
    agentId: string,
    workspaceId: string,
    requirements: ResourceRequirement[],
    strategy: ResourceAllocationStrategy,
  ): Promise<AllocationPlan> {
    const requestId = `alloc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const allocatedResources: ResourceAllocation[] = [];
    const fallbackAllocations: ResourceAllocation[] = [];

    for (const requirement of requirements) {
      const primaryAllocation = await this.allocateResourceType(
        requirement,
        strategy,
        "primary",
      );

      if (primaryAllocation) {
        allocatedResources.push(primaryAllocation);
      }

      // Generate fallback if primary is less than requested
      if (
        !primaryAllocation ||
        primaryAllocation.actualAmount < requirement.amount
      ) {
        const fallback = await this.allocateResourceType(
          { ...requirement, amount: requirement.amount * 0.7 }, // 70% fallback
          strategy,
          "fallback",
        );

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
      allocationScore: this.calculateAllocationScore(
        requirements,
        allocatedResources,
      ),
      implementationOrder: this.generateImplementationOrder(allocatedResources),
    };
  }

  private async allocateResourceType(
    requirement: ResourceRequirement,
    strategy: ResourceAllocationStrategy,
    type: "primary" | "fallback",
  ): Promise<ResourceAllocation | null> {
    const pool = this.resourcePools.get(requirement.resourceType);
    if (!pool || pool.availableCapacity < requirement.amount) {
      return null;
    }

    const allocation: ResourceAllocation = {
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

  private async validateAllocation(
    plan: AllocationPlan,
  ): Promise<{ valid: boolean; reason?: string }> {
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

  private async executeAllocation(plan: AllocationPlan): Promise<void> {
    const allocationUnits: ResourceAllocationUnit[] = [];

    for (const allocation of plan.allocatedResources) {
      const unit: ResourceAllocationUnit = {
        id: `unit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        agentId: plan.agentId,
        workspaceId: "",
        amount: allocation.actualAmount,
        allocatedAt: new Date(),
        priority: 5,
        sharable: allocation.shareLevel !== "exclusive",
        actualUsage: 0,
        efficiency: allocation.performance.efficiency,
        resourceType: allocation.resourceType,
      };

      // Update resource pool
      const pool = this.resourcePools.get(allocation.resourceType)!;
      pool.availableCapacity -= allocation.actualAmount;
      pool.allocatedCapacity += allocation.actualAmount;
      pool.allocationUnits.push(unit);

      allocationUnits.push(unit);
    }

    // Store active allocations
    this.activeAllocations.set(plan.agentId, allocationUnits);
    this.allocationHistory.push(plan);
  }

  private async releaseResourceUnit(
    unit: ResourceAllocationUnit,
  ): Promise<void> {
    const pool = this.resourcePools.get(unit.resourceType);
    if (!pool) return;

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

  private async adjustResourceAllocation(
    unitId: string,
    newAmount: number,
  ): Promise<void> {
    for (const pool of this.resourcePools.values()) {
      const unit = pool.allocationUnits.find((u) => u.id === unitId);
      if (unit) {
        const difference = newAmount - unit.amount;

        if (difference > 0 && pool.availableCapacity >= difference) {
          // Increase allocation
          pool.availableCapacity -= difference;
          pool.allocatedCapacity += difference;
          unit.amount = newAmount;
        } else if (difference < 0) {
          // Decrease allocation
          pool.availableCapacity += Math.abs(difference);
          pool.allocatedCapacity -= Math.abs(difference);
          unit.amount = newAmount;
        }

        break;
      }
    }
  }

  private updateResourceUtilization(): void {
    for (const [resourceType, pool] of this.resourcePools) {
      const utilization = pool.allocatedCapacity / pool.totalCapacity;
      pool.utilizationHistory.push(utilization);

      // Keep only last 100 data points
      if (pool.utilizationHistory.length > 100) {
        pool.utilizationHistory.shift();
      }
    }
  }

  private performResourceMaintenance(): void {
    // Clean up expired allocations
    for (const pool of this.resourcePools.values()) {
      const now = new Date();
      const expired = pool.allocationUnits.filter(
        (unit) => unit.expiresAt && unit.expiresAt < now,
      );

      for (const unit of expired) {
        this.releaseResourceUnit(unit);
      }
    }

    // Update efficiency metrics
    this.updateEfficiencyMetrics();
  }

  private analyzeResourceUtilization(): any {
    const analysis = {
      overallocated: [] as string[],
      underutilized: [] as string[],
      balanced: [] as string[],
      trends: new Map<string, number>(),
    };

    for (const [resourceType, pool] of this.resourcePools) {
      const utilization = pool.allocatedCapacity / pool.totalCapacity;
      const trend = this.calculateTrend(pool.utilizationHistory);

      if (utilization > 0.9) {
        analysis.overallocated.push(resourceType);
      } else if (utilization < 0.3) {
        analysis.underutilized.push(resourceType);
      } else {
        analysis.balanced.push(resourceType);
      }

      analysis.trends.set(resourceType, trend);
    }

    return analysis;
  }

  private identifyOptimizationOpportunities(analysis: any): any[] {
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

  private async executeOptimization(opportunity: any): Promise<void> {
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

  private async increasePoolCapacity(
    resourceType: string,
    factor: number,
  ): Promise<void> {
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

  private async reducePoolCapacity(
    resourceType: string,
    factor: number,
  ): Promise<void> {
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

  private async rebalanceResourcePools(): Promise<void> {
    // Rebalance resources across pools based on demand patterns
    this.logger.debug("Rebalancing resource pools");
  }

  private calculateTrend(history: number[]): number {
    if (history.length < 2) return 0;

    const recent = history.slice(-10);
    const older = history.slice(-20, -10);

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg =
      older.length > 0
        ? older.reduce((a, b) => a + b, 0) / older.length
        : recentAvg;

    return recentAvg - olderAvg;
  }

  private analyzeSeasonality(history: number[]): SeasonalPattern[] {
    // Simplified seasonality analysis
    return [
      {
        pattern: "hourly",
        multiplier: 1.2,
        confidence: 0.7,
      },
    ];
  }

  private calculatePredictionConfidence(history: number[]): number {
    if (history.length < 10) return 0.3;

    // Calculate variance
    const mean = history.reduce((a, b) => a + b, 0) / history.length;
    const variance =
      history.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) /
      history.length;

    // Lower variance = higher confidence
    return Math.max(0.1, Math.min(0.95, 1 - variance));
  }

  private generateResourceRecommendations(
    resourceType: string,
    predictedDemand: number,
    currentUtilization: number,
  ): ResourceRecommendation[] {
    const recommendations: ResourceRecommendation[] = [];

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

  private analyzeResourceContention(requests: ResourceRequirement[][]): any {
    return {
      contentionLevel: "medium",
      conflictingResources: ["memory", "cpu"],
      totalDemand: 150,
      availableCapacity: 100,
    };
  }

  private selectContentionResolutionStrategy(analysis: any): string {
    return "priority_based"; // Simplified strategy selection
  }

  private async applyContentionResolution(
    requests: ResourceRequirement[][],
    strategy: string,
  ): Promise<AllocationPlan[]> {
    // Simplified contention resolution
    return [];
  }

  private calculateAllocationCost(allocations: ResourceAllocation[]): number {
    return allocations.reduce((cost, allocation) => {
      const baseCost = allocation.actualAmount * 0.01; // $0.01 per unit
      return cost + baseCost;
    }, 0);
  }

  private calculateAllocationScore(
    requirements: ResourceRequirement[],
    allocations: ResourceAllocation[],
  ): number {
    if (requirements.length === 0) return 0;

    const fulfillmentRate = allocations.length / requirements.length;
    const efficiencyScore =
      allocations.reduce(
        (score, alloc) => score + alloc.performance.efficiency,
        0,
      ) / allocations.length;

    return (fulfillmentRate + efficiencyScore) / 2;
  }

  private generateImplementationOrder(
    allocations: ResourceAllocation[],
  ): number[] {
    // Priority-based ordering: critical resources first
    return allocations
      .map((_, index) => index)
      .sort((a, b) => {
        const priorityA = allocations[a].resourceType === "memory" ? 1 : 2;
        const priorityB = allocations[b].resourceType === "memory" ? 1 : 2;
        return priorityA - priorityB;
      });
  }

  private async validateConstraint(
    constraint: ResourceConstraint,
    allocation: ResourceAllocation,
  ): Promise<boolean> {
    // Simplified constraint validation
    return true;
  }

  private updateAllocationMetrics(
    plan: AllocationPlan,
    allocationTime: number,
    success: boolean,
  ): void {
    this.metrics.averageAllocationTime =
      (this.metrics.averageAllocationTime + allocationTime) / 2;

    if (success) {
      this.metrics.successfulAllocations++;
    }
  }

  private updateUtilizationMetrics(): void {
    for (const [resourceType, pool] of this.resourcePools) {
      this.metrics.resourceUtilization[resourceType] =
        pool.allocatedCapacity / pool.totalCapacity;
    }
  }

  private updateEfficiencyMetrics(): void {
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

  private calculateUtilizationImprovement(): number {
    // Simplified improvement calculation
    return 0.15; // 15% improvement
  }

  /**
   * Shutdown resource allocator
   */
  async shutdown(): Promise<void> {
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
