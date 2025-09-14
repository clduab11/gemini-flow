/**
 * Security Runbooks for Common Scenarios
 *
 * Automated and manual response procedures for security incidents:
 * - Data breach response
 * - DDoS attack mitigation
 * - Insider threat investigation
 * - Malware outbreak containment
 * - Account compromise recovery
 * - API abuse handling
 * - Certificate expiration management
 * - Vulnerability disclosure response
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
export interface RunbookStep {
    id: string;
    title: string;
    description: string;
    type: "automated" | "manual" | "verification";
    estimatedTime: number;
    prerequisites?: string[];
    actions: RunbookAction[];
    validationCriteria?: string[];
    escalationTriggers?: string[];
}
export interface RunbookAction {
    id: string;
    type: "command" | "api_call" | "notification" | "documentation" | "analysis";
    description: string;
    command?: string;
    apiEndpoint?: string;
    parameters?: Record<string, any>;
    expectedResult?: string;
    timeoutSeconds?: number;
    retryCount?: number;
}
export interface RunbookExecution {
    id: string;
    runbookId: string;
    incidentId?: string;
    startedAt: Date;
    completedAt?: Date;
    status: "running" | "completed" | "failed" | "cancelled";
    executedBy: string;
    currentStepIndex: number;
    stepResults: StepResult[];
    variables: Record<string, any>;
}
export interface StepResult {
    stepId: string;
    status: "pending" | "running" | "completed" | "failed" | "skipped";
    startedAt?: Date;
    completedAt?: Date;
    output?: string;
    errors?: string[];
    actionResults: ActionResult[];
}
export interface ActionResult {
    actionId: string;
    status: "success" | "failure" | "timeout";
    output?: string;
    error?: string;
    duration: number;
}
export declare class SecurityRunbooks extends EventEmitter {
    private logger;
    private runbooks;
    private executions;
    private activeExecutions;
    constructor();
    /**
     * Execute a security runbook
     */
    executeRunbook(runbookId: string, context: {
        incidentId?: string;
        executedBy: string;
        variables?: Record<string, any>;
        autoExecute?: boolean;
    }): Promise<string>;
    /**
     * Execute next step in a runbook
     */
    executeNextStep(executionId: string): Promise<StepResult>;
    /**
     * Get execution status
     */
    getExecutionStatus(executionId: string): RunbookExecution | null;
    /**
     * Cancel execution
     */
    cancelExecution(executionId: string, reason: string): Promise<void>;
    /**
     * Private implementation methods
     */
    private executeAllSteps;
    private executeStep;
    private executeAction;
    private executeCommand;
    private executeApiCall;
    private sendNotification;
    private createDocumentation;
    private performAnalysis;
    private checkPrerequisites;
    private substituteVariables;
    /**
     * Initialize default security runbooks
     */
    private initializeDefaultRunbooks;
    private addInsiderThreatRunbook;
    private addMalwareOutbreakRunbook;
    private addAccountCompromiseRunbook;
    private addApiAbuseRunbook;
    private addCertificateExpirationRunbook;
    private addVulnerabilityDisclosureRunbook;
}
/**
 * Security Runbook class
 */
export declare class SecurityRunbook {
    readonly id: string;
    readonly title: string;
    readonly description: string;
    readonly category: string;
    readonly severity: "low" | "medium" | "high" | "critical";
    readonly estimatedDuration: number;
    readonly steps: RunbookStep[];
    readonly tags?: string[];
    readonly version: string;
    readonly lastUpdated: Date;
    constructor(config: {
        id: string;
        title: string;
        description: string;
        category: string;
        severity: "low" | "medium" | "high" | "critical";
        estimatedDuration: number;
        steps: RunbookStep[];
        tags?: string[];
        version?: string;
    });
    /**
     * Get runbook summary
     */
    getSummary(): {
        id: string;
        title: string;
        category: string;
        severity: string;
        estimatedDuration: number;
        stepCount: number;
        automatedSteps: number;
        manualSteps: number;
    };
    /**
     * Validate runbook structure
     */
    validate(): {
        isValid: boolean;
        errors: string[];
    };
}
export { SecurityRunbooks };
//# sourceMappingURL=security-runbooks.d.ts.map