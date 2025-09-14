/**
 * Resource Pool
 *
 * Manages allocation of resources for parallel operations
 */
export declare class ResourcePool {
    private logger;
    private maxConcurrency;
    private availableResources;
    private allocatedResources;
    constructor(maxConcurrency: number);
    private initializeResources;
    allocate(): Promise<any>;
    allocateBatch(count: number): Promise<any[]>;
    release(resource: any): Promise<void>;
    cleanup(): Promise<void>;
    getStatus(): {
        total: number;
        available: number;
        allocated: number;
    };
}
//# sourceMappingURL=resource-pool.d.ts.map