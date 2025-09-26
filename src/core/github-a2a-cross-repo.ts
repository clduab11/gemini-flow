/**
 * GitHub A2A Cross-Repository Communication System
 * Enables A2A agents to collaborate across multiple repositories with secure channels
 */

import {
  GitHubA2ABridge,
  A2AAgent,
  A2ACommunication,
} from "./github-a2a-bridge.js";
import { A2ASecurityManager } from "./a2a-security-manager.js";
import { A2AZeroTrust } from "./a2a-zero-trust.js";
import { EventEmitter } from "node:events";

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
  message_retention: number; // days
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
  agents_assigned: Record<string, string[]>; // repo -> agent_ids
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

export class GitHubA2ACrossRepo extends EventEmitter {
  private bridge: GitHubA2ABridge;
  private securityManager: A2ASecurityManager;
  private zeroTrust: A2AZeroTrust;
  private repositories: Map<string, Repository> = new Map();
  private channels: Map<string, CrossRepoChannel> = new Map();
  private operations: Map<string, CrossRepoOperation> = new Map();
  private messageQueue: Map<string, CrossRepoMessage[]> = new Map();
  private routingTable: Map<string, string[]> = new Map();

  constructor(bridge: GitHubA2ABridge) {
    super();
    this.bridge = bridge;
    this.securityManager = new A2ASecurityManager();
    this.zeroTrust = new A2AZeroTrust();
    this.setupEventHandlers();
  }

  /**
   * Initialize cross-repository communication system
   */
  async initialize(): Promise<void> {
    try {
      // Initialize security components
      await this.securityManager.initialize();
      await this.zeroTrust.initialize();

      // Discover and register repositories
      await this.discoverRepositories();

      // Setup default communication channels
      await this.setupDefaultChannels();

      // Initialize routing system
      await this.initializeRouting();

      // Start message processing
      this.startMessageProcessor();

      this.emit("cross-repo-initialized", {
        repositories: this.repositories.size,
        channels: this.channels.size,
      });

      console.log("✅ Cross-repository A2A communication initialized");
    } catch (error) {
      console.error("❌ Failed to initialize cross-repo system:", error);
      throw error;
    }
  }

  /**
   * Discover and register repositories in the organization/workspace
   */
  private async discoverRepositories(): Promise<void> {
    // In a real implementation, this would query GitHub API for org repos
    const mockRepos = [
      {
        id: "gemini-flow",
        name: "gemini-flow",
        full_name: "clduab11/gemini-flow",
        owner: "clduab11",
        default_branch: "main",
        visibility: "public" as const,
        topics: ["ai", "orchestration", "agents"],
        languages: { TypeScript: 80, JavaScript: 20 },
        security_level: "internal" as const,
      },
      {
        id: "gemini-flow",
        name: "gemini-flow",
        full_name: "clduab11/gemini-flow",
        owner: "clduab11",
        default_branch: "main",
        visibility: "public" as const,
        topics: ["mcp", "agents", "collaboration"],
        languages: { TypeScript: 90, JavaScript: 10 },
        security_level: "internal" as const,
      },
      {
        id: "ruv-swarm",
        name: "ruv-swarm",
        full_name: "clduab11/ruv-swarm",
        owner: "clduab11",
        default_branch: "main",
        visibility: "public" as const,
        topics: ["swarm", "coordination", "agents"],
        languages: { TypeScript: 85, JavaScript: 15 },
        security_level: "internal" as const,
      },
    ];

    for (const repoData of mockRepos) {
      const repo: Repository = {
        ...repoData,
        agents: [],
        channels: [],
      };

      this.repositories.set(repo.id, repo);
      await this.registerRepositoryAgents(repo);
    }
  }

  /**
   * Register A2A agents for a repository
   */
  private async registerRepositoryAgents(repo: Repository): Promise<void> {
    // Assign agents to repository based on topics and needs
    const agentTypes = this.determineRequiredAgents(repo);

    for (const agentType of agentTypes) {
      const agentId = `${repo.id}-${agentType}`;
      repo.agents.push(agentId);

      // Register agent in routing table
      if (!this.routingTable.has(repo.id)) {
        this.routingTable.set(repo.id, []);
      }
      this.routingTable.get(repo.id)!.push(agentId);
    }
  }

  /**
   * Setup default communication channels between repositories
   */
  private async setupDefaultChannels(): Promise<void> {
    const channelConfigs = [
      {
        name: "sync-coordination",
        repositories: Array.from(this.repositories.keys()),
        channel_type: "coordination" as const,
        security_level: "internal" as const,
      },
      {
        name: "security-alerts",
        repositories: Array.from(this.repositories.keys()),
        channel_type: "broadcast" as const,
        security_level: "confidential" as const,
      },
      {
        name: "dependency-updates",
        repositories: Array.from(this.repositories.keys()),
        channel_type: "async" as const,
        security_level: "internal" as const,
      },
    ];

    for (const config of channelConfigs) {
      await this.createChannel(config);
    }
  }

  /**
   * Create a new cross-repository communication channel
   */
  async createChannel(config: Partial<CrossRepoChannel>): Promise<string> {
    const channelId = `channel-${config.name}-${Date.now()}`;

    const channel: CrossRepoChannel = {
      id: channelId,
      name: config.name || "unnamed",
      repositories: config.repositories || [],
      agents: this.getChannelAgents(config.repositories || []),
      channel_type: config.channel_type || "async",
      security_level: config.security_level || "internal",
      encryption_enabled: config.security_level !== "public",
      message_retention: 30,
      max_participants: 50,
      created_at: new Date(),
      last_activity: new Date(),
    };

    this.channels.set(channelId, channel);

    // Initialize message queue for channel
    this.messageQueue.set(channelId, []);

    // Register channel with repositories
    for (const repoId of channel.repositories) {
      const repo = this.repositories.get(repoId);
      if (repo) {
        repo.channels.push(channelId);
      }
    }

    this.emit("channel-created", { channelId, channel });

    return channelId;
  }

  /**
   * Send message across repositories
   */
  async sendCrossRepoMessage(
    message: Omit<CrossRepoMessage, "id" | "created_at">,
  ): Promise<string> {
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const fullMessage: CrossRepoMessage = {
      ...message,
      id: messageId,
      created_at: new Date(),
    };

    // Validate message through security manager
    const validated = await this.securityManager.validateMessage(fullMessage);
    if (!validated) {
      throw new Error("Message validation failed");
    }

    // Apply zero-trust policies
    const authorized = await this.zeroTrust.authorizeMessage(fullMessage);
    if (!authorized) {
      throw new Error("Message authorization failed");
    }

    // Encrypt if required
    if (fullMessage.encrypted) {
      fullMessage.content = await this.securityManager.encryptContent(
        fullMessage.content,
      );
    }

    // Route message to appropriate channels and agents
    await this.routeMessage(fullMessage);

    this.emit("message-sent", { messageId, message: fullMessage });

    return messageId;
  }

  /**
   * Route message to target agents and repositories
   */
  private async routeMessage(message: CrossRepoMessage): Promise<void> {
    const channel = this.channels.get(message.channel_id);
    if (!channel) {
      throw new Error(`Channel ${message.channel_id} not found`);
    }

    // Add to channel queue
    const queue = this.messageQueue.get(message.channel_id) || [];
    queue.push(message);
    this.messageQueue.set(message.channel_id, queue);

    // Route to specific target agents if specified
    if (message.to_agents && message.to_agents.length > 0) {
      for (const agentId of message.to_agents) {
        await this.deliverToAgent(agentId, message);
      }
    } else if (message.to_repos && message.to_repos.length > 0) {
      // Route to all agents in target repositories
      for (const repoId of message.to_repos) {
        const agents = this.routingTable.get(repoId) || [];
        for (const agentId of agents) {
          await this.deliverToAgent(agentId, message);
        }
      }
    } else {
      // Broadcast to all agents in channel
      for (const agentId of channel.agents) {
        await this.deliverToAgent(agentId, message);
      }
    }

    // Update channel activity
    channel.last_activity = new Date();
  }

  /**
   * Deliver message to specific agent
   */
  private async deliverToAgent(
    agentId: string,
    message: CrossRepoMessage,
  ): Promise<void> {
    try {
      // Find agent's repository context
      const repoId = this.findAgentRepository(agentId);

      // Prepare delivery context
      const deliveryContext = {
        agent_id: agentId,
        repository: repoId,
        message,
        delivery_time: new Date(),
      };

      // Deliver through bridge
      this.emit("message-delivered", deliveryContext);
    } catch (error) {
      console.error(`Failed to deliver message to agent ${agentId}:`, error);
      this.emit("message-delivery-failed", { agentId, message, error });
    }
  }

  /**
   * Start cross-repository operation
   */
  async startCrossRepoOperation(
    config: Omit<CrossRepoOperation, "id" | "status" | "created_at">,
  ): Promise<string> {
    const operationId = `op-${config.type}-${Date.now()}`;

    const operation: CrossRepoOperation = {
      ...config,
      id: operationId,
      status: "pending",
      created_at: new Date(),
    };

    this.operations.set(operationId, operation);

    // Assign agents to repositories for the operation
    await this.assignAgentsToOperation(operation);

    // Start execution based on coordination strategy
    await this.executeOperation(operation);

    this.emit("operation-started", { operationId, operation });

    return operationId;
  }

  /**
   * Assign agents to repositories for cross-repo operation
   */
  private async assignAgentsToOperation(
    operation: CrossRepoOperation,
  ): Promise<void> {
    for (const repoId of operation.repositories) {
      const repo = this.repositories.get(repoId);
      if (!repo) continue;

      // Determine required agents for this operation type
      const requiredAgents = this.getOperationAgents(operation.type, repo);
      operation.agents_assigned[repoId] = requiredAgents;

      // Notify agents of assignment
      for (const agentId of requiredAgents) {
        await this.sendCrossRepoMessage({
          channel_id: this.findCoordinationChannel(),
          from_agent: "system",
          from_repo: "system",
          to_agents: [agentId],
          message_type: "coordination",
          priority: operation.priority,
          content: {
            operation_id: operation.id,
            operation_type: operation.type,
            assignment: "agent_assigned",
            repository: repoId,
          },
          encrypted: false,
          requires_ack: true,
        });
      }
    }
  }

  /**
   * Execute cross-repository operation
   */
  private async executeOperation(operation: CrossRepoOperation): Promise<void> {
    operation.status = "in_progress";

    try {
      switch (operation.coordination_strategy) {
        case "sequential":
          await this.executeSequentialOperation(operation);
          break;
        case "parallel":
          await this.executeParallelOperation(operation);
          break;
        case "staged":
          await this.executeStagedOperation(operation);
          break;
      }

      operation.status = "completed";
      operation.completed_at = new Date();
    } catch (error) {
      operation.status = "failed";
      console.error(`Operation ${operation.id} failed:`, error);
      throw error;
    }
  }

  /**
   * Execute operation sequentially across repositories
   */
  private async executeSequentialOperation(
    operation: CrossRepoOperation,
  ): Promise<void> {
    for (const repoId of operation.repositories) {
      await this.executeRepoOperation(operation, repoId);

      // Send progress update
      await this.sendCrossRepoMessage({
        channel_id: this.findCoordinationChannel(),
        from_agent: "system",
        from_repo: "system",
        message_type: "status",
        priority: "medium",
        content: {
          operation_id: operation.id,
          repository: repoId,
          status: "completed",
          progress: this.calculateOperationProgress(operation, repoId),
        },
        encrypted: false,
        requires_ack: false,
      });
    }
  }

  /**
   * Execute operation in parallel across repositories
   */
  private async executeParallelOperation(
    operation: CrossRepoOperation,
  ): Promise<void> {
    const promises = operation.repositories.map((repoId) =>
      this.executeRepoOperation(operation, repoId),
    );

    await Promise.all(promises);
  }

  /**
   * Execute operation in stages across repositories
   */
  private async executeStagedOperation(
    operation: CrossRepoOperation,
  ): Promise<void> {
    // Group repositories into stages based on dependencies
    const stages = this.groupRepositoriesIntoStages(operation);

    for (const stage of stages) {
      const stagePromises = stage.map((repoId) =>
        this.executeRepoOperation(operation, repoId),
      );

      await Promise.all(stagePromises);
    }
  }

  /**
   * Execute operation for specific repository
   */
  private async executeRepoOperation(
    operation: CrossRepoOperation,
    repoId: string,
  ): Promise<void> {
    const agents = operation.agents_assigned[repoId] || [];

    // Create operation tasks for agents
    const tasks = agents.map((agentId) => ({
      agent_id: agentId,
      repository: repoId,
      operation_type: operation.type,
      task_data: this.generateTaskData(operation, repoId),
    }));

    // Execute tasks
    const results = await Promise.all(
      tasks.map((task) => this.executeAgentTask(task)),
    );

    // Validate results
    const success = results.every((result) => result.success);
    if (!success) {
      throw new Error(`Operation failed for repository ${repoId}`);
    }
  }

  /**
   * Synchronize repositories based on sync request
   */
  async synchronizeRepositories(request: RepoSyncRequest): Promise<string> {
    const operationId = await this.startCrossRepoOperation({
      type: "sync",
      repositories: [request.source_repo, ...request.target_repos],
      initiator_repo: request.source_repo,
      target_repos: request.target_repos,
      coordination_strategy: "staged",
      agents_assigned: {},
      dependencies: [],
      priority: "medium",
      estimated_duration: 30,
    });

    // Execute sync-specific logic
    await this.executeSyncOperation(operationId, request);

    return operationId;
  }

  /**
   * Execute repository synchronization
   */
  private async executeSyncOperation(
    operationId: string,
    request: RepoSyncRequest,
  ): Promise<void> {
    const operation = this.operations.get(operationId);
    if (!operation) return;

    // Analyze source repository
    const sourceAnalysis = await this.analyzeRepository(request.source_repo);

    // Plan sync actions for each target repository
    for (const targetRepo of request.target_repos) {
      const targetAnalysis = await this.analyzeRepository(targetRepo);
      const syncPlan = await this.createSyncPlan(
        sourceAnalysis,
        targetAnalysis,
        request,
      );

      // Execute sync plan
      await this.executeSyncPlan(targetRepo, syncPlan);
    }
  }

  /**
   * Initialize routing system for messages
   */
  private async initializeRouting(): Promise<void> {
    // Setup routing rules based on repository relationships
    for (const [repoId, repo] of this.repositories) {
      // Create routing entries for similar repositories
      const similarRepos = this.findSimilarRepositories(repo);

      for (const similarRepo of similarRepos) {
        // Add routing rule
        if (!this.routingTable.has(repoId)) {
          this.routingTable.set(repoId, []);
        }

        // Add cross-references
        const routes = this.routingTable.get(repoId)!;
        const similarAgents = this.routingTable.get(similarRepo) || [];
        routes.push(...similarAgents);
      }
    }
  }

  /**
   * Start message processor for handling queued messages
   */
  private startMessageProcessor(): void {
    setInterval(async () => {
      await this.processMessageQueues();
    }, 5000); // Process every 5 seconds
  }

  /**
   * Process message queues for all channels
   */
  private async processMessageQueues(): Promise<void> {
    for (const [channelId, messages] of this.messageQueue) {
      if (messages.length === 0) continue;

      const channel = this.channels.get(channelId);
      if (!channel) continue;

      // Process expired messages
      const now = new Date();
      const validMessages = messages.filter(
        (msg) => !msg.expires_at || msg.expires_at > now,
      );

      // Clean up expired messages
      if (validMessages.length !== messages.length) {
        this.messageQueue.set(channelId, validMessages);
      }

      // Update channel activity
      if (validMessages.length > 0) {
        channel.last_activity = now;
      }
    }
  }

  // Utility methods
  private determineRequiredAgents(repo: Repository): string[] {
    const agents = ["coordinator"];

    if (repo.topics.includes("ai") || repo.topics.includes("agents")) {
      agents.push("analyst");
    }

    if (repo.topics.includes("security") || repo.security_level !== "public") {
      agents.push("security");
    }

    if (repo.languages.TypeScript || repo.languages.JavaScript) {
      agents.push("reviewer");
    }

    return agents;
  }

  private getChannelAgents(repositories: string[]): string[] {
    const agents: string[] = [];

    for (const repoId of repositories) {
      const repoAgents = this.routingTable.get(repoId) || [];
      agents.push(...repoAgents);
    }

    return [...new Set(agents)];
  }

  private findAgentRepository(agentId: string): string | undefined {
    for (const [repoId, agents] of this.routingTable) {
      if (agents.includes(agentId)) {
        return repoId;
      }
    }
    return undefined;
  }

  private findCoordinationChannel(): string {
    for (const [channelId, channel] of this.channels) {
      if (channel.name === "sync-coordination") {
        return channelId;
      }
    }
    return Array.from(this.channels.keys())[0] || "";
  }

  private getOperationAgents(
    operationType: string,
    repo: Repository,
  ): string[] {
    const agentMap: Record<string, string[]> = {
      sync: ["coordinator", "reviewer"],
      merge: ["coordinator", "reviewer", "tester"],
      deploy: ["coordinator", "security", "tester"],
      "security-scan": ["security", "analyst"],
      "dependency-update": ["coordinator", "security"],
    };

    return agentMap[operationType] || ["coordinator"];
  }

  private calculateOperationProgress(
    operation: CrossRepoOperation,
    completedRepo: string,
  ): number {
    const completedIndex = operation.repositories.indexOf(completedRepo);
    return ((completedIndex + 1) / operation.repositories.length) * 100;
  }

  private groupRepositoriesIntoStages(
    operation: CrossRepoOperation,
  ): string[][] {
    // Simple staging: initiator first, then targets
    const stages: string[][] = [];

    if (operation.initiator_repo) {
      stages.push([operation.initiator_repo]);
    }

    const remaining = operation.repositories.filter(
      (r) => r !== operation.initiator_repo,
    );
    if (remaining.length > 0) {
      stages.push(remaining);
    }

    return stages;
  }

  private generateTaskData(operation: CrossRepoOperation, repoId: string): any {
    return {
      operation_id: operation.id,
      repository: repoId,
      type: operation.type,
      priority: operation.priority,
    };
  }

  private async executeAgentTask(
    task: any,
  ): Promise<{ success: boolean; result?: any }> {
    try {
      // Mock task execution - in real implementation would delegate to agents
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { success: true, result: `Task completed for ${task.repository}` };
    } catch (error) {
      return { success: false, result: error };
    }
  }

  private async analyzeRepository(repoId: string): Promise<any> {
    const repo = this.repositories.get(repoId);
    return {
      repository: repoId,
      languages: repo?.languages || {},
      topics: repo?.topics || [],
      security_level: repo?.security_level || "internal",
    };
  }

  private async createSyncPlan(
    sourceAnalysis: any,
    targetAnalysis: any,
    request: RepoSyncRequest,
  ): Promise<any> {
    return {
      sync_type: request.sync_type,
      actions: ["compare", "validate", "apply"],
      estimated_time: 15,
    };
  }

  private async executeSyncPlan(
    targetRepo: string,
    syncPlan: any,
  ): Promise<void> {
    // Mock sync execution
    console.log(`Executing sync plan for ${targetRepo}:`, syncPlan);
  }

  private findSimilarRepositories(repo: Repository): string[] {
    const similar: string[] = [];

    for (const [repoId, otherRepo] of this.repositories) {
      if (repoId === repo.id) continue;

      // Check for similar topics
      const commonTopics = repo.topics.filter((topic) =>
        otherRepo.topics.includes(topic),
      );

      // Check for similar languages
      const commonLanguages = Object.keys(repo.languages).filter((lang) =>
        Object.hasOwn(otherRepo.languages, lang),
      );

      if (commonTopics.length > 0 || commonLanguages.length > 0) {
        similar.push(repoId);
      }
    }

    return similar;
  }

  private setupEventHandlers(): void {
    this.on("message-delivery-failed", (data) => {
      console.warn(`Message delivery failed:`, data);
      // Implement retry logic or error handling
    });

    this.on("operation-failed", (data) => {
      console.error(`Cross-repo operation failed:`, data);
      // Cleanup and notification logic
    });
  }

  /**
   * Get system status
   */
  getStatus(): any {
    return {
      repositories: this.repositories.size,
      channels: this.channels.size,
      active_operations: Array.from(this.operations.values()).filter(
        (op) => op.status === "in_progress",
      ).length,
      message_queues: Array.from(this.messageQueue.values()).reduce(
        (sum, queue) => sum + queue.length,
        0,
      ),
      routing_entries: this.routingTable.size,
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // Clear all queues and operations
    this.messageQueue.clear();
    this.operations.clear();

    // Close channels
    this.channels.clear();

    this.emit("cross-repo-shutdown");
  }
}
