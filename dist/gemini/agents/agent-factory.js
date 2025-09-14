import { Agent } from "./agent.js";
import { AGENT_DEFINITIONS } from "./agent-definitions.js";
export class AgentFactory {
    static createAgent(agentId) {
        const definition = AGENT_DEFINITIONS[agentId];
        if (!definition) {
            throw new Error(`Agent definition not found for ID: ${agentId}`);
        }
        return new Agent(definition);
    }
    static getAvailableAgentIds() {
        return Object.keys(AGENT_DEFINITIONS);
    }
    static getAgentDefinition(agentId) {
        return AGENT_DEFINITIONS[agentId];
    }
}
//# sourceMappingURL=agent-factory.js.map