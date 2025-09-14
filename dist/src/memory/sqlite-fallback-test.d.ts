/**
 * SQLite Fallback System Test
 *
 * Tests the fallback hierarchy and ensures all 12 tables work across
 * different SQLite implementations
 */
import { SQLiteImplementation } from "./sqlite-adapter.js";
/**
 * Test the SQLite fallback detection system
 */
export declare function testSQLiteDetection(): Promise<void>;
/**
 * Test memory operations across all available implementations
 */
export declare function testAllImplementations(): Promise<void>;
/**
 * Test a specific SQLite implementation
 */
export declare function testSingleImplementation(implementation: SQLiteImplementation): Promise<void>;
/**
 * Run complete fallback system test
 */
export declare function runFallbackTests(): Promise<void>;
//# sourceMappingURL=sqlite-fallback-test.d.ts.map