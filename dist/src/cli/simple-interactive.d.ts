/**
 * Simplified Interactive Mode
 *
 * Clean, simple interactive conversation interface
 */
export interface InteractiveOptions {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    sessionId?: string;
    verbose?: boolean;
}
export interface ConversationHistory {
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
}
export declare class SimpleInteractive {
    private auth;
    private logger;
    private rl;
    private history;
    private options;
    constructor(options?: InteractiveOptions);
    /**
     * Setup event handlers
     */
    private setupEventHandlers;
    /**
     * Start interactive mode
     */
    start(): Promise<void>;
    /**
     * Show welcome message
     */
    private showWelcomeMessage;
    /**
     * Process user input
     */
    private processUserInput;
    /**
     * Handle slash commands
     */
    private handleSlashCommand;
    /**
     * Generate response using Gemini API
     */
    private generateResponse;
    /**
     * Show help message
     */
    private showHelp;
    /**
     * Clear conversation history
     */
    private clearHistory;
    /**
     * Show conversation history
     */
    private showHistory;
    /**
     * Change model
     */
    private changeModel;
    /**
     * Change temperature
     */
    private changeTemperature;
    /**
     * Show session statistics
     */
    private showStats;
    /**
     * Save session
     */
    private saveSession;
    /**
     * Load session
     */
    private loadSession;
    /**
     * Estimate token count
     */
    private estimateTokens;
}
//# sourceMappingURL=simple-interactive.d.ts.map