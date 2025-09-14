/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { AgentDefinition } from "./agent-definitions.js";
export declare enum AgentStatus {
    IDLE = "idle",
    BUSY = "busy",
    ERROR = "error"
}
export declare class Agent extends EventEmitter {
    id: string;
    name: string;
    type: string;
    category: string;
    capabilities: string[];
    status: AgentStatus;
    private definition;
    private geminiAdapter;
    private logger;
    constructor(definition: AgentDefinition);
    executeTask(task: string): Promise<string>;
    getDefinition(): AgentDefinition;
}
//# sourceMappingURL=agent.d.ts.map