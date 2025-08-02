import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { SQLiteConnectionPool } from '../../src/memory/sqlite-connection-pool';
import { performance } from 'perf_hooks';
import { existsSync, unlinkSync } from 'fs';

describe('SQLite Connection Pool Integration Tests', () => {
  let pool: SQLiteConnectionPool;
  const TEST_DB = '.swarm/test-pool.db';
  
  beforeEach(async () => {
    // Clean up any existing test database
    if (existsSync(TEST_DB)) {
      unlinkSync(TEST_DB);
    }
  });

  afterEach(async () => {
    if (pool) {
      await pool.close();
    }
    // Clean up test database
    if (existsSync(TEST_DB)) {
      unlinkSync(TEST_DB);
    }
  });

  describe('Basic Connection Pooling', () => {
    it('should create pool with correct tier configuration', async () => {
      pool = new SQLiteConnectionPool(TEST_DB, 'pro');
      await pool.initialize();
      
      const stats = pool.getStats();
      expect(stats.tier).toBe('pro');
      expect(stats.maxConnections).toBe(20); // Pro tier gets 20 connections
      expect(stats.activeConnections).toBeGreaterThanOrEqual(5); // Min connections
    });

    it('should handle different tier configurations', async () => {
      // Test free tier
      const freePool = new SQLiteConnectionPool(TEST_DB, 'free');
      await freePool.initialize();
      expect(freePool.getStats().maxConnections).toBe(5);
      await freePool.close();

      // Test enterprise tier
      const enterprisePool = new SQLiteConnectionPool(TEST_DB, 'enterprise');
      await enterprisePool.initialize();
      expect(enterprisePool.getStats().maxConnections).toBe(50);
      await enterprisePool.close();
    });

    it('should execute queries through connection pool', async () => {
      pool = new SQLiteConnectionPool(TEST_DB, 'pro');
      await pool.initialize();

      const result = await pool.execute('SELECT 1 + 1 as result');
      expect(result).toEqual([{ result: 2 }]);
    });
  });

  describe('Concurrent Access', () => {
    it('should handle multiple concurrent queries', async () => {
      pool = new SQLiteConnectionPool(TEST_DB, 'pro');
      await pool.initialize();

      // Create a test table
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS test_data (
          id INTEGER PRIMARY KEY,
          value TEXT,
          timestamp INTEGER
        )
      `);

      // Execute 100 concurrent inserts
      const insertPromises = [];
      for (let i = 0; i < 100; i++) {
        insertPromises.push(
          pool.execute(
            'INSERT INTO test_data (value, timestamp) VALUES (?, ?)',
            [`test-${i}`, Date.now()]
          )
        );
      }

      await Promise.all(insertPromises);

      // Verify all inserts succeeded
      const count = await pool.execute('SELECT COUNT(*) as count FROM test_data');
      expect(count[0].count).toBe(100);
    });

    it('should handle mixed read/write operations', async () => {
      pool = new SQLiteConnectionPool(TEST_DB, 'enterprise');
      await pool.initialize();

      // Create and populate test table
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS metrics (
          id INTEGER PRIMARY KEY,
          metric TEXT,
          value REAL,
          timestamp INTEGER
        )
      `);

      // Initial data
      for (let i = 0; i < 50; i++) {
        await pool.execute(
          'INSERT INTO metrics (metric, value, timestamp) VALUES (?, ?, ?)',
          [`metric-${i}`, Math.random() * 100, Date.now()]
        );
      }

      // Concurrent mixed operations
      const operations = [];
      
      // Reads
      for (let i = 0; i < 50; i++) {
        operations.push(
          pool.execute('SELECT * FROM metrics WHERE metric = ?', [`metric-${i}`])
        );
      }
      
      // Writes
      for (let i = 50; i < 100; i++) {
        operations.push(
          pool.execute(
            'INSERT INTO metrics (metric, value, timestamp) VALUES (?, ?, ?)',
            [`metric-${i}`, Math.random() * 100, Date.now()]
          )
        );
      }
      
      // Updates
      for (let i = 0; i < 25; i++) {
        operations.push(
          pool.execute(
            'UPDATE metrics SET value = ? WHERE metric = ?',
            [Math.random() * 100, `metric-${i}`]
          )
        );
      }

      const start = performance.now();
      await Promise.all(operations);
      const elapsed = performance.now() - start;

      console.log(`Mixed operations completed in ${elapsed.toFixed(2)}ms`);
      
      // Verify final count
      const finalCount = await pool.execute('SELECT COUNT(*) as count FROM metrics');
      expect(finalCount[0].count).toBe(100);
    });
  });

  describe('Connection Management', () => {
    it('should reuse connections efficiently', async () => {
      pool = new SQLiteConnectionPool(TEST_DB, 'pro');
      await pool.initialize();

      const initialStats = pool.getStats();
      const initialActive = initialStats.activeConnections;

      // Execute many queries in sequence
      for (let i = 0; i < 50; i++) {
        await pool.execute('SELECT ? as num', [i]);
      }

      const afterStats = pool.getStats();
      // Should not create too many additional connections
      expect(afterStats.activeConnections).toBeLessThanOrEqual(initialActive + 5);
      expect(afterStats.totalQueries).toBe(50);
    });

    it('should handle connection limits', async () => {
      pool = new SQLiteConnectionPool(TEST_DB, 'free'); // Limited to 5 connections
      await pool.initialize();

      // Try to execute more concurrent queries than connection limit
      const queries = [];
      for (let i = 0; i < 20; i++) {
        queries.push(
          pool.execute('SELECT ? as num', [i])
        );
      }

      // Should queue and complete all queries despite connection limit
      const results = await Promise.all(queries);
      expect(results).toHaveLength(20);
      
      const stats = pool.getStats();
      expect(stats.activeConnections).toBeLessThanOrEqual(5);
      expect(stats.peakConnections).toBe(5);
    });
  });

  describe('Error Handling', () => {
    it('should handle SQL errors gracefully', async () => {
      pool = new SQLiteConnectionPool(TEST_DB, 'pro');
      await pool.initialize();

      // Try invalid SQL
      await expect(
        pool.execute('SELECT * FROM non_existent_table')
      ).rejects.toThrow();

      // Pool should still be functional
      const result = await pool.execute('SELECT 1 as test');
      expect(result[0].test).toBe(1);
    });

    it('should handle connection failures', async () => {
      pool = new SQLiteConnectionPool('/invalid/path/test.db', 'pro');
      
      // Should throw on initialization with invalid path
      await expect(pool.initialize()).rejects.toThrow();
    });
  });

  describe('Performance Characteristics', () => {
    it('should demonstrate WAL mode benefits', async () => {
      pool = new SQLiteConnectionPool(TEST_DB, 'enterprise');
      await pool.initialize();

      // Create test table
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS perf_test (
          id INTEGER PRIMARY KEY,
          data TEXT,
          created_at INTEGER
        )
      `);

      // Measure write performance
      const writeStart = performance.now();
      const writePromises = [];
      
      for (let i = 0; i < 1000; i++) {
        writePromises.push(
          pool.execute(
            'INSERT INTO perf_test (data, created_at) VALUES (?, ?)',
            [`data-${i}`, Date.now()]
          )
        );
      }
      
      await Promise.all(writePromises);
      const writeTime = performance.now() - writeStart;
      const writesPerSecond = 1000 / (writeTime / 1000);

      console.log(`Write performance: ${writesPerSecond.toFixed(0)} writes/second`);
      expect(writesPerSecond).toBeGreaterThan(100); // Should handle >100 writes/sec

      // Measure read performance
      const readStart = performance.now();
      const readPromises = [];
      
      for (let i = 0; i < 1000; i++) {
        readPromises.push(
          pool.execute('SELECT * FROM perf_test WHERE id = ?', [i + 1])
        );
      }
      
      await Promise.all(readPromises);
      const readTime = performance.now() - readStart;
      const readsPerSecond = 1000 / (readTime / 1000);

      console.log(`Read performance: ${readsPerSecond.toFixed(0)} reads/second`);
      expect(readsPerSecond).toBeGreaterThan(1000); // Should handle >1000 reads/sec
    });
  });

  describe('Transaction Support', () => {
    it('should handle transactions correctly', async () => {
      pool = new SQLiteConnectionPool(TEST_DB, 'pro');
      await pool.initialize();

      // Create test table
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS accounts (
          id INTEGER PRIMARY KEY,
          balance REAL
        )
      `);

      // Insert initial data
      await pool.execute('INSERT INTO accounts (id, balance) VALUES (1, 1000)');
      await pool.execute('INSERT INTO accounts (id, balance) VALUES (2, 500)');

      // Execute transaction
      try {
        await pool.execute('BEGIN TRANSACTION');
        
        // Transfer money
        await pool.execute('UPDATE accounts SET balance = balance - 100 WHERE id = 1');
        await pool.execute('UPDATE accounts SET balance = balance + 100 WHERE id = 2');
        
        await pool.execute('COMMIT');
      } catch (error) {
        await pool.execute('ROLLBACK');
        throw error;
      }

      // Verify results
      const account1 = await pool.execute('SELECT balance FROM accounts WHERE id = 1');
      const account2 = await pool.execute('SELECT balance FROM accounts WHERE id = 2');
      
      expect(account1[0].balance).toBe(900);
      expect(account2[0].balance).toBe(600);
    });
  });

  describe('Memory Management', () => {
    it('should not leak connections', async () => {
      pool = new SQLiteConnectionPool(TEST_DB, 'pro');
      await pool.initialize();

      const initialMemory = process.memoryUsage().heapUsed;
      
      // Execute many operations
      for (let batch = 0; batch < 10; batch++) {
        const promises = [];
        for (let i = 0; i < 100; i++) {
          promises.push(
            pool.execute('SELECT ? * ? as result', [batch, i])
          );
        }
        await Promise.all(promises);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryGrowth = finalMemory - initialMemory;
      
      console.log(`Memory growth: ${(memoryGrowth / 1024 / 1024).toFixed(2)} MB`);
      
      // Memory growth should be reasonable (less than 50MB for 1000 operations)
      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024);
      
      const stats = pool.getStats();
      expect(stats.totalQueries).toBe(1000);
    });
  });
});