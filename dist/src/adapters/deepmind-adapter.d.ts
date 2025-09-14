/**
 * DeepMind Adapter Implementation
 * TDD approach - proper implementation for DeepMind models
 */
import { BaseModelAdapter, ModelRequest, ModelResponse, StreamChunk, ModelCapabilities, AdapterConfig } from "./base-model-adapter.js";
export interface DeepMindAdapterConfig extends AdapterConfig {
    version?: string;
}
export declare class DeepMindAdapter extends BaseModelAdapter {
    constructor(config: DeepMindAdapterConfig);
    initialize(): Promise<void>;
    getModelCapabilities(): ModelCapabilities;
    generate(request: ModelRequest): Promise<ModelResponse>;
    generateStream(request: ModelRequest): AsyncIterableIterator<StreamChunk>;
    validateRequest(request: ModelRequest): Promise<boolean>;
    protected transformRequest(request: ModelRequest): any;
    protected transformResponse(response: any, _request: ModelRequest): ModelResponse;
    protected handleError(error: any, _request: ModelRequest): never;
}
//# sourceMappingURL=deepmind-adapter.d.ts.map