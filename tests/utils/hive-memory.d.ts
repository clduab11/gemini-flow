export class HiveMemory {
    constructor(options?: {});
    memoryPath: any;
    cache: Map<any, any>;
    initialized: boolean;
    initialize(): Promise<void>;
    store(key: any, value: any): Promise<{
        success: boolean;
        key: any;
        stored: boolean;
    }>;
    retrieve(key: any): Promise<{
        success: boolean;
        key: any;
        found: boolean;
        value: null;
        expired: boolean;
    } | {
        success: boolean;
        key: any;
        found: boolean;
        value: any;
        expired?: undefined;
    }>;
    search(pattern: any): Promise<{
        key: any;
        value: any;
        timestamp: any;
    }[]>;
    list(namespace?: string): Promise<{
        key: any;
        value: any;
        timestamp: any;
    }[]>;
    delete(key: any): Promise<{
        success: boolean;
        key: any;
        deleted: boolean;
    }>;
    clear(namespace?: string): Promise<{
        success: boolean;
        deletedCount: number;
    }>;
    getCoordinationStatus(): Promise<{
        totalEntries: number;
        hiveEntries: number;
        agentEntries: number;
        lastActivity: any;
    }>;
    storeAgentProgress(agentId: any, progress: any): Promise<{
        success: boolean;
        key: any;
        stored: boolean;
    }>;
    getAgentProgress(agentId: any): Promise<{
        success: boolean;
        key: any;
        found: boolean;
        value: null;
        expired: boolean;
    } | {
        success: boolean;
        key: any;
        found: boolean;
        value: any;
        expired?: undefined;
    }>;
    getAllAgentProgress(): Promise<any[]>;
    storeValidationResult(category: any, testKey: any, result: any): Promise<{
        success: boolean;
        key: any;
        stored: boolean;
    }>;
    getValidationResults(category?: string): Promise<{
        key: any;
        value: any;
        timestamp: any;
    }[]>;
    getValidationSummary(): Promise<{
        totalTests: number;
        categories: {};
        lastUpdated: null;
    }>;
    getLastActivityTimestamp(): any;
    persist(): Promise<void>;
    cleanup(): Promise<void>;
    notifyAgent(fromAgent: any, toAgent: any, message: any): Promise<{
        success: boolean;
        key: any;
        stored: boolean;
    }>;
    getMessagesForAgent(agentId: any): Promise<any[]>;
    markMessageRead(agentId: any, messageTimestamp: any): Promise<boolean>;
}
//# sourceMappingURL=hive-memory.d.ts.map