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
import { ResourceRequirement } from "../types/AgentSpaceTypes.js";
export interface ResourceAllocationStrategy {
    type: "round_robin" | "priority_based" | "load_balanced" | "intelligent" | "ml_optimized";
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
    resourceUtilization: {
        [resourceType: string]: number;
    };
    wasteRate: number;
    satisfactionScore: number;
    costEfficiency: number;
}
export declare class ResourceAllocator {
    private logger;
    private resourcePools;
    private allocationHistory;
    private activeAllocations;
    private predictionModels;
    private metrics;
    constructor();
    /**
     * Allocate resources for an agent
     */
    allocateResources(agentId: string, workspaceId: string, requirements: ResourceRequirement[], strategy?: ResourceAllocationStrategy): Promise<AllocationPlan>;
    /**
     * Deallocate resources for an agent
     */
    deallocateResources(agentId: string, resourceTypes?: string[]): Promise<void>;
    /**
     * Scale resources dynamically
     */
    scaleResources(agentId: string, resourceType: string, scaleFactor: number): Promise<void>;
    /**
     * Optimize resource allocations across all agents
     */
    optimizeAllocations(): Promise<void>;
    /**
     * Predict future resource needs
     */
    predictResourceNeeds(timeHorizon?: number, // 1 hour
    agentId?: string): Promise<ResourcePrediction[]>;
    /**
     * Handle resource contention
     */
    resolveResourceContention(contentionId: string, competingRequests: ResourceRequirement[][]): Promise<AllocationPlan[]>;
    /**
     * Get resource allocation metrics
     */
    getMetrics(): AllocationMetrics;
    /**
     * Get current resource pool status
     */
    getResourcePoolStatus(): {
        [resourceType: string]: ResourcePool;
    };
    /**
     * Private helper methods
     */
    private initializeResourcePools;
    private getDefaultCapacity;
    private startResourceMonitoring;
    private analyzeRequirements;
    private generateAllocationPlan;
    private allocateResourceType;
    private validateAllocation;
    private executeAllocation;
    private releaseResourceUnit;
    private adjustResourceAllocation;
    private updateResourceUtilization;
    private performResourceMaintenance;
    private analyzeResourceUtilization;
    private identifyOptimizationOpportunities;
    private executeOptimization;
    private increasePoolCapacity;
    private reducePoolCapacity;
    private rebalanceResourcePools;
    private calculateTrend;
    private analyzeSeasonality;
    private calculatePredictionConfidence;
    private generateResourceRecommendations;
    private analyzeResourceContention;
    private selectContentionResolutionStrategy;
    private applyContentionResolution;
    private calculateAllocationCost;
    private calculateAllocationScore;
    private generateImplementationOrder;
    private validateConstraint;
    private updateAllocationMetrics;
    private updateUtilizationMetrics;
    private updateEfficiencyMetrics;
    private calculateUtilizationImprovement;
    /**
     * Shutdown resource allocator
     */
    shutdown(): Promise<void>;
}
//# sourceMappingURL=ResourceAllocator.d.ts.map