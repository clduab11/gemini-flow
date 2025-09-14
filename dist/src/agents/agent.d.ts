/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { AgentDefinition } from "./agent-definitions.js";
import { BaseModelAdapter } from "../adapters/base-model-adapter.js";
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
    private adapter;
    private logger;
    constructor(definition: AgentDefinition, adapter: BaseModelAdapter);
    executeTask(task: string): Promise<string>;
    getDefinition(): AgentDefinition;
}
//# sourceMappingURL=agent.d.ts.map