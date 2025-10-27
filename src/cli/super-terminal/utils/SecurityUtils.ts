/**
 * Security Utilities
 *
 * Features:
 * - Input validation and sanitization
 * - Command injection prevention
 * - Path traversal protection
 * - Rate limiting
 * - Timeout protection
 */

import path from 'path';
import { getConfig } from './Config.js';
import { getLogger } from './Logger.js';

/**
 * Input validator with comprehensive security checks
 */
export class InputValidator {
  private static logger = getLogger();

  /**
   * Validate command input
   */
  static validateCommand(input: string): { valid: boolean; error?: string; sanitized?: string } {
    const config = getConfig().getConfig();

    // Check length
    if (input.length === 0) {
      return { valid: false, error: 'Command cannot be empty' };
    }

    if (input.length > config.security.maxCommandLength) {
      return {
        valid: false,
        error: `Command too long (max ${config.security.maxCommandLength} characters)`,
      };
    }

    // Check for blocked commands in safe mode
    if (config.security.safeMode) {
      for (const blocked of config.security.blockedCommands) {
        if (input.toLowerCase().includes(blocked.toLowerCase())) {
          return {
            valid: false,
            error: `Command contains blocked pattern: "${blocked}" (safe mode is enabled)`,
          };
        }
      }
    }

    // Sanitize input if enabled
    let sanitized = input;
    if (config.security.sanitizeInputs) {
      sanitized = this.sanitizeInput(input);
    }

    return { valid: true, sanitized };
  }

  /**
   * Sanitize input to prevent injection attacks
   */
  static sanitizeInput(input: string): string {
    // Remove or escape dangerous characters
    let sanitized = input;

    // Remove null bytes
    sanitized = sanitized.replace(/\0/g, '');

    // Trim whitespace
    sanitized = sanitized.trim();

    // Normalize newlines
    sanitized = sanitized.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // Remove excessive whitespace
    sanitized = sanitized.replace(/\s+/g, ' ');

    return sanitized;
  }

  /**
   * Validate agent ID format
   */
  static validateAgentId(id: string): { valid: boolean; error?: string } {
    // Agent IDs should match pattern: name-timestamp
    const pattern = /^[a-z0-9]+-\d+$/;

    if (!pattern.test(id)) {
      return {
        valid: false,
        error: 'Invalid agent ID format (expected: name-timestamp)',
      };
    }

    return { valid: true };
  }

  /**
   * Validate file path to prevent directory traversal
   */
  static validatePath(filePath: string, baseDir?: string): { valid: boolean; error?: string; normalized?: string } {
    try {
      // Normalize the path
      const normalized = path.normalize(filePath);

      // Check for directory traversal attempts
      if (normalized.includes('..')) {
        return {
          valid: false,
          error: 'Path contains directory traversal attempt',
        };
      }

      // If base directory provided, ensure path is within it
      if (baseDir) {
        const absolutePath = path.resolve(baseDir, normalized);
        const absoluteBase = path.resolve(baseDir);

        if (!absolutePath.startsWith(absoluteBase)) {
          return {
            valid: false,
            error: 'Path is outside allowed directory',
          };
        }
      }

      return { valid: true, normalized };
    } catch (error) {
      return {
        valid: false,
        error: `Invalid path: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Validate numeric input
   */
  static validateNumber(
    value: any,
    options: {
      min?: number;
      max?: number;
      integer?: boolean;
    } = {}
  ): { valid: boolean; error?: string; value?: number } {
    const num = Number(value);

    if (isNaN(num)) {
      return { valid: false, error: 'Value must be a number' };
    }

    if (options.integer && !Number.isInteger(num)) {
      return { valid: false, error: 'Value must be an integer' };
    }

    if (options.min !== undefined && num < options.min) {
      return { valid: false, error: `Value must be at least ${options.min}` };
    }

    if (options.max !== undefined && num > options.max) {
      return { valid: false, error: `Value must be at most ${options.max}` };
    }

    return { valid: true, value: num };
  }

  /**
   * Validate URL
   */
  static validateUrl(url: string, allowedProtocols: string[] = ['http', 'https']): { valid: boolean; error?: string } {
    try {
      const parsed = new URL(url);

      if (!allowedProtocols.includes(parsed.protocol.replace(':', ''))) {
        return {
          valid: false,
          error: `Protocol must be one of: ${allowedProtocols.join(', ')}`,
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid URL format',
      };
    }
  }

  /**
   * Validate JSON string
   */
  static validateJson(json: string): { valid: boolean; error?: string; parsed?: any } {
    try {
      const parsed = JSON.parse(json);
      return { valid: true, parsed };
    } catch (error) {
      return {
        valid: false,
        error: `Invalid JSON: ${(error as Error).message}`,
      };
    }
  }
}

/**
 * Rate limiter with sliding window algorithm
 */
export class RateLimiter {
  private static instances: Map<string, RateLimiter> = new Map();
  private timestamps: number[] = [];
  private limit: number;
  private windowMs: number;
  private logger = getLogger();

  private constructor(limit: number, windowMs: number = 60000) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  /**
   * Get rate limiter instance for a specific key
   */
  static getInstance(key: string = 'default'): RateLimiter {
    if (!RateLimiter.instances.has(key)) {
      const config = getConfig().getConfig();
      const limiter = new RateLimiter(config.security.rateLimitPerMinute);
      RateLimiter.instances.set(key, limiter);
    }
    return RateLimiter.instances.get(key)!;
  }

  /**
   * Check if request is allowed
   */
  async checkLimit(): Promise<{ allowed: boolean; retryAfterMs?: number }> {
    const now = Date.now();

    // Remove timestamps outside the window
    this.timestamps = this.timestamps.filter(ts => now - ts < this.windowMs);

    if (this.timestamps.length >= this.limit) {
      const oldestTimestamp = this.timestamps[0];
      const retryAfterMs = this.windowMs - (now - oldestTimestamp);

      await this.logger.warn('Rate limit exceeded', {
        limit: this.limit,
        windowMs: this.windowMs,
        retryAfterMs,
      });

      return {
        allowed: false,
        retryAfterMs: Math.max(0, retryAfterMs),
      };
    }

    // Add current timestamp
    this.timestamps.push(now);

    return { allowed: true };
  }

  /**
   * Reset rate limiter
   */
  reset(): void {
    this.timestamps = [];
  }

  /**
   * Get current usage
   */
  getUsage(): { count: number; limit: number; percentage: number } {
    const now = Date.now();
    this.timestamps = this.timestamps.filter(ts => now - ts < this.windowMs);

    return {
      count: this.timestamps.length,
      limit: this.limit,
      percentage: (this.timestamps.length / this.limit) * 100,
    };
  }
}

/**
 * Timeout protection wrapper
 */
export class TimeoutProtection {
  private static logger = getLogger();

  /**
   * Execute function with timeout protection
   */
  static async execute<T>(
    fn: () => Promise<T>,
    timeoutMs?: number,
    operationName: string = 'operation'
  ): Promise<T> {
    const config = getConfig().getConfig();
    const timeout = timeoutMs ?? config.security.operationTimeoutMs;

    return Promise.race([
      fn(),
      new Promise<T>((_, reject) => {
        setTimeout(() => {
          this.logger.error(`Operation timed out: ${operationName}`, {
            timeoutMs: timeout,
          });
          reject(new Error(`Operation timed out after ${timeout}ms`));
        }, timeout);
      }),
    ]);
  }

  /**
   * Execute with timeout and default value on failure
   */
  static async executeWithDefault<T>(
    fn: () => Promise<T>,
    defaultValue: T,
    timeoutMs?: number,
    operationName: string = 'operation'
  ): Promise<T> {
    try {
      return await this.execute(fn, timeoutMs, operationName);
    } catch (error) {
      await this.logger.warn(`Operation failed, using default value: ${operationName}`, {
        error: (error as Error).message,
      });
      return defaultValue;
    }
  }
}

/**
 * Command injection prevention
 */
export class InjectionPrevention {
  private static logger = getLogger();

  /**
   * Check for shell injection attempts
   */
  static checkShellInjection(input: string): { safe: boolean; threats: string[] } {
    const threats: string[] = [];
    const dangerousPatterns = [
      /[;&|`$()]/g,           // Shell metacharacters
      /\$\{.*\}/g,            // Variable substitution
      /\$\(.*\)/g,            // Command substitution
      /`.*`/g,                // Backtick command execution
      />\s*\/dev\//g,         // Device file redirection
      />\s*&/g,               // File descriptor redirection
      /\|\s*\w+/g,            // Pipe to command
      /&&|\|\|/g,             // Command chaining
      /\beval\b/g,            // Eval execution
      /\bexec\b/g,            // Exec execution
    ];

    for (const pattern of dangerousPatterns) {
      const matches = input.match(pattern);
      if (matches) {
        threats.push(...matches);
      }
    }

    if (threats.length > 0) {
      this.logger.warn('Potential shell injection detected', {
        input,
        threats,
      });
    }

    return {
      safe: threats.length === 0,
      threats,
    };
  }

  /**
   * Escape shell arguments
   */
  static escapeShellArg(arg: string): string {
    // Replace single quotes and wrap in single quotes
    return `'${arg.replace(/'/g, "'\\''")}'`;
  }

  /**
   * Check for SQL injection attempts
   */
  static checkSqlInjection(input: string): { safe: boolean; threats: string[] } {
    const threats: string[] = [];
    const dangerousPatterns = [
      /(\bunion\b.*\bselect\b)/gi,
      /(\bor\b.*=.*)/gi,
      /(\band\b.*=.*)/gi,
      /(\bdrop\b.*\btable\b)/gi,
      /(\bdelete\b.*\bfrom\b)/gi,
      /(\binsert\b.*\binto\b)/gi,
      /(\bupdate\b.*\bset\b)/gi,
      /(--|\#|\/\*)/g,
      /(\bexec\b|\bexecute\b)/gi,
      /(\bxp_\w+)/gi,
    ];

    for (const pattern of dangerousPatterns) {
      const matches = input.match(pattern);
      if (matches) {
        threats.push(...matches);
      }
    }

    if (threats.length > 0) {
      this.logger.warn('Potential SQL injection detected', {
        input,
        threats,
      });
    }

    return {
      safe: threats.length === 0,
      threats,
    };
  }

  /**
   * Check for path traversal attempts
   */
  static checkPathTraversal(input: string): { safe: boolean; threats: string[] } {
    const threats: string[] = [];
    const dangerousPatterns = [
      /\.\.\//g,              // Parent directory
      /\.\.\\+/g,             // Windows parent directory
      /%2e%2e%2f/gi,          // URL encoded ../
      /%2e%2e%5c/gi,          // URL encoded ..\
      /\.\./g,                // Simple ..
    ];

    for (const pattern of dangerousPatterns) {
      const matches = input.match(pattern);
      if (matches) {
        threats.push(...matches);
      }
    }

    if (threats.length > 0) {
      this.logger.warn('Potential path traversal detected', {
        input,
        threats,
      });
    }

    return {
      safe: threats.length === 0,
      threats,
    };
  }
}
