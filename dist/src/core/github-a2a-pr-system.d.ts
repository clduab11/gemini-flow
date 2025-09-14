/**
 * GitHub A2A Pull Request System - Automated PR reviews with multiple specialized agents
 * Coordinates A2A agents for comprehensive code review, testing, and approval workflows
 */
/// <reference types="node" resolution-mode="require"/>
import { GitHubA2ABridge } from "./github-a2a-bridge.js";
import { EventEmitter } from "events";
export interface PRReviewRequest {
    repository: string;
    pr_number: number;
    head_sha: string;
    base_sha: string;
    files_changed: GitHubFile[];
    author: string;
    title: string;
    description: string;
    labels: string[];
    reviewers: string[];
    assignees: string[];
}
export interface GitHubFile {
    filename: string;
    status: "added" | "modified" | "removed" | "renamed";
    additions: number;
    deletions: number;
    changes: number;
    patch?: string;
    previous_filename?: string;
}
export interface ReviewResult {
    agent_id: string;
    agent_type: string;
    review_type: "code_quality" | "security" | "performance" | "testing" | "architecture";
    status: "approved" | "changes_requested" | "comment";
    confidence: number;
    findings: ReviewFinding[];
    suggestions: ReviewSuggestion[];
    overall_score: number;
    execution_time: number;
}
export interface ReviewFinding {
    type: "error" | "warning" | "info" | "suggestion";
    severity: "critical" | "high" | "medium" | "low";
    file: string;
    line?: number;
    column?: number;
    message: string;
    rule_id?: string;
    suggestion?: string;
}
export interface ReviewSuggestion {
    type: "refactor" | "optimize" | "security" | "style" | "documentation";
    file: string;
    line_start?: number;
    line_end?: number;
    current_code?: string;
    suggested_code?: string;
    rationale: string;
    impact: "low" | "medium" | "high";
}
export interface PRAnalysis {
    complexity_score: number;
    risk_assessment: "low" | "medium" | "high" | "critical";
    test_coverage_impact: number;
    breaking_changes: boolean;
    security_implications: boolean;
    performance_impact: "positive" | "negative" | "neutral";
    architectural_changes: boolean;
    documentation_required: boolean;
}
export declare class GitHubA2APRSystem extends EventEmitter {
    private bridge;
    private a2aIntegration;
    private activeReviews;
    private reviewStrategies;
    constructor(bridge: GitHubA2ABridge);
    /**
     * Initialize different review strategies for various PR types
     */
    private initializeReviewStrategies;
    /**
     * Process incoming pull request for A2A agent review
     */
    processPullRequest(request: PRReviewRequest): Promise<string>;
    /**
     * Analyze pull request to understand its characteristics
     */
    private analyzePullRequest;
    /**
     * Select appropriate review strategy based on PR characteristics
     */
    private selectReviewStrategy;
    /**
     * Assign A2A agents for review based on strategy
     */
    private assignReviewAgents;
    /**
     * Start coordinated review process with assigned agents
     */
    private startCoordinatedReview;
    /**
     * Create review tasks for assigned agents
     */
    private createReviewTasks;
    /**
     * Execute individual review task with A2A agent
     */
    private executeReviewTask;
    /**
     * Consolidate review results from all agents
     */
    private consolidateReviewResults;
    /**
     * Submit consolidated review to GitHub
     */
    private submitGitHubReview;
    /**
     * Format review body for GitHub
     */
    private formatReviewBody;
    /**
     * Format review comments for GitHub
     */
    private formatReviewComments;
    private calculateComplexityScore;
    private assessRisk;
    private calculateTestCoverageImpact;
    private detectBreakingChanges;
    private detectSecurityImplications;
    private assessPerformanceImpact;
    private detectArchitecturalChanges;
    private isDocumentationRequired;
    private mapAgentTypeToReviewType;
    private filterFilesForAgent;
    private calculateTaskPriority;
    private estimateReviewDuration;
    private calculateOverallStatus;
    private consolidateFindings;
    private consolidateSuggestions;
    private generateRecommendation;
    private calculateOverallConfidence;
    private calculateReviewQuality;
    private getSeverityWeight;
    private getImpactWeight;
    private getAvailableAgents;
    private setupEventHandlers;
    /**
     * Get active review sessions
     */
    getActiveReviews(): Map<string, PRReviewSession>;
    /**
     * Cancel a review session
     */
    cancelReview(sessionId: string): Promise<void>;
}
interface ReviewStrategy {
    name: string;
    agents: string[];
    parallel: boolean;
    required_approvals: number;
    focus_areas: string[];
}
declare class PRReviewSession {
    id: string;
    request: PRReviewRequest;
    strategy: ReviewStrategy;
    analysis: PRAnalysis;
    status: "pending" | "in_progress" | "completed" | "cancelled" | "timeout";
    created_at: Date;
    completed_at?: Date;
    results?: ReviewResult[];
    constructor(id: string, request: PRReviewRequest, strategy: ReviewStrategy, analysis: PRAnalysis);
}
export {};
//# sourceMappingURL=github-a2a-pr-system.d.ts.map