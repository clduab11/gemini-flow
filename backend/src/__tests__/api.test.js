/**
 * API Integration Tests
 * 
 * Tests for the REST API endpoints to ensure proper integration
 * with the atomic database layer
 */

import request from 'supertest';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set test database directory
const TEST_DB_DIR = join(__dirname, '../../test-data-api');
process.env.DB_DIR = TEST_DB_DIR;

// Import after setting env
import workflowRoutes from '../api/routes/workflows.js';
import storeRoutes from '../api/routes/store.js';
import sessionRoutes from '../api/routes/sessions.js';
import { db } from '../db/database.js';

// Create test app
const app = express();
app.use(express.json());
app.use('/api/workflows', workflowRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/sessions', sessionRoutes);

// Error handler
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});

describe('API Integration Tests', () => {
  beforeEach(() => {
    // Clear all tables before each test
    if (db) {
      db.prepare('DELETE FROM workflows').run();
      db.prepare('DELETE FROM sessions').run();
      db.prepare('DELETE FROM store_state').run();
    }
  });

  describe('Workflow API', () => {
    test('POST /api/workflows - should create workflow', async () => {
      const workflow = {
        name: 'Test Workflow',
        description: 'Test Description',
        nodes: [{ id: '1', type: 'start' }],
        edges: []
      };

      const response = await request(app)
        .post('/api/workflows')
        .send(workflow)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test Workflow');
      expect(response.body.data.metadata.id).toBeDefined();
    });

    test('GET /api/workflows - should get all workflows', async () => {
      // Create test workflows
      await request(app)
        .post('/api/workflows')
        .send({ name: 'W1', nodes: [], edges: [] });
      
      await request(app)
        .post('/api/workflows')
        .send({ name: 'W2', nodes: [], edges: [] });

      const response = await request(app)
        .get('/api/workflows')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.count).toBe(2);
    });

    test('GET /api/workflows/:id - should get workflow by id', async () => {
      const created = await request(app)
        .post('/api/workflows')
        .send({ name: 'Test', nodes: [], edges: [] });

      const id = created.body.data.metadata.id;

      const response = await request(app)
        .get(`/api/workflows/${id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Test');
    });

    test('PUT /api/workflows/:id - should update workflow', async () => {
      const created = await request(app)
        .post('/api/workflows')
        .send({ name: 'Original', nodes: [], edges: [] });

      const id = created.body.data.metadata.id;

      const response = await request(app)
        .put(`/api/workflows/${id}`)
        .send({ name: 'Updated' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated');
    });

    test('DELETE /api/workflows/:id - should delete workflow', async () => {
      const created = await request(app)
        .post('/api/workflows')
        .send({ name: 'To Delete', nodes: [], edges: [] });

      const id = created.body.data.metadata.id;

      await request(app)
        .delete(`/api/workflows/${id}`)
        .expect(200);

      // Should not exist
      await request(app)
        .get(`/api/workflows/${id}`)
        .expect(404);
    });

    test('POST /api/workflows/:id/execute - should execute workflow', async () => {
      const created = await request(app)
        .post('/api/workflows')
        .send({ name: 'Execute Test', nodes: [], edges: [] });

      const id = created.body.data.metadata.id;

      const response = await request(app)
        .post(`/api/workflows/${id}/execute`)
        .send({ context: { test: 'data' } })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.workflowId).toBe(id);
    });

    test('should handle concurrent workflow updates (race condition test)', async () => {
      const created = await request(app)
        .post('/api/workflows')
        .send({ name: 'Concurrent Test', nodes: [], edges: [] });

      const id = created.body.data.metadata.id;

      // Simulate concurrent updates
      const updates = [];
      for (let i = 0; i < 5; i++) {
        updates.push(
          request(app)
            .put(`/api/workflows/${id}`)
            .send({ description: `Update ${i}` })
        );
      }

      const responses = await Promise.all(updates);

      // All should succeed
      responses.forEach(res => {
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      });

      // Workflow should still be valid
      const final = await request(app)
        .get(`/api/workflows/${id}`)
        .expect(200);

      expect(final.body.data.description).toBeDefined();
    });
  });

  describe('Store API', () => {
    test('POST /api/store - should update store state', async () => {
      const response = await request(app)
        .post('/api/store')
        .send({ key1: 'value1', key2: { nested: 'value' } })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.key1).toBe('value1');
      expect(response.body.data.key2.nested).toBe('value');
    });

    test('GET /api/store - should get store state', async () => {
      await request(app)
        .post('/api/store')
        .send({ test: 'data' });

      const response = await request(app)
        .get('/api/store')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.test).toBe('data');
    });

    test('GET /api/store/:key - should get value by key', async () => {
      await request(app)
        .post('/api/store')
        .send({ mykey: 'myvalue' });

      const response = await request(app)
        .get('/api/store/mykey')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBe('myvalue');
    });

    test('PUT /api/store/:key - should set single value', async () => {
      const response = await request(app)
        .put('/api/store/newkey')
        .send({ value: 'newvalue' })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify it was set
      const get = await request(app)
        .get('/api/store/newkey')
        .expect(200);

      expect(get.body.data).toBe('newvalue');
    });

    test('DELETE /api/store/:key - should delete value', async () => {
      await request(app)
        .post('/api/store')
        .send({ deleteMe: 'value' });

      await request(app)
        .delete('/api/store/deleteMe')
        .expect(200);

      // Should not exist
      await request(app)
        .get('/api/store/deleteMe')
        .expect(404);
    });

    test('should support multiple namespaces', async () => {
      await request(app)
        .post('/api/store?namespace=ns1')
        .send({ key: 'value1' });

      await request(app)
        .post('/api/store?namespace=ns2')
        .send({ key: 'value2' });

      const ns1 = await request(app)
        .get('/api/store?namespace=ns1')
        .expect(200);

      const ns2 = await request(app)
        .get('/api/store?namespace=ns2')
        .expect(200);

      expect(ns1.body.data.key).toBe('value1');
      expect(ns2.body.data.key).toBe('value2');
    });
  });

  describe('Session API', () => {
    test('POST /api/sessions - should create session', async () => {
      const response = await request(app)
        .post('/api/sessions')
        .send({ data: { test: 'data' } })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.data.test).toBe('data');
    });

    test('GET /api/sessions - should get all sessions', async () => {
      await request(app)
        .post('/api/sessions')
        .send({ data: { s1: 'data' } });

      await request(app)
        .post('/api/sessions')
        .send({ data: { s2: 'data' } });

      const response = await request(app)
        .get('/api/sessions')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    test('GET /api/sessions/:id - should get session by id', async () => {
      const created = await request(app)
        .post('/api/sessions')
        .send({ data: { test: 'data' } });

      const id = created.body.data.id;

      const response = await request(app)
        .get(`/api/sessions/${id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data.test).toBe('data');
    });

    test('PUT /api/sessions/:id - should update session', async () => {
      const created = await request(app)
        .post('/api/sessions')
        .send({ data: { original: 'data' } });

      const id = created.body.data.id;

      const response = await request(app)
        .put(`/api/sessions/${id}`)
        .send({ data: { updated: 'data' } })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.data.updated).toBe('data');
    });

    test('POST /api/sessions/:id/extend - should extend session', async () => {
      const created = await request(app)
        .post('/api/sessions')
        .send({ data: {}, expiresAt: Date.now() + 1000 });

      const id = created.body.data.id;

      const response = await request(app)
        .post(`/api/sessions/${id}/extend`)
        .send({ extensionMs: 5000 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.expiresAt).toBeGreaterThan(created.body.data.expiresAt);
    });

    test('POST /api/sessions/:id/terminate - should terminate session', async () => {
      const created = await request(app)
        .post('/api/sessions')
        .send({ data: {} });

      const id = created.body.data.id;

      const response = await request(app)
        .post(`/api/sessions/${id}/terminate`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('terminated');
    });
  });

  describe('Race Condition Tests', () => {
    test('concurrent store updates should not lose data', async () => {
      // Update same namespace concurrently
      const updates = [];
      for (let i = 0; i < 10; i++) {
        updates.push(
          request(app)
            .post('/api/store')
            .send({ [`key${i}`]: `value${i}` })
        );
      }

      const responses = await Promise.all(updates);

      // All should succeed
      responses.forEach(res => {
        expect(res.status).toBe(200);
      });

      // All keys should be present
      const state = await request(app)
        .get('/api/store')
        .expect(200);

      expect(Object.keys(state.body.data).length).toBe(10);
    });
  });
});
