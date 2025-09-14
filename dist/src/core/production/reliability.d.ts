/**
 * @interface ReliabilityConfig
 * @description Configuration for System Reliability.
 */
export interface ReliabilityConfig {
    enableCircuitBreaker: boolean;
    defaultRetries: number;
    defaultBackoffMs: number;
}
/**
 * @interface ReliabilityOperations
 * @description Defines operations for ensuring enterprise-grade reliability and resilience.
 */
export interface ReliabilityOperations {
    executeWithCircuitBreaker<T>(operation: () => Promise<T>, serviceName: string): Promise<T>;
    executeWithRetry<T>(operation: () => Promise<T>, retries?: number, backoffMs?: number): Promise<T>;
    triggerGracefulDegradation(componentName: string, reason: string): Promise<void>;
    initiateFailover(serviceName: string, targetRegion: string): Promise<void>;
    performBackup(dataScope: string): Promise<string>;
    monitorSLA(serviceName: string, currentMetrics: any): Promise<boolean>;
}
/**
 * @class SystemReliability
 * @description Implements features for ensuring system reliability and resilience, including circuit breakers, retries, and failover.
 */
export declare class SystemReliability implements ReliabilityOperations {
    private config;
    private logger;
    constructor(config: ReliabilityConfig);
    /**
     * Executes an operation with a circuit breaker pattern (conceptual).
     * @param {() => Promise<T>} operation The function to execute.
     * @param {string} serviceName The name of the service this operation interacts with.
     * @returns {Promise<T>} The result of the operation.
     */
    executeWithCircuitBreaker<T>(operation: () => Promise<T>, serviceName: string): Promise<T>;
    /**
     * Executes an operation with retry mechanisms and exponential backoff.
     * @param {() => Promise<T>} operation The function to execute.
     * @param {number} [retries] Number of retry attempts. Defaults to config.defaultRetries.
     * @param {number} [backoffMs] Initial backoff delay in milliseconds. Defaults to config.defaultBackoffMs.
     * @returns {Promise<T>} The result of the operation.
     */
    executeWithRetry<T>(operation: () => Promise<T>, retries?: number, backoffMs?: number): Promise<T>;
    /**
     * Triggers graceful degradation for a failing component or service (conceptual).
     * @param {string} componentName The name of the component to degrade.
     * @param {string} reason The reason for degradation.
     * @returns {Promise<void>}
     */
    triggerGracefulDegradation(componentName: string, reason: string): Promise<void>;
    /**
     * Initiates an automatic failover to a redundant service or region (conceptual).
     * @param {string} serviceName The name of the service to failover.
     * @param {string} targetRegion The target region for failover.
     * @returns {Promise<void>}
     */
    initiateFailover(serviceName: string, targetRegion: string): Promise<void>;
    /**
     * Performs a data backup operation (conceptual).
     * @param {string} dataScope The scope of data to backup (e.g., 'all', 'memory_db', 'configs').
     * @returns {Promise<string>} The ID or location of the backup.
     */
    performBackup(dataScope: string): Promise<string>;
    /**
     * Monitors Service Level Agreements (SLAs) and triggers alerts if violated (conceptual).
     * @param {string} serviceName The name of the service.
     * @param {any} currentMetrics Current performance metrics for the service.
     * @returns {Promise<boolean>} True if SLA is met, false otherwise.
     */
    monitorSLA(serviceName: string, currentMetrics: any): Promise<boolean>;
}
//# sourceMappingURL=reliability.d.ts.map