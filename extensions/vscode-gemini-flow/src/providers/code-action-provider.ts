/**
 * Code Action Provider - AI-powered quick fixes and refactoring actions
 */

import * as vscode from 'vscode';
import { GeminiService } from '../services/gemini-service';
import { ContextGatherer } from '../utils/context-gatherer';
import { Logger } from '../utils/logger';

export class CodeActionProvider implements vscode.CodeActionProvider {
  constructor(
    private readonly _geminiService: GeminiService,
    private readonly _contextGatherer: ContextGatherer,
    private readonly _logger: Logger
  ) {}

  /**
   * Provide code actions for diagnostics and selections
   */
  async provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    token: vscode.CancellationToken
  ): Promise<vscode.CodeAction[]> {
    try {
      if (!this._geminiService.isReady()) {
        return [];
      }

      const actions: vscode.CodeAction[] = [];

      // Add diagnostic-specific actions
      for (const diagnostic of context.diagnostics) {
        const diagnosticActions = await this.createDiagnosticActions(
          document, 
          range, 
          diagnostic, 
          token
        );
        actions.push(...diagnosticActions);
      }

      // Add general code actions for selections
      if (!range.isEmpty) {
        const selectionActions = await this.createSelectionActions(
          document, 
          range, 
          token
        );
        actions.push(...selectionActions);
      }

      // Add file-level actions
      const fileActions = this.createFileActions(document);
      actions.push(...fileActions);

      this._logger.debug(`Provided ${actions.length} code actions`);
      return actions;

    } catch (error) {
      this._logger.error('Error providing code actions', error as Error);
      return [];
    }
  }

  /**
   * Create actions for specific diagnostics
   */
  private async createDiagnosticActions(
    document: vscode.TextDocument,
    range: vscode.Range,
    diagnostic: vscode.Diagnostic,
    token: vscode.CancellationToken
  ): Promise<vscode.CodeAction[]> {
    const actions: vscode.CodeAction[] = [];

    // Handle Gemini Flow diagnostics
    if (diagnostic.source?.startsWith('Gemini Flow')) {
      const fixAction = new vscode.CodeAction(
        `Fix: ${diagnostic.message}`,
        vscode.CodeActionKind.QuickFix
      );

      fixAction.command = {
        command: 'gemini-flow.fix.diagnostic',
        title: 'Fix with AI',
        arguments: [document.uri, diagnostic]
      };

      fixAction.diagnostics = [diagnostic];
      fixAction.isPreferred = true;
      actions.push(fixAction);

      // Add explain action
      const explainAction = new vscode.CodeAction(
        'Explain this issue',
        vscode.CodeActionKind.QuickFix
      );

      explainAction.command = {
        command: 'gemini-flow.explain.diagnostic',
        title: 'Explain Issue',
        arguments: [document.uri, diagnostic]
      };

      actions.push(explainAction);
    }

    return actions;
  }

  /**
   * Create actions for selected code
   */
  private async createSelectionActions(
    document: vscode.TextDocument,
    range: vscode.Range,
    token: vscode.CancellationToken
  ): Promise<vscode.CodeAction[]> {
    const actions: vscode.CodeAction[] = [];
    const selectedText = document.getText(range);

    // Skip if selection is too small
    if (selectedText.length < 10) {
      return actions;
    }

    // Refactor actions
    const refactorAction = new vscode.CodeAction(
      '$(wrench) Refactor with AI',
      vscode.CodeActionKind.Refactor
    );
    refactorAction.command = {
      command: 'gemini-flow.refactor',
      title: 'Refactor Code',
      arguments: [document.uri, new vscode.Selection(range.start, range.end)]
    };
    actions.push(refactorAction);

    // Extract method/function
    if (this.isExtractableCode(selectedText, document.languageId)) {
      const extractAction = new vscode.CodeAction(
        '$(arrow-up) Extract to Method',
        vscode.CodeActionKind.RefactorExtract
      );
      extractAction.command = {
        command: 'gemini-flow.extract.method',
        title: 'Extract Method',
        arguments: [document.uri, range]
      };
      actions.push(extractAction);
    }

    // Optimize performance
    if (this.hasPerformanceOptimizationPotential(selectedText, document.languageId)) {
      const optimizeAction = new vscode.CodeAction(
        '$(rocket) Optimize Performance',
        vscode.CodeActionKind.RefactorRewrite
      );
      optimizeAction.command = {
        command: 'gemini-flow.optimize',
        title: 'Optimize Code',
        arguments: [document.uri, new vscode.Selection(range.start, range.end)]
      };
      actions.push(optimizeAction);
    }

    // Add documentation
    if (this.isDocumentableCode(selectedText, document.languageId)) {
      const documentAction = new vscode.CodeAction(
        '$(book) Generate Documentation',
        vscode.CodeActionKind.Source
      );
      documentAction.command = {
        command: 'gemini-flow.document',
        title: 'Generate Documentation',
        arguments: [document.uri, new vscode.Selection(range.start, range.end)]
      };
      actions.push(documentAction);
    }

    // Add tests
    if (this.isTestableCode(selectedText, document.languageId)) {
      const testAction = new vscode.CodeAction(
        '$(beaker) Generate Tests',
        vscode.CodeActionKind.Source
      );
      testAction.command = {
        command: 'gemini-flow.generate.tests',
        title: 'Generate Tests',
        arguments: [document.uri, new vscode.Selection(range.start, range.end)]
      };
      actions.push(testAction);
    }

    // Explain code
    const explainAction = new vscode.CodeAction(
      '$(comment-discussion) Explain Code',
      vscode.CodeActionKind.Source
    );
    explainAction.command = {
      command: 'gemini-flow.explain',
      title: 'Explain Code',
      arguments: [document.uri, new vscode.Selection(range.start, range.end)]
    };
    actions.push(explainAction);

    return actions;
  }

  /**
   * Create file-level actions
   */
  private createFileActions(document: vscode.TextDocument): vscode.CodeAction[] {
    const actions: vscode.CodeAction[] = [];

    // Analyze entire file
    const analyzeAction = new vscode.CodeAction(
      '$(search) Analyze File',
      vscode.CodeActionKind.Source
    );
    analyzeAction.command = {
      command: 'gemini-flow.analyze.file',
      title: 'Analyze File',
      arguments: [document.uri]
    };
    actions.push(analyzeAction);

    // Security scan
    const securityAction = new vscode.CodeAction(
      '$(shield) Security Scan',
      vscode.CodeActionKind.Source
    );
    securityAction.command = {
      command: 'gemini-flow.security.scan',
      title: 'Security Scan',
      arguments: [document.uri]
    };
    actions.push(securityAction);

    // Generate file documentation
    if (this.shouldOfferFileDocumentation(document)) {
      const docAction = new vscode.CodeAction(
        '$(book) Generate File Documentation',
        vscode.CodeActionKind.Source
      );
      docAction.command = {
        command: 'gemini-flow.document.file',
        title: 'Document File',
        arguments: [document.uri]
      };
      actions.push(docAction);
    }

    return actions;
  }

  /**
   * Check if code can be extracted to a method
   */
  private isExtractableCode(code: string, language: string): boolean {
    // Must have multiple statements
    const statements = this.countStatements(code, language);
    if (statements < 2) {
      return false;
    }

    // Must not already be a single function
    if (this.isSingleFunction(code, language)) {
      return false;
    }

    return true;
  }

  /**
   * Check if code has performance optimization potential
   */
  private hasPerformanceOptimizationPotential(code: string, language: string): boolean {
    const indicators = [
      // Nested loops
      /for\\s*\\([^}]*for\\s*\\(/,
      // String concatenation in loops
      /for\\s*\\([^}]*\\+=/,
      // Inefficient array methods
      /\\.forEach\\([^}]*\\.forEach\\(/,
      // Repeated DOM queries
      /document\\.(getElementById|querySelector)/g,
      // Synchronous operations that could be async
      /\\.sync\\(/
    ];

    return indicators.some(pattern => pattern.test(code));
  }

  /**
   * Check if code is documentable
   */
  private isDocumentableCode(code: string, language: string): boolean {
    const documentablePatterns = [
      // Functions
      /function\\s+\\w+/,
      /def\\s+\\w+/,
      /fn\\s+\\w+/,
      // Classes
      /class\\s+\\w+/,
      /struct\\s+\\w+/,
      // Interfaces
      /interface\\s+\\w+/,
      /trait\\s+\\w+/
    ];

    return documentablePatterns.some(pattern => pattern.test(code));
  }

  /**
   * Check if code is testable
   */
  private isTestableCode(code: string, language: string): boolean {
    // Must be a function or method
    const functionPatterns = [
      /function\\s+\\w+/,
      /def\\s+\\w+/,
      /fn\\s+\\w+/,
      /\\w+\\s*\\([^)]*\\)\\s*{/,
      /\\w+\\s*:\\s*\\([^)]*\\)\\s*=>/
    ];

    return functionPatterns.some(pattern => pattern.test(code));
  }

  /**
   * Count statements in code
   */
  private countStatements(code: string, language: string): number {
    // Simple heuristic based on semicolons and newlines
    const semicolons = (code.match(/;/g) || []).length;
    const lines = code.split('\\n').filter(line => line.trim().length > 0).length;
    
    // Return the higher of the two as an estimate
    return Math.max(semicolons, Math.floor(lines / 2));
  }

  /**
   * Check if code is a single function
   */
  private isSingleFunction(code: string, language: string): boolean {
    const trimmed = code.trim();
    
    // Check if it starts with function declaration and ends with closing brace
    const functionPatterns = [
      /^function\\s+\\w+[^{]*{.*}$/s,
      /^def\\s+\\w+[^:]*:.*$/s,
      /^fn\\s+\\w+[^{]*{.*}$/s
    ];

    return functionPatterns.some(pattern => pattern.test(trimmed));
  }

  /**
   * Check if file should offer documentation generation
   */
  private shouldOfferFileDocumentation(document: vscode.TextDocument): boolean {
    const text = document.getText();
    
    // Skip if file is too small
    if (text.length < 500) {
      return false;
    }

    // Skip if file already has comprehensive documentation
    const docPatterns = [
      /\\/\\*\\*[\\s\\S]*?\\*\\//g, // JSDoc
      /'''[\\s\\S]*?'''/g,         // Python docstrings
      /"""[\\s\\S]*?"""/g,         // Python docstrings
      /\/\/\/[\\s\\S]*?$/gm        // Triple slash comments
    ];

    const docMatches = docPatterns.reduce((count, pattern) => {
      return count + (text.match(pattern) || []).length;
    }, 0);

    // If there are fewer than 2 documentation blocks, offer to generate
    return docMatches < 2;
  }

  /**
   * Resolve code action with additional information
   */
  async resolveCodeAction(
    codeAction: vscode.CodeAction,
    token: vscode.CancellationToken
  ): Promise<vscode.CodeAction> {
    // Most code actions are resolved immediately
    // This method can be used for expensive operations
    return codeAction;
  }
}