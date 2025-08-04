/**
 * Jest Configuration for A2A Compliance Testing
 * Specialized configuration for comprehensive A2A protocol testing with 100% coverage requirements
 */

const path = require('path');
const baseConfig = require('./jest.config.cjs');

module.exports = {
  // Extend base configuration
  ...baseConfig,
  
  // A2A-specific display name
  displayName: {
    name: 'A2A-COMPLIANCE',
    color: 'blue'
  },

  // Test environment optimized for A2A testing
  testEnvironment: 'node',
  
  // A2A test file patterns
  testMatch: [
    '<rootDir>/tests/a2a/**/*.test.ts',
    '<rootDir>/tests/a2a/**/*.spec.ts'
  ],
  
  // Ignore patterns for A2A tests
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/dist/',
    '<rootDir>/tests/(?!a2a)',  // Only run A2A tests
    '<rootDir>/tests/a2a/fixtures/',
    '<rootDir>/tests/a2a/utils/',
    '<rootDir>/tests/a2a/mocks/'
  ],

  // Setup files for A2A testing environment
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup/jest.setup.js',
    '<rootDir>/tests/a2a/setup/a2a-test-setup.ts'
  ],

  // Global setup and teardown for A2A infrastructure
  globalSetup: '<rootDir>/tests/a2a/setup/global-setup.ts',
  globalTeardown: '<rootDir>/tests/a2a/setup/global-teardown.ts',

  // Transform configuration for TypeScript and ES modules
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
      isolatedModules: true,
      tsconfig: {
        compilerOptions: {
          module: 'es2022',
          target: 'es2022',
          moduleResolution: 'node',
          allowSyntheticDefaultImports: true,
          esModuleInterop: true,
          skipLibCheck: true,
          declaration: false,
          strict: true
        }
      }
    }],
    '^.+\\.jsx?$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', {
          targets: { node: 'current' },
          modules: 'commonjs'
        }]
      ]
    }]
  },

  // Module name mapping for A2A imports
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
    '^@a2a/(.*)$': '<rootDir>/tests/a2a/$1'
  },

  // File extensions to handle
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Coverage configuration - STRICT 100% requirements
  collectCoverage: true,
  collectCoverageFrom: [
    // A2A core implementation files
    'src/core/a2a-*.ts',
    'src/core/mcp-adapter.ts',
    'src/core/model-orchestrator.ts',
    
    // A2A integration files
    'src/adapters/**/*.ts',
    'src/services/**/*.ts',
    
    // Include A2A test harness for self-testing
    'tests/a2a/compliance/test-harness.ts',
    
    // Exclusions
    '!src/**/*.d.ts',
    '!src/**/*.config.ts',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
    '!**/*.interface.ts',
    '!**/*.type.ts'
  ],

  // Coverage thresholds - 100% across all metrics
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    },
    // Per-file thresholds for critical A2A components
    'src/core/a2a-security-manager.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    },
    'src/core/a2a-integration.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    },
    'src/core/a2a-message-security.ts': {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    },
    'tests/a2a/compliance/test-harness.ts': {
      branches: 95,  // Slightly lower for test harness utilities
      functions: 100,
      lines: 95,
      statements: 95
    }
  },

  // Coverage reporters - multiple formats for different use cases
  coverageReporters: [
    'text',           // Console output
    'text-summary',   // Brief console summary
    'html',          // Interactive HTML report
    'json',          // Machine-readable JSON
    'json-summary',  // Summary JSON for CI/CD
    'lcov',          // For external tools (SonarQube, Codecov)
    'clover',        // XML format for some CI systems
    'cobertura'      // XML format for Jenkins/Azure DevOps
  ],

  // Coverage directory
  coverageDirectory: '<rootDir>/coverage/a2a',

  // Test timeout settings - generous for comprehensive A2A tests
  testTimeout: 300000, // 5 minutes default
  
  // Custom timeout per test type
  testNamePattern: process.env.A2A_TEST_PATTERN || undefined,

  // Performance optimizations for A2A testing
  maxWorkers: process.env.CI ? 2 : '50%', // Limit workers in CI, optimize locally
  maxConcurrency: 5, // Limit concurrent tests for stability

  // Retry configuration for flaky network/timing tests
  retry: process.env.CI ? 2 : 0, // Retry in CI environment

  // Reporter configuration
  reporters: [
    'default',
    
    // HTML reporter for detailed results
    ['jest-html-reporter', {
      pageTitle: 'A2A Compliance Test Results',
      outputPath: '<rootDir>/coverage/a2a/test-report.html',
      includeFailureMsg: true,
      includeSuiteFailure: true,
      includeConsoleLog: true,
      theme: 'darkTheme',
      logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBmaWxsPSIjNENBRjUwIi8+Cjwvc3ZnPgo='
    }],
    
    // JUnit XML reporter for CI/CD integration
    ['jest-junit', {
      outputDirectory: '<rootDir>/coverage/a2a',
      outputName: 'junit.xml',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}',
      ancestorSeparator: ' › ',
      usePathForSuiteName: true,
      addFileAttribute: true
    }],
    
    // Custom A2A compliance reporter
    '<rootDir>/tests/a2a/reporters/a2a-compliance-reporter.js'
  ],

  // Global configuration for A2A tests
  globals: {
    A2A_TEST_MODE: true,
    A2A_PERFORMANCE_TARGET: parseInt(process.env.A2A_PERFORMANCE_TARGET || '1000'),
    A2A_SECURITY_LEVEL: process.env.A2A_SECURITY_LEVEL || 'strict',
    A2A_COVERAGE_THRESHOLD: 100,
    A2A_MOCK_NETWORK_DELAY: parseInt(process.env.A2A_MOCK_NETWORK_DELAY || '10'),
    A2A_ENABLE_CHAOS_TESTING: process.env.A2A_ENABLE_CHAOS_TESTING === 'true'
  },

  // Test environment variables
  testEnvironmentOptions: {
    A2A_TEST_SUITE: 'compliance',
    A2A_LOG_LEVEL: process.env.A2A_LOG_LEVEL || 'error',
    A2A_MOCK_MODE: 'comprehensive'
  },

  // Cache configuration for faster subsequent runs
  cache: true,
  cacheDirectory: '<rootDir>/node_modules/.cache/jest/a2a',

  // Clear mocks between tests for isolation
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // Detect open handles and force exit for cleanup
  detectOpenHandles: true,
  forceExit: true,

  // Verbose output for detailed test information
  verbose: process.env.A2A_VERBOSE === 'true' || process.env.CI === 'true',

  // Fail fast on first error (can be overridden)
  bail: process.env.A2A_BAIL === 'true' ? 1 : 0,

  // Error handling
  errorOnDeprecated: true,
  
  // Snapshot configuration
  updateSnapshot: process.env.A2A_UPDATE_SNAPSHOTS === 'true',

  // Watch mode configuration (for development)
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],

  // Custom resolver for A2A modules
  resolver: '<rootDir>/tests/a2a/setup/jest-resolver.js',

  // Module directories for A2A dependencies
  moduleDirectories: [
    'node_modules',
    '<rootDir>/src',
    '<rootDir>/tests',
    '<rootDir>/tests/a2a'
  ],

  // Project-specific Jest configuration for different test types
  projects: [
    {
      displayName: 'A2A Protocol Compliance',
      testMatch: ['<rootDir>/tests/a2a/compliance/protocol-compliance.test.ts'],
      testTimeout: 600000, // 10 minutes for comprehensive protocol tests
      setupFilesAfterEnv: ['<rootDir>/tests/a2a/setup/protocol-setup.ts']
    },
    {
      displayName: 'MCP Bridge Integration',
      testMatch: ['<rootDir>/tests/a2a/compliance/mcp-bridge-integration.test.ts'],
      testTimeout: 900000, // 15 minutes for full MCP tool testing
      setupFilesAfterEnv: ['<rootDir>/tests/a2a/setup/mcp-setup.ts']
    },
    {
      displayName: 'Performance Benchmarks',
      testMatch: ['<rootDir>/tests/a2a/compliance/performance-benchmarks.test.ts'],
      testTimeout: 1800000, // 30 minutes for performance testing
      setupFilesAfterEnv: ['<rootDir>/tests/a2a/setup/performance-setup.ts'],
      maxWorkers: 1 // Single worker for consistent performance measurements
    },
    {
      displayName: 'Chaos Engineering',
      testMatch: ['<rootDir>/tests/a2a/compliance/chaos-engineering.test.ts'],
      testTimeout: 1500000, // 25 minutes for chaos testing
      setupFilesAfterEnv: ['<rootDir>/tests/a2a/setup/chaos-setup.ts'],
      maxWorkers: 1 // Single worker for controlled chaos injection
    },
    {
      displayName: 'Security Penetration',
      testMatch: ['<rootDir>/tests/a2a/compliance/security-penetration.test.ts'],
      testTimeout: 1800000, // 30 minutes for comprehensive security testing
      setupFilesAfterEnv: ['<rootDir>/tests/a2a/setup/security-setup.ts'],
      maxWorkers: 1 // Single worker for security isolation
    }
  ],

  // Custom matchers for A2A testing
  setupFilesAfterEnv: [
    '<rootDir>/tests/a2a/setup/custom-matchers.ts'
  ]
};

// Export configuration factory for dynamic environments
module.exports.createA2AConfig = function(options = {}) {
  return {
    ...module.exports,
    ...options,
    globals: {
      ...module.exports.globals,
      ...options.globals
    },
    coverageThreshold: {
      ...module.exports.coverageThreshold,
      ...options.coverageThreshold
    }
  };
};