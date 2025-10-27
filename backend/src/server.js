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

// Import rate limiting middleware
import { 
  rateLimit, 
  initRateLimitStore, 
  startRateLimitPersistence 
} from './api/middleware/rateLimit.js';

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

// Rate limiting middleware - applies to all routes
app.use(rateLimit);

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

// Initialize rate limiting persistence
async function initializeRateLimiting() {
  if (process.env.REDIS_HOST) {
    console.log('🔴 Initializing Redis-based rate limiting...');
    await initRateLimitStore();
  } else {
    console.log('📁 Initializing file-based rate limiting...');
    await startRateLimitPersistence();
  }
}

// Start server
async function startServer() {
  try {
    // Initialize rate limiting
    await initializeRateLimiting();
    
    // Start listening
    app.listen(PORT, () => {
      console.log(`🚀 Gemini Flow Backend Server running on port ${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/health`);
      console.log(`🔧 API Base URL: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();