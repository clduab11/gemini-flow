/**
 * Jest Configuration for Gemini Flow Validation Tests
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Root directory
  rootDir: '../',
  
  // Test directories
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.spec.js'
  ],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: '<rootDir>/validation/coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{js,ts}',
    '!src/**/*.spec.{js,ts}',
    '!src/mocks/**',
    '!src/test-utils/**'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup/global-setup.js'
  ],
  
  // Test timeout
  testTimeout: 120000, // 2 minutes for integration tests
  
  // Module paths
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1'
  },
  
  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        '@babel/preset-typescript'
      ]
    }]
  },
  
  // Module file extensions
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  
  // Test reporters
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './validation/coverage/html-report',
      filename: 'test-report.html',
      expand: true,
      hideIcon: false,
      pageTitle: 'Gemini Flow Validation Results'
    }],
    ['jest-junit', {
      outputDirectory: './validation/reports',
      outputName: 'junit.xml',
      suiteName: 'Gemini Flow Validation Tests'
    }]
  ],
  
  // Verbose output
  verbose: true,
  
  // Error handling
  bail: false, // Don't stop on first failure
  
  // Parallel execution
  maxWorkers: '50%', // Use half of available CPU cores
  
  // Test suites configuration
  projects: [
    {
      displayName: 'Unit Tests',
      testMatch: ['<rootDir>/tests/unit/**/*.test.js'],
      testTimeout: 10000
    },
    {
      displayName: 'Integration Tests',
      testMatch: ['<rootDir>/tests/integration/**/*.test.js'],
      testTimeout: 60000
    },
    {
      displayName: 'Performance Tests',
      testMatch: ['<rootDir>/tests/performance/**/*.test.js'],
      testTimeout: 300000 // 5 minutes for performance tests
    },
    {
      displayName: 'Security Tests',
      testMatch: ['<rootDir>/tests/security/**/*.test.js'],
      testTimeout: 120000 // 2 minutes for security tests
    },
    {
      displayName: 'E2E Tests',
      testMatch: ['<rootDir>/tests/e2e/**/*.test.js'],
      testTimeout: 600000 // 10 minutes for end-to-end tests
    }
  ],
  
  // Global variables
  globals: {
    __TEST_ENV__: true,
    __VERSION__: '2.0.0-alpha'
  },
  
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  
  // Test environment options
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  },
  
  // Watch mode configuration
  watchman: true,
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/validation/'
  ],
  
  // Error on deprecated features
  errorOnDeprecated: true,
  
  // Custom matchers and utilities
  setupFiles: [
    '<rootDir>/tests/setup/env-setup.js'
  ]
};