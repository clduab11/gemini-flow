/**
 * Store API Routes
 * 
 * RESTful API endpoints for application state management
 */

import express from 'express';
import {
  getState,
  getValue,
  updateState,
  setValue,
  removeValue,
  clearState,
  hasKey,
  getKeys,
  mergeState
} from '../services/StoreService.js';

const router = express.Router();

/**
 * GET /api/store
 * Get entire store state for a namespace
 */
router.get('/', async (req, res, next) => {
  try {
    const { namespace = 'default' } = req.query;
    const state = await getState(namespace);
    
    res.json({
      success: true,
      data: state,
      namespace
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/store/keys
 * Get all keys in namespace
 */
router.get('/keys', async (req, res, next) => {
  try {
    const { namespace = 'default' } = req.query;
    const keys = await getKeys(namespace);
    
    res.json({
      success: true,
      data: keys,
      count: keys.length,
      namespace
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/store/:key
 * Get value by key
 */
router.get('/:key', async (req, res, next) => {
  try {
    const { key } = req.params;
    const { namespace = 'default' } = req.query;
    
    const value = await getValue(key, namespace);
    
    if (value === null) {
      return res.status(404).json({
        success: false,
        error: 'Key not found'
      });
    }
    
    res.json({
      success: true,
      data: value,
      key,
      namespace
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/store
 * Update multiple values
 */
router.post('/', async (req, res, next) => {
  try {
    const updates = req.body;
    const { namespace = 'default' } = req.query;
    
    const state = await updateState(updates, namespace);
    
    res.json({
      success: true,
      data: state,
      message: 'Store updated successfully',
      namespace
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/store/:key
 * Set a single value
 */
router.put('/:key', async (req, res, next) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const { namespace = 'default' } = req.query;
    
    await setValue(key, value, namespace);
    
    res.json({
      success: true,
      message: 'Value set successfully',
      key,
      namespace
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/store
 * Merge updates into existing state
 */
router.patch('/', async (req, res, next) => {
  try {
    const updates = req.body;
    const { namespace = 'default' } = req.query;
    
    const state = await mergeState(updates, namespace);
    
    res.json({
      success: true,
      data: state,
      message: 'State merged successfully',
      namespace
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/store/:key
 * Delete value by key
 */
router.delete('/:key', async (req, res, next) => {
  try {
    const { key } = req.params;
    const { namespace = 'default' } = req.query;
    
    await removeValue(key, namespace);
    
    res.json({
      success: true,
      message: 'Value deleted successfully',
      key,
      namespace
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/store
 * Clear entire namespace
 */
router.delete('/', async (req, res, next) => {
  try {
    const { namespace = 'default' } = req.query;
    
    const count = await clearState(namespace);
    
    res.json({
      success: true,
      message: `Cleared ${count} entries`,
      count,
      namespace
    });
  } catch (error) {
    next(error);
  }
});

/**
 * HEAD /api/store/:key
 * Check if key exists
 */
router.head('/:key', async (req, res, next) => {
  try {
    const { key } = req.params;
    const { namespace = 'default' } = req.query;
    
    const exists = await hasKey(key, namespace);
    
    res.status(exists ? 200 : 404).end();
  } catch (error) {
    next(error);
  }
});

export default router;
