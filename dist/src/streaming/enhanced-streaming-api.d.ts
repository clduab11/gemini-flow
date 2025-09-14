/**
 * Enhanced Streaming API
 *
 * Production-ready multi-modal streaming API with:
 * - Complete multimedia support (video, audio, data)
 * - Real-time performance optimization (<100ms text, <500ms multimedia)
 * - Advanced error handling and recovery
 * - A2A protocol integration
 * - Edge caching and CDN optimization
 * - Machine learning-based adaptation
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { VideoStreamRequest, AudioStreamRequest, VideoStreamResponse, AudioStreamResponse, MultiModalChunk, StreamingSession, NetworkConditions, PerformanceMetrics, StreamQuality, EdgeCacheConfig, CDNConfiguration, SynchronizationConfig, UserPreferences, QualityConstraints } from "../types/streaming.js";
export interface EnhancedStreamingConfig {
    webrtc: {
        iceServers: RTCIceServer[];
        enableDataChannels: boolean;
        enableTranscoding: boolean;
    };
    caching: EdgeCacheConfig;
    cdn: CDNConfiguration;
    synchronization: SynchronizationConfig;
    quality: {
        enableAdaptation: boolean;
        targetLatency: number;
        adaptationSpeed: "slow" | "medium" | "fast";
        mlPrediction: boolean;
    };
    a2a: {
        enableCoordination: boolean;
        consensusThreshold: number;
        failoverTimeout: number;
    };
    performance: {
        textLatencyTarget: number;
        multimediaLatencyTarget: number;
        enableOptimizations: boolean;
        monitoringInterval: number;
    };
    security: {
        enableEncryption: boolean;
        enableAuthentication: boolean;
        enableIntegrityChecks: boolean;
    };
}
export interface StreamSession {
    id: string;
    type: "video" | "audio" | "multimodal" | "data";
    status: "initializing" | "active" | "paused" | "degraded" | "failed" | "ended";
    participants: string[];
    streams: {
        video: Map<string, VideoStreamResponse>;
        audio: Map<string, AudioStreamResponse>;
        data: Map<string, any>;
    };
    quality: StreamQuality;
    metrics: PerformanceMetrics;
    coordination: {
        a2aSession?: StreamingSession;
        masterAgent?: string;
        consensusRequired: boolean;
    };
    security: {
        encrypted: boolean;
        authenticated: boolean;
        integrityProtected: boolean;
    };
    timestamps: {
        created: number;
        started?: number;
        ended?: number;
        lastActivity: number;
    };
}
export interface StreamingContext {
    sessionId: string;
    userId?: string;
    userPreferences: UserPreferences;
    deviceCapabilities: any;
    networkConditions: NetworkConditions;
    constraints: QualityConstraints;
    metadata: Record<string, any>;
}
export declare class EnhancedStreamingAPI extends EventEmitter {
    private logger;
    private config;
    private webrtc;
    private codecManager;
    private bufferSync;
    private a2aExtension;
    private qualityEngine;
    private edgeCache;
    private sessions;
    private performanceMonitor;
    private errorHandler;
    private optimizationEngine;
    private securityManager;
    constructor(config: EnhancedStreamingConfig);
    /**
     * Create a new streaming session
     */
    createSession(sessionId: string, type: "video" | "audio" | "multimodal" | "data", context: StreamingContext): Promise<StreamSession>;
    /**
     * Start video streaming with advanced optimization
     */
    startVideoStream(sessionId: string, request: VideoStreamRequest, context: StreamingContext): Promise<VideoStreamResponse>;
    /**
     * Start audio streaming with low-latency optimization
     */
    startAudioStream(sessionId: string, request: AudioStreamRequest, context: StreamingContext): Promise<AudioStreamResponse>;
    /**
     * Process multi-modal chunks with synchronization
     */
    processMultiModalChunk(sessionId: string, chunk: MultiModalChunk): Promise<boolean>;
    /**
     * Adapt stream quality based on real-time conditions
     */
    adaptStreamQuality(sessionId: string, streamId: string, conditions?: NetworkConditions): Promise<boolean>;
    /**
     * Get comprehensive session metrics
     */
    getSessionMetrics(sessionId: string): PerformanceMetrics | null;
    /**
     * Handle emergency stream degradation
     */
    emergencyDegrade(sessionId: string, reason: string): Promise<boolean>;
    /**
     * End streaming session and cleanup resources
     */
    endSession(sessionId: string): Promise<boolean>;
    /**
     * Get overall API performance statistics
     */
    getPerformanceStatistics(): any;
    /**
     * Setup event handlers for all components
     */
    private setupEventHandlers;
    /**
     * Validate streaming context
     */
    private validateStreamingContext;
    /**
     * Determine initial quality based on context
     */
    private determineInitialQuality;
    /**
     * Initialize performance metrics
     */
    private initializeMetrics;
    /**
     * Calculate optimal buffer size
     */
    private calculateOptimalBufferSize;
    /**
     * Generate cache key for content
     */
    private generateCacheKey;
    /**
     * Create video response from cached content
     */
    private createVideoResponseFromCache;
    /**
     * Setup transcription for audio stream
     */
    private setupTranscription;
    /**
     * Start monitoring for a stream
     */
    private startStreamMonitoring;
    /**
     * Validate latency against target
     */
    private validateLatencyTarget;
    /**
     * Calculate current FPS for session
     */
    private calculateCurrentFPS;
    /**
     * Calculate sync accuracy
     */
    private calculateSyncAccuracy;
    /**
     * Calculate average consensus time
     */
    private calculateAverageConsensusTime;
    /**
     * Calculate message latency
     */
    private calculateMessageLatency;
    /**
     * Get memory usage
     */
    private getMemoryUsage;
    /**
     * Get average buffer health
     */
    private getAverageBufferHealth;
    /**
     * Handle agent failure event
     */
    private handleAgentFailure;
    /**
     * Handle buffer underrun event
     */
    private handleBufferUnderrun;
    /**
     * Handle performance alert
     */
    private handlePerformanceAlert;
    /**
     * Start monitoring systems
     */
    private startMonitoring;
    /**
     * Check health of all sessions
     */
    private checkSessionHealth;
    /**
     * Clean up all resources
     */
    cleanup(): Promise<void>;
}
//# sourceMappingURL=enhanced-streaming-api.d.ts.map