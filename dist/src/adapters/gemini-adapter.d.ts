import { BaseModelAdapter, ModelRequest, ModelResponse, StreamChunk, AdapterError, ModelCapabilities, AdapterConfig } from "./base-model-adapter.js";
export interface GeminiAdapterConfig extends AdapterConfig {
    generationConfig?: any;
}
export declare class GeminiAdapter extends BaseModelAdapter {
    private genAI;
    private model;
    constructor(config: GeminiAdapterConfig);
    initialize(): Promise<void>;
    getModelCapabilities(): ModelCapabilities;
    private extractText;
    generate(request: ModelRequest): Promise<ModelResponse>;
    generateStream(request: ModelRequest): AsyncIterableIterator<StreamChunk>;
    validateRequest(request: ModelRequest): Promise<boolean>;
    protected transformRequest(request: ModelRequest): any;
    protected transformResponse(response: any, request: ModelRequest): ModelResponse;
    protected handleError(error: any, request: ModelRequest): AdapterError;
}
//# sourceMappingURL=gemini-adapter.d.ts.map