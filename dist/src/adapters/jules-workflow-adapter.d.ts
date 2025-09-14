/**
 * Jules Workflow Adapter Implementation
 * TDD approach - proper implementation for Jules workflow models
 */
import { BaseModelAdapter, ModelRequest, ModelResponse, StreamChunk, ModelCapabilities, AdapterConfig } from "./base-model-adapter.js";
export interface JulesWorkflowConfig extends AdapterConfig {
    workflowId?: string;
    parameters?: Record<string, any>;
    collaborativeMode?: boolean;
    julesApiKey?: string;
    multiStepEnabled?: boolean;
}
export declare class JulesWorkflowAdapter extends BaseModelAdapter {
    private workflowConfig;
    constructor(config: JulesWorkflowConfig);
    initialize(): Promise<void>;
    getModelCapabilities(): ModelCapabilities;
    generate(request: ModelRequest): Promise<ModelResponse>;
    generateStream(request: ModelRequest): AsyncIterableIterator<StreamChunk>;
    validateRequest(request: ModelRequest): Promise<boolean>;
    protected transformRequest(request: ModelRequest): any;
    protected transformResponse(response: any, _request: ModelRequest): ModelResponse;
    protected handleError(error: any, _request: ModelRequest): never;
}
//# sourceMappingURL=jules-workflow-adapter.d.ts.map