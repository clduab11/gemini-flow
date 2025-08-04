/**
 * A2A Service - Agent-to-Agent communication protocol implementation
 */

import * as vscode from 'vscode';
import * as WebSocket from 'ws';
import { A2AMessage } from '../types';
import { Logger } from '../utils/logger';

export class A2AService implements vscode.Disposable {
  private _websocket?: WebSocket;
  private _isConnected = false;
  private _messageHandlers = new Map<string, (message: A2AMessage) => void>();
  private _reconnectAttempts = 0;
  private _maxReconnectAttempts = 5;
  private _reconnectInterval = 5000;
  private _reconnectTimer?: NodeJS.Timeout;

  constructor(
    private readonly _endpoint: string,
    private readonly _logger: Logger
  ) {}

  /**
   * Connect to A2A protocol endpoint
   */
  async connect(): Promise<void> {
    try {
      this._logger.info(`Connecting to A2A endpoint: ${this._endpoint}`);
      
      if (this._isConnected) {
        this._logger.warn('Already connected to A2A endpoint');
        return;
      }

      this._websocket = new WebSocket(this._endpoint);
      
      this._websocket.on('open', () => {
        this._isConnected = true;
        this._reconnectAttempts = 0;
        this._logger.info('A2A connection established');
        
        // Send initial handshake
        this.sendHandshake();
      });

      this._websocket.on('message', (data) => {
        try {
          const message: A2AMessage = JSON.parse(data.toString());
          this.handleMessage(message);
        } catch (error) {
          this._logger.error('Failed to parse A2A message', error as Error);
        }
      });

      this._websocket.on('error', (error) => {
        this._logger.error('A2A WebSocket error', error);
        this._isConnected = false;
      });

      this._websocket.on('close', (code, reason) => {
        this._logger.warn(`A2A connection closed: ${code} ${reason}`);
        this._isConnected = false;
        
        // Attempt reconnection
        this.scheduleReconnect();
      });

      // Wait for connection to be established
      await this.waitForConnection();
      
    } catch (error) {
      this._logger.error('Failed to connect to A2A endpoint', error as Error);
      throw error;
    }
  }

  /**
   * Disconnect from A2A endpoint
   */
  async disconnect(): Promise<void> {
    try {
      this._logger.info('Disconnecting from A2A endpoint');
      
      if (this._reconnectTimer) {
        clearTimeout(this._reconnectTimer);
        this._reconnectTimer = undefined;
      }
      
      if (this._websocket) {
        this._websocket.close();
        this._websocket = undefined;
      }
      
      this._isConnected = false;
      this._logger.info('A2A disconnection completed');
    } catch (error) {
      this._logger.error('Failed to disconnect from A2A endpoint', error as Error);
      throw error;
    }
  }

  /**
   * Send message via A2A protocol
   */
  async sendMessage(message: A2AMessage): Promise<A2AMessage | null> {
    if (!this._isConnected || !this._websocket) {
      throw new Error('Not connected to A2A endpoint');
    }

    try {
      this._logger.debug('Sending A2A message', { type: message.type, method: message.method });
      
      // Send message
      this._websocket.send(JSON.stringify(message));
      
      // For request messages, wait for response
      if (message.type === 'request') {
        return await this.waitForResponse(message.id);
      }
      
      return null;
    } catch (error) {
      this._logger.error('Failed to send A2A message', error as Error);
      throw error;
    }
  }

  /**
   * Register message handler
   */
  onMessage(method: string, handler: (message: A2AMessage) => void): vscode.Disposable {
    this._messageHandlers.set(method, handler);
    
    return {
      dispose: () => {
        this._messageHandlers.delete(method);
      }
    };
  }

  /**
   * Request agent capabilities
   */
  async requestAgentCapabilities(agentId?: string): Promise<string[]> {
    const message: A2AMessage = {
      id: this.generateMessageId(),
      type: 'request',
      method: 'agent.getCapabilities',
      params: { agentId }
    };

    try {
      const response = await this.sendMessage(message);
      return response?.result?.capabilities || [];
    } catch (error) {
      this._logger.error('Failed to request agent capabilities', error as Error);
      return [];
    }
  }

  /**
   * Orchestrate multi-agent task
   */
  async orchestrateTask(taskDescription: string, options: {
    maxAgents?: number;
    timeout?: number;
    priority?: 'low' | 'medium' | 'high' | 'critical';
  } = {}): Promise<any> {
    const message: A2AMessage = {
      id: this.generateMessageId(),
      type: 'request',
      method: 'swarm.orchestrateTask',
      params: {
        task: taskDescription,
        maxAgents: options.maxAgents || 5,
        timeout: options.timeout || 300000, // 5 minutes
        priority: options.priority || 'medium'
      }
    };

    try {
      const response = await this.sendMessage(message);
      return response?.result;
    } catch (error) {
      this._logger.error('Failed to orchestrate task', error as Error);
      throw error;
    }
  }

  /**
   * Request code analysis from agents
   */
  async requestCodeAnalysis(code: string, language: string, analysisType: string): Promise<any> {
    const message: A2AMessage = {
      id: this.generateMessageId(),
      type: 'request',
      method: 'code.analyze',
      params: {
        code,
        language,
        analysisType
      }
    };

    try {
      const response = await this.sendMessage(message);
      return response?.result;
    } catch (error) {
      this._logger.error('Failed to request code analysis', error as Error);
      throw error;
    }
  }

  /**
   * Share context with other agents
   */
  async shareContext(context: any, targetAgents?: string[]): Promise<boolean> {
    const message: A2AMessage = {
      id: this.generateMessageId(),
      type: 'notification',
      method: 'context.share',
      params: {
        context,
        targetAgents
      }
    };

    try {
      await this.sendMessage(message);
      return true;
    } catch (error) {
      this._logger.error('Failed to share context', error as Error);
      return false;
    }
  }

  /**
   * Get swarm status
   */
  async getSwarmStatus(): Promise<any> {
    const message: A2AMessage = {
      id: this.generateMessageId(),
      type: 'request',
      method: 'swarm.getStatus'
    };

    try {
      const response = await this.sendMessage(message);
      return response?.result;
    } catch (error) {
      this._logger.error('Failed to get swarm status', error as Error);
      return null;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this._isConnected;
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): {
    connected: boolean;
    endpoint: string;
    reconnectAttempts: number;
  } {
    return {
      connected: this._isConnected,
      endpoint: this._endpoint,
      reconnectAttempts: this._reconnectAttempts
    };
  }

  /**
   * Send initial handshake
   */
  private sendHandshake(): void {
    const handshake: A2AMessage = {
      id: this.generateMessageId(),
      type: 'notification',
      method: 'handshake',
      params: {
        clientType: 'vscode-extension',
        version: '1.1.0',
        capabilities: [
          'code.analyze',
          'code.explain',
          'code.refactor',
          'code.generate',
          'code.document',
          'security.scan'
        ]
      }
    };

    if (this._websocket) {
      this._websocket.send(JSON.stringify(handshake));
    }
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(message: A2AMessage): void {
    this._logger.debug('Received A2A message', { type: message.type, method: message.method });

    // Handle specific message types
    switch (message.method) {
      case 'ping':
        this.handlePing(message);
        break;
      case 'agent.capabilities':
        this.handleAgentCapabilities(message);
        break;
      case 'task.progress':
        this.handleTaskProgress(message);
        break;
      case 'context.request':
        this.handleContextRequest(message);
        break;
      default:
        // Check for registered handlers
        const handler = this._messageHandlers.get(message.method);
        if (handler) {
          handler(message);
        } else {
          this._logger.debug(`No handler for A2A method: ${message.method}`);
        }
    }
  }

  /**
   * Handle ping messages
   */
  private handlePing(message: A2AMessage): void {
    const pong: A2AMessage = {
      id: this.generateMessageId(),
      type: 'response',
      method: 'pong',
      result: { timestamp: Date.now() }
    };

    if (this._websocket) {
      this._websocket.send(JSON.stringify(pong));
    }
  }

  /**
   * Handle agent capabilities messages
   */
  private handleAgentCapabilities(message: A2AMessage): void {
    // Update local knowledge of agent capabilities
    this._logger.info('Received agent capabilities update', message.params);
  }

  /**
   * Handle task progress messages
   */
  private handleTaskProgress(message: A2AMessage): void {
    // Update UI with task progress
    const progress = message.params;
    this._logger.info('Task progress update', progress);
    
    // Emit progress event that UI can listen to
    // This would be implemented with event emitters in a full implementation
  }

  /**
   * Handle context request messages
   */
  private handleContextRequest(message: A2AMessage): void {
    // Provide current VSCode context to requesting agent
    const context = this.gatherCurrentContext();
    
    const response: A2AMessage = {
      id: this.generateMessageId(),
      type: 'response',
      method: 'context.provide',
      result: { context }
    };

    if (this._websocket) {
      this._websocket.send(JSON.stringify(response));
    }
  }

  /**
   * Wait for connection to be established
   */
  private waitForConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 10000);

      const checkConnection = () => {
        if (this._isConnected) {
          clearTimeout(timeout);
          resolve();
        } else {
          setTimeout(checkConnection, 100);
        }
      };

      checkConnection();
    });
  }

  /**
   * Wait for response to a specific message
   */
  private waitForResponse(messageId: string, timeout = 30000): Promise<A2AMessage | null> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error('Response timeout'));
      }, timeout);

      const responseHandler = (data: Buffer) => {
        try {
          const message: A2AMessage = JSON.parse(data.toString());
          if (message.id === messageId && message.type === 'response') {
            cleanup();
            resolve(message);
          }
        } catch (error) {
          // Ignore parsing errors for non-matching messages
        }
      };

      const errorHandler = (error: Error) => {
        cleanup();
        reject(error);
      };

      const cleanup = () => {
        clearTimeout(timeoutId);
        this._websocket?.off('message', responseHandler);
        this._websocket?.off('error', errorHandler);
      };

      this._websocket?.on('message', responseHandler);
      this._websocket?.on('error', errorHandler);
    });
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this._reconnectAttempts >= this._maxReconnectAttempts) {
      this._logger.error('Max reconnection attempts reached');
      return;
    }

    this._reconnectAttempts++;
    const delay = this._reconnectInterval * Math.pow(2, this._reconnectAttempts - 1);
    
    this._logger.info(`Scheduling reconnection attempt ${this._reconnectAttempts} in ${delay}ms`);
    
    this._reconnectTimer = setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        this._logger.error('Reconnection attempt failed', error as Error);
      }
    }, delay);
  }

  /**
   * Gather current VSCode context
   */
  private gatherCurrentContext(): any {
    const editor = vscode.window.activeTextEditor;
    const workspaceFolders = vscode.workspace.workspaceFolders;
    
    return {
      activeFile: editor?.document.fileName,
      language: editor?.document.languageId,
      selection: editor?.selection,
      workspaceFolders: workspaceFolders?.map(f => f.uri.fsPath),
      openFiles: vscode.workspace.textDocuments.map(doc => doc.fileName)
    };
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `vscode-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Dispose of A2A service
   */
  dispose(): void {
    if (this._reconnectTimer) {
      clearTimeout(this._reconnectTimer);
    }
    
    this.disconnect().catch(error => {
      this._logger.error('Error during A2A service disposal', error as Error);
    });
    
    this._messageHandlers.clear();
  }
}