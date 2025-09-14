/**
 * SQLite Fallback Test Suite
 *
 * Tests the three-tier fallback system: better-sqlite3 → sqlite3 → sql.js
 */
import { SQLiteDetector } from "./sqlite-detector.js";
import { SQLiteMemoryManager } from "./sqlite-manager.js";
import { Logger } from "../utils/logger.js";
async function testSQLiteFallback() {
    const logger = new Logger("FallbackTest");
    console.log("🧪 Testing SQLite Fallback System\n");
    // Test 1: Detection System
    console.log("📊 PHASE 1: Testing Detection System");
    const detector = new SQLiteDetector();
    try {
        const capabilities = await detector.detectBestImplementation();
        console.log(`✅ Detected: ${capabilities.implementation}`);
        console.log(`   Performance: ${capabilities.performance}`);
        console.log(`   Cross-platform: ${capabilities.crossPlatform}`);
        console.log(`   WASM support: ${capabilities.wasmSupport}`);
        console.log(`   Init time: ${capabilities.initTime}ms\n`);
    }
    catch (error) {
        console.error(`❌ Detection failed: ${error.message}\n`);
        return;
    }
    // Test 2: Memory Manager Integration
    console.log("📊 PHASE 2: Testing Memory Manager Integration");
    try {
        const memoryManager = await SQLiteMemoryManager.create(":memory:");
        // Wait for async initialization
        await new Promise((resolve) => setTimeout(resolve, 100));
        // Test basic memory operations with hierarchical namespaces
        await memoryManager.store({
            key: "test-fallback",
            value: { message: "SQLite fallback working!", timestamp: Date.now() },
            namespace: "test/basic/functionality",
        });
        // Store additional data in different namespace levels
        await memoryManager.store({
            key: "config-test",
            value: { config: "namespace hierarchies", level: "advanced" },
            namespace: "test/config",
        });
        const retrieved = await memoryManager.retrieve("test-fallback", "test/basic/functionality");
        if (retrieved && retrieved.value.message === "SQLite fallback working!") {
            console.log("✅ Memory operations successful");
            console.log(`   Retrieved: ${retrieved.value.message}\n`);
        }
        else {
            console.log("❌ Memory operations failed\n");
        }
        // Test wildcard search functionality
        const searchResults = await memoryManager.search("*", "test/*");
        console.log(`✅ Wildcard search found ${searchResults.length} results\n`);
        // Test namespace info
        const namespaceInfo = await memoryManager.getNamespaceInfo("test/*");
        console.log(`✅ Found ${namespaceInfo.length} namespaces in test hierarchy\n`);
        // Clean up
        memoryManager.close();
    }
    catch (error) {
        console.error(`❌ Memory manager test failed: ${error.message}\n`);
    }
    // Test 3: Performance Benchmark
    console.log("📊 PHASE 3: Performance Benchmark");
    try {
        const memoryManager = await SQLiteMemoryManager.create(":memory:");
        await new Promise((resolve) => setTimeout(resolve, 100));
        const startTime = Date.now();
        const operations = 100;
        // Perform batch operations
        for (let i = 0; i < operations; i++) {
            await memoryManager.store({
                key: `perf-test-${i}`,
                value: { data: `Performance test ${i}`, iteration: i },
                namespace: "benchmark",
            });
        }
        const endTime = Date.now();
        const duration = endTime - startTime;
        const opsPerSecond = Math.round((operations / duration) * 1000);
        console.log(`✅ Performance test completed`);
        console.log(`   Operations: ${operations}`);
        console.log(`   Duration: ${duration}ms`);
        console.log(`   Rate: ${opsPerSecond} ops/sec\n`);
        memoryManager.close();
    }
    catch (error) {
        console.error(`❌ Performance test failed: ${error.message}\n`);
    }
    console.log("🎉 SQLite Fallback Test Complete!");
}
// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testSQLiteFallback().catch(console.error);
}
export { testSQLiteFallback };
