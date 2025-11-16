/**
 * Persistent Rate Limiting Middleware
 *
 * Implements rate limiting with persistence across server restarts
 * Issue #75: Persist Rate Limit Data Across Restarts
 */

import { RateLimiterMemory, RateLimiterRedis } from 'rate-limiter-flexible';
import { logger } from '../../utils/logger.js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rateLimitLogger = logger.child({ module: 'rate-limit' });

// Storage for rate limit data
const RATE_LIMIT_STORAGE_PATH = process.env.RATE_LIMIT_STORAGE_PATH ||
  path.join(__dirname, '../../../data/rate-limits.json');

/**
 * Create rate limiter with persistence support
 *
 * Supports both Redis (preferred) and file-based persistence
 */
export async function createPersistentRateLimiter(options = {}) {
  const {
    points = 100, // Number of requests
    duration = 60, // Per 60 seconds
    blockDuration = 60, // Block for 60 seconds if exceeded
    keyPrefix = 'rl',
    useRedis = process.env.REDIS_URL ? true : false
  } = options;

  if (useRedis) {
    return await createRedisRateLimiter({
      points,
      duration,
      blockDuration,
      keyPrefix
    });
  } else {
    return await createFileBasedRateLimiter({
      points,
      duration,
      blockDuration,
      keyPrefix
    });
  }
}

/**
 * Create Redis-based rate limiter (preferred for production)
 */
async function createRedisRateLimiter(options) {
  try {
    const { createClient } = await import('redis');
    const redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: {
        connectTimeout: 5000
      }
    });

    redisClient.on('error', (err) => {
      rateLimitLogger.error({ err }, 'Redis client error');
    });

    await redisClient.connect();

    const rateLimiter = new RateLimiterRedis({
      storeClient: redisClient,
      points: options.points,
      duration: options.duration,
      blockDuration: options.blockDuration,
      keyPrefix: options.keyPrefix,
      insuranceLimiter: new RateLimiterMemory({
        points: options.points,
        duration: options.duration
      })
    });

    rateLimitLogger.info({
      backend: 'redis',
      points: options.points,
      duration: options.duration
    }, 'Rate limiter initialized with Redis');

    return rateLimiter;
  } catch (error) {
    rateLimitLogger.warn({
      err: error,
      fallback: 'file-based'
    }, 'Failed to initialize Redis rate limiter, falling back to file-based');

    return await createFileBasedRateLimiter(options);
  }
}

/**
 * Create file-based rate limiter with periodic persistence
 */
async function createFileBasedRateLimiter(options) {
  const rateLimiter = new RateLimiterMemory({
    points: options.points,
    duration: options.duration,
    blockDuration: options.blockDuration
  });

  // Wrap the consume method to track consumption
  const originalConsume = rateLimiter.consume.bind(rateLimiter);
  const consumptionData = await loadRateLimitData();

  rateLimiter.consume = async function(key, pointsToConsume = 1) {
    const result = await originalConsume(key, pointsToConsume);

    // Track consumption
    if (!consumptionData[key]) {
      consumptionData[key] = {
        points: 0,
        resetAt: Date.now() + (options.duration * 1000)
      };
    }

    consumptionData[key].points = result.consumedPoints;
    consumptionData[key].remainingPoints = result.remainingPoints;
    consumptionData[key].lastConsumed = Date.now();

    return result;
  };

  // Periodically save rate limit data
  const saveInterval = setInterval(async () => {
    await saveRateLimitData(consumptionData);
  }, 30000); // Save every 30 seconds

  // Save on process exit
  process.on('SIGTERM', async () => {
    clearInterval(saveInterval);
    await saveRateLimitData(consumptionData);
  });

  process.on('SIGINT', async () => {
    clearInterval(saveInterval);
    await saveRateLimitData(consumptionData);
  });

  rateLimitLogger.info({
    backend: 'file',
    storagePath: RATE_LIMIT_STORAGE_PATH,
    points: options.points,
    duration: options.duration
  }, 'Rate limiter initialized with file persistence');

  return rateLimiter;
}

/**
 * Load rate limit data from file
 */
async function loadRateLimitData() {
  try {
    // Ensure directory exists
    const dir = path.dirname(RATE_LIMIT_STORAGE_PATH);
    await fs.mkdir(dir, { recursive: true });

    // Load existing data
    const data = await fs.readFile(RATE_LIMIT_STORAGE_PATH, 'utf-8');
    const parsed = JSON.parse(data);

    // Clean up expired entries
    const now = Date.now();
    const cleaned = {};
    let expiredCount = 0;

    for (const [key, value] of Object.entries(parsed)) {
      if (value.resetAt && value.resetAt > now) {
        cleaned[key] = value;
      } else {
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      rateLimitLogger.debug({
        expiredCount,
        activeCount: Object.keys(cleaned).length
      }, 'Cleaned expired rate limit entries');
    }

    return cleaned;
  } catch (error) {
    if (error.code === 'ENOENT') {
      // File doesn't exist yet, return empty object
      return {};
    }

    rateLimitLogger.error({ err: error }, 'Error loading rate limit data');
    return {};
  }
}

/**
 * Save rate limit data to file atomically
 */
async function saveRateLimitData(data) {
  try {
    const tempPath = RATE_LIMIT_STORAGE_PATH + '.tmp';

    // Write to temporary file
    await fs.writeFile(tempPath, JSON.stringify(data, null, 2), 'utf-8');

    // Atomic rename
    await fs.rename(tempPath, RATE_LIMIT_STORAGE_PATH);

    rateLimitLogger.debug({
      entries: Object.keys(data).length,
      path: RATE_LIMIT_STORAGE_PATH
    }, 'Rate limit data saved');
  } catch (error) {
    rateLimitLogger.error({ err: error }, 'Error saving rate limit data');
  }
}

/**
 * Express middleware for rate limiting
 */
export function rateLimitMiddleware(rateLimiter) {
  return async (req, res, next) => {
    try {
      // Use IP address as key, or API key if available
      const key = req.apiKey?.keyId || req.ip || 'unknown';

      const result = await rateLimiter.consume(key);

      // Add rate limit headers
      res.set({
        'X-RateLimit-Limit': rateLimiter.points || 100,
        'X-RateLimit-Remaining': result.remainingPoints,
        'X-RateLimit-Reset': new Date(Date.now() + result.msBeforeNext).toISOString()
      });

      next();
    } catch (rateLimiterRes) {
      // Rate limit exceeded
      rateLimitLogger.warn({
        key: req.apiKey?.keyId || req.ip,
        path: req.path,
        msBeforeNext: rateLimiterRes.msBeforeNext
      }, 'Rate limit exceeded');

      res.set({
        'X-RateLimit-Limit': rateLimiter.points || 100,
        'X-RateLimit-Remaining': 0,
        'X-RateLimit-Reset': new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString(),
        'Retry-After': Math.ceil(rateLimiterRes.msBeforeNext / 1000)
      });

      res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil(rateLimiterRes.msBeforeNext / 1000),
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }
  };
}

/**
 * Create multiple rate limiters for different routes
 */
export async function createRateLimiters() {
  const [globalLimiter, apiLimiter, authLimiter] = await Promise.all([
    // Global rate limiter: 100 requests per minute
    createPersistentRateLimiter({
      points: 100,
      duration: 60,
      keyPrefix: 'rl_global'
    }),

    // API rate limiter: 1000 requests per hour
    createPersistentRateLimiter({
      points: 1000,
      duration: 3600,
      keyPrefix: 'rl_api'
    }),

    // Auth rate limiter: 5 attempts per 15 minutes
    createPersistentRateLimiter({
      points: 5,
      duration: 900,
      blockDuration: 900,
      keyPrefix: 'rl_auth'
    })
  ]);

  return {
    global: globalLimiter,
    api: apiLimiter,
    auth: authLimiter
  };
}
