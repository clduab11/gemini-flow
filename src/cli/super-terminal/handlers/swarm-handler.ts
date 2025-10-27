/**
 * Swarm Orchestration Command Handlers
 *
 * Handlers for agent swarm operations:
 * - spawn: Spawn new agent
 * - terminate: Terminate agent
 * - list: List active agents
 * - status: Get agent status
 * - send: Send message to agent
 * - broadcast: Broadcast to all agents
 */

import {
  CommandHandler,
  CommandStream,
  CommandContext,
  ValidationResult,
  SwarmOperation,
  SwarmConfig,
} from '../types.js';
import { AgentSpaceManager } from '../../../agentspace/core/AgentSpaceManager.js';
import { A2AProtocolManager } from '../../../protocols/a2a/core/a2a-protocol-manager.js';

/**
 * Base class for swarm command handlers
 */
abstract class BaseSwarmHandler implements CommandHandler {
  namespace = 'swarm' as const;
  abstract action: string;
  abstract description: string;

  protected agentSpace: AgentSpaceManager;
  protected a2aProtocol: A2AProtocolManager;

  constructor(agentSpace: AgentSpaceManager, a2aProtocol: A2AProtocolManager) {
    this.agentSpace = agentSpace;
    this.a2aProtocol = a2aProtocol;
  }

  get schema() {
    return {
      args: this.getArgDefinitions(),
      flags: this.getFlagDefinitions(),
      examples: this.getExamples(),
    };
  }

  abstract getArgDefinitions(): any[];
  abstract getFlagDefinitions(): any[];
  abstract getExamples(): string[];

  async validate(args: Record<string, any>): Promise<ValidationResult> {
    // Default validation - override in subclasses
    return { valid: true };
  }

  abstract execute(args: Record<string, any>, context: CommandContext): Promise<CommandStream>;
}

// ============================================================================
// Spawn Agent
// ============================================================================

export class SpawnAgentHandler extends BaseSwarmHandler {
  action = 'spawn';
  description = 'Spawn a new agent in the swarm';

  getArgDefinitions() {
    return [
      {
        name: 'agentType',
        type: 'string',
        required: true,
        description: 'Type of agent to spawn (e.g., coder, researcher, quantum-circuit-designer)',
      },
    ];
  }

  getFlagDefinitions() {
    return [
      {
        name: 'priority',
        type: 'string',
        description: 'Agent priority (critical, high, medium, low)',
        default: 'medium',
      },
      {
        name: 'timeout',
        type: 'number',
        description: 'Agent timeout in milliseconds',
        default: 30000,
      },
      {
        name: 'memory',
        type: 'number',
        description: 'Max memory in MB',
        default: 512,
      },
    ];
  }

  getExamples() {
    return [
      'swarm spawn coder',
      'swarm spawn quantum-circuit-designer --priority high',
      'swarm spawn researcher --memory 1024 --timeout 60000',
    ];
  }

  async validate(args: Record<string, any>): Promise<ValidationResult> {
    const errors: string[] = [];

    const agentType = args.agentType || args.arg0;
    if (!agentType) {
      errors.push('Agent type is required');
    }

    return { valid: errors.length === 0, errors };
  }

  async execute(args: Record<string, any>, context: CommandContext): Promise<CommandStream> {
    const stream = new CommandStream(`spawn-${Date.now()}`);
    const agentType = args.agentType || args.arg0;

    (async () => {
      try {
        const startTime = Date.now();
        stream.chunk(`Spawning ${agentType} agent...`, 'log');
        stream.updateProgress(20);

        const config: SwarmConfig = {
          priority: args.priority || 'medium',
          timeout: args.timeout ? Number(args.timeout) : 30000,
          resources: {
            maxMemoryMB: args.memory ? Number(args.memory) : 512,
            maxCPUPercentage: args.cpu ? Number(args.cpu) : 50,
          },
          topology: args.topology || 'mesh',
        };

        const agentConfig = {
          type: agentType,
          ...config,
        };

        stream.updateProgress(50);
        const agent = await this.agentSpace.spawnAgent(agentConfig);

        const spawnTime = Date.now() - startTime;
        stream.updateProgress(100);

        const result = {
          agentId: agent.id || agent.agentId,
          agentType,
          spawnTime,
          status: 'active',
          config,
        };

        stream.chunk({
          agentId: result.agentId,
          spawnTime: `${spawnTime}ms`,
          status: result.status,
        }, 'agent-event');

        // Check if spawn time meets SLA (<100ms)
        if (spawnTime > 100) {
          stream.chunk(`Warning: Spawn time ${spawnTime}ms exceeds 100ms target`, 'log');
        }

        stream.complete(result);
      } catch (error) {
        stream.fail(error as Error);
      }
    })();

    return stream;
  }

  estimateDuration(): number {
    return 100; // Target <100ms spawn time
  }
}

// ============================================================================
// List Agents
// ============================================================================

export class ListAgentsHandler extends BaseSwarmHandler {
  action = 'list';
  description = 'List all active agents in the swarm';

  getArgDefinitions() {
    return [];
  }

  getFlagDefinitions() {
    return [
      {
        name: 'category',
        type: 'string',
        description: 'Filter by agent category',
      },
      {
        name: 'status',
        type: 'string',
        description: 'Filter by status (active, idle, busy)',
      },
    ];
  }

  getExamples() {
    return [
      'swarm list',
      'swarm list --category quantum',
      'swarm list --status busy',
    ];
  }

  async execute(args: Record<string, any>, context: CommandContext): Promise<CommandStream> {
    const stream = new CommandStream(`list-${Date.now()}`);

    (async () => {
      try {
        stream.chunk('Fetching agent list...', 'log');
        stream.updateProgress(30);

        const agents = await this.agentSpace.listAgents();

        // Apply filters
        let filteredAgents = agents;

        if (args.category) {
          filteredAgents = filteredAgents.filter(a =>
            a.category?.toLowerCase() === args.category.toLowerCase()
          );
        }

        if (args.status) {
          filteredAgents = filteredAgents.filter(a =>
            a.status?.toLowerCase() === args.status.toLowerCase()
          );
        }

        stream.updateProgress(80);

        // Format agent list
        const agentList = filteredAgents.map(a => ({
          id: a.id || a.agentId,
          type: a.type,
          category: a.category,
          status: a.status,
          uptime: a.uptime || 'N/A',
        }));

        stream.updateProgress(100);
        stream.chunk({
          total: agentList.length,
          agents: agentList,
        }, 'json');

        stream.complete({ agents: agentList, total: agentList.length });
      } catch (error) {
        stream.fail(error as Error);
      }
    })();

    return stream;
  }
}

// ============================================================================
// Agent Status
// ============================================================================

export class AgentStatusHandler extends BaseSwarmHandler {
  action = 'status';
  description = 'Get detailed status of an agent';

  getArgDefinitions() {
    return [
      {
        name: 'agentId',
        type: 'string',
        required: true,
        description: 'Agent ID to query',
      },
    ];
  }

  getFlagDefinitions() {
    return [];
  }

  getExamples() {
    return [
      'swarm status agent-123',
      'swarm status coder-456',
    ];
  }

  async validate(args: Record<string, any>): Promise<ValidationResult> {
    const errors: string[] = [];

    const agentId = args.agentId || args.arg0;
    if (!agentId) {
      errors.push('Agent ID is required');
    }

    return { valid: errors.length === 0, errors };
  }

  async execute(args: Record<string, any>, context: CommandContext): Promise<CommandStream> {
    const stream = new CommandStream(`status-${Date.now()}`);
    const agentId = args.agentId || args.arg0;

    (async () => {
      try {
        stream.chunk(`Querying status for agent ${agentId}...`, 'log');
        stream.updateProgress(30);

        const agent = await this.agentSpace.getAgent(agentId);

        if (!agent) {
          throw new Error(`Agent not found: ${agentId}`);
        }

        stream.updateProgress(80);

        const status = {
          id: agent.id || agent.agentId,
          type: agent.type,
          category: agent.category,
          status: agent.status,
          uptime: agent.uptime || 0,
          tasksProcessed: agent.tasksProcessed || 0,
          currentTask: agent.currentTask,
          resources: agent.resources,
        };

        stream.updateProgress(100);
        stream.chunk(status, 'json');
        stream.complete(status);
      } catch (error) {
        stream.fail(error as Error);
      }
    })();

    return stream;
  }
}

// ============================================================================
// Terminate Agent
// ============================================================================

export class TerminateAgentHandler extends BaseSwarmHandler {
  action = 'terminate';
  description = 'Terminate an agent';

  getArgDefinitions() {
    return [
      {
        name: 'agentId',
        type: 'string',
        required: true,
        description: 'Agent ID to terminate',
      },
    ];
  }

  getFlagDefinitions() {
    return [
      {
        name: 'force',
        type: 'boolean',
        description: 'Force terminate without graceful shutdown',
        default: false,
      },
    ];
  }

  getExamples() {
    return [
      'swarm terminate agent-123',
      'swarm terminate coder-456 --force',
    ];
  }

  async validate(args: Record<string, any>): Promise<ValidationResult> {
    const errors: string[] = [];

    const agentId = args.agentId || args.arg0;
    if (!agentId) {
      errors.push('Agent ID is required');
    }

    return { valid: errors.length === 0, errors };
  }

  async execute(args: Record<string, any>, context: CommandContext): Promise<CommandStream> {
    const stream = new CommandStream(`terminate-${Date.now()}`);
    const agentId = args.agentId || args.arg0;
    const force = args.force === true;

    (async () => {
      try {
        stream.chunk(`Terminating agent ${agentId}${force ? ' (forced)' : ''}...`, 'log');
        stream.updateProgress(30);

        const reason = force ? 'Forced termination' : 'User requested';
        await this.agentSpace.terminateAgent(agentId, reason);

        stream.updateProgress(100);
        stream.chunk(`Agent ${agentId} terminated successfully`, 'log');

        stream.complete({
          agentId,
          terminated: true,
          reason,
        });
      } catch (error) {
        stream.fail(error as Error);
      }
    })();

    return stream;
  }
}

// ============================================================================
// Send Message
// ============================================================================

export class SendMessageHandler extends BaseSwarmHandler {
  action = 'send';
  description = 'Send message to an agent';

  getArgDefinitions() {
    return [
      {
        name: 'agentId',
        type: 'string',
        required: true,
        description: 'Target agent ID',
      },
      {
        name: 'message',
        type: 'string',
        required: true,
        description: 'Message content',
      },
    ];
  }

  getFlagDefinitions() {
    return [
      {
        name: 'priority',
        type: 'string',
        description: 'Message priority',
        default: 'medium',
      },
    ];
  }

  getExamples() {
    return [
      'swarm send agent-123 "process task"',
      'swarm send coder-456 "compile code" --priority high',
    ];
  }

  async validate(args: Record<string, any>): Promise<ValidationResult> {
    const errors: string[] = [];

    const agentId = args.agentId || args.arg0;
    const message = args.message || args.arg1;

    if (!agentId) {
      errors.push('Agent ID is required');
    }
    if (!message) {
      errors.push('Message is required');
    }

    return { valid: errors.length === 0, errors };
  }

  async execute(args: Record<string, any>, context: CommandContext): Promise<CommandStream> {
    const stream = new CommandStream(`send-${Date.now()}`);
    const agentId = args.agentId || args.arg0;
    const message = args.message || args.arg1;

    (async () => {
      try {
        stream.chunk(`Sending message to ${agentId}...`, 'log');
        stream.updateProgress(30);

        // Build A2A message
        const a2aMessage = {
          from: context.userId || 'cli',
          to: agentId,
          method: 'processTask',
          params: { task: message },
          priority: args.priority || 'medium',
        };

        // Send via A2A protocol
        const response = await this.a2aProtocol['sendMessage'](a2aMessage);

        stream.updateProgress(100);
        stream.chunk('Message sent successfully', 'log');

        stream.complete({
          messageId: response?.id,
          sent: true,
        });
      } catch (error) {
        stream.fail(error as Error);
      }
    })();

    return stream;
  }
}

/**
 * Create all swarm handlers
 */
export function createSwarmHandlers(
  agentSpace: AgentSpaceManager,
  a2aProtocol: A2AProtocolManager
): CommandHandler[] {
  return [
    new SpawnAgentHandler(agentSpace, a2aProtocol),
    new ListAgentsHandler(agentSpace, a2aProtocol),
    new AgentStatusHandler(agentSpace, a2aProtocol),
    new TerminateAgentHandler(agentSpace, a2aProtocol),
    new SendMessageHandler(agentSpace, a2aProtocol),
  ];
}
