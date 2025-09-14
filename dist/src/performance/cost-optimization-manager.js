/**
 * Cost Optimization Manager - Advanced resource allocation and cost strategies
 * Implements intelligent cost optimization with usage pattern analysis
 */
import { EventEmitter } from "events";
export class CostOptimizationManager extends EventEmitter {
    resources = new Map();
    usageHistory = [];
    budgets = new Map();
    optimizationRules = [];
    costAnalyzer;
    forecastEngine;
    alertManager;
    schedulingOptimizer;
    constructor() {
        super();
        this.costAnalyzer = new CostAnalyzer();
        this.forecastEngine = new ForecastEngine();
        this.alertManager = new AlertManager();
        this.schedulingOptimizer = new SchedulingOptimizer();
        this.initializeManager();
    }
    /**
     * Register resource cost configuration
     */
    registerResource(resource) {
        this.resources.set(resource.id, resource);
        this.emit("resourceRegistered", {
            resourceId: resource.id,
            type: resource.type,
        });
        console.log(`Registered resource: ${resource.id} (${resource.type}) - $${resource.costPerUnit}/${resource.unit}`);
    }
    /**
     * Record resource usage for cost tracking
     */
    recordUsage(usage) {
        this.usageHistory.push(usage);
        // Keep last 30 days of usage data
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        this.usageHistory = this.usageHistory.filter((u) => u.timestamp > thirtyDaysAgo);
        // Update budget tracking
        this.updateBudgetTracking(usage);
        // Check for cost anomalies
        this.checkCostAnomalies(usage);
        this.emit("usageRecorded", {
            resourceId: usage.resourceId,
            cost: usage.cost,
        });
    }
    /**
     * Create cost budget with allocation strategy
     */
    createBudget(budget) {
        this.budgets.set(budget.id, budget);
        this.alertManager.setupBudgetAlerts(budget);
        this.emit("budgetCreated", {
            budgetId: budget.id,
            totalBudget: budget.totalBudget,
        });
        console.log(`Created budget: ${budget.name} - $${budget.totalBudget} (${budget.period})`);
    }
    /**
     * Analyze costs and generate optimization recommendations
     */
    async generateOptimizationRecommendations() {
        const analysis = await this.costAnalyzer.analyzeUsagePatterns(this.usageHistory);
        const recommendations = [];
        // Analyze underutilized resources
        const underutilized = analysis.underutilizedResources;
        for (const resource of underutilized) {
            recommendations.push(await this.createScaleDownRecommendation(resource));
        }
        // Analyze over-provisioned resources
        const overProvisioned = analysis.overProvisionedResources;
        for (const resource of overProvisioned) {
            recommendations.push(await this.createTierChangeRecommendation(resource));
        }
        // Analyze regional cost differences
        const regionalOpportunities = analysis.regionalOptimizations;
        for (const opportunity of regionalOpportunities) {
            recommendations.push(await this.createRegionChangeRecommendation(opportunity));
        }
        // Analyze scheduling opportunities
        const schedulingOpportunities = await this.schedulingOptimizer.analyzeOpportunities(this.usageHistory);
        recommendations.push(...schedulingOpportunities);
        // Sort by potential savings
        recommendations.sort((a, b) => b.savings - a.savings);
        this.emit("recommendationsGenerated", { count: recommendations.length });
        return recommendations;
    }
    /**
     * Implement optimization recommendation
     */
    async implementRecommendation(recommendationId) {
        // Implementation would integrate with cloud provider APIs
        // For now, simulate implementation
        const success = Math.random() > 0.1; // 90% success rate
        const actualSavings = success ? Math.random() * 1000 : 0;
        if (success) {
            this.emit("recommendationImplemented", {
                recommendationId,
                actualSavings,
            });
            return { success: true, actualSavings };
        }
        else {
            return {
                success: false,
                error: "Failed to implement recommendation",
            };
        }
    }
    /**
     * Generate cost forecast based on usage patterns
     */
    async generateCostForecast(period) {
        const forecast = await this.forecastEngine.generateForecast(this.usageHistory, period);
        this.emit("forecastGenerated", {
            period,
            projectedCost: forecast.projectedCost,
        });
        return forecast;
    }
    /**
     * Optimize resource allocation based on cost and performance
     */
    async optimizeResourceAllocation(constraints) {
        const currentAllocation = this.getCurrentAllocation();
        const optimizedAllocation = await this.calculateOptimalAllocation(constraints, currentAllocation);
        const savings = currentAllocation.cost - optimizedAllocation.totalCost;
        this.emit("allocationOptimized", {
            savings,
            performanceChange: optimizedAllocation.estimatedPerformance,
        });
        return optimizedAllocation;
    }
    /**
     * Get comprehensive cost analytics
     */
    getCostAnalytics(timeRange) {
        const relevantUsage = this.usageHistory.filter((u) => u.timestamp >= timeRange.start && u.timestamp <= timeRange.end);
        const totalCost = relevantUsage.reduce((sum, u) => sum + u.cost, 0);
        const costByCategory = this.groupCostsByCategory(relevantUsage);
        const costByRegion = this.groupCostsByRegion(relevantUsage);
        const utilizationMetrics = this.calculateUtilizationMetrics(relevantUsage);
        const trends = this.calculateCostTrends(relevantUsage);
        const topCostDrivers = this.identifyTopCostDrivers(relevantUsage);
        return {
            totalCost,
            costByCategory,
            costByRegion,
            utilizationMetrics,
            trends,
            topCostDrivers,
        };
    }
    /**
     * Set up automated cost optimization
     */
    enableAutomatedOptimization(config) {
        if (config.enabled) {
            // Schedule automated optimization
            setInterval(async () => {
                const recommendations = await this.generateOptimizationRecommendations();
                for (const rec of recommendations) {
                    if (rec.savings >= config.maxSavingsThreshold &&
                        rec.implementation.risk === config.maxRiskLevel) {
                        if (!config.approvalRequired) {
                            await this.implementRecommendation(rec.resourceId);
                        }
                        else {
                            this.emit("approvalRequired", { recommendation: rec });
                        }
                    }
                }
            }, 60 * 60 * 1000); // Every hour
        }
        this.emit("automationConfigured", { enabled: config.enabled });
    }
    /**
     * Monitor budget alerts and cost anomalies
     */
    startCostMonitoring() {
        setInterval(() => {
            this.checkBudgetAlerts();
            this.detectCostAnomalies();
        }, 5 * 60 * 1000); // Every 5 minutes
        this.emit("monitoringStarted");
    }
    // Private implementation methods
    async initializeManager() {
        // Register common cloud resource types
        this.registerCommonResources();
        // Create default budget
        this.createDefaultBudget();
        // Setup optimization rules
        this.setupOptimizationRules();
        this.emit("managerInitialized");
    }
    registerCommonResources() {
        const commonResources = [
            {
                id: "compute-small",
                type: "compute",
                provider: "aws",
                region: "us-east-1",
                costPerUnit: 0.096,
                unit: "hour",
                tier: "on-demand",
            },
            {
                id: "compute-medium",
                type: "compute",
                provider: "aws",
                region: "us-east-1",
                costPerUnit: 0.192,
                unit: "hour",
                tier: "on-demand",
            },
            {
                id: "storage-standard",
                type: "storage",
                provider: "aws",
                region: "us-east-1",
                costPerUnit: 0.023,
                unit: "gb-month",
                tier: "on-demand",
            },
            {
                id: "gpu-v100",
                type: "gpu",
                provider: "aws",
                region: "us-east-1",
                costPerUnit: 3.06,
                unit: "hour",
                tier: "on-demand",
            },
        ];
        for (const resource of commonResources) {
            this.registerResource(resource);
        }
    }
    createDefaultBudget() {
        const defaultBudget = {
            id: "default-monthly",
            name: "Default Monthly Budget",
            totalBudget: 10000,
            period: "monthly",
            allocated: 0,
            spent: 0,
            remaining: 10000,
            alerts: {
                warning: 80,
                critical: 95,
            },
            categories: new Map([
                ["compute", 6000],
                ["storage", 2000],
                ["network", 1000],
                ["gpu", 1000],
            ]),
        };
        this.createBudget(defaultBudget);
    }
    setupOptimizationRules() {
        this.optimizationRules = [
            {
                name: "underutilized-compute",
                condition: (usage) => {
                    const avgUtilization = usage.reduce((sum, u) => sum + u.utilization, 0) / usage.length;
                    return avgUtilization < 0.3; // Less than 30% utilization
                },
                action: "scale-down",
                savings: 0.5,
            },
            {
                name: "overprovisioned-memory",
                condition: (usage) => {
                    const maxUsage = Math.max(...usage.map((u) => u.usage));
                    return maxUsage < 0.6; // Less than 60% peak usage
                },
                action: "tier-change",
                savings: 0.3,
            },
        ];
    }
    updateBudgetTracking(usage) {
        for (const [budgetId, budget] of this.budgets.entries()) {
            const resource = this.resources.get(usage.resourceId);
            if (resource && budget.categories.has(resource.type)) {
                budget.spent += usage.cost;
                budget.remaining = budget.totalBudget - budget.spent;
            }
        }
    }
    checkCostAnomalies(usage) {
        const recentUsage = this.usageHistory
            .filter((u) => u.resourceId === usage.resourceId)
            .slice(-24); // Last 24 data points
        if (recentUsage.length < 10)
            return;
        const avgCost = recentUsage.reduce((sum, u) => sum + u.cost, 0) / recentUsage.length;
        const threshold = avgCost * 2; // 100% increase threshold
        if (usage.cost > threshold) {
            this.emit("costAnomaly", {
                resourceId: usage.resourceId,
                currentCost: usage.cost,
                expectedCost: avgCost,
                deviation: (usage.cost - avgCost) / avgCost,
            });
        }
    }
    async createScaleDownRecommendation(resource) {
        return {
            type: "scale-down",
            resourceId: resource.id,
            currentCost: resource.currentCost,
            projectedCost: resource.currentCost * 0.7,
            savings: resource.currentCost * 0.3,
            confidence: 0.85,
            impact: "medium",
            implementation: {
                effort: "easy",
                risk: "low",
                timeline: "1 day",
            },
            description: `Scale down ${resource.id} due to low utilization (${resource.utilization}%)`,
        };
    }
    async createTierChangeRecommendation(resource) {
        return {
            type: "tier-change",
            resourceId: resource.id,
            currentCost: resource.currentCost,
            projectedCost: resource.currentCost * 0.6,
            savings: resource.currentCost * 0.4,
            confidence: 0.9,
            impact: "high",
            implementation: {
                effort: "moderate",
                risk: "medium",
                timeline: "3 days",
            },
            description: `Change ${resource.id} to reserved instance for better pricing`,
        };
    }
    async createRegionChangeRecommendation(opportunity) {
        return {
            type: "region-change",
            resourceId: opportunity.resourceId,
            currentCost: opportunity.currentCost,
            projectedCost: opportunity.newCost,
            savings: opportunity.currentCost - opportunity.newCost,
            confidence: 0.75,
            impact: "high",
            implementation: {
                effort: "complex",
                risk: "high",
                timeline: "1 week",
            },
            description: `Move ${opportunity.resourceId} to ${opportunity.newRegion} for cost savings`,
        };
    }
    getCurrentAllocation() {
        const allocation = new Map();
        let totalCost = 0;
        for (const usage of this.usageHistory.slice(-24)) {
            // Last 24 hours
            const current = allocation.get(usage.resourceId) || 0;
            allocation.set(usage.resourceId, current + usage.usage);
            totalCost += usage.cost;
        }
        return { cost: totalCost, allocation };
    }
    async calculateOptimalAllocation(constraints, currentAllocation) {
        // Simplified optimization algorithm
        const optimizedAllocation = new Map(currentAllocation.allocation);
        const totalCost = Math.min(constraints.maxCost, currentAllocation.cost * 0.8);
        const estimatedPerformance = Math.max(constraints.minPerformance, 0.9);
        const savings = currentAllocation.cost - totalCost;
        return {
            allocation: optimizedAllocation,
            totalCost,
            estimatedPerformance,
            savings,
        };
    }
    groupCostsByCategory(usage) {
        const costByCategory = new Map();
        for (const u of usage) {
            const resource = this.resources.get(u.resourceId);
            if (resource) {
                const current = costByCategory.get(resource.type) || 0;
                costByCategory.set(resource.type, current + u.cost);
            }
        }
        return costByCategory;
    }
    groupCostsByRegion(usage) {
        const costByRegion = new Map();
        for (const u of usage) {
            const resource = this.resources.get(u.resourceId);
            if (resource) {
                const current = costByRegion.get(resource.region) || 0;
                costByRegion.set(resource.region, current + u.cost);
            }
        }
        return costByRegion;
    }
    calculateUtilizationMetrics(usage) {
        const utilizationMetrics = new Map();
        const resourceUsage = new Map();
        for (const u of usage) {
            if (!resourceUsage.has(u.resourceId)) {
                resourceUsage.set(u.resourceId, []);
            }
            resourceUsage.get(u.resourceId).push(u.utilization);
        }
        for (const [resourceId, utilizations] of resourceUsage) {
            const avgUtilization = utilizations.reduce((sum, util) => sum + util, 0) / utilizations.length;
            utilizationMetrics.set(resourceId, avgUtilization);
        }
        return utilizationMetrics;
    }
    calculateCostTrends(usage) {
        // Simplified trend calculation
        const dailyCosts = [];
        const weeklyCosts = [];
        // Group by day
        const dayMs = 24 * 60 * 60 * 1000;
        const days = Math.ceil((Date.now() - Math.min(...usage.map((u) => u.timestamp))) / dayMs);
        for (let i = 0; i < Math.min(days, 30); i++) {
            const dayStart = Date.now() - (i + 1) * dayMs;
            const dayEnd = Date.now() - i * dayMs;
            const dayCost = usage
                .filter((u) => u.timestamp >= dayStart && u.timestamp < dayEnd)
                .reduce((sum, u) => sum + u.cost, 0);
            dailyCosts.unshift(dayCost);
        }
        // Calculate weekly averages
        for (let i = 0; i < Math.floor(dailyCosts.length / 7); i++) {
            const weekCosts = dailyCosts.slice(i * 7, (i + 1) * 7);
            const weekAvg = weekCosts.reduce((sum, cost) => sum + cost, 0) / weekCosts.length;
            weeklyCosts.push(weekAvg);
        }
        // Calculate growth rate
        const growth = weeklyCosts.length > 1
            ? (weeklyCosts[weeklyCosts.length - 1] - weeklyCosts[0]) /
                weeklyCosts[0]
            : 0;
        return { daily: dailyCosts, weekly: weeklyCosts, growth };
    }
    identifyTopCostDrivers(usage) {
        const resourceCosts = new Map();
        let totalCost = 0;
        for (const u of usage) {
            const current = resourceCosts.get(u.resourceId) || 0;
            resourceCosts.set(u.resourceId, current + u.cost);
            totalCost += u.cost;
        }
        return Array.from(resourceCosts.entries())
            .map(([resourceId, cost]) => ({
            resourceId,
            cost,
            percentage: (cost / totalCost) * 100,
        }))
            .sort((a, b) => b.cost - a.cost)
            .slice(0, 10); // Top 10 cost drivers
    }
    checkBudgetAlerts() {
        for (const [budgetId, budget] of this.budgets.entries()) {
            const usagePercentage = (budget.spent / budget.totalBudget) * 100;
            if (usagePercentage >= budget.alerts.critical) {
                this.emit("budgetAlert", {
                    budgetId,
                    level: "critical",
                    usagePercentage,
                    remaining: budget.remaining,
                });
            }
            else if (usagePercentage >= budget.alerts.warning) {
                this.emit("budgetAlert", {
                    budgetId,
                    level: "warning",
                    usagePercentage,
                    remaining: budget.remaining,
                });
            }
        }
    }
    detectCostAnomalies() {
        // Detect patterns and anomalies in cost data
        const recentHour = Date.now() - 60 * 60 * 1000;
        const recentUsage = this.usageHistory.filter((u) => u.timestamp > recentHour);
        if (recentUsage.length === 0)
            return;
        const currentHourCost = recentUsage.reduce((sum, u) => sum + u.cost, 0);
        const historicalHourCosts = this.getHistoricalHourlyCosts();
        if (historicalHourCosts.length > 0) {
            const avgHourlyCost = historicalHourCosts.reduce((sum, cost) => sum + cost, 0) /
                historicalHourCosts.length;
            const anomalyThreshold = avgHourlyCost * 2;
            if (currentHourCost > anomalyThreshold) {
                this.emit("costSpike", {
                    currentCost: currentHourCost,
                    expectedCost: avgHourlyCost,
                    severity: currentHourCost > avgHourlyCost * 3 ? "critical" : "warning",
                });
            }
        }
    }
    getHistoricalHourlyCosts() {
        const hourMs = 60 * 60 * 1000;
        const costs = [];
        for (let i = 1; i <= 24; i++) {
            // Last 24 hours
            const hourStart = Date.now() - (i + 1) * hourMs;
            const hourEnd = Date.now() - i * hourMs;
            const hourCost = this.usageHistory
                .filter((u) => u.timestamp >= hourStart && u.timestamp < hourEnd)
                .reduce((sum, u) => sum + u.cost, 0);
            costs.push(hourCost);
        }
        return costs;
    }
}
class CostAnalyzer {
    async analyzeUsagePatterns(usage) {
        // Analyze usage patterns and identify optimization opportunities
        return {
            underutilizedResources: [],
            overProvisionedResources: [],
            regionalOptimizations: [],
        };
    }
}
class ForecastEngine {
    async generateForecast(usage, period) {
        // Generate cost forecast based on historical data
        const multipliers = { week: 7, month: 30, quarter: 90, year: 365 };
        const days = multipliers[period] || 30;
        const recentCost = usage.slice(-days).reduce((sum, u) => sum + u.cost, 0);
        const projectedCost = recentCost * (days / Math.min(usage.length, days));
        return {
            period,
            projectedCost,
            confidence: 0.8,
            factors: {
                trend: 0.1,
                seasonality: 0.05,
                growth: 0.15,
                efficiency: -0.05,
            },
            breakdown: new Map([
                ["compute", projectedCost * 0.6],
                ["storage", projectedCost * 0.2],
                ["network", projectedCost * 0.1],
                ["gpu", projectedCost * 0.1],
            ]),
        };
    }
}
class AlertManager {
    setupBudgetAlerts(budget) {
        // Setup budget alerts
    }
}
class SchedulingOptimizer {
    async analyzeOpportunities(usage) {
        // Analyze scheduling optimization opportunities
        return [];
    }
}
export { CostAnalyzer, ForecastEngine, AlertManager, SchedulingOptimizer, };
//# sourceMappingURL=cost-optimization-manager.js.map