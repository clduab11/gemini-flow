import { GcpOperationsSuiteIntegration } from '../../core/performance/gcp-operations-suite-integration';
import { NeuralCoordinationModels } from '../../core/neural/coordination-models';
/**
 * @interface MonitoringConfig
 * @description Configuration for Production Monitoring.
 */
export interface MonitoringConfig {
    projectID: string;
    alertingThresholds: {
        [metric: string]: number;
    };
}
/**
 * @interface MonitoringOperations
 * @description Defines operations for comprehensive production monitoring and observability.
 */
export interface MonitoringOperations {
    recordCustomMetric(metricName: string, value: number, labels?: {
        [key: string]: string;
    }): Promise<void>;
    logApplicationEvent(level: 'info' | 'warn' | 'error' | 'debug', message: string, metadata?: any): Promise<void>;
    startDistributedTrace(traceName: string): any;
    endDistributedTrace(span: any): Promise<void>;
    setupRealtimeAlerting(): Promise<void>;
    enablePredictiveMonitoring(): Promise<void>;
}
/**
 * @class ProductionMonitoring
 * @description Provides comprehensive observability with Google Cloud Operations Suite, custom metrics, distributed tracing, and predictive monitoring.
 */
export declare class ProductionMonitoring implements MonitoringOperations {
    private config;
    private logger;
    private gcpOperations;
    private neuralModels;
    constructor(config: MonitoringConfig, gcpOperations: GcpOperationsSuiteIntegration, neuralModels: NeuralCoordinationModels);
    /**
     * Records custom metrics for business logic and performance indicators.
     * @param {string} metricName The name of the custom metric.
     * @param {number} value The value of the metric.
     * @param {{ [key: string]: string }} [labels] Optional labels for the metric.
     * @returns {Promise<void>}
     */
    recordCustomMetric(metricName: string, value: number, labels?: {
        [key: string]: string;
    }): Promise<void>;
    /**
     * Logs application events and messages to a centralized logging system.
     * @param {'info' | 'warn' | 'error' | 'debug'} level The log level.
     * @param {string} message The log message.
     * @param {any} [metadata] Optional metadata for the log entry.
     * @returns {Promise<void>}
     */
    logApplicationEvent(level: 'info' | 'warn' | 'error' | 'debug', message: string, metadata?: any): Promise<void>;
    /**
     * Starts a distributed trace for tracking requests across services.
     * @param {string} traceName The name of the trace.
     * @returns {any} A trace span object.
     */
    startDistributedTrace(traceName: string): any;
    /**
     * Ends a distributed trace span.
     * @param {any} span The trace span object.
     * @returns {Promise<void>}
     */
    endDistributedTrace(span: any): Promise<void>;
    /**
     * Sets up real-time alerting based on system health and performance metrics.
     * @returns {Promise<void>}
     */
    setupRealtimeAlerting(): Promise<void>;
    /**
     * Enables predictive monitoring using neural networks to anticipate issues.
     * @returns {Promise<void>}
     */
    enablePredictiveMonitoring(): Promise<void>;
}
//# sourceMappingURL=monitoring.d.ts.map