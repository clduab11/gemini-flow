/**
 * Audio Processor - Chirp Audio Integration
 *
 * Comprehensive audio processing with Chirp voice generation,
 * real-time streaming, voice cloning, and WebRTC integration
 */
/// <reference types="node" resolution-mode="require"/>
/// <reference types="node" resolution-mode="require"/>
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { AudioGenerationConfig, AudioGenerationRequest, AudioGenerationResponse, RealTimeConfig, MultimediaContext } from "../../types/multimedia.js";
export interface AudioProcessorMetrics {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    streamingRequests: number;
    realTimeRequests: number;
    voiceCloningRequests: number;
    effectsApplied: number;
    totalDuration: number;
    totalCost: number;
    avgLatency: number;
    cacheHits: number;
}
export interface AudioStreamChunk {
    id: string;
    data: Buffer;
    format: string;
    sampleRate: number;
    channels: number;
    timestamp: number;
    sequenceNumber: number;
    isLast: boolean;
    metadata?: {
        text?: string;
        progress?: number;
        emotion?: string;
        confidence?: number;
    };
}
export declare class AudioProcessor extends EventEmitter {
    private logger;
    private config;
    private performance;
    private cache;
    private chirpAdapter;
    private voiceCloner;
    private effectsEngine;
    private audioStreamer;
    private webrtcManager;
    private audioCache;
    private vertexConnector;
    private isInitialized;
    private activeRequests;
    private streamingSessions;
    private metrics;
    constructor(config: AudioGenerationConfig);
    /**
     * Initialize all audio processing components
     */
    private initializeComponents;
    /**
     * Setup event handlers
     */
    private setupEventHandlers;
    /**
     * Initialize the audio processor
     */
    initialize(): Promise<void>;
    /**
     * Generate audio using Chirp
     */
    generateAudio(request: AudioGenerationRequest): Promise<AudioGenerationResponse>;
    /**
     * Generate audio with streaming
     */
    generateAudioStream(request: AudioGenerationRequest): AsyncIterableIterator<AudioStreamChunk>;
    /**
     * Process audio generation with full pipeline
     */
    private processAudioGeneration;
    /**
     * Prepare custom voice using voice cloning
     */
    private prepareCustomVoice;
    /**
     * Apply audio effects
     */
    private applyAudioEffects;
    /**
     * Apply final processing (normalization, format conversion, etc.)
     */
    private applyFinalProcessing;
    /**
     * Apply audio settings (format, quality, etc.)
     */
    private applyAudioSettings;
    /**
     * Apply enterprise audio enhancements
     */
    private applyEnterpriseAudioEnhancements;
    /**
     * Apply compression optimizations
     */
    private applyCompressionOptimizations;
    /**
     * Audio format conversion
     */
    private convertAudioFormat;
    /**
     * Audio resampling
     */
    private resampleAudio;
    /**
     * Audio normalization
     */
    private normalizeAudio;
    /**
     * Noise reduction
     */
    private removeNoise;
    /**
     * Start real-time audio session
     */
    startRealTimeSession(config: RealTimeConfig, context: MultimediaContext): Promise<string>;
    /**
     * Process real-time audio input
     */
    processRealTimeInput(sessionId: string, audioData: Buffer): Promise<Buffer>;
    /**
     * Check cache for existing result
     */
    private checkCache;
    /**
     * Cache generation result
     */
    private cacheResult;
    /**
     * Update metrics
     */
    private updateMetrics;
    /**
     * Get default streaming config
     */
    private getDefaultStreamingConfig;
    /**
     * Validate request
     */
    validateRequest(request: AudioGenerationRequest): Promise<void>;
    /**
     * Estimate cost
     */
    estimateCost(request: AudioGenerationRequest): number;
    /**
     * Cancel request
     */
    cancelRequest(requestId: string): Promise<boolean>;
    /**
     * End real-time session
     */
    endRealTimeSession(sessionId: string): Promise<void>;
    /**
     * Check if streaming is supported
     */
    supportsStreaming(): boolean;
    /**
     * Generate request ID
     */
    private generateRequestId;
    /**
     * Generate session ID
     */
    private generateSessionId;
    /**
     * Ensure processor is initialized
     */
    private ensureInitialized;
    /**
     * Health check
     */
    healthCheck(): Promise<{
        status: string;
        latency: number;
        error?: string;
    }>;
    /**
     * Get metrics
     */
    getMetrics(): AudioProcessorMetrics;
    /**
     * Shutdown processor
     */
    shutdown(): Promise<void>;
}
//# sourceMappingURL=audio-processor.d.ts.map