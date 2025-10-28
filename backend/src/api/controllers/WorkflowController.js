/**
 * Workflow Controller
 *
 * Handles HTTP requests for workflow CRUD operations.
 * Integrates with WorkflowService and WebSocket broadcasting.
 *
 * Sprint 7: Backend API Implementation
 */

import * as workflowService from '../services/WorkflowService.js';
import websocketService from '../../websocket/server.js';
import { createSuccessResponse, asyncHandler } from '../middleware/errorHandler.js';

/**
 * Get all workflows
 * GET /api/workflows
 */
export const getAllWorkflows = asyncHandler(async (req, res) => {
  const options = {
    tags: req.query.tags ? req.query.tags.split(',') : undefined,
    search: req.query.search,
    limit: req.query.limit ? parseInt(req.query.limit) : undefined,
    offset: req.query.offset ? parseInt(req.query.offset) : undefined
  };

  const result = await workflowService.getAllWorkflows(options);
  res.json(createSuccessResponse(result));
});

/**
 * Get workflow by ID
 * GET /api/workflows/:id
 */
export const getWorkflowById = asyncHandler(async (req, res) => {
  const workflow = await workflowService.getWorkflowById(req.params.id);

  if (!workflow) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Workflow not found: ${req.params.id}`
      },
      timestamp: new Date().toISOString()
    });
  }

  res.json(createSuccessResponse(workflow));
});

/**
 * Create new workflow
 * POST /api/workflows
 */
export const createWorkflow = asyncHandler(async (req, res) => {
  const workflow = await workflowService.createNewWorkflow(req.body, {
    onCreated: (created) => {
      websocketService.broadcastWorkflowCreated(created);
    }
  });

  res.status(201).json(createSuccessResponse(workflow));
});

/**
 * Update workflow
 * PUT /api/workflows/:id
 */
export const updateWorkflow = asyncHandler(async (req, res) => {
  const workflow = await workflowService.updateExistingWorkflow(req.params.id, req.body, {
    onUpdated: (updated) => {
      websocketService.broadcastWorkflowUpdated(updated);
    }
  });

  res.json(createSuccessResponse(workflow));
});

/**
 * Delete workflow
 * DELETE /api/workflows/:id
 */
export const deleteWorkflow = asyncHandler(async (req, res) => {
  const workflow = await workflowService.deleteExistingWorkflow(req.params.id, {
    onDeleted: (deleted) => {
      websocketService.broadcastWorkflowDeleted(deleted);
    }
  });

  res.json(createSuccessResponse({ deleted: true, workflow }));
});

/**
 * Import workflow
 * POST /api/workflows/import
 */
export const importWorkflow = asyncHandler(async (req, res) => {
  const options = {
    overwrite: req.query.overwrite === 'true',
    generateNewId: req.query.generateNewId === 'true'
  };

  const workflow = await workflowService.importWorkflow(req.body, options);
  res.status(201).json(createSuccessResponse(workflow));
});

/**
 * Export workflow
 * GET /api/workflows/:id/export
 */
export const exportWorkflow = asyncHandler(async (req, res) => {
  const options = {
    includeMetadata: req.query.includeMetadata !== 'false',
    prettyPrint: req.query.prettyPrint !== 'false'
  };

  const json = await workflowService.exportWorkflowAsJson(req.params.id, options);

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="workflow-${req.params.id}.json"`);
  res.send(json);
});

export default {
  getAllWorkflows,
  getWorkflowById,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  importWorkflow,
  exportWorkflow
};
