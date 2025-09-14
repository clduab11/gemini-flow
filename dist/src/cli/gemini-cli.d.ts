/**
 * Gemini CLI
 *
 * Simplified command structure matching official Gemini CLI
 * Primary commands: chat, generate, list-models, auth
 */
import { Command } from "commander";
export interface GeminiCLIOptions {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    verbose?: boolean;
    json?: boolean;
    system?: string;
    file?: string;
    key?: string;
    test?: boolean;
    help?: boolean;
}
export interface GenerateResponse {
    text: string;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    model?: string;
    latency?: number;
}
export interface ModelInfo {
    name: string;
    description: string;
    maxTokens?: number;
    supportedFeatures?: string[];
}
export declare class GeminiCLI {
    private program;
    private auth;
    private logger;
    private readonly availableModels;
    constructor();
    /**
     * Setup main program configuration
     */
    private setupProgram;
    /**
     * Setup CLI commands
     */
    private setupCommands;
    /**
     * Setup chat command (interactive mode)
     */
    private setupChatCommand;
    /**
     * Setup generate command (one-shot generation)
     */
    private setupGenerateCommand;
    /**
     * Setup list-models command
     */
    private setupListModelsCommand;
    /**
     * Setup auth command
     */
    private setupAuthCommand;
    /**
     * Execute chat command
     */
    private executeChatCommand;
    /**
     * Execute generate command
     */
    private executeGenerateCommand;
    /**
     * Execute auth command
     */
    private executeAuthCommand;
    /**
     * Generate content using Gemini API
     */
    generateContent(prompt: string, options?: GeminiCLIOptions): Promise<GenerateResponse>;
    /**
     * List available models
     */
    listModels(): Promise<ModelInfo[]>;
    /**
     * Format output for display
     */
    formatOutput(text: string, response: GenerateResponse, options?: GeminiCLIOptions): string;
    /**
     * Format models list for display
     */
    private formatModelsList;
    /**
     * Estimate token count (approximation)
     */
    private estimateTokens;
    /**
     * Parse command line options
     */
    parseOptions(args: string[]): GeminiCLIOptions;
    /**
     * Execute command programmatically
     */
    executeCommand(command: string, args: string[], options?: GeminiCLIOptions): Promise<string>;
    /**
     * Handle errors
     */
    private handleError;
    /**
     * Get the commander program instance
     */
    getProgram(): Command;
    /**
     * Parse and execute CLI
     */
    run(): Promise<void>;
}
//# sourceMappingURL=gemini-cli.d.ts.map