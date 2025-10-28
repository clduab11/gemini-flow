/**
 * Error Handler Middleware
 * 
 * Centralized error handling with metrics tracking.
 */

import { errorsTotal } from '../../monitoring/metrics.js';

/**
 * Error handling middleware
 */
export function errorHandler(err, req, res, next) {
  // Increment error counter
  errorsTotal.inc({ 
    type: err.name || 'UnknownError',
    path: req.path 
  });
  
  console.error('Error:', err);
  
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
}
