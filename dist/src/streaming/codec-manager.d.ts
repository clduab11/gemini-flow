/**
 * Media Codec Manager
 *
 * Comprehensive codec support with format detection and conversion:
 * - H.264, WebM, VP9, AV1 video codecs
 * - Opus, AAC, MP3 audio codecs
 * - Real-time transcoding capabilities
 * - Hardware acceleration detection
 * - Adaptive bitrate encoding
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { MediaCodec, VideoStreamConfig, AudioStreamConfig, StreamQuality } from "../types/streaming.js";
export interface CodecCapabilities {
    encoding: boolean;
    decoding: boolean;
    hardwareAcceleration: boolean;
    profiles: string[];
    levels: string[];
    maxResolution?: {
        width: number;
        height: number;
    };
    maxBitrate?: number;
    maxFramerate?: number;
}
export interface TranscodingJob {
    id: string;
    source: {
        codec: MediaCodec;
        data: ArrayBuffer | MediaStream;
        metadata: any;
    };
    target: {
        codec: MediaCodec;
        quality: StreamQuality;
        container?: string;
    };
    progress: number;
    status: "pending" | "processing" | "completed" | "failed";
    performance: {
        startTime: number;
        endTime?: number;
        fps?: number;
        throughput?: number;
    };
}
export interface CodecProfile {
    name: string;
    mimeType: string;
    supportedFormats: string[];
    defaultConfig: Partial<VideoStreamConfig | AudioStreamConfig>;
    capabilities: CodecCapabilities;
    priority: number;
    hardwareAccelerated: boolean;
}
export declare class CodecManager extends EventEmitter {
    private logger;
    private supportedCodecs;
    private transcodingJobs;
    private hardwareCapabilities;
    private qualityPresets;
    constructor();
    /**
     * Initialize supported codecs with configurations
     */
    private initializeCodecs;
    /**
     * Register a new codec profile
     */
    private registerCodec;
    /**
     * Get optimal codec for given constraints
     */
    getOptimalCodec(type: "video" | "audio", constraints: {
        quality?: StreamQuality;
        bandwidth?: number;
        latency?: number;
        compatibility?: string[];
        hardwareAcceleration?: boolean;
    }): MediaCodec | null;
    /**
     * Detect format of input media
     */
    detectFormat(data: ArrayBuffer | string): Promise<{
        format: string;
        codec: string;
        metadata: any;
    } | null>;
    /**
     * Start transcoding operation
     */
    startTranscoding(sourceData: ArrayBuffer | MediaStream, sourceCodec: MediaCodec, targetCodec: MediaCodec, quality: StreamQuality): Promise<TranscodingJob>;
    /**
     * Check if codec can be hardware accelerated
     */
    isHardwareAccelerated(codecName: string): boolean;
    /**
     * Get all supported codecs for a type
     */
    getSupportedCodecs(type: "video" | "audio"): CodecProfile[];
    /**
     * Create adaptive bitrate ladder
     */
    createAdaptiveBitrateConfigs(baseCodec: MediaCodec, maxBitrate: number): {
        quality: string;
        codec: MediaCodec;
        bitrate: number;
    }[];
    /**
     * Check codec compatibility with browser
     */
    checkCodecSupport(codecString: string): Promise<boolean>;
    /**
     * Get transcoding job status
     */
    getTranscodingStatus(jobId: string): TranscodingJob | null;
    /**
     * Cancel transcoding job
     */
    cancelTranscoding(jobId: string): boolean;
    /**
     * Process transcoding job
     */
    private processTranscodingJob;
    /**
     * Detect hardware capabilities
     */
    private detectHardwareCapabilities;
    /**
     * Check if specific codec has hardware support
     */
    private checkHardwareSupport;
    /**
     * Setup quality presets
     */
    private setupQualityPresets;
    /**
     * Check if codec meets constraints
     */
    private meetsConstraints;
    /**
     * Score codec based on constraints
     */
    private scoreCodec;
    /**
     * Check if codec is for specified type
     */
    private isCodecType;
    /**
     * Create MediaCodec from profile
     */
    private createMediaCodec;
    /**
     * Get optimal container for codec
     */
    private getOptimalContainer;
    /**
     * Detect format from URL
     */
    private detectFormatFromUrl;
    /**
     * Detect format from binary data
     */
    private detectFormatFromBinary;
    /**
     * Check binary signature
     */
    private checkSignature;
    /**
     * Extract codec name from MIME type
     */
    private extractCodecName;
    /**
     * Generate unique job ID
     */
    private generateJobId;
    /**
     * Clean up resources
     */
    cleanup(): void;
}
//# sourceMappingURL=codec-manager.d.ts.map