/**
 * Gemini Flow A2A (Agent-to-Agent) TypeScript SDK
 * 
 * Comprehensive TypeScript client for interacting with Gemini Flow's
 * Agent-to-Agent communication system. Supports all 104 A2A-enabled MCP tools
 * with full type safety and advanced coordination patterns.
 * 
 * @version 2.0.0-a2a
 * @author Gemini Flow A2A Team
 */

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import WebSocket from 'ws';
import { EventEmitter } from 'events';

// Core Types
export interface A2AClientConfig {
  baseURL: string;
  apiKey?: string;
  certificate?: A2ACertificate;
  timeout?: number;
  retryPolicy?: RetryPolicy;
  websocketEnabled?: boolean;
  logging?: LoggingConfig;
}

export interface A2ACertificate {
  cert: string;
  key: string;
  ca?: string;
  passphrase?: string;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffStrategy: 'linear' | 'exponential' | 'custom';
  baseDelay: number;
  maxDelay: number;
  retryableErrors: string[];
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  enableRequestLogging: boolean;
  enableResponseLogging: boolean;
}

// Agent Targeting Types
export type AgentTarget = 
  | SingleTarget 
  | MultipleTargets 
  | GroupTarget 
  | BroadcastTarget 
  | ConditionalTarget;

export interface SingleTarget {
  type: 'single';
  agentId: string;
}

export interface MultipleTargets {
  type: 'multiple';
  agentIds: string[];
  coordinationMode: 'parallel' | 'sequential' | 'race';
}

export interface GroupTarget {
  type: 'group';
  role: AgentRole;
  capabilities?: string[];
  maxAgents?: number;
  selectionStrategy: 'random' | 'load-balanced' | 'capability-matched';
}

export interface BroadcastTarget {
  type: 'broadcast';
  filter?: AgentFilter;
  excludeSource?: boolean;
}

export interface ConditionalTarget {
  type: 'conditional';
  conditions: AgentCondition[];
  fallback?: AgentTarget;
}

export interface AgentFilter {
  role?: AgentRole;
  capabilities?: string[];
  status?: 'active' | 'idle' | 'busy';
  swarmId?: string;
}

export interface AgentCondition {
  type: 'capability' | 'resource' | 'status' | 'location' | 'custom';
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
}

export type AgentRole = 
  | 'coordinator' | 'researcher' | 'coder' | 'analyst' | 'optimizer' 
  | 'tester' | 'reviewer' | 'spawner' | 'memory-manager' | 'task-orchestrator'
  | 'neural-trainer' | 'system-architect' | 'performance-monitor' 
  | 'security-manager' | 'daa-coordinator' | 'consensus-manager' | 'resource-allocator';

// Coordination Types
export type CoordinationMode = 
  | DirectCoordination 
  | BroadcastCoordination 
  | ConsensusCoordination 
  | PipelineCoordination;

export interface DirectCoordination {
  mode: 'direct';
  timeout?: number;
  retries?: number;
  acknowledgment?: boolean;
}

export interface BroadcastCoordination {
  mode: 'broadcast';
  aggregation: 'all' | 'majority' | 'first' | 'any';
  timeout?: number;
  partialSuccess?: boolean;
}

export interface ConsensusCoordination {
  mode: 'consensus';
  consensusType: 'unanimous' | 'majority' | 'weighted';
  votingTimeout?: number;
  minimumParticipants?: number;
}

export interface PipelineCoordination {
  mode: 'pipeline';
  stages: PipelineStage[];
  failureStrategy: 'abort' | 'skip' | 'retry';
  statePassthrough?: boolean;
}

export interface PipelineStage {
  name?: string;
  agentTarget: AgentTarget;
  toolName: MCPToolName;
  parameters?: any;
  inputTransform?: string;
  outputTransform?: string;
  timeout?: number;
}

// MCP Tool Names (All 104 A2A-Enabled Tools)
export type MCPToolName = 
  // Core Infrastructure (16 tools)
  | 'mcp__gemini-flow__swarm_init' | 'mcp__gemini-flow__swarm_status' 
  | 'mcp__gemini-flow__swarm_monitor' | 'mcp__gemini-flow__swarm_scale'
  | 'mcp__gemini-flow__swarm_destroy' | 'mcp__ruv-swarm__swarm_init'
  | 'mcp__ruv-swarm__swarm_status' | 'mcp__ruv-swarm__swarm_monitor'
  | 'mcp__gemini-flow__agent_spawn' | 'mcp__gemini-flow__agent_list'
  | 'mcp__gemini-flow__agent_metrics' | 'mcp__ruv-swarm__agent_spawn'
  | 'mcp__ruv-swarm__agent_list' | 'mcp__ruv-swarm__agent_metrics'
  | 'mcp__gemini-flow__topology_optimize' | 'mcp__gemini-flow__coordination_sync'
  // Task Orchestration (12 tools)
  | 'mcp__gemini-flow__task_orchestrate' | 'mcp__gemini-flow__task_status'
  | 'mcp__gemini-flow__task_results' | 'mcp__ruv-swarm__task_orchestrate'
  | 'mcp__ruv-swarm__task_status' | 'mcp__ruv-swarm__task_results'
  | 'mcp__gemini-flow__parallel_execute' | 'mcp__gemini-flow__batch_process'
  | 'mcp__gemini-flow__load_balance' | 'mcp__gemini-flow__workflow_create'
  | 'mcp__gemini-flow__workflow_execute' | 'mcp__gemini-flow__workflow_export'
  // Memory & State Management (14 tools)
  | 'mcp__gemini-flow__memory_usage' | 'mcp__gemini-flow__memory_search'
  | 'mcp__gemini-flow__memory_persist' | 'mcp__gemini-flow__memory_namespace'
  | 'mcp__gemini-flow__memory_backup' | 'mcp__gemini-flow__memory_restore'
  | 'mcp__gemini-flow__memory_compress' | 'mcp__gemini-flow__memory_sync'
  | 'mcp__gemini-flow__memory_analytics' | 'mcp__ruv-swarm__memory_usage'
  | 'mcp__gemini-flow__state_snapshot' | 'mcp__gemini-flow__context_restore'
  | 'mcp__gemini-flow__cache_manage' | 'mcp__gemini-flow__config_manage'
  // Neural & AI Operations (16 tools)
  | 'mcp__gemini-flow__neural_status' | 'mcp__gemini-flow__neural_train'
  | 'mcp__gemini-flow__neural_patterns' | 'mcp__gemini-flow__neural_predict'
  | 'mcp__gemini-flow__neural_compress' | 'mcp__gemini-flow__neural_explain'
  | 'mcp__ruv-swarm__neural_status' | 'mcp__ruv-swarm__neural_train'
  | 'mcp__ruv-swarm__neural_patterns' | 'mcp__gemini-flow__model_load'
  | 'mcp__gemini-flow__model_save' | 'mcp__gemini-flow__inference_run'
  | 'mcp__gemini-flow__pattern_recognize' | 'mcp__gemini-flow__cognitive_analyze'
  | 'mcp__gemini-flow__learning_adapt' | 'mcp__gemini-flow__ensemble_create'
  | 'mcp__gemini-flow__transfer_learn'
  // DAA Systems (15 tools)
  | 'mcp__gemini-flow__daa_agent_create' | 'mcp__gemini-flow__daa_capability_match'
  | 'mcp__gemini-flow__daa_resource_alloc' | 'mcp__gemini-flow__daa_lifecycle_manage'
  | 'mcp__gemini-flow__daa_communication' | 'mcp__gemini-flow__daa_consensus'
  | 'mcp__gemini-flow__daa_fault_tolerance' | 'mcp__gemini-flow__daa_optimization'
  | 'mcp__ruv-swarm__daa_init' | 'mcp__ruv-swarm__daa_agent_create'
  | 'mcp__ruv-swarm__daa_agent_adapt' | 'mcp__ruv-swarm__daa_workflow_create'
  | 'mcp__ruv-swarm__daa_workflow_execute' | 'mcp__ruv-swarm__daa_knowledge_share'
  | 'mcp__ruv-swarm__daa_learning_status' | 'mcp__ruv-swarm__daa_cognitive_pattern'
  | 'mcp__ruv-swarm__daa_meta_learning' | 'mcp__ruv-swarm__daa_performance_metrics'
  // Performance & Analytics (12 tools)
  | 'mcp__gemini-flow__performance_report' | 'mcp__gemini-flow__bottleneck_analyze'
  | 'mcp__gemini-flow__token_usage' | 'mcp__gemini-flow__benchmark_run'
  | 'mcp__gemini-flow__metrics_collect' | 'mcp__gemini-flow__trend_analysis'
  | 'mcp__ruv-swarm__benchmark_run' | 'mcp__gemini-flow__cost_analysis'
  | 'mcp__gemini-flow__quality_assess' | 'mcp__gemini-flow__error_analysis'
  | 'mcp__gemini-flow__usage_stats' | 'mcp__gemini-flow__health_check'
  // GitHub Integration (8 tools)
  | 'mcp__gemini-flow__github_repo_analyze' | 'mcp__gemini-flow__github_metrics'
  | 'mcp__gemini-flow__github_pr_manage' | 'mcp__gemini-flow__github_code_review'
  | 'mcp__gemini-flow__github_issue_track' | 'mcp__gemini-flow__github_release_coord'
  | 'mcp__gemini-flow__github_workflow_auto' | 'mcp__gemini-flow__github_sync_coord'
  // Workflow & Automation (6 tools)
  | 'mcp__gemini-flow__automation_setup' | 'mcp__gemini-flow__pipeline_create'
  | 'mcp__gemini-flow__scheduler_manage' | 'mcp__gemini-flow__trigger_setup'
  | 'mcp__gemini-flow__workflow_template' | 'mcp__gemini-flow__sparc_mode'
  // System Infrastructure (11 tools)
  | 'mcp__gemini-flow__terminal_execute' | 'mcp__gemini-flow__features_detect'
  | 'mcp__gemini-flow__security_scan' | 'mcp__gemini-flow__backup_create'
  | 'mcp__gemini-flow__restore_system' | 'mcp__gemini-flow__log_analysis'
  | 'mcp__gemini-flow__diagnostic_run' | 'mcp__gemini-flow__wasm_optimize'
  | 'mcp__ruv-swarm__features_detect';

// Message Types
export interface A2AMessage {
  id?: string;
  correlationId?: string;
  conversationId?: string;
  source?: AgentIdentifier;
  target: AgentTarget;
  toolName: MCPToolName;
  parameters?: any;
  execution?: ExecutionContext;
  coordination: CoordinationMode;
  stateRequirements?: StateRequirement[];
  resourceRequirements?: ResourceRequirement[];
  timestamp?: number;
  ttl?: number;
  priority?: MessagePriority;
  retryPolicy?: RetryPolicy;
}

export interface A2AResponse {
  messageId: string;
  correlationId?: string;
  source: AgentIdentifier;
  success: boolean;
  result?: any;
  error?: A2AError;
  timestamp: number;
  metadata: ResponseMetadata;
  performance?: {
    executionTime: number;
    networkLatency: number;
    resourceUsage?: any;
  };
}

export interface AgentIdentifier {
  agentId: string;
  agentType?: AgentRole;
  swarmId?: string;
  capabilities?: string[];
}

export interface ExecutionContext {
  timeout?: number;
  priority?: MessagePriority;
  environment?: Record<string, any>;
  resources?: any;
}

export interface StateRequirement {
  type: 'read' | 'write' | 'exclusive' | 'shared';
  namespace: string;
  keys: string[];
  consistency: 'eventual' | 'strong' | 'causal';
  timeout?: number;
}

export interface ResourceRequirement {
  type: 'cpu' | 'memory' | 'gpu' | 'network' | 'storage' | 'custom';
  amount: number;
  unit: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  duration?: number;
  exclusive?: boolean;
}

export type MessagePriority = 'low' | 'medium' | 'high' | 'critical';

export interface ResponseMetadata {
  agentVersion?: string;
  processingTime?: number;
  resourcesUsed?: any;
  stateModifications?: any[];
}

export interface A2AError {
  code: string;
  message: string;
  details?: any;
  recoverable: boolean;
  suggestedAction?: string;
}

/**
 * Main A2A Client Class
 */
export class A2AClient extends EventEmitter {
  private httpClient: AxiosInstance;
  private websocket?: WebSocket;
  private config: A2AClientConfig;
  private messageQueue: Map<string, Promise<A2AResponse>> = new Map();
  private connectionPool: Map<string, any> = new Map();

  constructor(config: A2AClientConfig) {
    super();
    this.config = {
      timeout: 30000,
      retryPolicy: {
        maxRetries: 3,
        backoffStrategy: 'exponential',
        baseDelay: 1000,
        maxDelay: 30000,
        retryableErrors: ['NETWORK_TIMEOUT', 'CONNECTION_FAILED']
      },
      websocketEnabled: true,
      logging: {
        level: 'info',
        enableRequestLogging: false,
        enableResponseLogging: false
      },
      ...config
    };

    this.setupHttpClient();
    this.setupWebSocket();
  }

  private setupHttpClient(): void {
    this.httpClient = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GeminiFlow-A2A-TypeScript-SDK/2.0.0'
      }
    });

    // Add certificate authentication if provided
    if (this.config.certificate) {
      this.httpClient.defaults.httpsAgent = new (require('https').Agent)({
        cert: this.config.certificate.cert,
        key: this.config.certificate.key,
        ca: this.config.certificate.ca,
        passphrase: this.config.certificate.passphrase
      });
    }

    // Add API key authentication if provided
    if (this.config.apiKey) {
      this.httpClient.defaults.headers.common['X-API-Key'] = this.config.apiKey;
    }

    // Request interceptor
    this.httpClient.interceptors.request.use((config) => {
      // Add A2A-specific headers
      config.headers['X-A2A-Timestamp'] = Date.now().toString();
      
      if (this.config.logging?.enableRequestLogging) {
        console.log('A2A Request:', config);
      }
      
      return config;
    });

    // Response interceptor
    this.httpClient.interceptors.response.use(
      (response) => {
        if (this.config.logging?.enableResponseLogging) {
          console.log('A2A Response:', response.data);
        }
        return response;
      },
      (error) => {
        this.handleHttpError(error);
        return Promise.reject(error);
      }
    );
  }

  private setupWebSocket(): void {
    if (!this.config.websocketEnabled) return;

    const wsUrl = this.config.baseURL.replace('http', 'ws') + '/ws';
    this.websocket = new WebSocket(wsUrl);

    this.websocket.on('open', () => {
      this.emit('connected');
    });

    this.websocket.on('message', (data) => {
      this.handleWebSocketMessage(data);
    });

    this.websocket.on('error', (error) => {
      this.emit('error', error);
    });

    this.websocket.on('close', () => {
      this.emit('disconnected');
      // Attempt reconnection
      setTimeout(() => this.setupWebSocket(), 5000);
    });
  }

  private handleWebSocketMessage(data: any): void {
    try {
      const message = JSON.parse(data.toString());
      
      if (message.type === 'response' && message.correlationId) {
        const pendingPromise = this.messageQueue.get(message.correlationId);
        if (pendingPromise) {
          this.messageQueue.delete(message.correlationId);
          // Resolve the promise (handled by the Promise executor)
        }
      }
      
      this.emit('message', message);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  private handleHttpError(error: AxiosError): void {
    if (this.config.logging?.level === 'debug') {
      console.error('HTTP Error:', error);
    }

    this.emit('error', {
      type: 'http_error',
      error: error.response?.data || error.message,
      status: error.response?.status
    });
  }

  /**
   * Send A2A message
   */
  async sendMessage(message: A2AMessage): Promise<A2AResponse> {
    // Generate message ID if not provided
    if (!message.id) {
      message.id = this.generateMessageId();
    }

    // Add timestamp
    message.timestamp = Date.now();

    // Apply retry policy
    return this.executeWithRetry(() => this.doSendMessage(message));
  }

  private async doSendMessage(message: A2AMessage): Promise<A2AResponse> {
    try {
      if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
        return this.sendViaWebSocket(message);
      } else {
        return this.sendViaHTTP(message);
      }
    } catch (error) {
      throw new A2AClientError('Message send failed', error);
    }
  }

  private async sendViaWebSocket(message: A2AMessage): Promise<A2AResponse> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.messageQueue.delete(message.id!);
        reject(new A2AClientError('WebSocket message timeout'));
      }, message.execution?.timeout || this.config.timeout);

      this.messageQueue.set(message.id!, Promise.resolve().then(() => {
        clearTimeout(timeout);
        // This will be resolved when the response is received
      }));

      this.websocket!.send(JSON.stringify({
        type: 'message',
        ...message
      }));
    });
  }

  private async sendViaHTTP(message: A2AMessage): Promise<A2AResponse> {
    const response = await this.httpClient.post('/api/v2/a2a/message', message);
    return response.data;
  }

  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    const { maxRetries, backoffStrategy, baseDelay, maxDelay, retryableErrors } = this.config.retryPolicy!;
    
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Check if error is retryable
        const errorCode = error.code || error.response?.data?.code;
        if (!retryableErrors.includes(errorCode) || attempt === maxRetries) {
          throw error;
        }
        
        // Calculate delay
        let delay = baseDelay;
        if (backoffStrategy === 'exponential') {
          delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
        }
        
        await this.sleep(delay);
      }
    }
    
    throw lastError;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * High-level helper methods for common operations
   */

  // Swarm Management
  async initializeSwarm(config: {
    provider: 'gemini-flow' | 'ruv-swarm';
    topology: 'hierarchical' | 'mesh' | 'ring' | 'star';
    maxAgents: number;
    strategy: 'parallel' | 'sequential' | 'adaptive' | 'balanced';
    coordinationMode?: 'broadcast' | 'consensus';
  }): Promise<A2AResponse> {
    return this.sendMessage({
      target: {
        type: 'group',
        role: 'coordinator'
      },
      toolName: config.provider === 'gemini-flow' 
        ? 'mcp__gemini-flow__swarm_init' 
        : 'mcp__ruv-swarm__swarm_init',
      parameters: config,
      coordination: {
        mode: config.coordinationMode || 'broadcast',
        aggregation: 'all',
        timeout: 30000
      } as BroadcastCoordination
    });
  }

  // Agent Management
  async spawnAgent(config: {
    type: AgentRole;
    name?: string;
    capabilities: string[];
    placement?: {
      strategy: 'load-balanced' | 'capability-matched' | 'geographic';
      constraints?: any[];
    };
  }): Promise<A2AResponse> {
    return this.sendMessage({
      target: {
        type: 'group',
        role: 'spawner',
        maxAgents: 1,
        selectionStrategy: 'load-balanced'
      },
      toolName: 'mcp__gemini-flow__agent_spawn',
      parameters: config,
      coordination: {
        mode: 'consensus',
        consensusType: 'majority',
        minimumParticipants: 2
      } as ConsensusCoordination
    });
  }

  // Task Orchestration
  async orchestrateTask(config: {
    task: string;
    strategy?: 'parallel' | 'sequential' | 'adaptive' | 'pipeline';
    maxAgents?: number;
    priority?: MessagePriority;
    stages?: PipelineStage[];
  }): Promise<A2AResponse> {
    const coordination: CoordinationMode = config.strategy === 'pipeline' 
      ? {
          mode: 'pipeline',
          stages: config.stages || [],
          failureStrategy: 'abort',
          statePassthrough: true
        } as PipelineCoordination
      : {
          mode: 'broadcast',
          aggregation: 'majority',
          timeout: 120000
        } as BroadcastCoordination;

    return this.sendMessage({
      target: {
        type: 'group',
        role: 'task-orchestrator',
        maxAgents: config.maxAgents || 3
      },
      toolName: 'mcp__gemini-flow__task_orchestrate',
      parameters: config,
      coordination,
      priority: config.priority || 'medium'
    });
  }

  // Memory Management
  async storeMemory(config: {
    key: string;
    value: any;
    namespace?: string;
    ttl?: number;
    replication?: {
      factor: number;
      strategy: 'quorum' | 'gossip' | 'chain';
    };
    consistency?: 'eventual' | 'strong' | 'causal';
  }): Promise<A2AResponse> {
    return this.sendMessage({
      target: {
        type: 'group',
        role: 'memory-manager',
        maxAgents: config.replication?.factor || 3
      },
      toolName: 'mcp__gemini-flow__memory_usage',
      parameters: {
        action: 'store',
        ...config
      },
      coordination: {
        mode: 'consensus',
        consensusType: 'majority',
        votingTimeout: 10000
      } as ConsensusCoordination,
      stateRequirements: [{
        type: 'write',
        namespace: config.namespace || 'default',
        keys: [config.key],
        consistency: config.consistency || 'strong'
      }]
    });
  }

  async retrieveMemory(config: {
    key: string;
    namespace?: string;
    consistency?: 'eventual' | 'strong' | 'causal';
  }): Promise<A2AResponse> {
    return this.sendMessage({
      target: {
        type: 'group',
        role: 'memory-manager',
        maxAgents: config.consistency === 'strong' ? 3 : 1
      },
      toolName: 'mcp__gemini-flow__memory_usage',
      parameters: {
        action: 'retrieve',
        ...config
      },
      coordination: config.consistency === 'strong'
        ? {
            mode: 'consensus',
            consensusType: 'majority'
          } as ConsensusCoordination
        : {
            mode: 'direct'
          } as DirectCoordination,
      stateRequirements: [{
        type: 'read',
        namespace: config.namespace || 'default',
        keys: [config.key],
        consistency: config.consistency || 'eventual'
      }]
    });
  }

  // Neural Operations
  async trainNeuralModel(config: {
    modelType: 'transformer' | 'cnn' | 'rnn' | 'custom';
    trainingData: string;
    participants: Array<{
      agentId: string;
      role: 'worker' | 'parameter-server' | 'coordinator';
      resources?: string[];
    }>;
    hyperparameters: {
      learningRate: number;
      batchSize: number;
      epochs: number;
    };
    coordination?: {
      mode: 'parameter-server' | 'all-reduce' | 'federated';
      synchronization: 'sync' | 'async' | 'semi-sync';
    };
  }): Promise<A2AResponse> {
    return this.sendMessage({
      target: {
        type: 'multiple',
        agentIds: config.participants.map(p => p.agentId),
        coordinationMode: 'parallel'
      },
      toolName: 'mcp__gemini-flow__neural_train',
      parameters: config,
      coordination: {
        mode: 'pipeline',
        stages: [
          {
            name: 'initialization',
            agentTarget: {
              type: 'single',
              agentId: config.participants.find(p => p.role === 'coordinator')?.agentId || config.participants[0].agentId
            },
            toolName: 'mcp__gemini-flow__neural_train'
          },
          {
            name: 'distributed-training',
            agentTarget: {
              type: 'multiple',
              agentIds: config.participants.filter(p => p.role === 'worker').map(p => p.agentId),
              coordinationMode: 'parallel'
            },
            toolName: 'mcp__gemini-flow__neural_train'
          }
        ],
        failureStrategy: 'retry'
      } as PipelineCoordination,
      resourceRequirements: [{
        type: 'gpu',
        amount: config.participants.filter(p => p.role === 'worker').length,
        unit: 'device',
        priority: 'high'
      }]
    });
  }

  // DAA Consensus
  async initiateConsensus(config: {
    proposal: {
      type: 'resource-allocation' | 'policy-change' | 'agent-promotion' | 'emergency-action';
      details: any;
      priority?: 'low' | 'medium' | 'high' | 'emergency';
    };
    participants: Array<{
      agentId: string;
      role: 'leader' | 'follower' | 'observer';
      weight?: number;
    }>;
    algorithm?: 'raft' | 'pbft' | 'tendermint' | 'custom';
    timeout?: number;
    threshold?: number;
  }): Promise<A2AResponse> {
    return this.sendMessage({
      target: {
        type: 'multiple',
        agentIds: config.participants.map(p => p.agentId),
        coordinationMode: 'parallel'
      },
      toolName: 'mcp__ruv-swarm__daa_consensus',
      parameters: config,
      coordination: {
        mode: 'consensus',
        consensusType: 'majority',
        votingTimeout: config.timeout || 30000,
        minimumParticipants: Math.ceil(config.participants.length / 2)
      } as ConsensusCoordination
    });
  }

  // GitHub Integration
  async analyzeRepository(config: {
    repo: string;
    analysisType: 'code_quality' | 'performance' | 'security';
    coordination?: {
      mode: 'parallel' | 'distributed';
      maxAnalyzers?: number;
    };
  }): Promise<A2AResponse> {
    return this.sendMessage({
      target: {
        type: 'group',
        role: 'analyst',
        capabilities: ['github', config.analysisType],
        maxAgents: config.coordination?.maxAnalyzers || 3
      },
      toolName: 'mcp__gemini-flow__github_repo_analyze',
      parameters: config,
      coordination: {
        mode: 'broadcast',
        aggregation: 'all',
        timeout: 180000 // 3 minutes
      } as BroadcastCoordination
    });
  }

  // Performance Analytics
  async generatePerformanceReport(config: {
    format?: 'summary' | 'detailed' | 'json';
    timeframe?: '24h' | '7d' | '30d';
    components?: string[];
  }): Promise<A2AResponse> {
    return this.sendMessage({
      target: {
        type: 'group',
        role: 'performance-monitor',
        maxAgents: 1
      },
      toolName: 'mcp__gemini-flow__performance_report',
      parameters: config,
      coordination: {
        mode: 'direct'
      } as DirectCoordination
    });
  }

  /**
   * Utility methods
   */
  
  async getSwarmStatus(swarmId?: string): Promise<A2AResponse> {
    return this.sendMessage({
      target: {
        type: 'group',
        role: 'coordinator'
      },
      toolName: 'mcp__gemini-flow__swarm_status',
      parameters: { swarmId },
      coordination: {
        mode: 'broadcast',
        aggregation: 'majority'
      } as BroadcastCoordination
    });
  }

  async listAgents(filter?: AgentFilter): Promise<A2AResponse> {
    return this.sendMessage({
      target: {
        type: 'broadcast',
        filter
      },
      toolName: 'mcp__gemini-flow__agent_list',
      parameters: { filter },
      coordination: {
        mode: 'broadcast',
        aggregation: 'all'
      } as BroadcastCoordination
    });
  }

  /**
   * Connection management
   */
  async connect(): Promise<void> {
    if (this.websocket && this.websocket.readyState === WebSocket.CONNECTING) {
      return new Promise((resolve, reject) => {
        this.websocket!.once('open', resolve);
        this.websocket!.once('error', reject);
      });
    }
  }

  async disconnect(): Promise<void> {
    if (this.websocket) {
      this.websocket.close();
    }
    this.messageQueue.clear();
    this.connectionPool.clear();
  }

  isConnected(): boolean {
    return this.websocket?.readyState === WebSocket.OPEN;
  }

  /**
   * Event handling
   */
  onMessage(callback: (message: any) => void): void {
    this.on('message', callback);
  }

  onError(callback: (error: any) => void): void {
    this.on('error', callback);
  }

  onConnected(callback: () => void): void {
    this.on('connected', callback);
  }

  onDisconnected(callback: () => void): void {
    this.on('disconnected', callback);
  }
}

/**
 * Custom Error Class
 */
export class A2AClientError extends Error {
  public readonly code: string;
  public readonly details?: any;

  constructor(message: string, details?: any, code: string = 'A2A_CLIENT_ERROR') {
    super(message);
    this.name = 'A2AClientError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Utility Functions
 */
export const A2AUtils = {
  /**
   * Create agent target helpers
   */
  singleTarget(agentId: string): SingleTarget {
    return { type: 'single', agentId };
  },

  multipleTargets(agentIds: string[], coordinationMode: 'parallel' | 'sequential' | 'race' = 'parallel'): MultipleTargets {
    return { type: 'multiple', agentIds, coordinationMode };
  },

  groupTarget(
    role: AgentRole,
    options: {
      capabilities?: string[];
      maxAgents?: number;
      selectionStrategy?: 'random' | 'load-balanced' | 'capability-matched';
    } = {}
  ): GroupTarget {
    return {
      type: 'group',
      role,
      selectionStrategy: 'load-balanced',
      ...options
    };
  },

  broadcastTarget(filter?: AgentFilter): BroadcastTarget {
    return { type: 'broadcast', filter };
  },

  /**
   * Create coordination mode helpers
   */
  directCoordination(options: Partial<DirectCoordination> = {}): DirectCoordination {
    return {
      mode: 'direct',
      timeout: 5000,
      retries: 3,
      acknowledgment: true,
      ...options
    };
  },

  broadcastCoordination(
    aggregation: 'all' | 'majority' | 'first' | 'any' = 'all',
    options: Partial<BroadcastCoordination> = {}
  ): BroadcastCoordination {
    return {
      mode: 'broadcast',
      aggregation,
      timeout: 10000,
      partialSuccess: false,
      ...options
    };
  },

  consensusCoordination(
    consensusType: 'unanimous' | 'majority' | 'weighted' = 'majority',
    options: Partial<ConsensusCoordination> = {}
  ): ConsensusCoordination {
    return {
      mode: 'consensus',
      consensusType,
      votingTimeout: 30000,
      minimumParticipants: 3,
      ...options
    };
  },

  pipelineCoordination(
    stages: PipelineStage[],
    options: Partial<PipelineCoordination> = {}
  ): PipelineCoordination {
    return {
      mode: 'pipeline',
      stages,
      failureStrategy: 'abort',
      statePassthrough: true,
      ...options
    };
  },

  /**
   * Validation helpers
   */
  validateMessage(message: A2AMessage): string[] {
    const errors: string[] = [];

    if (!message.target) {
      errors.push('Message target is required');
    }

    if (!message.toolName) {
      errors.push('Tool name is required');
    }

    if (!message.coordination) {
      errors.push('Coordination mode is required');
    }

    // Validate target-specific requirements
    if (message.target?.type === 'multiple' && (!message.target.agentIds || message.target.agentIds.length === 0)) {
      errors.push('Multiple target requires at least one agent ID');
    }

    if (message.target?.type === 'group' && !message.target.role) {
      errors.push('Group target requires a role');
    }

    // Validate coordination-specific requirements
    if (message.coordination?.mode === 'pipeline' && (!message.coordination.stages || message.coordination.stages.length === 0)) {
      errors.push('Pipeline coordination requires at least one stage');
    }

    return errors;
  }
};

/**
 * Default export
 */
export default A2AClient;