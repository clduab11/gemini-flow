# SQLite Connection Wrapper - TDD Strategy & Test Plan

## 🎯 Executive Summary

This document outlines a comprehensive Test-Driven Development (TDD) strategy for the SQLite connection wrapper in Gemini Flow. The strategy targets >95% test coverage with focus on connection pooling, auto-reconnect, WAL mode optimization, and cross-platform compatibility.

## 📊 Current Analysis Results

### Test Infrastructure Status ✅
- **Jest Configuration**: Dual setup with comprehensive coverage targets
  - Root level: 90%+ coverage thresholds for core components  
  - Gemini-flow package: 80%+ global, 95%+ for core modules
- **Test Categories**: 5 project configurations (unit, integration, performance, security, e2e)
- **Performance Monitoring**: Automated performance tracking and reporting

### SQLite Implementation Analysis ✅
- **Fallback Hierarchy**: better-sqlite3 → sqlite3 → sql.js
- **12 Specialized Tables**: Complete schema for swarm coordination
- **WAL Mode Support**: Performance optimization enabled
- **Cross-Platform**: Universal WASM compatibility via sql.js

## 🧪 TDD Test Strategy

### Test Pyramid Structure

```
         /\
        /E2E\      <- 10% (Cross-platform integration)
       /------\
      /Integr. \   <- 30% (Connection pooling, transactions)
     /----------\
    /   Unit     \ <- 60% (Adapter logic, fallback handling)
   /--------------\
```

## 🔄 TDD Implementation Phases

### Phase 1: SQLite Adapter Foundation (TDD Red-Green-Refactor)

#### 1.1 Connection Wrapper Unit Tests

**Test File**: `/tests/unit/sqlite-connection-wrapper.test.js`

```javascript
describe('SQLite Connection Wrapper - TDD Phase 1', () => {
  describe('Connection Factory', () => {
    it('should detect available SQLite implementations', async () => {
      // RED: Test fails - no implementation
      const detection = await detectSQLiteImplementations();
      
      expect(detection.available).toContain('sql.js'); // Always available
      expect(detection.recommended).toBeDefined();
      expect(detection.errors).toBeDefined();
    });

    it('should prioritize better-sqlite3 when available', async () => {
      // RED: Test fails - no priority logic
      jest.mock('better-sqlite3', () => mockBetterSQLite3);
      
      const db = await createSQLiteDatabase(':memory:');
      expect(db.name).toBe('better-sqlite3');
    });

    it('should fallback to sqlite3 when better-sqlite3 unavailable', async () => {
      // RED: Test fails - no fallback
      jest.mock('better-sqlite3', () => { throw new Error('Not available'); });
      jest.mock('sqlite3', () => mockSQLite3);
      
      const db = await createSQLiteDatabase(':memory:');
      expect(db.name).toBe('sqlite3');
    });

    it('should use sql.js as final fallback', async () => {
      // RED: Test fails - no final fallback
      jest.mock('better-sqlite3', () => { throw new Error('Not available'); });
      jest.mock('sqlite3', () => { throw new Error('Not available'); });
      
      const db = await createSQLiteDatabase(':memory:');
      expect(db.name).toBe('sql.js');
    });
  });
});
```

#### 1.2 Connection Pooling Tests

**Test File**: `/tests/unit/sqlite-connection-pool.test.js`

```javascript
describe('SQLite Connection Pool - TDD Phase 1', () => {
  let connectionPool;

  beforeEach(() => {
    connectionPool = new SQLiteConnectionPool({
      maxConnections: 10,
      idleTimeout: 30000,
      acquireTimeout: 5000
    });
  });

  describe('Pool Management', () => {
    it('should create connection pool with specified limits', async () => {
      // RED: No pool implementation
      expect(connectionPool.maxConnections).toBe(10);
      expect(connectionPool.activeConnections).toBe(0);
      expect(connectionPool.idleConnections).toBe(0);
    });

    it('should acquire connection from pool', async () => {
      // RED: No acquire method
      const connection = await connectionPool.acquire();
      
      expect(connection).toBeDefined();
      expect(connection.isActive()).toBe(true);
      expect(connectionPool.activeConnections).toBe(1);
    });

    it('should release connection back to pool', async () => {
      // RED: No release method
      const connection = await connectionPool.acquire();
      await connectionPool.release(connection);
      
      expect(connectionPool.activeConnections).toBe(0);
      expect(connectionPool.idleConnections).toBe(1);
    });

    it('should enforce maximum connection limit', async () => {
      // RED: No limit enforcement
      const connections = [];
      
      // Acquire all available connections
      for (let i = 0; i < 10; i++) {
        connections.push(await connectionPool.acquire());
      }
      
      // 11th connection should timeout
      await expect(
        connectionPool.acquire()
      ).rejects.toThrow('Connection acquire timeout');
    });
  });
});
```

### Phase 2: Auto-Reconnect & Resilience (TDD Red-Green-Refactor)

#### 2.1 Auto-Reconnect Tests

**Test File**: `/tests/unit/sqlite-auto-reconnect.test.js`

```javascript
describe('SQLite Auto-Reconnect - TDD Phase 2', () => {
  let connection;
  let mockDatabase;

  beforeEach(async () => {
    connection = await createResilientConnection(':memory:', {
      autoReconnect: true,
      maxRetries: 3,
      retryDelay: 100
    });
  });

  describe('Connection Resilience', () => {
    it('should detect connection loss', async () => {
      // RED: No connection monitoring
      // Simulate connection loss
      mockDatabase.close();
      
      const isConnected = await connection.ping();
      expect(isConnected).toBe(false);
      expect(connection.status).toBe('disconnected');
    });

    it('should automatically reconnect on query failure', async () => {
      // RED: No auto-reconnect logic
      // Simulate connection loss
      mockDatabase.close();
      
      // This should trigger auto-reconnect
      const result = await connection.query('SELECT 1');
      
      expect(result).toBeDefined();
      expect(connection.status).toBe('connected');
      expect(connection.reconnectCount).toBe(1);
    });

    it('should retry failed operations with exponential backoff', async () => {
      // RED: No retry mechanism
      let attempts = 0;
      const mockQuery = jest.fn()
        .mockImplementationOnce(() => { attempts++; throw new Error('Connection lost'); })
        .mockImplementationOnce(() => { attempts++; throw new Error('Connection lost'); })
        .mockImplementationOnce(() => { attempts++; return { rows: [{ test: 1 }] }; });

      connection.query = mockQuery;
      
      const start = Date.now();
      const result = await connection.query('SELECT 1');
      const duration = Date.now() - start;
      
      expect(attempts).toBe(3);
      expect(duration).toBeGreaterThan(300); // Exponential backoff delays
      expect(result.rows[0].test).toBe(1);
    });

    it('should emit reconnection events', async () => {
      // RED: No event system
      const events = [];
      connection.on('reconnecting', (attempt) => events.push({ type: 'reconnecting', attempt }));
      connection.on('reconnected', () => events.push({ type: 'reconnected' }));
      
      // Simulate connection loss and trigger reconnect
      mockDatabase.close();
      await connection.query('SELECT 1');
      
      expect(events).toContainEqual({ type: 'reconnecting', attempt: 1 });
      expect(events).toContainEqual({ type: 'reconnected' });
    });
  });
});
```

### Phase 3: WAL Mode & Performance Optimization (TDD Red-Green-Refactor)

#### 3.1 WAL Mode Performance Tests

**Test File**: `/tests/performance/sqlite-wal-optimization.test.js`

```javascript
describe('SQLite WAL Mode Performance - TDD Phase 3', () => {
  let walConnection;
  let journalConnection;

  beforeAll(async () => {
    walConnection = await createOptimizedConnection('test-wal.db', {
      journalMode: 'WAL',
      synchronous: 'NORMAL',
      cacheSize: 10000
    });
    
    journalConnection = await createOptimizedConnection('test-journal.db', {
      journalMode: 'DELETE',
      synchronous: 'FULL'
    });
  });

  describe('WAL Mode Optimization', () => {
    it('should enable WAL mode correctly', async () => {
      // RED: No WAL mode implementation
      const walMode = await walConnection.query('PRAGMA journal_mode');
      expect(walMode.rows[0].journal_mode).toBe('wal');
    });

    it('should achieve 2x+ performance improvement with WAL mode', async () => {
      // RED: No performance optimization
      const operations = 5000;
      const testData = generateTestData(operations);

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
      expect(improvement).toBeGreaterThan(2.0);
      expect(walTime).toBeLessThan(1000); // Absolute performance requirement
    });

    it('should handle concurrent reads without blocking', async () => {
      // RED: No concurrent read optimization
      const readOperations = Array(10).fill(null).map(async (_, i) => {
        const start = performance.now();
        const result = await walConnection.query('SELECT COUNT(*) FROM test_table WHERE id > ?', [i * 100]);
        return performance.now() - start;
      });

      const times = await Promise.all(readOperations);
      const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      
      expect(averageTime).toBeLessThan(50); // Concurrent reads should be fast
      expect(Math.max(...times)).toBeLessThan(100); // No single read should block significantly
    });
  });
});
```

### Phase 4: Integration & Swarm Coordination (TDD Red-Green-Refactor)

#### 4.1 Multi-Agent Coordination Tests

**Test File**: `/tests/integration/sqlite-swarm-coordination.test.js`

```javascript
describe('SQLite Swarm Coordination - TDD Phase 4', () => {
  let memoryManager;
  let swarmInstances;

  beforeEach(async () => {
    memoryManager = await SQLiteMemoryManager.create(':memory:');
    swarmInstances = [];
  });

  describe('Cross-Agent Memory Coordination', () => {
    it('should synchronize memory across multiple agent instances', async () => {
      // RED: No cross-agent synchronization
      // Create 5 simulated agents
      for (let i = 0; i < 5; i++) {
        const agent = new MockAgent(`agent-${i}`, memoryManager);
        swarmInstances.push(agent);
      }

      // Agent 0 stores coordination data
      await swarmInstances[0].storeMemory('coordination/task-123', {
        taskId: 'task-123',
        status: 'in_progress',
        assignedTo: 'agent-0',
        dependencies: ['task-122']
      });

      // Wait for synchronization
      await delay(100);

      // All other agents should have access to the data
      for (let i = 1; i < swarmInstances.length; i++) {
        const retrieved = await swarmInstances[i].retrieveMemory('coordination/task-123');
        expect(retrieved).toBeDefined();
        expect(retrieved.value.taskId).toBe('task-123');
        expect(retrieved.value.status).toBe('in_progress');
      }
    });

    it('should handle memory conflicts with CRDT resolution', async () => {
      // RED: No conflict resolution
      const conflictData = [
        { agent: 0, data: { version: 1, value: 'agent-0-data', timestamp: Date.now() } },
        { agent: 1, data: { version: 1, value: 'agent-1-data', timestamp: Date.now() + 10 } },
        { agent: 2, data: { version: 1, value: 'agent-2-data', timestamp: Date.now() + 5 } }
      ];

      // Concurrent writes from different agents
      await Promise.all(
        conflictData.map(({ agent, data }) =>
          swarmInstances[agent].storeMemory('conflict/key', data)
        )
      );

      await delay(200); // Allow CRDT resolution

      // All agents should converge to the same state (latest timestamp wins)
      const states = await Promise.all(
        swarmInstances.map(agent => agent.retrieveMemory('conflict/key'))
      );

      const uniqueStates = new Set(states.map(s => JSON.stringify(s.value)));
      expect(uniqueStates.size).toBe(1); // All states should be identical
      
      // Should resolve to agent-1-data (latest timestamp)
      expect(states[0].value.value).toBe('agent-1-data');
    });
  });

  describe('Transaction Coordination', () => {
    it('should handle distributed transactions across agents', async () => {
      // RED: No distributed transaction support
      const transactionId = 'tx-' + Date.now();
      
      // Start distributed transaction
      const transaction = await memoryManager.beginDistributedTransaction(transactionId, {
        participants: ['agent-0', 'agent-1', 'agent-2'],
        timeout: 5000
      });

      // Each agent performs operations within the transaction
      await Promise.all([
        swarmInstances[0].transactionalUpdate('agent-0-data', { value: 'data-0' }, transaction),
        swarmInstances[1].transactionalUpdate('agent-1-data', { value: 'data-1' }, transaction),
        swarmInstances[2].transactionalUpdate('agent-2-data', { value: 'data-2' }, transaction)
      ]);

      // Commit transaction
      await transaction.commit();

      // Verify all operations committed successfully
      const results = await Promise.all([
        memoryManager.retrieve('agent-0-data'),
        memoryManager.retrieve('agent-1-data'),
        memoryManager.retrieve('agent-2-data')
      ]);

      expect(results[0].value.value).toBe('data-0');
      expect(results[1].value.value).toBe('data-1');
      expect(results[2].value.value).toBe('data-2');
    });
  });
});
```

### Phase 5: Security & Edge Cases (TDD Red-Green-Refactor)

#### 5.1 SQL Injection Prevention Tests

**Test File**: `/tests/security/sqlite-injection-prevention.test.js`

```javascript
describe('SQLite Security - SQL Injection Prevention', () => {
  let secureConnection;

  beforeEach(async () => {
    secureConnection = await createSecureConnection(':memory:', {
      parameterizedOnly: true,
      inputValidation: true,
      queryTimeouts: true
    });
  });

  describe('Input Sanitization', () => {
    it('should prevent SQL injection in prepared statements', async () => {
      // RED: No injection prevention
      const maliciousInput = "'; DROP TABLE agents; SELECT '1";
      
      // This should be safely parameterized
      const result = await secureConnection.query(
        'SELECT * FROM agents WHERE name = ?',
        [maliciousInput]
      );

      // Table should still exist
      const tableCheck = await secureConnection.query(
        'SELECT name FROM sqlite_master WHERE type="table" AND name="agents"'
      );
      expect(tableCheck.rows).toHaveLength(1);
      expect(result.rows).toHaveLength(0); // No matches for malicious input
    });

    it('should reject non-parameterized queries with user input', async () => {
      // RED: No query validation
      const userInput = "admin'; DROP TABLE agents; --";
      
      await expect(
        secureConnection.rawQuery(`SELECT * FROM users WHERE role = '${userInput}'`)
      ).rejects.toThrow('Raw queries with interpolated values are not allowed');
    });

    it('should validate and sanitize input parameters', async () => {
      // RED: No input validation
      const invalidInputs = [
        { input: null, expected: 'Parameter cannot be null' },
        { input: undefined, expected: 'Parameter cannot be undefined' },
        { input: new Date(), expected: 'Date objects must be converted to ISO string' },
        { input: { malicious: 'data' }, expected: 'Complex objects must be JSON serialized' }
      ];

      for (const { input, expected } of invalidInputs) {
        await expect(
          secureConnection.query('SELECT * FROM agents WHERE data = ?', [input])
        ).rejects.toThrow(expected);
      }
    });
  });

  describe('Query Timeouts & Resource Limits', () => {
    it('should enforce query timeouts to prevent DoS', async () => {
      // RED: No timeout enforcement
      const longRunningQuery = `
        WITH RECURSIVE r(i) AS (
          SELECT 0
          UNION ALL
          SELECT i FROM r
          LIMIT 2000000
        )
        SELECT i FROM r WHERE i = 1000000;
      `;

      await expect(
        secureConnection.query(longRunningQuery, [], { timeout: 1000 })
      ).rejects.toThrow('Query timeout exceeded');
    });

    it('should limit result set sizes', async () => {
      // RED: No result size limits
      // Create large dataset
      await secureConnection.query('CREATE TABLE large_table (id INTEGER, data TEXT)');
      
      const insertStmt = await secureConnection.prepare('INSERT INTO large_table VALUES (?, ?)');
      for (let i = 0; i < 100000; i++) {
        await insertStmt.run([i, `data-${i}`]);
      }

      await expect(
        secureConnection.query('SELECT * FROM large_table', [], { maxRows: 1000 })
      ).rejects.toThrow('Result set exceeds maximum allowed size');
    });
  });
});
```

## 🎯 Test Coverage Requirements

### Coverage Targets by Component

| Component | Statements | Branches | Functions | Lines |
|-----------|------------|----------|-----------|-------|
| SQLite Adapter | 95% | 90% | 95% | 95% |
| Connection Pool | 90% | 85% | 90% | 90% |
| Auto-Reconnect | 85% | 80% | 85% | 85% |
| Memory Manager | 95% | 90% | 95% | 95% |
| Security Layer | 100% | 95% | 100% | 100% |

### Critical Path Testing

1. **Connection Establishment**: 100% coverage of fallback hierarchy
2. **Transaction Handling**: All ACID properties verified
3. **Error Recovery**: All failure scenarios tested
4. **Performance Optimization**: All optimizations benchmarked
5. **Security Measures**: All attack vectors covered

## 🚀 Performance Benchmarks

### Target Performance Metrics

| Operation | Target | Measurement Method |
|-----------|--------|--------------------|
| Connection Pool Acquire | <10ms | Average over 1000 operations |
| WAL Mode Improvement | >2x vs Journal | Bulk insert comparison |
| Auto-Reconnect Time | <500ms | Network simulation |
| Cross-Agent Sync | <100ms | 5-agent coordination |
| Query Performance | >12x improvement | Optimized vs unoptimized |

## 📝 Implementation Timeline

### Week 1-2: Foundation
- [ ] Implement SQLite adapter with fallback detection
- [ ] Create connection wrapper with basic pooling
- [ ] Write Phase 1 unit tests (Red-Green-Refactor)

### Week 3-4: Resilience & Optimization  
- [ ] Implement auto-reconnect mechanism
- [ ] Add WAL mode optimization
- [ ] Write Phase 2-3 tests (Red-Green-Refactor)

### Week 5-6: Integration & Security
- [ ] Implement swarm coordination features
- [ ] Add security measures and input validation
- [ ] Write Phase 4-5 tests (Red-Green-Refactor)

### Week 7-8: Performance & Polish
- [ ] Performance optimization and benchmarking
- [ ] Edge case handling and error scenarios
- [ ] Final integration testing and documentation

## 🔧 Mock Strategy

### External Dependencies Mocking

```javascript
// Mock better-sqlite3 for testing fallback
jest.mock('better-sqlite3', () => {
  return jest.fn().mockImplementation((dbPath) => ({
    prepare: jest.fn(),
    exec: jest.fn(),
    pragma: jest.fn(),
    close: jest.fn()
  }));
});

// Mock filesystem operations
jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
  writeFile: jest.fn(),
  mkdir: jest.fn()
}));

// Mock network conditions for auto-reconnect testing
class NetworkSimulator {
  static simulateConnectionLoss(duration = 1000) {
    // Implementation for network failure simulation
  }
  
  static simulateSlowNetwork(latency = 500) {
    // Implementation for high latency simulation
  }
}
```

## 📊 Success Criteria

### Must-Have Requirements
- [ ] All unit tests pass (>95% success rate)
- [ ] Integration tests pass (>90% success rate) 
- [ ] Performance targets met (>12x improvement)
- [ ] Security tests pass (100% coverage)
- [ ] Cross-platform compatibility verified
- [ ] Auto-reconnect reliability >99%
- [ ] Connection pool efficiency >90%

### Stretch Goals
- [ ] Performance improvement >15x
- [ ] Test coverage >98%
- [ ] Zero critical security vulnerabilities
- [ ] Sub-10ms connection acquisition
- [ ] Advanced CRDT conflict resolution

This TDD strategy ensures robust, secure, and high-performance SQLite integration for the Gemini Flow swarm coordination system. The tests-first approach guarantees reliable implementation and comprehensive edge case coverage.