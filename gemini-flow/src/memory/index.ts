/**
 * Memory System Exports
 * 
 * Provides access to the SQLite fallback memory system with
 * cross-platform compatibility
 */

export { SQLiteMemoryManager } from './sqlite-manager.js';
export type { MemoryEntry } from './sqlite-manager.js';
export { 
  detectSQLiteImplementations,
  createSQLiteDatabase 
} from './sqlite-adapter.js';
export type { 
  SQLiteDatabase, 
  SQLiteImplementation, 
  SQLiteDetectionResult
} from './sqlite-adapter.js';
export { runFallbackTests, testSingleImplementation } from './sqlite-fallback-test.js';