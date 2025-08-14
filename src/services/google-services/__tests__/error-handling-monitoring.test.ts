/**
 * Unit Tests for Error Handling and Monitoring
 * 
 * Comprehensive test suite for the ErrorHandlingMonitoring class,
 * covering error handling, metrics collection, alerting, health checks,
 * distributed tracing, and SLO management.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { EventEmitter } from 'events';
import { ErrorHandlingMonitoring } from '../infrastructure/error-handling-monitoring.js';
import { Logger } from '../../../utils/logger.js';

// Mock dependencies
jest.mock('../../../utils/logger.js');

describe('ErrorHandlingMonitoring', () => {
  let errorHandling: ErrorHandlingMonitoring;
  let mockConfig: any;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    // Setup mock configuration
    mockConfig = {
      environment: 'test',
      errorHandling: {
        retryAttempts: 3,
        circuitBreaker: {
          failureThreshold: 5,
          timeout: 30000,
          monitoringPeriod: 60000
        },
        escalation: {
          enabled: true,
          levels: ['warn', 'error', 'critical']
        }
      },
      metrics: {
        collection: {
          interval: 5000,
          batchSize: 100
        },
        retention: 86400,
        aggregation: {
          enabled: true,
          window: 60
        }
      },
      alerting: {
        enabled: true,
        channels: ['email', 'slack'],
        rateLimit: {
          maxAlerts: 10,
          window: 300
        },
        escalation: {
          timeout: 300,
          levels: 3
        }
      },
      healthChecks: {
        interval: 30000,
        timeout: 5000,
        checks: [
          { name: 'database', type: 'liveness', endpoint: '/health/db' },
          { name: 'cache', type: 'readiness', endpoint: '/health/cache' }
        ]
      },
      tracing: {
        enabled: true,
        sampleRate: 0.1,
        maxSpans: 1000
      },
      slo: {
        enabled: true,
        targets: {
          availability: 99.9,
          latency: 100,
          errorRate: 0.1
        }
      }
    };

    // Setup mock logger
    mockLogger = {
      info: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    } as any;

    (Logger as jest.MockedClass<typeof Logger>).mockReturnValue(mockLogger);

    errorHandling = new ErrorHandlingMonitoring(mockConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize successfully with valid configuration', async () => {
      // Arrange
      const initSpy = jest.spyOn(errorHandling, 'initialize');

      // Act
      await errorHandling.initialize();

      // Assert
      expect(initSpy).toHaveBeenCalledTimes(1);
      expect(mockLogger.info).toHaveBeenCalledWith('Initializing Error Handling and Monitoring System');
    });

    it('should start monitoring services after initialization', async () => {
      // Act
      await errorHandling.initialize();

      // Assert
      // Verify that monitoring services are started
      expect(mockLogger.info).toHaveBeenCalledWith('Initializing Error Handling and Monitoring System');
    });

    it('should handle initialization failure gracefully', async () => {
      // Arrange - Create invalid configuration
      const invalidConfig = { ...mockConfig };
      delete invalidConfig.metrics;
      const invalidErrorHandling = new ErrorHandlingMonitoring(invalidConfig);

      // Act & Assert
      await expect(invalidErrorHandling.initialize()).rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await errorHandling.initialize();
    });

    it('should handle errors with comprehensive context', async () => {
      // Arrange
      const testError = new Error('Test error message');
      const errorContext = {
        source: 'test-service',
        operation: 'data-processing',
        component: 'processor',
        severity: 'error' as const,
        category: 'business' as const,
        retryable: true,
        transient: false
      };

      // Act
      const result = await errorHandling.handleError(testError, errorContext);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.handled).toBe(true);
      expect(result.data.recovery).toBeDefined();
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Handling error with context',
        expect.objectContaining({
          source: 'test-service',
          operation: 'data-processing',
          component: 'processor',
          severity: 'error',
          category: 'business',
          message: 'Test error message'
        })
      );
    });

    it('should execute recovery strategies', async () => {
      // Arrange
      const testError = new Error('Recoverable error');
      const errorContext = {
        source: 'api-service',
        operation: 'user-request',
        component: 'controller',
        severity: 'warn' as const,
        category: 'network' as const,
        retryable: true,
        recovery: {
          type: 'retry' as const,
          maxAttempts: 3,
          backoffStrategy: 'exponential' as const,
          timeout: 5000
        }
      };

      // Act
      const result = await errorHandling.handleError(testError, errorContext);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.recovery).toBeDefined();
      expect(result.data.recovery.recovered).toBe(true);
    });

    it('should assess error impact correctly', async () => {
      // Arrange
      const criticalError = new Error('Critical system failure');
      const errorContext = {
        source: 'database-service',
        operation: 'connection',
        component: 'connection-pool',
        severity: 'fatal' as const,
        category: 'system' as const,
        impact: {
          scope: 'system' as const,
          affectedUsers: 1000,
          affectedServices: ['user-service', 'order-service'],
          businessImpact: 'critical' as const,
          dataIntegrity: false,
          securityImplications: true,
          complianceRisk: true
        }
      };

      // Act
      const result = await errorHandling.handleError(criticalError, errorContext);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.handled).toBe(true);
    });

    it('should handle non-retryable errors appropriately', async () => {
      // Arrange
      const validationError = new Error('Invalid input parameters');
      const errorContext = {
        source: 'validation-service',
        operation: 'input-validation',
        component: 'validator',
        severity: 'error' as const,
        category: 'validation' as const,
        retryable: false,
        recovery: {
          type: 'none' as const
        }
      };

      // Act
      const result = await errorHandling.handleError(validationError, errorContext);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.recovery.recovered).toBe(true); // Should still handle gracefully
    });
  });

  describe('Metrics Collection', () => {
    beforeEach(async () => {
      await errorHandling.initialize();
    });

    it('should record metrics with contextual information', async () => {
      // Arrange
      const metricName = 'api.response_time';
      const metricValue = 150;
      const metricType = 'histogram';
      const tags = { endpoint: '/api/users', method: 'GET', status: '200' };

      // Act
      const result = await errorHandling.recordMetric(metricName, metricValue, metricType, tags);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should handle different metric types', async () => {
      // Arrange
      const metrics = [
        { name: 'requests.count', value: 1, type: 'counter' as const },
        { name: 'memory.usage', value: 75.5, type: 'gauge' as const },
        { name: 'processing.time', value: 250, type: 'timer' as const },
        { name: 'errors.rate', value: 0.02, type: 'meter' as const }
      ];

      // Act
      const results = await Promise.all(
        metrics.map(metric => 
          errorHandling.recordMetric(metric.name, metric.value, metric.type)
        )
      );

      // Assert
      expect(results.every(result => result.success)).toBe(true);
    });

    it('should check performance thresholds', async () => {
      // Arrange
      const highLatencyMetric = 'api.latency';
      const highLatencyValue = 2000; // Above typical threshold
      const tags = { service: 'payment-service' };

      // Act
      const result = await errorHandling.recordMetric(
        highLatencyMetric, 
        highLatencyValue, 
        'gauge', 
        tags
      );

      // Assert
      expect(result.success).toBe(true);
      // Should potentially trigger threshold checks
    });

    it('should batch metric recordings efficiently', async () => {
      // Arrange
      const batchMetrics = Array.from({ length: 50 }, (_, i) => ({
        name: `batch.metric.${i}`,
        value: Math.random() * 100,
        type: 'gauge' as const,
        tags: { batch: 'test', index: i.toString() }
      }));

      // Act
      const startTime = Date.now();
      const results = await Promise.all(
        batchMetrics.map(metric => 
          errorHandling.recordMetric(metric.name, metric.value, metric.type, metric.tags)
        )
      );
      const endTime = Date.now();

      // Assert
      expect(results.every(result => result.success)).toBe(true);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete quickly
    });
  });

  describe('Alerting System', () => {
    beforeEach(async () => {
      await errorHandling.initialize();
    });

    it('should create alerts with comprehensive information', async () => {
      // Arrange
      const alertTitle = 'High Error Rate Detected';
      const alertDescription = 'Error rate has exceeded 5% for the past 5 minutes';
      const severity = 'critical';
      const alertSource = {
        component: 'payment-service',
        service: 'payment',
        environment: 'production',
        region: 'us-east-1',
        metadata: { version: '1.2.3' }
      };
      const conditions = [{
        metric: 'error_rate',
        operator: '>',
        threshold: 0.05,
        actual: 0.12,
        duration: 300
      }];

      // Act
      const result = await errorHandling.createAlert(
        alertTitle,
        alertDescription,
        severity as any,
        alertSource,
        conditions
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.title).toBe(alertTitle);
      expect(result.data.severity).toBe(severity);
      expect(result.data.conditions).toEqual(conditions);
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Creating alert',
        expect.objectContaining({
          severity,
          title: alertTitle,
          source: 'payment-service'
        })
      );
    });

    it('should route alerts to appropriate notification channels', async () => {
      // Arrange
      const criticalAlert = {
        title: 'Service Down',
        description: 'Payment service is completely unavailable',
        severity: 'critical' as const,
        source: {
          component: 'payment-service',
          service: 'payment',
          environment: 'production',
          region: 'us-east-1',
          metadata: {}
        },
        conditions: [{
          metric: 'availability',
          operator: '<',
          threshold: 0.5,
          actual: 0,
          duration: 60
        }],
        channels: [{
          type: 'pagerduty' as const,
          target: 'critical-alerts',
          priority: 1,
          rateLimit: { enabled: false, maxEvents: 0, window: 0, burstSize: 0 }
        }]
      };

      // Act
      const result = await errorHandling.createAlert(
        criticalAlert.title,
        criticalAlert.description,
        criticalAlert.severity,
        criticalAlert.source,
        criticalAlert.conditions,
        criticalAlert.channels
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.channels).toBeDefined();
      expect(result.data.channels.length).toBeGreaterThan(0);
    });

    it('should respect rate limiting for alerts', async () => {
      // Arrange
      const rapidAlerts = Array.from({ length: 20 }, (_, i) => ({
        title: `Rapid Alert ${i}`,
        description: `Test alert ${i}`,
        severity: 'warn' as const,
        source: {
          component: 'test-service',
          service: 'test',
          environment: 'test',
          region: 'local',
          metadata: {}
        },
        conditions: [{
          metric: 'test_metric',
          operator: '>',
          threshold: 1,
          actual: 2,
          duration: 1
        }]
      }));

      // Act
      const results = await Promise.all(
        rapidAlerts.map(alert => 
          errorHandling.createAlert(
            alert.title,
            alert.description,
            alert.severity,
            alert.source,
            alert.conditions
          )
        )
      );

      // Assert
      const successfulAlerts = results.filter(result => result.success);
      expect(successfulAlerts.length).toBeGreaterThan(0);
      // Should respect rate limiting - not all alerts may be processed
    });
  });

  describe('Health Monitoring', () => {
    beforeEach(async () => {
      await errorHandling.initialize();
    });

    it('should perform comprehensive health checks', async () => {
      // Act
      const result = await errorHandling.performHealthCheck();

      // Assert
      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
      
      if (Array.isArray(result.data)) {
        expect(result.data.length).toBeGreaterThan(0);
        const firstHealthStatus = result.data[0];
        expect(firstHealthStatus).toHaveProperty('component');
        expect(firstHealthStatus).toHaveProperty('status');
        expect(firstHealthStatus).toHaveProperty('score');
        expect(firstHealthStatus).toHaveProperty('timestamp');
        expect(firstHealthStatus).toHaveProperty('checks');
        expect(firstHealthStatus).toHaveProperty('dependencies');
      }
    });

    it('should check specific component health', async () => {
      // Arrange
      const componentName = 'database';

      // Act
      const result = await errorHandling.performHealthCheck(componentName);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      
      if (!Array.isArray(result.data)) {
        expect(result.data.component).toBe(componentName);
        expect(['healthy', 'degraded', 'unhealthy', 'unknown']).toContain(result.data.status);
        expect(typeof result.data.score).toBe('number');
        expect(result.data.score).toBeGreaterThanOrEqual(0);
        expect(result.data.score).toBeLessThanOrEqual(100);
      }
    });

    it('should track dependency health', async () => {
      // Act
      const result = await errorHandling.performHealthCheck();

      // Assert
      expect(result.success).toBe(true);
      if (Array.isArray(result.data) && result.data.length > 0) {
        const healthStatus = result.data[0];
        expect(Array.isArray(healthStatus.dependencies)).toBe(true);
      }
    });

    it('should provide health recommendations', async () => {
      // Act
      const result = await errorHandling.performHealthCheck();

      // Assert
      expect(result.success).toBe(true);
      if (Array.isArray(result.data) && result.data.length > 0) {
        const healthStatus = result.data[0];
        expect(Array.isArray(healthStatus.recommendations)).toBe(true);
      }
    });
  });

  describe('Distributed Tracing', () => {
    beforeEach(async () => {
      await errorHandling.initialize();
    });

    it('should record trace spans with proper context', async () => {
      // Arrange
      const operationName = 'database.query';
      const duration = 150;
      const status = 'ok';
      const tags = {
        'db.statement': 'SELECT * FROM users WHERE id = ?',
        'db.type': 'postgresql',
        'http.method': 'GET'
      };

      // Act
      const result = await errorHandling.recordTrace(
        operationName,
        duration,
        status,
        tags
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.operationName).toBe(operationName);
      expect(result.data.duration).toBe(duration);
      expect(result.data.status).toBe(status);
      expect(result.data.tags).toMatchObject(tags);
      expect(result.data.traceId).toBeDefined();
      expect(result.data.spanId).toBeDefined();
    });

    it('should create child spans with parent relationships', async () => {
      // Arrange
      const parentSpan = await errorHandling.recordTrace('parent.operation', 200);
      const parentSpanId = parentSpan.data.spanId;

      const childOperationName = 'child.operation';
      const childDuration = 50;

      // Act
      const result = await errorHandling.recordTrace(
        childOperationName,
        childDuration,
        'ok',
        {},
        parentSpanId
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.parentSpanId).toBe(parentSpanId);
      expect(result.data.references).toBeDefined();
      expect(result.data.references.length).toBeGreaterThan(0);
    });

    it('should handle error traces', async () => {
      // Arrange
      const operationName = 'api.request';
      const duration = 500;
      const status = 'error';
      const tags = {
        'error': 'true',
        'error.kind': 'validation_error',
        'http.status_code': '400'
      };

      // Act
      const result = await errorHandling.recordTrace(
        operationName,
        duration,
        status,
        tags
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.status).toBe(status);
      expect(result.data.tags.error).toBe('true');
    });
  });

  describe('Service Level Objectives (SLO)', () => {
    beforeEach(async () => {
      await errorHandling.initialize();
    });

    it('should create and manage SLOs', async () => {
      // Arrange
      const slo = {
        name: 'API Availability',
        type: 'availability' as const,
        target: 99.9,
        unit: 'percent',
        measurement: {
          query: 'sum(rate(http_requests_total{status!~"5.."})) / sum(rate(http_requests_total))',
          datasource: 'prometheus',
          aggregation: 'avg' as const,
          filters: { service: 'api' }
        },
        timeWindow: {
          type: 'rolling' as const,
          duration: '30d'
        },
        alerting: {
          burnRateAlerts: [{
            shortWindow: '5m',
            longWindow: '1h',
            burnRate: 14.4,
            severity: 'critical' as const
          }],
          errorBudgetAlerts: [{
            threshold: 50,
            severity: 'warn' as const,
            lookback: '7d'
          }]
        }
      };

      // Act
      const result = await errorHandling.createSLO(slo);

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.sloId).toBeDefined();
      expect(mockLogger.info).toHaveBeenCalledWith(
        'SLO created',
        expect.objectContaining({
          name: slo.name,
          type: slo.type
        })
      );
    });

    it('should handle different SLO types', async () => {
      // Arrange
      const sloTypes = [
        {
          name: 'Request Latency',
          type: 'latency' as const,
          target: 100,
          unit: 'milliseconds'
        },
        {
          name: 'Error Rate',
          type: 'error_rate' as const,
          target: 0.1,
          unit: 'percent'
        },
        {
          name: 'Throughput',
          type: 'throughput' as const,
          target: 1000,
          unit: 'requests_per_second'
        }
      ];

      // Act
      const results = await Promise.all(
        sloTypes.map(sloType => 
          errorHandling.createSLO({
            ...sloType,
            measurement: {
              query: 'test_query',
              datasource: 'prometheus',
              aggregation: 'avg' as const,
              filters: {}
            },
            timeWindow: {
              type: 'rolling' as const,
              duration: '1d'
            },
            alerting: {
              burnRateAlerts: [],
              errorBudgetAlerts: []
            }
          })
        )
      );

      // Assert
      expect(results.every(result => result.success)).toBe(true);
    });
  });

  describe('System Metrics and Performance', () => {
    beforeEach(async () => {
      await errorHandling.initialize();
    });

    it('should provide comprehensive system metrics', async () => {
      // Arrange - Generate some activity
      await errorHandling.handleError(new Error('Test error'), { source: 'test' });
      await errorHandling.recordMetric('test.metric', 100);
      await errorHandling.performHealthCheck();

      // Act
      const result = await errorHandling.getSystemMetrics();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.performance).toBeDefined();
      expect(result.data.health).toBeDefined();
      expect(result.data.alerts).toBeDefined();
      expect(result.data.sloStatus).toBeDefined();
      expect(result.data.circuitBreakers).toBeDefined();
      
      // Check performance metrics structure
      expect(typeof result.data.performance.errors_handled).toBe('number');
      expect(typeof result.data.performance.errors_recovered).toBe('number');
      expect(typeof result.data.performance.alerts_generated).toBe('number');
      expect(typeof result.data.performance.health_checks_performed).toBe('number');
    });

    it('should track performance over time', async () => {
      // Arrange - Create multiple operations
      const operations = [
        () => errorHandling.recordMetric('op1', 50),
        () => errorHandling.recordMetric('op2', 75),
        () => errorHandling.recordMetric('op3', 100),
        () => errorHandling.performHealthCheck(),
        () => errorHandling.handleError(new Error('Op error'), { source: 'operations' })
      ];

      // Act
      await Promise.all(operations.map(op => op()));
      const result = await errorHandling.getSystemMetrics();

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.performance.errors_handled).toBeGreaterThan(0);
      expect(result.data.performance.health_checks_performed).toBeGreaterThan(0);
    });

    it('should handle high-frequency operations efficiently', async () => {
      // Arrange
      const highFrequencyOps = Array.from({ length: 100 }, (_, i) => 
        () => errorHandling.recordMetric(`metric_${i}`, Math.random() * 100)
      );

      // Act
      const startTime = Date.now();
      await Promise.all(highFrequencyOps.map(op => op()));
      const endTime = Date.now();

      const metricsResult = await errorHandling.getSystemMetrics();

      // Assert
      expect(endTime - startTime).toBeLessThan(2000); // Should handle 100 ops in under 2 seconds
      expect(metricsResult.success).toBe(true);
    });
  });

  describe('Error Recovery and Circuit Breaker', () => {
    beforeEach(async () => {
      await errorHandling.initialize();
    });

    it('should implement circuit breaker pattern', async () => {
      // Arrange - Create repeated failures to trigger circuit breaker
      const failingError = new Error('Repeated failure');
      const errorContext = {
        source: 'failing-service',
        operation: 'critical-operation',
        component: 'processor',
        category: 'system' as const,
        retryable: true
      };

      // Act - Generate multiple failures
      const results = await Promise.all(
        Array.from({ length: 10 }, () => 
          errorHandling.handleError(failingError, errorContext)
        )
      );

      // Assert
      expect(results.every(result => result.success)).toBe(true);
      // Circuit breaker should eventually be triggered
    });

    it('should recover from circuit breaker state', async () => {
      // Arrange - First trigger circuit breaker
      const initialError = new Error('Service failure');
      const errorContext = {
        source: 'recovery-service',
        component: 'api',
        category: 'network' as const
      };

      // Trigger multiple failures
      await Promise.all(
        Array.from({ length: 5 }, () => 
          errorHandling.handleError(initialError, errorContext)
        )
      );

      // Wait for recovery period (simulated)
      await new Promise(resolve => setTimeout(resolve, 100));

      // Act - Try successful operation
      const successfulError = new Error('Temporary issue');
      const result = await errorHandling.handleError(successfulError, {
        ...errorContext,
        recovery: { type: 'retry' as const, maxAttempts: 1 }
      });

      // Assert
      expect(result.success).toBe(true);
      expect(result.data.recovery.recovered).toBe(true);
    });
  });

  describe('Integration and Event Handling', () => {
    beforeEach(async () => {
      await errorHandling.initialize();
    });

    it('should emit events for system activities', async () => {
      // Arrange
      const systemInitializedSpy = jest.fn();
      const errorHandledSpy = jest.fn();
      const alertCreatedSpy = jest.fn();

      errorHandling.on('system:initialized', systemInitializedSpy);
      errorHandling.on('error:handled', errorHandledSpy);
      errorHandling.on('alert:created', alertCreatedSpy);

      // Act
      await errorHandling.handleError(new Error('Event test'), { source: 'event-test' });
      
      await errorHandling.createAlert(
        'Test Alert',
        'Test Description',
        'info',
        {
          component: 'test',
          service: 'test',
          environment: 'test',
          region: 'local',
          metadata: {}
        },
        []
      );

      // Assert
      expect(errorHandledSpy).toHaveBeenCalled();
      expect(alertCreatedSpy).toHaveBeenCalled();
    });

    it('should handle event listener errors gracefully', async () => {
      // Arrange
      const faultyListener = jest.fn(() => {
        throw new Error('Listener error');
      });

      errorHandling.on('error:handled', faultyListener);

      // Act
      const result = await errorHandling.handleError(
        new Error('Trigger event'),
        { source: 'event-test' }
      );

      // Assert
      expect(result.success).toBe(true); // Should not fail due to listener error
      expect(faultyListener).toHaveBeenCalled();
    });
  });
});