/**
 * Imagen4 Generator with Advanced Style Control
 *
 * Production-ready image generation service with AI-powered style transfer,
 * advanced composition control, and real-time processing capabilities.
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { ServiceResponse, PerformanceMetrics } from "./interfaces.js";
export interface Imagen4Config {
    generation: GenerationConfig;
    style: StyleConfig;
    processing: ProcessingConfig;
    optimization: OptimizationConfig;
    storage: StorageConfig;
}
export interface GenerationConfig {
    model: string;
    quality: QualityLevel;
    safety: SafetyConfig;
    batch: BatchConfig;
    streaming: StreamingConfig;
}
export interface QualityLevel {
    preset: "draft" | "standard" | "high" | "ultra" | "custom";
    resolution: ResolutionConfig;
    samples: number;
    steps: number;
    guidance: number;
}
export interface ResolutionConfig {
    width: number;
    height: number;
    aspectRatio?: string;
    upscaling?: UpscalingConfig;
}
export interface UpscalingConfig {
    enabled: boolean;
    factor: number;
    algorithm: "bicubic" | "lanczos" | "ai_super_resolution";
    postProcessing: boolean;
}
export interface SafetyConfig {
    contentFilter: boolean;
    adultContent: boolean;
    violence: boolean;
    personalIdentity: boolean;
    copyrightProtection: boolean;
}
export interface BatchConfig {
    enabled: boolean;
    maxSize: number;
    timeout: number;
    optimization: boolean;
}
export interface StreamingConfig {
    enabled: boolean;
    progressive: boolean;
    chunkSize: number;
    quality: "low" | "medium" | "high";
}
export interface StyleConfig {
    transfer: StyleTransferConfig;
    control: StyleControlConfig;
    blending: BlendingConfig;
    adaptation: AdaptationConfig;
}
export interface StyleTransferConfig {
    enabled: boolean;
    strength: number;
    preservation: number;
    algorithms: StyleAlgorithm[];
}
export interface StyleAlgorithm {
    name: string;
    weight: number;
    parameters: StyleParameters;
}
export interface StyleParameters {
    colorTransfer: ColorTransferConfig;
    textureTransfer: TextureTransferConfig;
    structurePreservation: StructureConfig;
}
export interface ColorTransferConfig {
    enabled: boolean;
    mode: "lab" | "rgb" | "hsv" | "luv";
    intensity: number;
    histogram: boolean;
}
export interface TextureTransferConfig {
    enabled: boolean;
    scale: number;
    detail: number;
    coherence: number;
}
export interface StructureConfig {
    enabled: boolean;
    level: number;
    edges: boolean;
    contours: boolean;
}
export interface StyleControlConfig {
    artisticStyle: ArtisticStyleConfig;
    photographicStyle: PhotographicStyleConfig;
    composition: CompositionConfig;
    lighting: LightingConfig;
}
export interface ArtisticStyleConfig {
    movement: string;
    technique: string;
    era: string;
    artist: string;
    intensity: number;
}
export interface PhotographicStyleConfig {
    camera: CameraConfig;
    lens: LensConfig;
    exposure: ExposureConfig;
    processing: PhotoProcessingConfig;
}
export interface CameraConfig {
    type: string;
    sensor: string;
    iso: number;
    colorProfile: string;
}
export interface LensConfig {
    focalLength: number;
    aperture: number;
    distortion: number;
    vignetting: number;
}
export interface ExposureConfig {
    mode: "auto" | "manual" | "aperture" | "shutter" | "program";
    ev: number;
    metering: "spot" | "center" | "matrix";
}
export interface PhotoProcessingConfig {
    contrast: number;
    saturation: number;
    highlights: number;
    shadows: number;
    clarity: number;
    vibrance: number;
}
export interface CompositionConfig {
    rules: CompositionRule[];
    balance: BalanceConfig;
    focal: FocalConfig;
    depth: DepthConfig;
}
export interface CompositionRule {
    name: string;
    weight: number;
    enabled: boolean;
}
export interface BalanceConfig {
    symmetry: number;
    weight: WeightConfig;
    color: ColorBalanceConfig;
}
export interface WeightConfig {
    visual: number;
    tonal: number;
    directional: number;
}
export interface ColorBalanceConfig {
    temperature: number;
    tint: number;
    harmony: string;
}
export interface FocalConfig {
    points: FocalPoint[];
    hierarchy: boolean;
    emphasis: EmphasisConfig;
}
export interface FocalPoint {
    x: number;
    y: number;
    strength: number;
    type: "primary" | "secondary" | "tertiary";
}
export interface EmphasisConfig {
    contrast: number;
    color: number;
    size: number;
    position: number;
}
export interface DepthConfig {
    enabled: boolean;
    layers: number;
    foreground: LayerConfig;
    middleground: LayerConfig;
    background: LayerConfig;
}
export interface LayerConfig {
    focus: number;
    detail: number;
    contrast: number;
    saturation: number;
}
export interface LightingConfig {
    setup: LightingSetup;
    quality: LightingQuality;
    mood: MoodConfig;
    time: TimeConfig;
}
export interface LightingSetup {
    primary: LightSource;
    secondary: LightSource[];
    ambient: AmbientConfig;
    shadows: ShadowConfig;
}
export interface LightSource {
    type: "natural" | "artificial" | "mixed";
    intensity: number;
    temperature: number;
    direction: DirectionConfig;
    diffusion: number;
}
export interface DirectionConfig {
    azimuth: number;
    elevation: number;
    spread: number;
}
export interface AmbientConfig {
    intensity: number;
    color: string;
    source: "sky" | "environment" | "artificial";
}
export interface ShadowConfig {
    enabled: boolean;
    softness: number;
    opacity: number;
    color: string;
}
export interface LightingQuality {
    global: boolean;
    bounces: number;
    caustics: boolean;
    volumetric: boolean;
}
export interface MoodConfig {
    tone: string;
    atmosphere: string;
    emotion: string;
    intensity: number;
}
export interface TimeConfig {
    hour: number;
    season: "spring" | "summer" | "autumn" | "winter";
    weather: WeatherConfig;
}
export interface WeatherConfig {
    condition: "clear" | "cloudy" | "rainy" | "stormy" | "foggy";
    intensity: number;
    atmosphere: AtmosphereConfig;
}
export interface AtmosphereConfig {
    visibility: number;
    humidity: number;
    haze: number;
}
export interface BlendingConfig {
    modes: BlendingMode[];
    transitions: TransitionConfig;
    masking: MaskingConfig;
}
export interface BlendingMode {
    type: string;
    opacity: number;
    regions: RegionConfig[];
}
export interface RegionConfig {
    x: number;
    y: number;
    width: number;
    height: number;
    feather: number;
}
export interface TransitionConfig {
    enabled: boolean;
    type: "linear" | "radial" | "custom";
    smoothness: number;
    falloff: number;
}
export interface MaskingConfig {
    enabled: boolean;
    type: "alpha" | "luminance" | "color" | "edge";
    precision: number;
    softening: number;
}
export interface AdaptationConfig {
    enabled: boolean;
    learning: LearningConfig;
    feedback: FeedbackConfig;
    optimization: StyleOptimizationConfig;
}
export interface LearningConfig {
    userPreferences: boolean;
    styleAnalysis: boolean;
    qualityAssessment: boolean;
    contextAwareness: boolean;
}
export interface FeedbackConfig {
    collection: boolean;
    analysis: boolean;
    integration: boolean;
    weighting: number;
}
export interface StyleOptimizationConfig {
    enabled: boolean;
    criteria: OptimizationCriteria[];
    constraints: StyleConstraint[];
}
export interface OptimizationCriteria {
    metric: string;
    target: number;
    weight: number;
}
export interface StyleConstraint {
    parameter: string;
    min: number;
    max: number;
    priority: number;
}
export interface ProcessingConfig {
    pipeline: ProcessingPipeline;
    filters: FilterConfig[];
    enhancement: EnhancementConfig;
    correction: CorrectionConfig;
}
export interface ProcessingPipeline {
    stages: ProcessingStage[];
    parallel: boolean;
    optimization: boolean;
    caching: boolean;
}
export interface ProcessingStage {
    name: string;
    type: "filter" | "enhancement" | "correction" | "effect";
    order: number;
    enabled: boolean;
    parameters: any;
}
export interface FilterConfig {
    type: string;
    intensity: number;
    parameters: FilterParameters;
    regions?: RegionConfig[];
}
export interface FilterParameters {
    [key: string]: any;
}
export interface EnhancementConfig {
    sharpening: SharpeningConfig;
    noise: NoiseConfig;
    detail: DetailConfig;
    color: ColorEnhancementConfig;
}
export interface SharpeningConfig {
    enabled: boolean;
    amount: number;
    radius: number;
    threshold: number;
    masking: boolean;
}
export interface NoiseConfig {
    reduction: NoiseReductionConfig;
    grain: GrainConfig;
}
export interface NoiseReductionConfig {
    enabled: boolean;
    strength: number;
    preservation: number;
    method: "wavelet" | "bilateral" | "nlm";
}
export interface GrainConfig {
    enabled: boolean;
    amount: number;
    size: number;
    type: "film" | "digital" | "custom";
}
export interface DetailConfig {
    enhancement: boolean;
    preservation: number;
    microContrast: number;
    structure: number;
}
export interface ColorEnhancementConfig {
    saturation: number;
    vibrance: number;
    selectiveColor: SelectiveColorConfig[];
    curves: CurveConfig[];
}
export interface SelectiveColorConfig {
    color: string;
    adjustment: ColorAdjustment;
    mask: string;
}
export interface ColorAdjustment {
    hue: number;
    saturation: number;
    lightness: number;
}
export interface CurveConfig {
    channel: "rgb" | "red" | "green" | "blue";
    points: CurvePoint[];
}
export interface CurvePoint {
    input: number;
    output: number;
}
export interface CorrectionConfig {
    perspective: PerspectiveConfig;
    distortion: DistortionConfig;
    chromatic: ChromaticConfig;
    vignetting: VignettingConfig;
}
export interface PerspectiveConfig {
    enabled: boolean;
    auto: boolean;
    keystone: KeystoneConfig;
    rotation: RotationConfig;
}
export interface KeystoneConfig {
    horizontal: number;
    vertical: number;
}
export interface RotationConfig {
    angle: number;
    auto: boolean;
    crop: boolean;
}
export interface DistortionConfig {
    barrel: number;
    pincushion: number;
    mustache: number;
    correction: boolean;
}
export interface ChromaticConfig {
    aberration: AberrationConfig;
    fringing: FringingConfig;
}
export interface AberrationConfig {
    red: number;
    blue: number;
    green: number;
}
export interface FringingConfig {
    purple: number;
    green: number;
    amount: number;
}
export interface VignettingConfig {
    correction: number;
    artistic: ArtisticVignettingConfig;
}
export interface ArtisticVignettingConfig {
    enabled: boolean;
    amount: number;
    midpoint: number;
    roundness: number;
    feather: number;
}
export interface OptimizationConfig {
    performance: PerformanceOptimization;
    quality: QualityOptimization;
    memory: MemoryOptimization;
    gpu: GPUOptimization;
}
export interface PerformanceOptimization {
    parallel: boolean;
    batch: boolean;
    caching: CachingConfig;
    prefetch: boolean;
}
export interface CachingConfig {
    enabled: boolean;
    size: number;
    strategy: "lru" | "lfu" | "ttl";
    compression: boolean;
}
export interface QualityOptimization {
    adaptive: boolean;
    progressive: boolean;
    lossless: boolean;
    dithering: boolean;
}
export interface MemoryOptimization {
    streaming: boolean;
    tiling: boolean;
    compression: boolean;
    pooling: boolean;
}
export interface GPUOptimization {
    enabled: boolean;
    multiGPU: boolean;
    precision: "fp16" | "fp32" | "mixed";
    memory: GPUMemoryConfig;
}
export interface GPUMemoryConfig {
    allocation: "static" | "dynamic";
    limit: number;
    fragmentation: number;
}
export interface StorageConfig {
    input: StorageLocation;
    output: StorageLocation;
    cache: StorageLocation;
    metadata: MetadataConfig;
}
export interface StorageLocation {
    type: "local" | "cloud" | "hybrid";
    path: string;
    credentials?: any;
    encryption: boolean;
}
export interface MetadataConfig {
    enabled: boolean;
    format: "exif" | "iptc" | "xmp" | "json";
    fields: string[];
    embedding: boolean;
}
export interface ImageGenerationRequest {
    prompt: string;
    style?: StyleRequest;
    quality?: QualityLevel;
    processing?: ProcessingRequest;
    metadata?: RequestMetadata;
}
export interface StyleRequest {
    artistic?: Partial<ArtisticStyleConfig>;
    photographic?: Partial<PhotographicStyleConfig>;
    composition?: Partial<CompositionConfig>;
    lighting?: Partial<LightingConfig>;
    transfer?: StyleTransferRequest;
}
export interface StyleTransferRequest {
    source: string;
    strength: number;
    regions?: RegionConfig[];
}
export interface ProcessingRequest {
    filters?: FilterConfig[];
    enhancement?: Partial<EnhancementConfig>;
    correction?: Partial<CorrectionConfig>;
}
export interface RequestMetadata {
    title?: string;
    description?: string;
    tags?: string[];
    author?: string;
    license?: string;
}
export interface GenerationResult {
    id: string;
    images: GeneratedImage[];
    metadata: ResultMetadata;
    processing: ProcessingInfo;
    quality: QualityMetrics;
}
export interface GeneratedImage {
    id: string;
    url: string;
    path: string;
    format: string;
    resolution: ResolutionConfig;
    size: number;
    quality: number;
    checksum: string;
}
export interface ResultMetadata {
    request: ImageGenerationRequest;
    timestamp: Date;
    duration: number;
    version: string;
    model: string;
}
export interface ProcessingInfo {
    stages: ProcessedStage[];
    performance: StagePerformance[];
    resources: ResourceUsage;
}
export interface ProcessedStage {
    name: string;
    duration: number;
    success: boolean;
    output?: any;
    error?: string;
}
export interface StagePerformance {
    stage: string;
    cpu: number;
    memory: number;
    gpu: number;
    io: IOMetrics;
}
export interface IOMetrics {
    read: number;
    write: number;
    operations: number;
}
export interface ResourceUsage {
    peak: ResourcePeak;
    average: ResourceAverage;
    total: ResourceTotal;
}
export interface ResourcePeak {
    cpu: number;
    memory: number;
    gpu: number;
    disk: number;
}
export interface ResourceAverage {
    cpu: number;
    memory: number;
    gpu: number;
    network: number;
}
export interface ResourceTotal {
    energy: number;
    cost: number;
    carbon: number;
}
export interface QualityMetrics {
    overall: number;
    technical: TechnicalQuality;
    aesthetic: AestheticQuality;
    safety: SafetyMetrics;
}
export interface TechnicalQuality {
    resolution: number;
    sharpness: number;
    noise: number;
    artifacts: number;
    compression: number;
}
export interface AestheticQuality {
    composition: number;
    color: number;
    lighting: number;
    style: number;
    creativity: number;
}
export interface SafetyMetrics {
    adult: number;
    violence: number;
    toxic: number;
    copyright: number;
    overall: number;
}
export declare class Imagen4Generator extends EventEmitter {
    private logger;
    private config;
    private generations;
    private styleEngine;
    private processingEngine;
    private qualityController;
    private storageManager;
    private performanceMonitor;
    private safetyFilter;
    constructor(config: Imagen4Config);
    /**
     * Initializes the image generation engine
     */
    initialize(): Promise<void>;
    /**
     * Generates images based on the provided request
     */
    generateImage(request: ImageGenerationRequest): Promise<ServiceResponse<GenerationResult>>;
    /**
     * Applies style transfer to existing images
     */
    applyStyleTransfer(imageIds: string[], styleRequest: StyleTransferRequest): Promise<ServiceResponse<GenerationResult>>;
    /**
     * Gets generation result by ID
     */
    getGeneration(generationId: string): Promise<ServiceResponse<GenerationResult>>;
    /**
     * Lists all generations
     */
    listGenerations(): Promise<ServiceResponse<GenerationResult[]>>;
    /**
     * Gets performance metrics
     */
    getMetrics(): Promise<ServiceResponse<PerformanceMetrics>>;
    private initializeComponents;
    private setupEventHandlers;
    private validateRequest;
    private validateQualitySettings;
    private enhanceRequest;
    private enhancePrompt;
    private mergeStyleSettings;
    private mergeProcessingSettings;
    private generateBaseImages;
    private applyStyleProcessing;
    private applyPostProcessing;
    private assessQuality;
    private getProcessingInfo;
    private loadImages;
    private getDefaultArtisticStyle;
    private getDefaultPhotographicStyle;
    private getDefaultComposition;
    private getDefaultLighting;
    private getDefaultEnhancement;
    private getDefaultCorrection;
    private generateId;
    private generateRequestId;
    private generateChecksum;
    private createErrorResponse;
    private handleStyleApplied;
    private handleProcessingCompleted;
    private handleQualityAssessed;
}
//# sourceMappingURL=imagen4-generator.d.ts.map