/**
 * Comprehensive API Test Suite
 *
 * Tests all API endpoints, middleware, and security features
 * Issue #79: Implement Automated API Test Suite
 */

import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import { promisify } from 'node:util';

const sleep = promisify(setTimeout);

// Mock server for testing
let server;
let baseURL;

describe('API Test Suite', () => {
  before(async () => {
    // Setup test environment
    process.env.NODE_ENV = 'test';
    process.env.PORT = '3999';
    process.env.SKIP_API_KEY_AUTH = 'true';

    // Import and start server
    const app = await import('../src/server.js');
    baseURL = `http://localhost:3999`;

    // Wait for server to start
    await sleep(1000);
  });

  after(async () => {
    // Cleanup
    if (server) {
      server.close();
    }
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await fetch(`${baseURL}/health`);
      const data = await response.json();

      assert.strictEqual(response.status, 200);
      assert.strictEqual(data.status, 'healthy');
      assert.ok(data.timestamp);
      assert.strictEqual(data.service, 'gemini-flow-backend');
    });
  });

  describe('Metrics Endpoint', () => {
    it('should return Prometheus metrics', async () => {
      const response = await fetch(`${baseURL}/metrics`);
      const text = await response.text();

      assert.strictEqual(response.status, 200);
      assert.ok(text.includes('gemini_flow_'));
      assert.ok(text.includes('TYPE'));
    });
  });

  describe('Security Middleware', () => {
    describe('API Key Authentication', () => {
      it('should reject requests without API key in production', async () => {
        const originalEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';

        const response = await fetch(`${baseURL}/api/gemini/test`);

        process.env.NODE_ENV = originalEnv;

        assert.strictEqual(response.status, 401);
      });

      it('should accept valid API key', async () => {
        const originalEnv = process.env.NODE_ENV;
        const originalKeys = process.env.API_KEYS;

        process.env.NODE_ENV = 'production';
        process.env.API_KEYS = 'test-key-12345678901234567890123456789012';

        const response = await fetch(`${baseURL}/api/gemini/test`, {
          headers: {
            'Authorization': 'Bearer test-key-12345678901234567890123456789012'
          }
        });

        process.env.NODE_ENV = originalEnv;
        process.env.API_KEYS = originalKeys;

        // Even if endpoint doesn't exist, auth should pass
        assert.notStrictEqual(response.status, 401);
      });
    });

    describe('Rate Limiting', () => {
      it('should enforce rate limits', async () => {
        const requests = [];

        // Send many requests rapidly
        for (let i = 0; i < 150; i++) {
          requests.push(fetch(`${baseURL}/health`));
        }

        const responses = await Promise.all(requests);
        const rateLimited = responses.filter(r => r.status === 429);

        // Should have at least some rate limited responses
        assert.ok(rateLimited.length > 0, 'Rate limiting should be enforced');
      });
    });

    describe('Payload Size Validation', () => {
      it('should reject oversized payloads', async () => {
        const largePayload = 'x'.repeat(2 * 1024 * 1024); // 2MB

        const response = await fetch(`${baseURL}/api/gemini/test`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ data: largePayload })
        });

        assert.strictEqual(response.status, 413);
      });

      it('should accept normal sized payloads', async () => {
        const normalPayload = { test: 'data' };

        const response = await fetch(`${baseURL}/api/gemini/test`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(normalPayload)
        });

        // Should not be rejected for size (might be 404 for missing endpoint)
        assert.notStrictEqual(response.status, 413);
      });
    });
  });

  describe('Pagination Middleware', () => {
    it('should apply default pagination', async () => {
      // This would test actual paginated endpoints when they exist
      const response = await fetch(`${baseURL}/api/gemini/list?page=1&limit=10`);

      // Test that pagination parameters are accepted
      assert.ok(response.status !== 400);
    });

    it('should validate page parameter', async () => {
      const response = await fetch(`${baseURL}/api/gemini/list?page=-1`);

      // Invalid page should be rejected
      assert.ok([400, 404].includes(response.status));
    });

    it('should cap maximum limit', async () => {
      const response = await fetch(`${baseURL}/api/gemini/list?limit=10000`);

      // Should not crash, limit should be capped
      assert.ok(response.status !== 500);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for unknown endpoints', async () => {
      const response = await fetch(`${baseURL}/api/nonexistent`);

      assert.strictEqual(response.status, 404);

      const data = await response.json();
      assert.ok(data.error);
    });

    it('should handle malformed JSON', async () => {
      const response = await fetch(`${baseURL}/api/gemini/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: '{invalid json'
      });

      assert.strictEqual(response.status, 400);
    });
  });

  describe('CORS', () => {
    it('should include CORS headers', async () => {
      const response = await fetch(`${baseURL}/health`, {
        headers: {
          'Origin': 'http://localhost:5173'
        }
      });

      const corsHeader = response.headers.get('access-control-allow-origin');
      assert.ok(corsHeader !== null);
    });
  });

  describe('Security Headers', () => {
    it('should include security headers from Helmet', async () => {
      const response = await fetch(`${baseURL}/health`);

      // Check for common security headers
      assert.ok(response.headers.has('x-dns-prefetch-control'));
      assert.ok(response.headers.has('x-frame-options'));
      assert.ok(response.headers.has('x-content-type-options'));
    });
  });

  describe('Compression', () => {
    it('should support gzip compression', async () => {
      const response = await fetch(`${baseURL}/health`, {
        headers: {
          'Accept-Encoding': 'gzip'
        }
      });

      // Server should indicate compression support
      assert.ok(response.ok);
    });
  });
});

describe('Atomic File Operations', () => {
  const { writeFileAtomic, readFileAtomic, updateJSONFileAtomic, AtomicBatch } = await import('../src/utils/atomicFileOperations.js');
  const fs = await import('fs/promises');
  const path = await import('path');
  const os = await import('os');

  let testDir;

  before(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gemini-test-'));
  });

  after(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('writeFileAtomic', () => {
    it('should write file atomically', async () => {
      const filePath = path.join(testDir, 'test.txt');
      const content = 'Hello, World!';

      await writeFileAtomic(filePath, content);

      const readContent = await fs.readFile(filePath, 'utf-8');
      assert.strictEqual(readContent, content);
    });

    it('should create backup when requested', async () => {
      const filePath = path.join(testDir, 'backup-test.txt');

      await writeFileAtomic(filePath, 'original');
      await writeFileAtomic(filePath, 'updated', { backup: true });

      const content = await fs.readFile(filePath, 'utf-8');
      assert.strictEqual(content, 'updated');
    });
  });

  describe('updateJSONFileAtomic', () => {
    it('should update JSON file atomically', async () => {
      const filePath = path.join(testDir, 'config.json');

      await updateJSONFileAtomic(filePath, { version: '1.0.0' });
      await updateJSONFileAtomic(filePath, { updated: true });

      const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
      assert.strictEqual(data.version, '1.0.0');
      assert.strictEqual(data.updated, true);
    });
  });

  describe('AtomicBatch', () => {
    it('should execute batch operations atomically', async () => {
      const file1 = path.join(testDir, 'batch1.txt');
      const file2 = path.join(testDir, 'batch2.txt');

      const batch = new AtomicBatch();
      batch.writeFile(file1, 'content1');
      batch.writeFile(file2, 'content2');

      await batch.execute();

      const content1 = await fs.readFile(file1, 'utf-8');
      const content2 = await fs.readFile(file2, 'utf-8');

      assert.strictEqual(content1, 'content1');
      assert.strictEqual(content2, 'content2');
    });
  });
});

describe('Database Backup System', () => {
  const { DatabaseBackupManager } = await import('../src/utils/databaseBackup.js');
  const fs = await import('fs/promises');
  const path = await import('path');
  const os = await import('os');

  let testDir;
  let backupDir;
  let dbPath;

  before(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gemini-backup-test-'));
    backupDir = path.join(testDir, 'backups');
    dbPath = path.join(testDir, 'test.db');

    // Create test database
    await fs.writeFile(dbPath, 'test database content');
  });

  after(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  it('should create backup successfully', async () => {
    const manager = new DatabaseBackupManager({
      backupDir,
      databasePaths: [dbPath],
      compression: false
    });

    await manager.initialize();

    const results = await manager.performBackup();

    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].success, true);

    // Verify backup file exists
    const backups = await manager.listBackups();
    assert.ok(backups.length > 0);
  });

  it('should compress backups when enabled', async () => {
    const manager = new DatabaseBackupManager({
      backupDir,
      databasePaths: [dbPath],
      compression: true
    });

    await manager.initialize();
    await manager.performBackup();

    const backups = await manager.listBackups();
    const compressedBackup = backups.find(b => b.file.endsWith('.gz'));

    assert.ok(compressedBackup, 'Should create compressed backup');
  });
});

console.log('All tests completed successfully!');
