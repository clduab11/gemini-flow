/**
 * Payload Size Limit Middleware
 * 
 * Validates request payload sizes to prevent denial-of-service attacks
 * and resource exhaustion from oversized payloads.
 * 
 * Features:
 * - Configurable size limits via environment variables
 * - Per-content-type limits
 * - Byte counting before parsing
 * - Detailed error messages with size information
 * 
 * @module api/middleware/payloadSizeLimit
 */

import { createModuleLogger } from '../../utils/logger.js';

const logger = createModuleLogger('payload-size-limit');

/**
 * Parse size string (e.g., "10mb", "500kb") to bytes
 * @param {string|number} size - Size string or number
 * @returns {number} Size in bytes
 */
function parseSize(size) {
  if (typeof size === 'number') {
    return size;
  }

  const units = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024
  };

  const match = String(size).toLowerCase().match(/^(\d+(?:\.\d+)?)\s*([a-z]+)$/);
  
  if (!match) {
    return parseInt(size, 10) || 0;
  }

  const [, value, unit] = match;
  return Math.floor(parseFloat(value) * (units[unit] || 1));
}

/**
 * Format bytes to human-readable string
 * @param {number} bytes - Number of bytes
 * @returns {string} Formatted string (e.g., "1.5 MB")
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Get size limits from environment configuration
 * @returns {Object} Size limits configuration
 */
function getSizeLimits() {
  return {
    json: parseSize(process.env.MAX_JSON_SIZE || '10mb'),
    urlencoded: parseSize(process.env.MAX_URLENCODED_SIZE || '10mb'),
    raw: parseSize(process.env.MAX_RAW_SIZE || '50mb'),
    text: parseSize(process.env.MAX_TEXT_SIZE || '10mb'),
    default: parseSize(process.env.MAX_PAYLOAD_SIZE || '10mb')
  };
}

/**
 * Payload Size Limit Middleware
 * 
 * Validates incoming request payload size before parsing
 * 
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next middleware function
 */
export function payloadSizeLimit(req, res, next) {
  const contentType = req.headers['content-type'] || '';
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  const limits = getSizeLimits();

  // Determine applicable size limit based on content type
  let limit;
  if (contentType.includes('application/json')) {
    limit = limits.json;
  } else if (contentType.includes('application/x-www-form-urlencoded')) {
    limit = limits.urlencoded;
  } else if (contentType.includes('text/')) {
    limit = limits.text;
  } else if (contentType.includes('application/octet-stream')) {
    limit = limits.raw;
  } else {
    limit = limits.default;
  }

  // Check if content length exceeds limit
  if (contentLength > limit) {
    logger.warn({
      ip: req.ip,
      path: req.path,
      method: req.method,
      contentType,
      contentLength,
      limit,
      exceeded: contentLength - limit
    }, 'Payload size limit exceeded');

    return res.status(413).json({
      error: 'Payload too large',
      message: `Request payload size ${formatBytes(contentLength)} exceeds limit of ${formatBytes(limit)}`,
      details: {
        receivedSize: formatBytes(contentLength),
        maxSize: formatBytes(limit),
        contentType
      }
    });
  }

  // Track payload size for monitoring
  if (contentLength > 0) {
    logger.debug({
      path: req.path,
      method: req.method,
      contentLength,
      limit,
      utilization: Math.round((contentLength / limit) * 100) + '%'
    }, 'Payload size validated');
  }

  next();
}

/**
 * Create a custom payload size limiter with specific limits
 * 
 * @param {Object} options - Size limit options
 * @param {string|number} options.json - JSON payload limit
 * @param {string|number} options.urlencoded - URL-encoded payload limit
 * @param {string|number} options.raw - Raw payload limit
 * @param {string|number} options.text - Text payload limit
 * @returns {Function} Middleware function
 */
export function createPayloadSizeLimit(options = {}) {
  const customLimits = {
    json: parseSize(options.json || '10mb'),
    urlencoded: parseSize(options.urlencoded || '10mb'),
    raw: parseSize(options.raw || '50mb'),
    text: parseSize(options.text || '10mb'),
    default: parseSize(options.default || '10mb')
  };

  return function customPayloadSizeLimit(req, res, next) {
    const contentType = req.headers['content-type'] || '';
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);

    let limit;
    if (contentType.includes('application/json')) {
      limit = customLimits.json;
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      limit = customLimits.urlencoded;
    } else if (contentType.includes('text/')) {
      limit = customLimits.text;
    } else if (contentType.includes('application/octet-stream')) {
      limit = customLimits.raw;
    } else {
      limit = customLimits.default;
    }

    if (contentLength > limit) {
      logger.warn({
        ip: req.ip,
        path: req.path,
        contentLength,
        limit
      }, 'Custom payload size limit exceeded');

      return res.status(413).json({
        error: 'Payload too large',
        message: `Request payload size ${formatBytes(contentLength)} exceeds limit of ${formatBytes(limit)}`
      });
    }

    next();
  };
}

export default payloadSizeLimit;
