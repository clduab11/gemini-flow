/**
 * Pagination Middleware for List Endpoints
 *
 * Implements default pagination limits to prevent performance issues
 * Issue #82: Implement Default Pagination Limits for List Endpoints
 */

import { logger } from '../../utils/logger.js';

const paginationLogger = logger.child({ module: 'pagination' });

// Default pagination limits
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 1000;
const DEFAULT_PAGE = 1;

/**
 * Parse and validate pagination parameters
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
export function paginationMiddleware(req, res, next) {
  // Parse pagination parameters
  const page = parseInt(req.query.page || DEFAULT_PAGE, 10);
  const limit = parseInt(req.query.limit || DEFAULT_PAGE_SIZE, 10);
  const offset = (page - 1) * limit;

  // Validate page number
  if (page < 1 || !Number.isInteger(page)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Page must be a positive integer',
      code: 'INVALID_PAGE'
    });
  }

  // Validate and cap limit
  if (limit < 1 || !Number.isInteger(limit)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Limit must be a positive integer',
      code: 'INVALID_LIMIT'
    });
  }

  const effectiveLimit = Math.min(limit, MAX_PAGE_SIZE);

  // Log if limit was capped
  if (limit > MAX_PAGE_SIZE) {
    paginationLogger.warn({
      requestedLimit: limit,
      effectiveLimit: MAX_PAGE_SIZE,
      path: req.path
    }, 'Pagination limit capped to maximum');
  }

  // Attach pagination to request
  req.pagination = {
    page,
    limit: effectiveLimit,
    offset,
    maxPageSize: MAX_PAGE_SIZE
  };

  // Helper function to create paginated response
  req.pagination.createResponse = (items, totalCount) => {
    const totalPages = Math.ceil(totalCount / effectiveLimit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      data: items,
      pagination: {
        page,
        limit: effectiveLimit,
        totalItems: totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null
      },
      links: {
        self: createPageLink(req, page),
        first: createPageLink(req, 1),
        last: createPageLink(req, totalPages),
        next: hasNextPage ? createPageLink(req, page + 1) : null,
        prev: hasPrevPage ? createPageLink(req, page - 1) : null
      }
    };
  };

  next();
}

/**
 * Create page link for HATEOAS-style pagination
 */
function createPageLink(req, page) {
  const protocol = req.protocol;
  const host = req.get('host');
  const path = req.path;
  const query = new URLSearchParams(req.query);

  query.set('page', page);

  return `${protocol}://${host}${path}?${query.toString()}`;
}

/**
 * Custom pagination middleware with configurable limits
 *
 * @param {Object} options - Pagination options
 * @param {number} options.defaultLimit - Default page size
 * @param {number} options.maxLimit - Maximum allowed page size
 */
export function customPagination(options = {}) {
  const defaultLimit = options.defaultLimit || DEFAULT_PAGE_SIZE;
  const maxLimit = options.maxLimit || MAX_PAGE_SIZE;

  return (req, res, next) => {
    const page = parseInt(req.query.page || DEFAULT_PAGE, 10);
    const limit = parseInt(req.query.limit || defaultLimit, 10);
    const offset = (page - 1) * limit;

    if (page < 1 || !Number.isInteger(page)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Page must be a positive integer',
        code: 'INVALID_PAGE'
      });
    }

    if (limit < 1 || !Number.isInteger(limit)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Limit must be a positive integer',
        code: 'INVALID_LIMIT'
      });
    }

    const effectiveLimit = Math.min(limit, maxLimit);

    req.pagination = {
      page,
      limit: effectiveLimit,
      offset,
      maxPageSize: maxLimit,
      createResponse: (items, totalCount) => {
        const totalPages = Math.ceil(totalCount / effectiveLimit);

        return {
          data: items,
          pagination: {
            page,
            limit: effectiveLimit,
            totalItems: totalCount,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          }
        };
      }
    };

    next();
  };
}

/**
 * Cursor-based pagination middleware
 * Better for real-time data and large datasets
 */
export function cursorPagination(options = {}) {
  const defaultLimit = options.defaultLimit || DEFAULT_PAGE_SIZE;
  const maxLimit = options.maxLimit || MAX_PAGE_SIZE;

  return (req, res, next) => {
    const cursor = req.query.cursor || null;
    const limit = parseInt(req.query.limit || defaultLimit, 10);

    if (limit < 1 || !Number.isInteger(limit) || limit > maxLimit) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Limit must be between 1 and ${maxLimit}`,
        code: 'INVALID_LIMIT'
      });
    }

    req.cursorPagination = {
      cursor,
      limit,
      createResponse: (items, hasMore, nextCursor = null) => {
        return {
          data: items,
          pagination: {
            limit,
            hasMore,
            nextCursor: hasMore ? nextCursor : null
          },
          links: {
            self: createCursorLink(req, cursor),
            next: hasMore ? createCursorLink(req, nextCursor) : null
          }
        };
      }
    };

    next();
  };
}

/**
 * Create cursor-based page link
 */
function createCursorLink(req, cursor) {
  if (!cursor) return null;

  const protocol = req.protocol;
  const host = req.get('host');
  const path = req.path;
  const query = new URLSearchParams(req.query);

  query.set('cursor', cursor);

  return `${protocol}://${host}${path}?${query.toString()}`;
}

/**
 * Middleware to enforce pagination on specific routes
 */
export function requirePagination(req, res, next) {
  if (!req.query.page && !req.query.limit && !req.query.cursor) {
    paginationLogger.warn({
      path: req.path,
      ip: req.ip
    }, 'Request without pagination parameters');

    return res.status(400).json({
      error: 'Bad Request',
      message: 'Pagination parameters required. Use ?page=1&limit=50 or ?cursor=...',
      code: 'PAGINATION_REQUIRED',
      hint: {
        offsetPagination: {
          page: 'Page number (starting from 1)',
          limit: `Items per page (max: ${MAX_PAGE_SIZE})`
        },
        cursorPagination: {
          cursor: 'Cursor for next page',
          limit: `Items per page (max: ${MAX_PAGE_SIZE})`
        }
      }
    });
  }

  next();
}

/**
 * Sorting middleware for list endpoints
 */
export function sortingMiddleware(allowedFields = []) {
  return (req, res, next) => {
    const sortBy = req.query.sortBy || req.query.sort || 'createdAt';
    const sortOrder = (req.query.order || 'desc').toLowerCase();

    // Validate sort field
    if (allowedFields.length > 0 && !allowedFields.includes(sortBy)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: `Invalid sort field. Allowed fields: ${allowedFields.join(', ')}`,
        code: 'INVALID_SORT_FIELD'
      });
    }

    // Validate sort order
    if (!['asc', 'desc'].includes(sortOrder)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Sort order must be "asc" or "desc"',
        code: 'INVALID_SORT_ORDER'
      });
    }

    req.sorting = {
      field: sortBy,
      order: sortOrder,
      direction: sortOrder === 'asc' ? 1 : -1
    };

    next();
  };
}

/**
 * Filtering middleware for list endpoints
 */
export function filteringMiddleware(allowedFilters = []) {
  return (req, res, next) => {
    const filters = {};

    for (const [key, value] of Object.entries(req.query)) {
      // Skip pagination and sorting parameters
      if (['page', 'limit', 'cursor', 'sortBy', 'sort', 'order'].includes(key)) {
        continue;
      }

      // Check if filter is allowed
      if (allowedFilters.length > 0 && !allowedFilters.includes(key)) {
        continue;
      }

      // Parse filter value
      filters[key] = parseFilterValue(value);
    }

    req.filters = filters;

    next();
  };
}

/**
 * Parse filter value (handles arrays, booleans, numbers)
 */
function parseFilterValue(value) {
  // Array (comma-separated)
  if (typeof value === 'string' && value.includes(',')) {
    return value.split(',').map(v => v.trim());
  }

  // Boolean
  if (value === 'true') return true;
  if (value === 'false') return false;

  // Number
  if (!isNaN(value) && value !== '') {
    return parseFloat(value);
  }

  // String
  return value;
}

/**
 * Complete list endpoint middleware stack
 */
export function listEndpointMiddleware(options = {}) {
  const {
    defaultLimit = DEFAULT_PAGE_SIZE,
    maxLimit = MAX_PAGE_SIZE,
    allowedSortFields = [],
    allowedFilters = [],
    paginationType = 'offset' // 'offset' or 'cursor'
  } = options;

  const middlewares = [];

  // Add pagination
  if (paginationType === 'cursor') {
    middlewares.push(cursorPagination({ defaultLimit, maxLimit }));
  } else {
    middlewares.push(customPagination({ defaultLimit, maxLimit }));
  }

  // Add sorting
  if (allowedSortFields.length > 0) {
    middlewares.push(sortingMiddleware(allowedSortFields));
  }

  // Add filtering
  if (allowedFilters.length > 0) {
    middlewares.push(filteringMiddleware(allowedFilters));
  }

  return middlewares;
}
