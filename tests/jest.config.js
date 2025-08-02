/**
 * Jest Configuration for Gemini-Flow Test Suite
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '<rootDir>/tests/**/*.test.js',
    '<rootDir>/tests/**/*.spec.js'
  ],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  collectCoverageFrom: [
    '<rootDir>/src/**/*.js',
    '!<rootDir>/src/**/*.test.js',
    '!<rootDir>/src/**/*.spec.js',
    '!<rootDir>/src/test-utils/**',
    '!<rootDir>/node_modules/**'
  ],
  
  // Coverage thresholds (matching QA strategy targets)
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/core/': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95
    }
  },
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup/jest.setup.js'
  ],
  
  // Test timeout (important for performance tests)
  testTimeout: 30000, // 30 seconds
  
  // Module paths
  modulePaths: [
    '<rootDir>/src',
    '<rootDir>/tests'
  ],
  
  // Transform configuration
  transform: {
    '^.+\\.jsx?$': 'babel-jest'
  },
  
  // Performance and parallel execution
  maxWorkers: '50%', // Use half of available CPU cores
  
  // Test result processor for performance tracking
  testResultsProcessor: '<rootDir>/tests/utils/performance-processor.js',
  
  // Custom reporters
  reporters: [
    'default',
    ['<rootDir>/tests/utils/performance-reporter.js', {
      outputFile: '<rootDir>/test-results/performance-report.json'
    }],
    ['jest-junit', {
      outputDirectory: '<rootDir>/test-results',
      outputName: 'junit.xml'
    }]
  ],
  
  // Global test configuration
  globals: {
    'TEST_ENVIRONMENT': 'jest',
    'PERFORMANCE_MONITORING': true,
    'SWARM_TEST_MODE': true
  },
  
  // Verbose output for debugging
  verbose: process.env.NODE_ENV === 'development',
  
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  
  // Error handling
  errorOnDeprecated: true,
  
  // Test categories using projects
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/unit/**/*.test.js'],
      testTimeout: 10000
    },
    {
      displayName: 'integration', 
      testMatch: ['<rootDir>/tests/integration/**/*.test.js'],
      testTimeout: 20000
    },
    {
      displayName: 'performance',
      testMatch: ['<rootDir>/tests/performance/**/*.test.js'], 
      testTimeout: 60000, // Longer timeout for performance tests
      globals: {
        'PERFORMANCE_MODE': true
      }
    },
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/tests/e2e/**/*.test.js'],
      testTimeout: 120000 // 2 minutes for end-to-end tests
    }
  ]
};