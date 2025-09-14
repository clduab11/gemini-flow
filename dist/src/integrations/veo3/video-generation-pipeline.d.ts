/**
 * Veo3 Video Generation Pipeline
 *
 * Advanced video generation with distributed rendering, chunk-based processing,
 * real-time streaming, and A2A coordination for parallel rendering
 */
import { VideoGenerationPipeline as IVideoGenerationPipeline, Veo3Config, VideoGenerationRequest, VideoGenerationResult, ChunkedVideoRequest, ChunkedVideoResult, StreamingVideoRequest, GenerationProgress, OptimizationOptions, OptimizedVideoResult, DistributedGenerationRequest, DistributedGenerationResult } from "./types.js";
import { BaseIntegration, HealthStatus } from "../shared/types.js";
export declare class VideoGenerationPipeline extends BaseIntegration implements IVideoGenerationPipeline {
    private config;
    private activeJobs;
    private chunkProcessors;
    private storageManager;
    private distributedCoordinator;
    private pipelineMetrics;
    constructor(config: Veo3Config);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    healthCheck(): Promise<HealthStatus>;
    getMetrics(): Record<string, number>;
    generateVideo(request: VideoGenerationRequest): Promise<VideoGenerationResult>;
    processInChunks(request: ChunkedVideoRequest): Promise<ChunkedVideoResult>;
    streamGeneration(request: StreamingVideoRequest): AsyncGenerator<GenerationProgress, VideoGenerationResult>;
    optimizeVideo(videoId: string, options: OptimizationOptions): Promise<OptimizedVideoResult>;
    distributeToCoordinates(request: DistributedGenerationRequest): Promise<DistributedGenerationResult>;
    private validateVeo3Connection;
    private checkVeo3ApiHealth;
}
//# sourceMappingURL=video-generation-pipeline.d.ts.map