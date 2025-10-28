/**
 * Authentication Middleware
 *
 * Handles API key authentication for Super Terminal access.
 * Simple API key-based auth for MVP.
 *
 * Sprint 7: Backend API Implementation
 */

import * as db from '../../db/database.js';

// Default API key for development (should be in .env in production)
const DEFAULT_API_KEY = process.env.API_KEY || 'dev-api-key-change-in-production';

/**
 * API Key authentication middleware
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Express next function
 */
export function requireApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'API key required. Provide X-API-Key header or apiKey query parameter.'
      },
      timestamp: new Date().toISOString()
    });
  }

  // Validate API key (simple check for now)
  if (apiKey !== DEFAULT_API_KEY) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid API key'
      },
      timestamp: new Date().toISOString()
    });
  }

  // Store client info
  req.clientId = `client-${Date.now()}`;
  req.authenticated = true;

  next();
}

/**
 * Optional API key authentication
 * Adds client info if API key provided, but doesn't block request
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Express next function
 */
export function optionalApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;

  if (apiKey && apiKey === DEFAULT_API_KEY) {
    req.clientId = `client-${Date.now()}`;
    req.authenticated = true;
  } else {
    req.authenticated = false;
  }

  next();
}

export default {
  requireApiKey,
  optionalApiKey,
  DEFAULT_API_KEY
};
