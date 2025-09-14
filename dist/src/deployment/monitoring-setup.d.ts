import { GcpOperationsSuiteIntegration } from '../core/performance/gcp-operations-suite-integration';
/**
 * @interface MonitoringSetupConfig
 * @description Configuration for Monitoring Setup.
 */
export interface MonitoringSetupConfig {
    projectID: string;
}
/**
 * @interface MonitoringSetupOperations
 * @description Defines operations for setting up comprehensive monitoring and alerting.
 */
export interface MonitoringSetupOperations {
    configureOperationsSuite(): Promise<void>;
    createCustomDashboards(): Promise<void>;
    setupAlertingRules(): Promise<void>;
    configureSlaMonitoring(): Promise<void>;
    setupLogAggregation(): Promise<void>;
    setupPerformanceAlerts(): Promise<void>;
}
/**
 * @class MonitoringSetup
 * @description Configures Google Cloud Operations Suite for comprehensive monitoring and alerting.
 */
export declare class MonitoringSetup implements MonitoringSetupOperations {
    private config;
    private logger;
    private gcpOperations;
    constructor(config: MonitoringSetupConfig, gcpOperations: GcpOperationsSuiteIntegration);
    /**
     * Configures Google Cloud Operations Suite for the project.
     * @returns {Promise<void>}
     */
    configureOperationsSuite(): Promise<void>;
    /**
     * Creates custom dashboards for system monitoring.
     * @returns {Promise<void>}
     */
    createCustomDashboards(): Promise<void>;
    /**
     * Sets up alerting rules for critical system events.
     * @returns {Promise<void>}
     */
    setupAlertingRules(): Promise<void>;
    /**
     * Configures SLA monitoring and reporting.
     * @returns {Promise<void>}
     */
    configureSlaMonitoring(): Promise<void>;
    /**
     * Sets up log aggregation and analysis.
     * @returns {Promise<void>}
     */
    setupLogAggregation(): Promise<void>;
    /**
     * Sets up performance tracking and optimization alerts.
     * @returns {Promise<void>}
     */
    setupPerformanceAlerts(): Promise<void>;
}
//# sourceMappingURL=monitoring-setup.d.ts.map