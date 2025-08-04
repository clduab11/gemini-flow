/**
 * Command Manager - Handles all VSCode commands for Gemini Flow
 */

import * as vscode from 'vscode';
import { Logger } from '../utils/logger';
import { GeminiFlowExtension } from '../services/extension-manager';

export class CommandManager implements vscode.Disposable {
  private readonly _disposables: vscode.Disposable[] = [];

  constructor(
    private readonly _extension: GeminiFlowExtension,
    private readonly _logger: Logger
  ) {}

  /**
   * Register all commands
   */
  async registerCommands(): Promise<void> {
    this._logger.info('Registering Gemini Flow commands...');

    // Core commands
    this.registerCommand('gemini-flow.activate', this.activateCommand.bind(this));
    this.registerCommand('gemini-flow.configure', this.configureCommand.bind(this));
    
    // Code assistance commands
    this.registerCommand('gemini-flow.explain', this.explainCommand.bind(this));
    this.registerCommand('gemini-flow.refactor', this.refactorCommand.bind(this));
    this.registerCommand('gemini-flow.generate', this.generateCommand.bind(this));
    this.registerCommand('gemini-flow.optimize', this.optimizeCommand.bind(this));
    this.registerCommand('gemini-flow.document', this.documentCommand.bind(this));
    this.registerCommand('gemini-flow.chat', this.chatCommand.bind(this));
    
    // Advanced commands
    this.registerCommand('gemini-flow.swarm.orchestrate', this.swarmOrchestrateCommand.bind(this));
    this.registerCommand('gemini-flow.a2a.connect', this.a2aConnectCommand.bind(this));
    this.registerCommand('gemini-flow.mcp.connect', this.mcpConnectCommand.bind(this));
    this.registerCommand('gemini-flow.workspace.analyze', this.workspaceAnalyzeCommand.bind(this));
    this.registerCommand('gemini-flow.security.scan', this.securityScanCommand.bind(this));

    this._logger.info(`Registered ${this._disposables.length} commands`);
  }

  /**
   * Register a single command
   */
  private registerCommand(command: string, callback: (...args: any[]) => any): void {
    const disposable = vscode.commands.registerCommand(command, async (...args) => {
      try {
        this._logger.debug(`Executing command: ${command}`, args);
        const result = await callback(...args);
        this._logger.debug(`Command completed: ${command}`);
        return result;
      } catch (error) {
        this._logger.error(`Command failed: ${command}`, error as Error);
        vscode.window.showErrorMessage(`Command failed: ${error}`);
        throw error;
      }
    });

    this._disposables.push(disposable);
    this._extension.context.subscriptions.push(disposable);
  }

  // Command implementations

  /**
   * Activate Gemini Flow
   */
  private async activateCommand(): Promise<void> {
    if (!this._extension.state.isActivated) {
      await this._extension.initialize();
      vscode.window.showInformationMessage('Gemini Flow activated successfully!');
    } else {
      vscode.window.showInformationMessage('Gemini Flow is already active.');
    }
  }

  /**
   * Configure Gemini Flow
   */
  private async configureCommand(): Promise<void> {
    const config = this._extension.configManager.getConfiguration();
    
    const items: vscode.QuickPickItem[] = [
      {
        label: '$(key) API Key',
        description: config.apiKey ? 'Configured' : 'Not configured',
        detail: 'Set your Google Gemini API key'
      },
      {
        label: '$(robot) Model',
        description: config.model,
        detail: 'Choose the Gemini model to use'
      },
      {
        label: '$(settings-gear) Features',
        description: 'Configure features',
        detail: 'Enable/disable specific features'
      },
      {
        label: '$(plug) Protocols',
        description: 'A2A/MCP settings',
        detail: 'Configure protocol connections'
      },
      {
        label: '$(shield) Security',
        description: config.security.scanEnabled ? 'Enabled' : 'Disabled',
        detail: 'Security scanning settings'
      },
      {
        label: '$(export) Export Config',
        description: 'Export configuration',
        detail: 'Export current configuration to JSON'
      },
      {
        label: '$(import) Import Config',
        description: 'Import configuration',
        detail: 'Import configuration from JSON'
      },
      {
        label: '$(refresh) Reset',
        description: 'Reset to defaults',
        detail: 'Reset all settings to default values'
      }
    ];

    const selection = await vscode.window.showQuickPick(items, {
      placeHolder: 'Choose configuration option'
    });

    if (!selection) return;

    switch (selection.label) {
      case '$(key) API Key':
        await this.configureApiKey();
        break;
      case '$(robot) Model':
        await this.configureModel();
        break;
      case '$(settings-gear) Features':
        await this.configureFeatures();
        break;
      case '$(plug) Protocols':
        await this.configureProtocols();
        break;
      case '$(shield) Security':
        await this.configureSecurity();
        break;
      case '$(export) Export Config':
        await this.exportConfiguration();
        break;
      case '$(import) Import Config':
        await this.importConfiguration();
        break;
      case '$(refresh) Reset':
        await this.resetConfiguration();
        break;
    }
  }

  /**
   * Explain selected code
   */
  private async explainCommand(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor found');
      return;
    }

    const selection = editor.selection;
    if (selection.isEmpty) {
      vscode.window.showErrorMessage('Please select code to explain');
      return;
    }

    const context = this._extension.contextGatherer.gatherFileContext(editor.document, selection);
    
    try {
      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Explaining code...',
        cancellable: true
      }, async (progress, token) => {
        const response = await this._extension.geminiService.explainCode(context, {
          streaming: this._extension.configManager.getConfiguration().streamingMode,
          cancellationToken: token
        });

        if (response) {
          await this.showExplanationResult(response, context);
        }
      });
    } catch (error) {
      this._logger.error('Failed to explain code', error as Error);
      vscode.window.showErrorMessage(`Failed to explain code: ${error}`);
    }
  }

  /**
   * Suggest refactoring for selected code
   */
  private async refactorCommand(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor found');
      return;
    }

    const selection = editor.selection;
    if (selection.isEmpty) {
      vscode.window.showErrorMessage('Please select code to refactor');
      return;
    }

    const context = this._extension.contextGatherer.gatherFileContext(editor.document, selection);
    
    try {
      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Analyzing code for refactoring...',
        cancellable: true
      }, async (progress, token) => {
        const response = await this._extension.geminiService.suggestRefactoring(context, {
          streaming: false,
          cancellationToken: token
        });

        if (response) {
          await this.showRefactoringResult(response, context, editor);
        }
      });
    } catch (error) {
      this._logger.error('Failed to suggest refactoring', error as Error);
      vscode.window.showErrorMessage(`Failed to suggest refactoring: ${error}`);
    }
  }

  /**
   * Generate code from natural language
   */
  private async generateCommand(): Promise<void> {
    const prompt = await vscode.window.showInputBox({
      prompt: 'Describe what code you want to generate',
      placeHolder: 'e.g., "Create a function that sorts an array of objects by date"'
    });

    if (!prompt) return;

    const editor = vscode.window.activeTextEditor;
    const context = editor 
      ? this._extension.contextGatherer.gatherFileContext(editor.document)
      : {
          fileName: 'untitled',
          language: 'typescript',
          fullText: '',
          relativeFilePath: 'untitled'
        };

    try {
      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Generating code...',
        cancellable: true
      }, async (progress, token) => {
        const response = await this._extension.geminiService.generateCode(prompt, context, {
          streaming: this._extension.configManager.getConfiguration().streamingMode,
          cancellationToken: token
        });

        if (response) {
          await this.showGenerationResult(response, editor);
        }
      });
    } catch (error) {
      this._logger.error('Failed to generate code', error as Error);
      vscode.window.showErrorMessage(`Failed to generate code: ${error}`);
    }
  }

  /**
   * Optimize selected code
   */
  private async optimizeCommand(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor found');
      return;
    }

    const selection = editor.selection;
    if (selection.isEmpty) {
      vscode.window.showErrorMessage('Please select code to optimize');
      return;
    }

    const context = this._extension.contextGatherer.gatherFileContext(editor.document, selection);
    
    try {
      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Optimizing code...',
        cancellable: true
      }, async (progress, token) => {
        const response = await this._extension.geminiService.optimizeCode(context, {
          streaming: false,
          cancellationToken: token
        });

        if (response) {
          await this.showOptimizationResult(response, context, editor);
        }
      });
    } catch (error) {
      this._logger.error('Failed to optimize code', error as Error);
      vscode.window.showErrorMessage(`Failed to optimize code: ${error}`);
    }
  }

  /**
   * Generate documentation
   */
  private async documentCommand(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor found');
      return;
    }

    const selection = editor.selection;
    const context = this._extension.contextGatherer.gatherFileContext(
      editor.document, 
      selection.isEmpty ? undefined : selection
    );
    
    try {
      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Generating documentation...',
        cancellable: true
      }, async (progress, token) => {
        const response = await this._extension.geminiService.generateDocumentation(context, {
          streaming: false,
          cancellationToken: token
        });

        if (response) {
          await this.showDocumentationResult(response, context, editor);
        }
      });
    } catch (error) {
      this._logger.error('Failed to generate documentation', error as Error);
      vscode.window.showErrorMessage(`Failed to generate documentation: ${error}`);
    }
  }

  /**
   * Open AI chat
   */
  private async chatCommand(): Promise<void> {
    // This would open a chat panel - for now, show a message
    vscode.window.showInformationMessage('Chat panel will be implemented in a future version');
    // TODO: Implement chat panel
  }

  /**
   * Orchestrate multi-agent swarm task
   */
  private async swarmOrchestrateCommand(): Promise<void> {
    if (!this._extension.swarmOrchestrator) {
      vscode.window.showErrorMessage('Swarm orchestration is not enabled. Please enable it in settings.');
      return;
    }

    const taskDescription = await vscode.window.showInputBox({
      prompt: 'Describe the task for multi-agent orchestration',
      placeHolder: 'e.g., "Analyze this codebase for security vulnerabilities and performance issues"'
    });

    if (!taskDescription) return;

    try {
      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Orchestrating multi-agent task...',
        cancellable: true
      }, async (progress, token) => {
        const result = await this._extension.swarmOrchestrator!.orchestrateTask(taskDescription, {
          cancellationToken: token
        });

        if (result) {
          vscode.window.showInformationMessage(`Task completed with ${result.agents?.length || 0} agents`);
          // TODO: Show detailed results
        }
      });
    } catch (error) {
      this._logger.error('Failed to orchestrate swarm task', error as Error);
      vscode.window.showErrorMessage(`Failed to orchestrate task: ${error}`);
    }
  }

  /**
   * Connect to A2A protocol
   */
  private async a2aConnectCommand(): Promise<void> {
    if (!this._extension.a2aService) {
      const enable = await vscode.window.showQuickPick(['Yes', 'No'], {
        placeHolder: 'A2A protocol is not enabled. Enable it now?'
      });

      if (enable === 'Yes') {
        await this._extension.configManager.updateNestedConfiguration('a2a.enabled', true);
      }
      return;
    }

    try {
      await this._extension.a2aService.connect();
      vscode.window.showInformationMessage('Connected to A2A protocol successfully');
    } catch (error) {
      this._logger.error('Failed to connect to A2A protocol', error as Error);
      vscode.window.showErrorMessage(`Failed to connect to A2A: ${error}`);
    }
  }

  /**
   * Connect to MCP server
   */
  private async mcpConnectCommand(): Promise<void> {
    if (!this._extension.mcpService) {
      const enable = await vscode.window.showQuickPick(['Yes', 'No'], {
        placeHolder: 'MCP protocol is not enabled. Enable it now?'
      });

      if (enable === 'Yes') {
        await this._extension.configManager.updateNestedConfiguration('mcp.enabled', true);
      }
      return;
    }

    const serverUrl = await vscode.window.showInputBox({
      prompt: 'Enter MCP server URL',
      placeHolder: 'ws://localhost:3000'
    });

    if (!serverUrl) return;

    try {
      await this._extension.mcpService.connectToServer(serverUrl);
      vscode.window.showInformationMessage('Connected to MCP server successfully');
    } catch (error) {
      this._logger.error('Failed to connect to MCP server', error as Error);
      vscode.window.showErrorMessage(`Failed to connect to MCP server: ${error}`);
    }
  }

  /**
   * Analyze workspace
   */
  private async workspaceAnalyzeCommand(uri?: vscode.Uri): Promise<void> {
    const targetFolder = uri || vscode.workspace.workspaceFolders?.[0];
    if (!targetFolder) {
      vscode.window.showErrorMessage('No workspace folder found');
      return;
    }

    try {
      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Analyzing workspace...',
        cancellable: true
      }, async (progress, token) => {
        const workspaceFolder = uri 
          ? vscode.workspace.getWorkspaceFolder(uri)!
          : vscode.workspace.workspaceFolders![0];
          
        const analysis = await this._extension.contextGatherer.gatherProjectContext(workspaceFolder);
        
        // Show analysis results
        await this.showWorkspaceAnalysis(analysis);
      });
    } catch (error) {
      this._logger.error('Failed to analyze workspace', error as Error);
      vscode.window.showErrorMessage(`Failed to analyze workspace: ${error}`);
    }
  }

  /**
   * Perform security scan
   */
  private async securityScanCommand(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage('No active editor found');
      return;
    }

    const context = this._extension.contextGatherer.gatherFileContext(editor.document);
    
    try {
      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Scanning for security issues...',
        cancellable: true
      }, async (progress, token) => {
        const result = await this._extension.geminiService.performSecurityScan(context, {
          cancellationToken: token
        });

        if (result) {
          await this.showSecurityScanResult(result, editor);
        }
      });
    } catch (error) {
      this._logger.error('Failed to perform security scan', error as Error);
      vscode.window.showErrorMessage(`Failed to perform security scan: ${error}`);
    }
  }

  // Helper methods for configuration

  private async configureApiKey(): Promise<void> {
    const apiKey = await vscode.window.showInputBox({
      prompt: 'Enter your Google Gemini API key',
      password: true,
      ignoreFocusOut: true
    });

    if (apiKey) {
      await this._extension.configManager.updateConfiguration('apiKey', apiKey);
      vscode.window.showInformationMessage('API key configured successfully');
    }
  }

  private async configureModel(): Promise<void> {
    const models = ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro', 'gemini-flash'];
    const selectedModel = await vscode.window.showQuickPick(models, {
      placeHolder: 'Choose Gemini model'
    });

    if (selectedModel) {
      await this._extension.configManager.updateConfiguration('model', selectedModel);
      vscode.window.showInformationMessage(`Model changed to ${selectedModel}`);
    }
  }

  private async configureFeatures(): Promise<void> {
    // Implementation for feature configuration
    vscode.window.showInformationMessage('Feature configuration panel will be implemented');
  }

  private async configureProtocols(): Promise<void> {
    // Implementation for protocol configuration
    vscode.window.showInformationMessage('Protocol configuration panel will be implemented');
  }

  private async configureSecurity(): Promise<void> {
    const config = this._extension.configManager.getConfiguration();
    const newValue = !config.security.scanEnabled;
    
    await this._extension.configManager.updateNestedConfiguration('security.scanEnabled', newValue);
    vscode.window.showInformationMessage(`Security scanning ${newValue ? 'enabled' : 'disabled'}`);
  }

  private async exportConfiguration(): Promise<void> {
    const configJson = this._extension.configManager.exportConfiguration();
    const doc = await vscode.workspace.openTextDocument({
      content: configJson,
      language: 'json'
    });
    await vscode.window.showTextDocument(doc);
  }

  private async importConfiguration(): Promise<void> {
    const fileUri = await vscode.window.showOpenDialog({
      canSelectFiles: true,
      canSelectFolders: false,
      canSelectMany: false,
      filters: { 'JSON Files': ['json'] }
    });

    if (fileUri && fileUri[0]) {
      try {
        const content = await vscode.workspace.fs.readFile(fileUri[0]);
        const json = Buffer.from(content).toString('utf8');
        await this._extension.configManager.importConfiguration(json);
        vscode.window.showInformationMessage('Configuration imported successfully');
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to import configuration: ${error}`);
      }
    }
  }

  private async resetConfiguration(): Promise<void> {
    const confirm = await vscode.window.showWarningMessage(
      'This will reset all Gemini Flow settings to defaults. Continue?',
      'Yes',
      'No'
    );

    if (confirm === 'Yes') {
      await this._extension.configManager.resetConfiguration();
      vscode.window.showInformationMessage('Configuration reset to defaults');
    }
  }

  // Helper methods for showing results

  private async showExplanationResult(response: any, context: any): Promise<void> {
    // Implementation for showing explanation results
    vscode.window.showInformationMessage('Code explanation generated successfully');
  }

  private async showRefactoringResult(response: any, context: any, editor: vscode.TextEditor): Promise<void> {
    // Implementation for showing refactoring results
    vscode.window.showInformationMessage('Refactoring suggestions generated successfully');
  }

  private async showGenerationResult(response: any, editor?: vscode.TextEditor): Promise<void> {
    // Implementation for showing generation results
    vscode.window.showInformationMessage('Code generated successfully');
  }

  private async showOptimizationResult(response: any, context: any, editor: vscode.TextEditor): Promise<void> {
    // Implementation for showing optimization results
    vscode.window.showInformationMessage('Code optimization suggestions generated successfully');
  }

  private async showDocumentationResult(response: any, context: any, editor: vscode.TextEditor): Promise<void> {
    // Implementation for showing documentation results
    vscode.window.showInformationMessage('Documentation generated successfully');
  }

  private async showWorkspaceAnalysis(analysis: any): Promise<void> {
    // Implementation for showing workspace analysis
    vscode.window.showInformationMessage('Workspace analysis completed successfully');
  }

  private async showSecurityScanResult(result: any, editor: vscode.TextEditor): Promise<void> {
    // Implementation for showing security scan results
    vscode.window.showInformationMessage('Security scan completed successfully');
  }

  /**
   * Dispose of all command registrations
   */
  dispose(): void {
    this._disposables.forEach(disposable => disposable.dispose());
    this._disposables.length = 0;
  }
}