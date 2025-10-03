/**
 * Jules Agent Mapper
 * 
 * Maps Jules task types to specialized agent categories from the 96-agent swarm.
 * Implements intelligent agent selection based on task type, priority, and context.
 */

import { Logger } from '../../utils/logger.js';
import { AGENT_DEFINITIONS, AgentDefinition } from '../../agents/agent-definitions.js';

/**
 * Agent selection result
 */
export interface AgentSelection {
  primary: string[];        // Primary agents to execute the task
  validators: string[];     // Validator agents for consensus
  coordinators: string[];   // Coordination agents for orchestration
  metadata: {
    taskType: string;
    confidence: number;
    reasoning: string;
  };
}

/**
 * Task complexity levels
 */
export type TaskComplexity = 'simple' | 'moderate' | 'complex' | 'expert';

/**
 * Task context for agent selection
 */
export interface TaskContext {
  type: 'bug-fix' | 'feature' | 'refactor' | 'documentation' | 'test';
  priority: 'low' | 'medium' | 'high' | 'critical';
  files?: string[];
  description?: string;
  complexity?: TaskComplexity;
  requiresConsensus?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Jules Agent Mapper
 * 
 * Maps Jules tasks to the optimal agent swarm configuration
 */
export class JulesAgentMapper {
  private logger: Logger;
  private agentDefinitions: Record<string, AgentDefinition>;

  // Task type to agent category mapping
  private readonly TASK_AGENT_MAPPING = {
    'bug-fix': {
      primary: ['core-development', 'testing-specialists', 'code-quality'],
      validators: ['code-quality', 'security-framework'],
      coordinators: ['swarm-coordination'],
      agents: ['coder', 'debugger', 'tester', 'reviewer']
    },
    'feature': {
      primary: ['core-development', 'creative-development', 'engineering-operations'],
      validators: ['code-quality', 'testing-specialists', 'security-framework'],
      coordinators: ['swarm-coordination'],
      agents: ['planner', 'architect', 'coder', 'tester', 'reviewer']
    },
    'refactor': {
      primary: ['code-quality', 'performance-optimization', 'core-development'],
      validators: ['testing-specialists', 'security-framework'],
      coordinators: ['swarm-coordination'],
      agents: ['refactorer', 'performance-optimizer', 'code-quality-specialist', 'tester']
    },
    'documentation': {
      primary: ['documentation-specialists', 'knowledge-management'],
      validators: ['code-quality'],
      coordinators: ['swarm-coordination'],
      agents: ['documentation-writer', 'technical-writer', 'knowledge-curator']
    },
    'test': {
      primary: ['testing-specialists', 'code-quality'],
      validators: ['core-development'],
      coordinators: ['swarm-coordination'],
      agents: ['test-engineer', 'qa-specialist', 'integration-tester', 'performance-tester']
    }
  };

  constructor() {
    this.logger = new Logger('JulesAgentMapper');
    this.agentDefinitions = AGENT_DEFINITIONS;
  }

  /**
   * Select optimal agents for a Jules task
   */
  async selectAgents(context: TaskContext): Promise<AgentSelection> {
    this.logger.info(`Selecting agents for task type: ${context.type}`);

    const mapping = this.TASK_AGENT_MAPPING[context.type];
    if (!mapping) {
      throw new Error(`Unknown task type: ${context.type}`);
    }

    // Determine complexity
    const complexity = context.complexity || this.assessComplexity(context);

    // Select primary agents based on task type and complexity
    const primary = this.selectPrimaryAgents(
      mapping.agents,
      complexity,
      context.priority
    );

    // Select validator agents for consensus
    const validators = this.selectValidatorAgents(
      mapping.validators,
      context.requiresConsensus !== false // Default to true
    );

    // Select coordination agents
    const coordinators = this.selectCoordinators(
      mapping.coordinators,
      complexity
    );

    const selection: AgentSelection = {
      primary,
      validators,
      coordinators,
      metadata: {
        taskType: context.type,
        confidence: this.calculateConfidence(primary, validators, coordinators),
        reasoning: this.generateReasoningExplanation(context, primary, validators, coordinators)
      }
    };

    this.logger.info('Agent selection completed', {
      primary: primary.length,
      validators: validators.length,
      coordinators: coordinators.length,
      confidence: selection.metadata.confidence
    });

    return selection;
  }

  /**
   * Get agents by category
   */
  getAgentsByCategory(category: string): AgentDefinition[] {
    return Object.values(this.agentDefinitions).filter(
      agent => agent.category === category
    );
  }

  /**
   * Get specific agent by ID
   */
  getAgent(agentId: string): AgentDefinition | undefined {
    return this.agentDefinitions[agentId];
  }

  /**
   * Assess task complexity based on context
   */
  private assessComplexity(context: TaskContext): TaskComplexity {
    let score = 0;

    // File count contribution
    const fileCount = context.files?.length || 0;
    if (fileCount === 0) score += 0;
    else if (fileCount <= 3) score += 1;
    else if (fileCount <= 10) score += 2;
    else score += 3;

    // Priority contribution
    const priorityScore = {
      'low': 0,
      'medium': 1,
      'high': 2,
      'critical': 3
    }[context.priority] || 1;
    score += priorityScore;

    // Description length contribution (complexity indicator)
    const descLength = context.description?.length || 0;
    if (descLength > 500) score += 2;
    else if (descLength > 200) score += 1;

    // Map score to complexity
    if (score <= 2) return 'simple';
    if (score <= 4) return 'moderate';
    if (score <= 6) return 'complex';
    return 'expert';
  }

  /**
   * Select primary agents based on task requirements
   */
  private selectPrimaryAgents(
    agentIds: string[],
    complexity: TaskComplexity,
    priority: string
  ): string[] {
    const countMap: Record<TaskComplexity, number> = {
      'simple': 1,
      'moderate': 2,
      'complex': 3,
      'expert': 4
    };

    let count = countMap[complexity];

    // Increase count for high priority tasks
    if (priority === 'critical') {
      count = Math.min(count + 2, agentIds.length);
    } else if (priority === 'high') {
      count = Math.min(count + 1, agentIds.length);
    }

    // Filter to available agents and select based on priority
    const availableAgents = agentIds.filter(id => this.agentDefinitions[id]);

    // Sort by capability match and temperature (lower = more deterministic)
    const sortedAgents = availableAgents.sort((a, b) => {
      const agentA = this.agentDefinitions[a];
      const agentB = this.agentDefinitions[b];
      return (agentA.temperature || 0.5) - (agentB.temperature || 0.5);
    });

    return sortedAgents.slice(0, count);
  }

  /**
   * Select validator agents for consensus
   */
  private selectValidatorAgents(
    categories: string[],
    requiresConsensus: boolean
  ): string[] {
    if (!requiresConsensus) {
      return [];
    }

    const validators: string[] = [];

    // Get agents from validator categories
    for (const category of categories) {
      const categoryAgents = this.getAgentsByCategory(category);
      
      // Select top 2 agents from each category
      const selected = categoryAgents
        .sort((a, b) => (a.temperature || 0.5) - (b.temperature || 0.5))
        .slice(0, 2)
        .map(agent => agent.id);

      validators.push(...selected);
    }

    // Ensure we have at least 3 validators for Byzantine consensus (2f+1)
    if (validators.length < 3) {
      // Add reviewer as fallback
      if (this.agentDefinitions['reviewer']) {
        validators.push('reviewer');
      }
      // Add quality specialists
      const qualityAgents = this.getAgentsByCategory('code-quality');
      for (const agent of qualityAgents) {
        if (validators.length >= 3) break;
        if (!validators.includes(agent.id)) {
          validators.push(agent.id);
        }
      }
    }

    return validators.slice(0, 5); // Cap at 5 validators
  }

  /**
   * Select coordination agents
   */
  private selectCoordinators(
    categories: string[],
    complexity: TaskComplexity
  ): string[] {
    const coordinators: string[] = [];

    // For simple tasks, use adaptive coordinator
    if (complexity === 'simple') {
      if (this.agentDefinitions['adaptive-coordinator']) {
        coordinators.push('adaptive-coordinator');
      }
    } 
    // For moderate tasks, use mesh coordinator
    else if (complexity === 'moderate') {
      if (this.agentDefinitions['mesh-coordinator']) {
        coordinators.push('mesh-coordinator');
      }
    }
    // For complex/expert tasks, use hierarchical coordinator
    else {
      if (this.agentDefinitions['hierarchical-coordinator']) {
        coordinators.push('hierarchical-coordinator');
      }
    }

    return coordinators;
  }

  /**
   * Calculate confidence score for agent selection
   */
  private calculateConfidence(
    primary: string[],
    validators: string[],
    coordinators: string[]
  ): number {
    let confidence = 0.5; // Base confidence

    // Primary agents contribution (0-0.3)
    if (primary.length > 0) {
      confidence += Math.min(primary.length * 0.1, 0.3);
    }

    // Validators contribution (0-0.2)
    if (validators.length >= 3) {
      confidence += 0.2;
    } else if (validators.length > 0) {
      confidence += validators.length * 0.05;
    }

    // Coordinator contribution (0-0.1)
    if (coordinators.length > 0) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Generate reasoning explanation for agent selection
   */
  private generateReasoningExplanation(
    context: TaskContext,
    primary: string[],
    validators: string[],
    coordinators: string[]
  ): string {
    const parts: string[] = [];

    parts.push(`Selected ${primary.length} primary agent(s) for ${context.type} task`);
    
    if (validators.length > 0) {
      parts.push(`${validators.length} validator(s) for Byzantine consensus`);
    }

    if (coordinators.length > 0) {
      parts.push(`${coordinators.length} coordinator(s) for orchestration`);
    }

    if (context.priority === 'critical' || context.priority === 'high') {
      parts.push(`Enhanced agent allocation for ${context.priority} priority`);
    }

    return parts.join('; ');
  }

  /**
   * Get task mapping for a specific task type
   */
  getTaskMapping(taskType: string): typeof this.TASK_AGENT_MAPPING[keyof typeof this.TASK_AGENT_MAPPING] | undefined {
    return this.TASK_AGENT_MAPPING[taskType as keyof typeof this.TASK_AGENT_MAPPING];
  }

  /**
   * Validate agent selection
   */
  validateSelection(selection: AgentSelection): boolean {
    // Must have at least one primary agent
    if (selection.primary.length === 0) {
      this.logger.error('Invalid selection: No primary agents');
      return false;
    }

    // If consensus required, must have at least 3 validators (2f+1 for f=1)
    if (selection.validators.length > 0 && selection.validators.length < 3) {
      this.logger.warn('Suboptimal validator count for Byzantine consensus');
    }

    // All agents must exist
    const allAgents = [...selection.primary, ...selection.validators, ...selection.coordinators];
    for (const agentId of allAgents) {
      if (!this.agentDefinitions[agentId]) {
        this.logger.error(`Invalid agent ID: ${agentId}`);
        return false;
      }
    }

    return true;
  }
}
