/**
 * Authentication Middleware for Gemini Flow Backend
 * 
 * Provides secure API key validation with:
 * - Production enforcement (requires API_KEY in production)
 * - Multiple API key support with role-based scopes
 * - API key hashing for secure logging
 * - Minimum key length validation
 */

import crypto from 'crypto';

// Environment configuration
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';

// API Key configuration
const DEFAULT_API_KEY = process.env.API_KEY;

// Multiple API keys with scopes
const API_KEYS = new Map();

// Initialize API keys map
function initializeApiKeys() {
  const keyConfigs = [
    { env: 'API_KEY', scope: 'default', name: 'Default Key' },
    { env: 'API_KEY_ADMIN', scope: 'admin', name: 'Admin Key' },
    { env: 'API_KEY_TUI', scope: 'tui', name: 'TUI Client' },
    { env: 'API_KEY_BROWSER', scope: 'browser', name: 'Browser Client' },
    { env: 'API_KEY_READONLY', scope: 'readonly', name: 'Read-Only Key' }
  ];

  keyConfigs.forEach(({ env, scope, name }) => {
    const key = process.env[env];
    if (key) {
      API_KEYS.set(key, { scope, name });
    }
  });

  return API_KEYS;
}

// Initialize keys on module load
initializeApiKeys();

/**
 * Hash API key for secure logging
 * 
 * NOTE: This is NOT for password verification or authentication.
 * This hash is used ONLY for display/logging purposes to avoid exposing
 * the full API key in logs. Actual authentication is done by direct
 * comparison of the raw API key values (see authenticate middleware).
 * 
 * SHA-256 is sufficient for this use case as we're not storing or
 * verifying credentials - just creating a short identifier for logs.
 * 
 * @param {string} key - API key to hash
 * @returns {string} - First 8 characters of SHA-256 hash
 */
function hashApiKey(key) {
  if (!key) return 'none';
  return crypto.createHash('sha256').update(key).digest('hex').substring(0, 8);
}

/**
 * Validate API key configuration at startup
 * @throws {Error} - If configuration is invalid in production
 */
export function validateApiKeyConfig() {
  // Check if any API key is configured
  const hasAnyKey = API_KEYS.size > 0;

  // In production, API key is REQUIRED
  if (IS_PRODUCTION && !hasAnyKey) {
    console.error('❌ FATAL: API_KEY environment variable is required in production');
    console.error('   Set API_KEY in your environment or .env file');
    console.error('   Generate a secure key with: openssl rand -hex 32');
    throw new Error('API_KEY environment variable required in production');
  }

  // Validate key length for security
  if (DEFAULT_API_KEY && DEFAULT_API_KEY.length < 32) {
    const message = `⚠️  WARNING: API_KEY should be at least 32 characters for security (current: ${DEFAULT_API_KEY.length})`;
    console.warn(message);
    
    // In production, short keys are not allowed
    if (IS_PRODUCTION) {
      console.error('❌ FATAL: API_KEY too short for production use');
      throw new Error('API_KEY must be at least 32 characters in production');
    }
  }

  // Validate all configured API keys
  API_KEYS.forEach((info, key) => {
    if (key.length < 32) {
      const message = `⚠️  WARNING: ${info.name} (${info.scope}) should be at least 32 characters (current: ${key.length})`;
      console.warn(message);
      
      if (IS_PRODUCTION) {
        console.error(`❌ FATAL: ${info.name} too short for production use`);
        throw new Error(`${info.name} must be at least 32 characters in production`);
      }
    }
  });

  // Log successful configuration (with hashed keys)
  if (DEFAULT_API_KEY) {
    console.log(`✅ API_KEY configured (hash: ${hashApiKey(DEFAULT_API_KEY)})`);
  }
  
  if (API_KEYS.size > 0) {
    console.log(`✅ ${API_KEYS.size} scoped API key(s) configured:`);
    API_KEYS.forEach((info, key) => {
      console.log(`   - ${info.name} (${info.scope}): ${hashApiKey(key)}`);
    });
  }

  return true;
}

/**
 * Express middleware for API key authentication
 * 
 * @param {Object} options - Configuration options
 * @param {boolean} options.required - Whether authentication is required (default: true)
 * @param {Array<string>} options.scopes - Required scopes for access (default: [])
 * @returns {Function} - Express middleware function
 */
export function authenticate(options = {}) {
  const { required = true, scopes = [] } = options;

  return (req, res, next) => {
    // Get API key from header
    const apiKey = req.headers['x-api-key'];

    // If authentication is not required, skip validation
    if (!required) {
      return next();
    }

    // Check if API key is provided
    if (!apiKey) {
      return res.status(401).json({
        error: {
          code: 'MISSING_API_KEY',
          message: 'API key is required. Please provide X-API-Key header.'
        }
      });
    }

    // Compute hash once per request to avoid redundant SHA-256 operations
    const apiKeyHash = hashApiKey(apiKey);

    // Check if API key is valid (matches DEFAULT_API_KEY or is in API_KEYS map)
    let keyInfo = API_KEYS.get(apiKey);
    
    // Fallback to default key check if not in map
    if (!keyInfo && apiKey === DEFAULT_API_KEY) {
      keyInfo = { scope: 'default', name: 'Default Key' };
    }

    if (!keyInfo) {
      // Log failed authentication attempt (with hashed key)
      console.warn(`⚠️  Authentication failed - invalid API key (hash: ${apiKeyHash})`);
      
      return res.status(401).json({
        error: {
          code: 'INVALID_API_KEY',
          message: 'Invalid API key provided.'
        }
      });
    }

    // Validate scopes if required
    if (scopes.length > 0 && !scopes.includes(keyInfo.scope)) {
      console.warn(`⚠️  Authorization failed - insufficient permissions (scope: ${keyInfo.scope}, required: ${scopes.join(', ')})`);
      
      return res.status(403).json({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Insufficient permissions for this operation.',
          requiredScopes: scopes,
          currentScope: keyInfo.scope
        }
      });
    }

    // Attach authentication info to request (with hashed key)
    req.auth = {
      clientId: keyInfo.name,
      scope: keyInfo.scope,
      apiKeyHash: apiKeyHash
    };

    // Log successful authentication (with hashed key)
    console.log(`✅ Authentication successful - ${keyInfo.name} (${keyInfo.scope}) [hash: ${apiKeyHash}]`);

    next();
  };
}

/**
 * Development-only middleware that allows requests without API key
 */
export function authenticateDev(options = {}) {
  if (IS_PRODUCTION) {
    // In production, always require authentication
    return authenticate(options);
  }
  
  // In development, make authentication optional
  return authenticate({ ...options, required: false });
}

export default {
  authenticate,
  authenticateDev,
  validateApiKeyConfig,
  hashApiKey
};
