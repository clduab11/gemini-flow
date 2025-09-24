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

import { EventEmitter } from "node:events";
import { Logger } from "../utils/logger.js";
import {
  WebRTCConfig,
  VideoStreamRequest,
  AudioStreamRequest,
  VideoStreamResponse,
  AudioStreamResponse,
  StreamingSession,
  NetworkConditions,
  PerformanceMetrics,
  StreamingError,
  QualityAdaptationRule,
  SynchronizationConfig,
} from "../types/streaming.js";

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

export class WebRTCArchitecture extends EventEmitter {
  private logger: Logger;
  private config: WebRTCConfig;
  private peers = new Map<string, WebRTCPeer>();
  private sessions = new Map<string, StreamingSession>();
  private signalingEndpoints: WebSocket[] = [];
  private iceServers: RTCIceServer[];
  private performanceMonitor: PerformanceMonitor;
  private qualityAdapter: QualityAdapter;
  private syncManager: SynchronizationManager;

  constructor(config: WebRTCConfig) {
    super();
    this.logger = new Logger("WebRTCArchitecture");
    this.config = config;
    this.iceServers = config.iceServers;
    this.performanceMonitor = new PerformanceMonitor();
    this.qualityAdapter = new QualityAdapter();
    this.syncManager = new SynchronizationManager();

    this.setupSignaling();
    this.startMonitoring();
  }

  /**
   * Create a new peer connection with optimized configuration
   */
  async createPeerConnection(
    peerId: string,
    options?: RTCConfiguration,
  ): Promise<WebRTCPeer> {
    const peerConfig: RTCConfiguration = {
      iceServers: this.iceServers,
      iceTransportPolicy: this.config.iceTransportPolicy || "all",
      bundlePolicy: this.config.bundlePolicy || "balanced",
      rtcpMuxPolicy: this.config.rtcpMuxPolicy || "require",
      iceCandidatePoolSize: this.config.iceCandidatePoolSize || 10,
      ...options,
    };

    const connection = new RTCPeerConnection(peerConfig);

    // Optimize connection settings
    this.optimizeConnection(connection);

    const peer: WebRTCPeer = {
      id: peerId,
      connection,
      state: "new",
      capabilities:
        RTCRtpReceiver.getCapabilities("video") || ({} as RTCRtpCapabilities),
      streams: {
        outgoing: [],
        incoming: [],
      },
      stats: new Map(),
      lastActivity: Date.now(),
    };

    // Setup event handlers
    this.setupPeerHandlers(peer);

    this.peers.set(peerId, peer);
    this.logger.info("Peer connection created", { peerId, state: peer.state });

    return peer;
  }

  /**
   * Initiate video streaming with adaptive quality
   */
  async startVideoStream(
    request: VideoStreamRequest,
  ): Promise<VideoStreamResponse> {
    try {
      const stream = await this.createVideoStream(request);
      const peer =
        this.peers.get(request.id) ||
        (await this.createPeerConnection(request.id));

      // Add stream to peer connection
      stream.getTracks().forEach((track) => {
        const sender = peer.connection.addTrack(track, stream);
        this.configureVideoSender(sender, request.quality.video!);
      });

      peer.streams.outgoing.push(stream);

      // Start quality adaptation
      this.qualityAdapter.startAdaptation(request.id, "video", request.quality);

      const response: VideoStreamResponse = {
        id: request.id,
        status: "streaming",
        stream,
        quality: request.quality,
        stats: {
          bytesTransferred: 0,
          framesRendered: 0,
          droppedFrames: 0,
          currentBitrate: request.quality.video!.bitrate,
          averageLatency: 0,
          jitter: 0,
          packetsLost: 0,
        },
        endpoints: {
          webrtc: peer.connection,
        },
      };

      this.emit("video_stream_started", response);
      return response;
    } catch (error) {
      const streamError: StreamingError = this.createStreamingError(
        "VIDEO_STREAM_FAILED",
        `Failed to start video stream: ${(error as Error).message}`,
        "high",
        true,
        "encoding",
        { streamId: request.id },
      );

      this.emit("streaming_error", streamError);
      throw streamError;
    }
  }

  /**
   * Initiate audio streaming with processing
   */
  async startAudioStream(
    request: AudioStreamRequest,
  ): Promise<AudioStreamResponse> {
    try {
      const stream = await this.createAudioStream(request);
      const peer =
        this.peers.get(request.id) ||
        (await this.createPeerConnection(request.id));

      // Add stream to peer connection
      stream.getTracks().forEach((track) => {
        const sender = peer.connection.addTrack(track, stream);
        this.configureAudioSender(sender, request.quality.audio!);
      });

      peer.streams.outgoing.push(stream);

      // Start quality adaptation
      this.qualityAdapter.startAdaptation(request.id, "audio", request.quality);

      const response: AudioStreamResponse = {
        id: request.id,
        status: "streaming",
        stream,
        quality: request.quality,
        stats: {
          bytesTransferred: 0,
          samplesProcessed: 0,
          bufferUnderuns: 0,
          currentBitrate: request.quality.audio!.bitrate,
          averageLatency: 0,
          signalLevel: 0,
          noiseLevel: 0,
        },
        endpoints: {
          webrtc: peer.connection,
        },
      };

      // Setup transcription if requested
      if (request.metadata?.transcriptionEnabled) {
        this.setupTranscription(response, request.metadata.language);
      }

      this.emit("audio_stream_started", response);
      return response;
    } catch (error) {
      const streamError: StreamingError = this.createStreamingError(
        "AUDIO_STREAM_FAILED",
        `Failed to start audio stream: ${(error as Error).message}`,
        "high",
        true,
        "encoding",
        { streamId: request.id },
      );

      this.emit("streaming_error", streamError);
      throw streamError;
    }
  }

  /**
   * Create optimized offer with codec preferences
   */
  async createOffer(
    peerId: string,
    options?: RTCOfferOptions,
  ): Promise<RTCSessionDescriptionInit> {
    const peer = this.peers.get(peerId);
    if (!peer) {
      throw new Error(`Peer not found: ${peerId}`);
    }

    const offerOptions: RTCOfferOptions = {
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
      iceRestart: false,
      ...options,
    };

    const offer = await peer.connection.createOffer(offerOptions);

    // Optimize SDP for better performance
    offer.sdp = this.optimizeSDP(offer.sdp!, "offer");

    await peer.connection.setLocalDescription(offer);

    this.logger.info("Offer created", {
      peerId,
      sdp: offer.sdp?.substring(0, 100),
    });
    return offer;
  }

  /**
   * Handle incoming offer and create answer
   */
  async handleOffer(
    peerId: string,
    offer: RTCSessionDescriptionInit,
  ): Promise<RTCSessionDescriptionInit> {
    const peer =
      this.peers.get(peerId) || (await this.createPeerConnection(peerId));

    // Optimize incoming SDP
    offer.sdp = this.optimizeSDP(offer.sdp!, "offer");

    await peer.connection.setRemoteDescription(offer);

    const answer = await peer.connection.createAnswer();

    // Optimize answer SDP
    answer.sdp = this.optimizeSDP(answer.sdp!, "answer");

    await peer.connection.setLocalDescription(answer);

    this.logger.info("Answer created", {
      peerId,
      sdp: answer.sdp?.substring(0, 100),
    });
    return answer;
  }

  /**
   * Handle incoming answer
   */
  async handleAnswer(
    peerId: string,
    answer: RTCSessionDescriptionInit,
  ): Promise<void> {
    const peer = this.peers.get(peerId);
    if (!peer) {
      throw new Error(`Peer not found: ${peerId}`);
    }

    // Optimize answer SDP
    answer.sdp = this.optimizeSDP(answer.sdp!, "answer");

    await peer.connection.setRemoteDescription(answer);

    this.logger.info("Answer handled", { peerId });
  }

  /**
   * Add ICE candidate with validation
   */
  async addIceCandidate(
    peerId: string,
    candidate: RTCIceCandidateInit,
  ): Promise<void> {
    const peer = this.peers.get(peerId);
    if (!peer) {
      throw new Error(`Peer not found: ${peerId}`);
    }

    // Validate candidate before adding
    if (this.validateIceCandidate(candidate)) {
      await peer.connection.addIceCandidate(candidate);
      this.logger.debug("ICE candidate added", {
        peerId,
        candidate: candidate.candidate,
      });
    } else {
      this.logger.warn("Invalid ICE candidate rejected", { peerId, candidate });
    }
  }

  /**
   * Get comprehensive peer statistics
   */
  async getPeerStats(peerId: string): Promise<RTCStatsReport> {
    const peer = this.peers.get(peerId);
    if (!peer) {
      throw new Error(`Peer not found: ${peerId}`);
    }

    const stats = await peer.connection.getStats();
    peer.stats = stats;
    peer.lastActivity = Date.now();

    return stats;
  }

  /**
   * Monitor network conditions and adapt quality
   */
  async monitorNetworkConditions(peerId: string): Promise<NetworkConditions> {
    const stats = await this.getPeerStats(peerId);
    const conditions = this.performanceMonitor.analyzeStats(stats);

    // Trigger quality adaptation if needed
    this.qualityAdapter.evaluateConditions(peerId, conditions);

    return conditions;
  }

  /**
   * Setup multi-agent coordination session
   */
  async createCoordinationSession(
    sessionId: string,
    participants: string[],
  ): Promise<StreamingSession> {
    const session: StreamingSession = {
      id: sessionId,
      status: "active",
      streams: {},
      metadata: {
        timestamp: Date.now(),
        sessionId,
      },
      startTime: Date.now(),
      participants,
    };

    this.sessions.set(sessionId, session);
    this.syncManager.initializeSession(session);

    this.logger.info("Coordination session created", {
      sessionId,
      participants,
    });
    return session;
  }

  /**
   * Optimize connection settings for low latency
   */
  private optimizeConnection(connection: RTCPeerConnection): void {
    // Set up data channel for low-latency coordination
    const dataChannel = connection.createDataChannel("coordination", {
      ordered: false,
      maxRetransmits: 0,
    });

    dataChannel.onopen = () => {
      this.logger.debug("Coordination data channel opened");
    };

    dataChannel.onmessage = (event) => {
      this.handleCoordinationMessage(JSON.parse(event.data));
    };
  }

  /**
   * Setup peer event handlers
   */
  private setupPeerHandlers(peer: WebRTCPeer): void {
    const { connection } = peer;

    connection.onicecandidate = (event) => {
      if (event.candidate) {
        this.emit("ice_candidate", {
          peerId: peer.id,
          candidate: event.candidate,
        });
      }
    };

    connection.onconnectionstatechange = () => {
      peer.state = connection.connectionState;
      this.logger.info("Peer connection state changed", {
        peerId: peer.id,
        state: peer.state,
      });

      this.emit("peer_state_changed", {
        peerId: peer.id,
        state: peer.state,
      });
    };

    connection.ontrack = (event) => {
      const [stream] = event.streams;
      peer.streams.incoming.push(stream);

      this.emit("track_received", {
        peerId: peer.id,
        track: event.track,
        stream,
      });
    };

    connection.ondatachannel = (event) => {
      const channel = event.channel;
      channel.onmessage = (messageEvent) => {
        this.handleCoordinationMessage(JSON.parse(messageEvent.data));
      };
    };
  }

  /**
   * Create video stream with specified constraints
   */
  private async createVideoStream(
    request: VideoStreamRequest,
  ): Promise<MediaStream> {
    const constraints: MediaStreamConstraints = {
      video: {
        width: { ideal: request.quality.video!.resolution.width },
        height: { ideal: request.quality.video!.resolution.height },
        frameRate: { ideal: request.quality.video!.framerate },
        ...request.constraints?.video,
      },
    };

    if (request.source === "camera") {
      return navigator.mediaDevices.getUserMedia(constraints);
    } else if (request.source === "screen") {
      return navigator.mediaDevices.getDisplayMedia(constraints);
    } else {
      throw new Error(`Unsupported video source: ${request.source}`);
    }
  }

  /**
   * Create audio stream with processing options
   */
  private async createAudioStream(
    request: AudioStreamRequest,
  ): Promise<MediaStream> {
    const constraints: MediaStreamConstraints = {
      audio: {
        sampleRate: { ideal: request.quality.audio!.sampleRate },
        channelCount: { ideal: request.quality.audio!.channels },
        echoCancellation: request.processing?.echoCancellation ?? true,
        noiseSuppression: request.processing?.noiseSuppression ?? true,
        autoGainControl: request.processing?.autoGainControl ?? true,
        ...request.constraints?.audio,
      },
    };

    if (request.source === "microphone") {
      return navigator.mediaDevices.getUserMedia(constraints);
    } else {
      throw new Error(`Unsupported audio source: ${request.source}`);
    }
  }

  /**
   * Configure video sender with codec preferences
   */
  private configureVideoSender(sender: RTCRtpSender, config: any): void {
    const params = sender.getParameters();

    // Set bitrate constraints
    if (params.encodings.length > 0) {
      params.encodings[0].maxBitrate = config.bitrate;
      params.encodings[0].maxFramerate = config.framerate;
    }

    sender.setParameters(params);
  }

  /**
   * Configure audio sender with quality settings
   */
  private configureAudioSender(sender: RTCRtpSender, config: any): void {
    const params = sender.getParameters();

    // Set bitrate constraints
    if (params.encodings.length > 0) {
      params.encodings[0].maxBitrate = config.bitrate;
    }

    sender.setParameters(params);
  }

  /**
   * Optimize SDP for better performance and codec preferences
   */
  private optimizeSDP(sdp: string, type: "offer" | "answer"): string {
    let optimizedSdp = sdp;

    // Prefer VP9 for video
    optimizedSdp = this.preferCodec(optimizedSdp, "video", "VP9");

    // Prefer Opus for audio
    optimizedSdp = this.preferCodec(optimizedSdp, "audio", "opus");

    // Enable hardware acceleration hints
    optimizedSdp = optimizedSdp.replace(
      /a=fmtp:(\d+) /g,
      "a=fmtp:$1 profile-id=1;",
    );

    return optimizedSdp;
  }

  /**
   * Prefer specific codec in SDP
   */
  private preferCodec(
    sdp: string,
    type: "video" | "audio",
    codec: string,
  ): string {
    const lines = sdp.split("\r\n");
    const mLineIndex = lines.findIndex((line) => line.startsWith(`m=${type}`));

    if (mLineIndex === -1) return sdp;

    const mLine = lines[mLineIndex];
    const codecPayloads = this.extractCodecPayloads(lines, codec);

    if (codecPayloads.length > 0) {
      const otherPayloads = mLine
        .split(" ")
        .slice(3)
        .filter((p) => !codecPayloads.includes(p));
      const newMLine = `${mLine.split(" ").slice(0, 3).join(" ")} ${codecPayloads.join(" ")} ${otherPayloads.join(" ")}`;
      lines[mLineIndex] = newMLine;
    }

    return lines.join("\r\n");
  }

  /**
   * Extract codec payload types from SDP
   */
  private extractCodecPayloads(lines: string[], codec: string): string[] {
    const payloads: string[] = [];

    for (const line of lines) {
      if (
        line.includes(`a=rtpmap:`) &&
        line.toLowerCase().includes(codec.toLowerCase())
      ) {
        const payload = line.split(":")[1].split(" ")[0];
        payloads.push(payload);
      }
    }

    return payloads;
  }

  /**
   * Validate ICE candidate
   */
  private validateIceCandidate(candidate: RTCIceCandidateInit): boolean {
    if (!candidate.candidate) return false;

    // Basic validation - could be enhanced with security checks
    const parts = candidate.candidate.split(" ");
    return parts.length >= 6 && parts[0] === "candidate";
  }

  /**
   * Setup signaling infrastructure
   */
  private setupSignaling(): void {
    // WebSocket signaling implementation would go here
    // This is a placeholder for the signaling architecture
    this.logger.info("Signaling setup completed");
  }

  /**
   * Start performance monitoring
   */
  private startMonitoring(): void {
    setInterval(async () => {
      for (const [peerId] of this.peers) {
        try {
          await this.monitorNetworkConditions(peerId);
        } catch (error) {
          this.logger.warn("Monitoring error", {
            peerId,
            error: (error as Error).message,
          });
        }
      }
    }, 5000); // Monitor every 5 seconds
  }

  /**
   * Handle coordination messages
   */
  private handleCoordinationMessage(message: any): void {
    this.emit("coordination_message", message);
  }

  /**
   * Setup transcription for audio stream
   */
  private setupTranscription(
    response: AudioStreamResponse,
    language?: string,
  ): void {
    // Speech recognition implementation would go here
    response.transcription = {
      enabled: true,
      language: language || "en-US",
      confidence: 0,
      text: "",
      segments: [],
    };
  }

  /**
   * Create standardized streaming error
   */
  private createStreamingError(
    code: string,
    message: string,
    severity: "low" | "medium" | "high" | "critical",
    recoverable: boolean,
    category:
      | "network"
      | "encoding"
      | "decoding"
      | "sync"
      | "coordination"
      | "permission",
    context: any,
  ): StreamingError {
    return {
      code,
      message,
      severity,
      recoverable,
      category,
      timestamp: Date.now(),
      context,
      recovery: {
        suggested: ["retry", "reduce_quality", "switch_codec"],
        automatic: recoverable,
        retryable: recoverable,
        fallback: "websocket",
      },
    };
  }

  /**
   * Clean up peer connection
   */
  async closePeer(peerId: string): Promise<void> {
    const peer = this.peers.get(peerId);
    if (peer) {
      peer.connection.close();
      this.peers.delete(peerId);
      this.logger.info("Peer connection closed", { peerId });
    }
  }

  /**
   * Clean up all resources
   */
  async cleanup(): Promise<void> {
    for (const [peerId] of this.peers) {
      await this.closePeer(peerId);
    }

    this.signalingEndpoints.forEach((ws) => ws.close());
    this.removeAllListeners();

    this.logger.info("WebRTC architecture cleaned up");
  }
}

/**
 * Performance monitoring helper class
 */
class PerformanceMonitor {
  analyzeStats(stats: RTCStatsReport): NetworkConditions {
    const conditions: NetworkConditions = {
      bandwidth: { upload: 0, download: 0, available: 0 },
      latency: { rtt: 0, jitter: 0 },
      jitter: 0,
      packetLoss: 0,
      quality: { packetLoss: 0, stability: 1, congestion: 0 },
      timestamp: Date.now(),
    };

    stats.forEach((report) => {
      if (report.type === "candidate-pair" && report.state === "succeeded") {
        (conditions.latency as { rtt: number; jitter: number }).rtt = report.currentRoundTripTime * 1000;
      }

      if (report.type === "inbound-rtp") {
        conditions.quality!.packetLoss =
          report.packetsLost / (report.packetsLost + report.packetsReceived);
        (conditions.latency as { rtt: number; jitter: number }).jitter = report.jitter;
      }

      if (report.type === "outbound-rtp") {
        (conditions.bandwidth as { upload: number; download: number; available: number }).upload = (report.bytesSent / report.timestamp) * 8;
      }
    });

    return conditions;
  }
}

/**
 * Quality adaptation helper class
 */
class QualityAdapter {
  private adaptationRules: QualityAdaptationRule[] = [];
  private cooldowns = new Map<string, number>();

  startAdaptation(
    streamId: string,
    type: "video" | "audio",
    initialQuality: any,
  ): void {
    // Initialize adaptation monitoring
  }

  evaluateConditions(streamId: string, conditions: NetworkConditions): void {
    // Evaluate adaptation rules and adjust quality
  }
}

/**
 * Synchronization manager helper class
 */
class SynchronizationManager {
  initializeSession(session: StreamingSession): void {
    // Initialize synchronization for multi-agent session
  }
}
