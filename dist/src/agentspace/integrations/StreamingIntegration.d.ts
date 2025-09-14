/**
 * AgentSpace Streaming API Integration
 *
 * Integrates the enhanced streaming capabilities with spatial agent coordination,
 * enabling real-time multi-modal streaming within the 3D agent workspace
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { EnhancedStreamingAPI } from "../../streaming/enhanced-streaming-api.js";
import { AgentSpaceManager } from "../core/AgentSpaceManager.js";
import { Vector3D, WorkspaceId } from "../types/AgentSpaceTypes.js";
import { StreamingContext, MultiModalChunk } from "../../types/streaming.js";
export interface SpatialStreamingSession {
    id: string;
    workspaceId: WorkspaceId;
    agentId: string;
    spatialContext: {
        position: Vector3D;
        orientation: Vector3D;
        fieldOfView: {
            horizontalFOV: number;
            verticalFOV: number;
            range: number;
        };
        collaborators: string[];
    };
    streamingSession: any;
    streamTypes: ("video" | "audio" | "multimodal")[];
    quality: "low" | "medium" | "high" | "adaptive";
    spatialAudioEnabled: boolean;
    immersiveMode: boolean;
    status: "active" | "paused" | "ended";
}
export interface SpatialVideoStream {
    streamId: string;
    agentId: string;
    position: Vector3D;
    orientation: Vector3D;
    resolution: {
        width: number;
        height: number;
    };
    perspective: "3d" | "360" | "volumetric";
    layerDepth: number;
    occlusionHandling: boolean;
}
export interface SpatialAudioStream {
    streamId: string;
    agentId: string;
    position: Vector3D;
    spatialAudioProfile: {
        distance: number;
        attenuation: number;
        directionalityPattern: "omnidirectional" | "cardioid" | "bidirectional";
        reverberation: number;
        occlusion: number;
    };
    audioQuality: {
        sampleRate: number;
        channels: number;
        spatialChannels: number;
    };
}
export interface SpatialCollaborationZone {
    id: string;
    name: string;
    bounds: {
        center: Vector3D;
        radius: number;
    };
    participants: string[];
    sharedStreams: string[];
    audioMixingEnabled: boolean;
    videoSynchronizationEnabled: boolean;
    qualityAdaptation: "individual" | "collective";
}
export declare class StreamingIntegration extends EventEmitter {
    private logger;
    private streamingAPI;
    private agentSpaceManager;
    private spatialSessions;
    private videoStreams;
    private audioStreams;
    private collaborationZones;
    private streamingMetrics;
    constructor(streamingAPI: EnhancedStreamingAPI, agentSpaceManager: AgentSpaceManager);
    /**
     * 🎥 Create Spatial Video Streaming Session
     */
    createSpatialStreamingSession(params: {
        agentId: string;
        workspaceId: WorkspaceId;
        sessionType: "video" | "audio" | "multimodal";
        spatialConfig: {
            position: Vector3D;
            orientation?: Vector3D;
            fieldOfView?: any;
            immersiveMode?: boolean;
            spatialAudioEnabled?: boolean;
        };
        qualityPreferences?: {
            targetQuality: "low" | "medium" | "high" | "adaptive";
            maxBitrate?: number;
            latencyTolerance?: number;
        };
        collaborationConfig?: {
            allowCollaborators: boolean;
            maxCollaborators?: number;
            sharedWorkspace?: boolean;
        };
    }): Promise<{
        session: SpatialStreamingSession;
        streamingContext: StreamingContext;
        spatialOptimizations: any;
    }>;
    /**
     * 🎬 Start Spatial Video Stream with 3D Context
     */
    startSpatialVideoStream(sessionId: string, streamConfig: {
        source: "camera" | "screen" | "virtual" | "3d_render";
        perspective: "3d" | "360" | "volumetric";
        resolution: {
            width: number;
            height: number;
        };
        frameRate: number;
        layerDepth?: number;
        occlusionHandling?: boolean;
        spatialTracking?: boolean;
    }): Promise<{
        videoStream: SpatialVideoStream;
        streamResponse: any;
        spatialEnhancements: any;
    }>;
    /**
     * 🎧 Start Spatial Audio Stream with 3D Audio Processing
     */
    startSpatialAudioStream(sessionId: string, audioConfig: {
        source: "microphone" | "system" | "virtual" | "synthesized";
        spatialProfile: {
            distance: number;
            attenuation: number;
            directionality: "omnidirectional" | "cardioid" | "bidirectional";
            reverberation?: number;
            occlusion?: number;
        };
        quality: {
            sampleRate: number;
            channels: number;
            spatialChannels?: number;
        };
        processing?: {
            noiseReduction?: boolean;
            echoCancellation?: boolean;
            spatialProcessing?: boolean;
        };
    }): Promise<{
        audioStream: SpatialAudioStream;
        streamResponse: any;
        spatialProcessing: any;
    }>;
    /**
     * 🤝 Create Spatial Collaboration Zone
     */
    createSpatialCollaborationZone(params: {
        name: string;
        centerPosition: Vector3D;
        radius: number;
        initialParticipants: string[];
        audioMixing?: boolean;
        videoSynchronization?: boolean;
        qualityAdaptation?: "individual" | "collective";
    }): Promise<{
        zone: SpatialCollaborationZone;
        participantStreams: any[];
        mixingConfiguration: any;
    }>;
    /**
     * 📊 Process Multi-Modal Chunk with Spatial Context
     */
    processSpatialMultiModalChunk(sessionId: string, chunk: MultiModalChunk, spatialProcessing?: {
        positionTracking: boolean;
        depthMapping: boolean;
        occlusionHandling: boolean;
        collaborativeSync: boolean;
    }): Promise<{
        processed: boolean;
        spatialMetadata: any;
        collaborativeImpact: any;
    }>;
    /**
     * Private helper methods
     */
    private setupEventHandlers;
    private initializeSpatialStreaming;
    private createSpatialStreamingContext;
    private applySpatialOptimizations;
    private enableCollaborativeStreaming;
    private calculateOptimalBitrate;
    private calculateBandwidthRequirement;
    private calculateTargetLatency;
    private applySpatialVideoEnhancements;
    private calculateAudioBitrate;
    private calculateAudioBandwidth;
    private applySpatialAudioProcessing;
    private configureAudioMixingForParticipant;
    private configureVideoSyncForParticipant;
    private getStreamsForSession;
    private applySpatialProcessingToChunk;
    private synchronizeChunkWithCollaborators;
    private handleAgentMovement;
    private handleWorkspaceModification;
    private handleQualityAdaptation;
    private handleStreamEnd;
    /**
     * Public API methods
     */
    getActiveSpatialSessions(): SpatialStreamingSession[];
    getStreamingMetrics(): {
        spatial_sessions_created: number;
        video_streams_active: number;
        audio_streams_active: number;
        multimodal_chunks_processed: number;
        spatial_optimizations_applied: number;
        collaboration_zones_active: number;
        quality_adaptations: number;
        latency_improvements: number;
        bandwidth_savings: number;
    };
    endSpatialSession(sessionId: string): Promise<void>;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=StreamingIntegration.d.ts.map