/**
 * Store Routes
 *
 * REST API endpoints for store state synchronization.
 *
 * Sprint 7: Backend API Implementation
 */

import express from 'express';
import * as storeController from '../controllers/StoreController.js';
import { optionalApiKey } from '../middleware/auth.js';
import { validateNodesData, validateEdgesData } from '../middleware/validation.js';
import { rateLimit } from '../middleware/rateLimit.js';

const router = express.Router();

// Apply middleware
router.use(optionalApiKey);
router.use(rateLimit);

/**
 * GET /api/store/state
 * Get current store state
 */
router.get('/state', storeController.getStoreState);

/**
 * PUT /api/store/state
 * Update store state
 */
router.put('/state', storeController.updateStoreState);

/**
 * PUT /api/store/nodes
 * Set all nodes
 */
router.put('/nodes', validateNodesData, storeController.setNodes);

/**
 * PUT /api/store/edges
 * Set all edges
 */
router.put('/edges', validateEdgesData, storeController.setEdges);

/**
 * POST /api/store/nodes
 * Add a node
 */
router.post('/nodes', storeController.addNode);

/**
 * PATCH /api/store/nodes/:id
 * Update a node
 */
router.patch('/nodes/:id', storeController.updateNode);

/**
 * DELETE /api/store/nodes/:id
 * Delete a node
 */
router.delete('/nodes/:id', storeController.deleteNode);

/**
 * POST /api/store/edges
 * Add an edge
 */
router.post('/edges', storeController.addEdge);

/**
 * DELETE /api/store/edges/:id
 * Delete an edge
 */
router.delete('/edges/:id', storeController.deleteEdge);

/**
 * POST /api/store/workflow
 * Load workflow into store
 */
router.post('/workflow', storeController.loadWorkflow);

/**
 * POST /api/store/clear
 * Clear store
 */
router.post('/clear', storeController.clearStore);

/**
 * POST /api/store/sync
 * Sync workflow to store
 */
router.post('/sync', storeController.syncWorkflow);

export default router;
