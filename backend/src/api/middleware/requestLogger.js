/**
 * Request Logger Middleware
 * 
 * Logs all HTTP requests with:
 * - Request details (method, path, IP)
 * - Request ID for correlation
 * - Response status and duration
 * - Client identification
 */

import { logger } from '../../utils/logger.js';

/**
 * Middleware to log HTTP requests and responses
 * 
 * Logs incoming requests immediately and completed requests
 * with duration and status code after response finishes.
 * 
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export function requestLogger(req, res, next) {
  const start = Date.now();
  
  // Log incoming request
  logger.info({
    requestId: req.id,
    method: req.method,
    path: req.path,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.headers['user-agent']
  }, 'Incoming request');
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    const logData = {
      requestId: req.id,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration
    };
    
    // Use appropriate log level based on status code
    if (res.statusCode >= 500) {
      logger.error(logData, 'Request completed with server error');
    } else if (res.statusCode >= 400) {
      logger.warn(logData, 'Request completed with client error');
    } else {
      logger.info(logData, 'Request completed');
    }
  });
  
  next();
}
