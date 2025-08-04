# IDE Integration Architecture

## Overview

This document outlines the comprehensive architecture for integrating gemini-flow with IDEs, focusing on VSCode extension, authentication systems, and A2A/MCP protocol integration. The design leverages the existing dual-mode architecture to provide seamless IDE-native experiences.

## 1. VSCode Extension Architecture

### 1.1 Extension Manifest Structure

```json
{
  "name": "gemini-flow-ide",
  "displayName": "Gemini Flow - AI Development Assistant",
  "description": "Comprehensive AI-powered development platform with multi-agent orchestration",
  "version": "1.0.0",
  "publisher": "gemini-flow",
  "engines": {
    "vscode": "^1.85.0"
  },
  "categories": [
    "AI",
    "Machine Learning",
    "Productivity",
    "Other"
  ],
  "keywords": [
    "ai",
    "gemini",
    "vertex-ai",
    "code-generation",
    "multi-agent",
    "orchestration"
  ],
  "main": "./out/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "gemini-flow.initialize",
        "title": "Initialize Gemini Flow",
        "category": "Gemini Flow"
      },
      {
        "command": "gemini-flow.authenticate",
        "title": "Authenticate with Google AI",
        "category": "Gemini Flow"
      },
      {
        "command": "gemini-flow.chat",
        "title": "Open AI Chat",
        "category": "Gemini Flow",
        "icon": "$(comment-discussion)"
      },
      {
        "command": "gemini-flow.analyze-code",
        "title": "Analyze Code",
        "category": "Gemini Flow",
        "icon": "$(search)"
      },
      {
        "command": "gemini-flow.generate-code",
        "title": "Generate Code",
        "category": "Gemini Flow",
        "icon": "$(wand)"
      },
      {
        "command": "gemini-flow.refactor",
        "title": "Refactor Code",
        "category": "Gemini Flow",
        "icon": "$(tools)"
      },
      {
        "command": "gemini-flow.swarm-orchestrate",
        "title": "Orchestrate Multi-Agent Task",
        "category": "Gemini Flow",
        "icon": "$(organization)"
      },
      {
        "command": "gemini-flow.memory-search",
        "title": "Search Memory Bank",
        "category": "Gemini Flow",
        "icon": "$(database)"
      },
      {
        "command": "gemini-flow.workspace-sync",
        "title": "Sync with Google Workspace",
        "category": "Gemini Flow",
        "icon": "$(sync)"
      },
      {
        "command": "gemini-flow.settings",
        "title": "Open Settings",
        "category": "Gemini Flow",
        "icon": "$(settings-gear)"
      }
    ],
    "menus": {
      "editor/context": [
        {
          "submenu": "gemini-flow.context",
          "group": "1_modification@1"
        }
      ],
      "gemini-flow.context": [
        {
          "command": "gemini-flow.analyze-code",
          "when": "editorHasSelection",
          "group": "analysis@1"
        },
        {
          "command": "gemini-flow.generate-code",
          "group": "generation@1"
        },
        {
          "command": "gemini-flow.refactor",
          "when": "editorHasSelection",
          "group": "transformation@1"
        }
      ],
      "explorer/context": [
        {
          "command": "gemini-flow.analyze-code",
          "when": "resourceExtname in gemini-flow.supportedFiles",
          "group": "gemini-flow@1"
        }
      ],
      "commandPalette": [
        {
          "command": "gemini-flow.chat",
          "when": "gemini-flow.authenticated"
        },
        {
          "command": "gemini-flow.swarm-orchestrate",
          "when": "gemini-flow.authenticated && gemini-flow.enterpriseMode"
        }
      ]
    },
    "submenus": [
      {
        "id": "gemini-flow.context",
        "label": "Gemini Flow"
      }
    ],
    "viewsContainers": {
      "activitybar": [
        {
          "id": "gemini-flow-sidebar",
          "title": "Gemini Flow",
          "icon": "$(sparkle)"
        }
      ],
      "panel": [
        {
          "id": "gemini-flow-panel",
          "title": "Gemini Flow Console",
          "icon": "$(terminal)"
        }
      ]
    },
    "views": {
      "gemini-flow-sidebar": [
        {
          "id": "gemini-flow.chat",
          "name": "AI Chat",
          "when": "gemini-flow.authenticated"
        },
        {
          "id": "gemini-flow.agents",
          "name": "Active Agents",
          "when": "gemini-flow.authenticated && gemini-flow.enterpriseMode"
        },
        {
          "id": "gemini-flow.memory",
          "name": "Memory Bank", 
          "when": "gemini-flow.authenticated"
        },
        {
          "id": "gemini-flow.workspace",
          "name": "Workspace Integration",
          "when": "gemini-flow.authenticated && gemini-flow.workspaceEnabled"
        }
      ],
      "gemini-flow-panel": [
        {
          "id": "gemini-flow.console",
          "name": "Console",
          "when": "gemini-flow.authenticated"
        },
        {
          "id": "gemini-flow.performance",
          "name": "Performance",
          "when": "gemini-flow.authenticated && gemini-flow.enterpriseMode"
        }
      ]
    },
    "configuration": {
      "title": "Gemini Flow",
      "properties": {
        "gemini-flow.mode": {
          "type": "string",
          "enum": ["lightweight", "enterprise", "full"],
          "default": "lightweight",
          "description": "Operating mode for Gemini Flow"
        },
        "gemini-flow.authentication.provider": {
          "type": "string",
          "enum": ["google-ai", "vertex-ai", "both"],
          "default": "google-ai",
          "description": "Authentication provider preference"
        },
        "gemini-flow.features.enableSwarm": {
          "type": "boolean",
          "default": false,
          "description": "Enable multi-agent swarm orchestration"
        },
        "gemini-flow.features.enableMemoryBank": {
          "type": "boolean", 
          "default": true,
          "description": "Enable persistent memory bank"
        },
        "gemini-flow.features.enableWorkspaceSync": {
          "type": "boolean",
          "default": false,
          "description": "Enable Google Workspace synchronization"
        },
        "gemini-flow.ui.showPerformanceMetrics": {
          "type": "boolean",
          "default": false,
          "description": "Show performance metrics in status bar"
        },
        "gemini-flow.security.validateSignatures": {
          "type": "boolean",
          "default": true,
          "description": "Validate A2A message signatures"
        }
      }
    },
    "keybindings": [
      {
        "command": "gemini-flow.chat",
        "key": "ctrl+alt+g",
        "mac": "cmd+alt+g",
        "when": "gemini-flow.authenticated"
      },
      {
        "command": "gemini-flow.analyze-code",
        "key": "ctrl+alt+a",
        "mac": "cmd+alt+a",
        "when": "editorHasSelection && gemini-flow.authenticated"
      },
      {
        "command": "gemini-flow.generate-code",
        "key": "ctrl+alt+shift+g",
        "mac": "cmd+alt+shift+g",
        "when": "gemini-flow.authenticated"
      }
    ]
  },
  "activationEvents": [
    "onStartupFinished",
    "onCommand:gemini-flow.initialize"
  ],
  "dependencies": {
    "@clduab11/gemini-flow": "^1.1.0",
    "@google/generative-ai": "^0.15.0",
    "vscode-languageclient": "^9.0.1"
  },
  "optionalDependencies": {
    "@google-cloud/vertexai": "^1.0.0",
    "googleapis": "^126.0.1",
    "better-sqlite3": "^9.0.0"
  }
}
```

### 1.2 Extension Entry Point Architecture

```typescript
// src/extension/extension.ts
import * as vscode from 'vscode';
import { ExtensionManager } from './core/extension-manager';
import { AuthenticationProvider } from './auth/authentication-provider';
import { A2AMCPBridge } from './protocols/a2a-mcp-bridge';
import { UIManager } from './ui/ui-manager';
import { ConfigurationManager } from './config/configuration-manager';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  try {
    // Initialize configuration
    const configManager = new ConfigurationManager(context);
    await configManager.initialize();

    // Initialize authentication
    const authProvider = new AuthenticationProvider(context, configManager);
    await authProvider.initialize();

    // Initialize protocol bridge
    const protocolBridge = new A2AMCPBridge(context, authProvider);
    await protocolBridge.initialize();

    // Initialize UI components
    const uiManager = new UIManager(context, authProvider, protocolBridge);
    await uiManager.initialize();

    // Initialize extension manager (orchestrates all components)
    const extensionManager = new ExtensionManager(
      context,
      configManager,
      authProvider,
      protocolBridge,
      uiManager
    );
    
    await extensionManager.activate();

    // Store in global state for deactivation
    context.globalState.update('extensionManager', extensionManager);

  } catch (error) {
    vscode.window.showErrorMessage(`Failed to activate Gemini Flow: ${error}`);
    throw error;
  }
}

export async function deactivate(): Promise<void> {
  const extensionManager = vscode.workspace
    .getConfiguration()
    .get('extensionManager') as ExtensionManager;
    
  if (extensionManager) {
    await extensionManager.deactivate();
  }
}
```

### 1.3 Command Palette Integration

```typescript
// src/extension/commands/command-registry.ts
import * as vscode from 'vscode';
import { AuthenticationProvider } from '../auth/authentication-provider';
import { A2AMCPBridge } from '../protocols/a2a-mcp-bridge';

export class CommandRegistry {
  private commands: Map<string, vscode.Disposable> = new Map();

  constructor(
    private context: vscode.ExtensionContext,
    private authProvider: AuthenticationProvider,
    private protocolBridge: A2AMCPBridge
  ) {}

  registerCommands(): void {
    // Core commands
    this.registerCommand('gemini-flow.initialize', this.initializeFlow.bind(this));
    this.registerCommand('gemini-flow.authenticate', this.authenticate.bind(this));
    this.registerCommand('gemini-flow.chat', this.openChat.bind(this));
    
    // Analysis commands
    this.registerCommand('gemini-flow.analyze-code', this.analyzeCode.bind(this));
    this.registerCommand('gemini-flow.generate-code', this.generateCode.bind(this));
    this.registerCommand('gemini-flow.refactor', this.refactorCode.bind(this));
    
    // Enterprise commands
    this.registerCommand('gemini-flow.swarm-orchestrate', this.orchestrateSwarm.bind(this));
    this.registerCommand('gemini-flow.memory-search', this.searchMemory.bind(this));
    this.registerCommand('gemini-flow.workspace-sync', this.syncWorkspace.bind(this));
    
    // Utility commands
    this.registerCommand('gemini-flow.settings', this.openSettings.bind(this));
  }

  private registerCommand(commandId: string, callback: (...args: any[]) => any): void {
    const disposable = vscode.commands.registerCommand(commandId, callback);
    this.commands.set(commandId, disposable);
    this.context.subscriptions.push(disposable);
  }

  private async initializeFlow(): Promise<void> {
    try {
      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Initializing Gemini Flow...",
        cancellable: false
      }, async (progress) => {
        progress.report({ increment: 0, message: "Setting up core components..." });
        
        // Initialize gemini-flow core
        await this.protocolBridge.initializeCore();
        progress.report({ increment: 50, message: "Detecting features..." });
        
        // Auto-detect available features
        await this.protocolBridge.detectFeatures();
        progress.report({ increment: 100, message: "Ready!" });
      });

      vscode.window.showInformationMessage("Gemini Flow initialized successfully!");
      await vscode.commands.executeCommand('setContext', 'gemini-flow.initialized', true);
      
    } catch (error) {
      vscode.window.showErrorMessage(`Initialization failed: ${error}`);
    }
  }

  private async authenticate(): Promise<void> {
    try {
      const provider = await this.selectAuthProvider();
      const result = await this.authProvider.authenticate(provider);
      
      if (result.success) {
        vscode.window.showInformationMessage(
          `Authenticated successfully as ${result.profile?.tier} user`
        );
        await vscode.commands.executeCommand('setContext', 'gemini-flow.authenticated', true);
        await vscode.commands.executeCommand('setContext', 'gemini-flow.userTier', result.profile?.tier);
      }
    } catch (error) {
      vscode.window.showErrorMessage(`Authentication failed: ${error}`);
    }
  }

  private async selectAuthProvider(): Promise<'google-ai' | 'vertex-ai'> {
    const options = [
      { label: 'Google AI Studio', value: 'google-ai' as const },
      { label: 'Vertex AI (Enterprise)', value: 'vertex-ai' as const }
    ];

    const selected = await vscode.window.showQuickPick(options, {
      placeHolder: 'Select authentication provider'
    });

    return selected?.value || 'google-ai';
  }

  private async openChat(): Promise<void> {
    // Implementation handled by UI Manager
    await vscode.commands.executeCommand('gemini-flow.ui.showChat');
  }

  private async analyzeCode(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('No active editor found');
      return;
    }

    const selection = editor.selection;
    const code = editor.document.getText(selection.isEmpty ? undefined : selection);
    
    try {
      const analysis = await this.protocolBridge.executeCommand('analyze', {
        code,
        language: editor.document.languageId,
        context: {
          filePath: editor.document.fileName,
          projectPath: vscode.workspace.workspaceFolders?.[0].uri.fsPath
        }
      });

      await this.showAnalysisResults(analysis);
    } catch (error) {
      vscode.window.showErrorMessage(`Code analysis failed: ${error}`);
    }
  }

  private async generateCode(): Promise<void> {
    const prompt = await vscode.window.showInputBox({
      prompt: 'Describe the code you want to generate',
      placeHolder: 'e.g., Create a React component for user authentication'
    });

    if (!prompt) return;

    const editor = vscode.window.activeTextEditor;
    const language = editor?.document.languageId || 'typescript';
    
    try {
      const generated = await this.protocolBridge.executeCommand('generate', {
        prompt,
        language,
        context: {
          projectType: await this.detectProjectType(),
          dependencies: await this.getDependencies()
        }
      });

      await this.insertGeneratedCode(generated.code, editor);
    } catch (error) {
      vscode.window.showErrorMessage(`Code generation failed: ${error}`);
    }
  }

  private async orchestrateSwarm(): Promise<void> {
    const task = await vscode.window.showInputBox({
      prompt: 'Describe the multi-agent task to orchestrate',
      placeHolder: 'e.g., Analyze codebase, generate documentation, and create tests'
    });

    if (!task) return;

    try {
      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Orchestrating multi-agent task...",
        cancellable: true
      }, async (progress, token) => {
        const result = await this.protocolBridge.orchestrateTask(task, {
          onProgress: (update) => {
            progress.report({
              increment: update.percentage,
              message: update.message
            });
          },
          cancellationToken: token
        });

        await this.showSwarmResults(result);
      });
    } catch (error) {
      vscode.window.showErrorMessage(`Swarm orchestration failed: ${error}`);
    }
  }

  // Helper methods
  private async showAnalysisResults(analysis: any): Promise<void> {
    // Implementation for showing analysis results in a webview
  }

  private async insertGeneratedCode(code: string, editor?: vscode.TextEditor): Promise<void> {
    // Implementation for inserting generated code
  }

  private async detectProjectType(): Promise<string> {
    // Implementation for detecting project type
    return 'typescript';
  }

  private async getDependencies(): Promise<string[]> {
    // Implementation for getting project dependencies
    return [];
  }

  private async showSwarmResults(result: any): Promise<void> {
    // Implementation for showing swarm orchestration results
  }

  dispose(): void {
    this.commands.forEach(disposable => disposable.dispose());
    this.commands.clear();
  }
}
```

### 1.4 Context Menu Integration

```typescript
// src/extension/ui/context-menu-provider.ts
import * as vscode from 'vscode';

export class ContextMenuProvider {
  constructor(
    private context: vscode.ExtensionContext,
    private protocolBridge: A2AMCPBridge
  ) {}

  registerContextMenus(): void {
    // Register context-aware menu items
    this.registerCodeAnalysisMenu();
    this.registerFileExplorerMenu();
    this.registerEditorMenu();
  }

  private registerCodeAnalysisMenu(): void {
    const analyzeCommand = vscode.commands.registerCommand(
      'gemini-flow.context.analyze-selection',
      async (uri: vscode.Uri, selections: vscode.Selection[]) => {
        // Handle context menu analysis for selected code
        await this.analyzeContextSelection(uri, selections);
      }
    );

    this.context.subscriptions.push(analyzeCommand);
  }

  private registerFileExplorerMenu(): void {
    const analyzeFileCommand = vscode.commands.registerCommand(
      'gemini-flow.context.analyze-file',
      async (uri: vscode.Uri) => {
        // Handle file analysis from explorer context menu
        await this.analyzeFile(uri);
      }
    );

    this.context.subscriptions.push(analyzeFileCommand);
  }

  private async analyzeContextSelection(uri: vscode.Uri, selections: vscode.Selection[]): Promise<void> {
    // Implementation for context-aware code analysis
  }

  private async analyzeFile(uri: vscode.Uri): Promise<void> {
    // Implementation for file analysis
  }
}
```

### 1.5 Sidebar UI Components

```typescript
// src/extension/ui/sidebar/chat-view-provider.ts
import * as vscode from 'vscode';

export class ChatViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'gemini-flow.chat';
  private _view?: vscode.WebviewView;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly protocolBridge: A2AMCPBridge
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        this._extensionUri
      ]
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Handle messages from webview
    webviewView.webview.onDidReceiveMessage(
      async (data) => {
        switch (data.type) {
          case 'sendMessage':
            await this.handleChatMessage(data.message);
            break;
          case 'clearChat':
            await this.clearChatHistory();
            break;
        }
      },
      undefined,
      []
    );
  }

  private async handleChatMessage(message: string): Promise<void> {
    try {
      const response = await this.protocolBridge.executeCommand('chat', {
        message,
        context: await this.getCurrentContext()
      });

      this._view?.webview.postMessage({
        type: 'chatResponse',
        response: response.content
      });
    } catch (error) {
      this._view?.webview.postMessage({
        type: 'error',
        error: error.message
      });
    }
  }

  private async getCurrentContext(): Promise<any> {
    const editor = vscode.window.activeTextEditor;
    return {
      activeFile: editor?.document.fileName,
      language: editor?.document.languageId,
      workspace: vscode.workspace.workspaceFolders?.[0].uri.fsPath
    };
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    // Return HTML for chat interface
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Gemini Flow Chat</title>
        <style>
          /* Chat interface styles */
        </style>
      </head>
      <body>
        <div id="chat-container">
          <div id="messages"></div>
          <div id="input-container">
            <input type="text" id="message-input" placeholder="Ask me anything...">
            <button id="send-button">Send</button>
          </div>
        </div>
        <script>
          // Chat interface JavaScript
        </script>
      </body>
      </html>
    `;
  }
}
```

## 1.6 Panel UI Components

```typescript
// src/extension/ui/panels/console-panel-provider.ts
export class ConsolePanelProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'gemini-flow.console';
  
  // Console implementation for showing execution logs,
  // A2A message traces, and performance metrics
}

// src/extension/ui/panels/performance-panel-provider.ts
export class PerformancePanelProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'gemini-flow.performance';
  
  // Performance dashboard showing:
  // - Agent utilization
  // - Message throughput
  // - Response times
  // - Resource usage
}
```

This VSCode extension architecture provides:

1. **Comprehensive Command Integration**: Full command palette support with context-aware commands
2. **Rich UI Components**: Sidebar views for chat, agents, memory, and workspace integration
3. **Context Menu Integration**: Right-click options for code analysis and generation
4. **Configuration Management**: Extensive settings for different operational modes
5. **Progressive Enhancement**: Features activate based on authentication and available capabilities
6. **Performance Monitoring**: Built-in panels for monitoring system performance

The architecture is designed to work seamlessly with the existing dual-mode system, enabling lightweight operation by default while unlocking enterprise features when authenticated and configured.

## 2. Authentication Architecture

### 2.1 Enhanced OAuth2 Flow Implementation

Building on the existing `AuthenticationManager`, the IDE integration extends authentication with VSCode-specific flows:

```typescript
// src/extension/auth/authentication-provider.ts
import * as vscode from 'vscode';
import { AuthenticationManager, UserProfile, AuthConfig } from '@clduab11/gemini-flow';

export interface IDEAuthConfig extends AuthConfig {
  vscode: {
    secretStorage: vscode.SecretStorage;
    globalState: vscode.Memento;
    extensionUri: vscode.Uri;
  };
  ide: {
    enableDeviceFlow: boolean;
    enableBrowserFlow: boolean;
    enableServiceAccountFlow: boolean;
    autoRefresh: boolean;
    secureTokenStorage: boolean;
  };
}

export class AuthenticationProvider extends vscode.Disposable {
  private authManager: AuthenticationManager;
  private authenticationSession?: vscode.AuthenticationSession;
  private tokenRefreshTimer?: NodeJS.Timeout;
  private readonly AUTH_PROVIDER_ID = 'gemini-flow-auth';
  
  constructor(
    private context: vscode.ExtensionContext,
    private configManager: ConfigurationManager
  ) {
    super(() => this.dispose());
    
    const authConfig: IDEAuthConfig = {
      ...this.configManager.getAuthConfig(),
      vscode: {
        secretStorage: context.secrets,
        globalState: context.globalState,
        extensionUri: context.extensionUri
      },
      ide: {
        enableDeviceFlow: true,
        enableBrowserFlow: true,
        enableServiceAccountFlow: false,
        autoRefresh: true,
        secureTokenStorage: true
      }
    };

    this.authManager = new AuthenticationManager(authConfig);
    this.registerAuthenticationProvider();
  }

  async initialize(): Promise<void> {
    try {
      // Initialize the base authentication manager
      await this.authManager.initialize();
      
      // Check for existing stored session
      await this.restoreAuthenticationSession();
      
      // Set up auto-refresh if enabled
      if (this.configManager.getAuthConfig().ide?.autoRefresh) {
        this.setupTokenRefresh();
      }

      vscode.window.showInformationMessage('Authentication provider initialized');
    } catch (error) {
      vscode.window.showErrorMessage(`Auth initialization failed: ${error}`);
      throw error;
    }
  }

  /**
   * Register as VSCode authentication provider
   */
  private registerAuthenticationProvider(): void {
    const authProvider: vscode.AuthenticationProvider = {
      onDidChangeSessions: this.onDidChangeSessions.bind(this),
      getSessions: this.getSessions.bind(this),
      createSession: this.createSession.bind(this),
      removeSession: this.removeSession.bind(this)
    };

    this.context.subscriptions.push(
      vscode.authentication.registerAuthenticationProvider(
        this.AUTH_PROVIDER_ID,
        'Gemini Flow',
        authProvider,
        { supportsMultipleAccounts: false }
      )
    );
  }

  /**
   * Authenticate with selected provider
   */
  async authenticate(provider: 'google-ai' | 'vertex-ai' = 'google-ai'): Promise<{
    success: boolean;
    profile?: UserProfile;
    error?: string;
  }> {
    try {
      // Show authentication flow selection
      const flowType = await this.selectAuthenticationFlow();
      
      let profile: UserProfile;
      
      switch (flowType) {
        case 'browser':
          profile = await this.authenticateWithBrowser(provider);
          break;
        case 'device':
          profile = await this.authenticateWithDeviceFlow(provider);
          break;
        case 'service-account':
          profile = await this.authenticateWithServiceAccount(provider);
          break;
        default:
          throw new Error('Invalid authentication flow selected');
      }

      // Store authentication session
      await this.storeAuthenticationSession(profile, provider);
      
      // Set context variables
      await this.updateAuthenticationContext(profile);
      
      // Fire authentication event
      this._onDidChangeSessions.fire({
        added: [await this.createVSCodeSession(profile)],
        removed: [],
        changed: []
      });

      return { success: true, profile };

    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Browser-based OAuth2 flow
   */
  private async authenticateWithBrowser(provider: 'google-ai' | 'vertex-ai'): Promise<UserProfile> {
    return await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: "Authenticating with Google...",
      cancellable: true
    }, async (progress, token) => {
      
      progress.report({ increment: 0, message: "Opening browser..." });

      // Generate authentication URL
      const authUrl = this.authManager.generateAuthUrl(provider);
      
      // Open browser
      await vscode.env.openExternal(vscode.Uri.parse(authUrl));
      
      progress.report({ increment: 30, message: "Waiting for authorization..." });

      // Start local server to capture callback
      const authCode = await this.captureAuthorizationCode(token);
      
      progress.report({ increment: 70, message: "Exchanging authorization code..." });

      // Exchange code for tokens and user profile
      const profile = await this.authManager.authenticateUser(authCode);
      
      progress.report({ increment: 100, message: "Authentication complete!" });

      return profile;
    });
  }

  /**
   * Device flow authentication for secure environments
   */
  private async authenticateWithDeviceFlow(provider: 'google-ai' | 'vertex-ai'): Promise<UserProfile> {
    return await vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: "Device Flow Authentication",
      cancellable: true
    }, async (progress, token) => {
      
      // Initiate device flow
      const deviceFlowResponse = await this.initiateDeviceFlow(provider);
      
      // Show user code
      const action = await vscode.window.showInformationMessage(
        `Go to ${deviceFlowResponse.verificationUri} and enter code: ${deviceFlowResponse.userCode}`,
        'Copy Code',
        'Open Browser',
        'Cancel'
      );

      if (action === 'Copy Code') {
        await vscode.env.clipboard.writeText(deviceFlowResponse.userCode);
      } else if (action === 'Open Browser') {
        await vscode.env.openExternal(vscode.Uri.parse(deviceFlowResponse.verificationUri));
      } else if (action === 'Cancel') {
        throw new Error('Authentication cancelled by user');
      }

      // Poll for completion
      progress.report({ increment: 0, message: "Waiting for device authorization..." });
      
      const profile = await this.pollDeviceFlow(deviceFlowResponse.deviceCode, token, progress);
      
      return profile;
    });
  }

  /**
   * Service account authentication for enterprise environments
   */
  private async authenticateWithServiceAccount(provider: 'google-ai' | 'vertex-ai'): Promise<UserProfile> {
    // Get service account path from configuration or file picker
    const serviceAccountPath = await this.getServiceAccountPath();
    
    if (!serviceAccountPath) {
      throw new Error('Service account file is required for this authentication method');
    }

    // Use the existing auth manager's service account functionality
    const serviceAccountAuth = await this.authManager.getServiceAccountAuth();
    
    // Create a synthetic user profile for service account
    const profile: UserProfile = {
      id: 'service-account',
      email: 'service-account@project.iam.gserviceaccount.com',
      name: 'Service Account',
      tier: 'enterprise', // Service accounts get enterprise tier
      permissions: [
        'read', 'basic_ai', 'advanced_ai', 'batch_processing',
        'enterprise_security', 'vertex_ai_access'
      ],
      quotas: { daily: -1, monthly: -1, concurrent: 100 },
      metadata: {
        createdAt: new Date(),
        lastActive: new Date(),
        totalRequests: 0,
        tierDetection: {
          method: 'service-account',
          confidence: 1.0,
          detectedAt: new Date(),
          features: ['service-account-auth']
        }
      }
    };

    return profile;
  }

  /**
   * Select authentication flow based on environment and preferences
   */
  private async selectAuthenticationFlow(): Promise<'browser' | 'device' | 'service-account'> {
    const config = this.configManager.getAuthConfig().ide;
    
    const options: vscode.QuickPickItem[] = [];
    
    if (config?.enableBrowserFlow) {
      options.push({
        label: 'Browser Authentication',
        description: 'Open browser for OAuth2 flow',
        detail: 'Recommended for most users'
      });
    }
    
    if (config?.enableDeviceFlow) {
      options.push({
        label: 'Device Flow',
        description: 'Use device code for secure environments',
        detail: 'For headless or restricted environments'
      });
    }
    
    if (config?.enableServiceAccountFlow) {
      options.push({
        label: 'Service Account',
        description: 'Use service account credentials',
        detail: 'For enterprise/CI environments'
      });
    }

    const selected = await vscode.window.showQuickPick(options, {
      placeHolder: 'Select authentication method'
    });

    if (!selected) {
      throw new Error('No authentication method selected');
    }

    switch (selected.label) {
      case 'Browser Authentication': return 'browser';
      case 'Device Flow': return 'device';
      case 'Service Account': return 'service-account';
      default: return 'browser';
    }
  }

  // VSCode Authentication Provider implementation
  private readonly _onDidChangeSessions = new vscode.EventEmitter<vscode.AuthenticationProviderAuthenticationSessionsChangeEvent>();
  readonly onDidChangeSessions = this._onDidChangeSessions.event;

  async getSessions(scopes?: string[]): Promise<vscode.AuthenticationSession[]> {
    if (this.authenticationSession) {
      return [this.authenticationSession];
    }
    return [];
  }

  async createSession(scopes: string[]): Promise<vscode.AuthenticationSession> {
    const result = await this.authenticate();
    if (!result.success || !result.profile) {
      throw new Error(result.error || 'Authentication failed');
    }
    
    return this.createVSCodeSession(result.profile);
  }

  async removeSession(sessionId: string): Promise<void> {
    if (this.authenticationSession?.id === sessionId) {
      await this.signOut();
    }
  }

  /**
   * Sign out and clear stored credentials
   */
  async signOut(): Promise<void> {
    try {
      // Clear stored tokens
      await this.context.secrets.delete('gemini-flow-tokens');
      await this.context.globalState.update('gemini-flow-profile', undefined);
      
      // Clear timer
      if (this.tokenRefreshTimer) {
        clearTimeout(this.tokenRefreshTimer);
        this.tokenRefreshTimer = undefined;
      }

      // Fire session change event
      if (this.authenticationSession) {
        this._onDidChangeSessions.fire({
          added: [],
          removed: [this.authenticationSession],
          changed: []
        });
      }

      this.authenticationSession = undefined;
      
      // Update context
      await vscode.commands.executeCommand('setContext', 'gemini-flow.authenticated', false);
      await vscode.commands.executeCommand('setContext', 'gemini-flow.userTier', undefined);

      vscode.window.showInformationMessage('Signed out successfully');
      
    } catch (error) {
      vscode.window.showErrorMessage(`Sign out failed: ${error}`);
    }
  }

  // Helper methods
  private async createVSCodeSession(profile: UserProfile): Promise<vscode.AuthenticationSession> {
    return {
      id: profile.id,
      accessToken: 'vscode-session-token', // This would be the actual token
      account: {
        id: profile.id,
        label: profile.name
      },
      scopes: profile.permissions
    };
  }

  private async storeAuthenticationSession(profile: UserProfile, provider: string): Promise<void> {
    if (this.configManager.getAuthConfig().ide?.secureTokenStorage) {
      await this.context.secrets.store('gemini-flow-tokens', JSON.stringify({
        profile,
        provider,
        timestamp: Date.now()
      }));
    }
    
    await this.context.globalState.update('gemini-flow-profile', profile);
    this.authenticationSession = await this.createVSCodeSession(profile);
  }

  private async restoreAuthenticationSession(): Promise<void> {
    try {
      const storedTokens = await this.context.secrets.get('gemini-flow-tokens');
      if (storedTokens) {
        const { profile, provider } = JSON.parse(storedTokens);
        this.authenticationSession = await this.createVSCodeSession(profile);
        await this.updateAuthenticationContext(profile);
      }
    } catch (error) {
      // Ignore errors during restore - user will need to re-authenticate
    }
  }

  private async updateAuthenticationContext(profile: UserProfile): Promise<void> {
    await vscode.commands.executeCommand('setContext', 'gemini-flow.authenticated', true);
    await vscode.commands.executeCommand('setContext', 'gemini-flow.userTier', profile.tier);
    await vscode.commands.executeCommand('setContext', 'gemini-flow.enterpriseMode', 
      profile.tier === 'enterprise' || profile.tier === 'ultra');
    await vscode.commands.executeCommand('setContext', 'gemini-flow.workspaceEnabled',
      profile.permissions.includes('google_workspace'));
  }

  private setupTokenRefresh(): void {
    // Set up periodic token refresh (every 30 minutes)
    this.tokenRefreshTimer = setInterval(async () => {
      try {
        await this.refreshTokens();
      } catch (error) {
        console.warn('Token refresh failed:', error);
      }
    }, 30 * 60 * 1000);
  }

  private async refreshTokens(): Promise<void> {
    // Implementation for token refresh
    // This would use the refresh token to get new access tokens
  }

  // Placeholder methods for OAuth2 flow implementation
  private async captureAuthorizationCode(token: vscode.CancellationToken): Promise<string> {
    // Implementation for capturing authorization code from callback
    return 'auth-code';
  }

  private async initiateDeviceFlow(provider: string): Promise<{
    deviceCode: string;
    userCode: string;
    verificationUri: string;
  }> {
    // Implementation for device flow initiation
    return {
      deviceCode: 'device-code',
      userCode: 'USER-CODE',
      verificationUri: 'https://accounts.google.com/device'
    };
  }

  private async pollDeviceFlow(
    deviceCode: string, 
    token: vscode.CancellationToken,
    progress: vscode.Progress<{ increment?: number; message?: string }>
  ): Promise<UserProfile> {
    // Implementation for polling device flow completion
    return {} as UserProfile;
  }

  private async getServiceAccountPath(): Promise<string | undefined> {
    const result = await vscode.window.showOpenDialog({
      canSelectFiles: true,
      canSelectFolders: false,
      canSelectMany: false,
      filters: {
        'Service Account': ['json']
      },
      title: 'Select Service Account JSON File'
    });

    return result?.[0].fsPath;
  }

  dispose(): void {
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer);
    }
    super.dispose();
  }
}
```

### 2.2 Token Storage and Management

```typescript
// src/extension/auth/token-manager.ts
import * as vscode from 'vscode';
import { UserProfile } from '@clduab11/gemini-flow';

interface TokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
  scopes: string[];
  provider: 'google-ai' | 'vertex-ai';
}

export class TokenManager {
  constructor(
    private secretStorage: vscode.SecretStorage,
    private memento: vscode.Memento
  ) {}

  async storeTokens(profile: UserProfile, tokens: TokenData): Promise<void> {
    // Store sensitive tokens in secure storage
    await this.secretStorage.store(`tokens:${profile.id}`, JSON.stringify({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt
    }));

    // Store non-sensitive metadata in memento
    await this.memento.update(`tokenMeta:${profile.id}`, {
      scopes: tokens.scopes,
      provider: tokens.provider,
      userId: profile.id,
      lastRefresh: Date.now()
    });
  }

  async getTokens(userId: string): Promise<TokenData | null> {
    try {
      const tokensJson = await this.secretStorage.get(`tokens:${userId}`);
      const tokenMeta = this.memento.get(`tokenMeta:${userId}`) as any;
      
      if (!tokensJson || !tokenMeta) {
        return null;
      }

      const tokens = JSON.parse(tokensJson);
      
      return {
        ...tokens,
        scopes: tokenMeta.scopes,
        provider: tokenMeta.provider
      };
    } catch (error) {
      return null;
    }
  }

  async refreshTokens(userId: string): Promise<TokenData | null> {
    const currentTokens = await this.getTokens(userId);
    if (!currentTokens?.refreshToken) {
      return null;
    }

    try {
      // Use OAuth2 client to refresh tokens
      const refreshedTokens = await this.performTokenRefresh(currentTokens.refreshToken);
      
      // Update stored tokens
      await this.storeTokens({ id: userId } as UserProfile, {
        ...currentTokens,
        ...refreshedTokens,
        expiresAt: Date.now() + (refreshedTokens.expiresIn * 1000)
      });

      return await this.getTokens(userId);
    } catch (error) {
      // Refresh failed - tokens may be invalid
      await this.clearTokens(userId);
      throw new Error('Token refresh failed - please re-authenticate');
    }
  }

  async clearTokens(userId: string): Promise<void> {
    await this.secretStorage.delete(`tokens:${userId}`);
    await this.memento.update(`tokenMeta:${userId}`, undefined);
  }

  private async performTokenRefresh(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresIn: number;
  }> {
    // Implementation for OAuth2 token refresh
    throw new Error('Not implemented');
  }
}
```

### 2.3 Credential Rotation Strategy

```typescript
// src/extension/auth/credential-rotation.ts
export class CredentialRotationManager {
  private rotationInterval: NodeJS.Timeout | null = null;
  private readonly ROTATION_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
  private readonly TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 5 minutes

  constructor(
    private tokenManager: TokenManager,
    private authProvider: AuthenticationProvider
  ) {}

  startRotation(): void {
    // Check token expiration every hour
    this.rotationInterval = setInterval(async () => {
      await this.checkAndRotateCredentials();
    }, 60 * 60 * 1000);
  }

  stopRotation(): void {
    if (this.rotationInterval) {
      clearInterval(this.rotationInterval);
      this.rotationInterval = null;
    }
  }

  private async checkAndRotateCredentials(): Promise<void> {
    try {
      const sessions = await this.authProvider.getSessions();
      
      for (const session of sessions) {
        const tokens = await this.tokenManager.getTokens(session.id);
        
        if (tokens && this.shouldRefreshToken(tokens)) {
          await this.tokenManager.refreshTokens(session.id);
        }
      }
    } catch (error) {
      console.error('Credential rotation failed:', error);
    }
  }

  private shouldRefreshToken(tokens: TokenData): boolean {
    const timeUntilExpiry = tokens.expiresAt - Date.now();
    return timeUntilExpiry <= this.TOKEN_REFRESH_THRESHOLD;
  }
}
```

### 2.4 Multi-Provider Support Architecture

```typescript
// src/extension/auth/multi-provider-manager.ts
export interface AuthProviderConfig {
  id: string;
  name: string;
  type: 'google-ai' | 'vertex-ai' | 'azure-openai' | 'aws-bedrock';
  endpoints: {
    auth: string;
    token: string;
    api: string;
  };
  scopes: string[];
  capabilities: string[];
}

export class MultiProviderManager {
  private providers: Map<string, AuthProviderConfig> = new Map();
  private activeProvider?: string;

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Google AI Studio
    this.providers.set('google-ai', {
      id: 'google-ai',
      name: 'Google AI Studio',
      type: 'google-ai',
      endpoints: {
        auth: 'https://accounts.google.com/oauth/v2/auth',
        token: 'https://oauth2.googleapis.com/token',
        api: 'https://generativelanguage.googleapis.com'
      },
      scopes: [
        'https://www.googleapis.com/auth/generative-language',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      capabilities: ['chat', 'generate', 'analyze']
    });

    // Vertex AI
    this.providers.set('vertex-ai', {
      id: 'vertex-ai',
      name: 'Google Cloud Vertex AI',
      type: 'vertex-ai',
      endpoints: {
        auth: 'https://accounts.google.com/oauth/v2/auth',
        token: 'https://oauth2.googleapis.com/token',
        api: 'https://aiplatform.googleapis.com'
      },
      scopes: [
        'https://www.googleapis.com/auth/cloud-platform',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      capabilities: ['chat', 'generate', 'analyze', 'enterprise', 'batch', 'custom-models']
    });
  }

  async selectProvider(): Promise<AuthProviderConfig> {
    const items = Array.from(this.providers.values()).map(provider => ({
      label: provider.name,
      description: provider.type,
      detail: `Capabilities: ${provider.capabilities.join(', ')}`,
      provider
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select AI provider'
    });

    if (!selected) {
      throw new Error('No provider selected');
    }

    this.activeProvider = selected.provider.id;
    return selected.provider;
  }

  getProvider(id: string): AuthProviderConfig | undefined {
    return this.providers.get(id);
  }

  getActiveProvider(): AuthProviderConfig | undefined {
    return this.activeProvider ? this.providers.get(this.activeProvider) : undefined;
  }
}
```

This authentication architecture provides:

1. **Comprehensive OAuth2 Support**: Full browser, device flow, and service account authentication
2. **Secure Token Management**: Encrypted storage with automatic refresh
3. **Multi-Provider Architecture**: Support for Google AI, Vertex AI, and extensible to other providers
4. **Credential Rotation**: Automatic token refresh and rotation strategies
5. **VSCode Integration**: Native authentication provider registration
6. **Enterprise Features**: Service account support for enterprise environments

The design leverages the existing `AuthenticationManager` while adding IDE-specific enhancements and VSCode-native integration patterns.

## 3. A2A/MCP Protocol Integration for IDE Commands

### 3.1 Protocol Handlers for IDE Commands

Building on the existing `A2AProtocolManager`, the IDE integration creates a bridge that translates VSCode commands into A2A protocol messages:

```typescript
// src/extension/protocols/a2a-mcp-bridge.ts
import * as vscode from 'vscode';
import { A2AProtocolManager, A2AMessage, A2AResponse } from '@clduab11/gemini-flow';
import { AuthenticationProvider } from '../auth/authentication-provider';

export interface IDECommandContext {
  editor?: vscode.TextEditor;
  selection?: vscode.Selection;
  workspaceFolder?: vscode.WorkspaceFolder;
  activeFile?: string;
  language?: string;
  projectType?: string;
}

export interface CommandExecutionOptions {
  timeout?: number;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  onProgress?: (update: { percentage: number; message: string }) => void;
  cancellationToken?: vscode.CancellationToken;
}

export class A2AMCPBridge extends vscode.Disposable {
  private protocolManager?: A2AProtocolManager;
  private mcpClient?: any; // MCP client when available
  private commandHandlers: Map<string, Function> = new Map();
  private isInitialized: boolean = false;

  constructor(
    private context: vscode.ExtensionContext,
    private authProvider: AuthenticationProvider
  ) {
    super(() => this.dispose());
    this.registerBuiltinHandlers();
  }

  async initialize(): Promise<void> {
    try {
      // Initialize A2A Protocol Manager if enterprise features are available
      if (await this.isEnterpriseModeEnabled()) {
        await this.initializeA2AProtocol();
      }

      // Initialize MCP client if available
      if (await this.isMCPAvailable()) {
        await this.initializeMCPClient();
      }

      this.isInitialized = true;
      vscode.window.showInformationMessage('Protocol bridge initialized');

    } catch (error) {
      vscode.window.showErrorMessage(`Protocol bridge initialization failed: ${error}`);
      throw error;
    }
  }

  /**
   * Execute a command using the most appropriate protocol
   */
  async executeCommand(
    command: string, 
    params: any, 
    options: CommandExecutionOptions = {}
  ): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Protocol bridge not initialized');
    }

    try {
      // Add IDE context to parameters
      const enrichedParams = await this.enrichWithIDEContext(params);

      // Determine best execution strategy
      const strategy = await this.selectExecutionStrategy(command, enrichedParams);

      // Execute command based on strategy
      switch (strategy.protocol) {
        case 'a2a':
          return await this.executeA2ACommand(command, enrichedParams, options);
        case 'mcp':
          return await this.executeMCPCommand(command, enrichedParams, options);
        case 'direct':
          return await this.executeDirectCommand(command, enrichedParams, options);
        default:
          throw new Error(`Unknown execution strategy: ${strategy.protocol}`);
      }

    } catch (error) {
      this.handleCommandError(command, error);
      throw error;
    }
  }

  /**
   * Orchestrate multi-agent task using A2A protocol
   */
  async orchestrateTask(
    taskDescription: string,
    options: CommandExecutionOptions = {}
  ): Promise<any> {
    if (!this.protocolManager) {
      throw new Error('A2A protocol not available - enterprise mode required');
    }

    try {
      // Create orchestration message
      const orchestrationMessage: A2AMessage = {
        jsonrpc: '2.0',
        method: 'task.orchestrate',
        params: {
          description: taskDescription,
          context: await this.getCurrentIDEContext(),
          constraints: {
            timeout: options.timeout || 300000, // 5 minutes default
            maxAgents: 5,
            requireApproval: false
          }
        },
        id: this.generateMessageId(),
        from: 'vscode-extension',
        to: 'orchestrator-agent',
        timestamp: Date.now(),
        messageType: 'request',
        priority: options.priority || 'normal'
      };

      // Send orchestration request
      const response = await this.protocolManager.sendMessage(orchestrationMessage);

      // Handle progress updates if callback provided
      if (options.onProgress && response.result?.taskId) {
        this.monitorTaskProgress(response.result.taskId, options.onProgress);
      }

      return response.result;

    } catch (error) {
      throw new Error(`Task orchestration failed: ${error}`);
    }
  }

  /**
   * Initialize core gemini-flow functionality
   */
  async initializeCore(): Promise<void> {
    try {
      // Import and initialize the core gemini-flow components
      const { LightweightCore } = await import('@clduab11/gemini-flow');
      
      const core = new LightweightCore({
        mode: await this.detectOperatingMode(),
        authProvider: this.authProvider,
        features: await this.detectEnabledFeatures()
      });

      await core.initialize();
      
      // Store reference for later use
      this.context.globalState.update('gemini-flow-core', core);

    } catch (error) {
      throw new Error(`Core initialization failed: ${error}`);
    }
  }

  /**
   * Auto-detect available features based on environment
   */
  async detectFeatures(): Promise<string[]> {
    const features: string[] = [];

    try {
      // Check for SQLite support
      try {
        await import('better-sqlite3');
        features.push('sqlite-memory');
      } catch {
        // SQLite not available
      }

      // Check for Google Cloud services
      try {
        await import('@google-cloud/vertexai');
        features.push('vertex-ai');
      } catch {
        // Vertex AI not available
      }

      // Check for Google APIs
      try {
        await import('googleapis');
        features.push('google-workspace');
      } catch {
        // Google APIs not available
      }

      // Check authentication status
      const sessions = await this.authProvider.getSessions();
      if (sessions.length > 0) {
        features.push('authenticated');
        
        const profile = await this.authProvider.getCurrentUserProfile();
        if (profile?.tier === 'enterprise' || profile?.tier === 'ultra') {
          features.push('enterprise-mode');
        }
      }

      return features;

    } catch (error) {
      console.warn('Feature detection failed:', error);
      return ['basic'];
    }
  }

  // Private implementation methods

  private async initializeA2AProtocol(): Promise<void> {
    try {
      const { A2AProtocolManager } = await import('@clduab11/gemini-flow');
      
      const config = {
        agentId: 'vscode-extension',
        agentCard: {
          id: 'vscode-extension',
          name: 'VSCode Extension',
          type: 'ide-client',
          capabilities: [
            'code-analysis',
            'code-generation', 
            'file-operations',
            'workspace-integration'
          ],
          version: this.context.extension.packageJSON.version,
          description: 'Gemini Flow IDE Integration'
        },
        transports: [
          {
            protocol: 'websocket',
            endpoint: 'ws://localhost:8080/a2a',
            options: { reconnect: true }
          }
        ],
        defaultTransport: 'websocket',
        securityEnabled: true,
        messageTimeout: 30000,
        maxConcurrentMessages: 10
      };

      this.protocolManager = new A2AProtocolManager(config);
      await this.protocolManager.initialize();

      // Register IDE-specific message handlers
      await this.registerIDEMessageHandlers();

    } catch (error) {
      console.warn('A2A protocol initialization failed:', error);
      // Continue without A2A - graceful degradation
    }
  }

  private async initializeMCPClient(): Promise<void> {
    try {
      // Initialize MCP client for tool integration
      const { MCPClient } = await import('@modelcontextprotocol/sdk');
      
      this.mcpClient = new MCPClient({
        serverUrl: 'http://localhost:3000/mcp',
        capabilities: ['tools', 'resources', 'prompts']
      });

      await this.mcpClient.connect();

    } catch (error) {
      console.warn('MCP client initialization failed:', error);
      // Continue without MCP - graceful degradation
    }
  }

  private async registerIDEMessageHandlers(): Promise<void> {
    if (!this.protocolManager) return;

    // Code analysis handler
    await this.protocolManager.registerMessageHandler('ide.analyze-code', async (message) => {
      const { code, language, context } = message.params;
      
      return {
        analysis: await this.performCodeAnalysis(code, language, context),
        suggestions: await this.generateSuggestions(code, language),
        metrics: await this.calculateCodeMetrics(code, language)
      };
    });

    // Code generation handler
    await this.protocolManager.registerMessageHandler('ide.generate-code', async (message) => {
      const { prompt, language, context } = message.params;
      
      return {
        code: await this.generateCode(prompt, language, context),
        explanation: await this.explainGeneration(prompt, language),
        insertionPoints: await this.findInsertionPoints(context)
      };
    });

    // File operations handler
    await this.protocolManager.registerMessageHandler('ide.file-operations', async (message) => {
      const { operation, files, options } = message.params;
      
      return await this.performFileOperations(operation, files, options);
    });

    // Workspace query handler
    await this.protocolManager.registerMessageHandler('ide.workspace-query', async (message) => {
      const { query, scope } = message.params;
      
      return {
        results: await this.queryWorkspace(query, scope),
        metadata: await this.getWorkspaceMetadata()
      };
    });
  }

  private async enrichWithIDEContext(params: any): Promise<any> {
    const context = await this.getCurrentIDEContext();
    
    return {
      ...params,
      ide: {
        ...context,
        timestamp: Date.now(),
        extensionVersion: this.context.extension.packageJSON.version
      }
    };
  }

  private async getCurrentIDEContext(): Promise<IDECommandContext> {
    const editor = vscode.window.activeTextEditor;
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    
    return {
      editor,
      selection: editor?.selection,
      workspaceFolder,
      activeFile: editor?.document.fileName,
      language: editor?.document.languageId,
      projectType: await this.detectProjectType()
    };
  }

  private async selectExecutionStrategy(command: string, params: any): Promise<{
    protocol: 'a2a' | 'mcp' | 'direct';
    reason: string;
  }> {
    // Complex commands that benefit from multi-agent orchestration
    const complexCommands = [
      'orchestrate-task',
      'analyze-project',
      'generate-documentation',
      'refactor-codebase'
    ];

    // Commands that use MCP tools
    const mcpCommands = [
      'web-search',
      'file-system-operations',
      'external-tool-integration'
    ];

    if (complexCommands.includes(command) && this.protocolManager) {
      return { protocol: 'a2a', reason: 'Complex multi-agent task' };
    }

    if (mcpCommands.includes(command) && this.mcpClient) {
      return { protocol: 'mcp', reason: 'MCP tool integration required' };
    }

    return { protocol: 'direct', reason: 'Simple direct execution' };
  }

  private async executeA2ACommand(
    command: string, 
    params: any, 
    options: CommandExecutionOptions
  ): Promise<any> {
    if (!this.protocolManager) {
      throw new Error('A2A protocol not available');
    }

    const message: A2AMessage = {
      jsonrpc: '2.0',
      method: command,
      params,
      id: this.generateMessageId(),
      from: 'vscode-extension',
      to: 'command-processor',
      timestamp: Date.now(),
      messageType: 'request',
      priority: options.priority || 'normal',
      context: {
        timeout: options.timeout,
        ide: true
      }
    };

    const response = await this.protocolManager.sendMessage(message);
    return response.result;
  }

  private async executeMCPCommand(
    command: string, 
    params: any, 
    options: CommandExecutionOptions
  ): Promise<any> {
    if (!this.mcpClient) {
      throw new Error('MCP client not available');
    }

    return await this.mcpClient.callTool(command, params);
  }

  private async executeDirectCommand(
    command: string, 
    params: any, 
    options: CommandExecutionOptions
  ): Promise<any> {
    // Execute command directly using local handlers
    const handler = this.commandHandlers.get(command);
    if (!handler) {
      throw new Error(`No handler found for command: ${command}`);
    }

    return await handler(params, options);
  }

  private registerBuiltinHandlers(): void {
    // Basic chat handler
    this.commandHandlers.set('chat', async (params, options) => {
      const { message, context } = params;
      
      // Use core gemini-flow functionality
      const core = this.context.globalState.get('gemini-flow-core');
      if (!core) {
        throw new Error('Core not initialized');
      }

      return await core.generateResponse(message, context);
    });

    // Code analysis handler
    this.commandHandlers.set('analyze', async (params, options) => {
      const { code, language, context } = params;
      
      return {
        complexity: this.calculateComplexity(code),
        issues: this.findIssues(code, language),
        suggestions: this.generateSuggestions(code, language),
        metrics: this.calculateMetrics(code)
      };
    });

    // Code generation handler
    this.commandHandlers.set('generate', async (params, options) => {
      const { prompt, language, context } = params;
      
      // Use AI to generate code based on prompt
      const core = this.context.globalState.get('gemini-flow-core');
      if (!core) {
        throw new Error('Core not initialized');
      }

      return await core.generateCode(prompt, language, context);
    });
  }

  private async monitorTaskProgress(taskId: string, onProgress: Function): Promise<void> {
    // Implementation for monitoring multi-agent task progress
    const pollInterval = setInterval(async () => {
      try {
        if (!this.protocolManager) return;

        const statusMessage: A2AMessage = {
          jsonrpc: '2.0',
          method: 'task.status',
          params: { taskId },
          id: this.generateMessageId(),
          from: 'vscode-extension',
          to: 'orchestrator-agent',
          timestamp: Date.now(),
          messageType: 'request'
        };

        const response = await this.protocolManager.sendMessage(statusMessage);
        const status = response.result;

        onProgress({
          percentage: status.progress,
          message: status.currentStep
        });

        if (status.completed) {
          clearInterval(pollInterval);
        }

      } catch (error) {
        clearInterval(pollInterval);
        console.error('Progress monitoring failed:', error);
      }
    }, 1000);
  }

  // Helper methods
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async isEnterpriseModeEnabled(): Promise<boolean> {
    const sessions = await this.authProvider.getSessions();
    if (sessions.length === 0) return false;

    const profile = await this.authProvider.getCurrentUserProfile();
    return profile?.tier === 'enterprise' || profile?.tier === 'ultra';
  }

  private async isMCPAvailable(): Promise<boolean> {
    try {
      await import('@modelcontextprotocol/sdk');
      return true;
    } catch {
      return false;
    }
  }

  private async detectOperatingMode(): Promise<string> {
    const config = vscode.workspace.getConfiguration('gemini-flow');
    const mode = config.get('mode') as string;
    
    if (mode && ['lightweight', 'enterprise', 'full'].includes(mode)) {
      return mode;
    }

    // Auto-detect based on available features
    const isAuthenticated = (await this.authProvider.getSessions()).length > 0;
    const hasEnterpriseFeatures = await this.isEnterpriseModeEnabled();
    
    if (hasEnterpriseFeatures) return 'enterprise';
    if (isAuthenticated) return 'lightweight';
    return 'minimal';
  }

  private async detectEnabledFeatures(): Promise<string[]> {
    const config = vscode.workspace.getConfiguration('gemini-flow.features');
    const features: string[] = [];

    if (config.get('enableSwarm')) features.push('swarm');
    if (config.get('enableMemoryBank')) features.push('memory');
    if (config.get('enableWorkspaceSync')) features.push('workspace');

    return features;
  }

  private async detectProjectType(): Promise<string> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) return 'unknown';

    try {
      // Check for package.json (Node.js)
      const packageJson = await vscode.workspace.findFiles('package.json', null, 1);
      if (packageJson.length > 0) return 'nodejs';

      // Check for requirements.txt (Python)
      const requirements = await vscode.workspace.findFiles('requirements.txt', null, 1);
      if (requirements.length > 0) return 'python';

      // Check for Cargo.toml (Rust)
      const cargo = await vscode.workspace.findFiles('Cargo.toml', null, 1);
      if (cargo.length > 0) return 'rust';

      // Check for pom.xml (Java/Maven)
      const maven = await vscode.workspace.findFiles('pom.xml', null, 1);
      if (maven.length > 0) return 'java-maven';

      return 'generic';
    } catch {
      return 'unknown';
    }
  }

  private handleCommandError(command: string, error: any): void {
    console.error(`Command ${command} failed:`, error);
    
    // Show user-friendly error message
    vscode.window.showErrorMessage(
      `Gemini Flow: ${command} failed - ${error.message}`
    );
  }

  // Placeholder implementations for code analysis methods
  private calculateComplexity(code: string): number {
    // Simplified complexity calculation
    return code.split('\n').length;
  }

  private findIssues(code: string, language: string): any[] {
    // Placeholder for code issue detection
    return [];
  }

  private generateSuggestions(code: string, language: string): any[] {
    // Placeholder for suggestion generation
    return [];
  }

  private calculateMetrics(code: string): any {
    // Placeholder for code metrics calculation
    return {
      lines: code.split('\n').length,
      characters: code.length
    };
  }

  dispose(): void {
    if (this.protocolManager) {
      this.protocolManager.shutdown();
    }
    if (this.mcpClient) {
      this.mcpClient.disconnect();
    }
    super.dispose();
  }
}
```

### 3.2 Authentication Service as MCP Endpoint

```typescript
// src/extension/protocols/auth-mcp-endpoint.ts
import { AuthenticationProvider } from '../auth/authentication-provider';

export class AuthMCPEndpoint {
  constructor(private authProvider: AuthenticationProvider) {}

  /**
   * Expose authentication service as MCP endpoint
   */
  async setupMCPEndpoint(): Promise<void> {
    try {
      const { MCPServer } = await import('@modelcontextprotocol/sdk');
      
      const server = new MCPServer({
        name: 'gemini-flow-auth',
        version: '1.0.0'
      });

      // Register authentication tools
      server.addTool({
        name: 'authenticate',
        description: 'Authenticate with AI provider',
        inputSchema: {
          type: 'object',
          properties: {
            provider: {
              type: 'string',
              enum: ['google-ai', 'vertex-ai'],
              description: 'Authentication provider'
            }
          },
          required: ['provider']
        }
      }, async (params) => {
        const result = await this.authProvider.authenticate(params.provider);
        return {
          success: result.success,
          userTier: result.profile?.tier,
          permissions: result.profile?.permissions
        };
      });

      server.addTool({
        name: 'get-user-profile',
        description: 'Get current user profile',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      }, async () => {
        const sessions = await this.authProvider.getSessions();
        if (sessions.length === 0) {
          throw new Error('No active authentication session');
        }

        return {
          authenticated: true,
          sessionCount: sessions.length,
          primarySession: sessions[0]
        };
      });

      // Start MCP server
      await server.start();
      
    } catch (error) {
      console.warn('MCP authentication endpoint setup failed:', error);
    }
  }
}
```

### 3.3 Bidirectional Communication Patterns

```typescript
// src/extension/protocols/bidirectional-communication.ts
export class BidirectionalCommunicationManager {
  private eventHandlers: Map<string, Function[]> = new Map();
  
  constructor(
    private protocolBridge: A2AMCPBridge,
    private context: vscode.ExtensionContext
  ) {
    this.setupBidirectionalHandlers();
  }

  private setupBidirectionalHandlers(): void {
    // Handle incoming A2A notifications
    this.protocolBridge.onNotification('ide.file-changed', (notification) => {
      this.handleFileChangeNotification(notification);
    });

    this.protocolBridge.onNotification('ide.task-update', (notification) => {
      this.handleTaskUpdateNotification(notification);
    });

    // Handle VSCode events and forward to A2A
    vscode.workspace.onDidChangeTextDocument((event) => {
      this.forwardDocumentChange(event);
    });

    vscode.window.onDidChangeActiveTextEditor((editor) => {
      this.forwardEditorChange(editor);
    });
  }

  private async handleFileChangeNotification(notification: any): Promise<void> {
    const { filePath, changeType, content } = notification.params;
    
    // Update VSCode if file was changed externally
    if (changeType === 'external-modification') {
      const document = await vscode.workspace.openTextDocument(filePath);
      const editor = await vscode.window.showTextDocument(document);
      
      // Show notification about external change
      vscode.window.showInformationMessage(
        `File ${filePath} was modified by AI agent`,
        'Review Changes',
        'Accept',
        'Reject'
      ).then(action => {
        if (action === 'Review Changes') {
          vscode.commands.executeCommand('workbench.action.files.showOpenedFileInNewWindow');
        }
      });
    }
  }

  private async handleTaskUpdateNotification(notification: any): Promise<void> {
    const { taskId, status, progress, message } = notification.params;
    
    // Update progress in status bar
    vscode.window.setStatusBarMessage(
      `Gemini Flow: ${message} (${progress}%)`,
      status === 'completed' ? 2000 : undefined
    );

    // Show completion notification
    if (status === 'completed') {
      vscode.window.showInformationMessage(
        `Task completed: ${message}`,
        'View Results'
      ).then(action => {
        if (action === 'View Results') {
          vscode.commands.executeCommand('gemini-flow.show-task-results', taskId);
        }
      });
    }
  }

  private async forwardDocumentChange(event: vscode.TextDocumentChangeEvent): Promise<void> {
    // Forward document changes to A2A protocol for context awareness
    if (event.document.uri.scheme === 'file') {
      await this.protocolBridge.sendNotification('ide.document-changed', {
        filePath: event.document.fileName,
        language: event.document.languageId,
        changes: event.contentChanges.map(change => ({
          range: {
            start: { line: change.range.start.line, character: change.range.start.character },
            end: { line: change.range.end.line, character: change.range.end.character }
          },
          text: change.text
        }))
      });
    }
  }

  private async forwardEditorChange(editor?: vscode.TextEditor): Promise<void> {
    // Forward active editor changes to maintain context
    if (editor && editor.document.uri.scheme === 'file') {
      await this.protocolBridge.sendNotification('ide.active-editor-changed', {
        filePath: editor.document.fileName,
        language: editor.document.languageId,
        selection: editor.selection ? {
          start: { line: editor.selection.start.line, character: editor.selection.start.character },
          end: { line: editor.selection.end.line, character: editor.selection.end.character }
        } : null
      });
    }
  }
}
```

This A2A/MCP Protocol Integration provides:

1. **Unified Protocol Bridge**: Single interface for A2A, MCP, and direct command execution
2. **Context-Aware Command Execution**: Enriches commands with IDE context and workspace information
3. **Multi-Agent Task Orchestration**: Seamless integration with the existing A2A protocol for complex tasks
4. **Bidirectional Communication**: Real-time sync between IDE state and agent operations
5. **Graceful Degradation**: Falls back to direct execution when protocols are unavailable
6. **MCP Tool Integration**: Exposes authentication and other services as MCP endpoints

The design builds directly on the existing `A2AProtocolManager` and leverages the sophisticated message handling, security, and routing capabilities already implemented in the codebase.