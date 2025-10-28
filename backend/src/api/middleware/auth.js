/**
 * Authentication Middleware
 * 
 * Provides simple API key authentication for admin endpoints.
 * Uses X-API-Key header or API_KEY environment variable.
 */

import { logger } from '../../utils/logger.js';

const API_KEY = process.env.API_KEY || '';

/**
 * Authentication middleware
 * @param {Object} options - Authentication options
 * @param {boolean} options.required - Whether authentication is required
 */
export function authenticate(options = { required: true }) {
  return (req, res, next) => {
    if (!options.required) {
      return next();
    }
    
    const providedKey = req.headers['x-api-key'];
    
    if (!API_KEY) {
      logger.error('API_KEY not configured. Authentication is required but no API_KEY is set.');
      return res.status(500).json({
        success: false,
        error: { message: 'Server misconfiguration: API_KEY not set. Contact administrator.' }
      });
    }
    
    if (!providedKey || providedKey !== API_KEY) {
      logger.warn({ ip: req.ip }, 'Unauthorized access attempt');
      return res.status(401).json({
        success: false,
        error: { message: 'Unauthorized. Provide valid X-API-Key header.' }
      });
    }
    
    next();
  };
}

/**
 * Async handler wrapper for route handlers
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
