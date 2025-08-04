/**
 * Hover Provider - AI-powered hover information
 */

import * as vscode from 'vscode';
import { GeminiService } from '../services/gemini-service';
import { ContextGatherer } from '../utils/context-gatherer';
import { Logger } from '../utils/logger';

export class HoverProvider implements vscode.HoverProvider {
  private _cache = new Map<string, { hover: vscode.Hover; timestamp: number }>();
  private _cacheTimeout = 60000; // 1 minute

  constructor(
    private readonly _geminiService: GeminiService,
    private readonly _contextGatherer: ContextGatherer,
    private readonly _logger: Logger
  ) {}

  /**
   * Provide hover information
   */
  async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Hover | null> {
    try {
      if (!this._geminiService.isReady()) {
        return null;
      }

      // Get word at position
      const wordRange = document.getWordRangeAtPosition(position);
      if (!wordRange) {
        return null;
      }

      const word = document.getText(wordRange);
      if (!word || word.length < 2) {
        return null;
      }

      // Check cache
      const cacheKey = this.getCacheKey(document, position, word);
      const cached = this._cache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < this._cacheTimeout) {
        return cached.hover;
      }

      // Skip common words that don't need explanation
      if (this.isCommonWord(word, document.languageId)) {
        return null;
      }

      this._logger.debug('Providing hover information', { word, position });

      // Get surrounding context
      const context = this._contextGatherer.getSurroundingContext(document, position.line, 3);
      const codeContext = this._contextGatherer.gatherFileContext(document, 
        new vscode.Selection(wordRange.start, wordRange.end)
      );

      // Create hover content
      const hoverContent = new vscode.MarkdownString();
      hoverContent.isTrusted = true;
      hoverContent.supportHtml = true;

      // Add basic information
      hoverContent.appendMarkdown(`**$(robot) Gemini Flow** - AI Analysis\\n\\n`);
      hoverContent.appendMarkdown(`**Symbol:** \`${word}\`\\n`);
      hoverContent.appendMarkdown(`**Language:** ${document.languageId}\\n\\n`);

      // Add quick actions
      const explainArgs = encodeURIComponent(JSON.stringify([document.uri.toString(), wordRange]));
      const documentArgs = encodeURIComponent(JSON.stringify([document.uri.toString(), wordRange]));

      hoverContent.appendMarkdown(`[$(comment-discussion) Explain](command:gemini-flow.explain?${explainArgs} "Explain this code") | `);
      hoverContent.appendMarkdown(`[$(book) Document](command:gemini-flow.document?${documentArgs} "Generate documentation")\\n\\n`);

      // Try to get AI explanation if it's a significant symbol
      if (this.isSignificantSymbol(word, document.languageId, context)) {
        try {
          const explanation = await this.getSymbolExplanation(word, codeContext, token);
          if (explanation && !token.isCancellationRequested) {
            hoverContent.appendMarkdown(`**AI Explanation:**\\n${explanation}\\n\\n`);
          }
        } catch (error) {
          this._logger.debug('Failed to get AI explanation for hover', error as Error);
        }
      }

      // Add context information
      hoverContent.appendMarkdown(`**Context:**\\n`);
      hoverContent.appendCodeblock(context.target, document.languageId);

      const hover = new vscode.Hover(hoverContent, wordRange);

      // Cache the result
      this._cache.set(cacheKey, {
        hover,
        timestamp: Date.now()
      });

      // Clean up cache
      this.cleanupCache();

      return hover;

    } catch (error) {
      this._logger.error('Error providing hover information', error as Error);
      return null;
    }
  }

  /**
   * Get AI explanation for a symbol
   */
  private async getSymbolExplanation(
    symbol: string,
    context: any,
    token: vscode.CancellationToken
  ): Promise<string | null> {
    try {
      const prompt = `Briefly explain what "${symbol}" does in this ${context.language} code context. Be concise (1-2 sentences).

Context:
\`\`\`${context.language}
${context.selectedText}
\`\`\``;

      const response = await this._geminiService.chatWithAI(prompt, context, {
        cancellationToken: token
      });

      return response?.content || null;
    } catch (error) {
      this._logger.debug('Failed to get symbol explanation', error as Error);
      return null;
    }
  }

  /**
   * Check if word is common and doesn't need explanation
   */
  private isCommonWord(word: string, language: string): boolean {
    const commonWords = new Set([
      // General programming
      'i', 'j', 'k', 'x', 'y', 'z', 'a', 'b', 'c', 'n', 'm',
      'id', 'key', 'value', 'item', 'data', 'info', 'temp', 'tmp',
      'get', 'set', 'add', 'remove', 'delete', 'update', 'create',
      'find', 'search', 'filter', 'map', 'reduce', 'foreach',
      
      // Language-specific common words
      ...(this.getLanguageCommonWords(language))
    ]);

    return commonWords.has(word.toLowerCase());
  }

  /**
   * Get common words for specific languages
   */
  private getLanguageCommonWords(language: string): string[] {
    const languageWords: Record<string, string[]> = {
      typescript: ['string', 'number', 'boolean', 'object', 'array', 'void', 'any', 'unknown'],
      javascript: ['var', 'let', 'const', 'function', 'return', 'if', 'else', 'for', 'while'],
      python: ['def', 'class', 'if', 'else', 'elif', 'for', 'while', 'try', 'except', 'import'],
      java: ['public', 'private', 'protected', 'static', 'final', 'void', 'int', 'string'],
      go: ['func', 'var', 'const', 'type', 'struct', 'interface', 'if', 'else', 'for'],
      rust: ['fn', 'let', 'mut', 'struct', 'enum', 'impl', 'trait', 'if', 'else', 'for', 'match']
    };

    return languageWords[language] || [];
  }

  /**
   * Check if symbol is significant enough for AI explanation
   */
  private isSignificantSymbol(word: string, language: string, context: any): boolean {
    // Skip very short words
    if (word.length < 3) {
      return false;
    }

    // Skip if it's clearly a variable name pattern
    if (/^[a-z][a-zA-Z0-9]*$/.test(word) && word.length < 6) {
      return false;
    }

    // Include if it's a function call
    if (context.target.includes(`${word}(`)) {
      return true;
    }

    // Include if it's a class or type
    if (/^[A-Z][a-zA-Z0-9]*$/.test(word)) {
      return true;
    }

    // Include if it has special naming convention
    if (word.includes('_') || word.includes('-')) {
      return true;
    }

    // Include if it's longer than 8 characters (likely descriptive)
    if (word.length > 8) {
      return true;
    }

    return false;
  }

  /**
   * Generate cache key
   */
  private getCacheKey(document: vscode.TextDocument, position: vscode.Position, word: string): string {
    return `${document.fileName}:${position.line}:${position.character}:${word}`;
  }

  /**
   * Clean up expired cache entries
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
  }

  /**
   * Clear hover cache
   */
  clearCache(): void {
    this._cache.clear();
  }
}