/**
 * Network Simulator for Integration Testing
 *
 * Provides realistic network condition simulation including latency,
 * packet loss, bandwidth throttling, and jitter for testing Google
 * Services integration under various network conditions.
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from 'events';
export interface NetworkProfile {
    name: string;
    latency: number;
    bandwidth: number;
    packetLoss: number;
    jitter: number;
    corruption: number;
    duplication: number;
}
export interface NetworkConditions {
    downloadBandwidth: number;
    uploadBandwidth: number;
    latency: number;
    packetLoss: number;
    jitter: number;
    corruption: number;
}
export interface SimulationSession {
    id: string;
    profile: string;
    startTime: Date;
    duration?: number;
    conditions: NetworkConditions;
    metrics: SessionMetrics;
}
export interface SessionMetrics {
    packetsTransmitted: number;
    packetsReceived: number;
    packetsLost: number;
    packetsCorrupted: number;
    packetsDuplicated: number;
    averageLatency: number;
    jitterVariance: number;
    throughput: {
        download: number;
        upload: number;
    };
}
export declare class NetworkSimulator extends EventEmitter {
    private config;
    private app;
    private server;
    private sessions;
    private currentProfile;
    private isActive;
    private readonly profiles;
    constructor(config?: {
        profiles?: Record<string, NetworkProfile>;
        defaultProfile?: string;
        port?: number;
    });
    start(port?: number): Promise<void>;
    stop(): Promise<void>;
    setProfile(profileName: string): Promise<void>;
    getCurrentProfile(): NetworkProfile;
    getAvailableProfiles(): string[];
    getNetworkConditions(): NetworkConditions;
    /**
     * Create a simulation session for testing
     */
    createSession(options?: {
        profileName?: string;
        duration?: number;
        customConditions?: Partial<NetworkConditions>;
    }): Promise<string>;
    /**
     * End a simulation session
     */
    endSession(sessionId: string): Promise<SessionMetrics | null>;
    /**
     * Simulate network request with current conditions
     */
    simulateRequest(options: {
        size: number;
        direction: 'upload' | 'download';
        sessionId?: string;
    }): Promise<{
        success: boolean;
        actualLatency: number;
        throughput: number;
        corrupted: boolean;
        duplicated: boolean;
        error?: string;
    }>;
    /**
     * Simulate gradual network degradation
     */
    simulateDegradation(options: {
        fromProfile: string;
        toProfile: string;
        duration: number;
        steps?: number;
    }): Promise<void>;
    private setupAPI;
    private generateSessionId;
    private delay;
    private interpolate;
    private updateSessionMetrics;
    /**
     * Create custom network profile
     */
    addProfile(name: string, profile: Omit<NetworkProfile, 'name'>): void;
    /**
     * Remove custom network profile
     */
    removeProfile(name: string): boolean;
    /**
     * Get session metrics
     */
    getSessionMetrics(sessionId: string): SessionMetrics | null;
    /**
     * Reset all metrics
     */
    resetMetrics(): void;
}
export default NetworkSimulator;
//# sourceMappingURL=network-simulator.d.ts.map