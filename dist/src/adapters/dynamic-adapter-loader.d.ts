/**
 * Dynamic Adapter Loader
 *
 * Loads enterprise adapters conditionally based on feature flags and dependencies
 * Provides fallback mechanisms and graceful degradation
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
export interface AdapterSpec {
    name: string;
    key: string;
    modulePath: string;
    className: string;
    dependencies: string[];
    featureFlag: string;
    fallback?: AdapterSpec;
    required: boolean;
    experimental?: boolean;
}
export interface LoadedAdapter {
    spec: AdapterSpec;
    instance: any;
    loadTime: number;
    loadedAt: Date;
    status: "loaded" | "failed" | "fallback";
    error?: string;
}
export declare class DynamicAdapterLoader extends EventEmitter {
    private logger;
    private loadedAdapters;
    private adapterSpecs;
    private loadingPromises;
    constructor();
    /**
     * Setup adapter specifications
     */
    private setupAdapterSpecs;
    /**
     * Load an adapter by key
     */
    loadAdapter(key: string, forceReload?: boolean): Promise<LoadedAdapter | null>;
    /**
     * Perform the actual adapter loading
     */
    private performLoad;
    /**
     * Load fallback adapter
     */
    private loadFallback;
    /**
     * Check if dependencies are available
     */
    private checkDependencies;
    /**
     * Load all enabled adapters
     */
    loadEnabledAdapters(): Promise<Map<string, LoadedAdapter>>;
    /**
     * Get a loaded adapter instance
     */
    getAdapter<T = any>(key: string): T | null;
    /**
     * Check if adapter is loaded
     */
    isLoaded(key: string): boolean;
    /**
     * Check if adapter is available but not loaded
     */
    isAvailable(key: string): Promise<boolean>;
    /**
     * Get adapter status
     */
    getAdapterStatus(key: string): Promise<any>;
    /**
     * Get all adapter statuses
     */
    getAllStatuses(): Promise<any[]>;
    /**
     * Load adapter on demand
     */
    loadOnDemand(key: string): Promise<boolean>;
    /**
     * Unload an adapter
     */
    unloadAdapter(key: string): Promise<boolean>;
    /**
     * Reload an adapter
     */
    reloadAdapter(key: string): Promise<boolean>;
    /**
     * Get summary statistics
     */
    getStats(): any;
    /**
     * Shutdown all adapters
     */
    shutdown(): Promise<void>;
}
export declare function getAdapterLoader(): DynamicAdapterLoader;
export declare function resetAdapterLoader(): void;
//# sourceMappingURL=dynamic-adapter-loader.d.ts.map