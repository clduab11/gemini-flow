/**
 * Lightweight Core System
 *
 * Minimal core implementation that only loads essential features
 * Dynamically loads enterprise features based on feature flags
 */
/// <reference types="node" resolution-mode="require"/>
import { featureFlags } from "./feature-flags.js";
import { SimpleAuth } from "./simple-auth.js";
import { EventEmitter } from "events";
export interface CoreConfig {
    mode: "minimal" | "enhanced" | "enterprise";
    autoLoad: boolean;
    maxMemory?: number;
    logLevel?: string;
}
export interface AdapterLoader {
    name: string;
    load: () => Promise<any>;
    dependencies: string[];
    optional: boolean;
}
export declare class LightweightCore extends EventEmitter {
    private logger;
    private config;
    private loadedAdapters;
    private adapterLoaders;
    private auth;
    private initialized;
    private stats;
    constructor(config?: CoreConfig);
    /**
     * Initialize the core system
     */
    initialize(): Promise<void>;
    /**
     * Setup adapter loaders for conditional loading
     */
    private setupAdapterLoaders;
    /**
     * Initialize authentication
     */
    private initializeAuth;
    /**
     * Load adapters based on enabled features
     */
    private loadEnabledAdapters;
    /**
     * Load a specific adapter
     */
    private loadAdapter;
    /**
     * Get a loaded adapter
     */
    getAdapter<T = any>(adapterKey: string): T | null;
    /**
     * Check if an adapter is loaded
     */
    hasAdapter(adapterKey: string): boolean;
    /**
     * Load an adapter on demand
     */
    loadAdapterOnDemand(adapterKey: string): Promise<boolean>;
    /**
     * Setup system monitoring
     */
    private setupMonitoring;
    /**
     * Update system statistics
     */
    private updateStats;
    /**
     * Determine current mode
     */
    private determineMode;
    /**
     * Get system status
     */
    getStatus(): any;
    /**
     * Get lightweight status (minimal info)
     */
    getLightweightStatus(): any;
    /**
     * Enable a feature dynamically
     */
    enableFeature(feature: keyof ReturnType<typeof featureFlags.getAllFeatureConfigs>): Promise<boolean>;
    /**
     * Disable a feature dynamically
     */
    disableFeature(feature: keyof ReturnType<typeof featureFlags.getAllFeatureConfigs>): void;
    /**
     * Get authentication instance
     */
    getAuth(): SimpleAuth;
    /**
     * Increment request counter
     */
    incrementRequestCount(): void;
    /**
     * Health check
     */
    healthCheck(): Promise<any>;
    /**
     * Shutdown the core system
     */
    shutdown(): Promise<void>;
}
export declare function getCore(config?: CoreConfig): LightweightCore;
export declare function resetCore(): void;
//# sourceMappingURL=lightweight-core.d.ts.map