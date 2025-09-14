
import { Agent } from "./agent.js";
import { AGENT_DEFINITIONS, AgentDefinition } from "./agent-definitions.js";
import { BaseModelAdapter } from "../adapters/base-model-adapter.js";

export class AgentFactory {
  public static createAgent(agentId: string, adapter: BaseModelAdapter): Agent {
    const definition = AGENT_DEFINITIONS[agentId];

    if (!definition) {
      throw new Error(`Agent definition not found for ID: ${agentId}`);
    }

    return new Agent(definition, adapter);
  }

  public static getAvailableAgentIds(): string[] {
    return Object.keys(AGENT_DEFINITIONS);
  }

  public static getAgentDefinition(agentId: string): AgentDefinition | undefined {
    return AGENT_DEFINITIONS[agentId];
  }
}
