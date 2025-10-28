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
import workflowRoutes from './api/routes/workflows.js';
import storeRoutes from './api/routes/store.js';

// Import configuration
import { LIMITS, validateLimitsConfig } from './config/limits.js';

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

// JSON and URL-encoded payload size limits (1MB)
app.use(express.json({ 
  limit: LIMITS.MAX_REQUEST_SIZE,
  strict: true // Only parse arrays and objects
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: LIMITS.MAX_REQUEST_SIZE 
}));

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
app.use('/api/workflows', workflowRoutes);
app.use('/api/store', storeRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
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
app.listen(PORT, () => {
  // Validate limits configuration
  const warnings = validateLimitsConfig();
  if (warnings.length > 0) {
    console.warn('⚠️  Configuration warnings:');
    warnings.forEach(warning => console.warn(`   - ${warning}`));
  }
  
  console.log(`🚀 Gemini Flow Backend Server running on port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🔒 Security: Payload size limit ${LIMITS.MAX_REQUEST_SIZE}, max nodes ${LIMITS.MAX_NODES}, max edges ${LIMITS.MAX_EDGES}`);
});