/**
 * Session Service
 * 
 * Business logic layer for session management.
 * All database operations are atomic via the database layer.
 */

import {
  getAllSessions,
  getSessionById,
  createSession,
  updateSession,
  deleteSession,
  cleanupExpiredSessions
} from '../../db/database.js';

/**
 * Get all sessions
 * @returns {Promise<Array>} Array of sessions
 */
export async function getSessions() {
  return getAllSessions();
}

/**
 * Get session by ID
 * @param {string} id - Session ID
 * @returns {Promise<Object|null>} Session or null
 */
export async function getSession(id) {
  return getSessionById(id);
}

/**
 * Create new session
 * @param {Object} sessionData - Session data
 * @returns {Promise<Object>} Created session
 */
export async function addSession(sessionData) {
  return createSession(sessionData);
}

/**
 * Update existing session
 * @param {string} id - Session ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated session
 */
export async function modifySession(id, updates) {
  return updateSession(id, updates);
}

/**
 * Delete session
 * @param {string} id - Session ID
 * @returns {Promise<boolean>} True if deleted
 */
export async function removeSession(id) {
  const deleted = deleteSession(id);
  if (!deleted) {
    throw new Error(`Session with id ${id} not found`);
  }
  return true;
}

/**
 * Get active sessions
 * @returns {Promise<Array>} Active sessions
 */
export async function getActiveSessions() {
  const sessions = getAllSessions();
  return sessions.filter(s => s.status === 'active');
}

/**
 * Get sessions for a workflow
 * @param {string} workflowId - Workflow ID
 * @returns {Promise<Array>} Sessions for workflow
 */
export async function getSessionsByWorkflow(workflowId) {
  const sessions = getAllSessions();
  return sessions.filter(s => s.workflowId === workflowId);
}

/**
 * Cleanup expired sessions
 * @returns {Promise<number>} Number of sessions cleaned up
 */
export async function cleanupSessions() {
  return cleanupExpiredSessions();
}

/**
 * Extend session expiration
 * @param {string} id - Session ID
 * @param {number} extensionMs - Extension in milliseconds
 * @returns {Promise<Object>} Updated session
 */
export async function extendSession(id, extensionMs) {
  const session = getSessionById(id);
  
  if (!session) {
    throw new Error(`Session with id ${id} not found`);
  }

  const currentExpiry = session.expiresAt || Date.now();
  const newExpiry = currentExpiry + extensionMs;

  return updateSession(id, { expiresAt: newExpiry });
}

/**
 * Terminate session
 * @param {string} id - Session ID
 * @returns {Promise<Object>} Terminated session
 */
export async function terminateSession(id) {
  return updateSession(id, { status: 'terminated' });
}
