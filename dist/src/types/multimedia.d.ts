/**
 * Multimedia Types and Interfaces
 * Core types for multimedia content generation and processing
 */
export interface MultimediaGenerationRequest {
    id: string;
    type: "video" | "audio" | "image" | "mixed";
    prompt: string;
    duration?: number;
    quality: MediaQuality;
    style?: MediaStyle;
    metadata?: MediaMetadata;
}
export interface MediaQuality {
    level: "low" | "medium" | "high" | "ultra" | "auto";
    video?: VideoQuality;
    audio?: AudioQuality;
    image?: ImageQuality;
    bandwidth?: number;
    latency?: number;
}
export interface VideoQuality {
    codec: VideoCodec;
    resolution: Resolution;
    framerate: number;
    bitrate: number;
    keyframeInterval: number;
    adaptiveBitrate: boolean;
}
export interface AudioQuality {
    codec: AudioCodec;
    sampleRate: number;
    channels: number;
    bitrate: number;
    bufferSize: number;
}
export interface ImageQuality {
    format: string;
    resolution: Resolution;
    compression: number;
    colorDepth: number;
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
export interface MediaStyle {
    type: string;
    mood?: string;
    aesthetic?: string;
    colorPalette?: string[];
    effects?: string[];
}
export interface MediaMetadata {
    title?: string;
    description?: string;
    tags?: string[];
    duration?: number;
    size?: number;
    format?: string;
    timestamp?: number;
    creator?: string;
}
export interface VideoGenerationConfig {
    prompt: string;
    duration: number;
    quality: MediaQuality;
    style?: MediaStyle;
    aspectRatio?: string;
    resolution?: Resolution;
    motionControls?: MotionControls;
    styleTransfer?: StyleTransfer;
    audioSync?: AudioSync;
    scenes?: Scene[];
    optimization?: string;
    streaming?: StreamingConfig;
    preview?: PreviewConfig;
    safetyCheck?: boolean;
    enableDetailedMetrics?: boolean;
}
export interface MotionControls {
    cameraMovement?: CameraMovement;
    objectMotion?: ObjectMotion;
    transitionEffects?: string[];
}
export interface CameraMovement {
    type: string;
    direction: string;
    speed: string;
}
export interface ObjectMotion {
    enabled: boolean;
    intensity: string;
}
export interface StyleTransfer {
    enabled: boolean;
    sourceVideo?: string;
    targetStyle: string;
    strength: number;
}
export interface AudioSync {
    enabled: boolean;
    musicStyle?: string;
    tempo?: number;
    moodAlignment?: boolean;
}
export interface Scene {
    prompt: string;
    duration: number;
    transition: string;
}
export interface StreamingConfig {
    enabled: boolean;
    progressUpdates: boolean;
    chunkSize: number;
}
export interface PreviewConfig {
    enabled: boolean;
    updateInterval: number;
    previewQuality: string;
}
//# sourceMappingURL=multimedia.d.ts.map