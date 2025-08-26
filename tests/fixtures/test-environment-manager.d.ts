/**
 * Test Environment Manager
 * Comprehensive test infrastructure management
 */
/// <reference types="node" />
/// <reference types="node" />
export declare class TestEnvironmentManager {
    private services;
    private mockServices;
    private metricsCollection;
    private performanceOptimized;
    private initialized;
    constructor(config: {
        services: string[];
        mockServices?: boolean;
        networkSimulation?: boolean;
        metricsCollection?: boolean;
        performanceOptimized?: boolean;
    });
    initialize(): Promise<void>;
    cleanup(): Promise<void>;
}
export declare class MockGoogleCloudProvider {
    private config;
    private started;
    constructor(config: any);
    start(): Promise<void>;
    stop(): Promise<void>;
    getApiKey(): string;
    getConfig(): any;
    simulateNetworkInterruption(duration: number): Promise<void>;
    simulateResourceExhaustion(resource: string, utilization: number): Promise<void>;
}
export declare class NetworkSimulator {
    private profiles;
    private currentProfile;
    constructor(config: {
        profiles: any;
    });
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    setProfile(profileName: string): Promise<void>;
    setConditions(conditions: any): Promise<void>;
    setBandwidth(bandwidth: number): Promise<void>;
    getCurrentProfile(): any;
    getCurrentBandwidth(): number;
    getCurrentLatency(): number;
}
export declare class TestDataGenerator {
    private config;
    constructor(config: any);
    generateVideoStream(config: any): any;
    generateAudioStream(config: any): any;
    generateVideoData(config: any): Promise<any>;
    generateVideoChunk(size: number): Promise<Buffer>;
    generateSynchronizedContent(config: any): Promise<any>;
    generateMixedContent(config: any): Promise<any>;
}
export declare class MetricsCollector {
    private config;
    private started;
    constructor(config: any);
    start(): Promise<void>;
    stop(): Promise<void>;
    reset(): void;
    startSession(sessionId: string): Promise<void>;
    endSession(sessionId: string): Promise<void>;
    getSessionMetrics(sessionId: string): Promise<any>;
    getPeakMemoryUsage(): Promise<number>;
    getAggregateMetrics(): Promise<any>;
    getStageMetrics(startTime: number, endTime: number): Promise<any>;
    getStreamMetrics(streamId: string): Promise<any>;
    getMixedContentMetrics(sessionId: string): Promise<any>;
    getSystemMetrics(): Promise<any>;
    getResourceMetrics(): Promise<any>;
    getOverallMetrics(): Promise<any>;
}
export declare class LoadGenerator {
    private config;
    constructor(config: any);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    generateVideoData(config: any): Promise<any>;
    generateVideoChunk(size: number): Promise<Buffer>;
    generateSynchronizedContent(config: any): Promise<any>;
    generateMixedContent(config: any): Promise<any>;
}
export declare class MockAgentProvider {
    private config;
    private started;
    constructor(config: any);
    start(): Promise<void>;
    stop(): Promise<void>;
    simulateLoad(targetLoad: number): Promise<void>;
    simulateHealthIssue(agentId: string, issue: any): Promise<void>;
    simulateAgentFailure(agentId: string, failureType: string): Promise<void>;
    simulateAgentCorruption(agentId: string): Promise<void>;
}
//# sourceMappingURL=test-environment-manager.d.ts.map