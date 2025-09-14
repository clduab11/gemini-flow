/**
 * SQLite Connection Wrapper - TDD Unit Tests
 *
 * This file demonstrates TDD implementation for the SQLite connection wrapper
 * with fallback hierarchy: better-sqlite3 → sqlite3 → sql.js
 *
 * RED-GREEN-REFACTOR cycle applied throughout
 */
const { describe, test, expect, beforeEach, afterEach, jest } = require('@jest/globals');
const { performance } = require('perf_hooks');
// Mock implementations for testing fallback hierarchy
const mockBetterSQLite3 = {
    default: jest.fn().mockImplementation((dbPath) => ({
        exec: jest.fn(),
        prepare: jest.fn(() => ({
            run: jest.fn(() => ({ changes: 1, lastInsertRowID: 1 })),
            get: jest.fn(() => ({ test: 1 })),
            all: jest.fn(() => [{ test: 1 }])
        })),
        pragma: jest.fn(() => 'wal'),
        close: jest.fn(),
        open: true
    }))
};
const mockSQLite3 = {
    default: {
        Database: jest.fn().mockImplementation((dbPath, callback) => {
            callback(null); // Success callback
            return {
                run: jest.fn((sql, params, callback) => callback.call({ changes: 1, lastID: 1 }, null)),
                get: jest.fn((sql, params, callback) => callback(null, { test: 1 })),
                all: jest.fn((sql, params, callback) => callback(null, [{ test: 1 }])),
                exec: jest.fn((sql, callback) => callback(null)),
                close: jest.fn((callback) => callback(null))
            };
        })
    }
};
const mockSQLJS = {
    default: jest.fn().mockResolvedValue({
        Database: jest.fn().mockImplementation((data) => ({
            run: jest.fn(),
            prepare: jest.fn(() => ({
                run: jest.fn(),
                step: jest.fn(() => true),
                getAsObject: jest.fn(() => ({ test: 1 })),
                free: jest.fn()
            })),
            export: jest.fn(() => new Uint8Array()),
            close: jest.fn(),
            getRowsModified: jest.fn(() => 1)
        }))
    })
};
describe('SQLite Connection Wrapper - TDD Implementation', () => {
    let originalModules;
    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();
        // Store original modules
        originalModules = {};
    });
    afterEach(() => {
        // Restore original modules if needed
        jest.restoreAllMocks();
    });
    describe('Phase 1: Connection Factory & Fallback Detection (TDD)', () => {
        describe('RED Phase: Tests fail initially', () => {
            test('should detect available SQLite implementations', async () => {
                // RED: This test will fail initially because detectSQLiteImplementations doesn't exist
                // Mock different availability scenarios
                jest.doMock('better-sqlite3', () => mockBetterSQLite3);
                jest.doMock('sqlite3', () => mockSQLite3);
                jest.doMock('sql.js', () => mockSQLJS);
                const { detectSQLiteImplementations } = require('../../gemini-flow/src/memory/sqlite-adapter');
                const detection = await detectSQLiteImplementations();
                expect(detection).toHaveProperty('available');
                expect(detection).toHaveProperty('recommended');
                expect(detection).toHaveProperty('errors');
                expect(detection.available).toContain('sql.js'); // Always available fallback
                expect(Array.isArray(detection.available)).toBe(true);
                expect(typeof detection.recommended).toBe('string');
            });
            test('should prioritize better-sqlite3 when available', async () => {
                // RED: createSQLiteDatabase doesn't exist or doesn't prioritize correctly
                jest.doMock('better-sqlite3', () => mockBetterSQLite3);
                jest.doMock('sqlite3', () => { throw new Error('Not available'); });
                jest.doMock('sql.js', () => mockSQLJS);
                const { createSQLiteDatabase } = require('../../gemini-flow/src/memory/sqlite-adapter');
                const db = await createSQLiteDatabase(':memory:');
                expect(db.name).toBe('better-sqlite3');
                expect(db.open).toBe(true);
                expect(typeof db.prepare).toBe('function');
                expect(typeof db.exec).toBe('function');
                expect(typeof db.pragma).toBe('function');
                expect(typeof db.close).toBe('function');
            });
            test('should fallback to sqlite3 when better-sqlite3 unavailable', async () => {
                // RED: Fallback logic doesn't exist
                jest.doMock('better-sqlite3', () => { throw new Error('Not available'); });
                jest.doMock('sqlite3', () => mockSQLite3);
                jest.doMock('sql.js', () => mockSQLJS);
                const { createSQLiteDatabase } = require('../../gemini-flow/src/memory/sqlite-adapter');
                const db = await createSQLiteDatabase(':memory:');
                expect(db.name).toBe('sqlite3');
                expect(db.open).toBe(true);
            });
            test('should use sql.js as final fallback', async () => {
                // RED: Final fallback doesn't exist
                jest.doMock('better-sqlite3', () => { throw new Error('Not available'); });
                jest.doMock('sqlite3', () => { throw new Error('Not available'); });
                jest.doMock('sql.js', () => mockSQLJS);
                const { createSQLiteDatabase } = require('../../gemini-flow/src/memory/sqlite-adapter');
                const db = await createSQLiteDatabase(':memory:');
                expect(db.name).toBe('sql.js');
                expect(db.open).toBe(true);
            });
        });
        describe('GREEN Phase: Make tests pass with minimal implementation', () => {
            test('should create database with preferred implementation', async () => {
                // GREEN: Implementation exists and works
                jest.doMock('better-sqlite3', () => mockBetterSQLite3);
                jest.doMock('sqlite3', () => mockSQLite3);
                jest.doMock('sql.js', () => mockSQLJS);
                const { createSQLiteDatabase } = require('../../gemini-flow/src/memory/sqlite-adapter');
                // Test preferred implementation selection
                const db = await createSQLiteDatabase(':memory:', 'sqlite3');
                expect(db.name).toBe('sqlite3');
                const db2 = await createSQLiteDatabase(':memory:', 'better-sqlite3');
                expect(db2.name).toBe('better-sqlite3');
            });
            test('should handle database operations uniformly across implementations', async () => {
                // GREEN: Unified interface works
                const implementations = ['better-sqlite3', 'sqlite3', 'sql.js'];
                for (const impl of implementations) {
                    // Mock only the requested implementation
                    if (impl === 'better-sqlite3') {
                        jest.doMock('better-sqlite3', () => mockBetterSQLite3);
                    }
                    else {
                        jest.doMock('better-sqlite3', () => { throw new Error('Not available'); });
                    }
                    if (impl === 'sqlite3') {
                        jest.doMock('sqlite3', () => mockSQLite3);
                    }
                    else {
                        jest.doMock('sqlite3', () => { throw new Error('Not available'); });
                    }
                    jest.doMock('sql.js', () => mockSQLJS);
                    const { createSQLiteDatabase } = require('../../gemini-flow/src/memory/sqlite-adapter');
                    const db = await createSQLiteDatabase(':memory:');
                    // Test unified interface
                    expect(db.name).toBe(impl);
                    expect(typeof db.prepare).toBe('function');
                    expect(typeof db.exec).toBe('function');
                    expect(typeof db.close).toBe('function');
                    // Test basic operations
                    const stmt = db.prepare('SELECT 1 as test');
                    expect(typeof stmt.run).toBe('function');
                    expect(typeof stmt.get).toBe('function');
                    expect(typeof stmt.all).toBe('function');
                }
            });
        });
        describe('REFACTOR Phase: Optimize and improve design', () => {
            test('should provide detailed error information on detection failure', async () => {
                // REFACTOR: Enhanced error handling and reporting
                jest.doMock('better-sqlite3', () => { throw new Error('Binary not found'); });
                jest.doMock('sqlite3', () => { throw new Error('Native module missing'); });
                jest.doMock('sql.js', () => { throw new Error('WASM not supported'); });
                const { detectSQLiteImplementations } = require('../../gemini-flow/src/memory/sqlite-adapter');
                const detection = await detectSQLiteImplementations();
                expect(detection.available).toHaveLength(0);
                expect(detection.errors).toHaveProperty('better-sqlite3');
                expect(detection.errors).toHaveProperty('sqlite3');
                expect(detection.errors).toHaveProperty('sql.js');
                expect(detection.errors['better-sqlite3'].message).toBe('Binary not found');
                expect(detection.errors['sqlite3'].message).toBe('Native module missing');
                expect(detection.errors['sql.js'].message).toBe('WASM not supported');
            });
            test('should validate database path and configuration', async () => {
                // REFACTOR: Input validation and configuration handling
                jest.doMock('better-sqlite3', () => mockBetterSQLite3);
                const { createSQLiteDatabase } = require('../../gemini-flow/src/memory/sqlite-adapter');
                // Test invalid paths
                await expect(createSQLiteDatabase('')).rejects.toThrow('Database path cannot be empty');
                await expect(createSQLiteDatabase(null)).rejects.toThrow('Database path must be a string');
                // Test invalid implementation preference
                await expect(createSQLiteDatabase(':memory:', 'invalid-impl')).rejects.toThrow('Unsupported SQLite implementation: invalid-impl');
            });
        });
    });
    describe('Phase 2: Connection Pool Management (TDD)', () => {
        describe('RED Phase: Connection pooling tests', () => {
            test('should create connection pool with specified configuration', async () => {
                // RED: SQLiteConnectionPool doesn't exist
                const { SQLiteConnectionPool } = require('../../gemini-flow/src/memory/sqlite-connection-pool');
                const pool = new SQLiteConnectionPool({
                    maxConnections: 10,
                    idleTimeout: 30000,
                    acquireTimeout: 5000,
                    dbPath: ':memory:'
                });
                expect(pool.maxConnections).toBe(10);
                expect(pool.idleTimeout).toBe(30000);
                expect(pool.acquireTimeout).toBe(5000);
                expect(pool.activeConnections).toBe(0);
                expect(pool.idleConnections).toBe(0);
            });
            test('should acquire connection from pool', async () => {
                // RED: acquire method doesn't exist
                const { SQLiteConnectionPool } = require('../../gemini-flow/src/memory/sqlite-connection-pool');
                const pool = new SQLiteConnectionPool({
                    maxConnections: 5,
                    dbPath: ':memory:'
                });
                const connection = await pool.acquire();
                expect(connection).toBeDefined();
                expect(connection.isActive()).toBe(true);
                expect(pool.activeConnections).toBe(1);
                expect(pool.idleConnections).toBe(0);
                // Connection should have standard interface
                expect(typeof connection.query).toBe('function');
                expect(typeof connection.transaction).toBe('function');
                expect(typeof connection.close).toBe('function');
            });
            test('should enforce maximum connection limit', async () => {
                // RED: Connection limiting doesn't exist
                const { SQLiteConnectionPool } = require('../../gemini-flow/src/memory/sqlite-connection-pool');
                const pool = new SQLiteConnectionPool({
                    maxConnections: 2,
                    acquireTimeout: 100, // Short timeout for testing
                    dbPath: ':memory:'
                });
                // Acquire maximum connections
                const conn1 = await pool.acquire();
                const conn2 = await pool.acquire();
                expect(pool.activeConnections).toBe(2);
                // Third connection should timeout
                const start = performance.now();
                await expect(pool.acquire()).rejects.toThrow('Connection acquire timeout');
                const duration = performance.now() - start;
                expect(duration).toBeGreaterThan(100);
                expect(duration).toBeLessThan(200); // Should fail quickly after timeout
            });
        });
        describe('GREEN Phase: Basic pool implementation', () => {
            test('should release connection back to pool', async () => {
                // GREEN: Basic release functionality
                const { SQLiteConnectionPool } = require('../../gemini-flow/src/memory/sqlite-connection-pool');
                const pool = new SQLiteConnectionPool({
                    maxConnections: 5,
                    dbPath: ':memory:'
                });
                const connection = await pool.acquire();
                expect(pool.activeConnections).toBe(1);
                await pool.release(connection);
                expect(pool.activeConnections).toBe(0);
                expect(pool.idleConnections).toBe(1);
                // Released connection should be reusable
                const connection2 = await pool.acquire();
                expect(connection2).toBe(connection); // Should reuse the same connection
                expect(pool.activeConnections).toBe(1);
                expect(pool.idleConnections).toBe(0);
            });
            test('should handle connection cleanup on idle timeout', async () => {
                // GREEN: Idle timeout implementation
                const { SQLiteConnectionPool } = require('../../gemini-flow/src/memory/sqlite-connection-pool');
                const pool = new SQLiteConnectionPool({
                    maxConnections: 5,
                    idleTimeout: 50, // Very short for testing
                    dbPath: ':memory:'
                });
                const connection = await pool.acquire();
                await pool.release(connection);
                expect(pool.idleConnections).toBe(1);
                // Wait for idle timeout
                await new Promise(resolve => setTimeout(resolve, 100));
                expect(pool.idleConnections).toBe(0);
                expect(connection.isClosed()).toBe(true);
            });
        });
        describe('REFACTOR Phase: Advanced pool features', () => {
            test('should provide connection health monitoring', async () => {
                // REFACTOR: Health checking and monitoring
                const { SQLiteConnectionPool } = require('../../gemini-flow/src/memory/sqlite-connection-pool');
                const pool = new SQLiteConnectionPool({
                    maxConnections: 5,
                    healthCheckInterval: 100,
                    dbPath: ':memory:'
                });
                const connection = await pool.acquire();
                // Mock connection health check failure
                jest.spyOn(connection, 'ping').mockResolvedValueOnce(false);
                await pool.release(connection);
                // Wait for health check
                await new Promise(resolve => setTimeout(resolve, 150));
                // Unhealthy connection should be removed from pool
                expect(pool.idleConnections).toBe(0);
                expect(connection.isClosed()).toBe(true);
            });
            test('should provide detailed pool statistics', async () => {
                // REFACTOR: Enhanced monitoring and statistics
                const { SQLiteConnectionPool } = require('../../gemini-flow/src/memory/sqlite-connection-pool');
                const pool = new SQLiteConnectionPool({
                    maxConnections: 5,
                    dbPath: ':memory:',
                    enableStats: true
                });
                // Perform various operations
                const conn1 = await pool.acquire();
                const conn2 = await pool.acquire();
                await pool.release(conn1);
                const stats = pool.getStatistics();
                expect(stats).toHaveProperty('totalAcquired');
                expect(stats).toHaveProperty('totalReleased');
                expect(stats).toHaveProperty('averageAcquireTime');
                expect(stats).toHaveProperty('currentActive');
                expect(stats).toHaveProperty('currentIdle');
                expect(stats).toHaveProperty('peakConnections');
                expect(stats.totalAcquired).toBe(2);
                expect(stats.totalReleased).toBe(1);
                expect(stats.currentActive).toBe(1);
                expect(stats.currentIdle).toBe(1);
                expect(stats.peakConnections).toBe(2);
            });
        });
    });
    describe('Phase 3: Performance & WAL Mode (TDD)', () => {
        describe('RED Phase: WAL mode optimization tests', () => {
            test('should enable WAL mode for performance optimization', async () => {
                // RED: WAL mode optimization doesn't exist
                jest.doMock('better-sqlite3', () => mockBetterSQLite3);
                const { createOptimizedConnection } = require('../../gemini-flow/src/memory/sqlite-optimized-connection');
                const connection = await createOptimizedConnection(':memory:', {
                    journalMode: 'WAL',
                    synchronous: 'NORMAL',
                    cacheSize: 10000,
                    tempStore: 'memory'
                });
                expect(connection.getJournalMode()).toBe('wal');
                expect(connection.getSynchronousMode()).toBe('NORMAL');
                expect(connection.getCacheSize()).toBe(10000);
                expect(connection.getTempStore()).toBe('memory');
            });
            test('should demonstrate performance improvement with WAL mode', async () => {
                // RED: Performance comparison doesn't exist
                const { createOptimizedConnection } = require('../../gemini-flow/src/memory/sqlite-optimized-connection');
                // Create connections with different configurations
                const walConnection = await createOptimizedConnection('test-wal.db', {
                    journalMode: 'WAL',
                    synchronous: 'NORMAL'
                });
                const journalConnection = await createOptimizedConnection('test-journal.db', {
                    journalMode: 'DELETE',
                    synchronous: 'FULL'
                });
                const operations = 1000;
                const testData = Array.from({ length: operations }, (_, i) => ({
                    id: i,
                    data: `test-data-${i}`
                }));
                // Measure journal mode performance
                const journalStart = performance.now();
                await journalConnection.transaction(async (tx) => {
                    for (const record of testData) {
                        await tx.query('INSERT INTO test_table VALUES (?, ?)', [record.id, record.data]);
                    }
                });
                const journalTime = performance.now() - journalStart;
                // Measure WAL mode performance
                const walStart = performance.now();
                await walConnection.transaction(async (tx) => {
                    for (const record of testData) {
                        await tx.query('INSERT INTO test_table VALUES (?, ?)', [record.id, record.data]);
                    }
                });
                const walTime = performance.now() - walStart;
                const improvement = journalTime / walTime;
                expect(improvement).toBeGreaterThan(2.0); // 2x improvement minimum
                expect(walTime).toBeLessThan(500); // Absolute performance requirement
                // Clean up
                await walConnection.close();
                await journalConnection.close();
            });
        });
        describe('GREEN Phase: Basic optimization implementation', () => {
            test('should apply database optimizations correctly', async () => {
                // GREEN: Basic optimization application
                const { SQLiteOptimizer } = require('../../gemini-flow/src/memory/sqlite-optimizer');
                const optimizer = new SQLiteOptimizer();
                const connection = await optimizer.createOptimizedConnection(':memory:', {
                    enableWAL: true,
                    enableOptimizations: true
                });
                const appliedOptimizations = connection.getAppliedOptimizations();
                expect(appliedOptimizations).toContain('wal_mode');
                expect(appliedOptimizations).toContain('normal_synchronous');
                expect(appliedOptimizations).toContain('memory_temp_store');
                expect(appliedOptimizations).toContain('increased_cache_size');
            });
        });
        describe('REFACTOR Phase: Advanced performance features', () => {
            test('should provide automatic performance analysis and recommendations', async () => {
                // REFACTOR: Intelligent performance optimization
                const { SQLiteOptimizer } = require('../../gemini-flow/src/memory/sqlite-optimizer');
                const optimizer = new SQLiteOptimizer();
                const connection = await optimizer.createOptimizedConnection(':memory:');
                // Simulate some database operations for analysis
                await connection.query('CREATE TABLE test (id INTEGER, data TEXT)');
                for (let i = 0; i < 1000; i++) {
                    await connection.query('INSERT INTO test VALUES (?, ?)', [i, `data-${i}`]);
                }
                const analysis = await optimizer.analyzePerformance(connection);
                expect(analysis).toHaveProperty('queryPerformance');
                expect(analysis).toHaveProperty('indexRecommendations');
                expect(analysis).toHaveProperty('optimizationScore');
                expect(analysis).toHaveProperty('bottlenecks');
                expect(analysis.optimizationScore).toBeGreaterThan(0);
                expect(analysis.optimizationScore).toBeLessThanOrEqual(100);
                expect(Array.isArray(analysis.indexRecommendations)).toBe(true);
                expect(Array.isArray(analysis.bottlenecks)).toBe(true);
            });
            test('should auto-create optimal indexes based on query patterns', async () => {
                // REFACTOR: Intelligent index creation
                const { SQLiteOptimizer } = require('../../gemini-flow/src/memory/sqlite-optimizer');
                const optimizer = new SQLiteOptimizer();
                const connection = await optimizer.createOptimizedConnection(':memory:');
                // Create test table
                await connection.query(`
          CREATE TABLE user_events (
            id INTEGER PRIMARY KEY,
            user_id INTEGER,
            event_type TEXT,
            timestamp INTEGER,
            data TEXT
          )
        `);
                // Simulate query patterns
                const queryPatterns = [
                    'SELECT * FROM user_events WHERE user_id = ? AND event_type = ?',
                    'SELECT * FROM user_events WHERE timestamp > ? ORDER BY timestamp',
                    'SELECT COUNT(*) FROM user_events WHERE user_id = ? AND timestamp > ?'
                ];
                // Analyze patterns and create optimal indexes
                const indexRecommendations = await optimizer.analyzeQueryPatterns(queryPatterns);
                await optimizer.createOptimalIndexes(connection, 'user_events', indexRecommendations);
                const indexes = await connection.query(`
          SELECT name, sql FROM sqlite_master 
          WHERE type = 'index' AND tbl_name = 'user_events'
        `);
                expect(indexes.length).toBeGreaterThan(0);
                // Should include composite index for user_id + event_type
                const compositeIndex = indexes.find(idx => idx.sql && idx.sql.includes('user_id') && idx.sql.includes('event_type'));
                expect(compositeIndex).toBeDefined();
                // Should include index for timestamp
                const timestampIndex = indexes.find(idx => idx.sql && idx.sql.includes('timestamp'));
                expect(timestampIndex).toBeDefined();
            });
        });
    });
    describe('Edge Cases & Error Handling (TDD)', () => {
        test('should handle database corruption gracefully', async () => {
            // Test corruption detection and recovery
            const { createResilientConnection } = require('../../gemini-flow/src/memory/sqlite-resilient-connection');
            const connection = await createResilientConnection('test-corruption.db', {
                autoRepair: true,
                backupOnCorruption: true
            });
            // Simulate corruption
            jest.spyOn(connection, 'query').mockRejectedValueOnce(new Error('database disk image is malformed'));
            // Should attempt recovery
            const result = await connection.query('SELECT 1');
            expect(result).toBeDefined();
            expect(connection.getRecoveryAttempts()).toBe(1);
            expect(connection.isRecovered()).toBe(true);
        });
        test('should handle concurrent access without deadlocks', async () => {
            // Test concurrent operations
            const { SQLiteConnectionPool } = require('../../gemini-flow/src/memory/sqlite-connection-pool');
            const pool = new SQLiteConnectionPool({
                maxConnections: 5,
                dbPath: ':memory:'
            });
            // Create test table
            const setupConn = await pool.acquire();
            await setupConn.query('CREATE TABLE concurrent_test (id INTEGER, value TEXT)');
            await pool.release(setupConn);
            // Perform concurrent operations
            const concurrentOperations = Array.from({ length: 20 }, (_, i) => (async () => {
                const conn = await pool.acquire();
                try {
                    await conn.transaction(async (tx) => {
                        await tx.query('INSERT INTO concurrent_test VALUES (?, ?)', [i, `value-${i}`]);
                        await tx.query('UPDATE concurrent_test SET value = ? WHERE id = ?', [`updated-${i}`, i]);
                    });
                }
                finally {
                    await pool.release(conn);
                }
            })());
            // All operations should complete without deadlocks
            await expect(Promise.all(concurrentOperations)).resolves.not.toThrow();
            // Verify data integrity
            const verifyConn = await pool.acquire();
            const results = await verifyConn.query('SELECT COUNT(*) as count FROM concurrent_test');
            expect(results[0].count).toBe(20);
            await pool.release(verifyConn);
        });
    });
});
// Helper functions for test data generation
function generateTestData(count) {
    return Array.from({ length: count }, (_, i) => ({
        id: i,
        category: `category_${i % 10}`,
        value: Math.floor(Math.random() * 1000),
        data: JSON.stringify({ index: i, random: Math.random() }),
        created_at: new Date(Date.now() - Math.random() * 86400000).toISOString()
    }));
}
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
export {};
//# sourceMappingURL=sqlite-connection-wrapper.test.js.map