/**
 * A2A Multimedia Protocol Helper Methods
 * Additional helper methods for the main protocol implementation
 */
import { A2AMultimediaMessage, MessageStatistics, BandwidthStatistics, LatencyStatistics, QualityStatistics, ErrorStatistics } from "./a2a-multimedia-protocol.js";
export declare class ProtocolHelpers {
    private logger;
    constructor();
    establishRoutingPath(sessionId: string, agentId: string): Promise<void>;
    deliverMessage(message: A2AMultimediaMessage, targetId: string): Promise<boolean>;
    handleRoutingFailover(message: A2AMultimediaMessage, failedHop: string): Promise<boolean>;
    updateRoutingStatistics(message: A2AMultimediaMessage, success: boolean): void;
    createWebRTCEndpoint(streamId: string, config: any): Promise<string>;
    createHttpStreamingEndpoint(streamId: string, targetAgent: string, config: any): Promise<string>;
    createMulticastEndpoint(streamId: string, config: any): Promise<string>;
    calculateMessageStatistics(sessionId: string): Promise<MessageStatistics>;
    calculateBandwidthStatistics(sessionId: string): Promise<BandwidthStatistics>;
    calculateLatencyStatistics(sessionId: string): Promise<LatencyStatistics>;
    calculateQualityStatistics(sessionId: string): Promise<QualityStatistics>;
    calculateErrorStatistics(sessionId: string): Promise<ErrorStatistics>;
    generateUniqueId(prefix?: string): string;
    calculateChecksum(data: any): string;
    sleep(ms: number): Promise<void>;
    formatBytes(bytes: number): string;
    formatLatency(ms: number): string;
    calculatePercentile(values: number[], percentile: number): number;
    validateConfiguration(config: any): {
        valid: boolean;
        errors: string[];
    };
    sanitizeUserInput(input: string): string;
    createRetryStrategy(maxAttempts?: number, baseDelay?: number): {
        attempt: number;
        shouldRetry: (error: any) => boolean;
        getDelay: () => number;
        retry: () => void;
    };
}
export declare const protocolHelpers: ProtocolHelpers;
//# sourceMappingURL=a2a-multimedia-protocol-helpers.d.ts.map