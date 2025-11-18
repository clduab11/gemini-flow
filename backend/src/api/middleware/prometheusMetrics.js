/**
 * Prometheus Metrics Collection Middleware
 * 
 * Collects and exposes application metrics in Prometheus format.
 * 
 * Features:
 * - HTTP request metrics (duration, size, status codes)
 * - Gemini API metrics (requests, errors, latency)
 * - Database operation metrics
 * - Backup operation metrics
 * - Custom business metrics
 * 
 * @module api/middleware/prometheusMetrics
 */

import { createModuleLogger } from '../../utils/logger.js';

const logger = createModuleLogger('prometheus-metrics');

// Metrics storage
const metrics = {
  // HTTP metrics
  httpRequestsTotal: new Map(),
  httpRequestDuration: [],
  httpRequestSize: [],
  httpResponseSize: [],
  
  // Gemini API metrics
  geminiRequestsTotal: 0,
  geminiRequestErrors: 0,
  geminiRequestDuration: [],
  
  // Database metrics
  databaseOperationsTotal: 0,
  databaseErrors: 0,
  databaseQueryDuration: [],
  
  // Backup metrics
  backupOperationsTotal: 0,
  backupErrors: 0,
  backupDuration: [],
  backupSize: [],
  
  // Error metrics
  errorsTotal: new Map(),
  
  // System metrics
  startTime: Date.now(),
  requestsInFlight: 0
};

/**
 * Initialize Prometheus metrics (called once at startup)
 */
export function initializeMetrics() {
  logger.info('Prometheus metrics initialized');
}

/**
 * Increment counter metric
 */
function incrementCounter(map, key) {
  map.set(key, (map.get(key) || 0) + 1);
}

/**
 * Record histogram value (keep last N values for percentile calculation)
 */
function recordHistogram(array, value, maxSize = 1000) {
  array.push(value);
  if (array.length > maxSize) {
    array.shift(); // Remove oldest value
  }
}

/**
 * Calculate percentile from array of values
 */
function calculatePercentile(values, percentile) {
  if (values.length === 0) return 0;
  
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * HTTP Request Metrics Middleware
 */
export function httpMetrics(req, res, next) {
  const startTime = Date.now();
  metrics.requestsInFlight++;
  
  // Track request size
  const requestSize = parseInt(req.headers['content-length'] || '0', 10);
  recordHistogram(metrics.httpRequestSize, requestSize);
  
  // Capture response end
  const originalEnd = res.end;
  res.end = function(...args) {
    // Record response metrics
    const duration = Date.now() - startTime;
    const responseSize = parseInt(res.get('content-length') || '0', 10);
    
    // Record metrics
    recordHistogram(metrics.httpRequestDuration, duration);
    recordHistogram(metrics.httpResponseSize, responseSize);
    
    const key = `${req.method}:${res.statusCode}`;
    incrementCounter(metrics.httpRequestsTotal, key);
    
    metrics.requestsInFlight--;
    
    logger.debug({
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      requestSize,
      responseSize
    }, 'HTTP request completed');
    
    // Call original end
    return originalEnd.apply(this, args);
  };
  
  next();
}

/**
 * Track Gemini API request
 */
export function trackGeminiRequest(duration, error = null) {
  metrics.geminiRequestsTotal++;
  
  if (error) {
    metrics.geminiRequestErrors++;
    logger.debug({ err: error }, 'Gemini API request failed');
  } else {
    recordHistogram(metrics.geminiRequestDuration, duration);
    logger.debug({ duration }, 'Gemini API request completed');
  }
}

/**
 * Track database operation
 */
export function trackDatabaseOperation(duration, error = null) {
  metrics.databaseOperationsTotal++;
  
  if (error) {
    metrics.databaseErrors++;
    logger.debug({ err: error }, 'Database operation failed');
  } else {
    recordHistogram(metrics.databaseQueryDuration, duration);
    logger.debug({ duration }, 'Database operation completed');
  }
}

/**
 * Track backup operation
 */
export function trackBackupOperation(duration, size, error = null) {
  metrics.backupOperationsTotal++;
  
  if (error) {
    metrics.backupErrors++;
    logger.debug({ err: error }, 'Backup operation failed');
  } else {
    recordHistogram(metrics.backupDuration, duration);
    recordHistogram(metrics.backupSize, size);
    logger.debug({ duration, size }, 'Backup operation completed');
  }
}

/**
 * Track error occurrence
 */
export function trackError(type, error) {
  const key = `${type}:${error.name || 'Unknown'}`;
  incrementCounter(metrics.errorsTotal, key);
  
  logger.debug({ type, errorName: error.name }, 'Error tracked');
}

/**
 * Format metrics in Prometheus exposition format
 */
function formatPrometheusMetrics() {
  const lines = [];
  const uptime = Math.floor((Date.now() - metrics.startTime) / 1000);
  
  // HTTP request metrics
  lines.push('# HELP http_requests_total Total number of HTTP requests');
  lines.push('# TYPE http_requests_total counter');
  for (const [key, value] of metrics.httpRequestsTotal.entries()) {
    const [method, statusCode] = key.split(':');
    lines.push(`http_requests_total{method="${method}",status_code="${statusCode}"} ${value}`);
  }
  
  // HTTP request duration
  if (metrics.httpRequestDuration.length > 0) {
    lines.push('# HELP http_request_duration_seconds HTTP request duration in seconds');
    lines.push('# TYPE http_request_duration_seconds histogram');
    lines.push(`http_request_duration_seconds_sum ${metrics.httpRequestDuration.reduce((a, b) => a + b, 0) / 1000}`);
    lines.push(`http_request_duration_seconds_count ${metrics.httpRequestDuration.length}`);
    lines.push(`http_request_duration_seconds{quantile="0.5"} ${calculatePercentile(metrics.httpRequestDuration, 50) / 1000}`);
    lines.push(`http_request_duration_seconds{quantile="0.9"} ${calculatePercentile(metrics.httpRequestDuration, 90) / 1000}`);
    lines.push(`http_request_duration_seconds{quantile="0.99"} ${calculatePercentile(metrics.httpRequestDuration, 99) / 1000}`);
  }
  
  // HTTP request size
  if (metrics.httpRequestSize.length > 0) {
    lines.push('# HELP http_request_size_bytes HTTP request size in bytes');
    lines.push('# TYPE http_request_size_bytes histogram');
    lines.push(`http_request_size_bytes_sum ${metrics.httpRequestSize.reduce((a, b) => a + b, 0)}`);
    lines.push(`http_request_size_bytes_count ${metrics.httpRequestSize.length}`);
  }
  
  // HTTP response size
  if (metrics.httpResponseSize.length > 0) {
    lines.push('# HELP http_response_size_bytes HTTP response size in bytes');
    lines.push('# TYPE http_response_size_bytes histogram');
    lines.push(`http_response_size_bytes_sum ${metrics.httpResponseSize.reduce((a, b) => a + b, 0)}`);
    lines.push(`http_response_size_bytes_count ${metrics.httpResponseSize.length}`);
  }
  
  // Requests in flight
  lines.push('# HELP http_requests_in_flight Current number of HTTP requests being processed');
  lines.push('# TYPE http_requests_in_flight gauge');
  lines.push(`http_requests_in_flight ${metrics.requestsInFlight}`);
  
  // Gemini API metrics
  lines.push('# HELP gemini_requests_total Total number of Gemini API requests');
  lines.push('# TYPE gemini_requests_total counter');
  lines.push(`gemini_requests_total ${metrics.geminiRequestsTotal}`);
  
  lines.push('# HELP gemini_request_errors_total Total number of Gemini API errors');
  lines.push('# TYPE gemini_request_errors_total counter');
  lines.push(`gemini_request_errors_total ${metrics.geminiRequestErrors}`);
  
  if (metrics.geminiRequestDuration.length > 0) {
    lines.push('# HELP gemini_request_duration_seconds Gemini API request duration');
    lines.push('# TYPE gemini_request_duration_seconds histogram');
    lines.push(`gemini_request_duration_seconds_sum ${metrics.geminiRequestDuration.reduce((a, b) => a + b, 0) / 1000}`);
    lines.push(`gemini_request_duration_seconds_count ${metrics.geminiRequestDuration.length}`);
    lines.push(`gemini_request_duration_seconds{quantile="0.5"} ${calculatePercentile(metrics.geminiRequestDuration, 50) / 1000}`);
    lines.push(`gemini_request_duration_seconds{quantile="0.9"} ${calculatePercentile(metrics.geminiRequestDuration, 90) / 1000}`);
  }
  
  // Database metrics
  lines.push('# HELP database_operations_total Total number of database operations');
  lines.push('# TYPE database_operations_total counter');
  lines.push(`database_operations_total ${metrics.databaseOperationsTotal}`);
  
  lines.push('# HELP database_errors_total Total number of database errors');
  lines.push('# TYPE database_errors_total counter');
  lines.push(`database_errors_total ${metrics.databaseErrors}`);
  
  // Backup metrics
  lines.push('# HELP backup_operations_total Total number of backup operations');
  lines.push('# TYPE backup_operations_total counter');
  lines.push(`backup_operations_total ${metrics.backupOperationsTotal}`);
  
  lines.push('# HELP backup_errors_total Total number of backup errors');
  lines.push('# TYPE backup_errors_total counter');
  lines.push(`backup_errors_total ${metrics.backupErrors}`);
  
  // Error metrics
  lines.push('# HELP errors_total Total number of errors by type');
  lines.push('# TYPE errors_total counter');
  for (const [key, value] of metrics.errorsTotal.entries()) {
    const [type, name] = key.split(':');
    lines.push(`errors_total{type="${type}",error="${name}"} ${value}`);
  }
  
  // Uptime
  lines.push('# HELP process_uptime_seconds Process uptime in seconds');
  lines.push('# TYPE process_uptime_seconds gauge');
  lines.push(`process_uptime_seconds ${uptime}`);
  
  return lines.join('\n') + '\n';
}

/**
 * Metrics endpoint handler
 */
export function metricsHandler(req, res) {
  res.set('Content-Type', 'text/plain; version=0.0.4');
  res.send(formatPrometheusMetrics());
}

/**
 * Get current metrics (for internal use)
 */
export function getMetrics() {
  return {
    ...metrics,
    uptime: Math.floor((Date.now() - metrics.startTime) / 1000)
  };
}

export default {
  initializeMetrics,
  httpMetrics,
  trackGeminiRequest,
  trackDatabaseOperation,
  trackBackupOperation,
  trackError,
  metricsHandler,
  getMetrics
};
