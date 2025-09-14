/**
 * A2A (Agent-to-Agent) Multimedia Protocol Extensions
 *
 * Advanced protocol extensions for seamless multimedia communication
 * between autonomous agents, enabling real-time collaboration, content
 * sharing, and synchronized multimedia experiences.
 */
/// <reference types="node" resolution-mode="require"/>
/// <reference types="node" resolution-mode="require"/>
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { A2AProtocolConfig, ServiceResponse, PerformanceMetrics } from "../interfaces.js";
export interface A2AMultimediaMessage {
    id: string;
    type: "media_request" | "media_response" | "stream_start" | "stream_data" | "stream_end" | "sync_signal";
    sourceAgentId: string;
    targetAgentId: string;
    timestamp: Date;
    priority: "low" | "medium" | "high" | "critical";
    payload: MultimediaPayload;
    routing: RoutingInfo;
    security: SecurityContext;
    metadata: MessageMetadata;
}
export interface MultimediaPayload {
    contentType: "video" | "audio" | "image" | "text" | "mixed" | "stream" | "control";
    encoding: string;
    compression: CompressionInfo;
    data?: Buffer | string | any;
    chunks?: MediaChunk[];
    references?: ContentReference[];
    synchronization?: SyncInfo;
}
export interface MediaChunk {
    id: string;
    sequence: number;
    timestamp: Date;
    data: Buffer;
    checksum: string;
    final: boolean;
}
export interface ContentReference {
    id: string;
    type: "url" | "hash" | "cache_key" | "storage_id";
    location: string;
    metadata: any;
}
export interface SyncInfo {
    sessionId: string;
    globalTimestamp: Date;
    sequenceNumber: number;
    synchronizationPoints: SyncPoint[];
}
export interface SyncPoint {
    timestamp: Date;
    markerType: "start" | "keyframe" | "chapter" | "end";
    metadata: any;
}
export interface CompressionInfo {
    algorithm: "gzip" | "lz4" | "zstd" | "brotli" | "custom";
    level: number;
    originalSize: number;
    compressedSize: number;
    ratio: number;
}
export interface RoutingInfo {
    path: string[];
    hops: number;
    preferredRoute: "direct" | "relay" | "multicast" | "broadcast";
    qos: QoSRequirements;
    failover: FailoverConfig;
}
export interface QoSRequirements {
    maxLatency: number;
    minBandwidth: number;
    reliability: number;
    priority: number;
}
export interface FailoverConfig {
    enabled: boolean;
    alternatives: string[];
    timeout: number;
    retryAttempts: number;
}
export interface SecurityContext {
    encryptionEnabled: boolean;
    encryptionAlgorithm: string;
    keyId: string;
    signature?: string;
    authentication: AuthenticationInfo;
    authorization: AuthorizationInfo;
}
export interface AuthenticationInfo {
    method: "token" | "certificate" | "signature" | "none";
    credentials: string;
    validated: boolean;
    expiresAt?: Date;
}
export interface AuthorizationInfo {
    permissions: string[];
    restrictions: string[];
    context: any;
}
export interface MessageMetadata {
    correlationId: string;
    replyTo?: string;
    expiration?: Date;
    attempts: number;
    tags: string[];
    trace: TraceInfo[];
}
export interface TraceInfo {
    agentId: string;
    timestamp: Date;
    operation: string;
    duration: number;
}
export interface A2AMultimediaSession {
    id: string;
    type: "streaming" | "request_response" | "broadcast" | "multicast" | "sync";
    participants: SessionParticipant[];
    configuration: SessionConfiguration;
    state: SessionState;
    statistics: SessionStatistics;
    synchronization: SessionSynchronization;
}
export interface SessionParticipant {
    agentId: string;
    role: "initiator" | "participant" | "observer" | "coordinator";
    capabilities: AgentCapabilities;
    status: "connected" | "connecting" | "disconnected" | "error";
    lastSeen: Date;
}
export interface AgentCapabilities {
    mediaTypes: string[];
    codecs: CodecSupport[];
    maxBandwidth: number;
    maxLatency: number;
    features: string[];
    hardware: HardwareCapabilities;
}
export interface CodecSupport {
    name: string;
    version: string;
    encode: boolean;
    decode: boolean;
    quality: number;
}
export interface HardwareCapabilities {
    gpu: boolean;
    simd: boolean;
    threading: number;
    memory: number;
    storage: number;
}
export interface SessionConfiguration {
    quality: QualityProfile;
    synchronization: SynchronizationConfig;
    failover: FailoverPolicy;
    security: SecurityPolicy;
    optimization: OptimizationConfig;
}
export interface QualityProfile {
    video?: VideoQualityConfig;
    audio?: AudioQualityConfig;
    adaptiveBitrate: boolean;
    qualityLadder: QualityLevel[];
}
export interface VideoQualityConfig {
    resolution: {
        width: number;
        height: number;
    };
    framerate: number;
    bitrate: number;
    codec: string;
    profile: string;
}
export interface AudioQualityConfig {
    sampleRate: number;
    channels: number;
    bitrate: number;
    codec: string;
    profile: string;
}
export interface QualityLevel {
    level: number;
    video?: VideoQualityConfig;
    audio?: AudioQualityConfig;
    bandwidth: number;
    priority: number;
}
export interface SynchronizationConfig {
    enabled: boolean;
    tolerance: number;
    method: "ntp" | "ptp" | "custom";
    coordinator: string;
    syncPoints: string[];
}
export interface FailoverPolicy {
    enabled: boolean;
    healthCheckInterval: number;
    timeoutThreshold: number;
    strategies: FailoverStrategy[];
}
export interface FailoverStrategy {
    name: string;
    conditions: FailoverCondition[];
    actions: FailoverAction[];
    priority: number;
}
export interface FailoverCondition {
    metric: string;
    operator: ">" | "<" | "==" | "!=" | ">=" | "<=";
    threshold: number;
    duration: number;
}
export interface FailoverAction {
    type: "retry" | "reroute" | "degrade" | "disconnect";
    parameters: any;
    delay: number;
}
export interface SecurityPolicy {
    encryptionRequired: boolean;
    algorithms: string[];
    keyRotation: KeyRotationConfig;
    accessControl: AccessControlConfig;
    audit: AuditConfig;
}
export interface KeyRotationConfig {
    enabled: boolean;
    interval: number;
    algorithm: string;
    keySize: number;
}
export interface AccessControlConfig {
    mode: "permissive" | "restrictive";
    whitelist: string[];
    blacklist: string[];
    rateLimit: RateLimitConfig;
}
export interface RateLimitConfig {
    enabled: boolean;
    requestsPerSecond: number;
    burstSize: number;
    windowSize: number;
}
export interface AuditConfig {
    enabled: boolean;
    events: string[];
    storage: "local" | "remote" | "distributed";
    retention: number;
}
export interface OptimizationConfig {
    compression: CompressionConfig;
    caching: CachingConfig;
    prefetching: PrefetchingConfig;
    batching: BatchingConfig;
}
export interface CompressionConfig {
    enabled: boolean;
    algorithms: string[];
    threshold: number;
    level: number;
}
export interface CachingConfig {
    enabled: boolean;
    ttl: number;
    maxSize: number;
    strategy: "lru" | "lfu" | "fifo";
}
export interface PrefetchingConfig {
    enabled: boolean;
    predictive: boolean;
    window: number;
    threshold: number;
}
export interface BatchingConfig {
    enabled: boolean;
    maxSize: number;
    maxDelay: number;
    strategy: "size" | "time" | "adaptive";
}
export interface SessionState {
    phase: "initializing" | "negotiating" | "active" | "pausing" | "resuming" | "terminating" | "terminated";
    startTime: Date;
    lastActivity: Date;
    errors: SessionError[];
    warnings: SessionWarning[];
}
export interface SessionError {
    id: string;
    timestamp: Date;
    source: string;
    type: string;
    message: string;
    severity: "low" | "medium" | "high" | "critical";
    recovered: boolean;
}
export interface SessionWarning {
    id: string;
    timestamp: Date;
    source: string;
    type: string;
    message: string;
    acknowledged: boolean;
}
export interface SessionStatistics {
    messages: MessageStatistics;
    bandwidth: BandwidthStatistics;
    latency: LatencyStatistics;
    quality: QualityStatistics;
    errors: ErrorStatistics;
}
export interface MessageStatistics {
    sent: number;
    received: number;
    dropped: number;
    retransmitted: number;
    duplicate: number;
}
export interface BandwidthStatistics {
    upload: BandwidthMetrics;
    download: BandwidthMetrics;
    total: BandwidthMetrics;
}
export interface BandwidthMetrics {
    current: number;
    average: number;
    peak: number;
    utilization: number;
}
export interface LatencyStatistics {
    current: number;
    average: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
}
export interface QualityStatistics {
    video?: VideoQualityMetrics;
    audio?: AudioQualityMetrics;
    overall: QualityScore;
}
export interface VideoQualityMetrics {
    resolution: {
        width: number;
        height: number;
    };
    framerate: FramerateMetrics;
    bitrate: BitrateMetrics;
    drops: number;
    freezes: number;
}
export interface FramerateMetrics {
    target: number;
    actual: number;
    stability: number;
}
export interface BitrateMetrics {
    target: number;
    actual: number;
    variability: number;
}
export interface AudioQualityMetrics {
    sampleRate: number;
    bitrate: BitrateMetrics;
    dropouts: number;
    latency: number;
}
export interface QualityScore {
    overall: number;
    stability: number;
    consistency: number;
}
export interface ErrorStatistics {
    total: number;
    rate: number;
    types: Record<string, number>;
    recovery: RecoveryStatistics;
}
export interface RecoveryStatistics {
    attempts: number;
    successful: number;
    failed: number;
    averageTime: number;
}
export interface SessionSynchronization {
    enabled: boolean;
    coordinator: string;
    globalClock: Date;
    offset: number;
    drift: number;
    quality: SyncQuality;
}
export interface SyncQuality {
    accuracy: number;
    precision: number;
    stability: number;
}
export interface ProtocolCapabilityNegotiation {
    initiatorId: string;
    targetId: string;
    requestedCapabilities: AgentCapabilities;
    offeredCapabilities: AgentCapabilities;
    agreedCapabilities: AgentCapabilities;
    negotiationStatus: "pending" | "agreed" | "failed";
    alternatives: AlternativeCapability[];
}
export interface AlternativeCapability {
    capability: string;
    fallbacks: string[];
    priority: number;
    available: boolean;
}
export interface ContentDistributionStrategy {
    strategy: "unicast" | "multicast" | "broadcast" | "adaptive";
    targets: string[];
    routing: RoutingStrategy;
    optimization: DistributionOptimization;
}
export interface RoutingStrategy {
    algorithm: "shortest_path" | "least_congested" | "highest_bandwidth" | "lowest_latency";
    constraints: RoutingConstraint[];
    fallbacks: string[];
}
export interface RoutingConstraint {
    type: "bandwidth" | "latency" | "reliability" | "cost";
    operator: ">" | "<" | "==" | "!=" | ">=" | "<=";
    value: number;
    weight: number;
}
export interface DistributionOptimization {
    compression: boolean;
    deduplication: boolean;
    caching: boolean;
    prefetching: boolean;
    loadBalancing: boolean;
}
export declare class A2AMultimediaProtocol extends EventEmitter {
    private logger;
    private config;
    private activeSessions;
    private messageQueue;
    private routingTable;
    private capabilities;
    private securityManager;
    private compressionEngine;
    private synchronizationEngine;
    private qualityManager;
    private routingEngine;
    private activeStreams;
    private sessionPersistence;
    private statisticsCalculator;
    constructor(config: A2AProtocolConfig);
    /**
     * Initializes the A2A multimedia protocol
     */
    initialize(): Promise<void>;
    /**
     * Creates a new multimedia session between agents
     */
    createMultimediaSession(sessionConfig: {
        type: "streaming" | "request_response" | "broadcast" | "multicast" | "sync";
        initiatorId: string;
        participants: string[];
        configuration?: Partial<SessionConfiguration>;
        metadata?: any;
    }): Promise<ServiceResponse<A2AMultimediaSession>>;
    /**
     * Sends multimedia message between agents
     */
    sendMultimediaMessage(message: Omit<A2AMultimediaMessage, "id" | "timestamp" | "metadata">): Promise<ServiceResponse<{
        messageId: string;
        delivered: boolean;
    }>>;
    /**
     * Starts multimedia streaming between agents
     */
    startMultimediaStream(sessionId: string, streamConfig: {
        sourceAgentId: string;
        targetAgents: string[];
        mediaType: "video" | "audio" | "mixed";
        quality: string;
        synchronization?: boolean;
    }): Promise<ServiceResponse<{
        streamId: string;
        endpoints: string[];
    }>>;
    /**
     * Synchronizes multimedia content across agents
     */
    synchronizeContent(sessionId: string, syncConfig: {
        contentId: string;
        synchronizationPoints: SyncPoint[];
        tolerance: number;
        participants: string[];
    }): Promise<ServiceResponse<{
        synchronized: boolean;
        participants: string[];
    }>>;
    /**
     * Gets session statistics and metrics
     */
    getSessionStatistics(sessionId: string): Promise<ServiceResponse<SessionStatistics>>;
    /**
     * Lists active multimedia sessions
     */
    listActiveSessions(): Promise<ServiceResponse<A2AMultimediaSession[]>>;
    /**
     * Gets performance metrics for the protocol
     */
    getProtocolMetrics(): Promise<ServiceResponse<PerformanceMetrics>>;
    private initializeComponents;
    private setupEventHandlers;
    private startProtocolServices;
    private negotiateCapabilities;
    private getDefaultCapabilities;
    private createQualityProfile;
    private createSynchronizationConfig;
    private createFailoverPolicy;
    private createSecurityPolicy;
    private createOptimizationConfig;
    private initializeSessionStatistics;
    private generateSessionId;
    private generateMessageId;
    private generateStreamId;
    private generateRequestId;
    private generateCorrelationId;
    private createErrorResponse;
    private initializeSessionProtocols;
    private validateMessage;
    private shouldCompressMessage;
    private routeMessage;
    private initializeStreamingEndpoints;
    private startStreamingSession;
    private calculateCurrentStatistics;
    private calculateLatencyMetrics;
    private calculateThroughputMetrics;
    private calculateUtilizationMetrics;
    private calculateErrorMetrics;
    private startMessageProcessing;
    private startHealthChecking;
    private startMetricsCollection;
    private handleSecurityViolation;
    private handleRoutingFailure;
    private handleQualityDegradation;
}
//# sourceMappingURL=a2a-multimedia-protocol.d.ts.map