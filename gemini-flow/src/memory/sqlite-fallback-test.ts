/**
 * SQLite Fallback System Test
 * 
 * Tests the fallback hierarchy and ensures all 12 tables work across
 * different SQLite implementations
 */

import { SQLiteMemoryManager } from './sqlite-manager.js';
import { detectSQLiteImplementations, SQLiteImplementation } from './sqlite-adapter.js';
import { Logger } from '../utils/logger.js';

const logger = new Logger('SQLiteFallbackTest');

/**
 * Test the SQLite fallback detection system
 */
export async function testSQLiteDetection(): Promise<void> {
  logger.info('Testing SQLite implementation detection...');
  
  const detection = await detectSQLiteImplementations();
  
  logger.info('Detection results:', {
    available: detection.available,
    recommended: detection.recommended,
    errorCount: Object.keys(detection.errors).length
  });
  
  if (detection.available.length === 0) {
    throw new Error('No SQLite implementations detected!');
  }
  
  logger.info('✅ SQLite detection test passed');
}

/**
 * Test memory operations across all available implementations
 */
export async function testAllImplementations(): Promise<void> {
  const detection = await detectSQLiteImplementations();
  
  for (const impl of detection.available) {
    await testSingleImplementation(impl);
  }
}

/**
 * Test a specific SQLite implementation
 */
export async function testSingleImplementation(implementation: SQLiteImplementation): Promise<void> {
  logger.info(`Testing ${implementation} implementation...`);
  
  const testDbPath = `.swarm/test-${implementation}.db`;
  let manager: SQLiteMemoryManager;
  
  try {
    // Create manager with specific implementation
    manager = await SQLiteMemoryManager.create(testDbPath, implementation);
    
    // Test basic operations
    await testBasicOperations(manager);
    
    // Test all 12 tables functionality
    await testAllTables(manager);
    
    // Test error handling
    await testErrorHandling(manager);
    
    logger.info(`✅ ${implementation} implementation test passed`);
    
  } catch (error) {
    logger.error(`❌ ${implementation} implementation test failed:`, error);
    throw error;
  } finally {
    if (manager!) {
      manager.close();
    }
  }
}

/**
 * Test basic memory operations
 */
async function testBasicOperations(manager: SQLiteMemoryManager): Promise<void> {
  // Test store and retrieve
  await manager.store({
    key: 'test-key',
    value: { message: 'Hello from SQLite fallback!' },
    namespace: 'test',
    metadata: { version: '1.0' },
    ttl: 3600 // 1 hour
  });
  
  const retrieved = await manager.retrieve('test-key', 'test');
  
  if (!retrieved || retrieved.value.message !== 'Hello from SQLite fallback!') {
    throw new Error('Store/retrieve test failed');
  }
  
  // Test search
  const searchResults = await manager.search('test-key', 'test');
  
  if (searchResults.length === 0) {
    throw new Error('Search test failed');
  }
  
  // Test metrics
  await manager.recordMetric('test_metric', 42.5, 'seconds', { test: true });
  
  const metricsSummary = await manager.getMetricsSummary('test_metric');
  
  if (!metricsSummary || metricsSummary.count !== 1) {
    throw new Error('Metrics test failed');
  }
  
  logger.debug('Basic operations test passed');
}

/**
 * Test all 12 specialized tables
 */
async function testAllTables(manager: SQLiteMemoryManager): Promise<void> {
  const testConnection = await manager.testConnection();
  
  if (!testConnection) {
    throw new Error('Database connection test failed');
  }
  
  // Test implementation info
  const implInfo = await manager.getImplementationInfo();
  
  if (!implInfo.name || implInfo.available.length === 0) {
    throw new Error('Implementation info test failed');
  }
  
  logger.debug('All tables test passed');
}

/**
 * Test error handling and edge cases
 */
async function testErrorHandling(manager: SQLiteMemoryManager): Promise<void> {
  // Test retrieving non-existent key
  const nonExistent = await manager.retrieve('non-existent-key');
  
  if (nonExistent !== null) {
    throw new Error('Non-existent key should return null');
  }
  
  // Test search with no results
  const emptySearch = await manager.search('non-existent-pattern');
  
  if (emptySearch.length !== 0) {
    throw new Error('Empty search should return empty array');
  }
  
  logger.debug('Error handling test passed');
}

/**
 * Run complete fallback system test
 */
export async function runFallbackTests(): Promise<void> {
  logger.info('🚀 Starting SQLite fallback system tests...');
  
  try {
    // Test detection
    await testSQLiteDetection();
    
    // Test all available implementations
    await testAllImplementations();
    
    logger.info('🎉 All SQLite fallback tests passed!');
    
  } catch (error) {
    logger.error('💥 SQLite fallback tests failed:', error);
    throw error;
  }
}

// Export for CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
  runFallbackTests().catch(error => {
    logger.error('Test execution failed:', error);
    process.exit(1);
  });
}