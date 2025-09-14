/**
 * @interface IntegrationValidatorConfig
 * @description Configuration for the Integration Validator.
 */
export interface IntegrationValidatorConfig {
}
/**
 * @interface IntegrationValidatorOperations
 * @description Defines operations for validating integration across different sprints.
 */
export interface IntegrationValidatorOperations {
    validateSprint4Integration(): Promise<boolean>;
    validateSprint5Integration(): Promise<boolean>;
    validateSprint6Integration(): Promise<boolean>;
}
/**
 * @class IntegrationValidator
 * @description Provides comprehensive validation for the integration of components across Sprints 4-6.
 */
export declare class IntegrationValidator implements IntegrationValidatorOperations {
    private config;
    private logger;
    constructor(config: IntegrationValidatorConfig);
    /**
     * Validates integration for Sprint 4: Hive-Mind Intelligence Core.
     * @returns {Promise<boolean>} True if validation passes, false otherwise.
     */
    validateSprint4Integration(): Promise<boolean>;
    /**
     * Validates integration for Sprint 5: Advanced Coordination Features.
     * @returns {Promise<boolean>} True if validation passes, false otherwise.
     */
    validateSprint5Integration(): Promise<boolean>;
    /**
     * Validates integration for Sprint 6: Production Readiness.
     * @returns {Promise<boolean>} True if validation passes, false otherwise.
     */
    validateSprint6Integration(): Promise<boolean>;
}
//# sourceMappingURL=integration-validator.d.ts.map