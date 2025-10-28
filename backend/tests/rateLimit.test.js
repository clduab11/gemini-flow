/**
 * Rate Limit Persistence Tests
 * 
 * Tests for verifying rate limit data persists across server restarts
 */

import { 
  rateLimit,
  getRemainingRequests,
  clearRateLimits,
  requestCounts,
  persistRateLimits,
  loadRateLimits,
  startRateLimitPersistence,
  stopRateLimitPersistence
} from '../src/api/middleware/rateLimit.js';
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), '.data');
const RATE_LIMIT_FILE = path.join(DATA_DIR, 'rate-limits.json');

/**
 * Mock Express request/response objects
 */
function createMockReqRes(clientId = 'test-client') {
  const req = {
    clientId,
    ip: clientId,
  };
  
  const res = {
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      this.body = data;
      return this;
    },
    setHeader: function(name, value) {
      if (!this.headers) this.headers = {};
      this.headers[name] = value;
    },
    statusCode: 200,
    body: null,
    headers: {}
  };
  
  return { req, res };
}

/**
 * Test: Basic rate limiting
 */
async function testBasicRateLimit() {
  console.log('\n📝 Test: Basic rate limiting');
  
  clearRateLimits();
  const { req, res } = createMockReqRes('client-1');
  
  // Make a request
  let nextCalled = false;
  const next = () => { nextCalled = true; };
  
  await rateLimit(req, res, next);
  
  // Check that request was allowed
  if (nextCalled && res.statusCode === 200) {
    console.log('✅ Request allowed');
  } else {
    throw new Error('Expected request to be allowed');
  }
  
  // Check headers
  if (res.headers['X-RateLimit-Limit'] === 100) {
    console.log('✅ Rate limit header set correctly');
  } else {
    throw new Error('Rate limit header incorrect');
  }
  
  // Check remaining requests
  const remaining = getRemainingRequests('client-1');
  if (remaining === 99) {
    console.log('✅ Remaining requests calculated correctly');
  } else {
    throw new Error(`Expected 99 remaining, got ${remaining}`);
  }
}

/**
 * Test: Rate limit enforcement
 */
async function testRateLimitEnforcement() {
  console.log('\n📝 Test: Rate limit enforcement');
  
  clearRateLimits();
  const clientId = 'client-2';
  const next = () => {};
  
  // Make 100 requests (the limit)
  for (let i = 0; i < 100; i++) {
    const { req, res } = createMockReqRes(clientId);
    await rateLimit(req, res, next);
    
    if (res.statusCode !== 200) {
      throw new Error(`Request ${i + 1} should have been allowed`);
    }
  }
  
  console.log('✅ 100 requests allowed');
  
  // 101st request should be blocked
  const { req, res } = createMockReqRes(clientId);
  await rateLimit(req, res, next);
  
  if (res.statusCode === 429) {
    console.log('✅ 101st request blocked with 429');
  } else {
    throw new Error(`Expected 429, got ${res.statusCode}`);
  }
  
  if (res.body && res.body.error && res.body.error.message === 'Too many requests') {
    console.log('✅ Correct error message returned');
  } else {
    throw new Error('Expected "Too many requests" error message');
  }
}

/**
 * Test: File persistence across restart
 */
async function testFilePersistence() {
  console.log('\n📝 Test: File persistence across restart');
  
  // Clean up any existing data
  try {
    await fs.unlink(RATE_LIMIT_FILE);
  } catch (e) {
    // File doesn't exist, that's fine
  }
  
  clearRateLimits();
  const clientId = 'client-3';
  const next = () => {};
  
  // Make 50 requests
  for (let i = 0; i < 50; i++) {
    const { req, res } = createMockReqRes(clientId);
    await rateLimit(req, res, next);
  }
  
  console.log('✅ Made 50 requests');
  
  // Check remaining before persistence
  let remaining = getRemainingRequests(clientId);
  if (remaining === 50) {
    console.log('✅ 50 requests remaining before persistence');
  } else {
    throw new Error(`Expected 50 remaining, got ${remaining}`);
  }
  
  // Trigger persistence
  await persistRateLimits();
  console.log('✅ Data persisted to disk');
  
  // Verify file was created
  try {
    await fs.access(RATE_LIMIT_FILE);
    console.log('✅ Rate limit file created');
  } catch (e) {
    throw new Error('Rate limit file was not created');
  }
  
  // Simulate restart by clearing memory
  requestCounts.clear();
  console.log('✅ Simulated restart (cleared memory)');
  
  // Load from disk
  await loadRateLimits();
  console.log('✅ Data loaded from disk');
  
  // Check remaining after restart
  remaining = getRemainingRequests(clientId);
  if (remaining === 50) {
    console.log('✅ 50 requests remaining after restart - persistence works!');
  } else {
    throw new Error(`Expected 50 remaining after restart, got ${remaining}`);
  }
  
  // Verify we can make exactly 50 more requests
  for (let i = 0; i < 50; i++) {
    const { req, res } = createMockReqRes(clientId);
    await rateLimit(req, res, next);
    
    if (res.statusCode !== 200) {
      throw new Error(`Request ${i + 1} after restart should have been allowed`);
    }
  }
  
  console.log('✅ Made 50 more requests after restart');
  
  // 101st total request should be blocked
  const { req, res } = createMockReqRes(clientId);
  await rateLimit(req, res, next);
  
  if (res.statusCode === 429) {
    console.log('✅ 101st total request blocked - rate limit persisted correctly!');
  } else {
    throw new Error(`Expected 429 after 100 total requests, got ${res.statusCode}`);
  }
}

/**
 * Test: Expired entries cleanup
 */
async function testExpiredEntriesCleanup() {
  console.log('\n📝 Test: Expired entries cleanup');
  
  clearRateLimits();
  const clientId = 'client-4';
  
  // Add an old entry (17 minutes ago - outside 15 minute window)
  const oldTimestamp = Date.now() - (17 * 60 * 1000);
  requestCounts.set(clientId, [oldTimestamp]);
  
  console.log('✅ Added expired entry');
  
  // Persist (should clean up expired entries)
  await persistRateLimits();
  
  // Check that the entry was removed
  if (!requestCounts.has(clientId)) {
    console.log('✅ Expired entry removed from memory during persistence');
  } else {
    throw new Error('Expired entry should have been removed');
  }
  
  // Verify file doesn't contain the expired entry
  const data = await fs.readFile(RATE_LIMIT_FILE, 'utf-8');
  const stored = JSON.parse(data);
  const clientEntry = stored.find(([id]) => id === clientId);
  
  if (!clientEntry) {
    console.log('✅ Expired entry not persisted to file');
  } else {
    throw new Error('Expired entry should not be in persisted data');
  }
}

/**
 * Test: Multiple clients isolation
 */
async function testMultipleClientsIsolation() {
  console.log('\n📝 Test: Multiple clients isolation');
  
  clearRateLimits();
  const next = () => {};
  
  // Make requests from different clients
  for (let i = 0; i < 50; i++) {
    const { req, res } = createMockReqRes('client-a');
    await rateLimit(req, res, next);
  }
  
  for (let i = 0; i < 30; i++) {
    const { req, res } = createMockReqRes('client-b');
    await rateLimit(req, res, next);
  }
  
  const remainingA = getRemainingRequests('client-a');
  const remainingB = getRemainingRequests('client-b');
  
  if (remainingA === 50 && remainingB === 70) {
    console.log('✅ Clients tracked independently');
  } else {
    throw new Error(`Expected 50 and 70 remaining, got ${remainingA} and ${remainingB}`);
  }
  
  // Persist and reload
  await persistRateLimits();
  requestCounts.clear();
  await loadRateLimits();
  
  const remainingAAfter = getRemainingRequests('client-a');
  const remainingBAfter = getRemainingRequests('client-b');
  
  if (remainingAAfter === 50 && remainingBAfter === 70) {
    console.log('✅ Multiple client data persisted and loaded correctly');
  } else {
    throw new Error(`Expected 50 and 70 after reload, got ${remainingAAfter} and ${remainingBAfter}`);
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🧪 Starting Rate Limit Persistence Tests\n');
  console.log('='.repeat(60));
  
  try {
    await testBasicRateLimit();
    await testRateLimitEnforcement();
    await testFilePersistence();
    await testExpiredEntriesCleanup();
    await testMultipleClientsIsolation();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests passed!');
    console.log('='.repeat(60));
    
    // Cleanup
    try {
      await fs.unlink(RATE_LIMIT_FILE);
      console.log('\n🧹 Cleaned up test data');
    } catch (e) {
      // Ignore cleanup errors
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ Test failed:', error.message);
    console.error('='.repeat(60));
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
runTests();
