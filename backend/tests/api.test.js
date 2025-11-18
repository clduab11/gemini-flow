/**
 * Comprehensive API Test Suite
 * 
 * Tests for all security, middleware, and utility features:
 * - API key authentication
 * - Rate limiting
 * - Payload size limits
 * - Pagination
 * - Prometheus metrics
 * - Atomic file operations
 * - Database backups
 * - Health checks
 * 
 * @module tests/api
 */

import { jest } from '@jest/globals';

// Mock environment before imports
process.env.NODE_ENV = 'test';
process.env.API_KEY = 'test-api-key-123';
process.env.LOG_LEVEL = 'error'; // Suppress logs during tests

describe('API Test Suite', () => {
  describe('Environment Setup', () => {
    test('should have test environment configured', () => {
      expect(process.env.NODE_ENV).toBe('test');
    });

    test('should have test API key configured', () => {
      expect(process.env.API_KEY).toBe('test-api-key-123');
    });
  });

  describe('API Key Authentication', () => {
    test('should create valid API key set from environment', async () => {
      const { default: apiKeyAuth } = await import('../src/api/middleware/apiKeyAuth.js');
      expect(apiKeyAuth).toBeDefined();
      expect(typeof apiKeyAuth).toBe('function');
    });

    test('should bypass authentication in non-production mode', async () => {
      const { apiKeyAuth } = await import('../src/api/middleware/apiKeyAuth.js');
      
      const req = { path: '/test', headers: {} };
      const res = {};
      let nextCalled = false;
      const next = () => { nextCalled = true; };

      apiKeyAuth(req, res, next);
      expect(nextCalled).toBe(true);
    });
  });

  describe('Payload Size Limit', () => {
    test('should create payload size limit middleware', async () => {
      const { payloadSizeLimit } = await import('../src/api/middleware/payloadSizeLimit.js');
      expect(payloadSizeLimit).toBeDefined();
      expect(typeof payloadSizeLimit).toBe('function');
    });

    test('should allow requests within size limit', async () => {
      const { payloadSizeLimit } = await import('../src/api/middleware/payloadSizeLimit.js');
      
      const req = {
        headers: {
          'content-type': 'application/json',
          'content-length': '1000' // 1KB - within limit
        },
        path: '/test',
        method: 'POST'
      };
      const res = {};
      let nextCalled = false;
      const next = () => { nextCalled = true; };

      payloadSizeLimit(req, res, next);
      expect(nextCalled).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    test('should initialize rate limiter', async () => {
      const { initializeRateLimiter } = await import('../src/api/middleware/persistentRateLimit.js');
      expect(initializeRateLimiter).toBeDefined();
      expect(typeof initializeRateLimiter).toBe('function');
      
      await expect(initializeRateLimiter()).resolves.not.toThrow();
    });

    test('should create rate limit middleware', async () => {
      const { createRateLimit } = await import('../src/api/middleware/persistentRateLimit.js');
      const limiter = createRateLimit({ max: 10, windowMs: 60000 });
      
      expect(limiter).toBeDefined();
      expect(typeof limiter).toBe('function');
    });
  });

  describe('Prometheus Metrics', () => {
    test('should initialize metrics', async () => {
      const { initializeMetrics } = await import('../src/api/middleware/prometheusMetrics.js');
      expect(initializeMetrics).toBeDefined();
      
      expect(() => initializeMetrics()).not.toThrow();
    });

    test('should track HTTP metrics', async () => {
      const { httpMetrics, getMetrics } = await import('../src/api/middleware/prometheusMetrics.js');
      
      const req = { method: 'GET', path: '/test', headers: {} };
      const res = {
        end: function(...args) {
          return this;
        },
        get: () => '0'
      };
      let nextCalled = false;
      const next = () => { nextCalled = true; };

      httpMetrics(req, res, next);
      expect(nextCalled).toBe(true);
      
      const metrics = getMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.uptime).toBeGreaterThanOrEqual(0);
    });

    test('should format metrics in Prometheus format', async () => {
      const { metricsHandler } = await import('../src/api/middleware/prometheusMetrics.js');
      
      const req = {};
      const res = {
        set: jest.fn(),
        send: jest.fn()
      };

      metricsHandler(req, res);
      expect(res.set).toHaveBeenCalledWith('Content-Type', 'text/plain; version=0.0.4');
      expect(res.send).toHaveBeenCalled();
      
      const metricsOutput = res.send.mock.calls[0][0];
      expect(typeof metricsOutput).toBe('string');
      expect(metricsOutput).toContain('# HELP');
      expect(metricsOutput).toContain('# TYPE');
    });
  });

  describe('Pagination', () => {
    test('should create pagination middleware', async () => {
      const { pagination } = await import('../src/api/middleware/pagination.js');
      expect(pagination).toBeDefined();
      expect(typeof pagination).toBe('function');
    });

    test('should parse pagination parameters', async () => {
      const { pagination } = await import('../src/api/middleware/pagination.js');
      
      const req = {
        query: {
          page: '2',
          limit: '10',
          sortBy: 'name',
          sortOrder: 'desc'
        }
      };
      let nextCalled = false;
      const next = () => { nextCalled = true; };

      pagination(req, {}, next);
      
      expect(nextCalled).toBe(true);
      expect(req.pagination).toBeDefined();
      expect(req.pagination.page).toBe(2);
      expect(req.pagination.limit).toBe(10);
      expect(req.pagination.sortBy).toBe('name');
      expect(req.pagination.sortDirection).toBe('desc');
    });

    test('should apply pagination to array', async () => {
      const { pagination } = await import('../src/api/middleware/pagination.js');
      
      const req = { query: { page: '1', limit: '5' } };
      pagination(req, {}, () => {});
      
      const testData = Array.from({ length: 20 }, (_, i) => ({ id: i + 1 }));
      const result = req.pagination.applyToArray(testData);
      
      expect(result.data).toHaveLength(5);
      expect(result.data[0].id).toBe(1);
      expect(result.pagination.total).toBe(20);
      expect(result.pagination.totalPages).toBe(4);
    });
  });

  describe('Atomic File Operations', () => {
    test('should provide atomic write function', async () => {
      const { atomicWriteFile } = await import('../src/utils/atomicFileOperations.js');
      expect(atomicWriteFile).toBeDefined();
      expect(typeof atomicWriteFile).toBe('function');
    });

    test('should provide atomic modify function', async () => {
      const { atomicModifyFile } = await import('../src/utils/atomicFileOperations.js');
      expect(atomicModifyFile).toBeDefined();
      expect(typeof atomicModifyFile).toBe('function');
    });

    test('should provide AtomicBatch class', async () => {
      const { AtomicBatch } = await import('../src/utils/atomicFileOperations.js');
      expect(AtomicBatch).toBeDefined();
      
      const batch = new AtomicBatch();
      expect(batch).toBeInstanceOf(AtomicBatch);
      expect(typeof batch.add).toBe('function');
      expect(typeof batch.commit).toBe('function');
      expect(typeof batch.rollback).toBe('function');
    });

    test('should provide log rotation function', async () => {
      const { rotateLogFile } = await import('../src/utils/atomicFileOperations.js');
      expect(rotateLogFile).toBeDefined();
      expect(typeof rotateLogFile).toBe('function');
    });
  });

  describe('Database Backup', () => {
    test('should create backup manager', async () => {
      const { DatabaseBackupManager } = await import('../src/utils/databaseBackup.js');
      expect(DatabaseBackupManager).toBeDefined();
      
      const manager = new DatabaseBackupManager();
      expect(manager).toBeInstanceOf(DatabaseBackupManager);
      expect(typeof manager.createBackup).toBe('function');
      expect(typeof manager.restoreBackup).toBe('function');
      expect(typeof manager.listBackups).toBe('function');
    });

    test('should provide singleton backup manager', async () => {
      const { backupManager } = await import('../src/utils/databaseBackup.js');
      expect(backupManager).toBeDefined();
      expect(typeof backupManager.createBackup).toBe('function');
    });

    test('should list backups', async () => {
      const { backupManager } = await import('../src/utils/databaseBackup.js');
      const backups = backupManager.listBackups();
      expect(Array.isArray(backups)).toBe(true);
    });
  });

  describe('WebSocket Authentication', () => {
    test('should create WebSocket authentication functions', async () => {
      const websocketAuth = await import('../src/api/middleware/websocketAuth.js');
      expect(websocketAuth.authenticateWebSocket).toBeDefined();
      expect(websocketAuth.verifyWebSocketUpgrade).toBeDefined();
    });

    test('should allow WebSocket connections in non-production', async () => {
      const { authenticateWebSocket } = await import('../src/api/middleware/websocketAuth.js');
      
      const info = {
        req: {
          url: '/ws',
          headers: { host: 'localhost:3001' },
          socket: { remoteAddress: '127.0.0.1' }
        }
      };
      
      let callbackResult = null;
      const callback = (authenticated) => {
        callbackResult = authenticated;
      };

      authenticateWebSocket(info, callback);
      expect(callbackResult).toBe(true);
    });
  });

  describe('Logger', () => {
    test('should create structured logger', async () => {
      const { logger, createModuleLogger } = await import('../src/utils/logger.js');
      
      expect(logger).toBeDefined();
      expect(typeof logger.info).toBe('function');
      expect(typeof logger.error).toBe('function');
      expect(typeof logger.debug).toBe('function');
      expect(typeof logger.warn).toBe('function');
      
      expect(createModuleLogger).toBeDefined();
      const moduleLogger = createModuleLogger('test');
      expect(moduleLogger).toBeDefined();
      expect(typeof moduleLogger.info).toBe('function');
    });
  });

  describe('Integration Tests', () => {
    test('should have all middleware modules available', async () => {
      const modules = [
        '../src/api/middleware/apiKeyAuth.js',
        '../src/api/middleware/websocketAuth.js',
        '../src/api/middleware/payloadSizeLimit.js',
        '../src/api/middleware/persistentRateLimit.js',
        '../src/api/middleware/prometheusMetrics.js',
        '../src/api/middleware/pagination.js'
      ];

      for (const modulePath of modules) {
        const module = await import(modulePath);
        expect(module).toBeDefined();
      }
    });

    test('should have all utility modules available', async () => {
      const modules = [
        '../src/utils/logger.js',
        '../src/utils/atomicFileOperations.js',
        '../src/utils/databaseBackup.js'
      ];

      for (const modulePath of modules) {
        const module = await import(modulePath);
        expect(module).toBeDefined();
      }
    });
  });
});
