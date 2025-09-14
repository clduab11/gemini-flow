import { EventBus } from '../events/event-bus';
import { DatabaseCoordinator } from '../../integrations/gcp/database-coordinator';
import { CommunicationCoordinator } from '../../integrations/gcp/communication-coordinator';
/**
 * @interface CrossCommunicationConfig
 * @description Configuration for Cross-Component Communication.
 */
export interface CrossCommunicationConfig {
    projectID: string;
}
/**
 * @interface CrossCommunicationOperations
 * @description Defines operations for standardized communication and data synchronization between all system components.
 */
export interface CrossCommunicationOperations {
    publishSystemEvent(eventType: string, payload: any): Promise<void>;
    subscribeToSystemEvent(eventType: string, handler: (payload: any) => void): Promise<void>;
    syncData(sourceComponent: string, targetComponent: string, data: any): Promise<void>;
    requestStatusUpdate(componentName: string): Promise<any>;
    propagateError(error: Error, sourceComponent: string): Promise<void>;
}
/**
 * @class CrossComponentCommunication
 * @description Provides standardized communication protocols, event routing, and data synchronization between all Gemini-Flow system components.
 */
export declare class CrossComponentCommunication implements CrossCommunicationOperations {
    private config;
    private logger;
    private eventBus;
    private databaseCoordinator;
    private communicationCoordinator;
    constructor(config: CrossCommunicationConfig, eventBus: EventBus, databaseCoordinator: DatabaseCoordinator, communicationCoordinator: CommunicationCoordinator);
    /**
     * Publishes a system-wide event to the Event Bus.
     * @param {string} eventType The type of event (e.g., 'system:startup', 'agent:task_completed').
     * @param {any} payload The event payload.
     * @returns {Promise<void>}
     */
    publishSystemEvent(eventType: string, payload: any): Promise<void>;
    /**
     * Subscribes to a system-wide event.
     * @param {string} eventType The type of event to subscribe to.
     * @param {(payload: any) => void} handler The handler function for the event.
     * @returns {Promise<void>}
     */
    subscribeToSystemEvent(eventType: string, handler: (payload: any) => void): Promise<void>;
    /**
     * Synchronizes data between different components or between a component and a GCP service.
     * @param {string} sourceComponent The name of the source component.
     * @param {string} targetComponent The name of the target component or GCP service.
     * @param {any} data The data to synchronize.
     * @returns {Promise<void>}
     */
    syncData(sourceComponent: string, targetComponent: string, data: any): Promise<void>;
    /**
     * Requests a status update from a specific component.
     * @param {string} componentName The name of the component to query.
     * @returns {Promise<any>} The status of the component.
     */
    requestStatusUpdate(componentName: string): Promise<any>;
    /**
     * Propagates an error across the system for centralized handling.
     * @param {Error} error The error object.
     * @param {string} sourceComponent The component where the error originated.
     * @returns {Promise<void>}
     */
    propagateError(error: Error, sourceComponent: string): Promise<void>;
}
//# sourceMappingURL=cross-communication.d.ts.map