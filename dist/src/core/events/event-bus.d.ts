import { CommunicationCoordinator } from '../../integrations/gcp/communication-coordinator';
/**
 * @interface EventBusConfig
 * @description Configuration for the Event Bus System.
 */
export interface EventBusConfig {
    projectID: string;
    defaultTopic: string;
}
/**
 * @interface EventBusOperations
 * @description Defines operations for the Event Bus System.
 */
export interface EventBusOperations {
    publish(eventType: string, payload: any, topic?: string): Promise<void>;
    subscribe(eventType: string, handler: (payload: any) => void, topic?: string): Promise<void>;
}
/**
 * @class EventBus
 * @description Implements a high-performance event routing system with Google Cloud Pub/Sub integration.
 */
export declare class EventBus implements EventBusOperations {
    private config;
    private logger;
    private communicationCoordinator;
    private subscriptions;
    constructor(config: EventBusConfig, communicationCoordinator: CommunicationCoordinator);
    /**
     * Publishes an event to the Event Bus, which then routes it to Pub/Sub.
     * @param {string} eventType The type of event to publish.
     * @param {any} payload The payload associated with the event.
     * @param {string} [topic] Optional Pub/Sub topic to publish to. Defaults to defaultTopic.
     * @returns {Promise<void>}
     */
    publish(eventType: string, payload: any, topic?: string): Promise<void>;
    /**
     * Subscribes a handler function to a specific event type.
     * @param {string} eventType The type of event to subscribe to.
     * @param {(payload: any) => void} handler The function to call when the event occurs.
     * @param {string} [topic] Optional Pub/Sub topic to subscribe to. Defaults to defaultTopic.
     * @returns {Promise<void>}
     */
    subscribe(eventType: string, handler: (payload: any) => void, topic?: string): Promise<void>;
    /**
     * Distributes an event to locally subscribed handlers.
     * @param {string} eventType The type of event.
     * @param {any} payload The event payload.
     * @private
     */
    private distributeLocally;
    filterEvents(eventType: string, criteria: any): Promise<any[]>;
    transformEvent(eventType: string, payload: any, transformationRules: any): Promise<any>;
    replayEvents(eventType: string, startTime: number, endTime: number): Promise<void>;
}
//# sourceMappingURL=event-bus.d.ts.map