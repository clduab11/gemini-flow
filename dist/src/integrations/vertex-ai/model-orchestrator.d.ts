/**
 * @interface ModelOrchestratorConfig
 * @description Configuration for the Vertex AI Model Orchestrator.
 */
export interface ModelOrchestratorConfig {
    defaultModel: string;
    availableModels: {
        id: string;
        capabilities: string[];
        costPerToken: number;
        latencyMs: number;
    }[];
}
/**
 * @interface ModelOrchestratorOperations
 * @description Defines the operations available for the Vertex AI Model Orchestrator.
 */
export interface ModelOrchestratorOperations {
    selectModel(taskRequirements: string[], complexity: 'low' | 'medium' | 'high'): Promise<string>;
    invokeModel(modelId: string, prompt: any, options?: any): Promise<any>;
    optimizeCost(modelId: string, usage: number): Promise<void>;
    monitorPerformance(modelId: string, metrics: any): Promise<void>;
}
/**
 * @class ModelOrchestrator
 * @description Manages dynamic model selection, invocation, and optimization for Vertex AI.
 */
export declare class ModelOrchestrator implements ModelOrchestratorOperations {
    private config;
    private logger;
    constructor(config: ModelOrchestratorConfig);
    /**
     * Selects the most appropriate model based on task requirements and complexity.
     * @param {string[]} taskRequirements Capabilities or features required by the task.
     * @param {'low' | 'medium' | 'high'} complexity The complexity of the task.
     * @returns {Promise<string>} The ID of the selected model.
     */
    selectModel(taskRequirements: string[], complexity: 'low' | 'medium' | 'high'): Promise<string>;
    /**
     * Invokes a specified Vertex AI model with the given prompt and options.
     * @param {string} modelId The ID of the model to invoke.
     * @param {any} prompt The input prompt for the model.
     * @param {any} [options] Optional parameters for the model invocation.
     * @returns {Promise<any>} The model's response.
     */
    invokeModel(modelId: string, prompt: any, options?: any): Promise<any>;
    /**
     * Optimizes cost by intelligent model routing and caching (conceptual).
     * @param {string} modelId The ID of the model.
     * @param {number} usage The usage amount (e.g., tokens).
     * @returns {Promise<void>}
     */
    optimizeCost(modelId: string, usage: number): Promise<void>;
    /**
     * Monitors model performance and supports A/B testing (conceptual).
     * @param {string} modelId The ID of the model.
     * @param {any} metrics Performance metrics collected.
     * @returns {Promise<void>}
     */
    monitorPerformance(modelId: string, metrics: any): Promise<void>;
}
//# sourceMappingURL=model-orchestrator.d.ts.map