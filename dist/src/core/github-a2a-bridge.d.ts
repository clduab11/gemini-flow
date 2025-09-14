/**
 * GitHub-A2A Bridge - Comprehensive integration between GitHub operations and A2A agent collaboration
 * Enables seamless cross-repository agent communication and coordinated workflows
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
export interface GitHubA2AConfig {
    github: {
        token: string;
        apiUrl?: string;
        enterprise?: boolean;
    };
    a2a: {
        maxAgents: number;
        topology: "hierarchical" | "mesh" | "ring" | "star";
        security: "high" | "medium" | "low";
        crossRepo: boolean;
    };
    workflows: {
        prReview: boolean;
        issueTracking: boolean;
        cicd: boolean;
        release: boolean;
    };
}
export interface A2AAgent {
    id: string;
    type: "coordinator" | "reviewer" | "tester" | "analyst" | "security" | "architect";
    capabilities: string[];
    repository?: string;
    assigned_tasks: string[];
    status: "idle" | "working" | "blocked" | "completed";
    metrics: {
        tasks_completed: number;
        reviews_performed: number;
        issues_resolved: number;
        uptime: number;
    };
}
export interface GitHubOperation {
    type: "pr" | "issue" | "release" | "workflow" | "security";
    action: string;
    repository: string;
    data: any;
    requiredAgents: string[];
    priority: "low" | "medium" | "high" | "critical";
    coordination: "sequential" | "parallel" | "adaptive";
}
export interface A2ACommunication {
    from: string;
    to: string | string[];
    type: "request" | "response" | "notification" | "coordination";
    payload: any;
    repository?: string;
    timestamp: Date;
    security_level: "public" | "internal" | "confidential" | "restricted";
}
export declare class GitHubA2ABridge extends EventEmitter {
    private config;
    private a2aIntegration;
    private securityManager;
    private zeroTrust;
    private orchestrator;
    private swarmManager;
    private agents;
    private activeOperations;
    private communicationLog;
    constructor(config: GitHubA2AConfig);
    /**
     * Initialize the GitHub-A2A bridge with agents and security
     */
    initialize(): Promise<void>;
    /**
     * Initialize specialized A2A agents for different GitHub operations
     */
    private initializeAgentSwarm;
    /**
     * Setup GitHub webhooks for real-time A2A coordination
     */
    private setupGitHubWebhooks;
    /**
     * Register webhook handler for GitHub events
     */
    private registerWebhookHandler;
    /**
     * Handle incoming GitHub events with A2A coordination
     */
    private handleGitHubEvent;
    /**
     * Coordinate A2A agent response to GitHub operations
     */
    private coordinateA2AResponse;
    /**
     * Assign A2A agents to GitHub operation based on requirements
     */
    private assignAgentsToOperation;
    /**
     * Create coordination plan for A2A agents
     */
    private createCoordinationPlan;
    /**
     * Execute coordinated A2A response
     */
    private executeCoordinatedResponse;
    /**
     * Execute individual task with A2A agent
     */
    private executeTask;
    /**
     * Establish cross-repository communication channels
     */
    private establishCrossRepoChannels;
    /**
     * Send A2A communication between agents
     */
    private sendA2ACommunication;
    /**
     * Deliver communication to specific agent
     */
    private deliverToAgent;
    private mapEventToOperationType;
    private determineRequiredAgents;
    private determinePriority;
    private determineCoordination;
    private agentCanHandleOperation;
    private getRequiredCapabilities;
    private estimateOperationDuration;
    private identifyDependencies;
    private createPRReviewPlan;
    private createIssueAnalysisPlan;
    private createReleasePlan;
    private createWorkflowPlan;
    private createSecurityPlan;
    private getTrackedRepositories;
    private createRepositoryChannel;
    private setupEventHandlers;
    /**
     * Get bridge status and metrics
     */
    getStatus(): any;
    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;
}
//# sourceMappingURL=github-a2a-bridge.d.ts.map