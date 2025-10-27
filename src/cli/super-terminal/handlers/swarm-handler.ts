import { AgentSpaceManager } from '../../../agentspace/core/AgentSpaceManager.js';
import { AgentFactory } from '../../../agents/agent-factory.js';
import { PerformanceMonitor } from '../../../monitoring/performance-monitor.js';
import { CommandResult } from '../command-router.js';

export class SwarmHandler {
  constructor(
    private agentSpaceManager: AgentSpaceManager,
    private performanceMonitor: PerformanceMonitor
  ) {}

  async handle(subCommand: string | undefined, args: string[]): Promise<CommandResult> {
    switch (subCommand) {
      case 'list':
        return this.listAgents();

      case 'spawn':
        return this.spawnAgent(args[0]);

      case 'terminate':
        return this.terminateAgent(args[0]);

      default:
        return {
          output: `Unknown swarm command: ${subCommand}. Available: list, spawn, terminate`,
        };
    }
  }

  private async listAgents(): Promise<CommandResult> {
    try {
      const agents = await this.agentSpaceManager.listAgents();

      if (agents.length === 0) {
        return {
          output: 'No active agents.',
          metrics: { agentCount: 0, tasksActive: 0 },
        };
      }

      const agentList = agents
        .map((agent: any) => `  - ${agent.id} (${agent.type}) - Status: ${agent.status}`)
        .join('\n');

      return {
        output: `Active Agents (${agents.length}):\n${agentList}`,
        metrics: { agentCount: agents.length, tasksActive: 0 },
      };
    } catch (error: any) {
      return {
        output: `Error listing agents: ${error.message}`,
      };
    }
  }

  private async spawnAgent(agentType: string | undefined): Promise<CommandResult> {
    if (!agentType) {
      // Show available agent types
      const availableTypes = AgentFactory.getAvailableAgentIds();
      return {
        output: `Please specify agent type. Available types:\n  ${availableTypes.join(', ')}`,
      };
    }

    try {
      const startTime = Date.now();

      // Get agent definition
      const definition = AgentFactory.getAgentDefinition(agentType);
      if (!definition) {
        return {
          output: `Unknown agent type: ${agentType}. Use "swarm spawn" to see available types.`,
        };
      }

      // Create agent config for AgentSpaceManager
      const agentConfig = {
        id: `${agentType}-${Date.now()}`,
        type: agentType,
        capabilities: definition.capabilities || [],
        resources: {},
        communication: {},
      };

      // Spawn agent using real AgentSpaceManager
      const result = await this.agentSpaceManager.spawnAgent(agentConfig);

      if (result.success) {
        const spawnTime = Date.now() - startTime;
        this.performanceMonitor.recordMetric('agent.spawn.time', spawnTime, { agentType });

        const agents = await this.agentSpaceManager.listAgents();
        this.performanceMonitor.recordMetric('agent.count', agents.length);

        return {
          output: `Successfully spawned ${agentType} agent: ${result.data.id} (${spawnTime}ms)`,
          metrics: { agentCount: agents.length, tasksActive: 0 },
        };
      } else {
        return {
          output: `Failed to spawn agent: ${result.error?.message || 'Unknown error'}`,
        };
      }
    } catch (error: any) {
      return {
        output: `Error spawning agent: ${error.message}`,
      };
    }
  }

  private async terminateAgent(agentId: string | undefined): Promise<CommandResult> {
    if (!agentId) {
      return {
        output: 'Please specify agent ID. Use "swarm list" to see active agents.',
      };
    }

    try {
      const result = await this.agentSpaceManager.terminateAgent(agentId, 'User requested termination');

      if (result.success) {
        const agents = await this.agentSpaceManager.listAgents();
        return {
          output: `Successfully terminated agent: ${agentId}`,
          metrics: { agentCount: agents.length, tasksActive: 0 },
        };
      } else {
        return {
          output: `Failed to terminate agent: ${result.error?.message || 'Unknown error'}`,
        };
      }
    } catch (error: any) {
      return {
        output: `Error terminating agent: ${error.message}`,
      };
    }
  }
}
