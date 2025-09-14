/**
 * WebRTC Integration Architecture
 *
 * Production-ready WebRTC implementation with:
 * - Peer-to-peer streaming capabilities
 * - Advanced signaling with failover
 * - Adaptive quality control
 * - Multi-agent coordination
 * - Performance optimization
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { WebRTCConfig, VideoStreamRequest, AudioStreamRequest, VideoStreamResponse, AudioStreamResponse, StreamingSession, NetworkConditions } from "../types/streaming.js";
export interface WebRTCPeer {
    id: string;
    connection: RTCPeerConnection;
    state: RTCPeerConnectionState;
    capabilities: RTCRtpCapabilities;
    streams: {
        outgoing: MediaStream[];
        incoming: MediaStream[];
    };
    stats: RTCStatsReport;
    lastActivity: number;
}
export interface SignalingMessage {
    type: "offer" | "answer" | "ice-candidate" | "renegotiation" | "bye";
    from: string;
    to: string;
    data: any;
    timestamp: number;
    sessionId: string;
}
export declare class WebRTCArchitecture extends EventEmitter {
    private logger;
    private config;
    private peers;
    private sessions;
    private signalingEndpoints;
    private iceServers;
    private performanceMonitor;
    private qualityAdapter;
    private syncManager;
    constructor(config: WebRTCConfig);
    /**
     * Create a new peer connection with optimized configuration
     */
    createPeerConnection(peerId: string, options?: RTCConfiguration): Promise<WebRTCPeer>;
    /**
     * Initiate video streaming with adaptive quality
     */
    startVideoStream(request: VideoStreamRequest): Promise<VideoStreamResponse>;
    /**
     * Initiate audio streaming with processing
     */
    startAudioStream(request: AudioStreamRequest): Promise<AudioStreamResponse>;
    /**
     * Create optimized offer with codec preferences
     */
    createOffer(peerId: string, options?: RTCOfferOptions): Promise<RTCSessionDescriptionInit>;
    /**
     * Handle incoming offer and create answer
     */
    handleOffer(peerId: string, offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit>;
    /**
     * Handle incoming answer
     */
    handleAnswer(peerId: string, answer: RTCSessionDescriptionInit): Promise<void>;
    /**
     * Add ICE candidate with validation
     */
    addIceCandidate(peerId: string, candidate: RTCIceCandidateInit): Promise<void>;
    /**
     * Get comprehensive peer statistics
     */
    getPeerStats(peerId: string): Promise<RTCStatsReport>;
    /**
     * Monitor network conditions and adapt quality
     */
    monitorNetworkConditions(peerId: string): Promise<NetworkConditions>;
    /**
     * Setup multi-agent coordination session
     */
    createCoordinationSession(sessionId: string, participants: string[]): Promise<StreamingSession>;
    /**
     * Optimize connection settings for low latency
     */
    private optimizeConnection;
    /**
     * Setup peer event handlers
     */
    private setupPeerHandlers;
    /**
     * Create video stream with specified constraints
     */
    private createVideoStream;
    /**
     * Create audio stream with processing options
     */
    private createAudioStream;
    /**
     * Configure video sender with codec preferences
     */
    private configureVideoSender;
    /**
     * Configure audio sender with quality settings
     */
    private configureAudioSender;
    /**
     * Optimize SDP for better performance and codec preferences
     */
    private optimizeSDP;
    /**
     * Prefer specific codec in SDP
     */
    private preferCodec;
    /**
     * Extract codec payload types from SDP
     */
    private extractCodecPayloads;
    /**
     * Validate ICE candidate
     */
    private validateIceCandidate;
    /**
     * Setup signaling infrastructure
     */
    private setupSignaling;
    /**
     * Start performance monitoring
     */
    private startMonitoring;
    /**
     * Handle coordination messages
     */
    private handleCoordinationMessage;
    /**
     * Setup transcription for audio stream
     */
    private setupTranscription;
    /**
     * Create standardized streaming error
     */
    private createStreamingError;
    /**
     * Clean up peer connection
     */
    closePeer(peerId: string): Promise<void>;
    /**
     * Clean up all resources
     */
    cleanup(): Promise<void>;
}
//# sourceMappingURL=webrtc-architecture.d.ts.map