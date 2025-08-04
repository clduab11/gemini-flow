/**
 * Configuration Manager for Gemini Flow extension
 */

import * as vscode from 'vscode';
import { GeminiFlowConfig } from '../types';
import { Logger } from '../utils/logger';

export class ConfigurationManager implements vscode.Disposable {
  private _config: GeminiFlowConfig;

  constructor(private readonly _logger: Logger) {
    // Initialize with default configuration
    this._config = this.getDefaultConfiguration();
  }

  /**
   * Load configuration from VSCode settings
   */
  async loadConfiguration(): Promise<void> {
    try {
      const config = vscode.workspace.getConfiguration('gemini-flow');
      
      this._config = {
        enabled: config.get('enabled', true),
        apiKey: config.get('apiKey', ''),
        model: config.get('model', 'gemini-1.5-pro'),
        autoComplete: config.get('autoComplete', true),
        inlineDocumentation: config.get('inlineDocumentation', true),
        codeExplanation: config.get('codeExplanation', true),
        refactoringSuggestions: config.get('refactoringSuggestions', true),
        streamingMode: config.get('streamingMode', true),
        contextWindow: config.get('contextWindow', 32768),
        a2a: {
          enabled: config.get('a2a.enabled', false),
          endpoint: config.get('a2a.endpoint', 'ws://localhost:8080/a2a')
        },
        mcp: {
          enabled: config.get('mcp.enabled', false),
          servers: config.get('mcp.servers', [])
        },
        swarm: {
          enabled: config.get('swarm.enabled', false)
        },
        security: {
          scanEnabled: config.get('security.scanEnabled', true)
        },
        telemetry: {
          enabled: config.get('telemetry.enabled', false)
        }
      };

      this._logger.debug('Configuration loaded', this._config);
    } catch (error) {
      this._logger.error('Failed to load configuration', error as Error);
      throw error;
    }
  }

  /**
   * Get current configuration
   */
  getConfiguration(): GeminiFlowConfig {
    return { ...this._config };
  }

  /**
   * Update a configuration value
   */
  async updateConfiguration<K extends keyof GeminiFlowConfig>(
    key: K,
    value: GeminiFlowConfig[K],
    target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global
  ): Promise<void> {
    try {
      const config = vscode.workspace.getConfiguration('gemini-flow');
      await config.update(key, value, target);
      
      // Update local config
      this._config = { ...this._config, [key]: value };
      
      this._logger.info(`Configuration updated: ${String(key)} = ${JSON.stringify(value)}`);
    } catch (error) {
      this._logger.error(`Failed to update configuration: ${String(key)}`, error as Error);
      throw error;
    }
  }

  /**
   * Update nested configuration value
   */
  async updateNestedConfiguration(
    path: string,
    value: any,
    target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global
  ): Promise<void> {
    try {
      const config = vscode.workspace.getConfiguration('gemini-flow');
      await config.update(path, value, target);
      
      // Update local config
      this.setNestedValue(this._config, path, value);
      
      this._logger.info(`Nested configuration updated: ${path} = ${JSON.stringify(value)}`);
    } catch (error) {
      this._logger.error(`Failed to update nested configuration: ${path}`, error as Error);
      throw error;
    }
  }

  /**
   * Validate configuration
   */
  validateConfiguration(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required fields
    if (!this._config.enabled) {
      return { isValid: true, errors: [] }; // Extension disabled, no validation needed
    }

    if (!this._config.apiKey) {
      errors.push('API key is required');
    }

    if (!this._config.model) {
      errors.push('Model selection is required');
    }

    // Validate model
    const validModels = ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro', 'gemini-flash'];
    if (this._config.model && !validModels.includes(this._config.model)) {
      errors.push(`Invalid model: ${this._config.model}. Valid models: ${validModels.join(', ')}`);
    }

    // Validate context window
    if (this._config.contextWindow < 1024 || this._config.contextWindow > 2097152) {
      errors.push('Context window must be between 1024 and 2097152 tokens');
    }

    // Validate A2A endpoint
    if (this._config.a2a.enabled) {
      try {
        new URL(this._config.a2a.endpoint);
      } catch {
        errors.push('Invalid A2A endpoint URL');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Reset configuration to defaults
   */
  async resetConfiguration(): Promise<void> {
    try {
      const config = vscode.workspace.getConfiguration('gemini-flow');
      const defaultConfig = this.getDefaultConfiguration();

      // Reset all configuration keys
      for (const key of Object.keys(defaultConfig)) {
        await config.update(key, undefined, vscode.ConfigurationTarget.Global);
      }

      // Reload configuration
      await this.loadConfiguration();
      
      this._logger.info('Configuration reset to defaults');
    } catch (error) {
      this._logger.error('Failed to reset configuration', error as Error);
      throw error;
    }
  }

  /**
   * Export configuration to JSON
   */
  exportConfiguration(): string {
    // Remove sensitive data
    const exportConfig = { ...this._config };
    exportConfig.apiKey = '***REDACTED***';
    
    return JSON.stringify(exportConfig, null, 2);
  }

  /**
   * Import configuration from JSON
   */
  async importConfiguration(json: string): Promise<void> {
    try {
      const importedConfig = JSON.parse(json) as Partial<GeminiFlowConfig>;
      
      // Validate imported configuration
      const validation = this.validateImportedConfiguration(importedConfig);
      if (!validation.isValid) {
        throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
      }

      // Update configuration
      const config = vscode.workspace.getConfiguration('gemini-flow');
      for (const [key, value] of Object.entries(importedConfig)) {
        if (key !== 'apiKey') { // Don't import API key for security
          await config.update(key, value, vscode.ConfigurationTarget.Global);
        }
      }

      // Reload configuration
      await this.loadConfiguration();
      
      this._logger.info('Configuration imported successfully');
    } catch (error) {
      this._logger.error('Failed to import configuration', error as Error);
      throw error;
    }
  }

  /**
   * Get default configuration
   */
  private getDefaultConfiguration(): GeminiFlowConfig {
    return {
      enabled: true,
      apiKey: '',
      model: 'gemini-1.5-pro',
      autoComplete: true,
      inlineDocumentation: true,
      codeExplanation: true,
      refactoringSuggestions: true,
      streamingMode: true,
      contextWindow: 32768,
      a2a: {
        enabled: false,
        endpoint: 'ws://localhost:8080/a2a'
      },
      mcp: {
        enabled: false,
        servers: []
      },
      swarm: {
        enabled: false
      },
      security: {
        scanEnabled: true
      },
      telemetry: {
        enabled: false
      }
    };
  }

  /**
   * Set nested value in object
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
  }

  /**
   * Validate imported configuration
   */
  private validateImportedConfiguration(config: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (typeof config !== 'object' || config === null) {
      errors.push('Configuration must be an object');
      return { isValid: false, errors };
    }

    // Validate types and values
    const validators: Record<string, (value: any) => boolean> = {
      enabled: (v) => typeof v === 'boolean',
      model: (v) => typeof v === 'string' && ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro', 'gemini-flash'].includes(v),
      autoComplete: (v) => typeof v === 'boolean',
      inlineDocumentation: (v) => typeof v === 'boolean',
      codeExplanation: (v) => typeof v === 'boolean',
      refactoringSuggestions: (v) => typeof v === 'boolean',
      streamingMode: (v) => typeof v === 'boolean',
      contextWindow: (v) => typeof v === 'number' && v >= 1024 && v <= 2097152
    };

    for (const [key, validator] of Object.entries(validators)) {
      if (key in config && !validator(config[key])) {
        errors.push(`Invalid value for ${key}: ${config[key]}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    // No resources to clean up for configuration manager
  }
}