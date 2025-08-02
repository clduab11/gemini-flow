module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  testEnvironmentOptions: {
    NODE_OPTIONS: '--experimental-vm-modules'
  },
  roots: ['<rootDir>/src', '<rootDir>/tests', '<rootDir>'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js|mjs)',
    '**/?(*.)+(spec|test).+(ts|tsx|js|mjs)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        module: 'esnext',
        target: 'es2020'
      }
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
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  extensionsToTreatAsEsm: ['.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!(chalk|ora|inquirer)/)'
  ],
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.js']
};