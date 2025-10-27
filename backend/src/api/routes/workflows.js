/**
 * Workflow Routes
 *
 * REST API endpoints for workflow CRUD operations.
 *
 * Sprint 7: Backend API Implementation
 */

import express from 'express';
import * as workflowController from '../controllers/WorkflowController.js';
import { optionalApiKey } from '../middleware/auth.js';
import { validateWorkflowId, validateWorkflowData } from '../middleware/validation.js';
import { rateLimit } from '../middleware/rateLimit.js';

const router = express.Router();

// Apply middleware
router.use(optionalApiKey);
router.use(rateLimit);

/**
 * GET /api/workflows
 * Get all workflows
 * Query params: tags, search, limit, offset
 */
router.get('/', workflowController.getAllWorkflows);

/**
 * GET /api/workflows/:id
 * Get workflow by ID
 */
router.get('/:id', validateWorkflowId, workflowController.getWorkflowById);

/**
 * POST /api/workflows
 * Create new workflow
 */
router.post('/', validateWorkflowData, workflowController.createWorkflow);

/**
 * PUT /api/workflows/:id
 * Update workflow
 */
router.put('/:id', validateWorkflowId, validateWorkflowData, workflowController.updateWorkflow);

/**
 * DELETE /api/workflows/:id
 * Delete workflow
 */
router.delete('/:id', validateWorkflowId, workflowController.deleteWorkflow);

/**
 * POST /api/workflows/import
 * Import workflow
 * Query params: overwrite, generateNewId
 */
router.post('/import', validateWorkflowData, workflowController.importWorkflow);

/**
 * GET /api/workflows/:id/export
 * Export workflow as JSON
 * Query params: includeMetadata, prettyPrint
 */
router.get('/:id/export', validateWorkflowId, workflowController.exportWorkflow);

export default router;
