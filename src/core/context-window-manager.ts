/**
 * Context Window Manager
 * 
 * Advanced context window management for 1M+ tokens
 * with smart truncation, session persistence, and conversation analysis
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Logger } from '../utils/logger.js';

export interface ContextWindowOptions {
  maxTokens?: number;
  sessionPath?: string;
  truncationStrategy?: 'sliding' | 'importance' | 'hybrid';
  compressionEnabled?: boolean;
}

export interface ConversationMessage {
  role: 'user' | 'assistant';
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

export class ContextWindowManager {
  private messages: ConversationMessage[] = [];
  private maxTokens: number;
  private sessionPath: string;
  private truncationStrategy: 'sliding' | 'importance' | 'hybrid';
  private compressionEnabled: boolean;
  private logger: Logger;

  constructor(options: ContextWindowOptions = {}) {
    this.maxTokens = options.maxTokens || 1000000; // 1M tokens default
    this.sessionPath = options.sessionPath || this.getDefaultSessionPath();
    this.truncationStrategy = options.truncationStrategy || 'hybrid';
    this.compressionEnabled = options.compressionEnabled || false;
    this.logger = new Logger('ContextWindowManager');

    this.logger.debug('Context window manager initialized', {
      maxTokens: this.maxTokens,
      sessionPath: this.sessionPath,
      truncationStrategy: this.truncationStrategy
    });
  }

  /**
   * Get default session storage path
   */
  private getDefaultSessionPath(): string {
    const homeDir = os.homedir();
    return path.join(homeDir, '.gemini-flow', 'sessions');
  }

  /**
   * Add message to context
   */
  async addMessage(role: 'user' | 'assistant', content: string): Promise<void> {
    if (!content || typeof content !== 'string') {
      throw new Error('Message content must be a non-empty string');
    }

    const tokens = this.estimateTokens(content);
    const message: ConversationMessage = {
      role,
      content,
      timestamp: new Date(),
      tokens,
      metadata: {
        importance: this.calculateImportance(content, role),
        topic: this.extractTopics(content),
        messageId: this.generateMessageId()
      }
    };

    this.messages.push(message);

    // Check if we need to truncate
    if (this.getTotalTokens() > this.maxTokens * 0.95) {
      await this.autoTruncate();
    }

    this.logger.debug('Message added', {
      role,
      tokens,
      totalTokens: this.getTotalTokens(),
      messageCount: this.messages.length
    });
  }

  /**
   * Get current context messages
   */
  getContext(): ConversationMessage[] {
    return [...this.messages];
  }

  /**
   * Get total token count
   */
  getTotalTokens(): number {
    return this.messages.reduce((total, message) => total + message.tokens, 0);
  }

  /**
   * Get remaining tokens
   */
  getRemainingTokens(): number {
    return Math.max(0, this.maxTokens - this.getTotalTokens());
  }

  /**
   * Get maximum token limit
   */
  getMaxTokens(): number {
    return this.maxTokens;
  }

  /**
   * Clear all messages
   */
  clearContext(): void {
    this.messages = [];
    this.logger.debug('Context cleared');
  }

  /**
   * Truncate context to fit within token budget
   */
  async truncateContext(requiredTokens: number): Promise<TruncationResult> {
    const targetTokens = this.maxTokens - requiredTokens;
    const currentTokens = this.getTotalTokens();

    if (currentTokens <= targetTokens) {
      return {
        removedMessages: 0,
        tokensSaved: 0,
        strategy: 'none'
      };
    }

    this.logger.info('Truncating context', {
      currentTokens,
      targetTokens,
      strategy: this.truncationStrategy
    });

    let result: TruncationResult;

    switch (this.truncationStrategy) {
      case 'sliding':
        result = await this.slidingWindowTruncation(targetTokens);
        break;
      case 'importance':
        result = await this.importanceBasedTruncation(targetTokens);
        break;
      case 'hybrid':
        result = await this.hybridTruncation(targetTokens);
        break;
      default:
        result = await this.slidingWindowTruncation(targetTokens);
    }

    this.logger.info('Context truncated', result);
    return result;
  }

  /**
   * Auto-truncate when approaching token limit
   */
  private async autoTruncate(): Promise<void> {
    const reserveTokens = this.maxTokens * 0.1; // Reserve 10% for new content
    await this.truncateContext(reserveTokens);
  }

  /**
   * Sliding window truncation - remove oldest messages
   */
  private async slidingWindowTruncation(targetTokens: number): Promise<TruncationResult> {
    let removedMessages = 0;
    let tokensSaved = 0;

    while (this.getTotalTokens() > targetTokens && this.messages.length > 1) {
      const removed = this.messages.shift()!;
      removedMessages++;
      tokensSaved += removed.tokens;
    }

    return {
      removedMessages,
      tokensSaved,
      strategy: 'sliding'
    };
  }

  /**
   * Importance-based truncation - remove least important messages
   */
  private async importanceBasedTruncation(targetTokens: number): Promise<TruncationResult> {
    let removedMessages = 0;
    let tokensSaved = 0;

    // Sort messages by importance (ascending)
    const sortedByImportance = [...this.messages]
      .map((msg, index) => ({ ...msg, originalIndex: index }))
      .sort((a, b) => (a.metadata?.importance || 0) - (b.metadata?.importance || 0));

    // Remove least important messages until we reach target
    while (this.getTotalTokens() > targetTokens && sortedByImportance.length > 1) {
      const leastImportant = sortedByImportance.shift()!;
      const index = this.messages.findIndex(msg => 
        msg.metadata?.messageId === leastImportant.metadata?.messageId
      );
      
      if (index !== -1) {
        const removed = this.messages.splice(index, 1)[0];
        removedMessages++;
        tokensSaved += removed.tokens;
      }
    }

    return {
      removedMessages,
      tokensSaved,
      strategy: 'importance'
    };
  }

  /**
   * Hybrid truncation - combination of sliding window and importance
   */
  private async hybridTruncation(targetTokens: number): Promise<TruncationResult> {
    let removedMessages = 0;
    let tokensSaved = 0;

    // First pass: remove oldest low-importance messages
    const threshold = this.calculateImportanceThreshold();
    
    let i = 0;
    while (i < this.messages.length && this.getTotalTokens() > targetTokens) {
      const message = this.messages[i];
      const importance = message.metadata?.importance || 0;
      
      // Remove if old (first 30%) and low importance
      if (i < this.messages.length * 0.3 && importance < threshold) {
        const removed = this.messages.splice(i, 1)[0];
        removedMessages++;
        tokensSaved += removed.tokens;
      } else {
        i++;
      }
    }

    // Second pass: sliding window if still over limit
    if (this.getTotalTokens() > targetTokens) {
      const slidingResult = await this.slidingWindowTruncation(targetTokens);
      removedMessages += slidingResult.removedMessages;
      tokensSaved += slidingResult.tokensSaved;
    }

    return {
      removedMessages,
      tokensSaved,
      strategy: 'hybrid'
    };
  }

  /**
   * Calculate importance threshold for hybrid truncation
   */
  private calculateImportanceThreshold(): number {
    const importanceScores = this.messages
      .map(msg => msg.metadata?.importance || 0)
      .sort((a, b) => b - a);
    
    // Use median as threshold
    const middle = Math.floor(importanceScores.length / 2);
    return importanceScores[middle] || 0;
  }

  /**
   * Estimate token count for text
   */
  private estimateTokens(text: string): number {
    // More accurate estimation using multiple factors
    const characterCount = text.length;
    const wordCount = text.split(/\s+/).length;
    const punctuationCount = (text.match(/[.,!?;:]/g) || []).length;
    
    // Base estimation: ~4 characters per token for English
    let tokens = Math.ceil(characterCount / 4);
    
    // Adjust for word boundaries (words tend to be tokenized together)
    tokens = Math.max(tokens, Math.ceil(wordCount * 1.3));
    
    // Adjust for punctuation (each punctuation might be a separate token)
    tokens += punctuationCount * 0.5;
    
    return Math.ceil(tokens);
  }

  /**
   * Calculate message importance
   */
  private calculateImportance(content: string, role: 'user' | 'assistant'): number {
    let importance = 0;

    // Base importance by role
    importance += role === 'user' ? 1.0 : 0.8;

    // Length factor (longer messages tend to be more important)
    const lengthFactor = Math.min(content.length / 1000, 2.0);
    importance += lengthFactor;

    // Content analysis
    const importantKeywords = [
      'important', 'critical', 'urgent', 'error', 'problem', 'issue',
      'help', 'question', 'explain', 'define', 'remember', 'context'
    ];
    
    const keywordMatches = importantKeywords.filter(keyword => 
      content.toLowerCase().includes(keyword)
    ).length;
    
    importance += keywordMatches * 0.3;

    // Code presence (code tends to be important)
    if (content.includes('```') || content.includes('function') || content.includes('class')) {
      importance += 0.5;
    }

    // Question detection
    if (content.includes('?')) {
      importance += 0.3;
    }

    return Math.min(importance, 5.0); // Cap at 5.0
  }

  /**
   * Extract conversation topics
   */
  private extractTopics(content: string): string[] {
    const topics: string[] = [];
    
    // Simple keyword extraction
    const techKeywords = [
      'javascript', 'python', 'react', 'node', 'api', 'database',
      'machine learning', 'ai', 'cloud', 'docker', 'kubernetes'
    ];
    
    const lowerContent = content.toLowerCase();
    
    techKeywords.forEach(keyword => {
      if (lowerContent.includes(keyword)) {
        topics.push(keyword);
      }
    });

    return topics;
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Analyze conversation context
   */
  analyzeContext(): ContextAnalysis {
    const userMessages = this.messages.filter(msg => msg.role === 'user');
    const assistantMessages = this.messages.filter(msg => msg.role === 'assistant');
    
    const totalLength = this.messages.reduce((sum, msg) => sum + msg.content.length, 0);
    const averageMessageLength = this.messages.length > 0 ? totalLength / this.messages.length : 0;
    
    const allTopics = this.messages.flatMap(msg => msg.metadata?.topic || []);
    const uniqueTopics = [...new Set(allTopics)];
    
    const userTokens = userMessages.reduce((sum, msg) => sum + msg.tokens, 0);
    const assistantTokens = assistantMessages.reduce((sum, msg) => sum + msg.tokens, 0);

    return {
      messageCount: this.messages.length,
      userMessages: userMessages.length,
      assistantMessages: assistantMessages.length,
      averageMessageLength,
      totalTokens: this.getTotalTokens(),
      conversationTopics: uniqueTopics,
      tokenDistribution: {
        user: userTokens,
        assistant: assistantTokens
      }
    };
  }

  /**
   * Save session to file
   */
  async saveSession(sessionId: string): Promise<void> {
    try {
      // Ensure session directory exists
      if (!fs.existsSync(this.sessionPath)) {
        fs.mkdirSync(this.sessionPath, { recursive: true });
      }

      const sessionFile = path.join(this.sessionPath, `${sessionId}.json`);
      const sessionData = {
        sessionId,
        timestamp: new Date().toISOString(),
        messages: this.messages,
        metadata: {
          totalTokens: this.getTotalTokens(),
          messageCount: this.messages.length,
          analysis: this.analyzeContext()
        }
      };

      fs.writeFileSync(sessionFile, JSON.stringify(sessionData, null, 2));
      
      this.logger.info('Session saved', { sessionId, sessionFile });

    } catch (error) {
      this.logger.error('Failed to save session', { sessionId, error });
      throw error;
    }
  }

  /**
   * Restore session from file
   */
  async restoreSession(sessionId: string): Promise<void> {
    try {
      const sessionFile = path.join(this.sessionPath, `${sessionId}.json`);
      
      if (!fs.existsSync(sessionFile)) {
        this.logger.debug('Session file not found', { sessionId });
        return;
      }

      const sessionData = JSON.parse(fs.readFileSync(sessionFile, 'utf8'));
      
      // Restore messages with proper date objects
      this.messages = sessionData.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));

      this.logger.info('Session restored', { 
        sessionId, 
        messageCount: this.messages.length,
        totalTokens: this.getTotalTokens()
      });

    } catch (error) {
      this.logger.error('Failed to restore session', { sessionId, error });
      throw error;
    }
  }

  /**
   * Export session to file
   */
  async exportSession(exportPath?: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const defaultPath = path.join(
      process.cwd(), 
      `gemini-conversation-${timestamp}.json`
    );
    
    const targetPath = exportPath || defaultPath;

    const exportData = {
      exportedAt: new Date().toISOString(),
      conversation: {
        messages: this.messages,
        analysis: this.analyzeContext(),
        metadata: {
          totalTokens: this.getTotalTokens(),
          messageCount: this.messages.length,
          maxTokens: this.maxTokens,
          truncationStrategy: this.truncationStrategy
        }
      }
    };

    fs.writeFileSync(targetPath, JSON.stringify(exportData, null, 2));
    
    this.logger.info('Session exported', { exportPath: targetPath });
    return targetPath;
  }
}