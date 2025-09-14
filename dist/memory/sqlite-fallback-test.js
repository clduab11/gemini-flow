/**
 * SQLite Fallback System Test
 *
 * Tests the fallback hierarchy and ensures all 12 tables work across
 * different SQLite implementations
 */
import { SQLiteMemoryManager, NamespaceUtils } from "./sqlite-manager.js";
import { detectSQLiteImplementations, } from "./sqlite-adapter.js";
import { Logger } from "../utils/logger.js";
const logger = new Logger("SQLiteFallbackTest");
/**
 * Test the SQLite fallback detection system
 */
export async function testSQLiteDetection() {
    logger.info("Testing SQLite implementation detection...");
    const detection = await detectSQLiteImplementations();
    logger.info("Detection results:", {
        available: detection.available,
        recommended: detection.recommended,
        errorCount: Object.keys(detection.errors).length,
    });
    if (detection.available.length === 0) {
        throw new Error("No SQLite implementations detected!");
    }
    logger.info("✅ SQLite detection test passed");
}
/**
 * Test memory operations across all available implementations
 */
export async function testAllImplementations() {
    const detection = await detectSQLiteImplementations();
    for (const impl of detection.available) {
        await testSingleImplementation(impl);
    }
}
/**
 * Test a specific SQLite implementation
 */
export async function testSingleImplementation(implementation) {
    logger.info(`Testing ${implementation} implementation...`);
    const testDbPath = `.swarm/test-${implementation}.db`;
    let manager;
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
    }
    catch (error) {
        logger.error(`❌ ${implementation} implementation test failed:`, error);
        throw error;
    }
    finally {
        if (manager) {
            manager.close();
        }
    }
}
/**
 * Test basic memory operations including namespace functionality
 */
async function testBasicOperations(manager) {
    // Test hierarchical namespace store and retrieve
    await manager.store({
        key: "test-key",
        value: { message: "Hello from SQLite fallback!" },
        namespace: "test/basic/operations",
        metadata: { version: "1.0" },
        ttl: 3600, // 1 hour
    });
    const retrieved = await manager.retrieve("test-key", "test/basic/operations");
    if (!retrieved || retrieved.value.message !== "Hello from SQLite fallback!") {
        throw new Error("Store/retrieve test failed");
    }
    // Test namespace validation
    try {
        await manager.store({
            key: "invalid-test",
            value: { test: true },
            namespace: "invalid namespace with spaces!", // Should fail
        });
        throw new Error("Namespace validation should have failed");
    }
    catch (error) {
        if (!error.message.includes("Invalid namespace format")) {
            throw new Error("Unexpected validation error");
        }
    }
    // Test wildcard search
    const searchResults = await manager.search("test-key", "test/*");
    if (searchResults.length === 0) {
        throw new Error("Wildcard search test failed");
    }
    // Test namespace operations
    const namespaceInfo = await manager.getNamespaceInfo("test/*");
    if (namespaceInfo.length === 0) {
        throw new Error("Namespace info test failed");
    }
    // Test listing entries in namespace
    const entries = await manager.list("test/basic/*");
    if (entries.length === 0) {
        throw new Error("Namespace list test failed");
    }
    // Test metrics
    await manager.recordMetric("test_metric", 42.5, "seconds", { test: true });
    const metricsSummary = await manager.getMetricsSummary("test_metric");
    if (!metricsSummary || metricsSummary.count !== 1) {
        throw new Error("Metrics test failed");
    }
    // Test namespace metrics
    const nsMetrics = await manager.getNamespaceMetrics("test/*");
    if (nsMetrics.length === 0) {
        throw new Error("Namespace metrics test failed");
    }
    logger.debug("Basic operations and namespace tests passed");
}
/**
 * Test namespace utilities
 */
async function testNamespaceUtils() {
    // Test namespace validation
    if (!NamespaceUtils.validateNamespace("valid/namespace/path")) {
        throw new Error("Valid namespace validation failed");
    }
    if (NamespaceUtils.validateNamespace("invalid namespace with spaces")) {
        throw new Error("Invalid namespace validation should have failed");
    }
    // Test namespace normalization
    const normalized = NamespaceUtils.normalizeNamespace("//multiple///slashes//");
    if (normalized !== "multiple/slashes") {
        throw new Error("Namespace normalization failed");
    }
    // Test parent namespace
    const parent = NamespaceUtils.getParentNamespace("app/module/feature");
    if (parent !== "app/module") {
        throw new Error("Parent namespace test failed");
    }
    // Test namespace depth
    const depth = NamespaceUtils.getNamespaceDepth("app/module/feature");
    if (depth !== 3) {
        throw new Error("Namespace depth test failed");
    }
    // Test pattern matching
    if (!NamespaceUtils.matchesPattern("app/module/feature", "app/*/feature")) {
        throw new Error("Pattern matching test failed");
    }
    if (!NamespaceUtils.matchesPattern("app/very/deep/structure", "app/**")) {
        throw new Error("Deep pattern matching test failed");
    }
    logger.debug("Namespace utilities test passed");
}
/**
 * Test all 12 specialized tables
 */
async function testAllTables(manager) {
    const testConnection = await manager.testConnection();
    if (!testConnection) {
        throw new Error("Database connection test failed");
    }
    // Test implementation info
    const implInfo = await manager.getImplementationInfo();
    if (!implInfo.name || implInfo.available.length === 0) {
        throw new Error("Implementation info test failed");
    }
    // Test namespace utilities
    await testNamespaceUtils();
    logger.debug("All tables and namespace utilities test passed");
}
/**
 * Test error handling and edge cases
 */
async function testErrorHandling(manager) {
    // Test retrieving non-existent key
    const nonExistent = await manager.retrieve("non-existent-key");
    if (nonExistent !== null) {
        throw new Error("Non-existent key should return null");
    }
    // Test search with no results
    const emptySearch = await manager.search("non-existent-pattern");
    if (emptySearch.length !== 0) {
        throw new Error("Empty search should return empty array");
    }
    logger.debug("Error handling test passed");
}
/**
 * Run complete fallback system test
 */
export async function runFallbackTests() {
    logger.info("🚀 Starting SQLite fallback system tests...");
    try {
        // Test detection
        await testSQLiteDetection();
        // Test all available implementations
        await testAllImplementations();
        logger.info("🎉 All SQLite fallback tests passed!");
    }
    catch (error) {
        logger.error("💥 SQLite fallback tests failed:", error);
        throw error;
    }
}
// Export for CLI usage
if (import.meta.url === `file://${process.argv[1]}`) {
    runFallbackTests().catch((error) => {
        logger.error("Test execution failed:", error);
        process.exit(1);
    });
}
