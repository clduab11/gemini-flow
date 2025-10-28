/**
 * Backend API Server for Gemini Flow
 *
 * Sprint 7: Complete backend with REST API and WebSocket support.
 * Provides workflow CRUD, store sync, and real-time updates.
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Sprint 7: Import new API routes
import workflowRoutes from './api/routes/workflows.js';
import storeRoutes from './api/routes/store.js';

// Sprint 7: Import database and WebSocket
import { initializeDatabase, getDatabaseHealth } from './db/database.js';
import websocketService from './websocket/server.js';

// Sprint 7: Import middleware
import { errorHandler, notFoundHandler } from './api/middleware/errorHandler.js';

// Legacy routes
import geminiRoutes from './api/gemini/index.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Create HTTP server for WebSocket
const server = createServer(app);

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  const dbHealth = await getDatabaseHealth();
  const wsHealth = websocketService.getHealth();

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'gemini-flow-backend',
    version: '1.0.0',
    components: {
      database: dbHealth,
      websocket: wsHealth
    }
  });
});

// Sprint 7: New API routes
app.use('/api/workflows', workflowRoutes);
app.use('/api/store', storeRoutes);

// Legacy routes
app.use('/api/gemini', geminiRoutes);

// Sprint 7: Error handling
app.use(errorHandler);
app.use('*', notFoundHandler);

// Initialize and start server
async function startServer() {
  try {
    console.log('🚀 Starting Gemini Flow Backend Server...\n');

    // Initialize database
    await initializeDatabase();
    console.log('');

    // Initialize WebSocket
    websocketService.initialize(server);
    console.log('');

    // Start HTTP server
    server.listen(PORT, () => {
      console.log('✅ Server started successfully!\n');
      console.log(`📡 HTTP Server: http://localhost:${PORT}`);
      console.log(`🔌 WebSocket: ws://localhost:${PORT}/ws`);
      console.log(`📋 Health Check: http://localhost:${PORT}/health`);
      console.log(`🔧 API Base URL: http://localhost:${PORT}/api\n`);
      console.log('Sprint 7 Endpoints:');
      console.log('  - GET    /api/workflows');
      console.log('  - POST   /api/workflows');
      console.log('  - GET    /api/workflows/:id');
      console.log('  - PUT    /api/workflows/:id');
      console.log('  - DELETE /api/workflows/:id');
      console.log('  - POST   /api/workflows/import');
      console.log('  - GET    /api/workflows/:id/export');
      console.log('  - GET    /api/store/state');
      console.log('  - PUT    /api/store/state');
      console.log('  - PUT    /api/store/nodes');
      console.log('  - PUT    /api/store/edges');
      console.log('  - POST   /api/store/sync');
      console.log('  - POST   /api/store/clear\n');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM received, shutting down gracefully...');
  await websocketService.shutdown();
  server.close(() => {
    console.log('✅ Server shut down complete');
    process.exit(0);
  });
});

// Start the server
startServer();
