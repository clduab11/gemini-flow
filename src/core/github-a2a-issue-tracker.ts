/**
 * GitHub A2A Issue Tracker System - Distributed issue tracking with agent assignments
 * Coordinates A2A agents for intelligent issue triage, analysis, and resolution
 */

import { GitHubA2ABridge, A2AAgent } from "./github-a2a-bridge.js";
import { GitHubA2ACrossRepo } from "./github-a2a-cross-repo.js";
import { A2AIntegration } from "./a2a-integration.js";
import { EventEmitter } from "node:events";

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
  category:
    | "bug"
    | "feature"
    | "enhancement"
    | "documentation"
    | "question"
    | "security";
  technical_area: string[];
  estimated_effort: number; // hours
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
  agents_required: Record<string, string[]>; // state -> agent_types
  automation_rules: AutomationRule[];
  sla_targets: Record<string, number>; // state -> hours
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
  type:
    | "label_present"
    | "agent_approval"
    | "time_elapsed"
    | "pr_merged"
    | "custom";
  value: any;
  operator: "equals" | "contains" | "greater_than" | "less_than";
}

export interface TransitionAction {
  type:
    | "add_label"
    | "remove_label"
    | "assign_agent"
    | "create_pr"
    | "notify"
    | "update_milestone";
  parameters: Record<string, any>;
}

export interface AutomationRule {
  id: string;
  name: string;
  trigger:
    | "issue_created"
    | "issue_updated"
    | "comment_added"
    | "label_changed"
    | "assignment_changed";
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
  type:
    | "assign_agent"
    | "add_label"
    | "set_priority"
    | "create_task"
    | "notify_team"
    | "cross_reference";
  parameters: Record<string, any>;
}

export class GitHubA2AIssueTracker extends EventEmitter {
  private bridge: GitHubA2ABridge;
  private crossRepo: GitHubA2ACrossRepo;
  private a2aIntegration: A2AIntegration;
  private activeIssues: Map<number, IssueSession> = new Map();
  private agentAssignments: Map<string, AgentAssignment[]> = new Map();
  private workflows: Map<string, IssueWorkflow> = new Map();
  private automationRules: Map<string, AutomationRule> = new Map();
  private issueAnalytics: Map<string, any> = new Map();

  constructor(bridge: GitHubA2ABridge, crossRepo: GitHubA2ACrossRepo) {
    super();
    this.bridge = bridge;
    this.crossRepo = crossRepo;
    this.a2aIntegration = new A2AIntegration();
    this.initializeWorkflows();
    this.initializeAutomationRules();
    this.setupEventHandlers();
  }

  /**
   * Initialize default issue workflows
   */
  private initializeWorkflows(): void {
    // Bug workflow
    this.workflows.set("bug-workflow", {
      id: "bug-workflow",
      name: "Bug Resolution Workflow",
      states: [
        {
          name: "triage",
          description: "Initial triage",
          color: "yellow",
          is_initial: true,
          is_final: false,
          requires_assignment: true,
          required_agents: ["analyst"],
          auto_actions: ["analyze"],
        },
        {
          name: "investigation",
          description: "Under investigation",
          color: "orange",
          is_initial: false,
          is_final: false,
          requires_assignment: true,
          required_agents: ["reviewer"],
          auto_actions: ["investigate"],
        },
        {
          name: "in-progress",
          description: "Being worked on",
          color: "blue",
          is_initial: false,
          is_final: false,
          requires_assignment: true,
          required_agents: ["coordinator"],
          auto_actions: ["track-progress"],
        },
        {
          name: "testing",
          description: "In testing",
          color: "purple",
          is_initial: false,
          is_final: false,
          requires_assignment: true,
          required_agents: ["tester"],
          auto_actions: ["test"],
        },
        {
          name: "resolved",
          description: "Resolved",
          color: "green",
          is_initial: false,
          is_final: true,
          requires_assignment: false,
          required_agents: [],
          auto_actions: ["close"],
        },
      ],
      transitions: [
        {
          from: "triage",
          to: "investigation",
          trigger: "agent_action",
          conditions: [
            { type: "agent_approval", value: "analyst", operator: "equals" },
          ],
          actions: [{ type: "assign_agent", parameters: { type: "reviewer" } }],
          required_roles: ["analyst"],
        },
        {
          from: "investigation",
          to: "in-progress",
          trigger: "agent_action",
          conditions: [
            { type: "agent_approval", value: "reviewer", operator: "equals" },
          ],
          actions: [
            { type: "assign_agent", parameters: { type: "coordinator" } },
          ],
          required_roles: ["reviewer"],
        },
        {
          from: "in-progress",
          to: "testing",
          trigger: "automatic",
          conditions: [{ type: "pr_merged", value: true, operator: "equals" }],
          actions: [{ type: "assign_agent", parameters: { type: "tester" } }],
          required_roles: [],
        },
        {
          from: "testing",
          to: "resolved",
          trigger: "agent_action",
          conditions: [
            { type: "agent_approval", value: "tester", operator: "equals" },
          ],
          actions: [{ type: "add_label", parameters: { label: "resolved" } }],
          required_roles: ["tester"],
        },
      ],
      agents_required: {
        triage: ["analyst"],
        investigation: ["reviewer"],
        "in-progress": ["coordinator"],
        testing: ["tester"],
      },
      automation_rules: [],
      sla_targets: {
        triage: 4,
        investigation: 24,
        "in-progress": 72,
        testing: 8,
      },
    });

    // Feature workflow
    this.workflows.set("feature-workflow", {
      id: "feature-workflow",
      name: "Feature Development Workflow",
      states: [
        {
          name: "proposal",
          description: "Feature proposal",
          color: "lightblue",
          is_initial: true,
          is_final: false,
          requires_assignment: true,
          required_agents: ["analyst"],
          auto_actions: ["analyze-requirements"],
        },
        {
          name: "design",
          description: "Design phase",
          color: "purple",
          is_initial: false,
          is_final: false,
          requires_assignment: true,
          required_agents: ["architect"],
          auto_actions: ["create-design"],
        },
        {
          name: "development",
          description: "In development",
          color: "blue",
          is_initial: false,
          is_final: false,
          requires_assignment: true,
          required_agents: ["coordinator"],
          auto_actions: ["track-development"],
        },
        {
          name: "review",
          description: "Code review",
          color: "orange",
          is_initial: false,
          is_final: false,
          requires_assignment: true,
          required_agents: ["reviewer"],
          auto_actions: ["code-review"],
        },
        {
          name: "testing",
          description: "Testing",
          color: "yellow",
          is_initial: false,
          is_final: false,
          requires_assignment: true,
          required_agents: ["tester"],
          auto_actions: ["comprehensive-test"],
        },
        {
          name: "done",
          description: "Complete",
          color: "green",
          is_initial: false,
          is_final: true,
          requires_assignment: false,
          required_agents: [],
          auto_actions: ["close"],
        },
      ],
      transitions: [
        {
          from: "proposal",
          to: "design",
          trigger: "agent_action",
          conditions: [
            { type: "agent_approval", value: "analyst", operator: "equals" },
          ],
          actions: [
            { type: "assign_agent", parameters: { type: "architect" } },
          ],
          required_roles: ["analyst"],
        },
        {
          from: "design",
          to: "development",
          trigger: "agent_action",
          conditions: [
            { type: "agent_approval", value: "architect", operator: "equals" },
          ],
          actions: [
            { type: "assign_agent", parameters: { type: "coordinator" } },
          ],
          required_roles: ["architect"],
        },
        {
          from: "development",
          to: "review",
          trigger: "automatic",
          conditions: [{ type: "pr_merged", value: true, operator: "equals" }],
          actions: [{ type: "assign_agent", parameters: { type: "reviewer" } }],
          required_roles: [],
        },
        {
          from: "review",
          to: "testing",
          trigger: "agent_action",
          conditions: [
            { type: "agent_approval", value: "reviewer", operator: "equals" },
          ],
          actions: [{ type: "assign_agent", parameters: { type: "tester" } }],
          required_roles: ["reviewer"],
        },
        {
          from: "testing",
          to: "done",
          trigger: "agent_action",
          conditions: [
            { type: "agent_approval", value: "tester", operator: "equals" },
          ],
          actions: [{ type: "add_label", parameters: { label: "completed" } }],
          required_roles: ["tester"],
        },
      ],
      agents_required: {
        proposal: ["analyst"],
        design: ["architect"],
        development: ["coordinator"],
        review: ["reviewer"],
        testing: ["tester"],
      },
      automation_rules: [],
      sla_targets: {
        proposal: 8,
        design: 24,
        development: 168,
        review: 24,
        testing: 48,
      },
    });
  }

  /**
   * Initialize automation rules
   */
  private initializeAutomationRules(): void {
    // Auto-assign urgent issues
    this.automationRules.set("urgent-auto-assign", {
      id: "urgent-auto-assign",
      name: "Auto-assign urgent issues",
      trigger: "issue_created",
      conditions: [{ field: "labels", operator: "contains", value: "urgent" }],
      actions: [
        {
          type: "assign_agent",
          parameters: { type: "coordinator", priority: "high" },
        },
        { type: "notify_team", parameters: { channel: "urgent-issues" } },
      ],
      priority: 1,
      enabled: true,
    });

    // Security issue handling
    this.automationRules.set("security-issue-handler", {
      id: "security-issue-handler",
      name: "Handle security issues",
      trigger: "issue_created",
      conditions: [
        { field: "labels", operator: "contains", value: "security" },
      ],
      actions: [
        {
          type: "assign_agent",
          parameters: { type: "security", priority: "critical" },
        },
        { type: "add_label", parameters: { label: "needs-triage" } },
        { type: "set_priority", parameters: { priority: "critical" } },
      ],
      priority: 1,
      enabled: true,
    });

    // Cross-repository reference
    this.automationRules.set("cross-repo-reference", {
      id: "cross-repo-reference",
      name: "Cross-reference related repositories",
      trigger: "issue_created",
      conditions: [
        { field: "body", operator: "contains", value: "related to" },
      ],
      actions: [
        {
          type: "cross_reference",
          parameters: { action: "find_related_issues" },
        },
      ],
      priority: 3,
      enabled: true,
    });
  }

  /**
   * Process incoming GitHub issue
   */
  async processIssue(issue: GitHubIssue): Promise<string> {
    const sessionId = `issue-${issue.repository}-${issue.number}-${Date.now()}`;

    try {
      // Analyze issue characteristics
      const analysis = await this.analyzeIssue(issue);

      // Determine appropriate workflow
      const workflow = this.selectWorkflow(issue, analysis);

      // Create issue session
      const session = new IssueSession(sessionId, issue, workflow, analysis);
      this.activeIssues.set(issue.number, session);

      // Apply automation rules
      await this.applyAutomationRules(issue, "issue_created");

      // Assign initial agents
      await this.assignInitialAgents(session);

      // Start workflow
      await this.startWorkflow(session);

      this.emit("issue-processed", { sessionId, issue, analysis, workflow });

      return sessionId;
    } catch (error) {
      console.error(
        `Failed to process issue ${issue.repository}#${issue.number}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Analyze issue to understand its characteristics
   */
  private async analyzeIssue(issue: GitHubIssue): Promise<IssueAnalysis> {
    const analysis: IssueAnalysis = {
      complexity_score: await this.calculateComplexityScore(issue),
      priority_score: await this.calculatePriorityScore(issue),
      urgency_level: this.determineUrgencyLevel(issue),
      category: this.categorizeIssue(issue),
      technical_area: this.identifyTechnicalAreas(issue),
      estimated_effort: await this.estimateEffort(issue),
      dependencies: await this.findDependencies(issue),
      related_issues: await this.findRelatedIssues(issue),
      sentiment_score: await this.analyzeSentiment(issue),
      clarity_score: await this.assessClarity(issue),
      actionability_score: await this.assessActionability(issue),
    };

    return analysis;
  }

  /**
   * Select appropriate workflow for issue
   */
  private selectWorkflow(
    issue: GitHubIssue,
    analysis: IssueAnalysis,
  ): IssueWorkflow {
    // Security issues get priority workflow
    if (analysis.category === "security") {
      return this.workflows.get("bug-workflow")!; // Use bug workflow for now
    }

    // Feature requests get feature workflow
    if (
      analysis.category === "feature" ||
      analysis.category === "enhancement"
    ) {
      return this.workflows.get("feature-workflow")!;
    }

    // Default to bug workflow
    return this.workflows.get("bug-workflow")!;
  }

  /**
   * Apply automation rules based on trigger
   */
  private async applyAutomationRules(
    issue: GitHubIssue,
    trigger: string,
  ): Promise<void> {
    const applicableRules = Array.from(this.automationRules.values())
      .filter((rule) => rule.enabled && rule.trigger === trigger)
      .sort((a, b) => a.priority - b.priority);

    for (const rule of applicableRules) {
      const matches = await this.evaluateRuleConditions(rule.conditions, issue);

      if (matches) {
        await this.executeRuleActions(rule.actions, issue);
        this.emit("automation-rule-applied", {
          rule: rule.id,
          issue: issue.number,
        });
      }
    }
  }

  /**
   * Assign initial agents based on workflow and analysis
   */
  private async assignInitialAgents(session: IssueSession): Promise<void> {
    const initialState = session.workflow.states.find((s) => s.is_initial);
    if (!initialState || !initialState.requires_assignment) return;

    const requiredAgents = initialState.required_agents;
    const availableAgents = await this.getAvailableAgents();

    for (const agentType of requiredAgents) {
      const bestAgent = await this.selectBestAgent(
        agentType,
        session,
        availableAgents,
      );

      if (bestAgent) {
        const assignment: AgentAssignment = {
          issue_id: session.issue.number,
          agent_id: bestAgent.id,
          agent_type: bestAgent.type,
          assignment_type: "primary",
          assigned_at: new Date(),
          estimated_completion: this.calculateEstimatedCompletion(
            session,
            agentType,
          ),
          confidence: await this.calculateAssignmentConfidence(
            bestAgent,
            session,
          ),
          specialization_match: await this.calculateSpecializationMatch(
            bestAgent,
            session,
          ),
          workload_factor: await this.calculateWorkloadFactor(bestAgent),
        };

        await this.assignAgentToIssue(assignment);
      }
    }
  }

  /**
   * Start workflow execution
   */
  private async startWorkflow(session: IssueSession): Promise<void> {
    const initialState = session.workflow.states.find((s) => s.is_initial);
    if (!initialState) return;

    session.current_state = initialState.name;
    session.state_history.push({
      state: initialState.name,
      entered_at: new Date(),
      triggered_by: "system",
    });

    // Execute auto-actions for initial state
    await this.executeStateActions(session, initialState.auto_actions);

    this.emit("workflow-started", {
      session: session.id,
      state: initialState.name,
    });
  }

  /**
   * Assign agent to issue
   */
  private async assignAgentToIssue(assignment: AgentAssignment): Promise<void> {
    // Add to assignments map
    if (!this.agentAssignments.has(assignment.agent_id)) {
      this.agentAssignments.set(assignment.agent_id, []);
    }
    this.agentAssignments.get(assignment.agent_id)!.push(assignment);

    // Notify agent via A2A system
    await this.a2aIntegration.executeTask(assignment.agent_id, {
      type: "issue_assignment",
      issue_id: assignment.issue_id,
      assignment_type: assignment.assignment_type,
      estimated_completion: assignment.estimated_completion,
    });

    // Send cross-repo notification if needed
    await this.crossRepo.sendCrossRepoMessage({
      channel_id: "sync-coordination",
      from_agent: "system",
      from_repo: "system",
      to_agents: [assignment.agent_id],
      message_type: "coordination",
      priority: "medium",
      content: {
        type: "issue_assignment",
        issue_id: assignment.issue_id,
        assignment: assignment,
      },
      encrypted: false,
      requires_ack: true,
    });

    this.emit("agent-assigned", { assignment });
  }

  /**
   * Process workflow transition
   */
  async processWorkflowTransition(
    issueNumber: number,
    fromState: string,
    toState: string,
    triggeredBy: string,
  ): Promise<void> {
    const session = this.activeIssues.get(issueNumber);
    if (!session) return;

    const transition = session.workflow.transitions.find(
      (t) => t.from === fromState && t.to === toState,
    );

    if (!transition) {
      throw new Error(`Invalid transition from ${fromState} to ${toState}`);
    }

    // Validate transition conditions
    const conditionsMet = await this.validateTransitionConditions(
      transition.conditions,
      session,
    );
    if (!conditionsMet) {
      throw new Error(
        `Transition conditions not met for ${fromState} -> ${toState}`,
      );
    }

    // Update session state
    session.current_state = toState;
    session.state_history.push({
      state: toState,
      entered_at: new Date(),
      triggered_by: triggeredBy,
    });

    // Execute transition actions
    await this.executeTransitionActions(transition.actions, session);

    // Execute new state auto-actions
    const newState = session.workflow.states.find((s) => s.name === toState);
    if (newState) {
      await this.executeStateActions(session, newState.auto_actions);
    }

    this.emit("workflow-transitioned", {
      session: session.id,
      from: fromState,
      to: toState,
      triggeredBy,
    });
  }

  /**
   * Select best agent for assignment
   */
  private async selectBestAgent(
    agentType: string,
    session: IssueSession,
    availableAgents: A2AAgent[],
  ): Promise<A2AAgent | null> {
    const candidateAgents = availableAgents.filter(
      (agent) => agent.type === agentType && agent.status === "idle",
    );

    if (candidateAgents.length === 0) return null;

    // Score agents based on specialization, workload, and performance
    const scoredAgents = await Promise.all(
      candidateAgents.map(async (agent) => ({
        agent,
        score: await this.calculateAgentScore(agent, session),
      })),
    );

    // Return agent with highest score
    scoredAgents.sort((a, b) => b.score - a.score);
    return scoredAgents[0].agent;
  }

  /**
   * Calculate agent scoring for assignment
   */
  private async calculateAgentScore(
    agent: A2AAgent,
    session: IssueSession,
  ): Promise<number> {
    let score = 0;

    // Specialization match (40% weight)
    const specializationMatch = await this.calculateSpecializationMatch(
      agent,
      session,
    );
    score += specializationMatch * 0.4;

    // Workload factor (30% weight) - lower workload = higher score
    const workloadFactor = await this.calculateWorkloadFactor(agent);
    score += (1 - workloadFactor) * 0.3;

    // Performance history (20% weight)
    const performanceScore =
      agent.metrics.tasks_completed /
      Math.max(1, agent.metrics.tasks_completed + 1);
    score += performanceScore * 0.2;

    // Availability (10% weight)
    const availabilityScore = agent.status === "idle" ? 1 : 0;
    score += availabilityScore * 0.1;

    return score;
  }

  // Analysis utility methods
  private async calculateComplexityScore(issue: GitHubIssue): Promise<number> {
    let score = 0;

    // Length of description
    score += Math.min(issue.body.length / 100, 30);

    // Number of technical terms
    const technicalTerms = [
      "api",
      "database",
      "auth",
      "security",
      "performance",
      "bug",
      "error",
    ];
    const termCount = technicalTerms.filter(
      (term) =>
        issue.title.toLowerCase().includes(term) ||
        issue.body.toLowerCase().includes(term),
    ).length;
    score += termCount * 10;

    // Labels complexity
    score += issue.labels.length * 5;

    return Math.min(score, 100);
  }

  private async calculatePriorityScore(issue: GitHubIssue): Promise<number> {
    let score = 50; // Base score

    // Label-based priority
    const priorityLabels = ["urgent", "high-priority", "critical", "blocker"];
    for (const label of issue.labels) {
      if (priorityLabels.includes(label.name.toLowerCase())) {
        score += 25;
      }
    }

    // Reactions indicate community interest
    const totalReactions = Object.values(issue.reactions).reduce(
      (sum, count) => sum + count,
      0,
    );
    score += Math.min(totalReactions * 2, 20);

    return Math.min(score, 100);
  }

  private determineUrgencyLevel(
    issue: GitHubIssue,
  ): "low" | "medium" | "high" | "critical" {
    const urgentLabels = ["urgent", "critical", "blocker", "security"];
    const hasUrgentLabel = issue.labels.some((label) =>
      urgentLabels.includes(label.name.toLowerCase()),
    );

    if (hasUrgentLabel) return "critical";

    const highPriorityLabels = ["high-priority", "important"];
    const hasHighPriorityLabel = issue.labels.some((label) =>
      highPriorityLabels.includes(label.name.toLowerCase()),
    );

    if (hasHighPriorityLabel) return "high";

    const reactions = Object.values(issue.reactions).reduce(
      (sum, count) => sum + count,
      0,
    );
    if (reactions > 5) return "medium";

    return "low";
  }

  private categorizeIssue(issue: GitHubIssue): IssueAnalysis["category"] {
    const text = (issue.title + " " + issue.body).toLowerCase();

    if (text.includes("security") || text.includes("vulnerability"))
      return "security";
    if (
      text.includes("bug") ||
      text.includes("error") ||
      text.includes("issue")
    )
      return "bug";
    if (
      text.includes("feature") ||
      text.includes("add") ||
      text.includes("implement")
    )
      return "feature";
    if (
      text.includes("improve") ||
      text.includes("enhance") ||
      text.includes("optimize")
    )
      return "enhancement";
    if (
      text.includes("document") ||
      text.includes("readme") ||
      text.includes("guide")
    )
      return "documentation";

    return "question";
  }

  private identifyTechnicalAreas(issue: GitHubIssue): string[] {
    const text = (issue.title + " " + issue.body).toLowerCase();
    const areas: string[] = [];

    const areaKeywords = {
      frontend: ["ui", "frontend", "react", "vue", "angular", "css", "html"],
      backend: ["api", "backend", "server", "database", "endpoint"],
      security: ["auth", "security", "encryption", "vulnerability", "token"],
      performance: ["performance", "slow", "optimization", "memory", "cpu"],
      testing: ["test", "testing", "spec", "qa", "coverage"],
      deployment: ["deploy", "deployment", "ci", "cd", "docker", "kubernetes"],
      documentation: ["docs", "documentation", "readme", "guide", "manual"],
    };

    for (const [area, keywords] of Object.entries(areaKeywords)) {
      if (keywords.some((keyword) => text.includes(keyword))) {
        areas.push(area);
      }
    }

    return areas.length > 0 ? areas : ["general"];
  }

  private async estimateEffort(issue: GitHubIssue): Promise<number> {
    const complexity = await this.calculateComplexityScore(issue);
    const category = this.categorizeIssue(issue);

    const baseTimes = {
      bug: 4,
      feature: 16,
      enhancement: 8,
      documentation: 2,
      question: 1,
      security: 12,
    };

    const baseTime = baseTimes[category] || 4;
    const complexityMultiplier = 1 + complexity / 100;

    return Math.ceil(baseTime * complexityMultiplier);
  }

  private async findDependencies(issue: GitHubIssue): Promise<string[]> {
    const dependencies: string[] = [];

    // Look for dependency keywords in issue body
    const dependencyPatterns = [
      /depends on #(\d+)/gi,
      /blocked by #(\d+)/gi,
      /requires #(\d+)/gi,
    ];

    for (const pattern of dependencyPatterns) {
      const matches = issue.body.match(pattern);
      if (matches) {
        dependencies.push(...matches);
      }
    }

    return dependencies;
  }

  private async findRelatedIssues(issue: GitHubIssue): Promise<number[]> {
    const related: number[] = [];

    // Extract issue references from body
    const issuePattern = /#(\d+)/g;
    const matches = issue.body.match(issuePattern);

    if (matches) {
      related.push(...matches.map((match) => parseInt(match.substring(1))));
    }

    return related;
  }

  private async analyzeSentiment(issue: GitHubIssue): Promise<number> {
    // Simple sentiment analysis based on keywords
    const positiveWords = [
      "please",
      "thanks",
      "appreciate",
      "great",
      "awesome",
    ];
    const negativeWords = ["urgent", "critical", "broken", "terrible", "hate"];

    const text = (issue.title + " " + issue.body).toLowerCase();

    let score = 0.5; // Neutral baseline

    positiveWords.forEach((word) => {
      if (text.includes(word)) score += 0.1;
    });

    negativeWords.forEach((word) => {
      if (text.includes(word)) score -= 0.1;
    });

    return Math.max(0, Math.min(1, score));
  }

  private async assessClarity(issue: GitHubIssue): Promise<number> {
    let score = 0.5;

    // Has steps to reproduce
    if (
      issue.body.toLowerCase().includes("steps") &&
      issue.body.toLowerCase().includes("reproduce")
    ) {
      score += 0.2;
    }

    // Has expected vs actual behavior
    if (
      issue.body.toLowerCase().includes("expected") &&
      issue.body.toLowerCase().includes("actual")
    ) {
      score += 0.2;
    }

    // Has environment info
    if (
      issue.body.toLowerCase().includes("environment") ||
      issue.body.toLowerCase().includes("version")
    ) {
      score += 0.1;
    }

    return Math.min(1, score);
  }

  private async assessActionability(issue: GitHubIssue): Promise<number> {
    let score = 0.5;

    // Has clear description
    if (issue.body.length > 50) score += 0.2;

    // Has labels
    if (issue.labels.length > 0) score += 0.1;

    // Not just a question
    if (!issue.title.endsWith("?")) score += 0.1;

    // Has specific technical details
    const technicalTerms = ["api", "function", "method", "class", "module"];
    if (
      technicalTerms.some((term) => issue.body.toLowerCase().includes(term))
    ) {
      score += 0.1;
    }

    return Math.min(1, score);
  }

  private async evaluateRuleConditions(
    conditions: RuleCondition[],
    issue: GitHubIssue,
  ): Promise<boolean> {
    for (const condition of conditions) {
      const fieldValue = this.getFieldValue(issue, condition.field);

      if (!this.evaluateCondition(fieldValue, condition)) {
        return false;
      }
    }

    return true;
  }

  private getFieldValue(issue: GitHubIssue, field: string): any {
    switch (field) {
      case "labels":
        return issue.labels.map((l) => l.name);
      case "title":
        return issue.title;
      case "body":
        return issue.body;
      case "author":
        return issue.author;
      case "state":
        return issue.state;
      default:
        return null;
    }
  }

  private evaluateCondition(
    fieldValue: any,
    condition: RuleCondition,
  ): boolean {
    switch (condition.operator) {
      case "equals":
        return fieldValue === condition.value;
      case "contains":
        return Array.isArray(fieldValue)
          ? fieldValue.includes(condition.value)
          : String(fieldValue).includes(condition.value);
      case "matches":
        return new RegExp(condition.value).test(String(fieldValue));
      case "greater_than":
        return Number(fieldValue) > Number(condition.value);
      case "in_list":
        return (
          Array.isArray(condition.value) && condition.value.includes(fieldValue)
        );
      default:
        return false;
    }
  }

  private async executeRuleActions(
    actions: RuleAction[],
    issue: GitHubIssue,
  ): Promise<void> {
    for (const action of actions) {
      switch (action.type) {
        case "assign_agent":
          await this.executeAssignAgentAction(action.parameters, issue);
          break;
        case "add_label":
          await this.executeAddLabelAction(action.parameters, issue);
          break;
        case "set_priority":
          await this.executeSetPriorityAction(action.parameters, issue);
          break;
        case "notify_team":
          await this.executeNotifyTeamAction(action.parameters, issue);
          break;
        case "cross_reference":
          await this.executeCrossReferenceAction(action.parameters, issue);
          break;
      }
    }
  }

  private async executeAssignAgentAction(
    parameters: any,
    issue: GitHubIssue,
  ): Promise<void> {
    const agentType = parameters.type;
    const priority = parameters.priority || "medium";

    // Find and assign appropriate agent
    const availableAgents = await this.getAvailableAgents();
    const session = this.activeIssues.get(issue.number);

    if (session) {
      const bestAgent = await this.selectBestAgent(
        agentType,
        session,
        availableAgents,
      );

      if (bestAgent) {
        const assignment: AgentAssignment = {
          issue_id: issue.number,
          agent_id: bestAgent.id,
          agent_type: bestAgent.type,
          assignment_type: "primary",
          assigned_at: new Date(),
          estimated_completion: this.calculateEstimatedCompletion(
            session,
            agentType,
          ),
          confidence: await this.calculateAssignmentConfidence(
            bestAgent,
            session,
          ),
          specialization_match: await this.calculateSpecializationMatch(
            bestAgent,
            session,
          ),
          workload_factor: await this.calculateWorkloadFactor(bestAgent),
        };

        await this.assignAgentToIssue(assignment);
      }
    }
  }

  private async executeAddLabelAction(
    parameters: any,
    issue: GitHubIssue,
  ): Promise<void> {
    const label = parameters.label;
    console.log(`Adding label '${label}' to issue ${issue.number}`);
    // In real implementation, this would call GitHub API
  }

  private async executeSetPriorityAction(
    parameters: any,
    issue: GitHubIssue,
  ): Promise<void> {
    const priority = parameters.priority;
    console.log(`Setting priority '${priority}' for issue ${issue.number}`);
    // In real implementation, this would update issue metadata
  }

  private async executeNotifyTeamAction(
    parameters: any,
    issue: GitHubIssue,
  ): Promise<void> {
    const channel = parameters.channel;
    console.log(
      `Notifying team in channel '${channel}' about issue ${issue.number}`,
    );
    // In real implementation, this would send notifications
  }

  private async executeCrossReferenceAction(
    parameters: any,
    issue: GitHubIssue,
  ): Promise<void> {
    const action = parameters.action;

    if (action === "find_related_issues") {
      // Use cross-repo system to find related issues
      await this.crossRepo.sendCrossRepoMessage({
        channel_id: "sync-coordination",
        from_agent: "system",
        from_repo: issue.repository,
        message_type: "request",
        priority: "low",
        content: {
          type: "find_related_issues",
          issue_id: issue.number,
          search_terms: this.extractSearchTerms(issue),
        },
        encrypted: false,
        requires_ack: false,
      });
    }
  }

  private extractSearchTerms(issue: GitHubIssue): string[] {
    const terms: string[] = [];

    // Extract key terms from title and body
    const text = (issue.title + " " + issue.body).toLowerCase();
    const words = text.split(/\s+/);

    // Filter for meaningful terms
    const meaningfulWords = words.filter(
      (word) =>
        word.length > 3 &&
        !["the", "and", "or", "but", "with", "from", "this", "that"].includes(
          word,
        ),
    );

    // Take top 10 most relevant terms
    terms.push(...meaningfulWords.slice(0, 10));

    return terms;
  }

  private async validateTransitionConditions(
    conditions: TransitionCondition[],
    session: IssueSession,
  ): Promise<boolean> {
    for (const condition of conditions) {
      if (!(await this.evaluateTransitionCondition(condition, session))) {
        return false;
      }
    }
    return true;
  }

  private async evaluateTransitionCondition(
    condition: TransitionCondition,
    session: IssueSession,
  ): Promise<boolean> {
    switch (condition.type) {
      case "label_present":
        return session.issue.labels.some((l) => l.name === condition.value);
      case "agent_approval":
        // Check if agent has approved the transition
        return await this.checkAgentApproval(condition.value, session);
      case "time_elapsed":
        const elapsedHours =
          (Date.now() - session.created_at.getTime()) / (1000 * 60 * 60);
        return elapsedHours >= condition.value;
      case "pr_merged":
        return await this.checkPRMerged(session);
      default:
        return false;
    }
  }

  private async checkAgentApproval(
    agentType: string,
    session: IssueSession,
  ): Promise<boolean> {
    // Check if agent of the specified type has approved
    const assignments =
      this.agentAssignments.get(session.issue.number.toString()) || [];
    const relevantAssignment = assignments.find(
      (a) => a.agent_type === agentType,
    );

    // In real implementation, this would check agent's actual approval status
    return relevantAssignment !== undefined;
  }

  private async checkPRMerged(session: IssueSession): Promise<boolean> {
    // Check if any linked PRs are merged
    return session.issue.linked_prs.length > 0; // Simplified check
  }

  private async executeTransitionActions(
    actions: TransitionAction[],
    session: IssueSession,
  ): Promise<void> {
    for (const action of actions) {
      switch (action.type) {
        case "add_label":
          console.log(
            `Adding label '${action.parameters.label}' to issue ${session.issue.number}`,
          );
          break;
        case "remove_label":
          console.log(
            `Removing label '${action.parameters.label}' from issue ${session.issue.number}`,
          );
          break;
        case "assign_agent":
          await this.executeAssignAgentAction(action.parameters, session.issue);
          break;
        case "update_milestone":
          console.log(
            `Updating milestone to '${action.parameters.milestone}' for issue ${session.issue.number}`,
          );
          break;
      }
    }
  }

  private async executeStateActions(
    session: IssueSession,
    actions: string[],
  ): Promise<void> {
    for (const action of actions) {
      switch (action) {
        case "analyze":
          console.log(`Analyzing issue ${session.issue.number}`);
          break;
        case "investigate":
          console.log(`Investigating issue ${session.issue.number}`);
          break;
        case "track-progress":
          console.log(`Tracking progress for issue ${session.issue.number}`);
          break;
        case "test":
          console.log(`Testing solution for issue ${session.issue.number}`);
          break;
        case "close":
          console.log(`Closing issue ${session.issue.number}`);
          break;
      }
    }
  }

  // Utility methods
  private calculateEstimatedCompletion(
    session: IssueSession,
    agentType: string,
  ): Date {
    const slaHours =
      session.workflow.sla_targets[session.current_state || "triage"] || 24;
    return new Date(Date.now() + slaHours * 60 * 60 * 1000);
  }

  private async calculateAssignmentConfidence(
    agent: A2AAgent,
    session: IssueSession,
  ): Promise<number> {
    // Base confidence on agent's track record and issue complexity
    const successRate =
      agent.metrics.tasks_completed /
      Math.max(1, agent.metrics.tasks_completed + 1);
    const complexityFactor = 1 - session.analysis.complexity_score / 100;

    return (successRate + complexityFactor) / 2;
  }

  private async calculateSpecializationMatch(
    agent: A2AAgent,
    session: IssueSession,
  ): Promise<number> {
    const agentCapabilities = agent.capabilities;
    const issueAreas = session.analysis.technical_area;

    // Calculate overlap between agent capabilities and issue technical areas
    const matches = agentCapabilities.filter((cap) =>
      issueAreas.some((area) => cap.includes(area) || area.includes(cap)),
    ).length;

    return matches / Math.max(1, agentCapabilities.length);
  }

  private async calculateWorkloadFactor(agent: A2AAgent): Promise<number> {
    const assignments = this.agentAssignments.get(agent.id) || [];
    const activeAssignments = assignments.filter(
      (a) => a.estimated_completion > new Date(),
    ).length;

    // Normalize to 0-1 scale (assuming max 10 concurrent assignments)
    return Math.min(activeAssignments / 10, 1);
  }

  private async getAvailableAgents(): Promise<A2AAgent[]> {
    // This would integrate with the bridge to get available agents
    return [];
  }

  private setupEventHandlers(): void {
    this.on("workflow-timeout", (data) => {
      console.warn(`Workflow timeout for issue ${data.issueNumber}`);
      // Handle SLA violations
    });

    this.on("agent-assignment-failed", (data) => {
      console.error(`Failed to assign agent for issue ${data.issueNumber}`);
      // Implement fallback assignment logic
    });
  }

  /**
   * Get system status and metrics
   */
  getStatus(): any {
    return {
      active_issues: this.activeIssues.size,
      agent_assignments: Array.from(this.agentAssignments.values()).reduce(
        (sum, assignments) => sum + assignments.length,
        0,
      ),
      workflows: this.workflows.size,
      automation_rules: this.automationRules.size,
    };
  }

  /**
   * Get issue analytics
   */
  getAnalytics(): any {
    const issues = Array.from(this.activeIssues.values());
    const totalIssues = issues.length;

    const byCategory = issues.reduce(
      (acc, session) => {
        const category = session.analysis.category;
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const byState = issues.reduce(
      (acc, session) => {
        const state = session.current_state || "unknown";
        acc[state] = (acc[state] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      total_issues: totalIssues,
      by_category: byCategory,
      by_state: byState,
      average_complexity:
        totalIssues > 0
          ? issues.reduce((sum, s) => sum + s.analysis.complexity_score, 0) /
            totalIssues
          : 0,
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.activeIssues.clear();
    this.agentAssignments.clear();
    this.issueAnalytics.clear();
    this.emit("issue-tracker-shutdown");
  }
}

// Supporting classes
class IssueSession {
  public id: string;
  public issue: GitHubIssue;
  public workflow: IssueWorkflow;
  public analysis: IssueAnalysis;
  public current_state?: string;
  public state_history: Array<{
    state: string;
    entered_at: Date;
    triggered_by: string;
  }> = [];
  public created_at: Date;

  constructor(
    id: string,
    issue: GitHubIssue,
    workflow: IssueWorkflow,
    analysis: IssueAnalysis,
  ) {
    this.id = id;
    this.issue = issue;
    this.workflow = workflow;
    this.analysis = analysis;
    this.created_at = new Date();
  }
}
