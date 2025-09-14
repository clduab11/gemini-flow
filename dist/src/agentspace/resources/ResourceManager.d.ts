/**
 * Resource Manager
 * Mock implementation for testing purposes
 */
export declare class ResourceManager {
    private config;
    private initialized;
    private allocations;
    constructor(config: any);
    initialize(): Promise<boolean>;
    shutdown(): Promise<boolean>;
    getAgentResources(agentId: string): Promise<any>;
    generateAllocationReport(): Promise<any>;
    getPreemptionReport(): Promise<any>;
    adjustAgentResources(request: any): Promise<any>;
}
//# sourceMappingURL=ResourceManager.d.ts.map