/**
 * Workflow API Routes
 * 
 * RESTful API endpoints for workflow management
 */

import express from 'express';
import {
  getWorkflows,
  getWorkflow,
  addWorkflow,
  modifyWorkflow,
  removeWorkflow,
  getWorkflowsByStatus,
  executeWorkflow
} from '../services/WorkflowService.js';

const router = express.Router();

/**
 * GET /api/workflows
 * Get all workflows
 */
router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    
    let workflows;
    if (status) {
      workflows = await getWorkflowsByStatus(status);
    } else {
      workflows = await getWorkflows();
    }
    
    res.json({
      success: true,
      data: workflows,
      count: workflows.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/workflows/:id
 * Get workflow by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const workflow = await getWorkflow(id);
    
    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found'
      });
    }
    
    res.json({
      success: true,
      data: workflow
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/workflows
 * Create new workflow
 */
router.post('/', async (req, res, next) => {
  try {
    const workflowData = req.body;
    const workflow = await addWorkflow(workflowData);
    
    res.status(201).json({
      success: true,
      data: workflow,
      message: 'Workflow created successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/workflows/:id
 * Update workflow
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const workflow = await modifyWorkflow(id, updates);
    
    res.json({
      success: true,
      data: workflow,
      message: 'Workflow updated successfully'
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    next(error);
  }
});

/**
 * DELETE /api/workflows/:id
 * Delete workflow
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await removeWorkflow(id);
    
    res.json({
      success: true,
      message: 'Workflow deleted successfully'
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    next(error);
  }
});

/**
 * POST /api/workflows/:id/execute
 * Execute workflow
 */
router.post('/:id/execute', async (req, res, next) => {
  try {
    const { id } = req.params;
    const context = req.body;
    
    const result = await executeWorkflow(id, context);
    
    res.json({
      success: true,
      data: result,
      message: 'Workflow executed successfully'
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    next(error);
  }
});

export default router;
