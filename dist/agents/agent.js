import { EventEmitter } from "events";
import { Logger } from "../utils/logger.js";
export var AgentStatus;
(function (AgentStatus) {
    AgentStatus["IDLE"] = "idle";
    AgentStatus["BUSY"] = "busy";
    AgentStatus["ERROR"] = "error";
})(AgentStatus || (AgentStatus = {}));
export class Agent extends EventEmitter {
    constructor(definition, adapter) {
        super();
        this.id = definition.id;
        this.name = definition.name;
        this.type = definition.type;
        this.category = definition.category;
        this.capabilities = definition.capabilities;
        this.status = AgentStatus.IDLE;
        this.definition = definition;
        this.adapter = adapter;
        this.logger = new Logger(`Agent-${this.name}`);
    }
    async executeTask(task) {
        this.status = AgentStatus.BUSY;
        this.emit("statusChanged", this.status);
        this.logger.info(`Executing task: ${task}`);
        try {
            const request = {
                prompt: task,
                context: {
                    priority: 'medium',
                    userTier: 'free',
                    latencyTarget: 10000,
                },
                systemMessage: this.definition.systemPrompt,
            };
            const result = await this.adapter.generate(request);
            this.status = AgentStatus.IDLE;
            this.emit("statusChanged", this.status);
            this.logger.info(`Task completed successfully.`);
            return result.content;
        }
        catch (error) {
            this.status = AgentStatus.ERROR;
            this.emit("statusChanged", this.status);
            this.logger.error(`Error executing task:`, error);
            throw error;
        }
    }
    getDefinition() {
        return this.definition;
    }
}
