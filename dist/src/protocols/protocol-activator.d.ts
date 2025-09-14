/**
 * Protocol Activator
 *
 * Manages activation and coordination of A2A and MCP protocols
 * Provides automatic discovery and conditional loading based on environment
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
export type TopologyType = "hierarchical" | "mesh" | "ring" | "star";
export interface ProtocolConfig {
    name: string;
    version: string;
    enabled: boolean;
    autoDetect: boolean;
    capabilities: string[];
    dependencies: string[];
    ports?: number[];
    endpoints?: string[];
    topology?: TopologyType;
}
export interface ProtocolStatus {
    name: string;
    status: "inactive" | "activating" | "active" | "error" | "degraded";
    version?: string;
    capabilities: string[];
    endpoints: string[];
    lastError?: string;
    activatedAt?: Date;
    metrics: {
        connections: number;
        requests: number;
        errors: number;
        avgResponseTime: number;
    };
}
export interface ActivationResult {
    success: boolean;
    protocol: string;
    capabilities: string[];
    endpoints: string[];
    fallbacksUsed: string[];
    topology: TopologyType;
    error?: string;
}
export declare class ProtocolActivator extends EventEmitter {
    private logger;
    private activeProtocols;
    private protocolConfigs;
    private protocolStatus;
    private activationPromises;
    constructor();
    /**
     * Setup protocol configurations
     */
    private setupProtocolConfigs;
    /**
     * Perform environment detection
     */
    private performEnvironmentDetection;
    /**
     * Detect A2A protocol environment
     */
    private detectA2AEnvironment;
    /**
     * Detect MCP protocol environment
     */
    private detectMCPEnvironment;
    /**
     * Update feature flags based on detection
     */
    private updateFeatureFlags;
    /**
     * Validate topology parameter
     */
    private validateTopology;
    /**
     * Activate a protocol with required topology specification
     */
    activateProtocol(protocolName: string, topology: TopologyType): Promise<ActivationResult>;
    /**
     * Perform protocol activation
     */
    private performActivation;
    /**
     * Activate A2A protocol
     */
    private activateA2AProtocol;
    /**
     * Activate MCP protocol
     */
    private activateMCPProtocol;
    /**
     * Activate hybrid protocol
     */
    private activateHybridProtocol;
    /**
     * Deactivate a protocol
     */
    deactivateProtocol(protocolName: string): Promise<boolean>;
    /**
     * Get protocol instance
     */
    getProtocol<T = any>(protocolName: string): T | null;
    /**
     * Check if protocol is active
     */
    isProtocolActive(protocolName: string): boolean;
    /**
     * Get protocol status
     */
    getProtocolStatus(protocolName: string): ProtocolStatus | null;
    /**
     * Get all protocol statuses
     */
    getAllStatuses(): ProtocolStatus[];
    /**
     * Get routing strategy based on topology
     */
    private getRoutingStrategy;
    /**
     * Get max hops based on topology
     */
    private getMaxHops;
    /**
     * Auto-activate protocols based on configuration (requires topology)
     */
    autoActivate(topology: TopologyType): Promise<ActivationResult[]>;
    /**
     * Get activation summary
     */
    getActivationSummary(): any;
    /**
     * Get current topology from active protocols
     */
    private getCurrentTopology;
    /**
     * Determine current mode
     */
    private determineMode;
    private fileExists;
    private checkPortsAvailable;
    private checkDependency;
    private checkMissingDependencies;
    /**
     * Shutdown all protocols
     */
    shutdown(): Promise<void>;
}
export declare function getProtocolActivator(): ProtocolActivator;
export declare function resetProtocolActivator(): void;
//# sourceMappingURL=protocol-activator.d.ts.map