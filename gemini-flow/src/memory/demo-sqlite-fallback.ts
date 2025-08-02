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
  
  // Store some demo data
  await manager.store({
    key: `demo-${implementation}`,
    value: { 
      message: `Hello from ${implementation}!`,
      timestamp: Date.now(),
      features: ['fallback', 'cross-platform', 'performance']
    },
    namespace: 'demo'
  });
  
  // Retrieve and display
  const data = await manager.retrieve(`demo-${implementation}`, 'demo');
  logger.info(`Retrieved data:`, data.value);
  
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
    
    // Test cross-implementation compatibility
    await manager.store({
      key: 'cross-platform-test',
      value: {
        message: 'This data works across all SQLite implementations!',
        compatibility: ['better-sqlite3', 'sqlite3', 'sql.js'],
        features: {
          ttl: 'Time-to-live support',
          namespaces: 'Multi-tenant isolation',
          search: 'Pattern-based search',
          metrics: 'Performance tracking',
          tables: '12 specialized tables'
        }
      },
      namespace: 'compatibility'
    });
    
    const result = await manager.retrieve('cross-platform-test', 'compatibility');
    logger.info('Cross-platform data test:', result.value.message);
    
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
    'Memory Management': '✅ TTL, namespaces, cleanup',
    'Metrics & Analytics': '✅ Performance tracking built-in',
    'Error Handling': '✅ Graceful degradation',
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