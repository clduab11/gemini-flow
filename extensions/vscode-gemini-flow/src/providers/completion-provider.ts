/**
 * Completion Provider - AI-powered code completion
 */

import * as vscode from 'vscode';
import { GeminiService } from '../services/gemini-service';
import { ContextGatherer } from '../utils/context-gatherer';
import { Logger } from '../utils/logger';
import { CompletionItem } from '../types';

export class CompletionProvider implements vscode.CompletionItemProvider {
  private _lastCompletionTime = 0;
  private _completionThrottle = 500; // 500ms throttle
  private _cache = new Map<string, { items: vscode.CompletionItem[]; timestamp: number }>();
  private _cacheTimeout = 30000; // 30 seconds

  constructor(
    private readonly _geminiService: GeminiService,
    private readonly _contextGatherer: ContextGatherer,
    private readonly _logger: Logger
  ) {}

  /**
   * Provide completion items
   */
  async provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
    context: vscode.CompletionContext
  ): Promise<vscode.CompletionItem[] | vscode.CompletionList | null> {
    try {
      // Skip if service not ready
      if (!this._geminiService.isReady()) {
        return null;
      }

      // Throttle requests
      const now = Date.now();
      if (now - this._lastCompletionTime < this._completionThrottle) {
        return null;
      }
      this._lastCompletionTime = now;

      // Skip for certain trigger characters or contexts
      if (this.shouldSkipCompletion(document, position, context)) {
        return null;
      }

      // Check cache first
      const cacheKey = this.getCacheKey(document, position);
      const cached = this._cache.get(cacheKey);
      if (cached && (now - cached.timestamp) < this._cacheTimeout) {
        this._logger.debug('Returning cached completion items');
        return cached.items;
      }

      // Gather context
      const codeContext = this._contextGatherer.gatherFileContext(document);
      
      this._logger.debug('Requesting AI completion suggestions', {
        position: position.line + ':' + position.character,
        language: document.languageId
      });

      // Get AI completions
      const completions = await this._geminiService.getCompletionSuggestions(
        codeContext,
        position,
        {
          maxSuggestions: 5,
          cancellationToken: token
        }
      );

      if (token.isCancellationRequested) {
        return null;
      }

      // Enhance completions with additional metadata
      const enhancedCompletions = this.enhanceCompletions(completions, document, position);

      // Cache results
      this._cache.set(cacheKey, {
        items: enhancedCompletions,
        timestamp: now
      });

      // Clean up old cache entries
      this.cleanupCache();

      this._logger.debug(`Provided ${enhancedCompletions.length} completion suggestions`);
      return enhancedCompletions;

    } catch (error) {
      this._logger.error('Error providing completions', error as Error);
      return null;
    }
  }

  /**
   * Resolve additional completion item details
   */
  async resolveCompletionItem(
    item: vscode.CompletionItem,
    token: vscode.CancellationToken
  ): Promise<vscode.CompletionItem> {
    try {
      // Add documentation or additional details if needed
      if (!item.documentation && item.detail) {
        item.documentation = new vscode.MarkdownString(
          `**Gemini Flow Suggestion**\\n\\n${item.detail}`
        );
      }

      return item;
    } catch (error) {
      this._logger.error('Error resolving completion item', error as Error);
      return item;
    }
  }

  /**
   * Check if completion should be skipped
   */
  private shouldSkipCompletion(
    document: vscode.TextDocument,
    position: vscode.Position,
    context: vscode.CompletionContext
  ): boolean {
    // Skip in comments (basic check)
    const line = document.lineAt(position.line).text;
    const beforeCursor = line.substring(0, position.character);
    
    // Skip in string literals
    const stringMatch = beforeCursor.match(/["'`]/g);
    if (stringMatch && stringMatch.length % 2 === 1) {
      return true;
    }

    // Skip in single-line comments
    if (beforeCursor.includes('//') || beforeCursor.includes('#')) {
      return true;
    }

    // Skip if trigger character is not relevant
    if (context.triggerKind === vscode.CompletionTriggerKind.TriggerCharacter) {
      const irrelevantTriggers = ['"', "'", '`'];
      if (irrelevantTriggers.includes(context.triggerCharacter || '')) {
        return true;
      }
    }

    // Skip if cursor is at the beginning of a line with only whitespace
    if (beforeCursor.trim() === '' && position.character > 0) {
      return true;
    }

    return false;
  }

  /**
   * Enhance completion items with additional metadata
   */
  private enhanceCompletions(
    completions: vscode.CompletionItem[],
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.CompletionItem[] {
    return completions.map(item => {
      // Add Gemini Flow branding
      item.detail = `$(robot) ${item.detail || 'Gemini Flow'}`;
      
      // Set appropriate kind if not set
      if (!item.kind) {
        item.kind = this.inferCompletionKind(item.label as string, document.languageId);
      }

      // Add sort text for better ordering
      item.sortText = `0-gemini-${item.label}`;

      // Add filter text for better matching
      if (!item.filterText) {
        item.filterText = item.label as string;
      }

      // Add insert text if not provided
      if (!item.insertText) {
        item.insertText = item.label as string;
      }

      // Add command to track usage
      item.command = {
        command: 'gemini-flow.completion.used',
        title: 'Track Completion Usage',
        arguments: [item.label, document.languageId]
      };

      return item;
    });
  }

  /**
   * Infer completion item kind based on label and language
   */
  private inferCompletionKind(label: string, language: string): vscode.CompletionItemKind {
    // Function patterns
    if (label.includes('(') || label.endsWith('()')) {
      return vscode.CompletionItemKind.Function;
    }

    // Class patterns
    if (label.match(/^[A-Z][a-zA-Z0-9]*$/)) {
      return vscode.CompletionItemKind.Class;
    }

    // Variable patterns
    if (label.match(/^[a-z][a-zA-Z0-9]*$/)) {
      return vscode.CompletionItemKind.Variable;
    }

    // Keywords
    const keywords = this.getLanguageKeywords(language);
    if (keywords.includes(label)) {
      return vscode.CompletionItemKind.Keyword;
    }

    // Default to text
    return vscode.CompletionItemKind.Text;
  }

  /**
   * Get common keywords for a language
   */
  private getLanguageKeywords(language: string): string[] {
    const keywordMap: Record<string, string[]> = {
      typescript: ['function', 'class', 'interface', 'type', 'const', 'let', 'var', 'async', 'await', 'return'],
      javascript: ['function', 'class', 'const', 'let', 'var', 'async', 'await', 'return'],
      python: ['def', 'class', 'if', 'else', 'elif', 'for', 'while', 'try', 'except', 'import', 'return'],
      java: ['public', 'private', 'protected', 'class', 'interface', 'extends', 'implements', 'return', 'void'],
      go: ['func', 'type', 'struct', 'interface', 'var', 'const', 'if', 'else', 'for', 'return'],
      rust: ['fn', 'struct', 'enum', 'impl', 'trait', 'let', 'mut', 'if', 'else', 'for', 'match', 'return']
    };

    return keywordMap[language] || [];
  }

  /**
   * Generate cache key for completion request
   */
  private getCacheKey(document: vscode.TextDocument, position: vscode.Position): string {
    const line = document.lineAt(position.line).text;
    const beforeCursor = line.substring(Math.max(0, position.character - 20), position.character);
    
    return `${document.fileName}:${position.line}:${beforeCursor}`;
  }

  /**
   * Clean up old cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, value] of this._cache) {
      if (now - value.timestamp > this._cacheTimeout) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this._cache.delete(key));

    if (expiredKeys.length > 0) {
      this._logger.debug(`Cleaned up ${expiredKeys.length} expired completion cache entries`);
    }
  }

  /**
   * Clear completion cache
   */
  clearCache(): void {
    this._cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this._cache.size,
      hitRate: 0 // Would need to track hits/misses for accurate rate
    };
  }
}