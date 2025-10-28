/**
 * Backend API Server for Gemini Flow Visual Execution
 * 
 * This server provides API endpoints for executing visual flows
 * created in the React Flow frontend.
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import API routes
import geminiRoutes from './api/gemini/index.js';
import adminRoutes from './api/routes/admin.js';

// Import backup system
import { startBackupScheduler, stopBackupScheduler } from './db/backupScheduler.js';
import { createBackup } from './db/backup.js';

// Import logger and middleware
import { logger } from './utils/logger.js';
import { requestId } from './api/middleware/requestId.js';
import { requestLogger } from './api/middleware/requestLogger.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'], // Vite dev server and other common ports
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request tracking middleware
app.use(requestId);
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'gemini-flow-backend'
  });
});

// API routes
app.use('/api/gemini', geminiRoutes);
app.use('/api/admin', adminRoutes);

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

// Start server
const server = app.listen(PORT, () => {
  logger.info({ 
    port: PORT, 
    env: process.env.NODE_ENV || 'development',
    healthCheck: `http://localhost:${PORT}/health`,
    apiBase: `http://localhost:${PORT}/api`
  }, 'Server started');
  
  // Start backup scheduler after server is running
  startBackupScheduler();
});

// Graceful shutdown handler
const shutdown = async (signal) => {
  logger.info({ signal }, 'Shutting down gracefully');
  
  // Create final backup before shutdown
  try {
    await createBackup();
    logger.info('Final backup completed');
  } catch (err) {
    logger.error({ err }, 'Shutdown backup failed');
  }
  
  // Stop backup scheduler
  stopBackupScheduler();
  
  // Close server
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
  
  // Force close after timeout
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Register shutdown handlers
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
