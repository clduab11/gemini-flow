import { EventBus } from './event-bus';
import { ComputeCoordinator } from '../../integrations/gcp/compute-coordinator';
import { CoordinationEngine } from '../coordination-engine';
/**
 * @interface ReactiveCoordinationConfig
 * @description Configuration for Reactive Coordination.
 */
export interface ReactiveCoordinationConfig {
    projectID: string;
}
/**
 * @interface ReactiveCoordinationOperations
 * @description Defines operations for reactive coordination based on events.
 */
export interface ReactiveCoordinationOperations {
    setupEventDrivenScaling(): Promise<void>;
    setupDynamicWorkflowAdaptation(): Promise<void>;
    setupCircuitBreakers(): Promise<void>;
    processComplexEvents(eventStream: any[]): Promise<any>;
}
/**
 * @class ReactiveCoordination
 * @description Implements reactive systems that respond to real-time conditions and events.
 */
export declare class ReactiveCoordination implements ReactiveCoordinationOperations {
    private config;
    private logger;
    private eventBus;
    private computeCoordinator;
    private coordinationEngine;
    constructor(config: ReactiveCoordinationConfig, eventBus: EventBus, computeCoordinator: ComputeCoordinator, coordinationEngine: CoordinationEngine);
    /**
     * Sets up event-driven agent spawning and termination.
     * @returns {Promise<void>}
     */
    setupEventDrivenScaling(): Promise<void>;
    /**
     * Sets up dynamic workflow adaptation based on event patterns.
     * @returns {Promise<void>}
     */
    setupDynamicWorkflowAdaptation(): Promise<void>;
    /**
     * Sets up circuit breaker patterns for event processing resilience.
     * @returns {Promise<void>}
     */
    setupCircuitBreakers(): Promise<void>;
    /**
     * Processes complex events by correlating multiple events and identifying patterns.
     * @param {any[]} eventStream A stream of events to process.
     * @returns {Promise<any>} The result of complex event processing.
     */
    processComplexEvents(eventStream: any[]): Promise<any>;
}
//# sourceMappingURL=reactive-coordination.d.ts.map