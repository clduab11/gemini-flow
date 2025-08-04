/**
 * Provider Manager - Manages VSCode language providers
 */

import * as vscode from 'vscode';
import { Logger } from '../utils/logger';
import { GeminiFlowExtension } from '../services/extension-manager';
import { CompletionProvider } from './completion-provider';
import { CodeLensProvider } from './codelens-provider';
import { HoverProvider } from './hover-provider';
import { DiagnosticProvider } from './diagnostic-provider';
import { CodeActionProvider } from './code-action-provider';

export class ProviderManager implements vscode.Disposable {
  private readonly _disposables: vscode.Disposable[] = [];
  private _providers: Map<string, vscode.Disposable> = new Map();

  constructor(
    private readonly _extension: GeminiFlowExtension,
    private readonly _logger: Logger
  ) {}

  /**
   * Register all providers
   */
  async registerProviders(): Promise<void> {
    try {
      this._logger.info('Registering VSCode providers...');

      const config = this._extension.configManager.getConfiguration();

      // Register completion provider if enabled
      if (config.autoComplete) {
        await this.registerCompletionProvider();
      }

      // Register code lens provider
      await this.registerCodeLensProvider();

      // Register hover provider for explanations
      await this.registerHoverProvider();

      // Register diagnostic provider for AI-powered linting
      await this.registerDiagnosticProvider();

      // Register code action provider for refactoring suggestions
      await this.registerCodeActionProvider();

      this._logger.info(`Registered ${this._providers.size} providers`);
    } catch (error) {
      this._logger.error('Failed to register providers', error as Error);
      throw error;
    }
  }

  /**
   * Register completion provider
   */
  private async registerCompletionProvider(): Promise<void> {
    try {
      const provider = new CompletionProvider(
        this._extension.geminiService,
        this._extension.contextGatherer,
        this._logger
      );

      const disposable = vscode.languages.registerCompletionItemProvider(
        this.getSupportedLanguages(),
        provider,
        '.', '(', '[', '{', '"', "'", ':', ' '
      );

      this._providers.set('completion', disposable);
      this._disposables.push(disposable);
      this._extension.context.subscriptions.push(disposable);

      this._logger.debug('Completion provider registered');
    } catch (error) {
      this._logger.error('Failed to register completion provider', error as Error);
      throw error;
    }
  }

  /**
   * Register code lens provider
   */
  private async registerCodeLensProvider(): Promise<void> {
    try {
      const provider = new CodeLensProvider(
        this._extension.geminiService,
        this._extension.contextGatherer,
        this._logger
      );

      const disposable = vscode.languages.registerCodeLensProvider(
        this.getSupportedLanguages(),
        provider
      );

      this._providers.set('codelens', disposable);
      this._disposables.push(disposable);
      this._extension.context.subscriptions.push(disposable);

      this._logger.debug('Code lens provider registered');
    } catch (error) {
      this._logger.error('Failed to register code lens provider', error as Error);
      throw error;
    }
  }

  /**
   * Register hover provider
   */
  private async registerHoverProvider(): Promise<void> {
    try {
      const provider = new HoverProvider(
        this._extension.geminiService,
        this._extension.contextGatherer,
        this._logger
      );

      const disposable = vscode.languages.registerHoverProvider(
        this.getSupportedLanguages(),
        provider
      );

      this._providers.set('hover', disposable);
      this._disposables.push(disposable);
      this._extension.context.subscriptions.push(disposable);

      this._logger.debug('Hover provider registered');
    } catch (error) {
      this._logger.error('Failed to register hover provider', error as Error);
      throw error;
    }
  }

  /**
   * Register diagnostic provider
   */
  private async registerDiagnosticProvider(): Promise<void> {
    try {
      const provider = new DiagnosticProvider(
        this._extension.geminiService,
        this._extension.contextGatherer,
        this._extension.state.diagnosticsCollection,
        this._logger
      );

      // Start diagnostic provider
      await provider.initialize();

      this._providers.set('diagnostic', provider);
      this._disposables.push(provider);

      this._logger.debug('Diagnostic provider registered');
    } catch (error) {
      this._logger.error('Failed to register diagnostic provider', error as Error);
      throw error;
    }
  }

  /**
   * Register code action provider
   */
  private async registerCodeActionProvider(): Promise<void> {
    try {
      const provider = new CodeActionProvider(
        this._extension.geminiService,
        this._extension.contextGatherer,
        this._logger
      );

      const disposable = vscode.languages.registerCodeActionsProvider(
        this.getSupportedLanguages(),
        provider,
        {
          providedCodeActionKinds: [
            vscode.CodeActionKind.Refactor,
            vscode.CodeActionKind.RefactorRewrite,
            vscode.CodeActionKind.QuickFix,
            vscode.CodeActionKind.Source
          ]
        }
      );

      this._providers.set('codeaction', disposable);
      this._disposables.push(disposable);
      this._extension.context.subscriptions.push(disposable);

      this._logger.debug('Code action provider registered');
    } catch (error) {
      this._logger.error('Failed to register code action provider', error as Error);
      throw error;
    }
  }

  /**
   * Update provider configurations
   */
  async updateProviderConfigurations(): Promise<void> {
    try {
      const config = this._extension.configManager.getConfiguration();

      // Update completion provider based on configuration
      if (config.autoComplete && !this._providers.has('completion')) {
        await this.registerCompletionProvider();
      } else if (!config.autoComplete && this._providers.has('completion')) {
        this.unregisterProvider('completion');
      }

      this._logger.debug('Provider configurations updated');
    } catch (error) {
      this._logger.error('Failed to update provider configurations', error as Error);
    }
  }

  /**
   * Unregister a specific provider
   */
  private unregisterProvider(providerName: string): void {
    const provider = this._providers.get(providerName);
    if (provider) {
      provider.dispose();
      this._providers.delete(providerName);
      this._logger.debug(`Provider unregistered: ${providerName}`);
    }
  }

  /**
   * Get supported language selectors
   */
  private getSupportedLanguages(): vscode.DocumentSelector {
    return [
      { scheme: 'file', language: 'typescript' },
      { scheme: 'file', language: 'javascript' },
      { scheme: 'file', language: 'typescriptreact' },
      { scheme: 'file', language: 'javascriptreact' },
      { scheme: 'file', language: 'python' },
      { scheme: 'file', language: 'java' },
      { scheme: 'file', language: 'go' },
      { scheme: 'file', language: 'rust' },
      { scheme: 'file', language: 'cpp' },
      { scheme: 'file', language: 'c' },
      { scheme: 'file', language: 'csharp' },
      { scheme: 'file', language: 'php' },
      { scheme: 'file', language: 'ruby' },
      { scheme: 'file', language: 'html' },
      { scheme: 'file', language: 'css' },
      { scheme: 'file', language: 'scss' },
      { scheme: 'file', language: 'json' },
      { scheme: 'file', language: 'yaml' },
      { scheme: 'file', language: 'markdown' },
      { scheme: 'file', language: 'sql' }
    ];
  }

  /**
   * Get provider status
   */
  getProviderStatus(): Array<{ name: string; active: boolean }> {
    return [
      { name: 'completion', active: this._providers.has('completion') },
      { name: 'codelens', active: this._providers.has('codelens') },
      { name: 'hover', active: this._providers.has('hover') },
      { name: 'diagnostic', active: this._providers.has('diagnostic') },
      { name: 'codeaction', active: this._providers.has('codeaction') }
    ];
  }

  /**
   * Refresh all providers
   */
  async refreshProviders(): Promise<void> {
    try {
      this._logger.info('Refreshing all providers...');

      // Dispose all existing providers
      this._providers.forEach(provider => provider.dispose());
      this._providers.clear();

      // Re-register providers
      await this.registerProviders();

      this._logger.info('All providers refreshed successfully');
    } catch (error) {
      this._logger.error('Failed to refresh providers', error as Error);
      throw error;
    }
  }

  /**
   * Enable/disable specific provider
   */
  async toggleProvider(providerName: string, enabled: boolean): Promise<void> {
    try {
      if (enabled && !this._providers.has(providerName)) {
        switch (providerName) {
          case 'completion':
            await this.registerCompletionProvider();
            break;
          case 'codelens':
            await this.registerCodeLensProvider();
            break;
          case 'hover':
            await this.registerHoverProvider();
            break;
          case 'diagnostic':
            await this.registerDiagnosticProvider();
            break;
          case 'codeaction':
            await this.registerCodeActionProvider();
            break;
          default:
            throw new Error(`Unknown provider: ${providerName}`);
        }
      } else if (!enabled && this._providers.has(providerName)) {
        this.unregisterProvider(providerName);
      }

      this._logger.info(`Provider ${providerName} ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      this._logger.error(`Failed to toggle provider ${providerName}`, error as Error);
      throw error;
    }
  }

  /**
   * Get active provider count
   */
  getActiveProviderCount(): number {
    return this._providers.size;
  }

  /**
   * Check if a provider is active
   */
  isProviderActive(providerName: string): boolean {
    return this._providers.has(providerName);
  }

  /**
   * Dispose of all providers
   */
  dispose(): void {
    this._logger.info('Disposing provider manager...');

    // Dispose all registered providers
    this._providers.forEach(provider => {
      try {
        provider.dispose();
      } catch (error) {
        this._logger.error('Error disposing provider', error as Error);
      }
    });

    this._providers.clear();

    // Dispose all other disposables
    this._disposables.forEach(disposable => {
      try {
        disposable.dispose();
      } catch (error) {
        this._logger.error('Error disposing resource', error as Error);
      }
    });

    this._disposables.length = 0;

    this._logger.info('Provider manager disposed');
  }
}