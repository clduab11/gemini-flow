/**
 * Request Validation Limits Configuration
 * 
 * Configurable limits for payload size, workflow complexity, and structure depth.
 * These limits prevent denial-of-service attacks through oversized or complex payloads.
 * 
 * All limits can be overridden via environment variables.
 */

export const LIMITS = {
  // Request size limits
  MAX_REQUEST_SIZE: process.env.MAX_REQUEST_SIZE || '1mb',
  
  // Workflow complexity limits
  MAX_NODES: parseInt(process.env.MAX_NODES) || 1000,
  MAX_EDGES: parseInt(process.env.MAX_EDGES) || 5000,
  MAX_NAME_LENGTH: parseInt(process.env.MAX_NAME_LENGTH) || 200,
  MAX_DESCRIPTION_LENGTH: parseInt(process.env.MAX_DESCRIPTION_LENGTH) || 5000,
  MAX_TAGS: parseInt(process.env.MAX_TAGS) || 50,
  
  // Structure complexity limits
  MAX_NESTED_DEPTH: parseInt(process.env.MAX_NESTED_DEPTH) || 10,
  MAX_ARRAY_LENGTH: parseInt(process.env.MAX_ARRAY_LENGTH) || 10000,
  
  // Rate limiting (for reference, actual rate limiting handled elsewhere)
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  
  // Viewport limits for store state
  MIN_VIEWPORT_ZOOM: parseFloat(process.env.MIN_VIEWPORT_ZOOM) || 0.1,
  MAX_VIEWPORT_ZOOM: parseFloat(process.env.MAX_VIEWPORT_ZOOM) || 10
};

/**
 * Get current limit values
 * Useful for API documentation and debugging
 */
export function getLimits() {
  return { ...LIMITS };
}

/**
 * Validate that environment variable limits are within reasonable ranges
 */
export function validateLimitsConfig() {
  const warnings = [];
  
  if (LIMITS.MAX_NODES > 10000) {
    warnings.push('MAX_NODES is set very high (>10000), this may impact performance');
  }
  
  if (LIMITS.MAX_EDGES > 50000) {
    warnings.push('MAX_EDGES is set very high (>50000), this may impact performance');
  }
  
  if (LIMITS.MAX_NESTED_DEPTH > 20) {
    warnings.push('MAX_NESTED_DEPTH is set very high (>20), this may cause stack overflow');
  }
  
  return warnings;
}
