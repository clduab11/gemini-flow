/**
 * Store Service
 * 
 * Business logic layer for application state management.
 * All database operations are atomic via the database layer.
 */

import {
  getStoreState,
  getStoreValue,
  updateStoreState,
  deleteStoreValue,
  clearStoreState
} from '../../db/database.js';

/**
 * Get entire store state
 * @param {string} namespace - Optional namespace
 * @returns {Promise<Object>} Store state
 */
export async function getState(namespace = 'default') {
  return getStoreState(namespace);
}

/**
 * Get value from store
 * @param {string} key - Key to retrieve
 * @param {string} namespace - Namespace
 * @returns {Promise<*>} Value or null
 */
export async function getValue(key, namespace = 'default') {
  return getStoreValue(key, namespace);
}

/**
 * Update store state
 * @param {Object} updates - Key-value pairs to update
 * @param {string} namespace - Namespace
 * @returns {Promise<Object>} Updated state
 */
export async function updateState(updates, namespace = 'default') {
  // Validate updates
  if (!updates || typeof updates !== 'object') {
    throw new Error('Updates must be an object');
  }

  return updateStoreState(updates, namespace);
}

/**
 * Set a single value in store
 * @param {string} key - Key to set
 * @param {*} value - Value to set
 * @param {string} namespace - Namespace
 * @returns {Promise<Object>} Updated state
 */
export async function setValue(key, value, namespace = 'default') {
  return updateStoreState({ [key]: value }, namespace);
}

/**
 * Delete value from store
 * @param {string} key - Key to delete
 * @param {string} namespace - Namespace
 * @returns {Promise<boolean>} True if deleted
 */
export async function removeValue(key, namespace = 'default') {
  const deleted = deleteStoreValue(key, namespace);
  if (!deleted) {
    throw new Error(`Key ${key} not found in namespace ${namespace}`);
  }
  return true;
}

/**
 * Clear all state in namespace
 * @param {string} namespace - Namespace to clear
 * @returns {Promise<number>} Number of entries deleted
 */
export async function clearState(namespace = 'default') {
  return clearStoreState(namespace);
}

/**
 * Check if key exists
 * @param {string} key - Key to check
 * @param {string} namespace - Namespace
 * @returns {Promise<boolean>} True if exists
 */
export async function hasKey(key, namespace = 'default') {
  const value = getStoreValue(key, namespace);
  return value !== null;
}

/**
 * Get all keys in namespace
 * @param {string} namespace - Namespace
 * @returns {Promise<Array>} Array of keys
 */
export async function getKeys(namespace = 'default') {
  const state = getStoreState(namespace);
  return Object.keys(state);
}

/**
 * Merge updates into existing state
 * @param {Object} updates - Updates to merge
 * @param {string} namespace - Namespace
 * @returns {Promise<Object>} Merged state
 */
export async function mergeState(updates, namespace = 'default') {
  if (!updates || typeof updates !== 'object') {
    throw new Error('Updates must be an object');
  }

  const currentState = getStoreState(namespace);
  const mergedState = { ...currentState, ...updates };
  
  return updateStoreState(mergedState, namespace);
}
