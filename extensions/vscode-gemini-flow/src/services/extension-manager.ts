/**
 * Extension Manager - Core service for managing the Gemini Flow extension
 */

import * as vscode from 'vscode';
import { GeminiFlowConfig, ExtensionState, CodeContext } from '../types';
import { Logger } from '../utils/logger';
import { ConfigurationManager } from './configuration-manager';
import { AuthenticationService } from './authentication-service';
import { GeminiService } from './gemini-service';
import { A2AService } from './a2a-service';
import { MCPService } from './mcp-service';
import { SwarmOrchestrator } from './swarm-orchestrator';
import { ContextGatherer } from '../utils/context-gatherer';
import { CommandManager } from '../commands/command-manager';
import { ProviderManager } from '../providers/provider-manager';
import { StatusBarManager } from '../utils/status-bar-manager';

export class GeminiFlowExtension implements vscode.Disposable {
  private readonly _disposables: vscode.Disposable[] = [];
  private readonly _state: ExtensionState;
  
  // Core services
  private readonly _configManager: ConfigurationManager;
  private readonly _authService: AuthenticationService;
  private readonly _geminiService: GeminiService;
  private readonly _contextGatherer: ContextGatherer;
  private readonly _commandManager: CommandManager;
  private readonly _providerManager: ProviderManager;
  private readonly _statusBarManager: StatusBarManager;
  
  // Protocol services
  private _a2aService?: A2AService;
  private _mcpService?: MCPService;
  private _swarmOrchestrator?: SwarmOrchestrator;

  constructor(
    private readonly _context: vscode.ExtensionContext,
    private readonly _logger: Logger
  ) {
    // Initialize state
    this._state = {
      isActivated: false,
      isAuthenticated: false,
      currentModel: 'gemini-1.5-pro',
      mcpConnections: new Map(),
      activeSwarmTasks: new Map(),
      diagnosticsCollection: vscode.languages.createDiagnosticCollection('gemini-flow'),
      statusBarItem: vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100)
    };

    // Initialize core services
    this._configManager = new ConfigurationManager(_logger);
    this._authService = new AuthenticationService(_context, _logger);
    this._geminiService = new GeminiService(_configManager, _authService, _logger);
    this._contextGatherer = new ContextGatherer(_logger);
    this._commandManager = new CommandManager(this, _logger);
    this._providerManager = new ProviderManager(this, _logger);
    this._statusBarManager = new StatusBarManager(this._state.statusBarItem, _logger);

    // Add to disposables
    this._disposables.push(
      this._state.diagnosticsCollection,
      this._state.statusBarItem,
      this._configManager,
      this._authService,
      this._geminiService,
      this._commandManager,
      this._providerManager,
      this._statusBarManager
    );
  }

  /**
   * Initialize the extension
   */
  async initialize(): Promise<void> {
    try {
      this._logger.info('Initializing Gemini Flow extension...');

      // Load configuration
      await this._configManager.loadConfiguration();
      const config = this._configManager.getConfiguration();

      // Initialize authentication
      await this._authService.initialize();
      this._state.isAuthenticated = await this._authService.isAuthenticated();

      // Initialize Gemini service
      if (this._state.isAuthenticated) {
        await this._geminiService.initialize();
        this._state.currentModel = config.model;
      }

      // Initialize protocol services if enabled
      if (config.a2a.enabled) {
        await this.initializeA2AService();
      }

      if (config.mcp.enabled) {
        await this.initializeMCPService();
      }

      if (config.swarm.enabled) {
        await this.initializeSwarmOrchestrator();
      }

      // Listen for configuration changes
      this.setupConfigurationWatcher();

      this._state.isActivated = true;
      this._logger.info('Extension initialization completed successfully');

    } catch (error) {
      this._logger.error('Failed to initialize extension', error as Error);
      throw error;
    }
  }

  /**
   * Register all commands
   */
  async registerCommands(): Promise<void> {
    await this._commandManager.registerCommands();
  }

  /**
   * Register all providers
   */
  async registerProviders(): Promise<void> {
    await this._providerManager.registerProviders();
  }

  /**
   * Setup status bar
   */
  setupStatusBar(): void {
    this._statusBarManager.initialize();
    this._statusBarManager.updateStatus('ready', 'Gemini Flow: Ready');
  }

  /**
   * Check configuration and show setup if needed
   */
  async checkConfiguration(): Promise<void> {
    const config = this._configManager.getConfiguration();
    
    if (!config.enabled) {
      this._statusBarManager.updateStatus('disabled', 'Gemini Flow: Disabled');
      return;
    }

    if (!config.apiKey) {
      const response = await vscode.window.showWarningMessage(
        'Gemini Flow: API key not configured. Please configure your Google Gemini API key.',
        'Configure Now',
        'Later'
      );

      if (response === 'Configure Now') {
        await vscode.commands.executeCommand('gemini-flow.configure');
      } else {
        this._statusBarManager.updateStatus('warning', 'Gemini Flow: API Key Required');
      }
      return;
    }

    if (!this._state.isAuthenticated) {
      await this._authService.authenticate();
      this._state.isAuthenticated = await this._authService.isAuthenticated();
    }

    if (this._state.isAuthenticated) {
      this._statusBarManager.updateStatus('ready', `Gemini Flow: ${config.model}`);
    } else {
      this._statusBarManager.updateStatus('error', 'Gemini Flow: Authentication Failed');
    }
  }

  /**
   * Initialize A2A service
   */
  private async initializeA2AService(): Promise<void> {
    try {
      this._logger.info('Initializing A2A service...');
      const config = this._configManager.getConfiguration();
      
      this._a2aService = new A2AService(config.a2a.endpoint, this._logger);
      await this._a2aService.connect();
      
      this._disposables.push(this._a2aService);
      this._logger.info('A2A service initialized successfully');
    } catch (error) {
      this._logger.error('Failed to initialize A2A service', error as Error);
      throw error;
    }
  }

  /**
   * Initialize MCP service
   */
  private async initializeMCPService(): Promise<void> {
    try {
      this._logger.info('Initializing MCP service...');
      const config = this._configManager.getConfiguration();
      
      this._mcpService = new MCPService(config.mcp.servers, this._logger);
      await this._mcpService.initialize();
      
      this._disposables.push(this._mcpService);
      this._logger.info('MCP service initialized successfully');
    } catch (error) {
      this._logger.error('Failed to initialize MCP service', error as Error);
      throw error;
    }
  }

  /**
   * Initialize Swarm Orchestrator
   */
  private async initializeSwarmOrchestrator(): Promise<void> {
    try {
      this._logger.info('Initializing Swarm Orchestrator...');
      
      this._swarmOrchestrator = new SwarmOrchestrator(
        this._geminiService,
        this._a2aService,
        this._mcpService,
        this._logger
      );
      await this._swarmOrchestrator.initialize();
      
      this._disposables.push(this._swarmOrchestrator);
      this._logger.info('Swarm Orchestrator initialized successfully');
    } catch (error) {
      this._logger.error('Failed to initialize Swarm Orchestrator', error as Error);
      throw error;
    }
  }

  /**
   * Setup configuration watcher
   */
  private setupConfigurationWatcher(): void {
    const watcher = vscode.workspace.onDidChangeConfiguration(async (event) => {
      if (event.affectsConfiguration('gemini-flow')) {
        this._logger.info('Configuration changed, reloading...');
        
        try {
          await this._configManager.loadConfiguration();
          const config = this._configManager.getConfiguration();

          // Update authentication if API key changed
          if (event.affectsConfiguration('gemini-flow.apiKey')) {
            await this._authService.authenticate();
            this._state.isAuthenticated = await this._authService.isAuthenticated();
          }

          // Update model if changed
          if (event.affectsConfiguration('gemini-flow.model')) {
            this._state.currentModel = config.model;
            await this._geminiService.updateModel(config.model);
          }

          // Handle protocol service changes
          if (event.affectsConfiguration('gemini-flow.a2a.enabled')) {
            if (config.a2a.enabled && !this._a2aService) {
              await this.initializeA2AService();
            } else if (!config.a2a.enabled && this._a2aService) {
              this._a2aService.dispose();
              this._a2aService = undefined;
            }
          }

          if (event.affectsConfiguration('gemini-flow.mcp.enabled')) {
            if (config.mcp.enabled && !this._mcpService) {
              await this.initializeMCPService();
            } else if (!config.mcp.enabled && this._mcpService) {
              this._mcpService.dispose();
              this._mcpService = undefined;
            }
          }

          if (event.affectsConfiguration('gemini-flow.swarm.enabled')) {
            if (config.swarm.enabled && !this._swarmOrchestrator) {
              await this.initializeSwarmOrchestrator();
            } else if (!config.swarm.enabled && this._swarmOrchestrator) {
              this._swarmOrchestrator.dispose();
              this._swarmOrchestrator = undefined;
            }
          }

          // Update status bar
          await this.checkConfiguration();

        } catch (error) {
          this._logger.error('Failed to reload configuration', error as Error);
          vscode.window.showErrorMessage(`Failed to reload Gemini Flow configuration: ${error}`);
        }
      }
    });

    this._disposables.push(watcher);
  }

  // Getters for services (used by commands and providers)
  get context(): vscode.ExtensionContext { return this._context; }
  get logger(): Logger { return this._logger; }
  get state(): ExtensionState { return this._state; }
  get configManager(): ConfigurationManager { return this._configManager; }
  get authService(): AuthenticationService { return this._authService; }
  get geminiService(): GeminiService { return this._geminiService; }
  get contextGatherer(): ContextGatherer { return this._contextGatherer; }
  get a2aService(): A2AService | undefined { return this._a2aService; }
  get mcpService(): MCPService | undefined { return this._mcpService; }
  get swarmOrchestrator(): SwarmOrchestrator | undefined { return this._swarmOrchestrator; }
  get statusBarManager(): StatusBarManager { return this._statusBarManager; }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this._logger.info('Disposing Gemini Flow extension...');
    
    // Dispose all services
    this._disposables.forEach(disposable => {
      try {
        disposable.dispose();
      } catch (error) {
        this._logger.error('Error disposing resource', error as Error);
      }
    });

    this._disposables.length = 0;
    this._state.isActivated = false;
    
    this._logger.info('Gemini Flow extension disposed');
  }
}