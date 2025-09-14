/**
 * Error Simulator Utility
 * Simulates various error conditions for testing resilience
 */
export class ErrorSimulator {
    simulationActive: boolean;
    simulationCount: number;
    simulateRateLimit(operation: any, options?: {}): Promise<{
        rateLimitDetected: boolean;
        backoffApplied: boolean;
        eventualSuccess: boolean;
        totalRetries: number;
        attempts: number;
        finalError?: undefined;
    } | {
        rateLimitDetected: boolean;
        backoffApplied: boolean;
        eventualSuccess: boolean;
        totalRetries: number;
        attempts: number;
        finalError: any;
    } | undefined>;
    simulateTimeout(operation: any, options?: {}): Promise<{
        timeoutDetected: boolean;
        retriesAttempted: number;
        finalOutcome: string;
        result: any;
        finalError?: undefined;
    } | {
        timeoutDetected: boolean;
        retriesAttempted: number;
        finalOutcome: string;
        finalError: any;
        result?: undefined;
    } | undefined>;
    simulateAuthFailure(operation: any): Promise<{
        authFailureDetected: boolean;
        reauthenticationAttempted: boolean;
        finalSuccess: boolean;
        result: any;
        finalError?: undefined;
    } | {
        authFailureDetected: boolean;
        reauthenticationAttempted: boolean;
        finalSuccess: boolean;
        finalError: any;
        result?: undefined;
    }>;
    simulateNetworkPartition(duration?: number): Promise<{
        partitionActive: boolean;
        duration: number;
        simulationId: number;
    }>;
    simulateHighLatency(baseLatency?: number): Promise<{
        latencySimulated: boolean;
        actualLatency: number;
        baseLatency: number;
    }>;
    simulateMemoryPressure(pressureLevel?: number): Promise<{
        memoryPressureSimulated: boolean;
        pressureLevel: number;
        memoryStats: {
            before: NodeJS.MemoryUsage;
            during: NodeJS.MemoryUsage;
            after: NodeJS.MemoryUsage;
            error?: undefined;
        };
        pressureCreated: boolean;
        error?: undefined;
    } | {
        memoryPressureSimulated: boolean;
        error: any;
        memoryStats: {
            before: NodeJS.MemoryUsage;
            error: NodeJS.MemoryUsage;
            during?: undefined;
            after?: undefined;
        };
        pressureLevel?: undefined;
        pressureCreated?: undefined;
    }>;
    simulateCpuSpike(duration?: number, intensity?: number): Promise<{
        cpuSpikeSimulated: boolean;
        requestedDuration: number;
        actualDuration: number;
        intensity: number;
        workerCount: number;
    }>;
    delay(ms: any): Promise<any>;
    timeoutPromise(ms: any): Promise<any>;
    cpuIntensiveTask(endTime: any): Promise<any>;
    isSimulationActive(): boolean;
    getSimulationCount(): number;
    reset(): void;
}
//# sourceMappingURL=error-simulator.d.ts.map