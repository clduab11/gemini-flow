/**
 * A2A Compliance Testing Framework
 * Comprehensive test harness for Agent-to-Agent communication protocol validation
 */

import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';

// A2A Protocol Interfaces
export interface A2AMessage {
  id: string;
  correlationId?: string;
  conversationId?: string;
  source: AgentIdentifier;
  target: AgentTarget;
  route?: string[];
  toolName: MCPToolName;
  parameters: any;
  execution: ExecutionContext;
  timestamp: number;
  ttl: number;
  priority: MessagePriority;
  retryPolicy: RetryPolicy;
  coordination: CoordinationMode;
  stateRequirements: StateRequirement[];
  resourceRequirements: ResourceRequirement[];
}

export interface A2AResponse {
  messageId: string;
  correlationId: string;
  source: AgentIdentifier;
  success: boolean;
  result?: any;
  error?: A2AError;
  timestamp: number;
  metadata: ResponseMetadata;
}

export interface AgentIdentifier {
  agentId: string;
  role: AgentRole;
  capabilities?: string[];
  version?: string;
}

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

export interface ExecutionContext {
  timeout: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  retries: number;
  isolation: boolean;
}

export type MessagePriority = 'low' | 'medium' | 'high' | 'critical';

export interface RetryPolicy {
  maxRetries: number;
  backoffStrategy: 'linear' | 'exponential' | 'custom';
  baseDelay: number;
  maxDelay: number;
  retryableErrors: A2AErrorCode[];
}

export type CoordinationMode = 
  | DirectCoordination
  | BroadcastCoordination
  | ConsensusCoordination
  | PipelineCoordination;

export interface DirectCoordination {
  mode: 'direct';
  timeout: number;
  retries: number;
  acknowledgment: boolean;
}

export interface BroadcastCoordination {
  mode: 'broadcast';
  aggregation: 'all' | 'majority' | 'first' | 'any';
  timeout: number;
  partialSuccess: boolean;
}

export interface ConsensusCoordination {
  mode: 'consensus';
  consensusType: 'unanimous' | 'majority' | 'weighted';
  votingTimeout: number;
  minimumParticipants: number;
}

export interface PipelineCoordination {
  mode: 'pipeline';
  stages: PipelineStage[];
  failureStrategy: 'abort' | 'skip' | 'retry';
  statePassthrough: boolean;
}

export interface PipelineStage {
  agentTarget: AgentTarget;
  toolName: MCPToolName;
  inputTransform?: (input: any) => any;
  outputTransform?: (output: any) => any;
}

export interface StateRequirement {
  type: 'read' | 'write' | 'exclusive' | 'shared';
  namespace: string;
  keys: string[];
  consistency: 'eventual' | 'strong' | 'causal';
  timeout: number;
}

export interface ResourceRequirement {
  type: 'cpu' | 'memory' | 'gpu' | 'network' | 'storage' | 'custom';
  amount: number;
  unit: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  duration: number;
  exclusive?: boolean;
}

export interface A2AError {
  code: A2AErrorCode;
  message: string;
  details?: any;
  recoverable: boolean;
  suggestedAction: RecoveryAction;
}

export enum A2AErrorCode {
  AGENT_NOT_FOUND = 'AGENT_NOT_FOUND',
  TOOL_NOT_SUPPORTED = 'TOOL_NOT_SUPPORTED',
  INSUFFICIENT_RESOURCES = 'INSUFFICIENT_RESOURCES',
  STATE_CONFLICT = 'STATE_CONFLICT',
  TIMEOUT = 'TIMEOUT',
  AUTHORIZATION_FAILED = 'AUTHORIZATION_FAILED',
  COORDINATION_FAILED = 'COORDINATION_FAILED'
}

export interface ResponseMetadata {
  processingTime: number;
  resourceUsage: ResourceUsage;
  hops: number;
  cached: boolean;
}

export interface ResourceUsage {
  cpu: number;
  memory: number;
  network: number;
}

export type MCPToolName = string;
export type AgentRole = string;
export type AgentFilter = any;
export type AgentCondition = any;
export type RecoveryAction = any;

/**
 * Mock Agent Implementation for Testing
 */
export class MockAgent extends EventEmitter {
  public readonly id: string;
  public readonly role: AgentRole;
  public readonly capabilities: string[];
  private messageQueue: A2AMessage[] = [];
  private responses: Map<string, A2AResponse> = new Map();
  private tools: Set<MCPToolName> = new Set();
  private resources: Map<string, number> = new Map();
  private state: Map<string, any> = new Map();

  constructor(
    id: string,
    role: AgentRole,
    capabilities: string[] = [],
    supportedTools: MCPToolName[] = []
  ) {
    super();
    this.id = id;
    this.role = role;
    this.capabilities = capabilities;
    supportedTools.forEach(tool => this.tools.add(tool));
    
    // Initialize resource pools
    this.resources.set('cpu', 100);
    this.resources.set('memory', 1024);
    this.resources.set('network', 1000);
  }

  /**
   * Process incoming A2A message
   */
  async processMessage(message: A2AMessage): Promise<A2AResponse> {
    const startTime = performance.now();
    
    try {
      // Validate message
      this.validateMessage(message);
      
      // Check tool support
      if (!this.tools.has(message.toolName)) {
        throw new Error(`Tool ${message.toolName} not supported`);
      }

      // Handle resource requirements
      await this.allocateResources(message.resourceRequirements);

      // Handle state requirements
      await this.handleStateRequirements(message.stateRequirements);

      // Execute tool
      const result = await this.executeTool(message.toolName, message.parameters);

      // Create response
      const response: A2AResponse = {
        messageId: message.id,
        correlationId: message.correlationId || message.id,
        source: {
          agentId: this.id,
          role: this.role,
          capabilities: this.capabilities
        },
        success: true,
        result,
        timestamp: Date.now(),
        metadata: {
          processingTime: performance.now() - startTime,
          resourceUsage: this.getCurrentResourceUsage(),
          hops: (message.route?.length || 0) + 1,
          cached: false
        }
      };

      this.responses.set(message.id, response);
      this.emit('messageProcessed', message, response);
      
      return response;

    } catch (error) {
      const errorResponse: A2AResponse = {
        messageId: message.id,
        correlationId: message.correlationId || message.id,
        source: {
          agentId: this.id,
          role: this.role,
          capabilities: this.capabilities
        },
        success: false,
        error: {
          code: this.mapErrorToCode(error),
          message: error.message,
          recoverable: this.isRecoverable(error),
          suggestedAction: this.getSuggestedAction(error)
        },
        timestamp: Date.now(),
        metadata: {
          processingTime: performance.now() - startTime,
          resourceUsage: this.getCurrentResourceUsage(),
          hops: (message.route?.length || 0) + 1,
          cached: false
        }
      };

      this.emit('messageError', message, errorResponse);
      return errorResponse;
    }
  }

  /**
   * Add tool support to agent
   */
  addTool(toolName: MCPToolName, handler?: (params: any) => Promise<any>): void {
    this.tools.add(toolName);
    if (handler) {
      this.on(`tool:${toolName}`, handler);
    }
  }

  /**
   * Remove tool support
   */
  removeTool(toolName: MCPToolName): void {
    this.tools.delete(toolName);
    this.removeAllListeners(`tool:${toolName}`);
  }

  /**
   * Get agent status
   */
  getStatus(): AgentStatus {
    return {
      id: this.id,
      role: this.role,
      capabilities: this.capabilities,
      supportedTools: Array.from(this.tools),
      resources: Object.fromEntries(this.resources),
      messageQueue: this.messageQueue.length,
      uptime: process.uptime()
    };
  }

  /**
   * Simulate failure scenarios
   */
  simulateFailure(type: 'timeout' | 'resource' | 'tool' | 'state', duration = 5000): void {
    this.emit('failureSimulated', type, duration);
    
    switch (type) {
      case 'timeout':
        this.simulateTimeout(duration);
        break;
      case 'resource':
        this.simulateResourceExhaustion(duration);
        break;
      case 'tool':
        this.simulateToolFailure(duration);
        break;
      case 'state':
        this.simulateStateConflict(duration);
        break;
    }
  }

  private validateMessage(message: A2AMessage): void {
    if (!message.id || !message.source || !message.target || !message.toolName) {
      throw new Error('Invalid message format');
    }
    
    if (message.ttl && message.timestamp + message.ttl < Date.now()) {
      throw new Error('Message expired');
    }
  }

  private async allocateResources(requirements: ResourceRequirement[]): Promise<void> {
    for (const req of requirements) {
      const available = this.resources.get(req.type) || 0;
      if (available < req.amount) {
        throw new Error(`Insufficient ${req.type}: required ${req.amount}, available ${available}`);
      }
      this.resources.set(req.type, available - req.amount);
    }
  }

  private async handleStateRequirements(requirements: StateRequirement[]): Promise<void> {
    for (const req of requirements) {
      const key = `${req.namespace}:${req.keys.join(':')}`;
      
      switch (req.type) {
        case 'read':
          if (!this.state.has(key)) {
            this.state.set(key, null);
          }
          break;
        case 'write':
        case 'exclusive':
          this.state.set(key, { locked: true, timestamp: Date.now() });
          break;
        case 'shared':
          const existing = this.state.get(key);
          this.state.set(key, { ...existing, shared: true, timestamp: Date.now() });
          break;
      }
    }
  }

  private async executeTool(toolName: MCPToolName, parameters: any): Promise<any> {
    const handler = this.listeners(`tool:${toolName}`)[0];
    
    if (handler) {
      return await handler(parameters);
    }

    // Default mock implementation
    return {
      tool: toolName,
      parameters,
      result: 'mock_success',
      timestamp: Date.now(),
      agentId: this.id
    };
  }

  private getCurrentResourceUsage(): ResourceUsage {
    return {
      cpu: 100 - (this.resources.get('cpu') || 0),
      memory: 1024 - (this.resources.get('memory') || 0),
      network: 1000 - (this.resources.get('network') || 0)
    };
  }

  private mapErrorToCode(error: Error): A2AErrorCode {
    if (error.message.includes('not supported')) return A2AErrorCode.TOOL_NOT_SUPPORTED;
    if (error.message.includes('not found')) return A2AErrorCode.AGENT_NOT_FOUND;
    if (error.message.includes('Insufficient')) return A2AErrorCode.INSUFFICIENT_RESOURCES;
    if (error.message.includes('expired')) return A2AErrorCode.TIMEOUT;
    return A2AErrorCode.COORDINATION_FAILED;
  }

  private isRecoverable(error: Error): boolean {
    return !error.message.includes('not supported') && !error.message.includes('not found');
  }

  private getSuggestedAction(error: Error): RecoveryAction {
    return { action: 'retry', delay: 1000 };
  }

  private simulateTimeout(duration: number): void {
    const originalProcess = this.processMessage.bind(this);
    this.processMessage = async () => {
      await new Promise(resolve => setTimeout(resolve, duration + 1000));
      return originalProcess.apply(this, arguments);
    };
    
    setTimeout(() => {
      this.processMessage = originalProcess;
    }, duration);
  }

  private simulateResourceExhaustion(duration: number): void {
    const originalResources = new Map(this.resources);
    this.resources.clear();
    
    setTimeout(() => {
      this.resources = originalResources;
    }, duration);
  }

  private simulateToolFailure(duration: number): void {
    const originalTools = new Set(this.tools);
    this.tools.clear();
    
    setTimeout(() => {
      this.tools = originalTools;
    }, duration);
  }

  private simulateStateConflict(duration: number): void {
    const originalState = new Map(this.state);
    this.state.set('conflict', { conflicted: true, timestamp: Date.now() });
    
    setTimeout(() => {
      this.state = originalState;
    }, duration);
  }
}

/**
 * A2A Message Bus Implementation for Testing
 */
export class MockA2AMessageBus extends EventEmitter {
  private agents: Map<string, MockAgent> = new Map();
  private messageHistory: A2AMessage[] = [];
  private responseHistory: A2AResponse[] = [];
  private metrics: MessageBusMetrics = {
    totalMessages: 0,
    successfulMessages: 0,
    failedMessages: 0,
    averageLatency: 0,
    throughput: 0
  };

  /**
   * Register agent with message bus
   */
  registerAgent(agent: MockAgent): void {
    this.agents.set(agent.id, agent);
    agent.on('messageProcessed', (message, response) => {
      this.responseHistory.push(response);
      this.updateMetrics(message, response, true);
    });
    
    agent.on('messageError', (message, response) => {
      this.responseHistory.push(response);
      this.updateMetrics(message, response, false);
    });
    
    this.emit('agentRegistered', agent.id);
  }

  /**
   * Unregister agent
   */
  unregisterAgent(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.removeAllListeners();
      this.agents.delete(agentId);
      this.emit('agentUnregistered', agentId);
    }
  }

  /**
   * Send message to single agent
   */
  async send(message: A2AMessage): Promise<A2AResponse> {
    this.messageHistory.push(message);
    this.metrics.totalMessages++;

    const target = this.resolveTarget(message.target);
    if (target.length === 0) {
      throw new Error('No agents found for target');
    }

    const agent = this.agents.get(target[0]);
    if (!agent) {
      throw new Error(`Agent ${target[0]} not found`);
    }

    return await agent.processMessage(message);
  }

  /**
   * Broadcast message to multiple agents
   */
  async broadcast(message: A2AMessage, targets: string[]): Promise<A2AResponse[]> {
    const responses: A2AResponse[] = [];
    const promises: Promise<A2AResponse>[] = [];

    for (const agentId of targets) {
      const agent = this.agents.get(agentId);
      if (agent) {
        promises.push(agent.processMessage(message));
      }
    }

    const results = await Promise.allSettled(promises);
    
    for (const result of results) {
      if (result.status === 'fulfilled') {
        responses.push(result.value);
      } else {
        responses.push({
          messageId: message.id,
          correlationId: message.correlationId || message.id,
          source: { agentId: 'unknown', role: 'unknown' },
          success: false,
          error: {
            code: A2AErrorCode.COORDINATION_FAILED,
            message: result.reason.message,
            recoverable: false,
            suggestedAction: { action: 'retry' }
          },
          timestamp: Date.now(),
          metadata: {
            processingTime: 0,
            resourceUsage: { cpu: 0, memory: 0, network: 0 },
            hops: 0,
            cached: false
          }
        });
      }
    }

    return responses;
  }

  /**
   * Route message based on coordination mode
   */
  async route(message: A2AMessage): Promise<A2AResponse[]> {
    const coordination = message.coordination;
    
    switch (coordination.mode) {
      case 'direct':
        return [await this.send(message)];
        
      case 'broadcast':
        const targets = this.resolveTarget(message.target);
        return await this.broadcast(message, targets);
        
      case 'consensus':
        return await this.handleConsensus(message, coordination);
        
      case 'pipeline':
        return await this.handlePipeline(message, coordination);
        
      default:
        throw new Error(`Unsupported coordination mode: ${(coordination as any).mode}`);
    }
  }

  /**
   * Get message bus metrics
   */
  getMetrics(): MessageBusMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalMessages: 0,
      successfulMessages: 0,
      failedMessages: 0,
      averageLatency: 0,
      throughput: 0
    };
    this.messageHistory = [];
    this.responseHistory = [];
  }

  /**
   * Get all registered agents
   */
  getAgents(): AgentStatus[] {
    return Array.from(this.agents.values()).map(agent => agent.getStatus());
  }

  private resolveTarget(target: AgentTarget): string[] {
    switch (target.type) {
      case 'single':
        return [target.agentId];
        
      case 'multiple':
        return target.agentIds;
        
      case 'group':
        return this.findAgentsByRole(target.role, target.maxAgents);
        
      case 'broadcast':
        return Array.from(this.agents.keys());
        
      case 'conditional':
        return this.findAgentsByConditions(target.conditions);
        
      default:
        return [];
    }
  }

  private findAgentsByRole(role: AgentRole, maxAgents?: number): string[] {
    const matchingAgents = Array.from(this.agents.values())
      .filter(agent => agent.role === role)
      .map(agent => agent.id);
    
    return maxAgents ? matchingAgents.slice(0, maxAgents) : matchingAgents;
  }

  private findAgentsByConditions(conditions: AgentCondition[]): string[] {
    // Mock implementation - in real system would evaluate conditions
    return Array.from(this.agents.keys()).slice(0, 3);
  }

  private async handleConsensus(message: A2AMessage, coordination: ConsensusCoordination): Promise<A2AResponse[]> {
    const targets = this.resolveTarget(message.target);
    const responses = await this.broadcast(message, targets);
    
    // Mock consensus logic
    const successfulResponses = responses.filter(r => r.success);
    const required = coordination.consensusType === 'unanimous' 
      ? targets.length 
      : Math.ceil(targets.length / 2);
    
    if (successfulResponses.length >= required) {
      return responses;
    } else {
      throw new Error('Consensus not reached');
    }
  }

  private async handlePipeline(message: A2AMessage, coordination: PipelineCoordination): Promise<A2AResponse[]> {
    const responses: A2AResponse[] = [];
    let currentInput = message.parameters;
    
    for (const stage of coordination.stages) {
      const stageMessage: A2AMessage = {
        ...message,
        id: `${message.id}-stage-${responses.length}`,
        target: stage.agentTarget,
        toolName: stage.toolName,
        parameters: stage.inputTransform ? stage.inputTransform(currentInput) : currentInput
      };
      
      try {
        const response = await this.send(stageMessage);
        responses.push(response);
        
        if (!response.success && coordination.failureStrategy === 'abort') {
          break;
        }
        
        currentInput = stage.outputTransform ? stage.outputTransform(response.result) : response.result;
      } catch (error) {
        if (coordination.failureStrategy === 'abort') {
          break;
        }
      }
    }
    
    return responses;
  }

  private updateMetrics(message: A2AMessage, response: A2AResponse, success: boolean): void {
    if (success) {
      this.metrics.successfulMessages++;
    } else {
      this.metrics.failedMessages++;
    }
    
    const latency = response.metadata.processingTime;
    this.metrics.averageLatency = (this.metrics.averageLatency + latency) / 2;
    
    // Calculate throughput (messages per second)
    const timeWindow = 1000; // 1 second
    const recentMessages = this.messageHistory.filter(
      m => Date.now() - m.timestamp < timeWindow
    );
    this.metrics.throughput = recentMessages.length;
  }
}

/**
 * Test Data Builders
 */
export class A2ATestDataBuilder {
  /**
   * Create test message with defaults
   */
  static createMessage(overrides: Partial<A2AMessage> = {}): A2AMessage {
    const defaults: A2AMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source: {
        agentId: 'test-agent-source',
        role: 'tester'
      },
      target: {
        type: 'single',
        agentId: 'test-agent-target'
      },
      toolName: 'mcp__claude-flow__agent_spawn',
      parameters: { test: true },
      execution: {
        timeout: 5000,
        priority: 'medium',
        retries: 3,
        isolation: false
      },
      timestamp: Date.now(),
      ttl: 30000,
      priority: 'medium',
      retryPolicy: {
        maxRetries: 3,
        backoffStrategy: 'exponential',
        baseDelay: 1000,
        maxDelay: 10000,
        retryableErrors: [A2AErrorCode.TIMEOUT, A2AErrorCode.INSUFFICIENT_RESOURCES]
      },
      coordination: {
        mode: 'direct',
        timeout: 5000,
        retries: 3,
        acknowledgment: true
      },
      stateRequirements: [],
      resourceRequirements: []
    };

    return { ...defaults, ...overrides };
  }

  /**
   * Create test agent
   */
  static createAgent(
    id: string = `agent-${Date.now()}`,
    role: AgentRole = 'tester',
    capabilities: string[] = ['test'],
    tools: MCPToolName[] = ['mcp__claude-flow__agent_spawn']
  ): MockAgent {
    return new MockAgent(id, role, capabilities, tools);
  }

  /**
   * Create test message bus with agents
   */
  static createMessageBus(agentCount: number = 3): MockA2AMessageBus {
    const bus = new MockA2AMessageBus();
    
    for (let i = 0; i < agentCount; i++) {
      const agent = this.createAgent(
        `test-agent-${i}`,
        i === 0 ? 'coordinator' : 'worker',
        ['test', 'spawn', 'execute'],
        ['mcp__claude-flow__agent_spawn', 'mcp__claude-flow__task_orchestrate']
      );
      bus.registerAgent(agent);
    }
    
    return bus;
  }
}

/**
 * Test Utilities
 */
export class A2ATestUtils {
  /**
   * Wait for condition with timeout
   */
  static async waitFor(
    condition: () => boolean,
    timeout: number = 5000,
    interval: number = 100
  ): Promise<void> {
    const startTime = Date.now();
    
    while (!condition() && Date.now() - startTime < timeout) {
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    if (!condition()) {
      throw new Error(`Condition not met within ${timeout}ms`);
    }
  }

  /**
   * Generate performance test load
   */
  static async generateLoad(
    messageBus: MockA2AMessageBus,
    messageCount: number,
    concurrency: number = 10
  ): Promise<A2AResponse[]> {
    const responses: A2AResponse[] = [];
    const batches: Promise<A2AResponse>[][] = [];
    
    for (let i = 0; i < messageCount; i += concurrency) {
      const batch: Promise<A2AResponse>[] = [];
      
      for (let j = 0; j < concurrency && i + j < messageCount; j++) {
        const message = A2ATestDataBuilder.createMessage({
          id: `load-test-${i + j}`,
          parameters: { index: i + j }
        });
        batch.push(messageBus.send(message));
      }
      
      batches.push(batch);
    }
    
    for (const batch of batches) {
      const batchResponses = await Promise.all(batch);
      responses.push(...batchResponses);
    }
    
    return responses;
  }

  /**
   * Validate message compliance with A2A protocol
   */
  static validateMessageCompliance(message: A2AMessage): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!message.id) errors.push('Missing required field: id');
    if (!message.source?.agentId) errors.push('Missing required field: source.agentId');
    if (!message.target) errors.push('Missing required field: target');
    if (!message.toolName) errors.push('Missing required field: toolName');
    if (!message.timestamp) errors.push('Missing required field: timestamp');

    // Field validation
    if (message.ttl && message.ttl < 1000) warnings.push('TTL less than 1 second may cause issues');
    if (message.retryPolicy?.maxRetries > 10) warnings.push('High retry count may cause delays');

    // Coordination validation
    if (message.coordination?.mode === 'consensus' && 
        (message.coordination as ConsensusCoordination).minimumParticipants < 2) {
      errors.push('Consensus requires at least 2 participants');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// Additional interfaces
export interface AgentStatus {
  id: string;
  role: AgentRole;
  capabilities: string[];
  supportedTools: MCPToolName[];
  resources: Record<string, number>;
  messageQueue: number;
  uptime: number;
}

export interface MessageBusMetrics {
  totalMessages: number;
  successfulMessages: number;
  failedMessages: number;
  averageLatency: number;
  throughput: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * A2A Compliance Test Suite Base Class
 */
export abstract class A2AComplianceTestSuite {
  protected messageBus: MockA2AMessageBus;
  protected testAgents: MockAgent[] = [];

  protected async setup(): Promise<void> {
    this.messageBus = A2ATestDataBuilder.createMessageBus(5);
    this.testAgents = this.messageBus.getAgents().map(status => 
      this.messageBus['agents'].get(status.id)!
    );
  }

  protected async teardown(): Promise<void> {
    for (const agent of this.testAgents) {
      this.messageBus.unregisterAgent(agent.id);
    }
    this.messageBus.removeAllListeners();
    this.messageBus.resetMetrics();
  }

  abstract runTests(): Promise<void>;
}