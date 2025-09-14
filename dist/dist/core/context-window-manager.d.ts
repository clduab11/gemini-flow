export class ContextWindowManager {
    constructor(options?: {});
    messages: any[];
    maxTokens: any;
    sessionPath: any;
    truncationStrategy: any;
    compressionEnabled: any;
    logger: Logger;
    /**
     * Get default session storage path
     */
    getDefaultSessionPath(): string;
    /**
     * Add message to context
     */
    addMessage(role: any, content: any): Promise<void>;
    /**
     * Get current context messages
     */
    getContext(): any[];
    /**
     * Get total token count
     */
    getTotalTokens(): any;
    /**
     * Get remaining tokens
     */
    getRemainingTokens(): number;
    /**
     * Get maximum token limit
     */
    getMaxTokens(): any;
    /**
     * Clear all messages
     */
    clearContext(): void;
    /**
     * Truncate context to fit within token budget
     */
    truncateContext(requiredTokens: any): Promise<{
        removedMessages: number;
        tokensSaved: number;
        strategy: string;
    }>;
    /**
     * Auto-truncate when approaching token limit
     */
    autoTruncate(): Promise<void>;
    /**
     * Sliding window truncation - remove oldest messages
     */
    slidingWindowTruncation(targetTokens: any): Promise<{
        removedMessages: number;
        tokensSaved: number;
        strategy: string;
    }>;
    /**
     * Importance-based truncation - remove least important messages
     */
    importanceBasedTruncation(targetTokens: any): Promise<{
        removedMessages: number;
        tokensSaved: number;
        strategy: string;
    }>;
    /**
     * Hybrid truncation - combination of sliding window and importance
     */
    hybridTruncation(targetTokens: any): Promise<{
        removedMessages: number;
        tokensSaved: number;
        strategy: string;
    }>;
    /**
     * Calculate importance threshold for hybrid truncation
     */
    calculateImportanceThreshold(): any;
    /**
     * Estimate token count for text
     */
    estimateTokens(text: any): number;
    /**
     * Calculate message importance
     */
    calculateImportance(content: any, role: any): number;
    /**
     * Extract conversation topics
     */
    extractTopics(content: any): any[];
    /**
     * Generate unique message ID
     */
    generateMessageId(): string;
    /**
     * Analyze conversation context
     */
    analyzeContext(): {
        messageCount: number;
        userMessages: number;
        assistantMessages: number;
        averageMessageLength: number;
        totalTokens: any;
        conversationTopics: any[];
        tokenDistribution: {
            user: any;
            assistant: any;
        };
    };
    /**
     * Save session to file
     */
    saveSession(sessionId: any): Promise<void>;
    /**
     * Restore session from file
     */
    restoreSession(sessionId: any): Promise<void>;
    /**
     * Export session to file
     */
    exportSession(exportPath: any): Promise<any>;
}
import { Logger } from "../utils/logger.js";
//# sourceMappingURL=context-window-manager.d.ts.map