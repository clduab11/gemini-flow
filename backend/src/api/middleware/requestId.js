/**
 * Request ID Middleware
 * 
 * Generates unique request IDs for correlation tracking.
 * Supports X-Request-ID header passthrough or generates new UUIDs.
 */

import { randomUUID } from 'crypto';

/**
 * Middleware to add unique request ID to each request
 * 
 * - Checks for existing X-Request-ID header
 * - Generates new UUID if not present
 * - Attaches ID to request object and response header
 * 
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
export function requestId(req, res, next) {
  // Use existing request ID from header or generate new one
  req.id = req.headers['x-request-id'] || randomUUID();
  
  // Add request ID to response headers for client tracking
  res.setHeader('X-Request-ID', req.id);
  
  next();
}
