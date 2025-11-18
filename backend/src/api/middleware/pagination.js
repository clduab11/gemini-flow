/**
 * Pagination Middleware
 * 
 * Provides standardized pagination for list endpoints with multiple strategies:
 * - Offset-based pagination (page/limit)
 * - Cursor-based pagination (cursor/limit)
 * - Sorting and filtering support
 * 
 * Features:
 * - Multiple pagination strategies
 * - Query parameter parsing and validation
 * - Standard response format with metadata
 * - Configurable defaults and limits
 * 
 * @module api/middleware/pagination
 */

import { createModuleLogger } from '../../utils/logger.js';

const logger = createModuleLogger('pagination');

/**
 * Default pagination configuration
 */
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = parseInt(process.env.PAGINATION_DEFAULT_LIMIT || '20', 10);
const MAX_LIMIT = parseInt(process.env.PAGINATION_MAX_LIMIT || '100', 10);

/**
 * Parse and validate pagination parameters from query string
 * 
 * @param {Object} query - Request query parameters
 * @returns {Object} Parsed pagination params
 */
function parsePaginationParams(query) {
  // Offset-based pagination
  const page = Math.max(1, parseInt(query.page || DEFAULT_PAGE, 10));
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(query.limit || DEFAULT_LIMIT, 10))
  );
  const offset = (page - 1) * limit;
  
  // Cursor-based pagination
  const cursor = query.cursor || null;
  
  // Sorting
  const sortBy = query.sortBy || query.sort || 'id';
  const sortOrder = (query.sortOrder || query.order || 'asc').toLowerCase();
  const sortDirection = sortOrder === 'desc' ? 'desc' : 'asc';
  
  // Filtering (generic filter support)
  const filters = {};
  Object.keys(query).forEach(key => {
    if (!['page', 'limit', 'cursor', 'sortBy', 'sort', 'sortOrder', 'order'].includes(key)) {
      filters[key] = query[key];
    }
  });
  
  return {
    page,
    limit,
    offset,
    cursor,
    sortBy,
    sortDirection,
    filters
  };
}

/**
 * Pagination Middleware
 * 
 * Attaches pagination utilities to request object
 */
export function pagination(req, res, next) {
  // Parse pagination parameters
  const params = parsePaginationParams(req.query);
  
  // Attach pagination helpers to request
  req.pagination = {
    ...params,
    
    /**
     * Format paginated response with metadata
     * 
     * @param {Array} data - Array of items for current page
     * @param {number} total - Total count of items
     * @returns {Object} Formatted response
     */
    formatResponse: (data, total) => {
      const totalPages = Math.ceil(total / params.limit);
      const hasNextPage = params.page < totalPages;
      const hasPrevPage = params.page > 1;
      
      return {
        data,
        pagination: {
          page: params.page,
          limit: params.limit,
          total,
          totalPages,
          hasNextPage,
          hasPrevPage,
          nextPage: hasNextPage ? params.page + 1 : null,
          prevPage: hasPrevPage ? params.page - 1 : null
        }
      };
    },
    
    /**
     * Format cursor-based response with metadata
     * 
     * @param {Array} data - Array of items
     * @param {string} nextCursor - Cursor for next page
     * @param {string} prevCursor - Cursor for previous page
     * @returns {Object} Formatted response
     */
    formatCursorResponse: (data, nextCursor = null, prevCursor = null) => {
      return {
        data,
        pagination: {
          cursor: params.cursor,
          limit: params.limit,
          nextCursor,
          prevCursor,
          hasMore: nextCursor !== null
        }
      };
    },
    
    /**
     * Apply pagination to an array (in-memory)
     * 
     * @param {Array} array - Array to paginate
     * @returns {Object} Paginated response
     */
    applyToArray: (array) => {
      const start = params.offset;
      const end = start + params.limit;
      const paginatedData = array.slice(start, end);
      
      return params.formatResponse(paginatedData, array.length);
    }
  };
  
  logger.debug({
    page: params.page,
    limit: params.limit,
    offset: params.offset,
    sortBy: params.sortBy,
    sortDirection: params.sortDirection,
    hasFilters: Object.keys(params.filters).length > 0
  }, 'Pagination parameters parsed');
  
  next();
}

/**
 * Create custom pagination middleware with specific defaults
 * 
 * @param {Object} options - Pagination options
 * @param {number} options.defaultLimit - Default limit per page
 * @param {number} options.maxLimit - Maximum allowed limit
 * @returns {Function} Middleware function
 */
export function createPagination(options = {}) {
  const defaultLimit = options.defaultLimit || DEFAULT_LIMIT;
  const maxLimit = options.maxLimit || MAX_LIMIT;
  
  return function customPagination(req, res, next) {
    const query = req.query;
    
    const page = Math.max(1, parseInt(query.page || DEFAULT_PAGE, 10));
    const limit = Math.min(
      maxLimit,
      Math.max(1, parseInt(query.limit || defaultLimit, 10))
    );
    const offset = (page - 1) * limit;
    
    const cursor = query.cursor || null;
    const sortBy = query.sortBy || query.sort || 'id';
    const sortOrder = (query.sortOrder || query.order || 'asc').toLowerCase();
    const sortDirection = sortOrder === 'desc' ? 'desc' : 'asc';
    
    const filters = {};
    Object.keys(query).forEach(key => {
      if (!['page', 'limit', 'cursor', 'sortBy', 'sort', 'sortOrder', 'order'].includes(key)) {
        filters[key] = query[key];
      }
    });
    
    req.pagination = {
      page,
      limit,
      offset,
      cursor,
      sortBy,
      sortDirection,
      filters,
      
      formatResponse: (data, total) => {
        const totalPages = Math.ceil(total / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;
        
        return {
          data,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNextPage,
            hasPrevPage,
            nextPage: hasNextPage ? page + 1 : null,
            prevPage: hasPrevPage ? page - 1 : null
          }
        };
      },
      
      formatCursorResponse: (data, nextCursor = null, prevCursor = null) => {
        return {
          data,
          pagination: {
            cursor,
            limit,
            nextCursor,
            prevCursor,
            hasMore: nextCursor !== null
          }
        };
      },
      
      applyToArray: (array) => {
        const start = offset;
        const end = start + limit;
        const paginatedData = array.slice(start, end);
        
        return {
          data: paginatedData,
          pagination: {
            page,
            limit,
            total: array.length,
            totalPages: Math.ceil(array.length / limit),
            hasNextPage: page < Math.ceil(array.length / limit),
            hasPrevPage: page > 1
          }
        };
      }
    };
    
    next();
  };
}

/**
 * Helper: Build SQL LIMIT/OFFSET clause
 * 
 * @param {Object} pagination - Pagination params from req.pagination
 * @returns {string} SQL clause
 */
export function buildSqlLimitOffset(pagination) {
  return `LIMIT ${pagination.limit} OFFSET ${pagination.offset}`;
}

/**
 * Helper: Build SQL ORDER BY clause
 * 
 * @param {Object} pagination - Pagination params from req.pagination
 * @returns {string} SQL clause
 */
export function buildSqlOrderBy(pagination) {
  return `ORDER BY ${pagination.sortBy} ${pagination.sortDirection.toUpperCase()}`;
}

export default pagination;
