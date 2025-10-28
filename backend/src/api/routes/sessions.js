/**
 * Session API Routes
 * 
 * RESTful API endpoints for session management
 */

import express from 'express';
import {
  getSessions,
  getSession,
  addSession,
  modifySession,
  removeSession,
  getActiveSessions,
  getSessionsByWorkflow,
  cleanupSessions,
  extendSession,
  terminateSession
} from '../services/SessionService.js';

const router = express.Router();

/**
 * Error handler helper for 404 responses
 */
function handleError(error, res, next) {
  if (error.message.includes('not found')) {
    return res.status(404).json({
      success: false,
      error: error.message
    });
  }
  next(error);
}

/**
 * GET /api/sessions
 * Get all sessions or filter by status/workflow
 */
router.get('/', async (req, res, next) => {
  try {
    const { status, workflowId } = req.query;
    
    let sessions;
    if (status === 'active') {
      sessions = await getActiveSessions();
    } else if (workflowId) {
      sessions = await getSessionsByWorkflow(workflowId);
    } else {
      sessions = await getSessions();
    }
    
    res.json({
      success: true,
      data: sessions,
      count: sessions.length
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/sessions/:id
 * Get session by ID
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const session = await getSession(id);
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    res.json({
      success: true,
      data: session
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/sessions
 * Create new session
 */
router.post('/', async (req, res, next) => {
  try {
    const sessionData = req.body;
    const session = await addSession(sessionData);
    
    res.status(201).json({
      success: true,
      data: session,
      message: 'Session created successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/sessions/:id
 * Update session
 */
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const session = await modifySession(id, updates);
    
    res.json({
      success: true,
      data: session,
      message: 'Session updated successfully'
    });
  } catch (error) {
    handleError(error, res, next);
  }
});

/**
 * DELETE /api/sessions/:id
 * Delete session
 */
router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    await removeSession(id);
    
    res.json({
      success: true,
      message: 'Session deleted successfully'
    });
  } catch (error) {
    handleError(error, res, next);
  }
});

/**
 * POST /api/sessions/:id/extend
 * Extend session expiration
 */
router.post('/:id/extend', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { extensionMs = 3600000 } = req.body; // Default 1 hour
    
    const session = await extendSession(id, extensionMs);
    
    res.json({
      success: true,
      data: session,
      message: 'Session extended successfully'
    });
  } catch (error) {
    handleError(error, res, next);
  }
});

/**
 * POST /api/sessions/:id/terminate
 * Terminate session
 */
router.post('/:id/terminate', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const session = await terminateSession(id);
    
    res.json({
      success: true,
      data: session,
      message: 'Session terminated successfully'
    });
  } catch (error) {
    handleError(error, res, next);
  }
});

/**
 * POST /api/sessions/cleanup
 * Cleanup expired sessions
 */
router.post('/cleanup', async (req, res, next) => {
  try {
    const count = await cleanupSessions();
    
    res.json({
      success: true,
      message: `Cleaned up ${count} expired sessions`,
      count
    });
  } catch (error) {
    next(error);
  }
});

export default router;
