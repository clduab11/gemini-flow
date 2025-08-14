/**
 * SLA Compliance Monitoring System
 * Ensures 99.9% uptime SLA compliance with comprehensive monitoring and reporting
 */

import { EventEmitter } from 'events';
import { Logger } from '../utils/logger';
import { CustomMetricsCollector } from './custom-metrics-dashboard';
import { SyntheticMonitor } from './synthetic-monitoring';

interface SLAConfig {
  targets: {
    availability: number; // 99.9%
    responseTime: number; // milliseconds
    errorRate: number; // percentage
    throughput: number; // requests per minute
  };
  measurement: {
    window: number; // measurement window in minutes
    samples: number; // number of samples per window
    retention: number; // data retention in days
  };
  reporting: {
    intervals: ('hourly' | 'daily' | 'weekly' | 'monthly')[];
    recipients: string[];
    dashboard: boolean;
  };
  penalties: {
    enabled: boolean;
    thresholds: SLAPenaltyThreshold[];
  };
  escalation: {
    levels: EscalationLevel[];
    autoRemediation: boolean;
  };
}

interface SLAPenaltyThreshold {
  availabilityBelow: number;
  creditPercentage: number;
  description: string;
}

interface EscalationLevel {
  level: number;
  triggerAfter: number; // minutes of SLA violation
  actions: EscalationAction[];
}

interface EscalationAction {
  type: 'alert' | 'auto_scale' | 'failover' | 'incident';
  config: Record<string, any>;
}

interface SLAMeasurement {
  timestamp: number;
  window: {
    start: number;
    end: number;
    duration: number; // minutes
  };
  availability: {
    uptime: number; // minutes
    downtime: number; // minutes
    percentage: number;
  };
  performance: {
    avgResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
  };
  reliability: {
    totalRequests: number;
    successfulRequests: number;
    errorRate: number;
  };
  throughput: {
    requestsPerMinute: number;
    peakRpm: number;
  };
  compliance: {
    availability: boolean;
    responseTime: boolean;
    errorRate: boolean;
    throughput: boolean;
    overall: boolean;
  };
}

interface SLAReport {
  period: {
    start: Date;
    end: Date;
    type: 'hourly' | 'daily' | 'weekly' | 'monthly';
  };
  summary: {
    overallCompliance: number;
    availabilityCompliance: number;
    performanceCompliance: number;
    reliabilityCompliance: number;
  };
  measurements: SLAMeasurement[];
  violations: SLAViolation[];
  credits: SLACredit[];
  recommendations: string[];
}

interface SLAViolation {
  timestamp: number;
  duration: number; // minutes
  type: 'availability' | 'response_time' | 'error_rate' | 'throughput';
  actual: number;
  target: number;
  impact: 'low' | 'medium' | 'high' | 'critical';
  rootCause?: string;
  resolution?: string;
}

interface SLACredit {
  timestamp: number;
  reason: string;
  percentage: number;
  amount: number; // monetary value if applicable
  applied: boolean;
}

interface HealthCheckResult {
  endpoint: string;
  status: 'up' | 'down' | 'degraded';
  responseTime: number;
  statusCode?: number;
  error?: string;
  timestamp: number;
}

export class SLAComplianceMonitor extends EventEmitter {
  private logger: Logger;
  private config: SLAConfig;
  private metricsCollector: CustomMetricsCollector;
  private syntheticMonitor: SyntheticMonitor;
  private measurements: SLAMeasurement[] = [];
  private violations: SLAViolation[] = [];
  private credits: SLACredit[] = [];
  private isRunning: boolean = false;
  private monitoringTimer?: NodeJS.Timeout;
  private reportingTimers: Map<string, NodeJS.Timeout> = new Map();
  private currentEscalationLevel: number = 0;
  private healthChecks: Map<string, HealthCheckResult> = new Map();

  // Real-time tracking
  private realTimeMetrics = {
    startTime: Date.now(),
    totalRequests: 0,
    successfulRequests: 0,
    responseTimes: [] as number[],
    downtime: 0, // milliseconds
    lastHealthCheck: Date.now(),
    activeIncidents: new Map<string, any>()
  };

  constructor(
    config: SLAConfig,
    metricsCollector: CustomMetricsCollector,
    syntheticMonitor: SyntheticMonitor
  ) {
    super();
    this.config = config;
    this.metricsCollector = metricsCollector;
    this.syntheticMonitor = syntheticMonitor;
    this.logger = new Logger('SLAComplianceMonitor');
  }

  /**
   * Start SLA compliance monitoring
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('SLA compliance monitoring already running');
      return;
    }

    try {
      this.logger.info('Starting SLA compliance monitoring...');

      // Initialize baseline metrics
      this.realTimeMetrics.startTime = Date.now();

      // Start continuous monitoring
      this.startContinuousMonitoring();

      // Start health checks
      this.startHealthChecks();

      // Start reporting
      this.startReporting();

      // Listen to synthetic monitoring events
      this.setupSyntheticMonitoringListeners();

      // Listen to metrics collector events
      this.setupMetricsCollectorListeners();

      this.isRunning = true;
      this.logger.info('SLA compliance monitoring started');

    } catch (error) {
      this.logger.error('Failed to start SLA compliance monitoring:', error);
      throw error;
    }
  }

  /**
   * Stop SLA compliance monitoring
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;

    this.logger.info('Stopping SLA compliance monitoring...');

    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
    }

    for (const [interval, timer] of this.reportingTimers) {
      clearInterval(timer);
      this.logger.debug(`Stopped ${interval} reporting timer`);
    }
    this.reportingTimers.clear();

    // Generate final report
    await this.generateFinalReport();

    this.isRunning = false;
    this.logger.info('SLA compliance monitoring stopped');
  }

  /**
   * Start continuous monitoring
   */
  private startContinuousMonitoring(): void {
    // Monitor every minute
    this.monitoringTimer = setInterval(() => {
      this.performSLAMeasurement();
    }, 60000);

    // Initial measurement
    this.performSLAMeasurement();
  }

  /**
   * Perform SLA measurement
   */
  private async performSLAMeasurement(): Promise<void> {
    try {
      const now = Date.now();
      const windowStart = now - (this.config.measurement.window * 60 * 1000);

      // Calculate availability
      const availability = this.calculateAvailability(windowStart, now);

      // Calculate performance metrics
      const performance = this.calculatePerformanceMetrics(windowStart, now);

      // Calculate reliability metrics
      const reliability = this.calculateReliabilityMetrics(windowStart, now);

      // Calculate throughput metrics
      const throughput = this.calculateThroughputMetrics(windowStart, now);

      // Check compliance
      const compliance = this.checkCompliance(availability, performance, reliability, throughput);

      const measurement: SLAMeasurement = {
        timestamp: now,
        window: {
          start: windowStart,
          end: now,
          duration: this.config.measurement.window
        },
        availability,
        performance,
        reliability,
        throughput,
        compliance
      };

      // Store measurement
      this.measurements.push(measurement);

      // Keep only recent measurements (based on retention policy)
      const retentionCutoff = now - (this.config.measurement.retention * 24 * 60 * 60 * 1000);
      this.measurements = this.measurements.filter(m => m.timestamp > retentionCutoff);

      // Check for violations
      await this.checkForViolations(measurement);

      // Record metrics
      this.recordSLAMetrics(measurement);

      // Emit measurement event
      this.emit('measurement', measurement);

      this.logger.debug(`SLA measurement completed: ${JSON.stringify(compliance)}`);

    } catch (error) {
      this.logger.error('Error performing SLA measurement:', error);
    }
  }

  /**
   * Calculate availability percentage
   */
  private calculateAvailability(windowStart: number, windowEnd: number): SLAMeasurement['availability'] {
    const windowDuration = windowEnd - windowStart;
    const windowMinutes = windowDuration / (60 * 1000);

    // Calculate downtime from health checks and incident data
    let totalDowntime = 0;

    // Add current downtime if system is down
    const latestHealthCheck = Array.from(this.healthChecks.values()).pop();
    if (latestHealthCheck && latestHealthCheck.status === 'down') {
      const currentDowntime = Date.now() - latestHealthCheck.timestamp;
      totalDowntime += currentDowntime;
    }

    // Add tracked incidents within the window
    for (const [_, incident] of this.realTimeMetrics.activeIncidents) {
      if (incident.startTime >= windowStart) {
        const incidentDuration = incident.endTime ? 
          (incident.endTime - incident.startTime) : 
          (Date.now() - incident.startTime);
        totalDowntime += incidentDuration;
      }
    }

    const downtimeMinutes = totalDowntime / (60 * 1000);
    const uptimeMinutes = windowMinutes - downtimeMinutes;
    const availability = (uptimeMinutes / windowMinutes) * 100;

    return {
      uptime: uptimeMinutes,
      downtime: downtimeMinutes,
      percentage: Math.max(0, Math.min(100, availability))
    };
  }

  /**
   * Calculate performance metrics
   */
  private calculatePerformanceMetrics(windowStart: number, windowEnd: number): SLAMeasurement['performance'] {
    // Filter response times within the window
    const windowResponseTimes = this.realTimeMetrics.responseTimes.filter(time => {
      // In real implementation, we'd need timestamps for each response time
      return true; // Simplified for example
    });

    if (windowResponseTimes.length === 0) {
      return {
        avgResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0
      };
    }

    const sortedTimes = [...windowResponseTimes].sort((a, b) => a - b);
    const avg = sortedTimes.reduce((sum, time) => sum + time, 0) / sortedTimes.length;
    const p95Index = Math.floor(sortedTimes.length * 0.95);
    const p99Index = Math.floor(sortedTimes.length * 0.99);

    return {
      avgResponseTime: avg,
      p95ResponseTime: sortedTimes[p95Index] || 0,
      p99ResponseTime: sortedTimes[p99Index] || 0
    };
  }

  /**
   * Calculate reliability metrics
   */
  private calculateReliabilityMetrics(windowStart: number, windowEnd: number): SLAMeasurement['reliability'] {
    const totalRequests = this.realTimeMetrics.totalRequests;
    const successfulRequests = this.realTimeMetrics.successfulRequests;
    const errorRate = totalRequests > 0 ? 
      ((totalRequests - successfulRequests) / totalRequests) * 100 : 0;

    return {
      totalRequests,
      successfulRequests,
      errorRate
    };
  }

  /**
   * Calculate throughput metrics
   */
  private calculateThroughputMetrics(windowStart: number, windowEnd: number): SLAMeasurement['throughput'] {
    const windowMinutes = (windowEnd - windowStart) / (60 * 1000);
    const requestsPerMinute = this.realTimeMetrics.totalRequests / windowMinutes;

    // In real implementation, we'd track peak RPM
    const peakRpm = requestsPerMinute * 1.5; // Simplified estimation

    return {
      requestsPerMinute,
      peakRpm
    };
  }

  /**
   * Check SLA compliance
   */
  private checkCompliance(
    availability: SLAMeasurement['availability'],
    performance: SLAMeasurement['performance'],
    reliability: SLAMeasurement['reliability'],
    throughput: SLAMeasurement['throughput']
  ): SLAMeasurement['compliance'] {
    const availabilityCompliant = availability.percentage >= this.config.targets.availability;
    const responseTimeCompliant = performance.avgResponseTime <= this.config.targets.responseTime;
    const errorRateCompliant = reliability.errorRate <= this.config.targets.errorRate;
    const throughputCompliant = throughput.requestsPerMinute >= this.config.targets.throughput;

    return {
      availability: availabilityCompliant,
      responseTime: responseTimeCompliant,
      errorRate: errorRateCompliant,
      throughput: throughputCompliant,
      overall: availabilityCompliant && responseTimeCompliant && errorRateCompliant && throughputCompliant
    };
  }

  /**
   * Check for SLA violations
   */
  private async checkForViolations(measurement: SLAMeasurement): Promise<void> {
    const violations: SLAViolation[] = [];

    // Check availability violation
    if (!measurement.compliance.availability) {
      violations.push({
        timestamp: measurement.timestamp,
        duration: this.config.measurement.window,
        type: 'availability',
        actual: measurement.availability.percentage,
        target: this.config.targets.availability,
        impact: this.determineImpact(measurement.availability.percentage, this.config.targets.availability)
      });
    }

    // Check response time violation
    if (!measurement.compliance.responseTime) {
      violations.push({
        timestamp: measurement.timestamp,
        duration: this.config.measurement.window,
        type: 'response_time',
        actual: measurement.performance.avgResponseTime,
        target: this.config.targets.responseTime,
        impact: this.determineImpact(measurement.performance.avgResponseTime, this.config.targets.responseTime, true)
      });
    }

    // Check error rate violation
    if (!measurement.compliance.errorRate) {
      violations.push({
        timestamp: measurement.timestamp,
        duration: this.config.measurement.window,
        type: 'error_rate',
        actual: measurement.reliability.errorRate,
        target: this.config.targets.errorRate,
        impact: this.determineImpact(measurement.reliability.errorRate, this.config.targets.errorRate, true)
      });
    }

    // Check throughput violation
    if (!measurement.compliance.throughput) {
      violations.push({
        timestamp: measurement.timestamp,
        duration: this.config.measurement.window,
        type: 'throughput',
        actual: measurement.throughput.requestsPerMinute,
        target: this.config.targets.throughput,
        impact: this.determineImpact(measurement.throughput.requestsPerMinute, this.config.targets.throughput)
      });
    }

    // Store violations
    this.violations.push(...violations);

    // Handle violations
    for (const violation of violations) {
      await this.handleViolation(violation);
    }
  }

  /**
   * Determine impact level
   */
  private determineImpact(actual: number, target: number, higher_is_worse: boolean = false): SLAViolation['impact'] {
    const diff = higher_is_worse ? 
      ((actual - target) / target) : 
      ((target - actual) / target);

    if (diff >= 0.5) return 'critical';
    if (diff >= 0.2) return 'high';
    if (diff >= 0.1) return 'medium';
    return 'low';
  }

  /**
   * Handle SLA violation
   */
  private async handleViolation(violation: SLAViolation): Promise<void> {
    this.logger.warn(`SLA violation detected: ${violation.type}`, {
      actual: violation.actual,
      target: violation.target,
      impact: violation.impact
    });

    // Emit violation event
    this.emit('violation', violation);

    // Calculate credits if enabled
    if (this.config.penalties.enabled) {
      const credit = this.calculateCredit(violation);
      if (credit) {
        this.credits.push(credit);
        this.emit('credit', credit);
      }
    }

    // Handle escalation
    if (this.config.escalation.autoRemediation) {
      await this.handleEscalation(violation);
    }
  }

  /**
   * Calculate SLA credit
   */
  private calculateCredit(violation: SLAViolation): SLACredit | null {
    if (violation.type !== 'availability') return null;

    // Find applicable penalty threshold
    const threshold = this.config.penalties.thresholds.find(t => 
      violation.actual < t.availabilityBelow
    );

    if (!threshold) return null;

    return {
      timestamp: violation.timestamp,
      reason: `Availability ${violation.actual}% below SLA target of ${violation.target}%`,
      percentage: threshold.creditPercentage,
      amount: 0, // Would be calculated based on service fees
      applied: false
    };
  }

  /**
   * Handle escalation
   */
  private async handleEscalation(violation: SLAViolation): Promise<void> {
    // Find appropriate escalation level
    const violationDuration = this.calculateContinuousViolationDuration(violation.type);
    const escalationLevel = this.config.escalation.levels.find(level => 
      violationDuration >= level.triggerAfter
    );

    if (!escalationLevel || escalationLevel.level <= this.currentEscalationLevel) {
      return;
    }

    this.currentEscalationLevel = escalationLevel.level;
    this.logger.warn(`Escalating to level ${escalationLevel.level} due to ${violation.type} violation`);

    // Execute escalation actions
    for (const action of escalationLevel.actions) {
      await this.executeEscalationAction(action, violation);
    }

    this.emit('escalation', { level: escalationLevel.level, violation });
  }

  /**
   * Calculate continuous violation duration
   */
  private calculateContinuousViolationDuration(violationType: string): number {
    // Find consecutive violations of the same type
    const recentViolations = this.violations
      .filter(v => v.type === violationType)
      .sort((a, b) => b.timestamp - a.timestamp);

    if (recentViolations.length === 0) return 0;

    let duration = 0;
    const windowSize = this.config.measurement.window * 60 * 1000; // in milliseconds

    for (let i = 0; i < recentViolations.length; i++) {
      const violation = recentViolations[i];
      
      if (i === 0) {
        duration += violation.duration * 60 * 1000; // convert to milliseconds
      } else {
        const previousViolation = recentViolations[i - 1];
        const gap = previousViolation.timestamp - violation.timestamp;
        
        // If gap is larger than window size, break the sequence
        if (gap > windowSize) break;
        
        duration += violation.duration * 60 * 1000;
      }
    }

    return duration / (60 * 1000); // return in minutes
  }

  /**
   * Execute escalation action
   */
  private async executeEscalationAction(action: EscalationAction, violation: SLAViolation): Promise<void> {
    try {
      switch (action.type) {
        case 'alert':
          await this.sendEscalationAlert(action.config, violation);
          break;
        case 'auto_scale':
          await this.triggerAutoScaling(action.config, violation);
          break;
        case 'failover':
          await this.triggerFailover(action.config, violation);
          break;
        case 'incident':
          await this.createIncident(action.config, violation);
          break;
      }
    } catch (error) {
      this.logger.error(`Failed to execute escalation action ${action.type}:`, error);
    }
  }

  private async sendEscalationAlert(config: any, violation: SLAViolation): Promise<void> {
    // Implementation for sending escalation alerts
    this.logger.info(`Sending escalation alert for ${violation.type} violation`);
  }

  private async triggerAutoScaling(config: any, violation: SLAViolation): Promise<void> {
    // Implementation for auto-scaling
    this.logger.info(`Triggering auto-scaling for ${violation.type} violation`);
  }

  private async triggerFailover(config: any, violation: SLAViolation): Promise<void> {
    // Implementation for failover
    this.logger.info(`Triggering failover for ${violation.type} violation`);
  }

  private async createIncident(config: any, violation: SLAViolation): Promise<void> {
    // Implementation for incident creation
    this.logger.info(`Creating incident for ${violation.type} violation`);
  }

  /**
   * Start health checks
   */
  private startHealthChecks(): void {
    // Health check every 30 seconds
    setInterval(() => {
      this.performHealthChecks();
    }, 30000);

    // Initial health check
    this.performHealthChecks();
  }

  /**
   * Perform health checks
   */
  private async performHealthChecks(): Promise<void> {
    const healthCheckEndpoints = [
      '/health',
      '/api/health',
      '/api/v1/health',
      '/status'
    ];

    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';

    for (const endpoint of healthCheckEndpoints) {
      try {
        const startTime = Date.now();
        const response = await fetch(`${baseUrl}${endpoint}`, {
          method: 'GET',
          timeout: 5000
        });

        const responseTime = Date.now() - startTime;
        const status = response.ok ? 'up' : 'degraded';

        const result: HealthCheckResult = {
          endpoint,
          status,
          responseTime,
          statusCode: response.status,
          timestamp: Date.now()
        };

        this.healthChecks.set(endpoint, result);
        this.realTimeMetrics.lastHealthCheck = Date.now();

        // Record metrics
        this.recordHealthCheckMetrics(result);

      } catch (error) {
        const result: HealthCheckResult = {
          endpoint,
          status: 'down',
          responseTime: 0,
          error: (error as Error).message,
          timestamp: Date.now()
        };

        this.healthChecks.set(endpoint, result);
        this.logger.warn(`Health check failed for ${endpoint}:`, error);
      }
    }
  }

  /**
   * Record health check metrics
   */
  private recordHealthCheckMetrics(result: HealthCheckResult): void {
    this.metricsCollector.recordMetric(
      'health_check_response_time',
      result.responseTime,
      'histogram',
      { endpoint: result.endpoint, status: result.status },
      'ms'
    );

    this.metricsCollector.recordMetric(
      'health_check_status',
      result.status === 'up' ? 1 : 0,
      'gauge',
      { endpoint: result.endpoint }
    );
  }

  /**
   * Record SLA metrics
   */
  private recordSLAMetrics(measurement: SLAMeasurement): void {
    this.metricsCollector.recordSLAMetrics({
      availability: measurement.availability.percentage,
      responseTime: measurement.performance.avgResponseTime,
      errorRate: measurement.reliability.errorRate,
      throughput: measurement.throughput.requestsPerMinute
    });

    // Record compliance metrics
    this.metricsCollector.recordMetric(
      'sla_compliance_overall',
      measurement.compliance.overall ? 1 : 0,
      'gauge'
    );

    this.metricsCollector.recordMetric(
      'sla_compliance_availability',
      measurement.compliance.availability ? 1 : 0,
      'gauge'
    );

    this.metricsCollector.recordMetric(
      'sla_compliance_response_time',
      measurement.compliance.responseTime ? 1 : 0,
      'gauge'
    );

    this.metricsCollector.recordMetric(
      'sla_compliance_error_rate',
      measurement.compliance.errorRate ? 1 : 0,
      'gauge'
    );
  }

  /**
   * Start reporting
   */
  private startReporting(): void {
    for (const interval of this.config.reporting.intervals) {
      let intervalMs: number;
      
      switch (interval) {
        case 'hourly':
          intervalMs = 60 * 60 * 1000;
          break;
        case 'daily':
          intervalMs = 24 * 60 * 60 * 1000;
          break;
        case 'weekly':
          intervalMs = 7 * 24 * 60 * 60 * 1000;
          break;
        case 'monthly':
          intervalMs = 30 * 24 * 60 * 60 * 1000;
          break;
      }

      const timer = setInterval(() => {
        this.generateReport(interval);
      }, intervalMs);

      this.reportingTimers.set(interval, timer);
      this.logger.debug(`Started ${interval} reporting timer`);
    }
  }

  /**
   * Generate SLA report
   */
  async generateReport(type: 'hourly' | 'daily' | 'weekly' | 'monthly'): Promise<SLAReport> {
    const now = new Date();
    let start: Date;

    switch (type) {
      case 'hourly':
        start = new Date(now.getTime() - (60 * 60 * 1000));
        break;
      case 'daily':
        start = new Date(now.getTime() - (24 * 60 * 60 * 1000));
        break;
      case 'weekly':
        start = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        break;
      case 'monthly':
        start = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        break;
    }

    const periodMeasurements = this.measurements.filter(m => 
      m.timestamp >= start.getTime() && m.timestamp <= now.getTime()
    );

    const periodViolations = this.violations.filter(v => 
      v.timestamp >= start.getTime() && v.timestamp <= now.getTime()
    );

    const periodCredits = this.credits.filter(c => 
      c.timestamp >= start.getTime() && c.timestamp <= now.getTime()
    );

    // Calculate summary
    const summary = this.calculateReportSummary(periodMeasurements);

    // Generate recommendations
    const recommendations = this.generateRecommendations(periodMeasurements, periodViolations);

    const report: SLAReport = {
      period: { start, end: now, type },
      summary,
      measurements: periodMeasurements,
      violations: periodViolations,
      credits: periodCredits,
      recommendations
    };

    // Store report
    await this.storeReport(report);

    // Send report
    await this.sendReport(report);

    this.emit('report', report);
    this.logger.info(`Generated ${type} SLA report with ${periodMeasurements.length} measurements`);

    return report;
  }

  /**
   * Calculate report summary
   */
  private calculateReportSummary(measurements: SLAMeasurement[]): SLAReport['summary'] {
    if (measurements.length === 0) {
      return {
        overallCompliance: 0,
        availabilityCompliance: 0,
        performanceCompliance: 0,
        reliabilityCompliance: 0
      };
    }

    const compliantMeasurements = measurements.filter(m => m.compliance.overall).length;
    const availabilityCompliant = measurements.filter(m => m.compliance.availability).length;
    const performanceCompliant = measurements.filter(m => m.compliance.responseTime).length;
    const reliabilityCompliant = measurements.filter(m => m.compliance.errorRate).length;

    return {
      overallCompliance: (compliantMeasurements / measurements.length) * 100,
      availabilityCompliance: (availabilityCompliant / measurements.length) * 100,
      performanceCompliance: (performanceCompliant / measurements.length) * 100,
      reliabilityCompliance: (reliabilityCompliant / measurements.length) * 100
    };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    measurements: SLAMeasurement[], 
    violations: SLAViolation[]
  ): string[] {
    const recommendations: string[] = [];

    // Availability recommendations
    const availabilityViolations = violations.filter(v => v.type === 'availability');
    if (availabilityViolations.length > 0) {
      recommendations.push('Consider implementing redundancy and failover mechanisms to improve availability');
      recommendations.push('Review incident response procedures and reduce MTTR (Mean Time To Recovery)');
    }

    // Performance recommendations
    const responseTimeViolations = violations.filter(v => v.type === 'response_time');
    if (responseTimeViolations.length > 0) {
      recommendations.push('Optimize application performance and consider auto-scaling');
      recommendations.push('Implement caching strategies and CDN optimization');
    }

    // Reliability recommendations
    const errorRateViolations = violations.filter(v => v.type === 'error_rate');
    if (errorRateViolations.length > 0) {
      recommendations.push('Review error handling and implement better retry mechanisms');
      recommendations.push('Improve input validation and API gateway configurations');
    }

    return recommendations;
  }

  /**
   * Store report
   */
  private async storeReport(report: SLAReport): Promise<void> {
    // Implementation for storing reports (database, file system, etc.)
    this.logger.debug(`Storing ${report.period.type} SLA report`);
  }

  /**
   * Send report
   */
  private async sendReport(report: SLAReport): Promise<void> {
    // Implementation for sending reports to recipients
    this.logger.debug(`Sending ${report.period.type} SLA report to ${this.config.reporting.recipients.length} recipients`);
  }

  /**
   * Generate final report
   */
  private async generateFinalReport(): Promise<void> {
    const finalReport = await this.generateReport('daily');
    this.logger.info('Final SLA report generated');
  }

  /**
   * Setup listeners
   */
  private setupSyntheticMonitoringListeners(): void {
    this.syntheticMonitor.on('result', (result: any) => {
      // Track synthetic monitoring results
      this.realTimeMetrics.totalRequests++;
      if (result.success) {
        this.realTimeMetrics.successfulRequests++;
      }
      if (result.responseTime) {
        this.realTimeMetrics.responseTimes.push(result.responseTime);
      }
    });

    this.syntheticMonitor.on('critical', (alert: any) => {
      // Handle critical alerts from synthetic monitoring
      this.logger.warn('Critical alert from synthetic monitoring:', alert);
    });
  }

  private setupMetricsCollectorListeners(): void {
    this.metricsCollector.on('metric', (metric: any) => {
      // Process relevant metrics for SLA calculation
      if (metric.name.includes('response_time') || metric.name.includes('error_rate')) {
        // Update real-time metrics
      }
    });
  }

  /**
   * Record request
   */
  public recordRequest(success: boolean, responseTime: number): void {
    this.realTimeMetrics.totalRequests++;
    if (success) {
      this.realTimeMetrics.successfulRequests++;
    }
    this.realTimeMetrics.responseTimes.push(responseTime);

    // Keep only recent response times (last 10000)
    if (this.realTimeMetrics.responseTimes.length > 10000) {
      this.realTimeMetrics.responseTimes = this.realTimeMetrics.responseTimes.slice(-10000);
    }
  }

  /**
   * Record incident
   */
  public recordIncident(id: string, startTime: number, endTime?: number): void {
    this.realTimeMetrics.activeIncidents.set(id, { startTime, endTime });
    
    if (endTime) {
      this.realTimeMetrics.downtime += (endTime - startTime);
    }
  }

  /**
   * Get current SLA status
   */
  public getCurrentSLAStatus(): any {
    const latestMeasurement = this.measurements[this.measurements.length - 1];
    const recentViolations = this.violations.filter(v => 
      (Date.now() - v.timestamp) < (24 * 60 * 60 * 1000) // Last 24 hours
    );

    return {
      currentCompliance: latestMeasurement?.compliance || {
        availability: false,
        responseTime: false,
        errorRate: false,
        throughput: false,
        overall: false
      },
      recentViolations: recentViolations.length,
      escalationLevel: this.currentEscalationLevel,
      totalCredits: this.credits.reduce((sum, credit) => sum + credit.percentage, 0),
      uptime: this.calculateCurrentUptime(),
      healthStatus: this.getHealthStatus()
    };
  }

  private calculateCurrentUptime(): number {
    const totalTime = Date.now() - this.realTimeMetrics.startTime;
    const uptime = totalTime - this.realTimeMetrics.downtime;
    return (uptime / totalTime) * 100;
  }

  private getHealthStatus(): Record<string, any> {
    const status: Record<string, any> = {};
    for (const [endpoint, result] of this.healthChecks) {
      status[endpoint] = {
        status: result.status,
        responseTime: result.responseTime,
        lastCheck: new Date(result.timestamp).toISOString()
      };
    }
    return status;
  }
}

// Default configuration
export const DEFAULT_SLA_CONFIG: SLAConfig = {
  targets: {
    availability: 99.9, // 99.9%
    responseTime: 2000, // 2 seconds
    errorRate: 0.1, // 0.1%
    throughput: 100 // 100 requests per minute
  },
  measurement: {
    window: 5, // 5 minutes
    samples: 12, // 12 samples per hour
    retention: 90 // 90 days
  },
  reporting: {
    intervals: ['daily', 'weekly', 'monthly'],
    recipients: process.env.SLA_REPORT_RECIPIENTS?.split(',') || [],
    dashboard: true
  },
  penalties: {
    enabled: true,
    thresholds: [
      { availabilityBelow: 99.9, creditPercentage: 10, description: 'Below 99.9% availability' },
      { availabilityBelow: 99.0, creditPercentage: 25, description: 'Below 99.0% availability' },
      { availabilityBelow: 95.0, creditPercentage: 100, description: 'Below 95.0% availability' }
    ]
  },
  escalation: {
    levels: [
      {
        level: 1,
        triggerAfter: 5, // 5 minutes
        actions: [
          { type: 'alert', config: { severity: 'warning' } }
        ]
      },
      {
        level: 2,
        triggerAfter: 15, // 15 minutes
        actions: [
          { type: 'alert', config: { severity: 'critical' } },
          { type: 'auto_scale', config: { factor: 1.5 } }
        ]
      },
      {
        level: 3,
        triggerAfter: 30, // 30 minutes
        actions: [
          { type: 'incident', config: { priority: 'high' } },
          { type: 'failover', config: { automatic: true } }
        ]
      }
    ],
    autoRemediation: true
  }
};

// Export types
export type { 
  SLAConfig, 
  SLAMeasurement, 
  SLAReport, 
  SLAViolation, 
  SLACredit 
};