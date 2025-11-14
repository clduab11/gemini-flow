/**
 * A2A Protocol Manager
 * Main entry point for A2A protocol operations
 */

import { EventEmitter } from 'events';
import { AgentCardManager, createGeminiFlowAgentCard } from './agent-card.js';
import { A2ACommunicator, TaskExecutor } from './communication.js';
import {
  AgentCard,
  TaskRequest,
  TaskResponse,
  TaskStatus,
  DiscoveryRequest,
  DiscoveryResponse,
  NegotiationRequest,
  NegotiationResponse,
  A2ARequest
} from './types.js';

export interface A2AProtocolConfig {
  agentId?: string;
  endpoint?: string;
  enableDiscovery?: boolean;
  enableNegotiation?: boolean;
  autoRegister?: boolean;
}

export class A2AProtocolManager extends EventEmitter {
  private cardManager: AgentCardManager;
  private communicator: A2ACommunicator;
  private taskExecutor: TaskExecutor;
  private config: A2AProtocolConfig;
  private selfCard: AgentCard;

  constructor(config: A2AProtocolConfig = {}) {
    super();

    this.config = {
      enableDiscovery: true,
      enableNegotiation: true,
      autoRegister: true,
      ...config
    };

    // Initialize components
    this.cardManager = new AgentCardManager();
    this.communicator = new A2ACommunicator();
    this.taskExecutor = new TaskExecutor();

    // Create self card
    this.selfCard = createGeminiFlowAgentCard();
    if (this.config.agentId) {
      this.selfCard.id = this.config.agentId;
    }
    if (this.config.endpoint) {
      this.selfCard.endpoints[0].url = this.config.endpoint;
    }

    // Auto-register self
    if (this.config.autoRegister) {
      this.cardManager.registerAgent(this.selfCard);
    }

    // Setup event forwarding
    this.setupEventForwarding();

    console.log(`[A2A] Protocol Manager initialized (${this.selfCard.id})`);
  }

  /**
   * Setup event forwarding from sub-components
   */
  private setupEventForwarding(): void {
    // Forward communicator events
    this.communicator.on('request', (request: A2ARequest) => {
      this.handleIncomingRequest(request);
    });

    // Forward task events
    this.taskExecutor.on('task:submitted', (request: TaskRequest) => {
      this.emit('task:submitted', request);
    });

    this.taskExecutor.on('task:updated', (response: TaskResponse) => {
      this.emit('task:updated', response);
    });

    this.taskExecutor.on('task:cancelled', (taskId: string) => {
      this.emit('task:cancelled', taskId);
    });
  }

  /**
   * Handle incoming A2A request
   */
  private async handleIncomingRequest(request: A2ARequest): Promise<void> {
    console.log(`[A2A] Incoming request: ${request.method}`);

    try {
      let result: any;

      switch (request.method) {
        case 'discovery':
          result = await this.handleDiscoveryRequest(request.params);
          break;

        case 'negotiate':
          result = await this.handleNegotiationRequest(request.params);
          break;

        case 'task.submit':
          result = await this.handleTaskSubmit(request.params);
          break;

        case 'task.status':
          result = await this.handleTaskStatus(request.params);
          break;

        case 'task.cancel':
          result = await this.handleTaskCancel(request.params);
          break;

        case 'agent.card':
          result = this.selfCard;
          break;

        default:
          throw {
            code: A2ACommunicator.ErrorCodes.METHOD_NOT_FOUND,
            message: `Method not found: ${request.method}`
          };
      }

      // Send response
      if (request.id !== undefined) {
        const response = this.communicator.createResponse(request.id, result);
        this.emit('response', response);
      }
    } catch (error: any) {
      if (request.id !== undefined) {
        const errorResponse = this.communicator.createErrorResponse(
          request.id,
          {
            code: error.code || A2ACommunicator.ErrorCodes.INTERNAL_ERROR,
            message: error.message || 'Internal error',
            data: error.data
          }
        );
        this.emit('response', errorResponse);
      }
    }
  }

  /**
   * Handle discovery request
   */
  private async handleDiscoveryRequest(params: DiscoveryRequest): Promise<DiscoveryResponse> {
    const agents = this.cardManager.findAgents({
      capabilities: params.capabilities,
      name: params.query
    });

    return {
      agents,
      total: agents.length
    };
  }

  /**
   * Handle negotiation request
   */
  private async handleNegotiationRequest(params: NegotiationRequest): Promise<NegotiationResponse> {
    // Check if we have the capability
    const hasCapability = this.cardManager.hasCapability(this.selfCard.id, params.capability);

    if (!hasCapability) {
      return {
        accepted: false,
        reason: 'Capability not available'
      };
    }

    // Simple acceptance for now
    // In production, would evaluate requirements and negotiate terms
    return {
      accepted: true,
      terms: {
        latency: 1000,
        cost: 0,
        quality: 0.9,
        expiresAt: new Date(Date.now() + 3600000) // 1 hour
      }
    };
  }

  /**
   * Handle task submission
   */
  private async handleTaskSubmit(params: TaskRequest): Promise<{ taskId: string }> {
    const taskId = await this.taskExecutor.submitTask(params);
    return { taskId };
  }

  /**
   * Handle task status request
   */
  private async handleTaskStatus(params: { taskId: string }): Promise<TaskResponse> {
    const status = this.taskExecutor.getTaskStatus(params.taskId);
    if (!status) {
      throw {
        code: A2ACommunicator.ErrorCodes.INTERNAL_ERROR,
        message: `Task not found: ${params.taskId}`
      };
    }
    return status;
  }

  /**
   * Handle task cancellation
   */
  private async handleTaskCancel(params: { taskId: string }): Promise<{ cancelled: boolean }> {
    const cancelled = this.taskExecutor.cancelTask(params.taskId);
    return { cancelled };
  }

  /**
   * Register an external agent
   */
  registerAgent(card: AgentCard): void {
    this.cardManager.registerAgent(card);
    this.emit('agent:registered', card);
  }

  /**
   * Discover agents
   */
  discoverAgents(request: DiscoveryRequest = {}): DiscoveryResponse {
    const agents = this.cardManager.findAgents({
      capabilities: request.capabilities,
      name: request.query
    });

    return {
      agents,
      total: agents.length
    };
  }

  /**
   * Send task to another agent
   */
  async sendTask(agentId: string, task: Omit<TaskRequest, 'taskId'>): Promise<string> {
    const agent = this.cardManager.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const taskRequest: TaskRequest = {
      taskId,
      ...task
    };

    const endpoint = agent.endpoints[0]?.url;
    if (!endpoint) {
      throw new Error(`No endpoint found for agent: ${agentId}`);
    }

    const result = await this.communicator.sendRequest(endpoint, 'task.submit', taskRequest);
    return result.taskId;
  }

  /**
   * Query task status from another agent
   */
  async queryTaskStatus(agentId: string, taskId: string): Promise<TaskResponse> {
    const agent = this.cardManager.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    const endpoint = agent.endpoints[0]?.url;
    if (!endpoint) {
      throw new Error(`No endpoint found for agent: ${agentId}`);
    }

    return await this.communicator.sendRequest(endpoint, 'task.status', { taskId });
  }

  /**
   * Negotiate with another agent
   */
  async negotiate(request: NegotiationRequest): Promise<NegotiationResponse> {
    const agent = this.cardManager.getAgent(request.agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${request.agentId}`);
    }

    const endpoint = agent.endpoints[0]?.url;
    if (!endpoint) {
      throw new Error(`No endpoint found for agent: ${request.agentId}`);
    }

    return await this.communicator.sendRequest(endpoint, 'negotiate', request);
  }

  /**
   * Get self agent card
   */
  getSelfCard(): AgentCard {
    return this.selfCard;
  }

  /**
   * Get agent by ID
   */
  getAgent(agentId: string): AgentCard | undefined {
    return this.cardManager.getAgent(agentId);
  }

  /**
   * Get all agents
   */
  getAllAgents(): AgentCard[] {
    return this.cardManager.getAllAgents();
  }

  /**
   * Update task status (for tasks we're executing)
   */
  updateTaskStatus(taskId: string, status: TaskStatus, output?: any, error?: any): void {
    this.taskExecutor.updateTaskStatus(taskId, status, output, error);
  }

  /**
   * Get task status
   */
  getTaskStatus(taskId: string): TaskResponse | undefined {
    return this.taskExecutor.getTaskStatus(taskId);
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.communicator.cleanup();
    this.cardManager.clear();
    this.removeAllListeners();
    console.log('[A2A] Protocol Manager cleaned up');
  }
}

/**
 * Global instance
 */
let a2aInstance: A2AProtocolManager | null = null;

/**
 * Get A2A protocol manager instance
 */
export function getA2AProtocol(config?: A2AProtocolConfig): A2AProtocolManager {
  if (!a2aInstance) {
    a2aInstance = new A2AProtocolManager(config);
  }
  return a2aInstance;
}

/**
 * Reset A2A instance (for testing)
 */
export function resetA2AProtocol(): void {
  if (a2aInstance) {
    a2aInstance.cleanup();
    a2aInstance = null;
  }
}
