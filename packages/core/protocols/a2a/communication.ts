/**
 * A2A Communication Layer
 * Implements JSON-RPC 2.0 for agent-to-agent communication
 */

import { EventEmitter } from 'events';
import {
  A2AMessage,
  A2ARequest,
  A2AResponse,
  A2AError,
  TaskRequest,
  TaskResponse,
  TaskStatus
} from './types.js';

export class A2ACommunicator extends EventEmitter {
  private pendingRequests: Map<string | number, {
    resolve: (value: any) => void;
    reject: (error: any) => void;
    timeout: NodeJS.Timeout;
  }> = new Map();

  private requestIdCounter = 0;

  /**
   * Send a request to an agent
   */
  async sendRequest(
    endpoint: string,
    method: string,
    params: any,
    timeout: number = 30000
  ): Promise<any> {
    const requestId = ++this.requestIdCounter;

    const request: A2ARequest = {
      jsonrpc: '2.0',
      id: requestId,
      method,
      params
    };

    return new Promise((resolve, reject) => {
      // Set timeout
      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Request timeout after ${timeout}ms`));
      }, timeout);

      // Store pending request
      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        timeout: timeoutHandle
      });

      // Send request
      this.send(endpoint, request).catch(error => {
        clearTimeout(timeoutHandle);
        this.pendingRequests.delete(requestId);
        reject(error);
      });
    });
  }

  /**
   * Send a notification (no response expected)
   */
  async sendNotification(endpoint: string, method: string, params: any): Promise<void> {
    const notification: A2ARequest = {
      jsonrpc: '2.0',
      method,
      params
    };

    await this.send(endpoint, notification);
  }

  /**
   * Handle incoming message
   */
  handleMessage(message: A2AMessage): void {
    // Response to our request
    if (message.id !== undefined && this.pendingRequests.has(message.id)) {
      const pending = this.pendingRequests.get(message.id)!;
      clearTimeout(pending.timeout);
      this.pendingRequests.delete(message.id);

      if (message.error) {
        pending.reject(new A2AErrorClass(message.error));
      } else {
        pending.resolve(message.result);
      }
      return;
    }

    // Incoming request
    if (message.method) {
      this.emit('request', message as A2ARequest);
      return;
    }

    // Unknown message
    console.warn('[A2A] Received unknown message:', message);
  }

  /**
   * Send raw message
   */
  private async send(endpoint: string, message: A2AMessage): Promise<void> {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Handle response if present
      const data = await response.json();
      if (data) {
        this.handleMessage(data);
      }
    } catch (error: any) {
      console.error(`[A2A] Send error to ${endpoint}:`, error.message || error);
      throw error;
    }
  }

  /**
   * Create success response
   */
  createResponse(id: string | number, result: any): A2AResponse {
    return {
      jsonrpc: '2.0',
      id,
      result
    };
  }

  /**
   * Create error response
   */
  createErrorResponse(id: string | number, error: A2AError): A2AResponse {
    return {
      jsonrpc: '2.0',
      id,
      error
    };
  }

  /**
   * Standard error codes
   */
  static ErrorCodes = {
    PARSE_ERROR: -32700,
    INVALID_REQUEST: -32600,
    METHOD_NOT_FOUND: -32601,
    INVALID_PARAMS: -32602,
    INTERNAL_ERROR: -32603,

    // Custom error codes (starting from -32000)
    AGENT_NOT_FOUND: -32000,
    CAPABILITY_NOT_FOUND: -32001,
    AUTHENTICATION_FAILED: -32002,
    AUTHORIZATION_FAILED: -32003,
    RATE_LIMIT_EXCEEDED: -32004,
    PAYMENT_REQUIRED: -32005,
    TASK_FAILED: -32006,
    TIMEOUT: -32007
  };

  /**
   * Cleanup
   */
  cleanup(): void {
    // Reject all pending requests
    for (const pending of this.pendingRequests.values()) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Communicator cleanup'));
    }
    this.pendingRequests.clear();
    this.removeAllListeners();
  }
}

/**
 * A2A Error class
 */
export class A2AErrorClass extends Error {
  code: number;
  data?: any;

  constructor(error: A2AError) {
    super(error.message);
    this.name = 'A2AError';
    this.code = error.code;
    this.data = error.data;
  }
}

/**
 * Task Executor
 * Handles task lifecycle management
 */
export class TaskExecutor extends EventEmitter {
  private tasks: Map<string, {
    request: TaskRequest;
    response: TaskResponse;
    startTime: Date;
  }> = new Map();

  /**
   * Submit a task
   */
  async submitTask(request: TaskRequest): Promise<string> {
    const response: TaskResponse = {
      taskId: request.taskId,
      status: TaskStatus.PENDING,
      metrics: {
        startTime: new Date()
      }
    };

    this.tasks.set(request.taskId, {
      request,
      response,
      startTime: new Date()
    });

    this.emit('task:submitted', request);
    console.log(`[A2A] Task submitted: ${request.taskId}`);

    return request.taskId;
  }

  /**
   * Update task status
   */
  updateTaskStatus(taskId: string, status: TaskStatus, output?: any, error?: A2AError): void {
    const task = this.tasks.get(taskId);
    if (!task) {
      console.warn(`[A2A] Task not found: ${taskId}`);
      return;
    }

    task.response.status = status;
    if (output !== undefined) {
      task.response.output = output;
    }
    if (error) {
      task.response.error = error;
    }

    if (status === TaskStatus.COMPLETED || status === TaskStatus.FAILED) {
      const endTime = new Date();
      task.response.metrics = {
        ...task.response.metrics!,
        endTime,
        duration: endTime.getTime() - task.startTime.getTime()
      };
    }

    this.emit('task:updated', task.response);
    console.log(`[A2A] Task ${taskId} status: ${status}`);
  }

  /**
   * Get task status
   */
  getTaskStatus(taskId: string): TaskResponse | undefined {
    return this.tasks.get(taskId)?.response;
  }

  /**
   * Get all tasks
   */
  getAllTasks(): TaskResponse[] {
    return Array.from(this.tasks.values()).map(t => t.response);
  }

  /**
   * Cancel task
   */
  cancelTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) {
      return false;
    }

    if (task.response.status === TaskStatus.COMPLETED || task.response.status === TaskStatus.FAILED) {
      return false; // Already finished
    }

    this.updateTaskStatus(taskId, TaskStatus.CANCELLED);
    this.emit('task:cancelled', taskId);
    return true;
  }

  /**
   * Cleanup old tasks
   */
  cleanupOldTasks(maxAge: number = 3600000): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [taskId, task] of this.tasks) {
      const age = now - task.startTime.getTime();
      if (age > maxAge && (
        task.response.status === TaskStatus.COMPLETED ||
        task.response.status === TaskStatus.FAILED ||
        task.response.status === TaskStatus.CANCELLED
      )) {
        this.tasks.delete(taskId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[A2A] Cleaned up ${cleaned} old tasks`);
    }

    return cleaned;
  }
}
