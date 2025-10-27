/**
 * Pino Structured Logger Configuration
 * 
 * Provides production-ready structured logging with:
 * - Log levels (debug, info, warn, error)
 * - Pretty printing in development
 * - JSON output in production
 * - Error serialization
 * - Module-specific child loggers
 */

import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';
const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

/**
 * Main Pino logger instance
 */
export const logger = pino({
  level: logLevel,
  
  // Pretty print in development for human readability
  transport: !isProduction ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname'
    }
  } : undefined,
  
  // Production settings - structured JSON output
  formatters: {
    level: (label) => {
      return { level: label };
    }
  },
  
  // Base fields included in every log
  base: {
    env: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  },
  
  // Serialize errors, requests, and responses properly
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res
  }
});

/**
 * Create a child logger for a specific module
 * 
 * @param {string} module - The module name (e.g., 'server', 'websocket', 'database')
 * @returns {pino.Logger} Child logger with module context
 * 
 * @example
 * const logger = createModuleLogger('gemini-api');
 * logger.info({ requestId: '123' }, 'Processing request');
 */
export function createModuleLogger(module) {
  return logger.child({ module });
}

/**
 * Log levels:
 * - trace: Very detailed debugging information
 * - debug: Debugging information
 * - info: General informational messages
 * - warn: Warning messages
 * - error: Error messages
 * - fatal: Fatal error messages (application crash)
 * 
 * Usage examples:
 * 
 * // Simple message
 * logger.info('Server started');
 * 
 * // With structured data
 * logger.info({ port: 3001, env: 'production' }, 'Server started');
 * 
 * // Error logging
 * logger.error({ err: error, userId: '123' }, 'Request failed');
 * 
 * // Module-specific logging
 * const apiLogger = createModuleLogger('api');
 * apiLogger.debug({ requestId: 'abc' }, 'Processing request');
 */
