/**
 * Simple logger utility for backend operations
 * Uses console with structured output for compatibility
 */

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL] || LOG_LEVELS.info;

function formatMessage(level, data, message) {
  const timestamp = new Date().toISOString();
  const logData = typeof data === 'object' ? JSON.stringify(data) : data;
  return `[${timestamp}] ${level.toUpperCase()}: ${message}${logData ? ' ' + logData : ''}`;
}

export const logger = {
  error(data, message) {
    if (currentLevel >= LOG_LEVELS.error) {
      console.error(formatMessage('error', data, message || ''));
    }
  },
  
  warn(data, message) {
    if (currentLevel >= LOG_LEVELS.warn) {
      console.warn(formatMessage('warn', data, message || ''));
    }
  },
  
  info(data, message) {
    if (currentLevel >= LOG_LEVELS.info) {
      console.log(formatMessage('info', data, message || ''));
    }
  },
  
  debug(data, message) {
    if (currentLevel >= LOG_LEVELS.debug) {
      console.log(formatMessage('debug', data, message || ''));
    }
  }
};
