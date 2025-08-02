# Implementation Plan: SQLite Connection Pooling & Performance Optimization

## 🚨 CRITICAL ISSUE ANALYSIS

### Primary Problem: Database.prepare TypeError
**Location**: `/src/core/cache-manager.ts` Lines 147-159  
**Root Cause**: Direct `better-sqlite3` import without fallback adapter integration  
**Impact**: Runtime failures when better-sqlite3 compilation fails  

```typescript
// PROBLEMATIC CODE (Lines 147-159)
import Database from 'better-sqlite3'; // ❌ Direct import without fallback

private prepareStatements(): void {
  if (!this.db) return;
  // Direct .prepare() calls without adapter pattern
  (this as any).getStmt = this.db.prepare('SELECT * FROM cache_entries WHERE key = ?');
  (this as any).setStmt = this.db.prepare(`...`);
  // ... more direct calls
}
```

## 📋 IMPLEMENTATION STRATEGY

### Phase 1: Critical Fixes (Priority: HIGH)

#### 1.1 Fix Database.prepare TypeError ⚡ IMMEDIATE
```typescript
// SOLUTION: Replace cache-manager.ts with adapter integration
import { createSQLiteDatabase, SQLiteDatabase } from '../memory/sqlite-adapter.js';

export class CacheManager extends EventEmitter {
  private db?: SQLiteDatabase; // Use adapter interface instead of direct better-sqlite3
  
  private async initializeDiskCache(): Promise<void> {
    try {
      // Use fallback-enabled adapter
      this.db = await createSQLiteDatabase(this.config.dbPath);
      
      // Adapter handles implementation differences automatically
      this.db.pragma('journal_mode = WAL');
      // ... rest of optimization
    } catch (error) {
      this.logger.error('Failed to initialize disk cache', error);
      this.config.persistToDisk = false;
    }
  }
}
```

#### 1.2 Connection Pooling Wrapper Class
```typescript
interface ConnectionPoolConfig {
  maxConnections: number;
  minConnections: number;
  acquireTimeout: number;
  retryDelay: number;
  maxRetries: number;
}

export class SQLiteConnectionPool {
  private pool: SQLiteDatabase[] = [];
  private activeConnections = new Set<SQLiteDatabase>();
  private waitingQueue: Array<{ resolve: Function, reject: Function }> = [];
  
  async acquire(): Promise<SQLiteDatabase> {
    // Implementation with auto-reconnect logic
  }
  
  async release(connection: SQLiteDatabase): Promise<void> {
    // Return connection to pool with health check
  }
}
```

### Phase 2: Performance Optimization (Priority: HIGH)

#### 2.1 WAL Mode Implementation
```typescript
private async enableOptimizations(db: SQLiteDatabase): Promise<void> {
  try {
    // WAL mode for better-sqlite3
    if (db.name === 'better-sqlite3') {
      db.pragma('journal_mode = WAL');
      db.pragma('synchronous = NORMAL');
      db.pragma('cache_size = 10000');
      db.pragma('temp_store = MEMORY');
      db.pragma('mmap_size = 268435456'); // 256MB
    }
    // Fallback optimizations for sqlite3/sql.js
    else {
      db.pragma('cache_size = 5000');
      db.pragma('temp_store = MEMORY');
    }
  } catch (error) {
    this.logger.warn('Some pragma optimizations not supported:', error);
  }
}
```

#### 2.2 Prepared Statement Optimization
```typescript
export class PreparedStatementCache {
  private statements = new Map<string, SQLiteStatement>();
  
  getOrPrepare(sql: string, db: SQLiteDatabase): SQLiteStatement {
    if (!this.statements.has(sql)) {
      this.statements.set(sql, db.prepare(sql));
    }
    return this.statements.get(sql)!;
  }
  
  clear(): void {
    // Cleanup prepared statements
    this.statements.clear();
  }
}
```

### Phase 3: Integration & Testing (Priority: MEDIUM)

#### 3.1 Auth Manager Integration
```typescript
// Current auth-manager.ts is well-structured with proper Google tier system
export interface UserProfile {
  tier: 'free' | 'pro' | 'enterprise'; // ✅ Already implemented
  quotas: { daily: number; monthly: number; concurrent: number }; // ✅ Ready
}

// Integration point: SQLiteMemoryManager + AuthenticationManager
async function createUserAwareMemoryManager(userProfile: UserProfile): Promise<SQLiteMemoryManager> {
  const poolConfig = {
    maxConnections: userProfile.quotas.concurrent,
    // ... tier-based configuration
  };
  
  return SQLiteMemoryManager.create('.swarm/memory.db', 'better-sqlite3', poolConfig);
}
```

#### 3.2 TDD Test Suite Architecture
```typescript
describe('SQLite Connection Pooling', () => {
  test('should handle better-sqlite3 compilation failure gracefully', async () => {
    // Force fallback scenario
    const db = await createSQLiteDatabase(':memory:', 'sqlite3');
    expect(db.name).toBe('sqlite3');
  });
  
  test('should maintain connection pool under load', async () => {
    const pool = new SQLiteConnectionPool(poolConfig);
    // Concurrent connection stress test
  });
  
  test('should auto-recover from connection failures', async () => {
    // Connection recovery scenario testing
  });
});
```

## 🎯 IMPLEMENTATION ORDER

### Immediate Actions (Next 30 minutes)
1. **Fix cache-manager.ts TypeError** - Replace direct better-sqlite3 import
2. **Test fallback system** - Ensure cache manager works with all 3 implementations
3. **Create connection pool wrapper** - Basic pooling functionality

### Short-term Goals (Next 2 hours)
4. **Enable WAL mode optimizations** - Performance boost implementation
5. **Build TDD test suite** - Comprehensive testing framework
6. **Integrate auth manager tiers** - Connection limits by user tier

### Long-term Goals (Next session)
7. **Graceful recovery system** - Auto-reconnect and corruption handling
8. **Routing optimization** - Prepared statement caching
9. **Performance benchmarking** - Comparative analysis suite
10. **Documentation updates** - Implementation architecture docs

## 📊 PERFORMANCE TARGETS

- **better-sqlite3**: 23ms average query time (12x faster than sqlite3)
- **sqlite3**: 276ms average query time (baseline)
- **sql.js**: 342ms average query time (WASM overhead)
- **Connection Pool**: <5ms acquisition time, 95% hit rate
- **WAL Mode**: 40% write performance improvement
- **Prepared Statements**: 60% query optimization

## 🔧 DEPENDENCY ANALYSIS

### Package.json Status ✅
- `better-sqlite3@12.2.0` - Latest stable version
- `sqlite3@5.1.6` - Node.js 24.x compatible
- `sql.js@1.13.0` - WASM fallback ready
- All fallback dependencies properly configured as optional

### Current Implementation Status
- ✅ **SQLiteAdapter**: Fully implemented with 3-tier fallback
- ✅ **SQLiteManager**: 12 specialized tables ready
- ✅ **AuthManager**: Google tier structure complete
- ❌ **CacheManager**: Needs adapter integration (CRITICAL)
- ⚠️ **Connection Pooling**: Missing implementation

## 🚀 COORDINATION NOTES

Waiting for researcher agent findings before starting implementation. Ready to execute the following sequence:

1. Researcher provides additional context on connection pooling patterns
2. Implement critical Database.prepare fix immediately
3. Build connection pooling wrapper with graceful recovery
4. Create comprehensive TDD test suite
5. Optimize performance with WAL mode and prepared statements

**Implementation Lead**: Ready for parallel execution once researcher completes analysis.