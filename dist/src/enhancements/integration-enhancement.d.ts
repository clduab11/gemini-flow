import { CrossComponentCommunication } from '../core/integration/cross-communication';
import { SystemReliability } from '../core/production/reliability';
import { ProductionMonitoring } from '../core/production/monitoring';
/**
 * @interface IntegrationEnhancementConfig
 * @description Configuration for Integration Enhancement.
 */
export interface IntegrationEnhancementConfig {
}
/**
 * @interface IntegrationEnhancementOperations
 * @description Defines operations for enhancing system integration.
 */
export interface IntegrationEnhancementOperations {
    strengthenCrossComponentCommunication(): Promise<void>;
    optimizeDataFlow(): Promise<void>;
    enhanceErrorHandlingAndRecovery(): Promise<void>;
    improveMonitoringAndObservability(): Promise<void>;
}
/**
 * @class IntegrationEnhancer
 * @description Addresses gaps and optimizes the complete system integration.
 */
export declare class IntegrationEnhancer implements IntegrationEnhancementOperations {
    private config;
    private logger;
    private crossCommunication;
    private systemReliability;
    private productionMonitoring;
    constructor(config: IntegrationEnhancementConfig, crossCommunication: CrossComponentCommunication, systemReliability: SystemReliability, productionMonitoring: ProductionMonitoring);
    /**
     * Strengthens cross-component communication.
     * @returns {Promise<void>}
     */
    strengthenCrossComponentCommunication(): Promise<void>;
    /**
     * Optimizes data flow between systems.
     * @returns {Promise<void>}
     */
    optimizeDataFlow(): Promise<void>;
    /**
     * Enhances error handling and recovery mechanisms.
     * @returns {Promise<void>}
     */
    enhanceErrorHandlingAndRecovery(): Promise<void>;
    /**
     * Improves monitoring and observability.
     * @returns {Promise<void>}
     */
    improveMonitoringAndObservability(): Promise<void>;
}
//# sourceMappingURL=integration-enhancement.d.ts.map