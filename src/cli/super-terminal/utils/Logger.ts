/**
 * Logging System for Super Terminal
 *
 * Features:
 * - Multiple log levels (debug, info, warn, error)
 * - File rotation (10MB max per file, keep 5 files)
 * - Timestamps and context tracking
 * - Structured logging with metadata
 * - Console and file output
 * - Debug mode support
 */

import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import os from 'os';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export interface LoggerOptions {
  logLevel?: LogLevel;
  logDir?: string;
  maxFileSize?: number;
  maxFiles?: number;
  consoleOutput?: boolean;
  debugMode?: boolean;
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private logDir: string;
  private maxFileSize: number;
  private maxFiles: number;
  private consoleOutput: boolean;
  private debugMode: boolean;
  private currentLogFile: string;
  private initialized: boolean = false;

  private constructor(options: LoggerOptions = {}) {
    this.logLevel = options.logLevel ?? LogLevel.INFO;
    this.logDir = options.logDir ?? path.join(os.homedir(), '.gemini-flow', 'logs');
    this.maxFileSize = options.maxFileSize ?? 10 * 1024 * 1024; // 10MB
    this.maxFiles = options.maxFiles ?? 5;
    this.consoleOutput = options.consoleOutput ?? false;
    this.debugMode = options.debugMode ?? false;
    this.currentLogFile = path.join(this.logDir, 'super-terminal.log');
  }

  /**
   * Get singleton instance
   */
  static getInstance(options?: LoggerOptions): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(options);
    }
    return Logger.instance;
  }

  /**
   * Initialize logger (create directories, etc.)
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Create log directory if it doesn't exist
      await fs.mkdir(this.logDir, { recursive: true });
      this.initialized = true;
      await this.info('Logger initialized', { logDir: this.logDir });
    } catch (error) {
      console.error('Failed to initialize logger:', error);
      this.initialized = false;
    }
  }

  /**
   * Set debug mode
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
    if (enabled) {
      this.logLevel = LogLevel.DEBUG;
    }
  }

  /**
   * Set log level
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Enable/disable console output
   */
  setConsoleOutput(enabled: boolean): void {
    this.consoleOutput = enabled;
  }

  /**
   * Debug level logging
   */
  async debug(message: string, context?: Record<string, any>): Promise<void> {
    await this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Info level logging
   */
  async info(message: string, context?: Record<string, any>): Promise<void> {
    await this.log(LogLevel.INFO, message, context);
  }

  /**
   * Warning level logging
   */
  async warn(message: string, context?: Record<string, any>): Promise<void> {
    await this.log(LogLevel.WARN, message, context);
  }

  /**
   * Error level logging
   */
  async error(message: string, errorOrContext?: Error | Record<string, any>, context?: Record<string, any>): Promise<void> {
    let errorInfo: LogEntry['error'] | undefined;
    let contextData = context;

    if (errorOrContext instanceof Error) {
      errorInfo = {
        name: errorOrContext.name,
        message: errorOrContext.message,
        stack: this.debugMode ? errorOrContext.stack : undefined,
      };
    } else if (errorOrContext) {
      contextData = errorOrContext;
    }

    await this.log(LogLevel.ERROR, message, contextData, errorInfo);
  }

  /**
   * Core logging method
   */
  private async log(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: LogEntry['error']
  ): Promise<void> {
    // Skip if below log level
    if (level < this.logLevel) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      message,
      context,
      error,
    };

    // Console output
    if (this.consoleOutput || this.debugMode) {
      this.logToConsole(entry);
    }

    // File output
    if (this.initialized) {
      await this.logToFile(entry);
    }
  }

  /**
   * Log to console with colors
   */
  private logToConsole(entry: LogEntry): void {
    const colors = {
      DEBUG: '\x1b[36m', // Cyan
      INFO: '\x1b[32m',  // Green
      WARN: '\x1b[33m',  // Yellow
      ERROR: '\x1b[31m', // Red
    };
    const reset = '\x1b[0m';

    const color = colors[entry.level as keyof typeof colors] || '';
    let logLine = `${color}[${entry.timestamp}] ${entry.level}${reset}: ${entry.message}`;

    if (entry.context) {
      logLine += ` ${JSON.stringify(entry.context)}`;
    }

    if (entry.error) {
      logLine += `\n  Error: ${entry.error.name}: ${entry.error.message}`;
      if (entry.error.stack) {
        logLine += `\n  Stack: ${entry.error.stack}`;
      }
    }

    console.log(logLine);
  }

  /**
   * Log to file with rotation
   */
  private async logToFile(entry: LogEntry): Promise<void> {
    try {
      // Check file size and rotate if needed
      await this.rotateIfNeeded();

      // Format log entry
      const logLine = JSON.stringify(entry) + '\n';

      // Append to file
      await fs.appendFile(this.currentLogFile, logLine, 'utf-8');
    } catch (error) {
      // Silently fail to avoid infinite recursion
      if (this.consoleOutput) {
        console.error('Failed to write to log file:', error);
      }
    }
  }

  /**
   * Rotate log files if current file exceeds max size
   */
  private async rotateIfNeeded(): Promise<void> {
    try {
      const stats = await fs.stat(this.currentLogFile);

      if (stats.size >= this.maxFileSize) {
        await this.rotateLogs();
      }
    } catch (error: any) {
      // File doesn't exist yet, that's fine
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * Rotate log files
   */
  private async rotateLogs(): Promise<void> {
    try {
      // Delete oldest file if exists
      const oldestFile = path.join(this.logDir, `super-terminal.log.${this.maxFiles}`);
      try {
        await fs.unlink(oldestFile);
      } catch {
        // File doesn't exist, ignore
      }

      // Rotate existing files
      for (let i = this.maxFiles - 1; i >= 1; i--) {
        const oldFile = path.join(this.logDir, `super-terminal.log.${i}`);
        const newFile = path.join(this.logDir, `super-terminal.log.${i + 1}`);

        try {
          await fs.rename(oldFile, newFile);
        } catch {
          // File doesn't exist, ignore
        }
      }

      // Rotate current log file
      const firstRotated = path.join(this.logDir, 'super-terminal.log.1');
      await fs.rename(this.currentLogFile, firstRotated);

    } catch (error) {
      if (this.consoleOutput) {
        console.error('Failed to rotate log files:', error);
      }
    }
  }

  /**
   * Get recent log entries
   */
  async getRecentLogs(count: number = 100): Promise<LogEntry[]> {
    try {
      const content = await fs.readFile(this.currentLogFile, 'utf-8');
      const lines = content.trim().split('\n');
      const entries: LogEntry[] = [];

      // Parse last N lines
      const startIndex = Math.max(0, lines.length - count);
      for (let i = startIndex; i < lines.length; i++) {
        try {
          const entry = JSON.parse(lines[i]);
          entries.push(entry);
        } catch {
          // Skip malformed lines
        }
      }

      return entries;
    } catch (error) {
      return [];
    }
  }

  /**
   * Clear all log files
   */
  async clearLogs(): Promise<void> {
    try {
      const files = await fs.readdir(this.logDir);
      for (const file of files) {
        if (file.startsWith('super-terminal.log')) {
          await fs.unlink(path.join(this.logDir, file));
        }
      }
      await this.info('All log files cleared');
    } catch (error) {
      await this.error('Failed to clear log files', error as Error);
    }
  }

  /**
   * Get log statistics
   */
  async getLogStats(): Promise<{
    totalSize: number;
    fileCount: number;
    oldestEntry: string | null;
    newestEntry: string | null;
  }> {
    try {
      const files = await fs.readdir(this.logDir);
      const logFiles = files.filter(f => f.startsWith('super-terminal.log'));

      let totalSize = 0;
      let oldestEntry: string | null = null;
      let newestEntry: string | null = null;

      for (const file of logFiles) {
        const filePath = path.join(this.logDir, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;

        // Read first and last entries
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const lines = content.trim().split('\n');

          if (lines.length > 0) {
            const firstEntry = JSON.parse(lines[0]);
            const lastEntry = JSON.parse(lines[lines.length - 1]);

            if (!oldestEntry || firstEntry.timestamp < oldestEntry) {
              oldestEntry = firstEntry.timestamp;
            }
            if (!newestEntry || lastEntry.timestamp > newestEntry) {
              newestEntry = lastEntry.timestamp;
            }
          }
        } catch {
          // Skip malformed files
        }
      }

      return {
        totalSize,
        fileCount: logFiles.length,
        oldestEntry,
        newestEntry,
      };
    } catch (error) {
      return {
        totalSize: 0,
        fileCount: 0,
        oldestEntry: null,
        newestEntry: null,
      };
    }
  }
}

// Export singleton getter
export const getLogger = (options?: LoggerOptions) => Logger.getInstance(options);
