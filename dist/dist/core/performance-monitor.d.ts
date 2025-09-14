export class PerformanceMonitor extends EventEmitter<[never]> {
    constructor();
    logger: Logger;
    metrics: Map<any, any>;
    maxHistorySize: number;
    alertThresholds: Map<any, any>;
    targets: {
        orchestration_latency: number;
        routing_overhead: number;
        cache_hit_rate: number;
        model_availability: number;
        error_rate: number;
    };
    /**
     * Setup default alert thresholds
     */
    setupDefaultThresholds(): void;
    /**
     * Record a performance metric
     */
    recordMetric(name: any, value: any, metadata: any): void;
    /**
     * Check if metric exceeds threshold
     */
    checkThreshold(name: any, value: any): void;
    /**
     * Calculate alert severity
     */
    calculateSeverity(value: any, threshold: any): "low" | "medium" | "high" | "critical";
    /**
     * Get statistics for a metric
     */
    getStats(metricName: any, timeWindow: any): {
        mean: number;
        median: any;
        p95: any;
        p99: any;
        min: number;
        max: number;
        count: any;
        stddev: number;
    } | null;
    /**
     * Calculate percentile
     */
    percentile(sorted: any, p: any): any;
    /**
     * Analyze performance and identify bottlenecks
     */
    analyzeBottlenecks(timeWindow?: number): {
        component: string;
        metric: any;
        severity: string;
        impact: number;
        description: string;
        recommendation: any;
    }[];
    /**
     * Calculate bottleneck severity
     */
    calculateBottleneckSeverity(value: any, target: any): "low" | "medium" | "high" | "critical";
    /**
     * Calculate performance impact
     */
    calculateImpact(metric: any, value: any, target: any): number;
    /**
     * Get component name from metric name
     */
    getComponentFromMetric(metric: any): "unknown" | "cache" | "authentication" | "orchestrator" | "router" | "model_client";
    /**
     * Generate optimization recommendations
     */
    generateRecommendation(metric: any, stats: any): any;
    /**
     * Get performance health score (0-100)
     */
    getHealthScore(): number;
    /**
     * Start periodic performance analysis
     */
    startPeriodicAnalysis(): void;
    /**
     * Perform health check
     */
    performHealthCheck(): void;
    /**
     * Get health status from score
     */
    getHealthStatus(score: any): "critical" | "excellent" | "good" | "fair" | "poor";
    /**
     * Get all metrics data
     */
    getMetrics(): {};
    /**
     * Clear old metrics data
     */
    clearOldMetrics(olderThan?: number): void;
    /**
     * Export performance data for analysis
     */
    exportData(format?: string): string;
    /**
     * Shutdown performance monitor and cleanup resources
     */
    shutdown(): void;
}
import { EventEmitter } from "events";
import { Logger } from "../utils/logger.js";
//# sourceMappingURL=performance-monitor.d.ts.map