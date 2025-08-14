/**
 * Memory System Exports
 *
 * Provides access to the SQLite fallback memory system with
 * cross-platform compatibility
 */

export { SQLiteMemoryManager, NamespaceUtils } from "./sqlite-manager.js";
export type {
  MemoryEntry,
  NamespaceInfo,
  NamespaceOperations,
  SearchOptions,
} from "./sqlite-manager.js";
export {
  detectSQLiteImplementations,
  createSQLiteDatabase,
} from "./sqlite-adapter.js";
export type {
  SQLiteDatabase,
  SQLiteImplementation,
  SQLiteDetectionResult,
} from "./sqlite-adapter.js";
export {
  runFallbackTests,
  testSingleImplementation,
} from "./sqlite-fallback-test.js";
export { SQLiteDetector } from "./sqlite-detector.js";
export type { SQLiteCapabilities } from "./sqlite-detector.js";
