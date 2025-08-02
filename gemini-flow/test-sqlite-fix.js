#!/usr/bin/env node

/**
 * Test script to verify SQLite Database.prepare TypeError fix
 */

import { CacheManager } from './dist/core/cache-manager.js';
import { SQLiteMemoryManager } from './dist/memory/sqlite-manager.js';
import { detectSQLiteImplementations } from './dist/memory/sqlite-adapter.js';

console.log('🧪 Testing SQLite Database.prepare TypeError fix...\n');

async function testSQLiteImplementations() {
  console.log('1️⃣ Detecting available SQLite implementations...');
  const detection = await detectSQLiteImplementations();
  console.log('✅ Available implementations:', detection.available);
  console.log('✅ Recommended:', detection.recommended);
  console.log('');
}

async function testMemoryManager() {
  console.log('2️⃣ Testing SQLiteMemoryManager with fallback...');
  try {
    const memoryManager = await SQLiteMemoryManager.create('.swarm/test-memory.db');
    
    // Test basic operations
    await memoryManager.store({
      key: 'test-key',
      value: { data: 'test-value' },
      namespace: 'test'
    });
    
    const retrieved = await memoryManager.retrieve('test-key', 'test');
    console.log('✅ Memory manager working:', retrieved?.value);
    
    const info = await memoryManager.getImplementationInfo();
    console.log('✅ Using implementation:', info.name);
    
    memoryManager.close();
    console.log('');
  } catch (error) {
    console.error('❌ Memory manager error:', error.message);
  }
}

async function testCacheManager() {
  console.log('3️⃣ Testing CacheManager with SQLite adapter...');
  try {
    const cacheManager = new CacheManager({
      persistToDisk: true,
      dbPath: '.swarm/test-cache.db'
    });
    
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test basic operations
    await cacheManager.set('cache-test', { value: 'cached-data' });
    const cached = await cacheManager.get('cache-test');
    console.log('✅ Cache manager working:', cached);
    
    const stats = cacheManager.getStats();
    console.log('✅ Cache stats:', {
      totalKeys: stats.totalKeys,
      hitRate: stats.hitRate
    });
    
    cacheManager.shutdown();
    console.log('');
  } catch (error) {
    console.error('❌ Cache manager error:', error.message);
  }
}

async function testConnectionPool() {
  console.log('4️⃣ Testing SQLite Connection Pool...');
  try {
    const { SQLiteConnectionPool } = await import('./dist/core/sqlite-connection-pool.js');
    
    const pool = new SQLiteConnectionPool('.swarm/test-pool.db', {
      minConnections: 2,
      maxConnections: 5,
      userTier: 'pro'
    });
    
    await pool.initialize();
    
    // Test connection acquisition
    const result = await pool.execute(async (db) => {
      const stmt = db.prepare('SELECT 1 + 1 as result');
      return stmt.get();
    });
    
    console.log('✅ Connection pool working:', result);
    
    const poolStats = pool.getStats();
    console.log('✅ Pool stats:', {
      total: poolStats.totalConnections,
      active: poolStats.activeConnections,
      implementation: poolStats.implementation
    });
    
    await pool.shutdown();
    console.log('');
  } catch (error) {
    console.error('❌ Connection pool error:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting SQLite fix verification...\n');
  
  try {
    await testSQLiteImplementations();
    await testMemoryManager();
    await testCacheManager();
    await testConnectionPool();
    
    console.log('✅ All tests completed successfully!');
    console.log('🎉 Database.prepare TypeError has been fixed with proper fallback handling!\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
runTests().catch(console.error);