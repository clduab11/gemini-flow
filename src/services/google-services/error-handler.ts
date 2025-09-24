/**
 * Enhanced Error Handler for Google AI Services
 *
 * Comprehensive error handling, retry logic, circuit breaker patterns,
 * and graceful degradation for Google AI service clients.
 */

import { EventEmitter } from "node:events";
import { Logger } from "../../utils/logger.js";
import { ServiceResponse, ServiceError } from "./interfaces.js";

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffStrategy: "fixed" | "exponential" | "linear";
  retryableErrors: string[];
  jitter: boolean;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
  successThreshold: number;
}

export interface ErrorContext {
  service: string;
  operation: string;
  requestId: string;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsByType: Map<string, number>;
  errorsByService: Map<string, number>;
  averageResponseTime: number;
  lastErrorTime?: Date;
  circuitBreakerState: "closed" | "open" | "half-open";
}

export enum ErrorSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum ErrorCategory {
  NETWORK = "network",
  AUTHENTICATION = "authentication",
  AUTHORIZATION = "authorization",
  VALIDATION = "validation",
  RATE_LIMIT = "rate_limit",
  QUOTA_EXCEEDED = "quota_exceeded",
  SERVICE_UNAVAILABLE = "service_unavailable",
  TIMEOUT = "timeout",
  RESOURCE_EXHAUSTED = "resource_exhausted",
  UNKNOWN = "unknown",
}

export class GoogleAIErrorHandler extends EventEmitter {
  private logger: Logger;
  private retryConfig: RetryConfig;
  private circuitBreakerConfig: CircuitBreakerConfig;
  private errorMetrics: Map<string, ErrorMetrics> = new Map();
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private activeRetries: Map<string, RetryState> = new Map();

  constructor(
    retryConfig: RetryConfig,
    circuitBreakerConfig: CircuitBreakerConfig,
  ) {
    super();
    this.retryConfig = retryConfig;
    this.circuitBreakerConfig = circuitBreakerConfig;
    this.logger = new Logger("GoogleAIErrorHandler");

    this.initializeErrorHandling();
    this.setupEventHandlers();
  }

  /**
   * Executes an operation with comprehensive error handling and retry logic
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
  ): Promise<ServiceResponse<T>> {
    const startTime = Date.now();
    const operationId = this.generateOperationId();

    try {
      this.logger.debug("Executing operation with retry", {
        operationId,
        service: context.service,
        operation: context.operation,
      });

      // Check circuit breaker
      if (this.isCircuitOpen(context.service)) {
        throw this.createCircuitBreakerError(context.service);
      }

      // Execute with retry logic
      const result = await this.executeWithRetryLogic(operation, context, operationId);

      // Record success metrics
      this.recordSuccess(context, Date.now() - startTime);

      return {
        success: true,
        data: result,
        metadata: {
          requestId: context.requestId,
          timestamp: new Date(),
          processingTime: Date.now() - startTime,
          region: "local",
        },
      };
    } catch (error) {
      // Record error metrics
      this.recordError(context, error, Date.now() - startTime);

      // Handle circuit breaker
      this.handleCircuitBreaker(context.service, error);

      // Create error response
      const errorResponse = this.createErrorResponse(error, context, Date.now() - startTime);

      this.emit("operation:error", {
        operationId,
        context,
        error: errorResponse.error,
      });

      return errorResponse;
    }
  }

  /**
   * Handles streaming operations with error recovery
   */
  async executeStreamingWithRetry<T>(
    operation: () => AsyncGenerator<T>,
    context: ErrorContext,
  ): Promise<ServiceResponse<AsyncGenerator<T>>> {
    const operationId = this.generateOperationId();

    try {
      this.logger.debug("Executing streaming operation with retry", {
        operationId,
        service: context.service,
        operation: context.operation,
      });

      // Check circuit breaker
      if (this.isCircuitOpen(context.service)) {
        throw this.createCircuitBreakerError(context.service);
      }

      // Execute streaming operation with error recovery
      const streamingOperation = this.createResilientStreamingOperation(
        operation,
        context,
        operationId,
      );

      return {
        success: true,
        data: streamingOperation,
        metadata: {
          requestId: context.requestId,
          timestamp: new Date(),
          processingTime: 0,
          region: "local",
        },
      };
    } catch (error) {
      const errorResponse = this.createErrorResponse(error, context, 0);
      this.emit("streaming:error", { operationId, context, error: errorResponse.error });
      return errorResponse;
    }
  }

  /**
   * Gets comprehensive error metrics
   */
  getErrorMetrics(service?: string): ErrorMetrics | Map<string, ErrorMetrics> {
    if (service) {
      return this.errorMetrics.get(service) || this.createDefaultMetrics();
    }
    return new Map(this.errorMetrics);
  }

  /**
   * Resets error metrics for a service
   */
  resetMetrics(service: string): void {
    this.errorMetrics.delete(service);
    this.logger.info("Reset error metrics", { service });
  }

  /**
   * Forces circuit breaker state change
   */
  setCircuitBreakerState(service: string, state: "closed" | "open" | "half-open"): void {
    const circuitBreaker = this.circuitBreakers.get(service);
    if (circuitBreaker) {
      circuitBreaker.state = state;
      circuitBreaker.lastStateChange = new Date();

      this.logger.info("Circuit breaker state changed", {
        service,
        state,
        forced: true,
      });

      this.emit("circuit_breaker:state_changed", { service, state, forced: true });
    }
  }

  /**
   * Gets circuit breaker status for all services
   */
  getCircuitBreakerStatus(): Map<string, CircuitBreakerState> {
    return new Map(this.circuitBreakers);
  }

  // ==================== Private Helper Methods ====================

  private async executeWithRetryLogic<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    operationId: string,
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        // Check if we should retry this attempt
        if (attempt > 0) {
          const shouldRetry = this.shouldRetry(lastError, attempt);
          if (!shouldRetry) {
            throw lastError;
          }

          // Wait before retry
          const delay = this.calculateRetryDelay(attempt);
          await this.delay(delay);

          this.logger.debug("Retrying operation", {
            operationId,
            attempt,
            delay,
            service: context.service,
          });
        }

        // Track active retry
        this.activeRetries.set(operationId, {
          attempt,
          startTime: new Date(),
          lastError: attempt > 0 ? lastError : undefined,
        });

        const result = await operation();

        // Clean up retry state on success
        this.activeRetries.delete(operationId);

        return result;
      } catch (error) {
        lastError = error;

        this.logger.warn("Operation attempt failed", {
          operationId,
          attempt,
          error: error.message,
          service: context.service,
        });

        // Clean up retry state on final failure
        if (attempt === this.retryConfig.maxRetries) {
          this.activeRetries.delete(operationId);
        }
      }
    }

    throw lastError;
  }

  private shouldRetry(error: any, attempt: number): boolean {
    // Don't retry if we've exceeded max retries
    if (attempt >= this.retryConfig.maxRetries) {
      return false;
    }

    // Check if error is retryable
    const errorCode = this.categorizeError(error);
    return this.retryConfig.retryableErrors.includes(errorCode);
  }

  private calculateRetryDelay(attempt: number): number {
    let delay: number;

    switch (this.retryConfig.backoffStrategy) {
      case "fixed":
        delay = this.retryConfig.initialDelay;
        break;
      case "exponential":
        delay = this.retryConfig.initialDelay * Math.pow(2, attempt);
        break;
      case "linear":
        delay = this.retryConfig.initialDelay * (attempt + 1);
        break;
      default:
        delay = this.retryConfig.initialDelay;
    }

    // Apply maximum delay limit
    delay = Math.min(delay, this.retryConfig.maxDelay);

    // Add jitter if enabled
    if (this.retryConfig.jitter) {
      const jitter = delay * 0.1 * Math.random();
      delay += jitter;
    }

    return delay;
  }

  private createResilientStreamingOperation<T>(
    operation: () => AsyncGenerator<T>,
    context: ErrorContext,
    operationId: string,
  ): AsyncGenerator<T> {
    return {
      [Symbol.asyncIterator]: async function* () {
        let attempt = 0;
        let lastError: any;

        while (attempt <= this.retryConfig.maxRetries) {
          try {
            const generator = await operation();

            for await (const item of generator) {
              yield item;
            }

            return; // Success, exit retry loop
          } catch (error) {
            lastError = error;
            attempt++;

            this.logger.warn("Streaming operation failed", {
              operationId,
              attempt,
              error: error.message,
            });

            if (attempt <= this.retryConfig.maxRetries) {
              const delay = this.calculateRetryDelay(attempt);
              await this.delay(delay);

              this.logger.debug("Retrying streaming operation", {
                operationId,
                attempt,
                delay,
              });
            }
          }
        }

        throw lastError;
      }.bind(this),
    };
  }

  private categorizeError(error: any): ErrorCategory {
    const errorMessage = error.message?.toLowerCase() || "";
    const errorCode = error.code?.toLowerCase() || "";

    if (errorMessage.includes("rate limit") || errorCode.includes("rate_limit")) {
      return ErrorCategory.RATE_LIMIT;
    }

    if (errorMessage.includes("quota") || errorCode.includes("quota")) {
      return ErrorCategory.QUOTA_EXCEEDED;
    }

    if (errorMessage.includes("timeout") || errorCode.includes("timeout")) {
      return ErrorCategory.TIMEOUT;
    }

    if (errorMessage.includes("network") || errorCode.includes("network")) {
      return ErrorCategory.NETWORK;
    }

    if (errorMessage.includes("auth") || errorCode.includes("auth")) {
      return ErrorCategory.AUTHENTICATION;
    }

    if (errorMessage.includes("forbidden") || errorCode === "403") {
      return ErrorCategory.AUTHORIZATION;
    }

    if (errorMessage.includes("validation") || errorCode.includes("validation")) {
      return ErrorCategory.VALIDATION;
    }

    if (errorMessage.includes("unavailable") || errorCode === "503") {
      return ErrorCategory.SERVICE_UNAVAILABLE;
    }

    if (errorMessage.includes("resource") || errorCode.includes("resource")) {
      return ErrorCategory.RESOURCE_EXHAUSTED;
    }

    return ErrorCategory.UNKNOWN;
  }

  private isCircuitOpen(service: string): boolean {
    const circuitBreaker = this.circuitBreakers.get(service);
    return circuitBreaker?.state === "open";
  }

  private createCircuitBreakerError(service: string): Error {
    const error = new Error(`Circuit breaker is open for service: ${service}`);
    error.name = "CircuitBreakerError";
    return error;
  }

  private handleCircuitBreaker(service: string, error: any): void {
    const circuitBreaker = this.circuitBreakers.get(service) || this.createCircuitBreaker(service);

    if (this.isFailureError(error)) {
      circuitBreaker.failureCount++;

      if (circuitBreaker.failureCount >= this.circuitBreakerConfig.failureThreshold) {
        this.openCircuitBreaker(circuitBreaker, service);
      }
    } else if (circuitBreaker.state === "half-open" && this.isSuccessResponse(error)) {
      this.closeCircuitBreaker(circuitBreaker, service);
    }
  }

  private isFailureError(error: any): boolean {
    const category = this.categorizeError(error);
    return [
      ErrorCategory.NETWORK,
      ErrorCategory.SERVICE_UNAVAILABLE,
      ErrorCategory.TIMEOUT,
    ].includes(category);
  }

  private isSuccessResponse(error: any): boolean {
    return !error || error.name !== "Error";
  }

  private createCircuitBreaker(service: string): CircuitBreakerState {
    const circuitBreaker: CircuitBreakerState = {
      service,
      state: "closed",
      failureCount: 0,
      successCount: 0,
      lastStateChange: new Date(),
      lastFailureTime: undefined,
      nextAttemptTime: undefined,
    };

    this.circuitBreakers.set(service, circuitBreaker);
    return circuitBreaker;
  }

  private openCircuitBreaker(circuitBreaker: CircuitBreakerState, service: string): void {
    circuitBreaker.state = "open";
    circuitBreaker.lastStateChange = new Date();
    circuitBreaker.nextAttemptTime = new Date(
      Date.now() + this.circuitBreakerConfig.resetTimeout,
    );

    this.logger.warn("Circuit breaker opened", {
      service,
      failureCount: circuitBreaker.failureCount,
    });

    this.emit("circuit_breaker:opened", { service, failureCount: circuitBreaker.failureCount });
  }

  private closeCircuitBreaker(circuitBreaker: CircuitBreakerState, service: string): void {
    circuitBreaker.state = "closed";
    circuitBreaker.lastStateChange = new Date();
    circuitBreaker.failureCount = 0;
    circuitBreaker.successCount = 0;
    circuitBreaker.nextAttemptTime = undefined;

    this.logger.info("Circuit breaker closed", { service });

    this.emit("circuit_breaker:closed", { service });
  }

  private recordSuccess(context: ErrorContext, responseTime: number): void {
    const metrics = this.getOrCreateMetrics(context.service);
    metrics.totalErrors = 0; // Reset error count on success
    metrics.averageResponseTime =
      (metrics.averageResponseTime + responseTime) / 2;
    metrics.lastErrorTime = undefined;
  }

  private recordError(context: ErrorContext, error: any, responseTime: number): void {
    const metrics = this.getOrCreateMetrics(context.service);
    metrics.totalErrors++;
    metrics.averageResponseTime =
      (metrics.averageResponseTime + responseTime) / 2;
    metrics.lastErrorTime = new Date();

    // Record error by type
    const errorCategory = this.categorizeError(error);
    const currentCount = metrics.errorsByType.get(errorCategory) || 0;
    metrics.errorsByType.set(errorCategory, currentCount + 1);
  }

  private getOrCreateMetrics(service: string): ErrorMetrics {
    if (!this.errorMetrics.has(service)) {
      this.errorMetrics.set(service, this.createDefaultMetrics());
    }
    return this.errorMetrics.get(service)!;
  }

  private createDefaultMetrics(): ErrorMetrics {
    return {
      totalErrors: 0,
      errorsByType: new Map(),
      errorsByService: new Map(),
      averageResponseTime: 0,
      circuitBreakerState: "closed",
    };
  }

  private createErrorResponse(
    error: any,
    context: ErrorContext,
    responseTime: number,
  ): ServiceResponse<any> {
    const errorCategory = this.categorizeError(error);
    const severity = this.getErrorSeverity(errorCategory);
    const retryable = this.shouldRetry(error, 1);

    return {
      success: false,
      error: {
        code: errorCategory,
        message: error.message || "Unknown error occurred",
        details: {
          originalError: error,
          context,
          severity,
          retryable,
        },
        retryable,
        timestamp: new Date(),
      },
      metadata: {
        requestId: context.requestId,
        timestamp: new Date(),
        processingTime: responseTime,
        region: "local",
      },
    };
  }

  private getErrorSeverity(category: ErrorCategory): ErrorSeverity {
    switch (category) {
      case ErrorCategory.AUTHENTICATION:
      case ErrorCategory.AUTHORIZATION:
        return ErrorSeverity.HIGH;
      case ErrorCategory.RATE_LIMIT:
      case ErrorCategory.QUOTA_EXCEEDED:
        return ErrorSeverity.MEDIUM;
      case ErrorCategory.NETWORK:
      case ErrorCategory.TIMEOUT:
        return ErrorSeverity.LOW;
      case ErrorCategory.SERVICE_UNAVAILABLE:
        return ErrorSeverity.HIGH;
      default:
        return ErrorSeverity.MEDIUM;
    }
  }

  private initializeErrorHandling(): void {
    // Initialize circuit breakers for known services
    const defaultServices = ["imagen4", "veo3", "streaming-api"];
    defaultServices.forEach(service => {
      this.createCircuitBreaker(service);
    });

    // Start circuit breaker monitoring
    this.startCircuitBreakerMonitoring();
  }

  private setupEventHandlers(): void {
    this.on("circuit_breaker:opened", this.handleCircuitBreakerOpened.bind(this));
    this.on("circuit_breaker:closed", this.handleCircuitBreakerClosed.bind(this));
    this.on("retry:exhausted", this.handleRetryExhausted.bind(this));
  }

  private handleCircuitBreakerOpened(event: any): void {
    this.logger.error("Circuit breaker opened", event);
    // Implement alerting logic here
  }

  private handleCircuitBreakerClosed(event: any): void {
    this.logger.info("Circuit breaker closed", event);
    // Implement recovery logic here
  }

  private handleRetryExhausted(event: any): void {
    this.logger.error("Retry attempts exhausted", event);
    // Implement escalation logic here
  }

  private startCircuitBreakerMonitoring(): void {
    setInterval(() => {
      this.checkCircuitBreakerTimeouts();
    }, 1000);
  }

  private checkCircuitBreakerTimeouts(): void {
    const now = Date.now();

    for (const [service, circuitBreaker] of this.circuitBreakers.entries()) {
      if (
        circuitBreaker.state === "open" &&
        circuitBreaker.nextAttemptTime &&
        now >= circuitBreaker.nextAttemptTime.getTime()
      ) {
        this.transitionToHalfOpen(circuitBreaker, service);
      }
    }
  }

  private transitionToHalfOpen(circuitBreaker: CircuitBreakerState, service: string): void {
    circuitBreaker.state = "half-open";
    circuitBreaker.lastStateChange = new Date();

    this.logger.info("Circuit breaker transitioning to half-open", { service });

    this.emit("circuit_breaker:half_open", { service });
  }

  private generateOperationId(): string {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// ==================== Supporting Classes ====================

interface CircuitBreakerState {
  service: string;
  state: "closed" | "open" | "half-open";
  failureCount: number;
  successCount: number;
  lastStateChange: Date;
  lastFailureTime?: Date;
  nextAttemptTime?: Date;
}

interface RetryState {
  attempt: number;
  startTime: Date;
  lastError?: any;
}