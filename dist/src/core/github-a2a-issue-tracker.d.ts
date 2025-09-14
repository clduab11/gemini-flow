/**
 * GitHub A2A Issue Tracker System - Distributed issue tracking with agent assignments
 * Coordinates A2A agents for intelligent issue triage, analysis, and resolution
 */
/// <reference types="node" resolution-mode="require"/>
import { GitHubA2ABridge } from "./github-a2a-bridge.js";
import { GitHubA2ACrossRepo } from "./github-a2a-cross-repo.js";
import { EventEmitter } from "events";
export interface GitHubIssue {
    id: number;
    number: number;
    title: string;
    body: string;
    state: "open" | "closed";
    repository: string;
    author: string;
    assignees: string[];
    labels: GitHubLabel[];
    milestone?: string;
    created_at: Date;
    updated_at: Date;
    closed_at?: Date;
    comments: number;
    reactions: Record<string, number>;
    linked_prs: number[];
}
export interface GitHubLabel {
    name: string;
    color: string;
    description?: string;
    category?: "type" | "priority" | "status" | "component" | "difficulty";
}
export interface IssueAnalysis {
    complexity_score: number;
    priority_score: number;
    urgency_level: "low" | "medium" | "high" | "critical";
    category: "bug" | "feature" | "enhancement" | "documentation" | "question" | "security";
    technical_area: string[];
    estimated_effort: number;
    dependencies: string[];
    related_issues: number[];
    sentiment_score: number;
    clarity_score: number;
    actionability_score: number;
}
export interface AgentAssignment {
    issue_id: number;
    agent_id: string;
    agent_type: string;
    assignment_type: "primary" | "secondary" | "reviewer" | "watcher";
    assigned_at: Date;
    estimated_completion: Date;
    confidence: number;
    specialization_match: number;
    workload_factor: number;
}
export interface IssueWorkflow {
    id: string;
    name: string;
    states: WorkflowState[];
    transitions: WorkflowTransition[];
    agents_required: Record<string, string[]>;
    automation_rules: AutomationRule[];
    sla_targets: Record<string, number>;
}
export interface WorkflowState {
    name: string;
    description: string;
    color: string;
    is_initial: boolean;
    is_final: boolean;
    requires_assignment: boolean;
    required_agents: string[];
    auto_actions: string[];
}
export interface WorkflowTransition {
    from: string;
    to: string;
    trigger: "manual" | "automatic" | "agent_action" | "time_based";
    conditions: TransitionCondition[];
    actions: TransitionAction[];
    required_roles: string[];
}
export interface TransitionCondition {
    type: "label_present" | "agent_approval" | "time_elapsed" | "pr_merged" | "custom";
    value: any;
    operator: "equals" | "contains" | "greater_than" | "less_than";
}
export interface TransitionAction {
    type: "add_label" | "remove_label" | "assign_agent" | "create_pr" | "notify" | "update_milestone";
    parameters: Record<string, any>;
}
export interface AutomationRule {
    id: string;
    name: string;
    trigger: "issue_created" | "issue_updated" | "comment_added" | "label_changed" | "assignment_changed";
    conditions: RuleCondition[];
    actions: RuleAction[];
    priority: number;
    enabled: boolean;
}
export interface RuleCondition {
    field: string;
    operator: "equals" | "contains" | "matches" | "greater_than" | "in_list";
    value: any;
}
export interface RuleAction {
    type: "assign_agent" | "add_label" | "set_priority" | "create_task" | "notify_team" | "cross_reference";
    parameters: Record<string, any>;
}
export declare class GitHubA2AIssueTracker extends EventEmitter {
    private bridge;
    private crossRepo;
    private a2aIntegration;
    private activeIssues;
    private agentAssignments;
    private workflows;
    private automationRules;
    private issueAnalytics;
    constructor(bridge: GitHubA2ABridge, crossRepo: GitHubA2ACrossRepo);
    /**
     * Initialize default issue workflows
     */
    private initializeWorkflows;
    /**
     * Initialize automation rules
     */
    private initializeAutomationRules;
    /**
     * Process incoming GitHub issue
     */
    processIssue(issue: GitHubIssue): Promise<string>;
    /**
     * Analyze issue to understand its characteristics
     */
    private analyzeIssue;
    /**
     * Select appropriate workflow for issue
     */
    private selectWorkflow;
    /**
     * Apply automation rules based on trigger
     */
    private applyAutomationRules;
    /**
     * Assign initial agents based on workflow and analysis
     */
    private assignInitialAgents;
    /**
     * Start workflow execution
     */
    private startWorkflow;
    /**
     * Assign agent to issue
     */
    private assignAgentToIssue;
    /**
     * Process workflow transition
     */
    processWorkflowTransition(issueNumber: number, fromState: string, toState: string, triggeredBy: string): Promise<void>;
    /**
     * Select best agent for assignment
     */
    private selectBestAgent;
    /**
     * Calculate agent scoring for assignment
     */
    private calculateAgentScore;
    private calculateComplexityScore;
    private calculatePriorityScore;
    private determineUrgencyLevel;
    private categorizeIssue;
    private identifyTechnicalAreas;
    private estimateEffort;
    private findDependencies;
    private findRelatedIssues;
    private analyzeSentiment;
    private assessClarity;
    private assessActionability;
    private evaluateRuleConditions;
    private getFieldValue;
    private evaluateCondition;
    private executeRuleActions;
    private executeAssignAgentAction;
    private executeAddLabelAction;
    private executeSetPriorityAction;
    private executeNotifyTeamAction;
    private executeCrossReferenceAction;
    private extractSearchTerms;
    private validateTransitionConditions;
    private evaluateTransitionCondition;
    private checkAgentApproval;
    private checkPRMerged;
    private executeTransitionActions;
    private executeStateActions;
    private calculateEstimatedCompletion;
    private calculateAssignmentConfidence;
    private calculateSpecializationMatch;
    private calculateWorkloadFactor;
    private getAvailableAgents;
    private setupEventHandlers;
    /**
     * Get system status and metrics
     */
    getStatus(): any;
    /**
     * Get issue analytics
     */
    getAnalytics(): any;
    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;
}
//# sourceMappingURL=github-a2a-issue-tracker.d.ts.map