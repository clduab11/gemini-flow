/**
 * Request Validation Middleware
 * 
 * Provides validation functions for workflow and store data complexity.
 * Prevents denial-of-service attacks through oversized or deeply nested payloads.
 */

import { LIMITS } from '../../config/limits.js';

/**
 * Calculate the nested depth of an object
 * @param {*} obj - Object to measure
 * @param {number} depth - Current depth level
 * @returns {number} Maximum depth found
 */
function getObjectDepth(obj, depth = 0) {
  // Safety cutoff to prevent infinite recursion
  if (depth > 20) return depth;
  
  // Base case: not an object or array
  if (!obj || typeof obj !== 'object') return depth;
  
  // Handle arrays
  if (Array.isArray(obj)) {
    if (obj.length === 0) return depth;
    const depths = obj.map(item => getObjectDepth(item, depth + 1));
    return Math.max(depth, ...depths);
  }
  
  // Handle objects
  const values = Object.values(obj);
  if (values.length === 0) return depth;
  
  const depths = values.map(value => getObjectDepth(value, depth + 1));
  return Math.max(depth, ...depths);
}

/**
 * Validate workflow data complexity
 * Middleware function for workflow endpoints
 */
export function validateWorkflowData(req, res, next) {
  const workflow = req.body;
  const errors = [];
  
  // Basic structure validation
  if (!workflow || typeof workflow !== 'object') {
    return res.status(400).json({
      error: {
        message: 'Invalid request body',
        details: ['Request body must be a valid object']
      }
    });
  }
  
  // Node count validation
  if (workflow.nodes) {
    if (!Array.isArray(workflow.nodes)) {
      errors.push('Nodes must be an array');
    } else if (workflow.nodes.length > LIMITS.MAX_NODES) {
      errors.push(`Too many nodes (max ${LIMITS.MAX_NODES}, received ${workflow.nodes.length})`);
    }
    
    // Node data complexity validation
    if (Array.isArray(workflow.nodes)) {
      for (let i = 0; i < workflow.nodes.length; i++) {
        const node = workflow.nodes[i];
        const nodeDepth = getObjectDepth(node);
        if (nodeDepth > LIMITS.MAX_NESTED_DEPTH) {
          errors.push(`Node at index ${i} is too deeply nested (max depth ${LIMITS.MAX_NESTED_DEPTH}, found ${nodeDepth})`);
          break; // Only report first occurrence to avoid flooding
        }
      }
    }
  }
  
  // Edge count validation
  if (workflow.edges) {
    if (!Array.isArray(workflow.edges)) {
      errors.push('Edges must be an array');
    } else if (workflow.edges.length > LIMITS.MAX_EDGES) {
      errors.push(`Too many edges (max ${LIMITS.MAX_EDGES}, received ${workflow.edges.length})`);
    }
  }
  
  // Metadata validation
  if (workflow.metadata) {
    // Name length validation
    if (workflow.metadata.name && typeof workflow.metadata.name === 'string') {
      if (workflow.metadata.name.length > LIMITS.MAX_NAME_LENGTH) {
        errors.push(`Name too long (max ${LIMITS.MAX_NAME_LENGTH} characters, received ${workflow.metadata.name.length})`);
      }
    }
    
    // Description length validation
    if (workflow.metadata.description && typeof workflow.metadata.description === 'string') {
      if (workflow.metadata.description.length > LIMITS.MAX_DESCRIPTION_LENGTH) {
        errors.push(`Description too long (max ${LIMITS.MAX_DESCRIPTION_LENGTH} characters, received ${workflow.metadata.description.length})`);
      }
    }
    
    // Tags validation
    if (workflow.metadata.tags) {
      if (!Array.isArray(workflow.metadata.tags)) {
        errors.push('Tags must be an array');
      } else if (workflow.metadata.tags.length > LIMITS.MAX_TAGS) {
        errors.push(`Too many tags (max ${LIMITS.MAX_TAGS}, received ${workflow.metadata.tags.length})`);
      }
    }
  }
  
  // Overall structure depth validation
  const overallDepth = getObjectDepth(workflow);
  if (overallDepth > LIMITS.MAX_NESTED_DEPTH) {
    errors.push(`Workflow structure too deeply nested (max depth ${LIMITS.MAX_NESTED_DEPTH}, found ${overallDepth})`);
  }
  
  // If there are validation errors, return 400
  if (errors.length > 0) {
    return res.status(400).json({
      error: {
        message: 'Workflow validation failed',
        details: errors
      }
    });
  }
  
  // Validation passed
  next();
}

/**
 * Validate store state data complexity
 * Middleware function for store endpoints
 */
export function validateStoreData(req, res, next) {
  const store = req.body;
  const errors = [];
  
  // Basic structure validation
  if (!store || typeof store !== 'object') {
    return res.status(400).json({
      error: {
        message: 'Invalid request body',
        details: ['Request body must be a valid object']
      }
    });
  }
  
  // Viewport validation
  if (store.viewport) {
    if (typeof store.viewport !== 'object') {
      errors.push('Viewport must be an object');
    } else {
      // Zoom validation
      if (store.viewport.zoom !== undefined) {
        if (typeof store.viewport.zoom !== 'number') {
          errors.push('Viewport zoom must be a number');
        } else if (store.viewport.zoom < LIMITS.MIN_VIEWPORT_ZOOM || 
                   store.viewport.zoom > LIMITS.MAX_VIEWPORT_ZOOM) {
          errors.push(`Invalid viewport zoom (must be between ${LIMITS.MIN_VIEWPORT_ZOOM} and ${LIMITS.MAX_VIEWPORT_ZOOM}, received ${store.viewport.zoom})`);
        }
      }
    }
  }
  
  // Selected nodes validation
  if (store.selectedNodes) {
    if (!Array.isArray(store.selectedNodes)) {
      errors.push('Selected nodes must be an array');
    } else if (store.selectedNodes.length > LIMITS.MAX_NODES) {
      errors.push(`Too many selected nodes (max ${LIMITS.MAX_NODES}, received ${store.selectedNodes.length})`);
    }
  }
  
  // Overall nested depth check
  const storeDepth = getObjectDepth(store);
  if (storeDepth > LIMITS.MAX_NESTED_DEPTH) {
    errors.push(`Store state too deeply nested (max depth ${LIMITS.MAX_NESTED_DEPTH}, found ${storeDepth})`);
  }
  
  // If there are validation errors, return 400
  if (errors.length > 0) {
    return res.status(400).json({
      error: {
        message: 'Store validation failed',
        details: errors
      }
    });
  }
  
  // Validation passed
  next();
}

/**
 * Generic payload size validation middleware
 * This is a backup check in addition to Express's built-in limit
 */
export function validatePayloadSize(req, res, next) {
  const contentLength = req.get('content-length');
  
  if (contentLength) {
    const sizeInMB = parseInt(contentLength) / (1024 * 1024);
    const maxMB = 1; // 1MB limit
    
    if (sizeInMB > maxMB) {
      return res.status(413).json({
        error: {
          message: 'Payload too large',
          details: [`Request size ${sizeInMB.toFixed(2)}MB exceeds limit of ${maxMB}MB`]
        }
      });
    }
  }
  
  next();
}

/**
 * Export the depth calculation function for testing
 */
export { getObjectDepth };
