/**
 * Performance Monitor
 *
 * Tracks and analyzes performance metrics for model orchestration
 * Provides real-time monitoring and optimization recommendations
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
export interface PerformanceMetric {
    name: string;
    value: number;
    timestamp: Date;
    metadata?: any;
}
export interface PerformanceStats {
    mean: number;
    median: number;
    p95: number;
    p99: number;
    min: number;
    max: number;
    count: number;
    stddev: number;
}
export interface Bottleneck {
    component: string;
    metric: string;
    severity: "low" | "medium" | "high" | "critical";
    impact: number;
    description: string;
    recommendation: string;
}
export declare class PerformanceMonitor extends EventEmitter {
    private logger;
    private metrics;
    private maxHistorySize;
    private alertThresholds;
    private targets;
    constructor();
    /**
     * Setup default alert thresholds
     */
    private setupDefaultThresholds;
    /**
     * Record a performance metric
     */
    recordMetric(name: string, value: number, metadata?: any): void;
    /**
     * Check if metric exceeds threshold
     */
    private checkThreshold;
    /**
     * Calculate alert severity
     */
    private calculateSeverity;
    /**
     * Get statistics for a metric
     */
    getStats(metricName: string, timeWindow?: number): PerformanceStats | null;
    /**
     * Calculate percentile
     */
    private percentile;
    /**
     * Analyze performance and identify bottlenecks
     */
    analyzeBottlenecks(timeWindow?: number): Bottleneck[];
    /**
     * Calculate bottleneck severity
     */
    private calculateBottleneckSeverity;
    /**
     * Calculate performance impact
     */
    private calculateImpact;
    /**
     * Get component name from metric name
     */
    private getComponentFromMetric;
    /**
     * Generate optimization recommendations
     */
    private generateRecommendation;
    /**
     * Get performance health score (0-100)
     */
    getHealthScore(): number;
    /**
     * Start periodic performance analysis
     */
    private startPeriodicAnalysis;
    /**
     * Perform health check
     */
    private performHealthCheck;
    /**
     * Get health status from score
     */
    private getHealthStatus;
    /**
     * Get all metrics data
     */
    getMetrics(): {
        [metricName: string]: PerformanceStats;
    };
    /**
     * Clear old metrics data
     */
    clearOldMetrics(olderThan?: number): void;
    /**
     * Export performance data for analysis
     */
    exportData(format?: "json" | "csv"): string;
    /**
     * Shutdown performance monitor and cleanup resources
     */
    shutdown(): void;
}
//# sourceMappingURL=performance-monitor.d.ts.map