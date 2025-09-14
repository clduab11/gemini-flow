import { Agent } from "./agent.js";
import { AgentDefinition } from "./agent-definitions.js";
import { BaseModelAdapter } from "../adapters/base-model-adapter.js";
export declare class AgentFactory {
    static createAgent(agentId: string, adapter: BaseModelAdapter): Agent;
    static getAvailableAgentIds(): string[];
    static getAgentDefinition(agentId: string): AgentDefinition | undefined;
}
//# sourceMappingURL=agent-factory.d.ts.map