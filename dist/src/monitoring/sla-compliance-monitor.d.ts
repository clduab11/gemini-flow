/**
 * SLA Compliance Monitoring System
 * Ensures 99.9% uptime SLA compliance with comprehensive monitoring and reporting
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { CustomMetricsCollector } from "./custom-metrics-dashboard";
import { SyntheticMonitor } from "./synthetic-monitoring";
interface SLAConfig {
    targets: {
        availability: number;
        responseTime: number;
        errorRate: number;
        throughput: number;
    };
    measurement: {
        window: number;
        samples: number;
        retention: number;
    };
    reporting: {
        intervals: ("hourly" | "daily" | "weekly" | "monthly")[];
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
    triggerAfter: number;
    actions: EscalationAction[];
}
interface EscalationAction {
    type: "alert" | "auto_scale" | "failover" | "incident";
    config: Record<string, any>;
}
interface SLAMeasurement {
    timestamp: number;
    window: {
        start: number;
        end: number;
        duration: number;
    };
    availability: {
        uptime: number;
        downtime: number;
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
        type: "hourly" | "daily" | "weekly" | "monthly";
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
    duration: number;
    type: "availability" | "response_time" | "error_rate" | "throughput";
    actual: number;
    target: number;
    impact: "low" | "medium" | "high" | "critical";
    rootCause?: string;
    resolution?: string;
}
interface SLACredit {
    timestamp: number;
    reason: string;
    percentage: number;
    amount: number;
    applied: boolean;
}
export declare class SLAComplianceMonitor extends EventEmitter {
    private logger;
    private config;
    private metricsCollector;
    private syntheticMonitor;
    private measurements;
    private violations;
    private credits;
    private isRunning;
    private monitoringTimer?;
    private reportingTimers;
    private currentEscalationLevel;
    private healthChecks;
    private realTimeMetrics;
    constructor(config: SLAConfig, metricsCollector: CustomMetricsCollector, syntheticMonitor: SyntheticMonitor);
    /**
     * Start SLA compliance monitoring
     */
    start(): Promise<void>;
    /**
     * Stop SLA compliance monitoring
     */
    stop(): Promise<void>;
    /**
     * Start continuous monitoring
     */
    private startContinuousMonitoring;
    /**
     * Perform SLA measurement
     */
    private performSLAMeasurement;
    /**
     * Calculate availability percentage
     */
    private calculateAvailability;
    /**
     * Calculate performance metrics
     */
    private calculatePerformanceMetrics;
    /**
     * Calculate reliability metrics
     */
    private calculateReliabilityMetrics;
    /**
     * Calculate throughput metrics
     */
    private calculateThroughputMetrics;
    /**
     * Check SLA compliance
     */
    private checkCompliance;
    /**
     * Check for SLA violations
     */
    private checkForViolations;
    /**
     * Determine impact level
     */
    private determineImpact;
    /**
     * Handle SLA violation
     */
    private handleViolation;
    /**
     * Calculate SLA credit
     */
    private calculateCredit;
    /**
     * Handle escalation
     */
    private handleEscalation;
    /**
     * Calculate continuous violation duration
     */
    private calculateContinuousViolationDuration;
    /**
     * Execute escalation action
     */
    private executeEscalationAction;
    private sendEscalationAlert;
    private triggerAutoScaling;
    private triggerFailover;
    private createIncident;
    /**
     * Start health checks
     */
    private startHealthChecks;
    /**
     * Perform health checks
     */
    private performHealthChecks;
    /**
     * Record health check metrics
     */
    private recordHealthCheckMetrics;
    /**
     * Record SLA metrics
     */
    private recordSLAMetrics;
    /**
     * Start reporting
     */
    private startReporting;
    /**
     * Generate SLA report
     */
    generateReport(type: "hourly" | "daily" | "weekly" | "monthly"): Promise<SLAReport>;
    /**
     * Calculate report summary
     */
    private calculateReportSummary;
    /**
     * Generate recommendations
     */
    private generateRecommendations;
    /**
     * Store report
     */
    private storeReport;
    /**
     * Send report
     */
    private sendReport;
    /**
     * Generate final report
     */
    private generateFinalReport;
    /**
     * Setup listeners
     */
    private setupSyntheticMonitoringListeners;
    private setupMetricsCollectorListeners;
    /**
     * Record request
     */
    recordRequest(success: boolean, responseTime: number): void;
    /**
     * Record incident
     */
    recordIncident(id: string, startTime: number, endTime?: number): void;
    /**
     * Get current SLA status
     */
    getCurrentSLAStatus(): any;
    private calculateCurrentUptime;
    private getHealthStatus;
}
export declare const DEFAULT_SLA_CONFIG: SLAConfig;
export type { SLAConfig, SLAMeasurement, SLAReport, SLAViolation, SLACredit };
//# sourceMappingURL=sla-compliance-monitor.d.ts.map