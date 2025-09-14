/**
 * Resource Coordinator for GPU/Memory Management
 *
 * Advanced resource coordination system with intelligent allocation,
 * load balancing, and performance optimization for high-throughput operations.
 */
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { ResourceCoordinatorConfig, ServiceResponse, PerformanceMetrics } from "../interfaces.js";
export interface ResourcePool {
    id: string;
    type: "gpu" | "cpu" | "memory" | "storage" | "network";
    capacity: ResourceCapacity;
    allocated: ResourceAllocation;
    available: ResourceAllocation;
    utilization: ResourceUtilization;
    health: ResourceHealth;
}
export interface ResourceCapacity {
    cores?: number;
    memory: number;
    storage?: number;
    bandwidth?: number;
    compute?: number;
}
export interface ResourceAllocation {
    cores?: number;
    memory: number;
    storage?: number;
    bandwidth?: number;
    compute?: number;
    reservations: ResourceReservation[];
}
export interface ResourceReservation {
    id: string;
    requestId: string;
    type: "immediate" | "scheduled" | "preemptible";
    priority: number;
    duration: number;
    startTime: Date;
    endTime?: Date;
    resources: ResourceRequirement;
    status: "pending" | "active" | "completed" | "cancelled";
}
export interface ResourceRequirement {
    cores?: number;
    memory: number;
    storage?: number;
    bandwidth?: number;
    compute?: number;
    constraints: ResourceConstraint[];
}
export interface ResourceConstraint {
    type: "affinity" | "anti_affinity" | "location" | "capability" | "performance";
    value: any;
    weight: number;
    required: boolean;
}
export interface ResourceUtilization {
    cores?: number;
    memory: number;
    storage?: number;
    bandwidth?: number;
    compute?: number;
    efficiency: number;
}
export interface ResourceHealth {
    status: "healthy" | "degraded" | "unhealthy" | "offline";
    score: number;
    issues: HealthIssue[];
    lastCheck: Date;
    uptime: number;
}
export interface HealthIssue {
    type: "performance" | "availability" | "capacity" | "error";
    severity: "low" | "medium" | "high" | "critical";
    description: string;
    timestamp: Date;
    resolved: boolean;
}
export interface AllocationRequest {
    id: string;
    type: "task" | "service" | "batch" | "interactive";
    priority: number;
    requirements: ResourceRequirement;
    scheduling: SchedulingPreferences;
    monitoring: MonitoringConfig;
    lifecycle: LifecycleConfig;
}
export interface SchedulingPreferences {
    policy: "immediate" | "best_fit" | "first_fit" | "balanced" | "performance";
    preemption: PreemptionConfig;
    migration: MigrationConfig;
    isolation: IsolationConfig;
}
export interface PreemptionConfig {
    enabled: boolean;
    threshold: number;
    gracePeriod: number;
    notification: boolean;
}
export interface MigrationConfig {
    enabled: boolean;
    triggers: MigrationTrigger[];
    overhead: number;
}
export interface MigrationTrigger {
    condition: string;
    threshold: number;
    cooldown: number;
}
export interface IsolationConfig {
    level: "none" | "process" | "container" | "vm" | "bare_metal";
    networking: NetworkIsolation;
    storage: StorageIsolation;
    security: SecurityIsolation;
}
export interface NetworkIsolation {
    vlan?: string;
    subnet?: string;
    bandwidth?: number;
    qos?: QoSConfig;
}
export interface QoSConfig {
    class: string;
    priority: number;
    guarantees: QoSGuarantee[];
}
export interface QoSGuarantee {
    metric: "latency" | "bandwidth" | "jitter" | "loss";
    target: number;
    limit: number;
}
export interface StorageIsolation {
    type: "shared" | "dedicated" | "encrypted";
    path?: string;
    quota?: number;
    iops?: number;
}
export interface SecurityIsolation {
    enabled: boolean;
    policies: SecurityPolicy[];
    encryption: boolean;
    audit: boolean;
}
export interface SecurityPolicy {
    name: string;
    rules: SecurityRule[];
    enforcement: "strict" | "permissive";
}
export interface SecurityRule {
    resource: string;
    action: string;
    principal: string;
    effect: "allow" | "deny";
}
export interface MonitoringConfig {
    enabled: boolean;
    metrics: MonitoringMetric[];
    alerts: AlertConfig[];
    reporting: ReportingConfig;
}
export interface MonitoringMetric {
    name: string;
    type: "counter" | "gauge" | "histogram";
    interval: number;
    retention: number;
}
export interface AlertConfig {
    name: string;
    condition: AlertCondition;
    severity: "low" | "medium" | "high" | "critical";
    channels: string[];
}
export interface AlertCondition {
    metric: string;
    operator: ">" | "<" | "==" | "!=" | ">=" | "<=";
    threshold: number;
    duration: number;
}
export interface ReportingConfig {
    enabled: boolean;
    frequency: string;
    recipients: string[];
    format: "json" | "csv" | "pdf";
}
export interface LifecycleConfig {
    timeout: number;
    checkpoints: CheckpointConfig;
    cleanup: CleanupConfig;
    restart: RestartConfig;
}
export interface CheckpointConfig {
    enabled: boolean;
    interval: number;
    storage: string;
    retention: number;
}
export interface CleanupConfig {
    enabled: boolean;
    resources: string[];
    timeout: number;
}
export interface RestartConfig {
    enabled: boolean;
    maxAttempts: number;
    backoff: BackoffConfig;
}
export interface BackoffConfig {
    strategy: "fixed" | "exponential" | "linear";
    initial: number;
    max: number;
    multiplier: number;
}
export interface AllocationResult {
    id: string;
    status: "allocated" | "partial" | "failed" | "queued";
    pools: PoolAllocation[];
    performance: AllocationPerformance;
    cost: AllocationCost;
    metadata: AllocationMetadata;
}
export interface PoolAllocation {
    poolId: string;
    allocation: ResourceAllocation;
    endpoints: ResourceEndpoint[];
    credentials: AccessCredentials;
}
export interface ResourceEndpoint {
    type: "compute" | "storage" | "network";
    address: string;
    port?: number;
    protocol: string;
    authentication: boolean;
}
export interface AccessCredentials {
    type: "token" | "certificate" | "key" | "password";
    value: string;
    expiry?: Date;
    scope: string[];
}
export interface AllocationPerformance {
    expectedThroughput: number;
    expectedLatency: number;
    efficiency: number;
    scalability: ScalabilityInfo;
}
export interface ScalabilityInfo {
    horizontal: boolean;
    vertical: boolean;
    autoScaling: AutoScalingConfig;
}
export interface AutoScalingConfig {
    enabled: boolean;
    triggers: ScalingTrigger[];
    limits: ScalingLimit[];
    policies: ScalingPolicy[];
}
export interface ScalingTrigger {
    metric: string;
    threshold: number;
    direction: "up" | "down";
    cooldown: number;
}
export interface ScalingLimit {
    resource: string;
    min: number;
    max: number;
}
export interface ScalingPolicy {
    name: string;
    algorithm: "step" | "linear" | "exponential";
    parameters: any;
}
export interface AllocationCost {
    estimated: number;
    breakdown: CostBreakdown[];
    billing: BillingInfo;
}
export interface CostBreakdown {
    resource: string;
    unit: string;
    quantity: number;
    rate: number;
    cost: number;
}
export interface BillingInfo {
    model: "pay_per_use" | "reserved" | "spot" | "committed";
    period: string;
    currency: string;
    discounts: Discount[];
}
export interface Discount {
    type: "volume" | "commitment" | "promotional";
    rate: number;
    condition: string;
}
export interface AllocationMetadata {
    created: Date;
    creator: string;
    tags: Record<string, string>;
    annotations: Record<string, string>;
    version: string;
}
export interface ResourceTopology {
    nodes: TopologyNode[];
    connections: TopologyConnection[];
    clusters: ResourceCluster[];
    regions: ResourceRegion[];
}
export interface TopologyNode {
    id: string;
    type: "compute" | "storage" | "network" | "accelerator";
    location: NodeLocation;
    capabilities: NodeCapability[];
    status: NodeStatus;
}
export interface NodeLocation {
    region: string;
    zone: string;
    rack?: string;
    coordinates?: Coordinates;
}
export interface Coordinates {
    latitude: number;
    longitude: number;
    altitude?: number;
}
export interface NodeCapability {
    name: string;
    version: string;
    performance: PerformanceRating;
    compatibility: string[];
}
export interface PerformanceRating {
    compute: number;
    memory: number;
    storage: number;
    network: number;
    overall: number;
}
export interface NodeStatus {
    state: "online" | "offline" | "maintenance" | "error";
    health: number;
    load: ResourceUtilization;
    temperature?: number;
    power?: PowerInfo;
}
export interface PowerInfo {
    consumption: number;
    efficiency: number;
    thermal: ThermalInfo;
}
export interface ThermalInfo {
    temperature: number;
    cooling: CoolingInfo;
}
export interface CoolingInfo {
    type: "air" | "liquid" | "immersion";
    capacity: number;
    efficiency: number;
}
export interface TopologyConnection {
    from: string;
    to: string;
    type: "network" | "storage" | "power";
    bandwidth: number;
    latency: number;
    reliability: number;
}
export interface ResourceCluster {
    id: string;
    name: string;
    nodes: string[];
    capabilities: ClusterCapability[];
    policies: ClusterPolicy[];
}
export interface ClusterCapability {
    name: string;
    aggregate: boolean;
    performance: PerformanceRating;
}
export interface ClusterPolicy {
    name: string;
    type: "scheduling" | "security" | "resource" | "network";
    rules: PolicyRule[];
    enforcement: "strict" | "best_effort";
}
export interface PolicyRule {
    condition: string;
    action: string;
    priority: number;
}
export interface ResourceRegion {
    id: string;
    name: string;
    clusters: string[];
    compliance: ComplianceInfo[];
    pricing: RegionPricing;
}
export interface ComplianceInfo {
    standard: string;
    certification: string;
    requirements: string[];
    status: "compliant" | "partial" | "non_compliant";
}
export interface RegionPricing {
    currency: string;
    rates: PricingRate[];
    modifiers: PricingModifier[];
}
export interface PricingRate {
    resource: string;
    unit: string;
    rate: number;
    tier?: PricingTier;
}
export interface PricingTier {
    name: string;
    threshold: number;
    discount: number;
}
export interface PricingModifier {
    name: string;
    type: "multiplier" | "offset" | "discount";
    value: number;
    condition: string;
}
export declare class ResourceCoordinator extends EventEmitter {
    private logger;
    private config;
    private pools;
    private allocations;
    private topology;
    private scheduler;
    private monitor;
    private optimizer;
    private balancer;
    private predictor;
    private costAnalyzer;
    constructor(config: ResourceCoordinatorConfig);
    /**
     * Initializes the resource coordinator
     */
    initialize(): Promise<void>;
    /**
     * Allocates resources based on requirements
     */
    allocateResources(request: AllocationRequest): Promise<ServiceResponse<AllocationResult>>;
    /**
     * Deallocates resources
     */
    deallocateResources(allocationId: string): Promise<ServiceResponse<void>>;
    /**
     * Gets allocation status and metrics
     */
    getAllocation(allocationId: string): Promise<ServiceResponse<AllocationResult>>;
    /**
     * Lists all resource pools
     */
    listPools(): Promise<ServiceResponse<ResourcePool[]>>;
    /**
     * Gets resource topology
     */
    getTopology(): Promise<ServiceResponse<ResourceTopology>>;
    /**
     * Gets resource utilization statistics
     */
    getUtilization(): Promise<ServiceResponse<ResourceUtilization[]>>;
    /**
     * Gets performance metrics
     */
    getMetrics(): Promise<ServiceResponse<PerformanceMetrics>>;
    /**
     * Optimizes resource allocation
     */
    optimizeResources(): Promise<ServiceResponse<OptimizationResult>>;
    private initializeComponents;
    private setupEventHandlers;
    private discoverResources;
    private validateAllocationRequest;
    private findCandidatePools;
    private poolCanSatisfy;
    private calculateSuitabilityScore;
    private applyAllocation;
    private releaseAllocation;
    private updatePoolUtilization;
    private generateEndpoints;
    private generateCredentials;
    private generateRequestId;
    private createErrorResponse;
    private handleAllocationScheduled;
    private handleResourceAlert;
    private handleOptimizationCompleted;
}
interface OptimizationResult {
    improvements: Improvement[];
    savings: Savings;
    recommendations: Recommendation[];
    impact: ImpactAnalysis;
}
interface Improvement {
    type: "efficiency" | "cost" | "performance" | "utilization";
    description: string;
    benefit: number;
    effort: number;
    priority: number;
}
interface Savings {
    cost: number;
    resources: ResourceSavings[];
    timeframe: string;
}
interface ResourceSavings {
    type: string;
    amount: number;
    unit: string;
    percentage: number;
}
interface Recommendation {
    title: string;
    description: string;
    category: string;
    priority: "low" | "medium" | "high" | "critical";
    effort: "low" | "medium" | "high";
    impact: "low" | "medium" | "high";
}
interface ImpactAnalysis {
    performance: number;
    cost: number;
    efficiency: number;
    sustainability: number;
    risk: number;
}
export {};
//# sourceMappingURL=resource-coordinator.d.ts.map