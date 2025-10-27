/**
 * Quantum Computing Bridge for TypeScript ↔ Python Interop
 *
 * Strategy: stdio-based IPC with JSON-RPC 2.0 protocol
 * - Maintains <100ms agent spawn time via process pooling
 * - Supports Qiskit and Pennylane frameworks
 * - Graceful degradation to simulation when hardware unavailable
 *
 * Performance targets:
 * - Bridge initialization: <50ms
 * - Simple circuit execution: <200ms (simulation), <5s (hardware)
 * - Process pool size: 4-8 workers (configurable)
 */

import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { QuantumCommandArgs, QuantumConfig, QuantumOperation } from './types.js';

// ============================================================================
// Quantum Bridge Architecture
// ============================================================================

export interface QuantumBridgeConfig {
  pythonExecutable: string;         // Path to Python interpreter (default: 'python3')
  workerScript: string;             // Path to quantum worker script
  poolSize: number;                 // Number of worker processes (default: 4)
  maxQueueSize: number;             // Max queued requests (default: 100)
  workerTimeout: number;            // Worker timeout in ms (default: 30000)
  enableHardware: boolean;          // Enable quantum hardware backends
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export class QuantumBridge extends EventEmitter {
  private config: QuantumBridgeConfig;
  private workerPool: QuantumWorker[] = [];
  private requestQueue: QueuedRequest[] = [];
  private activeRequests = new Map<string, QueuedRequest>();
  private poolReady = false;
  private metrics: BridgeMetrics;

  constructor(config: Partial<QuantumBridgeConfig> = {}) {
    super();

    this.config = {
      pythonExecutable: config.pythonExecutable || 'python3',
      workerScript: config.workerScript || './src/cli/super-terminal/workers/quantum-worker.py',
      poolSize: config.poolSize || 4,
      maxQueueSize: config.maxQueueSize || 100,
      workerTimeout: config.workerTimeout || 30000,
      enableHardware: config.enableHardware || false,
      logLevel: config.logLevel || 'info',
    };

    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageLatency: 0,
      poolUtilization: 0,
    };
  }

  /**
   * Initialize the quantum worker pool
   * Target: <50ms initialization time
   */
  async initialize(): Promise<void> {
    const startTime = Date.now();

    // Spawn worker processes in parallel
    const workerPromises = Array.from({ length: this.config.poolSize }, (_, i) =>
      this.createWorker(i)
    );

    this.workerPool = await Promise.all(workerPromises);
    this.poolReady = true;

    const initTime = Date.now() - startTime;
    this.log('info', `Quantum bridge initialized with ${this.config.poolSize} workers in ${initTime}ms`);

    if (initTime > 50) {
      this.log('warn', `Initialization time ${initTime}ms exceeds 50ms target`);
    }

    this.emit('ready', { workers: this.config.poolSize, initTime });
  }

  /**
   * Execute quantum operation
   * Routes to available worker from pool
   */
  async execute(args: QuantumCommandArgs): Promise<QuantumResult> {
    if (!this.poolReady) {
      throw new Error('Quantum bridge not initialized. Call initialize() first.');
    }

    this.metrics.totalRequests++;

    const request: QueuedRequest = {
      id: uuidv4(),
      args,
      timestamp: Date.now(),
      resolve: null as any,
      reject: null as any,
    };

    // Create promise that will be resolved by worker response
    const resultPromise = new Promise<QuantumResult>((resolve, reject) => {
      request.resolve = resolve;
      request.reject = reject;
    });

    // Try to assign to available worker
    const worker = this.getAvailableWorker();

    if (worker) {
      this.assignToWorker(worker, request);
    } else {
      // Queue if all workers busy
      if (this.requestQueue.length >= this.config.maxQueueSize) {
        this.metrics.failedRequests++;
        throw new Error('Quantum bridge request queue full');
      }
      this.requestQueue.push(request);
      this.log('debug', `Request ${request.id} queued (queue size: ${this.requestQueue.length})`);
    }

    // Set timeout
    const timeout = setTimeout(() => {
      this.handleTimeout(request.id);
    }, this.config.workerTimeout);

    try {
      const result = await resultPromise;
      clearTimeout(timeout);
      this.metrics.successfulRequests++;
      this.updateMetrics(request, result);
      return result;
    } catch (error) {
      clearTimeout(timeout);
      this.metrics.failedRequests++;
      throw error;
    }
  }

  /**
   * Create a quantum worker process
   */
  private async createWorker(id: number): Promise<QuantumWorker> {
    const process = spawn(this.config.pythonExecutable, [this.config.workerScript], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        QUANTUM_WORKER_ID: id.toString(),
        ENABLE_HARDWARE: this.config.enableHardware.toString(),
      },
    });

    const worker: QuantumWorker = {
      id,
      process,
      busy: false,
      currentRequest: null,
      messageBuffer: '',
      stats: {
        requestsProcessed: 0,
        totalLatency: 0,
        errors: 0,
      },
    };

    // Set up stdout handler for JSON-RPC responses
    process.stdout.on('data', (data: Buffer) => {
      this.handleWorkerMessage(worker, data.toString());
    });

    // Set up stderr handler for errors
    process.stderr.on('data', (data: Buffer) => {
      this.log('error', `Worker ${id} stderr: ${data.toString()}`);
    });

    // Handle process exit
    process.on('exit', (code, signal) => {
      this.log('warn', `Worker ${id} exited with code ${code}, signal ${signal}`);
      this.handleWorkerExit(worker);
    });

    // Wait for worker ready signal
    await this.waitForWorkerReady(worker);

    return worker;
  }

  /**
   * Wait for worker to signal ready state
   */
  private waitForWorkerReady(worker: QuantumWorker): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Worker ${worker.id} failed to initialize within timeout`));
      }, 5000);

      const handler = (data: Buffer) => {
        const message = data.toString().trim();
        if (message.includes('"status":"ready"')) {
          clearTimeout(timeout);
          worker.process.stdout.off('data', handler);
          resolve();
        }
      };

      worker.process.stdout.on('data', handler);
    });
  }

  /**
   * Handle JSON-RPC message from worker
   */
  private handleWorkerMessage(worker: QuantumWorker, data: string): void {
    worker.messageBuffer += data;

    // Process complete JSON messages (newline-delimited)
    const messages = worker.messageBuffer.split('\n');
    worker.messageBuffer = messages.pop() || ''; // Keep incomplete message in buffer

    for (const message of messages) {
      if (!message.trim()) continue;

      try {
        const response: JsonRpcResponse = JSON.parse(message);
        this.handleWorkerResponse(worker, response);
      } catch (error) {
        this.log('error', `Failed to parse worker message: ${message}`);
      }
    }
  }

  /**
   * Handle JSON-RPC response from worker
   */
  private handleWorkerResponse(worker: QuantumWorker, response: JsonRpcResponse): void {
    if (response.id === 'ready') {
      // Worker ready signal, handled in waitForWorkerReady
      return;
    }

    const request = this.activeRequests.get(response.id);
    if (!request) {
      this.log('warn', `Received response for unknown request ${response.id}`);
      return;
    }

    this.activeRequests.delete(response.id);
    worker.busy = false;
    worker.currentRequest = null;
    worker.stats.requestsProcessed++;

    if (response.error) {
      worker.stats.errors++;
      request.reject(new Error(response.error.message));
    } else {
      request.resolve(response.result as QuantumResult);
    }

    // Process next queued request if available
    this.processQueue();
  }

  /**
   * Assign request to worker
   */
  private assignToWorker(worker: QuantumWorker, request: QueuedRequest): void {
    worker.busy = true;
    worker.currentRequest = request.id;
    this.activeRequests.set(request.id, request);

    // Build JSON-RPC request
    const rpcRequest: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: request.id,
      method: this.getMethodName(request.args),
      params: this.serializeParams(request.args),
    };

    // Send to worker (newline-delimited JSON)
    worker.process.stdin.write(JSON.stringify(rpcRequest) + '\n');

    this.log('debug', `Request ${request.id} assigned to worker ${worker.id}`);
  }

  /**
   * Get available worker from pool
   */
  private getAvailableWorker(): QuantumWorker | null {
    return this.workerPool.find(w => !w.busy) || null;
  }

  /**
   * Process queued requests
   */
  private processQueue(): void {
    while (this.requestQueue.length > 0) {
      const worker = this.getAvailableWorker();
      if (!worker) break;

      const request = this.requestQueue.shift()!;
      this.assignToWorker(worker, request);
    }

    // Update pool utilization metric
    const busyWorkers = this.workerPool.filter(w => w.busy).length;
    this.metrics.poolUtilization = (busyWorkers / this.config.poolSize) * 100;
  }

  /**
   * Handle request timeout
   */
  private handleTimeout(requestId: string): void {
    const request = this.activeRequests.get(requestId);
    if (!request) return;

    this.activeRequests.delete(requestId);
    request.reject(new Error(`Quantum operation timed out after ${this.config.workerTimeout}ms`));

    // Mark worker as potentially stuck
    const worker = this.workerPool.find(w => w.currentRequest === requestId);
    if (worker) {
      this.log('warn', `Worker ${worker.id} timed out, restarting...`);
      this.restartWorker(worker);
    }
  }

  /**
   * Handle worker process exit
   */
  private async handleWorkerExit(worker: QuantumWorker): Promise<void> {
    // Fail any active request
    if (worker.currentRequest) {
      const request = this.activeRequests.get(worker.currentRequest);
      if (request) {
        request.reject(new Error('Quantum worker process exited unexpectedly'));
        this.activeRequests.delete(worker.currentRequest);
      }
    }

    // Restart worker
    await this.restartWorker(worker);
  }

  /**
   * Restart a worker process
   */
  private async restartWorker(worker: QuantumWorker): Promise<void> {
    try {
      worker.process.kill();
    } catch (error) {
      // Ignore kill errors
    }

    const newWorker = await this.createWorker(worker.id);
    const index = this.workerPool.findIndex(w => w.id === worker.id);
    if (index !== -1) {
      this.workerPool[index] = newWorker;
    }

    this.log('info', `Worker ${worker.id} restarted`);
  }

  /**
   * Get JSON-RPC method name from quantum operation
   */
  private getMethodName(args: QuantumCommandArgs): string {
    return `quantum.${args.framework}.${args.operation}`;
  }

  /**
   * Serialize quantum operation parameters
   */
  private serializeParams(args: QuantumCommandArgs): any {
    return {
      framework: args.framework,
      operation: args.operation,
      config: args.config,
    };
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(request: QueuedRequest, result: QuantumResult): void {
    const latency = Date.now() - request.timestamp;

    // Exponential moving average for latency
    const alpha = 0.1; // Smoothing factor
    this.metrics.averageLatency =
      alpha * latency + (1 - alpha) * this.metrics.averageLatency;

    this.emit('metrics', {
      requestId: request.id,
      latency,
      averageLatency: this.metrics.averageLatency,
      queueSize: this.requestQueue.length,
      poolUtilization: this.metrics.poolUtilization,
    });
  }

  /**
   * Get current metrics
   */
  getMetrics(): BridgeMetrics {
    return { ...this.metrics };
  }

  /**
   * Shutdown quantum bridge and cleanup workers
   */
  async shutdown(): Promise<void> {
    this.poolReady = false;

    // Reject all queued requests
    for (const request of this.requestQueue) {
      request.reject(new Error('Quantum bridge shutting down'));
    }
    this.requestQueue = [];

    // Kill all workers
    for (const worker of this.workerPool) {
      try {
        worker.process.kill();
      } catch (error) {
        this.log('error', `Failed to kill worker ${worker.id}: ${error}`);
      }
    }

    this.log('info', 'Quantum bridge shutdown complete');
    this.emit('shutdown');
  }

  /**
   * Internal logging
   */
  private log(level: string, message: string): void {
    const levels = ['debug', 'info', 'warn', 'error'];
    if (levels.indexOf(level) >= levels.indexOf(this.config.logLevel)) {
      this.emit('log', { level, message, timestamp: Date.now() });
    }
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

interface QuantumWorker {
  id: number;
  process: ChildProcess;
  busy: boolean;
  currentRequest: string | null;
  messageBuffer: string;
  stats: {
    requestsProcessed: number;
    totalLatency: number;
    errors: number;
  };
}

interface QueuedRequest {
  id: string;
  args: QuantumCommandArgs;
  timestamp: number;
  resolve: (result: QuantumResult) => void;
  reject: (error: Error) => void;
}

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: string;
  method: string;
  params: any;
}

interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface QuantumResult {
  success: boolean;
  operation: QuantumOperation;
  framework: 'qiskit' | 'pennylane';
  data: any;
  metadata: {
    executionTime: number;
    backend: string;
    qubits?: number;
    shots?: number;
    [key: string]: any;
  };
}

interface BridgeMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageLatency: number;
  poolUtilization: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Create a singleton quantum bridge instance
 */
let globalBridge: QuantumBridge | null = null;

export function getQuantumBridge(config?: Partial<QuantumBridgeConfig>): QuantumBridge {
  if (!globalBridge) {
    globalBridge = new QuantumBridge(config);
  }
  return globalBridge;
}

/**
 * Initialize quantum bridge (call once on startup)
 */
export async function initializeQuantumBridge(
  config?: Partial<QuantumBridgeConfig>
): Promise<QuantumBridge> {
  const bridge = getQuantumBridge(config);
  if (!bridge['poolReady']) {
    await bridge.initialize();
  }
  return bridge;
}
