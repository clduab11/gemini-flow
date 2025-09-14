/**
 * Custom Metrics and Monitoring Dashboard
 * Comprehensive metrics collection and visualization for Google Services integrations
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { DistributedTracing } from "./distributed-tracing.js";
interface MetricsConfig {
    collection: {
        interval: number;
        bufferSize: number;
        batchSize: number;
    };
    exporters: {
        prometheus?: {
            endpoint: string;
            port: number;
            metrics_path: string;
        };
        datadog?: {
            apiKey: string;
            site: string;
        };
        cloudwatch?: {
            region: string;
            namespace: string;
        };
        custom?: {
            endpoint: string;
            headers: Record<string, string>;
        };
    };
    dashboards: {
        grafana?: {
            url: string;
            apiKey: string;
        };
        datadog?: {
            url: string;
            apiKey: string;
        };
    };
    alerts: {
        thresholds: AlertThreshold[];
        channels: AlertChannel[];
    };
}
interface AlertThreshold {
    metric: string;
    condition: "greater_than" | "less_than" | "equals";
    value: number;
    duration: number;
    severity: "low" | "medium" | "high" | "critical";
}
interface AlertChannel {
    type: "email" | "slack" | "webhook" | "pagerduty";
    config: Record<string, any>;
}
interface CustomMetric {
    name: string;
    type: "counter" | "gauge" | "histogram" | "summary";
    value: number;
    timestamp: number;
    labels: Record<string, string>;
    unit?: string;
    description?: string;
}
interface DashboardWidget {
    id: string;
    title: string;
    type: "timeseries" | "gauge" | "table" | "heatmap" | "pie" | "bar";
    metrics: string[];
    config: {
        timeRange?: string;
        refreshInterval?: number;
        aggregation?: "avg" | "sum" | "min" | "max" | "count";
        groupBy?: string[];
        filters?: Record<string, string>;
    };
    layout: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}
interface Dashboard {
    id: string;
    title: string;
    description: string;
    tags: string[];
    widgets: DashboardWidget[];
    variables: DashboardVariable[];
    refresh: string;
    timeRange: {
        from: string;
        to: string;
    };
}
interface DashboardVariable {
    name: string;
    type: "query" | "custom" | "constant";
    query?: string;
    options?: string[];
    current?: string;
    multi?: boolean;
}
export declare class CustomMetricsCollector extends EventEmitter {
    private logger;
    private config;
    private tracing;
    private metrics;
    private metricBuffer;
    private collectionTimer?;
    private exportTimer?;
    private isRunning;
    private alertStates;
    private businessMetrics;
    constructor(config: MetricsConfig, tracing: DistributedTracing);
    /**
     * Start metrics collection
     */
    start(): Promise<void>;
    /**
     * Stop metrics collection
     */
    stop(): Promise<void>;
    /**
     * Record a custom metric
     */
    recordMetric(name: string, value: number, type?: CustomMetric["type"], labels?: Record<string, string>, unit?: string, description?: string): void;
    /**
     * Record Google AI service metrics
     */
    recordGeminiMetrics(data: {
        model: string;
        promptTokens: number;
        completionTokens: number;
        responseTime: number;
        success: boolean;
        userId?: string;
        sessionId?: string;
    }): void;
    /**
     * Record video generation metrics
     */
    recordVideoGenerationMetrics(data: {
        duration: number;
        resolution: string;
        format: string;
        fileSize: number;
        success: boolean;
        processingTime: number;
    }): void;
    /**
     * Record research pipeline metrics
     */
    recordResearchMetrics(data: {
        paperLength: number;
        citationCount: number;
        qualityScore: number;
        processingTime: number;
        stage: "hypothesis" | "literature_review" | "generation" | "review";
    }): void;
    /**
     * Record multimedia session metrics
     */
    recordMultimediaMetrics(data: {
        sessionId: string;
        streamingQuality: number;
        interactionLatency: number;
        spatialAudioEnabled: boolean;
        participantCount: number;
    }): void;
    /**
     * Record browser automation metrics
     */
    recordAutomationMetrics(data: {
        taskType: string;
        sitesProcessed: number;
        dataPointsExtracted: number;
        success: boolean;
        executionTime: number;
    }): void;
    /**
     * Record SLA compliance metrics
     */
    recordSLAMetrics(data: {
        availability: number;
        responseTime: number;
        errorRate: number;
        throughput: number;
    }): void;
    /**
     * Start system metrics collection
     */
    private startSystemMetricsCollection;
    /**
     * Collect system metrics
     */
    private collectSystemMetrics;
    /**
     * Start business metrics collection
     */
    private startBusinessMetricsCollection;
    /**
     * Collect business metrics
     */
    private collectBusinessMetrics;
    /**
     * Start metrics export
     */
    private startMetricsExport;
    /**
     * Export metrics to configured endpoints
     */
    private exportMetrics;
    /**
     * Export to Prometheus
     */
    private exportToPrometheus;
    /**
     * Export to DataDog
     */
    private exportToDatadog;
    /**
     * Export to CloudWatch
     */
    private exportToCloudWatch;
    /**
     * Export to custom endpoint
     */
    private exportToCustomEndpoint;
    /**
     * Initialize alerting
     */
    private initializeAlerting;
    /**
     * Check alerts for a metric
     */
    private checkAlerts;
    /**
     * Fire an alert
     */
    private fireAlert;
    /**
     * Send alert to channel
     */
    private sendAlert;
    private sendEmailAlert;
    private sendSlackAlert;
    private sendWebhookAlert;
    private sendPagerDutyAlert;
    /**
     * Utility methods
     */
    private calculateAverage;
    private updateSuccessRate;
    private clearMetricArrays;
    /**
     * Get current metrics summary
     */
    getMetricsSummary(): any;
}
/**
 * Dashboard Configuration Factory
 */
export declare class DashboardFactory {
    static createProductionDashboard(): Dashboard;
    static createBusinessDashboard(): Dashboard;
}
export declare const DEFAULT_METRICS_CONFIG: MetricsConfig;
export type { MetricsConfig, CustomMetric, Dashboard, DashboardWidget, AlertThreshold, };
//# sourceMappingURL=custom-metrics-dashboard.d.ts.map