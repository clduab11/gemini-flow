/**
 * Context Window Manager
 *
 * Advanced context window management for 1M+ tokens
 * with smart truncation, session persistence, and conversation analysis
 */
export interface ContextWindowOptions {
    maxTokens?: number;
    sessionPath?: string;
    truncationStrategy?: "sliding" | "importance" | "hybrid";
    compressionEnabled?: boolean;
}
export interface ConversationMessage {
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    tokens: number;
    metadata?: {
        importance?: number;
        topic?: string[];
        messageId?: string;
    };
}
export interface ContextAnalysis {
    messageCount: number;
    userMessages: number;
    assistantMessages: number;
    averageMessageLength: number;
    totalTokens: number;
    conversationTopics: string[];
    tokenDistribution: {
        user: number;
        assistant: number;
    };
}
export interface TruncationResult {
    removedMessages: number;
    tokensSaved: number;
    strategy: string;
}
export declare class ContextWindowManager {
    private messages;
    private maxTokens;
    private sessionPath;
    private truncationStrategy;
    private compressionEnabled;
    private logger;
    constructor(options?: ContextWindowOptions);
    /**
     * Get default session storage path
     */
    private getDefaultSessionPath;
    /**
     * Add message to context
     */
    addMessage(role: "user" | "assistant", content: string): Promise<void>;
    /**
     * Get current context messages
     */
    getContext(): ConversationMessage[];
    /**
     * Get total token count
     */
    getTotalTokens(): number;
    /**
     * Get remaining tokens
     */
    getRemainingTokens(): number;
    /**
     * Get maximum token limit
     */
    getMaxTokens(): number;
    /**
     * Clear all messages
     */
    clearContext(): void;
    /**
     * Truncate context to fit within token budget
     */
    truncateContext(requiredTokens: number): Promise<TruncationResult>;
    /**
     * Auto-truncate when approaching token limit
     */
    private autoTruncate;
    /**
     * Sliding window truncation - remove oldest messages
     */
    private slidingWindowTruncation;
    /**
     * Importance-based truncation - remove least important messages
     */
    private importanceBasedTruncation;
    /**
     * Hybrid truncation - combination of sliding window and importance
     */
    private hybridTruncation;
    /**
     * Calculate importance threshold for hybrid truncation
     */
    private calculateImportanceThreshold;
    /**
     * Estimate token count for text
     */
    private estimateTokens;
    /**
     * Calculate message importance
     */
    private calculateImportance;
    /**
     * Extract conversation topics
     */
    private extractTopics;
    /**
     * Generate unique message ID
     */
    private generateMessageId;
    /**
     * Analyze conversation context
     */
    analyzeContext(): ContextAnalysis;
    /**
     * Save session to file
     */
    saveSession(sessionId: string): Promise<void>;
    /**
     * Restore session from file
     */
    restoreSession(sessionId: string): Promise<void>;
    /**
     * Export session to file
     */
    exportSession(exportPath?: string): Promise<string>;
}
//# sourceMappingURL=context-window-manager.d.ts.map