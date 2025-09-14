/**
 * @interface HookDefinition
 * @description Defines a single hook with its event type, handler, and metadata.
 */
export interface HookDefinition {
    id: string;
    eventType: string;
    handler: (context: HookContext) => Promise<HookExecutionResult>;
    priority: number;
    condition?: (context: HookContext) => boolean;
    description?: string;
}
/**
 * @interface HookContext
 * @description The context passed to a hook handler.
 */
export interface HookContext {
    event: {
        type: string;
        payload: any;
        timestamp: number;
    };
    data: any;
}
/**
 * @interface HookExecutionResult
 * @description The result of a hook execution.
 */
export interface HookExecutionResult {
    success: boolean;
    message?: string;
    output?: any;
}
/**
 * @class HookRegistry
 * @description Manages the registration, execution, and lifecycle of event-driven hooks.
 */
export declare class HookRegistry {
    private hooks;
    private logger;
    constructor();
    /**
     * Registers a new hook with the system.
     * @param {HookDefinition} hook The hook definition to register.
     * @returns {void}
     */
    registerHook(hook: HookDefinition): void;
    /**
     * Executes all registered hooks for a given event type.
     * @param {string} eventType The type of event that occurred.
     * @param {HookContext} context The context for the hook execution.
     * @returns {Promise<HookExecutionResult[]>} An array of results from executed hooks.
     */
    executeHooks(eventType: string, context: HookContext): Promise<HookExecutionResult[]>;
    /**
     * Lists all registered hooks, optionally filtered by event type.
     * @param {string} [eventType] Optional event type to filter hooks.
     * @returns {HookDefinition[]} An array of registered hooks.
     */
    listHooks(eventType?: string): HookDefinition[];
    /**
     * Removes a hook from the registry.
     * @param {string} hookId The ID of the hook to remove.
     * @param {string} eventType The event type the hook is registered under.
     * @returns {boolean} True if the hook was removed, false otherwise.
     */
    unregisterHook(hookId: string, eventType: string): boolean;
}
//# sourceMappingURL=hook-registry.d.ts.map