/**
 * Production Monitoring System Integration
 * Orchestrates all monitoring components for comprehensive observability
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
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
export declare class ProductionMonitoringSystem extends EventEmitter {
    private logger;
    private config;
    private isInitialized;
    private isRunning;
    private syntheticMonitor?;
    private rumMonitor?;
    private distributedTracing?;
    private metricsCollector?;
    private slaMonitor?;
    private healthStatus;
    private startTime;
    private componentErrors;
    constructor(config: MonitoringSystemConfig);
    /**
     * Initialize the complete monitoring system
     */
    initialize(): Promise<void>;
    /**
     * Start all monitoring components
     */
    start(): Promise<void>;
    /**
     * Stop all monitoring components
     */
    stop(): Promise<void>;
    /**
     * Initialize distributed tracing
     */
    private initializeDistributedTracing;
    /**
     * Initialize custom metrics collector
     */
    private initializeCustomMetrics;
    /**
     * Initialize synthetic monitoring
     */
    private initializeSyntheticMonitoring;
    /**
     * Initialize real user monitoring
     */
    private initializeRealUserMonitoring;
    /**
     * Initialize SLA compliance monitoring
     */
    private initializeSLACompliance;
    /**
     * Start individual components
     */
    private startSyntheticMonitoring;
    private startRealUserMonitoring;
    private startCustomMetrics;
    private startSLACompliance;
    /**
     * Setup cross-component event handling
     */
    private setupEventHandling;
    /**
     * Handle critical alerts
     */
    private handleCriticalAlert;
    /**
     * Handle metrics alerts
     */
    private handleMetricsAlert;
    /**
     * Handle SLA violations
     */
    private handleSLAViolation;
    /**
     * Handle SLA escalations
     */
    private handleSLAEscalation;
    /**
     * Send alert to configured channels
     */
    private sendAlert;
    /**
     * Send alert to specific channel
     */
    private sendToChannel;
    private sendEmailAlert;
    private sendSlackAlert;
    private sendWebhookAlert;
    private sendPagerDutyAlert;
    /**
     * Start health monitoring
     */
    private startHealthMonitoring;
    /**
     * Update component health
     */
    private updateComponentHealth;
    /**
     * Update overall health status
     */
    private updateHealthStatus;
    /**
     * Get component-specific metrics
     */
    private getComponentMetrics;
    /**
     * Get comprehensive system status
     */
    getSystemStatus(): {
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
    };
    /**
     * Get monitoring dashboard data
     */
    getDashboardData(): any;
    /**
     * Record custom event for monitoring
     */
    recordEvent(event: {
        type: string;
        source: string;
        data: any;
        severity?: "low" | "medium" | "high" | "critical";
    }): void;
    /**
     * Generate monitoring report
     */
    generateReport(type?: "summary" | "detailed"): Promise<any>;
    /**
     * Generate recommendations based on system status
     */
    private generateRecommendations;
}
export declare const DEFAULT_MONITORING_SYSTEM_CONFIG: MonitoringSystemConfig;
/**
 * Get or create the monitoring system instance
 */
export declare function getMonitoringSystem(config?: MonitoringSystemConfig): ProductionMonitoringSystem;
/**
 * Initialize and start the complete monitoring system
 */
export declare function initializeProductionMonitoring(config?: MonitoringSystemConfig): Promise<ProductionMonitoringSystem>;
export type { MonitoringSystemConfig, MonitoringHealth, ComponentHealth, AlertingChannel, };
//# sourceMappingURL=production-monitoring-system.d.ts.map