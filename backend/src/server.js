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

// Import configuration and validation
import { validateEnvironment, getConfig } from './config/env.js';

// Import API routes
import geminiRoutes from './api/gemini/index.js';

// Load environment variables
dotenv.config();

// Validate environment configuration
console.log('🔍 Validating environment configuration...');
validateEnvironment();

// Get validated configuration
const config = getConfig();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = config.port;

// Middleware
app.use(cors({
  origin: config.corsOrigins,
  credentials: config.corsCredentials
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (if enabled)
if (config.requestLogging) {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    });
    next();
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'gemini-flow-backend',
    environment: config.nodeEnv
  });
});

// API routes
app.use('/api/gemini', geminiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // In production, don't expose stack traces unless debug mode is enabled
  const errorResponse = {
    error: 'Internal server error',
    message: err.message
  };
  
  if (config.debug || config.nodeEnv === 'development') {
    errorResponse.stack = err.stack;
  }
  
  res.status(500).json(errorResponse);
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    path: req.originalUrl 
  });
});

// Start server
app.listen(PORT, config.host, () => {
  console.log(`🚀 Gemini Flow Backend Server running on ${config.host}:${PORT}`);
  console.log(`📋 Health check: http://${config.host === '0.0.0.0' ? 'localhost' : config.host}:${PORT}/health`);
  console.log(`🔧 API Base URL: http://${config.host === '0.0.0.0' ? 'localhost' : config.host}:${PORT}/api`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`📊 CORS Origins: ${config.corsOrigins.join(', ')}`);
  
  if (config.debug) {
    console.log('🐛 Debug mode is enabled');
  }
  
  if (config.disableAuth) {
    console.warn('⚠️  WARNING: Authentication is disabled!');
  }
});