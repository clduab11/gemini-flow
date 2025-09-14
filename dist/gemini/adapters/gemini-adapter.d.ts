import { AgentDefinition } from "../agents/agent-definitions.js";
export interface GeminiAdapterConfig {
    apiKey?: string;
    modelName?: string;
    projectId?: string;
    location?: string;
    generationConfig?: any;
}
export declare class GeminiAdapter {
    private genAI;
    private model;
    private config;
    constructor(config?: GeminiAdapterConfig);
    private extractText;
    generate(definition: AgentDefinition, task: string): Promise<string>;
    generateStream(definition: AgentDefinition, task: string): AsyncIterableIterator<string>;
}
//# sourceMappingURL=gemini-adapter.d.ts.map