export class GeminiCLI {
    program: Command;
    auth: SimpleAuth;
    logger: Logger;
    availableModels: {
        name: string;
        description: string;
        maxTokens: number;
        supportedFeatures: string[];
    }[];
    /**
     * Setup main program configuration
     */
    setupProgram(): void;
    /**
     * Setup CLI commands
     */
    setupCommands(): void;
    /**
     * Setup chat command (interactive mode)
     */
    setupChatCommand(): void;
    /**
     * Setup generate command (one-shot generation)
     */
    setupGenerateCommand(): void;
    /**
     * Setup list-models command
     */
    setupListModelsCommand(): void;
    /**
     * Setup auth command
     */
    setupAuthCommand(): void;
    /**
     * Execute chat command
     */
    executeChatCommand(prompt: any, options?: {}): Promise<void>;
    /**
     * Execute generate command
     */
    executeGenerateCommand(prompt: any, options?: {}): Promise<{
        text: string;
        usage: {
            promptTokens: number;
            completionTokens: number;
            totalTokens: number;
        };
        model: any;
        latency: number;
    }>;
    /**
     * Execute auth command
     */
    executeAuthCommand(options: any): Promise<string | undefined>;
    /**
     * Generate content using Gemini API
     */
    generateContent(prompt: any, options?: {}): Promise<{
        text: string;
        usage: {
            promptTokens: number;
            completionTokens: number;
            totalTokens: number;
        };
        model: any;
        latency: number;
    }>;
    /**
     * List available models
     */
    listModels(): Promise<{
        name: string;
        description: string;
        maxTokens: number;
        supportedFeatures: string[];
    }[]>;
    /**
     * Format output for display
     */
    formatOutput(text: any, response: any, options?: {}): any;
    /**
     * Format models list for display
     */
    formatModelsList(models: any, options?: {}): string;
    /**
     * Estimate token count (approximation)
     */
    estimateTokens(text: any): number;
    /**
     * Parse command line options
     */
    parseOptions(args: any): {
        model: any;
        temperature: number;
        maxTokens: number;
        verbose: boolean;
        json: boolean;
        system: any;
        file: any;
    };
    /**
     * Execute command programmatically
     */
    executeCommand(command: any, args: any, options?: {}): Promise<any>;
    /**
     * Handle errors
     */
    handleError(error: any, options?: {}): void;
    /**
     * Get the commander program instance
     */
    getProgram(): Command;
    /**
     * Parse and execute CLI
     */
    run(): Promise<void>;
}
import { Command } from "commander";
import { SimpleAuth } from "../core/simple-auth.js";
import { Logger } from "../utils/logger.js";
//# sourceMappingURL=gemini-cli.d.ts.map