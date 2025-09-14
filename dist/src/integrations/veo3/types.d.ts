/**
 * Veo3 Video Generation Types
 *
 * Advanced video generation with distributed rendering, real-time processing, and A2A coordination
 */
/// <reference types="node" resolution-mode="require"/>
/// <reference types="node" resolution-mode="require"/>
import { BaseIntegration, IntegrationConfig } from "../shared/types.js";
export interface Veo3Config extends IntegrationConfig {
    generation: GenerationConfig;
    rendering: RenderingConfig;
    storage: Veo3StorageConfig;
    streaming: StreamingConfig;
    optimization: OptimizationConfig;
    coordination: Veo3CoordinationConfig;
}
export interface GenerationConfig {
    model: string;
    apiEndpoint: string;
    apiKey: string;
    maxDuration: number;
    maxResolution: VideoResolution;
    qualityPresets: QualityPreset[];
    concurrentJobs: number;
    priority: GenerationPriority;
}
export interface RenderingConfig {
    workers: number;
    chunkSize: number;
    parallelism: number;
    codec: VideoCodec;
    bitrate: number;
    framerate: number;
    gpuAcceleration: boolean;
    hardwareEncoder: boolean;
}
export interface Veo3StorageConfig {
    provider: "gcs" | "aws" | "azure" | "local";
    bucket: string;
    region: string;
    credentials: any;
    cdn: CdnConfig;
    compression: CompressionConfig;
    encryption: EncryptionConfig;
}
export interface StreamingConfig {
    enabled: boolean;
    protocol: "rtmp" | "webrtc" | "hls" | "dash";
    quality: StreamQuality[];
    adaptiveBitrate: boolean;
    latency: "low" | "normal" | "high";
    preview: PreviewConfig;
}
export interface OptimizationConfig {
    autoOptimize: boolean;
    targetFileSize: number;
    qualityThreshold: number;
    compressionAlgorithm: string;
    transcoding: TranscodingConfig;
    thumbnailGeneration: ThumbnailConfig;
}
export interface Veo3CoordinationConfig {
    distributedRendering: boolean;
    loadBalancing: boolean;
    failover: boolean;
    coordination: "a2a" | "centralized" | "hybrid";
    chunkCoordination: ChunkCoordinationConfig;
}
export interface VideoResolution {
    width: number;
    height: number;
    aspectRatio: string;
}
export interface QualityPreset {
    name: string;
    resolution: VideoResolution;
    bitrate: number;
    framerate: number;
    codec: VideoCodec;
    profile: string;
}
export type VideoCodec = "h264" | "h265" | "vp9" | "av1";
export type GenerationPriority = "low" | "normal" | "high" | "urgent";
export interface StreamQuality {
    name: string;
    resolution: VideoResolution;
    bitrate: number;
    maxBitrate: number;
    bufferSize: number;
}
export interface PreviewConfig {
    enabled: boolean;
    interval: number;
    resolution: VideoResolution;
    quality: number;
    thumbnails: boolean;
}
export interface TranscodingConfig {
    formats: VideoFormat[];
    qualityLevels: number[];
    parallelJobs: number;
    priority: GenerationPriority;
}
export interface VideoFormat {
    container: "mp4" | "webm" | "avi" | "mov";
    codec: VideoCodec;
    audioCodec: "aac" | "opus" | "mp3";
    profile: string;
}
export interface ThumbnailConfig {
    enabled: boolean;
    count: number;
    interval: number;
    resolution: VideoResolution;
    format: "jpg" | "png" | "webp";
}
export interface CdnConfig {
    provider: "cloudflare" | "aws" | "fastly" | "custom";
    endpoint: string;
    apiKey?: string;
    caching: CacheConfig;
    geoDistribution: boolean;
    analytics: boolean;
}
export interface CacheConfig {
    ttl: number;
    edgeCaching: boolean;
    browserCaching: boolean;
    compression: boolean;
    versioning: boolean;
}
export interface CompressionConfig {
    algorithm: "gzip" | "brotli" | "lz4";
    level: number;
    enabled: boolean;
}
export interface EncryptionConfig {
    enabled: boolean;
    algorithm: "aes256" | "chacha20";
    keyRotation: boolean;
    rotationInterval: number;
}
export interface VideoGenerationPipeline extends BaseIntegration {
    generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResult>;
    processInChunks(request: ChunkedVideoRequest): Promise<ChunkedVideoResult>;
    streamGeneration(request: StreamingVideoRequest): AsyncGenerator<GenerationProgress, VideoGenerationResult>;
    optimizeVideo(videoId: string, options: OptimizationOptions): Promise<OptimizedVideoResult>;
    distributeToCoordinates(request: DistributedGenerationRequest): Promise<DistributedGenerationResult>;
}
export interface VideoGenerationRequest {
    id: string;
    prompt: VideoPrompt;
    configuration: VideoConfiguration;
    output: OutputConfiguration;
    priority: GenerationPriority;
    metadata: GenerationMetadata;
    callbacks?: GenerationCallbacks;
}
export interface VideoPrompt {
    text: string;
    style: VideoStyle;
    mood: VideoMood;
    objects: PromptObject[];
    scenes: SceneDescription[];
    camera: CameraMovement[];
    audio: AudioDescription;
    duration: number;
}
export interface VideoStyle {
    genre: "realistic" | "animated" | "artistic" | "cinematic" | "documentary";
    era: string;
    colorPalette: string[];
    lighting: LightingStyle;
    composition: CompositionStyle;
}
export interface VideoMood {
    emotional_tone: string;
    energy_level: "low" | "medium" | "high";
    atmosphere: string;
    pacing: "slow" | "medium" | "fast";
}
export interface PromptObject {
    name: string;
    description: string;
    position: Position3D;
    animation: AnimationDescription;
    properties: ObjectProperties;
}
export interface Position3D {
    x: number;
    y: number;
    z: number;
    rotation: {
        x: number;
        y: number;
        z: number;
    };
    scale: {
        x: number;
        y: number;
        z: number;
    };
}
export interface AnimationDescription {
    type: "linear" | "ease" | "bounce" | "elastic";
    keyframes: Keyframe[];
    duration: number;
    loop: boolean;
}
export interface Keyframe {
    time: number;
    position: Position3D;
    properties: Record<string, any>;
}
export interface ObjectProperties {
    material: string;
    texture: string;
    physics: PhysicsProperties;
    interactive: boolean;
}
export interface PhysicsProperties {
    mass: number;
    friction: number;
    restitution: number;
    gravity: boolean;
}
export interface SceneDescription {
    name: string;
    duration: number;
    environment: EnvironmentDescription;
    objects: string[];
    transitions: TransitionDescription;
}
export interface EnvironmentDescription {
    location: string;
    timeOfDay: string;
    weather: string;
    lighting: LightingDescription;
    background: BackgroundDescription;
}
export interface LightingDescription {
    type: LightingStyle;
    intensity: number;
    color: string;
    direction: {
        x: number;
        y: number;
        z: number;
    };
    shadows: boolean;
}
export type LightingStyle = "natural" | "dramatic" | "soft" | "harsh" | "colorful" | "monochrome";
export interface BackgroundDescription {
    type: "solid" | "gradient" | "image" | "video" | "procedural";
    content: string;
    properties: Record<string, any>;
}
export interface TransitionDescription {
    type: "cut" | "fade" | "dissolve" | "wipe" | "zoom";
    duration: number;
    easing: string;
}
export interface CameraMovement {
    type: "static" | "pan" | "tilt" | "zoom" | "dolly" | "tracking";
    startPosition: Position3D;
    endPosition: Position3D;
    duration: number;
    easing: string;
}
export interface AudioDescription {
    music: MusicDescription;
    soundEffects: SoundEffect[];
    voiceover: VoiceoverDescription;
    ambient: AmbientSound;
}
export interface MusicDescription {
    genre: string;
    mood: string;
    tempo: number;
    key: string;
    instruments: string[];
    volume: number;
}
export interface SoundEffect {
    name: string;
    timing: number;
    duration: number;
    volume: number;
    position: Position3D;
}
export interface VoiceoverDescription {
    text: string;
    voice: VoiceConfiguration;
    timing: VoiceTiming[];
    emphasis: EmphasisMarker[];
}
export interface VoiceConfiguration {
    gender: "male" | "female" | "neutral";
    age: "young" | "adult" | "elderly";
    accent: string;
    language: string;
    speed: number;
    pitch: number;
}
export interface VoiceTiming {
    text: string;
    startTime: number;
    duration: number;
    speed: number;
}
export interface EmphasisMarker {
    text: string;
    type: "emphasis" | "pause" | "speed" | "pitch";
    value: number;
}
export interface AmbientSound {
    type: string;
    volume: number;
    fadeIn: number;
    fadeOut: number;
    loop: boolean;
}
export interface VideoConfiguration {
    resolution: VideoResolution;
    framerate: number;
    codec: VideoCodec;
    bitrate: number;
    quality: number;
    profile: string;
    format: VideoFormat;
}
export interface OutputConfiguration {
    formats: VideoFormat[];
    storageLocation: string;
    cdn: boolean;
    preview: boolean;
    thumbnails: boolean;
    metadata: boolean;
}
export interface GenerationMetadata {
    userId: string;
    projectId: string;
    tags: string[];
    description: string;
    version: string;
    createdAt: Date;
    expiresAt?: Date;
}
export interface GenerationCallbacks {
    onProgress?: (progress: GenerationProgress) => void;
    onChunkComplete?: (chunk: VideoChunk) => void;
    onPreviewReady?: (preview: PreviewData) => void;
    onComplete?: (result: VideoGenerationResult) => void;
    onError?: (error: GenerationError) => void;
}
export interface ChunkedVideoRequest {
    baseRequest: VideoGenerationRequest;
    chunkingStrategy: ChunkingStrategy;
    coordination: ChunkCoordinationConfig;
    merging: ChunkMergingConfig;
}
export interface ChunkingStrategy {
    type: "temporal" | "spatial" | "object" | "scene" | "adaptive";
    chunkSize: number;
    overlap: number;
    maxChunks: number;
    parallelism: number;
}
export interface ChunkCoordinationConfig {
    strategy: "sequential" | "parallel" | "dependency-based";
    dependencies: Map<number, number[]>;
    prioritization: ChunkPriority[];
    loadBalancing: boolean;
}
export interface ChunkPriority {
    chunkId: number;
    priority: number;
    deadline?: Date;
    resources: number;
}
export interface ChunkMergingConfig {
    strategy: "sequential" | "weighted" | "intelligent";
    blending: BlendingConfig;
    qualityControl: QualityControlConfig;
    validation: ChunkValidationConfig;
}
export interface BlendingConfig {
    enabled: boolean;
    overlapHandling: "average" | "weighted" | "smart";
    transitionSmoothing: boolean;
    colorMatching: boolean;
}
export interface QualityControlConfig {
    enabled: boolean;
    qualityThreshold: number;
    automaticRetry: boolean;
    fallbackStrategy: "regenerate" | "interpolate" | "skip";
}
export interface ChunkValidationConfig {
    enabled: boolean;
    checks: ValidationCheck[];
    tolerance: number;
    reporting: boolean;
}
export interface ValidationCheck {
    type: "quality" | "continuity" | "consistency" | "completeness";
    threshold: number;
    weight: number;
}
export interface VideoChunk {
    id: number;
    startTime: number;
    endTime: number;
    data: Buffer | string;
    metadata: ChunkMetadata;
    quality: ChunkQuality;
    status: ChunkStatus;
}
export interface ChunkMetadata {
    resolution: VideoResolution;
    codec: VideoCodec;
    bitrate: number;
    framerate: number;
    size: number;
    checksum: string;
    generatedAt: Date;
}
export interface ChunkQuality {
    score: number;
    metrics: QualityMetrics;
    issues: QualityIssue[];
}
export interface QualityMetrics {
    psnr: number;
    ssim: number;
    vmaf: number;
    bitrate: number;
    artifacts: number;
}
export interface QualityIssue {
    type: string;
    severity: "low" | "medium" | "high";
    location: {
        start: number;
        end: number;
    };
    description: string;
}
export type ChunkStatus = "pending" | "generating" | "completed" | "failed" | "merged";
export interface ChunkedVideoResult {
    videoId: string;
    chunks: VideoChunk[];
    mergedVideo: VideoFile;
    quality: OverallQuality;
    performance: ChunkingPerformance;
    metadata: ResultMetadata;
}
export interface OverallQuality {
    score: number;
    chunkQuality: Map<number, number>;
    consistency: number;
    smoothness: number;
}
export interface ChunkingPerformance {
    totalTime: number;
    parallelEfficiency: number;
    resourceUtilization: ResourceUtilization;
    bottlenecks: string[];
}
export interface ResourceUtilization {
    cpu: number;
    memory: number;
    gpu: number;
    network: number;
    storage: number;
}
export interface StreamingVideoRequest {
    baseRequest: VideoGenerationRequest;
    streaming: StreamingConfiguration;
    realTime: RealTimeConfig;
}
export interface StreamingConfiguration {
    protocol: "webrtc" | "websocket" | "sse" | "grpc";
    bufferSize: number;
    latency: number;
    quality: StreamQuality;
    adaptiveQuality: boolean;
}
export interface RealTimeConfig {
    preview: boolean;
    progressUpdates: boolean;
    liveEditing: boolean;
    interactiveMode: boolean;
}
export interface GenerationProgress {
    stage: GenerationStage;
    progress: number;
    currentChunk?: number;
    totalChunks?: number;
    estimatedCompletion: Date;
    quality: number;
    preview?: PreviewData;
    metadata: ProgressMetadata;
}
export type GenerationStage = "initializing" | "prompt_processing" | "scene_planning" | "rendering" | "post_processing" | "optimization" | "encoding" | "uploading" | "complete";
export interface PreviewData {
    type: "image" | "video" | "thumbnail";
    data: string | Buffer;
    timestamp: number;
    quality: number;
    resolution: VideoResolution;
}
export interface ProgressMetadata {
    currentFps: number;
    memoryUsage: number;
    gpuUsage: number;
    networkUsage: number;
    errors: string[];
    warnings: string[];
}
export interface OptimizationOptions {
    targetFileSize?: number;
    maxQualityLoss?: number;
    preserveAspectRatio?: boolean;
    formats?: VideoFormat[];
    customSettings?: Record<string, any>;
}
export interface OptimizedVideoResult {
    originalSize: number;
    optimizedSize: number;
    compression: number;
    qualityLoss: number;
    optimizations: OptimizationApplied[];
    formats: OptimizedFormat[];
}
export interface OptimizationApplied {
    type: string;
    value: any;
    impact: OptimizationImpact;
}
export interface OptimizationImpact {
    sizeReduction: number;
    qualityChange: number;
    processingTime: number;
}
export interface OptimizedFormat {
    format: VideoFormat;
    size: number;
    quality: number;
    url: string;
}
export interface DistributedGenerationRequest {
    baseRequest: VideoGenerationRequest;
    distribution: DistributionConfig;
    coordination: DistributedCoordinationConfig;
    aggregation: ResultAggregationConfig;
}
export interface DistributionConfig {
    strategy: "chunk-based" | "scene-based" | "object-based" | "adaptive";
    workers: WorkerConfig[];
    loadBalancing: LoadBalancingConfig;
    failover: FailoverConfig;
}
export interface WorkerConfig {
    id: string;
    endpoint: string;
    capabilities: WorkerCapabilities;
    performance: WorkerPerformance;
    availability: WorkerAvailability;
}
export interface WorkerCapabilities {
    maxResolution: VideoResolution;
    supportedCodecs: VideoCodec[];
    gpuAcceleration: boolean;
    maxConcurrentJobs: number;
    specializations: string[];
}
export interface WorkerPerformance {
    avgProcessingTime: number;
    throughput: number;
    reliability: number;
    qualityScore: number;
}
export interface WorkerAvailability {
    status: "available" | "busy" | "offline";
    currentLoad: number;
    estimatedAvailable: Date;
    timezone: string;
}
export interface LoadBalancingConfig {
    strategy: "round-robin" | "least-loaded" | "performance-based" | "adaptive";
    weights: Map<string, number>;
    constraints: LoadBalancingConstraint[];
}
export interface LoadBalancingConstraint {
    type: "resource" | "quality" | "latency" | "cost";
    value: number;
    priority: number;
}
export interface FailoverConfig {
    enabled: boolean;
    retryAttempts: number;
    fallbackWorkers: string[];
    gracefulDegradation: boolean;
}
export interface DistributedCoordinationConfig {
    protocol: "a2a" | "centralized" | "gossip";
    consensus: ConsensusConfig;
    synchronization: SyncConfig;
    monitoring: DistributedMonitoringConfig;
}
export interface ConsensusConfig {
    algorithm: "raft" | "pbft" | "pow" | "pos";
    quorum: number;
    timeout: number;
    leaderElection: boolean;
}
export interface SyncConfig {
    strategy: "strict" | "eventual" | "weak";
    interval: number;
    tolerance: number;
}
export interface DistributedMonitoringConfig {
    healthChecks: boolean;
    performanceMetrics: boolean;
    networkPartitioning: boolean;
    automaticRecovery: boolean;
}
export interface ResultAggregationConfig {
    strategy: "merge" | "composite" | "layered" | "intelligent";
    qualityWeighting: boolean;
    conflictResolution: ConflictResolutionConfig;
    validation: AggregationValidationConfig;
}
export interface ConflictResolutionConfig {
    strategy: "quality-based" | "timestamp-based" | "worker-reputation" | "voting";
    threshold: number;
    fallback: string;
}
export interface AggregationValidationConfig {
    enabled: boolean;
    checks: string[];
    tolerance: number;
    retryOnFailure: boolean;
}
export interface DistributedGenerationResult {
    videoId: string;
    coordinationMap: Map<string, string[]>;
    workerContributions: Map<string, WorkerContribution>;
    aggregatedResult: VideoFile;
    performance: DistributedPerformance;
    coordination: CoordinationMetrics;
}
export interface WorkerContribution {
    workerId: string;
    chunksProcessed: number[];
    processingTime: number;
    quality: number;
    resources: ResourceUsage;
}
export interface ResourceUsage {
    cpu: number;
    memory: number;
    gpu: number;
    network: number;
}
export interface DistributedPerformance {
    totalTime: number;
    parallelEfficiency: number;
    networkOverhead: number;
    coordinationTime: number;
    aggregationTime: number;
}
export interface CoordinationMetrics {
    messagesSent: number;
    messagesReceived: number;
    consensusRounds: number;
    partitioningEvents: number;
    recoveryTime: number;
}
export interface VideoGenerationResult {
    videoId: string;
    status: "success" | "partial" | "failed";
    files: VideoFile[];
    preview: PreviewData[];
    thumbnails: ThumbnailData[];
    metadata: ResultMetadata;
    performance: GenerationPerformance;
    quality: QualityReport;
    storage: StorageInfo;
}
export interface VideoFile {
    id: string;
    format: VideoFormat;
    resolution: VideoResolution;
    duration: number;
    size: number;
    url: string;
    localPath?: string;
    checksum: string;
    metadata: FileMetadata;
}
export interface FileMetadata {
    codec: VideoCodec;
    bitrate: number;
    framerate: number;
    audioTracks: AudioTrack[];
    subtitles: SubtitleTrack[];
    chapters: ChapterInfo[];
}
export interface AudioTrack {
    codec: string;
    bitrate: number;
    sampleRate: number;
    channels: number;
    language: string;
}
export interface SubtitleTrack {
    format: "srt" | "vtt" | "ass";
    language: string;
    url: string;
}
export interface ChapterInfo {
    title: string;
    startTime: number;
    endTime: number;
    thumbnail?: string;
}
export interface ThumbnailData {
    timestamp: number;
    url: string;
    resolution: VideoResolution;
    format: "jpg" | "png" | "webp";
    size: number;
}
export interface ResultMetadata {
    generationId: string;
    createdAt: Date;
    processingTime: number;
    workers: string[];
    version: string;
    configuration: VideoConfiguration;
    prompt: VideoPrompt;
}
export interface GenerationPerformance {
    totalTime: number;
    stagesTime: Map<GenerationStage, number>;
    resourceUsage: ResourceUtilization;
    throughput: number;
    efficiency: number;
}
export interface QualityReport {
    overallScore: number;
    metrics: QualityMetrics;
    issues: QualityIssue[];
    recommendations: string[];
    comparisons: QualityComparison[];
}
export interface QualityComparison {
    metric: string;
    expected: number;
    actual: number;
    variance: number;
}
export interface StorageInfo {
    provider: string;
    location: string;
    redundancy: number;
    encryption: boolean;
    compression: number;
    cdn: CdnInfo;
}
export interface CdnInfo {
    enabled: boolean;
    provider: string;
    endpoints: string[];
    cacheStatus: string;
    hitRate: number;
}
export interface GenerationError {
    code: string;
    message: string;
    stage: GenerationStage;
    chunk?: number;
    worker?: string;
    recoverable: boolean;
    retry: boolean;
    metadata: Record<string, any>;
    timestamp: Date;
}
export interface CompositionStyle {
    rule: "thirds" | "golden" | "center" | "leading-lines";
    framing: "close-up" | "medium" | "wide" | "extreme-wide";
    angle: "eye-level" | "high" | "low" | "dutch";
    depth: "shallow" | "deep" | "infinite";
}
//# sourceMappingURL=types.d.ts.map