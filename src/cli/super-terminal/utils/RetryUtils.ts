/**
 * Retry Logic Utilities
 *
 * Features:
 * - Exponential backoff retry
 * - Configurable retry strategies
 * - Transient error detection
 * - Circuit breaker pattern
 */

import { getLogger } from './Logger.js';
import { getConfig } from './Config.js';

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
  onRetry?: (attempt: number, error: Error) => void;
}

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeoutMs?: number;
  monitoringPeriodMs?: number;
}

/**
 * Retry utility with exponential backoff
 */
export class RetryStrategy {
  private static logger = getLogger();

  /**
   * Execute function with retry logic
   */
  static async execute<T>(
    fn: () => Promise<T>,
    operationName: string,
    options: RetryOptions = {}
  ): Promise<T> {
    const config = getConfig().getConfig();

    const maxRetries = options.maxRetries ?? config.googleAI.maxRetries;
    const initialDelayMs = options.initialDelayMs ?? config.googleAI.retryDelayMs;
    const maxDelayMs = options.maxDelayMs ?? 30000;
    const backoffMultiplier = options.backoffMultiplier ?? 2;
    const retryableErrors = options.retryableErrors ?? [
      'ECONNREFUSED',
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'EAI_AGAIN',
      'ENETUNREACH',
      'EHOSTUNREACH',
    ];

    let lastError: Error;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        const result = await fn();

        if (attempt > 0) {
          await this.logger.info(`Operation succeeded after ${attempt} retries`, {
            operationName,
            attempts: attempt,
          });
        }

        return result;
      } catch (error) {
        lastError = error as Error;
        attempt++;

        // Check if error is retryable
        const isRetryable = this.isRetryableError(lastError, retryableErrors);

        if (!isRetryable || attempt > maxRetries) {
          await this.logger.error(`Operation failed after ${attempt} attempts`, lastError, {
            operationName,
            attempts: attempt,
            retryable: isRetryable,
          });
          throw lastError;
        }

        // Calculate delay with exponential backoff
        const delayMs = Math.min(
          initialDelayMs * Math.pow(backoffMultiplier, attempt - 1),
          maxDelayMs
        );

        await this.logger.warn(`Retrying operation (attempt ${attempt}/${maxRetries})`, {
          operationName,
          error: lastError.message,
          delayMs,
        });

        // Call retry callback if provided
        if (options.onRetry) {
          options.onRetry(attempt, lastError);
        }

        // Wait before retrying
        await this.delay(delayMs);
      }
    }

    throw lastError!;
  }

  /**
   * Check if error is retryable
   */
  private static isRetryableError(error: Error, retryableErrors: string[]): boolean {
    const errorMessage = error.message.toUpperCase();
    const errorCode = (error as any).code?.toUpperCase() || '';

    // Check if error code or message contains retryable patterns
    for (const pattern of retryableErrors) {
      if (errorCode.includes(pattern.toUpperCase()) || errorMessage.includes(pattern.toUpperCase())) {
        return true;
      }
    }

    // Check for common transient error patterns
    const transientPatterns = [
      'TIMEOUT',
      'TIMED OUT',
      'CONNECTION',
      'NETWORK',
      'UNAVAILABLE',
      'SERVICE UNAVAILABLE',
      'TOO MANY REQUESTS',
      'RATE LIMIT',
      '429',
      '503',
      '504',
    ];

    for (const pattern of transientPatterns) {
      if (errorMessage.includes(pattern)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Delay utility
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Execute with fallback value on failure
   */
  static async executeWithFallback<T>(
    fn: () => Promise<T>,
    fallbackValue: T,
    operationName: string,
    options: RetryOptions = {}
  ): Promise<T> {
    try {
      return await this.execute(fn, operationName, options);
    } catch (error) {
      await this.logger.warn(`Using fallback value for ${operationName}`, {
        error: (error as Error).message,
      });
      return fallbackValue;
    }
  }
}

/**
 * Circuit breaker pattern implementation
 */
export class CircuitBreaker {
  private static logger = getLogger();
  private static instances: Map<string, CircuitBreaker> = new Map();

  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private successCount: number = 0;
  private failureThreshold: number;
  private resetTimeoutMs: number;
  private monitoringPeriodMs: number;

  private constructor(options: CircuitBreakerOptions = {}) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.resetTimeoutMs = options.resetTimeoutMs ?? 60000; // 1 minute
    this.monitoringPeriodMs = options.monitoringPeriodMs ?? 10000; // 10 seconds
  }

  /**
   * Get circuit breaker instance for a specific service
   */
  static getInstance(serviceName: string, options?: CircuitBreakerOptions): CircuitBreaker {
    if (!CircuitBreaker.instances.has(serviceName)) {
      CircuitBreaker.instances.set(serviceName, new CircuitBreaker(options));
    }
    return CircuitBreaker.instances.get(serviceName)!;
  }

  /**
   * Execute function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>, operationName: string): Promise<T> {
    // Check circuit state
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime >= this.resetTimeoutMs) {
        await CircuitBreaker.logger.info('Circuit breaker transitioning to HALF_OPEN', {
          operationName,
        });
        this.state = 'HALF_OPEN';
        this.successCount = 0;
      } else {
        const error = new Error('Circuit breaker is OPEN - service unavailable');
        await CircuitBreaker.logger.warn('Circuit breaker blocked request', {
          operationName,
          state: this.state,
        });
        throw error;
      }
    }

    try {
      const result = await fn();
      this.onSuccess(operationName);
      return result;
    } catch (error) {
      this.onFailure(operationName, error as Error);
      throw error;
    }
  }

  /**
   * Handle successful execution
   */
  private async onSuccess(operationName: string): Promise<void> {
    this.successCount++;

    if (this.state === 'HALF_OPEN') {
      if (this.successCount >= 2) {
        await CircuitBreaker.logger.info('Circuit breaker transitioning to CLOSED', {
          operationName,
          successCount: this.successCount,
        });
        this.state = 'CLOSED';
        this.failureCount = 0;
        this.successCount = 0;
      }
    } else if (this.state === 'CLOSED') {
      // Reset failure count on successful execution
      this.failureCount = 0;
    }
  }

  /**
   * Handle failed execution
   */
  private async onFailure(operationName: string, error: Error): Promise<void> {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === 'HALF_OPEN') {
      await CircuitBreaker.logger.warn('Circuit breaker transitioning to OPEN (failed in HALF_OPEN)', {
        operationName,
        error: error.message,
      });
      this.state = 'OPEN';
    } else if (this.state === 'CLOSED' && this.failureCount >= this.failureThreshold) {
      await CircuitBreaker.logger.error('Circuit breaker transitioning to OPEN (threshold reached)', {
        operationName,
        failureCount: this.failureCount,
        threshold: this.failureThreshold,
      });
      this.state = 'OPEN';
    }
  }

  /**
   * Get circuit breaker state
   */
  getState(): 'CLOSED' | 'OPEN' | 'HALF_OPEN' {
    return this.state;
  }

  /**
   * Reset circuit breaker
   */
  reset(): void {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
  }

  /**
   * Get circuit breaker statistics
   */
  getStats(): {
    state: string;
    failureCount: number;
    successCount: number;
    lastFailureTime: number | null;
  } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime > 0 ? this.lastFailureTime : null,
    };
  }
}

/**
 * Batch retry utility for multiple operations
 */
export class BatchRetry {
  private static logger = getLogger();

  /**
   * Execute multiple operations with individual retry logic
   */
  static async executeAll<T>(
    operations: Array<{ fn: () => Promise<T>; name: string }>,
    options: RetryOptions = {}
  ): Promise<Array<{ success: boolean; result?: T; error?: Error; name: string }>> {
    const results = await Promise.allSettled(
      operations.map(async op => {
        try {
          const result = await RetryStrategy.execute(op.fn, op.name, options);
          return { success: true, result, name: op.name };
        } catch (error) {
          return { success: false, error: error as Error, name: op.name };
        }
      })
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          success: false,
          error: result.reason,
          name: operations[index].name,
        };
      }
    });
  }

  /**
   * Execute operations with partial success tolerance
   */
  static async executeWithTolerance<T>(
    operations: Array<{ fn: () => Promise<T>; name: string }>,
    minSuccessCount: number,
    options: RetryOptions = {}
  ): Promise<{ results: T[]; failures: Array<{ name: string; error: Error }> }> {
    const results = await this.executeAll(operations, options);

    const successes = results.filter(r => r.success);
    const failures = results.filter(r => !r.success);

    if (successes.length < minSuccessCount) {
      await this.logger.error('Batch operation failed - insufficient successes', {
        successCount: successes.length,
        requiredCount: minSuccessCount,
        failureCount: failures.length,
      });
      throw new Error(
        `Batch operation failed: only ${successes.length}/${minSuccessCount} operations succeeded`
      );
    }

    if (failures.length > 0) {
      await this.logger.warn('Batch operation completed with some failures', {
        successCount: successes.length,
        failureCount: failures.length,
      });
    }

    return {
      results: successes.map(r => r.result!),
      failures: failures.map(r => ({ name: r.name, error: r.error! })),
    };
  }
}
