/**
 * Veo3 Video Generator with Advanced Rendering Pipeline
 *
 * Production-ready video generation service with AI-powered content creation,
 * real-time rendering, and comprehensive media processing capabilities.
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { VideoGenerationRequest, RenderingPipeline, ServiceResponse, PerformanceMetrics } from "./interfaces.js";
export interface Veo3Config {
    rendering: RenderingConfig;
    ai: AIConfig;
    storage: StorageConfig;
    optimization: OptimizationConfig;
    pipeline: PipelineConfig;
}
export interface RenderingConfig {
    engine: "cuda" | "opencl" | "metal" | "cpu";
    maxConcurrentRenders: number;
    memoryLimit: number;
    timeoutMinutes: number;
    quality: QualityPresets;
}
export interface QualityPresets {
    draft: QualitySettings;
    preview: QualitySettings;
    standard: QualitySettings;
    high: QualitySettings;
    ultra: QualitySettings;
}
export interface QualitySettings {
    renderSamples: number;
    denoising: boolean;
    motionBlur: boolean;
    antiAliasing: string;
    compression: CompressionSettings;
}
export interface CompressionSettings {
    codec: string;
    bitrate: number;
    quality: number;
    preset: string;
}
export interface AIConfig {
    model: string;
    promptEnhancement: boolean;
    styleTransfer: boolean;
    contentAnalysis: boolean;
    qualityAssessment: boolean;
}
export interface StorageConfig {
    inputPath: string;
    outputPath: string;
    tempPath: string;
    cleanup: boolean;
    retention: number;
}
export interface OptimizationConfig {
    gpu: GPUOptimization;
    memory: MemoryOptimization;
    disk: DiskOptimization;
    network: NetworkOptimization;
}
export interface GPUOptimization {
    enabled: boolean;
    multiGPU: boolean;
    memoryFraction: number;
    cudaGraphs: boolean;
}
export interface MemoryOptimization {
    streaming: boolean;
    tiling: boolean;
    compression: boolean;
    maxFramesInMemory: number;
}
export interface DiskOptimization {
    ssdCache: boolean;
    compression: boolean;
    prefetching: boolean;
    parallelIO: boolean;
}
export interface NetworkOptimization {
    distributedRendering: boolean;
    loadBalancing: boolean;
    caching: boolean;
    cdn: boolean;
}
export interface PipelineConfig {
    stages: PipelineStageConfig[];
    parallelization: ParallelizationConfig;
    monitoring: MonitoringConfig;
    recovery: RecoveryConfig;
}
export interface PipelineStageConfig {
    name: string;
    enabled: boolean;
    priority: number;
    resources: ResourceRequirements;
    timeout: number;
}
export interface ResourceRequirements {
    cpu: number;
    memory: number;
    gpu: number;
    disk: number;
}
export interface ParallelizationConfig {
    maxWorkers: number;
    loadBalancing: "round_robin" | "least_loaded" | "resource_based";
    affinity: boolean;
}
export interface MonitoringConfig {
    progress: boolean;
    performance: boolean;
    quality: boolean;
    errors: boolean;
}
export interface RecoveryConfig {
    checkpoints: boolean;
    retryFailedFrames: boolean;
    fallbackQuality: string;
    maxRetries: number;
}
export interface VideoProject {
    id: string;
    name: string;
    request: VideoGenerationRequest;
    status: "pending" | "processing" | "rendering" | "completed" | "failed" | "cancelled";
    progress: number;
    startTime?: Date;
    endTime?: Date;
    estimatedCompletion?: Date;
    outputFiles: OutputFile[];
    metrics: ProjectMetrics;
    error?: string;
}
export interface OutputFile {
    type: "video" | "thumbnail" | "preview" | "metadata";
    path: string;
    size: number;
    format: string;
    duration?: number;
    resolution?: {
        width: number;
        height: number;
    };
}
export interface ProjectMetrics {
    framesRendered: number;
    totalFrames: number;
    renderingSpeed: number;
    memoryUsed: number;
    gpuUtilization: number;
    errors: number;
    warnings: number;
}
export interface RenderingContext {
    project: VideoProject;
    pipeline: RenderingPipeline;
    workers: Worker[];
    checkpoint?: Checkpoint;
}
export interface Worker {
    id: string;
    type: "cpu" | "gpu" | "hybrid";
    status: "idle" | "busy" | "error";
    currentTask?: RenderTask;
    performance: WorkerPerformance;
}
export interface RenderTask {
    id: string;
    type: "frame" | "sequence" | "effect" | "composite";
    data: any;
    priority: number;
    dependencies: string[];
}
export interface WorkerPerformance {
    tasksCompleted: number;
    averageTime: number;
    memoryUsage: number;
    errors: number;
}
export interface Checkpoint {
    frameIndex: number;
    timestamp: Date;
    data: any;
    metadata: CheckpointMetadata;
}
export interface CheckpointMetadata {
    version: string;
    quality: string;
    settings: any;
    progress: number;
}
export declare class Veo3VideoGenerator extends EventEmitter {
    private logger;
    private config;
    private projects;
    private renderingContexts;
    private workerPool;
    private pipelineManager;
    private aiEngine;
    private storageManager;
    private performanceMonitor;
    private qualityController;
    constructor(config: Veo3Config);
    /**
     * Initializes the video generation engine
     */
    initialize(): Promise<void>;
    /**
     * Creates a new video generation project
     */
    createProject(name: string, request: VideoGenerationRequest): Promise<ServiceResponse<VideoProject>>;
    /**
     * Starts video generation for a project
     */
    startGeneration(projectId: string): Promise<ServiceResponse<void>>;
    /**
     * Gets project status and progress
     */
    getProject(projectId: string): Promise<ServiceResponse<VideoProject>>;
    /**
     * Cancels a video generation project
     */
    cancelProject(projectId: string): Promise<ServiceResponse<void>>;
    /**
     * Lists all projects
     */
    listProjects(): Promise<ServiceResponse<VideoProject[]>>;
    /**
     * Gets performance metrics
     */
    getMetrics(): Promise<ServiceResponse<PerformanceMetrics>>;
    private initializeComponents;
    private setupEventHandlers;
    private validateRequest;
    private calculateTotalFrames;
    private createRenderingContext;
    private generateVideoAsync;
    private executeStage;
    private executePreprocessingStage;
    private executeGenerationStage;
    private executePostprocessingStage;
    private executeEncodingStage;
    private generateFrames;
    private generateFrame;
    private executeTask;
    private applyEffects;
    private applyEffect;
    private encodeVideo;
    private generateThumbnails;
    private cancelRenderingContext;
    private cleanupRenderingContext;
    private delay;
    private generateProjectId;
    private generateRequestId;
    private createErrorResponse;
    private handleWorkerError;
    private handlePerformanceDegradation;
    private handleStageCompleted;
}
//# sourceMappingURL=veo3-video-generator.d.ts.map