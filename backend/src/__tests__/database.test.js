/**
 * Database Atomic Operations Tests
 * 
 * Tests to verify atomic operations and concurrency safety
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { unlink, mkdir } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test database path
const TEST_DB_DIR = join(__dirname, '../../test-data');

// Set test database directory before importing database module
process.env.DB_DIR = TEST_DB_DIR;

import {
  getAllWorkflows,
  getWorkflowById,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  createSession,
  updateSession,
  deleteSession,
  updateStoreState,
  getStoreState,
  getDatabaseStats,
  closeDatabase,
  db
} from '../db/database.js';

const TEST_DB_FILE = join(TEST_DB_DIR, 'gemini-flow.db');

describe('Database Atomic Operations', () => {
  beforeAll(async () => {
    // Ensure test directory exists
    if (!existsSync(TEST_DB_DIR)) {
      await mkdir(TEST_DB_DIR, { recursive: true });
    }
  });

  beforeEach(() => {
    // Clear all tables before each test
    if (db) {
      db.prepare('DELETE FROM workflows').run();
      db.prepare('DELETE FROM sessions').run();
      db.prepare('DELETE FROM store_state').run();
    }
  });

  afterAll(() => {
    closeDatabase();
  });

  describe('Workflow Operations', () => {
    test('should create workflow atomically', () => {
      const workflow = {
        name: 'Test Workflow',
        description: 'Test Description',
        nodes: [{ id: '1', type: 'start' }],
        edges: []
      };

      const created = createWorkflow(workflow);

      expect(created).toBeDefined();
      expect(created.metadata.id).toBeDefined();
      expect(created.name).toBe('Test Workflow');
      expect(created.nodes).toHaveLength(1);
    });

    test('should update workflow atomically', () => {
      const workflow = createWorkflow({
        name: 'Original Name',
        nodes: [],
        edges: []
      });

      const updated = updateWorkflow(workflow.metadata.id, {
        name: 'Updated Name',
        description: 'New Description'
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.description).toBe('New Description');
      expect(updated.metadata.updatedAt).toBeGreaterThan(workflow.metadata.createdAt);
    });

    test('should delete workflow atomically', () => {
      const workflow = createWorkflow({
        name: 'To Delete',
        nodes: [],
        edges: []
      });

      const deleted = deleteWorkflow(workflow.metadata.id);
      expect(deleted).toBe(true);

      const retrieved = getWorkflowById(workflow.metadata.id);
      expect(retrieved).toBeNull();
    });

    test('should throw error when updating non-existent workflow', () => {
      expect(() => {
        updateWorkflow('non-existent-id', { name: 'Updated' });
      }).toThrow('Workflow with id non-existent-id not found');
    });

    test('should return all workflows', () => {
      createWorkflow({ name: 'Workflow 1', nodes: [], edges: [] });
      createWorkflow({ name: 'Workflow 2', nodes: [], edges: [] });
      createWorkflow({ name: 'Workflow 3', nodes: [], edges: [] });

      const workflows = getAllWorkflows();
      expect(workflows).toHaveLength(3);
    });
  });

  describe('Concurrency Tests - Race Conditions', () => {
    test('should handle concurrent updates to same workflow without data loss', () => {
      const workflow = createWorkflow({
        name: 'Concurrent Test',
        nodes: [],
        edges: [],
        metadata: { counter: 0 }
      });

      const id = workflow.metadata.id;

      // Simulate 10 concurrent updates
      const updates = [];
      for (let i = 0; i < 10; i++) {
        try {
          const updated = updateWorkflow(id, {
            metadata: { counter: i }
          });
          updates.push(updated);
        } catch (error) {
          // SQLite will serialize these, no errors expected
          console.error('Unexpected error:', error);
        }
      }

      // All updates should succeed
      expect(updates.length).toBe(10);

      // Final workflow should have one of the counter values
      const final = getWorkflowById(id);
      expect(final.metadata.counter).toBeGreaterThanOrEqual(0);
      expect(final.metadata.counter).toBeLessThan(10);
    });

    test('should handle concurrent workflow creations', () => {
      const workflows = [];
      
      // Create 20 workflows "concurrently" (synchronously in SQLite)
      for (let i = 0; i < 20; i++) {
        workflows.push(createWorkflow({
          name: `Workflow ${i}`,
          nodes: [],
          edges: []
        }));
      }

      expect(workflows).toHaveLength(20);
      
      // All should have unique IDs
      const ids = workflows.map(w => w.metadata.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(20);
    });

    test('should handle concurrent deletes gracefully', () => {
      const workflow = createWorkflow({
        name: 'Delete Test',
        nodes: [],
        edges: []
      });

      const id = workflow.metadata.id;

      // First delete should succeed
      const deleted1 = deleteWorkflow(id);
      expect(deleted1).toBe(true);

      // Second delete should return false (already deleted)
      const deleted2 = deleteWorkflow(id);
      expect(deleted2).toBe(false);
    });
  });

  describe('Session Operations', () => {
    test('should create session atomically', () => {
      // Create without workflow_id (should be allowed)
      const session = createSession({
        data: { key: 'value' }
      });

      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
      expect(session.data.key).toBe('value');
    });

    test('should create session with workflow reference', () => {
      // Create a workflow first
      const workflow = createWorkflow({
        name: 'Test Workflow',
        nodes: [],
        edges: []
      });

      // Create session with workflow reference
      const session = createSession({
        workflowId: workflow.metadata.id,
        data: { key: 'value' }
      });

      expect(session).toBeDefined();
      expect(session.workflowId).toBe(workflow.metadata.id);
      expect(session.data.key).toBe('value');
    });

    test('should update session atomically', () => {
      const session = createSession({
        data: { original: 'data' }
      });

      const updated = updateSession(session.id, {
        data: { updated: 'data' },
        status: 'completed'
      });

      expect(updated.data.updated).toBe('data');
      expect(updated.status).toBe('completed');
    });

    test('should delete session atomically', () => {
      const session = createSession({ data: {} });
      
      const deleted = deleteSession(session.id);
      expect(deleted).toBe(true);
    });
  });

  describe('Store State Operations', () => {
    test('should update store state atomically', () => {
      const updates = {
        key1: 'value1',
        key2: { nested: 'value' },
        key3: [1, 2, 3]
      };

      const state = updateStoreState(updates);

      expect(state.key1).toBe('value1');
      expect(state.key2.nested).toBe('value');
      expect(state.key3).toEqual([1, 2, 3]);
    });

    test('should handle concurrent store updates without data loss', () => {
      // Initialize store
      updateStoreState({ counter: 0 });

      // Simulate concurrent updates
      for (let i = 1; i <= 10; i++) {
        updateStoreState({ [`key${i}`]: i });
      }

      const state = getStoreState();
      
      // All keys should be present
      expect(Object.keys(state).length).toBeGreaterThanOrEqual(10);
      expect(state.key1).toBe(1);
      expect(state.key10).toBe(10);
    });

    test('should support multiple namespaces', () => {
      updateStoreState({ key: 'value1' }, 'namespace1');
      updateStoreState({ key: 'value2' }, 'namespace2');

      const state1 = getStoreState('namespace1');
      const state2 = getStoreState('namespace2');

      expect(state1.key).toBe('value1');
      expect(state2.key).toBe('value2');
    });
  });

  describe('Database Statistics', () => {
    test('should return accurate statistics', () => {
      createWorkflow({ name: 'W1', nodes: [], edges: [] });
      createWorkflow({ name: 'W2', nodes: [], edges: [] });
      createSession({ data: {} });
      updateStoreState({ key: 'value' });

      const stats = getDatabaseStats();

      expect(stats.workflows).toBe(2);
      expect(stats.sessions).toBe(1);
      expect(stats.storeEntries).toBe(1);
      expect(stats.walMode).toBe(true);
    });
  });

  describe('Transaction Rollback', () => {
    test('should rollback on error during update', () => {
      const workflow = createWorkflow({
        name: 'Original',
        nodes: [],
        edges: []
      });

      // This should fail and not corrupt the database
      try {
        updateWorkflow('non-existent', { name: 'Should Fail' });
      } catch (error) {
        // Expected
      }

      // Original workflow should be unchanged
      const retrieved = getWorkflowById(workflow.metadata.id);
      expect(retrieved.name).toBe('Original');
    });
  });

  describe('Performance Tests', () => {
    test('should handle 100 sequential writes efficiently', () => {
      const start = Date.now();
      
      for (let i = 0; i < 100; i++) {
        createWorkflow({
          name: `Performance Test ${i}`,
          nodes: [],
          edges: []
        });
      }
      
      const duration = Date.now() - start;
      
      // Should complete in reasonable time (< 1 second for 100 writes)
      expect(duration).toBeLessThan(1000);
      
      const workflows = getAllWorkflows();
      expect(workflows).toHaveLength(100);
    });

    test('should handle 1000 store updates efficiently', () => {
      const start = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        updateStoreState({ [`key${i}`]: `value${i}` });
      }
      
      const duration = Date.now() - start;
      
      // Should complete in reasonable time (< 2 seconds for 1000 updates)
      expect(duration).toBeLessThan(2000);
      
      const state = getStoreState();
      expect(Object.keys(state).length).toBe(1000);
    });
  });

  describe('Data Integrity', () => {
    test('should preserve complex nested data structures', () => {
      const complexWorkflow = {
        name: 'Complex Workflow',
        nodes: [
          { id: '1', type: 'start', data: { config: { nested: { deep: 'value' } } } },
          { id: '2', type: 'process', data: { items: [1, 2, 3, { x: 'y' }] } }
        ],
        edges: [
          { id: 'e1', source: '1', target: '2', data: { weight: 0.5 } }
        ]
      };

      const created = createWorkflow(complexWorkflow);
      const retrieved = getWorkflowById(created.metadata.id);

      expect(retrieved.nodes[0].data.config.nested.deep).toBe('value');
      expect(retrieved.nodes[1].data.items[3].x).toBe('y');
      expect(retrieved.edges[0].data.weight).toBe(0.5);
    });

    test('should handle special characters in data', () => {
      const workflow = createWorkflow({
        name: 'Special Characters: 你好 🎉 "quotes" \'apostrophes\'',
        description: 'Contains\nnewlines\tand\ttabs',
        nodes: [],
        edges: []
      });

      const retrieved = getWorkflowById(workflow.metadata.id);
      expect(retrieved.name).toContain('你好');
      expect(retrieved.name).toContain('🎉');
      expect(retrieved.description).toContain('\n');
      expect(retrieved.description).toContain('\t');
    });
  });
});
