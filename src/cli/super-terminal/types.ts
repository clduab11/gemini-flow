/**
 * Super-Terminal CLI Type Definitions
 *
 * Hybrid command architecture supporting:
 * - Structured commands (gemini-flow generate image --prompt "...")
 * - Natural language (> create a video about quantum computing)
 * - Streaming responses with real-time updates
 * - Error recovery and graceful degradation
 */

import { EventEmitter } from 'events';

// ============================================================================
// Command Router Types
// ============================================================================

export type CommandMode = 'structured' | 'natural' | 'hybrid';

export interface CommandContext {
  mode: CommandMode;
  sessionId: string;
  userId?: string;
  workspaceId?: string;
  metadata: Record<string, any>;
}

export interface CommandInput {
  raw: string;
  parsed?: ParsedCommand;
  context: CommandContext;
  timestamp: number;
}

export interface ParsedCommand {
  namespace: CommandNamespace;
  action: string;
  args: Record<string, any>;
  flags: Record<string, boolean | string | number>;
  confidence: number; // 0-1 for natural language parsing
}

export type CommandNamespace =
  | 'google-ai'      // Veo3, Imagen4, Lyria, Chirp, Co-Scientist, Mariner, AgentSpace
  | 'quantum'        // Qiskit, Pennylane circuits
  | 'swarm'          // Agent orchestration
  | 'performance'    // Metrics, monitoring
  | 'system'         // Config, health checks
  | 'workspace';     // Session management

// ============================================================================
// Command Handler Interface
// ============================================================================

export interface CommandHandler {
  namespace: CommandNamespace;
  action: string;
  description: string;
  schema: CommandSchema;

  /**
   * Execute the command with streaming support
   */
  execute(
    args: Record<string, any>,
    context: CommandContext
  ): Promise<CommandStream>;

  /**
   * Validate command arguments
   */
  validate(args: Record<string, any>): Promise<ValidationResult>;

  /**
   * Estimate execution time (for progress indicators)
   */
  estimateDuration?(args: Record<string, any>): number;
}

export interface CommandSchema {
  args: ArgumentDefinition[];
  flags: FlagDefinition[];
  examples: string[];
  naturalLanguagePatterns?: RegExp[];
}

export interface ArgumentDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'file' | 'json';
  required: boolean;
  description: string;
  default?: any;
  validation?: (value: any) => boolean;
}

export interface FlagDefinition {
  name: string;
  alias?: string;
  type: 'boolean' | 'string' | 'number';
  description: string;
  default?: any;
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

// ============================================================================
// Command Stream (for Real-time Output)
// ============================================================================

export class CommandStream extends EventEmitter {
  public readonly id: string;
  public status: StreamStatus;
  public progress: number; // 0-100
  public metadata: StreamMetadata;

  constructor(id: string) {
    super();
    this.id = id;
    this.status = 'initializing';
    this.progress = 0;
    this.metadata = {
      startTime: Date.now(),
      tokensProcessed: 0,
      bytesProcessed: 0,
    };
  }

  /**
   * Emit a chunk of output data
   */
  chunk(data: any, type: ChunkType = 'text'): void {
    this.emit('chunk', { data, type, timestamp: Date.now() });
  }

  /**
   * Update progress (0-100)
   */
  updateProgress(value: number): void {
    this.progress = Math.min(100, Math.max(0, value));
    this.emit('progress', this.progress);
  }

  /**
   * Complete the stream successfully
   */
  complete(result: any): void {
    this.status = 'completed';
    this.progress = 100;
    this.metadata.endTime = Date.now();
    this.emit('complete', result);
  }

  /**
   * Fail the stream with error
   */
  fail(error: Error): void {
    this.status = 'failed';
    this.metadata.endTime = Date.now();
    this.emit('error', error);
  }

  /**
   * Get stream duration in ms
   */
  getDuration(): number {
    const end = this.metadata.endTime || Date.now();
    return end - this.metadata.startTime;
  }
}

export type StreamStatus = 'initializing' | 'running' | 'paused' | 'completed' | 'failed';

export type ChunkType =
  | 'text'           // Plain text output
  | 'json'           // JSON data
  | 'image'          // Image URL or base64
  | 'video'          // Video URL or stream
  | 'audio'          // Audio URL or buffer
  | 'metric'         // Performance metric
  | 'log'            // Log message
  | 'error'          // Error message
  | 'agent-event';   // Agent lifecycle event

export interface StreamMetadata {
  startTime: number;
  endTime?: number;
  tokensProcessed: number;
  bytesProcessed: number;
  agentId?: string;
  modelId?: string;
  [key: string]: any;
}

// ============================================================================
// Natural Language Parser Interface
// ============================================================================

export interface NaturalLanguageParser {
  /**
   * Parse natural language input into structured command
   * Uses Google Co-Scientist for intent classification
   */
  parse(input: string, context: CommandContext): Promise<ParsedCommand>;

  /**
   * Get confidence score for a potential command match
   */
  getConfidence(input: string, command: CommandHandler): Promise<number>;

  /**
   * Extract entities from natural language
   */
  extractEntities(input: string): Promise<Record<string, any>>;
}

// ============================================================================
// Command Router
// ============================================================================

export interface CommandRouter {
  /**
   * Register a command handler
   */
  register(handler: CommandHandler): void;

  /**
   * Route input to appropriate handler
   */
  route(input: CommandInput): Promise<CommandStream>;

  /**
   * Get all registered commands in a namespace
   */
  getCommands(namespace?: CommandNamespace): CommandHandler[];

  /**
   * Get command suggestions for autocomplete
   */
  suggest(partial: string, context: CommandContext): Promise<CommandSuggestion[]>;
}

export interface CommandSuggestion {
  command: string;
  description: string;
  confidence: number;
  namespace: CommandNamespace;
}

// ============================================================================
// Error Recovery
// ============================================================================

export interface ErrorRecoveryStrategy {
  /**
   * Attempt to recover from command execution error
   */
  recover(error: CommandError, context: CommandContext): Promise<RecoveryResult>;

  /**
   * Suggest alternative commands on failure
   */
  suggestAlternatives(
    failedCommand: ParsedCommand,
    error: CommandError
  ): Promise<ParsedCommand[]>;
}

export class CommandError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public recoverable: boolean = true,
    public metadata?: Record<string, any>
  ) {
    super(message);
    this.name = 'CommandError';
  }
}

export type ErrorCode =
  | 'INVALID_SYNTAX'
  | 'MISSING_ARGS'
  | 'INVALID_ARGS'
  | 'AUTH_FAILED'
  | 'RATE_LIMITED'
  | 'TIMEOUT'
  | 'AGENT_SPAWN_FAILED'
  | 'SERVICE_UNAVAILABLE'
  | 'NETWORK_ERROR'
  | 'UNKNOWN';

export interface RecoveryResult {
  success: boolean;
  retryCommand?: ParsedCommand;
  fallbackResult?: any;
  message: string;
}

// ============================================================================
// Google AI Service Commands
// ============================================================================

export interface GoogleAICommandArgs {
  service: GoogleAIService;
  prompt: string;
  options?: GoogleAIServiceOptions;
}

export type GoogleAIService =
  | 'veo3'          // Video generation
  | 'imagen4'       // Image synthesis
  | 'lyria'         // Audio/music
  | 'chirp'         // Speech-to-text
  | 'co-scientist'  // Research
  | 'mariner'       // Web navigation
  | 'agentspace'    // Agent orchestration
  | 'streaming';    // Streaming inference

export interface GoogleAIServiceOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  streaming?: boolean;
  timeout?: number;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  [key: string]: any;
}

// ============================================================================
// Quantum Computing Commands
// ============================================================================

export interface QuantumCommandArgs {
  framework: 'qiskit' | 'pennylane';
  operation: QuantumOperation;
  config: QuantumConfig;
}

export type QuantumOperation =
  | 'circuit'       // Execute quantum circuit
  | 'ml'            // Quantum machine learning
  | 'simulate'      // Simulate quantum system
  | 'optimize';     // Quantum optimization

export interface QuantumConfig {
  circuitQASM?: string;      // QASM circuit definition
  numQubits?: number;
  shots?: number;
  backend?: 'simulator' | 'hardware';
  mlModel?: string;          // For quantum ML operations
  [key: string]: any;
}

// ============================================================================
// Swarm Orchestration Commands
// ============================================================================

export interface SwarmCommandArgs {
  operation: SwarmOperation;
  agentType?: string;
  config?: SwarmConfig;
}

export type SwarmOperation =
  | 'spawn'         // Spawn new agent
  | 'terminate'     // Terminate agent
  | 'list'          // List active agents
  | 'status'        // Get agent status
  | 'send'          // Send message to agent
  | 'broadcast';    // Broadcast to all agents

export interface SwarmConfig {
  agentId?: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  timeout?: number;
  resources?: {
    maxMemoryMB?: number;
    maxCPUPercentage?: number;
  };
  topology?: 'hierarchical' | 'mesh' | 'distributed' | 'layered';
  [key: string]: any;
}

// ============================================================================
// Performance Monitoring Commands
// ============================================================================

export interface PerformanceCommandArgs {
  metric: PerformanceMetric;
  duration?: number;  // Time window in ms
  agentId?: string;
}

export type PerformanceMetric =
  | 'latency'       // Agent spawn latency
  | 'throughput'    // Messages per second
  | 'capacity'      // Concurrent tasks
  | 'memory'        // Memory usage
  | 'cpu'           // CPU usage
  | 'network'       // Network I/O
  | 'sla';          // SLA compliance

export interface MetricResult {
  metric: PerformanceMetric;
  value: number;
  unit: string;
  timestamp: number;
  metadata?: Record<string, any>;
}
