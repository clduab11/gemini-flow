/**
 * WebSocket Authentication Tests
 * 
 * Tests for WebSocket API key authentication
 */

import { WebSocket, WebSocketServer } from 'ws';
import { createServer } from 'http';
import websocketService from '../server.js';

const TEST_PORT = 3099;
const TEST_API_KEY = 'test-api-key-12345';

describe('WebSocket Authentication', () => {
  let server;
  let wss;

  beforeAll(async () => {
    // Set API key for tests
    process.env.API_KEY = TEST_API_KEY;
    
    // Create HTTP server
    server = createServer();
    
    // Initialize WebSocket service
    wss = websocketService.initialize(server);
    
    // Start server
    await new Promise((resolve) => {
      server.listen(TEST_PORT, resolve);
    });
  });

  afterAll(async () => {
    // Shutdown server
    await websocketService.shutdown();
    await new Promise((resolve) => {
      server.close(resolve);
    });
  });

  test('should reject connection without API key', (done) => {
    const ws = new WebSocket(`ws://localhost:${TEST_PORT}/ws`);

    ws.on('close', (code, reason) => {
      expect(code).toBe(1008); // Policy Violation
      expect(reason.toString()).toBe('Unauthorized');
      done();
    });

    ws.on('open', () => {
      done(new Error('Connection should have been rejected'));
    });

    ws.on('error', (err) => {
      // Expected - connection closed before open
      if (err.message.includes('WebSocket was closed')) {
        // This is fine
      } else {
        done(err);
      }
    });
  });

  test('should reject connection with invalid API key', (done) => {
    const ws = new WebSocket(`ws://localhost:${TEST_PORT}/ws?apiKey=wrong-key`);

    ws.on('close', (code, reason) => {
      expect(code).toBe(1008); // Policy Violation
      expect(reason.toString()).toBe('Unauthorized');
      done();
    });

    ws.on('open', () => {
      done(new Error('Connection should have been rejected'));
    });

    ws.on('error', (err) => {
      // Expected - connection closed before open
      if (err.message.includes('WebSocket was closed')) {
        // This is fine
      } else {
        done(err);
      }
    });
  });

  test('should accept connection with valid API key via query parameter', (done) => {
    const ws = new WebSocket(`ws://localhost:${TEST_PORT}/ws?apiKey=${TEST_API_KEY}`);

    ws.on('open', () => {
      ws.close();
      done();
    });

    ws.on('error', (err) => {
      done(err);
    });

    ws.on('close', (code) => {
      if (code !== 1000 && code !== 1005) {
        done(new Error(`Unexpected close code: ${code}`));
      }
    });
  });

  test('should accept connection with valid API key via header', (done) => {
    const ws = new WebSocket(`ws://localhost:${TEST_PORT}/ws`, {
      headers: {
        'x-api-key': TEST_API_KEY
      }
    });

    ws.on('open', () => {
      ws.close();
      done();
    });

    ws.on('error', (err) => {
      done(err);
    });

    ws.on('close', (code) => {
      if (code !== 1000 && code !== 1005) {
        done(new Error(`Unexpected close code: ${code}`));
      }
    });
  });

  test('should receive connection confirmation after successful auth', (done) => {
    const ws = new WebSocket(`ws://localhost:${TEST_PORT}/ws?apiKey=${TEST_API_KEY}`);

    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      expect(message.type).toBe('client.connected');
      expect(message.payload).toHaveProperty('clientId');
      expect(message.payload).toHaveProperty('timestamp');
      ws.close();
      done();
    });

    ws.on('error', (err) => {
      done(err);
    });
  });
});
