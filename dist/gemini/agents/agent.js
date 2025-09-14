import { EventEmitter } from "events";
import { GeminiAdapter } from "../adapters/gemini-adapter.js";
import { Logger } from "../utils/logger.js";
export var AgentStatus;
(function (AgentStatus) {
    AgentStatus["IDLE"] = "idle";
    AgentStatus["BUSY"] = "busy";
    AgentStatus["ERROR"] = "error";
})(AgentStatus || (AgentStatus = {}));
export class Agent extends EventEmitter {
    id;
    name;
    type;
    category;
    capabilities;
    status;
    definition;
    geminiAdapter;
    logger;
    constructor(definition) {
        super();
        this.id = definition.id;
        this.name = definition.name;
        this.type = definition.type;
        this.category = definition.category;
        this.capabilities = definition.capabilities;
        this.status = AgentStatus.IDLE;
        this.definition = definition;
        this.geminiAdapter = new GeminiAdapter({});
        this.logger = new Logger(`Agent-${this.name}`);
    }
    async executeTask(task) {
        this.status = AgentStatus.BUSY;
        this.emit("statusChanged", this.status);
        this.logger.info(`Executing task: ${task}`);
        try {
            const result = await this.geminiAdapter.generate(this.definition, task);
            this.status = AgentStatus.IDLE;
            this.emit("statusChanged", this.status);
            this.logger.info(`Task completed successfully.`);
            return result;
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
//# sourceMappingURL=agent.js.map