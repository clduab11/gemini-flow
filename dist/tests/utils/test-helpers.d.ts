/**
 * Generate test tasks of various complexities and types
 */
export function generateTestTasks(count: any, complexity?: string): {
    id: string;
    type: any;
    complexity: string;
    estimatedDuration: any;
    dependencies: number[];
    payload: {
        data: string;
        metadata: {
            generated: number;
            complexity: any;
            size: any;
        };
    };
}[];
/**
 * Measure execution time of async functions
 */
export function measureExecutionTime(asyncFn: any): Promise<number>;
/**
 * Generate random test data
 */
export function generateRandomData(sizeBytes: any): string;
/**
 * Create delay for testing timing and coordination
 */
export function delay(ms: any): Promise<any>;
/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
    metrics: {
        startTime: null;
        operations: never[];
        memoryUsage: never[];
        errors: never[];
    };
    start(): void;
    recordOperation(name: any, duration: any, success?: boolean, metadata?: {}): void;
    recordMemoryUsage(): void;
    recordError(error: any, context?: {}): void;
    getReport(): {
        summary: {
            totalDuration: number;
            totalOperations: number;
            successfulOperations: number;
            failedOperations: number;
            successRate: number;
            averageOperationTime: number;
            errorsCount: number;
        };
        performance: {
            operationsPerSecond: number;
            p50: any;
            p95: any;
            p99: any;
        };
        memory: {
            initialHeap: any;
            peakHeap: number;
            finalHeap: any;
            heapGrowth: number;
            peakGrowth: number;
        } | null;
        errors: never[];
    };
    calculateMemoryStats(): {
        initialHeap: any;
        peakHeap: number;
        finalHeap: any;
        heapGrowth: number;
        peakGrowth: number;
    } | null;
}
export namespace TestDataGenerators {
    /**
     * Generate workload for load testing
     */
    function generateLoadTestData(userCount: any, operationsPerUser: any): {
        id: number;
        operations: {
            type: string;
            timestamp: number;
            data: string;
        }[];
    }[];
    function getRandomOperationType(): string;
    /**
     * Generate test cases for edge conditions
     */
    function generateEdgeCases(): ({
        name: string;
        data: string;
    } | {
        name: string;
        data: null;
    } | {
        name: string;
        data: undefined;
    } | {
        name: string;
        data: number[];
    } | {
        name: string;
        data: {
            a: {
                b: {
                    c: {
                        d: string;
                    };
                };
            };
        };
    } | {
        name: string;
        data: {
            self: any;
        };
    })[];
    /**
     * Generate performance baseline data
     */
    function generateBaselineData(): {
        singleAgentSpawn: {
            target: number;
            baseline: number;
        };
        multiAgentSpawn: {
            target: number;
            baseline: number;
        };
        taskExecution: {
            target: number;
            baseline: number;
        };
        memoryOperation: {
            target: number;
            baseline: number;
        };
        coordination: {
            target: number;
            baseline: number;
        };
    };
}
/**
 * Mock services for testing
 */
export class MockServices {
    static createMockSwarm(config?: {}): {
        id: string;
        topology: any;
        maxAgents: any;
        agents: never[];
        destroy(): Promise<void>;
        getActiveAgents(): never[];
        simulateNetworkPartition(partitions: any): Promise<void>;
        healNetworkPartition(): Promise<void>;
    };
    static createMockAgent(type: any, config?: {}): {
        id: string;
        type: any;
        config: {};
        failed: boolean;
        storeMemory(key: any, data: any): Promise<{
            success: boolean;
            key: any;
            stored: number;
        }>;
        retrieveMemory(key: any): Promise<{
            retrieved: boolean;
            key: any;
            timestamp: number;
        }>;
        destroy(): Promise<void>;
        simulateFailure(): Promise<never>;
        isFailed(): boolean;
    };
}
export function calculatePercentile(values: any, percentile: any): any;
//# sourceMappingURL=test-helpers.d.ts.map