/**
 * Jest Global Teardown
 * Runs once after all test suites complete
 */

export default async function globalTeardown() {
  console.log('🧹 Starting global test teardown...');
  
  // Clean up any global resources
  if (global.gc) {
    global.gc();
    console.log('🗑️  Final garbage collection triggered');
  }
  
  // Performance metrics summary
  if (process.env.BENCHMARK === 'true') {
    console.log('📊 Benchmark tests completed - check reports for detailed metrics');
  }
  
  console.log('✅ Global test teardown completed');
}