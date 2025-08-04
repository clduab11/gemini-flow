/**
 * A2A Test Setup
 * Global setup and configuration for A2A compliance testing
 */

import { jest } from '@jest/globals';

// Global test configuration
declare global {
  var A2A_TEST_CONFIG: {
    performanceTarget: number;
    securityLevel: string;
    coverageThreshold: number;
    mockNetworkDelay: number;
    enableChaostesting: boolean;
    logLevel: string;
    timeouts: {
      default: number;
      protocol: number;
      integration: number;
      performance: number;
      chaos: number;
      security: number;
    };
  };
}

// Initialize global A2A test configuration
global.A2A_TEST_CONFIG = {
  performanceTarget: parseInt(process.env.A2A_PERFORMANCE_TARGET || '1000'),
  securityLevel: process.env.A2A_SECURITY_LEVEL || 'strict',
  coverageThreshold: 100,
  mockNetworkDelay: parseInt(process.env.A2A_MOCK_NETWORK_DELAY || '10'),
  enableChaosesting: process.env.A2A_ENABLE_CHAOS_TESTING === 'true',
  logLevel: process.env.A2A_LOG_LEVEL || 'error',
  timeouts: {
    default: 300000,  // 5 minutes
    protocol: 600000, // 10 minutes
    integration: 900000, // 15 minutes
    performance: 1800000, // 30 minutes
    chaos: 1500000, // 25 minutes
    security: 1800000 // 30 minutes
  }
};

// Configure Jest environment for A2A testing
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.A2A_TEST_MODE = 'true';
  
  // Configure logging for tests
  if (global.A2A_TEST_CONFIG.logLevel === 'silent') {
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'info').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  }
  
  // Initialize test database/storage if needed
  // This would set up any persistent storage for tests
  
  console.log('🔧 A2A Test Environment Initialized');
  console.log(`   Performance Target: ${global.A2A_TEST_CONFIG.performanceTarget} msg/sec`);
  console.log(`   Security Level: ${global.A2A_TEST_CONFIG.securityLevel}`);
  console.log(`   Coverage Threshold: ${global.A2A_TEST_CONFIG.coverageThreshold}%`);
});

// Cleanup after all tests
afterAll(async () => {
  // Restore console methods if mocked
  jest.restoreAllMocks();
  
  // Clean up any test resources
  // This would clean up test databases, files, etc.
  
  console.log('🧹 A2A Test Environment Cleaned Up');
});

// Setup for each test
beforeEach(() => {
  // Reset any global state
  jest.clearAllMocks();
  
  // Set standard test timeout based on test type
  const testName = expect.getState().currentTestName || '';
  if (testName.includes('performance')) {
    jest.setTimeout(global.A2A_TEST_CONFIG.timeouts.performance);
  } else if (testName.includes('security')) {
    jest.setTimeout(global.A2A_TEST_CONFIG.timeouts.security);
  } else if (testName.includes('chaos')) {
    jest.setTimeout(global.A2A_TEST_CONFIG.timeouts.chaos);
  } else if (testName.includes('integration')) {
    jest.setTimeout(global.A2A_TEST_CONFIG.timeouts.integration);
  } else if (testName.includes('protocol')) {
    jest.setTimeout(global.A2A_TEST_CONFIG.timeouts.protocol);
  } else {
    jest.setTimeout(global.A2A_TEST_CONFIG.timeouts.default);
  }
});

// Cleanup after each test
afterEach(() => {
  // Clean up any test-specific resources
  jest.clearAllTimers();
  jest.useRealTimers();
});

// Error handling for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process in tests, just log
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit the process in tests, just log
});

export {};