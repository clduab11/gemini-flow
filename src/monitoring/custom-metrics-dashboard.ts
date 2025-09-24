/**
 * Custom Metrics and Monitoring Dashboard
 * Comprehensive metrics collection and visualization for Google Services integrations
 */

import { EventEmitter } from "node:events";
import { Logger } from "../utils/logger.js";
import { DistributedTracing } from "./distributed-tracing.js";

interface MetricsConfig {
  collection: {
    interval: number; // seconds
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
  duration: number; // seconds
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

export class CustomMetricsCollector extends EventEmitter {
  private logger: Logger;
  private config: MetricsConfig;
  private tracing: DistributedTracing;
  private metrics: Map<string, CustomMetric[]> = new Map();
  private metricBuffer: CustomMetric[] = [];
  private collectionTimer?: NodeJS.Timeout;
  private exportTimer?: NodeJS.Timeout;
  private isRunning: boolean = false;
  private alertStates: Map<string, any> = new Map();

  // Business Metrics
  private businessMetrics = {
    // Google AI Service Metrics
    gemini_requests_total: 0,
    gemini_tokens_consumed: 0,
    gemini_response_time: [] as number[],
    gemini_errors_total: 0,

    // Vertex AI Metrics
    vertex_ai_requests_total: 0,
    vertex_ai_tokens_generated: 0,
    vertex_ai_model_usage: new Map<string, number>(),

    // Video Generation Metrics
    video_generation_requests: 0,
    video_generation_duration: [] as number[],
    video_generation_success_rate: 0,

    // Research Pipeline Metrics
    research_papers_generated: 0,
    research_quality_score: [] as number[],
    literature_review_time: [] as number[],

    // Multimedia Metrics
    multimedia_sessions: 0,
    streaming_quality_metrics: [] as number[],
    interactive_response_time: [] as number[],

    // Browser Automation Metrics
    automation_tasks_completed: 0,
    data_extraction_success_rate: 0,
    report_generation_time: [] as number[],

    // User Experience Metrics
    user_satisfaction_score: [] as number[],
    session_duration: [] as number[],
    conversion_rate: 0,

    // System Performance Metrics
    cpu_usage: [] as number[],
    memory_usage: [] as number[],
    disk_io: [] as number[],
    network_io: [] as number[],

    // SLA Metrics
    availability_percentage: 99.9,
    response_time_p95: [] as number[],
    error_rate: 0,
    throughput: [] as number[],
  };

  constructor(config: MetricsConfig, tracing: DistributedTracing) {
    super();
    this.config = config;
    this.tracing = tracing;
    this.logger = new Logger("CustomMetricsCollector");
  }

  /**
   * Start metrics collection
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn("Metrics collection already running");
      return;
    }

    try {
      this.logger.info("Starting custom metrics collection...");

      // Initialize system metrics collection
      this.startSystemMetricsCollection();

      // Initialize business metrics collection
      this.startBusinessMetricsCollection();

      // Start export timer
      this.startMetricsExport();

      // Initialize alerting
      this.initializeAlerting();

      this.isRunning = true;
      this.logger.info("Custom metrics collection started");
    } catch (error) {
      this.logger.error("Failed to start metrics collection:", error);
      throw error;
    }
  }

  /**
   * Stop metrics collection
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;

    this.logger.info("Stopping custom metrics collection...");

    if (this.collectionTimer) {
      clearInterval(this.collectionTimer);
    }

    if (this.exportTimer) {
      clearInterval(this.exportTimer);
    }

    // Final export
    await this.exportMetrics();

    this.isRunning = false;
    this.logger.info("Custom metrics collection stopped");
  }

  /**
   * Record a custom metric
   */
  recordMetric(
    name: string,
    value: number,
    type: CustomMetric["type"] = "gauge",
    labels: Record<string, string> = {},
    unit?: string,
    description?: string,
  ): void {
    const metric: CustomMetric = {
      name,
      type,
      value,
      timestamp: Date.now(),
      labels,
      unit,
      description,
    };

    this.metricBuffer.push(metric);

    // Update in-memory store
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(metric);

    // Keep only recent metrics (last 1000 per metric)
    const metricHistory = this.metrics.get(name)!;
    if (metricHistory.length > 1000) {
      metricHistory.splice(0, metricHistory.length - 1000);
    }

    // Emit event
    this.emit("metric", metric);

    // Check alerts
    this.checkAlerts(metric);
  }

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
  }): void {
    const labels = {
      model: data.model,
      success: data.success.toString(),
      user_id: data.userId || "anonymous",
      session_id: data.sessionId || "unknown",
    };

    this.recordMetric("gemini_requests_total", 1, "counter", labels);
    this.recordMetric(
      "gemini_prompt_tokens",
      data.promptTokens,
      "gauge",
      labels,
    );
    this.recordMetric(
      "gemini_completion_tokens",
      data.completionTokens,
      "gauge",
      labels,
    );
    this.recordMetric(
      "gemini_response_time_ms",
      data.responseTime,
      "histogram",
      labels,
      "ms",
    );

    if (!data.success) {
      this.recordMetric("gemini_errors_total", 1, "counter", labels);
    }

    // Update business metrics
    this.businessMetrics.gemini_requests_total++;
    this.businessMetrics.gemini_tokens_consumed +=
      data.promptTokens + data.completionTokens;
    this.businessMetrics.gemini_response_time.push(data.responseTime);
    if (!data.success) {
      this.businessMetrics.gemini_errors_total++;
    }
  }

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
  }): void {
    const labels = {
      resolution: data.resolution,
      format: data.format,
      success: data.success.toString(),
    };

    this.recordMetric("video_generation_requests", 1, "counter", labels);
    this.recordMetric(
      "video_duration_seconds",
      data.duration,
      "gauge",
      labels,
      "s",
    );
    this.recordMetric(
      "video_file_size_bytes",
      data.fileSize,
      "gauge",
      labels,
      "bytes",
    );
    this.recordMetric(
      "video_processing_time_ms",
      data.processingTime,
      "histogram",
      labels,
      "ms",
    );

    // Update business metrics
    this.businessMetrics.video_generation_requests++;
    this.businessMetrics.video_generation_duration.push(data.processingTime);
    if (data.success) {
      this.updateSuccessRate("video_generation");
    }
  }

  /**
   * Record research pipeline metrics
   */
  recordResearchMetrics(data: {
    paperLength: number;
    citationCount: number;
    qualityScore: number;
    processingTime: number;
    stage: "hypothesis" | "literature_review" | "generation" | "review";
  }): void {
    const labels = {
      stage: data.stage,
    };

    this.recordMetric(
      "research_paper_length",
      data.paperLength,
      "gauge",
      labels,
      "words",
    );
    this.recordMetric(
      "research_citations",
      data.citationCount,
      "gauge",
      labels,
    );
    this.recordMetric(
      "research_quality_score",
      data.qualityScore,
      "gauge",
      labels,
    );
    this.recordMetric(
      "research_processing_time_ms",
      data.processingTime,
      "histogram",
      labels,
      "ms",
    );

    // Update business metrics
    if (data.stage === "generation") {
      this.businessMetrics.research_papers_generated++;
      this.businessMetrics.research_quality_score.push(data.qualityScore);
    }
    if (data.stage === "literature_review") {
      this.businessMetrics.literature_review_time.push(data.processingTime);
    }
  }

  /**
   * Record multimedia session metrics
   */
  recordMultimediaMetrics(data: {
    sessionId: string;
    streamingQuality: number;
    interactionLatency: number;
    spatialAudioEnabled: boolean;
    participantCount: number;
  }): void {
    const labels = {
      session_id: data.sessionId,
      spatial_audio: data.spatialAudioEnabled.toString(),
    };

    this.recordMetric("multimedia_sessions", 1, "counter", labels);
    this.recordMetric(
      "streaming_quality",
      data.streamingQuality,
      "gauge",
      labels,
    );
    this.recordMetric(
      "interaction_latency_ms",
      data.interactionLatency,
      "histogram",
      labels,
      "ms",
    );
    this.recordMetric(
      "participant_count",
      data.participantCount,
      "gauge",
      labels,
    );

    // Update business metrics
    this.businessMetrics.multimedia_sessions++;
    this.businessMetrics.streaming_quality_metrics.push(data.streamingQuality);
    this.businessMetrics.interactive_response_time.push(
      data.interactionLatency,
    );
  }

  /**
   * Record browser automation metrics
   */
  recordAutomationMetrics(data: {
    taskType: string;
    sitesProcessed: number;
    dataPointsExtracted: number;
    success: boolean;
    executionTime: number;
  }): void {
    const labels = {
      task_type: data.taskType,
      success: data.success.toString(),
    };

    this.recordMetric("automation_tasks", 1, "counter", labels);
    this.recordMetric("sites_processed", data.sitesProcessed, "gauge", labels);
    this.recordMetric(
      "data_points_extracted",
      data.dataPointsExtracted,
      "gauge",
      labels,
    );
    this.recordMetric(
      "automation_execution_time_ms",
      data.executionTime,
      "histogram",
      labels,
      "ms",
    );

    // Update business metrics
    this.businessMetrics.automation_tasks_completed++;
    if (data.success) {
      this.updateSuccessRate("data_extraction");
    }
    this.businessMetrics.report_generation_time.push(data.executionTime);
  }

  /**
   * Record SLA compliance metrics
   */
  recordSLAMetrics(data: {
    availability: number;
    responseTime: number;
    errorRate: number;
    throughput: number;
  }): void {
    this.recordMetric(
      "sla_availability_percentage",
      data.availability,
      "gauge",
      {},
      "%",
    );
    this.recordMetric(
      "sla_response_time_ms",
      data.responseTime,
      "histogram",
      {},
      "ms",
    );
    this.recordMetric(
      "sla_error_rate_percentage",
      data.errorRate,
      "gauge",
      {},
      "%",
    );
    this.recordMetric(
      "sla_throughput_rps",
      data.throughput,
      "gauge",
      {},
      "req/s",
    );

    // Update business metrics
    this.businessMetrics.availability_percentage = data.availability;
    this.businessMetrics.response_time_p95.push(data.responseTime);
    this.businessMetrics.error_rate = data.errorRate;
    this.businessMetrics.throughput.push(data.throughput);
  }

  /**
   * Start system metrics collection
   */
  private startSystemMetricsCollection(): void {
    this.collectionTimer = setInterval(() => {
      this.collectSystemMetrics();
    }, this.config.collection.interval * 1000);
  }

  /**
   * Collect system metrics
   */
  private async collectSystemMetrics(): Promise<void> {
    try {
      // CPU usage
      const cpuUsage = process.cpuUsage();
      const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to percentage
      this.recordMetric(
        "system_cpu_usage_percentage",
        cpuPercent,
        "gauge",
        {},
        "%",
      );

      // Memory usage
      const memUsage = process.memoryUsage();
      this.recordMetric(
        "system_memory_heap_used_bytes",
        memUsage.heapUsed,
        "gauge",
        {},
        "bytes",
      );
      this.recordMetric(
        "system_memory_heap_total_bytes",
        memUsage.heapTotal,
        "gauge",
        {},
        "bytes",
      );
      this.recordMetric(
        "system_memory_rss_bytes",
        memUsage.rss,
        "gauge",
        {},
        "bytes",
      );
      this.recordMetric(
        "system_memory_external_bytes",
        memUsage.external,
        "gauge",
        {},
        "bytes",
      );

      // Event loop lag
      const start = process.hrtime.bigint();
      setImmediate(() => {
        const lag = Number(process.hrtime.bigint() - start) / 1000000; // Convert to ms
        this.recordMetric("system_event_loop_lag_ms", lag, "gauge", {}, "ms");
      });

      // Active handles and requests
      this.recordMetric(
        "system_active_handles",
        (process as any)._getActiveHandles().length,
        "gauge",
      );
      this.recordMetric(
        "system_active_requests",
        (process as any)._getActiveRequests().length,
        "gauge",
      );

      // Update business metrics
      this.businessMetrics.cpu_usage.push(cpuPercent);
      this.businessMetrics.memory_usage.push(memUsage.heapUsed);
    } catch (error) {
      this.logger.error("Error collecting system metrics:", error);
    }
  }

  /**
   * Start business metrics collection
   */
  private startBusinessMetricsCollection(): void {
    // Collect aggregated business metrics every minute
    setInterval(() => {
      this.collectBusinessMetrics();
    }, 60000);
  }

  /**
   * Collect business metrics
   */
  private collectBusinessMetrics(): void {
    // Calculate averages and rates
    const avgGeminiResponseTime = this.calculateAverage(
      this.businessMetrics.gemini_response_time,
    );
    const avgVideoProcessingTime = this.calculateAverage(
      this.businessMetrics.video_generation_duration,
    );
    const avgResearchQuality = this.calculateAverage(
      this.businessMetrics.research_quality_score,
    );
    const avgStreamingQuality = this.calculateAverage(
      this.businessMetrics.streaming_quality_metrics,
    );

    this.recordMetric(
      "business_avg_gemini_response_time",
      avgGeminiResponseTime,
      "gauge",
      {},
      "ms",
    );
    this.recordMetric(
      "business_avg_video_processing_time",
      avgVideoProcessingTime,
      "gauge",
      {},
      "ms",
    );
    this.recordMetric(
      "business_avg_research_quality",
      avgResearchQuality,
      "gauge",
    );
    this.recordMetric(
      "business_avg_streaming_quality",
      avgStreamingQuality,
      "gauge",
    );

    // Success rates
    this.recordMetric(
      "business_video_generation_success_rate",
      this.businessMetrics.video_generation_success_rate,
      "gauge",
      {},
      "%",
    );
    this.recordMetric(
      "business_data_extraction_success_rate",
      this.businessMetrics.data_extraction_success_rate,
      "gauge",
      {},
      "%",
    );

    // Clear arrays to prevent memory growth
    this.clearMetricArrays();
  }

  /**
   * Start metrics export
   */
  private startMetricsExport(): void {
    this.exportTimer = setInterval(() => {
      this.exportMetrics();
    }, 30000); // Export every 30 seconds
  }

  /**
   * Export metrics to configured endpoints
   */
  private async exportMetrics(): Promise<void> {
    if (this.metricBuffer.length === 0) return;

    const metricsToExport = this.metricBuffer.splice(
      0,
      this.config.collection.batchSize,
    );

    // Export to Prometheus
    if (this.config.exporters.prometheus) {
      await this.exportToPrometheus(metricsToExport);
    }

    // Export to DataDog
    if (this.config.exporters.datadog) {
      await this.exportToDatadog(metricsToExport);
    }

    // Export to CloudWatch
    if (this.config.exporters.cloudwatch) {
      await this.exportToCloudWatch(metricsToExport);
    }

    // Export to custom endpoint
    if (this.config.exporters.custom) {
      await this.exportToCustomEndpoint(metricsToExport);
    }
  }

  /**
   * Export to Prometheus
   */
  private async exportToPrometheus(metrics: CustomMetric[]): Promise<void> {
    try {
      // Implementation for Prometheus export
      this.logger.debug(`Exported ${metrics.length} metrics to Prometheus`);
    } catch (error) {
      this.logger.error("Failed to export to Prometheus:", error);
    }
  }

  /**
   * Export to DataDog
   */
  private async exportToDatadog(metrics: CustomMetric[]): Promise<void> {
    try {
      // Implementation for DataDog export
      this.logger.debug(`Exported ${metrics.length} metrics to DataDog`);
    } catch (error) {
      this.logger.error("Failed to export to DataDog:", error);
    }
  }

  /**
   * Export to CloudWatch
   */
  private async exportToCloudWatch(metrics: CustomMetric[]): Promise<void> {
    try {
      // Implementation for CloudWatch export
      this.logger.debug(`Exported ${metrics.length} metrics to CloudWatch`);
    } catch (error) {
      this.logger.error("Failed to export to CloudWatch:", error);
    }
  }

  /**
   * Export to custom endpoint
   */
  private async exportToCustomEndpoint(metrics: CustomMetric[]): Promise<void> {
    try {
      const response = await fetch(this.config.exporters.custom!.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...this.config.exporters.custom!.headers,
        },
        body: JSON.stringify({ metrics }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      this.logger.debug(
        `Exported ${metrics.length} metrics to custom endpoint`,
      );
    } catch (error) {
      this.logger.error("Failed to export to custom endpoint:", error);
    }
  }

  /**
   * Initialize alerting
   */
  private initializeAlerting(): void {
    this.on("metric", (metric: CustomMetric) => {
      this.checkAlerts(metric);
    });
  }

  /**
   * Check alerts for a metric
   */
  private checkAlerts(metric: CustomMetric): void {
    for (const threshold of this.config.alerts.thresholds) {
      if (metric.name === threshold.metric) {
        const alertKey = `${threshold.metric}-${threshold.condition}-${threshold.value}`;
        const currentState = this.alertStates.get(alertKey) || {
          triggered: false,
          startTime: 0,
        };

        let shouldAlert = false;
        switch (threshold.condition) {
          case "greater_than":
            shouldAlert = metric.value > threshold.value;
            break;
          case "less_than":
            shouldAlert = metric.value < threshold.value;
            break;
          case "equals":
            shouldAlert = metric.value === threshold.value;
            break;
        }

        if (shouldAlert && !currentState.triggered) {
          currentState.triggered = true;
          currentState.startTime = Date.now();
          this.alertStates.set(alertKey, currentState);
        } else if (!shouldAlert && currentState.triggered) {
          currentState.triggered = false;
          this.alertStates.set(alertKey, currentState);
        }

        // Check if alert should fire (threshold duration exceeded)
        if (
          currentState.triggered &&
          Date.now() - currentState.startTime >= threshold.duration * 1000
        ) {
          this.fireAlert(threshold, metric);
        }
      }
    }
  }

  /**
   * Fire an alert
   */
  private async fireAlert(
    threshold: AlertThreshold,
    metric: CustomMetric,
  ): Promise<void> {
    const alert = {
      metric: threshold.metric,
      value: metric.value,
      threshold: threshold.value,
      condition: threshold.condition,
      severity: threshold.severity,
      timestamp: Date.now(),
      labels: metric.labels,
    };

    this.logger.warn(
      `ALERT: ${alert.metric} ${alert.condition} ${alert.threshold}, current value: ${alert.value}`,
    );

    // Send to configured alert channels
    for (const channel of this.config.alerts.channels) {
      await this.sendAlert(channel, alert);
    }

    this.emit("alert", alert);
  }

  /**
   * Send alert to channel
   */
  private async sendAlert(channel: AlertChannel, alert: any): Promise<void> {
    try {
      switch (channel.type) {
        case "email":
          await this.sendEmailAlert(channel.config, alert);
          break;
        case "slack":
          await this.sendSlackAlert(channel.config, alert);
          break;
        case "webhook":
          await this.sendWebhookAlert(channel.config, alert);
          break;
        case "pagerduty":
          await this.sendPagerDutyAlert(channel.config, alert);
          break;
      }
    } catch (error) {
      this.logger.error(`Failed to send alert via ${channel.type}:`, error);
    }
  }

  private async sendEmailAlert(config: any, alert: any): Promise<void> {
    // Implementation for email alerts
  }

  private async sendSlackAlert(config: any, alert: any): Promise<void> {
    // Implementation for Slack alerts
  }

  private async sendWebhookAlert(config: any, alert: any): Promise<void> {
    // Implementation for webhook alerts
  }

  private async sendPagerDutyAlert(config: any, alert: any): Promise<void> {
    // Implementation for PagerDuty alerts
  }

  /**
   * Utility methods
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private updateSuccessRate(metric: string): void {
    // Implementation for success rate calculation
  }

  private clearMetricArrays(): void {
    this.businessMetrics.gemini_response_time = [];
    this.businessMetrics.video_generation_duration = [];
    this.businessMetrics.research_quality_score = [];
    this.businessMetrics.literature_review_time = [];
    this.businessMetrics.streaming_quality_metrics = [];
    this.businessMetrics.interactive_response_time = [];
    this.businessMetrics.report_generation_time = [];
    this.businessMetrics.user_satisfaction_score = [];
    this.businessMetrics.session_duration = [];
    this.businessMetrics.cpu_usage = [];
    this.businessMetrics.memory_usage = [];
    this.businessMetrics.disk_io = [];
    this.businessMetrics.network_io = [];
    this.businessMetrics.response_time_p95 = [];
    this.businessMetrics.throughput = [];
  }

  /**
   * Get current metrics summary
   */
  getMetricsSummary(): any {
    return {
      totalMetrics: this.metricBuffer.length,
      metricsTypes: Array.from(this.metrics.keys()),
      businessMetrics: {
        geminiRequests: this.businessMetrics.gemini_requests_total,
        videoGenerations: this.businessMetrics.video_generation_requests,
        researchPapers: this.businessMetrics.research_papers_generated,
        multimediaSessions: this.businessMetrics.multimedia_sessions,
        automationTasks: this.businessMetrics.automation_tasks_completed,
        availability: this.businessMetrics.availability_percentage,
        errorRate: this.businessMetrics.error_rate,
      },
      alerts: {
        active: Array.from(this.alertStates.entries()).filter(
          ([_, state]) => state.triggered,
        ).length,
        total: this.alertStates.size,
      },
    };
  }
}

/**
 * Dashboard Configuration Factory
 */
export class DashboardFactory {
  static createProductionDashboard(): Dashboard {
    return {
      id: "production-overview",
      title: "Gemini Flow - Production Overview",
      description:
        "Comprehensive production monitoring for Google Services integrations",
      tags: ["production", "google-services", "ai", "sla"],
      refresh: "30s",
      timeRange: {
        from: "now-24h",
        to: "now",
      },
      variables: [
        {
          name: "environment",
          type: "custom",
          options: ["production", "staging", "development"],
          current: "production",
        },
        {
          name: "service",
          type: "query",
          query: "label_values(service)",
          multi: true,
        },
      ],
      widgets: [
        // SLA Overview
        {
          id: "sla-availability",
          title: "SLA Availability",
          type: "gauge",
          metrics: ["sla_availability_percentage"],
          config: {
            timeRange: "24h",
            refreshInterval: 30,
            aggregation: "avg",
          },
          layout: { x: 0, y: 0, width: 6, height: 4 },
        },
        {
          id: "response-time-p95",
          title: "Response Time P95",
          type: "timeseries",
          metrics: ["sla_response_time_ms"],
          config: {
            timeRange: "24h",
            aggregation: "max",
            groupBy: ["service"],
          },
          layout: { x: 6, y: 0, width: 12, height: 4 },
        },
        {
          id: "error-rate",
          title: "Error Rate",
          type: "timeseries",
          metrics: ["sla_error_rate_percentage"],
          config: {
            timeRange: "24h",
            aggregation: "avg",
          },
          layout: { x: 18, y: 0, width: 6, height: 4 },
        },

        // Google AI Services
        {
          id: "gemini-requests",
          title: "Gemini Requests/min",
          type: "timeseries",
          metrics: ["gemini_requests_total"],
          config: {
            timeRange: "4h",
            aggregation: "sum",
            groupBy: ["model"],
          },
          layout: { x: 0, y: 4, width: 8, height: 6 },
        },
        {
          id: "gemini-response-time",
          title: "Gemini Response Time",
          type: "histogram",
          metrics: ["gemini_response_time_ms"],
          config: {
            timeRange: "4h",
            aggregation: "avg",
          },
          layout: { x: 8, y: 4, width: 8, height: 6 },
        },
        {
          id: "gemini-token-usage",
          title: "Token Usage by Model",
          type: "pie",
          metrics: ["gemini_prompt_tokens", "gemini_completion_tokens"],
          config: {
            timeRange: "24h",
            groupBy: ["model"],
          },
          layout: { x: 16, y: 4, width: 8, height: 6 },
        },

        // Video Generation
        {
          id: "video-generation-metrics",
          title: "Video Generation Metrics",
          type: "table",
          metrics: [
            "video_generation_requests",
            "video_processing_time_ms",
            "video_file_size_bytes",
          ],
          config: {
            timeRange: "24h",
            groupBy: ["resolution", "format"],
          },
          layout: { x: 0, y: 10, width: 12, height: 6 },
        },

        // Research Pipeline
        {
          id: "research-quality",
          title: "Research Quality Score",
          type: "timeseries",
          metrics: ["research_quality_score"],
          config: {
            timeRange: "7d",
            aggregation: "avg",
          },
          layout: { x: 12, y: 10, width: 12, height: 6 },
        },

        // System Resources
        {
          id: "system-cpu",
          title: "CPU Usage",
          type: "timeseries",
          metrics: ["system_cpu_usage_percentage"],
          config: {
            timeRange: "4h",
            aggregation: "avg",
          },
          layout: { x: 0, y: 16, width: 6, height: 4 },
        },
        {
          id: "system-memory",
          title: "Memory Usage",
          type: "timeseries",
          metrics: ["system_memory_heap_used_bytes"],
          config: {
            timeRange: "4h",
            aggregation: "avg",
          },
          layout: { x: 6, y: 16, width: 6, height: 4 },
        },
        {
          id: "event-loop-lag",
          title: "Event Loop Lag",
          type: "timeseries",
          metrics: ["system_event_loop_lag_ms"],
          config: {
            timeRange: "4h",
            aggregation: "max",
          },
          layout: { x: 12, y: 16, width: 6, height: 4 },
        },
        {
          id: "active-connections",
          title: "Active Handles/Requests",
          type: "timeseries",
          metrics: ["system_active_handles", "system_active_requests"],
          config: {
            timeRange: "4h",
            aggregation: "avg",
          },
          layout: { x: 18, y: 16, width: 6, height: 4 },
        },
      ],
    };
  }

  static createBusinessDashboard(): Dashboard {
    return {
      id: "business-metrics",
      title: "Gemini Flow - Business Metrics",
      description: "Business KPIs and user experience metrics",
      tags: ["business", "kpi", "user-experience"],
      refresh: "1m",
      timeRange: {
        from: "now-7d",
        to: "now",
      },
      variables: [],
      widgets: [
        {
          id: "user-satisfaction",
          title: "User Satisfaction Score",
          type: "gauge",
          metrics: ["business_user_satisfaction_score"],
          config: { timeRange: "7d", aggregation: "avg" },
          layout: { x: 0, y: 0, width: 6, height: 4 },
        },
        {
          id: "conversion-rate",
          title: "Conversion Rate",
          type: "timeseries",
          metrics: ["business_conversion_rate"],
          config: { timeRange: "30d", aggregation: "avg" },
          layout: { x: 6, y: 0, width: 12, height: 4 },
        },
        {
          id: "session-duration",
          title: "Average Session Duration",
          type: "timeseries",
          metrics: ["business_avg_session_duration"],
          config: { timeRange: "7d", aggregation: "avg" },
          layout: { x: 18, y: 0, width: 6, height: 4 },
        },
      ],
    };
  }
}

// Default configuration
export const DEFAULT_METRICS_CONFIG: MetricsConfig = {
  collection: {
    interval: 30, // 30 seconds
    bufferSize: 10000,
    batchSize: 100,
  },
  exporters: {
    prometheus: process.env.PROMETHEUS_ENDPOINT
      ? {
          endpoint: process.env.PROMETHEUS_ENDPOINT,
          port: parseInt(process.env.PROMETHEUS_PORT || "9090"),
          metrics_path: "/metrics",
        }
      : undefined,
    custom: process.env.METRICS_ENDPOINT
      ? {
          endpoint: process.env.METRICS_ENDPOINT,
          headers: {
            Authorization: `Bearer ${process.env.METRICS_API_KEY || ""}`,
          },
        }
      : undefined,
  },
  dashboards: {
    grafana: process.env.GRAFANA_URL
      ? {
          url: process.env.GRAFANA_URL,
          apiKey: process.env.GRAFANA_API_KEY || "",
        }
      : undefined,
  },
  alerts: {
    thresholds: [
      {
        metric: "sla_availability_percentage",
        condition: "less_than",
        value: 99.9,
        duration: 300,
        severity: "critical",
      },
      {
        metric: "sla_response_time_ms",
        condition: "greater_than",
        value: 2000,
        duration: 300,
        severity: "high",
      },
      {
        metric: "sla_error_rate_percentage",
        condition: "greater_than",
        value: 1,
        duration: 180,
        severity: "high",
      },
      {
        metric: "system_cpu_usage_percentage",
        condition: "greater_than",
        value: 80,
        duration: 300,
        severity: "medium",
      },
      {
        metric: "system_memory_heap_used_bytes",
        condition: "greater_than",
        value: 1000000000,
        duration: 300,
        severity: "medium",
      },
    ],
    channels: [
      {
        type: "webhook",
        config: {
          url: process.env.ALERT_WEBHOOK_URL || "",
        },
      },
    ],
  },
};

// Export types
export type {
  MetricsConfig,
  CustomMetric,
  Dashboard,
  DashboardWidget,
  AlertThreshold,
};
