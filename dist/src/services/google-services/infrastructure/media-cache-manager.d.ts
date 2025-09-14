/**
 * Media Cache Manager with CDN Integration
 *
 * Advanced media caching system with intelligent cache management,
 * multi-tier caching, and global CDN integration.
 */
/// <reference types="node" resolution-mode="require"/>
/// <reference types="node" resolution-mode="require"/>
/// <reference types="node" resolution-mode="require"/>
import { EventEmitter } from "events";
import { MediaCacheConfig, ServiceResponse, PerformanceMetrics } from "../interfaces.js";
export interface CacheNode {
    id: string;
    type: "edge" | "regional" | "origin" | "memory" | "disk";
    location: NodeLocation;
    capacity: CacheCapacity;
    utilization: CacheUtilization;
    performance: CachePerformance;
    health: NodeHealth;
    configuration: NodeConfiguration;
}
export interface NodeLocation {
    region: string;
    zone?: string;
    city?: string;
    country: string;
    coordinates: Coordinates;
    provider: string;
}
export interface Coordinates {
    latitude: number;
    longitude: number;
}
export interface CacheCapacity {
    storage: number;
    bandwidth: number;
    connections: number;
    requests: number;
}
export interface CacheUtilization {
    storage: number;
    bandwidth: number;
    connections: number;
    requests: number;
    efficiency: number;
}
export interface CachePerformance {
    hitRate: number;
    missRate: number;
    latency: LatencyMetrics;
    throughput: ThroughputMetrics;
    errors: ErrorMetrics;
}
export interface LatencyMetrics {
    mean: number;
    p50: number;
    p95: number;
    p99: number;
    max: number;
}
export interface ThroughputMetrics {
    current: number;
    peak: number;
    average: number;
}
export interface ErrorMetrics {
    rate: number;
    types: Record<string, number>;
    recent: ErrorEvent[];
}
export interface ErrorEvent {
    timestamp: Date;
    type: string;
    message: string;
    severity: "low" | "medium" | "high" | "critical";
}
export interface NodeHealth {
    status: "healthy" | "degraded" | "unhealthy" | "offline";
    score: number;
    issues: HealthIssue[];
    lastCheck: Date;
    uptime: number;
}
export interface HealthIssue {
    type: "performance" | "capacity" | "connectivity" | "error";
    severity: "low" | "medium" | "high" | "critical";
    description: string;
    timestamp: Date;
    resolved: boolean;
}
export interface NodeConfiguration {
    tier: number;
    weight: number;
    policies: CachePolicy[];
    rules: CacheRule[];
    limits: CacheLimits;
}
export interface CachePolicy {
    name: string;
    type: "eviction" | "compression" | "encryption" | "replication";
    enabled: boolean;
    parameters: PolicyParameters;
}
export interface PolicyParameters {
    [key: string]: any;
}
export interface CacheRule {
    pattern: string;
    action: "cache" | "bypass" | "redirect" | "block";
    ttl?: number;
    conditions: RuleCondition[];
}
export interface RuleCondition {
    field: string;
    operator: "==" | "!=" | ">" | "<" | ">=" | "<=" | "contains" | "matches";
    value: any;
}
export interface CacheLimits {
    maxFileSize: number;
    maxRequestRate: number;
    maxBandwidth: number;
    maxConnections: number;
}
export interface CacheEntry {
    key: string;
    content: CacheContent;
    metadata: EntryMetadata;
    stats: EntryStats;
    locations: CacheLocation[];
}
export interface CacheContent {
    data?: Buffer;
    url?: string;
    headers: Record<string, string>;
    contentType: string;
    size: number;
    etag: string;
    compressed: boolean;
    encrypted: boolean;
}
export interface EntryMetadata {
    created: Date;
    expires: Date;
    lastAccessed: Date;
    lastModified: Date;
    ttl: number;
    priority: number;
    tags: string[];
    source: string;
}
export interface EntryStats {
    hits: number;
    misses: number;
    bytes: number;
    requests: RequestStats[];
    geographic: GeographicStats[];
}
export interface RequestStats {
    timestamp: Date;
    node: string;
    latency: number;
    size: number;
    status: number;
}
export interface GeographicStats {
    region: string;
    hits: number;
    bytes: number;
    latency: number;
}
export interface CacheLocation {
    nodeId: string;
    stored: Date;
    size: number;
    compressed: boolean;
    replicated: boolean;
}
export interface CacheRequest {
    key: string;
    method: "GET" | "PUT" | "DELETE" | "HEAD";
    headers?: Record<string, string>;
    metadata?: CacheRequestMetadata;
    options?: CacheOptions;
}
export interface CacheRequestMetadata {
    clientIp?: string;
    userAgent?: string;
    referer?: string;
    priority?: number;
    tags?: string[];
}
export interface CacheOptions {
    ttl?: number;
    compression?: boolean;
    encryption?: boolean;
    replication?: boolean;
    bypass?: boolean;
    refresh?: boolean;
}
export interface CacheResponse {
    hit: boolean;
    content?: CacheContent;
    source: string;
    latency: number;
    metadata: ResponseMetadata;
}
export interface ResponseMetadata {
    cached: Date;
    expires: Date;
    age: number;
    fresh: boolean;
    etag: string;
}
export interface CacheInvalidation {
    patterns: string[];
    tags: string[];
    recursive: boolean;
    immediate: boolean;
    propagate: boolean;
}
export interface CacheStatistics {
    global: GlobalStats;
    nodes: NodeStats[];
    content: ContentStats[];
    geographic: GeographicDistribution[];
}
export interface GlobalStats {
    totalEntries: number;
    totalSize: number;
    hitRate: number;
    missRate: number;
    bandwidth: BandwidthStats;
    requests: RequestStatistics;
}
export interface BandwidthStats {
    ingress: number;
    egress: number;
    saved: number;
}
export interface RequestStatistics {
    total: number;
    perSecond: number;
    peak: number;
    average: number;
}
export interface NodeStats {
    nodeId: string;
    entries: number;
    size: number;
    hitRate: number;
    utilization: CacheUtilization;
    performance: CachePerformance;
}
export interface ContentStats {
    type: string;
    entries: number;
    size: number;
    hits: number;
    bandwidth: number;
}
export interface GeographicDistribution {
    region: string;
    requests: number;
    bytes: number;
    latency: number;
    hitRate: number;
}
export interface CDNConfiguration {
    providers: CDNProvider[];
    routing: RoutingConfiguration;
    security: SecurityConfiguration;
    monitoring: MonitoringConfiguration;
}
export interface CDNProvider {
    name: string;
    enabled: boolean;
    weight: number;
    endpoints: ProviderEndpoint[];
    capabilities: ProviderCapability[];
    pricing: PricingModel;
}
export interface ProviderEndpoint {
    region: string;
    url: string;
    priority: number;
    healthCheck: HealthCheckConfig;
}
export interface HealthCheckConfig {
    enabled: boolean;
    interval: number;
    timeout: number;
    threshold: number;
}
export interface ProviderCapability {
    name: string;
    supported: boolean;
    parameters?: any;
}
export interface PricingModel {
    bandwidth: PricingTier[];
    requests: PricingTier[];
    storage: PricingTier[];
}
export interface PricingTier {
    threshold: number;
    rate: number;
    unit: string;
}
export interface RoutingConfiguration {
    strategy: "performance" | "cost" | "geographic" | "balanced";
    failover: FailoverConfiguration;
    loadBalancing: LoadBalancingConfiguration;
}
export interface FailoverConfiguration {
    enabled: boolean;
    maxRetries: number;
    timeout: number;
    healthCheck: boolean;
}
export interface LoadBalancingConfiguration {
    algorithm: "round_robin" | "least_connections" | "weighted" | "geographic";
    weights: Record<string, number>;
    stickySession: boolean;
}
export interface SecurityConfiguration {
    authentication: AuthenticationConfig;
    authorization: AuthorizationConfig;
    encryption: EncryptionConfiguration;
    protection: ProtectionConfiguration;
}
export interface AuthenticationConfig {
    enabled: boolean;
    methods: AuthMethod[];
    tokenValidation: TokenValidationConfig;
}
export interface AuthMethod {
    type: "api_key" | "jwt" | "oauth" | "signature";
    enabled: boolean;
    configuration: any;
}
export interface TokenValidationConfig {
    endpoint?: string;
    cache: boolean;
    ttl: number;
}
export interface AuthorizationConfig {
    enabled: boolean;
    policies: AuthorizationPolicy[];
    defaultAction: "allow" | "deny";
}
export interface AuthorizationPolicy {
    name: string;
    rules: AuthorizationRule[];
    priority: number;
}
export interface AuthorizationRule {
    resource: string;
    action: string;
    principal: string;
    effect: "allow" | "deny";
    conditions?: any;
}
export interface EncryptionConfiguration {
    inTransit: boolean;
    atRest: boolean;
    algorithms: string[];
    keyManagement: KeyManagementConfig;
}
export interface KeyManagementConfig {
    provider: string;
    rotation: boolean;
    rotationInterval: number;
}
export interface ProtectionConfiguration {
    ddos: DDoSProtectionConfig;
    waf: WAFConfiguration;
    rateLimit: RateLimitConfig;
}
export interface DDoSProtectionConfig {
    enabled: boolean;
    threshold: number;
    mitigation: string[];
}
export interface WAFConfiguration {
    enabled: boolean;
    rules: WAFRule[];
    mode: "block" | "challenge" | "log";
}
export interface WAFRule {
    id: string;
    name: string;
    pattern: string;
    action: "block" | "challenge" | "allow";
    severity: string;
}
export interface RateLimitConfig {
    enabled: boolean;
    limits: RateLimit[];
    enforcement: "strict" | "soft";
}
export interface RateLimit {
    resource: string;
    limit: number;
    window: number;
    action: "block" | "throttle" | "queue";
}
export interface MonitoringConfiguration {
    metrics: MetricsConfiguration;
    alerts: AlertConfiguration;
    logging: LoggingConfiguration;
}
export interface MetricsConfiguration {
    enabled: boolean;
    collectors: MetricCollector[];
    retention: number;
}
export interface MetricCollector {
    name: string;
    type: string;
    interval: number;
    configuration: any;
}
export interface AlertConfiguration {
    enabled: boolean;
    rules: AlertRule[];
    channels: AlertChannel[];
}
export interface AlertRule {
    name: string;
    condition: string;
    threshold: number;
    severity: string;
    channels: string[];
}
export interface AlertChannel {
    name: string;
    type: string;
    configuration: any;
}
export interface LoggingConfiguration {
    enabled: boolean;
    level: "debug" | "info" | "warn" | "error";
    destinations: LogDestination[];
}
export interface LogDestination {
    type: string;
    configuration: any;
}
export declare class MediaCacheManager extends EventEmitter {
    private logger;
    private config;
    private nodes;
    private entries;
    private cdnConfig;
    private cacheEngine;
    private distributionEngine;
    private invalidationEngine;
    private analyticsEngine;
    private optimizationEngine;
    private securityManager;
    constructor(config: MediaCacheConfig);
    /**
     * Initializes the cache manager
     */
    initialize(): Promise<void>;
    /**
     * Gets cached content
     */
    get(request: CacheRequest): Promise<ServiceResponse<CacheResponse>>;
    /**
     * Stores content in cache
     */
    put(request: CacheRequest, content: CacheContent): Promise<ServiceResponse<void>>;
    /**
     * Deletes content from cache
     */
    delete(key: string): Promise<ServiceResponse<void>>;
    /**
     * Invalidates cache entries based on patterns or tags
     */
    invalidate(invalidation: CacheInvalidation): Promise<ServiceResponse<number>>;
    /**
     * Gets cache statistics
     */
    getStatistics(): Promise<ServiceResponse<CacheStatistics>>;
    /**
     * Lists cache nodes
     */
    listNodes(): Promise<ServiceResponse<CacheNode[]>>;
    /**
     * Gets performance metrics
     */
    getMetrics(): Promise<ServiceResponse<PerformanceMetrics>>;
    /**
     * Optimizes cache configuration
     */
    optimize(): Promise<ServiceResponse<OptimizationResult>>;
    private initializeComponents;
    private setupEventHandlers;
    private initializeCacheNodes;
    private selectOptimalNode;
    private calculateNodeScore;
    private createCacheEntry;
    private startMonitoring;
    private updateNodeHealth;
    private updateNodePerformance;
    private calculateHealthScore;
    private mapLayerType;
    private getDefaultLocation;
    private generateNodeId;
    private generateRequestId;
    private createErrorResponse;
    private handleCacheHit;
    private handleCacheMiss;
    private handleDistributionCompleted;
    private handleOptimizationCompleted;
}
interface OptimizationResult {
    improvements: CacheImprovement[];
    recommendations: CacheRecommendation[];
    impact: OptimizationImpact;
}
interface CacheImprovement {
    type: "hit_rate" | "latency" | "bandwidth" | "cost";
    description: string;
    before: number;
    after: number;
    improvement: number;
}
interface CacheRecommendation {
    title: string;
    description: string;
    priority: "low" | "medium" | "high";
    effort: "low" | "medium" | "high";
    impact: "low" | "medium" | "high";
}
interface OptimizationImpact {
    performance: number;
    cost: number;
    efficiency: number;
    reliability: number;
}
export {};
//# sourceMappingURL=media-cache-manager.d.ts.map