/**
 * WebSocket Authentication Middleware
 * 
 * Provides authentication for WebSocket connections using:
 * - JWT tokens for session-based auth
 * - API keys for service-to-service auth
 * 
 * Features:
 * - Dual authentication methods (JWT or API key)
 * - Query parameter and header support
 * - Connection metadata tracking
 * - Development mode bypass
 * 
 * @module api/middleware/websocketAuth
 */

import { createModuleLogger } from '../../utils/logger.js';

const logger = createModuleLogger('websocket-auth');
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Get valid API keys from environment
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
 * Verify JWT token (placeholder for actual JWT verification)
 * In production, this should use proper JWT library like jsonwebtoken
 * 
 * @param {string} token - JWT token to verify
 * @returns {Object|null} Decoded token payload or null if invalid
 */
function verifyJWT(token) {
  // In development, accept any token
  if (!isProduction) {
    return { userId: 'dev-user', type: 'development' };
  }

  // TODO: Implement actual JWT verification with jsonwebtoken library
  // For now, basic validation
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    // Decode payload (Note: This doesn't verify signature!)
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    // Check expiration
    if (payload.exp && payload.exp < Date.now() / 1000) {
      logger.debug('JWT token expired');
      return null;
    }
    
    return payload;
  } catch (error) {
    logger.error({ err: error }, 'JWT verification failed');
    return null;
  }
}

/**
 * Authenticate WebSocket connection
 * 
 * @param {Object} info - WebSocket connection info
 * @param {Function} callback - Callback function (authenticated: boolean)
 */
export function authenticateWebSocket(info, callback) {
  const { req } = info;
  
  // Skip in development mode
  if (!isProduction) {
    logger.debug('Development mode: allowing WebSocket connection');
    return callback(true);
  }

  // Extract authentication credentials
  const url = new URL(req.url, `http://${req.headers.host}`);
  const token = url.searchParams.get('token');
  const apiKey = url.searchParams.get('apiKey') || req.headers['x-api-key'];

  // Try API key authentication first
  if (apiKey) {
    const validKeys = getValidApiKeys();
    
    if (validKeys.has(apiKey)) {
      logger.info({
        ip: req.socket.remoteAddress,
        keyPrefix: apiKey.substring(0, 8) + '...'
      }, 'WebSocket authenticated via API key');
      
      // Attach auth metadata
      req.wsAuth = {
        type: 'api-key',
        key: apiKey,
        timestamp: new Date().toISOString()
      };
      
      return callback(true);
    }
    
    logger.warn({
      ip: req.socket.remoteAddress,
      keyPrefix: apiKey.substring(0, 8) + '...'
    }, 'Invalid API key for WebSocket');
  }

  // Try JWT authentication
  if (token) {
    const decoded = verifyJWT(token);
    
    if (decoded) {
      logger.info({
        ip: req.socket.remoteAddress,
        userId: decoded.userId
      }, 'WebSocket authenticated via JWT');
      
      // Attach auth metadata
      req.wsAuth = {
        type: 'jwt',
        user: decoded,
        timestamp: new Date().toISOString()
      };
      
      return callback(true);
    }
    
    logger.warn({
      ip: req.socket.remoteAddress
    }, 'Invalid JWT token for WebSocket');
  }

  // No valid authentication provided
  logger.warn({
    ip: req.socket.remoteAddress,
    url: req.url
  }, 'WebSocket authentication failed: no valid credentials');
  
  callback(false);
}

/**
 * Express middleware to verify WebSocket upgrade requests
 * Use this before upgrading HTTP connections to WebSocket
 */
export function verifyWebSocketUpgrade(req, res, next) {
  if (!isProduction) {
    return next();
  }

  const token = req.query.token;
  const apiKey = req.query.apiKey || req.headers['x-api-key'];

  if (!token && !apiKey) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'WebSocket connection requires token or API key'
    });
  }

  // Validate credentials
  if (apiKey) {
    const validKeys = getValidApiKeys();
    if (validKeys.has(apiKey)) {
      return next();
    }
  }

  if (token) {
    const decoded = verifyJWT(token);
    if (decoded) {
      return next();
    }
  }

  return res.status(403).json({
    error: 'Authentication failed',
    message: 'Invalid credentials for WebSocket connection'
  });
}

export default {
  authenticateWebSocket,
  verifyWebSocketUpgrade
};
