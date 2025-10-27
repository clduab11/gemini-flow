/**
 * Metrics Middleware
 * 
 * Tracks HTTP request duration and counts for all routes.
 */

import { httpRequestDuration, httpRequestTotal } from '../../monitoring/metrics.js';

/**
 * Middleware to collect HTTP request metrics
 */
export function metricsMiddleware(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000; // Convert to seconds
    const route = req.route?.path || req.path;
    const labels = {
      method: req.method,
      route,
      status_code: res.statusCode
    };
    
    httpRequestDuration.observe(labels, duration);
    httpRequestTotal.inc(labels);
  });
  
  next();
}
