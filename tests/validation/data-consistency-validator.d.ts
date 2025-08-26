/**
 * Data Consistency Validation Framework
 *
 * Provides comprehensive validation protocols for ensuring data consistency
 * across Google Services integration workflows, including cross-service
 * data integrity, temporal consistency, and state synchronization.
 */
/// <reference types="node" />
import { EventEmitter } from 'events';
export interface ValidationRule {
    id: string;
    name: string;
    description: string;
    type: 'data_integrity' | 'temporal_consistency' | 'cross_service' | 'state_sync' | 'schema_validation';
    severity: 'error' | 'warning' | 'info';
    enabled: boolean;
    parameters?: Record<string, any>;
    validator: (context: ValidationContext) => Promise<ValidationResult>;
}
export interface ValidationContext {
    sessionId: string;
    timestamp: Date;
    services: string[];
    data: Record<string, any>;
    metadata: Record<string, any>;
    checkpoints: ValidationCheckpoint[];
}
export interface ValidationCheckpoint {
    id: string;
    timestamp: Date;
    service: string;
    operation: string;
    dataSnapshot: any;
    checksum: string;
    metadata: Record<string, any>;
}
export interface ValidationResult {
    ruleId: string;
    passed: boolean;
    severity: 'error' | 'warning' | 'info';
    message: string;
    details?: any;
    metrics?: Record<string, number>;
    suggestions?: string[];
}
export interface ValidationReport {
    sessionId: string;
    timestamp: Date;
    totalRules: number;
    passedRules: number;
    failedRules: number;
    warnings: number;
    errors: number;
    duration: number;
    results: ValidationResult[];
    summary: {
        dataIntegrity: 'passed' | 'failed' | 'warning';
        temporalConsistency: 'passed' | 'failed' | 'warning';
        crossServiceConsistency: 'passed' | 'failed' | 'warning';
        stateSync: 'passed' | 'failed' | 'warning';
        schemaValidation: 'passed' | 'failed' | 'warning';
    };
}
export declare class DataConsistencyValidator extends EventEmitter {
    private rules;
    private sessions;
    private validationHistory;
    constructor();
    /**
     * Create a validation session
     */
    createSession(sessionId: string, services: string[], metadata?: Record<string, any>): ValidationContext;
    /**
     * Add data checkpoint for validation
     */
    addCheckpoint(sessionId: string, service: string, operation: string, data: any, metadata?: Record<string, any>): string;
    /**
     * Validate data consistency across all checkpoints in a session
     */
    validateSession(sessionId: string): Promise<ValidationReport>;
    /**
     * Add custom validation rule
     */
    addRule(rule: ValidationRule): void;
    /**
     * Remove validation rule
     */
    removeRule(ruleId: string): boolean;
    /**
     * Enable/disable validation rule
     */
    toggleRule(ruleId: string, enabled: boolean): void;
    /**
     * Get validation history for a session
     */
    getValidationHistory(sessionId: string): ValidationReport[];
    /**
     * Clean up session data
     */
    endSession(sessionId: string): void;
    private initializeDefaultRules;
    private validateDataIntegrity;
    private validateDataCompleteness;
    private validateTemporalOrdering;
    private validateTimingConstraints;
    private validateCrossServiceSync;
    private validateServiceVersions;
    private validateStateConsistency;
    private validateStateTransitions;
    private validateSchemaCompliance;
    private validateAPIContracts;
    private generateReport;
    private generateCheckpointId;
    private calculateChecksum;
    private deepClone;
    private hasNestedProperty;
    private getNestedProperty;
    private isEmptyValue;
    private isValidStateTransition;
}
export default DataConsistencyValidator;
//# sourceMappingURL=data-consistency-validator.d.ts.map