/**
 * Performance Monitor
 *
 * Tracks and analyzes performance metrics for model orchestration
 * Provides real-time monitoring and optimization recommendations
 */
import { Logger } from "../utils/logger.js";
import { EventEmitter } from "node:events";
export class PerformanceMonitor extends EventEmitter {
    constructor() {
        super();
        this.metrics = new Map();
        this.maxHistorySize = 1000;
        this.alertThresholds = new Map();
        // Performance targets
        this.targets = {
            orchestration_latency: 2000, // 2 seconds max
            routing_overhead: 100, // 100ms max
            cache_hit_rate: 0.7, // 70% minimum
            model_availability: 0.99, // 99% uptime
            error_rate: 0.01, // 1% max error rate
        };
        this.logger = new Logger("PerformanceMonitor");
        this.setupDefaultThresholds();
        this.startPeriodicAnalysis();
    }
    /**
     * Setup default alert thresholds
     */
    setupDefaultThresholds() {
        this.alertThresholds.set("orchestration_latency", 3000);
        this.alertThresholds.set("routing_overhead", 150);
        this.alertThresholds.set("model_latency", 5000);
        this.alertThresholds.set("cache_miss_rate", 0.4);
        this.alertThresholds.set("error_rate", 0.05);
        this.logger.debug("Performance thresholds configured", {
            thresholds: Object.fromEntries(this.alertThresholds),
        });
    }
    /**
     * Record a performance metric
     */
    recordMetric(name, value, metadata) {
        const metric = {
            name,
            value,
            timestamp: new Date(),
            metadata,
        };
        // Get or create metric history
        const history = this.metrics.get(name) || [];
        history.push(metric);
        // Maintain history size limit
        if (history.length > this.maxHistorySize) {
            history.shift(); // Remove oldest
        }
        this.metrics.set(name, history);
        // Check for threshold violations
        this.checkThreshold(name, value);
        // Emit metric event
        this.emit("metric_recorded", metric);
    }
    /**
     * Check if metric exceeds threshold
     */
    checkThreshold(name, value) {
        const threshold = this.alertThresholds.get(name);
        if (!threshold)
            return;
        if (value > threshold) {
            const alert = {
                metric: name,
                value,
                threshold,
                severity: this.calculateSeverity(value, threshold),
                timestamp: new Date(),
            };
            this.logger.warn("Performance threshold exceeded", alert);
            this.emit("threshold_exceeded", alert);
        }
    }
    /**
     * Calculate alert severity
     */
    calculateSeverity(value, threshold) {
        const ratio = value / threshold;
        if (ratio >= 3)
            return "critical";
        if (ratio >= 2)
            return "high";
        if (ratio >= 1.5)
            return "medium";
        return "low";
    }
    /**
     * Get statistics for a metric
     */
    getStats(metricName, timeWindow) {
        const history = this.metrics.get(metricName);
        if (!history || history.length === 0) {
            return null;
        }
        let values = history.map((m) => m.value);
        // Filter by time window if specified
        if (timeWindow) {
            const cutoff = new Date(Date.now() - timeWindow);
            values = history.filter((m) => m.timestamp >= cutoff).map((m) => m.value);
        }
        if (values.length === 0) {
            return null;
        }
        const sorted = [...values].sort((a, b) => a - b);
        const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
        const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
        return {
            mean,
            median: this.percentile(sorted, 0.5),
            p95: this.percentile(sorted, 0.95),
            p99: this.percentile(sorted, 0.99),
            min: Math.min(...values),
            max: Math.max(...values),
            count: values.length,
            stddev: Math.sqrt(variance),
        };
    }
    /**
     * Calculate percentile
     */
    percentile(sorted, p) {
        const index = Math.ceil(sorted.length * p) - 1;
        return sorted[Math.max(0, index)];
    }
    /**
     * Analyze performance and identify bottlenecks
     */
    analyzeBottlenecks(timeWindow = 300000) {
        // Default 5 minutes
        const bottlenecks = [];
        const cutoff = new Date(Date.now() - timeWindow);
        for (const [metricName, history] of this.metrics) {
            const recentMetrics = history.filter((m) => m.timestamp >= cutoff);
            if (recentMetrics.length < 5)
                continue; // Need minimum data
            const stats = this.getStats(metricName, timeWindow);
            if (!stats)
                continue;
            const target = this.targets[metricName];
            if (!target)
                continue;
            // Check if p95 exceeds target significantly
            if (stats.p95 > target * 1.5) {
                const severity = this.calculateBottleneckSeverity(stats.p95, target);
                const impact = this.calculateImpact(metricName, stats.p95, target);
                bottlenecks.push({
                    component: this.getComponentFromMetric(metricName),
                    metric: metricName,
                    severity,
                    impact,
                    description: `${metricName} P95 (${stats.p95.toFixed(2)}) exceeds target (${target})`,
                    recommendation: this.generateRecommendation(metricName, stats),
                });
            }
            // Check for high variance (inconsistent performance)
            const coefficientOfVariation = stats.stddev / stats.mean;
            if (coefficientOfVariation > 0.5) {
                bottlenecks.push({
                    component: this.getComponentFromMetric(metricName),
                    metric: metricName,
                    severity: "medium",
                    impact: 0.3,
                    description: `${metricName} shows high variance (CV: ${coefficientOfVariation.toFixed(2)})`,
                    recommendation: "Investigate cause of performance inconsistency",
                });
            }
        }
        // Sort by impact (highest first)
        bottlenecks.sort((a, b) => b.impact - a.impact);
        this.logger.info("Bottleneck analysis completed", {
            bottlenecksFound: bottlenecks.length,
            timeWindow,
            highSeverity: bottlenecks.filter((b) => b.severity === "high" || b.severity === "critical").length,
        });
        return bottlenecks;
    }
    /**
     * Calculate bottleneck severity
     */
    calculateBottleneckSeverity(value, target) {
        const ratio = value / target;
        if (ratio >= 4)
            return "critical";
        if (ratio >= 3)
            return "high";
        if (ratio >= 2)
            return "medium";
        return "low";
    }
    /**
     * Calculate performance impact
     */
    calculateImpact(metric, value, target) {
        const ratio = value / target;
        const baseImpact = Math.min(1.0, (ratio - 1) / 3); // Scale 0-1
        // Weight by metric importance
        const weights = {
            orchestration_latency: 1.0,
            routing_overhead: 0.8,
            model_latency: 0.9,
            cache_hit_rate: 0.7,
            error_rate: 1.0,
        };
        const weight = weights[metric] || 0.5;
        return baseImpact * weight;
    }
    /**
     * Get component name from metric name
     */
    getComponentFromMetric(metric) {
        if (metric.includes("orchestration"))
            return "orchestrator";
        if (metric.includes("routing"))
            return "router";
        if (metric.includes("model"))
            return "model_client";
        if (metric.includes("cache"))
            return "cache";
        if (metric.includes("auth"))
            return "authentication";
        return "unknown";
    }
    /**
     * Generate optimization recommendations
     */
    generateRecommendation(metric, stats) {
        const recommendations = {
            orchestration_latency: "Consider enabling caching, optimizing model selection, or implementing request batching",
            routing_overhead: "Optimize routing algorithm, reduce rule complexity, or implement routing cache",
            model_latency: "Switch to faster models, implement request optimization, or add model warm-up",
            cache_hit_rate: "Increase cache size, optimize cache key generation, or extend TTL values",
            error_rate: "Implement better error handling, add retries, or investigate root cause",
        };
        return (recommendations[metric] ||
            "Investigate performance degradation");
    }
    /**
     * Get performance health score (0-100)
     */
    getHealthScore() {
        let totalScore = 0;
        let metricCount = 0;
        for (const [metricName, target] of Object.entries(this.targets)) {
            const stats = this.getStats(metricName, 300000); // 5 minutes
            if (!stats)
                continue;
            let score = 100;
            // Penalize if above target
            if (stats.mean > target) {
                const penalty = ((stats.mean - target) / target) * 50;
                score = Math.max(0, score - penalty);
            }
            // Additional penalty for high variance
            const cv = stats.stddev / stats.mean;
            if (cv > 0.3) {
                score *= 1 - cv * 0.5;
            }
            totalScore += Math.max(0, score);
            metricCount++;
        }
        return metricCount > 0 ? totalScore / metricCount : 100;
    }
    /**
     * Start periodic performance analysis
     */
    startPeriodicAnalysis() {
        setInterval(() => {
            this.performHealthCheck();
        }, 60000); // Every minute
        setInterval(() => {
            this.analyzeBottlenecks();
        }, 300000); // Every 5 minutes
    }
    /**
     * Perform health check
     */
    performHealthCheck() {
        const healthScore = this.getHealthScore();
        const bottlenecksCount = this.analyzeBottlenecks().length;
        const health = {
            score: healthScore,
            status: this.getHealthStatus(healthScore),
            bottlenecks: bottlenecksCount,
            timestamp: new Date(),
        };
        this.emit("health_check", health);
        if (healthScore < 70) {
            this.logger.warn("Performance health degraded", health);
        }
    }
    /**
     * Get health status from score
     */
    getHealthStatus(score) {
        if (score >= 90)
            return "excellent";
        if (score >= 80)
            return "good";
        if (score >= 70)
            return "fair";
        if (score >= 50)
            return "poor";
        return "critical";
    }
    /**
     * Get all metrics data
     */
    getMetrics() {
        const result = {};
        for (const metricName of this.metrics.keys()) {
            const stats = this.getStats(metricName);
            if (stats) {
                result[metricName] = stats;
            }
        }
        return result;
    }
    /**
     * Clear old metrics data
     */
    clearOldMetrics(olderThan = 86400000) {
        // Default 24 hours
        const cutoff = new Date(Date.now() - olderThan);
        let clearedCount = 0;
        for (const [metricName, history] of this.metrics) {
            const filtered = history.filter((m) => m.timestamp >= cutoff);
            const removed = history.length - filtered.length;
            if (removed > 0) {
                this.metrics.set(metricName, filtered);
                clearedCount += removed;
            }
        }
        if (clearedCount > 0) {
            this.logger.info("Old metrics cleared", { clearedCount, cutoff });
        }
    }
    /**
     * Export performance data for analysis
     */
    exportData(format = "json") {
        const data = {};
        for (const [metricName, history] of this.metrics) {
            data[metricName] = {
                stats: this.getStats(metricName),
                history: history.slice(-100), // Last 100 data points
            };
        }
        if (format === "json") {
            return JSON.stringify(data, null, 2);
        }
        // Simple CSV export
        let csv = "metric,timestamp,value\n";
        for (const [metricName, history] of this.metrics) {
            for (const metric of history.slice(-100)) {
                csv += `${metricName},${metric.timestamp.toISOString()},${metric.value}\n`;
            }
        }
        return csv;
    }
    /**
     * Shutdown performance monitor and cleanup resources
     */
    shutdown() {
        this.logger.info("Shutting down PerformanceMonitor", {
            metricsCount: this.metrics.size,
            totalDataPoints: Array.from(this.metrics.values()).reduce((sum, history) => sum + history.length, 0),
        });
        // Clear intervals and listeners
        this.removeAllListeners();
        // Clear metrics data
        this.metrics.clear();
        this.alertThresholds.clear();
        this.logger.info("PerformanceMonitor shutdown completed");
    }
}
