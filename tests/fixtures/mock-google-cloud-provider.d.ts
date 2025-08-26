/**
 * Mock Google Cloud Provider for Integration Testing
 *
 * Provides realistic mock implementations of Google Cloud services
 * with configurable latency, error rates, and response patterns.
 */
/// <reference types="node" />
import { EventEmitter } from 'events';
import { Request, Response } from 'express';
export interface MockProviderConfig {
    latency: {
        min: number;
        max: number;
    };
    reliability: number;
    rateLimits: Record<string, number>;
    responseSize: {
        min: number;
        max: number;
    };
    cors?: boolean;
    logging?: boolean;
}
export interface ServiceEndpoint {
    path: string;
    method: string;
    handler: (req: Request, res: Response) => void | Promise<void>;
    rateLimit?: number;
    auth?: boolean;
}
export declare class MockGoogleCloudProvider extends EventEmitter {
    private config;
    private port;
    private app;
    private server;
    private wsServer;
    private rateLimitCounters;
    private requestCounts;
    constructor(config: MockProviderConfig, port?: number);
    start(): Promise<void>;
    stop(): Promise<void>;
    getApiKey(): string;
    getConfig(): any;
    private setupMiddleware;
    private setupEndpoints;
    private setupWebSocketHandlers;
    private handleWebSocketMessage;
    private startMockStream;
    private handleVertexAIPredict;
    private handleVertexAIStream;
    private handleCreateStreamingSession;
    private handleEndStreamingSession;
    private handleStartVideoStream;
    private handleStartAudioStream;
    private handleVideoGeneration;
    private handleVideoStatus;
    private handleVideoDownload;
    private handleImageGeneration;
    private handleImageDownload;
    private handleSpeechSynthesis;
    private handleListVoices;
    private handleMusicGeneration;
    private handleMusicStatus;
    private handleMetrics;
    private randomLatency;
    private sleep;
    private getRateLimit;
    private checkRateLimit;
    private getRateLimitResetTime;
    private incrementRequestCount;
    private generateMockContent;
    private generateSafetyRatings;
    private generateStreamingChunks;
    private generateMockChunkData;
    private generateMockAudioData;
}
export default MockGoogleCloudProvider;
//# sourceMappingURL=mock-google-cloud-provider.d.ts.map