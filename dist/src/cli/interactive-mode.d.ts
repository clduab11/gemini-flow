/**
 * Interactive Conversation Mode
 *
 * Primary interface for Gemini CLI parity providing conversational
 * interaction with context management and 1M+ token support
 */
import { GoogleAIAuth } from "../core/google-ai-auth.js";
import { ContextWindowManager } from "../core/context-window-manager.js";
export interface InteractiveModeOptions {
    auth: GoogleAIAuth;
    contextManager: ContextWindowManager;
    model?: string;
    maxTokens?: number;
    temperature?: number;
    sessionId?: string;
}
export interface ConversationMessage {
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    tokens?: number;
}
export interface ApiResponse {
    text: string;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}
export declare class InteractiveMode {
    private auth;
    private contextManager;
    private running;
    private logger;
    private model;
    private maxTokens;
    private temperature;
    private sessionId;
    constructor(options: InteractiveModeOptions);
    /**
     * Start interactive conversation session
     */
    start(): Promise<void>;
    /**
     * Process user message and return response
     */
    processMessage(message: string): Promise<string>;
    /**
     * Handle special commands
     */
    private handleCommand;
    /**
     * Ensure context window has enough space
     */
    private ensureContextWindow;
    /**
     * Call Gemini API with current context
     */
    private callGeminiAPI;
    /**
     * Estimate token count for text (approximation)
     */
    private estimateTokens;
    /**
     * Display welcome message
     */
    private displayWelcome;
    /**
     * Get help message
     */
    private getHelpMessage;
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
    private cleanup;
}
//# sourceMappingURL=interactive-mode.d.ts.map