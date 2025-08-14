/**
 * Streaming Types and Interfaces
 * Core types for real-time streaming and multi-modal communication
 */

export interface VideoStreamRequest {
  id: string;
  source: 'file' | 'camera' | 'generated';
  quality: StreamQuality;
  endpoint: string;
  metadata?: StreamMetadata;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  streaming?: StreamingOptions;
  preview?: PreviewOptions;
}

export interface AudioStreamRequest {
  id: string;
  source: 'file' | 'microphone' | 'generated';
  quality: StreamQuality;
  endpoint: string;
  processing?: AudioProcessing;
  metadata?: StreamMetadata;
}

export interface StreamQuality {
  level: 'low' | 'medium' | 'high' | 'ultra' | 'auto';
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
  type: 'video' | 'audio' | 'data';
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
  priority: 'low' | 'medium' | 'high' | 'critical';
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
  latency: number;
  jitter: number;
  packetLoss: number;
  bandwidth: number;
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