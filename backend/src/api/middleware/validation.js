/**
 * Validation Middleware
 *
 * Request validation for workflow and store operations.
 *
 * Sprint 7: Backend API Implementation
 */

/**
 * Validate workflow ID parameter
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Express next function
 */
export function validateWorkflowId(req, res, next) {
  const id = req.params.id;

  if (!id || typeof id !== 'string' || id.length === 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid workflow ID'
      },
      timestamp: new Date().toISOString()
    });
  }

  // Prevent path traversal
  if (id.includes('..') || id.includes('/') || id.includes('\\')) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid workflow ID: contains dangerous characters'
      },
      timestamp: new Date().toISOString()
    });
  }

  next();
}

/**
 * Validate workflow data in request body
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Express next function
 */
export function validateWorkflowData(req, res, next) {
  const workflow = req.body;

  if (!workflow || typeof workflow !== 'object') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request body must contain workflow object'
      },
      timestamp: new Date().toISOString()
    });
  }

  // Basic validation (detailed validation done in service layer)
  if (!workflow.metadata && !workflow.name) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Workflow must have metadata or name'
      },
      timestamp: new Date().toISOString()
    });
  }

  next();
}

/**
 * Validate nodes array in request body
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Express next function
 */
export function validateNodesData(req, res, next) {
  const { nodes } = req.body;

  if (!nodes || !Array.isArray(nodes)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request body must contain nodes array'
      },
      timestamp: new Date().toISOString()
    });
  }

  next();
}

/**
 * Validate edges array in request body
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Express next function
 */
export function validateEdgesData(req, res, next) {
  const { edges } = req.body;

  if (!edges || !Array.isArray(edges)) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request body must contain edges array'
      },
      timestamp: new Date().toISOString()
    });
  }

  next();
}

export default {
  validateWorkflowId,
  validateWorkflowData,
  validateNodesData,
  validateEdgesData
};
