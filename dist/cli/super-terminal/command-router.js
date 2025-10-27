import { AgentSpaceManager } from '../../agentspace/core/AgentSpaceManager.js';
import { SwarmHandler } from './handlers/swarm-handler.js';
import { GoogleAIHandler } from './handlers/google-ai-handler.js';
export class CommandRouter {
    constructor() {
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
        this.swarmHandler = new SwarmHandler(this.agentSpaceManager);
        this.googleAIHandler = new GoogleAIHandler();
    }
    async route(command) {
        const parts = command.trim().split(/\s+/);
        const mainCommand = parts[0]?.toLowerCase();
        const subCommand = parts[1]?.toLowerCase();
        const args = parts.slice(2);
        switch (mainCommand) {
            case 'help':
                return this.handleHelp();
            case 'swarm':
                return this.swarmHandler.handle(subCommand, args);
            case 'google':
            case 'ai':
                return this.googleAIHandler.handle(subCommand, args);
            case 'status':
                return this.handleStatus();
            default:
                return {
                    output: `Unknown command: ${mainCommand}. Type "help" for available commands.`,
                };
        }
    }
    handleHelp() {
        const help = `
Available Commands:
  help                  - Show this help message
  status                - Show system status
  swarm list            - List active agents
  swarm spawn <type>    - Spawn a new agent (e.g., swarm spawn coder)
  swarm terminate <id>  - Terminate an agent
  google status         - Show Google AI services status
  exit                  - Exit the terminal
`;
        return { output: help };
    }
    async handleStatus() {
        const agents = await this.agentSpaceManager.listAgents();
        const agentCount = agents.length;
        return {
            output: `System Status:\n  Active Agents: ${agentCount}\n  Agent Space: super-terminal-space`,
            metrics: {
                agentCount,
                tasksActive: 0,
            },
        };
    }
}
