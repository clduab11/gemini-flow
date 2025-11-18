/**
 * Request Payload Size Validation Middleware
 *
 * Implements comprehensive payload size limits to prevent:
 * - DoS attacks via large payloads
 * - Memory exhaustion
 * - Bandwidth abuse
 *
 * Issue #70: Implement Request Payload Size Validation
 */

import { logger } from '../../utils/logger.js';
import express from 'express';

const limitLogger = logger.child({ module: 'payload-limit' });

// Default size limits (configurable via environment)
const DEFAULT_JSON_LIMIT = '1mb';
const DEFAULT_TEXT_LIMIT = '1mb';
const DEFAULT_URLENCODED_LIMIT = '1mb';
const DEFAULT_FILE_UPLOAD_LIMIT = '10mb';

// Get limit from environment or use default
function getLimit(envVar, defaultValue) {
  return process.env[envVar] || defaultValue;
}

/**
 * Configure payload size limits for different content types
 *
 * @returns {Array} Array of middleware functions
 */
export function configurePayloadLimits() {
  const jsonLimit = getLimit('MAX_JSON_PAYLOAD_SIZE', DEFAULT_JSON_LIMIT);
  const textLimit = getLimit('MAX_TEXT_PAYLOAD_SIZE', DEFAULT_TEXT_LIMIT);
  const urlencodedLimit = getLimit('MAX_URLENCODED_PAYLOAD_SIZE', DEFAULT_URLENCODED_LIMIT);

  limitLogger.info({
    jsonLimit,
    textLimit,
    urlencodedLimit
  }, 'Payload size limits configured');

  return [
    express.json({
      limit: jsonLimit,
      verify: logPayloadSize
    }),
    express.text({
      limit: textLimit,
      verify: logPayloadSize
    }),
    express.urlencoded({
      extended: true,
      limit: urlencodedLimit,
      verify: logPayloadSize
    })
  ];
}

/**
 * Log payload size for monitoring and debugging
 */
function logPayloadSize(req, res, buf, encoding) {
  const sizeInBytes = buf.length;
  const sizeInKB = (sizeInBytes / 1024).toFixed(2);

  // Log large payloads for monitoring
  if (sizeInBytes > 100 * 1024) { // > 100KB
    limitLogger.info({
      path: req.path,
      method: req.method,
      sizeBytes: sizeInBytes,
      sizeKB: sizeInKB,
      contentType: req.headers['content-type']
    }, 'Large payload received');
  }

  // Attach size metadata to request
  req.payloadSize = {
    bytes: sizeInBytes,
    kb: parseFloat(sizeInKB),
    mb: parseFloat((sizeInBytes / 1024 / 1024).toFixed(2))
  };
}

/**
 * Custom payload size validator for specific routes
 *
 * @param {string} maxSize - Maximum size (e.g., '5mb', '500kb')
 */
export function validatePayloadSize(maxSize) {
  const maxBytes = parseSize(maxSize);

  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);

    if (contentLength > maxBytes) {
      limitLogger.warn({
        path: req.path,
        contentLength,
        maxBytes,
        ip: req.ip
      }, 'Payload too large');

      return res.status(413).json({
        error: 'Payload Too Large',
        message: `Request payload exceeds maximum size of ${maxSize}`,
        maxSize: maxSize,
        receivedSize: formatBytes(contentLength),
        code: 'PAYLOAD_TOO_LARGE'
      });
    }

    next();
  };
}

/**
 * Parse size string to bytes
 * Supports: '5mb', '500kb', '1gb', etc.
 */
function parseSize(sizeStr) {
  const units = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024
  };

  const match = sizeStr.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*([kmg]?b)$/);
  if (!match) {
    throw new Error(`Invalid size format: ${sizeStr}`);
  }

  const [, number, unit] = match;
  return parseFloat(number) * units[unit];
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Payload size monitoring middleware
 * Tracks and logs payload size distribution
 */
export function monitorPayloadSizes(req, res, next) {
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);

  if (contentLength > 0) {
    req.payloadMetrics = {
      size: contentLength,
      formatted: formatBytes(contentLength),
      timestamp: new Date().toISOString()
    };
  }

  next();
}
