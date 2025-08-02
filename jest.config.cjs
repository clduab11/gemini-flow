module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  testEnvironmentOptions: {
    NODE_OPTIONS: '--experimental-vm-modules --loader ./tests/setup/esm-loader.mjs'
  },
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js|mjs)',
    '**/?(*.)+(spec|test).+(ts|tsx|js|mjs)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
      tsconfig: './tests/tsconfig.json'
    }],
    '^.+\\.(js|jsx|mjs)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { 
          targets: { node: 'current' },
          modules: false
        }]
      ]
    }]
  },
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{js,ts}',
    '!src/**/*.spec.{js,ts}',
    '!src/index.ts',
    '!src/cli/index.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    // Map Node.js modules for ESM compatibility
    '^node:(.*)$': '$1'
  },
  extensionsToTreatAsEsm: ['.ts', '.mts'],
  transformIgnorePatterns: [
    'node_modules/(?!(chalk|ora|inquirer|source-map-support|@google-cloud|googleapis)/)'
  ],
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.js'],
  // ESM-specific configuration - removed deprecated globals
  // ts-jest config is now in transform section above
  // Skip problematic test files during transition
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/'
  ],
  // Mock file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node', 'mjs'],
  // Resolve modules with .js extensions in TypeScript
  resolver: undefined
};