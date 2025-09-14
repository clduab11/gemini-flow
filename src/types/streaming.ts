/**
 * Streaming Types and Interfaces
 * Core types for real-time streaming and multi-modal communication
 */

export interface VideoStreamRequest {
  id: string;
  source:
    | "file"
    | "camera"
    | "generated"
    | "screen"
    | "virtual"
    | "3d_render";
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
  source: "file" | "microphone" | "generated" | "system" | "virtual" | "synthesized";
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
  latency: number | { rtt: number; jitter: number };
  jitter: number;
  packetLoss: number;
  bandwidth: number | { upload: number; download: number; available: number };
  quality?: { packetLoss: number; stability: number; congestion: number };
  timestamp?: number;
}

export interface PerformanceMetrics {
  // Enhanced streaming metrics (optional)
  encoding?: {
    fps: number;
    keyframeInterval: number;
    bitrate: number;
    cpuUsage: number;
    memoryUsage: number;
  };
  network?: {
    throughput: number;
    latency: number;
    jitter: number;
    packetLoss: number;
  };
  playback?: {
    droppedFrames: number;
    bufferHealth: number;
    qualityLevel: string;
    stallEvents: number;
  };
  coordination?: {
    agentCount: number;
    syncAccuracy: number;
    consensusTime: number;
    messageLatency: number;
  };
  // Legacy metrics for compatibility (optional)
  throughput?: { video: number; audio: number; total: number };
  latency?: { average: number; p95: number; p99: number; max: number };
  quality?: { video: number; audio: number; overall: number };
  reliability?: { packetsLost: number; errorsRecovered: number; uptime: number };
  [key: string]: any;
}

// Additional streaming interfaces for unified-api compatibility
export interface VideoStreamResponse {
  id: string;
  status: "success" | "error" | "streaming";
  data?: Buffer;
  metadata?: StreamMetadata;
  error?: string;
  stream?: any;
  quality?: StreamQuality;
  endpoints?:
    | string[]
    | {
        webrtc?: RTCPeerConnection;
        [key: string]: any;
      };
  stats?: any;
}

export interface AudioStreamResponse {
  id: string;
  status: "success" | "error" | "streaming";
  data?: Buffer;
  metadata?: StreamMetadata;
  error?: string;
  stream?: any;
  quality?: StreamQuality;
  endpoints?:
    | string[]
    | {
        webrtc?: RTCPeerConnection;
        [key: string]: any;
      };
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
  stats?: any;
}

export interface StreamingSession {
  id: string;
  status: "active" | "paused" | "stopped";
  streams: {
    video?: VideoStreamRequest | any;
    audio?: AudioStreamRequest | any;
    [key: string]: any;
  };
  metadata: StreamMetadata;
  startTime: number;
  endTime?: number;
  participants?: any[];
  type?: string;
  coordination?: any;
  metrics?: any;
}

export interface StreamingContext {
  sessionId: string;
  userId?: string;
  // Enhanced context (optional to maintain backward compatibility)
  userPreferences?: UserPreferences;
  deviceCapabilities?: any;
  networkConditions?: NetworkConditions;
  constraints?: QualityConstraints;
  metadata?: Record<string, any>;
  // Legacy/general fields
  config?: StreamingConfig;
  performance?: PerformanceMetrics;
  network?: NetworkConditions;
}

export interface StreamingConfig {
  maxConcurrentStreams: number;
  bufferSize: number;
  retryAttempts: number;
  timeout: number;
  quality: StreamQuality;
}

// Media/codec types used by codec manager
export interface MediaCodec {
  name: string;
  mimeType: string;
  bitrate: number;
  sampleRate?: number;
  channels?: number;
  profile?: string;
  level?: string;
}

// Shared user preferences and constraints (for enhanced streaming)
export interface UserPreferences {
  qualityPriority: "battery" | "quality" | "data" | "balanced";
  maxBitrate: number;
  autoAdjust: boolean;
  preferredResolution: { width: number; height: number };
  latencyTolerance: number;
  dataUsageLimit: number;
  adaptationSpeed: "slow" | "medium" | "fast";
}

export interface QualityConstraints {
  minBitrate: number;
  maxBitrate: number;
  minResolution: { width: number; height: number };
  maxResolution: { width: number; height: number };
  minFramerate: number;
  maxFramerate: number;
  latencyBudget: number;
  powerBudget: number;
}

export interface EdgeCacheConfig {
  enabled: boolean;
  ttl: number;
  regions?: string[];
  compression?: boolean;
  warmupEnabled?: boolean;
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
  bandwidth?: number;
  regions?: string[];
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
  category?: string;
  context?: any;
  recovery?: {
    suggested: string[];
    automatic: boolean;
    retryable: boolean;
    fallback?: string;
  };
}

export interface QualityAdaptationRule {
  condition: {
    packetLoss?: { min?: number; max?: number };
    bandwidth?: { min?: number; max?: number };
    latency?: { min?: number; max?: number };
    bufferHealth?: { min?: number; max?: number };
    [key: string]: any;
  };
  action: { type: "upgrade" | "downgrade" | "maintain" | "emergency"; targetQuality?: StreamQuality };
  priority?: number;
  cooldown?: number;
}

export interface SynchronizationConfig {
  enabled: boolean;
  bufferSize: number;
  syncThreshold: number;
  adaptiveSync: boolean;
  tolerance?: number;
}

export interface BufferingStrategy {
  type: "fixed" | "adaptive" | string;
  bufferSize: number;
  targetLatency: number;
  [key: string]: any;
}

export interface VideoStreamConfig {
  codec: string | VideoCodec;
  bitrate: number;
  framerate: number;
  resolution: Resolution;
  keyframeInterval?: number;
}

export interface AudioStreamConfig {
  codec: string | AudioCodec;
  bitrate: number;
  sampleRate: number;
  channels: number;
  bufferSize?: number;
}
