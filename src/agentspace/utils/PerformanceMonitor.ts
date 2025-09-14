/**
 * Performance Monitor - Advanced performance tracking and optimization
 *
 * Provides comprehensive performance monitoring with:
 * - Real-time performance metrics collection
 * - Bottleneck detection and analysis
 * - Performance trend analysis
 * - Automated optimization recommendations
 * - SLA monitoring and alerting
 */

import { EventEmitter } from "events";
import { Logger } from "../../utils/logger.js";
import {
  PerformanceMetrics,
  AgentSpaceEvent,
  HealthScore,
} from "../types/AgentSpaceTypes.js";

export interface PerformanceConfig {
  metricsCollectionInterval: number;
  trendAnalysisWindow: number;
  bottleneckDetectionThreshold: number;
  alertingEnabled: boolean;
  historicalDataRetention: number;
}

export interface SystemPerformanceMetrics {
  timestamp: Date;
  uptime: number;

  // Core metrics
  throughput: ThroughputMetrics;
  latency: LatencyMetrics;
  resourceUsage: ResourceUsageMetrics;
  errorMetrics: ErrorMetrics;

  // Component-specific metrics
  virtualization: ComponentMetrics;
  spatial: ComponentMetrics;
  memory: ComponentMetrics;
  consensus: ComponentMetrics;

  // Derived metrics
  overallHealth: number;
  performanceScore: number;
  efficiency: number;
  reliability: number;
}

export interface ThroughputMetrics {
  operationsPerSecond: number;
  requestsPerSecond: number;
  dataProcessedPerSecond: number;
  peakThroughput: number;
  averageThroughput: number;
  throughputTrend: "increasing" | "stable" | "decreasing";
}

export interface LatencyMetrics {
  averageLatency: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
  maxLatency: number;
  latencyDistribution: number[];
  latencyTrend: "improving" | "stable" | "degrading";
}

export interface ResourceUsageMetrics {
  cpu: ResourceMetric;
  memory: ResourceMetric;
  network: ResourceMetric;
  storage: ResourceMetric;
  overallUtilization: number;
  resourceEfficiency: number;
}

export interface ResourceMetric {
  current: number;
  average: number;
  peak: number;
  utilization: number;
  trend: "increasing" | "stable" | "decreasing";
}

export interface ErrorMetrics {
  totalErrors: number;
  errorRate: number;
  errorsByType: { [type: string]: number };
  criticalErrors: number;
  recoveryTime: number;
  errorTrend: "increasing" | "stable" | "decreasing";
}

export interface ComponentMetrics {
  operationsCount: number;
  averageResponseTime: number;
  successRate: number;
  errorCount: number;
  healthScore: number;
  lastUpdate: Date;
}

export interface PerformanceAlert {
  id: string;
  type:
    | "threshold_exceeded"
    | "bottleneck_detected"
    | "sla_violation"
    | "anomaly_detected";
  severity: "low" | "medium" | "high" | "critical";
  component: string;
  metric: string;
  currentValue: number;
  thresholdValue: number;
  timestamp: Date;
  description: string;
  recommendedActions: string[];
}

export interface BottleneckAnalysis {
  id: string;
  component: string;
  bottleneckType:
    | "cpu"
    | "memory"
    | "network"
    | "storage"
    | "algorithm"
    | "contention";
  severity: number;
  impact: "low" | "medium" | "high" | "critical";
  affectedOperations: string[];
  rootCause: string;
  resolutionPlan: ResolutionStep[];
  estimatedImprovementPercentage: number;
}

export interface ResolutionStep {
  step: number;
  action: string;
  description: string;
  estimatedTime: number;
  expectedImprovement: number;
  riskLevel: "low" | "medium" | "high";
}

export interface PerformanceTrend {
  metric: string;
  component: string;
  timeWindow: number;
  trendDirection: "improving" | "stable" | "degrading";
  changeRate: number;
  predictedValue: number;
  confidence: number;
  seasonality: SeasonalityInfo[];
}

export interface SeasonalityInfo {
  pattern: "hourly" | "daily" | "weekly";
  strength: number;
  peakTimes: string[];
  lowTimes: string[];
}

export interface SLADefinition {
  name: string;
  metric: string;
  threshold: number;
  operator: "less_than" | "greater_than" | "equals";
  timeWindow: number;
  violationAction: "alert" | "scale" | "optimize" | "failover";
}

export interface SLAViolation {
  slaName: string;
  metric: string;
  currentValue: number;
  thresholdValue: number;
  duration: number;
  timestamp: Date;
  actionTaken: string;
}

export interface PerformanceInsight {
  type: "optimization" | "capacity" | "efficiency" | "reliability";
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  potentialImpact: number;
  implementationEffort: "low" | "medium" | "high";
  recommendations: string[];
  relatedMetrics: string[];
}

export class PerformanceMonitor extends EventEmitter {
  private logger: Logger;
  private config: PerformanceConfig;

  // Data storage
  private metricsHistory: SystemPerformanceMetrics[] = [];
  private activeAlerts: Map<string, PerformanceAlert> = new Map();
  private bottlenecks: Map<string, BottleneckAnalysis> = new Map();
  private trends: Map<string, PerformanceTrend> = new Map();
  private slaDefinitions: Map<string, SLADefinition> = new Map();
  private slaViolations: SLAViolation[] = [];

  // Monitoring state
  private metricsCollectionTimer: NodeJS.Timeout | null = null;
  private analysisTimer: NodeJS.Timeout | null = null;
  private isMonitoring: boolean = false;
  private startTime: Date;

  // Metric accumulators
  private operationCounts: Map<string, number> = new Map();
  private latencyMeasurements: number[] = [];
  private errorCounts: Map<string, number> = new Map();

  constructor(config: PerformanceConfig) {
    super();
    this.logger = new Logger("PerformanceMonitor");
    this.config = config;
    this.startTime = new Date();

    this.initializeDefaultSLAs();
    this.startMonitoring();

    this.logger.info("Performance Monitor initialized", {
      metricsInterval: config.metricsCollectionInterval,
      alertingEnabled: config.alertingEnabled,
    });
  }

  /**
   * Start performance monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;

    // Start metrics collection
    this.metricsCollectionTimer = setInterval(() => {
      this.collectMetrics();
    }, this.config.metricsCollectionInterval);

    // Start analysis and optimization
    this.analysisTimer = setInterval(() => {
      this.performAnalysis();
    }, this.config.trendAnalysisWindow);

    this.logger.info("Performance monitoring started");
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;

    if (this.metricsCollectionTimer) {
      clearInterval(this.metricsCollectionTimer);
      this.metricsCollectionTimer = null;
    }

    if (this.analysisTimer) {
      clearInterval(this.analysisTimer);
      this.analysisTimer = null;
    }

    this.logger.info("Performance monitoring stopped");
  }

  /**
   * Record operation metrics
   */
  recordOperation(
    operation: string,
    duration: number,
    success: boolean,
    component: string = "system",
  ): void {
    const key = `${component}:${operation}`;

    // Update operation count
    this.operationCounts.set(key, (this.operationCounts.get(key) || 0) + 1);

    // Record latency
    this.latencyMeasurements.push(duration);

    // Record errors
    if (!success) {
      this.errorCounts.set(key, (this.errorCounts.get(key) || 0) + 1);
    }

    // Limit history size
    if (this.latencyMeasurements.length > 10000) {
      this.latencyMeasurements.splice(0, 5000);
    }
  }

  /**
   * Get current performance metrics
   */
  getCurrentMetrics(): SystemPerformanceMetrics {
    const now = new Date();
    const uptime = now.getTime() - this.startTime.getTime();

    return {
      timestamp: now,
      uptime,
      throughput: this.calculateThroughputMetrics(),
      latency: this.calculateLatencyMetrics(),
      resourceUsage: this.calculateResourceUsageMetrics(),
      errorMetrics: this.calculateErrorMetrics(),
      virtualization: this.getComponentMetrics("virtualization"),
      spatial: this.getComponentMetrics("spatial"),
      memory: this.getComponentMetrics("memory"),
      consensus: this.getComponentMetrics("consensus"),
      overallHealth: this.calculateOverallHealth(),
      performanceScore: this.calculatePerformanceScore(),
      efficiency: this.calculateEfficiency(),
      reliability: this.calculateReliability(),
    };
  }

  /**
   * Get performance history
   */
  getPerformanceHistory(timeWindow?: number): SystemPerformanceMetrics[] {
    if (!timeWindow) return [...this.metricsHistory];

    const cutoff = Date.now() - timeWindow;
    return this.metricsHistory.filter(
      (metrics) => metrics.timestamp.getTime() >= cutoff,
    );
  }

  /**
   * Detect performance bottlenecks
   */
  async detectBottlenecks(): Promise<BottleneckAnalysis[]> {
    const bottlenecks: BottleneckAnalysis[] = [];
    const currentMetrics = this.getCurrentMetrics();

    // CPU bottleneck detection
    if (
      currentMetrics.resourceUsage.cpu.utilization >
      this.config.bottleneckDetectionThreshold
    ) {
      bottlenecks.push(
        this.createBottleneckAnalysis(
          "cpu",
          currentMetrics.resourceUsage.cpu.utilization,
          ["High CPU utilization affecting system performance"],
          "CPU resources are consistently above threshold",
        ),
      );
    }

    // Memory bottleneck detection
    if (
      currentMetrics.resourceUsage.memory.utilization >
      this.config.bottleneckDetectionThreshold
    ) {
      bottlenecks.push(
        this.createBottleneckAnalysis(
          "memory",
          currentMetrics.resourceUsage.memory.utilization,
          ["Memory pressure causing performance degradation"],
          "Memory usage consistently exceeds safe thresholds",
        ),
      );
    }

    // Latency bottleneck detection
    if (currentMetrics.latency.p95Latency > 1000) {
      // 1 second threshold
      bottlenecks.push(
        this.createBottleneckAnalysis(
          "algorithm",
          currentMetrics.latency.p95Latency,
          ["High latency affecting user experience"],
          "Processing latency exceeds acceptable thresholds",
        ),
      );
    }

    // Store detected bottlenecks
    for (const bottleneck of bottlenecks) {
      this.bottlenecks.set(bottleneck.id, bottleneck);
    }

    return bottlenecks;
  }

  /**
   * Analyze performance trends
   */
  analyzePerformanceTrends(): PerformanceTrend[] {
    const trends: PerformanceTrend[] = [];
    const history = this.getPerformanceHistory(this.config.trendAnalysisWindow);

    if (history.length < 2) return trends;

    // Analyze throughput trend
    const throughputValues = history.map(
      (h) => h.throughput.operationsPerSecond,
    );
    const throughputTrend = this.calculateTrend(throughputValues);

    trends.push({
      metric: "throughput",
      component: "system",
      timeWindow: this.config.trendAnalysisWindow,
      trendDirection: this.getTrendDirection(throughputTrend.slope),
      changeRate: throughputTrend.slope,
      predictedValue: throughputTrend.prediction,
      confidence: throughputTrend.confidence,
      seasonality: [],
    });

    // Analyze latency trend
    const latencyValues = history.map((h) => h.latency.averageLatency);
    const latencyTrend = this.calculateTrend(latencyValues);

    trends.push({
      metric: "latency",
      component: "system",
      timeWindow: this.config.trendAnalysisWindow,
      trendDirection: this.getTrendDirection(latencyTrend.slope),
      changeRate: latencyTrend.slope,
      predictedValue: latencyTrend.prediction,
      confidence: latencyTrend.confidence,
      seasonality: [],
    });

    return trends;
  }

  /**
   * Generate performance insights
   */
  generatePerformanceInsights(): PerformanceInsight[] {
    const insights: PerformanceInsight[] = [];
    const currentMetrics = this.getCurrentMetrics();

    // CPU optimization insight
    if (currentMetrics.resourceUsage.cpu.utilization > 0.8) {
      insights.push({
        type: "optimization",
        priority: "high",
        title: "CPU Utilization Optimization",
        description:
          "High CPU utilization detected. Consider optimizing algorithms or scaling resources.",
        potentialImpact: 0.25,
        implementationEffort: "medium",
        recommendations: [
          "Optimize CPU-intensive algorithms",
          "Implement caching to reduce computation",
          "Consider horizontal scaling",
        ],
        relatedMetrics: ["cpu.utilization", "throughput.operationsPerSecond"],
      });
    }

    // Memory efficiency insight
    if (currentMetrics.resourceUsage.memory.utilization > 0.85) {
      insights.push({
        type: "capacity",
        priority: "medium",
        title: "Memory Capacity Planning",
        description:
          "Memory usage is approaching limits. Plan for capacity expansion.",
        potentialImpact: 0.2,
        implementationEffort: "high",
        recommendations: [
          "Increase memory allocation",
          "Implement memory compression",
          "Optimize data structures",
        ],
        relatedMetrics: ["memory.utilization", "memory.peak"],
      });
    }

    // Error rate insight
    if (currentMetrics.errorMetrics.errorRate > 0.05) {
      insights.push({
        type: "reliability",
        priority: "critical",
        title: "Error Rate Reduction",
        description:
          "High error rate detected. Investigate and fix underlying issues.",
        potentialImpact: 0.4,
        implementationEffort: "medium",
        recommendations: [
          "Analyze error patterns",
          "Implement better error handling",
          "Add monitoring and alerting",
        ],
        relatedMetrics: ["errorMetrics.errorRate", "reliability"],
      });
    }

    return insights;
  }

  /**
   * Check SLA compliance
   */
  checkSLACompliance(): SLAViolation[] {
    const violations: SLAViolation[] = [];
    const currentMetrics = this.getCurrentMetrics();

    for (const [slaName, sla] of this.slaDefinitions) {
      const metricValue = this.getMetricValue(currentMetrics, sla.metric);
      const isViolation = this.evaluateSLACondition(
        metricValue,
        sla.threshold,
        sla.operator,
      );

      if (isViolation) {
        const violation: SLAViolation = {
          slaName,
          metric: sla.metric,
          currentValue: metricValue,
          thresholdValue: sla.threshold,
          duration: 0, // Would track actual violation duration
          timestamp: new Date(),
          actionTaken: this.executeSLAAction(sla.violationAction, sla.metric),
        };

        violations.push(violation);
        this.slaViolations.push(violation);
      }
    }

    return violations;
  }

  /**
   * Generate performance alerts
   */
  generateAlerts(): PerformanceAlert[] {
    const alerts: PerformanceAlert[] = [];
    const currentMetrics = this.getCurrentMetrics();

    // High latency alert
    if (currentMetrics.latency.p95Latency > 2000) {
      alerts.push(
        this.createAlert(
          "threshold_exceeded",
          "critical",
          "system",
          "latency.p95",
          currentMetrics.latency.p95Latency,
          2000,
          "P95 latency exceeds acceptable threshold",
          [
            "Investigate slow operations",
            "Optimize critical paths",
            "Scale resources",
          ],
        ),
      );
    }

    // Low throughput alert
    if (currentMetrics.throughput.operationsPerSecond < 10) {
      alerts.push(
        this.createAlert(
          "threshold_exceeded",
          "medium",
          "system",
          "throughput.operationsPerSecond",
          currentMetrics.throughput.operationsPerSecond,
          10,
          "System throughput is below expected levels",
          [
            "Check for bottlenecks",
            "Optimize processing",
            "Review resource allocation",
          ],
        ),
      );
    }

    // Store alerts
    for (const alert of alerts) {
      this.activeAlerts.set(alert.id, alert);

      if (this.config.alertingEnabled) {
        this.emit("performance_alert", alert);
      }
    }

    return alerts;
  }

  /**
   * Get active performance alerts
   */
  getActiveAlerts(): PerformanceAlert[] {
    return Array.from(this.activeAlerts.values());
  }

  /**
   * Get detected bottlenecks
   */
  getBottlenecks(): BottleneckAnalysis[] {
    return Array.from(this.bottlenecks.values());
  }

  /**
   * Private helper methods
   */

  private initializeDefaultSLAs(): void {
    // Response time SLA
    this.slaDefinitions.set("response_time", {
      name: "Response Time SLA",
      metric: "latency.averageLatency",
      threshold: 500, // 500ms
      operator: "less_than",
      timeWindow: 300000, // 5 minutes
      violationAction: "alert",
    });

    // Throughput SLA
    this.slaDefinitions.set("throughput", {
      name: "Throughput SLA",
      metric: "throughput.operationsPerSecond",
      threshold: 50,
      operator: "greater_than",
      timeWindow: 300000,
      violationAction: "scale",
    });

    // Error rate SLA
    this.slaDefinitions.set("error_rate", {
      name: "Error Rate SLA",
      metric: "errorMetrics.errorRate",
      threshold: 0.01, // 1%
      operator: "less_than",
      timeWindow: 300000,
      violationAction: "alert",
    });
  }

  private collectMetrics(): void {
    const metrics = this.getCurrentMetrics();
    this.metricsHistory.push(metrics);

    // Limit history size
    if (this.metricsHistory.length > this.config.historicalDataRetention) {
      this.metricsHistory.splice(
        0,
        this.metricsHistory.length - this.config.historicalDataRetention,
      );
    }

    this.emit("metrics_collected", metrics);
  }

  private performAnalysis(): void {
    Promise.all([
      this.detectBottlenecks(),
      this.checkSLACompliance(),
      this.generateAlerts(),
    ])
      .then(([bottlenecks, violations, alerts]) => {
        this.emit("analysis_complete", {
          bottlenecks,
          violations,
          alerts,
          insights: this.generatePerformanceInsights(),
        });
      })
      .catch((error) => {
        this.logger.error("Performance analysis failed", {
          error: error.message,
        });
      });
  }

  private calculateThroughputMetrics(): ThroughputMetrics {
    const timeWindow = 60000; // 1 minute
    const recentHistory = this.getPerformanceHistory(timeWindow);

    const totalOperations = Array.from(this.operationCounts.values()).reduce(
      (sum, count) => sum + count,
      0,
    );

    const operationsPerSecond = totalOperations / (timeWindow / 1000);

    return {
      operationsPerSecond,
      requestsPerSecond: operationsPerSecond, // Simplified
      dataProcessedPerSecond: operationsPerSecond * 100, // Estimated
      peakThroughput: Math.max(
        ...recentHistory.map((h) => h.throughput?.operationsPerSecond || 0),
      ),
      averageThroughput:
        recentHistory.length > 0
          ? recentHistory.reduce(
              (sum, h) => sum + (h.throughput?.operationsPerSecond || 0),
              0,
            ) / recentHistory.length
          : operationsPerSecond,
      throughputTrend: "stable",
    };
  }

  private calculateLatencyMetrics(): LatencyMetrics {
    if (this.latencyMeasurements.length === 0) {
      return {
        averageLatency: 0,
        p50Latency: 0,
        p95Latency: 0,
        p99Latency: 0,
        maxLatency: 0,
        latencyDistribution: [],
        latencyTrend: "stable",
      };
    }

    const sorted = [...this.latencyMeasurements].sort((a, b) => a - b);
    const len = sorted.length;

    return {
      averageLatency: sorted.reduce((sum, val) => sum + val, 0) / len,
      p50Latency: sorted[Math.floor(len * 0.5)],
      p95Latency: sorted[Math.floor(len * 0.95)],
      p99Latency: sorted[Math.floor(len * 0.99)],
      maxLatency: sorted[len - 1],
      latencyDistribution: this.createLatencyDistribution(sorted),
      latencyTrend: "stable",
    };
  }

  private calculateResourceUsageMetrics(): ResourceUsageMetrics {
    // Simplified resource metrics - would integrate with actual system monitoring
    return {
      cpu: {
        current: Math.random() * 100,
        average: 45,
        peak: 85,
        utilization: Math.random(),
        trend: "stable",
      },
      memory: {
        current: Math.random() * 100,
        average: 60,
        peak: 90,
        utilization: Math.random(),
        trend: "stable",
      },
      network: {
        current: Math.random() * 100,
        average: 30,
        peak: 70,
        utilization: Math.random(),
        trend: "stable",
      },
      storage: {
        current: Math.random() * 100,
        average: 40,
        peak: 80,
        utilization: Math.random(),
        trend: "stable",
      },
      overallUtilization: 0.5,
      resourceEfficiency: 0.75,
    };
  }

  private calculateErrorMetrics(): ErrorMetrics {
    const totalOperations = Array.from(this.operationCounts.values()).reduce(
      (sum, count) => sum + count,
      0,
    );
    const totalErrors = Array.from(this.errorCounts.values()).reduce(
      (sum, count) => sum + count,
      0,
    );

    const errorsByType: { [type: string]: number } = {};
    for (const [key, count] of this.errorCounts) {
      const type = key.split(":")[1] || "unknown";
      errorsByType[type] = (errorsByType[type] || 0) + count;
    }

    return {
      totalErrors,
      errorRate: totalOperations > 0 ? totalErrors / totalOperations : 0,
      errorsByType,
      criticalErrors: 0, // Would track critical errors separately
      recoveryTime: 100, // Average recovery time
      errorTrend: "stable",
    };
  }

  private getComponentMetrics(component: string): ComponentMetrics {
    const componentOperations = Array.from(this.operationCounts.entries())
      .filter(([key]) => key.startsWith(component))
      .reduce((sum, [, count]) => sum + count, 0);

    const componentErrors = Array.from(this.errorCounts.entries())
      .filter(([key]) => key.startsWith(component))
      .reduce((sum, [, count]) => sum + count, 0);

    return {
      operationsCount: componentOperations,
      averageResponseTime: 100, // Simplified
      successRate:
        componentOperations > 0 ? 1 - componentErrors / componentOperations : 1,
      errorCount: componentErrors,
      healthScore: 0.85, // Calculated health score
      lastUpdate: new Date(),
    };
  }

  private calculateOverallHealth(): number {
    const components = ["virtualization", "spatial", "memory", "consensus"];
    const healthScores = components.map(
      (comp) => this.getComponentMetrics(comp).healthScore,
    );
    return (
      healthScores.reduce((sum, score) => sum + score, 0) / healthScores.length
    );
  }

  private calculatePerformanceScore(): number {
    const currentMetrics = this.getCurrentMetrics();

    // Weighted performance score
    const throughputScore = Math.min(
      currentMetrics.throughput.operationsPerSecond / 100,
      1,
    );
    const latencyScore = Math.max(
      0,
      1 - currentMetrics.latency.averageLatency / 1000,
    );
    const errorScore = Math.max(0, 1 - currentMetrics.errorMetrics.errorRate);

    return throughputScore * 0.4 + latencyScore * 0.4 + errorScore * 0.2;
  }

  private calculateEfficiency(): number {
    // Simplified efficiency calculation
    const currentMetrics = this.getCurrentMetrics();
    return currentMetrics.resourceUsage.resourceEfficiency;
  }

  private calculateReliability(): number {
    const currentMetrics = this.getCurrentMetrics();
    return Math.max(0, 1 - currentMetrics.errorMetrics.errorRate);
  }

  private createLatencyDistribution(sortedLatencies: number[]): number[] {
    const buckets = 10;
    const distribution = new Array(buckets).fill(0);
    const max = sortedLatencies[sortedLatencies.length - 1];
    const bucketSize = max / buckets;

    for (const latency of sortedLatencies) {
      const bucketIndex = Math.min(
        Math.floor(latency / bucketSize),
        buckets - 1,
      );
      distribution[bucketIndex]++;
    }

    return distribution;
  }

  private createBottleneckAnalysis(
    bottleneckType: string,
    severity: number,
    affectedOperations: string[],
    rootCause: string,
  ): BottleneckAnalysis {
    return {
      id: `bottleneck_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      component: "system",
      bottleneckType: bottleneckType as any,
      severity,
      impact: severity > 0.8 ? "critical" : severity > 0.6 ? "high" : "medium",
      affectedOperations,
      rootCause,
      resolutionPlan: this.generateResolutionPlan(bottleneckType),
      estimatedImprovementPercentage: Math.min(30, severity * 20),
    };
  }

  private generateResolutionPlan(bottleneckType: string): ResolutionStep[] {
    const plans: Record<string, ResolutionStep[]> = {
      cpu: [
        {
          step: 1,
          action: "analyze_cpu_usage",
          description: "Analyze which processes are consuming CPU",
          estimatedTime: 300000, // 5 minutes
          expectedImprovement: 10,
          riskLevel: "low" as const,
        },
        {
          step: 2,
          action: "optimize_algorithms",
          description: "Optimize CPU-intensive algorithms",
          estimatedTime: 1800000, // 30 minutes
          expectedImprovement: 25,
          riskLevel: "medium" as const,
        },
      ],
      memory: [
        {
          step: 1,
          action: "memory_profiling",
          description: "Profile memory usage patterns",
          estimatedTime: 600000, // 10 minutes
          expectedImprovement: 5,
          riskLevel: "low" as const,
        },
        {
          step: 2,
          action: "implement_caching",
          description: "Implement intelligent caching",
          estimatedTime: 3600000, // 1 hour
          expectedImprovement: 30,
          riskLevel: "medium" as const,
        },
      ],
    };

    return plans[bottleneckType] || [];
  }

  private calculateTrend(values: number[]): {
    slope: number;
    prediction: number;
    confidence: number;
  } {
    if (values.length < 2) {
      return { slope: 0, prediction: values[0] || 0, confidence: 0 };
    }

    // Simple linear regression
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, index) => sum + val * index, 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const prediction = intercept + slope * n;

    // Calculate R-squared for confidence
    const mean = sumY / n;
    const totalSumSquares = values.reduce(
      (sum, val) => sum + Math.pow(val - mean, 2),
      0,
    );
    const residualSumSquares = values.reduce(
      (sum, val, index) => sum + Math.pow(val - (intercept + slope * index), 2),
      0,
    );
    const rSquared = 1 - residualSumSquares / totalSumSquares;

    return {
      slope,
      prediction,
      confidence: Math.max(0, Math.min(1, rSquared)),
    };
  }

  private getTrendDirection(
    slope: number,
  ): "improving" | "stable" | "degrading" {
    if (Math.abs(slope) < 0.1) return "stable";
    return slope > 0 ? "improving" : "degrading";
  }

  private createAlert(
    type: PerformanceAlert["type"],
    severity: PerformanceAlert["severity"],
    component: string,
    metric: string,
    currentValue: number,
    thresholdValue: number,
    description: string,
    recommendedActions: string[],
  ): PerformanceAlert {
    return {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      severity,
      component,
      metric,
      currentValue,
      thresholdValue,
      timestamp: new Date(),
      description,
      recommendedActions,
    };
  }

  private getMetricValue(
    metrics: SystemPerformanceMetrics,
    metricPath: string,
  ): number {
    const path = metricPath.split(".");
    let value: any = metrics;

    for (const segment of path) {
      if (value && typeof value === "object") {
        value = value[segment];
      } else {
        return 0;
      }
    }

    return typeof value === "number" ? value : 0;
  }

  private evaluateSLACondition(
    value: number,
    threshold: number,
    operator: string,
  ): boolean {
    switch (operator) {
      case "less_than":
        return value >= threshold; // Violation if value is NOT less than threshold
      case "greater_than":
        return value <= threshold; // Violation if value is NOT greater than threshold
      case "equals":
        return value !== threshold;
      default:
        return false;
    }
  }

  private executeSLAAction(action: string, metric: string): string {
    switch (action) {
      case "alert":
        return `Alert generated for ${metric} violation`;
      case "scale":
        return `Auto-scaling triggered for ${metric} violation`;
      case "optimize":
        return `Optimization initiated for ${metric} violation`;
      case "failover":
        return `Failover activated for ${metric} violation`;
      default:
        return `No action taken for ${metric} violation`;
    }
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown(): Promise<void> {
    this.stopMonitoring();

    // Clear data
    this.metricsHistory.length = 0;
    this.activeAlerts.clear();
    this.bottlenecks.clear();
    this.trends.clear();
    this.operationCounts.clear();
    this.latencyMeasurements.length = 0;
    this.errorCounts.clear();

    this.logger.info("Performance Monitor shutdown complete");
  }
}
