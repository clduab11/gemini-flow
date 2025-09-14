import { Agent } from "./agent.js";
import { AgentDefinition } from "./agent-definitions.js";
export declare class AgentFactory {
    static createAgent(agentId: string): Agent;
    static getAvailableAgentIds(): string[];
    static getAgentDefinition(agentId: string): AgentDefinition | undefined;
}
//# sourceMappingURL=agent-factory.d.ts.map