import { HookRegistry } from './hook-registry';
/**
 * @interface EventTriggerConfig
 * @description Configuration for Event Triggers.
 */
export interface EventTriggerConfig {
    projectID: string;
    pubSubTopic?: string;
}
/**
 * @class EventTriggers
 * @description Manages real-time event detection and publishes them to the Hook Registry.
 */
export declare class EventTriggers {
    private config;
    private hookRegistry;
    private logger;
    constructor(config: EventTriggerConfig, hookRegistry: HookRegistry);
    /**
     * Starts listening for events from various sources and publishes them to the Hook Registry.
     * @returns {Promise<void>}
     */
    startListening(): Promise<void>;
    /**
     * Sets up a Google Cloud Pub/Sub listener to receive real-time events.
     * @private
     */
    private setupPubSubListener;
    /**
     * Conceptual: Sets up file system watchers for Cloud Storage change notifications.
     * @private
     */
    private setupFileSystemWatcher;
    /**
     * Conceptual: Sets up database triggers for Cloud SQL and Firestore event streams.
     * @private
     */
    private setupDatabaseTriggers;
    /**
     * Conceptual: Sets up API endpoint hooks with Cloud Endpoints monitoring.
     * @private
     */
    private setupApiEndpointHooks;
    /**
     * Conceptual: Sets up schedule-based triggers using Google Cloud Scheduler.
     * @private
     */
    private setupSchedulerTriggers;
    /**
     * Publishes an event to the Hook Registry, triggering relevant hooks.
     * @param {string} eventType The type of event to publish.
     * @param {any} payload The payload associated with the event.
     * @returns {Promise<void>}
     */
    publishEvent(eventType: string, payload: any): Promise<void>;
}
//# sourceMappingURL=event-triggers.d.ts.map