/// <reference types="node" resolution-mode="require"/>
export class SimpleInteractive {
    constructor(options?: {});
    auth: SimpleAuth;
    logger: Logger;
    rl: readline.Interface;
    history: any[];
    options: {
        model: any;
        temperature: any;
        maxTokens: any;
        sessionId: any;
        verbose: any;
    };
    /**
     * Setup event handlers
     */
    setupEventHandlers(): void;
    /**
     * Start interactive mode
     */
    start(): Promise<void>;
    /**
     * Show welcome message
     */
    showWelcomeMessage(): void;
    /**
     * Process user input
     */
    processUserInput(input: any): Promise<void>;
    /**
     * Handle slash commands
     */
    handleSlashCommand(command: any): Promise<void>;
    /**
     * Generate response using Gemini API
     */
    generateResponse(prompt: any): Promise<{
        text: string;
        usage: {
            promptTokens: number;
            completionTokens: number;
            totalTokens: number;
        };
        latency: number;
    }>;
    /**
     * Show help message
     */
    showHelp(): void;
    /**
     * Clear conversation history
     */
    clearHistory(): void;
    /**
     * Show conversation history
     */
    showHistory(): void;
    /**
     * Change model
     */
    changeModel(modelName: any): Promise<void>;
    /**
     * Change temperature
     */
    changeTemperature(tempStr: any): void;
    /**
     * Show session statistics
     */
    showStats(): void;
    /**
     * Save session
     */
    saveSession(sessionId: any): Promise<void>;
    /**
     * Load session
     */
    loadSession(sessionId: any): Promise<void>;
    /**
     * Estimate token count
     */
    estimateTokens(text: any): number;
}
import { SimpleAuth } from "../core/simple-auth.js";
import { Logger } from "../utils/logger.js";
import * as readline from "readline";
//# sourceMappingURL=simple-interactive.d.ts.map