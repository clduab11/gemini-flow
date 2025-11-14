/**
 * Gemini-Flow Browser Automation Module
 *
 * Exports Playwright-based Google service automations
 */

// Core types and configuration
export * from './services-config.js';
export * from './playwright-service-base.js';

// Service implementations
export * from './services/ai-studio-ultra.js';
export * from './services/google-labs.js';

// Orchestrator
export * from './service-orchestrator.js';

// Re-export main orchestrator for convenience
import { getOrchestrator, executeService } from './service-orchestrator.js';
export { getOrchestrator, executeService };
export default getOrchestrator;
