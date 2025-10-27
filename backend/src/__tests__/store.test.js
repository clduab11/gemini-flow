/**
 * Integration Tests for Store Routes
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import storeRoutes from '../api/routes/store.js';
import { LIMITS } from '../config/limits.js';

// Create test app
let app;

beforeAll(() => {
  app = express();
  app.use(express.json({ limit: LIMITS.MAX_REQUEST_SIZE, strict: true }));
  app.use('/api/store', storeRoutes);
});

describe('PUT /api/store - Store State Validation', () => {
  it('should accept a valid store state', async () => {
    const store = {
      viewport: { zoom: 1, x: 0, y: 0 },
      selectedNodes: ['node1', 'node2']
    };

    const res = await request(app)
      .put('/api/store')
      .send(store)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.store).toBeDefined();
  });

  it('should reject store with invalid viewport zoom (too low)', async () => {
    const store = {
      viewport: { zoom: 0.05, x: 0, y: 0 },
      selectedNodes: []
    };

    const res = await request(app)
      .put('/api/store')
      .send(store)
      .expect(400);

    expect(res.body.error.message).toBe('Store validation failed');
    expect(res.body.error.details.some(d => d.includes('Invalid viewport zoom'))).toBe(true);
  });

  it('should reject store with invalid viewport zoom (too high)', async () => {
    const store = {
      viewport: { zoom: 15, x: 0, y: 0 },
      selectedNodes: []
    };

    const res = await request(app)
      .put('/api/store')
      .send(store)
      .expect(400);

    expect(res.body.error.details.some(d => d.includes('Invalid viewport zoom'))).toBe(true);
  });

  it('should accept store with zoom at minimum limit', async () => {
    const store = {
      viewport: { zoom: LIMITS.MIN_VIEWPORT_ZOOM, x: 0, y: 0 },
      selectedNodes: []
    };

    const res = await request(app)
      .put('/api/store')
      .send(store)
      .expect(200);

    expect(res.body.success).toBe(true);
  });

  it('should accept store with zoom at maximum limit', async () => {
    const store = {
      viewport: { zoom: LIMITS.MAX_VIEWPORT_ZOOM, x: 0, y: 0 },
      selectedNodes: []
    };

    const res = await request(app)
      .put('/api/store')
      .send(store)
      .expect(200);

    expect(res.body.success).toBe(true);
  });

  it('should reject store with non-numeric zoom', async () => {
    const store = {
      viewport: { zoom: 'invalid', x: 0, y: 0 },
      selectedNodes: []
    };

    const res = await request(app)
      .put('/api/store')
      .send(store)
      .expect(400);

    expect(res.body.error.details.some(d => d.includes('Viewport zoom must be a number'))).toBe(true);
  });

  it('should reject store with too many selected nodes', async () => {
    const store = {
      viewport: { zoom: 1, x: 0, y: 0 },
      selectedNodes: Array(LIMITS.MAX_NODES + 1).fill('node')
    };

    const res = await request(app)
      .put('/api/store')
      .send(store)
      .expect(400);

    expect(res.body.error.details.some(d => d.includes('Too many selected nodes'))).toBe(true);
  });

  it('should accept store with selected nodes at limit', async () => {
    const store = {
      viewport: { zoom: 1, x: 0, y: 0 },
      selectedNodes: Array(LIMITS.MAX_NODES).fill('node')
    };

    const res = await request(app)
      .put('/api/store')
      .send(store)
      .expect(200);

    expect(res.body.success).toBe(true);
  });

  it('should reject store with deeply nested structure', async () => {
    let deepData = { value: 1 };
    for (let i = 0; i < LIMITS.MAX_NESTED_DEPTH + 1; i++) {
      deepData = { nested: deepData };
    }

    const store = {
      viewport: { zoom: 1, x: 0, y: 0 },
      customData: deepData
    };

    const res = await request(app)
      .put('/api/store')
      .send(store)
      .expect(400);

    expect(res.body.error.details.some(d => d.includes('too deeply nested'))).toBe(true);
  });

  it('should reject store with non-array selected nodes', async () => {
    const store = {
      viewport: { zoom: 1, x: 0, y: 0 },
      selectedNodes: 'not-an-array'
    };

    const res = await request(app)
      .put('/api/store')
      .send(store)
      .expect(400);

    expect(res.body.error.details).toContain(
      'Selected nodes must be an array'
    );
  });

  it('should reject store with non-object viewport', async () => {
    const store = {
      viewport: 'not-an-object',
      selectedNodes: []
    };

    const res = await request(app)
      .put('/api/store')
      .send(store)
      .expect(400);

    expect(res.body.error.details).toContain('Viewport must be an object');
  });
});

describe('GET /api/store', () => {
  it('should return store state', async () => {
    const res = await request(app)
      .get('/api/store')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.store).toBeDefined();
  });
});

describe('POST /api/store/reset', () => {
  it('should reset store state', async () => {
    const res = await request(app)
      .post('/api/store/reset')
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.store).toBeDefined();
    expect(res.body.store.viewport.zoom).toBe(1);
  });
});
