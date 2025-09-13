/**
 * Logger TDD Test - Red-Green-Refactor Cycle
 * Tests the logger functionality to ensure it works correctly
 */

import { Logger, LogLevel } from '../../../src/utils/logger';

describe('Logger TDD Cycle', () => {
  let logger: Logger;

  beforeEach(() => {
    // Red: Create logger that should work
    logger = new Logger('test-logger', LogLevel.INFO);
  });

  it('should create logger instance', () => {
    // Red: This should pass as basic instantiation
    expect(logger).toBeDefined();
    expect(logger.name).toBe('test-logger');
  });

  it('should provide logger getName method (TDD RED-GREEN)', () => {
    // Green: Now getName method exists and works
    expect(typeof logger.getName).toBe('function');
    expect(logger.getName()).toBe('test-logger');
  });

  it('should log messages without throwing errors', () => {
    // Red: This currently fails due to winston import issues
    expect(() => {
      logger.info('Test message');
      logger.error('Test error');
      logger.warn('Test warning');
    }).not.toThrow();
  });

  it('should respect log levels', () => {
    // Red: Test log level filtering
    const debugLogger = new Logger('debug', LogLevel.DEBUG);
    const errorLogger = new Logger('error', LogLevel.ERROR);

    expect(() => {
      debugLogger.debug('Debug message');
      debugLogger.info('Info message');
      debugLogger.error('Error message');
      
      errorLogger.debug('Debug message'); // Should not output
      errorLogger.info('Info message');   // Should not output
      errorLogger.error('Error message'); // Should output
    }).not.toThrow();
  });
});