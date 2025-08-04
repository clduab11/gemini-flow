/**
 * Authentication Service for Gemini Flow extension
 */

import * as vscode from 'vscode';
import { Logger } from '../utils/logger';

export class AuthenticationService implements vscode.Disposable {
  private _isAuthenticated = false;
  private _apiKey?: string;

  constructor(
    private readonly _context: vscode.ExtensionContext,
    private readonly _logger: Logger
  ) {}

  /**
   * Initialize authentication service
   */
  async initialize(): Promise<void> {
    try {
      this._logger.info('Initializing authentication service...');
      
      // Load API key from secure storage or configuration
      await this.loadApiKey();
      
      if (this._apiKey) {
        await this.validateApiKey();
      }
      
      this._logger.info('Authentication service initialized');
    } catch (error) {
      this._logger.error('Failed to initialize authentication service', error as Error);
      throw error;
    }
  }

  /**
   * Authenticate with Google Gemini API
   */
  async authenticate(): Promise<boolean> {
    try {
      this._logger.info('Starting authentication process...');
      
      if (!this._apiKey) {
        await this.loadApiKey();
      }

      if (!this._apiKey) {
        this._logger.warn('No API key found for authentication');
        return false;
      }

      // Validate API key with a simple request
      const isValid = await this.validateApiKey();
      this._isAuthenticated = isValid;

      if (this._isAuthenticated) {
        this._logger.info('Authentication successful');
        // Store the API key securely
        await this.storeApiKeySecurely(this._apiKey);
      } else {
        this._logger.warn('Authentication failed - invalid API key');
      }

      return this._isAuthenticated;
    } catch (error) {
      this._logger.error('Authentication process failed', error as Error);
      this._isAuthenticated = false;
      return false;
    }
  }

  /**
   * Check if currently authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    if (!this._apiKey) {
      return false;
    }

    // Periodically re-validate the API key
    if (this._isAuthenticated) {
      const lastValidation = this._context.globalState.get('gemini-flow.lastValidation', 0);
      const now = Date.now();
      const validationInterval = 24 * 60 * 60 * 1000; // 24 hours

      if (now - lastValidation > validationInterval) {
        this._logger.debug('Re-validating API key...');
        this._isAuthenticated = await this.validateApiKey();
        await this._context.globalState.update('gemini-flow.lastValidation', now);
      }
    }

    return this._isAuthenticated;
  }

  /**
   * Get the current API key
   */
  getApiKey(): string | undefined {
    return this._apiKey;
  }

  /**
   * Set a new API key
   */
  async setApiKey(apiKey: string): Promise<boolean> {
    try {
      this._apiKey = apiKey;
      
      // Validate the new API key
      const isValid = await this.validateApiKey();
      
      if (isValid) {
        this._isAuthenticated = true;
        await this.storeApiKeySecurely(apiKey);
        this._logger.info('New API key set and validated successfully');
      } else {
        this._apiKey = undefined;
        this._isAuthenticated = false;
        this._logger.warn('Invalid API key provided');
      }

      return isValid;
    } catch (error) {
      this._logger.error('Failed to set API key', error as Error);
      this._apiKey = undefined;
      this._isAuthenticated = false;
      return false;
    }
  }

  /**
   * Sign out and clear authentication
   */
  async signOut(): Promise<void> {
    try {
      this._logger.info('Signing out...');
      
      this._apiKey = undefined;
      this._isAuthenticated = false;
      
      // Clear stored credentials
      await this._context.secrets.delete('gemini-flow.apiKey');
      await this._context.globalState.update('gemini-flow.lastValidation', undefined);
      
      this._logger.info('Signed out successfully');
    } catch (error) {
      this._logger.error('Failed to sign out', error as Error);
      throw error;
    }
  }

  /**
   * Load API key from configuration or secure storage
   */
  private async loadApiKey(): Promise<void> {
    try {
      // First try to get from VSCode configuration
      const config = vscode.workspace.getConfiguration('gemini-flow');
      let apiKey = config.get<string>('apiKey');

      // If not in config, try secure storage
      if (!apiKey) {
        apiKey = await this._context.secrets.get('gemini-flow.apiKey');
      }

      // If found in config but not in secure storage, migrate it
      if (apiKey && config.get<string>('apiKey')) {
        await this.storeApiKeySecurely(apiKey);
        // Clear from configuration for security
        await config.update('apiKey', '', vscode.ConfigurationTarget.Global);
      }

      this._apiKey = apiKey;
      this._logger.debug('API key loaded from storage');
    } catch (error) {
      this._logger.error('Failed to load API key', error as Error);
      throw error;
    }
  }

  /**
   * Store API key securely
   */
  private async storeApiKeySecurely(apiKey: string): Promise<void> {
    try {
      await this._context.secrets.store('gemini-flow.apiKey', apiKey);
      this._logger.debug('API key stored securely');
    } catch (error) {
      this._logger.error('Failed to store API key securely', error as Error);
      throw error;
    }
  }

  /**
   * Validate API key with Gemini API
   */
  private async validateApiKey(): Promise<boolean> {
    if (!this._apiKey) {
      return false;
    }

    try {
      this._logger.debug('Validating API key...');
      
      // Make a simple request to validate the API key
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${this._apiKey}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        this._logger.debug('API key validation successful');
        return true;
      } else {
        this._logger.warn('API key validation failed', {
          status: response.status,
          statusText: response.statusText
        });
        return false;
      }
    } catch (error) {
      this._logger.error('API key validation error', error as Error);
      return false;
    }
  }

  /**
   * Get authentication headers for API requests
   */
  getAuthHeaders(): Record<string, string> {
    if (!this._apiKey) {
      throw new Error('Not authenticated - no API key available');
    }

    return {
      'Authorization': `Bearer ${this._apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Get authenticated API key for direct use
   */
  getAuthenticatedApiKey(): string {
    if (!this._isAuthenticated || !this._apiKey) {
      throw new Error('Not authenticated - please configure API key');
    }
    return this._apiKey;
  }

  /**
   * Refresh authentication if needed
   */
  async refreshAuthentication(): Promise<boolean> {
    if (!this._isAuthenticated) {
      return await this.authenticate();
    }
    return true;
  }

  /**
   * Handle authentication errors
   */
  async handleAuthError(error: any): Promise<void> {
    this._logger.error('Authentication error occurred', error);
    
    // Check if this is an authentication-related error
    if (this.isAuthError(error)) {
      this._isAuthenticated = false;
      
      const response = await vscode.window.showErrorMessage(
        'Authentication failed. Please check your API key.',
        'Reconfigure',
        'Retry'
      );

      if (response === 'Reconfigure') {
        await vscode.commands.executeCommand('gemini-flow.configure');
      } else if (response === 'Retry') {
        await this.authenticate();
      }
    }
  }

  /**
   * Check if error is authentication-related
   */
  private isAuthError(error: any): boolean {
    if (error?.status === 401 || error?.status === 403) {
      return true;
    }
    
    const message = error?.message?.toLowerCase() || '';
    return message.includes('unauthorized') || 
           message.includes('invalid api key') ||
           message.includes('authentication');
  }

  /**
   * Dispose of authentication service
   */
  dispose(): void {
    this._apiKey = undefined;
    this._isAuthenticated = false;
  }
}