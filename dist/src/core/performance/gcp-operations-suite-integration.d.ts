/**
 * @interface GcpOperationsSuiteConfig
 * @description Configuration for GCP Operations Suite Integration.
 */
export interface GcpOperationsSuiteConfig {
    projectID: string;
}
/**
 * @interface GcpOperationsSuiteOperations
 * @description Defines operations for integrating with Google Cloud Operations Suite.
 */
export interface GcpOperationsSuiteOperations {
    log(level: 'info' | 'warn' | 'error' | 'debug', message: string, metadata?: any): Promise<void>;
    recordMetric(metricName: string, value: number, labels?: {
        [key: string]: string;
    }): Promise<void>;
    startTrace(traceName: string): any;
    endTrace(span: any): Promise<void>;
    reportError(error: Error, context?: any): Promise<void>;
    profileApplication(durationSeconds: number): Promise<any>;
}
/**
 * @class GcpOperationsSuiteIntegration
 * @description Provides enterprise-grade monitoring and observability by integrating with Google Cloud Operations Suite.
 */
export declare class GcpOperationsSuiteIntegration implements GcpOperationsSuiteOperations {
    private config;
    private logger;
    constructor(config: GcpOperationsSuiteConfig);
    /**
     * Logs messages to Google Cloud Logging.
     * @param {'info' | 'warn' | 'error' | 'debug'} level The log level.
     * @param {string} message The log message.
     * @param {any} [metadata] Optional metadata to include with the log entry.
     * @returns {Promise<void>}
     */
    log(level: 'info' | 'warn' | 'error' | 'debug', message: string, metadata?: any): Promise<void>;
    /**
     * Records custom metrics to Google Cloud Monitoring.
     * @param {string} metricName The name of the metric.
     * @param {number} value The value of the metric.
     * @param {{ [key: string]: string }} [labels] Optional labels for the metric.
     * @returns {Promise<void>}
     */
    recordMetric(metricName: string, value: number, labels?: {
        [key: string]: string;
    }): Promise<void>;
    /**
     * Starts a trace span for distributed request tracing with Cloud Trace.
     * @param {string} traceName The name of the trace span.
     * @returns {any} A simulated trace span object.
     */
    startTrace(traceName: string): any;
    /**
     * Ends a trace span and sends it to Cloud Trace.
     * @param {any} span The simulated trace span object.
     * @returns {Promise<void>}
     */
    endTrace(span: any): Promise<void>;
    /**
     * Reports an error to Google Cloud Error Reporting.
     * @param {Error} error The error object to report.
     * @param {any} [context] Optional context for the error.
     * @returns {Promise<void>}
     */
    reportError(error: Error, context?: any): Promise<void>;
    /**
     * Profiles the application performance using Cloud Profiler.
     * @param {number} durationSeconds The duration for which to profile.
     * @returns {Promise<any>} The profiling results.
     */
    profileApplication(durationSeconds: number): Promise<any>;
}
//# sourceMappingURL=gcp-operations-suite-integration.d.ts.map