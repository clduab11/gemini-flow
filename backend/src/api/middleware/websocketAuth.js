/**
 * WebSocket Authentication Middleware
 *
 * Implements secure authentication for WebSocket connections
 * Issue #67: Implement WebSocket Authentication
 */

import { logger } from '../../utils/logger.js';
import jwt from 'jsonwebtoken';

const wsAuthLogger = logger.child({ module: 'websocket-auth' });

/**
 * WebSocket authentication middleware for Socket.IO
 *
 * Validates authentication token before allowing WebSocket connection
 *
 * @param {Object} socket - Socket.IO socket instance
 * @param {Function} next - Next middleware function
 */
export function authenticateWebSocket(socket, next) {
  try {
    // Extract authentication token from various sources
    const token = extractToken(socket);

    if (!token) {
      wsAuthLogger.warn({
        socketId: socket.id,
        ip: socket.handshake.address
      }, 'WebSocket connection attempt without token');

      return next(new Error('Authentication token required'));
    }

    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET || 'default-secret-change-in-production';

    try {
      const decoded = jwt.verify(token, jwtSecret);

      // Attach user information to socket
      socket.user = {
        id: decoded.userId || decoded.sub,
        email: decoded.email,
        roles: decoded.roles || [],
        apiKeyId: decoded.apiKeyId,
        authenticatedAt: new Date().toISOString()
      };

      wsAuthLogger.info({
        socketId: socket.id,
        userId: socket.user.id,
        ip: socket.handshake.address
      }, 'WebSocket authenticated successfully');

      next();
    } catch (jwtError) {
      wsAuthLogger.warn({
        socketId: socket.id,
        error: jwtError.message,
        ip: socket.handshake.address
      }, 'Invalid WebSocket authentication token');

      return next(new Error('Invalid authentication token'));
    }
  } catch (error) {
    wsAuthLogger.error({
      socketId: socket.id,
      error: error.message
    }, 'WebSocket authentication error');

    next(new Error('Authentication failed'));
  }
}

/**
 * Extract authentication token from socket handshake
 *
 * Checks:
 * 1. Query parameter: ?token=<jwt>
 * 2. Auth object: socket.handshake.auth.token
 * 3. Headers: socket.handshake.headers.authorization
 */
function extractToken(socket) {
  // Check query parameter
  if (socket.handshake.query && socket.handshake.query.token) {
    return socket.handshake.query.token;
  }

  // Check auth object (recommended approach for Socket.IO v3+)
  if (socket.handshake.auth && socket.handshake.auth.token) {
    return socket.handshake.auth.token;
  }

  // Check Authorization header
  const authHeader = socket.handshake.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

/**
 * API Key-based WebSocket authentication
 * Alternative to JWT for simpler use cases
 */
export function authenticateWebSocketWithApiKey(socket, next) {
  try {
    const apiKey = extractApiKey(socket);

    if (!apiKey) {
      wsAuthLogger.warn({
        socketId: socket.id,
        ip: socket.handshake.address
      }, 'WebSocket connection attempt without API key');

      return next(new Error('API key required'));
    }

    // Validate API key
    const validApiKeys = getValidApiKeys();

    if (!validApiKeys.includes(apiKey)) {
      wsAuthLogger.warn({
        socketId: socket.id,
        keyPrefix: apiKey.substring(0, 8) + '...',
        ip: socket.handshake.address
      }, 'Invalid WebSocket API key');

      return next(new Error('Invalid API key'));
    }

    // Attach API key metadata to socket
    socket.apiKey = {
      key: apiKey,
      keyId: apiKey.substring(0, 8),
      authenticatedAt: new Date().toISOString()
    };

    wsAuthLogger.info({
      socketId: socket.id,
      keyId: socket.apiKey.keyId,
      ip: socket.handshake.address
    }, 'WebSocket authenticated with API key');

    next();
  } catch (error) {
    wsAuthLogger.error({
      socketId: socket.id,
      error: error.message
    }, 'WebSocket API key authentication error');

    next(new Error('Authentication failed'));
  }
}

/**
 * Extract API key from socket handshake
 */
function extractApiKey(socket) {
  // Check query parameter
  if (socket.handshake.query && socket.handshake.query.apiKey) {
    return socket.handshake.query.apiKey;
  }

  // Check auth object
  if (socket.handshake.auth && socket.handshake.auth.apiKey) {
    return socket.handshake.auth.apiKey;
  }

  // Check X-API-Key header
  if (socket.handshake.headers['x-api-key']) {
    return socket.handshake.headers['x-api-key'];
  }

  return null;
}

/**
 * Get valid API keys from environment
 */
function getValidApiKeys() {
  const apiKeysEnv = process.env.API_KEYS || process.env.GEMINI_API_KEY || '';
  return apiKeysEnv.split(',').map(key => key.trim()).filter(Boolean);
}

/**
 * Generate JWT token for WebSocket authentication
 *
 * @param {Object} payload - Token payload (userId, email, etc.)
 * @param {string} expiresIn - Token expiration (default: '24h')
 */
export function generateWebSocketToken(payload, expiresIn = '24h') {
  const jwtSecret = process.env.JWT_SECRET || 'default-secret-change-in-production';

  return jwt.sign(payload, jwtSecret, {
    expiresIn,
    issuer: 'gemini-flow',
    audience: 'gemini-flow-websocket'
  });
}

/**
 * WebSocket rate limiting per connection
 * Prevents abuse of WebSocket connections
 */
export function rateLimitWebSocket(socket, next) {
  const rateLimit = {
    maxEventsPerMinute: parseInt(process.env.WS_MAX_EVENTS_PER_MINUTE || '100', 10),
    events: [],
    windowMs: 60000 // 1 minute
  };

  socket.rateLimit = rateLimit;

  // Add rate limiting checker
  socket.use((packet, next) => {
    const now = Date.now();

    // Remove old events outside the window
    rateLimit.events = rateLimit.events.filter(
      timestamp => now - timestamp < rateLimit.windowMs
    );

    // Check if rate limit exceeded
    if (rateLimit.events.length >= rateLimit.maxEventsPerMinute) {
      wsAuthLogger.warn({
        socketId: socket.id,
        eventCount: rateLimit.events.length,
        limit: rateLimit.maxEventsPerMinute
      }, 'WebSocket rate limit exceeded');

      socket.emit('error', {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many events. Please slow down.'
      });

      return; // Don't call next() - drop the packet
    }

    // Record this event
    rateLimit.events.push(now);

    next();
  });

  next();
}
