/**
 * Global Test Setup
 * Configures test environment and utilities
 */

const { HiveMemory } = require('../utils/hive-memory');
const { TestServer } = require('../utils/test-server');

// Global test configuration
global.TEST_CONFIG = {
  timeout: {
    short: 5000,
    medium: 30000,
    long: 120000,
    performance: 300000
  },
  performance: {
    maxResponseTime: 100,
    maxMemoryUsage: 100 * 1024 * 1024, // 100MB
    maxCpuUsage: 80
  },
  security: {
    maxPasswordAttempts: 5,
    sessionTimeout: 3600000,
    tokenExpiry: 7200000
  }
};

// Initialize shared services
let hiveMemory;
let testServer;

beforeAll(async () => {
  console.log('🚀 Initializing global test environment...');
  
  // Initialize hive memory for coordination
  hiveMemory = new HiveMemory();
  await hiveMemory.initialize();
  
  // Clear any existing test data
  await hiveMemory.clear('test');
  
  // Initialize test server
  testServer = new TestServer({ port: 3001 });
  
  // Setup common test routes
  setupTestRoutes(testServer);
  
  await testServer.start();
  
  // Store global instances
  global.hiveMemory = hiveMemory;
  global.testServer = testServer;
  
  console.log('✅ Global test environment initialized');
});

afterAll(async () => {
  console.log('🧹 Cleaning up global test environment...');
  
  // Stop test server
  if (testServer) {
    await testServer.stop();
  }
  
  // Clear test data
  if (hiveMemory) {
    await hiveMemory.clear('test');
    await hiveMemory.cleanup();
  }
  
  console.log('✅ Global test environment cleaned up');
});

// Setup mock endpoints for testing
function setupTestRoutes(server) {
  // Health check endpoint
  server.addRoute('GET', '/health', (req, res) => {
    server.sendResponse(res, 200, { status: 'healthy', timestamp: new Date().toISOString() });
  });
  
  // Mock authentication endpoint
  server.addRoute('POST', '/auth/login', (req, res) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const credentials = JSON.parse(body);
        
        if (credentials.username === 'test' && credentials.password === 'test123') {
          server.sendResponse(res, 200, {
            token: 'mock-jwt-token',
            expires: Date.now() + 3600000,
            user: { id: '1', username: 'test' }
          });
        } else {
          server.sendResponse(res, 401, { error: 'Invalid credentials' });
        }
      } catch (error) {
        server.sendResponse(res, 400, { error: 'Invalid JSON' });
      }
    });
  });
  
  // Mock API key validation
  server.addRoute('POST', '/auth/validate-key', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      if (token === 'valid-api-key') {
        server.sendResponse(res, 200, { valid: true, scopes: ['read', 'write'] });
      } else {
        server.sendResponse(res, 401, { valid: false, error: 'Invalid API key' });
      }
    } else {
      server.sendResponse(res, 400, { error: 'Missing authorization header' });
    }
  });
  
  // Mock model prediction endpoint
  server.addRoute('POST', '/models/predict', (req, res) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const request = JSON.parse(body);
        
        // Simulate processing time based on model
        const processingTime = request.model === 'gemini-pro' ? 50 : 100;
        
        setTimeout(() => {
          server.sendResponse(res, 200, {
            prediction: `Mock response for: ${request.prompt}`,
            model: request.model,
            processingTime,
            confidence: 0.95
          });
        }, processingTime);
      } catch (error) {
        server.sendResponse(res, 400, { error: 'Invalid request' });
      }
    });
  });
  
  // Mock Jules integration endpoint
  server.addRoute('POST', '/jules/sync', (req, res) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const syncRequest = JSON.parse(body);
        
        server.sendResponse(res, 200, {
          syncId: `sync-${Date.now()}`,
          status: 'completed',
          itemsSynced: syncRequest.items?.length || 0,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        server.sendResponse(res, 400, { error: 'Invalid sync request' });
      }
    });
  });
  
  // Mock error endpoint for testing error handling
  server.addRoute('GET', '/error/:type', (req, res) => {
    const errorType = req.url.split('/')[2];
    
    switch (errorType) {
      case 'timeout':
        // Don't respond to simulate timeout
        break;
      case 'server-error':
        server.sendResponse(res, 500, { error: 'Internal server error' });
        break;
      case 'rate-limit':
        server.sendResponse(res, 429, { error: 'Rate limit exceeded' });
        break;
      case 'not-found':
        server.sendResponse(res, 404, { error: 'Resource not found' });
        break;
      default:
        server.sendResponse(res, 400, { error: 'Unknown error type' });
    }
  });
  
  // Mock performance test endpoint
  server.addRoute('GET', '/performance/load/:duration', (req, res) => {
    const duration = parseInt(req.url.split('/')[3]) || 100;
    const startTime = Date.now();
    
    // Simulate CPU load
    const endTime = startTime + duration;
    while (Date.now() < endTime) {
      Math.random() * Math.sin(Date.now());
    }
    
    const actualDuration = Date.now() - startTime;
    server.sendResponse(res, 200, {
      requestedDuration: duration,
      actualDuration,
      serverTime: new Date().toISOString()
    });
  });
}

// Global test utilities
global.testUtils = {
  async waitFor(condition, timeout = 5000, interval = 100) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error(`Condition not met within ${timeout}ms`);
  },
  
  async measureTime(operation) {
    const startTime = performance.now();
    const result = await operation();
    const endTime = performance.now();
    
    return {
      result,
      duration: endTime - startTime
    };
  },
  
  generateTestData(count, generator) {
    return Array.from({ length: count }, (_, i) => generator(i));
  },
  
  async retry(operation, maxAttempts = 3, delay = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  },
  
  createMockResponse(data, status = 200) {
    return {
      status,
      data,
      headers: { 'content-type': 'application/json' },
      timestamp: new Date().toISOString()
    };
  }
};

// Custom Jest matchers
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false
      };
    }
  },
  
  toHaveResponseTimeUnder(received, maxTime) {
    const pass = received < maxTime;
    
    if (pass) {
      return {
        message: () => `expected ${received}ms not to be under ${maxTime}ms`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received}ms to be under ${maxTime}ms`,
        pass: false
      };
    }
  },
  
  toMeetPerformanceThreshold(received, threshold) {
    const meetsThreshold = received.averageTime < threshold.maxTime && 
                          received.errorRate < threshold.maxErrorRate;
    
    if (meetsThreshold) {
      return {
        message: () => `expected performance not to meet threshold`,
        pass: true
      };
    } else {
      return {
        message: () => `expected performance to meet threshold: avg time ${received.averageTime}ms < ${threshold.maxTime}ms, error rate ${received.errorRate} < ${threshold.maxErrorRate}`,
        pass: false
      };
    }
  }
});

console.log('📋 Global test setup configured');