/**
 * Real-time Monitoring Dashboard - Comprehensive metrics and alerting
 * Provides real-time visualization and monitoring capabilities
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
export interface MetricData {
    id: string;
    name: string;
    value: number;
    unit: string;
    timestamp: number;
    tags: Map<string, string>;
    metadata: {
        source: string;
        type: "gauge" | "counter" | "histogram" | "summary";
        description?: string;
    };
}
export interface Dashboard {
    id: string;
    name: string;
    description: string;
    widgets: Widget[];
    layout: {
        columns: number;
        rows: number;
    };
    refreshInterval: number;
    timeRange: {
        start: number;
        end: number;
    };
    filters: Map<string, string>;
    permissions: {
        viewers: string[];
        editors: string[];
    };
}
export interface Widget {
    id: string;
    type: "chart" | "gauge" | "table" | "alert" | "text" | "heatmap";
    title: string;
    position: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    config: {
        metrics: string[];
        visualization: any;
        thresholds?: {
            warning: number;
            critical: number;
        };
        aggregation?: "sum" | "avg" | "min" | "max" | "count";
        timeWindow?: number;
    };
}
export interface Alert {
    id: string;
    name: string;
    description: string;
    metric: string;
    condition: {
        operator: "gt" | "lt" | "eq" | "gte" | "lte";
        value: number;
        timeWindow: number;
    };
    severity: "info" | "warning" | "critical";
    channels: AlertChannel[];
    enabled: boolean;
    silenced: boolean;
    lastTriggered?: number;
}
export interface AlertChannel {
    type: "email" | "slack" | "webhook" | "sms";
    config: Record<string, any>;
    enabled: boolean;
}
export interface MonitoringConfig {
    metricsRetention: number;
    aggregationInterval: number;
    alertEvaluationInterval: number;
    maxMetricsPerSecond: number;
}
export declare class MonitoringDashboard extends EventEmitter {
    private metrics;
    private dashboards;
    private alerts;
    private widgets;
    private config;
    private metricsAggregator;
    private alertEngine;
    private dataCollector;
    private visualizationEngine;
    constructor(config: MonitoringConfig);
    /**
     * Record metric data point
     */
    recordMetric(metric: MetricData): void;
    /**
     * Create new dashboard
     */
    createDashboard(dashboard: Dashboard): void;
    /**
     * Get dashboard data with real-time metrics
     */
    getDashboardData(dashboardId: string): {
        dashboard: Dashboard;
        widgets: Array<{
            widget: Widget;
            data: any;
            status: "healthy" | "warning" | "critical";
        }>;
        lastUpdate: number;
    };
    /**
     * Create alert rule
     */
    createAlert(alert: Alert): void;
    /**
     * Get comprehensive system health overview
     */
    getSystemHealth(): {
        overall: "healthy" | "warning" | "critical";
        components: Map<string, {
            status: "healthy" | "warning" | "critical";
            metrics: Record<string, number>;
            alerts: Alert[];
        }>;
        performance: {
            responseTime: number;
            throughput: number;
            errorRate: number;
            availability: number;
        };
        resources: {
            cpu: number;
            memory: number;
            disk: number;
            network: number;
        };
    };
    /**
     * Generate performance report
     */
    generatePerformanceReport(timeRange: {
        start: number;
        end: number;
    }): {
        summary: {
            avgResponseTime: number;
            peakThroughput: number;
            uptime: number;
            errorCount: number;
        };
        trends: {
            responseTime: number[];
            throughput: number[];
            errorRate: number[];
        };
        alerts: {
            triggered: number;
            resolved: number;
            active: number;
        };
        recommendations: string[];
    };
    /**
     * Configure real-time streaming for dashboard updates
     */
    enableRealTimeStreaming(dashboardId: string): void;
    /**
     * Export dashboard configuration
     */
    exportDashboard(dashboardId: string): string;
    /**
     * Import dashboard configuration
     */
    importDashboard(config: string): Dashboard;
    /**
     * Get metric statistics
     */
    getMetricStatistics(metricId: string, timeRange: {
        start: number;
        end: number;
    }): {
        count: number;
        min: number;
        max: number;
        avg: number;
        p50: number;
        p95: number;
        p99: number;
        sum: number;
    };
    private initializeDashboard;
    private createDefaultDashboards;
    private createDefaultAlerts;
    private getWidgetData;
    private evaluateWidgetStatus;
    private aggregateMetrics;
    private analyzeComponentHealth;
    private calculatePerformanceMetrics;
    private getResourceUtilization;
    private calculateOverallHealth;
    private getMetricsInRange;
    private calculateSummaryMetrics;
    private calculateTrends;
    private getAlertStatistics;
    private generateRecommendations;
    private startMetricsAggregation;
    private startAlertEvaluation;
    private percentile;
    private average;
}
declare class MetricsAggregator {
    private config;
    constructor(config: MonitoringConfig);
    aggregateMetrics(metrics: Map<string, MetricData[]>): void;
}
declare class AlertEngine {
    registerAlert(alert: Alert): void;
    evaluateMetric(metric: MetricData, alerts: Map<string, Alert>): void;
    evaluateAllAlerts(metrics: Map<string, MetricData[]>, alerts: Map<string, Alert>): void;
}
declare class DataCollector {
    collectSystemMetrics(): MetricData[];
}
declare class VisualizationEngine {
    generateChart(data: any, config: any): any;
}
export { MetricsAggregator, AlertEngine, DataCollector, VisualizationEngine };
//# sourceMappingURL=monitoring-dashboard.d.ts.map