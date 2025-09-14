/**
 * Cost Optimization Manager - Advanced resource allocation and cost strategies
 * Implements intelligent cost optimization with usage pattern analysis
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
export interface ResourceCost {
    id: string;
    type: "compute" | "storage" | "network" | "gpu" | "memory";
    provider: string;
    region: string;
    costPerUnit: number;
    unit: "hour" | "gb" | "gb-month" | "request" | "gb-transfer";
    tier: "on-demand" | "reserved" | "spot" | "preemptible";
    minimumCommitment?: number;
    discountRate?: number;
}
export interface ResourceUsage {
    resourceId: string;
    timestamp: number;
    usage: number;
    cost: number;
    efficiency: number;
    utilization: number;
    metadata: {
        userId?: string;
        service: string;
        task: string;
        priority: "low" | "medium" | "high" | "critical";
    };
}
export interface CostBudget {
    id: string;
    name: string;
    totalBudget: number;
    period: "daily" | "weekly" | "monthly" | "yearly";
    allocated: number;
    spent: number;
    remaining: number;
    alerts: {
        warning: number;
        critical: number;
    };
    categories: Map<string, number>;
}
export interface OptimizationRecommendation {
    type: "scale-down" | "scale-up" | "tier-change" | "region-change" | "schedule-change";
    resourceId: string;
    currentCost: number;
    projectedCost: number;
    savings: number;
    confidence: number;
    impact: "low" | "medium" | "high";
    implementation: {
        effort: "easy" | "moderate" | "complex";
        risk: "low" | "medium" | "high";
        timeline: string;
    };
    description: string;
}
export interface CostForecast {
    period: string;
    projectedCost: number;
    confidence: number;
    factors: {
        trend: number;
        seasonality: number;
        growth: number;
        efficiency: number;
    };
    breakdown: Map<string, number>;
}
export declare class CostOptimizationManager extends EventEmitter {
    private resources;
    private usageHistory;
    private budgets;
    private optimizationRules;
    private costAnalyzer;
    private forecastEngine;
    private alertManager;
    private schedulingOptimizer;
    constructor();
    /**
     * Register resource cost configuration
     */
    registerResource(resource: ResourceCost): void;
    /**
     * Record resource usage for cost tracking
     */
    recordUsage(usage: ResourceUsage): void;
    /**
     * Create cost budget with allocation strategy
     */
    createBudget(budget: CostBudget): void;
    /**
     * Analyze costs and generate optimization recommendations
     */
    generateOptimizationRecommendations(): Promise<OptimizationRecommendation[]>;
    /**
     * Implement optimization recommendation
     */
    implementRecommendation(recommendationId: string): Promise<{
        success: boolean;
        actualSavings?: number;
        error?: string;
    }>;
    /**
     * Generate cost forecast based on usage patterns
     */
    generateCostForecast(period: "week" | "month" | "quarter" | "year"): Promise<CostForecast>;
    /**
     * Optimize resource allocation based on cost and performance
     */
    optimizeResourceAllocation(constraints: {
        maxCost: number;
        minPerformance: number;
        preferredRegions?: string[];
        allowSpot?: boolean;
    }): Promise<{
        allocation: Map<string, number>;
        totalCost: number;
        estimatedPerformance: number;
        savings: number;
    }>;
    /**
     * Get comprehensive cost analytics
     */
    getCostAnalytics(timeRange: {
        start: number;
        end: number;
    }): {
        totalCost: number;
        costByCategory: Map<string, number>;
        costByRegion: Map<string, number>;
        utilizationMetrics: Map<string, number>;
        trends: {
            daily: number[];
            weekly: number[];
            growth: number;
        };
        topCostDrivers: Array<{
            resourceId: string;
            cost: number;
            percentage: number;
        }>;
    };
    /**
     * Set up automated cost optimization
     */
    enableAutomatedOptimization(config: {
        enabled: boolean;
        maxSavingsThreshold: number;
        maxRiskLevel: "low" | "medium" | "high";
        approvalRequired: boolean;
        scheduleOptimization: string;
    }): void;
    /**
     * Monitor budget alerts and cost anomalies
     */
    startCostMonitoring(): void;
    private initializeManager;
    private registerCommonResources;
    private createDefaultBudget;
    private setupOptimizationRules;
    private updateBudgetTracking;
    private checkCostAnomalies;
    private createScaleDownRecommendation;
    private createTierChangeRecommendation;
    private createRegionChangeRecommendation;
    private getCurrentAllocation;
    private calculateOptimalAllocation;
    private groupCostsByCategory;
    private groupCostsByRegion;
    private calculateUtilizationMetrics;
    private calculateCostTrends;
    private identifyTopCostDrivers;
    private checkBudgetAlerts;
    private detectCostAnomalies;
    private getHistoricalHourlyCosts;
}
interface OptimizationRule {
    name: string;
    condition: (usage: ResourceUsage[]) => boolean;
    action: string;
    savings: number;
}
declare class CostAnalyzer {
    analyzeUsagePatterns(usage: ResourceUsage[]): Promise<{
        underutilizedResources: any[];
        overProvisionedResources: any[];
        regionalOptimizations: any[];
    }>;
}
declare class ForecastEngine {
    generateForecast(usage: ResourceUsage[], period: string): Promise<CostForecast>;
}
declare class AlertManager {
    setupBudgetAlerts(budget: CostBudget): void;
}
declare class SchedulingOptimizer {
    analyzeOpportunities(usage: ResourceUsage[]): Promise<OptimizationRecommendation[]>;
}
export { CostAnalyzer, ForecastEngine, AlertManager, SchedulingOptimizer, OptimizationRule, };
//# sourceMappingURL=cost-optimization-manager.d.ts.map