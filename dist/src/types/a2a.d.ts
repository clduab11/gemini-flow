/**
 * Agent-to-Agent (A2A) Protocol Type Definitions
 *
 * Comprehensive types for A2A communication based on JSON-RPC 2.0
 * with extensions for agent discovery, capability matching, and workflow coordination
 */
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
export interface A2AMessage extends JsonRpcRequest {
    from: AgentId;
    to: AgentId | AgentId[] | "broadcast";
    route?: MessageRoute;
    priority?: MessagePriority;
    signature?: string;
    timestamp: number;
    nonce?: string;
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
export type AgentId = string;
export interface AgentCard {
    id: AgentId;
    name: string;
    description: string;
    version: string;
    capabilities: AgentCapability[];
    services: AgentService[];
    endpoints: AgentEndpoint[];
    metadata: {
        type: AgentType;
        status: AgentStatus;
        load: number;
        created: number;
        lastSeen: number;
        metrics?: AgentMetrics;
        publicKey?: string;
        trustLevel?: TrustLevel;
    };
}
export interface AgentCapability {
    name: string;
    version: string;
    description: string;
    parameters?: CapabilityParameter[];
    resources?: ResourceRequirements;
    dependencies?: string[];
    conflicts?: string[];
}
export interface AgentService {
    name: string;
    method: string;
    description: string;
    params?: ServiceParameter[];
    returns?: ServiceReturn;
    cost?: number;
    latency?: number;
    reliability?: number;
}
export interface AgentEndpoint {
    protocol: TransportProtocol;
    address: string;
    port?: number;
    path?: string;
    secure?: boolean;
    maxConnections?: number;
    capabilities?: string[];
}
export type A2AMessageType = "request" | "response" | "notification" | "discovery" | "registration" | "heartbeat" | "capability_query" | "workflow_coordination" | "resource_negotiation" | "security_handshake";
export type MessagePriority = "low" | "normal" | "high" | "critical";
export interface MessageRoute {
    path: AgentId[];
    hops: number;
    maxHops?: number;
    strategy?: RoutingStrategy;
}
export type RoutingStrategy = "direct" | "shortest_path" | "load_balanced" | "capability_aware" | "cost_optimized";
export interface MessageContext {
    workflowId?: string;
    sessionId?: string;
    correlationId?: string;
    parentMessageId?: string;
    timeout?: number;
    retryPolicy?: RetryPolicy;
    maxCost?: number;
    preferredLatency?: number;
}
export type TransportProtocol = "websocket" | "http" | "grpc" | "tcp" | "ipc";
export interface TransportConfig {
    protocol: TransportProtocol;
    host?: string;
    port?: number;
    path?: string;
    secure?: boolean;
    timeout?: number;
    keepAlive?: boolean;
    compression?: boolean;
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
export type AgentType = "coordinator" | "researcher" | "coder" | "analyst" | "architect" | "tester" | "reviewer" | "optimizer" | "documenter" | "monitor" | "specialist" | "bridge" | "proxy";
export type AgentStatus = "initializing" | "idle" | "busy" | "overloaded" | "maintenance" | "offline" | "error";
export type TrustLevel = "untrusted" | "basic" | "verified" | "trusted" | "critical";
export interface AgentMetrics {
    responseTime: {
        avg: number;
        p50: number;
        p95: number;
        p99: number;
    };
    requestsPerSecond: number;
    messagesProcessed: number;
    cpuUsage: number;
    memoryUsage: number;
    networkUsage: number;
    successRate: number;
    errorRate: number;
    uptime: number;
}
export interface ResourceRequirements {
    cpu?: number;
    memory?: number;
    network?: number;
    storage?: number;
    gpu?: boolean;
    specialized?: string[];
}
export interface RetryPolicy {
    maxAttempts: number;
    backoffStrategy: "linear" | "exponential" | "fixed";
    baseDelay: number;
    maxDelay: number;
    jitter?: boolean;
}
export interface A2AError extends JsonRpcError {
    type: A2AErrorType;
    source: AgentId;
    context?: any;
    retryable?: boolean;
    troubleshooting?: string[];
}
export type A2AErrorType = "protocol_error" | "authentication_error" | "authorization_error" | "capability_not_found" | "agent_unavailable" | "resource_exhausted" | "timeout_error" | "routing_error" | "serialization_error" | "validation_error" | "internal_error";
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
        ttl?: number;
    };
}
export interface RegistrationResponse extends A2AResponse {
    result: {
        registered: boolean;
        agentId: AgentId;
        expiresAt: number;
    };
}
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
    timeout?: number;
    retries?: number;
    condition?: string;
    inputs?: WorkflowInput[];
    outputs?: WorkflowOutput[];
}
export interface WorkflowInput {
    name: string;
    type: string;
    required: boolean;
    source?: string;
}
export interface WorkflowOutput {
    name: string;
    type: string;
    destination?: string;
}
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
export interface ServiceParameter {
    name: string;
    type: "string" | "number" | "boolean" | "object" | "array";
    required: boolean;
    description?: string;
    schema?: any;
}
export interface ServiceReturn {
    type: "string" | "number" | "boolean" | "object" | "array" | "void";
    description?: string;
    schema?: any;
}
export interface CapabilityParameter {
    name: string;
    type: string;
    required: boolean;
    default?: any;
    description?: string;
}
export interface A2AProtocolConfig {
    agentId: AgentId;
    agentCard: AgentCard;
    topology?: "hierarchical" | "mesh" | "ring" | "star";
    transports: TransportConfig[];
    defaultTransport: TransportProtocol;
    routingStrategy: RoutingStrategy;
    maxHops: number;
    discoveryEnabled: boolean;
    discoveryInterval: number;
    securityEnabled: boolean;
    trustedAgents?: AgentId[];
    messageTimeout: number;
    maxConcurrentMessages: number;
    retryPolicy: RetryPolicy;
}
//# sourceMappingURL=a2a.d.ts.map