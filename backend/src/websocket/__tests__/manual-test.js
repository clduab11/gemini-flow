#!/usr/bin/env node
/**
 * Manual WebSocket Authentication Test
 * 
 * Simple standalone test script to verify WebSocket authentication
 * Run with: node backend/src/websocket/__tests__/manual-test.js
 */

import { WebSocket } from 'ws';

const TEST_PORT = process.env.PORT || 3001;
const TEST_API_KEY = process.env.API_KEY || 'dev-api-key-change-in-production';

console.log('🧪 Testing WebSocket Authentication\n');
console.log(`Server: ws://localhost:${TEST_PORT}/ws`);
console.log(`API Key: ${TEST_API_KEY}\n`);

let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  console.log(`Testing: ${name}...`);
  return fn()
    .then(() => {
      console.log(`✅ PASS: ${name}\n`);
      testsPassed++;
    })
    .catch((err) => {
      console.error(`❌ FAIL: ${name}`);
      console.error(`   Error: ${err.message}\n`);
      testsFailed++;
    });
}

// Test 1: No API key - should reject
async function testNoApiKey() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:${TEST_PORT}/ws`);
    let opened = false;
    
    const timeout = setTimeout(() => {
      ws.terminate();
      reject(new Error('Connection should have been rejected but stayed open'));
    }, 2000);

    ws.on('close', (code, reason) => {
      clearTimeout(timeout);
      // WebSocket connection event fires after HTTP upgrade, so the connection
      // might briefly "open" before being immediately closed by the server
      if (code === 1008 && reason.toString() === 'Unauthorized') {
        resolve();
      } else {
        reject(new Error(`Expected code 1008 and reason 'Unauthorized', got code ${code} and reason '${reason}'`));
      }
    });

    ws.on('open', () => {
      opened = true;
      // Don't reject here - server will close immediately
    });

    ws.on('error', () => {
      // Ignore errors - expected for rejected connections
    });
  });
}

// Test 2: Invalid API key - should reject
async function testInvalidApiKey() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:${TEST_PORT}/ws?apiKey=wrong-key`);
    let opened = false;
    
    const timeout = setTimeout(() => {
      ws.terminate();
      reject(new Error('Connection should have been rejected but stayed open'));
    }, 2000);

    ws.on('close', (code, reason) => {
      clearTimeout(timeout);
      // WebSocket connection event fires after HTTP upgrade, so the connection
      // might briefly "open" before being immediately closed by the server
      if (code === 1008 && reason.toString() === 'Unauthorized') {
        resolve();
      } else {
        reject(new Error(`Expected code 1008 and reason 'Unauthorized', got code ${code} and reason '${reason}'`));
      }
    });

    ws.on('open', () => {
      opened = true;
      // Don't reject here - server will close immediately
    });

    ws.on('error', () => {
      // Ignore errors - expected for rejected connections
    });
  });
}

// Test 3: Valid API key via query parameter - should accept
async function testValidApiKeyQuery() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:${TEST_PORT}/ws?apiKey=${TEST_API_KEY}`);
    
    const timeout = setTimeout(() => {
      ws.terminate();
      reject(new Error('Connection timeout'));
    }, 2000);

    ws.on('open', () => {
      clearTimeout(timeout);
      ws.close();
      resolve();
    });

    ws.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    ws.on('close', (code) => {
      clearTimeout(timeout);
      if (code !== 1000 && code !== 1005) {
        reject(new Error(`Unexpected close code: ${code}`));
      }
    });
  });
}

// Test 4: Valid API key via header - should accept
async function testValidApiKeyHeader() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:${TEST_PORT}/ws`, {
      headers: {
        'x-api-key': TEST_API_KEY
      }
    });
    
    const timeout = setTimeout(() => {
      ws.terminate();
      reject(new Error('Connection timeout'));
    }, 2000);

    ws.on('open', () => {
      clearTimeout(timeout);
      ws.close();
      resolve();
    });

    ws.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    ws.on('close', (code) => {
      clearTimeout(timeout);
      if (code !== 1000 && code !== 1005) {
        reject(new Error(`Unexpected close code: ${code}`));
      }
    });
  });
}

// Test 5: Receive connection confirmation
async function testConnectionConfirmation() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:${TEST_PORT}/ws?apiKey=${TEST_API_KEY}`);
    
    const timeout = setTimeout(() => {
      ws.terminate();
      reject(new Error('Did not receive connection confirmation'));
    }, 2000);

    ws.on('message', (data) => {
      clearTimeout(timeout);
      try {
        const message = JSON.parse(data.toString());
        if (message.type === 'client.connected' && message.payload.clientId) {
          ws.close();
          resolve();
        } else {
          ws.terminate();
          reject(new Error(`Unexpected message: ${JSON.stringify(message)}`));
        }
      } catch (err) {
        ws.terminate();
        reject(err);
      }
    });

    ws.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

// Run all tests
async function runTests() {
  console.log('⚠️  Make sure the backend server is running on port', TEST_PORT);
  console.log('   Run: npm start (in backend directory)\n');
  
  await test('Connection without API key should be rejected', testNoApiKey);
  await test('Connection with invalid API key should be rejected', testInvalidApiKey);
  await test('Connection with valid API key (query param) should be accepted', testValidApiKeyQuery);
  await test('Connection with valid API key (header) should be accepted', testValidApiKeyHeader);
  await test('Should receive connection confirmation after auth', testConnectionConfirmation);

  console.log('═'.repeat(50));
  console.log(`Tests Passed: ${testsPassed}`);
  console.log(`Tests Failed: ${testsFailed}`);
  console.log('═'.repeat(50));

  process.exit(testsFailed > 0 ? 1 : 0);
}

runTests();
