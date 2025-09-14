import { EventBus } from './event-bus';
import { GcpOperationsSuiteIntegration } from '../performance/gcp-operations-suite-integration';
/**
 * @interface RealTimeMonitoringConfig
 * @description Configuration for Real-Time Monitoring.
 */
export interface RealTimeMonitoringConfig {
    projectID: string;
}
/**
 * @interface RealTimeMonitoringOperations
 * @description Defines operations for real-time monitoring and observability.
 */
export interface RealTimeMonitoringOperations {
    startEventStreamMonitoring(): Promise<void>;
    setupPerformanceDashboards(): Promise<void>;
    configureAutomatedAlerting(): Promise<void>;
    runEventDrivenHealthChecks(): Promise<void>;
    enablePredictiveAlerting(): Promise<void>;
}
/**
 * @class RealTimeMonitoring
 * @description Provides live event stream visualization, real-time performance dashboards, and automated alerting.
 */
export declare class RealTimeMonitoring implements RealTimeMonitoringOperations {
    private config;
    private logger;
    private eventBus;
    private gcpOperations;
    constructor(config: RealTimeMonitoringConfig, eventBus: EventBus, gcpOperations: GcpOperationsSuiteIntegration);
    /**
     * Starts monitoring live event streams for visualization and analysis.
     * @returns {Promise<void>}
     */
    startEventStreamMonitoring(): Promise<void>;
    /**
     * Sets up real-time performance dashboards using Google Cloud Monitoring.
     * @returns {Promise<void>}
     */
    setupPerformanceDashboards(): Promise<void>;
    /**
     * Configures automated alerting based on event patterns and anomalies.
     * @returns {Promise<void>}
     */
    configureAutomatedAlerting(): Promise<void>;
    /**
     * Runs event-driven health checks and system validation.
     * @returns {Promise<void>}
     */
    runEventDrivenHealthChecks(): Promise<void>;
    /**
     * Enables predictive alerting based on event trend analysis (conceptual).
     * @returns {Promise<void>}
     */
    enablePredictiveAlerting(): Promise<void>;
}
//# sourceMappingURL=real-time-monitoring.d.ts.map