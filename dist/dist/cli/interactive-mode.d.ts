export class InteractiveMode {
    constructor(options: any);
    auth: any;
    contextManager: any;
    running: boolean;
    logger: Logger;
    model: any;
    maxTokens: any;
    temperature: any;
    sessionId: any;
    /**
     * Start interactive conversation session
     */
    start(): Promise<void>;
    /**
     * Process user message and return response
     */
    processMessage(message: any): Promise<string>;
    /**
     * Handle special commands
     */
    handleCommand(command: any): Promise<string>;
    /**
     * Ensure context window has enough space
     */
    ensureContextWindow(message: any): Promise<void>;
    /**
     * Call Gemini API with current context
     */
    callGeminiAPI(context: any): Promise<{
        text: string;
        usage: {
            promptTokens: number;
            completionTokens: number;
            totalTokens: number;
        };
    }>;
    /**
     * Estimate token count for text (approximation)
     */
    estimateTokens(text: any): number;
    /**
     * Display welcome message
     */
    displayWelcome(): void;
    /**
     * Get help message
     */
    getHelpMessage(): string;
    /**
     * Stop interactive session
     */
    stop(): void;
    /**
     * Check if session is running
     */
    isRunning(): boolean;
    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;
}
import { Logger } from "../utils/logger.js";
//# sourceMappingURL=interactive-mode.d.ts.map