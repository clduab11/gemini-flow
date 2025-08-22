/**
 * Transaction Integrity Verification System
 *
 * Provides comprehensive transaction integrity validation for Google Services
 * integration workflows, ensuring ACID properties across distributed operations,
 * handling partial failures, and maintaining data consistency.
 */
/// <reference types="node" />
import { EventEmitter } from 'events';
export interface TransactionContext {
    transactionId: string;
    sessionId: string;
    initiator: string;
    startTime: Date;
    timeout: number;
    isolation: 'read_uncommitted' | 'read_committed' | 'repeatable_read' | 'serializable';
    operations: TransactionOperation[];
    checkpoints: TransactionCheckpoint[];
    compensations: CompensationAction[];
    state: TransactionState;
    metadata: Record<string, any>;
}
export interface TransactionOperation {
    operationId: string;
    service: string;
    type: 'create' | 'read' | 'update' | 'delete' | 'execute';
    endpoint: string;
    payload: any;
    expectedResult?: any;
    timestamp: Date;
    status: 'pending' | 'executing' | 'completed' | 'failed' | 'compensated';
    duration?: number;
    result?: any;
    error?: Error;
    retryCount: number;
    maxRetries: number;
    idempotencyKey?: string;
}
export interface TransactionCheckpoint {
    checkpointId: string;
    timestamp: Date;
    operationId: string;
    state: any;
    checksum: string;
    canRollback: boolean;
    rollbackData?: any;
}
export interface CompensationAction {
    actionId: string;
    operationId: string;
    service: string;
    action: 'rollback' | 'compensate' | 'retry';
    payload: any;
    status: 'pending' | 'executing' | 'completed' | 'failed';
    timestamp?: Date;
    result?: any;
    error?: Error;
}
export interface TransactionState {
    phase: 'preparing' | 'committing' | 'committed' | 'aborting' | 'aborted' | 'partial';
    completedOperations: number;
    totalOperations: number;
    errorCount: number;
    consistencyLevel: 'strong' | 'eventual' | 'weak' | 'unknown';
    isolationViolations: number;
    integrityScore: number;
}
export interface TransactionReport {
    transactionId: string;
    sessionId: string;
    startTime: Date;
    endTime: Date;
    duration: number;
    finalState: TransactionState;
    operations: TransactionOperation[];
    checkpoints: TransactionCheckpoint[];
    compensations: CompensationAction[];
    integrityVerification: IntegrityVerificationResult;
    recommendations: string[];
}
export interface IntegrityVerificationResult {
    atomicity: {
        score: number;
        violations: AtomicityViolation[];
        passed: boolean;
    };
    consistency: {
        score: number;
        violations: ConsistencyViolation[];
        passed: boolean;
    };
    isolation: {
        score: number;
        violations: IsolationViolation[];
        passed: boolean;
    };
    durability: {
        score: number;
        violations: DurabilityViolation[];
        passed: boolean;
    };
    overall: {
        score: number;
        passed: boolean;
        grade: 'A' | 'B' | 'C' | 'D' | 'F';
    };
}
export interface AtomicityViolation {
    type: 'partial_commit' | 'incomplete_rollback' | 'orphaned_operation';
    operationId: string;
    service: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
    impact: string;
}
export interface ConsistencyViolation {
    type: 'data_inconsistency' | 'constraint_violation' | 'referential_integrity';
    services: string[];
    description: string;
    dataPoints: any[];
    severity: 'high' | 'medium' | 'low';
}
export interface IsolationViolation {
    type: 'dirty_read' | 'non_repeatable_read' | 'phantom_read' | 'lost_update';
    operationIds: string[];
    description: string;
    severity: 'high' | 'medium' | 'low';
}
export interface DurabilityViolation {
    type: 'data_loss' | 'checkpoint_failure' | 'recovery_failure';
    operationId: string;
    description: string;
    severity: 'high' | 'medium' | 'low';
    recoverability: 'recoverable' | 'partial' | 'lost';
}
export declare class TransactionIntegrityVerifier extends EventEmitter {
    private config;
    private activeTransactions;
    private transactionHistory;
    private globalState;
    private locks;
    constructor(config?: {
        defaultTimeout?: number;
        maxRetries?: number;
        checkpointFrequency?: number;
        isolationLevel?: 'read_uncommitted' | 'read_committed' | 'repeatable_read' | 'serializable';
    });
    /**
     * Begin a new distributed transaction
     */
    beginTransaction(sessionId: string, initiator: string, options?: {
        timeout?: number;
        isolation?: 'read_uncommitted' | 'read_committed' | 'repeatable_read' | 'serializable';
        metadata?: Record<string, any>;
    }): Promise<string>;
    /**
     * Add an operation to a transaction
     */
    addOperation(transactionId: string, operation: Omit<TransactionOperation, 'operationId' | 'timestamp' | 'status' | 'retryCount'>): Promise<string>;
    /**
     * Execute a transaction operation with integrity checks
     */
    executeOperation(transactionId: string, operationId: string): Promise<any>;
    /**
     * Commit the transaction
     */
    commitTransaction(transactionId: string): Promise<TransactionReport>;
    /**
     * Rollback the transaction
     */
    rollbackTransaction(transactionId: string, reason?: Error): Promise<void>;
    /**
     * Verify transaction integrity (ACID properties)
     */
    verifyTransactionIntegrity(context: TransactionContext): Promise<IntegrityVerificationResult>;
    private verifyAtomicity;
    private verifyConsistency;
    private verifyIsolation;
    private verifyDurability;
    private generateTransactionId;
    private generateOperationId;
    private createCheckpoint;
    private performOperation;
    private retryOperation;
    private createCompensationAction;
    private generateCompensationPayload;
    private handleTransactionTimeout;
    private extractEntityKey;
    private detectDataInconsistencies;
    private updateIntegrityScore;
    private acquireLocks;
    private releaseLocks;
    private validatePreExecution;
    private validatePostExecution;
    private compareResults;
    private captureCurrentState;
    private calculateStateChecksum;
    private captureRollbackData;
    private performCommit;
    private compensateOperation;
    private performCompensation;
    private restoreFromCheckpoints;
    private restoreState;
    private generateTransactionReport;
    /**
     * Get transaction history for a session
     */
    getTransactionHistory(sessionId: string): TransactionReport[];
    /**
     * Get active transaction context
     */
    getActiveTransaction(transactionId: string): TransactionContext | undefined;
    /**
     * Get all active transactions
     */
    getActiveTransactions(): TransactionContext[];
}
export default TransactionIntegrityVerifier;
//# sourceMappingURL=transaction-integrity-verifier.d.ts.map