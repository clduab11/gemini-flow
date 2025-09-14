/**
 * Chirp Audio Processor with Real-time Streaming
 *
 * Advanced audio processing engine with real-time streaming capabilities,
 * AI-powered audio enhancement, and comprehensive signal processing.
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { AudioConfig, RealTimeStreamingConfig, ServiceResponse, PerformanceMetrics } from "./interfaces.js";
export interface ChirpConfig {
    processing: ProcessingConfig;
    streaming: StreamingConfig;
    analysis: AnalysisConfig;
    enhancement: EnhancementConfig;
    codec: CodecConfig;
}
export interface ProcessingConfig {
    sampleRate: number;
    bitDepth: number;
    channels: number;
    frameSize: number;
    bufferSize: number;
    pipeline: PipelineConfig;
}
export interface PipelineConfig {
    stages: ProcessingStageConfig[];
    parallel: boolean;
    realTime: boolean;
    latency: LatencyConfig;
}
export interface ProcessingStageConfig {
    name: string;
    type: "filter" | "enhancement" | "analysis" | "synthesis" | "effect";
    enabled: boolean;
    priority: number;
    parameters: StageParameters;
}
export interface StageParameters {
    [key: string]: any;
}
export interface LatencyConfig {
    target: number;
    maximum: number;
    jitter: number;
    adaptive: boolean;
}
export interface StreamingConfig {
    protocols: ProtocolConfig[];
    compression: CompressionConfig;
    adaptive: AdaptiveConfig;
    network: NetworkConfig;
}
export interface ProtocolConfig {
    type: "websocket" | "webrtc" | "rtmp" | "hls" | "dash";
    enabled: boolean;
    priority: number;
    configuration: ProtocolSettings;
}
export interface ProtocolSettings {
    [key: string]: any;
}
export interface CompressionConfig {
    algorithm: "opus" | "aac" | "mp3" | "flac" | "vorbis";
    bitrate: number;
    quality: number;
    complexity: number;
    vbr: boolean;
}
export interface AdaptiveConfig {
    enabled: boolean;
    bitrate: AdaptiveBitrate;
    quality: AdaptiveQuality;
    latency: AdaptiveLatency;
}
export interface AdaptiveBitrate {
    min: number;
    max: number;
    step: number;
    algorithm: "bandwidth" | "buffer" | "hybrid";
}
export interface AdaptiveQuality {
    levels: QualityLevel[];
    switching: SwitchingConfig;
}
export interface QualityLevel {
    name: string;
    bitrate: number;
    sampleRate: number;
    channels: number;
}
export interface SwitchingConfig {
    threshold: number;
    hysteresis: number;
    delay: number;
}
export interface AdaptiveLatency {
    target: number;
    range: [number, number];
    adjustment: number;
}
export interface NetworkConfig {
    monitoring: NetworkMonitoring;
    optimization: NetworkOptimization;
    recovery: RecoveryConfig;
}
export interface NetworkMonitoring {
    bandwidth: boolean;
    latency: boolean;
    packetLoss: boolean;
    jitter: boolean;
    interval: number;
}
export interface NetworkOptimization {
    prioritization: boolean;
    buffering: BufferingConfig;
    prediction: PredictionConfig;
}
export interface BufferingConfig {
    size: number;
    adaptive: boolean;
    prefetch: boolean;
}
export interface PredictionConfig {
    enabled: boolean;
    algorithm: "linear" | "kalman" | "neural";
    window: number;
}
export interface RecoveryConfig {
    errorCorrection: ErrorCorrectionConfig;
    redundancy: RedundancyConfig;
    retransmission: RetransmissionConfig;
}
export interface ErrorCorrectionConfig {
    fec: boolean;
    interleaving: boolean;
    redundancy: number;
}
export interface RedundancyConfig {
    enabled: boolean;
    level: number;
    adaptive: boolean;
}
export interface RetransmissionConfig {
    enabled: boolean;
    maxAttempts: number;
    timeout: number;
}
export interface AnalysisConfig {
    spectral: SpectralAnalysisConfig;
    temporal: TemporalAnalysisConfig;
    perceptual: PerceptualAnalysisConfig;
    ml: MLAnalysisConfig;
}
export interface SpectralAnalysisConfig {
    fft: FFTConfig;
    filterBank: FilterBankConfig;
    cepstral: CepstralConfig;
    chromagram: ChromagramConfig;
}
export interface FFTConfig {
    size: number;
    window: "hann" | "hamming" | "blackman" | "gaussian";
    overlap: number;
    zeropadding: number;
}
export interface FilterBankConfig {
    type: "mel" | "bark" | "erb" | "linear";
    filters: number;
    range: [number, number];
}
export interface CepstralConfig {
    coefficients: number;
    liftering: number;
    delta: boolean;
    deltaDelta: boolean;
}
export interface ChromagramConfig {
    bins: number;
    tuning: number;
    norm: "l1" | "l2" | "max";
}
export interface TemporalAnalysisConfig {
    envelope: EnvelopeConfig;
    onset: OnsetConfig;
    tempo: TempoConfig;
    rhythm: RhythmConfig;
}
export interface EnvelopeConfig {
    hopLength: number;
    frameLength: number;
    center: boolean;
}
export interface OnsetConfig {
    units: "time" | "frames";
    backtrack: boolean;
    energy: number;
}
export interface TempoConfig {
    bpm: [number, number];
    hop: number;
    aggregate: "mean" | "median" | "max";
}
export interface RhythmConfig {
    beats: boolean;
    downbeats: boolean;
    meter: boolean;
}
export interface PerceptualAnalysisConfig {
    loudness: LoudnessConfig;
    pitch: PitchConfig;
    timbre: TimbreConfig;
    quality: QualityConfig;
}
export interface LoudnessConfig {
    standard: "lufs" | "rms" | "peak";
    gating: boolean;
    shortTerm: number;
    momentary: number;
}
export interface PitchConfig {
    algorithm: "yin" | "pyin" | "swipe" | "crepe";
    range: [number, number];
    threshold: number;
}
export interface TimbreConfig {
    features: TimbreFeature[];
    descriptors: TimbreDescriptor[];
}
export interface TimbreFeature {
    name: string;
    enabled: boolean;
    parameters: any;
}
export interface TimbreDescriptor {
    name: string;
    statistics: string[];
}
export interface QualityConfig {
    snr: boolean;
    thd: boolean;
    pesq: boolean;
    stoi: boolean;
}
export interface MLAnalysisConfig {
    models: MLModelConfig[];
    inference: InferenceConfig;
    training: TrainingConfig;
}
export interface MLModelConfig {
    name: string;
    type: "classification" | "regression" | "detection" | "generation";
    architecture: string;
    weights: string;
    enabled: boolean;
}
export interface InferenceConfig {
    batchSize: number;
    device: "cpu" | "gpu" | "auto";
    precision: "fp16" | "fp32";
    optimization: boolean;
}
export interface TrainingConfig {
    enabled: boolean;
    data: DataConfig;
    validation: ValidationConfig;
    checkpoints: CheckpointConfig;
}
export interface DataConfig {
    augmentation: boolean;
    normalization: boolean;
    splitting: SplittingConfig;
}
export interface ValidationConfig {
    metric: string[];
    frequency: number;
    patience: number;
}
export interface CheckpointConfig {
    frequency: number;
    bestOnly: boolean;
    path: string;
}
export interface SplittingConfig {
    train: number;
    validation: number;
    test: number;
}
export interface EnhancementConfig {
    denoise: DenoiseConfig;
    dereverberation: DereverberationConfig;
    enhancement: SignalEnhancementConfig;
    restoration: RestorationConfig;
}
export interface DenoiseConfig {
    enabled: boolean;
    algorithm: "spectral" | "wiener" | "rnn" | "transformer";
    aggressiveness: number;
    preservation: number;
}
export interface DereverberationConfig {
    enabled: boolean;
    algorithm: "spectral" | "linear_prediction" | "deep_learning";
    strength: number;
    preservation: number;
}
export interface SignalEnhancementConfig {
    equalization: EqualizationConfig;
    dynamics: DynamicsConfig;
    spatialization: SpatializationConfig;
}
export interface EqualizationConfig {
    enabled: boolean;
    type: "graphic" | "parametric" | "linear_phase";
    bands: EqualizerBand[];
    automatic: boolean;
}
export interface EqualizerBand {
    frequency: number;
    gain: number;
    q: number;
    type: "peak" | "highpass" | "lowpass" | "shelf";
}
export interface DynamicsConfig {
    compressor: CompressorConfig;
    limiter: LimiterConfig;
    gate: GateConfig;
    expander: ExpanderConfig;
}
export interface CompressorConfig {
    enabled: boolean;
    threshold: number;
    ratio: number;
    attack: number;
    release: number;
    makeup: number;
}
export interface LimiterConfig {
    enabled: boolean;
    threshold: number;
    release: number;
    lookahead: number;
}
export interface GateConfig {
    enabled: boolean;
    threshold: number;
    ratio: number;
    attack: number;
    hold: number;
    release: number;
}
export interface ExpanderConfig {
    enabled: boolean;
    threshold: number;
    ratio: number;
    attack: number;
    release: number;
}
export interface SpatializationConfig {
    enabled: boolean;
    algorithm: "binaural" | "ambisonics" | "vbap" | "wavefield";
    room: RoomConfig;
    hrtf: HRTFConfig;
}
export interface RoomConfig {
    size: [number, number, number];
    materials: MaterialConfig[];
    absorption: number;
    diffusion: number;
}
export interface MaterialConfig {
    surface: string;
    absorption: number[];
    diffusion: number[];
}
export interface HRTFConfig {
    database: string;
    interpolation: boolean;
    personalization: boolean;
}
export interface RestorationConfig {
    declipping: DeclippingConfig;
    denoising: AdvancedDenoiseConfig;
    bandwidth: BandwidthConfig;
}
export interface DeclippingConfig {
    enabled: boolean;
    algorithm: "cubic_spline" | "ar_model" | "sparse_coding";
    threshold: number;
}
export interface AdvancedDenoiseConfig {
    enabled: boolean;
    type: "broadband" | "tonal" | "impulsive" | "all";
    learning: boolean;
    adaptation: boolean;
}
export interface BandwidthConfig {
    extension: boolean;
    algorithm: "hfr" | "spectral_folding" | "neural";
    targetRange: [number, number];
}
export interface CodecConfig {
    encoders: EncoderConfig[];
    decoders: DecoderConfig[];
    transcoding: TranscodingConfig;
}
export interface EncoderConfig {
    name: string;
    format: string;
    bitrates: number[];
    quality: QualitySettings[];
    realTime: boolean;
}
export interface QualitySettings {
    level: string;
    bitrate: number;
    complexity: number;
    parameters: any;
}
export interface DecoderConfig {
    name: string;
    format: string;
    optimizations: string[];
    errorRecovery: boolean;
}
export interface TranscodingConfig {
    enabled: boolean;
    formats: FormatMapping[];
    quality: TranscodeQuality;
}
export interface FormatMapping {
    input: string;
    output: string;
    priority: number;
}
export interface TranscodeQuality {
    preserve: boolean;
    enhance: boolean;
    target: string;
}
export interface AudioStream {
    id: string;
    config: AudioConfig;
    status: "idle" | "active" | "paused" | "error";
    metrics: StreamMetrics;
    buffer: AudioBuffer;
}
export interface StreamMetrics {
    latency: number;
    jitter: number;
    packetLoss: number;
    bandwidth: number;
    quality: number;
    errors: number;
}
export interface AudioBuffer {
    size: number;
    utilization: number;
    underruns: number;
    overruns: number;
}
export interface ProcessingResult {
    id: string;
    input: AudioData;
    output: AudioData;
    analysis: AnalysisResult;
    enhancement: EnhancementResult;
    quality: QualityMetrics;
    performance: ProcessingPerformance;
}
export interface AudioData {
    format: AudioFormat;
    samples: number[][];
    metadata: AudioMetadata;
}
export interface AudioFormat {
    sampleRate: number;
    bitDepth: number;
    channels: number;
    encoding: string;
}
export interface AudioMetadata {
    duration: number;
    rms: number;
    peak: number;
    lufs: number;
    dynamic: number;
}
export interface AnalysisResult {
    spectral: SpectralResult;
    temporal: TemporalResult;
    perceptual: PerceptualResult;
    ml: MLResult;
}
export interface SpectralResult {
    spectrum: number[][];
    mfcc: number[][];
    chroma: number[][];
    spectralCentroid: number[];
    spectralRolloff: number[];
    zeroCrossingRate: number[];
}
export interface TemporalResult {
    envelope: number[];
    onsets: number[];
    tempo: number;
    beats: number[];
    rhythm: RhythmAnalysis;
}
export interface RhythmAnalysis {
    meter: [number, number];
    downbeats: number[];
    complexity: number;
}
export interface PerceptualResult {
    loudness: LoudnessAnalysis;
    pitch: PitchAnalysis;
    timbre: TimbreAnalysis;
    quality: QualityAnalysis;
}
export interface LoudnessAnalysis {
    integrated: number;
    shortTerm: number[];
    momentary: number[];
    range: number;
}
export interface PitchAnalysis {
    fundamental: number[];
    confidence: number[];
    harmonics: number[][];
    intonation: number;
}
export interface TimbreAnalysis {
    brightness: number;
    roughness: number;
    warmth: number;
    richness: number;
    descriptors: TimbreDescriptorResult[];
}
export interface TimbreDescriptorResult {
    name: string;
    value: number;
    confidence: number;
}
export interface QualityAnalysis {
    snr: number;
    thd: number;
    pesq: number;
    stoi: number;
    mos: number;
}
export interface MLResult {
    predictions: MLPrediction[];
    features: MLFeature[];
    embeddings: number[][];
}
export interface MLPrediction {
    model: string;
    task: string;
    prediction: any;
    confidence: number;
}
export interface MLFeature {
    name: string;
    value: number[];
    importance: number;
}
export interface EnhancementResult {
    denoise: DenoiseResult;
    dereverberation: DereverberationResult;
    enhancement: SignalEnhancementResult;
    restoration: RestorationResult;
}
export interface DenoiseResult {
    applied: boolean;
    reduction: number;
    artifacts: number;
    quality: number;
}
export interface DereverberationResult {
    applied: boolean;
    reduction: number;
    preservation: number;
    quality: number;
}
export interface SignalEnhancementResult {
    equalization: EqualizationResult;
    dynamics: DynamicsResult;
    spatialization: SpatializationResult;
}
export interface EqualizationResult {
    applied: boolean;
    bands: BandResult[];
    response: number[][];
}
export interface BandResult {
    frequency: number;
    gain: number;
    applied: boolean;
}
export interface DynamicsResult {
    compression: CompressionResult;
    limiting: LimitingResult;
    gating: GatingResult;
    expansion: ExpansionResult;
}
export interface CompressionResult {
    applied: boolean;
    reduction: number;
    ratio: number;
    makeup: number;
}
export interface LimitingResult {
    applied: boolean;
    reduction: number;
    peaks: number;
}
export interface GatingResult {
    applied: boolean;
    reduction: number;
    threshold: number;
}
export interface ExpansionResult {
    applied: boolean;
    expansion: number;
    threshold: number;
}
export interface SpatializationResult {
    applied: boolean;
    algorithm: string;
    width: number;
    depth: number;
}
export interface RestorationResult {
    declipping: DeclippingResult;
    denoising: AdvancedDenoiseResult;
    bandwidth: BandwidthResult;
}
export interface DeclippingResult {
    applied: boolean;
    samples: number;
    quality: number;
}
export interface AdvancedDenoiseResult {
    applied: boolean;
    types: string[];
    reduction: number;
    quality: number;
}
export interface BandwidthResult {
    applied: boolean;
    extension: [number, number];
    quality: number;
}
export interface QualityMetrics {
    overall: number;
    technical: TechnicalQuality;
    perceptual: PerceptualQuality;
    enhancement: EnhancementQuality;
}
export interface TechnicalQuality {
    snr: number;
    thd: number;
    frequency: number;
    dynamic: number;
    phase: number;
}
export interface PerceptualQuality {
    clarity: number;
    fullness: number;
    naturalness: number;
    pleasantness: number;
    intelligibility: number;
}
export interface EnhancementQuality {
    improvement: number;
    artifacts: number;
    preservation: number;
    effectiveness: number;
}
export interface ProcessingPerformance {
    latency: number;
    throughput: number;
    cpuUsage: number;
    memoryUsage: number;
    realTimeFactor: number;
}
export declare class ChirpAudioProcessor extends EventEmitter {
    private logger;
    private config;
    private streams;
    private results;
    private processingEngine;
    private streamingEngine;
    private analysisEngine;
    private enhancementEngine;
    private codecManager;
    private performanceMonitor;
    constructor(config: ChirpConfig);
    /**
     * Initializes the audio processing engine
     */
    initialize(): Promise<void>;
    /**
     * Creates a new audio stream
     */
    createStream(id: string, config: AudioConfig, streamingConfig?: RealTimeStreamingConfig): Promise<ServiceResponse<AudioStream>>;
    /**
     * Processes audio data through the complete pipeline
     */
    processAudio(audioData: AudioData, options?: ProcessingOptions): Promise<ServiceResponse<ProcessingResult>>;
    /**
     * Starts real-time streaming for a stream
     */
    startStreaming(streamId: string): Promise<ServiceResponse<void>>;
    /**
     * Stops streaming for a stream
     */
    stopStreaming(streamId: string): Promise<ServiceResponse<void>>;
    /**
     * Gets stream status and metrics
     */
    getStream(streamId: string): Promise<ServiceResponse<AudioStream>>;
    /**
     * Gets processing result by ID
     */
    getResult(resultId: string): Promise<ServiceResponse<ProcessingResult>>;
    /**
     * Gets performance metrics
     */
    getMetrics(): Promise<ServiceResponse<PerformanceMetrics>>;
    private initializeComponents;
    private setupEventHandlers;
    private validateAudioConfig;
    private assessQuality;
    private calculateThroughput;
    private getCPUUsage;
    private getMemoryUsage;
    private calculateRealTimeFactor;
    private generateProcessingId;
    private generateRequestId;
    private createErrorResponse;
    private handleStreamData;
    private handleStreamError;
    private handleProcessingProgress;
}
interface ProcessingOptions {
    realTime?: boolean;
    quality?: string;
    latency?: number;
    enhancement?: boolean;
}
export {};
//# sourceMappingURL=chirp-audio-processor.d.ts.map