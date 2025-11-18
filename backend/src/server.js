/**
 * Backend API Server for Gemini Flow Visual Execution
 * 
 * This server provides API endpoints for executing visual flows
 * created in the React Flow frontend.
 * 
 * Features:
 * - Security: API key authentication, payload size limits
 * - Performance: Rate limiting, compression
 * - Observability: Prometheus metrics, structured logging
 * - Reliability: Graceful shutdown, automated backups
 */

import express from 'express';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
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
import { payloadSizeLimit } from './api/middleware/payloadSizeLimit.js';
import { 
  rateLimit, 
  initializeRateLimiter, 
  shutdownRateLimiter 
} from './api/middleware/persistentRateLimit.js';
import { 
  httpMetrics, 
  metricsHandler, 
  initializeMetrics 
} from './api/middleware/prometheusMetrics.js';
import { pagination } from './api/middleware/pagination.js';

// Import utilities
import { backupManager } from './utils/databaseBackup.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const startTime = Date.now();

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable for API
  crossOriginEmbedderPolicy: false
}));

// Compression
app.use(compression());

// CORS configuration
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: corsOrigins,
  credentials: true
}));

// Body parsers with size limits
app.use(express.json({ limit: process.env.MAX_JSON_SIZE || '10mb' }));
app.use(express.urlencoded({ 
  extended: true, 
  limit: process.env.MAX_URLENCODED_SIZE || '10mb' 
}));

// Request tracking middleware
app.use(requestId);
app.use(requestLogger);

// Prometheus metrics collection
app.use(httpMetrics);

// Payload size validation
app.use(payloadSizeLimit);

// API key authentication (applied to /api routes)
app.use('/api', apiKeyAuth);

// Rate limiting (applied to /api routes)
app.use('/api', rateLimit);

// Pagination middleware (applied to /api routes)
app.use('/api', pagination);

// Health check endpoint (enhanced)
app.get('/health', (req, res) => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'gemini-flow-backend',
    version: process.env.npm_package_version || '1.0.0',
    uptime: {
      seconds: uptime,
      formatted: formatUptime(uptime)
    },
    environment: process.env.NODE_ENV || 'development'
  });
});

// Metrics endpoint
app.get('/metrics', metricsHandler);

// API routes
app.use('/api/gemini', geminiRoutes);

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

/**
 * Format uptime in human-readable format
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);
  
  return parts.join(' ');
}

/**
 * Initialize services
 */
async function initializeServices() {
  try {
    // Initialize Prometheus metrics
    initializeMetrics();
    logger.info('Prometheus metrics initialized');
    
    // Initialize rate limiter
    await initializeRateLimiter();
    logger.info('Rate limiter initialized');
    
    // Initialize backup manager with scheduled backups
    const dbPaths = process.env.DB_PATHS 
      ? process.env.DB_PATHS.split(',').map(p => p.trim())
      : [];
    
    if (dbPaths.length > 0 && process.env.BACKUP_ENABLED !== 'false') {
      const backupInterval = parseInt(
        process.env.BACKUP_INTERVAL_MS || String(24 * 60 * 60 * 1000), 
        10
      );
      backupManager.startScheduledBackups(dbPaths, backupInterval);
      logger.info({ 
        dbPaths, 
        intervalHours: backupInterval / (60 * 60 * 1000) 
      }, 'Automated backups initialized');
    }
    
    logger.info('All services initialized successfully');
  } catch (error) {
    logger.error({ err: error }, 'Failed to initialize services');
    throw error;
  }
}

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(signal) {
  logger.info({ signal }, 'Shutdown signal received, starting graceful shutdown');
  
  try {
    // Stop accepting new requests
    server.close(() => {
      logger.info('HTTP server closed');
    });
    
    // Stop scheduled backups
    backupManager.stopScheduledBackups();
    
    // Shutdown rate limiter (saves state)
    await shutdownRateLimiter();
    
    logger.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, 'Error during graceful shutdown');
    process.exit(1);
  }
}

// Start server
const server = app.listen(PORT, async () => {
  logger.info({ 
    port: PORT, 
    env: process.env.NODE_ENV || 'development',
    healthCheck: `http://localhost:${PORT}/health`,
    metricsEndpoint: `http://localhost:${PORT}/metrics`,
    apiBase: `http://localhost:${PORT}/api`
  }, 'Server started');
  
  // Initialize all services
  try {
    await initializeServices();
  } catch (error) {
    logger.error({ err: error }, 'Failed to start services, shutting down');
    process.exit(1);
  }
});

// Graceful shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));