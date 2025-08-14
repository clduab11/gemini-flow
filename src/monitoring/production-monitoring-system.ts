/**
 * Production Monitoring System Integration
 * Orchestrates all monitoring components for comprehensive observability
 */

import { EventEmitter } from "events";
import { Logger } from "../utils/logger";
import {
  SyntheticMonitor,
  DEFAULT_MONITORING_CONFIG,
} from "./synthetic-monitoring";
import { RealUserMonitor, DEFAULT_RUM_CONFIG } from "./real-user-monitoring";
import {
  DistributedTracing,
  getTracing,
  DEFAULT_TRACING_CONFIG,
} from "./distributed-tracing";
import {
  CustomMetricsCollector,
  DEFAULT_METRICS_CONFIG,
} from "./custom-metrics-dashboard";
import {
  SLAComplianceMonitor,
  DEFAULT_SLA_CONFIG,
} from "./sla-compliance-monitor";

interface MonitoringSystemConfig {
  enabled: boolean;
  components: {
    syntheticMonitoring: boolean;
    realUserMonitoring: boolean;
    distributedTracing: boolean;
    customMetrics: boolean;
    slaCompliance: boolean;
  };
  alerting: {
    enabled: boolean;
    channels: AlertingChannel[];
  };
  reporting: {
    enabled: boolean;
    dashboard: boolean;
    exportPath: string;
  };
}

interface AlertingChannel {
  type: "email" | "slack" | "webhook" | "pagerduty";
  config: Record<string, any>;
  severity: ("low" | "medium" | "high" | "critical")[];
}

interface MonitoringHealth {
  overall: "healthy" | "degraded" | "unhealthy";
  components: {
    syntheticMonitoring: ComponentHealth;
    realUserMonitoring: ComponentHealth;
    distributedTracing: ComponentHealth;
    customMetrics: ComponentHealth;
    slaCompliance: ComponentHealth;
  };
  lastUpdated: Date;
}

interface ComponentHealth {
  status: "healthy" | "degraded" | "unhealthy" | "disabled";
  uptime: number;
  errors: number;
  lastError?: string;
  metrics?: Record<string, any>;
}

export class ProductionMonitoringSystem extends EventEmitter {
  private logger: Logger;
  private config: MonitoringSystemConfig;
  private isInitialized: boolean = false;
  private isRunning: boolean = false;

  // Monitoring components
  private syntheticMonitor?: SyntheticMonitor;
  private rumMonitor?: RealUserMonitor;
  private distributedTracing?: DistributedTracing;
  private metricsCollector?: CustomMetricsCollector;
  private slaMonitor?: SLAComplianceMonitor;

  // Health tracking
  private healthStatus: MonitoringHealth;
  private startTime: Date = new Date();
  private componentErrors: Map<string, number> = new Map();

  constructor(config: MonitoringSystemConfig) {
    super();
    this.config = config;
    this.logger = new Logger("ProductionMonitoringSystem");

    this.healthStatus = {
      overall: "healthy",
      components: {
        syntheticMonitoring: { status: "disabled", uptime: 0, errors: 0 },
        realUserMonitoring: { status: "disabled", uptime: 0, errors: 0 },
        distributedTracing: { status: "disabled", uptime: 0, errors: 0 },
        customMetrics: { status: "disabled", uptime: 0, errors: 0 },
        slaCompliance: { status: "disabled", uptime: 0, errors: 0 },
      },
      lastUpdated: new Date(),
    };
  }

  /**
   * Initialize the complete monitoring system
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn("Monitoring system already initialized");
      return;
    }

    if (!this.config.enabled) {
      this.logger.info("Monitoring system disabled by configuration");
      return;
    }

    try {
      this.logger.info("Initializing production monitoring system...");

      // Initialize distributed tracing first (needed by other components)
      if (this.config.components.distributedTracing) {
        await this.initializeDistributedTracing();
      }

      // Initialize metrics collector
      if (this.config.components.customMetrics) {
        await this.initializeCustomMetrics();
      }

      // Initialize synthetic monitoring
      if (this.config.components.syntheticMonitoring) {
        await this.initializeSyntheticMonitoring();
      }

      // Initialize RUM
      if (this.config.components.realUserMonitoring) {
        await this.initializeRealUserMonitoring();
      }

      // Initialize SLA compliance monitoring
      if (this.config.components.slaCompliance) {
        await this.initializeSLACompliance();
      }

      // Setup cross-component event handling
      this.setupEventHandling();

      // Start health monitoring
      this.startHealthMonitoring();

      this.isInitialized = true;
      this.logger.info("Production monitoring system initialized successfully");
    } catch (error) {
      this.logger.error("Failed to initialize monitoring system:", error);
      throw error;
    }
  }

  /**
   * Start all monitoring components
   */
  async start(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (this.isRunning) {
      this.logger.warn("Monitoring system already running");
      return;
    }

    try {
      this.logger.info("Starting production monitoring system...");

      // Start components in dependency order
      const startPromises: Promise<void>[] = [];

      if (this.syntheticMonitor) {
        startPromises.push(this.startSyntheticMonitoring());
      }

      if (this.rumMonitor) {
        startPromises.push(this.startRealUserMonitoring());
      }

      if (this.metricsCollector) {
        startPromises.push(this.startCustomMetrics());
      }

      if (this.slaMonitor) {
        startPromises.push(this.startSLACompliance());
      }

      // Start all components concurrently
      await Promise.all(startPromises);

      this.isRunning = true;
      this.startTime = new Date();

      this.logger.info("Production monitoring system started successfully");
      this.emit("system_started");
    } catch (error) {
      this.logger.error("Failed to start monitoring system:", error);
      throw error;
    }
  }

  /**
   * Stop all monitoring components
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn("Monitoring system not running");
      return;
    }

    try {
      this.logger.info("Stopping production monitoring system...");

      // Stop components in reverse dependency order
      const stopPromises: Promise<void>[] = [];

      if (this.slaMonitor) {
        stopPromises.push(this.slaMonitor.stop());
      }

      if (this.metricsCollector) {
        stopPromises.push(this.metricsCollector.stop());
      }

      if (this.rumMonitor) {
        stopPromises.push(Promise.resolve(this.rumMonitor.destroy()));
      }

      if (this.syntheticMonitor) {
        stopPromises.push(this.syntheticMonitor.stop());
      }

      if (this.distributedTracing) {
        stopPromises.push(this.distributedTracing.shutdown());
      }

      // Stop all components
      await Promise.all(stopPromises);

      this.isRunning = false;

      this.logger.info("Production monitoring system stopped");
      this.emit("system_stopped");
    } catch (error) {
      this.logger.error("Error stopping monitoring system:", error);
    }
  }

  /**
   * Initialize distributed tracing
   */
  private async initializeDistributedTracing(): Promise<void> {
    try {
      this.distributedTracing = getTracing(DEFAULT_TRACING_CONFIG);
      await this.distributedTracing.initialize();

      this.updateComponentHealth("distributedTracing", "healthy");
      this.logger.debug("Distributed tracing initialized");
    } catch (error) {
      this.updateComponentHealth(
        "distributedTracing",
        "unhealthy",
        error.message,
      );
      this.logger.error("Failed to initialize distributed tracing:", error);
      throw error;
    }
  }

  /**
   * Initialize custom metrics collector
   */
  private async initializeCustomMetrics(): Promise<void> {
    try {
      this.metricsCollector = new CustomMetricsCollector(
        DEFAULT_METRICS_CONFIG,
        this.distributedTracing!,
      );

      this.updateComponentHealth("customMetrics", "healthy");
      this.logger.debug("Custom metrics collector initialized");
    } catch (error) {
      this.updateComponentHealth("customMetrics", "unhealthy", error.message);
      this.logger.error("Failed to initialize custom metrics:", error);
      throw error;
    }
  }

  /**
   * Initialize synthetic monitoring
   */
  private async initializeSyntheticMonitoring(): Promise<void> {
    try {
      this.syntheticMonitor = new SyntheticMonitor(DEFAULT_MONITORING_CONFIG);

      this.updateComponentHealth("syntheticMonitoring", "healthy");
      this.logger.debug("Synthetic monitoring initialized");
    } catch (error) {
      this.updateComponentHealth(
        "syntheticMonitoring",
        "unhealthy",
        error.message,
      );
      this.logger.error("Failed to initialize synthetic monitoring:", error);
      throw error;
    }
  }

  /**
   * Initialize real user monitoring
   */
  private async initializeRealUserMonitoring(): Promise<void> {
    try {
      this.rumMonitor = new RealUserMonitor(DEFAULT_RUM_CONFIG);
      await this.rumMonitor.initialize();

      this.updateComponentHealth("realUserMonitoring", "healthy");
      this.logger.debug("Real user monitoring initialized");
    } catch (error) {
      this.updateComponentHealth(
        "realUserMonitoring",
        "unhealthy",
        error.message,
      );
      this.logger.error("Failed to initialize RUM:", error);
      throw error;
    }
  }

  /**
   * Initialize SLA compliance monitoring
   */
  private async initializeSLACompliance(): Promise<void> {
    try {
      if (!this.metricsCollector || !this.syntheticMonitor) {
        throw new Error(
          "SLA compliance requires metrics collector and synthetic monitor",
        );
      }

      this.slaMonitor = new SLAComplianceMonitor(
        DEFAULT_SLA_CONFIG,
        this.metricsCollector,
        this.syntheticMonitor,
      );

      this.updateComponentHealth("slaCompliance", "healthy");
      this.logger.debug("SLA compliance monitoring initialized");
    } catch (error) {
      this.updateComponentHealth("slaCompliance", "unhealthy", error.message);
      this.logger.error("Failed to initialize SLA compliance:", error);
      throw error;
    }
  }

  /**
   * Start individual components
   */
  private async startSyntheticMonitoring(): Promise<void> {
    if (!this.syntheticMonitor) return;

    try {
      await this.syntheticMonitor.start();
      this.logger.debug("Synthetic monitoring started");
    } catch (error) {
      this.updateComponentHealth(
        "syntheticMonitoring",
        "unhealthy",
        error.message,
      );
      throw error;
    }
  }

  private async startRealUserMonitoring(): Promise<void> {
    if (!this.rumMonitor) return;

    try {
      // RUM is automatically started when initialized
      this.logger.debug("Real user monitoring started");
    } catch (error) {
      this.updateComponentHealth(
        "realUserMonitoring",
        "unhealthy",
        error.message,
      );
      throw error;
    }
  }

  private async startCustomMetrics(): Promise<void> {
    if (!this.metricsCollector) return;

    try {
      await this.metricsCollector.start();
      this.logger.debug("Custom metrics collector started");
    } catch (error) {
      this.updateComponentHealth("customMetrics", "unhealthy", error.message);
      throw error;
    }
  }

  private async startSLACompliance(): Promise<void> {
    if (!this.slaMonitor) return;

    try {
      await this.slaMonitor.start();
      this.logger.debug("SLA compliance monitoring started");
    } catch (error) {
      this.updateComponentHealth("slaCompliance", "unhealthy", error.message);
      throw error;
    }
  }

  /**
   * Setup cross-component event handling
   */
  private setupEventHandling(): void {
    // Synthetic monitoring events
    if (this.syntheticMonitor) {
      this.syntheticMonitor.on("result", (result) => {
        this.emit("synthetic_result", result);

        // Forward to SLA monitor
        if (
          this.slaMonitor &&
          result.success !== undefined &&
          result.responseTime
        ) {
          this.slaMonitor.recordRequest(result.success, result.responseTime);
        }
      });

      this.syntheticMonitor.on("critical", (alert) => {
        this.emit("critical_alert", { source: "synthetic", alert });
        this.handleCriticalAlert("synthetic", alert);
      });
    }

    // RUM events
    if (this.rumMonitor) {
      this.rumMonitor.on("error", (error) => {
        this.emit("rum_error", error);
      });

      this.rumMonitor.on("metrics", (metrics) => {
        this.emit("rum_metrics", metrics);

        // Forward performance metrics to SLA monitor
        if (this.slaMonitor && metrics.ttfb) {
          this.slaMonitor.recordRequest(true, metrics.ttfb);
        }
      });
    }

    // Metrics collector events
    if (this.metricsCollector) {
      this.metricsCollector.on("alert", (alert) => {
        this.emit("metrics_alert", alert);
        this.handleMetricsAlert(alert);
      });

      this.metricsCollector.on("metric", (metric) => {
        this.emit("metric_recorded", metric);
      });
    }

    // SLA compliance events
    if (this.slaMonitor) {
      this.slaMonitor.on("violation", (violation) => {
        this.emit("sla_violation", violation);
        this.handleSLAViolation(violation);
      });

      this.slaMonitor.on("report", (report) => {
        this.emit("sla_report", report);
      });

      this.slaMonitor.on("escalation", (escalation) => {
        this.emit("sla_escalation", escalation);
        this.handleSLAEscalation(escalation);
      });
    }
  }

  /**
   * Handle critical alerts
   */
  private async handleCriticalAlert(source: string, alert: any): Promise<void> {
    this.logger.error(`Critical alert from ${source}:`, alert);

    if (this.config.alerting.enabled) {
      await this.sendAlert({
        severity: "critical",
        source,
        message: `Critical alert: ${alert.message || JSON.stringify(alert)}`,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Handle metrics alerts
   */
  private async handleMetricsAlert(alert: any): Promise<void> {
    this.logger.warn("Metrics alert:", alert);

    if (this.config.alerting.enabled) {
      await this.sendAlert({
        severity: alert.severity || "medium",
        source: "metrics",
        message: `Metrics alert: ${alert.metric} ${alert.condition} ${alert.threshold}`,
        timestamp: new Date(alert.timestamp),
      });
    }
  }

  /**
   * Handle SLA violations
   */
  private async handleSLAViolation(violation: any): Promise<void> {
    this.logger.warn("SLA violation:", violation);

    if (this.config.alerting.enabled) {
      await this.sendAlert({
        severity: violation.impact === "critical" ? "critical" : "high",
        source: "sla",
        message: `SLA violation: ${violation.type} - ${violation.actual} vs ${violation.target}`,
        timestamp: new Date(violation.timestamp),
      });
    }
  }

  /**
   * Handle SLA escalations
   */
  private async handleSLAEscalation(escalation: any): Promise<void> {
    this.logger.error("SLA escalation:", escalation);

    if (this.config.alerting.enabled) {
      await this.sendAlert({
        severity: "critical",
        source: "sla_escalation",
        message: `SLA escalation level ${escalation.level}: ${escalation.violation.type}`,
        timestamp: new Date(),
      });
    }
  }

  /**
   * Send alert to configured channels
   */
  private async sendAlert(alert: {
    severity: string;
    source: string;
    message: string;
    timestamp: Date;
  }): Promise<void> {
    const applicableChannels = this.config.alerting.channels.filter((channel) =>
      channel.severity.includes(alert.severity as any),
    );

    for (const channel of applicableChannels) {
      try {
        await this.sendToChannel(channel, alert);
      } catch (error) {
        this.logger.error(`Failed to send alert to ${channel.type}:`, error);
      }
    }
  }

  /**
   * Send alert to specific channel
   */
  private async sendToChannel(
    channel: AlertingChannel,
    alert: any,
  ): Promise<void> {
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
  }

  private async sendEmailAlert(config: any, alert: any): Promise<void> {
    // Implementation for email alerts
    this.logger.debug("Sending email alert:", alert.message);
  }

  private async sendSlackAlert(config: any, alert: any): Promise<void> {
    // Implementation for Slack alerts
    this.logger.debug("Sending Slack alert:", alert.message);
  }

  private async sendWebhookAlert(config: any, alert: any): Promise<void> {
    // Implementation for webhook alerts
    this.logger.debug("Sending webhook alert:", alert.message);
  }

  private async sendPagerDutyAlert(config: any, alert: any): Promise<void> {
    // Implementation for PagerDuty alerts
    this.logger.debug("Sending PagerDuty alert:", alert.message);
  }

  /**
   * Start health monitoring
   */
  private startHealthMonitoring(): void {
    // Update health status every 30 seconds
    setInterval(() => {
      this.updateHealthStatus();
    }, 30000);

    // Initial health check
    this.updateHealthStatus();
  }

  /**
   * Update component health
   */
  private updateComponentHealth(
    component: keyof MonitoringHealth["components"],
    status: ComponentHealth["status"],
    error?: string,
  ): void {
    const uptime = Date.now() - this.startTime.getTime();
    const errorCount = this.componentErrors.get(component) || 0;

    if (status === "unhealthy" && error) {
      this.componentErrors.set(component, errorCount + 1);
    }

    this.healthStatus.components[component] = {
      status,
      uptime: uptime / 1000, // Convert to seconds
      errors: errorCount,
      lastError: error,
      metrics: this.getComponentMetrics(component),
    };

    this.healthStatus.lastUpdated = new Date();
  }

  /**
   * Update overall health status
   */
  private updateHealthStatus(): void {
    const components = Object.values(this.healthStatus.components);
    const unhealthyComponents = components.filter(
      (c) => c.status === "unhealthy",
    ).length;
    const degradedComponents = components.filter(
      (c) => c.status === "degraded",
    ).length;
    const enabledComponents = components.filter(
      (c) => c.status !== "disabled",
    ).length;

    if (unhealthyComponents > 0) {
      this.healthStatus.overall = "unhealthy";
    } else if (degradedComponents > 0 || enabledComponents === 0) {
      this.healthStatus.overall = "degraded";
    } else {
      this.healthStatus.overall = "healthy";
    }

    this.healthStatus.lastUpdated = new Date();
    this.emit("health_updated", this.healthStatus);
  }

  /**
   * Get component-specific metrics
   */
  private getComponentMetrics(component: string): Record<string, any> {
    switch (component) {
      case "syntheticMonitoring":
        return this.syntheticMonitor?.getStatistics() || {};
      case "realUserMonitoring":
        return this.rumMonitor?.getSessionStats() || {};
      case "distributedTracing":
        return this.distributedTracing?.getHealthStatus() || {};
      case "customMetrics":
        return this.metricsCollector?.getMetricsSummary() || {};
      case "slaCompliance":
        return this.slaMonitor?.getCurrentSLAStatus() || {};
      default:
        return {};
    }
  }

  /**
   * Get comprehensive system status
   */
  public getSystemStatus(): {
    health: MonitoringHealth;
    runtime: {
      uptime: number;
      startTime: Date;
      isRunning: boolean;
      isInitialized: boolean;
    };
    components: {
      [key: string]: any;
    };
  } {
    return {
      health: this.healthStatus,
      runtime: {
        uptime: (Date.now() - this.startTime.getTime()) / 1000,
        startTime: this.startTime,
        isRunning: this.isRunning,
        isInitialized: this.isInitialized,
      },
      components: {
        syntheticMonitoring: this.syntheticMonitor?.getStatistics(),
        realUserMonitoring: this.rumMonitor?.getSessionStats(),
        distributedTracing: this.distributedTracing?.getHealthStatus(),
        customMetrics: this.metricsCollector?.getMetricsSummary(),
        slaCompliance: this.slaMonitor?.getCurrentSLAStatus(),
      },
    };
  }

  /**
   * Get monitoring dashboard data
   */
  public getDashboardData(): any {
    return {
      timestamp: new Date().toISOString(),
      system: this.getSystemStatus(),
      metrics: {
        synthetic: this.syntheticMonitor?.getStatistics(),
        rum: this.rumMonitor?.getSessionStats(),
        sla: this.slaMonitor?.getCurrentSLAStatus(),
      },
      alerts: {
        active: 0, // Would track active alerts
        recent: [], // Would track recent alerts
      },
    };
  }

  /**
   * Record custom event for monitoring
   */
  public recordEvent(event: {
    type: string;
    source: string;
    data: any;
    severity?: "low" | "medium" | "high" | "critical";
  }): void {
    this.logger.info(`Event recorded: ${event.type} from ${event.source}`);
    this.emit("custom_event", event);

    // Forward to appropriate components
    if (this.metricsCollector) {
      this.metricsCollector.recordMetric(`event_${event.type}`, 1, "counter", {
        source: event.source,
        severity: event.severity || "medium",
      });
    }
  }

  /**
   * Generate monitoring report
   */
  public async generateReport(
    type: "summary" | "detailed" = "summary",
  ): Promise<any> {
    const systemStatus = this.getSystemStatus();
    const dashboardData = this.getDashboardData();

    const report = {
      generatedAt: new Date().toISOString(),
      type,
      system: systemStatus,
      dashboard: dashboardData,
      recommendations: this.generateRecommendations(systemStatus),
    };

    if (type === "detailed") {
      // Add detailed component data
      report.dashboard.detailed = {
        tracing: this.distributedTracing?.getHealthStatus(),
        metrics: this.metricsCollector?.getMetricsSummary(),
        sla: await this.slaMonitor?.generateReport("daily").catch(() => null),
      };
    }

    this.emit("report_generated", report);
    return report;
  }

  /**
   * Generate recommendations based on system status
   */
  private generateRecommendations(systemStatus: any): string[] {
    const recommendations: string[] = [];

    if (systemStatus.health.overall !== "healthy") {
      recommendations.push(
        "Review unhealthy monitoring components and address issues",
      );
    }

    const unhealthyComponents = Object.entries(systemStatus.health.components)
      .filter(
        ([_, component]: [string, any]) => component.status === "unhealthy",
      )
      .map(([name, _]) => name);

    if (unhealthyComponents.length > 0) {
      recommendations.push(
        `Address issues with: ${unhealthyComponents.join(", ")}`,
      );
    }

    if (systemStatus.runtime.uptime < 3600) {
      recommendations.push("System recently restarted - monitor for stability");
    }

    return recommendations;
  }
}

// Default configuration
export const DEFAULT_MONITORING_SYSTEM_CONFIG: MonitoringSystemConfig = {
  enabled: process.env.MONITORING_ENABLED !== "false",
  components: {
    syntheticMonitoring: process.env.SYNTHETIC_MONITORING_ENABLED !== "false",
    realUserMonitoring: process.env.RUM_ENABLED !== "false",
    distributedTracing: process.env.TRACING_ENABLED !== "false",
    customMetrics: process.env.METRICS_ENABLED !== "false",
    slaCompliance: process.env.SLA_MONITORING_ENABLED !== "false",
  },
  alerting: {
    enabled: process.env.ALERTING_ENABLED !== "false",
    channels: [
      {
        type: "webhook",
        config: {
          url: process.env.ALERT_WEBHOOK_URL || "",
        },
        severity: ["high", "critical"],
      },
    ],
  },
  reporting: {
    enabled: process.env.REPORTING_ENABLED !== "false",
    dashboard: true,
    exportPath: process.env.REPORTS_PATH || "./reports",
  },
};

// Singleton instance
let monitoringSystemInstance: ProductionMonitoringSystem | null = null;

/**
 * Get or create the monitoring system instance
 */
export function getMonitoringSystem(
  config?: MonitoringSystemConfig,
): ProductionMonitoringSystem {
  if (!monitoringSystemInstance) {
    monitoringSystemInstance = new ProductionMonitoringSystem(
      config || DEFAULT_MONITORING_SYSTEM_CONFIG,
    );
  }
  return monitoringSystemInstance;
}

/**
 * Initialize and start the complete monitoring system
 */
export async function initializeProductionMonitoring(
  config?: MonitoringSystemConfig,
): Promise<ProductionMonitoringSystem> {
  const system = getMonitoringSystem(config);
  await system.initialize();
  await system.start();
  return system;
}

// Export types
export type {
  MonitoringSystemConfig,
  MonitoringHealth,
  ComponentHealth,
  AlertingChannel,
};
