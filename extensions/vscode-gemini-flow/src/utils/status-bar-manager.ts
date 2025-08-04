/**
 * Status Bar Manager - Manages VSCode status bar integration
 */

import * as vscode from 'vscode';
import { Logger } from './logger';

export type StatusBarState = 'ready' | 'busy' | 'error' | 'warning' | 'disabled';

export class StatusBarManager implements vscode.Disposable {
  private _currentState: StatusBarState = 'disabled';

  constructor(
    private readonly _statusBarItem: vscode.StatusBarItem,
    private readonly _logger: Logger
  ) {
    this._statusBarItem.command = 'gemini-flow.configure';
  }

  /**
   * Initialize status bar
   */
  initialize(): void {
    this._statusBarItem.text = '$(robot) Gemini Flow';
    this._statusBarItem.tooltip = 'Gemini Flow - AI Code Assistant';
    this._statusBarItem.show();
    
    this._logger.debug('Status bar initialized');
  }

  /**
   * Update status bar state and message
   */
  updateStatus(state: StatusBarState, message: string, tooltip?: string): void {
    this._currentState = state;
    
    const icon = this.getIconForState(state);
    const color = this.getColorForState(state);
    
    this._statusBarItem.text = `${icon} ${message}`;
    this._statusBarItem.tooltip = tooltip || message;
    this._statusBarItem.color = color;
    
    // Update command based on state
    switch (state) {
      case 'ready':
        this._statusBarItem.command = 'gemini-flow.chat';
        break;
      case 'error':
      case 'warning':
        this._statusBarItem.command = 'gemini-flow.configure';
        break;
      case 'disabled':
        this._statusBarItem.command = 'gemini-flow.activate';
        break;
      default:
        this._statusBarItem.command = 'gemini-flow.configure';
    }
    
    this._logger.debug('Status bar updated', { state, message });
  }

  /**
   * Show progress with cancellation support
   */
  showProgress(
    message: string, 
    cancellationToken?: vscode.CancellationToken
  ): vscode.Disposable {
    const originalText = this._statusBarItem.text;
    const originalTooltip = this._statusBarItem.tooltip;
    const originalCommand = this._statusBarItem.command;
    
    // Show progress state
    this._statusBarItem.text = `$(loading~spin) ${message}`;
    this._statusBarItem.tooltip = `${message} (Click to cancel)`;
    this._statusBarItem.command = undefined;
    this._statusBarItem.color = new vscode.ThemeColor('statusBarItem.prominentForeground');
    
    // Handle cancellation
    const onCancellation = cancellationToken?.onCancellationRequested(() => {
      this.restoreOriginalStatus(originalText, originalTooltip, originalCommand);
    });
    
    return {
      dispose: () => {
        onCancellation?.dispose();
        this.restoreOriginalStatus(originalText, originalTooltip, originalCommand);
      }
    };
  }

  /**
   * Show temporary message
   */
  showTemporaryMessage(message: string, duration: number = 3000): void {
    const originalText = this._statusBarItem.text;
    const originalTooltip = this._statusBarItem.tooltip;
    const originalCommand = this._statusBarItem.command;
    const originalColor = this._statusBarItem.color;
    
    this._statusBarItem.text = `$(info) ${message}`;
    this._statusBarItem.tooltip = message;
    this._statusBarItem.color = new vscode.ThemeColor('statusBarItem.prominentForeground');
    
    setTimeout(() => {
      this.restoreOriginalStatus(originalText, originalTooltip, originalCommand, originalColor);
    }, duration);
  }

  /**
   * Show error message
   */
  showError(message: string, duration: number = 5000): void {
    const originalText = this._statusBarItem.text;
    const originalTooltip = this._statusBarItem.tooltip;
    const originalCommand = this._statusBarItem.command;
    const originalColor = this._statusBarItem.color;
    
    this._statusBarItem.text = `$(error) ${message}`;
    this._statusBarItem.tooltip = `Error: ${message}`;
    this._statusBarItem.color = new vscode.ThemeColor('statusBarItem.errorForeground');
    this._statusBarItem.command = 'gemini-flow.configure';
    
    setTimeout(() => {
      this.restoreOriginalStatus(originalText, originalTooltip, originalCommand, originalColor);
    }, duration);
  }

  /**
   * Show success message
   */
  showSuccess(message: string, duration: number = 3000): void {
    const originalText = this._statusBarItem.text;
    const originalTooltip = this._statusBarItem.tooltip;
    const originalCommand = this._statusBarItem.command;
    const originalColor = this._statusBarItem.color;
    
    this._statusBarItem.text = `$(check) ${message}`;
    this._statusBarItem.tooltip = `Success: ${message}`;
    this._statusBarItem.color = new vscode.ThemeColor('statusBarItem.prominentForeground');
    
    setTimeout(() => {
      this.restoreOriginalStatus(originalText, originalTooltip, originalCommand, originalColor);
    }, duration);
  }

  /**
   * Update connection status for protocols
   */
  updateConnectionStatus(protocol: 'a2a' | 'mcp', connected: boolean, details?: string): void {
    const protocolName = protocol.toUpperCase();
    const status = connected ? 'Connected' : 'Disconnected';
    const icon = connected ? '$(plug)' : '$(debug-disconnect)';
    
    const tooltip = details 
      ? `${protocolName}: ${status} - ${details}`
      : `${protocolName}: ${status}`;
    
    this.updateStatus(
      connected ? 'ready' : 'warning',
      `Gemini Flow ${icon} ${protocolName}`,
      tooltip
    );
  }

  /**
   * Update task progress for swarm operations
   */
  updateTaskProgress(taskCount: number, completedCount: number): void {
    if (taskCount === 0) {
      this.updateStatus('ready', 'Gemini Flow: Ready');
      return;
    }
    
    const percentage = Math.round((completedCount / taskCount) * 100);
    const message = `Gemini Flow: Tasks ${completedCount}/${taskCount} (${percentage}%)`;
    
    this.updateStatus('busy', message, `Swarm processing: ${completedCount} of ${taskCount} tasks completed`);
  }

  /**
   * Get current status state
   */
  getCurrentState(): StatusBarState {
    return this._currentState;
  }

  /**
   * Hide status bar
   */
  hide(): void {
    this._statusBarItem.hide();
  }

  /**
   * Show status bar
   */
  show(): void {
    this._statusBarItem.show();
  }

  /**
   * Get icon for state
   */
  private getIconForState(state: StatusBarState): string {
    switch (state) {
      case 'ready': return '$(robot)';
      case 'busy': return '$(loading~spin)';
      case 'error': return '$(error)';
      case 'warning': return '$(warning)';
      case 'disabled': return '$(circle-slash)';
      default: return '$(robot)';
    }
  }

  /**
   * Get color for state
   */
  private getColorForState(state: StatusBarState): vscode.ThemeColor | undefined {
    switch (state) {
      case 'error':
        return new vscode.ThemeColor('statusBarItem.errorForeground');
      case 'warning':
        return new vscode.ThemeColor('statusBarItem.warningForeground');
      case 'busy':
        return new vscode.ThemeColor('statusBarItem.prominentForeground');
      default:
        return undefined;
    }
  }

  /**
   * Restore original status
   */
  private restoreOriginalStatus(
    originalText: string | vscode.ThemeColor | undefined,
    originalTooltip: string | vscode.MarkdownString | undefined,
    originalCommand: string | vscode.Command | undefined,
    originalColor?: string | vscode.ThemeColor | undefined
  ): void {
    this._statusBarItem.text = originalText as string || '$(robot) Gemini Flow';
    this._statusBarItem.tooltip = originalTooltip;
    this._statusBarItem.command = originalCommand;
    this._statusBarItem.color = originalColor;
  }

  /**
   * Create status bar menu items
   */
  createContextMenu(): vscode.QuickPick<vscode.QuickPickItem> {
    const quickPick = vscode.window.createQuickPick();
    quickPick.title = 'Gemini Flow Actions';
    
    const items: vscode.QuickPickItem[] = [
      {
        label: '$(comment-discussion) Explain Code',
        description: 'Get AI explanation of selected code',
        detail: 'Ctrl+Alt+E'
      },
      {
        label: '$(wrench) Refactor Code',
        description: 'Get refactoring suggestions',
        detail: 'Ctrl+Alt+R'
      },
      {
        label: '$(add) Generate Code',
        description: 'Generate code from description',
        detail: 'Ctrl+Alt+G'
      },
      {
        label: '$(rocket) Optimize Code',
        description: 'Get optimization suggestions'
      },
      {
        label: '$(book) Generate Docs',
        description: 'Generate documentation'
      },
      {
        label: '$(comment) Open Chat',
        description: 'Chat with AI assistant',
        detail: 'Ctrl+Alt+C'
      },
      {
        label: '$(organization) Swarm Tasks',
        description: 'Multi-agent orchestration'
      },
      {
        label: '$(settings-gear) Configure',
        description: 'Open configuration'
      }
    ];
    
    quickPick.items = items;
    
    quickPick.onDidAccept(() => {
      const selected = quickPick.selectedItems[0];
      if (selected) {
        this.handleMenuAction(selected.label);
      }
      quickPick.dispose();
    });
    
    return quickPick;
  }

  /**
   * Handle status bar menu actions
   */
  private handleMenuAction(action: string): void {
    const commandMap: Record<string, string> = {
      '$(comment-discussion) Explain Code': 'gemini-flow.explain',
      '$(wrench) Refactor Code': 'gemini-flow.refactor',
      '$(add) Generate Code': 'gemini-flow.generate',
      '$(rocket) Optimize Code': 'gemini-flow.optimize',
      '$(book) Generate Docs': 'gemini-flow.document',
      '$(comment) Open Chat': 'gemini-flow.chat',
      '$(organization) Swarm Tasks': 'gemini-flow.swarm.orchestrate',
      '$(settings-gear) Configure': 'gemini-flow.configure'
    };
    
    const command = commandMap[action];
    if (command) {
      vscode.commands.executeCommand(command);
    }
  }

  /**
   * Dispose of status bar manager
   */
  dispose(): void {
    this._statusBarItem.dispose();
  }
}