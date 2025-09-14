/**
 * A2A Multimedia Protocol Google Services Integration
 * Integration layer for connecting A2A protocol with Google Cloud services
 */
import { ServiceResponse } from '../interfaces';
export interface GoogleServicesIntegrationConfig {
    projectId: string;
    location: string;
    credentials?: any;
    services: {
        imagen: boolean;
        chirp: boolean;
        lyria: boolean;
        vertexAI: boolean;
        cloudStorage: boolean;
    };
    a2aProtocol: {
        enabled: boolean;
        config: any;
    };
}
export interface MultimediaServiceRequest {
    type: 'image' | 'audio' | 'music';
    sessionId?: string;
    agentId: string;
    targetAgents?: string[];
    synchronization?: boolean;
    quality?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    parameters: any;
}
export interface MultimediaServiceResponse {
    requestId: string;
    type: 'image' | 'audio' | 'music';
    sessionId?: string;
    result: any;
    metadata: {
        processingTime: number;
        qualityScore: number;
        resourceUsage: any;
        a2aMetrics?: any;
    };
}
export declare class A2AMultimediaGoogleIntegration {
    private logger;
    private config;
    private a2aProtocol;
    private googleOrchestrator;
    private activeSessions;
    constructor(config: GoogleServicesIntegrationConfig);
    initialize(): Promise<void>;
    /**
     * Create a collaborative multimedia session across agents
     */
    createCollaborativeSession(sessionConfig: {
        type: 'image_generation' | 'audio_synthesis' | 'music_composition' | 'mixed_media';
        initiatorId: string;
        participants: string[];
        synchronization?: boolean;
        quality?: string;
        metadata?: any;
    }): Promise<ServiceResponse<MultimediaIntegrationSession>>;
    /**
     * Process multimedia request with agent coordination
     */
    processMultimediaRequest(request: MultimediaServiceRequest): Promise<ServiceResponse<MultimediaServiceResponse>>;
    /**
     * Synchronize multimedia content across agents
     */
    synchronizeMultimediaContent(sessionId: string, contentId: string, participants: string[]): Promise<ServiceResponse<{
        synchronized: boolean;
        participants: string[];
    }>>;
    /**
     * Get integration session statistics
     */
    getSessionStatistics(sessionId: string): Promise<ServiceResponse<MultimediaIntegrationStatistics>>;
    private generateRequestId;
    private createErrorResponse;
}
interface MultimediaIntegrationSession {
    id: string;
    type: 'image_generation' | 'audio_synthesis' | 'music_composition' | 'mixed_media';
    initiatorId: string;
    participants: string[];
    a2aSessionId?: string;
    status: 'active' | 'paused' | 'completed' | 'error';
    createdAt: Date;
    lastActivity: Date;
    statistics: {
        requestsProcessed: number;
        totalProcessingTime: number;
        averageQuality: number;
        errorCount: number;
    };
    metadata: any;
}
interface MultimediaIntegrationStatistics {
    session: {
        requestsProcessed: number;
        totalProcessingTime: number;
        averageQuality: number;
        errorCount: number;
    };
    a2a?: any;
    google: any;
    integration: {
        totalSessions: number;
        averageProcessingTime: number;
        successRate: number;
        resourceUtilization: any;
    };
}
export {};
//# sourceMappingURL=a2a-multimedia-integration.d.ts.map