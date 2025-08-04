/**
 * Code Lens Provider - AI-powered code lenses for quick actions
 */

import * as vscode from 'vscode';
import { GeminiService } from '../services/gemini-service';
import { ContextGatherer } from '../utils/context-gatherer';
import { Logger } from '../utils/logger';

export class CodeLensProvider implements vscode.CodeLensProvider {
  private _onDidChangeCodeLenses = new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;

  constructor(
    private readonly _geminiService: GeminiService,
    private readonly _contextGatherer: ContextGatherer,
    private readonly _logger: Logger
  ) {}

  /**
   * Provide code lenses for a document
   */
  async provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): Promise<vscode.CodeLens[]> {
    try {
      if (!this._geminiService.isReady()) {
        return [];
      }

      this._logger.debug('Providing code lenses', { 
        fileName: document.fileName,
        language: document.languageId 
      });

      const codeLenses: vscode.CodeLens[] = [];

      // Add code lenses for functions
      const functionLenses = await this.getFunctionCodeLenses(document, token);
      codeLenses.push(...functionLenses);

      // Add code lenses for classes
      const classLenses = await this.getClassCodeLenses(document, token);
      codeLenses.push(...classLenses);

      // Add code lenses for complex expressions
      const complexityLenses = await this.getComplexityCodeLenses(document, token);
      codeLenses.push(...complexityLenses);

      // Add file-level code lenses
      const fileLenses = this.getFileCodeLenses(document);
      codeLenses.push(...fileLenses);

      if (token.isCancellationRequested) {
        return [];
      }

      this._logger.debug(`Provided ${codeLenses.length} code lenses`);
      return codeLenses;

    } catch (error) {
      this._logger.error('Error providing code lenses', error as Error);
      return [];
    }
  }

  /**
   * Resolve code lens with command details
   */
  async resolveCodeLens(
    codeLens: vscode.CodeLens,
    token: vscode.CancellationToken
  ): Promise<vscode.CodeLens> {
    // Most commands are resolved immediately, but this method
    // can be used for expensive operations
    return codeLens;
  }

  /**
   * Get code lenses for functions
   */
  private async getFunctionCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): Promise<vscode.CodeLens[]> {
    const codeLenses: vscode.CodeLens[] = [];
    const functionRegexes = this.getFunctionRegexes(document.languageId);

    for (let i = 0; i < document.lineCount; i++) {
      if (token.isCancellationRequested) {
        break;
      }

      const line = document.lineAt(i);
      
      for (const regex of functionRegexes) {
        const match = line.text.match(regex);
        if (match) {
          const range = new vscode.Range(i, 0, i, line.text.length);
          
          // Explain function
          codeLenses.push(new vscode.CodeLens(range, {
            title: '$(comment-discussion) Explain',
            command: 'gemini-flow.explain',
            arguments: [document.uri, new vscode.Selection(range.start, range.end)]
          }));

          // Generate documentation
          codeLenses.push(new vscode.CodeLens(range, {
            title: '$(book) Document',
            command: 'gemini-flow.document',
            arguments: [document.uri, new vscode.Selection(range.start, range.end)]
          }));

          // Generate tests
          codeLenses.push(new vscode.CodeLens(range, {
            title: '$(beaker) Generate Tests',
            command: 'gemini-flow.generate.tests',
            arguments: [document.uri, new vscode.Selection(range.start, range.end)]
          }));

          break; // Only add one set of lenses per line
        }
      }
    }

    return codeLenses;
  }

  /**
   * Get code lenses for classes
   */
  private async getClassCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): Promise<vscode.CodeLens[]> {
    const codeLenses: vscode.CodeLens[] = [];
    const classRegexes = this.getClassRegexes(document.languageId);

    for (let i = 0; i < document.lineCount; i++) {
      if (token.isCancellationRequested) {
        break;
      }

      const line = document.lineAt(i);
      
      for (const regex of classRegexes) {
        const match = line.text.match(regex);
        if (match) {
          const range = new vscode.Range(i, 0, i, line.text.length);
          
          // Analyze class structure
          codeLenses.push(new vscode.CodeLens(range, {
            title: '$(organization) Analyze Structure',
            command: 'gemini-flow.analyze.class',
            arguments: [document.uri, new vscode.Selection(range.start, range.end)]
          }));

          // Suggest refactoring
          codeLenses.push(new vscode.CodeLens(range, {
            title: '$(wrench) Refactor',
            command: 'gemini-flow.refactor',
            arguments: [document.uri, new vscode.Selection(range.start, range.end)]
          }));

          break;
        }
      }
    }

    return codeLenses;
  }

  /**
   * Get code lenses for complex expressions
   */
  private async getComplexityCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): Promise<vscode.CodeLens[]> {
    const codeLenses: vscode.CodeLens[] = [];
    
    for (let i = 0; i < document.lineCount; i++) {
      if (token.isCancellationRequested) {
        break;
      }

      const line = document.lineAt(i);
      
      // Detect complex lines (heuristic)
      if (this.isComplexLine(line.text, document.languageId)) {
        const range = new vscode.Range(i, 0, i, line.text.length);
        
        codeLenses.push(new vscode.CodeLens(range, {
          title: '$(lightbulb) Simplify',
          command: 'gemini-flow.simplify',
          arguments: [document.uri, new vscode.Selection(range.start, range.end)]
        }));
      }
    }

    return codeLenses;
  }

  /**
   * Get file-level code lenses
   */
  private getFileCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    const codeLenses: vscode.CodeLens[] = [];
    const firstLine = new vscode.Range(0, 0, 0, 0);

    // File analysis
    codeLenses.push(new vscode.CodeLens(firstLine, {
      title: '$(search) Analyze File',
      command: 'gemini-flow.analyze.file',
      arguments: [document.uri]
    }));

    // Security scan
    codeLenses.push(new vscode.CodeLens(firstLine, {
      title: '$(shield) Security Scan',
      command: 'gemini-flow.security.scan',
      arguments: [document.uri]
    }));

    // Performance analysis
    codeLenses.push(new vscode.CodeLens(firstLine, {
      title: '$(rocket) Performance Analysis',
      command: 'gemini-flow.analyze.performance',
      arguments: [document.uri]
    }));

    return codeLenses;
  }

  /**
   * Get function regex patterns for different languages
   */
  private getFunctionRegexes(language: string): RegExp[] {
    const patterns: Record<string, RegExp[]> = {
      typescript: [
        /^\\s*(export\\s+)?(async\\s+)?function\\s+\\w+/,
        /^\\s*(public|private|protected)?\\s*(async\\s+)?\\w+\\s*\\(/,
        /^\\s*const\\s+\\w+\\s*=\\s*(async\\s+)?\\(/
      ],
      javascript: [
        /^\\s*(export\\s+)?(async\\s+)?function\\s+\\w+/,
        /^\\s*const\\s+\\w+\\s*=\\s*(async\\s+)?\\(/,
        /^\\s*\\w+\\s*:\\s*(async\\s+)?function/
      ],
      python: [
        /^\\s*def\\s+\\w+/,
        /^\\s*async\\s+def\\s+\\w+/
      ],
      java: [
        /^\\s*(public|private|protected)\\s+.*\\s+\\w+\\s*\\(/
      ],
      go: [
        /^\\s*func\\s+\\w+/
      ],
      rust: [
        /^\\s*fn\\s+\\w+/,
        /^\\s*(pub\\s+)?fn\\s+\\w+/
      ]
    };

    return patterns[language] || [];
  }

  /**
   * Get class regex patterns for different languages
   */
  private getClassRegexes(language: string): RegExp[] {
    const patterns: Record<string, RegExp[]> = {
      typescript: [
        /^\\s*(export\\s+)?(abstract\\s+)?class\\s+\\w+/,
        /^\\s*(export\\s+)?interface\\s+\\w+/
      ],
      javascript: [
        /^\\s*(export\\s+)?class\\s+\\w+/
      ],
      python: [
        /^\\s*class\\s+\\w+/
      ],
      java: [
        /^\\s*(public|private|protected)?\\s*(abstract\\s+)?class\\s+\\w+/,
        /^\\s*(public|private|protected)?\\s*interface\\s+\\w+/
      ],
      go: [
        /^\\s*type\\s+\\w+\\s+struct/,
        /^\\s*type\\s+\\w+\\s+interface/
      ],
      rust: [
        /^\\s*(pub\\s+)?struct\\s+\\w+/,
        /^\\s*(pub\\s+)?trait\\s+\\w+/,
        /^\\s*(pub\\s+)?enum\\s+\\w+/
      ]
    };

    return patterns[language] || [];
  }

  /**
   * Check if a line is complex (heuristic)
   */
  private isComplexLine(text: string, language: string): boolean {
    const trimmed = text.trim();
    
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) {
      return false;
    }

    // Check for complexity indicators
    const complexityIndicators = [
      // Nested function calls
      /\\w+\\([^)]*\\w+\\([^)]*\\)/,
      // Multiple operators
      /[+\\-*/&|]{2,}/,
      // Long lines
      trimmed.length > 120,
      // Multiple conditions
      /(&&|\\|\\|).*?(&&|\\|\\|)/,
      // Nested ternary
      /\\?.*?\\?.*?:/,
      // Multiple array/object access
      /\\[.*?\\].*?\\[.*?\\]/
    ];

    return complexityIndicators.some(indicator => 
      typeof indicator === 'boolean' ? indicator : indicator.test(trimmed)
    );
  }

  /**
   * Refresh code lenses
   */
  refresh(): void {
    this._onDidChangeCodeLenses.fire();
  }

  /**
   * Dispose of code lens provider
   */
  dispose(): void {
    this._onDidChangeCodeLenses.dispose();
  }
}