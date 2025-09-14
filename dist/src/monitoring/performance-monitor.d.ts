/**
 * Performance Monitor
 *
 * Monitors and tracks performance metrics for parallel operations
 */
interface MetricData {
    value: number;
    timestamp: number;
    metadata?: any;
}
export declare class PerformanceMonitor {
    private metrics;
    private logger;
    constructor();
    recordMetric(name: string, value: number, metadata?: any): void;
    getMetric(name: string): MetricData[];
    getAverageMetric(name: string, windowMs?: number): number;
    getPercentileMetric(name: string, percentile: number): number;
    clearMetrics(): void;
    getAllMetrics(): Record<string, any>;
}
export {};
//# sourceMappingURL=performance-monitor.d.ts.map