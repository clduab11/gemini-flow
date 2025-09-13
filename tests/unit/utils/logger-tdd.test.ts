/**
 * Test runner: Jest (ts-jest).
 * We mock 'winston' to isolate our Logger wrapper and to make assertions on how it interacts with winston.
 * This aligns with the project's existing Jest-style tests (describe/it/expect globals).
 */
jest.mock('winston', () => {
  const created: any[] = [];

  const makeMockLogger = () => {
    const l: any = {
      level: 'info',
      log: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      add: jest.fn(),
      remove: jest.fn(),
      child: jest.fn(function (this: any) { return this; }),
    };
    created.push(l);
    return l;
  };

  const transports = { Console: jest.fn() };
  const format = {
    combine: jest.fn((...args: any[]) => args),
    timestamp: jest.fn(() => ((info: any) => info)),
    printf: jest.fn((formatter: any) => formatter),
    colorize: jest.fn(),
    json: jest.fn(),
    simple: jest.fn(),
  };

  const api: any = {
    createLogger: jest.fn(makeMockLogger),
    transports,
    format,
    __mock: { created },
  };

  return { __esModule: true, default: api, ...api };
});
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
// Enhanced unit tests focusing on the logger public API and its interaction with winston.
// These tests complement the existing TDD-style tests above and remain Jest-compatible.

describe('Logger unit tests (enhanced)', () => {
  const getWinston = () => jest.requireMock('winston') as any;
  const getLastMockLogger = () => {
    const w = getWinston();
    return w.__mock.created[w.__mock.created.length - 1];
  };

  beforeEach(() => {
    const w = getWinston();
    w.createLogger.mockClear();
    if (w.format) {
      Object.keys(w.format).forEach((k: string) => w.format[k]?.mockClear?.());
    }
    if (w.transports?.Console) {
      w.transports.Console.mockClear();
    }
    w.__mock.created.splice(0);
  });

  it('creates an underlying winston logger on instantiation with expected level (INFO)', () => {
    const { Logger, LogLevel } = require('../../../src/utils/logger');
    const logger = new Logger('create-test', LogLevel.INFO);

    const w = getWinston();
    expect(w.createLogger).toHaveBeenCalledTimes(1);
    const arg0 = w.createLogger.mock.calls[0][0];
    // Validate the level mapping (INFO -> 'info') and that a basic config object is passed.
    expect(arg0).toEqual(expect.objectContaining({ level: 'info' }));
    expect(logger.getName()).toBe('create-test');
  });

  it('forwards log calls to underlying logger methods', () => {
    const { Logger, LogLevel } = require('../../../src/utils/logger');
    const logger = new Logger('forward', LogLevel.DEBUG);
    const mock = getLastMockLogger();

    logger.debug('d', { a: 1 });
    logger.info('i');
    logger.warn('w');
    logger.error('e');

    expect(mock.debug).toHaveBeenCalledWith('d', { a: 1 });
    expect(mock.info).toHaveBeenCalledWith('i');
    expect(mock.warn).toHaveBeenCalledWith('w');
    expect(mock.error).toHaveBeenCalledWith('e');
  });

  it('handles Error instances without throwing', () => {
    const { Logger, LogLevel } = require('../../../src/utils/logger');
    const logger = new Logger('errors', LogLevel.INFO);
    const mock = getLastMockLogger();
    const err = new Error('boom');

    expect(() => logger.error(err)).not.toThrow();
    expect(mock.error).toHaveBeenCalled();
  });

  it('does not share state between instances (independent underlying loggers)', () => {
    const { Logger, LogLevel } = require('../../../src/utils/logger');

    const a = new Logger('A', LogLevel.DEBUG);
    const aMock = getLastMockLogger();

    const b = new Logger('B', LogLevel.DEBUG);
    const bMock = getLastMockLogger();

    a.info('a1');
    b.info('b1');

    expect(aMock.info).toHaveBeenCalledTimes(1);
    expect(bMock.info).toHaveBeenCalledTimes(1);
  });

  it('supports different log levels on construction (DEBUG/INFO/ERROR)', () => {
    const { Logger, LogLevel } = require('../../../src/utils/logger');
    const cases: Array<[number, string]> = [
      [LogLevel.DEBUG, 'debug'],
      [LogLevel.INFO, 'info'],
      [LogLevel.ERROR, 'error'],
    ];

    for (const [level, expected] of cases) {
      // Each iteration should create a new underlying winston logger with the mapped level string
      // Note: name doubles as a unique identifier here.
      // Reset mock calls for deterministic assertions per iteration
      const w = getWinston();
      w.createLogger.mockClear();

      const l = new Logger(`level-${expected}`, level);
      const call = w.createLogger.mock.calls[w.createLogger.mock.calls.length - 1];
      expect(call && call[0]).toEqual(expect.objectContaining({ level: expected }));
      expect(l.getName()).toBe(`level-${expected}`);
    }
  });

  it('accepts undefined/null/meta params gracefully (no throws)', () => {
    const { Logger, LogLevel } = require('../../../src/utils/logger');
    const logger = new Logger('misc', LogLevel.INFO);

    expect(() => {
      logger.info(undefined as any);
      logger.info(null as any);
      logger.info('with meta', { user: 'alice', id: 42 });
    }).not.toThrow();
  });

  it('supports multiple arguments for message formatting without throwing', () => {
    const { Logger, LogLevel } = require('../../../src/utils/logger');
    const logger = new Logger('fmt', LogLevel.DEBUG);
    const mock = getLastMockLogger();

    expect(() => logger.info('User %s logged in', 'alice')).not.toThrow();
    expect(mock.info).toHaveBeenCalled();
  });
});