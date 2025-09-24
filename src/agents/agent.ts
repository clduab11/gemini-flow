
import { EventEmitter } from "node:events";
import { AgentDefinition } from "./agent-definitions.js";
import { BaseModelAdapter, ModelRequest } from "../adapters/base-model-adapter.js";
import { Logger } from "../utils/logger.js";

export enum AgentStatus {
  IDLE = "idle",
  BUSY = "busy",
  ERROR = "error",
}

export class Agent extends EventEmitter {
  public id: string;
  public name: string;
  public type: string;
  public category: string;
  public capabilities: string[];
  public status: AgentStatus;

  private definition: AgentDefinition;
  private adapter: BaseModelAdapter;
  private logger: Logger;

  constructor(definition: AgentDefinition, adapter: BaseModelAdapter) {
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

  public async executeTask(task: string): Promise<string> {
    this.status = AgentStatus.BUSY;
    this.emit("statusChanged", this.status);
    this.logger.info(`Executing task: ${task}`);

    try {
      const request: ModelRequest = {
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
    } catch (error: any) {
      this.status = AgentStatus.ERROR;
      this.emit("statusChanged", this.status);
      this.logger.error(`Error executing task:`, error);
      throw error;
    }
  }

  public getDefinition(): AgentDefinition {
    return this.definition;
  }
}
