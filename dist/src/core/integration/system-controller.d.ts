/**
 * @interface SystemControllerConfig
 * @description Configuration for the Unified System Controller.
 */
export interface SystemControllerConfig {
    environment: 'development' | 'staging' | 'production';
}
/**
 * @interface SystemControllerOperations
 * @description Defines operations for central coordination and management of all subsystems.
 */
export interface SystemControllerOperations {
    startup(): Promise<void>;
    shutdown(): Promise<void>;
    getSystemStatus(): Promise<any>;
    triggerHealthCheck(): Promise<boolean>;
}
/**
 * @class SystemController
 * @description Provides central coordination, health checking, and lifecycle management for all Gemini-Flow subsystems.
 */
export declare class SystemController implements SystemControllerOperations {
    private config;
    private logger;
    constructor(config: SystemControllerConfig);
    /**
     * Initiates a graceful startup sequence for all integrated subsystems.
     * @returns {Promise<void>}
     */
    startup(): Promise<void>;
    /**
     * Initiates a graceful shutdown sequence for all integrated subsystems.
     * @returns {Promise<void>}
     */
    shutdown(): Promise<void>;
    /**
     * Retrieves the current health and status of all integrated subsystems.
     * @returns {Promise<any>} An object containing the status of each component.
     */
    getSystemStatus(): Promise<any>;
    /**
     * Triggers an immediate health check across all critical system components.
     * @returns {Promise<boolean>} True if all critical components are healthy, false otherwise.
     */
    triggerHealthCheck(): Promise<boolean>;
}
//# sourceMappingURL=system-controller.d.ts.map