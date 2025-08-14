/**
 * Jest Configuration for Protocol Tests
 * Focused on comprehensive testing of protocol components
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Root directory
  rootDir: './src/protocols',
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.js'
  ],
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'js', 'json'],
  
  // Transform TypeScript files
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  
  // Module name mapping for imports
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/../$1',
    '^@protocols/(.*)$': '<rootDir>/$1'
  },
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/../tests/setup/jest.setup.js'
  ],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: '<rootDir>/../../coverage/protocols',
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/__tests__/**',
    '!**/dist/**',
    '!**/coverage/**'
  ],
  
  // Coverage thresholds - aiming for 80%+
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    // Specific component thresholds
    './protocol-activator.ts': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    },
    './a2a/memory/distributed-memory-manager.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './a2a/consensus/byzantine-consensus.ts': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  
  // Coverage reporters
  coverageReporters: [
    'text',
    'html',
    'lcov',
    'json-summary'
  ],
  
  // Test timeout
  testTimeout: 30000,
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Mock modules
  modulePathIgnorePatterns: [
    '<rootDir>/dist/',
    '<rootDir>/node_modules/'
  ],
  
  // Global variables
  globals: {
    'ts-jest': {
      useESM: false,
      tsconfig: {
        module: 'commonjs',
        target: 'es2020',
        lib: ['es2020', 'dom'],
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        declaration: false,
        declarationMap: false,
        sourceMap: true
      }
    }
  },
  
  // Test result processor
  testResultsProcessor: 'jest-sonar-reporter',
  
  // Test execution order
  testSequencer: '@jest/test-sequencer',
  
  // Custom matchers
  setupFilesAfterEnv: [
    '<rootDir>/../tests/setup/jest.setup.js',
    '<rootDir>/../tests/setup/custom-matchers.ts'
  ],
  
  // Error on deprecated features
  errorOnDeprecated: true,
  
  // Notify mode
  notify: false,
  
  // Watch plugins
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],
  
  // Reporters
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: '<rootDir>/../../coverage/protocols/html-report',
        filename: 'index.html',
        expand: true,
        hideIcon: false
      }
    ],
    [
      'jest-junit',
      {
        outputDirectory: '<rootDir>/../../coverage/protocols',
        outputName: 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true
      }
    ]
  ],
  
  // Max worker processes
  maxWorkers: '50%',
  
  // Force exit after tests complete
  forceExit: false,
  
  // Detect open handles
  detectOpenHandles: true,
  
  // Detect leaked timers
  detectLeaks: false,
  
  // Custom test environment options
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  }
};