/**
 * A2A (Agent-to-Agent) Protocol Types
 * Based on Google's A2A specification: https://github.com/a2aproject/A2A
 */

/**
 * Agent Card - Discovery and capability advertisement
 */
export interface AgentCard {
  id: string;
  name: string;
  description: string;
  version: string;
  capabilities: Capability[];
  endpoints: AgentEndpoint[];
  authentication?: AuthenticationScheme;
  metadata?: Record<string, any>;
}

/**
 * Agent Capability
 */
export interface Capability {
  id: string;
  name: string;
  description: string;
  inputSchema: JSONSchema;
  outputSchema: JSONSchema;
  protocols: string[]; // e.g., ["A2A/1.0", "AP2/1.0"]
  constraints?: {
    rateLimit?: number;
    maxTokens?: number;
    requiresPayment?: boolean;
  };
}

/**
 * Agent Endpoint
 */
export interface AgentEndpoint {
  url: string;
  protocol: 'http' | 'https' | 'ws' | 'wss';
  transport: 'json-rpc' | 'rest' | 'grpc';
  authentication?: string[];
}

/**
 * JSON Schema (simplified)
 */
export interface JSONSchema {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  additionalProperties?: boolean;
}

/**
 * Authentication Scheme
 */
export interface AuthenticationScheme {
  type: 'bearer' | 'api-key' | 'oauth2' | 'mutual-tls';
  scheme?: string;
  bearerFormat?: string;
}

/**
 * A2A Message (JSON-RPC 2.0)
 */
export interface A2AMessage {
  jsonrpc: '2.0';
  id?: string | number;
  method?: string;
  params?: any;
  result?: any;
  error?: A2AError;
}

/**
 * A2A Request
 */
export interface A2ARequest extends A2AMessage {
  method: string;
  params: any;
}

/**
 * A2A Response
 */
export interface A2AResponse extends A2AMessage {
  result?: any;
  error?: A2AError;
}

/**
 * A2A Error
 */
export interface A2AError {
  code: number;
  message: string;
  data?: any;
}

/**
 * Task Request
 */
export interface TaskRequest {
  taskId: string;
  capability: string;
  input: any;
  context?: TaskContext;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  timeout?: number;
}

/**
 * Task Context
 */
export interface TaskContext {
  sessionId?: string;
  userId?: string;
  metadata?: Record<string, any>;
  previousTasks?: string[];
}

/**
 * Task Response
 */
export interface TaskResponse {
  taskId: string;
  status: TaskStatus;
  output?: any;
  error?: A2AError;
  metrics?: TaskMetrics;
}

/**
 * Task Status
 */
export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

/**
 * Task Metrics
 */
export interface TaskMetrics {
  startTime: Date;
  endTime?: Date;
  duration?: number;
  tokensUsed?: number;
  cost?: number;
}

/**
 * Agent Discovery Request
 */
export interface DiscoveryRequest {
  query?: string;
  capabilities?: string[];
  filters?: Record<string, any>;
}

/**
 * Agent Discovery Response
 */
export interface DiscoveryResponse {
  agents: AgentCard[];
  total: number;
  page?: number;
  pageSize?: number;
}

/**
 * Negotiation Request
 */
export interface NegotiationRequest {
  agentId: string;
  capability: string;
  requirements: {
    maxLatency?: number;
    maxCost?: number;
    minQuality?: number;
    constraints?: Record<string, any>;
  };
}

/**
 * Negotiation Response
 */
export interface NegotiationResponse {
  accepted: boolean;
  terms?: {
    latency: number;
    cost: number;
    quality: number;
    expiresAt: Date;
  };
  reason?: string;
}
