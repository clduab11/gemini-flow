/**
 * Configuration Management System
 *
 * Features:
 * - Default configuration with validation
 * - User customization via ~/.gemini-flow/config.json
 * - Environment variable support for sensitive data
 * - Schema validation on load
 * - Hot reload support
 * - Config commands (show/set/reset)
 */

import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import os from 'os';
import { getLogger } from './Logger.js';

export interface ThemeColors {
  primary: string;
  secondary: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface A2ASettings {
  enabled: boolean;
  defaultTransport: string;
  timeoutMs: number;
  maxRetries: number;
  securityEnabled: boolean;
}

export interface GoogleAISettings {
  endpoint: string;
  timeoutMs: number;
  maxRetries: number;
  retryDelayMs: number;
  streamingEnabled: boolean;
}

export interface SecuritySettings {
  safeMode: boolean;
  maxCommandLength: number;
  allowedCommands: string[];
  blockedCommands: string[];
  rateLimitPerMinute: number;
  operationTimeoutMs: number;
  sanitizeInputs: boolean;
}

export interface SuperTerminalConfig {
  // Terminal appearance
  theme: ThemeColors;

  // Performance settings
  metricsRefreshRateMs: number;
  historySize: number;

  // Logging configuration
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  logToFile: boolean;
  maxLogFileSizeMB: number;
  maxLogFiles: number;

  // Google AI settings
  googleAI: GoogleAISettings;

  // A2A Protocol settings
  a2a: A2ASettings;

  // Security settings
  security: SecuritySettings;

  // Debug mode
  debugMode: boolean;
}

export const DEFAULT_CONFIG: SuperTerminalConfig = {
  theme: {
    primary: 'cyan',
    secondary: 'blue',
    success: 'green',
    warning: 'yellow',
    error: 'red',
    info: 'white',
  },

  metricsRefreshRateMs: 1000,
  historySize: 1000,

  logLevel: 'info',
  logToFile: true,
  maxLogFileSizeMB: 10,
  maxLogFiles: 5,

  googleAI: {
    endpoint: process.env.GOOGLE_AI_ENDPOINT || 'https://generativelanguage.googleapis.com',
    timeoutMs: 30000,
    maxRetries: 3,
    retryDelayMs: 1000,
    streamingEnabled: true,
  },

  a2a: {
    enabled: true,
    defaultTransport: 'memory',
    timeoutMs: 5000,
    maxRetries: 3,
    securityEnabled: false,
  },

  security: {
    safeMode: false,
    maxCommandLength: 1000,
    allowedCommands: [], // Empty means all allowed
    blockedCommands: ['rm -rf', 'format', 'delete'],
    rateLimitPerMinute: 60,
    operationTimeoutMs: 30000,
    sanitizeInputs: true,
  },

  debugMode: false,
};

export class ConfigManager {
  private static instance: ConfigManager;
  private config: SuperTerminalConfig;
  private configFile: string;
  private logger = getLogger();
  private initialized: boolean = false;

  private constructor() {
    this.config = { ...DEFAULT_CONFIG };
    this.configFile = path.join(os.homedir(), '.gemini-flow', 'config.json');
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /**
   * Initialize configuration (load from file)
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Create config directory if it doesn't exist
      const configDir = path.dirname(this.configFile);
      await fs.mkdir(configDir, { recursive: true });

      // Load config from file if it exists
      if (fsSync.existsSync(this.configFile)) {
        await this.loadFromFile();
      } else {
        // Create default config file
        await this.saveToFile();
      }

      // Override with environment variables
      this.loadFromEnvironment();

      this.initialized = true;
      await this.logger.info('Configuration initialized', {
        configFile: this.configFile,
        debugMode: this.config.debugMode,
        safeMode: this.config.security.safeMode,
      });
    } catch (error) {
      await this.logger.error('Failed to initialize configuration', error as Error);
      this.config = { ...DEFAULT_CONFIG };
      this.initialized = true;
    }
  }

  /**
   * Load configuration from file
   */
  private async loadFromFile(): Promise<void> {
    try {
      const content = await fs.readFile(this.configFile, 'utf-8');
      const userConfig = JSON.parse(content);

      // Validate and merge with defaults
      this.config = this.validateAndMerge(userConfig);

      await this.logger.info('Configuration loaded from file', { configFile: this.configFile });
    } catch (error) {
      await this.logger.error('Failed to load configuration file', error as Error);
      throw new Error(`Invalid configuration file: ${(error as Error).message}`);
    }
  }

  /**
   * Save configuration to file
   */
  private async saveToFile(): Promise<void> {
    try {
      const content = JSON.stringify(this.config, null, 2);
      await fs.writeFile(this.configFile, content, 'utf-8');
      await this.logger.info('Configuration saved to file', { configFile: this.configFile });
    } catch (error) {
      await this.logger.error('Failed to save configuration file', error as Error);
      throw new Error(`Failed to save configuration: ${(error as Error).message}`);
    }
  }

  /**
   * Load overrides from environment variables
   */
  private loadFromEnvironment(): void {
    // Google AI settings
    if (process.env.GOOGLE_AI_ENDPOINT) {
      this.config.googleAI.endpoint = process.env.GOOGLE_AI_ENDPOINT;
    }
    if (process.env.GOOGLE_AI_TIMEOUT) {
      this.config.googleAI.timeoutMs = parseInt(process.env.GOOGLE_AI_TIMEOUT, 10);
    }

    // Security settings
    if (process.env.SUPER_TERMINAL_SAFE_MODE === 'true') {
      this.config.security.safeMode = true;
    }
    if (process.env.SUPER_TERMINAL_DEBUG === 'true') {
      this.config.debugMode = true;
      this.config.logLevel = 'debug';
    }

    // Log level
    if (process.env.LOG_LEVEL) {
      const level = process.env.LOG_LEVEL.toLowerCase();
      if (['debug', 'info', 'warn', 'error'].includes(level)) {
        this.config.logLevel = level as any;
      }
    }
  }

  /**
   * Validate and merge user config with defaults
   */
  private validateAndMerge(userConfig: any): SuperTerminalConfig {
    const merged: SuperTerminalConfig = { ...DEFAULT_CONFIG };

    // Deep merge with validation
    if (userConfig.theme && typeof userConfig.theme === 'object') {
      merged.theme = { ...DEFAULT_CONFIG.theme, ...userConfig.theme };
    }

    if (typeof userConfig.metricsRefreshRateMs === 'number' && userConfig.metricsRefreshRateMs > 0) {
      merged.metricsRefreshRateMs = userConfig.metricsRefreshRateMs;
    }

    if (typeof userConfig.historySize === 'number' && userConfig.historySize > 0) {
      merged.historySize = userConfig.historySize;
    }

    if (['debug', 'info', 'warn', 'error'].includes(userConfig.logLevel)) {
      merged.logLevel = userConfig.logLevel;
    }

    if (typeof userConfig.logToFile === 'boolean') {
      merged.logToFile = userConfig.logToFile;
    }

    if (typeof userConfig.maxLogFileSizeMB === 'number' && userConfig.maxLogFileSizeMB > 0) {
      merged.maxLogFileSizeMB = userConfig.maxLogFileSizeMB;
    }

    if (typeof userConfig.maxLogFiles === 'number' && userConfig.maxLogFiles > 0) {
      merged.maxLogFiles = userConfig.maxLogFiles;
    }

    if (userConfig.googleAI && typeof userConfig.googleAI === 'object') {
      merged.googleAI = { ...DEFAULT_CONFIG.googleAI, ...userConfig.googleAI };
    }

    if (userConfig.a2a && typeof userConfig.a2a === 'object') {
      merged.a2a = { ...DEFAULT_CONFIG.a2a, ...userConfig.a2a };
    }

    if (userConfig.security && typeof userConfig.security === 'object') {
      merged.security = { ...DEFAULT_CONFIG.security, ...userConfig.security };
    }

    if (typeof userConfig.debugMode === 'boolean') {
      merged.debugMode = userConfig.debugMode;
    }

    return merged;
  }

  /**
   * Get current configuration
   */
  getConfig(): SuperTerminalConfig {
    return { ...this.config };
  }

  /**
   * Get specific configuration value
   */
  get<K extends keyof SuperTerminalConfig>(key: K): SuperTerminalConfig[K] {
    return this.config[key];
  }

  /**
   * Set configuration value
   */
  async set<K extends keyof SuperTerminalConfig>(key: K, value: SuperTerminalConfig[K]): Promise<void> {
    // Validate the value
    const testConfig = { ...this.config, [key]: value };
    const validated = this.validateAndMerge(testConfig);

    this.config = validated;
    await this.saveToFile();
    await this.logger.info('Configuration updated', { key, value });
  }

  /**
   * Set nested configuration value
   */
  async setNested(path: string, value: any): Promise<void> {
    const keys = path.split('.');
    const config: any = { ...this.config };

    let current = config;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!(keys[i] in current)) {
        throw new Error(`Invalid configuration path: ${path}`);
      }
      current = current[keys[i]];
    }

    const lastKey = keys[keys.length - 1];
    if (!(lastKey in current)) {
      throw new Error(`Invalid configuration path: ${path}`);
    }

    current[lastKey] = value;

    // Validate and save
    const validated = this.validateAndMerge(config);
    this.config = validated;
    await this.saveToFile();
    await this.logger.info('Configuration updated', { path, value });
  }

  /**
   * Reset configuration to defaults
   */
  async reset(): Promise<void> {
    this.config = { ...DEFAULT_CONFIG };
    await this.saveToFile();
    await this.logger.info('Configuration reset to defaults');
  }

  /**
   * Get configuration as formatted string
   */
  toString(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Get configuration summary
   */
  getSummary(): string {
    return [
      'Super Terminal Configuration',
      '============================',
      '',
      `Config File: ${this.configFile}`,
      `Debug Mode: ${this.config.debugMode ? 'ON' : 'OFF'}`,
      `Safe Mode: ${this.config.security.safeMode ? 'ON' : 'OFF'}`,
      `Log Level: ${this.config.logLevel.toUpperCase()}`,
      `Metrics Refresh: ${this.config.metricsRefreshRateMs}ms`,
      `History Size: ${this.config.historySize} commands`,
      '',
      'Google AI:',
      `  Endpoint: ${this.config.googleAI.endpoint}`,
      `  Timeout: ${this.config.googleAI.timeoutMs}ms`,
      `  Max Retries: ${this.config.googleAI.maxRetries}`,
      `  Streaming: ${this.config.googleAI.streamingEnabled ? 'ON' : 'OFF'}`,
      '',
      'A2A Protocol:',
      `  Enabled: ${this.config.a2a.enabled ? 'YES' : 'NO'}`,
      `  Default Transport: ${this.config.a2a.defaultTransport}`,
      `  Timeout: ${this.config.a2a.timeoutMs}ms`,
      '',
      'Security:',
      `  Rate Limit: ${this.config.security.rateLimitPerMinute} commands/min`,
      `  Operation Timeout: ${this.config.security.operationTimeoutMs}ms`,
      `  Input Sanitization: ${this.config.security.sanitizeInputs ? 'ON' : 'OFF'}`,
      `  Max Command Length: ${this.config.security.maxCommandLength} chars`,
    ].join('\n');
  }

  /**
   * Validate configuration integrity
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate numeric ranges
    if (this.config.metricsRefreshRateMs < 100 || this.config.metricsRefreshRateMs > 10000) {
      errors.push('metricsRefreshRateMs must be between 100 and 10000');
    }

    if (this.config.historySize < 10 || this.config.historySize > 10000) {
      errors.push('historySize must be between 10 and 10000');
    }

    if (this.config.googleAI.timeoutMs < 1000 || this.config.googleAI.timeoutMs > 300000) {
      errors.push('googleAI.timeoutMs must be between 1000 and 300000');
    }

    if (this.config.a2a.timeoutMs < 100 || this.config.a2a.timeoutMs > 60000) {
      errors.push('a2a.timeoutMs must be between 100 and 60000');
    }

    if (this.config.security.rateLimitPerMinute < 1 || this.config.security.rateLimitPerMinute > 1000) {
      errors.push('security.rateLimitPerMinute must be between 1 and 1000');
    }

    if (this.config.security.operationTimeoutMs < 1000 || this.config.security.operationTimeoutMs > 300000) {
      errors.push('security.operationTimeoutMs must be between 1000 and 300000');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton getter
export const getConfig = () => ConfigManager.getInstance();
