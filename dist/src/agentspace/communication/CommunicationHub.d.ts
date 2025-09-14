/**
 * Communication Hub
 * Mock implementation for testing purposes
 */
export declare class CommunicationHub {
    private config;
    private initialized;
    private agents;
    private partitioned;
    constructor(config: any);
    initialize(): Promise<boolean>;
    shutdown(): Promise<boolean>;
    getAgentStatus(agentId: string): Promise<any>;
    sendMessage(message: any): Promise<any>;
    simulateNetworkPartition(segment1: string[], segment2: string[]): Promise<void>;
    getPartitionStatus(): Promise<any>;
    healNetworkPartition(): Promise<void>;
}
//# sourceMappingURL=CommunicationHub.d.ts.map