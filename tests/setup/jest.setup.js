// Jest Setup for ESM Module System
// This file sets up the test environment to work with ES modules

import { jest } from '@jest/globals';

// Global test configuration
global.jest = jest;

// Mock common Node.js modules for ESM compatibility
jest.unstable_mockModule('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    access: jest.fn(),
    mkdir: jest.fn()
  },
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn()
}));

// Mock Google Auth for tests
jest.unstable_mockModule('google-auth-library', () => ({
  GoogleAuth: jest.fn().mockImplementation(() => ({
    getClient: jest.fn().mockResolvedValue({
      getAccessToken: jest.fn().mockResolvedValue('mock-access-token')
    })
  }))
}));

// Mock Winston Logger
jest.unstable_mockModule('winston', () => ({
  createLogger: jest.fn().mockReturnValue({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }),
  format: {
    combine: jest.fn(),
    timestamp: jest.fn(),
    printf: jest.fn(),
    colorize: jest.fn()
  },
  transports: {
    Console: jest.fn(),
    File: jest.fn()
  }
}));

// Set up global fetch mock for ESM
global.fetch = jest.fn();

// Console override to reduce noise in tests
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn() // Suppress error logs during tests
};

// Test environment variables
process.env.NODE_ENV = 'test';
process.env.TEST_PROJECT_ID = 'gemini-flow-test';
process.env.GOOGLE_CLIENT_ID = 'test-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});