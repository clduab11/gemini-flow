import { HookExecutionResult } from './hook-registry';
/**
 * @module ProcessingHooks
 * @description Provides a collection of common pre/post processing, error, performance, and security hook handlers.
 */
/**
 * Pre-execution hook: Validates input data.
 * @param {HookContext} context The hook context.
 * @returns {Promise<HookExecutionResult>}
 */
export declare const validateInputHook: (context: HookContext) => Promise<HookExecutionResult>;
/**
 * Pre-execution hook: Authenticates the request or agent.
 * @param {HookContext} context The hook context.
 * @returns {Promise<HookExecutionResult>}
 */
export declare const authenticateRequestHook: (context: HookContext) => Promise<HookExecutionResult>;
/**
 * Post-execution hook: Logs the execution result.
 * @param {HookContext} context The hook context.
 * @returns {Promise<HookExecutionResult>}
 */
export declare const logResultHook: (context: HookContext) => Promise<HookExecutionResult>;
/**
 * Post-execution hook: Cleans up temporary resources.
 * @param {HookContext} context The hook context.
 * @returns {Promise<HookExecutionResult>}
 */
export declare const cleanupResourcesHook: (context: HookContext) => Promise<HookExecutionResult>;
/**
 * Error hook: Handles exceptions and triggers alerts.
 * @param {HookContext} context The hook context (should contain error details).
 * @returns {Promise<HookExecutionResult>}
 */
export declare const handleErrorHook: (context: HookContext) => Promise<HookExecutionResult>;
/**
 * Performance hook: Collects execution metrics.
 * @param {HookContext} context The hook context.
 * @returns {Promise<HookExecutionResult>}
 */
export declare const collectPerformanceMetricsHook: (context: HookContext) => Promise<HookExecutionResult>;
/**
 * Security hook: Performs audit logging.
 * @param {HookContext} context The hook context.
 * @returns {Promise<HookExecutionResult>}
 */
export declare const auditLogHook: (context: HookContext) => Promise<HookExecutionResult>;
//# sourceMappingURL=processing-hooks.d.ts.map