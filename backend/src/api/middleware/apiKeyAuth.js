/**
 * API Key Authentication Middleware
 *
 * Enforces API key requirement in production environments
 * Issue #69: Enforce API Key Requirement in Production
 */

import { logger } from '../../utils/logger.js';

const authLogger = logger.child({ module: 'api-key-auth' });

/**
 * Validates API key from request headers
 *
 * Checks for API key in:
 * - Authorization: Bearer <key>
 * - X-API-Key: <key>
 * - query parameter: api_key=<key> (discouraged, but supported)
 */
export function apiKeyAuth(req, res, next) {
  const isProduction = process.env.NODE_ENV === 'production';

  // Skip authentication in development mode (configurable)
  if (!isProduction && process.env.SKIP_API_KEY_AUTH === 'true') {
    authLogger.debug({ path: req.path }, 'API key auth skipped (development mode)');
    return next();
  }

  // Extract API key from various sources
  let apiKey = null;

  // Check Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    apiKey = authHeader.substring(7);
  }

  // Check X-API-Key header
  if (!apiKey && req.headers['x-api-key']) {
    apiKey = req.headers['x-api-key'];
  }

  // Check query parameter (least secure, logged as warning)
  if (!apiKey && req.query.api_key) {
    apiKey = req.query.api_key;
    authLogger.warn({
      path: req.path,
      ip: req.ip
    }, 'API key provided in query parameter (insecure)');
  }

  // Validate API key presence
  if (!apiKey) {
    authLogger.warn({
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    }, 'Missing API key');

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'API key required. Provide via Authorization header or X-API-Key header.',
      code: 'MISSING_API_KEY'
    });
  }

  // Validate API key format (basic validation)
  if (apiKey.length < 32) {
    authLogger.warn({
      path: req.path,
      ip: req.ip,
      keyLength: apiKey.length
    }, 'Invalid API key format');

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid API key format',
      code: 'INVALID_API_KEY_FORMAT'
    });
  }

  // Validate against configured API keys
  const validApiKeys = getValidApiKeys();

  if (!validApiKeys.includes(apiKey)) {
    authLogger.warn({
      path: req.path,
      ip: req.ip,
      keyPrefix: apiKey.substring(0, 8) + '...'
    }, 'Invalid API key');

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid API key',
      code: 'INVALID_API_KEY'
    });
  }

  // Attach API key metadata to request for downstream use
  req.apiKey = {
    key: apiKey,
    keyId: apiKey.substring(0, 8),
    validatedAt: new Date().toISOString()
  };

  authLogger.debug({
    path: req.path,
    keyId: req.apiKey.keyId
  }, 'API key validated');

  next();
}

/**
 * Get valid API keys from environment or configuration
 * Supports multiple API keys separated by commas
 */
function getValidApiKeys() {
  const apiKeysEnv = process.env.API_KEYS || process.env.GEMINI_API_KEY || '';

  if (!apiKeysEnv) {
    authLogger.warn('No API keys configured in environment');
    return [];
  }

  // Support multiple keys separated by commas
  return apiKeysEnv.split(',').map(key => key.trim()).filter(Boolean);
}

/**
 * Optional API key auth - allows requests without API key but logs them
 * Useful for transitioning to mandatory API keys
 */
export function optionalApiKeyAuth(req, res, next) {
  const apiKey = req.headers.authorization?.substring(7) ||
                 req.headers['x-api-key'] ||
                 req.query.api_key;

  if (!apiKey) {
    authLogger.info({
      path: req.path,
      ip: req.ip
    }, 'Request without API key (optional auth)');
  } else {
    req.apiKey = { key: apiKey, keyId: apiKey.substring(0, 8) };
  }

  next();
}
