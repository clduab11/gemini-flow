/**
 * A2A Capability Manager
 *
 * Manages the exposure, registration, and discovery of A2A capabilities.
 * Provides patterns for dynamic capability composition, aggregation, and versioning.
 * Handles capability matching, dependency resolution, and security policy enforcement.
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { A2ACapability, A2AToolContext, A2AToolWrapper } from "./a2a-tool-wrapper.js";
export interface CapabilityRegistration {
    id: string;
    capability: A2ACapability;
    wrapper: A2AToolWrapper;
    registeredAt: Date;
    lastUsed?: Date;
    usage: {
        invocations: number;
        successRate: number;
        avgLatency: number;
    };
    status: "active" | "deprecated" | "disabled" | "maintenance";
    metadata: Record<string, any>;
}
export interface CapabilityQuery {
    name?: string;
    version?: string;
    category?: string;
    minTrustLevel?: string;
    requiredCapabilities?: string[];
    resourceConstraints?: {
        maxLatency?: number;
        maxResourceUsage?: "low" | "medium" | "high";
    };
    tags?: string[];
}
export interface CapabilityComposition {
    id: string;
    name: string;
    description: string;
    capabilities: string[];
    dependencies: Record<string, string[]>;
    executionStrategy: "sequential" | "parallel" | "conditional" | "pipeline";
    errorHandling: "fail-fast" | "continue" | "retry";
    timeout: number;
    securityPolicy: {
        minTrustLevel: string;
        aggregatedCapabilities: string[];
        elevatedPrivileges: boolean;
    };
}
export interface CapabilityAggregation {
    id: string;
    name: string;
    aggregatedCapabilities: A2ACapability[];
    compositeParameters: any;
    outputSchema: any;
    performance: {
        estimatedLatency: number;
        resourceUsage: "low" | "medium" | "high";
        cacheable: boolean;
    };
    security: {
        effectiveTrustLevel: string;
        combinedCapabilities: string[];
    };
}
export interface CapabilityDiscovery {
    categories: string[];
    versions: Record<string, string[]>;
    dependencies: Record<string, string[]>;
    recommendations: {
        popular: string[];
        trending: string[];
        related: Record<string, string[]>;
    };
    metadata: {
        totalCapabilities: number;
        lastUpdated: Date;
        compatibility: Record<string, string[]>;
    };
}
/**
 * Main capability manager for A2A system
 */
export declare class CapabilityManager extends EventEmitter {
    private logger;
    private cache;
    private registrations;
    private compositions;
    private aggregations;
    private categoryIndex;
    private dependencyGraph;
    constructor();
    /**
     * Register a new capability
     */
    registerCapability(id: string, capability: A2ACapability, wrapper: A2AToolWrapper, metadata?: Record<string, any>): Promise<void>;
    /**
     * Unregister a capability
     */
    unregisterCapability(id: string): Promise<void>;
    /**
     * Query capabilities based on criteria
     */
    queryCapabilities(query: CapabilityQuery): Promise<CapabilityRegistration[]>;
    /**
     * Get capability by ID
     */
    getCapability(id: string): CapabilityRegistration | undefined;
    /**
     * List all registered capabilities
     */
    listCapabilities(status?: CapabilityRegistration["status"]): CapabilityRegistration[];
    /**
     * Create a capability composition
     */
    createComposition(composition: CapabilityComposition): Promise<void>;
    /**
     * Execute a capability composition
     */
    executeComposition(compositionId: string, parameters: Record<string, any>, context: A2AToolContext): Promise<any>;
    /**
     * Create capability aggregation
     */
    createAggregation(capabilityIds: string[], name: string, aggregationStrategy?: "merge" | "compose" | "overlay"): Promise<CapabilityAggregation>;
    /**
     * Get capability discovery information
     */
    getDiscoveryInfo(): Promise<CapabilityDiscovery>;
    /**
     * Update capability usage statistics
     */
    updateUsageStats(capabilityId: string, success: boolean, latency: number): void;
    /**
     * Private helper methods
     */
    private validateCapability;
    private extractCategory;
    private updateDependencyGraph;
    private hasCircularDependencies;
    private validateCompositionSecurity;
    private executeSequential;
    private executeParallel;
    private executeConditional;
    private executePipeline;
    private executeSingleCapability;
    private handleCompositionErrors;
    private aggregateResults;
    private aggregateParameters;
    private aggregateOutputSchema;
    private aggregatePerformance;
    private aggregateSecurity;
    private generateRecommendations;
    private generateCompatibilityMatrix;
}
//# sourceMappingURL=capability-manager.d.ts.map