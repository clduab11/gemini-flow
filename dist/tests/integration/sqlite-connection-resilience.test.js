/**
 * SQLite Connection Resilience - Integration Tests
 *
 * Tests connection pooling, auto-reconnect, and transaction coordination
 * across multiple SQLite implementations with real failure scenarios
 */
const { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } = require('@jest/globals');
const { performance } = require('perf_hooks');
const fs = require('fs/promises');
const path = require('path');
describe('SQLite Connection Resilience - Integration Tests', () => {
    let testDbDir;
    let connectionPool;
    let networkSimulator;
    beforeAll(async () => {
        // Create temporary directory for test databases
        testDbDir = path.join(__dirname, '../temp/integration-tests');
        await fs.mkdir(testDbDir, { recursive: true });
    });
    afterAll(async () => {
        // Cleanup test databases
        try {
            await fs.rm(testDbDir, { recursive: true });
        }
        catch (error) {
            // Ignore cleanup errors
        }
    });
    beforeEach(async () => {
        // Initialize fresh connection pool for each test
        const { SQLiteConnectionPool } = require('../../gemini-flow/src/memory/sqlite-connection-pool');
        connectionPool = new SQLiteConnectionPool({
            maxConnections: 10,
            idleTimeout: 5000,
            acquireTimeout: 2000,
            healthCheckInterval: 1000,
            autoReconnect: true,
            maxRetries: 3,
            retryDelay: 100,
            dbPath: path.join(testDbDir, `test-${Date.now()}.db`)
        });
        await connectionPool.initialize();
        // Setup test tables
        const setupConn = await connectionPool.acquire();
        await setupConn.query(`
      CREATE TABLE IF NOT EXISTS test_data (
        id INTEGER PRIMARY KEY,
        data TEXT NOT NULL,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      )
    `);
        await setupConn.query(`
      CREATE TABLE IF NOT EXISTS coordination_test (
        agent_id TEXT,
        task_id TEXT,
        status TEXT,
        payload TEXT,
        updated_at INTEGER DEFAULT (strftime('%s', 'now')),
        PRIMARY KEY (agent_id, task_id)
      )
    `);
        await connectionPool.release(setupConn);
    });
    afterEach(async () => {
        if (connectionPool) {
            await connectionPool.destroy();
        }
    });
    describe('Connection Pool Management', () => {
        test('should manage connection lifecycle correctly', async () => {
            const initialStats = connectionPool.getStatistics();
            expect(initialStats.currentActive).toBe(0);
            expect(initialStats.currentIdle).toBe(0);
            // Acquire multiple connections
            const connections = [];
            for (let i = 0; i < 5; i++) {
                const conn = await connectionPool.acquire();
                connections.push(conn);
                // Verify each connection is functional
                const result = await conn.query('SELECT ? as test_value', [`test-${i}`]);
                expect(result[0].test_value).toBe(`test-${i}`);
            }
            const activeStats = connectionPool.getStatistics();
            expect(activeStats.currentActive).toBe(5);
            expect(activeStats.currentIdle).toBe(0);
            // Release connections back to pool
            for (const conn of connections) {
                await connectionPool.release(conn);
            }
            const releasedStats = connectionPool.getStatistics();
            expect(releasedStats.currentActive).toBe(0);
            expect(releasedStats.currentIdle).toBe(5);
            // Reuse released connections
            const reusedConn = await connectionPool.acquire();
            expect(connections).toContain(reusedConn); // Should reuse existing connection
            await connectionPool.release(reusedConn);
        });
        test('should enforce connection limits and handle timeouts', async () => {
            const maxConnections = connectionPool.maxConnections;
            const connections = [];
            // Acquire all available connections
            for (let i = 0; i < maxConnections; i++) {
                const conn = await connectionPool.acquire();
                connections.push(conn);
            }
            expect(connectionPool.getStatistics().currentActive).toBe(maxConnections);
            // Next acquisition should timeout
            const start = performance.now();
            await expect(connectionPool.acquire()).rejects.toThrow('Connection acquire timeout');
            const duration = performance.now() - start;
            expect(duration).toBeGreaterThan(connectionPool.acquireTimeout - 100);
            expect(duration).toBeLessThan(connectionPool.acquireTimeout + 200);
            // Release one connection and try again
            await connectionPool.release(connections.pop());
            const newConn = await connectionPool.acquire();
            expect(newConn).toBeDefined();
            // Cleanup
            connections.push(newConn);
            await Promise.all(connections.map(conn => connectionPool.release(conn)));
        });
        test('should handle connection health monitoring and replacement', async () => {
            const connection = await connectionPool.acquire();
            // Simulate connection health check failure
            const originalPing = connection.ping;
            connection.ping = jest.fn().mockResolvedValue(false);
            await connectionPool.release(connection);
            // Wait for health check cycle
            await new Promise(resolve => setTimeout(resolve, connectionPool.healthCheckInterval + 100));
            // Unhealthy connection should be removed from pool
            const stats = connectionPool.getStatistics();
            expect(stats.currentIdle).toBe(0);
            expect(stats.replacedConnections).toBeGreaterThan(0);
            // New acquisition should create a fresh connection
            const newConnection = await connectionPool.acquire();
            expect(newConnection).not.toBe(connection);
            expect(newConnection.ping).not.toBe(connection.ping); // Different instance
            await connectionPool.release(newConnection);
        });
    });
    describe('Auto-Reconnect Functionality', () => {
        test('should detect connection loss and auto-reconnect', async () => {
            const { createResilientConnection } = require('../../gemini-flow/src/memory/sqlite-resilient-connection');
            const connection = await createResilientConnection(path.join(testDbDir, 'auto-reconnect-test.db'), {
                autoReconnect: true,
                maxRetries: 3,
                retryDelay: 50
            });
            // Verify initial connection
            await connection.query('CREATE TABLE reconnect_test (id INTEGER, data TEXT)');
            await connection.query('INSERT INTO reconnect_test VALUES (1, "initial")');
            // Simulate connection loss
            await connection._simulateConnectionLoss();
            expect(connection.isConnected()).toBe(false);
            // Next query should trigger auto-reconnect
            const reconnectEvents = [];
            connection.on('reconnecting', (attempt) => reconnectEvents.push({ type: 'reconnecting', attempt }));
            connection.on('reconnected', () => reconnectEvents.push({ type: 'reconnected' }));
            const start = performance.now();
            const result = await connection.query('SELECT * FROM reconnect_test WHERE id = 1');
            const duration = performance.now() - start;
            // Should have reconnected and executed query
            expect(result[0].data).toBe('initial');
            expect(connection.isConnected()).toBe(true);
            expect(connection.getReconnectCount()).toBe(1);
            // Should have emitted reconnection events
            expect(reconnectEvents).toContainEqual({ type: 'reconnecting', attempt: 1 });
            expect(reconnectEvents).toContainEqual({ type: 'reconnected' });
            // Should complete reasonably quickly (including reconnect overhead)
            expect(duration).toBeLessThan(1000);
            await connection.close();
        });
        test('should implement exponential backoff for retry attempts', async () => {
            const { createResilientConnection } = require('../../gemini-flow/src/memory/sqlite-resilient-connection');
            const connection = await createResilientConnection(path.join(testDbDir, 'backoff-test.db'), {
                autoReconnect: true,
                maxRetries: 4,
                retryDelay: 100,
                backoffMultiplier: 2
            });
            // Mock connection to fail first 3 attempts, succeed on 4th
            let attempts = 0;
            const originalConnect = connection._connect.bind(connection);
            connection._connect = jest.fn().mockImplementation(() => {
                attempts++;
                if (attempts < 4) {
                    throw new Error(`Connection attempt ${attempts} failed`);
                }
                return originalConnect();
            });
            const retryTiming = [];
            connection.on('reconnecting', (attempt, delay) => {
                retryTiming.push({ attempt, delay, timestamp: Date.now() });
            });
            const start = performance.now();
            await connection.query('SELECT 1');
            const totalDuration = performance.now() - start;
            expect(attempts).toBe(4);
            expect(connection.isConnected()).toBe(true);
            // Verify exponential backoff timing
            expect(retryTiming).toHaveLength(4);
            expect(retryTiming[0].delay).toBe(100); // 100ms
            expect(retryTiming[1].delay).toBe(200); // 200ms
            expect(retryTiming[2].delay).toBe(400); // 400ms
            expect(retryTiming[3].delay).toBe(800); // 800ms
            // Total time should account for all delays
            expect(totalDuration).toBeGreaterThan(1400); // Sum of delays + execution time
            await connection.close();
        });
        test('should fail after maximum retry attempts', async () => {
            const { createResilientConnection } = require('../../gemini-flow/src/memory/sqlite-resilient-connection');
            const connection = await createResilientConnection(path.join(testDbDir, 'fail-test.db'), {
                autoReconnect: true,
                maxRetries: 2,
                retryDelay: 50
            });
            // Mock connection to always fail
            connection._connect = jest.fn().mockRejectedValue(new Error('Persistent connection failure'));
            // Simulate connection loss
            await connection._simulateConnectionLoss();
            const failureEvents = [];
            connection.on('reconnect-failed', (attempts, error) => {
                failureEvents.push({ attempts, error: error.message });
            });
            // Should fail after max retries
            await expect(connection.query('SELECT 1')).rejects.toThrow('Max reconnection attempts exceeded');
            expect(connection._connect).toHaveBeenCalledTimes(2); // maxRetries
            expect(failureEvents).toHaveLength(1);
            expect(failureEvents[0].attempts).toBe(2);
            expect(connection.isConnected()).toBe(false);
            await connection.close();
        });
    });
    describe('Transaction Coordination Across Failures', () => {
        test('should handle transaction rollback on connection failure', async () => {
            const connection = await connectionPool.acquire();
            // Start transaction
            const transaction = await connection.beginTransaction();
            // Insert test data
            await transaction.query('INSERT INTO test_data (data) VALUES (?)', ['transaction-test-1']);
            await transaction.query('INSERT INTO test_data (data) VALUES (?)', ['transaction-test-2']);
            // Simulate connection failure before commit
            await connection._simulateConnectionLoss();
            // Transaction should be rolled back automatically
            await expect(transaction.commit()).rejects.toThrow();
            await connectionPool.release(connection);
            // Verify data was not committed
            const verifyConn = await connectionPool.acquire();
            const results = await verifyConn.query('SELECT COUNT(*) as count FROM test_data WHERE data LIKE "transaction-test%"');
            expect(results[0].count).toBe(0);
            await connectionPool.release(verifyConn);
        });
        test('should handle distributed transactions across multiple connections', async () => {
            const connections = [];
            for (let i = 0; i < 3; i++) {
                connections.push(await connectionPool.acquire());
            }
            const { DistributedTransaction } = require('../../gemini-flow/src/memory/sqlite-distributed-transaction');
            const distributedTx = new DistributedTransaction({
                connections,
                timeout: 5000,
                isolationLevel: 'SERIALIZABLE'
            });
            await distributedTx.begin();
            try {
                // Each connection performs operations within the distributed transaction
                await connections[0].query('INSERT INTO coordination_test VALUES (?, ?, ?, ?)', ['agent-1', 'task-1', 'in_progress', JSON.stringify({ step: 1 })]);
                await connections[1].query('INSERT INTO coordination_test VALUES (?, ?, ?, ?)', ['agent-2', 'task-1', 'coordinating', JSON.stringify({ step: 2 })]);
                await connections[2].query('INSERT INTO coordination_test VALUES (?, ?, ?, ?)', ['agent-3', 'task-1', 'waiting', JSON.stringify({ step: 3 })]);
                // Commit distributed transaction
                await distributedTx.commit();
                // Verify all operations were committed atomically
                const verifyConn = await connectionPool.acquire();
                const results = await verifyConn.query('SELECT COUNT(*) as count FROM coordination_test WHERE task_id = ?', ['task-1']);
                expect(results[0].count).toBe(3);
                await connectionPool.release(verifyConn);
            }
            catch (error) {
                await distributedTx.rollback();
                throw error;
            }
            finally {
                for (const conn of connections) {
                    await connectionPool.release(conn);
                }
            }
        });
        test('should handle transaction recovery after reconnection', async () => {
            const { createResilientConnection } = require('../../gemini-flow/src/memory/sqlite-resilient-connection');
            const connection = await createResilientConnection(path.join(testDbDir, 'transaction-recovery.db'), {
                autoReconnect: true,
                transactionRecovery: true,
                maxRetries: 2
            });
            // Initialize test table
            await connection.query('CREATE TABLE recovery_test (id INTEGER PRIMARY KEY, data TEXT, status TEXT)');
            // Start recoverable transaction
            const recoverableTransaction = await connection.beginRecoverableTransaction('tx-recovery-test');
            await recoverableTransaction.query('INSERT INTO recovery_test (data, status) VALUES (?, ?)', ['data-1', 'pending']);
            await recoverableTransaction.query('INSERT INTO recovery_test (data, status) VALUES (?, ?)', ['data-2', 'pending']);
            // Save transaction state
            await recoverableTransaction.saveCheckpoint();
            // Simulate connection failure
            await connection._simulateConnectionLoss();
            // Transaction should be recovered after reconnection
            const recoveryEvents = [];
            connection.on('transaction-recovered', (txId) => recoveryEvents.push(txId));
            // Continue transaction after recovery
            await recoverableTransaction.query('UPDATE recovery_test SET status = ? WHERE status = ?', ['completed', 'pending']);
            await recoverableTransaction.commit();
            // Verify transaction was recovered and completed
            expect(recoveryEvents).toContain('tx-recovery-test');
            const results = await connection.query('SELECT COUNT(*) as count FROM recovery_test WHERE status = ?', ['completed']);
            expect(results[0].count).toBe(2);
            await connection.close();
        });
    });
    describe('Concurrent Access and Deadlock Prevention', () => {
        test('should handle high concurrency without deadlocks', async () => {
            const concurrentOperations = 50;
            const operationsPerConcurrent = 10;
            const operations = Array.from({ length: concurrentOperations }, (_, i) => (async () => {
                const conn = await connectionPool.acquire();
                const operationResults = [];
                try {
                    for (let j = 0; j < operationsPerConcurrent; j++) {
                        const result = await conn.transaction(async (tx) => {
                            // Insert data
                            await tx.query('INSERT INTO test_data (data) VALUES (?)', [`concurrent-${i}-${j}`]);
                            // Update data
                            const updateResult = await tx.query('UPDATE test_data SET data = ? WHERE data = ?', [`updated-${i}-${j}`, `concurrent-${i}-${j}`]);
                            // Read data back
                            const readResult = await tx.query('SELECT id FROM test_data WHERE data = ?', [`updated-${i}-${j}`]);
                            return readResult[0].id;
                        });
                        operationResults.push(result);
                    }
                }
                finally {
                    await connectionPool.release(conn);
                }
                return operationResults;
            })());
            // All operations should complete without deadlocks or timeouts
            const results = await Promise.all(operations);
            expect(results).toHaveLength(concurrentOperations);
            expect(results.every(result => result.length === operationsPerConcurrent)).toBe(true);
            // Verify total data count
            const verifyConn = await connectionPool.acquire();
            const totalCount = await verifyConn.query('SELECT COUNT(*) as count FROM test_data WHERE data LIKE "updated-%"');
            expect(totalCount[0].count).toBe(concurrentOperations * operationsPerConcurrent);
            await connectionPool.release(verifyConn);
        });
        test('should detect and resolve potential deadlock situations', async () => {
            const { DeadlockDetector } = require('../../gemini-flow/src/memory/sqlite-deadlock-detector');
            const detector = new DeadlockDetector({
                detectionInterval: 100,
                timeoutThreshold: 1000
            });
            await detector.attachToPool(connectionPool);
            // Create scenario prone to deadlocks
            const conn1 = await connectionPool.acquire();
            const conn2 = await connectionPool.acquire();
            const deadlockEvents = [];
            detector.on('deadlock-detected', (info) => deadlockEvents.push(info));
            detector.on('deadlock-resolved', (info) => deadlockEvents.push(info));
            try {
                // Start conflicting transactions
                const tx1Promise = conn1.transaction(async (tx) => {
                    await tx.query('INSERT INTO test_data (id, data) VALUES (?, ?)', [1001, 'tx1-data']);
                    // Delay to increase chance of conflict
                    await new Promise(resolve => setTimeout(resolve, 100));
                    // Try to access resource that tx2 might be holding
                    await tx.query('INSERT INTO test_data (id, data) VALUES (?, ?)', [1002, 'tx1-data-2']);
                });
                const tx2Promise = conn2.transaction(async (tx) => {
                    await tx.query('INSERT INTO test_data (id, data) VALUES (?, ?)', [1002, 'tx2-data']);
                    // Delay to increase chance of conflict
                    await new Promise(resolve => setTimeout(resolve, 100));
                    // Try to access resource that tx1 might be holding
                    await tx.query('INSERT INTO test_data (id, data) VALUES (?, ?)', [1001, 'tx2-data-2']);
                });
                // One should succeed, one should be resolved by deadlock detector
                const results = await Promise.allSettled([tx1Promise, tx2Promise]);
                const successful = results.filter(r => r.status === 'fulfilled').length;
                const failed = results.filter(r => r.status === 'rejected').length;
                expect(successful).toBe(1);
                expect(failed).toBe(1);
                // Deadlock should have been detected and resolved
                expect(deadlockEvents.some(e => e.type === 'deadlock-detected')).toBe(true);
            }
            finally {
                await connectionPool.release(conn1);
                await connectionPool.release(conn2);
                await detector.detach();
            }
        });
    });
    describe('Cross-Platform Compatibility', () => {
        test('should work consistently across SQLite implementations', async () => {
            const implementations = ['better-sqlite3', 'sqlite3', 'sql.js'];
            const results = {};
            for (const impl of implementations) {
                try {
                    const { SQLiteConnectionPool } = require('../../gemini-flow/src/memory/sqlite-connection-pool');
                    const pool = new SQLiteConnectionPool({
                        maxConnections: 3,
                        preferredImplementation: impl,
                        dbPath: path.join(testDbDir, `compatibility-${impl}.db`)
                    });
                    await pool.initialize();
                    const conn = await pool.acquire();
                    // Test basic operations
                    await conn.query('CREATE TABLE compat_test (id INTEGER, data TEXT)');
                    await conn.query('INSERT INTO compat_test VALUES (1, ?)', [`test-${impl}`]);
                    const result = await conn.query('SELECT data FROM compat_test WHERE id = 1');
                    await pool.release(conn);
                    await pool.destroy();
                    results[impl] = {
                        success: true,
                        data: result[0].data,
                        implementation: conn.getImplementation()
                    };
                }
                catch (error) {
                    results[impl] = {
                        success: false,
                        error: error.message
                    };
                }
            }
            // At least sql.js should always work (WASM fallback)
            expect(results['sql.js'].success).toBe(true);
            expect(results['sql.js'].data).toBe('test-sql.js');
            // If other implementations are available, they should also work consistently
            Object.entries(results).forEach(([impl, result]) => {
                if (result.success) {
                    expect(result.data).toBe(`test-${impl}`);
                }
            });
        });
    });
});
// Test utility classes and functions
class NetworkSimulator {
    static simulateConnectionLoss(connection, duration = 1000) {
        return new Promise((resolve) => {
            const originalQuery = connection.query;
            connection.query = () => Promise.reject(new Error('Connection lost'));
            setTimeout(() => {
                connection.query = originalQuery;
                resolve();
            }, duration);
        });
    }
    static simulateSlowNetwork(connection, latency = 500) {
        const originalQuery = connection.query;
        connection.query = async (...args) => {
            await new Promise(resolve => setTimeout(resolve, latency));
            return originalQuery.apply(connection, args);
        };
    }
}
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
export {};
//# sourceMappingURL=sqlite-connection-resilience.test.js.map