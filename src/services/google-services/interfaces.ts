/**
 * Comprehensive TypeScript Interfaces for Google Services Integration
 *
 * Defines all service contracts, data structures, and type safety for
 * the complete Google Services ecosystem integration.
 */

import { EventEmitter } from "events";

// ==================== Base Interfaces ====================

export interface ServiceConfig {
  apiKey: string;
  projectId: string;
  region?: string;
  maxRetries?: number;
  timeout?: number;
  authentication: AuthenticationConfig;
}

export interface AuthenticationConfig {
  type: "oauth2" | "service_account" | "api_key";
  credentials?: any;
  scopes?: string[];
  refreshTokens?: boolean;
}

export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ServiceError;
  metadata: ResponseMetadata;
}

export interface ServiceError {
  code: string;
  message: string;
  details?: any;
  retryable: boolean;
  timestamp: Date;
}

export interface ResponseMetadata {
  requestId: string;
  timestamp: Date;
  processingTime: number;
  region: string;
  quotaUsed?: number;
  rateLimitRemaining?: number;
}

// ==================== Streaming API Interfaces ====================

export interface StreamingConfig {
  bufferSize: number;
  chunkSize: number;
  timeout: number;
  compression: boolean;
  protocol: "websocket" | "sse" | "grpc";
}

export interface StreamChunk<T = any> {
  id: string;
  sequence: number;
  data: T;
  final: boolean;
  metadata?: ChunkMetadata;
}

export interface ChunkMetadata {
  timestamp: Date;
  size: number;
  compression?: string;
  checksum?: string;
}

export interface StreamingAPI {
  connect(config: StreamingConfig): Promise<void>;
  stream<T>(request: any): AsyncGenerator<StreamChunk<T>>;
  disconnect(): Promise<void>;
  getStatus(): StreamStatus;
}

export interface StreamStatus {
  connected: boolean;
  bufferUtilization: number;
  throughput: number;
  latency: number;
  errors: number;
}

// ==================== Agent Space Interfaces ====================

export interface AgentEnvironment {
  id: string;
  name: string;
  type: "development" | "testing" | "production" | "sandbox";
  resources: ResourceAllocation;
  isolation: IsolationConfig;
  networking: NetworkConfig;
  storage: StorageConfig;
}

export interface ResourceAllocation {
  cpu: number; // vCPUs
  memory: number; // MB
  storage: number; // GB
  gpu?: GPUAllocation;
  networking: NetworkAllocation;
}

export interface GPUAllocation {
  type: string;
  memory: number;
  count: number;
  sharedAccess: boolean;
}

export interface NetworkAllocation {
  bandwidth: number; // Mbps
  connections: number;
  ports: number[];
}

export interface IsolationConfig {
  level: "process" | "container" | "vm" | "namespace";
  restrictions: string[];
  allowedServices: string[];
  security: SecurityConfig;
}

export interface SecurityConfig {
  encryption: boolean;
  authentication: boolean;
  authorization: boolean;
  auditing: boolean;
  policies: SecurityPolicy[];
}

export interface SecurityPolicy {
  name: string;
  rules: SecurityRule[];
  enforcement: "strict" | "permissive" | "audit";
}

export interface SecurityRule {
  resource: string;
  action: string;
  principal: string;
  effect: "allow" | "deny";
  conditions?: any;
}

export interface NetworkConfig {
  vpc: string;
  subnet: string;
  firewall: FirewallRule[];
  loadBalancing: boolean;
}

export interface FirewallRule {
  name: string;
  direction: "ingress" | "egress";
  protocol: string;
  ports: number[];
  sources: string[];
  targets: string[];
}

export interface StorageConfig {
  type: "local" | "network" | "cloud";
  size: number;
  encryption: boolean;
  backup: BackupConfig;
}

export interface BackupConfig {
  enabled: boolean;
  frequency: string;
  retention: number;
  location: string;
}

// ==================== Mariner Automation Interfaces ====================

export interface BrowserOrchestrationConfig {
  headless: boolean;
  viewport: ViewportConfig;
  performance: PerformanceConfig;
  security: BrowserSecurityConfig;
  extensions: BrowserExtension[];
}

export interface ViewportConfig {
  width: number;
  height: number;
  deviceScaleFactor: number;
  isMobile: boolean;
  hasTouch: boolean;
}

export interface PerformanceConfig {
  javascript: boolean;
  images: boolean;
  css: boolean;
  fonts: boolean;
  networkThrottling?: NetworkThrottling;
}

export interface NetworkThrottling {
  offline: boolean;
  downloadThroughput: number;
  uploadThroughput: number;
  latency: number;
}

export interface BrowserSecurityConfig {
  allowInsecureContent: boolean;
  ignoreHTTPSErrors: boolean;
  bypassCSP: boolean;
  permissions: BrowserPermission[];
}

export interface BrowserPermission {
  name: string;
  state: "granted" | "denied" | "prompt";
}

export interface BrowserExtension {
  id: string;
  path: string;
  enabled: boolean;
}

export interface AutomationTask {
  id: string;
  name: string;
  steps: AutomationStep[];
  conditions: TaskCondition[];
  timeout: number;
  retryPolicy: RetryPolicy;
}

export interface AutomationStep {
  type: "navigate" | "click" | "type" | "wait" | "extract" | "script";
  selector?: string;
  value?: any;
  timeout?: number;
  optional?: boolean;
}

export interface TaskCondition {
  type: "element_present" | "element_visible" | "text_contains" | "url_matches";
  selector?: string;
  value?: string;
  negated?: boolean;
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffStrategy: "fixed" | "exponential" | "linear";
  baseDelay: number;
  maxDelay: number;
}

// ==================== Video Generation Interfaces ====================

export interface VideoGenerationRequest {
  prompt: string;
  style: VideoStyle;
  resolution: VideoResolution;
  duration: number; // seconds
  frameRate: number;
  format: VideoFormat;
  quality: VideoQuality;
  effects: VideoEffect[];
}

export interface VideoStyle {
  type: "realistic" | "animated" | "artistic" | "cinematic" | "documentary";
  mood: string;
  colorPalette: string[];
  lighting: LightingConfig;
  camera: CameraConfig;
}

export interface LightingConfig {
  type: "natural" | "studio" | "dramatic" | "soft" | "harsh";
  intensity: number;
  direction: string;
  color: string;
}

export interface CameraConfig {
  angle: string;
  movement: CameraMovement;
  focus: FocusConfig;
  depth: DepthConfig;
}

export interface CameraMovement {
  type: "static" | "pan" | "tilt" | "zoom" | "dolly" | "tracking";
  speed: number;
  smoothness: number;
}

export interface FocusConfig {
  type: "auto" | "manual" | "tracking";
  target?: string;
  depth: number;
}

export interface DepthConfig {
  enabled: boolean;
  range: [number, number];
  falloff: number;
}

export interface VideoResolution {
  width: number;
  height: number;
  aspectRatio: string;
}

export interface VideoFormat {
  container: "mp4" | "webm" | "avi" | "mov";
  codec: "h264" | "h265" | "vp9" | "av1";
  bitrate: number;
}

export interface VideoQuality {
  preset: "draft" | "preview" | "standard" | "high" | "ultra";
  customSettings?: QualitySettings;
}

export interface QualitySettings {
  renderSamples: number;
  denoising: boolean;
  motionBlur: boolean;
  antiAliasing: boolean;
}

export interface VideoEffect {
  type: string;
  parameters: any;
  timing: EffectTiming;
}

export interface EffectTiming {
  start: number; // seconds
  duration: number; // seconds
  easing: string;
}

export interface RenderingPipeline {
  stages: RenderStage[];
  parallelization: number;
  optimization: RenderOptimization;
  output: OutputConfig;
}

export interface RenderStage {
  name: string;
  type: "preprocessing" | "generation" | "postprocessing" | "encoding";
  processor: string;
  parameters: any;
  dependencies: string[];
}

export interface RenderOptimization {
  gpu: boolean;
  multicore: boolean;
  memory: MemoryOptimization;
  caching: CacheConfig;
}

export interface MemoryOptimization {
  tiling: boolean;
  streaming: boolean;
  compression: boolean;
  maxUsage: number; // MB
}

export interface CacheConfig {
  enabled: boolean;
  size: number; // MB
  strategy: "lru" | "lfu" | "ttl";
  persistence: boolean;
}

export interface OutputConfig {
  location: string;
  format: VideoFormat;
  metadata: MetadataConfig;
  delivery: DeliveryConfig;
}

export interface MetadataConfig {
  title?: string;
  description?: string;
  tags?: string[];
  timestamp?: boolean;
  watermark?: WatermarkConfig;
}

export interface WatermarkConfig {
  enabled: boolean;
  text?: string;
  image?: string;
  position: string;
  opacity: number;
}

export interface DeliveryConfig {
  method: "download" | "streaming" | "cdn";
  compression: boolean;
  encryption: boolean;
}

// ==================== Research and Audio Interfaces ====================

export interface ResearchHypothesis {
  id: string;
  statement: string;
  variables: ResearchVariable[];
  methodology: ResearchMethodology;
  predictions: Prediction[];
  significance: number;
}

export interface ResearchVariable {
  name: string;
  type: "independent" | "dependent" | "control" | "confounding";
  dataType: "numerical" | "categorical" | "ordinal" | "binary";
  measurement: MeasurementConfig;
}

export interface MeasurementConfig {
  unit?: string;
  scale?: [number, number];
  precision?: number;
  method?: string;
}

export interface ResearchMethodology {
  design: "experimental" | "observational" | "correlational" | "meta-analysis";
  sampling: SamplingConfig;
  analysis: AnalysisConfig;
  validation: ValidationConfig;
}

export interface SamplingConfig {
  method: "random" | "stratified" | "cluster" | "convenience";
  size: number;
  criteria: SelectionCriteria;
}

export interface SelectionCriteria {
  inclusion: string[];
  exclusion: string[];
  demographics?: DemographicCriteria;
}

export interface DemographicCriteria {
  age?: [number, number];
  gender?: string[];
  location?: string[];
  other?: Record<string, any>;
}

export interface AnalysisConfig {
  statistical: StatisticalMethod[];
  significance: number;
  power: number;
  corrections: string[];
}

export interface StatisticalMethod {
  name: string;
  type: "parametric" | "nonparametric" | "bayesian";
  assumptions: string[];
  parameters: any;
}

export interface ValidationConfig {
  crossValidation: boolean;
  holdoutSet: number; // percentage
  reproducibility: ReproducibilityConfig;
}

export interface ReproducibilityConfig {
  seed: number;
  environment: string;
  dependencies: string[];
  documentation: boolean;
}

export interface Prediction {
  variable: string;
  direction: "increase" | "decrease" | "no_change";
  magnitude?: number;
  confidence: number;
}

// ==================== Audio Processing Interfaces ====================

export interface AudioConfig {
  sampleRate: number;
  bitDepth: number;
  channels: number;
  format: AudioFormat;
  compression: CompressionConfig;
}

export interface AudioFormat {
  container: "wav" | "mp3" | "flac" | "aac" | "ogg";
  codec?: string;
  bitrate?: number;
}

export interface CompressionConfig {
  enabled: boolean;
  algorithm: "lossless" | "lossy";
  quality: number; // 0-100
}

export interface RealTimeStreamingConfig {
  latency: number; // ms
  bufferSize: number;
  protocol: "websocket" | "webrtc" | "udp";
  encoding: AudioEncoding;
}

export interface AudioEncoding {
  codec: string;
  bitrate: number;
  quality: "low" | "medium" | "high" | "lossless";
}

export interface AudioProcessingPipeline {
  stages: AudioProcessingStage[];
  realTime: boolean;
  optimization: AudioOptimization;
}

export interface AudioProcessingStage {
  name: string;
  type: "filter" | "effect" | "analysis" | "synthesis";
  processor: string;
  parameters: any;
  enabled: boolean;
}

export interface AudioOptimization {
  simd: boolean;
  threading: boolean;
  gpu: boolean;
  caching: boolean;
}

export interface MusicCompositionConfig {
  style: MusicStyle;
  structure: MusicStructure;
  instruments: InstrumentConfig[];
  tempo: TempoConfig;
  key: KeySignature;
  timeSignature: TimeSignature;
}

export interface MusicStyle {
  genre: string;
  subgenre?: string;
  influences: string[];
  characteristics: string[];
}

export interface MusicStructure {
  sections: MusicSection[];
  transitions: Transition[];
  dynamics: DynamicsConfig;
}

export interface MusicSection {
  name: string;
  type: "intro" | "verse" | "chorus" | "bridge" | "outro" | "instrumental";
  duration: number; // measures
  key?: KeySignature;
  tempo?: number;
}

export interface Transition {
  from: string;
  to: string;
  type: "fade" | "cut" | "crossfade" | "bridge";
  duration: number; // measures
}

export interface DynamicsConfig {
  overall: string; // pp, p, mp, mf, f, ff
  variation: boolean;
  crescendos: CrescendoConfig[];
}

export interface CrescendoConfig {
  start: number; // measure
  duration: number; // measures
  fromLevel: string;
  toLevel: string;
}

export interface InstrumentConfig {
  id: string;
  type: "melodic" | "harmonic" | "rhythmic" | "bass";
  midiProgram: number;
  channel: number;
  volume: number;
  pan: number;
  effects: AudioEffect[];
}

export interface AudioEffect {
  type: string;
  parameters: any;
  enabled: boolean;
  order: number;
}

export interface TempoConfig {
  bpm: number;
  variations: TempoChange[];
  swing?: number;
}

export interface TempoChange {
  measure: number;
  bpm: number;
  transition: "immediate" | "gradual";
  duration?: number; // measures for gradual
}

export interface KeySignature {
  tonic: string; // C, D, E, F, G, A, B
  mode:
    | "major"
    | "minor"
    | "dorian"
    | "mixolydian"
    | "lydian"
    | "phrygian"
    | "locrian";
  accidentals: string[];
}

export interface TimeSignature {
  numerator: number;
  denominator: number;
}

export interface MIDIConfig {
  channels: number;
  resolution: number; // ticks per quarter note
  format: 0 | 1 | 2;
  tempo: number;
  tracks: MIDITrack[];
}

export interface MIDITrack {
  name: string;
  channel: number;
  instrument: number;
  events: MIDIEvent[];
}

export interface MIDIEvent {
  type:
    | "note_on"
    | "note_off"
    | "control_change"
    | "program_change"
    | "pitch_bend";
  timestamp: number; // ticks
  data: any;
}

// ==================== Storage and Caching Interfaces ====================

export interface MultimediaStorageConfig {
  provider: "local" | "gcs" | "s3" | "azure" | "hybrid";
  buckets: BucketConfig[];
  replication: ReplicationConfig;
  lifecycle: LifecycleConfig;
}

export interface BucketConfig {
  name: string;
  region: string;
  storageClass: string;
  encryption: EncryptionConfig;
  versioning: boolean;
}

export interface EncryptionConfig {
  enabled: boolean;
  keyType: "customer" | "google" | "hybrid";
  keyId?: string;
}

export interface ReplicationConfig {
  enabled: boolean;
  regions: string[];
  consistency: "eventual" | "strong";
}

export interface LifecycleConfig {
  rules: LifecycleRule[];
  enabled: boolean;
}

export interface LifecycleRule {
  name: string;
  condition: LifecycleCondition;
  action: LifecycleAction;
}

export interface LifecycleCondition {
  age?: number; // days
  createdBefore?: Date;
  matchesStorageClass?: string[];
  numNewerVersions?: number;
}

export interface LifecycleAction {
  type: "delete" | "set_storage_class" | "abort_incomplete_multipart_upload";
  storageClass?: string;
}

export interface MediaCacheConfig {
  layers: CacheLayer[];
  strategy: CacheStrategy;
  cdn: CDNConfig;
  invalidation: InvalidationConfig;
}

export interface CacheLayer {
  name: string;
  type: "memory" | "disk" | "distributed" | "cdn";
  size: number; // MB
  ttl: number; // seconds
  eviction: EvictionPolicy;
}

export interface EvictionPolicy {
  algorithm: "lru" | "lfu" | "ttl" | "random" | "custom";
  parameters?: any;
}

export interface CacheStrategy {
  writePolicy: "write_through" | "write_back" | "write_around";
  readPolicy: "cache_aside" | "read_through";
  consistency: "strong" | "eventual" | "weak";
}

export interface CDNConfig {
  provider: string;
  regions: string[];
  cacheBehaviors: CacheBehavior[];
  customHeaders: Record<string, string>;
}

export interface CacheBehavior {
  pathPattern: string;
  ttl: number;
  headers: string[];
  queryStrings: boolean;
  compression: boolean;
}

export interface InvalidationConfig {
  automatic: boolean;
  patterns: string[];
  maxAge: number; // seconds
}

// ==================== Resource Coordination Interfaces ====================

export interface ResourceCoordinatorConfig {
  scheduler: SchedulerConfig;
  monitoring: MonitoringConfig;
  optimization: OptimizationConfig;
  quotas: QuotaConfig;
}

export interface SchedulerConfig {
  algorithm: "round_robin" | "priority" | "fair_share" | "bin_packing";
  preemption: boolean;
  affinity: AffinityConfig;
  constraints: ConstraintConfig;
}

export interface AffinityConfig {
  nodeAffinity?: NodeAffinity;
  podAffinity?: PodAffinity;
  antiAffinity?: AntiAffinityConfig;
}

export interface NodeAffinity {
  required?: NodeSelector[];
  preferred?: PreferredNode[];
}

export interface NodeSelector {
  matchExpressions: MatchExpression[];
}

export interface MatchExpression {
  key: string;
  operator: "In" | "NotIn" | "Exists" | "DoesNotExist" | "Gt" | "Lt";
  values?: string[];
}

export interface PreferredNode {
  weight: number;
  preference: NodeSelector;
}

export interface PodAffinity {
  required?: PodAffinityTerm[];
  preferred?: WeightedPodAffinityTerm[];
}

export interface PodAffinityTerm {
  labelSelector: LabelSelector;
  topologyKey: string;
  namespaces?: string[];
}

export interface WeightedPodAffinityTerm {
  weight: number;
  podAffinityTerm: PodAffinityTerm;
}

export interface LabelSelector {
  matchLabels?: Record<string, string>;
  matchExpressions?: MatchExpression[];
}

export interface AntiAffinityConfig {
  enabled: boolean;
  scope: "node" | "zone" | "region";
  rules: AntiAffinityRule[];
}

export interface AntiAffinityRule {
  selector: LabelSelector;
  weight: number;
  required: boolean;
}

export interface ConstraintConfig {
  resources: ResourceConstraint[];
  placement: PlacementConstraint[];
  timing: TimingConstraint[];
}

export interface ResourceConstraint {
  type: "cpu" | "memory" | "gpu" | "storage" | "network";
  min?: number;
  max?: number;
  preferred?: number;
  priority: number;
}

export interface PlacementConstraint {
  type: "zone" | "region" | "node" | "rack";
  values: string[];
  required: boolean;
}

export interface TimingConstraint {
  type: "deadline" | "earliest_start" | "latest_finish";
  timestamp: Date;
  priority: number;
}

export interface QuotaConfig {
  enabled: boolean;
  limits: ResourceLimit[];
  enforcement: "strict" | "soft" | "advisory";
}

export interface ResourceLimit {
  resource: string;
  limit: number;
  period: string; // e.g., "1h", "1d", "1w"
  scope: "user" | "project" | "organization";
}

// ==================== A2A Protocol Extensions ====================

export interface A2AMultimediaMessage {
  id: string;
  type: "video" | "audio" | "image" | "document" | "mixed";
  content: MultimediaContent;
  metadata: A2AMessageMetadata;
  routing: A2ARoutingInfo;
  security: A2ASecurityInfo;
}

export interface MultimediaContent {
  data: any; // Base64, Buffer, or stream reference
  format: string;
  size: number;
  checksum: string;
  compression?: CompressionInfo;
  encryption?: EncryptionInfo;
}

export interface CompressionInfo {
  algorithm: string;
  ratio: number;
  originalSize: number;
}

export interface EncryptionInfo {
  algorithm: string;
  keyId: string;
  iv?: string;
}

export interface A2AMessageMetadata {
  timestamp: Date;
  sender: string;
  recipients: string[];
  priority: number;
  ttl: number; // seconds
  correlation?: string;
}

export interface A2ARoutingInfo {
  path: string[];
  hops: number;
  latency: number;
  bandwidth: number;
  protocol: string;
}

export interface A2ASecurityInfo {
  signature: string;
  certificate: string;
  trustLevel: number;
  permissions: string[];
}

// ==================== Monitoring and Observability ====================

export interface MonitoringConfig {
  metrics: MetricsConfig;
  logging: LoggingConfig;
  tracing: TracingConfig;
  alerting: AlertingConfig;
}

export interface MetricsConfig {
  enabled: boolean;
  collectors: MetricCollector[];
  storage: MetricStorage;
  retention: RetentionPolicy;
}

export interface MetricCollector {
  name: string;
  type: "counter" | "gauge" | "histogram" | "summary";
  labels: string[];
  interval: number; // seconds
}

export interface MetricStorage {
  backend: "prometheus" | "influxdb" | "cloudwatch" | "stackdriver";
  endpoint: string;
  credentials: any;
}

export interface RetentionPolicy {
  period: string; // e.g., "30d", "1y"
  compression: boolean;
  aggregation: AggregationRule[];
}

export interface AggregationRule {
  interval: string;
  function: "avg" | "sum" | "max" | "min" | "count";
  retention: string;
}

export interface LoggingConfig {
  level: "debug" | "info" | "warn" | "error";
  format: "json" | "text" | "structured";
  outputs: LogOutput[];
  sampling: SamplingConfig;
}

export interface LogOutput {
  type: "console" | "file" | "remote" | "stream";
  configuration: any;
}

export interface SamplingConfig {
  enabled: boolean;
  rate: number; // 0-1
  strategy: "random" | "head" | "tail" | "priority";
}

export interface TracingConfig {
  enabled: boolean;
  sampler: TracingSampler;
  exporter: TraceExporter;
  instrumentation: InstrumentationConfig;
}

export interface TracingSampler {
  type: "always" | "never" | "ratio" | "rate_limit";
  parameters: any;
}

export interface TraceExporter {
  type: "jaeger" | "zipkin" | "otlp" | "stdout";
  endpoint: string;
  credentials?: any;
}

export interface InstrumentationConfig {
  http: boolean;
  database: boolean;
  rpc: boolean;
  custom: CustomInstrumentation[];
}

export interface CustomInstrumentation {
  name: string;
  type: string;
  configuration: any;
}

export interface AlertingConfig {
  enabled: boolean;
  rules: AlertRule[];
  channels: AlertChannel[];
  escalation: EscalationPolicy;
}

export interface AlertRule {
  name: string;
  condition: AlertCondition;
  severity: "low" | "medium" | "high" | "critical";
  channels: string[];
  throttle?: ThrottleConfig;
}

export interface AlertCondition {
  metric: string;
  operator: ">" | "<" | "==" | "!=" | ">=" | "<=";
  threshold: number;
  duration: string; // e.g., "5m", "1h"
}

export interface ThrottleConfig {
  enabled: boolean;
  period: string;
  maxAlerts: number;
}

export interface AlertChannel {
  name: string;
  type: "email" | "slack" | "webhook" | "sms" | "pagerduty";
  configuration: any;
}

export interface EscalationPolicy {
  levels: EscalationLevel[];
  timeout: string;
}

export interface EscalationLevel {
  delay: string;
  channels: string[];
  conditions?: string[];
}

// ==================== Performance and Quality Interfaces ====================

export interface PerformanceMetrics {
  latency: LatencyMetrics;
  throughput: ThroughputMetrics;
  utilization: UtilizationMetrics;
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
  requestsPerSecond: number;
  bytesPerSecond: number;
  operationsPerSecond: number;
}

export interface UtilizationMetrics {
  cpu: number; // percentage
  memory: number; // percentage
  disk: number; // percentage
  network: number; // percentage
  gpu?: number; // percentage
}

export interface ErrorMetrics {
  rate: number; // errors per second
  percentage: number; // error percentage
  types: Record<string, number>;
}

export interface QualityMetrics {
  availability: number; // percentage
  reliability: number; // MTBF
  performance: PerformanceScore;
  security: SecurityScore;
}

export interface PerformanceScore {
  overall: number; // 0-100
  components: Record<string, number>;
  benchmarks: BenchmarkResult[];
}

export interface SecurityScore {
  overall: number; // 0-100
  vulnerabilities: VulnerabilityCount;
  compliance: ComplianceScore;
}

export interface VulnerabilityCount {
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface ComplianceScore {
  framework: string;
  score: number; // 0-100
  controls: ControlStatus[];
}

export interface ControlStatus {
  id: string;
  name: string;
  status: "compliant" | "non_compliant" | "not_applicable";
  evidence?: string;
}

export interface BenchmarkResult {
  name: string;
  score: number;
  unit: string;
  timestamp: Date;
  environment: string;
}
