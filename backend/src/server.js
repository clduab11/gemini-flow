/**
 * Backend API Server for Gemini Flow Visual Execution
 * 
 * This server provides API endpoints for executing visual flows
 * created in the React Flow frontend.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import API routes
import geminiRoutes from './api/gemini/index.js';

// Import logger and middleware
import { logger } from './utils/logger.js';
import { requestId } from './api/middleware/requestId.js';
import { requestLogger } from './api/middleware/requestLogger.js';
import { apiKeyAuth } from './api/middleware/apiKeyAuth.js';
import { configurePayloadLimits, monitorPayloadSizes } from './api/middleware/payloadSizeLimit.js';
import { createRateLimiters, rateLimitMiddleware } from './api/middleware/persistentRateLimit.js';
import { metricsMiddleware, metricsEndpoint } from './api/middleware/prometheusMetrics.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production',
  crossOriginEmbedderPolicy: false
}));

// Compression middleware
app.use(compression());

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true,
  maxAge: 86400 // 24 hours
}));

// Payload size limits (replaces express.json and express.urlencoded)
app.use(...configurePayloadLimits());
app.use(monitorPayloadSizes);

// Request tracking middleware
app.use(requestId);
app.use(requestLogger);
app.use(metricsMiddleware);

// Initialize rate limiters
let rateLimiters;
createRateLimiters().then(limiters => {
  rateLimiters = limiters;
  logger.info('Rate limiters initialized');
}).catch(error => {
  logger.error({ err: error }, 'Failed to initialize rate limiters');
});

// Public endpoints (no authentication required)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'gemini-flow-backend',
    version: process.env.npm_package_version || '1.0.0',
    uptime: process.uptime()
  });
});

// Metrics endpoint for Prometheus
app.get('/metrics', metricsEndpoint);

// API routes with authentication and rate limiting
app.use('/api/gemini',
  // Apply API key authentication (optional in development)
  process.env.NODE_ENV === 'production' ? apiKeyAuth : (req, res, next) => next(),
  // Apply rate limiting
  (req, res, next) => {
    if (rateLimiters?.api) {
      return rateLimitMiddleware(rateLimiters.api)(req, res, next);
    }
    next();
  },
  geminiRoutes
);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error({
    err,
    path: req.path,
    method: req.method,
    requestId: req.id
  }, 'Request error');
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    path: req.originalUrl 
  });
});

// Initialize database backup system
import { createBackupManager } from './utils/databaseBackup.js';

if (process.env.ENABLE_BACKUPS !== 'false') {
  createBackupManager({
    backupDir: process.env.BACKUP_DIR || './backups',
    databasePaths: [
      './data/gemini-flow.db',
      './data/rate-limits.json'
    ]
  }).then(backupManager => {
    logger.info('Database backup system initialized');
  }).catch(error => {
    logger.error({ err: error }, 'Failed to initialize backup system');
  });
}

// Start server
const server = app.listen(PORT, () => {
  logger.info({
    port: PORT,
    env: process.env.NODE_ENV || 'development',
    healthCheck: `http://localhost:${PORT}/health`,
    metricsEndpoint: `http://localhost:${PORT}/metrics`,
    apiBase: `http://localhost:${PORT}/api`,
    security: {
      apiKeyAuth: process.env.NODE_ENV === 'production',
      rateLimiting: true,
      payloadSizeLimit: true,
      helmet: true
    }
  }, 'Server started');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});