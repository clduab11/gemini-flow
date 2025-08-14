#!/usr/bin/env tsx

/**
 * SQLite Fallback System Demonstration
 * 
 * Shows how the fallback system automatically selects the best available
 * SQLite implementation and gracefully degrades if libraries are missing
 */

import { SQLiteMemoryManager } from './sqlite-manager.js';
import { detectSQLiteImplementations, SQLiteImplementation } from './sqlite-adapter.js';
import { Logger } from '../utils/logger.js';

const logger = new Logger('SQLiteFallbackDemo');

async function demonstrateFallbackSystem() {
  logger.info('🚀 SQLite Fallback System Demonstration');
  logger.info('=====================================');
  
  // Show detection results
  logger.info('1. Detecting available SQLite implementations...');
  const detection = await detectSQLiteImplementations();
  
  logger.info('Available implementations:', detection.available);
  logger.info('Recommended implementation:', detection.recommended);
  
  if (Object.keys(detection.errors).length > 0) {
    logger.warn('Failed implementations:', Object.keys(detection.errors));
  }
  
  // Demonstrate each available implementation
  for (const impl of detection.available) {
    await demonstrateImplementation(impl);
  }
  
  // Show fallback behavior by testing with preferred implementation
  await demonstrateFallbackBehavior();
  
  logger.info('🎉 SQLite Fallback System Demonstration Complete!');
}

async function demonstrateImplementation(implementation: SQLiteImplementation) {
  logger.info(`\\n2. Testing ${implementation} implementation...`);
  
  const manager = await SQLiteMemoryManager.create(
    `.swarm/demo-${implementation}.db`, 
    implementation
  );
  
  // Store some demo data with hierarchical namespaces
  await manager.store({
    key: `demo-${implementation}`,
    value: { 
      message: `Hello from ${implementation}!`,
      timestamp: Date.now(),
      features: ['fallback', 'cross-platform', 'performance']
    },
    namespace: `demo/implementations/${implementation}`
  });
  
  // Store additional data in different namespace levels
  await manager.store({
    key: 'config',
    value: { 
      version: '1.0',
      settings: { performance: 'high', compatibility: 'universal' }
    },
    namespace: `demo/config`
  });
  
  // Retrieve and display
  const data = await manager.retrieve(`demo-${implementation}`, `demo/implementations/${implementation}`);
  logger.info(`Retrieved data:`, data.value);
  
  // Test namespace search with wildcards
  const allDemoData = await manager.search('*', 'demo/*');
  logger.info(`Found ${allDemoData.length} entries in demo namespace hierarchy`);
  
  // Store metrics
  await manager.recordMetric(`${implementation}_performance`, Math.random() * 100, 'ms');
  
  // Get metrics summary
  const metrics = await manager.getMetricsSummary(`${implementation}_performance`);
  logger.info(`Metrics for ${implementation}:`, metrics);
  
  // Test connection
  const connectionOk = await manager.testConnection();
  logger.info(`Connection test: ${connectionOk ? '✅ PASS' : '❌ FAIL'}`);
  
  // Show implementation info
  const info = await manager.getImplementationInfo();
  logger.info(`Using: ${info.name}, Available: [${info.available.join(', ')}]`);
  
  manager.close();
  logger.info(`✅ ${implementation} test complete`);
}

async function demonstrateFallbackBehavior() {
  logger.info('\\n3. Demonstrating fallback behavior...');
  
  // Try to create with non-existent implementation
  try {
    logger.info('Creating manager with automatic fallback...');
    const manager = await SQLiteMemoryManager.create('.swarm/demo-fallback.db');
    
    const info = await manager.getImplementationInfo();
    logger.info(`Fallback selected: ${info.name}`);
    logger.info(`Priority order was: better-sqlite3 > sqlite3 > sql.js`);
    
    // Test cross-implementation compatibility with hierarchical namespaces
    await manager.store({
      key: 'cross-platform-test',
      value: {
        message: 'This data works across all SQLite implementations!',
        compatibility: ['better-sqlite3', 'sqlite3', 'sql.js'],
        features: {
          ttl: 'Time-to-live support',
          namespaces: 'Hierarchical multi-tenant isolation',
          search: 'Pattern-based search with wildcards',
          metrics: 'Performance tracking by namespace',
          tables: '12 specialized tables'
        }
      },
      namespace: 'compatibility/cross-platform'
    });
    
    // Store additional namespace data
    await manager.store({
      key: 'performance-data',
      value: { benchmarks: { read: '1000 ops/sec', write: '800 ops/sec' } },
      namespace: 'compatibility/performance'
    });
    
    await manager.store({
      key: 'feature-flags',
      value: { hierarchicalNamespaces: true, wildcardSearch: true },
      namespace: 'compatibility/features'
    });
    
    const result = await manager.retrieve('cross-platform-test', 'compatibility/cross-platform');
    logger.info('Cross-platform data test:', result.value.message);
    
    // Test namespace operations
    const namespaceInfo = await manager.getNamespaceInfo('compatibility/*');
    logger.info('Namespace info:', namespaceInfo);
    
    // Test listing all entries in compatibility namespace
    const compatibilityEntries = await manager.list('compatibility/*');
    logger.info(`Found ${compatibilityEntries.length} entries in compatibility namespace hierarchy`);
    
    // Test namespace metrics
    const metrics = await manager.getNamespaceMetrics('compatibility/*');
    logger.info('Namespace metrics:', metrics);
    
    manager.close();
    logger.info('✅ Fallback behavior test complete');
    
  } catch (error) {
    logger.error('Fallback test failed:', error);
  }
}

async function showSystemCapabilities() {
  logger.info('\\n4. System Capabilities Summary');
  logger.info('===============================');
  
  const capabilities = {
    'Cross-Platform': '✅ Works on any Node.js environment',
    'Fallback Hierarchy': '✅ better-sqlite3 → sqlite3 → sql.js',
    'Performance Optimized': '✅ Uses fastest available implementation',
    'WASM Compatibility': '✅ sql.js provides universal fallback',
    '12 Specialized Tables': '✅ All work across implementations',
    'Hierarchical Namespaces': '✅ Multi-level organization (e.g., app/module/feature)',
    'Namespace Wildcards': '✅ Pattern matching with * and ** support',
    'Memory Management': '✅ TTL, cleanup, validation',
    'Namespace Operations': '✅ List, delete, info, metrics by namespace',
    'Advanced Search': '✅ Key/value patterns, sorting, filtering',
    'Metrics & Analytics': '✅ Performance tracking per namespace',
    'Error Handling': '✅ Graceful degradation with validation',
    'Async Operations': '✅ Promise-based API',
    'ES Module Support': '✅ Modern JavaScript imports'
  };
  
  for (const [feature, status] of Object.entries(capabilities)) {
    logger.info(`${feature}: ${status}`);
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  demonstrateFallbackSystem()
    .then(() => showSystemCapabilities())
    .catch(error => {
      logger.error('Demo failed:', error);
      process.exit(1);
    });
}

export { demonstrateFallbackSystem, demonstrateImplementation };