/**
 * Workflow Data Model
 *
 * Defines the structure and validation for workflow objects.
 * Compatible with Sprint 6 WORKFLOW_FORMAT.md specification.
 *
 * Sprint 7: Backend API Implementation
 */

/**
 * @typedef {Object} Position
 * @property {number} x - X coordinate
 * @property {number} y - Y coordinate
 */

/**
 * @typedef {Object} NodeData
 * @property {string} label - Node display label
 * @property {Object} [config] - Node configuration
 */

/**
 * @typedef {Object} WorkflowNode
 * @property {string} id - Unique node identifier
 * @property {string} [type] - Node type (input, output, default, or custom)
 * @property {Position} position - Node position on canvas
 * @property {NodeData} data - Node data payload
 * @property {boolean} [selected] - Whether node is selected
 * @property {boolean} [dragging] - Whether node is being dragged
 * @property {number} [width] - Node width in pixels
 * @property {number} [height] - Node height in pixels
 */

/**
 * @typedef {Object} WorkflowEdge
 * @property {string} id - Unique edge identifier
 * @property {string} source - Source node ID
 * @property {string} target - Target node ID
 * @property {string} [type] - Edge type (default, smoothstep, step, straight)
 * @property {boolean} [animated] - Whether edge is animated
 * @property {string} [label] - Edge display label
 * @property {boolean} [selected] - Whether edge is selected
 */

/**
 * @typedef {Object} WorkflowMetadata
 * @property {string} id - Unique workflow identifier
 * @property {string} name - Workflow name
 * @property {string} [description] - Workflow description
 * @property {string} version - Workflow version (semver)
 * @property {string} [author] - Workflow author
 * @property {number} createdAt - Creation timestamp (Unix ms)
 * @property {number} updatedAt - Last update timestamp (Unix ms)
 * @property {string[]} [tags] - Workflow tags
 */

/**
 * @typedef {Object} Workflow
 * @property {WorkflowMetadata} metadata - Workflow metadata
 * @property {WorkflowNode[]} nodes - Workflow nodes
 * @property {WorkflowEdge[]} edges - Workflow edges
 */

/**
 * Create a new workflow with default metadata
 * @param {string} name - Workflow name
 * @param {Object} [options] - Additional options
 * @returns {Workflow}
 */
export function createWorkflow(name, options = {}) {
  const now = Date.now();

  return {
    metadata: {
      id: options.id || `workflow-${now}`,
      name,
      description: options.description || '',
      version: options.version || '1.0.0',
      author: options.author || '',
      createdAt: now,
      updatedAt: now,
      tags: options.tags || []
    },
    nodes: options.nodes || [],
    edges: options.edges || []
  };
}

/**
 * Validate workflow structure
 * @param {any} workflow - Workflow to validate
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateWorkflow(workflow) {
  const errors = [];

  // Check required fields
  if (!workflow || typeof workflow !== 'object') {
    return { valid: false, errors: ['Workflow must be an object'] };
  }

  // Validate metadata
  if (!workflow.metadata) {
    errors.push('Missing required field: metadata');
  } else {
    if (!workflow.metadata.id) errors.push('Missing required field: metadata.id');
    if (!workflow.metadata.name) errors.push('Missing required field: metadata.name');
    if (!workflow.metadata.version) errors.push('Missing required field: metadata.version');
    if (typeof workflow.metadata.createdAt !== 'number') {
      errors.push('metadata.createdAt must be a number');
    }
    if (typeof workflow.metadata.updatedAt !== 'number') {
      errors.push('metadata.updatedAt must be a number');
    }
  }

  // Validate nodes
  if (!Array.isArray(workflow.nodes)) {
    errors.push('nodes must be an array');
  } else {
    const nodeIds = new Set();
    workflow.nodes.forEach((node, index) => {
      if (!node.id) {
        errors.push(`Node at index ${index} missing id`);
      } else if (nodeIds.has(node.id)) {
        errors.push(`Duplicate node ID: ${node.id}`);
      } else {
        nodeIds.add(node.id);
      }

      if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
        errors.push(`Node ${node.id} has invalid position`);
      }

      if (!node.data || !node.data.label) {
        errors.push(`Node ${node.id} missing data.label`);
      }
    });
  }

  // Validate edges
  if (!Array.isArray(workflow.edges)) {
    errors.push('edges must be an array');
  } else {
    const edgeIds = new Set();
    const nodeIds = new Set(workflow.nodes.map(n => n.id));

    workflow.edges.forEach((edge, index) => {
      if (!edge.id) {
        errors.push(`Edge at index ${index} missing id`);
      } else if (edgeIds.has(edge.id)) {
        errors.push(`Duplicate edge ID: ${edge.id}`);
      } else {
        edgeIds.add(edge.id);
      }

      if (!edge.source) {
        errors.push(`Edge ${edge.id} missing source`);
      } else if (!nodeIds.has(edge.source)) {
        errors.push(`Edge ${edge.id} references non-existent source node: ${edge.source}`);
      }

      if (!edge.target) {
        errors.push(`Edge ${edge.id} missing target`);
      } else if (!nodeIds.has(edge.target)) {
        errors.push(`Edge ${edge.id} references non-existent target node: ${edge.target}`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Sanitize workflow data (remove undefined fields, validate types)
 * @param {Workflow} workflow - Workflow to sanitize
 * @returns {Workflow}
 */
export function sanitizeWorkflow(workflow) {
  return {
    metadata: {
      id: String(workflow.metadata.id),
      name: String(workflow.metadata.name),
      description: workflow.metadata.description ? String(workflow.metadata.description) : '',
      version: String(workflow.metadata.version),
      author: workflow.metadata.author ? String(workflow.metadata.author) : '',
      createdAt: Number(workflow.metadata.createdAt),
      updatedAt: Number(workflow.metadata.updatedAt),
      tags: Array.isArray(workflow.metadata.tags) ? workflow.metadata.tags.map(String) : []
    },
    nodes: workflow.nodes.map(node => ({
      id: String(node.id),
      type: node.type ? String(node.type) : undefined,
      position: {
        x: Number(node.position.x),
        y: Number(node.position.y)
      },
      data: node.data,
      selected: node.selected === true,
      dragging: node.dragging === true,
      width: node.width !== undefined ? Number(node.width) : undefined,
      height: node.height !== undefined ? Number(node.height) : undefined
    })),
    edges: workflow.edges.map(edge => ({
      id: String(edge.id),
      source: String(edge.source),
      target: String(edge.target),
      type: edge.type ? String(edge.type) : undefined,
      animated: edge.animated === true,
      label: edge.label ? String(edge.label) : undefined,
      selected: edge.selected === true
    }))
  };
}

export default {
  createWorkflow,
  validateWorkflow,
  sanitizeWorkflow
};
