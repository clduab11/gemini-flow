/**
 * Memory System Exports
 * 
 * Provides access to the SQLite fallback memory system with
 * cross-platform compatibility
 */

export { SQLiteMemoryManager, MemoryEntry } from './sqlite-manager.js';
export { 
  SQLiteDatabase, 
  SQLiteImplementation, 
  SQLiteDetectionResult,
  detectSQLiteImplementations,
  createSQLiteDatabase 
} from './sqlite-adapter.js';
export { runFallbackTests, testSingleImplementation } from './sqlite-fallback-test.js';