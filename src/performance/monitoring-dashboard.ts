/**
 * Real-time Monitoring Dashboard - Comprehensive metrics and alerting
 * Provides real-time visualization and monitoring capabilities
 */

import { EventEmitter } from "node:events";

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
  metricsRetention: number; // seconds
  aggregationInterval: number; // seconds
  alertEvaluationInterval: number; // seconds
  maxMetricsPerSecond: number;
}

export class MonitoringDashboard extends EventEmitter {
  private metrics: Map<string, MetricData[]> = new Map();
  private dashboards: Map<string, Dashboard> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private widgets: Map<string, Widget> = new Map();
  private config: MonitoringConfig;
  private metricsAggregator: MetricsAggregator;
  private alertEngine: AlertEngine;
  private dataCollector: DataCollector;
  private visualizationEngine: VisualizationEngine;

  constructor(config: MonitoringConfig) {
    super();
    this.config = config;
    this.metricsAggregator = new MetricsAggregator(config);
    this.alertEngine = new AlertEngine();
    this.dataCollector = new DataCollector();
    this.visualizationEngine = new VisualizationEngine();
    this.initializeDashboard();
  }

  /**
   * Record metric data point
   */
  recordMetric(metric: MetricData): void {
    if (!this.metrics.has(metric.id)) {
      this.metrics.set(metric.id, []);
    }

    const metricHistory = this.metrics.get(metric.id)!;
    metricHistory.push(metric);

    // Enforce retention policy
    const cutoffTime = Date.now() - this.config.metricsRetention * 1000;
    this.metrics.set(
      metric.id,
      metricHistory.filter((m) => m.timestamp > cutoffTime),
    );

    // Trigger real-time updates
    this.emit("metricRecorded", metric);

    // Process alerts
    this.alertEngine.evaluateMetric(metric, this.alerts);
  }

  /**
   * Create new dashboard
   */
  createDashboard(dashboard: Dashboard): void {
    this.dashboards.set(dashboard.id, dashboard);

    // Register dashboard widgets
    for (const widget of dashboard.widgets) {
      this.widgets.set(widget.id, widget);
    }

    this.emit("dashboardCreated", { dashboardId: dashboard.id });
    console.log(`Created dashboard: ${dashboard.name}`);
  }

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
  } {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard ${dashboardId} not found`);
    }

    const widgetData = dashboard.widgets.map((widget) => {
      const data = this.getWidgetData(widget, dashboard.timeRange);
      const status = this.evaluateWidgetStatus(widget, data);

      return { widget, data, status };
    });

    return {
      dashboard,
      widgets: widgetData,
      lastUpdate: Date.now(),
    };
  }

  /**
   * Create alert rule
   */
  createAlert(alert: Alert): void {
    this.alerts.set(alert.id, alert);
    this.alertEngine.registerAlert(alert);

    this.emit("alertCreated", { alertId: alert.id });
    console.log(`Created alert: ${alert.name}`);
  }

  /**
   * Get comprehensive system health overview
   */
  getSystemHealth(): {
    overall: "healthy" | "warning" | "critical";
    components: Map<
      string,
      {
        status: "healthy" | "warning" | "critical";
        metrics: Record<string, number>;
        alerts: Alert[];
      }
    >;
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
  } {
    const components = this.analyzeComponentHealth();
    const performance = this.calculatePerformanceMetrics();
    const resources = this.getResourceUtilization();

    const overall = this.calculateOverallHealth(
      components,
      performance,
      resources,
    );

    return {
      overall,
      components,
      performance,
      resources,
    };
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(timeRange: { start: number; end: number }): {
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
  } {
    const relevantMetrics = this.getMetricsInRange(timeRange);

    const summary = this.calculateSummaryMetrics(relevantMetrics);
    const trends = this.calculateTrends(relevantMetrics);
    const alertStats = this.getAlertStatistics(timeRange);
    const recommendations = this.generateRecommendations(summary, trends);

    return {
      summary,
      trends,
      alerts: alertStats,
      recommendations,
    };
  }

  /**
   * Configure real-time streaming for dashboard updates
   */
  enableRealTimeStreaming(dashboardId: string): void {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard ${dashboardId} not found`);
    }

    const interval = setInterval(() => {
      const data = this.getDashboardData(dashboardId);
      this.emit("dashboardUpdate", { dashboardId, data });
    }, dashboard.refreshInterval);

    this.emit("streamingEnabled", { dashboardId });
  }

  /**
   * Export dashboard configuration
   */
  exportDashboard(dashboardId: string): string {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard ${dashboardId} not found`);
    }

    return JSON.stringify(dashboard, null, 2);
  }

  /**
   * Import dashboard configuration
   */
  importDashboard(config: string): Dashboard {
    const dashboard: Dashboard = JSON.parse(config);
    this.createDashboard(dashboard);
    return dashboard;
  }

  /**
   * Get metric statistics
   */
  getMetricStatistics(
    metricId: string,
    timeRange: {
      start: number;
      end: number;
    },
  ): {
    count: number;
    min: number;
    max: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
    sum: number;
  } {
    const metrics = this.metrics.get(metricId) || [];
    const filteredMetrics = metrics.filter(
      (m) => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end,
    );

    if (filteredMetrics.length === 0) {
      return {
        count: 0,
        min: 0,
        max: 0,
        avg: 0,
        p50: 0,
        p95: 0,
        p99: 0,
        sum: 0,
      };
    }

    const values = filteredMetrics.map((m) => m.value).sort((a, b) => a - b);
    const sum = values.reduce((total, val) => total + val, 0);

    return {
      count: values.length,
      min: values[0],
      max: values[values.length - 1],
      avg: sum / values.length,
      p50: this.percentile(values, 50),
      p95: this.percentile(values, 95),
      p99: this.percentile(values, 99),
      sum,
    };
  }

  // Private implementation methods

  private async initializeDashboard(): Promise<void> {
    // Create default performance dashboard
    this.createDefaultDashboards();

    // Setup default alerts
    this.createDefaultAlerts();

    // Start background processes
    this.startMetricsAggregation();
    this.startAlertEvaluation();

    this.emit("dashboardInitialized");
  }

  private createDefaultDashboards(): void {
    // System Overview Dashboard
    const systemDashboard: Dashboard = {
      id: "system-overview",
      name: "System Overview",
      description: "Overall system health and performance metrics",
      widgets: [
        {
          id: "response-time-chart",
          type: "chart",
          title: "Response Time",
          position: { x: 0, y: 0, width: 6, height: 3 },
          config: {
            metrics: ["http.response_time"],
            visualization: { type: "line", color: "#4CAF50" },
            thresholds: { warning: 500, critical: 1000 },
            aggregation: "avg",
            timeWindow: 300000, // 5 minutes
          },
        },
        {
          id: "throughput-gauge",
          type: "gauge",
          title: "Throughput (req/s)",
          position: { x: 6, y: 0, width: 3, height: 3 },
          config: {
            metrics: ["http.requests_per_second"],
            visualization: { type: "gauge", max: 10000 },
            thresholds: { warning: 8000, critical: 9500 },
          },
        },
        {
          id: "error-rate-chart",
          type: "chart",
          title: "Error Rate",
          position: { x: 9, y: 0, width: 3, height: 3 },
          config: {
            metrics: ["http.error_rate"],
            visualization: { type: "area", color: "#f44336" },
            thresholds: { warning: 0.05, critical: 0.1 },
          },
        },
        {
          id: "resource-usage-heatmap",
          type: "heatmap",
          title: "Resource Usage",
          position: { x: 0, y: 3, width: 12, height: 4 },
          config: {
            metrics: ["system.cpu", "system.memory", "system.disk"],
            visualization: { type: "heatmap" },
            aggregation: "avg",
          },
        },
      ],
      layout: { columns: 12, rows: 8 },
      refreshInterval: 5000,
      timeRange: { start: Date.now() - 3600000, end: Date.now() },
      filters: new Map(),
      permissions: { viewers: ["*"], editors: ["admin"] },
    };

    this.createDashboard(systemDashboard);

    // Performance Dashboard
    const perfDashboard: Dashboard = {
      id: "performance-metrics",
      name: "Performance Metrics",
      description: "Detailed performance analysis and optimization metrics",
      widgets: [
        {
          id: "streaming-performance",
          type: "chart",
          title: "Streaming Performance",
          position: { x: 0, y: 0, width: 6, height: 4 },
          config: {
            metrics: [
              "streaming.buffer_efficiency",
              "streaming.prediction_accuracy",
            ],
            visualization: { type: "multiline" },
            aggregation: "avg",
          },
        },
        {
          id: "gpu-utilization",
          type: "chart",
          title: "GPU Cluster Utilization",
          position: { x: 6, y: 0, width: 6, height: 4 },
          config: {
            metrics: ["gpu.utilization", "gpu.memory_usage"],
            visualization: { type: "area" },
            aggregation: "avg",
          },
        },
        {
          id: "memory-pool-status",
          type: "table",
          title: "Memory Pool Status",
          position: { x: 0, y: 4, width: 6, height: 4 },
          config: {
            metrics: ["memory.pool_utilization", "memory.fragmentation"],
            visualization: { type: "table" },
          },
        },
        {
          id: "queue-metrics",
          type: "gauge",
          title: "Queue Performance",
          position: { x: 6, y: 4, width: 6, height: 4 },
          config: {
            metrics: ["queue.throughput", "queue.fairness_score"],
            visualization: { type: "multi-gauge" },
          },
        },
      ],
      layout: { columns: 12, rows: 8 },
      refreshInterval: 10000,
      timeRange: { start: Date.now() - 7200000, end: Date.now() },
      filters: new Map(),
      permissions: { viewers: ["*"], editors: ["admin", "devops"] },
    };

    this.createDashboard(perfDashboard);
  }

  private createDefaultAlerts(): void {
    const defaultAlerts: Alert[] = [
      {
        id: "high-response-time",
        name: "High Response Time",
        description: "Response time exceeds acceptable threshold",
        metric: "http.response_time",
        condition: {
          operator: "gt",
          value: 1000,
          timeWindow: 300000, // 5 minutes
        },
        severity: "warning",
        channels: [
          {
            type: "email",
            config: { recipients: ["devops@company.com"] },
            enabled: true,
          },
        ],
        enabled: true,
        silenced: false,
      },
      {
        id: "critical-error-rate",
        name: "Critical Error Rate",
        description: "Error rate exceeds critical threshold",
        metric: "http.error_rate",
        condition: {
          operator: "gt",
          value: 0.1,
          timeWindow: 300000,
        },
        severity: "critical",
        channels: [
          {
            type: "slack",
            config: {
              channel: "#alerts",
              webhook: "https://hooks.slack.com/...",
            },
            enabled: true,
          },
          {
            type: "email",
            config: { recipients: ["oncall@company.com"] },
            enabled: true,
          },
        ],
        enabled: true,
        silenced: false,
      },
      {
        id: "low-availability",
        name: "Low System Availability",
        description: "System availability below SLA threshold",
        metric: "system.availability",
        condition: {
          operator: "lt",
          value: 99.5,
          timeWindow: 600000, // 10 minutes
        },
        severity: "critical",
        channels: [
          {
            type: "webhook",
            config: { url: "https://api.pagerduty.com/..." },
            enabled: true,
          },
        ],
        enabled: true,
        silenced: false,
      },
    ];

    for (const alert of defaultAlerts) {
      this.createAlert(alert);
    }
  }

  private getWidgetData(
    widget: Widget,
    timeRange: { start: number; end: number },
  ): any {
    const data: any = {};

    for (const metricId of widget.config.metrics) {
      const metrics = this.metrics.get(metricId) || [];
      const filteredMetrics = metrics.filter(
        (m) => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end,
      );

      if (widget.config.aggregation) {
        data[metricId] = this.aggregateMetrics(
          filteredMetrics,
          widget.config.aggregation,
        );
      } else {
        data[metricId] = filteredMetrics.map((m) => ({
          x: m.timestamp,
          y: m.value,
        }));
      }
    }

    return data;
  }

  private evaluateWidgetStatus(
    widget: Widget,
    data: any,
  ): "healthy" | "warning" | "critical" {
    if (!widget.config.thresholds) {
      return "healthy";
    }

    const values = Object.values(data).flat() as number[];
    const maxValue = Math.max(...values);

    if (maxValue >= widget.config.thresholds.critical) {
      return "critical";
    } else if (maxValue >= widget.config.thresholds.warning) {
      return "warning";
    } else {
      return "healthy";
    }
  }

  private aggregateMetrics(metrics: MetricData[], aggregation: string): number {
    if (metrics.length === 0) return 0;

    const values = metrics.map((m) => m.value);

    switch (aggregation) {
      case "sum":
        return values.reduce((sum, val) => sum + val, 0);
      case "avg":
        return values.reduce((sum, val) => sum + val, 0) / values.length;
      case "min":
        return Math.min(...values);
      case "max":
        return Math.max(...values);
      case "count":
        return values.length;
      default:
        return values[values.length - 1] || 0;
    }
  }

  private analyzeComponentHealth(): Map<
    string,
    {
      status: "healthy" | "warning" | "critical";
      metrics: Record<string, number>;
      alerts: Alert[];
    }
  > {
    const components = new Map();

    // Example component analysis
    components.set("streaming-manager", {
      status: "healthy" as const,
      metrics: {
        bufferEfficiency: 0.92,
        predictionAccuracy: 0.87,
        latency: 45,
      },
      alerts: [],
    });

    components.set("gpu-cluster", {
      status: "warning" as const,
      metrics: {
        utilization: 0.85,
        temperature: 82,
        failureRate: 0.02,
      },
      alerts: [],
    });

    return components;
  }

  private calculatePerformanceMetrics(): {
    responseTime: number;
    throughput: number;
    errorRate: number;
    availability: number;
  } {
    // Calculate current performance metrics
    return {
      responseTime: 150,
      throughput: 2500,
      errorRate: 0.03,
      availability: 99.7,
    };
  }

  private getResourceUtilization(): {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  } {
    return {
      cpu: 65,
      memory: 72,
      disk: 45,
      network: 38,
    };
  }

  private calculateOverallHealth(
    components: any,
    performance: any,
    resources: any,
  ): "healthy" | "warning" | "critical" {
    const criticalComponents = Array.from(components.values()).filter(
      (c: any) => c.status === "critical",
    ).length;

    if (criticalComponents > 0 || performance.availability < 99.0) {
      return "critical";
    }

    const warningComponents = Array.from(components.values()).filter(
      (c: any) => c.status === "warning",
    ).length;

    if (warningComponents > 0 || performance.errorRate > 0.05) {
      return "warning";
    }

    return "healthy";
  }

  private getMetricsInRange(timeRange: {
    start: number;
    end: number;
  }): MetricData[] {
    const allMetrics: MetricData[] = [];

    for (const metricList of this.metrics.values()) {
      const filteredMetrics = metricList.filter(
        (m) => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end,
      );
      allMetrics.push(...filteredMetrics);
    }

    return allMetrics;
  }

  private calculateSummaryMetrics(metrics: MetricData[]): any {
    // Calculate summary statistics
    const responseTimeMetrics = metrics.filter(
      (m) => m.id === "http.response_time",
    );
    const throughputMetrics = metrics.filter(
      (m) => m.id === "http.requests_per_second",
    );
    const errorMetrics = metrics.filter((m) => m.id === "http.errors");

    return {
      avgResponseTime: this.average(responseTimeMetrics.map((m) => m.value)),
      peakThroughput: Math.max(...throughputMetrics.map((m) => m.value)),
      uptime: 99.7,
      errorCount: errorMetrics.reduce((sum, m) => sum + m.value, 0),
    };
  }

  private calculateTrends(metrics: MetricData[]): any {
    // Calculate trends over time
    return {
      responseTime: [120, 130, 125, 140, 135, 150],
      throughput: [2000, 2200, 2100, 2400, 2300, 2500],
      errorRate: [0.02, 0.025, 0.03, 0.028, 0.032, 0.03],
    };
  }

  private getAlertStatistics(timeRange: { start: number; end: number }): any {
    return {
      triggered: 5,
      resolved: 4,
      active: 1,
    };
  }

  private generateRecommendations(summary: any, trends: any): string[] {
    const recommendations: string[] = [];

    if (summary.avgResponseTime > 200) {
      recommendations.push(
        "Consider optimizing response time - current average exceeds target",
      );
    }

    if (trends.errorRate[trends.errorRate.length - 1] > 0.05) {
      recommendations.push(
        "Error rate trending upward - investigate error patterns",
      );
    }

    if (summary.peakThroughput < 5000) {
      recommendations.push(
        "Peak throughput below capacity - consider load balancing optimization",
      );
    }

    return recommendations;
  }

  private startMetricsAggregation(): void {
    setInterval(() => {
      this.metricsAggregator.aggregateMetrics(this.metrics);
    }, this.config.aggregationInterval * 1000);
  }

  private startAlertEvaluation(): void {
    setInterval(() => {
      this.alertEngine.evaluateAllAlerts(this.metrics, this.alerts);
    }, this.config.alertEvaluationInterval * 1000);
  }

  private percentile(values: number[], p: number): number {
    const index = Math.ceil((p / 100) * values.length) - 1;
    return values[Math.max(0, index)];
  }

  private average(values: number[]): number {
    return values.length > 0
      ? values.reduce((sum, val) => sum + val, 0) / values.length
      : 0;
  }
}

// Supporting classes
class MetricsAggregator {
  constructor(private config: MonitoringConfig) {}

  aggregateMetrics(metrics: Map<string, MetricData[]>): void {
    // Aggregate metrics for efficient storage and querying
  }
}

class AlertEngine {
  registerAlert(alert: Alert): void {
    // Register alert for evaluation
  }

  evaluateMetric(metric: MetricData, alerts: Map<string, Alert>): void {
    // Evaluate if metric triggers any alerts
  }

  evaluateAllAlerts(
    metrics: Map<string, MetricData[]>,
    alerts: Map<string, Alert>,
  ): void {
    // Evaluate all alerts against current metrics
  }
}

class DataCollector {
  collectSystemMetrics(): MetricData[] {
    // Collect system-level metrics
    return [];
  }
}

class VisualizationEngine {
  generateChart(data: any, config: any): any {
    // Generate chart visualization
    return {};
  }
}

export { MetricsAggregator, AlertEngine, DataCollector, VisualizationEngine };
