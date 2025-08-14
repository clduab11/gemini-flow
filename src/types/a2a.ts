/**
 * Agent-to-Agent (A2A) Protocol Type Definitions
 *
 * Comprehensive types for A2A communication based on JSON-RPC 2.0
 * with extensions for agent discovery, capability matching, and workflow coordination
 */

// JSON-RPC 2.0 Base Types
export interface JsonRpcRequest {
  jsonrpc: "2.0";
  method: string;
  params?: object | any[];
  id?: string | number | null;
}

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  result?: any;
  error?: JsonRpcError;
  id: string | number | null;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: any;
}

export interface JsonRpcNotification {
  jsonrpc: "2.0";
  method: string;
  params?: object | any[];
}

// A2A Protocol Extensions
export interface A2AMessage extends JsonRpcRequest {
  // Agent identification
  from: AgentId;
  to: AgentId | AgentId[] | "broadcast";

  // Message routing
  route?: MessageRoute;
  priority?: MessagePriority;

  // Security and authentication
  signature?: string;
  timestamp: number;
  nonce?: string;

  // Message metadata
  messageType: A2AMessageType;
  capabilities?: AgentCapability[];
  context?: MessageContext;
}

export interface A2AResponse extends JsonRpcResponse {
  from: AgentId;
  to: AgentId;
  timestamp: number;
  messageType: "response";
}

export interface A2ANotification extends JsonRpcNotification {
  from: AgentId;
  to: AgentId | AgentId[] | "broadcast";
  timestamp: number;
  messageType: "notification";
}

// Agent Types
export type AgentId = string;

export interface AgentCard {
  id: AgentId;
  name: string;
  description: string;
  version: string;

  // Capabilities and services
  capabilities: AgentCapability[];
  services: AgentService[];

  // Communication endpoints
  endpoints: AgentEndpoint[];

  // Metadata
  metadata: {
    type: AgentType;
    status: AgentStatus;
    load: number; // 0-1 scale
    created: number;
    lastSeen: number;

    // Performance metrics
    metrics?: AgentMetrics;

    // Security credentials
    publicKey?: string;
    trustLevel?: TrustLevel;
  };
}

export interface AgentCapability {
  name: string;
  version: string;
  description: string;
  parameters?: CapabilityParameter[];

  // Resource requirements
  resources?: ResourceRequirements;

  // Compatibility
  dependencies?: string[];
  conflicts?: string[];
}

export interface AgentService {
  name: string;
  method: string;
  description: string;

  // JSON-RPC schema
  params?: ServiceParameter[];
  returns?: ServiceReturn;

  // Service metadata
  cost?: number; // Resource cost estimate
  latency?: number; // Expected latency in ms
  reliability?: number; // 0-1 reliability score
}

export interface AgentEndpoint {
  protocol: TransportProtocol;
  address: string;
  port?: number;
  path?: string;
  secure?: boolean;

  // Connection metadata
  maxConnections?: number;
  capabilities?: string[];
}

// Message Types and Routing
export type A2AMessageType =
  | "request"
  | "response"
  | "notification"
  | "discovery"
  | "registration"
  | "heartbeat"
  | "capability_query"
  | "workflow_coordination"
  | "resource_negotiation"
  | "security_handshake";

export type MessagePriority = "low" | "normal" | "high" | "critical";

export interface MessageRoute {
  path: AgentId[];
  hops: number;
  maxHops?: number;
  strategy?: RoutingStrategy;
}

export type RoutingStrategy =
  | "direct"
  | "shortest_path"
  | "load_balanced"
  | "capability_aware"
  | "cost_optimized";

export interface MessageContext {
  workflowId?: string;
  sessionId?: string;
  correlationId?: string;
  parentMessageId?: string;

  // Execution context
  timeout?: number;
  retryPolicy?: RetryPolicy;

  // Resource constraints
  maxCost?: number;
  preferredLatency?: number;
}

// Transport Layer Types
export type TransportProtocol = "websocket" | "http" | "grpc" | "tcp" | "ipc";

export interface TransportConfig {
  protocol: TransportProtocol;
  host?: string;
  port?: number;
  path?: string;
  secure?: boolean;

  // Connection options
  timeout?: number;
  keepAlive?: boolean;
  compression?: boolean;

  // Security options
  tls?: TLSConfig;
  auth?: AuthConfig;
}

export interface TLSConfig {
  cert?: string;
  key?: string;
  ca?: string;
  rejectUnauthorized?: boolean;
}

export interface AuthConfig {
  type: "none" | "token" | "certificate" | "oauth2";
  credentials?: any;
}

// Agent Classification
export type AgentType =
  | "coordinator"
  | "researcher"
  | "coder"
  | "analyst"
  | "architect"
  | "tester"
  | "reviewer"
  | "optimizer"
  | "documenter"
  | "monitor"
  | "specialist"
  | "bridge"
  | "proxy";

export type AgentStatus =
  | "initializing"
  | "idle"
  | "busy"
  | "overloaded"
  | "maintenance"
  | "offline"
  | "error";

export type TrustLevel =
  | "untrusted"
  | "basic"
  | "verified"
  | "trusted"
  | "critical";

// Performance and Resources
export interface AgentMetrics {
  // Performance metrics
  responseTime: {
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  };

  // Throughput metrics
  requestsPerSecond: number;
  messagesProcessed: number;

  // Resource usage
  cpuUsage: number; // 0-1 scale
  memoryUsage: number; // 0-1 scale
  networkUsage: number; // bytes/sec

  // Reliability metrics
  successRate: number; // 0-1 scale
  errorRate: number; // 0-1 scale
  uptime: number; // percentage
}

export interface ResourceRequirements {
  cpu?: number; // CPU cores required
  memory?: number; // Memory in MB
  network?: number; // Network bandwidth in Mbps
  storage?: number; // Storage in MB

  // Special requirements
  gpu?: boolean;
  specialized?: string[];
}

// Error Handling and Retry
export interface RetryPolicy {
  maxAttempts: number;
  backoffStrategy: "linear" | "exponential" | "fixed";
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  jitter?: boolean;
}

export interface A2AError extends JsonRpcError {
  // Extended error information
  type: A2AErrorType;
  source: AgentId;
  context?: any;
  retryable?: boolean;
  troubleshooting?: string[];
}

export type A2AErrorType =
  | "protocol_error"
  | "authentication_error"
  | "authorization_error"
  | "capability_not_found"
  | "agent_unavailable"
  | "resource_exhausted"
  | "timeout_error"
  | "routing_error"
  | "serialization_error"
  | "validation_error"
  | "internal_error";

// Discovery and Registration
export interface DiscoveryRequest extends A2AMessage {
  method: "agent.discover";
  params: {
    capabilities?: string[];
    agentType?: AgentType;
    maxDistance?: number;
    filters?: DiscoveryFilter[];
  };
}

export interface DiscoveryResponse extends A2AResponse {
  result: {
    agents: AgentCard[];
    totalFound: number;
    searchTime: number;
  };
}

export interface DiscoveryFilter {
  field: string;
  operator: "eq" | "ne" | "gt" | "lt" | "gte" | "lte" | "in" | "contains";
  value: any;
}

export interface RegistrationRequest extends A2AMessage {
  method: "agent.register";
  params: {
    agentCard: AgentCard;
    ttl?: number; // Time to live in seconds
  };
}

export interface RegistrationResponse extends A2AResponse {
  result: {
    registered: boolean;
    agentId: AgentId;
    expiresAt: number;
  };
}

// Workflow Coordination
export interface WorkflowCoordinationRequest extends A2AMessage {
  method: "workflow.coordinate";
  params: {
    workflowId: string;
    step: WorkflowStep;
    dependencies?: string[];
    data?: any;
  };
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: "sequential" | "parallel" | "conditional" | "loop";
  capabilities: string[];

  // Execution parameters
  timeout?: number;
  retries?: number;
  condition?: string; // For conditional steps

  // Data flow
  inputs?: WorkflowInput[];
  outputs?: WorkflowOutput[];
}

export interface WorkflowInput {
  name: string;
  type: string;
  required: boolean;
  source?: string; // Source step id
}

export interface WorkflowOutput {
  name: string;
  type: string;
  destination?: string; // Destination step id
}

// MCP Bridge Types
export interface MCPToA2AMapping {
  mcpMethod: string;
  a2aMethod: string;
  parameterMapping: ParameterMapping[];
  responseMapping: ResponseMapping[];
}

export interface ParameterMapping {
  mcpParam: string;
  a2aParam: string;
  transform?: TransformFunction;
}

export interface ResponseMapping {
  mcpField: string;
  a2aField: string;
  transform?: TransformFunction;
}

export type TransformFunction = (value: any, context?: any) => any;

// Service Parameter Types
export interface ServiceParameter {
  name: string;
  type: "string" | "number" | "boolean" | "object" | "array";
  required: boolean;
  description?: string;
  schema?: any; // JSON Schema
}

export interface ServiceReturn {
  type: "string" | "number" | "boolean" | "object" | "array" | "void";
  description?: string;
  schema?: any; // JSON Schema
}

export interface CapabilityParameter {
  name: string;
  type: string;
  required: boolean;
  default?: any;
  description?: string;
}

// Protocol Manager Configuration
export interface A2AProtocolConfig {
  // Agent identification
  agentId: AgentId;
  agentCard: AgentCard;

  // Topology configuration
  topology?: "hierarchical" | "mesh" | "ring" | "star";

  // Transport configuration
  transports: TransportConfig[];
  defaultTransport: TransportProtocol;

  // Routing configuration
  routingStrategy: RoutingStrategy;
  maxHops: number;

  // Discovery configuration
  discoveryEnabled: boolean;
  discoveryInterval: number; // milliseconds

  // Security configuration
  securityEnabled: boolean;
  trustedAgents?: AgentId[];

  // Performance configuration
  messageTimeout: number;
  maxConcurrentMessages: number;
  retryPolicy: RetryPolicy;
}
