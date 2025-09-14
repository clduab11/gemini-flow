/**
 * Comprehensive AgentSpace Type Definitions
 *
 * Defines all interfaces for the 66-agent spatial computing architecture
 */
import { AgentDefinition } from "../../agents/agent-definitions.js";
import { VectorClock } from "../../protocols/a2a/memory/vector-clocks.js";
export type AgentSpaceId = string;
export type WorkspaceId = string;
export type ResourceId = string;
export type SpatialCoordinateId = string;
export interface AgentWorkspace {
    id: WorkspaceId;
    agentId: string;
    name: string;
    type: "isolated" | "shared" | "collaborative" | "secure";
    resources: WorkspaceResources;
    resourceLimits: ResourceLimits;
    spatialProperties: SpatialProperties;
    accessControl: AccessControlPolicy;
    state: WorkspaceState;
    createdAt: Date;
    lastAccessedAt: Date;
    configuration: WorkspaceConfiguration;
}
export interface WorkspaceResources {
    memory: MemoryResource;
    cpu: CPUResource;
    network: NetworkResource;
    storage: StorageResource;
    tools: ToolResource[];
}
export interface ResourceLimits {
    maxMemoryMB: number;
    maxCPUPercentage: number;
    maxNetworkBandwidthMbps: number;
    maxStorageMB: number;
    maxConcurrentConnections: number;
    maxToolAccess: number;
    timeoutMs: number;
}
export interface MemoryResource {
    allocated: number;
    used: number;
    reserved: number;
    swapped: number;
    compressionRatio: number;
    cacheHitRate: number;
}
export interface CPUResource {
    cores: number;
    usage: number;
    priority: "low" | "normal" | "high" | "critical";
    scheduling: "preemptive" | "cooperative";
}
export interface NetworkResource {
    bandwidth: number;
    latency: number;
    packetLoss: number;
    connections: number;
    throughput: {
        inbound: number;
        outbound: number;
    };
}
export interface StorageResource {
    allocated: number;
    used: number;
    iops: number;
    type: "memory" | "ssd" | "disk" | "distributed";
}
export interface ToolResource {
    toolId: string;
    toolType: string;
    accessLevel: "read" | "write" | "execute" | "admin";
    usageCount: number;
    lastUsed: Date;
}
export interface SpatialProperties {
    coordinates: Vector3D;
    orientation: Quaternion;
    boundingBox: BoundingBox;
    velocity: Vector3D;
    acceleration: Vector3D;
    spatialRelationships: SpatialRelationship[];
}
export interface Vector3D {
    x: number;
    y: number;
    z: number;
}
export interface Quaternion {
    x: number;
    y: number;
    z: number;
    w: number;
}
export interface BoundingBox {
    min: Vector3D;
    max: Vector3D;
    center: Vector3D;
    volume: number;
}
export interface SpatialRelationship {
    targetId: string;
    type: "adjacent" | "contained" | "overlapping" | "distant" | "collaborative";
    distance: number;
    strength: number;
    lastUpdated: Date;
}
export interface SpatialZone {
    id: string;
    name: string;
    type: "collaborative" | "private" | "public" | "secure" | "quarantine";
    boundaries: BoundingBox;
    capacity: number;
    currentOccupancy: number;
    accessRules: AccessRule[];
    spatialRules: SpatialRule[];
}
export interface AccessRule {
    agentType?: string[];
    agentId?: string[];
    capability?: string[];
    trustLevel?: number;
    timeRestriction?: TimeWindow;
}
export interface SpatialRule {
    type: "proximity" | "movement" | "resource" | "interaction";
    condition: string;
    action: string;
    priority: number;
}
export interface TimeWindow {
    start: Date;
    end: Date;
    timezone: string;
}
export interface SpatialMemoryNode {
    id: string;
    agentId: string;
    location: Vector3D;
    memoryType: "working" | "episodic" | "semantic" | "procedural" | "spatial";
    data: any;
    metadata: MemoryMetadata;
    spatialContext: SpatialContext;
    proximityIndex: ProximityIndex;
    knowledgeLinks: KnowledgeLink[];
    persistence: PersistenceConfig;
    vectorClock: VectorClock;
}
export interface MemoryMetadata {
    encoding: "json" | "binary" | "compressed" | "encrypted";
    size: number;
    priority: number;
    accessFrequency: number;
    lastAccessed: Date;
    expirationDate?: Date;
    tags: string[];
    sourceAgent: string;
    confidenceScore: number;
}
export interface SpatialContext {
    zone: string;
    nearbyAgents: string[];
    environmentalFactors: EnvironmentalFactor[];
    temporalContext: TemporalContext;
}
export interface EnvironmentalFactor {
    type: "lighting" | "noise" | "temperature" | "activity" | "resource_availability";
    value: number;
    impact: number;
}
export interface TemporalContext {
    timestamp: Date;
    duration: number;
    recurrence?: RecurrencePattern;
    timeOfDay: "morning" | "afternoon" | "evening" | "night";
}
export interface RecurrencePattern {
    type: "daily" | "weekly" | "monthly" | "custom";
    interval: number;
    endDate?: Date;
}
export interface ProximityIndex {
    spatialHash: string;
    neighbors: ProximityNeighbor[];
    influenceRadius: number;
    interactionStrength: number;
}
export interface ProximityNeighbor {
    nodeId: string;
    distance: number;
    relationship: string;
    weight: number;
}
export interface KnowledgeLink {
    targetNodeId: string;
    linkType: "causal" | "temporal" | "semantic" | "spatial" | "hierarchical";
    strength: number;
    confidence: number;
    metadata: any;
}
export interface PersistenceConfig {
    level: "volatile" | "session" | "persistent" | "archival";
    backupPolicy: BackupPolicy;
    replicationFactor: number;
    compressionEnabled: boolean;
}
export interface BackupPolicy {
    frequency: "realtime" | "hourly" | "daily" | "weekly";
    retention: number;
    locations: string[];
}
export interface SpatialConsensusProposal {
    proposalId: string;
    type: "location_change" | "resource_allocation" | "zone_access" | "collaboration_request";
    proposer: string;
    targetAgents: string[];
    spatialRequirements: SpatialRequirement[];
    resourceRequirements: ResourceRequirement[];
    consensusDeadline: Date;
    priority: "low" | "normal" | "high" | "critical";
}
export interface SpatialRequirement {
    type: "location" | "proximity" | "isolation" | "movement";
    constraint: any;
    mandatory: boolean;
    weight: number;
}
export interface ResourceRequirement {
    resourceType: string;
    amount: number;
    duration?: number;
    sharable: boolean;
    fallback?: any;
}
export interface SpatialConsensusVote {
    proposalId: string;
    voter: string;
    vote: "accept" | "reject" | "abstain" | "conditional";
    reasoning: string;
    conditions?: ConditionalRequirement[];
    timestamp: Date;
    signature: string;
}
export interface ConditionalRequirement {
    condition: string;
    requirement: any;
    timeout?: number;
}
export interface SpatialConsensusResult {
    proposalId: string;
    decision: "approved" | "rejected" | "timeout" | "cancelled";
    votes: SpatialConsensusVote[];
    finalConfiguration: any;
    implementationPlan: ImplementationStep[];
    validUntil: Date;
}
export interface ImplementationStep {
    step: number;
    action: string;
    targetAgents: string[];
    dependencies: string[];
    estimatedDuration: number;
    rollbackPlan?: string;
}
export interface AgentSpaceConfiguration {
    maxWorkspaces: number;
    defaultResourceLimits: ResourceLimits;
    spatialDimensions: Vector3D;
    consensusQuorum: number;
    memoryShardingEnabled: boolean;
    securityLevel: "basic" | "standard" | "high" | "maximum";
    monitoringEnabled: boolean;
    analyticsEnabled: boolean;
}
export interface WorkspaceState {
    status: "initializing" | "active" | "suspended" | "terminating" | "error";
    health: "healthy" | "degraded" | "unhealthy" | "critical";
    resourceUtilization: ResourceUtilization;
    performance: PerformanceMetrics;
    errors: ErrorReport[];
}
export interface ResourceUtilization {
    memory: number;
    cpu: number;
    network: number;
    storage: number;
    efficiency: number;
}
export interface PerformanceMetrics {
    responseTime: number;
    throughput: number;
    errorRate: number;
    successRate: number;
    latency: number;
    concurrency: number;
}
export interface ErrorReport {
    id: string;
    type: string;
    message: string;
    severity: "low" | "medium" | "high" | "critical";
    timestamp: Date;
    resolved: boolean;
    stackTrace?: string;
}
export interface WorkspaceConfiguration {
    isolationLevel: "none" | "process" | "container" | "vm" | "secure_enclave";
    networkPolicy: NetworkPolicy;
    storagePolicy: StoragePolicy;
    securityPolicy: SecurityPolicy;
    monitoringPolicy: MonitoringPolicy;
}
export interface NetworkPolicy {
    inboundRules: NetworkRule[];
    outboundRules: NetworkRule[];
    defaultAction: "allow" | "deny";
    rateLimiting: RateLimitConfig;
}
export interface NetworkRule {
    protocol: "tcp" | "udp" | "http" | "websocket" | "mcp";
    ports: number[];
    sources?: string[];
    destinations?: string[];
    action: "allow" | "deny";
}
export interface RateLimitConfig {
    requestsPerSecond: number;
    burstSize: number;
    windowSize: number;
}
export interface StoragePolicy {
    type: "local" | "distributed" | "cloud" | "hybrid";
    encryption: boolean;
    compression: boolean;
    deduplication: boolean;
    retention: RetentionPolicy;
}
export interface RetentionPolicy {
    defaultTTL: number;
    archiveThreshold: number;
    deleteThreshold: number;
    backupEnabled: boolean;
}
export interface SecurityPolicy {
    authentication: "none" | "api_key" | "oauth" | "certificate" | "biometric";
    authorization: "none" | "rbac" | "abac" | "custom";
    encryption: "none" | "transport" | "at_rest" | "end_to_end";
    auditLevel: "none" | "basic" | "detailed" | "comprehensive";
}
export interface MonitoringPolicy {
    metricsEnabled: boolean;
    logsEnabled: boolean;
    tracingEnabled: boolean;
    alertingEnabled: boolean;
    retentionDays: number;
}
export interface AccessControlPolicy {
    owner: string;
    permissions: Permission[];
    inheritanceEnabled: boolean;
    defaultPermission: "deny" | "read" | "write" | "admin";
}
export interface Permission {
    subject: string;
    actions: string[];
    resources?: string[];
    conditions?: PermissionCondition[];
    expirationDate?: Date;
}
export interface PermissionCondition {
    type: "time" | "location" | "resource_usage" | "trust_level";
    condition: any;
    required: boolean;
}
export interface AgentSpaceEvent {
    id: string;
    type: AgentSpaceEventType;
    source: string;
    target?: string;
    timestamp: Date;
    data: any;
    severity: "info" | "warning" | "error" | "critical";
}
export type AgentSpaceEventType = "workspace_created" | "workspace_destroyed" | "agent_moved" | "resource_allocated" | "resource_deallocated" | "consensus_started" | "consensus_completed" | "memory_synchronized" | "spatial_collision" | "performance_threshold_exceeded" | "security_violation" | "system_alert";
export interface MCPIntegration {
    memoryProvider: string;
    toolRegistry: string;
    authProvider: string;
    eventBus: string;
}
export interface AgentDefinitionExtension extends AgentDefinition {
    spatialCapabilities?: SpatialCapability[];
    resourceRequirements?: ResourceRequirement[];
    collaborationPreferences?: CollaborationPreference[];
    securityClearance?: SecurityClearance;
}
export interface SpatialCapability {
    type: "navigation" | "spatial_reasoning" | "collision_detection" | "path_planning";
    level: "basic" | "intermediate" | "advanced" | "expert";
    constraints?: any;
}
export interface CollaborationPreference {
    preferredDistance: number;
    maxCollaborators: number;
    communicationStyle: "direct" | "broadcast" | "hierarchical" | "mesh";
    trustThreshold: number;
}
export interface SecurityClearance {
    level: "public" | "confidential" | "secret" | "top_secret";
    compartments?: string[];
    validUntil?: Date;
}
export interface AgentSpaceAnalytics {
    overallHealth: HealthScore;
    resourceEfficiency: EfficiencyMetrics;
    spatialUtilization: SpatialUtilizationMetrics;
    collaborationPatterns: CollaborationAnalytics;
    performanceTrends: PerformanceTrendAnalytics;
    predictiveInsights: PredictiveInsight[];
}
export interface HealthScore {
    overall: number;
    components: {
        workspaces: number;
        memory: number;
        consensus: number;
        spatial: number;
        resources: number;
    };
    trend: "improving" | "stable" | "degrading";
}
export interface EfficiencyMetrics {
    resourceUtilization: number;
    wasteReduction: number;
    energyEfficiency: number;
    costOptimization: number;
}
export interface SpatialUtilizationMetrics {
    spaceEfficiency: number;
    hotspots: HotspotAnalysis[];
    movementPatterns: MovementPattern[];
    collisionFrequency: number;
}
export interface HotspotAnalysis {
    location: Vector3D;
    activity: number;
    agents: string[];
    duration: number;
}
export interface MovementPattern {
    agentId: string;
    path: Vector3D[];
    frequency: number;
    efficiency: number;
}
export interface CollaborationAnalytics {
    networkDensity: number;
    clusteringCoefficient: number;
    collaborationFrequency: number;
    successRate: number;
    optimalGroupSize: number;
}
export interface PerformanceTrendAnalytics {
    throughputTrend: TrendData;
    latencyTrend: TrendData;
    errorRateTrend: TrendData;
    resourceUsageTrend: TrendData;
}
export interface TrendData {
    current: number;
    historical: number[];
    prediction: number;
    confidence: number;
}
export interface PredictiveInsight {
    type: "resource_shortage" | "performance_degradation" | "security_risk" | "optimization_opportunity";
    probability: number;
    timeframe: number;
    impact: "low" | "medium" | "high" | "critical";
    recommendation: string;
    preventiveActions: string[];
}
export interface ResolutionAction {
    entityId: string;
    action: "move" | "resize" | "pause" | "terminate";
    parameters: any;
}
//# sourceMappingURL=AgentSpaceTypes.d.ts.map