/**
 * Environment Variable Validation and Loading
 * 
 * This module validates environment variables on server startup
 * and provides helpful error messages for configuration issues.
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Environment variable configuration
 */
const envConfig = {
  // Required in production
  production: {
    required: ['API_KEY', 'GEMINI_API_KEY'],
    optional: ['PORT', 'HOST', 'NODE_ENV']
  },
  // All environments
  all: {
    PORT: { type: 'number', min: 1, max: 65535, default: 3001 },
    HOST: { type: 'string', default: '0.0.0.0' },
    NODE_ENV: { type: 'string', enum: ['development', 'production', 'test'], default: 'development' },
    LOG_LEVEL: { type: 'string', enum: ['debug', 'info', 'warn', 'error'], default: 'info' },
    LOG_PRETTY: { type: 'boolean', default: true },
    LOG_FORMAT: { type: 'string', enum: ['json', 'pretty'], default: 'pretty' },
    CORS_CREDENTIALS: { type: 'boolean', default: true },
    RATE_LIMIT_WINDOW_MS: { type: 'number', min: 1000, default: 60000 },
    RATE_LIMIT_MAX_REQUESTS: { type: 'number', min: 1, default: 100 },
    MAX_NODES: { type: 'number', min: 1, default: 1000 },
    MAX_EDGES: { type: 'number', min: 1, default: 5000 },
    MAX_NAME_LENGTH: { type: 'number', min: 1, default: 200 },
    MAX_DESCRIPTION_LENGTH: { type: 'number', min: 1, default: 5000 },
    BACKUP_INTERVAL_HOURS: { type: 'number', min: 0, default: 24 },
    MAX_BACKUPS: { type: 'number', min: 0, default: 30 },
    HEALTH_CHECK_ENABLED: { type: 'boolean', default: true },
    REQUEST_LOGGING: { type: 'boolean', default: true },
    DEBUG: { type: 'boolean', default: false },
    DISABLE_AUTH: { type: 'boolean', default: false }
  }
};

/**
 * Validate required environment variables in production
 */
export function validateRequiredVars() {
  const isProduction = process.env.NODE_ENV === 'production';
  const errors = [];
  const warnings = [];

  if (isProduction) {
    // Check required variables
    for (const varName of envConfig.production.required) {
      if (!process.env[varName]) {
        errors.push({
          variable: varName,
          message: `Missing required environment variable: ${varName}`,
          suggestion: varName === 'API_KEY' 
            ? 'Generate with: openssl rand -hex 32' 
            : 'Set this variable in your .env file'
        });
      }
    }

    // Check API_KEY length
    if (process.env.API_KEY && process.env.API_KEY.length < 32) {
      warnings.push({
        variable: 'API_KEY',
        message: `API_KEY should be at least 32 characters for security (current: ${process.env.API_KEY.length})`,
        suggestion: 'Generate a stronger key with: openssl rand -hex 32'
      });
    }

    // Warn about dangerous development settings in production
    if (process.env.DEBUG === 'true') {
      warnings.push({
        variable: 'DEBUG',
        message: 'DEBUG mode is enabled in production',
        suggestion: 'Set DEBUG=false to prevent verbose error messages from exposing sensitive information'
      });
    }

    if (process.env.DISABLE_AUTH === 'true') {
      errors.push({
        variable: 'DISABLE_AUTH',
        message: 'Authentication is disabled in production (SECURITY RISK)',
        suggestion: 'Set DISABLE_AUTH=false or remove this variable'
      });
    }
  }

  return { errors, warnings, isProduction };
}

/**
 * Validate and parse environment variable values
 */
export function validateEnvironment() {
  const result = validateRequiredVars();
  const { errors, warnings, isProduction } = result;

  // Validate individual variable types and constraints
  for (const [varName, config] of Object.entries(envConfig.all)) {
    const value = process.env[varName];

    if (!value) continue; // Skip if not set (will use defaults)

    // Type validation
    if (config.type === 'number') {
      const num = Number(value);
      if (isNaN(num)) {
        errors.push({
          variable: varName,
          message: `${varName} must be a number (got: "${value}")`,
          suggestion: `Set ${varName} to a numeric value`
        });
        continue;
      }

      // Range validation
      if (config.min !== undefined && num < config.min) {
        errors.push({
          variable: varName,
          message: `${varName} must be at least ${config.min} (got: ${num})`,
          suggestion: `Set ${varName} to a value >= ${config.min}`
        });
      }

      if (config.max !== undefined && num > config.max) {
        errors.push({
          variable: varName,
          message: `${varName} must be at most ${config.max} (got: ${num})`,
          suggestion: `Set ${varName} to a value <= ${config.max}`
        });
      }
    }

    // Enum validation
    if (config.enum && !config.enum.includes(value)) {
      errors.push({
        variable: varName,
        message: `${varName} must be one of: ${config.enum.join(', ')} (got: "${value}")`,
        suggestion: `Set ${varName} to a valid value`
      });
    }

    // Boolean validation
    if (config.type === 'boolean' && !['true', 'false'].includes(value.toLowerCase())) {
      warnings.push({
        variable: varName,
        message: `${varName} should be "true" or "false" (got: "${value}")`,
        suggestion: 'Boolean values should be lowercase "true" or "false"'
      });
    }
  }

  // Report errors
  if (errors.length > 0) {
    console.error('\n❌ Environment Configuration Errors:\n');
    errors.forEach(({ variable, message, suggestion }) => {
      console.error(`  ${variable}:`);
      console.error(`    ❌ ${message}`);
      console.error(`    💡 ${suggestion}\n`);
    });

    console.error(`\n❌ Environment validation failed with ${errors.length} error(s).`);
    console.error('Fix the issues above before starting the server.\n');
    
    // Exit process on validation errors
    process.exit(1);
  }

  // Report warnings
  if (warnings.length > 0) {
    console.warn('\n⚠️  Environment Configuration Warnings:\n');
    warnings.forEach(({ variable, message, suggestion }) => {
      console.warn(`  ${variable}:`);
      console.warn(`    ⚠️  ${message}`);
      console.warn(`    💡 ${suggestion}\n`);
    });
  }

  // Success message
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ Environment configuration validated successfully');
  } else if (errors.length === 0) {
    console.log(`✅ Environment configuration validated with ${warnings.length} warning(s)`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Get environment variable with type conversion and default value
 */
export function getEnv(varName, defaultValue = undefined) {
  const config = envConfig.all[varName];
  const value = process.env[varName];

  if (value === undefined) {
    return config?.default !== undefined ? config.default : defaultValue;
  }

  // Type conversion
  if (config?.type === 'number') {
    return Number(value);
  }

  if (config?.type === 'boolean') {
    return value.toLowerCase() === 'true';
  }

  return value;
}

/**
 * Get all environment configuration
 */
export function getConfig() {
  return {
    // Server
    nodeEnv: getEnv('NODE_ENV'),
    port: getEnv('PORT'),
    host: getEnv('HOST'),

    // API Keys
    geminiApiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY,
    apiKey: process.env.API_KEY,

    // CORS
    corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(','),
    corsCredentials: getEnv('CORS_CREDENTIALS'),

    // Logging
    logLevel: getEnv('LOG_LEVEL'),
    logPretty: getEnv('LOG_PRETTY'),
    logFormat: getEnv('LOG_FORMAT'),
    requestLogging: getEnv('REQUEST_LOGGING'),

    // Rate Limiting
    rateLimitWindowMs: getEnv('RATE_LIMIT_WINDOW_MS'),
    rateLimitMaxRequests: getEnv('RATE_LIMIT_MAX_REQUESTS'),
    rateLimitStore: process.env.RATE_LIMIT_STORE || 'memory',

    // Database
    dataDir: process.env.DATA_DIR || '.data',
    backupIntervalHours: getEnv('BACKUP_INTERVAL_HOURS'),
    maxBackups: getEnv('MAX_BACKUPS'),

    // Workflow Limits
    maxNodes: getEnv('MAX_NODES'),
    maxEdges: getEnv('MAX_EDGES'),
    maxNameLength: getEnv('MAX_NAME_LENGTH'),
    maxDescriptionLength: getEnv('MAX_DESCRIPTION_LENGTH'),

    // Redis (optional)
    redis: process.env.REDIS_HOST ? {
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT || 6379),
      password: process.env.REDIS_PASSWORD,
      db: Number(process.env.REDIS_DB || 0),
      connectTimeout: Number(process.env.REDIS_CONNECT_TIMEOUT || 10000)
    } : null,

    // Monitoring
    metricsEnabled: getEnv('METRICS_ENABLED', false),
    metricsPort: Number(process.env.METRICS_PORT || 9090),
    healthCheckEnabled: getEnv('HEALTH_CHECK_ENABLED'),

    // Security
    forceHttps: getEnv('FORCE_HTTPS', false),
    securityHeaders: getEnv('SECURITY_HEADERS', false),
    cspDirectives: process.env.CSP_DIRECTIVES,

    // Development
    debug: getEnv('DEBUG'),
    disableAuth: getEnv('DISABLE_AUTH')
  };
}

export default {
  validateEnvironment,
  validateRequiredVars,
  getEnv,
  getConfig
};
