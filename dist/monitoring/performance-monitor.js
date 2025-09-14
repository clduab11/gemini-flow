/**
 * Performance Monitor
 *
 * Monitors and tracks performance metrics for parallel operations
 */
import { Logger } from "../utils/logger.js";
export class PerformanceMonitor {
    metrics = new Map();
    logger;
    constructor() {
        this.logger = new Logger("PerformanceMonitor");
    }
    recordMetric(name, value, metadata) {
        if (!this.metrics.has(name)) {
            this.metrics.set(name, []);
        }
        this.metrics.get(name).push({
            value,
            timestamp: Date.now(),
            metadata,
        });
        // Keep only last 1000 entries per metric
        const entries = this.metrics.get(name);
        if (entries.length > 1000) {
            entries.splice(0, entries.length - 1000);
        }
    }
    getMetric(name) {
        return this.metrics.get(name) || [];
    }
    getAverageMetric(name, windowMs) {
        const entries = this.getMetric(name);
        if (entries.length === 0)
            return 0;
        let filteredEntries = entries;
        if (windowMs) {
            const cutoff = Date.now() - windowMs;
            filteredEntries = entries.filter((entry) => entry.timestamp >= cutoff);
        }
        if (filteredEntries.length === 0)
            return 0;
        const sum = filteredEntries.reduce((acc, entry) => acc + entry.value, 0);
        return sum / filteredEntries.length;
    }
    getPercentileMetric(name, percentile) {
        const entries = this.getMetric(name);
        if (entries.length === 0)
            return 0;
        const values = entries.map((entry) => entry.value).sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * values.length) - 1;
        return values[Math.max(0, index)];
    }
    clearMetrics() {
        this.metrics.clear();
    }
    getAllMetrics() {
        const result = {};
        for (const [name, entries] of this.metrics.entries()) {
            if (entries.length > 0) {
                result[name] = {
                    current: entries[entries.length - 1].value,
                    average: this.getAverageMetric(name),
                    p95: this.getPercentileMetric(name, 95),
                    p99: this.getPercentileMetric(name, 99),
                    count: entries.length,
                };
            }
        }
        return result;
    }
}
