import { Logger } from '../../utils/logger.js';
/**
 * @class HookRegistry
 * @description Manages the registration, execution, and lifecycle of event-driven hooks.
 */
export class HookRegistry {
    constructor() {
        this.hooks = new Map(); // eventType -> HookDefinition[]
        this.logger = new Logger('HookRegistry');
        this.logger.info('Hooks Registry initialized.');
    }
    /**
     * Registers a new hook with the system.
     * @param {HookDefinition} hook The hook definition to register.
     * @returns {void}
     */
    registerHook(hook) {
        if (!this.hooks.has(hook.eventType)) {
            this.hooks.set(hook.eventType, []);
        }
        const eventHooks = this.hooks.get(hook.eventType);
        eventHooks.push(hook);
        // Sort hooks by priority
        eventHooks.sort((a, b) => a.priority - b.priority);
        this.logger.info(`Hook '${hook.id}' registered for event type '${hook.eventType}' with priority ${hook.priority}.`);
    }
    /**
     * Executes all registered hooks for a given event type.
     * @param {string} eventType The type of event that occurred.
     * @param {HookContext} context The context for the hook execution.
     * @returns {Promise<HookExecutionResult[]>} An array of results from executed hooks.
     */
    async executeHooks(eventType, context) {
        this.logger.info(`Executing hooks for event type: ${eventType}`);
        const results = [];
        const hooksToExecute = this.hooks.get(eventType) || [];
        for (const hook of hooksToExecute) {
            if (hook.condition && !hook.condition(context)) {
                this.logger.debug(`Hook '${hook.id}' skipped due to unmet condition.`);
                continue;
            }
            try {
                const result = await hook.handler(context);
                results.push(result);
                this.logger.debug(`Hook '${hook.id}' executed successfully.`);
            }
            catch (error) {
                this.logger.error(`Hook '${hook.id}' failed to execute: ${error.message}`);
                results.push({ success: false, message: error.message });
                // Implement error hooks or recovery procedures here
            }
        }
        this.logger.info(`Finished executing hooks for event type: ${eventType}. Total results: ${results.length}`);
        return results;
    }
    /**
     * Lists all registered hooks, optionally filtered by event type.
     * @param {string} [eventType] Optional event type to filter hooks.
     * @returns {HookDefinition[]} An array of registered hooks.
     */
    listHooks(eventType) {
        if (eventType) {
            return this.hooks.get(eventType) || [];
        }
        return Array.from(this.hooks.values()).flat();
    }
    /**
     * Removes a hook from the registry.
     * @param {string} hookId The ID of the hook to remove.
     * @param {string} eventType The event type the hook is registered under.
     * @returns {boolean} True if the hook was removed, false otherwise.
     */
    unregisterHook(hookId, eventType) {
        const eventHooks = this.hooks.get(eventType);
        if (eventHooks) {
            const initialLength = eventHooks.length;
            this.hooks.set(eventType, eventHooks.filter(hook => hook.id !== hookId));
            if (this.hooks.get(eventType)?.length === 0) {
                this.hooks.delete(eventType);
            }
            if (eventHooks.length < initialLength) {
                this.logger.info(`Hook '${hookId}' unregistered from event type '${eventType}'.`);
                return true;
            }
        }
        return false;
    }
}
