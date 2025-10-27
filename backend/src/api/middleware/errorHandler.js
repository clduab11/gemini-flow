/**
 * Error Handling Middleware
 *
 * Global error handler for Express application.
 * Provides consistent error response format.
 *
 * Sprint 7: Backend API Implementation
 */

/**
 * Standard API response format
 * @param {boolean} success - Whether request was successful
 * @param {any} data - Response data (null on error)
 * @param {Object|null} error - Error details (null on success)
 * @returns {Object}
 */
export function createApiResponse(success, data = null, error = null) {
  return {
    success,
    data,
    error,
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  };
}

/**
 * Create error response
 * @param {string} code - Error code
 * @param {string} message - Error message
 * @param {any} [details] - Additional error details
 * @returns {Object}
 */
export function createErrorResponse(code, message, details = null) {
  return createApiResponse(false, null, {
    code,
    message,
    details
  });
}

/**
 * Create success response
 * @param {any} data - Response data
 * @returns {Object}
 */
export function createSuccessResponse(data) {
  return createApiResponse(true, data, null);
}

/**
 * Global error handling middleware
 * @param {Error} err - Error object
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {Function} next - Express next function
 */
export function errorHandler(err, req, res, next) {
  console.error('❌ Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Default to 500 Internal Server Error
  let statusCode = err.statusCode || 500;
  let errorCode = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'Internal server error';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
  } else if (err.name === 'UnauthorizedError' || err.code === 'UNAUTHORIZED') {
    statusCode = 401;
    errorCode = 'UNAUTHORIZED';
  } else if (err.code === 'NOT_FOUND') {
    statusCode = 404;
    errorCode = 'NOT_FOUND';
  } else if (err.code === 'CONFLICT') {
    statusCode = 409;
    errorCode = 'CONFLICT';
  } else if (err.code === 'RATE_LIMIT_EXCEEDED') {
    statusCode = 429;
    errorCode = 'RATE_LIMIT_EXCEEDED';
  }

  // Send error response
  res.status(statusCode).json(createErrorResponse(errorCode, message, {
    path: req.path,
    method: req.method
  }));
}

/**
 * 404 Not Found handler
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
export function notFoundHandler(req, res) {
  res.status(404).json(createErrorResponse('NOT_FOUND', 'Resource not found', {
    path: req.path,
    method: req.method
  }));
}

/**
 * Async route wrapper to catch errors
 * @param {Function} fn - Async route handler
 * @returns {Function}
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  createApiResponse,
  createErrorResponse,
  createSuccessResponse
};
