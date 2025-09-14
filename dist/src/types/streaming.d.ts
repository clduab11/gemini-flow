/**
 * Streaming Types and Interfaces
 * Core types for real-time streaming and multi-modal communication
 */
/// <reference types="node" resolution-mode="require"/>
/// <reference types="node" resolution-mode="require"/>
export interface VideoStreamRequest {
    id: string;
    source: "file" | "camera" | "generated" | "screen";
    quality: StreamQuality;
    endpoint: string;
    metadata?: StreamMetadata;
    priority?: "low" | "medium" | "high" | "critical";
    streaming?: StreamingOptions;
    preview?: PreviewOptions;
    constraints?: {
        video?: any;
    };
}
export interface AudioStreamRequest {
    id: string;
    source: "file" | "microphone" | "generated";
    quality: StreamQuality;
    endpoint: string;
    processing?: AudioProcessing;
    metadata?: StreamMetadata;
    constraints?: {
        audio?: any;
    };
}
export interface StreamQuality {
    level: "low" | "medium" | "high" | "ultra" | "auto";
    video?: VideoStreamQuality;
    audio?: AudioStreamQuality;
    bandwidth: number;
    latency: number;
}
export interface VideoStreamQuality {
    codec: VideoCodec;
    resolution: Resolution;
    framerate: number;
    bitrate: number;
    keyframeInterval: number;
    adaptiveBitrate: boolean;
}
export interface AudioStreamQuality {
    codec: AudioCodec;
    sampleRate: number;
    channels: number;
    bitrate: number;
    bufferSize: number;
}
export interface VideoCodec {
    name: string;
    mimeType: string;
    bitrate: number;
}
export interface AudioCodec {
    name: string;
    mimeType: string;
    bitrate: number;
}
export interface Resolution {
    width: number;
    height: number;
}
export interface StreamMetadata {
    timestamp: number;
    sessionId: string;
    recordingEnabled?: boolean;
    multicast?: boolean;
    transcriptionEnabled?: boolean;
    language?: string;
}
export interface AudioProcessing {
    noiseReduction: boolean;
    echoCancellation: boolean;
    autoGainControl: boolean;
    noiseSuppression: boolean;
}
export interface StreamingOptions {
    enabled: boolean;
    progressUpdates: boolean;
    chunkSize: number;
}
export interface PreviewOptions {
    enabled: boolean;
    updateInterval: number;
    previewQuality: string;
}
export interface MultiModalChunk {
    id: string;
    type: "video" | "audio" | "data";
    timestamp: number;
    sequenceNumber: number;
    data: Buffer;
    metadata: ChunkMetadata;
    stream?: StreamInfo;
    sync?: SyncInfo;
}
export interface ChunkMetadata {
    size: number;
    duration?: number;
    mimeType: string;
    encoding: string;
    checksum: string;
    synchronized: boolean;
    priority: "low" | "medium" | "high" | "critical";
}
export interface StreamInfo {
    videoStreamId?: string;
    audioStreamId?: string;
    sessionId: string;
}
export interface SyncInfo {
    presentationTimestamp: number;
    decodingTimestamp: number;
    keyframe: boolean;
    dependencies: string[];
}
export interface NetworkConditions {
    latency: number | {
        rtt: number;
        jitter: number;
    };
    jitter: number;
    packetLoss: number;
    bandwidth: number | {
        upload: number;
        download: number;
        available: number;
    };
    quality?: {
        packetLoss: number;
        stability: number;
        congestion: number;
    };
    timestamp?: number;
}
export interface PerformanceMetrics {
    throughput: {
        video: number;
        audio: number;
        total: number;
    };
    latency: {
        average: number;
        p95: number;
        p99: number;
        max: number;
    };
    quality: {
        video: number;
        audio: number;
        overall: number;
    };
    reliability: {
        packetsLost: number;
        errorsRecovered: number;
        uptime: number;
    };
}
export interface VideoStreamResponse {
    id: string;
    status: "success" | "error" | "streaming";
    data?: Buffer;
    metadata?: StreamMetadata;
    error?: string;
    stream?: any;
    quality?: StreamQuality;
    endpoints?: string[];
}
export interface AudioStreamResponse {
    id: string;
    status: "success" | "error" | "streaming";
    data?: Buffer;
    metadata?: StreamMetadata;
    error?: string;
    stream?: any;
    quality?: StreamQuality;
    endpoints?: string[];
    transcription?: {
        text: string;
        confidence: number;
        language: string;
        enabled?: boolean;
        segments: Array<{
            start: number;
            end: number;
            text: string;
        }>;
    };
}
export interface StreamingSession {
    id: string;
    status: "active" | "paused" | "stopped";
    streams: {
        video?: VideoStreamRequest;
        audio?: AudioStreamRequest;
    };
    metadata: StreamMetadata;
    startTime: number;
    endTime?: number;
}
export interface StreamingContext {
    sessionId: string;
    userId?: string;
    config: StreamingConfig;
    performance: PerformanceMetrics;
    network: NetworkConditions;
}
export interface StreamingConfig {
    maxConcurrentStreams: number;
    bufferSize: number;
    retryAttempts: number;
    timeout: number;
    quality: StreamQuality;
}
export interface EdgeCacheConfig {
    enabled: boolean;
    ttl: number;
    regions: string[];
    compression: boolean;
    warmupEnabled: boolean;
    maxSize?: number;
    purgeStrategy?: string;
    cdnEndpoints?: string[];
    strategy?: string;
    cacheKeys?: {
        includeQuality?: boolean;
        includeUser?: boolean;
        includeSession?: boolean;
    };
    edgeLocations?: string[];
}
export interface CDNConfiguration {
    provider: string;
    endpoints: string[] | {
        primary: string;
        fallback: string[];
        geographic: Record<string, string>;
    };
    caching: EdgeCacheConfig;
    bandwidth: number;
    regions: string[];
}
export interface WebRTCConfig {
    iceServers: RTCIceServer[];
    enableDataChannels: boolean;
    enableTranscoding: boolean;
    iceTransportPolicy?: RTCIceTransportPolicy;
    bundlePolicy?: RTCBundlePolicy;
    rtcpMuxPolicy?: RTCRtcpMuxPolicy;
    iceCandidatePoolSize?: number;
}
export interface StreamingError {
    code: string;
    message: string;
    timestamp: number;
    recoverable: boolean;
    severity?: string;
}
export interface QualityAdaptationRule {
    condition: string;
    action: string;
    threshold: number;
    priority?: number;
}
export interface SynchronizationConfig {
    enabled: boolean;
    bufferSize: number;
    syncThreshold: number;
    adaptiveSync: boolean;
}
export interface VideoStreamConfig {
    codec: string;
    bitrate: number;
    framerate: number;
    resolution: string;
}
export interface AudioStreamConfig {
    codec: string;
    bitrate: number;
    sampleRate: number;
    channels: number;
}
//# sourceMappingURL=streaming.d.ts.map