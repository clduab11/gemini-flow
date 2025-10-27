/**
 * Workflow Service
 * 
 * Business logic layer for workflow operations.
 * All database operations are atomic via the database layer.
 */

import {
  getAllWorkflows,
  getWorkflowById,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow
} from '../../db/database.js';

/**
 * Get all workflows
 * @returns {Promise<Array>} Array of workflows
 */
export async function getWorkflows() {
  return getAllWorkflows();
}

/**
 * Get workflow by ID
 * @param {string} id - Workflow ID
 * @returns {Promise<Object|null>} Workflow or null
 */
export async function getWorkflow(id) {
  return getWorkflowById(id);
}

/**
 * Create new workflow
 * @param {Object} workflowData - Workflow data
 * @returns {Promise<Object>} Created workflow
 */
export async function addWorkflow(workflowData) {
  // Validate required fields
  if (!workflowData.name) {
    throw new Error('Workflow name is required');
  }

  return createWorkflow(workflowData);
}

/**
 * Update existing workflow
 * @param {string} id - Workflow ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated workflow
 */
export async function modifyWorkflow(id, updates) {
  return updateWorkflow(id, updates);
}

/**
 * Delete workflow
 * @param {string} id - Workflow ID
 * @returns {Promise<boolean>} True if deleted
 */
export async function removeWorkflow(id) {
  const deleted = deleteWorkflow(id);
  if (!deleted) {
    throw new Error(`Workflow with id ${id} not found`);
  }
  return true;
}

/**
 * Get workflows by status
 * @param {string} status - Status to filter by
 * @returns {Promise<Array>} Filtered workflows
 */
export async function getWorkflowsByStatus(status) {
  const workflows = getAllWorkflows();
  return workflows.filter(w => w.status === status);
}

/**
 * Execute a workflow
 * @param {string} id - Workflow ID
 * @param {Object} context - Execution context
 * @returns {Promise<Object>} Execution result
 */
export async function executeWorkflow(id, context = {}) {
  const workflow = getWorkflowById(id);
  
  if (!workflow) {
    throw new Error(`Workflow with id ${id} not found`);
  }

  // Update status to running
  await modifyWorkflow(id, { status: 'running' });

  try {
    // Execute workflow logic here
    // This is a placeholder for actual execution logic
    const result = {
      workflowId: id,
      status: 'completed',
      context,
      startTime: Date.now(),
      endTime: Date.now()
    };

    // Update status to completed
    await modifyWorkflow(id, { status: 'completed' });

    return result;
  } catch (error) {
    // Update status to failed
    await modifyWorkflow(id, { status: 'failed' });
    throw error;
  }
}
