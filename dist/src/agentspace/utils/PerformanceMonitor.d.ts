/**
 * Performance Monitor - Advanced performance tracking and optimization
 *
 * Provides comprehensive performance monitoring with:
 * - Real-time performance metrics collection
 * - Bottleneck detection and analysis
 * - Performance trend analysis
 * - Automated optimization recommendations
 * - SLA monitoring and alerting
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
export interface PerformanceConfig {
    metricsCollectionInterval: number;
    trendAnalysisWindow: number;
    bottleneckDetectionThreshold: number;
    alertingEnabled: boolean;
    historicalDataRetention: number;
}
export interface SystemPerformanceMetrics {
    timestamp: Date;
    uptime: number;
    throughput: ThroughputMetrics;
    latency: LatencyMetrics;
    resourceUsage: ResourceUsageMetrics;
    errorMetrics: ErrorMetrics;
    virtualization: ComponentMetrics;
    spatial: ComponentMetrics;
    memory: ComponentMetrics;
    consensus: ComponentMetrics;
    overallHealth: number;
    performanceScore: number;
    efficiency: number;
    reliability: number;
}
export interface ThroughputMetrics {
    operationsPerSecond: number;
    requestsPerSecond: number;
    dataProcessedPerSecond: number;
    peakThroughput: number;
    averageThroughput: number;
    throughputTrend: "increasing" | "stable" | "decreasing";
}
export interface LatencyMetrics {
    averageLatency: number;
    p50Latency: number;
    p95Latency: number;
    p99Latency: number;
    maxLatency: number;
    latencyDistribution: number[];
    latencyTrend: "improving" | "stable" | "degrading";
}
export interface ResourceUsageMetrics {
    cpu: ResourceMetric;
    memory: ResourceMetric;
    network: ResourceMetric;
    storage: ResourceMetric;
    overallUtilization: number;
    resourceEfficiency: number;
}
export interface ResourceMetric {
    current: number;
    average: number;
    peak: number;
    utilization: number;
    trend: "increasing" | "stable" | "decreasing";
}
export interface ErrorMetrics {
    totalErrors: number;
    errorRate: number;
    errorsByType: {
        [type: string]: number;
    };
    criticalErrors: number;
    recoveryTime: number;
    errorTrend: "increasing" | "stable" | "decreasing";
}
export interface ComponentMetrics {
    operationsCount: number;
    averageResponseTime: number;
    successRate: number;
    errorCount: number;
    healthScore: number;
    lastUpdate: Date;
}
export interface PerformanceAlert {
    id: string;
    type: "threshold_exceeded" | "bottleneck_detected" | "sla_violation" | "anomaly_detected";
    severity: "low" | "medium" | "high" | "critical";
    component: string;
    metric: string;
    currentValue: number;
    thresholdValue: number;
    timestamp: Date;
    description: string;
    recommendedActions: string[];
}
export interface BottleneckAnalysis {
    id: string;
    component: string;
    bottleneckType: "cpu" | "memory" | "network" | "storage" | "algorithm" | "contention";
    severity: number;
    impact: "low" | "medium" | "high" | "critical";
    affectedOperations: string[];
    rootCause: string;
    resolutionPlan: ResolutionStep[];
    estimatedImprovementPercentage: number;
}
export interface ResolutionStep {
    step: number;
    action: string;
    description: string;
    estimatedTime: number;
    expectedImprovement: number;
    riskLevel: "low" | "medium" | "high";
}
export interface PerformanceTrend {
    metric: string;
    component: string;
    timeWindow: number;
    trendDirection: "improving" | "stable" | "degrading";
    changeRate: number;
    predictedValue: number;
    confidence: number;
    seasonality: SeasonalityInfo[];
}
export interface SeasonalityInfo {
    pattern: "hourly" | "daily" | "weekly";
    strength: number;
    peakTimes: string[];
    lowTimes: string[];
}
export interface SLADefinition {
    name: string;
    metric: string;
    threshold: number;
    operator: "less_than" | "greater_than" | "equals";
    timeWindow: number;
    violationAction: "alert" | "scale" | "optimize" | "failover";
}
export interface SLAViolation {
    slaName: string;
    metric: string;
    currentValue: number;
    thresholdValue: number;
    duration: number;
    timestamp: Date;
    actionTaken: string;
}
export interface PerformanceInsight {
    type: "optimization" | "capacity" | "efficiency" | "reliability";
    priority: "low" | "medium" | "high" | "critical";
    title: string;
    description: string;
    potentialImpact: number;
    implementationEffort: "low" | "medium" | "high";
    recommendations: string[];
    relatedMetrics: string[];
}
export declare class PerformanceMonitor extends EventEmitter {
    private logger;
    private config;
    private metricsHistory;
    private activeAlerts;
    private bottlenecks;
    private trends;
    private slaDefinitions;
    private slaViolations;
    private metricsCollectionTimer;
    private analysisTimer;
    private isMonitoring;
    private startTime;
    private operationCounts;
    private latencyMeasurements;
    private errorCounts;
    constructor(config: PerformanceConfig);
    /**
     * Start performance monitoring
     */
    startMonitoring(): void;
    /**
     * Stop performance monitoring
     */
    stopMonitoring(): void;
    /**
     * Record operation metrics
     */
    recordOperation(operation: string, duration: number, success: boolean, component?: string): void;
    /**
     * Get current performance metrics
     */
    getCurrentMetrics(): SystemPerformanceMetrics;
    /**
     * Get performance history
     */
    getPerformanceHistory(timeWindow?: number): SystemPerformanceMetrics[];
    /**
     * Detect performance bottlenecks
     */
    detectBottlenecks(): Promise<BottleneckAnalysis[]>;
    /**
     * Analyze performance trends
     */
    analyzePerformanceTrends(): PerformanceTrend[];
    /**
     * Generate performance insights
     */
    generatePerformanceInsights(): PerformanceInsight[];
    /**
     * Check SLA compliance
     */
    checkSLACompliance(): SLAViolation[];
    /**
     * Generate performance alerts
     */
    generateAlerts(): PerformanceAlert[];
    /**
     * Get active performance alerts
     */
    getActiveAlerts(): PerformanceAlert[];
    /**
     * Get detected bottlenecks
     */
    getBottlenecks(): BottleneckAnalysis[];
    /**
     * Private helper methods
     */
    private initializeDefaultSLAs;
    private collectMetrics;
    private performAnalysis;
    private calculateThroughputMetrics;
    private calculateLatencyMetrics;
    private calculateResourceUsageMetrics;
    private calculateErrorMetrics;
    private getComponentMetrics;
    private calculateOverallHealth;
    private calculatePerformanceScore;
    private calculateEfficiency;
    private calculateReliability;
    private createLatencyDistribution;
    private createBottleneckAnalysis;
    private generateResolutionPlan;
    private calculateTrend;
    private getTrendDirection;
    private createAlert;
    private getMetricValue;
    private evaluateSLACondition;
    private executeSLAAction;
    /**
     * Cleanup and shutdown
     */
    shutdown(): Promise<void>;
}
//# sourceMappingURL=PerformanceMonitor.d.ts.map