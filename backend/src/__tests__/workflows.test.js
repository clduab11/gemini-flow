/**
 * Integration Tests for Workflow Routes
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import workflowRoutes from '../api/routes/workflows.js';
import { LIMITS } from '../config/limits.js';

// Create test app
let app;

beforeAll(() => {
  app = express();
  app.use(express.json({ limit: LIMITS.MAX_REQUEST_SIZE, strict: true }));
  app.use('/api/workflows', workflowRoutes);
});

describe('POST /api/workflows - Workflow Validation', () => {
  it('should accept a valid workflow', async () => {
    const workflow = {
      nodes: [
        { id: 'node1', type: 'input', data: { label: 'Start' } },
        { id: 'node2', type: 'output', data: { label: 'End' } }
      ],
      edges: [
        { source: 'node1', target: 'node2' }
      ],
      metadata: {
        id: 'workflow-1',
        name: 'Test Workflow',
        description: 'A test workflow'
      }
    };

    const res = await request(app)
      .post('/api/workflows')
      .send(workflow)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.workflow).toBeDefined();
    expect(res.body.workflow.id).toBeDefined();
  });

  it('should reject workflow with too many nodes', async () => {
    const workflow = {
      nodes: Array(LIMITS.MAX_NODES + 1).fill(null).map((_, i) => ({
        id: `node${i}`,
        type: 'default',
        data: { label: `Node ${i}` }
      })),
      edges: [],
      metadata: { id: 'workflow-1' }
    };

    const res = await request(app)
      .post('/api/workflows')
      .send(workflow)
      .expect(400);

    expect(res.body.error).toBeDefined();
    expect(res.body.error.message).toBe('Workflow validation failed');
    expect(res.body.error.details.some(d => d.includes('Too many nodes'))).toBe(true);
  });

  it('should accept workflow at node limit', async () => {
    const workflow = {
      nodes: Array(LIMITS.MAX_NODES).fill(null).map((_, i) => ({
        id: `node${i}`,
        type: 'default',
        data: { label: `Node ${i}` }
      })),
      edges: [],
      metadata: { id: 'workflow-1' }
    };

    const res = await request(app)
      .post('/api/workflows')
      .send(workflow)
      .expect(201);

    expect(res.body.success).toBe(true);
  });

  it('should reject workflow with too many edges', async () => {
    const workflow = {
      nodes: [{ id: 'node1', type: 'default', data: { label: 'Node' } }],
      edges: Array(LIMITS.MAX_EDGES + 1).fill(null).map((_, i) => ({
        id: `edge${i}`,
        source: 'node1',
        target: 'node1'
      })),
      metadata: { id: 'workflow-1' }
    };

    const res = await request(app)
      .post('/api/workflows')
      .send(workflow)
      .expect(400);

    expect(res.body.error.details.some(d => d.includes('Too many edges'))).toBe(true);
  });

  it('should accept workflow at edge limit', async () => {
    const workflow = {
      nodes: [{ id: 'node1', type: 'default', data: { label: 'Node' } }],
      edges: Array(LIMITS.MAX_EDGES).fill(null).map((_, i) => ({
        id: `edge${i}`,
        source: 'node1',
        target: 'node1'
      })),
      metadata: { id: 'workflow-1' }
    };

    const res = await request(app)
      .post('/api/workflows')
      .send(workflow)
      .expect(201);

    expect(res.body.success).toBe(true);
  });

  it('should reject workflow with name too long', async () => {
    const workflow = {
      nodes: [],
      edges: [],
      metadata: {
        id: 'workflow-1',
        name: 'A'.repeat(LIMITS.MAX_NAME_LENGTH + 1)
      }
    };

    const res = await request(app)
      .post('/api/workflows')
      .send(workflow)
      .expect(400);

    expect(res.body.error.details.some(d => d.includes('Name too long'))).toBe(true);
  });

  it('should accept workflow with name at length limit', async () => {
    const workflow = {
      nodes: [],
      edges: [],
      metadata: {
        id: 'workflow-1',
        name: 'A'.repeat(LIMITS.MAX_NAME_LENGTH)
      }
    };

    const res = await request(app)
      .post('/api/workflows')
      .send(workflow)
      .expect(201);

    expect(res.body.success).toBe(true);
  });

  it('should reject workflow with description too long', async () => {
    const workflow = {
      nodes: [],
      edges: [],
      metadata: {
        id: 'workflow-1',
        description: 'A'.repeat(LIMITS.MAX_DESCRIPTION_LENGTH + 1)
      }
    };

    const res = await request(app)
      .post('/api/workflows')
      .send(workflow)
      .expect(400);

    expect(res.body.error.details.some(d => d.includes('Description too long'))).toBe(true);
  });

  it('should reject workflow with too many tags', async () => {
    const workflow = {
      nodes: [],
      edges: [],
      metadata: {
        id: 'workflow-1',
        tags: Array(LIMITS.MAX_TAGS + 1).fill('tag')
      }
    };

    const res = await request(app)
      .post('/api/workflows')
      .send(workflow)
      .expect(400);

    expect(res.body.error.details.some(d => d.includes('Too many tags'))).toBe(true);
  });

  it('should reject workflow with deeply nested node data', async () => {
    let deepData = { value: 1 };
    for (let i = 0; i < LIMITS.MAX_NESTED_DEPTH + 1; i++) {
      deepData = { nested: deepData };
    }

    const workflow = {
      nodes: [{
        id: 'node1',
        type: 'default',
        data: deepData
      }],
      edges: [],
      metadata: { id: 'workflow-1' }
    };

    const res = await request(app)
      .post('/api/workflows')
      .send(workflow)
      .expect(400);

    expect(res.body.error.details.some(d => d.includes('too deeply nested'))).toBe(true);
  });

  it('should reject workflow with non-array nodes', async () => {
    const workflow = {
      nodes: 'not-an-array',
      edges: [],
      metadata: { id: 'workflow-1' }
    };

    const res = await request(app)
      .post('/api/workflows')
      .send(workflow)
      .expect(400);

    expect(res.body.error.details).toContain('Nodes must be an array');
  });

  it('should reject workflow with non-array edges', async () => {
    const workflow = {
      nodes: [],
      edges: 'not-an-array',
      metadata: { id: 'workflow-1' }
    };

    const res = await request(app)
      .post('/api/workflows')
      .send(workflow)
      .expect(400);

    expect(res.body.error.details).toContain('Edges must be an array');
  });
});

describe('PUT /api/workflows/:id - Workflow Update Validation', () => {
  it('should validate workflow updates the same way as creation', async () => {
    const workflow = {
      nodes: Array(LIMITS.MAX_NODES + 1).fill(null).map((_, i) => ({
        id: `node${i}`,
        type: 'default',
        data: { label: `Node ${i}` }
      })),
      edges: [],
      metadata: { id: 'workflow-1' }
    };

    const res = await request(app)
      .put('/api/workflows/workflow-1')
      .send(workflow)
      .expect(400);

    expect(res.body.error.details.some(d => d.includes('Too many nodes'))).toBe(true);
  });
});
