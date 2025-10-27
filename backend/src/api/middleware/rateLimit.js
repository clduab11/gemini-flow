/**
 * Rate Limiting Middleware with Persistent Storage
 * 
 * Supports two persistence modes:
 * 1. File-based (single instance, simple setup)
 * 2. Redis-based (distributed, production-ready)
 * 
 * Prevents rate limit bypass via server restarts by persisting
 * request counts to durable storage.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rate limit configuration
const MAX_REQUESTS_PER_WINDOW = 100;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// File-based persistence configuration
const DATA_DIR = path.join(process.cwd(), '.data');
const RATE_LIMIT_FILE = path.join(DATA_DIR, 'rate-limits.json');
const PERSIST_INTERVAL_MS = 30000; // 30 seconds

// In-memory storage (used by both file-based and as fallback for Redis)
const requestCounts = new Map();

// Persistence state
let persistenceInterval = null;
let redis = null;
let useRedis = false;
let logger = console; // Default logger

/**
 * Set custom logger for the rate limiter
 */
export function setRateLimitLogger(customLogger) {
  logger = customLogger;
}

/**
 * Load rate limits from file storage
 */
async function loadRateLimits() {
  try {
    const data = await fs.readFile(RATE_LIMIT_FILE, 'utf-8');
    const stored = JSON.parse(data);
    
    // Convert stored array back to Map and filter expired entries
    const now = Date.now();
    const windowStart = now - WINDOW_MS;
    
    let loadedClients = 0;
    for (const [clientId, requests] of stored) {
      const validRequests = requests.filter(timestamp => timestamp > windowStart);
      if (validRequests.length > 0) {
        requestCounts.set(clientId, validRequests);
        loadedClients++;
      }
    }
    
    logger.info({ clients: loadedClients }, 'Rate limits loaded from disk');
  } catch (error) {
    if (error.code !== 'ENOENT') {
      logger.error({ error: error.message }, 'Failed to load rate limits');
    } else {
      logger.info('No existing rate limit data found, starting fresh');
    }
  }
}

/**
 * Persist rate limits to file storage
 */
async function persistRateLimits() {
  try {
    const now = Date.now();
    const windowStart = now - WINDOW_MS;
    
    // Clean up expired entries before persisting
    const activeClients = [];
    for (const [clientId, requests] of requestCounts.entries()) {
      const validRequests = requests.filter(timestamp => timestamp > windowStart);
      if (validRequests.length > 0) {
        activeClients.push([clientId, validRequests]);
      } else {
        requestCounts.delete(clientId);
      }
    }
    
    // Ensure data directory exists
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    // Write to file
    await fs.writeFile(RATE_LIMIT_FILE, JSON.stringify(activeClients));
    logger.debug({ clients: activeClients.length }, 'Rate limits persisted to disk');
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to persist rate limits');
  }
}

/**
 * Start file-based persistence scheduler
 */
export async function startRateLimitPersistence() {
  logger.info('Initializing file-based rate limit persistence');
  
  // Load existing rate limits
  await loadRateLimits();
  
  // Persist every 30 seconds
  persistenceInterval = setInterval(() => {
    persistRateLimits().catch(err => {
      logger.error({ error: err.message }, 'Periodic persistence failed');
    });
  }, PERSIST_INTERVAL_MS);
  
  // Persist on graceful shutdown
  const shutdownHandler = async (signal) => {
    logger.info({ signal }, 'Received shutdown signal, persisting rate limits');
    try {
      await persistRateLimits();
      logger.info('Rate limits persisted successfully before shutdown');
    } catch (error) {
      logger.error({ error: error.message }, 'Failed to persist rate limits on shutdown');
    }
  };
  
  process.on('SIGTERM', () => shutdownHandler('SIGTERM'));
  process.on('SIGINT', () => shutdownHandler('SIGINT'));
  
  logger.info('File-based rate limit persistence started');
}

/**
 * Stop file-based persistence
 */
export function stopRateLimitPersistence() {
  if (persistenceInterval) {
    clearInterval(persistenceInterval);
    persistenceInterval = null;
    logger.info('Rate limit persistence stopped');
  }
}

/**
 * Initialize Redis-based rate limit store
 */
export async function initRateLimitStore() {
  try {
    // Dynamically import ioredis only if Redis is configured
    const Redis = (await import('ioredis')).default;
    
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB) || 0,
      lazyConnect: true,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3
    });
    
    await redis.connect();
    useRedis = true;
    logger.info('Rate limiting using Redis backend');
    
    // Handle Redis errors gracefully
    redis.on('error', (error) => {
      logger.error({ error: error.message }, 'Redis error, may fallback to in-memory');
      useRedis = false;
    });
    
    redis.on('reconnecting', () => {
      logger.info('Reconnecting to Redis');
    });
    
    redis.on('connect', () => {
      logger.info('Redis connection established');
      useRedis = true;
    });
    
  } catch (error) {
    logger.warn({ error: error.message }, 'Redis unavailable, using in-memory rate limiting');
    useRedis = false;
  }
}

/**
 * Redis-based rate limiting implementation
 */
async function rateLimitRedis(clientId, now, req, res, next) {
  const key = `ratelimit:${clientId}`;
  
  try {
    // Use Redis sorted set with timestamps as scores
    const windowStart = now - WINDOW_MS;
    
    // Remove old entries
    await redis.zremrangebyscore(key, 0, windowStart);
    
    // Count current requests in window
    const count = await redis.zcard(key);
    
    if (count >= MAX_REQUESTS_PER_WINDOW) {
      const oldestRequest = await redis.zrange(key, 0, 0, 'WITHSCORES');
      const resetTime = oldestRequest.length > 0 
        ? parseInt(oldestRequest[1]) + WINDOW_MS 
        : now + WINDOW_MS;
      
      return res.status(429).json({
        error: {
          message: 'Too many requests',
          retryAfter: Math.ceil((resetTime - now) / 1000)
        }
      });
    }
    
    // Add current request
    await redis.zadd(key, now, `${now}-${Math.random()}`);
    await redis.expire(key, Math.ceil(WINDOW_MS / 1000));
    
    // Add headers
    res.setHeader('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW);
    res.setHeader('X-RateLimit-Remaining', MAX_REQUESTS_PER_WINDOW - count - 1);
    res.setHeader('X-RateLimit-Reset', Math.ceil((now + WINDOW_MS) / 1000));
    
    next();
  } catch (error) {
    logger.error({ error: error.message }, 'Redis rate limit check failed, allowing request');
    // Fail open - allow the request if Redis fails
    next();
  }
}

/**
 * In-memory rate limiting implementation
 */
function rateLimitMemory(clientId, now, req, res, next) {
  const windowStart = now - WINDOW_MS;
  
  // Get or initialize count for this client
  if (!requestCounts.has(clientId)) {
    requestCounts.set(clientId, []);
  }
  
  const requests = requestCounts.get(clientId);
  
  // Remove requests outside the current window
  const validRequests = requests.filter(timestamp => timestamp > windowStart);
  requestCounts.set(clientId, validRequests);
  
  // Check if limit exceeded
  if (validRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldestRequest = validRequests[0];
    const resetTime = oldestRequest + WINDOW_MS;
    
    return res.status(429).json({
      error: {
        message: 'Too many requests',
        retryAfter: Math.ceil((resetTime - now) / 1000)
      }
    });
  }
  
  // Add current request
  validRequests.push(now);
  requestCounts.set(clientId, validRequests);
  
  // Add headers
  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW);
  res.setHeader('X-RateLimit-Remaining', MAX_REQUESTS_PER_WINDOW - validRequests.length);
  res.setHeader('X-RateLimit-Reset', Math.ceil((now + WINDOW_MS) / 1000));
  
  next();
}

/**
 * Main rate limit middleware
 */
export async function rateLimit(req, res, next) {
  const clientId = req.clientId || req.ip || 'unknown';
  const now = Date.now();
  
  if (useRedis && redis) {
    await rateLimitRedis(clientId, now, req, res, next);
  } else {
    rateLimitMemory(clientId, now, req, res, next);
  }
}

/**
 * Get remaining requests for a client (useful for testing)
 */
export function getRemainingRequests(clientId) {
  if (!requestCounts.has(clientId)) {
    return MAX_REQUESTS_PER_WINDOW;
  }
  
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  const requests = requestCounts.get(clientId);
  const validRequests = requests.filter(timestamp => timestamp > windowStart);
  
  return Math.max(0, MAX_REQUESTS_PER_WINDOW - validRequests.length);
}

/**
 * Clear all rate limit data (useful for testing)
 */
export function clearRateLimits() {
  requestCounts.clear();
  logger.debug('Rate limit data cleared');
}

// Export for testing
export { requestCounts, persistRateLimits, loadRateLimits };
