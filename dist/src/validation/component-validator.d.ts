/**
 * @interface ComponentValidatorConfig
 * @description Configuration for the Component Validator.
 */
export interface ComponentValidatorConfig {
}
/**
 * @interface ComponentValidatorOperations
 * @description Defines operations for validating individual components from each sprint.
 */
export interface ComponentValidatorOperations {
    validateSprint1Components(): Promise<boolean>;
    validateSprint2Components(): Promise<boolean>;
    validateSprint3Components(): Promise<boolean>;
}
/**
 * @class ComponentValidator
 * @description Provides comprehensive validation for individual components implemented in Sprints 1-3.
 */
export declare class ComponentValidator implements ComponentValidatorOperations {
    private config;
    private logger;
    constructor(config: ComponentValidatorConfig);
    /**
     * Validates components from Sprint 1: MCP self-expansion system.
     * @returns {Promise<boolean>} True if validation passes, false otherwise.
     */
    validateSprint1Components(): Promise<boolean>;
    /**
     * Validates components from Sprint 2: SQLite memory system with 12 tables.
     * @returns {Promise<boolean>} True if validation passes, false otherwise.
     */
    validateSprint2Components(): Promise<boolean>;
    /**
     * Validates components from Sprint 3: 87+ Google Cloud tool ecosystem.
     * @returns {Promise<boolean>} True if validation passes, false otherwise.
     */
    validateSprint3Components(): Promise<boolean>;
}
//# sourceMappingURL=component-validator.d.ts.map