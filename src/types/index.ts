/**
 * Type exports for Gemini Flow
 */

// Core type exports
export * from './mcp.js';
export * from './learning.js';
export * from './a2a.js';

// MCP Tools type definitions
// Note: mcp-tools.d.ts contains global declarations and module augmentations
// These are compile-time only type definitions

// Note: MCP tool types are declared in mcp-tools.d.ts as global types
// They don't need to be re-exported since they're globally available

// User tier type and utilities
export type UserTier = 'free' | 'pro' | 'enterprise';

/**
 * Type guard to validate and cast user tier values
 */
export function asUserTier(value: string | undefined | null): UserTier {
  if (value === 'free' || value === 'pro' || value === 'enterprise') {
    return value;
  }
  return 'free'; // Default fallback
}

/**
 * Type guard to check if a value is a valid UserTier
 */
export function isValidUserTier(value: any): value is UserTier {
  return value === 'free' || value === 'pro' || value === 'enterprise';
}