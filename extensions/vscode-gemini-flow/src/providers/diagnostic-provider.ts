/**
 * Diagnostic Provider - AI-powered code analysis and diagnostics
 */

import * as vscode from 'vscode';
import { GeminiService } from '../services/gemini-service';
import { ContextGatherer } from '../utils/context-gatherer';
import { Logger } from '../utils/logger';
import { DiagnosticData } from '../types';

export class DiagnosticProvider implements vscode.Disposable {
  private readonly _disposables: vscode.Disposable[] = [];
  private _isEnabled = true;
  private _analysisTimeout?: NodeJS.Timeout;
  private _analysisDelay = 2000; // 2 second delay after changes

  constructor(
    private readonly _geminiService: GeminiService,
    private readonly _contextGatherer: ContextGatherer,
    private readonly _diagnosticsCollection: vscode.DiagnosticCollection,
    private readonly _logger: Logger
  ) {}

  /**
   * Initialize diagnostic provider
   */
  async initialize(): Promise<void> {
    try {
      this._logger.info('Initializing diagnostic provider...');

      // Listen for document changes
      const onDidChangeTextDocument = vscode.workspace.onDidChangeTextDocument(
        this.onDocumentChanged.bind(this)
      );
      this._disposables.push(onDidChangeTextDocument);

      // Listen for document open/close
      const onDidOpenTextDocument = vscode.workspace.onDidOpenTextDocument(
        this.onDocumentOpened.bind(this)
      );
      this._disposables.push(onDidOpenTextDocument);

      const onDidCloseTextDocument = vscode.workspace.onDidCloseTextDocument(
        this.onDocumentClosed.bind(this)
      );
      this._disposables.push(onDidCloseTextDocument);

      // Analyze currently open documents
      for (const document of vscode.workspace.textDocuments) {
        if (this.shouldAnalyzeDocument(document)) {
          await this.analyzeDocument(document);
        }
      }

      this._logger.info('Diagnostic provider initialized');
    } catch (error) {
      this._logger.error('Failed to initialize diagnostic provider', error as Error);
      throw error;
    }
  }

  /**
   * Handle document changes
   */
  private onDocumentChanged(event: vscode.TextDocumentChangeEvent): void {
    if (!this._isEnabled || !this.shouldAnalyzeDocument(event.document)) {
      return;
    }

    // Clear existing timeout
    if (this._analysisTimeout) {
      clearTimeout(this._analysisTimeout);
    }

    // Schedule analysis with delay to avoid too frequent calls
    this._analysisTimeout = setTimeout(() => {
      this.analyzeDocument(event.document).catch(error => {
        this._logger.error('Failed to analyze document on change', error as Error);
      });
    }, this._analysisDelay);
  }

  /**
   * Handle document opened
   */
  private onDocumentOpened(document: vscode.TextDocument): void {
    if (this.shouldAnalyzeDocument(document)) {
      this.analyzeDocument(document).catch(error => {
        this._logger.error('Failed to analyze opened document', error as Error);
      });
    }
  }

  /**
   * Handle document closed
   */
  private onDocumentClosed(document: vscode.TextDocument): void {
    // Clear diagnostics for closed document
    this._diagnosticsCollection.set(document.uri, []);
  }

  /**
   * Analyze a document for issues
   */
  private async analyzeDocument(document: vscode.TextDocument): Promise<void> {
    try {
      if (!this._geminiService.isReady()) {
        return;
      }

      this._logger.debug('Analyzing document for diagnostics', { fileName: document.fileName });

      const context = this._contextGatherer.gatherFileContext(document);
      
      // Perform different types of analysis
      const diagnostics: vscode.Diagnostic[] = [];

      // Security analysis
      const securityDiagnostics = await this.performSecurityAnalysis(document, context);
      diagnostics.push(...securityDiagnostics);

      // Code quality analysis
      const qualityDiagnostics = await this.performQualityAnalysis(document, context);
      diagnostics.push(...qualityDiagnostics);

      // Performance analysis
      const performanceDiagnostics = await this.performPerformanceAnalysis(document, context);
      diagnostics.push(...performanceDiagnostics);

      // Update diagnostics collection
      this._diagnosticsCollection.set(document.uri, diagnostics);

      this._logger.debug(`Generated ${diagnostics.length} diagnostics for ${document.fileName}`);

    } catch (error) {
      this._logger.error('Failed to analyze document', error as Error);
    }
  }

  /**
   * Perform security analysis
   */
  private async performSecurityAnalysis(
    document: vscode.TextDocument,
    context: any
  ): Promise<vscode.Diagnostic[]> {
    try {
      const result = await this._geminiService.performSecurityScan(context);
      if (!result) return [];

      const diagnostics: vscode.Diagnostic[] = [];

      for (const vulnerability of result.vulnerabilities) {
        const line = vulnerability.line ? vulnerability.line - 1 : 0;
        const range = new vscode.Range(line, 0, line, document.lineAt(line).text.length);
        
        const diagnostic = new vscode.Diagnostic(
          range,
          vulnerability.message,
          this.mapSeverityToDiagnosticSeverity(vulnerability.severity)
        );

        diagnostic.source = 'Gemini Flow Security';
        diagnostic.code = vulnerability.type;

        diagnostics.push(diagnostic);
      }

      return diagnostics;
    } catch (error) {
      this._logger.debug('Security analysis failed', error as Error);
      return [];
    }
  }

  /**
   * Perform code quality analysis
   */
  private async performQualityAnalysis(
    document: vscode.TextDocument,
    context: any
  ): Promise<vscode.Diagnostic[]> {
    const diagnostics: vscode.Diagnostic[] = [];

    try {
      // Analyze for common code quality issues
      for (let i = 0; i < document.lineCount; i++) {
        const line = document.lineAt(i);
        const issues = this.analyzeLineForQualityIssues(line, document.languageId);
        
        for (const issue of issues) {
          const range = new vscode.Range(i, issue.startColumn, i, issue.endColumn);
          const diagnostic = new vscode.Diagnostic(
            range,
            issue.message,
            vscode.DiagnosticSeverity.Information
          );
          
          diagnostic.source = 'Gemini Flow Quality';
          diagnostic.code = issue.code;
          
          diagnostics.push(diagnostic);
        }
      }

      return diagnostics;
    } catch (error) {
      this._logger.debug('Quality analysis failed', error as Error);
      return [];
    }
  }

  /**
   * Perform performance analysis
   */
  private async performPerformanceAnalysis(
    document: vscode.TextDocument,
    context: any
  ): Promise<vscode.Diagnostic[]> {
    const diagnostics: vscode.Diagnostic[] = [];

    try {
      // Detect potential performance issues
      for (let i = 0; i < document.lineCount; i++) {
        const line = document.lineAt(i);
        const issues = this.analyzeLineForPerformanceIssues(line, document.languageId);
        
        for (const issue of issues) {
          const range = new vscode.Range(i, issue.startColumn, i, issue.endColumn);
          const diagnostic = new vscode.Diagnostic(
            range,
            issue.message,
            vscode.DiagnosticSeverity.Warning
          );
          
          diagnostic.source = 'Gemini Flow Performance';
          diagnostic.code = issue.code;
          
          diagnostics.push(diagnostic);
        }
      }

      return diagnostics;
    } catch (error) {
      this._logger.debug('Performance analysis failed', error as Error);
      return [];
    }
  }

  /**
   * Analyze line for code quality issues
   */
  private analyzeLineForQualityIssues(
    line: vscode.TextLine,
    language: string
  ): Array<{ message: string; code: string; startColumn: number; endColumn: number }> {
    const issues: Array<{ message: string; code: string; startColumn: number; endColumn: number }> = [];
    const text = line.text;

    // Long lines
    if (text.length > 120) {
      issues.push({
        message: 'Line is too long (>120 characters). Consider breaking it up.',
        code: 'line-too-long',
        startColumn: 120,
        endColumn: text.length
      });
    }

    // TODO comments
    const todoMatch = text.match(/(TODO|FIXME|HACK)/i);
    if (todoMatch) {
      const start = todoMatch.index || 0;
      issues.push({
        message: `${todoMatch[1]} comment should be addressed`,
        code: 'todo-comment',
        startColumn: start,
        endColumn: start + todoMatch[1].length
      });
    }

    // Console.log in production code
    if (language === 'javascript' || language === 'typescript') {
      const consoleMatch = text.match(/console\\.log/);
      if (consoleMatch) {
        const start = consoleMatch.index || 0;
        issues.push({
          message: 'Remove console.log before production',
          code: 'console-log',
          startColumn: start,
          endColumn: start + 11
        });
      }
    }

    // Magic numbers
    const magicNumberMatch = text.match(/\\b(\\d{2,})\\b/);
    if (magicNumberMatch && !text.includes('//') && !text.includes('const')) {
      const start = magicNumberMatch.index || 0;
      issues.push({
        message: 'Consider using a named constant instead of magic number',
        code: 'magic-number',
        startColumn: start,
        endColumn: start + magicNumberMatch[1].length
      });
    }

    return issues;
  }

  /**
   * Analyze line for performance issues
   */
  private analyzeLineForPerformanceIssues(
    line: vscode.TextLine,
    language: string
  ): Array<{ message: string; code: string; startColumn: number; endColumn: number }> {
    const issues: Array<{ message: string; code: string; startColumn: number; endColumn: number }> = [];
    const text = line.text;

    // Inefficient loops
    if (language === 'javascript' || language === 'typescript') {
      // jQuery each in loops
      const jqueryEachMatch = text.match(/\\.each\\(/);
      if (jqueryEachMatch) {
        const start = jqueryEachMatch.index || 0;
        issues.push({
          message: 'Consider using native forEach or for loop for better performance',
          code: 'jquery-each',
          startColumn: start,
          endColumn: start + 6
        });
      }

      // Repeated DOM queries
      const domQueryMatch = text.match(/(document\\.getElementById|\\$\\()/);
      if (domQueryMatch) {
        const start = domQueryMatch.index || 0;
        issues.push({
          message: 'Consider caching DOM queries to improve performance',
          code: 'dom-query-cache',
          startColumn: start,
          endColumn: start + domQueryMatch[1].length
        });
      }
    }

    // String concatenation in loops (basic detection)
    if (text.includes('+=') && (text.includes('for') || text.includes('while'))) {
      const start = text.indexOf('+=');
      issues.push({
        message: 'String concatenation in loops can be inefficient. Consider using array join.',
        code: 'string-concat-loop',
        startColumn: start,
        endColumn: start + 2
      });
    }

    return issues;
  }

  /**
   * Map severity to VSCode diagnostic severity
   */
  private mapSeverityToDiagnosticSeverity(severity: string): vscode.DiagnosticSeverity {
    switch (severity.toLowerCase()) {
      case 'critical':
      case 'high':
        return vscode.DiagnosticSeverity.Error;
      case 'medium':
        return vscode.DiagnosticSeverity.Warning;
      case 'low':
        return vscode.DiagnosticSeverity.Information;
      default:
        return vscode.DiagnosticSeverity.Hint;
    }
  }

  /**
   * Check if document should be analyzed
   */
  private shouldAnalyzeDocument(document: vscode.TextDocument): boolean {
    // Skip untitled documents
    if (document.isUntitled) {
      return false;
    }

    // Skip non-file schemes
    if (document.uri.scheme !== 'file') {
      return false;
    }

    // Only analyze supported languages
    const supportedLanguages = [
      'typescript', 'javascript', 'typescriptreact', 'javascriptreact',
      'python', 'java', 'go', 'rust', 'cpp', 'c', 'csharp', 'php', 'ruby'
    ];

    return supportedLanguages.includes(document.languageId);
  }

  /**
   * Enable/disable diagnostic provider
   */
  setEnabled(enabled: boolean): void {
    this._isEnabled = enabled;
    
    if (!enabled) {
      // Clear all diagnostics when disabled
      this._diagnosticsCollection.clear();
    }
  }

  /**
   * Force refresh diagnostics for all open documents
   */
  async refreshAll(): Promise<void> {
    if (!this._isEnabled) {
      return;
    }

    for (const document of vscode.workspace.textDocuments) {
      if (this.shouldAnalyzeDocument(document)) {
        await this.analyzeDocument(document);
      }
    }
  }

  /**
   * Clear all diagnostics
   */
  clearAll(): void {
    this._diagnosticsCollection.clear();
  }

  /**
   * Dispose of diagnostic provider
   */
  dispose(): void {
    this._logger.info('Disposing diagnostic provider...');
    
    if (this._analysisTimeout) {
      clearTimeout(this._analysisTimeout);
    }

    this._disposables.forEach(disposable => disposable.dispose());
    this._diagnosticsCollection.clear();
  }
}