import { ModelOrchestrator } from './model-orchestrator';
/**
 * @interface AgentEnhancementConfig
 * @description Configuration for Vertex AI-powered Agent Enhancement.
 */
export interface AgentEnhancementConfig {
    defaultReasoningModel: string;
}
/**
 * @interface AgentEnhancementOperations
 * @description Defines the operations available for Vertex AI-powered Agent Enhancement.
 */
export interface AgentEnhancementOperations {
    reason(agentContext: any, prompt: string): Promise<any>;
    selectSpecializedModel(taskContext: any, availableModels: string[]): Promise<string>;
    optimizePrompt(initialPrompt: string, feedback: any): Promise<string>;
    adaptModelBehavior(modelId: string, performanceData: any): Promise<void>;
}
/**
 * @class AgentEnhancement
 * @description Provides Vertex AI-powered reasoning, decision making, and model optimization for agents.
 */
export declare class AgentEnhancement implements AgentEnhancementOperations {
    private config;
    private logger;
    private modelOrchestrator;
    constructor(config: AgentEnhancementConfig, modelOrchestrator: ModelOrchestrator);
    /**
     * Provides Vertex AI-powered reasoning and decision making for an agent.
     * @param {any} agentContext The current context of the agent.
     * @param {string} prompt The prompt or question for the AI model.
     * @returns {Promise<any>} The AI-generated reasoning or decision.
     */
    reason(agentContext: any, prompt: string): Promise<any>;
    /**
     * Selects a specialized model based on task context and available models.
     * @param {any} taskContext The context of the specialized task.
     * @param {string[]} availableModels A list of available specialized model IDs.
     * @returns {Promise<string>} The ID of the selected specialized model.
     */
    selectSpecializedModel(taskContext: any, availableModels: string[]): Promise<string>;
    /**
     * Optimizes a prompt based on feedback or desired outcomes.
     * @param {string} initialPrompt The initial prompt.
     * @param {any} feedback Feedback on the prompt's performance or desired changes.
     * @returns {Promise<string>} The optimized prompt.
     */
    optimizePrompt(initialPrompt: string, feedback: any): Promise<string>;
    /**
     * Adapts model behavior in real-time based on performance data (conceptual).
     * @param {string} modelId The ID of the model to adapt.
     * @param {any} performanceData Real-time performance metrics.
     * @returns {Promise<void>}
     */
    adaptModelBehavior(modelId: string, performanceData: any): Promise<void>;
}
//# sourceMappingURL=agent-enhancement.d.ts.map