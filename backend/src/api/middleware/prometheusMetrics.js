/**
 * Prometheus Metrics Collection Middleware
 *
 * Implements comprehensive metrics collection for monitoring
 * Issue #74: Implement Prometheus Metrics Collection
 */

import promClient from 'prom-client';
import { logger } from '../../utils/logger.js';

const metricsLogger = logger.child({ module: 'prometheus-metrics' });

// Create a Registry to register metrics
export const register = new promClient.Registry();

// Add default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics({
  register,
  prefix: 'gemini_flow_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5]
});

/**
 * HTTP Request Metrics
 */

// Request duration histogram
export const httpRequestDuration = new promClient.Histogram({
  name: 'gemini_flow_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10]
});
register.registerMetric(httpRequestDuration);

// Request counter
export const httpRequestTotal = new promClient.Counter({
  name: 'gemini_flow_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});
register.registerMetric(httpRequestTotal);

// Request size histogram
export const httpRequestSize = new promClient.Histogram({
  name: 'gemini_flow_http_request_size_bytes',
  help: 'Size of HTTP requests in bytes',
  labelNames: ['method', 'route'],
  buckets: [100, 1000, 10000, 100000, 1000000, 10000000]
});
register.registerMetric(httpRequestSize);

// Response size histogram
export const httpResponseSize = new promClient.Histogram({
  name: 'gemini_flow_http_response_size_bytes',
  help: 'Size of HTTP responses in bytes',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [100, 1000, 10000, 100000, 1000000, 10000000]
});
register.registerMetric(httpResponseSize);

/**
 * Rate Limiting Metrics
 */

export const rateLimitExceeded = new promClient.Counter({
  name: 'gemini_flow_rate_limit_exceeded_total',
  help: 'Total number of rate limit exceeded events',
  labelNames: ['route', 'key_type']
});
register.registerMetric(rateLimitExceeded);

/**
 * API Key Metrics
 */

export const apiKeyValidation = new promClient.Counter({
  name: 'gemini_flow_api_key_validations_total',
  help: 'Total number of API key validations',
  labelNames: ['status'] // success, invalid, missing
});
register.registerMetric(apiKeyValidation);

/**
 * WebSocket Metrics
 */

export const websocketConnections = new promClient.Gauge({
  name: 'gemini_flow_websocket_connections',
  help: 'Current number of WebSocket connections',
  labelNames: ['status'] // authenticated, unauthenticated
});
register.registerMetric(websocketConnections);

export const websocketMessages = new promClient.Counter({
  name: 'gemini_flow_websocket_messages_total',
  help: 'Total number of WebSocket messages',
  labelNames: ['direction', 'event_type'] // direction: inbound/outbound
});
register.registerMetric(websocketMessages);

/**
 * Gemini API Metrics
 */

export const geminiApiRequests = new promClient.Counter({
  name: 'gemini_flow_gemini_api_requests_total',
  help: 'Total number of Gemini API requests',
  labelNames: ['model', 'status']
});
register.registerMetric(geminiApiRequests);

export const geminiApiDuration = new promClient.Histogram({
  name: 'gemini_flow_gemini_api_duration_seconds',
  help: 'Duration of Gemini API requests',
  labelNames: ['model', 'status'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60]
});
register.registerMetric(geminiApiDuration);

export const geminiApiTokens = new promClient.Histogram({
  name: 'gemini_flow_gemini_api_tokens',
  help: 'Token usage for Gemini API requests',
  labelNames: ['model', 'type'], // type: prompt, completion
  buckets: [10, 50, 100, 500, 1000, 5000, 10000, 50000]
});
register.registerMetric(geminiApiTokens);

/**
 * Database Metrics
 */

export const databaseOperations = new promClient.Counter({
  name: 'gemini_flow_database_operations_total',
  help: 'Total number of database operations',
  labelNames: ['operation', 'status'] // operation: read, write, delete
});
register.registerMetric(databaseOperations);

export const databaseOperationDuration = new promClient.Histogram({
  name: 'gemini_flow_database_operation_duration_seconds',
  help: 'Duration of database operations',
  labelNames: ['operation'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2]
});
register.registerMetric(databaseOperationDuration);

export const databaseSize = new promClient.Gauge({
  name: 'gemini_flow_database_size_bytes',
  help: 'Size of database files in bytes',
  labelNames: ['database']
});
register.registerMetric(databaseSize);

/**
 * Backup Metrics
 */

export const backupOperations = new promClient.Counter({
  name: 'gemini_flow_backup_operations_total',
  help: 'Total number of backup operations',
  labelNames: ['status'] // success, failure
});
register.registerMetric(backupOperations);

export const backupDuration = new promClient.Histogram({
  name: 'gemini_flow_backup_duration_seconds',
  help: 'Duration of backup operations',
  buckets: [1, 5, 10, 30, 60, 300, 600]
});
register.registerMetric(backupDuration);

export const backupSize = new promClient.Gauge({
  name: 'gemini_flow_backup_size_bytes',
  help: 'Size of backup files in bytes',
  labelNames: ['backup_type']
});
register.registerMetric(backupSize);

/**
 * Error Metrics
 */

export const errors = new promClient.Counter({
  name: 'gemini_flow_errors_total',
  help: 'Total number of errors',
  labelNames: ['type', 'severity'] // type: validation, auth, internal; severity: warning, error, critical
});
register.registerMetric(errors);

/**
 * Middleware to collect HTTP metrics
 */
export function metricsMiddleware(req, res, next) {
  const start = Date.now();

  // Track request size
  const requestSize = parseInt(req.headers['content-length'] || '0', 10);
  if (requestSize > 0) {
    httpRequestSize.observe(
      { method: req.method, route: req.route?.path || req.path },
      requestSize
    );
  }

  // Intercept response to measure duration and size
  const originalSend = res.send;
  res.send = function(data) {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;
    const statusCode = res.statusCode;

    // Record duration
    httpRequestDuration.observe(
      { method: req.method, route, status_code: statusCode },
      duration
    );

    // Record request count
    httpRequestTotal.inc({
      method: req.method,
      route,
      status_code: statusCode
    });

    // Record response size
    if (data) {
      const responseSize = Buffer.isBuffer(data)
        ? data.length
        : Buffer.byteLength(data, 'utf8');

      httpResponseSize.observe(
        { method: req.method, route, status_code: statusCode },
        responseSize
      );
    }

    return originalSend.call(this, data);
  };

  next();
}

/**
 * Endpoint to expose metrics for Prometheus
 */
export async function metricsEndpoint(req, res) {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.send(metrics);
  } catch (error) {
    metricsLogger.error({ err: error }, 'Failed to generate metrics');
    res.status(500).send('Error generating metrics');
  }
}

/**
 * Track Gemini API request
 */
export function trackGeminiApiRequest(model, status, duration, tokens = {}) {
  geminiApiRequests.inc({ model, status });
  geminiApiDuration.observe({ model, status }, duration);

  if (tokens.prompt) {
    geminiApiTokens.observe({ model, type: 'prompt' }, tokens.prompt);
  }
  if (tokens.completion) {
    geminiApiTokens.observe({ model, type: 'completion' }, tokens.completion);
  }
}

/**
 * Track database operation
 */
export function trackDatabaseOperation(operation, duration, status = 'success') {
  databaseOperations.inc({ operation, status });
  databaseOperationDuration.observe({ operation }, duration);
}

/**
 * Track error occurrence
 */
export function trackError(type, severity = 'error') {
  errors.inc({ type, severity });
}

/**
 * Initialize metrics collection
 */
export function initializeMetrics() {
  metricsLogger.info({
    defaultMetrics: true,
    customMetrics: register.getMetricsAsJSON().length
  }, 'Prometheus metrics initialized');
}

// Auto-initialize on import
initializeMetrics();
