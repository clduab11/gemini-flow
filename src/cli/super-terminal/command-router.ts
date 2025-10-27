import { AgentFactory } from '../../agents/agent-factory.js';
import { AgentSpaceManager } from '../../agentspace/core/AgentSpaceManager.js';
import { PerformanceMonitor } from '../../monitoring/performance-monitor.js';
import { SwarmHandler } from './handlers/swarm-handler.js';
import { GoogleAIHandler } from './handlers/google-ai-handler.js';
import { EventEmitter } from 'node:events';
import { getLogger } from './utils/Logger.js';
import { getConfig } from './utils/Config.js';
import { InputValidator, RateLimiter, TimeoutProtection } from './utils/SecurityUtils.js';
import { RetryStrategy } from './utils/RetryUtils.js';

export interface CommandResult {
  output: string;
  metrics?: {
    agentCount: number;
    tasksActive: number;
    performance?: any;
    a2aMetrics?: {
      messagesProcessed: number;
      avgResponseTime: number;
      throughput: number;
    };
    agentHealth?: {
      active: number;
      idle: number;
      error: number;
      stale: number;
    };
    memoryUsage?: {
      total: number;
      perAgent: number;
    };
  };
  streamingOutput?: string[];
}

export class CommandRouter {
  private agentSpaceManager: AgentSpaceManager;
  private performanceMonitor: PerformanceMonitor;
  private swarmHandler: SwarmHandler;
  private googleAIHandler: GoogleAIHandler;
  private logger = getLogger();
  private rateLimiter = RateLimiter.getInstance('command-router');
  private config = getConfig();

  constructor() {
    try {
      // Initialize PerformanceMonitor
      this.performanceMonitor = new PerformanceMonitor();

      // Initialize AgentSpaceManager
      this.agentSpaceManager = new AgentSpaceManager({
        agentSpaceId: 'super-terminal-space',
        configuration: {},
        virtualizationConfig: {},
        spatialConfig: {},
        memoryConfig: {},
        consensusConfig: {},
        mcpIntegration: {},
      });

      // Initialize AgentSpaceManager
      this.agentSpaceManager.initialize();

      // Initialize handlers
      this.swarmHandler = new SwarmHandler(this.agentSpaceManager, this.performanceMonitor);
      this.googleAIHandler = new GoogleAIHandler();

      this.logger.info('CommandRouter initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize CommandRouter', error as Error);
      throw new Error('Failed to initialize command router. Please check logs for details.');
    }
  }

  async route(command: string): Promise<CommandResult> {
    const startTime = Date.now();

    try {
      // Validate input
      const validation = InputValidator.validateCommand(command);
      if (!validation.valid) {
        await this.logger.warn('Command validation failed', { command, error: validation.error });
        return {
          output: `Error: ${validation.error}`,
        };
      }

      const sanitizedCommand = validation.sanitized || command;

      // Check rate limit
      const rateLimitCheck = await this.rateLimiter.checkLimit();
      if (!rateLimitCheck.allowed) {
        await this.logger.warn('Rate limit exceeded', {
          command: sanitizedCommand,
          retryAfterMs: rateLimitCheck.retryAfterMs,
        });
        return {
          output: `Error: Rate limit exceeded. Please wait ${Math.ceil((rateLimitCheck.retryAfterMs || 0) / 1000)}s before trying again.`,
        };
      }

      // Log command execution
      await this.logger.info('Executing command', { command: sanitizedCommand });

      // Parse command
      const parts = sanitizedCommand.trim().split(/\s+/);
      const mainCommand = parts[0]?.toLowerCase();
      const subCommand = parts[1]?.toLowerCase();
      const args = parts.slice(2);

      // Execute command with timeout protection
      let result: CommandResult;

      try {
        result = await TimeoutProtection.execute(
          async () => {
            switch (mainCommand) {
              case 'help':
                return this.handleHelp();

              case 'config':
                return this.handleConfig(subCommand, args);

              case 'swarm':
                return this.swarmHandler.handle(subCommand, args);

              case 'google':
              case 'ai': {
                // Collect streaming output from GoogleAIHandler
                const streamingOutput: string[] = [];
                const progressListener = (message: string) => {
                  streamingOutput.push(message);
                };

                this.googleAIHandler.on('progress', progressListener);
                const handlerResult = await this.googleAIHandler.handle(subCommand, args);
                this.googleAIHandler.off('progress', progressListener);

                return {
                  ...handlerResult,
                  streamingOutput: streamingOutput.length > 0 ? streamingOutput : undefined,
                };
              }

              case 'status':
                return this.handleStatus();

              default:
                return {
                  output: `Unknown command: ${mainCommand}. Type "help" for available commands.`,
                };
            }
          },
          undefined,
          `command: ${mainCommand}`
        );
      } catch (timeoutError) {
        await this.logger.error('Command execution timed out', timeoutError as Error, {
          command: sanitizedCommand,
        });
        return {
          output: `Error: Command execution timed out. The operation took too long to complete.`,
        };
      }

      // Log successful execution
      const executionTime = Date.now() - startTime;
      await this.logger.info('Command executed successfully', {
        command: sanitizedCommand,
        executionTimeMs: executionTime,
      });

      return result;
    } catch (error) {
      // Log error
      const executionTime = Date.now() - startTime;
      await this.logger.error('Command execution failed', error as Error, {
        command,
        executionTimeMs: executionTime,
      });

      // Return user-friendly error message
      return {
        output: `Error: ${(error as Error).message || 'An unexpected error occurred. Please check logs for details.'}`,
      };
    }
  }

  private handleHelp(): CommandResult {
    const help = `
Available Commands:

  System:
    help                       - Show this help message
    status                     - Show system status
    config show                - Show current configuration
    config set <key> <value>   - Set configuration value
    config reset               - Reset to default configuration
    exit                       - Exit the terminal

  Agent Management (Swarm):
    swarm list                 - List active agents
    swarm spawn <type>         - Spawn a new agent
    swarm terminate <id>       - Terminate an agent
    swarm status <id>          - Show agent status
    swarm broadcast <msg>      - Broadcast to all agents
    swarm topology             - Show agent topology

  Google AI Services:
    google status              - Show service availability
    google help                - Show detailed Google AI commands
    google veo3 generate [...]  - Generate video
    google imagen4 create [...] - Create image
    google chirp tts [...]      - Text-to-speech
    google lyria compose [...]  - Compose music
    google research [...]       - Research query

Type "google help" for full Google AI documentation.

Configuration:
  Debug Mode: Use --debug flag or set SUPER_TERMINAL_DEBUG=true
  Safe Mode:  Use --safe-mode flag or set SUPER_TERMINAL_SAFE_MODE=true
`;
    return { output: help };
  }

  private async handleConfig(subCommand: string, args: string[]): Promise<CommandResult> {
    try {
      switch (subCommand) {
        case 'show': {
          const summary = this.config.getSummary();
          return { output: summary };
        }

        case 'set': {
          if (args.length < 2) {
            return { output: 'Error: config set requires <key> <value>' };
          }
          const key = args[0];
          const value = args.slice(1).join(' ');

          try {
            await this.config.setNested(key, JSON.parse(value));
            await this.logger.info('Configuration updated', { key, value });
            return { output: `Configuration updated: ${key} = ${value}` };
          } catch (error) {
            return { output: `Error: Failed to set configuration - ${(error as Error).message}` };
          }
        }

        case 'reset': {
          await this.config.reset();
          await this.logger.info('Configuration reset to defaults');
          return { output: 'Configuration reset to defaults' };
        }

        default:
          return { output: 'Unknown config command. Use: show, set <key> <value>, or reset' };
      }
    } catch (error) {
      await this.logger.error('Config command failed', error as Error);
      return { output: `Error: ${(error as Error).message}` };
    }
  }

  private async handleStatus(): Promise<CommandResult> {
    try {
      const agents = await RetryStrategy.executeWithFallback(
        () => this.agentSpaceManager.listAgents(),
        [],
        'listAgents'
      );

      const agentCount = agents.length;
      const performanceMetrics = this.performanceMonitor.getAllMetrics();

      // Get A2A metrics from SwarmHandler with error handling
      let a2aMetrics = null;
      try {
        const a2aManager = this.swarmHandler.getA2AManager();
        a2aMetrics = a2aManager?.getMetrics?.() || null;
      } catch (error) {
        await this.logger.warn('Failed to get A2A metrics', { error: (error as Error).message });
      }

      // Calculate agent health (simulated for now)
      const agentHealth = {
        active: agentCount,
        idle: 0,
        error: 0,
        stale: 0,
      };

      // Calculate memory usage (simulated)
      const baseMemory = 128; // Base memory in MB
      const perAgentMemory = 32; // MB per agent
      const totalMemory = baseMemory + (agentCount * perAgentMemory);

      return {
        output: `System Status:\n  Active Agents: ${agentCount}\n  Agent Space: super-terminal-space`,
        metrics: {
          agentCount,
          tasksActive: 0,
          performance: performanceMetrics,
          a2aMetrics: a2aMetrics ? {
            messagesProcessed: a2aMetrics.messagesProcessed || 0,
            avgResponseTime: a2aMetrics.avgResponseTime || 0,
            throughput: a2aMetrics.throughput || 0,
          } : undefined,
          agentHealth,
          memoryUsage: {
            total: totalMemory,
            perAgent: agentCount > 0 ? perAgentMemory : 0,
          },
        },
      };
    } catch (error) {
      await this.logger.error('Failed to get status', error as Error);
      return {
        output: 'Error: Failed to retrieve system status. Please check logs for details.',
      };
    }
  }

  getPerformanceMonitor(): PerformanceMonitor {
    return this.performanceMonitor;
  }

  getSwarmHandler(): SwarmHandler {
    return this.swarmHandler;
  }
}
