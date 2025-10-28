/**
 * Workflow Service - Business logic for workflow operations
 *
 * Handles all workflow CRUD operations, validation, and business rules.
 * Integrates with database layer and broadcasts events via WebSocket.
 *
 * Sprint 7: Backend API Implementation
 */

import * as db from '../../db/database.js';
import { validateWorkflow, sanitizeWorkflow, createWorkflow } from '../models/Workflow.js';

/**
 * Get all workflows
 * @param {Object} [options] - Query options
 * @param {string[]} [options.tags] - Filter by tags
 * @param {string} [options.search] - Search in name and description
 * @param {number} [options.limit] - Limit number of results
 * @param {number} [options.offset] - Offset for pagination
 * @returns {Promise<{ workflows: Array, total: number }>}
 */
export async function getAllWorkflows(options = {}) {
  try {
    let workflows = await db.getAllWorkflows();

    // Filter by tags
    if (options.tags && options.tags.length > 0) {
      workflows = workflows.filter(w =>
        options.tags.some(tag => w.metadata.tags?.includes(tag))
      );
    }

    // Search filter
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      workflows = workflows.filter(w =>
        w.metadata.name.toLowerCase().includes(searchLower) ||
        w.metadata.description?.toLowerCase().includes(searchLower)
      );
    }

    const total = workflows.length;

    // Pagination
    if (options.offset !== undefined) {
      workflows = workflows.slice(options.offset);
    }
    if (options.limit !== undefined) {
      workflows = workflows.slice(0, options.limit);
    }

    return { workflows, total };
  } catch (error) {
    throw new Error(`Failed to get workflows: ${error.message}`);
  }
}

/**
 * Get workflow by ID
 * @param {string} id - Workflow ID
 * @returns {Promise<Object|null>}
 */
export async function getWorkflowById(id) {
  try {
    const workflow = await db.getWorkflowById(id);
    return workflow;
  } catch (error) {
    throw new Error(`Failed to get workflow: ${error.message}`);
  }
}

/**
 * Create new workflow
 * @param {Object} workflowData - Workflow data
 * @param {Object} [options] - Creation options
 * @param {Function} [options.onCreated] - Callback after creation
 * @returns {Promise<Object>}
 */
export async function createNewWorkflow(workflowData, options = {}) {
  try {
    // Create workflow with defaults if minimal data provided
    let workflow;
    if (!workflowData.metadata) {
      workflow = createWorkflow(workflowData.name || 'Untitled Workflow', {
        description: workflowData.description,
        author: workflowData.author,
        tags: workflowData.tags,
        nodes: workflowData.nodes,
        edges: workflowData.edges
      });
    } else {
      workflow = workflowData;
    }

    // Validate workflow
    const validation = validateWorkflow(workflow);
    if (!validation.valid) {
      throw new Error(`Invalid workflow: ${validation.errors.join(', ')}`);
    }

    // Sanitize workflow
    const sanitized = sanitizeWorkflow(workflow);

    // Save to database
    const created = await db.createWorkflow(sanitized);

    // Callback for broadcasting event
    if (options.onCreated) {
      options.onCreated(created);
    }

    return created;
  } catch (error) {
    throw new Error(`Failed to create workflow: ${error.message}`);
  }
}

/**
 * Update existing workflow
 * @param {string} id - Workflow ID
 * @param {Object} updates - Workflow updates
 * @param {Object} [options] - Update options
 * @param {Function} [options.onUpdated] - Callback after update
 * @returns {Promise<Object>}
 */
export async function updateExistingWorkflow(id, updates, options = {}) {
  try {
    // Get existing workflow
    const existing = await db.getWorkflowById(id);
    if (!existing) {
      throw new Error(`Workflow not found: ${id}`);
    }

    // Merge updates
    const merged = {
      ...existing,
      ...updates,
      metadata: {
        ...existing.metadata,
        ...updates.metadata,
        id: existing.metadata.id, // Preserve ID
        createdAt: existing.metadata.createdAt, // Preserve creation time
        updatedAt: Date.now() // Update timestamp
      }
    };

    // Validate merged workflow
    const validation = validateWorkflow(merged);
    if (!validation.valid) {
      throw new Error(`Invalid workflow update: ${validation.errors.join(', ')}`);
    }

    // Sanitize
    const sanitized = sanitizeWorkflow(merged);

    // Update in database
    const updated = await db.updateWorkflow(id, sanitized);

    // Callback for broadcasting event
    if (options.onUpdated) {
      options.onUpdated(updated);
    }

    return updated;
  } catch (error) {
    throw new Error(`Failed to update workflow: ${error.message}`);
  }
}

/**
 * Delete workflow
 * @param {string} id - Workflow ID
 * @param {Object} [options] - Deletion options
 * @param {Function} [options.onDeleted] - Callback after deletion
 * @returns {Promise<Object>}
 */
export async function deleteExistingWorkflow(id, options = {}) {
  try {
    const deleted = await db.deleteWorkflow(id);

    // Callback for broadcasting event
    if (options.onDeleted) {
      options.onDeleted(deleted);
    }

    return deleted;
  } catch (error) {
    throw new Error(`Failed to delete workflow: ${error.message}`);
  }
}

/**
 * Import workflow from JSON/YAML
 * @param {Object} workflowData - Workflow data to import
 * @param {Object} [options] - Import options
 * @param {boolean} [options.overwrite] - Overwrite if exists
 * @param {boolean} [options.generateNewId] - Generate new ID
 * @returns {Promise<Object>}
 */
export async function importWorkflow(workflowData, options = {}) {
  try {
    let workflow = workflowData;

    // Generate new ID if requested
    if (options.generateNewId) {
      workflow = {
        ...workflow,
        metadata: {
          ...workflow.metadata,
          id: `workflow-${Date.now()}`,
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      };
    }

    // Check if workflow exists
    const existing = await db.getWorkflowById(workflow.metadata.id);

    if (existing && !options.overwrite) {
      throw new Error(`Workflow with ID ${workflow.metadata.id} already exists. Use overwrite option to replace.`);
    }

    // Validate
    const validation = validateWorkflow(workflow);
    if (!validation.valid) {
      throw new Error(`Invalid workflow: ${validation.errors.join(', ')}`);
    }

    // Sanitize
    const sanitized = sanitizeWorkflow(workflow);

    // Create or update
    let result;
    if (existing && options.overwrite) {
      result = await db.updateWorkflow(workflow.metadata.id, sanitized);
    } else {
      result = await db.createWorkflow(sanitized);
    }

    return result;
  } catch (error) {
    throw new Error(`Failed to import workflow: ${error.message}`);
  }
}

/**
 * Export workflow as JSON
 * @param {string} id - Workflow ID
 * @param {Object} [options] - Export options
 * @param {boolean} [options.includeMetadata] - Include metadata (default: true)
 * @param {boolean} [options.prettyPrint] - Pretty print JSON (default: true)
 * @returns {Promise<string>}
 */
export async function exportWorkflowAsJson(id, options = {}) {
  try {
    const workflow = await db.getWorkflowById(id);
    if (!workflow) {
      throw new Error(`Workflow not found: ${id}`);
    }

    const includeMetadata = options.includeMetadata !== false;
    const prettyPrint = options.prettyPrint !== false;

    const exportData = includeMetadata ? workflow : {
      nodes: workflow.nodes,
      edges: workflow.edges
    };

    return prettyPrint
      ? JSON.stringify(exportData, null, 2)
      : JSON.stringify(exportData);
  } catch (error) {
    throw new Error(`Failed to export workflow: ${error.message}`);
  }
}

/**
 * Get workflow statistics
 * @param {string} id - Workflow ID
 * @returns {Promise<Object>}
 */
export async function getWorkflowStats(id) {
  try {
    const workflow = await db.getWorkflowById(id);
    if (!workflow) {
      throw new Error(`Workflow not found: ${id}`);
    }

    return {
      id: workflow.metadata.id,
      name: workflow.metadata.name,
      nodeCount: workflow.nodes.length,
      edgeCount: workflow.edges.length,
      createdAt: workflow.metadata.createdAt,
      updatedAt: workflow.metadata.updatedAt,
      tags: workflow.metadata.tags || []
    };
  } catch (error) {
    throw new Error(`Failed to get workflow stats: ${error.message}`);
  }
}

export default {
  getAllWorkflows,
  getWorkflowById,
  createNewWorkflow,
  updateExistingWorkflow,
  deleteExistingWorkflow,
  importWorkflow,
  exportWorkflowAsJson,
  getWorkflowStats
};
