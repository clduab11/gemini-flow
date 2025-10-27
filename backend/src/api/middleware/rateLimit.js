/**
 * Rate Limiting Middleware
 *
 * Simple in-memory rate limiting to prevent API abuse.
 *
 * Sprint 7: Backend API Implementation
 */

// Store request counts: clientId -> { count, resetTime }
const requestCounts = new Map();

// Rate limit config
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100; // 100 requests per minute

/**
 * Clean up old entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [clientId, data] of requestCounts.entries()) {
    if (data.resetTime < now) {
      requestCounts.delete(clientId);
    }
  }
}, RATE_LIMIT_WINDOW_MS);

/**
 * Rate limiting middleware
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Express next function
 */
export function rateLimit(req, res, next) {
  // Get client identifier (IP or clientId from auth)
  const clientId = req.clientId || req.ip || 'unknown';
  const now = Date.now();

  // Get or create rate limit data
  let data = requestCounts.get(clientId);

  if (!data || data.resetTime < now) {
    // New window
    data = {
      count: 0,
      resetTime: now + RATE_LIMIT_WINDOW_MS
    };
    requestCounts.set(clientId, data);
  }

  // Increment count
  data.count++;

  // Check if limit exceeded
  if (data.count > MAX_REQUESTS_PER_WINDOW) {
    const retryAfter = Math.ceil((data.resetTime - now) / 1000);

    return res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        details: {
          limit: MAX_REQUESTS_PER_WINDOW,
          windowMs: RATE_LIMIT_WINDOW_MS,
          retryAfter
        }
      },
      timestamp: new Date().toISOString()
    });
  }

  // Add rate limit headers
  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS_PER_WINDOW);
  res.setHeader('X-RateLimit-Remaining', MAX_REQUESTS_PER_WINDOW - data.count);
  res.setHeader('X-RateLimit-Reset', data.resetTime);

  next();
}

export default { rateLimit };
