/**
 * API Key Authentication Middleware
 * 
 * Validates API key from request headers and attaches key metadata to request.
 * In production, requires valid API key. In development, allows requests without keys.
 * 
 * Features:
 * - Header-based authentication (X-API-Key)
 * - Environment-based API key configuration
 * - Development mode bypass
 * - Structured logging of auth attempts
 * 
 * @module api/middleware/apiKeyAuth
 */

import { createModuleLogger } from '../../utils/logger.js';

const logger = createModuleLogger('api-key-auth');
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Get configured API keys from environment
 * Supports multiple keys separated by commas
 * 
 * @returns {Set<string>} Set of valid API keys
 */
function getValidApiKeys() {
  const apiKeys = process.env.API_KEYS || process.env.API_KEY || '';
  return new Set(
    apiKeys
      .split(',')
      .map(key => key.trim())
      .filter(key => key.length > 0)
  );
}

/**
 * API Key Authentication Middleware
 * 
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next middleware function
 */
export function apiKeyAuth(req, res, next) {
  // Skip auth in development mode
  if (!isProduction) {
    logger.debug({ path: req.path }, 'Development mode: skipping API key auth');
    return next();
  }

  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  const validKeys = getValidApiKeys();

  // Check if any API keys are configured
  if (validKeys.size === 0) {
    logger.warn('No API keys configured in environment');
    return res.status(500).json({
      error: 'Configuration error',
      message: 'API authentication not properly configured'
    });
  }

  // Check if API key is provided
  if (!apiKey) {
    logger.warn({
      ip: req.ip,
      path: req.path,
      method: req.method
    }, 'Missing API key');
    
    return res.status(401).json({
      error: 'Authentication required',
      message: 'API key must be provided in X-API-Key header or apiKey query parameter'
    });
  }

  // Validate API key
  if (!validKeys.has(apiKey)) {
    logger.warn({
      ip: req.ip,
      path: req.path,
      method: req.method,
      keyPrefix: apiKey.substring(0, 8) + '...'
    }, 'Invalid API key');
    
    return res.status(403).json({
      error: 'Authentication failed',
      message: 'Invalid API key'
    });
  }

  // Attach API key metadata to request
  req.apiKey = {
    key: apiKey,
    validated: true,
    timestamp: new Date().toISOString()
  };

  logger.debug({
    path: req.path,
    method: req.method,
    keyPrefix: apiKey.substring(0, 8) + '...'
  }, 'API key validated');

  next();
}

/**
 * Export for server configuration
 */
export default apiKeyAuth;
