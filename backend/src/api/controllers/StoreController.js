/**
 * Store Controller
 *
 * Handles HTTP requests for store sync operations.
 * Integrates with StoreService and WebSocket broadcasting.
 *
 * Sprint 7: Backend API Implementation
 */

import * as storeService from '../services/StoreService.js';
import websocketService from '../../websocket/server.js';
import { createSuccessResponse, asyncHandler } from '../middleware/errorHandler.js';

/**
 * Get current store state
 * GET /api/store/state
 */
export const getStoreState = asyncHandler(async (req, res) => {
  const state = await storeService.getStoreState();
  res.json(createSuccessResponse(state));
});

/**
 * Update store state
 * PUT /api/store/state
 */
export const updateStoreState = asyncHandler(async (req, res) => {
  const state = await storeService.updateStoreState(req.body, {
    onUpdated: (updated) => {
      websocketService.broadcastStoreUpdated(updated);
    }
  });

  res.json(createSuccessResponse(state));
});

/**
 * Set nodes
 * PUT /api/store/nodes
 */
export const setNodes = asyncHandler(async (req, res) => {
  const state = await storeService.setNodes(req.body.nodes, {
    onUpdated: (updated) => {
      websocketService.broadcastStoreUpdated(updated);
    }
  });

  res.json(createSuccessResponse(state));
});

/**
 * Set edges
 * PUT /api/store/edges
 */
export const setEdges = asyncHandler(async (req, res) => {
  const state = await storeService.setEdges(req.body.edges, {
    onUpdated: (updated) => {
      websocketService.broadcastStoreUpdated(updated);
    }
  });

  res.json(createSuccessResponse(state));
});

/**
 * Add node
 * POST /api/store/nodes
 */
export const addNode = asyncHandler(async (req, res) => {
  const state = await storeService.addNode(req.body.node, {
    onUpdated: (updated) => {
      websocketService.broadcastStoreUpdated(updated);
    }
  });

  res.status(201).json(createSuccessResponse(state));
});

/**
 * Update node
 * PATCH /api/store/nodes/:id
 */
export const updateNode = asyncHandler(async (req, res) => {
  const state = await storeService.updateNode(req.params.id, req.body.updates, {
    onUpdated: (updated) => {
      websocketService.broadcastStoreUpdated(updated);
    }
  });

  res.json(createSuccessResponse(state));
});

/**
 * Delete node
 * DELETE /api/store/nodes/:id
 */
export const deleteNode = asyncHandler(async (req, res) => {
  const state = await storeService.deleteNode(req.params.id, {
    onUpdated: (updated) => {
      websocketService.broadcastStoreUpdated(updated);
    }
  });

  res.json(createSuccessResponse(state));
});

/**
 * Add edge
 * POST /api/store/edges
 */
export const addEdge = asyncHandler(async (req, res) => {
  const state = await storeService.addEdge(req.body.edge, {
    onUpdated: (updated) => {
      websocketService.broadcastStoreUpdated(updated);
    }
  });

  res.status(201).json(createSuccessResponse(state));
});

/**
 * Delete edge
 * DELETE /api/store/edges/:id
 */
export const deleteEdge = asyncHandler(async (req, res) => {
  const state = await storeService.deleteEdge(req.params.id, {
    onUpdated: (updated) => {
      websocketService.broadcastStoreUpdated(updated);
    }
  });

  res.json(createSuccessResponse(state));
});

/**
 * Load workflow into store
 * POST /api/store/workflow
 */
export const loadWorkflow = asyncHandler(async (req, res) => {
  const state = await storeService.loadWorkflowIntoStore(req.body, {
    onUpdated: (updated) => {
      websocketService.broadcastStoreUpdated(updated);
    }
  });

  res.json(createSuccessResponse(state));
});

/**
 * Clear store
 * POST /api/store/clear
 */
export const clearStore = asyncHandler(async (req, res) => {
  const state = await storeService.clearStore({
    onUpdated: (updated) => {
      websocketService.broadcastStoreUpdated(updated);
    }
  });

  res.json(createSuccessResponse(state));
});

/**
 * Sync workflow to store
 * POST /api/store/sync
 */
export const syncWorkflow = asyncHandler(async (req, res) => {
  const { workflowId } = req.body;

  if (!workflowId) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'workflowId required in request body'
      },
      timestamp: new Date().toISOString()
    });
  }

  const state = await storeService.syncWorkflowToStore(workflowId, {
    onSynced: (updatedState, workflow) => {
      websocketService.broadcastStoreSynced(updatedState, workflow);
    }
  });

  res.json(createSuccessResponse(state));
});

export default {
  getStoreState,
  updateStoreState,
  setNodes,
  setEdges,
  addNode,
  updateNode,
  deleteNode,
  addEdge,
  deleteEdge,
  loadWorkflow,
  clearStore,
  syncWorkflow
};
