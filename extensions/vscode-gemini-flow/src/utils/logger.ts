/**
 * Logger utility for the Gemini Flow extension
 */

import * as vscode from 'vscode';
import { LogLevel } from '../types';

export class Logger implements vscode.Disposable {
  private readonly _outputChannel: vscode.OutputChannel;
  private readonly _logLevel: LogLevel;

  constructor(
    private readonly _name: string,
    private readonly _context: vscode.ExtensionContext,
    logLevel: LogLevel = 'info'
  ) {
    this._outputChannel = vscode.window.createOutputChannel(`${_name} Logs`);
    this._logLevel = logLevel;

    // Add to context subscriptions for automatic disposal
    _context.subscriptions.push(this._outputChannel);
  }

  /**
   * Log debug message
   */
  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      this.log('DEBUG', message, ...args);
    }
  }

  /**
   * Log info message
   */
  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      this.log('INFO', message, ...args);
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      this.log('WARN', message, ...args);
    }
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error, ...args: any[]): void {
    if (this.shouldLog('error')) {
      const errorDetails = error ? `\\n${error.stack || error.message}` : '';
      this.log('ERROR', `${message}${errorDetails}`, ...args);
    }
  }

  /**
   * Show the output channel
   */
  show(): void {
    this._outputChannel.show();
  }

  /**
   * Clear the output channel
   */
  clear(): void {
    this._outputChannel.clear();
  }

  /**
   * Internal log method
   */
  private log(level: string, message: string, ...args: any[]): void {
    const timestamp = new Date().toISOString();
    const formattedMessage = args.length > 0 
      ? `${message} ${args.map(arg => JSON.stringify(arg)).join(' ')}`
      : message;
    
    const logEntry = `[${timestamp}] [${level}] ${formattedMessage}`;
    this._outputChannel.appendLine(logEntry);

    // Also log to console in development
    if (this._context.extensionMode === vscode.ExtensionMode.Development) {
      console.log(`[${this._name}] ${logEntry}`);
    }
  }

  /**
   * Check if we should log at the given level
   */
  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };

    return levels[level] >= levels[this._logLevel];
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    this._outputChannel.dispose();
  }
}