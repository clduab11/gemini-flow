/**
 * GitHub A2A Cross-Repository Communication System
 * Enables A2A agents to collaborate across multiple repositories with secure channels
 */
/// <reference types="node" resolution-mode="require"/>
import { GitHubA2ABridge } from "./github-a2a-bridge.js";
import { EventEmitter } from "events";
export interface Repository {
    id: string;
    name: string;
    full_name: string;
    owner: string;
    default_branch: string;
    visibility: "public" | "private" | "internal";
    topics: string[];
    languages: Record<string, number>;
    agents: string[];
    channels: string[];
    security_level: "public" | "internal" | "confidential" | "restricted";
}
export interface CrossRepoChannel {
    id: string;
    name: string;
    repositories: string[];
    agents: string[];
    channel_type: "sync" | "async" | "broadcast" | "coordination";
    security_level: "public" | "internal" | "confidential" | "restricted";
    encryption_enabled: boolean;
    message_retention: number;
    max_participants: number;
    created_at: Date;
    last_activity: Date;
}
export interface CrossRepoOperation {
    id: string;
    type: "sync" | "merge" | "deploy" | "security-scan" | "dependency-update";
    repositories: string[];
    initiator_repo: string;
    target_repos: string[];
    status: "pending" | "in_progress" | "completed" | "failed" | "cancelled";
    coordination_strategy: "sequential" | "parallel" | "staged";
    agents_assigned: Record<string, string[]>;
    dependencies: string[];
    priority: "low" | "medium" | "high" | "critical";
    estimated_duration: number;
    created_at: Date;
    completed_at?: Date;
}
export interface RepoSyncRequest {
    source_repo: string;
    target_repos: string[];
    sync_type: "branch" | "config" | "dependencies" | "security" | "full";
    branch?: string;
    include_patterns: string[];
    exclude_patterns: string[];
    validation_required: boolean;
    auto_approve: boolean;
}
export interface CrossRepoMessage {
    id: string;
    channel_id: string;
    from_agent: string;
    from_repo: string;
    to_agents?: string[];
    to_repos?: string[];
    message_type: "coordination" | "status" | "request" | "response" | "alert";
    priority: "low" | "medium" | "high" | "urgent";
    content: any;
    encrypted: boolean;
    requires_ack: boolean;
    expires_at?: Date;
    created_at: Date;
}
export declare class GitHubA2ACrossRepo extends EventEmitter {
    private bridge;
    private securityManager;
    private zeroTrust;
    private repositories;
    private channels;
    private operations;
    private messageQueue;
    private routingTable;
    constructor(bridge: GitHubA2ABridge);
    /**
     * Initialize cross-repository communication system
     */
    initialize(): Promise<void>;
    /**
     * Discover and register repositories in the organization/workspace
     */
    private discoverRepositories;
    /**
     * Register A2A agents for a repository
     */
    private registerRepositoryAgents;
    /**
     * Setup default communication channels between repositories
     */
    private setupDefaultChannels;
    /**
     * Create a new cross-repository communication channel
     */
    createChannel(config: Partial<CrossRepoChannel>): Promise<string>;
    /**
     * Send message across repositories
     */
    sendCrossRepoMessage(message: Omit<CrossRepoMessage, "id" | "created_at">): Promise<string>;
    /**
     * Route message to target agents and repositories
     */
    private routeMessage;
    /**
     * Deliver message to specific agent
     */
    private deliverToAgent;
    /**
     * Start cross-repository operation
     */
    startCrossRepoOperation(config: Omit<CrossRepoOperation, "id" | "status" | "created_at">): Promise<string>;
    /**
     * Assign agents to repositories for cross-repo operation
     */
    private assignAgentsToOperation;
    /**
     * Execute cross-repository operation
     */
    private executeOperation;
    /**
     * Execute operation sequentially across repositories
     */
    private executeSequentialOperation;
    /**
     * Execute operation in parallel across repositories
     */
    private executeParallelOperation;
    /**
     * Execute operation in stages across repositories
     */
    private executeStagedOperation;
    /**
     * Execute operation for specific repository
     */
    private executeRepoOperation;
    /**
     * Synchronize repositories based on sync request
     */
    synchronizeRepositories(request: RepoSyncRequest): Promise<string>;
    /**
     * Execute repository synchronization
     */
    private executeSyncOperation;
    /**
     * Initialize routing system for messages
     */
    private initializeRouting;
    /**
     * Start message processor for handling queued messages
     */
    private startMessageProcessor;
    /**
     * Process message queues for all channels
     */
    private processMessageQueues;
    private determineRequiredAgents;
    private getChannelAgents;
    private findAgentRepository;
    private findCoordinationChannel;
    private getOperationAgents;
    private calculateOperationProgress;
    private groupRepositoriesIntoStages;
    private generateTaskData;
    private executeAgentTask;
    private analyzeRepository;
    private createSyncPlan;
    private executeSyncPlan;
    private findSimilarRepositories;
    private setupEventHandlers;
    /**
     * Get system status
     */
    getStatus(): any;
    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;
}
//# sourceMappingURL=github-a2a-cross-repo.d.ts.map