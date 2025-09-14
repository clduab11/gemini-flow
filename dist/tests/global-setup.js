/**
 * Jest Global Setup
 * Runs once before all test suites
 */
export default async function globalSetup() {
    console.log('🚀 Starting global test setup...');
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.TEST_MODE = 'true';
    process.env.TEST_PROJECT_ID = 'gemini-flow-test';
    // Performance test configuration
    if (process.env.BENCHMARK === 'true') {
        process.env.TEST_TIMEOUT = '600000'; // 10 minutes
        console.log('📊 Benchmark mode enabled - extended timeouts active');
    }
    // CI optimizations
    if (process.env.CI === 'true') {
        process.env.TEST_PARALLEL = 'true';
        process.env.TEST_TIMEOUT = '120000'; // 2 minutes
        console.log('🔧 CI mode enabled - parallel execution active');
    }
    // Memory management for large test suites
    if (global.gc) {
        global.gc();
        console.log('🧹 Garbage collection triggered');
    }
    console.log('✅ Global test setup completed');
}
//# sourceMappingURL=global-setup.js.map