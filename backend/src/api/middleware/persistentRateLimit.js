/**
 * Persistent Rate Limiting Middleware
 * 
 * Implements rate limiting with Redis primary storage and file-based fallback.
 * Rate limit data persists across server restarts.
 * 
 * Features:
 * - Redis-backed rate limiting (primary)
 * - File-based fallback when Redis unavailable
 * - Configurable limits per endpoint/user
 * - Graceful degradation
 * - Periodic persistence to disk
 * - Standard rate limit headers (X-RateLimit-*)
 * 
 * @module api/middleware/persistentRateLimit
 */

import { createModuleLogger } from '../../utils/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const logger = createModuleLogger('rate-limit');
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory store for file-based fallback
let rateLimitStore = new Map();
let redisClient = null;
let isRedisAvailable = false;

// Configuration
const RATE_LIMIT_FILE = path.join(__dirname, '../../../.rate-limit-data.json');
const SAVE_INTERVAL = parseInt(process.env.RATE_LIMIT_SAVE_INTERVAL || '60000', 10); // 1 minute
const DEFAULT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10); // 1 minute
const DEFAULT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);

/**
 * Load rate limit data from file
 */
function loadRateLimitData() {
  try {
    if (fs.existsSync(RATE_LIMIT_FILE)) {
      const data = JSON.parse(fs.readFileSync(RATE_LIMIT_FILE, 'utf8'));
      
      // Convert stored data back to Map with Date objects
      rateLimitStore = new Map(
        Object.entries(data).map(([key, value]) => [
          key,
          {
            count: value.count,
            resetTime: new Date(value.resetTime)
          }
        ])
      );
      
      logger.info({ entries: rateLimitStore.size }, 'Loaded rate limit data from file');
    }
  } catch (error) {
    logger.error({ err: error }, 'Failed to load rate limit data from file');
  }
}

/**
 * Save rate limit data to file
 */
function saveRateLimitData() {
  try {
    // Convert Map to plain object for JSON serialization
    const data = Object.fromEntries(
      Array.from(rateLimitStore.entries()).map(([key, value]) => [
        key,
        {
          count: value.count,
          resetTime: value.resetTime.toISOString()
        }
      ])
    );
    
    fs.writeFileSync(RATE_LIMIT_FILE, JSON.stringify(data, null, 2), 'utf8');
    logger.debug({ entries: rateLimitStore.size }, 'Saved rate limit data to file');
  } catch (error) {
    logger.error({ err: error }, 'Failed to save rate limit data to file');
  }
}

/**
 * Clean up expired entries from the store
 */
function cleanupExpiredEntries() {
  const now = new Date();
  let cleaned = 0;
  
  for (const [key, value] of rateLimitStore.entries()) {
    if (value.resetTime < now) {
      rateLimitStore.delete(key);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    logger.debug({ cleaned }, 'Cleaned up expired rate limit entries');
  }
}

/**
 * Initialize Redis connection (if available)
 */
export async function initializeRateLimiter() {
  // Try to connect to Redis if configured
  const redisUrl = process.env.REDIS_URL;
  
  if (redisUrl) {
    try {
      // Dynamically import Redis client (optional dependency)
      const { createClient } = await import('redis').catch(() => null);
      
      if (createClient) {
        redisClient = createClient({ url: redisUrl });
        
        redisClient.on('error', (err) => {
          logger.error({ err }, 'Redis client error');
          isRedisAvailable = false;
        });
        
        redisClient.on('connect', () => {
          logger.info('Redis client connected for rate limiting');
          isRedisAvailable = true;
        });
        
        await redisClient.connect();
      }
    } catch (error) {
      logger.warn({ err: error }, 'Redis not available, using file-based rate limiting');
      isRedisAvailable = false;
    }
  }
  
  // Load existing rate limit data from file
  if (!isRedisAvailable) {
    loadRateLimitData();
    
    // Set up periodic saves
    setInterval(() => {
      cleanupExpiredEntries();
      saveRateLimitData();
    }, SAVE_INTERVAL);
    
    logger.info('File-based rate limiting initialized');
  }
}

/**
 * Graceful shutdown - save rate limit data
 */
export async function shutdownRateLimiter() {
  if (!isRedisAvailable) {
    saveRateLimitData();
    logger.info('Rate limit data saved on shutdown');
  }
  
  if (redisClient) {
    await redisClient.quit();
  }
}

/**
 * Generate rate limit key for a request
 * @param {express.Request} req - Express request
 * @returns {string} Rate limit key
 */
function getRateLimitKey(req) {
  // Use API key if available, otherwise use IP address
  const identifier = req.apiKey?.key || req.ip || 'unknown';
  const path = req.route?.path || req.path || 'unknown';
  return `ratelimit:${identifier}:${path}`;
}

/**
 * Check rate limit using Redis
 * @param {string} key - Rate limit key
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Promise<Object>} Rate limit info
 */
async function checkRateLimitRedis(key, maxRequests, windowMs) {
  try {
    const ttl = Math.ceil(windowMs / 1000);
    
    // Increment counter
    const count = await redisClient.incr(key);
    
    // Set expiry on first request
    if (count === 1) {
      await redisClient.expire(key, ttl);
    }
    
    // Get TTL for reset time
    const remaining = await redisClient.ttl(key);
    const resetTime = new Date(Date.now() + remaining * 1000);
    
    return {
      count,
      remaining: Math.max(0, maxRequests - count),
      resetTime,
      exceeded: count > maxRequests
    };
  } catch (error) {
    logger.error({ err: error, key }, 'Redis rate limit check failed');
    throw error;
  }
}

/**
 * Check rate limit using file-based store
 * @param {string} key - Rate limit key
 * @param {number} maxRequests - Maximum requests allowed
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Object} Rate limit info
 */
function checkRateLimitFile(key, maxRequests, windowMs) {
  const now = new Date();
  const entry = rateLimitStore.get(key);
  
  // Create new entry if doesn't exist or expired
  if (!entry || entry.resetTime < now) {
    const resetTime = new Date(now.getTime() + windowMs);
    rateLimitStore.set(key, { count: 1, resetTime });
    
    return {
      count: 1,
      remaining: maxRequests - 1,
      resetTime,
      exceeded: false
    };
  }
  
  // Increment existing entry
  entry.count++;
  
  return {
    count: entry.count,
    remaining: Math.max(0, maxRequests - entry.count),
    resetTime: entry.resetTime,
    exceeded: entry.count > maxRequests
  };
}

/**
 * Rate Limiting Middleware
 * 
 * @param {Object} options - Rate limit options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Maximum requests per window
 * @returns {Function} Middleware function
 */
export function createRateLimit(options = {}) {
  const windowMs = options.windowMs || DEFAULT_WINDOW_MS;
  const maxRequests = options.max || DEFAULT_MAX_REQUESTS;
  
  return async function rateLimitMiddleware(req, res, next) {
    try {
      const key = getRateLimitKey(req);
      
      // Check rate limit
      let info;
      if (isRedisAvailable && redisClient) {
        info = await checkRateLimitRedis(key, maxRequests, windowMs);
      } else {
        info = checkRateLimitFile(key, maxRequests, windowMs);
      }
      
      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': maxRequests,
        'X-RateLimit-Remaining': info.remaining,
        'X-RateLimit-Reset': info.resetTime.toISOString()
      });
      
      // Check if limit exceeded
      if (info.exceeded) {
        const retryAfter = Math.ceil((info.resetTime - new Date()) / 1000);
        
        logger.warn({
          key,
          count: info.count,
          limit: maxRequests,
          resetTime: info.resetTime
        }, 'Rate limit exceeded');
        
        res.set('Retry-After', retryAfter);
        
        return res.status(429).json({
          error: 'Too many requests',
          message: `Rate limit exceeded. Try again in ${retryAfter} seconds`,
          details: {
            limit: maxRequests,
            remaining: 0,
            resetTime: info.resetTime.toISOString(),
            retryAfter
          }
        });
      }
      
      logger.debug({
        key,
        count: info.count,
        remaining: info.remaining
      }, 'Rate limit check passed');
      
      next();
    } catch (error) {
      logger.error({ err: error }, 'Rate limit middleware error');
      // On error, allow request through (fail open)
      next();
    }
  };
}

/**
 * Default rate limiter
 */
export const rateLimit = createRateLimit();

export default {
  initializeRateLimiter,
  shutdownRateLimiter,
  createRateLimit,
  rateLimit
};
